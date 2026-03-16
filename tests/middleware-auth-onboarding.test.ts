import { describe, it, expect, beforeEach } from 'vitest';
import { hasValidBilling, isAdminEmail } from '@/lib/utils/admin';

// ═══════════════════════════════════════════════════════════════════════════════
// Helper time functions
// ═══════════════════════════════════════════════════════════════════════════════

const future = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const past = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
const futureSeconds = (seconds: number) =>
  new Date(Date.now() + seconds * 1000).toISOString();

// ═══════════════════════════════════════════════════════════════════════════════
// Mirror middleware route classification logic
// ═══════════════════════════════════════════════════════════════════════════════

const publicPrefixes = ['/auth/', '/r/', '/wall/'];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return publicPrefixes.some(prefix => pathname.startsWith(prefix));
}

const authOnlyPrefixes = ['/onboarding', '/subscribe'];

function isAuthOnlyRoute(pathname: string): boolean {
  return authOnlyPrefixes.some(prefix => pathname.startsWith(prefix));
}

function shouldBypassBilling(searchParams: string): boolean {
  const params = new URLSearchParams(searchParams);
  return params.get('billing') === 'success';
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mirror middleware decision tree
// ═══════════════════════════════════════════════════════════════════════════════

interface MiddlewareInput {
  pathname: string;
  searchParams?: string;
  user: { id: string; email: string } | null;
  member: { organization_id: string; organizations: { billing_plan: string; trial_ends_at: string | null; subscription_ends_at: string | null } | null } | null;
}

type MiddlewareResult =
  | { action: 'pass' }
  | { action: 'redirect'; to: string }
  | { action: 'pass'; billingSuccessHeader: true };

function simulateMiddleware(input: MiddlewareInput): MiddlewareResult {
  const { pathname, searchParams, user, member } = input;

  // Allow public routes and API routes
  if (isPublicRoute(pathname) || pathname.startsWith('/api/')) {
    return { action: 'pass' };
  }

  // Not logged in -> redirect to login
  if (!user) {
    return { action: 'redirect', to: '/auth/login' };
  }

  // Auth-only routes (onboarding, subscribe) — no billing check needed
  if (isAuthOnlyRoute(pathname)) {
    return { action: 'pass' };
  }

  // For dashboard routes, check org membership and billing
  if (pathname.startsWith('/dashboard')) {
    if (!member) {
      return { action: 'redirect', to: '/onboarding' };
    }

    const isBillingSuccess = shouldBypassBilling(searchParams ?? '');
    const org = member.organizations;
    if (org && !isBillingSuccess && !hasValidBilling(org.billing_plan, org.trial_ends_at, user.email, org.subscription_ends_at)) {
      return { action: 'redirect', to: `/subscribe?org=${member.organization_id}` };
    }

    if (isBillingSuccess) {
      return { action: 'pass', billingSuccessHeader: true };
    }
  }

  return { action: 'pass' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mirror auth confirm logic
// ═══════════════════════════════════════════════════════════════════════════════

interface AuthConfirmInput {
  code: string | null;
  next: string | null;
  exchangeSucceeds: boolean;
  user: { id: string } | null;
  member: { organization_id: string } | null;
}

function simulateAuthConfirm(input: AuthConfirmInput): { redirect: string } {
  const { code, next: rawNext, exchangeSucceeds, user, member } = input;

  // Sanitize next param — prevent open redirect
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//')
    ? rawNext
    : '/dashboard';

  if (code) {
    if (exchangeSucceeds) {
      if (user) {
        if (!member) {
          return { redirect: '/onboarding' };
        }
      }
      return { redirect: next };
    }
  }

  return { redirect: '/auth/error' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mirror onboarding create validation logic
// ═══════════════════════════════════════════════════════════════════════════════

interface OnboardingInput {
  user: { id: string; email: string } | null;
  body: { businessName?: string; slug?: string; phone?: string; googleUrl?: string; yelpUrl?: string; facebookUrl?: string };
  existingMember: boolean;
  orgInsertError: { message: string } | null;
  memberInsertError: { message: string } | null;
}

interface OnboardingResult {
  status: number;
  body: Record<string, unknown>;
  platformsInserted?: Array<{ platform: string; url: string; display_order: number }>;
  orgData?: Record<string, unknown>;
}

function simulateOnboardingCreate(input: OnboardingInput): OnboardingResult {
  const { user, body, existingMember, orgInsertError, memberInsertError } = input;

  if (!user) {
    return { status: 401, body: { error: 'Unauthorized' } };
  }

  const { businessName, slug } = body;

  if (!businessName || !slug) {
    return { status: 400, body: { error: 'Business name and slug are required' } };
  }

  if (existingMember) {
    return { status: 409, body: { error: 'You already have an organization' } };
  }

  // Simulate Stripe customer creation (always succeeds in this model)
  const customerId = 'cus_test_123';

  // Org creation
  const orgData = {
    name: businessName,
    slug,
    phone: body.phone || null,
    billing_plan: 'pending',
    trial_ends_at: null,
    stripe_customer_id: customerId,
  };

  if (orgInsertError) {
    if (orgInsertError.message.includes('duplicate') || orgInsertError.message.includes('unique')) {
      return { status: 409, body: { error: 'This slug is already taken. Please choose a different one.' } };
    }
    return { status: 500, body: { error: orgInsertError.message } };
  }

  const orgId = 'org_test_123';

  // Member insert
  if (memberInsertError) {
    return { status: 500, body: { error: memberInsertError.message } };
  }

  // Build platforms
  const platforms = [
    { platform: 'google', url: body.googleUrl },
    { platform: 'yelp', url: body.yelpUrl },
    { platform: 'facebook', url: body.facebookUrl },
  ].filter((p): p is { platform: string; url: string } => !!p.url?.trim());

  const platformsInserted = platforms.map((p, i) => ({
    platform: p.platform,
    url: p.url.trim(),
    display_order: i,
  }));

  return { status: 200, body: { orgId }, platformsInserted, orgData };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Middleware — full decision tree', () => {
  const validUser = { id: 'user-1', email: 'user@example.com' };
  const validMember = {
    organization_id: 'org-1',
    organizations: { billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null },
  };

  describe('API routes always pass through', () => {
    it('allows /api/reviews without auth', () => {
      const result = simulateMiddleware({ pathname: '/api/reviews', user: null, member: null });
      expect(result.action).toBe('pass');
    });

    it('allows /api/stripe/webhook without auth', () => {
      const result = simulateMiddleware({ pathname: '/api/stripe/webhook', user: null, member: null });
      expect(result.action).toBe('pass');
    });

    it('allows /api/sms/send with auth', () => {
      const result = simulateMiddleware({ pathname: '/api/sms/send', user: validUser, member: validMember });
      expect(result.action).toBe('pass');
    });

    it('allows deeply nested API routes', () => {
      const result = simulateMiddleware({ pathname: '/api/stripe/create-checkout', user: null, member: null });
      expect(result.action).toBe('pass');
    });
  });

  describe('public routes allow unauthenticated access', () => {
    it('allows landing page without auth', () => {
      const result = simulateMiddleware({ pathname: '/', user: null, member: null });
      expect(result.action).toBe('pass');
    });

    it('allows review form slug routes', () => {
      const result = simulateMiddleware({ pathname: '/r/some-business', user: null, member: null });
      expect(result.action).toBe('pass');
    });

    it('allows deeply nested auth routes', () => {
      const result = simulateMiddleware({ pathname: '/auth/login/callback', user: null, member: null });
      expect(result.action).toBe('pass');
    });
  });

  describe('unauthenticated users redirect to login', () => {
    it('redirects /dashboard to /auth/login', () => {
      const result = simulateMiddleware({ pathname: '/dashboard', user: null, member: null });
      expect(result).toEqual({ action: 'redirect', to: '/auth/login' });
    });

    it('redirects /dashboard/reviews to /auth/login', () => {
      const result = simulateMiddleware({ pathname: '/dashboard/reviews', user: null, member: null });
      expect(result).toEqual({ action: 'redirect', to: '/auth/login' });
    });

    it('redirects /onboarding to /auth/login when not authenticated', () => {
      const result = simulateMiddleware({ pathname: '/onboarding', user: null, member: null });
      expect(result).toEqual({ action: 'redirect', to: '/auth/login' });
    });

    it('redirects /subscribe to /auth/login when not authenticated', () => {
      const result = simulateMiddleware({ pathname: '/subscribe', user: null, member: null });
      expect(result).toEqual({ action: 'redirect', to: '/auth/login' });
    });
  });

  describe('auth-only routes (onboarding, subscribe) skip billing check', () => {
    it('allows authenticated user to access /onboarding', () => {
      const result = simulateMiddleware({ pathname: '/onboarding', user: validUser, member: null });
      expect(result.action).toBe('pass');
    });

    it('allows authenticated user to access /subscribe', () => {
      const result = simulateMiddleware({ pathname: '/subscribe', user: validUser, member: null });
      expect(result.action).toBe('pass');
    });

    it('allows /subscribe with query params', () => {
      const result = simulateMiddleware({ pathname: '/subscribe', searchParams: 'org=org-1', user: validUser, member: null });
      expect(result.action).toBe('pass');
    });

    it('allows /onboarding even with pending billing (no org check for auth-only)', () => {
      const result = simulateMiddleware({
        pathname: '/onboarding',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'pending', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result.action).toBe('pass');
    });
  });

  describe('dashboard — no org membership redirects to onboarding', () => {
    it('redirects to /onboarding when member is null', () => {
      const result = simulateMiddleware({ pathname: '/dashboard', user: validUser, member: null });
      expect(result).toEqual({ action: 'redirect', to: '/onboarding' });
    });

    it('redirects /dashboard/settings to /onboarding when no member', () => {
      const result = simulateMiddleware({ pathname: '/dashboard/settings', user: validUser, member: null });
      expect(result).toEqual({ action: 'redirect', to: '/onboarding' });
    });
  });

  describe('dashboard — invalid billing redirects to subscribe', () => {
    it('redirects pending billing to /subscribe', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'pending', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'redirect', to: '/subscribe?org=org-1' });
    });

    it('redirects cancelled billing to /subscribe', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'cancelled', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'redirect', to: '/subscribe?org=org-1' });
    });

    it('redirects expired trial to /subscribe', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'trial', trial_ends_at: past(1), subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'redirect', to: '/subscribe?org=org-1' });
    });

    it('redirects expired cancelling to /subscribe', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard/reviews',
        user: validUser,
        member: { organization_id: 'org-2', organizations: { billing_plan: 'cancelling', trial_ends_at: past(3), subscription_ends_at: past(1) } },
      });
      expect(result).toEqual({ action: 'redirect', to: '/subscribe?org=org-2' });
    });

    it('includes organization_id in subscribe redirect URL', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        user: validUser,
        member: { organization_id: 'my-org-uuid', organizations: { billing_plan: 'pending', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'redirect', to: '/subscribe?org=my-org-uuid' });
    });
  });

  describe('dashboard — valid billing passes through', () => {
    it('allows active billing', () => {
      const result = simulateMiddleware({ pathname: '/dashboard', user: validUser, member: validMember });
      expect(result.action).toBe('pass');
    });

    it('allows active trial with future expiry', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'trial', trial_ends_at: future(14), subscription_ends_at: null } },
      });
      expect(result.action).toBe('pass');
    });

    it('allows cancelling with future subscription end', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard/billing',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'cancelling', trial_ends_at: null, subscription_ends_at: future(15) } },
      });
      expect(result.action).toBe('pass');
    });
  });

  describe('dashboard — billing=success bypass', () => {
    it('bypasses billing check when billing=success param present', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        searchParams: 'billing=success',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'pending', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'pass', billingSuccessHeader: true });
    });

    it('does not bypass for billing=failed', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        searchParams: 'billing=failed',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'pending', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'redirect', to: '/subscribe?org=org-1' });
    });

    it('does not bypass for empty billing param', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        searchParams: 'billing=',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'pending', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'redirect', to: '/subscribe?org=org-1' });
    });

    it('does not bypass when billing param absent', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        searchParams: 'foo=bar',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'pending', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'redirect', to: '/subscribe?org=org-1' });
    });

    it('sets billingSuccessHeader when bypass is active', () => {
      const result = simulateMiddleware({
        pathname: '/dashboard',
        searchParams: 'billing=success',
        user: validUser,
        member: { organization_id: 'org-1', organizations: { billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null } },
      });
      expect(result).toEqual({ action: 'pass', billingSuccessHeader: true });
    });
  });

  describe('non-dashboard protected routes', () => {
    it('passes through unknown protected routes when authenticated', () => {
      const result = simulateMiddleware({ pathname: '/settings', user: validUser, member: null });
      expect(result.action).toBe('pass');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isPublicRoute — edge cases not covered by middleware.test.ts
// ═══════════════════════════════════════════════════════════════════════════════

describe('isPublicRoute — edge cases', () => {
  it('does not match /subscribe as public', () => {
    expect(isPublicRoute('/subscribe')).toBe(false);
  });

  it('does not match partial prefix /authentication', () => {
    // /authentication does NOT start with /auth/ (missing trailing slash context)
    // Actually /auth/ prefix: /authentication does not start with /auth/
    expect(isPublicRoute('/authentication')).toBe(false);
  });

  it('matches /auth/ with sub-sub paths', () => {
    expect(isPublicRoute('/auth/login/callback/extra')).toBe(true);
  });

  it('does not treat /r as public (needs /r/)', () => {
    expect(isPublicRoute('/r')).toBe(false);
  });

  it('does not treat /wall as public (needs /wall/)', () => {
    expect(isPublicRoute('/wall')).toBe(false);
  });

  it('does not match /reviews as public', () => {
    expect(isPublicRoute('/reviews')).toBe(false);
  });

  it('does not match empty string', () => {
    expect(isPublicRoute('')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isAuthOnlyRoute — edge cases
// ═══════════════════════════════════════════════════════════════════════════════

describe('isAuthOnlyRoute — edge cases', () => {
  it('matches /onboarding/step2 as auth-only', () => {
    expect(isAuthOnlyRoute('/onboarding/step2')).toBe(true);
  });

  it('matches /subscribe?org=123 path portion', () => {
    // URLSearchParams are separate; just the pathname
    expect(isAuthOnlyRoute('/subscribe')).toBe(true);
  });

  it('does not match /dashboard/onboarding', () => {
    expect(isAuthOnlyRoute('/dashboard/onboarding')).toBe(false);
  });

  it('does not match root /', () => {
    expect(isAuthOnlyRoute('/')).toBe(false);
  });

  it('does not match /auth/login', () => {
    expect(isAuthOnlyRoute('/auth/login')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Auth confirm — route logic
// ═══════════════════════════════════════════════════════════════════════════════

describe('Auth confirm — route handler logic', () => {
  describe('with valid code and successful exchange', () => {
    it('redirects to /onboarding when user has no org', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: null,
        exchangeSucceeds: true,
        user: { id: 'user-1' },
        member: null,
      });
      expect(result.redirect).toBe('/onboarding');
    });

    it('redirects to default /dashboard when user has org and no next param', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: null,
        exchangeSucceeds: true,
        user: { id: 'user-1' },
        member: { organization_id: 'org-1' },
      });
      expect(result.redirect).toBe('/dashboard');
    });

    it('redirects to custom next param when user has org', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: '/dashboard/reviews',
        exchangeSucceeds: true,
        user: { id: 'user-1' },
        member: { organization_id: 'org-1' },
      });
      expect(result.redirect).toBe('/dashboard/reviews');
    });

    it('redirects to /dashboard when next is empty string', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: '',
        exchangeSucceeds: true,
        user: { id: 'user-1' },
        member: { organization_id: 'org-1' },
      });
      expect(result.redirect).toBe('/dashboard');
    });
  });

  describe('open redirect prevention', () => {
    it('blocks absolute URL in next param', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: 'https://evil.com/steal',
        exchangeSucceeds: true,
        user: { id: 'user-1' },
        member: { organization_id: 'org-1' },
      });
      expect(result.redirect).toBe('/dashboard');
    });

    it('blocks protocol-relative URL (//) in next param', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: '//evil.com/steal',
        exchangeSucceeds: true,
        user: { id: 'user-1' },
        member: { organization_id: 'org-1' },
      });
      expect(result.redirect).toBe('/dashboard');
    });

    it('blocks next param not starting with /', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: 'evil.com/path',
        exchangeSucceeds: true,
        user: { id: 'user-1' },
        member: { organization_id: 'org-1' },
      });
      expect(result.redirect).toBe('/dashboard');
    });

    it('allows valid relative path /dashboard/settings', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: '/dashboard/settings',
        exchangeSucceeds: true,
        user: { id: 'user-1' },
        member: { organization_id: 'org-1' },
      });
      expect(result.redirect).toBe('/dashboard/settings');
    });
  });

  describe('without code', () => {
    it('redirects to /auth/error when code is null', () => {
      const result = simulateAuthConfirm({
        code: null,
        next: '/dashboard',
        exchangeSucceeds: false,
        user: null,
        member: null,
      });
      expect(result.redirect).toBe('/auth/error');
    });
  });

  describe('exchange fails', () => {
    it('redirects to /auth/error when exchange returns error', () => {
      const result = simulateAuthConfirm({
        code: 'invalid-code',
        next: null,
        exchangeSucceeds: false,
        user: null,
        member: null,
      });
      expect(result.redirect).toBe('/auth/error');
    });
  });

  describe('user is null after exchange', () => {
    it('redirects to default next when user is null but exchange succeeded', () => {
      const result = simulateAuthConfirm({
        code: 'valid-code',
        next: null,
        exchangeSucceeds: true,
        user: null,
        member: null,
      });
      // Exchange succeeded but getUser returned null — still goes to next (default /dashboard)
      expect(result.redirect).toBe('/dashboard');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Onboarding create — validation and logic
// ═══════════════════════════════════════════════════════════════════════════════

describe('Onboarding create — API route logic', () => {
  const validUser = { id: 'user-1', email: 'test@example.com' };

  describe('authentication', () => {
    it('returns 401 when no user', () => {
      const result = simulateOnboardingCreate({
        user: null,
        body: { businessName: 'Test', slug: 'test' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(401);
      expect(result.body.error).toBe('Unauthorized');
    });
  });

  describe('input validation', () => {
    it('returns 400 when businessName is missing', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { slug: 'test' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(400);
      expect(result.body.error).toBe('Business name and slug are required');
    });

    it('returns 400 when slug is missing', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(400);
    });

    it('returns 400 when both businessName and slug are missing', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: {},
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(400);
    });

    it('returns 400 when businessName is empty string', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: '', slug: 'test' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(400);
    });

    it('returns 400 when slug is empty string', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'Test', slug: '' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(400);
    });
  });

  describe('duplicate org prevention', () => {
    it('returns 409 when user already has an organization', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe' },
        existingMember: true,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(409);
      expect(result.body.error).toBe('You already have an organization');
    });
  });

  describe('successful creation', () => {
    it('creates org with billing_plan=pending and trial_ends_at=null', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(200);
      expect(result.orgData).toMatchObject({
        name: 'My Cafe',
        slug: 'my-cafe',
        billing_plan: 'pending',
        trial_ends_at: null,
      });
    });

    it('creates org with Stripe customer ID', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.orgData?.stripe_customer_id).toBeTruthy();
    });

    it('sets phone to null when not provided', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.orgData?.phone).toBeNull();
    });

    it('sets phone when provided', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe', phone: '+61400000000' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.orgData?.phone).toBe('+61400000000');
    });

    it('returns orgId on success', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.status).toBe(200);
      expect(result.body.orgId).toBeTruthy();
    });
  });

  describe('platform insertion', () => {
    it('inserts all three platforms when URLs provided', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: {
          businessName: 'My Cafe',
          slug: 'my-cafe',
          googleUrl: 'https://google.com/review/abc',
          yelpUrl: 'https://yelp.com/biz/abc',
          facebookUrl: 'https://facebook.com/abc/reviews',
        },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.platformsInserted).toHaveLength(3);
      expect(result.platformsInserted![0]).toMatchObject({ platform: 'google', display_order: 0 });
      expect(result.platformsInserted![1]).toMatchObject({ platform: 'yelp', display_order: 1 });
      expect(result.platformsInserted![2]).toMatchObject({ platform: 'facebook', display_order: 2 });
    });

    it('inserts only platforms with non-empty URLs', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: {
          businessName: 'My Cafe',
          slug: 'my-cafe',
          googleUrl: 'https://google.com/review/abc',
          yelpUrl: '',
          facebookUrl: undefined,
        },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.platformsInserted).toHaveLength(1);
      expect(result.platformsInserted![0].platform).toBe('google');
    });

    it('inserts no platforms when none provided', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.platformsInserted).toHaveLength(0);
    });

    it('trims whitespace from platform URLs', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: {
          businessName: 'My Cafe',
          slug: 'my-cafe',
          googleUrl: '  https://google.com/review/abc  ',
        },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.platformsInserted![0].url).toBe('https://google.com/review/abc');
    });

    it('filters out whitespace-only URLs', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: {
          businessName: 'My Cafe',
          slug: 'my-cafe',
          googleUrl: '   ',
          yelpUrl: 'https://yelp.com/biz/abc',
        },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: null,
      });
      expect(result.platformsInserted).toHaveLength(1);
      expect(result.platformsInserted![0].platform).toBe('yelp');
      // display_order should be 0 since it's the first surviving platform
      expect(result.platformsInserted![0].display_order).toBe(0);
    });
  });

  describe('error handling', () => {
    it('returns 409 for duplicate slug error', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'taken-slug' },
        existingMember: false,
        orgInsertError: { message: 'duplicate key value violates unique constraint' },
        memberInsertError: null,
      });
      expect(result.status).toBe(409);
      expect(result.body.error).toContain('slug is already taken');
    });

    it('returns 500 for other org insert errors', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe' },
        existingMember: false,
        orgInsertError: { message: 'connection timeout' },
        memberInsertError: null,
      });
      expect(result.status).toBe(500);
      expect(result.body.error).toBe('connection timeout');
    });

    it('returns 500 for member insert errors (would clean up org)', () => {
      const result = simulateOnboardingCreate({
        user: validUser,
        body: { businessName: 'My Cafe', slug: 'my-cafe' },
        existingMember: false,
        orgInsertError: null,
        memberInsertError: { message: 'foreign key violation' },
      });
      expect(result.status).toBe(500);
      expect(result.body.error).toBe('foreign key violation');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Subscribe page — edge cases beyond billing-flow.test.ts
// ═══════════════════════════════════════════════════════════════════════════════

describe('Subscribe page — edge cases', () => {
  function computeSubscribeState(
    billingPlan: string | null,
    trialEndsAt: string | null,
    subId: string | null,
  ) {
    const trialStillActive = trialEndsAt && new Date(trialEndsAt) > new Date();
    const hasActiveTrial = (billingPlan === 'trial' || billingPlan === 'cancelling') && trialStillActive;
    const hasActiveSub = billingPlan === 'active' && subId;

    if (hasActiveTrial || hasActiveSub) {
      return { redirect: '/dashboard' };
    }

    const isPending = billingPlan === 'pending';
    const isReturning = !isPending && billingPlan !== 'trial';

    return { redirect: null, isReturning, isPending };
  }

  describe('user with org but no billing plan', () => {
    it('treats null billing plan as non-pending, non-trial (returning)', () => {
      const result = computeSubscribeState(null, null, null);
      expect(result.redirect).toBeNull();
      expect(result.isReturning).toBe(true);
      expect(result.isPending).toBe(false);
    });

    it('treats empty string billing plan as returning', () => {
      const result = computeSubscribeState('', null, null);
      expect(result.redirect).toBeNull();
      expect(result.isReturning).toBe(true);
      expect(result.isPending).toBe(false);
    });
  });

  describe('boundary conditions', () => {
    it('does not redirect when trial just expired (past by seconds)', () => {
      const justPast = new Date(Date.now() - 1000).toISOString();
      const result = computeSubscribeState('trial', justPast, null);
      expect(result.redirect).toBeNull();
    });

    it('redirects when trial expires far in the future', () => {
      const result = computeSubscribeState('trial', future(365), null);
      expect(result.redirect).toBe('/dashboard');
    });

    it('does not redirect cancelling with expired trial', () => {
      const result = computeSubscribeState('cancelling', past(1), null);
      expect(result.redirect).toBeNull();
      expect(result.isReturning).toBe(true);
    });

    it('active plan without subscription ID does not redirect', () => {
      const result = computeSubscribeState('active', null, null);
      expect(result.redirect).toBeNull();
      expect(result.isReturning).toBe(true);
    });

    it('active plan with subscription ID redirects to dashboard', () => {
      const result = computeSubscribeState('active', null, 'sub_abc');
      expect(result.redirect).toBe('/dashboard');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// hasValidBilling — edge cases beyond existing tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('hasValidBilling — additional edge cases', () => {
  beforeEach(() => {
    process.env.ADMIN_EMAILS = 'admin1@test.com, admin2@test.com, admin3@test.com';
  });

  describe('exact boundary: trial expires at current moment', () => {
    it('blocks trial that expires right now (< comparison)', () => {
      // new Date(trialEndsAt) < new Date() — if exactly equal, < is false so it should pass
      // But in practice they'll differ by ms. Test with a date 1ms in the past.
      const justPast = new Date(Date.now() - 1).toISOString();
      expect(hasValidBilling('trial', justPast, 'user@test.com')).toBe(false);
    });

    it('allows trial that expires 1 second from now', () => {
      const justFuture = futureSeconds(1);
      expect(hasValidBilling('trial', justFuture, 'user@test.com')).toBe(true);
    });
  });

  describe('multiple admin emails in ADMIN_EMAILS env var', () => {
    it('recognizes first admin email', () => {
      expect(isAdminEmail('admin1@test.com')).toBe(true);
    });

    it('recognizes second admin email', () => {
      expect(isAdminEmail('admin2@test.com')).toBe(true);
    });

    it('recognizes third admin email', () => {
      expect(isAdminEmail('admin3@test.com')).toBe(true);
    });

    it('rejects non-admin email', () => {
      expect(isAdminEmail('notadmin@test.com')).toBe(false);
    });

    it('all admins bypass invalid billing', () => {
      expect(hasValidBilling('cancelled', null, 'admin1@test.com')).toBe(true);
      expect(hasValidBilling('cancelled', null, 'admin2@test.com')).toBe(true);
      expect(hasValidBilling('cancelled', null, 'admin3@test.com')).toBe(true);
    });
  });

  describe('admin email casing', () => {
    it('matches admin email with uppercase', () => {
      expect(isAdminEmail('ADMIN1@TEST.COM')).toBe(true);
    });

    it('matches admin email with mixed case', () => {
      expect(isAdminEmail('Admin2@Test.Com')).toBe(true);
    });

    it('hasValidBilling bypasses with mixed-case admin email', () => {
      expect(hasValidBilling('pending', null, 'ADMIN3@TEST.COM')).toBe(true);
    });
  });

  describe('ADMIN_EMAILS with extra whitespace', () => {
    it('handles whitespace around admin emails', () => {
      // The env var has spaces after commas: 'admin1@test.com, admin2@test.com, admin3@test.com'
      // getAdminEmails trims each entry
      expect(isAdminEmail('admin1@test.com')).toBe(true);
      expect(isAdminEmail('admin2@test.com')).toBe(true);
    });
  });

  describe('empty ADMIN_EMAILS', () => {
    it('returns false when ADMIN_EMAILS is empty', () => {
      process.env.ADMIN_EMAILS = '';
      expect(isAdminEmail('anyone@test.com')).toBe(false);
    });

    it('returns false when ADMIN_EMAILS is only commas', () => {
      process.env.ADMIN_EMAILS = ',,,';
      expect(isAdminEmail('anyone@test.com')).toBe(false);
    });
  });

  describe('cancelling plan boundary: subscription expires at current moment', () => {
    it('blocks cancelling with subscription_ends_at 1ms in the past', () => {
      const justPast = new Date(Date.now() - 1).toISOString();
      expect(hasValidBilling('cancelling', null, 'user@test.com', justPast)).toBe(false);
    });

    it('allows cancelling with subscription_ends_at 1 second in the future', () => {
      expect(hasValidBilling('cancelling', null, 'user@test.com', futureSeconds(1))).toBe(true);
    });
  });
});

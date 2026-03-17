import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════════
// Auth confirm route — OTP verification, code exchange, post-auth redirects
// ═══════════════════════════════════════════════════════════════════════════════

// Simulate the auth confirm route logic (mirrors app/auth/confirm/route.ts)

type EmailOtpType = 'signup' | 'magiclink' | 'recovery' | 'invite' | 'email';

interface AuthResult {
  error: { message: string } | null;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: Record<string, string>;
}

interface MemberRecord {
  id: string;
  organization_id: string;
  status: 'pending' | 'active';
  email: string | null;
  display_name: string | null;
}

interface ConfirmParams {
  token_hash: string | null;
  type: EmailOtpType | null;
  code: string | null;
  next: string | null;
}

interface ConfirmResult {
  redirect: string;
  memberUpdates?: Record<string, string>;
  verifyOtpCalled?: { type: EmailOtpType; token_hash: string };
  exchangeCodeCalled?: string;
}

function simulateAuthConfirm(
  params: ConfirmParams,
  verifyOtpResult: AuthResult | null,
  exchangeCodeResult: AuthResult | null,
  user: User | null,
  member: MemberRecord | null,
): ConfirmResult {
  const rawNext = params.next ?? '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  let authenticated = false;
  let verifyOtpCalled: ConfirmResult['verifyOtpCalled'];
  let exchangeCodeCalled: ConfirmResult['exchangeCodeCalled'];

  // Method 1: token_hash + type
  if (params.token_hash && params.type && verifyOtpResult) {
    verifyOtpCalled = { type: params.type, token_hash: params.token_hash };
    if (!verifyOtpResult.error) {
      authenticated = true;
    }
  }

  // Method 2: PKCE code exchange (only if method 1 didn't succeed)
  if (!authenticated && params.code && exchangeCodeResult) {
    exchangeCodeCalled = params.code;
    if (!exchangeCodeResult.error) {
      authenticated = true;
    }
  }

  // No valid auth method → error
  if (!authenticated) {
    return { redirect: '/auth/error', verifyOtpCalled, exchangeCodeCalled };
  }

  // Post-auth: redirectAfterAuth logic
  if (!user) {
    return { redirect: next, verifyOtpCalled, exchangeCodeCalled };
  }

  if (!member) {
    return { redirect: '/onboarding', verifyOtpCalled, exchangeCodeCalled };
  }

  // Build updates for pending members and missing fields
  const updates: Record<string, string> = {};
  if (member.status === 'pending') {
    updates.status = 'active';
  }
  if (!member.email && user.email) {
    updates.email = user.email;
  }
  if (!member.display_name) {
    const name = user.user_metadata?.full_name || user.user_metadata?.name || null;
    if (name) updates.display_name = name;
  }

  return {
    redirect: next,
    memberUpdates: Object.keys(updates).length > 0 ? updates : undefined,
    verifyOtpCalled,
    exchangeCodeCalled,
  };
}

describe('Auth confirm — token_hash + type verification', () => {
  it('redirects to /dashboard on valid OTP verification', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc123', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'test@example.com' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'test@example.com', display_name: 'Test' },
    );
    expect(result.redirect).toBe('/dashboard');
    expect(result.verifyOtpCalled).toEqual({ type: 'magiclink', token_hash: 'abc123' });
  });

  it('calls verifyOtp with correct type and token_hash', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'hash-xyz', type: 'signup', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: null, display_name: null },
    );
    expect(result.verifyOtpCalled).toEqual({ type: 'signup', token_hash: 'hash-xyz' });
  });

  it('respects custom next parameter', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: '/dashboard/reviews' },
      { error: null },
      null,
      { id: 'user-1' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'a@b.com', display_name: 'A' },
    );
    expect(result.redirect).toBe('/dashboard/reviews');
  });

  it('sanitizes next parameter that starts with //', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: '//evil.com' },
      { error: null },
      null,
      { id: 'user-1' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'a@b.com', display_name: 'A' },
    );
    expect(result.redirect).toBe('/dashboard');
  });

  it('sanitizes next parameter that does not start with /', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: 'https://evil.com' },
      { error: null },
      null,
      { id: 'user-1' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'a@b.com', display_name: 'A' },
    );
    expect(result.redirect).toBe('/dashboard');
  });
});

describe('Auth confirm — PKCE code exchange', () => {
  it('redirects to /dashboard on valid code exchange', () => {
    const result = simulateAuthConfirm(
      { token_hash: null, type: null, code: 'pkce-code-abc', next: null },
      null,
      { error: null },
      { id: 'user-1', email: 'test@example.com' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'test@example.com', display_name: 'Test' },
    );
    expect(result.redirect).toBe('/dashboard');
    expect(result.exchangeCodeCalled).toBe('pkce-code-abc');
  });

  it('falls back to code exchange when OTP verification fails', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'bad-hash', type: 'magiclink', code: 'good-code', next: null },
      { error: { message: 'Invalid token' } },
      { error: null },
      { id: 'user-1' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'a@b.com', display_name: 'A' },
    );
    expect(result.redirect).toBe('/dashboard');
    expect(result.verifyOtpCalled).toBeDefined();
    expect(result.exchangeCodeCalled).toBe('good-code');
  });
});

describe('Auth confirm — error redirect', () => {
  it('redirects to /auth/error when no token_hash and no code', () => {
    const result = simulateAuthConfirm(
      { token_hash: null, type: null, code: null, next: null },
      null,
      null,
      null,
      null,
    );
    expect(result.redirect).toBe('/auth/error');
  });

  it('redirects to /auth/error when OTP fails and no code', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'bad', type: 'magiclink', code: null, next: null },
      { error: { message: 'Token expired' } },
      null,
      null,
      null,
    );
    expect(result.redirect).toBe('/auth/error');
  });

  it('redirects to /auth/error when both OTP and code exchange fail', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'bad', type: 'magiclink', code: 'bad-code', next: null },
      { error: { message: 'Invalid token' } },
      { error: { message: 'Invalid code' } },
      null,
      null,
    );
    expect(result.redirect).toBe('/auth/error');
  });
});

describe('Auth confirm — pending member activation', () => {
  it('activates pending members (status: pending → active)', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'staff@example.com' },
      { id: 'm-1', organization_id: 'org-1', status: 'pending', email: 'staff@example.com', display_name: 'Staff' },
    );
    expect(result.memberUpdates).toBeDefined();
    expect(result.memberUpdates!.status).toBe('active');
  });

  it('does not set status update when member is already active', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'owner@example.com' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'owner@example.com', display_name: 'Owner' },
    );
    expect(result.memberUpdates).toBeUndefined();
  });
});

describe('Auth confirm — backfill email and display_name', () => {
  it('backfills email from user when member email is null', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'newuser@example.com' },
      { id: 'm-1', organization_id: 'org-1', status: 'pending', email: null, display_name: null },
    );
    expect(result.memberUpdates!.email).toBe('newuser@example.com');
  });

  it('does not overwrite existing member email', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'different@example.com' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'original@example.com', display_name: 'Name' },
    );
    expect(result.memberUpdates).toBeUndefined();
  });

  it('backfills display_name from user_metadata.full_name', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'a@b.com', user_metadata: { full_name: 'Jane Doe' } },
      { id: 'm-1', organization_id: 'org-1', status: 'pending', email: 'a@b.com', display_name: null },
    );
    expect(result.memberUpdates!.display_name).toBe('Jane Doe');
  });

  it('backfills display_name from user_metadata.name as fallback', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'a@b.com', user_metadata: { name: 'John' } },
      { id: 'm-1', organization_id: 'org-1', status: 'pending', email: 'a@b.com', display_name: null },
    );
    expect(result.memberUpdates!.display_name).toBe('John');
  });

  it('does not overwrite existing display_name', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', user_metadata: { full_name: 'New Name' } },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'a@b.com', display_name: 'Existing Name' },
    );
    expect(result.memberUpdates).toBeUndefined();
  });

  it('does not set display_name when no metadata available', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'a@b.com' },
      { id: 'm-1', organization_id: 'org-1', status: 'pending', email: 'a@b.com', display_name: null },
    );
    // Should only have status update, no display_name
    expect(result.memberUpdates!.display_name).toBeUndefined();
    expect(result.memberUpdates!.status).toBe('active');
  });
});

describe('Auth confirm — redirect to /onboarding if no org', () => {
  it('redirects to /onboarding when user has no member record', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1', email: 'newowner@example.com' },
      null, // no member record
    );
    expect(result.redirect).toBe('/onboarding');
  });

  it('does not redirect to /onboarding when member exists', () => {
    const result = simulateAuthConfirm(
      { token_hash: 'abc', type: 'magiclink', code: null, next: null },
      { error: null },
      null,
      { id: 'user-1' },
      { id: 'm-1', organization_id: 'org-1', status: 'active', email: 'a@b.com', display_name: 'A' },
    );
    expect(result.redirect).not.toBe('/onboarding');
    expect(result.redirect).toBe('/dashboard');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Middleware — auth redirect, public/protected route enforcement
// ═══════════════════════════════════════════════════════════════════════════════

// Mirror the middleware logic for unit testing
const publicPrefixes = ['/auth/', '/r/', '/wall/'];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return publicPrefixes.some(prefix => pathname.startsWith(prefix));
}

const authOnlyPrefixes = ['/onboarding', '/subscribe'];

function isAuthOnlyRoute(pathname: string): boolean {
  return authOnlyPrefixes.some(prefix => pathname.startsWith(prefix));
}

interface MiddlewareResult {
  action: 'next' | 'redirect';
  redirectTo?: string;
  headers?: Record<string, string>;
}

function simulateMiddleware(
  pathname: string,
  searchParams: Record<string, string>,
  user: { id: string; email?: string } | null,
): MiddlewareResult {
  // Root with ?code → redirect to /auth/confirm
  if (pathname === '/' && searchParams.code) {
    return {
      action: 'redirect',
      redirectTo: `/auth/confirm?code=${searchParams.code}`,
    };
  }

  // Public routes and API routes pass through
  if (isPublicRoute(pathname) || pathname.startsWith('/api/')) {
    return { action: 'next' };
  }

  // Not logged in → redirect to login
  if (!user) {
    return { action: 'redirect', redirectTo: '/auth/login' };
  }

  // Logged in but on auth pages (except /auth/confirm and /auth/error) → dashboard
  if (
    pathname.startsWith('/auth/') &&
    !pathname.startsWith('/auth/confirm') &&
    !pathname.startsWith('/auth/error')
  ) {
    return { action: 'redirect', redirectTo: '/dashboard' };
  }

  // Auth-only routes pass through
  if (isAuthOnlyRoute(pathname)) {
    return { action: 'next' };
  }

  // All other routes: set x-pathname header
  return { action: 'next', headers: { 'x-pathname': pathname } };
}

describe('Middleware — unauthenticated user redirect', () => {
  it('redirects unauthenticated users to /auth/login on /dashboard', () => {
    const result = simulateMiddleware('/dashboard', {}, null);
    expect(result.action).toBe('redirect');
    expect(result.redirectTo).toBe('/auth/login');
  });

  it('redirects unauthenticated users to /auth/login on /dashboard/reviews', () => {
    const result = simulateMiddleware('/dashboard/reviews', {}, null);
    expect(result.action).toBe('redirect');
    expect(result.redirectTo).toBe('/auth/login');
  });

  it('redirects unauthenticated users to /auth/login on /onboarding', () => {
    const result = simulateMiddleware('/onboarding', {}, null);
    expect(result.action).toBe('redirect');
    expect(result.redirectTo).toBe('/auth/login');
  });

  it('does not redirect unauthenticated users on public routes', () => {
    expect(simulateMiddleware('/', {}, null).action).toBe('next');
    expect(simulateMiddleware('/auth/login', {}, null).action).toBe('next');
    expect(simulateMiddleware('/r/some-business', {}, null).action).toBe('next');
    expect(simulateMiddleware('/wall/some-business', {}, null).action).toBe('next');
  });
});

describe('Middleware — /auth/confirm passthrough', () => {
  it('allows /auth/confirm through when user is logged in', () => {
    const result = simulateMiddleware('/auth/confirm', {}, { id: 'u-1' });
    // Should NOT redirect to /dashboard — /auth/confirm is excluded from the auth redirect
    expect(result.redirectTo).not.toBe('/dashboard');
  });

  it('allows /auth/confirm with query params when logged in', () => {
    const result = simulateMiddleware('/auth/confirm', { token_hash: 'abc', type: 'magiclink' }, { id: 'u-1' });
    expect(result.redirectTo).not.toBe('/dashboard');
  });
});

describe('Middleware — /auth/error passthrough', () => {
  it('allows /auth/error through when user is logged in', () => {
    const result = simulateMiddleware('/auth/error', {}, { id: 'u-1' });
    expect(result.redirectTo).not.toBe('/dashboard');
  });
});

describe('Middleware — logged in on auth pages', () => {
  // Note: In the real middleware, /auth/* routes are matched as public routes first
  // (line 55-57), so they pass through before the "logged in on auth pages" check
  // on line 68 is reached. This means /auth/login passes through for logged-in users
  // as a public route. The auth-page redirect (line 68) only applies if a future
  // /auth/* sub-route is removed from the public prefix list.

  it('allows /auth/login through as a public route even when logged in', () => {
    const result = simulateMiddleware('/auth/login', {}, { id: 'u-1' });
    expect(result.action).toBe('next');
  });

  it('allows /auth/login?mode=signup through as a public route even when logged in', () => {
    const result = simulateMiddleware('/auth/login', { mode: 'signup' }, { id: 'u-1' });
    expect(result.action).toBe('next');
  });
});

describe('Middleware — root with ?code redirect', () => {
  it('redirects /?code=xxx to /auth/confirm?code=xxx', () => {
    const result = simulateMiddleware('/', { code: 'my-pkce-code' }, null);
    expect(result.action).toBe('redirect');
    expect(result.redirectTo).toBe('/auth/confirm?code=my-pkce-code');
  });

  it('redirects /?code=xxx even when user is logged in', () => {
    const result = simulateMiddleware('/', { code: 'abc123' }, { id: 'u-1' });
    expect(result.action).toBe('redirect');
    expect(result.redirectTo).toBe('/auth/confirm?code=abc123');
  });

  it('does not redirect root without code param', () => {
    const result = simulateMiddleware('/', {}, null);
    expect(result.action).toBe('next');
  });
});

describe('Middleware — x-pathname header', () => {
  it('passes x-pathname header for dashboard routes', () => {
    const result = simulateMiddleware('/dashboard', {}, { id: 'u-1' });
    expect(result.headers?.['x-pathname']).toBe('/dashboard');
  });

  it('passes x-pathname header for nested dashboard routes', () => {
    const result = simulateMiddleware('/dashboard/settings', {}, { id: 'u-1' });
    expect(result.headers?.['x-pathname']).toBe('/dashboard/settings');
  });

  it('does not set x-pathname on public routes (passes through before header set)', () => {
    const result = simulateMiddleware('/', {}, null);
    expect(result.headers).toBeUndefined();
  });
});

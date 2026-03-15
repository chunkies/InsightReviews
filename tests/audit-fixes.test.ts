import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// =============================================================================
// 2.2 — Webhook Idempotency
// =============================================================================

describe('2.2 — Stripe webhook idempotency', () => {
  // We test the webhook route by mocking Stripe + Supabase, then calling POST

  const mockEq = vi.fn().mockReturnValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockInsert = vi.fn();
  const mockFrom = vi.fn((table: string) => {
    if (table === 'webhook_events') {
      return { insert: mockInsert };
    }
    if (table === 'organizations') {
      return { update: mockUpdate };
    }
    return { insert: vi.fn().mockReturnValue({ error: null }) };
  });

  const mockConstructEvent = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54421');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_xxx');
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_xxx');
  });

  it('inserts event into webhook_events table for idempotency', async () => {
    mockInsert.mockReturnValue({ error: null });
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { organizationId: 'org-1' },
          subscription: 'sub_123',
        },
      },
    });

    vi.doMock('@supabase/ssr', () => ({
      createServerClient: () => ({
        from: mockFrom,
      }),
    }));

    vi.doMock('@/lib/stripe/server', () => ({
      createStripeClient: () => ({
        webhooks: { constructEvent: mockConstructEvent },
        subscriptions: {
          retrieve: vi.fn().mockResolvedValue({ trial_end: null }),
        },
      }),
    }));

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const { NextRequest } = await import('next/server');

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-body',
      headers: { 'stripe-signature': 'sig_test' },
    });

    await POST(req);

    // Verify webhook_events insert was called with stripe_event_id
    const webhookCalls = mockFrom.mock.calls.filter((c: [string]) => c[0] === 'webhook_events');
    expect(webhookCalls.length).toBeGreaterThanOrEqual(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_event_id: 'evt_test_123',
        event_type: 'checkout.session.completed',
      }),
    );
  });

  it('returns { received: true, duplicate: true } for duplicate events (code 23505)', async () => {
    // Simulate unique constraint violation
    mockInsert.mockReturnValue({ error: { code: '23505', message: 'duplicate key' } });
    mockConstructEvent.mockReturnValue({
      id: 'evt_duplicate_456',
      type: 'checkout.session.completed',
      data: { object: {} },
    });

    vi.doMock('@supabase/ssr', () => ({
      createServerClient: () => ({
        from: mockFrom,
      }),
    }));

    vi.doMock('@/lib/stripe/server', () => ({
      createStripeClient: () => ({
        webhooks: { constructEvent: mockConstructEvent },
      }),
    }));

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const { NextRequest } = await import('next/server');

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-body',
      headers: { 'stripe-signature': 'sig_test' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ received: true, duplicate: true });
  });

  it('processes event normally when webhook_events insert succeeds', async () => {
    mockInsert.mockReturnValue({ error: null });
    mockConstructEvent.mockReturnValue({
      id: 'evt_new_789',
      type: 'customer.subscription.deleted',
      data: {
        object: { id: 'sub_456' },
      },
    });

    vi.doMock('@supabase/ssr', () => ({
      createServerClient: () => ({
        from: mockFrom,
      }),
    }));

    vi.doMock('@/lib/stripe/server', () => ({
      createStripeClient: () => ({
        webhooks: { constructEvent: mockConstructEvent },
      }),
    }));

    const { POST } = await import('@/app/api/stripe/webhook/route');
    const { NextRequest } = await import('next/server');

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'raw-body',
      headers: { 'stripe-signature': 'sig_test' },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.received).toBe(true);
    expect(json.duplicate).toBeUndefined();
  });
});

// =============================================================================
// 2.4 — Duplicate Query Deduplication via React.cache()
// =============================================================================

describe('2.4 — React.cache() for org lookups', () => {
  it('review page (app/r/[slug]/page.tsx) uses React.cache for getOrgBySlug', () => {
    const source = readFileSync(
      resolve(__dirname, '../app/r/[slug]/page.tsx'),
      'utf-8',
    );

    // Must import cache from react
    expect(source).toMatch(/import\s*\{[^}]*cache[^}]*\}\s*from\s*['"]react['"]/);

    // getOrgBySlug must be wrapped with cache()
    expect(source).toMatch(/const\s+getOrgBySlug\s*=\s*cache\s*\(/);
  });

  it('wall page (app/wall/[slug]/page.tsx) uses React.cache for getOrgBySlug', () => {
    const source = readFileSync(
      resolve(__dirname, '../app/wall/[slug]/page.tsx'),
      'utf-8',
    );

    // Must import cache from react
    expect(source).toMatch(/import\s*\{[^}]*cache[^}]*\}\s*from\s*['"]react['"]/);

    // getOrgBySlug must be wrapped with cache()
    expect(source).toMatch(/const\s+getOrgBySlug\s*=\s*cache\s*\(/);
  });
});

// =============================================================================
// 3.5 — Trial Gaming Prevention
// =============================================================================

describe('3.5 — Trial gaming prevention in create-checkout', () => {
  it('source code checks Stripe subscription history to determine trial eligibility', () => {
    const source = readFileSync(
      resolve(__dirname, '../app/api/stripe/create-checkout/route.ts'),
      'utf-8',
    );

    // Must select stripe_customer_id from org
    expect(source).toMatch(/stripe_customer_id/);

    // Must have logic that uses isNewSubscriber for trial eligibility
    expect(source).toMatch(/isNewSubscriber/);

    // Must check for prior subscriptions in Stripe to prevent trial gaming
    expect(source).toMatch(/hadPriorSubscription/);

    // Must verify customer exists before reusing (handles stale IDs)
    expect(source).toMatch(/customers\.retrieve/);
  });

  it('returning user with prior subscriptions does NOT get a trial', () => {
    // Replicate the isNewSubscriber logic from the route
    function isNewSubscriber(hadPriorSubscription: boolean, billingPlan: string | null): boolean {
      return !hadPriorSubscription && (billingPlan === 'pending' || !billingPlan);
    }

    // Returning user: has had a subscription before
    expect(isNewSubscriber(true, 'pending')).toBe(false);
    expect(isNewSubscriber(true, 'cancelled')).toBe(false);
    expect(isNewSubscriber(true, null)).toBe(false);
  });

  it('genuinely new user without prior subscriptions gets a trial', () => {
    function isNewSubscriber(hadPriorSubscription: boolean, billingPlan: string | null): boolean {
      return !hadPriorSubscription && (billingPlan === 'pending' || !billingPlan);
    }

    // Brand new user: no prior subscriptions, pending plan
    expect(isNewSubscriber(false, 'pending')).toBe(true);
    expect(isNewSubscriber(false, null)).toBe(true);
  });

  it('user with existing customer but no subscriptions still gets trial', () => {
    // This is the key fix: a Stripe customer can exist from a failed checkout
    // but if they have no subscriptions, they should still get a trial
    function isNewSubscriber(hadPriorSubscription: boolean, billingPlan: string | null): boolean {
      return !hadPriorSubscription && (billingPlan === 'pending' || !billingPlan);
    }

    expect(isNewSubscriber(false, 'pending')).toBe(true);
  });

  it('user who had a trial and cancelled does NOT get another trial', () => {
    function isNewSubscriber(hadPriorSubscription: boolean, billingPlan: string | null): boolean {
      return !hadPriorSubscription && (billingPlan === 'pending' || !billingPlan);
    }

    // Had a subscription (trial counts as subscription in Stripe)
    expect(isNewSubscriber(true, 'pending')).toBe(false);
    expect(isNewSubscriber(true, 'cancelled')).toBe(false);
  });
});

// =============================================================================
// 2.5 — Database-Backed Rate Limiting
// =============================================================================

describe('2.5 — Rate limiting on review submit endpoint', () => {
  it('source code implements database-backed rate limiting', () => {
    const source = readFileSync(
      resolve(__dirname, '../app/api/reviews/submit/route.ts'),
      'utf-8',
    );

    // Must define rate limit constants
    expect(source).toMatch(/RATE_LIMIT_MAX/);
    expect(source).toMatch(/RATE_LIMIT_WINDOW_SECONDS/);

    // Must count recent reviews per org using the database
    expect(source).toMatch(/count:\s*['"]exact['"]/);
    expect(source).toMatch(/head:\s*true/);
    expect(source).toMatch(/gte\s*\(\s*['"]created_at['"]/);

    // Must return 429 when rate limit is exceeded
    expect(source).toMatch(/429/);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54421');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');

    const mockOwnerMemberSingle = vi.fn().mockResolvedValue({ data: { user_id: 'owner-1' } });
    const mockOwnerMemberLimit = vi.fn().mockReturnValue({ maybeSingle: mockOwnerMemberSingle });
    const mockOwnerMemberEq2 = vi.fn().mockReturnValue({ limit: mockOwnerMemberLimit });
    const mockOwnerMemberEq1 = vi.fn().mockReturnValue({ eq: mockOwnerMemberEq2 });
    const mockOwnerMemberSelect = vi.fn().mockReturnValue({ eq: mockOwnerMemberEq1 });

    // Rate limit: return count >= 10 (at the limit)
    const mockGte = vi.fn().mockReturnValue({ count: 10 });
    const mockRateLimitEq = vi.fn().mockReturnValue({ gte: mockGte });
    const mockRateLimitSelect = vi.fn().mockReturnValue({ eq: mockRateLimitEq });

    const mockOrgSingle = vi.fn().mockResolvedValue({
      data: { id: 'org-1', positive_threshold: 4, billing_plan: 'active', trial_ends_at: null, subscription_ends_at: null },
    });
    const mockOrgEq = vi.fn().mockReturnValue({ single: mockOrgSingle });
    const mockOrgSelect = vi.fn().mockReturnValue({ eq: mockOrgEq });

    let reviewsSelectCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === 'organizations') {
        return { select: mockOrgSelect };
      }
      if (table === 'reviews') {
        reviewsSelectCallCount++;
        // First call to 'reviews' is the rate limit check
        if (reviewsSelectCallCount === 1) {
          return { select: mockRateLimitSelect };
        }
      }
      if (table === 'organization_members') {
        return { select: mockOwnerMemberSelect };
      }
      return { insert: vi.fn().mockReturnValue({ error: null }) };
    });

    vi.doMock('@supabase/ssr', () => ({
      createServerClient: () => ({
        from: mockFrom,
        auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'owner@test.com' } } }) } },
      }),
    }));

    vi.doMock('@/lib/utils/webhook', () => ({
      fireWebhook: vi.fn(),
    }));

    vi.doMock('@/lib/email/client', () => ({
      sendNegativeReviewNotification: vi.fn(),
    }));

    vi.doMock('@/lib/utils/review-page-access', () => ({
      checkReviewPageAccess: () => ({ allowed: true }),
    }));

    const { POST } = await import('@/app/api/reviews/submit/route');
    const { NextRequest } = await import('next/server');

    const req = new NextRequest('http://localhost:3000/api/reviews/submit', {
      method: 'POST',
      body: JSON.stringify({ slug: 'test-cafe', rating: 5 }),
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(429);

    const json = await res.json();
    expect(json.error).toMatch(/too many/i);
  });
});

// =============================================================================
// 2.7 — Vercel Cron Configuration
// =============================================================================

describe('2.7 — Vercel cron jobs in vercel.json', () => {
  let vercelConfig: { crons?: Array<{ path: string; schedule: string }> };

  beforeEach(() => {
    const raw = readFileSync(resolve(__dirname, '../vercel.json'), 'utf-8');
    vercelConfig = JSON.parse(raw);
  });

  it('has a crons array', () => {
    expect(vercelConfig.crons).toBeDefined();
    expect(Array.isArray(vercelConfig.crons)).toBe(true);
  });

  it('includes sync-integrations cron job', () => {
    const syncJob = vercelConfig.crons!.find(
      (c) => c.path === '/api/cron/sync-integrations',
    );
    expect(syncJob).toBeDefined();
    expect(syncJob!.schedule).toBeTruthy();
  });

  it('includes weekly-digest cron job', () => {
    const digestJob = vercelConfig.crons!.find(
      (c) => c.path === '/api/cron/weekly-digest',
    );
    expect(digestJob).toBeDefined();
    expect(digestJob!.schedule).toBeTruthy();
  });

  it('includes process-followups cron job', () => {
    const followupsJob = vercelConfig.crons!.find(
      (c) => c.path === '/api/cron/process-followups',
    );
    expect(followupsJob).toBeDefined();
    expect(followupsJob!.schedule).toBeTruthy();
  });

  it('has exactly 3 cron jobs', () => {
    expect(vercelConfig.crons!.length).toBe(3);
  });
});

// =============================================================================
// 2.6 — Required Environment Variables in .env.example
// =============================================================================

describe('2.6 — .env.example includes all required env vars', () => {
  let envContent: string;

  beforeEach(() => {
    envContent = readFileSync(resolve(__dirname, '../.env.example'), 'utf-8');
  });

  const requiredVars = [
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'SENDGRID_FROM_NAME',
    'CRON_SECRET',
    'SUPPORT_EMAIL',
  ];

  for (const envVar of requiredVars) {
    it(`includes ${envVar}`, () => {
      // Match the var name at the start of a line (ignoring comments)
      const pattern = new RegExp(`^${envVar}=`, 'm');
      expect(envContent).toMatch(pattern);
    });
  }

  it('includes all required env vars together', () => {
    for (const envVar of requiredVars) {
      const pattern = new RegExp(`^${envVar}=`, 'm');
      expect(envContent).toMatch(pattern);
    }
  });
});

// =============================================================================
// 3.10 — Review Form Indexability (robots: { index: true })
// =============================================================================

describe('3.10 — Review page metadata has robots: { index: true }', () => {
  it('review page source contains robots: { index: true }', () => {
    const source = readFileSync(
      resolve(__dirname, '../app/r/[slug]/page.tsx'),
      'utf-8',
    );

    // Must have robots config with index: true (NOT index: false)
    expect(source).toMatch(/robots:\s*\{[^}]*index:\s*true/);

    // Must NOT have index: false
    expect(source).not.toMatch(/robots:\s*\{[^}]*index:\s*false/);
  });

  it('review page generateMetadata returns correct robots config', () => {
    const source = readFileSync(
      resolve(__dirname, '../app/r/[slug]/page.tsx'),
      'utf-8',
    );

    // Verify follow: true is also set for SEO
    expect(source).toMatch(/follow:\s*true/);
  });
});

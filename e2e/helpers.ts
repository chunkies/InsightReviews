import { type Page, expect } from '@playwright/test';

/**
 * Shared helpers for E2E tests.
 *
 * Most tests use Supabase service-role API calls to set up state directly
 * rather than going through the UI, keeping tests fast and deterministic.
 */

// ── Supabase helpers ──────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface SupabaseResponse<T = unknown> {
  data: T | null;
  error: { message: string } | null;
}

/** Low-level REST call to Supabase PostgREST API. */
export async function supabaseRest<T = unknown>(
  table: string,
  options: {
    method?: string;
    body?: unknown;
    query?: string;
    headers?: Record<string, string>;
    prefer?: string;
  } = {},
): Promise<SupabaseResponse<T>> {
  const { method = 'GET', body, query = '', headers = {}, prefer } = options;
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? `?${query}` : ''}`;

  const reqHeaders: Record<string, string> = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...headers,
  };
  if (prefer) reqHeaders.Prefer = prefer;

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    return { data: null, error: { message: `${res.status}: ${text}` } };
  }

  // DELETE and some POSTs may return 204 or empty body
  if (res.status === 204) return { data: null, error: null };

  const text = await res.text();
  if (!text) return { data: null, error: null };

  const data = JSON.parse(text) as T;
  return { data, error: null };
}

/** Create a Supabase auth user via the admin API and return the user object. */
export async function createTestUser(email: string, password: string = 'testpassword123') {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: 'E2E Test User' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create test user ${email}: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/** Sign in via password and set session cookies on the page. */
export async function signInAsUser(page: Page, email: string, password: string = 'testpassword123') {
  // Get a session token via password login
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Sign-in failed for ${email}: ${res.status} ${await res.text()}`);
  }

  const session = await res.json();
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  // Set session cookies via the browser context
  // Supabase SSR stores tokens in cookies with a specific naming convention
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  await page.context().addCookies([
    {
      name: cookieName,
      value: JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + session.expires_in,
        expires_in: session.expires_in,
        token_type: 'bearer',
        user: session.user,
      }),
      domain: new URL(baseURL).hostname,
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/** Delete a test user by ID. */
export async function deleteTestUser(userId: string) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
}

// ── Org / test data helpers ───────────────────────────────────────

export interface TestOrg {
  id: string;
  slug: string;
  name: string;
}

/** Create a test organization with owner membership. Returns org details. */
export async function createTestOrg(
  userId: string,
  userEmail: string,
  overrides: Partial<{ name: string; slug: string; billingPlan: string; trialEndsAt: string }> = {},
): Promise<TestOrg> {
  const slug = overrides.slug || `e2e-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const name = overrides.name || 'E2E Test Business';
  const trialEnd = overrides.trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const orgRes = await supabaseRest<{ id: string }[]>('organizations', {
    method: 'POST',
    body: {
      name,
      slug,
      billing_plan: overrides.billingPlan || 'trial',
      trial_ends_at: trialEnd,
      positive_threshold: 4,
    },
    prefer: 'return=representation',
  });

  if (!orgRes.data || !orgRes.data[0]) {
    throw new Error(`Failed to create org: ${orgRes.error?.message}`);
  }

  const orgId = orgRes.data[0].id;

  // Add owner membership
  await supabaseRest('organization_members', {
    method: 'POST',
    body: {
      organization_id: orgId,
      user_id: userId,
      role: 'owner',
      status: 'active',
      email: userEmail,
      display_name: 'E2E Test User',
    },
  });

  // Create default Staff role
  await supabaseRest('roles', {
    method: 'POST',
    body: {
      organization_id: orgId,
      name: 'Staff',
      permissions: ['dashboard', 'collect', 'reviews', 'support'],
    },
  });

  return { id: orgId, slug, name };
}

/** Clean up all test data for an org. */
export async function cleanupTestOrg(orgId: string) {
  // Delete in dependency order
  const tables = [
    'activity_log',
    'sms_log',
    'followup_queue',
    'external_reviews',
    'reviews',
    'review_requests',
    'review_platforms',
    'organization_integrations',
    'support_tickets',
    'roles',
    'organization_members',
    'organizations',
  ];

  for (const table of tables) {
    await supabaseRest(table, {
      method: 'DELETE',
      query: `organization_id=eq.${orgId}`,
    });
  }

  // Delete the org itself
  await supabaseRest('organizations', {
    method: 'DELETE',
    query: `id=eq.${orgId}`,
  });
}

/** Add a review platform to an org. */
export async function addPlatform(
  orgId: string,
  platform: string,
  url: string,
  displayOrder: number = 0,
) {
  return supabaseRest('review_platforms', {
    method: 'POST',
    body: {
      organization_id: orgId,
      platform,
      url,
      enabled: true,
      display_order: displayOrder,
    },
    prefer: 'return=representation',
  });
}

/** Submit a review via the API. */
export async function submitReview(
  slug: string,
  rating: number,
  options: { comment?: string; customerName?: string } = {},
) {
  const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${baseURL}/api/reviews/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slug,
      rating,
      comment: options.comment || '',
      customerName: options.customerName || 'E2E Customer',
      source: 'direct',
    }),
  });
  return res.json();
}

// ── Page assertion helpers ────────────────────────────────────────

/** Wait for page to be loaded (no loading spinners, network idle). */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
}

/** Assert no console errors on the page. */
export async function assertNoConsoleErrors(page: Page, errors: string[]) {
  const realErrors = errors.filter(
    (e) =>
      !e.includes('Download the React DevTools') &&
      !e.includes('Vercel Web Analytics') &&
      !e.includes('favicon') &&
      !e.includes('HMR') &&
      !e.includes('hydration'),
  );
  expect(realErrors).toHaveLength(0);
}

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { hasValidBilling } from '@/lib/utils/admin';
import { envRequired } from '@/lib/utils/env';

const publicPrefixes = ['/auth/', '/r/', '/wall/', '/blog/'];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/') return true;
  return publicPrefixes.some(prefix => pathname.startsWith(prefix));
}

// Routes that require auth but NOT an active subscription
const authOnlyPrefixes = ['/onboarding', '/subscribe'];

function isAuthOnlyRoute(pathname: string): boolean {
  return authOnlyPrefixes.some(prefix => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    envRequired('NEXT_PUBLIC_SUPABASE_URL'),
    envRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: createRedirect copies refreshed auth cookies from supabaseResponse
  // onto the redirect response. Without this, token refreshes are lost and the
  // session breaks on the next request — causing ERR_TOO_MANY_REDIRECTS.
  function createRedirect(pathname: string, search?: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    if (search !== undefined) {
      url.search = search;
    }
    const redirectResponse = NextResponse.redirect(url);
    // Copy all cookies (including refreshed Supabase tokens) to the redirect
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // If root page receives a PKCE code param, redirect to /auth/confirm to exchange it
  if (pathname === '/' && request.nextUrl.searchParams.has('code')) {
    return createRedirect('/auth/confirm', request.nextUrl.search);
  }

  // Allow public routes and API routes
  if (isPublicRoute(pathname) || pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // Not logged in → redirect to login
  if (!user) {
    return createRedirect('/auth/login');
  }

  // Auth-only routes (onboarding, subscribe) — no billing check needed
  if (isAuthOnlyRoute(pathname)) {
    return supabaseResponse;
  }

  // For dashboard routes, check org membership and billing
  if (pathname.startsWith('/dashboard')) {
    const isBillingSuccess = request.nextUrl.searchParams.get('billing') === 'success';

    // Try cached billing check first (cookie valid for 5 min)
    const billingCache = request.cookies.get('ir_billing_cache')?.value;
    if (billingCache && !isBillingSuccess) {
      try {
        const cached = JSON.parse(billingCache) as { orgId: string; plan: string; trialEnds: string | null; subEnds: string | null; exp: number };
        if (cached.exp > Date.now()) {
          if (!hasValidBilling(cached.plan, cached.trialEnds, user.email, cached.subEnds)) {
            return createRedirect('/subscribe', `?org=${cached.orgId}`);
          }
          return supabaseResponse;
        }
      } catch {
        // Invalid cache — fall through to DB query
      }
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(billing_plan, trial_ends_at, subscription_ends_at)')
      .eq('user_id', user.id)
      .maybeSingle();

    // No org yet → send to onboarding
    if (!member) {
      return createRedirect('/onboarding');
    }

    // Check billing status (org data is joined in the same query)
    const orgs = member.organizations as { billing_plan: string; trial_ends_at: string | null; subscription_ends_at: string | null }[] | null;
    const org = Array.isArray(orgs) ? orgs[0] ?? null : orgs;

    // Cache the billing state for 5 minutes
    if (org) {
      const cacheValue = JSON.stringify({
        orgId: member.organization_id,
        plan: org.billing_plan,
        trialEnds: org.trial_ends_at,
        subEnds: org.subscription_ends_at,
        exp: Date.now() + 5 * 60 * 1000,
      });
      supabaseResponse.cookies.set('ir_billing_cache', cacheValue, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 300,
        path: '/',
      });
    }

    if (org && !isBillingSuccess && !hasValidBilling(org.billing_plan, org.trial_ends_at, user.email, org.subscription_ends_at)) {
      return createRedirect('/subscribe', `?org=${member.organization_id}`);
    }

    // Pass billing=success flag to server components via header
    if (isBillingSuccess) {
      supabaseResponse.headers.set('x-billing-success', '1');
      // Invalidate billing cache on success so next load re-checks
      supabaseResponse.cookies.set('ir_billing_cache', '', { maxAge: 0, path: '/' });
    }
  }

  // Pass pathname to server components for route-level permission enforcement
  supabaseResponse.headers.set('x-pathname', pathname);

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap\\.xml|robots\\.txt|leave-behind\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

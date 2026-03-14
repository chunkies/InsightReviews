import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { hasValidBilling } from '@/lib/utils/admin';

const publicPrefixes = ['/auth/', '/r/', '/wall/'];

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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: _options }) =>
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

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // Allow public routes and API routes
  if (isPublicRoute(pathname) || pathname.startsWith('/api/')) {
    return supabaseResponse;
  }

  // Not logged in → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // Logged in but on auth pages → redirect to dashboard
  if (pathname.startsWith('/auth/') && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Auth-only routes (onboarding, subscribe) — no billing check needed
  if (isAuthOnlyRoute(pathname)) {
    return supabaseResponse;
  }

  // For dashboard routes, check org membership and billing in a single query
  if (pathname.startsWith('/dashboard')) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(billing_plan, trial_ends_at, subscription_ends_at)')
      .eq('user_id', user.id)
      .maybeSingle();

    // No org yet → send to onboarding
    if (!member) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // Check billing status (org data is joined in the same query)
    // Allow ?billing=success through — the client-side sync component will update the DB
    const isBillingSuccess = request.nextUrl.searchParams.get('billing') === 'success';
    const org = member.organizations as unknown as { billing_plan: string; trial_ends_at: string | null; subscription_ends_at: string | null } | null;
    if (org && !isBillingSuccess && !hasValidBilling(org.billing_plan, org.trial_ends_at, user.email, org.subscription_ends_at)) {
      const url = request.nextUrl.clone();
      url.pathname = '/subscribe';
      url.search = `?org=${member.organization_id}`;
      return NextResponse.redirect(url);
    }

    // Pass billing=success flag to server components via header
    if (isBillingSuccess) {
      supabaseResponse.headers.set('x-billing-success', '1');
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

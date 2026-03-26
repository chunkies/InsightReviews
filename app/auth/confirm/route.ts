import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackSignupServerSide } from '@/lib/analytics/meta-capi';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  // Build redirect URL — prefer NEXT_PUBLIC_SITE_URL, fall back to x-forwarded-host, then origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  let baseUrl: string;
  if (isLocalEnv) {
    baseUrl = origin;
  } else if (siteUrl) {
    baseUrl = siteUrl;
  } else if (forwardedHost) {
    baseUrl = `https://${forwardedHost}`;
  } else {
    baseUrl = origin;
  }

  function buildRedirect(path: string) {
    return NextResponse.redirect(`${baseUrl}${path}`);
  }

  const supabase = await createClient();

  // Method 1: token_hash + type (standard email OTP / magic link flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return await redirectAfterAuth(supabase, next, buildRedirect, request);
    }
  }

  // Method 2: PKCE code exchange (OAuth / code-based flows)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return await redirectAfterAuth(supabase, next, buildRedirect, request);
    }
  }

  return buildRedirect('/auth/error');
}

async function redirectAfterAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  next: string,
  buildRedirect: (path: string) => NextResponse,
  request: NextRequest,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('id, organization_id, status, email, display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) {
      // New user — fire server-side signup event for Meta CAPI
      trackSignupServerSide({
        email: user.email || '',
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined,
        fbc: request.cookies.get('_fbc')?.value,
        fbp: request.cookies.get('_fbp')?.value,
        sourceUrl: request.url,
      });
      return buildRedirect('/onboarding');
    }

    // Activate pending members and backfill email/display_name
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

    if (Object.keys(updates).length > 0) {
      await supabase
        .from('organization_members')
        .update(updates)
        .eq('id', member.id);
    }
  }

  return buildRedirect(next);
}

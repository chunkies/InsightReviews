import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  const supabase = await createClient();

  // Method 1: token_hash + type (standard email OTP / magic link flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return await redirectAfterAuth(supabase, request, next);
    }
  }

  // Method 2: PKCE code exchange (fallback for OAuth / code-based flows)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return await redirectAfterAuth(supabase, request, next);
    }
  }

  redirect('/auth/error');
}

async function redirectAfterAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  request: NextRequest,
  next: string,
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: member } = await supabase
      .from('organization_members')
      .select('id, organization_id, status, email, display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) {
      redirect('/onboarding');
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

  redirect(next);
}

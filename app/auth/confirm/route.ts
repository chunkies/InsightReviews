import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const rawNext = searchParams.get('next') ?? '/dashboard';
  // Prevent open redirect — only allow relative paths starting with /
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if user has an org
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!member) {
          return NextResponse.redirect(new URL('/onboarding', request.url));
        }
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL('/auth/error', request.url));
}

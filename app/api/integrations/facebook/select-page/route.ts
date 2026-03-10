import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, pageId, pageName, pageAccessToken } = await request.json();

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    const { error } = await serviceSupabase.from('organization_integrations').upsert({
      organization_id: organizationId,
      platform: 'facebook',
      access_token: pageAccessToken,
      refresh_token: null,
      token_expires_at: null,
      platform_account_id: pageId,
      platform_account_name: pageName,
      platform_url: `https://facebook.com/${pageId}`,
      sync_enabled: true,
      show_on_review_form: true,
    }, { onConflict: 'organization_id,platform' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Select page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

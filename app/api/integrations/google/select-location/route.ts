import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { envRequired } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, locationName, locationTitle, accessToken, refreshToken, expiresIn } =
      await request.json();

    // Verify ownership
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const serviceSupabase = createServerClient(
      envRequired('NEXT_PUBLIC_SUPABASE_URL'),
      envRequired('SUPABASE_SERVICE_ROLE_KEY'),
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    const { error } = await serviceSupabase.from('organization_integrations').upsert({
      organization_id: organizationId,
      platform: 'google',
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt,
      platform_account_id: locationName,
      platform_account_name: locationTitle,
      sync_enabled: true,
      show_on_review_form: true,
    }, { onConflict: 'organization_id,platform' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Select location error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

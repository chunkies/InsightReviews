import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { envRequired } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, locationName, locationTitle } =
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

    const serviceSupabase = createServerClient(
      envRequired('NEXT_PUBLIC_SUPABASE_URL'),
      envRequired('SUPABASE_SERVICE_ROLE_KEY'),
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    // Tokens are already stored server-side from the callback — just update with the selected location
    const { error } = await serviceSupabase.from('organization_integrations')
      .update({
        platform_account_id: locationName,
        platform_account_name: locationTitle,
        sync_enabled: true,
        show_on_review_form: true,
      })
      .eq('organization_id', organizationId)
      .eq('platform', 'google');

    if (error) {
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Select location error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

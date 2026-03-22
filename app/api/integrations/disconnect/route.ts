import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { envRequired } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { platform } = await request.json();
    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can disconnect integrations' }, { status: 403 });
    }

    const serviceSupabase = createServerClient(
      envRequired('NEXT_PUBLIC_SUPABASE_URL'),
      envRequired('SUPABASE_SERVICE_ROLE_KEY'),
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    // Delete external reviews first (cascade should handle this but be explicit)
    const { data: integration } = await serviceSupabase
      .from('organization_integrations')
      .select('id')
      .eq('organization_id', member.organization_id)
      .eq('platform', platform)
      .single();

    if (integration) {
      await serviceSupabase
        .from('external_reviews')
        .delete()
        .eq('integration_id', integration.id);

      await serviceSupabase
        .from('organization_integrations')
        .delete()
        .eq('id', integration.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

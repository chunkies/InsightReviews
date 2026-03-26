import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { envRequired } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { organizationId, pageId, pageName } = await request.json();

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

    // Read the stored user access token from the pending integration
    const { data: pendingIntegration } = await serviceSupabase
      .from('organization_integrations')
      .select('access_token')
      .eq('organization_id', organizationId)
      .eq('platform', 'facebook')
      .single();

    if (!pendingIntegration?.access_token) {
      return NextResponse.json({ error: 'No pending Facebook integration found. Please reconnect.' }, { status: 400 });
    }

    // Fetch the page access token server-side using the stored user token
    const { listFacebookPages } = await import('@/lib/integrations/facebook');
    const pages = await listFacebookPages(pendingIntegration.access_token);
    const selectedPage = pages.find((p: { id: string }) => p.id === pageId);

    if (!selectedPage) {
      return NextResponse.json({ error: 'Page not found. Please reconnect Facebook.' }, { status: 404 });
    }

    // Update with the actual page token
    const { error } = await serviceSupabase.from('organization_integrations')
      .update({
        access_token: selectedPage.access_token, // Page-specific token
        platform_account_id: pageId,
        platform_account_name: pageName,
        platform_url: `https://facebook.com/${pageId}`,
        sync_enabled: true,
        show_on_review_form: true,
      })
      .eq('organization_id', organizationId)
      .eq('platform', 'facebook');

    if (error) {
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Select page error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

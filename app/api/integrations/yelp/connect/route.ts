import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { searchYelpBusiness } from '@/lib/integrations/yelp';
import { requireBilling } from '@/lib/utils/admin';
import { envRequired } from '@/lib/utils/env';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can connect integrations' }, { status: 403 });
    }

    const billingError = await requireBilling(supabase, member.organization_id, user.email);
    if (billingError) return billingError;

    const { businessName, location } = await request.json();

    if (!businessName || !location) {
      return NextResponse.json({ error: 'Business name and location are required' }, { status: 400 });
    }

    // Search for the business on Yelp
    const businesses = await searchYelpBusiness(businessName, location);

    if (businesses.length === 0) {
      return NextResponse.json({ error: 'No businesses found on Yelp matching that name and location' }, { status: 404 });
    }

    return NextResponse.json({ businesses });
  } catch (error) {
    console.error('Yelp search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { yelpBusinessId, businessName, businessUrl } = await request.json();

    if (!yelpBusinessId) {
      return NextResponse.json({ error: 'Yelp business ID is required' }, { status: 400 });
    }

    // Use the Yelp write-a-review URL so customers land directly on the review page
    const reviewUrl = businessUrl
      ? businessUrl.replace('/biz/', '/writeareview/biz/')
      : `https://www.yelp.com/writeareview/biz/${yelpBusinessId}`;

    const serviceSupabase = createServerClient(
      envRequired('NEXT_PUBLIC_SUPABASE_URL'),
      envRequired('SUPABASE_SERVICE_ROLE_KEY'),
      { cookies: { getAll() { return []; }, setAll() {} } }
    );

    const { error } = await serviceSupabase.from('organization_integrations').upsert({
      organization_id: member.organization_id,
      platform: 'yelp',
      access_token: null, // Yelp uses API key, not per-user OAuth
      refresh_token: null,
      token_expires_at: null,
      platform_account_id: yelpBusinessId,
      platform_account_name: businessName,
      platform_url: reviewUrl,
      sync_enabled: true,
      show_on_review_form: true,
    }, { onConflict: 'organization_id,platform' });

    if (error) {
      return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Yelp connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { exchangeFacebookCode, getLongLivedToken, listFacebookPages } from '@/lib/integrations/facebook';
import { envRequired } from '@/lib/utils/env';

export async function GET(request: NextRequest) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim();

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=facebook_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=missing_params`);
    }

    let stateData: { organizationId: string; userId: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=invalid_state`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=unauthorized`);
    }

    // Exchange code for short-lived token
    const shortToken = await exchangeFacebookCode(code);

    // Exchange for long-lived token
    const longToken = await getLongLivedToken(shortToken.access_token);

    // List pages the user manages
    const pages = await listFacebookPages(longToken.access_token);

    if (pages.length === 0) {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=no_pages`);
    }

    if (pages.length === 1) {
      const page = pages[0];

      const serviceSupabase = createServerClient(
        envRequired('NEXT_PUBLIC_SUPABASE_URL'),
        envRequired('SUPABASE_SERVICE_ROLE_KEY'),
        { cookies: { getAll() { return []; }, setAll() {} } }
      );

      await serviceSupabase.from('organization_integrations').upsert({
        organization_id: stateData.organizationId,
        platform: 'facebook',
        access_token: page.access_token, // Page token doesn't expire
        refresh_token: null,
        token_expires_at: null,
        platform_account_id: page.id,
        platform_account_name: page.name,
        platform_url: `https://facebook.com/${page.id}`,
      }, { onConflict: 'organization_id,platform' });

      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?success=facebook`);
    }

    // Multiple pages — redirect to selection
    const pageData = Buffer.from(JSON.stringify({
      pages: pages.map(p => ({ id: p.id, name: p.name, access_token: p.access_token, category: p.category })),
      organizationId: stateData.organizationId,
    })).toString('base64url');

    return NextResponse.redirect(
      `${siteUrl}/dashboard/integrations?select_facebook_page=${pageData}`
    );
  } catch (error) {
    console.error('Facebook callback error:', error);
    return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=facebook_failed`);
  }
}

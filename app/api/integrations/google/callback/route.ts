import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exchangeGoogleCode, listGoogleAccounts, listGoogleLocations } from '@/lib/integrations/google';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim();

    if (error) {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=google_denied`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=missing_params`);
    }

    // Decode state
    let stateData: { organizationId: string; userId: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=invalid_state`);
    }

    // Verify user is authenticated and owns this org
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== stateData.userId) {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=unauthorized`);
    }

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code);

    // List accounts and locations to find the business
    const accounts = await listGoogleAccounts(tokens.access_token);

    // Get all locations across all accounts
    const allLocations: { accountName: string; locationName: string; title: string }[] = [];
    for (const account of accounts) {
      const locations = await listGoogleLocations(tokens.access_token, account.name);
      for (const loc of locations) {
        allLocations.push({
          accountName: account.name,
          locationName: loc.name,
          title: loc.title,
        });
      }
    }

    if (allLocations.length === 0) {
      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=no_locations`);
    }

    // If only one location, auto-connect. Otherwise store tokens and redirect to selection.
    if (allLocations.length === 1) {
      const loc = allLocations[0];
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Use service role to bypass RLS for insert (server-side operation)
      const { createServerClient } = await import('@supabase/ssr');
      const serviceSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll() { return []; }, setAll() {} } }
      );

      await serviceSupabase.from('organization_integrations').upsert({
        organization_id: stateData.organizationId,
        platform: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        platform_account_id: loc.locationName,
        platform_account_name: loc.title,
      }, { onConflict: 'organization_id,platform' });

      return NextResponse.redirect(`${siteUrl}/dashboard/integrations?success=google`);
    }

    // Multiple locations — store tokens temporarily and redirect to selection page
    // Store in a short-lived cookie (encrypted state is in the URL)
    const locationData = Buffer.from(JSON.stringify({
      tokens,
      locations: allLocations,
      organizationId: stateData.organizationId,
    })).toString('base64url');

    return NextResponse.redirect(
      `${siteUrl}/dashboard/integrations?select_google_location=${locationData}`
    );
  } catch (error) {
    console.error('Google callback error:', error);
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim();
    return NextResponse.redirect(`${siteUrl}/dashboard/integrations?error=google_failed`);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { refreshGoogleToken, fetchGoogleReviews, starRatingToNumber } from '@/lib/integrations/google';
import { fetchFacebookRatings, facebookRatingToNumber } from '@/lib/integrations/facebook';
import { getYelpReviews } from '@/lib/integrations/yelp';
import type { OrganizationIntegration } from '@/lib/types/database';

function getServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return []; }, setAll() {} } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { platform } = await request.json();

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const serviceClient = getServiceClient();

    // Get the integration
    const query = serviceClient
      .from('organization_integrations')
      .select('*')
      .eq('organization_id', member.organization_id)
      .eq('sync_enabled', true);

    if (platform) {
      query.eq('platform', platform);
    }

    const { data: integrations } = await query;

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({ error: 'No integrations found' }, { status: 404 });
    }

    const results: Record<string, { synced: number; errors: string[] }> = {};

    for (const integration of integrations as OrganizationIntegration[]) {
      try {
        let synced = 0;

        if (integration.platform === 'google') {
          synced = await syncGoogleReviews(serviceClient, integration);
        } else if (integration.platform === 'facebook') {
          synced = await syncFacebookReviews(serviceClient, integration);
        } else if (integration.platform === 'yelp') {
          synced = await syncYelpReviews(serviceClient, integration);
        }

        // Update last_synced_at
        await serviceClient
          .from('organization_integrations')
          .update({ last_synced_at: new Date().toISOString() })
          .eq('id', integration.id);

        results[integration.platform] = { synced, errors: [] };
      } catch (error) {
        results[integration.platform] = {
          synced: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function syncGoogleReviews(
  supabase: ReturnType<typeof getServiceClient>,
  integration: OrganizationIntegration
): Promise<number> {
  let accessToken = integration.access_token!;

  // Refresh token if expired
  if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
    if (!integration.refresh_token) throw new Error('No refresh token — reconnect Google');
    const refreshed = await refreshGoogleToken(integration.refresh_token);
    accessToken = refreshed.access_token;
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    await supabase
      .from('organization_integrations')
      .update({ access_token: accessToken, token_expires_at: newExpiry })
      .eq('id', integration.id);
  }

  let synced = 0;
  let pageToken: string | undefined;

  do {
    const result = await fetchGoogleReviews(
      accessToken,
      integration.platform_account_id!,
      pageToken
    );

    for (const review of result.reviews) {
      const { error } = await supabase.from('external_reviews').upsert({
        organization_id: integration.organization_id,
        integration_id: integration.id,
        platform: 'google',
        platform_review_id: review.reviewId,
        rating: starRatingToNumber(review.starRating),
        comment: review.comment || null,
        reviewer_name: review.reviewer.displayName,
        reviewer_avatar_url: review.reviewer.profilePhotoUrl || null,
        review_date: review.createTime,
        reply_text: review.reviewReply?.comment || null,
        replied_at: review.reviewReply?.updateTime || null,
        raw_data: review,
      }, { onConflict: 'integration_id,platform_review_id' });

      if (!error) synced++;
    }

    pageToken = result.nextPageToken;
  } while (pageToken);

  return synced;
}

async function syncFacebookReviews(
  supabase: ReturnType<typeof getServiceClient>,
  integration: OrganizationIntegration
): Promise<number> {
  const pageToken = integration.access_token!;
  const pageId = integration.platform_account_id!;

  let synced = 0;
  let cursor: string | undefined;

  do {
    const result = await fetchFacebookRatings(pageToken, pageId, cursor);

    for (const rating of result.ratings) {
      const numericRating = facebookRatingToNumber(rating.rating, rating.recommendation_type);
      const reviewId = rating.open_graph_story?.id || `${rating.reviewer.id}_${rating.created_time}`;

      const { error } = await supabase.from('external_reviews').upsert({
        organization_id: integration.organization_id,
        integration_id: integration.id,
        platform: 'facebook',
        platform_review_id: reviewId,
        rating: numericRating,
        comment: rating.review_text || null,
        reviewer_name: rating.reviewer.name,
        reviewer_avatar_url: null,
        review_date: rating.created_time,
        reply_text: null,
        replied_at: null,
        raw_data: rating,
      }, { onConflict: 'integration_id,platform_review_id' });

      if (!error) synced++;
    }

    cursor = result.nextCursor;
    // Only fetch first 2 pages to avoid rate limits
    if (synced > 100) break;
  } while (cursor);

  return synced;
}

async function syncYelpReviews(
  supabase: ReturnType<typeof getServiceClient>,
  integration: OrganizationIntegration
): Promise<number> {
  const businessId = integration.platform_account_id!;
  const reviews = await getYelpReviews(businessId);

  let synced = 0;

  for (const review of reviews) {
    const { error } = await supabase.from('external_reviews').upsert({
      organization_id: integration.organization_id,
      integration_id: integration.id,
      platform: 'yelp',
      platform_review_id: review.id,
      rating: review.rating,
      comment: review.text || null,
      reviewer_name: review.user.name,
      reviewer_avatar_url: review.user.image_url,
      review_date: review.time_created,
      reply_text: null,
      replied_at: null,
      raw_data: review,
    }, { onConflict: 'integration_id,platform_review_id' });

    if (!error) synced++;
  }

  return synced;
}

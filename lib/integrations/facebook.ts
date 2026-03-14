/**
 * Facebook Graph API integration for Page reviews/recommendations.
 *
 * OAuth flow:
 * 1. User clicks "Connect Facebook" → redirects to Facebook Login
 * 2. Facebook redirects back with auth code → /api/integrations/facebook/callback
 * 3. We exchange code for user access token
 * 4. We exchange user token for long-lived token (60 days)
 * 5. User selects which Page to connect
 * 6. We get Page access token (doesn't expire)
 * 7. We fetch ratings/recommendations
 *
 * Required Facebook App setup:
 * - Create app at developers.facebook.com
 * - Add "Facebook Login" product
 * - Request pages_read_engagement and pages_read_user_content permissions
 * - Add redirect URI: {SITE_URL}/api/integrations/facebook/callback
 *
 * Note: Facebook deprecated star ratings in 2018, switched to recommendations.
 * The API returns both old ratings and new recommendations depending on the Page.
 */

const FB_GRAPH_BASE = 'https://graph.facebook.com/v19.0';
const FB_AUTH_URL = 'https://www.facebook.com/v19.0/dialog/oauth';

function getCredentials() {
  return {
    appId: process.env.FACEBOOK_APP_ID!,
    appSecret: process.env.FACEBOOK_APP_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL!.trim()}/api/integrations/facebook/callback`,
  };
}

export function getFacebookAuthUrl(state: string): string {
  const { appId, redirectUri } = getCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    state,
    scope: 'pages_read_engagement,pages_read_user_content,pages_show_list',
    response_type: 'code',
  });
  return `${FB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeFacebookCode(code: string): Promise<{
  access_token: string;
  expires_in?: number;
}> {
  const { appId, appSecret, redirectUri } = getCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Facebook token exchange failed: ${err}`);
  }
  return res.json();
}

export async function getLongLivedToken(shortToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const { appId, appSecret } = getCredentials();
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });

  const res = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to get long-lived Facebook token');
  return res.json();
}

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string; // Page-level token
  category: string;
}

export async function listFacebookPages(userToken: string): Promise<FacebookPage[]> {
  const res = await fetch(
    `${FB_GRAPH_BASE}/me/accounts?fields=id,name,access_token,category`,
    { headers: { Authorization: `Bearer ${userToken}` } }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export interface FacebookRating {
  reviewer: { name: string; id: string };
  rating?: number; // Old-style 1-5 (may not exist for recommendations)
  recommendation_type?: 'positive' | 'negative'; // New-style
  review_text?: string;
  created_time: string;
  open_graph_story?: { id: string };
}

export async function fetchFacebookRatings(
  pageToken: string,
  pageId: string,
  after?: string
): Promise<{ ratings: FacebookRating[]; nextCursor?: string }> {
  const params = new URLSearchParams({
    fields: 'reviewer,rating,recommendation_type,review_text,created_time',
    limit: '50',
  });
  if (after) params.set('after', after);

  const res = await fetch(
    `${FB_GRAPH_BASE}/${pageId}/ratings?${params.toString()}`,
    { headers: { Authorization: `Bearer ${pageToken}` } }
  );

  if (!res.ok) return { ratings: [] };
  const data = await res.json();
  return {
    ratings: data.data || [],
    nextCursor: data.paging?.cursors?.after,
  };
}

/**
 * Convert Facebook recommendation to a numeric rating.
 * Old-style ratings return 1-5. New recommendations are binary (positive=5, negative=1).
 */
export function facebookRatingToNumber(rating?: number, recommendationType?: string): number | null {
  if (rating) return rating;
  if (recommendationType === 'positive') return 5;
  if (recommendationType === 'negative') return 1;
  return null;
}

/**
 * Google Business Profile API integration.
 *
 * OAuth flow:
 * 1. User clicks "Connect Google" → redirects to Google OAuth consent
 * 2. Google redirects back with auth code → /api/integrations/google/callback
 * 3. We exchange code for access + refresh tokens
 * 4. User selects which business location to connect
 * 5. We fetch reviews on demand or via cron
 *
 * Required Google Cloud setup:
 * - Enable "My Business Account Management API" and "My Business Business Information API"
 * - Create OAuth 2.0 credentials (web application)
 * - Add redirect URI: {SITE_URL}/api/integrations/google/callback
 *
 * Scopes needed:
 * - https://www.googleapis.com/auth/business.manage (read reviews + reply)
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GBP_API_BASE = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const GBP_INFO_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';

function getCredentials() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/google/callback`,
  };
}

export function getGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getCredentials();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/business.manage',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret, redirectUri } = getCredentials();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  return res.json();
}

export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getCredentials();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to refresh Google token');
  }

  return res.json();
}

export interface GoogleAccount {
  name: string; // accounts/{id}
  accountName: string;
  type: string;
}

export async function listGoogleAccounts(accessToken: string): Promise<GoogleAccount[]> {
  const res = await fetch(`${GBP_API_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.accounts || [];
}

export interface GoogleLocation {
  name: string; // accounts/{id}/locations/{id}
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    regionCode?: string;
  };
  websiteUri?: string;
}

export async function listGoogleLocations(
  accessToken: string,
  accountName: string
): Promise<GoogleLocation[]> {
  const res = await fetch(
    `${GBP_INFO_BASE}/${accountName}/locations?readMask=name,title,storefrontAddress,websiteUri`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.locations || [];
}

export interface GoogleReview {
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
  comment?: string;
  createTime: string;
  updateTime: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
}

const STAR_TO_NUMBER: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export function starRatingToNumber(starRating: string): number {
  return STAR_TO_NUMBER[starRating] || 0;
}

export async function fetchGoogleReviews(
  accessToken: string,
  locationName: string,
  pageToken?: string
): Promise<{ reviews: GoogleReview[]; nextPageToken?: string; totalReviewCount?: number }> {
  const params = new URLSearchParams({ pageSize: '50' });
  if (pageToken) params.set('pageToken', pageToken);

  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch Google reviews: ${err}`);
  }

  const data = await res.json();
  return {
    reviews: data.reviews || [],
    nextPageToken: data.nextPageToken,
    totalReviewCount: data.totalReviewCount,
  };
}

export async function replyToGoogleReview(
  accessToken: string,
  reviewName: string,
  replyText: string
): Promise<boolean> {
  const res = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment: replyText }),
    }
  );

  return res.ok;
}

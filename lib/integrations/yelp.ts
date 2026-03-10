/**
 * Yelp Fusion API integration.
 *
 * Free tier: 5,000 API calls/day.
 * Limitation: Yelp ToS prohibits displaying individual review text from API.
 * We can show: overall rating, review count, business info, and up to 3 review excerpts
 * that the API returns with business details.
 *
 * No OAuth needed — just an API key.
 *
 * Required setup:
 * - Create app at https://www.yelp.com/developers/v3/manage_app
 * - Get API Key
 */

const YELP_API_BASE = 'https://api.yelp.com/v3';

function getApiKey(): string {
  return process.env.YELP_API_KEY!;
}

export interface YelpBusiness {
  id: string;
  name: string;
  url: string;
  rating: number;
  review_count: number;
  image_url: string;
  location: {
    display_address: string[];
  };
  categories: { alias: string; title: string }[];
}

export interface YelpReview {
  id: string;
  url: string;
  text: string;
  rating: number;
  time_created: string;
  user: {
    name: string;
    image_url: string | null;
  };
}

export async function searchYelpBusiness(
  name: string,
  location: string
): Promise<YelpBusiness[]> {
  const apiKey = getApiKey();
  const params = new URLSearchParams({
    term: name,
    location,
    limit: '5',
  });

  const res = await fetch(`${YELP_API_BASE}/businesses/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.businesses || [];
}

export async function getYelpBusiness(businessId: string): Promise<YelpBusiness | null> {
  const apiKey = getApiKey();
  const res = await fetch(`${YELP_API_BASE}/businesses/${businessId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) return null;
  return res.json();
}

/**
 * Yelp API returns up to 3 review excerpts per business.
 * These are the only reviews we're allowed to display per ToS.
 */
export async function getYelpReviews(businessId: string): Promise<YelpReview[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('YELP_API_KEY not configured');
    return [];
  }

  const res = await fetch(`${YELP_API_BASE}/businesses/${businessId}/reviews?limit=50&sort_by=yelp_sort`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Yelp reviews API error (${res.status}):`, text);
    return [];
  }
  const data = await res.json();
  return data.reviews || [];
}

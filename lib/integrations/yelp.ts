/**
 * Yelp Fusion API integration.
 *
 * Free tier: 5,000 API calls/day.
 * Limitation: /reviews endpoint only works for US/Canada businesses.
 * For international businesses, we fetch business details (rating + review_count)
 * and create a summary record.
 *
 * No OAuth needed — just an API key.
 */

const YELP_API_BASE = 'https://api.yelp.com/v3';

function getApiKey(): string {
  return process.env.YELP_API_KEY!;
}

export interface YelpBusiness {
  id: string;
  alias: string;
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
 * Fetch Yelp reviews. The /reviews endpoint only works for US/Canada businesses.
 * For international businesses, returns empty array (use getYelpBusinessSummary instead).
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
    // 404 = reviews not available for this region (non-US/Canada)
    if (res.status === 404) {
      console.log(`Yelp reviews not available for business ${businessId} (likely non-US/Canada)`);
    } else {
      const text = await res.text();
      console.error(`Yelp reviews API error (${res.status}):`, text);
    }
    return [];
  }
  const data = await res.json();
  return data.reviews || [];
}

/**
 * Get business summary (rating + review_count) — works for ALL regions.
 * Used as fallback when individual reviews aren't available.
 */
export interface YelpBusinessSummary {
  rating: number;
  review_count: number;
  name: string;
  url: string;
}

export async function getYelpBusinessSummary(businessId: string): Promise<YelpBusinessSummary | null> {
  const business = await getYelpBusiness(businessId);
  if (!business) return null;
  return {
    rating: business.rating,
    review_count: business.review_count,
    name: business.name,
    url: business.url,
  };
}

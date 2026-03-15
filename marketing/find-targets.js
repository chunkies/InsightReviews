#!/usr/bin/env node
/**
 * Find Melbourne businesses with 3-4 star ratings on Yelp
 * These are ideal cold outreach targets for InsightReviews
 */

const API_KEY = process.env.YELP_API_KEY;
const BASE_URL = 'https://api.yelp.com/v3/businesses/search';

const CATEGORIES = [
  'cafes',
  'restaurants',
  'hair',
  'dentists',
  'gyms',
  'autorepair',
  'beautysvc',
  'barbershops',
  'nailsalons',
  'physicaltherapy',
];

const MELBOURNE_SUBURBS = [
  'Footscray, Melbourne VIC',
  'Sunshine, Melbourne VIC',
  'Brunswick, Melbourne VIC',
  'Fitzroy, Melbourne VIC',
  'Richmond, Melbourne VIC',
  'St Kilda, Melbourne VIC',
  'Preston, Melbourne VIC',
  'Coburg, Melbourne VIC',
  'Carlton, Melbourne VIC',
  'Collingwood, Melbourne VIC',
  'South Yarra, Melbourne VIC',
  'Prahran, Melbourne VIC',
  'Thornbury, Melbourne VIC',
  'Northcote, Melbourne VIC',
  'Reservoir, Melbourne VIC',
];

async function searchYelp(term, location) {
  const params = new URLSearchParams({
    term,
    location,
    limit: '50',
    sort_by: 'review_count', // Most reviewed = more established businesses
  });

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Yelp API error for ${term} in ${location}:`, res.status, err);
    return [];
  }

  const data = await res.json();
  return data.businesses || [];
}

async function main() {
  if (!API_KEY) {
    console.error('Set YELP_API_KEY in .env.local');
    process.exit(1);
  }

  const targets = [];
  const seen = new Set();

  for (const category of CATEGORIES) {
    for (const suburb of MELBOURNE_SUBURBS) {
      console.error(`Searching: ${category} in ${suburb}...`);

      try {
        const businesses = await searchYelp(category, suburb);

        for (const biz of businesses) {
          // Filter: 3.0-4.0 stars with at least 5 reviews
          if (biz.rating >= 3.0 && biz.rating <= 4.0 && biz.review_count >= 5 && !seen.has(biz.id)) {
            seen.add(biz.id);
            targets.push({
              name: biz.name,
              rating: biz.rating,
              reviews: biz.review_count,
              phone: biz.phone || '',
              address: biz.location?.display_address?.join(', ') || '',
              category: (biz.categories || []).map(c => c.title).join(', '),
              yelp_url: biz.url?.split('?')[0] || '',
              suburb: suburb.split(',')[0],
            });
          }
        }

        // Rate limit - Yelp allows 5000/day, be gentle
        await new Promise(r => setTimeout(r, 200));
      } catch (err) {
        console.error(`Error: ${err.message}`);
      }
    }
  }

  // Sort by rating ascending (lowest first = most need for help)
  targets.sort((a, b) => a.rating - b.rating || b.reviews - a.reviews);

  // Output as CSV
  console.log('Name,Rating,Reviews,Phone,Address,Category,Yelp URL,Suburb');
  for (const t of targets) {
    const row = [
      `"${t.name.replace(/"/g, '""')}"`,
      t.rating,
      t.reviews,
      t.phone,
      `"${t.address.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.yelp_url,
      t.suburb,
    ].join(',');
    console.log(row);
  }

  console.error(`\nFound ${targets.length} businesses with 3.0-4.0 stars`);
}

main().catch(console.error);

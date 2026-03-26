#!/usr/bin/env node
/* global console, process, fetch, setTimeout, require */
/**
 * Find Melbourne businesses with low Google ratings for InsightReviews outreach.
 *
 * Usage: GOOGLE_PLACES_API_KEY=xxx node scripts/find-prospects.js
 *
 * Get a free API key: https://console.cloud.google.com/apis/credentials
 * Enable "Places API (New)" in your Google Cloud project.
 * Free tier: $200/month credit (enough for ~10,000 searches)
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('Set GOOGLE_PLACES_API_KEY environment variable');
  console.error('Get one at: https://console.cloud.google.com/apis/credentials');
  process.exit(1);
}

const MELBOURNE_CENTER = { lat: -37.8136, lng: 144.9631 };
const RADIUS = 8000; // 8km from CBD covers inner suburbs

const CATEGORIES = [
  { type: 'car_dealer', label: 'Used Car Dealer' },
  { type: 'real_estate_agency', label: 'Real Estate Agent' },
  { type: 'car_wash', label: 'Car Wash' },
  { type: 'car_repair', label: 'Panel Beater / Auto Body' },
  { type: 'locksmith', label: 'Locksmith' },
  { type: 'moving_company', label: 'Removalist' },
  { type: 'laundry', label: 'Dry Cleaner / Laundromat' },
  { type: 'cell_phone_store', label: 'Phone Repair' },
  { type: 'restaurant', label: 'Restaurant' },
  { type: 'cafe', label: 'Cafe' },
  { type: 'dentist', label: 'Dentist' },
  { type: 'physiotherapist', label: 'Physio' },
  { type: 'veterinary_care', label: 'Vet Clinic' },
  { type: 'hair_care', label: 'Hair Salon' },
  { type: 'gym', label: 'Gym' },
  { type: 'pet_store', label: 'Pet Store' },
];

async function searchPlaces(type) {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';
  const body = {
    includedTypes: [type],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: { latitude: MELBOURNE_CENTER.lat, longitude: MELBOURNE_CENTER.lng },
        radius: RADIUS,
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.primaryType',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`Error searching ${type}: ${res.status} ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return (data.places || [])
    .filter(p => p.rating && p.rating < 4.3) // Only businesses below 4.3 stars
    .map(p => ({
      name: p.displayName?.text || 'Unknown',
      category: type,
      rating: p.rating,
      reviews: p.userRatingCount || 0,
      address: p.formattedAddress || '',
      phone: p.nationalPhoneNumber || '',
      website: p.websiteUri || '',
    }))
    .sort((a, b) => a.rating - b.rating); // Worst first
}

async function main() {
  console.log('Searching for Melbourne businesses with low Google ratings...\n');

  const allProspects = [];

  for (const { type, label } of CATEGORIES) {
    console.log(`Searching: ${label}...`);
    const results = await searchPlaces(type);
    console.log(`  Found ${results.length} businesses below 4.3 stars`);

    for (const r of results) {
      allProspects.push({ ...r, categoryLabel: label });
    }

    // Rate limit: 1 request per second
    await new Promise(r => setTimeout(r, 1000));
  }

  // Sort all by rating (worst first)
  allProspects.sort((a, b) => a.rating - b.rating);

  console.log(`\n===== TOTAL: ${allProspects.length} prospects found =====\n`);

  // Print table
  console.log('Rating | Reviews | Category | Name | Address | Phone | Website');
  console.log('-------|---------|----------|------|---------|-------|--------');
  for (const p of allProspects) {
    console.log(`${p.rating} | ${p.reviews} | ${p.categoryLabel} | ${p.name} | ${p.address} | ${p.phone} | ${p.website}`);
  }

  // Save to JSON
  const fs = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
  const outPath = './marketing/prospects-low-rated.json';
  fs.writeFileSync(outPath, JSON.stringify(allProspects, null, 2));
  console.log(`\nSaved to ${outPath}`);
}

main().catch(console.error);

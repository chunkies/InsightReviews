#!/usr/bin/env node
/* global console, process, document, require */
/**
 * Scrape Google Search for Melbourne businesses with low ratings.
 * Parses star ratings from Google's local business results.
 * Completely free — no API key needed.
 *
 * Usage: node scripts/scrape-prospects-v2.js
 */

const { chromium } = require('playwright'); // eslint-disable-line @typescript-eslint/no-require-imports
const fs = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports

const MAX_RATING = 4.2;

const SEARCHES = [
  'used car dealer melbourne',
  'real estate agent melbourne inner suburbs',
  'panel beater melbourne inner suburbs',
  'car wash melbourne CBD',
  'phone repair shop melbourne',
  'removalist melbourne',
  'locksmith melbourne',
  'dry cleaner melbourne inner suburbs',
  'kebab shop melbourne CBD',
  'fish and chips melbourne CBD',
  'pizza shop melbourne fitzroy',
  'takeaway food collingwood richmond',
  'cafe south yarra',
  'cafe northcote',
  'cafe st kilda',
  'cafe brunswick',
  'restaurant collingwood',
  'mechanic fitzroy collingwood',
  'dentist melbourne CBD',
  'physio melbourne',
  'vet clinic melbourne',
  'hair salon melbourne CBD',
  'nail salon melbourne prahran',
  'laundromat melbourne',
  'dog groomer melbourne',
  'tattoo shop fitzroy',
];

async function searchGoogle(page, query) {
  const results = [];

  try {
    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}&gl=au&hl=en&num=20`, {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForTimeout(2500);

    // Extract text and look for rating patterns
    const pageText = await page.evaluate(() => document.body.innerText);
    const lines = pageText.split('\n').map(l => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length - 1; i++) {
      // Pattern: "3.8" on one line, "(256)" on the next
      const ratingMatch = lines[i].match(/^([\d.]+)$/);
      const reviewMatch = lines[i + 1]?.match(/^\(([\d,]+)\)$/);

      if (ratingMatch && reviewMatch) {
        const rating = parseFloat(ratingMatch[1]);
        const reviews = parseInt(reviewMatch[1].replace(/,/g, ''), 10);

        if (rating <= MAX_RATING && rating >= 1.0 && reviews >= 3) {
          // Find business name (1-4 lines above the rating)
          let name = '';
          for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
            const line = lines[j];
            if (line.match(/^(Sponsored|Ad|Rating|Open|Closed|Directions|Website|Menu|More info|Reviews|Hours|Map|·)/i)) continue;
            if (line.match(/^[\d.]+$/) || line.match(/^\([\d,]+\)$/)) continue;
            if (line.length >= 3 && line.length <= 80 && !line.match(/^\d+ results?$/i)) {
              name = line;
              break;
            }
          }

          // Find address (1-4 lines below reviews count)
          let address = '';
          for (let j = i + 2; j < Math.min(lines.length, i + 6); j++) {
            if (lines[j].match(/\d+.*?(St|Rd|Ave|Dr|Street|Road|Highway|Parade|Lane|Place|Crescent)/i)) {
              address = lines[j].substring(0, 100);
              break;
            }
          }

          if (name && !name.match(/^(More places|People also|Related|Searches|See more)/i)) {
            results.push({ name, rating, reviews, address, source: query });
          }
        }
      }
    }
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }

  return results;
}

async function main() {
  console.log(`Searching Google for Melbourne businesses below ${MAX_RATING} stars...`);
  console.log(`Searching ${SEARCHES.length} categories.\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-AU',
    geolocation: { latitude: -37.8136, longitude: 144.9631 },
  });
  const page = await context.newPage();

  const allProspects = [];
  const seen = new Set();

  for (const query of SEARCHES) {
    process.stdout.write(`Searching: "${query}"... `);
    const results = await searchGoogle(page, query);

    let newCount = 0;
    for (const r of results) {
      const key = r.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(key)) {
        seen.add(key);
        allProspects.push(r);
        newCount++;
      }
    }

    console.log(`${newCount > 0 ? newCount + ' new' : 'none'}`);

    // Rate limit
    await page.waitForTimeout(2000 + Math.random() * 2000);
  }

  await browser.close();

  allProspects.sort((a, b) => a.rating - b.rating);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`TOTAL: ${allProspects.length} businesses below ${MAX_RATING} stars`);
  console.log(`${'='.repeat(50)}\n`);

  for (const p of allProspects) {
    console.log(`${p.rating}★ | ${String(p.reviews).padStart(5)} reviews | ${p.name}${p.address ? ' | ' + p.address : ''}`);
  }

  const outPath = './marketing/prospects-low-rated.json';
  fs.writeFileSync(outPath, JSON.stringify(allProspects, null, 2));
  console.log(`\nSaved ${allProspects.length} prospects to ${outPath}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

#!/usr/bin/env node
/* global console, process, document, require */
/**
 * Scrape Google Maps for Melbourne businesses with low ratings.
 * Uses Playwright (already installed) — completely free, no API key needed.
 *
 * Usage: node scripts/scrape-prospects.js
 */

const { chromium } = require('playwright'); // eslint-disable-line @typescript-eslint/no-require-imports
const fs = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports

const MAX_RATING = 4.2; // Only businesses below this rating

const SEARCHES = [
  'used car dealer melbourne',
  'real estate agent melbourne inner suburbs',
  'panel beater melbourne',
  'car wash melbourne',
  'phone repair melbourne CBD fitzroy',
  'removalist melbourne',
  'locksmith melbourne',
  'dry cleaner melbourne fitzroy collingwood',
  'kebab shop melbourne',
  'fish and chips melbourne',
  'pizza shop melbourne CBD',
  'takeaway food richmond collingwood',
  'cafe south yarra prahran',
  'cafe northcote thornbury',
  'cafe st kilda',
  'cafe brunswick',
  'restaurant fitzroy collingwood',
  'mechanic melbourne inner suburbs',
  'dentist melbourne CBD richmond',
  'physiotherapy melbourne inner suburbs',
  'vet clinic melbourne',
  'hair salon melbourne CBD',
  'beauty salon melbourne chapel street',
  'nail salon melbourne',
  'gym melbourne inner suburbs',
  'laundromat melbourne',
];

async function scrapeCategory(page, searchQuery) {
  const results = [];
  const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/@-37.81,144.96,13z`;

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);

  // Accept cookies if prompted
  try {
    const acceptBtn = page.locator('button:has-text("Accept all")');
    if (await acceptBtn.isVisible({ timeout: 2000 })) await acceptBtn.click();
  } catch { /* no cookie prompt */ }

  // Scroll the results panel to load more
  for (let i = 0; i < 5; i++) {
    try {
      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollTop = feed.scrollHeight;
      });
      await page.waitForTimeout(2000);
    } catch {
      break;
    }
  }

  // Extract business data — try multiple selector strategies
  const businesses = await page.evaluate(() => {
    const items = [];

    // Strategy 1: article elements (standard Maps)
    const articles = document.querySelectorAll('article');
    // Strategy 2: links with place URLs
    const placeLinks = document.querySelectorAll('a[href*="/maps/place/"]');
    // Strategy 3: any element with rating alt text
    const ratingImgs = document.querySelectorAll('img[alt*="stars"]');

    // Debug: log what we found
    console.log(`DEBUG: ${articles.length} articles, ${placeLinks.length} place links, ${ratingImgs.length} rating imgs`);

    // Extract from rating images (most reliable)
    ratingImgs.forEach(img => {
      const alt = img.getAttribute('alt') || '';
      const match = alt.match(/([\d.]+)\s*stars?\s*([\d,]+)\s*Review/i);
      if (!match) return;

      const rating = parseFloat(match[1]);
      const reviews = parseInt(match[2].replace(/,/g, ''), 10);

      // Walk up to find the parent container with the business name
      let container = img.closest('article') || img.closest('[data-result-index]') || img.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
      if (!container) return;

      // Try to find business name
      let name = container.getAttribute('aria-label') || '';
      if (!name) {
        // Look for a link that goes to a place
        const link = container.querySelector('a[href*="/maps/place/"]');
        if (link) {
          name = link.getAttribute('aria-label') || link.textContent?.trim() || '';
        }
      }
      if (!name) {
        // Just get the first significant text
        const texts = [...container.querySelectorAll('div, span')].map(el => el.textContent?.trim()).filter(t => t && t.length > 3 && t.length < 60);
        name = texts[0] || '';
      }

      if (!name || name.length < 2) return;

      // Get address
      let address = '';
      const allText = container.textContent || '';
      const addrMatch = allText.match(/\d+[\s-]+[\w\s]+(St|Rd|Ave|Dr|Ln|Parade|Hwy|Street|Road|Avenue|Drive|Lane|Place|Crescent|Boulevard|Way|Court)\b/i);
      if (addrMatch) address = addrMatch[0].trim();

      items.push({ name: name.substring(0, 80), rating, reviews, address });
    });

    return items;
  });

  // Filter for low ratings only
  for (const biz of businesses) {
    if (biz.rating <= MAX_RATING && biz.reviews >= 3) {
      // Skip sponsored results (they appear first but may not be local)
      results.push({
        ...biz,
        searchQuery,
      });
    }
  }

  return results;
}

async function main() {
  console.log(`Searching for Melbourne businesses below ${MAX_RATING} stars...\n`);
  console.log(`Searching ${SEARCHES.length} categories. This takes ~3 minutes.\n`);

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'en-AU',
    geolocation: { latitude: -37.8136, longitude: 144.9631 },
    permissions: ['geolocation'],
  });
  const page = await context.newPage();

  const allProspects = [];
  const seen = new Set();

  for (const query of SEARCHES) {
    try {
      console.log(`Searching: "${query}"...`);
      const results = await scrapeCategory(page, query);

      for (const r of results) {
        const key = r.name.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          allProspects.push(r);
          console.log(`  FOUND: ${r.name} — ${r.rating} stars (${r.reviews} reviews)`);
        }
      }

      if (results.length === 0) {
        console.log('  (no low-rated businesses found in top results)');
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }

  await browser.close();

  // Sort worst first
  allProspects.sort((a, b) => a.rating - b.rating);

  console.log(`\n========================================`);
  console.log(`TOTAL: ${allProspects.length} businesses below ${MAX_RATING} stars`);
  console.log(`========================================\n`);

  // Print table
  for (const p of allProspects) {
    console.log(`${p.rating} ★ | ${p.reviews} reviews | ${p.name} | ${p.address || 'no address'}`);
  }

  // Save to JSON
  const outPath = './marketing/prospects-low-rated.json';
  fs.writeFileSync(outPath, JSON.stringify(allProspects, null, 2));
  console.log(`\nSaved to ${outPath}`);
  console.log('Next step: Run "node scripts/find-prospect-contacts.js" to find emails/Instagram for each.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * SEO, Backlinks & Analytics Tests
 *
 * These tests ensure:
 * 1. Directory backlinks are present in the landing page footer (required for dofollow SEO links)
 * 2. Vercel Analytics and Speed Insights are installed in the layout
 * 3. GA4 and Meta Pixel scripts are configured
 * 4. SEO metadata (sitemap, robots, structured data, canonical URLs) is correct
 * 5. Blog posts are in the sitemap
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');

function readFile(relativePath: string): string {
  return readFileSync(resolve(ROOT, relativePath), 'utf-8');
}

// =============================================================================
// Directory backlinks — these are required for dofollow SEO links
// If these are removed, directories will revoke the dofollow status
// =============================================================================

describe('Directory backlinks in landing page footer', () => {
  const landingPage = readFile('app/page.tsx');

  const requiredBacklinks = [
    { name: 'Dofollow.Tools', url: 'dofollow.tools' },
    { name: 'FrogDR', url: 'frogdr.com' },
    { name: 'Startup Fame', url: 'startupfa.me' },
    { name: 'Fazier', url: 'fazier.com' },
    { name: 'Findly.tools', url: 'findly.tools' },
    { name: 'NewTool.site', url: 'newtool.site' },
    { name: 'Turbo0', url: 'turbo0.com' },
    { name: 'Stack Directory', url: 'stackdirectory.com' },
    { name: 'Startup Fast', url: 'startupfa.st' },
    { name: 'LaunchVoid', url: 'launchvoid.com' },
    { name: 'SaaSBison', url: 'saasbison.com' },
    { name: 'Startup Vessel', url: 'startupvessel.com' },
    { name: 'ToolPilot.ai', url: 'toolpilot.ai' },
    { name: 'Web Review', url: 'web-review.com' },
    { name: 'Twelve Tools', url: 'twelve.tools' },
    { name: 'Wired Business', url: 'wired.business' },
    { name: 'DeepLaunch', url: 'deeplaunch.io' },
  ];

  for (const link of requiredBacklinks) {
    it(`has backlink to ${link.name} (${link.url})`, () => {
      expect(landingPage).toContain(link.url);
    });
  }

  it('has at least 15 directory backlinks', () => {
    const count = requiredBacklinks.filter(l => landingPage.includes(l.url)).length;
    expect(count).toBeGreaterThanOrEqual(15);
  });

  it('backlinks are dofollow (no rel="nofollow" on directory links)', () => {
    // The links should have rel="noopener" but NOT rel="nofollow"
    // Check that nofollow doesn't appear near directory URLs
    for (const link of requiredBacklinks) {
      const idx = landingPage.indexOf(link.url);
      if (idx === -1) continue;
      // Check the surrounding context (100 chars before) for nofollow
      const context = landingPage.substring(Math.max(0, idx - 100), idx);
      expect(context).not.toContain('nofollow');
    }
  });
});

// =============================================================================
// Analytics — Vercel Analytics, Speed Insights, GA4, Meta Pixel
// =============================================================================

describe('Analytics integration in layout', () => {
  const layout = readFile('app/layout.tsx');

  it('imports Vercel Analytics', () => {
    expect(layout).toContain("from '@vercel/analytics/next'");
  });

  it('renders <Analytics /> component', () => {
    expect(layout).toContain('<Analytics />');
  });

  it('imports Vercel Speed Insights', () => {
    expect(layout).toContain("from '@vercel/speed-insights/next'");
  });

  it('renders <SpeedInsights /> component', () => {
    expect(layout).toContain('<SpeedInsights />');
  });

  it('imports AnalyticsScripts (GA4 + Meta Pixel)', () => {
    expect(layout).toContain('<AnalyticsScripts />');
  });
});

describe('GA4 and Meta Pixel script configuration', () => {
  const analyticsScripts = readFile('components/analytics/analytics-scripts.tsx');

  it('reads GA4 ID from NEXT_PUBLIC_GA4_MEASUREMENT_ID', () => {
    expect(analyticsScripts).toContain('NEXT_PUBLIC_GA4_MEASUREMENT_ID');
  });

  it('reads Meta Pixel ID from NEXT_PUBLIC_META_PIXEL_ID', () => {
    expect(analyticsScripts).toContain('NEXT_PUBLIC_META_PIXEL_ID');
  });

  it('loads Google Tag Manager script', () => {
    expect(analyticsScripts).toContain('googletagmanager.com/gtag/js');
  });

  it('initializes GA4 with gtag config', () => {
    expect(analyticsScripts).toContain('gtag');
    expect(analyticsScripts).toContain('config');
  });

  it('loads Facebook Pixel script', () => {
    expect(analyticsScripts).toContain('fbevents.js');
  });

  it('initializes fbq with init and PageView', () => {
    expect(analyticsScripts).toContain('fbq');
    expect(analyticsScripts).toContain('PageView');
  });

  it('uses dangerouslySetInnerHTML (not template literal children)', () => {
    // Template literal children in Script components get mangled by bundler
    expect(analyticsScripts).toContain('dangerouslySetInnerHTML');
  });
});

// =============================================================================
// SEO — metadata, sitemap, structured data
// =============================================================================

describe('SEO metadata', () => {
  const layout = readFile('app/layout.tsx');
  const landingPage = readFile('app/page.tsx');

  it('has Google Search Console verification', () => {
    expect(layout).toContain('m4IpEgczxr-EE9dSEq8o45oUbe-yLl-WbnkqbKkn7bo');
  });

  it('sets metadataBase to insightreviews.com.au', () => {
    expect(layout).toContain('insightreviews.com.au');
  });

  it('allows indexing and following', () => {
    expect(layout).toContain('index: true');
    expect(layout).toContain('follow: true');
  });

  it('has OpenGraph metadata on landing page', () => {
    expect(landingPage).toContain('openGraph');
  });

  it('has Twitter card metadata on landing page', () => {
    expect(landingPage).toContain('twitter');
  });

  it('has canonical URL', () => {
    expect(landingPage).toContain('canonical');
  });

  it('has JSON-LD structured data', () => {
    expect(landingPage).toContain('application/ld+json');
    expect(landingPage).toContain('schema.org');
  });

  it('has FAQ structured data', () => {
    expect(landingPage).toContain('FAQPage');
  });
});

describe('Sitemap includes all important pages', () => {
  const sitemap = readFile('app/sitemap.ts');

  it('includes landing page', () => {
    expect(sitemap).toContain('baseUrl');
    expect(sitemap).toMatch(/url:\s*baseUrl/);
  });

  it('includes blog posts', () => {
    expect(sitemap).toContain('get-more-google-reviews');
    expect(sitemap).toContain('negative-google-reviews');
    expect(sitemap).toContain('google-review-link');
  });

  it('includes signup page', () => {
    expect(sitemap).toContain('mode=signup');
  });

  it('includes dynamic wall pages', () => {
    expect(sitemap).toContain('/wall/');
  });
});

describe('robots.txt configuration', () => {
  const layout = readFile('app/layout.tsx');

  it('allows all bots to index', () => {
    expect(layout).toContain('index: true');
  });

  it('allows rich snippets', () => {
    expect(layout).toContain("'max-image-preview': 'large'");
    expect(layout).toContain("'max-snippet': -1");
  });
});

# Remaining Marketing & Technical Fixes
*Created: 2026-03-15*

Everything that still needs to be done after Round 1 and Round 2 of landing page fixes.

---

## Status

| # | Task | Status | Details |
|---|------|--------|---------|
| 1 | Vercel Analytics | ✅ DONE | `@vercel/analytics` installed, `<Analytics />` added to layout.tsx |
| 2 | Blog + first post | ✅ DONE | `/blog/get-more-google-reviews` — 1,500+ word SEO post with meta tags, OG tags, CTA |
| 3 | Sitemap.xml + robots.txt | ✅ DONE | Auto-generated via `app/sitemap.ts` + `app/robots.ts`. Blocks /dashboard/ and /api/ |
| 4 | Product demo on landing page | ✅ DONE | Interactive animated phone demo cycling through 4 steps: QR scan → rating → positive redirect → negative private. Auto-plays, clickable step indicators |
| 5 | SendGrid event webhook | ✅ DONE | `app/api/email/events/route.ts` — logs delivered, open, click, bounce, spam_report. Set up in SendGrid: Settings → Event Webhook → URL: https://insightreviews.com.au/api/email/events |
| 6 | Retargeting pixels | BLOCKED | Needs Facebook Pixel ID and Google Ads tag from Tristan |

---

## What Was Built

### Vercel Analytics
- Package: `@vercel/analytics`
- Component: `<Analytics />` in `app/layout.tsx`
- Auto-tracks page views, referrers, geography on Vercel dashboard

### Blog: "How to Get More Google Reviews"
- Route: `/blog/get-more-google-reviews`
- Full SEO metadata + OpenGraph tags
- ~1,500 words covering: QR codes, SMS, workflow integration, responding to reviews, fake reviews warning, Google review link, negative review handling
- CTA at bottom: "Want to automate all of this? → Start Free Trial"
- Added to sitemap.xml

### Sitemap + Robots
- `app/sitemap.ts` — lists homepage, login, blog post
- `app/robots.ts` — allows everything except /dashboard/, /onboarding, /api/
- Points to sitemap URL for Google crawlers

### Interactive Product Demo
- Component: `components/landing/product-demo.tsx`
- 4-step auto-playing animation (2.5s per step):
  1. QR code scanning with loading bar
  2. Star rating selection (4 stars highlighted)
  3. Positive redirect: "Thank you! → Leave a Google Review"
  4. Negative private: "We'll follow up with you directly" (locked icon)
- Clickable step indicators
- Smooth fade-in transitions
- Placed between "How It Works" and "The Numbers" sections

### SendGrid Event Webhook
- Route: `app/api/email/events/route.ts`
- Handles all SendGrid events: delivered, open, click, bounce, spam_report, dropped
- Logs to console (can be extended to database storage)
- GET endpoint for SendGrid URL verification

---

## Still Needs Manual Action (Tristan)

1. **Submit sitemap to Google Search Console** — Go to search.google.com/search-console, verify insightreviews.com.au, submit sitemap URL
2. **Enable SendGrid Event Webhook** — Go to SendGrid dashboard → Settings → Mail Settings → Event Webhook → Set URL to https://insightreviews.com.au/api/email/events → Enable all events
3. **Set up Facebook Pixel** — Create pixel at business.facebook.com, provide pixel ID for embedding
4. **Set up Google Ads tag** — Create conversion tracking tag at ads.google.com, provide tag ID for embedding

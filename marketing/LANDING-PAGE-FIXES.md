# Landing Page & Marketing Fixes
*Created: 2026-03-15*

Based on full audit of landing page, cold emails, and marketing materials.

---

## Round 1 — Completed

### 1. Fix "2 sec" stat → "<30 sec" ✅
### 2. Fix phone mockup — "Sage & Vine Cafe" + 4 stars ✅
### 3. Add founder/trust section + platform logos ✅
### 4. Add "Is this review gating?" FAQ ✅
### 5. Add ROI framing to pricing section ✅
### 6. Condense features 12 → 6 core + chips ✅
### 7. Honest competitor comparison ✅
### 8. Fix Final CTA — urgency, no fake proof ✅
### 9. Clean up pricing feature list ✅
### 10. Add "What if I have a low rating?" FAQ ✅
### 11. Vary CTA copy ✅
### 12. Update Product Bible — QR leads ✅

---

## Round 2 — Completed

### 13. Fix Email 2 & 3 "first_name" bug → fallback to "there" ✅
Both `buildEmail2` and `buildEmail3` in `send-next-batch.js` now gracefully handle missing/null first names.

### 14. Add OpenGraph + Twitter meta tags to layout.tsx ✅
Full OG tags: title, description, image (dashboard screenshot), URL, type. Twitter summary_large_image card. Link previews now work on LinkedIn, WhatsApp, Facebook, iMessage.

### 15. Add generateMetadata to /r/[slug] ✅
Dynamic title: "Leave a Review for {Business Name}". robots: noindex (private review forms shouldn't be indexed).

### 16. Add generateMetadata to /wall/[slug] ✅
Dynamic title: "{Business Name} — Customer Reviews". OG tags for social sharing. SEO-indexable.

### 17. Add lazy loading to dashboard screenshot ✅
Added `loading="lazy"` to the img tag.

### 18. Add footer links (Contact email, Melbourne Australia) ✅
Footer now shows contact email link and "Melbourne, Australia" location.

### 19. Fix wrong domain in onboarding ✅
Changed `insightreviews.com/r/` to `insightreviews.com.au/r/` in slug helper text.

### 20. Upgrade signup page with trust signals ✅
Signup page now shows: branded logo, "Start your 14-day free trial", "No card required", feature chips (QR code collection, Smart routing, Dashboard & analytics).

---

## Still TODO (Not Yet Done)

### Install analytics (Vercel Analytics or Plausible)
Zero visibility into whether cold email recipients visit the site. Critical for measuring ROI.

### Add a lead capture / free tool
Currently the only CTA is full signup. A "Generate your Google review link" free tool could capture emails without requiring commitment.

### Create /blog route + first SEO post
"How to Get More Google Reviews" targets the exact search query for the target market.

### Add sitemap.xml + submit to Google Search Console
Site is invisible to Google right now.

### Set up SendGrid event webhooks
Track opens, clicks, bounces. Know which emails are working.

### Add retargeting pixels
Facebook Pixel + Google Ads tag for when paid ads start.

### Add a product demo video / GIF
15-second screen recording of QR scan → star tap → Google redirect. More convincing than static mockup.

# InsightReviews — Full Project Audit & Fix Plan

**Original audit:** 2026-03-15
**Updated:** 2026-03-15 (post-fix re-audit)
**Audited by:** Claude (code quality, dark mode/UI, SEO/billing/infra agents + Playwright production testing)

---

## Executive Summary

The first audit pass fixed 11 issues: webhook idempotency, query deduplication, rate limiting, trial gaming, dark mode stat cards, hydration error, cron jobs, env vars, SEO indexing, responsiveness, and file cleanup. **765 tests passing, 24 new audit-fix tests added.**

Remaining work is primarily: dark mode completion (layout forces light mode), type safety (`as unknown as` casts), missing security headers, missing Stripe webhook handlers, and SEO improvements.

---

## Status Legend

- ✅ **DONE** — Fixed and deployed
- ⚠️ **MANUAL** — Requires manual action (dashboard/console, not code)
- 🔲 **TODO** — Not yet started

---

## 1. CRITICAL — Fix Immediately

### 1.1 ⚠️ Stripe Payouts Blocked (SHOW STOPPER)
- **Problem:** Stripe payouts paused since Mar 9. Cannot accept real customer payments.
- **Action:** Log into Stripe Dashboard → Account Settings → Upload ABN → Re-enable payouts.

### 1.2 ⚠️ Junk/Test Data on Public Testimonial Wall
- **Problem:** `insightreviews.com.au/wall/hello` shows test reviews: "Bsbbss", "Shjshs", "Ass", "This was Dogshit", etc.
- **Action:** Production Supabase → `reviews` table → filter by `organization_id` for "Johns coffee" → set `is_public = false` on junk entries.

### 1.3 ✅ React Hydration Error on Testimonial Wall
- **Fixed:** Added `suppressHydrationWarning` to date element in `components/testimonials/testimonial-wall.tsx`.
- **Verified:** Playwright confirms 0 console errors on `/wall/hello` after deploy.

### 1.4 ⚠️ SendGrid Email Forwarding Broken
- **Problem:** Inbound parse webhook not forwarding emails to Gmail.
- **Action:** Check SendGrid dashboard for inbound parse configuration. Test `/api/email/inbound` endpoint.

---

## 2. HIGH — Fix This Week

### 2.1 ⚠️ Missing Database Migration on Production (Recurring Issue)
- **Problem:** Migrations can be missed on production.
- **Action:** Always run `npx supabase db push --linked` after adding migrations. Already documented in CLAUDE.md.

### 2.2 ✅ Webhook Idempotency Not Handled
- **Fixed:** Created `webhook_events` table (migration `00023_webhook_idempotency.sql`) with `stripe_event_id` unique constraint. Webhook handler checks for duplicates before processing.
- **Migration pushed to production.**

### 2.3 🔲 Middleware Runs DB Query on Every Dashboard Request
- **Problem:** `middleware.ts:73-77` queries `organization_members` joined with `organizations` on every dashboard navigation.
- **Fix:** Cache org membership and billing state in a cookie with short TTL (5 min).

### 2.4 ✅ Duplicate Supabase Queries in Review/Wall Pages
- **Fixed:** Used `React.cache()` to deduplicate org queries in both `app/r/[slug]/page.tsx` and `app/wall/[slug]/page.tsx`. `generateMetadata()` and page component now share the same cached query.

### 2.5 ✅ In-Memory Rate Limiting Won't Scale
- **Fixed:** Replaced in-memory `Map` with database-backed per-org rate limiting. Counts recent reviews in the `reviews` table within the time window.

### 2.6 ✅ Missing Environment Variables in .env.example
- **Fixed:** Added `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `CRON_SECRET`, `SUPPORT_EMAIL` to `.env.example`.

### 2.7 ✅ Missing Vercel Cron Jobs
- **Fixed:** Added `weekly-digest` (Mondays 9am) and `process-followups` (every 15 min) to `vercel.json`.

### 2.8 ⚠️ Google OAuth Redirect URI Not Verified
- **Action:** Verify in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs includes `https://insightreviews.com.au/api/integrations/google/callback`.

### 2.9 🔲 Missing Stripe Webhook: `invoice.payment_action_required` (NEW)
- **Problem:** Webhook handler doesn't handle this event. When a payment requires 3D Secure or other customer action, the app has no notification mechanism.
- **File:** `app/api/stripe/webhook/route.ts:46-169`
- **Severity:** HIGH

### 2.10 🔲 Sitemap Missing Dynamic Routes (NEW)
- **Problem:** `app/sitemap.ts` only has hard-coded static routes. Missing all `/wall/{slug}` testimonial pages and hard-codes blog URLs instead of querying.
- **File:** `app/sitemap.ts:1-44`
- **Severity:** HIGH

---

## 3. MEDIUM — Fix Within 2 Weeks

### 3.1 Dark Mode — Incomplete (~35% Done)

Theme infrastructure exists but the root layout forces light mode and many components use hardcoded colors.

#### CRITICAL: Root layout forces light mode
| Issue | File | Line(s) | Status |
|-------|------|---------|--------|
| `colorScheme: 'light'` on html tag | `app/layout.tsx` | 39 | 🔲 |
| `<meta name="color-scheme" content="light only" />` | `app/layout.tsx` | 41 | 🔲 |
| `background-color: #ffffff !important` CSS override | `app/layout.tsx` | 43-44 | 🔲 |
| `backgroundColor: '#ffffff'` on body | `app/layout.tsx` | 47 | 🔲 |

#### Component hardcoded colors
| Issue | File | Line(s) | Status |
|-------|------|---------|--------|
| Blog pages hardcoded `white` / `#eff6ff` bg | `app/blog/*/page.tsx` | 23, 173/229 | 🔲 |
| Sidebar hardcoded gradients in getPlanDisplay | `components/layout/sidebar.tsx` | 39-50, 69, 149 | 🔲 |
| Support form hardcoded category colors | `components/support/support-form.tsx` | 16-20, 148, 170, 174 | 🔲 |
| Dashboard stats hero gradient hardcoded | `components/dashboard/dashboard-stats.tsx` | 157 | 🔲 |
| Dashboard stats star/value colors hardcoded | `components/dashboard/dashboard-stats.tsx` | 223, 232-233, 258, 469-470 | 🔲 |
| Dashboard stats — metric card gradients | `components/dashboard/dashboard-stats.tsx` | 209-248 | ✅ |
| NPS gauge `getNpsColor()` returns hardcoded hex | `components/dashboard/nps-gauge.tsx` | 16-18, 100-101, 136-138 | 🔲 |
| Review form extensive hardcoded colors | `components/review-form/review-form-content.tsx` | 67-83, 152, 206, 425-428, 526, 568, 856, 1028 | 🔲 |
| Review form `border: '3px solid white'` | `components/review-form/review-form-content.tsx` | 856, 1065 | 🔲 |
| Collect form hardcoded gradients | `components/collect/collect-form.tsx` | 190, 301, 343 | 🔲 |
| Product demo hardcoded light colors | `components/landing/product-demo.tsx` | 46, 60, 80, 83, 106, 146, 174 | 🔲 |

**Fix approach:** Remove forced light mode from `app/layout.tsx` first. Then replace hardcoded hex colors with `theme.palette.*` tokens. Use `theme.palette.mode === 'dark'` conditionals where needed.

### 3.2 🔲 Performance — Review Form Component Too Large
- **Problem:** `components/review-form/review-form-content.tsx` is 1,133 lines with inline CSS keyframe animations, no memoization, and `<Box component="img">` instead of `next/image`.
- **Fix:** Break into sub-components. Extract animations. Use `next/image` for logo.

### 3.3 🔲 Performance — Missing Suspense Boundaries
- **Problem:** Dashboard pages run 4-5 parallel queries with no Suspense boundaries, blocking entire page render.
- **Files:** `app/dashboard/page.tsx`, `app/dashboard/reviews/page.tsx`

### 3.4 🔲 Type Safety — Excessive `as unknown as` Casts
- **Problem:** 5+ instances of unsafe double type casting throughout the codebase.
- **Locations:**
  - `middleware.ts:89`
  - `app/dashboard/layout.tsx:24`
  - `app/dashboard/page.tsx:63`
  - `app/dashboard/integrations/page.tsx:35`
  - `app/dashboard/testimonials/page.tsx:52-53`
- **Fix:** Generate Supabase types with `npx supabase gen types typescript` and use them in queries.

### 3.5 ✅ Trial Gaming Vulnerability
- **Fixed:** Now checks `stripe_customer_id` existence — if a customer already has a Stripe record, they cannot get a new trial regardless of `billing_plan` state.

### 3.6 ⚠️ Missing GST/Tax Collection
- **Problem:** Australia requires GST on SaaS sales. No tax handling configured in Stripe.
- **Action:** Enable Stripe Tax or add GST to the $79 price. Consult accountant.

### 3.7 🔲 Missing Indexes on Frequently Queried Columns
- **Problem:** `reviews.customer_email` and `sms_log.to_phone` lack indexes.
- **Fix:** Create migration adding indexes.

### 3.8 🔲 Twilio — No Delivery Status Tracking
- **Problem:** SMS sent but no webhook to track delivery status. `sms_log` status never updates.
- **File:** `lib/twilio/client.ts`

### 3.9 Responsiveness Issues
| Issue | File | Status |
|-------|------|--------|
| Support form categories don't stack on <360px | `components/support/support-form.tsx:156` | 🔲 |
| Review table minWidth 600px too large for phones | `components/reviews/review-list.tsx:571` | 🔲 |
| Product demo phone frame overflow on tiny screens | `components/landing/product-demo.tsx:43` | ✅ |

### 3.10 ✅ Review Form Pages Marked as No-Index
- **Fixed:** Changed `robots: { index: false }` to `robots: { index: true, follow: true }` in `app/r/[slug]/page.tsx`.

### 3.11 🔲 Missing Security Headers (NEW)
- **Problem:** `next.config.ts` is missing important security headers:
  - `Strict-Transport-Security` (enforces HTTPS)
  - `Permissions-Policy` (controls browser features)
  - `Content-Security-Policy` (prevents XSS/injection)
- **Currently only has:** `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- **File:** `next.config.ts:4-15`

### 3.12 🔲 Missing Stripe Webhook: `customer.subscription.trial_will_end` (NEW)
- **Problem:** No handler for trial expiry warning. Customers get no notification 3 days before trial ends, leading to churn surprise.
- **File:** `app/api/stripe/webhook/route.ts`

### 3.13 🔲 Missing Email Unsubscribe Header (NEW)
- **Problem:** `sendEmail()` in `lib/email/client.ts` doesn't include `List-Unsubscribe` or `List-Unsubscribe-Post` headers. Required by Gmail/Outlook and CAN-SPAM/GDPR.
- **File:** `lib/email/client.ts:11-40`

### 3.14 🔲 Missing OG/Twitter Cards on Review & Wall Pages (NEW)
- **Problem:** `/r/[slug]` is missing Open Graph tags and Twitter card metadata. `/wall/[slug]` is missing Twitter card and OG image/URL.
- **Files:** `app/r/[slug]/page.tsx:40-50`, `app/wall/[slug]/page.tsx:38-52`

---

## 4. LOW — Backlog

### 4.1 Code Quality
- [ ] Replace `console.error()` with structured logging across all API routes (15+ instances in webhook, submit, sms, email, integrations, checkout, sync routes)
- [ ] Fix `BillingSuccessSync` — unused `useRef` import
- [ ] Replace `<Box component="img">` with `next/image` in review form
- [ ] Centralize box shadow definitions in theme
- [ ] Add missing `aria-label` attributes to icon buttons in header
- [ ] Fix unused `internalCount` variable in `components/reviews/review-list.tsx:431`

### 4.2 Email & SMS
- [ ] Add SendGrid retry logic for transient failures (429, 5xx)
- [ ] Add unsubscribe mechanism to emails (CAN-SPAM/GDPR compliance)
- [ ] Validate phone numbers with `libphonenumber-js` before Twilio send (current validation just strips spaces and adds country code — "abc123" would pass through)
- [ ] Queue SMS in `sms_log` with status='queued', process async
- [ ] Add Twilio SMS retry logic for transient failures

### 4.3 Billing
- [ ] Validate portal return URL is same-origin to prevent open redirect (`app/api/stripe/create-portal/route.ts:39-43`)
- [ ] Clear `subscription_ends_at` in `invoice.payment_succeeded` handler when subscription resumes
- [ ] Add `requireBilling()` check to integration routes (`/api/integrations/sync`, `/api/integrations/toggle-review-form`, `/api/wall/save-config`)

### 4.4 Database
- [ ] Rename duplicate RLS policy names across tables for easier debugging
- [ ] Add explicit INSERT/UPDATE/DELETE RLS policies on `organization_integrations` and `external_reviews`
- [ ] Change default `billing_plan` in migration 00001 from `'trial'` to `'pending'` (create new migration)

### 4.5 SEO
- [ ] Add Article schema (JSON-LD) to blog posts
- [ ] Add internal linking between blog posts
- [ ] Add blog index page at `/blog`
- [ ] Add canonical URLs to `/r/[slug]` and `/wall/[slug]` pages
- [ ] Update AggregateRating on homepage from placeholder "1 review" to real count
- [ ] Add "Featured In" badge section to homepage footer
- [ ] Add testimonial wall pages to sitemap dynamically

### 4.6 Error Handling (NEW)
- [ ] Add error checking to parallel `Promise.all()` queries in `app/dashboard/page.tsx:34-61`
- [ ] Add error checking to parallel queries in `app/dashboard/reviews/page.tsx:21-43`
- [ ] Check for errors on `review_requests` status update in `app/api/reviews/submit/route.ts:146-149`
- [ ] Validate URL redirects in `app/api/integrations/google/callback/route.ts` (open redirect risk if `siteUrl` is compromised)

---

## 5. Marketing & SEO

### Current Status
- **Revenue:** $0 MRR, 0 paying customers
- **Cold emails:** 117 sent, 0 replies (0% conversion)
- **Directory submissions:** 51 (25+ pending verification)
- **Blog posts:** 2 (excellent quality, zero promotion)
- **In-person sales:** Not started

### Strategic Recommendations

#### STOP These (Wasting Time)
- New directory submissions (51 is enough — verify existing ones instead)
- Additional Reddit/Quora posting (diminishing returns)
- Product Hunt / Hacker News (wait until you have customers)

#### DOUBLE DOWN On These
1. **In-person sales blitz** — Walk into 50+ Melbourne businesses this month. Podium ($3B) started this way. This is the #1 priority.
2. **Fix Stripe payouts** — Can't accept money without this.
3. **Cold email follow-ups** — Send Email 2 and 3 to existing 117 targets. A/B test subject lines.
4. **Directory verification** — Complete Capterra, G2, SaaSHub, AlternativeTo verifications. Fix email forwarding first.
5. **Blog promotion** — Share existing 2 posts on social media. Create Twitter threads from each post.

---

## 6. File Cleanup

### ✅ DONE — Root Screenshots
All 47 root-level PNG screenshots deleted from git tracking.

### ✅ DONE — Duplicate Marketing Docs
Deleted: `marketing/DIRECTORY-LISTINGS.md`, `marketing/advertising-agent/CONTENT-STATUS.md`, `marketing/advertising-agent/DIRECTORY-STATUS.md`

### 🔲 DELETE — Local Artifacts (Not in git, disk space only)
```
test-results/          # ~5 MB old Playwright artifacts
.playwright-mcp/       # ~46 MB browser cache
```

### 🔲 CREATE — Missing Files
| File | Purpose |
|------|---------|
| `README.md` (root) | Basic project info, setup instructions, link to CLAUDE.md |

---

## 7. What's Working Well

These areas are solid and should not be changed:

- **Product architecture** — Clean server/client component separation, proper RLS, multi-tenant isolation
- **Review form flow** — Star rating → comment → smart routing works flawlessly end-to-end
- **Admin billing bypass** — Well-tested, applied consistently across all routes via `checkReviewPageAccess()`
- **Landing page** — Compelling copy, good visual hierarchy, FAQ schema, structured data
- **Blog content** — Excellent quality, well-structured, Australia-focused
- **Auth flow** — Magic link → PKCE → session → redirect works cleanly
- **Testimonial wall** — JSON-LD schema, responsive layout, customizable config, no hydration errors ✅
- **Stripe integration** — Webhook handling with idempotency ✅, checkout, portal, cancellation, trial gaming prevention ✅
- **Test coverage** — 765 tests passing ✅, good coverage of billing, routing, admin bypass, and audit fixes
- **Query efficiency** — `React.cache()` deduplication on public pages ✅, DB-backed rate limiting ✅
- **Deployment workflow** — Deploy verification step documented in CLAUDE.md ✅

---

## Fix Priority Order (Updated)

### Already Done ✅
1. ~~Fix React hydration error on wall page~~ ✅
2. ~~Add webhook idempotency table~~ ✅
3. ~~Fix duplicate queries in review/wall pages~~ ✅
4. ~~Replace in-memory rate limiting~~ ✅
5. ~~Add missing env vars to `.env.example`~~ ✅
6. ~~Add missing Vercel cron jobs~~ ✅
7. ~~Fix trial gaming vulnerability~~ ✅
8. ~~Enable indexing on review pages~~ ✅
9. ~~Fix product demo responsiveness~~ ✅
10. ~~Delete root PNGs and stale marketing docs~~ ✅
11. ~~Dashboard stat cards dark mode~~ ✅

### Next Up (in priority order)
1. ⚠️ Fix Stripe payouts (Stripe Dashboard — upload ABN)
2. ⚠️ Clean junk data from production testimonial wall (Supabase SQL)
3. ⚠️ Fix SendGrid email forwarding (SendGrid dashboard)
4. ⚠️ Verify Google OAuth redirect URI (Google Cloud Console)
5. 🔲 Add missing Stripe webhook handlers (payment_action_required, trial_will_end)
6. 🔲 Add security headers to next.config.ts (HSTS, Permissions-Policy)
7. 🔲 Fix sitemap to include dynamic wall/review pages
8. 🔲 Add OG/Twitter card metadata to review and wall pages
9. 🔲 Add email unsubscribe headers (CAN-SPAM/GDPR)
10. 🔲 Remove forced light mode from layout.tsx (prerequisite for dark mode)
11. 🔲 Dark mode pass — replace hardcoded colors across all components
12. 🔲 Generate Supabase types to eliminate `as unknown as` casts
13. 🔲 Add Suspense boundaries to dashboard pages
14. 🔲 Break up review form component
15. 🔲 Cache middleware billing check in cookie
16. 🔲 Remaining items from sections 3 and 4

---

*Updated after fix pass: 11 issues resolved, 24 new tests added. Re-audited with code quality, dark mode/UI, and SEO/billing/infra agents.*

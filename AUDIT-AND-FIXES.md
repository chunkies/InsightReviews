# InsightReviews — Full Project Audit & Fix Plan

**Date:** 2026-03-15
**Audited by:** Claude (6 domain-specific agents + Playwright production testing)

---

## Executive Summary

The product is well-built with solid architecture, but has critical operational blockers (Stripe payouts paused, junk data on public pages), several performance issues, incomplete dark mode, and a marketing strategy that needs refocusing. This document lists every issue found, prioritised by severity.

---

## Table of Contents

1. [CRITICAL — Fix Immediately](#1-critical--fix-immediately)
2. [HIGH — Fix This Week](#2-high--fix-this-week)
3. [MEDIUM — Fix Within 2 Weeks](#3-medium--fix-within-2-weeks)
4. [LOW — Backlog](#4-low--backlog)
5. [Marketing & SEO](#5-marketing--seo)
6. [File Cleanup](#6-file-cleanup)
7. [What's Working Well](#7-whats-working-well)

---

## 1. CRITICAL — Fix Immediately

### 1.1 Stripe Payouts Blocked (SHOW STOPPER)
- **Problem:** Stripe payouts paused since Mar 9. Incoming charges will be blocked at AUD $3,896.14. Cannot accept real customer payments.
- **Root Cause:** Missing business verification document (ABN or business registration cert).
- **Fix:** Log into Stripe Dashboard → Account Settings → Upload ABN → Re-enable payouts.
- **Impact:** Cannot convert trials to paid customers.

### 1.2 Junk/Test Data on Public Testimonial Wall
- **Problem:** `insightreviews.com.au/wall/hello` shows test reviews publicly: "Bsbbss", "Shjshs", "Ass", "This was Dogshit", "asdfasdf", etc. alongside real demo reviews.
- **Root Cause:** Test submissions during development were never cleaned up. The `is_public` flag auto-publishes positive reviews.
- **Fix:** Delete or un-publish junk reviews from the `reviews` table in production Supabase. Set `is_public = false` on all test entries.
- **File:** Production Supabase → `reviews` table → filter by `organization_id` for "Johns coffee" → delete/unpublish junk.

### 1.3 React Hydration Error on Testimonial Wall
- **Problem:** Console error `Minified React error #418` on `/wall/hello` — SSR/client HTML mismatch.
- **Root Cause:** Server-rendered HTML differs from client hydration (likely date formatting or dynamic content).
- **Fix:** Investigate `components/testimonials/testimonial-wall.tsx` for date rendering or conditional logic that differs between server and client. Use `suppressHydrationWarning` only as last resort.
- **File:** `components/testimonials/testimonial-wall.tsx`

### 1.4 SendGrid Email Forwarding Broken
- **Problem:** Inbound parse webhook not forwarding emails to Gmail. Directory verification emails (G2, Capterra, Peerlist) going to a black hole.
- **Root Cause:** Inbound email forwarding endpoint may not be receiving events, or Gmail forwarding rule misconfigured.
- **Fix:**
  1. Verify `SENDGRID_API_KEY` is in Vercel production env (confirmed present)
  2. Test inbound parse webhook at `/api/email/inbound` with a test email
  3. Check SendGrid dashboard for inbound parse configuration
  4. Confirm forwarding to `sly.tristan1@gmail.com` works
- **File:** `app/api/email/inbound/route.ts`

---

## 2. HIGH — Fix This Week

### 2.1 Missing Database Migration on Production (Recurring Issue)
- **Problem:** Migration `00022_review_form_text.sql` was missing from production, causing the QR code 404 bug. This pattern will repeat.
- **Fix:** Add a CI/deployment check that runs `npx supabase db push --linked --dry-run` before every deploy to detect unapplied migrations.
- **Prevention:** Add to CLAUDE.md workflow: always run `npx supabase db push --linked` after adding migrations.

### 2.2 Webhook Idempotency Not Handled
- **Problem:** Stripe webhook handler does not check for duplicate events. If Stripe retries a webhook, the same DB updates execute multiple times.
- **Fix:** Create a `webhook_events` table with `stripe_event_id` unique constraint. Check before processing.
- **File:** `app/api/stripe/webhook/route.ts`
- **Migration needed:** New migration to create `webhook_events` table.

### 2.3 Middleware Runs DB Query on Every Dashboard Request
- **Problem:** `middleware.ts` lines 73-77 query `organization_members` joined with `organizations` on every single dashboard page navigation.
- **Fix:** Cache org membership and billing state in a cookie or session token with a short TTL (5 min). Only re-query when cookie expires.
- **File:** `middleware.ts:73-77`

### 2.4 Duplicate Supabase Queries in Review Page
- **Problem:** `/r/[slug]` page queries `organizations` twice — once in `generateMetadata()` and again in the page component.
- **Fix:** Use Next.js `fetch` deduplication or cache the result. Same issue exists in `/wall/[slug]`.
- **Files:** `app/r/[slug]/page.tsx:32-36, 52-56`, `app/wall/[slug]/page.tsx:30-34, 102-106`

### 2.5 In-Memory Rate Limiting Won't Scale
- **Problem:** `app/api/reviews/submit/route.ts` uses in-memory `Map` for rate limiting. Resets on every deployment and doesn't work across multiple serverless instances.
- **Fix:** Move to database-backed rate limiting (insert IP + timestamp into a table, query count) or use Vercel's built-in rate limiting.
- **File:** `app/api/reviews/submit/route.ts:7-23`

### 2.6 Missing Environment Variables in .env.example
- **Problem:** Several env vars used in code but not documented in `.env.example`.
- **Missing vars:** `CRON_SECRET`, `SUPPORT_EMAIL`, `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME`, `YELP_API_KEY`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- **Fix:** Add all missing vars to `.env.example` with comments.
- **File:** `.env.example`

### 2.7 Missing Vercel Cron Jobs
- **Problem:** `vercel.json` only defines the sync-integrations cron. Missing `weekly-digest` and `process-followups` crons.
- **Fix:** Add missing cron definitions to `vercel.json`.
- **File:** `vercel.json`

### 2.8 Google OAuth Redirect URI Not Verified
- **Problem:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are now set in Vercel, but the Google Cloud Console may not have `https://insightreviews.com.au/api/integrations/google/callback` as an authorized redirect URI.
- **Fix:** Verify in Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs.

---

## 3. MEDIUM — Fix Within 2 Weeks

### 3.1 Dark Mode — Incomplete (30% Done)
Theme infrastructure exists but many components override with hardcoded colors.

| Issue | File | Line(s) |
|-------|------|---------|
| Root layout forces `colorScheme: 'light'` | `app/layout.tsx` | 39, 41-44 |
| Blog pages hardcoded white background | `app/blog/*/page.tsx` | 23, 61 |
| Sidebar hardcoded gradient | `components/layout/sidebar.tsx` | 69, 215 |
| Support form hardcoded gradient + disabled colors | `components/support/support-form.tsx` | 106, 264-278 |
| Dashboard stats hardcoded hex colors | `components/dashboard/dashboard-stats.tsx` | 205, 215, 238, 248 |
| NPS gauge hardcoded dark mode gradient | `components/dashboard/nps-gauge.tsx` | 99-101 |
| Review form platform colors hardcoded | `components/review-form/review-form-content.tsx` | 525-526 |
| Collect form hardcoded white overlay | `components/collect/collect-form.tsx` | 201 |
| Box shadows use `rgba(0,0,0,...)` everywhere | Multiple files | — |

**Fix approach:** Replace all hardcoded hex colors with `theme.palette.*` tokens. Use `theme.palette.mode === 'dark'` conditionals where needed. Remove `colorScheme: 'light'` from layout.

### 3.2 Performance — Review Form Component Too Large
- **Problem:** `components/review-form/review-form-content.tsx` is 1,100+ lines with inline CSS keyframe animations, no memoization, and `<Box component="img">` instead of `next/image`.
- **Fix:** Break into smaller sub-components. Extract animations to separate file. Use `next/image` for logo. Add `React.memo` where appropriate.
- **File:** `components/review-form/review-form-content.tsx`

### 3.3 Performance — Missing Suspense Boundaries
- **Problem:** Dashboard pages run 4-5 parallel queries with no Suspense boundaries, blocking entire page render.
- **Fix:** Wrap data-dependent sections in `<Suspense fallback={<Skeleton />}>`. Add skeleton loaders.
- **Files:** `app/dashboard/page.tsx`, `app/dashboard/reviews/page.tsx`

### 3.4 Type Safety — Excessive `as unknown as` Casts
- **Problem:** 15+ instances of unsafe `as unknown as` type casting throughout the codebase instead of proper Supabase type generation.
- **Fix:** Generate Supabase types with `npx supabase gen types typescript` and use them in queries.
- **Files:** `middleware.ts:89`, `app/dashboard/page.tsx:63`, `app/r/[slug]/page.tsx:24-26`, `app/dashboard/testimonials/page.tsx:52-53`

### 3.5 Trial Gaming Vulnerability
- **Problem:** Trial detection uses `billing_plan === 'pending'` check. If a cancelled user's org gets reset to 'pending' state, they get a new 14-day trial.
- **Fix:** Check for existence of `stripe_customer_id` instead — if customer already exists in Stripe, no trial regardless of plan state.
- **File:** `app/api/stripe/create-checkout/route.ts:62-70`

### 3.6 Missing GST/Tax Collection
- **Problem:** Australia requires GST on SaaS sales. No tax handling configured in Stripe.
- **Fix:** Enable Stripe Tax or add GST to the $79 price. Consult accountant for ATO compliance.

### 3.7 Missing Indexes on Frequently Queried Columns
- **Problem:** `reviews.customer_email` and `sms_log.to_phone` lack indexes but are used in lookups.
- **Fix:** Create migration adding indexes.

### 3.8 Twilio — No Delivery Status Tracking
- **Problem:** SMS sent but no webhook configured to track delivery status (delivered/failed/bounced). `sms_log` status never updates after initial send.
- **Fix:** Configure Twilio status callback URL. Add endpoint to receive delivery updates.
- **File:** `lib/twilio/client.ts`

### 3.9 Responsiveness Issues
| Issue | File | Details |
|-------|------|---------|
| Support form categories don't stack on <360px | `components/support/support-form.tsx:156` | Change to `repeat(1, 1fr)` on xs |
| Review table no horizontal scroll on mobile | `components/reviews/review-list.tsx:620` | Wrap in `overflow-x: auto` |
| Product demo phone frame too wide on tiny screens | `components/landing/product-demo.tsx:43` | Reduce xs width |

### 3.10 Review Form Pages Marked as No-Index
- **Problem:** `/r/[slug]` pages have `robots: { index: false }` — hiding potentially valuable SEO pages.
- **Fix:** Change to `index: true` for public review form pages. These are SEO goldmines (business name + reviews).
- **File:** `app/r/[slug]/page.tsx:42`

---

## 4. LOW — Backlog

### 4.1 Code Quality
- [ ] Remove `console.error()` calls from error boundaries (use structured logging)
- [ ] Fix `BillingSuccessSync` — unused `useRef` import
- [ ] Replace `<Box component="img">` with `next/image` in review form
- [ ] Centralize box shadow definitions in theme
- [ ] Add missing `aria-label` attributes to icon buttons in header
- [ ] Add Permissions-Policy security header to `next.config.ts`

### 4.2 Email & SMS
- [ ] Add SendGrid retry logic for transient failures (429, 5xx)
- [ ] Add unsubscribe mechanism to emails (CAN-SPAM/GDPR compliance)
- [ ] Validate phone numbers with `libphonenumber-js` before Twilio send
- [ ] Queue SMS in `sms_log` with status='queued', process async

### 4.3 Billing
- [ ] Add missing webhook event handlers (`invoice.payment_action_required`, `customer.subscription.trial_will_end`)
- [ ] Add `requireBilling()` check to integration routes (`/api/integrations/sync`, `/api/integrations/toggle-review-form`, `/api/wall/save-config`)
- [ ] Validate portal return URL is same-origin to prevent open redirect

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
- [ ] Add "Featured In" badge section to homepage footer (required by 10+ directory verifications)
- [ ] Add testimonial wall pages to sitemap

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

### Cold Email Issues
- 0% reply rate suggests wrong audience, bad timing, or deliverability issues
- Consider: shorter subject lines, different send times, warm-up domain further
- Math: 100 emails → 5 replies → 2 demos → 0.4 customers. Need 20,000 emails for 80 customers at this rate. In-person sales are 10x more efficient.

---

## 6. File Cleanup

### DELETE — Root Screenshots (~5.5 MB, 42 PNG files)
All are dev artifacts not referenced anywhere. Already covered by `*.png` gitignore but tracked in git history.
```
dashboard-full.png, mobile-*.png (15 files), prod-*.png (3 files),
pricing-*.png (2 files), review-*.png (3 files), tablet-*.png (2 files),
testimonial-wall.png
```

### DELETE — Duplicate/Stale Marketing Docs
| File | Reason |
|------|--------|
| `marketing/DIRECTORY-LISTINGS.md` | Duplicate of `SUBMISSION-PROGRESS.md` |
| `marketing/advertising-agent/CONTENT-STATUS.md` | Stale (Mar 13), duplicates TODO.md |
| `marketing/advertising-agent/DIRECTORY-STATUS.md` | Stale (Mar 13), duplicates SUBMISSION-PROGRESS.md |

### DELETE — Local Artifacts (Already Gitignored)
```
test-results/          # ~5 MB old Playwright artifacts
.playwright-mcp/       # ~45 MB browser cache
```

### CREATE — Missing Files
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
- **Testimonial wall** — JSON-LD schema, responsive layout, customizable config
- **Stripe integration** — Webhook handling, checkout, portal, cancellation all work correctly
- **Test coverage** — 732 tests passing, good coverage of billing, routing, and admin bypass logic
- **Deployment workflow** — Vercel ignoreCommand saves build minutes, conventional commits, quality gates

---

## Fix Priority Order

If tackling one thing at a time, do them in this order:

1. Fix Stripe payouts (1 hour, in Stripe dashboard)
2. Clean junk data from production testimonial wall (30 min, SQL)
3. Fix SendGrid email forwarding (2 hours)
4. Add missing env vars to `.env.example` (30 min)
5. Add missing Vercel cron jobs (15 min)
6. Verify Google OAuth redirect URI in Cloud Console (15 min)
7. Fix React hydration error on wall page (1-2 hours)
8. Add webhook idempotency table (2 hours)
9. Fix duplicate queries in review/wall pages (1 hour)
10. Dark mode hardcoded colors pass (4-6 hours)
11. Break up review form component (3-4 hours)
12. Add Suspense boundaries to dashboard (2-3 hours)
13. Delete root PNG files and stale marketing docs (30 min)
14. Remaining items from sections 3 and 4

---

*Generated from 6 parallel audit agents covering: code quality & performance, Stripe billing, SEO & marketing, infrastructure & services, UI/dark mode/responsiveness, and file cleanup. Production tested with Playwright MCP.*

# InsightReviews — Comprehensive Application Audit

**Date:** 2026-03-11
**Audited by:** 5 parallel AI agents (UI/UX, Features, Pricing, Backend, User Flows)

---

## Table of Contents

1. [Critical Issues (Fix Before Selling)](#1-critical-issues)
2. [UI/UX Inconsistencies](#2-uiux-inconsistencies)
3. [Feature Duplication & Confusion](#3-feature-duplication--confusion)
4. [Missing Features (Expected at $79/mo)](#4-missing-features)
5. [Broken User Flows](#5-broken-user-flows)
6. [Security & Backend Issues](#6-security--backend-issues)
7. [Pricing Update — Every File That Needs Changing](#7-pricing-update-plan)
8. [Product Improvements to Help Sell](#8-product-improvements-to-help-sell)
9. [Implementation Priority](#9-implementation-priority)

---

## 1. Critical Issues

These MUST be fixed before charging $79/mo:

### 1.1 New orgs created with 'pending' billing, not 'trial'
- **File:** `app/api/onboarding/create/route.ts` line 71
- **Problem:** Sets `billing_plan: 'pending'` — user is immediately blocked from dashboard and redirected to `/subscribe`. CLAUDE.md says "14-day free trial, no lock-in" but users can't try the product without paying.
- **Fix:** Set `billing_plan: 'trial'` and `trial_ends_at: NOW() + 14 days` at onboarding completion. Let users explore before asking for payment.

### 1.2 Smart routing uses hardcoded threshold, not org's setting
- **File:** `components/review-form/review-form-content.tsx` line 256
- **Problem:** Public review form doesn't use the org's `positive_threshold` setting. If a business sets threshold to 3, reviews with rating=3 still get routed as negative.
- **Fix:** Pass `positive_threshold` from the page's org query down to the review form component.

### 1.3 Manual platforms don't appear on public review form
- **File:** `app/r/[slug]/page.tsx` lines 52-67
- **Problem:** Only fetches `organization_integrations` (connected OAuth platforms). Manual platforms from the `review_platforms` table (added in Settings) never show on the customer-facing form.
- **Fix:** Also query `review_platforms` and merge with connected integrations on the public form.

### 1.4 Cron auth check allows unauthenticated access
- **File:** `app/api/cron/process-followups/route.ts` line 12
- **Problem:** Uses `if (cronSecret && ...)` — if `CRON_SECRET` env var is unset, the check is silently skipped and the endpoint is publicly accessible.
- **Fix:** Change to `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)` (matching `sync-integrations` route).

### 1.5 No rate limiting on public review submission
- **File:** `app/api/reviews/submit/route.ts`
- **Problem:** Public endpoint with no auth — bots can spam thousands of fake reviews.
- **Fix:** Add IP-based rate limiting (e.g., 10 submissions per IP per hour).

### 1.6 Photo upload accepts any org ID without validation
- **File:** `app/api/reviews/upload-photo/route.ts` lines 12-46
- **Problem:** Public endpoint accepts `orgId` from client. Attacker can upload files to any org's storage bucket.
- **Fix:** Require a signed token or handle photo upload within the review submission endpoint.

---

## 2. UI/UX Inconsistencies

### 2.1 Platform badge/styling defined in two places
- **File 1:** `components/reviews/review-list.tsx` lines 54-64 — `PLATFORM_BADGE`
- **File 2:** `components/integrations/integrations-panel.tsx` lines 17-45 — `PLATFORM_INFO`
- **Fix:** Extract to `lib/utils/constants.ts` as a shared `PLATFORM_CONFIG` object.

### 2.2 Inconsistent card padding across pages
- `components/dashboard/dashboard-stats.tsx` — uses `p: 2.5` and `p: 3` mixed
- `components/reviews/review-list.tsx` — uses `p: 2.5`
- `components/testimonials/testimonial-manager.tsx` — uses `p: 3`
- **Fix:** Standardize on `p: 3` for all cards.

### 2.3 Three different error display patterns
- `components/auth/login-form.tsx` — MUI `Alert` component
- `components/collect/collect-form.tsx` — `Typography` with color
- `components/onboarding/onboarding-wizard.tsx` — `Typography` with color
- **Fix:** Use MUI `Alert` consistently everywhere.

### 2.4 Inconsistent notification patterns
- `components/reviews/review-list.tsx` — uses `Snackbar` directly
- `components/collect/collect-form.tsx` — uses `showSnackbar` from provider
- **Fix:** Use `SnackbarProvider` everywhere, remove direct `Snackbar` usage.

### 2.5 StatusChip component exists but unused
- **File:** `components/shared/status-chip.tsx` — dedicated component
- **Problem:** Review status chips use raw MUI `Chip` instead of `StatusChip`
- **Fix:** Replace all status-related `Chip` usage with `StatusChip`.

### 2.6 Missing accessibility labels
- Star ratings in `dashboard-stats.tsx`, `review-list.tsx`, `testimonial-wall.tsx` lack `aria-label`
- Icon-only buttons in `review-list.tsx` (respond, toggle, share) lack `aria-label`
- **Fix:** Add `aria-label` to all interactive star ratings and icon buttons.

### 2.7 Table not mobile-friendly below 600px
- **File:** `components/reviews/review-list.tsx` line 571
- `minWidth: { xs: 600 }` forces horizontal scroll on phones
- **Fix:** Switch to card layout on mobile (`xs`) breakpoint.

### 2.8 Billing shows in sidebar for staff (but page blocks them)
- **File:** `components/layout/sidebar.tsx` lines 17-26 — same nav for all roles
- **File:** `app/dashboard/billing/page.tsx` line 18 — redirects non-owners
- **Fix:** Filter `navItems` based on user role, hide Billing for staff.

---

## 3. Feature Duplication & Confusion

### 3.1 Orphaned `UnifiedReviewList` component (dead code)
- **File:** `components/integrations/unified-review-list.tsx` (382 lines)
- **Problem:** Not imported anywhere after the reviews merge. Contains duplicate sync logic.
- **Fix:** Delete this file entirely.

### 3.2 Platform visibility toggle in wrong place
- **Settings page** (`components/settings/settings-form.tsx` lines 293-408) shows "Connected Integrations" with `show_on_review_form` status — but it's READ-ONLY
- **Testimonials page** (`components/testimonials/review-experience-form.tsx` lines 71-206) has the actual toggle switches
- **Problem:** User sees the setting in Settings but has to go to Testimonials to change it.
- **Fix:** Move `show_on_review_form` toggles to the Integrations page where platforms are managed. Remove the readonly display from Settings.

### 3.3 Settings scattered across 3 pages
Current layout confuses users:

| Setting | Current Location | Should Be |
|---------|-----------------|-----------|
| Business profile | Settings | Settings |
| Platform URLs (manual) | Settings | Settings |
| Notification prefs | Settings | Settings |
| Webhook config | Settings | Settings |
| SMS template | Settings | Settings |
| `show_on_review_form` toggle | Testimonials → Review Experience | Integrations |
| Thank you page messages | Testimonials → Review Experience | Settings → Review Experience |
| Auto follow-up | Testimonials → Review Experience | Settings → Notifications |
| Coupon/discount | Testimonials → Review Experience | Settings → Review Experience |
| Wall customization | Testimonials → Customize Design | Testimonials (keep) |
| Embed code | Testimonials → Manage & Share | Testimonials (keep) |

**Fix:** Consolidate. Settings gets all business config + notifications + review experience. Testimonials keeps wall customization + embed code only.

### 3.4 Two separate platform systems (manual vs connected)
- `review_platforms` table — manual URL entry in Settings
- `organization_integrations` table — OAuth connections in Integrations
- **Problem:** Different UIs, different tables, different behavior. Confusing for users.
- **Fix:** Unify display. In Integrations page, show both connected platforms AND manual platform URLs. Allow adding manual platform URLs from Integrations page.

### 3.5 Dead route `/dashboard/all-reviews`
- **File:** `app/dashboard/all-reviews/page.tsx` — just redirects
- **Fix:** Delete the entire `all-reviews` directory.

---

## 4. Missing Features

Expected at $79/mo based on competitor analysis (GatherUp $99, NiceJob $75):

### 4.1 No post-onboarding guidance
- After completing onboarding, user lands on empty dashboard with no guidance
- **Fix:** Add a "Getting Started" checklist: Connect first platform → Send first review request → Customize testimonial wall → Invite staff

### 4.2 No response management for external reviews
- Can respond to internal reviews but NOT to Google/Facebook/Yelp reviews
- External reviews show as read-only in the table
- **Fix:** At minimum, add a "Reply on [Platform]" button that opens the platform's review page. Long-term: API-based replies for Google (supported via API).

### 4.3 Thank you page doesn't show coupon/social links
- **File:** `app/r/[slug]/page.tsx` lines 97-105
- Database stores `thankyou_coupon_code`, `thankyou_social_facebook`, etc.
- Review Experience form collects these values
- **But they're never rendered on the actual thank you screen**
- **Fix:** Display coupon code and social links on the thank you page when configured.

### 4.4 No trial expiration warning
- Sidebar shows "Trial · Xd left" as small chip
- No banner or email when trial is about to expire
- **Fix:** Show warning banner in dashboard when trial < 3 days. Send email at 3 days and 1 day remaining.

### 4.5 No review analytics/trends
- Dashboard shows basic stats (total, avg, positive %)
- **Missing:** Trends over time, review velocity, platform breakdown charts
- **Fix:** Add a simple line chart showing reviews per week/month. This justifies the $79 price.

### 4.6 No bulk SMS/email sending
- Clerk sends one review request at a time
- **Fix:** Add CSV upload or batch mode for sending multiple requests.

---

## 5. Broken User Flows

### 5.1 Onboarding → Trial flow discontinuity
- Onboarding creates org with `billing_plan: 'pending'`
- User is redirected to `/subscribe` before they can see the dashboard
- **Expected:** Seamless onboarding → free trial → explore dashboard → convert
- **Fix:** Auto-start trial at onboarding completion (see Critical Issue 1.1)

### 5.2 Platform settings lost between pages
1. Settings shows `show_on_review_form = false` (readonly)
2. Testimonials → Review Experience shows toggle as `true` for same platform
3. User doesn't know which is correct
- **Fix:** Single source of truth — move toggle to Integrations page only.

### 5.3 Sync removed but no auto-sync visibility
- Manual sync buttons were removed from Integrations panel
- Sync button exists on Reviews page but no indicator of auto-sync schedule
- User doesn't know if/when reviews will sync
- **Fix:** Show "Auto-syncs every 6 hours · Next sync in 4h" on Integrations page. Keep manual sync on Reviews page.

### 5.4 Disconnect integration has no confirmation
- **File:** `components/integrations/integrations-panel.tsx` line 97-114
- One click disconnects — no ConfirmDialog
- **Fix:** Add ConfirmDialog: "This will stop syncing reviews from [Platform]. X reviews already synced will be kept."

### 5.5 SMS vs Email contact method ambiguous
- **File:** `components/collect/collect-form.tsx` lines 330-373
- Two independent fields for phone and email; code defaults to SMS if both entered
- **Fix:** Use radio buttons: "Send via SMS" / "Send via Email" with one contact field.

### 5.6 Review auto-published without customer consent
- **File:** `app/api/reviews/submit/route.ts` line 78
- `is_public: isPositive` — 4-5 star reviews automatically public
- **Fix:** Default to `is_public: false`. Let business owner curate which reviews appear on wall.

---

## 6. Security & Backend Issues

### 6.1 High Priority

| Issue | File | Line | Fix |
|-------|------|------|-----|
| Cron auth bypass when env var missing | `api/cron/process-followups/route.ts` | 12 | Change `&&` to `\|\|` pattern |
| Phone number not validated | `api/sms/send/route.ts` | 119-123 | Use `libphonenumber-js` |
| Comment field no max length | `api/reviews/submit/route.ts` | 72-73 | Add `comment.length > 10000` check |
| Stripe webhook no idempotency | `api/stripe/webhook/route.ts` | 36-122 | Store processed event IDs |
| Error messages expose DB details | `api/onboarding/create/route.ts` | 78-81 | Return generic errors |
| No request body size limits | All POST routes | — | Add Content-Length check |
| SMS no global rate limit | `api/sms/send/route.ts` | — | Add per-org rate limiting |

### 6.2 Medium Priority

| Issue | File | Fix |
|-------|------|-----|
| Photo upload MIME type spoofable | `api/reviews/upload-photo/route.ts` | Validate magic bytes |
| OAuth tokens in URL (not encrypted) | `api/integrations/*/callback/route.ts` | Use server-side session |
| Cron failures silent | All cron routes | Add error alerting |
| Webhook fire-and-forget (no retry) | `api/reviews/submit/route.ts` | Add webhook retry queue |
| Embed endpoint no pagination | `api/embed/[slug]/route.ts` | Add `limit` query param |
| Inconsistent API response format | All routes | Standardize `{ success, data, error }` |
| seed-demo route accessible in prod | `api/seed-demo/route.ts` | Gate behind `NODE_ENV` |

---

## 7. Pricing Update Plan

Changing from $29/mo flat to tiered pricing. **Every file that needs modification:**

### 7.1 Constants & Types

| File | Line(s) | Current | Change To |
|------|---------|---------|-----------|
| `lib/utils/constants.ts` | 17-21 | `MONTHLY_PRICE: 29, TRIAL_DAYS: 14` | Add `PLANS` object with Starter/Growth/Agency tiers |
| `lib/types/database.ts` | 23 | `billing_plan: 'trial' \| 'active' \| ...` | Add `billing_tier: 'starter' \| 'growth' \| 'agency'` |

### 7.2 Stripe Integration

| File | Line(s) | Current | Change To |
|------|---------|---------|-----------|
| `lib/stripe/constants.ts` | 1-6 | Single `STRIPE_PRICE_ID` | Multiple price IDs per tier |
| `app/api/stripe/create-checkout/route.ts` | 61, 63 | Single price ID, `trial_period_days: 14` | Accept `tier` param, use correct price ID |
| `app/api/stripe/webhook/route.ts` | 48-56 | Sets `billing_plan` only | Also set `billing_tier` based on price ID |
| `.env.example` | 38 | `STRIPE_PRICE_ID=price_xxx` | `STRIPE_PRICE_ID_STARTER`, `_GROWTH`, `_AGENCY` |
| `.env.production.example` | 40 | Same | Same |

### 7.3 UI — Pricing Displays

| File | Line(s) | Current | Change To |
|------|---------|---------|-----------|
| `app/page.tsx` | 958-991 | Single $29 pricing card | Three-tier pricing table (Starter $79, Growth $149, Agency $249) |
| `app/dashboard/billing/page.tsx` | 90-93 | Shows "$29 per month, per location" | Show current tier name + price |
| `app/subscribe/page.tsx` | 59-70 | "$29/month per location", "14 days free" | Tier selection with pricing |
| `app/subscribe/subscribe-button.tsx` | 45 | "Start 14-Day Free Trial" | Keep but associate with selected tier |
| `components/layout/sidebar.tsx` | 37-44 | Generic plan display | Show tier name in sidebar |

### 7.4 Database

| File | What | Change |
|------|------|--------|
| New migration needed | `organizations` table | Add `billing_tier TEXT DEFAULT 'starter'`, `max_locations INTEGER DEFAULT 1` |
| `supabase/migrations/00001_create_organizations.sql` | Reference | Update default billing_plan to 'trial' |
| `supabase/seed.sql` | Demo data | Update with new tier fields |
| `app/api/onboarding/create/route.ts` | line 71 | Set `billing_plan: 'trial'`, `billing_tier: 'starter'` |

### 7.5 Feature Gating (New)

| Feature | Starter ($79) | Growth ($149) | Agency ($249) |
|---------|:---:|:---:|:---:|
| Locations | 1 | 3 | 5 + $49/extra |
| SMS requests/mo | 200 | 1000 | Unlimited |
| Integration sync | Manual | Auto (6hr) | Auto (1hr) |
| CSV export | Yes | Yes | Yes |
| Testimonial wall | Basic | Custom themes | White-label |
| Staff accounts | 3 | 10 | Unlimited |
| Webhook | No | Yes | Yes |
| Priority support | No | No | Yes |
| Setup fee | $199 optional | $199 optional | Included |

**Files that need feature gating logic:**
- `middleware.ts` — check tier for route access
- `app/api/sms/send/route.ts` — check SMS quota
- `components/layout/sidebar.tsx` — show/hide nav items by tier
- `components/settings/staff-list.tsx` — enforce staff limit
- `components/testimonials/wall-customizer.tsx` — gate advanced themes
- `app/api/webhooks/test/route.ts` — gate behind Growth+

---

## 8. Product Improvements to Help Sell

### 8.1 Quick Wins (1-2 hours each)

1. **Getting started checklist** on dashboard — guides new users through setup
2. **"Reply on [Platform]" button** for external reviews — opens platform review page
3. **Display coupon code** on thank you page — already stored, just not rendered
4. **Trial expiration banner** — warn at 3 days, 1 day remaining
5. **Delete orphaned `unified-review-list.tsx`** — 382 lines of dead code
6. **Auto-start trial** at onboarding — fix the `pending` → `trial` issue
7. **Confirmation dialog** before disconnecting integrations

### 8.2 Medium Effort (half day each)

1. **Consolidate settings** — move review experience config into Settings page
2. **Move platform visibility toggle** to Integrations page
3. **Simple review trend chart** on dashboard (reviews per week)
4. **Three-tier pricing page** with plan comparison table
5. **Auto-sync status indicator** — "Next sync in Xh" on Integrations page
6. **Input validation** — phone numbers, comment length, URL format
7. **Mobile card layout** for reviews table on small screens

### 8.3 Larger Features (1-2 days each)

1. **Tiered Stripe billing** — multiple price IDs, feature gating, tier selection
2. **Agency dashboard** — multi-location management, white-label mode
3. **Review analytics** — trend charts, platform breakdown, keyword extraction
4. **Bulk SMS sending** — CSV upload for batch review requests
5. **Webhook retry queue** — reliable delivery with exponential backoff
6. **Rate limiting** — IP-based for public endpoints, per-org for SMS

---

## 9. Implementation Priority

### Phase 1: Fix Critical Issues (Do First)
1. Auto-start trial at onboarding (`billing_plan: 'trial'`)
2. Fix smart routing threshold (pass org setting to review form)
3. Fix manual platforms not showing on public form
4. Fix cron auth bypass
5. Add rate limiting to public review endpoint
6. Delete orphaned `unified-review-list.tsx`

### Phase 2: Pricing Update
1. Create Stripe products/prices for 3 tiers
2. Update constants, types, env vars
3. Build three-tier pricing page (landing + subscribe)
4. Update billing page to show tier
5. Update webhook to detect tier from price ID
6. Add feature gating middleware

### Phase 3: UX Polish (Sell-Ready)
1. Getting started checklist on dashboard
2. Consolidate settings (remove duplication)
3. Move platform visibility to Integrations
4. Trial expiration warning banner
5. Confirmation dialogs (disconnect, delete)
6. Display coupon/social on thank you page
7. Fix all accessibility labels

### Phase 4: Growth Features
1. Review trend charts
2. Reply on platform buttons
3. Auto-sync status indicator
4. Bulk SMS sending
5. Agency dashboard / multi-location
6. Input validation hardening

---

## Files Reference (For AI Agent Modification)

### Files to DELETE:
- `components/integrations/unified-review-list.tsx`
- `app/dashboard/all-reviews/` (entire directory)

### Files to CREATE:
- New Supabase migration for `billing_tier`, `max_locations` columns
- `lib/utils/feature-gates.ts` — tier-based feature checks

### Files to MODIFY (by priority):

**Critical fixes:**
- `app/api/onboarding/create/route.ts` — billing_plan: 'trial'
- `components/review-form/review-form-content.tsx` — use org threshold
- `app/r/[slug]/page.tsx` — query review_platforms too
- `app/api/cron/process-followups/route.ts` — fix auth check
- `app/api/reviews/submit/route.ts` — rate limiting + input validation

**Pricing update:**
- `lib/utils/constants.ts` — new PLANS object
- `lib/types/database.ts` — billing_tier type
- `lib/stripe/constants.ts` — multiple price IDs
- `app/api/stripe/create-checkout/route.ts` — tier selection
- `app/api/stripe/webhook/route.ts` — tier detection
- `app/page.tsx` — three-tier pricing section
- `app/dashboard/billing/page.tsx` — tier display
- `app/subscribe/page.tsx` — tier selection UI
- `components/layout/sidebar.tsx` — tier in sidebar
- `middleware.ts` — feature gating

**UX consolidation:**
- `components/settings/settings-form.tsx` — add review experience settings
- `components/testimonials/review-experience-form.tsx` — simplify or merge
- `components/integrations/integrations-panel.tsx` — add visibility toggles, confirm dialog
- `components/reviews/review-list.tsx` — extract PLATFORM_BADGE to shared constants
- `components/dashboard/dashboard-stats.tsx` — add getting started checklist

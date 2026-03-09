# InsightReviews — Feature Roadmap

## BUGS: Found During Playwright Testing (Mar 9, 2026)

- [ ] **CRITICAL: Supabase keys in .env.local were wrong format** — Keys were `sb_publishable_` / `sb_secret_` format instead of actual JWT tokens. Fixed manually but should document correct setup.
- [ ] **CRITICAL: Onboarding RLS policy blocks org creation** — `member_owner_insert` policy on `organization_members` prevents new users from creating their first org during onboarding. The `NOT EXISTS` self-referential check fails.
- [ ] **Missing favicon** — Console 404 error for `/favicon.ico` on every page load
- [ ] **Review form placeholder text wrong for negative reviews** — Comment placeholder says "What made your experience great?" even for 1-2 star ratings; should say "What could we improve?"

## P0: Fix Before Demo

- [ ] **Replace placeholder "Recent Sends"** — Collect form shows hardcoded fake data instead of real recent review requests from the database
- [ ] **Replace placeholder dashboard stats** — Recent reviews list and sparkline data are hardcoded arrays, not queried from DB
- [ ] **Wire up email sending** — Email path logs to console only; integrate Resend or SendGrid so email delivery actually works
- [ ] **Twilio phone number** — No `TWILIO_PHONE_NUMBER` set; SMS sending will fail until a number is purchased/claimed
- [ ] **Logo upload in onboarding** — Field exists in DB but onboarding wizard doesn't collect it; public review form references it
- [ ] **Staff invite flow** — Button opens dialog but does nothing; needs to send a magic link invite email

## P1: Core Product Gaps

- [ ] **Negative review email alerts** — Owner gets no notification when a 1-3 star review comes in; should email immediately
- [ ] **Review-to-request linking** — Can't track which SMS led to which review; `review_request_id` on reviews is never set during submission
- [ ] **Platform redirect tracking** — `redirected_to` JSONB field on reviews exists but is never populated when customer clicks Google/Yelp buttons
- [ ] **Pagination on reviews list** — All reviews loaded at once; will break with hundreds of reviews
- [ ] **Rate limiting on API routes** — No protection against SMS spam or review form abuse
- [ ] **Request deduplication** — Same phone number can receive multiple SMS if clerk double-clicks or re-submits
- [ ] **Twilio delivery webhooks** — SMS status stays "sent" forever; need webhook to update to "delivered" or "failed"
- [ ] **Input validation** — API routes don't validate phone format, email format, or URL format

## P2: Analytics & Insights

- [ ] **Review trends chart** — Line/bar chart showing reviews over time (weekly/monthly)
- [ ] **Star distribution chart** — Bar chart showing count of 1-star, 2-star, etc.
- [ ] **Platform breakdown** — Which platforms customers click through to most often
- [ ] **Conversion funnel** — SMS sent → form opened → review submitted → platform clicked
- [ ] **Response time tracking** — How long between SMS sent and review submitted
- [ ] **CSV export** — Download reviews, requests, and activity log as CSV
- [ ] **Weekly digest email** — Summary of reviews received, avg rating, trends sent to owner

## P3: Growth & Engagement

- [ ] **QR code generation** — Generate QR codes server-side for counter display cards (currently links to external API)
- [ ] **Printable review card** — PDF with QR code + "Scan to leave a review" for businesses to print and display
- [ ] **Scheduled SMS** — Send review request at a specific time (e.g., 2 hours after visit)
- [ ] **Follow-up reminders** — Auto-send a gentle reminder if customer hasn't submitted after 24-48 hours
- [ ] **Auto-response to negative reviews** — Configurable template: "We're sorry to hear that. Our manager will reach out."
- [ ] **Review reply/notes** — Internal notes on reviews for team discussion; `response_notes` field exists but no UI
- [ ] **Bulk actions** — Toggle multiple reviews public/private, bulk export, bulk delete

## P4: Testimonial Wall Enhancements

- [ ] **JavaScript embed widget** — `<script>` tag option in addition to current iFrame embed
- [ ] **Customizable widget styles** — Let businesses pick colors, layout, fonts for their embedded wall
- [ ] **Widget analytics** — Track wall page views and click-throughs
- [ ] **Auto-refresh** — Embedded wall updates with new reviews without page reload
- [ ] **Testimonial carousel mode** — Rotating single-review display as an alternative to the masonry grid
- [ ] **Social sharing buttons** — Let visitors share individual testimonials

## P5: Multi-Location & Scale

- [ ] **Multi-location support** — One account manages multiple business locations, each with own slug/reviews
- [ ] **Location-level staff permissions** — Staff assigned to specific locations only
- [ ] **Cross-location analytics** — Compare performance across locations
- [ ] **Business category tagging** — "Cafe", "Salon", "Dentist" for industry benchmarks
- [ ] **API for developers** — REST API with API keys for third-party integrations
- [ ] **Zapier/webhook integrations** — Trigger external workflows on new review, negative review, etc.

## P6: Polish & Reliability

- [ ] **Error boundaries** — React error boundaries so a component crash doesn't blank the whole page
- [ ] **Skeleton loading states** — Show shimmer placeholders while data loads
- [ ] **Dark mode** — MUI theme toggle
- [ ] **Mobile optimization audit** — Full responsive testing on small screens
- [ ] **Accessibility audit** — Screen reader support, keyboard navigation, ARIA labels
- [ ] **i18n / language support** — At minimum support English + Spanish
- [ ] **Error monitoring** — Integrate Sentry or similar for production error tracking
- [ ] **E2E tests** — Playwright tests for critical flows (sign up, send SMS, submit review, billing)
- [ ] **Unit tests** — Vitest tests for API routes and utility functions

## P7: Billing & Revenue

- [ ] **Usage-based pricing tiers** — Free tier (50 requests/mo), Pro ($29/mo unlimited), Enterprise
- [ ] **Discount codes / coupons** — Stripe coupon support for promotions
- [ ] **Annual billing option** — Discounted yearly plan
- [ ] **Failed payment email notifications** — Alert owner when payment fails
- [ ] **Dunning management** — Grace period + auto-downgrade after repeated failures
- [ ] **Referral program** — "Refer a business, get a free month"

## Completed (MVP)

- [x] Project setup (Next.js 16, Supabase, MUI v7, Stripe, Twilio)
- [x] Database schema with 8 migrations + full RLS
- [x] Magic link authentication + PKCE flow
- [x] Onboarding wizard (business name, slug, platforms)
- [x] Clerk terminal — phone + email input with send
- [x] SMS sending via Twilio API
- [x] Public review form with star rating + smart routing
- [x] Review dashboard with filters and search
- [x] Testimonial wall (public page + embed code)
- [x] Business settings (profile, SMS template, platforms)
- [x] Staff management UI (list + roles)
- [x] Stripe billing (checkout, portal, webhooks)
- [x] Marketing landing page
- [x] Dashboard stats overview
- [x] GitHub Actions CI/CD (lint, build, preview, production deploy)

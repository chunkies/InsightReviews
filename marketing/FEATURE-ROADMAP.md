# InsightReviews — Feature Roadmap
*Created: 2026-03-15*

**Goal:** Build features that close deals. Every feature below was chosen because it directly answers a business owner's objection or creates urgency to sign up.

---

## TIER 1 — Build This Week (Deal Closers)

### 1. AI-Suggested Replies to Negative Reviews
**Why it closes deals:** The #1 thing business owners dread is writing a professional response to an angry review. "We'll draft a reply for you in one click" is an instant differentiator vs competitors.

**Implementation:**
- When a negative review comes in (1-3 stars), auto-generate a professional, empathetic response using Claude API
- Show suggested reply in the review detail view with "Copy" and "Edit" buttons
- Tone: apologetic, professional, offers to make it right, invites them back
- Include business name and reviewer name in the response
- Owner can edit before posting

**Effort:** 1-2 days
**Files:** New API route `app/api/reviews/suggest-reply/route.ts`, update `components/reviews/review-detail.tsx`

### 2. Expose CSV Export in Dashboard
**Why it closes deals:** Business owners and accountants want their data. The code already exists but isn't in the UI.

**Implementation:**
- Add "Export CSV" button to the reviews dashboard header
- Use existing `lib/utils/generate-csv.ts`
- Export: date, customer name, rating, comment, platform, responded status

**Effort:** 30 minutes
**Files:** Update `app/dashboard/reviews/page.tsx`

### 3. Competitor Benchmarking Widget
**Why it closes deals:** Nothing creates urgency like "your competitor has 4.7 stars with 200 reviews, you have 3.5 with 40." Already using this angle in cold emails — build it into the product.

**Implementation:**
- New section on dashboard: "How You Compare"
- Owner enters 1-3 competitor Google Place IDs or business names
- Fetch their public Google rating + review count (Google Places API)
- Show side-by-side: your rating vs theirs, your review count vs theirs
- "You need X more 5-star reviews to match [competitor]"
- Update weekly via cron

**Effort:** 2-3 days
**Files:** New component `components/dashboard/competitor-benchmark.tsx`, new API route `app/api/competitors/`, settings UI for adding competitors

---

## TIER 2 — Build This Month (Retention & Stickiness)

### 4. Reply to Google Reviews From Dashboard
**Why it matters:** Business owners hate logging into Google Business Profile. If they can reply from your dashboard, it becomes their daily tool.

**Implementation:**
- Google Business API already connected (OAuth flow exists)
- Add "Reply" button on external Google reviews in the dashboard
- Text input, character count, submit via Google Business API
- Show reply status (pending/posted)

**Effort:** 2-3 days
**Files:** New API route `app/api/integrations/google/reply/route.ts`, update review list component

### 5. Branded QR Codes With Logo
**Why it matters:** A QR code with the business logo in the center looks professional vs generic black-and-white. Makes them proud to display it.

**Implementation:**
- Use a library like `qrcode` with logo overlay
- Generate QR with business logo embedded in center
- Download as PNG/PDF in print-ready sizes (A6 card, A5 poster, sticker)
- Multiple design templates (minimal, bold, with tagline)

**Effort:** 1-2 days
**Files:** New component `components/collect/branded-qr.tsx`, update onboarding wizard step 3

### 6. Review Request Automation (Time-Based)
**Why it matters:** Staff forget. Automate it.

**Implementation:**
- After a review request is sent, if no review received within 24-48 hours, auto-send a gentle reminder
- Configurable in settings (enable/disable, delay hours, max reminders)
- Uses existing followup queue cron system

**Effort:** 1 day
**Files:** Update `app/api/cron/process-followups/route.ts`, add settings UI

---

## TIER 3 — Build Next Month (Growth & Scale)

### 7. Multi-Location Dashboard
**Why it matters:** Once a business with 2+ locations signs up, they need to switch between them. Schema already supports it.

**Implementation:**
- Location switcher in sidebar/header
- Aggregate stats across all locations
- Per-location filtering
- Billing per location (already built in Stripe)

**Effort:** 3-5 days

### 8. Review Widget (Embeddable)
**Why it matters:** Business owners want to show reviews on their own website. Widget code is scaffolded but not functional.

**Implementation:**
- JavaScript snippet that loads reviews from API
- Layout options: badge (floating), carousel, grid
- Customizable theme (light/dark, accent color)
- Lazy-loaded, lightweight (<10KB)

**Effort:** 3-4 days

### 9. Integration with Booking/POS Systems
**Why it matters:** Auto-send review request after a booking is completed. Zero staff effort.

**Implementation:**
- Zapier integration (easiest — connect to Square, Timely, Fresha, etc.)
- Or direct API webhooks
- Triggers: booking completed, payment processed, appointment ended

**Effort:** 3-5 days for Zapier, more for direct integrations

### 10. SMS Review Reminders for QR Walkups
**Why it matters:** Customer scans QR, starts review, abandons. Capture their phone/email and send a gentle reminder.

**Implementation:**
- Review form already collects optional phone/email for QR walk-ins
- If review not completed within 2 hours, send reminder
- One reminder max

**Effort:** 1-2 days

---

## Quick Wins (Under 1 Hour Each)

| Feature | Effort | Impact |
|---------|--------|--------|
| Expose CSV export button | 30 min | Medium — removes objection |
| Show photo uploads on testimonial wall | 1 hour | Medium — richer social proof |
| Add "time to respond" metric on dashboard | 1 hour | Medium — accountability |
| Show review source breakdown (QR vs SMS vs walk-in) | 1 hour | Low-medium — analytics depth |

---

## What NOT to Build (Avoid Scope Creep)

- Sentiment analysis — overkill for $79/mo customers
- Social media auto-posting — NiceJob does this, not our differentiator
- Custom report builder — nobody at this price point needs it
- SSO/SAML — enterprise feature, we're SMB
- Review moderation/approval workflow — adds friction, not value for small businesses
- Two-factor auth — Supabase magic link is already secure

---

## Priority Summary

| Priority | Feature | Effort | Revenue Impact |
|----------|---------|--------|----------------|
| 1 | AI reply suggestions | 1-2 days | HIGH — closes deals |
| 2 | CSV export (quick win) | 30 min | MEDIUM — removes objection |
| 3 | Competitor benchmarking | 2-3 days | HIGH — creates urgency |
| 4 | Google review replies | 2-3 days | HIGH — daily stickiness |
| 5 | Branded QR codes | 1-2 days | MEDIUM — professional feel |
| 6 | Review request automation | 1 day | MEDIUM — saves staff time |
| 7 | Multi-location | 3-5 days | HIGH (later) — upsell path |
| 8 | Embeddable widget | 3-4 days | MEDIUM — website integration |

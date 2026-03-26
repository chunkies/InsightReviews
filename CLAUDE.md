# InsightReviews — Smart Review Collection & Routing for Local Businesses

## Project Overview

InsightReviews helps brick-and-mortar businesses (cafes, salons, dentists, gyms, auto shops) collect customer reviews at the point of sale. A clerk enters the customer's phone number, we send an SMS with a branded review link, and smart-route the response: positive reviews (4-5 stars) get redirected to Google, Yelp, Facebook, TripAdvisor etc. Negative reviews (1-3 stars) stay private so the business can follow up.

**Business model:** Single plan — $49/mo per location. 14-day free trial, no lock-in. Stripe billing. (Tiered plans will be introduced once we have paying customers.)

**Target market:** Local business owners who want more 5-star reviews online and want to catch bad experiences before they go public.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5 (strict) |
| UI | MUI v7 + Emotion |
| Icons | Lucide React |
| Database | Supabase (PostgreSQL 17) |
| Auth | Supabase Magic Link (OTP email) |
| SSR | @supabase/ssr |
| Billing | Stripe (Checkout + Portal + Webhooks) |
| SMS | Twilio |
| Deployment | Vercel |
| Testing | Vitest + React Testing Library |
| E2E Testing | Playwright MCP (browser automation) |
| Linting | ESLint 9 |

## Core User Flows

### Flow 1: Clerk at the Till (Staff Portal)
1. Staff member logs in (magic link or session)
2. Simple screen: "Customer phone number" input + Send button
3. Optionally enter customer first name
4. System sends SMS via Twilio: "Thanks for visiting {Business Name}! We'd love your feedback: {link}"
5. Review request logged in system

### Flow 2: Customer Review (Public Form — no auth required)
1. Customer clicks SMS link → `app.com/r/{business-slug}`
2. Branded page loads: business logo, name, "How was your experience?"
3. Customer taps star rating (1-5), optionally writes a comment
4. **4-5 stars (positive):**
   - Review saved to database (public)
   - "Thank you! Would you mind sharing on Google?"
   - Shows buttons for each platform the business has configured (Google, Yelp, Facebook, TripAdvisor, etc.)
   - Each button opens the platform's review page in new tab
5. **1-3 stars (negative):**
   - Review saved to database (private)
   - "Thank you for letting us know. We'll follow up with you."
   - Business owner gets notification (email + dashboard alert)
   - No redirect to public platforms

### Flow 3: Business Owner Dashboard
1. Sign up → Magic link auth → Onboarding wizard
2. **Onboarding:** Business name, logo upload, slug, review platform URLs (Google, Yelp, etc.)
3. **Dashboard home:** Review stats (total, avg rating, positive %, response rate)
4. **Reviews tab:** All reviews with filters (rating, date, status)
5. **Staff tab:** Invite staff members who can use the clerk terminal
6. **Testimonials tab:** Curate public reviews → embeddable "wall of love" widget
7. **Settings:** Business profile, review platform URLs, notification preferences
8. **Billing:** Stripe customer portal (manage subscription, invoices)

### Flow 4: Embeddable Testimonial Wall
1. Business copies embed code or uses hosted page link
2. Shows curated 4-5 star reviews with customer first name + star rating
3. Public page: `app.com/wall/{business-slug}`

## Multi-Tenant Architecture

- All data isolated by `organization_id`
- Row Level Security (RLS) on every table
- `get_user_org_ids()` SECURITY DEFINER function for org isolation
- Roles: owner (full access), staff (clerk terminal + view reviews)
- Public review form requires NO auth — accessed via business slug

## Database Schema

### Core Tables

**organizations**
- id, name, slug (unique), logo_url, phone, email, address
- google_review_url, yelp_url, facebook_url, tripadvisor_url, other_review_urls (jsonb)
- positive_threshold (default 4 — rating >= this routes to public platforms)
- sms_template (customizable message text)
- stripe_customer_id, stripe_subscription_id, billing_plan, trial_ends_at
- created_at, updated_at

**organization_members**
- id, organization_id, user_id, role (owner/staff)
- created_at

**review_requests**
- id, organization_id, customer_phone, customer_name
- sent_at, status (sent/completed/expired/failed)
- sent_by (user_id of clerk)
- created_at

**reviews**
- id, organization_id, review_request_id (nullable — for walk-in form use)
- rating (1-5), comment, customer_name, customer_phone
- is_positive (computed: rating >= org threshold)
- is_public (owner can toggle for testimonial wall)
- redirected_to (jsonb array of platforms customer clicked)
- responded (boolean — business marked as followed up)
- response_notes (private notes from business)
- created_at

**review_platforms**
- id, organization_id, platform (google/yelp/facebook/tripadvisor/other)
- platform_name (display name for "other")
- url, enabled, display_order
- created_at

**sms_log**
- id, organization_id, review_request_id
- to_phone, message_body, twilio_sid
- status (queued/sent/delivered/failed)
- created_at

**activity_log**
- id, organization_id, user_id, action, entity_type, entity_id, details (jsonb)
- created_at

### Row Level Security

Every table gets RLS. Pattern:
```sql
-- Base isolation
CREATE POLICY "org_isolation" ON table_name
  FOR ALL USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- Public review form (no auth, slug-based lookup)
-- reviews and review_requests INSERT policies allow anonymous inserts
-- via service role API endpoint (validates slug exists)
```

## Project Structure

```
InsightReviews/
├── app/
│   ├── api/
│   │   ├── stripe/           # webhook, create-checkout, create-portal
│   │   ├── sms/              # send-review-request
│   │   ├── reviews/          # public review submission (service role)
│   │   └── embed/            # testimonial wall data endpoint
│   ├── auth/
│   │   ├── login/            # Magic link login
│   │   └── confirm/          # PKCE callback
│   ├── onboarding/           # Business setup wizard
│   ├── dashboard/
│   │   ├── page.tsx          # Stats overview
│   │   ├── reviews/          # Review list + detail
│   │   ├── collect/          # Clerk terminal (send SMS)
│   │   ├── staff/            # Team management
│   │   ├── testimonials/     # Wall of love curation
│   │   ├── settings/         # Business profile + platforms
│   │   └── billing/          # Stripe portal
│   ├── r/
│   │   └── [slug]/           # Public review form (NO auth)
│   ├── wall/
│   │   └── [slug]/           # Public testimonial wall (NO auth)
│   ├── layout.tsx
│   └── page.tsx              # Marketing landing page
├── components/
│   ├── auth/                 # Login form
│   ├── dashboard/            # Stat cards, charts
│   ├── collect/              # Phone input form (clerk terminal)
│   ├── reviews/              # Review list, review card, filters
│   ├── review-form/          # Public star rating form
│   ├── testimonials/         # Wall display, embed code generator
│   ├── onboarding/           # Setup wizard steps
│   ├── settings/             # Business profile form, platform editor
│   ├── shared/               # StatusChip, ConfirmDialog, PageHeader, EmptyState
│   ├── layout/               # Sidebar, Header
│   └── providers/            # Theme, Snackbar, Auth
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client (ANON_KEY)
│   │   └── server.ts         # Server client (ANON_KEY)
│   ├── types/
│   │   └── database.ts       # All TypeScript interfaces
│   ├── utils/
│   │   ├── constants.ts      # Platform configs, rating thresholds
│   │   └── activity-logger.ts
│   ├── stripe/
│   │   ├── server.ts
│   │   └── constants.ts
│   └── twilio/
│       └── client.ts         # Twilio SMS helper
├── supabase/
│   ├── migrations/           # SQL migration files
│   ├── seed.sql              # Demo business data
│   └── config.toml
├── tests/
├── public/
├── middleware.ts              # Auth redirect + route protection
├── next.config.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── vercel.json
├── .env.example
└── CLAUDE.md
```

## Development Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (zero errors required)
npm run lint         # ESLint (zero warnings required)
npm run test         # Vitest (all tests must pass)
npx supabase start   # Start local Supabase
npx supabase stop    # Stop local Supabase
npx supabase db reset # Reset + apply migrations + seed
```

## Quality Gates (enforced before every commit)

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — zero ESLint warnings
3. `npm run test` — all tests pass (969+ Vitest unit tests)
4. `npm run test:e2e` — all Playwright E2E tests pass (83+ tests)

## MANDATORY Testing Protocol

**You MUST follow this EVERY time. No exceptions. Both automated AND manual testing are required.**

### Step 1: Local Automated Tests
```bash
npm run build && npm run lint && npm run test && npm run test:e2e
```
ALL must pass before proceeding.

### Step 2: Local Manual Testing (Playwright MCP)
Before deploying, manually verify the affected flows using Playwright MCP against localhost:3000:
- Navigate to affected pages with `browser_navigate`
- Take screenshots with `browser_take_screenshot` for visual verification
- Click through forms and interactive elements with `browser_click` / `browser_fill_form`
- Check `browser_console_messages` for errors
- Test BOTH happy path and error states

### Step 3: Commit and Push
- Conventional commits (`feat:`, `fix:`, `test:`)
- Push to `main` → triggers **production deploy** to insightreviews.com.au
- Migrations in `supabase/migrations/` are auto-pushed via GitHub Actions

### Step 4: Wait for Production Deploy
- Wait ~90 seconds for Vercel to build
- Do NOT proceed until deployment is live
- If build fails: check Vercel dashboard or `npx vercel inspect <url>`

### Step 5: Production Manual Testing (Playwright MCP)
After deploy, manually test `insightreviews.com.au` using Playwright MCP:
- Navigate to affected pages
- Take screenshots to visually verify
- Click through the full user flow (login, dashboard, forms, billing)
- Check `browser_console_messages` for errors (especially hydration errors)
- If any issues found, go back to Step 1

### Feature Branch Previews
- Create a feature branch for larger changes
- Push → Vercel automatically creates a Preview deployment
- Test on the preview URL before merging to main
- PR → CI checks → merge → production auto-deploy

### Test Accounts for Staging/Production
| Account | Email | Role | Purpose |
|---------|-------|------|---------|
| Admin | `sly.tristan1@gmail.com` | Owner | Full dashboard, billing bypass if in ADMIN_EMAILS |
| Test user | `slytristan727@gmail.com` | New user | Signup, onboarding, fresh user flows |

**Magic link flow:** Send link → check Gmail → click "Sign In to InsightReviews" → verify redirect.
Clean up test data from `slytristan727@gmail.com` after testing.

### Playwright MCP Testing

Use the Playwright MCP browser tools to verify deployed features:
- `browser_navigate` — load pages
- `browser_snapshot` — check page structure and accessibility
- `browser_take_screenshot` — visual verification
- `browser_click` / `browser_fill_form` — test interactive flows
- `browser_console_messages` — check for JS errors
- Always test both the happy path and error states

**Be mindful of build minutes and costs** — batch related fixes into a single deploy where possible.

### Database Migrations

- Migrations in `supabase/migrations/` are auto-pushed to production via GitHub Actions on merge to main
- For manual push: `SUPABASE_ACCESS_TOKEN=<token> npx supabase db push --linked`
- Always test migrations locally first with `npx supabase db reset`

## Design & UX Standards

- **Dark mode**: All pages and components must support dark mode via MUI theme. Test both light and dark modes.
- **Responsiveness**: All pages must work on mobile (xs), tablet (sm/md), and desktop (lg+). Use MUI breakpoints and `sx` responsive syntax.
- **Good design**: Follow MUI design patterns. Use consistent spacing, typography hierarchy, and colour palette. Avoid cluttered layouts — prefer whitespace and clear visual hierarchy.

## Conventions

### Server vs Client Components
- Server components for data fetching (pages)
- Client components for interactivity (`'use client'` directive)
- Supabase server client in server components, browser client in client components

### Patterns
- All CRUD operations call `logActivity()` for audit trail
- ConfirmDialog before any delete operation
- StatusChip for status display (color-coded)
- PageHeader with title + action button on all list pages
- EmptyState component when no data
- Toast notifications via SnackbarProvider
- Australian date format (dd/MM/yyyy) — **CHANGE: Use locale-aware dates**

### Auth Flow
```
1. POST /auth/login → Enter email
2. Supabase sends magic link
3. Click link → /auth/confirm (PKCE)
4. Session created → redirect:
   - No org → /onboarding
   - Has org → /dashboard
```

### Public Routes (no auth)
- `/` — Landing page
- `/auth/*` — Login/confirm
- `/r/[slug]` — Review form
- `/wall/[slug]` — Testimonial wall
- `/api/reviews` — Review submission endpoint
- `/api/stripe/webhook` — Stripe webhook

### Protected Routes (auth required)
- `/dashboard/*` — All dashboard pages
- `/onboarding` — Business setup
- `/api/sms/*` — SMS sending
- `/api/stripe/create-*` — Billing actions

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Google Business Profile OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Admin (bypass billing checks)
ADMIN_EMAILS=
```

## Git Workflow

- Feature branches off `main`
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`
- Squash merge to main
- Quality gates must pass before merge

## Feature Tracker

### MVP (Target: Mid-week launch)
- [ ] Project setup (Next.js, Supabase, MUI, Stripe, Twilio)
- [ ] Supabase migrations (all tables + RLS)
- [ ] Auth (magic link login, PKCE confirm, middleware)
- [ ] Onboarding wizard (business name, logo, slug, platform URLs)
- [ ] Clerk terminal (/dashboard/collect) — phone input + send SMS
- [ ] SMS sending via Twilio API
- [ ] Public review form (/r/[slug]) — star rating, comment, smart routing
- [ ] Review dashboard (/dashboard/reviews) — list, filter, stats
- [ ] Testimonial wall (/wall/[slug]) — public curated reviews
- [ ] Business settings (profile, platforms, notification prefs)
- [ ] Staff management (invite, roles)
- [ ] Stripe billing (checkout, portal, webhook)
- [ ] Landing page (marketing)
- [ ] Dashboard home (stats overview)

### Post-MVP
- [ ] Email notifications (negative review alerts)
- [ ] QR code generation (print for counter display)
- [ ] Embeddable widget (JavaScript snippet)
- [ ] CSV export
- [ ] Analytics (trends over time, platform breakdown)
- [ ] Multi-location support
- [ ] Custom SMS templates
- [ ] Auto-response to negative reviews
- [ ] NPS tracking

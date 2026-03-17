# InsightReviews — Local Development Setup

Complete guide to get the local development environment running from scratch.

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | `nvm install 18` or [nodejs.org](https://nodejs.org) |
| Docker | 24+ | `sudo apt-get install -y docker.io docker-compose-v2` |
| Git | 2.x | Usually pre-installed |

### Docker Setup (Linux)

```bash
# Install
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2

# Start and enable
sudo systemctl start docker && sudo systemctl enable docker

# Allow your user to run docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker ps
```

> **Note:** If `docker ps` gives a permission error, log out and back in (or run commands via `sg docker -c "command"`).

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone git@github.com:chunkies/InsightReviews.git
cd InsightReviews
npm install

# 2. Start local Supabase (pulls Docker images on first run — ~2 min)
npx supabase start

# 3. Generate .env.local from Supabase output
npx supabase status -o env > /tmp/sb-env.txt
cat > .env.local << 'ENVEOF'
# Supabase — values from `npx supabase status -o env`
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
ENVEOF

# Append the keys from supabase status
grep "ANON_KEY" /tmp/sb-env.txt | sed 's/ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY/' >> .env.local
grep "SERVICE_ROLE_KEY" /tmp/sb-env.txt >> .env.local

# Append remaining config
cat >> .env.local << 'ENVEOF'

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe (test placeholders — billing flows will use mocked responses)
STRIPE_SECRET_KEY=sk_test_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
STRIPE_PRICE_ID=price_placeholder

# Admin — this email bypasses billing checks
ADMIN_EMAILS=admin@test.com

# Twilio (placeholders — SMS won't send but app won't crash)
TWILIO_ACCOUNT_SID=AC_placeholder
TWILIO_AUTH_TOKEN=placeholder
TWILIO_PHONE_NUMBER=+10000000000

# SendGrid (placeholder)
SENDGRID_API_KEY=placeholder
SENDGRID_FROM_EMAIL=noreply@localhost
SENDGRID_FROM_NAME=InsightReviews

# Cron
CRON_SECRET=test-cron-secret
SUPPORT_EMAIL=support@localhost
ENVEOF

# 4. Reset database (applies all migrations + seeds demo data)
npx supabase db reset

# 5. Start the dev server
npm run dev
```

The app is now running at **http://localhost:3000**.

## Local Services

| Service | URL | Purpose |
|---------|-----|---------|
| App | http://localhost:3000 | Next.js dev server |
| Supabase Studio | http://127.0.0.1:54423 | Database browser & admin |
| Mailpit (Inbucket) | http://127.0.0.1:54424 | Catches all emails (magic links) |
| Supabase API | http://127.0.0.1:54421 | PostgREST + Auth + Storage |
| PostgreSQL | localhost:54422 | Direct DB connection (`postgres:postgres`) |

## Testing Locally

### Login with Magic Link

1. Go to http://localhost:3000/auth/login
2. Enter any email (e.g. `test@example.com`)
3. Open Mailpit at http://127.0.0.1:54424
4. Click the magic link in the captured email
5. You'll be redirected to the app, authenticated

### Demo Data

The seed creates two demo businesses:
- **Joe's Cafe** (`/r/joes-cafe`) — 14 reviews, 3 platforms
- **Glow Beauty Bar** (`/r/glow-beauty`) — 5 reviews, 2 platforms

These orgs have no owner user linked — create a user via magic link, then the app will send you to onboarding to create your own org.

## Running Tests

### Unit Tests (Vitest — 969 tests)

```bash
npm run test          # Single run
npm run test:watch    # Watch mode
```

### Lint

```bash
npm run lint
```

### Production Build

```bash
npm run build
```

### E2E Tests (Playwright — 83 tests)

```bash
# Install Playwright browser (first time only)
npx playwright install chromium
sudo npx playwright install-deps chromium  # System libraries

# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Run a specific spec file
npx playwright test e2e/staff.spec.ts

# Run with headed browser (see it happen)
npx playwright test --headed

# View HTML report after run
npx playwright show-report
```

> **Important:** E2E tests need local Supabase running. They create/delete their own test data and won't affect your seed data.

### Run Against Staging

```bash
npm run test:e2e:staging
```

## Quality Gates (run all before committing)

```bash
npm run build && npm run lint && npm run test
```

All three must pass with zero errors/warnings.

## Common Tasks

### Reset the Database

```bash
npx supabase db reset   # Re-applies all migrations + seed
```

### Create a New Migration

```bash
npx supabase migration new my_migration_name
# Edit the generated file in supabase/migrations/
npx supabase db reset   # Apply it
```

### Stop Supabase

```bash
npx supabase stop       # Stops containers, keeps data
npx supabase stop --no-backup  # Stops and removes all data
```

### View Logs

```bash
npx supabase logs       # All service logs
docker logs supabase_db_InsightReviews  # Just PostgreSQL
```

## Troubleshooting

### "supabase start" hangs or fails
- Ensure Docker is running: `docker ps`
- Free up port conflicts: `lsof -i :54421` / `lsof -i :54422`
- Try a clean start: `npx supabase stop --no-backup && npx supabase start`

### "permission denied" on Docker commands
- Run `newgrp docker` or log out and back in after `usermod -aG docker`
- Alternatively prefix with `sg docker -c "your command"`

### E2E tests fail with "browser not found"
```bash
npx playwright install chromium
sudo npx playwright install-deps chromium
```

### Dev server shows "middleware" deprecation warning
This is a Next.js 16 warning about the `middleware.ts` → `proxy.ts` rename. It still works — can be migrated later.

### Supabase keys look wrong (sb_publishable_ vs eyJ...)
The `npx supabase status` display shows short keys, but the app needs JWT tokens. Use `npx supabase status -o env` to get the correct `eyJ...` format keys.

## Environment Architecture

```
main branch ──→ Vercel Preview (staging)
                 URL: insightreviews-git-main-chunkies1s-projects.vercel.app

__production branch ──→ Vercel Production
                         URL: insightreviews.com.au
```

To promote staging to production:
```bash
git checkout __production
git merge main
git push origin __production
```

#!/usr/bin/env bash
# =============================================================================
# ReviewFlow (InsightReviews) — Production Deployment Script
# =============================================================================
#
# This script deploys ReviewFlow to production by:
#   1. Validating all required environment variables are set
#   2. Linking and pushing migrations to your remote Supabase project
#   3. Deploying the Next.js app to Vercel
#
# Prerequisites:
#   - Supabase CLI installed:  npm install -g supabase
#   - Vercel CLI installed:    npm install -g vercel
#   - Logged in to both:       supabase login && vercel login
#   - A Supabase project created in the dashboard
#   - A Vercel project created (or first deploy will create one)
#
# Usage:
#   ./scripts/deploy.sh <supabase-project-ref>
#
# Example:
#   ./scripts/deploy.sh abcdefghijklmnopqrst
#
# The Supabase project ref can be found in your Supabase project settings
# under "General" > "Reference ID".
#
# Required environment variables (set in your shell or .env):
#   NEXT_PUBLIC_SUPABASE_URL        - Supabase project URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY   - Supabase anon/public key
#   SUPABASE_SERVICE_ROLE_KEY       - Supabase service role key
#   STRIPE_SECRET_KEY               - Stripe secret key
#   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Stripe publishable key
#   STRIPE_WEBHOOK_SECRET           - Stripe webhook signing secret
#   STRIPE_PRICE_ID                 - Stripe Price ID for the $29/mo subscription
#   TWILIO_ACCOUNT_SID              - Twilio account SID
#   TWILIO_AUTH_TOKEN               - Twilio auth token
#   TWILIO_PHONE_NUMBER             - Twilio sender phone number
#   NEXT_PUBLIC_SITE_URL            - Production site URL (e.g., https://app.example.com)
#
# Stripe Webhook Setup:
#   In your Stripe Dashboard, create a webhook endpoint pointing to:
#     https://<your-domain>/api/stripe/webhook
#   Subscribe to these events:
#     - checkout.session.completed
#     - invoice.payment_succeeded
#     - invoice.payment_failed
#     - customer.subscription.deleted
#
# Stripe Product Setup:
#   Create a Product in Stripe with a recurring price of $29/month.
#   Copy the Price ID (price_xxx) and set it as STRIPE_PRICE_ID.
#   The checkout flow uses this single price in subscription mode.
# =============================================================================

set -euo pipefail

# ---- Color helpers ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---- Argument check ----
if [ $# -lt 1 ]; then
  error "Missing Supabase project ref."
  echo ""
  echo "Usage: $0 <supabase-project-ref>"
  echo "Example: $0 abcdefghijklmnopqrst"
  exit 1
fi

SUPABASE_PROJECT_REF="$1"

# ---- Step 1: Check required environment variables ----
info "Checking required environment variables..."

REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "STRIPE_SECRET_KEY"
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  "STRIPE_WEBHOOK_SECRET"
  "STRIPE_PRICE_ID"
  "TWILIO_ACCOUNT_SID"
  "TWILIO_AUTH_TOKEN"
  "TWILIO_PHONE_NUMBER"
  "NEXT_PUBLIC_SITE_URL"
)

MISSING=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    MISSING+=("$var")
  fi
done

if [ ${#MISSING[@]} -gt 0 ]; then
  error "The following required environment variables are not set:"
  for var in "${MISSING[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Set them in your shell environment or source a .env file before running this script."
  exit 1
fi

info "All required environment variables are set."

# ---- Step 2: Check CLI tools are installed ----
info "Checking required CLI tools..."

if ! command -v supabase &> /dev/null; then
  error "Supabase CLI not found. Install it: npm install -g supabase"
  exit 1
fi

if ! command -v vercel &> /dev/null; then
  error "Vercel CLI not found. Install it: npm install -g vercel"
  exit 1
fi

info "CLI tools found."

# ---- Step 3: Link Supabase project ----
info "Linking Supabase project: ${SUPABASE_PROJECT_REF}..."

# Navigate to project root (script lives in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

supabase link --project-ref "$SUPABASE_PROJECT_REF"

info "Supabase project linked."

# ---- Step 4: Push migrations to remote Supabase ----
info "Pushing database migrations to remote Supabase..."

supabase db push

info "Migrations applied successfully."

# ---- Step 5: Deploy to Vercel ----
info "Deploying to Vercel (production)..."

vercel --prod

info "Vercel deployment complete."

# ---- Done ----
echo ""
info "Deployment finished successfully!"
echo ""
echo "Post-deployment checklist:"
echo "  1. Verify the site is live at ${NEXT_PUBLIC_SITE_URL}"
echo "  2. Test Stripe webhook by creating a test checkout session"
echo "  3. Send a test SMS to verify Twilio integration"
echo "  4. Create your first organization via the onboarding flow"
echo "  5. Confirm RLS policies are working (check Supabase logs)"

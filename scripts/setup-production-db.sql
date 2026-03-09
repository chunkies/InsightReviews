-- =============================================================================
-- ReviewFlow (InsightReviews) — Production Database Setup
-- =============================================================================
-- This file combines all 9 migrations (00001 through 00009) into a single SQL
-- script for production database provisioning. It creates all tables, indexes,
-- RLS policies, storage buckets, and helper functions.
--
-- NOTE: This does NOT include seed/demo data. For local development with sample
-- data, use `npx supabase db reset` which applies migrations + seed.sql.
--
-- Usage:
--   Run against your production Supabase database via the SQL Editor in the
--   Supabase Dashboard, or pipe it through psql. Alternatively, use
--   `supabase db push` which applies the individual migration files.
-- =============================================================================

-- ============================================
-- Migration 00001: Organizations & Members
-- ============================================

-- Organizations (business accounts)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  positive_threshold INTEGER NOT NULL DEFAULT 4,
  sms_template TEXT NOT NULL DEFAULT 'Thanks for visiting {business_name}! We''d love your feedback: {link}',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  billing_plan TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization members (linking users to orgs with roles)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Helper function for RLS: get org IDs for current user
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;

-- RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member_select" ON organizations
  FOR SELECT USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_owner_update" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (true);

-- RLS on organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_select" ON organization_members
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "member_owner_insert" ON organization_members
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
    OR NOT EXISTS (
      SELECT 1 FROM organization_members WHERE organization_id = organization_members.organization_id
    )
  );

CREATE POLICY "member_owner_delete" ON organization_members
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Slug index for fast public lookups
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Migration 00002: Review Platforms
-- ============================================

-- Review platforms (Google, Yelp, Facebook, TripAdvisor, etc.)
CREATE TABLE review_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google', 'yelp', 'facebook', 'tripadvisor', 'other')),
  platform_name TEXT, -- display name for 'other' type
  url TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE review_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_select" ON review_platforms
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

-- Also allow public select by org slug (for review form)
CREATE POLICY "platform_public_select" ON review_platforms
  FOR SELECT USING (
    enabled = true
    AND organization_id IN (SELECT id FROM organizations WHERE slug = current_setting('app.current_slug', true))
  );

CREATE POLICY "platform_owner_insert" ON review_platforms
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "platform_owner_update" ON review_platforms
  FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "platform_owner_delete" ON review_platforms
  FOR DELETE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_review_platforms_org ON review_platforms(organization_id);

-- ============================================
-- Migration 00003: Review Requests
-- ============================================

-- Review requests (SMS sent to customers)
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  sent_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'completed', 'expired', 'failed')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "request_select" ON review_requests
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "request_insert" ON review_requests
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "request_update" ON review_requests
  FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_review_requests_org ON review_requests(organization_id);
CREATE INDEX idx_review_requests_phone ON review_requests(customer_phone);

-- ============================================
-- Migration 00004: Reviews
-- ============================================

-- Reviews (customer feedback)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_request_id UUID REFERENCES review_requests(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  is_positive BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  redirected_to JSONB DEFAULT '[]'::jsonb,
  responded BOOLEAN NOT NULL DEFAULT false,
  response_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Authenticated org members can see their reviews
CREATE POLICY "review_select" ON reviews
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

-- Public reviews visible for testimonial wall (no auth)
CREATE POLICY "review_public_select" ON reviews
  FOR SELECT USING (is_public = true);

-- Org members can update (toggle public, add response notes)
CREATE POLICY "review_update" ON reviews
  FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

-- Service role handles inserts from public review form
-- (no direct insert policy for anon — goes through API route)

CREATE INDEX idx_reviews_org ON reviews(organization_id);
CREATE INDEX idx_reviews_rating ON reviews(organization_id, rating);
CREATE INDEX idx_reviews_public ON reviews(organization_id, is_public) WHERE is_public = true;
CREATE INDEX idx_reviews_created ON reviews(organization_id, created_at DESC);

-- ============================================
-- Migration 00005: SMS Log
-- ============================================

-- SMS log (Twilio delivery tracking)
CREATE TABLE sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_request_id UUID REFERENCES review_requests(id),
  to_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  twilio_sid TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_log_select" ON sms_log
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_sms_log_org ON sms_log(organization_id);

-- ============================================
-- Migration 00006: Activity Log
-- ============================================

-- Activity log (audit trail)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_select" ON activity_log
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "activity_insert" ON activity_log
  FOR INSERT WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_activity_log_org ON activity_log(organization_id, created_at DESC);

-- ============================================
-- Migration 00007: Storage (Logo Uploads)
-- ============================================

-- Storage bucket for business logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Anyone can view logos (they're public)
CREATE POLICY "logos_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Org members can upload logos for their org
CREATE POLICY "logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids())
  );

-- Org members can update/delete their org logos
CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids())
  );

CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids())
  );

-- ============================================
-- Migration 00008: Add Email to Requests
-- ============================================

-- Add email support to review requests
-- Customers can provide phone, email, or both
-- If both are provided, SMS is preferred (higher conversion rate)

ALTER TABLE review_requests
  ALTER COLUMN customer_phone DROP NOT NULL,
  ADD COLUMN customer_email TEXT,
  ADD COLUMN contact_method TEXT NOT NULL DEFAULT 'sms' CHECK (contact_method IN ('sms', 'email'));

-- Ensure at least one contact method is provided
ALTER TABLE review_requests
  ADD CONSTRAINT require_contact CHECK (customer_phone IS NOT NULL OR customer_email IS NOT NULL);

-- Add email to reviews table too (for linking)
ALTER TABLE reviews
  ADD COLUMN customer_email TEXT;

-- Add email to SMS log (rename to contact_log conceptually, but keep table name for simplicity)
ALTER TABLE sms_log
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms', 'email'));

-- ============================================
-- Migration 00009: Fix Onboarding RLS
-- ============================================

-- Fix: The member_owner_insert policy had a self-referential NOT EXISTS check
-- that used "organization_members.organization_id" inside a subquery on the
-- same table, making the reference ambiguous. PostgreSQL resolved it to the
-- subquery's own table, so the NOT EXISTS always found a row and returned
-- false, blocking first-member inserts during onboarding.
--
-- The fix uses NEW row values via a WITH CHECK that references the insert
-- columns directly and qualifies the subquery table with an alias.

-- Drop the broken policy
DROP POLICY IF EXISTS "member_owner_insert" ON organization_members;

-- Recreate: allow insert if either:
--   1) The user is already an owner of the target org (for inviting staff), OR
--   2) The user is inserting themselves (user_id = auth.uid()) as the first
--      member of an org that has no existing members yet (onboarding).
CREATE POLICY "member_owner_insert" ON organization_members
  FOR INSERT WITH CHECK (
    -- Existing owners can add members
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'owner'
    )
    OR (
      -- New user onboarding: inserting yourself into an org with no members yet
      user_id = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.organization_id = organization_members.organization_id
      )
    )
  );

-- Ensure the org_insert policy allows any authenticated user to create orgs.
DROP POLICY IF EXISTS "org_insert" ON organizations;

CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to SELECT orgs that have no members yet.
-- This is needed because the onboarding wizard does .insert().select('id')
-- which requires both INSERT and SELECT policies. The org_member_select policy
-- requires the user to be a member, but they haven't been added yet.
CREATE POLICY "org_new_select" ON organizations
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM organization_members om WHERE om.organization_id = organizations.id
    )
  );

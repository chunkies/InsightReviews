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

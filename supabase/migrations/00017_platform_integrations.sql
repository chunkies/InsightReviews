-- Platform integrations: OAuth connections to external review platforms
CREATE TABLE organization_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('google', 'facebook', 'yelp')),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  platform_account_id text,       -- Google location ID, FB page ID, Yelp business ID
  platform_account_name text,     -- Display name
  platform_url text,              -- Direct link to the business profile
  connected_at timestamptz DEFAULT now(),
  last_synced_at timestamptz,
  sync_enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, platform)
);

-- External reviews fetched from connected platforms
CREATE TABLE external_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES organization_integrations(id) ON DELETE CASCADE,
  platform text NOT NULL,
  platform_review_id text,        -- Dedup key from the platform
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  reviewer_name text,
  reviewer_avatar_url text,
  review_date timestamptz,
  reply_text text,
  replied_at timestamptz,
  raw_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(integration_id, platform_review_id)
);

-- RLS
ALTER TABLE organization_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON organization_integrations
  FOR ALL USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "org_isolation" ON external_reviews
  FOR ALL USING (organization_id IN (SELECT get_user_org_ids()));

-- Indexes
CREATE INDEX idx_org_integrations_org ON organization_integrations(organization_id);
CREATE INDEX idx_external_reviews_org ON external_reviews(organization_id);
CREATE INDEX idx_external_reviews_integration ON external_reviews(integration_id);
CREATE INDEX idx_external_reviews_platform ON external_reviews(organization_id, platform);
CREATE INDEX idx_external_reviews_date ON external_reviews(organization_id, review_date DESC);

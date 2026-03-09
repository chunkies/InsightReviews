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

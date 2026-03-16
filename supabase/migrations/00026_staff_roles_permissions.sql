-- Staff Roles & Permissions System
-- Adds: roles table, pending invite status, email/name caching on members

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select" ON roles
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "roles_owner_insert" ON roles
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'owner'
    )
  );

CREATE POLICY "roles_owner_update" ON roles
  FOR UPDATE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'owner'
    )
  );

CREATE POLICY "roles_owner_delete" ON roles
  FOR DELETE USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'owner'
    )
  );

-- 2. Alter organization_members
ALTER TABLE organization_members
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- Add check constraint for status
ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_status_check CHECK (status IN ('pending', 'active'));

-- 3. Create default "Staff" role for each existing organization
INSERT INTO roles (organization_id, name, permissions)
SELECT id, 'Staff', '["dashboard", "collect", "reviews", "support"]'::jsonb
FROM organizations
ON CONFLICT (organization_id, name) DO NOTHING;

-- 4. Backfill existing staff members with the default role
UPDATE organization_members om
SET role_id = r.id
FROM roles r
WHERE om.organization_id = r.organization_id
  AND r.name = 'Staff'
  AND om.role = 'staff'
  AND om.role_id IS NULL;

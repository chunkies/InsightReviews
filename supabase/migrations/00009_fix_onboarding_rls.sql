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
-- The original migration already has WITH CHECK (true), but we re-assert it
-- in case a later migration altered it.
DROP POLICY IF EXISTS "org_insert" ON organizations;

CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

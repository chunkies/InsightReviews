-- Fix infinite recursion in organization_members UPDATE policies.
-- The owner update policy queried organization_members from within
-- an UPDATE policy on organization_members, causing recursion.

-- Helper: check if current user is an owner in a given org (bypasses RLS)
CREATE OR REPLACE FUNCTION is_org_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = auth.uid() AND role = 'owner' AND organization_id = org_id
  );
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "member_owner_update" ON organization_members;

-- Recreate using the SECURITY DEFINER function (no recursion)
CREATE POLICY "member_owner_update" ON organization_members
  FOR UPDATE USING (is_org_owner(organization_id));

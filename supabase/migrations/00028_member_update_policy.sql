-- Allow members to update their own profile fields
CREATE POLICY "member_self_update" ON organization_members
  FOR UPDATE USING (user_id = auth.uid());

-- Allow owners to update any member in their org (role changes, etc.)
CREATE POLICY "member_owner_update" ON organization_members
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Security hardening: restrict review_platforms write access to owners only
-- Previously any org member (including staff) could modify platforms

DROP POLICY IF EXISTS "platform_owner_insert" ON review_platforms;
DROP POLICY IF EXISTS "platform_owner_update" ON review_platforms;
DROP POLICY IF EXISTS "platform_owner_delete" ON review_platforms;

CREATE POLICY "platform_owner_insert" ON review_platforms
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "platform_owner_update" ON review_platforms
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "platform_owner_delete" ON review_platforms
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Add explicit deny policies for audit trail tables
CREATE POLICY "no_delete_reviews" ON reviews
  FOR DELETE USING (false);

CREATE POLICY "no_update_activity" ON activity_log
  FOR UPDATE USING (false);

CREATE POLICY "no_delete_activity" ON activity_log
  FOR DELETE USING (false);

CREATE POLICY "no_update_sms" ON sms_log
  FOR UPDATE USING (false);

CREATE POLICY "no_delete_sms" ON sms_log
  FOR DELETE USING (false);

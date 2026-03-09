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

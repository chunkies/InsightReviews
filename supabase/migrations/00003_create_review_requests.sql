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

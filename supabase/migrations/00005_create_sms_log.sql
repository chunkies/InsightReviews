-- SMS log (Twilio delivery tracking)
CREATE TABLE sms_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_request_id UUID REFERENCES review_requests(id),
  to_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  twilio_sid TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sms_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_log_select" ON sms_log
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_sms_log_org ON sms_log(organization_id);

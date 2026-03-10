-- Add auto follow-up configuration to organizations
ALTER TABLE organizations
  ADD COLUMN auto_followup_enabled BOOLEAN DEFAULT false,
  ADD COLUMN auto_followup_delay_hours INTEGER DEFAULT 2,
  ADD COLUMN auto_followup_message TEXT DEFAULT 'Hi {customer_name}, thank you for your recent visit to {business_name}. We noticed your experience wasn''t perfect and we''d love to make it right. Please reply to this message or give us a call so we can help.';

-- Create followup_queue table
CREATE TABLE followup_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  channel TEXT NOT NULL DEFAULT 'email',
  to_contact TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for efficient cron queries
CREATE INDEX idx_followup_queue_pending ON followup_queue (status, scheduled_at)
  WHERE status = 'pending';

CREATE INDEX idx_followup_queue_org ON followup_queue (organization_id);

-- Enable RLS
ALTER TABLE followup_queue ENABLE ROW LEVEL SECURITY;

-- Org isolation policy
CREATE POLICY "org_isolation" ON followup_queue
  FOR ALL USING (
    organization_id IN (SELECT get_user_org_ids())
  );

-- Allow service role full access (for cron processing)
CREATE POLICY "service_role_all" ON followup_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

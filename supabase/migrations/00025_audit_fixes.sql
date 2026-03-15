-- 00025_audit_fixes.sql
-- Performance indexes, RLS hardening, and constraint fixes

-- 1. Index on organization_members(user_id) for RLS performance
--    get_user_org_ids() queries this on every authenticated request
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
  ON organization_members(user_id);

-- 2. Enable RLS on webhook_events and add service_role bypass
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'webhook_events' AND policyname = 'service_role_all'
  ) THEN
    CREATE POLICY "service_role_all" ON webhook_events
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END
$$;

-- 3. CHECK constraint on reviews.source
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'check_review_source'
  ) THEN
    ALTER TABLE reviews
      ADD CONSTRAINT check_review_source
      CHECK (source IN ('qr', 'sms', 'direct'));
  END IF;
END
$$;

-- 4. NOT NULL constraint on reviews.source (already has DEFAULT 'direct')
ALTER TABLE reviews ALTER COLUMN source SET NOT NULL;

-- 5. Missing indexes
CREATE INDEX IF NOT EXISTS idx_reviews_source
  ON reviews(organization_id, source);

CREATE INDEX IF NOT EXISTS idx_reviews_request_id
  ON reviews(review_request_id);

CREATE INDEX IF NOT EXISTS idx_sms_log_request_id
  ON sms_log(review_request_id);

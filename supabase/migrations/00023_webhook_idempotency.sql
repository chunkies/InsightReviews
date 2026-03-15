-- Webhook idempotency table to prevent duplicate Stripe event processing
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for cleanup of old events
CREATE INDEX idx_webhook_events_processed_at ON webhook_events (processed_at);

-- Auto-cleanup events older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS void AS $$
BEGIN
  DELETE FROM webhook_events WHERE processed_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

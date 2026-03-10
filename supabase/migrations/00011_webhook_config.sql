-- Add webhook and notification columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notify_on_negative BOOLEAN NOT NULL DEFAULT true;

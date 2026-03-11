-- Add subscription_ends_at to track when a cancelled subscription loses access
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz;

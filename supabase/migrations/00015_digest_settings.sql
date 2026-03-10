-- Add digest email settings to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS digest_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS digest_frequency TEXT NOT NULL DEFAULT 'weekly';

-- Add a check constraint for valid frequency values
ALTER TABLE organizations
  ADD CONSTRAINT digest_frequency_check
  CHECK (digest_frequency IN ('daily', 'weekly', 'monthly'));

-- Fix existing integrations that were connected before sync_enabled default was added
UPDATE organization_integrations
SET sync_enabled = true
WHERE sync_enabled IS NULL OR sync_enabled = false;

UPDATE organization_integrations
SET show_on_review_form = true
WHERE show_on_review_form IS NULL;

-- Set default for future inserts
ALTER TABLE organization_integrations
ALTER COLUMN sync_enabled SET DEFAULT true;

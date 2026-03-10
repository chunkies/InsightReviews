-- Repair: add wall_config if missing
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS wall_config JSONB NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN organizations.wall_config IS 'Customization settings for public testimonial wall and review form';

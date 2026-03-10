-- Wall & review form customization settings stored as JSONB on organizations
ALTER TABLE organizations
  ADD COLUMN wall_config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN organizations.wall_config IS 'Customization settings for public testimonial wall and review form';

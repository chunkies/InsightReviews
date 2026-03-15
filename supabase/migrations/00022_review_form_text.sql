-- Add customizable review form heading and subheading
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS review_form_heading text NOT NULL DEFAULT 'How was your experience?',
  ADD COLUMN IF NOT EXISTS review_form_subheading text NOT NULL DEFAULT 'at {business_name}';

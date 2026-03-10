-- Add toggle for showing integration link on the public review form
ALTER TABLE organization_integrations
  ADD COLUMN show_on_review_form boolean DEFAULT true;

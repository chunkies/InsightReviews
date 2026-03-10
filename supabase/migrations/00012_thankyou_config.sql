-- Add customizable thank-you page fields to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS thankyou_positive_title TEXT DEFAULT 'Thank You!',
  ADD COLUMN IF NOT EXISTS thankyou_positive_message TEXT DEFAULT 'We really appreciate your feedback. Would you mind sharing your experience on one of these platforms?',
  ADD COLUMN IF NOT EXISTS thankyou_negative_title TEXT DEFAULT 'Thank You for Your Feedback',
  ADD COLUMN IF NOT EXISTS thankyou_negative_message TEXT DEFAULT 'We appreciate you letting us know. Your feedback helps us improve. We''ll follow up with you soon.',
  ADD COLUMN IF NOT EXISTS thankyou_coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS thankyou_coupon_text TEXT DEFAULT 'Here''s a little thank you from us:',
  ADD COLUMN IF NOT EXISTS thankyou_social_links JSONB DEFAULT '{}';

-- Add email support to review requests
-- Customers can provide phone, email, or both
-- If both are provided, SMS is preferred (higher conversion rate)

ALTER TABLE review_requests
  ALTER COLUMN customer_phone DROP NOT NULL,
  ADD COLUMN customer_email TEXT,
  ADD COLUMN contact_method TEXT NOT NULL DEFAULT 'sms' CHECK (contact_method IN ('sms', 'email'));

-- Ensure at least one contact method is provided
ALTER TABLE review_requests
  ADD CONSTRAINT require_contact CHECK (customer_phone IS NOT NULL OR customer_email IS NOT NULL);

-- Add email to reviews table too (for linking)
ALTER TABLE reviews
  ADD COLUMN customer_email TEXT;

-- Add email to SMS log (rename to contact_log conceptually, but keep table name for simplicity)
ALTER TABLE sms_log
  ADD COLUMN channel TEXT NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms', 'email'));

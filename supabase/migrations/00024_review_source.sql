-- Track how customers arrived at the review form (qr, sms, direct)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'direct';

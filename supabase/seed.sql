-- Seed data for local development
-- Creates a demo business with reviews so you can see the app in action

-- Create a demo user (password: demo123456)
-- In local dev, use the Supabase Studio or magic link to create a real user.
-- This seed creates the org data that the user will be linked to during onboarding.

-- Demo organization: Joe's Cafe
INSERT INTO organizations (id, name, slug, phone, email, address, positive_threshold, sms_template, billing_plan, trial_ends_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Joe''s Cafe',
  'joes-cafe',
  '+1 555 0100',
  'joe@joescafe.com',
  '123 Main St, Austin TX',
  4,
  'Thanks for visiting {business_name}! We''d love your feedback: {link}',
  'trial',
  NOW() + INTERVAL '14 days'
);

-- Demo organization: Glow Beauty Bar
INSERT INTO organizations (id, name, slug, phone, email, address, positive_threshold, sms_template, billing_plan, trial_ends_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Glow Beauty Bar',
  'glow-beauty',
  '+1 555 0200',
  'sarah@glowbeauty.com',
  '456 Oak Ave, Portland OR',
  4,
  'Hi from {business_name}! How did we do? Let us know: {link}',
  'active',
  NULL
);

-- Review platforms for Joe's Cafe
INSERT INTO review_platforms (organization_id, platform, url, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'google', 'https://g.page/r/joescafe/review', 0),
  ('00000000-0000-0000-0000-000000000001', 'yelp', 'https://www.yelp.com/writeareview/biz/joes-cafe', 1),
  ('00000000-0000-0000-0000-000000000001', 'facebook', 'https://www.facebook.com/joescafe/reviews', 2);

-- Review platforms for Glow Beauty Bar
INSERT INTO review_platforms (organization_id, platform, url, display_order) VALUES
  ('00000000-0000-0000-0000-000000000002', 'google', 'https://g.page/r/glowbeauty/review', 0),
  ('00000000-0000-0000-0000-000000000002', 'yelp', 'https://www.yelp.com/writeareview/biz/glow-beauty', 1);

-- Sample reviews for Joe's Cafe
INSERT INTO reviews (organization_id, rating, comment, customer_name, is_positive, is_public, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 5, 'Best coffee in town! The baristas are so friendly and the atmosphere is perfect for working.', 'Emma W.', true, true, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 5, 'Amazing pastries and great service. Will definitely be coming back!', 'Mike R.', true, true, NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', 4, 'Good coffee, nice vibe. A bit crowded during peak hours but overall great.', 'Sarah L.', true, true, NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001', 5, 'The cold brew is incredible. Hands down the best in Austin.', 'James K.', true, true, NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000001', 2, 'Wait time was too long today. Took 20 minutes for a simple latte.', 'Tom H.', false, false, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001', 5, 'Love this place! Great for meetings and the wifi is fast.', 'Lisa M.', true, true, NOW() - INTERVAL '6 days'),
  ('00000000-0000-0000-0000-000000000001', 4, 'Solid breakfast menu. The avocado toast is chef''s kiss.', 'Dave P.', true, true, NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000001', 1, 'Found a hair in my food. Very disappointing.', 'Karen S.', false, false, NOW() - INTERVAL '8 days'),
  ('00000000-0000-0000-0000-000000000001', 5, 'My go-to coffee spot. The staff remembers my order!', 'Chris B.', true, true, NOW() - INTERVAL '9 days'),
  ('00000000-0000-0000-0000-000000000001', 4, 'Great ambiance and friendly staff. Prices are fair.', 'Nina G.', true, true, NOW() - INTERVAL '10 days'),
  ('00000000-0000-0000-0000-000000000001', 5, 'Just moved to the area and this is already my favorite spot.', 'Alex T.', true, true, NOW() - INTERVAL '11 days'),
  ('00000000-0000-0000-0000-000000000001', 3, 'Coffee is okay. Nothing special but not bad either.', 'Pat O.', false, false, NOW() - INTERVAL '12 days'),
  ('00000000-0000-0000-0000-000000000001', 5, 'The team here genuinely cares about quality. You can taste it.', 'Rachel F.', true, true, NOW() - INTERVAL '13 days'),
  ('00000000-0000-0000-0000-000000000001', 4, 'Nice outdoor seating area. Perfect for Sunday mornings.', 'Ben W.', true, true, NOW() - INTERVAL '14 days');

-- Sample reviews for Glow Beauty Bar
INSERT INTO reviews (organization_id, rating, comment, customer_name, is_positive, is_public, created_at) VALUES
  ('00000000-0000-0000-0000-000000000002', 5, 'Sarah did an amazing job with my highlights. Best salon experience ever!', 'Jennifer A.', true, true, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000002', 5, 'So relaxing and professional. My nails look perfect.', 'Amy K.', true, true, NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000002', 4, 'Great service, a bit pricey but worth it for the quality.', 'Diana L.', true, true, NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000002', 2, 'Appointment was 30 minutes late. Not acceptable.', 'Maria T.', false, false, NOW() - INTERVAL '7 days'),
  ('00000000-0000-0000-0000-000000000002', 5, 'The facial treatment was heavenly. My skin has never looked better.', 'Kate R.', true, true, NOW() - INTERVAL '9 days');

-- Sample review requests for Joe's Cafe
INSERT INTO review_requests (organization_id, customer_phone, customer_name, status, sent_at, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '+15551234567', 'Emma W.', 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', '+15559876543', 'Mike R.', 'completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', '+15551112222', 'Sarah L.', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000001', '+15553334444', 'James K.', 'completed', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000001', '+15555556666', 'Tom H.', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  ('00000000-0000-0000-0000-000000000001', '+15557778888', 'Lisa M.', 'sent', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('00000000-0000-0000-0000-000000000001', '+15559990000', 'Dave P.', 'sent', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours');

-- Activity log entries
INSERT INTO activity_log (organization_id, action, entity_type, details, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'review_request_sent', 'review_request', '{"customerPhone": "+15551234567", "customerName": "Emma W."}', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'positive_review_received', 'review', '{"rating": 5, "hasComment": true}', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'review_request_sent', 'review_request', '{"customerPhone": "+15559876543", "customerName": "Mike R."}', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', 'positive_review_received', 'review', '{"rating": 5, "hasComment": true}', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000001', 'negative_review_received', 'review', '{"rating": 2, "hasComment": true}', NOW() - INTERVAL '5 days');

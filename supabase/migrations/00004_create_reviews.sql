-- Reviews (customer feedback)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  review_request_id UUID REFERENCES review_requests(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  is_positive BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  redirected_to JSONB DEFAULT '[]'::jsonb,
  responded BOOLEAN NOT NULL DEFAULT false,
  response_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Authenticated org members can see their reviews
CREATE POLICY "review_select" ON reviews
  FOR SELECT USING (organization_id IN (SELECT get_user_org_ids()));

-- Public reviews visible for testimonial wall (no auth)
CREATE POLICY "review_public_select" ON reviews
  FOR SELECT USING (is_public = true);

-- Org members can update (toggle public, add response notes)
CREATE POLICY "review_update" ON reviews
  FOR UPDATE USING (organization_id IN (SELECT get_user_org_ids()));

-- Service role handles inserts from public review form
-- (no direct insert policy for anon — goes through API route)

CREATE INDEX idx_reviews_org ON reviews(organization_id);
CREATE INDEX idx_reviews_rating ON reviews(organization_id, rating);
CREATE INDEX idx_reviews_public ON reviews(organization_id, is_public) WHERE is_public = true;
CREATE INDEX idx_reviews_created ON reviews(organization_id, created_at DESC);

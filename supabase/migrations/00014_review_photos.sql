-- Add photo_url column to reviews table
ALTER TABLE reviews ADD COLUMN photo_url TEXT;

-- Create storage bucket for review photos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true);

-- Anyone can view review photos (they're public)
CREATE POLICY "review_photos_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-photos');

-- Service role handles inserts (anonymous users submit reviews via API)
-- This policy allows inserts for authenticated service role calls
CREATE POLICY "review_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'review-photos');

-- Org members can delete review photos for their org
CREATE POLICY "review_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'review-photos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids())
  );

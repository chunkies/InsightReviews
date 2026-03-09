-- Storage bucket for business logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Anyone can view logos (they're public)
CREATE POLICY "logos_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- Org members can upload logos for their org
CREATE POLICY "logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids())
  );

-- Org members can update/delete their org logos
CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids())
  );

CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1]::uuid IN (SELECT get_user_org_ids())
  );

-- Storage bucket for user profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Anyone can view avatars (public)
CREATE POLICY "avatars_public_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Authenticated users can upload avatars
CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Authenticated users can update their avatars
CREATE POLICY "avatars_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

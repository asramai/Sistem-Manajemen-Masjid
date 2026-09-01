-- Storage bucket untuk avatar petugas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'petugas-avatar',
  'petugas-avatar',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies
CREATE POLICY "Petugas avatar upload authenticated" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'petugas-avatar');
CREATE POLICY "Petugas avatar update authenticated" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'petugas-avatar');
CREATE POLICY "Petugas avatar delete authenticated" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'petugas-avatar');
CREATE POLICY "Petugas avatar select public" ON storage.objects FOR SELECT USING (bucket_id = 'petugas-avatar');

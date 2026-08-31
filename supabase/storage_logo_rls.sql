-- Storage RLS untuk bucket logo
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logo', 'logo', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logo upload authenticated" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logo');
CREATE POLICY "Logo update authenticated" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'logo');
CREATE POLICY "Logo delete authenticated" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'logo');
CREATE POLICY "Logo select public" ON storage.objects FOR SELECT USING (bucket_id = 'logo');

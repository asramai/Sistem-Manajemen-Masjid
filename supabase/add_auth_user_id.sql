-- Tambah kolom auth_user_id ke tabel petugas
ALTER TABLE public.petugas ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_petugas_auth_user_id ON public.petugas(auth_user_id);

-- Update RLS untuk allow admin update auth_user_id
CREATE POLICY "Admin can update petugas auth_user_id" ON public.petugas FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'takmir'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'takmir'))
);

-- Tabel Profil Masjid
CREATE TABLE IF NOT EXISTS public.profil_masjid (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_masjid TEXT NOT NULL DEFAULT 'Masjid ...',
  alamat TEXT NOT NULL DEFAULT '',
  nomor_kontak TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  ketua_takmir TEXT DEFAULT '',
  sekretaris TEXT DEFAULT '',
  bendahara TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed data default
INSERT INTO public.profil_masjid (id, nama_masjid, alamat, nomor_kontak, ketua_takmir, sekretaris, bendahara)
VALUES ('00000000-0000-0000-0000-000000000001', 'Masjid ...', '', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE public.profil_masjid ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profil masjid viewable by authenticated users" ON public.profil_masjid FOR SELECT TO authenticated USING (true);
CREATE POLICY "Profil masjid editable by admin" ON public.profil_masjid FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'takmir'))
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profil_masjid BEFORE UPDATE ON public.profil_masjid FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

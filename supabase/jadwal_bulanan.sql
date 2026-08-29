-- Tabel Jadwal Bulanan
CREATE TABLE IF NOT EXISTS public.jadwal_bulanan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tanggal DATE NOT NULL,
  nama_sholat TEXT NOT NULL,
  imam_utama_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  imam_cadangan_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  muadzin_utama_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  muadzin_cadangan_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  is_jumat_manual BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(tanggal, nama_sholat)
);

-- Tabel Konfirmasi Izin
CREATE TABLE IF NOT EXISTS public.konfirmasi_izin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES public.petugas(id) ON DELETE CASCADE NOT NULL,
  tanggal DATE NOT NULL,
  nama_sholat TEXT NOT NULL,
  alasan TEXT,
  bukti_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(petugas_id, tanggal, nama_sholat)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_jadwal_bulanan_tanggal ON public.jadwal_bulanan(tanggal);
CREATE INDEX IF NOT EXISTS idx_konfirmasi_izin_petugas ON public.konfirmasi_izin(petugas_id);
CREATE INDEX IF NOT EXISTS idx_konfirmasi_izin_tanggal ON public.konfirmasi_izin(tanggal);

-- RLS
ALTER TABLE public.jadwal_bulanan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.konfirmasi_izin ENABLE ROW LEVEL SECURITY;

-- Policies untuk jadwal_bulanan
CREATE POLICY "Jadwal bulanan viewable by authenticated users" ON public.jadwal_bulanan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Jadwal bulanan editable by admin" ON public.jadwal_bulanan FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'takmir'))
);

-- Policies untuk konfirmasi_izin
CREATE POLICY "Konfirmasi izin viewable by owner" ON public.konfirmasi_izin FOR SELECT TO authenticated USING (
  auth.uid() = petugas_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'takmir'))
);
CREATE POLICY "Konfirmasi izin insertable by owner" ON public.konfirmasi_izin FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = petugas_id
);
CREATE POLICY "Konfirmasi izin updatable by admin" ON public.konfirmasi_izin FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'takmir'))
);

-- Trigger untuk updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_jadwal_bulanan BEFORE UPDATE ON public.jadwal_bulanan FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_konfirmasi_izin BEFORE UPDATE ON public.konfirmasi_izin FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed data contoh untuk Agustus 2026
INSERT INTO public.jadwal_bulanan (tanggal, nama_sholat, imam_utama_id, muadzin_utama_id, is_jumat_manual)
SELECT '2026-08-07', 'Jumat', 
  (SELECT id FROM public.petugas WHERE nama LIKE '%Wisno%' LIMIT 1),
  (SELECT id FROM public.petugas WHERE nama LIKE '%Rizki%' LIMIT 1),
  true
ON CONFLICT DO NOTHING;

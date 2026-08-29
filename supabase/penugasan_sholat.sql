-- Tabel Penugasan Petugas Sholat
CREATE TABLE IF NOT EXISTS public.penugasan_sholat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jadwal_id UUID REFERENCES public.jadwal(id) ON DELETE CASCADE NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  muadzin_utama_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  muadzin_cadangan_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  imam_utama_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  imam_cadangan_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(jadwal_id, tanggal)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_penugasan_tanggal ON public.penugasan_sholat(tanggal);
CREATE INDEX IF NOT EXISTS idx_penugasan_jadwal ON public.penugasan_sholat(jadwal_id);

-- RLS
ALTER TABLE public.penugasan_sholat ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Penugasan viewable by authenticated users" ON public.penugasan_sholat FOR SELECT TO authenticated USING (true);
CREATE POLICY "Penugasan editable by admin" ON public.penugasan_sholat FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'takmir'))
);

-- Trigger untuk updated_at
CREATE TRIGGER set_updated_at_penugasan BEFORE UPDATE ON public.penugasan_sholat FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

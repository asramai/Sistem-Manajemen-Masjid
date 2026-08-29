-- Tabel Biaya Transport per Petugas per Sholat
CREATE TABLE IF NOT EXISTS public.biaya_transport (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES public.petugas(id) ON DELETE CASCADE NOT NULL,
  nama_sholat TEXT NOT NULL,
  nominal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(petugas_id, nama_sholat)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_biaya_transport_petugas ON public.biaya_transport(petugas_id);

-- RLS
ALTER TABLE public.biaya_transport ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Biaya transport viewable by authenticated users" ON public.biaya_transport FOR SELECT TO authenticated USING (true);
CREATE POLICY "Biaya transport editable by admin" ON public.biaya_transport FOR ALL TO authenticated USING (
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

CREATE TRIGGER set_updated_at_biaya_transport BEFORE UPDATE ON public.biaya_transport FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed data contoh
INSERT INTO public.biaya_transport (petugas_id, nama_sholat, nominal)
SELECT p.id, 'Subuh', 10000 FROM public.petugas p WHERE p.role = 'imam'
UNION ALL
SELECT p.id, 'Dzuhur', 15000 FROM public.petugas p WHERE p.role = 'imam'
UNION ALL
SELECT p.id, 'Ashar', 10000 FROM public.petugas p WHERE p.role = 'imam'
UNION ALL
SELECT p.id, 'Maghrib', 20000 FROM public.petugas p WHERE p.role = 'imam'
UNION ALL
SELECT p.id, 'Isya', 10000 FROM public.petugas p WHERE p.role = 'imam'
UNION ALL
SELECT p.id, 'Subuh', 5000 FROM public.petugas p WHERE p.role = 'muadzin'
UNION ALL
SELECT p.id, 'Dzuhur', 8000 FROM public.petugas p WHERE p.role = 'muadzin'
UNION ALL
SELECT p.id, 'Ashar', 5000 FROM public.petugas p WHERE p.role = 'muadzin'
UNION ALL
SELECT p.id, 'Maghrib', 10000 FROM public.petugas p WHERE p.role = 'muadzin'
UNION ALL
SELECT p.id, 'Isya', 5000 FROM public.petugas p WHERE p.role = 'muadzin'
ON CONFLICT DO NOTHING;

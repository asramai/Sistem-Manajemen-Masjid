-- Tabel Biaya Transport per Role per Sholat
CREATE TABLE IF NOT EXISTS public.biaya_transport (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_sholat TEXT NOT NULL,
  peran TEXT NOT NULL CHECK (peran IN ('imam', 'muadzin')),
  nominal NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(nama_sholat, peran)
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_biaya_transport_sholat_peran ON public.biaya_transport(nama_sholat, peran);

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
INSERT INTO public.biaya_transport (nama_sholat, peran, nominal) VALUES
  ('Subuh', 'imam', 27000),
  ('Dzuhur', 'imam', 27000),
  ('Ashar', 'imam', 27000),
  ('Maghrib', 'imam', 27000),
  ('Isya', 'imam', 27000),
  ('Jumat', 'imam', 27000),
  ('Subuh', 'muadzin', 21000),
  ('Dzuhur', 'muadzin', 21000),
  ('Ashar', 'muadzin', 21000),
  ('Maghrib', 'muadzin', 21000),
  ('Isya', 'muadzin', 21000)
ON CONFLICT (nama_sholat, peran) DO NOTHING;

-- Sistem Manajemen Masjid - Database Schema
-- Jalankan SQL ini di SQL Editor Supabase untuk membuat tabel-tabel yang diperlukan.

-- Tabel Pengguna (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'petugas' CHECK (role IN ('super_admin', 'admin', 'takmir', 'petugas')),
  phone TEXT,
  sub_role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Petugas / Data Karyawan
CREATE TABLE IF NOT EXISTS public.petugas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'petugas' CHECK (role IN ('imam', 'muadzin', 'bilal', 'marbot')),
  phone TEXT,
  avatar_url TEXT,
  honor_per_hadir NUMERIC DEFAULT 0,
  honor_bulanan NUMERIC DEFAULT 0,
  tipe_honor TEXT DEFAULT 'per_hadir' CHECK (tipe_honor IN ('per_hadir', 'bulanan')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Jadwal Sholat
CREATE TABLE IF NOT EXISTS public.jadwal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_sholat TEXT NOT NULL,
  waktu_mulai TIME,
  waktu_selesai TIME,
  hari TEXT CHECK (hari IN ('senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu')),
  is_jumat BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Tabel Presensi
CREATE TABLE IF NOT EXISTS public.presensi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES public.petugas(id) ON DELETE CASCADE NOT NULL,
  jadwal_id UUID REFERENCES public.jadwal(id) ON DELETE CASCADE NOT NULL,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'hadir' CHECK (status IN ('hadir', 'izin', 'alpha')),
  keterangan TEXT,
  petugas_pengganti_id UUID REFERENCES public.petugas(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(petugas_id, jadwal_id, tanggal)
);

-- Tabel Gaji / Honor
CREATE TABLE IF NOT EXISTS public.gaji (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  petugas_id UUID REFERENCES public.petugas(id) ON DELETE CASCADE NOT NULL,
  bulan TEXT NOT NULL,
  tahun INTEGER NOT NULL,
  total_hadir INTEGER DEFAULT 0,
  total_izin INTEGER DEFAULT 0,
  total_alpha INTEGER DEFAULT 0,
  total_honor NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(petugas_id, bulan, tahun)
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_presensi_tanggal ON public.presensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_presensi_petugas ON public.presensi(petugas_id);
CREATE INDEX IF NOT EXISTS idx_gaji_petugas ON public.gaji(petugas_id, tahun, bulan);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presensi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gaji ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Petugas are viewable by authenticated users" ON public.petugas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Petugas are editable by admin" ON public.petugas FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

CREATE POLICY "Jadwal are viewable by authenticated users" ON public.jadwal FOR SELECT TO authenticated USING (true);

CREATE POLICY "Presensi viewable by authenticated users" ON public.presensi FOR SELECT TO authenticated USING (true);
CREATE POLICY "Presensi editable by admin" ON public.presensi FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'takmir'))
);

CREATE POLICY "Gaji viewable by authenticated users" ON public.gaji FOR SELECT TO authenticated USING (true);
CREATE POLICY "Gaji editable by admin" ON public.gaji FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
);

-- Trigger untuk updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_petugas BEFORE UPDATE ON public.petugas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_presensi BEFORE UPDATE ON public.presensi FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_gaji BEFORE UPDATE ON public.gaji FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed data contoh untuk jadwal sholat
INSERT INTO public.jadwal (nama_sholat, waktu_mulai, waktu_selesai, hari, is_jumat) VALUES
  ('Subuh', '04:15', '05:00', 'senin', false),
  ('Subuh', '04:15', '05:00', 'selasa', false),
  ('Subuh', '04:15', '05:00', 'rabu', false),
  ('Subuh', '04:15', '05:00', 'kamis', false),
  ('Subuh', '04:15', '05:00', 'jumat', false),
  ('Subuh', '04:15', '05:00', 'sabtu', false),
  ('Subuh', '04:15', '05:00', 'minggu', false),
  ('Dzuhur', '12:30', '13:15', 'senin', false),
  ('Dzuhur', '12:30', '13:15', 'selasa', false),
  ('Dzuhur', '12:30', '13:15', 'rabu', false),
  ('Dzuhur', '12:30', '13:15', 'kamis', false),
  ('Jumat', '12:30', '13:30', 'jumat', true),
  ('Dzuhur', '12:30', '13:15', 'sabtu', false),
  ('Dzuhur', '12:30', '13:15', 'minggu', false),
  ('Ashar', '15:30', '16:15', 'senin', false),
  ('Ashar', '15:30', '16:15', 'selasa', false),
  ('Ashar', '15:30', '16:15', 'rabu', false),
  ('Ashar', '15:30', '16:15', 'kamis', false),
  ('Ashar', '15:30', '16:15', 'jumat', false),
  ('Ashar', '15:30', '16:15', 'sabtu', false),
  ('Ashar', '15:30', '16:15', 'minggu', false),
  ('Maghrib', '17:45', '18:15', 'senin', false),
  ('Maghrib', '17:45', '18:15', 'selasa', false),
  ('Maghrib', '17:45', '18:15', 'rabu', false),
  ('Maghrib', '17:45', '18:15', 'kamis', false),
  ('Maghrib', '17:45', '18:15', 'jumat', false),
  ('Maghrib', '17:45', '18:15', 'sabtu', false),
  ('Maghrib', '17:45', '18:15', 'minggu', false),
  ('Isya', '19:00', '19:30', 'senin', false),
  ('Isya', '19:00', '19:30', 'selasa', false),
  ('Isya', '19:00', '19:30', 'rabu', false),
  ('Isya', '19:00', '19:30', 'kamis', false),
  ('Isya', '19:00', '19:30', 'jumat', false),
  ('Isya', '19:00', '19:30', 'sabtu', false),
  ('Isya', '19:00', '19:30', 'minggu', false)
ON CONFLICT DO NOTHING;

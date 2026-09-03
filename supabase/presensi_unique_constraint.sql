-- Drop existing unique constraint
ALTER TABLE public.presensi DROP CONSTRAINT IF EXISTS presensi_unique;

-- Add new unique constraint including peran
ALTER TABLE public.presensi ADD CONSTRAINT presensi_unique UNIQUE (petugas_id, jadwal_id, tanggal, status, peran);

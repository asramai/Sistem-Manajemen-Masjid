-- Add unique constraint to prevent duplicate presensi
ALTER TABLE public.presensi ADD CONSTRAINT presensi_unique UNIQUE (petugas_id, jadwal_id, tanggal, status);

-- Create index for better performance on lookups
CREATE INDEX IF NOT EXISTS idx_presensi_lookup ON public.presensi (petugas_id, jadwal_id, tanggal);

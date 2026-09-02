-- Update status presensi untuk mendukung 'pending'
ALTER TABLE public.presensi DROP CONSTRAINT IF EXISTS presensi_status_check;
ALTER TABLE public.presensi ADD CONSTRAINT presensi_status_check CHECK (status IN ('hadir', 'izin', 'alpha', 'pending'));

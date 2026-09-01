-- Update status izin untuk mendukung 'kembali'
ALTER TABLE public.konfirmasi_izin DROP CONSTRAINT IF EXISTS konfirmasi_izin_status_check;
ALTER TABLE public.konfirmasi_izin ADD CONSTRAINT konfirmasi_izin_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'kembali'));

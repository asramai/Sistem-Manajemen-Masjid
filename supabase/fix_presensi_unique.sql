-- Fix unique constraint presensi agar support multiple peran per sholat
ALTER TABLE public.presensi DROP CONSTRAINT IF EXISTS presensi_petugas_id_jadwal_id_tanggal_key;
ALTER TABLE public.presensi ADD CONSTRAINT presensi_petugas_id_jadwal_id_tanggal_peran_key UNIQUE (petugas_id, jadwal_id, tanggal, peran);

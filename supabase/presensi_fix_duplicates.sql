-- 1. Identify duplicate jadwal_id for the same nama_sholat
SELECT j.nama_sholat, j.id, COUNT(*) 
FROM jadwal j
GROUP BY j.nama_sholat, j.id
HAVING COUNT(*) > 1;

-- 2. Show jadwal_bulanan that reference duplicate jadwal_id
SELECT jb.tanggal, jb.nama_sholat, jb.id AS jadwal_bulanan_id, j.id AS jadwal_id
FROM jadwal_bulanan jb
JOIN jadwal j ON jb.jadwal_id = j.id
WHERE jb.tanggal = '2026-09-01' AND jb.nama_sholat = 'Subuh';

-- 3. Clean up duplicate presensi (keep oldest record)
DELETE FROM presensi
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY petugas_id, jadwal_id, tanggal, status
             ORDER BY created_at
           ) AS rn
    FROM presensi
    WHERE status = 'hadir'
  ) t
  WHERE t.rn > 1
);

-- 4. Add unique constraint after cleanup
ALTER TABLE public.presensi ADD CONSTRAINT presensi_unique UNIQUE (petugas_id, jadwal_id, tanggal, status);

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_presensi_lookup ON public.presensi (petugas_id, jadwal_id, tanggal);

-- Create presensi_audit table
CREATE TABLE IF NOT EXISTS public.presensi_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presensi_id UUID NOT NULL,
  petugas_id UUID NOT NULL,
  jadwal_id UUID NOT NULL,
  tanggal DATE NOT NULL,
  status_lama TEXT,
  status_baru TEXT NOT NULL,
  peran TEXT NOT NULL,
  aksi TEXT NOT NULL,
  petugas_eksekutor_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_presensi_audit_lookup ON public.presensi_audit (presensi_id, petugas_id, jadwal_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_presensi_audit_created ON public.presensi_audit (created_at DESC);

-- Enable RLS
ALTER TABLE public.presensi_audit ENABLE ROW LEVEL SECURITY;

-- Policy for reading audit log
CREATE POLICY "Allow read presensi_audit"
  ON public.presensi_audit
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admin to insert audit log
CREATE POLICY "Allow admin insert presensi_audit"
  ON public.presensi_audit
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Enable RLS on presensi table if not already enabled
ALTER TABLE public.presensi ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read presensi" ON public.presensi;
DROP POLICY IF EXISTS "Allow admin insert presensi" ON public.presensi;
DROP POLICY IF EXISTS "Allow admin update presensi" ON public.presensi;
DROP POLICY IF EXISTS "Allow admin delete presensi" ON public.presensi;
DROP POLICY IF EXISTS "Allow petugas insert pending presensi" ON public.presensi;

-- Policy for reading presensi (all authenticated users can read)
CREATE POLICY "Allow read presensi"
  ON public.presensi
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for admin to insert presensi
CREATE POLICY "Allow admin insert presensi"
  ON public.presensi
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy for petugas to insert presensi (only pending)
CREATE POLICY "Allow petugas insert pending presensi"
  ON public.presensi
  FOR INSERT
  TO authenticated
  WITH CHECK (
    status = 'pending' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'petugas'
  );

-- Policy for admin to update presensi
CREATE POLICY "Allow admin update presensi"
  ON public.presensi
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Policy for admin to delete presensi
CREATE POLICY "Allow admin delete presensi"
  ON public.presensi
  FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

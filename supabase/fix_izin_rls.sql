-- Fix RLS policy untuk konfirmasi_izin agar petugas bisa insert berdasarkan auth_user_id
DROP POLICY IF EXISTS "Konfirmasi izin insertable by owner" ON public.konfirmasi_izin;

CREATE POLICY "Konfirmasi izin insertable by owner" ON public.konfirmasi_izin FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.petugas
    WHERE id = konfirmasi_izin.petugas_id
      AND auth_user_id = auth.uid()
  )
);

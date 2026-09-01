-- Insert profiles untuk user yang sudah ada di auth.users tapi belum ada di profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

INSERT INTO public.profiles (id, nama, role, phone, email)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'nama', email, 'Pengguna'),
  COALESCE(raw_user_meta_data->>'role', 'petugas'),
  raw_user_meta_data->>'phone',
  email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

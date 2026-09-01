-- Sinkronisasi otomatis auth.users -> profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nama, role, phone, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email, 'Pengguna Baru'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'petugas'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    nama = COALESCE(EXCLUDED.nama, public.profiles.nama),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    email = COALESCE(EXCLUDED.email, public.profiles.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Pastikan kolom email ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Policy insert untuk profiles
CREATE POLICY "Profiles insertable by authenticated users" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);

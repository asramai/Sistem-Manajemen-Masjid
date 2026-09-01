-- Add alamat and email columns to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alamat TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

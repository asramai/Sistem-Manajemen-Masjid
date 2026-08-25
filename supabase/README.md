# Setup Supabase untuk Sistem Manajemen Masjid

## Langkah 1: Buat Project Supabase

1. Buka https://supabase.com dan daftar/login
2. Klik **New Project**
3. Isi nama project, password database, dan pilih region terdekat
4. Tunggu hingga project siap (~2 menit)

## Langkah 2: Ambil Credentials

Setelah project dibuat:

1. Buka **Project Settings** (icon gear di sidebar)
2. Pilih **API**
3. Salin **Project URL** dan **anon/public key**

## Langkah 3: Setup Environment Variables

Salin `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi dengan credentials dari Supabase:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Langkah 4: Setup Database Schema

1. Buka Supabase Dashboard
2. Pilih **SQL Editor**
3. Klik **New query**
4. Salin seluruh isi file `supabase/schema.sql`
5. Paste dan klik **Run**

Schema ini akan membuat:
- Tabel `profiles` (data pengguna)
- Tabel `petugas` (data petugas masjid)
- Tabel `jadwal` (jadwal sholat)
- Tabel `presensi` (data kehadiran)
- Tabel `gaji` (data honor/gaji)
- Row Level Security (RLS) policies
- Index untuk optimasi query

## Langkah 5: Enable Authentication (Opsional)

1. Di Supabase Dashboard, buka **Authentication** > **Providers**
2. Pastikan **Email** provider enabled
3. (Opsional) Enable **Google** atau provider lainnya

## Langkah 6: Development

```bash
npm install
npm run dev
```

## Catatan

- Jangan commit file `.env` ke Git (sudah ada di `.gitignore`)
- Simpan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di tempat aman
- Untuk production, set environment variables di platform deployment (Vercel, Netlify, dll)

## Dokumentasi Supabase

- https://supabase.com/docs
- https://supabase.com/docs/guides/getting-started
- https://supabase.com/docs/reference/javascript

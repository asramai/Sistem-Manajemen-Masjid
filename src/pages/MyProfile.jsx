import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export default function MyProfile() {
  const { profile, session } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    phone: '',
    alamat: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    avatar_url: '',
  })
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        nama: profile.nama || '',
        phone: profile.phone || '',
        alamat: profile.alamat || '',
        avatar_url: profile.avatar_url || '',
      }))
    }
  }, [profile])

  const resizeImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          let { width, height } = img
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height)
            width = Math.floor(width * ratio)
            height = Math.floor(height * ratio)
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp' }))
              } else {
                reject(new Error('Gagal memproses gambar'))
              }
            },
            'image/webp',
            quality
          )
        }
        img.onerror = () => reject(new Error('Gagal memuat gambar'))
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error('Gagal membaca file'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const resizedFile = await resizeImage(file, 400, 400, 0.8)
      const fileExt = 'webp'
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `petugas/${fileName}`
      const { error: uploadError } = await supabase.storage.from('petugas-avatar').upload(filePath, resizedFile)
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('petugas-avatar').getPublicUrl(filePath)
      setForm((prev) => ({ ...prev, avatar_url: data.publicUrl }))
    } catch (err) {
      alert('Gagal upload foto: ' + (err.message || err))
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const updates = {
        nama: form.nama,
        phone: form.phone || null,
        alamat: form.alamat || null,
        avatar_url: form.avatar_url || null,
      }

      const { error } = await supabase.from('profiles').update(updates).eq('id', profile.id)
      if (error) throw error

      if (form.newPassword) {
        if (form.newPassword !== form.confirmPassword) {
          throw new Error('Password baru tidak cocok')
        }
        if (!form.currentPassword) {
          throw new Error('Masukkan password saat ini')
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: session.user.email,
          password: form.currentPassword,
        })
        if (signInError) throw new Error('Password saat ini salah')
        const { error: updatePasswordError } = await supabase.auth.updateUser({ password: form.newPassword })
        if (updatePasswordError) throw updatePasswordError
      }

      setMessage('Profil berhasil disimpan!')
      setEditing(false)
      window.location.reload()
    } catch (err) {
      setMessage('Gagal menyimpan: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    takmir: 'Takmir',
    petugas: 'Petugas',
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Profil Saya</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola identitas dan keamanan akun Anda.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-32 h-32 rounded-full bg-surface-container-highest overflow-hidden shrink-0 border-2 border-primary/10">
              {form.avatar_url || profile?.avatar_url ? (
                <img
                  alt={profile?.nama || 'Avatar'}
                  className="w-full h-full object-cover"
                  src={form.avatar_url || profile?.avatar_url}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-secondary font-h3 text-2xl">
                  {profile?.nama?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </div>
              )}
              {editing && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute inset-0 bg-black/40 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
                >
                  <span className="material-symbols-outlined text-[32px]">camera_alt</span>
                </button>
              )}
            </div>
            {editing && (
              <div className="flex flex-col items-center gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="text-primary font-label-md text-label-md">
                  {uploading ? 'Mengupload...' : 'Ganti Foto'}
                </button>
                {(form.avatar_url || profile?.avatar_url) && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, avatar_url: '' }))}
                    className="text-error font-label-md text-label-md"
                  >
                    Hapus Foto
                  </button>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="flex-1 space-y-4">
            {!editing ? (
              <div className="space-y-4">
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant">Nama</label>
                  <p className="font-body-md text-body-md text-on-surface mt-1">{profile?.nama || '-'}</p>
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant">No HP / WA</label>
                  <p className="font-body-md text-body-md text-on-surface mt-1">{profile?.phone || '-'}</p>
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant">Alamat</label>
                  <p className="font-body-md text-body-md text-on-surface mt-1">{profile?.alamat || '-'}</p>
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant">Email / Username</label>
                  <p className="font-body-md text-body-md text-on-surface mt-1">{session?.user?.email || '-'}</p>
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface-variant">Level Akun</label>
                  <p className="font-body-md text-body-md text-on-surface mt-1">{roleLabel[profile?.role] || profile?.role || '-'}</p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-primary text-on-primary hover:bg-primary-container transition-colors px-6 py-2.5 rounded-lg font-label-md font-semibold"
                  >
                    Edit Profil
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1.5">Nama</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.nama}
                    onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1.5">No HP / WA</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1.5">Alamat</label>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.alamat}
                    onChange={(e) => setForm((prev) => ({ ...prev, alamat: e.target.value }))}
                    rows="2"
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1.5">Password Saat Ini</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.currentPassword}
                    onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Kosongkan jika tidak ingin ganti password"
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1.5">Password Baru</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.newPassword}
                    onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Kosongkan jika tidak ingin ganti password"
                  />
                </div>
                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1.5">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Kosongkan jika tidak ingin ganti password"
                  />
                </div>
                {message && (
                  <p className={`font-body-sm text-body-sm ${message.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="bg-primary text-on-primary hover:bg-primary-container transition-colors px-6 py-2.5 rounded-lg font-label-md font-semibold disabled:opacity-50">
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button type="button" onClick={() => setEditing(false)} className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md">
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

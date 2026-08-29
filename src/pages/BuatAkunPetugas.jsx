import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BuatAkunPetugas() {
  const [petugasList, setPetugasList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    petugas_id: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    fetchPetugas()
  }, [])

  const fetchPetugas = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('petugas')
      .select('*')
      .eq('is_active', true)
      .order('nama')

    if (error) {
      console.error('Error fetching petugas:', error)
    } else {
      setPetugasList(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const petugas = petugasList.find((p) => p.id === form.petugas_id)
      if (!petugas) {
        setMessage('Pilih petugas terlebih dahulu')
        setSaving(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      })

      if (authError) {
        setMessage('Gagal membuat akun: ' + authError.message)
        setSaving(false)
        return
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        nama: petugas.nama,
        role: 'petugas',
        phone: petugas.phone,
      })

      if (profileError) {
        setMessage('Akun dibuat tapi gagal membuat profile: ' + profileError.message)
        setSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from('petugas')
        .update({ auth_user_id: authData.user.id })
        .eq('id', petugas.id)

      if (updateError) {
        setMessage('Akun dan profile berhasil, tapi gagal menghubungkan ke petugas')
      } else {
        setMessage(`Akun berhasil dibuat untuk ${petugas.nama}!`)
        setForm({ petugas_id: '', email: '', password: '' })
        fetchPetugas()
      }
    } catch (err) {
      setMessage('Gagal: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateRandom = async () => {
    if (!form.petugas_id) {
      setMessage('Pilih petugas terlebih dahulu')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const petugas = petugasList.find((p) => p.id === form.petugas_id)
      if (!petugas) {
        setMessage('Petugas tidak ditemukan')
        setSaving(false)
        return
      }

      const randomPassword = Math.random().toString(36).slice(-8)
      const email = `${petugas.nama.toLowerCase().replace(/\s+/g, '.')}@masjidpohuwato.id`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: randomPassword,
      })

      if (authError) {
        setMessage('Gagal membuat akun: ' + authError.message)
        setSaving(false)
        return
      }

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        nama: petugas.nama,
        role: 'petugas',
        phone: petugas.phone,
      })

      if (profileError) {
        setMessage('Akun dibuat tapi gagal membuat profile: ' + profileError.message)
        setSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from('petugas')
        .update({ auth_user_id: authData.user.id })
        .eq('id', petugas.id)

      if (updateError) {
        setMessage('Akun dan profile berhasil, tapi gagal menghubungkan ke petugas')
      } else {
        setMessage(`Akun berhasil dibuat!\nEmail: ${email}\nPassword: ${randomPassword}\n\nSalin dan berikan ke petugas.`)
        setForm({ petugas_id: '', email: '', password: '' })
        fetchPetugas()
      }
    } catch (err) {
      setMessage('Gagal: ' + (err.message || err))
    } finally {
      setSaving(false)
    }
  }

  const petugasWithoutAccount = petugasList.filter((p) => !p.auth_user_id)
  const petugasWithAccount = petugasList.filter((p) => p.auth_user_id)

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12 flex items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Buat Akun Pengguna</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Buat akun login untuk petugas yang belum memiliki akun.</p>
        </div>
      </div>

      {/* Create Account Form */}
      <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6 mb-6">
        <h3 className="font-h3 text-h3 text-on-surface mb-4">Form Buat Akun</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="petugas_id">Pilih Petugas</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
              id="petugas_id"
              value={form.petugas_id}
              onChange={(e) => setForm((prev) => ({ ...prev, petugas_id: e.target.value }))}
              required
            >
              <option value="">-- Pilih Petugas --</option>
              {petugasWithoutAccount.map((p) => (
                <option key={p.id} value={p.id}>{p.nama} ({p.role})</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email</label>
            <input
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
              id="email"
              type="email"
              placeholder="contoh: ahmad@masjidpohuwato.id"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
            <input
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
              id="password"
              type="text"
              placeholder="Masukkan password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-on-primary hover:bg-primary-container transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined">person_add</span>
              {saving ? 'Membuat...' : 'Buat Akun Manual'}
            </button>
            <button
              type="button"
              onClick={handleCreateRandom}
              disabled={saving}
              className="w-full bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">auto_fix_high</span>
              {saving ? 'Membuat...' : 'Buat Akun Otomatis (Random Password)'}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm whitespace-pre-wrap ${message.includes('Gagal') ? 'bg-error-container text-on-error-container' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              {message}
            </div>
          )}
        </form>
      </div>

      {/* Petugas List */}
      <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant">
          <h3 className="font-h3 text-h3 text-on-surface">Daftar Petugas</h3>
        </div>
        <div className="divide-y divide-outline-variant">
          {petugasList.map((p) => (
            <div key={p.id} className="p-4 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body-md font-semibold text-on-surface">{p.nama}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant capitalize">{p.role}</p>
                </div>
                {p.auth_user_id ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    Sudah ada akun
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                    Belum ada akun
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

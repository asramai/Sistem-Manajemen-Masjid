import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function KonfirmasiIzin() {
  const { profile, session } = useAuth()
  const [izinList, setIzinList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    nama_sholat: 'Subuh',
    alasan: '',
    bukti_url: '',
  })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const [petugasId, setPetugasId] = useState(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchIzin()
      fetchPetugasId()
    }
  }, [session])

  const fetchPetugasId = async () => {
    if (!session?.user?.id) return
    const { data } = await supabase
      .from('petugas')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    if (data) {
      setPetugasId(data.id)
    } else if (profile?.nama) {
      const { data: byName } = await supabase
        .from('petugas')
        .select('id')
        .ilike('nama', profile.nama)
        .limit(1)
        .maybeSingle()

      setPetugasId(byName?.id || null)
    }
  }

  const fetchIzin = async () => {
    setLoading(true)
    let query = supabase
      .from('konfirmasi_izin')
      .select('*')
      .order('tanggal', { ascending: false })

    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
      if (!petugasId) {
        setLoading(false)
        return
      }
      query = query.eq('petugas_id', petugasId)
    }

    const { data } = await query
    setIzinList(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (petugasId) {
      fetchIzin()
    }
  }, [petugasId])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `izin/${fileName}`

      const { error: uploadError } = await supabase.storage.from('petugas-avatar').upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('petugas-avatar').getPublicUrl(filePath)
      setForm((prev) => ({ ...prev, bukti_url: data.publicUrl }))
    } catch (err) {
      alert('Gagal upload bukti: ' + (err.message || err))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!petugasId) {
      alert('Data petugas tidak ditemukan. Hubungi admin.')
      return
    }
    setSaving(true)

    const data = {
      petugas_id: petugasId,
      tanggal: form.tanggal,
      nama_sholat: form.nama_sholat,
      alasan: form.alasan,
      bukti_url: form.bukti_url || null,
      status: 'pending',
    }

    const { error } = await supabase
      .from('konfirmasi_izin')
      .insert([data])

    if (error) {
      alert('Gagal mengirim konfirmasi: ' + error.message)
    } else {
      alert('Konfirmasi izin berhasil dikirim!')
      setShowForm(false)
      setForm({
        tanggal: new Date().toISOString().split('T')[0],
        nama_sholat: 'Subuh',
        alasan: '',
        bukti_url: '',
      })
      fetchIzin()
    }
    setSaving(false)
  }

  const handleApprove = async (izin) => {
    const { error } = await supabase
      .from('konfirmasi_izin')
      .update({ status: 'approved', catatan: 'Disetujui' })
      .eq('id', izin.id)

    if (error) {
      alert('Gagal menyetujui: ' + error.message)
    } else {
      fetchIzin()
    }
  }

  const handleReject = async (izin, catatan) => {
    if (!catatan.trim()) {
      alert('Masukkan catatan penolakan')
      return
    }
    const { error } = await supabase
      .from('konfirmasi_izin')
      .update({ status: 'rejected', catatan })
      .eq('id', izin.id)

    if (error) {
      alert('Gagal menolak: ' + error.message)
    } else {
      fetchIzin()
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 border border-amber-200'
      case 'approved':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      case 'rejected':
        return 'bg-red-100 text-red-700 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Menunggu'
      case 'approved':
        return 'Disetujui'
      case 'rejected':
        return 'Ditolak'
      default:
        return status
    }
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Konfirmasi Izin</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kirim konfirmasi izin tidak hadir. Jika tidak dikonfirmasi, akan tercatat sebagai Alpha.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-on-primary hover:bg-primary-container transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined">add</span>
          {showForm ? 'Batal' : 'Kirim Izin'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6 mb-6">
          <h3 className="font-h3 text-h3 text-on-surface mb-4">Form Konfirmasi Izin</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="tanggal">Tanggal</label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                id="tanggal"
                type="date"
                value={form.tanggal}
                onChange={(e) => setForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="nama_sholat">Waktu Sholat</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                id="nama_sholat"
                value={form.nama_sholat}
                onChange={(e) => setForm((prev) => ({ ...prev, nama_sholat: e.target.value }))}
              >
                {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((sholat) => (
                  <option key={sholat} value={sholat}>{sholat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="alasan">Alasan Izin</label>
              <textarea
                className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                id="alasan"
                rows="3"
                placeholder="Jelaskan alasan izin..."
                value={form.alasan}
                onChange={(e) => setForm((prev) => ({ ...prev, alasan: e.target.value }))}
                required
              />
            </div>

            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface">Bukti (Opsional)</label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md"
                >
                  {uploading ? 'Mengupload...' : 'Upload Bukti'}
                </button>
                <input
                  ref={fileRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  type="file"
                />
                {form.bukti_url && (
                  <a href={form.bukti_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline">
                    Lihat Bukti
                  </a>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md font-semibold disabled:opacity-50"
              >
                {saving ? 'Mengirim...' : 'Kirim Konfirmasi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Izin List */}
      <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : izinList.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">check_circle</span>
            <p className="font-body-md text-body-md text-on-surface-variant">Belum ada konfirmasi izin.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {izinList.map((izin) => {
              const date = new Date(izin.tanggal)
              const day = date.getDate()
              const month = date.toLocaleString('id-ID', { month: 'short' })

              return (
                <div key={izin.id} className="p-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-high flex flex-col items-center justify-center text-primary">
                        <span className="font-bold text-lg leading-none">{day}</span>
                        <span className="text-[10px] uppercase font-semibold">{month}</span>
                      </div>
                      <div>
                        <p className="font-body-md font-semibold text-on-surface">{izin.nama_sholat}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{izin.alasan}</p>
                        {izin.bukti_url && (
                          <a href={izin.bukti_url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline mt-1 inline-block">
                            Lihat Bukti
                          </a>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(izin.status)}`}>
                      {getStatusLabel(izin.status)}
                    </span>
                    {(profile?.role === 'super_admin' || profile?.role === 'admin') && izin.status === 'pending' && (
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleApprove(izin)}
                          className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={async () => {
                            const catatan = window.prompt('Catatan penolakan:')
                            if (catatan !== null) {
                              await handleReject(izin, catatan)
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                  {izin.catatan && (
                    <div className="mt-2 ml-16 p-2 bg-surface-container-high rounded-lg">
                      <p className="text-sm text-on-surface-variant">
                        <strong>Catatan Admin:</strong> {izin.catatan}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

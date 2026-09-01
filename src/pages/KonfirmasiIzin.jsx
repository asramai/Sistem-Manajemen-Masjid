import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border border-red-200',
  kembali: 'bg-orange-100 text-orange-700 border border-orange-200',
}

const statusLabels = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  kembali: 'Dikembalikan',
}

export default function KonfirmasiIzin() {
  const { profile, session } = useAuth()
  const [activeTab, setActiveTab] = useState('pengajuan')
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [actionNotes, setActionNotes] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    nama_sholat: '',
    alasan: '',
    tanggal: '',
  })
  const [petugasMap, setPetugasMap] = useState({})

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

  useEffect(() => {
    if (session?.user?.id) {
      fetchPetugasId()
    }
  }, [session])

  useEffect(() => {
    if (petugasId || isAdmin) {
      fetchIzin()
    }
  }, [petugasId, selectedMonth, selectedYear, activeTab])

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

    if (activeTab === 'pengajuan' && !isAdmin && petugasId) {
      query = query.eq('petugas_id', petugasId).neq('status', 'approved')
    } else if (activeTab === 'riwayat' && !isAdmin && petugasId) {
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
      const nextMonth = selectedMonth + 2
      const endDate = `${selectedYear}-${String(nextMonth > 12 ? nextMonth - 12 : nextMonth).padStart(2, '0')}-01`
      query = query.eq('petugas_id', petugasId).eq('status', 'approved').gte('tanggal', startDate).lt('tanggal', endDate)
    } else if (activeTab === 'validasi' && isAdmin) {
      query = query.eq('status', 'pending')
    } else if (activeTab === 'riwayat' && isAdmin) {
      const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
      const nextMonth = selectedMonth + 2
      const endDate = `${selectedYear}-${String(nextMonth > 12 ? nextMonth - 12 : nextMonth).padStart(2, '0')}-01`
      query = query.eq('status', 'approved').gte('tanggal', startDate).lt('tanggal', endDate)
    }

    const { data } = await query
    let izinResult = data || []

    if (isAdmin && izinResult.length > 0) {
      const petugasIds = [...new Set(izinResult.map((item) => item.petugas_id).filter(Boolean))]
      console.log('Petugas IDs from izin:', petugasIds)
      if (petugasIds.length > 0) {
        const { data: petugasData } = await supabase
          .from('petugas')
          .select('id, nama, role')
          .in('id', petugasIds)

        console.log('Petugas data fetched:', petugasData)

        const map = {}
        ;(petugasData || []).forEach((p) => {
          map[p.id] = p
        })
        setPetugasMap(map)
      }
    }

    setIzinList(izinResult)
    setLoading(false)
  }

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
    const catatan = actionNotes[izin.id]?.trim() || 'Disetujui'
    const { error } = await supabase
      .from('konfirmasi_izin')
      .update({ status: 'approved', catatan })
      .eq('id', izin.id)

    if (error) {
      alert('Gagal menyetujui: ' + error.message)
    } else {
      setActionNotes((prev) => ({ ...prev, [izin.id]: '' }))
      fetchIzin()
    }
  }

  const handleReject = async (izin) => {
    const catatan = actionNotes[izin.id]?.trim()
    if (!catatan) {
      alert('Masukkan alasan penolakan')
      return
    }
    const { error } = await supabase
      .from('konfirmasi_izin')
      .update({ status: 'rejected', catatan })
      .eq('id', izin.id)

    if (error) {
      alert('Gagal menolak: ' + error.message)
    } else {
      setActionNotes((prev) => ({ ...prev, [izin.id]: '' }))
      fetchIzin()
    }
  }

  const handleReturn = async (izin) => {
    const catatan = actionNotes[izin.id]?.trim()
    if (!catatan) {
      alert('Masukkan alasan pengembalian')
      return
    }
    const { error } = await supabase
      .from('konfirmasi_izin')
      .update({ status: 'kembali', catatan })
      .eq('id', izin.id)

    if (error) {
      alert('Gagal mengembalikan: ' + error.message)
    } else {
      setActionNotes((prev) => ({ ...prev, [izin.id]: '' }))
      fetchIzin()
    }
  }

  const handleEdit = (izin) => {
    setEditingId(izin.id)
    setEditForm({
      nama_sholat: izin.nama_sholat,
      alasan: izin.alasan,
      tanggal: izin.tanggal,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm({
      nama_sholat: '',
      alasan: '',
      tanggal: '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    const { error } = await supabase
      .from('konfirmasi_izin')
      .update({
        nama_sholat: editForm.nama_sholat,
        alasan: editForm.alasan,
        tanggal: editForm.tanggal,
      })
      .eq('id', editingId)

    if (error) {
      alert('Gagal menyimpan perubahan: ' + error.message)
    } else {
      alert('Perubahan berhasil disimpan')
      handleCancelEdit()
      fetchIzin()
    }
  }

  const currentYear = new Date().getFullYear()
  const years = useMemo(() => {
    const startYear = currentYear - 2
    const endYear = currentYear + 1
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  }, [currentYear])

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Izin</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {isAdmin ? 'Kelola pengajuan dan riwayat izin petugas.' : 'Ajukan izin tidak hadir dan pantau riwayat izin Anda.'}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary text-on-primary hover:bg-primary-container transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined">add</span>
            {showForm ? 'Batal' : 'Kirim Izin'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 mb-6">
        {isAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('validasi')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
                activeTab === 'validasi'
                  ? 'bg-primary-container text-white'
                  : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Validasi Izin
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
                activeTab === 'riwayat'
                  ? 'bg-primary-container text-white'
                  : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Riwayat Izin
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('pengajuan')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
                activeTab === 'pengajuan'
                  ? 'bg-primary-container text-white'
                  : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Pengajuan Izin
            </button>
            <button
              onClick={() => setActiveTab('riwayat')}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
                activeTab === 'riwayat'
                  ? 'bg-primary-container text-white'
                  : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Riwayat Izin
            </button>
          </>
        )}
      </div>

      {/* Form for Petugas */}
      {!isAdmin && showForm && activeTab === 'pengajuan' && (
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

      {/* Filter for Riwayat */}
      {activeTab === 'riwayat' && (
        <div className="flex items-center gap-3 mb-6">
          <div className="relative inline-block text-left">
            <select
              className="block w-full pl-4 pr-10 py-2 text-base border-outline-variant focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg glass-card text-on-surface font-label-md cursor-pointer appearance-none"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">expand_more</span>
            </div>
          </div>
          <div className="relative inline-block text-left">
            <select
              className="block w-full pl-4 pr-10 py-2 text-base border-outline-variant focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-lg glass-card text-on-surface font-label-md cursor-pointer appearance-none"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">expand_more</span>
            </div>
          </div>
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
            <p className="font-body-md text-body-md text-on-surface-variant">
              {activeTab === 'validasi' ? 'Tidak ada pengajuan izin yang menunggu validasi.' : activeTab === 'pengajuan' ? 'Belum ada pengajuan izin.' : 'Belum ada riwayat izin untuk bulan ini.'}
            </p>
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
                        {isAdmin && izin.petugas_id && petugasMap[izin.petugas_id] && (
                          <p className="text-xs text-on-surface-variant mt-1">
                            <span className="font-semibold">Pengaju:</span> {petugasMap[izin.petugas_id].nama} <span className="text-[10px] uppercase font-semibold text-primary">({petugasMap[izin.petugas_id].role})</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusStyles[izin.status] || statusStyles['pending']}`}>
                      {statusLabels[izin.status] || izin.status}
                    </span>
                  </div>
                  {izin.catatan && (
                    <div className="mt-2 ml-16 p-2 bg-surface-container-high rounded-lg">
                      <p className="text-sm text-on-surface-variant">
                        <strong>Catatan Admin:</strong> {izin.catatan}
                      </p>
                    </div>
                  )}
                  {(activeTab === 'validasi' || activeTab === 'riwayat') && isAdmin && izin.status === 'pending' && (
                    <div className="mt-3 ml-16 space-y-2">
                      {editingId === izin.id ? (
                        <>
                          <div className="grid grid-cols-1 gap-2">
                            <input
                              type="date"
                              value={editForm.tanggal}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-sm text-body-sm"
                            />
                            <select
                              value={editForm.nama_sholat}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, nama_sholat: e.target.value }))}
                              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-sm text-body-sm"
                            >
                              {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((sholat) => (
                                <option key={sholat} value={sholat}>{sholat}</option>
                              ))}
                            </select>
                            <textarea
                              value={editForm.alasan}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, alasan: e.target.value }))}
                              rows="2"
                              className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-sm text-body-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1.5 rounded-lg bg-gray-500 text-white text-xs font-semibold hover:bg-gray-600 transition-colors"
                            >
                              Batal
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Tambahkan catatan..."
                            value={actionNotes[izin.id] || ''}
                            onChange={(e) => setActionNotes((prev) => ({ ...prev, [izin.id]: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-sm text-body-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(izin)}
                              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleReturn(izin)}
                              className="px-3 py-1.5 rounded-lg bg-orange-600 text-white text-xs font-semibold hover:bg-orange-700 transition-colors"
                            >
                              Kembalikan
                            </button>
                            <button
                              onClick={() => handleReject(izin)}
                              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                            >
                              Tolak
                            </button>
                            {activeTab === 'riwayat' && (
                              <button
                                onClick={() => handleEdit(izin)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </>
                      )}
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

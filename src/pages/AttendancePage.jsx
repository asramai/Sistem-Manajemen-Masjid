import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const prayers = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function AttendancePage() {
  const [selectedPrayer, setSelectedPrayer] = useState('Subuh')
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  })
  const [petugas, setPetugas] = useState([])
  const [jadwalList, setJadwalList] = useState([])
  const [jadwalBulanan, setJadwalBulanan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [penugasan, setPenugasan] = useState({
    muadzin_utama_id: '',
    muadzin_cadangan_id: '',
    imam_utama_id: '',
    imam_cadangan_id: '',
  })
  const [savedPresensi, setSavedPresensi] = useState([])

  const imamList = useMemo(() => petugas.filter((p) => p.role === 'imam'), [petugas])
  const muadzinList = useMemo(() => petugas.filter((p) => p.role === 'muadzin'), [petugas])

  const jadwalItem = useMemo(() => jadwalList.find((j) => j.nama_sholat === selectedPrayer), [jadwalList, selectedPrayer])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (jadwalItem) {
      fetchAssignment()
      fetchSavedPresensi()
    }
  }, [selectedDate, selectedPrayer, jadwalItem, petugas])

  const fetchSavedPresensi = async () => {
    if (!jadwalItem) return

    const { data, error } = await supabase
      .from('presensi')
      .select('*')
      .eq('jadwal_id', jadwalItem.id)
      .eq('tanggal', selectedDate)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching saved presensi:', error)
      return
    }

    const enriched = await Promise.all(
      (data || []).map(async (record) => {
        const { data: jadwalBulanan } = await supabase
          .from('jadwal_bulanan')
          .select('*')
          .eq('tanggal', record.tanggal)
          .eq('nama_sholat', selectedPrayer)
          .maybeSingle()

        let role = null
        let nama = '-'
        if (jadwalBulanan) {
          if (jadwalBulanan.muadzin_utama_id === record.petugas_id) {
            role = 'Muadzin Utama'
            nama = petugas.find((p) => p.id === record.petugas_id)?.nama || '-'
          } else if (jadwalBulanan.muadzin_cadangan_id === record.petugas_id) {
            role = 'Muadzin Cadangan'
            nama = petugas.find((p) => p.id === record.petugas_id)?.nama || '-'
          } else if (jadwalBulanan.imam_utama_id === record.petugas_id) {
            role = 'Imam Utama'
            nama = petugas.find((p) => p.id === record.petugas_id)?.nama || '-'
          } else if (jadwalBulanan.imam_cadangan_id === record.petugas_id) {
            role = 'Imam Cadangan'
            nama = petugas.find((p) => p.id === record.petugas_id)?.nama || '-'
          }
        }

        const presensiDate = new Date(record.created_at)
        const presensiTime = presensiDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

        return {
          ...record,
          nama,
          role,
          presensiTime,
        }
      })
    )

    setSavedPresensi(enriched)
  }

  const fetchData = async () => {
    setLoading(true)
    const [petugasResult, jadwalResult] = await Promise.all([
      supabase.from('petugas').select('*').eq('is_active', true).order('nama'),
      supabase.from('jadwal').select('*').order('nama_sholat'),
    ])

    if (petugasResult.error) console.error('Error fetching petugas:', petugasResult.error)
    if (jadwalResult.error) console.error('Error fetching jadwal:', jadwalResult.error)

    setPetugas(petugasResult.data || [])
    setJadwalList(jadwalResult.data || [])
    setLoading(false)
  }

  const fetchAssignment = async () => {
    if (!jadwalItem) return

    const { data, error } = await supabase
      .from('jadwal_bulanan')
      .select('*')
      .eq('tanggal', selectedDate)
      .eq('nama_sholat', selectedPrayer)
      .maybeSingle()

    if (error) {
      console.error('Error fetching assignment:', error)
      return
    }

    setJadwalBulanan(data || null)

    if (data) {
      setPenugasan({
        muadzin_utama_id: data.muadzin_utama_id || '',
        muadzin_cadangan_id: data.muadzin_cadangan_id || '',
        imam_utama_id: data.imam_utama_id || '',
        imam_cadangan_id: data.imam_cadangan_id || '',
      })
    } else {
      setPenugasan({
        muadzin_utama_id: '',
        muadzin_cadangan_id: '',
        imam_utama_id: '',
        imam_cadangan_id: '',
      })
    }
  }

  const handleChange = (field, value) => {
    setPenugasan((prev) => ({
      ...prev,
      [field]: value || null,
    }))
  }

  const handleSave = async () => {
    if (!jadwalItem) return
    setSaving(true)

    const records = [
      {
        petugas_id: penugasan.muadzin_utama_id,
        jadwal_id: jadwalItem.id,
        tanggal: selectedDate,
        status: 'hadir',
      },
      {
        petugas_id: penugasan.muadzin_cadangan_id,
        jadwal_id: jadwalItem.id,
        tanggal: selectedDate,
        status: 'hadir',
      },
      {
        petugas_id: penugasan.imam_utama_id,
        jadwal_id: jadwalItem.id,
        tanggal: selectedDate,
        status: 'hadir',
      },
      {
        petugas_id: penugasan.imam_cadangan_id,
        jadwal_id: jadwalItem.id,
        tanggal: selectedDate,
        status: 'hadir',
      },
    ].filter((r) => r.petugas_id)

    if (records.length === 0) {
      alert('Tidak ada data presensi untuk disimpan')
      setSaving(false)
      return
    }

    try {
      const { error: deleteError } = await supabase
        .from('presensi')
        .delete()
        .eq('jadwal_id', jadwalItem.id)
        .eq('tanggal', selectedDate)

      if (deleteError) {
        alert('Gagal menghapus data lama: ' + deleteError.message)
        setSaving(false)
        return
      }

      const promises = records.map((record) =>
        supabase.from('presensi').upsert(record, { onConflict: ['petugas_id', 'jadwal_id', 'tanggal'] })
      )

      const results = await Promise.all(promises)
      const hasError = results.some((r) => r.error)
      if (hasError) {
        alert('Gagal menyimpan beberapa data')
      } else {
        alert(`Presensi ${selectedPrayer} berhasil disimpan!`)
        fetchSavedPresensi()
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-stack-lg flex items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-stack-lg">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-outline-variant pb-4 gap-4">
        <div className="text-center md:text-left">
          <h2 className="font-h1 text-h1 text-primary-container mb-2">Input Presensi Hari Ini</h2>
          <p className="font-body-md text-on-surface-variant">Catat kehadiran petugas sholat fardhu.</p>
        </div>
        <div className="relative w-full md:w-auto">
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
            <span className="material-symbols-outlined text-on-surface-variant mr-2 text-base">calendar_today</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-on-surface font-body-md w-full outline-none p-0 cursor-pointer"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Prayer Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {prayers.map((prayer) => (
          <button
            key={prayer}
            onClick={() => setSelectedPrayer(prayer)}
            className={`px-4 md:px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
              selectedPrayer === prayer
                ? 'bg-primary-container text-white'
                : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {prayer}
          </button>
        ))}
      </div>

      {/* Assignment Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="p-4 md:p-6 border-b border-outline-variant bg-surface-bright flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h3 className="font-h3 text-h3 text-on-surface text-center sm:text-left">Penugasan Petugas - {selectedPrayer}</h3>
          <span className="bg-secondary-container/30 text-on-secondary-container px-3 py-1 rounded-md font-label-sm text-label-sm border border-secondary-container/50 self-center sm:self-auto">
            {formatDate(new Date(selectedDate))}
          </span>
        </div>

        <div className="p-4 md:p-6">
          {!jadwalItem ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">calendar_today</span>
              <p className="font-body-md text-body-md text-on-surface-variant">Belum ada penugasan untuk sholat ini.</p>
            </div>
          ) : !jadwalBulanan ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">calendar_today</span>
              <p className="font-body-md text-body-md text-on-surface-variant">Belum ada penugasan untuk sholat ini pada tanggal tersebut.</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Buat penugasan terlebih dahulu di menu Jadwal Per Bulan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Kolom Muadzin */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
                    <span className="material-symbols-outlined text-sm">volume_up</span>
                  </div>
                  <h4 className="font-h3 text-h3 text-on-surface">Muadzin</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-label-md text-label-md text-on-surface block mb-1">Utama</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                      value={penugasan.muadzin_utama_id || ''}
                      onChange={(e) => handleChange('muadzin_utama_id', e.target.value)}
                    >
                      <option value="">-- Pilih Muadzin --</option>
                      {muadzinList.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-label-md text-label-md text-on-surface block mb-1">Cadangan</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                      value={penugasan.muadzin_cadangan_id || ''}
                      onChange={(e) => handleChange('muadzin_cadangan_id', e.target.value)}
                    >
                      <option value="">-- Pilih Cadangan --</option>
                      {imamList.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Kolom Imam */}
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <span className="material-symbols-outlined text-sm">mosque</span>
                  </div>
                  <h4 className="font-h3 text-h3 text-on-surface">Imam</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="font-label-md text-label-md text-on-surface block mb-1">Utama</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                      value={penugasan.imam_utama_id || ''}
                      onChange={(e) => handleChange('imam_utama_id', e.target.value)}
                    >
                      <option value="">-- Pilih Imam --</option>
                      {imamList.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-label-md text-label-md text-on-surface block mb-1">Cadangan</label>
                    <select
                      className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                      value={penugasan.imam_cadangan_id || ''}
                      onChange={(e) => handleChange('imam_cadangan_id', e.target.value)}
                    >
                      <option value="">-- Pilih Cadangan --</option>
                      {muadzinList.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 border-t border-outline-variant bg-surface-bright flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !jadwalBulanan}
            className="w-full sm:w-auto bg-primary-container hover:opacity-90 text-white px-6 py-2.5 rounded-lg font-label-md text-label-md font-semibold shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              save
            </span>
            {saving ? 'Menyimpan...' : 'Simpan Presensi'}
          </button>
        </div>
      </div>

      {savedPresensi.length > 0 && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="p-4 md:p-6 border-b border-outline-variant bg-surface-bright">
            <h3 className="font-h3 text-h3 text-on-surface">Data Presensi Tersimpan</h3>
          </div>
          <div className="overflow-x-auto -mx-4 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-bright border-b border-outline-variant">
                    <th className="p-3 md:p-4 font-semibold font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Tanggal</th>
                    <th className="p-3 md:p-4 font-semibold font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Waktu Shalat</th>
                    <th className="p-3 md:p-4 font-semibold font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Muadzin</th>
                    <th className="p-3 md:p-4 font-semibold font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Imam</th>
                    <th className="p-3 md:p-4 font-semibold font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Waktu Presensi</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant">
                  {savedPresensi.map((record) => (
                    <tr key={record.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-3 md:p-4 whitespace-nowrap">{formatDate(new Date(record.tanggal))}</td>
                      <td className="p-3 md:p-4 whitespace-nowrap">{selectedPrayer}</td>
                      <td className="p-3 md:p-4 whitespace-nowrap">{record.role?.startsWith('Muadzin') ? record.nama : '-'}</td>
                      <td className="p-3 md:p-4 whitespace-nowrap">{record.role?.startsWith('Imam') ? record.nama : '-'}</td>
                      <td className="p-3 md:p-4 whitespace-nowrap">{record.presensiTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

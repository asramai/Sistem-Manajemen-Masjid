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
  const [jadwalBulanan, setJadwalBulanan] = useState([])
  const [penugasanMap, setPenugasanMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const imamList = useMemo(() => petugas.filter((p) => p.role === 'imam'), [petugas])
  const muadzinList = useMemo(() => petugas.filter((p) => p.role === 'muadzin'), [petugas])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchPenugasan()
  }, [selectedDate, selectedPrayer, jadwalBulanan])

  const fetchData = async () => {
    setLoading(true)
    const { data: petugasData, error: petugasError } = await supabase
      .from('petugas')
      .select('*')
      .eq('is_active', true)
      .order('nama')

    if (petugasError) console.error('Error fetching petugas:', petugasError)

    setPetugas(petugasData || [])
    setLoading(false)
  }

  const fetchPenugasan = async () => {
    const { data, error } = await supabase
      .from('jadwal_bulanan')
      .select('*')
      .eq('tanggal', selectedDate)
      .eq('nama_sholat', selectedPrayer)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching jadwal:', error)
      return
    }

    if (data) {
      setPenugasanMap({
        [selectedPrayer]: {
          muadzin_utama_id: data.muadzin_utama_id,
          muadzin_cadangan_id: data.muadzin_cadangan_id,
          imam_utama_id: data.imam_utama_id,
          imam_cadangan_id: data.imam_cadangan_id,
        },
      })
    } else {
      setPenugasanMap((prev) => ({
        ...prev,
        [selectedPrayer]: {
          muadzin_utama_id: '',
          muadzin_cadangan_id: '',
          imam_utama_id: '',
          imam_cadangan_id: '',
        },
      }))
    }
  }

  const currentPenugasan = penugasanMap[selectedPrayer] || {
    muadzin_utama_id: '',
    muadzin_cadangan_id: '',
    imam_utama_id: '',
    imam_cadangan_id: '',
  }

  const handleChange = (field, value) => {
    setPenugasanMap((prev) => ({
      ...prev,
      [selectedPrayer]: {
        ...prev[selectedPrayer],
        [field]: value || null,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const data = {
      tanggal: selectedDate,
      nama_sholat: selectedPrayer,
      muadzin_utama_id: currentPenugasan.muadzin_utama_id,
      muadzin_cadangan_id: currentPenugasan.muadzin_cadangan_id,
      imam_utama_id: currentPenugasan.imam_utama_id,
      imam_cadangan_id: currentPenugasan.imam_cadangan_id,
    }

    const { error } = await supabase
      .from('jadwal_bulanan')
      .upsert(data, { onConflict: ['tanggal', 'nama_sholat'] })

    if (error) {
      alert('Gagal menyimpan: ' + error.message)
    } else {
      alert(`Penugasan ${selectedPrayer} berhasil disimpan!`)
      fetchPenugasan()
    }
    setSaving(false)
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
        <div>
          <h2 className="font-h1 text-h1 text-primary-container mb-2">Input Presensi Hari Ini</h2>
          <p className="font-body-md text-on-surface-variant">Catat kehadiran petugas sholat fardhu.</p>
        </div>
        <div className="relative w-full md:w-auto">
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/20 transition-all">
            <span className="material-symbols-outlined text-on-surface-variant mr-2">calendar_today</span>
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
            className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
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
        <div className="p-6 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
          <h3 className="font-h3 text-h3 text-on-surface">Penugasan Petugas - {selectedPrayer}</h3>
          <span className="bg-secondary-container/30 text-on-secondary-container px-3 py-1 rounded-md font-label-sm text-label-sm border border-secondary-container/50">
            {formatDate(new Date(selectedDate))}
          </span>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Kolom Muadzin */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                  <span className="material-symbols-outlined text-sm">volume_up</span>
                </div>
                <h4 className="font-h3 text-h3 text-on-surface">Muadzin</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1">Utama</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={currentPenugasan.muadzin_utama_id || ''}
                    onChange={(e) => handleChange('muadzin_utama_id', e.target.value)}
                  >
                    <option value="">-- Pilih Muadzin --</option>
                    {muadzinList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1">Cadangan (Imam)</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={currentPenugasan.muadzin_cadangan_id || ''}
                    onChange={(e) => handleChange('muadzin_cadangan_id', e.target.value)}
                  >
                    <option value="">-- Pilih Imam sebagai cadangan --</option>
                    {imamList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Kolom Imam */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <span className="material-symbols-outlined text-sm">mosque</span>
                </div>
                <h4 className="font-h3 text-h3 text-on-surface">Imam</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1">Utama</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={currentPenugasan.imam_utama_id || ''}
                    onChange={(e) => handleChange('imam_utama_id', e.target.value)}
                  >
                    <option value="">-- Pilih Imam --</option>
                    {imamList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-label-md text-label-md text-on-surface block mb-1">Cadangan (Muadzin)</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={currentPenugasan.imam_cadangan_id || ''}
                    onChange={(e) => handleChange('imam_cadangan_id', e.target.value)}
                  >
                    <option value="">-- Pilih Muadzin sebagai cadangan --</option>
                    {muadzinList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-outline-variant bg-surface-bright flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary-container hover:opacity-90 text-white px-6 py-2.5 rounded-lg font-label-md text-label-md font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              save
            </span>
            {saving ? 'Menyimpan...' : 'Simpan Penugasan'}
          </button>
        </div>
      </div>
    </div>
  )
}

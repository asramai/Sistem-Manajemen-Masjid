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

function PrayerTabs({ selected, onSelect }) {
  return (
    <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
      {prayers.map((prayer) => (
        <button
          key={prayer}
          onClick={() => onSelect(prayer)}
          className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
            selected === prayer
              ? 'bg-primary-container text-white'
              : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          {prayer}
        </button>
      ))}
    </div>
  )
}

function AttendanceRow({ officer, onStatusChange, onSubstituteChange }) {
  const roleColors = {
    imam: 'bg-slate-900 text-white border border-slate-900',
    muadzin: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
    bilal: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    marbot: 'bg-amber-100 text-amber-800 border border-amber-200',
  }

  const roleLabels = {
    imam: 'Imam',
    muadzin: 'Muadzin',
    bilal: 'Bilal',
    marbot: 'Marbot',
  }

  return (
    <div className="px-6 py-4 border-b border-outline-variant hover:bg-slate-50 transition-colors">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary-container font-h3">
            {officer.initials || getInitials(officer.nama)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-body-lg text-body-lg font-medium text-on-surface">{officer.nama}</p>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleColors[officer.role] || 'bg-gray-100 text-gray-800'}`}
              >
                {roleLabels[officer.role] || officer.role}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{officer.tipe_honor === 'bulanan' ? 'Bulanan (Flat)' : 'Per Kehadiran'}</p>
          </div>
        </div>
        <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant/50 w-full md:w-auto">
          {['hadir', 'izin', 'alpha'].map((status) => (
            <label key={status} className="flex-1 md:flex-none cursor-pointer">
              <input
                checked={officer.status === status}
                onChange={() => onStatusChange(officer.id, status)}
                className="peer sr-only"
                name={`status_${officer.id}`}
                type="radio"
                value={status}
              />
              <div
                className={`text-center px-4 py-2 rounded-md font-label-md text-label-md text-on-surface-variant transition-all ${
                  status === 'hadir'
                    ? 'peer-checked:bg-emerald-100 peer-checked:text-emerald-700'
                    : status === 'izin'
                    ? 'peer-checked:bg-amber-100 peer-checked:text-amber-700'
                    : 'peer-checked:bg-red-100 peer-checked:text-red-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            </label>
          ))}
        </div>
      </div>
      {officer.status === 'izin' && (
        <div className="mt-4 pt-4 border-t border-amber-100">
          <label className="font-label-md text-label-md text-on-surface block mb-2">
            Petugas Pengganti ({officer.nama} - Izin)
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              person_search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all font-body-md text-on-surface"
              placeholder="Pilih atau ketik nama pengganti..."
              type="text"
              value={officer.petugas_pengganti_nama || ''}
              onChange={(e) => onSubstituteChange(officer.id, e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function StatsCard({ hadir, izin, alpha }) {
  const stats = [
    { label: 'Total Hadir', value: hadir, color: 'bg-emerald-100 text-emerald-700', icon: 'how_to_reg' },
    { label: 'Total Izin', value: izin, color: 'bg-amber-100 text-amber-700', icon: 'event_busy' },
    { label: 'Total Alpha', value: alpha, color: 'bg-red-100 text-red-700', icon: 'person_off' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant shadow-sm flex items-center gap-4"
        >
          <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
            <span className="material-symbols-outlined">{stat.icon}</span>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{stat.label}</p>
            <p className="font-h2 text-h2 text-on-surface">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AttendancePage() {
  const [selectedPrayer, setSelectedPrayer] = useState('Subuh')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [petugas, setPetugas] = useState([])
  const [jadwal, setJadwal] = useState([])
  const [presensiMap, setPresensiMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchPresensi()
  }, [selectedDate, selectedPrayer, jadwal])

  const fetchData = async () => {
    setLoading(true)
    const { data: petugasData, error: petugasError } = await supabase
      .from('petugas')
      .select('*')
      .eq('is_active', true)
      .order('nama')

    const { data: jadwalData, error: jadwalError } = await supabase
      .from('jadwal')
      .select('*')
      .order('nama_sholat')

    if (petugasError) console.error('Error fetching petugas:', petugasError)
    if (jadwalError) console.error('Error fetching jadwal:', jadwalError)

    setPetugas(petugasData || [])
    setJadwal(jadwalData || [])
    setLoading(false)
  }

  const fetchPresensi = async () => {
    const jadwalItem = jadwal.find((j) => j.nama_sholat === selectedPrayer)
    if (!jadwalItem) return

    const { data, error } = await supabase
      .from('presensi')
      .select('*')
      .eq('jadwal_id', jadwalItem.id)
      .eq('tanggal', selectedDate)

    if (error) {
      console.error('Error fetching presensi:', error)
      return
    }

    const map = {}
    data.forEach((p) => {
      map[p.petugas_id] = p
    })
    setPresensiMap(map)
  }

  const officers = useMemo(() => {
    return petugas.map((p) => {
      const existing = presensiMap[p.id]
      return {
        ...p,
        id: p.id,
        status: existing?.status || 'hadir',
        substitute: existing?.petugas_pengganti_nama || '',
        petugas_pengganti_nama: existing?.petugas_pengganti_nama || '',
      }
    })
  }, [petugas, presensiMap])

  const stats = useMemo(() => {
    const hadir = officers.filter((o) => o.status === 'hadir').length
    const izin = officers.filter((o) => o.status === 'izin').length
    const alpha = officers.filter((o) => o.status === 'alpha').length
    return { hadir, izin, alpha }
  }, [officers])

  const handleStatusChange = (id, status) => {
    setPresensiMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        petugas_id: id,
        status,
        petugas_pengganti_nama: status === 'izin' ? prev[id]?.petugas_pengganti_nama || '' : '',
      },
    }))
  }

  const handleSubstituteChange = (id, substitute) => {
    setPresensiMap((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        petugas_id: id,
        petugas_pengganti_nama: substitute,
      },
    }))
  }

  const handleSave = async () => {
    const jadwalItem = jadwal.find((j) => j.nama_sholat === selectedPrayer)
    if (!jadwalItem) return

    setSaving(true)
    const promises = officers.map((officer) => {
      const existing = presensiMap[officer.id]
      const data = {
        petugas_id: officer.id,
        jadwal_id: jadwalItem.id,
        tanggal: selectedDate,
        status: officer.status,
        petugas_pengganti_nama: officer.status === 'izin' ? officer.petugas_pengganti_nama : null,
      }

      if (existing?.id) {
        return supabase.from('presensi').update(data).eq('id', existing.id)
      } else {
        return supabase.from('presensi').insert(data)
      }
    })

    try {
      const results = await Promise.all(promises)
      const hasError = results.some((r) => r.error)
      if (hasError) {
        alert('Gagal menyimpan beberapa data presensi')
      } else {
        alert(`Absensi ${selectedPrayer} berhasil disimpan!`)
        fetchPresensi()
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

      <PrayerTabs selected={selectedPrayer} onSelect={setSelectedPrayer} />

      {/* Attendance Form Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="p-6 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
          <h3 className="font-h3 text-h3 text-on-surface">Daftar Petugas - {selectedPrayer}</h3>
          <span className="bg-secondary-container/30 text-on-secondary-container px-3 py-1 rounded-md font-label-sm text-label-sm border border-secondary-container/50">
            {formatDate(new Date(selectedDate))}
          </span>
        </div>
        <div className="p-0">
          {officers.map((officer) => (
            <AttendanceRow
              key={officer.id}
              officer={officer}
              onStatusChange={handleStatusChange}
              onSubstituteChange={handleSubstituteChange}
            />
          ))}
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
            {saving ? 'Menyimpan...' : 'Simpan Absensi'}
          </button>
        </div>
      </div>

      <StatsCard hadir={stats.hadir} izin={stats.izin} alpha={stats.alpha} />
    </div>
  )
}

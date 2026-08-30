import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const prayers = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']
const attendanceStatus = [
  { value: 'hadir', label: 'Hadir', color: 'bg-secondary-container text-on-secondary-container' },
  { value: 'izin', label: 'Izin', color: 'bg-surface-container-high text-on-surface-variant' },
  { value: 'alpha', label: 'Alpha', color: 'bg-primary-container text-on-primary-container' },
]

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
  const [presensiRecords, setPresensiRecords] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const imamList = useMemo(() => petugas.filter((p) => p.role === 'imam'), [petugas])
  const muadzinList = useMemo(() => petugas.filter((p) => p.role === 'muadzin'), [petugas])

  const jadwalItem = useMemo(() => {
    const found = jadwalList.find((j) => j.nama_sholat === selectedPrayer)
    console.log('jadwalItem lookup:', { selectedPrayer, jadwalListLength: jadwalList.length, found: found?.id })
    return found
  }, [jadwalList, selectedPrayer])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (jadwalItem) {
      fetchAssignment()
      fetchPresensi()
    }
  }, [selectedDate, selectedPrayer, jadwalItem])

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
    if (!jadwalItem) {
      console.log('No jadwalItem found for', selectedPrayer, 'jadwalList:', jadwalList)
      return
    }

    console.log('Fetching assignment for', selectedDate, selectedPrayer, 'jadwal_id:', jadwalItem.id)

    const { data, error } = await supabase
      .from('jadwal_bulanan')
      .select('*')
      .eq('tanggal', selectedDate)
      .eq('nama_sholat', selectedPrayer)
      .maybeSingle()

    console.log('Assignment result:', { data, error })

    setJadwalBulanan(data || null)
  }

  const fetchPresensi = async () => {
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
    ;(data || []).forEach((record) => {
      map[record.petugas_id] = record
    })
    setPresensiRecords(map)
  }

  const getPetugasName = (id) => {
    const p = petugas.find((pet) => pet.id === id)
    return p ? p.nama : '-'
  }

  const handleStatusChange = (petugasId, status) => {
    setPresensiRecords((prev) => ({
      ...prev,
      [petugasId]: {
        ...prev[petugasId],
        petugas_id: petugasId,
        jadwal_id: jadwalItem.id,
        tanggal: selectedDate,
        status,
      },
    }))
  }

  const handleSave = async () => {
    if (!jadwalItem) return
    setSaving(true)

    const records = Object.values(presensiRecords).filter((r) => r.petugas_id && r.status)
    if (records.length === 0) {
      alert('Tidak ada data presensi untuk disimpan')
      setSaving(false)
      return
    }

    const promises = records.map((record) =>
      supabase.from('presensi').upsert(record, { onConflict: ['petugas_id', 'jadwal_id', 'tanggal'] })
    )

    try {
      const results = await Promise.all(promises)
      const hasError = results.some((r) => r.error)
      if (hasError) {
        alert('Gagal menyimpan beberapa data')
      } else {
        alert(`Presensi ${selectedPrayer} berhasil disimpan!`)
        fetchPresensi()
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const assignedPersonnel = useMemo(() => {
    if (!jadwalBulanan) return []
    const list = []
    if (jadwalBulanan.muadzin_utama_id) {
      list.push({ id: jadwalBulanan.muadzin_utama_id, role: 'muadzin', label: 'Muadzin Utama' })
    }
    if (jadwalBulanan.muadzin_cadangan_id) {
      list.push({ id: jadwalBulanan.muadzin_cadangan_id, role: 'muadzin', label: 'Muadzin Cadangan' })
    }
    if (jadwalBulanan.imam_utama_id) {
      list.push({ id: jadwalBulanan.imam_utama_id, role: 'imam', label: 'Imam Utama' })
    }
    if (jadwalBulanan.imam_cadangan_id) {
      list.push({ id: jadwalBulanan.imam_cadangan_id, role: 'imam', label: 'Imam Cadangan' })
    }
    return list
  }, [jadwalBulanan])

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
          <h3 className="font-h3 text-h3 text-on-surface">Presensi Petugas - {selectedPrayer}</h3>
          <span className="bg-secondary-container/30 text-on-secondary-container px-3 py-1 rounded-md font-label-sm text-label-sm border border-secondary-container/50">
            {formatDate(new Date(selectedDate))}
          </span>
        </div>

        <div className="p-6">
          {!jadwalBulanan ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">calendar_today</span>
              <p className="font-body-md text-body-md text-on-surface-variant">Belum ada penugasan untuk sholat ini pada tanggal tersebut.</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Buat penugasan terlebih dahulu di menu Jadwal Per Bulan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedPersonnel.map((person) => {
                const current = presensiRecords[person.id] || {}
                const status = current.status || ''

                return (
                  <div key={person.id} className="flex items-center justify-between p-4 rounded-lg bg-surface-container-high/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase ${
                        person.role === 'imam' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                      }`}>
                        {getInitials(getPetugasName(person.id))}
                      </div>
                      <div>
                        <p className="font-body-md font-semibold text-on-surface">{getPetugasName(person.id)}</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">{person.label}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {attendanceStatus.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(person.id, option.value)}
                          className={`px-4 py-2 rounded-lg font-label-sm text-label-sm transition-colors ${
                            status === option.value
                              ? option.color
                              : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant bg-surface-bright flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !jadwalBulanan}
            className="bg-primary-container hover:opacity-90 text-white px-6 py-2.5 rounded-lg font-label-md text-label-md font-semibold shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              save
            </span>
            {saving ? 'Menyimpan...' : 'Simpan Presensi'}
          </button>
        </div>
      </div>
    </div>
  )
}

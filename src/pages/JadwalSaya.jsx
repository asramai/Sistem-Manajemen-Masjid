import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function JadwalSaya() {
  const { profile, session } = useAuth()
  const [jadwalList, setJadwalList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [petugasId, setPetugasId] = useState(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchJadwal()
    }
  }, [session, selectedYear, selectedMonth])

  const fetchJadwal = async () => {
    if (!session?.user?.id) return
    setLoading(true)

    const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
    const nextMonth = selectedMonth + 2
    const endDate = `${selectedYear}-${String(nextMonth > 12 ? nextMonth - 12 : nextMonth).padStart(2, '0')}-01`

    const { data: petugasData } = await supabase
      .from('petugas')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single()

    const petugasId = petugasData?.id
    setPetugasId(petugasId)

    if (!petugasId) {
      setJadwalList([])
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('jadwal_bulanan')
      .select('*')
      .gte('tanggal', startDate)
      .lt('tanggal', endDate)
      .order('tanggal', { ascending: true })

    if (data) {
      const filtered = data.filter(
        (j) =>
          j.imam_utama_id === petugasId ||
          j.imam_cadangan_id === petugasId ||
          j.muadzin_utama_id === petugasId ||
          j.muadzin_cadangan_id === petugasId
      )
      setJadwalList(filtered)
    }
    setLoading(false)
  }

  const getRoleLabel = (record, petugasId) => {
    const roles = []
    if (record.imam_utama_id === petugasId) roles.push('Imam Utama')
    if (record.imam_cadangan_id === petugasId) roles.push('Imam Cadangan')
    if (record.muadzin_utama_id === petugasId) roles.push('Muadzin Utama')
    if (record.muadzin_cadangan_id === petugasId) roles.push('Muadzin Cadangan')
    return roles.join(', ')
  }

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
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Jadwal Saya</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Lihat jadwal penugasan Anda bulan ini.</p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map((month, index) => (
              <option key={month} value={index}>{month}</option>
            ))}
          </select>
          <select
            className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Jadwal List */}
      <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl overflow-hidden">
        {jadwalList.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">calendar_today</span>
            <p className="font-body-md text-body-md text-on-surface-variant">Belum ada jadwal untuk bulan ini.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {jadwalList.map((jadwal) => {
              const date = new Date(jadwal.tanggal)
              const day = date.getDate()
              const month = date.toLocaleString('id-ID', { month: 'short' })
              const dayName = date.toLocaleString('id-ID', { weekday: 'long' })

              return (
                <div key={jadwal.id} className="p-4 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex flex-col items-center justify-center text-primary">
                      <span className="font-bold text-lg leading-none">{day}</span>
                      <span className="text-[10px] uppercase font-semibold">{month}</span>
                    </div>
                    <div className="flex-grow">
                      <p className="font-body-md font-semibold text-on-surface">{jadwal.nama_sholat}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">{dayName}</p>
                      <p className="font-body-sm text-body-sm text-primary mt-1">
                        {getRoleLabel(jadwal, petugasId)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

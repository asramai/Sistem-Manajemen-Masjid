import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const statusStyles = {
  hadir: 'bg-primary/10 text-primary border border-primary/20',
  izin: 'bg-secondary/10 text-secondary border border-secondary/20',
  alpha: 'bg-error/10 text-error border border-error/20',
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function RekapKehadiranSaya() {
  const { profile, session } = useAuth()
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [history, setHistory] = useState([])
  const [stats, setStats] = useState({ hadir: 0, izin: 0 })
  const [petugas, setPetugas] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
    }
  }, [session, selectedMonth, selectedYear])

  const fetchData = async () => {
    if (!session?.user?.id) return
    setLoading(true)

    const { data: petugasData, error: petugasError } = await supabase
      .from('petugas')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    let petugasResult = petugasData

    if (!petugasResult && profile?.nama) {
      const { data: petugasByName } = await supabase
        .from('petugas')
        .select('*')
        .ilike('nama', profile.nama)
        .limit(1)
        .maybeSingle()

      petugasResult = petugasByName
    }

    if (petugasError) {
      console.error('Error fetching petugas:', petugasError)
      setLoading(false)
      return
    }

    if (!petugasResult) {
      console.warn('No petugas found for user:', session.user.id)
      setPetugas(null)
      setLoading(false)
      return
    }

    setPetugas(petugasResult)

    const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
    const nextMonth = selectedMonth + 2
    const endDate = `${selectedYear}-${String(nextMonth > 12 ? nextMonth - 12 : nextMonth).padStart(2, '0')}-01`

    const { data: presensiData, error: presensiError } = await supabase
      .from('presensi')
      .select('*, jadwal:nama_sholat')
      .eq('petugas_id', petugasResult.id)
      .gte('tanggal', startDate)
      .lt('tanggal', endDate)
      .order('tanggal', { ascending: false })

    if (presensiError) {
      console.error('Error fetching presensi:', presensiError)
      setLoading(false)
      return
    }

    if (presensiData) {
      const hadir = presensiData.filter((p) => p.status === 'hadir').length
      const izin = presensiData.filter((p) => p.status === 'izin').length
      setStats({ hadir, izin })

      const formatted = presensiData.map((p) => {
        const date = new Date(p.tanggal)
        const day = date.getDate()
        const monthStr = date.toLocaleString('id-ID', { month: 'short' })
        return {
          id: p.id,
          day,
          month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
          title: p.jadwal?.nama_sholat || 'Sholat',
          time: p.keterangan || '-',
          status: p.status.charAt(0).toUpperCase() + p.status.slice(1),
          icon: p.status === 'hadir' ? 'schedule' : p.status === 'izin' ? 'info' : 'error',
        }
      })
      setHistory(formatted)
    }

    setLoading(false)
  }

  const totalHonor = useMemo(() => {
    if (!petugas) return 0
    if (petugas.tipe_honor === 'per_hadir') {
      return stats.hadir * (petugas.honor_per_hadir || 0)
    }
    return petugas.honor_bulanan || 0
  }, [stats, petugas])

  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const currentYear = new Date().getFullYear()
  const years = useMemo(() => {
    const startYear = currentYear - 2
    const endYear = currentYear + 1
    return Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  }, [currentYear])

  return (
    <div className="ambient-bg flex-grow w-full max-w-container-max mx-auto px-4 py-lg md:py-8 grid grid-cols-1 md:grid-cols-12 gap-gutter">
      {/* Header Section */}
      <div className="col-span-1 md:col-span-12 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Rekap Kehadiran Saya</h2>
            <p className="font-body-md text-on-surface-variant">Pantau aktivitas dan honorarium Anda bulan ini.</p>
          </div>
          <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Left Column: Profile & Stats */}
      {petugas ? (
        <div className="col-span-1 md:col-span-4 flex flex-col gap-md">
          {/* Profile Summary Card */}
          <div className="glass-card rounded-xl p-6 relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-16 h-16 rounded-full bg-surface-container-high border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-3xl text-primary">person</span>
              </div>
              <div>
                <h3 className="font-title-md text-title-md text-on-surface">{profile?.nama || 'User'}</h3>
                <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container">
                  {petugas?.role || 'Petugas'}
                </div>
              </div>
            </div>
            <div className="border-t border-outline-variant/30 pt-4 mt-2 relative z-10">
              <p className="font-label-md text-label-md text-on-surface-variant mb-1 uppercase text-xs">Honor Per Hadir</p>
              <p className="font-headline-lg-mobile text-headline-lg-mobile text-primary font-bold">
                {petugas ? formatCurrency(petugas.honor_per_hadir || 0) : 'Rp 0'}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-md">
            <div className="glass-card rounded-xl p-4 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div>
                <p className="font-display-lg text-display-lg text-on-surface leading-tight">{stats.hadir}</p>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">Total Hadir</p>
              </div>
            </div>
            <div className="glass-card rounded-xl p-4 flex flex-col justify-between">
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              </div>
              <div>
                <p className="font-display-lg text-display-lg text-on-surface leading-tight">{stats.izin}</p>
                <p className="font-label-md text-label-md text-on-surface-variant mt-1">Total Izin</p>
              </div>
            </div>
          </div>

          {/* Total Honor Card */}
          <div className="bg-primary text-on-primary rounded-xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            <div className="relative z-10 flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2 text-on-primary/80">
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                <span className="font-label-md text-label-md">Total Honor Bulan Ini</span>
              </div>
              <p className="font-display-lg text-display-lg font-bold">{formatCurrency(totalHonor)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="col-span-1 md:col-span-4">
          <div className="glass-card rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">person_off</span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Data petugas tidak ditemukan. Hubungi admin untuk menghubungkan akun Anda dengan data petugas.
            </p>
          </div>
        </div>
      )}

      {/* Right Column: History List */}
      <div className="col-span-1 md:col-span-8">
        <div className="glass-card rounded-xl p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-title-md text-title-md text-on-surface">Riwayat Kehadiran</h3>
            <button className="font-label-md text-label-md text-primary hover:text-primary-container transition">Lihat Semua</button>
          </div>
          {/* Scrollable List Area */}
          <div className="flex-grow overflow-y-auto no-scrollbar pr-2 space-y-3" style={{ maxHeight: '500px' }}>
            {loading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-on-surface-variant py-8">Belum ada data kehadiran untuk bulan ini.</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-4 rounded-lg hover:bg-surface-container-lowest border border-outline-variant/20 transition-colors group ${
                    item.status === 'Alpha' ? 'opacity-75 hover:opacity-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex flex-col items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="font-bold text-lg leading-none font-headline-lg-mobile">{item.day}</span>
                      <span className="text-[10px] uppercase font-semibold font-label-md">{item.month}</span>
                    </div>
                    <div>
                      <p className="font-body-md font-semibold text-on-surface">{item.title}</p>
                      <p className="font-body-md text-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">{item.icon}</span>
                        {item.time}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusStyles[item.status.toLowerCase()] || statusStyles['hadir']}`}>
                    {item.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

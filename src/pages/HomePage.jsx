import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const prayers = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function StatCard({ label, value, icon, color, trend }) {
  return (
    <div className="bg-surface rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} rounded-full blur-xl group-hover:opacity-80 transition-opacity`}></div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">{label}</h3>
      </div>
      <div>
        <p className="font-display text-display text-on-surface">{value}</p>
        {trend && <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{trend}</p>}
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick, color = 'bg-primary-container text-white' }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 ${color}`}
    >
      <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{icon}</span>
      <span className="font-label-sm text-label-sm font-medium">{label}</span>
    </button>
  )
}

export default function HomePage() {
  const { profile, session } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [petugasList, setPetugasList] = useState([])
  const [jadwalBulanan, setJadwalBulanan] = useState([])
  const [presensiList, setPresensiList] = useState([])
  const [izinList, setIzinList] = useState([])
  const [biayaMap, setBiayaMap] = useState({})
  const [jadwalMap, setJadwalMap] = useState({})

  const isSuperAdmin = profile?.role === 'super_admin'
  const canViewAdminStats = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'takmir'
  const [currentPetugasId, setCurrentPetugasId] = useState(null)

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    async function fetchCurrentPetugas() {
      if (!session?.user?.id) return
      const { data } = await supabase
        .from('petugas')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      if (data) {
        setCurrentPetugasId(data.id)
      } else if (profile?.nama) {
        const { data: byName } = await supabase
          .from('petugas')
          .select('id')
          .ilike('nama', profile.nama)
          .limit(1)
          .maybeSingle()

        setCurrentPetugasId(byName?.id || null)
      }
    }

    fetchCurrentPetugas()
  }, [session, profile])

  const fetchData = async () => {
    setLoading(true)
    const [petugasResult, jadwalResult, jadwalMasterResult, presensiResult, izinResult, biayaResult] = await Promise.all([
      supabase.from('petugas').select('*').eq('is_active', true).order('nama'),
      supabase.from('jadwal_bulanan').select('*').eq('tanggal', today),
      supabase.from('jadwal').select('*'),
      supabase.from('presensi').select('*').eq('tanggal', today),
      supabase.from('konfirmasi_izin').select('*').order('tanggal', { ascending: false }).limit(10),
      supabase.from('biaya_transport').select('*'),
    ])

    if (petugasResult.error) console.error('Error fetching petugas:', petugasResult.error)
    if (jadwalResult.error) console.error('Error fetching jadwal:', jadwalResult.error)
    if (jadwalMasterResult.error) console.error('Error fetching jadwal master:', jadwalMasterResult.error)
    if (presensiResult.error) console.error('Error fetching presensi:', presensiResult.error)
    if (izinResult.error) console.error('Error fetching izin:', izinResult.error)
    if (biayaResult.error) console.error('Error fetching biaya:', biayaResult.error)

    setPetugasList(petugasResult.data || [])
    setJadwalBulanan(jadwalResult.data || [])

    const jadwalMap = {}
    ;(jadwalMasterResult.data || []).forEach((j) => {
      if (!jadwalMap[j.nama_sholat]) {
        jadwalMap[j.nama_sholat] = []
      }
      jadwalMap[j.nama_sholat].push(j.id)
    })

    setPresensiList(presensiResult.data || [])
    setIzinList(izinResult.data || [])
    setJadwalMap(jadwalMap)

    const map = {}
    ;(biayaResult.data || []).forEach((b) => {
      if (!map[b.nama_sholat]) {
        map[b.nama_sholat] = {}
      }
      map[b.nama_sholat][b.peran] = b.nominal
    })
    setBiayaMap(map)

    setLoading(false)
  }

  const todayJadwal = useMemo(() => {
    return jadwalBulanan.filter((j) => prayers.includes(j.nama_sholat))
  }, [jadwalBulanan])

  const todayPresensi = useMemo(() => {
    return presensiList.filter((pr) => pr.tanggal === today)
  }, [presensiList])

  const myPresensi = useMemo(() => {
    if (!currentPetugasId) return []
    return todayPresensi.filter((pr) => pr.petugas_id === currentPetugasId)
  }, [todayPresensi, currentPetugasId])

  const myIzin = useMemo(() => {
    if (!currentPetugasId) return []
    return izinList.filter((izin) => izin.petugas_id === currentPetugasId)
  }, [izinList, currentPetugasId])

  const stats = useMemo(() => {
    const hadir = todayPresensi.filter((pr) => pr.status === 'hadir').length
    const izin = todayPresensi.filter((pr) => pr.status === 'izin').length
    const alpha = todayPresensi.filter((pr) => pr.status === 'alpha').length
    const pendingIzin = izinList.filter((izin) => izin.status === 'pending').length

    return {
      hadir,
      izin,
      alpha,
      pendingIzin,
      totalPetugas: petugasList.length,
      totalJadwal: todayJadwal.length,
    }
  }, [todayPresensi, izinList, petugasList.length, todayJadwal.length])

  const getPetugasName = (id) => {
    const p = petugasList.find((pet) => pet.id === id)
    return p ? p.nama : '-'
  }

  const getPetugasInitials = (id) => {
    const p = petugasList.find((pet) => pet.id === id)
    return p ? getInitials(p.nama) : '-'
  }

  const getStatusForPetugas = (jadwal, role) => {
    const roleMap = {
      imam: 'imam_utama_id',
      muadzin: 'muadzin_utama_id',
    }
    const field = roleMap[role]
    if (!field) return { label: '-', icon: null, pengganti: null, color: 'text-on-surface' }

    const utamaId = jadwal[field]
    const cadanganId = jadwal[field.replace('utama', 'cadangan')] || null
    const masterJadwalIds = jadwalMap[jadwal.nama_sholat] || []
    const presensiJadwal = masterJadwalIds.length > 0 ? todayPresensi.filter((pr) => masterJadwalIds.includes(pr.jadwal_id)) : []

    const utamaHadir = presensiJadwal.find((pr) => pr.petugas_id === utamaId && pr.status === 'hadir')
    const cadanganHadir = presensiJadwal.find((pr) => pr.petugas_id === cadanganId && pr.status === 'hadir')
    const pengganti = presensiJadwal.find((pr) => pr.petugas_pengganti_id === utamaId && pr.status === 'hadir')

    if (utamaHadir) {
      return { label: getPetugasName(utamaId), icon: 'check_circle', pengganti: null, color: 'text-green-600' }
    }
    if (cadanganHadir) {
      return { label: getPetugasName(cadanganId), icon: 'check_circle', pengganti: null, color: 'text-green-600' }
    }
    if (pengganti) {
      return { label: getPetugasName(pengganti.petugas_id), icon: null, pengganti: null, color: 'text-orange-600' }
    }
    return { label: getPetugasName(utamaId), icon: null, pengganti: null, color: 'text-on-surface' }
  }

  if (loading) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12 flex items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12 space-y-stack-lg">
      {/* Welcome Header */}
      <div>
        <h1 className="font-h1 text-h1 text-on-surface mb-2">
          Selamat Datang, {profile?.nama?.split(' ')[0] || 'Pengguna'}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {canViewAdminStats ? (
        <>
          {/* Admin Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Presensi Hari Ini"
              value={`${stats.hadir} Hadir`}
              icon="fact_check"
              color="bg-secondary/5"
              trend={`${stats.izin} Izin | ${stats.alpha} Alpha`}
            />
            <StatCard
              label="Jadwal Sholat"
              value={`${stats.totalJadwal} Waktu`}
              icon="calendar_today"
              color="bg-primary/5"
              trend={`${stats.totalPetugas} petugas aktif`}
            />
            <StatCard
              label="Izin Pending"
              value={stats.pendingIzin.toString()}
              icon="event_busy"
              color="bg-tertiary/5"
              trend="Menunggu konfirmasi"
            />
          </section>

          {/* Today's Schedule */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-on-surface">Jadwal Sholat Hari Ini</h3>
              <button
                onClick={() => navigate('/jadwal')}
                className="text-sm text-primary hover:text-primary-container transition-colors font-label-sm"
              >
                Lihat Semua
              </button>
            </div>
            <div className="divide-y divide-outline-variant">
              {todayJadwal.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-body-md text-body-md text-on-surface-variant">Belum ada jadwal untuk hari ini.</p>
                </div>
              ) : (
                todayJadwal.map((jadwal) => {
                  const masterJadwalIds = jadwalMap[jadwal.nama_sholat] || []
                  const presensiCount = masterJadwalIds.length > 0 ? todayPresensi.filter((pr) => masterJadwalIds.includes(pr.jadwal_id)).length : 0
                  const imamStatus = getStatusForPetugas(jadwal, 'imam')
                  const muadzinStatus = getStatusForPetugas(jadwal, 'muadzin')
                  return (
                    <div key={jadwal.id} className="p-4 hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-body-md font-semibold text-on-surface">{jadwal.nama_sholat}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Imam: {imamStatus.label} {imamStatus.icon && <span className="material-symbols-outlined text-green-600 text-sm" style={{ verticalAlign: 'middle' }}>{imamStatus.icon}</span>}
                          </p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            Muadzin: {muadzinStatus.label} {muadzinStatus.icon && <span className="material-symbols-outlined text-green-600 text-sm" style={{ verticalAlign: 'middle' }}>{muadzinStatus.icon}</span>}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container">
                          {presensiCount} hadir
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="font-h3 text-h3 text-on-surface mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickAction icon="fact_check" label="Input Presensi" onClick={() => navigate('/presensi')} color="bg-primary-container text-white" />
              <QuickAction icon="calendar_month" label="Buat Jadwal" onClick={() => navigate('/jadwal')} color="bg-secondary text-on-surface" />
              <QuickAction icon="description" label="Laporan" onClick={() => navigate('/laporan')} color="bg-tertiary text-on-surface" />
              <QuickAction icon="person_add" label="Buat Akun" onClick={() => navigate('/buat-akun')} color="bg-surface-container-high text-on-surface" />
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Petugas Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Status Hari Ini"
              value={myPresensi.length > 0 ? 'Hadir' : 'Belum Absen'}
              icon={myPresensi.length > 0 ? 'check_circle' : 'pending'}
              color={myPresensi.length > 0 ? 'bg-secondary/5' : 'bg-tertiary/5'}
              trend={myPresensi.length > 0 ? `Presensi tercatat` : 'Silakan lakukan presensi'}
            />
            <StatCard
              label="Jadwal Hari Ini"
              value={`${todayJadwal.length} Waktu`}
              icon="calendar_today"
              color="bg-primary/5"
              trend={todayJadwal.length > 0 ? 'Tugas ada hari ini' : 'Tidak ada tugas'}
            />
            <StatCard
              label="Izin Aktif"
              value={myIzin.filter((i) => i.status === 'pending').length.toString()}
              icon="event_busy"
              color="bg-tertiary/5"
              trend={myIzin.length > 0 ? 'Menunggu konfirmasi' : 'Tidak ada izin'}
            />
          </section>

          {/* My Schedule Today */}
          <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
            <div className="p-6 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
              <h3 className="font-h3 text-h3 text-on-surface">Jadwal Saya Hari Ini</h3>
              <button
                onClick={() => navigate('/jadwal-saya')}
                className="text-sm text-primary hover:text-primary-container transition-colors font-label-sm"
              >
                Lihat Semua
              </button>
            </div>
            <div className="divide-y divide-outline-variant">
              {todayJadwal.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="font-body-md text-body-md text-on-surface-variant">Tidak ada jadwal untuk hari ini.</p>
                </div>
              ) : (
                todayJadwal.map((jadwal) => {
                  const isAssigned = jadwal.imam_utama_id === currentPetugasId || jadwal.imam_cadangan_id === currentPetugasId ||
                                    jadwal.muadzin_utama_id === currentPetugasId || jadwal.muadzin_cadangan_id === currentPetugasId
                  const masterJadwalIds = jadwalMap[jadwal.nama_sholat] || []
                  const alreadyPresensi = masterJadwalIds.length > 0 ? myPresensi.some((pr) => masterJadwalIds.includes(pr.jadwal_id)) : false

                  return (
                    <div key={jadwal.id} className="p-4 hover:bg-surface-container-low transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-body-md font-semibold text-on-surface">{jadwal.nama_sholat}</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">
                            {isAssigned ? ' Anda dijadwalkan' : ' Tidak dijadwalkan'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alreadyPresensi ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-high text-on-surface-variant'
                        }`}>
                          {alreadyPresensi ? 'Sudah Absen' : 'Belum Absen'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="font-h3 text-h3 text-on-surface mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <QuickAction icon="calendar_today" label="Jadwal Saya" onClick={() => navigate('/jadwal-saya')} color="bg-primary-container text-white" />
              <QuickAction icon="event_busy" label="Buat Izin" onClick={() => navigate('/konfirmasi-izin')} color="bg-secondary text-on-surface" />
              <QuickAction icon="description" label="Rekap Kehadiran" onClick={() => navigate('/rekap')} color="bg-tertiary text-on-surface" />
            </div>
          </section>
        </>
      )}
    </div>
  )
}

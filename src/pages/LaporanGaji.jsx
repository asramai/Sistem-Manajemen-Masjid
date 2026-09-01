import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { downloadPDF, downloadExcel, downloadWord } from '../utils/download'

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const roles = ['Semua', 'Imam', 'Muadzin', 'Bilal', 'Marbot']
const prayers = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
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

function RosterTable({ roster }) {
  const roleBadge = (role) => {
    if (role.includes('imam')) return 'bg-primary text-on-primary'
    if (role === 'muadzin') return 'bg-surface-variant text-on-surface-variant'
    if (role === 'bilal') return 'bg-emerald-100 text-emerald-800'
    return 'bg-surface-variant text-on-surface-variant'
  }

  const roleLabel = (role) => {
    const labels = { imam: 'Imam', muadzin: 'Muadzin', bilal: 'Bilal', marbot: 'Marbot' }
    return labels[role] || role
  }

  return (
    <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-bright border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              <th className="p-4 font-semibold sticky left-0 bg-surface-bright z-10 w-64 shadow-[1px_0_0_0_#e2e2e2]">Nama &amp; Peran</th>
              <th className="p-4 font-semibold text-center">Hadir sebagai Muadzin</th>
              <th className="p-4 font-semibold text-center">Hadir sebagai Imam</th>
              <th className="p-4 font-semibold text-center">Hadir Tanpa Penugasan</th>
              <th className="p-4 font-semibold text-center">Izin</th>
              <th className="p-4 font-semibold text-center">Alpha</th>
              <th className="p-4 font-semibold text-right">Transport Muadzin</th>
              <th className="p-4 font-semibold text-right">Transport Imam</th>
              <th className="p-4 font-semibold text-right">Total Transport</th>
              <th className="p-4 font-semibold text-right">Gaji Pokok</th>
              <th className="p-4 font-semibold text-right">Total Diterima</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant">
            {roster.map((item) => (
              <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                <td className="p-4 sticky left-0 bg-surface group-hover:bg-surface-container-low transition-colors z-10 shadow-[1px_0_0_0_#e2e2e2]">
                  <div className="flex items-center gap-3">
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt={item.nama} className="w-10 h-10 rounded-full object-cover border border-outline-variant" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-xs uppercase">
                        {item.initials}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-on-surface">{item.nama}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadge(item.role)}`}>
                        {roleLabel(item.role)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center bg-secondary-container text-on-secondary-container font-medium px-2.5 py-1 rounded-md min-w-[40px]">
                    {item.hadir_muadzin}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center bg-secondary-container text-on-secondary-container font-medium px-2.5 py-1 rounded-md min-w-[40px]">
                    {item.hadir_imam}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center bg-tertiary/20 text-tertiary font-medium px-2.5 py-1 rounded-md min-w-[40px]">
                    {item.hadir_tanpa_penugasan || '-'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center bg-surface-container-high text-on-surface-variant font-medium px-2.5 py-1 rounded-md min-w-[40px]">
                    {item.izin || '-'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center justify-center font-medium px-2.5 py-1 rounded-md min-w-[40px] ${
                    item.alpha > 0 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {item.alpha || '-'}
                  </span>
                </td>
                <td className="p-4 text-right tabular-nums text-on-surface-variant">{formatCurrency(item.transportMuadzin)}</td>
                <td className="p-4 text-right tabular-nums text-on-surface-variant">{formatCurrency(item.transportImam)}</td>
                <td className="p-4 text-right tabular-nums text-on-surface-variant">{formatCurrency(item.transport)}</td>
                <td className="p-4 text-right tabular-nums text-on-surface-variant">{formatCurrency(item.gaji)}</td>
                <td className="p-4 text-right font-medium text-primary tabular-nums">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-outline-variant bg-surface-bright flex justify-between items-center text-body-sm text-on-surface-variant">
        <span>Menampilkan 1-{roster.length} dari {roster.length} petugas</span>
      </div>
    </div>
  )
}

export default function LaporanGaji() {
  const { profile, session } = useAuth()
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedRole, setSelectedRole] = useState('Semua')
  const [search, setSearch] = useState('')
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [biayaMap, setBiayaMap] = useState({})
  const [currentPetugasId, setCurrentPetugasId] = useState(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  useEffect(() => {
    fetchRoster()
  }, [selectedMonth, selectedYear])

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
      } else {
        const { data: byName } = await supabase
          .from('petugas')
          .select('id')
          .ilike('nama', profile?.nama || '')
          .limit(1)
          .maybeSingle()

        setCurrentPetugasId(byName?.id || null)
      }
    }

    fetchCurrentPetugas()
  }, [session, profile])

  const fetchRoster = async () => {
    setLoading(true)
    const [petugasResult, biayaResult, jadwalBulananResult] = await Promise.all([
      supabase.from('petugas').select('*').eq('is_active', true).order('nama'),
      supabase.from('biaya_transport').select('*'),
      supabase
        .from('jadwal_bulanan')
        .select('*')
        .gte('tanggal', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`)
        .lt('tanggal', `${selectedYear}-${String(selectedMonth + 2 > 12 ? selectedMonth + 2 - 12 : selectedMonth + 2).padStart(2, '0')}-01`),
    ])

    if (petugasResult.error) {
      console.error('Error fetching petugas:', petugasResult.error)
      setLoading(false)
      return
    }

    const map = {}
    ;(biayaResult.data || []).forEach((b) => {
      if (!map[b.nama_sholat]) {
        map[b.nama_sholat] = {}
      }
      map[b.nama_sholat][b.peran] = b.nominal
    })
    setBiayaMap(map)

    const jadwalBulananMap = {}
    ;(jadwalBulananResult.data || []).forEach((j) => {
      if (!jadwalBulananMap[j.tanggal]) {
        jadwalBulananMap[j.tanggal] = {}
      }
      jadwalBulananMap[j.tanggal][j.nama_sholat] = j
    })

    const rosterData = await Promise.all(
      (petugasResult.data || []).map(async (p) => {
        const { data: presensiData } = await supabase
          .from('presensi')
          .select('status, jadwal_id, tanggal, peran')
          .eq('petugas_id', p.id)
          .gte('tanggal', `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`)
          .lt('tanggal', `${selectedYear}-${String(selectedMonth + 2 > 12 ? selectedMonth + 2 - 12 : selectedMonth + 2).padStart(2, '0')}-01`)

        let hadirMuadzin = 0
        let hadirImam = 0
        let hadirTanpaPenugasan = 0
        let izin = 0
        let alpha = 0
        let transport = 0
        let transportMuadzin = 0
        let transportImam = 0

        if (presensiData && presensiData.length > 0) {
          const jadwalIds = [...new Set(presensiData.filter((pr) => pr.status === 'hadir').map((r) => r.jadwal_id))]
          const { data: jadwalData } = await supabase
            .from('jadwal')
            .select('id, nama_sholat')
            .in('id', jadwalIds)

          const jadwalMap = {}
          ;(jadwalData || []).forEach((j) => {
            jadwalMap[j.id] = j.nama_sholat
          })

          presensiData.forEach((pr) => {
            if (pr.status === 'hadir') {
              const namaSholat = jadwalMap[pr.jadwal_id]

              if (namaSholat) {
                const jadwalBulanan = jadwalBulananMap[pr.tanggal]?.[namaSholat]
                let peran = pr.peran || null

                if (!peran && jadwalBulanan) {
                  if (jadwalBulanan.muadzin_utama_id === p.id || jadwalBulanan.muadzin_cadangan_id === p.id) {
                    peran = 'muadzin'
                  } else if (jadwalBulanan.imam_utama_id === p.id || jadwalBulanan.imam_cadangan_id === p.id) {
                    peran = 'imam'
                  }
                }

                if (!peran) {
                  peran = p.role === 'imam' ? 'imam' : p.role === 'muadzin' ? 'muadzin' : null
                  if (peran) {
                    hadirTanpaPenugasan++
                  }
                }

                if (peran) {
                  const nominal = map[namaSholat]?.[peran] || 0
                  transport += nominal

                  if (peran === 'imam') {
                    hadirImam++
                    transportImam += nominal
                  }
                  if (peran === 'muadzin') {
                    hadirMuadzin++
                    transportMuadzin += nominal
                  }
                }
              }
            } else if (pr.status === 'izin') {
              izin++
            } else if (pr.status === 'alpha') {
              alpha++
            }
          })
        }

        let gaji = 0
        if (p.tipe_honor === 'per_hadir') {
          gaji = (hadirImam + hadirMuadzin) * (p.honor_per_hadir || 0)
        } else {
          gaji = p.honor_bulanan || 0
        }

        return {
          id: p.id,
          nama: p.nama,
          role: p.role,
          avatar_url: p.avatar_url,
          initials: p.nama.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
          hadir_muadzin: hadirMuadzin,
          hadir_imam: hadirImam,
          hadir_tanpa_penugasan: hadirTanpaPenugasan,
          izin: izin || '-',
          alpha: alpha || '-',
          transportMuadzin,
          transportImam,
          transport,
          gaji,
          total: transport + gaji,
        }
      })
    )

    setRoster(rosterData)
    setLoading(false)
  }

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'takmir'

  const filteredRoster = roster.filter((item) => {
    if (!isAdmin && currentPetugasId) {
      if (item.id !== currentPetugasId) return false
    }
    const matchesRole = selectedRole === 'Semua' || item.role === selectedRole.toLowerCase()
    const matchesSearch = item.nama.toLowerCase().includes(search.toLowerCase()) || item.role.toLowerCase().includes(search.toLowerCase())
    return matchesRole && matchesSearch
  })

  const totalGaji = filteredRoster.reduce((sum, item) => sum + item.gaji, 0)
  const totalTransport = filteredRoster.reduce((sum, item) => sum + item.transport, 0)
  const totalTransportMuadzin = filteredRoster.reduce((sum, item) => sum + item.transportMuadzin, 0)
  const totalTransportImam = filteredRoster.reduce((sum, item) => sum + item.transportImam, 0)
  const totalPetugas = filteredRoster.length
  const avgKehadiran = filteredRoster.length > 0 ? Math.round(filteredRoster.reduce((sum, item) => sum + item.hadir_muadzin + item.hadir_imam, 0) / filteredRoster.length) : 0

  const currentMonthLabel = `${months[selectedMonth]} ${selectedYear}`

  const buildExportRows = (items) =>
    items.map((item) => ({
      Nama: item.nama,
      Peran: item.role,
      Hadir_Muadzin: item.hadir_muadzin,
      Hadir_Imam: item.hadir_imam,
      Hadir_Tanpa_Penugasan: item.hadir_tanpa_penugasan,
      Izin: item.izin,
      Alpha: item.alpha,
      Transport_Muadzin: formatCurrency(item.transportMuadzin),
      Transport_Imam: formatCurrency(item.transportImam),
      Total_Transport: formatCurrency(item.transport),
      Gaji_Pokok: formatCurrency(item.gaji),
      Total_Diterima: formatCurrency(item.total),
    }))

  const handleDownload = async (type) => {
    setShowDownloadMenu(false)
    const rows = buildExportRows(filteredRoster)

    if (type === 'pdf') {
      navigate(`/cetak-laporan?bulan=${selectedMonth}&tahun=${selectedYear}`)
      setTimeout(() => {
        downloadPDF('print-area', `laporan-gaji-${months[selectedMonth]}-${selectedYear}.pdf`)
      }, 500)
      return
    }

    if (type === 'pdf-detail') {
      navigate(`/cetak-detail?bulan=${selectedMonth}&tahun=${selectedYear}`)
      setTimeout(() => {
        downloadPDF('print-area', `laporan-gaji-detail-${months[selectedMonth]}-${selectedYear}.pdf`)
      }, 500)
      return
    }

    if (type === 'excel') {
      downloadExcel(rows, `laporan-gaji-${months[selectedMonth]}-${selectedYear}.csv`)
      return
    }

    if (type === 'word') {
      downloadWord(rows, `laporan-gaji-${months[selectedMonth]}-${selectedYear}.doc`)
      return
    }
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-6 pt-6 pb-12 space-y-stack-lg">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-display text-on-background mb-1">Laporan &amp; Rekapitulasi Gaji</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Masjid Pohuwato - Ringkasan operasional dan kompensasi petugas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            <select
              className="appearance-none bg-surface border border-outline-variant text-on-surface font-body-sm text-body-sm rounded-lg pl-4 pr-10 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <select
              className="appearance-none bg-surface border border-outline-variant text-on-surface font-body-sm text-body-sm rounded-lg pl-4 pr-10 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="bg-primary text-on-primary font-label-md text-label-md rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
                Unduh Laporan
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>expand_more</span>
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false)
                      handleDownload('pdf')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">PDF</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Laporan ringkas</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false)
                      handleDownload('pdf-detail')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-primary">table_view</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">PDF Detail</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Semua kolom rincian</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false)
                      handleDownload('excel')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-emerald-600">grid_on</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Excel</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">File CSV</p>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setShowDownloadMenu(false)
                      handleDownload('word')
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-high transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-blue-600">description</span>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">Word</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">File DOC</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Statistics Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Estimasi Gaji"
          value={formatCurrency(totalGaji)}
          icon="payments"
          color="bg-primary/5"
          trend={`Bulan ${currentMonthLabel}`}
        />
        <StatCard label="Total Petugas Aktif" value={totalPetugas.toString()} icon="group" color="bg-secondary/5" trend="Imam, Muadzin, & Marbot" />
        <StatCard
          label="Total Transport"
          value={formatCurrency(totalTransport)}
          icon="local_shipping"
          color="bg-secondary/5"
          trend={
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-secondary">trending_up</span> Berdasarkan presensi hadir
            </span>
          }
        />
      </section>

      {/* Search and Filter Bar */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize: '20px' }}>
              search
            </span>
            <input
              className="w-full bg-surface-bright border border-outline-variant text-on-surface font-body-sm text-body-sm rounded-lg pl-10 pr-4 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Cari nama petugas atau peran..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors ${
                  selectedRole === role
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-surface-bright border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Roster Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <RosterTable roster={filteredRoster} />
      )}
    </div>
  )
}

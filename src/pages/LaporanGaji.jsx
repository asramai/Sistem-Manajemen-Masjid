import React, { useState } from 'react'

const roles = ['Semua', 'Imam', 'Muadzin', 'Marbot']

const initialRoster = [
  { id: 1, name: 'Ust. Hasanudin', role: 'Imam Utama', initials: 'UH', hadir: 28, izin: 2, alpha: 0, tarif: 'Rp 50.000 / Kehadiran', gaji: 'Rp 1.400.000' },
  { id: 2, name: 'Ahmad Ibrahim', role: 'Muadzin', initials: 'AI', hadir: 30, izin: 0, alpha: 0, tarif: 'Rp 30.000 / Kehadiran', gaji: 'Rp 900.000' },
  { id: 3, name: 'Budi Rahman', role: 'Marbot', initials: 'BR', hadir: 25, izin: 3, alpha: 2, tarif: 'Bulanan (Flat)', gaji: 'Rp 1.500.000' },
]

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
    if (role.includes('Imam')) return 'bg-primary text-on-primary'
    if (role === 'Muadzin') return 'bg-surface-variant text-on-surface-variant'
    return 'bg-surface-variant text-on-surface-variant'
  }

  return (
    <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-bright border-b border-outline-variant font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              <th className="p-4 font-semibold sticky left-0 bg-surface-bright z-10 w-64 shadow-[1px_0_0_0_#e2e2e2]">Nama &amp; Peran</th>
              <th className="p-4 font-semibold text-center">Hadir</th>
              <th className="p-4 font-semibold text-center">Izin</th>
              <th className="p-4 font-semibold text-center">Alpha</th>
              <th className="p-4 font-semibold text-right">Tarif Dasar</th>
              <th className="p-4 font-semibold text-right">Total Gaji</th>
              <th className="p-4 font-semibold text-center w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant">
            {roster.map((item) => (
              <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                <td className="p-4 sticky left-0 bg-surface group-hover:bg-surface-container-low transition-colors z-10 shadow-[1px_0_0_0_#e2e2e2]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-xs uppercase">
                      {item.initials}
                    </div>
                    <div>
                      <p className="font-medium text-on-surface">{item.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${roleBadge(item.role)}`}>
                        {item.role}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center justify-center bg-secondary-container text-on-secondary-container font-medium px-2.5 py-1 rounded-md min-w-[40px]">
                    {item.hadir}
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
                <td className="p-4 text-right tabular-nums text-on-surface-variant">{item.tarif}</td>
                <td className="p-4 text-right font-medium text-primary tabular-nums">{item.gaji}</td>
                <td className="p-4 text-center">
                  <button className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-md hover:bg-surface-container-high">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-outline-variant bg-surface-bright flex justify-between items-center text-body-sm text-on-surface-variant">
        <span>Menampilkan 1-{roster.length} dari 24 petugas</span>
        <div className="flex gap-1">
          <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container-high disabled:opacity-50" disabled>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
          </button>
          <button className="w-8 h-8 rounded flex items-center justify-center bg-primary-container text-on-primary-container font-medium">1</button>
          <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container-high">2</button>
          <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container-high">3</button>
          <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-surface-container-high">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LaporanGaji() {
  const [selectedMonth, setSelectedMonth] = useState('Oktober 2023')
  const [selectedRole, setSelectedRole] = useState('Semua')
  const [search, setSearch] = useState('')

  const filteredRoster = initialRoster.filter((item) => {
    const matchesRole = selectedRole === 'Semua' || item.role.includes(selectedRole)
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.role.toLowerCase().includes(search.toLowerCase())
    return matchesRole && matchesSearch
  })

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-6 pt-6 pb-12 space-y-stack-lg">
      {/* Page Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-display text-on-background mb-1">Laporan &amp; Rekapitulasi Gaji</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Masjid Pohuwato - Ringkasan operasional dan kompensasi petugas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <select
              className="appearance-none bg-surface border border-outline-variant text-on-surface font-body-sm text-body-sm rounded-lg pl-4 pr-10 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-shadow"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option>Oktober 2023</option>
              <option>September 2023</option>
              <option>Agustus 2023</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" style={{ fontSize: '20px' }}>
              calendar_month
            </span>
          </div>
          <button className="bg-primary text-on-primary font-label-md text-label-md rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm active:scale-95">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>picture_as_pdf</span>
            Cetak PDF Laporan Gaji
          </button>
        </div>
      </div>

      {/* Global Statistics Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Estimasi Gaji"
          value="Rp 12.450.000"
          icon="payments"
          color="bg-primary/5"
          trend="Bulan berjalan (Oktober 2023)"
        />
        <StatCard label="Total Petugas Aktif" value="24" icon="group" color="bg-secondary/5" trend="Imam, Muadzin, & Marbot" />
        <StatCard
          label="Rata-rata Kehadiran"
          value="92%"
          icon="fact_check"
          color="bg-primary-fixed/30"
          trend={
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-secondary">trending_up</span> +2% dibandingkan bulan lalu
            </span>
          }
        />
      </section>

      {/* Search and Filter Bar */}
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

      {/* Detailed Roster Table */}
      <RosterTable roster={filteredRoster} />
    </div>
  )
}

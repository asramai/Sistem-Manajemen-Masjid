import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const roles = ['super_admin', 'admin', 'takmir', 'petugas']

const roleBadgeClass = {
  'super_admin': 'bg-primary text-on-primary',
  'admin': 'bg-primary-container text-on-primary-container',
  'takmir': 'bg-secondary-fixed text-on-secondary-fixed',
  'petugas': 'bg-secondary-container text-on-secondary-container',
}

const roleLabel = {
  'super_admin': 'Super Admin',
  'admin': 'Admin',
  'takmir': 'Takmir',
  'petugas': 'Petugas',
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [petugasMap, setPetugasMap] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('nama')

    const { data: petugasData, error: petugasError } = await supabase
      .from('petugas')
      .select('*')
      .eq('is_active', true)

    if (profilesError) console.error('Error fetching profiles:', profilesError)
    if (petugasError) console.error('Error fetching petugas:', petugasError)

    const map = {}
    ;(petugasData || []).forEach((p) => {
      map[p.id] = p
    })
    setPetugasMap(map)
    setUsers(profilesData || [])
    setLoading(false)
  }

  const filteredUsers = users.filter((u) =>
    u.nama.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = async (id, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id)

    if (error) {
      alert('Gagal mengubah peran: ' + error.message)
    } else {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)))
    }
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
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Manajemen Pengguna &amp; Petugas</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola peran, status, dan data detail petugas Masjid Pohuwato.</p>
        </div>
        <button className="bg-primary text-on-primary hover:bg-primary-container transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center gap-2 shadow-sm hover:shadow-md">
          <span className="material-symbols-outlined">add</span>
          Tambah Petugas Baru
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters & Search */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6">
            <h3 className="font-h3 text-h3 mb-4">Cari Petugas</h3>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
              <input
                className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md bg-surface-bright"
                placeholder="Cari nama atau peran..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6">
            <h3 className="font-h3 text-h3 mb-4">Filter Peran</h3>
            <div className="space-y-3">
              {roles.map((role) => (
                <label key={role} className="flex items-center gap-3 cursor-pointer group">
                  <input className="rounded border-outline-variant text-primary focus:ring-primary" type="checkbox" />
                  <span className="font-body-md text-body-md group-hover:text-primary transition-colors">{roleLabel[role]}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-3 space-y-4">
          {filteredUsers.map((user) => {
            const petugas = petugasMap[user.id]
            return (
              <div
                key={user.id}
                className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6 hover:bg-surface-container-low transition-colors duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden shrink-0 border-2 border-primary/10">
                      {petugas?.avatar_url ? (
                        <img alt={user.nama} className="w-full h-full object-cover" src={petugas.avatar_url} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-secondary font-h3">
                          {user.nama.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-h3 text-h3 text-on-surface">{user.nama}</h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wider font-bold ${roleBadgeClass[user.role] || 'bg-gray-100 text-gray-800'}`}>
                          {roleLabel[user.role] || user.role}
                        </span>
                        {petugas && (
                          <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-md font-label-sm text-[10px]">
                            {petugas.role}
                          </span>
                        )}
                        <span className="text-outline text-label-sm font-label-sm">• {user.phone || '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:ml-auto">
                    <select
                      className="border border-outline-variant rounded-lg py-1.5 px-3 font-body-sm text-body-sm bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>{roleLabel[role]}</option>
                      ))}
                    </select>
                    <button className="p-2 text-on-surface-variant hover:bg-surface-container-high hover:text-primary rounded-lg transition-colors" title="Edit">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button className="p-2 text-on-surface-variant hover:bg-error-container hover:text-error rounded-lg transition-colors" title="Hapus">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>

                {petugas && (
                  <div className="mt-4 pt-4 border-t border-outline-variant grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-body-sm font-body-sm text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      {petugas.phone || '-'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">event_available</span>
                      Honor: {petugas.tipe_honor === 'per_hadir' ? formatCurrency(petugas.honor_per_hadir || 0) + '/hadir' : formatCurrency(petugas.honor_bulanan || 0) + '/bulan'}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

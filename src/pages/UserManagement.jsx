import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const petugasRoles = ['imam', 'muadzin', 'bilal', 'marbot']
const honorTypes = ['per_hadir', 'bulanan']

const petugasRoleBadgeClass = {
  'imam': 'bg-slate-900 text-white border border-slate-900',
  'muadzin': 'bg-indigo-100 text-indigo-800 border border-indigo-200',
  'bilal': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'marbot': 'bg-amber-100 text-amber-800 border border-amber-200',
}

const petugasRoleLabel = {
  'imam': 'Imam',
  'muadzin': 'Muadzin',
  'bilal': 'Bilal',
  'marbot': 'Marbot',
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function AddPetugasModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nama: '',
    role: 'imam',
    phone: '',
    tipe_honor: 'per_hadir',
    honor_per_hadir: '',
    honor_bulanan: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const data = {
      nama: form.nama,
      role: form.role,
      phone: form.phone || null,
      tipe_honor: form.tipe_honor,
      honor_per_hadir: form.tipe_honor === 'per_hadir' ? Number(form.honor_per_hadir) || 0 : 0,
      honor_bulanan: form.tipe_honor === 'bulanan' ? Number(form.honor_bulanan) || 0 : 0,
      is_active: form.is_active,
    }

    const { data: result, error } = await supabase
      .from('petugas')
      .insert([data])
      .select()

    if (error) {
      alert('Gagal menambahkan petugas: ' + error.message)
    } else {
      onSuccess?.(result[0])
      onClose()
      setForm({
        nama: '',
        role: 'imam',
        phone: '',
        tipe_honor: 'per_hadir',
        honor_per_hadir: '',
        honor_bulanan: '',
        is_active: true,
      })
    }
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div
        ref={modalRef}
        className="relative bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-h3 text-h3 text-on-surface">Tambah Petugas Baru</h3>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="nama">
              Nama Lengkap
            </label>
            <input
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
              id="nama"
              name="nama"
              placeholder="Masukkan nama lengkap"
              required
              type="text"
              value={form.nama}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="role">
              Peran
            </label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              {petugasRoles.map((role) => (
                <option key={role} value={role}>{petugasRoleLabel[role]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="phone">
              Nomor Telepon
            </label>
            <input
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
              id="phone"
              name="phone"
              placeholder="Contoh: +62 812-3456-7890"
              type="text"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="tipe_honor">
              Tipe Honor
            </label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
              id="tipe_honor"
              name="tipe_honor"
              value={form.tipe_honor}
              onChange={handleChange}
            >
              {honorTypes.map((type) => (
                <option key={type} value={type}>{type === 'per_hadir' ? 'Per Kehadiran' : 'Bulanan (Flat)'}</option>
              ))}
            </select>
          </div>

          {form.tipe_honor === 'per_hadir' && (
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="honor_per_hadir">
                Honor Per Kehadiran (Rp)
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                id="honor_per_hadir"
                name="honor_per_hadir"
                placeholder="Contoh: 50000"
                required
                type="number"
                min="0"
                value={form.honor_per_hadir}
                onChange={handleChange}
              />
            </div>
          )}

          {form.tipe_honor === 'bulanan' && (
            <div className="flex flex-col gap-xs">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="honor_bulanan">
                Honor Bulanan (Rp)
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                id="honor_bulanan"
                name="honor_bulanan"
                placeholder="Contoh: 1500000"
                required
                type="number"
                min="0"
                value={form.honor_bulanan}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              className="rounded border-outline-variant text-primary focus:ring-primary"
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={handleChange}
            />
            <label className="font-body-md text-body-md text-on-surface cursor-pointer" htmlFor="is_active">
              Aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md font-semibold disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [petugasMap, setPetugasMap] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleAddPetugas = async (newPetugas) => {
    setPetugasMap((prev) => ({
      ...prev,
      [newPetugas.id]: newPetugas,
    }))
    fetchData()
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary hover:bg-primary-container transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center gap-2 shadow-sm hover:shadow-md"
        >
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
                          <span className={`px-2 py-0.5 rounded-md font-label-sm text-[10px] ${petugasRoleBadgeClass[petugas.role] || 'bg-gray-100 text-gray-800'}`}>
                            {petugasRoleLabel[petugas.role] || petugas.role}
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

      <AddPetugasModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleAddPetugas} />
    </div>
  )
}

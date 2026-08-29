import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export default function JadwalPerBulan() {
  const [petugasList, setPetugasList] = useState([])
  const [jadwalBulanan, setJadwalBulanan] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [form, setForm] = useState({
    nama_sholat: 'Subuh',
    imam_utama_id: '',
    imam_cadangan_id: '',
    muadzin_utama_id: '',
    muadzin_cadangan_id: '',
    is_jumat_manual: false,
  })

  const imamList = petugasList.filter((p) => p.role === 'imam')
  const muadzinList = petugasList.filter((p) => p.role === 'muadzin')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchJadwalByDate(selectedDate)
    }
  }, [selectedDate])

  const fetchData = async () => {
    setLoading(true)
    const { data: petugasData } = await supabase
      .from('petugas')
      .select('*')
      .eq('is_active', true)
      .order('nama')

    setPetugasList(petugasData || [])
    setLoading(false)
  }

  const fetchJadwalByDate = async (date) => {
    const { data } = await supabase
      .from('jadwal_bulanan')
      .select('*')
      .eq('tanggal', date)
      .order('nama_sholat')

    if (data && data.length > 0) {
      setJadwalBulanan(data)
    } else {
      setJadwalBulanan([])
    }
  }

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    return new Date(selectedYear, selectedMonth, 1).getDay()
  }

  const handleDateClick = (day) => {
    const date = new Date(selectedYear, selectedMonth, day)
    const dateStr = date.toISOString().split('T')[0]
    setSelectedDate(dateStr)
  }

  const handleSave = async () => {
    if (!selectedDate) return

    setSaving(true)
    const data = {
      tanggal: selectedDate,
      nama_sholat: form.nama_sholat,
      imam_utama_id: form.imam_utama_id || null,
      imam_cadangan_id: form.imam_cadangan_id || null,
      muadzin_utama_id: form.muadzin_utama_id || null,
      muadzin_cadangan_id: form.muadzin_cadangan_id || null,
      is_jumat_manual: form.is_jumat_manual,
    }

    const { error } = await supabase
      .from('jadwal_bulanan')
      .upsert(data, { onConflict: ['tanggal', 'nama_sholat'] })

    if (error) {
      alert('Gagal menyimpan: ' + error.message)
    } else {
      alert('Jadwal berhasil disimpan!')
      fetchJadwalByDate(selectedDate)
    }
    setSaving(false)
  }

  const handleApplyWeekly = async () => {
    if (!selectedDate) return

    setSaving(true)
    const date = new Date(selectedDate)
    const daysInMonth = getDaysInMonth()
    const promises = []

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day)
      const dayOfWeek = currentDate.getDay()
      const dateStr = currentDate.toISOString().split('T')[0]

      if (form.nama_sholat === 'Jumat' && dayOfWeek !== 5) continue

      const data = {
        tanggal: dateStr,
        nama_sholat: form.nama_sholat,
        imam_utama_id: form.imam_utama_id || null,
        imam_cadangan_id: form.imam_cadangan_id || null,
        muadzin_utama_id: form.muadzin_utama_id || null,
        muadzin_cadangan_id: form.muadzin_cadangan_id || null,
        is_jumat_manual: form.is_jumat_manual,
      }

      promises.push(
        supabase
          .from('jadwal_bulanan')
          .upsert(data, { onConflict: ['tanggal', 'nama_sholat'] })
      )
    }

    try {
      await Promise.all(promises)
      alert('Jadwal mingguan berhasil diterapkan ke bulan ini!')
      if (selectedDate) {
        fetchJadwalByDate(selectedDate)
      }
    } catch (err) {
      alert('Gagal menerapkan jadwal')
    } finally {
      setSaving(false)
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth()
    const firstDay = getFirstDayOfMonth()
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth, day)
      const dateStr = date.toISOString().split('T')[0]
      const isSelected = selectedDate === dateStr
      const isToday = dateStr === new Date().toISOString().split('T')[0]

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`p-2 rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-primary text-on-primary'
              : isToday
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-surface-container-high'
          }`}
        >
          {day}
        </button>
      )
    }

    return days
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
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Jadwal Per Bulan</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola jadwal penugasan petugas sholat per bulan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-h3 text-h3 text-on-surface">
              {months[selectedMonth]} {selectedYear}
            </h3>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value))
                  setSelectedDate(null)
                }}
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
              <select
                className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value))
                  setSelectedDate(null)
                }}
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>

        {/* Assignment Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6">
            <h3 className="font-h3 text-h3 text-on-surface mb-4">
              {selectedDate ? `Jadwal ${selectedDate}` : 'Pilih Tanggal'}
            </h3>

            {selectedDate && (
              <div className="space-y-4">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="nama_sholat">Waktu Sholat</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    id="nama_sholat"
                    value={form.nama_sholat}
                    onChange={(e) => setForm((prev) => ({ ...prev, nama_sholat: e.target.value }))}
                  >
                    {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Jumat'].map((sholat) => (
                      <option key={sholat} value={sholat}>{sholat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface">Imam Utama</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.imam_utama_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, imam_utama_id: e.target.value }))}
                  >
                    <option value="">-- Pilih Imam --</option>
                    {imamList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface">Imam Cadangan</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.imam_cadangan_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, imam_cadangan_id: e.target.value }))}
                  >
                    <option value="">-- Pilih Imam Cadangan --</option>
                    {imamList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface">Muadzin Utama</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.muadzin_utama_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, muadzin_utama_id: e.target.value }))}
                  >
                    <option value="">-- Pilih Muadzin --</option>
                    {muadzinList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-label-md text-on-surface">Muadzin Cadangan</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-md text-body-md"
                    value={form.muadzin_cadangan_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, muadzin_cadangan_id: e.target.value }))}
                  >
                    <option value="">-- Pilih Muadzin Cadangan --</option>
                    {muadzinList.map((p) => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                    id="is_jumat_manual"
                    name="is_jumat_manual"
                    type="checkbox"
                    checked={form.is_jumat_manual}
                    onChange={(e) => setForm((prev) => ({ ...prev, is_jumat_manual: e.target.checked }))}
                  />
                  <label className="font-body-md text-body-md text-on-surface cursor-pointer" htmlFor="is_jumat_manual">
                    Jadwal Manual (Jumat)
                  </label>
                </div>

                <div className="flex flex-col gap-2 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary text-on-primary hover:bg-primary-container transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">save</span>
                    {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  <button
                    onClick={handleApplyWeekly}
                    disabled={saving}
                    className="w-full bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">calendar_month</span>
                    Terapkan ke Semua Hari di Bulan Ini
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

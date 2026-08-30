import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const daysOfWeek = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const allSholat = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya', 'Jumat']

export default function JadwalPerBulan() {
  const [petugasList, setPetugasList] = useState([])
  const [jadwalBulanan, setJadwalBulanan] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('jadwal')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedDates, setSelectedDates] = useState([])
  const [selectedSholat, setSelectedSholat] = useState([])
  const [form, setForm] = useState({
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
    if (activeTab === 'jadwal') {
      fetchJadwalBulanan()
    }
  }, [selectedYear, selectedMonth, activeTab])

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

  const fetchJadwalBulanan = async () => {
    setLoading(true)
    const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`
    const nextMonth = selectedMonth + 2
    const endDate = `${selectedYear}-${String(nextMonth > 12 ? nextMonth - 12 : nextMonth).padStart(2, '0')}-01`

    const { data } = await supabase
      .from('jadwal_bulanan')
      .select('*')
      .gte('tanggal', startDate)
      .lt('tanggal', endDate)
      .order('tanggal', { ascending: true })

    setJadwalBulanan(data || [])
    setLoading(false)
  }

  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    const day = new Date(selectedYear, selectedMonth, 1).getDay()
    return (day + 6) % 7
  }

  const handleDateClick = (day) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr)
      } else {
        return [...prev, dateStr]
      }
    })
  }

  const handleSholatToggle = (sholat) => {
    setSelectedSholat((prev) => {
      if (prev.includes(sholat)) {
        return prev.filter((s) => s !== sholat)
      } else {
        return [...prev, sholat]
      }
    })
  }

  const handleSave = async () => {
    if (selectedDates.length === 0 || selectedSholat.length === 0) return

    setSaving(true)
    const promises = []

    for (const dateStr of selectedDates) {
      for (const sholat of selectedSholat) {
        const data = {
          tanggal: dateStr,
          nama_sholat: sholat,
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
    }

    try {
      const results = await Promise.all(promises)
      const hasError = results.some((r) => r.error)
      if (hasError) {
        alert('Gagal menyimpan beberapa data')
      } else {
        alert(`Jadwal ${selectedDates.length} tanggal × ${selectedSholat.length} sholat berhasil disimpan!`)
        setSelectedDates([])
        setSelectedSholat([])
        setForm({
          imam_utama_id: '',
          imam_cadangan_id: '',
          muadzin_utama_id: '',
          muadzin_cadangan_id: '',
          is_jumat_manual: false,
        })
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleApplyWeekly = async () => {
    if (selectedSholat.length === 0) return

    setSaving(true)
    const daysInMonth = getDaysInMonth()
    const promises = []

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(selectedYear, selectedMonth, day)
      const dayOfWeek = currentDate.getDay()
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      if (selectedSholat.includes('Jumat') && dayOfWeek !== 5) continue

      for (const sholat of selectedSholat) {
        if (sholat === 'Jumat' && dayOfWeek !== 5) continue

        const data = {
          tanggal: dateStr,
          nama_sholat: sholat,
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
    }

    try {
      await Promise.all(promises)
      alert(`Jadwal berhasil diterapkan ke ${daysInMonth} hari di bulan ini!`)
      setSelectedDates([])
      setSelectedSholat([])
      setForm({
        imam_utama_id: '',
        imam_cadangan_id: '',
        muadzin_utama_id: '',
        muadzin_cadangan_id: '',
        is_jumat_manual: false,
      })
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
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const isSelected = selectedDates.includes(dateStr)
      const today = new Date()
      const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      const jadwalDate = jadwalBulanan.filter((j) => j.tanggal === dateStr)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day)}
          className={`p-2 rounded-lg text-sm font-medium transition-colors relative ${
            isSelected
              ? 'bg-primary text-on-primary ring-2 ring-primary ring-offset-2'
              : isToday
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-surface-container-high'
          }`}
        >
          {day}
          {jadwalDate.length > 0 && (
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-secondary rounded-full"></span>
          )}
          {isSelected && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></span>
          )}
        </button>
      )
    }

    return days
  }

  if (loading && activeTab === 'jadwal') {
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

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 mb-6">
        <button
          onClick={() => setActiveTab('jadwal')}
          className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
            activeTab === 'jadwal'
              ? 'bg-primary-container text-white'
              : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Jadwal
        </button>
        <button
          onClick={() => setActiveTab('buat')}
          className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors ${
            activeTab === 'buat'
              ? 'bg-primary-container text-white'
              : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          Buat Jadwal
        </button>
      </div>

      {activeTab === 'jadwal' && (
        <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6">
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
                  setSelectedDates([])
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
                  setSelectedDates([])
                }}
              >
                {[2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-on-surface-variant uppercase tracking-wider">
                {day.slice(0, 3)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>

          {selectedDates.length > 0 && (
            <div className="mt-6 pt-6 border-t border-outline-variant">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-h3 text-h3 text-on-surface">Jadwal Terpilih ({selectedDates.length} tanggal)</h4>
                <button
                  onClick={() => setSelectedDates([])}
                  className="text-sm text-error hover:text-error/80 transition-colors"
                >
                  Hapus Semua
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-outline-variant">
                      <th rowSpan="3" className="px-4 py-3 font-label-md text-label-md text-on-surface bg-surface-container-high/50 align-top">Hari/Tanggal</th>
                      <th colSpan="10" className="px-4 py-3 font-label-md text-label-md text-on-surface bg-surface-container-high/50 text-center">Waktu Sholat</th>
                    </tr>
                    <tr className="border-b border-outline-variant">
                      {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((sholat) => (
                        <th key={sholat} colSpan="2" className="px-4 py-2 font-body-sm text-body-sm text-on-surface-variant bg-surface-container-high/50 text-center">{sholat}</th>
                      ))}
                    </tr>
                    <tr className="border-b border-outline-variant">
                      {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((sholat) => (
                        <React.Fragment key={sholat}>
                          <th className="px-4 py-2 font-body-sm text-body-sm text-on-surface-variant bg-surface-container-high/50 text-center">Muadzin</th>
                          <th className="px-4 py-2 font-body-sm text-body-sm text-on-surface-variant bg-surface-container-high/50 text-center">Imam</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {selectedDates.sort().map((dateStr) => {
                      const date = new Date(dateStr)
                      const day = date.getDate()
                      const month = date.toLocaleString('id-ID', { month: 'short' })
                      const dayName = date.toLocaleString('id-ID', { weekday: 'long' })

                      const jadwalMap = {}
                      jadwalBulanan.filter((j) => j.tanggal === dateStr).forEach((j) => {
                        jadwalMap[j.nama_sholat] = j
                      })

                      return (
                        <tr key={dateStr} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="px-4 py-3 font-body-md font-semibold text-on-surface align-top whitespace-nowrap">
                            <div className="flex items-center justify-between gap-2">
                              <span>{dayName}, {day} {month}</span>
                              <button
                                onClick={() => handleDateClick(day)}
                                className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                              >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              </button>
                            </div>
                          </td>
                          {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya'].map((sholat) => {
                            const jadwal = jadwalMap[sholat]
                            const muadzin = jadwal ? (petugasList.find((p) => p.id === jadwal.muadzin_utama_id)?.nama || '-') : '-'
                            const imam = jadwal ? (petugasList.find((p) => p.id === jadwal.imam_utama_id)?.nama || '-') : '-'
                            return (
                              <React.Fragment key={sholat}>
                                <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant text-center">{muadzin}</td>
                                <td className="px-4 py-3 font-body-sm text-body-sm text-on-surface-variant text-center">{imam}</td>
                              </React.Fragment>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'buat' && (
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
                    setSelectedDates([])
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
                    setSelectedDates([])
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
                {selectedDates.length > 0 ? `Buat Jadwal (${selectedDates.length} tanggal)` : 'Pilih Tanggal'}
              </h3>

              {selectedDates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-xs">
                    <label className="font-label-md text-label-md text-on-surface">Waktu Sholat (Pilih beberapa)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {allSholat.map((sholat) => (
                        <label key={sholat} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={selectedSholat.includes(sholat)}
                            onChange={() => handleSholatToggle(sholat)}
                            className="rounded border-outline-variant text-primary focus:ring-primary"
                          />
                          <span className="font-body-md text-body-md group-hover:text-primary transition-colors">{sholat}</span>
                        </label>
                      ))}
                    </div>
                    {selectedSholat.length > 0 && (
                      <p className="text-xs text-on-surface-variant">Terpilih: {selectedSholat.join(', ')}</p>
                    )}
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
                      disabled={saving || selectedSholat.length === 0}
                      className="w-full bg-primary text-on-primary hover:bg-primary-container transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">save</span>
                      {saving ? 'Menyimpan...' : `Simpan (${selectedDates.length} tanggal)`}
                    </button>
                    <button
                      onClick={handleApplyWeekly}
                      disabled={saving || selectedSholat.length === 0}
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
      )}
    </div>
  )
}

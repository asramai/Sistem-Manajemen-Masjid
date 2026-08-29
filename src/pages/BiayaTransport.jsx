import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const prayers = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export default function BiayaTransport() {
  const [petugasList, setPetugasList] = useState([])
  const [biayaMap, setBiayaMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: petugasData, error: petugasError } = await supabase
      .from('petugas')
      .select('*')
      .eq('is_active', true)
      .order('nama')

    const { data: biayaData, error: biayaError } = await supabase
      .from('biaya_transport')
      .select('*')

    if (petugasError) console.error('Error fetching petugas:', petugasError)
    if (biayaError) console.error('Error fetching biaya transport:', biayaError)

    const map = {}
    ;(biayaData || []).forEach((b) => {
      if (!map[b.petugas_id]) {
        map[b.petugas_id] = {}
      }
      map[b.petugas_id][b.nama_sholat] = b.nominal
    })
    setBiayaMap(map)
    setPetugasList(petugasData || [])
    setLoading(false)
  }

  const handleNominalChange = (petugasId, sholat, value) => {
    setBiayaMap((prev) => ({
      ...prev,
      [petugasId]: {
        ...prev[petugasId],
        [sholat]: Number(value) || 0,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    const promises = []

    petugasList.forEach((p) => {
      const biayaPetugas = biayaMap[p.id] || {}
      prayers.forEach((sholat) => {
        const nominal = biayaPetugas[sholat] || 0
        const existing = biayaPetugas[sholat + '_id']

        const data = {
          petugas_id: p.id,
          nama_sholat: sholat,
          nominal,
        }

        if (existing) {
          promises.push(supabase.from('biaya_transport').update(data).eq('id', existing))
        } else {
          promises.push(supabase.from('biaya_transport').insert([data]))
        }
      })
    })

    try {
      const results = await Promise.all(promises)
      const hasError = results.some((r) => r.error)
      if (hasError) {
        alert('Gagal menyimpan beberapa data')
      } else {
        alert('Biaya transport berhasil disimpan!')
        fetchData()
      }
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan')
    } finally {
      setSaving(false)
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
          <h1 className="font-h1 text-h1 text-on-surface mb-2">Biaya Pengganti Transport</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Kelola nominal biaya transport per petugas per sholat.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-on-primary hover:bg-primary-container transition-colors duration-200 px-6 py-3 rounded-xl font-label-md text-label-md flex items-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50"
        >
          <span className="material-symbols-outlined">save</span>
          {saving ? 'Menyimpan...' : 'Simpan Semua'}
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined">info</span>
          </div>
          <div>
            <h3 className="font-h3 text-h3 text-on-surface mb-1">Informasi Biaya Transport</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Biaya transport akan dihitung setiap kali petugas melakukan presensi hadir. 
              Total biaya transport akan terakumulasi dan ditambahkan dengan gaji pokok di akhir bulan.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest border border-outline-variant shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-bright border-b border-outline-variant">
                <th className="p-4 font-semibold font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider w-64">Nama Petugas</th>
                {prayers.map((sholat) => (
                  <th key={sholat} className="p-4 font-semibold font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-center">
                    {sholat}
                  </th>
                ))}
                <th className="p-4 font-semibold font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                  Total/Bulan
                </th>
              </tr>
            </thead>
            <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant">
              {petugasList.map((p) => {
                const biayaPetugas = biayaMap[p.id] || {}
                const totalBulan = prayers.reduce((sum, sholat) => sum + (biayaPetugas[sholat] || 0), 0)

                return (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-xs uppercase">
                          {p.nama.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-on-surface">{p.nama}</p>
                          <p className="text-xs text-on-surface-variant capitalize">{p.role}</p>
                        </div>
                      </div>
                    </td>
                    {prayers.map((sholat) => (
                      <td key={sholat} className="p-4 text-center">
                        <input
                          className="w-24 text-right px-2 py-1 rounded border border-outline-variant bg-surface-bright focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-body-sm text-body-sm"
                          min="0"
                          type="number"
                          value={biayaPetugas[sholat] || 0}
                          onChange={(e) => handleNominalChange(p.id, sholat, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="p-4 text-right">
                      <span className="font-medium text-primary">{formatCurrency(totalBulan)}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

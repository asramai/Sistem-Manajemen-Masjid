import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function CetakDetailLaporanGaji() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [profil, setProfil] = useState(null)
  const bulan = Number(new URLSearchParams(window.location.search).get('bulan')) ?? new Date().getMonth()
  const tahun = Number(new URLSearchParams(window.location.search).get('tahun')) ?? new Date().getFullYear()

  useEffect(() => {
    fetchData()
  }, [bulan, tahun])

  const fetchData = async () => {
    setLoading(true)
    const [{ data: profilData }, { data: petugasData }, { data: biayaData }, { data: jadwalBulananData }] = await Promise.all([
      supabase.from('profil_masjid').select('*').limit(1).maybeSingle(),
      supabase.from('petugas').select('*').eq('is_active', true).order('nama'),
      supabase.from('biaya_transport').select('*'),
      supabase
        .from('jadwal_bulanan')
        .select('*')
        .gte('tanggal', `${tahun}-${String(bulan + 1).padStart(2, '0')}-01`)
        .lt('tanggal', `${tahun}-${String(bulan + 2 > 12 ? bulan + 2 - 12 : bulan + 2).padStart(2, '0')}-01`),
    ])

    setProfil(profilData)

    const map = {}
    ;(biayaData || []).forEach((b) => {
      if (!map[b.nama_sholat]) {
        map[b.nama_sholat] = {}
      }
      map[b.nama_sholat][b.peran] = b.nominal
    })

    const jadwalBulananMap = {}
    ;(jadwalBulananData || []).forEach((j) => {
      if (!jadwalBulananMap[j.tanggal]) {
        jadwalBulananMap[j.tanggal] = {}
      }
      jadwalBulananMap[j.tanggal][j.nama_sholat] = j
    })

    const rosterData = await Promise.all(
      (petugasData || []).map(async (p) => {
        const { data: presensiData } = await supabase
          .from('presensi')
          .select('status, jadwal_id, tanggal, peran')
          .eq('petugas_id', p.id)
          .gte('tanggal', `${tahun}-${String(bulan + 1).padStart(2, '0')}-01`)
          .lt('tanggal', `${tahun}-${String(bulan + 2 > 12 ? bulan + 2 - 12 : bulan + 2).padStart(2, '0')}-01`)

        let hadirMuadzin = 0
        let hadirImam = 0
        let hadirTanpaPenugasan = 0
        let izin = 0
        let alpha = 0
        let transport = 0
        let transportMuadzin = 0
        let transportImam = 0

        if (presensiData) {
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

        const gaji = p.tipe_honor === 'per_hadir' ? (hadirImam + hadirMuadzin) * (p.honor_per_hadir || 0) : p.honor_bulanan || 0

        return {
          nama: p.nama,
          role: p.role,
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

  const handlePrint = () => {
    window.print()
  }

  const totalGaji = roster.reduce((sum, item) => sum + item.gaji, 0)
  const totalTransport = roster.reduce((sum, item) => sum + item.transport, 0)
  const totalTransportMuadzin = roster.reduce((sum, item) => sum + item.transportMuadzin, 0)
  const totalTransportImam = roster.reduce((sum, item) => sum + item.transportImam, 0)
  const grandTotal = roster.reduce((sum, item) => sum + item.total, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-semibold shadow-lg flex items-center gap-2 hover:bg-gray-300 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Kembali
        </button>
        <button
          onClick={handlePrint}
          className="bg-primary text-white px-6 py-3 rounded-lg font-semibold shadow-lg flex items-center gap-2 hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined">print</span>
          Cetak PDF
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-8 print:p-0 print:max-w-none">
        {/* Kop Surat */}
        <div className="flex items-center gap-6 mb-6 border-b-2 border-black pb-6">
          {profil?.logo_url && (
            <img src={profil.logo_url} alt="Logo Masjid" className="w-24 h-24 object-contain shrink-0" />
          )}
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold mb-1">{profil?.nama_masjid || 'Nama Masjid'}</h1>
            <p className="text-xs mb-0.5">{profil?.alamat || 'Alamat Masjid'}</p>
            <p className="text-xs">Telp. {profil?.nomor_kontak || '-'}</p>
          </div>
        </div>

        {/* Judul */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold mb-1">DAFTAR PENERIMA GAJI DAN BIAYA PENGGANTI TRANSPORT PETUGAS IBADAH</h2>
          <h3 className="text-base font-semibold">Bulan {months[bulan]} {tahun}</h3>
        </div>

        {/* Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-[10px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-2 border-black p-1.5 text-center font-semibold whitespace-nowrap">NO</th>
                <th className="border-2 border-black p-1.5 text-left font-semibold whitespace-nowrap">NAMA & PERAN</th>
                <th className="border-2 border-black p-1.5 text-center font-semibold whitespace-nowrap">HADIR MUADZIN</th>
                <th className="border-2 border-black p-1.5 text-center font-semibold whitespace-nowrap">HADIR IMAM</th>
                <th className="border-2 border-black p-1.5 text-center font-semibold whitespace-nowrap">TANPA PENUGASAN</th>
                <th className="border-2 border-black p-1.5 text-center font-semibold whitespace-nowrap">IZIN</th>
                <th className="border-2 border-black p-1.5 text-center font-semibold whitespace-nowrap">ALPHA</th>
                <th className="border-2 border-black p-1.5 text-right font-semibold whitespace-nowrap">TRANSPORT MUADZIN</th>
                <th className="border-2 border-black p-1.5 text-right font-semibold whitespace-nowrap">TRANSPORT IMAM</th>
                <th className="border-2 border-black p-1.5 text-right font-semibold whitespace-nowrap">TOTAL TRANSPORT</th>
                <th className="border-2 border-black p-1.5 text-right font-semibold whitespace-nowrap">GAJI POKOK</th>
                <th className="border-2 border-black p-1.5 text-right font-semibold whitespace-nowrap">TOTAL DITERIMA</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((item, index) => (
                <tr key={index}>
                  <td className="border-2 border-black p-1.5 text-center whitespace-nowrap">{index + 1}</td>
                  <td className="border-2 border-black p-1.5 whitespace-nowrap">{item.nama} / {item.role}</td>
                  <td className="border-2 border-black p-1.5 text-center whitespace-nowrap">{item.hadir_muadzin}</td>
                  <td className="border-2 border-black p-1.5 text-center whitespace-nowrap">{item.hadir_imam}</td>
                  <td className="border-2 border-black p-1.5 text-center whitespace-nowrap">{item.hadir_tanpa_penugasan}</td>
                  <td className="border-2 border-black p-1.5 text-center whitespace-nowrap">{item.izin}</td>
                  <td className="border-2 border-black p-1.5 text-center whitespace-nowrap">{item.alpha}</td>
                  <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(item.transportMuadzin)}</td>
                  <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(item.transportImam)}</td>
                  <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(item.transport)}</td>
                  <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(item.gaji)}</td>
                  <td className="border-2 border-black p-1.5 text-right font-semibold tabular-nums whitespace-nowrap">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td colSpan="2" className="border-2 border-black p-1.5 text-center">TOTAL</td>
                <td className="border-2 border-black p-1.5 text-center whitespace-nowrap"></td>
                <td className="border-2 border-black p-1.5 text-center whitespace-nowrap"></td>
                <td className="border-2 border-black p-1.5 text-center whitespace-nowrap"></td>
                <td className="border-2 border-black p-1.5 text-center whitespace-nowrap"></td>
                <td className="border-2 border-black p-1.5 text-center whitespace-nowrap"></td>
                <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(totalTransportMuadzin)}</td>
                <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(totalTransportImam)}</td>
                <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(totalTransport)}</td>
                <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(totalGaji)}</td>
                <td className="border-2 border-black p-1.5 text-right tabular-nums whitespace-nowrap">{formatCurrency(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-16">
          <div className="w-5/12 pr-4">
            <div className="flex flex-col gap-0.5 mb-10">
              <p className="font-semibold text-xs">Mengetahui,</p>
              <p className="font-semibold text-xs">Ketua Takmir</p>
            </div>
            <div className="h-20 mb-1"></div>
            <p className="font-semibold text-xs">{profil?.ketua_takmir || '(Nama Ketua Takmir)'}</p>
          </div>
          <div className="w-5/12 pl-4">
            <div className="flex flex-col gap-0.5 mb-10">
              <p className="font-semibold text-xs">Marisa, {formatDate(new Date())}</p>
              <p className="font-semibold text-xs">Bendahara</p>
            </div>
            <div className="h-20 mb-1"></div>
            <p className="font-semibold text-xs">{profil?.bendahara || '(Nama Bendahara)'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

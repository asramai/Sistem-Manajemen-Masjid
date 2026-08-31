import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
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

export default function CetakLaporanGaji() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuth()
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)
  const [profil, setProfil] = useState(null)
  const bulan = Number(searchParams.get('bulan')) ?? new Date().getMonth()
  const tahun = Number(searchParams.get('tahun')) ?? new Date().getFullYear()

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

  const totalTransport = roster.reduce((sum, item) => sum + item.transport, 0)
  const totalGaji = roster.reduce((sum, item) => sum + item.gaji, 0)
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

      <div className="max-w-4xl mx-auto p-8 print:p-0">
        {/* Kop Surat */}
        <div className="text-center mb-8 border-b-2 border-black pb-6">
          {profil?.logo_url && (
            <img src={profil.logo_url} alt="Logo Masjid" className="w-20 h-20 object-contain mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-2">{profil?.nama_masjid || 'Nama Masjid'}</h1>
          <p className="text-sm mb-1">{profil?.alamat || 'Alamat Masjid'}</p>
          <p className="text-sm">Telp. {profil?.nomor_kontak || '-'}</p>
        </div>

        {/* Judul */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-2">DAFTAR PENERIMA GAJI DAN BIAYA PENGGANTI TRANSPORT PETUGAS IBADAH</h2>
          <h3 className="text-lg font-semibold">Bulan {months[bulan]} {tahun}</h3>
        </div>

        {/* Tabel */}
        <table className="w-full border-collapse border-2 border-black mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-2 border-black p-2 w-12 text-center">NO</th>
              <th className="border-2 border-black p-2 text-center">NAMA PETUGAS</th>
              <th className="border-2 border-black p-2 text-center">TUGAS</th>
              <th className="border-2 border-black p-2 text-right">GAJI POKOK</th>
              <th className="border-2 border-black p-2 text-right">TRANSPORT</th>
              <th className="border-2 border-black p-2 text-right">JUMLAH</th>
              <th className="border-2 border-black p-2 text-center">TANDA TANGAN</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((item, index) => (
              <tr key={index}>
                <td className="border-2 border-black p-2 text-center">{index + 1}</td>
                <td className="border-2 border-black p-2">{item.nama}</td>
                <td className="border-2 border-black p-2 text-center capitalize">{item.role}</td>
                <td className="border-2 border-black p-2 text-right">{formatCurrency(item.gaji)}</td>
                <td className="border-2 border-black p-2 text-right">{formatCurrency(item.transport)}</td>
                <td className="border-2 border-black p-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                <td className="border-2 border-black p-2 h-16"></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold">
              <td colSpan="3" className="border-2 border-black p-2 text-center">TOTAL</td>
              <td className="border-2 border-black p-2 text-right">{formatCurrency(totalGaji)}</td>
              <td className="border-2 border-black p-2 text-right">{formatCurrency(totalTransport)}</td>
              <td className="border-2 border-black p-2 text-right">{formatCurrency(grandTotal)}</td>
              <td className="border-2 border-black p-2"></td>
            </tr>
          </tfoot>
        </table>

        {/* Tanda Tangan */}
        <div className="flex justify-between mt-12">
          <div className="w-1/2 pr-8">
            <p className="font-semibold mb-4">Mengetahui,</p>
            <p className="font-semibold">Ketua Takmir</p>
            <div className="h-16 border-b-2 border-black mb-2"></div>
            <p className="font-semibold">{profil?.ketua_takmir || '(Nama Ketua Takmir)'}</p>
          </div>
          <div className="w-1/2 pl-8">
            <p className="font-semibold mb-4">Marisa, {formatDate(new Date())}</p>
            <p className="font-semibold">Bendahara</p>
            <div className="h-16 border-b-2 border-black mb-2"></div>
            <p className="font-semibold">{profil?.bendahara || '(Nama Bendahara)'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

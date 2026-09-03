import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useToast } from '../contexts/ToastContext'

const prayers = ['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', 'Isya']

export default function PresensiSaya() {
  const { profile, session } = useAuth()
  const toast = useToast()
  const [petugas, setPetugas] = useState(null)
  const [jadwalHariIni, setJadwalHariIni] = useState([])
  const [jadwalMap, setJadwalMap] = useState({})
  const [presensiList, setPresensiList] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    if (!session?.user?.id) return
    setLoading(true)

    const { data: petugasData } = await supabase
      .from('petugas')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()

    if (!petugasData && profile?.nama) {
      const { data: byName } = await supabase
        .from('petugas')
        .select('*')
        .ilike('nama', profile.nama)
        .limit(1)
        .maybeSingle()
      setPetugas(byName || null)
    } else {
      setPetugas(petugasData)
    }

    const { data: jadwalBulananData } = await supabase
      .from('jadwal_bulanan')
      .select('*')
      .eq('tanggal', today)

    const { data: jadwalData } = await supabase
      .from('jadwal')
      .select('*')
      .order('id')

    const jadwalList = Array.isArray(jadwalData) ? jadwalData : []
    const jadwalBulananList = Array.isArray(jadwalBulananData) ? jadwalBulananData : []

    const jadwalMapLocal = {}
    jadwalList.forEach((j) => {
      if (!jadwalMapLocal[j.nama_sholat]) {
        jadwalMapLocal[j.nama_sholat] = j
      }
    })
    setJadwalMap(jadwalMapLocal)

    const filteredJadwal = jadwalBulananList.filter((j) => prayers.includes(j.nama_sholat))
    setJadwalHariIni(filteredJadwal)

    if (petugasData || profile?.nama) {
      const petugasId = petugasData?.id
      if (!petugasId && profile?.nama) {
        const { data: byName } = await supabase
          .from('petugas')
          .select('id')
          .ilike('nama', profile.nama)
          .limit(1)
          .maybeSingle()
        if (byName) {
          const { data: presensiData } = await supabase
            .from('presensi')
            .select('*')
            .eq('petugas_id', byName.id)
            .eq('tanggal', today)
          setPresensiList(Array.isArray(presensiData) ? presensiData : [])
        }
      } else if (petugasId) {
        const { data: presensiData } = await supabase
          .from('presensi')
          .select('*')
          .eq('petugas_id', petugasId)
          .eq('tanggal', today)
        setPresensiList(Array.isArray(presensiData) ? presensiData : [])
      }
    }

    setLoading(false)
  }

  const isAssigned = (jadwal) => {
    if (!petugas?.id) return false
    return (
      jadwal.imam_utama_id === petugas.id ||
      jadwal.imam_cadangan_id === petugas.id ||
      jadwal.muadzin_utama_id === petugas.id ||
      jadwal.muadzin_cadangan_id === petugas.id
    )
  }

  const getMyRole = (jadwal) => {
    if (!petugas?.id) return null
    if (jadwal.imam_utama_id === petugas.id) return 'imam'
    if (jadwal.imam_cadangan_id === petugas.id) return 'imam'
    if (jadwal.muadzin_utama_id === petugas.id) return 'muadzin'
    if (jadwal.muadzin_cadangan_id === petugas.id) return 'muadzin'
    return null
  }

  const alreadyPresensi = (jadwal) => {
    const myRole = getMyRole(jadwal)
    if (!myRole) return false
    const jadwalId = jadwalMap[jadwal.nama_sholat]?.id
    if (!jadwalId) return false
    return presensiList.some((p) => p.jadwal_id === jadwalId && p.petugas_id === petugas.id && p.status === 'hadir')
  }

  const isPending = (jadwal) => {
    const myRole = getMyRole(jadwal)
    if (!myRole) return false
    const jadwalId = jadwalMap[jadwal.nama_sholat]?.id
    if (!jadwalId) return false
    return presensiList.some((p) => p.jadwal_id === jadwalId && p.petugas_id === petugas.id && p.status === 'pending')
  }

  const handlePresensi = async (jadwal) => {
    if (!petugas?.id) {
      toast.addToast('Data petugas tidak ditemukan. Hubungi admin.', 'error')
      return
    }

    const myRole = getMyRole(jadwal)
    if (!myRole) {
      toast.addToast('Anda tidak memiliki jadwal untuk waktu sholat ini.', 'error')
      return
    }

    if (alreadyPresensi(jadwal)) {
      toast.addToast('Anda sudah melakukan presensi untuk waktu sholat ini.', 'warning')
      return
    }

    if (isPending(jadwal)) {
      toast.addToast('Anda sudah mengajukan presensi dan menunggu validasi admin.', 'warning')
      return
    }

    const jadwalId = jadwalMap[jadwal.nama_sholat]?.id
    if (!jadwalId) {
      toast.addToast('Data jadwal tidak ditemukan. Hubungi admin.', 'error')
      return
    }

    setSaving(true)

    try {
      const { data: currentAssignment } = await supabase
        .from('jadwal_bulanan')
        .select('*')
        .eq('tanggal', today)
        .eq('nama_sholat', jadwal.nama_sholat)
        .maybeSingle()

      if (!currentAssignment || !(
        currentAssignment.imam_utama_id === petugas.id ||
        currentAssignment.imam_cadangan_id === petugas.id ||
        currentAssignment.muadzin_utama_id === petugas.id ||
        currentAssignment.muadzin_cadangan_id === petugas.id
      )) {
        toast.addToast('Anda tidak lagi memiliki jadwal untuk waktu sholat ini. Hubungi admin.', 'error')
        setSaving(false)
        return
      }

      const { data: existing } = await supabase
        .from('presensi')
        .select('id, status')
        .eq('petugas_id', petugas.id)
        .eq('jadwal_id', jadwalId)
        .eq('tanggal', today)
        .limit(1)
        .maybeSingle()

      if (existing) {
        toast.addToast('Presensi untuk waktu sholat ini sudah tercatat.', 'warning')
        setSaving(false)
        fetchData()
        return
      }

      const { error } = await supabase.from('presensi').insert({
        petugas_id: petugas.id,
        jadwal_id: jadwalId,
        tanggal: today,
        status: 'pending',
        peran: myRole,
      })

      if (error) {
        if (error.code === '23505') {
          toast.addToast('Presensi untuk waktu sholat ini sudah tercatat.', 'warning')
        } else {
          toast.addToast('Gagal presensi: ' + (error.message || err), 'error')
        }
        return
      }

      toast.addToast('Presensi berhasil! Menunggu validasi admin.', 'success')
      fetchData()
    } catch (err) {
      toast.addToast('Gagal presensi: ' + (err.message || err), 'error')
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

  if (!petugas) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">person_off</span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Data petugas tidak ditemukan. Hubungi admin untuk menghubungkan akun Anda dengan data petugas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-8 pb-12">
      <div className="mb-8">
        <h1 className="font-h1 text-h1 text-on-surface mb-2">Presensi Saya</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">Lakukan presensi kehadiran untuk jadwal sholat hari ini.</p>
      </div>

      {jadwalHariIni.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">event_busy</span>
          <p className="font-body-md text-body-md text-on-surface-variant">Tidak ada jadwal sholat untuk hari ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jadwalHariIni.map((jadwal) => {
            const assigned = isAssigned(jadwal)
            const done = alreadyPresensi(jadwal)
            const myRole = getMyRole(jadwal)
            const jadwalId = jadwalMap[jadwal.nama_sholat]?.id
            const hasPending = jadwalId ? presensiList.some((p) => p.jadwal_id === jadwalId && p.petugas_id === petugas.id && p.status === 'pending') : false

            return (
              <div
                key={jadwal.id}
                className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-6 ${
                  assigned ? 'hover:bg-surface-container-low' : 'opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-h3 text-h3 text-on-surface">{jadwal.nama_sholat}</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      {assigned ? (
                        <>
                          Anda bertugas sebagai <span className="font-semibold text-primary">{myRole === 'imam' ? 'Imam' : 'Muadzin'}</span>
                        </>
                      ) : (
                        'Anda tidak ada di jadwal ini'
                      )}
                    </p>
                    {done && (
                      <p className="font-body-sm text-body-sm text-green-600 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Sudah presensi
                      </p>
                    )}
                    {!done && hasPending && (
                      <p className="font-body-sm text-body-sm text-amber-600 mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">hourglass_top</span>
                        Menunggu validasi admin
                      </p>
                    )}
                  </div>
                  {assigned && !done && !hasPending && (
                    <button
                      onClick={() => handlePresensi(jadwal)}
                      disabled={saving}
                      className="bg-primary text-on-primary hover:bg-primary-container transition-colors px-6 py-2.5 rounded-lg font-label-md font-semibold disabled:opacity-50"
                    >
                      {saving ? 'Menyimpan...' : 'Presensi'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

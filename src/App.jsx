import React, { useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AttendancePage from './pages/AttendancePage'
import LaporanGaji from './pages/LaporanGaji'
import LoginPage from './pages/LoginPage'
import UserManagement from './pages/UserManagement'
import RekapKehadiranSaya from './pages/RekapKehadiranSaya'
import BiayaTransport from './pages/BiayaTransport'
import JadwalPerBulan from './pages/JadwalPerBulan'
import JadwalSaya from './pages/JadwalSaya'
import KonfirmasiIzin from './pages/KonfirmasiIzin'
import BuatAkunPetugas from './pages/BuatAkunPetugas'
import HomePage from './pages/HomePage'
import CetakLaporanGaji from './pages/CetakLaporanGaji'

function TopAppBar({ currentPath, onLogout, profile }) {
  const isLaporan = currentPath === '/laporan'
  const isProfil = currentPath === '/profil'
  const isBiaya = currentPath === '/biaya-transport'
  const isJadwal = currentPath === '/jadwal' || currentPath === '/buat-akun'
  const headerClass = isLaporan || isProfil || isBiaya || isJadwal ? 'bg-primary dark:bg-primary-container' : 'bg-primary-container dark:bg-primary-container'

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'takmir'

  const navItems = isAdmin
    ? [
        { label: 'Beranda', icon: 'home', path: '/' },
        { label: 'Presensi', icon: 'fact_check', path: '/presensi' },
        { label: 'Laporan', icon: 'description', path: '/laporan' },
        { label: 'Profil', icon: 'person', path: '/profil' },
        { label: 'Transport', icon: 'commute', path: '/biaya-transport' },
        { label: 'Jadwal', icon: 'calendar_month', path: '/jadwal' },
        { label: 'Buat Akun', icon: 'person_add', path: '/buat-akun' },
      ]
    : [
        { label: 'Beranda', icon: 'home', path: '/' },
        { label: 'Jadwal Saya', icon: 'calendar_today', path: '/jadwal-saya' },
        { label: 'Izin', icon: 'event_busy', path: '/konfirmasi-izin' },
      ]

  return (
    <header className={`${headerClass} text-on-primary dark:text-on-primary-container font-h2 text-h2 sticky top-0 full-width shadow-sm flex justify-between items-center px-margin-mobile py-4 w-full z-40`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
          <img
            alt="Masjid Logo"
            className="w-full h-full object-cover p-1"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL29A0yNh4ryFwtFBorD1WELoxwGI3K5WEWJWH0h5X73d_n9KWYLKAqXO2znynuH8xEXrmLEHvL8Wb5Nlfo5bbf2HAt5_rbYhVLBIuxVVjlVZ-zw6U635m_T6S0p8y2LMD2baTs2AviZkn65QS5oIE486H5GF9C9PPGYVd-C_Vi7QpbPV90b3gslcPmTEAnmIFqAtuU85S6sxFnfXYkNrY6E79h9D2Aa_vjf9KTiYs-ihzlS5JGYgB-Uff8eTmxO-tQqE"
          />
        </div>
        <span className="font-h2 text-h2 font-semibold">Sistem Manajemen Masjid</span>
      </div>
      <div className="hidden md:flex gap-6 items-center">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.path}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
              currentPath === item.path
                ? 'text-on-primary font-bold bg-primary-container/20'
                : 'text-on-primary/80 hover:bg-primary-container/20'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPath === item.path ? "'FILL' 1" : '' }}>
              {item.icon}
            </span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </a>
        ))}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-on-primary/80 hover:bg-primary-container/20 transition-colors duration-200"
          title="Logout"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-label-md text-label-md">Logout</span>
        </button>
      </div>
    </header>
  )
}

function MoreMenu({ isOpen, onClose, currentPath, onLogout, profile }) {
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'takmir'

  const moreItems = isAdmin
    ? [
        { label: 'Profil', icon: 'person', path: '/profil' },
        { label: 'Transport', icon: 'commute', path: '/biaya-transport' },
        { label: 'Jadwal', icon: 'calendar_month', path: '/jadwal' },
        { label: 'Buat Akun', icon: 'person_add', path: '/buat-akun' },
      ]
    : [
        { label: 'Laporan', icon: 'description', path: '/laporan' },
      ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative w-full bg-surface rounded-t-2xl shadow-xl border-t border-outline-variant p-6 pb-24" onClick={(e) => e.stopPropagation()}>
        <div className="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-4"></div>
        <h3 className="font-h3 text-h3 text-on-surface mb-4">Menu Lainnya</h3>
        <div className="space-y-2">
          {moreItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                navigate(item.path)
                onClose()
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors ${
                currentPath === item.path
                  ? 'bg-primary-container text-on-primary-container'
                  : 'hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-label-md text-label-md">{item.label}</span>
            </button>
          ))}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-error/10 text-error transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md text-label-md">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function BottomNav({ currentPath, onLogout, profile, onMoreClick }) {
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'takmir'

  const mainItems = isAdmin
    ? [
        { label: 'Beranda', icon: 'home', path: '/' },
        { label: 'Presensi', icon: 'fact_check', path: '/presensi' },
        { label: 'Laporan', icon: 'description', path: '/laporan' },
      ]
    : [
        { label: 'Beranda', icon: 'home', path: '/' },
        { label: 'Jadwal Saya', icon: 'calendar_today', path: '/jadwal-saya' },
        { label: 'Izin', icon: 'event_busy', path: '/konfirmasi-izin' },
      ]

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 pb-safe bg-surface border-t border-outline-variant shadow-lg md:hidden">
      {mainItems.map((item) => (
        <button
          key={item.label}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center justify-center px-4 py-1 rounded-xl active:scale-95 transition-transform ${
            currentPath === item.path
              ? 'bg-secondary-container text-on-secondary-container'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: currentPath === item.path ? "'FILL' 1" : '' }}>
            {item.icon}
          </span>
          <span className="font-label-sm text-label-sm mt-1">{item.label}</span>
        </button>
      ))}
      <button
        onClick={onMoreClick}
        className="flex flex-col items-center justify-center px-4 py-1 rounded-xl active:scale-95 transition-transform text-on-surface-variant hover:bg-surface-container-high"
      >
        <span className="material-symbols-outlined">more_horiz</span>
        <span className="font-label-sm text-label-sm mt-1">More</span>
      </button>
    </nav>
  )
}

function IdleWarningModal({ remainingSeconds, onStay, onLogout }) {
  const minutes = Math.ceil(remainingSeconds / 1000)

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      <div className="relative bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant w-full max-w-sm p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[24px]">timer</span>
          </div>
          <div>
            <h3 className="font-h3 text-h3 text-on-surface mb-1">Sesi Akan Berakhir</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Anda akan logout otomatis dalam <strong>{minutes}</strong> detik karena tidak ada aktivitas.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md"
          >
            Logout
          </button>
          <button
            onClick={onStay}
            className="px-6 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md font-semibold"
          >
            Tetap Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const currentPath = location.pathname
  const { session, loading, signOut, showWarning, resetIdle, profile } = useAuth()
  const navigate = useNavigate()
  const [showMore, setShowMore] = useState(false)

  if (loading) {
    return (
      <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="font-body-md text-on-surface-variant">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!session && currentPath !== '/login') {
    return <Navigate to="/login" replace />
  }

  if (session && currentPath === '/login') {
    return <Navigate to="/" replace />
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const isCetakLaporan = currentPath === '/cetak-laporan'

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col pb-24 md:pb-0">
      {session && !isCetakLaporan && <TopAppBar currentPath={currentPath} onLogout={handleLogout} profile={profile} />}
      <main className="flex-grow">
        {currentPath === '/login' && <LoginPage />}
        {currentPath === '/laporan' && <LaporanGaji />}
        {currentPath === '/cetak-laporan' && <CetakLaporanGaji />}
        {currentPath === '/presensi' && (isAdmin ? <AttendancePage /> : <Navigate to="/" replace />)}
        {currentPath === '/profil' && <UserManagement />}
        {currentPath === '/rekap' && <RekapKehadiranSaya />}
        {currentPath === '/biaya-transport' && <BiayaTransport />}
        {currentPath === '/jadwal' && <JadwalPerBulan />}
        {currentPath === '/jadwal-saya' && <JadwalSaya />}
        {currentPath === '/konfirmasi-izin' && <KonfirmasiIzin />}
        {currentPath === '/buat-akun' && <BuatAkunPetugas />}
        {currentPath === '/' && <HomePage />}
      </main>
      {session && !isCetakLaporan && (
        <>
          <BottomNav currentPath={currentPath} onLogout={handleLogout} profile={profile} onMoreClick={() => setShowMore(true)} />
          <MoreMenu isOpen={showMore} onClose={() => setShowMore(false)} currentPath={currentPath} onLogout={handleLogout} profile={profile} />
        </>
      )}
      {showWarning && !isCetakLaporan && (
        <IdleWarningModal
          remainingSeconds={IDLE_TIMEOUT}
          onStay={resetIdle}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}

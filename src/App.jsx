import React from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import AttendancePage from './pages/AttendancePage'
import LaporanGaji from './pages/LaporanGaji'
import LoginPage from './pages/LoginPage'
import UserManagement from './pages/UserManagement'
import RekapKehadiranSaya from './pages/RekapKehadiranSaya'

function TopAppBar({ currentPath }) {
  const isLaporan = currentPath === '/laporan'
  const isProfil = currentPath === '/profil'
  const headerClass = isLaporan || isProfil ? 'bg-primary dark:bg-primary-container' : 'bg-primary-container dark:bg-primary-container'

  const navItems = [
    { label: 'Beranda', icon: 'home', path: '/' },
    { label: 'Presensi', icon: 'fact_check', path: '/presensi' },
    { label: 'Laporan', icon: 'description', path: '/laporan' },
    { label: 'Profil', icon: 'person', path: '/profil' },
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
      </div>
    </header>
  )
}

function BottomNav({ currentPath }) {
  const navigate = useNavigate()
  const navItems = [
    { label: 'Beranda', icon: 'home', path: '/' },
    { label: 'Presensi', icon: 'fact_check', path: '/presensi' },
    { label: 'Laporan', icon: 'description', path: '/laporan' },
    { label: 'Profil', icon: 'person', path: '/profil' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-3 pb-safe bg-surface border-t border-outline-variant shadow-lg md:hidden">
      {navItems.map((item) => (
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
    </nav>
  )
}

export default function App() {
  const location = useLocation()
  const currentPath = location.pathname
  const { session, loading } = useAuth()
  const navigate = useNavigate()

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

  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col pb-24 md:pb-0">
      {session && <TopAppBar currentPath={currentPath} />}
      <main className="flex-grow">
        {currentPath === '/login' && <LoginPage />}
        {currentPath === '/laporan' && <LaporanGaji />}
        {currentPath === '/presensi' && <AttendancePage />}
        {currentPath === '/profil' && <UserManagement />}
        {currentPath === '/rekap' && <RekapKehadiranSaya />}
        {currentPath === '/' && <AttendancePage />}
      </main>
      {session && <BottomNav currentPath={currentPath} />}
    </div>
  )
}

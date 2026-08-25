import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message || 'Login gagal')
      }
    } catch (err) {
      setError('Terjadi kesalahan saat login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="geometric-bg min-h-screen flex items-center justify-center p-md md:p-lg text-on-background font-body-md">
      <main className="w-full max-w-[420px] bg-surface-container-lowest rounded-xl p-lg md:p-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-[#E0E0E0] flex flex-col items-center">
        <img
          alt="Masjid Pohuwato Logo"
          className="w-[120px] h-auto mb-lg"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAe_gKcTyo0BrdRgEa3vtrI8nEMybFRgK5Ky8g0xZBgora-G9DRYqHUFkB0h_-YDII6_pkNdjLKkA4vF3n7u9BRWLrplxEpOKM5ypN6A0FcKQ0Q3lTgDEMyqhGn5KTNe-BeVzf_-ao8b9ipUxEM0dipgVjmiB0aBV3ZkdH8CHPWR3jtcjJ-ZldILIr0IzzW6QSPF2Pjt20pEGUdAm5mhZaxqnp2ulQ9qQT05gsN9OlFP2FEV6IeqFoSYBDRxmJiooDrV6U"
        />
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs text-center">
          Selamat Datang
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-lg text-center">
          Masjid Pohuwato Management System
        </p>
        {error && (
          <div className="w-full mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-sm">
            {error}
          </div>
        )}
        <form className="w-full flex flex-col gap-md" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
              Email / Username
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">
                person
              </span>
              <input
                className="w-full pl-[40px] pr-sm py-sm rounded-DEFAULT border border-[#E0E0E0] bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-200"
                id="email"
                name="email"
                placeholder="Masukkan email atau username"
                required
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline">
                lock
              </span>
              <input
                className="w-full pl-[40px] pr-[40px] py-sm rounded-DEFAULT border border-[#E0E0E0] bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors duration-200"
                id="password"
                name="password"
                placeholder="Masukkan password"
                required
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                aria-label="Toggle password visibility"
                className="absolute right-sm top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <a className="font-label-md text-label-md text-primary hover:text-surface-tint underline decoration-primary/30 hover:decoration-primary transition-all" href="#">
              Lupa Password?
            </a>
          </div>
          <button
            className="w-full bg-primary hover:bg-surface-tint text-on-primary font-title-md text-title-md py-sm rounded-lg transition-colors duration-200 mt-sm"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Memuat...' : 'Masuk'}
          </button>
          <div className="flex justify-center mt-sm">
            <a className="font-label-md text-label-md text-primary hover:text-surface-tint underline decoration-primary/30 hover:decoration-primary transition-all" href="#">
              Daftar Akun Baru
            </a>
          </div>
        </form>
      </main>
    </div>
  )
}

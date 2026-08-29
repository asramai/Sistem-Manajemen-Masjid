import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const IDLE_TIMEOUT = 5 * 60 * 1000
const WARNING_BEFORE = 30 * 1000

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [idleTime, setIdleTime] = useState(0)
  const [showWarning, setShowWarning] = useState(false)

  const resetIdle = useCallback(() => {
    setIdleTime(0)
    setShowWarning(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    const handleActivity = () => resetIdle()

    events.forEach((event) => window.addEventListener(event, handleActivity))
    
    const interval = setInterval(() => {
      setIdleTime((prev) => {
        const newTime = prev + 1000
        if (newTime >= IDLE_TIMEOUT - WARNING_BEFORE && newTime < IDLE_TIMEOUT) {
          setShowWarning(true)
        }
        if (newTime >= IDLE_TIMEOUT) {
          signOut()
        }
        return newTime
      })
    }, 1000)

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity))
      clearInterval(interval)
    }
  }, [session, resetIdle])

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email, password, nama) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (!error && data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        nama: nama || email,
        role: 'petugas',
      })
    }
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setShowWarning(false)
    setIdleTime(0)
    return { error }
  }

  const value = {
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    idleTime,
    showWarning,
    resetIdle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

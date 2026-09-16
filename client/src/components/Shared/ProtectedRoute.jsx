import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getCurrentSession } from '../../services/supabase.js'
import { useAuthStore } from '../../store/authStore.js'

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const setSession = useAuthStore((s) => s.setSession)
  const [checking, setChecking] = useState(!user)
  const location = useLocation()

  useEffect(() => {
    let active = true
    if (!user) {
      getCurrentSession().then((session) => {
        if (!active) return
        if (session && session.user) {
          setSession(session.user, session.access_token)
        }
        setChecking(false)
      }).catch(() => {
        if (active) setChecking(false)
      })
    } else {
      setChecking(false)
    }
    return () => { active = false }
  }, [user, setSession])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-on-surface-variant">Connecting to NovaChat...</p>
        </div>
      </div>
    )
  }

  if (!user && !checking) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

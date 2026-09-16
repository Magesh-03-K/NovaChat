import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginWithIdentifier, requestPasswordReset } from '../../services/supabase.js'
import { api } from '../../services/api.js'
import { useAuthStore } from '../../store/authStore.js'
import NovaLogo from '../../components/Shared/NovaLogo.jsx'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetting, setResetting] = useState(false)

  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)

  const resolveUsername = async (username) => {
    const { data } = await api.post('/auth/resolve-username', { username })
    return data.email
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const { session, user } = await loginWithIdentifier({
        identifier: identifier.trim(),
        password,
        resolveUsername,
      })
      setSession(user, session.access_token)
      navigate('/chats')
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setError('Cannot connect to Supabase backend. Please check connection.')
      } else {
        setError(err.message || 'Login failed. Check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!resetEmail.trim()) return
    setResetting(true)
    setError('')
    try {
      await requestPasswordReset(resetEmail.trim())
      setMessage('Password reset email sent! Check your inbox.')
      setShowForgot(false)
    } catch (err) {
      setError(err.message || 'Failed to send reset email.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-space-base antialiased">
      <div className="w-full max-w-md bg-surface-container-lowest p- space-xl p-8 rounded-3xl shadow-xl border border-surface-container-low space-y-6">
        {/* Header Logo & Title */}
        <div className="flex flex-col items-center text-center space-y-2">
          <NovaLogo size={56} />
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
            NovaChat
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Real-time messaging, zero monthly cost
          </p>
        </div>

        {message && (
          <div className="p-3 bg-primary-container/10 text-primary rounded-xl text-sm font-medium text-center">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-tertiary-container/10 text-tertiary-container rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
              Email or Username
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you@example.com or username"
              className="w-full h-12 bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="font-label-sm text-label-sm text-primary font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary font-title-sm text-title-sm font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            <span>{loading ? 'Logging in...' : 'Log In'}</span>
          </button>
        </form>

        <p className="text-center font-body-md text-body-md text-on-surface-variant">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-semibold hover:underline">
            Create Account
          </Link>
        </p>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-base">
            <form
              onSubmit={handleResetPassword}
              className="w-full max-w-sm bg-surface-container-lowest p-space-base rounded-2xl shadow-2xl border border-surface-container space-y-4"
            >
              <h2 className="font-title-sm text-title-sm text-on-surface font-bold">
                Reset Password
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Enter your email address and we'll send you a password reset link.
              </p>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex-1 h-10 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="flex-1 h-10 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold"
                >
                  {resetting ? 'Sending...' : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { registerWithEmail } from '../../services/supabase.js'
import NovaLogo from '../../components/Shared/NovaLogo.jsx'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerWithEmail({ email, password })
      await api.post('/auth/register', { email, username, password })
      navigate('/onboarding')
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setError('Cannot connect to Supabase backend.')
      } else {
        setError(err.message || 'Could not create account. Try a different username/email.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-space-base antialiased">
      <div className="w-full max-w-md bg-surface-container-lowest p-8 rounded-3xl shadow-xl border border-surface-container-low space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <NovaLogo size={56} />
          <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
            Join NovaChat
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Create your account with email & username
          </p>
        </div>

        {error && (
          <div className="p-3 bg-tertiary-container/10 text-tertiary-container rounded-xl text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-12 bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              required
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="3-20 chars (letters, numbers, _)"
              pattern="[a-zA-Z0-9_]{3,20}"
              className="w-full h-12 bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              required
            />
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              className="w-full h-12 bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary font-title-sm text-title-sm font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>
        </form>

        <p className="text-center font-body-md text-body-md text-on-surface-variant">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  )
}

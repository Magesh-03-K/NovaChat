import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { registerWithEmail } from '../../services/supabase.js'
import NovaLogo from '../../components/Shared/NovaLogo.jsx'
import Icon from '../../components/Shared/Icon.jsx'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [touched, setTouched] = useState({ email: false, username: false, password: false })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Inline validation rules
  const validateEmail = (val) => {
    if (!val) return 'Email address is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address.'
    return ''
  }

  const validateUsername = (val) => {
    if (!val) return 'Username is required.'
    if (val.length < 3 || val.length > 20) return 'Username must be 3 to 20 characters long.'
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Letters, numbers, and underscores only.'
    return ''
  }

  const validatePassword = (val) => {
    if (!val) return 'Password is required.'
    if (val.length < 8) return 'Password must be at least 8 characters.'
    return ''
  }

  const emailError = touched.email ? validateEmail(email) : ''
  const usernameError = touched.username ? validateUsername(username) : ''
  const passwordError = touched.password ? validatePassword(password) : ''

  const isFormValid = !validateEmail(email) && !validateUsername(username) && !validatePassword(password)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, username: true, password: true })
    setError('')
    setSuccess('')

    if (!isFormValid) return

    setLoading(true)
    try {
      const signUpRes = await registerWithEmail({ email, password })
      const userId = signUpRes.user?.id
      if (!userId) {
        throw new Error('Could not create account. This email may already be registered. Try logging in.')
      }
      await api.post('/auth/register', { user_id: userId, email, username, password })

      if (!signUpRes.session) {
        setSuccess('Account created! Please check your email inbox to confirm your account before logging in.')
      } else {
        navigate('/onboarding')
      }
    } catch (err) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setError('Cannot connect to Supabase backend.')
      } else {
        setError(err.response?.data?.detail || err.message || 'Could not create account. Try a different username/email.')
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

        {success && (
          <div className="p-4 bg-primary-container/20 text-primary rounded-xl text-sm font-medium text-center border border-primary/20 space-y-2">
            <p className="font-semibold">{success}</p>
            <Link to="/login" className="inline-block text-xs underline font-bold mt-1">
              Go to Login Page →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              placeholder="you@example.com"
              className={`w-full h-12 bg-surface-container-low border ${
                emailError ? 'border-tertiary' : 'border-surface-container'
              } text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all`}
              required
            />
            {emailError && (
              <p className="text-[12px] text-tertiary font-medium mt-1 pl-1 flex items-center gap-1">
                <Icon name="error" className="text-[14px]" />
                {emailError}
              </p>
            )}
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, username: true }))}
              placeholder="3-20 chars (letters, numbers, _)"
              className={`w-full h-12 bg-surface-container-low border ${
                usernameError ? 'border-tertiary' : 'border-surface-container'
              } text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all`}
              required
            />
            {usernameError && (
              <p className="text-[12px] text-tertiary font-medium mt-1 pl-1 flex items-center gap-1">
                <Icon name="error" className="text-[14px]" />
                {usernameError}
              </p>
            )}
          </div>

          <div>
            <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              placeholder="At least 8 characters"
              className={`w-full h-12 bg-surface-container-low border ${
                passwordError ? 'border-tertiary' : 'border-surface-container'
              } text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all`}
              required
            />
            {passwordError && (
              <p className="text-[12px] text-tertiary font-medium mt-1 pl-1 flex items-center gap-1">
                <Icon name="error" className="text-[14px]" />
                {passwordError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary font-title-sm text-title-sm font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <Icon name="person_add" className="text-[20px]" />
            <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
          </button>

          <p className="text-[11px] text-center text-on-surface-variant leading-normal pt-1">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary font-medium underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary font-medium underline">
              Privacy Policy
            </Link>.
          </p>
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

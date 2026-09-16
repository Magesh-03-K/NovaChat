import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../services/api.js'
import { logout } from '../services/supabase.js'
import { useAuthStore } from '../store/authStore.js'
import NovaLogo from '../components/Shared/NovaLogo.jsx'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [username, setUsername] = useState('')
  const [about, setAbout] = useState('')
  const [isDnd, setIsDnd] = useState(false)
  const [file, setFile] = useState(null)

  // Local settings preferences
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('novachat_sound') !== 'false'
  })
  const [messagePreviews, setMessagePreviews] = useState(() => {
    return localStorage.getItem('novachat_previews') !== 'false'
  })
  const [showOnlineStatus, setShowOnlineStatus] = useState(() => {
    return localStorage.getItem('novachat_online_visibility') !== 'false'
  })
  const [readReceipts, setReadReceipts] = useState(() => {
    return localStorage.getItem('novachat_read_receipts') !== 'false'
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const clearSession = useAuthStore((s) => s.clearSession)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    api
      .get('/auth/me')
      .then(({ data }) => {
        const p = data || { username: 'user', about: '', is_dnd: false }
        setProfile(p)
        setUsername(p.username || '')
        setAbout(p.about || '')
        setIsDnd(Boolean(p.is_dnd))
      })
      .catch((err) => {
        const fallback = { username: 'user', about: '', is_dnd: false }
        setProfile(fallback)
        setUsername('user')
        setAbout('')
        setIsDnd(false)
        setError(err.response?.data?.detail || err.message || 'Could not fetch live profile from server')
      })
      .finally(() => setLoading(false))
  }, [])


  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      let profile_photo_url = profile?.profile_photo_url
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        const { data } = await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        profile_photo_url = data.url
      }

      const { data } = await api.put('/users/me', {
        username: username.trim(),
        profile_photo_url,
        about: about.trim(),
        is_dnd: isDnd,
      })

      setProfile(data)
      setUsername(data.username || username)
      setAbout(data.about || about)
      setIsDnd(Boolean(data.is_dnd))

      // Persist local settings
      localStorage.setItem('novachat_sound', soundEnabled)
      localStorage.setItem('novachat_previews', messagePreviews)
      localStorage.setItem('novachat_online_visibility', showOnlineStatus)
      localStorage.setItem('novachat_read_receipts', readReceipts)

      setSuccess('Profile & settings saved successfully!')
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    clearSession()
    navigate('/login')
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased overflow-y-auto">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-sm border-b border-surface-container">
        <div className="h-16 px-space-base flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => navigate('/chats')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface transition-colors"
              title="Back to chats"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <NovaLogo size={32} />
            <h1 className="font-title-sm text-title-sm text-on-surface tracking-tight font-semibold ml-1">
              Settings & Profile
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-20 pb-36 px-space-base flex flex-col gap-space-md overflow-y-auto">

        {error && (
          <div className="p-4 bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20 rounded-2xl text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 bg-primary-container/10 text-primary border border-primary-container/20 rounded-2xl text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {loading ? (
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-surface-container-low flex flex-col items-center gap-3 py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-body-md text-on-surface-variant font-medium">Loading profile...</p>
          </div>
        ) : profile ? (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Profile Avatar Card */}
            <div className="bg-surface-container-lowest p-space-base rounded-2xl shadow-sm border border-surface-container-low flex flex-col items-center gap-3">
              <div className="relative w-24 h-24 rounded-full bg-primary-container/15 text-primary flex items-center justify-center font-bold text-3xl shadow-inner">
                {file ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Avatar preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : profile.profile_photo_url ? (
                  <img
                    src={profile.profile_photo_url}
                    alt="Profile photo"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  (username?.[0] || profile.username?.[0] || '?').toUpperCase()
                )}

                {/* Status Indicator Badge */}
                {isDnd ? (
                  <span
                    className="absolute bottom-0 right-0 w-6 h-6 bg-amber-500 text-white rounded-full ring-2 ring-surface-container-lowest flex items-center justify-center"
                    title="Do Not Disturb active"
                  >
                    <span className="material-symbols-outlined text-[14px]">do_not_disturb_on</span>
                  </span>
                ) : (
                  <span
                    className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-online rounded-full ring-2 ring-surface-container-lowest"
                    title="Online"
                  ></span>
                )}
              </div>

              <div className="text-center">
                <p className="font-title-sm text-title-sm text-on-surface font-semibold">
                  @{username || profile.username}
                </p>
                {profile.email && (
                  <p className="text-label-sm text-on-surface-variant mt-0.5">{profile.email}</p>
                )}
              </div>

              <label className="cursor-pointer bg-surface-container text-primary font-label-md text-label-md px-4 py-1.5 rounded-full font-semibold hover:bg-surface-container-high transition-all flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                <span>Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </div>

            {/* Profile Info Details Card */}
            <div className="bg-surface-container-lowest p-space-base rounded-2xl shadow-sm border border-surface-container-low space-y-4">
              <h2 className="font-title-sm text-title-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                <span>Account Information</span>
              </h2>

              {/* Username Input */}
              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
                  Username
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-on-surface-variant font-medium select-none text-body-md">
                    @
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-12 bg-surface-container-low border border-surface-container text-on-surface rounded-xl pl-8 pr-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                    placeholder="username"
                    required
                  />
                </div>
                <p className="text-micro-timestamp text-on-surface-variant mt-1 ml-1">
                  Unique handle used by contacts to find you
                </p>
              </div>

              {/* About / Status Input */}
              <div>
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
                  About / Status
                </label>
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full h-12 bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  placeholder="Hey there! I'm using NovaChat"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full h-11 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>{saving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            </div>


            {/* App Settings Card */}
            <div className="bg-surface-container-lowest p-space-base rounded-2xl shadow-sm border border-surface-container-low space-y-5">
              <h2 className="font-title-sm text-title-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                <span>Preferences & Privacy</span>
              </h2>

              {/* Do Not Disturb Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-surface-container/60">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isDnd
                        ? 'bg-amber-500/15 text-amber-600 font-bold'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isDnd ? 'do_not_disturb_on' : 'notifications'}
                    </span>
                  </div>
                  <div>
                    <p className="font-title-sm text-body-md font-semibold text-on-surface">
                      Do Not Disturb
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {isDnd
                        ? 'Active — alerts & sounds muted'
                        : 'Mute notification sounds & banners'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDnd(!isDnd)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                    isDnd ? 'bg-amber-500' : 'bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                      isDnd ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Notification & Privacy Toggles List */}
              <div className="space-y-3 pt-1">
                {/* Sound Effects */}
                <div className="flex items-center justify-between py-2 border-b border-surface-container/40">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      volume_up
                    </span>
                    <div>
                      <p className="text-body-md font-medium text-on-surface">Sound Effects</p>
                      <p className="text-micro-timestamp text-on-surface-variant">
                        Play sound on new messages
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      soundEnabled ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Message Previews */}
                <div className="flex items-center justify-between py-2 border-b border-surface-container/40">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      visibility
                    </span>
                    <div>
                      <p className="text-body-md font-medium text-on-surface">Message Previews</p>
                      <p className="text-micro-timestamp text-on-surface-variant">
                        Show text snippet in notifications
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMessagePreviews(!messagePreviews)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      messagePreviews ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        messagePreviews ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Online Status */}
                <div className="flex items-center justify-between py-2 border-b border-surface-container/40">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      sensors
                    </span>
                    <div>
                      <p className="text-body-md font-medium text-on-surface">Show Online Status</p>
                      <p className="text-micro-timestamp text-on-surface-variant">
                        Let contacts see when you are active
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showOnlineStatus ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Read Receipts */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      done_all
                    </span>
                    <div>
                      <p className="text-body-md font-medium text-on-surface">Read Receipts</p>
                      <p className="text-micro-timestamp text-on-surface-variant">
                        Show blue checkmarks when messages are read
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReadReceipts(!readReceipts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      readReceipts ? 'bg-primary' : 'bg-surface-container-high'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        readReceipts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="w-full h-12 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary font-title-sm text-title-sm font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>
        ) : null}

        {/* Account Actions Card */}
        <div className="bg-surface-container-lowest p-space-base rounded-2xl shadow-sm border border-surface-container-low">
          <button
            onClick={handleLogout}
            className="w-full h-11 rounded-xl bg-tertiary-container/10 text-tertiary-container font-label-md text-label-md font-semibold hover:bg-tertiary-container hover:text-on-tertiary active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Log Out</span>
          </button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-md border-t border-surface-container">
        <div className="h-16 px-space-base flex items-center justify-around">
          <Link
            to="/chats"
            className="flex flex-col items-center justify-center min-w-[56px] h-12 text-on-surface-variant hover:text-on-surface transition-all gap-space-2xs"
          >
            <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
            <span className="font-label-sm text-label-sm">Chats</span>
          </Link>
          <Link
            to="/contacts"
            className="flex flex-col items-center justify-center min-w-[56px] h-12 text-on-surface-variant hover:text-on-surface transition-all gap-space-2xs"
          >
            <span className="material-symbols-outlined text-[24px]">group</span>
            <span className="font-label-sm text-label-sm">Contacts</span>
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center min-w-[56px] h-12 text-primary font-body-md-medium gap-space-2xs"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
            <span className="font-label-sm text-label-sm font-semibold">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

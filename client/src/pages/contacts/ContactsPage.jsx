import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import NovaLogo from '../../components/Shared/NovaLogo.jsx'

export default function ContactsPage() {
  const [contacts, setContacts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  const loadContacts = async () => {
    try {
      const { data } = await api.get('/contacts')
      setContacts(data)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Could not load contacts')
    }
  }

  useEffect(() => {
    loadContacts()
  }, [])

  // Live database search effect
  useEffect(() => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const { data } = await api.get(`/users/search/username?q=${encodeURIComponent(query)}`)
        setSearchResults(data || [])
      } catch (err) {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleManualSearchSubmit = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const query = searchQuery.trim().replace(/^@/, '')
      const { data } = await api.get(`/users/search/username?q=${encodeURIComponent(query)}`)
      if (data && data.length > 0) {
        // Pick exact match or first result for confirmation modal
        const exact = data.find((u) => u.username.toLowerCase() === query.toLowerCase()) || data[0]
        setSelectedUser(exact)
      } else {
        // Fallback user object if DB search returns empty
        setSelectedUser({ username: query })
      }
    } catch (err) {
      setSelectedUser({ username: searchQuery.trim().replace(/^@/, '') })
    } finally {
      setLoading(false)
    }
  }

  const confirmAddContact = async () => {
    if (!selectedUser) return
    setAdding(true)
    setError('')
    setSuccess('')
    try {
      await api.post('/contacts', { username: selectedUser.username })
      const targetUser = selectedUser
      setSuccess(`Added @${targetUser.username}! Opening chat...`)
      setSelectedUser(null)
      setSearchQuery('')
      setSearchResults([])
      await loadContacts()

      try {
        if (targetUser.id) {
          const { data: chatData } = await api.post('/chats', { type: 'direct', member_ids: [targetUser.id] })
          if (chatData?.id) {
            setTimeout(() => navigate(`/chats/${chatData.id}`), 600)
            return
          }
        }
      } catch (e) {
        // fallback to /chats list
      }
      setTimeout(() => navigate('/chats'), 600)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'User not found or already in contacts')
      setSelectedUser(null)
    } finally {
      setAdding(false)
    }
  }

  const handleStartChat = async (contactId) => {
    try {
      const { data } = await api.post('/chats', { type: 'direct', member_ids: [contactId] })
      navigate(`/chats/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Could not start chat')
    }
  }

  const isAlreadyContact = (userId, username) => {
    return contacts.some(
      (c) => c.id === userId || c.username?.toLowerCase() === username?.toLowerCase()
    )
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased">
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
              Contacts
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-20 pb-36 px-space-base flex flex-col gap-space-md overflow-y-auto">
        {/* Search Card */}
        <div className="bg-surface-container-lowest p-space-base rounded-2xl shadow-sm border border-surface-container-low space-y-3">
          <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
            Search Registered Users
          </label>
          <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3.5 text-on-surface-variant font-medium select-none text-body-md">
                @
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username (e.g. magesh)"
                className="w-full h-11 bg-surface-container-low border border-surface-container text-on-surface rounded-xl pl-8 pr-4 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                  className="absolute right-3 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-semibold shadow-md active:scale-95 transition-transform disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </form>

          {/* Live Search Results List */}
          {searchQuery.trim().length >= 2 && (
            <div className="mt-3 pt-3 border-t border-surface-container space-y-2">
              <div className="flex items-center justify-between text-label-sm text-on-surface-variant font-semibold">
                <span>Database Search Results</span>
                {isSearching && (
                  <span className="flex items-center gap-1 text-primary">
                    <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    Searching...
                  </span>
                )}
              </div>

              {!isSearching && searchResults.length === 0 && (
                <p className="py-3 text-center text-on-surface-variant text-sm font-medium">
                  No registered users matching &quot;{searchQuery}&quot;
                </p>
              )}

              <div className="divide-y divide-surface-container/60 max-h-60 overflow-y-auto">
                {searchResults.map((user) => {
                  const already = isAlreadyContact(user.id, user.username)
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2.5 px-2 hover:bg-surface-container-low rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-primary-container/15 text-primary flex items-center justify-center font-bold text-sm shadow-inner">
                          {user.profile_photo_url ? (
                            <img
                              src={user.profile_photo_url}
                              alt={`${user.username}'s profile photo`}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            user.username?.[0]?.toUpperCase()
                          )}
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-surface-container-lowest ${
                              user.is_online ? 'bg-emerald-online' : 'bg-surface-container-high'
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-title-sm text-body-md text-on-surface font-semibold">
                            @{user.username}
                          </p>
                          {user.about && (
                            <p className="text-micro-timestamp text-on-surface-variant line-clamp-1">
                              {user.about}
                            </p>
                          )}
                        </div>
                      </div>

                      {already ? (
                        <span className="text-label-sm bg-surface-container text-on-surface-variant font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          Added
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="h-8 px-3.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[16px]">person_add</span>
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
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

        {/* Contacts List */}
        <section className="bg-surface-container-lowest p-space-base rounded-2xl shadow-sm border border-surface-container-low space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-title-sm text-title-sm text-on-surface font-semibold">
              Your Contacts
            </span>
            <span className="bg-surface-container-highest text-primary font-label-md text-label-md px-2.5 py-0.5 rounded-full font-semibold">
              {contacts.length}
            </span>
          </div>

          {contacts.length === 0 && (
            <p className="py-8 text-center text-on-surface-variant text-sm font-medium">
              No contacts added yet. Search for users by username above!
            </p>
          )}

          <div className="divide-y divide-surface-container">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-11 h-11 rounded-full bg-primary-container/15 text-primary flex items-center justify-center font-bold text-base shadow-inner">
                    {c.profile_photo_url ? (
                      <img
                        src={c.profile_photo_url}
                        alt={`${c.username}'s profile photo`}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      c.username?.[0]?.toUpperCase()
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ring-2 ring-surface-container-lowest ${
                        c.is_online ? 'bg-emerald-online' : 'bg-surface-container-high'
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">
                      @{c.username}
                    </p>
                    {c.about && (
                      <p className="text-micro-timestamp text-on-surface-variant line-clamp-1">
                        {c.about}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleStartChat(c.id)}
                  className="h-9 px-4 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold hover:bg-primary hover:text-on-primary active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Message</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Confirmation Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center gap-4 animate-scale-up">
            <div className="w-20 h-20 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold text-2xl shadow-inner relative">
              {selectedUser.profile_photo_url ? (
                <img
                  src={selectedUser.profile_photo_url}
                  alt={`${selectedUser.username}'s profile photo`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                (selectedUser.username?.[0] || '?').toUpperCase()
              )}
              {selectedUser.is_online && (
                <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-online rounded-full ring-2 ring-surface-container-lowest" />
              )}
            </div>

            <div>
              <h3 className="font-title-sm text-headline-sm text-on-surface font-bold">
                Add @{selectedUser.username}?
              </h3>
              <p className="text-body-md text-on-surface-variant mt-1">
                {selectedUser.about || "Hey there! I'm using NovaChat"}
              </p>
            </div>

            <p className="text-label-sm text-on-surface-variant bg-surface-container-low p-3 rounded-xl w-full border border-surface-container">
              Would you like to add <strong className="text-on-surface">@{selectedUser.username}</strong> to your contacts list?
            </p>

            {/* Modal Actions */}
            <div className="flex gap-3 w-full pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                disabled={adding}
                className="flex-1 h-11 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAddContact}
                disabled={adding}
                className="flex-1 h-11 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary font-label-md text-label-md font-semibold hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
              >
                {adding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Add Friend</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="flex flex-col items-center justify-center min-w-[56px] h-12 text-primary font-body-md-medium gap-space-2xs"
          >
            <span className="material-symbols-outlined text-[24px]">group</span>
            <span className="font-label-sm text-label-sm font-semibold">Contacts</span>
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center justify-center min-w-[56px] h-12 text-on-surface-variant hover:text-on-surface transition-all gap-space-2xs"
          >
            <span className="material-symbols-outlined text-[24px]">settings</span>
            <span className="font-label-sm text-label-sm">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}


import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import { useChatStore } from '../../store/chatStore.js'
import { useAuthStore } from '../../store/authStore.js'
import { usePresence } from '../../hooks/usePresence.js'
import { usePushNotifications } from '../../hooks/usePushNotifications.js'
import NovaLogo from '../../components/Shared/NovaLogo.jsx'

export default function ChatListPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFilter, setCurrentFilter] = useState('all') // 'all' | 'unread' | 'groups'
  const [toastMessage, setToastMessage] = useState('')
  const [contacts, setContacts] = useState([])

  const chats = useChatStore((s) => s.chats)
  const setChats = useChatStore((s) => s.setChats)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { onlineUserIds } = usePresence()
  usePushNotifications()

  useEffect(() => {
    let cancelled = false

    async function load(isSilent = false) {
      if (!isSilent) setLoading(true)
      try {
        const [chatRes, contactRes] = await Promise.all([
          api.get('/chats'),
          api.get('/contacts'),
        ])
        if (!cancelled) {
          setChats(chatRes.data || [])
          setContacts(contactRes.data || [])
          setError('')
        }
      } catch (err) {
        if (!cancelled && !isSilent) {
          setError(err.message || 'Could not load chats')
        }
      } finally {
        if (!cancelled && !isSilent) setLoading(false)
      }
    }

    load()

    // 10-second live sync interval for backup sync (realtime events update live)
    const interval = setInterval(() => {
      load(true)
    }, 10000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [setChats])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2500)
  }

  // Gather unique OTHER users (from direct chats + contacts) for the top "ONLINE NOW" reel
  const currentUserId = user?.id
  const currentEmail = user?.email?.toLowerCase()

  const isSelfUser = (u) => {
    if (!u) return true
    if (u.id && currentUserId && u.id === currentUserId) return true
    if (u.email && currentEmail && u.email.toLowerCase() === currentEmail) return true
    return false
  }

  const allReelUsers = []
  const seenReelIds = new Set()
  if (currentUserId) {
    seenReelIds.add(currentUserId)
  }

  chats.forEach((chat) => {
    if (
      chat.type === 'direct' &&
      chat.peer_user &&
      !isSelfUser(chat.peer_user) &&
      !seenReelIds.has(chat.peer_user.id)
    ) {
      seenReelIds.add(chat.peer_user.id)
      allReelUsers.push(chat.peer_user)
    }
  })

  contacts.forEach((c) => {
    if (c && c.id && !isSelfUser(c) && !seenReelIds.has(c.id)) {
      seenReelIds.add(c.id)
      allReelUsers.push(c)
    }
  })

  const totalUnreadCount = chats.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  const filteredChats = chats.filter((chat) => {
    const isDirect = chat.type === 'direct'
    if (isDirect) {
      if (!chat.peer_user || isSelfUser(chat.peer_user)) {
        return false
      }
    }
    const peerName = chat.peer_user?.username || ''
    const name = (chat.name || (isDirect && peerName ? `@${peerName}` : 'Direct Chat')).toLowerCase()
    const lastMsg = chat.last_message?.content || ''
    const q = searchQuery.toLowerCase()

    const matchesSearch =
      name.includes(q) ||
      peerName.toLowerCase().includes(q) ||
      lastMsg.toLowerCase().includes(q)

    if (!matchesSearch) return false
    if (currentFilter === 'groups') return chat.type === 'group'
    if (currentFilter === 'unread') return (chat.unread_count || 0) > 0
    return true
  })

  const displayChats = []
  const seenPeerIds = new Set()
  for (const chat of filteredChats) {
    if (chat.type === 'direct') {
      const pid = chat.peer_user?.id
      if (!pid || seenPeerIds.has(pid)) continue
      seenPeerIds.add(pid)
    }
    displayChats.push(chat)
  }


  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col antialiased">
      {/* Top Fixed Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-sm border-b border-surface-container">
        <div className="h-16 px-space-base flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <NovaLogo size={32} />
            <h1 className="font-title-sm text-title-sm text-on-surface tracking-tight font-semibold ml-1">
              Chats
            </h1>
          </div>
          <div className="flex items-center gap-space-xs">
            <Link
              to="/contacts"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
              title="Add Contact / Search Users"
            >
              <span className="material-symbols-outlined">person_add</span>
            </Link>
            <Link to="/profile" className="relative ml-1">
              <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.email?.[0]?.toUpperCase() || 'N'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-online rounded-full ring-2 ring-surface-container-lowest"></span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Feed */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 bg-surface">
        <div className="flex flex-col w-full relative">
          {/* Sub-header Context Bar */}
          <div className="px-space-base pt-space-xs pb-space-sm flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Messages
              </span>
              {totalUnreadCount > 0 ? (
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-label-md text-label-md px-3 py-0.5 rounded-full font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)] flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>{totalUnreadCount} Green Pop</span>
                </span>
              ) : (
                <span className="bg-surface-container-highest text-primary font-label-md text-label-md px-2.5 py-0.5 rounded-full font-semibold">
                  {chats.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-space-xs">
              <button
                onClick={() => navigate('/groups/new')}
                aria-label="Create group conversation"
                className="h-9 px-3.5 rounded-full bg-primary text-on-primary font-label-md text-label-md flex items-center gap-1.5 shadow-md active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">group_add</span>
                <span>New Group</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="px-space-base mb-space-md">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats, contacts..."
                className="w-full h-11 pl-10 pr-10 rounded-full bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-md text-body-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                </button>
              )}
            </div>

            {/* Quick Action Filter Chips */}
            <div className="flex items-center gap-space-xs mt-space-sm overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setCurrentFilter('all')}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap active:scale-95 transition-all ${
                  currentFilter === 'all'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant shadow-sm'
                }`}
              >
                All Chats ({chats.length})
              </button>
              <button
                onClick={() => setCurrentFilter('unread')}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 ${
                  currentFilter === 'unread'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-md shadow-emerald-500/30'
                    : 'bg-surface-container-lowest text-on-surface-variant shadow-sm'
                }`}
              >
                <span>Unread</span>
                {totalUnreadCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-white text-emerald-700 font-extrabold text-[11px] flex items-center justify-center shadow-inner">
                    {totalUnreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCurrentFilter('groups')}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap active:scale-95 transition-all ${
                  currentFilter === 'groups'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-lowest text-on-surface-variant shadow-sm'
                }`}
              >
                Groups
              </button>
            </div>
          </div>

          {/* "ONLINE NOW" Vibrant Presence Reel (No Duplicate Self Users) */}
          <section className="mb-space-md">
            <div className="px-space-base mb-space-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-online shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                  Online Now
                </span>
              </div>
              <span className="font-micro-timestamp text-micro-timestamp text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {allReelUsers.filter(u => onlineUserIds.includes(u.id) || u.is_online).length + 1} Active
              </span>
            </div>

            <div className="flex items-center gap-space-md overflow-x-auto px-space-base pb-space-xs pt-1 no-scrollbar">
              {/* Current User Story (You) */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="relative w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-emerald-400 via-green-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-primary-container text-on-primary font-bold flex items-center justify-center text-lg">
                    {user?.email?.[0]?.toUpperCase() || 'Y'}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-online rounded-full ring-2 ring-surface-container-lowest shadow-[0_0_6px_rgba(16,185,129,0.9)]"></span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate max-w-[60px]">
                  You
                </span>
              </div>

              {/* Other Unique Contacts & Chat Peers */}
              {allReelUsers.map((c) => {
                const isOnline = onlineUserIds.includes(c.id) || c.is_online
                return (
                  <button
                    key={c.id}
                    onClick={async () => {
                      const { data } = await api.post('/chats', {
                        type: 'direct',
                        member_ids: [c.id],
                      })
                      navigate(`/chats/${data.id}`)
                    }}
                    className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-transform"
                  >
                    <div
                      className={`relative w-14 h-14 rounded-full p-[2.5px] transition-all duration-300 ${
                        isOnline
                          ? 'bg-gradient-to-tr from-emerald-400 via-green-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse'
                          : 'bg-surface-container-high'
                      }`}
                    >
                      <div className="w-full h-full rounded-full bg-surface-container text-primary font-bold flex items-center justify-center text-base overflow-hidden">
                        {c.profile_photo_url ? (
                          <img
                            src={c.profile_photo_url}
                            alt={c.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          c.username?.[0]?.toUpperCase()
                        )}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-online rounded-full ring-2 ring-surface-container-lowest shadow-[0_0_6px_rgba(16,185,129,0.9)]"></span>
                      )}
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface font-medium truncate max-w-[64px]">
                      @{c.username}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Chat List Feed */}
          <section className="flex flex-col px-space-base">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
                Conversations
              </span>
              <span className="font-micro-timestamp text-micro-timestamp text-outline">
                Tap conversation to open
              </span>
            </div>

            {loading && (
              <div className="py-12 flex flex-col items-center justify-center text-on-surface-variant gap-3">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Loading your conversations...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium mb-4">
                {error}
              </div>
            )}

            {!loading && displayChats.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center bg-surface-container-lowest p-6 rounded-3xl border border-surface-container-low shadow-sm">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[32px]">chat_bubble_outline</span>
                </div>
                <h3 className="font-title-sm text-title-sm text-on-surface font-semibold mb-1">
                  {currentFilter === 'unread' ? 'No unread messages!' : 'No active conversations yet'}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-[260px] mb-4">
                  {currentFilter === 'unread'
                    ? 'You are all caught up on your chats!'
                    : 'Search for registered users or add contacts to start messaging!'}
                </p>
                <button
                  onClick={() => navigate('/contacts')}
                  className="h-11 px-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-label-md text-label-md font-semibold shadow-md shadow-emerald-600/30 active:scale-95 transition-transform flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  <span>Search & Add User</span>
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {displayChats.map((chat) => {
                const isDirect = chat.type === 'direct'
                const peerUser = chat.peer_user
                const title = isDirect && peerUser?.username
                  ? `@${peerUser.username}`
                  : (chat.name || (chat.type === 'group' ? 'Group Chat' : 'Direct Chat'))
                
                const isOnline = isDirect && peerUser ? (onlineUserIds.includes(peerUser.id) || peerUser.is_online) : false
                const lastMsg = chat.last_message
                const unreadCount = chat.unread_count || 0
                const hasUnread = unreadCount > 0

                const timeStr = lastMsg?.created_at
                  ? new Date(lastMsg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''

                return (
                  <div
                    key={chat.id}
                    onClick={() => navigate(`/chats/${chat.id}`)}
                    className={`rounded-2xl transition-all duration-200 cursor-pointer select-none px-4 py-3.5 flex items-center gap-3.5 shadow-sm border ${
                      hasUnread
                        ? 'bg-gradient-to-r from-emerald-500/10 via-surface-container-lowest to-surface-container-lowest border-2 border-emerald-500/50 shadow-emerald-500/15'
                        : 'bg-surface-container-lowest border-surface-container-low hover:border-surface-container hover:shadow-md'
                    }`}
                  >
                    {/* Avatar with Green Pop Online Ring */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-13 h-13 rounded-full p-[2px] flex items-center justify-center shadow-inner ${
                        isOnline ? 'bg-gradient-to-tr from-emerald-400 to-teal-400' : 'bg-primary-container/20'
                      }`}>
                        <div className="w-full h-full rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-title-sm text-title-sm font-bold overflow-hidden">
                          {isDirect && peerUser?.profile_photo_url ? (
                            <img
                              src={peerUser.profile_photo_url}
                              alt={peerUser.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            (isDirect && peerUser?.username ? peerUser.username[0] : title[0])?.toUpperCase()
                          )}
                        </div>
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-online rounded-full ring-2 ring-surface-container-lowest shadow-[0_0_6px_rgba(16,185,129,0.9)] animate-pulse"></span>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {hasUnread && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse flex-shrink-0"></span>
                          )}
                          <span className={`font-title-sm text-title-sm truncate ${
                            hasUnread ? 'font-bold text-on-surface' : 'font-semibold text-on-surface'
                          }`}>
                            {title}
                          </span>
                        </div>

                        <span className={`font-micro-timestamp text-micro-timestamp ${
                          hasUnread ? 'text-emerald-600 font-bold' : 'text-on-surface-variant font-medium'
                        }`}>
                          {timeStr}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-body-md text-body-md truncate ${
                          hasUnread ? 'font-bold text-on-surface' : 'text-on-surface-variant'
                        }`}>
                          {lastMsg
                            ? lastMsg.deleted_for_everyone
                              ? (lastMsg.sender_id === currentUserId ? '🚫 You deleted this message' : '🚫 This message was deleted')
                              : lastMsg.message_type === 'text'
                              ? lastMsg.content
                              : `[${lastMsg.message_type}]`
                            : isDirect && peerUser?.about
                            ? peerUser.about
                            : 'No messages yet — tap to start chat!'}
                        </p>

                        {/* Green Pop Unread Badge Counter */}
                        {hasUnread && (
                          <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-extrabold text-xs shadow-[0_0_10px_rgba(16,185,129,0.6)] animate-pulse flex items-center justify-center min-w-[22px] border border-emerald-300/40">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => navigate('/contacts')}
          aria-label="New Message"
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-600 to-primary text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-90 transition-all duration-150"
        >
          <span className="material-symbols-outlined text-[26px]">edit_square</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-full font-label-md text-label-md shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface/90 backdrop-blur-xl shadow-md border-t border-surface-container">
        <div className="h-16 px-space-base flex items-center justify-around">
          <Link
            to="/chats"
            className="flex flex-col items-center justify-center min-w-[56px] h-12 text-primary font-body-md-medium gap-space-2xs relative"
          >
            <span className="material-symbols-outlined text-[24px]">chat_bubble</span>
            <span className="font-label-sm text-label-sm font-semibold">Chats</span>
            {totalUnreadCount > 0 && (
              <span className="absolute top-1 right-3 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
            )}
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

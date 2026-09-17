import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import { supabase } from '../../services/supabase.js'
import { useAuthStore } from '../../store/authStore.js'
import { compressImage } from '../../utils/imageCompressor.js'

export default function ChatThreadPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [chatInfo, setChatInfo] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAttachDrawer, setShowAttachDrawer] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // 3-dots Top Menu & Multi-Select Messages state
  const [showTopMenu, setShowTopMenu] = useState(false)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  // Action Menu State (Context menu per message)
  const [activeMenuMsgId, setActiveMenuMsgId] = useState(null)

  // Reply State
  const [replyingToMsg, setReplyingToMsg] = useState(null)

  // Confirmation Modal Dialog State
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    deleteType: 'me', // 'me' | 'everyone'
    messageIds: [],
    title: '',
    description: '',
  })

  // Toast feedback state
  const [toast, setToast] = useState('')

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Local storage deleted messages helper
  const getDeletedIds = () => {
    try {
      return JSON.parse(localStorage.getItem(`novachat_deleted_${chatId}`) || '[]')
    } catch {
      return []
    }
  }

  const filterDeleted = (msgs) => {
    const deleted = getDeletedIds()
    if (!deleted.length) return msgs
    const deletedSet = new Set(deleted)
    return msgs.filter((m) => !deletedSet.has(m.id))
  }

  const visibleMessages = filterDeleted(messages)

  // Auto mark unread messages as delivered and read in a single batch request
  const processReceipts = (msgs) => {
    if (!msgs || !msgs.length) return
    const hasUnread = msgs.some(
      (m) => m.sender_id !== currentUserId && (!m.delivered_at || !m.read_at)
    )
    if (hasUnread) {
      api.post(`/chats/${chatId}/read-all`).catch(() => {})
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [chatRes, msgRes] = await Promise.all([
          api.get(`/chats/${chatId}`),
          api.get(`/chats/${chatId}/messages`),
        ])
        if (!cancelled) {
          setChatInfo(chatRes.data)
          setMessages(msgRes.data || [])
          processReceipts(msgRes.data || [])
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load conversation')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()

    // 10s polling backup (realtime WebSocket handles instantaneous updates)
    const pollInterval = setInterval(async () => {
      try {
        const msgRes = await api.get(`/chats/${chatId}/messages`)
        if (!cancelled && msgRes.data) {
          setMessages((prev) => {
            const prevIds = prev.map((m) => m.id).join(',')
            const newIds = msgRes.data.map((m) => m.id).join(',')
            if (prevIds === newIds) return prev
            processReceipts(msgRes.data)
            return msgRes.data
          })
        }
      } catch (e) {
        // silent catch
      }
    }, 10000)

    // Realtime channel subscription for messages and deletions
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id)
            if (exists) return prev
            const updated = [...prev, payload.new]
            processReceipts([payload.new])
            return updated
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'message_deletions', filter: `user_id=eq.${currentUserId}` },
        (payload) => {
          if (payload.new?.message_id) {
            setMessages((prev) => prev.filter((m) => m.id !== payload.new.message_id))
          }
        }
      )
      .subscribe()

    return () => {
      cancelled = true
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [chatId, currentUserId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [visibleMessages.length])

  const handleSendText = async (textToSend) => {
    let content = textToSend || draft
    if (!content.trim()) return

    if (replyingToMsg) {
      const replyContent = replyingToMsg.deleted_for_everyone
        ? 'This message was deleted'
        : (replyingToMsg.content || `[${replyingToMsg.message_type}]`)
      content = `↪ ${replyContent}\n${content}`
    }

    if (!textToSend) setDraft('')
    setReplyingToMsg(null)

    try {
      const { data } = await api.post(`/chats/${chatId}/messages`, {
        message_type: 'text',
        content: content.trim(),
      })
      if (data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev
          const next = [...prev, data]
          processReceipts([data])
          return next
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to send message')
    }
  }

  const handleFileUpload = async (e) => {
    let file = e.target.files?.[0]
    if (!file) return
    setShowAttachDrawer(false)
    setUploading(true)

    try {
      if (file.type.startsWith('image/')) {
        file = await compressImage(file, 1600, 0.8)
      }
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      let type = 'document'
      if (file.type.startsWith('image/')) type = 'image'
      else if (file.type.startsWith('video/')) type = 'video'
      else if (file.type.startsWith('audio/')) type = 'voice'

      await api.post(`/chats/${chatId}/messages`, {
        message_type: type,
        media_url: data.url,
        content: file.name,
      })
    } catch (err) {
      setError(err.message || 'Failed to upload file')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      mediaRecorderRef.current = new MediaRecorder(stream)

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' })
        const formData = new FormData()
        formData.append('file', file)

        setUploading(true)
        try {
          const { data } = await api.post('/media/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          await api.post(`/chats/${chatId}/messages`, {
            message_type: 'voice',
            media_url: data.url,
          })
        } catch (err) {
          setError(err.message || 'Failed to send voice note')
        } finally {
          setUploading(false)
        }

        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      setError('Microphone access denied or unsupported')
    }
  }

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const getChatTitle = () => {
    if (!chatInfo) return 'Chat'
    if (chatInfo.name) return chatInfo.name
    const peer = chatInfo.members?.find((m) => m.user_id !== currentUserId)
    return peer?.users?.username ? `@${peer.users.username}` : 'Direct Chat'
  }

  const toggleSelectMessage = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAllMessages = () => {
    if (selectedIds.length === visibleMessages.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(visibleMessages.map((m) => m.id))
    }
  }

  const exitSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedIds([])
  }

  // Handle single message action modal triggers
  const promptDeleteSingle = (msg, deleteType) => {
    setActiveMenuMsgId(null)
    if (deleteType === 'everyone') {
      setConfirmModal({
        open: true,
        deleteType: 'everyone',
        messageIds: [msg.id],
        title: 'Delete message?',
        description: 'This message will be deleted for everyone in this chat.',
      })
    } else {
      setConfirmModal({
        open: true,
        deleteType: 'me',
        messageIds: [msg.id],
        title: 'Delete message?',
        description: 'This message will be removed from your view.',
      })
    }
  }

  // Handle multi-select delete prompt
  const promptDeleteSelected = (deleteType) => {
    if (!selectedIds.length) return
    if (deleteType === 'everyone') {
      setConfirmModal({
        open: true,
        deleteType: 'everyone',
        messageIds: [...selectedIds],
        title: 'Delete messages?',
        description: `${selectedIds.length} message(s) will be deleted for everyone in this chat.`,
      })
    } else {
      setConfirmModal({
        open: true,
        deleteType: 'me',
        messageIds: [...selectedIds],
        title: 'Delete messages?',
        description: `${selectedIds.length} message(s) will be removed from your view.`,
      })
    }
  }

  // Execute deletion after user confirms in dialog
  const executeDelete = async () => {
    const { deleteType, messageIds } = confirmModal
    setConfirmModal({ open: false, deleteType: 'me', messageIds: [], title: '', description: '' })
    if (!messageIds.length) return

    if (deleteType === 'me') {
      // 1. Save to local storage for instant persistent client hiding
      const currentDeleted = getDeletedIds()
      const updatedDeleted = Array.from(new Set([...currentDeleted, ...messageIds]))
      localStorage.setItem(`novachat_deleted_${chatId}`, JSON.stringify(updatedDeleted))

      // 2. Optimistic UI update
      setMessages((prev) => prev.filter((m) => !messageIds.includes(m.id)))
      if (isSelectionMode) exitSelectionMode()

      // 3. Server-side / Database delete-for-me
      try {
        await api.post('/messages/delete', { message_ids: messageIds, delete_type: 'me' })
      } catch (err) {
        showToast("Couldn't delete message. Please try again.")
      }
    } else if (deleteType === 'everyone') {
      // 1. Optimistic UI update to deleted-for-everyone state
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id)
            ? { ...m, deleted_for_everyone: true, content: null, media_url: null }
            : m
        )
      )
      if (isSelectionMode) exitSelectionMode()

      // 2. Server-side / Database delete-for-everyone
      try {
        await api.post('/messages/delete', { message_ids: messageIds, delete_type: 'everyone' })
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || "Couldn't delete message. Please try again."
        showToast(msg)
        // Rollback state by refetching messages
        api.get(`/chats/${chatId}/messages`).then((res) => setMessages(res.data || [])).catch(() => {})
      }
    }
  }

  const handleCopyMessage = (msg) => {
    setActiveMenuMsgId(null)
    const textToCopy = msg.deleted_for_everyone
      ? 'This message was deleted'
      : (msg.content || msg.media_url || '')
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      showToast('Copied to clipboard')
    }
  }

  const handleReplyMessage = (msg) => {
    setActiveMenuMsgId(null)
    setReplyingToMsg(msg)
  }

  const renderTick = (msg) => {
    if (msg.sender_id !== currentUserId || msg.deleted_for_everyone) return null
    if (msg.read_at) {
      return (
        <span
          className="material-symbols-outlined text-[14px] text-surface-bright ml-1"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          done_all
        </span>
      )
    }
    if (msg.delivered_at) {
      return <span className="material-symbols-outlined text-[14px] text-surface-bright/80 ml-1">done_all</span>
    }
    return <span className="material-symbols-outlined text-[14px] text-surface-bright/60 ml-1">check</span>
  }

  // Determine if all selected messages belong to current user
  const allSelectedMine = selectedIds.length > 0 && selectedIds.every((id) => {
    const msg = messages.find((m) => m.id === id)
    return msg && msg.sender_id === currentUserId
  })

  return (
    <div
      className="flex flex-col h-screen bg-surface antialiased relative"
      onClick={() => {
        if (showTopMenu) setShowTopMenu(false)
        if (activeMenuMsgId) setActiveMenuMsgId(null)
      }}
    >
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-sm border-b border-surface-container">
        <div className="h-16 px-space-base flex items-center justify-between">
          <div className="flex items-center gap-space-xs min-w-0">
            <button
              onClick={() => (isSelectionMode ? exitSelectionMode() : navigate('/chats'))}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">
                {isSelectionMode ? 'close' : 'arrow_back'}
              </span>
            </button>
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center font-bold text-sm shrink-0">
              {getChatTitle()[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0 ml-1">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold truncate">
                {isSelectionMode ? `${selectedIds.length} Selected` : getChatTitle()}
              </span>
              <span className="font-label-sm text-label-sm text-emerald-online font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-online animate-pulse"></span>
                {isSelectionMode ? 'Tap messages to select' : 'Active channel'}
              </span>
            </div>
          </div>

          {/* Top Right Options Menu */}
          <div className="flex items-center gap-1 relative" onClick={(e) => e.stopPropagation()}>
            {isSelectionMode ? (
              <button
                onClick={exitSelectionMode}
                className="px-3 py-1.5 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowTopMenu((prev) => !prev)}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-all"
                  title="Options"
                >
                  <span className="material-symbols-outlined text-[22px]">more_vert</span>
                </button>

                {showTopMenu && (
                  <div className="absolute right-0 top-12 w-52 bg-surface-container-lowest border border-surface-container-low rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        setShowTopMenu(false)
                        setIsSelectionMode(true)
                        setSelectedIds([])
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-on-surface text-body-md hover:bg-surface-container-low transition-colors font-medium text-left"
                    >
                      <span className="material-symbols-outlined text-[20px] text-primary">checklist</span>
                      <span>Select Messages</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Messages Stream */}
      <main className="flex-1 overflow-y-auto px-margin-mobile pt-20 pb-40 flex flex-col gap-space-md">
        {loading && (
          <div className="flex flex-col gap-4 py-4 w-full">
            <div className="self-start max-w-[70%] w-48 h-14 rounded-2xl bg-surface-container animate-pulse"></div>
            <div className="self-end max-w-[70%] w-60 h-16 rounded-2xl bg-primary-container/30 animate-pulse"></div>
            <div className="self-start max-w-[70%] w-40 h-12 rounded-2xl bg-surface-container animate-pulse"></div>
            <div className="self-end max-w-[70%] w-52 h-14 rounded-2xl bg-primary-container/30 animate-pulse"></div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {visibleMessages.map((msg) => {
          const isMine = msg.sender_id === currentUserId
          const isSelected = selectedIds.includes(msg.id)
          const isDeletedForEveryone = Boolean(msg.deleted_for_everyone)
          const isMenuOpen = activeMenuMsgId === msg.id

          const dateStr = new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div
              key={msg.id}
              onClick={() => isSelectionMode && toggleSelectMessage(msg.id)}
              className={`flex items-center gap-2 max-w-[90%] transition-all relative ${
                isMine ? 'self-end flex-row-reverse' : 'self-start flex-row'
              } ${isSelectionMode ? 'cursor-pointer select-none' : ''}`}
            >
              {/* Checkbox Icon in Multi-Select Mode */}
              {isSelectionMode && (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/30'
                      : 'border-2 border-outline-variant bg-surface-container-lowest'
                  }`}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                  )}
                </div>
              )}

              <div className={`flex flex-col max-w-full relative ${isMine ? 'items-end' : 'items-start'}`}>
                {/* Context Action Menu Trigger (Dots button next to message bubble on hover/click) */}
                {!isSelectionMode && (
                  <div
                    className={`absolute top-1 z-20 ${
                      isMine ? '-left-8' : '-right-8'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setActiveMenuMsgId(isMenuOpen ? null : msg.id)}
                      className="w-7 h-7 rounded-full bg-surface-container/60 hover:bg-surface-container text-on-surface-variant flex items-center justify-center transition-all opacity-80 hover:opacity-100"
                      title="Message actions"
                    >
                      <span className="material-symbols-outlined text-[16px]">more_vert</span>
                    </button>

                    {/* Popover Action Menu */}
                    {isMenuOpen && (
                      <div
                        className={`absolute top-8 ${
                          isMine ? 'right-0' : 'left-0'
                        } w-48 bg-surface-container-lowest border border-surface-container-low rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150`}
                      >
                        <button
                          onClick={() => handleReplyMessage(msg)}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-on-surface text-label-md hover:bg-surface-container-low font-medium text-left transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px] text-primary">reply</span>
                          <span>Reply</span>
                        </button>

                        <button
                          onClick={() => handleCopyMessage(msg)}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-on-surface text-label-md hover:bg-surface-container-low font-medium text-left transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px] text-secondary">content_copy</span>
                          <span>Copy</span>
                        </button>

                        {/* Delete for Me - available for all messages */}
                        <button
                          onClick={() => promptDeleteSingle(msg, 'me')}
                          className="w-full px-3.5 py-2 flex items-center gap-2.5 text-error text-label-md hover:bg-error-container/20 font-medium text-left transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px] text-error">delete_outline</span>
                          <span>Delete for me</span>
                        </button>

                        {/* Delete for everyone - ONLY available for my messages and if not already deleted */}
                        {isMine && !isDeletedForEveryone && (
                          <button
                            onClick={() => promptDeleteSingle(msg, 'everyone')}
                            className="w-full px-3.5 py-2 flex items-center gap-2.5 text-red-600 font-semibold text-label-md hover:bg-red-50 font-medium text-left transition-colors border-t border-surface-container-low mt-1 pt-2"
                          >
                            <span className="material-symbols-outlined text-[18px] text-red-600">delete_forever</span>
                            <span>Delete for everyone</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Message Card */}
                <div
                  className={`p-space-md shadow-sm flex flex-col gap-1 transition-all ${
                    isSelected ? 'ring-2 ring-primary border-primary/50' : ''
                  } ${
                    isDeletedForEveryone
                      ? 'bg-surface-container-low/70 border border-surface-container text-on-surface-variant italic rounded-[18px]'
                      : isMine
                      ? 'bg-gradient-to-br from-secondary-container to-primary-container text-on-primary rounded-[18px] rounded-tr-[4px]'
                      : 'bg-surface-container-lowest text-on-surface rounded-[18px] rounded-tl-[4px] border border-surface-container-low'
                  }`}
                >
                  {/* Deleted For Everyone Placeholder State */}
                  {isDeletedForEveryone ? (
                    <div className="flex items-center gap-2 py-0.5 select-none">
                      <span className="material-symbols-outlined text-[18px] opacity-70">block</span>
                      <span className="font-body-md text-body-md italic font-medium">
                        {isMine ? '🚫 You deleted this message' : '🚫 This message was deleted'}
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Text Content */}
                      {msg.message_type === 'text' && (
                        <p className="font-body-md text-body-md leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {/* Image Content */}
                      {msg.message_type === 'image' && (
                        <div className="flex flex-col gap-1">
                          <img
                            src={msg.media_url}
                            alt={msg.content || 'Shared image attachment'}
                            className="rounded-xl max-h-60 object-cover shadow-sm cursor-pointer"
                            onClick={(e) => {
                              if (isSelectionMode) return
                              e.stopPropagation()
                              window.open(msg.media_url, '_blank')
                            }}
                          />
                          {msg.content && <p className="font-body-md text-body-md">{msg.content}</p>}
                        </div>
                      )}

                      {/* Video Content */}
                      {msg.message_type === 'video' && (
                        <video src={msg.media_url} controls={!isSelectionMode} className="rounded-xl max-h-60 shadow-sm" />
                      )}

                      {/* Voice Content */}
                      {msg.message_type === 'voice' && (
                        <div className="flex items-center gap-2 py-1">
                          <audio src={msg.media_url} controls={!isSelectionMode} className="h-8 max-w-[200px]" />
                        </div>
                      )}

                      {/* Document Content */}
                      {msg.message_type === 'document' && (
                        <a
                          href={isSelectionMode ? undefined : msg.media_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => isSelectionMode && e.preventDefault()}
                          className="flex items-center gap-2 p-2 bg-surface-container/20 rounded-lg hover:bg-surface-container/40 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[24px]">description</span>
                          <span className="font-label-sm text-label-sm font-semibold truncate max-w-[160px]">
                            {msg.content || 'Document'}
                          </span>
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        </a>
                      )}
                    </>
                  )}

                  {/* Timestamp & Delivery Ticks */}
                  <div
                    className={`flex items-center gap-1 self-end pt-0.5 font-micro-timestamp text-micro-timestamp ${
                      isDeletedForEveryone
                        ? 'text-on-surface-variant/60'
                        : isMine
                        ? 'text-on-primary/80'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    <span>{dateStr}</span>
                    {renderTick(msg)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </main>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Floating Multi-Select Delete Bar */}
      {isSelectionMode && selectedIds.length > 0 ? (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border border-surface-container-low rounded-2xl shadow-2xl p-3 flex items-center justify-between animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-3 pl-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
              {selectedIds.length}
            </div>
            <span className="font-title-sm text-body-md text-on-surface font-semibold">
              {selectedIds.length === 1 ? '1 message selected' : `${selectedIds.length} messages selected`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={selectAllMessages}
              className="px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-all"
            >
              {selectedIds.length === visibleMessages.length ? 'Deselect All' : 'Select All'}
            </button>

            {/* If all selected messages are mine, allow choice for Delete for Everyone */}
            {allSelectedMine ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => promptDeleteSelected('me')}
                  className="px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-all"
                >
                  Delete for me
                </button>
                <button
                  onClick={() => promptDeleteSelected('everyone')}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-label-md text-label-md font-semibold shadow-md shadow-red-500/20 active:scale-95 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>Delete for everyone</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => promptDeleteSelected('me')}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-label-md text-label-md font-semibold shadow-md shadow-red-500/20 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>Delete for me ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Bottom Composer Bar */
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl pb-safe shadow-[0_-4px_20px_rgba(20,20,50,0.06)] border-t border-surface-container-low">
          {/* Reply Banner */}
          {replyingToMsg && (
            <div className="px-margin-mobile py-2 bg-surface-container-low border-b border-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-[18px]">reply</span>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-sm text-label-sm font-semibold text-primary">
                    Replying to {replyingToMsg.sender_id === currentUserId ? 'yourself' : 'message'}
                  </span>
                  <span className="font-body-md text-label-sm text-on-surface-variant truncate">
                    {replyingToMsg.deleted_for_everyone
                      ? '🚫 This message was deleted'
                      : replyingToMsg.content || `[${replyingToMsg.message_type}]`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReplyingToMsg(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          )}

          {/* Quick Suggestion Chips */}
          <div className="flex items-center gap-2 overflow-x-auto px-margin-mobile pt-space-xs pb-1 no-scrollbar">
            <button
              onClick={() => handleSendText('Sounds good! 👍')}
              className="shrink-0 bg-surface-container text-on-surface font-label-sm text-label-sm px-3 py-1.5 rounded-full hover:bg-surface-container-high transition-all active:scale-95"
            >
              Sounds good! 👍
            </button>
            <button
              onClick={() => handleSendText('Checking this out now 🔍')}
              className="shrink-0 bg-surface-container text-on-surface font-label-sm text-label-sm px-3 py-1.5 rounded-full hover:bg-surface-container-high transition-all active:scale-95"
            >
              Checking now 🔍
            </button>
            <button
              onClick={() => handleSendText('Let us call on audio 🎧')}
              className="shrink-0 bg-surface-container text-on-surface font-label-sm text-label-sm px-3 py-1.5 rounded-full hover:bg-surface-container-high transition-all active:scale-95"
            >
              Quick call? 🎧
            </button>
          </div>

          {/* Input Row */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendText()
            }}
            className="p-space-sm flex items-center gap-space-sm"
          >
            <button
              type="button"
              onClick={() => setShowAttachDrawer(true)}
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">add</span>
            </button>

            <div className="flex-1 bg-surface-container-low rounded-full px-4 py-2 flex items-center gap-2 shadow-inner focus-within:bg-surface-container-lowest focus-within:ring-2 focus-within:ring-primary/40 transition-all">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={isRecording ? 'Recording voice note...' : 'Message NovaChat...'}
                disabled={isRecording || uploading}
                className="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md focus:outline-none"
              />
            </div>

            {draft.trim() ? (
              <button
                type="submit"
                disabled={uploading}
                className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-br from-secondary-container to-primary-container text-on-primary flex items-center justify-center shadow-md active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all ${
                  isRecording
                    ? 'bg-tertiary-container text-on-tertiary animate-pulse'
                    : 'bg-gradient-to-br from-secondary-container to-primary-container text-on-primary'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isRecording ? 'stop' : 'mic'}
                </span>
              </button>
            )}
          </form>
        </div>
      )}

      {/* Confirmation Modal Dialog */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-low flex flex-col gap-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">delete</span>
              </div>
              <h3 className="font-title-sm text-title-sm font-bold text-on-surface">
                {confirmModal.title}
              </h3>
            </div>

            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-full bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-label-md text-label-md font-semibold shadow-md shadow-red-500/20 active:scale-95 transition-all"
              >
                {confirmModal.deleteType === 'everyone' ? 'Delete for everyone' : 'Delete for me'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Drawer Modal */}
      {showAttachDrawer && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end"
          onClick={() => setShowAttachDrawer(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-surface-container-lowest rounded-t-2xl p-space-base flex flex-col gap-space-md shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto"></div>
            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">Share Content</span>
              <button
                onClick={() => setShowAttachDrawer(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-space-sm text-center pb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 p-space-sm rounded-xl hover:bg-surface-container active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">image</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface font-medium">Gallery</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5 p-space-sm rounded-xl hover:bg-surface-container active:scale-95 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface font-medium">Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-inverse-surface text-inverse-on-surface px-4 py-2 rounded-full font-label-md text-label-md shadow-xl flex items-center gap-2 animate-in fade-in duration-150">
          <span className="material-symbols-outlined text-emerald-400 text-[18px]">info</span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

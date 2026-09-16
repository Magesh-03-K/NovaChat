import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api.js'
import NovaLogo from '../../components/Shared/NovaLogo.jsx'

export default function NewGroupPage() {
  const [groupName, setGroupName] = useState('')
  const [contacts, setContacts] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/contacts')
      .then(({ data }) => setContacts(data))
      .catch((err) => setError(err.message || 'Could not load contacts'))
      .finally(() => setFetching(false))
  }, [])

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!groupName.trim()) {
      setError('Please provide a group name')
      return
    }
    if (selectedIds.length === 0) {
      setError('Please select at least one contact')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/chats', {
        type: 'group',
        name: groupName.trim(),
        member_ids: selectedIds,
      })
      navigate(`/chats/${data.id}`)
    } catch (err) {
      setError(err.message || 'Could not create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col antialiased">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-sm border-b border-surface-container">
        <div className="h-16 px-space-base flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              onClick={() => navigate('/chats')}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <NovaLogo size={32} />
            <h1 className="font-title-sm text-title-sm text-on-surface font-semibold ml-1">New Group</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-20 pb-12 px-space-base flex flex-col">
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Group Details Card */}
          <div className="bg-surface-container-lowest p-space-base rounded-2xl shadow-sm border border-surface-container-low space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                <span className="material-symbols-outlined text-[28px]">groups</span>
              </div>
              <div className="flex-1">
                <label className="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Design Guild, Project Nova..."
                  className="w-full bg-surface-container-low border border-surface-container text-on-surface rounded-xl px-4 py-2.5 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                  required
                />
              </div>
            </div>
          </div>

          {/* Member Picker Card */}
          <div className="bg-surface-container-lowest p-space-base rounded-2xl shadow-sm border border-surface-container-low space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm text-on-surface font-semibold">Add Members</span>
              <span className="bg-surface-container-highest text-primary font-label-md text-label-md px-2.5 py-0.5 rounded-full font-semibold">
                {selectedIds.length} selected
              </span>
            </div>

            {fetching && <p className="py-4 text-sm text-outline">Loading contacts...</p>}

            {!fetching && contacts.length === 0 && (
              <p className="py-4 text-sm text-outline">No contacts saved yet. Add contacts first from the Contacts tab.</p>
            )}

            <div className="divide-y divide-surface-container">
              {contacts.map((c) => {
                const isSelected = selectedIds.includes(c.id)
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelect(c.id)}
                    className="flex items-center justify-between py-3 cursor-pointer hover:bg-surface-container-low/50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-semibold">
                        {c.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-body-md text-body-md text-on-surface font-medium">@{c.username}</p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-primary text-on-primary'
                          : 'border-2 border-outline-variant'
                      }`}
                    >
                      {isSelected && <span className="material-symbols-outlined text-[16px]">check</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {error && <p className="text-sm text-tertiary-container font-medium px-2">{error}</p>}

          <button
            type="submit"
            disabled={loading || selectedIds.length === 0}
            className="w-full h-12 rounded-full bg-gradient-to-tr from-primary to-primary-container text-on-primary font-title-sm text-title-sm font-semibold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>{loading ? 'Creating Group...' : 'Create Group'}</span>
          </button>
        </form>
      </main>
    </div>
  )
}

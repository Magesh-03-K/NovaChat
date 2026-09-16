import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase.js'
import { useAuthStore } from '../store/authStore.js'

export function usePresence() {
  const user = useAuthStore((s) => s.user)
  const [onlineUserIds, setOnlineUserIds] = useState([])

  useEffect(() => {
    if (!user) return

    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const userIds = Object.keys(state)
        setOnlineUserIds(userIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            online_at: new Date().toISOString(),
            user_id: user.id,
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [user])

  return { onlineUserIds }
}

import { useEffect } from 'react'
import { api } from '../services/api.js'
import { useAuthStore } from '../store/authStore.js'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }

    async function registerPush() {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const { data } = await api.get('/notifications/vapid-key')
        if (!data.public_key) return

        const convertedVapidKey = urlBase64ToUint8Array(data.public_key)
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        })

        await api.post('/notifications/subscribe', subscription.toJSON())
      } catch (err) {
        // Ignored if notifications rejected or blocked in local context
      }
    }

    registerPush()
  }, [user])
}

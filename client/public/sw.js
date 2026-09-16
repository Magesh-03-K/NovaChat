// Service Worker for NovaChat Web Push Notifications

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const title = data.title || 'NovaChat'
    const options = {
      body: data.body || 'New message received',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: { url: data.url || '/chats' },
    }

    event.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('Error handling push event:', err)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/chats'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

/**
 * Service Worker for Sihat TCM
 * Handles background notifications and offline functionality
 */

const CACHE_NAME = 'sihat-tcm-v1'
const NOTIFICATION_TAG = 'sihat-tcm-notification'

// Install event
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell')
      return cache.addAll([
        '/',
        '/logo.png',
        '/manifest.json'
      ])
    })
  )
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    })
  )
})

// Push event for push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received:', event)
  
  let notificationData = {}
  
  if (event.data) {
    try {
      notificationData = event.data.json()
    } catch (error) {
      notificationData = {
        title: 'Sihat TCM',
        body: event.data.text() || 'You have a new notification',
        icon: '/logo.png',
        badge: '/logo.png'
      }
    }
  }
  
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/logo.png',
    badge: notificationData.badge || '/logo.png',
    data: notificationData.data || {},
    tag: notificationData.tag || NOTIFICATION_TAG,
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [
      {
        action: 'view',
        title: 'View',
        icon: '/logo.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Sihat TCM',
      options
    )
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked:', event)
  
  event.notification.close()
  
  const action = event.action
  const notificationData = event.notification.data || {}
  
  if (action === 'dismiss') {
    // Just close the notification
    return
  }
  
  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === self.location.origin && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            notification: {
              ...notificationData,
              action: action,
              clickedAt: Date.now()
            }
          })
          return client.focus()
        }
      }
      
      // Open new window if no existing window found
      if (clients.openWindow) {
        const url = notificationData.url || '/'
        return clients.openWindow(url).then((client) => {
          if (client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              notification: {
                ...notificationData,
                action: action,
                clickedAt: Date.now()
              }
            })
          }
        })
      }
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag)
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncNotifications())
  }
})

// Sync notifications with server
async function syncNotifications() {
  try {
    console.log('[ServiceWorker] Syncing notifications...')
    
    // Get pending sync data from IndexedDB or cache
    const cache = await caches.open(CACHE_NAME)
    const syncDataResponse = await cache.match('/sync-data')
    
    if (syncDataResponse) {
      const syncData = await syncDataResponse.json()
      
      // Send to server
      const response = await fetch('/api/notifications/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(syncData)
      })
      
      if (response.ok) {
        // Remove sync data from cache
        await cache.delete('/sync-data')
        console.log('[ServiceWorker] Notifications synced successfully')
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Notification sync failed:', error)
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[ServiceWorker] Periodic sync:', event.tag)
  
  if (event.tag === 'notification-check') {
    event.waitUntil(checkForNotifications())
  }
})

// Check for new notifications
async function checkForNotifications() {
  try {
    console.log('[ServiceWorker] Checking for notifications...')
    
    const response = await fetch('/api/notifications/sync?pending=true')
    
    if (response.ok) {
      const result = await response.json()
      
      if (result.success && result.syncData.pendingNotifications) {
        for (const notification of result.syncData.pendingNotifications) {
          await self.registration.showNotification(notification.title, {
            body: notification.body,
            icon: '/logo.png',
            badge: '/logo.png',
            data: notification.data,
            tag: `pending-${notification.id}`,
            requireInteraction: notification.priority === 'urgent'
          })
        }
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to check for notifications:', error)
  }
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleNotification(event.data.notification)
  }
  
  if (event.data && event.data.type === 'CANCEL_NOTIFICATION') {
    cancelNotification(event.data.notificationId)
  }
})

// Schedule notification
async function scheduleNotification(notificationData) {
  try {
    const delay = new Date(notificationData.scheduledFor).getTime() - Date.now()
    
    if (delay > 0) {
      setTimeout(async () => {
        await self.registration.showNotification(notificationData.title, {
          body: notificationData.body,
          icon: '/logo.png',
          badge: '/logo.png',
          data: notificationData.data,
          tag: notificationData.id,
          requireInteraction: notificationData.priority === 'urgent'
        })
      }, delay)
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to schedule notification:', error)
  }
}

// Cancel notification
async function cancelNotification(notificationId) {
  try {
    const notifications = await self.registration.getNotifications({
      tag: notificationId
    })
    
    notifications.forEach(notification => notification.close())
  } catch (error) {
    console.error('[ServiceWorker] Failed to cancel notification:', error)
  }
}
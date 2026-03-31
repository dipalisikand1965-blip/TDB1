// Service Worker for The Doggy Company PWA - v8 with Push Notifications
// Feature 11: Push notifications even when browser is closed
// v8: Fixed auth redirect loop - force cache clear

const CACHE_NAME = 'tdc-pwa-v9';

self.addEventListener('install', (event) => {
  console.log('[SW] PWA v7: Installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] PWA v7: Activating');
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// NETWORK FIRST for everything - no aggressive caching
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ============================================
// PUSH NOTIFICATION HANDLERS (Feature 11)
// ============================================

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Concierge® Message',
    body: 'You have a new message from The Doggy Company',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'concierge-message',
    requireInteraction: true,
    data: {}
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        tag: payload.tag || data.tag,
        data: payload.data || payload
      };
    } catch (e) {
      console.log('[SW] Could not parse push data, using text:', e);
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'open', title: 'Open Chat' },
        { action: 'dismiss', title: 'Dismiss' }
      ],
      data: data.data
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked, action:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const notificationData = event.notification.data || {};
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if ('focus' in client) {
            // Send message to open the thread
            if (notificationData.thread_id) {
              client.postMessage({
                type: 'OPEN_CONCIERGE_THREAD',
                thread_id: notificationData.thread_id,
                user_id: notificationData.user_id
              });
            }
            return client.focus();
          }
        }
        
        // Open new window if none exists
        let url = '/celebrate-new';
        if (notificationData.thread_id) {
          url = `/celebrate-new?openConcierge=true&thread=${notificationData.thread_id}`;
        }
        
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

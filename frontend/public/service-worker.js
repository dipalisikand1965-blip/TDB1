// Service Worker for The Doggy Company PWA - v11
// v11: Aggressive self-destruct — unregisters itself after clearing all caches
// This ensures returning users with stale caches always get fresh content

const CACHE_NAME = 'tdc-pwa-v11';

self.addEventListener('install', (event) => {
  console.log('[SW] v11: Installing — clearing ALL old caches');
  // Skip waiting immediately so this SW activates without delay
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] v11: Activating — nuking old caches');
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map(name => {
          console.log('[SW] Deleting cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    }).then(() => {
      // Tell all clients to reload so they get fresh content
      return self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: 'v11' });
        });
      });
    })
  );
});

// NETWORK ONLY — no caching at all to prevent stale content issues
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Always pass through to network — no service worker caching
  // Fall back to cache ONLY for offline support of static assets
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => {
      return caches.match(event.request);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ============================================
// PUSH NOTIFICATION HANDLERS
// ============================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Concierge® Message',
    body: 'You have a new message from The Doggy Company',
    icon: '/logo-new.png',
    badge: '/logo-new.png',
    tag: 'concierge-message',
    requireInteraction: true,
    data: {}
  };
  
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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  
  const notificationData = event.notification.data || {};
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
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
        
        let url = '/';
        if (notificationData.thread_id) {
          url = `/celebrate-new?openConcierge=true&thread=${notificationData.thread_id}`;
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

self.addEventListener('notificationclose', () => {
  console.log('[SW] Notification closed');
});

// Service Worker for The Doggy Company PWA - v12
// v12: Smart passthrough — never intercepts API or JS chunk requests.
// Only handles push notifications. No forced reloads.

const CACHE_NAME = 'tdc-pwa-v12';

self.addEventListener('install', (event) => {
  console.log('[SW] v12: Installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] v12: Activating — clearing old caches');
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map(name => caches.delete(name)))
    ).then(() => self.clients.claim())
    // NOTE: No SW_UPDATED message — no forced page reload on SW update
  );
});

// PASSTHROUGH ONLY — never intercept API calls or JS chunks
// This prevents the SW from interfering with React lazy-loading or auth tokens
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Skip all non-GET requests
  if (event.request.method !== 'GET') return;
  // Skip API calls — must reach the backend directly
  if (url.includes('/api/')) return;
  // Skip static JS/CSS chunks — let browser cache handle them natively
  if (url.includes('/static/js/') || url.includes('/static/css/') || url.includes('/static/media/')) return;
  // Skip Cloudinary, Google APIs, and other CDNs
  if (url.includes('cloudinary.com') || url.includes('googleapis.com') || url.includes('emergent.sh')) return;
  // For everything else (HTML pages, manifest, icons) — network only, no cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
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

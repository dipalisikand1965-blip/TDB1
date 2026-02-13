// Service Worker for The Doggy Company PWA - v6 Clean
// Minimal caching, network-first for all app files

const CACHE_NAME = 'tdc-pwa-v6';

self.addEventListener('install', (event) => {
  console.log('PWA v6: Installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('PWA v6: Activating');
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => {
          console.log('PWA v6: Deleting old cache:', name);
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

// Service Worker for The Doggy Company PWA - v5 FORCE REFRESH
// This version aggressively clears all caches and forces reload

const CACHE_NAME = 'tdc-pwa-v5';

// ONLY cache these essential files - NO JS/CSS chunks
const urlsToCache = [
  '/manifest.json',
  '/logo-new.png',
  '/favicon.ico'
];

// Install - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('PWA v5: Installing - will clear all old caches');
  self.skipWaiting();
});

// Activate - AGGRESSIVELY clear ALL caches and reload all pages
self.addEventListener('activate', (event) => {
  console.log('PWA v5: Activating - clearing ALL caches');
  
  event.waitUntil(
    Promise.all([
      // Delete ALL caches, not just old ones
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('PWA v5: Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      // Force reload ALL controlled pages
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        console.log('PWA v5: Reloading', clients.length, 'pages');
        clients.forEach((client) => {
          client.postMessage({ type: 'FORCE_RELOAD' });
        });
      });
    })
  );
});

// Fetch - NETWORK ONLY for HTML/JS/CSS, no caching of app files
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls
  if (url.pathname.startsWith('/api/')) return;
  
  // NEVER cache HTML, JS, CSS - always go to network
  if (url.pathname.endsWith('.html') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.includes('.chunk.') ||
      url.pathname.includes('/static/') ||
      url.pathname === '/' ||
      url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Only if network fails, try cache as last resort
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // For other assets (images, fonts), use network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Message handler
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

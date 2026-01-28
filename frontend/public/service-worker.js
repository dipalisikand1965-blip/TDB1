// Service Worker for The Doggy Company PWA
// Handles caching, offline functionality, and push notifications

const CACHE_NAME = 'tdc-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-new.png',
  '/favicon.ico'
];

// Badge count tracking
let badgeCount = 0;

// Install event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('PWA: Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('PWA: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API calls - always go to network
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(event.request);
      })
  );
});

// Update app badge count
async function updateBadge(count) {
  badgeCount = count;
  
  if ('setAppBadge' in navigator) {
    try {
      if (count > 0) {
        await navigator.setAppBadge(count);
        console.log('PWA: Badge set to', count);
      } else {
        await navigator.clearAppBadge();
        console.log('PWA: Badge cleared');
      }
    } catch (error) {
      console.error('PWA: Badge update failed:', error);
    }
  }
}

// Push notification handler - Enhanced for Soul Whisper and more
self.addEventListener('push', (event) => {
  console.log('PWA: Push notification received');
  
  let notificationData = {
    title: 'The Doggy Company',
    body: 'New notification',
    icon: '/logo-new.png',
    badge: '/logo-new.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: '/'
    },
    requireInteraction: false
  };
  
  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        icon: pushData.icon || notificationData.icon,
        badge: pushData.badge || notificationData.badge,
        tag: pushData.tag || undefined,
        data: {
          ...notificationData.data,
          ...pushData.data,
          url: pushData.data?.url || '/'
        },
        requireInteraction: pushData.requireInteraction || false,
        silent: pushData.silent || false,
        actions: pushData.actions || []
      };
      
      // Update badge count if provided
      if (pushData.badgeCount !== undefined) {
        updateBadge(pushData.badgeCount);
      } else {
        // Increment badge count for new notification
        updateBadge(badgeCount + 1);
      }
    } catch (e) {
      // If not JSON, use text
      notificationData.body = event.data.text();
      updateBadge(badgeCount + 1);
    }
  }
  
  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handler - Navigate to relevant page
self.addEventListener('notificationclick', (event) => {
  console.log('PWA: Notification clicked', event.notification.tag);
  
  event.notification.close();
  
  // Decrement badge count when notification is clicked
  if (badgeCount > 0) {
    updateBadge(badgeCount - 1);
  }
  
  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/';
  
  // Handle action button clicks
  if (event.action) {
    console.log('PWA: Action clicked:', event.action);
    // Handle specific actions here
    if (event.action === 'view') {
      // Already handled by urlToOpen
    } else if (event.action === 'dismiss') {
      return; // Just close the notification
    }
  }
  
  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close handler (for analytics if needed)
self.addEventListener('notificationclose', (event) => {
  console.log('PWA: Notification dismissed', event.notification.tag);
  // Optionally decrement badge on dismiss too
});

// Message handler for badge updates from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_BADGE') {
    updateBadge(event.data.count);
  } else if (event.data && event.data.type === 'CLEAR_BADGE') {
    updateBadge(0);
  } else if (event.data && event.data.type === 'GET_BADGE') {
    // Send current badge count back
    event.source.postMessage({ type: 'BADGE_COUNT', count: badgeCount });
  }
});

// Background sync handler (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('PWA: Background sync triggered', event.tag);
  
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(
      // Sync any pending offline actions
      Promise.resolve()
    );
  }
});

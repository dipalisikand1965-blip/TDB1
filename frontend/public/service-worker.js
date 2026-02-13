// NUCLEAR SERVICE WORKER - Unregisters itself and clears all caches
// This is a one-time fix to clear all stale caches

const NUKE_VERSION = 'nuke-v1';

self.addEventListener('install', (event) => {
  console.log('NUKE SW: Installing - will destroy all caches');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('NUKE SW: Activating - destroying everything');
  
  event.waitUntil(
    (async () => {
      // Delete ALL caches
      const cacheNames = await caches.keys();
      console.log('NUKE SW: Deleting', cacheNames.length, 'caches');
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // Claim clients
      await self.clients.claim();
      
      // Get all windows and reload them
      const clients = await self.clients.matchAll({ type: 'window' });
      console.log('NUKE SW: Reloading', clients.length, 'windows');
      
      // Unregister this service worker
      const registration = await self.registration;
      await registration.unregister();
      console.log('NUKE SW: Unregistered self');
      
      // Reload all pages
      clients.forEach(client => {
        client.navigate(client.url);
      });
    })()
  );
});

// Don't cache anything - let requests go to network
self.addEventListener('fetch', (event) => {
  // Always go to network, never cache
  return;
});

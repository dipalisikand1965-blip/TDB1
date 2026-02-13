// Service Worker Registration - UNREGISTER MODE
// This version unregisters all service workers to fix caching issues

export function register(config) {
  // First, unregister all existing service workers
  unregisterAll().then(() => {
    // Don't register a new one - we're going SW-free for now
    console.log('PWA: All service workers unregistered');
    if (config && config.onSuccess) {
      config.onSuccess();
    }
  });
}

async function unregisterAll() {
  if ('serviceWorker' in navigator) {
    try {
      // Get all registrations
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('PWA: Found', registrations.length, 'service workers to unregister');
      
      // Unregister all
      await Promise.all(registrations.map(reg => reg.unregister()));
      
      // Clear all caches
      if ('caches' in window) {
        const names = await caches.keys();
        console.log('PWA: Clearing', names.length, 'caches');
        await Promise.all(names.map(name => caches.delete(name)));
      }
      
      console.log('PWA: Cleanup complete');
    } catch (error) {
      console.error('PWA: Cleanup error:', error);
    }
  }
}

export function unregister() {
  unregisterAll();
}

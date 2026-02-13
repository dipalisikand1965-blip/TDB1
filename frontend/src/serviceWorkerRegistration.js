// Service Worker Registration - Aggressive update checking
// Forces immediate update and reload when new version detected

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
      registerValidSW(swUrl, config);
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('PWA: Service worker registered');
      
      // Check for updates immediately and every 60 seconds
      registration.update();
      setInterval(() => registration.update(), 60000);
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;
        
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('PWA: New version detected - forcing update');
              
              // Tell the waiting worker to take over immediately
              if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
              }
              
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('PWA: Content cached for offline use');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('PWA: Registration failed:', error);
    });

  // Listen for the controlling service worker changing
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('PWA: Controller changed - reloading page');
    window.location.reload();
  });
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FORCE_RELOAD') {
      console.log('PWA: Force reload requested by service worker');
      window.location.reload();
    }
  });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

// Force unregister all service workers and clear caches
export async function forceCleanup() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
  }
  if ('caches' in window) {
    const names = await caches.keys();
    for (const name of names) {
      await caches.delete(name);
    }
  }
}

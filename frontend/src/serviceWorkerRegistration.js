// Service Worker Registration
// v11: Register SW for push notifications, but keep cache strategy = network-only

const SW_URL = '/service-worker.js';

export function register(config) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(SW_URL)
        .then((registration) => {
          console.log('[TDC] SW registered:', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('[TDC] SW: new content available');
                  if (config && config.onUpdate) config.onUpdate(registration);
                } else {
                  console.log('[TDC] SW: content cached for offline use');
                  if (config && config.onSuccess) config.onSuccess(registration);
                }
              }
            };
          };
        })
        .catch((error) => {
          console.error('[TDC] SW registration failed:', error);
        });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  }
}

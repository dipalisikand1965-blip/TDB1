// Service Worker Registration - Clean version

export function register(config) {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
      
      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          console.log('PWA: Registered');
          registration.onupdatefound = () => {
            const worker = registration.installing;
            if (!worker) return;
            worker.onstatechange = () => {
              if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('PWA: Update available');
                if (config?.onUpdate) config.onUpdate(registration);
              }
            };
          };
        })
        .catch(err => console.error('PWA: Registration failed', err));
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => reg.unregister());
  }
}

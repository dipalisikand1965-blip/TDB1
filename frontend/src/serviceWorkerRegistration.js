// Service worker DISABLED to prevent caching issues
// PWA features disabled for reliability

export function register() {
  // Unregister any existing service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }
}

export function unregister() {
  register(); // Same thing - just unregister
}

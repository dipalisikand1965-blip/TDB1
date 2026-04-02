// Service worker disabled — unregisters itself immediately
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.registration.unregister();
  // Do NOT navigate clients — that causes a page reload that races with SPA link clicks
});

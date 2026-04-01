import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import "@/index.css";
import App from "@/App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { initVersionChecker } from './utils/versionChecker';

// Global ChunkLoadError handler - catches errors before React even mounts
// This is critical for returning users with stale cached HTML
window.addEventListener('error', async (event) => {
  const isChunkError = 
    event.message?.includes('Loading chunk') ||
    event.message?.includes('Loading CSS chunk') ||
    (event.message?.includes('chunk') && event.message?.includes('failed'));
  
  if (isChunkError) {
    console.log('Global: ChunkLoadError detected, clearing caches and reloading...');
    
    const CHUNK_RELOAD_KEY = 'tdc_chunk_reload_attempted';
    const lastAttempt = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    const now = Date.now();
    
    // Prevent infinite reload loop
    if (lastAttempt && (now - parseInt(lastAttempt)) < 30000) {
      console.log('Global: Already attempted reload recently');
      return;
    }
    
    sessionStorage.setItem(CHUNK_RELOAD_KEY, now.toString());
    
    try {
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      // Clear caches
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
        }
      }
      // Clear version tracking
      localStorage.removeItem('tdc_app_version');
      localStorage.removeItem('tdc_last_version_check');
      
      // Force reload
      window.location.reload(true);
    } catch (e) {
      window.location.reload(true);
    }
  }
});

// Initialize version checker FIRST - this will auto-reload if there's a new version
initVersionChecker();

// Disable browser scroll restoration - we handle it manually
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);

// Register service worker for PWA functionality with enhanced update handling
serviceWorkerRegistration.register({
  onSuccess: () => console.log('PWA: Ready for offline use'),
  onUpdate: (registration) => {
    console.log('PWA: New version available, will reload...');
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
});

// Listen for SW_UPDATED message from service worker v11+ → hard reload
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_UPDATED') {
      console.log('[TDC] SW updated to', event.data.version, '— reloading...');
      const reloadKey = 'tdc_sw_reload';
      const last = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!last || now - parseInt(last) > 30000) {
        sessionStorage.setItem(reloadKey, now.toString());
        window.location.reload(true);
      }
    }
  });
}

import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import "@/index.css";
import App from "@/App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { initVersionChecker } from './utils/versionChecker';

// Global error handler — handles ChunkLoadErrors and DOM sync errors
window.addEventListener('error', async (event) => {
  const msg = event.message || '';

  // DOM removeChild / insertBefore errors: caused by emergent-main.js modifying
  // DOM nodes that React also owns. Suppress the error — React ErrorBoundary handles recovery.
  if (
    msg.includes('removeChild') ||
    msg.includes('not a child') ||
    msg.includes('insertBefore')
  ) {
    console.warn('[TDC] DOM sync error suppressed (external script interference):', msg);
    event.preventDefault();
    return;
  }

  const isChunkError = 
    msg.includes('Loading chunk') ||
    msg.includes('Loading CSS chunk') ||
    (msg.includes('chunk') && msg.includes('failed'));
  
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

// SW_UPDATED forced reload removed (v12) — SW now uses passthrough-only strategy
// No need to reload on SW update; browser gets fresh content naturally

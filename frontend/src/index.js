import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import "@/index.css";
import App from "@/App";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { initVersionChecker } from './utils/versionChecker';

// Initialize version checker FIRST - this will auto-reload if there's a new version
initVersionChecker();

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
    // Skip waiting and activate new service worker immediately
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
});

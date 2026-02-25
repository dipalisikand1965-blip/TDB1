// Version Checker Utility
// Automatically detects new deployments and forces a hard reload for users with stale caches

const VERSION_KEY = 'tdc_app_version';
const LAST_CHECK_KEY = 'tdc_last_version_check';
const CHECK_INTERVAL = 60000; // Check every 60 seconds

/**
 * Clears all caches and unregisters service workers
 */
async function clearAllCaches() {
  console.log('Version Checker: Clearing all caches...');
  
  // Unregister all service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Version Checker: Unregistered service worker');
    }
  }
  
  // Clear all caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
      console.log('Version Checker: Deleted cache:', cacheName);
    }
  }
  
  // Clear localStorage version tracking (but keep user data)
  localStorage.removeItem(VERSION_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);
}

/**
 * Forces a hard reload of the page
 */
function forceHardReload() {
  console.log('Version Checker: Forcing hard reload...');
  
  // Use cache-busting query param as fallback
  const url = new URL(window.location.href);
  url.searchParams.set('_refresh', Date.now().toString());
  
  // Try modern reload first, fallback to location change
  if (window.location.reload) {
    window.location.reload(true);
  } else {
    window.location.href = url.toString();
  }
}

/**
 * Checks for a new version and handles updates
 */
export async function checkForUpdates(forceCheck = false) {
  try {
    // Don't check too frequently unless forced
    const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
    const now = Date.now();
    
    if (!forceCheck && lastCheck && (now - parseInt(lastCheck)) < CHECK_INTERVAL) {
      return { updated: false, reason: 'checked_recently' };
    }
    
    // Fetch the latest version info with cache-busting
    const response = await fetch(`/meta.json?_=${now}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.warn('Version Checker: Could not fetch meta.json');
      return { updated: false, reason: 'fetch_failed' };
    }
    
    const meta = await response.json();
    const serverVersion = meta.version;
    const storedVersion = localStorage.getItem(VERSION_KEY);
    
    // Update last check time
    localStorage.setItem(LAST_CHECK_KEY, now.toString());
    
    console.log('Version Checker: Server version:', serverVersion);
    console.log('Version Checker: Stored version:', storedVersion);
    
    // First visit - store version and continue
    if (!storedVersion) {
      console.log('Version Checker: First visit, storing version');
      localStorage.setItem(VERSION_KEY, serverVersion);
      return { updated: false, reason: 'first_visit', version: serverVersion };
    }
    
    // Version mismatch - new deployment detected!
    if (storedVersion !== serverVersion) {
      console.log('Version Checker: NEW VERSION DETECTED! Clearing caches and reloading...');
      
      // Store new version BEFORE clearing caches
      localStorage.setItem(VERSION_KEY, serverVersion);
      
      // Clear everything and reload
      await clearAllCaches();
      forceHardReload();
      
      return { updated: true, oldVersion: storedVersion, newVersion: serverVersion };
    }
    
    return { updated: false, reason: 'version_match', version: serverVersion };
    
  } catch (error) {
    console.error('Version Checker: Error checking for updates:', error);
    return { updated: false, reason: 'error', error: error.message };
  }
}

/**
 * Initializes the version checker
 * Call this once when the app loads
 */
export function initVersionChecker() {
  console.log('Version Checker: Initializing...');
  
  // Check immediately on load
  checkForUpdates(true);
  
  // Also check periodically while the app is open
  setInterval(() => {
    checkForUpdates(false);
  }, CHECK_INTERVAL);
  
  // Check when the page becomes visible again (user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('Version Checker: Tab became visible, checking for updates...');
      checkForUpdates(true);
    }
  });
  
  // Check when the app comes back online
  window.addEventListener('online', () => {
    console.log('Version Checker: Back online, checking for updates...');
    checkForUpdates(true);
  });
}

/**
 * Manually trigger a cache clear and reload
 * Useful for debugging or manual refresh button
 */
export async function forceRefresh() {
  await clearAllCaches();
  forceHardReload();
}

export default { initVersionChecker, checkForUpdates, forceRefresh };

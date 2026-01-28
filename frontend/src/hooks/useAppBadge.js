/**
 * App Badge Hook for PWA
 * Manages the unread notification count badge on the app icon
 */

import { useCallback, useEffect, useState } from 'react';

export const useAppBadge = () => {
  const [badgeCount, setBadgeCount] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  // Check if Badge API is supported
  useEffect(() => {
    setIsSupported('setAppBadge' in navigator);
  }, []);

  // Set badge count
  const setBadge = useCallback(async (count) => {
    setBadgeCount(count);
    
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
      } catch (error) {
        console.error('Badge update failed:', error);
      }
    }
    
    // Also notify service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_BADGE',
        count: count
      });
    }
  }, []);

  // Increment badge
  const incrementBadge = useCallback(async () => {
    const newCount = badgeCount + 1;
    await setBadge(newCount);
  }, [badgeCount, setBadge]);

  // Decrement badge
  const decrementBadge = useCallback(async () => {
    const newCount = Math.max(0, badgeCount - 1);
    await setBadge(newCount);
  }, [badgeCount, setBadge]);

  // Clear badge
  const clearBadge = useCallback(async () => {
    await setBadge(0);
    
    // Also notify service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_BADGE'
      });
    }
  }, [setBadge]);

  return {
    badgeCount,
    isSupported,
    setBadge,
    incrementBadge,
    decrementBadge,
    clearBadge
  };
};

export default useAppBadge;

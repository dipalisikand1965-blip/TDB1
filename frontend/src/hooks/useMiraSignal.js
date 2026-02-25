/**
 * useMiraSignal - Hook for sending browsing signals to Mira Intelligence
 * 
 * This hook enables passive learning by tracking user behavior
 * across the application and sending signals to the Mira backend.
 * 
 * Usage:
 *   const { trackView, trackClick, trackFilter, trackAddToCart } = useMiraSignal();
 *   trackView('travel', 'cab-booking-page');
 *   trackClick('product', 'travel-kit-001');
 *   trackFilter('stay', 'large-dog-friendly');
 *   trackAddToCart('product', 'chicken-treats-001');
 */

import { useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';

// Debounce signal sending to avoid spam
const DEBOUNCE_MS = 1000;

export const useMiraSignal = () => {
  const { token } = useAuth();
  const lastSignalRef = useRef({});

  const sendSignal = useCallback(async (page, action, target, metadata = {}) => {
    // Debounce by page+action+target combination
    const key = `${page}-${action}-${target}`;
    const now = Date.now();
    
    if (lastSignalRef.current[key] && now - lastSignalRef.current[key] < DEBOUNCE_MS) {
      return; // Skip if too recent
    }
    lastSignalRef.current[key] = now;

    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/mira/intelligence/signal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          page,
          action,
          target,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            url: window.location.pathname
          }
        })
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.debug('Mira signal failed:', error);
    }
  }, [token]);

  // Convenience methods for common actions
  const trackView = useCallback((page, target, metadata = {}) => {
    sendSignal(page, 'view', target, metadata);
  }, [sendSignal]);

  const trackClick = useCallback((page, target, metadata = {}) => {
    sendSignal(page, 'click', target, metadata);
  }, [sendSignal]);

  const trackFilter = useCallback((page, filterValue, metadata = {}) => {
    sendSignal(page, 'filter_used', filterValue, metadata);
  }, [sendSignal]);

  const trackAddToCart = useCallback((page, productId, metadata = {}) => {
    sendSignal(page, 'add_to_cart', productId, metadata);
  }, [sendSignal]);

  const trackSearch = useCallback((page, searchTerm, metadata = {}) => {
    sendSignal(page, 'search', searchTerm, metadata);
  }, [sendSignal]);

  const trackPillarVisit = useCallback((pillar) => {
    sendSignal(pillar, 'pillar_visit', pillar, { pillar });
  }, [sendSignal]);

  return {
    sendSignal,
    trackView,
    trackClick,
    trackFilter,
    trackAddToCart,
    trackSearch,
    trackPillarVisit
  };
};

export default useMiraSignal;

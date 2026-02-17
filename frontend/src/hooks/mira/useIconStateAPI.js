/**
 * useIconStateAPI.js
 * ==================
 * Hook to fetch icon state data from the unified backend API
 * 
 * Single endpoint: /api/os/icon-state
 * Returns real counts from the Service Desk ticket spine
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * useIconStateAPI - Fetches real icon state data from backend
 * 
 * @param {Object} options
 * @param {string} options.petId - Current pet ID (optional filter)
 * @param {string} options.activeTab - Currently active tab (for PULSE override)
 * @param {number} options.pollInterval - Polling interval in ms (default 30000)
 * @param {boolean} options.enabled - Whether to enable fetching
 */
const useIconStateAPI = ({
  petId = null,
  activeTab = null,
  pollInterval = 30000,
  enabled = true,
} = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const pollRef = useRef(null);

  /**
   * Fetch icon state from backend
   */
  const fetchIconState = useCallback(async (silent = false) => {
    if (!enabled) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('No auth token');
      return;
    }

    if (!silent) setLoading(true);

    try {
      const params = new URLSearchParams();
      if (petId) params.append('pet_id', petId);
      if (activeTab) params.append('active_tab', activeTab);

      const url = `${API_URL}/api/os/icon-state${params.toString() ? '?' + params.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData(result);
        setError(null);
        setLastFetchedAt(new Date().toISOString());
      } else {
        throw new Error(result.detail || 'API error');
      }
    } catch (err) {
      console.error('[IconStateAPI] Fetch error:', err);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [petId, activeTab, enabled]);

  /**
   * Mark a tab as viewed (clears new badges)
   */
  const markTabViewed = useCallback(async (tab) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/os/icon-state/mark-viewed/${tab}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refetch after marking viewed
        setTimeout(() => fetchIconState(true), 500);
      }
    } catch (err) {
      console.error('[IconStateAPI] Mark viewed error:', err);
    }
  }, [fetchIconState]);

  /**
   * Transform API response to hook-friendly counts format
   */
  const getCounts = useCallback(() => {
    if (!data?.counts) return {};

    const { services, today, concierge, picks, learn, mojo } = data.counts;

    return {
      // MOJO
      hasCriticalMissing: (mojo?.critical_fields_missing || 0) > 0,
      soulScore: mojo?.soul_score || 0,
      missingFields: mojo?.missing_fields || [],
      
      // TODAY
      urgentCount: today?.urgent || 0,
      dueTodayCount: today?.due_today || 0,
      upcomingCount: today?.upcoming || 0,
      
      // PICKS
      picksCount: 0, // Total picks not returned by API
      newPicksSinceLastView: picks?.new_picks_since_last_view || 0,
      materialChangeCount: picks?.material_change || 0,
      
      // SERVICES
      activeTicketsCount: services?.active_tickets || 0,
      awaitingYouCount: services?.awaiting_you || 0,
      
      // CONCIERGE
      unreadRepliesCount: concierge?.unread_replies || 0,
      openThreadsCount: concierge?.open_threads || 0,
      
      // LEARN
      pendingInsightsCount: learn?.pending_insights || 0,
      learnedFactsCount: learn?.learned_facts || 0,
      newContentCount: 0, // Not tracked by API yet
    };
  }, [data]);

  /**
   * Get server-computed states (alternative to client-side computation)
   */
  const getServerStates = useCallback(() => {
    return data?.states || {};
  }, [data]);

  /**
   * Get server-computed badges
   */
  const getServerBadges = useCallback(() => {
    return data?.badges || {};
  }, [data]);

  /**
   * Get debug info for Debug Drawer
   */
  const getDebugInfo = useCallback(() => {
    return {
      raw: data,
      counts: getCounts(),
      serverStates: getServerStates(),
      serverBadges: getServerBadges(),
      lastFetchedAt,
      error,
      petIds: data?.pet_ids || [],
      userEmail: data?.user_email,
    };
  }, [data, getCounts, getServerStates, getServerBadges, lastFetchedAt, error]);

  // Initial fetch and polling
  useEffect(() => {
    fetchIconState();

    // Set up polling
    if (enabled && pollInterval > 0) {
      pollRef.current = setInterval(() => {
        fetchIconState(true); // Silent poll
      }, pollInterval);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchIconState, enabled, pollInterval]);

  // Refetch when petId or activeTab changes
  useEffect(() => {
    fetchIconState();
  }, [petId, activeTab, fetchIconState]);

  return {
    // Raw API data
    data,
    loading,
    error,
    lastFetchedAt,

    // Transformed counts for useIconState hook
    counts: getCounts(),

    // Server-computed values (alternative to client-side)
    serverStates: getServerStates(),
    serverBadges: getServerBadges(),

    // Actions
    refetch: () => fetchIconState(),
    markTabViewed,

    // Debug
    getDebugInfo,
  };
};

export default useIconStateAPI;

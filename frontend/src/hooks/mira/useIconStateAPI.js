/**
 * useIconStateAPI.js
 * ==================
 * Hook to fetch icon state data from the unified backend API
 * 
 * Single endpoint: /api/os/icon-state
 * Returns real counts from the Service Desk ticket spine
 * 
 * FEATURE FLAG: ICON_STATE_API_ENABLED
 * - Set to true only after ALL intake points use canonical ticket_id
 * - Until then, shows "syncing" indicator when legacy data detected
 * 
 * UNIFORM SERVICE FLOW:
 * User Intent → User Request → Service Desk Ticket → Admin Notification → 
 * Member Notification → Pillar Request → Tickets → Channel Intakes
 * 
 * Icons are a READOUT of this spine, not independent features.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE FLAG - Enable only after ALL intake points use canonical ticket_id
// ═══════════════════════════════════════════════════════════════════════════
const ICON_STATE_API_ENABLED = true; // Set to true to use real API data

// Remaining intake points that need canonical ticket_id (for reference):
// - stay_routes.py, dine_routes.py, celebrate_routes.py, enjoy_routes.py
// - fit_routes.py, learn_routes.py, paperwork_routes.py, emergency_routes.py
// - whatsapp_routes.py, membership_routes.py, ticket_auto_create.py
// - unified_signal_flow.py, user_tickets_routes.py, service_catalog_routes.py
// - ticket_messaging.py

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

    // Try multiple token keys (app uses different keys in different contexts)
    const token = localStorage.getItem('tdb_auth_token') || localStorage.getItem('token');
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
    const token = localStorage.getItem('tdb_auth_token') || localStorage.getItem('token');
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
   * 
   * LEGACY DATA HANDLING:
   * If invalid_count > 0, we have legacy tickets with non-canonical IDs.
   * In this case, we return special flags so UI can show "syncing" instead of "0"
   */
  const getCounts = useCallback(() => {
    if (!data?.counts) return { _hasLegacyData: false, _isLoading: true };

    const { services, today, concierge, picks, learn, mojo } = data.counts;
    
    // Check for legacy data (non-canonical ticket_ids)
    const validation = services?._validation || {};
    const invalidCount = validation.invalid_count || 0;
    const hasLegacyData = invalidCount > 0;

    return {
      // LEGACY DATA FLAG - UI should show "syncing" indicator
      _hasLegacyData: hasLegacyData,
      _invalidCount: invalidCount,
      _isLoading: false,
      
      // MOJO
      hasCriticalMissing: (mojo?.critical_fields_missing || 0) > 0,
      soulScore: mojo?.soul_score || 0,
      missingFields: mojo?.missing_fields || [],
      
      // TODAY - use null if legacy data exists and count is 0 (means "unknown")
      urgentCount: hasLegacyData && today?.urgent === 0 ? null : (today?.urgent || 0),
      dueTodayCount: hasLegacyData && today?.due_today === 0 ? null : (today?.due_today || 0),
      upcomingCount: hasLegacyData && today?.upcoming === 0 ? null : (today?.upcoming || 0),
      
      // PICKS (not affected by ticket legacy data)
      picksCount: 0,
      newPicksSinceLastView: picks?.new_picks_since_last_view || 0,
      materialChangeCount: picks?.material_change || 0,
      
      // SERVICES - use null if legacy data exists and count is 0
      activeTicketsCount: hasLegacyData && services?.active_tickets === 0 ? null : (services?.active_tickets || 0),
      awaitingYouCount: hasLegacyData && services?.awaiting_you === 0 ? null : (services?.awaiting_you || 0),
      
      // CONCIERGE
      unreadRepliesCount: concierge?.unread_replies || 0,
      openThreadsCount: concierge?.open_threads || 0,
      
      // LEARN (not affected by ticket legacy data)
      pendingInsightsCount: learn?.pending_insights || 0,
      learnedFactsCount: learn?.learned_facts || 0,
      newContentCount: 0,
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

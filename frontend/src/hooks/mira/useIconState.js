/**
 * useIconState.js
 * ================
 * CENTRALIZED Icon State System - Single Source of Truth
 * Per PET_OS_BEHAVIOR_BIBLE v1.1 Section 2
 * 
 * THREE STATES:
 * - OFF: Muted icon, no badge - Zero relevant items for active pet
 * - ON: Lit icon - Items exist (may be seen)
 * - PULSE: Animated icon + badge - NEW or needs attention
 * 
 * RULES:
 * - PULSE should be rare and meaningful
 * - Active tab override: No PULSE animation while inside the tab (badge remains)
 * - Pet switch: Reset all states to OFF, then recalculate
 * - No cross-pet leakage
 * 
 * BADGE RULES:
 * - 0 = hide badge
 * - 1-9 = show number
 * - >9 = show "9+"
 * - PICKS uses "+N" format
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const ICON_STATE = {
  OFF: 'OFF',
  ON: 'ON',
  PULSE: 'PULSE',
  GLOW: 'GLOW', // NEW: Golden glow for actionable Mira suggestions (CTA state)
};

export const TAB_IDS = {
  MOJO: 'mojo',
  TODAY: 'today',
  PICKS: 'picks',
  SERVICES: 'services',
  LEARN: 'learn',
  CONCIERGE: 'concierge',
};

// Storage key for tracking last visit timestamps per pet per tab
const LAST_VISIT_KEY = 'mira_icon_last_visits';

// ═══════════════════════════════════════════════════════════════════════════
// BADGE FORMATTER (Consistent across all tabs)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format badge count for display
 * @param {number} count - Raw count
 * @param {string} format - 'numeric' (default) or 'plus' (for PICKS: +N)
 * @returns {string|null} - Formatted badge or null if should be hidden
 */
export const formatBadge = (count, format = 'numeric') => {
  if (!count || count <= 0) return null;
  if (count > 9) return '9+';
  return format === 'plus' ? `+${count}` : String(count);
};

// ═══════════════════════════════════════════════════════════════════════════
// CENTRALIZED STATE CALCULATOR (Single Source of Truth)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * getIconState - THE single source of truth for all icon states
 * Every tab MUST use this function. No tab computes state internally.
 * 
 * @param {string} tabId - Tab identifier (from TAB_IDS)
 * @param {Object} data - Tab-specific data counts
 * @param {string} activeTab - Currently active tab (for override)
 * @returns {{ state: 'OFF'|'ON'|'PULSE', badge: string|null, tooltip: string }}
 */
export const getIconState = (tabId, data = {}, activeTab = null) => {
  // Active tab override: No PULSE while inside the tab
  const isActive = activeTab === tabId;
  
  switch (tabId) {
    // ─────────────────────────────────────────────────────────────────────
    // MOJO (Pet Avatar)
    // PULSE: Critical missing fields (vaccinations, allergies, medications, vet_info, location)
    // ON: Pet exists (always at least ON)
    // Badge: None (orange dot IS the badge)
    // ─────────────────────────────────────────────────────────────────────
    case TAB_IDS.MOJO: {
      const { hasCriticalMissing = false, soulScore = 100 } = data;
      
      // MOJO is never OFF (pet always exists)
      if (hasCriticalMissing || soulScore < 50) {
        return {
          state: isActive ? ICON_STATE.ON : ICON_STATE.PULSE,
          badge: null, // Orange dot is the visual indicator
          tooltip: 'Complete your pet\'s profile',
          reason: hasCriticalMissing ? 'critical_missing' : 'low_soul_score',
        };
      }
      
      return {
        state: ICON_STATE.ON,
        badge: null,
        tooltip: 'View pet profile',
      };
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // TODAY
    // PULSE: urgent_count > 0 OR due_today_count > 0
    // ON: upcoming_count > 0 (but not urgent/due)
    // OFF: All are zero
    // SYNCING: null values indicate legacy data migration in progress
    // Badge: urgent + due_today (cap 9+)
    // ─────────────────────────────────────────────────────────────────────
    case TAB_IDS.TODAY: {
      const { urgentCount, dueTodayCount, upcomingCount } = data;
      
      // Legacy data handling: null means "unknown, possibly non-zero"
      const hasLegacyUnknown = urgentCount === null || dueTodayCount === null;
      if (hasLegacyUnknown) {
        return {
          state: ICON_STATE.ON, // Show as ON (not OFF) when data is unknown
          badge: '—', // Dash indicates "syncing"
          tooltip: 'Syncing ticket data...',
          _syncing: true,
        };
      }
      
      const badgeCount = (urgentCount || 0) + (dueTodayCount || 0);
      
      if (urgentCount > 0 || dueTodayCount > 0) {
        return {
          state: isActive ? ICON_STATE.ON : ICON_STATE.PULSE,
          badge: formatBadge(badgeCount),
          tooltip: `${badgeCount} item${badgeCount > 1 ? 's' : ''} need attention`,
        };
      }
      
      if ((upcomingCount || 0) > 0) {
        return {
          state: ICON_STATE.ON,
          badge: null,
          tooltip: `${upcomingCount} upcoming item${upcomingCount > 1 ? 's' : ''}`,
        };
      }
      
      return {
        state: ICON_STATE.OFF,
        badge: null,
        tooltip: 'Nothing for today',
      };
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // PICKS
    // PULSE: newSinceLastView > 0 OR materialChangeCount > 0
    // ON: picksCount > 0 (but nothing new)
    // OFF: picksCount == 0
    // Badge: "+N" for new picks
    // ─────────────────────────────────────────────────────────────────────
    case TAB_IDS.PICKS: {
      const { picksCount = 0, newSinceLastView = 0, materialChangeCount = 0 } = data;
      const newCount = newSinceLastView + materialChangeCount;
      
      if (newCount > 0) {
        return {
          state: isActive ? ICON_STATE.ON : ICON_STATE.PULSE,
          badge: formatBadge(newCount, 'plus'), // "+N" format
          tooltip: `${newCount} new pick${newCount > 1 ? 's' : ''} for your pet`,
        };
      }
      
      if (picksCount > 0) {
        return {
          state: ICON_STATE.ON,
          badge: null,
          tooltip: `${picksCount} personalized pick${picksCount > 1 ? 's' : ''}`,
        };
      }
      
      return {
        state: ICON_STATE.OFF,
        badge: null,
        tooltip: 'No picks yet',
      };
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // SERVICES
    // PULSE: awaitingYouCount > 0 (this is the key!)
    // ON: activeTicketsCount > 0 (but not awaiting you)
    // OFF: None
    // SYNCING: null values indicate legacy data migration in progress
    // Badge: awaitingYouCount first; if 0 then activeTicketsCount
    // ─────────────────────────────────────────────────────────────────────
    case TAB_IDS.SERVICES: {
      const { activeTicketsCount, awaitingYouCount } = data;
      
      // Legacy data handling: null means "unknown, possibly non-zero"
      const hasLegacyUnknown = activeTicketsCount === null || awaitingYouCount === null;
      if (hasLegacyUnknown) {
        return {
          state: ICON_STATE.ON, // Show as ON (not OFF) when data is unknown
          badge: '—', // Dash indicates "syncing"
          tooltip: 'Syncing ticket data...',
          _syncing: true,
        };
      }
      
      if ((awaitingYouCount || 0) > 0) {
        return {
          state: isActive ? ICON_STATE.ON : ICON_STATE.PULSE,
          badge: formatBadge(awaitingYouCount),
          tooltip: `${awaitingYouCount} ticket${awaitingYouCount > 1 ? 's' : ''} awaiting your response`,
        };
      }
      
      if ((activeTicketsCount || 0) > 0) {
        return {
          state: ICON_STATE.ON,
          badge: formatBadge(activeTicketsCount),
          tooltip: `${activeTicketsCount} active ticket${activeTicketsCount > 1 ? 's' : ''}`,
        };
      }
      
      return {
        state: ICON_STATE.OFF,
        badge: null,
        tooltip: 'No active services',
      };
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // CONCIERGE®
    // PULSE: unreadRepliesCount > 0
    // ON: openThreadsCount > 0 (but no unread)
    // OFF: None
    // Badge: unread count (cap 9+)
    // ─────────────────────────────────────────────────────────────────────
    case TAB_IDS.CONCIERGE: {
      const { unreadRepliesCount = 0, openThreadsCount = 0 } = data;
      
      if (unreadRepliesCount > 0) {
        return {
          state: isActive ? ICON_STATE.ON : ICON_STATE.PULSE,
          badge: formatBadge(unreadRepliesCount),
          tooltip: `${unreadRepliesCount} unread message${unreadRepliesCount > 1 ? 's' : ''}`,
        };
      }
      
      if (openThreadsCount > 0) {
        return {
          state: ICON_STATE.ON,
          badge: formatBadge(openThreadsCount),
          tooltip: `${openThreadsCount} open thread${openThreadsCount > 1 ? 's' : ''}`,
        };
      }
      
      return {
        state: ICON_STATE.OFF,
        badge: null,
        tooltip: 'Chat with Concierge',
      };
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // LEARN
    // PULSE: pendingInsightsCount > 0 (tied to MOJO review!)
    // ON: learnedFactsCount > 0 (but no pending)
    // OFF: None
    // Badge: pending insights count
    // ─────────────────────────────────────────────────────────────────────
    case TAB_IDS.LEARN: {
      const { pendingInsightsCount = 0, learnedFactsCount = 0, newContentCount = 0 } = data;
      
      if (pendingInsightsCount > 0 || newContentCount > 0) {
        const count = pendingInsightsCount + newContentCount;
        return {
          state: isActive ? ICON_STATE.ON : ICON_STATE.PULSE,
          badge: formatBadge(count),
          tooltip: `${count} new thing${count > 1 ? 's' : ''} to learn`,
        };
      }
      
      if (learnedFactsCount > 0) {
        return {
          state: ICON_STATE.ON,
          badge: null,
          tooltip: `${learnedFactsCount} learned fact${learnedFactsCount > 1 ? 's' : ''}`,
        };
      }
      
      return {
        state: ICON_STATE.OFF,
        badge: null,
        tooltip: 'Learn about your pet',
      };
    }
    
    default:
      return {
        state: ICON_STATE.OFF,
        badge: null,
        tooltip: '',
      };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// LAST VISIT TRACKING (For PULSE → ON transition)
// ═══════════════════════════════════════════════════════════════════════════

const loadLastVisits = () => {
  try {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveLastVisits = (visits) => {
  try {
    localStorage.setItem(LAST_VISIT_KEY, JSON.stringify(visits));
  } catch (e) {
    console.warn('[IconState] Failed to save last visits:', e);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * useIconState - Hook to manage icon states for all OS tabs
 * Uses centralized getIconState() for all calculations
 * 
 * @param {Object} options
 * @param {string} options.currentPetId - Current active pet ID
 * @param {Object} options.counts - Real data counts for all tabs
 * @param {string} options.activeTab - Currently active tab
 */
const useIconState = ({
  currentPetId,
  counts = {},
  activeTab = null,
} = {}) => {
  const prevPetIdRef = useRef(null);
  const [lastVisits, setLastVisits] = useState(() => loadLastVisits());
  
  // ─────────────────────────────────────────────────────────────────────────
  // Compute all icon states using centralized getIconState()
  // ─────────────────────────────────────────────────────────────────────────
  const iconStates = useMemo(() => {
    const {
      // MOJO
      hasCriticalMissing = false,
      soulScore = 100,
      // TODAY
      urgentCount = 0,
      dueTodayCount = 0,
      upcomingCount = 0,
      // PICKS
      picksCount = 0,
      newPicksSinceLastView = 0,
      materialChangeCount = 0,
      // SERVICES
      activeTicketsCount = 0,
      awaitingYouCount = 0,
      // CONCIERGE
      unreadRepliesCount = 0,
      openThreadsCount = 0,
      // LEARN
      pendingInsightsCount = 0,
      learnedFactsCount = 0,
      newContentCount = 0,
    } = counts;
    
    return {
      [TAB_IDS.MOJO]: getIconState(TAB_IDS.MOJO, { hasCriticalMissing, soulScore }, activeTab),
      [TAB_IDS.TODAY]: getIconState(TAB_IDS.TODAY, { urgentCount, dueTodayCount, upcomingCount }, activeTab),
      [TAB_IDS.PICKS]: getIconState(TAB_IDS.PICKS, { picksCount, newSinceLastView: newPicksSinceLastView, materialChangeCount }, activeTab),
      [TAB_IDS.SERVICES]: getIconState(TAB_IDS.SERVICES, { activeTicketsCount, awaitingYouCount }, activeTab),
      [TAB_IDS.CONCIERGE]: getIconState(TAB_IDS.CONCIERGE, { unreadRepliesCount, openThreadsCount }, activeTab),
      [TAB_IDS.LEARN]: getIconState(TAB_IDS.LEARN, { pendingInsightsCount, learnedFactsCount, newContentCount }, activeTab),
    };
  }, [counts, activeTab]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Pet switch handling: Reset states when pet changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const prevPetId = prevPetIdRef.current;
    
    if (prevPetId && currentPetId && prevPetId !== currentPetId) {
      console.log(`[IconState] Pet switched: ${prevPetId} → ${currentPetId}`);
    }
    
    prevPetIdRef.current = currentPetId;
  }, [currentPetId]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Mark tab as visited (for PULSE → ON transition tracking)
  // ─────────────────────────────────────────────────────────────────────────
  const markTabVisited = useCallback((tabId) => {
    if (!currentPetId || !tabId) return;
    
    const now = Date.now();
    setLastVisits(prev => {
      const updated = {
        ...prev,
        [currentPetId]: {
          ...(prev[currentPetId] || {}),
          [tabId]: now,
        },
      };
      saveLastVisits(updated);
      return updated;
    });
    
    console.log(`[IconState] Tab visited: ${tabId}`);
  }, [currentPetId]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Get last visit timestamp for a tab
  // ─────────────────────────────────────────────────────────────────────────
  const getLastVisit = useCallback((tabId) => {
    if (!currentPetId) return 0;
    return lastVisits[currentPetId]?.[tabId] || 0;
  }, [currentPetId, lastVisits]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Debug: Get all raw counts (for Debug Drawer)
  // ─────────────────────────────────────────────────────────────────────────
  const getDebugData = useCallback(() => {
    return {
      petId: currentPetId,
      activeTab,
      counts,
      iconStates,
      lastVisits: lastVisits[currentPetId] || {},
    };
  }, [currentPetId, activeTab, counts, iconStates, lastVisits]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Log state changes for debugging
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stateStr = Object.entries(iconStates)
      .map(([k, v]) => `${k}:${v.state}${v.badge ? `(${v.badge})` : ''}`)
      .join(', ');
    console.log(`[IconState] States: ${stateStr}`);
  }, [iconStates]);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Return API
  // ─────────────────────────────────────────────────────────────────────────
  return {
    // All computed states
    iconStates,
    
    // Individual state getters (convenience)
    mojoState: iconStates[TAB_IDS.MOJO],
    todayState: iconStates[TAB_IDS.TODAY],
    picksState: iconStates[TAB_IDS.PICKS],
    servicesState: iconStates[TAB_IDS.SERVICES],
    conciergeState: iconStates[TAB_IDS.CONCIERGE],
    learnState: iconStates[TAB_IDS.LEARN],
    
    // Actions
    markTabVisited,
    getLastVisit,
    
    // Debug
    getDebugData,
    
    // Constants (for external use)
    ICON_STATE,
    TAB_IDS,
    
    // Utility
    getIconState,
    formatBadge,
  };
};

export default useIconState;

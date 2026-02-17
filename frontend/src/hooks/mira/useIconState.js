/**
 * useIconState.js
 * ================
 * Icon State System - Per PET_OS_BEHAVIOR_BIBLE v1.1 Section 2
 * 
 * THREE STATES:
 * - OFF: Muted icon, no dot - Zero relevant items for active pet
 * - ON: Lit icon, subtle dot - Items exist (may be seen)
 * - PULSE: Subtle pulse + dot + optional count - NEW or materially changed since last visit
 * 
 * RULES:
 * - PULSE should be rare and meaningful
 * - Visiting tab: PULSE → ON immediately
 * - Pet switch: Reset all states to OFF, then recalculate
 * - No cross-pet leakage
 * 
 * CANONICAL TRIGGER EVENTS (Section 2.2):
 * - PET_SWITCHED
 * - TICKET_CREATED
 * - TICKET_STATUS_CHANGED
 * - OPTIONS_ADDED
 * - USER_ACTION_REQUIRED_SET
 * - CONCIERGE_MESSAGE_RECEIVED
 * - INSIGHT_SAVED
 * - LEARN_ITEM_PUBLISHED_FOR_PET
 * - SAFETY_MODE_ENTERED
 * - SAFETY_MODE_EXITED
 * - PICKS_MATERIAL_CHANGE
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// Icon states
export const ICON_STATE = {
  OFF: 'OFF',
  ON: 'ON',
  PULSE: 'PULSE',
};

// Tab IDs
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

/**
 * Load last visit data from localStorage
 * Format: { [petId]: { [tabId]: timestamp } }
 */
const loadLastVisits = () => {
  try {
    const stored = localStorage.getItem(LAST_VISIT_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('[useIconState] Error loading last visits:', e);
    return {};
  }
};

/**
 * Save last visit data to localStorage
 */
const saveLastVisits = (data) => {
  try {
    localStorage.setItem(LAST_VISIT_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[useIconState] Error saving last visits:', e);
  }
};

/**
 * useIconState - Hook to manage icon states for all OS tabs
 * 
 * @param {Object} options
 * @param {string} options.currentPetId - Current active pet ID
 * @param {Object} options.mojoData - { soulScore: number, hasIncompleteFields: boolean, pendingSuggestions: [], newInsights: boolean }
 * @param {Object} options.todayData - { urgent: [], due: [], watchlist: [], awaitingYou: [] }
 * @param {Object} options.servicesData - { activeTickets: [], awaitingYou: boolean }
 * @param {Object} options.conciergeData - { isOnline: boolean, openThreads: [], newReplies: boolean }
 * @param {Object} options.picksData - { items: [], hasNew: boolean, heroPillar: string }
 * @param {Object} options.learnData - { forYourPetItems: [], newItems: boolean }
 * @param {string} options.activeTab - Currently active tab
 */
const useIconState = ({
  currentPetId,
  mojoData = {},
  todayData = {},
  servicesData = {},
  conciergeData = {},
  picksData = {},
  learnData = {},
  activeTab = null,
} = {}) => {
  // Icon states for each tab (including MOJO)
  const [iconStates, setIconStates] = useState({
    [TAB_IDS.MOJO]: { state: ICON_STATE.ON, count: 0 }, // MOJO is always at least ON (pet exists)
    [TAB_IDS.TODAY]: { state: ICON_STATE.OFF, count: 0 },
    [TAB_IDS.PICKS]: { state: ICON_STATE.OFF, count: 0 },
    [TAB_IDS.SERVICES]: { state: ICON_STATE.OFF, count: 0 },
    [TAB_IDS.LEARN]: { state: ICON_STATE.OFF, count: 0 },
    [TAB_IDS.CONCIERGE]: { state: ICON_STATE.OFF, count: 0 },
  });

  // Last visit timestamps per pet per tab
  const [lastVisits, setLastVisits] = useState(() => loadLastVisits());
  
  // Previous pet ID (to detect pet switches)
  const prevPetIdRef = useRef(currentPetId);
  
  // Track previous data for change detection
  const prevDataRef = useRef({
    mojoData: {},
    todayData: {},
    servicesData: {},
    conciergeData: {},
    picksData: {},
    learnData: {},
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // VISIT TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Mark a tab as visited for current pet
   * Per Bible: PULSE → ON when user visits
   */
  const markTabVisited = useCallback((tabId) => {
    if (!currentPetId || !tabId) return;

    const now = Date.now();
    
    setLastVisits(prev => {
      const updated = {
        ...prev,
        [currentPetId]: {
          ...(prev[currentPetId] || {}),
          [tabId]: now,
        }
      };
      saveLastVisits(updated);
      return updated;
    });

    // PULSE → ON immediately when visited
    setIconStates(prev => {
      if (prev[tabId]?.state === ICON_STATE.PULSE) {
        console.log(`[IconState] ${tabId}: PULSE → ON (visited)`);
        return {
          ...prev,
          [tabId]: { ...prev[tabId], state: ICON_STATE.ON }
        };
      }
      return prev;
    });
  }, [currentPetId]);

  /**
   * Get last visit timestamp for a tab
   */
  const getLastVisit = useCallback((tabId) => {
    if (!currentPetId) return 0;
    return lastVisits[currentPetId]?.[tabId] || 0;
  }, [currentPetId, lastVisits]);

  // ═══════════════════════════════════════════════════════════════════════════
  // STATE CALCULATIONS (Per Bible Section 2.3)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Calculate MOJO (Pet Profile) icon state
   * OFF: Never (pet always exists when in OS)
   * ON: Pet profile exists AND no critical missing fields AND soul score >= 50%
   * PULSE: Critical missing fields OR soul score < 50% OR new insights discovered OR pending suggestions
   * 
   * Critical missing fields = vaccinations, allergies, medications, emergency contact, location, vet details
   */
  const calculateMojoState = useCallback(() => {
    const { 
      soulScore = 0, 
      hasCriticalMissing = false,
      hasIncompleteFields = false, 
      pendingSuggestions = [], 
      newInsights = false 
    } = mojoData;
    
    // MOJO is never OFF - if pet exists, it's at least ON
    // PULSE conditions (priority order):
    // 1. Has critical missing fields (vaccinations, allergies, etc.) - highest priority
    // 2. Soul score < 50% (encouraging profile completion)
    // 3. New insights discovered from conversation
    // 4. Pending suggestions to enhance profile
    
    const needsAttention = hasCriticalMissing || soulScore < 50 || hasIncompleteFields || newInsights;
    const hasPendingSuggestions = pendingSuggestions.length > 0;
    
    if (needsAttention || hasPendingSuggestions) {
      const count = hasCriticalMissing ? 1 : (pendingSuggestions.length || (soulScore < 50 ? 1 : 0));
      return { state: ICON_STATE.PULSE, count, reason: hasCriticalMissing ? 'critical_missing' : 'incomplete' };
    }
    
    return { state: ICON_STATE.ON, count: 0 };
  }, [mojoData]);

  /**
   * Calculate TODAY icon state
   * OFF: 0 urgent + 0 due + 0 watchlist for active pet
   * ON: Any of urgent/due/watchlist exists
   * PULSE: New urgent added OR watchlist item changed OR "Awaiting you" exists
   */
  const calculateTodayState = useCallback(() => {
    const { urgent = [], due = [], watchlist = [], awaitingYou = [] } = todayData;
    const total = urgent.length + due.length + watchlist.length;
    
    if (total === 0 && awaitingYou.length === 0) {
      return { state: ICON_STATE.OFF, count: 0 };
    }

    // Check for PULSE conditions
    const hasAwaitingYou = awaitingYou.length > 0;
    const lastVisit = getLastVisit(TAB_IDS.TODAY);
    const hasNewUrgent = urgent.some(item => 
      item.createdAt && new Date(item.createdAt).getTime() > lastVisit
    );

    if (hasAwaitingYou || hasNewUrgent) {
      return { state: ICON_STATE.PULSE, count: awaitingYou.length || urgent.length };
    }

    return { state: ICON_STATE.ON, count: total };
  }, [todayData, getLastVisit]);

  /**
   * Calculate SERVICES icon state
   * OFF: 0 active service tickets for active pet
   * ON: Any open/active tickets exist
   * PULSE: Ticket created OR status changed OR "Awaiting you" set
   */
  const calculateServicesState = useCallback(() => {
    const { activeTickets = [], awaitingYou = false, newTickets = [], statusChanges = [] } = servicesData;
    
    if (activeTickets.length === 0) {
      return { state: ICON_STATE.OFF, count: 0 };
    }

    // Check for PULSE conditions
    const lastVisit = getLastVisit(TAB_IDS.SERVICES);
    const hasNewTickets = newTickets.length > 0 || activeTickets.some(ticket => 
      ticket.createdAt && new Date(ticket.createdAt).getTime() > lastVisit
    );
    const hasStatusChanges = statusChanges.length > 0;

    if (awaitingYou || hasNewTickets || hasStatusChanges) {
      const pulseCount = awaitingYou ? 1 : (newTickets.length || statusChanges.length || 1);
      return { state: ICON_STATE.PULSE, count: pulseCount };
    }

    return { state: ICON_STATE.ON, count: activeTickets.length };
  }, [servicesData, getLastVisit]);

  /**
   * Calculate CONCIERGE icon state
   * OFF: Concierge offline AND no open threads
   * ON: Concierge online OR open threads exist
   * PULSE: New reply received OR "Awaiting you" set
   */
  const calculateConciergeState = useCallback(() => {
    const { isOnline = false, openThreads = [], newReplies = false, awaitingYou = false } = conciergeData;
    
    if (!isOnline && openThreads.length === 0) {
      return { state: ICON_STATE.OFF, count: 0 };
    }

    // Check for PULSE conditions
    if (newReplies || awaitingYou) {
      return { state: ICON_STATE.PULSE, count: 1 };
    }

    return { state: ICON_STATE.ON, count: openThreads.length || (isOnline ? 1 : 0) };
  }, [conciergeData]);

  /**
   * Calculate PICKS icon state
   * OFF: No picks (should be extremely rare)
   * ON: Picks exist
   * PULSE: Only when PICKS_MATERIAL_CHANGE fires (see Bible 2.4)
   */
  const calculatePicksState = useCallback(() => {
    const { items = [], hasNew = false, materialChange = false } = picksData;
    
    if (items.length === 0) {
      return { state: ICON_STATE.OFF, count: 0 };
    }

    // PULSE only on material change (rare)
    if (materialChange || hasNew) {
      return { state: ICON_STATE.PULSE, count: items.length };
    }

    return { state: ICON_STATE.ON, count: items.length };
  }, [picksData]);

  /**
   * Calculate LEARN icon state
   * OFF: No "For your pet" items
   * ON: "For your pet" shelf has items
   * PULSE: New item published for this pet since last visit
   */
  const calculateLearnState = useCallback(() => {
    const { forYourPetItems = [], newItems = false } = learnData;
    
    if (forYourPetItems.length === 0) {
      return { state: ICON_STATE.OFF, count: 0 };
    }

    // Check for PULSE
    const lastVisit = getLastVisit(TAB_IDS.LEARN);
    const hasNewSinceVisit = forYourPetItems.some(item =>
      item.publishedAt && new Date(item.publishedAt).getTime() > lastVisit
    );

    if (newItems || hasNewSinceVisit) {
      return { state: ICON_STATE.PULSE, count: forYourPetItems.length };
    }

    return { state: ICON_STATE.ON, count: forYourPetItems.length };
  }, [learnData, getLastVisit]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PET SWITCH HANDLING (Section 2.6)
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const prevPetId = prevPetIdRef.current;

    if (prevPetId && currentPetId && prevPetId !== currentPetId) {
      console.log(`[IconState] Pet switched: ${prevPetId} → ${currentPetId}`);
      console.log('[IconState] Resetting all icon states to OFF, then recalculating...');

      // Reset all states to OFF first (no cross-pet leakage)
      // Note: MOJO resets to ON (never OFF) since pet exists
      setIconStates({
        [TAB_IDS.MOJO]: { state: ICON_STATE.ON, count: 0 },
        [TAB_IDS.TODAY]: { state: ICON_STATE.OFF, count: 0 },
        [TAB_IDS.PICKS]: { state: ICON_STATE.OFF, count: 0 },
        [TAB_IDS.SERVICES]: { state: ICON_STATE.OFF, count: 0 },
        [TAB_IDS.LEARN]: { state: ICON_STATE.OFF, count: 0 },
        [TAB_IDS.CONCIERGE]: { state: ICON_STATE.OFF, count: 0 },
      });

      // Recalculate will happen in the next effect cycle when data updates
    }

    prevPetIdRef.current = currentPetId;
  }, [currentPetId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RECALCULATE STATES WHEN DATA CHANGES
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!currentPetId) return;

    const newStates = {
      [TAB_IDS.MOJO]: calculateMojoState(),
      [TAB_IDS.TODAY]: calculateTodayState(),
      [TAB_IDS.SERVICES]: calculateServicesState(),
      [TAB_IDS.CONCIERGE]: calculateConciergeState(),
      [TAB_IDS.PICKS]: calculatePicksState(),
      [TAB_IDS.LEARN]: calculateLearnState(),
    };

    setIconStates(prev => {
      // Only update if states actually changed
      const hasChanges = Object.keys(newStates).some(tabId => 
        prev[tabId]?.state !== newStates[tabId].state ||
        prev[tabId]?.count !== newStates[tabId].count
      );

      if (hasChanges) {
        console.log('[IconState] States recalculated:', 
          Object.entries(newStates).map(([k, v]) => `${k}:${v.state}`).join(', ')
        );
        return newStates;
      }
      return prev;
    });
  }, [currentPetId, calculateMojoState, calculateTodayState, calculateServicesState, calculateConciergeState, calculatePicksState, calculateLearnState]);

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE TAB VISIT (PULSE → ON)
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (activeTab) {
      markTabVisited(activeTab);
    }
  }, [activeTab, markTabVisited]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRIGGER EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Trigger PULSE for a specific tab
   * Call this when canonical trigger events fire
   */
  const triggerPulse = useCallback((tabId, count = 1) => {
    if (!currentPetId) return;

    console.log(`[IconState] PULSE triggered for ${tabId}`);
    
    setIconStates(prev => ({
      ...prev,
      [tabId]: { state: ICON_STATE.PULSE, count }
    }));
  }, [currentPetId]);

  /**
   * Force recalculation of all states
   * Call this after significant data changes
   */
  const recalculateAll = useCallback(() => {
    if (!currentPetId) return;

    const newStates = {
      [TAB_IDS.MOJO]: calculateMojoState(),
      [TAB_IDS.TODAY]: calculateTodayState(),
      [TAB_IDS.SERVICES]: calculateServicesState(),
      [TAB_IDS.CONCIERGE]: calculateConciergeState(),
      [TAB_IDS.PICKS]: calculatePicksState(),
      [TAB_IDS.LEARN]: calculateLearnState(),
    };

    console.log('[IconState] Force recalculate:', 
      Object.entries(newStates).map(([k, v]) => `${k}:${v.state}`).join(', ')
    );

    setIconStates(newStates);
  }, [currentPetId, calculateMojoState, calculateTodayState, calculateServicesState, calculateConciergeState, calculatePicksState, calculateLearnState]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN API
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // Current states
    iconStates,
    
    // Individual state getters
    mojoState: iconStates[TAB_IDS.MOJO],
    todayState: iconStates[TAB_IDS.TODAY],
    servicesState: iconStates[TAB_IDS.SERVICES],
    conciergeState: iconStates[TAB_IDS.CONCIERGE],
    picksState: iconStates[TAB_IDS.PICKS],
    learnState: iconStates[TAB_IDS.LEARN],

    // Actions
    markTabVisited,
    triggerPulse,
    recalculateAll,

    // Helpers
    getLastVisit,

    // Constants
    ICON_STATE,
    TAB_IDS,
  };
};

export default useIconState;

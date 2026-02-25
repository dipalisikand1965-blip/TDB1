/**
 * useLayerNavigation.js
 * =====================
 * Bridge hook that connects the LayerContext with MiraDemoPage's existing state.
 * 
 * This provides a migration path from the current state-based navigation
 * to the Bible-compliant Layer Manager while maintaining backward compatibility.
 * 
 * Per PET_OS_BEHAVIOR_BIBLE v1.1:
 * - Tab switch clears detail layers
 * - Commit actions always return to CHAT_HOME
 * - Back button respects: EPHEMERAL → DETAIL → PRIMARY → CHAT_HOME
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useLayer, LAYER_CLASS } from '../../context/LayerContext';

// Map existing panel states to Layer IDs
const PANEL_TO_LAYER = {
  showMojoModal: 'MOJO',
  showTodayPanel: 'TODAY',
  showTopPicksPanel: 'PICKS',
  showServicesPanel: 'SERVICES',
  showLearnPanel: 'LEARN',
  showConciergeHome: 'CONCIERGE',
  showInsightsPanel: 'INSIGHT_DETAIL',
  showConciergePanel: 'THREAD_DETAIL',
  showHelpModal: 'HELP_MODAL',
  showSoulFormModal: 'SOUL_FORM',
  requestBuilderState: 'SERVICE_REQUEST',
};

// Map OS tab IDs to Layer IDs
const TAB_TO_LAYER = {
  mojo: 'MOJO',
  today: 'TODAY',
  picks: 'PICKS',
  services: 'SERVICES',
  learn: 'LEARN',
  concierge: 'CONCIERGE',
};

/**
 * useLayerNavigation - Hook to manage OS navigation with Layer Manager
 * 
 * Provides:
 * - handleTabChange: Switch tabs (clears detail layers)
 * - handleBack: Smart back button
 * - handleCommit: Commit action + return to chat
 * - openDetail: Open a detail layer
 * - openEphemeral: Open a modal/sheet
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.onReturnToChat - Callback when returning to CHAT_HOME
 * @param {Object} options.legacySetters - Object containing legacy setState functions for migration
 */
const useLayerNavigation = ({ onReturnToChat, legacySetters = {} } = {}) => {
  const {
    stack,
    currentLayer,
    currentPrimary,
    isAtChatHome,
    hasEphemeralOpen,
    openLayer,
    switchTab,
    closeTop,
    closeLayer,
    back,
    returnToChat,
    commitAction,
    isLayerOpen,
    getLayerData,
    LAYER_REGISTRY,
  } = useLayer();

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB NAVIGATION (Bible Section 1.4: Tab switching)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle tab change - switches to new PRIMARY layer
   * Per Bible: Clears any DETAIL layers when switching tabs
   */
  const handleTabChange = useCallback((tabId) => {
    const layerId = TAB_TO_LAYER[tabId];
    if (!layerId) {
      console.warn(`[useLayerNavigation] Unknown tab: ${tabId}`);
      return;
    }

    // If clicking same tab, close it (return to CHAT_HOME)
    if (currentPrimary === layerId) {
      returnToChat();
      onReturnToChat?.();
      return;
    }

    // Switch to new tab (Layer Manager handles clearing detail layers)
    switchTab(layerId);
  }, [currentPrimary, switchTab, returnToChat, onReturnToChat]);

  /**
   * Get the current active tab ID (for UI highlighting)
   */
  const activeTab = useMemo(() => {
    if (!currentPrimary) return null;
    
    // Reverse lookup: LAYER_ID → tab ID
    const entry = Object.entries(TAB_TO_LAYER).find(([, layerId]) => layerId === currentPrimary);
    return entry ? entry[0] : null;
  }, [currentPrimary]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DETAIL LAYERS (Bible Section 0.1: Detail layers)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Open a detail layer (drill-in from a PRIMARY)
   * Per Bible: Max 2 depth (PRIMARY + DETAIL)
   */
  const openDetail = useCallback((detailType, data = null) => {
    const validDetails = ['TASK_DETAIL', 'LEARN_ITEM', 'INSIGHT_DETAIL', 'THREAD_DETAIL', 'SERVICE_DETAIL', 'MOJO_SECTION'];
    
    if (!validDetails.includes(detailType)) {
      console.warn(`[useLayerNavigation] Unknown detail type: ${detailType}`);
      return;
    }

    // Must have a PRIMARY open to add a DETAIL
    if (!currentPrimary) {
      console.warn(`[useLayerNavigation] Cannot open DETAIL without a PRIMARY layer`);
      return;
    }

    openLayer(detailType, data);
  }, [currentPrimary, openLayer]);

  /**
   * Check if a detail layer is currently open
   */
  const hasDetailOpen = useMemo(() => {
    return stack.some(layer => layer.class === LAYER_CLASS.DETAIL);
  }, [stack]);

  // ═══════════════════════════════════════════════════════════════════════════
  // EPHEMERAL LAYERS (Bible Section 0.1: Modals, sheets)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Open an ephemeral overlay (modal, bottom sheet, picker)
   * Per Bible: These don't count toward stack depth
   */
  const openEphemeral = useCallback((ephemeralType, data = null) => {
    const validEphemerals = ['MODAL', 'BOTTOM_SHEET', 'PICKER', 'CONFIRMATION', 'HELP_MODAL', 'SOUL_FORM', 'SERVICE_REQUEST', 'HEALTH_WIZARD'];
    
    if (!validEphemerals.includes(ephemeralType)) {
      console.warn(`[useLayerNavigation] Unknown ephemeral type: ${ephemeralType}`);
      return;
    }

    openLayer(ephemeralType, data);
  }, [openLayer]);

  /**
   * Close the topmost ephemeral (without affecting main stack)
   */
  const closeEphemeral = useCallback(() => {
    if (hasEphemeralOpen) {
      closeTop();
    }
  }, [hasEphemeralOpen, closeTop]);

  // ═══════════════════════════════════════════════════════════════════════════
  // BACK NAVIGATION (Bible Section 1.6)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle back action - respects proper close order
   * Order: EPHEMERAL → DETAIL → PRIMARY → CHAT_HOME
   */
  const handleBack = useCallback(() => {
    const result = back();
    
    // If we closed a PRIMARY and returned to chat, notify
    if (result.action === 'closed_primary') {
      onReturnToChat?.();
    }
    
    return result;
  }, [back, onReturnToChat]);

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMIT ACTIONS (Bible Section 1.5)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Handle commit action - performs action then returns to CHAT_HOME
   * Per Bible: Every commit action returns to chat
   * 
   * Commit actions include:
   * - Ticket created/submitted
   * - Option chosen/approved
   * - Payment confirmed
   * - Message sent to Concierge thread
   * - Insight saved/edited
   * - Learn item saved/action taken
   */
  const handleCommit = useCallback(async (action, actionName = 'commit') => {
    const result = await commitAction(action, actionName);
    
    if (result.success) {
      onReturnToChat?.();
    }
    
    return result;
  }, [commitAction, onReturnToChat]);

  /**
   * Simple commit - just returns to chat without running an action
   * Use this after form submissions handled externally
   */
  const commitAndReturn = useCallback(() => {
    const hadLayers = returnToChat();
    if (hadLayers) {
      onReturnToChat?.();
    }
    return hadLayers;
  }, [returnToChat, onReturnToChat]);

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD SUPPORT (Bible Section 1.4: ESC key)
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleBack]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN VALUE
  // ═══════════════════════════════════════════════════════════════════════════

  return {
    // State
    activeTab,
    currentLayer,
    currentPrimary,
    isAtChatHome,
    hasDetailOpen,
    hasEphemeralOpen,
    stack,

    // Tab Navigation
    handleTabChange,

    // Detail Layers
    openDetail,

    // Ephemeral Layers
    openEphemeral,
    closeEphemeral,

    // Back Navigation
    handleBack,

    // Commit Actions
    handleCommit,
    commitAndReturn,

    // Direct Layer Access
    openLayer,
    closeTop,
    closeLayer,
    returnToChat,
    isLayerOpen,
    getLayerData,
  };
};

export default useLayerNavigation;

/**
 * LayerContext.jsx
 * =================
 * PET OS Layer Manager - The Navigation Foundation
 * 
 * Per PET_OS_BEHAVIOR_BIBLE v1.1:
 * - 3 Layer Classes: PRIMARY (tabs), DETAIL (drill-ins), EPHEMERAL (modals)
 * - Max stack depth = 2 (PRIMARY + DETAIL only, EPHEMERAL excluded)
 * - Tab switch clears detail layers (clean slate per tab)
 * - Commit actions always return to CHAT_HOME
 * - Back button order: EPHEMERAL → DETAIL → PRIMARY → CHAT_HOME
 * 
 * Stack Rules:
 * - CHAT_HOME is always the root (never in stack, always underneath)
 * - Only one PRIMARY can be open at a time
 * - DETAIL layers stack on top of their parent PRIMARY
 * - EPHEMERAL overlays float above everything (don't affect stack)
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER CLASSIFICATION (Per Bible Section 0.1)
// ═══════════════════════════════════════════════════════════════════════════════

const LAYER_CLASS = {
  PRIMARY: 'PRIMARY',
  DETAIL: 'DETAIL', 
  EPHEMERAL: 'EPHEMERAL',
};

// Layer definitions - maps layer ID to its class
const LAYER_REGISTRY = {
  // PRIMARY LAYERS (tabs) - only one open at a time
  MOJO: LAYER_CLASS.PRIMARY,
  TODAY: LAYER_CLASS.PRIMARY,
  PICKS: LAYER_CLASS.PRIMARY,
  SERVICES: LAYER_CLASS.PRIMARY,
  LEARN: LAYER_CLASS.PRIMARY,
  CONCIERGE: LAYER_CLASS.PRIMARY,
  
  // DETAIL LAYERS (drill-ins) - stack on parent PRIMARY
  TASK_DETAIL: LAYER_CLASS.DETAIL,
  LEARN_ITEM: LAYER_CLASS.DETAIL,
  INSIGHT_DETAIL: LAYER_CLASS.DETAIL,
  THREAD_DETAIL: LAYER_CLASS.DETAIL,
  SERVICE_DETAIL: LAYER_CLASS.DETAIL,
  MOJO_SECTION: LAYER_CLASS.DETAIL,
  
  // EPHEMERAL LAYERS (modals, sheets) - don't count toward depth
  MODAL: LAYER_CLASS.EPHEMERAL,
  BOTTOM_SHEET: LAYER_CLASS.EPHEMERAL,
  PICKER: LAYER_CLASS.EPHEMERAL,
  CONFIRMATION: LAYER_CLASS.EPHEMERAL,
  HELP_MODAL: LAYER_CLASS.EPHEMERAL,
  SOUL_FORM: LAYER_CLASS.EPHEMERAL,
  SERVICE_REQUEST: LAYER_CLASS.EPHEMERAL,
  HEALTH_WIZARD: LAYER_CLASS.EPHEMERAL,
};

// Maximum stack depth (PRIMARY + DETAIL only)
const MAX_STACK_DEPTH = 2;

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT DEFINITION
// ═══════════════════════════════════════════════════════════════════════════════

const LayerContext = createContext(null);

/**
 * LayerProvider - Wraps the app to provide layer management
 */
export const LayerProvider = ({ children }) => {
  // Stack of open layers (excluding EPHEMERAL)
  // Format: [{ id: 'SERVICES', class: 'PRIMARY', parent: null }, { id: 'TASK_DETAIL', class: 'DETAIL', parent: 'SERVICES' }]
  const [stack, setStack] = useState([]);
  
  // Separate tracking for ephemeral overlays (modals, sheets)
  // Format: [{ id: 'HELP_MODAL', data: {...} }, ...]
  const [ephemeralStack, setEphemeralStack] = useState([]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Current topmost layer (PRIMARY or DETAIL)
  const currentLayer = useMemo(() => {
    if (stack.length === 0) return null;
    return stack[stack.length - 1];
  }, [stack]);
  
  // Current PRIMARY layer (the active tab)
  const currentPrimary = useMemo(() => {
    const primary = stack.find(layer => layer.class === LAYER_CLASS.PRIMARY);
    return primary?.id || null;
  }, [stack]);
  
  // Stack depth (PRIMARY + DETAIL only)
  const stackDepth = useMemo(() => {
    return stack.filter(l => l.class !== LAYER_CLASS.EPHEMERAL).length;
  }, [stack]);
  
  // Is at CHAT_HOME (no layers open)
  const isAtChatHome = useMemo(() => {
    return stack.length === 0 && ephemeralStack.length === 0;
  }, [stack, ephemeralStack]);
  
  // Has ephemeral overlay open
  const hasEphemeralOpen = useMemo(() => {
    return ephemeralStack.length > 0;
  }, [ephemeralStack]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Open a layer
   * @param {string} layerId - Layer identifier (from LAYER_REGISTRY)
   * @param {object} data - Optional data to pass to the layer
   */
  const openLayer = useCallback((layerId, data = null) => {
    const layerClass = LAYER_REGISTRY[layerId];
    
    if (!layerClass) {
      console.warn(`[LayerManager] Unknown layer: ${layerId}`);
      return;
    }
    
    // Handle EPHEMERAL separately
    if (layerClass === LAYER_CLASS.EPHEMERAL) {
      setEphemeralStack(prev => [...prev, { id: layerId, data }]);
      console.log(`[LayerManager] Opened ephemeral: ${layerId}`);
      return;
    }
    
    // Handle PRIMARY (tab switch)
    if (layerClass === LAYER_CLASS.PRIMARY) {
      // Close any existing PRIMARY and its DETAIL children
      // Then open the new PRIMARY
      setStack([{ id: layerId, class: LAYER_CLASS.PRIMARY, parent: null, data }]);
      console.log(`[LayerManager] Switched to tab: ${layerId}`);
      return;
    }
    
    // Handle DETAIL
    if (layerClass === LAYER_CLASS.DETAIL) {
      setStack(prev => {
        // Find current PRIMARY (parent for this DETAIL)
        const currentPrimaryLayer = prev.find(l => l.class === LAYER_CLASS.PRIMARY);
        
        if (!currentPrimaryLayer) {
          console.warn(`[LayerManager] Cannot open DETAIL without a PRIMARY layer`);
          return prev;
        }
        
        // Check stack depth (exclude EPHEMERAL from count)
        const nonEphemeralCount = prev.filter(l => l.class !== LAYER_CLASS.EPHEMERAL).length;
        
        if (nonEphemeralCount >= MAX_STACK_DEPTH) {
          // Replace the topmost DETAIL instead of adding
          const filtered = prev.filter(l => l.class !== LAYER_CLASS.DETAIL);
          console.log(`[LayerManager] Max depth reached, replacing DETAIL: ${layerId}`);
          return [...filtered, { id: layerId, class: LAYER_CLASS.DETAIL, parent: currentPrimaryLayer.id, data }];
        }
        
        // Add DETAIL to stack
        console.log(`[LayerManager] Opened detail: ${layerId} (parent: ${currentPrimaryLayer.id})`);
        return [...prev, { id: layerId, class: LAYER_CLASS.DETAIL, parent: currentPrimaryLayer.id, data }];
      });
    }
  }, []);
  
  /**
   * Switch to a different tab (PRIMARY layer)
   * Per Bible: Tab switch clears detail layers (clean slate)
   * @param {string} tabId - Tab identifier (MOJO, TODAY, PICKS, SERVICES, LEARN, CONCIERGE)
   */
  const switchTab = useCallback((tabId) => {
    const layerClass = LAYER_REGISTRY[tabId];
    
    if (layerClass !== LAYER_CLASS.PRIMARY) {
      console.warn(`[LayerManager] switchTab called with non-PRIMARY layer: ${tabId}`);
      return;
    }
    
    setStack(prev => {
      const currentPrimaryLayer = prev.find(l => l.class === LAYER_CLASS.PRIMARY);
      
      // If tapping same tab, close it (return to CHAT_HOME)
      if (currentPrimaryLayer?.id === tabId) {
        console.log(`[LayerManager] Same tab tapped, closing: ${tabId}`);
        return [];
      }
      
      // Switch to new tab (clears any DETAIL layers)
      console.log(`[LayerManager] Tab switch: ${currentPrimaryLayer?.id || 'CHAT_HOME'} → ${tabId}`);
      return [{ id: tabId, class: LAYER_CLASS.PRIMARY, parent: null, data: null }];
    });
  }, []);
  
  /**
   * Close the topmost layer
   * Order: EPHEMERAL first → DETAIL → PRIMARY
   */
  const closeTop = useCallback(() => {
    // First check ephemeral stack
    if (ephemeralStack.length > 0) {
      const closing = ephemeralStack[ephemeralStack.length - 1];
      setEphemeralStack(prev => prev.slice(0, -1));
      console.log(`[LayerManager] Closed ephemeral: ${closing.id}`);
      return;
    }
    
    // Then check main stack
    if (stack.length > 0) {
      const closing = stack[stack.length - 1];
      setStack(prev => prev.slice(0, -1));
      console.log(`[LayerManager] Closed layer: ${closing.id}`);
      return;
    }
    
    console.log(`[LayerManager] Already at CHAT_HOME`);
  }, [stack, ephemeralStack]);
  
  /**
   * Close a specific layer by ID
   * @param {string} layerId - Layer to close
   */
  const closeLayer = useCallback((layerId) => {
    // Check ephemeral first
    const ephemeralIndex = ephemeralStack.findIndex(l => l.id === layerId);
    if (ephemeralIndex !== -1) {
      setEphemeralStack(prev => prev.filter(l => l.id !== layerId));
      console.log(`[LayerManager] Closed specific ephemeral: ${layerId}`);
      return;
    }
    
    // Check main stack
    const stackIndex = stack.findIndex(l => l.id === layerId);
    if (stackIndex !== -1) {
      // If closing a PRIMARY, close all its children too
      const layer = stack[stackIndex];
      if (layer.class === LAYER_CLASS.PRIMARY) {
        setStack([]);
        console.log(`[LayerManager] Closed PRIMARY and children: ${layerId}`);
      } else {
        setStack(prev => prev.filter(l => l.id !== layerId));
        console.log(`[LayerManager] Closed specific layer: ${layerId}`);
      }
    }
  }, [stack, ephemeralStack]);
  
  /**
   * Back action - respects proper close order
   * Per Bible Section 1.6:
   * - If EPHEMERAL open → close EPHEMERAL only
   * - If DETAIL open → close DETAIL → return to PRIMARY
   * - If PRIMARY open → close PRIMARY → return to CHAT_HOME
   * - If at CHAT_HOME → no-op (or show "tap again to exit" on mobile)
   */
  const back = useCallback(() => {
    // 1. Close ephemeral first
    if (ephemeralStack.length > 0) {
      const closing = ephemeralStack[ephemeralStack.length - 1];
      setEphemeralStack(prev => prev.slice(0, -1));
      console.log(`[LayerManager] Back: closed ephemeral ${closing.id}`);
      return { action: 'closed_ephemeral', layer: closing.id };
    }
    
    // 2. Close DETAIL if open
    const topLayer = stack[stack.length - 1];
    if (topLayer?.class === LAYER_CLASS.DETAIL) {
      setStack(prev => prev.slice(0, -1));
      console.log(`[LayerManager] Back: closed detail ${topLayer.id}`);
      return { action: 'closed_detail', layer: topLayer.id };
    }
    
    // 3. Close PRIMARY if open
    if (topLayer?.class === LAYER_CLASS.PRIMARY) {
      setStack([]);
      console.log(`[LayerManager] Back: closed primary ${topLayer.id}, returning to CHAT_HOME`);
      return { action: 'closed_primary', layer: topLayer.id };
    }
    
    // 4. Already at CHAT_HOME
    console.log(`[LayerManager] Back: already at CHAT_HOME`);
    return { action: 'at_chat_home', layer: null };
  }, [stack, ephemeralStack]);
  
  /**
   * Return to CHAT_HOME - clears ALL layers
   * Per Bible Section 1.5: Called after every commit action
   * (ticket submit, option choose, payment confirm, insight save, etc.)
   */
  const returnToChat = useCallback(() => {
    const hadLayers = stack.length > 0 || ephemeralStack.length > 0;
    
    setStack([]);
    setEphemeralStack([]);
    
    if (hadLayers) {
      console.log(`[LayerManager] Returned to CHAT_HOME (cleared all layers)`);
    }
    
    return hadLayers;
  }, [stack, ephemeralStack]);
  
  /**
   * Commit action handler - performs action then returns to chat
   * Use this wrapper for all "commit" actions per Bible Section 1.5
   * @param {Function} action - The action to perform
   * @param {string} actionName - Name for logging
   */
  const commitAction = useCallback(async (action, actionName = 'commit') => {
    try {
      // Perform the action
      const result = await action();
      
      // Always return to CHAT_HOME after commit
      returnToChat();
      
      console.log(`[LayerManager] Commit action completed: ${actionName}`);
      return { success: true, result };
    } catch (error) {
      console.error(`[LayerManager] Commit action failed: ${actionName}`, error);
      return { success: false, error };
    }
  }, [returnToChat]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // QUERY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Check if a specific layer is currently open
   */
  const isLayerOpen = useCallback((layerId) => {
    return stack.some(l => l.id === layerId) || ephemeralStack.some(l => l.id === layerId);
  }, [stack, ephemeralStack]);
  
  /**
   * Get data passed to a layer
   */
  const getLayerData = useCallback((layerId) => {
    const layer = stack.find(l => l.id === layerId) || ephemeralStack.find(l => l.id === layerId);
    return layer?.data || null;
  }, [stack, ephemeralStack]);
  
  /**
   * Get all open layers (for debugging)
   */
  const getAllLayers = useCallback(() => {
    return {
      stack: [...stack],
      ephemeral: [...ephemeralStack],
    };
  }, [stack, ephemeralStack]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTEXT VALUE
  // ═══════════════════════════════════════════════════════════════════════════
  
  const value = useMemo(() => ({
    // State
    stack,
    ephemeralStack,
    currentLayer,
    currentPrimary,
    stackDepth,
    isAtChatHome,
    hasEphemeralOpen,
    
    // Actions
    openLayer,
    switchTab,
    closeTop,
    closeLayer,
    back,
    returnToChat,
    commitAction,
    
    // Queries
    isLayerOpen,
    getLayerData,
    getAllLayers,
    
    // Constants (for consumers)
    LAYER_CLASS,
    LAYER_REGISTRY,
    MAX_STACK_DEPTH,
  }), [
    stack,
    ephemeralStack,
    currentLayer,
    currentPrimary,
    stackDepth,
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
    getAllLayers,
  ]);
  
  return (
    <LayerContext.Provider value={value}>
      {children}
    </LayerContext.Provider>
  );
};

/**
 * useLayer - Hook to access layer management
 */
export const useLayer = () => {
  const context = useContext(LayerContext);
  
  if (!context) {
    throw new Error('useLayer must be used within a LayerProvider');
  }
  
  return context;
};

/**
 * useCommitAction - Convenience hook for commit actions
 * Automatically returns to CHAT_HOME after the action completes
 */
export const useCommitAction = () => {
  const { commitAction, returnToChat } = useLayer();
  return { commitAction, returnToChat };
};

// Export constants for external use
export { LAYER_CLASS, LAYER_REGISTRY, MAX_STACK_DEPTH };

export default LayerContext;

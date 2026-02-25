/**
 * useVault - Vault Management Hook for Mira
 * ==========================================
 * Handles:
 * - Mira Picks (products, services curated by Mira)
 * - Engine Picks (from B6 Picks Engine - auto-refreshes every turn)
 * - Vault visibility and state
 * - Vault data management
 * 
 * Extracted from MiraDemoPage.jsx - Stage 2 Refactoring
 * Updated: Feb 2026 - Added Picks Engine integration (B6)
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * useVault Hook
 * 
 * @returns {Object} Vault state and controls
 */
const useVault = () => {
  // Vault visibility
  const [showVault, setShowVault] = useState(false);
  const [activeVaultData, setActiveVaultData] = useState(null);
  const [vaultUserMessage, setVaultUserMessage] = useState('');
  
  // Mira Picks - Products/services curated by Mira for the user
  // Now includes enginePicks from Picks Engine (B6)
  const [miraPicks, setMiraPicks] = useState({
    // Legacy picks (from product search)
    products: [],
    services: [],
    context: '',
    hasNew: false,
    // NEW: Picks Engine data (B6)
    enginePicks: [],        // All picks from engine
    engineProducts: [],     // Product-type picks
    engineServices: [],     // Service-type picks (booking, guide, concierge)
    activePillar: null,     // Current pillar from classification
    concierge: null,        // Concierge prominence decision
    safetyOverride: null,   // Emergency/caution state
    missingProfileFields: [], // For micro-questions
    lastUpdated: null,      // Timestamp for "Updated just now"
    // NEW: Conversation context for context-aware picks
    conversationContext: null // { topic: "goa trip", destination: "Goa" }
  });
  
  // Mira Tray visibility (the floating picks indicator)
  const [showMiraTray, setShowMiraTray] = useState(false);
  
  // Clear all picks (used when switching pets or starting new conversation)
  const clearPicks = useCallback(() => {
    setMiraPicks({
      products: [],
      services: [],
      context: '',
      hasNew: false,
      enginePicks: [],
      engineProducts: [],
      engineServices: [],
      activePillar: null,
      concierge: null,
      safetyOverride: null,
      missingProfileFields: [],
      lastUpdated: null,
      conversationContext: null
    });
  }, []);
  
  // Update conversation context (for context-aware picks)
  const updateConversationContext = useCallback((topic, destination = null) => {
    console.log(`[PICKS] Updating conversation context: ${topic}${destination ? ` → ${destination}` : ''}`);
    setMiraPicks(prev => ({
      ...prev,
      conversationContext: { topic, destination },
      hasNew: true // Trigger refresh indicator
    }));
  }, []);
  
  // Add new picks from Mira's response (legacy)
  const updatePicks = useCallback((products = [], services = [], context = '') => {
    setMiraPicks(prev => ({
      ...prev,
      products: products.length > 0 ? products : prev.products,
      services: services.length > 0 ? services : prev.services,
      context: context || prev.context,
      hasNew: products.length > 0 || services.length > 0
    }));
  }, []);
  
  // Mark picks as seen (remove the "new" indicator)
  const markPicksSeen = useCallback(() => {
    setMiraPicks(prev => ({ ...prev, hasNew: false }));
  }, []);
  
  // Open the vault with specific data
  const openVault = useCallback((data, userMessage = '') => {
    setActiveVaultData(data);
    setVaultUserMessage(userMessage);
    setShowVault(true);
  }, []);
  
  // Close the vault
  const closeVault = useCallback(() => {
    setShowVault(false);
    setActiveVaultData(null);
    setVaultUserMessage('');
  }, []);
  
  // Check if there are any picks (includes engine picks)
  const hasPicks = useCallback(() => {
    const legacyCount = (miraPicks.products?.length || 0) + (miraPicks.services?.length || 0);
    const engineCount = miraPicks.enginePicks?.length || 0;
    return legacyCount > 0 || engineCount > 0;
  }, [miraPicks]);
  
  // Get total picks count (includes engine picks)
  const getPicksCount = useCallback(() => {
    const legacyCount = (miraPicks.products?.length || 0) + (miraPicks.services?.length || 0);
    const engineCount = miraPicks.enginePicks?.length || 0;
    // Prefer engine picks if available
    return engineCount > 0 ? engineCount : legacyCount;
  }, [miraPicks]);
  
  // NEW: Get combined picks for display (engine picks take precedence)
  const getCombinedPicks = useMemo(() => {
    if (miraPicks.enginePicks?.length > 0) {
      return miraPicks.enginePicks;
    }
    // Fallback to legacy picks
    return [
      ...(miraPicks.products || []).map(p => ({ ...p, type: 'product', source: 'legacy' })),
      ...(miraPicks.services || []).map(s => ({ ...s, type: 'service', source: 'legacy' }))
    ];
  }, [miraPicks]);
  
  // NEW: Get "Updated just now" text
  const getLastUpdatedText = useMemo(() => {
    if (!miraPicks.lastUpdated) return null;
    const diff = Date.now() - new Date(miraPicks.lastUpdated).getTime();
    if (diff < 60000) return 'Updated just now';
    if (diff < 300000) return 'Updated a few minutes ago';
    return null;
  }, [miraPicks.lastUpdated]);
  
  // NEW: Check if in safety mode
  const isInSafetyMode = useMemo(() => {
    return miraPicks.safetyOverride?.active || false;
  }, [miraPicks.safetyOverride]);
  
  // NEW: Get safety level
  const getSafetyLevel = useMemo(() => {
    return miraPicks.safetyOverride?.level || 'normal';
  }, [miraPicks.safetyOverride]);
  
  return {
    // Vault visibility
    showVault,
    setShowVault,
    activeVaultData,
    setActiveVaultData,
    vaultUserMessage,
    setVaultUserMessage,
    
    // Mira Picks
    miraPicks,
    setMiraPicks,
    
    // Mira Tray
    showMiraTray,
    setShowMiraTray,
    
    // Actions
    clearPicks,
    updatePicks,
    markPicksSeen,
    openVault,
    closeVault,
    updateConversationContext, // NEW: For context-aware picks
    
    // Helpers
    hasPicks,
    getPicksCount,
    
    // NEW: Engine picks helpers
    getCombinedPicks,
    getLastUpdatedText,
    isInSafetyMode,
    getSafetyLevel
  };
};

export default useVault;

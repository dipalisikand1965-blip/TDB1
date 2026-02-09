/**
 * useVault - Vault Management Hook for Mira
 * ==========================================
 * Handles:
 * - Mira Picks (products, services curated by Mira)
 * - Vault visibility and state
 * - Vault data management
 * 
 * Extracted from MiraDemoPage.jsx - Stage 2 Refactoring
 */

import { useState, useCallback } from 'react';

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
  const [miraPicks, setMiraPicks] = useState({
    products: [],
    services: [],
    context: '',
    hasNew: false
  });
  
  // Mira Tray visibility (the floating picks indicator)
  const [showMiraTray, setShowMiraTray] = useState(false);
  
  // Clear all picks (used when switching pets or starting new conversation)
  const clearPicks = useCallback(() => {
    setMiraPicks({
      products: [],
      services: [],
      context: '',
      hasNew: false
    });
  }, []);
  
  // Add new picks from Mira's response
  const updatePicks = useCallback((products = [], services = [], context = '') => {
    setMiraPicks(prev => ({
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
  
  // Check if there are any picks
  const hasPicks = useCallback(() => {
    return (miraPicks.products?.length || 0) + (miraPicks.services?.length || 0) > 0;
  }, [miraPicks]);
  
  // Get total picks count
  const getPicksCount = useCallback(() => {
    return (miraPicks.products?.length || 0) + (miraPicks.services?.length || 0);
  }, [miraPicks]);
  
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
    
    // Helpers
    hasPicks,
    getPicksCount
  };
};

export default useVault;

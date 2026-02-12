/**
 * useMiraUI Hook - UI State Management
 * 
 * Extracted from MiraDemoPage.jsx - Phase 2B Refactoring
 * Manages modals, panels, processing states, and UI modes
 * 
 * States managed:
 * - Modals: showHelpModal, showLearnModal
 * - Panels: showTopPicksPanel, showInsightsPanel, showConciergePanel, showConciergeOptions
 * - Processing: isTyping, showSkeleton, isProcessing
 * - Mira mode: miraMode ('ready' | 'instant' | 'thinking' | 'comfort' | 'emergency')
 * - Feature showcase: showFeatureShowcase
 */

import { useState, useCallback } from 'react';

/**
 * useMiraUI Hook
 * @returns {Object} UI state and handlers
 */
const useMiraUI = () => {
  // ═══════════════════════════════════════════════════════════════════════════════
  // MODAL STATES
  // ═══════════════════════════════════════════════════════════════════════════════
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PANEL STATES
  // ═══════════════════════════════════════════════════════════════════════════════
  // TOP PICKS PANEL: Personalized picks across all pillars
  const [showTopPicksPanel, setShowTopPicksPanel] = useState(false);
  
  // INSIGHTS PANEL: Shows pet insights and analytics
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  
  // CONCIERGE PANEL: Manual concierge contact options
  const [showConciergePanel, setShowConciergePanel] = useState(false);
  
  // CONCIERGE OPTIONS: Dropdown for concierge contact methods
  const [showConciergeOptions, setShowConciergeOptions] = useState(false);
  
  // UNIFIED VAULT: Tabbed interface for picks
  const [showUnifiedVault, setShowUnifiedVault] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // PROCESSING STATES
  // ═══════════════════════════════════════════════════════════════════════════════
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // MIRA MODE
  // ═══════════════════════════════════════════════════════════════════════════════
  // Modes: 'ready' | 'instant' | 'thinking' | 'comfort' | 'emergency'
  const [miraMode, setMiraMode] = useState('ready');
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FEATURE SHOWCASE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [showFeatureShowcase, setShowFeatureShowcase] = useState(true);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // HELPER FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  /**
   * Close all modals
   */
  const closeAllModals = useCallback(() => {
    setShowHelpModal(false);
    setShowLearnModal(false);
  }, []);
  
  /**
   * Close all panels
   */
  const closeAllPanels = useCallback(() => {
    setShowTopPicksPanel(false);
    setShowInsightsPanel(false);
    setShowConciergePanel(false);
    setShowConciergeOptions(false);
    setShowUnifiedVault(false);
  }, []);
  
  /**
   * Toggle insights panel (closes concierge if open)
   */
  const toggleInsightsPanel = useCallback(() => {
    setShowInsightsPanel(prev => !prev);
    setShowConciergePanel(false);
  }, []);
  
  /**
   * Toggle concierge panel (closes insights if open)
   */
  const toggleConciergePanel = useCallback(() => {
    setShowConciergePanel(prev => !prev);
    setShowInsightsPanel(false);
  }, []);
  
  /**
   * Start processing state (shows skeleton after delay)
   */
  const startProcessing = useCallback(() => {
    setIsProcessing(true);
    // Show skeleton after 800ms if still processing
    const timer = setTimeout(() => {
      setShowSkeleton(true);
    }, 800);
    return timer;
  }, []);
  
  /**
   * End processing state
   */
  const endProcessing = useCallback(() => {
    setIsProcessing(false);
    setShowSkeleton(false);
    setIsTyping(false);
  }, []);
  
  /**
   * Reset all UI to initial state
   */
  const resetUI = useCallback(() => {
    closeAllModals();
    closeAllPanels();
    endProcessing();
    setMiraMode('ready');
    setShowFeatureShowcase(true);
  }, [closeAllModals, closeAllPanels, endProcessing]);
  
  return {
    // Modal States
    showHelpModal,
    setShowHelpModal,
    showLearnModal,
    setShowLearnModal,
    
    // Panel States
    showTopPicksPanel,
    setShowTopPicksPanel,
    showInsightsPanel,
    setShowInsightsPanel,
    showConciergePanel,
    setShowConciergePanel,
    showConciergeOptions,
    setShowConciergeOptions,
    showUnifiedVault,
    setShowUnifiedVault,
    
    // Processing States
    isProcessing,
    setIsProcessing,
    isTyping,
    setIsTyping,
    showSkeleton,
    setShowSkeleton,
    
    // Mira Mode
    miraMode,
    setMiraMode,
    
    // Feature Showcase
    showFeatureShowcase,
    setShowFeatureShowcase,
    
    // Helpers
    closeAllModals,
    closeAllPanels,
    toggleInsightsPanel,
    toggleConciergePanel,
    startProcessing,
    endProcessing,
    resetUI
  };
};

export default useMiraUI;

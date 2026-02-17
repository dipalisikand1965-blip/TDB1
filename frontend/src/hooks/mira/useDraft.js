/**
 * useDraft.js
 * ===========
 * Pet-Scoped Draft Persistence Hook - Per PET_OS_BEHAVIOR_BIBLE v1.1 Section 3.2
 * 
 * Rules:
 * - Navigate to any layer → draft preserved
 * - App background/close → preserved for 30 minutes
 * - Reconnect/offline → preserved
 * - Pet switch → preserved as pet-scoped draft, not deleted
 * - Each pet has its own draft buffer
 * - On pet switch, show banner: "Draft saved for Lola. Now chatting about Bruno."
 * - If draft contains pet names, offer: "Send this for Lola or Bruno?"
 * 
 * Storage: localStorage['mira_drafts'] = { [petId]: { text, expiresAt, petName } }
 * TTL: 30 min sliding window (extends on every edit)
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// Draft TTL: 30 minutes sliding window
const DRAFT_TTL_MS = 30 * 60 * 1000;

// Storage key
const STORAGE_KEY = 'mira_drafts';

/**
 * Load drafts from localStorage
 */
const loadDrafts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return {};
    
    const drafts = JSON.parse(stored);
    const now = Date.now();
    
    // Filter out expired drafts
    const validDrafts = {};
    for (const [petId, draft] of Object.entries(drafts)) {
      if (draft.expiresAt > now) {
        validDrafts[petId] = draft;
      }
    }
    
    // Save filtered drafts back if any were removed
    if (Object.keys(validDrafts).length !== Object.keys(drafts).length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validDrafts));
    }
    
    return validDrafts;
  } catch (e) {
    console.error('[useDraft] Error loading drafts:', e);
    return {};
  }
};

/**
 * Save drafts to localStorage
 */
const saveDrafts = (drafts) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch (e) {
    console.error('[useDraft] Error saving drafts:', e);
  }
};

/**
 * Check if text mentions a pet name
 */
const mentionsPetName = (text, petNames) => {
  if (!text || !petNames || petNames.length === 0) return false;
  
  const lowerText = text.toLowerCase();
  return petNames.some(name => lowerText.includes(name.toLowerCase()));
};

/**
 * useDraft - Hook to manage pet-scoped drafts with 30-min sliding TTL
 * 
 * @param {Object} options
 * @param {string} options.currentPetId - Current active pet ID
 * @param {string} options.currentPetName - Current active pet name
 * @param {Array} options.allPets - Array of all pets [{id, name}, ...]
 * @param {Function} options.onPetSwitchWithDraft - Callback when switching pets with an existing draft
 */
const useDraft = ({
  currentPetId,
  currentPetName,
  allPets = [],
  onPetSwitchWithDraft,
} = {}) => {
  // All drafts (keyed by petId)
  const [drafts, setDrafts] = useState(() => loadDrafts());
  
  // Current pet's draft text
  const [draftText, setDraftText] = useState('');
  
  // Previous pet ID (to detect pet switches)
  const prevPetIdRef = useRef(currentPetId);
  
  // Ref to track drafts in real-time (avoids stale closure issues)
  const draftsRef = useRef(drafts);
  
  // Keep draftsRef in sync
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  
  // Banner state
  const [petSwitchBanner, setPetSwitchBanner] = useState(null);
  // { message: "Draft saved for Lola. Now chatting about Bruno.", 
  //   showSendChoice: true/false,
  //   oldPetId: "...", oldPetName: "...", newPetId: "...", newPetName: "..." }
  
  // All pet names (for mention detection)
  const allPetNames = useMemo(() => {
    return allPets.map(p => p.name).filter(Boolean);
  }, [allPets]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD DRAFT FOR CURRENT PET
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    if (!currentPetId) return;
    
    // Load draft for current pet
    const petDraft = drafts[currentPetId];
    if (petDraft && petDraft.expiresAt > Date.now()) {
      setDraftText(petDraft.text || '');
      console.log('[useDraft] Loaded draft for pet:', currentPetName, '- Text:', petDraft.text?.substring(0, 30));
    } else {
      setDraftText('');
    }
  }, [currentPetId, currentPetName, drafts]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PET SWITCH HANDLING
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const prevPetId = prevPetIdRef.current;
    
    // Detect pet switch
    if (prevPetId && prevPetId !== currentPetId) {
      const oldDraft = drafts[prevPetId];
      const oldPet = allPets.find(p => p.id === prevPetId);
      const oldPetName = oldPet?.name || 'your pet';
      
      // Check if there was a draft for the old pet
      if (oldDraft && oldDraft.text && oldDraft.text.trim()) {
        // Check if draft mentions any pet names
        const hasPetMention = mentionsPetName(oldDraft.text, allPetNames);
        
        // Show banner per Bible Section 3.2
        const bannerMessage = `Draft saved for ${oldPetName}. Now chatting about ${currentPetName}.`;
        
        setPetSwitchBanner({
          message: bannerMessage,
          showSendChoice: hasPetMention,
          oldPetId: prevPetId,
          oldPetName: oldPetName,
          newPetId: currentPetId,
          newPetName: currentPetName,
          draftText: oldDraft.text,
        });
        
        console.log('[useDraft] Pet switch with draft:', bannerMessage);
        
        // Notify parent
        onPetSwitchWithDraft?.({
          oldPetId: prevPetId,
          oldPetName: oldPetName,
          newPetId: currentPetId,
          newPetName: currentPetName,
          draftText: oldDraft.text,
          hasPetMention,
        });
        
        // Auto-dismiss banner after 5 seconds (unless user interacts)
        setTimeout(() => {
          setPetSwitchBanner(prev => {
            // Only dismiss if it's the same banner (user didn't interact)
            if (prev?.oldPetId === prevPetId && prev?.newPetId === currentPetId) {
              return null;
            }
            return prev;
          });
        }, 5000);
      }
    }
    
    prevPetIdRef.current = currentPetId;
  }, [currentPetId, currentPetName, drafts, allPets, allPetNames, onPetSwitchWithDraft]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DRAFT ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Update draft text (extends TTL on every edit - sliding window)
   */
  const updateDraft = useCallback((text) => {
    if (!currentPetId) return;
    
    setDraftText(text);
    
    // Update drafts with new expiry (sliding window)
    setDrafts(prev => {
      const updated = {
        ...prev,
        [currentPetId]: {
          text,
          expiresAt: Date.now() + DRAFT_TTL_MS, // Extend TTL on every edit
          petName: currentPetName,
          updatedAt: Date.now(),
        }
      };
      
      // Persist to localStorage
      saveDrafts(updated);
      
      return updated;
    });
  }, [currentPetId, currentPetName]);
  
  /**
   * Clear draft for current pet (after sending message)
   */
  const clearDraft = useCallback(() => {
    if (!currentPetId) return;
    
    setDraftText('');
    
    setDrafts(prev => {
      const updated = { ...prev };
      delete updated[currentPetId];
      saveDrafts(updated);
      return updated;
    });
    
    console.log('[useDraft] Cleared draft for pet:', currentPetName);
  }, [currentPetId, currentPetName]);
  
  /**
   * Clear draft for a specific pet
   */
  const clearDraftForPet = useCallback((petId) => {
    setDrafts(prev => {
      const updated = { ...prev };
      delete updated[petId];
      saveDrafts(updated);
      return updated;
    });
  }, []);
  
  /**
   * Get draft for a specific pet (without loading it as current)
   */
  const getDraftForPet = useCallback((petId) => {
    const draft = drafts[petId];
    if (draft && draft.expiresAt > Date.now()) {
      return draft.text;
    }
    return null;
  }, [drafts]);
  
  /**
   * Check if a pet has a draft
   */
  const hasDraftForPet = useCallback((petId) => {
    const draft = drafts[petId];
    return draft && draft.text && draft.text.trim() && draft.expiresAt > Date.now();
  }, [drafts]);
  
  /**
   * Dismiss pet switch banner
   */
  const dismissBanner = useCallback(() => {
    setPetSwitchBanner(null);
  }, []);
  
  /**
   * Handle "Send for [old pet]" choice from banner
   * Returns the draft text and clears it from the old pet
   */
  const sendForOldPet = useCallback(() => {
    if (!petSwitchBanner) return null;
    
    const { oldPetId, draftText: bannerDraftText } = petSwitchBanner;
    
    // Clear draft for old pet
    clearDraftForPet(oldPetId);
    
    // Dismiss banner
    setPetSwitchBanner(null);
    
    return { petId: oldPetId, text: bannerDraftText };
  }, [petSwitchBanner, clearDraftForPet]);
  
  /**
   * Handle "Send for [new pet]" choice from banner
   * Moves draft to current pet's input
   */
  const sendForNewPet = useCallback(() => {
    if (!petSwitchBanner) return null;
    
    const { oldPetId, draftText: bannerDraftText } = petSwitchBanner;
    
    // Clear draft for old pet
    clearDraftForPet(oldPetId);
    
    // Set draft for current pet
    updateDraft(bannerDraftText);
    
    // Dismiss banner
    setPetSwitchBanner(null);
    
    return { petId: currentPetId, text: bannerDraftText };
  }, [petSwitchBanner, currentPetId, clearDraftForPet, updateDraft]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN API
  // ═══════════════════════════════════════════════════════════════════════════
  
  return {
    // Current draft
    draftText,
    updateDraft,
    clearDraft,
    
    // Pet switch banner
    petSwitchBanner,
    dismissBanner,
    sendForOldPet,
    sendForNewPet,
    
    // Draft queries
    getDraftForPet,
    hasDraftForPet,
    clearDraftForPet,
    
    // All drafts (for debugging)
    allDrafts: drafts,
  };
};

export default useDraft;

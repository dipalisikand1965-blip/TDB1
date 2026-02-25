/**
 * useSession - Session Management Hook for Mira
 * ==============================================
 * Handles:
 * - Session ID generation and persistence
 * - Session recovery from backend
 * - Starting new sessions
 * 
 * Extracted from MiraDemoPage.jsx - Stage 3 Refactoring
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../../utils/api';

/**
 * Generate a unique session ID
 */
const generateSessionId = () => {
  return `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * useSession Hook
 * 
 * @param {Object} options
 * @param {Object} options.pet - Current pet object
 * @param {Function} options.onSessionRecovered - Callback when session is recovered with messages
 * @param {Function} options.onNewSession - Callback when a new session is started
 * @returns {Object} Session state and controls
 */
const useSession = ({ pet, onSessionRecovered, onNewSession } = {}) => {
  // Session ID - persisted in localStorage
  const [sessionId, setSessionId] = useState(() => {
    // Try to recover session from localStorage first
    const savedSession = localStorage.getItem('mira_session_id');
    if (savedSession) {
      console.log('[useSession] Recovered session:', savedSession);
      return savedSession;
    }
    // Generate new session if none exists
    const newSession = generateSessionId();
    localStorage.setItem('mira_session_id', newSession);
    console.log('[useSession] Created new session:', newSession);
    return newSession;
  });
  
  // Track if session has been recovered
  const [sessionRecovered, setSessionRecovered] = useState(false);
  
  // Track if recovery is in progress
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Recover session from backend
  const recoverSession = useCallback(async () => {
    if (sessionRecovered || !sessionId || isRecovering) return null;
    
    setIsRecovering(true);
    
    try {
      console.log('[useSession] Attempting to recover session:', sessionId);
      const response = await fetch(`${API_URL}/api/mira/session/${sessionId}/messages?limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          console.log('[useSession] Recovered', data.messages.length, 'messages');
          
          // Convert backend format to frontend format
          const recoveredHistory = data.messages.map(msg => ({
            type: msg.role === 'user' ? 'user' : 'mira',
            content: msg.content,
            timestamp: msg.timestamp,
            intent: msg.intent,
            executionType: msg.execution_type,
            products: msg.products || []
          }));
          
          setSessionRecovered(true);
          
          // Notify parent of recovered messages
          if (onSessionRecovered) {
            onSessionRecovered(recoveredHistory);
          }
          
          return recoveredHistory;
        }
      } else if (response.status === 404) {
        // Session doesn't exist yet - that's OK, it's a new conversation
        console.log('[useSession] New session, no history to recover');
      }
      
      setSessionRecovered(true);
      return [];
      
    } catch (err) {
      console.warn('[useSession] Recovery failed:', err);
      setSessionRecovered(true);
      return [];
    } finally {
      setIsRecovering(false);
    }
  }, [sessionId, sessionRecovered, isRecovering, onSessionRecovered]);
  
  // Start a new session
  const startNewSession = useCallback(() => {
    const newSession = generateSessionId();
    localStorage.setItem('mira_session_id', newSession);
    
    // Track which pet this session is for
    if (pet?.id) {
      localStorage.setItem('mira_session_pet_id', pet.id);
    }
    
    setSessionId(newSession);
    setSessionRecovered(true);
    
    console.log('[useSession] Started new session:', newSession, 'for pet:', pet?.name);
    
    // Notify parent
    if (onNewSession) {
      onNewSession(newSession);
    }
    
    return newSession;
  }, [pet, onNewSession]);
  
  // Update session pet ID when pet changes
  const updateSessionPet = useCallback((petId) => {
    if (petId) {
      localStorage.setItem('mira_session_pet_id', petId);
    }
  }, []);
  
  // Get the pet ID associated with current session
  const getSessionPetId = useCallback(() => {
    return localStorage.getItem('mira_session_pet_id');
  }, []);
  
  // Auto-recover on mount
  useEffect(() => {
    if (!sessionRecovered && sessionId) {
      recoverSession();
    }
  }, [sessionId, sessionRecovered, recoverSession]);
  
  return {
    // Session state
    sessionId,
    setSessionId,
    sessionRecovered,
    setSessionRecovered,
    isRecovering,
    
    // Actions
    recoverSession,
    startNewSession,
    updateSessionPet,
    getSessionPetId,
    
    // Helpers
    generateSessionId
  };
};

export default useSession;

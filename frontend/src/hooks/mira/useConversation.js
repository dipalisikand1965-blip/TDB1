/**
 * useConversation Hook - Conversation State Management
 * 
 * Extracted from MiraDemoPage.jsx - Phase 2A Refactoring
 * Manages conversation history, context, stage, and quick replies
 * 
 * States managed:
 * - conversationHistory: Array of chat messages
 * - conversationContext: Intelligence context for follow-ups
 * - conversationStage: 'initial' | 'clarifying' | 'concierge_engaged'
 * - quickReplies: Contextual suggestion buttons
 * - conversationComplete: Whether assistance flow is done
 * - showConversationEndBanner: UI flag for completion banner
 * - showOlderMessages: Toggle for message history collapse
 */

import { useState, useCallback } from 'react';
import conversationIntelligence from '../../utils/conversationIntelligence';

// Constants
const VISIBLE_MESSAGE_COUNT = 4; // Show last 4 messages (2 pairs of user+mira)
const MAX_CLARIFYING_QUESTIONS = 4; // After 4 questions, auto-transition

/**
 * useConversation Hook
 * @param {Object} pet - Current pet object for context initialization
 * @returns {Object} Conversation state and handlers
 */
const useConversation = (pet) => {
  // Core conversation state
  const [conversationHistory, setConversationHistory] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  
  // Conversation intelligence context
  const [conversationContext, setConversationContext] = useState(() => 
    conversationIntelligence.createConversationContext(pet)
  );
  
  // Conversation stage: 'initial' | 'clarifying' | 'concierge_engaged'
  const [conversationStage, setConversationStage] = useState('initial');
  
  // Clarifying question counter - prevents endless loops
  const [clarifyingQuestionCount, setClarifyingQuestionCount] = useState(0);
  
  // Conversation completion tracking
  const [conversationComplete, setConversationComplete] = useState(false);
  const [showConversationEndBanner, setShowConversationEndBanner] = useState(false);
  
  // UI state for message history
  const [showOlderMessages, setShowOlderMessages] = useState(false);
  
  /**
   * Detect if conversation is "complete" (Mira has provided assistance)
   * A complete flow = User asked → Mira responded with products/action → User confirmed
   */
  const detectConversationComplete = useCallback((history) => {
    if (history.length < 4) return false; // Need at least 4 messages (2 exchanges)
    
    const lastMessages = history.slice(-6);
    const miraMessages = lastMessages.filter(m => m.type === 'mira');
    const userMessages = lastMessages.filter(m => m.type === 'user');
    
    const hasMiraWithProducts = miraMessages.some(m => 
      m.showProducts || m.data?.response?.products?.length > 0
    );
    const hasMiraWithAction = miraMessages.some(m =>
      m.showConcierge || m.data?.nearby_places || m.data?.training_videos
    );
    
    // Only mark complete if user EXPLICITLY confirms
    if ((hasMiraWithProducts || hasMiraWithAction) && userMessages.length > 0) {
      const lastUserMsg = userMessages[userMessages.length - 1];
      const userText = (lastUserMsg?.content || '').toLowerCase();
      
      // Strong confirmation phrases - user is clearly done
      const strongConfirmations = [
        'send to concierge', 'book this', 'book it', "let's do it", "lets do it",
        'go ahead', 'proceed', 'confirm', 'finalize', 'order this', 'order it',
        "i'll take", "i want this", 'perfect thanks', 'that\'s all', 'thats all',
        'done for now', 'all set', 'sounds good book', 'yes book', 'yes please book'
      ];
      
      return strongConfirmations.some(p => userText.includes(p));
    }
    
    return false;
  }, []);
  
  /**
   * Add a message to conversation history
   * @param {Object} message - Message object with type, content, etc.
   */
  const addMessage = useCallback((message) => {
    setConversationHistory(prev => [...prev, message]);
  }, []);
  
  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setQuickReplies([]);
    setConversationStage('initial');
    setClarifyingQuestionCount(0);
    setConversationComplete(false);
    setShowConversationEndBanner(false);
    setShowOlderMessages(false);
  }, []);
  
  /**
   * Update conversation context with new information
   * @param {Object} updates - Context updates to merge
   */
  const updateContext = useCallback((updates) => {
    setConversationContext(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  
  /**
   * Reset context for new pet
   * @param {Object} newPet - New pet object
   */
  const resetContextForPet = useCallback((newPet) => {
    setConversationContext(conversationIntelligence.createConversationContext(newPet));
  }, []);
  
  /**
   * Increment clarifying question count
   * @returns {number} New count
   */
  const incrementClarifyingCount = useCallback(() => {
    setClarifyingQuestionCount(prev => {
      const newCount = prev + 1;
      console.log(`[CLARIFY LIMIT] Question ${newCount} of ${MAX_CLARIFYING_QUESTIONS}`);
      return newCount;
    });
  }, []);
  
  /**
   * Reset clarifying question count
   */
  const resetClarifyingCount = useCallback(() => {
    setClarifyingQuestionCount(0);
  }, []);
  
  /**
   * Check if clarifying limit reached
   * @returns {boolean}
   */
  const isClarifyingLimitReached = useCallback(() => {
    return clarifyingQuestionCount >= MAX_CLARIFYING_QUESTIONS;
  }, [clarifyingQuestionCount]);
  
  /**
   * Get visible messages based on showOlderMessages state
   * @returns {Object} { visibleMessages, olderMessages, hasOlderMessages }
   */
  const getVisibleMessages = useCallback(() => {
    const hasOlderMessages = conversationHistory.length > VISIBLE_MESSAGE_COUNT;
    const olderMessages = hasOlderMessages 
      ? conversationHistory.slice(0, -VISIBLE_MESSAGE_COUNT) 
      : [];
    const visibleMessages = hasOlderMessages 
      ? conversationHistory.slice(-VISIBLE_MESSAGE_COUNT) 
      : conversationHistory;
    
    return {
      visibleMessages,
      olderMessages,
      hasOlderMessages,
      olderCount: olderMessages.length
    };
  }, [conversationHistory]);
  
  return {
    // State
    conversationHistory,
    setConversationHistory,
    conversationContext,
    setConversationContext,
    conversationStage,
    setConversationStage,
    quickReplies,
    setQuickReplies,
    conversationComplete,
    setConversationComplete,
    showConversationEndBanner,
    setShowConversationEndBanner,
    showOlderMessages,
    setShowOlderMessages,
    clarifyingQuestionCount,
    setClarifyingQuestionCount,
    
    // Constants
    VISIBLE_MESSAGE_COUNT,
    MAX_CLARIFYING_QUESTIONS,
    
    // Helpers
    detectConversationComplete,
    addMessage,
    clearHistory,
    updateContext,
    resetContextForPet,
    incrementClarifyingCount,
    resetClarifyingCount,
    isClarifyingLimitReached,
    getVisibleMessages
  };
};

export default useConversation;

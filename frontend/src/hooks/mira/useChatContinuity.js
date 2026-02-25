/**
 * useChatContinuity.js
 * ====================
 * Chat Scroll Continuity Hook - Per PET_OS_BEHAVIOR_BIBLE v1.1 Section 3.1
 * 
 * Rules:
 * - Return to chat from any layer → Preserve exact scroll position
 * - User at bottom, new msg arrives → Auto-scroll
 * - User scrolled up, new msg arrives → Do NOT auto-scroll, show "New messages" pill
 * - Tap "New messages" pill → Scroll to first unread
 * - App background < 5 min → Preserve
 * - App background > 5 min → Soft refresh; preserve scroll; show "Catching up…" if needed
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Threshold for considering user "at bottom" (pixels from bottom)
const BOTTOM_THRESHOLD = 100;

// Background time thresholds (in milliseconds)
const SOFT_REFRESH_THRESHOLD = 5 * 60 * 1000;  // 5 minutes
const MEDIUM_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes
const FULL_REFRESH_THRESHOLD = 60 * 60 * 1000;   // 60 minutes

/**
 * useChatContinuity - Manages chat scroll position and new message indicators
 * 
 * @param {Object} options
 * @param {React.RefObject} options.chatContainerRef - Ref to the chat scroll container
 * @param {Array} options.messages - Current messages array
 * @param {Function} options.onSoftRefresh - Callback for soft refresh (messages only)
 * @param {Function} options.onMediumRefresh - Callback for medium refresh (messages + picks)
 * @param {Function} options.onFullRefresh - Callback for full refresh (all icons + picks)
 */
const useChatContinuity = ({
  chatContainerRef,
  messages = [],
  onSoftRefresh,
  onMediumRefresh,
  onFullRefresh,
} = {}) => {
  // Saved scroll position (preserved when navigating away)
  const [savedScrollPosition, setSavedScrollPosition] = useState(null);
  
  // Whether user is currently at the bottom of chat
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // Show "New messages" pill when user is scrolled up and new messages arrive
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false);
  
  // Count of unread messages (for pill badge)
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Index of first unread message (for scroll target)
  const firstUnreadIndexRef = useRef(null);
  
  // Previous message count (to detect new messages)
  const prevMessageCountRef = useRef(messages.length);
  
  // Background timestamp (when app went to background)
  const backgroundTimestampRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLL POSITION DETECTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Check if user is at the bottom of the chat
   */
  const checkIfAtBottom = useCallback(() => {
    if (!chatContainerRef?.current) return true;
    
    const container = chatContainerRef.current;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    
    return distanceFromBottom <= BOTTOM_THRESHOLD;
  }, [chatContainerRef]);
  
  /**
   * Handle scroll events - update isAtBottom state
   */
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    
    // If user scrolled to bottom, clear new messages pill
    if (atBottom && showNewMessagesPill) {
      setShowNewMessagesPill(false);
      setUnreadCount(0);
      firstUnreadIndexRef.current = null;
    }
  }, [checkIfAtBottom, showNewMessagesPill]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SCROLL POSITION PRESERVATION
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Save current scroll position (call before navigating away)
   */
  const saveScrollPosition = useCallback(() => {
    if (!chatContainerRef?.current) return;
    
    const position = chatContainerRef.current.scrollTop;
    setSavedScrollPosition(position);
    console.log('[ChatContinuity] Saved scroll position:', position);
  }, [chatContainerRef]);
  
  /**
   * Restore saved scroll position (call when returning to chat)
   */
  const restoreScrollPosition = useCallback(() => {
    if (!chatContainerRef?.current || savedScrollPosition === null) return;
    
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = savedScrollPosition;
        console.log('[ChatContinuity] Restored scroll position:', savedScrollPosition);
      }
    });
  }, [chatContainerRef, savedScrollPosition]);
  
  /**
   * Scroll to bottom of chat
   */
  const scrollToBottom = useCallback((smooth = true) => {
    if (!chatContainerRef?.current) return;
    
    const container = chatContainerRef.current;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    
    // Clear pill when scrolling to bottom
    setShowNewMessagesPill(false);
    setUnreadCount(0);
    firstUnreadIndexRef.current = null;
  }, [chatContainerRef]);
  
  /**
   * Scroll to first unread message (when clicking "New messages" pill)
   */
  const scrollToFirstUnread = useCallback(() => {
    if (!chatContainerRef?.current) return;
    
    // If we have a specific unread index, scroll to that message
    if (firstUnreadIndexRef.current !== null) {
      const messageElements = chatContainerRef.current.querySelectorAll('[data-message-index]');
      const targetElement = messageElements[firstUnreadIndexRef.current];
      
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('[ChatContinuity] Scrolled to first unread at index:', firstUnreadIndexRef.current);
      }
    } else {
      // Fallback: scroll to bottom
      scrollToBottom();
    }
    
    // Clear pill after scrolling
    setShowNewMessagesPill(false);
    setUnreadCount(0);
    firstUnreadIndexRef.current = null;
  }, [chatContainerRef, scrollToBottom]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NEW MESSAGE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Handle new messages arriving
   * Per Bible: Auto-scroll only if user is at bottom, otherwise show pill
   */
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    
    if (currentCount > prevCount) {
      const newMessageCount = currentCount - prevCount;
      
      if (isAtBottom) {
        // User is at bottom → auto-scroll to new messages
        scrollToBottom();
        console.log('[ChatContinuity] Auto-scrolled to new messages');
      } else {
        // User is scrolled up → show "New messages" pill, don't auto-scroll
        setShowNewMessagesPill(true);
        setUnreadCount(prev => prev + newMessageCount);
        
        // Mark first unread if not already set
        if (firstUnreadIndexRef.current === null) {
          firstUnreadIndexRef.current = prevCount;
        }
        
        console.log('[ChatContinuity] New messages arrived, showing pill. Count:', newMessageCount);
      }
    }
    
    prevMessageCountRef.current = currentCount;
  }, [messages.length, isAtBottom, scrollToBottom]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUND/FOREGROUND HANDLING (Bible Section 3.4)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Handle visibility change (app going to background/foreground)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - save timestamp
        backgroundTimestampRef.current = Date.now();
        saveScrollPosition();
        console.log('[ChatContinuity] App went to background');
      } else {
        // App returning to foreground - check idle time
        if (backgroundTimestampRef.current) {
          const idleTime = Date.now() - backgroundTimestampRef.current;
          
          console.log('[ChatContinuity] App returned, idle time:', Math.round(idleTime / 1000), 'seconds');
          
          if (idleTime < SOFT_REFRESH_THRESHOLD) {
            // < 5 min: No refresh, just restore position
            restoreScrollPosition();
          } else if (idleTime < MEDIUM_REFRESH_THRESHOLD) {
            // 5-30 min: Soft refresh (messages only)
            restoreScrollPosition();
            onSoftRefresh?.();
            console.log('[ChatContinuity] Triggering soft refresh');
          } else if (idleTime < FULL_REFRESH_THRESHOLD) {
            // 30-60 min: Medium refresh (messages + picks)
            restoreScrollPosition();
            onMediumRefresh?.();
            console.log('[ChatContinuity] Triggering medium refresh');
          } else {
            // > 60 min: Full refresh (re-evaluate all icons + picks)
            restoreScrollPosition();
            onFullRefresh?.();
            console.log('[ChatContinuity] Triggering full refresh');
          }
          
          backgroundTimestampRef.current = null;
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveScrollPosition, restoreScrollPosition, onSoftRefresh, onMediumRefresh, onFullRefresh]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ATTACH SCROLL LISTENER
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const container = chatContainerRef?.current;
    if (!container) return;
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [chatContainerRef, handleScroll]);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RETURN API
  // ═══════════════════════════════════════════════════════════════════════════
  
  return {
    // State
    isAtBottom,
    showNewMessagesPill,
    unreadCount,
    savedScrollPosition,
    
    // Actions
    saveScrollPosition,
    restoreScrollPosition,
    scrollToBottom,
    scrollToFirstUnread,
    handleScroll,
    
    // For manual control
    setShowNewMessagesPill,
    clearUnread: () => {
      setShowNewMessagesPill(false);
      setUnreadCount(0);
      firstUnreadIndexRef.current = null;
    },
  };
};

export default useChatContinuity;

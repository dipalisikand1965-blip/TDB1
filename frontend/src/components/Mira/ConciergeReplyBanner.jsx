/**
 * ConciergeReplyBanner - "Concierge® replied" banner for Chat
 * ============================================================
 * Shows at top of chat when a Concierge® reply arrives while user is in Chat.
 * 
 * This solves the biggest confusion: people expect replies to come "where they typed".
 * WhatsApp/Instagram DM style - premium mobile-first.
 * 
 * SPEC:
 * - Title: "New message from Concierge®" or "Concierge® replied about {pet_name}"
 * - Subtitle: "{n} message(s) waiting in Services"
 * - CTA: "Open Services" (not just "Open")
 * - Entire banner is tappable
 * - X dismisses for 10 minutes, not forever
 * - Color: calm purple (not emergency red/orange)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, X, ArrowRight } from 'lucide-react';

// Storage keys
const DISMISS_UNTIL_KEY = 'mira_concierge_banner_dismiss_until';
const PREV_COUNT_KEY = 'mira_prev_unread_count';

// Dismiss duration: 10 minutes
const DISMISS_DURATION_MS = 10 * 60 * 1000;

/**
 * ConciergeReplyBanner Component
 * 
 * @param {Object} props
 * @param {boolean} props.hasUnreadReply - Whether there's an unread Concierge® reply
 * @param {number} props.unreadCount - Number of unread replies
 * @param {string} props.petName - Active pet name for personalized copy
 * @param {string} props.ticketId - Most recent ticket with unread reply
 * @param {Function} props.onOpenServices - Called when user clicks to open Services
 * @param {Function} props.onDismiss - Called when user dismisses (optional)
 */
const ConciergeReplyBanner = ({
  hasUnreadReply = false,
  unreadCount = 0,
  petName = '',
  ticketId = '',
  onOpenServices,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissedTemp, setIsDismissedTemp] = useState(false);
  
  // Check if currently in dismiss window
  const checkDismissState = useCallback(() => {
    try {
      const dismissUntil = localStorage.getItem(DISMISS_UNTIL_KEY);
      if (dismissUntil) {
        const dismissTime = parseInt(dismissUntil, 10);
        if (Date.now() < dismissTime) {
          return true; // Still in dismiss window
        } else {
          // Dismiss window expired, clear it
          localStorage.removeItem(DISMISS_UNTIL_KEY);
        }
      }
    } catch {
      // localStorage not available
    }
    return false;
  }, []);
  
  // Check if should show
  const shouldShow = (hasUnreadReply || unreadCount > 0) && !isDismissedTemp && !checkDismissState();
  
  useEffect(() => {
    if (shouldShow) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [shouldShow]);
  
  // Reset dismiss state when new reply arrives
  useEffect(() => {
    if (hasUnreadReply || unreadCount > 0) {
      try {
        const prevCount = parseInt(localStorage.getItem(PREV_COUNT_KEY) || '0', 10);
        if (unreadCount > prevCount) {
          // New messages arrived - clear dismiss state
          localStorage.removeItem(DISMISS_UNTIL_KEY);
          setIsDismissedTemp(false);
        }
        localStorage.setItem(PREV_COUNT_KEY, unreadCount.toString());
      } catch {
        // localStorage not available
      }
    }
  }, [hasUnreadReply, unreadCount]);
  
  const handleOpenServices = useCallback((e) => {
    e?.stopPropagation?.();
    setIsVisible(false);
    // Opening Services clears the banner (user is taking action)
    localStorage.removeItem(DISMISS_UNTIL_KEY);
    if (onOpenServices) onOpenServices(ticketId);
  }, [onOpenServices, ticketId]);
  
  const handleDismiss = useCallback((e) => {
    e?.stopPropagation?.();
    setIsVisible(false);
    setIsDismissedTemp(true);
    
    // Set dismiss for 10 minutes (NOT forever)
    try {
      const dismissUntil = Date.now() + DISMISS_DURATION_MS;
      localStorage.setItem(DISMISS_UNTIL_KEY, dismissUntil.toString());
    } catch {
      // localStorage not available
    }
    
    if (onDismiss) onDismiss();
  }, [onDismiss]);
  
  if (!isVisible) return null;
  
  // Build copy based on pet name
  const titleText = petName 
    ? `Concierge® replied about ${petName}`
    : 'New message from Concierge®';
  
  const subtitleText = unreadCount > 0
    ? `${unreadCount} ${unreadCount === 1 ? 'message' : 'messages'} waiting in Services`
    : 'Reply is waiting in Services';
  
  return (
    <div 
      className="w-full px-4 py-2 animate-in slide-in-from-top-2 fade-in duration-300"
      data-testid="concierge-reply-banner"
    >
      {/* Entire banner is tappable - calm purple gradient (not emergency red/orange) */}
      <div 
        onClick={handleOpenServices}
        className="bg-gradient-to-r from-violet-600/95 via-purple-600/95 to-violet-700/95 
                   backdrop-blur-xl rounded-2xl shadow-xl shadow-purple-500/25 
                   border border-purple-400/30 overflow-hidden cursor-pointer
                   hover:shadow-purple-500/35 transition-shadow active:scale-[0.99]"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleOpenServices(e)}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Animated Icon */}
          <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-white" />
              {/* Pulse dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              {titleText}
            </p>
            <p className="text-white/75 text-xs mt-0.5">
              {subtitleText}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Open Services button */}
            <button
              onClick={handleOpenServices}
              className="flex items-center gap-1.5 px-3.5 py-2 
                         bg-white text-purple-700 rounded-xl text-xs font-bold 
                         hover:bg-purple-50 transition-colors whitespace-nowrap 
                         shadow-sm active:scale-95"
              data-testid="open-services-from-banner"
            >
              Open Services
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            
            {/* Dismiss button - only dismisses for 10 minutes */}
            <button
              onClick={handleDismiss}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 
                         rounded-xl transition-colors"
              data-testid="dismiss-reply-banner"
              aria-label="Dismiss for 10 minutes"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConciergeReplyBanner;

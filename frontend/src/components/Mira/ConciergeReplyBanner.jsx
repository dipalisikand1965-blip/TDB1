/**
 * ConciergeReplyBanner - "Concierge replied" banner for Chat
 * ==========================================================
 * Shows at top of chat when a Concierge reply arrives while user is in Chat.
 * 
 * This solves the biggest confusion: people expect replies to come "where they typed".
 * WhatsApp/Instagram DM style - premium mobile-first.
 * 
 * Copy: "Concierge replied in Services"
 * Button: "Open Services"
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowRight, X, Briefcase } from 'lucide-react';

// Session storage key
const SESSION_DISMISSED_KEY = 'mira_concierge_banner_session';

/**
 * ConciergeReplyBanner Component
 * 
 * @param {Object} props
 * @param {boolean} props.hasUnreadReply - Whether there's an unread Concierge reply
 * @param {number} props.unreadCount - Number of unread replies (for badge display)
 * @param {string} props.previewText - Preview of the reply (optional)
 * @param {Function} props.onOpenServices - Called when user clicks "Open Services"
 * @param {Function} props.onDismiss - Called when user dismisses the banner
 */
const ConciergeReplyBanner = ({
  hasUnreadReply = false,
  unreadCount = 0,
  previewText = '',
  onOpenServices,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Check if we should show based on actual unread state
  const shouldShow = (hasUnreadReply || unreadCount > 0) && !isDismissed;
  
  useEffect(() => {
    // Check session storage for dismissed state
    const sessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    if (sessionDismissed === 'true') {
      setIsDismissed(true);
      return;
    }
    
    // Show banner only if there's an unread reply and not dismissed
    if (shouldShow) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [shouldShow]);
  
  const handleOpenServices = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
    if (onOpenServices) onOpenServices();
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
    if (onDismiss) onDismiss();
  };
  
  // Reset dismissed state when new reply comes in (count increases)
  useEffect(() => {
    if (hasUnreadReply || unreadCount > 0) {
      const prevCount = parseInt(sessionStorage.getItem('mira_prev_unread_count') || '0');
      if (unreadCount > prevCount) {
        // New messages arrived, reset dismissed state
        sessionStorage.removeItem(SESSION_DISMISSED_KEY);
        setIsDismissed(false);
      }
      sessionStorage.setItem('mira_prev_unread_count', unreadCount.toString());
    }
  }, [hasUnreadReply, unreadCount]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="w-full px-4 py-2 animate-in slide-in-from-top-2 fade-in duration-300"
      data-testid="concierge-reply-banner"
    >
      <div className="bg-gradient-to-r from-amber-500/95 via-orange-500/95 to-pink-500/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-amber-500/20 border border-amber-400/30 overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          {/* Animated Icon */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <div className="relative">
              <MessageSquare className="w-5 h-5 text-white" />
              {/* Pulse dot */}
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Concierge replied in Services
            </p>
            <p className="text-white/80 text-xs truncate mt-0.5">
              {previewText || (unreadCount > 0 
                ? `${unreadCount} ${unreadCount === 1 ? 'message' : 'messages'} waiting` 
                : 'New update on your request')}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleOpenServices}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-50 transition-colors whitespace-nowrap shadow-sm active:scale-95"
              data-testid="open-services-from-banner"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Open
            </button>
            
            <button
              onClick={handleDismiss}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              data-testid="dismiss-reply-banner"
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

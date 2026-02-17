/**
 * ConciergeReplyBanner - "Concierge replied" banner for Chat
 * ==========================================================
 * Shows at top of chat when a Concierge reply arrives while user is in Chat.
 * 
 * This solves the biggest confusion: people expect replies to come "where they typed".
 * 
 * Copy: "Concierge replied in Services"
 * Button: "Open Services"
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowRight, X } from 'lucide-react';

/**
 * ConciergeReplyBanner Component
 * 
 * @param {Object} props
 * @param {boolean} props.hasUnreadReply - Whether there's an unread Concierge reply
 * @param {string} props.previewText - Preview of the reply (optional)
 * @param {Function} props.onOpenServices - Called when user clicks "Open Services"
 * @param {Function} props.onDismiss - Called when user dismisses the banner
 */
const ConciergeReplyBanner = ({
  hasUnreadReply = false,
  previewText = '',
  onOpenServices,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    // Show banner only if there's an unread reply and not dismissed
    if (hasUnreadReply && !isDismissed) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [hasUnreadReply, isDismissed]);
  
  const handleOpenServices = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (onOpenServices) onOpenServices();
  };
  
  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };
  
  // Reset dismissed state when new reply comes in
  useEffect(() => {
    if (hasUnreadReply) {
      setIsDismissed(false);
    }
  }, [hasUnreadReply]);
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed top-20 left-1/2 -translate-x-1/2 z-[999] w-[95%] max-w-md animate-in slide-in-from-top-2 fade-in duration-300"
      data-testid="concierge-reply-banner"
    >
      <div className="bg-gradient-to-r from-pink-500/95 to-rose-500/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-pink-500/25 border border-pink-400/30 p-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              Concierge replied in Services
            </p>
            {previewText && (
              <p className="text-pink-100 text-xs truncate mt-0.5">
                {previewText}
              </p>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenServices}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-pink-600 rounded-full text-xs font-medium hover:bg-pink-50 transition-colors whitespace-nowrap"
              data-testid="open-services-from-banner"
            >
              Open Services
              <ArrowRight className="w-3 h-3" />
            </button>
            
            <button
              onClick={handleDismiss}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
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

/**
 * ReplyNudge - Gentle nudge to reply in Services
 * ===============================================
 * Shows when user types something that looks like a reply/update
 * while an open ticket exists.
 * 
 * Section 12.7 from Bible: "The single biggest confusion killer"
 * 
 * Triggers on keywords: time, morning, afternoon, evening, budget, prefer,
 * confirm, change, update, address, location, koramangala, indiranagar, etc.
 */

import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';

// Keywords that suggest user is trying to update a request
const UPDATE_KEYWORDS = [
  // Time-related
  'morning', 'afternoon', 'evening', 'tomorrow', 'today', 'next week',
  '10am', '11am', '12pm', '2pm', '3pm', '4pm', '5pm',
  'prefer', 'preferably', 'ideally',
  // Location-related
  'koramangala', 'indiranagar', 'hsr', 'jp nagar', 'whitefield', 'jayanagar',
  'bangalore', 'mumbai', 'delhi', 'address', 'location', 'area', 'near',
  // Budget/preferences
  'budget', 'price', 'cost', 'cheaper', 'premium', 'luxury',
  // Confirmation
  'confirm', 'confirmed', 'yes please', 'go ahead', 'book it', 'approved',
  // Updates
  'change', 'update', 'modify', 'reschedule', 'cancel', 'instead',
  // Details
  'details', 'add', 'also', 'and also', 'by the way'
];

/**
 * Check if message looks like a reply/update
 */
const looksLikeUpdate = (message) => {
  if (!message || message.length < 3) return false;
  
  const lower = message.toLowerCase();
  
  // Check for update keywords
  return UPDATE_KEYWORDS.some(keyword => lower.includes(keyword));
};

/**
 * ReplyNudge Component
 * 
 * @param {Object} props
 * @param {string} props.message - Current input message
 * @param {boolean} props.hasOpenTicket - Whether there's an open ticket
 * @param {Function} props.onOpenServices - Called when user clicks "Open Services"
 * @param {Function} props.onSendAnyway - Called when user clicks "Send anyway"
 * @param {Function} props.onDismiss - Called when nudge is dismissed
 */
const ReplyNudge = ({
  message = '',
  hasOpenTicket = false,
  onOpenServices,
  onSendAnyway,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  useEffect(() => {
    // Show nudge only if:
    // 1. There's an open ticket
    // 2. Message looks like an update
    // 3. User hasn't dismissed it for this session
    const shouldShow = hasOpenTicket && 
                       looksLikeUpdate(message) && 
                       !isDismissed;
    
    setIsVisible(shouldShow);
  }, [message, hasOpenTicket, isDismissed]);
  
  const handleOpenServices = () => {
    setIsVisible(false);
    if (onOpenServices) onOpenServices();
  };
  
  const handleSendAnyway = () => {
    setIsVisible(false);
    setIsDismissed(true); // Don't show again this session
    if (onSendAnyway) onSendAnyway();
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="absolute bottom-full left-0 right-0 mb-2 mx-4 animate-in slide-in-from-bottom-2 duration-200"
      data-testid="reply-nudge"
    >
      <div className="bg-gradient-to-r from-amber-500/95 to-orange-500/95 backdrop-blur-xl rounded-xl shadow-lg border border-amber-400/30 p-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium leading-snug">
              Looks like you're adding details to your request.
            </p>
            <p className="text-amber-100 text-xs mt-1">
              Reply in Services so Concierge® sees it in the thread.
            </p>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleOpenServices}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-700 rounded-full text-xs font-medium hover:bg-amber-50 transition-colors"
                data-testid="nudge-open-services"
              >
                Open Services
                <ArrowRight className="w-3 h-3" />
              </button>
              
              <button
                onClick={handleSendAnyway}
                className="px-3 py-1.5 text-white/80 hover:text-white text-xs transition-colors"
                data-testid="nudge-send-anyway"
              >
                Send anyway
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReplyNudge;

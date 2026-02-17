/**
 * ConciergeConfirmation - Personalized Request Confirmation Banner
 * ================================================================
 * Shows when Mira successfully creates a request for Concierge®
 * 
 * Copy contract (Section 12):
 * - Title: "Request opened • TCK-XXXXXX"
 * - Subtext: "Reply in Services to add details or change timing."
 * - CTA: "View in Services" button
 * 
 * The rule: Chat is for asking. Services is where replies live.
 */

import React, { useEffect, useState } from 'react';
import { X, Clock, Heart, ArrowRight, MessageSquare } from 'lucide-react';

/**
 * ConciergeConfirmation Component
 * 
 * @param {Object} props
 * @param {Object} props.confirmation - Confirmation data from backend
 * @param {string} props.confirmation.ticket_id - Request reference number (TCK-XXXXXX)
 * @param {boolean} props.confirmation.show_banner - Whether to show banner
 * @param {Function} props.onDismiss - Called when user dismisses banner
 * @param {Function} props.onViewInServices - Called when user clicks "View in Services"
 * @param {string} props.petName - Pet name for personalization
 */
const ConciergeConfirmation = ({ 
  confirmation, 
  onDismiss,
  onViewInServices,
  petName = 'your pet'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (confirmation?.show_banner) {
      // Animate in
      setTimeout(() => setIsVisible(true), 100);
      
      // Auto-dismiss after 12 seconds (longer to let them read + tap CTA)
      const timer = setTimeout(() => {
        handleDismiss();
      }, 12000);
      
      return () => clearTimeout(timer);
    }
  }, [confirmation]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsExiting(false);
      if (onDismiss) onDismiss();
    }, 300);
  };

  if (!confirmation?.show_banner) return null;
  
  // Personalized title based on pet name
  const ticketId = confirmation.ticket_id || '';
  const personalizedTitle = `Request opened • ${ticketId}`;

  return (
    <div 
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-md transition-all duration-300 ${
        isVisible && !isExiting 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-4'
      }`}
      data-testid="concierge-confirmation-banner"
    >
      <div className="bg-gradient-to-r from-emerald-500/95 to-teal-500/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-emerald-500/25 border border-emerald-400/30 overflow-hidden">
        {/* Progress bar - auto dismiss indicator */}
        <div className="h-1 bg-white/20 relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-white/60 animate-shrink-width"
            style={{ animationDuration: '8s', animationTimingFunction: 'linear' }}
          />
        </div>
        
        <div className="p-4">
          {/* Header with icon and dismiss */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm flex items-center gap-1">
                  {personalizedTitle}
                </h3>
                <span className="text-emerald-100 text-xs">
                  Reply in Services to add details or change timing.
                </span>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              data-testid="dismiss-confirmation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2 mt-3 ml-12">
            <Clock className="w-3.5 h-3.5 text-emerald-200" />
            <span className="text-emerald-100 text-xs">
              Typically responds within 2-4 hours
            </span>
          </div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      </div>
    </div>
  );
};

export default ConciergeConfirmation;

// CSS for animation (add to your global styles or component)
// @keyframes shrink-width {
//   from { width: 100%; }
//   to { width: 0%; }
// }
// .animate-shrink-width {
//   animation: shrink-width 8s linear forwards;
// }

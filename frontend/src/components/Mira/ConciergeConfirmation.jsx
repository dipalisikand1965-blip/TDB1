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
  
  // Request ID for display
  const ticketId = confirmation.ticket_id || 'TCK-...';

  const handleViewInServices = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onViewInServices) onViewInServices();
      if (onDismiss) onDismiss();
    }, 200);
  };

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
            style={{ animationDuration: '12s', animationTimingFunction: 'linear' }}
          />
        </div>
        
        <div className="p-4">
          {/* Header with icon and dismiss */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Request opened • <span className="font-mono">{ticketId}</span>
                </h3>
                <p className="text-emerald-100 text-xs mt-0.5">
                  Reply in Services to add details or change timing.
                </p>
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
          
          {/* Luxury subtext */}
          <p className="text-white/80 text-xs ml-13 mb-3 pl-13" style={{ marginLeft: '52px' }}>
            Replies from Concierge® will appear in Services.
          </p>
          
          {/* CTA Button - "View in Services" */}
          <button
            onClick={handleViewInServices}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-medium hover:bg-emerald-50 transition-colors shadow-lg"
            data-testid="view-in-services-cta"
          >
            <MessageSquare className="w-4 h-4" />
            View in Services
            <ArrowRight className="w-4 h-4" />
          </button>
          
          {/* Response time indicator */}
          <div className="flex items-center justify-center gap-2 mt-3">
            <Clock className="w-3.5 h-3.5 text-emerald-200" />
            <span className="text-emerald-100 text-xs">
              Your Concierge® typically responds within 2-4 hours
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

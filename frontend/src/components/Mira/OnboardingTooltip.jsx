/**
 * OnboardingTooltip - First-visit tooltip for Services
 * ====================================================
 * Shows once on first visit, anchored to Services tab.
 * 
 * Section 12.8 from Bible: "The Minimum Onboarding Tooltip (One Step Only)"
 * 
 * Copy: "Chat is where you ask. Services is where it gets done.
 *        Any request you create will live here with Concierge."
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'mira_onboarding_tooltip_dismissed';

/**
 * Check if tooltip has been dismissed before
 */
const hasBeenDismissed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Mark tooltip as dismissed
 */
const markDismissed = () => {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // localStorage not available
  }
};

/**
 * OnboardingTooltip Component
 * 
 * @param {Object} props
 * @param {React.RefObject} props.anchorRef - Ref to the element to anchor to (Services tab)
 * @param {boolean} props.isLoggedIn - Whether user is logged in
 * @param {Function} props.onDismiss - Called when tooltip is dismissed
 */
const OnboardingTooltip = ({
  anchorRef,
  isLoggedIn = false,
  onDismiss
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  useEffect(() => {
    // Only show if:
    // 1. User is logged in
    // 2. Haven't dismissed before
    // 3. Wait a moment for page to settle
    if (!isLoggedIn || hasBeenDismissed()) {
      return;
    }
    
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Calculate position based on anchor
      if (anchorRef?.current) {
        const rect = anchorRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 12,
          left: rect.left + rect.width / 2
        });
      }
    }, 2000); // Show after 2 seconds
    
    return () => clearTimeout(timer);
  }, [isLoggedIn, anchorRef]);
  
  const handleDismiss = () => {
    setIsVisible(false);
    markDismissed();
    if (onDismiss) onDismiss();
  };
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="fixed z-[9999] animate-in fade-in slide-in-from-top-2 duration-300"
      style={{
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)'
      }}
      data-testid="onboarding-tooltip"
    >
      {/* Arrow pointing up */}
      <div 
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid rgb(124 58 237)'
        }}
      />
      
      {/* Tooltip content */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-xl shadow-2xl shadow-purple-500/30 p-4 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1">
            <h4 className="text-white font-semibold text-sm mb-2">
              Chat is where you ask.
            </h4>
            <p className="text-purple-100 text-xs leading-relaxed">
              Services is where it gets done. Any request you create will live here with Concierge.
            </p>
            
            {/* CTA Button */}
            <button
              onClick={handleDismiss}
              className="mt-3 w-full px-4 py-2 bg-white text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors"
              data-testid="onboarding-got-it"
            >
              Got it
            </button>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="text-white/60 hover:text-white p-1 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTooltip;

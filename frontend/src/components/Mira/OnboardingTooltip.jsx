/**
 * OnboardingTooltip - First-visit tooltip for Services
 * ====================================================
 * Shows once on first visit, centered at bottom of screen.
 * Mobile-first, premium feel for millennial pet parents.
 * 
 * Section 12.8 from Bible: "The Minimum Onboarding Tooltip (One Step Only)"
 * 
 * MENTAL MODEL ANCHOR:
 * "Chat is where you ask. Services is where it gets done."
 * 
 * Platform variants:
 * - iOS: Shorter, punchier
 * - Android: Slightly more explanatory
 * - Web: Full experience
 */

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Briefcase, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'mira_onboarding_tooltip_dismissed';

/**
 * Detect platform for copy variants
 */
const detectPlatform = () => {
  if (typeof navigator === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'web';
};

/**
 * Platform-specific copy variants
 */
const COPY_VARIANTS = {
  ios: {
    // Shorter, punchier for iOS
    headline: 'Chat is where you ask.',
    subtext: 'Replies appear in Services.',
    cta: 'Show me'
  },
  android: {
    // Slightly more explanatory for Android
    headline: 'Chat is where you ask.',
    subtext: 'When Concierge® handles your request, you\'ll find replies in Services.',
    cta: 'Show me Services'
  },
  web: {
    // Full experience for web
    headline: 'Chat is where you ask.',
    subtext: 'When Concierge® replies or handles your request, you\'ll find it in Services.',
    cta: 'Show me Services'
  }
};

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
 * @param {React.RefObject} props.anchorRef - Ref to the element to anchor to (Services tab) - optional
 * @param {boolean} props.isLoggedIn - Whether user is logged in
 * @param {Function} props.onDismiss - Called when tooltip is dismissed
 * @param {Function} props.onOpenServices - Called when user taps "Show me"
 */
const OnboardingTooltip = ({
  anchorRef,
  isLoggedIn = false,
  onDismiss,
  onOpenServices
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState('web');
  
  useEffect(() => {
    // Detect platform on mount
    setPlatform(detectPlatform());
    
    // Only show if:
    // 1. User is logged in
    // 2. Haven't dismissed before
    // 3. Wait a moment for page to settle
    if (!isLoggedIn || hasBeenDismissed()) {
      return;
    }
    
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500); // Show after 2.5 seconds
    
    return () => clearTimeout(timer);
  }, [isLoggedIn]);
  
  const copy = COPY_VARIANTS[platform] || COPY_VARIANTS.web;
  
  const handleDismiss = () => {
    setIsVisible(false);
    markDismissed();
    if (onDismiss) onDismiss();
  };
  
  const handleShowMe = () => {
    setIsVisible(false);
    markDismissed();
    if (onOpenServices) onOpenServices();
    if (onDismiss) onDismiss();
  };
  
  if (!isVisible) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] animate-in fade-in duration-300"
        onClick={handleDismiss}
      />
      
      {/* Tooltip - Fixed at bottom center, mobile-first */}
      <div 
        className="fixed z-[9999] left-4 right-4 bottom-24 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[360px] animate-in fade-in slide-in-from-bottom-4 duration-300"
        data-testid="onboarding-tooltip"
      >
        {/* Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-white/40 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors z-10"
            data-testid="onboarding-close"
          >
            <X className="w-4 h-4" />
          </button>
          
          {/* Content */}
          <div className="p-5">
            {/* Two-column visual */}
            <div className="flex items-stretch gap-3 mb-4">
              {/* Chat side */}
              <div className="flex-1 bg-violet-500/10 rounded-xl p-3 border border-violet-500/20">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center mb-2">
                  <MessageCircle className="w-4 h-4 text-violet-400" />
                </div>
                <p className="text-violet-300 text-xs font-medium">Chat</p>
                <p className="text-violet-400/70 text-[10px] mt-0.5">Ask Mira anything</p>
              </div>
              
              {/* Arrow */}
              <div className="flex items-center">
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </div>
              
              {/* Services side */}
              <div className="flex-1 bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-amber-300 text-xs font-medium">Services</p>
                <p className="text-amber-400/70 text-[10px] mt-0.5">Replies live here</p>
              </div>
            </div>
            
            {/* Main copy - Human, direct - Platform-specific */}
            <h4 className="text-white font-semibold text-base mb-1.5">
              {copy.headline}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              {copy.subtext.includes('Services') ? (
                <>
                  {copy.subtext.split('Services')[0]}
                  <span className="text-amber-400 font-medium">Services</span>
                  {copy.subtext.split('Services')[1]}
                </>
              ) : copy.subtext}
            </p>
            
            {/* Actions */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handleShowMe}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-purple-500/25 active:scale-[0.98]"
                data-testid="onboarding-show-me"
              >
                {copy.cta}
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-3 text-slate-400 hover:text-white text-sm transition-colors"
                data-testid="onboarding-got-it"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTooltip;

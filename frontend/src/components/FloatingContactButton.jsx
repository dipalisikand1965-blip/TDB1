/**
 * FloatingContactButton.jsx
 * Unified floating contact stack - consolidated communication hub
 * 
 * Stack includes:
 * - Ask Mira (AI Concierge)
 * - Call Now
 * - Request Callback
 * 
 * Positioned on LEFT side to not conflict with Mira Orb on RIGHT
 * Mobile-first design with stacked options
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone, X, Headphones, PhoneIncoming, Sparkles } from 'lucide-react';
import CallbackRequestModal from './CallbackRequestModal';

const FloatingContactButton = () => {
  // DISABLED: Contact options moved to mobile sidebar and Mira
  // WhatsApp and other contact options are now in the paw-print sidebar menu
  return null;
  
  /* Original code preserved for reference
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  
  // Hide on Mira-related pages where dedicated contact options exist
  const hiddenPaths = ['/mira', '/ask-mira', '/voice-order', '/agent', '/admin/service-desk'];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  const handleCallbackClick = () => {
    setIsOpen(false);
    setShowCallbackModal(true);
  };
  
  const handleAskMira = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  // Contact options - WhatsApp replaced with Ask Mira
  const contactOptions = [
    {
      label: 'Ask Mira',
      sublabel: 'AI Concierge',
      icon: Sparkles,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      onClick: handleAskMira,
    },
    {
      label: 'Call Now',
      sublabel: '+91 96631 85747',
      icon: Phone,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      href: 'tel:+919663185747',
    },
    {
      label: 'Request Callback',
      sublabel: "We'll call you",
      icon: PhoneIncoming,
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: handleCallbackClick,
    },
  ];

  return (
    <>
      {/* Hidden on mobile (md:flex) - mobile users use the paw-print sidebar instead */}
      <div className="hidden md:flex fixed bottom-4 left-4 z-[9990] flex-col items-start gap-2" data-testid="floating-contact">
        {/* Expanded Options */}
        {isOpen && (
          <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              
              if (option.onClick) {
                return (
                  <button
                    key={index}
                    onClick={option.onClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg transition-all transform hover:scale-105 ${option.color}`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs opacity-80">{option.sublabel}</p>
                    </div>
                  </button>
                );
              }
              
              return (
                <a
                  key={index}
                  href={option.href}
                  target={option.external ? '_blank' : undefined}
                  rel={option.external ? 'noopener noreferrer' : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg transition-all transform hover:scale-105 ${option.color}`}
                  onClick={() => !option.external && setIsOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs opacity-80">{option.sublabel}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        {/* Main FAB Button - Mira themed */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 ${
            isOpen 
              ? 'bg-gray-700 hover:bg-gray-800' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
          }`}
          data-testid="floating-contact-btn"
          aria-label="Contact options"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Headphones className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
      
      {/* Callback Request Modal */}
      <CallbackRequestModal 
        isOpen={showCallbackModal} 
        onClose={() => setShowCallbackModal(false)} 
      />
    </>
  );
  */ // End of preserved code
};

export default FloatingContactButton;

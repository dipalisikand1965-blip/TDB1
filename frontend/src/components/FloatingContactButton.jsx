/**
 * FloatingContactButton.jsx
 * Unified floating contact stack - consolidated communication hub
 * 
 * Stack includes:
 * - WhatsApp Chat
 * - Call Now
 * - Request Callback
 * 
 * Positioned on LEFT side to not conflict with Mira Orb on RIGHT
 * Mobile-first design with stacked options
 */

import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Phone, MessageCircle, X, Headphones, PhoneIncoming } from 'lucide-react';
import CallbackRequestModal from './CallbackRequestModal';

const WHATSAPP_NUMBER = '919663185747';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to know more about The Doggy Company 🐕")}`;

const FloatingContactButton = () => {
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

  // Contact options - removed Mira (now handled by MiraOrb on right side)
  const contactOptions = [
    {
      label: 'WhatsApp',
      sublabel: 'Chat with us',
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      href: WHATSAPP_URL,
      external: true,
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
      {/* Positioned on LEFT side to not conflict with Mira Orb */}
      <div className="fixed bottom-4 left-4 z-[9990] flex flex-col items-start gap-2" data-testid="floating-contact">
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

        {/* Main FAB Button - Clean, no tooltip */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 ${
            isOpen 
              ? 'bg-gray-700 hover:bg-gray-800' 
              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
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
};

export default FloatingContactButton;

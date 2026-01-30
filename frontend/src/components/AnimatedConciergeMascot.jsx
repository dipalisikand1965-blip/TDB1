/**
 * AnimatedConciergeMascot.jsx
 * Dynamic animated concierge mascot with paw bell
 * Brings the page to life with subtle animations
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, MessageCircle, ArrowRight, PawPrint } from 'lucide-react';
import { Button } from './ui/button';

const AnimatedConciergeMascot = ({ 
  petName = null,
  suggestions = [],
  onSuggestionClick,
  onAskMira,
  position = 'right' // right or left
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [showBubble, setShowBubble] = useState(true);

  // Rotate through suggestions
  useEffect(() => {
    if (suggestions.length > 1) {
      const interval = setInterval(() => {
        setCurrentSuggestion(prev => (prev + 1) % suggestions.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [suggestions.length]);

  // Auto show bubble after delay
  useEffect(() => {
    const timer = setTimeout(() => setShowBubble(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const defaultSuggestions = [
    { text: petName ? `Perfect picks for ${petName}!` : 'Find the perfect fitness plan!', action: 'browse' },
    { text: 'Need help choosing?', action: 'ask' },
    { text: 'Popular this week 🔥', action: 'trending' }
  ];

  const activeSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  return (
    <div className={`fixed ${position === 'right' ? 'right-4 sm:right-6' : 'left-4 sm:left-6'} bottom-24 sm:bottom-8 z-50`}>
      <AnimatePresence>
        {/* Speech Bubble */}
        {showBubble && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className={`absolute ${position === 'right' ? 'right-16' : 'left-16'} bottom-2 mb-2`}
          >
            <div 
              className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 max-w-[200px] cursor-pointer hover:shadow-2xl transition-shadow"
              onClick={() => setIsExpanded(true)}
            >
              <motion.p 
                key={currentSuggestion}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-700 font-medium"
              >
                {activeSuggestions[currentSuggestion]?.text}
              </motion.p>
              <div className="flex items-center gap-1 mt-2 text-teal-600 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Tap to explore</span>
              </div>
              {/* Speech bubble tail */}
              <div className={`absolute ${position === 'right' ? '-right-2' : '-left-2'} bottom-4 w-4 h-4 bg-white border-r border-b border-gray-100 transform ${position === 'right' ? 'rotate-[-45deg]' : 'rotate-[135deg]'}`} />
            </div>
          </motion.div>
        )}

        {/* Expanded Panel */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`absolute ${position === 'right' ? 'right-0' : 'left-0'} bottom-16 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <PawPrint className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Fit Concierge®</p>
                    <p className="text-white/70 text-xs">Here to help!</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Suggestions */}
            <div className="p-3 space-y-2">
              {petName && (
                <div className="p-2 bg-teal-50 rounded-lg border border-teal-100">
                  <p className="text-xs text-teal-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Personalized for <span className="font-semibold">{petName}</span>
                  </p>
                </div>
              )}
              
              {activeSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-teal-50 rounded-xl transition-colors group"
                >
                  <p className="text-sm text-gray-700 group-hover:text-teal-700 font-medium">
                    {suggestion.text}
                  </p>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-teal-500 mt-1" />
                </button>
              ))}

              <Button 
                onClick={onAskMira}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Ask Mira AI
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Mascot Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-teal-500 via-emerald-500 to-green-500 shadow-xl flex items-center justify-center group hover:shadow-2xl transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: isExpanded 
            ? '0 0 0 4px rgba(20, 184, 166, 0.3)' 
            : '0 10px 40px rgba(20, 184, 166, 0.4)'
        }}
      >
        {/* Paw Print Icon */}
        <div className="relative">
          <PawPrint className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          
          {/* Bell Animation */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ 
              rotate: [0, 15, -15, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 0.5,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300 fill-yellow-300" />
          </motion.div>
        </div>

        {/* Pulse Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-teal-400"
          animate={{ 
            scale: [1, 1.3, 1.5],
            opacity: [0.6, 0.3, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
        />

        {/* Sparkle Effects */}
        <motion.div
          className="absolute -top-1 -left-1"
          animate={{ 
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 2
          }}
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
        </motion.div>
      </motion.button>
    </div>
  );
};

export default AnimatedConciergeMascot;

/**
 * SocialProofBadges.jsx
 * Subtle trust signals that feel organic
 * Shows booking counts, breed endorsements, and live counters
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Heart, Sparkles, CheckCircle } from 'lucide-react';

// Animated counter hook
const useAnimatedCounter = (target, duration = 2000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  
  return count;
};

// Main Stats Banner - Context-aware messaging (no fake numbers)
export const FitnessJourneyCounter = ({ className = '', pillar = '' }) => {
  // Pillar-specific authentic messaging instead of fake numbers
  const pillarMessages = {
    fit: 'Personalized wellness journeys',
    care: 'Trusted by pet parents',
    stay: 'Pet-friendly stays curated',
    enjoy: 'Tail-wagging experiences',
    celebrate: 'Moments made special',
    dine: 'Nutrition crafted with love',
    travel: 'Safe journeys planned',
  };
  const message = pillarMessages[pillar] || 'Loved by pet families';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 
                  rounded-full border border-teal-200/50 ${className}`}
    >
      <div className="flex -space-x-2">
        {['🐕', '🐈', '🐩'].map((emoji, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-teal-100 flex items-center justify-center text-xs">
            {emoji}
          </div>
        ))}
      </div>
      <span className="text-sm text-teal-700 font-medium">
        {message}
      </span>
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
      </motion.div>
    </motion.div>
  );
};

// Service Card Badge - "X booked this week"
export const BookingCountBadge = ({ count = 12, className = '' }) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 
                     rounded-full text-[11px] font-medium ${className}`}>
      <Users className="w-3 h-3" />
      <span>{count} booked this week</span>
    </div>
  );
};

// Breed-specific endorsement
export const BreedEndorsement = ({ breedName, petName, className = '' }) => {
  if (!breedName) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 
                  rounded-full text-[11px] font-medium ${className}`}
    >
      <Heart className="w-3 h-3 fill-purple-400 text-purple-400" />
      <span>{breedName}s love this</span>
    </motion.div>
  );
};

// Live spots indicator
export const SpotsLeftBadge = ({ spots = 3, context = 'this week', className = '' }) => {
  if (spots > 5) return null;
  
  return (
    <motion.div 
      animate={{ opacity: [1, 0.7, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className={`inline-flex items-center gap-1.5 px-2 py-1 bg-orange-50 text-orange-700 
                  rounded-full text-[11px] font-medium ${className}`}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
      <span>{spots} spots left {context}</span>
    </motion.div>
  );
};

// Rotating social proof messages
export const RotatingSocialProof = ({ petName, breedName, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const messages = [
    { icon: Heart, text: 'Made with love for your pet', color: 'text-pink-600 bg-pink-50' },
    { icon: Heart, text: breedName ? `Perfect for ${breedName}s` : 'Great for all breeds', color: 'text-purple-600 bg-purple-50' },
    { icon: CheckCircle, text: 'Concierge®-managed quality', color: 'text-green-600 bg-green-50' },
    { icon: Sparkles, text: 'Curated just for you', color: 'text-amber-600 bg-amber-50' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [messages.length]);

  const current = messages[currentIndex];
  const Icon = current.icon;

  return (
    <div className={`h-7 overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${current.color}`}
        >
          <Icon className="w-3 h-3" />
          <span>{current.text}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default {
  FitnessJourneyCounter,
  BookingCountBadge,
  BreedEndorsement,
  SpotsLeftBadge,
  RotatingSocialProof
};

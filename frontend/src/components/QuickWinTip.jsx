/**
 * QuickWinTip.jsx
 * PREMIUM VERSION - Elegant, delightful, feels like care
 * A gentle nudge that feels personal
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RefreshCw, ChevronRight, X, Sparkles, ArrowRight } from 'lucide-react';

// Tips database
const TIPS_DATABASE = {
  weight: [
    { tip: '15-minute morning walks boost metabolism by 20%', action: 'Set reminder', emoji: '🌅' },
    { tip: 'Splitting meals into 3 portions aids digestion', action: 'View guide', emoji: '🍽️' },
    { tip: 'Swimming burns 3x more calories than walking', action: 'Book session', emoji: '🏊' },
  ],
  puppy: [
    { tip: 'Short 5-min training sessions work best', action: 'View tips', emoji: '🎯' },
    { tip: 'Socialization before 16 weeks shapes behavior', action: 'Find groups', emoji: '🐕' },
    { tip: 'Mental games tire puppies more than running', action: 'Shop toys', emoji: '🧩' },
  ],
  senior: [
    { tip: 'Gentle stretching maintains joint flexibility', action: 'View exercises', emoji: '🧘' },
    { tip: 'Raised bowls reduce neck strain', action: 'Shop bowls', emoji: '🥣' },
    { tip: 'Shorter, frequent walks are easier on joints', action: 'Adjust plan', emoji: '🚶' },
  ],
  general: [
    { tip: 'Consistent meal times regulate energy levels', action: 'Set schedule', emoji: '⏰' },
    { tip: 'Interactive play strengthens your bond', action: 'Shop toys', emoji: '💕' },
    { tip: 'Grooming sessions double as health checks', action: 'Book grooming', emoji: '✨' },
    { tip: 'Fresh water throughout the day boosts energy', action: 'View tips', emoji: '💧' },
    { tip: 'A calm environment reduces anxiety', action: 'Learn more', emoji: '🏡' },
  ],
  labrador: [
    { tip: 'Labs love water - swimming is perfect for them', action: 'Book pool', emoji: '🏊' },
    { tip: 'Labs gain weight easily - watch portions', action: 'Calculate', emoji: '⚖️' },
  ],
  beagle: [
    { tip: 'Beagles need scent games to stay sharp', action: 'Shop mats', emoji: '👃' },
    { tip: 'Their strong nose needs secure leash walks', action: 'View tips', emoji: '🦮' },
  ],
  german_shepherd: [
    { tip: 'GSDs need mental AND physical challenges', action: 'View plans', emoji: '🧠' },
    { tip: 'Hip health is crucial - avoid high jumps', action: 'Joint guide', emoji: '🦴' },
  ],
};

const QuickWinTip = ({ 
  petName,
  petBreed,
  petAge,
  className = '',
  onActionClick
}) => {
  const [currentTip, setCurrentTip] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    selectTip();
  }, [petName, petBreed, petAge]);

  const selectTip = () => {
    setIsRefreshing(true);
    let tips = [];
    
    if (petBreed) {
      const breedKey = petBreed.toLowerCase().replace(/\s+/g, '_');
      if (TIPS_DATABASE[breedKey]) {
        tips = [...tips, ...TIPS_DATABASE[breedKey]];
      }
    }
    
    if (petAge) {
      const ageNum = parseInt(petAge);
      if (ageNum < 2) tips = [...tips, ...TIPS_DATABASE.puppy];
      else if (ageNum > 7) tips = [...tips, ...TIPS_DATABASE.senior];
    }
    
    tips = [...tips, ...TIPS_DATABASE.general];
    
    setTimeout(() => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setCurrentTip(randomTip);
      setIsRefreshing(false);
    }, 300);
  };

  if (!currentTip) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={`relative overflow-hidden rounded-3xl shadow-xl shadow-amber-100/50 ${className}`}
      >
        {/* Premium gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/40 to-orange-200/40 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-yellow-200/40 to-amber-200/40 rounded-full blur-2xl" />
        
        {/* Content */}
        <div className="relative p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Animated lightbulb */}
              <motion.div 
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 
                           flex items-center justify-center shadow-lg shadow-amber-400/30"
                animate={{ 
                  boxShadow: ['0 8px 20px rgba(245, 158, 11, 0.3)', '0 8px 30px rgba(245, 158, 11, 0.5)', '0 8px 20px rgba(245, 158, 11, 0.3)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Lightbulb className="w-6 h-6 text-white" />
                </motion.div>
              </motion.div>
              
              <div>
                <p className="font-semibold text-gray-800">
                  {petName ? `Quick win for ${petName}` : 'Quick Win'}
                </p>
                <p className="text-xs text-amber-600/80">Daily tip to boost wellness</p>
              </div>
            </div>
          </div>

          {/* Tip Content */}
          <motion.div 
            key={currentTip?.tip}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{currentTip?.emoji}</span>
              <div className="flex-1">
                <p className="text-gray-800 font-medium leading-relaxed">
                  {currentTip?.tip}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <motion.button
              onClick={() => onActionClick?.(currentTip)}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 
                         text-white font-medium rounded-xl shadow-lg shadow-amber-500/30 
                         hover:shadow-xl hover:shadow-amber-500/40 transition-all"
            >
              {currentTip?.action}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
            
            <motion.button
              onClick={selectTip}
              disabled={isRefreshing}
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center 
                         text-amber-600 shadow-sm hover:shadow transition-all"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickWinTip;

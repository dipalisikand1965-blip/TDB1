/**
 * QuickWinTip.jsx
 * PREMIUM VERSION - Elegant, delightful, feels like care
 * A gentle nudge that feels personal
 * NOW PILLAR-AWARE: Shows relevant tips per pillar
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RefreshCw, ArrowRight } from 'lucide-react';

// Tips database - Now organized by pillar
const TIPS_DATABASE = {
  // Fit pillar tips
  fit: {
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
    ],
  },
  // Stay pillar tips
  stay: {
    general: [
      { tip: 'Book pet-friendly stays 2 weeks ahead for best rates', action: 'Search stays', emoji: '🏨', actionType: 'navigate', actionUrl: '/stay' },
      { tip: 'Pack familiar bedding to help your pet feel at home', action: 'View travel checklist', emoji: '🛏️', actionType: 'checklist', checklistId: 'travel' },
      { tip: 'Request ground floor rooms for easier outdoor access', action: 'View tips', emoji: '🚪', actionType: 'checklist', checklistId: 'stay' },
      { tip: 'Check the property\'s pet policy before booking', action: 'View checklist', emoji: '📋', actionType: 'checklist', checklistId: 'stay' },
      { tip: 'Bring your pet\'s favorite blanket to reduce anxiety', action: 'Travel accessories', emoji: '🧸', actionType: 'navigate', actionUrl: '/shop?category=travel' },
      { tip: 'Ask about nearby vet clinics when booking', action: 'Find vets', emoji: '🏥', actionType: 'navigate', actionUrl: '/care?type=vet' },
    ],
  },
  // Travel pillar tips
  travel: {
    general: [
      { tip: 'Book cargo-approved crates 3 weeks before flights', action: 'Shop crates', emoji: '✈️' },
      { tip: 'Stop every 2 hours for walks on road trips', action: 'Plan route', emoji: '🚗' },
      { tip: 'Carry health certificates for interstate travel', action: 'Get docs', emoji: '📄' },
      { tip: 'Microchip your pet before any long journey', action: 'Find clinic', emoji: '💉' },
      { tip: 'Keep water accessible during travel', action: 'Shop bottles', emoji: '💧' },
      { tip: 'Avoid feeding 4 hours before flights', action: 'View guide', emoji: '🍽️' },
    ],
  },
  // Care pillar tips
  care: {
    general: [
      { tip: 'Regular grooming prevents skin issues', action: 'Book grooming', emoji: '✨' },
      { tip: 'Dental chews reduce tartar by up to 70%', action: 'Shop dental', emoji: '🦷' },
      { tip: 'Nail trimming every 3 weeks prevents pain', action: 'Book session', emoji: '✂️' },
      { tip: 'Brush teeth 3x weekly for optimal health', action: 'Shop brushes', emoji: '🪥' },
      { tip: 'Check ears weekly for signs of infection', action: 'View guide', emoji: '👂' },
      { tip: 'Seasonal flea prevention is essential', action: 'Shop meds', emoji: '🐛' },
    ],
  },
  // Dine pillar tips
  dine: {
    general: [
      { tip: 'Call restaurants ahead to confirm pet policy', action: 'View list', emoji: '📞' },
      { tip: 'Bring a portable water bowl for dining out', action: 'Shop bowls', emoji: '🥣' },
      { tip: 'Choose outdoor seating for relaxed pet dining', action: 'Find spots', emoji: '☀️' },
      { tip: 'Pack treats to reward calm behavior', action: 'Shop treats', emoji: '🦴' },
      { tip: 'Visit during off-peak hours for quieter experience', action: 'Plan visit', emoji: '🕐' },
      { tip: 'Practice restaurant etiquette at home first', action: 'View tips', emoji: '🎓' },
    ],
  },
  // Celebrate pillar tips
  celebrate: {
    general: [
      { tip: 'Pet-safe cakes use peanut butter, not chocolate', action: 'Shop cakes', emoji: '🎂' },
      { tip: 'Plan party activities around your pet\'s energy', action: 'Get ideas', emoji: '🎈' },
      { tip: 'Keep celebration noises at pet-friendly levels', action: 'View guide', emoji: '🔊' },
      { tip: 'Take photos in natural light for best results', action: 'Book shoot', emoji: '📸' },
      { tip: 'Include pet-safe decorations only', action: 'Shop decor', emoji: '🎉' },
      { tip: 'Consider a "gotcha day" celebration too', action: 'Plan event', emoji: '💝' },
    ],
  },
  // Enjoy pillar tips
  enjoy: {
    general: [
      { tip: 'Dog parks are best visited during cooler hours', action: 'Find parks', emoji: '🌳' },
      { tip: 'Playdates with similar energy dogs work best', action: 'Find buddies', emoji: '🐕' },
      { tip: 'Swimming is excellent low-impact exercise', action: 'Find pools', emoji: '🏊' },
      { tip: 'Check event reviews from other pet parents', action: 'View events', emoji: '⭐' },
      { tip: 'Bring poop bags to every outdoor activity', action: 'Shop bags', emoji: '🧹' },
      { tip: 'Keep your pet on leash until familiar with area', action: 'View tips', emoji: '🦮' },
    ],
  },
  // Learn pillar tips
  learn: {
    general: [
      { tip: 'Positive reinforcement creates lasting habits', action: 'View guide', emoji: '🌟' },
      { tip: 'Short training sessions beat long ones', action: 'Start course', emoji: '⏱️' },
      { tip: 'Consistency across family members is key', action: 'Get tips', emoji: '👨‍👩‍👧' },
      { tip: 'Reward timing matters - within 2 seconds!', action: 'Learn more', emoji: '⚡' },
      { tip: 'End training on a positive note always', action: 'View tips', emoji: '✅' },
      { tip: 'Mental stimulation prevents boredom behaviors', action: 'Shop puzzles', emoji: '🧩' },
    ],
  },
  // Breed-specific tips (shared across pillars)
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
  pillar = 'fit', // NEW: Accept pillar prop
  className = '',
  onActionClick
}) => {
  const [currentTip, setCurrentTip] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiTips, setApiTips] = useState([]);

  // Fetch tips from API on mount/pillar change
  useEffect(() => {
    const fetchApiTips = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/engagement/tips?pillar=${pillar}`);
        if (response.ok) {
          const data = await response.json();
          if (data.tips && data.tips.length > 0) {
            setApiTips(data.tips);
          }
        }
      } catch (error) {
        console.debug('Tips API fetch:', error);
      }
    };
    fetchApiTips();
  }, [pillar]);

  const selectTip = React.useCallback(() => {
    setIsRefreshing(true);
    let tips = [];
    
    // PRIORITY 1: Use API tips if available
    if (apiTips.length > 0) {
      tips = apiTips.map(t => ({
        tip: t.tip,
        action: t.action,
        emoji: t.emoji || '💡',
        actionType: t.action_type,
        actionUrl: t.action_url,
        checklistId: t.checklist_id
      }));
    } else {
      // PRIORITY 2: Get pillar-specific tips from local database
      const pillarTips = TIPS_DATABASE[pillar]?.general || [];
      if (pillarTips.length > 0) {
        tips = [...pillarTips];
      }
    }
    
    // Only add breed/age tips if NO pillar tips or if pillar is 'fit' (generic)
    if (tips.length === 0 || pillar === 'fit') {
      // Add breed-specific tips
      if (petBreed) {
        const breedKey = petBreed.toLowerCase().replace(/\s+/g, '_');
        if (TIPS_DATABASE[breedKey]) {
          tips = [...tips, ...TIPS_DATABASE[breedKey]];
        }
      }
      
      // Add age-specific tips
      if (petAge && TIPS_DATABASE.fit) {
        const ageNum = parseInt(petAge);
        if (ageNum < 2 && TIPS_DATABASE.fit.puppy) tips = [...tips, ...TIPS_DATABASE.fit.puppy];
        else if (ageNum > 7 && TIPS_DATABASE.fit.senior) tips = [...tips, ...TIPS_DATABASE.fit.senior];
      }
      
      // Fallback to fit general if still empty
      if (tips.length === 0) {
        tips = TIPS_DATABASE.fit?.general || [];
      }
    }
    
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
                <p className="text-xs text-amber-600/80">
                  {pillar === 'stay' ? 'Tips for your pawcation' :
                   pillar === 'travel' ? 'Travel tips for pet parents' :
                   pillar === 'care' ? 'Care & grooming tips' :
                   pillar === 'celebrate' ? 'Party planning tips' :
                   pillar === 'dine' ? 'Dining out with pets' :
                   pillar === 'enjoy' ? 'Fun activities for pets' :
                   pillar === 'learn' ? 'Training & learning tips' :
                   'Daily tip to boost wellness'}
                </p>
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
              onClick={() => {
                // Handle different action types
                if (currentTip?.actionType === 'checklist') {
                  // Show checklist popup via callback
                  onActionClick?.({ ...currentTip, type: 'checklist' });
                } else if (currentTip?.actionType === 'navigate' && currentTip?.actionUrl) {
                  // Navigate to URL
                  window.location.href = currentTip.actionUrl;
                } else {
                  // Default callback
                  onActionClick?.(currentTip);
                }
              }}
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

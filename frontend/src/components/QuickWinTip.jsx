/**
 * QuickWinTip.jsx
 * Personalized actionable tip for the pet
 * Shows one helpful tip that feels like genuine care
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RefreshCw, ChevronRight, X } from 'lucide-react';

// Tips database - would come from API in production
const TIPS_DATABASE = {
  weight: [
    { tip: '15-minute morning walks boost metabolism by 20%', action: 'Set a walking reminder' },
    { tip: 'Splitting meals into 3 portions helps with digestion', action: 'View feeding guide' },
    { tip: 'Swimming burns 3x more calories than walking', action: 'Book hydrotherapy' },
  ],
  puppy: [
    { tip: 'Short 5-min training sessions work best for puppies', action: 'View puppy tips' },
    { tip: 'Socialization before 16 weeks shapes lifelong behavior', action: 'Find playgroups' },
    { tip: 'Mental stimulation tires puppies more than physical play', action: 'Shop puzzle toys' },
  ],
  senior: [
    { tip: 'Gentle stretching helps maintain joint flexibility', action: 'View stretching guide' },
    { tip: 'Raised food bowls reduce strain on neck and joints', action: 'Shop elevated bowls' },
    { tip: 'Shorter, more frequent walks are easier on senior joints', action: 'Adjust walk schedule' },
  ],
  general: [
    { tip: 'Consistent meal times help regulate energy levels', action: 'Set feeding reminders' },
    { tip: 'Interactive play strengthens your bond', action: 'Shop interactive toys' },
    { tip: 'Regular grooming sessions double as health checks', action: 'Book grooming' },
  ],
  labrador: [
    { tip: 'Labs love water - swimming is perfect exercise for them', action: 'Book pool session' },
    { tip: 'Labs are prone to weight gain - watch portion sizes', action: 'Calculate portions' },
  ],
  beagle: [
    { tip: 'Beagles need scent games to stay mentally sharp', action: 'Shop snuffle mats' },
    { tip: 'Their strong nose means secure leash walks are important', action: 'View leash tips' },
  ],
  german_shepherd: [
    { tip: 'GSDs need both mental and physical challenges daily', action: 'View training plans' },
    { tip: 'Hip health is crucial - avoid high-impact jumps', action: 'Joint care guide' },
  ],
};

const QuickWinTip = ({ 
  petName,
  petBreed,
  petAge,
  petWeight,
  className = '',
  onActionClick,
  dismissible = true
}) => {
  const [currentTip, setCurrentTip] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // Select appropriate tip based on pet profile
  useEffect(() => {
    selectTip();
  }, [petName, petBreed, petAge]);

  const selectTip = () => {
    let tips = [];
    
    // Add breed-specific tips
    if (petBreed) {
      const breedKey = petBreed.toLowerCase().replace(/\s+/g, '_');
      if (TIPS_DATABASE[breedKey]) {
        tips = [...tips, ...TIPS_DATABASE[breedKey]];
      }
    }
    
    // Add age-specific tips
    if (petAge) {
      const ageNum = parseInt(petAge);
      if (ageNum < 2) {
        tips = [...tips, ...TIPS_DATABASE.puppy];
      } else if (ageNum > 7) {
        tips = [...tips, ...TIPS_DATABASE.senior];
      }
    }
    
    // Add general tips
    tips = [...tips, ...TIPS_DATABASE.general];
    
    // Randomly select one
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setCurrentTip(randomTip);
    setDismissed(false);
  };

  if (dismissed || !currentTip) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 
                    rounded-xl p-4 ${className}`}
      >
        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 hover:bg-white 
                       flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>

          {/* Content */}
          <div className="flex-1 pr-6">
            <p className="text-sm font-medium text-gray-900">
              💡 {petName ? `Tip for ${petName}` : 'Quick Win'}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              {currentTip.tip}
            </p>
            
            {/* Action */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => onActionClick?.(currentTip)}
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 
                           hover:text-amber-800 transition-colors"
              >
                {currentTip.action}
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={selectTip}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <RefreshCw className="w-3 h-3" />
                Another tip
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickWinTip;

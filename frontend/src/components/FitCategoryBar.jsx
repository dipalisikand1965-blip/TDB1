/**
 * FitCategoryBar.jsx
 * MakeMyTrip-style horizontal category bar for Fit page
 * Shows all Fit service categories with icons
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Dumbbell, Scale, Heart, Award, 
  Baby, Zap, Sparkles, Droplets, Dog
} from 'lucide-react';

const FIT_CATEGORIES = [
  { id: 'all', name: 'All Services', icon: Sparkles, emoji: '✨' },
  { id: 'assessment', name: 'Assessment', icon: Activity, emoji: '📊' },
  { id: 'training', name: 'Training', icon: Dumbbell, emoji: '🏋️' },
  { id: 'weight', name: 'Weight Mgmt', icon: Scale, emoji: '⚖️' },
  { id: 'therapy', name: 'Therapy', icon: Heart, emoji: '💆' },
  { id: 'senior', name: 'Senior Care', icon: Award, emoji: '🦮' },
  { id: 'puppy', name: 'Puppy', icon: Baby, emoji: '🐕' },
  { id: 'agility', name: 'Agility', icon: Zap, emoji: '⚡' },
  { id: 'wellness', name: 'Wellness', icon: Sparkles, emoji: '🧘' },
  { id: 'hydro', name: 'Hydrotherapy', icon: Droplets, emoji: '💧' },
];

const FitCategoryBar = ({ 
  activeCategory = 'all', 
  onCategoryChange,
  serviceCounts = {},
  className = ''
}) => {
  return (
    <div className={`bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto">
        {/* Scrollable container */}
        <div className="flex overflow-x-auto scrollbar-hide py-3 px-4 gap-1 sm:gap-2">
          {FIT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            const count = category.id === 'all' 
              ? Object.values(serviceCounts).reduce((a, b) => a + b, 0)
              : serviceCounts[category.id] || 0;
            
            return (
              <motion.button
                key={category.id}
                onClick={() => onCategoryChange?.(category.id)}
                className={`
                  relative flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] 
                  px-3 py-2 rounded-xl transition-all flex-shrink-0
                  ${isActive 
                    ? 'bg-teal-50' 
                    : 'hover:bg-gray-50'
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                {/* Icon Container */}
                <div className={`
                  w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-1
                  ${isActive 
                    ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30' 
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  <span className="text-lg sm:text-xl">{category.emoji}</span>
                </div>
                
                {/* Label */}
                <span className={`
                  text-[10px] sm:text-xs font-medium whitespace-nowrap
                  ${isActive ? 'text-teal-700' : 'text-gray-600'}
                `}>
                  {category.name}
                </span>

                {/* Count Badge */}
                {count > 0 && isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center"
                  >
                    {count}
                  </motion.span>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FitCategoryBar;

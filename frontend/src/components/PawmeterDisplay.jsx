/**
 * PawmeterDisplay.jsx
 * 
 * Displays Pawmeter quality ratings for products and services.
 * Shows overall score and individual criteria on hover/expand.
 * Fully responsive for mobile and desktop.
 */

import React, { useState } from 'react';
import { Star, Shield, Heart, Sparkles, Zap, ThumbsUp } from 'lucide-react';

// Criteria icons and labels
const CRITERIA = {
  comfort: { icon: Heart, label: 'Comfort', color: 'text-pink-500' },
  safety: { icon: Shield, label: 'Safety', color: 'text-green-500' },
  quality: { icon: Star, label: 'Quality', color: 'text-amber-500' },
  value: { icon: Zap, label: 'Value', color: 'text-blue-500' },
  joy: { icon: Sparkles, label: 'Joy', color: 'text-purple-500' }
};

// Compact display - just shows overall score
export const PawmeterBadge = ({ score, size = 'sm' }) => {
  if (!score || score < 1) return null;
  
  const sizes = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5'
  };
  
  const colors = score >= 4.5 ? 'bg-green-100 text-green-700' :
                 score >= 4.0 ? 'bg-amber-100 text-amber-700' :
                 score >= 3.5 ? 'bg-blue-100 text-blue-700' :
                 'bg-gray-100 text-gray-600';
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizes[size]} ${colors}`}>
      🐾 {score.toFixed(1)}
    </span>
  );
};

// Star rating display
export const PawmeterStars = ({ score, size = 'sm' }) => {
  if (!score || score < 1) return null;
  
  const stars = Math.round(score);
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i}
          className={`${sizes[size]} ${
            i < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
          }`}
        />
      ))}
      <span className={`ml-1 font-medium ${size === 'xs' ? 'text-xs' : 'text-sm'} text-gray-600`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
};

// Full detailed display with all criteria
const PawmeterDisplay = ({ pawmeter, variant = 'compact', showExpand = true }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!pawmeter || !pawmeter.overall) return null;
  
  const overall = pawmeter.overall;
  const ratingCount = pawmeter.rating_count || 0;
  
  // Compact variant - just overall score
  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1.5">
        <PawmeterStars score={overall} size="sm" />
        {ratingCount > 0 && (
          <span className="text-xs text-gray-400">({ratingCount})</span>
        )}
      </div>
    );
  }
  
  // Badge variant
  if (variant === 'badge') {
    return <PawmeterBadge score={overall} size="sm" />;
  }
  
  // Detailed variant with expandable criteria
  if (variant === 'detailed') {
    return (
      <div className="space-y-2">
        {/* Overall Score */}
        <div 
          className={`flex items-center justify-between ${showExpand ? 'cursor-pointer' : ''}`}
          onClick={() => showExpand && setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold text-gray-900">{overall.toFixed(1)}</span>
            </div>
            <PawmeterStars score={overall} size="sm" />
          </div>
          
          {ratingCount > 0 && (
            <span className="text-sm text-gray-500">{ratingCount} ratings</span>
          )}
        </div>
        
        {/* Expanded Criteria */}
        {expanded && (
          <div className="grid grid-cols-5 gap-2 pt-2 border-t animate-in slide-in-from-top-2">
            {Object.entries(CRITERIA).map(([key, config]) => {
              const score = pawmeter[key] || 0;
              const Icon = config.icon;
              
              return (
                <div key={key} className="flex flex-col items-center text-center">
                  <Icon className={`w-5 h-5 ${config.color}`} />
                  <span className="text-xs text-gray-600 mt-1">{config.label}</span>
                  <span className="text-sm font-semibold">{score.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
  
  // Card variant - for product cards
  if (variant === 'card') {
    const getScoreLabel = (score) => {
      if (score >= 4.5) return { text: 'Excellent', color: 'text-green-600' };
      if (score >= 4.0) return { text: 'Great', color: 'text-blue-600' };
      if (score >= 3.5) return { text: 'Good', color: 'text-amber-600' };
      return { text: 'Fair', color: 'text-gray-600' };
    };
    
    const label = getScoreLabel(overall);
    
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-white font-bold">{overall.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className={`font-medium ${label.color}`}>{label.text}</span>
            <span className="text-gray-400 text-sm">Pawmeter</span>
          </div>
          <PawmeterStars score={overall} size="xs" />
        </div>
      </div>
    );
  }
  
  return null;
};

// Hook to check if product has good pawmeter score
export const useHighRatedFilter = (products, minScore = 4.0) => {
  return products.filter(p => (p.pawmeter?.overall || 0) >= minScore);
};

export default PawmeterDisplay;

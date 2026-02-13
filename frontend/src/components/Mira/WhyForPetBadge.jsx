/**
 * WhyForPetBadge.jsx - Personalization Badge Component
 * 
 * MOJO INTEGRATION: Shows WHY products are recommended
 * - Displays the personalization reason on product tiles
 * - Dynamic reasons based on pet's profile (allergies, breed, preferences)
 * - Makes MOJO's intelligence visible to users
 */

import React, { memo } from 'react';
import { Sparkles, Heart, Shield, Star, Zap } from 'lucide-react';

/**
 * Generate personalization reason based on product and pet profile
 * @param {Object} product - Product data
 * @param {Object} pet - Pet profile data
 * @returns {Object} { text, icon, color }
 */
export const generateWhyForPet = (product, pet) => {
  if (!product || !pet) {
    return { text: 'Recommended for you', icon: '✨', color: '#8B5CF6' };
  }
  
  const productName = (product.name || '').toLowerCase();
  const petName = pet.name || 'your pet';
  const breed = (pet.breed || '').toLowerCase();
  const sensitivities = pet.sensitivities || [];
  const doggyAnswers = pet.doggy_soul_answers || {};
  
  // Priority 1: Check for allergies/sensitivities
  if (sensitivities.some(s => s.toLowerCase().includes('chicken'))) {
    if (!productName.includes('chicken')) {
      return { 
        text: `Chicken-free for ${petName}'s sensitivity`, 
        icon: '🛡️', 
        color: '#22C55E' 
      };
    }
  }
  
  if (sensitivities.some(s => s.toLowerCase().includes('grain'))) {
    if (productName.includes('grain-free') || productName.includes('grain free')) {
      return { 
        text: `Grain-free for ${petName}'s needs`, 
        icon: '🌾', 
        color: '#22C55E' 
      };
    }
  }
  
  // Priority 2: Breed-specific recommendations
  if (breed.includes('golden') || breed.includes('retriever')) {
    if (productName.includes('hip') || productName.includes('joint')) {
      return { 
        text: `Great for ${petName}'s breed joint health`, 
        icon: '🦴', 
        color: '#3B82F6' 
      };
    }
  }
  
  if (breed.includes('shih tzu') || breed.includes('maltese') || breed.includes('poodle')) {
    if (productName.includes('eye') || productName.includes('tear')) {
      return { 
        text: `Perfect for ${petName}'s eye care needs`, 
        icon: '👁️', 
        color: '#8B5CF6' 
      };
    }
    if (productName.includes('groom') || productName.includes('coat')) {
      return { 
        text: `Ideal for ${petName}'s beautiful coat`, 
        icon: '✨', 
        color: '#EC4899' 
      };
    }
  }
  
  if (breed.includes('labrador') || breed.includes('beagle')) {
    if (productName.includes('weight') || productName.includes('diet') || productName.includes('lite')) {
      return { 
        text: `Helps maintain ${petName}'s healthy weight`, 
        icon: '⚖️', 
        color: '#10B981' 
      };
    }
  }
  
  if (breed.includes('german shepherd') || breed.includes('husky')) {
    if (productName.includes('skin') || productName.includes('coat') || productName.includes('omega')) {
      return { 
        text: `Supports ${petName}'s coat & skin health`, 
        icon: '💎', 
        color: '#06B6D4' 
      };
    }
  }
  
  // Priority 3: Age-specific
  const age = doggyAnswers.age || pet.age_years;
  if (age && (parseInt(age) >= 7 || (typeof age === 'string' && age.includes('senior')))) {
    if (productName.includes('senior') || productName.includes('mature') || productName.includes('joint')) {
      return { 
        text: `Formulated for ${petName}'s golden years`, 
        icon: '🌟', 
        color: '#F59E0B' 
      };
    }
  }
  
  if (age && (parseInt(age) <= 1 || (typeof age === 'string' && age.includes('puppy')))) {
    if (productName.includes('puppy') || productName.includes('growth') || productName.includes('junior')) {
      return { 
        text: `Designed for ${petName}'s growth`, 
        icon: '🐾', 
        color: '#EC4899' 
      };
    }
  }
  
  // Priority 4: Product category fallbacks
  if (productName.includes('treat') || productName.includes('snack') || productName.includes('biscuit')) {
    return { 
      text: `A tasty reward ${petName} will love`, 
      icon: '🦴', 
      color: '#F97316' 
    };
  }
  
  if (productName.includes('shampoo') || productName.includes('brush') || productName.includes('groom')) {
    return { 
      text: `Keeps ${petName} looking beautiful`, 
      icon: '✨', 
      color: '#EC4899' 
    };
  }
  
  if (productName.includes('food') || productName.includes('kibble') || productName.includes('meal')) {
    return { 
      text: `Nutrition tailored for ${petName}`, 
      icon: '🍽️', 
      color: '#22C55E' 
    };
  }
  
  if (productName.includes('toy') || productName.includes('ball') || productName.includes('chew')) {
    return { 
      text: `Perfect for ${petName}'s playtime`, 
      icon: '🎾', 
      color: '#3B82F6' 
    };
  }
  
  if (productName.includes('bed') || productName.includes('crate') || productName.includes('blanket')) {
    return { 
      text: `Cozy comfort for ${petName}`, 
      icon: '🛏️', 
      color: '#8B5CF6' 
    };
  }
  
  // Default personalized message
  return { 
    text: `Selected for ${petName}'s profile`, 
    icon: '💜', 
    color: '#8B5CF6' 
  };
};

/**
 * WhyForPetBadge Component
 * Displays a small personalization badge on product tiles
 */
const WhyForPetBadge = memo(({ product, pet, className = '' }) => {
  const { text, icon, color } = generateWhyForPet(product, pet);
  
  return (
    <div 
      className={`why-for-pet-badge flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{ 
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}30`
      }}
      data-testid="why-for-pet-badge"
      title={text}
    >
      <span>{icon}</span>
      <span className="truncate max-w-[150px]">{text}</span>
    </div>
  );
});

WhyForPetBadge.displayName = 'WhyForPetBadge';

/**
 * Compact version for smaller spaces
 */
export const WhyForPetBadgeCompact = memo(({ product, pet }) => {
  const { text, icon, color } = generateWhyForPet(product, pet);
  
  return (
    <div 
      className="why-for-pet-compact flex items-center gap-1 px-1.5 py-0.5 rounded text-xs"
      style={{ 
        backgroundColor: `${color}15`,
        color: color
      }}
      data-testid="why-for-pet-badge-compact"
      title={text}
    >
      <span className="text-sm">{icon}</span>
      <span className="truncate max-w-[100px]">{text}</span>
    </div>
  );
});

WhyForPetBadgeCompact.displayName = 'WhyForPetBadgeCompact';

export default WhyForPetBadge;

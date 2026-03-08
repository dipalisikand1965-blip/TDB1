import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../utils/api';

/**
 * SoulPersonalizationContext
 * 
 * Provides soul-level personalization data throughout the app:
 * - Current pet's archetype
 * - Personalization settings
 * - "Made for [Pet]" messaging
 */

const SoulPersonalizationContext = createContext(null);

export const useSoulPersonalization = () => {
  const context = useContext(SoulPersonalizationContext);
  if (!context) {
    return {
      isPersonalized: false,
      petName: null,
      archetype: null,
      colors: ['#9333ea', '#ec4899'],
      getMessage: () => null
    };
  }
  return context;
};

export const SoulPersonalizationProvider = ({ children, pet, user }) => {
  const [archetype, setArchetype] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch archetype when pet changes
  useEffect(() => {
    if (!pet?.id) {
      setArchetype(null);
      return;
    }

    const fetchArchetype = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/soul-archetype/pet/${pet.id}`);
        if (res.ok) {
          const data = await res.json();
          setArchetype(data.archetype);
        }
      } catch (error) {
        console.error('Failed to fetch archetype:', error);
      }
      setLoading(false);
    };

    fetchArchetype();
  }, [pet?.id]);

  // Generate personalized messages
  const getMessage = (type) => {
    const name = pet?.name || 'your pet';
    
    const messages = {
      // Product browsing
      browsing: [
        `Made for ${name}`,
        `Picked for ${name}'s personality`,
        `Inspired by ${name}'s Soul Profile`,
        `A little something that feels like ${name}`
      ],
      // Soul Made products
      soul_made: [
        `Personalized for ${name}`,
        `Crafted with ${name}'s soul in mind`,
        `${name}'s name, ${name}'s style`
      ],
      // Soul Selected products
      soul_selected: [
        `Recommended for ${name}`,
        `Perfect match for ${name}'s personality`,
        `Based on ${name}'s Soul Profile`
      ],
      // Soul Gifted products
      soul_gifted: [
        `For ${name}'s human`,
        `Show your love for ${name}`,
        `Celebrate your bond with ${name}`
      ],
      // Cart
      cart: [
        `${name}'s special order`,
        `Making ${name}'s day`
      ],
      // Checkout
      checkout: [
        `Almost ready for ${name}!`,
        `${name} is going to love this`
      ]
    };

    const typeMessages = messages[type] || messages.browsing;
    return typeMessages[Math.floor(Math.random() * typeMessages.length)];
  };

  // Get archetype-based copy tone
  const getCopyTone = () => {
    if (!archetype) return 'friendly, warm';
    return archetype.copy_tone || 'friendly, warm';
  };

  // Get archetype colors
  const getColors = () => {
    if (!archetype?.color_palette?.length) {
      return ['#9333ea', '#ec4899']; // Default purple/pink
    }
    return archetype.color_palette;
  };

  // Get celebration style
  const getCelebrationStyle = () => {
    if (!archetype) return 'fun party';
    return archetype.celebration_style || 'fun party';
  };

  // Get product affinity
  const getProductAffinity = () => {
    if (!archetype?.product_affinity) return [];
    return archetype.product_affinity;
  };

  const value = {
    isPersonalized: !!pet?.id,
    pet,
    petName: pet?.name,
    petBreed: pet?.breed,
    archetype,
    archetypeName: archetype?.archetype_name,
    archetypeEmoji: archetype?.archetype_emoji,
    colors: getColors(),
    copyTone: getCopyTone(),
    celebrationStyle: getCelebrationStyle(),
    productAffinity: getProductAffinity(),
    loading,
    getMessage
  };

  return (
    <SoulPersonalizationContext.Provider value={value}>
      {children}
    </SoulPersonalizationContext.Provider>
  );
};

/**
 * Personalized Heading Component
 * Shows "Made for [Pet]" style headings
 */
export const PersonalizedHeading = ({ 
  type = 'browsing', 
  fallback = 'Our Products',
  className = '' 
}) => {
  const { isPersonalized, getMessage, colors } = useSoulPersonalization();
  
  if (!isPersonalized) {
    return <span className={className}>{fallback}</span>;
  }
  
  const message = getMessage(type);
  
  return (
    <span 
      className={className}
      style={{ 
        background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}
    >
      {message}
    </span>
  );
};

/**
 * Soul Badge Component
 * Shows archetype badge next to pet info
 */
export const SoulBadge = ({ compact = false }) => {
  const { isPersonalized, archetypeName, archetypeEmoji, colors } = useSoulPersonalization();
  
  if (!isPersonalized || !archetypeName) return null;
  
  if (compact) {
    return (
      <span 
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ 
          backgroundColor: `${colors[0]}20`,
          color: colors[0]
        }}
      >
        {archetypeEmoji}
      </span>
    );
  }
  
  return (
    <span 
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
      style={{ 
        backgroundColor: `${colors[0]}20`,
        color: colors[0]
      }}
    >
      {archetypeEmoji} {archetypeName}
    </span>
  );
};

/**
 * Product Tier Badge Component
 */
export const ProductTierBadge = ({ tier, className = '' }) => {
  const tierConfig = {
    soul_made: {
      label: 'Soul Made',
      emoji: '✨',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700'
    },
    soul_selected: {
      label: 'Soul Selected',
      emoji: '🎯',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700'
    },
    soul_gifted: {
      label: 'Soul Gifted',
      emoji: '🎁',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-700'
    }
  };
  
  const config = tierConfig[tier];
  if (!config) return null;
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}>
      {config.emoji} {config.label}
    </span>
  );
};

export default SoulPersonalizationContext;

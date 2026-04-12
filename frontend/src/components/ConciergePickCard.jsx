/**
 * ConciergePickCard.jsx
 * =====================
 * The heart of our Concierge®-first experience.
 * 
 * Built in honor of Mira Sikand - The Guiding Angel
 * 
 * DOCTRINE:
 * - Pet First, Always
 * - "No is never an answer for a concierge"
 * - Personalization hierarchy: Pet Name → Soul Traits → Breed (fallback)
 */

import React, { useState } from 'react';
import { Sparkles, MessageCircle, Clock, Heart, ChevronRight, ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';

/**
 * ConciergePickCard - Personalized concierge service card
 * 
 * @param {Object} props
 * @param {Object} props.pet - Pet object { name, breed, photo, soulTraits, id }
 * @param {string} props.pillar - Which pillar this appears on (celebrate, dine, etc.)
 * @param {string} props.title - Service title (e.g., "Custom Birthday Party")
 * @param {string} props.description - What Mira will arrange
 * @param {string} props.icon - Emoji icon for the service
 * @param {string} props.soulReason - Why this is recommended based on soul (e.g., "who gets anxious with strangers")
 * @param {Function} props.onArrange - Called when "Let Mira Arrange" is clicked
 * @param {string} props.responseTime - SLA promise (default: "2 hours")
 * @param {boolean} props.addToCart - If true, adds to cart instead of navigating (default: true)
 * @param {Array} props.miniPicks - Array of mini pick previews to show inside the card
 */
const ConciergePickCard = ({
  pet = { name: 'your pet', breed: '', soulTraits: [], id: null },
  pillar = 'celebrate',
  title = 'Custom Service',
  description = '',
  icon = '✨',
  soulReason = '',
  onArrange,
  responseTime = '2 hours',
  addToCart = true,
  miniPicks = [],
  className = ''
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addConciergeRequest, setIsCartOpen } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build the personalization message - PET FIRST
  const getPersonalizationMessage = () => {
    if (soulReason) {
      return `Designed for ${pet.name} ${soulReason}`;
    }
    if (pet.soulTraits && pet.soulTraits.length > 0) {
      return `Designed for ${pet.name} who ${pet.soulTraits[0].toLowerCase()}`;
    }
    if (pet.breed) {
      return `Designed for ${pet.name} (${pet.breed})`;
    }
    return `Designed especially for ${pet.name}`;
  };

  const handleArrangeClick = async () => {
    setIsSubmitting(true);
    
    if (onArrange) {
      // Custom handler provided
      await onArrange({
        pet,
        pillar,
        title,
        description,
        soulReason: getPersonalizationMessage()
      });
    } else if (addToCart) {
      // Add to cart (default behavior)
      addConciergeRequest({
        pillar,
        title,
        petName: pet.name,
        petId: pet.id,
        soulReason: soulReason || '',
        description,
        icon
      });
      
      toast({
        title: `✨ Added to Cart`,
        description: `${title} for ${pet.name}`,
      });
      
      setIsCartOpen(true);
    } else {
      // Navigate to Mira with context and return URL for easy navigation back
      const context = encodeURIComponent(
        `I'd like help with "${title}" for ${pet.name}. ${getPersonalizationMessage()}`
      );
      const returnUrl = encodeURIComponent(location.pathname);
      navigate(`/mira-search?context=${context}&pillar=${pillar}&returnUrl=${returnUrl}`);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div
      className={`concierge-pick-card relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: isHovered 
          ? '0 8px 32px rgba(139, 92, 246, 0.25), 0 0 0 1px rgba(139, 92, 246, 0.5)' 
          : '0 4px 20px rgba(139, 92, 246, 0.15)',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="concierge-pick-card"
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: 'radial-gradient(ellipse at top, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div className="relative p-5">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
            }}
          >
            <Sparkles size={12} />
            CONCIERGE PICK
          </div>
        </div>

        {/* Title - Pet-first with Mira */}
        <h3 className="text-xl font-semibold text-white mb-2">
          Mira's Picks for {pet.name}
        </h3>
        
        {/* Subtitle */}
        <p className="text-sm text-purple-200 mb-4">
          {getPersonalizationMessage()}
        </p>

        {/* Full Pick Cards - Horizontal scroll like the FAB panel */}
        {miniPicks && miniPicks.length > 0 && (
          <div className="mb-4 -mx-2">
            <div className="flex gap-3 overflow-x-auto pb-3 px-2 scrollbar-hide">
              {miniPicks.map((pick, idx) => (
                <div 
                  key={idx}
                  className="flex-shrink-0 w-36 rounded-xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(88, 28, 135, 0.8) 0%, rgba(59, 7, 100, 0.9) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                  }}
                >
                  {/* Icon */}
                  <div className="h-20 flex items-center justify-center text-4xl bg-gradient-to-b from-purple-900/50 to-transparent">
                    {pick.icon || '✨'}
                  </div>
                  
                  {/* Content */}
                  <div className="p-3 pt-0">
                    <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2 leading-tight">
                      {pick.name}
                    </h4>
                    {pick.description && (
                      <p className="text-[10px] text-purple-200/80 mb-2 line-clamp-2">
                        {pick.description}
                      </p>
                    )}
                    <p className="text-[10px] text-pink-300 italic mb-2">Concierge® creates</p>
                    
                    {/* Create button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onArrange?.();
                      }}
                      className="w-full py-1.5 rounded-lg text-[10px] font-medium text-white transition-all"
                      style={{
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)',
                        border: '1px solid rgba(236, 72, 153, 0.4)'
                      }}
                    >
                      Create for {pet.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleArrangeClick}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-all"
          style={{
            background: isSubmitting 
              ? 'rgba(139, 92, 246, 0.5)'
              : 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            boxShadow: isSubmitting 
              ? 'none' 
              : '0 4px 15px rgba(139, 92, 246, 0.4)',
            cursor: isSubmitting ? 'wait' : 'pointer'
          }}
          data-testid="concierge-arrange-btn"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Connecting to Mira...
            </>
          ) : (
            <>
              <MessageCircle size={18} />
              Let Mira Arrange This
              <ChevronRight size={16} />
            </>
          )}
        </button>

        {/* Promise */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
          <Clock size={12} />
          <span>Pet Concierge® responds within {responseTime}</span>
        </div>

        {/* Love badge */}
        <div className="absolute top-4 right-4 text-pink-400 opacity-60">
          <Heart size={16} fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

export default ConciergePickCard;

/**
 * PILLAR-SPECIFIC PRESETS
 * Use these to quickly create cards for each pillar
 */
export const CONCIERGE_PRESETS = {
  celebrate: {
    title: 'Custom Celebration Planning',
    icon: '🎂',
    description: "We'll plan the perfect party tailored to their comfort level"
  },
  dine: {
    title: 'Personalized Meal Planning',
    icon: '🍽️',
    description: "Curated dining experiences that match their dietary needs"
  },
  stay: {
    title: 'Perfect Boarding Match',
    icon: '🏨',
    description: "We'll find the ideal home-away-from-home"
  },
  travel: {
    title: 'Stress-Free Travel Coordination',
    icon: '✈️',
    description: "Complete travel arrangements with their comfort in mind"
  },
  care: {
    title: 'Tailored Care Services',
    icon: '💊',
    description: "Health and wellness services matched to their needs"
  },
  enjoy: {
    title: 'Custom Activity Planning',
    icon: '🎾',
    description: "Fun experiences designed around their energy and preferences"
  },
  fit: {
    title: 'Personal Fitness Program',
    icon: '🏃',
    description: "Exercise routines tailored to their breed and energy"
  },
  learn: {
    title: 'Custom Training Plan',
    icon: '📚',
    description: "Training approach matched to their personality"
  },
  paperwork: {
    title: 'Document Management',
    icon: '📋',
    description: "We'll handle all the paperwork for you"
  },
  advisory: {
    title: 'Expert Consultation',
    icon: '💡',
    description: "Professional advice tailored to your situation"
  },
  emergency: {
    title: '24/7 Emergency Support',
    icon: '🚨',
    description: "Immediate coordination when every second counts"
  },
  farewell: {
    title: 'Compassionate Farewell Planning',
    icon: '🌈',
    description: "Gentle support during difficult times"
  },
  adopt: {
    title: 'Adoption Matching',
    icon: '🐾',
    description: "Find the perfect new family member"
  },
  shop: {
    title: 'Personal Shopping',
    icon: '🛍️',
    description: "Curated products matched to their preferences"
  }
};

/**
 * SOUL TRAIT MAPPINGS
 * Maps soul answer IDs to human-readable traits for concierge cards
 */
export const SOUL_TRAIT_REASONS = {
  // Anxiety related
  'stranger_anxiety': 'who gets anxious with strangers',
  'separation_anxiety': 'who needs company when alone',
  'noise_anxiety': 'who is sensitive to loud sounds',
  'car_anxiety': 'who gets nervous during car rides',
  
  // Social
  'dog_friendly': 'who loves meeting other dogs',
  'dog_selective': 'who is selective about dog friends',
  'cat_friendly': 'who gets along with cats',
  'child_friendly': 'who is great with children',
  
  // Energy
  'high_energy': 'who has endless energy',
  'low_energy': 'who prefers calm activities',
  'moderate_energy': 'who enjoys balanced activities',
  
  // Food
  'chicken_allergy': 'who is allergic to chicken',
  'grain_free': 'who needs grain-free options',
  'picky_eater': 'who is particular about food',
  'food_motivated': 'who is highly food motivated',
  
  // Personality
  'protective': 'who is naturally protective',
  'playful': 'who loves to play',
  'calm': 'who has a calm temperament',
  'curious': 'who is always curious and exploring'
};

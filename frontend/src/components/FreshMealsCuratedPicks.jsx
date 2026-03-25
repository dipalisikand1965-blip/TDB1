/**
 * FreshMealsCuratedPicks.jsx
 * 
 * Mira's curated picks for Fresh Meals - 4 cards personalized to the pet
 * 
 * PRINCIPLES:
 * 1. Concierge®-first: Cards create tickets, not cart items
 * 2. Allergy-aware: Respects pet's avoid list
 * 3. Persona-based: Scoring based on pet traits
 * 4. Intent capture: Opens FlowModal or creates ticket directly
 */

import React, { useState, useEffect } from 'react';
import { 
  Utensils, ArrowRightCircle, Stethoscope, Building,
  ChevronRight, Sparkles, Star, Loader2, AlertCircle, MapPin
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import useUniversalServiceCommand, { ENTRY_POINTS, REQUEST_TYPES } from '../hooks/useUniversalServiceCommand';

// Icon mapping
const ICONS = {
  utensils: Utensils,
  'arrow-right-circle': ArrowRightCircle,
  stethoscope: Stethoscope,
  building: Building
};

// Badge colors
const BADGE_COLORS = {
  'Popular': 'bg-orange-100 text-orange-700 border-orange-200',
  'Expert': 'bg-purple-100 text-purple-700 border-purple-200',
  'Local': 'bg-green-100 text-green-700 border-green-200',
  'Recommended': 'bg-blue-100 text-blue-700 border-blue-200'
};

/**
 * Single Curated Card Component
 */
const CuratedCard = ({ card, pet, onCardClick, isLoading }) => {
  const IconComponent = ICONS[card.icon] || Sparkles;
  const badgeClass = card.badge ? BADGE_COLORS[card.badge] || BADGE_COLORS['Recommended'] : null;
  
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200 group">
      {/* Badge */}
      {card.badge && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className={`${badgeClass} border text-xs`}>
            {card.badge === 'Local' && <MapPin className="w-3 h-3 mr-1" />}
            {card.badge}
          </Badge>
        </div>
      )}
      
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            card.type === 'concierge_product' 
              ? 'bg-orange-100 text-orange-600' 
              : 'bg-purple-100 text-purple-600'
          }`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">
              {card.name}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {card.type === 'concierge_product' ? 'Curated Plan' : 'Concierge® Service'}
            </p>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {card.description}
        </p>
        
        {/* Why for this pet */}
        {card.why_for_pet && (
          <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 rounded-lg">
            <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-700">
              {card.why_for_pet}
            </p>
          </div>
        )}
        
        {/* CTA */}
        <Button
          onClick={() => onCardClick(card)}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-sm"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {card.cta_text}
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};

/**
 * Main Component
 */
const FreshMealsCuratedPicks = ({ 
  pet, 
  token,
  onCardAction = null,
  className = ''
}) => {
  const { user } = useAuth();
  const { submitRequest, isSubmitting } = useUniversalServiceCommand();
  
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  
  // Fetch curated cards
  useEffect(() => {
    const fetchCards = async () => {
      if (!pet?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Try the intelligence layer endpoint
        const response = await fetch(`${API_URL}/api/intelligence/curated-set`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            pet_id: pet.id,
            pillar: 'fresh_meals',
            intent_context: {
              sub_pillar: 'fresh_meals',
              page: 'meals_page'
            }
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const allCards = [
            ...(data.concierge_products || []),
            ...(data.concierge_services || [])
          ];
          setCards(allCards);
        } else {
          // Fallback: use static cards with pet name substitution
          const fallbackCards = getFallbackCards(pet.name);
          setCards(fallbackCards);
        }
      } catch (err) {
        console.error('[FreshMealsCuratedPicks] Error fetching cards:', err);
        // Use fallback cards
        const fallbackCards = getFallbackCards(pet.name);
        setCards(fallbackCards);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCards();
  }, [pet?.id, token]);
  
  // Handle card click - create service request
  const handleCardClick = async (card) => {
    if (onCardAction) {
      // Custom handler provided
      onCardAction(card);
      return;
    }
    
    setActiveCardId(card.id);
    
    // Create service request via Universal Service Command
    // navigateToInbox: false - stay on page, show toast with action button
    const result = await submitRequest({
      type: card.type === 'concierge_product' 
        ? REQUEST_TYPES.FRESH_MEALS_TRIAL 
        : REQUEST_TYPES.HELP_REQUEST,
      pillar: 'dine',
      source: 'curated_pick',
      details: {
        card_id: card.id,
        card_name: card.name,
        card_type: card.type,
        sub_pillar: 'fresh_meals',
        why_phrase: card.why_for_pet,
        questions: card.default_questions
      },
      pet,
      entryPoint: ENTRY_POINTS.CARD_CTA,
      intent: `Fresh Meals: ${card.name}`,
      navigateToInbox: false,  // Stay on page - user can click "Open request" in toast
      showToast: true
    });
    
    setActiveCardId(null);
  };
  
  // Don't render if no pet
  if (!pet) {
    return null;
  }
  
  // Loading state
  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-500">Loading Mira's picks...</span>
        </div>
      </div>
    );
  }
  
  // No cards
  if (cards.length === 0) {
    return null;
  }
  
  return (
    <div className={`${className}`}>
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900">
          Mira's Fresh Picks for {pet.name}
        </h3>
        {pet.allergies?.length > 0 && (
          <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Allergy-aware
          </Badge>
        )}
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <CuratedCard
            key={card.id}
            card={card}
            pet={pet}
            onCardClick={handleCardClick}
            isLoading={isSubmitting && activeCardId === card.id}
          />
        ))}
      </div>
    </div>
  );
};

// Fallback cards when API fails
const getFallbackCards = (petName) => [
  {
    id: 'fresh_custom_meal_plan',
    type: 'concierge_product',
    name: `Custom Fresh Meal Plan for ${petName}`,
    icon: 'utensils',
    description: `A personalized fresh food plan built around ${petName}'s health goals, allergies, and taste preferences.`,
    cta_text: 'Design my plan',
    why_for_pet: `Fresh meals tailored to ${petName}'s needs`,
    badge: null
  },
  {
    id: 'fresh_transition_guide',
    type: 'concierge_product',
    name: `Fresh Food Transition for ${petName}`,
    icon: 'arrow-right-circle',
    description: `A safe 7-10 day plan to switch ${petName} from kibble to fresh meals without tummy upset.`,
    cta_text: 'Start transition',
    why_for_pet: 'Safe, gradual switch to fresh meals',
    badge: 'Popular'
  },
  {
    id: 'fresh_nutrition_consult',
    type: 'concierge_service',
    name: 'Fresh Nutrition Consultation',
    icon: 'stethoscope',
    description: `A 15-min call with our pet nutritionist to design the perfect fresh meal approach for ${petName}.`,
    cta_text: 'Book consultation',
    why_for_pet: `Expert nutrition advice for ${petName}`,
    badge: 'Expert'
  },
  {
    id: 'fresh_kitchen_tour',
    type: 'concierge_service',
    name: 'Kitchen Partner Introduction',
    icon: 'building',
    description: `We'll connect you with a vetted fresh meal kitchen near you that matches ${petName}'s needs.`,
    cta_text: 'Find my kitchen',
    why_for_pet: 'Vetted fresh meal kitchens in your area',
    badge: 'Local'
  }
];

export default FreshMealsCuratedPicks;

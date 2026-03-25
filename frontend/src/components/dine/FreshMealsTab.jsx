/**
 * FreshMealsTab.jsx
 * 
 * The GOLD STANDARD tab implementation for Mira OS.
 * This is a concierge-first experience, not a shop UI.
 * 
 * Key principles:
 * - Pet Control Center at top (sticky)
 * - Plan Builder captures intent, not filters
 * - 3 Canonical cards with fixed IDs (NEVER CHANGE)
 * - No catalogue UI when products are empty
 * - Every interaction creates or updates a ticket draft
 * 
 * Canonical Card IDs (GUARDRAIL B - NEVER CHANGE):
 * - fresh-trial-pack
 * - fresh-weekly-plan  
 * - fresh-allergy-safe
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Shield, Truck, Scale, Clock, ChevronRight,
  Check, AlertCircle, Heart, Leaf, Fish, Drumstick, Salad,
  Zap, Droplet, Star, Crown, X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { API_URL } from '../../utils/api';
import CuratedConciergeSection from '../Mira/CuratedConciergeSection';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS - GUARDRAIL B: These IDs are fixed FOREVER
// ═══════════════════════════════════════════════════════════════════════════════
const CANONICAL_CARD_IDS = {
  TRIAL_PACK: 'fresh-trial-pack',
  WEEKLY_PLAN: 'fresh-weekly-plan',
  ALLERGY_SAFE: 'fresh-allergy-safe'
};

// Generated images for consistent visual language
const FRESH_MEALS_IMAGES = {
  hero: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/84cb230bb28acc363cdf69d0a236b1efac3ec8bf0b82c9c8648399580ada71e2.png',
  trialPack: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/12367d24c74c1aba4244ccde37017f2cf701712d58736c46f124d3e30231abba.png',
  weeklyPlan: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/415582023c2d4c46c52ccad4c47ce6638d336fa0f5be0a48c548f456d7428717.png',
  allergySafe: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/61266dddd1206782be033035c8f847025fd296df495029a9f402ade7229ddfce.png'
};

// Plan Builder options
const GOAL_OPTIONS = [
  { id: 'tummy', label: 'Tummy', icon: Droplet, description: 'Digestive health' },
  { id: 'weight', label: 'Weight', icon: Scale, description: 'Weight management' },
  { id: 'energy', label: 'Energy', icon: Zap, description: 'Vitality boost' },
  { id: 'coat', label: 'Coat', icon: Star, description: 'Skin & coat health' },
  { id: 'picky', label: 'Picky', icon: Heart, description: 'Picky eater' }
];

const PROTEIN_OPTIONS = [
  { id: 'chicken', label: 'Chicken', icon: Drumstick },
  { id: 'fish', label: 'Fish', icon: Fish },
  { id: 'mutton', label: 'Mutton', icon: Drumstick },
  { id: 'veg', label: 'Veg', icon: Salad },
  { id: 'no-pref', label: 'No preference', icon: Check }
];

const CADENCE_OPTIONS = [
  { id: 'trial', label: 'Trial' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' }
];

const BUDGET_OPTIONS = [
  { id: 1, label: '₹' },
  { id: 2, label: '₹₹' },
  { id: 3, label: '₹₹₹' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// PET CONTROL CENTER - Sticky bar at top
// ═══════════════════════════════════════════════════════════════════════════════
const PetControlCenter = ({ pet, onSetPlan }) => {
  const petAllergies = pet?.allergies || pet?.soul_data?.allergies || [];
  const petGoal = pet?.soul_data?.health_goal || pet?.diet_goal;
  const petDietType = pet?.soul_data?.diet_type || pet?.diet_type;
  
  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">For:</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-semibold">
                {pet?.name || 'Your Pet'}
              </Badge>
            </div>
            
            {/* Key saved notes as chips */}
            <div className="flex flex-wrap gap-1.5">
              {petAllergies.length > 0 && (
                <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {petAllergies[0]}
                </Badge>
              )}
              {petGoal && (
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                  <Zap className="w-3 h-3 mr-1" />
                  {petGoal}
                </Badge>
              )}
              {petDietType && (
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                  <Leaf className="w-3 h-3 mr-1" />
                  {petDietType}
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            onClick={onSetPlan}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium"
          >
            Set Fresh Plan
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FRESH MEALS HERO - Personalized header
// ═══════════════════════════════════════════════════════════════════════════════
const FreshMealsHero = ({ pet }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${FRESH_MEALS_IMAGES.hero})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-orange-900/90 via-orange-800/80 to-transparent" />
      
      <div className="relative z-10 p-6 md:p-8">
        <Badge className="bg-white/20 text-white border-white/30 mb-3">
          <Sparkles className="w-3 h-3 mr-1" />
          Fresh & Personalized
        </Badge>
        
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Fresh Meals for {pet?.name || 'Your Pet'}
        </h1>
        
        <p className="text-white/90 text-sm md:text-base max-w-lg mb-4">
          Fresh meals, arranged for {pet?.name || 'your pet'} — allergy-aware, portioned, and delivered.
        </p>
        
        {/* Truth badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-white/10 text-white border-white/20 text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Allergy-aware options
          </Badge>
          <Badge className="bg-white/10 text-white border-white/20 text-xs">
            <Scale className="w-3 h-3 mr-1" />
            Portion guidance
          </Badge>
          <Badge className="bg-white/10 text-white border-white/20 text-xs">
            <Check className="w-3 h-3 mr-1" />
            Vetted kitchens
          </Badge>
          <Badge className="bg-white/10 text-white border-white/20 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Delivered on your schedule
          </Badge>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN BUILDER ROW - Request capture, NOT filters
// ═══════════════════════════════════════════════════════════════════════════════
const PlanBuilderRow = ({ planBuilder, setPlanBuilder, petHasAllergies }) => {
  
  // Handle goal selection (max 2)
  const handleGoalSelect = (goalId) => {
    const currentGoals = planBuilder.goals || [];
    
    if (currentGoals.includes(goalId)) {
      // Remove if already selected
      setPlanBuilder(prev => ({
        ...prev,
        goals: currentGoals.filter(g => g !== goalId)
      }));
    } else if (currentGoals.length < 2) {
      // Add if under limit
      setPlanBuilder(prev => ({
        ...prev,
        goals: [...currentGoals, goalId]
      }));
    } else {
      // Show toast if trying to add 3rd
      toast.info('Pick up to 2 goals so Mira can stay precise.');
    }
  };
  
  // Single select handler
  const handleSingleSelect = (field, value) => {
    setPlanBuilder(prev => ({
      ...prev,
      [field]: prev[field] === value ? null : value
    }));
  };
  
  // Toggle handler for allergy-safe
  const handleAllergyToggle = () => {
    setPlanBuilder(prev => ({
      ...prev,
      allergySafe: !prev.allergySafe
    }));
  };
  
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Tell us what {planBuilder.petName || 'your pet'} needs:
      </h3>
      
      {/* Goals (max 2) */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">
          Goal {planBuilder.goals?.length > 0 && `(${planBuilder.goals.length}/2)`}
        </label>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map(goal => {
            const isSelected = planBuilder.goals?.includes(goal.id);
            const isPrimary = planBuilder.goals?.[0] === goal.id;
            return (
              <button
                key={goal.id}
                onClick={() => handleGoalSelect(goal.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                  ${isSelected 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300'
                  }`}
              >
                <goal.icon className="w-3.5 h-3.5" />
                {goal.label}
                {isPrimary && <Badge className="bg-white/20 text-white text-[10px] ml-1">Primary</Badge>}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Protein (single select) */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Protein preference</label>
        <div className="flex flex-wrap gap-2">
          {PROTEIN_OPTIONS.map(protein => (
            <button
              key={protein.id}
              onClick={() => handleSingleSelect('protein', protein.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                ${planBuilder.protein === protein.id 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-green-300'
                }`}
            >
              <protein.icon className="w-3.5 h-3.5" />
              {protein.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Row 3: Allergy toggle + Cadence + Budget */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Allergy-safe toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAllergyToggle}
            className={`relative w-10 h-6 rounded-full transition-all
              ${planBuilder.allergySafe || petHasAllergies
                ? 'bg-red-500' 
                : 'bg-gray-300'
              }`}
          >
            <span 
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                ${planBuilder.allergySafe || petHasAllergies ? 'translate-x-4' : ''}`}
            />
          </button>
          <span className="text-sm text-gray-700">Allergy-safe</span>
          {petHasAllergies && (
            <Badge className="bg-red-100 text-red-700 text-xs">Auto-on</Badge>
          )}
        </div>
        
        {/* Cadence */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Cadence:</span>
          <div className="flex gap-1">
            {CADENCE_OPTIONS.map(c => (
              <button
                key={c.id}
                onClick={() => handleSingleSelect('cadence', c.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all
                  ${planBuilder.cadence === c.id 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Budget */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Budget:</span>
          <div className="flex gap-1">
            {BUDGET_OPTIONS.map(b => (
              <button
                key={b.id}
                onClick={() => handleSingleSelect('budget', b.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all
                  ${planBuilder.budget === b.id 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-300'
                  }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE PRODUCT CARD - Plan cards (not shop items)
// ═══════════════════════════════════════════════════════════════════════════════
const ConciergeProductCard = ({ 
  cardId, 
  title, 
  description, 
  image, 
  cta, 
  recommended,
  onCTAClick,
  petName
}) => {
  return (
    <Card className={`overflow-hidden transition-all hover:shadow-lg ${recommended ? 'ring-2 ring-orange-400' : ''}`}>
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        {recommended && (
          <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
            <Star className="w-3 h-3 mr-1" />
            Recommended
          </Badge>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">
          {title.replace('{Pet}', petName || 'Your Pet')}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {description}
        </p>
        
        <Button 
          onClick={() => onCTAClick(cardId)}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          {cta}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// HOW IT WORKS STRIP - Trust cue
// ═══════════════════════════════════════════════════════════════════════════════
const HowItWorksStrip = ({ petName }) => {
  const steps = [
    { number: 1, title: `Tell Mira ${petName || "your pet"}'s needs`, icon: '📝' },
    { number: 2, title: 'Mira curates 3 safe options', icon: '✨' },
    { number: 3, title: 'You approve, Mira arranges delivery', icon: '🚚' }
  ];
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-xl p-6 mt-8">
      <h3 className="text-center text-sm font-semibold text-gray-700 mb-4">
        How it works
      </h3>
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
        {steps.map((step, idx) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl mb-2">
                {step.icon}
              </div>
              <span className="text-xs text-gray-600 max-w-[120px]">{step.title}</span>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="hidden md:block w-5 h-5 text-gray-300 mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const FreshMealsTab = ({ activePet, token, userEmail }) => {
  // Plan Builder state
  const [planBuilder, setPlanBuilder] = useState({
    petName: activePet?.name || '',
    goals: [],
    protein: null,
    allergySafe: false,
    cadence: null,
    budget: null
  });
  
  // Draft ID for resume flow
  const [draftId, setDraftId] = useState(null);
  
  // Check if pet has allergies (auto-toggle allergy-safe)
  const petHasAllergies = useMemo(() => {
    const allergies = activePet?.allergies || activePet?.soul_data?.allergies || [];
    return allergies.length > 0;
  }, [activePet]);
  
  // Auto-toggle allergy-safe if pet has allergies
  useEffect(() => {
    if (petHasAllergies && !planBuilder.allergySafe) {
      setPlanBuilder(prev => ({ ...prev, allergySafe: true }));
    }
  }, [petHasAllergies]);
  
  // Update pet name when activePet changes
  useEffect(() => {
    if (activePet?.name) {
      setPlanBuilder(prev => ({ ...prev, petName: activePet.name }));
    }
  }, [activePet?.name]);
  
  // Determine card order based on allergy status
  const cardOrder = useMemo(() => {
    const showAllergyRecommended = petHasAllergies || planBuilder.allergySafe;
    
    if (showAllergyRecommended) {
      // Allergy-safe moves to position #2
      return [
        { ...CARD_CONFIGS[0], recommended: false },
        { ...CARD_CONFIGS[2], recommended: true }, // Allergy-safe
        { ...CARD_CONFIGS[1], recommended: false }
      ];
    }
    
    return CARD_CONFIGS;
  }, [petHasAllergies, planBuilder.allergySafe]);
  
  // Handle card CTA click
  const handleCardCTA = async (cardId) => {
    console.log(`[FreshMealsTab] Card CTA clicked: ${cardId}`);
    
    // Generate draft ID if not exists
    const currentDraftId = draftId || `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (!draftId) setDraftId(currentDraftId);
    
    // Build ticket payload
    const payload = {
      type: cardId === CANONICAL_CARD_IDS.TRIAL_PACK ? 'FRESH_MEALS_TRIAL_PACK' :
            cardId === CANONICAL_CARD_IDS.WEEKLY_PLAN ? 'FRESH_MEALS_WEEKLY_PLAN' :
            'FRESH_MEALS_ALLERGY_SAFE',
      pillar: 'dine',
      sub_pillar: 'fresh_meals',
      pet_id: activePet?.id,
      context_source: 'dine/fresh-meals',
      card_id: cardId,
      draft_id: currentDraftId,
      metadata: {
        plan_builder: planBuilder,
        pet_name: activePet?.name,
        pet_breed: activePet?.breed
      }
    };
    
    console.log('[FreshMealsTab] Ticket payload:', payload);
    
    // TODO: Open flow modal instead of direct submission
    toast.success(`Starting ${cardId.replace('fresh-', '').replace('-', ' ')} flow for ${activePet?.name}!`);
  };
  
  // Handle Set Fresh Plan from control center
  const handleSetPlan = () => {
    // Default to trial pack if no cadence selected
    const cardId = planBuilder.cadence === 'weekly' ? CANONICAL_CARD_IDS.WEEKLY_PLAN :
                   planBuilder.allergySafe ? CANONICAL_CARD_IDS.ALLERGY_SAFE :
                   CANONICAL_CARD_IDS.TRIAL_PACK;
    handleCardCTA(cardId);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Pet Control Center - Sticky */}
      <PetControlCenter 
        pet={activePet} 
        onSetPlan={handleSetPlan}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Fresh Meals Hero */}
        <FreshMealsHero pet={activePet} />
        
        {/* Mira's Curated Picks - Reused component */}
        {activePet && token && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 md:p-6 shadow-xl">
              <CuratedConciergeSection
                petId={activePet.id}
                petName={activePet.name}
                pillar="fresh-meals"
                token={token}
                userEmail={userEmail}
              />
            </div>
          </div>
        )}
        
        {/* Plan Builder Row */}
        <PlanBuilderRow 
          planBuilder={planBuilder}
          setPlanBuilder={setPlanBuilder}
          petHasAllergies={petHasAllergies}
        />
        
        {/* 3 Canonical Concierge® Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {cardOrder.map(card => (
            <ConciergeProductCard
              key={card.id}
              cardId={card.id}
              title={card.title}
              description={card.description}
              image={card.image}
              cta={card.cta}
              recommended={card.recommended}
              onCTAClick={handleCardCTA}
              petName={activePet?.name}
            />
          ))}
        </div>
        
        {/* How It Works Strip */}
        <HowItWorksStrip petName={activePet?.name} />
        
        {/* GUARDRAIL A: No catalogue UI when empty */}
        {/* Products would go here only if they exist */}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CARD CONFIGS - Fixed structure, IDs never change
// ═══════════════════════════════════════════════════════════════════════════════
const CARD_CONFIGS = [
  {
    id: CANONICAL_CARD_IDS.TRIAL_PACK,
    title: 'Trial Pack for {Pet}',
    description: 'Start with a curated trial to discover what your pet loves. 5 questions, personalized selection.',
    image: FRESH_MEALS_IMAGES.trialPack,
    cta: 'Start Trial',
    recommended: false
  },
  {
    id: CANONICAL_CARD_IDS.WEEKLY_PLAN,
    title: 'Weekly Fresh Plan Setup',
    description: 'Build a recurring meal plan. Fresh or mixed with kibble, calculated portions, flexible delivery.',
    image: FRESH_MEALS_IMAGES.weeklyPlan,
    cta: 'Build Weekly Plan',
    recommended: false
  },
  {
    id: CANONICAL_CARD_IDS.ALLERGY_SAFE,
    title: 'Allergy-Safe Fresh Plan',
    description: 'For pets with sensitivities. Confirmed allergen list, allowed proteins, extra-safe options only.',
    image: FRESH_MEALS_IMAGES.allergySafe,
    cta: 'Allergy-Safe Only',
    recommended: false
  }
];

export default FreshMealsTab;

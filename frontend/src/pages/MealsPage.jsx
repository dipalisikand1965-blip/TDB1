/**
 * MealsPage.jsx
 * Fresh Pet Meals - Nutritious meals and food subscriptions for pets
 * 
 * ARCHITECTURE: Curated Concierge® Section ON TOP → Then Catalogue Below
 * 
 * GUARDRAILS:
 * - Canonical Card IDs are FIXED FOREVER: fresh-trial-pack, fresh-weekly-plan, fresh-allergy-safe
 * - Hero image must be ALLERGY-AWARE (no chicken if pet avoids chicken)
 * - No catalogue UI if products are empty
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import ProductCard from '../components/ProductCard';
import PersonalizedPicks from '../components/PersonalizedPicks';
import MiraChatWidget from '../components/MiraChatWidget';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import SEOHead from '../components/SEOHead';
import { MiraOSTrigger, ConciergeButton } from '../components/mira-os';
import FlowModal from '../components/FlowModal';
import UniversalServiceButton from '../components/UniversalServiceButton';
import FreshMealsCuratedPicks from '../components/FreshMealsCuratedPicks';
import { usePillarContext } from '../context/PillarContext';
import {
  Utensils, Leaf, Heart, Star, ChevronRight, Sparkles,
  Clock, Truck, Shield, CheckCircle, Package, ChevronLeft,
  Calendar, Award, ShoppingBag, Phone, MessageCircle, Send, X,
  AlertCircle, Zap, Scale, Droplet, Fish, Drumstick, Salad, Check, Crown
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// CANONICAL CARD IDs - GUARDRAIL B: THESE NEVER CHANGE
// ═══════════════════════════════════════════════════════════════════════════════
const CANONICAL_CARD_IDS = {
  TRIAL_PACK: 'fresh-trial-pack',
  WEEKLY_PLAN: 'fresh-weekly-plan',
  ALLERGY_SAFE: 'fresh-allergy-safe'
};

// ═══════════════════════════════════════════════════════════════════════════════
// HERO IMAGES - ALLERGY-AWARE (Rule 1: No restricted ingredients in imagery)
// ═══════════════════════════════════════════════════════════════════════════════
const HERO_IMAGES = {
  default: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/84cb230bb28acc363cdf69d0a236b1efac3ec8bf0b82c9c8648399580ada71e2.png',
  // Fish/salmon based - clearly NOT chicken
  noChicken: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/04c6413f93f0795b99ecf949db068eff7fda67337520ee7eeb58f6568ef825be.png',
  noMeat: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/84cb230bb28acc363cdf69d0a236b1efac3ec8bf0b82c9c8648399580ada71e2.png' // Use TDC default branded image
};

const CARD_IMAGES = {
  trialPack: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/12367d24c74c1aba4244ccde37017f2cf701712d58736c46f124d3e30231abba.png',
  weeklyPlan: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/415582023c2d4c46c52ccad4c47ce6638d336fa0f5be0a48c548f456d7428717.png',
  allergySafe: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/61266dddd1206782be033035c8f847025fd296df495029a9f402ade7229ddfce.png'
};

// Plan Builder options
const GOAL_OPTIONS = [
  { id: 'tummy', label: 'Tummy', icon: Droplet },
  { id: 'weight', label: 'Weight', icon: Scale },
  { id: 'energy', label: 'Energy', icon: Zap },
  { id: 'coat', label: 'Coat', icon: Star },
  { id: 'picky', label: 'Picky', icon: Heart }
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

// Meal Categories
const MEAL_CATEGORIES = [
  { id: 'fresh', name: 'Fresh Cooked Meals', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'raw', name: 'Raw Food Diet', icon: Leaf, color: 'bg-green-100 text-green-600' },
  { id: 'toppers', name: 'Meal Toppers', icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
  { id: 'subscription', name: 'Meal Plans', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
];

// Benefits
const BENEFITS = [
  { icon: Heart, title: 'Vet-Formulated', desc: 'All recipes designed by pet nutritionists' },
  { icon: Leaf, title: '100% Natural', desc: 'Human-grade ingredients, no fillers' },
  { icon: Truck, title: 'Fresh Delivery', desc: 'Delivered fresh to your door' },
  { icon: Shield, title: 'Satisfaction Guaranteed', desc: 'Full refund if your pet doesn\'t love it' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PET CONTROL CENTER - Sticky bar at top (Rule 2: One dominant action per viewport)
// ═══════════════════════════════════════════════════════════════════════════════
const PetControlCenter = ({ pet, planBuilder, onSetPlan, isScrolled }) => {
  const petAllergies = pet?.allergies || pet?.soul_data?.allergies || [];
  const petGoal = pet?.soul_data?.health_goal || pet?.diet_goal;
  const petDietType = pet?.soul_data?.diet_type || pet?.diet_type;
  
  return (
    <div className={`sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">For:</span>
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 font-semibold">
                {pet?.name || 'Your Pet'}
              </Badge>
            </div>
            
            {/* Key saved notes as chips - max 2 */}
            <div className="flex flex-wrap gap-1.5">
              {petAllergies.length > 0 && (
                <Badge variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  No {petAllergies[0]}
                </Badge>
              )}
              {petGoal && (
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                  <Zap className="w-3 h-3 mr-1" />
                  {petGoal}
                </Badge>
              )}
              {petDietType && !petGoal && (
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                  <Leaf className="w-3 h-3 mr-1" />
                  {petDietType}
                </Badge>
              )}
            </div>
          </div>
          
          <Button 
            onClick={onSetPlan}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium whitespace-nowrap"
          >
            Build Fresh Plan
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FRESH MEALS HERO - Personalized header with ALLERGY-AWARE imagery
// ═══════════════════════════════════════════════════════════════════════════════
const FreshMealsHero = ({ pet }) => {
  // Rule 1: Select hero image based on pet restrictions
  const petAvoid = pet?.allergies || pet?.soul_data?.allergies || [];
  const avoidsChicken = petAvoid.some(a => a?.toLowerCase?.().includes('chicken'));
  const avoidsAllMeat = petAvoid.some(a => ['meat', 'non-veg'].includes(a?.toLowerCase?.()));
  
  const heroImage = avoidsAllMeat ? HERO_IMAGES.noMeat :
                    avoidsChicken ? HERO_IMAGES.noChicken :
                    HERO_IMAGES.default;
  
  const petName = pet?.name || 'Your Pet';
  
  return (
    <div className="relative overflow-hidden rounded-2xl mb-6">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      {/* FIXED: Much stronger gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/85 to-gray-900/60" />
      
      <div className="relative z-10 p-6 md:p-8">
        <Badge className="bg-orange-500 text-white border-orange-400 mb-3 shadow-lg">
          <Sparkles className="w-3 h-3 mr-1" />
          Fresh & Personalized
        </Badge>
        
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          Fresh Meals for {petName}
        </h1>
        
        <p className="text-white text-sm md:text-base max-w-lg mb-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
          Fresh meals, arranged for {petName} — allergy-aware, portioned, and delivered.
        </p>
        
        {/* Truth badges in pill container for clarity */}
        <div className="inline-flex flex-wrap gap-2 bg-black/30 backdrop-blur-sm rounded-lg p-2">
          <Badge className="bg-white/15 text-white border-white/25 text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Allergy-aware
          </Badge>
          <Badge className="bg-white/15 text-white border-white/25 text-xs">
            <Scale className="w-3 h-3 mr-1" />
            Portion guidance
          </Badge>
          <Badge className="bg-white/15 text-white border-white/25 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Vetted kitchens
          </Badge>
          <Badge className="bg-white/15 text-white border-white/25 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Your schedule
          </Badge>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLAN BUILDER ROW - Request capture, NOT filters
// ═══════════════════════════════════════════════════════════════════════════════
const PlanBuilderRow = ({ planBuilder, setPlanBuilder, petHasAllergies, petName, petAvoid = [] }) => {
  
  // Check if a protein is blocked by pet's avoid list
  const isProteinBlocked = (proteinId) => {
    if (!petAvoid || petAvoid.length === 0) return false;
    return petAvoid.some(avoid => {
      const avoidLower = avoid?.toLowerCase?.() || '';
      return avoidLower.includes(proteinId) || proteinId.includes(avoidLower);
    });
  };
  
  const handleGoalSelect = (goalId) => {
    const currentGoals = planBuilder.goals || [];
    if (currentGoals.includes(goalId)) {
      setPlanBuilder(prev => ({ ...prev, goals: currentGoals.filter(g => g !== goalId) }));
    } else if (currentGoals.length < 2) {
      setPlanBuilder(prev => ({ ...prev, goals: [...currentGoals, goalId] }));
    } else {
      sonnerToast.info('Pick up to 2 goals so Mira can stay precise.');
    }
  };
  
  const handleProteinSelect = (proteinId) => {
    // Block if protein is in avoid list
    if (isProteinBlocked(proteinId)) {
      sonnerToast.error(`${proteinId.charAt(0).toUpperCase() + proteinId.slice(1)} is blocked for ${petName}`);
      return;
    }
    setPlanBuilder(prev => ({ ...prev, protein: prev.protein === proteinId ? null : proteinId }));
  };
  
  const handleSingleSelect = (field, value) => {
    setPlanBuilder(prev => ({ ...prev, [field]: prev[field] === value ? null : value }));
  };
  
  // Auto-clear blocked protein if it was previously selected
  React.useEffect(() => {
    if (planBuilder.protein && isProteinBlocked(planBuilder.protein)) {
      setPlanBuilder(prev => ({ ...prev, protein: null }));
      sonnerToast.info(`${planBuilder.protein} was cleared because ${petName} avoids it`);
    }
  }, [petAvoid]);
  
  return (
    <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">
        Tell us what {petName || 'your pet'} needs:
      </h3>
      
      {/* Goals (max 2) */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">
          Goal {planBuilder.goals?.length > 0 && `(${planBuilder.goals.length}/2)`}
        </label>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map(goal => {
            const isSelected = planBuilder.goals?.includes(goal.id);
            const Icon = goal.icon;
            return (
              <button
                key={goal.id}
                onClick={() => handleGoalSelect(goal.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                  ${isSelected ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-orange-300'}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {goal.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Protein (single select) - with blocked proteins disabled */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Protein preference</label>
        <div className="flex flex-wrap gap-2">
          {PROTEIN_OPTIONS.map(protein => {
            const Icon = protein.icon;
            const isBlocked = isProteinBlocked(protein.id);
            const isSelected = planBuilder.protein === protein.id;
            return (
              <button
                key={protein.id}
                onClick={() => handleProteinSelect(protein.id)}
                disabled={isBlocked}
                title={isBlocked ? `${petName} avoids ${protein.label}` : ''}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5
                  ${isBlocked 
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed line-through opacity-60' 
                    : isSelected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-green-300'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {protein.label}
                {isBlocked && <X className="w-3 h-3 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Row 3: Allergy toggle + Cadence + Budget */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlanBuilder(prev => ({ ...prev, allergySafe: !prev.allergySafe }))}
            className={`relative w-10 h-6 rounded-full transition-all ${planBuilder.allergySafe || petHasAllergies ? 'bg-red-500' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${planBuilder.allergySafe || petHasAllergies ? 'translate-x-4' : ''}`} />
          </button>
          <span className="text-sm text-gray-700">Allergy-safe</span>
          {petHasAllergies && <Badge className="bg-red-100 text-red-700 text-xs">Auto-on</Badge>}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Cadence:</span>
          <div className="flex gap-1">
            {CADENCE_OPTIONS.map(c => (
              <button
                key={c.id}
                onClick={() => handleSingleSelect('cadence', c.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all
                  ${planBuilder.cadence === c.id ? 'bg-purple-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Budget:</span>
          <div className="flex gap-1">
            {BUDGET_OPTIONS.map(b => (
              <button
                key={b.id}
                onClick={() => handleSingleSelect('budget', b.id)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all
                  ${planBuilder.budget === b.id ? 'bg-yellow-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-yellow-300'}`}
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
const ConciergeProductCard = ({ cardId, title, description, image, cta, recommended, onCTAClick, petName }) => (
  <Card className={`overflow-hidden transition-all hover:shadow-lg ${recommended ? 'ring-2 ring-orange-400' : ''}`}>
    <div className="relative h-40 overflow-hidden">
      <img src={image} alt={title} className="w-full h-full object-cover" />
      {recommended && (
        <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
          <Star className="w-3 h-3 mr-1" />
          Recommended
        </Badge>
      )}
    </div>
    <div className="p-4">
      <h3 className="font-semibold text-gray-900 mb-1">{title.replace('{Pet}', petName || 'Your Pet')}</h3>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
      <Button onClick={() => onCTAClick(cardId)} className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
        {cta}
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════════
// HOW IT WORKS STRIP - Trust cue
// ═══════════════════════════════════════════════════════════════════════════════
const HowItWorksStrip = ({ petName }) => {
  const steps = [
    { title: `Tell Mira ${petName || "your pet"}'s needs`, icon: '📝' },
    { title: 'Mira curates 3 safe options', icon: '✨' },
    { title: 'You approve, Mira arranges delivery', icon: '🚚' }
  ];
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-xl p-6 mb-8">
      <h3 className="text-center text-sm font-semibold text-gray-700 mb-4">How it works</h3>
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl mb-2">{step.icon}</div>
              <span className="text-xs text-gray-600 max-w-[120px]">{step.title}</span>
            </div>
            {idx < steps.length - 1 && <ChevronRight className="hidden md:block w-5 h-5 text-gray-300 mx-2" />}
          </div>
        ))}
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
    description: 'Start with a curated trial to discover what your pet loves. 5 questions, personalised selection.',
    image: CARD_IMAGES.trialPack,
    cta: 'Start Trial',
    recommended: false
  },
  {
    id: CANONICAL_CARD_IDS.WEEKLY_PLAN,
    title: 'Weekly Fresh Plan Setup',
    description: 'Build a recurring meal plan. Fresh or mixed with kibble, calculated portions, flexible delivery.',
    image: CARD_IMAGES.weeklyPlan,
    cta: 'Build Weekly Plan',
    recommended: false
  },
  {
    id: CANONICAL_CARD_IDS.ALLERGY_SAFE,
    title: 'Allergy-Safe Fresh Plan',
    description: 'For pets with sensitivities. Confirmed allergen list, allowed proteins, extra-safe options only.',
    image: CARD_IMAGES.allergySafe,
    cta: 'Allergy-Safe Only',
    recommended: false
  }
];

const MealsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  // Get pet from PillarContext (syncs with global pet selector)
  const { currentPet, pets: contextPets } = usePillarContext();
  const activePet = currentPet;
  
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    petName: '',
    dietType: 'fresh',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Plan Builder state for curated section
  const [planBuilder, setPlanBuilder] = useState({
    goals: [],
    protein: null,
    allergySafe: false,
    cadence: null,
    budget: null
  });
  
  // FlowModal state
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [activeFlowCardId, setActiveFlowCardId] = useState(null);
  const [flowEntryPoint, setFlowEntryPoint] = useState('card_cta');
  
  // Check if pet has allergies
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
  
  // Track scroll for sticky bar behavior
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Determine card order based on allergy status
  const cardOrder = useMemo(() => {
    const showAllergyRecommended = petHasAllergies || planBuilder.allergySafe;
    if (showAllergyRecommended) {
      return [
        { ...CARD_CONFIGS[0], recommended: false },
        { ...CARD_CONFIGS[2], recommended: true },
        { ...CARD_CONFIGS[1], recommended: false }
      ];
    }
    return CARD_CONFIGS;
  }, [petHasAllergies, planBuilder.allergySafe]);
  
  // Handle card CTA click - Opens FlowModal
  const handleCardCTA = (cardId, entryPoint = 'card_cta') => {
    console.log(`[MealsPage] Card CTA clicked: ${cardId}, entry: ${entryPoint}`);
    setActiveFlowCardId(cardId);
    setFlowEntryPoint(entryPoint);
    setFlowModalOpen(true);
  };
  
  // Handle Set Fresh Plan from control center
  const handleSetPlan = () => {
    const cardId = planBuilder.cadence === 'weekly' ? CANONICAL_CARD_IDS.WEEKLY_PLAN :
                   planBuilder.allergySafe ? CANONICAL_CARD_IDS.ALLERGY_SAFE :
                   CANONICAL_CARD_IDS.TRIAL_PACK;
    handleCardCTA(cardId, 'top_cta');
  };
  
  // Handle FlowModal close
  const handleFlowModalClose = () => {
    setFlowModalOpen(false);
    setActiveFlowCardId(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setInquiryForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || user.whatsapp || '',
        email: user.email || '',
        petName: user.pets?.[0]?.name || ''
      }));
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch meal-related products
      const [productsRes, bundlesRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/api/products?pillar=dine&limit=24`),
        fetch(`${API_URL}/api/dine/bundles`),
        fetch(`${API_URL}/api/services?pillar=care&category=feed`)
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching meals data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit meal inquiry to unified service flow
  const handleMealInquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: 'meal_consultation',
          pillar: 'dine',
          source: 'fresh_meals_page',
          customer: {
            name: inquiryForm.name,
            phone: inquiryForm.phone,
            email: inquiryForm.email
          },
          details: {
            pet_name: inquiryForm.petName,
            diet_type: inquiryForm.dietType,
            notes: inquiryForm.notes,
            request_type: 'fresh_meal_inquiry'
          },
          priority: 'medium',
          intent: 'meal_subscription'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Inquiry Submitted! 🍽️",
          description: `Ticket ${data.ticket_id} created. Our nutrition expert will contact you within 24 hours.`
        });
        setShowInquiryModal(false);
        setInquiryForm(prev => ({ ...prev, notes: '', dietType: 'fresh' }));
      } else {
        throw new Error('Failed to submit inquiry');
      }
    } catch (error) {
      console.error('Error submitting meal inquiry:', error);
      toast({
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category?.includes(selectedCategory) || p.tags?.includes(selectedCategory));

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <SEOHead 
        title="Fresh Pet Meals | The Doggy Company"
        description="Nutritious, vet-formulated fresh meals for your pet. Human-grade ingredients, delivered fresh to your door."
        path="/dine/meals"
      />
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CURATED CONCIERGE SECTION - ON TOP (Logged in users only)              */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {user && activePet ? (
        <>
          {/* Pet Control Center - Sticky */}
          <PetControlCenter 
            pet={activePet} 
            planBuilder={planBuilder}
            onSetPlan={handleSetPlan}
            isScrolled={isScrolled}
          />
          
          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Fresh Meals Hero - Allergy-aware */}
            <FreshMealsHero pet={activePet} />
            
            {/* Mira's Fresh Meals Curated Picks - 4 personalised cards */}
            <div className="mb-8">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-4 md:p-6 shadow-xl">
                {/* Quick CTA Row */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Mira's Fresh Picks for {activePet.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Curated based on {activePet.name}'s soul profile
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSetPlan}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white whitespace-nowrap"
                  >
                    Build Fresh Plan
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                
                {/* Curated Cards */}
                <FreshMealsCuratedPicks 
                  pet={activePet}
                  token={token}
                  className="[&_h3]:hidden" // Hide the section header since we have our own
                />
              </div>
            </div>
            
            {/* Plan Builder Row */}
            <PlanBuilderRow 
              planBuilder={planBuilder}
              setPlanBuilder={setPlanBuilder}
              petHasAllergies={petHasAllergies}
              petName={activePet.name}
              petAvoid={activePet?.allergies || activePet?.soul_data?.allergies || []}
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
                  petName={activePet.name}
                />
              ))}
            </div>
            
            {/* How It Works Strip */}
            <HowItWorksStrip petName={activePet.name} />
          </div>
          
          {/* Divider between curated and catalogue */}
          <div className="max-w-6xl mx-auto px-4">
            <div className="border-t border-gray-200 my-4" />
            <p className="text-center text-sm text-gray-500 mb-6">
              Or browse our catalogue below
            </p>
          </div>
        </>
      ) : (
        /* Non-logged in users: Show branded gradient hero */
        <div className="relative bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 text-white py-12 sm:py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{background:'linear-gradient(135deg,rgba(255,255,255,0.2) 0%,transparent 60%)'}} />
          
          {/* Mobile Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="sm:hidden absolute top-4 left-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
            aria-label="Go back"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          
          <div className="relative max-w-6xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-6">
              <Utensils className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="font-medium text-sm sm:text-base">Fresh Pet Nutrition</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4">
              Fresh Meals
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-orange-100 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              Nutritious, vet-formulated meals made with human-grade ingredients. Delivered fresh.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 gap-2 h-12 sm:h-11 text-base font-semibold shadow-lg"
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ShoppingBag className="w-5 h-5" />
                Shop Fresh Meals
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/20 gap-2 h-12 sm:h-11 text-base"
                onClick={() => navigate('/meal-plan')}
              >
                <Calendar className="w-5 h-5" />
                Meal Plans
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EXISTING CATALOGUE CONTENT - KEPT BELOW                                */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* Quick Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 sm:-mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {MEAL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button 
                key={cat.id} 
                onClick={() => {
                  // Meal Plans category navigates to dedicated page
                  if (cat.id === 'subscription') {
                    navigate('/meal-plan');
                  } else {
                    setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id);
                  }
                }}
                className={`p-3 sm:p-4 text-center bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  selectedCategory === cat.id ? 'ring-2 ring-orange-500' : ''
                }`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">{cat.name}</h3>
              </button>
            );
          })}
        </div>
      </div>

      {/* Personalized Picks for User's Pet */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <PersonalizedPicks pillar="dine" maxProducts={6} />
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <Card key={idx} className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{benefit.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Products Section */}
      <div id="products" className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Fresh Meal Products</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {selectedCategory === 'all' ? 'All products' : `Showing ${selectedCategory} products`}
            </p>
          </div>
          {selectedCategory !== 'all' && (
            <Button variant="outline" size="sm" onClick={() => setSelectedCategory('all')}>
              Show All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="p-3 sm:p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} pillar="dine" />
            ))}
          </div>
        ) : (
          <Card className="p-8 sm:p-12 text-center">
            <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-orange-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-sm text-gray-600">Try selecting a different category or check back later.</p>
          </Card>
        )}
      </div>

      {/* Meal Plan Bundles */}
      {bundles.length > 0 && (
        <div className="bg-orange-50 py-10 sm:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-6 sm:mb-10">
              <Badge className="bg-orange-500 text-white mb-3">
                <Package className="w-3 h-3 mr-1 inline" /> Value Bundles
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Meal Plan Bundles</h2>
              <p className="text-gray-600 text-sm sm:text-base">Save more with our curated meal bundles</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {bundles.slice(0, 6).map((bundle) => (
                <Card 
                  key={bundle.id} 
                  className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => setSelectedBundle(bundle)}
                >
                  <div className="aspect-video rounded-lg mb-4 overflow-hidden relative">
                    {bundle.image ? (
                      <img 
                        src={bundle.image} 
                        alt={bundle.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                        <Package className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">{bundle.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bundle.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-600">₹{bundle.price?.toLocaleString('en-IN') || bundle.bundle_price?.toLocaleString('en-IN')}</span>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      View Bundle
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bundle Detail Modal */}
      <Dialog open={!!selectedBundle} onOpenChange={(open) => !open && setSelectedBundle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              {selectedBundle?.name}
            </DialogTitle>
            <button 
              onClick={() => setSelectedBundle(null)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          
          {selectedBundle && (
            <div className="space-y-4">
              {selectedBundle.image && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={selectedBundle.image} 
                    alt={selectedBundle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <p className="text-gray-600">{selectedBundle.description}</p>
              
              {selectedBundle.includes && selectedBundle.includes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Bundle Includes:</h4>
                  <ul className="space-y-1">
                    {selectedBundle.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-2xl font-bold text-orange-600">
                    ₹{selectedBundle.price?.toLocaleString('en-IN') || selectedBundle.bundle_price?.toLocaleString('en-IN')}
                  </span>
                  {selectedBundle.original_price && (
                    <span className="text-sm text-gray-400 line-through ml-2">
                      ₹{selectedBundle.original_price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 gap-2"
                  onClick={() => {
                    addToCart({
                      id: selectedBundle.id,
                      name: selectedBundle.name,
                      price: selectedBundle.price || selectedBundle.bundle_price,
                      image: selectedBundle.image,
                      category: 'bundle',
                      pillar: 'dine'
                    }, 'Bundle', 'dine', 1);
                    toast({
                      title: "Added to Cart! 🛒",
                      description: `${selectedBundle.name} has been added to your cart.`
                    });
                    setSelectedBundle(null);
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Catalog */}
      <div id="services">
        <ServiceCatalogSection 
          pillar="care"
          title="Nutrition Services"
          subtitle="Expert nutrition consultation and meal planning for your pet"
          filterCategory="feed"
          maxServices={6}
        />
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Start Your Pet&apos;s Fresh Food Journey
          </h2>
          <p className="text-base sm:text-xl text-orange-100 mb-6 sm:mb-8 px-2">
            Join thousands of pet parents who&apos;ve made the switch to fresh, nutritious meals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 gap-2 h-12 sm:h-11 font-semibold shadow-lg"
              onClick={() => setShowInquiryModal(true)}
              data-testid="meal-inquiry-btn"
            >
              <MessageCircle className="w-5 h-5" />
              Get Nutrition Advice
            </Button>
            <Link to="/dine" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/20 gap-2 h-12 sm:h-11">
                Back to Dine
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Meal Inquiry Modal - Unified Service Flow */}
      <Dialog open={showInquiryModal} onOpenChange={setShowInquiryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              Get Personalized Meal Advice
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMealInquiry} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Your Name</label>
              <Input
                value={inquiryForm.name}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <Input
                value={inquiryForm.phone}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={inquiryForm.email}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pet&apos;s Name</label>
              <Input
                value={inquiryForm.petName}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, petName: e.target.value }))}
                placeholder="Your pet's name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Diet Preference</label>
              <select
                value={inquiryForm.dietType}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, dietType: e.target.value }))}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="fresh">Fresh Cooked Meals</option>
                <option value="raw">Raw Food Diet</option>
                <option value="vegetarian">Vegetarian Meals</option>
                <option value="subscription">Meal Subscription Plan</option>
                <option value="weight_management">Weight Management</option>
                <option value="senior">Senior Pet Diet</option>
                <option value="puppy">Puppy Nutrition</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tell us more</label>
              <Textarea
                value={inquiryForm.notes}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any allergies, health conditions, or specific requirements..."
                rows={3}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Inquiry
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Our nutrition expert will contact you within 24 hours
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mira Chat Widget */}
      <MiraChatWidget pillar="dine" />
      
      {/* Concierge® Button - Single entry point for help */}
      <ConciergeButton 
        pillar="dine" 
        position="bottom-right"
        showLabel
      />
      
      {/* FlowModal - Unified Flow Engine for Fresh Meals */}
      <FlowModal
        isOpen={flowModalOpen}
        onClose={handleFlowModalClose}
        cardId={activeFlowCardId}
        pet={activePet}
        planBuilder={planBuilder}
        user={user}
        token={token}
        entryPoint={flowEntryPoint}
      />
    </div>
  );
};

export default MealsPage;

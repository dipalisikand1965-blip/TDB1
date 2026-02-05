/**
 * ProductListing.jsx - Mira-Driven Pet Operating System
 * 
 * Philosophy:
 * - Products are PROPOSED, not browsed
 * - Mira is the brain, catalog is just the body
 * - Filters mirror how pet parents THINK, not how we manage inventory
 * 
 * Filter Hierarchy:
 * Layer 1: Identity (auto-applied from pet profile)
 * Layer 2: Care & Suitability (trust-building)
 * Layer 3: Values & Preferences (emotional alignment)
 * 
 * What we DON'T show prominently: Price, Brand, Pack size, Discounts
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { 
  PawPrint, Heart, Shield, Sparkles, ChevronDown, ChevronRight,
  AlertTriangle, Check, MessageCircle, Loader2, X, Info,
  Activity, Leaf, Droplets, Bone, Brain, HeartPulse, Baby,
  SlidersHorizontal, RotateCcw
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { API_URL, getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/SEOHead';
import { toast } from '../hooks/use-toast';

// ============================================
// MIRA'S UNDERSTANDING OF PET LIFE
// ============================================

// Life stages - how pet parents think about their dog's journey
const LIFE_STAGES = {
  puppy: { 
    label: 'Puppy', 
    icon: Baby,
    color: 'text-pink-600 bg-pink-50',
    needs: ['growth', 'gentle', 'small-portions', 'training']
  },
  adult: { 
    label: 'Adult', 
    icon: Activity,
    color: 'text-blue-600 bg-blue-50',
    needs: ['maintenance', 'active', 'balanced']
  },
  senior: { 
    label: 'Senior', 
    icon: Heart,
    color: 'text-purple-600 bg-purple-50',
    needs: ['joint-support', 'gentle', 'easy-digest', 'comfort']
  }
};

// ============================================
// PILLAR-SPECIFIC SUPPORT FILTERS
// Rule: Support filters must mirror the emotional state of the page
// Health logic stays. Language shifts.
// ============================================

// Birthday / Celebration = joy, safety, reassurance
const CELEBRATE_SUPPORT = [
  { id: 'sensitive-stomach', label: 'Celebration-safe', icon: Sparkles, desc: 'Gentle on digestion', subtext: 'For happy tummies during celebrations' },
  { id: 'weight', label: 'Birthday treats', icon: Heart, desc: 'Balanced indulgence', subtext: 'Special, but still suitable for your pet' },
  { id: 'breed-appropriate', label: 'Breed-appropriate', icon: PawPrint, desc: 'Right for size & breed', subtext: 'Portion and texture that suits them' },
  { id: 'allergy-friendly', label: 'Allergy-aware', icon: Shield, desc: 'Limited ingredients', subtext: 'Designed for pets with sensitivities' },
  { id: 'calming', label: 'Calm moments', icon: Brain, desc: 'Low excitement treats', subtext: 'For pets who get overwhelmed' },
  { id: 'recovery', label: 'Extra care', icon: HeartPulse, desc: 'Special care needs', subtext: 'For pets recovering or needing extra caution' }
];

// Travel = comfort, safety, familiarity
const TRAVEL_SUPPORT = [
  { id: 'sensitive-stomach', label: 'Travel-friendly', icon: Droplets, desc: 'Easy on digestion', subtext: 'For sensitive stomachs on the go' },
  { id: 'calming', label: 'Journey calm', icon: Brain, desc: 'Anxiety support', subtext: 'For nervous travelers' },
  { id: 'allergy-friendly', label: 'Safe snacking', icon: Shield, desc: 'Limited ingredients', subtext: 'Reliable options away from home' },
  { id: 'hydration', label: 'Hydration help', icon: Droplets, desc: 'Moisture-rich', subtext: 'Keeps them hydrated during travel' },
  { id: 'portable', label: 'Easy to pack', icon: Activity, desc: 'Travel-sized', subtext: 'Convenient for journeys' }
];

// Care / Daily = health, maintenance, long-term wellness
const CARE_SUPPORT = [
  { id: 'sensitive-stomach', label: 'Sensitive tummy', icon: Droplets, desc: 'Gentle on digestion', subtext: 'For everyday digestive comfort' },
  { id: 'skin-coat', label: 'Skin & coat', icon: Sparkles, desc: 'For healthy shine', subtext: 'Nourishment from within' },
  { id: 'weight', label: 'Weight support', icon: Activity, desc: 'Healthy weight management', subtext: 'Balanced nutrition' },
  { id: 'joints', label: 'Joint care', icon: Bone, desc: 'Mobility & comfort', subtext: 'For active and aging pets' },
  { id: 'dental', label: 'Dental health', icon: Heart, desc: 'Clean teeth & gums', subtext: 'Oral care support' },
  { id: 'calming', label: 'Calming', icon: Brain, desc: 'For anxious moments', subtext: 'Daily stress relief' },
  { id: 'recovery', label: 'Recovery care', icon: HeartPulse, desc: 'Special nutrition needs', subtext: 'Extra support when needed' },
  { id: 'allergy-friendly', label: 'Allergy-friendly', icon: Shield, desc: 'Limited ingredients', subtext: 'For sensitive pets' }
];

// Dine = nutrition, daily meals, balance
const DINE_SUPPORT = [
  { id: 'sensitive-stomach', label: 'Gentle meals', icon: Droplets, desc: 'Easy to digest', subtext: 'For sensitive digestive systems' },
  { id: 'weight', label: 'Portion perfect', icon: Activity, desc: 'Calorie-conscious', subtext: 'Balanced for healthy weight' },
  { id: 'allergy-friendly', label: 'Limited ingredient', icon: Shield, desc: 'Simple recipes', subtext: 'Fewer ingredients, less risk' },
  { id: 'skin-coat', label: 'Nourishing', icon: Sparkles, desc: 'Omega-rich', subtext: 'For coat health from the inside' },
  { id: 'senior', label: 'Senior-friendly', icon: Heart, desc: 'Age-appropriate', subtext: 'Nutrition for older pets' }
];

// Fit = energy, activity, performance
const FIT_SUPPORT = [
  { id: 'energy', label: 'Energy boost', icon: Activity, desc: 'High performance', subtext: 'For active lifestyles' },
  { id: 'joints', label: 'Joint support', icon: Bone, desc: 'Mobility & recovery', subtext: 'For active joints' },
  { id: 'weight', label: 'Lean & fit', icon: Activity, desc: 'Protein-rich', subtext: 'Maintains muscle, not fat' },
  { id: 'recovery', label: 'Post-activity', icon: HeartPulse, desc: 'Recovery nutrition', subtext: 'Refuel after exercise' },
  { id: 'hydration', label: 'Hydration', icon: Droplets, desc: 'Moisture support', subtext: 'Stay hydrated during activity' }
];

// Emergency = urgency, safety, immediate needs
const EMERGENCY_SUPPORT = [
  { id: 'recovery', label: 'Recovery support', icon: HeartPulse, desc: 'Gentle nutrition', subtext: 'For pets in recovery' },
  { id: 'sensitive-stomach', label: 'Easy digest', icon: Droplets, desc: 'Bland & gentle', subtext: 'When stomachs are upset' },
  { id: 'calming', label: 'Stress relief', icon: Brain, desc: 'Calming support', subtext: 'For anxious moments' },
  { id: 'hydration', label: 'Hydration', icon: Droplets, desc: 'Fluid support', subtext: 'Essential for recovery' }
];

// Farewell = comfort, dignity, gentleness
const FAREWELL_SUPPORT = [
  { id: 'comfort', label: 'Comfort care', icon: Heart, desc: 'Gentle & soothing', subtext: 'For peaceful moments' },
  { id: 'sensitive-stomach', label: 'Easy on tummy', icon: Droplets, desc: 'Very gentle', subtext: 'Minimal digestive stress' },
  { id: 'calming', label: 'Peaceful', icon: Brain, desc: 'Calming support', subtext: 'For quiet, restful times' },
  { id: 'favorite-treats', label: 'Favorite treats', icon: Sparkles, desc: 'Special indulgences', subtext: 'Whatever brings them joy' }
];

// Stay = comfort away from home
const STAY_SUPPORT = [
  { id: 'calming', label: 'Settling in', icon: Brain, desc: 'Calming support', subtext: 'For new environments' },
  { id: 'sensitive-stomach', label: 'Routine-friendly', icon: Droplets, desc: 'Gentle options', subtext: 'Keeping digestion stable' },
  { id: 'allergy-friendly', label: 'Safe options', icon: Shield, desc: 'Known ingredients', subtext: 'No surprises while away' },
  { id: 'familiar', label: 'Home comforts', icon: Heart, desc: 'Familiar favorites', subtext: 'Tastes like home' }
];

// Map pillars to their support filters
const PILLAR_SUPPORT_FILTERS = {
  celebrate: CELEBRATE_SUPPORT,
  birthday: CELEBRATE_SUPPORT,
  cakes: CELEBRATE_SUPPORT,
  hampers: CELEBRATE_SUPPORT,
  accessories: CELEBRATE_SUPPORT,
  treats: CELEBRATE_SUPPORT,
  travel: TRAVEL_SUPPORT,
  care: CARE_SUPPORT,
  dine: DINE_SUPPORT,
  fit: FIT_SUPPORT,
  emergency: EMERGENCY_SUPPORT,
  farewell: FAREWELL_SUPPORT,
  stay: STAY_SUPPORT,
  // Default fallback
  default: CARE_SUPPORT
};

// Get support filters for current context
const getSupportFilters = (category, pillar) => {
  // Check category first, then pillar, then default
  if (PILLAR_SUPPORT_FILTERS[category]) return PILLAR_SUPPORT_FILTERS[category];
  if (PILLAR_SUPPORT_FILTERS[pillar]) return PILLAR_SUPPORT_FILTERS[pillar];
  return PILLAR_SUPPORT_FILTERS.default;
};

// Values - emotional alignment with pet parent identity
const VALUES = [
  { id: 'grain-free', label: 'Grain-free' },
  { id: 'single-protein', label: 'Single protein' },
  { id: 'limited-ingredient', label: 'Limited ingredient' },
  { id: 'fresh', label: 'Fresh / gently cooked' },
  { id: 'no-additives', label: 'No artificial additives' },
  { id: 'human-grade', label: 'Human-grade' },
  { id: 'mira-recommended', label: 'Mira recommended', special: true }
];

// Avoid if... (trust-building through honesty)
const AVOID_WARNINGS = [
  { id: 'chicken', label: 'Chicken' },
  { id: 'beef', label: 'Beef' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'wheat', label: 'Wheat/Gluten' },
  { id: 'soy', label: 'Soy' },
  { id: 'corn', label: 'Corn' }
];

// Size categories
const SIZE_CATEGORIES = {
  small: { label: 'Small', weight: 'Under 10kg' },
  medium: { label: 'Medium', weight: '10-25kg' },
  large: { label: 'Large', weight: '25kg+' }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getLifeStageFromAge = (ageYears) => {
  if (ageYears < 1) return 'puppy';
  if (ageYears < 7) return 'adult';
  return 'senior';
};

const getSizeFromWeight = (weightKg) => {
  if (weightKg < 10) return 'small';
  if (weightKg < 25) return 'medium';
  return 'large';
};

// Generate "Why this works for your dog" badge
const generateMiraInsight = (product, pet) => {
  if (!pet) return null;
  
  const insights = [];
  const productText = [product.name, product.description, product.ingredients, ...(product.tags || [])].join(' ').toLowerCase();
  
  // Life stage match
  const petAge = pet.age_years || pet.age || 3;
  const lifeStage = getLifeStageFromAge(petAge);
  if (productText.includes(lifeStage) || productText.includes(LIFE_STAGES[lifeStage].label.toLowerCase())) {
    insights.push(`Right for ${pet.name}'s life stage`);
  }
  
  // Activity match
  if (pet.activity_level === 'high' && productText.includes('active')) {
    insights.push(`Matches ${pet.name}'s energy`);
  }
  
  // Sensitive stomach
  if (productText.includes('gentle') || productText.includes('sensitive')) {
    insights.push('Gentle on tummy');
  }
  
  // Joint support for seniors
  if (lifeStage === 'senior' && (productText.includes('joint') || productText.includes('mobility'))) {
    insights.push('Supports senior joints');
  }
  
  return insights[0] || null;
};

// Check product safety against pet allergies
const checkProductSafety = (product, pet) => {
  if (!pet) return { safe: true, warnings: [] };
  
  const allergies = pet?.doggy_soul_answers?.food_allergies || 
                   pet?.preferences?.allergies || 
                   pet?.health?.allergies || [];
  
  if (!Array.isArray(allergies) || allergies.length === 0) return { safe: true, warnings: [] };
  
  const productText = [product.name, product.description, product.ingredients, ...(product.tags || [])].join(' ').toLowerCase();
  const warnings = [];
  
  allergies.forEach(allergen => {
    if (allergen && productText.includes(allergen.toLowerCase())) {
      warnings.push(allergen);
    }
  });
  
  return { safe: warnings.length === 0, warnings };
};

// ============================================
// MAIN COMPONENT
// ============================================

const ProductListing = ({ category: propCategory, pillar = 'celebrate' }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, token } = useAuth();
  const { addToCart, cart } = useCart();
  
  // Core state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPets, setUserPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  
  // Track items added this session for Mira nudge
  const [sessionItemsAdded, setSessionItemsAdded] = useState(0);
  const [showMiraNudge, setShowMiraNudge] = useState(false);
  
  // Identity filters (Layer 1) - auto-applied from pet profile
  const [identityFilters, setIdentityFilters] = useState({
    lifeStage: null,  // puppy | adult | senior
    size: null,       // small | medium | large
    activityLevel: null // low | normal | high
  });
  
  // Care needs filters (Layer 2) - trust-building
  const [careFilters, setCareFilters] = useState([]);
  
  // Track which filters were auto-applied by Mira
  const [autoAppliedFilters, setAutoAppliedFilters] = useState([]);
  
  // Values filters (Layer 3) - emotional alignment
  const [valueFilters, setValueFilters] = useState([]);
  
  // Avoid filters - honesty & trust
  const [avoidFilters, setAvoidFilters] = useState([]);
  
  // UI state
  const [showCareFilters, setShowCareFilters] = useState(false);
  const [showValueFilters, setShowValueFilters] = useState(false);
  const [showAvoidFilters, setShowAvoidFilters] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  
  // Bottom sheet state (mobile)
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [pendingCareFilters, setPendingCareFilters] = useState([]);
  
  // Scroll and sticky state
  const [isScrolled, setIsScrolled] = useState(false);
  const filterBarRef = useRef(null);
  
  // Pillar transition tracking
  const [showPillarTransition, setShowPillarTransition] = useState(false);
  const hasShownTransitionRef = useRef(false);
  
  const category = propCategory || searchParams.get('category') || 'all';
  
  // Health/sensitivity filters that persist across pillars
  const PERSISTENT_FILTERS = ['sensitive-stomach', 'allergy-friendly', 'calming', 'recovery'];

  // Track scroll for sticky filter bar (desktop)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Handle pillar transitions - using a ref to track and compare
  const currentPillarRef = useRef(null);
  
  useEffect(() => {
    const currentPillar = PILLAR_SUPPORT_FILTERS[category] ? category : pillar;
    const prevPillar = currentPillarRef.current;
    
    // Only run on pillar change (not initial mount)
    if (prevPillar && prevPillar !== currentPillar && activePet) {
      // Show transition toast (once per session) - using queueMicrotask to avoid sync setState
      if (!hasShownTransitionRef.current) {
        queueMicrotask(() => {
          setShowPillarTransition(true);
          hasShownTransitionRef.current = true;
          setTimeout(() => setShowPillarTransition(false), 3000);
        });
      }
      
      // Reset occasion-specific filters, keep persistent health filters
      const persistentFilters = ['sensitive-stomach', 'allergy-friendly', 'calming', 'recovery'];
      queueMicrotask(() => {
        setCareFilters(prev => prev.filter(f => persistentFilters.includes(f)));
      });
    }
    
    currentPillarRef.current = currentPillar;
  }, [category, pillar, activePet]);

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!user || !token) return;
      
      try {
        const response = await fetch(`${getApiUrl()}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || data || [];
          setUserPets(pets);
          if (pets.length > 0) {
            const pet = pets[0];
            setActivePet(pet);
            
            // Auto-apply identity filters from pet profile
            const ageYears = pet.age_years || pet.age || 3;
            const weightKg = pet.weight || 15;
            
            setIdentityFilters({
              lifeStage: getLifeStageFromAge(ageYears),
              size: getSizeFromWeight(weightKg),
              activityLevel: pet.activity_level || 'normal'
            });
            
            // Auto-apply allergy avoidances
            const allergies = pet?.doggy_soul_answers?.food_allergies || 
                             pet?.preferences?.allergies || [];
            if (Array.isArray(allergies)) {
              const avoidIds = AVOID_WARNINGS
                .filter(a => allergies.some(allergy => 
                  allergy && allergy.toLowerCase().includes(a.id.toLowerCase())
                ))
                .map(a => a.id);
              setAvoidFilters(avoidIds);
            }
            
            // Auto-apply support filters based on pet profile
            // Mira intelligently applies relevant filters
            const autoFilters = [];
            
            // If pet has known allergies, auto-apply allergy-aware filter
            if (allergies && allergies.length > 0) {
              autoFilters.push('allergy-friendly');
            }
            
            // If pet has sensitive stomach noted
            if (pet?.health?.digestive_issues || pet?.doggy_soul_answers?.digestive_sensitivity) {
              autoFilters.push('sensitive-stomach');
            }
            
            // If pet has anxiety noted
            if (pet?.health?.anxiety || pet?.doggy_soul_answers?.anxiety_level === 'high') {
              autoFilters.push('calming');
            }
            
            // If pet is senior, add gentle care
            if (ageYears >= 7) {
              autoFilters.push('recovery');
            }
            
            // Apply and track auto-applied filters
            if (autoFilters.length > 0) {
              setAutoAppliedFilters(autoFilters);
              setCareFilters(autoFilters);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch pets:', error);
      }
    };
    
    fetchPets();
  }, [user, token]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `${getApiUrl()}/api/products?limit=100`;
        if (category && category !== 'all') {
          url += `&category=${encodeURIComponent(category)}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProducts(Array.isArray(data.products) ? data.products.filter(p => p) : []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
      setLoading(false);
    };
    
    fetchProducts();
  }, [category]);

  // Mira-driven filtering and sorting
  const { proposedProducts, hiddenCount, miraContext } = useMemo(() => {
    let proposed = [...products];
    let hidden = 0;
    let context = [];
    
    // Layer 1: Identity filtering (auto-applied)
    // These should already be right - if user is adjusting, we failed
    
    // Filter by avoid list (allergies)
    if (avoidFilters.length > 0) {
      const beforeCount = proposed.length;
      proposed = proposed.filter(product => {
        const productText = [product.name, product.description, product.ingredients, ...(product.tags || [])].join(' ').toLowerCase();
        return !avoidFilters.some(avoid => productText.includes(avoid));
      });
      hidden = beforeCount - proposed.length;
      if (hidden > 0) {
        context.push(`${hidden} items hidden to keep ${activePet?.name || 'your pet'} safe`);
      }
    }
    
    // Layer 2: Care needs filtering
    // Keywords map all filter IDs (from all pillars) to searchable terms
    if (careFilters.length > 0) {
      proposed = proposed.filter(product => {
        const productText = [product.name, product.description, product.tags?.join(' ')].join(' ').toLowerCase();
        return careFilters.some(care => {
          const careKeywords = {
            // Core health filters
            'sensitive-stomach': ['sensitive', 'gentle', 'easy digest', 'tummy', 'digestive'],
            'skin-coat': ['skin', 'coat', 'shine', 'omega', 'fur'],
            'weight': ['weight', 'lean', 'light', 'low calorie', 'diet', 'balanced'],
            'joints': ['joint', 'mobility', 'glucosamine', 'hip', 'arthritis'],
            'dental': ['dental', 'teeth', 'oral', 'chew'],
            'calming': ['calm', 'anxiety', 'relax', 'stress', 'soothing'],
            'recovery': ['recovery', 'healing', 'special', 'therapeutic', 'gentle'],
            'allergy-friendly': ['hypoallergenic', 'limited ingredient', 'single protein', 'allergy'],
            // Celebration-specific
            'breed-appropriate': ['breed', 'size appropriate', 'portion'],
            // Travel-specific
            'hydration': ['hydration', 'moisture', 'water', 'wet'],
            'portable': ['travel', 'portable', 'pack', 'convenient'],
            // Fit-specific
            'energy': ['energy', 'active', 'performance', 'protein'],
            'senior': ['senior', 'older', 'mature', 'age'],
            // Stay-specific
            'familiar': ['comfort', 'home', 'familiar'],
            // Farewell-specific
            'comfort': ['comfort', 'gentle', 'soothing', 'peaceful'],
            'favorite-treats': ['favorite', 'special', 'indulgent', 'treat']
          };
          return (careKeywords[care] || []).some(kw => productText.includes(kw));
        });
      });
    }
    
    // Layer 3: Values filtering
    if (valueFilters.length > 0) {
      proposed = proposed.filter(product => {
        const productText = [product.name, product.description, product.tags?.join(' ')].join(' ').toLowerCase();
        return valueFilters.some(value => {
          const valueKeywords = {
            'grain-free': ['grain-free', 'grain free', 'no grain'],
            'single-protein': ['single protein', 'one protein'],
            'limited-ingredient': ['limited ingredient', 'simple'],
            'fresh': ['fresh', 'gently cooked', 'raw'],
            'no-additives': ['no artificial', 'natural', 'no preservatives'],
            'human-grade': ['human-grade', 'human grade'],
            'mira-recommended': ['recommended', 'best seller', 'top rated']
          };
          return (valueKeywords[value] || []).some(kw => productText.includes(kw));
        });
      });
    }
    
    // Sort by "Best for your dog" - not price, not popularity
    proposed.sort((a, b) => {
      // Mira-recommended first
      const aScore = (a.paw_score || a.rating || 0) + (a.mira_recommended ? 10 : 0);
      const bScore = (b.paw_score || b.rating || 0) + (b.mira_recommended ? 10 : 0);
      return bScore - aScore;
    });
    
    return { 
      proposedProducts: proposed, 
      hiddenCount: hidden,
      miraContext: context
    };
  }, [products, avoidFilters, careFilters, valueFilters, activePet]);

  // Toggle care filter
  const toggleCareFilter = (id) => {
    setCareFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Toggle value filter
  const toggleValueFilter = (id) => {
    setValueFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Toggle avoid filter
  const toggleAvoidFilter = (id) => {
    setAvoidFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Category info
  const getCategoryInfo = () => ({
    cakes: { title: 'Birthday Cakes', desc: 'Freshly baked celebrations' },
    treats: { title: 'Treats & Rewards', desc: 'For training and everyday joy' },
    hampers: { title: 'Celebration Boxes', desc: 'Complete party packages' },
    desi: { title: 'Desi Treats', desc: 'Traditional flavors, pet-safe' },
    accessories: { title: 'Celebration Gear', desc: 'Party essentials' }
  }[category] || { title: 'Products', desc: 'Curated by Mira for your pet' });
  
  const categoryInfo = getCategoryInfo();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center" data-testid="loading-state">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-purple-500 animate-pulse" />
          </div>
          <p className="text-stone-500">Mira is finding the right treats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="product-listing-mira">
      <SEOHead page="products" path={location.pathname} />
      
      {/* ============================================ */}
      {/* MIRA'S UNDERSTANDING - Pet Identity Section */}
      {/* ============================================ */}
      {activePet ? (
        <div className="bg-white border-b border-stone-100">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-start gap-4">
              {/* Pet Avatar */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-amber-100">
                {activePet.photo_url ? (
                  <img src={activePet.photo_url} alt={activePet.name} className="w-full h-full object-cover" />
                ) : (
                  <PawPrint className="w-7 h-7 text-amber-500" />
                )}
              </div>
              
              {/* Mira's Understanding */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-purple-600">Mira knows {activePet.name}</span>
                </div>
                <h1 className="text-xl font-semibold text-stone-900">
                  {categoryInfo.title} for {activePet.name}
                </h1>
                
                {/* Identity Pills - Auto-applied, read-only indicators */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {identityFilters.lifeStage && (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${LIFE_STAGES[identityFilters.lifeStage].color}`}>
                      {React.createElement(LIFE_STAGES[identityFilters.lifeStage].icon, { className: 'w-3 h-3' })}
                      {LIFE_STAGES[identityFilters.lifeStage].label}
                    </span>
                  )}
                  {identityFilters.size && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-stone-600 bg-stone-100">
                      {SIZE_CATEGORIES[identityFilters.size].label} breed
                    </span>
                  )}
                  {activePet.breed && (
                    <span className="text-xs text-stone-500">{activePet.breed}</span>
                  )}
                </div>
                
                {/* Mira Context - What's being filtered */}
                {miraContext.length > 0 && (
                  <p className="text-xs text-amber-700 mt-3 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    {miraContext[0]}
                  </p>
                )}
              </div>
              
              {/* Switch Pet */}
              {userPets.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowPetSelector(!showPetSelector)}
                    className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
                  >
                    Switch <ChevronDown className="w-3 h-3" />
                  </button>
                  {showPetSelector && (
                    <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-stone-200 py-1 min-w-[140px] z-20">
                      {userPets.map(pet => (
                        <button
                          key={pet.id || pet._id}
                          onClick={() => { setActivePet(pet); setShowPetSelector(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
                        >
                          <PawPrint className="w-3 h-3 text-amber-500" />
                          {pet.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : user ? (
        /* Logged in but no pets - prompt to add */
        <div className="bg-white border-b border-stone-100">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-purple-600">Mira-curated</span>
            </div>
            <h1 className="text-2xl font-semibold text-stone-900">{categoryInfo.title}</h1>
            <p className="text-stone-500 mt-1">{categoryInfo.desc}</p>
            
            <Link 
              to="/my-pets" 
              className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 mt-4 font-medium bg-purple-50 px-4 py-2 rounded-lg"
            >
              <PawPrint className="w-4 h-4" />
              Add your pet for personalized recommendations
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* NOT LOGGED IN - Explaining why intelligence requires context */
        <div className="bg-gradient-to-b from-purple-50 to-white border-b border-stone-100" data-testid="non-member-landing">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-2xl font-semibold text-stone-900 mb-2" data-testid="headline">Personalised for Your Pet</h1>
            
            {/* Micro-line - addresses modern user anxiety */}
            <p className="text-xs text-stone-400 mb-4">No spam. No upselling. Just thoughtful care.</p>
            
            {/* Supporting line - explains WHY, not THAT */}
            <div className="text-stone-600 max-w-md mx-auto mb-6 space-y-1">
              <p className="font-medium">Mira works best once she understands your pet.</p>
              <p className="text-sm text-stone-500">
                This space is personalised using your pet&apos;s age, sensitivities, routines, and care history — so only what&apos;s appropriate is shown.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3 items-center">
              <div className="flex flex-col items-center">
                <Link 
                  to="/membership" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  data-testid="setup-pet-btn"
                >
                  <PawPrint className="w-4 h-4" />
                  Set up your pet with Mira
                </Link>
                <span className="text-xs text-stone-400 mt-1.5">Takes about 2 minutes. You can change this anytime.</span>
              </div>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-700 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition-all"
                data-testid="continue-profile-btn"
              >
                Continue with your pet profile
              </Link>
            </div>
            
            {/* Privacy reassurance */}
            <p className="text-xs text-stone-400 mt-3">Your pet&apos;s information is used only to improve care. Never shared.</p>
            
            {/* Benefits card - outcomes, not perks */}
            <div className="mt-8 p-6 bg-white rounded-xl border border-stone-200 max-w-lg mx-auto text-left" data-testid="benefits-card">
              <p className="text-sm font-medium text-stone-700 mb-3">Once Mira knows your pet, you&apos;ll notice:</p>
              <ul className="space-y-2.5 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Only options that suit your pet&apos;s sensitivities
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Suggestions matched to your pet&apos;s life stage
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Mira remembers what&apos;s worked — and what hasn&apos;t
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Quiet access to human help, when you need it
                </li>
              </ul>
            </div>
            
            {/* Grounding line - removes fear of commitment */}
            <p className="text-sm text-stone-400 mt-6">
              You can explore freely — Mira simply helps make things easier.
            </p>
          </div>
        </div>
      )}
      
      {/* ============================================ */}
      {/* PILLAR TRANSITION TOAST */}
      {/* ============================================ */}
      {showPillarTransition && activePet && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-purple-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Switching to {category || pillar} mode for {activePet.name}. Adjusting recommendations.</span>
          </div>
        </div>
      )}
      
      {/* ============================================ */}
      {/* FILTER BAR - Desktop: inline, Mobile: trigger button */}
      {/* ============================================ */}
      {(activePet || user) && (
        <>
          {/* Desktop Filter Bar */}
          <div 
            ref={filterBarRef}
            className={`hidden md:block bg-white border-b border-stone-100 transition-all duration-200 ${
              isScrolled ? 'sticky top-0 z-40 shadow-sm' : ''
            }`}
          >
            <div className="max-w-6xl mx-auto px-4 py-3">
              {/* Applied filters chip row (desktop) */}
              {(careFilters.length > 0 || avoidFilters.length > 0) && (
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className="text-stone-500">Applied for {activePet?.name || 'your pet'}:</span>
                  {careFilters.map(filterId => {
                    const filterDef = getSupportFilters(category, pillar).find(f => f.id === filterId);
                    const isAuto = autoAppliedFilters.includes(filterId);
                    return filterDef ? (
                      <button
                        key={filterId}
                        onClick={() => toggleCareFilter(filterId)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${
                          isAuto ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                        } hover:opacity-80`}
                      >
                        {filterDef.label}
                        <X className="w-3 h-3" />
                      </button>
                    ) : null;
                  })}
                  {careFilters.length > 0 && (
                    <button 
                      onClick={() => setCareFilters(autoAppliedFilters)}
                      className="text-stone-400 hover:text-stone-600 ml-1"
                    >
                      Reset to {activePet?.name || 'profile'}
                    </button>
                  )}
                </div>
              )}
              
              {/* Desktop filter sections - vertical stack for thoughtfulness */}
              <div className="space-y-3">
                {/* Support filters */}
                <div>
                  <button
                    onClick={() => setShowCareFilters(!showCareFilters)}
                    className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900 w-full"
                  >
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>What would you like to support right now?</span>
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showCareFilters ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showCareFilters && (
                    <div className="mt-3 space-y-2 max-w-xl">
                      {getSupportFilters(category, pillar).map(support => {
                        const isAutoApplied = autoAppliedFilters.includes(support.id);
                        const isSelected = careFilters.includes(support.id);
                        return (
                          <button
                            key={support.id}
                            onClick={() => toggleCareFilter(support.id)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all min-h-[56px] group ${
                              isSelected
                                ? 'border-rose-300 bg-rose-50'
                                : isAutoApplied
                                ? 'border-green-200 bg-green-50/30'
                                : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                            }`}
                            data-testid={`care-filter-${support.id}`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-rose-100' : isAutoApplied ? 'bg-green-100' : 'bg-stone-100 group-hover:bg-stone-200'
                            }`}>
                              <support.icon className={`w-5 h-5 ${
                                isSelected ? 'text-rose-600' : isAutoApplied ? 'text-green-600' : 'text-stone-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isSelected ? 'text-rose-700' : 'text-stone-700'}`}>
                                  {support.label}
                                </span>
                                {isAutoApplied && (
                                  <span className="text-[10px] text-green-600">
                                    (applied for {activePet?.name})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-stone-500 block">{support.desc}</span>
                              {/* Subtext on hover (desktop only) */}
                              {support.subtext && (
                                <span className="text-[11px] text-stone-400 hidden group-hover:block">{support.subtext}</span>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="w-5 h-5 text-rose-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Avoid filters */}
                <div>
                  <button
                    onClick={() => setShowAvoidFilters(!showAvoidFilters)}
                    className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900"
                  >
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span>Avoid if sensitive to...</span>
                    {avoidFilters.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                        {avoidFilters.length}
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showAvoidFilters ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAvoidFilters && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {AVOID_WARNINGS.map(avoid => (
                        <button
                          key={avoid.id}
                          onClick={() => toggleAvoidFilter(avoid.id)}
                          className={`px-3 py-2 rounded-full text-sm transition-all min-h-[40px] ${
                            avoidFilters.includes(avoid.id)
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-transparent'
                          }`}
                          data-testid={`avoid-filter-${avoid.id}`}
                        >
                          No {avoid.label}
                          {avoidFilters.includes(avoid.id) && <X className="w-3 h-3 inline ml-1.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Filter Button - Opens Bottom Sheet */}
          <div className="md:hidden bg-white border-b border-stone-100 px-4 py-3 sticky top-0 z-40">
            <button
              onClick={() => {
                setPendingCareFilters([...careFilters]);
                setShowFilterSheet(true);
              }}
              className="w-full flex items-center justify-between p-3 bg-stone-50 rounded-lg"
              data-testid="mobile-filter-trigger"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-stone-500" />
                <span className="text-sm font-medium text-stone-700">Support & preferences</span>
              </div>
              {(careFilters.length > 0 || avoidFilters.length > 0) && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">
                  {careFilters.length + avoidFilters.length} active
                </span>
              )}
            </button>
            
            {/* Applied filters summary (mobile) */}
            {careFilters.length > 0 && (
              <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 text-xs">
                {careFilters.slice(0, 3).map(filterId => {
                  const filterDef = getSupportFilters(category, pillar).find(f => f.id === filterId);
                  const isAuto = autoAppliedFilters.includes(filterId);
                  return filterDef ? (
                    <span
                      key={filterId}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full whitespace-nowrap ${
                        isAuto ? 'bg-green-50 text-green-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      {filterDef.label}
                    </span>
                  ) : null;
                })}
                {careFilters.length > 3 && (
                  <span className="text-stone-400">+{careFilters.length - 3} more</span>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Bottom Sheet */}
          {showFilterSheet && (
            <div className="md:hidden fixed inset-0 z-50" data-testid="filter-bottom-sheet">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowFilterSheet(false)}
              />
              
              {/* Sheet */}
              <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-stone-300 rounded-full" />
                </div>
                
                {/* Header */}
                <div className="px-4 pb-3 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-stone-900">Support for {activePet?.name || 'your pet'}</h3>
                  <button 
                    onClick={() => setShowFilterSheet(false)}
                    className="p-2 -mr-2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Filter Cards - Scrollable, Full-width stacked */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
                  {getSupportFilters(category, pillar).map(support => {
                    const isAutoApplied = autoAppliedFilters.includes(support.id);
                    const isSelected = pendingCareFilters.includes(support.id);
                    return (
                      <button
                        key={support.id}
                        onClick={() => {
                          setPendingCareFilters(prev => 
                            prev.includes(support.id) 
                              ? prev.filter(f => f !== support.id)
                              : [...prev, support.id]
                          );
                        }}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all min-h-[64px] active:scale-[0.98] ${
                          isSelected
                            ? 'border-rose-300 bg-rose-50'
                            : isAutoApplied
                            ? 'border-green-200 bg-green-50/50'
                            : 'border-stone-200 bg-white'
                        }`}
                        data-testid={`mobile-filter-${support.id}`}
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-rose-100' : isAutoApplied ? 'bg-green-100' : 'bg-stone-100'
                        }`}>
                          <support.icon className={`w-5 h-5 ${
                            isSelected ? 'text-rose-600' : isAutoApplied ? 'text-green-600' : 'text-stone-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${isSelected ? 'text-rose-700' : 'text-stone-800'}`}>
                              {support.label}
                            </span>
                            {isAutoApplied && (
                              <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                                applied for {activePet?.name}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-stone-500">{support.desc}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected 
                            ? 'border-rose-500 bg-rose-500' 
                            : 'border-stone-300'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Avoid section in sheet */}
                  <div className="pt-4 mt-4 border-t border-stone-100">
                    <p className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-500" />
                      Avoid if sensitive to...
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {AVOID_WARNINGS.map(avoid => (
                        <button
                          key={avoid.id}
                          onClick={() => toggleAvoidFilter(avoid.id)}
                          className={`px-4 py-2.5 rounded-full text-sm transition-all min-h-[44px] ${
                            avoidFilters.includes(avoid.id)
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-stone-100 text-stone-600 border border-transparent'
                          }`}
                        >
                          No {avoid.label}
                          {avoidFilters.includes(avoid.id) && <X className="w-3 h-3 inline ml-1.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Footer Actions */}
                <div className="px-4 py-4 border-t border-stone-100 bg-white flex gap-3">
                  <button
                    onClick={() => {
                      setPendingCareFilters(autoAppliedFilters);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border border-stone-200 text-stone-600 font-medium flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to {activePet?.name}
                  </button>
                  <button
                    onClick={() => {
                      setCareFilters(pendingCareFilters);
                      setShowFilterSheet(false);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-rose-600 text-white font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* ============================================ */}
      {/* PROPOSED PRODUCTS - Only for members */}
      {/* ============================================ */}
      {(activePet || user) && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          
          {/* Results Context */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-stone-600">
                {proposedProducts.length} options selected for {activePet?.name || 'your pet'}
              </p>
              <div className="relative group/info">
                <Info className="w-3.5 h-3.5 text-stone-400 cursor-help" />
                <div className="absolute left-0 top-full mt-1 hidden group-hover/info:block z-10">
                  <div className="bg-stone-800 text-white text-xs px-2.5 py-1.5 rounded shadow-lg whitespace-nowrap">
                    Based on {activePet?.name || 'your pet'}&apos;s profile and this occasion
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mira's Note - Service integration (appears for celebration categories) */}
          {(category === 'cakes' || category === 'hampers' || category === 'accessories' || careFilters.includes('celebration')) && (
            <div className="mb-6 p-4 bg-purple-50/30 rounded-xl border border-purple-100/30" data-testid="mira-note">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-stone-600 mb-1">
                    <span className="font-medium text-purple-600">Mira&apos;s note</span>
                  </p>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Since this looks like a celebration, many pet parents prefer a little help with timing and delivery. I can take care of that for you.
                  </p>
                  <button className="text-sm text-purple-500 hover:text-purple-600 mt-2 font-medium transition-colors">
                    Let Mira handle the arrangements
                  </button>
                </div>
              </div>
            </div>
          )}
        
        {/* Product Grid - 2x2 mobile, 4 col desktop */}
        {proposedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" data-testid="product-grid">
            {proposedProducts.map(product => (
              <MiraProductCard
                key={product.id || product._id}
                product={product}
                activePet={activePet}
                onAdd={(p) => {
                  addToCart({ ...p, quantity: 1 });
                  const newCount = sessionItemsAdded + 1;
                  setSessionItemsAdded(newCount);
                  toast({ 
                    title: 'Included', 
                    description: `Added to ${activePet?.name || 'your pet'}'s celebration plan` 
                  });
                  // Show Mira nudge after 2 items
                  if (newCount === 2) {
                    setTimeout(() => setShowMiraNudge(true), 1500);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          /* Empty state - helpful */
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-medium text-stone-700 mb-2">
              No products match these filters
            </h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
              Try adjusting your care needs or values to see more options.
            </p>
            <Button
              variant="outline"
              onClick={() => { setCareFilters([]); setValueFilters([]); }}
            >
              Clear filters
            </Button>
          </div>
        )}
        
        {/* ============================================ */}
        {/* SERVICE SUGGESTION - When products aren't enough */}
        {/* ============================================ */}
        {(careFilters.includes('calming') || careFilters.includes('sensitive-stomach')) && (
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100" data-testid="service-suggestion">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-purple-900 font-medium mb-1">
                  Mira noticed you&apos;re looking for {careFilters.includes('calming') ? 'calming support' : 'digestive care'}
                </p>
                <p className="text-sm text-purple-700 mb-4">
                  {careFilters.includes('calming') 
                    ? `If ${activePet?.name || 'your pet'}'s anxiety continues, a behaviour consult might help more than products alone.`
                    : `Ongoing tummy troubles? A nutrition consult can help find the root cause.`
                  }
                </p>
                <div className="flex gap-3">
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Talk to an expert
                  </Button>
                  <Button size="sm" variant="ghost" className="text-purple-600">
                    Ask Mira
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* ============================================ */}
        {/* MIRA NUDGE - After 2+ items added */}
        {/* ============================================ */}
        {showMiraNudge && (
          <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300" data-testid="mira-nudge">
            <div className="bg-white rounded-xl shadow-lg border border-purple-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-stone-700 mb-2">
                    You&apos;ve picked some lovely things for {activePet?.name || 'your pet'}.
                  </p>
                  <p className="text-sm text-stone-500 mb-3">
                    Would you like me to coordinate delivery timing or add a simple setup?
                  </p>
                  <div className="flex gap-2">
                    <button 
                      className="text-sm font-medium text-purple-600 hover:text-purple-700 px-3 py-1.5 bg-purple-50 rounded-lg"
                      onClick={() => setShowMiraNudge(false)}
                    >
                      Yes, please
                    </button>
                    <button 
                      className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5"
                      onClick={() => setShowMiraNudge(false)}
                    >
                      Not now
                    </button>
                  </div>
                </div>
                <button 
                  className="text-stone-400 hover:text-stone-600"
                  onClick={() => setShowMiraNudge(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Help Section */}
        <div className="mt-12 p-6 bg-white rounded-xl border border-stone-200" data-testid="help-section">
          <div className="text-center">
            <p className="text-stone-600 mb-1">Not sure what&apos;s right for {activePet?.name || 'your pet'}?</p>
            <p className="text-sm text-stone-500 mb-4">Our pet experts can help you choose.</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" className="text-sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with expert
              </Button>
              <Button className="text-sm bg-gradient-to-r from-purple-600 to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Ask Mira
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

// ============================================
// MIRA PRODUCT CARD - Answers "Is this right?"
// ============================================
const MiraProductCard = ({ product, activePet, onAdd }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const PLACEHOLDER = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop';
  
  const getImage = () => {
    if (product.image?.startsWith('http')) return product.image;
    if (product.images?.[0]?.startsWith('http')) return product.images[0];
    if (product.thumbnail?.startsWith('http')) return product.thumbnail;
    return PLACEHOLDER;
  };
  
  const price = product.minPrice || product.price || 0;
  const hasVariants = (product.sizes?.length > 1) || (product.flavors?.length > 1);
  
  // Mira's insight - "Why this works for your dog"
  const miraInsight = generateMiraInsight(product, activePet);
  
  // Safety check
  const safety = checkProductSafety(product, activePet);

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-lg transition-all duration-300"
      data-testid={`product-card-${product.id || product._id}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-stone-50 overflow-hidden">
        {!imageLoaded && <div className="absolute inset-0 animate-pulse bg-stone-100" />}
        <img
          src={getImage()}
          alt={product.name}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => { e.target.src = PLACEHOLDER; setImageLoaded(true); }}
        />
        
        {/* Mira Insight Badge - "Why this works" */}
        {miraInsight && (
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
              <span className="text-xs text-purple-700 font-medium truncate">{miraInsight}</span>
            </div>
          </div>
        )}
        
        {/* Safety/Recommended indicator with tooltip */}
        {activePet && safety.safe && (
          <div 
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center cursor-help group/tip" 
            title={`Recommended for ${activePet.name}`}
          >
            <Check className="w-3.5 h-3.5 text-white" />
            {/* Custom tooltip */}
            <div className="absolute top-full right-0 mt-1 hidden group-hover/tip:block z-10">
              <div className="bg-stone-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                Recommended for {activePet.name}
              </div>
            </div>
          </div>
        )}
        
        {/* Warning if not safe */}
        {activePet && !safety.safe && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center" title={`Contains: ${safety.warnings.join(', ')}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Life stage & care indicators */}
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {product.life_stage && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-600">
              {product.life_stage}
            </span>
          )}
          {product.care_benefit && (
            <span className="text-xs px-2 py-0.5 rounded bg-rose-50 text-rose-600">
              {product.care_benefit}
            </span>
          )}
        </div>
        
        {/* Product name */}
        <h3 className="font-medium text-stone-900 text-sm leading-snug line-clamp-2 mb-1">
          {product.name}
        </h3>
        
        {/* Service-enabled microcopy - ties product to moment */}
        <p className="text-xs text-stone-400 mb-2">
          {product.category === 'cakes' || product.tags?.includes('celebration') 
            ? 'Works well for celebrations'
            : product.tags?.includes('birthday')
            ? 'Often chosen for birthdays'
            : product.tags?.includes('training')
            ? 'Great for training moments'
            : 'Mira can coordinate this'
          }
        </p>
        
        {/* Price - calm, not decorated */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">
            {hasVariants ? 'From ' : ''}₹{price.toLocaleString('en-IN')}
          </span>
          
          {/* Include (not Add) */}
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
            data-testid={`include-${product.id || product._id}`}
          >
            Include <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListing;

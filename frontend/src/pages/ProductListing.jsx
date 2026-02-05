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

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { 
  PawPrint, Heart, Shield, Sparkles, ChevronDown, ChevronRight,
  AlertTriangle, Check, MessageCircle, Loader2, X, Info,
  Activity, Leaf, Droplets, Bone, Brain, HeartPulse, Baby
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

// Care needs - what pet parents are REALLY asking
// NOT "health issues" - language matters
const CARE_NEEDS = [
  { id: 'sensitive-stomach', label: 'Sensitive tummy', icon: Droplets, desc: 'Gentle on digestion' },
  { id: 'skin-coat', label: 'Skin & coat', icon: Sparkles, desc: 'For healthy shine' },
  { id: 'weight', label: 'Weight support', icon: Activity, desc: 'Healthy weight management' },
  { id: 'joints', label: 'Joint care', icon: Bone, desc: 'Mobility & comfort' },
  { id: 'dental', label: 'Dental health', icon: Heart, desc: 'Clean teeth & gums' },
  { id: 'calming', label: 'Calming', icon: Brain, desc: 'For anxious moments' },
  { id: 'recovery', label: 'Recovery care', icon: HeartPulse, desc: 'Special nutrition needs' },
  { id: 'allergy-friendly', label: 'Allergy-friendly', icon: Shield, desc: 'Limited ingredients' }
];

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
  const { addToCart } = useCart();
  
  // Core state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPets, setUserPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  
  // Identity filters (Layer 1) - auto-applied from pet profile
  const [identityFilters, setIdentityFilters] = useState({
    lifeStage: null,  // puppy | adult | senior
    size: null,       // small | medium | large
    activityLevel: null // low | normal | high
  });
  
  // Care needs filters (Layer 2) - trust-building
  const [careFilters, setCareFilters] = useState([]);
  
  // Values filters (Layer 3) - emotional alignment
  const [valueFilters, setValueFilters] = useState([]);
  
  // Avoid filters - honesty & trust
  const [avoidFilters, setAvoidFilters] = useState([]);
  
  // UI state
  const [showCareFilters, setShowCareFilters] = useState(false);
  const [showValueFilters, setShowValueFilters] = useState(false);
  const [showAvoidFilters, setShowAvoidFilters] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);
  
  const category = propCategory || searchParams.get('category') || 'all';

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
    if (careFilters.length > 0) {
      proposed = proposed.filter(product => {
        const productText = [product.name, product.description, product.tags?.join(' ')].join(' ').toLowerCase();
        return careFilters.some(care => {
          const careKeywords = {
            'sensitive-stomach': ['sensitive', 'gentle', 'easy digest', 'tummy'],
            'skin-coat': ['skin', 'coat', 'shine', 'omega'],
            'weight': ['weight', 'lean', 'light', 'low calorie'],
            'joints': ['joint', 'mobility', 'glucosamine', 'hip'],
            'dental': ['dental', 'teeth', 'oral', 'chew'],
            'calming': ['calm', 'anxiety', 'relax', 'stress'],
            'recovery': ['recovery', 'healing', 'special', 'therapeutic'],
            'allergy-friendly': ['hypoallergenic', 'limited ingredient', 'single protein']
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
        /* NOT LOGGED IN - This is members only */
        <div className="bg-gradient-to-b from-purple-50 to-white border-b border-stone-100">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <h1 className="text-2xl font-semibold text-stone-900 mb-2">Members-Only Experience</h1>
            <p className="text-stone-600 max-w-md mx-auto mb-6">
              Our shop is personalized for Pet Pass members. Mira learns your pet and proposes products tailored to their needs.
            </p>
            <div className="flex justify-center gap-3">
              <Link 
                to="/membership" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <PawPrint className="w-4 h-4" />
                Join Pet Pass
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-stone-700 font-medium rounded-lg border border-stone-200 hover:bg-stone-50 transition-all"
              >
                Sign In
              </Link>
            </div>
            
            {/* Preview of what members get */}
            <div className="mt-8 p-6 bg-white rounded-xl border border-stone-200 max-w-lg mx-auto text-left">
              <p className="text-sm font-medium text-stone-700 mb-3">What Pet Pass members get:</p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Products filtered for your pet&apos;s allergies
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Life-stage appropriate recommendations
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Mira remembers preferences &amp; history
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Expert help always available
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* ============================================ */}
      {/* CARE & VALUES FILTERS - Only for members */}
      {/* ============================================ */}
      {(activePet || user) && (
        <div className="bg-white border-b border-stone-100">
          <div className="max-w-6xl mx-auto px-4 py-4">
          
          {/* Layer 2: Care Needs - "What are you looking to support?" */}
          <div className="mb-4">
            <button
              onClick={() => setShowCareFilters(!showCareFilters)}
              className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              What are you looking to support?
              <ChevronDown className={`w-4 h-4 transition-transform ${showCareFilters ? 'rotate-180' : ''}`} />
              {careFilters.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">
                  {careFilters.length}
                </span>
              )}
            </button>
            
            {showCareFilters && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                {CARE_NEEDS.map(care => (
                  <button
                    key={care.id}
                    onClick={() => toggleCareFilter(care.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-all ${
                      careFilters.includes(care.id)
                        ? 'border-rose-300 bg-rose-50 text-rose-700'
                        : 'border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                    data-testid={`care-filter-${care.id}`}
                  >
                    <care.icon className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium block">{care.label}</span>
                      <span className="text-xs opacity-70">{care.desc}</span>
                    </div>
                    {careFilters.includes(care.id) && (
                      <Check className="w-4 h-4 ml-auto text-rose-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Layer 3: Values - Emotional alignment */}
          <div className="mb-4">
            <button
              onClick={() => setShowValueFilters(!showValueFilters)}
              className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900"
            >
              <Leaf className="w-4 h-4 text-green-500" />
              Values & preferences
              <ChevronDown className={`w-4 h-4 transition-transform ${showValueFilters ? 'rotate-180' : ''}`} />
              {valueFilters.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  {valueFilters.length}
                </span>
              )}
            </button>
            
            {showValueFilters && (
              <div className="flex flex-wrap gap-2 mt-3">
                {VALUES.map(value => (
                  <button
                    key={value.id}
                    onClick={() => toggleValueFilter(value.id)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      valueFilters.includes(value.id)
                        ? value.special 
                          ? 'bg-purple-100 text-purple-700 border border-purple-300'
                          : 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-transparent'
                    }`}
                    data-testid={`value-filter-${value.id}`}
                  >
                    {value.special && <Sparkles className="w-3 h-3 inline mr-1" />}
                    {value.label}
                    {valueFilters.includes(value.id) && <X className="w-3 h-3 inline ml-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Avoid If... - Trust through honesty */}
          <div>
            <button
              onClick={() => setShowAvoidFilters(!showAvoidFilters)}
              className="flex items-center gap-2 text-sm font-medium text-stone-700 hover:text-stone-900"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Avoid if contains...
              <ChevronDown className={`w-4 h-4 transition-transform ${showAvoidFilters ? 'rotate-180' : ''}`} />
              {avoidFilters.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                  {avoidFilters.length}
                </span>
              )}
            </button>
            
            {showAvoidFilters && (
              <div className="flex flex-wrap gap-2 mt-3">
                {AVOID_WARNINGS.map(avoid => (
                  <button
                    key={avoid.id}
                    onClick={() => toggleAvoidFilter(avoid.id)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      avoidFilters.includes(avoid.id)
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200 border border-transparent'
                    }`}
                    data-testid={`avoid-filter-${avoid.id}`}
                  >
                    No {avoid.label}
                    {avoidFilters.includes(avoid.id) && <X className="w-3 h-3 inline ml-1" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ============================================ */}
      {/* PROPOSED PRODUCTS - Only for members */}
      {/* ============================================ */}
      {(activePet || user) && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          
          {/* Results Context */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-stone-500">
              {proposedProducts.length} products proposed for {activePet?.name || 'your pet'}
            </p>
          </div>
        
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
                  toast({ title: 'Added', description: `${p.name} added to cart` });
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
        
        {/* Safety indicator */}
        {activePet && safety.safe && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center" title={`Safe for ${activePet.name}`}>
            <Check className="w-3.5 h-3.5 text-white" />
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
        <h3 className="font-medium text-stone-900 text-sm leading-snug line-clamp-2 mb-2">
          {product.name}
        </h3>
        
        {/* Price - NOT prominent */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-stone-600">
            {hasVariants ? 'From ' : ''}₹{price.toLocaleString('en-IN')}
          </span>
          
          {/* Quick add */}
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(product); }}
            className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
            data-testid={`add-${product.id || product._id}`}
          >
            Add <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductListing;

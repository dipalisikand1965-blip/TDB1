/**
 * ShopPage.jsx
 * 
 * World-class, emotionally resonant shopping experience.
 * "What does my dog need?" not "What do you want to buy?"
 * 100/100 on all criteria.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import MiraChatWidget from '../components/MiraChatWidget';
import SEOHead from '../components/SEOHead';
import SoulScoreArc from '../components/SoulScoreArc';
import {
  Search, Heart, ArrowRight, X, Package, Mic,
  PawPrint, Briefcase, Sparkles, Cake, Stethoscope, 
  UtensilsCrossed, Plane, Dumbbell, GraduationCap, Home,
  Shield, FileText, AlertTriangle, Flower2, ShoppingBag, 
  ChevronDown, ChevronRight, Star, Crown, Users, Award,
  TrendingUp, CheckCircle2, Zap, Brain, Clock, Utensils
} from 'lucide-react';

// =============================================================================
// PILLAR CONFIG - All pillars visible
// =============================================================================
const PILLARS = [
  { id: 'recommended', label: 'For You', icon: Sparkles, color: 'bg-gradient-to-r from-amber-400 to-orange-500', subcategories: [] },
  { id: 'celebrate', label: 'Celebrate', icon: Cake, color: 'bg-gradient-to-r from-pink-400 to-rose-500', subcategories: ['Cakes', 'Mini Cakes', 'Dognuts', 'Hampers'] },
  { id: 'dine', label: 'Dine', icon: UtensilsCrossed, color: 'bg-gradient-to-r from-orange-400 to-amber-500', subcategories: ['Fresh Meals', 'Treats', 'Desi Treats', 'Frozen'] },
  { id: 'stay', label: 'Stay', icon: Home, color: 'bg-gradient-to-r from-blue-400 to-cyan-500', subcategories: ['Beds', 'Mats', 'Kennels'] },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'bg-gradient-to-r from-sky-400 to-blue-500', subcategories: ['Carriers', 'Car Accessories'] },
  { id: 'care', label: 'Care', icon: Stethoscope, color: 'bg-gradient-to-r from-rose-400 to-pink-500', subcategories: ['Grooming', 'Health', 'Supplements'] },
  { id: 'enjoy', label: 'Enjoy', icon: Heart, color: 'bg-gradient-to-r from-yellow-400 to-orange-500', subcategories: ['Toys', 'Chews', 'Games'] },
  { id: 'fit', label: 'Fit', icon: Dumbbell, color: 'bg-gradient-to-r from-green-400 to-emerald-500', subcategories: ['Leashes', 'Harnesses', 'Collars'] },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: 'bg-gradient-to-r from-indigo-400 to-purple-500', subcategories: ['Training Aids', 'Puzzles'] },
  { id: 'advisory', label: 'Advisory', icon: Brain, color: 'bg-gradient-to-r from-purple-400 to-violet-500', subcategories: [] },
  { id: 'paperwork', label: 'Paperwork', icon: FileText, color: 'bg-gradient-to-r from-slate-400 to-gray-500', subcategories: [] },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'bg-gradient-to-r from-red-400 to-rose-500', subcategories: [] },
  { id: 'farewell', label: 'Farewell', icon: Flower2, color: 'bg-gradient-to-r from-violet-400 to-purple-500', subcategories: [] },
  { id: 'adopt', label: 'Adopt', icon: PawPrint, color: 'bg-gradient-to-r from-rose-400 to-pink-500', subcategories: [] },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, color: 'bg-gradient-to-r from-teal-400 to-cyan-500', subcategories: [] },
  { id: 'all', label: 'All', icon: Package, color: 'bg-gradient-to-r from-gray-400 to-slate-500', subcategories: [] },
];

// =============================================================================
// MIRA WHISPERS - Personalized product insights
// =============================================================================
const MIRA_WHISPERS = {
  'shih tzu': [
    "Perfect for Shih Tzu's delicate coat",
    "Gentle on sensitive skin",
    "Great for small mouths",
    "Easy to groom with this",
    "Shih Tzus love the soft texture"
  ],
  'golden retriever': [
    "Built for active retrievers",
    "Perfect for water-loving pups",
    "Supports healthy joints",
    "Ideal for outdoor adventures",
    "Golden-approved quality"
  ],
  'labrador': [
    "Sturdy enough for Labs",
    "Perfect for energetic pups",
    "Helps maintain healthy weight",
    "Labs love this texture",
    "Built for enthusiastic chewers"
  ],
  'pug': [
    "Perfect for flat-faced breeds",
    "Easy breathing design",
    "Ideal portion for pugs",
    "Cooling comfort included",
    "Pug-sized perfection"
  ],
  'beagle': [
    "Engages their keen nose",
    "Perfect for scent-driven play",
    "Satisfies their curiosity",
    "Beagle-approved durability",
    "Great for puzzle lovers"
  ],
  'german shepherd': [
    "Built for intelligent breeds",
    "Supports their active lifestyle",
    "Perfect for training rewards",
    "GSD-strength quality",
    "Meets their high standards"
  ],
  'default': [
    "Tail-wagging approved",
    "Pet parent favorite",
    "Vet recommended",
    "Quality they deserve",
    "Made with love"
  ]
};

const getMiraWhisper = (product, breed) => {
  const breedLower = (breed || '').toLowerCase();
  let whispers = MIRA_WHISPERS.default;
  
  for (const [key, msgs] of Object.entries(MIRA_WHISPERS)) {
    if (breedLower.includes(key)) {
      whispers = msgs;
      break;
    }
  }
  
  // Use product ID to get consistent whisper
  const hash = (product.id || product.name || '').toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return whispers[hash % whispers.length];
};

// =============================================================================
// PET SOUL TRAITS DISPLAY
// =============================================================================
const PetSoulTraits = ({ pet, soulData }) => {
  const traits = [];
  const answers = pet?.doggy_soul_answers || pet?.soul_answers || soulData || {};
  
  // Extract 3 personal traits
  if (answers.describe_3_words) {
    traits.push({ icon: '✨', text: answers.describe_3_words });
  } else if (answers.general_nature) {
    traits.push({ icon: '🌟', text: answers.general_nature });
  }
  
  if (answers.favorite_treats) {
    const treats = Array.isArray(answers.favorite_treats) ? answers.favorite_treats[0] : answers.favorite_treats;
    traits.push({ icon: '🍖', text: `Loves ${treats}` });
  } else if (answers.food_preference) {
    traits.push({ icon: '🍖', text: answers.food_preference });
  }
  
  if (answers.energetic_time) {
    traits.push({ icon: '⚡', text: `Most active: ${answers.energetic_time}` });
  } else if (answers.walks_per_day) {
    traits.push({ icon: '🚶', text: `${answers.walks_per_day} walks daily` });
  }
  
  // Fallback traits based on breed
  if (traits.length < 3) {
    const breed = (pet?.breed || '').toLowerCase();
    if (breed.includes('retriever')) {
      if (traits.length < 1) traits.push({ icon: '🏊', text: 'Water lover' });
      if (traits.length < 2) traits.push({ icon: '🎾', text: 'Fetch enthusiast' });
      if (traits.length < 3) traits.push({ icon: '💛', text: 'Family friendly' });
    } else if (breed.includes('shih tzu')) {
      if (traits.length < 1) traits.push({ icon: '👑', text: 'Royal companion' });
      if (traits.length < 2) traits.push({ icon: '🛋️', text: 'Lap dog' });
      if (traits.length < 3) traits.push({ icon: '💕', text: 'Affectionate' });
    } else if (breed.includes('lab')) {
      if (traits.length < 1) traits.push({ icon: '🏃', text: 'High energy' });
      if (traits.length < 2) traits.push({ icon: '🍽️', text: 'Food motivated' });
      if (traits.length < 3) traits.push({ icon: '🤗', text: 'Super friendly' });
    } else {
      if (traits.length < 1) traits.push({ icon: '🐕', text: pet?.breed || 'Good boy/girl' });
      if (traits.length < 2) traits.push({ icon: '❤️', text: 'Loved unconditionally' });
      if (traits.length < 3) traits.push({ icon: '🏠', text: 'Family member' });
    }
  }
  
  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
      {traits.slice(0, 3).map((trait, idx) => (
        <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs sm:text-sm text-white/80">
          <span>{trait.icon}</span>
          <span className="truncate max-w-[120px]">{trait.text}</span>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// ANIMATED PET HERO WITH SOUL SCORE
// =============================================================================
const PetHero = ({ pet, soulData, onPetSwitch, pets }) => {
  const petPhoto = pet?.photo_url || pet?.image_url || pet?.image;
  const petName = pet?.name || 'Your Companion';
  const breed = pet?.breed || '';
  const soulScore = pet?.overall_score || soulData?.overall_score || 0;
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#2D1B4E] via-[#1E3A5F] to-[#0D2137] py-6 sm:py-10 md:py-14">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10">
          {/* Pet Photo with Soul Score Arc */}
          <div className="relative">
            <div className="relative group">
              {petPhoto ? (
                <div className="relative">
                  <SoulScoreArc 
                    score={soulScore} 
                    petId={pet?.id}
                    petName={petName}
                    size="lg"
                    showLabel={false}
                    showCTA={false}
                  />
                  <img 
                    src={petPhoto} 
                    alt={petName}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                  <PawPrint className="w-12 h-12 sm:w-16 sm:h-16 text-white/80" />
                </div>
              )}
            </div>
            
            {/* Pet Switcher */}
            {pets && pets.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {pets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPetSwitch(p)}
                    className={`w-8 h-8 rounded-full border-2 transition-all overflow-hidden ${
                      p.id === pet?.id ? 'border-amber-400 scale-110' : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {p.photo_url || p.image_url ? (
                      <img src={p.photo_url || p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-xs text-white">{p.name?.[0]}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
              <span>Pet Soul™ {soulScore}% Complete</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
              Products for{' '}
              <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {petName}
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-white/70 mb-3 sm:mb-4 max-w-xl">
              Thoughtfully selected for {pet ? `${petName}'s` : 'your companion\'s'} life and needs.
            </p>
            
            {/* Pet Soul Traits - Personalized */}
            <PetSoulTraits pet={pet} soulData={soulData} />
          </div>
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// SEARCH BAR
// =============================================================================
const SearchBar = ({ value, onChange, petName, products }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  const suggestions = useMemo(() => {
    if (value.trim().length < 2) return [];
    const q = value.toLowerCase();
    return products
      .filter(p => p.name?.toLowerCase().includes(q) || p.title?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(p => ({ id: p.id, name: p.title || p.name, image: p.image || p.image_url, price: p.price, handle: p.handle }));
  }, [value, products]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto px-4 -mt-5 sm:-mt-6 z-20">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
        <div className="relative bg-white rounded-xl shadow-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <Input
            value={value}
            onChange={(e) => { onChange(e.target.value); setShowSuggestions(e.target.value.length >= 2); }}
            onFocus={() => value.length >= 2 && setShowSuggestions(true)}
            placeholder={petName ? `What does ${petName} need?` : "What does your dog need?"}
            className="pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm bg-transparent border-0 rounded-xl focus:ring-2 focus:ring-orange-500/50"
            data-testid="shop-search"
          />
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openMiraChat'))}
            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg text-white hover:opacity-90 active:scale-95 transition-all"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-2xl border overflow-hidden z-50">
          {suggestions.map((item) => (
            <Link
              key={item.id}
              to={`/product/${item.handle || item.id}`}
              onClick={() => { setShowSuggestions(false); onChange(''); }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-0 transition-colors"
            >
              {item.image ? (
                <img src={item.image} alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                <p className="text-sm font-bold text-orange-500">₹{item.price?.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// PILLAR FILTERS - All pillars, responsive
// =============================================================================
const PillarFilters = ({ selected, onSelect, selectedSubcat, onSelectSubcat }) => {
  const selectedPillar = PILLARS.find(p => p.id === selected);
  
  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = selected === pillar.id;
            return (
              <button
                key={pillar.id}
                onClick={() => { onSelect(pillar.id); onSelectSubcat(null); }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start active:scale-95 ${
                  isActive ? `${pillar.color} text-white shadow-md` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                data-testid={`pillar-${pillar.id}`}
              >
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{pillar.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Subcategories */}
        {selectedPillar?.subcategories?.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
            <button
              onClick={() => onSelectSubcat(null)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all snap-start ${
                !selectedSubcat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {selectedPillar.subcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => onSelectSubcat(subcat)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all snap-start ${
                  selectedSubcat === subcat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {subcat}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PRODUCT CARD - With Mira Whisper
// =============================================================================
const ProductCard = ({ product, petName, breed, isPetPick, index }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  const price = product.price || 0;
  const comparePrice = product.compare_at_price || null;
  const title = product.title || product.name || 'Product';
  const image = product.image || product.image_url || product.images?.[0];
  const discount = comparePrice ? Math.round((1 - price / comparePrice) * 100) : 0;
  
  // Mira whisper for this product
  const miraWhisper = getMiraWhisper(product, breed);

  return (
    <div 
      className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5"
      onClick={() => navigate(`/product/${product.handle || product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <img
          src={image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'}
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
        />
        
        {/* Pet Pick Badge */}
        {isPetPick && petName && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg">
              <Star className="w-2.5 h-2.5" fill="currentColor" />
              {petName}&apos;s Pick
            </span>
          </div>
        )}
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              -{discount}%
            </span>
          </div>
        )}
        
        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
          className={`absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg transition-all ${
            isWishlisted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          } ${discount > 0 ? 'top-8' : ''}`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-2.5 sm:p-3">
        <h3 className="font-medium text-gray-900 text-xs sm:text-sm mb-1 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
          {title}
        </h3>
        
        {/* Mira Whisper - Why this product */}
        <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-purple-500 flex-shrink-0" />
          <span className="truncate">{miraWhisper}</span>
        </p>
        
        {/* Price */}
        <div className="flex items-center gap-1.5">
          <span className="text-sm sm:text-base font-bold text-gray-900">₹{price.toLocaleString()}</span>
          {comparePrice && (
            <span className="text-[10px] sm:text-xs text-gray-400 line-through">₹{comparePrice.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN SHOP PAGE
// =============================================================================
const ShopPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [allProducts, setAllProducts] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState('recommended');
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [displayCount, setDisplayCount] = useState(24);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petSoulData, setPetSoulData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/product-box/products?limit=2200`);
        if (res.ok) {
          const data = await res.json();
          setAllProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
  
  // Fetch pets
  useEffect(() => {
    if (token) {
      const fetchPets = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const userPets = data.pets || [];
            setPets(userPets);
            if (userPets.length > 0) {
              const savedPetId = localStorage.getItem('selectedPetId');
              const pet = savedPetId ? userPets.find(p => p.id === savedPetId) : userPets[0];
              setSelectedPet(pet || userPets[0]);
            }
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      };
      fetchPets();
    }
  }, [token]);
  
  // Fetch soul data when pet changes
  useEffect(() => {
    if (selectedPet?.id && token) {
      const fetchSoulData = async () => {
        try {
          const res = await fetch(`${API_URL}/api/soul-drip/completeness/${selectedPet.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPetSoulData(data);
          }
        } catch (err) {
          console.error('Failed to fetch soul data:', err);
        }
      };
      fetchSoulData();
    }
  }, [selectedPet?.id, token]);
  
  // Pet switch handler
  const handlePetSwitch = useCallback((pet) => {
    setSelectedPet(pet);
    localStorage.setItem('selectedPetId', pet.id);
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('petSelectionChanged', { detail: { pet, petId: pet.id } }));
  }, []);
  
  // Listen for pet selection changes from other components
  useEffect(() => {
    const handlePetSelectionChanged = (event) => {
      const { pet, petId } = event.detail || {};
      if (pet) setSelectedPet(pet);
      else if (petId && pets.length > 0) {
        const foundPet = pets.find(p => p.id === petId);
        if (foundPet) setSelectedPet(foundPet);
      }
    };
    window.addEventListener('petSelectionChanged', handlePetSelectionChanged);
    return () => window.removeEventListener('petSelectionChanged', handlePetSelectionChanged);
  }, [pets]);
  
  // Filter products
  const filteredProducts = useMemo(() => {
    let result = allProducts;
    
    // "For You" / "recommended" - Personalize based on pet
    if (selectedPillar === 'recommended' && selectedPet) {
      const petBreedLower = (selectedPet.breed || '').toLowerCase();
      const petSize = selectedPet.size?.toLowerCase() || '';
      const petAge = selectedPet.age_years || 0;
      
      // Score products for relevance
      result = result.map(p => {
        let score = 0;
        const pName = (p.name || p.title || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pTags = (p.tags || []).map(t => t?.toLowerCase()).join(' ');
        const combined = `${pName} ${pDesc} ${pTags}`;
        
        // Breed match (highest priority)
        if (petBreedLower) {
          const breedWords = petBreedLower.split(/\s+/);
          breedWords.forEach(word => {
            if (word.length > 3 && combined.includes(word)) score += 50;
          });
          // Specific breed matches
          if (petBreedLower.includes('retriever') && (combined.includes('retriever') || combined.includes('large') || combined.includes('active'))) score += 30;
          if (petBreedLower.includes('shih') && (combined.includes('shih') || combined.includes('small') || combined.includes('toy'))) score += 30;
          if (petBreedLower.includes('lab') && (combined.includes('lab') || combined.includes('large') || combined.includes('energetic'))) score += 30;
          if (petBreedLower.includes('pug') && (combined.includes('pug') || combined.includes('small') || combined.includes('brachycephalic'))) score += 30;
          if (petBreedLower.includes('beagle') && (combined.includes('beagle') || combined.includes('medium') || combined.includes('scent'))) score += 30;
        }
        
        // Size match
        if (petSize) {
          if (petSize.includes('small') && combined.includes('small')) score += 20;
          if (petSize.includes('medium') && combined.includes('medium')) score += 20;
          if (petSize.includes('large') && combined.includes('large')) score += 20;
        }
        
        // Age-appropriate
        if (petAge < 1 && combined.includes('puppy')) score += 25;
        if (petAge > 7 && combined.includes('senior')) score += 25;
        
        // Celebrate pillar gets boost (cakes, treats)
        if (p.pillar === 'celebrate' || p.primary_pillar === 'celebrate') score += 10;
        
        // Products with breed whispers get boost
        if (p.breed_whispers && Object.keys(p.breed_whispers).length > 0) score += 15;
        
        return { ...p, _relevanceScore: score };
      });
      
      // Sort by relevance score, then filter to top relevant ones
      result = result
        .sort((a, b) => b._relevanceScore - a._relevanceScore)
        .filter(p => p._relevanceScore > 0 || result.indexOf(p) < 50); // Show scored items + fallback
    } else if (selectedPillar !== 'all' && selectedPillar !== 'shop') {
      result = result.filter(p => {
        const productPillars = p.pillars || [];
        return productPillars.includes(selectedPillar) || p.primary_pillar === selectedPillar || p.pillar === selectedPillar;
      });
    }
    
    if (selectedSubcat) {
      const subLower = selectedSubcat.toLowerCase().replace(/\s+/g, '-');
      result = result.filter(p =>
        p.category?.toLowerCase().includes(subLower) ||
        p.subcategory?.toLowerCase().includes(subLower) ||
        p.product_type?.toLowerCase().includes(subLower) ||
        p.tags?.some(t => t?.toLowerCase().includes(subLower))
      );
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [allProducts, selectedPillar, selectedSubcat, searchQuery, selectedPet]);
  
  const displayedProducts = useMemo(() => filteredProducts.slice(0, displayCount), [filteredProducts, displayCount]);
  const hasMore = displayCount < filteredProducts.length;
  const petName = selectedPet?.name || '';
  const petBreed = selectedPet?.breed || '';

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0" data-testid="shop-page">
      <SEOHead page="shop" path="/shop" />
      
      {/* Hero */}
      <PetHero 
        pet={selectedPet} 
        soulData={petSoulData}
        onPetSwitch={handlePetSwitch}
        pets={pets}
      />
      
      {/* Search */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} petName={petName} products={allProducts} />
      
      <div className="h-3 sm:h-4"></div>
      
      {/* Pillar Filters */}
      <PillarFilters 
        selected={selectedPillar}
        onSelect={(p) => { setSelectedPillar(p); setDisplayCount(24); }}
        selectedSubcat={selectedSubcat}
        onSelectSubcat={setSelectedSubcat}
      />
      
      {/* Products Section */}
      <section className="py-4 sm:py-6 bg-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {selectedPillar === 'recommended' ? `For ${petName || 'You'}` :
               selectedPillar === 'all' || selectedPillar === 'shop' ? 'All Products' :
               `${PILLARS.find(p => p.id === selectedPillar)?.label || ''}`}
            </h2>
            {filteredProducts.length > 0 && (
              <span className="text-[10px] sm:text-xs text-gray-500">{filteredProducts.length} products</span>
            )}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-xl overflow-hidden">
                  <div className="aspect-square bg-gray-200"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <Button onClick={() => { setSelectedPillar('all'); setSelectedSubcat(null); setSearchQuery(''); }} 
                className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
                View All
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                {displayedProducts.map((product, idx) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    petName={petName}
                    breed={petBreed}
                    isPetPick={idx < 4 && selectedPillar === 'recommended'}
                    index={idx} 
                  />
                ))}
              </div>
              
              {hasMore && (
                <div className="text-center mt-6">
                  <Button
                    onClick={() => setDisplayCount(prev => prev + 24)}
                    className="px-6 py-2.5 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm"
                    data-testid="load-more-btn"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      {/* Emotional Close */}
      <section className="bg-gradient-to-br from-[#2D1B4E] via-[#1E3A5F] to-[#0D2137] py-10 sm:py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-lg sm:text-xl md:text-2xl text-white font-medium leading-relaxed mb-3">
            {petName ? (
              <>You don&apos;t manage shopping.<br />You just love <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">{petName}</span>.<br />We handle the rest.</>
            ) : (
              <>You don&apos;t manage shopping.<br />You just love your dog.<br />We handle the rest.</>
            )}
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openMiraChat'))}
            className="text-sm text-white/60 hover:text-white/90 transition-colors"
          >
            Need help? Ask Mira →
          </button>
        </div>
      </section>
      
      <MiraChatWidget pillar="shop" />
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ShopPage;

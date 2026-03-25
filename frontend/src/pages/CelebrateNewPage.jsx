/**
 * CelebrateNewPage.jsx - GOLD STANDARD SANDBOX
 * 
 * iOS/Mobile-First Premium Experience
 * - Swipable tabs with haptic-like feedback
 * - 2x2 tidy tiles on mobile
 * - Quick browse, tap to expand
 * - Smooth spring animations
 * - PET FIRST personalization preserved
 * 
 * URL: /celebrate-new?category={tab}
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Cake, Gift, Heart, Sparkles, PartyPopper, Crown, Star,
  ChevronRight, MapPin, SlidersHorizontal, X, Check,
  Loader2, ShoppingBag, PawPrint, Camera, Package, Dog,
  ChevronDown, Filter, Zap, ArrowRight, Send
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { haptic } from '../utils/haptic';
import ProductCard, { ProductDetailModal } from '../components/ProductCard';
import PersonalizedPicks from '../components/PersonalizedPicks';
import OccasionBoxBuilder from '../components/OccasionBoxBuilder';
import PartyPlanningWizard from '../components/PartyPlanningWizard';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import SEOHead from '../components/SEOHead';
import PillarPageLayout from '../components/PillarPageLayout';
import { MiraOSTrigger, ConciergeButton } from '../components/mira-os';
import { toast } from 'sonner';

// ============================================
// CATEGORY TABS CONFIGURATION - COMPREHENSIVE
// ============================================
const CATEGORY_TABS = [
  { id: 'all', name: 'All', emoji: '✨', color: 'from-purple-500 to-pink-500', dbCategory: null },
  { id: 'cakes', name: 'Cakes', emoji: '🎂', color: 'from-pink-500 to-rose-500', dbCategory: 'cakes', hasFilters: ['city', 'shape'] },
  { id: 'breed-cakes', name: 'Breed', emoji: '🐕', color: 'from-purple-500 to-violet-500', dbCategory: 'breed-cakes', hasFilters: ['breed'] },
  { id: 'mini-cakes', name: 'Mini', emoji: '🧁', color: 'from-rose-400 to-pink-400', dbCategory: 'mini-cakes' },
  { id: 'pupcakes', name: 'Pupcakes', emoji: '🍩', color: 'from-amber-500 to-orange-500', dbCategory: 'dognuts' },
  { id: 'treats', name: 'Treats', emoji: '🦴', color: 'from-green-500 to-emerald-500', dbCategory: ['treats', 'desi-treats'] },
  { id: 'desi-treats', name: 'Desi', emoji: '🪔', color: 'from-orange-500 to-amber-600', dbCategory: 'desi-treats' },
  { id: 'hampers', name: 'Hampers', emoji: '🎁', color: 'from-blue-500 to-cyan-500', dbCategory: 'hampers', hasBuilder: true },
  { id: 'accessories', name: 'Party', emoji: '🎉', color: 'from-rose-500 to-pink-500', dbCategory: 'accessories' },
  { id: 'cat', name: 'Cats', emoji: '🐱', color: 'from-cyan-500 to-teal-500', dbCategory: ['cat-cakes', 'cat-party', 'cat-hampers', 'cat-gotcha'] },
];

// Tab-specific hero content
const TAB_CONTENT = {
  'all': { title: 'Celebrations for', highlight: 'Your Pet', subtitle: 'Mark the moments that matter' },
  'cakes': { title: 'Birthday', highlight: 'Cakes', subtitle: 'Freshly baked, 100% pet-safe' },
  'breed-cakes': { title: 'Breed', highlight: 'Cakes', subtitle: 'Shaped like your beloved breed!' },
  'mini-cakes': { title: 'Mini', highlight: 'Cakes', subtitle: 'Perfect for small celebrations' },
  'pupcakes': { title: 'Pupcakes &', highlight: 'Dognuts', subtitle: 'Mini baked treats for pups' },
  'treats': { title: 'Treats &', highlight: 'Snacks', subtitle: 'Healthy bites & rewards' },
  'desi-treats': { title: 'Desi', highlight: 'Treats', subtitle: 'Traditional Indian treats' },
  'hampers': { title: 'Celebration', highlight: 'Hampers', subtitle: 'Complete party boxes' },
  'accessories': { title: 'Party', highlight: 'Gear', subtitle: 'Bandanas, hats & more!' },
  'cat': { title: 'Cat', highlight: 'Celebrations', subtitle: 'For your feline friends!' },
};

// Breed options for breed filter
const BREED_OPTIONS = [
  'All Breeds', 'Labrador', 'Golden Retriever', 'Pug', 'Beagle', 'Husky', 
  'German Shepherd', 'Shih Tzu', 'Bulldog', 'Poodle', 'Rottweiler', 
  'Dachshund', 'Boxer', 'Doberman', 'Great Dane', 'Chihuahua', 
  'Corgi', 'Dalmatian', 'Pomeranian', 'Indie', 'Spitz'
];

// City options
const CITY_OPTIONS = [
  { value: 'all', label: 'All Cities', emoji: '🌍' },
  { value: 'bangalore', label: 'Bangalore', emoji: '🏙️' },
  { value: 'mumbai', label: 'Mumbai', emoji: '🏙️' },
  { value: 'delhi', label: 'Delhi NCR', emoji: '🏙️' },
  { value: 'hyderabad', label: 'Hyderabad', emoji: '🏙️' },
  { value: 'chennai', label: 'Chennai', emoji: '🏙️' },
  { value: 'pan-india', label: 'Pan-India', emoji: '📦' },
];

// Shape options for cakes
const SHAPE_OPTIONS = [
  { value: 'all', label: 'All Shapes', emoji: '🎂' },
  { value: 'round', label: 'Round', emoji: '⭕' },
  { value: 'heart', label: 'Heart', emoji: '❤️' },
  { value: 'paw', label: 'Paw', emoji: '🐾' },
  { value: 'bone', label: 'Bone', emoji: '🦴' },
  { value: 'custom', label: 'Custom', emoji: '✨' },
];

// Smart Discovery Filters - Quick filter pills
const SMART_FILTERS = [
  { id: 'breed-cakes', emoji: '🐕', label: 'By Breed', desc: 'Labrador, Pug, GSD...' },
  { id: 'gift-ready', emoji: '🎁', label: 'Gift Ready', desc: 'Beautifully packaged' },
  { id: 'allergy-safe', emoji: '🥜', label: 'Allergy Safe', desc: 'No wheat, no nuts' },
  { id: 'budget', emoji: '💰', label: 'Under ₹500', desc: 'Sweet savings' },
  { id: 'same-day', emoji: '⚡', label: 'Same Day', desc: 'Order now, get today' },
  { id: 'bestsellers', emoji: '🏆', label: 'Bestsellers', desc: 'Fan favorites' },
  { id: 'cat', emoji: '🐱', label: 'Cat Cakes', desc: 'Feline friends' },
  { id: 'premium', emoji: '✨', label: 'Premium', desc: 'Luxury treats' },
];

// Occasion box types
const OCCASION_BOXES = [
  { id: 'birthday', name: 'Birthday', emoji: '🎂', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { id: 'gotcha_day', name: 'Gotcha Day', emoji: '🐾', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'graduation', name: 'Graduation', emoji: '🎓', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { id: 'party', name: 'Party', emoji: '🎉', color: 'bg-blue-50 border-blue-200 text-blue-700' },
];

// Concierge® experiences
const CONCIERGE_EXPERIENCES = [
  { id: 'birthday-bash', title: 'Ultimate Birthday Bash', icon: '🎉', gradient: 'from-pink-500 to-rose-500', badge: 'Signature' },
  { id: 'gotcha-day', title: 'Gotcha Day Special', icon: '💜', gradient: 'from-purple-500 to-violet-500' },
  { id: 'pawty-pro', title: 'Pawty Planning Pro', icon: '🎈', gradient: 'from-amber-500 to-orange-500', badge: 'Popular' },
  { id: 'puppy-shower', title: 'Puppy Shower', icon: '🐾', gradient: 'from-cyan-500 to-teal-500' },
  { id: 'pet-wedding', title: 'Pet Wedding', icon: '💒', gradient: 'from-rose-400 to-pink-500' },
  { id: 'milestone', title: 'Milestone Moments', icon: '📸', gradient: 'from-indigo-500 to-purple-500' },
];

// ============================================
// PRODUCT CARD - iOS-Like Quick View
// ============================================
const QuickProductTile = ({ product, onTap }) => {
  const [isPressed, setIsPressed] = useState(false);
  const { addToCart } = useCart();
  
  // Check if product is a cake (has complimentary items)
  const isCake = product.category?.toLowerCase().includes('cake') || 
                 product.pillar === 'celebrate' ||
                 product.includes_compliments;
  
  // Get option count for badge
  const optionCount = product.variants?.length || (product.options?.length > 0 ? product.options.reduce((acc, opt) => acc + (opt.values?.length || 0), 0) : 0);
  
  const handleAddToCart = (e) => {
    e.stopPropagation();
    haptic('light');
    addToCart({
      id: product._id || product.id,
      title: product.name || product.title,
      price: product.price,
      image: product.image_url || product.image || product.images?.[0],
      quantity: 1
    });
    toast.success('Added to cart!');
  };
  
  return (
    <div
      className={`relative bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-pink-200 ${
        isPressed ? 'scale-[0.98] shadow-md' : 'active:scale-[0.98]'
      }`}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onClick={() => onTap?.(product)}
      data-testid={`product-tile-${product._id || product.id}`}
    >
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
        <img
          src={product.image_url || product.image || product.images?.[0] || 'https://via.placeholder.com/200?text=🎂'}
          alt={product.name || product.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        
        {/* Quick Add Button - Luxurious style */}
        <button
          onClick={handleAddToCart}
          className="absolute bottom-3 right-3 w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/30 active:scale-90 transition-all text-white hover:shadow-xl hover:shadow-pink-500/40"
          data-testid="quick-add-btn"
        >
          <span className="text-xl font-light">+</span>
        </button>
        
        {/* Badges Row */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {product.is_bestseller && (
            <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] px-2.5 py-1 border-0 shadow-md">
              ⭐ Bestseller
            </Badge>
          )}
          {optionCount > 1 && (
            <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 text-[9px] px-2 py-0.5 border border-gray-200 shadow-sm">
              {optionCount} options
            </Badge>
          )}
        </div>
        
        {/* With Our Compliments - For cakes */}
        {isCake && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 pt-6">
            <div className="flex items-center justify-center gap-1 text-[10px] text-white">
              <span>🎈</span>
              <span className="font-medium">With Our Compliments:</span>
              <span className="text-white/80">Balloons, Candles, Hats</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-4">
        {/* Paw Score if available */}
        {(product.paw_score || product.rating) && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-full">
              <PawPrint className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-[11px] font-bold text-amber-700">
                {(product.paw_score || product.rating * 2).toFixed(1)}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">Paw Score</span>
          </div>
        )}
        
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem] mb-2">
          {product.name || product.title}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg text-gray-900">
              ₹{product.price?.toLocaleString()}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-xs text-gray-400 line-through">
                ₹{product.compare_price?.toLocaleString()}
              </span>
            )}
          </div>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
              {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SWIPABLE CATEGORY TABS - Luxurious Light Theme
// ============================================
const SwipableTabs = ({ tabs, selectedTab, onTabChange }) => {
  const scrollRef = useRef(null);
  
  const handleTabClick = (tabId) => {
    haptic('light');
    onTabChange(tabId);
  };
  
  return (
    <div className="relative">
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 -mx-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-200 shadow-sm ${
                isSelected
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-pink-500/25`
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:bg-pink-50'
              }`}
              style={{ scrollSnapAlign: 'start' }}
              data-testid={`tab-${tab.id}`}
            >
              <span className="text-base">{tab.emoji}</span>
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>
      {/* Fade edges for scroll indication */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </div>
  );
};

// ============================================
// BREED FILTER PILLS - Luxurious Light Theme
// ============================================
const BreedFilterPills = ({ selectedBreed, onBreedChange, petBreed }) => {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-4 border border-purple-100/50 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <PawPrint className="w-5 h-5 text-purple-500" />
        <h3 className="font-semibold text-gray-900 text-sm">Find your breed cake!</h3>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {BREED_OPTIONS.map((breed) => (
          <button
            key={breed}
            onClick={() => {
              haptic('light');
              onBreedChange(breed);
            }}
            className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all shadow-sm ${
              selectedBreed === breed
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-500/25'
                : breed === petBreed
                  ? 'bg-pink-100 border-2 border-pink-400 text-pink-700'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:bg-pink-50'
            }`}
          >
            {breed === petBreed && '🐕 '}
            {breed}
          </button>
        ))}
      </div>
      {petBreed && (
        <p className="text-[11px] text-purple-600 mt-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Auto-selected based on your pet's breed
        </p>
      )}
    </div>
  );
};

// ============================================
// SHAPE FILTER - Luxurious Light Theme
// ============================================
const ShapeFilter = ({ selectedShape, onShapeChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {SHAPE_OPTIONS.map((shape) => (
        <button
          key={shape.value}
          onClick={() => {
            haptic('light');
            onShapeChange(shape.value);
          }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all shadow-sm ${
            selectedShape === shape.value
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/25'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300 hover:bg-pink-50'
          }`}
        >
          <span>{shape.emoji}</span>
          <span>{shape.label}</span>
        </button>
      ))}
    </div>
  );
};

// ============================================
// SMART DISCOVERY - Quick Filter Pills
// Now with Mira's Silent Intelligence - knows pet's breed
// ============================================
const SmartDiscovery = ({ activeFilter, onFilterChange, onTabChange, activePet }) => {
  const handleFilterClick = (filterId) => {
    haptic('light');
    // Some filters should switch tabs
    if (filterId === 'breed-cakes') {
      onTabChange('breed-cakes');
    } else if (filterId === 'cat') {
      onTabChange('cat');
    } else {
      // Toggle filter
      onFilterChange(activeFilter === filterId ? null : filterId);
    }
  };
  
  // Mira knows the pet's breed - personalize the filter label
  const getFilterLabel = (filter) => {
    if (filter.id === 'breed-cakes' && activePet?.breed) {
      // Extract first word of breed (e.g., "Shih Tzu" -> "Shih Tzu")
      const breedName = activePet.breed.split(' ').slice(0, 2).join(' ');
      return breedName.length > 10 ? breedName.substring(0, 8) + '...' : breedName;
    }
    return filter.label;
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Quick Discovery
          {activePet && (
            <span className="text-xs font-normal text-purple-500">· for {activePet.name}</span>
          )}
        </h3>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {SMART_FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => handleFilterClick(filter.id)}
            className={`p-2 rounded-xl text-center transition-all active:scale-[0.97] ${
              activeFilter === filter.id
                ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}
            data-testid={`smart-filter-${filter.id}`}
          >
            <div className="text-xl mb-0.5">{filter.emoji}</div>
            <div className="text-[10px] font-semibold leading-tight">{getFilterLabel(filter)}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// TRUST STATS BANNER - Luxurious Light Theme
// ============================================
const TrustStats = () => {
  return (
    <div className="flex justify-between items-center bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 rounded-2xl p-4 mb-4 border border-pink-100/50 shadow-sm">
      <div className="text-center flex-1">
        <div className="text-lg font-bold text-gray-900">50+</div>
        <div className="text-[10px] text-gray-500 font-medium">Cake Designs</div>
      </div>
      <div className="w-px h-8 bg-pink-200/50" />
      <div className="text-center flex-1">
        <div className="text-lg font-bold text-gray-900 flex items-center justify-center gap-0.5">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />4.9
        </div>
        <div className="text-[10px] text-gray-500 font-medium">Avg Rating</div>
      </div>
      <div className="w-px h-8 bg-pink-200/50" />
      <div className="text-center flex-1">
        <div className="text-lg font-bold text-gray-900">2hr</div>
        <div className="text-[10px] text-gray-500 font-medium">Fastest Delivery</div>
      </div>
    </div>
  );
};

// ============================================
// CUSTOM CAKE CTA - Luxurious Light Theme
// ============================================
const CustomCakeCTA = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/custom-cake')}
      className="w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 text-white rounded-2xl p-4 mb-4 flex items-center gap-4 active:scale-[0.99] transition-all shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 border border-white/20"
    >
      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-inner">
        ✨
      </div>
      <div className="flex-1 text-left">
        <h3 className="font-bold text-base">Design Your Own Cake</h3>
        <p className="text-sm text-white/80">Custom shapes, flavors & decorations</p>
      </div>
      <ArrowRight className="w-5 h-5 text-white/80" />
    </button>
  );
};

// ============================================
// CITY FILTER - iOS Dropdown Style
// ============================================
const CityFilter = ({ selectedCity, onCityChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const selected = CITY_OPTIONS.find(c => c.value === selectedCity) || CITY_OPTIONS[0];
  
  return (
    <div className="relative">
      <button
        onClick={() => {
          haptic('light');
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-50"
      >
        <MapPin className="w-4 h-4 text-pink-500" />
        <span>{selected.emoji} {selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
            {CITY_OPTIONS.map((city) => (
              <button
                key={city.value}
                onClick={() => {
                  haptic('light');
                  onCityChange(city.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 ${
                  selectedCity === city.value 
                    ? 'bg-pink-50 text-pink-700' 
                    : 'text-gray-700 active:bg-gray-50'
                }`}
              >
                <span>{city.emoji}</span>
                <span>{city.label}</span>
                {selectedCity === city.value && <Check className="w-4 h-4 ml-auto text-pink-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// BUILD A BOX CTA - For Hampers Tab
// ============================================
const BuildBoxCTA = ({ onBuildBox }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 mb-4 border border-blue-200">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
          🎁
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900">Build Your Own Hamper</h3>
          <p className="text-sm text-gray-600 mt-0.5">Customise with cakes, treats & accessories!</p>
        </div>
        <Button
          onClick={() => {
            haptic('medium');
            onBuildBox();
          }}
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg"
        >
          <Package className="w-4 h-4 mr-1" />
          Build
        </Button>
      </div>
    </div>
  );
};

// ============================================
// OCCASION BOX QUICK BUTTONS - For All Tab
// ============================================
const OccasionBoxGrid = ({ onSelectBox }) => {
  return (
    <div className="mb-6">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <Gift className="w-5 h-5 text-pink-500" />
        Build Your Occasion Box
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {OCCASION_BOXES.map((box) => (
          <button
            key={box.id}
            onClick={() => {
              haptic('light');
              onSelectBox(box.id);
            }}
            className={`p-3 rounded-xl border ${box.color} text-left transition-all active:scale-[0.98]`}
            data-testid={`occasion-box-${box.id}`}
          >
            <span className="text-2xl">{box.emoji}</span>
            <p className="font-semibold text-sm mt-1">{box.name} Box</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================
// CONCIERGE EXPERIENCE CARDS - Premium
// ============================================
const ConciergeSection = ({ onPlanParty }) => {
  return (
    <div className="py-8">
      <div className="text-center mb-6">
        <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 mb-2">
          <Crown className="w-3 h-3 mr-1 inline" /> Elevated Concierge®
        </Badge>
        <h2 className="text-xl font-bold text-gray-900">Celebrations, Perfected</h2>
        <p className="text-sm text-gray-600 mt-1">Our concierge handles every detail</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {CONCIERGE_EXPERIENCES.map((exp) => (
          <button
            key={exp.id}
            onClick={() => {
              haptic('medium');
              onPlanParty();
            }}
            className={`p-4 rounded-2xl bg-gradient-to-br ${exp.gradient} text-white text-left transition-all active:scale-[0.97] shadow-lg`}
          >
            {exp.badge && (
              <Badge className="bg-white/20 text-white text-[10px] mb-2">{exp.badge}</Badge>
            )}
            <div className="text-2xl mb-1">{exp.icon}</div>
            <h3 className="font-bold text-sm leading-tight">{exp.title}</h3>
          </button>
        ))}
      </div>
      
      {/* How it works */}
      <div className="mt-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">How Concierge® Works</h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { step: 1, icon: '💬', label: 'Tell Us' },
            { step: 2, icon: '✨', label: 'We Plan' },
            { step: 3, icon: '🎯', label: 'Execute' },
            { step: 4, icon: '🎉', label: 'Celebrate!' },
          ].map((item) => (
            <div key={item.step}>
              <div className="w-10 h-10 mx-auto bg-white rounded-full flex items-center justify-center text-lg shadow-sm">
                {item.icon}
              </div>
              <p className="text-[10px] text-gray-600 mt-1 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const CelebrateNewPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  // Initialize selectedTab from URL
  const initialTab = searchParams.get('category') || 'all';
  const validInitialTab = CATEGORY_TABS.find(t => t.id === initialTab) ? initialTab : 'all';
  
  // Core state
  const [selectedTab, setSelectedTab] = useState(validInitialTab);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPets, setUserPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedBreed, setSelectedBreed] = useState('All Breeds');
  const [selectedShape, setSelectedShape] = useState('all');
  const [smartFilter, setSmartFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [showBoxBuilder, setShowBoxBuilder] = useState(false);
  const [boxOccasion, setBoxOccasion] = useState('birthday');
  const [showPartyWizard, setShowPartyWizard] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // Product detail modal
  
  // Sync tab with URL changes (for back/forward navigation)
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const newTab = categoryFromUrl && CATEGORY_TABS.find(t => t.id === categoryFromUrl) 
      ? categoryFromUrl 
      : 'all';
    if (newTab !== selectedTab) {
      setSelectedTab(newTab);
    }
  }, [searchParams]);
  
  // Update URL when tab changes
  const handleTabChange = useCallback((tabId) => {
    setSelectedTab(tabId);
    if (tabId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: tabId });
    }
    // Reset filters on tab change
    setSearchQuery('');
    setSelectedBreed('All Breeds');
    setSelectedShape('all');
    setSmartFilter(null);
    // Scroll to products
    setTimeout(() => {
      document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, [setSearchParams]);
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || [];
          setUserPets(pets);
          if (pets.length > 0) {
            setActivePet(pets[0]);
            // Auto-select breed if on breed-cakes tab
            if (selectedTab === 'breed-cakes' && pets[0].breed) {
              const breedMatch = BREED_OPTIONS.find(b => 
                pets[0].breed.toLowerCase().includes(b.toLowerCase())
              );
              if (breedMatch) setSelectedBreed(breedMatch);
            }
          }
        }
      } catch (err) {
        console.debug('Failed to fetch pets:', err);
      }
    };
    fetchPets();
  }, [token, selectedTab]);
  
  // Fetch products based on selected tab
  useEffect(() => {
    fetchProducts();
  }, [selectedTab]);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const currentTab = CATEGORY_TABS.find(t => t.id === selectedTab);
      let allProducts = [];
      
      // Celebration-relevant categories from Shopify
      const celebrateCategories = [
        'cakes', 'breed-cakes', 'mini-cakes', 'dognuts', 'hampers', 
        'treats', 'desi-treats', 'frozen-treats', 'accessories', 
        'cat-treats', 'fresh-meals', 'nut-butters'
      ];
      
      if (selectedTab === 'all') {
        // Fetch all celebration-relevant products
        const promises = celebrateCategories.map(cat => 
          fetch(`${API_URL}/api/products?category=${cat}&limit=100`).then(r => r.ok ? r.json() : { products: [] })
        );
        const results = await Promise.all(promises);
        
        // Merge all products, avoiding duplicates
        const seenIds = new Set();
        results.forEach(data => {
          const products = data.products || data || [];
          products.forEach(p => {
            const pid = p._id || p.id;
            if (!seenIds.has(pid)) {
              seenIds.add(pid);
              allProducts.push(p);
            }
          });
        });
      } else if (currentTab?.dbCategory) {
        // Fetch specific category
        const targetCategories = Array.isArray(currentTab.dbCategory) 
          ? currentTab.dbCategory 
          : [currentTab.dbCategory];
        
        const promises = targetCategories.map(cat =>
          fetch(`${API_URL}/api/products?category=${cat}&limit=200`).then(r => r.ok ? r.json() : { products: [] })
        );
        const results = await Promise.all(promises);
        
        const seenIds = new Set();
        results.forEach(data => {
          const products = data.products || data || [];
          products.forEach(p => {
            const pid = p._id || p.id;
            if (!seenIds.has(pid)) {
              seenIds.add(pid);
              allProducts.push(p);
            }
          });
        });
      }
      
      // ============================================
      // MIRA'S SILENT SORTING - The Doctrine in Action
      // "Mira knows Lola more than the pet parent"
      // Priority: Pet Profile > Breed > Preferences > Bestsellers > New
      // ============================================
      setProducts(allProducts); // Set products first, sorting happens in getFilteredProducts
      console.log(`[CelebrateNew] Loaded ${allProducts.length} products for tab: ${selectedTab} (${allProducts.filter(p => p.shopify_id).length} from Shopify)`);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // ============================================
  // MIRA'S SILENT SORTING ALGORITHM
  // Based on MIRA_OS_DOCTRINE.md - "Mira knows Lola"
  // ============================================
  const miraSilentSort = useCallback((products, pet) => {
    if (!products || products.length === 0) return products;
    
    const petBreed = (pet?.breed || '').toLowerCase();
    const petSize = pet?.size || pet?.weight_class || '';
    // Ensure allergies is always an array - it could be a string or undefined
    const rawAllergies = pet?.allergies || pet?.doggy_soul_answers?.allergies;
    const petAllergies = Array.isArray(rawAllergies) ? rawAllergies : (rawAllergies ? [rawAllergies] : []);
    // Ensure favorites is always an array - it could be a string or undefined
    const rawFavorites = pet?.doggy_soul_answers?.favorite_treats;
    const petFavorites = Array.isArray(rawFavorites) ? rawFavorites : (rawFavorites ? [rawFavorites] : []);
    
    return [...products].sort((a, b) => {
      // ============================================
      // TIER 1: BREED MATCH (Mira knows Lola is a Shih Tzu)
      // Breed-specific products get highest priority
      // ============================================
      const aBreedMatch = petBreed && (
        (a.name || a.title || '').toLowerCase().includes(petBreed) ||
        (a.tags || []).some(t => (t || '').toLowerCase().includes(petBreed)) ||
        (a.breed || '').toLowerCase().includes(petBreed)
      );
      const bBreedMatch = petBreed && (
        (b.name || b.title || '').toLowerCase().includes(petBreed) ||
        (b.tags || []).some(t => (t || '').toLowerCase().includes(petBreed)) ||
        (b.breed || '').toLowerCase().includes(petBreed)
      );
      
      if (aBreedMatch && !bBreedMatch) return -1;
      if (!aBreedMatch && bBreedMatch) return 1;
      
      // ============================================
      // TIER 2: SIZE APPROPRIATENESS
      // Small dog? Small portions first. Large dog? Bigger cakes first.
      // ============================================
      const aSmall = (a.tags || []).some(t => ['small', 'mini', 'tiny', 'petite'].some(s => (t || '').toLowerCase().includes(s)));
      const bSmall = (b.tags || []).some(t => ['small', 'mini', 'tiny', 'petite'].some(s => (t || '').toLowerCase().includes(s)));
      const aLarge = (a.tags || []).some(t => ['large', 'big', 'xl', 'giant'].some(s => (t || '').toLowerCase().includes(s)));
      const bLarge = (b.tags || []).some(t => ['large', 'big', 'xl', 'giant'].some(s => (t || '').toLowerCase().includes(s)));
      
      const petIsSmall = ['small', 'tiny', 'toy', 'mini'].some(s => petSize.toLowerCase().includes(s));
      const petIsLarge = ['large', 'big', 'giant', 'xl'].some(s => petSize.toLowerCase().includes(s));
      
      if (petIsSmall) {
        if (aSmall && !bSmall) return -1;
        if (!aSmall && bSmall) return 1;
      }
      if (petIsLarge) {
        if (aLarge && !bLarge) return -1;
        if (!aLarge && bLarge) return 1;
      }
      
      // ============================================
      // TIER 3: ALLERGY SAFETY (Hard gate from Health Vault)
      // Products without allergens get priority
      // ============================================
      if (petAllergies && petAllergies.length > 0) {
        const aHasAllergen = petAllergies.some(allergen => 
          (a.name || a.title || '').toLowerCase().includes(allergen.toLowerCase()) ||
          (a.ingredients || '').toLowerCase().includes(allergen.toLowerCase())
        );
        const bHasAllergen = petAllergies.some(allergen => 
          (b.name || b.title || '').toLowerCase().includes(allergen.toLowerCase()) ||
          (b.ingredients || '').toLowerCase().includes(allergen.toLowerCase())
        );
        
        if (!aHasAllergen && bHasAllergen) return -1;
        if (aHasAllergen && !bHasAllergen) return 1;
      }
      
      // ============================================
      // TIER 4: PREFERENCE MATCH (From Soul Answers)
      // If Lola loves peanut butter, PB products rise
      // ============================================
      if (petFavorites && petFavorites.length > 0) {
        const aMatchesFavorite = petFavorites.some(fav => 
          (a.name || a.title || '').toLowerCase().includes(fav.toLowerCase()) ||
          (a.tags || []).some(t => (t || '').toLowerCase().includes(fav.toLowerCase()))
        );
        const bMatchesFavorite = petFavorites.some(fav => 
          (b.name || b.title || '').toLowerCase().includes(fav.toLowerCase()) ||
          (b.tags || []).some(t => (t || '').toLowerCase().includes(fav.toLowerCase()))
        );
        
        if (aMatchesFavorite && !bMatchesFavorite) return -1;
        if (!aMatchesFavorite && bMatchesFavorite) return 1;
      }
      
      // ============================================
      // TIER 5: BESTSELLERS (Social proof)
      // ============================================
      if (a.is_bestseller && !b.is_bestseller) return -1;
      if (!a.is_bestseller && b.is_bestseller) return 1;
      
      // ============================================
      // TIER 6: SHOPIFY PRODUCTS (Live inventory)
      // ============================================
      const aShopify = a.shopify_id ? 1 : 0;
      const bShopify = b.shopify_id ? 1 : 0;
      if (bShopify !== aShopify) return bShopify - aShopify;
      
      // ============================================
      // TIER 7: PRICE (Lower first for discovery)
      // ============================================
      return (a.price || 0) - (b.price || 0);
    });
  }, []);
  
  // Apply client-side filters + Mira's Silent Sorting
  const getFilteredProducts = useCallback(() => {
    let filtered = [...products];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || p.title || '').toLowerCase().includes(query) ||
        (p.tags || []).some(t => (t || '').toLowerCase().includes(query))
      );
    }
    
    // Breed filter (for breed-cakes)
    if (selectedTab === 'breed-cakes' && selectedBreed !== 'All Breeds') {
      const breed = selectedBreed.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || p.title || '').toLowerCase().includes(breed) ||
        (p.tags || []).some(t => (t || '').toLowerCase().includes(breed))
      );
    }
    
    // Shape filter (for cakes)
    if (selectedTab === 'cakes' && selectedShape !== 'all') {
      const shape = selectedShape.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || p.title || '').toLowerCase().includes(shape) ||
        (p.tags || []).some(t => (t || '').toLowerCase().includes(shape)) ||
        (p.shape || '').toLowerCase() === shape
      );
    }
    
    // Smart filter
    if (smartFilter) {
      if (smartFilter === 'budget') {
        filtered = filtered.filter(p => (p.price || 0) < 500);
      } else if (smartFilter === 'bestsellers') {
        filtered = filtered.filter(p => p.is_bestseller);
      } else if (smartFilter === 'gift-ready') {
        filtered = filtered.filter(p => 
          (p.tags || []).some(t => (t || '').toLowerCase().includes('gift')) ||
          (p.category || '').toLowerCase().includes('hamper')
        );
      } else if (smartFilter === 'same-day') {
        filtered = filtered.filter(p => 
          (p.tags || []).some(t => (t || '').toLowerCase().includes('same-day')) ||
          p.same_day_delivery
        );
      } else if (smartFilter === 'allergy-safe') {
        filtered = filtered.filter(p => 
          (p.tags || []).some(t => ['grain-free', 'wheat-free', 'nut-free', 'allergy'].some(a => (t || '').toLowerCase().includes(a)))
        );
      } else if (smartFilter === 'premium') {
        filtered = filtered.filter(p => (p.price || 0) >= 1000);
      }
    }
    
    // Price filter
    if (priceRange === 'under500') {
      filtered = filtered.filter(p => (p.price || 0) < 500);
    } else if (priceRange === '500-1000') {
      filtered = filtered.filter(p => (p.price || 0) >= 500 && (p.price || 0) <= 1000);
    } else if (priceRange === 'over1000') {
      filtered = filtered.filter(p => (p.price || 0) > 1000);
    }
    
    // ============================================
    // MIRA'S SILENT SORTING - Apply the Doctrine
    // "Mira knows Lola more than the pet parent"
    // ============================================
    filtered = miraSilentSort(filtered, activePet);
    
    return filtered;
  }, [products, searchQuery, selectedBreed, selectedShape, smartFilter, priceRange, selectedTab, miraSilentSort, activePet]);
  
  const filteredProducts = getFilteredProducts();
  const currentTab = CATEGORY_TABS.find(t => t.id === selectedTab);
  const heroContent = TAB_CONTENT[selectedTab] || TAB_CONTENT['all'];
  
  // Open box builder with specific occasion
  const openBoxBuilder = (occasion) => {
    setBoxOccasion(occasion);
    setShowBoxBuilder(true);
  };
  
  // Open product detail modal (same rich experience as original /celebrate page)
  const handleProductTap = (product) => {
    haptic('medium');
    setSelectedProduct(product);
  };

  // Get pet image or fallback
  const petImage = activePet?.image || activePet?.avatar || null;
  const petName = activePet?.name || 'Your Pet';

  return (
    <PillarPageLayout
      pillar="celebrate"
      title="Celebrations for Your Pet"
      description="Mark the moments that matter to your furry friend"
      showSubcategories={true}
      useTabNavigation={true}
      hideMiraWidget={true}
      onSubcategoryChange={(subcat) => {
        // Map PillarPageLayout subcategories to our internal tab system
        const tabMapping = {
          'cakes': 'cakes',
          'breed-cakes': 'breed-cakes',
          'pupcakes': 'pupcakes',
          'treats': 'treats',
          'hampers': 'hampers',
          'accessories': 'accessories',
          null: 'all' // "All Celebrate" maps to our 'all' tab
        };
        const mappedTab = tabMapping[subcat] ?? 'all';
        handleTabChange(mappedTab);
      }}
    >
    {/* Main Content - Works WITH PillarPageLayout's beautiful hero */}
    <div className="min-h-screen pb-24">
      <div className="max-w-6xl mx-auto px-4 pt-4">
        
        {/* PERSONALIZED PICKS - Soul-matched products first */}
        <div className="mb-6">
          <PersonalizedPicks 
            pillar="celebrate" 
            category={selectedTab !== 'all' ? selectedTab : undefined}
            maxProducts={4} 
          />
        </div>
        
        {/* ============================================ */}
        {/* TAB: ALL - Show smart discovery + concierge + occasion boxes */}
        {/* ============================================ */}
        {selectedTab === 'all' && (
          <>
            <TrustStats />
            <SmartDiscovery 
              activeFilter={smartFilter} 
              onFilterChange={setSmartFilter}
              onTabChange={handleTabChange}
              activePet={activePet}
            />
            <OccasionBoxGrid onSelectBox={openBoxBuilder} />
            <ConciergeSection onPlanParty={() => setShowPartyWizard(true)} />
          </>
        )}
        
        {/* ============================================ */}
        {/* TAB: BREED CAKES - Breed Filter */}
        {/* ============================================ */}
        {selectedTab === 'breed-cakes' && (
          <BreedFilterPills
            selectedBreed={selectedBreed}
            onBreedChange={setSelectedBreed}
            petBreed={activePet?.breed}
          />
        )}
        
        {/* ============================================ */}
        {/* TAB: CAKES - City Filter + Shape Filter + Custom CTA */}
        {/* ============================================ */}
        {selectedTab === 'cakes' && (
          <>
            <TrustStats />
            <CustomCakeCTA />
            <div className="flex items-center gap-2 mb-3">
              <CityFilter selectedCity={selectedCity} onCityChange={setSelectedCity} />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 active:bg-gray-200"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2 font-medium">Filter by shape:</p>
              <ShapeFilter selectedShape={selectedShape} onShapeChange={setSelectedShape} />
            </div>
          </>
        )}
        
        {/* ============================================ */}
        {/* TAB: HAMPERS - Build a Box CTA */}
        {/* ============================================ */}
        {selectedTab === 'hampers' && (
          <BuildBoxCTA onBuildBox={() => openBoxBuilder('birthday')} />
        )}
        
        {/* ============================================ */}
        {/* PRODUCTS GRID - 2x2 Mobile, 4-col Desktop */}
        {/* ============================================ */}
        <div id="products-grid" className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {currentTab?.name || 'All'} Products
              </h2>
              <p className="text-sm text-gray-500">
                {loading ? 'Loading...' : (
                  <>
                    {filteredProducts.length} items
                    {/* Mira's Silent Sorting Indicator - Subtle hint that personalization is active */}
                    {activePet && !loading && (
                      <span className="ml-2 text-purple-500 font-medium">
                        · Sorted for {activePet.name}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            {selectedTab !== 'all' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleTabChange('all')}
                className="text-pink-600"
              >
                View All
              </Button>
            )}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <QuickProductTile
                  key={product._id || product.id}
                  product={product}
                  onTap={handleProductTap}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl">
              <div className="w-16 h-16 mx-auto bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
                <Cake className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filters</p>
              <Button onClick={() => handleTabChange('all')}>View All Products</Button>
            </div>
          )}
        </div>
        
        {/* ============================================ */}
        {/* TAB: ALL - Services Section */}
        {/* ============================================ */}
        {selectedTab === 'all' && (
          <div className="mt-8">
            <ServiceCatalogSection 
              pillar="celebrate"
              title="Celebrate Services"
              subtitle="Personalized pricing for your city & pet"
              maxServices={6}
            />
          </div>
        )}
      </div>
      
      {/* ============================================ */}
      {/* BOTTOM CTA */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-10 px-4 mt-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Ready for the Pawfect Celebration?
          </h2>
          <p className="text-pink-100 mb-6 text-sm sm:text-base">
            Let our Concierge® create an unforgettable experience!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button 
              size="lg"
              className="bg-white text-pink-600 hover:bg-pink-50 rounded-xl shadow-lg"
              onClick={() => setShowPartyWizard(true)}
              data-testid="plan-party-btn"
            >
              <PartyPopper className="w-5 h-5 mr-2" />
              Plan My Party
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/20 rounded-xl"
              onClick={() => openBoxBuilder('birthday')}
              data-testid="build-box-btn"
            >
              <Gift className="w-5 h-5 mr-2" />
              Build a Box
            </Button>
          </div>
        </div>
      </div>
      
      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}
      <OccasionBoxBuilder
        isOpen={showBoxBuilder}
        onClose={() => setShowBoxBuilder(false)}
        occasionType={boxOccasion}
        petName={activePet?.name || 'your pet'}
        onAddToCart={(items) => {
          items.forEach(item => addToCart(item));
          toast.success('Added to cart!');
        }}
      />
      
      {showPartyWizard && (
        <PartyPlanningWizard
          onClose={() => setShowPartyWizard(false)}
          onComplete={(data) => {
            toast.success('Party plan submitted! Our concierge will be in touch.');
            setShowPartyWizard(false);
          }}
        />
      )}
      
      {/* Product Detail Modal - Full rich experience with Pawmeter, Options, Personalization */}
      {selectedProduct && createPortal(
        <ProductDetailModal
          product={selectedProduct}
          pillar="celebrate"
          selectedPet={activePet}
          miraContext={{
            petName: activePet?.name,
            petBreed: activePet?.breed,
            pillar: 'celebrate',
            quietHints: ['Perfect for celebrations', 'Handled by Mira']
          }}
          onClose={() => setSelectedProduct(null)}
        />,
        document.body
      )}
      
      {/* Mira OS - BETA Testing (Parallel to existing FAB) */}
      <MiraOSTrigger pillar="celebrate" position="bottom-left" />
      
      {/* Concierge® Button - Two-way communication with Service Desk */}
      <ConciergeButton 
        pillar="celebrate" 
        position="bottom-right"
        petId={activePet?.id}
        petName={activePet?.name}
        showLabel
      />
    </div>
    </PillarPageLayout>
  );
};

export default CelebrateNewPage;

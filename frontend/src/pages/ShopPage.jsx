/**
 * ShopPage.jsx
 * 
 * Clean, personalized shop for the selected pet.
 * NO NUMBERS anywhere except product prices.
 * Synced with navbar pet selection.
 * Pillar filters with subcategories.
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
import {
  Search, Heart, ArrowRight, X, Package, Mic,
  PawPrint, Briefcase, Sparkles, Cake, Stethoscope, 
  UtensilsCrossed, Plane, Dumbbell, GraduationCap, Home,
  Shield, FileText, AlertTriangle, Flower2, ShoppingBag, ChevronDown, ChevronRight
} from 'lucide-react';

// =============================================================================
// PILLAR CONFIG - With subcategories (Recommended first, All last)
// =============================================================================
const PILLARS = [
  { 
    id: 'recommended', 
    label: 'Recommended', 
    icon: Sparkles, 
    color: 'bg-amber-100',
    subcategories: []
  },
  { 
    id: 'celebrate', 
    label: 'Celebrate', 
    icon: Cake, 
    color: 'bg-pink-100',
    subcategories: ['Cakes', 'Mini Cakes', 'Dognuts', 'Hampers', 'Party Treats']
  },
  { 
    id: 'dine', 
    label: 'Dine', 
    icon: UtensilsCrossed, 
    color: 'bg-orange-100',
    subcategories: ['Fresh Meals', 'Treats', 'Desi Treats', 'Frozen Treats']
  },
  { 
    id: 'stay', 
    label: 'Stay', 
    icon: Home, 
    color: 'bg-blue-100',
    subcategories: ['Beds', 'Mats', 'Kennels', 'Crates']
  },
  { 
    id: 'travel', 
    label: 'Travel', 
    icon: Plane, 
    color: 'bg-sky-100',
    subcategories: ['Carriers', 'Car Accessories', 'Travel Bowls']
  },
  { 
    id: 'care', 
    label: 'Care', 
    icon: Stethoscope, 
    color: 'bg-red-100',
    subcategories: ['Grooming', 'Health', 'Supplements', 'First Aid']
  },
  { 
    id: 'enjoy', 
    label: 'Enjoy', 
    icon: Sparkles, 
    color: 'bg-yellow-100',
    subcategories: ['Toys', 'Chews', 'Games']
  },
  { 
    id: 'fit', 
    label: 'Fit', 
    icon: Dumbbell, 
    color: 'bg-green-100',
    subcategories: ['Leashes', 'Harnesses', 'Collars', 'Training Gear']
  },
  { 
    id: 'learn', 
    label: 'Learn', 
    icon: GraduationCap, 
    color: 'bg-indigo-100',
    subcategories: ['Training Aids', 'Books', 'Puzzles']
  },
  { 
    id: 'paperwork', 
    label: 'Paperwork', 
    icon: FileText, 
    color: 'bg-slate-100',
    subcategories: []
  },
  { 
    id: 'advisory', 
    label: 'Advisory', 
    icon: Shield, 
    color: 'bg-purple-100',
    subcategories: []
  },
  { 
    id: 'emergency', 
    label: 'Emergency', 
    icon: AlertTriangle, 
    color: 'bg-red-100',
    subcategories: []
  },
  { 
    id: 'farewell', 
    label: 'Farewell', 
    icon: Flower2, 
    color: 'bg-violet-100',
    subcategories: ['Memorials', 'Keepsakes']
  },
  { 
    id: 'adopt', 
    label: 'Adopt', 
    icon: Heart, 
    color: 'bg-rose-100',
    subcategories: []
  },
  { 
    id: 'shop', 
    label: 'Shop', 
    icon: ShoppingBag, 
    color: 'bg-teal-100',
    subcategories: ['Apparel', 'Accessories', 'Bowls', 'Feeders']
  },
  { 
    id: 'all', 
    label: 'All', 
    icon: Package, 
    color: 'bg-gray-100',
    subcategories: []
  },
];

// =============================================================================
// PET BAR - Shows selected pet's photo with dropdown to switch pets
// =============================================================================
const PetBar = ({ pet, pets, onSelectPet }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  if (!pet) return null;
  
  const petPhoto = pet.photo_url || pet.image_url || pet.image;
  
  return (
    <div className="bg-white border-b border-gray-100 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Pet Photo */}
          <div className="relative flex-shrink-0">
            {petPhoto ? (
              <img 
                src={petPhoto} 
                alt={pet.name} 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#C4785A] shadow-sm"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F5F0E8] border-2 border-[#C4785A] flex items-center justify-center">
                <PawPrint className="w-5 h-5 sm:w-6 sm:h-6 text-[#C4785A]" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          {/* Pet Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-[#2D2D2D] truncate">
              Shopping for <span className="text-[#C4785A]">{pet.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#9B9B9B]">
              {pet.breed || 'Your companion'} • Personalized picks just for {pet.name}
            </p>
          </div>
          
          {/* Pet Dropdown Selector */}
          {pets && pets.length > 1 && (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#2D2D2D] bg-[#F5F0E8] rounded-full hover:bg-[#E8E0D5] transition-colors"
              >
                <span className="hidden sm:inline">Switch pet</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  {pets.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { onSelectPet(p); setShowDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9F6F1] transition-colors ${
                        p.id === pet.id ? 'bg-[#F9F6F1]' : ''
                      }`}
                    >
                      {(p.photo_url || p.image_url || p.image) ? (
                        <img 
                          src={p.photo_url || p.image_url || p.image} 
                          alt={p.name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                          <PawPrint className="w-4 h-4 text-[#C4785A]" />
                        </div>
                      )}
                      <div className="text-left">
                        <div className="text-sm font-medium text-[#2D2D2D]">{p.name}</div>
                        <div className="text-xs text-[#9B9B9B]">{p.breed || 'Pet'}</div>
                      </div>
                      {p.id === pet.id && (
                        <div className="ml-auto w-2 h-2 bg-[#C4785A] rounded-full"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// INTELLIGENT SEARCH - Like navbar
// =============================================================================
const IntelligentSearch = ({ petName, products }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    return products
      .filter(p => 
        p.name?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.title || p.name,
        image: p.image || p.image_url || p.images?.[0],
        price: p.price,
        url: `/product/${p.handle || p.id}`
      }));
  }, [query, products]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div ref={searchRef} className="relative w-full max-w-xl mx-auto px-2">
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#9B9B9B]" />
        <Input
          value={query}
          onChange={(e) => { 
            setQuery(e.target.value); 
            setShowSuggestions(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={petName ? `Search for ${petName}...` : "Search treats, toys, more..."}
          className="pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-[#C4785A]/50 focus:border-[#C4785A]"
          data-testid="shop-search"
        />
        <button className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#C4785A] active:scale-95 transition-all p-1">
          <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
      
      {/* Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border overflow-hidden z-50">
          {suggestions.map((item) => (
            <Link
              key={item.id}
              to={item.url}
              onClick={() => { setShowSuggestions(false); setQuery(''); }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F0E8] border-b last:border-0"
            >
              {item.image ? (
                <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#2D2D2D] text-sm truncate">{item.name}</p>
                <p className="text-sm font-bold text-[#C4785A]">₹{item.price?.toLocaleString()}</p>
              </div>
              <span className="text-[10px] px-2 py-1 rounded-full bg-pink-100 text-pink-700 font-medium">
                Product
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// PILLAR FILTERS - With subcategories, NO NUMBERS
// =============================================================================
const PillarFilters = ({ selected, onSelect, selectedSubcat, onSelectSubcat }) => {
  const selectedPillar = PILLARS.find(p => p.id === selected);
  
  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4">
        {/* Main Pillars - Horizontally scrollable with touch-friendly sizing */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = selected === pillar.id;
            
            return (
              <button
                key={pillar.id}
                onClick={() => {
                  onSelect(pillar.id);
                  onSelectSubcat(null);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start active:scale-95 ${
                  isActive
                    ? 'bg-[#2D2D2D] text-white shadow-md'
                    : `${pillar.color} text-[#2D2D2D] hover:shadow-md active:shadow-md`
                }`}
                data-testid={`pillar-${pillar.id}`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{pillar.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Subcategories - Show if pillar has them */}
        {selectedPillar?.subcategories?.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-3 overflow-x-auto pb-1 scrollbar-hide snap-x">
            <button
              onClick={() => onSelectSubcat(null)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all snap-start active:scale-95 ${
                !selectedSubcat
                  ? 'bg-[#C4785A] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All {selectedPillar.label}
            </button>
            {selectedPillar.subcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => onSelectSubcat(subcat)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all snap-start active:scale-95 ${
                  selectedSubcat === subcat
                    ? 'bg-[#C4785A] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                data-testid={`subcat-${subcat}`}
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
// PRODUCT CARD - Touch-optimized, emotionally engaging
// =============================================================================
const ProductCard = ({ product, petName, isPetPick }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();
  
  const price = product.price || 0;
  const title = product.title || product.name || 'Product';
  const image = product.image || product.image_url || product.images?.[0];

  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl active:shadow-md transition-all active:scale-[0.98]"
      onClick={() => navigate(`/product/${product.handle || product.id}`)}
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-square bg-gradient-to-br from-[#F9F6F1] to-[#F0EBE3] overflow-hidden">
        <img
          src={image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {isPetPick && petName && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#C4785A] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
              {petName}&apos;s Pick
            </span>
          </div>
        )}
        
        <button
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#C4785A] text-[#C4785A]' : 'text-gray-600'}`} />
        </button>
      </div>
      
      <div className="p-3 sm:p-4">
        <h3 className="font-medium text-[#2D2D2D] text-sm sm:text-base mb-1 line-clamp-2 leading-snug">
          {title}
        </h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-base sm:text-lg font-semibold text-[#2D2D2D]">
            ₹{price.toLocaleString()}
          </span>
          <ArrowRight className="w-4 h-4 text-[#C4785A] group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SERVICE CARD - Touch-optimized
// =============================================================================
const ServiceCard = ({ service }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl active:shadow-md transition-all active:scale-[0.98]"
      onClick={() => navigate(`/services/${service.pillar}/${service.id}`)}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#7A8B6F] to-[#5A6B4F] overflow-hidden">
        {service.image_url ? (
          <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Briefcase className="w-12 h-12 text-white/30" />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="font-medium text-[#2D2D2D] text-sm sm:text-base mb-1 line-clamp-2">{service.name}</h3>
        <div className="flex items-center justify-between mt-2">
          {service.base_price > 0 ? (
            <span className="text-base font-semibold text-[#2D2D2D]">From ₹{service.base_price?.toLocaleString()}</span>
          ) : (
            <span className="text-sm text-[#7A8B6F] font-medium">Get a quote</span>
          )}
          <ArrowRight className="w-4 h-4 text-[#C4785A] group-hover:translate-x-1 transition-transform" />
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
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // State
  const [allProducts, setAllProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('products');
  const [selectedPillar, setSelectedPillar] = useState('recommended');
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [displayCount, setDisplayCount] = useState(24);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petSoulData, setPetSoulData] = useState(null);
  
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
  
  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/api/service-box/services?limit=200`);
        if (res.ok) {
          const data = await res.json();
          setServices(data.services || []);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      }
    };
    fetchServices();
  }, []);
  
  // Fetch pets and sync with navbar's selection
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
              // Get navbar's selected pet from localStorage
              const savedPetId = localStorage.getItem('selectedPetId');
              const pet = savedPetId 
                ? userPets.find(p => p.id === savedPetId) 
                : userPets[0];
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
  
  // Listen for pet selection changes from Navbar (custom event)
  useEffect(() => {
    const handlePetSelectionChanged = (event) => {
      const { pet, petId } = event.detail || {};
      if (pet) {
        // Full pet object provided
        setSelectedPet(pet);
      } else if (petId && pets.length > 0) {
        // Only petId provided, find from pets list
        const foundPet = pets.find(p => p.id === petId);
        if (foundPet) setSelectedPet(foundPet);
      }
    };
    
    window.addEventListener('petSelectionChanged', handlePetSelectionChanged);
    return () => window.removeEventListener('petSelectionChanged', handlePetSelectionChanged);
  }, [pets]);
  
  // Fetch pet's soul data for Mira AI personalization
  useEffect(() => {
    if (selectedPet?.id && token) {
      const fetchPetSoul = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pet-soul/${selectedPet.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPetSoulData(data);
          }
        } catch (err) {
          console.error('Failed to fetch pet soul:', err);
        }
      };
      fetchPetSoul();
    } else {
      setPetSoulData(null);
    }
  }, [selectedPet?.id, token]);
  
  // Generate quiet Mira intelligence based on pet's breed & personality
  const miraLines = useMemo(() => {
    if (!selectedPet) return null;
    
    const petName = selectedPet.name;
    const breed = (selectedPet.breed || '').toLowerCase();
    const soul = petSoulData?.soul || petSoulData;
    
    // Breed-specific quiet nudges (factual, calm, confident)
    const breedNudges = {
      'shih tzu': `${breed.includes('shih') ? 'Shih Tzus' : petName} typically need grooming supplies every 4-6 weeks.`,
      'pomeranian': `Pomeranians love plush toys and dental chews.`,
      'golden retriever': `Retrievers thrive with fetch toys and joint supplements.`,
      'labrador': `Labs love water toys. Consider travel bowls for outdoor adventures.`,
      'beagle': `Beagles are scent-driven — puzzle feeders work great for them.`,
      'pug': `Pugs need cooling gear in summer and gentle harnesses.`,
      'german shepherd': `German Shepherds benefit from training treats and chew toys.`,
      'husky': `Huskies need deshedding tools and cooling mats.`,
      'indie': `Indies are adaptable — focus on nutrition and outdoor gear.`,
      'dachshund': `Dachshunds need back-friendly beds and ramps.`,
    };
    
    // Find matching breed nudge
    let breedLine = null;
    for (const [breedKey, nudge] of Object.entries(breedNudges)) {
      if (breed.includes(breedKey.split(' ')[0].toLowerCase())) {
        breedLine = nudge;
        break;
      }
    }
    
    // Extract personality from soul data for secondary nudge
    const personality = soul?.describe_3_words || soul?.personality || '';
    const nature = soul?.general_nature || '';
    
    const lines = [];
    
    // Primary: Breed-specific
    if (breedLine) {
      lines.push(breedLine);
    }
    
    // Secondary: Personality-based (if available)
    if (nature && nature.toLowerCase().includes('playful')) {
      lines.push(`Since ${petName} is playful, interactive toys are a great pick.`);
    } else if (nature && nature.toLowerCase().includes('calm')) {
      lines.push(`${petName} seems calm — comfort items like beds work well.`);
    }
    
    // Fallback if no specific data
    if (lines.length === 0 && petName) {
      lines.push(`Products selected with ${petName}'s needs in mind.`);
    }
    
    return lines;
  }, [selectedPet, petSoulData]);
  
  // Handler for pet selection from dropdown
  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    localStorage.setItem('selectedPetId', pet.id);
    // Dispatch event so navbar can sync
    window.dispatchEvent(new CustomEvent('petSelectionChanged', { detail: { pet, petId: pet.id } }));
  };
  
  // Filter products - Use pillars array (products can belong to multiple pillars)
  // Shop = cumulative view of ALL products
  const filteredProducts = useMemo(() => {
    let result = allProducts;
    
    if (selectedPillar !== 'all' && selectedPillar !== 'shop') {
      // Filter by pillars array - products can be in multiple pillars
      result = result.filter(p => {
        const productPillars = p.pillars || [];
        return productPillars.includes(selectedPillar) || 
               p.primary_pillar === selectedPillar || 
               p.pillar === selectedPillar;
      });
    }
    // 'all' or 'shop' shows everything (shop is cumulative)
    
    if (selectedSubcat) {
      const subLower = selectedSubcat.toLowerCase().replace(/\s+/g, '-');
      result = result.filter(p =>
        p.category?.toLowerCase().includes(subLower) ||
        p.subcategory?.toLowerCase().includes(subLower) ||
        p.product_type?.toLowerCase().includes(subLower) ||
        p.tags?.some(t => t?.toLowerCase().includes(subLower))
      );
    }
    
    return result;
  }, [allProducts, selectedPillar, selectedSubcat]);
  
  // Filter services by pillar (services can also be in multiple pillars)
  const filteredServices = useMemo(() => {
    if (selectedPillar === 'all' || selectedPillar === 'shop') {
      return services; // Shop shows all services
    }
    return services.filter(s => {
      const servicePillars = s.pillars || [];
      return servicePillars.includes(selectedPillar) || s.pillar === selectedPillar;
    });
  }, [services, selectedPillar]);
  
  // Products to display
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);
  
  // Pet picks
  const petPicks = useMemo(() => {
    if (!selectedPet?.breed) return allProducts.slice(0, 6);
    const breed = selectedPet.breed.toLowerCase();
    const picks = allProducts.filter(p => 
      p.is_breed_specific && 
      (p.breed_metadata?.breeds?.some(b => b.toLowerCase().includes(breed)) ||
       p.name?.toLowerCase().includes(breed) ||
       p.title?.toLowerCase().includes(breed))
    ).slice(0, 6);
    return picks.length >= 3 ? picks : allProducts.slice(0, 6);
  }, [allProducts, selectedPet]);
  
  const handleLoadMore = () => setDisplayCount(prev => prev + 24);
  const hasMore = displayCount < filteredProducts.length;
  const petName = selectedPet?.name || '';
  const petPhoto = selectedPet?.photo_url || selectedPet?.image_url || selectedPet?.image;

  return (
    <div className="min-h-screen bg-[#F9F6F1] pb-24 md:pb-0" data-testid="shop-page">
      <SEOHead page="shop" path="/shop" />
      
      {/* Pet Bar with Dropdown */}
      <PetBar 
        pet={selectedPet} 
        pets={pets}
        onSelectPet={handleSelectPet}
      />
      
      {/* Hero Section - With Pet Photo & Warm Mira Lines */}
      <section className="bg-gradient-to-b from-[#F9F6F1] to-white py-6 sm:py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Pet-Centric Hero */}
          <div className="text-center mb-6 sm:mb-8">
            {/* Pet Photo (if available) */}
            {petPhoto && (
              <div className="mb-4 sm:mb-6">
                <div className="relative inline-block">
                  <img 
                    src={petPhoto} 
                    alt={petName}
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover mx-auto border-4 border-white shadow-xl ring-4 ring-[#C4785A]/20"
                  />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Warm Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#2D2D2D] leading-tight mb-3 sm:mb-4 px-2">
              {petName ? (
                <>Products curated for <span className="text-[#C4785A]">{petName}</span></>
              ) : (
                <>Products curated for your companion</>
              )}
            </h1>
            
            {/* Warm Subtitle - The key line */}
            <p className="text-sm sm:text-base md:text-lg text-[#6B6B6B] mb-4 sm:mb-6 max-w-xl mx-auto px-4">
              Thoughtfully selected for his life and needs.
            </p>
            
            {/* Mira's Quiet Intelligence - Subtle, factual, confident */}
            {miraLines && miraLines.length > 0 && (
              <div className="bg-[#F5F3F0] rounded-xl p-3 sm:p-4 max-w-md mx-auto mb-6 sm:mb-8 border border-[#E8E4DF]">
                <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed text-center">
                  {miraLines[0]}
                </p>
              </div>
            )}
          </div>
          
          <IntelligentSearch petName={petName} products={allProducts} />
        </div>
      </section>
      
      {/* Pillar Filters with Subcategories */}
      <PillarFilters 
        selected={selectedPillar}
        onSelect={(p) => { setSelectedPillar(p); setDisplayCount(24); }}
        selectedSubcat={selectedSubcat}
        onSelectSubcat={setSelectedSubcat}
      />
      
      {/* Pet's Top Picks - NO counts */}
      {petName && petPicks.length > 0 && (
        <section className="py-8 sm:py-12 bg-[#F9F6F1]" data-testid="pet-picks-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2D2D2D] mb-6">
              {petName}&apos;s Top Picks
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {petPicks.map((product) => (
                <ProductCard key={product.id} product={product} petName={petName} isPetPick={true} />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* Products/Services Section - NO COUNTS in tabs */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#2D2D2D]">
              {selectedPillar === 'all' 
                ? `All ${activeView === 'products' ? 'Products' : 'Services'}` 
                : `${PILLARS.find(p => p.id === selectedPillar)?.label || ''} ${activeView === 'products' ? 'Products' : 'Services'}`}
              {selectedSubcat && ` › ${selectedSubcat}`}
            </h2>
            
            {/* Toggle Buttons - Mobile optimized */}
            <div className="flex gap-1.5 sm:gap-2">
              <Button
                onClick={() => setActiveView('products')}
                variant={activeView === 'products' ? 'default' : 'outline'}
                className={`text-xs sm:text-sm px-3 sm:px-4 py-2 ${activeView === 'products' ? 'bg-[#2D2D2D] text-white' : 'border-gray-200'}`}
                data-testid="tab-products"
              >
                Products
              </Button>
              <Button
                onClick={() => setActiveView('services')}
                variant={activeView === 'services' ? 'default' : 'outline'}
                className={`text-xs sm:text-sm px-3 sm:px-4 py-2 ${activeView === 'services' ? 'bg-[#2D2D2D] text-white' : 'border-gray-200'}`}
                data-testid="tab-services"
              >
                Services
              </Button>
            </div>
          </div>
          
          {/* Products Grid */}
          {activeView === 'products' && (
            <>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-xl sm:rounded-2xl">
                      <div className="aspect-square bg-gray-200 rounded-t-xl sm:rounded-t-2xl"></div>
                      <div className="p-3 sm:p-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div>
                    </div>
                  ))}
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="text-center py-12 sm:py-16 px-4">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-[#2D2D2D] mb-2">No products found</h3>
                  <p className="text-sm sm:text-base text-[#9B9B9B] mb-4">Try selecting a different category</p>
                  <Button onClick={() => { setSelectedPillar('all'); setSelectedSubcat(null); }} variant="outline" className="text-sm">
                    View All
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                    {displayedProducts.map(product => (
                      <ProductCard key={product.id} product={product} petName={petName} isPetPick={false} />
                    ))}
                  </div>
                  
                  {hasMore && (
                    <div className="text-center mt-6 sm:mt-8">
                      <Button
                        onClick={handleLoadMore}
                        variant="outline"
                        className="px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base border-[#2D2D2D] text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-white active:scale-95 transition-all"
                        data-testid="load-more-btn"
                      >
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                        Load More
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          
          {/* Services Grid */}
          {activeView === 'services' && (
            <>
              {filteredServices.length === 0 ? (
                <div className="text-center py-12 sm:py-16 px-4">
                  <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-[#2D2D2D] mb-2">No services in this category</h3>
                  <p className="text-sm text-[#9B9B9B] mb-4">Try a different pillar</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
                  {filteredServices.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      {/* Emotional Close */}
      <section className="bg-white py-12 sm:py-16 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-lg sm:text-xl md:text-2xl text-[#2D2D2D] font-medium leading-relaxed mb-4">
            {petName ? (
              <>You don't manage shopping.<br />You just love <span className="text-[#C4785A]">{petName}</span>.<br />We handle the rest.</>
            ) : (
              <>You don't manage shopping.<br />You just love your dog.<br />We handle the rest.</>
            )}
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openMiraChat'))}
            className="text-sm text-[#9B9B9B] hover:text-[#C4785A] transition-colors"
          >
            Need help deciding? Ask Mira.
          </button>
        </div>
      </section>
      
      <MiraChatWidget pillar="shop" />
    </div>
  );
};

export default ShopPage;

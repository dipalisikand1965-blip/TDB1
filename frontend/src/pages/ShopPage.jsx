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
// PILLAR CONFIG - With subcategories
// =============================================================================
const PILLARS = [
  { 
    id: 'all', 
    label: 'All', 
    icon: Sparkles, 
    color: 'bg-gray-100',
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
];

// =============================================================================
// PET BAR - Shows selected pet's photo (synced with navbar)
// =============================================================================
const PetBar = ({ pet, onChangePet }) => {
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
              {pet.breed || 'Your companion'} • Personalized for {pet.name}
            </p>
          </div>
          
          {/* Change Pet */}
          <button 
            onClick={onChangePet}
            className="text-xs sm:text-sm text-[#C4785A] font-medium hover:underline hidden sm:block"
          >
            Change pet
          </button>
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
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B9B9B]" />
        <Input
          value={query}
          onChange={(e) => { 
            setQuery(e.target.value); 
            setShowSuggestions(e.target.value.length >= 2);
          }}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          placeholder={petName ? `Search for ${petName}...` : "Search everything..."}
          className="pl-12 sm:pl-14 pr-12 py-4 sm:py-5 text-base bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-[#C4785A]"
          data-testid="shop-search"
        />
        <button className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#C4785A]">
          <Mic className="w-5 h-5" />
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
    <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {/* Main Pillars - Horizontally scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
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
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[#2D2D2D] text-white shadow-md'
                    : `${pillar.color} text-[#2D2D2D] hover:shadow-md`
                }`}
                data-testid={`pillar-${pillar.id}`}
              >
                <Icon className="w-4 h-4" />
                {pillar.label}
              </button>
            );
          })}
        </div>
        
        {/* Subcategories - Show if pillar has them */}
        {selectedPillar?.subcategories?.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => onSelectSubcat(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
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
// PRODUCT CARD - NO item counts
// =============================================================================
const ProductCard = ({ product, petName, isPetPick }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();
  
  const price = product.price || 0;
  const title = product.title || product.name || 'Product';
  const image = product.image || product.image_url || product.images?.[0];

  return (
    <div 
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
      onClick={() => navigate(`/product/${product.handle || product.id}`)}
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-square bg-[#F5F0E8] overflow-hidden">
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
// SERVICE CARD
// =============================================================================
const ServiceCard = ({ service }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all"
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
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [displayCount, setDisplayCount] = useState(24);
  const [selectedPet, setSelectedPet] = useState(null);
  
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
  
  // Poll localStorage for pet changes (same-tab updates from navbar)
  useEffect(() => {
    let lastPetId = localStorage.getItem('selectedPetId');
    
    const checkForPetChange = () => {
      const currentPetId = localStorage.getItem('selectedPetId');
      if (currentPetId !== lastPetId && pets.length > 0) {
        lastPetId = currentPetId;
        const pet = pets.find(p => p.id === currentPetId);
        if (pet) setSelectedPet(pet);
      }
    };
    
    // Check every 500ms for changes
    const interval = setInterval(checkForPetChange, 500);
    return () => clearInterval(interval);
  }, [pets]);
  
  // Filter products
  const filteredProducts = useMemo(() => {
    let result = allProducts;
    
    if (selectedPillar !== 'all') {
      result = result.filter(p =>
        p.pillars?.includes(selectedPillar) ||
        p.primary_pillar === selectedPillar ||
        p.pillar === selectedPillar
      );
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
    
    return result;
  }, [allProducts, selectedPillar, selectedSubcat]);
  
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

  return (
    <div className="min-h-screen bg-[#F9F6F1]" data-testid="shop-page">
      <SEOHead page="shop" path="/shop" />
      
      {/* Pet Bar */}
      <PetBar 
        pet={selectedPet} 
        onChangePet={() => navigate('/my-pets')}
      />
      
      {/* Hero - NO NUMBERS */}
      <section className="bg-[#F9F6F1] py-8 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#2D2D2D] leading-tight mb-4">
            {petName ? (
              <>Everything <span className="text-[#C4785A]">{petName}</span> needs</>
            ) : (
              <>Everything your pet needs</>
            )}
          </h1>
          <p className="text-base sm:text-lg text-[#6B6B6B] mb-8 max-w-2xl mx-auto">
            {petName ? (
              <>Curated across all pillars, just for {petName}.</>
            ) : (
              <>Curated across all pillars, just for your companion.</>
            )}
          </p>
          
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
              {selectedPillar === 'all' ? 'All Products' : `${PILLARS.find(p => p.id === selectedPillar)?.label || ''} Products`}
              {selectedSubcat && ` › ${selectedSubcat}`}
            </h2>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveView('products')}
                variant={activeView === 'products' ? 'default' : 'outline'}
                className={`text-sm ${activeView === 'products' ? 'bg-[#2D2D2D] text-white' : 'border-gray-200'}`}
                data-testid="tab-products"
              >
                Products
              </Button>
              <Button
                onClick={() => setActiveView('services')}
                variant={activeView === 'services' ? 'default' : 'outline'}
                className={`text-sm ${activeView === 'services' ? 'bg-[#2D2D2D] text-white' : 'border-gray-200'}`}
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-2xl">
                      <div className="aspect-square bg-gray-200 rounded-t-2xl"></div>
                      <div className="p-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></div>
                    </div>
                  ))}
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">No products found</h3>
                  <p className="text-[#9B9B9B] mb-4">Try selecting a different category</p>
                  <Button onClick={() => { setSelectedPillar('all'); setSelectedSubcat(null); }} variant="outline">
                    View All
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {displayedProducts.map(product => (
                      <ProductCard key={product.id} product={product} petName={petName} isPetPick={false} />
                    ))}
                  </div>
                  
                  {hasMore && (
                    <div className="text-center mt-8">
                      <Button
                        onClick={handleLoadMore}
                        variant="outline"
                        className="px-8 py-3 text-base border-[#2D2D2D] text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-white"
                        data-testid="load-more-btn"
                      >
                        <ChevronDown className="w-5 h-5 mr-2" />
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
              {services.length === 0 ? (
                <div className="text-center py-16">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">Services coming soon</h3>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {services.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      <MiraChatWidget pillar="shop" />
    </div>
  );
};

export default ShopPage;

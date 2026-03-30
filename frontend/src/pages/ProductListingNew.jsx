/**
 * ProductListing.jsx - Pet Life Operating System
 * 
 * This is not a store. This is a system that knows:
 * - Who your dog is
 * - What stage of life they're in
 * - What comes next
 * 
 * Design Philosophy:
 * - Identity before inventory
 * - Calm, not noise
 * - Memory-driven
 * - Trust through transparency
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { 
  Loader2, PawPrint, Heart, MapPin, ChevronDown, ChevronRight,
  Sparkles, Calendar, Shield, Truck, MessageCircle, X, Check,
  Info, Filter, Search
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { API_URL, getApiUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/SEOHead';
import { toast } from '../hooks/use-toast';

// Life stage information for dogs
const LIFE_STAGES = {
  puppy: { 
    label: 'Puppy', 
    ageRange: '0-1 year',
    description: 'Growing, learning, discovering the world',
    needs: ['Soft textures', 'Small portions', 'Training rewards', 'Gentle ingredients']
  },
  young_adult: { 
    label: 'Young Adult', 
    ageRange: '1-3 years',
    description: 'Active, playful, full of energy',
    needs: ['High protein', 'Joint support', 'Mental stimulation', 'Activity rewards']
  },
  adult: { 
    label: 'Adult', 
    ageRange: '3-7 years',
    description: 'Prime years, established routines',
    needs: ['Balanced nutrition', 'Weight management', 'Dental health', 'Variety']
  },
  senior: { 
    label: 'Senior', 
    ageRange: '7+ years',
    description: 'Wisdom years, comfort and care',
    needs: ['Soft treats', 'Joint support', 'Easy digestion', 'Gentle rewards']
  }
};

// Size categories
const SIZE_CATEGORIES = {
  small: { label: 'Small', weight: 'Under 10kg', portion: 'Small portions' },
  medium: { label: 'Medium', weight: '10-25kg', portion: 'Medium portions' },
  large: { label: 'Large', weight: '25-40kg', portion: 'Larger portions' },
  giant: { label: 'Giant', weight: '40kg+', portion: 'Extra large portions' }
};

// Moment-based categories (not SKU-based)
const MOMENT_CATEGORIES = {
  celebration: {
    label: 'Celebrations',
    description: 'Birthdays, gotcha days, milestones',
    icon: '🎂',
    types: ['cakes', 'hampers', 'accessories']
  },
  daily: {
    label: 'Daily Rituals',
    description: 'Training, walks, bedtime',
    icon: '🌅',
    types: ['treats', 'training-treats', 'biscuits']
  },
  health: {
    label: 'Health & Wellness',
    description: 'Dental, joints, digestion',
    icon: '💊',
    types: ['dental', 'supplements', 'calming']
  },
  special: {
    label: 'Special Occasions',
    description: 'Festivals, seasons, gifts',
    icon: '🎁',
    types: ['desi', 'valentine', 'christmas', 'diwali']
  }
};

// Fresh delivery cities
const DELIVERY_CITIES = [
  { value: 'all', label: 'All Locations' },
  { value: 'bangalore', label: 'Bangalore', fresh: true },
  { value: 'mumbai', label: 'Mumbai', fresh: true },
  { value: 'delhi', label: 'Delhi', fresh: true },
  { value: 'chennai', label: 'Chennai', fresh: true },
  { value: 'hyderabad', label: 'Hyderabad', fresh: true },
  { value: 'pune', label: 'Pune', fresh: true },
  { value: 'pan-india', label: 'Pan India (Packaged)', fresh: false }
];

// Determine life stage from age
const getLifeStage = (ageYears) => {
  if (ageYears < 1) return 'puppy';
  if (ageYears < 3) return 'young_adult';
  if (ageYears < 7) return 'adult';
  return 'senior';
};

// Determine size category from weight
const getSizeCategory = (weightKg) => {
  if (weightKg < 10) return 'small';
  if (weightKg < 25) return 'medium';
  if (weightKg < 40) return 'large';
  return 'giant';
};

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
  
  // Filter state
  const [deliveryCity, setDeliveryCity] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // UI state
  const [hiddenCount, setHiddenCount] = useState(0);
  const [showPetSelector, setShowPetSelector] = useState(false);
  
  // Get category from props or URL
  const category = propCategory || searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || searchParams.get('search') || '';

  // Fetch user's pets for personalization
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
            setActivePet(pets[0]);
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
        
        if (searchQuery) {
          url = `${getApiUrl()}/api/products/search?q=${encodeURIComponent(searchQuery)}&limit=100`;
        } else if (category && category !== 'all') {
          url += `&category=${encodeURIComponent(category)}`;
        }
        
        if (deliveryCity && deliveryCity !== 'all') {
          if (deliveryCity === 'pan-india') {
            url += `&availability=pan-india`;
          } else {
            url += `&fresh_delivery_city=${encodeURIComponent(deliveryCity)}`;
          }
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const productsArray = Array.isArray(data.products) ? data.products : [];
          setProducts(productsArray.filter(p => p !== null && p !== undefined));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      }
      setLoading(false);
    };
    
    fetchProducts();
  }, [category, searchQuery, deliveryCity]);

  // Intelligent filtering based on pet profile
  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    let hidden = 0;
    
    // Pet Soul Filtering - Filter based on allergies
    if (activePet) {
      const rawAllergies = activePet?.doggy_soul_answers?.food_allergies || 
                          activePet?.preferences?.allergies || 
                          activePet?.health?.allergies || [];
      const allergies = Array.isArray(rawAllergies) ? rawAllergies : [];
      
      if (allergies.length > 0) {
        const allergyKeywords = allergies
          .map(a => (a || '').toLowerCase())
          .filter(a => a && a !== 'no' && a !== 'none' && a !== 'other');
        
        if (allergyKeywords.length > 0) {
          const beforeCount = filtered.length;
          filtered = filtered.filter(product => {
            const productText = [
              product.name || '',
              product.description || '',
              product.ingredients || '',
              ...(product.tags || [])
            ].join(' ').toLowerCase();
            
            return !allergyKeywords.some(allergen => productText.includes(allergen));
          });
          hidden = beforeCount - filtered.length;
        }
      }
    }
    
    setHiddenCount(hidden);
    
    // Price filter
    if (priceRange !== 'all') {
      if (priceRange === 'under500') {
        filtered = filtered.filter(p => (p.price || p.minPrice || 0) < 500);
      } else if (priceRange === '500-1000') {
        filtered = filtered.filter(p => {
          const price = p.price || p.minPrice || 0;
          return price >= 500 && price <= 1000;
        });
      } else if (priceRange === 'over1000') {
        filtered = filtered.filter(p => (p.price || p.minPrice || 0) > 1000);
      }
    }
    
    // Search filter
    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase().trim();
      filtered = filtered.filter(p => {
        const searchText = [p.name, p.description, ...(p.tags || [])].join(' ').toLowerCase();
        return searchText.includes(searchLower);
      });
    }
    
    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => (a.price || a.minPrice || 0) - (b.price || b.minPrice || 0));
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => (b.price || b.minPrice || 0) - (a.price || a.minPrice || 0));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || b.paw_score || 0) - (a.rating || a.paw_score || 0));
    }
    
    return filtered;
  }, [products, activePet, priceRange, searchInput, sortBy]);

  // Get pet's life stage info
  const petLifeStage = useMemo(() => {
    if (!activePet) return null;
    const ageYears = activePet.age_years || activePet.age || 
      (activePet.date_of_birth ? Math.floor((Date.now() - new Date(activePet.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : null);
    if (!ageYears) return null;
    return LIFE_STAGES[getLifeStage(ageYears)];
  }, [activePet]);

  // Get category display info
  const getCategoryInfo = () => {
    const info = {
      cakes: { title: 'Birthday Cakes', moment: 'celebration', desc: 'Freshly baked for your pet\'s special day' },
      'breed-cakes': { title: 'Breed Cakes', moment: 'celebration', desc: 'Shaped like your beloved breed' },
      treats: { title: 'Treats & Rewards', moment: 'daily', desc: 'For training, walks, and everyday joy' },
      hampers: { title: 'Celebration Boxes', moment: 'celebration', desc: 'Complete party packages' },
      desi: { title: 'Desi Treats', moment: 'special', desc: 'Traditional Indian flavours, pet-safe' },
      accessories: { title: 'Celebration Gear', moment: 'celebration', desc: 'Bandanas, toys, and party essentials' },
      'frozen-treats': { title: 'Frozen Delights', moment: 'daily', desc: 'Cool treats for hot days' },
      pupcakes: { title: 'Pupcakes & Dognuts', moment: 'celebration', desc: 'Mini celebration treats' }
    };
    return info[category] || { title: 'All Products', moment: 'all', desc: 'Curated for your pet' };
  };
  
  const categoryInfo = getCategoryInfo();

  // Quick add to cart
  const handleQuickAdd = async (product, e) => {
    e.stopPropagation();
    try {
      await addToCart({
        ...product,
        quantity: 1,
        selectedSize: product.sizes?.[0] || null,
        selectedFlavor: product.flavors?.[0] || null
      });
      toast({
        title: 'Added to cart',
        description: `${product.name} added successfully`
      });
    } catch (error) {
      toast({
        title: 'Could not add',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  // Loading state - calm, not flashy
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center" data-testid="loading-state">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-stone-200 animate-pulse mx-auto flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-stone-400" />
          </div>
          <p className="text-stone-500 text-sm">Finding the perfect treats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50" data-testid="product-listing">
      <SEOHead page="products" path={location.pathname} />
      
      {/* === PET IDENTITY SECTION === */}
      {/* Identity before inventory - the system knows who we're shopping for */}
      {activePet ? (
        <div className="bg-white border-b border-stone-200" data-testid="pet-identity-section">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Pet Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {activePet.photo_url ? (
                    <img src={activePet.photo_url} alt={activePet.name} className="w-full h-full object-cover" />
                  ) : (
                    <PawPrint className="w-8 h-8 text-amber-600" />
                  )}
                </div>
                
                {/* Pet Info */}
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">
                    {categoryInfo.title} for {activePet.name}
                  </h2>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {activePet.breed || 'Dog'} • {activePet.age_years || activePet.age || '?'} years
                    {activePet.weight && ` • ${activePet.weight}kg`}
                  </p>
                  
                  {/* Allergies/Restrictions Notice */}
                  {hiddenCount > 0 && (
                    <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {hiddenCount} items hidden based on {activePet.name}'s dietary needs
                    </p>
                  )}
                </div>
              </div>
              
              {/* Pet Selector (if multiple pets) */}
              {userPets.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowPetSelector(!showPetSelector)}
                    className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1"
                    data-testid="switch-pet-btn"
                  >
                    Switch pet <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {showPetSelector && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-stone-200 py-2 min-w-[180px] z-20">
                      {userPets.map(pet => (
                        <button
                          key={pet.id || pet._id}
                          onClick={() => { setActivePet(pet); setShowPetSelector(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2 ${
                            (pet.id || pet._id) === (activePet.id || activePet._id) ? 'bg-stone-50 font-medium' : ''
                          }`}
                        >
                          <PawPrint className="w-4 h-4 text-amber-500" />
                          {pet.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Life Stage Context - Educational, not salesy */}
            {petLifeStage && (
              <div className="mt-4 p-4 bg-stone-50 rounded-lg" data-testid="life-stage-context">
                <p className="text-sm text-stone-600">
                  <span className="font-medium text-stone-800">{activePet.name}</span> is in their{' '}
                  <span className="font-medium text-stone-800">{petLifeStage.label.toLowerCase()} years</span> ({petLifeStage.ageRange}).
                  {' '}{petLifeStage.description}.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {petLifeStage.needs.slice(0, 4).map((need, i) => (
                    <span key={i} className="text-xs bg-white px-2 py-1 rounded text-stone-600 border border-stone-200">
                      {need}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Guest/No Pet Experience */
        <div className="bg-white border-b border-stone-200">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-semibold text-stone-900">{categoryInfo.title}</h1>
            <p className="text-stone-500 mt-1">{categoryInfo.desc}</p>
            
            {user && (
              <Link 
                to="/my-pets" 
                className="inline-flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 mt-4"
              >
                <PawPrint className="w-4 h-4" />
                Add your pet for personalised recommendations
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      )}
      
      {/* === TRUST SIGNALS === */}
      {/* Radical trust - transparent, calm, no dark patterns */}
      <div className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-6 text-xs text-stone-600 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              100% Pet-Safe Ingredients
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              Fresh Delivery in 6 Cities
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-purple-600" />
              Expert Help Available
            </span>
          </div>
        </div>
      </div>
      
      {/* === MAIN CONTENT === */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Filters - Clean, functional, dog-need based */}
        <div className="flex flex-wrap items-center gap-3 mb-6" data-testid="filters-section">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              data-testid="search-input"
            />
          </div>
          
          {/* City Filter */}
          <select
            value={deliveryCity}
            onChange={(e) => setDeliveryCity(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            data-testid="city-filter"
          >
            {DELIVERY_CITIES.map(city => (
              <option key={city.value} value={city.value}>
                {city.label} {city.fresh && '(Fresh)'}
              </option>
            ))}
          </select>
          
          {/* Price Filter */}
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            data-testid="price-filter"
          >
            <option value="all">All Prices</option>
            <option value="under500">Under ₹500</option>
            <option value="500-1000">₹500 - ₹1000</option>
            <option value="over1000">Over ₹1000</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            data-testid="sort-filter"
          >
            <option value="recommended">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          
          {/* Results count - subtle */}
          <span className="text-sm text-stone-500 ml-auto">
            {filteredProducts.length} items
          </span>
        </div>
        
        {/* === PRODUCT GRID === */}
        {/* 2x2 on mobile, 4 columns on desktop - calm, generous spacing */}
        {filteredProducts.length > 0 ? (
          <div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            data-testid="product-grid"
          >
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id || product._id} 
                product={product} 
                activePet={activePet}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        ) : (
          /* Empty State - Helpful, not dismissive */
          <div className="text-center py-16" data-testid="empty-state">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <PawPrint className="w-8 h-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-medium text-stone-700 mb-2">No products found</h3>
            <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
              {searchInput 
                ? `We couldn't find anything matching "${searchInput}". Try adjusting your search.`
                : 'Try adjusting your filters or browse a different category.'
              }
            </p>
            <Button
              variant="outline"
              onClick={() => { setSearchInput(''); setPriceRange('all'); setDeliveryCity('all'); }}
              className="text-sm"
            >
              Clear all filters
            </Button>
          </div>
        )}
        
        {/* === HELP SECTION === */}
        {/* Human help always visible - no anxiety */}
        <div className="mt-12 p-6 bg-white rounded-xl border border-stone-200" data-testid="help-section">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-stone-900">Need help choosing?</h3>
              <p className="text-sm text-stone-500 mt-1">
                Our pet nutrition experts are here to help you find the perfect treat.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="text-sm" data-testid="chat-expert-btn">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Expert
              </Button>
              <Button className="text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="ask-mira-btn">
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

// === PRODUCT CARD COMPONENT ===
// Calm, informative, trustworthy - not shouty
const ProductCard = ({ product, activePet, onQuickAdd }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const PLACEHOLDER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231A0A2E"/><g fill="%23D4A840" opacity="0.6"><circle cx="50" cy="56" r="15"/><circle cx="34" cy="43" r="7"/><circle cx="66" cy="43" r="7"/><circle cx="42" cy="37" r="7"/><circle cx="58" cy="37" r="7"/></g></svg>')}`;
  
  const getImage = () => {
    if (product.image && product.image.startsWith('http')) return product.image;
    if (product.images?.[0] && product.images[0].startsWith('http')) return product.images[0];
    if (product.thumbnail && product.thumbnail.startsWith('http')) return product.thumbnail;
    return PLACEHOLDER;
  };
  
  const getPrice = () => {
    if (product.minPrice) return product.minPrice;
    if (product.sizes?.length > 0) {
      const prices = product.sizes.map(s => typeof s === 'object' ? s.price : product.price).filter(p => p > 0);
      return prices.length > 0 ? Math.min(...prices) : product.price || 0;
    }
    return product.price || 0;
  };
  
  const price = getPrice();
  const hasVariants = (product.sizes?.length > 1) || (product.flavors?.length > 1);
  
  // Check if product is safe for the active pet
  const isSafeForPet = useMemo(() => {
    if (!activePet) return null;
    const allergies = activePet?.doggy_soul_answers?.food_allergies || 
                     activePet?.preferences?.allergies || 
                     activePet?.health?.allergies || [];
    if (!Array.isArray(allergies) || allergies.length === 0) return true;
    
    const productText = [product.name, product.description, product.ingredients, ...(product.tags || [])].join(' ').toLowerCase();
    const hasAllergen = allergies.some(a => a && productText.includes(a.toLowerCase()));
    return !hasAllergen;
  }, [product, activePet]);

  return (
    <div 
      className="group bg-white rounded-xl overflow-hidden border border-stone-200 hover:border-stone-300 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={() => setShowDetails(true)}
      data-testid={`product-card-${product.id || product._id}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-stone-100 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-stone-200" />
        )}
        <img
          src={getImage()}
          alt={product.name}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => { e.target.src = PLACEHOLDER; setImageLoaded(true); }}
        />
        
        {/* Safe for pet indicator - subtle, not a badge */}
        {activePet && isSafeForPet && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500/90 flex items-center justify-center" title={`Safe for ${activePet.name}`}>
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
      
      {/* Content - Clear hierarchy, no noise */}
      <div className="p-3 md:p-4 space-y-2">
        {/* Rating - Calm, not flashy */}
        {(product.paw_score || product.rating) && (
          <div className="flex items-center gap-1 text-xs text-stone-500">
            <PawPrint className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-stone-700">{(product.paw_score || product.rating * 2).toFixed(1)}</span>
            <span>/10</span>
            {(product.paw_ratings_count || product.reviews) > 0 && (
              <span className="text-stone-400">({product.paw_ratings_count || product.reviews})</span>
            )}
          </div>
        )}
        
        {/* Product Name */}
        <h3 className="font-medium text-stone-900 text-sm leading-snug line-clamp-2">
          {product.name}
        </h3>
        
        {/* Key Info - Ingredients transparency */}
        {product.ingredients && (
          <p className="text-xs text-stone-500 line-clamp-1">
            {product.ingredients.split(',').slice(0, 3).join(', ')}
          </p>
        )}
        
        {/* Price */}
        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="text-base font-semibold text-stone-900">
            {hasVariants ? 'From ' : ''}₹{price.toLocaleString('en-IN')}
          </span>
          {product.compareAtPrice && product.compareAtPrice > price && (
            <span className="text-xs text-stone-400 line-through">
              ₹{product.compareAtPrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>
        
        {/* Quick Add Button - Visible on hover (desktop) or always (mobile) */}
        <button
          onClick={(e) => onQuickAdd(product, e)}
          className="w-full mt-2 py-2 text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors md:opacity-0 md:group-hover:opacity-100"
          data-testid={`quick-add-${product.id || product._id}`}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductListing;

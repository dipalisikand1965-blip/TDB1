/**
 * ShopPage.jsx
 * 
 * Personalized shop experience for the selected pet.
 * - Pet bar showing pet's photo and name (synced with navbar)
 * - Pillar-wise products (2000+)
 * - Intelligent search dropdown like navbar
 * - Load more pagination
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
  Shield, FileText, AlertTriangle, Flower2, ShoppingBag, ChevronDown
} from 'lucide-react';

// =============================================================================
// PILLAR FILTERS - All 14 pillars
// =============================================================================
const ALL_PILLARS = [
  { id: 'all', label: 'All', icon: Sparkles, color: 'bg-gray-100' },
  { id: 'celebrate', label: 'Celebrate', icon: Cake, color: 'bg-pink-100' },
  { id: 'dine', label: 'Dine', icon: UtensilsCrossed, color: 'bg-orange-100' },
  { id: 'stay', label: 'Stay', icon: Home, color: 'bg-blue-100' },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'bg-sky-100' },
  { id: 'care', label: 'Care', icon: Stethoscope, color: 'bg-red-100' },
  { id: 'enjoy', label: 'Enjoy', icon: Sparkles, color: 'bg-yellow-100' },
  { id: 'fit', label: 'Fit', icon: Dumbbell, color: 'bg-green-100' },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: 'bg-indigo-100' },
  { id: 'paperwork', label: 'Paperwork', icon: FileText, color: 'bg-slate-100' },
  { id: 'advisory', label: 'Advisory', icon: Shield, color: 'bg-purple-100' },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'bg-red-100' },
  { id: 'farewell', label: 'Farewell', icon: Flower2, color: 'bg-violet-100' },
  { id: 'adopt', label: 'Adopt', icon: Heart, color: 'bg-rose-100' },
  { id: 'shop', label: 'Shop', icon: ShoppingBag, color: 'bg-teal-100' },
];

// =============================================================================
// PET BAR COMPONENT - Shows pet's photo synced with navbar
// =============================================================================
const PetBar = ({ pet }) => {
  if (!pet) return null;
  
  const petPhoto = pet.photo_url || pet.image_url || pet.image;
  
  return (
    <div className="bg-white border-b border-gray-100 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Pet Photo */}
          <div className="relative">
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
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          {/* Pet Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-[#2D2D2D] truncate">
              Shopping for <span className="text-[#C4785A]">{pet.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#9B9B9B]">
              {pet.breed || 'Your companion'} • Personalized recommendations
            </p>
          </div>
          
          {/* Change Pet Link */}
          <Link 
            to="/my-pets" 
            className="text-xs sm:text-sm text-[#C4785A] font-medium hover:underline hidden sm:block"
          >
            Change pet
          </Link>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// INTELLIGENT SEARCH DROPDOWN - Like navbar
// =============================================================================
const IntelligentSearch = ({ petName, products, onSelectProduct }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  
  // Filter products based on query using useMemo
  const suggestions = useMemo(() => {
    if (query.trim().length < 2) return [];
    
    const q = query.toLowerCase();
    return products
      .filter(p => 
        p.name?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t?.toLowerCase().includes(q))
      )
      .slice(0, 8)
      .map(p => ({
        type: 'product',
        id: p.id,
        name: p.title || p.name,
        image: p.image || p.image_url || p.images?.[0],
        price: p.price,
        pillar: p.primary_pillar || p.pillar || p.pillars?.[0],
        url: `/product/${p.handle || p.id}`
      }));
  }, [query, products]);
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setShowSuggestions(false);
    }
  };
  
  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B9B9B]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowSuggestions(true)}
            placeholder={petName ? `Search for ${petName}...` : "Search everything..."}
            className="pl-12 sm:pl-14 pr-12 py-4 sm:py-5 text-base bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-[#C4785A] focus:border-[#C4785A] shadow-sm"
            data-testid="shop-search"
          />
          <button 
            type="button"
            className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#C4785A] transition-colors"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </form>
      
      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[60vh] overflow-y-auto">
          {suggestions.map((item, idx) => (
            <Link
              key={idx}
              to={item.url}
              onClick={() => {
                setShowSuggestions(false);
                setQuery('');
              }}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F0E8] border-b border-gray-100 last:border-0 transition-colors"
            >
              {/* Product Image */}
              {item.image ? (
                <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
              )}
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#2D2D2D] text-sm truncate">{item.name}</p>
                <p className="text-sm font-bold text-[#C4785A]">₹{item.price?.toLocaleString()}</p>
              </div>
              
              {/* Type Badge */}
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
// PRODUCT CARD
// =============================================================================
const ProductCard = ({ product, onAddToCart, petName, isPetPick }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();
  
  const price = product.price || 0;
  const title = product.title || product.name || 'Product';
  const image = product.image || product.image_url || product.images?.[0];

  return (
    <div 
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
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
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
      onClick={() => navigate(`/services/${service.pillar}/${service.id}`)}
      data-testid={`service-card-${service.id}`}
    >
      <div className="relative aspect-[4/3] bg-gradient-to-br from-[#7A8B6F] to-[#5A6B4F] overflow-hidden">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Briefcase className="w-12 h-12 text-white/30" />
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4">
        <h3 className="font-medium text-[#2D2D2D] text-sm sm:text-base mb-1 line-clamp-2">
          {service.name}
        </h3>
        <div className="flex items-center justify-between mt-2">
          {service.base_price > 0 ? (
            <span className="text-base font-semibold text-[#2D2D2D]">
              From ₹{service.base_price?.toLocaleString()}
            </span>
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
  const [searchParams] = useSearchParams();
  
  // State
  const [allProducts, setAllProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('products');
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [displayCount, setDisplayCount] = useState(20);
  
  // Pet selection synced with navbar
  const [selectedPet, setSelectedPet] = useState(null);
  
  // Fetch ALL products from product-box
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
  
  // Fetch user's pets and sync with navbar selection
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
              // Sync with navbar's selected pet
              const savedPetId = localStorage.getItem('selectedPetId');
              const pet = savedPetId 
                ? userPets.find(p => p.id === savedPetId) || userPets[0]
                : userPets[0];
              setSelectedPet(pet);
            }
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      };
      fetchPets();
    }
  }, [token]);
  
  // Listen for pet selection changes from navbar
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selectedPetId' && pets.length > 0) {
        const pet = pets.find(p => p.id === e.newValue);
        if (pet) setSelectedPet(pet);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pets]);
  
  // Filter products by pillar
  const filteredProducts = useMemo(() => {
    if (selectedPillar === 'all') return allProducts;
    
    return allProducts.filter(p =>
      p.pillars?.includes(selectedPillar) ||
      p.primary_pillar === selectedPillar ||
      p.pillar === selectedPillar
    );
  }, [allProducts, selectedPillar]);
  
  // Products to display (with pagination)
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);
  
  // Get pet-specific picks
  const petPicks = useMemo(() => {
    if (!selectedPet?.breed) return allProducts.slice(0, 6);
    
    const breed = selectedPet.breed.toLowerCase();
    const breedPicks = allProducts.filter(p => 
      p.is_breed_specific && 
      (p.breed_metadata?.breeds?.some(b => b.toLowerCase().includes(breed)) ||
       p.name?.toLowerCase().includes(breed) ||
       p.title?.toLowerCase().includes(breed))
    ).slice(0, 6);
    
    return breedPicks.length >= 3 ? breedPicks : allProducts.slice(0, 6);
  }, [allProducts, selectedPet]);
  
  // Load more
  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 20);
  };
  
  // Handle add to cart
  const handleAddToCart = useCallback((product) => {
    addToCart({
      id: product.id,
      name: product.title || product.name,
      price: product.price,
      image: product.image || product.image_url || product.images?.[0],
      quantity: 1
    });
    toast({ title: 'Added to your bag', description: `${product.title || product.name}` });
  }, [addToCart]);

  const petName = selectedPet?.name || '';
  const hasMoreProducts = displayCount < filteredProducts.length;

  return (
    <div className="min-h-screen bg-[#F9F6F1]" data-testid="shop-page">
      <SEOHead page="shop" path="/shop" />
      
      {/* ================================================================== */}
      {/* PET BAR - Showing selected pet's photo */}
      {/* ================================================================== */}
      <PetBar pet={selectedPet} />
      
      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
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
              <>2000+ products across all pillars, curated for {petName}.</>
            ) : (
              <>2000+ products across all pillars, curated for your companion.</>
            )}
          </p>
          
          {/* Intelligent Search */}
          <IntelligentSearch 
            petName={petName} 
            products={allProducts}
            onSelectProduct={(p) => navigate(`/product/${p.handle || p.id}`)}
          />
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* PILLAR FILTERS */}
      {/* ================================================================== */}
      <section className="py-4 sm:py-6 bg-white border-y border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {ALL_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = selectedPillar === pillar.id;
              const count = pillar.id === 'all' 
                ? allProducts.length 
                : allProducts.filter(p => 
                    p.pillars?.includes(pillar.id) || 
                    p.primary_pillar === pillar.id ||
                    p.pillar === pillar.id
                  ).length;
              
              return (
                <button
                  key={pillar.id}
                  onClick={() => {
                    setSelectedPillar(pillar.id);
                    setDisplayCount(20);
                  }}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#2D2D2D] text-white shadow-md'
                      : `${pillar.color} text-[#2D2D2D] hover:shadow-md`
                  }`}
                  data-testid={`pillar-filter-${pillar.id}`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {pillar.label}
                  <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* PERSONALIZED PICKS (only if pet selected) */}
      {/* ================================================================== */}
      {petName && petPicks.length > 0 && (
        <section className="py-8 sm:py-12 bg-[#F9F6F1]" data-testid="pet-picks-section">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-[#2D2D2D]">
                {petName}&apos;s Top Picks
              </h2>
              <span className="text-sm text-[#9B9B9B]">{petPicks.length} items</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {petPicks.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  petName={petName}
                  isPetPick={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* ================================================================== */}
      {/* PRODUCTS/SERVICES TABS & GRID */}
      {/* ================================================================== */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header with tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#2D2D2D]">
                {selectedPillar === 'all' ? 'All Products' : `${ALL_PILLARS.find(p => p.id === selectedPillar)?.label || selectedPillar} Products`}
              </h2>
              <p className="text-sm text-[#9B9B9B]">
                Showing {displayedProducts.length} of {filteredProducts.length} products
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveView('products')}
                variant={activeView === 'products' ? 'default' : 'outline'}
                className={`text-sm ${activeView === 'products' ? 'bg-[#2D2D2D] text-white' : 'border-gray-200'}`}
                data-testid="tab-products"
              >
                Products ({filteredProducts.length})
              </Button>
              <Button
                onClick={() => setActiveView('services')}
                variant={activeView === 'services' ? 'default' : 'outline'}
                className={`text-sm ${activeView === 'services' ? 'bg-[#2D2D2D] text-white' : 'border-gray-200'}`}
                data-testid="tab-services"
              >
                Services ({services.length})
              </Button>
            </div>
          </div>
          
          {/* Products Grid */}
          {activeView === 'products' && (
            <>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-[#F5F5F5] rounded-2xl">
                      <div className="aspect-square bg-gray-200 rounded-t-2xl"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">No products in this pillar</h3>
                  <p className="text-[#9B9B9B] mb-4">Try selecting a different category</p>
                  <Button onClick={() => setSelectedPillar('all')} variant="outline">
                    View All Products
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {displayedProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={handleAddToCart}
                        petName={petName}
                        isPetPick={false}
                      />
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasMoreProducts && (
                    <div className="text-center mt-8">
                      <Button
                        onClick={handleLoadMore}
                        variant="outline"
                        className="px-8 py-3 text-base border-[#2D2D2D] text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-white"
                        data-testid="load-more-btn"
                      >
                        <ChevronDown className="w-5 h-5 mr-2" />
                        Load More ({filteredProducts.length - displayCount} remaining)
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
                  <p className="text-[#9B9B9B]">We&apos;re curating the best services</p>
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
      
      {/* Mira Widget */}
      <MiraChatWidget pillar="shop" />
    </div>
  );
};

export default ShopPage;

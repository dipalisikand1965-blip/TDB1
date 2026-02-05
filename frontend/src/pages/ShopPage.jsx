/**
 * ShopPage.jsx
 * 
 * Design Philosophy:
 * - Apple: Decision clarity (simple choices, clear paths)
 * - Aesop: Trust through language (caring, knowledgeable copy)
 * - Airbnb: Guided choice (personalized recommendations)
 * 
 * Core Message: "The easiest place in India to do the right thing for your dog."
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Search, Heart, Star, ChevronRight, ArrowRight, X, Package,
  PawPrint, Briefcase, MapPin, Calendar, Sparkles, CheckCircle,
  Truck, Shield, Leaf, Award, Clock, ChevronDown
} from 'lucide-react';

// =============================================================================
// DESIGN TOKENS - Aesop-inspired palette
// =============================================================================
const DESIGN = {
  colors: {
    cream: '#F7F5F0',      // Warm background
    charcoal: '#2D2D2D',   // Primary text
    sage: '#7A8B6F',       // Accent - trust
    terracotta: '#C4785A', // Accent - warmth
    stone: '#9B9B9B',      // Secondary text
  },
  spacing: {
    section: 'py-16 md:py-24',
    container: 'max-w-6xl mx-auto px-4 sm:px-6',
  }
};

// =============================================================================
// TRUST BADGES - Aesop-style language
// =============================================================================
const TRUST_BADGES = [
  { icon: Shield, text: 'Vet-approved selections', detail: 'Every product reviewed by veterinarians' },
  { icon: Leaf, text: 'Clean ingredients', detail: 'No harmful additives or fillers' },
  { icon: Truck, text: 'Free delivery over ₹499', detail: 'Careful handling, always' },
  { icon: Award, text: 'Satisfaction promise', detail: 'Not right? We\'ll make it right' },
];

// =============================================================================
// PRODUCT CARD - Apple-style clarity
// =============================================================================
const ProductCard = ({ product, onAddToCart }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();
  
  const price = product.price || 0;
  const comparePrice = product.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > price;
  const title = product.title || product.name || 'Product';
  const image = product.image || product.image_url || product.images?.[0];

  return (
    <div 
      className="group cursor-pointer"
      onClick={() => navigate(`/product/${product.handle || product.id}`)}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image Container - Clean, minimal */}
      <div className="relative aspect-square bg-[#F7F5F0] rounded-lg overflow-hidden mb-4">
        <img
          src={image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Minimal badges - only show what matters */}
        {hasDiscount && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#C4785A] text-white text-xs font-medium px-2 py-1 rounded">
              Save {Math.round((1 - price/comparePrice) * 100)}%
            </span>
          </div>
        )}
        
        {/* Wishlist - subtle */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#C4785A] text-[#C4785A]' : 'text-[#2D2D2D]'}`} />
        </button>
      </div>
      
      {/* Product Info - Clear hierarchy */}
      <div className="space-y-2">
        <h3 className="font-medium text-[#2D2D2D] text-sm sm:text-base line-clamp-2 leading-snug">
          {title}
        </h3>
        
        {/* Trust indicator - Aesop style */}
        {product.pawmeter?.overall >= 4 && (
          <p className="text-xs text-[#7A8B6F] flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Highly rated by pet parents
          </p>
        )}
        
        {/* Price - Apple clarity */}
        <div className="flex items-baseline gap-2">
          <span className="text-base sm:text-lg font-semibold text-[#2D2D2D]">
            ₹{price.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-[#9B9B9B] line-through">
              ₹{comparePrice.toLocaleString()}
            </span>
          )}
        </div>
        
        {/* Add to cart - Clean CTA */}
        <Button
          onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          variant="outline"
          className="w-full mt-2 border-[#2D2D2D] text-[#2D2D2D] hover:bg-[#2D2D2D] hover:text-white transition-colors text-sm"
          data-testid={`add-to-cart-${product.id}`}
        >
          Add to bag
        </Button>
      </div>
    </div>
  );
};

// =============================================================================
// SERVICE CARD - Airbnb guided choice
// =============================================================================
const ServiceCard = ({ service }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="group cursor-pointer"
      onClick={() => navigate(`/services/${service.pillar}/${service.id}`)}
      data-testid={`service-card-${service.id}`}
    >
      <div className="relative aspect-[4/3] bg-[#F7F5F0] rounded-lg overflow-hidden mb-4">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7A8B6F] to-[#5A6B4F]">
            <Briefcase className="w-12 h-12 text-white/40" />
          </div>
        )}
        
        {service.is_bookable && (
          <div className="absolute bottom-3 left-3">
            <span className="bg-white/95 text-[#2D2D2D] text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Instant booking
            </span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="font-medium text-[#2D2D2D] text-sm sm:text-base line-clamp-2">
          {service.name}
        </h3>
        <p className="text-xs text-[#9B9B9B] line-clamp-2">
          {service.description || 'Professional care for your companion'}
        </p>
        <div className="flex items-baseline gap-2">
          {service.base_price > 0 ? (
            <span className="text-base font-semibold text-[#2D2D2D]">
              From ₹{service.base_price?.toLocaleString()}
            </span>
          ) : service.is_free ? (
            <span className="text-base font-semibold text-[#7A8B6F]">Complimentary</span>
          ) : (
            <span className="text-sm text-[#9B9B9B]">Get a quote</span>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PERSONAL PICKS SECTION - Airbnb personalization
// =============================================================================
const PersonalPicks = ({ pets, products }) => {
  const [selectedPet, setSelectedPet] = useState(pets?.[0] || null);
  const navigate = useNavigate();
  
  // Filter products for selected pet's breed
  const recommendedProducts = useMemo(() => {
    if (!selectedPet?.breed || !products.length) return products.slice(0, 6);
    
    const breed = selectedPet.breed.toLowerCase();
    const breedSpecific = products.filter(p => 
      p.is_breed_specific && 
      (p.breed_metadata?.breeds?.some(b => b.toLowerCase().includes(breed)) ||
       p.name?.toLowerCase().includes(breed) ||
       p.title?.toLowerCase().includes(breed))
    );
    
    // If we have breed-specific products, prioritize them
    if (breedSpecific.length >= 3) {
      return breedSpecific.slice(0, 6);
    }
    
    // Otherwise, return a mix
    return [...breedSpecific, ...products.filter(p => !breedSpecific.includes(p))].slice(0, 6);
  }, [selectedPet, products]);

  if (!pets?.length) return null;

  return (
    <section className="py-12 md:py-20 bg-[#F7F5F0]" data-testid="personal-picks-section">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header - Aesop language */}
        <div className="max-w-2xl mb-10">
          <p className="text-sm text-[#7A8B6F] font-medium tracking-wide uppercase mb-3">
            Curated for {selectedPet?.name || 'your companion'}
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#2D2D2D] leading-tight mb-4">
            {selectedPet?.breed ? (
              <>Products thoughtfully selected for {selectedPet.breed}s</>
            ) : (
              <>Products we think you'll love</>
            )}
          </h2>
          <p className="text-[#9B9B9B]">
            Based on {selectedPet?.name}'s profile, dietary needs, and what other {selectedPet?.breed || 'pet'} parents trust.
          </p>
        </div>
        
        {/* Pet selector - if multiple pets */}
        {pets.length > 1 && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {pets.map(pet => (
              <button
                key={pet.id || pet.name}
                onClick={() => setSelectedPet(pet)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                  selectedPet?.id === pet.id || selectedPet?.name === pet.name
                    ? 'bg-[#2D2D2D] text-white border-[#2D2D2D]'
                    : 'bg-white text-[#2D2D2D] border-[#E5E5E5] hover:border-[#2D2D2D]'
                }`}
                data-testid={`pet-selector-${pet.name}`}
              >
                <PawPrint className="w-4 h-4" />
                <span className="text-sm font-medium">{pet.name}</span>
                {pet.breed && <span className="text-xs opacity-70">({pet.breed})</span>}
              </button>
            ))}
          </div>
        )}
        
        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {recommendedProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product}
              onAddToCart={(p) => {
                toast({ title: `${p.title || p.name} added to bag` });
              }}
            />
          ))}
        </div>
        
        {/* See all - Airbnb style */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/shop?for=' + (selectedPet?.breed || 'all'))}
            className="inline-flex items-center gap-2 text-[#2D2D2D] font-medium hover:gap-3 transition-all"
          >
            See all recommendations for {selectedPet?.name}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// MAIN SHOP PAGE
// =============================================================================
const ShopPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('products'); // products | services
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products?limit=100`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
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
        const res = await fetch(`${API_URL}/api/service-box/services?pillar=shop&limit=50`);
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
  
  // Fetch user's pets
  useEffect(() => {
    if (token) {
      const fetchPets = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPets(data.pets || []);
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      };
      fetchPets();
    }
  }, [token]);
  
  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter(p =>
        p.product_type?.toLowerCase() === selectedCategory.toLowerCase() ||
        p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        p.tags?.some(t => t?.toLowerCase().includes(selectedCategory.toLowerCase()))
      );
    }
    
    return result;
  }, [products, searchQuery, selectedCategory]);
  
  // Handle add to cart
  const handleAddToCart = useCallback((product) => {
    addToCart({
      id: product.id,
      name: product.title || product.name,
      price: product.price,
      image: product.image || product.image_url || product.images?.[0],
      quantity: 1
    });
    toast({
      title: 'Added to your bag',
      description: `${product.title || product.name}`,
    });
  }, [addToCart]);

  return (
    <div className="min-h-screen bg-white" data-testid="shop-page">
      <SEOHead page="shop" path="/shop" />
      
      {/* ================================================================== */}
      {/* HERO SECTION - Apple clarity + Aesop language */}
      {/* ================================================================== */}
      <section className="bg-[#F7F5F0] pt-8 pb-12 md:pt-12 md:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Tagline */}
          <div className="max-w-3xl">
            <p className="text-sm text-[#7A8B6F] font-medium tracking-wide uppercase mb-4">
              The Doggy Company
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-[#2D2D2D] leading-[1.1] mb-6">
              The easiest place in India to do the right thing for your dog.
            </h1>
            <p className="text-base sm:text-lg text-[#9B9B9B] leading-relaxed mb-8 max-w-xl">
              Every product here is chosen with care. Vet-approved, pet-parent trusted, 
              and backed by our promise: if it's not right for your companion, we'll make it right.
            </p>
          </div>
          
          {/* Search - Minimal, Apple-style */}
          <div className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B9B9B]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="pl-12 pr-4 py-4 text-base bg-white border-0 rounded-full shadow-sm focus:ring-2 focus:ring-[#2D2D2D]"
                data-testid="shop-search"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#2D2D2D]"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Trust badges - Aesop style */}
          <div className="mt-10 flex flex-wrap gap-6 md:gap-10">
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-[#2D2D2D]">
                <badge.icon className="w-5 h-5 text-[#7A8B6F]" />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* PERSONAL PICKS - Airbnb personalization */}
      {/* ================================================================== */}
      {pets.length > 0 && (
        <PersonalPicks pets={pets} products={products} />
      )}
      
      {/* ================================================================== */}
      {/* MAIN SHOP SECTION */}
      {/* ================================================================== */}
      <section className="py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Section header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#2D2D2D] mb-2">
                {activeView === 'products' ? 'All products' : 'Services'}
              </h2>
              <p className="text-[#9B9B9B]">
                {activeView === 'products' 
                  ? `${filteredProducts.length} carefully curated items`
                  : `${services.length} professional services`
                }
              </p>
            </div>
            
            {/* View toggle - Apple simplicity */}
            <div className="flex items-center gap-1 bg-[#F7F5F0] p-1 rounded-full">
              <button
                onClick={() => setActiveView('products')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeView === 'products'
                    ? 'bg-white text-[#2D2D2D] shadow-sm'
                    : 'text-[#9B9B9B] hover:text-[#2D2D2D]'
                }`}
                data-testid="tab-products"
              >
                Products ({filteredProducts.length})
              </button>
              <button
                onClick={() => setActiveView('services')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeView === 'services'
                    ? 'bg-white text-[#2D2D2D] shadow-sm'
                    : 'text-[#9B9B9B] hover:text-[#2D2D2D]'
                }`}
                data-testid="tab-services"
              >
                Services ({services.length})
              </button>
            </div>
          </div>
          
          {/* Products Grid */}
          {activeView === 'products' && (
            <>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-square bg-[#F7F5F0] rounded-lg mb-4"></div>
                      <div className="h-4 bg-[#F7F5F0] rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-[#F7F5F0] rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <Package className="w-16 h-16 text-[#E5E5E5] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">No products found</h3>
                  <p className="text-[#9B9B9B] mb-6">Try adjusting your search or browse all products</p>
                  <Button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    variant="outline"
                    className="border-[#2D2D2D] text-[#2D2D2D]"
                  >
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Services Grid */}
          {activeView === 'services' && (
            <>
              {services.length === 0 ? (
                <div className="text-center py-20">
                  <Briefcase className="w-16 h-16 text-[#E5E5E5] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">Services coming soon</h3>
                  <p className="text-[#9B9B9B]">We're curating the best services for your companion</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                  {services.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* PROMISE SECTION - Aesop trust */}
      {/* ================================================================== */}
      <section className="py-16 md:py-24 bg-[#2D2D2D] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-6">
            Our promise to you and your companion
          </h2>
          <p className="text-lg text-white/80 leading-relaxed mb-10 max-w-2xl mx-auto">
            Every product in our collection has been reviewed by veterinarians, tested by real pets, 
            and approved by the families who love them. If something isn't right, tell us—we'll make it right, always.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="text-center">
                <badge.icon className="w-8 h-8 mx-auto mb-3 text-[#7A8B6F]" />
                <p className="text-sm font-medium mb-1">{badge.text}</p>
                <p className="text-xs text-white/60">{badge.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Mira Widget */}
      <MiraChatWidget pillar="shop" />
    </div>
  );
};

export default ShopPage;

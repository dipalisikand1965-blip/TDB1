/**
 * ShopPage.jsx
 * 
 * Design: Personalized Pet-First Experience
 * Inspired by the reference design with pet name throughout
 * 
 * "Let's make life easier for {petName}."
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import MiraChatWidget from '../components/MiraChatWidget';
import SEOHead from '../components/SEOHead';
import {
  Search, Heart, ChevronDown, ArrowRight, X, Package,
  PawPrint, Briefcase, Shield, Truck, RotateCcw, CheckCircle
} from 'lucide-react';

// =============================================================================
// BREED PLACEHOLDER IMAGES - Beautiful stock photos by breed
// =============================================================================
const BREED_IMAGES = {
  'labrador': 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=800&q=80',
  'golden retriever': 'https://images.unsplash.com/photo-1609348490161-a879e4327ae9?w=800&q=80',
  'indie': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
  'german shepherd': 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&q=80',
  'beagle': 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&q=80',
  'pug': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&q=80',
  'shih tzu': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80',
  'pomeranian': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
  'husky': 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800&q=80',
  'default': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80'
};

// Get breed image - pet photo or beautiful breed stock
const getBreedImage = (pet) => {
  if (pet?.photo_url || pet?.image_url) {
    return pet.photo_url || pet.image_url;
  }
  const breed = pet?.breed?.toLowerCase() || 'default';
  return BREED_IMAGES[breed] || BREED_IMAGES['default'];
};

// =============================================================================
// DESIGN COLORS - Warm, inviting palette
// =============================================================================
const COLORS = {
  cream: '#F5F0E8',
  terracotta: '#C4785A',
  charcoal: '#2D2D2D',
  sage: '#7A8B6F',
  stone: '#9B9B9B',
  warmWhite: '#FDFBF7',
};

// =============================================================================
// TRUST BADGES
// =============================================================================
const TRUST_BADGES = [
  { icon: Shield, text: 'Vet Approved Advice' },
  { icon: RotateCcw, text: 'Easy Returns Anytime' },
  { icon: Truck, text: 'Free Delivery Right To Your Door' },
];

// =============================================================================
// PRODUCT CARD - With personalized "Pet's Pick" badge
// =============================================================================
const ProductCard = ({ product, onAddToCart, petName, isPetPick }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();
  
  const price = product.price || 0;
  const title = product.title || product.name || 'Product';
  const image = product.image || product.image_url || product.images?.[0];
  const description = product.description || '';

  // Personalize description with pet name
  const personalizedDesc = petName 
    ? description.replace(/your pet|your dog|your companion/gi, petName)
    : description;

  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      onClick={() => navigate(`/product/${product.handle || product.id}`)}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-[#F5F0E8] overflow-hidden">
        <img
          src={image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Pet's Pick Badge */}
        {isPetPick && petName && (
          <div className="absolute top-3 left-3">
            <span className="bg-[#C4785A] text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
              {petName}&apos;s Pick
            </span>
          </div>
        )}
        
        {/* Wishlist */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#C4785A] text-[#C4785A]' : 'text-gray-600'}`} />
        </button>
      </div>
      
      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-[#2D2D2D] text-sm sm:text-base mb-1 line-clamp-1">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#9B9B9B] mb-3 line-clamp-2">
          {personalizedDesc.slice(0, 80)}
        </p>
        
        {/* Price and Arrow */}
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-[#2D2D2D]">
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
const ServiceCard = ({ service, petName }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
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
      
      <div className="p-4">
        <h3 className="font-semibold text-[#2D2D2D] text-sm sm:text-base mb-1 line-clamp-2">
          {service.name}
        </h3>
        <p className="text-xs text-[#9B9B9B] mb-3 line-clamp-2">
          {service.description || 'Professional care for your companion'}
        </p>
        <div className="flex items-center justify-between">
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('products');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  // Pet filters
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedAge, setSelectedAge] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedEnergy, setSelectedEnergy] = useState('all');
  
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
            const userPets = data.pets || [];
            setPets(userPets);
            if (userPets.length > 0 && !selectedPet) {
              setSelectedPet(userPets[0]);
            }
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      };
      fetchPets();
    }
  }, [token]);
  
  // Filter and personalize products
  const { filteredProducts, petPicks } = useMemo(() => {
    let result = products;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    // Get pet-specific picks
    let picks = [];
    if (selectedPet?.breed) {
      const breed = selectedPet.breed.toLowerCase();
      picks = products.filter(p => 
        p.is_breed_specific && 
        (p.breed_metadata?.breeds?.some(b => b.toLowerCase().includes(breed)) ||
         p.name?.toLowerCase().includes(breed) ||
         p.title?.toLowerCase().includes(breed))
      ).slice(0, 6);
    }
    
    // If no breed-specific, get general recommendations
    if (picks.length < 3) {
      picks = products
        .filter(p => p.pawmeter?.overall >= 4 || p.rating >= 4)
        .slice(0, 6);
    }
    
    return { filteredProducts: result, petPicks: picks };
  }, [products, searchQuery, selectedPet]);
  
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

  // Pet name for personalization
  const petName = selectedPet?.name || '';
  const petBreed = selectedPet?.breed || '';
  const petAge = selectedPet?.age 
    ? `${selectedPet.age} years` 
    : (selectedPet?.dob 
        ? `${new Date().getFullYear() - new Date(selectedPet.dob).getFullYear()} years` 
        : '');

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="shop-page">
      <SEOHead page="shop" path="/shop" />
      
      {/* ================================================================== */}
      {/* HERO SECTION - Personalized */}
      {/* ================================================================== */}
      <section className="relative bg-[#F5F0E8] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left: Content */}
            <div className="flex-1 text-center lg:text-left">
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#2D2D2D] leading-tight mb-4">
                {petName ? (
                  <>Let&apos;s make life easier for <span className="text-[#C4785A]">{petName}</span>.</>
                ) : (
                  <>Let&apos;s make life easier for your companion.</>
                )}
              </h1>
              
              <p className="text-base sm:text-lg text-[#9B9B9B] mb-8">
                {petName ? (
                  <>Personalized care for <span className="text-[#C4785A] font-medium">{petName}</span> is just a click away.</>
                ) : (
                  <>Personalized care for your pet is just a click away.</>
                )}
              </p>
              
              {/* Pet Filters - Dropdowns */}
              {pets.length > 0 ? (
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 mb-6">
                  {/* Pet Selector */}
                  <Select value={selectedPet?.id || selectedPet?.name || ''} onValueChange={(v) => {
                    const pet = pets.find(p => (p.id || p.name) === v);
                    setSelectedPet(pet);
                  }}>
                    <SelectTrigger className="w-32 sm:w-36 bg-white border-gray-200 rounded-lg" data-testid="pet-selector">
                      <SelectValue placeholder="Select pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {pets.map(pet => (
                        <SelectItem key={pet.id || pet.name} value={pet.id || pet.name}>
                          {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Age */}
                  <Select value={selectedAge} onValueChange={setSelectedAge}>
                    <SelectTrigger className="w-28 sm:w-32 bg-white border-gray-200 rounded-lg">
                      <SelectValue placeholder="Age" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{petAge || 'Any age'}</SelectItem>
                      <SelectItem value="puppy">Puppy</SelectItem>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* City */}
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="w-28 sm:w-32 bg-white border-gray-200 rounded-lg">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                      <SelectItem value="gurgaon">Gurgaon</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Energy Level */}
                  <Select value={selectedEnergy} onValueChange={setSelectedEnergy}>
                    <SelectTrigger className="w-28 sm:w-36 bg-white border-gray-200 rounded-lg">
                      <SelectValue placeholder="Energy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Energy</SelectItem>
                      <SelectItem value="low">Low Energy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High Energy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                /* Search for non-logged-in users */
                <div className="max-w-md mx-auto lg:mx-0 mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="What are you looking for?"
                      className="pl-12 pr-4 py-3 bg-white border-gray-200 rounded-full"
                      data-testid="shop-search"
                    />
                  </div>
                </div>
              )}
              
              {/* CTA Button */}
              <Button
                onClick={() => document.getElementById('pet-picks')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-[#C4785A] hover:bg-[#B06A4D] text-white px-8 py-3 rounded-lg text-base font-medium shadow-sm"
                data-testid="show-selection-btn"
              >
                Show My Selection
              </Button>
            </div>
            
            {/* Right: Pet Image */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
              {/* Background paw pattern - subtle */}
              <div className="absolute inset-0 opacity-5">
                <PawPrint className="absolute top-4 left-4 w-8 h-8" />
                <PawPrint className="absolute top-12 right-8 w-6 h-6" />
                <PawPrint className="absolute bottom-8 left-12 w-10 h-10" />
              </div>
              
              {/* Pet Image - peeking from corner */}
              <div className="absolute right-0 bottom-0 w-full h-full">
                <img
                  src={getBreedImage(selectedPet)}
                  alt={petName || 'Happy dog'}
                  className="w-full h-full object-cover object-center rounded-tl-[100px]"
                  data-testid="hero-pet-image"
                />
              </div>
              
              {/* Pet name overlay */}
              {petName && (
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                  <span className="text-sm font-medium text-[#2D2D2D]">{petName}</span>
                  {petBreed && <span className="text-xs text-[#9B9B9B] ml-1">({petBreed})</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* PERSONALIZED PICKS - "For {petName}, {age}, {city}, {energy}" */}
      {/* ================================================================== */}
      <section id="pet-picks" className="py-12 md:py-16 bg-white" data-testid="pet-picks-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#2D2D2D] mb-2">
              {petName ? (
                <>For {petName}{petAge ? `, ${petAge}` : ''}{selectedCity !== 'all' ? `, ${selectedCity}` : ''}{selectedEnergy !== 'all' ? `, ${selectedEnergy.charAt(0).toUpperCase() + selectedEnergy.slice(1)} Energy` : ''}</>
              ) : (
                <>Recommended for you</>
              )}
            </h2>
            <p className="text-[#9B9B9B]">
              {petName ? `Chosen just for ${selectedPet?.gender === 'female' ? 'her' : 'him'}.` : 'Curated with care.'}
            </p>
          </div>
          
          {/* Pet Picks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {petPicks.length > 0 ? petPicks.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                petName={petName}
                isPetPick={idx < 3}
              />
            )) : (
              /* Fallback - show some products */
              products.slice(0, 6).map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  petName={petName}
                  isPetPick={idx < 3}
                />
              ))
            )}
          </div>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* TRUST BADGES */}
      {/* ================================================================== */}
      <section className="py-8 md:py-12 bg-[#FDFBF7] border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <badge.icon className="w-8 h-8 text-[#C4785A] mb-2" strokeWidth={1.5} />
                <span className="text-sm text-[#2D2D2D] font-medium">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* FOOTER MESSAGE */}
      {/* ================================================================== */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#2D2D2D] mb-2">
            Less worry, more wagging.
          </h2>
          <p className="text-lg text-[#9B9B9B]">
            Let&apos;s start with what <span className="text-[#C4785A] font-medium">{petName || 'your pet'}</span> needs.
          </p>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* ALL PRODUCTS SECTION */}
      {/* ================================================================== */}
      <section className="py-12 md:py-16 bg-[#F5F0E8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Section Header with Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#2D2D2D]">
                {activeView === 'products' ? 'All Products' : 'All Services'}
              </h2>
              <p className="text-[#9B9B9B]">
                {activeView === 'products' 
                  ? `${filteredProducts.length} carefully curated items`
                  : `${services.length} professional services`
                }
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveView('products')}
                variant={activeView === 'products' ? 'default' : 'outline'}
                className={activeView === 'products' 
                  ? 'bg-[#C4785A] hover:bg-[#B06A4D] text-white' 
                  : 'border-gray-300 text-[#2D2D2D]'
                }
                data-testid="tab-products"
              >
                Products ({filteredProducts.length})
              </Button>
              <Button
                onClick={() => setActiveView('services')}
                variant={activeView === 'services' ? 'default' : 'outline'}
                className={activeView === 'services' 
                  ? 'bg-[#C4785A] hover:bg-[#B06A4D] text-white' 
                  : 'border-gray-300 text-[#2D2D2D]'
                }
                data-testid="tab-services"
              >
                Services ({services.length})
              </Button>
            </div>
          </div>
          
          {/* Search for all products */}
          {pets.length > 0 && (
            <div className="max-w-md mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-12 pr-4 py-2.5 bg-white border-gray-200 rounded-full"
                  data-testid="shop-search"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Products Grid */}
          {activeView === 'products' && (
            <>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-white rounded-xl">
                      <div className="aspect-square bg-gray-200 rounded-t-xl"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">No products found</h3>
                  <p className="text-[#9B9B9B] mb-4">Try a different search</p>
                  <Button onClick={() => setSearchQuery('')} variant="outline">
                    Clear search
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      petName={petName}
                      isPetPick={false}
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
                <div className="text-center py-16 bg-white rounded-xl">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">Services coming soon</h3>
                  <p className="text-[#9B9B9B]">We&apos;re curating the best services</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {services.map(service => (
                    <ServiceCard key={service.id} service={service} petName={petName} />
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

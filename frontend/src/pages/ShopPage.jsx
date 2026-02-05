/**
 * ShopPage.jsx
 * 
 * Design Philosophy:
 * - Signals intelligence (known facts from Pet Soul)
 * - Syncs with navbar's selected pet
 * - Products across all 14 pillars
 * - Intelligent search "Search for {petName}..."
 * 
 * "Let's make life easier for {petName}."
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import MiraChatWidget from '../components/MiraChatWidget';
import SEOHead from '../components/SEOHead';
import {
  Search, Heart, ArrowRight, X, Package, Edit3, Mic,
  PawPrint, Briefcase, Sparkles, Cake, Stethoscope, 
  UtensilsCrossed, Plane, Dumbbell, GraduationCap, Home,
  Shield, FileText, AlertTriangle, Flower2, ShoppingBag
} from 'lucide-react';

// =============================================================================
// PILLAR FILTERS - All 14 pillars
// =============================================================================
const ALL_PILLARS = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'celebrate', label: 'Celebrate', icon: Cake },
  { id: 'dine', label: 'Dine', icon: UtensilsCrossed },
  { id: 'stay', label: 'Stay', icon: Home },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'care', label: 'Care', icon: Stethoscope },
  { id: 'enjoy', label: 'Enjoy', icon: Sparkles },
  { id: 'fit', label: 'Fit', icon: Dumbbell },
  { id: 'learn', label: 'Learn', icon: GraduationCap },
  { id: 'paperwork', label: 'Paperwork', icon: FileText },
  { id: 'advisory', label: 'Advisory', icon: Shield },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
  { id: 'farewell', label: 'Farewell', icon: Flower2 },
  { id: 'adopt', label: 'Adopt', icon: Heart },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
];

// =============================================================================
// Get pet description from Soul data
// =============================================================================
const getPetSoulDescription = (pet) => {
  if (!pet) return '';
  
  const soul = pet.soul || pet.soul_data || {};
  const answers = soul.answers || soul;
  
  // Try to build description from soul answers
  const threeWords = answers.describe_3_words;
  const nature = answers.general_nature;
  const socialPref = answers.social_preference;
  
  if (threeWords) {
    return threeWords;
  }
  
  // Fallback to nature + preference
  let desc = [];
  if (nature) desc.push(nature.toLowerCase());
  if (socialPref) desc.push(socialPref.toLowerCase().replace('being ', ''));
  
  if (desc.length > 0) {
    return `${pet.name} is ${desc.join(' and ')}`;
  }
  
  // Final fallback - use breed characteristics
  return pet.breed ? `A wonderful ${pet.breed}` : '';
};

// Get life stage from pet data
const getLifeStage = (pet) => {
  if (pet?.life_stage) return pet.life_stage;
  if (!pet?.dob && !pet?.age) return 'Adult';
  
  const age = pet?.age || (pet?.dob ? 
    Math.floor((new Date() - new Date(pet.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 2);
  
  if (age < 1) return 'Puppy';
  if (age < 7) return 'Adult';
  return 'Senior';
};

// Get energy level from soul
const getEnergyLevel = (pet) => {
  const soul = pet?.soul || pet?.soul_data || {};
  const answers = soul.answers || soul;
  
  const nature = answers?.general_nature;
  if (nature === 'Highly energetic') return 'High Energy';
  if (nature === 'Playful' || nature === 'Curious') return 'Moderate';
  if (nature === 'Calm') return 'Calm';
  
  return pet?.energy_level || 'Moderate';
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
// EDIT PROFILE MODAL
// =============================================================================
const EditProfileModal = ({ open, onClose, pets, selectedPet, onSelectPet, filters, onUpdateFilters }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Pet</label>
            <Select value={selectedPet?.id || ''} onValueChange={(v) => {
              const pet = pets.find(p => p.id === v);
              onSelectPet(pet);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select pet" />
              </SelectTrigger>
              <SelectContent>
                {pets.map(pet => (
                  <SelectItem key={pet.id} value={pet.id}>
                    {pet.name} ({pet.breed || 'Unknown breed'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Life Stage</label>
            <Select value={filters.lifeStage} onValueChange={(v) => onUpdateFilters({...filters, lifeStage: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Puppy">Puppy</SelectItem>
                <SelectItem value="Adult">Adult</SelectItem>
                <SelectItem value="Senior">Senior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
            <Select value={filters.city} onValueChange={(v) => onUpdateFilters({...filters, city: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Gurgaon">Gurgaon</SelectItem>
                <SelectItem value="Hyderabad">Hyderabad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Energy Level</label>
            <Select value={filters.energy} onValueChange={(v) => onUpdateFilters({...filters, energy: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Calm">Calm</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="High Energy">High Energy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={onClose} className="w-full bg-[#C4785A] hover:bg-[#B06A4D]">
          Save Changes
        </Button>
      </DialogContent>
    </Dialog>
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
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('products');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedPillar, setSelectedPillar] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Pet selection synced with navbar via localStorage
  const [selectedPet, setSelectedPet] = useState(null);
  const [filters, setFilters] = useState({
    lifeStage: 'Adult',
    city: 'Bangalore',
    energy: 'Moderate'
  });
  
  // Fetch products from all pillars
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch from product-box which has all pillar products
        const res = await fetch(`${API_URL}/api/product-box/products?limit=200`);
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
        const res = await fetch(`${API_URL}/api/service-box/services?limit=100`);
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
              // Sync with navbar's selected pet via localStorage
              const savedPetId = localStorage.getItem('selectedPetId');
              const savedPet = savedPetId ? userPets.find(p => p.id === savedPetId) : null;
              const pet = savedPet || userPets[0];
              
              setSelectedPet(pet);
              
              // Set filters from pet's soul data
              setFilters({
                lifeStage: getLifeStage(pet),
                city: pet.city || 'Bangalore',
                energy: getEnergyLevel(pet)
              });
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
        if (pet) {
          setSelectedPet(pet);
          setFilters({
            lifeStage: getLifeStage(pet),
            city: pet.city || filters.city,
            energy: getEnergyLevel(pet)
          });
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pets, filters.city]);
  
  // Filter products
  const { filteredProducts, petPicks } = useMemo(() => {
    let result = products;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some(t => t?.toLowerCase().includes(query))
      );
    }
    
    if (selectedPillar && selectedPillar !== 'all') {
      result = result.filter(p =>
        p.pillars?.includes(selectedPillar) ||
        p.primary_pillar === selectedPillar ||
        p.pillar === selectedPillar
      );
    }
    
    // Get pet-specific picks based on breed
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
    
    if (picks.length < 3) {
      picks = products
        .filter(p => p.pawmeter?.overall >= 4 || p.rating >= 4)
        .slice(0, 6);
    }
    
    return { filteredProducts: result, petPicks: picks };
  }, [products, searchQuery, selectedPillar, selectedPet]);
  
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
  
  // Handle pet selection and sync with navbar
  const handlePetSelect = (pet) => {
    setSelectedPet(pet);
    if (pet) {
      localStorage.setItem('selectedPetId', pet.id);
      localStorage.setItem('selectedPetName', pet.name || '');
      localStorage.setItem('selectedPetBreed', pet.breed || '');
      setFilters({
        lifeStage: getLifeStage(pet),
        city: pet.city || filters.city,
        energy: getEnergyLevel(pet)
      });
    }
  };

  // Pet info
  const petName = selectedPet?.name || '';
  const petBreed = selectedPet?.breed || '';
  const petPhoto = selectedPet?.photo_url || selectedPet?.image_url || selectedPet?.image;
  const petSoulDesc = getPetSoulDescription(selectedPet);
  const lifeStage = filters.lifeStage;
  const city = filters.city;
  const energy = filters.energy;

  return (
    <div className="min-h-screen bg-[#F9F6F1]" data-testid="shop-page">
      <SEOHead page="shop" path="/shop" />
      
      {/* ================================================================== */}
      {/* HERO SECTION */}
      {/* ================================================================== */}
      <section className="relative bg-[#F9F6F1] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 lg:py-20">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
            
            {/* Left: Content */}
            <div className="flex-1 text-center lg:text-left w-full">
              {/* Main Headline - Synced with navbar pet name */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-[#2D2D2D] leading-[1.1] mb-4 sm:mb-6">
                Let&apos;s make life easier<br className="hidden sm:block" />
                for <span className="text-[#C4785A]">{petName || 'your companion'}</span>.
              </h1>
              
              {/* Subline */}
              <p className="text-base sm:text-lg md:text-xl text-[#6B6B6B] mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                {petName ? (
                  <>We&apos;ve curated what <span className="text-[#C4785A] font-medium">{petName}</span> needs right now.<br className="hidden sm:block" />You can adjust this anytime.</>
                ) : (
                  <>We&apos;ve curated what your pet needs right now.<br className="hidden sm:block" />You can adjust this anytime.</>
                )}
              </p>
              
              {/* Known Facts Display */}
              {selectedPet && (
                <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 sm:px-6 py-3 sm:py-4 shadow-sm mb-6 sm:mb-8">
                  <span className="text-sm sm:text-base text-[#2D2D2D]">
                    <span className="font-medium">{petName}</span>
                    <span className="mx-2 text-[#D4D4D4]">·</span>
                    <span>{lifeStage}</span>
                    <span className="mx-2 text-[#D4D4D4]">·</span>
                    <span>{city}</span>
                    <span className="mx-2 text-[#D4D4D4]">·</span>
                    <span>{energy}</span>
                  </span>
                  <button 
                    onClick={() => setShowEditModal(true)}
                    className="text-[#C4785A] font-medium text-sm sm:text-base hover:text-[#A66548] transition-colors ml-2"
                    data-testid="edit-profile-btn"
                  >
                    Edit
                  </button>
                </div>
              )}
              
              {/* CTA Button */}
              <div>
                <Button
                  onClick={() => document.getElementById('pet-picks')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[#C4785A] hover:bg-[#B06A4D] text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl text-base sm:text-lg font-medium shadow-md hover:shadow-lg transition-all"
                  data-testid="see-needs-btn"
                >
                  See what {petName || 'your pet'} needs
                </Button>
              </div>
            </div>
            
            {/* Right: Pet's Actual Photo */}
            <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg">
              {/* Profile Created Label */}
              {petName && (
                <div className="absolute -top-2 right-4 sm:right-8 z-10">
                  <span className="text-xs sm:text-sm text-[#9B9B9B] italic">Profile created for {petName}</span>
                </div>
              )}
              
              {/* Pet's Actual Photo */}
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl bg-[#E8E4DD]">
                {petPhoto ? (
                  <img
                    src={petPhoto}
                    alt={petName || 'Your pet'}
                    className="w-full h-full object-cover"
                    data-testid="hero-pet-image"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#9B9B9B]">
                    <PawPrint className="w-16 h-16 mb-4 opacity-50" />
                    <p className="text-sm">Add a photo of {petName || 'your pet'}</p>
                  </div>
                )}
                
                {/* Name Badge on Image */}
                {petName && (
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg inline-block">
                      <span className="font-semibold text-[#2D2D2D]">{petName}</span>
                      {petBreed && <span className="text-[#C4785A] ml-1">({petBreed})</span>}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Soul Description from Pet Data */}
              {petSoulDesc && (
                <p className="text-center text-sm sm:text-base text-[#6B6B6B] mt-4 italic">
                  {petSoulDesc}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* INTELLIGENT SEARCH BAR - Like navbar */}
      {/* ================================================================== */}
      <section className="py-6 sm:py-8 bg-white border-y border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9B9B9B]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={petName ? `Search for ${petName}...` : "Search products, services..."}
              className="pl-12 sm:pl-14 pr-12 py-4 sm:py-5 text-base sm:text-lg bg-[#F5F5F5] border-0 rounded-full focus:ring-2 focus:ring-[#C4785A]"
              data-testid="shop-search"
            />
            <button className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#C4785A] transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* PILLAR FILTERS - All 14 pillars */}
      {/* ================================================================== */}
      <section className="py-4 sm:py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {ALL_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = selectedPillar === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => setSelectedPillar(pillar.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#2D2D2D] text-white shadow-md'
                      : 'bg-[#F5F5F5] text-[#6B6B6B] hover:bg-[#EBEBEB]'
                  }`}
                  data-testid={`pillar-filter-${pillar.id}`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {pillar.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* ================================================================== */}
      {/* PERSONALIZED PICKS */}
      {/* ================================================================== */}
      <section id="pet-picks" className="py-10 sm:py-12 md:py-16 bg-[#F9F6F1]" data-testid="pet-picks-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#2D2D2D] mb-2">
              {petName ? `For ${petName}` : 'Recommended for you'}
            </h2>
            <p className="text-[#9B9B9B] text-base sm:text-lg">
              {petName ? `Chosen just for ${selectedPet?.gender === 'female' ? 'her' : 'him'}.` : 'Curated with care.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {petPicks.length > 0 ? petPicks.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                petName={petName}
                isPetPick={idx < 3}
              />
            )) : (
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
      {/* ALL PRODUCTS/SERVICES SECTION */}
      {/* ================================================================== */}
      <section className="py-10 sm:py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#2D2D2D]">
                {activeView === 'products' ? 'All Products' : 'All Services'}
              </h2>
              <p className="text-[#9B9B9B] text-sm sm:text-base">
                {activeView === 'products' 
                  ? `${filteredProducts.length} items across all pillars`
                  : `${services.length} services`
                }
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveView('products')}
                variant={activeView === 'products' ? 'default' : 'outline'}
                className={`text-sm sm:text-base ${activeView === 'products' 
                  ? 'bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white' 
                  : 'border-gray-200 text-[#6B6B6B]'
                }`}
                data-testid="tab-products"
              >
                Products
              </Button>
              <Button
                onClick={() => setActiveView('services')}
                variant={activeView === 'services' ? 'default' : 'outline'}
                className={`text-sm sm:text-base ${activeView === 'services' 
                  ? 'bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white' 
                  : 'border-gray-200 text-[#6B6B6B]'
                }`}
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
                    <div key={i} className="animate-pulse bg-[#F5F5F5] rounded-2xl">
                      <div className="aspect-square bg-gray-200 rounded-t-2xl"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">No products found</h3>
                  <p className="text-[#9B9B9B] mb-4">Try a different search or category</p>
                  <Button onClick={() => { setSearchQuery(''); setSelectedPillar('all'); }} variant="outline">
                    Clear filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
      
      {/* Edit Profile Modal */}
      <EditProfileModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        pets={pets}
        selectedPet={selectedPet}
        onSelectPet={handlePetSelect}
        filters={filters}
        onUpdateFilters={setFilters}
      />
      
      {/* Mira Widget */}
      <MiraChatWidget pillar="shop" />
    </div>
  );
};

export default ShopPage;

/**
 * CelebrateNewPage.jsx - GOLD STANDARD SANDBOX
 * 
 * Single consolidated page for all Celebrate content
 * Tab-based navigation with dynamic content loading
 * 
 * URL: /celebrate-new?category={tab}
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Cake, Gift, Heart, Sparkles, PartyPopper, Crown, Star,
  ChevronRight, MapPin, SlidersHorizontal, X, Check,
  Loader2, ShoppingBag, PawPrint, Camera, Package
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import PersonalizedPicks from '../components/PersonalizedPicks';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import OccasionBoxBuilder from '../components/OccasionBoxBuilder';
import PartyPlanningWizard from '../components/PartyPlanningWizard';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import MiraChatWidget from '../components/MiraChatWidget';
import SEOHead from '../components/SEOHead';
import { toast } from 'sonner';

// ============================================
// CATEGORY TABS CONFIGURATION
// ============================================
const CATEGORY_TABS = [
  { id: 'all', name: 'All Celebrate', emoji: '✨', color: 'from-purple-500 to-pink-500' },
  { id: 'cakes', name: 'Birthday Cakes', emoji: '🎂', color: 'from-pink-500 to-rose-500' },
  { id: 'breed-cakes', name: 'Breed Cakes', emoji: '❤️', color: 'from-purple-500 to-violet-500' },
  { id: 'pupcakes', name: 'Pupcakes & Dognuts', emoji: '✨', color: 'from-amber-500 to-orange-500' },
  { id: 'treats', name: 'Treats', emoji: '🎁', color: 'from-green-500 to-emerald-500' },
  { id: 'hampers', name: 'Gift Hampers', emoji: '🛍️', color: 'from-blue-500 to-cyan-500' },
  { id: 'accessories', name: 'Party Accessories', emoji: '🎉', color: 'from-rose-500 to-pink-500' },
];

// Category to DB category mapping
const CATEGORY_DB_MAP = {
  'all': null,
  'cakes': 'cakes',
  'breed-cakes': 'breed-cakes',
  'pupcakes': 'dognuts',
  'treats': 'treats',
  'hampers': 'hampers',
  'accessories': ['party_accessories', 'party_kits', 'party_decorations', 'party_tableware', 'party_supplies', 'party_toys', 'party_hats'],
};

// Tab-specific hero content
const TAB_HERO_CONTENT = {
  'all': { title: 'Celebrations for', highlight: 'Your Pet', subtitle: 'Mark the moments that matter to your furry friend' },
  'cakes': { title: 'Birthday Cakes', highlight: 'Made with Joy', subtitle: 'Freshly baked, 100% pet-safe cakes for your furry friend\'s special day' },
  'breed-cakes': { title: 'Breed-Specific', highlight: 'Cakes', subtitle: 'Cakes shaped like your beloved breed - from Labradors to Pugs!' },
  'pupcakes': { title: 'Pupcakes &', highlight: 'Dognuts', subtitle: 'Adorable mini baked treats - cupcakes and donuts for dogs!' },
  'treats': { title: 'Treats &', highlight: 'Snacks', subtitle: 'Training treats, healthy bites, and everyday rewards' },
  'hampers': { title: 'Celebration', highlight: 'Hampers', subtitle: 'Complete party boxes with cakes, treats, bandanas, and toys!' },
  'accessories': { title: 'Party', highlight: 'Accessories', subtitle: 'Bandanas, hats, toys and everything for your pet\'s party!' },
};

// Available breeds for breed filter
const BREED_OPTIONS = [
  'All Breeds', 'Labrador', 'Golden Retriever', 'Pug', 'Beagle', 'Husky', 
  'German Shepherd', 'Shih Tzu', 'Bulldog', 'Poodle', 'Rottweiler', 
  'Dachshund', 'Boxer', 'Doberman', 'Great Dane', 'Chihuahua', 
  'Corgi', 'Dalmatian', 'Pomeranian', 'Indie', 'Spitz'
];

// City options for delivery filter
const CITY_OPTIONS = [
  { value: 'all', label: 'All Cities' },
  { value: 'bangalore', label: '🏙️ Bangalore' },
  { value: 'mumbai', label: '🏙️ Mumbai' },
  { value: 'delhi', label: '🏙️ Delhi NCR' },
  { value: 'pan-india', label: '📦 Pan-India' },
];

// Occasion box types
const OCCASION_BOX_TYPES = [
  { id: 'birthday', name: 'Birthday Box', emoji: '🎂', color: 'bg-pink-100 text-pink-600' },
  { id: 'gotcha_day', name: 'Gotcha Day Box', emoji: '🐾', color: 'bg-purple-100 text-purple-600' },
  { id: 'graduation', name: 'Graduation Box', emoji: '🎓', color: 'bg-yellow-100 text-yellow-600' },
  { id: 'party', name: 'Party Box', emoji: '🎉', color: 'bg-blue-100 text-blue-600' },
];

// ============================================
// MAIN COMPONENT
// ============================================
const CelebrateNewPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  // Core state
  const [selectedTab, setSelectedTab] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPets, setUserPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('all');
  const [deliveryCity, setDeliveryCity] = useState('all');
  const [selectedBreed, setSelectedBreed] = useState('All Breeds');
  const [selectedShape, setSelectedShape] = useState('all');
  
  // Modal states
  const [showBoxBuilder, setShowBoxBuilder] = useState(false);
  const [boxOccasion, setBoxOccasion] = useState('birthday');
  const [showPartyWizard, setShowPartyWizard] = useState(false);
  
  // Read category from URL on mount
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && CATEGORY_TABS.find(t => t.id === categoryFromUrl)) {
      setSelectedTab(categoryFromUrl);
    }
  }, []);
  
  // Update URL when tab changes
  const handleTabChange = (tabId) => {
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
    // Scroll to products
    setTimeout(() => {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
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
  }, [selectedTab, deliveryCity]);
  
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/products?pillar=celebrate&limit=200`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        let allProducts = data.products || data || [];
        
        // Filter by category based on selected tab
        if (selectedTab !== 'all') {
          const dbCategory = CATEGORY_DB_MAP[selectedTab];
          
          if (Array.isArray(dbCategory)) {
            // For accessories - match any of the party_ categories
            allProducts = allProducts.filter(p => 
              dbCategory.some(cat => (p.category || '').toLowerCase().includes(cat.replace('party_', 'party')))
            );
          } else if (dbCategory) {
            // Exact category match
            allProducts = allProducts.filter(p => 
              (p.category || '').toLowerCase() === dbCategory.toLowerCase()
            );
          }
        }
        
        setProducts(allProducts);
        console.log(`[CelebrateNew] Loaded ${allProducts.length} products for tab: ${selectedTab}`);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Apply client-side filters
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
    
    // Price filter
    if (priceRange === 'under500') {
      filtered = filtered.filter(p => (p.price || 0) < 500);
    } else if (priceRange === '500-1000') {
      filtered = filtered.filter(p => (p.price || 0) >= 500 && (p.price || 0) <= 1000);
    } else if (priceRange === 'over1000') {
      filtered = filtered.filter(p => (p.price || 0) > 1000);
    }
    
    return filtered;
  }, [products, searchQuery, selectedBreed, priceRange, selectedTab]);
  
  const filteredProducts = getFilteredProducts();
  const heroContent = TAB_HERO_CONTENT[selectedTab] || TAB_HERO_CONTENT['all'];
  const currentTabConfig = CATEGORY_TABS.find(t => t.id === selectedTab);
  
  // Open box builder with specific occasion
  const openBoxBuilder = (occasion) => {
    setBoxOccasion(occasion);
    setShowBoxBuilder(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SEOHead title="Celebrate - The Doggy Company" path="/celebrate-new" />
      
      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className={`relative bg-gradient-to-br ${currentTabConfig?.color || 'from-purple-600 to-pink-500'} text-white overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Pet Photo (if logged in) */}
            {activePet && (
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
                  <img 
                    src={activePet.photo_url || `https://api.dicebear.com/7.x/lorelei/svg?seed=${activePet.name}`}
                    alt={activePet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            <div className="text-center lg:text-left flex-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2">
                {heroContent.title}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                  {activePet ? activePet.name : heroContent.highlight}
                </span>
              </h1>
              <p className="text-white/80 text-base sm:text-lg max-w-xl">
                {heroContent.subtitle}
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* ============================================ */}
      {/* STICKY CATEGORY TABS */}
      {/* ============================================ */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center px-4 py-3 gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-all ${
                  selectedTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <span>{tab.emoji}</span>
                <span className="whitespace-nowrap">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* ============================================ */}
      {/* PERSONALIZED PICKS ROW */}
      {/* ============================================ */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <PersonalizedPicks 
          pillar="celebrate" 
          category={selectedTab !== 'all' ? selectedTab : undefined}
          maxProducts={6} 
        />
      </div>
      
      {/* ============================================ */}
      {/* TAB: ALL - CONCIERGE EXPERIENCES */}
      {/* ============================================ */}
      {selectedTab === 'all' && (
        <>
          {/* Concierge Experience Cards */}
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="text-center mb-8">
              <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1 mb-3">
                <Crown className="w-3 h-3 mr-1 inline" /> Elevated Concierge®
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Celebrations, Perfected
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
                More than cakes. Our Celebrate Concierge® orchestrates every detail.
              </p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[
                { title: 'Ultimate Birthday Bash®', icon: '🎉', gradient: 'from-pink-500 to-rose-500', badge: 'Signature' },
                { title: 'Gotcha Day Special®', icon: '💜', gradient: 'from-purple-500 to-violet-500' },
                { title: 'Pawty Planning Pro®', icon: '🎈', gradient: 'from-amber-500 to-orange-500', badge: 'Popular' },
                { title: 'Puppy Shower®', icon: '🐾', gradient: 'from-cyan-500 to-teal-500' },
                { title: 'Pet Wedding®', icon: '💒', gradient: 'from-rose-400 to-pink-500' },
                { title: 'Milestone Moments®', icon: '📸', gradient: 'from-indigo-500 to-purple-500' },
              ].map((exp, idx) => (
                <Card 
                  key={idx}
                  className={`p-4 sm:p-6 bg-gradient-to-br ${exp.gradient} text-white cursor-pointer hover:scale-[1.02] transition-transform`}
                  onClick={() => setShowPartyWizard(true)}
                >
                  {exp.badge && (
                    <Badge className="bg-white/20 text-white text-xs mb-2">{exp.badge}</Badge>
                  )}
                  <div className="text-3xl mb-2">{exp.icon}</div>
                  <h3 className="font-bold text-sm sm:text-base">{exp.title}</h3>
                </Card>
              ))}
            </div>
          </div>
          
          {/* How Concierge Works */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 py-10">
            <div className="max-w-6xl mx-auto px-4">
              <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-8">
                How Celebrate Concierge® Works
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                {[
                  { step: 1, icon: '💬', title: 'Share Vision', desc: 'Tell us your dreams' },
                  { step: 2, icon: '✨', title: 'We Plan', desc: 'Custom celebration' },
                  { step: 3, icon: '🎯', title: 'We Execute', desc: 'Every detail handled' },
                  { step: 4, icon: '🎉', title: 'Celebrate!', desc: 'Stress-free magic' }
                ].map((item) => (
                  <Card key={item.step} className="p-4 text-center bg-white">
                    <div className="w-10 h-10 mx-auto mb-3 bg-pink-100 rounded-full flex items-center justify-center text-xl">
                      {item.icon}
                    </div>
                    <div className="text-pink-500 font-bold text-xs mb-1">Step {item.step}</div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          
          {/* Occasion Box Builder Entry */}
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                🎁 Build Your Occasion Box
              </h2>
              <p className="text-gray-600 text-sm">Pick a box type and customize it!</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {OCCASION_BOX_TYPES.map((box) => (
                <Card 
                  key={box.id}
                  className={`p-4 text-center cursor-pointer hover:shadow-lg transition-shadow ${box.color}`}
                  onClick={() => openBoxBuilder(box.id)}
                  data-testid={`box-${box.id}`}
                >
                  <div className="text-3xl mb-2">{box.emoji}</div>
                  <h3 className="font-semibold text-sm">{box.name}</h3>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
      
      {/* ============================================ */}
      {/* TAB: BREED CAKES - BREED SELECTOR */}
      {/* ============================================ */}
      {selectedTab === 'breed-cakes' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-purple-500" />
              Find a cake shaped like your breed!
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {BREED_OPTIONS.map((breed) => (
                <button
                  key={breed}
                  onClick={() => setSelectedBreed(breed)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedBreed === breed
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {breed}
                </button>
              ))}
            </div>
            {activePet?.breed && (
              <p className="text-xs text-purple-600 mt-2">
                ✨ Auto-selected based on {activePet.name}'s breed
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* ============================================ */}
      {/* TAB: HAMPERS - BOX BUILDER CTA */}
      {/* ============================================ */}
      {selectedTab === 'hampers' && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">
                  🎁 Build Your Own Hamper
                </h3>
                <p className="text-gray-600 text-sm">
                  Create a custom celebration box with cakes, treats, and accessories!
                </p>
              </div>
              <Button 
                onClick={() => openBoxBuilder('birthday')}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
              >
                <Package className="w-4 h-4 mr-2" />
                Build a Box
              </Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* ============================================ */}
      {/* FILTERS BAR */}
      {/* ============================================ */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-medium text-sm">Filters:</span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 sm:w-40 h-9 text-sm pl-8"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* City filter - for cakes */}
          {['cakes', 'breed-cakes', 'all'].includes(selectedTab) && (
            <select
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              className="h-9 px-3 text-sm border rounded-lg bg-white"
            >
              {CITY_OPTIONS.map(city => (
                <option key={city.value} value={city.value}>{city.label}</option>
              ))}
            </select>
          )}
          
          {/* Price filter */}
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="h-9 px-3 text-sm border rounded-lg bg-white"
          >
            <option value="all">All Prices</option>
            <option value="under500">Under ₹500</option>
            <option value="500-1000">₹500 - ₹1000</option>
            <option value="over1000">Over ₹1000</option>
          </select>
          
          {/* Clear filters */}
          {(searchQuery || priceRange !== 'all' || deliveryCity !== 'all' || selectedBreed !== 'All Breeds') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setPriceRange('all');
                setDeliveryCity('all');
                setSelectedBreed('All Breeds');
              }}
              className="text-gray-500 text-xs"
            >
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>
      
      {/* ============================================ */}
      {/* PRODUCTS GRID */}
      {/* ============================================ */}
      <div className="max-w-6xl mx-auto px-4 py-6" id="products-section">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {CATEGORY_TABS.find(t => t.id === selectedTab)?.name || 'All Products'}
            </h2>
            <p className="text-gray-600 text-sm">
              {loading ? 'Loading...' : `Showing ${filteredProducts.length} items`}
            </p>
          </div>
          {selectedTab !== 'all' && (
            <Button variant="outline" size="sm" onClick={() => handleTabChange('all')}>
              Show All
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Cake className="w-12 h-12 text-pink-300 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 text-sm mb-4">Try adjusting your filters or selecting a different category.</p>
            <Button onClick={() => handleTabChange('all')}>View All Products</Button>
          </Card>
        )}
      </div>
      
      {/* ============================================ */}
      {/* TAB: ALL - SERVICE CATALOG */}
      {/* ============================================ */}
      {selectedTab === 'all' && (
        <ServiceCatalogSection 
          pillar="celebrate"
          title="Celebrate Services"
          subtitle="See personalized pricing based on your city and pet"
          maxServices={8}
        />
      )}
      
      {/* ============================================ */}
      {/* BOTTOM CTA */}
      {/* ============================================ */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to Plan the Pawfect Celebration?
          </h2>
          <p className="text-pink-100 mb-6">
            Let our Celebrate Concierge® create an unforgettable experience.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button 
              size="lg"
              className="bg-white text-pink-600 hover:bg-pink-50"
              onClick={() => setShowPartyWizard(true)}
            >
              <PartyPopper className="w-5 h-5 mr-2" />
              Plan My Party
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/20"
              onClick={() => openBoxBuilder('birthday')}
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
      
      {/* Mira Chat Widget */}
      <MiraChatWidget pillar="celebrate" />
    </div>
  );
};

export default CelebrateNewPage;

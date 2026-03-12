import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  UtensilsCrossed, MapPin, Search, Filter, Star, Clock, 
  Dog, Cat, ChevronRight, ChevronDown, ChevronLeft, Phone, Globe, Instagram,
  Utensils, Coffee, Pizza, Leaf, Heart, Check, X, AlertCircle,
  Sparkles, ShoppingBag, Truck, Users, Calendar, MessageCircle, Send,
  Bell, Gift, Cake, User, Mail, Package, Percent, PartyPopper,
  Crown, Wine, ChefHat, Trees, Loader2, Navigation
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import ProductCard from '../components/ProductCard';
import DiningConciergePicker from '../components/DiningConciergePicker';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import PersonalizedPicks from '../components/PersonalizedPicks';
import ConciergePickCard, { CONCIERGE_PRESETS } from '../components/ConciergePickCard';
import PillarPicksSection from '../components/PillarPicksSection';
import { getSoulBasedReason } from '../utils/petSoulInference';
import PillarPageLayout from '../components/PillarPageLayout';
import { ConciergeButton } from '../components/mira-os';
import { ChecklistDownloadButton } from '../components/checklists';
import CuratedConciergeSection from '../components/Mira/CuratedConciergeSection';
import NearbyPlacesCarousel from '../components/NearbyPlacesCarousel';
import { usePillarContext } from '../context/PillarContext';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import FreshMealsTab from '../components/dine/FreshMealsTab';
import MapModal from '../components/MapModal';
import PersonalizedDineSection from '../components/dine/PersonalizedDineSection';
import TummyProfileDashboard from '../components/dine/TummyProfileDashboard';
import SafeForPetBadge from '../components/dine/SafeForPetBadge';
import TasteTestFeature from '../components/dine/TasteTestFeature';
import SoulMadeCollection from '../components/SoulMadeCollection';
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import MiraCuratedLayer from '../components/Mira/MiraCuratedLayer';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';

// Get user from AuthContext or localStorage
const getUser = () => {
  try {
    // Try to get from localStorage user key first (for backward compatibility)
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch {
    return null;
  }
};

// Dine Category Cards - New Structure
const dineCategories = [
  { 
    id: 'fresh-meals', 
    name: 'Fresh Meals', 
    icon: Truck, 
    description: 'Vet-formulated fresh food delivered', 
    path: '/dine/meals',
    gradient: 'from-green-500 to-emerald-600',
    badge: 'Gold Standard'
  },
  { 
    id: 'treats', 
    name: 'Treats', 
    icon: Heart, 
    description: 'Healthy treats & chews', 
    path: '/celebrate/treats',
    gradient: 'from-pink-500 to-rose-500'
  },
  { 
    id: 'frozen', 
    name: 'Frozen', 
    icon: Sparkles, 
    description: 'Frozen meals & toppers', 
    path: '/celebrate/treats', // Temporary redirect
    gradient: 'from-blue-500 to-cyan-500',
    badge: 'Coming Soon'
  },
  { 
    id: 'feeding-tools', 
    name: 'Feeding Tools', 
    icon: Utensils, 
    description: 'Bowls, feeders & accessories', 
    path: '/dine?section=essentials&category=feeding-tools',
    gradient: 'from-orange-500 to-amber-500'
  },
  { 
    id: 'supplements', 
    name: 'Supplements', 
    icon: Leaf, 
    description: 'Vitamins & nutritional support', 
    path: '/dine?section=essentials&category=supplements',
    gradient: 'from-purple-500 to-violet-500'
  },
];

const DinePage = () => {
  const { addToCart } = useCart();
  const { user: authUser, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Tab state - Read from URL params (supports both 'tab' and 'category' for different navigation patterns)
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab');
    const categoryFromUrl = searchParams.get('category');
    // Map category param to tab name
    if (categoryFromUrl === 'feeding-tools') return 'feeding-tools';
    if (categoryFromUrl === 'supplements') return 'supplements';
    return tabFromUrl || 'all';
  });
  
  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId || 'all');
    if (tabId && tabId !== 'all') {
      navigate(`/dine?tab=${tabId}`, { replace: true });
    } else {
      navigate('/dine', { replace: true });
    }
  };
  
  // Listen for URL changes (for category param from card links)
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const tabFromUrl = searchParams.get('tab');
    if (categoryFromUrl === 'feeding-tools') {
      setActiveTab('feeding-tools');
    } else if (categoryFromUrl === 'supplements') {
      setActiveTab('supplements');
    } else if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
    // Scroll to essentials section if section param is present
    if (searchParams.get('section') === 'essentials') {
      setTimeout(() => {
        const essentialsSection = document.querySelector('[data-testid="dine-essentials-section"]');
        if (essentialsSection) {
          essentialsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [searchParams]);
  
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [petMenuFilter, setPetMenuFilter] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuddyModal, setShowBuddyModal] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [restaurantsToShow, setRestaurantsToShow] = useState(6); // Show only 6 initially
  const [productsToShow, setProductsToShow] = useState(15); // 3 rows x 5 columns
  const [heroIndex, setHeroIndex] = useState(0);
  const [essentialsFilter, setEssentialsFilter] = useState('all'); // Filter for Dine Essentials section
  
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/dine/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Meals {petName} will love",
    subtitle: 'Fresh food, treats, nutrition plans & dietary guidance',
    askMira: {
      enabled: true,
      placeholder: "Best food for puppies... homemade treats recipe",
      buttonColor: 'bg-orange-500'
    },
    sections: {
      askMira: { enabled: true },
      miraPrompts: { enabled: true },
      categories: { enabled: true },
      bundles: { enabled: true },
      products: { enabled: true },
      conciergeServices: { enabled: true },
      personalized: { enabled: true }
    }
  });
  const [cmsCategories, setCmsCategories] = useState([]);
  const [cmsConciergeServices, setCmsConciergeServices] = useState([]);
  const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);
  
  // Get pet from PillarContext (syncs with global pet selector)
  const { currentPet, pets: contextPets } = usePillarContext();
  const activePet = currentPet;
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Meals ${activePet?.name || "your pet"} will love`;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dine/page-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config && Object.keys(data.config).length > 0) {
          setCmsConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.categories?.length > 0) {
          setCmsCategories(data.categories);
        }
        if (data.conciergeServices?.length > 0) {
          setCmsConciergeServices(data.conciergeServices);
        }
        if (data.miraPrompts?.length > 0) {
          setCmsMiraPrompts(data.miraPrompts);
        }
        console.log('[DinePage] CMS config loaded');
      }
    } catch (error) {
      console.error('[DinePage] Failed to fetch CMS config:', error);
    }
  };

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);
  const [userPets, setUserPets] = useState([]);
  
  // Nearby Pet Cafes & Places state (Foursquare + Google Places)
  const [nearbyCafes, setNearbyCafes] = useState([]);
  const [nearbyParks, setNearbyParks] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [selectedNearbyCity, setSelectedNearbyCity] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Map modal state
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  // Booking modal state for unified Concierge® flow
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Rotating hero images for visual appeal
  const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
    'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
    'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80'
  ];
  
  // Get user from localStorage as fallback
  const user = getUser();

  // Rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [HERO_IMAGES.length]);

  // Update currentUser when authUser changes
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
    }
  }, [authUser]);

  // Detect user's location using geolocation API
  useEffect(() => {
    const detectUserLocation = async () => {
      setIsDetectingLocation(true);
      
      // Try to get user's location via browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Use reverse geocoding to get city name from coordinates
              const { latitude, longitude } = position.coords;
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
              );
              if (response.ok) {
                const data = await response.json();
                const city = data.address?.city || 
                            data.address?.town || 
                            data.address?.state_district ||
                            data.address?.state || 
                            'Mumbai';
                setSelectedNearbyCity(city);
                console.log(`[DinePage] Detected user location: ${city}`);
              } else {
                setSelectedNearbyCity('Mumbai'); // Fallback
              }
            } catch (err) {
              console.log('[DinePage] Reverse geocoding failed, using fallback:', err);
              setSelectedNearbyCity('Mumbai');
            }
            setIsDetectingLocation(false);
          },
          (error) => {
            console.log('[DinePage] Geolocation error:', error.message);
            // Try to get location from user profile if available
            const userCity = authUser?.city || authUser?.location || 'Mumbai';
            setSelectedNearbyCity(userCity);
            setIsDetectingLocation(false);
          },
          { timeout: 5000, maximumAge: 300000 } // 5 sec timeout, 5 min cache
        );
      } else {
        // Geolocation not supported - use user profile or default
        const userCity = authUser?.city || authUser?.location || 'Mumbai';
        setSelectedNearbyCity(userCity);
        setIsDetectingLocation(false);
      }
    };

    detectUserLocation();
  }, [authUser]);

  // Fetch restaurants and bundles from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch restaurants
        const restaurantsRes = await fetch(`${API_URL}/api/dine/restaurants`);
        if (restaurantsRes.ok) {
          const data = await restaurantsRes.json();
          setRestaurants(data.restaurants || []);
          setFilteredRestaurants(data.restaurants || []);
        }
        
        // Fetch dine bundles
        const bundlesRes = await fetch(`${API_URL}/api/dine/bundles`);
        if (bundlesRes.ok) {
          const bundlesData = await bundlesRes.json();
          setBundles(bundlesData.bundles || []);
        }
        
        // Fetch dine products using pillar resolver
        const productsRes = await fetch(`${API_URL}/api/products?pillar=dine&limit=30`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
          console.log(`[DinePage] Loaded ${productsData.count} products via pillar resolver`);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get unique cities
  const cities = ['all', ...new Set(restaurants.map(r => r.city))];

  // Filter restaurants
  useEffect(() => {
    let filtered = restaurants;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name?.toLowerCase().includes(query) ||
        r.area?.toLowerCase().includes(query) ||
        r.city?.toLowerCase().includes(query) ||
        (Array.isArray(r.cuisine) && r.cuisine.some(c => c?.toLowerCase?.().includes(query)))
      );
    }

    if (selectedCity !== 'all') {
      filtered = filtered.filter(r => r.city === selectedCity);
    }

    if (petMenuFilter !== 'all') {
      filtered = filtered.filter(r => r.petMenuAvailable === petMenuFilter);
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, selectedCity, petMenuFilter, restaurants]);

  const getPetMenuBadge = (status) => {
    switch (status) {
      case 'yes':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><Check className="w-3 h-3 mr-1" /> Pet Menu</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" /> Partial Menu</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200"><X className="w-3 h-3 mr-1" /> No Pet Menu</Badge>;
    }
  };

  const getPetPolicyText = (policy) => {
    switch (policy) {
      case 'all-pets': return 'All pets welcome';
      case 'outdoor': return 'Outdoor seating only';
      case 'small-pets': return 'Small pets only';
      default: return 'Check with restaurant';
    }
  };
  
  // Fetch nearby pet cafes and dog parks from Foursquare
  const fetchNearbyPlaces = async (city) => {
    setNearbyLoading(true);
    setSelectedNearbyCity(city);
    try {
      // Fetch pet cafes from Foursquare
      const cafesResponse = await fetch(`${API_URL}/api/mira/foursquare/pet-cafes?city=${encodeURIComponent(city)}&limit=6`);
      if (cafesResponse.ok) {
        const cafesData = await cafesResponse.json();
        setNearbyCafes(cafesData.places || []);
      }
      
      // Fetch dog parks
      const parksResponse = await fetch(`${API_URL}/api/mira/foursquare/dog-parks?city=${encodeURIComponent(city)}&limit=4`);
      if (parksResponse.ok) {
        const parksData = await parksResponse.json();
        setNearbyParks(parksData.places || []);
      }
    } catch (error) {
      console.error('Error fetching nearby places:', error);
    } finally {
      setNearbyLoading(false);
    }
  };
  
  // Fetch nearby places on mount
  useEffect(() => {
    fetchNearbyPlaces('mumbai');
  }, []);

  return (
    <PillarPageLayout
      pillar="dine"
      title={activePet ? `Dine for ${activePet.name}` : "Food & Treats for Your Pet"}
      description={activePet ? `Chosen around ${activePet.name}'s taste, energy, and needs` : "Discover nutritious fresh meals and pet-friendly restaurants for your furry friend."}
      useTabNavigation={true}
      onSubcategoryChange={handleTabChange}
    >
      {/* Main Content with iOS Safe Area Bottom Padding */}
      <div className="pb-24 theme-dine" data-testid="dine-page">
      
      {/* ═══════════════════════════════════════════════════════════════════════════════
          DINE TOPIC CARDS - Quick access to food categories
          Fresh Food, Dry Food, Treats, Special Diets
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <PillarTopicsGrid
        pillar="dine"
        topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.dine}
        columns={4}
      />
      
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* TUMMY PROFILE DASHBOARD - Personalized nutrition insights */}
      {/* VISION: Feel like a personal nutritionist who knows your dog's tummy */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {activePet && token && (
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-2 section-fade-in">
          <TummyProfileDashboard
            pet={activePet}
            onEditProfile={() => window.location.href = `/soul-builder/${activePet.id}`}
          />
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      {/* TAB CONTENT ROUTING - Render different content based on activeTab             */}
      {/* ═══════════════════════════════════════════════════════════════════════════════ */}
      
      {/* FRESH MEALS TAB - Gold Standard Implementation */}
      {activeTab === 'fresh-meals' ? (
        <>
        <FreshMealsTab
          activePet={activePet}
          token={token}
          userEmail={authUser?.email || user?.email}
        />
        </>
      ) : (
      /* ALL DINE TAB (default) and other tabs - Original content */
      <>
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DINE CONCIERGE LAYER - Intelligence-driven personalized picks */}
      {/* Order: Concierge Layer → Hangouts → Catalogue */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activePet && token ? (
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-4 section-fade-in stagger-1" data-testid="dine-curated-section">
          <div className="text-center mb-6">
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 mb-4">
              <Crown className="w-3 h-3 mr-1 inline" /> Mira's Picks for {activePet.name}
            </Badge>
            <h2 className="ios-title-2 text-gray-900 mb-2">
              Curated Dining for {activePet.name}
            </h2>
            <p className="ios-subhead text-gray-600 max-w-xl mx-auto">
              Personalised meal plans, reservations, and dining experiences - all tickets, all concierge.
            </p>
          </div>
          
          {/* Dark container for concierge cards */}
          <div className="glass-card-dark rounded-3xl p-4 md:p-6 shadow-xl">
            <CuratedConciergeSection
              petId={activePet.id}
              petName={activePet.name}
              pillar="dine"
              token={token}
              userEmail={authUser?.email || user?.email}
            />
          </div>
          
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* PERSONALIZED DINE ITEMS - Custom dining gear with pet's name */}
          {/* Bowls, mats, treat jars - Concierge® creates these */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="mt-6" data-testid="personalized-dine-wrapper">
            <PersonalizedDineSection
              pet={activePet}
              token={token}
              userEmail={authUser?.email || user?.email}
              onSaveToFavorites={(item) => {
                console.log('[DinePage] Saved to favorites:', item);
              }}
            />
          </div>
          
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* SOUL MADE PRODUCTS - AI-generated breed products with artwork */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="mt-8" data-testid="dine-soul-made-section">
            <SoulMadeCollection
              key={`dine-soul-made-${activePet?.id}`}
              pillar="dine"
              maxItems={8}
              showTitle={true}
            />
          </div>
          
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* BREED-SMART RECOMMENDATIONS - Based on breed_matrix */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="mt-8" data-testid="dine-breed-smart-section">
            <BreedSmartRecommendations pillar="dine" />
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* ARCHETYPE-PERSONALIZED PRODUCTS - Multi-factor filtering */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="mt-8">
            <ArchetypeProducts pillar="dine" maxProducts={8} showTitle={true} />
          </div>

          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* CURATED BUNDLES - Save with handpicked combinations */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="mt-8">
            <CuratedBundles pillar="dine" showTitle={true} />
          </div>
          
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          {/* MIRA CURATED LAYER - Unified Concierge Recommendations */}
          {/* ═══════════════════════════════════════════════════════════════════════ */}
          <div className="mt-8">
            <MiraCuratedLayer
              pillar="dine"
              activePet={activePet}
              token={token}
              userEmail={authUser?.email || user?.email}
              isLoading={!activePet && !!token}
            />
          </div>
          
          {/* Mira's Pillar Picks for Pet */}
          <div className="mt-6">
            <PillarPicksSection pillar="dine" pet={activePet} />
          </div>
        </div>
      ) : token && !activePet ? (
        // Loading state while pets are being fetched
        <div className="max-w-6xl mx-auto px-4 pt-8">
          <div className="text-center">
            <div className="glass-card p-6">
              <div className="h-6 skeleton-shimmer rounded-full w-48 mx-auto mb-4"></div>
              <div className="h-8 skeleton-shimmer rounded-full w-64 mx-auto mb-2"></div>
              <div className="h-4 skeleton-shimmer rounded-full w-80 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Dining Concierge Picker - Rover-style service request widget */}
      <div className="section-fade-in stagger-1" data-testid="dine-concierge-picker">
        <DiningConciergePicker />
      </div>

      {/* Elevated Concierge® Experiences */}
      <div className="max-w-6xl mx-auto px-4 py-12 section-fade-in stagger-2" data-testid="dine-experiences-section">
        <div className="text-center mb-10">
          <Badge className="gradient-dine-dark text-white px-4 py-1 mb-4 haptic-btn">
            <Crown className="w-3 h-3 mr-1 inline" /> Elevated Concierge®
          </Badge>
          <h2 className="ios-title-1 text-gray-900 mb-3">
            Dining Experiences, Elevated
          </h2>
          <p className="ios-callout text-gray-600 max-w-2xl mx-auto">
            Beyond reservations. Our Dine Concierge® curates unforgettable pet-friendly dining moments - 
            from private chef experiences to restaurant partnerships.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="bento-grid">
          {/* Featured Card - Full Width */}
          <div className="bento-featured haptic-card section-fade-in stagger-1" data-testid="experience-private-chef">
            <ConciergeExperienceCard
              pillar="dine"
              title="Private Chef Experience®"
              description="A personal chef prepares a gourmet meal for you and your pet in your home or a private venue."
              icon="👨‍🍳"
              gradient="from-orange-500 to-red-500"
              badge="Signature"
              badgeColor="bg-orange-500"
              highlights={[
                "Menu customised for pet dietary needs",
                "Human & pet courses paired together",
                "Available for celebrations & events",
                "Hypoallergenic options available"
              ]}
            />
          </div>
          
          <div className="haptic-card section-fade-in stagger-2" data-testid="experience-home-dining">
            <ConciergeExperienceCard
              pillar="dine"
              title="Restaurant VIP Access®"
              description="Get priority reservations and special pet-friendly arrangements at exclusive restaurants."
              icon="🍽️"
              gradient="from-amber-500 to-orange-500"
              highlights={[
                "Reserved pet-friendly tables",
                "Custom pet menu arrangements",
                "Celebration setups available",
                "Multi-city restaurant network"
              ]}
            />
          </div>
          
          <div className="haptic-card section-fade-in stagger-3" data-testid="experience-birthday-dining">
            <ConciergeExperienceCard
              pillar="dine"
              title="Birthday Dining Package®"
              description="Complete birthday celebration with cake, decorations, and pet-friendly venue coordination."
              icon="🎂"
              gradient="from-pink-500 to-rose-500"
              badge="Popular"
              badgeColor="bg-pink-500"
              highlights={[
                "Custom cake from our bakery",
                "Pet-safe decorations",
                "Photographer arrangement",
                "Guest coordination"
              ]}
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DINE CATEGORIES - Quick Navigation Cards */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 py-8 section-fade-in stagger-3" data-testid="dine-categories-section">
        <section id="categories" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="ios-title-2 text-gray-900 flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-orange-500" />
                Explore Dine
              </h2>
              <p className="ios-subhead text-gray-600">Fresh food, treats, supplements & more</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {dineCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link key={cat.id} to={cat.path} data-testid={`dine-category-${cat.id}`}>
                  <Card className={`glass-card-dine relative p-4 hover:shadow-lg transition-all haptic-card cursor-pointer group overflow-hidden h-full`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                    <div className="relative">
                      <div className={`experience-icon w-12 h-12 bg-gradient-to-br ${cat.gradient} rounded-2xl mb-3`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="ios-headline text-gray-900 text-sm mb-1">{cat.name}</h3>
                      <p className="ios-caption text-gray-500 line-clamp-2">{cat.description}</p>
                      {cat.badge && (
                        <Badge className={`mt-2 text-xs ${cat.badge === 'Gold Standard' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {cat.badge}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* DINING PRODUCTS - 3 rows with Load More */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {products.length > 0 && (
          <section className="mt-8" data-testid="dine-products-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="ios-title-2 text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-orange-500" />
                  Dining Products
                </h3>
                <p className="text-gray-600">Everything for pet-friendly dining</p>
              </div>
              <Link to="/search?q=dine">
                <Button variant="outline" className="gap-2">
                  View All <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.slice(0, productsToShow).map((product) => (
                <ProductCard key={product.id} product={product} pillar="dine" />
              ))}
            </div>
            
            {/* Load More Button */}
            {products.length > productsToShow && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setProductsToShow(prev => prev + 15)}
                  className="px-8 py-3 rounded-full border-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  Load More
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* DINE SERVICES - From services_master collection */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="mt-12" data-testid="dine-services-section">
          <ServiceCatalogSection 
            pillar="dine"
            title="Dining Services"
            subtitle="Restaurant discovery, reservations, and personalized dining experiences for you and your pet"
            maxServices={8}
          />
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* DINE ESSENTIALS - Feeding Tools & Supplements with Sub-sections */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {bundles.length > 0 && (
          <section className="mt-12" data-testid="dine-essentials-section">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <Package className="w-7 h-7 text-orange-500" />
                  {activeTab === 'feeding-tools' ? 'Feeding Tools' : 
                   activeTab === 'supplements' ? 'Supplements' : 'Dine Essentials'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {activeTab === 'feeding-tools' ? 'Bowls, feeders & accessories for your pet' : 
                   activeTab === 'supplements' ? 'Vitamins & nutritional support' : 
                   'Feeding tools, supplements & gift kits'}
                </p>
              </div>
            </div>
            
            {/* Category Pills - Only show when not on a specific tab */}
            {!['feeding-tools', 'supplements'].includes(activeTab) && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge 
                  className={`cursor-pointer px-3 py-1 ${essentialsFilter === 'all' ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                  onClick={() => setEssentialsFilter('all')}
                >
                  All
                </Badge>
                <Badge 
                  className={`cursor-pointer px-3 py-1 ${essentialsFilter === 'feeding_tools' ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                  onClick={() => setEssentialsFilter('feeding_tools')}
                >
                  <Utensils className="w-3 h-3 mr-1" /> Feeding Tools
                </Badge>
                <Badge 
                  className={`cursor-pointer px-3 py-1 ${essentialsFilter === 'supplements' ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                  onClick={() => setEssentialsFilter('supplements')}
                >
                  <Leaf className="w-3 h-3 mr-1" /> Supplements
                </Badge>
                <Badge 
                  className={`cursor-pointer px-3 py-1 ${essentialsFilter === 'gift' ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                  onClick={() => setEssentialsFilter('gift')}
                >
                  <Gift className="w-3 h-3 mr-1" /> Gift Kits
                </Badge>
              </div>
            )}
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bundles
                .filter(bundle => {
                  // Filter based on activeTab first (from URL/tab navigation)
                  if (activeTab === 'feeding-tools') return bundle.category === 'feeding_tools';
                  if (activeTab === 'supplements') return bundle.category === 'supplements';
                  // Then filter based on local essentialsFilter
                  if (essentialsFilter === 'all') return true;
                  if (essentialsFilter === 'feeding_tools') return bundle.category === 'feeding_tools';
                  if (essentialsFilter === 'supplements') return bundle.category === 'supplements';
                  if (essentialsFilter === 'gift') return bundle.category === 'gift_card' || bundle.name?.toLowerCase().includes('gift');
                  return true;
                })
                .map(bundle => (
                <Card 
                  key={bundle.id} 
                  className="overflow-hidden rounded-2xl hover:shadow-xl transition-all cursor-pointer flex flex-col"
                  onClick={() => setSelectedBundle(bundle)}
                  data-testid={`dine-bundle-${bundle.id}`}
                >
                  <div className="relative h-[150px] sm:h-[180px] overflow-hidden flex-shrink-0">
                    <img 
                      src={bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'} 
                      alt={bundle.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {bundle.discount_percent > 0 && (
                      <Badge className="absolute top-3 right-3 z-10 bg-red-500 shadow-sm">
                        {bundle.discount_percent}% OFF
                      </Badge>
                    )}
                    {bundle.featured && (
                      <Badge className="absolute top-3 left-3 z-10 bg-orange-500 shadow-sm">
                        <Sparkles className="w-3 h-3 mr-1" /> Featured
                      </Badge>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
                      <h3 className="font-bold text-sm sm:text-base line-clamp-1 drop-shadow-md">{bundle.name}</h3>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-white flex flex-col flex-grow">
                    <Badge variant="outline" className="mb-2 text-xs capitalize w-fit">
                      {bundle.category?.replace('_', ' ') || 'Dine Essential'}
                    </Badge>
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-3">{bundle.description}</p>
                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div>
                        <span className="text-base sm:text-lg font-bold text-green-600">₹{bundle.bundle_price || bundle.price || 0}</span>
                        {(bundle.original_price > (bundle.bundle_price || bundle.price)) && (
                          <span className="text-xs text-gray-400 line-through ml-1">₹{bundle.original_price}</span>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-orange-500 hover:bg-orange-600 text-xs h-9"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart({
                            id: bundle.id,
                            name: bundle.name,
                            price: bundle.bundle_price || bundle.price,
                            image: bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
                            description: bundle.description,
                            category: 'dine_bundle',
                            pillar: 'dine'
                          }, 'Bundle', bundle.category || 'dine', 1);
                        }}
                        data-testid={`add-dine-bundle-${bundle.id}`}
                      >
                        <ShoppingBag className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* CONCIERGE FEATURED RESTAURANTS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section id="restaurants" className="mt-12 scroll-mt-20">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-500" />
              Concierge® Featured Restaurants
            </h3>
            <p className="text-gray-600">Dine out with your furry friend</p>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search restaurants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="restaurant-search"
                  />
                </div>
              </div>

              {/* City Filter */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm bg-white"
                data-testid="city-filter"
              >
                <option value="all">All Cities</option>
                {cities.filter(c => c !== 'all').map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              {/* Pet Menu Filter */}
              <select
                value={petMenuFilter}
                onChange={(e) => setPetMenuFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg text-sm bg-white"
                data-testid="pet-menu-filter"
              >
                <option value="all">All Restaurants</option>
                <option value="yes">🍽️ Pet Menu Available</option>
                <option value="partial">⚠️ Partial Menu</option>
                <option value="no">🐕 Pet-Friendly Only</option>
              </select>
            </div>
          </Card>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading restaurants...</p>
            </div>
          ) : (
            <>
              {/* Featured Restaurants */}
              {filteredRestaurants.some(r => r.featured) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Featured
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-6">
                    {filteredRestaurants.filter(r => r.featured).map((restaurant) => (
                      <RestaurantCard 
                        key={restaurant.id} 
                        restaurant={restaurant} 
                        getPetMenuBadge={getPetMenuBadge}
                        getPetPolicyText={getPetPolicyText}
                        featured={true}
                        onSelect={setSelectedRestaurant}
                        onBuddy={setShowBuddyModal}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Restaurants - 2x2 on mobile with Load More */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredRestaurants.filter(r => !r.featured).slice(0, restaurantsToShow).map((restaurant) => (
                  <RestaurantCard 
                    key={restaurant.id} 
                    restaurant={restaurant}
                    getPetMenuBadge={getPetMenuBadge}
                    getPetPolicyText={getPetPolicyText}
                    onSelect={setSelectedRestaurant}
                    onBuddy={setShowBuddyModal}
                  />
                ))}
              </div>
              
              {/* Load More Button */}
              {filteredRestaurants.filter(r => !r.featured).length > restaurantsToShow && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => setRestaurantsToShow(prev => prev + 8)}
                    className="px-8 py-3 rounded-full border-2 border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    Load More
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {filteredRestaurants.length === 0 && (
                <Card className="p-12 text-center">
                  <Dog className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No restaurants found</h3>
                  <p className="text-gray-500">Try adjusting your filters or search query</p>
                </Card>
              )}
            </>
          )}
        </section>


        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* NEARBY PET-FRIENDLY SPOTS - Geolocation Based */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="mt-12">
          <NearbyPlacesCarousel
            pillar="dine"
            petId={activePet?.id}
            petName={activePet?.name}
            token={token}
            onReserveClick={(place) => {
              setSelectedRestaurant({
                id: place.id || `nearby-${place.name}`,
                name: place.name,
                address: place.address || 'Address available on request',
                city: place.city || 'Your City',
                rating: place.rating,
                phone: place.phone
              });
              setShowBookingModal(true);
            }}
          />
        </section>
        
        {/* ═══════════════════════════════════════════════════════════════════════════
            MIRA ADVISOR - Nutrition Expert AI Assistant
            ═══════════════════════════════════════════════════════════════════════════ */}
        <section className="py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <MiraAdvisorCard pillar="dine" activePet={activePet} />
            
            {/* Download Feeding Guide Checklist */}
            <div className="mt-4 flex justify-center">
              <ChecklistDownloadButton 
                pillar="dine" 
                variant="outline"
                className="border-orange-300 text-orange-700 hover:bg-orange-50"
              />
            </div>
          </div>
        </section>
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* PET CAFES - City Worldwide Search */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="mt-12 bg-gradient-to-b from-orange-50 to-white py-8 px-4 -mx-4 rounded-2xl">
          <div className="max-w-full mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                <Coffee className="w-5 h-5 text-orange-600" />
                Pet Cafes Worldwide
              </h3>
              <p className="text-gray-600 text-sm max-w-xl mx-auto">
                Search any city worldwide for pet-friendly cafes & parks
              </p>
              
              {/* City Search Input - Worldwide Support */}
              <div className="flex flex-col items-center gap-4 mt-4">
                <div className="flex gap-2 max-w-md w-full">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter any city (e.g., Paris, Tokyo, New York...)"
                      value={selectedNearbyCity}
                      onChange={(e) => setSelectedNearbyCity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchNearbyPlaces(selectedNearbyCity)}
                      className="pl-10 h-11"
                      data-testid="dine-city-search-input"
                    />
                  </div>
                  <Button 
                    onClick={() => fetchNearbyPlaces(selectedNearbyCity)}
                    className="bg-orange-600 hover:bg-orange-700 h-11 px-6"
                    data-testid="dine-city-search-btn"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Quick City Picks */}
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="text-xs text-gray-500 mr-2">Quick picks:</span>
                  {['Mumbai', 'Delhi', 'Goa', 'Bangalore', 'Paris', 'London', 'Dubai', 'Singapore'].map((city) => (
                    <Button
                      key={city}
                      variant={selectedNearbyCity.toLowerCase() === city.toLowerCase() ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => { setSelectedNearbyCity(city); fetchNearbyPlaces(city); }}
                      className={`text-xs ${selectedNearbyCity.toLowerCase() === city.toLowerCase() ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
                      data-testid={`dine-quick-city-${city.toLowerCase()}`}
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {nearbyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-600">Finding pet-friendly spots in {selectedNearbyCity}...</span>
              </div>
            ) : (
              <>
                {/* Pet Cafes Grid */}
                {nearbyCafes.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-orange-600" />
                      Pet Cafes in {selectedNearbyCity.charAt(0).toUpperCase() + selectedNearbyCity.slice(1)}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {nearbyCafes.slice(0, 8).map((cafe, idx) => (
                        <Card key={idx} className="overflow-hidden hover:shadow-lg transition-all duration-300 group" data-testid={`cafe-card-${idx}`}>
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-xl">
                                ☕
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-800 text-sm line-clamp-1">{cafe.name}</h4>
                                <p className="text-xs text-gray-500">{cafe.address || cafe.area || selectedNearbyCity}</p>
                              </div>
                            </div>
                            
                            {cafe.rating && (
                              <div className="flex items-center gap-1 mt-2">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-medium">{cafe.rating}</span>
                              </div>
                            )}
                            
                            <div className="mt-3 flex flex-wrap gap-1">
                              <Badge className="bg-orange-100 text-orange-700 text-xs">Pet Friendly</Badge>
                            </div>
                            
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-xs text-white"
                                onClick={() => {
                                  setSelectedRestaurant({
                                    id: cafe.place_id || `cafe-${idx}`,
                                    name: cafe.name,
                                    address: cafe.address || cafe.area || selectedNearbyCity,
                                    city: cafe.city || selectedNearbyCity,
                                    rating: cafe.rating,
                                    category: cafe.category,
                                    phone: cafe.phone
                                  });
                                  setShowBookingModal(true);
                                }}
                              >
                                <Calendar className="w-3 h-3 mr-1" /> Reserve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                onClick={() => {
                                  setSelectedPlace({
                                    name: cafe.name,
                                    address: cafe.address || cafe.area || selectedNearbyCity,
                                    city: cafe.city || selectedNearbyCity,
                                    rating: cafe.rating,
                                    phone: cafe.phone,
                                    lat: cafe.lat,
                                    lng: cafe.lng
                                  });
                                  setMapModalOpen(true);
                                }}
                                data-testid={`cafe-map-btn-${idx}`}
                              >
                                <MapPin className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dog Parks removed from Dine page - belongs in Enjoy/Fit pillar */}

                {nearbyCafes.length === 0 && (
                  <div className="text-center py-8">
                    <Dog className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No places found for this city. Try another!</p>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* BUDDY MEETUPS - Connect with pet parents */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <section className="mt-12">
          <Card className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-20">
              <Users className="w-48 h-48 -mr-12 -mt-12" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-6 h-6" />
                <h3 className="text-xl font-bold">Buddy Meetups</h3>
                <Badge className="bg-white/20 text-white ml-2">NEW</Badge>
              </div>
              <p className="text-white/90 mb-4 max-w-xl text-sm">
                Schedule visits & connect with fellow pet lovers for playdates!
              </p>
              <div className="flex flex-wrap gap-3">
                <Button 
                  size="sm"
                  className="bg-white text-purple-600 hover:bg-gray-100"
                  onClick={() => {
                    if (filteredRestaurants.length > 0) {
                      setShowBuddyModal(filteredRestaurants[0]);
                    } else {
                      alert('Please select a restaurant above to schedule a visit');
                    }
                  }}
                  data-testid="schedule-visit-btn"
                >
                  <Calendar className="w-4 h-4 mr-2" /> Schedule Visit
                </Button>
                <Button 
                  size="sm"
                  variant="outline" 
                  className="border-white text-white hover:bg-white/20"
                  onClick={() => {
                    if (filteredRestaurants.length > 0) {
                      setShowBuddyModal(filteredRestaurants[0]);
                    } else {
                      alert('No restaurants available');
                    }
                  }}
                  data-testid="view-meetups-btn"
                >
                  <MessageCircle className="w-4 h-4 mr-2" /> View Meetups
                </Button>
              </div>
            </div>
          </Card>
        </section>
        {/* OWN A PET-FRIENDLY RESTAURANT - Partner CTA */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <Card className="mt-8 p-8 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Own a Pet-Friendly Restaurant?</h3>
          <p className="opacity-90 mb-6">List your restaurant on The Doggy Company and reach thousands of pet parents!</p>
          <Link to="/partner">
            <Button className="bg-white text-orange-600 hover:bg-gray-100">
              Partner With Us
            </Button>
          </Link>
        </Card>
      </div>

      {/* Reservation Modal */}
      {selectedRestaurant && (
        <ReservationModal 
          restaurant={selectedRestaurant} 
          onClose={() => setSelectedRestaurant(null)}
          getPetMenuBadge={getPetMenuBadge}
          currentUser={currentUser}
          authToken={token}
        />
      )}

      {/* Pet Buddy Modal */}
      {showBuddyModal && (
        <PetBuddyModal
          restaurant={showBuddyModal}
          onClose={() => setShowBuddyModal(null)}
        />
      )}
      
      {/* Dine Bundle Details Modal */}
      {selectedBundle && (
        <DineBundleModal 
          bundle={selectedBundle}
          onClose={() => setSelectedBundle(null)}
          addToCart={addToCart}
        />
      )}
      
      {/* Restaurant Booking Modal - Unified Concierge® Flow */}
      {showBookingModal && selectedRestaurant && (
        <RestaurantBookingModal
          restaurant={selectedRestaurant}
          onClose={() => { setShowBookingModal(false); setSelectedRestaurant(null); }}
          user={authUser}
          activePet={activePet}
        />
      )}
      
      {/* Map Modal for viewing places - Shows Google Maps embed for Dog Parks */}
      <MapModal
        isOpen={mapModalOpen}
        onClose={() => {
          setMapModalOpen(false);
          setSelectedPlace(null);
        }}
        place={selectedPlace}
      />
      </>
      )}
      
      {/* Concierge® Button - Blue C® for Service Desk chat */}
      <ConciergeButton 
        pillar="dine" 
        position="bottom-right"
        showLabel
      />
      
      {/* Close the theme wrapper */}
      </div>
    </PillarPageLayout>
  );
};

// Restaurant Card Component
const RestaurantCard = ({ restaurant, getPetMenuBadge, getPetPolicyText, featured, onSelect, onBuddy }) => (
  <Card 
    className={`overflow-hidden hover:shadow-xl transition-all cursor-pointer haptic-card ${featured ? 'ring-2 ring-orange-400' : ''}`}
    data-testid={`restaurant-${restaurant.id}`}
    onClick={() => onSelect(restaurant)}
  >
    {/* Image Container - Fixed aspect ratio */}
    <div className="relative aspect-[16/10]">
      <img 
        src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'} 
        alt={restaurant.name}
        className="w-full h-full object-cover"
      />
      {featured && (
        <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-xs">
          <Star className="w-3 h-3 mr-1" /> Featured
        </Badge>
      )}
      {/* Price & Rating badges - Bottom left overlay */}
      <div className="absolute bottom-2 left-2 flex gap-1.5">
        <Badge className="bg-black/80 text-white text-xs px-2 py-0.5 font-medium">{restaurant.priceRange || '₹₹'}</Badge>
        <Badge className="bg-black/80 text-white text-xs px-2 py-0.5 flex items-center gap-1 font-medium">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{restaurant.rating || 4.0}
        </Badge>
      </div>
    </div>
    
    {/* Content - Consistent padding and alignment */}
    <div className="p-4">
      <h3 className="font-bold text-base text-gray-900 mb-1.5 line-clamp-1">{restaurant.name}</h3>
      <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-3">
        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="line-clamp-1">{restaurant.area}</span>
      </p>
      
      {/* Footer - Aligned properly */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 flex items-center gap-1.5">
          <Dog className="w-4 h-4" /> Pet Friendly
        </span>
        <Button 
          size="sm" 
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm h-9 px-4 rounded-lg haptic-btn font-medium"
        >
          Reserve
        </Button>
      </div>
    </div>
  </Card>
);

// Pet Buddy Modal - ENHANCED with full user/pet info + Safety
const PetBuddyModal = ({ restaurant, onClose }) => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [schedulingVisit, setSchedulingVisit] = useState(false);
  const [visitForm, setVisitForm] = useState({
    // Visit details
    date: '',
    time_slot: 'afternoon',
    looking_for_buddies: true,
    notes: '',
    notification_preference: 'email',
    // User details
    title: 'Mr.',
    first_name: '',
    last_name: '',
    email: '',
    whatsapp: '',
    // Social profiles for verification
    instagram: '',
    facebook: '',
    linkedin: '',
    // Multiple pets support
    pets: [{ name: '', breed: '', about: '', photo: '' }],
    // Safety agreement
    safety_agreed: false
  });
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [sendingRequest, setSendingRequest] = useState(null);
  const [requestSent, setRequestSent] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Add another pet
  const addPet = () => {
    if (visitForm.pets.length < 5) {
      setVisitForm({
        ...visitForm,
        pets: [...visitForm.pets, { name: '', breed: '', about: '', photo: '' }]
      });
    }
  };

  // Remove a pet
  const removePet = (index) => {
    if (visitForm.pets.length > 1) {
      const newPets = visitForm.pets.filter((_, i) => i !== index);
      setVisitForm({ ...visitForm, pets: newPets });
    }
  };

  // Update pet at index
  const updatePet = (index, field, value) => {
    const newPets = [...visitForm.pets];
    newPets[index] = { ...newPets[index], [field]: value };
    setVisitForm({ ...visitForm, pets: newPets });
  };

  // Fetch upcoming visits
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const response = await fetch(`${API_URL}/api/dine/restaurants/${restaurant.id}/visits`);
        if (response.ok) {
          const data = await response.json();
          setUpcomingVisits(data.visits || []);
        }
      } catch (error) {
        console.error('Error fetching visits:', error);
      }
    };
    fetchVisits();
  }, [restaurant.id]);

  const validateForm = () => {
    const errors = {};
    if (!visitForm.date) errors.date = 'Please select a date';
    if (!visitForm.first_name.trim()) errors.first_name = 'First name is required';
    if (!visitForm.last_name.trim()) errors.last_name = 'Last name is required';
    if (!visitForm.email.trim()) errors.email = 'Email is required';
    if (!visitForm.whatsapp.trim()) errors.whatsapp = 'WhatsApp number is required';
    // At least first pet name required
    if (!visitForm.pets[0]?.name?.trim()) errors.pet_name = 'At least one pet name is required';
    // Safety agreement required
    if (!visitForm.safety_agreed) errors.safety = 'You must agree to the safety guidelines';
    // At least one social profile recommended (not required, but show warning)
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleScheduleVisit = async () => {
    if (!validateForm()) {
      alert('Please fill in all required fields and agree to safety guidelines');
      return;
    }
    
    // Warn if no social profiles provided
    if (!visitForm.instagram && !visitForm.facebook && !visitForm.linkedin) {
      const proceed = confirm('You haven\'t added any social profile links. Other pet parents may be hesitant to connect without being able to verify your identity. Continue anyway?');
      if (!proceed) return;
    }
    
    // Build request payload
    const payload = {
      restaurant_id: restaurant.id,
      date: visitForm.date,
      time_slot: visitForm.time_slot,
      looking_for_buddies: visitForm.looking_for_buddies,
      notes: visitForm.notes,
      notification_preference: visitForm.notification_preference,
      title: visitForm.title,
      first_name: visitForm.first_name,
      last_name: visitForm.last_name,
      email: visitForm.email,
      whatsapp: visitForm.whatsapp,
      instagram: visitForm.instagram,
      facebook: visitForm.facebook,
      linkedin: visitForm.linkedin,
      pets: visitForm.pets,
      safety_agreed: visitForm.safety_agreed,
      // Flatten first pet for backward compatibility
      pet_name: visitForm.pets[0]?.name || '',
      pet_breed: visitForm.pets[0]?.breed || '',
      pet_about: visitForm.pets[0]?.about || '',
      pet_photo: visitForm.pets[0]?.photo || ''
    };
    
    // Log for debugging
    console.log('Submitting visit with payload:', JSON.stringify(payload, null, 2));
    
    try {
      const response = await fetch(`${API_URL}/api/dine/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        alert('Visit scheduled! Other pet parents can now see your planned visit.');
        setSchedulingVisit(false);
        setVisitForm({ 
          date: '', time_slot: 'afternoon', looking_for_buddies: true, notes: '', 
          notification_preference: 'email', title: 'Mr.', first_name: '', last_name: '',
          email: '', whatsapp: '', instagram: '', facebook: '', linkedin: '',
          pets: [{ name: '', breed: '', about: '', photo: '' }], safety_agreed: false
        });
        setFormErrors({});
        // Refresh visits
        const refreshResponse = await fetch(`${API_URL}/api/dine/restaurants/${restaurant.id}/visits`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setUpcomingVisits(data.visits || []);
        }
      }
    } catch (error) {
      console.error('Error scheduling visit:', error);
    }
  };

  const handleSendMeetupRequest = async (visit) => {
    if (sendingRequest || requestSent[visit.id]) return;
    
    setSendingRequest(visit.id);
    try {
      const response = await fetch(`${API_URL}/api/dine/meetup-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visit_id: visit.id,
          message: `Hey! Would love to meet up with you and your pet at ${restaurant.name}!`
        })
      });
      
      if (response.ok) {
        setRequestSent(prev => ({ ...prev, [visit.id]: true }));
        alert(`Meetup request sent to ${visit.user_name || 'the pet parent'}! They will be notified and can accept or decline your request.`);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending meetup request:', error);
      alert('Failed to send meetup request. Please check your connection.');
    } finally {
      setSendingRequest(null);
    }
  };

  const getTimeSlotLabel = (slot) => {
    const labels = {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening'
    };
    return labels[slot] || slot;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative h-24 bg-gradient-to-r from-purple-500 to-pink-500">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute bottom-3 left-4 text-white">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-lg" data-testid="buddy-modal-title">Pet Buddy Meetups</h3>
            </div>
            <p className="text-sm opacity-90">{restaurant.name} • {restaurant.city}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={onClose}
            data-testid="close-buddy-modal"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'upcoming' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('upcoming')}
            data-testid="whos-going-tab"
          >
            <Users className="w-4 h-4 inline mr-1" /> Who's Going ({upcomingVisits.length})
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'schedule' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('schedule')}
            data-testid="schedule-visit-tab"
          >
            <Calendar className="w-4 h-4 inline mr-1" /> Schedule Visit
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'upcoming' ? (
            <div className="space-y-4">
              {/* Safety Notice */}
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
                <p className="text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span><strong>Safety First:</strong> Always verify profiles before meeting. Meet in public places. The Doggy Company facilitates connections but is not responsible for individual meetups.</span>
                </p>
              </div>
              
              {upcomingVisits.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No visits scheduled yet</p>
                  <p className="text-sm text-gray-400">Be the first to plan a visit!</p>
                  <Button 
                    className="mt-4 bg-purple-500 hover:bg-purple-600"
                    onClick={() => setActiveTab('schedule')}
                    data-testid="schedule-first-visit-btn"
                  >
                    Schedule Your Visit
                  </Button>
                </div>
              ) : (
                upcomingVisits.map((visit) => {
                  // Check if profile is verified (has at least one social link)
                  const hasVerification = visit.instagram || visit.facebook || visit.linkedin;
                  const petsList = visit.pets || [{ name: visit.pet_name, breed: visit.pet_breed, about: visit.pet_about, photo: visit.pet_photo }];
                  
                  return (
                  <Card key={visit.id} className={`p-4 border-purple-100 hover:border-purple-300 transition-colors ${hasVerification ? 'ring-1 ring-green-200' : ''}`} data-testid={`visit-card-${visit.id}`}>
                    <div className="flex gap-3">
                      {/* Pet Photo (if available) */}
                      {(visit.pet_photo || petsList[0]?.photo) && (
                        <div className="flex-shrink-0">
                          <img 
                            src={visit.pet_photo || petsList[0]?.photo} 
                            alt={visit.pet_name || petsList[0]?.name || 'Pet'} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                          />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        {/* Person's Name with Verification Badge */}
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-purple-700 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {visit.title || ''} {visit.first_name || ''} {visit.last_name || visit.user_name || 'Pet Parent'}
                          </p>
                          {hasVerification && (
                            <Badge className="bg-green-100 text-green-700 text-xs px-1.5 py-0">
                              <Check className="w-2 h-2 mr-0.5" /> Verified
                            </Badge>
                          )}
                        </div>
                        
                        {/* Social Profiles for Verification */}
                        {hasVerification && (
                          <div className="flex gap-2 mb-2">
                            {visit.instagram && (
                              <a href={visit.instagram.startsWith('http') ? visit.instagram : `https://instagram.com/${visit.instagram.replace('@', '')}`} 
                                 target="_blank" rel="noopener noreferrer"
                                 className="text-pink-500 hover:text-pink-600 text-xs flex items-center gap-0.5">
                                <Instagram className="w-3 h-3" /> Instagram
                              </a>
                            )}
                            {visit.facebook && (
                              <a href={visit.facebook.startsWith('http') ? visit.facebook : `https://facebook.com/${visit.facebook}`} 
                                 target="_blank" rel="noopener noreferrer"
                                 className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-0.5">
                                <Globe className="w-3 h-3" /> Facebook
                              </a>
                            )}
                            {visit.linkedin && (
                              <a href={visit.linkedin.startsWith('http') ? visit.linkedin : `https://linkedin.com/in/${visit.linkedin}`} 
                                 target="_blank" rel="noopener noreferrer"
                                 className="text-blue-700 hover:text-blue-800 text-xs flex items-center gap-0.5">
                                <Globe className="w-3 h-3" /> LinkedIn
                              </a>
                            )}
                          </div>
                        )}
                        
                        {/* Pet Info - Highlighted (supports multiple pets) */}
                        <div className="bg-purple-50 rounded-lg p-2 mb-2">
                          <p className="text-sm font-medium text-purple-800 flex items-center gap-1 mb-1">
                            <Dog className="w-3 h-3" />
                            Bringing {petsList.length} pet{petsList.length > 1 ? 's' : ''}:
                          </p>
                          {petsList.filter(p => p.name).map((pet, idx) => (
                            <div key={idx} className="ml-4 text-xs text-purple-700">
                              <span className="font-bold">{pet.name}</span>
                              {pet.breed && <span className="text-purple-500"> ({pet.breed})</span>}
                              {pet.about && <span className="italic text-purple-600"> - "{pet.about}"</span>}
                            </div>
                          ))}
                        </div>
                        
                        {/* Date & Time & Location */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap text-sm">
                          <Calendar className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <span className="font-medium">{visit.date}</span>
                          <Badge variant="outline" className="text-xs capitalize">{getTimeSlotLabel(visit.time_slot)}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          {visit.restaurant_name || restaurant.name}
                          {(visit.restaurant_city || restaurant.city) && `, ${visit.restaurant_city || restaurant.city}`}
                        </p>
                        
                        {/* Notes */}
                        {visit.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">"{visit.notes}"</p>
                        )}
                      </div>
                      
                      {/* Connect Button */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <Button 
                          size="sm" 
                          className={`${requestSent[visit.id] ? 'bg-green-500' : 'bg-purple-500 hover:bg-purple-600'}`}
                          onClick={() => handleSendMeetupRequest(visit)}
                          disabled={sendingRequest === visit.id || requestSent[visit.id]}
                          data-testid={`connect-btn-${visit.id}`}
                        >
                          {sendingRequest === visit.id ? (
                            <>
                              <span className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : requestSent[visit.id] ? (
                            <>
                              <Check className="w-3 h-3 mr-1" /> Sent!
                            </>
                          ) : (
                            <>
                              <Send className="w-3 h-3 mr-1" /> Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {/* SECTION 1: Your Details */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" /> Your Details
                </h4>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Title *</label>
                    <select
                      value={visitForm.title}
                      onChange={(e) => setVisitForm({...visitForm, title: e.target.value})}
                      className={`w-full px-2 py-1.5 border rounded text-sm ${formErrors.title ? 'border-red-400' : ''}`}
                    >
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="Mrs.">Mrs.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">First Name *</label>
                    <Input
                      value={visitForm.first_name}
                      onChange={(e) => setVisitForm({...visitForm, first_name: e.target.value})}
                      placeholder="First name"
                      className={`text-sm h-8 ${formErrors.first_name ? 'border-red-400' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Last Name *</label>
                    <Input
                      value={visitForm.last_name}
                      onChange={(e) => setVisitForm({...visitForm, last_name: e.target.value})}
                      placeholder="Last name"
                      className={`text-sm h-8 ${formErrors.last_name ? 'border-red-400' : ''}`}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Email *</label>
                    <Input
                      type="email"
                      value={visitForm.email}
                      onChange={(e) => setVisitForm({...visitForm, email: e.target.value})}
                      placeholder="your@email.com"
                      className={`text-sm h-8 ${formErrors.email ? 'border-red-400' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">WhatsApp Number *</label>
                    <Input
                      type="tel"
                      value={visitForm.whatsapp}
                      onChange={(e) => setVisitForm({...visitForm, whatsapp: e.target.value})}
                      placeholder="+91 98765 43210"
                      className={`text-sm h-8 ${formErrors.whatsapp ? 'border-red-400' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Social Profiles for Verification */}
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Verify Your Identity (Recommended)
                </h4>
                <p className="text-xs text-indigo-600 mb-3">Add at least one social profile so other pet parents can verify who they're meeting. Profiles with verification get a ✓ badge.</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Instagram className="w-3 h-3 text-pink-500" /> Instagram
                    </label>
                    <Input
                      value={visitForm.instagram}
                      onChange={(e) => setVisitForm({...visitForm, instagram: e.target.value})}
                      placeholder="@username or URL"
                      className="text-sm h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-600" /> Facebook
                    </label>
                    <Input
                      value={visitForm.facebook}
                      onChange={(e) => setVisitForm({...visitForm, facebook: e.target.value})}
                      placeholder="Profile URL"
                      className="text-sm h-8"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-700" /> LinkedIn
                    </label>
                    <Input
                      value={visitForm.linkedin}
                      onChange={(e) => setVisitForm({...visitForm, linkedin: e.target.value})}
                      placeholder="Profile URL"
                      className="text-sm h-8"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Your Pets (Multiple Support) */}
              <div className="bg-pink-50 p-3 rounded-lg border border-pink-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-pink-800 flex items-center gap-2">
                    <Dog className="w-4 h-4" /> Your Pet{visitForm.pets.length > 1 ? 's' : ''} ({visitForm.pets.length})
                  </h4>
                  {visitForm.pets.length < 5 && (
                    <Button variant="outline" size="sm" onClick={addPet} className="text-xs h-7">
                      + Add Another Pet
                    </Button>
                  )}
                </div>
                
                {visitForm.pets.map((pet, index) => (
                  <div key={index} className={`${index > 0 ? 'mt-3 pt-3 border-t border-pink-200' : ''}`}>
                    {visitForm.pets.length > 1 && (
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-pink-700">Pet #{index + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removePet(index)} className="text-xs h-6 text-red-500 hover:text-red-700">
                          Remove
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600">Pet's Name *</label>
                        <Input
                          value={pet.name}
                          onChange={(e) => updatePet(index, 'name', e.target.value)}
                          placeholder="e.g., Bruno"
                          className={`text-sm h-8 ${index === 0 && formErrors.pet_name ? 'border-red-400' : ''}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600">Breed</label>
                        <Input
                          value={pet.breed}
                          onChange={(e) => updatePet(index, 'breed', e.target.value)}
                          placeholder="e.g., Golden Retriever"
                          className="text-sm h-8"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600">About this pet</label>
                      <textarea
                        value={pet.about}
                        onChange={(e) => updatePet(index, 'about', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded text-sm"
                        rows={1}
                        placeholder="e.g., Friendly 2-year-old, loves to play!"
                      />
                    </div>
                    <div className="mt-1">
                      <label className="text-xs font-medium text-gray-600">Photo URL</label>
                      <Input
                        value={pet.photo}
                        onChange={(e) => updatePet(index, 'photo', e.target.value)}
                        placeholder="https://..."
                        className="text-sm h-8"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* SECTION 4: Visit Details */}
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Visit Details
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Date *</label>
                    <Input
                      type="date"
                      value={visitForm.date}
                      onChange={(e) => setVisitForm({...visitForm, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className={`text-sm h-8 ${formErrors.date ? 'border-red-400' : ''}`}
                      data-testid="visit-date-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Time Slot</label>
                    <select
                      value={visitForm.time_slot}
                      onChange={(e) => setVisitForm({...visitForm, time_slot: e.target.value})}
                      className="w-full px-2 py-1.5 border rounded text-sm"
                      data-testid="visit-timeslot-select"
                    >
                      <option value="morning">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                      <option value="evening">Evening (5 PM - 10 PM)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Additional Notes (optional)</label>
                  <textarea
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm({...visitForm, notes: e.target.value})}
                    className="w-full px-2 py-1.5 border rounded text-sm"
                    rows={2}
                    placeholder="Any other details..."
                  />
                </div>
              </div>

              {/* SECTION 5: Notification Preference */}
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <label className="text-sm font-medium text-green-700 mb-2 block">
                  How should we notify you about meetup requests?
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="notification_preference"
                      value="email"
                      checked={visitForm.notification_preference === 'email'}
                      onChange={(e) => setVisitForm({...visitForm, notification_preference: e.target.value})}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <Mail className="w-3 h-3" /> Email
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="notification_preference"
                      value="whatsapp"
                      checked={visitForm.notification_preference === 'whatsapp'}
                      onChange={(e) => setVisitForm({...visitForm, notification_preference: e.target.value})}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> WhatsApp
                    </span>
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visitForm.looking_for_buddies}
                  onChange={(e) => setVisitForm({...visitForm, looking_for_buddies: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm">I'm open to meetups with other pet parents</span>
              </label>

              {/* SECTION 6: Safety Disclaimer & Agreement */}
              <div className={`p-3 rounded-lg border ${formErrors.safety ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-200'}`}>
                <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Community Safety Guidelines
                </h4>
                <div className="text-xs text-amber-700 space-y-1 mb-3">
                  <p>• <strong>Pet Buddy Meetups</strong> is a community platform for pet parents to connect and socialize with their pets.</p>
                  <p>• Always meet in <strong>public places</strong> like pet-friendly cafes listed on our platform.</p>
                  <p>• <strong>Verify profiles</strong> using social media links before meeting.</p>
                  <p>• The Doggy Company <strong>facilitates connections</strong> but is not responsible for individual meetups.</p>
                  <p>• Report any inappropriate behavior to our team immediately.</p>
                  <p>• This platform is <strong>strictly for pet socialization</strong>, not personal dating.</p>
                </div>
                <label className={`flex items-start gap-2 cursor-pointer p-2 rounded ${visitForm.safety_agreed ? 'bg-green-100' : 'bg-white'}`}>
                  <input
                    type="checkbox"
                    checked={visitForm.safety_agreed}
                    onChange={(e) => setVisitForm({...visitForm, safety_agreed: e.target.checked})}
                    className="w-4 h-4 text-amber-600 rounded mt-0.5"
                  />
                  <span className="text-sm text-amber-800">
                    I agree to the <strong>Community Safety Guidelines</strong> and understand that The Doggy Company is a platform for pet socialization. I will behave responsibly and report any issues.
                  </span>
                </label>
              </div>
              
              <Button 
                className="w-full bg-purple-500 hover:bg-purple-600"
                onClick={handleScheduleVisit}
                disabled={!visitForm.date || !visitForm.first_name || !visitForm.pets[0]?.name || !visitForm.safety_agreed}
                data-testid="schedule-visit-btn"
              >
                <Calendar className="w-4 h-4 mr-2" /> Schedule My Visit
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// Reservation Modal with Pet Soul Integration
const ReservationModal = ({ restaurant, onClose, getPetMenuBadge, currentUser, authToken }) => {
  const [userPets, setUserPets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]); // Multi-pet selection
  const [loadingPets, setLoadingPets] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: Services
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || currentUser?.whatsapp || '',
    email: currentUser?.email || '',
    date: '',
    time: '',
    guests: 2,
    petMealPreorder: false,
    specialRequests: '',
  });

  // Safeguard: if restaurant is missing critical data, log error
  // We handle this in the render return below instead of early return to avoid hooks issues
  const isValidRestaurant = restaurant && restaurant.id;

  // Fetch user's pets on mount
  useEffect(() => {
    const fetchUserPets = async () => {
      if (!currentUser?.email || !authToken) return;
      
      setLoadingPets(true);
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || [];
          setUserPets(pets);
          
          // Auto-select all pets by default
          if (pets.length > 0) {
            setSelectedPets(pets.map(p => p.id));
          }
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setLoadingPets(false);
      }
    };
    fetchUserPets();
  }, [currentUser, authToken]);

  // Toggle pet selection
  const togglePetSelection = (petId) => {
    setSelectedPets(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  // Get selected pets info
  const getSelectedPetsInfo = () => {
    return userPets.filter(p => selectedPets.includes(p.id));
  };

  // Auto-populate special requests with pet names when pets are selected
  useEffect(() => {
    if (selectedPets.length > 0 && !formData.specialRequests) {
      const petNames = getSelectedPetsInfo().map(p => p.name).join(', ');
      if (petNames) {
        setFormData(prev => ({
          ...prev,
          specialRequests: `Dining with my pet(s): ${petNames}. `
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPets, userPets]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Get selected pets data
      const petsData = getSelectedPetsInfo().map(pet => ({
        id: pet.id,
        name: pet.name,
        breed: pet.identity?.breed || pet.breed
      }));
      
      // Submit reservation
      const response = await fetch(`${API_URL}/api/dine/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurant.id,
          ...formData,
          pets: petsData,
          pets_count: selectedPets.length,
          pet_ids: selectedPets
        })
      });
      
      if (response.ok) {
        const reservationData = await response.json();
        
        // Write to Pet Soul for each selected pet
        for (const petId of selectedPets) {
          try {
            await fetch(`${API_URL}/api/pet-vault/${petId}/record-dine-reservation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                restaurant_id: restaurant.id,
                restaurant_name: restaurant.name,
                restaurant_city: restaurant.city,
                date: formData.date,
                time: formData.time,
                guests: formData.guests,
                pets_count: selectedPets.length,
                pet_meal_preorder: formData.petMealPreorder,
                reservation_id: reservationData.reservation_id || reservationData.id
              })
            });
          } catch (soulError) {
            console.error('Failed to record in Pet Soul:', soulError);
          }
        }
        
        setSuccess(true);
      } else {
        alert('Failed to submit reservation. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting reservation:', error);
      alert('Failed to submit reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <Card className="max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Reservation Requested!</h3>
          <p className="text-gray-600 mb-4">
            We've received your reservation request for <strong>{restaurant.name}</strong>.
          </p>
          {selectedPets.length > 0 && (
            <div className="bg-purple-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-purple-700">
                🐕 Dining with: <strong>{getSelectedPetsInfo().map(p => p.name).join(', ')}</strong>
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500 mb-6">
            The restaurant will confirm your booking shortly via WhatsApp. 📱
          </p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={onClose}>
            Done
          </Button>
        </Card>
      </div>
    );
  }

  // Safeguard: if restaurant data is invalid, show error state and close
  if (!isValidRestaurant) {
    console.error('[ReservationModal] Invalid restaurant data:', restaurant);
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <Card className="max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Unable to load restaurant</h3>
          <p className="text-gray-600 mb-4">
            Please try again or select a different restaurant.
          </p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={onClose}>
            Close
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-32">
          <img src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800'} alt={restaurant.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4 text-white">
            <h3 className="font-bold text-xl">{restaurant.name}</h3>
            <p className="text-sm opacity-90">{restaurant.area}, {restaurant.city}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Concierge® Recommendation in Modal */}
        {restaurant.conciergeRecommendation && (
          <div className="mx-4 mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span><strong>Your Concierge® recommends:</strong> {restaurant.conciergeRecommendation}</span>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Pet Menu Status</span>
            {getPetMenuBadge(restaurant.petMenuAvailable)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-sm sm:text-base font-medium text-gray-700">Your Name</label>
              <Input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="text-base"
              />
            </div>
            <div>
              <label className="text-sm sm:text-base font-medium text-gray-700 flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-green-600" /> WhatsApp
              </label>
              <Input 
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="text-base"
              />
            </div>
          </div>

          <div>
            <label className="text-sm sm:text-base font-medium text-gray-700">Email</label>
            <Input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-sm sm:text-base font-medium text-gray-700">Date</label>
              <Input 
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
                className="text-base"
                data-testid="reservation-date"
              />
            </div>
            <div>
              <label className="text-sm sm:text-base font-medium text-gray-700">Time</label>
              <select 
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                required
                className="w-full h-10 px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select time</option>
                {/* Generate 30-min intervals for 24 hours */}
                {Array.from({length: 48}, (_, i) => {
                  const hour = Math.floor(i / 2);
                  const minute = i % 2 === 0 ? '00' : '30';
                  const time24 = `${hour.toString().padStart(2, '0')}:${minute}`;
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                  const ampm = hour < 12 ? 'AM' : 'PM';
                  const displayTime = `${displayHour}:${minute} ${ampm}`;
                  return (
                    <option key={time24} value={time24}>{displayTime}</option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-sm sm:text-base font-medium text-gray-700">Guests</label>
              <Input 
                type="number"
                min="1"
                value={formData.guests}
                onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
                className="text-base"
              />
            </div>
            <div>
              <label className="text-sm sm:text-base font-medium text-gray-700">Number of Pets</label>
              <div className="h-10 flex items-center text-base text-gray-700 bg-gray-50 px-3 rounded-md border">
                {selectedPets.length || 'Select below'}
              </div>
            </div>
          </div>

          {/* Pet Selection - Multi-select with checkboxes */}
          <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <h4 className="font-semibold text-pink-800 mb-3 flex items-center gap-2">
              <Dog className="w-4 h-4" /> Who's Dining With You?
            </h4>
            <p className="text-sm text-pink-600 mb-3">
              Select all the furry friends joining this meal
            </p>
            
            {loadingPets ? (
              <div className="text-center py-4 text-pink-600">Loading your pets...</div>
            ) : userPets.length > 0 ? (
              <div className="space-y-2">
                {userPets.map((pet) => {
                  const isSelected = selectedPets.includes(pet.id);
                  return (
                    <div 
                      key={pet.id}
                      onClick={() => togglePetSelection(pet.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-pink-100 border-2 border-pink-400' 
                          : 'bg-white border border-pink-200 hover:border-pink-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-pink-500' : 'border-2 border-pink-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                        <Dog className="w-5 h-5 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{pet.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {pet.identity?.breed || pet.breed || pet.species || 'Pet'}
                        </span>
                      </div>
                      {isSelected && (
                        <Badge className="bg-pink-500 text-white text-xs">Dining</Badge>
                      )}
                    </div>
                  );
                })}
                
                {/* Summary */}
                {selectedPets.length > 0 && (
                  <div className="mt-3 p-2 bg-pink-100 rounded-lg">
                    <p className="text-sm text-pink-700 font-medium">
                      🐕 {selectedPets.length} pet{selectedPets.length > 1 ? 's' : ''} joining: {getSelectedPetsInfo().map(p => p.name).join(', ')}
                    </p>
                    <p className="text-xs text-pink-600 mt-1">
                      ✨ Dining history will be saved to their Pet Soul
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-pink-600">
                <Dog className="w-8 h-8 mx-auto text-pink-300 mb-2" />
                <p className="text-sm">No pets in your Pet Soul yet</p>
                <p className="text-xs text-pink-500">Your furry friend details will enhance the experience!</p>
              </div>
            )}
          </div>

          {restaurant.petMenuAvailable === 'yes' && restaurant.petMenuItems?.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={formData.petMealPreorder}
                  onChange={(e) => setFormData({...formData, petMealPreorder: e.target.checked})}
                  className="w-5 h-5 text-green-600 rounded"
                />
                <div>
                  <span className="font-medium text-green-800">Pre-order Pet Meal</span>
                  <p className="text-xs text-green-600">Available: {restaurant.petMenuItems?.join(', ')}</p>
                </div>
              </label>
            </div>
          )}

          {/* Pet Menu Image */}
          {restaurant.petMenuImage && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">📋 View Pet Menu</p>
              <img 
                src={restaurant.petMenuImage} 
                alt="Pet Menu"
                className="w-full rounded-lg border cursor-pointer hover:opacity-90"
                onClick={() => window.open(restaurant.petMenuImage, '_blank')}
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Special Requests</label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
              className="w-full p-3 border rounded-lg text-sm"
              rows={3}
              placeholder={selectedPets.length > 0 
                ? `Special requests for you and ${getSelectedPetsInfo().map(p => p.name).join(', ')}...`
                : "Any special requirements for you or your pet..."
              }
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={submitting}
            data-testid="dine-reserve-submit"
          >
            {submitting ? 'Submitting...' : 'Request Reservation'}
          </Button>

          <p className="text-xs text-center text-gray-500">
            Our team will confirm availability within 2 hours
            {selectedPets.length > 0 && <span className="block text-pink-600 mt-1">🐾 Reservation linked to Pet Soul</span>}
          </p>
        </form>
      </Card>
    </div>
  );
};

// Dine Bundle Modal Component
const DineBundleModal = ({ bundle, onClose, addToCart }) => {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      addToCart({
        id: bundle.id,
        name: bundle.name,
        price: bundle.bundle_price || bundle.price,
        image: bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
        description: bundle.description,
        category: 'dine_bundle',
        pillar: 'dine',
        bundleItems: bundle.items,
        originalPrice: bundle.original_price,
        discountPercent: bundle.discount_percent
      }, 'Bundle', bundle.category || 'dine', 1);
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            {bundle.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bundle Image */}
          <div className="relative rounded-lg overflow-hidden">
            <img 
              src={bundle.image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800'} 
              alt={bundle.name}
              className="w-full h-48 object-cover"
            />
            {bundle.discount_percent > 0 && (
              <Badge className="absolute top-3 right-3 bg-red-500 text-lg px-3 py-1">
                <Percent className="w-4 h-4 mr-1" /> {bundle.discount_percent}% OFF
              </Badge>
            )}
          </div>

          {/* Bundle Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize">{bundle.category?.replace('_', ' ')}</Badge>
              {bundle.for_occasion && (
                <Badge className="bg-orange-100 text-orange-800">
                  <PartyPopper className="w-3 h-3 mr-1" /> {bundle.for_occasion}
                </Badge>
              )}
            </div>
            <p className="text-gray-600">{bundle.description}</p>
          </div>

          {/* What's Included */}
          {bundle.items && bundle.items.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <Gift className="w-4 h-4" /> What's Included
              </h4>
              <ul className="space-y-1">
                {bundle.items.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Bundle Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">₹{bundle.bundle_price || bundle.price || 0}</span>
                {(bundle.original_price > (bundle.bundle_price || bundle.price)) && (
                  <span className="text-lg text-gray-400 line-through">₹{bundle.original_price}</span>
                )}
              </div>
              {bundle.discount_percent > 0 && (
                <p className="text-sm text-green-600">You save ₹{bundle.original_price - bundle.bundle_price}</p>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <Button
            className={`w-full py-6 text-lg ${added ? 'bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
            onClick={handleAddToCart}
            disabled={loading || added}
            data-testid="dine-bundle-add-to-cart"
          >
            {loading ? (
              <>Loading...</>
            ) : added ? (
              <><Check className="w-5 h-5 mr-2" /> Added to Cart!</>
            ) : (
              <><ShoppingBag className="w-5 h-5 mr-2" /> Add to Cart</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Restaurant Booking Modal - Unified Concierge® Service Flow
// For Google Places restaurants without full reservation system
const RestaurantBookingModal = ({ restaurant, onClose, user, activePet }) => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || user?.whatsapp || '',
    email: user?.email || '',
    date: '',
    time: '',
    guests: 2,
    specialRequests: activePet ? `Dining with my pet: ${activePet.name}. ` : ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Create unified service request - triggers full flow
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'dine_reservation',
          pillar: 'dine',
          source: 'dine_page',
          customer: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          },
          details: {
            restaurant_name: restaurant.name,
            restaurant_address: restaurant.address,
            restaurant_city: restaurant.city,
            date: formData.date,
            time: formData.time,
            guests: formData.guests,
            pet_name: activePet?.name || 'Not specified',
            special_requests: formData.specialRequests
          },
          priority: 'normal'
        })
      });
      
      if (response.ok) {
        setSuccess(true);
      } else {
        alert('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success state - Unified Concierge® confirmation
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <Card className="max-w-md w-full p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Request Received!</h3>
          <p className="text-gray-600 mb-4">
            Our <strong>Concierge®</strong> team will make the reservation at <strong>{restaurant.name}</strong> for you.
          </p>
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-purple-700">
              📅 {formData.date} at {formData.time}<br/>
              👥 {formData.guests} guests
              {activePet && <><br/>🐕 With {activePet.name}</>}
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            We'll confirm your booking within 24 hours via WhatsApp. 📱
          </p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={onClose}>
            Done
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{restaurant.name}</h3>
            <p className="text-sm text-gray-500">{restaurant.address}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Concierge® Header */}
        <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <p className="text-sm text-purple-700 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            <span><strong>Concierge®</strong> will handle your reservation</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Your Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Full name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+91..."
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Time</label>
              <select
                className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                required
              >
                <option value="">Select time</option>
                <option value="11:00">11:00 AM</option>
                <option value="11:30">11:30 AM</option>
                <option value="12:00">12:00 PM</option>
                <option value="12:30">12:30 PM</option>
                <option value="13:00">1:00 PM</option>
                <option value="13:30">1:30 PM</option>
                <option value="14:00">2:00 PM</option>
                <option value="14:30">2:30 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="18:00">6:00 PM</option>
                <option value="18:30">6:30 PM</option>
                <option value="19:00">7:00 PM</option>
                <option value="19:30">7:30 PM</option>
                <option value="20:00">8:00 PM</option>
                <option value="20:30">8:30 PM</option>
                <option value="21:00">9:00 PM</option>
                <option value="21:30">9:30 PM</option>
                <option value="22:00">10:00 PM</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Guests</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.guests}
                onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value)})}
                required
              />
            </div>
          </div>

          {activePet && (
            <div className="p-3 bg-orange-50 rounded-lg flex items-center gap-3">
              <Dog className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-700">
                Dining with <strong>{activePet.name}</strong>
              </span>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Special Requests</label>
            <textarea
              className="w-full p-3 border rounded-lg text-sm resize-none"
              rows={2}
              value={formData.specialRequests}
              onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
              placeholder="Any special requests for your dining experience..."
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700 py-6"
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" /> Request Reservation</>
            )}
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            Our Concierge® team will confirm within 24 hours
          </p>
        </form>
      </Card>
      
      {/* Map Modal for viewing places */}
      <MapModal
        isOpen={mapModalOpen}
        onClose={() => {
          setMapModalOpen(false);
          setSelectedPlace(null);
        }}
        place={selectedPlace}
      />
    </div>
  );
};

export default DinePage;

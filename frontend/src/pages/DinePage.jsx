import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  UtensilsCrossed, MapPin, Search, Filter, Star, Clock, 
  Dog, Cat, ChevronRight, ChevronDown, ChevronLeft, Phone, Globe, Instagram,
  Utensils, Coffee, Pizza, Leaf, Heart, Check, X, AlertCircle,
  Sparkles, ShoppingBag, Truck, Users, Calendar, MessageCircle, Send,
  Bell, Gift, Cake, User, Mail, Package, Percent, PartyPopper,
  Crown, Wine, ChefHat, Trees, Loader2, Navigation, Apple
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
import SoulPersonalizationSection from '../components/SoulPersonalizationSection';

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
  
  // Fetch nearby places whenever we have a resolved city
  useEffect(() => {
    if (selectedNearbyCity) {
      fetchNearbyPlaces(selectedNearbyCity);
    }
  }, [selectedNearbyCity]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // GOLD STANDARD: ASK MIRA STATE
  // ═══════════════════════════════════════════════════════════════════════════════
  const [askMiraQuestion, setAskMiraQuestion] = useState('');
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  
  const handleAskMira = () => {
    if (!askMiraQuestion.trim()) return;
    setAskMiraLoading(true);
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: { message: askMiraQuestion, context: 'dine', pillar: 'dine' }
    }));
    setTimeout(() => {
      setAskMiraLoading(false);
      setAskMiraQuestion('');
    }, 500);
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // GOLD STANDARD: HELP BUCKETS - "How can we help?"
  // ═══════════════════════════════════════════════════════════════════════════════
  const helpBuckets = [
    {
      id: 'nutrition',
      title: 'Nutrition Help',
      icon: 'Utensils',
      color: 'green',
      items: ['Best food for my breed', 'Portion sizes', 'Meal frequency', 'Homemade recipes']
    },
    {
      id: 'allergies',
      title: 'Allergies & Diets',
      icon: 'Heart',
      color: 'blue',
      items: ['Food allergy signs', 'Elimination diets', 'Hypoallergenic options', 'Sensitive stomachs']
    },
    {
      id: 'treats',
      title: 'Treats & Rewards',
      icon: 'Gift',
      color: 'pink',
      items: ['Healthy treat options', 'Training rewards', 'Treat portions', 'Homemade treats']
    }
  ];

  // ═══════════════════════════════════════════════════════════════════════════════
  // GOLD STANDARD: GUIDED PATHS - Step-by-step nutrition journeys
  // ═══════════════════════════════════════════════════════════════════════════════
  const guidedPaths = [
    { title: 'New Puppy Nutrition Path', topicSlug: 'fresh', steps: ['Puppy food basics', 'Feeding schedule', 'Portion control', 'Transitioning foods', 'Growth monitoring'], color: 'green' },
    { title: 'Weight Management Path', topicSlug: 'special', steps: ['Assess body condition', 'Calculate calories', 'Choose diet food', 'Measure portions', 'Track progress'], color: 'orange' },
    { title: 'Allergy Discovery Path', topicSlug: 'special', steps: ['Identify symptoms', 'Elimination diet', 'Novel proteins', 'Reintroduce foods', 'Maintenance plan'], color: 'blue' },
    { title: 'Fresh Food Transition Path', topicSlug: 'fresh', steps: ['Why fresh food', 'Choose a brand', 'Gradual transition', 'Monitor digestion', 'Adjust portions'], color: 'emerald' },
    { title: 'Senior Dog Nutrition Path', topicSlug: 'special', steps: ['Senior needs', 'Joint supplements', 'Digestibility', 'Calorie reduction', 'Regular checkups'], color: 'purple' },
    { title: 'Homemade Meals Path', topicSlug: 'fresh', steps: ['Nutritional balance', 'Safe ingredients', 'Recipe basics', 'Portion planning', 'Supplement needs'], color: 'amber' }
  ];

  // ═══════════════════════════════════════════════════════════════════════════════
  // GOLD STANDARD: DAILY NUTRITION TIP - Rotates based on day
  // ═══════════════════════════════════════════════════════════════════════════════
  const dailyNutritionTips = [
    { category: 'Portions', tip: 'Measure your dog\'s food precisely. Even small overfeeding daily adds up to significant weight gain over months. Use a kitchen scale for accuracy.', icon: UtensilsCrossed },
    { category: 'Hydration', tip: 'Dogs need about 1 oz of water per pound of body weight daily. Add water to dry food or offer bone broth to increase hydration.', icon: Coffee },
    { category: 'Transitions', tip: 'When switching foods, transition over 7-10 days. Start with 25% new food, gradually increasing to avoid digestive upset.', icon: ChefHat },
    { category: 'Treats', tip: 'Treats should be no more than 10% of daily calories. A 30lb dog on 800 calories means only 80 calories in treats.', icon: Heart },
    { category: 'Timing', tip: 'Feed adult dogs twice daily at consistent times. Puppies need 3-4 meals. Avoid exercise 1 hour before and after meals.', icon: Clock },
    { category: 'Fresh', tip: 'Fresh food should be served at room temperature. Refrigerated meals should sit out for 10-15 minutes before feeding.', icon: Leaf },
    { category: 'Allergies', tip: 'Common food allergens are beef, dairy, wheat, chicken, and eggs. If your dog has skin issues, a novel protein diet may help.', icon: AlertCircle }
  ];
  
  const todaysTip = dailyNutritionTips[new Date().getDay() % dailyNutritionTips.length];

  return (
    <PillarPageLayout
      pillar="dine"
      title={activePet ? `Dine for ${activePet.name}` : "Food & Treats for Your Pet"}
      description={activePet ? `Chosen around ${activePet.name}'s taste, energy, and needs` : "Discover nutritious fresh meals and pet-friendly restaurants for your furry friend."}
    >
      {/* Main Content */}
      <div className="pb-24 theme-dine" data-testid="dine-page">
      
      {/* ═══════════════════════════════════════════════════════════════════════════════
          1. HERO SECTION: ASK MIRA BAR - CMS DRIVEN (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.askMira?.enabled !== false && (
        <section className="py-8 px-4 bg-gradient-to-b from-orange-50 to-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="dine-page-title">
                {pageTitle}
              </h1>
              <p className="text-gray-600 mt-2">{cmsConfig.subtitle || 'Fresh food, treats, nutrition plans & dietary guidance'}</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 shadow-sm p-1.5 pl-5">
                <MessageCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Input
                  value={askMiraQuestion}
                  onChange={(e) => setAskMiraQuestion(e.target.value)}
                  placeholder={cmsConfig.askMira?.placeholder || "Best food for puppies · homemade treats recipe · weight management"}
                  className="flex-1 border-0 focus-visible:ring-0 text-sm placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskMira()}
                  data-testid="ask-dine-input"
                />
                <Button
                  onClick={handleAskMira}
                  disabled={askMiraLoading || !askMiraQuestion.trim()}
                  className={`rounded-full ${cmsConfig.askMira?.buttonColor || 'bg-orange-500'} hover:opacity-90 h-10 w-10 p-0`}
                >
                  {askMiraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          2. TOPIC BOXES - CMS DRIVEN (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.categories?.enabled !== false && (
        <PillarTopicsGrid
          pillar="dine"
          topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.dine}
          columns={4}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          3. DAILY NUTRITION TIP - Rotates based on day (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <section className="py-6 px-4 bg-gradient-to-r from-orange-50 to-amber-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-orange-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <todaysTip.icon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-orange-100 text-orange-700 text-xs">Today's Nutrition Tip</Badge>
                <span className="text-xs text-gray-500">{todaysTip.category}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{todaysTip.tip}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          4. HOW CAN WE HELP? - Action Buckets (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.helpBuckets?.enabled !== false && (
        <section className="py-10 px-4 bg-stone-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">How can we help?</h2>
              <p className="text-gray-600 mt-1">Choose what matters most to you right now</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {helpBuckets.map((bucket, idx) => {
                const iconMap = { Utensils: UtensilsCrossed, Heart, Gift, Sparkles, Star };
                const BucketIcon = iconMap[bucket.icon] || Heart;
                const colorMap = {
                  'green': { bg: 'bg-gradient-to-br from-green-50 to-emerald-50', border: 'border-green-100', icon: 'bg-green-100', iconColor: 'text-green-600', dot: 'bg-green-400' },
                  'blue': { bg: 'bg-gradient-to-br from-blue-50 to-cyan-50', border: 'border-blue-100', icon: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-400' },
                  'pink': { bg: 'bg-gradient-to-br from-pink-50 to-rose-50', border: 'border-pink-100', icon: 'bg-pink-100', iconColor: 'text-pink-600', dot: 'bg-pink-400' }
                };
                const colors = colorMap[bucket.color] || colorMap.green;
                
                return (
                  <Card 
                    key={bucket.id || idx}
                    className={`p-5 ${colors.bg} ${colors.border} rounded-2xl cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openMiraAI', {
                        detail: { message: bucket.items?.join(', ') || bucket.title, context: 'dine', pillar: 'dine' }
                      }));
                    }}
                    data-testid={`help-bucket-${idx}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center`}>
                        <BucketIcon className={`w-5 h-5 ${colors.iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{bucket.title}</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {(bucket.items || []).map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-center gap-2">
                          <span className={`w-1 h-1 ${colors.dot} rounded-full`} />{item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          SOUL PERSONALIZATION SECTION - THE CENTERPIECE
          The Pet Operating System layer - deeply personalized to the pet's soul
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <SoulPersonalizationSection pillar="dine" />

      {/* ═══════════════════════════════════════════════════════════════════════════════
          5. DINE FOR MY DOG - Personalized Section (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {activePet && token && (
        <div className="py-12 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/50">
          <div className="max-w-6xl mx-auto px-4">
            <Card className="p-6 md:p-8 bg-white/95 backdrop-blur rounded-3xl border-0 shadow-xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Nutrition for {activePet.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  Personalized meal recommendations for your {activePet.breed || 'pet'}
                </p>
              </div>
              
              <TummyProfileDashboard
                pet={activePet}
                onEditProfile={() => window.location.href = `/soul-builder/${activePet.id}`}
              />
            </Card>

            <div className="mt-8" data-testid="dine-personalized-picks-top">
              <PersonalizedPicks pillar="dine" maxProducts={8} />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          6. GUIDED NUTRITION PATHS - Step-by-step journeys (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div id="guided-paths" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <ChefHat className="w-4 h-4" />
              Step-by-Step Journeys
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Guided Nutrition Paths</h2>
            <p className="text-gray-600 mt-2">Follow a structured journey tailored to your needs</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {guidedPaths.map((path, idx) => (
              <Card 
                key={idx}
                className="p-5 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openMiraAI', {
                    detail: { message: `Guide me through ${path.title}`, context: 'dine', pillar: 'dine' }
                  }));
                }}
                data-testid={`guided-path-${idx}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${path.color}-100`}>
                    <ChefHat className={`w-5 h-5 text-${path.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{path.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {path.steps.slice(0, 4).map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className={`w-1.5 h-1.5 rounded-full bg-${path.color}-400`}></div>
                      {step}
                    </li>
                  ))}
                  {path.steps.length > 4 && (
                    <li className="text-xs text-orange-600">+{path.steps.length - 4} more steps</li>
                  )}
                </ul>
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-gray-500">{path.steps.length} steps</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          7. CURATED BUNDLES - Save with handpicked combinations (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="py-12 bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              {activePet?.name ? `${activePet.name}'s` : 'Pet'} Food Bundles
            </h2>
            <p className="text-gray-600 mt-1">Complete nutrition solutions at great value</p>
          </div>
          <CuratedBundles pillar="dine" maxBundles={3} showTitle={false} /> */}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          8. DINE PRODUCTS SECTION - Food & Nutrition Products (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <section id="dine-products" className="py-8 px-4 bg-gradient-to-b from-amber-50 to-white" data-testid="dine-products-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {activePet?.breed 
                ? `${activePet.breed} Food Products for ${activePet.name}` 
                : `Food Products for ${activePet?.name || 'Your Pet'}`}
            </h2>
          </div>
          
          {/* Soul Made Collection */}
          {activePet && (
            <div className="mb-8">
              {/* <SoulMadeCollection pillar="dine" maxItems={8} showTitle={true} /> */}
            </div>
          )}
          
          {/* Breed-Smart Recommendations */}
          {activePet && (
            <div className="mb-8">
              <BreedSmartRecommendations pillar="dine" />
            </div>
          )}
          
          {/* Archetype Products */}
          <div className="mb-8">
            <ArchetypeProducts pillar="dine" maxProducts={8} showTitle={true} /> */}
          </div>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => navigate('/shop?pillar=dine')}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              View All Food Products <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          10. MIRA CURATED LAYER - Unified Concierge® (Gold Standard)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <MiraCuratedLayer
        pillar="dine"
        activePet={activePet}
        token={token}
        userEmail={authUser?.email || user?.email}
        isLoading={false}
      />

      {/* ═══════════════════════════════════════════════════════════════════════════════
          11. NEARBY PET-FRIENDLY SPOTS - Separate from services
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-gradient-to-br from-amber-50 to-orange-50" data-testid="dine-nearby-section">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              Nearby Pet-Friendly Spots
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Pet-Friendly Dining Nearby</h2>
            <p className="text-gray-600 mt-2">Live cafes and dining spots that welcome your pet</p>
          </div>
          
          <NearbyPlacesCarousel
            places={nearbyCafes}
            title={selectedNearbyCity ? `Nearby Pet-Friendly Spots in ${selectedNearbyCity}` : 'Nearby Pet-Friendly Spots'}
            subtitle="Live cafes and dining spots that welcome your pet"
            loading={nearbyLoading}
            onReserveClick={(place) => {
              window.dispatchEvent(new CustomEvent('openMiraAI', {
                detail: {
                  message: `Help me reserve ${place.name} for pet-friendly dining${activePet?.name ? ` for ${activePet.name}` : ''}.`,
                  context: 'dine',
                  pillar: 'dine'
                }
              }));
            }}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          12. SERVICES - Illustrated concierge services below nearby places
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div id="services" data-testid="dine-services-section">
        <ServiceCatalogSection
          pillar="dine"
          title="Dining Concierge® Services"
          subtitle="Illustrated concierge-led support for reservations, celebrations, catering, and nutrition guidance"
          maxServices={8}
          hidePrice={true}
        />
      </div>

      </div>
    </PillarPageLayout>
  );
};

export default DinePage;

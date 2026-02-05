import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { SlidersHorizontal, Loader2, ChevronDown, Sparkles, PawPrint, Cake, Gift, Star, Heart, MapPin, Shield, Activity, Droplets, Brain, HeartPulse, X, Check } from 'lucide-react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { API_URL, getApiUrl } from '../utils/api';
import MiraChatWidget from '../components/MiraChatWidget';
import CelebrateConcierePicker from '../components/CelebrateConcierePicker';
import { useAuth } from '../context/AuthContext';
import SEOHead from '../components/SEOHead';

const PRODUCTS_PER_PAGE = 20;

// Hero images for different categories
const CATEGORY_HERO_IMAGES = {
  cakes: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
  'breed-cakes': 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=1200&q=80',
  treats: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
  hampers: 'https://images.unsplash.com/photo-1530041539828-114de669390e?w=1200&q=80',
  desi: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80',
  'frozen-treats': 'https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=1200&q=80',
  'mini-cakes': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80',
  dognuts: 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=1200&q=80',
  valentine: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&q=80',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80',
  'cat-treats': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1200&q=80'
};

// Hero content for different categories
const CATEGORY_HERO_CONTENT = {
  cakes: {
    badge: 'Celebrate with Love',
    title: 'Birthday Cakes',
    highlight: 'Made with Joy',
    subtitle: 'Freshly baked, 100% pet-safe cakes for your furry friend\'s special day',
    color: 'from-pink-600 via-rose-500 to-orange-500'
  },
  'breed-cakes': {
    badge: 'Custom Designs',
    title: 'Breed-Specific',
    highlight: 'Cakes',
    subtitle: 'Cakes shaped like your beloved breed - from Labradors to Pugs!',
    color: 'from-purple-600 via-violet-500 to-pink-500'
  },
  Birthdays: {
    badge: 'Celebrate with Love',
    title: 'Birthday Cakes',
    highlight: 'Made Fresh',
    subtitle: '100% pet-safe, freshly baked cakes for your furry friend\'s special day',
    color: 'from-pink-600 via-rose-500 to-orange-500'
  },
  // DINE PILLAR HERO CONTENT
  'fresh-meals': {
    badge: 'Freshly Made',
    title: 'Fresh',
    highlight: 'Meals 🍽️',
    subtitle: 'Nutritious, home-cooked meals delivered fresh to your doorstep',
    color: 'from-emerald-600 via-teal-500 to-green-500'
  },
  meals: {
    badge: 'Freshly Made',
    title: 'Fresh',
    highlight: 'Meals 🍽️',
    subtitle: 'Nutritious, home-cooked meals delivered fresh to your doorstep',
    color: 'from-emerald-600 via-teal-500 to-green-500'
  },
  'pizzas-burgers': {
    badge: 'Fun Favorites',
    title: 'Pizzas &',
    highlight: 'Burgers 🍕',
    subtitle: 'Pet-safe versions of your favorite comfort foods!',
    color: 'from-red-600 via-orange-500 to-yellow-500'
  },
  treats: {
    badge: 'Healthy & Delicious',
    title: 'Treats &',
    highlight: 'Snacks',
    subtitle: 'Training treats, healthy bites, and everyday rewards your pet will love',
    color: 'from-amber-600 via-orange-500 to-yellow-500'
  },
  accessories: {
    badge: 'Party Essentials',
    title: 'Party',
    highlight: 'Accessories',
    subtitle: 'Bandanas, hats, toys and everything to make your pet\'s party special!',
    color: 'from-rose-600 via-pink-500 to-purple-500'
  },
  hampers: {
    badge: 'Perfect Gifts',
    title: 'Celebration',
    highlight: 'Hampers',
    subtitle: 'Complete party boxes with cakes, treats, bandanas, and toys!',
    color: 'from-emerald-600 via-teal-500 to-cyan-500'
  },
  desi: {
    badge: 'Indian Flavors',
    title: 'Desi Doggy',
    highlight: 'Treats 🪔',
    subtitle: 'Traditional Indian sweets made pet-friendly - perfect for festivals!',
    color: 'from-orange-600 via-amber-500 to-yellow-500'
  },
  'desi-treats': {
    badge: 'Indian Flavors',
    title: 'Desi Doggy',
    highlight: 'Treats 🪔',
    subtitle: 'Traditional Indian sweets made pet-friendly - perfect for festivals!',
    color: 'from-orange-600 via-amber-500 to-yellow-500'
  },
  'frozen-treats': {
    badge: 'Beat the Heat',
    title: 'Frozen',
    highlight: 'Delights',
    subtitle: 'Cool, refreshing ice creams and frozen treats for hot days',
    color: 'from-cyan-600 via-blue-500 to-indigo-500'
  },
  'mini-cakes': {
    badge: 'Bite-Sized Joy',
    title: 'Bowto',
    highlight: 'Cakes',
    subtitle: 'Mini celebration cakes perfect for any occasion',
    color: 'from-rose-600 via-pink-500 to-purple-500'
  },
  dognuts: {
    badge: 'Fun Shapes',
    title: 'Pupcakes &',
    highlight: 'Dognuts',
    subtitle: 'Adorable mini baked treats - cupcakes and donuts for dogs!',
    color: 'from-pink-600 via-rose-500 to-red-500'
  },
  valentine: {
    badge: 'Share the Love',
    title: 'Valentine',
    highlight: 'Collection 💕',
    subtitle: 'Show your pet how much you love them with our special collection',
    color: 'from-red-600 via-rose-500 to-pink-500'
  },
  cat: {
    badge: 'For Felines',
    title: 'Cat',
    highlight: 'Treats 🐱',
    subtitle: 'Special treats crafted for our feline friends',
    color: 'from-violet-600 via-purple-500 to-indigo-500'
  },
  'cat-treats': {
    badge: 'For Felines',
    title: 'Cat',
    highlight: 'Treats 🐱',
    subtitle: 'Special treats crafted for our feline friends',
    color: 'from-violet-600 via-purple-500 to-indigo-500'
  },
  default: {
    badge: 'Celebrate Every Moment',
    title: 'Celebrate',
    highlight: 'With Your Pet 🎉',
    subtitle: 'Cakes, treats, and celebration essentials for your furry family',
    color: 'from-purple-600 via-pink-500 to-rose-500'
  }
};

// Map category to pillar for Mira panel
const CATEGORY_TO_PILLAR = {
  'cakes': 'celebrate',
  'custom': 'celebrate',
  'breed-cakes': 'celebrate',
  'treats': 'celebrate',
  'desi': 'celebrate',
  'desi-treats': 'celebrate',
  'hampers': 'celebrate',
  'meals': 'dine',
  'fresh-meals': 'dine',
  'frozen': 'celebrate',
  'frozen-treats': 'celebrate',
  'mini-cakes': 'celebrate',
  'dognuts': 'celebrate',
  'pizzas-burgers': 'dine',
  'merchandise': 'shop',
  'accessories': 'shop',
  'nut-butters': 'shop',
  'pan-india': 'shop',
  'cat': 'shop',
  'cat-treats': 'shop',
  'valentine': 'celebrate',
  'autoship': 'shop',
  'all': 'shop',
  // Extended pillar mappings
  'enjoy': 'enjoy',
  'adventure': 'enjoy',
  'travel': 'travel',
  'carriers': 'travel',
  'care': 'care',
  'health': 'care',
  'supplements': 'care',
  'fit': 'fit',
  'wellness': 'fit'
};

// ============================================
// PILLAR-SPECIFIC PET SOUL MESSAGING
// Each pillar has unique emotional context for recommendations
// ============================================

const PILLAR_RECOMMENDATION_CONFIG = {
  celebrate: {
    icon: '🎂',
    title: (petName) => `Perfect picks for ${petName}!`,
    subtitle: (pet) => `Based on ${pet.name}'s profile • ${pet.breed || 'Mixed'} • ${pet.age ? `${pet.age}y` : 'Age unknown'}`,
    bgColor: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-200',
    accentColor: 'text-amber-900',
    badgeColor: 'bg-amber-500'
  },
  dine: {
    icon: '🍽️',
    title: (petName) => `Meals suited to ${petName}'s dietary needs`,
    subtitle: (pet) => `Personalized for ${pet.name} • ${pet.weight ? `${pet.weight}kg` : ''} ${pet.breed || 'Mixed'}`,
    bgColor: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    accentColor: 'text-emerald-900',
    badgeColor: 'bg-emerald-500'
  },
  care: {
    icon: '💊',
    title: (petName) => `Health products for ${petName}'s wellness`,
    subtitle: (pet) => `Supporting ${pet.name}'s health journey • ${pet.breed || 'Mixed'}`,
    bgColor: 'from-blue-50 to-cyan-50',
    borderColor: 'border-blue-200',
    accentColor: 'text-blue-900',
    badgeColor: 'bg-blue-500'
  },
  enjoy: {
    icon: '🎾',
    title: (petName) => `Adventure essentials for ${petName}`,
    subtitle: (pet) => `Everything ${pet.name} needs for the perfect outing`,
    bgColor: 'from-purple-50 to-pink-50',
    borderColor: 'border-purple-200',
    accentColor: 'text-purple-900',
    badgeColor: 'bg-purple-500'
  },
  travel: {
    icon: '✈️',
    title: (petName) => `Travel gear for ${petName}'s journey`,
    subtitle: (pet) => `Safe & comfortable travel for ${pet.name} • ${pet.weight ? `${pet.weight}kg` : ''}`,
    bgColor: 'from-sky-50 to-indigo-50',
    borderColor: 'border-sky-200',
    accentColor: 'text-sky-900',
    badgeColor: 'bg-sky-500'
  },
  fit: {
    icon: '💪',
    title: (petName) => `Fitness picks for ${petName}`,
    subtitle: (pet) => `Keep ${pet.name} active & healthy • ${pet.breed || 'Mixed'}`,
    bgColor: 'from-lime-50 to-green-50',
    borderColor: 'border-lime-200',
    accentColor: 'text-lime-900',
    badgeColor: 'bg-lime-600'
  },
  shop: {
    icon: '🛍️',
    title: (petName) => `Curated for ${petName}`,
    subtitle: (pet) => `Handpicked based on ${pet.name}'s profile`,
    bgColor: 'from-rose-50 to-pink-50',
    borderColor: 'border-rose-200',
    accentColor: 'text-rose-900',
    badgeColor: 'bg-rose-500'
  },
  default: {
    icon: '🐾',
    title: (petName) => `Perfect picks for ${petName}!`,
    subtitle: (pet) => `Based on ${pet.name}'s profile`,
    bgColor: 'from-gray-50 to-slate-50',
    borderColor: 'border-gray-200',
    accentColor: 'text-gray-900',
    badgeColor: 'bg-gray-500'
  }
};

const getPillarRecommendationConfig = (pillar) => {
  return PILLAR_RECOMMENDATION_CONFIG[pillar] || PILLAR_RECOMMENDATION_CONFIG.default;
};

// ============================================
// PILLAR-SPECIFIC SUPPORT FILTERS
// Rule: Support filters must mirror the emotional state of the page
// ============================================

const CELEBRATE_SUPPORT = [
  { id: 'sensitive-stomach', label: 'Celebration-safe', icon: Sparkles, desc: 'Gentle on digestion' },
  { id: 'allergy-friendly', label: 'Allergy-aware', icon: Shield, desc: 'Limited ingredients' },
  { id: 'calming', label: 'Calm moments', icon: Brain, desc: 'Low excitement treats' },
  { id: 'recovery', label: 'Extra care', icon: HeartPulse, desc: 'Special care needs' }
];

const DINE_SUPPORT = [
  { id: 'sensitive-stomach', label: 'Sensitive tummy', icon: Droplets, desc: 'Gentle on digestion' },
  { id: 'weight', label: 'Weight-friendly', icon: Activity, desc: 'Portion controlled' },
  { id: 'high-protein', label: 'High protein', icon: Star, desc: 'Muscle support' },
  { id: 'allergy-friendly', label: 'Allergy-safe', icon: Shield, desc: 'Limited ingredients' },
  { id: 'grain-free', label: 'Grain-free', icon: Heart, desc: 'No grains added' }
];

const TRAVEL_SUPPORT = [
  { id: 'sensitive-stomach', label: 'Travel-friendly', icon: Droplets, desc: 'Easy on digestion' },
  { id: 'calming', label: 'Journey calm', icon: Brain, desc: 'Anxiety support' },
  { id: 'allergy-friendly', label: 'Safe snacking', icon: Shield, desc: 'Limited ingredients' },
  { id: 'hydration', label: 'Hydration help', icon: Droplets, desc: 'Moisture-rich' }
];

const CARE_SUPPORT = [
  { id: 'sensitive-stomach', label: 'Sensitive tummy', icon: Droplets, desc: 'Gentle on digestion' },
  { id: 'skin-coat', label: 'Skin & coat', icon: Sparkles, desc: 'For healthy shine' },
  { id: 'weight', label: 'Weight support', icon: Activity, desc: 'Healthy weight management' },
  { id: 'joints', label: 'Joint care', icon: Heart, desc: 'Mobility & comfort' },
  { id: 'calming', label: 'Calming', icon: Brain, desc: 'For anxious moments' },
  { id: 'allergy-friendly', label: 'Allergy-friendly', icon: Shield, desc: 'Limited ingredients' }
];

const ENJOY_SUPPORT = [
  { id: 'high-energy', label: 'High energy', icon: Activity, desc: 'Active play fuel' },
  { id: 'portable', label: 'On-the-go', icon: MapPin, desc: 'Easy to carry' },
  { id: 'allergy-friendly', label: 'Safe outdoors', icon: Shield, desc: 'Limited ingredients' },
  { id: 'hydration', label: 'Hydrating', icon: Droplets, desc: 'Moisture-rich' }
];

const FIT_SUPPORT = [
  { id: 'weight', label: 'Weight control', icon: Activity, desc: 'Low calorie' },
  { id: 'high-protein', label: 'Lean protein', icon: Star, desc: 'Muscle building' },
  { id: 'joints', label: 'Joint support', icon: Heart, desc: 'Mobility & comfort' },
  { id: 'energy', label: 'Energy boost', icon: Sparkles, desc: 'Active lifestyle' }
];

const PILLAR_SUPPORT_FILTERS = {
  celebrate: CELEBRATE_SUPPORT,
  birthday: CELEBRATE_SUPPORT,
  cakes: CELEBRATE_SUPPORT,
  hampers: CELEBRATE_SUPPORT,
  accessories: CELEBRATE_SUPPORT,
  treats: CELEBRATE_SUPPORT,
  dine: DINE_SUPPORT,
  meals: DINE_SUPPORT,
  'fresh-meals': DINE_SUPPORT,
  'pizzas-burgers': DINE_SUPPORT,
  travel: TRAVEL_SUPPORT,
  care: CARE_SUPPORT,
  health: CARE_SUPPORT,
  supplements: CARE_SUPPORT,
  enjoy: ENJOY_SUPPORT,
  adventure: ENJOY_SUPPORT,
  fit: FIT_SUPPORT,
  wellness: FIT_SUPPORT,
  default: CELEBRATE_SUPPORT
};

const getSupportFilters = (category, pillar) => {
  if (PILLAR_SUPPORT_FILTERS[category]) return PILLAR_SUPPORT_FILTERS[category];
  if (PILLAR_SUPPORT_FILTERS[pillar]) return PILLAR_SUPPORT_FILTERS[pillar];
  return PILLAR_SUPPORT_FILTERS.default;
};

const ProductListing = ({ category = 'all' }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const searchQuery = searchParams.get('search');
  const { user, token } = useAuth();
  
  // Determine the SEO page type based on category and path
  const getSeoPage = () => {
    const path = location.pathname;
    if (path.includes('/celebrate') || category === 'cakes') return 'celebrate';
    if (path.includes('/cakes')) return 'cakes';
    if (path.includes('/treats')) return 'treats';
    return 'shop';
  };
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petRecommendations, setPetRecommendations] = useState([]);
  const [personalizedMessage, setPersonalizedMessage] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('all');
  const [detectedCity, setDetectedCity] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Additional filters for Celebrate products
  const [selectedBreed, setSelectedBreed] = useState('all');
  const [selectedShape, setSelectedShape] = useState('all');
  const [availableBreeds, setAvailableBreeds] = useState([]);
  const [availableShapes, setAvailableShapes] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  
  // NEW: Support filters state (for Mira-driven personalization)
  const [activeSupportFilters, setActiveSupportFilters] = useState([]);
  const [showSupportFilters, setShowSupportFilters] = useState(false);

  // Check if this is a cake category that needs availability filter
  const isCakeCategory = ['cakes', 'breed-cakes', 'custom', 'birthday-cakes', 'pupcakes', 'dognuts', 'mini-cakes'].includes(category);
  
  // Check if this is breed cakes - needs breed filter
  const isBreedCakeCategory = category === 'breed-cakes';
  
  // Check if this needs shape filter (birthday cakes, cakes)
  const needsShapeFilter = ['cakes', 'birthday-cakes', 'Birthdays'].includes(category);

  // Available cities for fresh delivery
  const FRESH_DELIVERY_CITIES = [
    { value: 'all', label: 'All Availability' },
    { value: 'bangalore', label: '🏙️ Bangalore (Fresh)' },
    { value: 'mumbai', label: '🏙️ Mumbai (Fresh)' },
    { value: 'delhi ncr', label: '🏙️ Delhi NCR (Fresh)' },
    { value: 'pan-india', label: '📦 Pan-India Only' },
  ];

  // Location detection function
  const detectLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      return;
    }
    
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const city = data.address?.city || data.address?.town || data.address?.state_district || '';
          const cityLower = city.toLowerCase();
          
          let matchedCity = null;
          if (cityLower.includes('bangalore') || cityLower.includes('bengaluru')) {
            matchedCity = 'bangalore';
          } else if (cityLower.includes('mumbai')) {
            matchedCity = 'mumbai';
          } else if (cityLower.includes('delhi') || cityLower.includes('noida') || cityLower.includes('gurgaon') || cityLower.includes('gurugram')) {
            matchedCity = 'delhi ncr';
          }
          
          if (matchedCity) {
            setDetectedCity(matchedCity);
            setDeliveryCity(matchedCity);
          } else {
            setDetectedCity('other');
          }
        } catch (err) {
          console.error('Failed to detect location:', err);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  // Auto-detect location on mount for cake categories
  useEffect(() => {
    if (isCakeCategory && !detectedCity) {
      detectLocation();
    }
  }, [isCakeCategory]);

  // Get the pillar for this category
  const pillar = CATEGORY_TO_PILLAR[category] || 'shop';

  // Fetch user's pets for personalization
  useEffect(() => {
    const fetchPets = async () => {
      if (token) {
        try {
          const res = await fetch(`${getApiUrl()}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserPets(data.pets || []);
            
            if (data.pets && data.pets.length > 0) {
              const pet = data.pets[0];
              setSelectedPet(pet);
              
              const messages = [
                `🎂 Perfect picks for ${pet.name}!`,
                `${pet.name} would love these! 🐾`,
                `${pet.name}'s tail will wag for these! 🎉`,
                `Made with love for ${pet.name}! 💕`,
              ];
              setPersonalizedMessage(messages[Math.floor(Math.random() * messages.length)]);
              
              // Auto-apply support filters based on pet profile
              const autoFilters = [];
              const allergies = pet?.doggy_soul_answers?.food_allergies || pet?.preferences?.allergies || [];
              if (Array.isArray(allergies) && allergies.length > 0 && !allergies.includes('No') && !allergies.includes('None')) {
                autoFilters.push('allergy-friendly');
              }
              if (pet?.health?.digestive_issues || pet?.doggy_soul_answers?.digestive_sensitivity) {
                autoFilters.push('sensitive-stomach');
              }
              if (pet?.health?.anxiety || pet?.doggy_soul_answers?.anxiety_level === 'high') {
                autoFilters.push('calming');
              }
              if (autoFilters.length > 0) {
                setActiveSupportFilters(autoFilters);
              }
              
              try {
                const recRes = await fetch(`${getApiUrl()}/api/products/recommendations/for-pet/${pet.id}?limit=8`);
                if (recRes.ok) {
                  const recData = await recRes.json();
                  setPetRecommendations(recData.recommendations || []);
                }
              } catch (recErr) {
                console.debug('Could not fetch recommendations:', recErr);
              }
            }
          }
        } catch (err) {
          console.debug('Failed to fetch pets:', err);
        }
      }
    };
    fetchPets();
  }, [token]);
  
  // Fetch recommendations when pet changes
  const handlePetChange = async (petId) => {
    const pet = userPets.find(p => p.id === petId);
    if (pet) {
      setSelectedPet(pet);
      setPersonalizedMessage(`🎂 Perfect picks for ${pet.name}!`);
      
      try {
        const recRes = await fetch(`${getApiUrl()}/api/products/recommendations/for-pet/${pet.id}?limit=8`);
        if (recRes.ok) {
          const recData = await recRes.json();
          setPetRecommendations(recData.recommendations || []);
        }
      } catch (err) {
        console.debug('Could not fetch recommendations:', err);
      }
    }
  };
  
  // Listen for pet selection changes from navbar
  useEffect(() => {
    const handleNavbarPetChange = (e) => {
      const newPetId = e.detail?.petId;
      if (newPetId && userPets.length > 0) {
        handlePetChange(newPetId);
      }
    };
    
    window.addEventListener('petSelectionChanged', handleNavbarPetChange);
    return () => window.removeEventListener('petSelectionChanged', handleNavbarPetChange);
  }, [userPets]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        if (category === 'pan-india') {
          const categories = ['pan-india', 'treats', 'desi-treats', 'nut-butters'];
          const allProducts = [];
          
          for (const cat of categories) {
            try {
              const response = await fetch(`${getApiUrl()}/api/products?limit=500&category=${cat}`);
              if (response.ok) {
                const data = await response.json();
                allProducts.push(...(data.products || []));
              }
            } catch (fetchError) {
              console.warn(`Failed to fetch ${cat} products:`, fetchError);
            }
          }
          
          const uniqueProducts = allProducts.filter((product, index, self) =>
            product && product.id && index === self.findIndex((p) => p && p.id === product.id)
          );
          
          setProducts(uniqueProducts);
        } else if (category === 'autoship') {
          const response = await fetch(`${getApiUrl()}/api/products?limit=500&autoship_enabled=true`);
          if (response.ok) {
            const data = await response.json();
            const autoshipProducts = (data.products || []).filter(p => p && p.autoship_enabled === true);
            setProducts(autoshipProducts);
          } else {
            setProducts([]);
          }
        } else {
          let url = `${API_URL}/api/products?limit=500`;
          if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
          } else if (category && category !== 'all') {
            const collectionCategories = ['valentine', 'seasonal', 'bestsellers'];
            if (collectionCategories.includes(category.toLowerCase())) {
              url += `&collection=${category}`;
            } else {
              url += `&category=${category}`;
            }
          }
          
          if (isCakeCategory && deliveryCity && deliveryCity !== 'all') {
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
            const validProducts = productsArray.filter(p => p !== null && p !== undefined);
            setProducts(validProducts);
            
            // Extract unique breeds and shapes from products for filters
            const breeds = new Set();
            const shapes = new Set();
            
            validProducts.forEach(product => {
              const productTags = product.tags || [];
              const productName = (product.name || '').toLowerCase();
              
              const breedPatterns = ['labrador', 'golden retriever', 'pug', 'beagle', 'husky', 'german shepherd', 
                'bulldog', 'poodle', 'rottweiler', 'dachshund', 'shih tzu', 'boxer', 'doberman', 
                'great dane', 'chihuahua', 'corgi', 'dalmatian', 'pomeranian', 'indie', 'spitz'];
              
              breedPatterns.forEach(breed => {
                if (productName.includes(breed) || productTags.some(t => (t || '').toLowerCase().includes(breed))) {
                  breeds.add(breed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
                }
              });
              
              const shapePatterns = ['round', 'square', 'heart', 'bone', 'paw', 'star', 'number', 'letter', 'custom'];
              
              shapePatterns.forEach(shape => {
                if (productName.includes(shape) || productTags.some(t => (t || '').toLowerCase().includes(shape))) {
                  shapes.add(shape.charAt(0).toUpperCase() + shape.slice(1));
                }
              });
            });
            
            setAvailableBreeds(['all', ...Array.from(breeds).sort()]);
            setAvailableShapes(['all', ...Array.from(shapes).sort()]);
          } else {
            console.error('Failed to fetch products, status:', response.status);
            setProducts([]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [category, searchQuery, deliveryCity, isCakeCategory]);

  // Use a key-based approach to reset visible count
  const filterKey = `${category}-${searchQuery}-${priceRange}-${sortBy}-${selectedBreed}-${selectedShape}-${searchInput}-${activeSupportFilters.join(',')}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setVisibleCount(PRODUCTS_PER_PAGE);
  }

  let filteredProducts = [...products].filter(p => p !== null && p !== undefined);

  // PET SOUL FILTERING - Filter out products based on pet's allergies/restrictions
  const activePet = userPets?.[0];
  
  const rawAllergies = activePet?.doggy_soul_answers?.food_allergies || 
                       activePet?.preferences?.allergies || 
                       activePet?.health?.allergies;
  const petAllergies = Array.isArray(rawAllergies) ? rawAllergies : [];
  
  if (petAllergies.length > 0 && !petAllergies.includes('No') && !petAllergies.includes('None')) {
    const allergyKeywords = petAllergies.map(a => (a || '').toLowerCase()).filter(a => a && a !== 'no' && a !== 'none' && a !== 'other');
    
    if (allergyKeywords.length > 0) {
      filteredProducts = filteredProducts.filter(product => {
        if (!product) return false;
        const productName = (product.name || product.title || '').toLowerCase();
        const productDesc = (product.description || '').toLowerCase();
        const productIngredients = (product.ingredients || '').toLowerCase();
        const productTags = Array.isArray(product.tags) ? product.tags.map(t => (t || '').toLowerCase()).join(' ') : '';
        
        const hasAllergen = allergyKeywords.some(allergen => 
          productName.includes(allergen) || 
          productDesc.includes(allergen) || 
          productIngredients.includes(allergen) ||
          productTags.includes(allergen)
        );
        
        return !hasAllergen;
      });
    }
  }

  // Filter by price range
  if (priceRange === 'under500') {
    filteredProducts = filteredProducts.filter(p => (p.price || p.minPrice || 0) < 500);
  } else if (priceRange === '500-1000') {
    filteredProducts = filteredProducts.filter(p => {
      const price = p.price || p.minPrice || 0;
      return price >= 500 && price <= 1000;
    });
  } else if (priceRange === 'over1000') {
    filteredProducts = filteredProducts.filter(p => (p.price || p.minPrice || 0) > 1000);
  }
  
  // Filter by breed (for breed-cakes category)
  if (selectedBreed !== 'all' && isBreedCakeCategory) {
    const breedLower = selectedBreed.toLowerCase();
    filteredProducts = filteredProducts.filter(p => {
      const productName = (p.name || '').toLowerCase();
      const productTags = Array.isArray(p.tags) ? p.tags.map(t => (t || '').toLowerCase()) : [];
      return productName.includes(breedLower) || productTags.some(t => t.includes(breedLower));
    });
  }
  
  // Filter by shape (for birthday cakes)
  if (selectedShape !== 'all' && needsShapeFilter) {
    const shapeLower = selectedShape.toLowerCase();
    filteredProducts = filteredProducts.filter(p => {
      const productName = (p.name || '').toLowerCase();
      const productTags = Array.isArray(p.tags) ? p.tags.map(t => (t || '').toLowerCase()) : [];
      return productName.includes(shapeLower) || productTags.some(t => t.includes(shapeLower));
    });
  }
  
  // Filter by search input
  if (searchInput.trim()) {
    const searchLower = searchInput.toLowerCase().trim();
    filteredProducts = filteredProducts.filter(p => {
      const productName = (p.name || '').toLowerCase();
      const productTags = Array.isArray(p.tags) ? p.tags.map(t => (t || '').toLowerCase()).join(' ') : '';
      const productDesc = (p.description || '').toLowerCase();
      return productName.includes(searchLower) || productTags.includes(searchLower) || productDesc.includes(searchLower);
    });
  }
  
  // NEW: Filter by support filters (Mira-driven personalization)
  if (activeSupportFilters.length > 0) {
    filteredProducts = filteredProducts.filter(product => {
      const productText = [product.name, product.description, product.tags?.join(' ')].join(' ').toLowerCase();
      return activeSupportFilters.some(care => {
        const careKeywords = {
          'sensitive-stomach': ['sensitive', 'gentle', 'easy digest', 'tummy', 'digestive'],
          'skin-coat': ['skin', 'coat', 'shine', 'omega', 'fur'],
          'weight': ['weight', 'lean', 'light', 'low calorie', 'diet', 'balanced'],
          'joints': ['joint', 'mobility', 'glucosamine', 'hip', 'arthritis'],
          'calming': ['calm', 'anxiety', 'relax', 'stress', 'soothing'],
          'recovery': ['recovery', 'healing', 'special', 'therapeutic', 'gentle'],
          'allergy-friendly': ['hypoallergenic', 'limited ingredient', 'single protein', 'allergy'],
          'hydration': ['hydration', 'moisture', 'water', 'wet'],
        };
        return (careKeywords[care] || []).some(kw => productText.includes(kw));
      });
    });
  }

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => (a.price || a.minPrice || 0) - (b.price || b.minPrice || 0));
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.price || b.minPrice || 0) - (a.price || a.minPrice || 0));
  } else if (sortBy === 'rating') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const getCategoryTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    switch (category) {
      case 'cakes': return 'Dog Cakes';
      case 'custom': return 'Breed-Specific Cakes';
      case 'breed-cakes': return 'Breed-Specific Cakes';
      case 'treats': return 'Treats & Snacks';
      case 'desi': return 'Desi Doggy Treats 🪔';
      case 'desi-treats': return 'Desi Doggy Treats 🪔';
      case 'merchandise': return 'Merchandise';
      case 'hampers': return 'Gift Hampers & Party Boxes 🎁';
      case 'meals': return 'Fresh Meals & Pizzas';
      case 'fresh-meals': return 'Fresh Meals';
      case 'frozen': return 'Frozen Treats';
      case 'frozen-treats': return 'Frozen Treats';
      case 'accessories': return 'Accessories & Toys';
      case 'pan-india': return 'Pan India Delivery';
      case 'mini-cakes': return 'Bowto Cakes';
      case 'cat': return 'Cat Treats';
      case 'cat-treats': return 'Cat Treats 🐱';
      case 'pizzas-burgers': return 'Pizzas & Burgers';
      case 'dognuts': return 'Pupcakes & Dognuts';
      case 'nut-butters': return 'Nut Butters';
      case 'autoship': return 'Autoship Products 🔄';
      case 'valentine': return 'Valentine Collection 💕';
      case 'other': return 'More Products';
      default: return 'All Products';
    }
  };

  // Get hero content for current category
  const heroContent = CATEGORY_HERO_CONTENT[category] || CATEGORY_HERO_CONTENT.default;
  const heroImage = CATEGORY_HERO_IMAGES[category] || CATEGORY_HERO_IMAGES.default;
  
  // Get support filters for this pillar/category
  const supportFilters = getSupportFilters(category, pillar);
  
  // Toggle support filter
  const toggleSupportFilter = (id) => {
    setActiveSupportFilters(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <SEOHead page={getSeoPage()} path={location.pathname} />
      
      {/* === HERO SECTION === */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${heroContent.color} text-white`}>
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt={getCategoryTitle()} 
            className="w-full h-full object-cover opacity-25"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${heroContent.color} opacity-90`} />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">{heroContent.badge}</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {heroContent.title}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                {heroContent.highlight}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-lg">
              {heroContent.subtitle}
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <PawPrint className="w-5 h-5 text-pink-300" />
                <span className="text-sm">100% Pet-Friendly</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Heart className="w-5 h-5 text-red-300" />
                <span className="text-sm">Loved by 45,000+ Pets</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="text-sm">Chemical-Free</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* === CELEBRATE CONCIERGE PICKER === */}
      {pillar === 'celebrate' && !searchQuery && (
        <CelebrateConcierePicker category={category} />
      )}
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Results Title (only for search) */}
        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Search Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            <p className="text-gray-600 mt-1">Found {filteredProducts.length} products</p>
          </div>
        )}

        {/* Location Detection Banner - Only for cake categories */}
        {isCakeCategory && detectedCity && detectedCity !== 'other' && (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center gap-3" data-testid="location-detected-banner">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                📍 Detected: {detectedCity.charAt(0).toUpperCase() + detectedCity.slice(1)} - Showing fresh delivery cakes!
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-700 hover:text-green-800"
              onClick={() => { setDetectedCity(null); setDeliveryCity('all'); }}
            >
              Clear
            </Button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-white rounded-xl shadow-sm" data-testid="filter-bar">
          <div className="flex items-center gap-2 text-gray-700">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters:</span>
          </div>
          
          {/* Search within category */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-[150px] pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              data-testid="search-input"
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Breed Filter - Only for breed-cakes */}
          {isBreedCakeCategory && availableBreeds.length > 1 && (
            <Select value={selectedBreed} onValueChange={setSelectedBreed}>
              <SelectTrigger className="w-[160px] border-purple-200 bg-purple-50">
                <SelectValue placeholder="All Breeds" />
              </SelectTrigger>
              <SelectContent>
                {availableBreeds.map(breed => (
                  <SelectItem key={breed} value={breed}>
                    {breed === 'all' ? '🐕 All Breeds' : `🐕 ${breed}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Shape Filter - Only for birthday cakes */}
          {needsShapeFilter && availableShapes.length > 1 && (
            <Select value={selectedShape} onValueChange={setSelectedShape}>
              <SelectTrigger className="w-[150px] border-pink-200 bg-pink-50" data-testid="shape-filter">
                <SelectValue placeholder="All Shapes" />
              </SelectTrigger>
              <SelectContent>
                {availableShapes.map(shape => (
                  <SelectItem key={shape} value={shape}>
                    {shape === 'all' ? '🎂 All Shapes' : `🎂 ${shape}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Delivery City Filter - Only for cake categories */}
          {isCakeCategory && (
            <div className="flex items-center gap-2">
              <Select value={deliveryCity} onValueChange={setDeliveryCity} data-testid="delivery-city-filter">
                <SelectTrigger className="w-[180px] border-purple-200 bg-purple-50">
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent>
                  {FRESH_DELIVERY_CITIES.map(city => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!detectedCity && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-purple-600 border-purple-200"
                  onClick={detectLocation}
                  disabled={detectingLocation}
                >
                  {detectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      Detecting...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-4 h-4 mr-1" />
                      Detect Location
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
          
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-[150px]" data-testid="price-filter">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under500">Under ₹500</SelectItem>
              <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
              <SelectItem value="over1000">Over ₹1000</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]" data-testid="sort-filter">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
          
          <p className="ml-auto text-purple-600 text-sm font-medium" data-testid="product-count">
            Showing {filteredProducts.length} products
          </p>
        </div>
        
        {/* NEW: Mira Support Filters Row - Personalized guidance for your pet */}
        {selectedPet && supportFilters.length > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100" data-testid="support-filters-section">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-900">
                  Personalized for {selectedPet.name}
                </span>
                {activeSupportFilters.length > 0 && (
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    {activeSupportFilters.length} active
                  </span>
                )}
              </div>
              {activeSupportFilters.length > 0 && (
                <button 
                  onClick={() => setActiveSupportFilters([])}
                  className="text-xs text-purple-500 hover:text-purple-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            
            {/* Support Filter Pills - Horizontal scrollable */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {supportFilters.map(filter => {
                const isActive = activeSupportFilters.includes(filter.id);
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => toggleSupportFilter(filter.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                    data-testid={`support-filter-${filter.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                    {isActive && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
            
            {/* Active filter description */}
            {activeSupportFilters.length > 0 && (
              <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Showing products that support: {activeSupportFilters.map(id => {
                  const filter = supportFilters.find(f => f.id === id);
                  return filter?.label;
                }).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Pet Soul Filtering Banner - Show when allergies are being filtered */}
        {activePet && petAllergies.length > 0 && !petAllergies.includes('No') && !petAllergies.includes('None') && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl flex items-center gap-3" data-testid="pet-soul-filter-banner">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Heart className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-900">
                Filtered for {activePet.name}&apos;s safety
              </p>
              <p className="text-xs text-purple-600">
                Hiding products with: {petAllergies.filter(a => a !== 'No' && a !== 'None' && a !== 'Other').join(', ')}
              </p>
            </div>
            <PawPrint className="w-5 h-5 text-purple-400" />
          </div>
        )}

        {/* PET PERSONALIZED RECOMMENDATIONS - Now works across ALL pillars */}
        {selectedPet && petRecommendations.length > 0 && (() => {
          const recConfig = getPillarRecommendationConfig(pillar);
          return (
            <div className={`mb-8 bg-gradient-to-r ${recConfig.bgColor} rounded-2xl p-6 border ${recConfig.borderColor}`} data-testid="pet-recommendations-section">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full ${recConfig.badgeColor} flex items-center justify-center text-white text-xl`}>
                    {recConfig.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${recConfig.accentColor}`}>
                      {recConfig.title(selectedPet.name)}
                    </h3>
                    <p className={`text-sm ${recConfig.accentColor} opacity-70`}>
                      {recConfig.subtitle(selectedPet)}
                    </p>
                  </div>
                </div>
                
                {/* Pet Selector (if multiple pets) */}
                {userPets.length > 1 && (
                  <select 
                    value={selectedPet?.id || ''}
                    onChange={(e) => handlePetChange(e.target.value)}
                    className={`px-3 py-2 rounded-lg border ${recConfig.borderColor} bg-white text-sm font-medium`}
                    data-testid="pet-selector-dropdown"
                  >
                    {userPets.map(pet => (
                      <option key={pet.id} value={pet.id}>🐕 {pet.name}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Recommended Products Carousel */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {petRecommendations.slice(0, 6).map(product => (
                  <div key={product.id} className="flex-shrink-0 w-40">
                    <a href={`/product/${product.id}`} className="block group">
                      <div className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                        <div className="aspect-square bg-gray-100">
                          {product.image && (
                            <img 
                              src={product.image} 
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-gray-900 truncate">{product.title || product.name}</p>
                          <p className={`text-xs font-bold ${recConfig.accentColor}`}>₹{product.price || product.minPrice}</p>
                        </div>
                        <div className={`absolute top-2 right-2 ${recConfig.badgeColor} text-white text-[10px] px-2 py-0.5 rounded-full`}>
                          For {selectedPet.name}
                        </div>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              
              {/* Shopping for someone else? */}
              <div className={`mt-4 pt-4 border-t ${recConfig.borderColor} flex items-center justify-between`}>
                <p className={`text-sm ${recConfig.accentColor} opacity-70`}>
                  <Gift className="w-4 h-4 inline mr-1" />
                  Shopping for another dog? 
                </p>
                <div className="flex items-center gap-3">
                  <a 
                    href={`/shop?pillar=${pillar}`}
                    className={`text-sm font-medium ${recConfig.accentColor} hover:opacity-80 underline`}
                  >
                    Browse Full Collection →
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPet(null);
                      setPetRecommendations([]);
                    }}
                    className={`text-xs ${recConfig.borderColor} hover:bg-white/50`}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No products found in this category.</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your filters or browse other categories</p>
            {activeSupportFilters.length > 0 && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveSupportFilters([])}
              >
                Clear support filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6" data-testid="product-grid">
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} pillar={pillar} />
              ))}
            </div>
            
            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="text-center mt-12">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8"
                  onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
                  data-testid="load-more-btn"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More ({filteredProducts.length - visibleCount} remaining)
                </Button>
              </div>
            )}
            
            {/* Showing count */}
            <p className="text-center text-gray-500 text-sm mt-4">
              Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} products
            </p>
          </>
        )}
      </div>
      
      {/* Mira Floating Chat Widget */}
      <MiraChatWidget pillar={pillar} />
    </div>
  );
};

export default ProductListing;

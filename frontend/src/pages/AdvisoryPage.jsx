/**
 * AdvisoryPage.jsx
 * 
 * Decision-support layer for pet parents.
 * "Help me decide what's right for my dog"
 * 
 * Structure follows Emergency page pattern:
 * - 11 Intent Tiles (Concierge® is overlay, not tile)
 * - Ask Advisory AI hero
 * - My Dog Advisory personalized section
 * - Guided Paths
 * - Curated Bundles
 * - Soul-Created Products
 * - Near Me Services
 * - Concierge® overlay throughout
 */

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import { ConciergeButton } from '../components/mira-os';
import { ChecklistDownloadButton } from '../components/checklists';
import ProductCard from '../components/ProductCard';
import { getPetPhotoUrl } from '../utils/petAvatar';
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import { PillarSoulLayer } from '../components/PillarSoulLayer';
import { PillarAskMiraHero } from '../components/PillarAskMiraHero';
import CuratedBundles from '../components/CuratedBundles';
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';
import { PillarDailyTip, PillarHelpBuckets } from '../components/PillarGoldSections';
import SoulPersonalizationSection from '../components/SoulPersonalizationSection';
import NearbyAdvisoryServices from '../components/advisory/NearbyAdvisoryServices';
import AdvisoryProductsGrid from '../components/advisory/AdvisoryProductsGrid';
import {
  Brain, Heart, Apple, Home, Stethoscope, GraduationCap,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Users, Calendar, MapPin, Award,
  Phone, MessageCircle, Clock, PawPrint, Shield, ShoppingBag, 
  AlertCircle, Plane, Baby, Scissors, Dumbbell, Sun, Leaf, Dog,
  Search, HelpCircle, Lightbulb, Target, Package, ThermometerSun
} from 'lucide-react';

// 11 Intent Tiles Configuration (Concierge® is overlay, not tile)

// ── Mira Intelligence helpers ──
const CLEAN_NONE = /^(none|no|n\/a|nil|nothing|na|-|not specified|unknown|___)$/i;
function getAllergies(pet) {
  const set = new Set();
  const add = v => { if (typeof v === 'string') v.split(',').forEach(a => { const t = a.trim(); if (t && !CLEAN_NONE.test(t)) set.add(t.toLowerCase()); }); if (Array.isArray(v)) v.forEach(a => add(a)); };
  add(pet?.preferences?.allergies); add(pet?.doggy_soul_answers?.food_allergies); add(pet?.allergies);
  return [...set];
}
function getLoves(pet) {
  const set = new Set();
  const add = v => { if (typeof v === 'string') v.split(',').forEach(a => { const t = a.trim(); if (t && !CLEAN_NONE.test(t)) set.add(t.toLowerCase()); }); if (Array.isArray(v)) v.forEach(a => add(a)); };
  add(pet?.preferences?.loved_items); add(pet?.doggy_soul_answers?.loved_items); add(pet?.loved_items);
  return [...set];
}
function applyMiraIntelligence(products, allergies, loves, healthCondition, nutritionGoal, pet) {
  const petName = pet?.name || 'your dog';
  const allergyTerms = (allergies || []).map(a => a.toLowerCase().trim());
  const loveTerms = (loves || []).map(l => l.toLowerCase().trim()).filter(Boolean);
  return (products || [])
    .filter(p => {
      if (!allergyTerms.length) return true;
      const text = `${p.name} ${p.description || ''}`.toLowerCase();
      const free = (p.allergy_free || '').toLowerCase();
      return !allergyTerms.some(a => {
        if (free.includes(`${a}-free`) || free.includes(`${a} free`)) return false;
        if (text.includes(`${a}-free`) || text.includes(`${a} free`)) return false;
        const cleaned = text.replace(new RegExp(`${a}[- ]free`, 'gi'), '');
        return cleaned.includes(a);
      });
    })
    .map(p => {
      const text = `${p.name} ${p.description || ''} ${p.sub_category || ''}`.toLowerCase();
      const free = (p.allergy_free || '').toLowerCase();
      const matchedLove = loveTerms.find(l => text.includes(l));
      let mira_hint = p.mira_hint || null;
      if (!mira_hint) {
        if (matchedLove) mira_hint = `Matches ${petName}'s love for ${matchedLove}`;
        else if (allergyTerms.length && allergyTerms.every(a => free.includes(`${a}-free`))) mira_hint = `Safe for ${petName}`;
        else if (p.mira_tag) mira_hint = p.mira_tag;
      }
      return { ...p, mira_hint, _loved: !!matchedLove };
    })
    .sort((a, b) => (a._loved === b._loved ? 0 : a._loved ? -1 : 1));
}

const ADVISORY_INTENTS = [
  {
    id: 'food_nutrition',
    title: 'Food & Nutrition',
    description: 'What to feed, how much, dietary needs',
    icon: Apple,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    questions: ['Best food for my breed?', 'How much should I feed?', 'Allergies & diet?'],
    searchTerms: ['food', 'feeding', 'nutrition', 'diet']
  },
  {
    id: 'puppy_guidance',
    title: 'Puppy Guidance',
    description: 'First year essentials & milestones',
    icon: Baby,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    questions: ['What to buy first?', 'Vaccination schedule?', 'Toilet training?'],
    searchTerms: ['puppy', 'starter', 'training']
  },
  {
    id: 'breed_guidance',
    title: 'Breed Guidance',
    description: 'Breed-specific care & traits',
    icon: Dog,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    questions: ['Care for my breed?', 'Common health issues?', 'Exercise needs?'],
    searchTerms: ['breed', 'specific']
  },
  {
    id: 'grooming_coat',
    title: 'Grooming & Coat',
    description: 'Coat care, brushing, bathing',
    icon: Scissors,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    questions: ['How often to groom?', 'Best brush for coat?', 'Shedding control?'],
    searchTerms: ['grooming', 'brush', 'shampoo', 'coat']
  },
  {
    id: 'behaviour_training',
    title: 'Behaviour & Training',
    description: 'Training tips, behavior issues',
    icon: Brain,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    questions: ['Stop pulling on leash?', 'Reduce barking?', 'Separation anxiety?'],
    searchTerms: ['training', 'behaviour', 'anxiety', 'calm']
  },
  {
    id: 'travel_readiness',
    title: 'Travel Readiness',
    description: 'Travel prep, gear, documents',
    icon: Plane,
    color: 'from-sky-500 to-cyan-600',
    bgColor: 'bg-sky-50',
    questions: ['Is my dog travel ready?', 'What documents needed?', 'Car anxiety help?'],
    searchTerms: ['travel', 'carrier', 'car']
  },
  {
    id: 'senior_care',
    title: 'Senior Dog Care',
    description: 'Comfort, mobility, health for seniors',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    questions: ['Senior diet changes?', 'Joint support?', 'Comfort products?'],
    searchTerms: ['senior', 'joint', 'mobility', 'comfort']
  },
  {
    id: 'home_setup',
    title: 'Home Setup',
    description: 'Beds, crates, safe spaces',
    icon: Home,
    color: 'from-teal-500 to-emerald-600',
    bgColor: 'bg-teal-50',
    questions: ['Best bed for my dog?', 'Crate training?', 'Safe home setup?'],
    searchTerms: ['bed', 'crate', 'home']
  },
  {
    id: 'new_adoption',
    title: 'New Adoption',
    description: 'First days, settling, bonding',
    icon: PawPrint,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50',
    questions: ['First 7 days guide?', 'Rescue settling tips?', 'Building trust?']
  },
  {
    id: 'product_advice',
    title: 'Product Advice',
    description: 'What to buy for your situation',
    icon: ShoppingBag,
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50',
    questions: ['Best products for puppies?', 'Summer essentials?', 'Travel kit?']
  },
  {
    id: 'recovery_care',
    title: 'Recovery & Care',
    description: 'Post-surgery, illness recovery',
    icon: Stethoscope,
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50',
    questions: ['Post-surgery care?', 'Recovery products?', 'Feeding during illness?']
  }
];

// Icon mapping for API paths
const ICON_MAP = {
  'Heart': Heart,
  'Users': Users,
  'Shield': Shield,
  'Baby': Baby,
  'Dog': Dog,
  'Plane': Plane,
  'Scissors': Scissors,
  'Brain': Brain,
  'Home': Home,
  'default': Heart
};

// Fallback Guided Paths (used when API unavailable)
const FALLBACK_GUIDED_PATHS = [
  {
    id: 'advisory-first-time-owner',
    title: 'First-time Owner Path',
    description: 'Everything new dog parents need',
    icon: Heart,
    color: 'from-blue-500 to-cyan-600',
    illustration: 'https://static.prod-images.emergentagent.com/jobs/9413ca9c-7e0a-4da4-9228-aacbd043076e/images/483d20beda8abdeaad9776dcb1d0490524e6b06dee38a9da41fa6a97acd9b088.png',
    steps: [
      { title: 'Getting started', items: ['Essential supplies', 'Vet registration', 'Basic training', 'Feeding schedule'] },
      { title: 'Building routine', items: ['Exercise needs', 'Grooming basics', 'Socialization', 'House rules'] },
      { title: 'Growing together', items: ['Health checkups', 'Advanced training', 'Diet optimization', 'Bonding activities'] }
    ]
  },
  {
    id: 'advisory-multi-dog',
    title: 'Multi-dog Household',
    description: 'Managing multiple dogs',
    icon: Users,
    color: 'from-purple-500 to-violet-600',
    illustration: 'https://static.prod-images.emergentagent.com/jobs/9413ca9c-7e0a-4da4-9228-aacbd043076e/images/58225f4c2aad7eb41871f19241cfacd2326f4c8729749bc97a83de911b797250.png',
    steps: [
      { title: 'Introduction protocol', items: ['Neutral territory meet', 'Supervised interactions', 'Separate feeding', 'Individual attention'] },
      { title: 'Harmony at home', items: ['Resource management', 'Pack dynamics', 'Conflict prevention', 'Equal love'] },
      { title: 'Group activities', items: ['Pack walks', 'Play sessions', 'Training together', 'Shared adventures'] }
    ]
  },
  {
    id: 'advisory-flat-faced',
    title: 'Flat-faced Dog Care',
    description: 'Special care for Pugs, Bulldogs, etc.',
    icon: Heart,
    color: 'from-amber-500 to-orange-600',
    illustration: 'https://static.prod-images.emergentagent.com/jobs/9413ca9c-7e0a-4da4-9228-aacbd043076e/images/fba97b169d538c4959a219aeb783a263ae38b031c19ce1bb35bed5a4523ac161.png',
    steps: [
      { title: 'Breathing care', items: ['Temperature monitoring', 'Exercise limits', 'Air quality', 'Weight management'] },
      { title: 'Skin & wrinkle care', items: ['Daily cleaning', 'Moisture control', 'Yeast prevention', 'Gentle products'] },
      { title: 'Health monitoring', items: ['Regular vet visits', 'BOAS awareness', 'Eye care', 'Dental health'] }
    ]
  },
  {
    id: 'advisory-allergy',
    title: 'Allergy Management Path',
    description: 'Control and manage pet allergies',
    icon: Shield,
    color: 'from-green-500 to-emerald-600',
    illustration: 'https://static.prod-images.emergentagent.com/jobs/9413ca9c-7e0a-4da4-9228-aacbd043076e/images/2f90bc09d0780080e51b8d238ceb36abc0d33af250b7919ac6502ec612bfef60.png',
    steps: [
      { title: 'Identification', items: ['Allergy testing', 'Elimination diet', 'Environmental triggers', 'Symptom tracking'] },
      { title: 'Management', items: ['Hypoallergenic food', 'Air purifiers', 'Frequent bathing', 'Medication if needed'] },
      { title: 'Prevention', items: ['Regular cleaning', 'Flea control', 'Seasonal adjustments', 'Immune support'] }
    ]
  }
];

// Seasonal/Climate Advice with temperature ranges
const SEASONAL_ADVICE = [
  { 
    id: 'summer', 
    title: 'Summer Care', 
    icon: Sun, 
    color: 'bg-amber-100 text-amber-700',
    borderColor: 'border-amber-400',
    tempRange: [25, 50],
    tips: ['Hydration', 'Avoid hot pavement', 'Cooling mats', 'Early/late walks']
  },
  { 
    id: 'monsoon', 
    title: 'Monsoon Care', 
    icon: ThermometerSun, 
    color: 'bg-blue-100 text-blue-700',
    borderColor: 'border-blue-400',
    months: [6, 7, 8, 9],
    tips: ['Paw drying', 'Raincoat', 'Tick prevention', 'Indoor activities']
  },
  { 
    id: 'winter', 
    title: 'Winter Care', 
    icon: ThermometerSun, 
    color: 'bg-cyan-100 text-cyan-700',
    borderColor: 'border-cyan-400',
    tempRange: [0, 18],
    tips: ['Warm bedding', 'Shorter baths', 'Paw protection', 'Extra calories']
  }
];

// Helper to determine relevant season based on weather/location
const getRelevantSeason = (weather, currentMonth) => {
  if (weather?.temp) {
    const temp = weather.temp;
    if (temp >= 28) return 'summer';
    if (temp <= 15) return 'winter';
  }
  // Fallback to month-based for India
  if ([6, 7, 8, 9].includes(currentMonth)) return 'monsoon';
  if ([11, 12, 1, 2].includes(currentMonth)) return 'winter';
  return 'summer';
};

const AdvisoryPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { currentPet } = usePillarContext();
  const navigate = useNavigate();
  
  // Refs for scrolling
  const askAdvisoryRef = useRef(null);
  const myDogRef = useRef(null);
  const guidedPathsRef = useRef(null);
  const productsRef = useRef(null);
  const nearMeRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [advisoryQuery, setAdvisoryQuery] = useState('');
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  
  // Guided Paths from API
  const [guidedPaths, setGuidedPaths] = useState(FALLBACK_GUIDED_PATHS);
  const [pathsLoading, setPathsLoading] = useState(true);
  
  // Weather & Location state
  const [weather, setWeather] = useState(null);
  const [userCity, setUserCity] = useState('');
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const relevantSeason = getRelevantSeason(weather, currentMonth);
  
  // User pets state - same as Learn page
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Advisory request form - similar to Learn page
  const [requestForm, setRequestForm] = useState({
    advisory_type: 'general',
    topics_of_interest: [],
    specific_concerns: '',
    notes: ''
  });
  
  // Active pet from context or selection
  const activePet = currentPet || selectedPet;
  const petName = activePet?.name || 'Your Pet';
  const petBreed = activePet?.breed || '';
  const petAge = activePet?.age_years || activePet?.age || 0;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/advisory/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Expert advice for {petName}",
    subtitle: 'Behavior, nutrition, training & health consultations',
    askMira: {
      enabled: true,
      placeholder: "Behavior issues... nutrition advice",
      buttonColor: 'bg-teal-500'
    },
    sections: {
      askMira: { enabled: true },
      miraPrompts: { enabled: true },
      advisory: { enabled: true },
      bundles: { enabled: true },
      products: { enabled: true },
      personalized: { enabled: true }
    }
  });
  const [cmsCategories, setCmsCategories] = useState([]);
  const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);
  const [cmsHelpBuckets, setCmsHelpBuckets] = useState([]);
  const [cmsDailyTips, setCmsDailyTips] = useState([]);
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Expert advice for ${activePet?.name || 'your pet'}`;
  
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/advisory/page-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config && Object.keys(data.config).length > 0) {
          setCmsConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.categories?.length > 0) {
          setCmsCategories(data.categories);
        }
        if (data.miraPrompts?.length > 0) {
          setCmsMiraPrompts(data.miraPrompts);
        }
        if (data.helpBuckets?.length > 0) {
          setCmsHelpBuckets(data.helpBuckets);
        }
        if (data.dailyTips?.length > 0) {
          setCmsDailyTips(data.dailyTips);
        }
        console.log('[AdvisoryPage] CMS config loaded');
      }
    } catch (error) {
      console.error('[AdvisoryPage] Failed to fetch CMS config:', error);
    }
  };
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
    fetchData();
    fetchWeather();
    fetchGuidedPaths();
    if (user && token) {
      fetchUserPets();
    }
  }, [user, token]);

  // Fetch guided paths from API
  const fetchGuidedPaths = async () => {
    setPathsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/guided-paths/advisory`);
      if (response.ok) {
        const data = await response.json();
        if (data.paths && data.paths.length > 0) {
          // Map of illustrations for known path types
          const pathIllustrations = {
            'advisory-first-time-owner': 'https://static.prod-images.emergentagent.com/jobs/9413ca9c-7e0a-4da4-9228-aacbd043076e/images/483d20beda8abdeaad9776dcb1d0490524e6b06dee38a9da41fa6a97acd9b088.png',
            'advisory-multi-dog': 'https://static.prod-images.emergentagent.com/jobs/9413ca9c-7e0a-4da4-9228-aacbd043076e/images/58225f4c2aad7eb41871f19241cfacd2326f4c8729749bc97a83de911b797250.png',
            'advisory-flat-faced': 'https://static.prod-images.emergentagent.com/jobs/9413ca9c-7e0a-4da4-9228-aacbd043076e/images/fba97b169d538c4959a219aeb783a263ae38b031c19ce1bb35bed5a4523ac161.png',
            'advisory-allergy': 'https://static.prod-images.emergentagent.com/jobs/9413ca9c-7e0a-4da4-9228-aacbd043076e/images/2f90bc09d0780080e51b8d238ceb36abc0d33af250b7919ac6502ec612bfef60.png',
          };
          const transformedPaths = data.paths.map(path => ({
            id: path.id,
            title: path.title,
            description: path.description,
            icon: ICON_MAP[path.icon] || ICON_MAP['default'],
            color: path.color || 'from-purple-500 to-violet-600',
            illustration: pathIllustrations[path.id] || path.illustration,
            steps: path.steps || []
          }));
          setGuidedPaths(transformedPaths);
        }
      }
    } catch (error) {
      console.error('Failed to fetch guided paths:', error);
      // Keep fallback paths
    } finally {
      setPathsLoading(false);
    }
  };

  // Fetch weather based on user location
  const fetchWeather = async () => {
    try {
      // Get user's location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            // Use reverse geocoding to get city
            try {
              const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
              );
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                const city = geoData.address?.city || geoData.address?.town || geoData.address?.state || '';
                setUserCity(city);
                
                // Fetch weather from backend
                const weatherRes = await fetch(`${API_URL}/api/weather?lat=${latitude}&lon=${longitude}`);
                if (weatherRes.ok) {
                  const weatherData = await weatherRes.json();
                  setWeather(weatherData);
                }
              }
            } catch (e) {
              console.log('Weather fetch failed, using defaults');
            }
          },
          () => {
            // Location denied - use default (India timezone detection)
            console.log('Location access denied, using seasonal defaults');
          }
        );
      }
    } catch (error) {
      console.log('Weather fetch error:', error);
    }
  };

  // Fetch user pets - SAME PATTERN AS LEARN PAGE
  const fetchUserPets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPets(data.pets || []);
        if (data.pets?.length > 0 && !selectedPet) {
          setSelectedPet(data.pets[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/advisory/products`),
        fetch(`${API_URL}/api/advisory/bundles`)
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(applyMiraIntelligence(data.products || [], getAllergies(activePet), getLoves(activePet), null, null, activePet));
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ask Advisory AI - Opens Mira with the query
  const handleAskAdvisory = () => {
    if (!advisoryQuery.trim()) return;
    setAskMiraLoading(true);
    
    // Open Mira with the advisory query pre-filled
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: advisoryQuery,
        initialQuery: advisoryQuery,
        context: 'advisory',
        pillar: 'advisory',
        source: 'pillar_top_bar',
        pet_name: activePet?.name,
        pet_breed: activePet?.breed
      }
    }));
    
    // Clear the input
    setAdvisoryQuery('');
    setShowAiResponse(false);
    setTimeout(() => setAskMiraLoading(false), 800);
  };

  // State for concierge modal
  const [showConciergeModal, setShowConciergeModal] = useState(false);
  const [conciergeContext, setConciergeContext] = useState('');

  const openConciergeModal = (context = '') => {
    setConciergeContext(context);
    setShowConciergeModal(true);
  };

  const openWhatsAppConcierge = (context = '') => {
    const baseMessage = 'Hi, I need advisory help';
    const contextMessage = context ? ` about ${context}` : '';
    const petMessage = activePet ? ` for my ${activePet.breed || 'pet'} ${activePet.name}` : '';
    window.open(`https://wa.me/918971702582?text=${encodeURIComponent(baseMessage + contextMessage + petMessage)}`, '_blank');
  };

  // Get personalized advice based on pet profile
  const getPersonalizedAdvice = () => {
    const advice = [];
    
    if (!activePet) {
      return [
        { title: 'Sign in for personalized advice', description: 'Get recommendations tailored to your pet' }
      ];
    }
    
    // Age-based advice
    if (petAge < 1) {
      advice.push({ 
        title: 'Puppy Development Tips', 
        description: `${petName} is in a critical growth phase`,
        icon: Baby,
        color: 'text-pink-600 bg-pink-50'
      });
    } else if (petAge > 7) {
      advice.push({ 
        title: 'Senior Comfort Guide', 
        description: `Support ${petName}'s golden years`,
        icon: Heart,
        color: 'text-rose-600 bg-rose-50'
      });
    }
    
    // Breed-specific advice
    if (petBreed) {
      const breedLower = petBreed.toLowerCase();
      
      if (breedLower.includes('pug') || breedLower.includes('bulldog') || breedLower.includes('shih')) {
        advice.push({
          title: 'Flat-Face Care Tips',
          description: `Special care for ${petBreed}s in heat`,
          icon: ThermometerSun,
          color: 'text-amber-600 bg-amber-50'
        });
      }
      
      if (breedLower.includes('labrador') || breedLower.includes('golden') || breedLower.includes('husky')) {
        advice.push({
          title: 'Double Coat Care',
          description: `Shedding management for ${petBreed}s`,
          icon: Scissors,
          color: 'text-purple-600 bg-purple-50'
        });
      }
      
      if (breedLower.includes('indie') || breedLower.includes('desi')) {
        advice.push({
          title: 'Indian Breed Care',
          description: `Hardy but special needs for ${petName}`,
          icon: Star,
          color: 'text-orange-600 bg-orange-50'
        });
      }
    }
    
    // Season-based advice (assuming summer for India)
    advice.push({
      title: 'Summer Heat Advisory',
      description: 'Keep cool with these tips',
      icon: Sun,
      color: 'text-yellow-600 bg-yellow-50'
    });
    
    return advice;
  };

  const personalizedAdvice = getPersonalizedAdvice();

  // Advisory Types for modal dropdown
  const ADVISORY_TYPES = {
    food_nutrition: { name: 'Food & Nutrition', icon: Apple },
    puppy_guidance: { name: 'Puppy Guidance', icon: Baby },
    breed_guidance: { name: 'Breed Guidance', icon: Dog },
    grooming_coat: { name: 'Grooming & Coat', icon: Scissors },
    behaviour_training: { name: 'Behaviour & Training', icon: Brain },
    travel_readiness: { name: 'Travel Readiness', icon: Plane },
    senior_care: { name: 'Senior Dog Care', icon: Heart },
    home_setup: { name: 'Home Setup', icon: Home },
    new_adoption: { name: 'New Adoption', icon: PawPrint },
    product_advice: { name: 'Product Advice', icon: Package },
    recovery_care: { name: 'Recovery & Care', icon: Shield }
  };

  // Concierge® Modal Component - EXACTLY LIKE LEARN PAGE "Request Training" Modal
  const ConciergeModal = () => (
    <Dialog open={showConciergeModal} onOpenChange={setShowConciergeModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-violet-600" />
            Request Advisory Help
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Pet Selection - EXACTLY LIKE LEARN PAGE */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Your Pet's Details</Label>
            {userPets.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {userPets.map(pet => (
                  <Card 
                    key={pet.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPet?.id === pet.id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPet(pet)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <img 
                          src={getPetPhotoUrl(pet)} 
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.breed}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Pet Name *</Label>
                    <Input
                      placeholder="e.g., Mojo"
                      value={requestForm.guest_pet_name || ''}
                      onChange={(e) => setRequestForm({...requestForm, guest_pet_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Breed</Label>
                    <Input
                      placeholder="e.g., Labrador"
                      value={requestForm.guest_pet_breed || ''}
                      onChange={(e) => setRequestForm({...requestForm, guest_pet_breed: e.target.value})}
                    />
                  </div>
                </div>
                {!user && (
                  <div className="space-y-3 pt-3 border-t">
                    <Label className="text-sm font-medium">Your Contact Details</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Your Name *</Label>
                        <Input
                          placeholder="Full name"
                          value={requestForm.guest_name || ''}
                          onChange={(e) => setRequestForm({...requestForm, guest_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Phone *</Label>
                        <Input
                          placeholder="Mobile number"
                          value={requestForm.guest_phone || ''}
                          onChange={(e) => setRequestForm({...requestForm, guest_phone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Advisory Type - Like Learn's Training Type */}
          <div>
            <Label className="text-sm font-medium">Advisory Type</Label>
            <Select 
              value={requestForm.advisory_type} 
              onValueChange={(v) => setRequestForm(prev => ({ ...prev, advisory_type: v }))}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select advisory type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ADVISORY_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Context from clicked intent */}
          {conciergeContext && (
            <div className="p-3 bg-violet-50 rounded-lg border border-violet-200">
              <p className="text-sm text-violet-700">
                <strong>Topic:</strong> {conciergeContext}
              </p>
            </div>
          )}
          
          {/* Additional Notes */}
          <div>
            <Label className="text-sm font-medium">Additional Notes</Label>
            <Textarea 
              className="mt-2"
              placeholder="Anything specific you'd like help with..."
              value={requestForm.notes}
              onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setShowConciergeModal(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              openWhatsAppConcierge(conciergeContext);
              setShowConciergeModal(false);
            }} 
            disabled={!selectedPet && !requestForm.guest_pet_name}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Submit Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );


  return (
    <PillarPageLayout
      pillar="advisory"
      title="Advisory - Pet Guidance | The Doggy Company"
      description="Help deciding what's right for your dog. Food, grooming, training, travel, senior care - personalized guidance based on your pet's needs."
    >
      <div ref={askAdvisoryRef}>
        <PillarAskMiraHero
          theme="violet"
          sectionTestId="advisory-top-ask-mira"
          badgeTestId="advisory-ask-mira-badge"
          titleTestId="advisory-page-title"
          inputTestId="ask-advisory-input-top"
          submitTestId="ask-advisory-submit-top"
          title={`What would you like help deciding for ${petName}?`}
          description="Start with Mira for soul-aware guidance, then continue in the same advisory chat below without opening another assistant."
          value={advisoryQuery}
          onChange={(e) => setAdvisoryQuery(e.target.value)}
          onSubmit={handleAskAdvisory}
          loading={askMiraLoading}
          placeholder={`e.g., "Best food for my ${petBreed || 'dog'}" or "What bed should I buy?"`}
          children={userPets.length > 0 ? (
            <div className="flex justify-center gap-3 flex-wrap" data-testid="pet-selector-top">
              {userPets.map(pet => (
                <Card 
                  key={pet.id}
                  className={`p-2 px-4 cursor-pointer transition-all ${
                    (selectedPet?.id === pet.id || (!selectedPet && currentPet?.id === pet.id))
                      ? 'ring-2 ring-violet-500 bg-violet-50' 
                      : 'hover:bg-violet-50'
                  }`}
                  onClick={() => setSelectedPet(pet)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center">
                      <img 
                        src={getPetPhotoUrl(pet)} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/32'; }}
                      />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{pet.name}</p>
                      <p className="text-xs text-gray-500">{pet.breed}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          ADVISORY TOPIC CARDS - Quick access to guidance categories
          Behavior, Nutrition, Training, Health
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <PillarTopicsGrid
        pillar="advisory"
        topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.advisory}
        columns={4}
      />

      {/* ════════════════════════════════════════════════════════════════════
          3. DAILY ADVISORY TIP + 4. HOW CAN WE HELP
          Gold Standard sections (Guided Paths already implemented below)
          ════════════════════════════════════════════════════════════════════ */}
      <PillarDailyTip
        tips={cmsDailyTips.length > 0 ? cmsDailyTips : [
          { category: 'Nutrition', tip: 'Reading dog food labels is a skill. Meat should be the first ingredient. Avoid foods where corn, wheat, or by-products are listed first.', icon: 'Heart', color: 'from-teal-500 to-cyan-500' },
          { category: 'Behaviour', tip: 'Reactive behaviour on a leash is usually fear-based, not aggression. The fix is desensitisation and counter-conditioning, not punishment.', icon: 'Brain', color: 'from-violet-500 to-teal-500' },
          { category: 'Training', tip: 'Consistency beats intensity in dog training. 5 minutes every day produces better results than 1 hour once a week.', icon: 'Award', color: 'from-teal-600 to-emerald-500' },
          { category: 'Senior Care', tip: 'Cognitive decline in older dogs is real. Mental stimulation — sniff walks, puzzle feeders — can slow the progression significantly.', icon: 'Star', color: 'from-cyan-500 to-teal-500' },
          { category: 'Health Screening', tip: 'Annual bloodwork for dogs over 7 years old is one of the best investments you can make. It catches hidden issues before they become crises.', icon: 'Shield', color: 'from-emerald-500 to-teal-600' },
          { category: 'Grooming', tip: 'The skin is the largest organ. Regular grooming isn\'t vanity — it\'s health monitoring. You\'ll notice lumps, rashes, and parasites early.', icon: 'Sparkles', color: 'from-teal-400 to-cyan-500' },
          { category: 'Vet Visits', tip: 'Prepare questions before every vet visit. Write them down. You\'ll forget 40% of your concerns once you\'re in the room.', icon: 'Clipboard', color: 'from-cyan-600 to-teal-600' },
        ]}
        tipLabel="Today's Advisory Tip"
      />

      <PillarHelpBuckets
        pillar="advisory"
        buckets={cmsHelpBuckets.length > 0 ? cmsHelpBuckets : [
          { id: 'nutrition', title: 'Nutrition Advice', icon: 'Heart', color: 'teal', items: ['Diet assessment', 'Food label reading', 'Allergy guidance', 'Weight management'] },
          { id: 'behaviour', title: 'Behaviour Help', icon: 'Brain', color: 'violet', items: ['Anxiety support', 'Aggression advice', 'Training methods', 'Fear assessment'] },
          { id: 'health', title: 'Health Guidance', icon: 'Shield', color: 'cyan', items: ['Symptom checking', 'Preventive care', 'Senior health', 'Breed-specific risks'] },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 1: ASK ADVISORY - AI Decision Support Hero
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={askAdvisoryRef} className="py-8 px-4 bg-gradient-to-b from-violet-100 to-white" data-testid="ask-advisory-section">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Pet Selector - SAME PATTERN AS LEARN PAGE */}
          {userPets.length > 0 && (
            <div className="mb-6" data-testid="pet-selector">
              <p className="text-sm text-gray-500 mb-3">Asking for:</p>
              <div className="flex justify-center gap-3 flex-wrap">
                {userPets.map(pet => (
                  <Card 
                    key={pet.id}
                    className={`p-2 px-4 cursor-pointer transition-all ${
                      (selectedPet?.id === pet.id || (!selectedPet && currentPet?.id === pet.id))
                        ? 'ring-2 ring-violet-500 bg-violet-50' 
                        : 'hover:bg-violet-50'
                    }`}
                    onClick={() => setSelectedPet(pet)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center">
                        <img 
                          src={getPetPhotoUrl(pet)} 
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/32'; }}
                        />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-sm">{pet.name}</p>
                        <p className="text-xs text-gray-500">{pet.breed}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <Badge className="bg-violet-600 text-white mb-3">
              <Lightbulb className="w-3 h-3 mr-1" /> Ask Advisory
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              What would you like help deciding for {petName}?
            </h1>
            <p className="text-gray-600">
              Get personalized guidance based on {petName}'s actual needs
            </p>
          </div>
          
          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <Input
              value={advisoryQuery}
              onChange={(e) => setAdvisoryQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAdvisory()}
              placeholder={`e.g., "Best food for my ${petBreed || 'dog'}" or "What bed should I buy?"`}
              className="w-full py-6 pl-4 pr-12 text-lg rounded-xl border-2 border-violet-200 focus:border-violet-500"
            />
            <Button
              onClick={handleAskAdvisory}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700"
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          
          {/* AI Response */}
          {showAiResponse && (
            <Card className="max-w-2xl mx-auto p-4 mb-6 bg-violet-50 border-violet-200">
              {aiLoading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                  <span className="text-violet-700">Thinking...</span>
                </div>
              ) : (
                <div className="text-left">
                  <div className="prose prose-sm max-w-none text-gray-700 mb-4">
                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={() => {
                        setShowAiResponse(false);
                        setAiResponse('');
                        setAdvisoryQuery('');
                      }}
                      variant="outline"
                      className="border-violet-300 text-violet-600"
                    >
                      Ask another question
                    </Button>
                    <Button
                      onClick={() => openConciergeModal(advisoryQuery)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Talk to Concierge®
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
          
          {/* Example Questions */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              `Best food for ${petBreed || 'puppies'}`,
              'What bed for senior dogs?',
              'Travel prep checklist',
              'Grooming routine help'
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAdvisoryQuery(example);
                  handleAskAdvisory();
                }}
                className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-sm text-violet-700 hover:bg-violet-50 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
          
          {/* Download Life Stage Guide Checklist */}
          <div className="mt-6 flex justify-center">
            <ChecklistDownloadButton 
              pillar="advisory" 
              variant="outline"
              className="border-violet-300 text-violet-700 hover:bg-violet-50"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 2: 11 INTENT TILES - What kind of help do you need?
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-white" data-testid="intent-tiles-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">What Would You Like Help With?</h2>
            <p className="text-sm text-gray-600">Choose a topic to get started</p>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {ADVISORY_INTENTS.map((intent) => {
              const Icon = intent.icon;
              const isSelected = selectedIntent === intent.id;
              
              return (
                <button
                  key={intent.id}
                  onClick={() => setSelectedIntent(isSelected ? null : intent.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isSelected 
                      ? `bg-gradient-to-br ${intent.color} text-white shadow-lg scale-105` 
                      : `${intent.bgColor} hover:shadow-md border-2 border-transparent hover:border-gray-200`
                  }`}
                  data-testid={`intent-${intent.id}`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-white' : ''}`} />
                  <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {intent.title}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Selected Intent Details */}
          {selectedIntent && (
            <Card className="mt-6 p-4 border-2 border-violet-200 bg-violet-50/50">
              {(() => {
                const intent = ADVISORY_INTENTS.find(i => i.id === selectedIntent);
                const Icon = intent.icon;
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${intent.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{intent.title}</h3>
                        <p className="text-sm text-gray-600">{intent.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {intent.questions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAdvisoryQuery(q);
                            askAdvisoryRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-sm text-violet-700 hover:bg-violet-100"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => openConciergeModal(intent.title)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Talk to Concierge® about {intent.title}
                    </Button>
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 3: MY DOG ADVISORY - Personalized Recommendations
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={myDogRef} className="py-8 px-4 bg-gradient-to-b from-purple-50 to-white" data-testid="my-dog-advisory-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {activePet ? `Advice for ${petName} Today` : 'Personalized Advice'}
            </h2>
            {activePet && (
              <Badge className="bg-purple-100 text-purple-700">
                {petBreed} • {petAge > 0 ? `${petAge} years` : 'Puppy'}
              </Badge>
            )}
          </div>
          
          {activePet ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {personalizedAdvice.map((advice, idx) => {
                const Icon = advice.icon || Lightbulb;
                return (
                  <Card 
                    key={idx} 
                    className={`p-4 cursor-pointer hover:shadow-lg transition-all ${advice.color || 'bg-gray-50'}`}
                    onClick={() => openConciergeModal(advice.title)}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{advice.title}</h3>
                    <p className="text-xs text-gray-600">{advice.description}</p>
                    <div className="mt-2 flex items-center text-xs text-violet-600 font-medium">
                      Get advice <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-6 text-center bg-purple-50">
              <PawPrint className="w-12 h-12 mx-auto text-purple-300 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Sign in for Personalized Advice</h3>
              <p className="text-sm text-gray-600 mb-4">Get recommendations tailored to your pet's breed, age, and needs</p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Sign In
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 4: CONCIERGE ASSISTANCE - Overlay throughout (like Emergency)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <ServiceCatalogSection 
        pillar="advisory"
        title="Concierge® Will Guide You"
        subtitle="We can help you decide what's right for your pet"
        maxServices={6}
        hidePrice={true}
      />

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 5: GUIDED PATHS - Step-by-step decision journeys
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={guidedPathsRef} className="py-8 px-4 bg-white" data-testid="guided-paths-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Guided Decision Paths</h2>
            <p className="text-sm text-gray-600">Step-by-step guidance for common situations</p>
          </div>
          
          {pathsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600 mr-2" />
              <span className="text-gray-600">Loading guided paths...</span>
            </div>
          ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {guidedPaths.map((path) => {
              const Icon = path.icon;
              const isExpanded = selectedPath === path.id;
              
              return (
                <div key={path.id}>
                  <button
                    onClick={() => setSelectedPath(isExpanded ? null : path.id)}
                    className={`w-full rounded-xl text-left transition-all overflow-hidden ${
                      isExpanded 
                        ? `bg-gradient-to-br ${path.color} text-white shadow-lg` 
                        : 'bg-gray-50 hover:shadow-md border border-gray-200'
                    }`}
                    data-testid={`path-${path.id}`}
                  >
                    {path.illustration && (
                      <div className="h-28 overflow-hidden">
                        <img src={path.illustration} alt={path.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4">
                      <Icon className={`w-6 h-6 mb-2 ${isExpanded ? 'text-white' : 'text-violet-600'}`} />
                      <h3 className={`font-semibold text-sm ${isExpanded ? 'text-white' : 'text-gray-900'}`}>
                        {path.title}
                      </h3>
                      <p className={`text-xs mt-1 ${isExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                        {path.description}
                      </p>
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <Card className="mt-2 p-4 bg-white border-2 border-violet-200">
                      <div className="space-y-3">
                        {path.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-gray-900">{step.title}</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {step.items.map((item, i) => (
                                  <Badge 
                                    key={i} 
                                    variant="outline" 
                                    className="text-xs cursor-pointer hover:bg-violet-100"
                                    onClick={() => {
                                      // Search for this item in shop
                                      navigate(`/shop?search=${encodeURIComponent(item)}`);
                                    }}
                                  >
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Action Buttons - Shop & Concierge® */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={() => {
                            // Navigate to shop with path-related search
                            const searchTerms = path.steps.flatMap(s => s.items).slice(0, 3).join(' ');
                            navigate(`/shop?search=${encodeURIComponent(searchTerms)}`);
                          }}
                          variant="outline"
                          className="flex-1 border-violet-300 text-violet-600 hover:bg-violet-50"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Shop This Path
                        </Button>
                        <Button
                          onClick={() => openConciergeModal(path.title)}
                          className="flex-1 bg-violet-600 hover:bg-violet-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Get Expert Help
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      <PillarSoulLayer
        pillar="advisory"
        activePet={activePet}
        title={`Advice shaped for ${activePet?.name || 'your pet'}`}
        subtitle={`A Pet OS advisory layer for ${activePet?.name || 'your pet'} — recommendations grounded in breed, soul context, and the decisions you are trying to make right now.`}
        maxProducts={6}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SOUL PERSONALIZATION SECTION - THE CENTERPIECE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SoulPersonalizationSection pillar="advisory" />

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 6: ADVISORY PRODUCTS & BUNDLES - Soul-created structure
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={productsRef} className="py-8 px-4 bg-gradient-to-b from-violet-50 to-white" data-testid="advisory-products-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingBag className="w-6 h-6 text-violet-600" />
            <h2 className="text-xl font-bold text-gray-900">Products for {petName}'s Needs</h2>
            {selectedIntent && (
              <Badge className="bg-violet-100 text-violet-700">
                Filtered: {ADVISORY_INTENTS.find(i => i.id === selectedIntent)?.title}
              </Badge>
            )}
          </div>
          
          {/* Intent Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedIntent(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                !selectedIntent ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Products
            </button>
            {ADVISORY_INTENTS.slice(0, 6).map(intent => (
              <button
                key={intent.id}
                onClick={() => setSelectedIntent(intent.id === selectedIntent ? null : intent.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                  selectedIntent === intent.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {React.createElement(intent.icon, { className: 'w-3 h-3' })}
                {intent.title.split(' ')[0]}
              </button>
            ))}
          </div>
          
          {/* BUNDLES ON TOP */}
          <div className="mb-8">
            <CuratedBundles pillar="advisory" maxBundles={3} showTitle={true} />
          </div>
          
          {/* ADVISORY CARE PRODUCTS BY CATEGORY */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedIntent 
                ? `${ADVISORY_INTENTS.find(i => i.id === selectedIntent)?.title} Products` 
                : 'Care Products'
              }
            </h3>
            <AdvisoryProductsGrid 
              maxProducts={24} 
              showCategories={true} 
              categoryFilter={selectedIntent ? ADVISORY_INTENTS.find(i => i.id === selectedIntent)?.searchTerms?.[0] : null}
            />
          </div>
          
          {/* SMART PICKS */}
          <BreedSmartRecommendations pillar="advisory" />
          
          {/* ARCHETYPE PRODUCTS */}
          <div className="mt-8">
            <ArchetypeProducts pillar="advisory" maxProducts={8} showTitle={true} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 7: NEAR ME - Nearby services using Google Places API
          ═══════════════════════════════════════════════════════════════════════════ */}
      <NearbyAdvisoryServices />

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 8: SEASONAL ADVICE - Climate/moment-based tips (Location-Aware)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gradient-to-b from-amber-50 to-white" data-testid="seasonal-advice-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Seasonal Care Tips</h2>
            <p className="text-sm text-gray-600">
              {weather?.temp 
                ? `Current: ${Math.round(weather.temp)}°C ${userCity ? `in ${userCity}` : ''} • Advice for ${petName}`
                : `Climate-based advice for ${petName}`
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SEASONAL_ADVICE.map((season) => {
              const Icon = season.icon;
              const isRelevant = season.id === relevantSeason;
              return (
                <Card 
                  key={season.id} 
                  className={`p-4 ${season.color} cursor-pointer transition-all ${
                    isRelevant 
                      ? `ring-2 ${season.borderColor} shadow-lg scale-105` 
                      : 'hover:shadow-md opacity-70 hover:opacity-100'
                  }`}
                  onClick={() => openConciergeModal(season.title)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-6 h-6" />
                    {isRelevant && (
                      <Badge className="bg-white/80 text-gray-700 text-xs">
                        Current Season
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{season.title}</h3>
                  <ul className="text-xs space-y-1">
                    {season.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {tip}
                      </li>
                    ))}
                  </ul>
                  {isRelevant && (
                    <Button 
                      size="sm" 
                      className="w-full mt-3 bg-white/90 text-gray-800 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdvisoryQuery(`${season.title} tips for ${petBreed || 'my dog'}`);
                        askAdvisoryRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Get {season.title} Tips
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 8.5: EMERGENCY ESCALATION - Quick path to Emergency page
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-6 px-4 bg-gradient-to-r from-red-50 to-orange-50 border-y border-red-200" data-testid="emergency-escalation">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Is this urgent?</h3>
                <p className="text-sm text-gray-600">If your pet needs immediate help, go to Emergency</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/emergency')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              Go to Emergency
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 9: CONCIERGE ESCALATION - Always available help
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-violet-600" data-testid="concierge-cta-section">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Still Need Help Deciding?</h2>
          <p className="text-violet-100 mb-6">
            Our Concierge® team can help you choose the right products, services, or experts for {petName}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => openConciergeModal('Advisory Help')}
              className="bg-white text-violet-600 hover:bg-violet-50"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Talk to Concierge®
            </Button>
            <Button
              onClick={() => window.location.href = '/services'}
              variant="outline"
              className="border-white text-white hover:bg-violet-700"
              size="lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Browse All Services
            </Button>
          </div>
        </div>
      </section>

      {/* Concierge® Modal */}
      <ConciergeModal />
      
      {/* Floating Concierge® Button */}
      <ConciergeButton 
        pillar="advisory"
        petName={activePet?.name}
        context={activePet?.breed}
        position="bottom-right"
      />
    </PillarPageLayout>
  );
};

export default AdvisoryPage;

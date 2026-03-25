/**
 * CelebratePage.jsx
 * 
 * The Celebrate pillar - Birthday celebrations, parties, and special moments for pets.
 * Features Elevated Concierge® Experiences for curated celebrations.
 * NOW with the same beautiful personalized design as Shop/Services!
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  PartyPopper, Cake, Gift, Crown, Sparkles, Camera, Users, 
  Calendar, MapPin, ChevronRight, Star, Heart, Music,
  Palette, ShoppingBag, Package, X, Phone, Mail, Dog, Send, ChevronLeft, Loader2,
  PawPrint, Search, Mic, Wrench
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { API_URL, getApiUrl } from '../utils/api';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import ProductCard from '../components/ProductCard';
import PersonalizedPicks from '../components/PersonalizedPicks';
import CuratedConciergeSection from '../components/Mira/CuratedConciergeSection';
import { getSoulBasedReason } from '../utils/petSoulInference';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import OccasionBoxBuilder from '../components/OccasionBoxBuilder';
import PartyPlanningWizard from '../components/PartyPlanningWizard';
import PawmeterDisplay, { PawmeterBadge } from '../components/PawmeterDisplay';
import SoulScoreArc from '../components/SoulScoreArc';
import PillarPageLayout from '../components/PillarPageLayout';
import PersonalizedPicksPanel from '../components/Mira/PersonalizedPicksPanel';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import { toast } from 'sonner';
import { ConciergeButton } from '../components/mira-os';
import { ChecklistDownloadButton } from '../components/checklists';
import MiraBirthdayBoxCard from '../components/celebrate/MiraBirthdayBoxCard';
import PersonalizedItemsSection from '../components/celebrate/PersonalizedItemsSection';
import BirthdayCountdown from '../components/celebrate/BirthdayCountdown';
import PlanMyPartyWizard from '../components/celebrate/PlanMyPartyWizard';
import SoulPersonalizationSection from '../components/SoulPersonalizationSection';
import CelebrationMemoryWall from '../components/celebrate/CelebrationMemoryWall';
import ShareCelebrationModal from '../components/celebrate/ShareCelebrationModal';
import CakeRevealSection from '../components/celebrate/CakeRevealSection';
import CelebrationAlbum from '../components/celebrate/CelebrationAlbum';
import SoulMadeCollection from '../components/SoulMadeCollection';
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import MiraCuratedLayer from '../components/Mira/MiraCuratedLayer';
import PillarPicksSection from '../components/PillarPicksSection';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';
import { PillarDailyTip, PillarHelpBuckets, PillarGuidedPaths } from '../components/PillarGoldSections';

// Lazy load Soul Explainer for footer link
const SoulExplainerVideo = lazy(() => import('../components/SoulExplainerVideo'));

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
        else if (allergyTerms.length && allergyTerms.every(a => free.includes(`${a}-free`))) mira_hint = `Free from ${allergyTerms.join(' & ')} — safe for ${petName}`;
        else if (p.mira_tag) mira_hint = p.mira_tag;
      }
      return { ...p, mira_hint, _loved: !!matchedLove };
    })
    .sort((a, b) => (a._loved === b._loved ? 0 : a._loved ? -1 : 1));
}

// Product categories for Celebrate pillar - Expanded with Cat, Rescue, Desi options
const celebrateCategories = [
  { id: 'cakes', name: 'Birthday Cakes', icon: Cake, path: '/celebrate/cakes', color: 'bg-pink-100 text-pink-600' },
  { id: 'breed-cakes', name: 'Breed Cakes', icon: Heart, path: '/celebrate/breed-cakes', color: 'bg-purple-100 text-purple-600' },
  { id: 'pupcakes', name: 'Pupcakes & Dognuts', icon: Sparkles, path: '/celebrate/pupcakes', color: 'bg-amber-100 text-amber-600' },
  { id: 'treats', name: 'Treats', icon: Gift, path: '/celebrate/treats', color: 'bg-green-100 text-green-600' },
  { id: 'hampers', name: 'Gift Hampers', icon: ShoppingBag, path: '/celebrate/hampers', color: 'bg-blue-100 text-blue-600' },
  { id: 'accessories', name: 'Party Accessories', icon: PartyPopper, path: '/celebrate/accessories', color: 'bg-rose-100 text-rose-600' },
  { id: 'cat-celebration', name: 'Cat Celebrations', icon: Sparkles, path: '/celebrate/cats', color: 'bg-cyan-100 text-cyan-600' },
  { id: 'rescue-celebration', name: 'Rescue & Gotcha', icon: Heart, path: '/celebrate/rescue', color: 'bg-orange-100 text-orange-600' },
  { id: 'desi-treats', name: 'Desi Dog Treats', icon: Star, path: '/celebrate/desi', color: 'bg-amber-100 text-amber-700' },
  { id: 'diy-kits', name: 'DIY Cake Kits', icon: Palette, path: '/celebrate/diy', color: 'bg-lime-100 text-lime-600' },
];

const CelebratePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showBoxBuilder, setShowBoxBuilder] = useState(false);
  const [boxOccasion, setBoxOccasion] = useState('birthday');
  const [showPartyWizard, setShowPartyWizard] = useState(false);
  const [showPlanMyPartyWizard, setShowPlanMyPartyWizard] = useState(false);
  const [showShareCelebration, setShowShareCelebration] = useState(false);
  const [showCelebrationAlbum, setShowCelebrationAlbum] = useState(false);
  const [showConciergeModal, setShowConciergeModal] = useState(false);
  const [conciergeSubmitting, setConciergeSubmitting] = useState(false);
  const [showSoulExplainer, setShowSoulExplainer] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const { currentPet, pets: contextPets } = usePillarContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Use currentPet from context (syncs with global pet selector)
  const activePet = currentPet;
  
  // User pets state (keep for backwards compat with some components)
  const [userPets, setUserPets] = useState([]);
  const [petSoulData, setPetSoulData] = useState(null);
  
  // Search and view mode
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('products'); // 'products' | 'services'
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [initialCategoryLoaded, setInitialCategoryLoaded] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const PRODUCTS_PER_PAGE = 24;
  
  // Shape filter state
  const [selectedShape, setSelectedShape] = useState(null);
  
  // Pillar Mira Panel state
  const [isPillarPanelOpen, setIsPillarPanelOpen] = useState(false);
  
  // Dynamic picks for the Concierge® Card preview
  const [dynamicPicks, setDynamicPicks] = useState([]);
  
  // Shape definitions for auto-detection - covers all celebrate products
  const CAKE_SHAPES = [
    { id: 'all', emoji: '✨', label: 'All Products', keywords: [] },
    { id: 'cakes', emoji: '🎂', label: 'Cakes', keywords: ['cake', 'pupcake', 'cupcake', 'birthday cake'] },
    { id: 'treats', emoji: '🦴', label: 'Treats', keywords: ['treat', 'biscuit', 'cookie', 'snack', 'chew'] },
    { id: 'hampers', emoji: '🎁', label: 'Gift Hampers', keywords: ['hamper', 'gift box', 'gift set', 'bundle'] },
    { id: 'accessories', emoji: '🎉', label: 'Party Items', keywords: ['accessory', 'party', 'decoration', 'bandana', 'hat', 'bow'] },
    { id: 'breed', emoji: '🐕', label: 'Breed Specials', keywords: ['welcome', 'kit', 'labrador', 'pug', 'beagle', 'german shepherd', 'husky', 'indie', 'golden retriever'] },
    { id: 'premium', emoji: '👑', label: 'Premium', keywords: ['premium', 'luxury', 'gourmet', 'artisan'] },
  ];
  
  // Auto-detect category from product name/description
  const detectProductShape = (product) => {
    const text = `${product.name || ''} ${product.description || ''} ${(product.tags || []).join(' ')}`.toLowerCase();
    const category = (product.category || '').toLowerCase();
    const productId = (product.id || '').toLowerCase();
    
    // Check if it's a breed product
    if (productId.startsWith('breed-') || text.includes('welcome') || text.includes('kit')) {
      return 'breed';
    }
    
    // Check for premium items
    if (text.includes('premium') || text.includes('luxury') || text.includes('gourmet')) {
      return 'premium';
    }
    
    // Check for hampers/gift sets
    if (text.includes('hamper') || text.includes('gift box') || text.includes('gift set') || text.includes('bundle')) {
      return 'hampers';
    }
    
    // Check for party accessories
    if (text.includes('accessory') || text.includes('party') || text.includes('decoration') || text.includes('bandana') || text.includes('hat') || text.includes('bow')) {
      return 'accessories';
    }
    
    // Check for treats
    if (text.includes('treat') || text.includes('biscuit') || text.includes('cookie') || text.includes('snack') || text.includes('chew')) {
      return 'treats';
    }
    
    // Check for cakes
    if (category.includes('cake') || text.includes('cake') || text.includes('pupcake') || text.includes('cupcake')) {
      return 'cakes';
    }
    
    return null;
  };
  
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/celebrate/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Celebrate {petName}'s special moments",
    subtitle: 'Birthdays, gotcha days, milestones & celebrations',
    askMira: {
      enabled: true,
      placeholder: "Birthday party ideas... gotcha day gifts",
      buttonColor: 'bg-purple-500'
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
  const [cmsHelpBuckets, setCmsHelpBuckets] = useState([]);
  const [cmsDailyTips, setCmsDailyTips] = useState([]);
  const [cmsGuidedPaths, setCmsGuidedPaths] = useState([]);
  const [askMiraQuestion, setAskMiraQuestion] = useState('');
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Celebrate ${activePet?.name || "your pet"}'s special moments`;

  const handleAskMira = () => {
    if (!askMiraQuestion.trim()) return;
    setAskMiraLoading(true);
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: askMiraQuestion,
        initialQuery: askMiraQuestion,
        context: 'celebrate',
        pillar: 'celebrate',
        source: 'pillar_top_bar',
        pet_name: activePet?.name,
        pet_breed: activePet?.breed
      }
    }));
    setAskMiraQuestion('');
    setTimeout(() => setAskMiraLoading(false), 800);
  };
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/celebrate/page-config`);
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
        if (data.helpBuckets?.length > 0) {
          setCmsHelpBuckets(data.helpBuckets);
        }
        if (data.dailyTips?.length > 0) {
          setCmsDailyTips(data.dailyTips);
        }
        if (data.guidedPaths?.length > 0) {
          setCmsGuidedPaths(data.guidedPaths);
        }
        console.log('[CelebratePage] CMS config loaded');
      }
    } catch (error) {
      console.error('[CelebratePage] Failed to fetch CMS config:', error);
    }
  };

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);
  
  // Fetch dynamic picks for the Concierge® Card preview
  useEffect(() => {
    const fetchDynamicPicks = async () => {
      if (!activePet?.name || !token) return;
      
      // Icon name to emoji mapping
      const iconToEmoji = {
        'cake': '🎂',
        'utensils': '🍽️',
        'party-popper': '🎉',
        'camera': '📸',
        'gift': '🎁',
        'heart': '💜',
        'star': '⭐',
        'sparkles': '✨',
        'mug': '☕',
        'coaster': '🎁',
        'bandana': '🎀',
        'portrait': '🖼️',
        'tag': '🏷️',
        'plush': '🧸',
        'paw': '🐾',
        'bone': '🦴',
        'balloon': '🎈',
        'confetti': '🎊'
      };
      
      try {
        const response = await fetch(
          `${API_URL}/api/mira/top-picks/${encodeURIComponent(activePet.name)}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          // Get celebrate pillar picks - both concierge and catalogue
          const celebratePicks = [];
          
          // Add concierge picks (personalized items) - full data
          if (data.pillars?.celebrate?.concierge_picks) {
            celebratePicks.push(...data.pillars.celebrate.concierge_picks.map(p => ({
              icon: iconToEmoji[p.icon] || p.icon || '✨',
              name: p.name,
              description: p.description || p.why_it_fits || ''
            })));
          }
          
          // Add catalogue picks - full data
          if (data.pillars?.celebrate?.catalogue_picks) {
            celebratePicks.push(...data.pillars.celebrate.catalogue_picks.slice(0, 2).map(p => ({
              icon: '🎂',
              name: p.name,
              description: p.why_it_fits || ''
            })));
          }
          
          setDynamicPicks(celebratePicks.slice(0, 6));
        }
      } catch (err) {
        console.error('[CelebratePage] Error fetching dynamic picks:', err);
      }
    };
    
    fetchDynamicPicks();
  }, [activePet?.name, token]);
  
  // Read category from URL params on mount
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && CATEGORY_API_MAP[categoryFromUrl]) {
      setSelectedSubcat(categoryFromUrl);
      // Scroll to products section after a short delay
      setTimeout(() => {
        document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
    setInitialCategoryLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - category changes are handled by handleSubcategoryChange
  
  // Update URL when category changes (for sharing/bookmarking)
  const handleSubcategoryChange = (subcatId) => {
    setSelectedSubcat(subcatId);
    if (subcatId) {
      setSearchParams({ category: subcatId });
    } else {
      setSearchParams({});
    }
    // Scroll to products section
    setTimeout(() => {
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  // Complete category mapping for API filter - covers ALL celebrate subcategories
  const CATEGORY_API_MAP = {
    'cakes': 'cakes',
    'birthday-cakes': 'cakes',
    'breed-cakes': 'breed-cakes',
    'pupcakes': 'dognuts',
    'dognuts': 'dognuts',
    'treats': 'treats',
    'desi-treats': 'desi-treats',
    'hampers': 'hampers',
    'gift-hampers': 'hampers',
    'accessories': 'accessories',
    'party-accessories': 'accessories',
    'cat-treats': 'cat-treats',
    'valentine': 'valentine',
    'frozen-treats': 'frozen-treats',
    'mini-cakes': 'mini-cakes'
  };
  
  // Category display names for the section title
  const CATEGORY_DISPLAY_NAMES = {
    'cakes': 'Birthday Cakes',
    'breed-cakes': 'Breed Cakes',
    'pupcakes': 'Pupcakes & Dognuts',
    'treats': 'Treats',
    'hampers': 'Gift Hampers',
    'accessories': 'Party Accessories',
    'desi-treats': 'Desi Treats',
    'cat-treats': 'Cat Treats',
    'valentine': 'Valentine Collection',
    'frozen-treats': 'Frozen Treats',
    'mini-cakes': 'Mini Cakes'
  };

  // Rotating hero images for visual appeal
  const HERO_IMAGES = [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
    'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1200&q=80',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80'
  ];

  // Rotate hero images - use stable interval
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % 3); // Use constant 3 instead of HERO_IMAGES.length
    }, 5000);
    return () => clearInterval(interval);
  }, []); // Empty deps - only run once on mount
  
  // Fetch pets and soul data - consolidated
  useEffect(() => {
    const fetchPetData = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || [];
          setUserPets(pets);
        }
      } catch (err) {
        console.debug('Failed to fetch pet data:', err);
      }
    };
    fetchPetData();
  }, [token]);
  
  // Fetch soul data when activePet changes
  useEffect(() => {
    const fetchSoulData = async () => {
      if (!token || !activePet?.id) return;
      try {
        const soulRes = await fetch(`${API_URL}/api/pets/${activePet.id}/soul`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (soulRes.ok) {
          const soulData = await soulRes.json();
          setPetSoulData(soulData);
        }
      } catch (err) {
        console.debug('Failed to fetch soul data:', err);
      }
    };
    fetchSoulData();
  }, [token, activePet?.id]);
  
  // Concierge® request form state
  const [conciergeForm, setConciergeForm] = useState({
    name: '',
    phone: '',
    email: '',
    petId: '',
    petName: '',
    occasion: 'birthday',
    celebrationDate: '',
    guestCount: '',
    budget: '',
    specialRequests: ''
  });

  // Update concierge form with pet data from usePetOS
  useEffect(() => {
    if (activePet) {
      setConciergeForm(prev => ({
        ...prev,
        petId: activePet.id || activePet._id,
        petName: activePet.name
      }));
    }
  }, [activePet]);

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setConciergeForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || user.whatsapp || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Listen for openSoulExplainer event from footer
  useEffect(() => {
    const handleOpenExplainer = () => setShowSoulExplainer(true);
    window.addEventListener('openSoulExplainer', handleOpenExplainer);
    return () => window.removeEventListener('openSoulExplainer', handleOpenExplainer);
  }, []);

  // Submit concierge request to unified flow
  const handleConciergeSubmit = async (e) => {
    e.preventDefault();
    setConciergeSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: 'celebration_concierge',
          pillar: 'celebrate',
          source: 'ask_concierge_button',
          customer: {
            name: conciergeForm.name,
            phone: conciergeForm.phone,
            email: conciergeForm.email
          },
          details: {
            pet_name: conciergeForm.petName,
            occasion: conciergeForm.occasion,
            celebration_date: conciergeForm.celebrationDate,
            guest_count: conciergeForm.guestCount,
            budget: conciergeForm.budget,
            special_requests: conciergeForm.specialRequests
          },
          priority: 'high',
          intent: 'celebration_planning'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Request submitted!', {
          description: `Your celebration request #${data.request_id || data.ticket_id} has been received. Our team will contact you within 2 hours.`
        });
        setShowConciergeModal(false);
        // Reset form
        setConciergeForm(prev => ({
          ...prev,
          petName: '',
          occasion: 'birthday',
          celebrationDate: '',
          guestCount: '',
          budget: '',
          specialRequests: ''
        }));
      } else {
        toast.error('Failed to submit request', { description: data.detail || 'Please try again' });
      }
    } catch (error) {
      console.error('Concierge® request error:', error);
      toast.error('Network error', { description: 'Please check your connection and try again' });
    } finally {
      setConciergeSubmitting(false);
    }
  };

  // Check for build_box URL param from reminder emails/links
  useEffect(() => {
    const buildBoxParam = searchParams.get('build_box');
    if (buildBoxParam) {
      // Valid occasions: birthday, gotcha_day, festival
      const validOccasions = ['birthday', 'gotcha_day', 'festival'];
      const occasion = validOccasions.includes(buildBoxParam) ? buildBoxParam : 'birthday';
      setBoxOccasion(occasion);
      setShowBoxBuilder(true);
      // Clear the param from URL - use a new URLSearchParams to avoid mutation
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('build_box');
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - not on searchParams change to avoid loops

  // Reset pagination when filters change - wait for URL params to be read first
  useEffect(() => {
    if (!initialCategoryLoaded) return; // Don't fetch until we've checked URL params
    
    setCurrentPage(1);
    setSelectedShape(null);
    fetchFeaturedProducts(selectedSubcat, 1, null);
  }, [selectedSubcat, initialCategoryLoaded]);

  const fetchFeaturedProducts = async (category = null, page = 1, shapeFilter = null, append = false) => {
    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const skip = (page - 1) * PRODUCTS_PER_PAGE;
      // Build API URL with category filter, pagination
      let url = `${API_URL}/api/products?pillar=celebrate&limit=100&skip=0`; // Fetch more for client-side filtering
      if (category && CATEGORY_API_MAP[category]) {
        url += `&category=${CATEGORY_API_MAP[category]}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        let products = data.products || data || [];
        let total = data.total || products.length;
        
        // Additional client-side filtering for category
        if (category && CATEGORY_API_MAP[category]) {
          const apiCategory = CATEGORY_API_MAP[category].toLowerCase();
          products = products.filter(p => {
            const productCategory = (p.category || '').toLowerCase();
            const productTags = (p.tags || []).map(t => (t || '').toLowerCase());
            const productName = (p.name || p.title || '').toLowerCase();
            
            // Match by category, tags, or name
            return productCategory.includes(apiCategory) ||
                   productTags.some(t => t.includes(apiCategory)) ||
                   productName.includes(apiCategory.replace('-', ' '));
          });
        }
        
        // Client-side shape/category filtering
        if (shapeFilter && shapeFilter !== 'all') {
          const shape = CAKE_SHAPES.find(s => s.id === shapeFilter);
          if (shape && shape.keywords.length > 0) {
            products = products.filter(p => {
              const text = `${p.name || ''} ${p.description || ''} ${(p.tags || []).join(' ')} ${p.id || ''}`.toLowerCase();
              const productCategory = (p.category || '').toLowerCase();
              return shape.keywords.some(keyword => text.includes(keyword) || productCategory.includes(keyword));
            });
          }
        }
        
        // Update total after filtering
        total = products.length;
        
        // Apply Mira Intelligence filtering
        const intelligent = applyMiraIntelligence(products, getAllergies(activePet), getLoves(activePet), null, null, activePet);
        
        // Apply pagination after filtering
        const paginatedProducts = intelligent.slice(skip, skip + PRODUCTS_PER_PAGE);
        
        if (append && page > 1) {
          setFeaturedProducts(prev => [...prev, ...paginatedProducts]);
        } else {
          setFeaturedProducts(paginatedProducts);
        }
        
        setTotalProducts(total);
        setHasMore(skip + paginatedProducts.length < total);
        setCurrentPage(page);
        
        console.log(`[CelebratePage] Loaded ${paginatedProducts.length} products (page ${page}, total: ${total})${category ? ` for ${category}` : ''}${shapeFilter ? ` filter: ${shapeFilter}` : ''}`);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Load more products
  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      fetchFeaturedProducts(selectedSubcat, currentPage + 1, selectedShape, true);
    }
  };
  
  // Handle shape filter click - now does client-side filtering
  const handleShapeFilter = (shapeId) => {
    if (selectedShape === shapeId || shapeId === 'all') {
      // Toggle off or "All" selected - show all products
      setSelectedShape(null);
      fetchFeaturedProducts(selectedSubcat, 1, null);
    } else {
      setSelectedShape(shapeId);
      // Client-side filtering based on shape keywords
      fetchFeaturedProducts(selectedSubcat, 1, shapeId);
    }
  };
  
  const handleBuildBox = (occasion) => {
    // Navigate to the dedicated occasion box page
    navigate(`/occasion-box/${occasion}`);
  };
  
  const handleAddToCart = (items) => {
    items.forEach(item => {
      addToCart({
        id: item.id,
        title: item.title || item.name,
        price: item.price,
        image: item.image_url || item.image || item.images?.[0],
        quantity: 1
      });
    });
  };

  return (
    <PillarPageLayout
      pillar="celebrate"
      title={activePet ? `Celebrations for ${activePet.name}` : "Celebrations for Your Pet"}
      description={activePet ? `Mark the moments that matter to ${activePet.name}` : "Mark the moments that matter to your furry friend"}
      useTabNavigation={true}
      onSubcategoryChange={handleSubcategoryChange}
    >
      {/* Main Content with iOS Safe Area Bottom Padding */}
      <div className="pb-24 theme-celebrate" data-testid="celebrate-page">

      {/* ═══════════════════════════════════════════════════════════════════════════════
          1. ASK MIRA BAR - Gold Standard top entry, more prominent on Celebrate
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.askMira?.enabled !== false && (
        <section className="px-4 py-8 bg-gradient-to-b from-rose-50 via-pink-50 to-white" data-testid="celebrate-top-ask-mira">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-[2rem] border border-pink-100 bg-gradient-to-r from-white via-pink-50 to-rose-50 p-6 md:p-8 shadow-[0_20px_60px_rgba(244,114,182,0.15)]">
              <div className="text-center mb-5">
                <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-1.5 mb-3" data-testid="celebrate-ask-mira-badge">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Ask Mira First
                </Badge>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900" data-testid="celebrate-page-title">
                  {pageTitle}
                </h1>
                <p className="text-sm md:text-base text-slate-600 mt-2 max-w-2xl mx-auto">
                  Start with Mira for soul-aware ideas, then continue in the same chat below — no duplicate assistant, no lost context.
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="flex gap-2 items-center bg-white rounded-full border-2 border-pink-200 shadow-sm p-1.5 pl-5">
                  <Search className="w-5 h-5 text-pink-400 flex-shrink-0" />
                  <Input
                    value={askMiraQuestion}
                    onChange={(e) => setAskMiraQuestion(e.target.value)}
                    placeholder={cmsConfig.askMira?.placeholder || `Party ideas for ${activePet?.name || 'my pet'}... gotcha day gifts... memory keepsakes`}
                    className="flex-1 border-0 focus-visible:ring-0 text-sm md:text-base placeholder:text-slate-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleAskMira()}
                    data-testid="ask-celebrate-input"
                  />
                  <Button
                    onClick={handleAskMira}
                    disabled={askMiraLoading || !askMiraQuestion.trim()}
                    className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:opacity-90 h-11 px-5 md:px-6 text-white"
                    data-testid="ask-celebrate-submit"
                  >
                    {askMiraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" />Ask Mira</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          CELEBRATE TOPIC CARDS - Quick access to celebration categories
          Birthdays, Gotcha Day, Gifts, Photoshoots
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <PillarTopicsGrid
        pillar="celebrate"
        topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.celebrate}
        columns={4}
      />

      {/* ════════════════════════════════════════════════════════════════════
          3. DAILY CELEBRATE TIP + 4. HOW CAN WE HELP + 5. GUIDED PATHS
          Gold Standard sections
          ════════════════════════════════════════════════════════════════════ */}
      <PillarDailyTip
        tips={cmsDailyTips.length > 0 ? cmsDailyTips : [
          { category: 'Birthday Ideas', tip: 'A pupcake with a single candle for your dog\'s birthday is one of those small rituals that creates a lifetime of memories.', icon: 'Award', color: 'from-purple-500 to-pink-500' },
          { category: 'Gotcha Day', tip: 'Your pet\'s "Gotcha Day" — the anniversary of their adoption — is worth celebrating as much as a birthday. Start the tradition!', icon: 'Heart', color: 'from-pink-500 to-rose-500' },
          { category: 'Photography Tips', tip: 'Capture the best pet photos at their eye level. Natural light in the morning gives warm, beautiful tones without a flash.', icon: 'Camera', color: 'from-violet-500 to-purple-500' },
          { category: 'Gift Ideas', tip: 'The best gift for your dog isn\'t the most expensive — it\'s something that matches their personality. A scent trail for a sniffer, a tug toy for a tugger.', icon: 'Star', color: 'from-rose-500 to-pink-500' },
          { category: 'Party Planning', tip: 'Keep dog parties small. 3-4 dogs who know each other is the sweet spot. Large groups can create anxiety even in social dogs.', icon: 'Users', color: 'from-fuchsia-500 to-purple-500' },
          { category: 'Milestones', tip: 'Mark your pet\'s milestones: first year anniversary, first training graduation, first travel trip. These memories matter.', icon: 'Award', color: 'from-pink-400 to-violet-500' },
          { category: 'Cake Safety', tip: 'Only use dog-safe "pupcakes" for your pet\'s birthday. Human cakes with xylitol, raisins, or chocolate can be toxic to dogs.', icon: 'Shield', color: 'from-purple-400 to-pink-500' },
        ]}
        tipLabel="Today's Celebration Tip"
      />

      <PillarHelpBuckets
        pillar="celebrate"
        buckets={cmsHelpBuckets.length > 0 ? cmsHelpBuckets : [
          { id: 'party', title: 'Plan a Party', icon: 'Award', color: 'purple', items: ['Birthday packages', 'Dog party supplies', 'Venue booking', 'Guest list help'] },
          { id: 'gifts', title: 'Find Perfect Gifts', icon: 'Star', color: 'pink', items: ['Personalised gifts', 'Birthday cakes', 'Gift boxes', 'Memory keepsakes'] },
          { id: 'memories', title: 'Capture Memories', icon: 'Calendar', color: 'violet', items: ['Pet photography', 'Birthday cards', 'Video reels', 'Anniversary gifts'] },
        ]}
      />

      <PillarGuidedPaths
        pillar="celebrate"
        heading="Guided Celebration Paths"
        paths={cmsGuidedPaths.length > 0 ? cmsGuidedPaths : [
          { title: 'Birthday Party Path', topicSlug: 'birthday', steps: ['Choose theme', 'Guest list', 'Order cake', 'Decorate space', 'Capture moments'], color: 'purple' },
          { title: 'Gotcha Day Path', topicSlug: 'gotcha', steps: ['Find adoption date', 'Choose celebration', 'Special outing', 'Photo session', 'Share the story'], color: 'pink' },
          { title: 'Pet Photoshoot', topicSlug: 'photo', steps: ['Choose location', 'Plan outfit/props', 'Book photographer', 'Morning golden hour', 'Edit & frame'], color: 'violet' },
          { title: 'Gift Curation', topicSlug: 'gifts', steps: ['Know personality', 'Set budget', 'Choose personalised item', 'Gift wrap', 'Delivery'], color: 'rose' },
          { title: 'Graduation Party', topicSlug: 'training', steps: ['Training complete', 'Invite family', 'Get certificate', 'Special treat', 'Share achievement'], color: 'fuchsia' },
        ]}
      />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BIRTHDAY COUNTDOWN - Emotional anticipation builder */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activePet && (
        <div className="max-w-6xl mx-auto px-4 pt-6 mb-6">
          <BirthdayCountdown 
            pet={activePet}
            onPlanParty={() => setShowPlanMyPartyWizard(true)}
            onViewCakes={() => {
              setSearchParams({ category: 'cakes' });
              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: THEDOGGYBAKERY - HERO PRODUCTS (Our own bakery!) */}
      {/* Real products from thedoggybakery.com - Fresh cakes & treats */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 py-8 section-fade-in" id="products-section" data-testid="shopify-products-section">
        {/* TheDoggyBakery Header - HERO */}
        <div className="text-center mb-8">
          <Badge className="mb-3 bg-amber-100 text-amber-800 px-4 py-1">
            🍰 Fresh from TheDoggyBakery
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Artisan Cakes & Treats
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Freshly baked, dog-safe treats from our bakery. Pan India delivery available.
          </p>
        </div>

        {/* MIRA ADVISOR - Party Planning AI Assistant */}
        <div className="max-w-2xl mx-auto mb-8">
          <MiraAdvisorCard pillar="celebrate" activePet={activePet} />
          
          {/* Download Birthday Party Checklist */}
          <div className="mt-4 flex justify-center">
            <ChecklistDownloadButton 
              pillar="celebrate" 
              variant="outline"
              className="border-pink-300 text-pink-700 hover:bg-pink-50"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SOUL PERSONALIZATION SECTION - THE CENTERPIECE */}
      {/* This is the Pet Operating System layer - deeply personalized to the pet */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SoulPersonalizationSection pillar="celebrate" />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: SOUL-BASED CAKE PICKS (Personalized by pet's soul) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <PersonalizedPicks 
          key={`personalized-picks-${activePet?.id || 'default'}`}
          pillar="celebrate" 
          maxProducts={6} 
        />
      </div>

      {/* BREED-SMART RECOMMENDATIONS - Based on breed_matrix */}
      {activePet && token && (
        <div className="max-w-6xl mx-auto px-4 py-4" data-testid="celebrate-breed-smart-section">
          <BreedSmartRecommendations pillar="celebrate" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 3: CURATED BUNDLES - Birthday Pawty, Gotcha Day */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <CuratedBundles pillar="celebrate" showTitle={true} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SECTION 4: AI MERCHANDISE - Soul Made Collection */}
      {/* AI-Generated personalized products based on pet's soul */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activePet && token && (
        <div className="max-w-6xl mx-auto px-4 py-8 section-fade-in" data-testid="soul-made-section">
          <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-white rounded-3xl p-6 sm:p-8 border border-purple-100">
            {/* <SoulMadeCollection
              key={`soul-made-${activePet?.id || 'guest'}`}
              pillar="celebrate"
              maxItems={8}
              showTitle={true}
            /> */}
          </div>
        </div>
      )}

      {/* MIRA'S BIRTHDAY BOX - Soul-Driven Personalized Box Suggestion */}
      {activePet && token && (
        <div className="max-w-6xl mx-auto px-4 mt-6" data-testid="mira-birthday-box-section">
          <MiraBirthdayBoxCard
            pet={activePet}
            token={token}
            userEmail={user?.email}
            onSuccess={(data) => {
              console.log('[CelebratePage] Birthday box request created:', data);
            }}
          />
        </div>
      )}
            
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PLAN MY PARTY CTA - Magical party planning wizard trigger */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div 
          onClick={() => setShowPlanMyPartyWizard(true)}
          className="group cursor-pointer bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 p-1 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]"
        >
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-xl p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-2xl sm:text-3xl">🎉</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-1 flex items-center gap-2">
                  Plan {activePet?.name || 'Your Pet'}'s Perfect Party
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </h3>
                <p className="text-sm text-gray-300">
                  Let Mira help you create a magical celebration in 3 easy steps
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
            
      {/* TheDoggyBakery Promotion - Pan India Delivery */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-pink-50 rounded-2xl p-5 sm:p-6 border border-amber-200/50 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Cake className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-gray-900 text-base sm:text-lg">TheDoggyBakery</h4>
                <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                  Pan India Delivery
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Our in-house artisan bakery crafts fresh, healthy, and delicious cakes & treats 
                specially designed for {activePet?.name || 'your pet'}. 100% pet-safe ingredients, no preservatives.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <a 
                  href="https://thedoggybakery.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-all shadow-sm"
                >
                  <Cake className="w-4 h-4" />
                  Order Fresh Cake
                  <ChevronRight className="w-4 h-4" />
                </a>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Delivers to all major cities
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CELEBRATION MEMORY WALL - Real moments from the community */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 section-fade-in">
        <CelebrationMemoryWall 
          onShareStory={() => setShowShareCelebration(true)}
          onViewAll={() => {
            // Navigate to full gallery or show modal
            toast.info('Full gallery coming soon! 📸');
          }}
          onCreateAlbum={() => setShowCelebrationAlbum(true)}
        />
      </div>

      {/* Elevated Concierge® Experiences */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16 section-fade-in stagger-2" data-testid="celebrate-experiences-section">
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 sm:px-4 py-1 text-xs sm:text-sm haptic-btn">
              <Crown className="w-3 h-3 mr-1 inline" /> Elevated Concierge®
            </Badge>
          </div>
          <h2 className="ios-title-1 text-gray-900 mb-2 sm:mb-3">
            Celebrations, Perfected
          </h2>
          <p className="ios-callout text-gray-600 max-w-2xl mx-auto px-2">
            More than cakes. Our Celebrate Concierge® orchestrates every detail of your pet&apos;s special day - 
            from intimate gatherings to grand pawties.
          </p>
        </div>

        {/* Elevated Concierge® Experiences - Bento Grid with Featured First Card */}
        <div className="bento-grid">
          {/* Featured Card - Full Width on Mobile */}
          <div className="bento-featured haptic-card section-fade-in stagger-1" data-testid="experience-birthday-bash">
            <ConciergeExperienceCard
              pillar="celebrate"
              title="Ultimate Birthday Bash®"
              description="A complete birthday celebration package with custom cake, decorations, venue, photography & entertainment."
              icon="🎉"
              gradient="from-pink-500 to-rose-500"
              badge="Signature"
              badgeColor="bg-pink-500"
              highlights={[
                "Custom themed decorations",
                "Professional pet photography",
                "Gourmet cake & treats for all guests",
                "Activity planning & coordination"
              ]}
            />
          </div>
          
          <div className="haptic-card section-fade-in stagger-2" data-testid="experience-gotcha-day">
            <ConciergeExperienceCard
              pillar="celebrate"
              title="Gotcha Day Special®"
              description="Celebrate the anniversary of when your furry friend joined your family with a meaningful experience."
              icon="💜"
              gradient="from-purple-500 to-violet-500"
              highlights={[
                "Memory book creation",
                "Professional photoshoot",
                "Custom celebration cake",
                "Special treats package"
              ]}
            />
          </div>
          
          <div className="haptic-card section-fade-in stagger-3" data-testid="experience-pawty-planning">
            <ConciergeExperienceCard
              pillar="celebrate"
              title="Pawty Planning Pro®"
              description="Full-service party planning for pet birthdays, adoption anniversaries, or any celebration."
              icon="🎈"
              gradient="from-amber-500 to-orange-500"
              badge="Popular"
              badgeColor="bg-amber-500"
              highlights={[
                "Guest list management",
                "Venue sourcing & booking",
                "Catering for pets & humans",
                "Entertainment coordination"
              ]}
            />
          </div>
          
          <div className="haptic-card section-fade-in stagger-4" data-testid="experience-puppy-shower">
            <ConciergeExperienceCard
              pillar="celebrate"
              title="Puppy Shower®"
              description="Welcome a new furry family member with a beautifully organized puppy shower celebration."
              icon="🐾"
              gradient="from-cyan-500 to-teal-500"
              highlights={[
                "Baby shower style setup",
                "Gift registry coordination",
                "New parent essentials guide",
                "Photography included"
              ]}
            />
          </div>
          
          <div className="haptic-card section-fade-in stagger-5" data-testid="experience-pet-wedding">
            <ConciergeExperienceCard
              pillar="celebrate"
              title="Pet Wedding Ceremony®"
              description="A magical ceremony for your pet's special union - complete with outfits, venue & photography."
              icon="💒"
              gradient="from-rose-400 to-pink-500"
              highlights={[
              "Custom pet outfits",
              "Venue decoration",
              "Pet-safe cake & treats",
              "Ceremony coordination"
            ]}
          />
          </div>
          
          <div className="haptic-card section-fade-in stagger-6" data-testid="experience-milestone">
            <ConciergeExperienceCard
              pillar="celebrate"
              title="Milestone Moments®"
              description="Professional documentation of your pet's special milestones - first birthday, senior celebration, etc."
              icon="📸"
              gradient="from-indigo-500 to-purple-500"
              highlights={[
                "Professional photography session",
                "Custom milestone props",
                "Digital album creation",
                "Social media-ready photos"
              ]}
            />
          </div>
        </div>
      </div>

      {/* How Concierge® Works */}
      <div className="gradient-celebrate py-10 sm:py-16 section-fade-in stagger-3" data-testid="celebrate-how-it-works">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="ios-title-2 text-center text-gray-900 mb-6 sm:mb-10">
            How Celebrate Concierge® Works
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { step: 1, icon: '💬', title: 'Share Vision', desc: 'Tell us your dreams' },
              { step: 2, icon: '✨', title: 'We Plan', desc: 'Custom celebration' },
              { step: 3, icon: '🎯', title: 'We Execute', desc: 'Every detail handled' },
              { step: 4, icon: '🎉', title: 'Celebrate!', desc: 'Stress-free magic' }
            ].map((item) => (
              <Card key={item.step} className="glass-card p-3 sm:p-6 text-center haptic-card" data-testid={`how-it-works-step-${item.step}`}>
                <div className="experience-icon w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 text-2xl sm:text-3xl">
                  {item.icon}
                </div>
                <div className="text-gradient-celebrate font-bold text-[10px] sm:text-sm mb-1">Step {item.step}</div>
                <h3 className="ios-headline text-gray-900 text-xs sm:text-base mb-0.5 leading-tight">{item.title}</h3>
                <p className="ios-caption text-gray-600 leading-tight">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 🎂 SMART CAKE DISCOVERY - Floating Pill Dock */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10 section-fade-in stagger-4" data-testid="celebrate-smart-filters">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="ios-title-2 text-gray-900 mb-1 sm:mb-2">
            Find the Perfect Cake
          </h2>
          <p className="ios-subhead text-gray-600">Tap what matters most to you</p>
        </div>
        
        {/* Smart Filter Pills - Floating Pill Dock with Snap Scroll */}
        <div className="relative">
          <div className="pill-dock">
            {[
              { emoji: '🐕', label: 'By Breed', filter: 'breed-cakes', desc: 'Labrador, Pug, GSD...' },
              { emoji: '🎁', label: 'Gift Ready', filter: 'gift-hampers', desc: 'Beautifully packaged' },
              { emoji: '🥜', label: 'Allergy Safe', filter: 'allergy-free', desc: 'No wheat, no nuts' },
              { emoji: '💰', label: 'Under ₹500', filter: 'budget', desc: 'Sweet savings' },
              { emoji: '⚡', label: 'Same Day', filter: 'same-day', desc: 'Order now, get today' },
              { emoji: '🏆', label: 'Bestsellers', filter: 'bestsellers', desc: 'Fan favourites' },
              { emoji: '🐱', label: 'Cat Cakes', filter: 'cat-treats', desc: 'Feline friends' },
              { emoji: '✨', label: 'Premium', filter: 'premium', desc: 'Luxury treats' },
            ].map((item) => (
              <Link 
                key={item.filter}
                to={`/celebrate/${item.filter}`}
                className="pill-item pill-item-celebrate haptic-btn"
                data-testid={`filter-${item.filter}`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="ios-subhead font-medium">{item.label}</span>
                </span>
              </Link>
            ))}
          </div>
          {/* Scroll indicator for mobile */}
          <div className="sm:hidden flex justify-center mt-2">
            <span className="ios-caption text-gray-400">← Swipe for more →</span>
          </div>
        </div>
        
        {/* Quick Stats - Glass Cards */}
        <div className="flex justify-center gap-4 sm:gap-8 mt-6 sm:mt-8 text-center">
          <div className="glass-card px-4 py-3 haptic-card" data-testid="stat-designs">
            <div className="ios-title-3 text-gradient-celebrate">50+</div>
            <div className="ios-caption text-gray-500">Cake Designs</div>
          </div>
          <div className="glass-card px-4 py-3 haptic-card" data-testid="stat-rating">
            <div className="ios-title-3 text-gradient-celebrate">4.9★</div>
            <div className="ios-caption text-gray-500">Avg Rating</div>
          </div>
          <div className="glass-card px-4 py-3 haptic-card" data-testid="stat-delivery">
            <div className="ios-title-3 text-gradient-celebrate">2hr</div>
            <div className="ios-caption text-gray-500">Fastest Delivery</div>
          </div>
        </div>
      </div>

      {/* Featured Products - Premium Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16 section-fade-in stagger-5" id="products-section" data-testid="celebrate-products-section">
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <div>
            <h2 className="ios-title-2 text-gray-900">
              {selectedSubcat 
                ? CATEGORY_DISPLAY_NAMES[selectedSubcat] || celebrateCategories.find(c => c.id === selectedSubcat)?.name || 'Celebration Items'
                : 'All Celebration Products'
              }
            </h2>
            <p className="ios-subhead text-gray-600">
              {selectedSubcat 
                ? 'Filtered results'
                : 'Browse our collection • Tap a category above to filter'
              }
            </p>
          </div>
          {selectedSubcat && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1 sm:gap-2 text-xs sm:text-sm haptic-btn rounded-full"
              onClick={() => handleSubcategoryChange(null)}
              data-testid="show-all-products-btn"
            >
              Show All
            </Button>
          )}
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* PRODUCT CATEGORY FILTER PILLS */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="mb-6" data-testid="shape-filters">
          <p className="ios-caption text-gray-500 mb-2 flex items-center gap-1">
            <span>🎉</span> Filter by category:
          </p>
          <div className="flex flex-wrap gap-2">
            {CAKE_SHAPES.map((shape) => (
              <button
                key={shape.id}
                onClick={() => handleShapeFilter(shape.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  (selectedShape === shape.id) || (shape.id === 'all' && !selectedShape)
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-700 hover:border-pink-300 hover:bg-pink-50'
                }`}
                data-testid={`shape-filter-${shape.id}`}
              >
                <span>{shape.emoji}</span>
                <span>{shape.label}</span>
              </button>
            ))}
            {selectedShape && (
              <button
                onClick={() => handleShapeFilter(selectedShape)}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1"
                data-testid="clear-shape-filter"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="glass-card p-3 sm:p-4 md:p-6">
                <div className="aspect-square skeleton-shimmer rounded-2xl mb-3 sm:mb-4"></div>
                <div className="h-3 sm:h-4 skeleton-shimmer rounded-full w-3/4 mb-2"></div>
                <div className="h-3 sm:h-4 skeleton-shimmer rounded-full w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <div key={product._id || product.id} className="haptic-card">
                <ProductCard product={product} pillar="celebrate" selectedPet={activePet} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="glass-card p-8 sm:p-12 text-center">
            <Cake className="w-10 h-10 sm:w-12 sm:h-12 text-pink-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="ios-headline text-gray-900 mb-2">
              {selectedSubcat ? 'No products in this category' : 'Coming Soon!'}
            </h3>
            <p className="text-sm text-gray-600">
              {selectedSubcat 
                ? 'Try selecting a different category or view all products.'
                : 'Our celebration products will be available shortly.'
              }
            </p>
            {selectedSubcat && (
              <Button 
                className="mt-4"
                onClick={() => handleSubcategoryChange(null)}
              >
                View All Products
              </Button>
            )}
          </Card>
        )}
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* LOAD MORE BUTTON */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {hasMore && !loading && featuredProducts.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={loadMoreProducts}
              disabled={loadingMore}
              size="lg"
              className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold shadow-lg"
              data-testid="load-more-btn"
            >
              {loadingMore ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Loading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Load More Products
                </span>
              )}
            </Button>
          </div>
        )}
        
        {/* All products loaded indicator */}
        {!hasMore && featuredProducts.length > 0 && totalProducts > PRODUCTS_PER_PAGE && (
          <div className="text-center mt-6">
            <p className="ios-caption text-gray-500">
              ✓ All products loaded
            </p>
          </div>
        )}
      </div>

      {/* Bottom CTA - Glass Style */}
      <div className="gradient-celebrate-dark text-white py-12 sm:py-20 px-4 section-fade-in stagger-6" data-testid="celebrate-bottom-cta">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="ios-title-1 text-white mb-3 sm:mb-4">
            Ready to Plan the Pawfect Celebration?
          </h2>
          <p className="ios-body text-pink-100 mb-8 sm:mb-10 px-2">
            Let our Celebrate Concierge® create an unforgettable experience for your furry friend.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
            {/* Glass Primary Button */}
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-white/95 backdrop-blur-md text-pink-600 hover:bg-white gap-2 h-14 sm:h-12 font-semibold shadow-xl rounded-full haptic-btn"
              onClick={() => {
                if (user) {
                  setConciergeForm(prev => ({
                    ...prev,
                    name: user.name || prev.name || '',
                    phone: user.phone || user.whatsapp || prev.phone || '',
                    email: user.email || prev.email || ''
                  }));
                }
                setShowConciergeModal(true);
              }}
              data-testid="ask-concierge-btn"
            >
              <Sparkles className="w-5 h-5" />
              Ask Concierge®
            </Button>
            {/* Glass Secondary Button */}
            <Link to="/celebrate/birthday-cakes" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-white/50 text-white hover:bg-white/20 gap-2 h-14 sm:h-12 rounded-full haptic-btn" data-testid="shop-products-btn">
                <ShoppingBag className="w-5 h-5" />
                Shop Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* === SERVICE CATALOG WITH PRICING === */}
      <div className="section-fade-in" data-testid="celebrate-service-catalog">
        <ServiceCatalogSection 
          pillar="celebrate"
          title="Celebrate, Personalised"
          subtitle="Let our concierge help you create the perfect celebration"
          maxServices={8}
          hidePrice={true}
        />
      </div>
      
      {/* Occasion Box Builder Modal */}
      <OccasionBoxBuilder
        isOpen={showBoxBuilder}
        onClose={() => setShowBoxBuilder(false)}
        occasionType={boxOccasion}
        petName="your pet"
        onAddToCart={handleAddToCart}
      />
      
      {/* Ask Concierge® Modal - Celebration Request Form */}
      {showConciergeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConciergeModal(false)}>
          <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Ask Concierge®</h2>
                    <p className="text-pink-100 text-sm">Plan the pawfect celebration</p>
                  </div>
                </div>
                <button onClick={() => setShowConciergeModal(false)} className="p-2 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleConciergeSubmit} className="p-5 space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Your Name *</label>
                  <Input
                    value={conciergeForm.name}
                    onChange={(e) => setConciergeForm({...conciergeForm, name: e.target.value})}
                    placeholder="Your name"
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">WhatsApp *</label>
                  <Input
                    type="tel"
                    value={conciergeForm.phone}
                    onChange={(e) => setConciergeForm({...conciergeForm, phone: e.target.value})}
                    placeholder="+91 98765 43210"
                    required
                    className="h-11"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                <Input
                  type="email"
                  value={conciergeForm.email}
                  onChange={(e) => setConciergeForm({...conciergeForm, email: e.target.value})}
                  placeholder="your@email.com"
                  required
                  className="h-11"
                />
              </div>
              
              {/* Pet & Occasion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Pet&apos;s Name *</label>
                  {userPets.length > 1 ? (
                    <select
                      value={conciergeForm.petId}
                      onChange={(e) => {
                        const pet = userPets.find(p => p.id === e.target.value);
                        setConciergeForm({
                          ...conciergeForm, 
                          petId: e.target.value,
                          petName: pet?.name || ''
                        });
                      }}
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    >
                      <option value="">Select your pet...</option>
                      {userPets.map(pet => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name} ({pet.breed || 'Pet'})
                        </option>
                      ))}
                    </select>
                  ) : userPets.length === 1 ? (
                    <div className="h-11 px-3 flex items-center bg-purple-50 border border-purple-200 rounded-md text-gray-900">
                      <Dog className="w-4 h-4 mr-2 text-purple-500" />
                      {userPets[0].name}
                    </div>
                  ) : (
                    <Input
                      value={conciergeForm.petName}
                      onChange={(e) => setConciergeForm({...conciergeForm, petName: e.target.value})}
                      placeholder="Your pet's name"
                      required
                      className="h-11"
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Occasion *</label>
                  <select
                    value={conciergeForm.occasion}
                    onChange={(e) => setConciergeForm({...conciergeForm, occasion: e.target.value})}
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="birthday">🎂 Birthday Party</option>
                    <option value="gotcha_day">🏠 Gotcha Day / Adoption Anniversary</option>
                    <option value="first_birthday">🎉 First Birthday (Big One!)</option>
                    <option value="pawty">🐾 Pawty with Friends</option>
                    <option value="photoshoot">📸 Celebration Photoshoot</option>
                    <option value="surprise">🎁 Surprise Celebration</option>
                    <option value="other">✨ Other Special Occasion</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Celebration Date</label>
                  <Input
                    type="date"
                    value={conciergeForm.celebrationDate}
                    onChange={(e) => setConciergeForm({...conciergeForm, celebrationDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Expected Guests</label>
                  <select
                    value={conciergeForm.guestCount}
                    onChange={(e) => setConciergeForm({...conciergeForm, guestCount: e.target.value})}
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select...</option>
                    <option value="intimate">Just us & pet</option>
                    <option value="small">2-5 guests</option>
                    <option value="medium">6-10 guests</option>
                    <option value="large">10+ guests</option>
                    <option value="pet_party">Pet playdate (multiple pets)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Budget Range</label>
                <select
                  value={conciergeForm.budget}
                  onChange={(e) => setConciergeForm({...conciergeForm, budget: e.target.value})}
                  className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select budget...</option>
                  <option value="under_2000">Under ₹2,000</option>
                  <option value="2000_5000">₹2,000 - ₹5,000</option>
                  <option value="5000_10000">₹5,000 - ₹10,000</option>
                  <option value="10000_25000">₹10,000 - ₹25,000</option>
                  <option value="above_25000">₹25,000+</option>
                  <option value="flexible">Flexible - Surprise me!</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Special Requests / Ideas</label>
                <textarea
                  value={conciergeForm.specialRequests}
                  onChange={(e) => setConciergeForm({...conciergeForm, specialRequests: e.target.value})}
                  placeholder="Tell us about your dream celebration - themes, dietary requirements, venue preferences, any special requests..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
              </div>
              
              {/* Submit */}
              <Button 
                type="submit" 
                disabled={conciergeSubmitting}
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold text-base"
              >
                {conciergeSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Submit Celebration Request
                  </span>
                )}
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                Our Celebrate Concierge® team will contact you within 2 hours to plan your pawfect celebration! 🎉
              </p>
            </form>
          </Card>
        </div>
      )}
      
      {/* Party Planning Wizard Modal */}
      {showPartyWizard && (
        <PartyPlanningWizard 
          onClose={() => setShowPartyWizard(false)}
          onComplete={(data) => {
            toast.success('Party plan submitted! Our concierge will be in touch.');
            setShowPartyWizard(false);
          }}
        />
      )}
      
      {/* Soul Explainer Modal - Triggered by footer link */}
      {showSoulExplainer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
          <SoulExplainerVideo 
            onClose={() => setShowSoulExplainer(false)}
            petName="your pet"
          />
        </Suspense>
      )}
      
      {/* Personalized Picks Panel - Locked to Celebrate pillar (no other pillar tabs shown) */}
      <PersonalizedPicksPanel
        isOpen={isPillarPanelOpen}
        onClose={() => setIsPillarPanelOpen(false)}
        pillar="celebrate"
        pet={activePet}
        token={token}
        userEmail={user?.email}
        onSendSuccess={(data) => {
          console.log('[CelebratePage] Picks sent:', data);
          setIsPillarPanelOpen(false);
        }}
      />
      
      {/* Concierge® Button - Blue C® for Service Desk chat */}
      <ConciergeButton 
        pillar="celebrate" 
        position="bottom-right"
        showLabel
      />
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PLAN MY PARTY WIZARD - Magical party planning experience */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <PlanMyPartyWizard
        isOpen={showPlanMyPartyWizard}
        onClose={() => setShowPlanMyPartyWizard(false)}
        pet={activePet}
        onComplete={(partyPlan) => {
          console.log('[CelebratePage] Party plan created:', partyPlan);
          toast.success(`${activePet?.name}'s party plan is ready! 🎉`);
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SHARE CELEBRATION MODAL - UGC capture */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <ShareCelebrationModal
        isOpen={showShareCelebration}
        onClose={() => setShowShareCelebration(false)}
        pet={activePet}
        onSuccess={() => {
          console.log('[CelebratePage] Celebration shared!');
        }}
      />
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CELEBRATION ALBUM - Post-party mini-wrapped experience */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {showCelebrationAlbum && (
        <CelebrationAlbum
          pet={activePet}
          token={token}
          userEmail={user?.email}
          onClose={() => setShowCelebrationAlbum(false)}
        />
      )}
      
      {/* Close the theme wrapper */}
      </div>
    </PillarPageLayout>
  );
};

export default CelebratePage;

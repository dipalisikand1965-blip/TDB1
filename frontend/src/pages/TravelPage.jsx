import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { createTravelRequest, showUnifiedFlowSuccess, showUnifiedFlowError } from '../utils/unifiedApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import { ChecklistDownloadButton } from '../components/checklists';
import { toast } from '../hooks/use-toast';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import ProductCard from '../components/ProductCard';
import { ConciergeButton } from '../components/mira-os';
import { getPetPhotoUrl } from '../utils/petAvatar';
import BreedAutocomplete from '../components/BreedAutocomplete';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import MultiPetSelector from '../components/MultiPetSelector';
import MiraPicksCarousel from '../components/MiraPicksCarousel';
import PersonalizedPicks from '../components/PersonalizedPicks';
import PillarPicksSection from '../components/PillarPicksSection';
import MiraCuratedLayer from '../components/Mira/MiraCuratedLayer';
import SoulMadeCollection from '../components/SoulMadeCollection'; // ADDED: Soul Made Products
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';
import { getSoulBasedReason } from '../utils/petSoulInference';
import PillarPageLayout from '../components/PillarPageLayout';
import { PillarDailyTip, PillarHelpBuckets, PillarGuidedPaths } from '../components/PillarGoldSections';
import SoulPersonalizationSection from '../components/SoulPersonalizationSection';
import {
  Car, Train, Plane, Truck, MapPin, Calendar, Clock, PawPrint,
  Shield, Heart, CheckCircle, AlertTriangle, MessageCircle, Phone,
  ChevronRight, ChevronLeft, Sparkles, Package, Star, Loader2, Info, Send,
  ArrowRight, Users, Play, X, ChevronDown, Gift, Zap, Download, Search,
  Target, Activity, ClipboardList
} from 'lucide-react';

// Travel Types Configuration
const TRAVEL_TYPES = {
  cab: {
    id: 'cab',
    name: 'Cab / Road Travel',
    icon: Car,
    description: 'Vet visits, grooming, short trips',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  train: {
    id: 'train',
    name: 'Train / Bus',
    icon: Train,
    description: 'Medium-distance travel',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  flight: {
    id: 'flight',
    name: 'Domestic Flight',
    icon: Plane,
    description: 'Air travel within India',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  relocation: {
    id: 'relocation',
    name: 'Pet Relocation',
    icon: Truck,
    description: 'Full service moves',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  }
};

// Hero Images
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1759340875613-75cb64d2c16d?w=1200&q=80',
  'https://images.unsplash.com/photo-1758991281299-756e997a027b?w=1200&q=80',
  'https://images.unsplash.com/photo-1759559790290-a3c6fce1d55f?w=1200&q=80'
];

// Elevated Concierge® Travel Experiences - NOT bookable services
const TRAVEL_EXPERIENCES = [
  {
    title: "Luxe Air Concierge®",
    description: "Full-service flight coordination for pets traveling by air. We handle airline policies, crate sizing, health paperwork, and real-time flight tracking — you just focus on the journey.",
    icon: "✈️",
    gradient: "from-violet-500 to-purple-600",
    badge: "Most Popular",
    badgeColor: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80",
    highlights: [
      "Airline policy navigation & booking assistance",
      "IATA-compliant crate sizing & procurement",
      "Health certificate coordination",
      "Real-time flight tracking & updates"
    ]
  },
  {
    title: "Road Trip Architect®",
    description: "Planning a scenic drive with your pet? We map out pet-friendly stops, dining spots, and overnight stays — ensuring your four-legged co-pilot enjoys every mile.",
    icon: "🚗",
    gradient: "from-blue-500 to-cyan-500",
    image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80",
    highlights: [
      "Custom route planning with pet stops",
      "Pet-friendly restaurant & café bookings",
      "Emergency vet location mapping",
      "Weather & traffic advisory alerts"
    ]
  },
  {
    title: "Relocation Navigator®",
    description: "Moving cities or countries? Our white-glove pet relocation service manages the entire journey — from documentation to customs to doorstep delivery.",
    icon: "📦",
    gradient: "from-amber-500 to-orange-500",
    badge: "White Glove",
    badgeColor: "bg-purple-600",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80",
    highlights: [
      "End-to-end relocation coordination",
      "International & domestic paperwork",
      "Customs clearance assistance",
      "Pet arrival & settling support"
    ]
  },
  {
    title: "Vet Visit Valet®",
    description: "Taking your pet to the vet shouldn't be stressful. We arrange comfortable transport, wait with your pet if needed, and ensure they arrive calm and cared for.",
    icon: "🏥",
    gradient: "from-rose-500 to-pink-500",
    image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80",
    highlights: [
      "Comfortable, climate-controlled transport",
      "Vetted drivers trained in pet handling",
      "Appointment coordination",
      "Post-visit updates & care notes"
    ]
  }
];

// Main Travel Page Component
const TravelPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { currentPet, pets: contextPets } = usePillarContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef(null);
  const servicesSectionRef = useRef(null);
  
  // Use currentPet from context (syncs with global pet selector)
  const activePet = currentPet;
  
  // Get travel type from URL query params
  const urlTravelType = searchParams.get('type');
  
  // State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: type, 2: pet, 3: details, 4: confirm
  const [userPets, setUserPets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]); // Multi-pet support
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [travelProducts, setTravelProducts] = useState([]);
  const [travelBundles, setTravelBundles] = useState([]);
  const [requestResult, setRequestResult] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [productsToShow, setProductsToShow] = useState(10); // Load More state
  
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/travel/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Adventures await {petName}",
    subtitle: 'Pet-friendly travel, flights, road trips & destinations',
    askMira: {
      enabled: true,
      placeholder: "Pet-friendly hotels in Goa... airline pet policy",
      buttonColor: 'bg-cyan-500'
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
  // NEW: CMS-driven and Ask Mira state
  const [cmsHelpBuckets, setCmsHelpBuckets] = useState([]);
  const [cmsDailyTips, setCmsDailyTips] = useState([]);
  const [cmsGuidedPaths, setCmsGuidedPaths] = useState([]);
  const [askMiraQuestion, setAskMiraQuestion] = useState('');
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  
  const handleAskMira = () => {
    if (!askMiraQuestion.trim()) return;
    setAskMiraLoading(true);
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: { message: askMiraQuestion, context: 'travel', pillar: 'travel' }
    }));
    setTimeout(() => {
      setAskMiraLoading(false);
      setAskMiraQuestion('');
    }, 500);
  };
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Adventures await ${activePet?.name || "your pet"}`;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/travel/page-config`);
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
        console.log('[TravelPage] CMS config loaded');
      }
    } catch (error) {
      console.error('[TravelPage] Failed to fetch CMS config:', error);
    }
  };

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);
  
  // Handle URL type parameter - scroll to services section
  useEffect(() => {
    if (urlTravelType && servicesSectionRef.current) {
      const typeMapping = {
        'cab': 'cab',
        'road': 'cab',
        'train': 'train',
        'flight': 'flight',
        'air': 'flight',
        'relocation': 'relocation'
      };
      const mappedType = typeMapping[urlTravelType] || urlTravelType;
      if (TRAVEL_TYPES[mappedType]) {
        setSelectedType(mappedType);
        // Open wizard with pre-selected type
        setShowWizard(true);
        setWizardStep(1);
      }
      // Scroll to services section after a short delay
      setTimeout(() => {
        servicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [urlTravelType]);
  
  // Form Data
  const [formData, setFormData] = useState({
    pickup_location: '',
    pickup_city: '',
    drop_location: '',
    drop_city: '',
    travel_date: '',
    travel_time: '',
    return_date: '',
    is_round_trip: false,
    special_requirements: '',
    pet_weight: '',
    crate_trained: null,
    // Manual pet entry (for users without profile)
    pet_name: '',
    pet_breed: '',
    // Contact info (for non-logged in users)
    contact_name: '',
    contact_email: '',
    contact_phone: ''
  });

  // Multi-pet selection helpers
  const handlePetToggle = (pet) => {
    setSelectedPets(prev => {
      const isSelected = prev.some(p => (p.id || p._id) === (pet.id || pet._id));
      if (isSelected) {
        return prev.filter(p => (p.id || p._id) !== (pet.id || pet._id));
      }
      return [...prev, pet];
    });
  };
  
  const handleSelectAllPets = () => setSelectedPets([...userPets]);
  const handleClearAllPets = () => setSelectedPets([]);

  // Scroll to top on mount, or to hash if present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Wait for content to load then scroll to hash
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  // Hero image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Fetch user's pets
  useEffect(() => {
    if (user && token) {
      fetchUserPets();
    }
    fetchTravelProducts();
  }, [user, token]);

  const fetchUserPets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPets(data.pets || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const fetchTravelProducts = async () => {
    try {
      const [productsRes, bundlesRes] = await Promise.all([
        // Use direct pillar query - more reliable
        fetch(`${API_URL}/api/products?pillar=travel&limit=50`),
        fetch(`${API_URL}/api/travel/bundles`)
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setTravelProducts(data.products || []);
        console.log(`[TravelPage] Loaded ${data.products?.length || 0} products (total: ${data.total})`);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setTravelBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching travel products:', error);
    }
  };

  const handleStartPlanning = () => {
    // Open for all - no login required
    setShowWizard(true);
    setWizardStep(1);
  };

  const handleFormSubmit = async () => {
    if (!selectedType) return;
    
    setSubmitting(true);
    try {
      // Support multi-pet travel requests
      const petsData = selectedPets.length > 0 
        ? selectedPets.map(p => ({ id: p.id || p._id, name: p.name, breed: p.breed, species: p.species || 'dog' }))
        : formData.pet_name ? [{ id: 'manual', name: formData.pet_name, breed: formData.pet_breed }] : [];
      
      const requestPayload = {
        travel_type: selectedType,
        // Multi-pet support
        pets: petsData,
        pet_count: petsData.length,
        is_multi_pet: petsData.length > 1,
        // Legacy fields for backward compatibility
        pet_id: petsData[0]?.id !== 'manual' ? petsData[0]?.id : null,
        pet_name: petsData.map(p => p.name).join(', ') || formData.pet_name || '',
        pet_breed: petsData[0]?.breed || formData.pet_breed || '',
        ...formData,
        user_email: user?.email || formData.contact_email,
        user_phone: user?.phone || formData.contact_phone,
        user_name: user?.name || formData.contact_name
      };

      // Use unified API client for consistent flow across all devices
      const result = await createTravelRequest(requestPayload, token);
      
      // HARD GUARD: Verify unified flow IDs before showing success
      console.log('[UNIFIED FLOW] Travel request result:', result);
      if (!result.request_id && !result.ticket_id) {
        console.error('[UNIFIED FLOW] ❌ Travel request missing ticket_id');
        throw new Error('Travel request missing unified flow IDs');
      }
      
      // Show success with unified flow confirmation
      showUnifiedFlowSuccess('travel_request', {
        ticket_id: result.ticket_id || result.request_id,
        notification_id: result.notification_id,
        inbox_id: result.inbox_id
      });
      
      setRequestResult(result);
      setWizardStep(4);
      const petNames = petsData.map(p => p.name).join(', ') || 'your pet';
      toast({
        title: "Request Submitted! 🐾",
        description: `We'll review ${petNames}'s travel needs and get back to you soon. Ticket: ${result.ticket_id || result.request_id}`
      });
    } catch (error) {
      console.error('Error submitting travel request:', error);
      showUnifiedFlowError('travel_request', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || product.image,
    });
    toast({
      title: "Added to cart! 🛒",
      description: product.name
    });
  };

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setSelectedPets([]);
    setSelectedType(null);
    setRequestResult(null);
    setFormData({
      pickup_location: '',
      pickup_city: '',
      drop_location: '',
      drop_city: '',
      travel_date: '',
      travel_time: '',
      return_date: '',
      is_round_trip: false,
      special_requirements: '',
      pet_weight: '',
      crate_trained: null,
      pet_name: '',
      pet_breed: ''
    });
  };

  const scrollToProducts = () => {
    document.getElementById('travel-kits')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PillarPageLayout
      pillar="travel"
      title="Travel - Pet Travel Gear & Services | The Doggy Company"
      description="Everything you need for adventures with your furry companion."
    >
      {/* ═══════════════════════════════════════════════════════════════════════════════
          1. ASK MIRA BAR - GOLD STANDARD (Must be first!)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.askMira?.enabled !== false && (
        <section className="py-8 px-4 bg-gradient-to-b from-cyan-50 to-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="travel-page-title">
                {pageTitle}
              </h1>
              <p className="text-gray-600 mt-2">{cmsConfig.subtitle || 'Pet travel, road trips, flights & relocation services'}</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 shadow-sm p-1.5 pl-5">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Input
                  value={askMiraQuestion}
                  onChange={(e) => setAskMiraQuestion(e.target.value)}
                  placeholder={cmsConfig.askMira?.placeholder || "Travel tips for anxious dogs... pet-friendly hotels... flight carrier size"}
                  className="flex-1 border-0 focus-visible:ring-0 text-sm placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskMira()}
                  data-testid="ask-travel-input"
                />
                <Button
                  onClick={handleAskMira}
                  disabled={askMiraLoading || !askMiraQuestion.trim()}
                  className={`rounded-full ${cmsConfig.askMira?.buttonColor || 'bg-cyan-500'} hover:opacity-90 h-10 w-10 p-0`}
                >
                  {askMiraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          2. TRAVEL TOPIC CARDS - Quick access to travel categories
          Air Travel, Road Trips, Pet-Friendly Destinations, Travel Gear
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <PillarTopicsGrid
        pillar="travel"
        topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.travel}
        columns={4}
      />

      {/* ════════════════════════════════════════════════════════════════════
          3. DAILY TRAVEL TIP + 4. HOW CAN WE HELP + 6. GUIDED PATHS
          Gold Standard sections (inserted after Topics Grid)
          ════════════════════════════════════════════════════════════════════ */}
      <PillarDailyTip
        tips={cmsDailyTips.length > 0 ? cmsDailyTips : [
          { category: 'Carrier Safety', tip: 'Always test your pet\'s carrier a week before travel. Let them sleep in it to reduce stress on travel day.', icon: 'Shield', color: 'from-cyan-500 to-blue-500' },
          { category: 'Flight Tips', tip: 'Book direct flights when possible. Less handling and shorter travel time means less stress for your pet.', icon: 'CheckCircle', color: 'from-blue-500 to-indigo-500' },
          { category: 'Hydration', tip: 'Freeze your pet\'s water bowl the night before travel. It won\'t spill during transit and provides hydration as it melts.', icon: 'Heart', color: 'from-teal-500 to-cyan-500' },
          { category: 'ID & Safety', tip: 'Always carry a recent photo of your pet while travelling. In case of separation, it makes reunification faster.', icon: 'PawPrint', color: 'from-cyan-500 to-sky-500' },
          { category: 'Anxiety Help', tip: 'Apply a few drops of lavender oil near (not on) your pet\'s carrier. It can help calm travel anxiety naturally.', icon: 'Sparkles', color: 'from-indigo-500 to-violet-500' },
          { category: 'Road Safety', tip: 'Never let your dog hang out of car windows. Even short trips can cause eye injuries from dust and debris.', icon: 'AlertCircle', color: 'from-amber-500 to-orange-500' },
          { category: 'Hotel Tips', tip: 'Always call ahead to confirm pet policies. Some hotels charge fees or have size restrictions not listed online.', icon: 'Home', color: 'from-emerald-500 to-teal-500' },
        ]}
        tipLabel="Today's Travel Tip"
      />

      <PillarHelpBuckets
        pillar="travel"
        buckets={cmsHelpBuckets.length > 0 ? cmsHelpBuckets : [
          { id: 'plan', title: 'Plan My Trip', icon: 'MapPin', color: 'cyan', items: ['Pet-friendly routes', 'Airline pet policies', 'Destination checklist', 'Booking assistance'] },
          { id: 'gear', title: 'Travel Gear', icon: 'Package', color: 'blue', items: ['IATA-approved carriers', 'Travel water bowls', 'Safety harnesses', 'First aid kits'] },
          { id: 'anxiety', title: 'Calm Travel Anxiety', icon: 'Heart', color: 'indigo', items: ['Anti-anxiety products', 'Calming techniques', 'Vet consultation', 'Desensitisation tips'] },
        ]}
      />

      <PillarGuidedPaths
        pillar="travel"
        heading="Guided Travel Paths"
        paths={cmsGuidedPaths.length > 0 ? cmsGuidedPaths : [
          { title: 'First Flight Path', topicSlug: 'flight', steps: ['Check airline rules', 'Get health cert', 'Train in carrier', 'Day-of prep', 'Airport arrival'], color: 'blue' },
          { title: 'Road Trip Starter', topicSlug: 'road', steps: ['Plan pet stops', 'Pack essentials', 'Safety harness', 'First rest stop', 'Arrival routine'], color: 'cyan' },
          { title: 'Relocation Guide', topicSlug: 'relocation', steps: ['New home prep', 'Familiar scents', 'Routine maintenance', 'Local vet search', 'Settle in'], color: 'teal' },
          { title: 'International Travel', topicSlug: 'flight', steps: ['Passport & docs', 'Import rules', 'Microchipping', 'Health clearance', 'Arrival customs'], color: 'indigo' },
          { title: 'Multi-Pet Journey', topicSlug: 'road', steps: ['Separate carriers', 'Group check-ins', 'Feed separately', 'Rest coordination', 'Arrival'], color: 'violet' },
          { title: 'Senior Pet Travel', topicSlug: 'travel', steps: ['Vet clearance', 'Comfort gear', 'Frequent breaks', 'Medication plan', 'Gentle settling'], color: 'purple' },
        ]}
      />

      {/* ==================== PERSONALIZED PICKS - ALWAYS FIRST ==================== */}
      <div className="py-10 bg-gradient-to-b from-white to-cyan-50/30">
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <PersonalizedPicks pillar="travel" />
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════════
            SOUL MADE COLLECTION - Breed-specific personalized products
            Shows travel products with breed artwork (Travel Bowl, Carrier Tag, etc.)
            ADDED: March 10, 2026
            ═══════════════════════════════════════════════════════════════════════ */}
        {userPets && userPets[0] && (
          <div className="max-w-6xl mx-auto px-4 mb-8">
            {/* {/* <SoulMadeCollection
              pillar="go"
              maxItems={8}
              showTitle={true}
            /> */} */}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* BREED-SMART RECOMMENDATIONS - Based on breed_matrix */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {userPets && userPets[0] && (
          <div className="max-w-6xl mx-auto px-4 mb-8">
            <BreedSmartRecommendations pillar="travel" />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SOUL PERSONALIZATION SECTION - THE CENTERPIECE */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <SoulPersonalizationSection pillar="travel" />

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ARCHETYPE-PERSONALIZED PRODUCTS - Multi-factor filtering */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <ArchetypeProducts pillar="travel" maxProducts={8} showTitle={true} /> */}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* CURATED BUNDLES - Save with handpicked combinations */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <CuratedBundles pillar="travel" showTitle={true} /> */}
        </div>
        
        {/* Unified Curated Layer - Matches Dine/Celebrate gold standard */}
        <MiraCuratedLayer
          pillar="travel"
          activePet={activePet || userPets?.[0]}
          token={token}
          userEmail={user?.email}
          isLoading={!userPets && !!token}
        />
        
        {/* Mira's Picks for Pet */}
        {(activePet || userPets?.[0]) && (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <PillarPicksSection pillar="travel" pet={activePet || userPets[0]} />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════
          MIRA ADVISOR - Travel Companion AI Assistant
          ═══════════════════════════════════════════════════════════════════════════ */}
      <div className="py-8 px-4 bg-cyan-50/30">
        <div className="max-w-2xl mx-auto">
          <MiraAdvisorCard pillar="travel" activePet={activePet} />
          
          {/* Download Travel Checklist */}
          <div className="mt-4 flex justify-center">
            <ChecklistDownloadButton 
              pillar="travel" 
              variant="outline"
              className="border-sky-300 text-sky-700 hover:bg-sky-50"
            />
          </div>
        </div>
      </div>

      {/* ==================== SOCIAL PROOF BANNER ==================== */}
      <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap text-white">
            <div className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-yellow-300" />
              <span className="text-white/80 text-sm">Stress-free pet travel</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-300" />
              <span className="text-white/80 text-sm">Safety-first approach</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
              <span className="text-white/80 text-sm">Concierge-managed journeys</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-pink-300" />
              <span className="text-white/80 text-sm">Across India</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== CONVERSATIONAL ENTRY ==================== */}
      <div className="py-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">What type of travel are you planning?</h3>
                  <p className="text-white/70 text-sm">Mira will help you every step of the way</p>
                </div>
              </div>
            </div>
            
            {/* Goal Buttons */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '🚗', label: 'Vet Trip', type: 'cab', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' },
                  { icon: '✈️', label: 'Flight', type: 'flight', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' },
                  { icon: '🚆', label: 'Train Journey', type: 'train', color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' },
                  { icon: '📦', label: 'Relocation', type: 'relocation', color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' },
                  { icon: '🏖️', label: 'Vacation', type: 'cab', color: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200' },
                  { icon: '🏥', label: 'Emergency', type: 'cab', color: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' },
                  { icon: '🎪', label: 'Event/Show', type: 'cab', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200' },
                  { icon: '💬', label: 'Other', type: 'cab', color: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200' }
                ].map((goal, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedType(goal.type);
                      handleStartPlanning();
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${goal.color}`}
                  >
                    <span className="text-xl">{goal.icon}</span>
                    <span className="font-medium text-sm">{goal.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Quick Win */}
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Quick Win</p>
                    <p className="text-amber-700 text-sm">Start acclimating your pet to their carrier 2 weeks before travel. Leave it open with treats inside!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TRANSFORMATION STORIES - Large Format ==================== */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-4 py-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
              Community Stories
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Happy Travels, Happy Tails</h2>
            <p className="text-gray-600">Real journeys from our travel community</p>
          </div>
          
          {/* Horizontally scrollable on mobile */}
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
            {/* Story 1: Rocky's Flight */}
            <div className="flex-shrink-0 w-[280px] md:w-auto snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <img 
                src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop" 
                alt="Rocky - Golden Retriever" 
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg">Rocky</h3>
                <p className="text-sm text-gray-500 mb-2">Golden Retriever</p>
                <p className="text-purple-600 font-medium text-sm mb-2">First flight at 3 years old!</p>
                <p className="text-sm text-gray-600 mb-3">&quot;They handled all the airline paperwork. Rocky was calm the entire journey!&quot;</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">— Neha P., Mumbai → Bangalore</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Story 2: Simba & Luna Road Trip */}
            <div className="flex-shrink-0 w-[280px] md:w-auto snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <img 
                src="https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600&h=400&fit=crop" 
                alt="Simba & Luna - Huskies" 
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg">Simba &amp; Luna</h3>
                <p className="text-sm text-gray-500 mb-2">Huskies</p>
                <p className="text-blue-600 font-medium text-sm mb-2">600km road trip with 2 dogs</p>
                <p className="text-sm text-gray-600 mb-3">&quot;They planned every pet-friendly stop. Both dogs loved the mountain adventure!&quot;</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">— Arjun M., Delhi → Manali</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Story 3: Milo's International Move */}
            <div className="flex-shrink-0 w-[280px] md:w-auto snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <img 
                src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=400&fit=crop" 
                alt="Milo - French Bulldog" 
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg">Milo</h3>
                <p className="text-sm text-gray-500 mb-2">French Bulldog</p>
                <p className="text-amber-600 font-medium text-sm mb-2">International relocation</p>
                <p className="text-sm text-gray-600 mb-3">&quot;All the import permits, quarantine paperwork — they handled everything flawlessly.&quot;</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">— Priya S., Bangalore → Dubai</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Story 4: Cookie's Train Journey */}
            <div className="flex-shrink-0 w-[280px] md:w-auto snap-start bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <img 
                src="https://images.unsplash.com/photo-1568572933382-74d440642117?w=600&h=400&fit=crop" 
                alt="Cookie - Indie Mix" 
                className="w-full h-48 object-cover"
              />
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg">Cookie</h3>
                <p className="text-sm text-gray-500 mb-2">Indie Mix</p>
                <p className="text-green-600 font-medium text-sm mb-2">First train journey</p>
                <p className="text-sm text-gray-600 mb-3">&quot;They secured the pet compartment and even packed snacks. Cookie slept the whole way!&quot;</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">— Kavitha R., Chennai → Ooty</span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile scroll hint */}
          <div className="flex justify-center mt-4 md:hidden">
            <span className="text-xs text-gray-400">← Swipe for more stories →</span>
          </div>
        </div>
      </div>

      {/* === TRAVEL TYPES STRIP === */}
      <div ref={servicesSectionRef} id="services" className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-500 hidden sm:inline">Travel Types:</span>
            </div>
            <div className="flex gap-2">
              {Object.values(TRAVEL_TYPES).map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      handleStartPlanning();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${type.bgColor} ${type.textColor} hover:scale-105 whitespace-nowrap`}
                    data-testid={`travel-type-${type.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* === HOW IT WORKS === */}
      <div className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-purple-100 text-purple-700 mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stress-Free Pet Travel in 4 Steps
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our concierge team handles everything — so you can focus on the adventure ahead.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: MessageCircle, title: 'Tell Us', desc: 'Share your travel plans & pet details', color: 'from-blue-500 to-cyan-500' },
              { step: 2, icon: Shield, title: 'We Assess', desc: 'Review safety requirements & options', color: 'from-purple-500 to-violet-500' },
              { step: 3, icon: Users, title: 'Coordinate', desc: 'We handle logistics & partners', color: 'from-pink-500 to-rose-500' },
              { step: 4, icon: Heart, title: 'Travel Safe', desc: 'Enjoy peace of mind throughout', color: 'from-amber-500 to-orange-500' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative">
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-transparent" />
                  )}
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-400 mb-1">STEP {item.step}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              onClick={handleStartPlanning}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-full px-8"
              data-testid="start-planning-btn"
            >
              Start Planning Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* === ELEVATED CONCIERGE® EXPERIENCES === */}
      <div className="py-10 sm:py-16 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Elevated Experiences</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Travel <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Concierge®</span> Experiences
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Curated experiences that evolve through conversation. Every journey is unique.
            </p>
          </div>
          
          {/* 2x2 grid on mobile, 2 columns on desktop with staggered animations */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
            {TRAVEL_EXPERIENCES.map((exp, idx) => (
              <div key={idx} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <ConciergeExperienceCard
                  pillar="travel"
                  title={exp.title}
                  description={exp.description}
                  icon={exp.icon}
                  gradient={exp.gradient}
                  badge={exp.badge}
                  badgeColor={exp.badgeColor}
                  highlights={exp.highlights}
                  image={exp.image}
                />
              </div>
            ))}
          </div>
          
          <div className="mt-6 sm:mt-10 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              💬 Not sure which experience fits? <button onClick={handleStartPlanning} className="text-violet-600 hover:underline font-medium">Start a conversation</button>
            </p>
          </div>
        </div>
      </div>

      {/* === TRAVEL BUNDLES === */}
      <div id="travel-kits" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="bg-green-100 text-green-700 mb-2">Save up to 30%</Badge>
              <h2 className="text-3xl font-bold text-gray-900">Travel Kits & Bundles</h2>
              <p className="text-gray-600 mt-1">Everything your pet needs, bundled with love</p>
            </div>
          </div>
          
          {travelBundles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {travelBundles.map((bundle) => {
                const typeConfig = TRAVEL_TYPES[bundle.travel_type] || TRAVEL_TYPES.cab;
                const Icon = typeConfig.icon;
                return (
                  <Card 
                    key={bundle.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200"
                    data-testid={`bundle-${bundle.id}`}
                  >
                    {/* Bundle Image/Header */}
                    <div className={`h-40 bg-gradient-to-br ${typeConfig.color} p-6 relative overflow-hidden`}>
                      <div className="absolute -right-6 -bottom-6 opacity-20">
                        <Icon className="w-32 h-32 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white backdrop-blur-sm mb-2">
                        {typeConfig.name}
                      </Badge>
                      {bundle.is_recommended && (
                        <Badge className="bg-yellow-400 text-yellow-900 ml-2">
                          <Star className="w-3 h-3 mr-1 fill-current" /> Top Pick
                        </Badge>
                      )}
                      <h3 className="text-xl font-bold text-white mt-2">{bundle.name}</h3>
                    </div>
                    
                    {/* Bundle Details */}
                    <div className="p-5">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{bundle.description}</p>
                      
                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-gray-900">₹{bundle.price?.toLocaleString()}</span>
                        {bundle.original_price && (
                          <>
                            <span className="text-gray-400 line-through">₹{bundle.original_price?.toLocaleString()}</span>
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              {Math.round((1 - bundle.price / bundle.original_price) * 100)}% OFF
                            </Badge>
                          </>
                        )}
                      </div>
                      
                      {/* Paw Points */}
                      {bundle.paw_reward_points > 0 && (
                        <div className="flex items-center gap-1 text-sm text-purple-600 mb-4">
                          <PawPrint className="w-4 h-4" />
                          Earn {bundle.paw_reward_points} Paw Points
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-gray-900 hover:bg-gray-800"
                        onClick={() => handleAddToCart(bundle)}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center bg-gray-50">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Travel Bundles Coming Soon</h3>
              <p className="text-gray-500">We&apos;re preparing amazing travel kits for your furry friend!</p>
            </Card>
          )}
        </div>
      </div>

      {/* === SERVICE CATALOG WITH PRICING === */}
      <ServiceCatalogSection 
        pillar="travel"
        title="Travel, Personalised"
        subtitle="See your personalized price based on your city, pet size, and requirements"
        maxServices={8}
      />

      {/* === TRAVEL PRODUCTS === */}
      <div id="travel-products" className="py-10 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Travel Essentials</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Individual items for every journey</p>
            </div>
          </div>
          
          {travelProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {travelProducts.slice(0, productsToShow).map((product) => (
                  <ProductCard key={product.id} product={product} pillar="travel" />
                ))}
              </div>
              
              {/* Load More Button */}
              {travelProducts.length > productsToShow && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => setProductsToShow(prev => prev + 10)}
                    className="px-8 py-3 rounded-full border-2 border-violet-300 text-violet-600 hover:bg-violet-50"
                  >
                    Load More
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-8 sm:p-12 text-center bg-white">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Products Loading...</h3>
            </Card>
          )}
        </div>
      </div>

      {/* === FINAL CTA === */}
      <div className="py-20 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Travel with Your Best Friend?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Our concierge team is ready to make your pet&apos;s journey safe, comfortable, and stress-free.
          </p>
          <Button 
            onClick={handleStartPlanning}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 px-10 py-6 text-lg rounded-full shadow-2xl"
            data-testid="final-cta-btn"
          >
            <Zap className="w-5 h-5 mr-2" />
            Plan My Trip Now
          </Button>
        </div>
      </div>

      {/* === PLANNING WIZARD MODAL === */}
      <Dialog open={showWizard} onOpenChange={(open) => !open && resetWizard()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {wizardStep === 4 ? (
                <>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  Request Submitted!
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-purple-600" />
                  </div>
                  Plan Your Trip
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress Bar */}
          {wizardStep < 4 && (
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div 
                  key={step}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    step <= wizardStep ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Step 1: Select Travel Type */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600">What type of travel are you planning?</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(TRAVEL_TYPES).map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setWizardStep(2);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                        selectedType === type.id 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                      data-testid={`wizard-type-${type.id}`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900">{type.name}</h4>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Pet(s) - Multi-Pet Support */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <p className="text-gray-600">Who&apos;s traveling? <span className="text-purple-600 text-sm">(Select one or more pets)</span></p>
              
              {userPets.length === 0 ? (
                <div className="space-y-4">
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <p className="text-sm text-amber-700 mb-3">No pets on profile yet? No problem! Enter details below:</p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Pet's Name"
                        className="w-full p-3 border rounded-lg text-sm"
                        value={formData.pet_name || ''}
                        onChange={(e) => setFormData({...formData, pet_name: e.target.value})}
                      />
                      <BreedAutocomplete
                        placeholder="Start typing breed..."
                        value={formData.pet_breed || ''}
                        onChange={(e) => setFormData({...formData, pet_breed: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                  </Card>
                  <Button 
                    onClick={() => setWizardStep(3)}
                    className="w-full"
                    disabled={!formData.pet_name}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <MultiPetSelector
                    userPets={userPets}
                    selectedPets={selectedPets}
                    onPetToggle={handlePetToggle}
                    onSelectAll={handleSelectAllPets}
                    onClearAll={handleClearAllPets}
                    multiSelect={true}
                    pillarColor="purple"
                    label="Select Pet(s) for Travel"
                  />
                  
                  <Button 
                    onClick={() => setWizardStep(3)}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600"
                    disabled={selectedPets.length === 0}
                  >
                    Continue with {selectedPets.length} Pet{selectedPets.length !== 1 ? 's' : ''} <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
              
              <Button variant="ghost" onClick={() => setWizardStep(1)} className="mt-4">
                Back
              </Button>
            </div>
          )}

          {/* Step 3: Journey Details */}
          {wizardStep === 3 && selectedType && (selectedPets.length > 0 || formData.pet_name) && (
            <div className="space-y-4" ref={formRef}>
              {/* Selected Summary */}
              <Card className="p-3 bg-purple-50 border-purple-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  {(() => { const Icon = TRAVEL_TYPES[selectedType]?.icon || Car; return <Icon className="w-5 h-5 text-purple-600" />; })()}
                </div>
                <div className="flex-1">
                  <span className="text-sm text-purple-600">{TRAVEL_TYPES[selectedType]?.name}</span>
                  <span className="mx-2 text-purple-300">•</span>
                  <span className="text-sm font-medium text-purple-900">
                    {selectedPets.length > 0 
                      ? selectedPets.map(p => p.name).join(', ')
                      : formData.pet_name}
                    {selectedPets.length > 1 && <Badge className="ml-2 bg-purple-200 text-purple-700 text-[10px]">Multi-pet</Badge>}
                  </span>
                </div>
                <button onClick={() => setWizardStep(1)} className="text-sm text-purple-600 hover:underline">
                  Change
                </button>
              </Card>
              
              {/* Journey Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Pickup City</Label>
                  <Input
                    value={formData.pickup_city}
                    onChange={(e) => setFormData({...formData, pickup_city: e.target.value})}
                    placeholder="e.g., Bangalore"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Drop City</Label>
                  <Input
                    value={formData.drop_city}
                    onChange={(e) => setFormData({...formData, drop_city: e.target.value})}
                    placeholder="e.g., Delhi"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Pickup Address</Label>
                  <Input
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({...formData, pickup_location: e.target.value})}
                    placeholder="Full address or landmark"
                  />
                </div>
                <div>
                  <Label>Travel Date</Label>
                  <Input
                    type="date"
                    value={formData.travel_date}
                    onChange={(e) => setFormData({...formData, travel_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label>Preferred Time</Label>
                  <select
                    value={formData.travel_time}
                    onChange={(e) => setFormData({...formData, travel_time: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select time</option>
                    <option value="06:00">6:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                  </select>
                </div>
              </div>
              
              {/* Special Requirements */}
              <div>
                <Label>Special Requirements (Optional)</Label>
                <Textarea
                  value={formData.special_requirements}
                  onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                  placeholder={`Any specific needs for ${selectedPets.length > 0 ? selectedPets.map(p => p.name).join(', ') : 'your pet'}? (anxiety, medication, feeding schedule, etc.)`}
                  rows={3}
                />
              </div>
              
              {/* Contact Info for non-logged in users */}
              {!user && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-gray-700 font-medium">Your Contact Details</Label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full p-3 border rounded-lg text-sm"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full p-3 border rounded-lg text-sm"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full p-3 border rounded-lg text-sm"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  />
                </div>
              )}
              
              {/* Info Box */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">What happens next?</p>
                    <ul className="text-blue-700 mt-1 space-y-1">
                      <li>• Our concierge reviews your request</li>
                      <li>• We contact you within 24 hours</li>
                      <li>• No payment until everything is confirmed</li>
                    </ul>
                  </div>
                </div>
              </Card>
              
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setWizardStep(2)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleFormSubmit}
                  disabled={submitting || !formData.pickup_city || !formData.drop_city || !formData.travel_date}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  data-testid="submit-request-btn"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Submit Request</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {wizardStep === 4 && requestResult && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">You&apos;re All Set!</h3>
              <p className="text-gray-600 mb-6">
                Your travel request for <strong>{selectedPets.length > 0 ? selectedPets.map(p => p.name).join(', ') : formData.pet_name}</strong> has been submitted.
                <br />Our concierge team will reach out within 24 hours.
              </p>
              
              <Card className="p-4 bg-gray-50 text-left mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Request ID:</span>
                    <p className="font-medium">{requestResult.request_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge className="bg-blue-100 text-blue-700 ml-2">Under Review</Badge>
                  </div>
                </div>
              </Card>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetWizard} className="flex-1">
                  New Request
                </Button>
                <Button onClick={() => { resetWizard(); window.location.href = '/my-pets'; }} className="flex-1">
                  View My Requests
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Concierge® Button - Blue C® for Service Desk chat */}
      <ConciergeButton 
        pillar="travel" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default TravelPage;

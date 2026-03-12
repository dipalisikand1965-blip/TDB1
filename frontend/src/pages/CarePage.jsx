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
import { createCareRequest, showUnifiedFlowSuccess, showUnifiedFlowError } from '../utils/unifiedApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import { ChecklistDownloadButton } from '../components/checklists';
import { toast } from '../hooks/use-toast';
import ProductCard from '../components/ProductCard';
import { ConciergeButton } from '../components/mira-os';
import MultiPetSelector from '../components/MultiPetSelector';
import { getPetPhotoUrl } from '../utils/petAvatar';
import BreedAutocomplete from '../components/BreedAutocomplete';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import PersonalizedPicks from '../components/PersonalizedPicks';
import PillarPicksSection from '../components/PillarPicksSection';
import MiraCuratedLayer from '../components/Mira/MiraCuratedLayer';
import SoulMadeCollection from '../components/SoulMadeCollection'; // ADDED: Soul Made Products
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';
import TransformationStories from '../components/TransformationStories';
import { getSoulBasedReason } from '../utils/petSoulInference';
import PillarPageLayout from '../components/PillarPageLayout';
// NEW: Mira Care Plan - Proactive soul-driven recommendations
import MiraCarePlan from '../components/MiraCarePlan';
// NEW: Care Service Flow Modal - Full options for each service (legacy)
import CareServiceFlowModal from '../components/CareServiceFlowModal';
// NEW: Grooming Flow Modal - Detailed 6-step wizard for grooming
import GroomingFlowModal from '../components/GroomingFlowModal';
// NEW: Vet Visit Flow Modal - Detailed wizard for vet visits
import VetVisitFlowModal from '../components/VetVisitFlowModal';
// NEW: Generic Care Flow Modal - For Boarding, Pet Sitting, Emergency
import CareFlowModal from '../components/CareFlowModal';
// NEW: Flow schemas for Care services
import BOARDING_DAYCARE_FLOW_SCHEMA, { buildBoardingTicketPayload } from '../schemas/boardingDaycareFlows';
import PET_SITTING_FLOW_SCHEMA, { buildPetSittingTicketPayload } from '../schemas/petSittingFlows';
import EMERGENCY_HELP_FLOW_SCHEMA, { buildEmergencyTicketPayload } from '../schemas/emergencyHelpFlows';
// NEW: FitPage-style engagement components
import { FitnessJourneyCounter, RotatingSocialProof } from '../components/SocialProofBadges';
import {
  Scissors, PawPrint, GraduationCap, Stethoscope, AlertTriangle, Heart,
  ClipboardList, MapPin, Calendar, Clock, CheckCircle, MessageCircle,
  ChevronRight, Sparkles, Package, Star, Loader2, Info, Send,
  ArrowRight, Users, Play, ChevronDown, Gift, Zap, Shield, Phone,
  Home, Building2, AlertCircle, Trophy, ShoppingCart
} from 'lucide-react';

// Elevated Concierge® Care Experiences - Aligned with Care = Support & Caregiving
const CARE_EXPERIENCES = [
  {
    title: "Groom & Glam Curator®",
    description: "Every coat tells a story. We match your pet with groomers who understand their breed, temperament, and style preferences — because grooming should be a spa day, not a stressful one.",
    icon: "✨",
    gradient: "from-pink-500 to-rose-600",
    badge: "Popular",
    badgeColor: "bg-pink-500",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80",
    highlights: [
      "Groomer matching by breed expertise",
      "Temperament-sensitive handling",
      "At-home or salon sessions",
      "Style consultation for special events"
    ]
  },
  {
    title: "Vet & Clinic Coordinator®",
    description: "From routine checkups to specialist consultations, we handle clinic discovery, appointment booking, and follow-up coordination — so you never miss a beat in your pet's health journey.",
    icon: "🏥",
    gradient: "from-blue-500 to-indigo-600",
    badge: "Essential",
    badgeColor: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80",
    highlights: [
      "Clinic discovery & appointment booking",
      "Preventive care scheduling",
      "Diagnostics & test coordination",
      "Recovery & follow-up support"
    ]
  },
  {
    title: "Boarding & Daycare Curator®",
    description: "Need trusted care when you're away? We match your pet with verified boarding facilities and daycare centres that understand their temperament and needs.",
    icon: "🏠",
    gradient: "from-emerald-500 to-teal-600",
    badge: "Trusted",
    badgeColor: "bg-emerald-600",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    highlights: [
      "Verified boarding facilities",
      "Daycare matching by temperament",
      "Regular updates & check-ins",
      "Emergency backup arrangements"
    ]
  },
  {
    title: "Behavior & Anxiety Partner®",
    description: "For pets who need gentle support with anxiety, fear, or stress. We connect you with specialists who understand sensitive handling and therapeutic approaches.",
    icon: "💜",
    gradient: "from-purple-500 to-violet-600",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    highlights: [
      "Anxiety & fear support specialists",
      "Grooming & vet stress handling",
      "Separation anxiety guidance",
      "Gentle desensitization coordination"
    ]
  },
  {
    title: "Senior & Special Needs Companion®",
    description: "Aging pets and those with special needs deserve extra care. We coordinate comfort support, mobility assistance, and specialized handling for your beloved senior.",
    icon: "🤍",
    gradient: "from-amber-500 to-orange-600",
    badge: "Compassionate",
    badgeColor: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    highlights: [
      "Senior comfort & support",
      "Special needs handling",
      "Mobility assistance coordination",
      "Medication schedule support"
    ]
  },
  {
    title: "Emergency Response Partner®",
    description: "When emergencies strike, we guide you through crisis moments — locating 24/7 vets, arranging urgent transport, and coordinating care until your pet is safe.",
    icon: "🚨",
    gradient: "from-red-500 to-rose-600",
    image: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=800&q=80",
    highlights: [
      "24/7 emergency vet routing",
      "Urgent transport coordination",
      "Real-time crisis support",
      "Post-emergency follow-up"
    ]
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// CARE_TYPES - Single Source of Truth for Sticky Strip + Wizard
// Care = Support, Caregiving, Health, Hygiene, Supervision
// (Walk/Training moved to Fit pillar)
// ═══════════════════════════════════════════════════════════════════════════════
const CARE_TYPES = {
  grooming: {
    id: 'grooming',
    name: 'Grooming',
    icon: Scissors,
    description: 'Hygiene, coat care, bath, nail trim',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600'
  },
  vet_clinic_booking: {
    id: 'vet_clinic_booking',
    name: 'Vet Visits',
    icon: Stethoscope,
    description: 'Clinic discovery, booking & follow-up coordination',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    // Subtypes available in wizard step 2
    subtypes: ['clinic_visit', 'preventive_care', 'diagnostics', 'followup', 'recovery_support']
  },
  boarding_daycare: {
    id: 'boarding_daycare',
    name: 'Boarding & Daycare',
    icon: Building2,
    description: 'Overnight boarding & daytime supervision',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600'
  },
  pet_sitting: {
    id: 'pet_sitting',
    name: 'Pet Sitting',
    icon: Home,
    description: 'In-home care, feeding & companionship',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  behavior_anxiety_support: {
    id: 'behavior_anxiety_support',
    name: 'Behavior Support',
    icon: Heart,
    description: 'Anxiety, fear & stress support',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  senior_special_needs_support: {
    id: 'senior_special_needs_support',
    name: 'Senior & Special Needs',
    icon: Trophy,
    description: 'Comfort, mobility & special handling',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  },
  nutrition_consult_booking: {
    id: 'nutrition_consult_booking',
    name: 'Nutrition Consults',
    icon: Package,
    description: 'Diet consults & allergy support booking',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  },
  emergency_help: {
    id: 'emergency_help',
    name: 'Emergency Help',
    icon: AlertTriangle,
    description: 'Urgent care routing & coordination',
    color: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600'
  }
};

// Hero images for care
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80'
];

// Main Care Page Component
const CarePage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef(null);
  const servicesSectionRef = useRef(null);
  
  // Get service type from URL query params
  const urlServiceType = searchParams.get('type');
  
  // Use PillarContext for pet selection (synced across all pillar components)
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  
  // Selected pet from context (or first pet as fallback)
  const selectedPet = currentPet;
  
  // State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [userPets, setUserPets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]); // Multi-pet support for bookings
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [careProducts, setCareProducts] = useState([]);
  const [careBundles, setCareBundles] = useState([]);
  const [requestResult, setRequestResult] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/care/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Caring for {petName} made simple",
    subtitle: 'Grooming, health, wellness & daily care essentials',
    askMira: {
      enabled: true,
      placeholder: "Grooming tips for double coats... vet near me",
      buttonColor: 'bg-rose-500'
    },
    sections: {
      askMira: { enabled: true },
      miraPrompts: { enabled: true },
      careExperiences: { enabled: true },
      bundles: { enabled: true },
      products: { enabled: true },
      conciergeServices: { enabled: true },
      personalized: { enabled: true }
    }
  });
  const [cmsCategories, setCmsCategories] = useState([]);
  const [cmsConciergeServices, setCmsConciergeServices] = useState([]);
  const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);
  // NEW: CMS-driven Help Buckets, Daily Tips, Guided Paths
  const [cmsHelpBuckets, setCmsHelpBuckets] = useState([]);
  const [cmsDailyTips, setCmsDailyTips] = useState([]);
  const [cmsGuidedPaths, setCmsGuidedPaths] = useState([]);
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', selectedPet?.name || 'your pet') || 
    `Caring for ${selectedPet?.name || 'your pet'} made simple`;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/care/page-config`);
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
        // NEW: Load Help Buckets, Daily Tips, Guided Paths from CMS
        if (data.helpBuckets?.length > 0) {
          setCmsHelpBuckets(data.helpBuckets);
        }
        if (data.dailyTips?.length > 0) {
          setCmsDailyTips(data.dailyTips);
        }
        if (data.guidedPaths?.length > 0) {
          setCmsGuidedPaths(data.guidedPaths);
        }
        console.log('[CarePage] CMS config loaded');
      }
    } catch (error) {
      console.error('[CarePage] Failed to fetch CMS config:', error);
    }
  };
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);
  
  // Handle URL type parameter - scroll to services and open relevant flow
  useEffect(() => {
    if (urlServiceType && servicesSectionRef.current) {
      const typeMapping = {
        'grooming': 'grooming',
        'vet': 'vet_clinic_booking',
        'boarding': 'boarding_daycare',
        'daycare': 'boarding_daycare',
        'sitting': 'pet_sitting',
        'walking': 'pet_sitting',
        'emergency': 'emergency_help'
      };
      const mappedType = typeMapping[urlServiceType] || urlServiceType;
      // Scroll to services section after a short delay
      setTimeout(() => {
        servicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [urlServiceType]);
  
  // Service Booking Modal (legacy - for services without dedicated FlowModal)
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingServiceType, setBookingServiceType] = useState('grooming');
  
  // NEW: Dedicated Flow Modals for Care Services
  const [showGroomingFlowModal, setShowGroomingFlowModal] = useState(false);
  const [showVetVisitFlowModal, setShowVetVisitFlowModal] = useState(false);
  const [showBoardingFlowModal, setShowBoardingFlowModal] = useState(false);
  const [showPetSittingFlowModal, setShowPetSittingFlowModal] = useState(false);
  const [showEmergencyFlowModal, setShowEmergencyFlowModal] = useState(false);
  
  // Bundle Detail Modal
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showBundleModal, setShowBundleModal] = useState(false);
  
  // Generic "Anything Else" Form Modal
  const [showAnythingElseModal, setShowAnythingElseModal] = useState(false);
  const [anythingElseData, setAnythingElseData] = useState({
    name: '',
    email: '',
    phone: '',
    pet_name: '',
    request: ''
  });
  
  // Form Data
  const [formData, setFormData] = useState({
    description: '',
    preferred_date: '',
    preferred_time: '',
    frequency: 'one_time',
    location_type: 'home',
    location_address: '',
    pet_size: '',
    pet_anxiety_level: '',
    handling_notes: '',
    special_requirements: '',
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

  // Scroll to top on mount or to hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
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
    fetchCareProducts();
  }, [user, token]);

  // Auto-populate user info in form
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contact_name: user.name || prev.contact_name,
        contact_email: user.email || prev.contact_email,
        contact_phone: user.phone || prev.contact_phone
      }));
      // Also populate anything else form
      setAnythingElseData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  // Check URL for type parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    if (type && CARE_TYPES[type]) {
      setSelectedType(type);
      if (user) {
        setShowWizard(true);
        setWizardStep(2); // Skip to pet selection
      }
    }
  }, [user]);

  const fetchUserPets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const pets = data.pets || [];
        setUserPets(pets);
        // Set first pet in context if not already set
        if (pets.length > 0 && !currentPet) {
          setCurrentPet(pets[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const fetchCareProducts = async () => {
    try {
      const [productsRes, bundlesRes] = await Promise.all([
        // Use comprehensive care products API with proper taxonomy (good_for_tags)
        fetch(`${API_URL}/api/care/products?comprehensive_only=true&limit=50`),
        fetch(`${API_URL}/api/care/bundles?comprehensive_only=true`)
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setCareProducts(data.products || []);
        console.log(`[CarePage] Loaded ${data.total} comprehensive care products`);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setCareBundles(data.bundles || []);
        console.log(`[CarePage] Loaded ${data.total} comprehensive care bundles`);
      }
    } catch (error) {
      console.error('Error fetching care products:', error);
    }
  };

  const handleStartCare = () => {
    // Open for all - no login required
    setShowWizard(true);
    setWizardStep(1);
  };

  const handleFormSubmit = async () => {
    if (!selectedType) return;
    
    setSubmitting(true);
    try {
      // Multi-pet support
      const petsData = selectedPets.length > 0 
        ? selectedPets.map(p => ({ id: p.id || p._id, name: p.name, breed: p.breed, species: p.species || 'dog' }))
        : formData.pet_name ? [{ id: 'manual', name: formData.pet_name, breed: formData.pet_breed }] : [];
      
      const requestPayload = {
        care_type: selectedType,
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

      // Use centralized unifiedApi client for unified flow enforcement
      const result = await createCareRequest(requestPayload, token);
      
      // HARD GUARD: Verify unified flow IDs
      console.log('[UNIFIED FLOW] Care request result:', result);
      if (!result.ticket_id) {
        console.error('[UNIFIED FLOW] ❌ Care request missing ticket_id');
        throw new Error('Care request missing unified flow IDs');
      }
      
      // Show success with unified flow confirmation
      showUnifiedFlowSuccess('care_request', {
        ticket_id: result.ticket_id,
        notification_id: result.notification_id,
        inbox_id: result.inbox_id
      });
      
      setRequestResult(result);
      setWizardStep(4);
      const petNames = petsData.map(p => p.name).join(', ') || 'your pet';
      toast({
        title: "Request Submitted! 🐾",
        description: `We'll review ${petNames}'s care needs and get back to you soon. Ticket: ${result.ticket_id}`
      });
    } catch (error) {
      console.error('Error submitting care request:', error);
      showUnifiedFlowError('care_request', error);
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
      image: product.image,
      quantity: 1,
      category: 'care'
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
      description: '',
      preferred_date: '',
      preferred_time: '',
      frequency: 'one_time',
      location_type: 'home',
      location_address: '',
      pet_size: '',
      pet_anxiety_level: '',
      handling_notes: '',
      special_requirements: ''
    });
  };

  const scrollToProducts = () => {
    document.getElementById('care-products')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Ask Mira state
  const [askMiraQuestion, setAskMiraQuestion] = useState('');
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  
  // Handle Ask Mira
  const handleAskMira = () => {
    if (!askMiraQuestion.trim()) return;
    setAskMiraLoading(true);
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: { message: askMiraQuestion, context: 'care', pillar: 'care' }
    }));
    setTimeout(() => {
      setAskMiraLoading(false);
      setAskMiraQuestion('');
    }, 500);
  };

  // Care help buckets - DEFAULTS (used when no CMS data)
  const defaultHelpBuckets = [
    {
      id: 'grooming',
      title: 'Grooming Help',
      icon: 'Sparkles',
      color: 'pink',
      items: ['Coat brushing tips', 'Bath frequency guide', 'Professional grooming', 'At-home grooming']
    },
    {
      id: 'health',
      title: 'Health & Wellness',
      icon: 'Heart',
      color: 'teal',
      items: ['Vaccination schedules', 'Preventive care', 'Signs of illness', 'When to see a vet']
    },
    {
      id: 'daily',
      title: 'Daily Care',
      icon: 'PawPrint',
      color: 'amber',
      items: ['Dental hygiene', 'Nail trimming', 'Ear cleaning', 'Eye care basics']
    }
  ];
  // Use CMS data if available, otherwise use defaults
  const helpBuckets = cmsHelpBuckets.length > 0 ? cmsHelpBuckets : defaultHelpBuckets;

  // Care guided paths - DEFAULTS (used when no CMS data)
  const defaultGuidedPaths = [
    { title: 'New Pet Parent Path', topicSlug: 'grooming', steps: ['Basic grooming', 'First vet visit', 'Daily care routine', 'Nutrition basics', 'Exercise needs'], color: 'pink' },
    { title: 'Grooming Mastery Path', topicSlug: 'grooming', steps: ['Coat type guide', 'Brushing basics', 'Bath routine', 'Nail care', 'Professional tips'], color: 'amber' },
    { title: 'Senior Pet Care Path', topicSlug: 'health', steps: ['Senior checkups', 'Joint care', 'Diet adjustments', 'Comfort needs', 'Quality of life'], color: 'purple' },
    { title: 'Preventive Health Path', topicSlug: 'health', steps: ['Vaccination schedule', 'Parasite prevention', 'Dental care', 'Weight management', 'Annual checkups'], color: 'blue' },
    { title: 'Skin & Coat Path', topicSlug: 'skin', steps: ['Identify skin type', 'Allergy signs', 'Diet for skin', 'Supplements', 'When to see dermatologist'], color: 'green' },
    { title: 'Emergency Prep Path', topicSlug: 'health', steps: ['First aid kit', 'Emergency contacts', 'Warning signs', 'CPR basics', 'Poison control'], color: 'red' }
  ];
  // Use CMS data if available, otherwise use defaults
  const guidedPaths = cmsGuidedPaths.length > 0 ? cmsGuidedPaths : defaultGuidedPaths;

  // Daily care tips - DEFAULTS (used when no CMS data)
  const defaultDailyCareTips = [
    { category: 'Grooming', tip: 'Brush your dog\'s coat 2-3 times a week to prevent matting and distribute natural oils. Double-coated breeds need daily brushing during shedding season.', icon: Scissors },
    { category: 'Dental', tip: 'Brush your dog\'s teeth daily with dog-specific toothpaste. If daily isn\'t possible, aim for at least 3 times a week. Dental chews help but don\'t replace brushing.', icon: Heart },
    { category: 'Ears', tip: 'Check ears weekly for redness, odor, or discharge. Clean with a vet-approved ear cleaner. Floppy-eared dogs need more frequent checks.', icon: Stethoscope },
    { category: 'Nails', tip: 'Trim nails every 2-4 weeks. If you hear clicking on the floor, they\'re too long. Use treats to make nail trimming a positive experience.', icon: PawPrint },
    { category: 'Skin', tip: 'Check your dog\'s skin during brushing for lumps, bumps, or irritation. Early detection of skin issues leads to better outcomes.', icon: Shield },
    { category: 'Eyes', tip: 'Wipe away eye discharge daily with a damp cloth. Excessive tearing, redness, or cloudiness warrants a vet visit.', icon: AlertCircle },
    { category: 'Paws', tip: 'Check paws regularly for cuts, cracks, or foreign objects. In winter, wipe paws after walks to remove salt. In summer, avoid hot pavement.', icon: PawPrint }
  ];
  // Use CMS data if available, otherwise use defaults
  const dailyCareTips = cmsDailyTips.length > 0 ? cmsDailyTips : defaultDailyCareTips;
  
  const todaysTip = dailyCareTips[new Date().getDay() % dailyCareTips.length];

  return (
    <PillarPageLayout
      pillar="care"
      title="Care - Pet Grooming & Wellness | The Doggy Company"
      description="From grooming to training, walks to wellness — we understand your pet's unique needs."
    >
      {/* ═══════════════════════════════════════════════════════════════════════════════
          1. HERO SECTION: ASK MIRA BAR - CMS DRIVEN (Like Learn)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.askMira?.enabled !== false && (
        <section className="py-8 px-4 bg-gradient-to-b from-rose-50 to-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="care-page-title">
                {pageTitle}
              </h1>
              <p className="text-gray-600 mt-2">{cmsConfig.subtitle || 'Grooming, health, wellness & daily care essentials'}</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 shadow-sm p-1.5 pl-5">
                <MessageCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Input
                  value={askMiraQuestion}
                  onChange={(e) => setAskMiraQuestion(e.target.value)}
                  placeholder={cmsConfig.askMira?.placeholder || "Grooming tips for double coats · when to see a vet · dental care"}
                  className="flex-1 border-0 focus-visible:ring-0 text-sm placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskMira()}
                  data-testid="ask-care-input"
                />
                <Button
                  onClick={handleAskMira}
                  disabled={askMiraLoading || !askMiraQuestion.trim()}
                  className={`rounded-full ${cmsConfig.askMira?.buttonColor || 'bg-rose-500'} hover:opacity-90 h-10 w-10 p-0`}
                >
                  {askMiraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          2. EXPERT CARE SUPPORT - Brought up per UX direction
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div ref={servicesSectionRef} id="services" className="py-10 sm:py-12 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Heart className="w-4 h-4" />
              Services That Help
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Expert Care Support</h2>
            <p className="text-gray-600 mt-2">Professional groomers, vets, and care specialists</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Object.values(CARE_TYPES).map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    switch(type.id) {
                      case 'grooming':
                        setShowGroomingFlowModal(true);
                        break;
                      case 'vet_clinic_booking':
                        setShowVetVisitFlowModal(true);
                        break;
                      case 'boarding_daycare':
                        setShowBoardingFlowModal(true);
                        break;
                      case 'pet_sitting':
                        setShowPetSittingFlowModal(true);
                        break;
                      case 'emergency_help':
                        setShowEmergencyFlowModal(true);
                        break;
                      default:
                        setBookingServiceType(type.id);
                        setShowBookingModal(true);
                    }
                  }}
                  className="group p-4 sm:p-5 bg-white/70 hover:bg-white rounded-2xl border-2 border-gray-100 hover:border-rose-200 hover:shadow-lg active:scale-[0.98] transition-all duration-300 text-left"
                  data-testid={`care-service-${type.id}`}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mb-3 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">{type.name}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{type.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          3. DAILY CARE TIP - Rotates based on day (Like Learn's Daily Learning Tip)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <section className="py-6 px-4 bg-gradient-to-r from-rose-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-rose-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <todaysTip.icon className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-rose-100 text-rose-700 text-xs">Today's Care Tip</Badge>
                <span className="text-xs text-gray-500">{todaysTip.category}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{todaysTip.tip}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          4. HOW CAN WE HELP? - Action Buckets (Like Learn)
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
                const iconMap = { Sparkles, Heart, PawPrint, Shield, Star, GraduationCap };
                const BucketIcon = iconMap[bucket.icon] || Heart;
                const colorMap = {
                  'pink': { bg: 'bg-gradient-to-br from-pink-50 to-rose-50', border: 'border-pink-100', icon: 'bg-pink-100', iconColor: 'text-pink-600', dot: 'bg-pink-400' },
                  'teal': { bg: 'bg-gradient-to-br from-teal-50 to-emerald-50', border: 'border-teal-100', icon: 'bg-teal-100', iconColor: 'text-teal-600', dot: 'bg-teal-400' },
                  'amber': { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-100', icon: 'bg-amber-100', iconColor: 'text-amber-600', dot: 'bg-amber-400' }
                };
                const colors = colorMap[bucket.color] || colorMap.teal;
                
                return (
                  <Card 
                    key={bucket.id || idx}
                    className={`p-5 ${colors.bg} ${colors.border} rounded-2xl cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openMiraAI', {
                        detail: { message: bucket.items?.join(', ') || bucket.title, context: 'care', pillar: 'care' }
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
          5. CARE FOR MY DOG - Personalized Section (Like Learn's "Learn for My Dog")
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {selectedPet && (
        <div id="my-dog" className="py-12 bg-gradient-to-br from-pink-50/50 via-white to-rose-50/50">
          <div className="max-w-6xl mx-auto px-4">
            <Card className="p-6 md:p-8 bg-white/95 backdrop-blur rounded-3xl border-0 shadow-xl overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1" data-testid="care-for-pet-heading">
                    Care for {selectedPet.name}
                  </h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Personalized care advice for your {selectedPet.breed || 'pet'}
                  </p>
                  
                  <MiraCarePlan
                    petId={selectedPet?._id || selectedPet?.id}
                    petName={selectedPet?.name}
                    pet={selectedPet}
                    user={user}
                    token={token}
                    compact={true}
                  />
                </div>
                
                <div className="w-full md:w-72 flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-rose-200 to-orange-200 rounded-full blur-3xl opacity-40" />
                    <img 
                      src={getPetPhotoUrl(selectedPet)}
                      alt={selectedPet.name}
                      className="relative w-full aspect-square object-cover rounded-full border-4 border-white shadow-lg"
                      style={{ filter: 'saturate(0.9) contrast(1.05)' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          6. GUIDED CARE PATHS - Step-by-step journeys (Like Learn's Guided Learning Paths)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div id="guided-paths" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <ClipboardList className="w-4 h-4" />
              Step-by-Step Journeys
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Guided Care Paths</h2>
            <p className="text-gray-600 mt-2">Follow a structured journey tailored to your needs</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {guidedPaths.map((path, idx) => (
              <Card 
                key={idx}
                className="p-5 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openMiraAI', {
                    detail: { message: `Guide me through ${path.title}`, context: 'care', pillar: 'care' }
                  }));
                }}
                data-testid={`guided-path-${idx}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${path.color}-100`}>
                    <ClipboardList className={`w-5 h-5 text-${path.color}-600`} />
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
                    <li className="text-xs text-rose-600">+{path.steps.length - 4} more steps</li>
                  )}
                </ul>
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-gray-500">{path.steps.length} steps</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-rose-600 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          8. CARE PRODUCTS SECTION - Like Learn's Training Products
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <section id="care-products" className="py-8 px-4 bg-gradient-to-b from-pink-50 to-white" data-testid="care-products-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-6 h-6 text-rose-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {selectedPet?.breed 
                ? `${selectedPet.breed} Care Products for ${selectedPet.name}` 
                : `Care Products for ${selectedPet?.name || 'Your Pet'}`}
            </h2>
          </div>
          
          {/* Soul Made Collection */}
          {selectedPet && (
            <div className="mb-8">
              <SoulMadeCollection pillar="care" maxItems={8} showTitle={true} />
            </div>
          )}
          
          {/* Breed-Smart Recommendations */}
          {selectedPet && (
            <div className="mb-8">
              <BreedSmartRecommendations pillar="care" />
            </div>
          )}
          
          {/* Archetype Products */}
          <div className="mb-8">
            <ArchetypeProducts pillar="care" maxProducts={8} showTitle={true} />
          </div>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => navigate('/shop?pillar=care')}
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              View All Care Products <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          9. PERSONALIZED PICKS - Fun Picks for {Pet} (Like Learn)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.personalized?.enabled !== false && (
        <section className="py-8 px-4 bg-gradient-to-b from-white to-rose-50/30" data-testid="care-personalized-picks">
          <div className="max-w-6xl mx-auto">
            <PersonalizedPicks pillar="care" maxProducts={8} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          10. MIRA CURATED LAYER - Unified Concierge Recommendations
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <MiraCuratedLayer
        pillar="care"
        activePet={selectedPet}
        token={token}
        userEmail={user?.email}
        isLoading={!userPets.length && !!token}
      />
      
      {/* Pillar Picks Section */}
      {selectedPet && (
        <div className="max-w-6xl mx-auto px-4 py-6">
          <PillarPicksSection pillar="care" pet={selectedPet} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          HOW IT WORKS - Explains the Mira + Concierge model
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-pink-100 text-pink-700 mb-4">How Care Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              We Know Your Pet, So Care Is Personal
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every care request starts with your pet&apos;s profile — their needs, preferences, and history guide everything.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { step: 1, icon: MessageCircle, title: 'Tell Us', desc: 'Share what care your pet needs', color: 'from-pink-500 to-rose-500' },
              { step: 2, icon: PawPrint, title: 'We Read Profile', desc: 'Your pet\'s preferences guide matching', color: 'from-purple-500 to-violet-500' },
              { step: 3, icon: Users, title: 'Match Partner', desc: 'We find the perfect care provider', color: 'from-blue-500 to-cyan-500' },
              { step: 4, icon: Heart, title: 'Care Delivered', desc: 'Personalized service, every time', color: 'from-green-500 to-emerald-500' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className={`relative animate-fade-in-up stagger-${idx + 1}`}>
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-transparent" />
                  )}
                  <div className="text-center group">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
              onClick={handleStartCare}
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-full px-8 hover:scale-105 transition-transform"
              data-testid="start-care-btn"
            >
              Start Care Request
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          TRANSFORMATION STORIES - Trust proof
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <TransformationStories pillar="care" className="bg-white" />

      {/* ═══════════════════════════════════════════════════════════════════════════════
          MIRA ADVISOR - Wellness Expert AI Assistant
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="py-8 px-4 bg-teal-50/30">
        <div className="max-w-2xl mx-auto">
          <MiraAdvisorCard pillar="care" activePet={selectedPet} />
          
          {/* Download Grooming Schedule */}
          <div className="mt-4 flex justify-center">
            <ChecklistDownloadButton 
              pillar="care" 
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-50"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          SOCIAL PROOF BANNER
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-y border-teal-100 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <FitnessJourneyCounter pillar="care" />
          <RotatingSocialProof 
            petName={selectedPet?.name} 
            breedName={selectedPet?.breed} 
          />
        </div>
      </div>

      {/* === ELEVATED CONCIERGE® CARE EXPERIENCES === */}
      <div className="py-16 bg-gradient-to-br from-rose-50 via-pink-50 to-red-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Elevated Experiences</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Care <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600">Concierge®</span> Experiences
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Comprehensive care journeys managed with your pet&apos;s unique needs at heart.
            </p>
          </div>
          
          {/* 2x2 grid on mobile with staggered animations */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
            {CARE_EXPERIENCES.map((exp, idx) => (
              <div key={idx} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}>
                <ConciergeExperienceCard
                  pillar="care"
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
              💬 Need guidance? <button onClick={handleStartCare} className="text-teal-600 hover:underline font-medium">Start a conversation</button>
            </p>
          </div>
        </div>
      </div>

      {/* === CARE BUNDLES === */}
      <div id="care-kits" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="bg-green-100 text-green-700 mb-2">Save up to 25%</Badge>
              <h2 className="text-3xl font-bold text-gray-900">Care Kits & Bundles</h2>
              <p className="text-gray-600 mt-1">Everything your pet needs, bundled with love</p>
            </div>
          </div>
          
          {careBundles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {careBundles.map((bundle) => {
                const typeConfig = CARE_TYPES[bundle.care_type] || CARE_TYPES.grooming;
                const Icon = typeConfig.icon;
                return (
                  <Card 
                    key={bundle.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-pink-200 cursor-pointer"
                    onClick={() => {
                      setSelectedBundle(bundle);
                      setShowBundleModal(true);
                    }}
                    data-testid={`bundle-${bundle.id}`}
                  >
                    {/* Bundle Header */}
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
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBundle(bundle);
                            setShowBundleModal(true);
                          }}
                        >
                          View Details
                        </Button>
                        <Button 
                          className="flex-1 bg-gray-900 hover:bg-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(bundle);
                          }}
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center bg-gray-50">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Care Bundles Coming Soon</h3>
              <p className="text-gray-500">We&apos;re preparing amazing care kits for your furry friend!</p>
            </Card>
          )}
        </div>
      </div>

      {/* === CARE SERVICES === */}
      <div id="care-services" className="py-12 sm:py-16 bg-white" data-testid="care-services-section">
        <div className="max-w-7xl mx-auto px-4">
          <ServiceCatalogSection 
            pillar="care"
            title="Care Services"
            subtitle="Professional grooming, vet visits, wellness checks, and more - all personalized for your pet"
            maxServices={8}
          />
        </div>
      </div>

      {/* === CARE PRODUCTS === */}
      <div id="care-products" className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Care Essentials</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Individual items for everyday care</p>
            </div>
          </div>
          
          {careProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {careProducts.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} pillar="care" />
              ))}
            </div>
          ) : (
            <Card className="p-8 sm:p-12 text-center bg-white">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Products Loading...</h3>
            </Card>
          )}
          
          {careProducts.length > 10 && (
            <div className="text-center mt-6">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/shop?pillar=care'}
                className="rounded-full"
              >
                View All Care Products ({careProducts.length})
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* === FINAL CTA === */}
      <div className="py-20 bg-gradient-to-r from-pink-600 to-rose-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Pet Deserves Care That Understands Them
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            From grooming to training, every service is personalized because we know your pet&apos;s unique needs.
          </p>
          <Button 
            onClick={handleStartCare}
            size="lg"
            className="bg-white text-pink-600 hover:bg-gray-100 px-10 py-6 text-lg rounded-full shadow-2xl"
            data-testid="final-cta-btn"
          >
            <Zap className="w-5 h-5 mr-2" />
            Get Care Now
          </Button>
        </div>
      </div>

      {/* === CARE WIZARD MODAL === */}
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
                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                  Get Care for Your Pet
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
                    step <= wizardStep ? 'bg-pink-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Step 1: Select Care Type */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600">What care does your pet need?</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(CARE_TYPES).map((type) => {
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
                          ? 'border-pink-500 bg-pink-50' 
                          : 'border-gray-200 hover:border-pink-200'
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
              <p className="text-gray-600">Which pet(s) need care? <span className="text-pink-600 text-sm">(Select one or more)</span></p>
              
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
                    pillarColor="pink"
                    label="Select Pet(s) for Care"
                  />
                  
                  <Button 
                    onClick={() => setWizardStep(3)}
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600"
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

          {/* Step 3: Care Details */}
          {wizardStep === 3 && selectedType && (selectedPets.length > 0 || formData.pet_name) && (
            <div className="space-y-4" ref={formRef}>
              {/* Selected Summary */}
              <Card className="p-3 bg-pink-50 border-pink-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  {(() => { const Icon = CARE_TYPES[selectedType]?.icon || Heart; return <Icon className="w-5 h-5 text-pink-600" />; })()}
                </div>
                <div className="flex-1">
                  <span className="text-sm text-pink-600">{CARE_TYPES[selectedType]?.name}</span>
                  <span className="mx-2 text-pink-300">•</span>
                  <span className="text-sm font-medium text-pink-900">
                    {selectedPets.length > 0 
                      ? selectedPets.map(p => p.name).join(', ')
                      : formData.pet_name}
                    {selectedPets.length > 1 && <Badge className="ml-2 bg-pink-200 text-pink-700 text-[10px]">Multi-pet</Badge>}
                  </span>
                </div>
                <button onClick={() => setWizardStep(1)} className="text-sm text-pink-600 hover:underline">
                  Change
                </button>
              </Card>
              
              {/* Care Form */}
              <div>
                <Label>Describe what {selectedPets.length > 0 ? selectedPets.map(p => p.name).join(' & ') : formData.pet_name} need(s)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={`E.g., ${selectedPets[0]?.name || formData.pet_name || 'Pet'} needs a full groom with nail trimming...`}
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preferred Date</Label>
                  <Input
                    type="date"
                    value={formData.preferred_date}
                    onChange={(e) => setFormData({...formData, preferred_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Preferred Time</Label>
                  <select
                    value={formData.preferred_time}
                    onChange={(e) => setFormData({...formData, preferred_time: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Flexible</option>
                    <option value="morning">Morning (8am-12pm)</option>
                    <option value="afternoon">Afternoon (12pm-5pm)</option>
                    <option value="evening">Evening (5pm-8pm)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Location</Label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => setFormData({...formData, location_type: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="home">At Home</option>
                    <option value="salon">At Salon/Center</option>
                    <option value="outdoor">Outdoor</option>
                  </select>
                </div>
                <div>
                  <Label>Frequency</Label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="one_time">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
              
              {/* Additional Notes */}
              <div>
                <Label>Special Requirements (Optional)</Label>
                <Textarea
                  value={formData.special_requirements}
                  onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                  placeholder={`Any specific needs for ${selectedPets.length > 0 ? selectedPets.map(p => p.name).join(', ') : 'your pet'}? (anxiety, handling preferences, etc.)`}
                  rows={2}
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
                      <li>• We match you with the right care partner</li>
                      <li>• No payment until everything is confirmed</li>
                    </ul>
                  </div>
                </div>
              </Card>
              
              {/* Actions */}
              <div className="space-y-2 pt-2">
                {/* Validation message */}
                {!formData.description && (
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Please describe your care needs above
                  </p>
                )}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setWizardStep(2)} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    onClick={handleFormSubmit}
                    disabled={submitting || !formData.description}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600"
                    data-testid="submit-care-request-btn"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Submit Request</>
                    )}
                  </Button>
                </div>
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
                Your care request for <strong>{selectedPets.length > 0 ? selectedPets.map(p => p.name).join(', ') : formData.pet_name}</strong> has been submitted.
                <br />Our concierge team will reach out within {requestResult.typical_response_time || '24 hours'}.
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
              
              {requestResult.profile_gaps?.length > 0 && (
                <Card className="p-4 bg-amber-50 border-amber-200 text-left mb-6">
                  <p className="text-sm text-amber-800">
                    <strong>Tip:</strong> Complete your pet profile to get even better care recommendations!
                  </p>
                </Card>
              )}
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetWizard} className="flex-1">
                  New Request
                </Button>
                <Button onClick={() => { resetWizard(); window.location.href = `/mira-os?openConcierge=true&ticket=${requestResult?.ticket_id || ''}`; }} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                  View in Concierge® Inbox
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Care Service Flow Modal - Full options for each service (legacy) */}
      <CareServiceFlowModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        serviceType={bookingServiceType}
        pet={selectedPet}
        userPets={userPets}
        token={token}
      />
      
      {/* NEW: Grooming Flow Modal - Detailed 6-step wizard */}
      <GroomingFlowModal
        isOpen={showGroomingFlowModal}
        onClose={() => setShowGroomingFlowModal(false)}
        pet={selectedPet}
        user={user}
        token={token}
        entryPoint="care_page_grid"
      />
      
      {/* NEW: Vet Visit Flow Modal - Detailed wizard */}
      <VetVisitFlowModal
        isOpen={showVetVisitFlowModal}
        onClose={() => setShowVetVisitFlowModal(false)}
        pet={selectedPet}
        user={user}
        token={token}
        entryPoint="care_page_grid"
      />
      
      {/* NEW: Boarding & Daycare Flow Modal */}
      <CareFlowModal
        isOpen={showBoardingFlowModal}
        onClose={() => setShowBoardingFlowModal(false)}
        pet={selectedPet}
        user={user}
        token={token}
        schema={BOARDING_DAYCARE_FLOW_SCHEMA}
        buildPayload={buildBoardingTicketPayload}
        entryPoint="care_page_grid"
        accentColor="blue"
        headerGradient="from-blue-500 to-indigo-500"
        iconLabel="Boarding"
      />
      
      {/* NEW: Pet Sitting Flow Modal */}
      <CareFlowModal
        isOpen={showPetSittingFlowModal}
        onClose={() => setShowPetSittingFlowModal(false)}
        pet={selectedPet}
        user={user}
        token={token}
        schema={PET_SITTING_FLOW_SCHEMA}
        buildPayload={buildPetSittingTicketPayload}
        entryPoint="care_page_grid"
        accentColor="green"
        headerGradient="from-green-500 to-emerald-500"
        iconLabel="Pet Sitting"
      />
      
      {/* NEW: Emergency Help Flow Modal */}
      <CareFlowModal
        isOpen={showEmergencyFlowModal}
        onClose={() => setShowEmergencyFlowModal(false)}
        pet={selectedPet}
        user={user}
        token={token}
        schema={EMERGENCY_HELP_FLOW_SCHEMA}
        buildPayload={buildEmergencyTicketPayload}
        entryPoint="care_page_grid"
        accentColor="red"
        headerGradient="from-red-500 to-rose-500"
        iconLabel="Emergency"
      />
      
      {/* === BUNDLE DETAIL MODAL === */}
      <Dialog open={showBundleModal} onOpenChange={setShowBundleModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-pink-500" />
              Bundle Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedBundle && (
            <div className="space-y-4">
              {/* Bundle Header with gradient */}
              <div className={`h-32 bg-gradient-to-br ${
                CARE_TYPES[selectedBundle.care_type]?.color || 'from-pink-500 to-rose-500'
              } rounded-xl p-4 flex items-end relative overflow-hidden`}>
                <div className="absolute -right-6 -bottom-6 opacity-20">
                  {React.createElement(CARE_TYPES[selectedBundle.care_type]?.icon || Scissors, {
                    className: "w-24 h-24 text-white"
                  })}
                </div>
                <div>
                  <Badge className="bg-white/20 text-white backdrop-blur-sm mb-2">
                    {CARE_TYPES[selectedBundle.care_type]?.name || 'Care Bundle'}
                  </Badge>
                  <h3 className="text-xl font-bold text-white">{selectedBundle.name}</h3>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-gray-600">{selectedBundle.description}</p>
              
              {/* What's Included */}
              {selectedBundle.includes && selectedBundle.includes.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">What&apos;s Included:</h4>
                  <ul className="space-y-2">
                    {selectedBundle.includes.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Price Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{selectedBundle.price?.toLocaleString()}
                  </span>
                  {selectedBundle.original_price && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        ₹{selectedBundle.original_price?.toLocaleString()}
                      </span>
                      <Badge className="bg-red-100 text-red-700">
                        {Math.round((1 - selectedBundle.price / selectedBundle.original_price) * 100)}% OFF
                      </Badge>
                    </>
                  )}
                </div>
                {selectedBundle.paw_reward_points > 0 && (
                  <div className="flex items-center gap-1 text-sm text-purple-600">
                    <PawPrint className="w-4 h-4" />
                    Earn {selectedBundle.paw_reward_points} Paw Points
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowBundleModal(false)}
                >
                  Close
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700"
                  onClick={() => {
                    handleAddToCart(selectedBundle);
                    setShowBundleModal(false);
                  }}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* === ANYTHING ELSE FORM MODAL === */}
      <Dialog open={showAnythingElseModal} onOpenChange={setShowAnythingElseModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-pink-500" />
              Ask Our Concierge
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Can&apos;t find what you&apos;re looking for? Tell us what you need and our concierge team will help!
            </p>
            
            <div className="space-y-3">
              <div>
                <Label>Your Name</Label>
                <Input
                  value={anythingElseData.name}
                  onChange={(e) => setAnythingElseData({...anythingElseData, name: e.target.value})}
                  placeholder="Enter your name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={anythingElseData.email}
                    onChange={(e) => setAnythingElseData({...anythingElseData, email: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={anythingElseData.phone}
                    onChange={(e) => setAnythingElseData({...anythingElseData, phone: e.target.value})}
                    placeholder="+91 98xxx xxxxx"
                  />
                </div>
              </div>
              
              <div>
                <Label>Pet Name (Optional)</Label>
                <Input
                  value={anythingElseData.pet_name}
                  onChange={(e) => setAnythingElseData({...anythingElseData, pet_name: e.target.value})}
                  placeholder="Your pet's name"
                />
              </div>
              
              <div>
                <Label>What do you need help with?</Label>
                <Textarea
                  value={anythingElseData.request}
                  onChange={(e) => setAnythingElseData({...anythingElseData, request: e.target.value})}
                  placeholder="Describe your request in detail..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowAnythingElseModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600"
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    const result = await createCareRequest({
                      care_type: 'custom_request',
                      description: anythingElseData.request,
                      contact_name: anythingElseData.name,
                      contact_email: anythingElseData.email,
                      contact_phone: anythingElseData.phone,
                      pet_name: anythingElseData.pet_name,
                      source: 'anything_else_form'
                    }, token);
                    
                    if (result.success) {
                      showUnifiedFlowSuccess(toast, result.data);
                      setShowAnythingElseModal(false);
                      setAnythingElseData({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '', pet_name: '', request: '' });
                    }
                  } catch (error) {
                    showUnifiedFlowError(toast, error);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting || !anythingElseData.request}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Ask Concierge®</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Concierge® Button - Blue C® for Service Desk chat */}
      <ConciergeButton 
        pillar="care" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default CarePage;

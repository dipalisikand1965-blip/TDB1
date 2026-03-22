/**
 * FitPage.jsx
 * Premium Pillar Page - Fit (Fitness & Wellness)
 * Elegant, service-soul-driven design with social proof & engagement
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { createFitRequest, showUnifiedFlowSuccess, showUnifiedFlowError } from '../utils/unifiedApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import { ConciergeButton } from '../components/mira-os';
import { ChecklistDownloadButton } from '../components/checklists';
import ProductCard from '../components/ProductCard';
import MultiPetSelector from '../components/MultiPetSelector';
import { getPetPhotoUrl } from '../utils/petAvatar';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import PillarServicesGrid from '../components/PillarServicesGrid';
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
import { PillarAskMiraHero } from '../components/PillarAskMiraHero';
// New engagement components
import { FitnessJourneyCounter, RotatingSocialProof } from '../components/SocialProofBadges';
import TransformationStories from '../components/TransformationStories';
import ConversationalEntry from '../components/ConversationalEntry';
import QuickWinTip from '../components/QuickWinTip';
import SoulPersonalizationSection from '../components/SoulPersonalizationSection';
import {
  Dumbbell, Heart, TrendingUp, Scale, Activity, Trophy,
  CheckCircle, ChevronRight, ChevronLeft, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Target, Zap, PawPrint,
  Calendar, Award, ShoppingBag, Clock, X, Phone, Package,
  MessageCircle, Bookmark, Share2, ShoppingCart, Search, Shield,
  ClipboardList, GraduationCap
} from 'lucide-react';

// Elevated Concierge® Fit Experiences
const FIT_EXPERIENCES = [
  {
    title: "Wellness Architect®",
    description: "Beyond basic fitness plans — we design comprehensive wellness journeys that consider your pet's breed, age, health conditions, and lifestyle. From nutrition to exercise to recovery.",
    icon: "🏋️",
    gradient: "from-teal-500 to-emerald-600",
    badge: "Holistic",
    badgeColor: "bg-teal-600",
    highlights: [
      "Comprehensive health assessment",
      "Custom nutrition & exercise plan",
      "Progress tracking & adjustments",
      "Veterinary coordination"
    ]
  },
  {
    title: "Weight Journey Partner®",
    description: "Weight management is a journey, not a quick fix. We create sustainable plans that work with your pet's metabolism, preferences, and your family's routine — celebrating every milestone together.",
    icon: "⚖️",
    gradient: "from-green-500 to-teal-600",
    badge: "Most Requested",
    badgeColor: "bg-green-600",
    highlights: [
      "Body condition scoring",
      "Calorie-controlled meal planning",
      "Exercise intensity calibration",
      "Monthly progress check-ins"
    ]
  },
  {
    title: "Active Lifestyle Curator®",
    description: "For pets who need more than walks. We curate swimming sessions, agility play, hiking adventures, and social activities that keep your pet mentally and physically engaged.",
    icon: "🏃",
    gradient: "from-emerald-500 to-cyan-600",
    highlights: [
      "Activity matching by energy level",
      "Swimming & hydrotherapy sessions",
      "Adventure planning & coordination",
      "Playgroup matchmaking"
    ]
  },
  {
    title: "Senior Wellness Companion®",
    description: "Aging gracefully requires special attention. We design gentle fitness routines, mobility support, and comfort measures that help your senior pet live their best years with dignity.",
    icon: "🦴",
    gradient: "from-amber-500 to-orange-600",
    highlights: [
      "Gentle mobility exercises",
      "Joint health supplements",
      "Comfort & pain management",
      "Quality of life monitoring"
    ]
  }
];

// Service Categories with metadata
const SERVICE_CATEGORIES = {
  assessment: { 
    icon: Activity, 
    color: 'bg-teal-500', 
    lightBg: 'bg-teal-50', 
    text: 'text-teal-700',
    gradient: 'from-teal-500 to-emerald-500',
    name: 'Assessment' 
  },
  training: { 
    icon: Dumbbell, 
    color: 'bg-green-500', 
    lightBg: 'bg-green-50', 
    text: 'text-green-700',
    gradient: 'from-green-500 to-teal-500',
    name: 'Training' 
  },
  weight: { 
    icon: Scale, 
    color: 'bg-emerald-500', 
    lightBg: 'bg-emerald-50', 
    text: 'text-emerald-700',
    gradient: 'from-emerald-500 to-cyan-500',
    name: 'Weight Management' 
  },
  therapy: { 
    icon: Heart, 
    color: 'bg-cyan-500', 
    lightBg: 'bg-cyan-50', 
    text: 'text-cyan-700',
    gradient: 'from-cyan-500 to-blue-500',
    name: 'Therapy' 
  },
  senior: { 
    icon: Award, 
    color: 'bg-amber-500', 
    lightBg: 'bg-amber-50', 
    text: 'text-amber-700',
    gradient: 'from-amber-500 to-orange-500',
    name: 'Senior Care' 
  },
  puppy: { 
    icon: PawPrint, 
    color: 'bg-pink-500', 
    lightBg: 'bg-pink-50', 
    text: 'text-pink-700',
    gradient: 'from-pink-500 to-rose-500',
    name: 'Puppy' 
  },
  agility: { 
    icon: Zap, 
    color: 'bg-yellow-500', 
    lightBg: 'bg-yellow-50', 
    text: 'text-yellow-700',
    gradient: 'from-yellow-500 to-lime-500',
    name: 'Agility' 
  },
  wellness: { 
    icon: Sparkles, 
    color: 'bg-purple-500', 
    lightBg: 'bg-purple-50', 
    text: 'text-purple-700',
    gradient: 'from-purple-500 to-violet-500',
    name: 'Wellness' 
  }
};

// Activity levels for form
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Minimal activity)' },
  { value: 'light', label: 'Light (1-2 walks/day)' },
  { value: 'moderate', label: 'Moderate (Regular walks + play)' },
  { value: 'active', label: 'Active (Daily exercise)' },
  { value: 'very_active', label: 'Very Active (Athlete level)' }
];

const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'Weight Loss', icon: '⚖️' },
  { value: 'muscle_building', label: 'Build Muscle', icon: '💪' },
  { value: 'endurance', label: 'Improve Endurance', icon: '🏃' },
  { value: 'flexibility', label: 'Better Flexibility', icon: '🧘' },
  { value: 'senior_mobility', label: 'Senior Mobility', icon: '🦮' },
  { value: 'energy_management', label: 'Energy Management', icon: '⚡' },
  { value: 'rehabilitation', label: 'Rehabilitation', icon: '🩹' }
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1546815693-7533bae19894?w=1200&q=80'
];

// ==================== SERVICE DETAIL MODAL ====================
const ServiceDetailModal = ({ service, isOpen, onClose, onBook, onAskConcierge, userPets }) => {
  if (!service) return null;
  
  const category = SERVICE_CATEGORIES[service.category] || SERVICE_CATEGORIES.assessment;
  const Icon = category.icon;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header Image */}
        <div className={`relative h-52 bg-gradient-to-br ${category.gradient}`}>
          {service.image ? (
            <img 
              src={service.image} 
              alt={service.name}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-24 h-24 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Title Overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <Badge className={`${category.color} text-white border-0 mb-2`}>
              <Icon className="w-3 h-3 mr-1" />
              {category.name}
            </Badge>
            <h2 className="text-2xl font-bold text-white">{service.name}</h2>
          </div>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Price & Duration Bar */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm text-gray-500">Service Fee</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{service.price?.toLocaleString()}
                {service.is_subscription && <span className="text-sm font-normal text-gray-500">/month</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-lg font-semibold text-gray-900">{service.duration}</p>
            </div>
          </div>
          
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">About this service</h3>
            <p className="text-gray-600 leading-relaxed">{service.description}</p>
          </div>
          
          {/* What's Included */}
          {service.includes && service.includes.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">What&apos;s included</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {service.includes.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-teal-50">
                    <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Best For Section */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 mb-1">Why Concierge®?</h4>
                <p className="text-sm text-purple-700">
                  Our Concierge® team handles all coordination - scheduling, follow-ups, and personalised recommendations based on your pet&apos;s profile.
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button 
              size="lg"
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold rounded-xl h-12"
              onClick={() => onBook(service)}
              data-testid="modal-book-btn"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Enrol Now
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="flex-1 border-2 border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl h-12"
              onClick={() => onAskConcierge(service)}
              data-testid="modal-ask-concierge-btn"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask Concierge®
            </Button>
          </div>
          
          {/* Share & Save */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <Bookmark className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ==================== MAIN FIT PAGE COMPONENT ====================
const FitPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { currentPet, pets: contextPets } = usePillarContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const servicesSectionRef = useRef(null);
  
  // Use currentPet from context (syncs with global pet selector)
  const activePet = currentPet;
  
  // Get fitness category from URL query params
  const urlCategory = searchParams.get('type') || searchParams.get('category');
  
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/fit/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Keep {petName} fit and active",
    subtitle: 'Exercise, activities, fitness goals & wellness routines',
    askMira: {
      enabled: true,
      placeholder: "Exercise ideas for my breed... weight loss tips",
      buttonColor: 'bg-green-500'
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
  // NEW: CMS-driven Help Buckets, Daily Tips, Guided Paths
  const [cmsHelpBuckets, setCmsHelpBuckets] = useState([]);
  const [cmsDailyTips, setCmsDailyTips] = useState([]);
  const [cmsGuidedPaths, setCmsGuidedPaths] = useState([]);
  
  // Ask Mira state
  const [askMiraQuestion, setAskMiraQuestion] = useState('');
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  
  const handleAskMira = () => {
    if (!askMiraQuestion.trim()) return;
    setAskMiraLoading(true);
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: { message: askMiraQuestion, context: 'fit', pillar: 'fit', source: 'pillar_top_bar', pet_name: activePet?.name, pet_breed: activePet?.breed }
    }));
    setTimeout(() => {
      setAskMiraLoading(false);
      setAskMiraQuestion('');
    }, 500);
  };
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Keep ${activePet?.name || "your pet"} fit and active`;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/fit/page-config`);
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
        console.log('[FitPage] CMS config loaded');
      }
    } catch (error) {
      console.error('[FitPage] Failed to fetch CMS config:', error);
    }
  };

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);
  
  // Handle URL type parameter - scroll to services section
  useEffect(() => {
    if (urlCategory && servicesSectionRef.current) {
      // Scroll to services section after a short delay
      setTimeout(() => {
        servicesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [urlCategory]);
  
  // Data states
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [productsToShow, setProductsToShow] = useState(10); // Load More state
  
  // UI states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]); // Multi-pet selection
  const [submitting, setSubmitting] = useState(false);
  
  // Multi-pet selection handlers
  const handlePetToggle = (pet) => {
    setSelectedPets(prev => {
      const petId = pet.id || pet._id;
      const isSelected = prev.some(p => (p.id || p._id) === petId);
      if (isSelected) {
        return prev.filter(p => (p.id || p._id) !== petId);
      }
      return [...prev, pet];
    });
  };
  
  const handleSelectAllPets = () => setSelectedPets([...userPets]);
  const handleClearAllPets = () => setSelectedPets([]);
  
  // Form state
  const [bookingForm, setBookingForm] = useState({
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    preferred_date: '',
    notes: '',
    fitness_goals: [],
    current_activity_level: 'moderate'
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAllData();
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (user && token) {
      fetchUserPets();
      setBookingForm(prev => ({
        ...prev,
        contact_name: user.name || '',
        contact_email: user.email || '',
        contact_phone: user.phone || ''
      }));
    }
  }, [user, token]);
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [servicesRes, productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/services?pillar=fit`),
        // Use new pillar resolver API for rule-based product filtering
        fetch(`${API_URL}/api/products?pillar=fit&limit=20`),
        fetch(`${API_URL}/api/fit/bundles`)
      ]);
      
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
        console.log(`[FitPage] Loaded ${data.count} products via pillar resolver`);
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
  
  const handleViewDetails = (service) => {
    setSelectedService(service);
    setShowDetailModal(true);
  };
  
  const handleQuickBook = (service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };
  
  const handleAskConcierge = (service) => {
    // Navigate to Mira with context
    navigate(`/mira?context=fit&service=${encodeURIComponent(service.name)}`);
  };
  
  const toggleGoal = (goal) => {
    const goals = bookingForm.fitness_goals.includes(goal)
      ? bookingForm.fitness_goals.filter(g => g !== goal)
      : [...bookingForm.fitness_goals, goal];
    setBookingForm({ ...bookingForm, fitness_goals: goals });
  };
  
  const submitBooking = async () => {
    if (!bookingForm.contact_name || !bookingForm.contact_phone) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and phone number",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      // Prepare multi-pet data
      const petsData = selectedPets.length > 0 
        ? selectedPets.map(pet => ({
            id: pet.id || pet._id,
            name: pet.name,
            breed: pet.breed,
            species: pet.species || 'dog'
          }))
        : [];
      
      // Use unified API client for consistent flow enforcement
      const requestPayload = {
        fit_type: selectedService?.category || 'assessment',
        service_id: selectedService?.id,
        // Multi-pet support
        pets: petsData,
        pet_count: petsData.length,
        is_multi_pet: petsData.length > 1,
        // Legacy single pet fields for backward compatibility
        pet_id: petsData[0]?.id,
        pet_name: petsData.map(p => p.name).join(', '),
        pet_breed: petsData.map(p => p.breed).join(', '),
        preferred_date: bookingForm.preferred_date,
        fitness_goals: bookingForm.fitness_goals,
        current_activity_level: bookingForm.current_activity_level,
        notes: bookingForm.notes,
        user_name: bookingForm.contact_name,
        user_email: bookingForm.contact_email,
        user_phone: bookingForm.contact_phone
      };

      const result = await createFitRequest(requestPayload, token);
      
      // HARD GUARD: Verify unified flow IDs
      console.log('[UNIFIED FLOW] Fit request result:', result);
      if (!result.ticket_id && !result.request_id) {
        console.error('[UNIFIED FLOW] ❌ Fit request missing ticket_id');
        throw new Error('Fit request missing unified flow IDs');
      }
      
      // Show success with unified flow confirmation
      showUnifiedFlowSuccess('fit_request', {
        ticket_id: result.ticket_id,
        notification_id: result.notification_id,
        inbox_id: result.inbox_id
      });
      
      const petNames = petsData.map(p => p.name).join(', ');
      toast({
        title: "Booking Confirmed! 💪",
        description: result.message || `Fitness request #${result.ticket_id || result.request_id} received${petNames ? ` for ${petNames}` : ''}.`
      });
      setShowBookingModal(false);
      setShowDetailModal(false);
      setSelectedService(null);
      setSelectedPets([]);
      setBookingForm(prev => ({
        ...prev,
        preferred_date: '',
        notes: '',
        fitness_goals: []
      }));
    } catch (error) {
      console.error('Error submitting fit request:', error);
      showUnifiedFlowError('fit_request', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Could not complete booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get unique categories from services for the filter bar
  const availableCategories = [...new Set(services.map(s => s.category).filter(Boolean))];
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // DEFAULT DATA FOR GOLD STANDARD SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════════
  
  // Fit Help Buckets - DEFAULTS (used when no CMS data)
  const defaultHelpBuckets = [
    {
      id: 'exercise',
      title: 'Exercise Help',
      icon: 'Activity',
      color: 'teal',
      items: ['Daily exercise routine', 'Breed-specific activities', 'Indoor exercise ideas', 'Exercise for seniors']
    },
    {
      id: 'weight',
      title: 'Weight Management',
      icon: 'Scale',
      color: 'green',
      items: ['Weight loss plans', 'Portion control tips', 'Healthy treat alternatives', 'Progress tracking']
    },
    {
      id: 'activities',
      title: 'Activities & Sports',
      icon: 'Trophy',
      color: 'amber',
      items: ['Swimming classes', 'Agility training', 'Dog park etiquette', 'Group activities']
    }
  ];
  const helpBuckets = cmsHelpBuckets.length > 0 ? cmsHelpBuckets : defaultHelpBuckets;

  // Fit Guided Paths - DEFAULTS
  const defaultGuidedPaths = [
    { title: 'New to Fitness Path', topicSlug: 'exercise', steps: ['Assess current fitness', 'Start slow walks', 'Build endurance', 'Add variety', 'Track progress'], color: 'teal' },
    { title: 'Weight Loss Journey', topicSlug: 'weight', steps: ['Weigh your pet', 'Calculate calories', 'Adjust portions', 'Increase activity', 'Weekly check-ins'], color: 'green' },
    { title: 'Agility Starter Path', topicSlug: 'agility', steps: ['Basic commands', 'Simple obstacles', 'Tunnel training', 'Jump practice', 'Course running'], color: 'amber' },
    { title: 'Swimming Introduction', topicSlug: 'swimming', steps: ['Water comfort', 'Shallow entry', 'Float training', 'Paddle strokes', 'Deep water'], color: 'blue' },
    { title: 'Senior Fitness Path', topicSlug: 'exercise', steps: ['Gentle assessment', 'Low-impact walks', 'Joint-friendly play', 'Rest schedule', 'Mobility support'], color: 'purple' },
    { title: 'Puppy Energy Path', topicSlug: 'exercise', steps: ['Short play bursts', 'Socialization play', 'Basic fetch', 'Structured walks', 'Rest importance'], color: 'pink' }
  ];
  const guidedPaths = cmsGuidedPaths.length > 0 ? cmsGuidedPaths : defaultGuidedPaths;

  // Daily Fit Tips - DEFAULTS
  const defaultDailyFitTips = [
    { category: 'Exercise', tip: 'Most dogs need 30-60 minutes of exercise daily. High-energy breeds may need 1-2 hours. Always match intensity to your dog\'s fitness level.', icon: Activity, color: 'from-teal-500 to-emerald-500' },
    { category: 'Walking', tip: 'Vary your walking routes to keep things interesting. New smells and sights provide mental stimulation that\'s just as important as physical exercise.', icon: Heart, color: 'from-green-500 to-teal-500' },
    { category: 'Swimming', tip: 'Swimming is excellent low-impact exercise, especially for dogs with joint issues. Start in shallow water and never force a dog who\'s uncomfortable.', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
    { category: 'Weight', tip: 'You should be able to feel your dog\'s ribs without pressing hard. If you can\'t, it may be time to adjust diet and increase exercise.', icon: Scale, color: 'from-amber-500 to-orange-500' },
    { category: 'Rest', tip: 'Rest days are important! Dogs need 12-14 hours of sleep daily. Puppies and seniors need even more. Don\'t over-exercise.', icon: Shield, color: 'from-purple-500 to-violet-500' },
    { category: 'Play', tip: 'Interactive play like fetch or tug-of-war strengthens your bond while providing exercise. Keep sessions short but frequent throughout the day.', icon: Trophy, color: 'from-pink-500 to-rose-500' },
    { category: 'Agility', tip: 'You don\'t need fancy equipment for agility fun. Use household items like boxes and broomsticks to create simple obstacle courses.', icon: Zap, color: 'from-emerald-500 to-green-500' }
  ];
  const dailyFitTips = cmsDailyTips.length > 0 ? cmsDailyTips : defaultDailyFitTips;
  const todaysTip = dailyFitTips[new Date().getDay() % dailyFitTips.length];
  
  if (loading) {
    return (
      <PillarPageLayout
        pillar="fit"
        title="Fit - Movement & Energy | The Doggy Company"
        description="Activity that matches your pet's rhythm. Expert fitness programmes, weight management, and activity tracking."
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </PillarPageLayout>
    );
  }
  
  return (
    <PillarPageLayout
      pillar="fit"
      title="Fit - Movement & Energy | The Doggy Company"
      description="Activity that matches your pet's rhythm. Expert fitness programmes, weight management, and activity tracking."
    >
      {/* ═══════════════════════════════════════════════════════════════════════════════
          1. ASK MIRA BAR - GOLD STANDARD (Must be first!)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.askMira?.enabled !== false && (
        <PillarAskMiraHero
          theme="teal"
          sectionTestId="fit-top-ask-mira"
          badgeTestId="fit-ask-mira-badge"
          titleTestId="fit-page-title"
          inputTestId="ask-fit-input"
          submitTestId="ask-fit-submit"
          title={pageTitle}
          description="Start with Mira for a soul-aware fitness plan, then continue in the same chat below — no duplicate assistant, no lost context."
          value={askMiraQuestion}
          onChange={(e) => setAskMiraQuestion(e.target.value)}
          onSubmit={handleAskMira}
          loading={askMiraLoading}
          placeholder={cmsConfig.askMira?.placeholder || "Exercise ideas for my breed... weight loss tips... swimming classes"}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          2. TOPIC CARDS - 4 Fitness Categories (After Ask Mira)
          ═══════════════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.categories?.enabled !== false && (
        <PillarTopicsGrid
          pillar="fit"
          topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.fit}
          columns={4}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════════
          3. DAILY FIT TIP - Rotates based on day
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <section className="py-6 px-4 bg-gradient-to-r from-teal-50 to-emerald-50">
        <div className="max-w-4xl mx-auto">
          <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${todaysTip.color || 'from-teal-500 to-emerald-500'} p-5 md:p-6 text-white`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                {todaysTip.icon ? <todaysTip.icon className="w-6 h-6 text-white" /> : <Activity className="w-6 h-6 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Today's Fitness Tip</span>
                  <span className="text-xs text-white/60 ml-auto hidden sm:block">{todaysTip.category}</span>
                </div>
                <p className="text-sm md:text-base font-medium leading-relaxed" data-testid="daily-fit-tip">
                  {todaysTip.tip}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          4. HOW CAN WE HELP? - 3 Action Buckets
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">How can we help?</h2>
            <p className="text-gray-600 mt-1">Choose what matters most to you right now</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {helpBuckets.map((bucket, idx) => {
              const iconMap = { Activity, Scale, Trophy, Heart, Sparkles, PawPrint, Shield, Star };
              const BucketIcon = iconMap[bucket.icon] || Activity;
              const colorMap = {
                'teal': { bg: 'bg-gradient-to-br from-teal-50 to-emerald-50', border: 'border-teal-100', icon: 'bg-teal-100', iconColor: 'text-teal-600', dot: 'bg-teal-400' },
                'green': { bg: 'bg-gradient-to-br from-green-50 to-emerald-50', border: 'border-green-100', icon: 'bg-green-100', iconColor: 'text-green-600', dot: 'bg-green-400' },
                'amber': { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-100', icon: 'bg-amber-100', iconColor: 'text-amber-600', dot: 'bg-amber-400' }
              };
              const colors = colorMap[bucket.color] || colorMap.teal;
              
              return (
                <Card 
                  key={bucket.id || idx}
                  className={`p-5 ${colors.bg} ${colors.border} rounded-2xl cursor-pointer hover:shadow-md transition-shadow`}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('openMiraAI', {
                      detail: { message: bucket.items?.join(', ') || bucket.title, context: 'fit', pillar: 'fit' }
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

      {/* ═══════════════════════════════════════════════════════════════════════════════
          5. PERSONALIZED FOR PET - Core Gold Standard layer
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gradient-to-b from-white to-teal-50/30" data-testid="fit-personalized-picks-top">
        <div className="max-w-6xl mx-auto">
          <PersonalizedPicks 
            key={`fit-picks-top-${activePet?.id || 'guest'}`}
            pillar="fit" 
            maxProducts={6} 
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          6. GUIDED FITNESS PATHS - Step-by-step journeys
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <div id="guided-paths" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <ClipboardList className="w-4 h-4" />
              Step-by-Step Journeys
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Guided Fitness Paths</h2>
            <p className="text-gray-600 mt-2">Follow a structured journey tailored to your needs</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {guidedPaths.map((path, idx) => (
              <Card 
                key={idx}
                className="p-5 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openMiraAI', {
                    detail: { 
                      message: `I want to follow the "${path.title}" fitness journey. Steps: ${path.steps?.join(', ')}`,
                      context: 'fit',
                      pillar: 'fit'
                    }
                  }));
                }}
                data-testid={`guided-path-${idx}`}
              >
                <div className={`w-10 h-10 rounded-xl bg-${path.color}-100 flex items-center justify-center mb-3`}>
                  <Target className={`w-5 h-5 text-${path.color}-600`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">{path.title}</h3>
                <div className="flex flex-wrap gap-1">
                  {(path.steps || []).slice(0, 3).map((step, stepIdx) => (
                    <span key={stepIdx} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{step}</span>
                  ))}
                  {(path.steps || []).length > 3 && (
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">+{path.steps.length - 3} more</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          MIRA ADVISOR - Fitness Coach AI Assistant
          ═══════════════════════════════════════════════════════════ */}
      <div className="max-w-2xl mx-auto px-4 mb-8">
        <MiraAdvisorCard pillar="fit" activePet={activePet} />
        
        {/* Download Exercise Plan Checklist */}
        <div className="mt-4 flex justify-center">
          <ChecklistDownloadButton 
            pillar="fit" 
            variant="outline"
            className="border-green-300 text-green-700 hover:bg-green-50"
          />
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          SOUL MADE COLLECTION - Breed-specific personalized products
          Shows fit products with breed artwork (Training Pouch, Walking Set, etc.)
          ADDED: March 10, 2026
          ═══════════════════════════════════════════════════════════════════════ */}
      {(activePet || userPets?.[0]) && (
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <SoulMadeCollection
            pillar="play"
            maxItems={8}
            showTitle={true}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BREED-SMART RECOMMENDATIONS - Based on breed_matrix */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {(activePet || userPets?.[0]) && (
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <BreedSmartRecommendations pillar="fit" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SOUL PERSONALIZATION SECTION - THE CENTERPIECE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SoulPersonalizationSection pillar="fit" />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ARCHETYPE-PERSONALIZED PRODUCTS - Multi-factor filtering */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <ArchetypeProducts pillar="fit" maxProducts={8} showTitle={true} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CURATED BUNDLES - Save with handpicked combinations */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <CuratedBundles pillar="fit" showTitle={true} />
      </div>
      
      {/* Unified Curated Layer - Matches Dine/Celebrate gold standard */}
      <MiraCuratedLayer
        key={`fit-curated-${activePet?.id || 'guest'}`}
        pillar="fit"
        activePet={activePet || userPets?.[0]}
        token={token}
        userEmail={user?.email}
        isLoading={!userPets && !!token}
      />
      
      {/* Mira's Picks for Pet */}
      {(activePet || userPets?.[0]) && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <PillarPicksSection pillar="fit" pet={activePet || userPets[0]} />
        </div>
      )}

      {/* ==================== CONVERSATIONAL ENTRY + QUICK WIN ==================== */}
      <div className="py-10 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-6 items-stretch">
            {/* Conversational Entry - Component has its own styling now */}
            <ConversationalEntry 
              pillar="fit"
              petName={userPets[0]?.name}
              onGoalSelect={(goal, message) => {
                navigate(`/mira?context=fit_${goal.id}&preset=${encodeURIComponent(message)}`);
              }}
            />
            
            {/* Quick Win Tip - Component has its own styling now */}
            <QuickWinTip
              pillar="fit"
              petName={userPets[0]?.name}
              petBreed={userPets[0]?.breed}
              petAge={userPets[0]?.age}
              onActionClick={(tip) => {
                if (tip?.actionType === 'navigate' && tip?.actionUrl) {
                  navigate(tip.actionUrl);
                } else if (tip?.actionType === 'checklist') {
                  toast({ title: tip.action, description: 'Fitness checklist coming soon!' });
                } else {
                  toast({ title: tip.action, description: 'Coming soon!' });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* ==================== TRANSFORMATION STORIES ==================== */}
      <div className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <TransformationStories 
            pillar="fit"
            onViewProgram={(program) => {
              const exp = FIT_EXPERIENCES.find(e => e.title.includes(program?.split('®')[0]));
              if (exp) {
                toast({ title: `Learn more about ${exp.title}`, description: 'Opening details...' });
              }
            }}
          />
        </div>
      </div>

      {/* ==================== CONCIERGE® FIT EXPERIENCES - COMPACT ==================== */}
      <div className="py-10 bg-gradient-to-b from-white to-teal-50/30">
        <div className="max-w-7xl mx-auto px-4">
          {/* Elegant Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                Fit <span className="text-teal-600">Concierge®</span> Experiences
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Personalized wellness journeys, not just programs
              </p>
            </div>
            <Button 
              variant="ghost" 
              className="text-teal-600 hover:text-teal-700 text-sm hidden sm:flex"
              onClick={() => setShowBookingModal(true)}
            >
              Not sure? Tell us about your pet <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* Compact Experience Cards - Use compact prop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {FIT_EXPERIENCES.map((exp, idx) => (
              <ConciergeExperienceCard
                key={idx}
                pillar="fit"
                title={exp.title}
                description={exp.description}
                icon={exp.icon}
                gradient={exp.gradient}
                badge={exp.badge}
                badgeColor={exp.badgeColor}
                highlights={exp.highlights}
                compact={true}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ==================== MIRA PICKS - SUBTLE CAROUSEL ==================== */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <MiraPicksCarousel
            pillar="fit"
            petId={selectedPets[0]?.id || userPets[0]?.id}
            petName={selectedPets[0]?.name || userPets[0]?.name}
            petPhoto={selectedPets[0] ? getPetPhotoUrl(selectedPets[0]) : userPets[0] ? getPetPhotoUrl(userPets[0]) : null}
            userId={user?.id}
            onSelectService={handleViewDetails}
            onSelectProduct={(product) => {
              addToCart({
                id: product.id,
                name: product.name || product.title,
                price: product.price,
                image: product.image_url || product.image,
                type: 'product'
              });
              toast({ title: '🛒 Added to Cart!', description: `${product.name || product.title} added` });
            }}
          />
        </div>
      </section>
      
      {/* ==================== CONCIERGE® SERVICES SECTION ==================== */}
      <section ref={servicesSectionRef} id="services" className="py-12 md:py-16 bg-gradient-to-b from-teal-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-teal-600 uppercase tracking-wider">Concierge® Services</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Premium Fitness Services
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl">
              Tap any service for details. Our Concierge® team handles all coordination.
            </p>
          </div>
          
          {/* MakeMyTrip-Style Services Grid */}
          <PillarServicesGrid
            services={services.map(s => ({
              ...s,
              title: s.name,
              icon: SERVICE_CATEGORIES[s.category]?.icon ? '🏋️' : null,
              gradient: SERVICE_CATEGORIES[s.category]?.gradient || 'from-teal-500 to-emerald-500',
              highlights: s.includes || [],
              badge: s.is_subscription ? 'Subscription' : null,
              badgeColor: 'bg-teal-600'
            }))}
            categories={availableCategories.map(catKey => ({
              id: catKey,
              name: SERVICE_CATEGORIES[catKey]?.name || catKey,
              icon: catKey === 'assessment' ? '📊' : 
                    catKey === 'training' ? '🏋️' : 
                    catKey === 'weight' ? '⚖️' : 
                    catKey === 'therapy' ? '💆' : 
                    catKey === 'senior' ? '🦮' :
                    catKey === 'puppy' ? '🐕' :
                    catKey === 'agility' ? '⚡' :
                    catKey === 'wellness' ? '✨' : '🎯'
            }))}
            onServiceSelect={handleViewDetails}
            onServiceBook={handleQuickBook}
            selectedService={selectedService}
            relatedProducts={products.reduce((acc, p) => {
              const cat = p.category || 'general';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(p);
              return acc;
            }, {})}
            pillarGradient="from-teal-500 to-emerald-500"
            pillarColor="teal"
            showFilters={true}
          />
        </div>
      </section>
      
      {/* ==================== SERVICE CATALOG WITH PRICING ==================== */}
      <ServiceCatalogSection 
        pillar="fit"
        title="Fit, Personalised"
        subtitle="See your personalised price based on your city, pet size, and requirements"
        maxServices={8}
      />
      
      {/* ==================== PRODUCTS SECTION ==================== */}
      <section id="products" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-medium text-teal-600 uppercase tracking-wider">Shop</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Fitness Gear & Bundles</h2>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/shop?pillar=fit')}
              className="hidden md:flex items-center gap-2 rounded-full"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Bundles */}
          {bundles.length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-500" />
                Value Bundles
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundles.map((bundle) => (
                  <Card key={bundle.id} className="p-4 border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                      {bundle.is_recommended && (
                        <Badge className="bg-teal-600 text-white">Recommended</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl font-bold text-teal-600">₹{bundle.price?.toLocaleString()}</span>
                      {bundle.original_price && (
                        <>
                          <span className="text-sm text-gray-400 line-through">₹{bundle.original_price?.toLocaleString()}</span>
                          <Badge variant="outline" className="text-teal-600 border-teal-300">
                            Save ₹{(bundle.original_price - bundle.price)?.toLocaleString()}
                          </Badge>
                        </>
                      )}
                    </div>
                    <Button 
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      onClick={() => {
                        addToCart({
                          id: bundle.id,
                          name: bundle.name,
                          price: bundle.price,
                          image: bundle.image || '/images/bundle-placeholder.jpg',
                          pillar: 'fit',
                          type: 'bundle'
                        });
                        toast({ title: '🎉 Added to Cart!', description: `${bundle.name} added to your cart` });
                      }}
                      data-testid={`add-bundle-${bundle.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Products Grid with Load More */}
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {products.slice(0, productsToShow).map((product) => (
                  <ProductCard key={product.id} product={product} pillar="fit" />
                ))}
              </div>
              
              {/* Load More Button */}
              {products.length > productsToShow && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    onClick={() => setProductsToShow(prev => prev + 10)}
                    className="px-8 py-3 rounded-full border-2 border-teal-300 text-teal-600 hover:bg-teal-50"
                  >
                    Load More
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="p-12 text-center border-gray-100">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Products Coming Soon</h3>
              <Button onClick={() => navigate('/shop')} variant="outline" className="rounded-full">
                Browse All Products
              </Button>
            </Card>
          )}
        </div>
      </section>
      
      {/* ==================== CTA SECTION ==================== */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Pet&apos;s Fitness?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Start with a free consultation. Our Concierge® team will help you find the perfect programme.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => handleQuickBook(services[0] || { id: 'consultation', name: 'Free Consultation', price: 0 })}
              className="bg-white text-teal-700 hover:bg-gray-100 font-semibold px-10 py-6 text-lg rounded-full shadow-2xl transition-all hover:scale-105"
            >
              <Phone className="w-5 h-5 mr-2" />
              Book Free Consultation
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/mira?context=fit')}
              className="border-2 border-white/50 text-white hover:bg-white/10 font-semibold px-10 py-6 text-lg rounded-full"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Ask Mira
            </Button>
          </div>
        </div>
      </section>
      
      {/* ==================== SERVICE DETAIL MODAL ==================== */}
      <ServiceDetailModal 
        service={selectedService}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedService(null);
        }}
        onBook={handleQuickBook}
        onAskConcierge={handleAskConcierge}
        userPets={userPets}
      />
      
      {/* ==================== BOOKING MODAL ==================== */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Book {selectedService?.name}
            </DialogTitle>
            <DialogDescription>
              Complete your booking and our Concierge® team will confirm within 24 hours.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Service info */}
            {selectedService && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{selectedService.name}</span>
                  <span className="font-bold text-teal-700">₹{selectedService.price?.toLocaleString()}</span>
                </div>
                {selectedService.duration && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedService.duration}
                  </p>
                )}
              </div>
            )}
            
            {/* Multi-Pet selection */}
            <MultiPetSelector
              userPets={userPets}
              selectedPets={selectedPets}
              onPetToggle={handlePetToggle}
              onSelectAll={handleSelectAllPets}
              onClearAll={handleClearAllPets}
              multiSelect={true}
              pillarColor="teal"
              label="Select Pet(s) for This Service"
            />
            
            {/* Contact info */}
            <div className="space-y-3">
              <Label className="font-semibold">Your Contact Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-500">Name *</Label>
                  <Input
                    placeholder="Your name"
                    value={bookingForm.contact_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Phone *</Label>
                  <Input
                    placeholder="Mobile number"
                    value={bookingForm.contact_phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={bookingForm.contact_email}
                  onChange={(e) => setBookingForm({ ...bookingForm, contact_email: e.target.value })}
                />
              </div>
            </div>
            
            {/* Preferred date */}
            <div>
              <Label className="text-sm text-gray-500">Preferred Date</Label>
              <Input
                type="date"
                value={bookingForm.preferred_date}
                onChange={(e) => setBookingForm({ ...bookingForm, preferred_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Fitness goals */}
            <div>
              <Label className="mb-2 block font-semibold">Fitness Goals</Label>
              <div className="flex flex-wrap gap-2">
                {FITNESS_GOALS.map((goal) => (
                  <Badge
                    key={goal.value}
                    variant={bookingForm.fitness_goals.includes(goal.value) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all px-3 py-1.5 ${
                      bookingForm.fitness_goals.includes(goal.value) 
                        ? 'bg-teal-600 hover:bg-teal-700' 
                        : 'hover:bg-teal-50'
                    }`}
                    onClick={() => toggleGoal(goal.value)}
                  >
                    <span className="mr-1">{goal.icon}</span>
                    {goal.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <Label className="text-sm text-gray-500">Additional Notes</Label>
              <Textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                placeholder="Any specific requirements or health conditions we should know about?"
                rows={3}
              />
            </div>
            
            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBookingModal(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitBooking}
                disabled={!bookingForm.contact_name || !bookingForm.contact_phone || submitting}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Booking...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Confirm Booking</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Concierge® Button - Blue C® for Service Desk chat */}
      <ConciergeButton 
        pillar="fit" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default FitPage;

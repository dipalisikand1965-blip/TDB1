/**
 * FitPage.jsx
 * Premium Pillar Page - Fit (Fitness & Wellness)
 * Elegant, service-soul-driven design with social proof & engagement
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from '../hooks/use-toast';
import MiraContextPanel from '../components/MiraContextPanel';
import AdminQuickEdit from '../components/AdminQuickEdit';
import ProductCard from '../components/ProductCard';
import MultiPetSelector from '../components/MultiPetSelector';
import { getPetPhotoUrl } from '../utils/petAvatar';
import SEOHead from '../components/SEOHead';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import PillarServicesGrid from '../components/PillarServicesGrid';
import MiraPicksCarousel from '../components/MiraPicksCarousel';
// New engagement components
import { FitnessJourneyCounter, RotatingSocialProof } from '../components/SocialProofBadges';
import TransformationStories from '../components/TransformationStories';
import ConversationalEntry from '../components/ConversationalEntry';
import QuickWinTip from '../components/QuickWinTip';
import {
  Dumbbell, Heart, TrendingUp, Scale, Activity, Trophy,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Target, Zap, PawPrint,
  Calendar, Award, ShoppingBag, Clock, X, Phone, Package,
  MessageCircle, Bookmark, Share2, ShoppingCart
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
  const navigate = useNavigate();
  
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
        fetch(`${API_URL}/api/products?pillar=fit&limit=10`),
        fetch(`${API_URL}/api/fit/bundles`)
      ]);
      
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50 to-white">
      {/* SEO Meta Tags */}
      <SEOHead page="fit" path="/fit" />

        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      
      {/* ==================== HERO SECTION ==================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-emerald-800 to-green-900 text-white">
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Pet Fitness" 
            className="w-full h-full object-cover opacity-30 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/90 via-emerald-800/80 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Dumbbell className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium">Pet Fitness & Wellness</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Fit Paws,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-200">
                Happy Hearts
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
              Expert fitness programmes, weight management, and activity tracking. Build a healthier, happier life together with your furry athlete.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-emerald-950 font-semibold px-8 py-6 text-lg rounded-full shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105"
                data-testid="get-fit-btn"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Explore Services
              </Button>
              <Button 
                onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
              >
                <Package className="w-5 h-5 mr-2" />
                Shop Fitness Gear
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-6 mt-12">
              <div className="flex items-center gap-2 text-white/70">
                <Trophy className="w-5 h-5 text-lime-400" />
                <span className="text-sm">Certified Trainers</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">Progress Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <PawPrint className="w-5 h-5 text-teal-400" />
                <span className="text-sm">Earn Paw Points</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </div>
      </div>

      {/* ==================== SOCIAL PROOF BANNER ==================== */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
          <FitnessJourneyCounter />
          <RotatingSocialProof 
            petName={userPets[0]?.name} 
            breedName={userPets[0]?.breed} 
          />
        </div>
      </div>

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
                image: product.image,
                pillar: 'fit',
                type: 'product'
              });
              toast({ title: '🛒 Added to Cart!', description: `${product.name || product.title} added` });
            }}
          />
        </div>
      </section>
      
      {/* ==================== CONCIERGE® SERVICES SECTION ==================== */}
      <section id="services" className="py-12 md:py-16 bg-gradient-to-b from-teal-50/30 to-white">
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
                    Load More Products
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Showing {Math.min(productsToShow, products.length)} of {products.length}
                  </p>
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
      
      {/* ==================== MIRA PANEL ==================== */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="fit" />
      </div>
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30">
        <MiraContextPanel pillar="fit" position="bottom" />
      </div>
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="fit" position="bottom-left" />
    </div>
  );
};

export default FitPage;

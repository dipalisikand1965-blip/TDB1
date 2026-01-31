import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from '../hooks/use-toast';
import MiraContextPanel from '../components/MiraContextPanel';
import ProductCard from '../components/ProductCard';
import AdminQuickEdit from '../components/AdminQuickEdit';
import MultiPetSelector from '../components/MultiPetSelector';
import { getPetPhotoUrl } from '../utils/petAvatar';
import BreedAutocomplete from '../components/BreedAutocomplete';
import SEOHead from '../components/SEOHead';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import ServiceBookingModal from '../components/ServiceBookingModal';
// NEW: FitPage-style engagement components
import { FitnessJourneyCounter, RotatingSocialProof } from '../components/SocialProofBadges';
import ConversationalEntry from '../components/ConversationalEntry';
import QuickWinTip from '../components/QuickWinTip';
import {
  Scissors, PawPrint, GraduationCap, Stethoscope, AlertTriangle, Heart,
  ClipboardList, MapPin, Calendar, Clock, CheckCircle, MessageCircle,
  ChevronRight, Sparkles, Package, Star, Loader2, Info, Send,
  ArrowRight, Users, Play, ChevronDown, Gift, Zap, Shield, Phone,
  Home, Building2, AlertCircle, Trophy
} from 'lucide-react';

// Elevated Concierge® Care Experiences
const CARE_EXPERIENCES = [
  {
    title: "Wellness Orchestrator®",
    description: "From annual checkups to specialist consultations, we coordinate your pet's complete healthcare journey — finding the right vets, managing appointments, and ensuring nothing falls through the cracks.",
    icon: "🏥",
    gradient: "from-rose-500 to-pink-600",
    badge: "Essential",
    badgeColor: "bg-rose-600",
    image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&q=80",
    highlights: [
      "Vet selection & appointment booking",
      "Medical record management",
      "Vaccination & deworming schedules",
      "Specialist referral coordination"
    ]
  },
  {
    title: "Groom & Glam Curator®",
    description: "Every coat tells a story. We match your pet with groomers who understand their breed, temperament, and style preferences — because grooming should be a spa day, not a stressful one.",
    icon: "✨",
    gradient: "from-pink-500 to-purple-600",
    badge: "Popular",
    badgeColor: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80",
    highlights: [
      "Groomer matching by breed expertise",
      "Temperament-sensitive handling",
      "At-home or salon sessions",
      "Style consultation for special events"
    ]
  },
  {
    title: "Daily Companion Finder®",
    description: "Need a reliable walker, sitter, or overnight carer? We vet, match, and coordinate trusted companions who treat your pet like family — not just another client.",
    icon: "🐕",
    gradient: "from-green-500 to-teal-600",
    image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80",
    highlights: [
      "Background-verified walkers & sitters",
      "Personality & energy matching",
      "Regular check-ins & GPS tracking",
      "Emergency backup arrangements"
    ]
  },
  {
    title: "Emergency Response Partner®",
    description: "When emergencies strike, you need more than a phone number. We guide you through crisis moments — locating 24/7 vets, arranging urgent transport, and staying with you until your pet is safe.",
    icon: "🚨",
    gradient: "from-red-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=800&q=80",
    highlights: [
      "24/7 emergency vet locator",
      "Urgent transport coordination",
      "Real-time crisis support",
      "Post-emergency follow-up care"
    ]
  },
  {
    title: "Feed & Nutrition Advisor®",
    description: "Every pet deserves a diet tailored to their unique needs. Our nutrition experts create personalised meal plans, manage weight goals, and navigate food allergies — so your pet thrives from the inside out.",
    icon: "🍖",
    gradient: "from-orange-500 to-amber-600",
    badge: "New",
    badgeColor: "bg-orange-500",
    image: "https://images.unsplash.com/photo-1585846416120-3a7354ed7d39?w=800&q=80",
    highlights: [
      "Custom diet planning by nutritionists",
      "Weight management programmes",
      "Allergy-safe meal solutions",
      "Puppy & senior nutrition guidance"
    ]
  }
];

// Care Types Configuration
const CARE_TYPES = {
  grooming: {
    id: 'grooming',
    name: 'Grooming',
    icon: Scissors,
    description: 'Full groom, bath, nail trim, ear cleaning',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-600'
  },
  walks: {
    id: 'walks',
    name: 'Walks & Sitting',
    icon: PawPrint,
    description: 'Daily walks, pet sitting, overnight care',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  training: {
    id: 'training',
    name: 'Training & Behaviour',
    icon: GraduationCap,
    description: 'Obedience, anxiety, reactivity, puppy training',
    color: 'from-blue-500 to-indigo-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  vet_coordination: {
    id: 'vet_coordination',
    name: 'Vet Coordination',
    icon: Stethoscope,
    description: 'Find vets, schedule reminders, health records',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  emergency: {
    id: 'emergency',
    name: 'Emergency Help',
    icon: AlertTriangle,
    description: 'Urgent care routing & emergency guidance',
    color: 'from-red-500 to-orange-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600'
  },
  special_needs: {
    id: 'special_needs',
    name: 'Special Needs Care',
    icon: Heart,
    description: 'Senior care, disability support, chronic conditions',
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  },
  feed: {
    id: 'feed',
    name: 'Feed & Nutrition',
    icon: Package,
    description: 'Diet planning, weight management, allergy diets',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600'
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
  const formRef = useRef(null);
  
  // State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [userPets, setUserPets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]); // Multi-pet support
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [careProducts, setCareProducts] = useState([]);
  const [careBundles, setCareBundles] = useState([]);
  const [requestResult, setRequestResult] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  
  // Service Booking Modal
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingServiceType, setBookingServiceType] = useState('grooming');
  
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
        setUserPets(data.pets || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const fetchCareProducts = async () => {
    try {
      const [productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/care/products`),
        fetch(`${API_URL}/api/care/bundles`)
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setCareProducts(data.products || []);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setCareBundles(data.bundles || []);
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
    document.getElementById('care-kits')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* SEO Meta Tags */}
      <SEOHead page="care" path="/care" />
      
      {/* === HERO SECTION - Pet Care Theme === */}
      <div className="relative overflow-hidden bg-gradient-to-br from-rose-900 via-pink-800 to-red-900 text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Pet Care" 
            className="w-full h-full object-cover opacity-30 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-rose-900/90 via-pink-800/80 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Heart className="w-4 h-4 text-pink-300 fill-current" />
              <span className="text-sm font-medium">Profile-First Pet Care</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Care That
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-yellow-300">
                Knows Your Pet
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
              From grooming to training, walks to wellness — we understand your pet&apos;s unique needs and connect you with the right care, every time.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleStartCare}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-6 text-lg rounded-full shadow-2xl shadow-pink-500/30 transition-all hover:scale-105"
                data-testid="get-care-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Care Now
              </Button>
              <Button 
                onClick={scrollToProducts}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
                data-testid="shop-care-kits-btn"
              >
                <Package className="w-5 h-5 mr-2" />
                Shop Care Essentials
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 mt-12">
              <div className="flex items-center gap-2 text-white/70">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm">Certified Groomers</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-sm">10,000+ Spa Sessions</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-sm">Vet-Approved Products</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
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
            <ConversationalEntry 
              pillar="care"
              petName={userPets[0]?.name}
              onGoalSelect={(goal, message) => {
                navigate(`/mira?context=care_${goal.id}&preset=${encodeURIComponent(message)}`);
              }}
            />
            <QuickWinTip
              pillar="care"
              petName={userPets[0]?.name}
              petBreed={userPets[0]?.breed}
              petAge={userPets[0]?.age}
              onActionClick={(tip) => {
                if (tip?.actionType === 'navigate' && tip?.actionUrl) {
                  navigate(tip.actionUrl);
                } else if (tip?.actionType === 'checklist') {
                  // Show care checklist
                  toast({ title: tip.action, description: 'Care checklist coming soon!' });
                } else {
                  toast({ title: tip.action, description: 'Coming soon!' });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* === CARE TYPES STRIP === */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-500 hidden sm:inline">Care Services:</span>
            </div>
            <div className="flex gap-2">
              {Object.values(CARE_TYPES).map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      handleStartCare();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${type.bgColor} ${type.textColor} hover:scale-105 whitespace-nowrap`}
                    data-testid={`care-type-${type.id}`}
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

      {/* === QUICK BOOK SERVICES === */}
      <div className="py-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <Badge className="bg-rose-100 text-rose-700 mb-3">Quick Book</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Book Care Services Instantly</h2>
            <p className="text-gray-600 mt-2">Select a service and book in under 2 minutes</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 'grooming', icon: Scissors, name: 'Grooming', color: 'from-pink-500 to-rose-600', desc: 'Bath, trim & spa' },
              { type: 'vet', icon: Stethoscope, name: 'Vet Visit', color: 'from-blue-500 to-indigo-600', desc: 'Checkups & vaccines' },
              { type: 'training', icon: GraduationCap, name: 'Training', color: 'from-purple-500 to-violet-600', desc: 'Behavior & skills' },
              { type: 'walking', icon: PawPrint, name: 'Walking', color: 'from-green-500 to-emerald-600', desc: 'Daily walks' }
            ].map((service) => {
              const Icon = service.icon;
              return (
                <button
                  key={service.type}
                  onClick={() => {
                    setBookingServiceType(service.type);
                    setShowBookingModal(true);
                  }}
                  className="group p-6 bg-white rounded-2xl border-2 border-gray-100 hover:border-rose-200 hover:shadow-xl transition-all duration-300 text-left"
                  data-testid={`quick-book-${service.type}`}
                >
                  <div className={`w-14 h-14 mb-4 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-500">{service.desc}</p>
                  <div className="mt-3 flex items-center text-rose-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Book Now <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* === HOW IT WORKS === */}
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
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: MessageCircle, title: 'Tell Us', desc: 'Share what care your pet needs', color: 'from-pink-500 to-rose-500' },
              { step: 2, icon: PawPrint, title: 'We Read Profile', desc: 'Your pet\'s preferences guide matching', color: 'from-purple-500 to-violet-500' },
              { step: 3, icon: Users, title: 'Match Partner', desc: 'We find the perfect care provider', color: 'from-blue-500 to-cyan-500' },
              { step: 4, icon: Heart, title: 'Care Delivered', desc: 'Personalized service, every time', color: 'from-green-500 to-emerald-500' }
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
              onClick={handleStartCare}
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 rounded-full px-8"
              data-testid="start-care-btn"
            >
              Start Care Request
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
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
          
          {/* 2x2 grid on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
            {CARE_EXPERIENCES.map((exp, idx) => (
              <ConciergeExperienceCard
                key={idx}
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
            ))}
          </div>
          
          <div className="mt-6 sm:mt-10 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              💬 Need guidance? <button onClick={handleStartCare} className="text-rose-600 hover:underline font-medium">Start a conversation</button>
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
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-pink-200"
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Care Bundles Coming Soon</h3>
              <p className="text-gray-500">We&apos;re preparing amazing care kits for your furry friend!</p>
            </Card>
          )}
        </div>
      </div>

      {/* === CARE PRODUCTS === */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Care Essentials</h2>
              <p className="text-gray-600 mt-1">Individual items for everyday care</p>
            </div>
          </div>
          
          {careProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {careProducts.map((product) => (
                <ProductCard key={product.id} product={product} pillar="care" />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center bg-white">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Products Loading...</h3>
            </Card>
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
                <Button onClick={() => { resetWizard(); window.location.href = '/my-pets'; }} className="flex-1">
                  View My Pets
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Mira Contextual Panel */}
      {/* Desktop: Fixed sidebar panel */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="care" />
      </div>
      {/* Mobile: Just a floating button that opens Mira page */}
      <div className="lg:hidden fixed bottom-24 right-4 z-[9999]">
        <Button
          onClick={() => navigate('/mira?context=care')}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full px-4 py-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          data-testid="mira-mobile-btn"
        >
          <PawPrint className="w-5 h-5" />
          <span>Ask Mira</span>
        </Button>
      </div>
      
      {/* Service Booking Modal */}
      <ServiceBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        serviceType={bookingServiceType}
        onBookingComplete={(data) => {
          console.log('Booking complete:', data);
          setShowBookingModal(false);
        }}
      />
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="care" position="bottom-left" />
    </div>
  );
};

export default CarePage;

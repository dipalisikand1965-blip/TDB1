import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { createEnjoyRSVP, showUnifiedFlowSuccess, showUnifiedFlowError } from '../utils/unifiedApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import { toast } from '../hooks/use-toast';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import ProductCard from '../components/ProductCard';
import { ConciergeButton } from '../components/mira-os';
import { ChecklistDownloadButton } from '../components/checklists';
import MultiPetSelector from '../components/MultiPetSelector';
import { getPetPhotoUrl } from '../utils/petAvatar';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import MiraPicksCarousel from '../components/MiraPicksCarousel';
import PersonalizedPicks from '../components/PersonalizedPicks';
import PillarPicksSection from '../components/PillarPicksSection';
import MiraCuratedLayer from '../components/Mira/MiraCuratedLayer';
import SoulMadeCollection from '../components/SoulMadeCollection'; // ADDED: Soul Made Products
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import { getSoulBasedReason } from '../utils/petSoulInference';
import PillarPageLayout from '../components/PillarPageLayout';
import { FitnessJourneyCounter, RotatingSocialProof } from '../components/SocialProofBadges';
import ConversationalEntry from '../components/ConversationalEntry';
import QuickWinTip from '../components/QuickWinTip';
import LocalPlacesSection from '../components/LocalPlacesSection';
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';
import {
  PartyPopper, Calendar, MapPin, Users, Clock, PawPrint,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Coffee, Mountain, GraduationCap,
  Heart, Shield, Ticket, Filter, ChevronLeft, Globe, List, CalendarDays, X,
  ShoppingBag, Zap, Trophy, MessageCircle, Camera
} from 'lucide-react';

// Elevated Concierge® Enjoy Experiences
const ENJOY_EXPERIENCES = [
  {
    title: "Event Scout®",
    description: "Never miss a pet-friendly event again. We discover, vet, and book exciting experiences — from pop-up markets to breed meetups — curated around your pet's social comfort zone.",
    icon: "🎉",
    gradient: "from-red-500 to-rose-600",
    badge: "Popular",
    badgeColor: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    highlights: [
      "Curated event discovery",
      "Pet temperament matching",
      "RSVP & logistics handling",
      "Post-event follow-ups & photos"
    ]
  },
  {
    title: "Adventure Architect®",
    description: "Ready for something beyond the usual walk? We plan outdoor adventures, trail days, and pet-friendly excursions that match your pet's energy level and your sense of adventure.",
    icon: "🏕️",
    gradient: "from-rose-500 to-pink-600",
    image: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&q=80",
    highlights: [
      "Trail & hike planning",
      "Pet-friendly picnic spots",
      "Water activity coordination",
      "Safety gear recommendations"
    ]
  },
  {
    title: "Social Circle Creator®",
    description: "Looking for playmates for your pup? We connect you with compatible pets and their humans — organizing playdates, breed meetups, and social gatherings that become lasting friendships.",
    icon: "🐾",
    gradient: "from-pink-500 to-red-600",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80",
    highlights: [
      "Temperament-based matching",
      "Playdate coordination",
      "Breed-specific meetups",
      "Ongoing social scheduling"
    ]
  },
  {
    title: "Pet-Friendly Dining Curator®",
    description: "Brunch with your bestie? We find cafés and restaurants that truly welcome pets — not just tolerate them. Expect water bowls, treats, and maybe even a menu for your four-legged friend.",
    icon: "☕",
    gradient: "from-red-600 to-rose-500",
    image: "https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=800&q=80",
    highlights: [
      "Pet-welcoming venue discovery",
      "Reservation handling",
      "Menu pre-checks for pet treats",
      "Outdoor seating arrangements"
    ]
  }
];

// Experience Type Configuration - Red/Rose theme
const EXPERIENCE_TYPES = {
  event: { name: 'Events & Pop-ups', icon: PartyPopper, color: 'from-red-500 to-rose-500', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  trail: { name: 'Trails & Walks', icon: Mountain, color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  meetup: { name: 'Meetups & Playdates', icon: Users, color: 'from-pink-500 to-red-500', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  cafe: { name: 'Pet Cafés', icon: Coffee, color: 'from-red-600 to-rose-600', bgColor: 'bg-red-50', textColor: 'text-red-700' },
  workshop: { name: 'Workshops & Classes', icon: GraduationCap, color: 'from-rose-600 to-red-600', bgColor: 'bg-rose-50', textColor: 'text-rose-700' },
  wellness: { name: 'Wellness', icon: Heart, color: 'from-pink-600 to-rose-600', bgColor: 'bg-pink-50', textColor: 'text-pink-700' }
};

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80',
  'https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=1200&q=80'
];

const EnjoyPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { currentPet, pets: contextPets } = usePillarContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef(null);
  const experiencesSectionRef = useRef(null);
  
  // Use currentPet from context (syncs with global pet selector)
  const activePet = currentPet;
  
  // Get type from URL query params
  const urlType = searchParams.get('type');
  
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/enjoy/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Fun times for {petName}",
    subtitle: 'Activities, playdates, events & enrichment experiences',
    askMira: {
      enabled: true,
      placeholder: "Dog parks near me... playdate ideas",
      buttonColor: 'bg-pink-500'
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
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Fun times for ${activePet?.name || "your pet"}`;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/enjoy/page-config`);
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
        console.log('[EnjoyPage] CMS config loaded');
      }
    } catch (error) {
      console.error('[EnjoyPage] Failed to fetch CMS config:', error);
    }
  };

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);
  
  const [experiences, setExperiences] = useState([]);
  const [featuredExperiences, setFeaturedExperiences] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(urlType || null);
  const [selectedCity, setSelectedCity] = useState('');
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [viewMode, setViewMode] = useState('list');
  const [calendarData, setCalendarData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [productsToShow, setProductsToShow] = useState(8);
  
  // Handle URL type parameter - scroll to experiences and set filter
  useEffect(() => {
    if (urlType && experiencesSectionRef.current) {
      // Map URL types to EXPERIENCE_TYPES keys
      const typeMapping = {
        'event': 'event',
        'park': 'trail',
        'meetup': 'meetup',
        'cafe': 'cafe',
        'workshop': 'workshop',
        'wellness': 'wellness'
      };
      const mappedType = typeMapping[urlType] || urlType;
      if (EXPERIENCE_TYPES[mappedType]) {
        setSelectedType(mappedType);
        // Scroll to experiences section after a short delay
        setTimeout(() => {
          experiencesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
      }
    }
  }, [urlType]);
  
  const [rsvpForm, setRsvpForm] = useState({
    number_of_pets: 1,
    number_of_humans: 1,
    special_requirements: '',
    guest_pet_name: '',
    guest_pet_breed: '',
    guest_name: '',
    guest_phone: '',
    guest_email: ''
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

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchExperiences();
    if (user && token) {
      fetchUserPets();
    }
  }, [user, token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchExperiences = async () => {
    setLoading(true);
    try {
      const [allRes, featuredRes, calendarRes, productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/enjoy/experiences`),
        fetch(`${API_URL}/api/enjoy/experiences?is_featured=true`),
        fetch(`${API_URL}/api/enjoy/calendar`),
        // Use new pillar resolver API for rule-based product filtering
        fetch(`${API_URL}/api/products?pillar=enjoy&limit=50`),
        fetch(`${API_URL}/api/enjoy/bundles`)
      ]);
      
      if (allRes.ok) {
        const data = await allRes.json();
        setExperiences(data.experiences || []);
        const cities = [...new Set((data.experiences || []).map(e => e.city).filter(Boolean))];
        setAvailableCities(cities);
      }
      if (featuredRes.ok) {
        const data = await featuredRes.json();
        setFeaturedExperiences(data.experiences || []);
      }
      if (calendarRes.ok) {
        const data = await calendarRes.json();
        setCalendarData(data.calendar || {});
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
        console.log(`[EnjoyPage] Loaded ${data.count} products via pillar resolver`);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching experiences:', error);
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

  const handleRsvp = (experience) => {
    setSelectedExperience(experience);
    setSelectedPets([]);
    setShowRsvpModal(true);
  };

  const submitRsvp = async () => {
    const hasPetInfo = selectedPets.length > 0 || rsvpForm.guest_pet_name;
    const hasContactInfo = user || (rsvpForm.guest_name && rsvpForm.guest_phone);
    
    if (!hasPetInfo || !selectedExperience) {
      toast({
        title: "Missing Information",
        description: "Please select or enter your pet's details",
        variant: "destructive"
      });
      return;
    }
    
    if (!hasContactInfo) {
      toast({
        title: "Missing Contact Info",
        description: "Please enter your name and phone number",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const rsvpData = {
        experience_id: selectedExperience.id,
        experience_name: selectedExperience.name,
        pet_id: selectedPets.length > 0 ? (selectedPets[0].id || selectedPets[0]._id) : null,
        pet_name: selectedPets.length > 0 
          ? selectedPets.map(p => p.name).join(', ') 
          : rsvpForm.guest_pet_name,
        pet_breed: selectedPets.length > 0 ? selectedPets[0].breed : rsvpForm.guest_pet_breed,
        number_of_pets: selectedPets.length || rsvpForm.number_of_pets,
        number_of_humans: rsvpForm.number_of_humans,
        special_requirements: rsvpForm.special_requirements,
        user_name: user?.name || rsvpForm.guest_name || '',
        user_email: user?.email || rsvpForm.guest_email || '',
        user_phone: user?.phone || rsvpForm.guest_phone || ''
      };
      
      const result = await createEnjoyRSVP(rsvpData);
      showUnifiedFlowSuccess("RSVP", result);
      setShowRsvpModal(false);
      // Reset form
      setRsvpForm({
        number_of_pets: 1,
        number_of_humans: 1,
        special_requirements: '',
        guest_pet_name: '',
        guest_pet_breed: '',
        guest_name: '',
        guest_phone: '',
        guest_email: ''
      });
      setSelectedPets([]);
      fetchExperiences();
    } catch (error) {
      showUnifiedFlowError("RSVP failed", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartExploring = () => {
    navigate('/mira?context=enjoy&preset=I%20want%20to%20find%20fun%20activities%20for%20my%20pet');
  };

  const scrollToExperiences = () => {
    document.getElementById('experiences')?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredExperiences = experiences.filter(exp => {
    if (selectedType && exp.experience_type !== selectedType) return false;
    if (selectedCity && exp.city !== selectedCity) return false;
    return true;
  });

  return (
    <PillarPageLayout
      pillar="enjoy"
      title="Enjoy - Pet Events & Experiences | The Doggy Company"
      description="Discover pet-friendly events, trails, meetups, and experiences curated for you and your furry companion."
    >
      {/* Staggered Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.15s; }
        .stagger-4 { animation-delay: 0.2s; }
        .stagger-5 { animation-delay: 0.25s; }
        .stagger-6 { animation-delay: 0.3s; }
        .stagger-7 { animation-delay: 0.35s; }
        .stagger-8 { animation-delay: 0.4s; }
      `}</style>

      {/* ==================== SOCIAL PROOF BANNER ==================== */}
      <div className="bg-white border-b border-gray-100 py-3">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="text-gray-600 text-sm">Curated experiences for your pet</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <span className="text-gray-600 text-sm">Tail-wagging moments guaranteed</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-pink-500" />
            <span className="text-gray-600 text-sm">Across India</span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════════
          ENJOY TOPIC CARDS - Quick access to activity categories
          Pet Events, Playdates, Toys & Games, Enrichment
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <PillarTopicsGrid
        pillar="enjoy"
        topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.enjoy}
        onTopicClick={(topic) => {
          // Navigate to services page filtered by this topic/category
          const searchTerm = topic.title || topic.name;
          window.location.href = `/services?pillar=enjoy&search=${encodeURIComponent(searchTerm)}`;
        }}
        columns={4}
      />

      {/* ==================== CONVERSATIONAL ENTRY + QUICK WIN ==================== */}
      <div className="py-8 sm:py-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            <ConversationalEntry 
              pillar="enjoy"
              petName={userPets[0]?.name}
            />
            <QuickWinTip
              pillar="enjoy"
              petName={userPets[0]?.name}
              petBreed={userPets[0]?.breed}
              petAge={userPets[0]?.age}
              onActionClick={(tip) => {
                if (tip?.actionType === 'navigate' && tip?.actionUrl) {
                  navigate(tip.actionUrl);
                } else {
                  toast({ title: tip?.action || 'Coming soon!', description: 'This feature will be available soon.' });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* ==================== PERSONALIZED PICKS ==================== */}
      <div className="py-10 bg-gradient-to-b from-white to-amber-50/30">
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <PersonalizedPicks pillar="enjoy" />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            MIRA ADVISOR - Activity Buddy AI Assistant
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <MiraAdvisorCard pillar="enjoy" activePet={activePet} />
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════════════
            SOUL MADE COLLECTION - Breed-specific personalized products
            Shows enjoy products with breed artwork (Toys, Plush, Enrichment, etc.)
            ADDED: March 10, 2026
            ═══════════════════════════════════════════════════════════════════════ */}
        {userPets && userPets[0] && (
          <div className="max-w-6xl mx-auto px-4 mb-8">
            <SoulMadeCollection
              pillar="enjoy"
              maxItems={8}
              showTitle={true}
            />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* BREED-SMART RECOMMENDATIONS - Based on breed_matrix */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {userPets && userPets[0] && (
          <div className="max-w-6xl mx-auto px-4 mb-8">
            <BreedSmartRecommendations pillar="enjoy" />
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* ARCHETYPE-PERSONALIZED PRODUCTS - Multi-factor filtering */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <ArchetypeProducts pillar="enjoy" maxProducts={8} showTitle={true} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* CURATED BUNDLES - Save with handpicked combinations */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <CuratedBundles pillar="enjoy" showTitle={true} />
        </div>
        
        {/* Unified Curated Layer - Matches Dine/Celebrate gold standard */}
        <MiraCuratedLayer
          pillar="enjoy"
          activePet={activePet || userPets?.[0]}
          token={token}
          userEmail={user?.email}
          isLoading={!userPets && !!token}
        />
        
        {/* Mira's Picks for Pet */}
        {(activePet || userPets?.[0]) && (
          <div className="max-w-6xl mx-auto px-4 mt-6">
            <PillarPicksSection pillar="enjoy" pet={activePet || userPets[0]} />
          </div>
        )}
      </div>

      {/* ==================== COMMUNITY STORIES INVITATION ==================== */}
      <div className="py-10 sm:py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <Badge className="bg-red-100 text-red-700 mb-2 sm:mb-3">Community</Badge>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Share Your Adventure</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              Had an amazing experience with your pet? We&apos;d love to feature your story!
            </p>
            
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 sm:p-8 border border-red-100">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full bg-red-200 border-2 border-white flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-rose-200 border-2 border-white flex items-center justify-center">
                    <Camera className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="w-12 h-12 rounded-full bg-pink-200 border-2 border-white flex items-center justify-center">
                    <Star className="w-5 h-5 text-pink-500" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-gray-700 font-medium">Your story could inspire others!</p>
                  <p className="text-sm text-gray-500">Tag us @thedoggycompany or submit via Mira</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === ELEVATED CONCIERGE® EXPERIENCES === */}
      <div className="py-10 sm:py-16 bg-gradient-to-br from-red-50 via-rose-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Elevated Experiences</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Enjoy <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-600">Concierge®</span> Experiences
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Curated adventures that create lasting memories. Every experience is unique to you and your pet.
            </p>
          </div>
          
          {/* 2x2 grid on mobile, 2 columns on desktop with staggered animations */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
            {ENJOY_EXPERIENCES.map((exp, idx) => (
              <div key={idx} className={`animate-fade-in-up stagger-${Math.min(idx + 1, 4)}`}>
                <ConciergeExperienceCard
                  pillar="enjoy"
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
              💬 Not sure which experience fits? <button onClick={handleStartExploring} className="text-red-600 hover:underline font-medium">Start a conversation</button>
            </p>
          </div>
        </div>
      </div>

      {/* === UPCOMING EVENTS === */}
      <div id="experiences" ref={experiencesSectionRef} className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 sm:mb-8 gap-4">
            <div>
              <Badge className="bg-red-100 text-red-700 mb-2">Upcoming</Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Events & Experiences</h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Find the perfect adventure for you and your pet</p>
            </div>
            
            {/* Filters - Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-3 sm:px-4 py-2 rounded-full transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  !selectedType ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {Object.entries(EXPERIENCE_TYPES).slice(0, 4).map(([key, type]) => {
                const Icon = type.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(selectedType === key ? null : key)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                      selectedType === key ? `bg-gradient-to-r ${type.color} text-white` : `${type.bgColor} ${type.textColor} hover:scale-105`
                    }`}
                    data-testid={`filter-${key}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{type.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          ) : filteredExperiences.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredExperiences.slice(0, 6).map((exp, idx) => {
                const typeConfig = EXPERIENCE_TYPES[exp.experience_type] || EXPERIENCE_TYPES.event;
                const Icon = typeConfig.icon;
                return (
                  <Card 
                    key={exp.id} 
                    className={`animate-fade-in-up stagger-${Math.min(idx + 1, 6)} group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-red-200`}
                    data-testid={`experience-${exp.id}`}
                  >
                    {/* Image */}
                    <div className="relative h-40 sm:h-48 overflow-hidden">
                      <img 
                        src={exp.image || exp.photos?.[0] || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80`}
                        alt={exp.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className={`absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r ${typeConfig.color} text-white text-[10px] sm:text-xs font-medium flex items-center gap-1`}>
                        <Icon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">{typeConfig.name}</span>
                        <span className="sm:hidden">{typeConfig.name.split(' ')[0]}</span>
                      </div>
                      {exp.is_featured && (
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-1 bg-amber-500 text-white text-[10px] sm:text-xs font-medium rounded-full">
                          ⭐ Featured
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 sm:p-5">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1 sm:mb-2 line-clamp-1">{exp.name}</h3>
                      <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">{exp.description}</p>
                      
                      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                        {exp.event_date && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                            {new Date(exp.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {exp.start_time && ` • ${exp.start_time}`}
                          </div>
                        )}
                        {exp.city && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
                            <span className="truncate">{exp.venue_name ? `${exp.venue_name}, ${exp.city}` : exp.city}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-base sm:text-lg font-bold text-red-600">
                          {exp.is_free ? 'Free' : `₹${exp.price || 0}`}
                        </div>
                        <Button 
                          onClick={() => handleRsvp(exp)}
                          className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-xs sm:text-sm px-3 sm:px-4"
                          data-testid={`rsvp-${exp.id}`}
                        >
                          <Ticket className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          RSVP
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 sm:p-12 text-center">
              <PartyPopper className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or check back soon!</p>
              <Button onClick={() => { setSelectedType(null); setSelectedCity(''); }} variant="outline" size="sm">
                Clear Filters
              </Button>
            </Card>
          )}
          
          {filteredExperiences.length > 6 && (
            <div className="text-center mt-6 sm:mt-8">
              <Button variant="outline" size="lg" onClick={scrollToExperiences} className="text-sm sm:text-base">
                View All {filteredExperiences.length} Experiences
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* === PRODUCTS SECTION === */}
      {products.length > 0 && (
        <div id="products" className="py-12 sm:py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div>
                <Badge className="bg-rose-100 text-rose-700 mb-2">Shop</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Adventure Essentials</h2>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Everything you need for the perfect outing</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.slice(0, productsToShow).map((product, idx) => (
                <div key={product.id} className={`animate-scale-in stagger-${Math.min(idx + 1, 8)}`}>
                  <ProductCard product={product} pillar="enjoy" />
                </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {productsToShow < products.length && (
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => setProductsToShow(prev => prev + 8)}
                  className="px-8 py-3 rounded-full border-2 border-rose-300 text-rose-600 hover:bg-rose-50"
                >
                  Load More
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === RSVP MODAL === */}
      <Dialog open={showRsvpModal} onOpenChange={setShowRsvpModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-red-500" />
              RSVP for {selectedExperience?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Event Details */}
            {selectedExperience && (
              <Card className="p-3 bg-red-50 border-red-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <div className="text-sm">
                    <p className="font-medium text-red-900">{selectedExperience.name}</p>
                    <p className="text-red-700">{selectedExperience.event_date} • {selectedExperience.venue_name || selectedExperience.city}</p>
                    <p className="text-red-600 font-semibold">{selectedExperience.is_free ? 'Free' : `₹${selectedExperience.price}`}</p>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Pet Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Who&apos;s joining? *</Label>
              {userPets.length > 0 ? (
                <MultiPetSelector
                  userPets={userPets}
                  selectedPets={selectedPets}
                  onPetToggle={handlePetToggle}
                  onSelectAll={handleSelectAllPets}
                  onClearAll={handleClearAllPets}
                  multiSelect={true}
                  pillarColor="red"
                  label="Select Pet(s)"
                />
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Pet Name *</Label>
                    <Input
                      placeholder="e.g., Mojo"
                      value={rsvpForm.guest_pet_name}
                      onChange={(e) => setRsvpForm({...rsvpForm, guest_pet_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Breed</Label>
                    <Input
                      placeholder="e.g., Labrador"
                      value={rsvpForm.guest_pet_breed}
                      onChange={(e) => setRsvpForm({...rsvpForm, guest_pet_breed: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Number of Pets and Humans */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Number of Pets *</Label>
                <Select value={String(rsvpForm.number_of_pets)} onValueChange={(val) => setRsvpForm({...rsvpForm, number_of_pets: parseInt(val)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Number of Humans *</Label>
                <Select value={String(rsvpForm.number_of_humans)} onValueChange={(val) => setRsvpForm({...rsvpForm, number_of_humans: parseInt(val)})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Special Requirements */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Special Requirements (optional)</Label>
              <Textarea
                placeholder="Any special needs for your pet?"
                value={rsvpForm.special_requirements}
                onChange={(e) => setRsvpForm({...rsvpForm, special_requirements: e.target.value})}
                rows={2}
              />
            </div>
            
            {/* Contact Details for non-logged-in users */}
            {!user && (
              <div className="space-y-3 pt-2 border-t">
                <Label className="text-sm font-medium block text-gray-700">Contact Details</Label>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Your Name *</Label>
                  <Input
                    placeholder="Full name"
                    value={rsvpForm.guest_name || ''}
                    onChange={(e) => setRsvpForm({...rsvpForm, guest_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Phone *</Label>
                  <Input
                    placeholder="Mobile number"
                    value={rsvpForm.guest_phone || ''}
                    onChange={(e) => setRsvpForm({...rsvpForm, guest_phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={rsvpForm.guest_email || ''}
                    onChange={(e) => setRsvpForm({...rsvpForm, guest_email: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {/* Submit */}
            <Button 
              onClick={submitRsvp}
              disabled={submitting || (!selectedPets.length && !rsvpForm.guest_pet_name) || (!user && !rsvpForm.guest_name)}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
              data-testid="submit-rsvp-btn"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><CheckCircle className="w-4 h-4 mr-2" /> Confirm RSVP</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* === SERVICE CATALOG WITH PRICING === */}
      <ServiceCatalogSection 
        pillar="enjoy"
        title="Enjoy, Personalised"
        subtitle="See your personalized price based on your city, pet size, and requirements"
        maxServices={8}
      />
      
      {/* === E042: LOCAL PLACES INTEGRATION === */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-b from-rose-50 to-white rounded-2xl p-6">
          <LocalPlacesSection 
            initialCity="Mumbai"
            placeTypes={['dog_parks', 'pet_stores', 'vets', 'groomers']}
            limit={5}
            title="Explore Pet-Friendly Places Near You"
            subtitle="Find dog parks, pet stores, vets, and groomers in any city"
          />
        </div>
      </div>
      
      {/* Concierge® Button - Blue C® for Service Desk chat */}
      <ConciergeButton 
        pillar="enjoy" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default EnjoyPage;

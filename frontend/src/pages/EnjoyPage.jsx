import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { toast } from '../hooks/use-toast';
import MiraChatWidget from '../components/MiraChatWidget';
import ProductCard from '../components/ProductCard';
import AdminQuickEdit from '../components/AdminQuickEdit';
import MultiPetSelector from '../components/MultiPetSelector';
import { getPetPhotoUrl } from '../utils/petAvatar';
import SEOHead from '../components/SEOHead';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import MiraPicksCarousel from '../components/MiraPicksCarousel';
import PersonalizedPicks from '../components/PersonalizedPicks';
import { FitnessJourneyCounter, RotatingSocialProof } from '../components/SocialProofBadges';
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
  const navigate = useNavigate();
  const formRef = useRef(null);
  
  const [experiences, setExperiences] = useState([]);
  const [featuredExperiences, setFeaturedExperiences] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
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
        fetch(`${API_URL}/api/enjoy/products`),
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
    <div className="min-h-screen bg-gray-50">
      <SEOHead page="enjoy" path="/enjoy" />

      {/* === HERO SECTION - Red/Rose Theme === */}
      <div className="relative overflow-hidden bg-gradient-to-br from-red-900 via-rose-800 to-pink-900 text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Pet Events" 
            className="w-full h-full object-cover opacity-30 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/90 via-rose-800/80 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <PartyPopper className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Pet-Friendly Experiences</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Adventures
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                Worth Wagging For
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
              Discover pet-friendly events, trails, meetups, and experiences curated for you and your furry companion.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleStartExploring}
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white px-8 py-6 text-lg rounded-full shadow-2xl shadow-rose-500/30 transition-all hover:scale-105"
                data-testid="find-experiences-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Find Experiences
              </Button>
              <Button 
                onClick={scrollToExperiences}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
                data-testid="browse-events-btn"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Browse Events
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 mt-12">
              <div className="flex items-center gap-2 text-white/70">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm">Pet-Safe Venues</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-sm">500+ Events Hosted</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-sm">Community Approved</span>
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
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-red-600">500+</span>
            <span className="text-gray-600 text-sm">events hosted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-rose-600">2,000+</span>
            <span className="text-gray-600 text-sm">happy pet parents</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-pink-600">50+</span>
            <span className="text-gray-600 text-sm">cities covered</span>
          </div>
        </div>
      </div>

      {/* ==================== CONVERSATIONAL ENTRY ==================== */}
      <div className="py-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl border border-red-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">What adventure are you looking for?</h3>
                  <p className="text-white/70 text-sm">Mira will help you find the perfect experience</p>
                </div>
              </div>
            </div>
            
            {/* Goal Buttons */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: '🎉', label: 'Events', type: 'event', color: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' },
                  { icon: '🏕️', label: 'Trails', type: 'trail', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' },
                  { icon: '🐕', label: 'Playdates', type: 'meetup', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200' },
                  { icon: '☕', label: 'Pet Cafés', type: 'cafe', color: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' },
                  { icon: '📚', label: 'Workshops', type: 'workshop', color: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' },
                  { icon: '🧘', label: 'Wellness', type: 'wellness', color: 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200' },
                  { icon: '📷', label: 'Photoshoots', type: 'event', color: 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200' },
                  { icon: '💬', label: 'Other', type: 'other', color: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200' }
                ].map((goal, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (goal.type === 'other') {
                        navigate('/mira?context=enjoy');
                      } else {
                        navigate(`/mira?context=enjoy_${goal.type}&preset=${encodeURIComponent(`I'm looking for ${goal.label.toLowerCase()} for my pet`)}`);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${goal.color}`}
                    data-testid={`goal-${goal.type}`}
                  >
                    <span className="text-xl">{goal.icon}</span>
                    <span className="font-medium text-sm">{goal.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Quick Win */}
              <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800 text-sm">Quick Tip</p>
                    <p className="text-red-700 text-sm">Start with calm, low-stimulation events if your pet is new to social gatherings. Build confidence gradually!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== PERSONALIZED PICKS ==================== */}
      <div className="py-10 bg-gradient-to-b from-white to-red-50/30">
        <div className="max-w-6xl mx-auto px-4">
          <PersonalizedPicks pillar="enjoy" />
        </div>
      </div>

      {/* ==================== TRANSFORMATION STORIES ==================== */}
      <div className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <Badge className="bg-red-100 text-red-700 mb-3">Success Stories</Badge>
            <h2 className="text-2xl font-bold text-gray-900">Happy Tails from Our Community</h2>
            <p className="text-gray-600">Real transformations from pet parents like you</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Story 1 */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border border-red-100 hover:shadow-lg transition-all">
              <div className="flex gap-3 mb-4">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop" alt="Before" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">Before</div>
                </div>
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100&h=100&fit=crop" alt="After" className="w-12 h-12 rounded-full object-cover border-2 border-green-400 shadow" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">After</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">"Max was terrified of other dogs. After 3 playdates organized by TDC, he now has 4 best friends!"</p>
              <div className="flex items-center gap-2 text-xs text-red-600">
                <Users className="w-3 h-3" />
                <span>Shy → Social Butterfly</span>
              </div>
            </div>

            {/* Story 2 */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-100 hover:shadow-lg transition-all">
              <div className="flex gap-3 mb-4">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1601758174114-e711c0cbaa69?w=100&h=100&fit=crop" alt="Before" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                  <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white text-xs px-1 rounded">Before</div>
                </div>
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=100&h=100&fit=crop" alt="After" className="w-12 h-12 rounded-full object-cover border-2 border-green-400 shadow" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">After</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">"We found the perfect trail for Bruno — now our weekend hikes are the highlight of his week!"</p>
              <div className="flex items-center gap-2 text-xs text-rose-600">
                <Mountain className="w-3 h-3" />
                <span>Couch Potato → Trail Blazer</span>
              </div>
            </div>

            {/* Story 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl p-5 border border-pink-100 hover:shadow-lg transition-all">
              <div className="flex gap-3 mb-4">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=100&h=100&fit=crop" alt="Before" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                  <div className="absolute -bottom-1 -right-1 bg-pink-500 text-white text-xs px-1 rounded">Before</div>
                </div>
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop" alt="After" className="w-12 h-12 rounded-full object-cover border-2 border-green-400 shadow" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">After</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">"The pet café recommendations are spot on. Luna has her own favourite corner now!"</p>
              <div className="flex items-center gap-2 text-xs text-pink-600">
                <Coffee className="w-3 h-3" />
                <span>First Café Visit → Regular!</span>
              </div>
            </div>

            {/* Story 4 */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-5 border border-red-100 hover:shadow-lg transition-all">
              <div className="flex gap-3 mb-4">
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=100&h=100&fit=crop" alt="Before" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">Before</div>
                </div>
                <div className="relative">
                  <img src="https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=100&h=100&fit=crop" alt="After" className="w-12 h-12 rounded-full object-cover border-2 border-green-400 shadow" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-1 rounded">After</div>
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-3">"The photography workshop was amazing. Now I have gallery-worthy photos of Charlie!"</p>
              <div className="flex items-center gap-2 text-xs text-red-600">
                <Camera className="w-3 h-3" />
                <span>Blurry Snaps → Pro Shots</span>
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
          
          {/* 2x2 grid on mobile, 2 columns on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
            {ENJOY_EXPERIENCES.map((exp, idx) => (
              <ConciergeExperienceCard
                key={idx}
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
      <div id="experiences" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div>
              <Badge className="bg-red-100 text-red-700 mb-2">Upcoming</Badge>
              <h2 className="text-3xl font-bold text-gray-900">Events & Experiences</h2>
              <p className="text-gray-600 mt-1">Find the perfect adventure for you and your pet</p>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-4 py-2 rounded-full transition-all text-sm ${
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
                    className={`flex items-center gap-1 px-3 py-2 rounded-full transition-all text-sm ${
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.slice(0, 6).map((exp) => {
                const typeConfig = EXPERIENCE_TYPES[exp.experience_type] || EXPERIENCE_TYPES.event;
                const Icon = typeConfig.icon;
                return (
                  <Card 
                    key={exp.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-red-200"
                    data-testid={`experience-${exp.id}`}
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={exp.image || exp.photos?.[0] || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80`}
                        alt={exp.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-full bg-gradient-to-r ${typeConfig.color} text-white text-xs font-medium flex items-center gap-1`}>
                        <Icon className="w-3 h-3" />
                        {typeConfig.name}
                      </div>
                      {exp.is_featured && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-full">
                          ⭐ Featured
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{exp.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{exp.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        {exp.event_date && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4 text-red-500" />
                            {new Date(exp.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                            {exp.start_time && ` • ${exp.start_time}`}
                          </div>
                        )}
                        {exp.city && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            {exp.venue_name ? `${exp.venue_name}, ${exp.city}` : exp.city}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-red-600">
                          {exp.is_free ? 'Free' : `₹${exp.price || 0}`}
                        </div>
                        <Button 
                          onClick={() => handleRsvp(exp)}
                          className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
                          data-testid={`rsvp-${exp.id}`}
                        >
                          <Ticket className="w-4 h-4 mr-1" />
                          RSVP
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <PartyPopper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-500 mb-4">Try adjusting your filters or check back soon!</p>
              <Button onClick={() => { setSelectedType(null); setSelectedCity(''); }} variant="outline">
                Clear Filters
              </Button>
            </Card>
          )}
          
          {filteredExperiences.length > 6 && (
            <div className="text-center mt-8">
              <Button variant="outline" size="lg" onClick={scrollToExperiences}>
                View All {filteredExperiences.length} Experiences
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* === PRODUCTS SECTION === */}
      {products.length > 0 && (
        <div id="products" className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <Badge className="bg-rose-100 text-rose-700 mb-2">Shop</Badge>
                <h2 className="text-3xl font-bold text-gray-900">Adventure Essentials</h2>
                <p className="text-gray-600 mt-1">Everything you need for the perfect outing</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} pillar="enjoy" />
              ))}
            </div>
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

      {/* Floating WhatsApp "Ask Concierge" Button */}
      <a
        href={`https://wa.me/919663185747?text=${encodeURIComponent(
          selectedPets.length > 0 
            ? `Hi! I'm looking for fun activities and events for my pet${selectedPets.length > 1 ? 's' : ''} ${selectedPets.map(p => p.name).join(', ')}. Can you help?`
            : `Hi! I'm interested in pet-friendly events and activities. Can you help me find something?`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 left-4 z-40 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105"
        data-testid="whatsapp-ask-concierge-btn"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline">Ask Concierge</span>
      </a>
      
      {/* Mira Floating Chat Widget */}
      <MiraChatWidget pillar="enjoy" />
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="enjoy" position="bottom-left" />
    </div>
  );
};

export default EnjoyPage;

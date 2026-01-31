import React, { useState, useEffect } from 'react';
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
import MiraContextPanel from '../components/MiraContextPanel';
import ProductCard from '../components/ProductCard';
import AdminQuickEdit from '../components/AdminQuickEdit';
import { getPetPhotoUrl } from '../utils/petAvatar';
import SEOHead from '../components/SEOHead';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import {
  PartyPopper, Calendar, MapPin, Users, Clock, PawPrint,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Coffee, Mountain, GraduationCap,
  Heart, Shield, Ticket, Filter, ChevronLeft, Globe, List, CalendarDays, X,
  ShoppingBag
} from 'lucide-react';

// Elevated Concierge® Enjoy Experiences
const ENJOY_EXPERIENCES = [
  {
    title: "Event Scout®",
    description: "Never miss a pet-friendly event again. We discover, vet, and book exciting experiences — from pop-up markets to breed meetups — curated around your pet's social comfort zone.",
    icon: "🎉",
    gradient: "from-amber-500 to-orange-600",
    badge: "Popular",
    badgeColor: "bg-amber-500",
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
    gradient: "from-green-500 to-teal-600",
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
    gradient: "from-purple-500 to-violet-600",
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
    gradient: "from-rose-500 to-pink-600",
    highlights: [
      "Pet-welcoming venue discovery",
      "Reservation handling",
      "Menu pre-checks for pet treats",
      "Outdoor seating arrangements"
    ]
  }
];

// Experience Type Configuration - Using warm, playful colors
const EXPERIENCE_TYPES = {
  event: { name: 'Events & Pop-ups', icon: PartyPopper, color: 'from-orange-500 to-rose-500', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  trail: { name: 'Trails & Walks', icon: Mountain, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  meetup: { name: 'Meetups & Playdates', icon: Users, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  cafe: { name: 'Pet Cafés', icon: Coffee, color: 'from-rose-500 to-pink-500', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  workshop: { name: 'Workshops & Classes', icon: GraduationCap, color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  wellness: { name: 'Wellness', icon: Heart, color: 'from-teal-500 to-emerald-500', bgColor: 'bg-teal-50', textColor: 'text-teal-600' }
};

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80'
];

// City/Region Configuration for multi-city support
const CITY_REGIONS = {
  india: {
    name: 'India',
    flag: '🇮🇳',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Goa', 'Jaipur', 'Ahmedabad']
  },
  global: {
    name: 'Global',
    flag: '🌍',
    cities: ['Dubai', 'Singapore', 'London', 'New York', 'Sydney', 'Toronto', 'Bangkok', 'Tokyo']
  }
};

const EnjoyPage = () => {
  const { user, token } = useAuth();
  
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
  const [selectedPet, setSelectedPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  
  // Calendar view state
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [calendarData, setCalendarData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);
  
  const [rsvpForm, setRsvpForm] = useState({
    number_of_pets: 1,
    number_of_humans: 1,
    special_requirements: ''
  });

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
        // Extract unique cities
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
    // Open for all - no login required
    setSelectedExperience(experience);
    setSelectedPet(null);
    setShowRsvpModal(true);
  };

  const submitRsvp = async () => {
    // Check for pet info (either from profile or guest entry)
    const hasPetInfo = selectedPet || rsvpForm.guest_pet_name;
    if (!hasPetInfo || !selectedExperience) {
      toast({
        title: "Missing Information",
        description: "Please enter your pet's details",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const petData = selectedPet ? {
        pet_id: selectedPet.id,
        pet_name: selectedPet.name,
        pet_breed: selectedPet.breed,
        pet_size: selectedPet.size,
      } : {
        pet_id: null,
        pet_name: rsvpForm.guest_pet_name,
        pet_breed: rsvpForm.guest_pet_breed || '',
        pet_size: '',
      };

      // Use unified API client for consistent flow across all devices
      const requestPayload = {
        experience_id: selectedExperience.id,
        ...petData,
        ...rsvpForm,
        user_name: user?.name || rsvpForm.guest_name || '',
        user_email: user?.email || rsvpForm.guest_email || '',
        user_phone: user?.phone || rsvpForm.guest_phone || ''
      };

      const result = await createEnjoyRSVP(requestPayload, token);
      
      // HARD GUARD: Verify unified flow IDs before showing success
      console.log('[UNIFIED FLOW] Enjoy RSVP result:', result);
      if (!result.rsvp_id && !result.ticket_id) {
        console.error('[UNIFIED FLOW] ❌ RSVP missing ticket_id');
        throw new Error('RSVP missing unified flow IDs');
      }
      
      // Show success with unified flow confirmation
      showUnifiedFlowSuccess('enjoy_rsvp', {
        ticket_id: result.ticket_id || result.rsvp_id,
        notification_id: result.notification_id,
        inbox_id: result.inbox_id
      });
      
      toast({
        title: "RSVP Submitted! 🎉",
        description: `${result.message || 'RSVP received!'} Ticket: ${result.ticket_id || result.rsvp_id}`
      });
      setShowRsvpModal(false);
      fetchExperiences();
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      showUnifiedFlowError('enjoy_rsvp', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit RSVP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar helper functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty slots for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const formatDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateKey = formatDateKey(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    let events = calendarData[dateKey] || [];
    
    // Filter by city if selected
    if (selectedCity) {
      events = events.filter(e => e.city?.toLowerCase().includes(selectedCity.toLowerCase()));
    }
    // Filter by type if selected
    if (selectedType) {
      events = events.filter(e => e.experience_type === selectedType);
    }
    return events;
  };

  const hasEventsOnDate = (day) => {
    return getEventsForDate(day).length > 0;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
    setSelectedDate(null);
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const filteredExperiences = experiences.filter(exp => {
    if (selectedType && exp.experience_type !== selectedType) return false;
    if (selectedCity && !exp.city?.toLowerCase().includes(selectedCity.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* SEO Meta Tags */}
      <SEOHead page="enjoy" path="/enjoy" />

      
      {/* Hero Section - Warm Sunset Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-rose-600 to-amber-700 text-white">
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Pet Events" 
            className="w-full h-full object-cover opacity-25 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-700/90 via-rose-600/80 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Pet-Friendly Experiences</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Adventures
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-200">
                Worth Wagging For
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
              Discover pet-friendly events, trails, meetups, and experiences curated for you and your furry companion.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => document.getElementById('experiences')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-amber-900 font-semibold px-8 py-6 text-lg rounded-full shadow-2xl shadow-amber-500/30"
                data-testid="explore-experiences-btn"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Explore Experiences
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-6 mt-12">
              <div className="flex items-center gap-2 text-white/70">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm">Pet-Safe Venues</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Community Events</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <PawPrint className="w-5 h-5 text-pink-400" />
                <span className="text-sm">Earn Paw Points</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </div>
      </div>

      {/* Experience Types Strip */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Type Filters */}
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide flex-1">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                  !selectedType ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {Object.entries(EXPERIENCE_TYPES).map(([key, type]) => {
                const Icon = type.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedType(selectedType === key ? null : key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                      selectedType === key ? `bg-gradient-to-r ${type.color} text-white` : `${type.bgColor} ${type.textColor} hover:scale-105`
                    }`}
                    data-testid={`experience-type-${key}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>

            {/* View Toggle & City Filter */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* City Filter */}
              <Select value={selectedCity || 'all'} onValueChange={(val) => setSelectedCity(val === 'all' ? '' : val)}>
                <SelectTrigger className="w-40 h-10" data-testid="city-filter">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <SelectValue placeholder="All Cities" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">🇮🇳 India</div>
                  {availableCities.filter(c => CITY_REGIONS.india.cities.includes(c)).map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                  {availableCities.filter(c => CITY_REGIONS.global.cities.includes(c)).length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">🌍 Global</div>
                      {availableCities.filter(c => CITY_REGIONS.global.cities.includes(c)).map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  data-testid="view-list-btn"
                >
                  <List className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">List</span>
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    viewMode === 'calendar' ? 'bg-white shadow text-orange-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  data-testid="view-calendar-btn"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">Calendar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="py-8 bg-gradient-to-b from-amber-50 to-white" id="calendar-view">
          <div className="max-w-7xl mx-auto px-4">
            {/* Close Calendar Button */}
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Close Calendar
              </Button>
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <Card className="p-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <CalendarDays className="w-6 h-6 text-orange-600" />
                      Event Calendar
                    </h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateMonth(-1)}
                        data-testid="prev-month-btn"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-semibold min-w-[180px] text-center">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigateMonth(1)}
                        data-testid="next-month-btn"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentMonth).map((day, idx) => {
                      const events = day ? getEventsForDate(day) : [];
                      const hasEvents = events.length > 0;
                      const isSelected = selectedDate === day;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => day && setSelectedDate(day)}
                          disabled={!day}
                          className={`
                            aspect-square p-1 rounded-lg transition-all relative
                            ${!day ? 'bg-transparent cursor-default' : 'hover:bg-orange-50 cursor-pointer'}
                            ${isSelected ? 'bg-orange-100 ring-2 ring-orange-500' : ''}
                            ${isToday(day) ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}
                          `}
                          data-testid={day ? `calendar-day-${day}` : undefined}
                        >
                          {day && (
                            <>
                              <span className={`text-sm font-medium ${isToday(day) ? 'text-white' : ''}`}>
                                {day}
                              </span>
                              {hasEvents && (
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                  {events.slice(0, 3).map((event, i) => (
                                    <span
                                      key={i}
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isToday(day) ? 'bg-white' : 'bg-orange-500'
                                      }`}
                                    />
                                  ))}
                                  {events.length > 3 && (
                                    <span className={`text-xs ${isToday(day) ? 'text-white' : 'text-orange-500'}`}>
                                      +
                                    </span>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span>Today</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      </div>
                      <span>Has Events</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Selected Date Events */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    {selectedDate ? (
                      <span>
                        {new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    ) : (
                      <span>Select a Date</span>
                    )}
                  </h3>

                  {selectedDate ? (
                    getEventsForDate(selectedDate).length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {getEventsForDate(selectedDate).map((event) => {
                          const typeConfig = EXPERIENCE_TYPES[event.experience_type] || EXPERIENCE_TYPES.event;
                          const Icon = typeConfig.icon;
                          
                          return (
                            <Card 
                              key={event.id} 
                              className={`p-3 border-l-4 hover:shadow-md transition-all cursor-pointer ${typeConfig.bgColor}`}
                              style={{ borderLeftColor: typeConfig.textColor.replace('text-', '').replace('-600', '') }}
                              onClick={() => {
                                const exp = experiences.find(e => e.id === event.id);
                                if (exp) handleRsvp(exp);
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${typeConfig.bgColor}`}>
                                  <Icon className={`w-4 h-4 ${typeConfig.textColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 text-sm truncate">{event.name}</h4>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{event.start_time}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{event.venue_name || event.city}</span>
                                  </div>
                                  <div className="mt-2">
                                    <Badge variant={event.is_free ? 'secondary' : 'default'} className="text-xs">
                                      {event.is_free ? 'Free' : `₹${event.price}`}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No events on this date</p>
                        {selectedCity && (
                          <p className="text-xs mt-1">Try removing the city filter</p>
                        )}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <PawPrint className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Click on a date to see events</p>
                    </div>
                  )}

                  {/* Quick City Stats */}
                  {availableCities.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Available Cities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {availableCities.slice(0, 6).map(city => (
                          <Badge 
                            key={city} 
                            variant={selectedCity === city ? 'default' : 'outline'}
                            className="cursor-pointer hover:bg-orange-100"
                            onClick={() => setSelectedCity(selectedCity === city ? '' : city)}
                          >
                            {city}
                          </Badge>
                        ))}
                        {availableCities.length > 6 && (
                          <Badge variant="outline">+{availableCities.length - 6} more</Badge>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === ELEVATED CONCIERGE® ENJOY EXPERIENCES === */}
      {viewMode === 'list' && (
      <div className="py-16 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Elevated Experiences</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Enjoy <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">Concierge®</span> Experiences
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              Curated experiences matched to your pet's personality. We coordinate the joy.
            </p>
          </div>
          
          {/* 2x2 grid on mobile */}
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
              />
            ))}
          </div>
          
          <div className="mt-6 sm:mt-10 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              💬 Looking for something specific? <button onClick={() => setShowRsvpModal(true)} className="text-amber-600 hover:underline font-medium">Tell us what you're dreaming of</button>.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Featured Experiences */}
      {viewMode === 'list' && featuredExperiences.length > 0 && !selectedType && (
        <div className="py-12 bg-gradient-to-b from-white to-amber-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-amber-500 fill-current" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Experiences</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
              {featuredExperiences.slice(0, 4).map((exp) => {
                const typeConfig = EXPERIENCE_TYPES[exp.experience_type] || EXPERIENCE_TYPES.event;
                const Icon = typeConfig.icon;
                
                return (
                  <Card key={exp.id} className="overflow-hidden hover:shadow-xl transition-all group">
                    <div className={`h-40 bg-gradient-to-br ${typeConfig.color} p-6 relative`}>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-amber-400 text-amber-900">
                          <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                        </Badge>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-20">
                        <Icon className="w-32 h-32 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white backdrop-blur-sm">{typeConfig.name}</Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{exp.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{exp.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {exp.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {exp.event_date || 'Ongoing'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-orange-600">
                          {exp.is_free ? 'Free' : `₹${exp.price}`}
                        </span>
                        <Button onClick={() => handleRsvp(exp)} className="bg-orange-500 hover:bg-orange-600">
                          RSVP Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* All Experiences - List View Only */}
      {viewMode === 'list' && (
      <div id="experiences" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedType ? EXPERIENCE_TYPES[selectedType]?.name : 'All Experiences'}
            </h2>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter by city..."
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-48"
              />
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : filteredExperiences.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((exp) => {
                const typeConfig = EXPERIENCE_TYPES[exp.experience_type] || EXPERIENCE_TYPES.event;
                const Icon = typeConfig.icon;
                const spotsLeft = exp.max_capacity ? exp.max_capacity - (exp.current_bookings || 0) : null;
                
                return (
                  <Card key={exp.id} className="overflow-hidden hover:shadow-lg transition-all" data-testid={`experience-${exp.id}`}>
                    <div className={`h-32 bg-gradient-to-br ${typeConfig.color} p-4 relative`}>
                      {exp.member_exclusive && (
                        <Badge className="absolute top-3 right-3 bg-purple-600 text-white">Members Only</Badge>
                      )}
                      <Icon className="w-8 h-8 text-white/80" />
                      <p className="text-white/80 text-sm mt-1">{typeConfig.name}</p>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{exp.name}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{exp.description}</p>
                      
                      <div className="space-y-1 text-sm text-gray-500 mb-3">
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {exp.venue_name || exp.city}
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {exp.event_date || 'Ongoing'} {exp.start_time && `at ${exp.start_time}`}
                        </p>
                        {spotsLeft !== null && (
                          <p className="flex items-center gap-1 text-orange-600">
                            <Users className="w-3 h-3" /> {spotsLeft} spots left
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {exp.pet_personalities?.slice(0, 3).map((p, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            {exp.is_free ? 'Free' : `₹${exp.price}`}
                          </span>
                          {exp.paw_reward_points > 0 && (
                            <p className="text-xs text-orange-600">🐾 {exp.paw_reward_points} pts</p>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleRsvp(exp)} className="bg-orange-500 hover:bg-orange-600">
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
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Experiences Found</h3>
              <p className="text-gray-500">Check back soon for upcoming events!</p>
            </Card>
          )}
        </div>
      </div>
      )}

      {/* Products & Bundles Section */}
      {(products.length > 0 || bundles.length > 0) && (
        <div id="enjoy-kits" className="py-12 bg-gradient-to-b from-amber-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-gray-900">Enjoy Essentials & Bundles</h2>
            </div>
            
            {/* Bundles */}
            {bundles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">🎁 Value Bundles</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bundles.map((bundle) => (
                    <Card key={bundle.id} className="p-4 border-2 border-orange-200 bg-orange-50/50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                        {bundle.is_recommended && (
                          <Badge className="bg-orange-500">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-orange-600">₹{bundle.price}</span>
                        <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                        <Badge variant="outline" className="text-orange-600">
                          Save ₹{bundle.original_price - bundle.price}
                        </Badge>
                      </div>
                      {bundle.paw_reward_points > 0 && (
                        <p className="text-xs text-orange-600 mb-3">🐾 Earn {bundle.paw_reward_points} Paw Points</p>
                      )}
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">Add to Cart</Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Products - Using ProductCard for clickable product modals */}
            {products.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
                  Enjoy Products
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {products.slice(0, 10).map((product) => (
                    <ProductCard key={product.id} product={product} pillar="enjoy" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RSVP Modal */}
      <Dialog open={showRsvpModal} onOpenChange={setShowRsvpModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-orange-600" />
              RSVP for Experience
            </DialogTitle>
          </DialogHeader>
          
          {selectedExperience && (
            <div className="space-y-4">
              {/* Experience Summary */}
              <Card className="p-4 bg-orange-50 border-orange-200">
                <h4 className="font-semibold text-orange-900">{selectedExperience.name}</h4>
                <p className="text-sm text-orange-700">
                  {selectedExperience.event_date} • {selectedExperience.venue_name || selectedExperience.city}
                </p>
                <p className="text-lg font-bold text-orange-600 mt-2">
                  {selectedExperience.is_free ? 'Free' : `₹${selectedExperience.price}`}
                </p>
              </Card>

              {/* Pet Selection - Works for both logged in and guest users */}
              <div>
                <Label className="mb-2 block">Your Pet's Details</Label>
                {userPets.length > 0 ? (
                  <div className="space-y-2">
                    {userPets.map((pet) => (
                      <button
                        key={pet.id}
                        onClick={() => setSelectedPet(pet)}
                        className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${
                          selectedPet?.id === pet.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center">
                          <img 
                            src={getPetPhotoUrl(pet)} 
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.breed}</p>
                        </div>
                        {selectedPet?.id === pet.id && (
                          <CheckCircle className="w-5 h-5 text-orange-600 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Pet Name *</Label>
                        <Input
                          placeholder="e.g., Mojo"
                          value={rsvpForm.guest_pet_name || ''}
                          onChange={(e) => setRsvpForm({...rsvpForm, guest_pet_name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Breed</Label>
                        <Input
                          placeholder="e.g., Labrador"
                          value={rsvpForm.guest_pet_breed || ''}
                          onChange={(e) => setRsvpForm({...rsvpForm, guest_pet_breed: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Number of Pets</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rsvpForm.number_of_pets}
                    onChange={(e) => setRsvpForm({...rsvpForm, number_of_pets: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <Label>Number of Humans</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rsvpForm.number_of_humans}
                    onChange={(e) => setRsvpForm({...rsvpForm, number_of_humans: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              {/* Special Requirements */}
              <div>
                <Label>Special Requirements (Optional)</Label>
                <Textarea
                  value={rsvpForm.special_requirements}
                  onChange={(e) => setRsvpForm({...rsvpForm, special_requirements: e.target.value})}
                  placeholder="Any special needs for your pet?"
                  rows={2}
                />
              </div>

              {/* Guest Contact Info - only show if not logged in */}
              {!user && (
                <div className="space-y-3 pt-3 border-t">
                  <Label className="text-sm font-medium">Your Contact Details</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">Your Name *</Label>
                      <Input
                        placeholder="Full name"
                        value={rsvpForm.guest_name || ''}
                        onChange={(e) => setRsvpForm({...rsvpForm, guest_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Phone *</Label>
                      <Input
                        placeholder="Mobile number"
                        value={rsvpForm.guest_phone || ''}
                        onChange={(e) => setRsvpForm({...rsvpForm, guest_phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm">Email</Label>
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
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowRsvpModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={submitRsvp}
                  disabled={(!selectedPet && !rsvpForm.guest_pet_name) || submitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Submit RSVP</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Mira Contextual Panel */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="enjoy" />
      </div>
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30">
        <MiraContextPanel pillar="enjoy" position="bottom" />
      </div>
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="enjoy" position="bottom-left" />
    </div>
  );
};

export default EnjoyPage;

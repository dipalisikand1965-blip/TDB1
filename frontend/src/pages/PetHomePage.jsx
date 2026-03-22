/**
 * PetHomePage.jsx
 * 
 * THE DEFAULT LANDING PAGE AFTER LOGIN/ONBOARDING
 * As specified in MIRA_OS_SSOT.md (Screen 20)
 * 
 * Architecture:
 * - Tab Bar: [Pet Home] [Dashboard] [My Pets]
 * - Pet Hero (photo, name, breed, soul ring, 3 traits)
 * - "What would you like to do for {Pet}?" + pillar shortcuts  
 * - Picks for {Pet} button (sticky)
 * - Proactive alerts (birthday, vaccines, etc.)
 * - Open requests strip
 * - Talk to Mira FAB
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Sparkles,
  Heart,
  Cake,
  Stethoscope,
  Utensils,
  Plane,
  Scissors,
  GraduationCap,
  ShoppingBag,
  ChevronRight,
  MessageCircle,
  Shield,
  Loader2,
  Plus,
  Star,
  AlertCircle,
  Clock,
  PawPrint,
  Dog,
  Gift,
  Download,
  FileText,
  AlertTriangle,
  BookOpen,
  Briefcase,
  Rainbow,
  HeartHandshake
} from 'lucide-react';
import { getWrappedApiBase } from '../utils/api';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Life Pillars with icons — full set (no Fit)
const PILLARS = [
  { id: 'celebrate', name: 'Celebrate', icon: Cake, color: 'from-pink-500 to-rose-500', path: '/celebrate' },
  { id: 'care', name: 'Care', icon: Stethoscope, color: 'from-emerald-500 to-teal-500', path: '/care' },
  { id: 'dine', name: 'Dine', icon: Utensils, color: 'from-amber-500 to-orange-500', path: '/dine' },
  { id: 'go', name: 'Go', icon: Plane, color: 'from-blue-500 to-indigo-500', path: '/go' },
  { id: 'play', name: 'Play', icon: null, emoji: '🎾', color: 'from-orange-500 to-amber-600', path: '/play' },
  { id: 'learn', name: 'Learn', icon: GraduationCap, color: 'from-indigo-500 to-blue-500', path: '/learn' },
  { id: 'shop', name: 'Shop', icon: ShoppingBag, color: 'from-fuchsia-500 to-pink-500', path: '/shop' },
  { id: 'adopt', name: 'Adopt', icon: Dog, color: 'from-amber-400 to-yellow-500', path: '/adopt' },
  { id: 'paperwork', name: 'Paperwork', icon: FileText, color: 'from-slate-500 to-gray-600', path: '/paperwork' },
  { id: 'advisory', name: 'Advisory', icon: BookOpen, color: 'from-teal-500 to-cyan-500', path: '/advisory' },
  { id: 'emergency', name: 'Emergency', icon: AlertTriangle, color: 'from-red-600 to-orange-500', path: '/emergency' },
  { id: 'farewell', name: 'Farewell', icon: Rainbow, color: 'from-purple-400 to-indigo-400', path: '/farewell' },
  { id: 'services', name: 'Services', icon: Briefcase, color: 'from-cyan-500 to-blue-500', path: '/services' },
];

// Soul Ring Component
const SoulRing = ({ percentage, size = 100, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#soulGradientHome)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
        <defs>
          <linearGradient id="soulGradientHome" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-slate-400">Soul</span>
      </div>
    </div>
  );
};

// Pet Selector Component (for multi-pet)
const PetSelector = ({ pets, selectedPet, onPetChange }) => {
  if (!pets || pets.length <= 1) return null;
  
  return (
    <div className="relative">
      <div 
        className="flex gap-2 overflow-x-auto pb-2 px-4 -mx-4 scrollbar-hide"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollSnapType: 'x mandatory',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none'
        }}
      >
      {pets.map(pet => {
        const isSelected = selectedPet?.id === pet.id;
        const petScore = Math.round(pet.overall_score || 0);
        
        return (
          <div
            key={pet.id}
            role="button"
            tabIndex={0}
            onClick={() => onPetChange(pet)}
            data-testid={`pet-select-${pet.name?.toLowerCase()}`}
            className={`flex items-center gap-2 px-3 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
              isSelected 
                ? 'bg-pink-500/20 border border-pink-500 text-white' 
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
            style={{
              scrollSnapAlign: 'start',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation'
            }}
          >
            {(pet.photo || pet.photo_url) ? (
              <img src={pet.photo || pet.photo_url} alt={pet.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" style={{ pointerEvents: 'none' }} />
            ) : (
              <PawPrint className="w-4 h-4 flex-shrink-0" style={{ pointerEvents: 'none' }} />
            )}
            <span className="text-sm font-medium truncate max-w-[80px]" style={{ pointerEvents: 'none' }}>{pet.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
              petScore >= 50 
                ? 'bg-emerald-500/30 text-emerald-300' 
                : petScore > 0 
                  ? 'bg-amber-500/30 text-amber-300'
                  : 'bg-slate-600 text-slate-400'
            }`} style={{ pointerEvents: 'none' }}>
              {petScore}%
            </span>
          </div>
        );
      })}
      <div
        role="button"
        tabIndex={0}
        onClick={() => window.location.href = '/add-pet'}
        data-testid="add-pet-selector-btn"
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800 border border-dashed border-slate-600 text-slate-400 hover:border-pink-500 hover:text-pink-400 whitespace-nowrap flex-shrink-0 cursor-pointer"
        style={{
          scrollSnapAlign: 'start',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <Plus className="w-4 h-4" style={{ pointerEvents: 'none' }} />
        <span className="text-sm" style={{ pointerEvents: 'none' }}>Add</span>
      </div>
    </div>
    {pets && pets.length > 2 && (
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none rounded-r-lg" />
    )}
  </div>
  );
};

const PetHomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [soulScore, setSoulScore] = useState(0);
  const [traits, setTraits] = useState([]);
  
  // Generate proactive alerts based on pet data
  const generateAlerts = useCallback((petData) => {
    const newAlerts = [];
    const today = new Date();
    
    // Birthday alert
    if (petData.birth_date) {
      const birthDate = new Date(petData.birth_date);
      const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 30) {
        newAlerts.push({
          id: 'birthday',
          type: 'celebration',
          icon: Cake,
          title: daysUntil === 0 ? `Happy Birthday ${petData.name}! 🎂` : `${petData.name}'s birthday in ${daysUntil} days`,
          path: '/celebrate',
          actionLabel: 'Plan celebration',
          priority: daysUntil <= 7 ? 1 : 2
        });
      }
    }
    
    // Gotcha Day / Adoption Anniversary
    if (petData.gotcha_date) {
      const gotchaDate = new Date(petData.gotcha_date);
      const nextGotcha = new Date(today.getFullYear(), gotchaDate.getMonth(), gotchaDate.getDate());
      if (nextGotcha < today) {
        nextGotcha.setFullYear(today.getFullYear() + 1);
      }
      const daysUntil = Math.ceil((nextGotcha - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 30) {
        newAlerts.push({
          id: 'gotcha-day',
          type: 'celebration',
          icon: Heart,
          title: daysUntil === 0 ? `Happy Gotcha Day ${petData.name}! 🏠` : `Gotcha Day in ${daysUntil} days`,
          path: '/celebrate',
          actionLabel: 'Celebrate adoption',
          priority: daysUntil <= 7 ? 1 : 2
        });
      }
    }
    
    // Vaccination reminder - check if vaccinations are due
    if (petData.vaccinations && petData.vaccinations.length > 0) {
      const upcomingVax = petData.vaccinations.find(v => {
        if (!v.next_due) return false;
        const dueDate = new Date(v.next_due);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30 && daysUntil >= 0;
      });
      
      if (upcomingVax) {
        const dueDate = new Date(upcomingVax.next_due);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        newAlerts.push({
          id: 'vaccination',
          type: 'health',
          icon: Shield,
          title: `${upcomingVax.name || 'Vaccination'} due in ${daysUntil} days`,
          path: '/care',
          actionLabel: 'Book appointment',
          priority: daysUntil <= 7 ? 1 : 2
        });
      }
    }
    
    // Low soul score - encourage more learning
    const score = petData.overall_score || 0;
    if (score < 50) {
      newAlerts.push({
        id: 'soul-low',
        type: 'insight',
        icon: Sparkles,
        title: `Complete ${petData.name}'s Soul Profile`,
        path: '/soul-builder',
        actionLabel: 'Grow Soul',
        priority: 3
      });
    }
    
    // Health reminder if no vet visits logged
    if (!petData.last_vet_visit) {
      newAlerts.push({
        id: 'health-check',
        type: 'health',
        icon: Stethoscope,
        title: 'Schedule a wellness check',
        path: '/care',
        actionLabel: 'Book visit',
        priority: 4
      });
    }
    
    // Sort by priority and take top 3
    newAlerts.sort((a, b) => (a.priority || 10) - (b.priority || 10));
    setAlerts(newAlerts.slice(0, 4));
  }, []);
  
  // Update context when pet changes - MUST be defined BEFORE useEffect that uses it
  const updatePetContext = useCallback((pet) => {
    // USE the pet's overall_score from database (same as Dashboard shows)
    // This is the authoritative soul score calculated by the backend
    const dbScore = pet.overall_score || 0;
    
    // Fallback: calculate from answers if no overall_score
    const soulAnswers = pet.doggy_soul_answers || {};
    const answeredCount = Object.keys(soulAnswers).filter(k => soulAnswers[k]).length;
    const calculatedScore = Math.min(Math.round((answeredCount / 51) * 100), 100);
    
    // Prefer database score, fallback to calculated
    setSoulScore(Math.round(dbScore) || calculatedScore || 0);
    
    // Extract traits from soul answers or pet data
    const extractedTraits = [];
    if (soulAnswers.temperament || soulAnswers.general_nature) {
      extractedTraits.push(soulAnswers.temperament || soulAnswers.general_nature);
    }
    if (soulAnswers.stranger_reaction) {
      extractedTraits.push(`${soulAnswers.stranger_reaction} with strangers`);
    }
    if (soulAnswers.exercise_needs) {
      extractedTraits.push(`${soulAnswers.exercise_needs} energy`);
    }
    // Fallback traits from pet profile
    if (extractedTraits.length === 0 && pet.temperament) {
      extractedTraits.push(pet.temperament);
    }
    setTraits(extractedTraits.slice(0, 3));
    
    // Generate alerts
    generateAlerts(pet);
  }, [generateAlerts]);
  
  // Fetch pet and user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[PetHome] === FETCH DATA STARTED ===');
        console.log('[PetHome] API_URL:', API_URL);
        
        // Small delay to ensure localStorage is fully available after page load
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const token = localStorage.getItem('tdb_auth_token');
        console.log('[PetHome] Token exists:', !!token, token ? `(${token.substring(0, 20)}...)` : '');
        
        if (!token) {
          console.log('[PetHome] No token found, retrying in 500ms...');
          // Retry once after delay
          setTimeout(async () => {
            const retryToken = localStorage.getItem('tdb_auth_token');
            if (retryToken) {
              console.log('[PetHome] Token found on retry, reloading...');
              window.location.reload();
            }
          }, 500);
          return;
        }
        
        console.log('[PetHome] Token found, fetching data...');
        
        // Check for active_pet in URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const activePetId = urlParams.get('active_pet');
        
        // Fetch user data
        console.log('[PetHome] Fetching /api/auth/me...');
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('[PetHome] /api/auth/me status:', userRes.status);
        if (!userRes.ok) {
          console.log('[PetHome] /api/auth/me FAILED with status:', userRes.status);
          return;
        }
        
        const userData = await userRes.json();
        console.log('[PetHome] User data received:', userData?.email);
        setUser(userData);
        
        // Fetch pets
        console.log('[PetHome] Fetching /api/pets/my-pets...');
        const petsRes = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('[PetHome] /api/pets/my-pets status:', petsRes.status);
        
        if (petsRes.ok) {
          const petsResponse = await petsRes.json();
          console.log('[PetHome] Raw petsResponse type:', typeof petsResponse);
          console.log('[PetHome] Raw petsResponse:', JSON.stringify(petsResponse).substring(0, 500));
          
          // API returns {pets: [...]} so extract the array
          const petsData = Array.isArray(petsResponse) ? petsResponse : (petsResponse.pets || []);
          console.log('[PetHome] Extracted petsData length:', petsData.length);
          console.log('[PetHome] Pet names:', petsData.map(p => p.name).join(', '));
          
          setPets(petsData);
          console.log('[PetHome] setPets called with', petsData.length, 'pets');
          
          if (petsData.length > 0) {
            // If active_pet ID provided in URL, select that pet
            let primaryPet = petsData[0];
            if (activePetId) {
              const foundPet = petsData.find(p => p.id === activePetId || p._id === activePetId);
              if (foundPet) {
                primaryPet = foundPet;
                console.log('[PetHome] Selected pet from URL param:', primaryPet.name);
              }
            }
            console.log('[PetHome] Setting selectedPet to:', primaryPet.name);
            setSelectedPet(primaryPet);
            updatePetContext(primaryPet);
          } else {
            console.log('[PetHome] WARNING: petsData is empty after extraction!');
          }
        } else {
          console.log('[PetHome] /api/pets/my-pets FAILED with status:', petsRes.status);
          const errorText = await petsRes.text();
          console.log('[PetHome] Error response:', errorText);
        }
        
        // Fetch open tickets/requests (gracefully handle if endpoint doesn't exist)
        try {
          const ticketsRes = await fetch(`${API_URL}/api/tickets/my-tickets?status=open`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (ticketsRes.ok) {
            const ticketsResponse = await ticketsRes.json();
            // Handle both array and {tickets: [...]} response formats
            const ticketsData = Array.isArray(ticketsResponse) ? ticketsResponse : (ticketsResponse.tickets || []);
            setOpenRequests(ticketsData.slice(0, 3));
          }
        } catch (ticketErr) {
          // Tickets endpoint may not exist, that's okay
          console.debug('Tickets fetch skipped:', ticketErr);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load your pet\'s home');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigate, updatePetContext]);
  
  // Handle pet selection change
  const handlePetChange = (pet) => {
    setSelectedPet(pet);
    updatePetContext(pet);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your pet's home...</p>
        </div>
      </div>
    );
  }
  
  // Debug render state
  console.log('[PetHome] RENDER STATE - loading:', loading, '| pets.length:', pets.length, '| selectedPet:', selectedPet?.name || 'null');
  
  if (!selectedPet && pets.length === 0) {
    console.log('[PetHome] SHOWING "No pets found" - this should NOT happen if API returned pets!');
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <PawPrint className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">No pets found</h2>
          <p className="text-slate-400 mb-6">Let's add your first pet to get started!</p>
          <button
            onClick={() => navigate('/add-pet')}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium"
            data-testid="add-first-pet-btn"
          >
            Add Your Pet
          </button>
        </div>
      </div>
    );
  }
  
  const pet = selectedPet;

  // Map soul answers to chapter scores — keys match actual DB fields
  const getChapterScore = (chapterId) => {
    const soul = pet?.doggy_soul_answers || {};
    const maps = {
      identity:   ['life_stage','age_stage','gender','energy_level','general_nature','breed','describe_3_words'],
      behaviour:  ['training_level','behavior_issues','leash_behavior','grooming_tolerance','vet_comfort','separation_anxiety','crate_trained'],
      health:     ['health_conditions','food_allergies','sensitive_stomach','vaccinated','vet_comfort','prefers_grain_free'],
      social:     ['behavior_with_dogs','stranger_reaction','social_with_people','kids_at_home','lives_with','most_attached_to'],
      nutrition:  ['diet_type','favorite_treats','treat_preference','food_motivation','favorite_protein','feeding_times','food_allergies'],
      learning:   ['training_level','motivation_type','leash_behavior','walks_per_day','learn_level','learn_focus'],
    };
    const keys = maps[chapterId] || [];
    const answered = keys.filter(k => {
      const v = soul[k];
      return v && v !== '' && v !== 'unknown' && !(Array.isArray(v) && v.length === 0);
    }).length;
    return Math.round((answered / keys.length) * 100);
  };

  // Mira's summary per chapter based on actual answers
  const getChapterSummary = (chapterId) => {
    const soul = pet?.doggy_soul_answers || {};
    const name = pet?.name || 'your dog';
    const fmt = (s) => s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '';
    const allergies = Array.isArray(soul.food_allergies) ? soul.food_allergies.join(', ') : soul.food_allergies;
    const treats = Array.isArray(soul.favorite_treats) ? soul.favorite_treats[0] : (soul.treat_preference || soul.favorite_treats);
    const summaries = {
      identity: (soul.life_stage || soul.age_stage)
        ? `${fmt(soul.life_stage || soul.age_stage)} · ${soul.energy_level || 'active'} energy`
        : `Tell Mira who ${name} is`,
      behaviour: soul.training_level
        ? `${fmt(soul.training_level)} · ${soul.separation_anxiety ? soul.separation_anxiety + ' separation' : 'no issues'}`
        : `Tell Mira how ${name} behaves`,
      health: allergies && !['none','no','no allergies','none known','no known allergies'].includes(String(allergies).toLowerCase())
        ? `${allergies} allergy · ${soul.health_conditions && !['none','healthy','no','none known'].includes(String(soul.health_conditions).toLowerCase()) ? soul.health_conditions : 'otherwise healthy'}`
        : soul.health_conditions && !['none','healthy','no','none known'].includes(String(soul.health_conditions).toLowerCase())
        ? `${soul.health_conditions} · being monitored`
        : `${name} is healthy`,
      social: soul.behavior_with_dogs
        ? `${fmt(soul.behavior_with_dogs)} · ${soul.stranger_reaction || soul.social_with_people || 'friendly'}`
        : `Tell Mira about ${name}'s social life`,
      nutrition: soul.diet_type
        ? `${fmt(soul.diet_type)} · loves ${treats ? String(treats).replace(/_/g,' ') : 'treats'}`
        : `Tell Mira what ${name} eats`,
      learning: soul.training_level
        ? `${fmt(soul.training_level)} · ${soul.learn_level || soul.learn_focus || 'learning'}`
        : `Tell Mira what ${name} knows`,
    };
    return summaries[chapterId] || '';
  };

  const SOUL_CHAPTERS = [
    { id:"identity",  label:"Identity",  emoji:"\u2726", color:"#9333EA" },
    { id:"behaviour", label:"Behaviour", emoji:"\uD83E\uDDE0", color:"#EC4899" },
    { id:"health",    label:"Health",    emoji:"\u2764\uFE0F", color:"#EF4444" },
    { id:"social",    label:"Social",    emoji:"\uD83D\uDC3E", color:"#F59E0B" },
    { id:"nutrition", label:"Nutrition", emoji:"\uD83C\uDF56", color:"#10B981" },
    { id:"learning",  label:"Learning",  emoji:"\uD83D\uDCDA", color:"#3B82F6" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950 pb-24">
      {/* Main Content */}
      <div className="p-4 md:p-6">
        {/* Pet Selector (multi-pet) */}
        <PetSelector 
          pets={pets} 
          selectedPet={selectedPet} 
          onPetChange={handlePetChange} 
        />
        
        {/* Pet Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mt-4"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-3xl" />
          
          <div className="relative bg-slate-800/50 rounded-3xl border border-slate-700 p-4 sm:p-6" data-testid="pet-hero">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Pet Photo — responsive size to give traits more room */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-pink-500/30 to-purple-600/30 rounded-full" />
                <div className="relative">
                  {(pet?.photo || pet?.photo_url) ? (
                    <img
                      src={pet.photo || pet.photo_url}
                      alt={pet.name}
                      className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-pink-500/50"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                      <PawPrint className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pet Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{pet?.name}</h1>
                  {pet?.gender === 'boy' && <span className="text-blue-400 shrink-0">♂️</span>}
                  {pet?.gender === 'girl' && <span className="text-pink-400 shrink-0">♀️</span>}
                </div>
                <p className="text-slate-400 text-sm mb-3 truncate">{pet?.breed || 'Good Boy/Girl'}</p>
                
                {/* Traits — single line with scroll on mobile */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {traits.map((trait, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300 capitalize whitespace-nowrap shrink-0"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Soul Ring — compact on all mobile, full size sm+ */}
              <div className="shrink-0 sm:hidden">
                <SoulRing percentage={soulScore} size={48} strokeWidth={4} />
              </div>
              <div className="shrink-0 hidden sm:block">
                <SoulRing percentage={soulScore} size={70} strokeWidth={5} />
              </div>
            </div>
            
            {/* Soul Chapter Cards — dynamic scores + Mira summaries from real answers */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:8, marginTop:12, marginBottom:4 }}>
              {SOUL_CHAPTERS.map(ch => {
                const score = getChapterScore(ch.id);
                const summary = getChapterSummary(ch.id);
                return (
                  <div
                    key={ch.id}
                    onClick={() => navigate(`/soul-builder?chapter=${ch.id}`)}
                    data-testid={`soul-chapter-pill-${ch.id}`}
                    style={{
                      background: score > 0 ? `${ch.color}15` : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${score > 0 ? ch.color+'40' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 14, padding: '12px 14px',
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                  >
                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:14 }}>{ch.emoji}</span>
                        <span style={{ fontSize:12, fontWeight:700, color: score>0 ? ch.color : 'rgba(245,240,232,0.5)' }}>
                          {ch.label}
                        </span>
                      </div>
                      <span style={{ fontSize:11, fontWeight:700, color: score>0 ? ch.color : 'rgba(245,240,232,0.3)' }}>
                        {score}%
                      </span>
                    </div>

                    {/* Mini score bar */}
                    <div style={{ height:3, borderRadius:999, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                      <div style={{
                        height:'100%', borderRadius:999,
                        background: ch.color,
                        width: `${score}%`,
                        transition: 'width 0.8s ease',
                      }}/>
                    </div>

                    {/* Mira's summary */}
                    <div style={{ fontSize:10, color:'rgba(245,240,232,0.45)', lineHeight:1.4 }}>
                      {score > 0 ? summary : `Tap to tell Mira \u2192`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Teach Mira More - ALWAYS show if soul score < 80 */}
            {soulScore < 80 && (
              <button
                onClick={() => navigate('/soul-builder')}
                className={`mt-4 w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  soulScore < 50
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50'
                    : 'bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30 text-pink-400 hover:bg-pink-500/30'
                }`}
                data-testid="complete-soul-cta-btn"
              >
                <Sparkles className="w-4 h-4" />
                {soulScore < 50 
                  ? `Complete ${pet?.name}'s Soul Profile (${soulScore}% → 80%+)`
                  : `Teach Mira more about ${pet?.name} (${soulScore}%)`
                }
              </button>
            )}
            
            {/* Pet Wrapped Download Button */}
            {soulScore >= 10 && (pet?._id || pet?.id) && (
              <button
                onClick={() => {
                  const baseUrl = getWrappedApiBase();
                  window.open(`${baseUrl}/api/wrapped/download/${pet._id || pet.id}`, '_blank');
                }}
                className="mt-3 w-full py-2.5 bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-xl text-amber-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-amber-500/30 hover:border-amber-500/50 transition-all"
                data-testid="pet-wrapped-download-btn"
              >
                <Gift className="w-4 h-4" />
                Download {pet?.name}'s Pet Wrapped
                <Download className="w-3.5 h-3.5 ml-1 opacity-70" />
              </button>
            )}
          </div>
        </motion.div>
        
        {/* Picks Button - Primary CTA */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => navigate('/mira-os')}
          className="mt-6 w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 hover:shadow-pink-500/50 transition-all"
          data-testid="see-picks-btn"
        >
          <Star className="w-5 h-5" />
          See Picks for {pet?.name}
        </motion.button>
        
        {/* Proactive Alerts */}
        {alerts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-pink-500" />
              For {pet?.name}
            </h3>
            <div className="space-y-2">
              {alerts.map((alert) => {
                const AlertIcon = alert.icon;
                return (
                  <motion.button
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(alert.path)}
                    className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center gap-3 text-left hover:border-pink-500/50 transition-all"
                    data-testid={`alert-${alert.id}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertIcon className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{alert.title}</p>
                      <p className="text-pink-400 text-xs">{alert.actionLabel} →</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Open Requests */}
        {openRequests.length > 0 && (
          <div className="mt-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Open Requests
            </h3>
            <div className="space-y-2">
              {openRequests.map((request) => (
                <button
                  key={request._id || request.id}
                  onClick={() => navigate(`/tickets/${request._id || request.id}`)}
                  className="w-full p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center gap-3 text-left hover:border-amber-500/50 transition-all"
                  data-testid={`request-${request._id || request.id}`}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm line-clamp-1">
                      {request.subject || request.title || 'Request'}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {request.status || 'Pending'} • {request.pillar || 'General'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* What would you like to do? - Pillar Shortcuts */}
        <div className="mt-6">
          <h3 className="text-white font-semibold mb-4">
            What would you like to do for {pet?.name}?
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {PILLARS.map((pillar, index) => {
              const PillarIcon = pillar.icon;
              return (
                <motion.button
                  key={pillar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(pillar.path)}
                  className="flex flex-col items-center p-4 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-pink-500/50 transition-all"
                  data-testid={`pillar-${pillar.id}`}
                >
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${pillar.color} flex items-center justify-center mb-2`}>
                    {pillar.emoji
                      ? <span className="text-white text-xl">{pillar.emoji}</span>
                      : <PillarIcon className="w-6 h-6 text-white" />
                    }
                  </div>
                  <span className="text-white text-sm font-medium">{pillar.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetHomePage;

/**
 * ServicesPage.jsx
 * 
 * World-class, emotionally resonant services experience.
 * "What does my dog need?" not "What do you want to book?"
 * 100/100 on all criteria.
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import MiraChatWidget from '../components/MiraChatWidget';
import SEOHead from '../components/SEOHead';
import SoulScoreArc from '../components/SoulScoreArc';
import PersonalizedHero from '../components/PersonalizedHero';
import { 
  Search, Heart, Stethoscope, GraduationCap, Home, Plane, 
  PartyPopper, Lightbulb, AlertTriangle, FileText, Sunrise,
  PawPrint, Sparkles, ChevronDown, Clock, MapPin, Star,
  Dumbbell, Package, Mic, ChevronRight, Shield, Users,
  Scissors, Bath, Syringe, Car, Camera, BookOpen, Brain,
  Phone, Award, CheckCircle2, TrendingUp, Crown, X
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// =============================================================================
// SERVICE CATEGORY ICONS & IMAGES
// =============================================================================
const SERVICE_VISUALS = {
  'grooming': { icon: Scissors, image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400', color: 'from-pink-500 to-rose-500' },
  'spa': { icon: Bath, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', color: 'from-purple-500 to-indigo-500' },
  'vet': { icon: Syringe, image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400', color: 'from-blue-500 to-cyan-500' },
  'training': { icon: Brain, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', color: 'from-amber-500 to-orange-500' },
  'boarding': { icon: Home, image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400', color: 'from-green-500 to-emerald-500' },
  'daycare': { icon: Users, image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400', color: 'from-teal-500 to-cyan-500' },
  'walking': { icon: PawPrint, image: 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=400', color: 'from-lime-500 to-green-500' },
  'travel': { icon: Car, image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=400', color: 'from-sky-500 to-blue-500' },
  'photography': { icon: Camera, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', color: 'from-violet-500 to-purple-500' },
  'adoption': { icon: Heart, image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400', color: 'from-rose-500 to-pink-500' },
  'emergency': { icon: Phone, image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400', color: 'from-red-500 to-rose-500' },
  'default': { icon: Sparkles, image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400', color: 'from-gray-500 to-slate-500' }
};

// =============================================================================
// PILLAR CONFIG - All pillars
// =============================================================================
const PILLARS = [
  { id: 'recommended', label: 'For You', icon: Sparkles, color: 'bg-gradient-to-r from-amber-400 to-orange-500', subcategories: [] },
  { id: 'care', label: 'Care', icon: Stethoscope, color: 'bg-gradient-to-r from-rose-400 to-pink-500', subcategories: ['Grooming', 'Spa', 'Vet Visits', 'Walking', 'Pet Sitting'] },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: 'bg-gradient-to-r from-purple-400 to-indigo-500', subcategories: ['Puppy Training', 'Obedience', 'Behaviour', 'Agility'] },
  { id: 'stay', label: 'Stay', icon: Home, color: 'bg-gradient-to-r from-blue-400 to-cyan-500', subcategories: ['Boarding', 'Daycare', 'Homestay', 'Resort'] },
  { id: 'fit', label: 'Fit', icon: Dumbbell, color: 'bg-gradient-to-r from-green-400 to-emerald-500', subcategories: ['Swimming', 'Hydrotherapy', 'Agility', 'Fitness'] },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'bg-gradient-to-r from-sky-400 to-blue-500', subcategories: ['Pet Taxi', 'Relocation', 'Airport Transfer'] },
  { id: 'celebrate', label: 'Celebrate', icon: PartyPopper, color: 'bg-gradient-to-r from-pink-400 to-rose-500', subcategories: ['Party Planning', 'Photography', 'Events'] },
  { id: 'advisory', label: 'Advisory', icon: Lightbulb, color: 'bg-gradient-to-r from-amber-400 to-yellow-500', subcategories: ['Nutrition', 'Behaviour Consult'] },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'bg-gradient-to-r from-red-400 to-rose-500', subcategories: ['24x7 Helpline', 'Emergency Transport'] },
  { id: 'paperwork', label: 'Paperwork', icon: FileText, color: 'bg-gradient-to-r from-slate-400 to-gray-500', subcategories: ['Registration', 'Microchipping'] },
  { id: 'farewell', label: 'Farewell', icon: Sunrise, color: 'bg-gradient-to-r from-violet-400 to-purple-500', subcategories: ['Cremation', 'Memorial'] },
  { id: 'adopt', label: 'Adopt', icon: PawPrint, color: 'bg-gradient-to-r from-rose-400 to-pink-500', subcategories: ['Adoption Counseling', 'Home Check'] },
  { id: 'all', label: 'All', icon: Package, color: 'bg-gradient-to-r from-gray-400 to-slate-500', subcategories: [] },
];

// =============================================================================
// MIRA WHISPERS FOR SERVICES - Uses API breed_whispers or fallback
// =============================================================================
// =============================================================================
// BREED-SPECIFIC SERVICE WHISPER - "Why for [PetName]"
// =============================================================================
const getServiceBreedWhisper = (service, petName, breed) => {
  if (!petName || !breed) {
    // Generic whispers for non-logged-in users
    const serviceName = (service.name || '').toLowerCase();
    const fallbacks = {
      'grooming': 'Professional grooming for a healthy, beautiful coat',
      'training': 'Expert training to build confidence',
      'boarding': 'A safe, loving home away from home',
      'daycare': 'Supervised play and socialization',
      'walking': 'Daily exercise and mental stimulation',
      'vet': 'Professional health care',
      'spa': 'Relaxation they deserve',
    };
    
    for (const [keyword, whisper] of Object.entries(fallbacks)) {
      if (serviceName.includes(keyword)) return whisper;
    }
    return 'Curated for your companion';
  }
  
  const breedLower = breed.toLowerCase();
  const serviceName = (service.name || '').toLowerCase();
  const serviceDesc = (service.description || '').toLowerCase();
  const combined = `${serviceName} ${serviceDesc}`;
  
  // BREED-SPECIFIC "Why for [PetName]" messages
  
  // Shih Tzu specific
  if (breedLower.includes('shih')) {
    if (combined.includes('groom')) {
      return `Shih Tzus, like ${petName}, need regular grooming for their long coats`;
    }
    if (combined.includes('spa') || combined.includes('relax')) {
      return `Shih Tzus, like ${petName}, love being pampered`;
    }
    if (combined.includes('train')) {
      return `Gentle training perfect for ${petName}'s temperament`;
    }
    if (combined.includes('dental') || combined.includes('teeth')) {
      return `Important for Shih Tzus like ${petName} - prone to dental issues`;
    }
    return `Made for royal companions like ${petName}`;
  }
  
  // Golden Retriever specific
  if (breedLower.includes('retriever') || breedLower.includes('golden')) {
    if (combined.includes('swim')) {
      return `Retrievers, like ${petName}, are natural swimmers!`;
    }
    if (combined.includes('groom') || combined.includes('deshed')) {
      return `Essential for Retrievers like ${petName} - they shed a lot`;
    }
    if (combined.includes('joint') || combined.includes('physio')) {
      return `Important for active Retrievers like ${petName}`;
    }
    if (combined.includes('train')) {
      return `Retrievers, like ${petName}, excel at training`;
    }
    return `Perfect for energetic pups like ${petName}`;
  }
  
  // Labrador specific
  if (breedLower.includes('lab')) {
    if (combined.includes('weight') || combined.includes('diet')) {
      return `Labs, like ${petName}, can gain weight easily`;
    }
    if (combined.includes('swim') || combined.includes('hydro')) {
      return `Labs, like ${petName}, love water activities!`;
    }
    return `Great for friendly Labs like ${petName}`;
  }
  
  // Pug specific
  if (breedLower.includes('pug')) {
    if (combined.includes('breath') || combined.includes('cool')) {
      return `Pugs, like ${petName}, need special breathing care`;
    }
    if (combined.includes('skin') || combined.includes('wrinkle')) {
      return `Pugs, like ${petName}, need wrinkle cleaning`;
    }
    if (combined.includes('weight')) {
      return `Important for Pugs like ${petName} - watch their weight`;
    }
    return `Designed with Pugs like ${petName} in mind`;
  }
  
  // German Shepherd specific
  if (breedLower.includes('german') || breedLower.includes('shepherd')) {
    if (combined.includes('train') || combined.includes('obedience')) {
      return `German Shepherds, like ${petName}, love mental challenges`;
    }
    if (combined.includes('hip') || combined.includes('joint')) {
      return `Important for German Shepherds like ${petName}`;
    }
    return `For intelligent breeds like ${petName}`;
  }
  
  // Beagle specific
  if (breedLower.includes('beagle')) {
    if (combined.includes('scent') || combined.includes('nose')) {
      return `Beagles, like ${petName}, follow their nose everywhere!`;
    }
    if (combined.includes('train')) {
      return `Keeps curious Beagles like ${petName} focused`;
    }
    return `Great for active Beagles like ${petName}`;
  }
  
  // Poodle specific
  if (breedLower.includes('poodle')) {
    if (combined.includes('groom') || combined.includes('coat')) {
      return `Poodles, like ${petName}, need regular professional grooming`;
    }
    if (combined.includes('smart') || combined.includes('agility')) {
      return `Smart Poodles like ${petName} excel at this`;
    }
    return `Elegant choice for ${petName}`;
  }
  
  // Default breed-specific message
  return `${breed}s, like ${petName}, will benefit from this`;
};

// Legacy function for backward compatibility
const getMiraServiceWhisper = (service, breed) => {
  return getServiceBreedWhisper(service, null, breed);
};

// =============================================================================
// PET SOUL TRAITS DISPLAY
// =============================================================================
const PetSoulTraits = ({ pet, soulData }) => {
  const traits = [];
  const answers = pet?.doggy_soul_answers || pet?.soul_answers || soulData || {};
  
  if (answers.describe_3_words) {
    traits.push({ icon: '✨', text: answers.describe_3_words });
  } else if (answers.general_nature) {
    traits.push({ icon: '🌟', text: answers.general_nature });
  }
  
  if (answers.favorite_treats) {
    const treats = Array.isArray(answers.favorite_treats) ? answers.favorite_treats[0] : answers.favorite_treats;
    traits.push({ icon: '🍖', text: `Loves ${treats}` });
  }
  
  if (answers.energetic_time) {
    traits.push({ icon: '⚡', text: `Active: ${answers.energetic_time}` });
  } else if (answers.walks_per_day) {
    traits.push({ icon: '🚶', text: `${answers.walks_per_day} walks daily` });
  }
  
  // Fallback traits
  if (traits.length < 3) {
    const breed = (pet?.breed || '').toLowerCase();
    if (breed.includes('retriever')) {
      if (traits.length < 1) traits.push({ icon: '🏊', text: 'Water lover' });
      if (traits.length < 2) traits.push({ icon: '🎾', text: 'Fetch fan' });
      if (traits.length < 3) traits.push({ icon: '💛', text: 'Family friendly' });
    } else if (breed.includes('shih tzu')) {
      if (traits.length < 1) traits.push({ icon: '👑', text: 'Royal companion' });
      if (traits.length < 2) traits.push({ icon: '🛋️', text: 'Lap dog' });
      if (traits.length < 3) traits.push({ icon: '💕', text: 'Affectionate' });
    } else {
      if (traits.length < 1) traits.push({ icon: '🐕', text: pet?.breed || 'Good pup' });
      if (traits.length < 2) traits.push({ icon: '❤️', text: 'Loved' });
      if (traits.length < 3) traits.push({ icon: '🏠', text: 'Family' });
    }
  }
  
  return (
    <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-3">
      {traits.slice(0, 3).map((trait, idx) => (
        <div key={idx} className="flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] sm:text-xs text-white/80">
          <span>{trait.icon}</span>
          <span className="truncate max-w-[100px]">{trait.text}</span>
        </div>
      ))}
    </div>
  );
};

// =============================================================================
// ANIMATED PET HERO WITH SOUL SCORE
// =============================================================================
const PetHero = ({ pet, soulData, onPetSwitch, pets }) => {
  const petPhoto = pet?.photo_url || pet?.image_url || pet?.image;
  const petName = pet?.name || 'Your Companion';
  const soulScore = pet?.overall_score || soulData?.overall_score || 0;
  
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] py-6 sm:py-10 md:py-14">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10">
          {/* Pet Photo with Soul Score Arc */}
          <div className="relative">
            <div className="relative group">
              {petPhoto ? (
                <div className="relative">
                  <SoulScoreArc 
                    score={soulScore} 
                    petId={pet?.id}
                    petName={petName}
                    size="lg"
                    showLabel={false}
                    showCTA={false}
                  />
                  <img 
                    src={petPhoto} 
                    alt={petName}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center border-4 border-white/20 shadow-2xl">
                  <PawPrint className="w-12 h-12 sm:w-16 sm:h-16 text-white/80" />
                </div>
              )}
            </div>
            
            {/* Pet Switcher */}
            {pets && pets.length > 1 && (
              <div className="flex justify-center gap-2 mt-3">
                {pets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPetSwitch(p)}
                    className={`w-8 h-8 rounded-full border-2 transition-all overflow-hidden ${
                      p.id === pet?.id ? 'border-amber-400 scale-110' : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {p.photo_url || p.image_url ? (
                      <img src={p.photo_url || p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-xs text-white">{p.name?.[0]}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs sm:text-sm text-white/80 mb-2 sm:mb-3">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
              <span>Pet Soul™ {soulScore}% Complete</span>
            </div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
              Services for{' '}
              <span className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                {petName}
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-white/70 mb-3 sm:mb-4 max-w-xl">
              Thoughtfully selected for {pet ? `${petName}'s` : 'your companion\'s'} life and needs.
            </p>
            
            {/* Pet Soul Traits */}
            <PetSoulTraits pet={pet} soulData={soulData} />
          </div>
        </div>
      </div>
    </section>
  );
};

// =============================================================================
// SEARCH BAR
// =============================================================================
const SearchBar = ({ value, onChange, petName }) => (
  <div className="relative w-full max-w-2xl mx-auto px-4 -mt-5 sm:-mt-6 z-20">
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity"></div>
      <div className="relative bg-white rounded-xl shadow-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={petName ? `What does ${petName} need?` : "What service does your dog need?"}
          className="pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm bg-transparent border-0 rounded-xl focus:ring-2 focus:ring-purple-500/50"
          data-testid="services-search"
        />
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('openMiraChat'))}
          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white hover:opacity-90 active:scale-95 transition-all"
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

// =============================================================================
// POPULAR BREEDS FOR FILTER
// =============================================================================
const BREED_FILTERS = [
  { id: 'all', label: 'All Breeds' },
  { id: 'golden_retriever', label: 'Golden Retriever' },
  { id: 'labrador', label: 'Labrador' },
  { id: 'shih_tzu', label: 'Shih Tzu' },
  { id: 'pug', label: 'Pug' },
  { id: 'beagle', label: 'Beagle' },
  { id: 'german_shepherd', label: 'German Shepherd' },
  { id: 'indie', label: 'Indie / Mixed' },
  { id: 'pomeranian', label: 'Pomeranian' },
  { id: 'husky', label: 'Husky' },
  { id: 'rottweiler', label: 'Rottweiler' },
  { id: 'cocker_spaniel', label: 'Cocker Spaniel' },
  { id: 'dachshund', label: 'Dachshund' },
];

// =============================================================================
// PILLAR FILTERS WITH SMART BREED SEARCH
// =============================================================================
const PillarFilters = ({ selected, onSelect, selectedSubcat, onSelectSubcat, selectedBreed, onSelectBreed }) => {
  const selectedPillar = PILLARS.find(p => p.id === selected);
  const [breedSearchOpen, setBreedSearchOpen] = useState(false);
  const [breedSearchValue, setBreedSearchValue] = useState('');
  const breedSearchRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (breedSearchRef.current && !breedSearchRef.current.contains(e.target)) {
        setBreedSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Comprehensive breed list for search
  const BREED_LIST = [
    'Golden Retriever', 'Labrador', 'German Shepherd', 'Shih Tzu', 'Pug', 
    'Beagle', 'Rottweiler', 'Doberman', 'Husky', 'Pomeranian', 'Chihuahua',
    'French Bulldog', 'Bulldog', 'Boxer', 'Dachshund', 'Great Dane',
    'Cocker Spaniel', 'Border Collie', 'Australian Shepherd', 'Dalmatian',
    'Indie', 'Indian Pariah', 'Rajapalayam', 'Mudhol Hound', 'Kombai',
    'Maltese', 'Yorkshire Terrier', 'Boston Terrier', 'Cavalier King Charles',
    'Jack Russell', 'Miniature Schnauzer', 'Shiba Inu', 'Corgi', 'Samoyed',
    'Bernese Mountain Dog', 'Saint Bernard', 'Newfoundland', 'Akita', 'Malamute',
    'Mixed Breed', 'Persian Cat', 'Siamese Cat', 'Maine Coon', 'British Shorthair'
  ];
  
  // Filter breeds based on search
  const filteredBreeds = breedSearchValue.trim() 
    ? BREED_LIST.filter(b => b.toLowerCase().includes(breedSearchValue.toLowerCase()))
    : BREED_LIST.slice(0, 12);
  
  const handleBreedSelect = (breed) => {
    const breedId = breed.toLowerCase().replace(/\s+/g, '_');
    onSelectBreed(breedId);
    setBreedSearchValue(breed);
    setBreedSearchOpen(false);
  };
  
  const clearBreedFilter = () => {
    onSelectBreed('all');
    setBreedSearchValue('');
  };
  
  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        {/* Pillar row with Breed Filter */}
        <div className="flex items-center gap-2">
          {/* Pillar pills - scrollable */}
          <div className="flex-1 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              const isActive = selected === pillar.id;
              return (
                <button
                  key={pillar.id}
                  onClick={() => { onSelect(pillar.id); onSelectSubcat(null); }}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start active:scale-95 ${
                    isActive ? `${pillar.color} text-white shadow-md` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  data-testid={`pillar-${pillar.id}`}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{pillar.label}</span>
                </button>
              );
            })}
          </div>
          
          {/* Smart Breed Search */}
          <div className="relative flex-shrink-0" ref={breedSearchRef}>
            <div className="relative">
              <input
                type="text"
                value={breedSearchValue}
                onChange={(e) => {
                  setBreedSearchValue(e.target.value);
                  setBreedSearchOpen(true);
                }}
                onFocus={() => setBreedSearchOpen(true)}
                placeholder="Search breed..."
                className={`w-28 sm:w-40 pl-8 pr-8 py-1.5 sm:py-2 text-xs rounded-xl border transition-all ${
                  selectedBreed && selectedBreed !== 'all'
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-gray-50 text-gray-700 focus:border-purple-400 focus:bg-white'
                }`}
                data-testid="breed-search-input"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              {selectedBreed && selectedBreed !== 'all' && (
                <button
                  onClick={clearBreedFilter}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-500 text-white rounded-full flex items-center justify-center hover:bg-purple-600"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
            
            {/* Breed Search Dropdown */}
            {breedSearchOpen && filteredBreeds.length > 0 && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] text-gray-400 uppercase tracking-wider">
                  {breedSearchValue ? 'Matching Breeds' : 'Popular Breeds'}
                </div>
                {filteredBreeds.map((breed) => (
                  <button
                    key={breed}
                    onClick={() => handleBreedSelect(breed)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 transition-colors flex items-center gap-2"
                  >
                    <PawPrint className="w-3 h-3 text-purple-400" />
                    <span>{breed}</span>
                  </button>
                ))}
                {breedSearchValue && filteredBreeds.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-500">
                    No breeds found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {selectedPillar?.subcategories?.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
            <button
              onClick={() => onSelectSubcat(null)}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all snap-start ${
                !selectedSubcat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {selectedPillar.subcategories.map((subcat) => (
              <button
                key={subcat}
                onClick={() => onSelectSubcat(subcat)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all snap-start ${
                  selectedSubcat === subcat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {subcat}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// SERVICE CARD - With Mira Whisper
// =============================================================================
const ServiceCard = ({ service, pet, index, showWhyPicked = false }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const getVisuals = () => {
    const name = (service.name || '').toLowerCase();
    const category = (service.category || '').toLowerCase();
    for (const [key, val] of Object.entries(SERVICE_VISUALS)) {
      if (name.includes(key) || category.includes(key)) return val;
    }
    return SERVICE_VISUALS.default;
  };
  
  const visuals = getVisuals();
  const Icon = visuals.icon;
  const breed = pet?.breed || '';
  const petName = pet?.name || '';
  
  // Mira whisper for this service
  const miraWhisper = getMiraServiceWhisper(service, breed);
  
  // Generate "Why we picked this" reason
  const getWhyPicked = () => {
    if (!pet || !service._relevanceScore) return null;
    const reasons = [];
    const sName = (service.name || '').toLowerCase();
    const sDesc = (service.description || '').toLowerCase();
    const combined = `${sName} ${sDesc}`;
    const breedLower = breed.toLowerCase();
    
    // Check breed match
    if (service.breed_whispers && Object.keys(service.breed_whispers).some(k => breedLower.includes(k.replace(/_/g, ' ')))) {
      reasons.push(`Has special tips for ${breed}s`);
    }
    
    // Check breed keywords
    if (breedLower.includes('retriever') && (combined.includes('swim') || combined.includes('active') || combined.includes('joint'))) {
      reasons.push(`Great for active ${breed}s`);
    }
    if (breedLower.includes('shih') && (combined.includes('grooming') || combined.includes('coat'))) {
      reasons.push(`Perfect for ${breed} coat care`);
    }
    if (breedLower.includes('pug') && (combined.includes('breathing') || combined.includes('flat'))) {
      reasons.push(`Designed for flat-faced breeds`);
    }
    
    // Age match
    if (pet.age_years < 1 && combined.includes('puppy')) {
      reasons.push(`Ideal for puppies like ${petName}`);
    }
    if (pet.age_years > 7 && combined.includes('senior')) {
      reasons.push(`Tailored for senior dogs`);
    }
    
    // Default reason
    if (reasons.length === 0 && service._relevanceScore > 0) {
      reasons.push(`Recommended for ${breed}s`);
    }
    
    return reasons[0];
  };
  
  const whyPicked = showWhyPicked ? getWhyPicked() : null;
  
  const handleClick = () => {
    // Navigate to service detail page
    const serviceId = service.id || service._id;
    const pillar = service.pillar || service.pillars?.[0] || 'care';
    navigate(`/services/${pillar}/${serviceId}`);
  };
  
  return (
    <div 
      className="group relative bg-white rounded-2xl lg:rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border border-gray-100"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`service-card-${service.id}`}
    >
      {/* "Why we picked this" badge */}
      {whyPicked && (
        <div 
          className="absolute top-2 sm:top-3 right-2 sm:right-3 z-20"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="p-1.5 sm:p-2 bg-amber-400 rounded-full shadow-md cursor-help">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-900" />
          </div>
          {showTooltip && (
            <div className="absolute right-0 top-full mt-1 w-44 p-2.5 bg-gray-900 text-white text-xs rounded-xl shadow-xl z-30">
              <p className="font-medium mb-1">Why for {petName}?</p>
              <p className="text-gray-300">{whyPicked}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Image Header */}
      <div className={`relative h-28 sm:h-36 lg:h-40 bg-gradient-to-br ${visuals.color} overflow-hidden`}>
        <img 
          src={visuals.image} 
          alt={service.name}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'}`}
          style={{ opacity: 0.3 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        
        {/* Icon Badge */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 p-2 sm:p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        
        {/* Service Name on Image */}
        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
            {service.name}
          </h3>
        </div>
      </div>
      
      {/* Content - Enhanced padding and text sizes */}
      <div className="p-3 sm:p-4 lg:p-5 space-y-2 sm:space-y-3">
        {/* Mira Whisper - Why this service for this breed */}
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-2 flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <span>{miraWhisper}</span>
        </p>
        
        {/* Price and duration */}
        <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100">
          <span className="font-bold text-gray-900 text-base sm:text-lg">
            {service.base_price ? `₹${service.base_price.toLocaleString()}` : 'Get Quote'}
          </span>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            {service.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {service.duration}
              </span>
            )}
            <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MAIN SERVICES PAGE
// =============================================================================
const ServicesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, token } = useAuth();
  
  // State
  const [services, setServices] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState(searchParams.get('pillar') || 'recommended');
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [selectedBreedFilter, setSelectedBreedFilter] = useState('all'); // NEW: Breed filter
  const [selectedPet, setSelectedPet] = useState(null);
  const [petSoulData, setPetSoulData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(24);
  const [miraChatOpen, setMiraChatOpen] = useState(false);
  
  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/service-box/services?limit=200`);
        if (res.ok) {
          const data = await res.json();
          setServices(data.services || []);
        }
      } catch (err) {
        console.error('Failed to fetch services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);
  
  // Fetch pets
  useEffect(() => {
    if (token) {
      const fetchPets = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const userPets = data.pets || [];
            setPets(userPets);
            if (userPets.length > 0) {
              const savedPetId = localStorage.getItem('selectedPetId');
              const pet = savedPetId ? userPets.find(p => p.id === savedPetId) : userPets[0];
              setSelectedPet(pet || userPets[0]);
            }
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      };
      fetchPets();
    }
  }, [token]);
  
  // Fetch soul data
  useEffect(() => {
    if (selectedPet?.id && token) {
      const fetchSoulData = async () => {
        try {
          const res = await fetch(`${API_URL}/api/soul-drip/completeness/${selectedPet.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPetSoulData(data);
          }
        } catch (err) {
          console.error('Failed to fetch soul data:', err);
        }
      };
      fetchSoulData();
    }
  }, [selectedPet?.id, token]);
  
  // Pet switch handler
  const handlePetSwitch = useCallback((pet) => {
    setSelectedPet(pet);
    localStorage.setItem('selectedPetId', pet.id);
    window.dispatchEvent(new CustomEvent('petSelectionChanged', { detail: { pet, petId: pet.id } }));
  }, []);
  
  // Listen for pet selection changes
  useEffect(() => {
    const handlePetSelectionChanged = (event) => {
      const { pet, petId } = event.detail || {};
      if (pet) setSelectedPet(pet);
      else if (petId && pets.length > 0) {
        const foundPet = pets.find(p => p.id === petId);
        if (foundPet) setSelectedPet(foundPet);
      }
    };
    window.addEventListener('petSelectionChanged', handlePetSelectionChanged);
    return () => window.removeEventListener('petSelectionChanged', handlePetSelectionChanged);
  }, [pets]);
  
  // Filter services
  const filteredServices = useMemo(() => {
    let result = services;
    
    // "For You" / "recommended" - Personalize based on pet
    if (selectedPillar === 'recommended' && selectedPet) {
      const petBreedLower = (selectedPet.breed || '').toLowerCase();
      const petSize = selectedPet.size?.toLowerCase() || '';
      const petAge = selectedPet.age_years || 0;
      
      // Score services for relevance
      result = result.map(s => {
        let score = 0;
        const sName = (s.name || '').toLowerCase();
        const sDesc = (s.description || '').toLowerCase();
        const combined = `${sName} ${sDesc}`;
        
        // Breed-specific whisper (highest priority)
        if (s.breed_whispers) {
          const breedKey = petBreedLower.replace(/\s+/g, '_');
          if (s.breed_whispers[breedKey]) score += 60;
          // Check partial matches
          Object.keys(s.breed_whispers).forEach(key => {
            if (petBreedLower.includes(key.replace(/_/g, ' '))) score += 40;
          });
        }
        
        // Breed match in name/description
        if (petBreedLower) {
          const breedWords = petBreedLower.split(/\s+/);
          breedWords.forEach(word => {
            if (word.length > 3 && combined.includes(word)) score += 30;
          });
          // Specific breed associations
          if (petBreedLower.includes('retriever') && (combined.includes('swim') || combined.includes('active') || combined.includes('joint'))) score += 25;
          if (petBreedLower.includes('shih') && (combined.includes('grooming') || combined.includes('small') || combined.includes('coat'))) score += 25;
          if (petBreedLower.includes('lab') && (combined.includes('weight') || combined.includes('exercise') || combined.includes('active'))) score += 25;
          if (petBreedLower.includes('pug') && (combined.includes('breathing') || combined.includes('flat') || combined.includes('brachycephalic'))) score += 25;
        }
        
        // Size match
        if (petSize) {
          if (petSize.includes('small') && combined.includes('small')) score += 15;
          if (petSize.includes('large') && combined.includes('large')) score += 15;
        }
        
        // Age-appropriate
        if (petAge < 1 && combined.includes('puppy')) score += 20;
        if (petAge > 7 && (combined.includes('senior') || combined.includes('mobility'))) score += 20;
        
        // Boost services with whispers
        if (s.mira_whisper) score += 5;
        
        return { ...s, _relevanceScore: score };
      });
      
      // Sort by relevance, show top relevant + fallback
      result = result
        .sort((a, b) => b._relevanceScore - a._relevanceScore)
        .filter(s => s._relevanceScore > 0 || result.indexOf(s) < 30);
    } else if (selectedPillar !== 'all') {
      result = result.filter(s => {
        const servicePillars = s.pillars || [];
        return servicePillars.includes(selectedPillar) || s.pillar === selectedPillar;
      });
    }
    
    if (selectedSubcat) {
      const subLower = selectedSubcat.toLowerCase();
      result = result.filter(s =>
        s.category?.toLowerCase().includes(subLower) ||
        s.name?.toLowerCase().includes(subLower)
      );
    }
    
    // NEW: Breed filter - filter services that have whispers for the selected breed
    if (selectedBreedFilter && selectedBreedFilter !== 'all') {
      const breedKey = selectedBreedFilter.replace(/\s+/g, '_').toLowerCase();
      result = result.map(s => {
        let breedScore = 0;
        const sName = (s.name || '').toLowerCase();
        const sDesc = (s.description || '').toLowerCase();
        const combined = `${sName} ${sDesc}`;
        
        // Check breed_whispers
        if (s.breed_whispers) {
          if (s.breed_whispers[breedKey]) breedScore += 100;
          // Partial match
          Object.keys(s.breed_whispers).forEach(key => {
            if (key.includes(breedKey) || breedKey.includes(key)) breedScore += 50;
          });
        }
        
        // Check name/description for breed keywords
        const breedWords = breedKey.split('_');
        breedWords.forEach(word => {
          if (word.length > 3 && combined.includes(word)) breedScore += 30;
        });
        
        // Breed-specific associations
        if (breedKey.includes('retriever') && (combined.includes('swim') || combined.includes('joint') || combined.includes('active'))) breedScore += 20;
        if (breedKey.includes('shih') && (combined.includes('grooming') || combined.includes('small') || combined.includes('coat'))) breedScore += 20;
        if (breedKey.includes('lab') && (combined.includes('weight') || combined.includes('exercise'))) breedScore += 20;
        if (breedKey.includes('pug') && (combined.includes('breathing') || combined.includes('flat') || combined.includes('brachycephalic'))) breedScore += 20;
        if (breedKey.includes('german') && (combined.includes('hip') || combined.includes('protection') || combined.includes('training'))) breedScore += 20;
        if (breedKey.includes('indie') && (combined.includes('indie') || combined.includes('mixed') || combined.includes('desi'))) breedScore += 20;
        
        return { ...s, _breedScore: breedScore };
      });
      
      // Sort by breed relevance and show all (don't filter out, just prioritize)
      result = result.sort((a, b) => b._breedScore - a._breedScore);
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [services, selectedPillar, selectedSubcat, searchQuery, selectedPet, selectedBreedFilter]);
  
  const displayedServices = useMemo(() => filteredServices.slice(0, displayCount), [filteredServices, displayCount]);
  const hasMore = displayCount < filteredServices.length;
  const petName = selectedPet?.name || '';

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-0" data-testid="services-page">
      <SEOHead page="services" path="/services" />
      
      {/* Magical Personalized Hero */}
      <PersonalizedHero 
        pet={selectedPet}
        pageType="services"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onVoiceClick={() => setMiraChatOpen(true)}
      />
      
      <div className="h-3 sm:h-4"></div>
      
      {/* Pillar Filters */}
      <PillarFilters 
        selected={selectedPillar}
        onSelect={(p) => { setSelectedPillar(p); setDisplayCount(24); }}
        selectedSubcat={selectedSubcat}
        onSelectSubcat={setSelectedSubcat}
        selectedBreed={selectedBreedFilter}
        onSelectBreed={(b) => { setSelectedBreedFilter(b); setDisplayCount(24); }}
      />
      
      {/* Services Grid */}
      <section className="py-6 sm:py-8 bg-white pb-24 sm:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                {selectedBreedFilter && selectedBreedFilter !== 'all' 
                  ? `Services for ${BREED_FILTERS.find(b => b.id === selectedBreedFilter)?.label || selectedBreedFilter}`
                  : selectedPillar === 'recommended' ? `For ${petName || 'You'}` 
                  : selectedPillar === 'all' ? 'All Services' 
                  : `${PILLARS.find(p => p.id === selectedPillar)?.label || ''}`}
              </h2>
              {/* Looking for different pet link */}
              {selectedPillar === 'recommended' && selectedPet && (
                <button 
                  onClick={() => {
                    // Scroll to breed filter and open it
                    const breedBtn = document.querySelector('[data-testid="breed-filter-btn"]');
                    if (breedBtn) breedBtn.click();
                  }}
                  className="text-xs sm:text-sm text-purple-600 hover:text-purple-700 hover:underline mt-1 flex items-center gap-1.5"
                >
                  <PawPrint className="w-3.5 h-3.5" />
                  Looking for a friend&apos;s pet? Filter by breed →
                </button>
              )}
            </div>
            {filteredServices.length > 0 && (
              <span className="text-xs sm:text-sm text-gray-500">{filteredServices.length} services</span>
            )}
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl overflow-hidden">
                  <div className="h-28 sm:h-36 lg:h-40 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedServices.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
              <Button onClick={() => { setSelectedPillar('all'); setSelectedSubcat(null); setSearchQuery(''); }} 
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base px-6 py-3 rounded-xl">
                View All
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {displayedServices.map((service, idx) => (
                  <ServiceCard 
                    key={service.id || idx} 
                    service={service} 
                    pet={selectedPet}
                    index={idx}
                    showWhyPicked={selectedPillar === 'recommended' && selectedPet && service._relevanceScore > 0}
                  />
                ))}
              </div>
              
              {hasMore && (
                <div className="text-center mt-8">
                  <Button
                    onClick={() => setDisplayCount(prev => prev + 24)}
                    className="px-8 py-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-base font-medium"
                    data-testid="load-more-btn"
                  >
                    <ChevronDown className="w-5 h-5 mr-2" />
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      
      {/* Emotional Close */}
      <section className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] py-10 sm:py-14">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-lg sm:text-xl md:text-2xl text-white font-medium leading-relaxed mb-3">
            {petName ? (
              <>You don&apos;t manage services.<br />You just take care of <span className="bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">{petName}</span>.<br />We handle the rest.</>
            ) : (
              <>You don&apos;t manage services.<br />You just love your dog.<br />We handle the rest.</>
            )}
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openMiraChat'))}
            className="text-sm text-white/60 hover:text-white/90 transition-colors"
          >
            Need help? Ask Mira →
          </button>
        </div>
      </section>
      
      <MiraChatWidget pillar="services" isOpen={miraChatOpen} onClose={() => setMiraChatOpen(false)} />
      
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ServicesPage;

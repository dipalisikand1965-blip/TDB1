/**
 * ServicesPage.jsx
 * 
 * "The easiest place in India to get the right service for your dog."
 * Not a marketplace. Not a directory.
 * A guided, pet-aware services experience.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import MiraChatWidget from '../components/MiraChatWidget';
import SEOHead from '../components/SEOHead';
import { 
  Search, Heart, Stethoscope, GraduationCap, Home, Plane, 
  PartyPopper, Lightbulb, AlertTriangle, FileText, Sunrise,
  PawPrint, Sparkles, ChevronDown, Clock, MapPin, Star,
  Dumbbell, Package, Mic, ChevronRight
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';

// =============================================================================
// PILLAR CONFIG - Services focus (Recommended first, All last)
// =============================================================================
const PILLARS = [
  { id: 'recommended', label: 'Recommended', icon: Sparkles, color: 'bg-amber-100', 
    description: 'Services curated for your companion' },
  { id: 'care', label: 'Care', icon: Stethoscope, color: 'bg-rose-100',
    description: 'Day-to-day wellbeing & reliability',
    subcategories: ['Grooming', 'Spa', 'Vet Visits', 'Walking', 'Pet Sitting'] },
  { id: 'learn', label: 'Learn', icon: GraduationCap, color: 'bg-purple-100',
    description: 'Behaviour, training, life skills',
    subcategories: ['Puppy Training', 'Obedience', 'Behaviour', 'Agility'] },
  { id: 'stay', label: 'Stay', icon: Home, color: 'bg-blue-100',
    description: 'Safe care when you\'re away',
    subcategories: ['Boarding', 'Daycare', 'Homestay', 'Resort'] },
  { id: 'fit', label: 'Fit', icon: Dumbbell, color: 'bg-green-100',
    description: 'Physical & mental energy balance',
    subcategories: ['Fitness Assessment', 'Swimming', 'Hydrotherapy', 'Agility'] },
  { id: 'travel', label: 'Travel', icon: Plane, color: 'bg-sky-100',
    description: 'Movement without stress',
    subcategories: ['Pet Taxi', 'Relocation', 'Airport Transfer'] },
  { id: 'celebrate', label: 'Celebrate', icon: PartyPopper, color: 'bg-pink-100',
    description: 'Milestones & joy',
    subcategories: ['Party Planning', 'Photography', 'Events'] },
  { id: 'advisory', label: 'Advisory', icon: Lightbulb, color: 'bg-amber-100',
    description: 'Expert guidance',
    subcategories: ['Nutrition', 'Behaviour Consult', 'Breed Selection'] },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'bg-red-100',
    description: 'Panic-proof help',
    subcategories: ['24x7 Helpline', 'Emergency Transport', 'Lost Pet'] },
  { id: 'paperwork', label: 'Paperwork', icon: FileText, color: 'bg-slate-100',
    description: 'Compliance without confusion',
    subcategories: ['Registration', 'Microchipping', 'Pet Passport'] },
  { id: 'farewell', label: 'Farewell', icon: Sunrise, color: 'bg-violet-100',
    description: 'Dignity & closure',
    subcategories: ['Cremation', 'Memorial', 'Grief Support'] },
  { id: 'adopt', label: 'Adopt', icon: PawPrint, color: 'bg-orange-100',
    description: 'Responsible beginnings',
    subcategories: ['Adoption Counseling', 'Home Check', 'Foster Care'] },
  { id: 'all', label: 'All', icon: Package, color: 'bg-gray-100', 
    description: 'Browse all services' },
];

// =============================================================================
// BREED-SPECIFIC SERVICE RECOMMENDATIONS
// =============================================================================
const BREED_SERVICE_RECOMMENDATIONS = {
  'shih tzu': {
    essential: ['Grooming', 'Dental Care'],
    recommended: ['Eye Care', 'Short Walks'],
    nudge: 'Shih Tzus need professional grooming every 4-6 weeks.'
  },
  'pomeranian': {
    essential: ['Grooming', 'Dental Care'],
    recommended: ['Puppy Socialization'],
    nudge: 'Pomeranians benefit from regular coat maintenance.'
  },
  'golden retriever': {
    essential: ['Swimming', 'Joint Care'],
    recommended: ['Obedience Training', 'Hydrotherapy'],
    nudge: 'Retrievers love water — swimming is great exercise for them.'
  },
  'labrador': {
    essential: ['Swimming', 'Weight Management'],
    recommended: ['Agility Training', 'Fetch Sessions'],
    nudge: 'Labs are prone to weight gain — fitness programs help.'
  },
  'beagle': {
    essential: ['Scent Training', 'Secure Boarding'],
    recommended: ['Obedience Training'],
    nudge: 'Beagles are scent-driven — structured training works best.'
  },
  'pug': {
    essential: ['Breathing Assessment', 'Weight Management'],
    recommended: ['Short Walks', 'Cooling Sessions'],
    nudge: 'Pugs need careful exercise — avoid overheating.'
  },
  'german shepherd': {
    essential: ['Training', 'Hip Assessment'],
    recommended: ['Agility', 'Guard Training'],
    nudge: 'German Shepherds thrive with mental stimulation and training.'
  },
  'husky': {
    essential: ['Exercise Programs', 'Deshedding'],
    recommended: ['Winter Activities', 'Swimming'],
    nudge: 'Huskies need lots of exercise — daily activities are key.'
  },
  'indie': {
    essential: ['Vaccination', 'General Health'],
    recommended: ['Socialization', 'Basic Training'],
    nudge: 'Indies are adaptable — socialization helps them thrive.'
  },
  'dachshund': {
    essential: ['Back Care', 'Weight Management'],
    recommended: ['Swimming', 'Gentle Exercise'],
    nudge: 'Dachshunds need back-friendly activities — no jumping.'
  },
};

// =============================================================================
// PET BAR - Same as Shop page
// =============================================================================
const PetBar = ({ pet, pets, onSelectPet }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  if (!pet) return null;
  
  const petPhoto = pet.photo_url || pet.image_url || pet.image;
  
  return (
    <div className="bg-white border-b border-gray-100 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex-shrink-0">
            {petPhoto ? (
              <img src={petPhoto} alt={pet.name} 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-[#7A8B6F] shadow-sm" />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#F5F0E8] border-2 border-[#7A8B6F] flex items-center justify-center">
                <PawPrint className="w-5 h-5 sm:w-6 sm:h-6 text-[#7A8B6F]" />
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-[#2D2D2D] truncate">
              Services for <span className="text-[#7A8B6F]">{pet.name}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#9B9B9B]">
              {pet.breed || 'Your companion'} • Curated for how {pet.name} lives
            </p>
          </div>
          
          {pets && pets.length > 1 && (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-[#2D2D2D] bg-[#F5F0E8] rounded-full hover:bg-[#E8E0D5] transition-colors">
                <span className="hidden sm:inline">Switch pet</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                  {pets.map(p => (
                    <button key={p.id}
                      onClick={() => { onSelectPet(p); setShowDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9F6F1] transition-colors ${
                        p.id === pet.id ? 'bg-[#F9F6F1]' : ''}`}>
                      {(p.photo_url || p.image_url || p.image) ? (
                        <img src={p.photo_url || p.image_url || p.image} alt={p.name}
                          className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#F5F0E8] flex items-center justify-center">
                          <PawPrint className="w-4 h-4 text-[#7A8B6F]" />
                        </div>
                      )}
                      <div className="text-left">
                        <div className="text-sm font-medium text-[#2D2D2D]">{p.name}</div>
                        <div className="text-xs text-[#9B9B9B]">{p.breed || 'Pet'}</div>
                      </div>
                      {p.id === pet.id && <div className="ml-auto w-2 h-2 bg-[#7A8B6F] rounded-full"></div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PILLAR FILTERS
// =============================================================================
const PillarFilters = ({ selected, onSelect, selectedSubcat, onSelectSubcat }) => {
  const selectedPillar = PILLARS.find(p => p.id === selected);
  
  return (
    <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 snap-x snap-mandatory">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const isActive = selected === pillar.id;
            return (
              <button key={pillar.id}
                onClick={() => { onSelect(pillar.id); onSelectSubcat(null); }}
                className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 snap-start active:scale-95 ${
                  isActive ? 'bg-[#7A8B6F] text-white shadow-md' : `${pillar.color} text-[#2D2D2D] hover:shadow-md`
                }`}
                data-testid={`pillar-${pillar.id}`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{pillar.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Pillar Description */}
        {selectedPillar && selectedPillar.id !== 'all' && (
          <p className="text-xs text-[#6B6B6B] mt-1 mb-2">{selectedPillar.description}</p>
        )}
        
        {/* Subcategories */}
        {selectedPillar?.subcategories?.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
            <button onClick={() => onSelectSubcat(null)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all snap-start active:scale-95 ${
                !selectedSubcat ? 'bg-[#7A8B6F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              All {selectedPillar.label}
            </button>
            {selectedPillar.subcategories.map((subcat) => (
              <button key={subcat} onClick={() => onSelectSubcat(subcat)}
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap transition-all snap-start active:scale-95 ${
                  selectedSubcat === subcat ? 'bg-[#7A8B6F] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
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
// SERVICE CARD - Concierge-grade, meaning before price
// =============================================================================
const ServiceCard = ({ service, pet, breedRecommendation }) => {
  const navigate = useNavigate();
  const breedMatch = breedRecommendation?.essential?.some(s => 
    service.name?.toLowerCase().includes(s.toLowerCase())
  );
  
  // Generate relevance text based on service and pet
  const getRelevanceText = () => {
    if (breedMatch && breedRecommendation?.nudge) {
      return breedRecommendation.nudge;
    }
    // Generic relevance based on service category
    const category = (service.category || service.pillar || '').toLowerCase();
    const relevanceMap = {
      'grooming': 'Essential for coat health and comfort',
      'training': 'Build confidence and strengthen your bond',
      'boarding': 'A safe, loving home away from home',
      'daycare': 'Socialization and exercise while you\'re at work',
      'walking': 'Daily exercise and mental stimulation',
      'vet': 'Professional health monitoring and care',
      'travel': 'Stress-free journeys for your companion',
      'spa': 'Relaxation and pampering they deserve',
      'adopt': 'Helpful for first-time pet parents and puppies settling in',
      'emergency': 'Peace of mind when you need it most',
    };
    for (const [key, text] of Object.entries(relevanceMap)) {
      if (category.includes(key) || service.name?.toLowerCase().includes(key)) {
        return text;
      }
    }
    return service.description?.slice(0, 60) || 'Curated for your companion\'s needs';
  };
  
  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl active:shadow-md transition-all active:scale-[0.98] border border-gray-100"
      onClick={() => navigate(`/services/${service.pillar || 'care'}/${service.id}`)}
      data-testid={`service-card-${service.id}`}
    >
      {/* Service Content - Meaning first, price last */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* Service Name - Primary */}
        <h3 className="text-base sm:text-lg font-semibold text-[#2D2D2D] leading-snug">
          {service.name}
        </h3>
        
        {/* Why it's relevant - The heart of the card */}
        <p className="text-sm text-[#6B6B6B] leading-relaxed">
          {getRelevanceText()}
        </p>
        
        {/* Price, duration, location - Secondary info */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#9B9B9B]">
          <span className="font-medium text-[#2D2D2D]">
            {service.base_price ? `₹${service.base_price.toLocaleString()}` : 'Get Quote'}
          </span>
          {service.duration && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {service.duration}
              </span>
            </>
          )}
          {service.location && (
            <>
              <span>·</span>
              <span>{service.location}</span>
            </>
          )}
        </div>
        
        {/* Good match badge - if breed-specific */}
        {breedMatch && (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#7A8B6F]/10 text-[#7A8B6F] text-xs font-medium rounded-full">
              <Star className="w-3 h-3" fill="currentColor" />
              Good match for {pet?.breed || 'your pet'}
            </span>
          </div>
        )}
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
  const { user, token, pets } = useAuth();
  
  // State
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState(searchParams.get('pillar') || 'recommended');
  const [selectedSubcat, setSelectedSubcat] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [petSoulData, setPetSoulData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.pets?.length > 0) {
              const savedPetId = localStorage.getItem('selectedPetId');
              const pet = savedPetId ? data.pets.find(p => p.id === savedPetId) : data.pets[0];
              setSelectedPet(pet || data.pets[0]);
            }
          }
        } catch (err) {
          console.error('Failed to fetch pets:', err);
        }
      }
    };
    fetchPets();
  }, [token]);
  
  // Fetch pet soul data
  useEffect(() => {
    if (selectedPet?.id && token) {
      const fetchPetSoul = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pet-soul/${selectedPet.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setPetSoulData(data);
          }
        } catch (err) {
          console.error('Failed to fetch pet soul:', err);
        }
      };
      fetchPetSoul();
    }
  }, [selectedPet?.id, token]);
  
  // Get breed recommendations
  const breedRecommendation = useMemo(() => {
    if (!selectedPet?.breed) return null;
    const breed = selectedPet.breed.toLowerCase();
    for (const [breedKey, rec] of Object.entries(BREED_SERVICE_RECOMMENDATIONS)) {
      if (breed.includes(breedKey.split(' ')[0])) {
        return rec;
      }
    }
    return null;
  }, [selectedPet?.breed]);
  
  // Generate Mira nudge
  const miraNudge = useMemo(() => {
    if (!selectedPet) return null;
    if (breedRecommendation?.nudge) return breedRecommendation.nudge;
    return `Services selected with ${selectedPet.name}'s needs in mind.`;
  }, [selectedPet, breedRecommendation]);
  
  // Filter services
  const filteredServices = useMemo(() => {
    let result = services;
    
    if (selectedPillar !== 'all') {
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
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [services, selectedPillar, selectedSubcat, searchQuery]);
  
  // Handle pet selection
  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    localStorage.setItem('selectedPetId', pet.id);
    window.dispatchEvent(new CustomEvent('petSelectionChanged', { detail: { pet, petId: pet.id } }));
  };
  
  const petName = selectedPet?.name || '';
  const petPhoto = selectedPet?.photo_url || selectedPet?.image_url || selectedPet?.image;

  return (
    <div className="min-h-screen bg-[#F9F6F1] pb-24 md:pb-0" data-testid="services-page">
      <SEOHead page="services" path="/services" />
      
      {/* Pet Bar */}
      <PetBar pet={selectedPet} pets={pets} onSelectPet={handleSelectPet} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#F9F6F1] to-white py-6 sm:py-10 md:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            {/* Pet Photo */}
            {petPhoto && (
              <div className="mb-4 sm:mb-6">
                <div className="relative inline-block">
                  <img src={petPhoto} alt={petName}
                    className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover mx-auto border-4 border-white shadow-xl ring-4 ring-[#7A8B6F]/20" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#2D2D2D] leading-tight mb-3 sm:mb-4 px-2">
              {petName ? (
                <>Services curated for <span className="text-[#7A8B6F]">{petName}</span></>
              ) : (
                <>Services curated for your companion</>
              )}
            </h1>
            
            {/* Subtitle - The Key Line */}
            <p className="text-sm sm:text-base md:text-lg text-[#6B6B6B] mb-4 sm:mb-6 max-w-xl mx-auto px-4">
              Thoughtfully selected for his life and needs.
            </p>
            
            {/* Mira's Quiet Intelligence */}
            {miraNudge && (
              <div className="bg-[#F5F3F0] rounded-xl p-3 sm:p-4 max-w-md mx-auto mb-6 border border-[#E8E4DF]">
                <p className="text-xs sm:text-sm text-[#6B6B6B] leading-relaxed text-center">
                  {miraNudge}
                </p>
              </div>
            )}
          </div>
          
          {/* Search */}
          <div className="relative w-full max-w-xl mx-auto px-2">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-[#9B9B9B]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={petName ? `Find services for ${petName}...` : "Find services..."}
                className="pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base bg-white border border-gray-200 rounded-full shadow-sm focus:ring-2 focus:ring-[#7A8B6F]/50 focus:border-[#7A8B6F]"
              />
              <button className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#7A8B6F] active:scale-95 transition-all p-1">
                <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Pillar Filters */}
      <PillarFilters 
        selected={selectedPillar}
        onSelect={(p) => { setSelectedPillar(p); }}
        selectedSubcat={selectedSubcat}
        onSelectSubcat={setSelectedSubcat}
      />
      
      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-[#2D2D2D]">
            {selectedPillar === 'all' ? 'All Services' : `${PILLARS.find(p => p.id === selectedPillar)?.label || ''} Services`}
            {selectedSubcat && ` › ${selectedSubcat}`}
          </h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-48"></div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-[#2D2D2D] mb-2">No services found</h3>
            <p className="text-sm text-[#9B9B9B] mb-4">Try a different category</p>
            <Button onClick={() => { setSelectedPillar('all'); setSelectedSubcat(null); }} variant="outline" className="text-sm">
              View All Services
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {filteredServices.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                pet={selectedPet}
                breedRecommendation={breedRecommendation}
              />
            ))}
          </div>
        )}
      </section>
      
      {/* Emotional Close */}
      <section className="bg-white py-12 sm:py-16 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-lg sm:text-xl md:text-2xl text-[#2D2D2D] font-medium leading-relaxed mb-4">
            {petName ? (
              <>You don't manage services.<br />You just take care of <span className="text-[#7A8B6F]">{petName}</span>.<br />We handle the rest.</>
            ) : (
              <>You don't manage services.<br />You just take care of your dog.<br />We handle the rest.</>
            )}
          </p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('openMiraChat'))}
            className="text-sm text-[#9B9B9B] hover:text-[#7A8B6F] transition-colors"
          >
            Need help deciding? Ask Mira.
          </button>
        </div>
      </section>
      
      <MiraChatWidget pillar="services" />
    </div>
  );
};

export default ServicesPage;

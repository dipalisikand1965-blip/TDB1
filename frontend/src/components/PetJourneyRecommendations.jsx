/**
 * PetJourneyRecommendations.jsx
 * 
 * THE SOUL OF RECOMMENDATIONS
 * - Mobile-first (99% users on mobile)
 * - Cross-pillar journeys (not transactions, but emotional flows)
 * - Pet Soul aware (allergies, preferences, life stage)
 * - Mira is the memory that binds everything
 * 
 * This is NOT a product carousel. This is a JOURNEY BUILDER.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { API_URL } from '../utils/api';
import { getPetPhotoUrl } from '../utils/petAvatar';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import {
  Sparkles, ChevronRight, Heart, ShoppingCart, Plus, Check,
  Cake, Utensils, Camera, Gift, Plane, Hotel, Scissors, 
  GraduationCap, Music, PawPrint, AlertCircle, Star, Loader2,
  ArrowRight, Calendar, MapPin, PartyPopper
} from 'lucide-react';

// Journey types - Cross-pillar emotional flows
const JOURNEY_TEMPLATES = {
  birthday: {
    id: 'birthday',
    title: "'s Birthday Journey",
    icon: Cake,
    gradient: 'from-pink-500 to-rose-500',
    bgGradient: 'from-pink-50 to-rose-50',
    pillars: ['celebrate', 'dine', 'enjoy', 'shop'],
    description: 'Make it magical from cake to celebration'
  },
  vacation: {
    id: 'vacation',
    title: "'s Vacation Adventure", 
    icon: Plane,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50',
    pillars: ['travel', 'stay', 'dine', 'enjoy'],
    description: 'Plan the perfect getaway together'
  },
  wellness: {
    id: 'wellness',
    title: "'s Wellness Day",
    icon: Heart,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 to-teal-50',
    pillars: ['care', 'fit', 'dine', 'shop'],
    description: 'Pamper and rejuvenate'
  },
  adoption_anniversary: {
    id: 'adoption_anniversary',
    title: "'s Gotcha Day",
    icon: PartyPopper,
    gradient: 'from-purple-500 to-violet-500',
    bgGradient: 'from-purple-50 to-violet-50',
    pillars: ['celebrate', 'enjoy', 'dine', 'shop'],
    description: 'Celebrate the day you found each other'
  },
  training: {
    id: 'training',
    title: "'s Learning Path",
    icon: GraduationCap,
    gradient: 'from-amber-500 to-orange-500',
    bgGradient: 'from-amber-50 to-orange-50',
    pillars: ['learn', 'fit', 'care', 'shop'],
    description: 'Build skills and confidence'
  },
  grooming: {
    id: 'grooming',
    title: "'s Spa Day",
    icon: Scissors,
    gradient: 'from-rose-500 to-pink-500',
    bgGradient: 'from-rose-50 to-pink-50',
    pillars: ['care', 'shop', 'dine', 'enjoy'],
    description: 'Look good, feel great'
  }
};

// Pillar icons for journey steps
const PILLAR_ICONS = {
  fit: { icon: Heart, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  care: { icon: Scissors, color: 'text-pink-600', bg: 'bg-pink-100' },
  celebrate: { icon: Cake, color: 'text-amber-600', bg: 'bg-amber-100' },
  dine: { icon: Utensils, color: 'text-red-600', bg: 'bg-red-100' },
  stay: { icon: Hotel, color: 'text-blue-600', bg: 'bg-blue-100' },
  travel: { icon: Plane, color: 'text-purple-600', bg: 'bg-purple-100' },
  learn: { icon: GraduationCap, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  enjoy: { icon: Music, color: 'text-orange-600', bg: 'bg-orange-100' },
  shop: { icon: Gift, color: 'text-violet-600', bg: 'bg-violet-100' },
};

const PetJourneyRecommendations = ({ 
  currentPillar = 'fit',
  className = '' 
}) => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [journeys, setJourneys] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soulIncomplete, setSoulIncomplete] = useState(false);

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || [];
          setUserPets(pets);
          if (pets.length > 0) {
            setSelectedPet(pets[0]);
            // Check if pet soul is incomplete
            const firstPet = pets[0];
            const hasAllergies = firstPet.allergies?.length > 0 || firstPet.health?.allergies?.length > 0;
            const hasPreferences = firstPet.preferences || firstPet.doggy_soul_answers;
            setSoulIncomplete(!hasAllergies && !hasPreferences);
          }
        }
      } catch (error) {
        console.debug('Error fetching pets:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPets();
  }, [token]);

  // Generate journeys based on selected pet and context
  useEffect(() => {
    if (!selectedPet) return;
    
    generateJourneys();
    fetchRecommendations();
  }, [selectedPet, currentPillar]);

  const generateJourneys = () => {
    const petJourneys = [];
    
    // Check for upcoming occasions
    const today = new Date();
    const petBirthday = selectedPet.birthday ? new Date(selectedPet.birthday) : null;
    const adoptionDate = selectedPet.adoption_date ? new Date(selectedPet.adoption_date) : null;
    
    // Birthday journey if birthday is within 30 days
    if (petBirthday) {
      const nextBirthday = new Date(petBirthday);
      nextBirthday.setFullYear(today.getFullYear());
      if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
      
      const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 30) {
        petJourneys.push({
          ...JOURNEY_TEMPLATES.birthday,
          urgency: daysUntil <= 7 ? 'urgent' : 'upcoming',
          daysUntil,
          petName: selectedPet.name
        });
      }
    }
    
    // Gotcha day journey
    if (adoptionDate) {
      const nextGotchaDay = new Date(adoptionDate);
      nextGotchaDay.setFullYear(today.getFullYear());
      if (nextGotchaDay < today) nextGotchaDay.setFullYear(today.getFullYear() + 1);
      
      const daysUntil = Math.ceil((nextGotchaDay - today) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 30) {
        petJourneys.push({
          ...JOURNEY_TEMPLATES.adoption_anniversary,
          urgency: daysUntil <= 7 ? 'urgent' : 'upcoming',
          daysUntil,
          petName: selectedPet.name
        });
      }
    }
    
    // Context-based journeys based on current pillar
    const contextJourneys = {
      stay: [JOURNEY_TEMPLATES.vacation],
      travel: [JOURNEY_TEMPLATES.vacation],
      care: [JOURNEY_TEMPLATES.wellness, JOURNEY_TEMPLATES.grooming],
      fit: [JOURNEY_TEMPLATES.wellness, JOURNEY_TEMPLATES.training],
      celebrate: [JOURNEY_TEMPLATES.birthday],
      learn: [JOURNEY_TEMPLATES.training],
      dine: [JOURNEY_TEMPLATES.wellness],
      enjoy: [JOURNEY_TEMPLATES.wellness]
    };
    
    const pillarJourneys = contextJourneys[currentPillar] || [];
    pillarJourneys.forEach(j => {
      if (!petJourneys.find(pj => pj.id === j.id)) {
        petJourneys.push({ ...j, petName: selectedPet.name });
      }
    });
    
    setJourneys(petJourneys.slice(0, 3)); // Max 3 journeys
  };

  const fetchRecommendations = async () => {
    if (!selectedPet || !token) return;
    
    try {
      // Fetch personalized recommendations from backend
      const response = await fetch(`${API_URL}/api/recommendations/journey`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          pet_id: selectedPet.id || selectedPet._id,
          pillar: currentPillar,
          pet_allergies: selectedPet.allergies || selectedPet.health?.allergies || [],
          pet_size: selectedPet.size,
          pet_age: selectedPet.age,
          pet_breed: selectedPet.breed
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.debug('Recommendations fetch error:', error);
      // Fallback: generate local recommendations
      generateLocalRecommendations();
    }
  };

  const generateLocalRecommendations = () => {
    // Fallback recommendations based on pillar
    const pillarRecs = {
      stay: [
        { name: 'Pet-Friendly Resort', type: 'service', pillar: 'stay', price: 5000 },
        { name: 'Travel Kit Bundle', type: 'product', pillar: 'shop', price: 1500 },
      ],
      celebrate: [
        { name: 'Birthday Cake', type: 'product', pillar: 'celebrate', price: 800 },
        { name: 'Party Bandana', type: 'product', pillar: 'shop', price: 350 },
        { name: 'Pet Photoshoot', type: 'service', pillar: 'enjoy', price: 2500 },
      ],
      care: [
        { name: 'Full Grooming', type: 'service', pillar: 'care', price: 1200 },
        { name: 'Spa Treatment', type: 'service', pillar: 'care', price: 800 },
      ]
    };
    
    setRecommendations(pillarRecs[currentPillar] || []);
  };

  const handleJourneyStart = async (journey) => {
    // Record intent - creates ticket
    try {
      await fetch(`${API_URL}/api/engagement/journey-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          journey_id: journey.id,
          pet_id: selectedPet?.id,
          pet_name: selectedPet?.name,
          pillars: journey.pillars
        })
      });
    } catch (err) {
      console.debug('Journey intent logging:', err);
    }
    
    // Navigate to Mira with journey context
    const message = `I want to plan ${journey.title.replace("'s", ` ${selectedPet?.name}'s`)}`;
    navigate(`/mira?context=journey_${journey.id}&pet=${selectedPet?.id}&preset=${encodeURIComponent(message)}`);
  };

  const handleCompleteSoul = () => {
    navigate(`/pet-profile/${selectedPet?.id || selectedPet?._id}?section=soul`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!token || userPets.length === 0) {
    return (
      <Card className={`p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100 ${className}`}>
        <div className="text-center">
          <Sparkles className="w-10 h-10 text-purple-500 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">Personalized Just for Your Pet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Sign in to see recommendations tailored to your pet's unique personality and needs.
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            Sign In to Personalize
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ===== PET SELECTOR - Compact, Mobile-First ===== */}
      {userPets.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <span className="text-xs text-gray-500 flex-shrink-0">For:</span>
          {userPets.map((pet) => {
            const isSelected = selectedPet?.id === pet.id || selectedPet?._id === pet._id;
            return (
              <motion.button
                key={pet.id || pet._id}
                onClick={() => setSelectedPet(pet)}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full flex-shrink-0 transition-all ${
                  isSelected 
                    ? 'bg-purple-100 border-2 border-purple-500' 
                    : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                }`}
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-purple-200">
                  <img 
                    src={getPetPhotoUrl(pet)} 
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-700'}`}>
                  {pet.name}
                </span>
                {isSelected && <Check className="w-3 h-3 text-purple-600" />}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ===== SOUL INCOMPLETE PROMPT ===== */}
      {soulIncomplete && selectedPet && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">
                  Complete {selectedPet.name}'s Soul Profile
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Tell us about allergies, preferences & personality — I'll recommend even better! 
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={handleCompleteSoul}
                className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
              >
                Complete
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ===== JOURNEY CARDS - Cross-Pillar Flows ===== */}
      {journeys.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              {selectedPet?.name}'s Journeys
            </h3>
          </div>
          
          <div className="space-y-3">
            {journeys.map((journey, idx) => {
              const JourneyIcon = journey.icon;
              return (
                <motion.div
                  key={journey.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card 
                    className={`p-4 bg-gradient-to-br ${journey.bgGradient} border-0 cursor-pointer hover:shadow-lg transition-all`}
                    onClick={() => handleJourneyStart(journey)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Journey Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${journey.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                        <JourneyIcon className="w-6 h-6 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Title with urgency badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {selectedPet?.name}{journey.title}
                          </h4>
                          {journey.urgency === 'urgent' && (
                            <Badge className="bg-red-500 text-white text-[10px]">
                              In {journey.daysUntil} days!
                            </Badge>
                          )}
                          {journey.urgency === 'upcoming' && (
                            <Badge className="bg-amber-500 text-white text-[10px]">
                              {journey.daysUntil} days away
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-0.5">{journey.description}</p>
                        
                        {/* Pillar flow visualization */}
                        <div className="flex items-center gap-1 mt-2 overflow-x-auto">
                          {journey.pillars.map((pillar, pIdx) => {
                            const PillarIcon = PILLAR_ICONS[pillar]?.icon || PawPrint;
                            const pillarColor = PILLAR_ICONS[pillar]?.color || 'text-gray-600';
                            const pillarBg = PILLAR_ICONS[pillar]?.bg || 'bg-gray-100';
                            return (
                              <React.Fragment key={pillar}>
                                <div 
                                  className={`w-7 h-7 rounded-lg ${pillarBg} flex items-center justify-center flex-shrink-0`}
                                  title={pillar.charAt(0).toUpperCase() + pillar.slice(1)}
                                >
                                  <PillarIcon className={`w-3.5 h-3.5 ${pillarColor}`} />
                                </div>
                                {pIdx < journey.pillars.length - 1 && (
                                  <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== QUICK PICKS - Pillar Specific ===== */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Quick Picks for {selectedPet?.name}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <Card 
                key={idx}
                className="p-3 hover:shadow-md transition-all cursor-pointer"
                onClick={() => {
                  if (rec.type === 'product') {
                    addToCart({ ...rec, pillar: rec.pillar || currentPillar });
                    toast({ title: '🛒 Added!', description: rec.name });
                  } else {
                    navigate(`/${rec.pillar}?service=${rec.id}`);
                  }
                }}
              >
                <div className="aspect-square rounded-lg bg-gray-100 mb-2 overflow-hidden">
                  {rec.image ? (
                    <img src={rec.image} alt={rec.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-900 line-clamp-2">{rec.name}</p>
                {rec.price && (
                  <p className="text-xs text-purple-600 font-semibold mt-1">₹{rec.price}</p>
                )}
                <Badge 
                  variant="outline" 
                  className="mt-1 text-[10px] capitalize"
                >
                  {rec.pillar || currentPillar}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PetJourneyRecommendations;

/**
 * PetSoulOnboarding - 10-Step Soul Capture Flow
 * ==============================================
 * Premium onboarding experience inspired by luminaireclub.com
 * Goal: Capture 80%+ soul score before user enters main app
 * 
 * Design Principles:
 * - One question/concept per step
 * - Beautiful full-screen illustrations
 * - Progress feels like a journey, not a form
 * - Micro-animations for delight
 * - Mobile-first, iOS premium feel
 * 
 * Steps:
 * 1. Welcome + Pet Name
 * 2. Pet Photo (AI breed detection)
 * 3. Age & Life Stage
 * 4. Personality Core (temperament + energy)
 * 5. Health Essentials (allergies + conditions)
 * 6. Social World (dogs + people)
 * 7. Comfort Zone (vet + grooming + noise)
 * 8. Food & Treats
 * 9. Training & Behavior
 * 10. Family & Home (final step)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PawPrint, Camera, Calendar, Sparkles, Heart, Users, Shield, 
  Utensils, GraduationCap, Home, ChevronRight, ChevronLeft, 
  Check, Loader2, Star, Zap, Volume2, Dog, Cat, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../utils/api';
import hapticFeedback from '../utils/haptic';

// ============ STEP CONFIGURATIONS ============

const STEPS = [
  {
    id: 'welcome',
    title: "Let's meet your pet",
    subtitle: "What do they answer to?",
    icon: PawPrint,
    gradient: 'from-purple-600 to-pink-600',
    fields: ['name', 'species']
  },
  {
    id: 'photo',
    title: "Show us that face",
    subtitle: "We'll even guess their breed",
    icon: Camera,
    gradient: 'from-pink-600 to-rose-600',
    fields: ['photo', 'breed']
  },
  {
    id: 'age',
    title: "How old are they?",
    subtitle: "Puppies and seniors need different care",
    icon: Calendar,
    gradient: 'from-amber-500 to-orange-600',
    fields: ['dob', 'life_stage', 'gender']
  },
  {
    id: 'personality',
    title: "What's their vibe?",
    subtitle: "Every pet has a unique energy",
    icon: Sparkles,
    gradient: 'from-violet-600 to-purple-600',
    fields: ['temperament', 'energy_level']
  },
  {
    id: 'health',
    title: "Health first, always",
    subtitle: "Mira will never recommend anything unsafe",
    icon: Heart,
    gradient: 'from-red-500 to-pink-600',
    fields: ['food_allergies', 'health_conditions']
  },
  {
    id: 'social',
    title: "Their social world",
    subtitle: "How do they feel around others?",
    icon: Users,
    gradient: 'from-blue-500 to-cyan-600',
    fields: ['social_with_dogs', 'social_with_people']
  },
  {
    id: 'comfort',
    title: "What makes them anxious?",
    subtitle: "We'll help them stay calm",
    icon: Shield,
    gradient: 'from-teal-500 to-emerald-600',
    fields: ['vet_comfort', 'grooming_tolerance', 'noise_sensitivity', 'alone_time_comfort']
  },
  {
    id: 'food',
    title: "The way to their heart",
    subtitle: "Is through their stomach",
    icon: Utensils,
    gradient: 'from-orange-500 to-amber-600',
    fields: ['favorite_protein', 'food_motivation', 'treat_preference']
  },
  {
    id: 'training',
    title: "How's their training?",
    subtitle: "From sit to somersaults",
    icon: GraduationCap,
    gradient: 'from-indigo-500 to-violet-600',
    fields: ['training_level', 'motivation_type', 'behavior_issues']
  },
  {
    id: 'home',
    title: "Almost there!",
    subtitle: "A few more details about their world",
    icon: Home,
    gradient: 'from-slate-600 to-zinc-700',
    fields: ['primary_bond', 'other_pets', 'kids_at_home', 'car_comfort']
  }
];

// ============ OPTION CONFIGS ============

const OPTIONS = {
  species: [
    { value: 'dog', label: 'Dog', icon: Dog },
    { value: 'cat', label: 'Cat', icon: Cat }
  ],
  life_stage: [
    { value: 'puppy', label: 'Puppy/Kitten', sublabel: '< 1 year' },
    { value: 'young', label: 'Young Adult', sublabel: '1-3 years' },
    { value: 'adult', label: 'Adult', sublabel: '3-8 years' },
    { value: 'senior', label: 'Senior', sublabel: '8+ years' }
  ],
  gender: [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ],
  temperament: [
    { value: 'calm', label: 'Calm & Chill', emoji: '😌' },
    { value: 'playful', label: 'Playful & Fun', emoji: '🎾' },
    { value: 'energetic', label: 'High Energy', emoji: '⚡' },
    { value: 'shy', label: 'Shy & Reserved', emoji: '🙈' },
    { value: 'anxious', label: 'Anxious', emoji: '😰' },
    { value: 'curious', label: 'Curious Explorer', emoji: '🔍' }
  ],
  energy_level: [
    { value: 'low', label: 'Couch Potato', emoji: '🛋️' },
    { value: 'moderate', label: 'Balanced', emoji: '⚖️' },
    { value: 'high', label: 'Energizer Bunny', emoji: '🔋' }
  ],
  social_with_dogs: [
    { value: 'loves_all', label: 'Best friends with everyone' },
    { value: 'selective', label: 'Picks their friends carefully' },
    { value: 'shy', label: 'Takes time to warm up' },
    { value: 'reactive', label: 'Needs careful introductions' },
    { value: 'prefers_alone', label: 'Prefers to be the only pet' }
  ],
  social_with_people: [
    { value: 'social_butterfly', label: 'Loves everyone' },
    { value: 'friendly', label: 'Friendly after intro' },
    { value: 'reserved', label: 'Takes time to trust' },
    { value: 'anxious', label: 'Gets overwhelmed easily' }
  ],
  vet_comfort: [
    { value: 'comfortable', label: 'No problem at all' },
    { value: 'nervous', label: 'A bit nervous' },
    { value: 'anxious', label: 'Gets very stressed' },
    { value: 'terrified', label: 'Full panic mode' }
  ],
  grooming_tolerance: [
    { value: 'loves_it', label: 'Loves spa day' },
    { value: 'tolerates', label: 'Tolerates it' },
    { value: 'sensitive', label: 'Sensitive in some areas' },
    { value: 'difficult', label: 'Major struggle' }
  ],
  noise_sensitivity: [
    { value: 'unfazed', label: 'Sleeps through anything' },
    { value: 'alert', label: 'Alert but fine' },
    { value: 'nervous', label: 'Gets nervous' },
    { value: 'terrified', label: 'Needs lots of comfort' }
  ],
  alone_time_comfort: [
    { value: 'independent', label: '8+ hours no problem' },
    { value: 'moderate', label: '4-6 hours is fine' },
    { value: 'short', label: '2-4 hours max' },
    { value: 'separation_anxiety', label: 'Has separation anxiety' }
  ],
  favorite_protein: [
    { value: 'chicken', label: 'Chicken' },
    { value: 'lamb', label: 'Lamb' },
    { value: 'beef', label: 'Beef' },
    { value: 'fish', label: 'Fish' },
    { value: 'pork', label: 'Pork' },
    { value: 'vegetarian', label: 'Vegetarian' }
  ],
  food_motivation: [
    { value: 'very_high', label: 'Will do anything for food' },
    { value: 'moderate', label: 'Food is nice' },
    { value: 'low', label: 'Picky eater' }
  ],
  treat_preference: [
    { value: 'soft', label: 'Soft & chewy' },
    { value: 'crunchy', label: 'Crunchy' },
    { value: 'meaty', label: 'Real meat' },
    { value: 'dental', label: 'Dental chews' }
  ],
  training_level: [
    { value: 'none', label: 'Just starting out' },
    { value: 'basic', label: 'Knows basics (sit, stay)' },
    { value: 'intermediate', label: 'Good training' },
    { value: 'advanced', label: 'Trick champion' }
  ],
  motivation_type: [
    { value: 'food', label: 'Food motivated' },
    { value: 'toys', label: 'Toy motivated' },
    { value: 'praise', label: 'Praise lover' },
    { value: 'play', label: 'Play is the reward' }
  ],
  car_comfort: [
    { value: 'loves_it', label: 'Head out the window' },
    { value: 'fine', label: 'Fine with rides' },
    { value: 'nervous', label: 'Gets nervous' },
    { value: 'sick', label: 'Gets car sick' }
  ]
};

// ============ MAIN COMPONENT ============

const PetSoulOnboarding = ({ userId, onComplete }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward
  const [loading, setLoading] = useState(false);
  const [petData, setPetData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    photo_url: '',
    dob: '',
    life_stage: '',
    gender: '',
    temperament: '',
    energy_level: '',
    food_allergies: [],
    health_conditions: [],
    social_with_dogs: '',
    social_with_people: '',
    vet_comfort: '',
    grooming_tolerance: '',
    noise_sensitivity: '',
    alone_time_comfort: '',
    favorite_protein: '',
    food_motivation: '',
    treat_preference: '',
    training_level: '',
    motivation_type: '',
    behavior_issues: [],
    primary_bond: '',
    other_pets: '',
    kids_at_home: '',
    car_comfort: ''
  });
  
  // ============ HANDLERS ============
  
  const updateField = useCallback((field, value) => {
    setPetData(prev => ({ ...prev, [field]: value }));
    hapticFeedback.buttonTap();
  }, []);
  
  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
      hapticFeedback.cardTap();
    }
  }, [currentStep]);
  
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
      hapticFeedback.buttonTap();
    }
  }, [currentStep]);
  
  const completeOnboarding = useCallback(async () => {
    setLoading(true);
    try {
      // Submit pet data to API
      const response = await fetch(`${API_URL}/api/pets/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          pet_data: petData
        })
      });
      
      if (response.ok) {
        hapticFeedback.success();
        onComplete?.(petData);
        navigate('/mira-os');
      } else {
        throw new Error('Failed to save pet');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, petData, onComplete, navigate]);
  
  // ============ RENDER ============
  
  const step = STEPS[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / STEPS.length) * 100;
  
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-white/10">
        <motion.div 
          className={`h-full bg-gradient-to-r ${step.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button 
          onClick={prevStep}
          disabled={currentStep === 0}
          className={`p-2 rounded-full ${currentStep === 0 ? 'opacity-0' : 'opacity-100'}`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <span className="text-sm text-white/60">
          {currentStep + 1} of {STEPS.length}
        </span>
        
        <div className="w-10" /> {/* Spacer */}
      </div>
      
      {/* Main Content */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col px-6"
        >
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold mb-2">{step.title}</h1>
          <p className="text-white/60 mb-8">{step.subtitle}</p>
          
          {/* Step-specific content would go here */}
          {/* This is a template - implement each step's UI */}
          <div className="flex-1">
            {/* Dynamic step content based on step.id */}
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Footer */}
      <div className="p-6 pb-safe">
        <button
          onClick={currentStep === STEPS.length - 1 ? completeOnboarding : nextStep}
          disabled={loading}
          className={`w-full py-4 rounded-2xl bg-gradient-to-r ${step.gradient} text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : currentStep === STEPS.length - 1 ? (
            <>
              Meet Mira
              <Sparkles className="w-5 h-5" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PetSoulOnboarding;

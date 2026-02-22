/**
 * MiraMeetsYourPet.jsx
 * 
 * World-class onboarding experience for The Doggy Company
 * 
 * Flow:
 * 1. Photo Hook - Upload photo, AI breed detection
 * 2. Gender (BEFORE name - so we can use his/her)
 * 3. Name + Nickname
 * 4. Birthday/Gotcha Day with date picker
 * 5. Parent Info - One clean screen with essentials
 * 6. Soul Game - 13 tap questions, one per screen (NO SKIP)
 * 7. Payoff Reveal - Show what Mira learned
 * 8. Pet Home - Default landing
 * 
 * Key Principles:
 * - One question per screen (tap game, not questionnaire)
 * - Instant "Mira now knows..." feedback after every answer
 * - Soul ring grows in real-time
 * - ALL questions compulsory (no skip)
 * - Supports adding pets to existing accounts (skip parent info if logged in)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Camera,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Heart,
  Check,
  X,
  Calendar,
  Shield,
  Utensils,
  Activity,
  Scissors,
  Users,
  PawPrint,
  Loader2,
  Eye,
  EyeOff,
  Cake,
  Home
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Check if user is already logged in
const getExistingAuth = () => {
  const token = localStorage.getItem('tdb_auth_token');
  const user = localStorage.getItem('user');
  if (token && user) {
    try {
      return { token, user: JSON.parse(user) };
    } catch {
      return null;
    }
  }
  return null;
};

// Soul Questions - 13 core questions for 30-35% soul score
const SOUL_QUESTIONS = [
  {
    id: 'life_stage',
    question: "What life stage is {pet} in?",
    icon: Calendar,
    options: [
      { value: 'puppy', label: 'Puppy', emoji: '🐶', desc: 'Under 1 year' },
      { value: 'young', label: 'Young Adult', emoji: '🐕', desc: '1-3 years' },
      { value: 'adult', label: 'Adult', emoji: '🦮', desc: '3-7 years' },
      { value: 'senior', label: 'Senior', emoji: '🐕‍🦺', desc: '7+ years' }
    ],
    miraKnows: (pet, val, pronoun) => `${pet} is a ${val}!`
  },
  {
    id: 'temperament',
    question: "{pet} is generally...",
    icon: Heart,
    options: [
      { value: 'playful', label: 'Playful', emoji: '🎾' },
      { value: 'calm', label: 'Calm', emoji: '😌' },
      { value: 'curious', label: 'Curious', emoji: '🔍' },
      { value: 'shy', label: 'Shy', emoji: '🙈' },
      { value: 'energetic', label: 'Energetic', emoji: '⚡' },
      { value: 'protective', label: 'Protective', emoji: '🛡️' }
    ],
    miraKnows: (pet, val) => `${pet} has a ${val} personality!`
  },
  {
    id: 'stranger_reaction',
    question: "How does {pet} react to strangers?",
    icon: Users,
    options: [
      { value: 'friendly', label: 'Friendly', emoji: '🤗', desc: 'Loves everyone' },
      { value: 'cautious', label: 'Cautious', emoji: '🤔', desc: 'Needs time to warm up' },
      { value: 'nervous', label: 'Nervous', emoji: '😰', desc: 'Gets anxious' },
      { value: 'protective', label: 'Protective', emoji: '🛡️', desc: 'Guards the family' },
      { value: 'indifferent', label: 'Indifferent', emoji: '😐', desc: 'Doesn\'t care' }
    ],
    miraKnows: (pet, val) => `${pet} is ${val} with new people`
  },
  {
    id: 'food_allergies',
    question: "Does {pet} have any food allergies?",
    icon: Utensils,
    multiSelect: true,
    options: [
      { value: 'none', label: 'None', emoji: '✅' },
      { value: 'chicken', label: 'Chicken', emoji: '🍗' },
      { value: 'beef', label: 'Beef', emoji: '🥩' },
      { value: 'grains', label: 'Grains', emoji: '🌾' },
      { value: 'dairy', label: 'Dairy', emoji: '🥛' },
      { value: 'fish', label: 'Fish', emoji: '🐟' }
    ],
    miraKnows: (pet, val) => val.includes('none') 
      ? `${pet} can eat anything!` 
      : `${pet} is allergic to ${val.join(', ')}`
  },
  {
    id: 'favorite_protein',
    question: "What's {pet}'s favorite protein?",
    icon: Utensils,
    options: [
      { value: 'chicken', label: 'Chicken', emoji: '🍗' },
      { value: 'lamb', label: 'Lamb', emoji: '🐑' },
      { value: 'fish', label: 'Fish', emoji: '🐟' },
      { value: 'beef', label: 'Beef', emoji: '🥩' },
      { value: 'duck', label: 'Duck', emoji: '🦆' },
      { value: 'not_sure', label: 'Not sure yet', emoji: '🤷' }
    ],
    miraKnows: (pet, val) => val === 'not_sure' 
      ? `We'll figure out ${pet}'s favorite soon!` 
      : `${pet} loves ${val}!`
  },
  {
    id: 'exercise_needs',
    question: "How much exercise does {pet} need?",
    icon: Activity,
    options: [
      { value: 'low', label: 'Low', emoji: '🚶', desc: '< 30 min/day' },
      { value: 'medium', label: 'Medium', emoji: '🏃', desc: '30-60 min/day' },
      { value: 'high', label: 'High', emoji: '🏃‍♂️💨', desc: '1-2 hours/day' },
      { value: 'very_high', label: 'Very High', emoji: '🚀', desc: '2+ hours/day' }
    ],
    miraKnows: (pet, val) => `${pet} needs ${val} exercise daily`
  },
  {
    id: 'health_conditions',
    question: "Does {pet} have any health conditions?",
    icon: Shield,
    multiSelect: true,
    options: [
      { value: 'none', label: 'None', emoji: '✅' },
      { value: 'allergies', label: 'Allergies', emoji: '🤧' },
      { value: 'arthritis', label: 'Arthritis', emoji: '🦴' },
      { value: 'sensitive_stomach', label: 'Sensitive tummy', emoji: '🤢' },
      { value: 'skin_issues', label: 'Skin issues', emoji: '🩹' },
      { value: 'anxiety', label: 'Anxiety', emoji: '😰' }
    ],
    miraKnows: (pet, val) => val.includes('none') 
      ? `${pet} is healthy!` 
      : `${pet} has ${val.join(', ')} - I'll keep this in mind`
  },
  {
    id: 'grooming_tolerance',
    question: "How does {pet} handle grooming?",
    icon: Scissors,
    options: [
      { value: 'loves', label: 'Loves it', emoji: '😍', desc: 'Total spa dog' },
      { value: 'tolerates', label: 'Tolerates', emoji: '😐', desc: 'Not a fan but okay' },
      { value: 'hates', label: 'Hates it', emoji: '😤', desc: 'Grooming is war' }
    ],
    miraKnows: (pet, val) => val === 'loves' 
      ? `${pet} loves spa day!` 
      : val === 'tolerates' 
        ? `${pet} tolerates grooming` 
        : `${pet} needs extra patience during grooming`
  },
  {
    id: 'separation_anxiety',
    question: "Does {pet} get anxious when left alone?",
    icon: Heart,
    options: [
      { value: 'no', label: 'No', emoji: '😊', desc: 'Independent pup' },
      { value: 'sometimes', label: 'Sometimes', emoji: '😕', desc: 'Depends on duration' },
      { value: 'yes', label: 'Yes', emoji: '😢', desc: 'Needs company' }
    ],
    miraKnows: (pet, val) => val === 'no' 
      ? `${pet} is independent!` 
      : val === 'sometimes' 
        ? `${pet} sometimes needs extra comfort` 
        : `${pet} needs extra love when alone - noted!`
  },
  {
    id: 'lives_with',
    question: "Who does {pet} live with?",
    icon: Users,
    options: [
      { value: 'just_me', label: 'Just me', emoji: '👤' },
      { value: 'partner', label: 'Partner', emoji: '👫' },
      { value: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
      { value: 'roommates', label: 'Roommates', emoji: '🏠' }
    ],
    miraKnows: (pet, val) => val === 'just_me' 
      ? `${pet} is your bestie!` 
      : `${pet} has a whole ${val} to love!`
  },
  {
    id: 'other_pets',
    question: "Any other pets at home?",
    icon: PawPrint,
    options: [
      { value: 'none', label: 'Just me', emoji: '👑', desc: 'Only child' },
      { value: 'dogs', label: 'Other dogs', emoji: '🐕' },
      { value: 'cats', label: 'Cats', emoji: '🐱' },
      { value: 'both', label: 'Dogs & Cats', emoji: '🐕🐱' },
      { value: 'other', label: 'Other animals', emoji: '🐰' }
    ],
    miraKnows: (pet, val) => val === 'none' 
      ? `${pet} rules the house!` 
      : `${pet} shares the house with ${val}`
  },
  {
    id: 'is_neutered',
    question: "Is {pet} spayed/neutered?",
    icon: Shield,
    options: [
      { value: 'yes', label: 'Yes', emoji: '✅' },
      { value: 'no', label: 'No', emoji: '❌' },
      { value: 'not_sure', label: 'Not sure', emoji: '🤷' }
    ],
    miraKnows: (pet, val) => val === 'yes' 
      ? `${pet} is fixed` 
      : val === 'no' 
        ? `${pet} is intact` 
        : `We'll figure this out`
  },
  {
    id: 'main_goal',
    question: "What do you want most for {pet}?",
    icon: Sparkles,
    multiSelect: true,
    options: [
      { value: 'health', label: 'Stay healthy', emoji: '💪' },
      { value: 'happiness', label: 'Be happy', emoji: '😊' },
      { value: 'training', label: 'Better training', emoji: '🎓' },
      { value: 'social', label: 'More friends', emoji: '🐕‍🦺' },
      { value: 'adventures', label: 'Adventures', emoji: '🏔️' },
      { value: 'comfort', label: 'Comfort & care', emoji: '🛋️' }
    ],
    miraKnows: (pet, val) => Array.isArray(val) 
      ? `${pet}'s goals: ${val.join(', ')}! I'm on it.`
      : `${pet}'s goal: ${val}! I'm on it.`
  }
];

// Common dog breeds for search
const COMMON_BREEDS = [
  'Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'Beagle', 
  'Poodle', 'Bulldog', 'Rottweiler', 'Dachshund', 'Boxer', 'Siberian Husky',
  'Shih Tzu', 'Pomeranian', 'Indie / Indian Pariah', 'Mixed Breed',
  'Cocker Spaniel', 'Border Collie', 'Doberman', 'Great Dane', 'Pug',
  'Maltese', 'Yorkshire Terrier', 'Chihuahua', 'Saint Bernard', 'Lhasa Apso'
];

// Soul Score Ring Component
const SoulRing = ({ percentage, size = 120, strokeWidth = 8, petName }) => {
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
          stroke="url(#soulGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
        <defs>
          <linearGradient id="soulGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{percentage}%</span>
        <span className="text-xs text-slate-400">Soul Score</span>
      </div>
    </div>
  );
};

// Main Component
const MiraMeetsYourPet = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Check if user is already logged in (for adding another pet)
  const existingAuth = getExistingAuth();
  const isAddingPet = !!existingAuth;
  
  // Screen state - ORDER: photo -> gender -> name -> birthday -> parent (skip if logged in) -> soul -> payoff
  const [screen, setScreen] = useState('photo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectingBreed, setDetectingBreed] = useState(false);
  
  // Photo & Pet Info
  const [petPhoto, setPetPhoto] = useState(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState(null);
  const [petGender, setPetGender] = useState(''); // boy or girl
  const [petName, setPetName] = useState('');
  const [petNickname, setPetNickname] = useState('');
  const [breedDetected, setBreedDetected] = useState('');
  const [breedConfirmed, setBreedConfirmed] = useState(false);
  const [breedConfidence, setBreedConfidence] = useState(0);
  const [showBreedSelector, setShowBreedSelector] = useState(false);
  const [breedSearch, setBreedSearch] = useState('');
  
  // Birthday Info
  const [birthdayType, setBirthdayType] = useState(''); // birthday, gotcha, approximate
  const [birthdayDate, setBirthdayDate] = useState('');
  const [gotchaDate, setGotchaDate] = useState('');
  const [approximateAge, setApproximateAge] = useState('');
  
  // Parent Info (only used for new users)
  const [parentData, setParentData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '', // Full address
    city: '', // Free text now
    pincode: '',
    password: '',
    acceptTerms: false,
    notifications: {
      orders: true,
      reminders: true,
      offers: true,
      soulWhispers: true
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(true);
  
  // Soul Game
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [miraKnowsFact, setMiraKnowsFact] = useState('');
  const [showMiraKnows, setShowMiraKnows] = useState(false);
  
  // Get pronoun based on gender
  const getPronoun = useCallback(() => {
    if (petGender === 'boy') return { subject: 'he', object: 'him', possessive: 'his' };
    if (petGender === 'girl') return { subject: 'she', object: 'her', possessive: 'her' };
    return { subject: 'they', object: 'them', possessive: 'their' };
  }, [petGender]);
  
  // Calculate soul score
  const calculateSoulScore = useCallback(() => {
    const answered = Object.keys(answers).length;
    const total = SOUL_QUESTIONS.length;
    return Math.round((answered / total) * 35);
  }, [answers]);
  
  const soulScore = calculateSoulScore();
  
  // Handle photo upload - AUTO TRIGGER breed detection
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPetPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPetPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
    
    // Auto-trigger AI breed detection
    setDetectingBreed(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/api/pets/detect-breed`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.breed) {
          setBreedDetected(data.breed);
          setBreedConfidence(data.confidence || 0.8);
          toast.success(`Mira detected: ${data.breed}`);
        } else {
          // No breed detected - ask user
          setShowBreedSelector(true);
        }
      } else {
        // API error - ask user manually
        setShowBreedSelector(true);
      }
    } catch (err) {
      console.log('Breed detection not available:', err);
      setShowBreedSelector(true);
    } finally {
      setDetectingBreed(false);
    }
  };
  
  // Handle WhatsApp same as phone
  useEffect(() => {
    if (sameAsPhone) {
      setParentData(prev => ({ ...prev, whatsapp: prev.phone }));
    }
  }, [sameAsPhone, parentData.phone]);
  
  // Handle soul answer
  const handleSoulAnswer = (questionId, value) => {
    const question = SOUL_QUESTIONS[currentQuestion];
    
    // Handle multi-select
    if (question.multiSelect) {
      const currentValues = answers[questionId] || [];
      let newValues;
      
      if (value === 'none') {
        newValues = ['none'];
      } else if (currentValues.includes('none')) {
        newValues = [value];
      } else if (currentValues.includes(value)) {
        newValues = currentValues.filter(v => v !== value);
      } else {
        newValues = [...currentValues, value];
      }
      
      setAnswers(prev => ({ ...prev, [questionId]: newValues }));
      
      // Show Mira knows
      if (newValues.length > 0) {
        const fact = question.miraKnows(petName || 'Your pet', newValues);
        setMiraKnowsFact(fact);
        setShowMiraKnows(true);
      }
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
      
      // Show Mira knows
      const fact = question.miraKnows(petName || 'Your pet', value);
      setMiraKnowsFact(fact);
      setShowMiraKnows(true);
      
      // Auto advance after delay
      setTimeout(() => {
        setShowMiraKnows(false);
        if (currentQuestion < SOUL_QUESTIONS.length - 1) {
          setCurrentQuestion(prev => prev + 1);
        } else {
          setScreen('payoff');
        }
      }, 1500);
    }
  };
  
  // Continue for multi-select
  const handleContinueMultiSelect = () => {
    setShowMiraKnows(false);
    if (currentQuestion < SOUL_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setScreen('payoff');
    }
  };
  
  // Submit parent info and create account
  const handleParentSubmit = async () => {
    // Validate required fields - show all errors at once
    const errors = [];
    
    if (!parentData.name.trim()) {
      errors.push('Please enter your name');
    }
    if (!parentData.email.trim() || !parentData.email.includes('@')) {
      errors.push('Please enter a valid email');
    }
    if (!parentData.phone.trim() || parentData.phone.length < 10) {
      errors.push('Please enter a valid phone number (10+ digits)');
    }
    // Address is now OPTIONAL
    if (!parentData.city.trim()) {
      errors.push('Please enter your city');
    }
    if (!parentData.password || parentData.password.length < 6) {
      errors.push('Password must be at least 6 characters');
    }
    if (!parentData.acceptTerms) {
      errors.push('Please accept the terms & privacy policy');
    }
    
    // Show all errors
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      console.log('[Onboarding] Validation failed:', errors);
      return;
    }
    
    // Move to soul game
    console.log('[Onboarding] Validation passed, moving to soul questions');
    toast.success('Great! Now let\'s learn about ' + petName);
    setScreen('soul');
  };
  
  // Build pet data object
  const buildPetData = () => ({
    name: petName,
    nickname: petNickname,
    breed: breedConfirmed ? breedDetected : (breedDetected || 'Mixed'),
    breed_detected: breedDetected,
    breed_confirmed: breedConfirmed,
    breed_confidence: breedConfidence,
    gender: petGender,
    birth_date: birthdayType === 'birthday' ? birthdayDate : '',
    gotcha_date: birthdayType === 'gotcha' ? gotchaDate : '',
    approximate_age: birthdayType === 'approximate' ? approximateAge : '',
    birthday_type: birthdayType,
    species: 'dog',
    photo: petPhotoPreview,
    is_neutered: answers.is_neutered === 'yes' ? true : answers.is_neutered === 'no' ? false : null,
    doggy_soul_answers: {
      temperament: answers.temperament,
      stranger_reaction: answers.stranger_reaction,
      food_allergies: answers.food_allergies,
      favorite_protein: answers.favorite_protein,
      exercise_needs: answers.exercise_needs,
      health_conditions: answers.health_conditions,
      grooming_tolerance: answers.grooming_tolerance,
      separation_anxiety: answers.separation_anxiety,
      lives_with: answers.lives_with,
      other_pets: answers.other_pets,
      life_stage: answers.life_stage,
      main_goal: answers.main_goal
    }
  });
  
  // Final submit - create account and pet (or just add pet if logged in)
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // If user is already logged in, just add the pet
      if (isAddingPet) {
        console.log('[Onboarding] Adding pet for existing user...');
        const petData = buildPetData();
        console.log('[Onboarding] Pet data:', petData);
        
        const response = await fetch(`${API_URL}/api/pets`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${existingAuth.token}`
          },
          body: JSON.stringify(petData)
        });
        
        const data = await response.json();
        console.log('[Onboarding] Add pet response:', data);
        
        if (!response.ok) {
          throw new Error(data.detail || data.message || 'Failed to add pet');
        }
        
        toast.success(`${petName} has been added to your family!`);
        
        // Navigate to Pet Home (the landing page)
        window.location.href = '/pet-home';
        return;
      }
      
      // Otherwise, create new account with pet
      console.log('[Onboarding] Creating new account...');
      const response = await fetch(`${API_URL}/api/membership/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: {
            name: parentData.name,
            email: parentData.email,
            phone: parentData.phone,
            whatsapp: parentData.whatsapp || parentData.phone,
            address: parentData.address,
            city: parentData.city,
            pincode: parentData.pincode,
            password: parentData.password,
            preferred_contact: 'whatsapp',
            notifications: parentData.notifications,
            accepted_terms: parentData.acceptTerms,
            accepted_privacy: parentData.acceptTerms
          },
          pets: [buildPetData()],
          plan_type: 'demo',
          pet_count: 1
        })
      });
      
      // Read response body ONCE
      const data = await response.json();
      console.log('[Onboarding] Create account response:', data);
      
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Failed to create account');
      }
      
      // Auto-login
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: parentData.email,
          password: parentData.password
        })
      });
      
      // Read login response body ONCE
      const loginData = await loginResponse.json();
      console.log('[Onboarding] Login response:', loginData);
      
      if (loginResponse.ok && loginData.access_token) {
        // Use the correct storage key that AuthContext expects
        localStorage.setItem('tdb_auth_token', loginData.access_token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        
        toast.success(`Welcome! ${petName}'s home is ready.`);
        
        // Force reload to ensure AuthContext picks up the new token
        // Navigate to Pet Home (the landing page)
        window.location.href = '/pet-home';
      } else {
        // Account created but login failed - redirect to login
        toast.info('Account created! Please login.');
        navigate('/login');
      }
      
    } catch (err) {
      console.error('[Onboarding] Error:', err);
      const errorMsg = err.message || 'Something went wrong';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter breeds for search
  const filteredBreeds = COMMON_BREEDS.filter(breed => 
    breed.toLowerCase().includes(breedSearch.toLowerCase())
  );
  
  // Render Photo Screen
  const renderPhotoScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">Mira</span>
      </div>
      
      {/* Show indicator when adding another pet */}
      {isAddingPet && (
        <div className="mb-4 px-4 py-2 bg-pink-500/20 border border-pink-500/30 rounded-full">
          <span className="text-pink-300 text-sm">Adding another pet to your family</span>
        </div>
      )}
      
      {!petPhotoPreview ? (
        <>
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            {isAddingPet ? 'Add another pet!' : 'Let Mira meet your pet'}
          </h1>
          <p className="text-slate-400 mb-8 text-center">
            Upload a photo and watch the magic happen
          </p>
          
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-64 h-64 rounded-full border-2 border-dashed border-pink-500/50 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 hover:bg-pink-500/5 transition-all"
          >
            <Camera className="w-16 h-16 text-pink-500 mb-4" />
            <span className="text-pink-500 font-medium">Upload Photo</span>
            <span className="text-slate-500 text-sm mt-1">or tap to take one</span>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </>
      ) : (
        <>
          {/* Photo uploaded - show breed detection */}
          <div className="relative mb-6">
            <img
              src={petPhotoPreview}
              alt="Pet"
              className="w-48 h-48 rounded-full object-cover border-4 border-pink-500"
            />
            <button
              onClick={() => {
                setPetPhoto(null);
                setPetPhotoPreview(null);
                setBreedDetected('');
                setBreedConfirmed(false);
                setShowBreedSelector(false);
              }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          {/* Detecting breed spinner */}
          {detectingBreed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-6"
            >
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-2" />
              <p className="text-slate-400">Mira is analyzing...</p>
            </motion.div>
          )}
          
          {/* Breed Detection Result */}
          {!detectingBreed && breedDetected && !breedConfirmed && !showBreedSelector && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <p className="text-slate-400 mb-2">
                {breedConfidence > 0.7 ? 'Mira thinks this is a' : 'Looks like a'}
              </p>
              <p className="text-2xl font-bold text-white mb-4">{breedDetected}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setBreedConfirmed(true);
                    setScreen('gender'); // Go to gender next
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium"
                >
                  <Check className="w-4 h-4 inline mr-1" /> Correct!
                </button>
                <button
                  onClick={() => setShowBreedSelector(true)}
                  className="px-6 py-2 bg-slate-800 text-white rounded-full font-medium border border-slate-700"
                >
                  Change
                </button>
              </div>
            </motion.div>
          )}
          
          {/* No breed detected OR user wants to change - show breed selector */}
          {!detectingBreed && showBreedSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 w-full max-w-sm"
            >
              <p className="text-slate-400 mb-3 text-center">What kind of dog is this?</p>
              <input
                type="text"
                placeholder="Search breed..."
                value={breedSearch}
                onChange={(e) => setBreedSearch(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 mb-3"
                autoFocus
              />
              
              {/* Breed suggestions */}
              <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                {filteredBreeds.map(breed => (
                  <button
                    key={breed}
                    onClick={() => {
                      setBreedDetected(breed);
                      setBreedSearch(breed);
                    }}
                    className={`w-full px-4 py-2 text-left rounded-lg transition-all ${
                      breedDetected === breed 
                        ? 'bg-pink-500/20 border border-pink-500 text-white' 
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {breed}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBreedDetected(breedSearch || 'Mixed Breed');
                    setBreedConfirmed(true);
                    setShowBreedSelector(false);
                    setScreen('gender');
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setBreedDetected('Mixed / Indie');
                    setBreedConfirmed(true);
                    setShowBreedSelector(false);
                    setScreen('gender');
                  }}
                  className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium border border-slate-700"
                >
                  Mixed / Not sure
                </button>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
  
  // Render Gender Screen (BEFORE name)
  const renderGenderScreen = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      {/* Back button */}
      <button
        onClick={() => setScreen('photo')}
        className="absolute top-4 left-4 p-2 rounded-full bg-slate-800"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      
      {/* Pet photo */}
      <img
        src={petPhotoPreview}
        alt="Pet"
        className="w-32 h-32 rounded-full object-cover border-4 border-pink-500/30 mb-6"
      />
      
      <h2 className="text-2xl font-bold text-white mb-2 text-center">
        Is this a boy or girl?
      </h2>
      <p className="text-slate-400 mb-8 text-center">
        So Mira knows how to refer to your pet
      </p>
      
      {/* Gender options */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => {
            setPetGender('boy');
            setScreen('name');
          }}
          className={`w-36 h-36 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
            petGender === 'boy' 
              ? 'border-blue-500 bg-blue-500/20' 
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <span className="text-5xl mb-2">♂️</span>
          <span className="text-white font-medium text-lg">Boy</span>
        </button>
        
        <button
          onClick={() => {
            setPetGender('girl');
            setScreen('name');
          }}
          className={`w-36 h-36 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
            petGender === 'girl' 
              ? 'border-pink-500 bg-pink-500/20' 
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <span className="text-5xl mb-2">♀️</span>
          <span className="text-white font-medium text-lg">Girl</span>
        </button>
      </div>
    </motion.div>
  );
  
  // Render Name Screen (AFTER gender)
  const renderNameScreen = () => {
    const pronoun = getPronoun();
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col items-center justify-center min-h-screen p-6"
      >
        {/* Back button */}
        <button
          onClick={() => setScreen('gender')}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        {/* Pet photo */}
        <img
          src={petPhotoPreview}
          alt="Pet"
          className="w-24 h-24 rounded-full object-cover border-4 border-pink-500/30 mb-6"
        />
        
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          What's {pronoun.possessive} name?
        </h2>
        <p className="text-slate-400 mb-6 text-center">
          The name you call {pronoun.object} every day
        </p>
        
        <div className="w-full max-w-sm">
          <input
            type="text"
            placeholder="e.g., Buddy"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-xl placeholder-slate-500 mb-4"
            autoFocus
          />
          
          {petName && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-slate-400 mb-3 text-center">
                Do you have a pet name for {petName}?
              </p>
              <input
                type="text"
                placeholder={`e.g., ${petName.slice(0,3)}baby, Little one (optional)`}
                value={petNickname}
                onChange={(e) => setPetNickname(e.target.value)}
                className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-center placeholder-slate-500 mb-6"
              />
              
              <button
                onClick={() => setScreen('birthday')}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30"
              >
                Continue <ChevronRight className="w-5 h-5 inline" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };
  
  // Render Birthday Screen
  const renderBirthdayScreen = () => {
    const pronoun = getPronoun();
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col items-center justify-center min-h-screen p-6"
      >
        {/* Back button */}
        <button
          onClick={() => setScreen('name')}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        {/* Pet photo & name */}
        <div className="flex items-center gap-3 mb-6">
          <img
            src={petPhotoPreview}
            alt={petName}
            className="w-16 h-16 rounded-full object-cover border-2 border-pink-500/30"
          />
          <div>
            <p className="text-white font-medium">{petName}</p>
            <p className="text-slate-400 text-sm">{breedDetected}</p>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          When did {petName} come into your life?
        </h2>
        <p className="text-slate-400 mb-8 text-center">
          So Mira can celebrate {pronoun.possessive} special days
        </p>
        
        <div className="w-full max-w-sm space-y-4">
          {/* Birthday option */}
          <button
            onClick={() => setBirthdayType('birthday')}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              birthdayType === 'birthday'
                ? 'border-pink-500 bg-pink-500/20'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Cake className="w-6 h-6 text-pink-500" />
              <div>
                <span className="text-white font-medium block">I know {pronoun.possessive} birthday</span>
                <span className="text-slate-400 text-sm">The actual date of birth</span>
              </div>
            </div>
          </button>
          
          {birthdayType === 'birthday' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pl-4"
            >
              <input
                type="date"
                value={birthdayDate}
                onChange={(e) => setBirthdayDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </motion.div>
          )}
          
          {/* Gotcha Day option */}
          <button
            onClick={() => setBirthdayType('gotcha')}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              birthdayType === 'gotcha'
                ? 'border-pink-500 bg-pink-500/20'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-purple-500" />
              <div>
                <span className="text-white font-medium block">I know the Gotcha Day</span>
                <span className="text-slate-400 text-sm">When {pronoun.subject} joined your family</span>
              </div>
            </div>
          </button>
          
          {birthdayType === 'gotcha' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pl-4"
            >
              <input
                type="date"
                value={gotchaDate}
                onChange={(e) => setGotchaDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              />
            </motion.div>
          )}
          
          {/* Approximate age option */}
          <button
            onClick={() => setBirthdayType('approximate')}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              birthdayType === 'approximate'
                ? 'border-pink-500 bg-pink-500/20'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-slate-400" />
              <div>
                <span className="text-white font-medium block">Just approximate age</span>
                <span className="text-slate-400 text-sm">That's okay, we'll estimate!</span>
              </div>
            </div>
          </button>
          
          {birthdayType === 'approximate' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pl-4"
            >
              <select
                value={approximateAge}
                onChange={(e) => setApproximateAge(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
              >
                <option value="">Select age</option>
                <option value="0-6months">Less than 6 months</option>
                <option value="6-12months">6-12 months</option>
                <option value="1-2years">1-2 years</option>
                <option value="2-4years">2-4 years</option>
                <option value="4-7years">4-7 years</option>
                <option value="7-10years">7-10 years</option>
                <option value="10+years">10+ years</option>
              </select>
            </motion.div>
          )}
          
          {/* Continue button */}
          {birthdayType && (
            <button
              onClick={() => {
                if (birthdayType === 'birthday' && !birthdayDate) {
                  toast.error('Please select the birthday');
                  return;
                }
                if (birthdayType === 'gotcha' && !gotchaDate) {
                  toast.error('Please select the gotcha day');
                  return;
                }
                if (birthdayType === 'approximate' && !approximateAge) {
                  toast.error('Please select approximate age');
                  return;
                }
                // Skip parent info if user is already logged in (adding another pet)
                setScreen(isAddingPet ? 'soul' : 'parent');
              }}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 mt-4"
            >
              Continue <ChevronRight className="w-5 h-5 inline" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };
  
  // Render Parent Info Screen
  const renderParentScreen = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-6 pb-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('birthday')}
          className="p-2 rounded-full bg-slate-800"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <img src={petPhotoPreview} alt={petName} className="w-8 h-8 rounded-full object-cover" />
          <span className="text-white font-medium">{petName}</span>
        </div>
        <div className="w-9" />
      </div>
      
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Now, a bit about you
        </h2>
        <p className="text-slate-400 mb-6 text-center">
          So Mira can reach you with {petName}'s picks and reminders
        </p>
        
        {/* Form */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your name"
            value={parentData.name}
            onChange={(e) => setParentData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
          
          <input
            type="email"
            placeholder="Email"
            value={parentData.email}
            onChange={(e) => setParentData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
          
          <input
            type="tel"
            placeholder="Phone number"
            value={parentData.phone}
            onChange={(e) => setParentData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sameAsPhone}
              onChange={(e) => setSameAsPhone(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500"
            />
            <span className="text-slate-400 text-sm">WhatsApp same as phone</span>
          </div>
          
          {!sameAsPhone && (
            <input
              type="tel"
              placeholder="WhatsApp number"
              value={parentData.whatsapp}
              onChange={(e) => setParentData(prev => ({ ...prev, whatsapp: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
            />
          )}
          
          {/* Full Address - NEW */}
          <textarea
            placeholder="Full address (House/Flat No., Street, Landmark)"
            value={parentData.address}
            onChange={(e) => setParentData(prev => ({ ...prev, address: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 resize-none"
          />
          
          {/* City - Now free text */}
          <input
            type="text"
            placeholder="City"
            value={parentData.city}
            onChange={(e) => setParentData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
          
          {/* Pincode */}
          <input
            type="text"
            placeholder="Pincode"
            value={parentData.pincode}
            onChange={(e) => setParentData(prev => ({ ...prev, pincode: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create password (min 6 characters)"
              value={parentData.password}
              onChange={(e) => setParentData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-slate-500" />
              ) : (
                <Eye className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>
          
          {/* Notifications */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-white font-medium mb-3">Notification preferences</p>
            <div className="space-y-2">
              {[
                { key: 'reminders', label: 'Pet reminders & health alerts' },
                { key: 'offers', label: 'Special offers & deals' },
                { key: 'soulWhispers', label: 'Soul Whispers (weekly questions)' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={parentData.notifications[key]}
                    onChange={(e) => setParentData(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, [key]: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-pink-500"
                  />
                  <span className="text-slate-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Terms */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={parentData.acceptTerms}
              onChange={(e) => setParentData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
              className="w-4 h-4 mt-1 rounded border-slate-600 bg-slate-800 text-pink-500"
            />
            <span className="text-slate-400 text-sm">
              I agree to the <a href="/terms" className="text-pink-400">Terms</a> and <a href="/privacy" className="text-pink-400">Privacy Policy</a>
            </span>
          </label>
          
          <button
            onClick={handleParentSubmit}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30"
          >
            Let's Go! <ChevronRight className="w-5 h-5 inline" />
          </button>
        </div>
      </div>
    </motion.div>
  );
  
  // Render Soul Game Screen (NO SKIP BUTTON)
  const renderSoulScreen = () => {
    const question = SOUL_QUESTIONS[currentQuestion];
    const QuestionIcon = question.icon;
    
    return (
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="min-h-screen flex flex-col"
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => currentQuestion > 0 ? setCurrentQuestion(prev => prev - 1) : setScreen(isAddingPet ? 'birthday' : 'parent')}
            className="p-2 rounded-full bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <SoulRing percentage={soulScore} size={48} strokeWidth={4} />
            <span className="text-slate-400 text-sm">Mira knows {petName}</span>
          </div>
          
          {/* NO SKIP BUTTON - All questions compulsory */}
          <div className="w-9" />
        </div>
        
        {/* Progress bar */}
        <div className="px-4 mb-4">
          <div className="h-1 bg-slate-800 rounded-full">
            <div
              className="h-1 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all"
              style={{ width: `${((currentQuestion + 1) / SOUL_QUESTIONS.length) * 100}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs mt-1 text-center">
            {currentQuestion + 1} of {SOUL_QUESTIONS.length}
          </p>
        </div>
        
        {/* Question */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Pet photo */}
          <img
            src={petPhotoPreview}
            alt={petName}
            className="w-24 h-24 rounded-full object-cover border-4 border-pink-500/30 mb-6"
          />
          
          {/* Question */}
          <div className="flex items-center gap-2 mb-2">
            <QuestionIcon className="w-5 h-5 text-pink-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {question.question.replace('{pet}', petName)}
          </h2>
          
          {/* Options */}
          <div className="w-full max-w-md grid grid-cols-2 gap-3">
            {question.options.map((option) => {
              const isSelected = question.multiSelect
                ? (answers[question.id] || []).includes(option.value)
                : answers[question.id] === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleSoulAnswer(question.id, option.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-pink-500 bg-pink-500/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <span className="text-2xl mb-1 block">{option.emoji}</span>
                  <span className="text-white font-medium block">{option.label}</span>
                  {option.desc && (
                    <span className="text-slate-500 text-xs">{option.desc}</span>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Continue button for multi-select */}
          {question.multiSelect && (answers[question.id] || []).length > 0 && (
            <button
              onClick={handleContinueMultiSelect}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium"
            >
              Continue <ChevronRight className="w-4 h-4 inline" />
            </button>
          )}
        </div>
        
        {/* Mira knows feedback */}
        <AnimatePresence>
          {showMiraKnows && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30 rounded-full"
            >
              <span className="text-white">
                <Sparkles className="w-4 h-4 inline mr-2 text-pink-400" />
                Mira now knows: {miraKnowsFact}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };
  
  // Render Payoff Screen (Fix: use petName not nickname in "Here's what Mira knows about")
  const renderPayoffScreen = () => {
    // Generate summary bullets
    const bullets = [];
    if (answers.temperament) bullets.push(`${answers.temperament} personality`);
    if (answers.stranger_reaction) bullets.push(`${answers.stranger_reaction} with strangers`);
    if (answers.food_allergies) {
      const allergies = answers.food_allergies;
      if (allergies.includes('none')) {
        bullets.push('No food allergies');
      } else {
        bullets.push(`Allergic to ${allergies.join(', ')}`);
      }
    }
    if (answers.exercise_needs) bullets.push(`Needs ${answers.exercise_needs} exercise`);
    if (answers.separation_anxiety === 'yes') bullets.push('Needs extra comfort when alone');
    if (answers.main_goal && Array.isArray(answers.main_goal)) {
      bullets.push(`Goals: ${answers.main_goal.join(', ')}`);
    }
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center p-6"
      >
        {/* Back button */}
        <button
          onClick={() => setScreen('soul')}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700"
          data-testid="payoff-back-btn"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        
        {/* Glowing soul ring */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-pink-500/50 to-purple-600/50 rounded-full" />
          <div className="relative">
            <SoulRing percentage={soulScore} size={160} strokeWidth={10} petName={petName} />
          </div>
        </motion.div>
        
        {/* Pet photo & name */}
        <img
          src={petPhotoPreview}
          alt={petName}
          className="w-20 h-20 rounded-full object-cover border-4 border-white/20 -mt-4 mb-4"
        />
        
        <h2 className="text-2xl font-bold text-white mb-2">
          {petName}'s Soul Started!
        </h2>
        <p className="text-slate-400 mb-6 text-center">
          {/* FIX: Use petName, not nickname */}
          Here's what Mira already knows about {petName}:
        </p>
        
        {/* Bullets */}
        <div className="w-full max-w-sm space-y-2 mb-8">
          {bullets.slice(0, 6).map((bullet, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl"
            >
              <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span className="text-white capitalize">{bullet}</span>
            </motion.div>
          ))}
        </div>
        
        <p className="text-slate-500 text-sm mb-6 text-center">
          Your score will grow as Mira learns more about {petName}
        </p>
        
        {/* CTAs */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={() => {
              console.log('[UI] Button clicked!');
              toast.info('Creating your account...');
              handleFinalSubmit();
            }}
            disabled={loading}
            data-testid="see-pet-home-btn"
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Creating {petName}'s Home...
              </>
            ) : (
              <>See {petName}'s Home <ChevronRight className="w-5 h-5 inline" /></>
            )}
          </button>
          
          {/* Keep Teaching Mira - No numbers, just motivation */}
          <button
            onClick={() => navigate('/soul-builder')}
            data-testid="keep-teaching-mira-btn"
            className="w-full py-4 bg-slate-800 text-white rounded-xl font-medium border border-slate-700"
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            Keep Teaching Mira
          </button>
          <p className="text-slate-400 text-xs text-center px-4">
            The more Mira knows about {petName}, the better she understands {getPronoun().possessive} soul and can assist with personalized recommendations
          </p>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
            <button 
              onClick={() => setError('')}
              className="text-red-300 text-xs underline mt-1 block mx-auto"
            >
              Dismiss
            </button>
          </div>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950">
      <AnimatePresence mode="wait">
        {screen === 'photo' && renderPhotoScreen()}
        {screen === 'gender' && renderGenderScreen()}
        {screen === 'name' && renderNameScreen()}
        {screen === 'birthday' && renderBirthdayScreen()}
        {screen === 'parent' && renderParentScreen()}
        {screen === 'soul' && renderSoulScreen()}
        {screen === 'payoff' && renderPayoffScreen()}
      </AnimatePresence>
    </div>
  );
};

export default MiraMeetsYourPet;

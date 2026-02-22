/**
 * MiraMeetsYourPet.jsx
 * 
 * World-class onboarding experience for The Doggy Company
 * 
 * Flow:
 * 1. Photo Hook (30 sec) - Upload photo, AI breed detection, pet name + nickname
 * 2. Parent Info (60 sec) - One clean screen with essentials
 * 3. Soul Game (2-3 min) - 15 tap questions, one per screen
 * 4. Payoff Reveal (10 sec) - Show what Mira learned
 * 5. Pet Home - Default landing
 * 
 * Key Principles:
 * - One question per screen (tap game, not questionnaire)
 * - Instant "Mira now knows..." feedback after every answer
 * - Soul ring grows in real-time
 * - Stop anytime, continue later
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Camera,
  Upload,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Heart,
  Check,
  X,
  Dog,
  Calendar,
  Shield,
  Utensils,
  Activity,
  Scissors,
  Users,
  PawPrint,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Soul Questions - 15 core questions for 30-35% soul score
// Gender is asked during photo hook, so questions start after that
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
    miraKnows: (pet, val) => `${pet} is a ${val}!`
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
    multiSelect: true, // Changed to multi-select
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

// Cities for dropdown
const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Goa'];

// Soul Score Ring Component
const SoulRing = ({ percentage, size = 120, strokeWidth = 8, petName }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
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
  
  // Screen state
  const [screen, setScreen] = useState('photo'); // photo, parent, soul, payoff
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Photo & Pet Info
  const [petPhoto, setPetPhoto] = useState(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState(null);
  const [petName, setPetName] = useState('');
  const [petNickname, setPetNickname] = useState('');
  const [breedDetected, setBreedDetected] = useState('');
  const [breedConfirmed, setBreedConfirmed] = useState(false);
  const [breedConfidence, setBreedConfidence] = useState(0);
  const [showBreedSelector, setShowBreedSelector] = useState(false);
  
  // Parent Info
  const [parentData, setParentData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
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
  
  // Calculate soul score
  const calculateSoulScore = useCallback(() => {
    const answered = Object.keys(answers).length;
    const total = SOUL_QUESTIONS.length;
    return Math.round((answered / total) * 35); // Max 35% from onboarding
  }, [answers]);
  
  const soulScore = calculateSoulScore();
  
  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setPetPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPetPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
    
    // Try AI breed detection
    setLoading(true);
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
        }
      }
    } catch (err) {
      console.log('Breed detection not available');
    } finally {
      setLoading(false);
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
  
  // Skip question
  const handleSkip = () => {
    setShowMiraKnows(false);
    if (currentQuestion < SOUL_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setScreen('payoff');
    }
  };
  
  // Submit parent info and create account
  const handleParentSubmit = async () => {
    // Validate
    if (!parentData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!parentData.email.trim() || !parentData.email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!parentData.phone.trim() || parentData.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    if (!parentData.city.trim()) {
      toast.error('Please select your city');
      return;
    }
    if (!parentData.password || parentData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!parentData.acceptTerms) {
      toast.error('Please accept the terms & privacy policy');
      return;
    }
    
    // Move to soul game
    setScreen('soul');
  };
  
  // Final submit - create account and pet
  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create the account with pet
      const response = await fetch(`${API_URL}/api/membership/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: {
            name: parentData.name,
            email: parentData.email,
            phone: parentData.phone,
            whatsapp: parentData.whatsapp || parentData.phone,
            address: '',
            city: parentData.city,
            pincode: '',
            password: parentData.password,
            preferred_contact: 'whatsapp',
            notifications: parentData.notifications,
            accepted_terms: parentData.acceptTerms,
            accepted_privacy: parentData.acceptTerms
          },
          pets: [{
            name: petName,
            nickname: petNickname,
            breed: breedConfirmed ? breedDetected : (breedDetected || 'Mixed'),
            breed_detected: breedDetected,
            breed_confirmed: breedConfirmed,
            breed_confidence: breedConfidence,
            gender: answers.gender || '',
            birth_date: '',
            gotcha_date: '',
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
              birthday_type: answers.birthday_type,
              main_goal: answers.main_goal
            }
          }],
          plan_type: 'demo',
          pet_count: 1
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create account');
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
      
      const loginData = await loginResponse.json();
      
      if (loginResponse.ok && loginData.access_token) {
        localStorage.setItem('token', loginData.access_token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        
        toast.success(`Welcome! ${petName}'s home is ready.`);
        
        // Navigate to Pet Home (we'll create this, for now go to dashboard)
        navigate('/member-dashboard');
      } else {
        throw new Error('Login failed. Please try logging in manually.');
      }
      
    } catch (err) {
      const errorMsg = err.message || 'Something went wrong';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
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
      
      {!petPhotoPreview ? (
        <>
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Let Mira meet your pet
          </h1>
          <p className="text-slate-400 mb-8 text-center">
            Upload a photo and watch the magic happen
          </p>
          
          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-64 h-64 rounded-full border-2 border-dashed border-pink-500/50 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 hover:bg-pink-500/5 transition-all"
          >
            {loading ? (
              <Loader2 className="w-12 h-12 text-pink-500 animate-spin" />
            ) : (
              <>
                <Camera className="w-16 h-16 text-pink-500 mb-4" />
                <span className="text-pink-500 font-medium">Upload Photo</span>
                <span className="text-slate-500 text-sm mt-1">or tap to take one</span>
              </>
            )}
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
              }}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          
          {/* Breed Detection */}
          {breedDetected && !breedConfirmed && !showBreedSelector && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <p className="text-slate-400 mb-2">
                {breedConfidence > 0.7 ? 'Mira thinks this is a' : 'Looks like a'}
              </p>
              <p className="text-2xl font-bold text-white mb-4">{breedDetected}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setBreedConfirmed(true)}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium"
                >
                  <Check className="w-4 h-4 inline mr-1" /> Confirm
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
          
          {/* No breed detected - show breed input */}
          {!breedDetected && !breedConfirmed && !showBreedSelector && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <p className="text-slate-400 mb-2">What kind of dog is this?</p>
              <button
                onClick={() => setShowBreedSelector(true)}
                className="px-6 py-2 bg-slate-800 text-white rounded-full font-medium border border-slate-700"
              >
                Select Breed
              </button>
              <button
                onClick={() => {
                  setBreedDetected('Mixed / Indie');
                  setBreedConfirmed(true);
                }}
                className="ml-3 px-6 py-2 text-slate-400 hover:text-white"
              >
                Mixed / Not sure
              </button>
            </motion.div>
          )}
          
          {/* Breed Selector */}
          {showBreedSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 w-full max-w-sm"
            >
              <input
                type="text"
                placeholder="Search breed..."
                value={breedDetected}
                onChange={(e) => setBreedDetected(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
              />
              <button
                onClick={() => {
                  setBreedConfirmed(true);
                  setShowBreedSelector(false);
                }}
                className="w-full mt-3 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium"
              >
                Confirm Breed
              </button>
            </motion.div>
          )}
          
          {/* Pet Name */}
          {breedConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm"
            >
              <p className="text-slate-400 mb-3 text-center">What's their name?</p>
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
                    placeholder="e.g., Bud, Buddy Bear (optional)"
                    value={petNickname}
                    onChange={(e) => setPetNickname(e.target.value)}
                    className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-center placeholder-slate-500 mb-6"
                  />
                  
                  <button
                    onClick={() => setScreen('parent')}
                    className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30"
                  >
                    Continue <ChevronRight className="w-5 h-5 inline" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
  
  // Render Parent Info Screen
  const renderParentScreen = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setScreen('photo')}
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
          
          <select
            value={parentData.city}
            onChange={(e) => setParentData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
          >
            <option value="">Select city</option>
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          
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
  
  // Render Soul Game Screen
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
            onClick={() => currentQuestion > 0 ? setCurrentQuestion(prev => prev - 1) : setScreen('parent')}
            className="p-2 rounded-full bg-slate-800"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <SoulRing percentage={soulScore} size={48} strokeWidth={4} />
            <span className="text-slate-400 text-sm">Mira knows {petName}</span>
          </div>
          
          <button
            onClick={handleSkip}
            className="text-slate-500 text-sm"
          >
            Skip
          </button>
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
  
  // Render Payoff Screen
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
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center p-6"
      >
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
          Here's what Mira already knows about {petNickname || petName}:
        </p>
        
        {/* Bullets */}
        <div className="w-full max-w-sm space-y-2 mb-8">
          {bullets.slice(0, 5).map((bullet, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl"
            >
              <Sparkles className="w-4 h-4 text-pink-500 flex-shrink-0" />
              <span className="text-white">{bullet}</span>
            </motion.div>
          ))}
        </div>
        
        <p className="text-slate-500 text-sm mb-6 text-center">
          Your score will grow as Mira learns more about {petName}
        </p>
        
        {/* CTAs */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin inline" />
            ) : (
              <>See {petName}'s Home <ChevronRight className="w-5 h-5 inline" /></>
            )}
          </button>
          
          <button
            onClick={() => setScreen('soul')}
            className="w-full py-4 bg-slate-800 text-white rounded-xl font-medium border border-slate-700"
          >
            Keep Teaching Mira
          </button>
        </div>
        
        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}
      </motion.div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950">
      <AnimatePresence mode="wait">
        {screen === 'photo' && renderPhotoScreen()}
        {screen === 'parent' && renderParentScreen()}
        {screen === 'soul' && renderSoulScreen()}
        {screen === 'payoff' && renderPayoffScreen()}
      </AnimatePresence>
    </div>
  );
};

export default MiraMeetsYourPet;

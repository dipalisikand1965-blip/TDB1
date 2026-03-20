/**
 * MiraMeetsYourPet.jsx - Streamlined Multi-Pet Onboarding
 * 
 * Flow: 5 screens total (+ optional 6th)
 * 1. Pet Count - How many pets?
 * 2. Meet Your Pack - All pets basic info on ONE screen
 * 3. Soul Snapshot - 5 key pillar questions for ALL pets
 * 4. Parent Info - Account details
 * 5. Welcome - Success & invite to complete full Soul Profile
 * 6. (Optional) Full Soul Questions - Deep questions for selected pet
 * 
 * Philosophy: /app/memory/SOUL_PHILOSOPHY_SSOT.md
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Camera, Upload, X, Check, 
  Heart, Star, Sparkles, Calendar, User, Mail, Phone, 
  MapPin, Lock, MessageCircle, PawPrint, AlertCircle,
  Plus, Minus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

// ============================================================
// CONSTANTS
// ============================================================

const BREED_AVATARS = [
  // Most Popular in India (in order of popularity)
  { breed: 'Golden Retriever', initials: 'GR', color: 'from-yellow-300 to-amber-400' },
  { breed: 'Labrador', initials: 'LB', color: 'from-yellow-400 to-amber-500' },
  { breed: 'German Shepherd', initials: 'GS', color: 'from-amber-700 to-stone-800' },
  { breed: 'Shih Tzu', initials: 'ST', color: 'from-white to-amber-100' },
  { breed: 'Pug', initials: 'PG', color: 'from-amber-200 to-amber-400' },
  { breed: 'Beagle', initials: 'BG', color: 'from-amber-200 to-white' },
  { breed: 'Pomeranian', initials: 'PM', color: 'from-orange-300 to-amber-500' },
  { breed: 'Indie', initials: 'IN', color: 'from-amber-400 to-orange-500' },
  { breed: 'Rottweiler', initials: 'RW', color: 'from-stone-800 to-amber-700' },
  { breed: 'Doberman', initials: 'DB', color: 'from-stone-900 to-amber-700' },
  { breed: 'Cocker Spaniel', initials: 'CS', color: 'from-amber-400 to-amber-600' },
  { breed: 'Great Dane', initials: 'GD', color: 'from-slate-600 to-slate-800' },
  { breed: 'Boxer', initials: 'BX', color: 'from-amber-500 to-amber-700' },
  { breed: 'Dachshund', initials: 'DH', color: 'from-amber-600 to-amber-800' },
  { breed: 'Lhasa Apso', initials: 'LA', color: 'from-amber-200 to-white' },
  { breed: 'Dalmatian', initials: 'DL', color: 'from-white to-slate-900' },
  { breed: 'Saint Bernard', initials: 'SB', color: 'from-amber-600 to-white' },
  { breed: 'Husky', initials: 'HK', color: 'from-slate-400 to-white' },
  { breed: 'French Bulldog', initials: 'FB', color: 'from-slate-400 to-amber-200' },
  { breed: 'English Bulldog', initials: 'EB', color: 'from-amber-100 to-amber-300' },
  { breed: 'Poodle', initials: 'PD', color: 'from-slate-200 to-white' },
  { breed: 'Maltese', initials: 'MT', color: 'from-white to-slate-100' },
  { breed: 'Yorkshire Terrier', initials: 'YT', color: 'from-amber-500 to-slate-600' },
  { breed: 'Chihuahua', initials: 'CH', color: 'from-amber-300 to-amber-500' },
  { breed: 'Border Collie', initials: 'BC', color: 'from-stone-900 to-white' },
  { breed: 'Corgi', initials: 'CG', color: 'from-amber-400 to-white' },
  { breed: 'Pit Bull', initials: 'PB', color: 'from-slate-500 to-amber-400' },
  { breed: 'Akita', initials: 'AK', color: 'from-amber-500 to-white' },
  // Large & Giant Breeds
  { breed: 'Newfoundland', initials: 'NF', color: 'from-stone-900 to-stone-700' },
  { breed: 'Bernese Mountain', initials: 'BM', color: 'from-stone-900 to-amber-500' },
  { breed: 'Irish Setter', initials: 'IS', color: 'from-red-700 to-amber-600' },
  { breed: 'Weimaraner', initials: 'WM', color: 'from-slate-400 to-slate-500' },
  { breed: 'Vizsla', initials: 'VZ', color: 'from-amber-500 to-amber-600' },
  { breed: 'Rhodesian Ridgeback', initials: 'RR', color: 'from-amber-500 to-amber-700' },
  // More Popular Breeds
  { breed: 'Australian Shepherd', initials: 'AS', color: 'from-slate-600 to-amber-400' },
  { breed: 'Cavalier King Charles', initials: 'CK', color: 'from-amber-300 to-white' },
  { breed: 'Miniature Schnauzer', initials: 'MS', color: 'from-slate-500 to-slate-300' },
  { breed: 'Shiba Inu', initials: 'SI', color: 'from-orange-400 to-white' },
  { breed: 'Boston Terrier', initials: 'BT', color: 'from-stone-900 to-white' },
  { breed: 'Havanese', initials: 'HV', color: 'from-amber-200 to-white' },
  { breed: 'Springer Spaniel', initials: 'SS', color: 'from-amber-700 to-white' },
  { breed: 'Bichon Frise', initials: 'BF', color: 'from-white to-slate-50' },
  { breed: 'Samoyed', initials: 'SM', color: 'from-white to-slate-100' },
  { breed: 'Chow Chow', initials: 'CC', color: 'from-amber-600 to-amber-800' },
  { breed: 'Shar Pei', initials: 'SP', color: 'from-amber-400 to-amber-600' },
  { breed: 'Basenji', initials: 'BJ', color: 'from-amber-500 to-white' },
  { breed: 'Whippet', initials: 'WH', color: 'from-slate-300 to-white' },
  { breed: 'Greyhound', initials: 'GH', color: 'from-slate-400 to-slate-200' },
  { breed: 'Jack Russell', initials: 'JR', color: 'from-white to-amber-300' },
  { breed: 'Scottish Terrier', initials: 'SC', color: 'from-stone-900 to-stone-800' },
  { breed: 'West Highland', initials: 'WE', color: 'from-white to-slate-100' },
  { breed: 'Tibetan Mastiff', initials: 'TM', color: 'from-stone-800 to-amber-700' },
  // Indian Breeds
  { breed: 'Rajapalayam', initials: 'RP', color: 'from-slate-100 to-slate-300' },
  { breed: 'Mudhol Hound', initials: 'MH', color: 'from-amber-600 to-amber-800' },
  { breed: 'Chippiparai', initials: 'CP', color: 'from-amber-200 to-amber-400' },
  { breed: 'Kombai', initials: 'KM', color: 'from-amber-700 to-amber-900' },
  { breed: 'Kanni', initials: 'KN', color: 'from-stone-800 to-amber-600' },
  { breed: 'Rampur Greyhound', initials: 'RG', color: 'from-slate-400 to-slate-600' },
  { breed: 'Gaddi Kutta', initials: 'GK', color: 'from-stone-700 to-amber-600' },
  { breed: 'Bakharwal', initials: 'BK', color: 'from-stone-800 to-stone-600' },
  // Always Last
  { breed: 'Mixed Breed', initials: 'MX', color: 'from-purple-400 to-pink-400' },
];

const PROTEIN_OPTIONS = ['Chicken', 'Lamb', 'Fish', 'Beef', 'Vegetarian', 'No preference'];
const EATING_STYLE_OPTIONS = ['Very picky', 'Somewhat picky', 'Not picky', 'Eats anything'];
const APPROXIMATE_AGES = [
  '< 1 year', '~1 year', '~2 years', '~3 years', '~4 years', '~5 years',
  '~6 years', '~7 years', '~8 years', '~9 years', '~10 years', '~11 years',
  '~12 years', '~13 years', '~14 years', '15+ years'
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
  'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna',
  'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad',
  'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
  'Amritsar', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
  'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota',
  'Gurugram', 'Chandigarh', 'Guwahati', 'Solapur', 'Noida', 'Other'
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const createEmptyPet = (index) => ({
  index,
  name: '',
  avatar: null,
  photo: null,
  photoPreview: null,
  gender: '',
  birthdayType: 'approximate',
  birthday: '',
  approximateAge: '',
  // Soul snapshot
  allergies: { has: false, details: '' },
  healthConditions: { has: false, details: '' },
  foodProtein: '',
  eatingStyle: '',
  carRides: '',
  activityLevel: ''
});

// ============================================================
// MAIN COMPONENT
// ============================================================

const MiraMeetsYourPet = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const fileInputRefs = useRef({});
  
  // Check if adding pet to existing account
  const isAddingPet = searchParams.get('add') === 'true';
  
  // Screen state
  const [currentScreen, setCurrentScreen] = useState('petCount');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Screen 1: Pet Count
  const [petCount, setPetCount] = useState(1);
  
  // Screen 2 & 3: Pets data
  const [pets, setPets] = useState([createEmptyPet(0)]);
  
  // Screen 4: Parent data
  const [parentData, setParentData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
    password: '',
    whatsappOptIn: true
  });
  
  // Initialize pets array when count changes
  useEffect(() => {
    setPets(prev => {
      const newPets = [];
      for (let i = 0; i < petCount; i++) {
        newPets.push(prev[i] || createEmptyPet(i));
      }
      return newPets;
    });
  }, [petCount]);
  
  // Handle photo upload for a specific pet
  const handlePhotoUpload = (petIndex, event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPets(prev => prev.map((pet, i) => 
          i === petIndex 
            ? { ...pet, photo: file, photoPreview: reader.result, avatar: null }
            : pet
        ));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle avatar selection for a specific pet
  const handleAvatarSelect = (petIndex, avatar) => {
    setPets(prev => prev.map((pet, i) => 
      i === petIndex 
        ? { ...pet, avatar, photo: null, photoPreview: null }
        : pet
    ));
  };
  
  // Update pet field
  const updatePet = (petIndex, field, value) => {
    setPets(prev => prev.map((pet, i) => 
      i === petIndex ? { ...pet, [field]: value } : pet
    ));
  };
  
  // Validate Screen 2
  const validateBasicInfo = () => {
    for (let i = 0; i < pets.length; i++) {
      const pet = pets[i];
      if (!pet.name.trim()) return `Please enter a name for Pet ${i + 1}`;
      if (!pet.avatar && !pet.photoPreview) return `Please select an avatar or upload a photo for ${pet.name || `Pet ${i + 1}`}`;
      if (!pet.gender) return `Please select gender for ${pet.name || `Pet ${i + 1}`}`;
      if (pet.birthdayType === 'approximate' && !pet.approximateAge) {
        return `Please select approximate age for ${pet.name || `Pet ${i + 1}`}`;
      }
      if ((pet.birthdayType === 'exact' || pet.birthdayType === 'gotcha') && !pet.birthday) {
        return `Please select a date for ${pet.name || `Pet ${i + 1}`}`;
      }
    }
    return null;
  };
  
  // Validate Screen 3
  const validateSoulSnapshot = () => {
    for (let i = 0; i < pets.length; i++) {
      const pet = pets[i];
      if (!pet.foodProtein) return `Please select food preference for ${pet.name}`;
      if (!pet.carRides) return `Please select how ${pet.name} feels about car rides`;
      if (!pet.activityLevel) return `Please select activity level for ${pet.name}`;
    }
    return null;
  };
  
  // Validate Screen 4
  const validateParentInfo = () => {
    if (!parentData.name.trim()) return 'Please enter your name';
    if (!parentData.email.trim()) return 'Please enter your email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentData.email)) return 'Please enter a valid email';
    if (!parentData.phone.trim()) return 'Please enter your phone number';
    if (!/^\d{10}$/.test(parentData.phone.replace(/\D/g, ''))) return 'Please enter a valid 10-digit phone number';
    if (!parentData.city) return 'Please select your city';
    if (!parentData.password) return 'Please create a password';
    if (parentData.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };
  
  // Submit to API
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      const payload = {
        parent: {
          name: parentData.name,
          email: parentData.email,
          phone: parentData.phone,
          whatsapp: parentData.whatsapp || parentData.phone,
          city: parentData.city,
          password: parentData.password,
          whatsapp_opt_in: parentData.whatsappOptIn
        },
        pets: pets.map(pet => ({
          name: pet.name,
          gender: pet.gender,
          breed: pet.avatar?.breed || 'Mixed Breed',
          species: 'dog',
          photo: pet.photoPreview || null,
          avatar: pet.avatar || null,
          birthday: pet.birthday || null,
          birthday_type: pet.birthdayType,
          approximate_age: pet.approximateAge || null,
          soul_snapshot: {
            allergies: pet.allergies.has ? [pet.allergies.details] : [],
            health_conditions: pet.healthConditions.has ? [pet.healthConditions.details] : [],
            food_preference: {
              protein: pet.foodProtein,
              eating_style: pet.eatingStyle
            },
            car_rides: pet.carRides,
            activity_level: pet.activityLevel
          }
        }))
      };
      
      // Use XMLHttpRequest to avoid Emergent's fetch interceptor consuming the response body
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_URL}/api/auth/membership/onboard`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function() {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response);
            } else {
              reject(new Error(response.detail || 'Failed to create account'));
            }
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        };
        xhr.onerror = function() {
          reject(new Error('Network error. Please try again.'));
        };
        xhr.send(JSON.stringify(payload));
      });
      
      // Login the user
      if (data.access_token) {
        loginWithToken(data.access_token, data.user);
      }
      
      // Go to welcome screen
      setCurrentScreen('welcome');
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // ============================================================
  // SCREEN 1: PET COUNT
  // ============================================================
  
  const renderPetCountScreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      {/* Mira Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold text-white">Mira</span>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
        How many furry friends do you have?
      </h1>
      <p className="text-white/80 text-center mb-8">
        We'll get to know each one personally
      </p>
      
      {/* Quick select buttons */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
          <button
            key={num}
            onClick={() => setPetCount(num)}
            className={`w-14 h-14 rounded-xl text-xl font-bold transition-all ${
              petCount === num
                ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white scale-110 shadow-lg shadow-pink-500/30'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      
      {/* Custom number input */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-slate-400">or enter:</span>
        <input
          type="number"
          min="1"
          max="50"
          value={petCount}
          onChange={(e) => setPetCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
          className="w-20 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center text-lg"
        />
        <span className="text-slate-400">pets</span>
      </div>
      
      {/* Dog emoji */}
      <div className="text-4xl mb-8">🐕</div>
      
      {/* Continue button */}
      <button
        onClick={() => setCurrentScreen('basicInfo')}
        className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2"
      >
        Let's Go! <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
  
  // ============================================================
  // SCREEN 2: MEET YOUR PACK (Basic Info)
  // ============================================================
  
  const renderBasicInfoScreen = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentScreen('petCount')}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <span className="text-white font-medium">Mira</span>
        </div>
        <div className="w-9" /> {/* Spacer */}
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
        Let's meet your babies!
      </h1>
      <p className="text-slate-400 text-center mb-6">
        {petCount} {petCount === 1 ? 'pet' : 'pets'} to introduce
      </p>
      
      {/* Pet Cards */}
      <div className="max-w-2xl mx-auto space-y-6 pb-32">
        {pets.map((pet, index) => (
          <div
            key={index}
            className="bg-slate-800/50 rounded-2xl p-4 md:p-6 border border-slate-700"
          >
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="w-5 h-5 text-pink-500" />
              <span className="text-white font-medium">Pet {index + 1} of {petCount}</span>
            </div>
            
            {/* Name */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-1 block">Name</label>
              <input
                type="text"
                placeholder="What's their name?"
                value={pet.name}
                onChange={(e) => updatePet(index, 'name', e.target.value)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500"
              />
            </div>
            
            {/* Avatar/Photo Selection */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Choose an avatar or upload a photo</label>
              
              {/* Photo preview or upload button */}
              {pet.photoPreview ? (
                <div className="relative w-20 h-20 mb-3">
                  <img
                    src={pet.photoPreview}
                    alt="Pet"
                    className="w-20 h-20 rounded-full object-cover border-2 border-pink-500"
                  />
                  <button
                    onClick={() => updatePet(index, 'photoPreview', null)}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs.current[index]?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-pink-500 hover:text-pink-400 transition-colors mb-3"
                >
                  <Camera className="w-5 h-5" />
                  <span>Upload Photo</span>
                </button>
              )}
              <input
                ref={el => fileInputRefs.current[index] = el}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(index, e)}
                className="hidden"
              />
              
              {/* Avatar grid - larger on mobile for touch */}
              <div className="text-xs text-white/70 mb-2">Choose a breed:</div>
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 -mx-1">
                {BREED_AVATARS.map((avatar, avatarIndex) => (
                  <button
                    key={avatarIndex}
                    onClick={() => handleAvatarSelect(index, avatar)}
                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                      pet.avatar?.breed === avatar.breed
                        ? 'bg-pink-500/20 ring-2 ring-pink-500 scale-105'
                        : 'bg-slate-800/50 hover:bg-slate-700/50 active:scale-95'
                    }`}
                    title={avatar.breed}
                  >
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center mb-1 shadow-lg`}>
                      <span className="text-xs font-bold text-slate-800">{avatar.initials}</span>
                    </div>
                    <span className="text-[10px] text-white/70 text-center leading-tight truncate w-full">{avatar.breed}</span>
                  </button>
                ))}
              </div>
              
              {/* Custom breed input */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-white/50">Can't find your breed?</span>
                <input
                  type="text"
                  placeholder="Type breed name..."
                  className="flex-1 bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                  onChange={(e) => {
                    if (e.target.value.trim()) {
                      handleAvatarSelect(index, {
                        breed: e.target.value.trim(),
                        initials: e.target.value.trim().substring(0, 2).toUpperCase(),
                        color: 'from-purple-400 to-pink-400'
                      });
                    }
                  }}
                  data-testid="custom-breed-input"
                />
              </div>
              
              {pet.avatar && (
                <p className="text-xs text-pink-400 mt-2">Selected: {pet.avatar.breed}</p>
              )}
            </div>
            
            {/* Gender */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 block">Gender</label>
              <div className="flex gap-3">
                <button
                  onClick={() => updatePet(index, 'gender', 'boy')}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    pet.gender === 'boy'
                      ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  ♂️ Boy
                </button>
                <button
                  onClick={() => updatePet(index, 'gender', 'girl')}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                    pet.gender === 'girl'
                      ? 'bg-pink-500/20 text-pink-400 border-2 border-pink-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-slate-600'
                  }`}
                >
                  ♀️ Girl
                </button>
              </div>
            </div>
            
            {/* Birthday */}
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Birthday / Age</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`birthday-type-${index}`}
                    checked={pet.birthdayType === 'exact'}
                    onChange={() => updatePet(index, 'birthdayType', 'exact')}
                    className="text-pink-500"
                  />
                  <span className="text-slate-300 text-sm">I know the exact birthday</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`birthday-type-${index}`}
                    checked={pet.birthdayType === 'gotcha'}
                    onChange={() => updatePet(index, 'birthdayType', 'gotcha')}
                    className="text-pink-500"
                  />
                  <span className="text-slate-300 text-sm">I know their Gotcha Day</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`birthday-type-${index}`}
                    checked={pet.birthdayType === 'approximate'}
                    onChange={() => updatePet(index, 'birthdayType', 'approximate')}
                    className="text-pink-500"
                  />
                  <span className="text-slate-300 text-sm">I only know approximately</span>
                </label>
              </div>
              
              {(pet.birthdayType === 'exact' || pet.birthdayType === 'gotcha') && (
                <input
                  type="date"
                  value={pet.birthday}
                  onChange={(e) => updatePet(index, 'birthday', e.target.value)}
                  className="mt-2 w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              )}
              
              {pet.birthdayType === 'approximate' && (
                <select
                  value={pet.approximateAge}
                  onChange={(e) => updatePet(index, 'approximateAge', e.target.value)}
                  className="mt-2 w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                >
                  <option value="">Select approximate age</option>
                  {APPROXIMATE_AGES.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-area-bottom bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <button
            onClick={() => {
              const validationError = validateBasicInfo();
              if (validationError) {
                setError(validationError);
                return;
              }
              setError('');
              setCurrentScreen('soulSnapshot');
            }}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
  
  // ============================================================
  // SCREEN 3: SOUL SNAPSHOT (Key Pillar Questions)
  // ============================================================
  
  const renderSoulSnapshotScreen = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentScreen('basicInfo')}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <span className="text-white font-medium">Mira</span>
        </div>
        <div className="w-9" />
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
        A few quick questions
      </h1>
      <p className="text-slate-400 text-center mb-6">
        So I can help from day one 💜
      </p>
      
      {/* Pet Soul Cards */}
      <div className="max-w-2xl mx-auto space-y-6 pb-32">
        {pets.map((pet, index) => (
          <div
            key={index}
            className="bg-slate-800/50 rounded-2xl p-4 md:p-6 border border-slate-700"
          >
            {/* Pet header */}
            <div className="flex items-center gap-3 mb-4">
              {pet.photoPreview ? (
                <img src={pet.photoPreview} alt={pet.name} className="w-12 h-12 rounded-full object-cover" />
              ) : pet.avatar ? (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${pet.avatar.color} flex items-center justify-center text-2xl`}>
                  {pet.avatar.emoji}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-slate-500" />
                </div>
              )}
              <span className="text-white font-medium text-lg">{pet.name}</span>
            </div>
            
            {/* Allergies */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                💊 Any allergies?
              </label>
              <div className="flex gap-3 mb-2">
                <button
                  onClick={() => updatePet(index, 'allergies', { has: false, details: '' })}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    !pet.allergies.has
                      ? 'bg-green-500/20 text-green-400 border border-green-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  None known
                </button>
                <button
                  onClick={() => updatePet(index, 'allergies', { has: true, details: pet.allergies.details })}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    pet.allergies.has
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  Yes
                </button>
              </div>
              {pet.allergies.has && (
                <input
                  type="text"
                  placeholder="e.g., chicken, grain..."
                  value={pet.allergies.details}
                  onChange={(e) => updatePet(index, 'allergies', { has: true, details: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                />
              )}
            </div>
            
            {/* Health Conditions */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                🏥 Any health conditions?
              </label>
              <div className="flex gap-3 mb-2">
                <button
                  onClick={() => updatePet(index, 'healthConditions', { has: false, details: '' })}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    !pet.healthConditions.has
                      ? 'bg-green-500/20 text-green-400 border border-green-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  None known
                </button>
                <button
                  onClick={() => updatePet(index, 'healthConditions', { has: true, details: pet.healthConditions.details })}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    pet.healthConditions.has
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  Yes
                </button>
              </div>
              {pet.healthConditions.has && (
                <input
                  type="text"
                  placeholder="e.g., arthritis, diabetes..."
                  value={pet.healthConditions.details}
                  onChange={(e) => updatePet(index, 'healthConditions', { has: true, details: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                />
              )}
            </div>
            
            {/* Food Preference */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                🍖 Food preference
              </label>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={pet.foodProtein}
                  onChange={(e) => updatePet(index, 'foodProtein', e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="">Favorite protein</option>
                  {PROTEIN_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <select
                  value={pet.eatingStyle}
                  onChange={(e) => updatePet(index, 'eatingStyle', e.target.value)}
                  className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="">Eating style</option>
                  {EATING_STYLE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Car Rides */}
            <div className="mb-4">
              <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                🚗 How do they feel about car rides?
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => updatePet(index, 'carRides', 'anxious')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    pet.carRides === 'anxious'
                      ? 'bg-red-500/20 text-red-400 border border-red-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  😰 Anxious
                </button>
                <button
                  onClick={() => updatePet(index, 'carRides', 'okay')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    pet.carRides === 'okay'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  😐 Okay
                </button>
                <button
                  onClick={() => updatePet(index, 'carRides', 'loves')}
                  className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                    pet.carRides === 'loves'
                      ? 'bg-green-500/20 text-green-400 border border-green-500'
                      : 'bg-slate-900 text-slate-400 border border-slate-700'
                  }`}
                >
                  🥰 Loves it!
                </button>
              </div>
            </div>
            
            {/* Activity Level */}
            <div>
              <label className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                🏃 Activity level
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'low', label: '🛋 Couch Potato' },
                  { value: 'moderate', label: '🚶 Moderate' },
                  { value: 'high', label: '⚡ Very Active' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updatePet(index, 'activityLevel', opt.value)}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                      pet.activityLevel === opt.value
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500'
                        : 'bg-slate-900 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-area-bottom bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <div className="max-w-2xl mx-auto">
          {error && (
            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <button
            onClick={() => {
              const validationError = validateSoulSnapshot();
              if (validationError) {
                setError(validationError);
                return;
              }
              setError('');
              setCurrentScreen('parentInfo');
            }}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
          >
            Continue <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
  
  // ============================================================
  // SCREEN 4: PARENT INFO
  // ============================================================
  
  const renderParentInfoScreen = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen p-4 md:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentScreen('soulSnapshot')}
          className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <span className="text-white font-medium">Mira</span>
        </div>
        <div className="w-9" />
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
        Now, a little about you!
      </h1>
      <p className="text-slate-400 text-center mb-6">
        So we can keep in touch 💜
      </p>
      
      <div className="max-w-md mx-auto space-y-4 pb-32">
        {/* Name */}
        <div>
          <label className="text-sm text-slate-400 mb-1 flex items-center gap-2">
            <User className="w-4 h-4" /> Your Name
          </label>
          <input
            type="text"
            placeholder="What should we call you?"
            value={parentData.name}
            onChange={(e) => setParentData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
        </div>
        
        {/* Email */}
        <div>
          <label className="text-sm text-slate-400 mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4" /> Email
          </label>
          <input
            type="email"
            placeholder="your@email.com"
            value={parentData.email}
            onChange={(e) => setParentData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
        </div>
        
        {/* Phone */}
        <div>
          <label className="text-sm text-slate-400 mb-1 flex items-center gap-2">
            <Phone className="w-4 h-4" /> Phone
          </label>
          <input
            type="tel"
            placeholder="10-digit mobile number"
            value={parentData.phone}
            onChange={(e) => setParentData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
        </div>
        
        {/* WhatsApp */}
        <div>
          <label className="text-sm text-slate-400 mb-1 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp (optional)
          </label>
          <input
            type="tel"
            placeholder="Same as phone? Leave blank"
            value={parentData.whatsapp}
            onChange={(e) => setParentData(prev => ({ ...prev, whatsapp: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
        </div>
        
        {/* City */}
        <div>
          <label className="text-sm text-slate-400 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> City
          </label>
          <select
            value={parentData.city}
            onChange={(e) => setParentData(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
          >
            <option value="">Select your city</option>
            {INDIAN_CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        
        {/* Password */}
        <div>
          <label className="text-sm text-slate-400 mb-1 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Create Password
          </label>
          <input
            type="password"
            placeholder="At least 6 characters"
            value={parentData.password}
            onChange={(e) => setParentData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
        </div>
        
        {/* WhatsApp Opt-in */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={parentData.whatsappOptIn}
            onChange={(e) => setParentData(prev => ({ ...prev, whatsappOptIn: e.target.checked }))}
            className="w-5 h-5 rounded text-pink-500"
          />
          <span className="text-slate-300 text-sm">
            Send me updates about my pets on WhatsApp
          </span>
        </label>
      </div>
      
      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 safe-area-bottom bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
        <div className="max-w-md mx-auto">
          {error && (
            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
          <button
            onClick={() => {
              const validationError = validateParentInfo();
              if (validationError) {
                setError(validationError);
                return;
              }
              setError('');
              handleSubmit();
            }}
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating your account...
              </>
            ) : (
              <>
                Create Account <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
  
  // ============================================================
  // SCREEN 5: WELCOME
  // ============================================================
  
  const [selectedPetForSoul, setSelectedPetForSoul] = useState(null);
  
  // Calculate soul profile completion
  const getSoulCompletion = (pet) => {
    // 5 quick questions = 30% base
    // Full soul = 13 more questions = 70% more
    // Currently they have 5/18 questions done = ~28%
    return 30; // They've done the 5 pillar questions
  };
  
  const renderWelcomeScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-screen p-6"
    >
      {/* Success animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-4"
      >
        <Check className="w-10 h-10 text-white" />
      </motion.div>
      
      <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
        🎉 Welcome to the family!
      </h1>
      
      <p className="text-slate-400 text-center mb-6">
        You're in! Here's how well I know your babies:
      </p>
      
      {/* Pet cards with soul completion */}
      <div className="w-full max-w-md space-y-3 mb-6">
        {pets.map((pet, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-slate-800/50 rounded-xl p-4 border border-slate-700"
          >
            <div className="flex items-center gap-3">
              {pet.photoPreview ? (
                <img src={pet.photoPreview} alt={pet.name} className="w-12 h-12 rounded-full object-cover border-2 border-pink-500/30" />
              ) : pet.avatar ? (
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${pet.avatar.color} flex items-center justify-center text-2xl border-2 border-pink-500/30`}>
                  {pet.avatar.emoji}
                </div>
              ) : null}
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{pet.name}</span>
                  <span className="text-pink-400 text-sm font-medium">{getSoulCompletion(pet)}% Soul</span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getSoulCompletion(pet)}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  />
                </div>
                
                <p className="text-xs text-slate-500 mt-1">
                  +70% more with full soul profile
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Call to action - Complete Soul Profile */}
      <div className="w-full max-w-md bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-white font-medium mb-1">
              Want me to really know {pets.length === 1 ? pets[0].name : 'them'}?
            </h3>
            <p className="text-slate-400 text-sm mb-3">
              Complete the full Soul Profile and I'll give you personalized recommendations for food, health, travel, celebrations & more!
            </p>
            
            {/* Pet selection for soul completion */}
            <div className="flex flex-wrap gap-2 mb-3">
              {pets.map((pet, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedPetForSoul(index)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    selectedPetForSoul === index
                      ? 'bg-pink-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {pet.avatar?.emoji || '🐕'} {pet.name}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                // Navigate to Soul Builder for the selected pet
                navigate('/soul-builder');
              }}
              disabled={selectedPetForSoul === null}
              data-testid="complete-soul-profile-btn"
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                selectedPetForSoul !== null
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {selectedPetForSoul !== null 
                ? `Complete ${pets[selectedPetForSoul].name}'s Soul Profile →`
                : 'Select a pet above to continue'
              }
            </button>
          </div>
        </div>
      </div>
      
      {/* Or skip for now */}
      <button
        onClick={() => navigate('/pet-home')}
        data-testid="skip-to-dashboard-btn"
        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
      >
        Skip for now → Go to Pet Home
      </button>
      
      <p className="text-slate-500 text-xs mt-4 text-center max-w-sm">
        Don't worry, I'll remind you! You can complete Soul Profiles anytime from the pet's profile page.
      </p>
    </motion.div>
  );
  
  // ============================================================
  // MAIN RENDER
  // ============================================================
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 safe-area-inset">
      <AnimatePresence mode="wait">
        {currentScreen === 'petCount' && renderPetCountScreen()}
        {currentScreen === 'basicInfo' && renderBasicInfoScreen()}
        {currentScreen === 'soulSnapshot' && renderSoulSnapshotScreen()}
        {currentScreen === 'parentInfo' && renderParentInfoScreen()}
        {currentScreen === 'welcome' && renderWelcomeScreen()}
      </AnimatePresence>
    </div>
  );
};

export default MiraMeetsYourPet;
// Build timestamp: 1772789343

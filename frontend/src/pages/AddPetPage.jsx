/**
 * AddPetPage.jsx - Add Pet Flow for Existing Users
 * 
 * A streamlined flow for logged-in users to add another pet.
 * Much simpler than the full onboarding since we already have their info.
 * 
 * Flow:
 * 1. Pet Name & Photo/Avatar
 * 2. Basic Info (Gender, Birthday)
 * 3. Quick Soul Snapshot (allergies, activity, preferences)
 * 4. Success → Redirect to Pet Home
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Camera, Upload, X, Check, 
  PawPrint, Sparkles, Calendar, Heart, Star, Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import Navbar from '../components/Navbar';

// Breed avatars (same as MiraMeetsYourPet)
const BREED_AVATARS = [
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
  { breed: 'Husky', initials: 'HK', color: 'from-slate-400 to-white' },
  { breed: 'French Bulldog', initials: 'FB', color: 'from-slate-400 to-amber-200' },
  { breed: 'Mixed/Other', initials: '??', color: 'from-purple-400 to-pink-400' },
];

const ACTIVITY_LEVELS = [
  { value: 'couch_potato', label: 'Couch Potato', emoji: '🛋️', desc: 'Loves to relax' },
  { value: 'moderate', label: 'Moderate', emoji: '🚶', desc: 'Daily walks are enough' },
  { value: 'active', label: 'Active', emoji: '🏃', desc: 'Needs lots of exercise' },
  { value: 'hyperactive', label: 'Super Active', emoji: '⚡', desc: 'Endless energy!' },
];

const AddPetPage = () => {
  const navigate = useNavigate();
  const { user, getAuthHeader } = useAuth();
  const fileInputRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Pet data
  const [petData, setPetData] = useState({
    name: '',
    avatar: null,
    photo: null,
    photoPreview: null,
    gender: '',
    birthdayType: 'approximate',
    birthday: '',
    approximateAge: '',
    hasAllergies: false,
    allergies: '',
    activityLevel: '',
  });
  
  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setPetData(prev => ({
          ...prev,
          photo: file,
          photoPreview: reader.result,
          avatar: null
        }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setPetData(prev => ({
      ...prev,
      avatar,
      photo: null,
      photoPreview: null
    }));
  };
  
  // Validate step 1
  const validateStep1 = () => {
    if (!petData.name.trim()) return 'Please enter your pet\'s name';
    if (!petData.avatar && !petData.photoPreview) return 'Please select a breed avatar or upload a photo';
    return null;
  };
  
  // Validate step 2
  const validateStep2 = () => {
    if (!petData.gender) return 'Please select your pet\'s gender';
    if (petData.birthdayType === 'approximate' && !petData.approximateAge) {
      return 'Please select approximate age';
    }
    if (petData.birthdayType === 'exact' && !petData.birthday) {
      return 'Please enter birthday';
    }
    return null;
  };
  
  // Validate step 3
  const validateStep3 = () => {
    if (!petData.activityLevel) return 'Please select activity level';
    return null;
  };
  
  // Submit pet
  const handleSubmit = async () => {
    const validationError = validateStep3();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    // Guard: refuse to submit without an authenticated user email — prevents orphans.
    const ownerEmail = (user?.email || '').trim().toLowerCase();
    if (!ownerEmail || !ownerEmail.includes('@')) {
      setError('You need to be signed in to add a pet. Please sign in and try again.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Calculate birth date
      let birthDate = null;
      if (petData.birthdayType === 'exact' && petData.birthday) {
        birthDate = petData.birthday;
      } else if (petData.approximateAge) {
        const today = new Date();
        const yearsAgo = parseInt(petData.approximateAge) || 1;
        today.setFullYear(today.getFullYear() - yearsAgo);
        birthDate = today.toISOString().split('T')[0];
      }
      
      const payload = {
        name: petData.name,
        species: 'dog',
        breed: petData.avatar?.breed || 'Mixed Breed',
        gender: petData.gender,
        birth_date: birthDate,
        photo: petData.photoPreview || null,
        food_allergies: petData.hasAllergies ? [petData.allergies] : [],
        activity_level: petData.activityLevel,
        owner_email: ownerEmail,  // Belt-and-suspenders: backend overrides from JWT, but send explicitly.
        doggy_soul_answers: {
          activity_level: petData.activityLevel,
          has_allergies: petData.hasAllergies,
          allergy_details: petData.allergies || '',
        }
      };
      
      const response = await fetch(`${API_URL}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to add pet');
      }
      
      const data = await response.json();
      
      // Navigate to pet home with the new pet
      navigate('/pet-home', { 
        state: { 
          newPetAdded: true, 
          petName: petData.name,
          petId: data.pet?.id 
        }
      });
      
    } catch (err) {
      console.error('Add pet error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigate steps
  const nextStep = () => {
    let validationError = null;
    if (currentStep === 1) validationError = validateStep1();
    if (currentStep === 2) validationError = validateStep2();
    
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };
  
  // Render step 1: Name & Photo
  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">What's their name?</h2>
        <p className="text-slate-400">Let's add your new family member</p>
      </div>
      
      {/* Pet Name */}
      <div>
        <input
          type="text"
          placeholder="Your pet's name"
          value={petData.name}
          onChange={(e) => setPetData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-lg text-center placeholder-slate-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
          autoFocus
          data-testid="add-pet-name-input"
        />
      </div>
      
      {/* Photo Upload */}
      <div className="text-center">
        <p className="text-slate-400 text-sm mb-4">Upload a photo or choose a breed</p>
        
        {petData.photoPreview ? (
          <div className="relative inline-block">
            <img 
              src={petData.photoPreview} 
              alt="Pet" 
              className="w-32 h-32 rounded-full object-cover border-4 border-pink-500"
            />
            <button
              onClick={() => setPetData(prev => ({ ...prev, photo: null, photoPreview: null }))}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 rounded-full border-2 border-dashed border-slate-600 flex flex-col items-center justify-center mx-auto hover:border-pink-500 transition-colors"
            data-testid="add-pet-photo-btn"
          >
            <Camera className="w-8 h-8 text-slate-500 mb-2" />
            <span className="text-xs text-slate-500">Add Photo</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />
      </div>
      
      {/* Breed Avatars */}
      <div>
        <p className="text-slate-400 text-sm mb-3 text-center">Or select breed:</p>
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2">
          {BREED_AVATARS.map((avatar) => (
            <button
              key={avatar.breed}
              onClick={() => handleAvatarSelect(avatar)}
              className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                petData.avatar?.breed === avatar.breed
                  ? 'bg-pink-500/20 ring-2 ring-pink-500'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatar.color} flex items-center justify-center text-xs font-bold text-slate-800 mb-1`}>
                {avatar.initials}
              </div>
              <span className="text-[10px] text-slate-400 truncate w-full text-center">{avatar.breed}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
  
  // Render step 2: Basic Info
  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Tell us about {petData.name}</h2>
        <p className="text-slate-400">A few quick details</p>
      </div>
      
      {/* Gender */}
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Gender</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'male', label: 'Boy', emoji: '♂️' },
            { value: 'female', label: 'Girl', emoji: '♀️' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPetData(prev => ({ ...prev, gender: option.value }))}
              className={`p-4 rounded-xl border-2 transition-all ${
                petData.gender === option.value
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
              data-testid={`add-pet-gender-${option.value}`}
            >
              <span className="text-2xl mb-1 block">{option.emoji}</span>
              <span className="text-white font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Birthday Type */}
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Birthday</label>
        <div className="flex gap-2 mb-3">
          {[
            { value: 'approximate', label: 'Approximate' },
            { value: 'exact', label: 'Exact Date' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPetData(prev => ({ ...prev, birthdayType: option.value }))}
              className={`flex-1 py-2 px-4 rounded-lg text-sm transition-all ${
                petData.birthdayType === option.value
                  ? 'bg-pink-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {petData.birthdayType === 'approximate' ? (
          <div className="grid grid-cols-3 gap-2">
            {['< 1 year', '1-3 years', '3-7 years', '7-10 years', '10+ years'].map((age, idx) => (
              <button
                key={age}
                onClick={() => setPetData(prev => ({ ...prev, approximateAge: String(idx + 1) }))}
                className={`py-3 px-2 rounded-lg text-sm transition-all ${
                  petData.approximateAge === String(idx + 1)
                    ? 'bg-pink-500/20 border-2 border-pink-500 text-white'
                    : 'bg-slate-800 border-2 border-slate-700 text-slate-300'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="date"
            value={petData.birthday}
            onChange={(e) => setPetData(prev => ({ ...prev, birthday: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white"
            data-testid="add-pet-birthday-input"
          />
        )}
      </div>
    </motion.div>
  );
  
  // Render step 3: Quick Soul Snapshot
  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Quick snapshot</h2>
        <p className="text-slate-400">So Mira can personalize {petData.name}'s experience</p>
      </div>
      
      {/* Activity Level */}
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Activity Level</label>
        <div className="grid grid-cols-2 gap-3">
          {ACTIVITY_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setPetData(prev => ({ ...prev, activityLevel: level.value }))}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                petData.activityLevel === level.value
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
              data-testid={`add-pet-activity-${level.value}`}
            >
              <span className="text-2xl mb-1 block">{level.emoji}</span>
              <span className="text-white font-medium block">{level.label}</span>
              <span className="text-slate-500 text-xs">{level.desc}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Allergies */}
      <div>
        <label className="text-sm text-slate-400 mb-2 block">Any food allergies?</label>
        <div className="flex gap-3 mb-3">
          {[
            { value: false, label: 'No allergies' },
            { value: true, label: 'Yes, has allergies' }
          ].map((option) => (
            <button
              key={String(option.value)}
              onClick={() => setPetData(prev => ({ ...prev, hasAllergies: option.value }))}
              className={`flex-1 py-3 px-4 rounded-lg text-sm transition-all ${
                petData.hasAllergies === option.value
                  ? 'bg-pink-500 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {petData.hasAllergies && (
          <input
            type="text"
            placeholder="What allergies? (e.g., chicken, grains)"
            value={petData.allergies}
            onChange={(e) => setPetData(prev => ({ ...prev, allergies: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500"
          />
        )}
      </div>
      
      {/* Tip */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-purple-300 text-sm font-medium">Complete the full Soul Profile later</p>
            <p className="text-purple-400/70 text-xs mt-1">
              You can always add more details to help Mira know {petData.name} better!
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-purple-950">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => currentStep === 1 ? navigate(-1) : prevStep()}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700"
            data-testid="add-pet-back-btn"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-pink-500" />
            <span className="text-white font-medium">Add Pet</span>
          </div>
          
          {/* Step Indicator */}
          <div className="flex gap-1">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all ${
                  step === currentStep
                    ? 'w-6 bg-pink-500'
                    : step < currentStep
                      ? 'bg-pink-500'
                      : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
        
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </AnimatePresence>
        
        {/* Continue Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
          <div className="max-w-md mx-auto">
            <button
              onClick={currentStep === 3 ? handleSubmit : nextStep}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="add-pet-continue-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding {petData.name}...
                </>
              ) : currentStep === 3 ? (
                <>
                  <Check className="w-5 h-5" />
                  Add {petData.name || 'Pet'}
                </>
              ) : (
                <>
                  Continue <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPetPage;

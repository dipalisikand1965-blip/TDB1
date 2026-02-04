import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  PawPrint, ArrowRight, ArrowLeft, Heart, Sparkles, 
  Camera, User, Mail, Phone, Plus, Trash2,
  Lock, Check, Crown, MessageCircle, Shield, X
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';

// Plan options - Same price for unlimited dogs!
const PLANS = {
  explorer: {
    id: 'explorer',
    name: 'Explorer',
    price: 'Free',
    period: '7 days',
    description: 'Discover the Pet Soul™ experience',
    features: ['Basic Pet Profile', 'Limited Mira AI Concierge®', 'Browse 14 Pillars'],
    requiresPayment: false,
  },
  trial: {
    id: 'trial',
    name: 'Pet Pass Trial',
    price: '₹499',
    period: '/month',
    description: 'Full Concierge® experience',
    features: ['Full Pet Soul™', 'Unlimited Mira AI Concierge®', 'All 14 Pillars', 'Priority Support'],
    requiresPayment: true,
    badge: 'Try First',
  },
  foundation: {
    id: 'foundation',
    name: 'Pet Pass Foundation',
    price: '₹4,999',
    period: '/year',
    description: 'Best value - full Concierge® relationship',
    features: ['Everything in Trial', 'Double Paw Points', 'Birthday Surprise', 'Early Access'],
    requiresPayment: true,
    badge: 'Best Value',
    savings: 'Save ₹989/year',
  },
};

// Breed suggestions
const DOG_BREEDS = [
  'Labrador Retriever', 'Golden Retriever', 'German Shepherd', 'Beagle', 
  'Poodle', 'Bulldog', 'Rottweiler', 'Boxer', 'Dachshund', 'Shih Tzu',
  'Pug', 'Pomeranian', 'Husky', 'Doberman', 'Great Dane', 'Cocker Spaniel',
  'Indian Pariah', 'Indie', 'Mixed Breed', 'Other'
];

// Personality traits
const PERSONALITY_TRAITS = [
  'Playful', 'Calm', 'Energetic', 'Shy', 'Friendly', 'Protective',
  'Curious', 'Lazy', 'Food-lover', 'Cuddly', 'Independent', 'Social'
];

// Empty pet template
const createEmptyPet = () => ({
  id: Date.now(),
  name: '',
  breed: '',
  age: '',
  birthday: '',
  gender: '',
  photo: null,
  photoPreview: null,
  traits: [],
  dietaryNeeds: '',
  healthNotes: '',
  favoriteTreat: '',
  favoriteActivity: '',
});

const PetSoulOnboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'explorer';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activePetIndex, setActivePetIndex] = useState(0);
  
  // Multiple pets support - starts with one empty pet
  const [pets, setPets] = useState([createEmptyPet()]);
  
  // Parent data
  const [parentData, setParentData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    sameAsPhone: true,
    address: '',
    city: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    contactPreference: 'whatsapp',
    agreeTerms: false,
    agreePrivacy: false,
  });

  const totalSteps = 4;
  const activePet = pets[activePetIndex];

  const handlePetChange = (field, value) => {
    setPets(prev => prev.map((pet, idx) => 
      idx === activePetIndex ? { ...pet, [field]: value } : pet
    ));
  };

  const handleParentChange = (field, value) => {
    setParentData(prev => ({ ...prev, [field]: value }));
    if (field === 'phone' && parentData.sameAsPhone) {
      setParentData(prev => ({ ...prev, whatsapp: value }));
    }
  };

  const handleTraitToggle = (trait) => {
    const currentTraits = activePet.traits || [];
    const newTraits = currentTraits.includes(trait) 
      ? currentTraits.filter(t => t !== trait)
      : [...currentTraits, trait].slice(0, 4);
    handlePetChange('traits', newTraits);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handlePetChange('photo', file);
      handlePetChange('photoPreview', URL.createObjectURL(file));
    }
  };

  const addPet = () => {
    setPets(prev => [...prev, createEmptyPet()]);
    setActivePetIndex(pets.length);
  };

  const removePet = (index) => {
    if (pets.length > 1) {
      setPets(prev => prev.filter((_, idx) => idx !== index));
      setActivePetIndex(Math.min(activePetIndex, pets.length - 2));
    }
  };

  const validateStep = (step) => {
    setError('');
    
    if (step === 1) {
      // Check at least one pet has name and breed
      const validPet = pets.some(pet => pet.name.trim() && pet.breed);
      if (!validPet) {
        setError('Please enter at least one pet with name and breed');
        return false;
      }
    }
    
    if (step === 2) {
      if (!parentData.name.trim()) {
        setError('Please enter your name');
        return false;
      }
      if (!parentData.email.trim() || !parentData.email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }
      if (!parentData.phone.trim() || parentData.phone.length < 10) {
        setError('Please enter a valid phone number');
        return false;
      }
      if (!parentData.password || parentData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (parentData.password !== parentData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!parentData.agreeTerms || !parentData.agreePrivacy) {
        setError('Please agree to the Terms & Privacy Policy');
        return false;
      }
    }
    
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Register user
      const registerRes = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: parentData.email.split('@')[0],
          email: parentData.email,
          password: parentData.password,
          full_name: parentData.name,
          phone: parentData.phone,
          whatsapp: parentData.sameAsPhone ? parentData.phone : parentData.whatsapp,
          address: parentData.address,
          city: parentData.city,
          pincode: parentData.pincode,
          contact_preference: parentData.contactPreference,
        }),
      });
      
      if (!registerRes.ok) {
        const data = await registerRes.json();
        throw new Error(data.detail || 'Registration failed');
      }
      
      const { token, user } = await registerRes.json();
      
      // Create all pet profiles
      const validPets = pets.filter(pet => pet.name.trim() && pet.breed);
      for (const pet of validPets) {
        await fetch(getApiUrl('/api/pets'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: pet.name,
            breed: pet.breed,
            age: pet.age,
            birthday: pet.birthday,
            gender: pet.gender,
            traits: pet.traits,
            dietary_needs: pet.dietaryNeeds,
            health_notes: pet.healthNotes,
            favorite_treat: pet.favoriteTreat,
            favorite_activity: pet.favoriteActivity,
          }),
        });
      }
      
      // Create membership
      await fetch(getApiUrl('/api/memberships'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          status: PLANS[selectedPlan].requiresPayment ? 'pending_payment' : 'active',
        }),
      });
      
      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Go to welcome
      setCurrentStep(4);
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step components
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div 
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              step === currentStep 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white scale-110' 
                : step < currentStep 
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/10 text-white/50'
            }`}
          >
            {step < currentStep ? <Check className="w-5 h-5" /> : step}
          </div>
          {step < 4 && (
            <div className={`w-12 h-1 rounded ${step < currentStep ? 'bg-purple-500' : 'bg-white/10'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Pet Tab Component
  const PetTabs = () => (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      {pets.map((pet, idx) => (
        <button
          key={pet.id}
          type="button"
          onClick={() => setActivePetIndex(idx)}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
            idx === activePetIndex
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          {pet.photoPreview ? (
            <img src={pet.photoPreview} alt="" className="w-6 h-6 rounded-full object-cover" />
          ) : (
            <PawPrint className="w-4 h-4" />
          )}
          <span className="text-sm">{pet.name || `Dog ${idx + 1}`}</span>
          {pets.length > 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removePet(idx); }}
              className="ml-1 p-0.5 hover:bg-white/20 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </button>
      ))}
      <button
        type="button"
        onClick={addPet}
        className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/5 text-purple-300 hover:bg-white/10 transition-all border border-dashed border-purple-500/50"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">Add Dog</span>
      </button>
    </div>
  );

  // Step 1: Pet Details (with multi-dog support)
  const Step1PetDetails = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
          <PawPrint className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Tell us about your furry family
        </h2>
        <p className="text-white/60">Add all your dogs — same price for your whole pack! 🐕</p>
      </div>

      {/* Pet Tabs */}
      <PetTabs />

      {/* Active Pet Form */}
      <div className="space-y-4">
        {/* Pet Photo */}
        <div className="flex justify-center mb-4">
          <label className="cursor-pointer group">
            <div className={`w-28 h-28 rounded-full border-2 border-dashed ${activePet.photoPreview ? 'border-purple-500' : 'border-white/30'} flex items-center justify-center overflow-hidden transition-all group-hover:border-purple-500`}>
              {activePet.photoPreview ? (
                <img src={activePet.photoPreview} alt="Pet" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Camera className="w-6 h-6 text-white/50 mx-auto mb-1" />
                  <span className="text-xs text-white/50">Photo</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Pet Name */}
          <div className="sm:col-span-2">
            <Label className="text-white/80">Name *</Label>
            <Input
              value={activePet.name}
              onChange={(e) => handlePetChange('name', e.target.value)}
              placeholder="What&apos;s your dog&apos;s name?"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Breed */}
          <div>
            <Label className="text-white/80">Breed *</Label>
            <select
              value={activePet.breed}
              onChange={(e) => handlePetChange('breed', e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
            >
              <option value="" className="bg-slate-900">Select breed</option>
              {DOG_BREEDS.map(breed => (
                <option key={breed} value={breed} className="bg-slate-900">{breed}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <Label className="text-white/80">Gender</Label>
            <div className="flex gap-2">
              {['Male', 'Female'].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => handlePetChange('gender', g.toLowerCase())}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-all ${
                    activePet.gender === g.toLowerCase()
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <Label className="text-white/80">Age</Label>
            <Input
              value={activePet.age}
              onChange={(e) => handlePetChange('age', e.target.value)}
              placeholder="e.g., 2 years"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Birthday */}
          <div>
            <Label className="text-white/80">Birthday</Label>
            <Input
              type="date"
              value={activePet.birthday}
              onChange={(e) => handlePetChange('birthday', e.target.value)}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>

        {/* Personality Traits */}
        <div>
          <Label className="text-white/80 mb-2 block">Personality (pick up to 4)</Label>
          <div className="flex flex-wrap gap-2">
            {PERSONALITY_TRAITS.map(trait => (
              <button
                key={trait}
                type="button"
                onClick={() => handleTraitToggle(trait)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  (activePet.traits || []).includes(trait)
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {trait}
              </button>
            ))}
          </div>
        </div>

        {/* Favorites */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-white/80">Favorite Treat</Label>
            <Input
              value={activePet.favoriteTreat}
              onChange={(e) => handlePetChange('favoriteTreat', e.target.value)}
              placeholder="e.g., Peanut butter"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <Label className="text-white/80">Favorite Activity</Label>
            <Input
              value={activePet.favoriteActivity}
              onChange={(e) => handlePetChange('favoriteActivity', e.target.value)}
              placeholder="e.g., Beach walks"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
        </div>
      </div>

      {/* Summary of all pets */}
      {pets.length > 1 && (
        <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
          <p className="text-purple-300 text-sm">
            🐕 Your pack: {pets.filter(p => p.name).map(p => p.name).join(', ') || 'Add names above'}
          </p>
          <p className="text-white/50 text-xs mt-1">
            All dogs included — no extra charge!
          </p>
        </div>
      )}
    </motion.div>
  );

  // Step 2: Parent Details
  const Step2ParentDetails = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Now, tell us about you
        </h2>
        <p className="text-white/60">
          So we can keep you connected with {pets.filter(p => p.name).map(p => p.name).join(' & ') || 'your pets'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-white/80">Your Name *</Label>
          <Input
            value={parentData.name}
            onChange={(e) => handleParentChange('name', e.target.value)}
            placeholder="Full name"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        <div className="sm:col-span-2">
          <Label className="text-white/80">Email Address *</Label>
          <Input
            type="email"
            value={parentData.email}
            onChange={(e) => handleParentChange('email', e.target.value)}
            placeholder="you@example.com"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <Label className="text-white/80">Phone Number *</Label>
          <Input
            value={parentData.phone}
            onChange={(e) => handleParentChange('phone', e.target.value)}
            placeholder="10-digit mobile"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <Label className="text-white/80">WhatsApp Number</Label>
          <Input
            value={parentData.sameAsPhone ? parentData.phone : parentData.whatsapp}
            onChange={(e) => handleParentChange('whatsapp', e.target.value)}
            disabled={parentData.sameAsPhone}
            placeholder="WhatsApp number"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 disabled:opacity-50"
          />
          <label className="flex items-center gap-2 mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={parentData.sameAsPhone}
              onChange={(e) => setParentData(prev => ({ ...prev, sameAsPhone: e.target.checked }))}
              className="rounded"
            />
            <span className="text-xs text-white/60">Same as phone</span>
          </label>
        </div>

        <div className="sm:col-span-2">
          <Label className="text-white/80">Address</Label>
          <Input
            value={parentData.address}
            onChange={(e) => handleParentChange('address', e.target.value)}
            placeholder="For deliveries and service visits"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <Label className="text-white/80">City</Label>
          <Input
            value={parentData.city}
            onChange={(e) => handleParentChange('city', e.target.value)}
            placeholder="City"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
        <div>
          <Label className="text-white/80">Pincode</Label>
          <Input
            value={parentData.pincode}
            onChange={(e) => handleParentChange('pincode', e.target.value)}
            placeholder="6-digit pincode"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <Label className="text-white/80">Create Password *</Label>
          <Input
            type="password"
            value={parentData.password}
            onChange={(e) => handleParentChange('password', e.target.value)}
            placeholder="Min 6 characters"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
        <div>
          <Label className="text-white/80">Confirm Password *</Label>
          <Input
            type="password"
            value={parentData.confirmPassword}
            onChange={(e) => handleParentChange('confirmPassword', e.target.value)}
            placeholder="Confirm password"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
      </div>

      {/* Contact Preference */}
      <div>
        <Label className="text-white/80 mb-2 block">Preferred Contact Method</Label>
        <div className="flex gap-2">
          {[
            { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
            { id: 'phone', icon: Phone, label: 'Phone' },
            { id: 'email', icon: Mail, label: 'Email' },
          ].map(method => (
            <button
              key={method.id}
              type="button"
              onClick={() => handleParentChange('contactPreference', method.id)}
              className={`flex-1 py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                parentData.contactPreference === method.id
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
              }`}
            >
              <method.icon className="w-4 h-4" />
              <span className="text-sm">{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-2 pt-4 border-t border-white/10">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={parentData.agreeTerms}
            onChange={(e) => handleParentChange('agreeTerms', e.target.checked)}
            className="mt-1 rounded"
          />
          <span className="text-sm text-white/70">
            I agree to the <a href="/terms" className="text-purple-400 hover:underline">Terms & Conditions</a> *
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={parentData.agreePrivacy}
            onChange={(e) => handleParentChange('agreePrivacy', e.target.checked)}
            className="mt-1 rounded"
          />
          <span className="text-sm text-white/70">
            I agree to the <a href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</a> *
          </span>
        </label>
      </div>
    </motion.div>
  );

  // Step 3: Plan Selection
  const Step3PlanSelection = () => {
    const petNames = pets.filter(p => p.name).map(p => p.name);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Choose your Concierge® journey
          </h2>
          <p className="text-white/60">
            {petNames.length > 1 
              ? `Same price for ${petNames.join(', ')} — your whole pack!`
              : 'Start free or unlock the full experience'}
          </p>
        </div>

        <div className="grid gap-4">
          {Object.values(PLANS).map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-5 rounded-xl border text-left transition-all ${
                selectedPlan === plan.id
                  ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/50'
                  : 'bg-white/5 border-white/20 hover:bg-white/10'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2 right-4 px-2 py-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-sm text-white/60">{plan.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/60 text-sm">{plan.period}</span>
                  {plan.savings && (
                    <p className="text-green-400 text-xs">{plan.savings}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.features.map((feature, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-white/10 rounded-full text-white/70">
                    {feature}
                  </span>
                ))}
              </div>
              
              {selectedPlan === plan.id && (
                <div className="absolute top-1/2 -translate-y-1/2 right-4">
                  <Check className="w-6 h-6 text-purple-400" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Pack summary */}
        {petNames.length > 1 && (
          <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/30">
            <p className="text-green-300 text-sm">
              ✨ Great news! All {petNames.length} dogs ({petNames.join(', ')}) are included at no extra cost.
            </p>
          </div>
        )}

        {PLANS[selectedPlan].requiresPayment && (
          <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 text-purple-300">
              <Shield className="w-5 h-5" />
              <span className="text-sm">Secure payment powered by Razorpay</span>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  // Step 4: Welcome
  const Step4Welcome = () => {
    const validPets = pets.filter(p => p.name.trim());
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center"
        >
          <Sparkles className="w-16 h-16 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
        >
          Welcome to the Family! 🎉
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-white/70 mb-8"
        >
          {validPets.length > 1 
            ? `${validPets.map(p => p.name).join(' & ')}'s Pet Soul™ profiles are ready`
            : `${validPets[0]?.name || 'Your pet'}'s Pet Soul™ profile is ready`}
        </motion.p>
        
        {/* Pet cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {validPets.map((pet, idx) => (
            <div key={pet.id} className="inline-block p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                {pet.photoPreview ? (
                  <img src={pet.photoPreview} alt={pet.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                    <PawPrint className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">{pet.name}</h3>
                  <p className="text-white/60 text-sm">{pet.breed}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 px-8 py-6 text-lg rounded-full"
          >
            Meet Mira - Your Concierge®
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      <SEOHead 
        title="Join Pet Soul™ | The Doggy Company"
        description="Create your pet&apos;s soul profile and join the Pet Pass Concierge® experience"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950/20 to-slate-950 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2">
              <PawPrint className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold text-white">The Doggy Company</span>
            </a>
          </div>

          {/* Step Indicator */}
          {currentStep < 4 && <StepIndicator />}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          {/* Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && <Step1PetDetails key="step1" />}
              {currentStep === 2 && <Step2ParentDetails key="step2" />}
              {currentStep === 3 && <Step3PlanSelection key="step3" />}
              {currentStep === 4 && <Step4Welcome key="step4" />}
            </AnimatePresence>

            {/* Navigation */}
            {currentStep < 4 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="text-white/70 hover:text-white disabled:opacity-30"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                {currentStep < 3 ? (
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    {isSubmitting ? 'Creating...' : PLANS[selectedPlan].requiresPayment ? 'Continue to Payment' : 'Activate Pet Pass'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Help text */}
          {currentStep < 4 && (
            <p className="text-center text-white/40 text-sm mt-6">
              Already have an account? <a href="/login" className="text-purple-400 hover:underline">Sign in</a>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default PetSoulOnboard;

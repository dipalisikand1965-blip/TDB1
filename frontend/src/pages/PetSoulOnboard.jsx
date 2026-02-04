import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  PawPrint, ArrowRight, ArrowLeft, Heart, Sparkles, 
  Camera, User, Mail, Phone, Plus, Trash2,
  Lock, Check, Crown, MessageCircle, Shield, X,
  Gift, Cake, Star, Stethoscope, GraduationCap, 
  Scissors, PartyPopper, Home
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';

// Plan options - Same price for unlimited dogs!
const PLANS = {
  explorer: {
    id: 'explorer',
    name: '7-Day Explorer',
    price: 'Free',
    period: '7 days',
    validity_days: 7,
    description: 'Discover the Pet Soul™ experience',
    features: ['Basic Pet Profile', 'Limited Mira AI Concierge®', 'Browse 14 Pillars'],
    requiresPayment: false,
  },
  trial: {
    id: 'trial',
    name: 'Pet Pass Trial',
    price: '₹499',
    priceValue: 499,
    gst: 90, // 18% GST
    period: '/month',
    validity_days: 30,
    description: 'Full Concierge® experience',
    features: ['Full Pet Soul™', 'Unlimited Mira AI Concierge®', 'All 14 Pillars', 'Priority Support'],
    requiresPayment: true,
    badge: 'Try First',
  },
  founder: {
    id: 'founder',
    name: 'Pet Pass Founder',
    price: '₹4,999',
    priceValue: 4999,
    gst: 900, // 18% GST
    period: '/year',
    validity_days: 365,
    description: 'Best value - full Concierge® relationship',
    features: ['Everything in Trial', 'Double Paw Points', 'Birthday Surprise', 'Early Access', 'Founder Badge'],
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

// Celebration Pillars (services they can explore)
const CELEBRATION_PILLARS = [
  { id: 'dine', icon: Gift, name: 'Dine', description: 'Gourmet treats & cakes', color: 'from-orange-500 to-amber-500' },
  { id: 'groom', icon: Scissors, name: 'Groom', description: 'Spa & grooming', color: 'from-pink-500 to-rose-500' },
  { id: 'learn', icon: GraduationCap, name: 'Learn', description: 'Training & behaviour', color: 'from-blue-500 to-cyan-500' },
  { id: 'heal', icon: Stethoscope, name: 'Heal', description: 'Health & wellness', color: 'from-green-500 to-emerald-500' },
  { id: 'play', icon: PartyPopper, name: 'Play', description: 'Toys & activities', color: 'from-purple-500 to-violet-500' },
  { id: 'stay', icon: Home, name: 'Stay', description: 'Boarding & daycare', color: 'from-indigo-500 to-blue-500' },
  { id: 'celebrate', icon: Cake, name: 'Celebrate', description: 'Birthdays & events', color: 'from-yellow-500 to-orange-500' },
  { id: 'shop', icon: Star, name: 'Shop', description: 'Premium products', color: 'from-rose-500 to-pink-500' },
];

// Empty pet template
const createEmptyPet = (index = 0) => ({
  id: Date.now() + index,
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
  
  // Map old plan names to new ones
  const mapPlanName = (plan) => {
    if (plan === 'foundation') return 'founder';
    return plan;
  };
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(mapPlanName(initialPlan));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activePetIndex, setActivePetIndex] = useState(0);
  
  // How many pets question
  const [petCount, setPetCount] = useState(1);
  const [petCountConfirmed, setPetCountConfirmed] = useState(false);
  
  // Multiple pets support
  const [pets, setPets] = useState([createEmptyPet()]);
  
  // Celebration interests
  const [selectedCelebrations, setSelectedCelebrations] = useState([]);
  
  // Parent data - FIRST step
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

  const totalSteps = 5; // Parent -> Plan -> Pets -> Celebrations -> Welcome
  const activePet = pets[activePetIndex];

  // Initialize pets array when count is confirmed
  useEffect(() => {
    if (petCountConfirmed && pets.length !== petCount) {
      const newPets = Array.from({ length: petCount }, (_, i) => 
        pets[i] || createEmptyPet(i)
      );
      setPets(newPets);
      setActivePetIndex(0);
    }
  }, [petCount, petCountConfirmed]);

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

  const toggleCelebration = (pillarId) => {
    setSelectedCelebrations(prev => 
      prev.includes(pillarId) 
        ? prev.filter(id => id !== pillarId)
        : [...prev, pillarId]
    );
  };

  const validateStep = (step) => {
    setError('');
    
    // Step 1: Parent Details
    if (step === 1) {
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
    
    // Step 2: Plan Selection - no validation needed
    
    // Step 3: Pet Details
    if (step === 3) {
      const validPet = pets.some(pet => pet.name.trim() && pet.breed);
      if (!validPet) {
        setError('Please enter at least one pet with name and breed');
        return false;
      }
    }
    
    // Step 4: Celebrations - optional, no validation
    
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
      const plan = PLANS[selectedPlan];
      await fetch(getApiUrl('/api/memberships'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan: selectedPlan,
          plan_name: plan.name,
          validity_days: plan.validity_days,
          price: plan.priceValue || 0,
          gst: plan.gst || 0,
          status: plan.requiresPayment ? 'pending_payment' : 'active',
          celebration_interests: selectedCelebrations,
        }),
      });
      
      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Go to welcome
      setCurrentStep(5);
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Indicator
  const StepIndicator = () => {
    const stepLabels = ['You', 'Plan', 'Pets', 'Interests', 'Done'];
    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
        {stepLabels.map((label, idx) => {
          const step = idx + 1;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step === currentStep 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white scale-110 shadow-lg shadow-amber-500/30' 
                      : step < currentStep 
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {step < currentStep ? <Check className="w-5 h-5" /> : step}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${
                  step === currentStep ? 'text-amber-400 font-semibold' : 'text-slate-500'
                }`}>
                  {label}
                </span>
              </div>
              {step < 5 && (
                <div className={`w-6 sm:w-10 h-1 rounded ${step < currentStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // STEP 1: Parent Details (FIRST - for CRM capture)
  const Step1ParentDetails = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <User className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Welcome, Pet Parent!
        </h2>
        <p className="text-slate-300 text-base">
          Let&apos;s set up your account first
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label className="text-slate-200 font-medium">Your Name *</Label>
          <Input
            data-testid="parent-name-input"
            value={parentData.name}
            onChange={(e) => handleParentChange('name', e.target.value)}
            placeholder="Full name"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
        </div>

        <div className="sm:col-span-2">
          <Label className="text-slate-200 font-medium">Email Address *</Label>
          <Input
            data-testid="parent-email-input"
            type="email"
            value={parentData.email}
            onChange={(e) => handleParentChange('email', e.target.value)}
            placeholder="you@example.com"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
        </div>

        <div>
          <Label className="text-slate-200 font-medium">Phone Number *</Label>
          <Input
            data-testid="parent-phone-input"
            value={parentData.phone}
            onChange={(e) => handleParentChange('phone', e.target.value)}
            placeholder="10-digit mobile"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
        </div>

        <div>
          <Label className="text-slate-200 font-medium">WhatsApp Number</Label>
          <Input
            data-testid="parent-whatsapp-input"
            value={parentData.sameAsPhone ? parentData.phone : parentData.whatsapp}
            onChange={(e) => handleParentChange('whatsapp', e.target.value)}
            disabled={parentData.sameAsPhone}
            placeholder="WhatsApp number"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 disabled:opacity-60 focus:border-amber-500"
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={parentData.sameAsPhone}
              onChange={(e) => setParentData(prev => ({ ...prev, sameAsPhone: e.target.checked }))}
              className="rounded border-slate-500 bg-slate-700 text-amber-500"
            />
            <span className="text-sm text-slate-300">Same as phone</span>
          </label>
        </div>

        <div className="sm:col-span-2">
          <Label className="text-slate-200 font-medium">Address</Label>
          <Input
            data-testid="parent-address-input"
            value={parentData.address}
            onChange={(e) => handleParentChange('address', e.target.value)}
            placeholder="For deliveries and service visits"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
        </div>

        <div>
          <Label className="text-slate-200 font-medium">City</Label>
          <Input
            data-testid="parent-city-input"
            value={parentData.city}
            onChange={(e) => handleParentChange('city', e.target.value)}
            placeholder="City"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
        </div>
        <div>
          <Label className="text-slate-200 font-medium">Pincode</Label>
          <Input
            data-testid="parent-pincode-input"
            value={parentData.pincode}
            onChange={(e) => handleParentChange('pincode', e.target.value)}
            placeholder="6-digit pincode"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
        </div>

        <div>
          <Label className="text-slate-200 font-medium">Create Password *</Label>
          <Input
            data-testid="parent-password-input"
            type="password"
            value={parentData.password}
            onChange={(e) => handleParentChange('password', e.target.value)}
            placeholder="Min 6 characters"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
        </div>
        <div>
          <Label className="text-slate-200 font-medium">Confirm Password *</Label>
          <Input
            data-testid="parent-confirm-password-input"
            type="password"
            value={parentData.confirmPassword}
            onChange={(e) => handleParentChange('confirmPassword', e.target.value)}
            placeholder="Confirm password"
            className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Contact Preference */}
      <div>
        <Label className="text-slate-200 font-medium mb-3 block">Preferred Contact Method</Label>
        <div className="flex gap-2">
          {[
            { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
            { id: 'phone', icon: Phone, label: 'Phone' },
            { id: 'email', icon: Mail, label: 'Email' },
          ].map(method => (
            <button
              key={method.id}
              type="button"
              data-testid={`contact-${method.id}-btn`}
              onClick={() => handleParentChange('contactPreference', method.id)}
              className={`flex-1 py-3 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all font-medium ${
                parentData.contactPreference === method.id
                  ? 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
              }`}
            >
              <method.icon className="w-4 h-4" />
              <span className="text-sm">{method.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-3 pt-4 border-t border-slate-700">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={parentData.agreeTerms}
            onChange={(e) => handleParentChange('agreeTerms', e.target.checked)}
            className="mt-1 rounded border-slate-500 bg-slate-700 text-amber-500"
          />
          <span className="text-sm text-slate-300">
            I agree to the <a href="/terms" className="text-amber-400 hover:underline font-medium">Terms &amp; Conditions</a> *
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={parentData.agreePrivacy}
            onChange={(e) => handleParentChange('agreePrivacy', e.target.checked)}
            className="mt-1 rounded border-slate-500 bg-slate-700 text-amber-500"
          />
          <span className="text-sm text-slate-300">
            I agree to the <a href="/privacy" className="text-amber-400 hover:underline font-medium">Privacy Policy</a> *
          </span>
        </label>
      </div>
    </motion.div>
  );

  // STEP 2: Plan Selection
  const Step2PlanSelection = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Crown className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Choose Your Concierge® Plan
        </h2>
        <p className="text-slate-300 text-base">
          Same price for all your dogs — your whole pack included!
        </p>
      </div>

      <div className="grid gap-4">
        {Object.values(PLANS).map((plan) => (
          <button
            key={plan.id}
            type="button"
            data-testid={`plan-${plan.id}-btn`}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative p-5 rounded-2xl border text-left transition-all ${
              selectedPlan === plan.id
                ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/50 shadow-lg'
                : 'bg-slate-800/50 border-slate-600 hover:bg-slate-800 hover:border-slate-500'
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-xs font-bold text-white shadow-lg">
                {plan.badge}
              </span>
            )}
            
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-slate-300 mt-1">{plan.description}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">{plan.price}</span>
                {plan.gst > 0 && (
                  <span className="text-slate-400 text-xs block">+ ₹{plan.gst} GST</span>
                )}
                <span className="text-slate-400 text-sm">{plan.period}</span>
                {plan.savings && (
                  <p className="text-emerald-400 text-xs font-semibold mt-1">{plan.savings}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {plan.features.map((feature, idx) => (
                <span key={idx} className="text-xs px-3 py-1.5 bg-slate-700/50 rounded-full text-slate-200 font-medium">
                  {feature}
                </span>
              ))}
            </div>
            
            {selectedPlan === plan.id && (
              <div className="absolute top-1/2 -translate-y-1/2 right-5">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {PLANS[selectedPlan].requiresPayment && (
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-600">
          <div className="flex items-center gap-3 text-slate-200">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">Secure payment powered by Razorpay</span>
          </div>
        </div>
      )}
    </motion.div>
  );

  // STEP 3: Pet Details with "How many pets?" first
  const Step3PetDetails = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <PawPrint className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Tell Us About Your Furry Family
        </h2>
        <p className="text-slate-300">All dogs included — no extra charge!</p>
      </div>

      {/* How many pets question - shown first */}
      {!petCountConfirmed ? (
        <div className="space-y-6">
          <div className="text-center p-6 bg-slate-800 rounded-2xl border border-slate-600">
            <h3 className="text-xl font-semibold text-white mb-4">
              How many dogs are in your family?
            </h3>
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPetCount(Math.max(1, petCount - 1))}
                className="w-12 h-12 rounded-full bg-slate-700 text-white font-bold text-xl hover:bg-slate-600 transition-colors"
              >
                -
              </button>
              <span className="text-4xl font-bold text-amber-400 w-16 text-center">{petCount}</span>
              <button
                type="button"
                onClick={() => setPetCount(Math.min(10, petCount + 1))}
                className="w-12 h-12 rounded-full bg-slate-700 text-white font-bold text-xl hover:bg-slate-600 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-4">
              {petCount === 1 ? '1 dog' : `${petCount} dogs`} — all covered under your plan!
            </p>
          </div>
          
          <Button
            data-testid="confirm-pet-count-btn"
            onClick={() => setPetCountConfirmed(true)}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-amber-500/30"
          >
            Continue with {petCount === 1 ? '1 Dog' : `${petCount} Dogs`}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      ) : (
        <>
          {/* Pet Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {pets.map((pet, idx) => (
              <button
                key={pet.id}
                type="button"
                data-testid={`pet-tab-${idx}`}
                onClick={() => setActivePetIndex(idx)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all font-medium ${
                  idx === activePetIndex
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {pet.photoPreview ? (
                  <img src={pet.photoPreview} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <PawPrint className="w-4 h-4" />
                )}
                <span className="text-sm">{pet.name || `Dog ${idx + 1}`}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPets(prev => [...prev, createEmptyPet(prev.length)]);
                setActivePetIndex(pets.length);
              }}
              className="flex items-center gap-1 px-3 py-2.5 rounded-full bg-slate-800 text-amber-400 hover:bg-slate-700 transition-all border border-dashed border-amber-500/50 font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add</span>
            </button>
          </div>

          {/* Active Pet Form */}
          <div className="space-y-4 p-5 bg-slate-800/50 rounded-2xl border border-slate-600">
            {/* Pet Photo */}
            <div className="flex justify-center mb-4">
              <label className="cursor-pointer group">
                <div className={`w-28 h-28 rounded-full border-2 border-dashed ${activePet.photoPreview ? 'border-amber-500' : 'border-slate-500'} flex items-center justify-center overflow-hidden transition-all group-hover:border-amber-400`}>
                  {activePet.photoPreview ? (
                    <img src={activePet.photoPreview} alt="Pet" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <span className="text-xs text-slate-400">Photo</span>
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Pet Name */}
              <div className="sm:col-span-2">
                <Label className="text-slate-200 font-medium">Name *</Label>
                <Input
                  data-testid="pet-name-input"
                  value={activePet.name}
                  onChange={(e) => handlePetChange('name', e.target.value)}
                  placeholder="What's your dog's name?"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>

              {/* Breed */}
              <div>
                <Label className="text-slate-200 font-medium">Breed *</Label>
                <select
                  data-testid="pet-breed-select"
                  value={activePet.breed}
                  onChange={(e) => handlePetChange('breed', e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-slate-700 border border-slate-600 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="" className="bg-slate-800">Select breed</option>
                  {DOG_BREEDS.map(breed => (
                    <option key={breed} value={breed} className="bg-slate-800">{breed}</option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div>
                <Label className="text-slate-200 font-medium">Gender</Label>
                <div className="flex gap-2">
                  {['Male', 'Female'].map(g => (
                    <button
                      key={g}
                      type="button"
                      data-testid={`pet-gender-${g.toLowerCase()}-btn`}
                      onClick={() => handlePetChange('gender', g.toLowerCase())}
                      className={`flex-1 py-2.5 px-4 rounded-xl border transition-all font-medium ${
                        activePet.gender === g.toLowerCase()
                          ? 'bg-amber-500 border-amber-400 text-white'
                          : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <Label className="text-slate-200 font-medium">Age</Label>
                <Input
                  data-testid="pet-age-input"
                  value={activePet.age}
                  onChange={(e) => handlePetChange('age', e.target.value)}
                  placeholder="e.g., 2 years"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>

              {/* Birthday */}
              <div>
                <Label className="text-slate-200 font-medium">Birthday</Label>
                <Input
                  data-testid="pet-birthday-input"
                  type="date"
                  value={activePet.birthday}
                  onChange={(e) => handlePetChange('birthday', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white focus:border-amber-500"
                />
              </div>
            </div>

            {/* Personality Traits */}
            <div>
              <Label className="text-slate-200 font-medium mb-3 block">Personality (pick up to 4)</Label>
              <div className="flex flex-wrap gap-2">
                {PERSONALITY_TRAITS.map(trait => (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => handleTraitToggle(trait)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all font-medium ${
                      (activePet.traits || []).includes(trait)
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
                <Label className="text-slate-200 font-medium">Favorite Treat</Label>
                <Input
                  data-testid="pet-treat-input"
                  value={activePet.favoriteTreat}
                  onChange={(e) => handlePetChange('favoriteTreat', e.target.value)}
                  placeholder="e.g., Peanut butter"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>
              <div>
                <Label className="text-slate-200 font-medium">Favorite Activity</Label>
                <Input
                  data-testid="pet-activity-input"
                  value={activePet.favoriteActivity}
                  onChange={(e) => handlePetChange('favoriteActivity', e.target.value)}
                  placeholder="e.g., Beach walks"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Summary of all pets */}
          {pets.length > 1 && (
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
              <p className="text-emerald-300 text-sm font-medium">
                Your pack: {pets.filter(p => p.name).map(p => p.name).join(', ') || 'Add names above'}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                All dogs included — no extra charge!
              </p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  // STEP 4: Celebrations/Interests Selection
  const Step4Celebrations = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <PartyPopper className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          What Celebrations Interest You?
        </h2>
        <p className="text-slate-300 text-base">
          Select the services you&apos;d like to explore (optional)
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CELEBRATION_PILLARS.map((pillar) => {
          const IconComponent = pillar.icon;
          const isSelected = selectedCelebrations.includes(pillar.id);
          return (
            <button
              key={pillar.id}
              type="button"
              data-testid={`celebration-${pillar.id}-btn`}
              onClick={() => toggleCelebration(pillar.id)}
              className={`relative p-4 rounded-2xl border text-center transition-all ${
                isSelected
                  ? 'bg-gradient-to-br ' + pillar.color + ' border-transparent shadow-lg scale-105'
                  : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-slate-500'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-emerald-500" />
                </div>
              )}
              <IconComponent className={`w-8 h-8 mx-auto mb-2 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
              <h3 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-white'}`}>{pillar.name}</h3>
              <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{pillar.description}</p>
            </button>
          );
        })}
      </div>

      {selectedCelebrations.length > 0 && (
        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 text-center">
          <p className="text-amber-300 font-medium">
            You&apos;re interested in {selectedCelebrations.length} celebration{selectedCelebrations.length > 1 ? 's' : ''}!
          </p>
          <p className="text-slate-400 text-sm mt-1">
            We&apos;ll personalize your dashboard with these services
          </p>
        </div>
      )}
    </motion.div>
  );

  // STEP 5: Welcome / Success
  const Step5Welcome = () => {
    const validPets = pets.filter(p => p.name.trim());
    const plan = PLANS[selectedPlan];
    
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
          className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center shadow-xl shadow-amber-500/40"
        >
          <Sparkles className="w-16 h-16 text-white" />
        </motion.div>
        
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-3xl sm:text-4xl font-bold text-white mb-4"
        >
          Welcome to the Family!
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-slate-300 mb-2"
        >
          {validPets.length > 1 
            ? `${validPets.map(p => p.name).join(' & ')}'s Pet Soul™ profiles are ready`
            : `${validPets[0]?.name || 'Your pet'}'s Pet Soul™ profile is ready`}
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="inline-block px-4 py-2 bg-slate-800 rounded-full text-amber-400 font-semibold mb-6"
        >
          {plan.name} • {plan.validity_days} days active
        </motion.div>
        
        {/* Pet cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {validPets.map((pet) => (
            <div key={pet.id} className="inline-block p-4 bg-slate-800 rounded-2xl border border-slate-600">
              <div className="flex items-center gap-3">
                {pet.photoPreview ? (
                  <img src={pet.photoPreview} alt={pet.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center">
                    <PawPrint className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="text-left">
                  <h3 className="text-lg font-bold text-white">{pet.name}</h3>
                  <p className="text-slate-400 text-sm">{pet.breed}</p>
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
            data-testid="go-to-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 px-8 py-6 text-lg rounded-full font-semibold shadow-xl shadow-amber-500/30"
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
        description="Create your pet's soul profile and join the Pet Pass Concierge® experience"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <a href="/" className="inline-flex items-center gap-2">
              <PawPrint className="w-8 h-8 text-amber-500" />
              <span className="text-xl font-bold text-white">The Doggy Company</span>
            </a>
          </div>

          {/* Step Indicator */}
          {currentStep < 5 && <StepIndicator />}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm text-center font-medium">
              {error}
            </div>
          )}

          {/* Card */}
          <Card className="bg-slate-800/30 border-slate-700 backdrop-blur-sm p-6 sm:p-8 rounded-2xl">
            <AnimatePresence mode="wait">
              {currentStep === 1 && <Step1ParentDetails key="step1" />}
              {currentStep === 2 && <Step2PlanSelection key="step2" />}
              {currentStep === 3 && <Step3PetDetails key="step3" />}
              {currentStep === 4 && <Step4Celebrations key="step4" />}
              {currentStep === 5 && <Step5Welcome key="step5" />}
            </AnimatePresence>

            {/* Navigation */}
            {currentStep < 5 && currentStep !== 3 && (
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                {currentStep < 4 ? (
                  <Button
                    data-testid="continue-btn"
                    onClick={nextStep}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-semibold shadow-lg shadow-amber-500/30"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    data-testid="submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-semibold shadow-lg shadow-amber-500/30"
                  >
                    {isSubmitting ? 'Creating...' : PLANS[selectedPlan].requiresPayment ? 'Continue to Payment' : 'Activate Pet Pass'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* Step 3 has its own navigation due to pet count confirmation */}
            {currentStep === 3 && petCountConfirmed && (
              <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setPetCountConfirmed(false);
                    prevStep();
                  }}
                  className="text-slate-300 hover:text-white hover:bg-slate-700 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button
                  data-testid="continue-to-celebrations-btn"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 font-semibold shadow-lg shadow-amber-500/30"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </Card>

          {/* Help text */}
          {currentStep < 5 && (
            <p className="text-center text-slate-500 text-sm mt-6">
              Already have an account? <a href="/login" className="text-amber-400 hover:underline font-medium">Sign in</a>
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default PetSoulOnboard;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import MembershipPayment from '../components/MembershipPayment';
import PetSoulJourney from '../components/PetSoulJourney';
import MobileNavBar from '../components/MobileNavBar';
import { 
  PawPrint, Check, Star, Heart, Gift, Calendar, 
  Shield, Sparkles, ChevronRight, Eye, EyeOff, ArrowRight,
  Utensils, Plane, Home, Dumbbell, Brain, Phone, FileText,
  ShoppingBag, Users, Award, Zap, X, Stethoscope, CreditCard, Crown
} from 'lucide-react';
import { getApiUrl } from '../utils/api';
import SEOHead from '../components/SEOHead';

// Tenure Recognition levels (Not gamified - reflects depth of relationship)
const TENURE_LEVELS = [
  { 
    key: 'early_journey',
    name: 'Early Journey', 
    description: 'Just getting to know each other',
    minMonths: 0,
    color: 'from-slate-400 to-slate-500'
  },
  { 
    key: 'growing_together',
    name: 'Growing Together', 
    description: 'Building understanding over time',
    minMonths: 3,
    color: 'from-blue-400 to-blue-600'
  },
  { 
    key: 'well_known',
    name: 'Well Known', 
    description: 'We understand your pet deeply',
    minMonths: 6,
    color: 'from-teal-400 to-teal-600'
  },
  { 
    key: 'deeply_understood',
    name: 'Deeply Understood', 
    description: 'Your pet\'s needs are anticipated',
    minMonths: 12,
    color: 'from-amber-400 to-amber-600'
  }
];

// Sample Pet Soul profile for Bruno - Focus on identity, preferences, milestones
const SAMPLE_PET_SOUL = {
  name: 'Bruno',
  breed: 'Golden Retriever',
  age: '3 years',
  image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop',
  personality: ['Playful', 'Friendly', 'Food-lover'],
  favorites: {
    treat: 'Peanut Butter Cake',
    activity: 'Beach walks',
    restaurant: 'Cafe Pawsome'
  },
  preferences: {
    dietaryNeeds: 'Grain-free diet',
    allergyAlert: 'Sensitive to chicken',
    exerciseLevel: 'High energy'
  },
  milestones: [
    { icon: '🎂', name: 'Birthday Celebrated', date: 'Oct 2025' },
    { icon: '🍽️', name: 'First Dine Out', date: 'Sep 2025' },
    { icon: '🏨', name: 'First Stay', date: 'Aug 2025' },
    { icon: '✈️', name: 'First Travel', date: 'Jul 2025' }
  ],
  healthContinuity: {
    lastVaccination: 'Nov 2025',
    nextCheckup: 'Feb 2026',
    vetName: 'Dr. Sharma'
  }
};

const MembershipPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, login, register, loading: authLoading } = useAuth();
  
  // Redirect destination after login
  const from = location.state?.from || '/my-pets';
  
  // Auth form state
  const [isLogin, setIsLogin] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showAllPillars, setShowAllPillars] = useState(false);

  // Fetch user's pets if logged in
  useEffect(() => {
    const fetchUserPets = async () => {
      if (!user?.email) {
        setLoadingPets(false);
        return;
      }
      
      try {
        const response = await fetch(`${getApiUrl()}/api/pets?email=${user.email}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserPets(data.pets || []);
        }
      } catch (error) {
        console.error('Error fetching pets:', error);
      } finally {
        setLoadingPets(false);
      }
    };
    
    fetchUserPets();
  }, [user, token]);

  // Handle opening Mira AI
  const handleOpenMira = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  // If logged in with pets, show Pet Soul Journey instead of sales page
  if (user && userPets.length > 0 && !loadingPets) {
    return (
      <PetSoulJourney 
        user={user} 
        pets={userPets} 
        onOpenMira={handleOpenMira}
      />
    );
  }

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    // Redirect to Pet Soul onboarding page - the entry point for new members
    navigate(`/pet-soul-onboard?plan=${plan}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setSubmitting(false);
          return;
        }
        await register({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        });
      }
      // After successful auth, show payment modal if a plan was selected
      setShowAuthModal(false);
      if (selectedPlan) {
        setShowPaymentModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (membership) => {
    setShowPaymentModal(false);
    // Refresh user data and redirect to my-pets
    navigate('/my-pets');
  };

  // Pillar icons mapping
  const pillarIcons = {
    celebrate: Gift,
    dine: Utensils,
    travel: Plane,
    stay: Home,
    care: Heart,
    fit: Dumbbell,
    advisory: Brain,
    emergency: Phone,
    paperwork: FileText,
    shop: ShoppingBag,
    club: Users,
    enjoy: Star
  };

  // Core pillars to show initially (6)
  const corePillars = [
    { id: 'care', name: 'Care', desc: 'Grooming, walking, sitting', color: 'purple' },
    { id: 'dine', name: 'Dine', desc: 'Pet-friendly restaurants', color: 'orange' },
    { id: 'travel', name: 'Travel', desc: 'Pet travel assistance', color: 'blue' },
    { id: 'stay', name: 'Stay', desc: 'Pet-friendly hotels', color: 'green' },
    { id: 'celebrate', name: 'Celebrate', desc: 'Birthday cakes, treats & parties', color: 'pink' },
    { id: 'emergency', name: 'Emergency', desc: '24/7 pet emergency help', color: 'red' },
  ];

  // Additional pillars (revealed on expand)
  const additionalPillars = [
    { id: 'fit', name: 'Fit', desc: 'Exercise & wellness', color: 'teal' },
    { id: 'advisory', name: 'Advisory', desc: 'Expert consultations', color: 'indigo' },
    { id: 'paperwork', name: 'Paperwork', desc: 'Health records & docs', color: 'slate' },
    { id: 'shop', name: 'Shop Assist', desc: 'Curated products via Mira', color: 'amber' },
    { id: 'club', name: 'Club', desc: 'Community & rewards', color: 'violet' },
    { id: 'enjoy', name: 'Enjoy', desc: 'Events & experiences', color: 'rose' },
  ];

  const benefits = [
    { icon: PawPrint, title: 'Pet Soul™ Profile', desc: 'Deep, evolving profile for your pet', primary: true },
    { icon: Sparkles, title: 'Mira AI Concierge®', desc: '24/7 intelligent pet assistant', primary: true },
    { icon: Calendar, title: 'Smart Reminders', desc: 'Birthday, vaccine & event alerts', primary: true },
    { icon: Shield, title: 'Health Vault', desc: 'Secure medical records storage', primary: true },
    { icon: Zap, title: 'Priority Support', desc: 'Fast-track help when you need it', primary: true },
    { icon: Award, title: 'Paw Rewards', desc: 'Earn points on every interaction', primary: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <SEOHead page="membership" path="/membership" />

      {/* Simple Fixed Header for Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-pink-500 rounded-lg flex items-center justify-center">
              <PawPrint className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">The Doggy Company</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
              Sign in
            </Link>
            <Link to="/pet-soul-onboard">
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-full px-4">
                Join now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Pet Pass Introduction */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white pt-16">
        {/* Background pattern - using will-change for smooth rendering */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ willChange: 'transform' }}>
          <div className="absolute top-20 -left-10 w-72 h-72 bg-teal-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 -right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <PawPrint className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">Pet Pass — Personal Concierge</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              A Personal Concierge
              <br />
              <span className="text-teal-300">
                For Your Dog
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Pet Pass creates a living concierge relationship — beginning with understanding your dog, sustained through memory, care, and continuity.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/pet-soul-onboard">
                <Button 
                  size="lg"
                  className="bg-white text-teal-700 hover:bg-gray-100 px-8 py-6 text-lg rounded-full shadow-xl transition-all hover:scale-105"
                  data-testid="hero-join-now-btn"
                >
                  <PawPrint className="w-5 h-5 mr-2" />
                  Join now
                </Button>
              </Link>
              <Button 
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                size="lg"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
                data-testid="hero-talk-mira-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Talk to Mira
              </Button>
            </div>

            {/* Already a member? Sign in */}
            <div className="mt-6">
              <Link to="/login" className="text-white/60 hover:text-white text-sm underline underline-offset-4">
                Already a member? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* What Pet Pass IS and IS NOT */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              What is Pet Pass?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* What it IS */}
            <Card className="p-6 border-2 border-green-200 bg-green-50/50">
              <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5" /> Pet Pass IS
              </h3>
              <ul className="space-y-3">
                {[
                  'A personal concierge for your dog',
                  'A system that understands your pet first',
                  'A living relationship between you, your pet, and our care system',
                  'Memory that grows smarter over time'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-green-700">
                    <Check className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* What it IS NOT */}
            <Card className="p-6 border-2 border-gray-200 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-600 mb-4 flex items-center gap-2">
                <X className="w-5 h-5" /> Pet Pass is NOT
              </h3>
              <ul className="space-y-3">
                {[
                  'A shopping membership',
                  'A discount program',
                  'A subscription box',
                  'A product bundle'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-500">
                    <X className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span className="line-through">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* How it works */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">How Pet Pass Works</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '🔍', title: 'Understand', desc: 'We learn about your dog' },
                { icon: '🧭', title: 'Guide', desc: 'Personalized recommendations' },
                { icon: '🤝', title: 'Support', desc: 'Concierge care when needed' },
                { icon: '🧠', title: 'Remember', desc: 'We never forget' }
              ].map((step, idx) => (
                <div key={idx} className="text-center p-4">
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Life System Pillars Section */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              14 Life Pillars Unlocked
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              From celebrations to emergencies — your pet&apos;s entire life covered.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {corePillars.map((pillar) => {
              const Icon = pillarIcons[pillar.id];
              return (
                <Card 
                  key={pillar.id}
                  className={`p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-${pillar.color}-200 group`}
                  data-testid={`pillar-${pillar.id}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-${pillar.color}-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 text-${pillar.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{pillar.name}</h3>
                  <p className="text-sm text-gray-500">{pillar.desc}</p>
                </Card>
              );
            })}
          </div>

          {/* Expandable additional pillars */}
          {showAllPillars && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 animate-in fade-in slide-in-from-top-4 duration-300">
              {additionalPillars.map((pillar) => {
                const Icon = pillarIcons[pillar.id];
                return (
                  <Card 
                    key={pillar.id}
                    className={`p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-${pillar.color}-200 group`}
                    data-testid={`pillar-${pillar.id}`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-${pillar.color}-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 text-${pillar.color}-600`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{pillar.name}</h3>
                    <p className="text-sm text-gray-500">{pillar.desc}</p>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Show more/less toggle */}
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAllPillars(!showAllPillars)}
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
              data-testid="toggle-pillars-btn"
            >
              {showAllPillars ? (
                <>Show less</>
              ) : (
                <>And more, as your journey grows <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              More Than Just Services
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your pet deserves a complete ecosystem that learns, remembers, and anticipates their needs.
            </p>
          </div>

          {/* Primary benefits - full visual weight */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {benefits.filter(b => b.primary).map((benefit, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow" data-testid={`benefit-${benefit.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Secondary benefits (Paw Rewards) - reduced visual weight */}
          <div className="flex justify-center">
            {benefits.filter(b => !b.primary).map((benefit, idx) => (
              <div key={idx} className="flex gap-3 p-4 bg-gray-50 rounded-xl max-w-sm" data-testid={`benefit-${benefit.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 text-sm">{benefit.title}</h3>
                  <p className="text-xs text-gray-400">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pet Soul Preview Section - Focus on Identity, Preferences, Milestones */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
              <PawPrint className="w-5 h-5 text-pink-400" />
              <span className="text-white/90 text-sm">Pet Soul™ Technology</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Meet Bruno&apos;s Pet Soul™ Profile
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Every interaction enriches your pet&apos;s profile. This is what a life system looks like when it truly knows your pet.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Identity Card */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white lg:row-span-2" data-testid="bruno-identity-card">
              <div className="text-center mb-6">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <img 
                    src={SAMPLE_PET_SOUL.image} 
                    alt={SAMPLE_PET_SOUL.name}
                    className="w-full h-full rounded-full object-cover border-4 border-white/30"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 rounded-full text-xs font-bold text-amber-900">
                    Deeply Understood
                  </div>
                </div>
                <h3 className="text-2xl font-bold">{SAMPLE_PET_SOUL.name}</h3>
                <p className="text-white/70">{SAMPLE_PET_SOUL.breed} • {SAMPLE_PET_SOUL.age}</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {SAMPLE_PET_SOUL.personality.map((trait, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm">{trait}</span>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Favorite Treat</span>
                  <span className="font-medium">{SAMPLE_PET_SOUL.favorites.treat}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Favorite Activity</span>
                  <span className="font-medium">{SAMPLE_PET_SOUL.favorites.activity}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span className="text-white/70">Go-to Restaurant</span>
                  <span className="font-medium">{SAMPLE_PET_SOUL.favorites.restaurant}</span>
                </div>
              </div>
            </Card>

            {/* Preferences & Dietary Card */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white" data-testid="bruno-preferences-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" /> What We Know
              </h4>
              <div className="space-y-4">
                <div className="p-3 bg-white/10 rounded-lg">
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Dietary Needs</p>
                  <p className="font-medium">{SAMPLE_PET_SOUL.preferences.dietaryNeeds}</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                  <p className="text-xs text-red-300 uppercase tracking-wide mb-1">Allergy Alert</p>
                  <p className="font-medium text-red-200">{SAMPLE_PET_SOUL.preferences.allergyAlert}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-lg">
                  <p className="text-xs text-white/50 uppercase tracking-wide mb-1">Exercise Level</p>
                  <p className="font-medium">{SAMPLE_PET_SOUL.preferences.exerciseLevel}</p>
                </div>
              </div>
            </Card>

            {/* Milestones Card */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white" data-testid="bruno-milestones-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> Life Milestones
              </h4>
              <div className="space-y-3">
                {SAMPLE_PET_SOUL.milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white/10 rounded-lg">
                    <span className="text-2xl">{milestone.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{milestone.name}</p>
                      <p className="text-xs text-white/50">{milestone.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Health Continuity Card */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white lg:col-span-2" data-testid="bruno-health-card">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" /> Health Continuity
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <Stethoscope className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-sm font-medium">{SAMPLE_PET_SOUL.healthContinuity.lastVaccination}</p>
                  <p className="text-xs text-white/60">Last Vaccination</p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm font-medium">{SAMPLE_PET_SOUL.healthContinuity.nextCheckup}</p>
                  <p className="text-xs text-white/60">Next Checkup</p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-teal-400" />
                  <p className="text-sm font-medium">{SAMPLE_PET_SOUL.healthContinuity.vetName}</p>
                  <p className="text-xs text-white/60">Primary Vet</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-10">
            <p className="text-white/60 mb-4">This is just the beginning. Your pet&apos;s profile grows with every interaction.</p>
            <Button 
              size="lg"
              className="bg-white text-teal-700 hover:bg-gray-100"
              onClick={() => handleSelectPlan('annual')}
              data-testid="bruno-section-cta"
            >
              Start Building Your Pet&apos;s Soul <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tenure Recognition Section - Calm, not gamified */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              The Longer You Stay, The Better We Know You
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our understanding of your pet deepens over time. Here&apos;s how our relationship grows.
            </p>
          </div>

          {/* Tenure Levels */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {TENURE_LEVELS.map((level, idx) => (
              <Card key={idx} className={`p-6 text-center border-2 hover:shadow-lg transition-all ${idx === 3 ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`} data-testid={`tenure-level-${level.key}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center`}>
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">{level.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{level.description}</p>
                <div className="text-sm">
                  <span className="text-gray-500">After {level.minMonths === 0 ? 'sign up' : `${level.minMonths}+ months`}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Quiet note about points */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              You&apos;ll earn Paw Points along the way — they accrue naturally as you use the system.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section - UPDATED: Annual First with New Pricing */}
      <div id="pricing" className="bg-gradient-to-b from-purple-50 to-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Crown className="w-4 h-4" />
              Pet Pass
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Your Pet&apos;s Personal Concierge
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A living concierge relationship for your dog — beginning with understanding, sustained through memory, care, and continuity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Annual Plan - FIRST (Foundation) */}
            <Card className="p-8 border-2 border-teal-500 relative overflow-hidden order-1">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-teal-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pet Pass — Foundation</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹4,999</span>
                  <span className="text-gray-500">/year</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">+ 18% GST</p>
                <p className="text-sm text-green-600 mt-2 font-medium">Full concierge relationship</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Full Pet Soul™ Profile',
                  'Unlimited Mira AI Concierge',
                  'All 14 Life Pillars Unlocked',
                  'Health Vault & Records',
                  'Priority Concierge Support',
                  'Double Paw Points (2x)',
                  'Birthday Surprise Gift',
                  'Early Access to New Features'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-gradient-to-r from-teal-600 to-pink-600 hover:from-teal-700 hover:to-pink-700 py-6 text-lg"
                onClick={() => handleSelectPlan('annual')}
                data-testid="annual-plan-btn"
              >
                <Crown className="w-5 h-5 mr-2" />
                Activate Pet Pass
              </Button>
            </Card>

            {/* Trial Plan */}
            <Card className="p-8 border-2 border-gray-200 hover:border-purple-300 transition-colors order-2 relative">
              <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full">
                TRIAL
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Pet Pass — Trial</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹499</span>
                  <span className="text-gray-500">/1 month</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">+ 18% GST</p>
                <p className="text-sm text-amber-600 mt-2 font-medium">Introduction to the concierge experience</p>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  'Full Pet Soul™ Profile',
                  'Unlimited Mira AI Concierge',
                  'All 14 Life Pillars Unlocked',
                  'Health Vault & Records',
                  'Priority Concierge Support',
                  'Paw Rewards'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800 py-6"
                onClick={() => handleSelectPlan('trial')}
                data-testid="trial-plan-btn"
              >
                Start Trial
              </Button>
            </Card>
          </div>

          {/* Multi-Pet Note */}
          <div className="mt-8 text-center">
            <Card className="inline-block p-4 bg-purple-50 border-purple-200">
              <p className="text-purple-900">
                <strong>🐾 Multiple pets?</strong> Each pet gets their own Pet Pass at ₹2,499/year or ₹249/trial (+ GST)
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-teal-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to begin your pet&apos;s concierge journey?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Pet Pass creates a living relationship between your pet, you, and our care system.
          </p>
          <Button 
            size="lg"
            className="bg-white text-teal-600 hover:bg-gray-100 px-8 py-6 text-lg"
            onClick={() => handleSelectPlan('annual')}
            data-testid="final-cta-btn"
          >
            <Crown className="w-5 h-5 mr-2" />
            Activate Pet Pass <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm">
          © 2026 The Doggy Company. All rights reserved.
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PawPrint className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Welcome Back!' : 'Join The Pack'}
              </h2>
              <p className="text-gray-500 mt-1">
                {isLogin ? 'Sign in to continue' : selectedPlan === 'annual' ? '₹4,999/year (+ GST)' : '₹499/month (+ GST)'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    required={!isLogin}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="mt-1"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    required={!isLogin}
                    className="mt-1"
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-teal-600 to-pink-600 hover:from-teal-700 hover:to-pink-700"
              >
                {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-teal-600 hover:text-teal-700"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already a member? Sign in'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-3xl p-8 relative animate-in fade-in zoom-in duration-200 my-8">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Complete Your Pet Life Pass
              </h2>
              <p className="text-gray-500 mt-1">
                Choose your plan and unlock all 12 pillars
              </p>
            </div>

            <MembershipPayment
              userEmail={user?.email || formData.email}
              userName={user?.name || formData.name}
              userPhone={user?.phone || formData.phone}
              onSuccess={handlePaymentSuccess}
              onClose={() => setShowPaymentModal(false)}
            />
          </Card>
        </div>
      )}
      
      {/* Mobile Navigation Bar */}
      <MobileNavBar />
    </div>
  );
};

export default MembershipPage;

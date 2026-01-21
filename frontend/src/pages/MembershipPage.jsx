import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import MembershipPayment from '../components/MembershipPayment';
import PetSoulJourney from '../components/PetSoulJourney';
import { 
  PawPrint, Crown, Check, Star, Heart, Gift, Calendar, 
  Shield, Sparkles, ChevronRight, Eye, EyeOff, ArrowRight,
  Utensils, Plane, Home, Dumbbell, Brain, Phone, FileText,
  ShoppingBag, Users, Award, Zap, X, Trophy, Target, TrendingUp,
  Cake, Activity, Stethoscope, MapPin, CreditCard
} from 'lucide-react';
import { API_URL, getApiUrl } from '../utils/api';

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
    color: 'from-purple-400 to-purple-600'
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
    if (user) {
      // Already logged in, go directly to payment
      setShowPaymentModal(true);
    } else {
      // Need to login first
      setShowAuthModal(true);
    }
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

  const pillars = [
    { id: 'celebrate', name: 'Celebrate', desc: 'Birthday cakes, treats & parties', color: 'pink' },
    { id: 'dine', name: 'Dine', desc: 'Pet-friendly restaurants', color: 'orange' },
    { id: 'travel', name: 'Travel', desc: 'Pet travel assistance', color: 'blue' },
    { id: 'stay', name: 'Stay', desc: 'Pet-friendly hotels', color: 'green' },
    { id: 'care', name: 'Care', desc: 'Grooming, walking, sitting', color: 'purple' },
    { id: 'fit', name: 'Fit', desc: 'Exercise & wellness', color: 'teal' },
    { id: 'advisory', name: 'Advisory', desc: 'Expert consultations', color: 'indigo' },
    { id: 'emergency', name: 'Emergency', desc: '24/7 pet emergency help', color: 'red' },
    { id: 'paperwork', name: 'Paperwork', desc: 'Health records & docs', color: 'slate' },
    { id: 'shop', name: 'Shop Assist', desc: 'Curated products via Mira', color: 'amber' },
    { id: 'club', name: 'Club', desc: 'Community & rewards', color: 'violet' },
    { id: 'enjoy', name: 'Enjoy', desc: 'Events & experiences', color: 'rose' },
  ];

  const benefits = [
    { icon: PawPrint, title: 'Pet Soul™ Profile', desc: 'Deep, evolving profile for your pet' },
    { icon: Sparkles, title: 'Mira AI Concierge®', desc: '24/7 intelligent pet assistant' },
    { icon: Award, title: 'Paw Rewards', desc: 'Earn points on every interaction' },
    { icon: Calendar, title: 'Smart Reminders', desc: 'Birthday, vaccine & event alerts' },
    { icon: Shield, title: 'Health Vault', desc: 'Secure medical records storage' },
    { icon: Zap, title: 'Priority Support', desc: 'Fast-track help when you need it' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section - Matching site style */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Brain className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">Pet Life Operating System</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              The Longer You&apos;re With Us
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">
                The Less You Explain
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Not just a membership — an intelligent companion that learns your pet&apos;s 
              preferences, remembers their health history, and anticipates their needs.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white px-8 py-6 text-lg rounded-full shadow-2xl shadow-pink-500/30 transition-all hover:scale-105"
              >
                <Brain className="w-5 h-5 mr-2" />
                Start Your Pet&apos;s Soul
              </Button>
              <Button 
                onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI'))}
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Talk to Mira First
              </Button>
            </div>
            
            {/* Trust statement */}
            <p className="mt-8 text-white/50 text-sm italic">
              &ldquo;The world&apos;s most intelligent pet life platform.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* 12 Pillars Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              12 Pillars of Pet Life
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              One membership unlocks everything. No more juggling multiple apps and services.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {pillars.map((pillar) => {
              const Icon = pillarIcons[pillar.id];
              return (
                <Card 
                  key={pillar.id}
                  className={`p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-${pillar.color}-200 group`}
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pet Soul Preview Section */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-6">
              <PawPrint className="w-5 h-5 text-pink-400" />
              <span className="text-white/90 text-sm">Pet Soul™ Technology</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Meet Bruno's Pet Soul™ Profile
            </h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Every interaction with The Doggy Company enriches your pet's profile. Here's what Bruno's journey looks like — yours could be even more amazing!
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Profile Card */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white lg:row-span-2">
              <div className="text-center mb-6">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <img 
                    src={SAMPLE_PET_SOUL.image} 
                    alt={SAMPLE_PET_SOUL.name}
                    className="w-full h-full rounded-full object-cover border-4 border-white/30"
                  />
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 rounded-full text-xs font-bold text-amber-900">
                    👑 Pack Leader
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

            {/* Stats Card */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" /> Journey Stats
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <p className="text-2xl font-bold text-purple-300">{SAMPLE_PET_SOUL.stats.pawPoints}</p>
                  <p className="text-xs text-white/60">Paw Points</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <p className="text-2xl font-bold text-pink-300">{SAMPLE_PET_SOUL.stats.ordersCompleted}</p>
                  <p className="text-xs text-white/60">Orders</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <p className="text-2xl font-bold text-orange-300">{SAMPLE_PET_SOUL.stats.restaurantsVisited}</p>
                  <p className="text-xs text-white/60">Restaurants</p>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg">
                  <p className="text-2xl font-bold text-blue-300">{SAMPLE_PET_SOUL.stats.hotelsStayed}</p>
                  <p className="text-xs text-white/60">Hotels</p>
                </div>
              </div>
            </Card>

            {/* Achievements Card */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Achievements
              </h4>
              <div className="space-y-3">
                {SAMPLE_PET_SOUL.achievements.map((achievement, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-white/10 rounded-lg">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{achievement.name}</p>
                      <p className="text-xs text-white/50">{achievement.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Health Vault Preview */}
            <Card className="p-6 bg-white/10 backdrop-blur border-white/20 text-white lg:col-span-2">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" /> Health Vault
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <Stethoscope className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p className="text-2xl font-bold">{SAMPLE_PET_SOUL.healthVault.vaccinations}</p>
                  <p className="text-xs text-white/60">Vaccinations</p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-2xl font-bold">{SAMPLE_PET_SOUL.healthVault.documents}</p>
                  <p className="text-xs text-white/60">Documents</p>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm font-bold">{SAMPLE_PET_SOUL.healthVault.lastCheckup}</p>
                  <p className="text-xs text-white/60">Last Checkup</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-10">
            <p className="text-white/60 mb-4">This is just the beginning. Your pet's profile grows with every interaction!</p>
            <Button 
              size="lg"
              className="bg-white text-purple-700 hover:bg-gray-100"
              onClick={() => handleSelectPlan('annual')}
            >
              Start Building Your Pet's Soul <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Gamification & Levels Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-100 px-4 py-2 rounded-full mb-6">
              <Trophy className="w-5 h-5 text-amber-600" />
              <span className="text-amber-700 text-sm font-medium">Paw Rewards & Levels</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Level Up Your Pet's Journey
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Every order, booking, and interaction earns Paw Points. Climb the ranks and unlock exclusive rewards!
            </p>
          </div>

          {/* Membership Levels */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {MEMBERSHIP_LEVELS.map((level, idx) => (
              <Card key={idx} className={`p-6 text-center border-2 hover:shadow-lg transition-all ${idx === 3 ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-white text-2xl`}>
                  {level.name.split(' ')[0]}
                </div>
                <h3 className="font-bold text-lg text-gray-900">{level.name}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{level.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tenure</span>
                    <span className="font-medium">{level.minMonths}+ months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Points Multiplier</span>
                    <span className="font-bold text-purple-600">{level.multiplier}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* How to Earn Points */}
          <Card className="p-8 bg-gradient-to-r from-purple-50 to-pink-50">
            <h3 className="text-xl font-bold text-center mb-6">How to Earn Paw Points</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-pink-100 flex items-center justify-center">
                  <Cake className="w-6 h-6 text-pink-600" />
                </div>
                <p className="font-medium">Order Treats</p>
                <p className="text-sm text-gray-500">10 points per ₹100</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-orange-100 flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-orange-600" />
                </div>
                <p className="font-medium">Dine Out</p>
                <p className="text-sm text-gray-500">50 points per booking</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-medium">Travel</p>
                <p className="text-sm text-gray-500">100 points per trip</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium">Log Activities</p>
                <p className="text-sm text-gray-500">25 points per activity</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600">
              One membership, unlimited access to all 12 pillars
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Monthly Plan */}
            <Card className="p-8 border-2 border-gray-200 hover:border-purple-300 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Monthly</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹117</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">₹99 + 18% GST</p>
                <p className="text-sm text-gray-500 mt-2">Billed monthly, cancel anytime</p>
              </div>

              <ul className="space-y-3 mb-8">
                {['All 12 pillars unlocked', 'Pet Soul profile', 'Mira AI concierge', 'Paw Rewards', 'Health Vault', 'Priority support'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-gray-900 hover:bg-gray-800"
                onClick={() => handleSelectPlan('monthly')}
              >
                Get Started
              </Button>
            </Card>

            {/* Annual Plan - Recommended */}
            <Card className="p-8 border-2 border-purple-500 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                BEST VALUE
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Annual</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">₹1,179</span>
                  <span className="text-gray-500">/year</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">₹999 + 18% GST</p>
                <p className="text-sm text-green-600 mt-2 font-medium">Save ₹225 (16% off monthly)</p>
              </div>

              <ul className="space-y-3 mb-8">
                {['All 12 pillars unlocked', 'Pet Soul profile', 'Mira AI concierge', 'Paw Rewards (2x points)', 'Health Vault', 'Priority support', 'Birthday surprise gift'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={() => handleSelectPlan('annual')}
              >
                Get Started - Save 16%
              </Button>
            </Card>
          </div>

          {/* Family Plan Note */}
          <div className="mt-8 text-center">
            <Card className="inline-block p-4 bg-purple-50 border-purple-200">
              <p className="text-purple-900">
                <strong>🐾 Multiple pets?</strong> Add more pets at just ₹589/year or ₹58/month each (incl. GST)
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Give Your Pet the Best Life?
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of pet parents who've transformed their pet care experience.
          </p>
          <Button 
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg"
            onClick={() => handleSelectPlan('annual')}
          >
            Start Your Journey Today <ArrowRight className="ml-2 w-5 h-5" />
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
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PawPrint className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isLogin ? 'Welcome Back!' : 'Join The Pack'}
              </h2>
              <p className="text-gray-500 mt-1">
                {isLogin ? 'Sign in to continue' : selectedPlan === 'annual' ? '₹1,179/year (incl. GST)' : '₹117/month (incl. GST)'}
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
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {submitting ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-purple-600 hover:text-purple-700"
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
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Complete Your Membership
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
    </div>
  );
};

export default MembershipPage;

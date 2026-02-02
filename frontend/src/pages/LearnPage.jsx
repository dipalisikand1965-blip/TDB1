import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import MiraChatWidget from '../components/MiraChatWidget';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import AdminQuickEdit from '../components/AdminQuickEdit';
import ProductCard from '../components/ProductCard';
import { getPetPhotoUrl } from '../utils/petAvatar';
import SEOHead from '../components/SEOHead';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Brain, Star, Award, Trophy,
  CheckCircle, ChevronRight, Sparkles, Loader2, Send,
  ArrowRight, Play, ChevronDown, Target, Users, Calendar,
  MapPin, Clock, PawPrint, Heart, Shield, Zap, ChevronLeft
} from 'lucide-react';

// Elevated Concierge® Learn Experiences
const LEARN_EXPERIENCES = [
  {
    title: "Behavior Architect®",
    description: "Beyond basic training — we understand your pet's unique psychology and connect you with specialists who address root causes, not just symptoms. For pulling, barking, anxiety, or aggression.",
    icon: "🧠",
    gradient: "from-blue-500 to-indigo-600",
    badge: "Most Requested",
    badgeColor: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80",
    highlights: [
      "Behavioral assessment & diagnosis",
      "Specialist matching by issue type",
      "Progress tracking & adjustment",
      "Home environment optimization"
    ]
  },
  {
    title: "Puppy Foundations Builder®",
    description: "The first year matters most. We guide you through socialization windows, foundational training, and confidence building — ensuring your puppy grows into a well-adjusted companion.",
    icon: "🐶",
    gradient: "from-pink-500 to-rose-600",
    badge: "Critical Period",
    badgeColor: "bg-pink-600",
    image: "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=800&q=80",
    highlights: [
      "Age-appropriate milestone planning",
      "Socialization scheduling",
      "Vet & trainer coordination",
      "Fear prevention protocols"
    ]
  },
  {
    title: "Advanced Skills Coach®",
    description: "Ready to level up? From agility to therapy dog certification, we connect you with specialized trainers who take your pet from good to exceptional. Perfect for those who want more.",
    icon: "🏆",
    gradient: "from-amber-500 to-orange-600",
    image: "https://images.unsplash.com/photo-1558929996-da64ba858215?w=800&q=80",
    highlights: [
      "Agility & sport training",
      "Therapy dog preparation",
      "Trick & performance training",
      "Competition preparation"
    ]
  },
  {
    title: "Rescue Rehabilitation Partner®",
    description: "Adopted a rescue with unknown history? We specialize in rehabilitation journeys — building trust, addressing trauma, and helping your new family member feel safe and loved.",
    icon: "💚",
    gradient: "from-green-500 to-teal-600",
    image: "https://images.unsplash.com/photo-1601758174493-4e6f3f1e8b3e?w=800&q=80",
    highlights: [
      "Trauma-informed approach",
      "Trust building protocols",
      "Gradual exposure therapy",
      "Long-term support planning"
    ]
  }
];

// Learn Type Configuration
const LEARN_TYPES = {
  basic_obedience: { name: 'Basic Obedience', icon: GraduationCap, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  puppy_training: { name: 'Puppy Training', icon: Heart, color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
  behavior_modification: { name: 'Behavior Modification', icon: Brain, color: 'from-purple-500 to-violet-500', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  advanced_training: { name: 'Advanced Training', icon: Trophy, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  agility: { name: 'Agility Training', icon: Zap, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  therapy_training: { name: 'Therapy Dog Training', icon: Shield, color: 'from-teal-500 to-cyan-500', bgColor: 'bg-teal-50', textColor: 'text-teal-600' }
};

const TRAINING_GOALS = [
  { value: 'basic_commands', label: 'Basic Commands (Sit, Stay, Come)' },
  { value: 'leash_walking', label: 'Leash Walking' },
  { value: 'house_training', label: 'House Training' },
  { value: 'socialization', label: 'Socialization' },
  { value: 'anxiety_reduction', label: 'Anxiety Reduction' },
  { value: 'aggression_management', label: 'Aggression Management' },
  { value: 'recall_training', label: 'Recall/Off-Leash' },
  { value: 'trick_training', label: 'Trick Training' }
];

const BEHAVIOR_ISSUES = [
  { value: 'excessive_barking', label: 'Excessive Barking' },
  { value: 'jumping', label: 'Jumping on People' },
  { value: 'pulling_leash', label: 'Pulling on Leash' },
  { value: 'separation_anxiety', label: 'Separation Anxiety' },
  { value: 'aggression', label: 'Aggression' },
  { value: 'fearfulness', label: 'Fearfulness' },
  { value: 'destructive_behavior', label: 'Destructive Behavior' },
  { value: 'resource_guarding', label: 'Resource Guarding' }
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80'
];

const LearnPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const [programs, setPrograms] = useState([]);
  const [featuredPrograms, setFeaturedPrograms] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  
  const [requestForm, setRequestForm] = useState({
    learn_type: 'basic_obedience',
    training_goals: [],
    behavior_issues: [],
    previous_training: false,
    training_method_preference: 'positive_reinforcement',
    schedule_preference: '',
    location_preference: 'home',
    notes: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
    if (user && token) {
      fetchUserPets();
    }
  }, [user, token]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [programsRes, featuredRes, trainersRes, productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/learn/programs`),
        fetch(`${API_URL}/api/learn/programs?is_featured=true`),
        fetch(`${API_URL}/api/learn/trainers?is_featured=true`),
        // Use new pillar resolver API for rule-based product filtering
        fetch(`${API_URL}/api/pillar-resolver/products/learn?limit=20`),
        fetch(`${API_URL}/api/learn/bundles`)
      ]);

      if (programsRes.ok) {
        const data = await programsRes.json();
        setPrograms(data.programs || []);
      }
      if (featuredRes.ok) {
        const data = await featuredRes.json();
        setFeaturedPrograms(data.programs || []);
      }
      if (trainersRes.ok) {
        const data = await trainersRes.json();
        setTrainers(data.trainers || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
        console.log(`[LearnPage] Loaded ${data.count} products via pillar resolver`);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Failed to fetch learn data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPets(data.pets || []);
        if (data.pets?.length > 0) {
          setSelectedPet(data.pets[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    }
  };

  const handleSubmitRequest = async () => {
    // Check for pet info (either from profile or guest entry)
    const hasPetInfo = selectedPet || requestForm.guest_pet_name;
    if (!hasPetInfo) {
      toast({ title: 'Please enter your pet\'s details', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const petData = selectedPet ? {
        pet_id: selectedPet.id,
        pet_name: selectedPet.name,
        pet_breed: selectedPet.breed,
        pet_age: selectedPet.age,
        pet_temperament: selectedPet.temperament,
      } : {
        pet_id: null,
        pet_name: requestForm.guest_pet_name,
        pet_breed: requestForm.guest_pet_breed || '',
        pet_age: requestForm.guest_pet_age || '',
        pet_temperament: '',
      };

      const response = await fetch(`${API_URL}/api/learn/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...requestForm,
          ...petData,
          user_id: user?.id || null,
          user_name: user?.name || requestForm.guest_name || '',
          user_email: user?.email || requestForm.guest_email || '',
          user_phone: user?.phone || requestForm.guest_phone || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({ 
          title: '🎓 Training Request Submitted!', 
          description: 'Our concierge will match you with the perfect trainer.' 
        });
        setShowRequestModal(false);
        setRequestForm({
          learn_type: 'basic_obedience',
          training_goals: [],
          behavior_issues: [],
          previous_training: false,
          training_method_preference: 'positive_reinforcement',
          schedule_preference: '',
          location_preference: 'home',
          notes: ''
        });
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit request. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnroll = async () => {
    // Check for pet info (either from profile or guest entry)
    const hasPetInfo = selectedPet || requestForm.guest_pet_name;
    if (!hasPetInfo || !selectedProgram) {
      toast({ title: 'Please enter your pet\'s details and select a program', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const petData = selectedPet ? {
        pet_id: selectedPet.id,
        pet_name: selectedPet.name,
      } : {
        pet_id: null,
        pet_name: requestForm.guest_pet_name,
      };

      const response = await fetch(`${API_URL}/api/learn/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          program_id: selectedProgram.id,
          program_name: selectedProgram.name,
          ...petData,
          user_id: user?.id || null,
          user_name: user?.name || requestForm.guest_name || '',
          user_email: user?.email || requestForm.guest_email || '',
          user_phone: user?.phone || requestForm.guest_phone || '',
          amount: selectedProgram.price,
          preferred_start_date: requestForm.schedule_preference,
          location_preference: requestForm.location_preference
        })
      });

      if (response.ok) {
        toast({ 
          title: '🎉 Enrollment Submitted!', 
          description: 'Our team will confirm your schedule shortly.' 
        });
        setShowEnrollModal(false);
        setSelectedProgram(null);
      } else {
        throw new Error('Failed to enroll');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to enroll. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBundleToCart = (bundle) => {
    addToCart({
      id: bundle.id,
      name: bundle.name,
      price: bundle.price,
      quantity: 1,
      image: bundle.image,
      pillar: 'learn'
    });
    toast({ title: '🛒 Added to Cart', description: bundle.name });
  };

  const toggleGoal = (goal) => {
    setRequestForm(prev => ({
      ...prev,
      training_goals: prev.training_goals.includes(goal)
        ? prev.training_goals.filter(g => g !== goal)
        : [...prev.training_goals, goal]
    }));
  };

  const toggleIssue = (issue) => {
    setRequestForm(prev => ({
      ...prev,
      behavior_issues: prev.behavior_issues.includes(issue)
        ? prev.behavior_issues.filter(i => i !== issue)
        : [...prev.behavior_issues, issue]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      {/* SEO Meta Tags */}
      <SEOHead page="learn" path="/learn" />

        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" data-testid="learn-page">
      {/* Mira Floating Chat Widget */}
      <MiraChatWidget pillar="learn" />

      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        {/* Mobile Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="sm:hidden absolute top-4 left-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${HERO_IMAGES[heroIndex]})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-indigo-900/80 to-purple-900/70" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <Badge className="mb-4 bg-blue-500/20 text-blue-200 border-blue-400/30">
              <GraduationCap className="w-4 h-4 mr-1" /> Pet Training & Education
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Unlock Your Pet's
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Full Potential</span>
            </h1>
            <p className="text-lg text-gray-300 mb-6">
              Expert-led training programs, personalized behavior modification, and skill-building courses for dogs of all ages.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                onClick={() => setShowRequestModal(true)}
                data-testid="request-training-btn"
              >
                <GraduationCap className="w-5 h-5 mr-2" /> Request Training
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => document.getElementById('programs')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <BookOpen className="w-5 h-5 mr-2" /> Browse Programs
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Training Types Quick Access */}
      <div className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8">What Would You Like to Learn?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(LEARN_TYPES).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Card 
                  key={key}
                  className={`p-4 cursor-pointer hover:shadow-lg transition-all text-center ${
                    selectedType === key ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedType(key);
                    setRequestForm(prev => ({ ...prev, learn_type: key }));
                    setShowRequestModal(true);
                  }}
                  data-testid={`learn-type-${key}`}
                >
                  <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-gradient-to-br ${config.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-sm text-gray-900">{config.name}</h3>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* === ELEVATED CONCIERGE® LEARN EXPERIENCES === */}
      <div className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm font-medium">Elevated Experiences</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Learn <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Concierge®</span> Experiences
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
              We match your pet with the right specialists for their unique learning style.
            </p>
          </div>
          
          {/* 2x2 grid on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6">
            {LEARN_EXPERIENCES.map((exp, idx) => (
              <ConciergeExperienceCard
                key={idx}
                pillar="learn"
                title={exp.title}
                description={exp.description}
                icon={exp.icon}
                gradient={exp.gradient}
                badge={exp.badge}
                badgeColor={exp.badgeColor}
                highlights={exp.highlights}
                image={exp.image}
              />
            ))}
          </div>
          
          <div className="mt-6 sm:mt-10 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              💬 Not sure where to start? <button onClick={() => setShowRequestModal(true)} className="text-blue-600 hover:underline font-medium">Tell us about your pet</button>
            </p>
          </div>
        </div>
      </div>

      {/* Featured Programs */}
      <div id="programs" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Training Programs</h2>
              <p className="text-gray-600 mt-1">Expert-designed courses for every skill level</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {(featuredPrograms.length > 0 ? featuredPrograms : programs).map((program) => (
              <Card 
                key={program.id} 
                className="overflow-hidden hover:shadow-xl transition-all cursor-pointer" 
                data-testid={`program-${program.id}`}
                onClick={() => { setSelectedProgram(program); setShowEnrollModal(true); }}
              >
                <div className="aspect-[4/3] sm:aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 relative">
                  {program.image ? (
                    <img src={program.image} alt={program.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 sm:w-16 sm:h-16 text-blue-300" />
                    </div>
                  )}
                  {program.is_featured && (
                    <Badge className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-amber-500 text-[10px] sm:text-xs">
                      <Star className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> Featured
                    </Badge>
                  )}
                </div>
                <div className="p-2.5 sm:p-5">
                  <h3 className="font-bold text-xs sm:text-lg text-gray-900 mb-1 sm:mb-2 line-clamp-2">{program.name}</h3>
                  <p className="text-[10px] sm:text-sm text-gray-600 mb-2 sm:mb-4 line-clamp-2 hidden sm:block">{program.description}</p>
                  
                  <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-sm text-gray-500 mb-2 sm:mb-4">
                    <span className="flex items-center gap-0.5 sm:gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" /> {program.duration}
                    </span>
                    <span className="flex items-center gap-0.5 sm:gap-1 hidden sm:flex">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" /> {program.sessions} sessions
                    </span>
                  </div>

                  <div className="hidden sm:block">
                    {program.includes && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-2">INCLUDES:</p>
                        <div className="flex flex-wrap gap-1">
                          {program.includes.slice(0, 3).map((item, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 sm:pt-4 border-t">
                    <div>
                      <span className="text-sm sm:text-2xl font-bold text-blue-600">₹{program.price?.toLocaleString()}</span>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedProgram(program);
                        setShowEnrollModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-[10px] sm:text-sm px-2 py-1 sm:px-4 sm:py-2 h-auto"
                      size="sm"
                    >
                      Enroll
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Trainers */}
      <div className="py-8 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Meet Our Expert Trainers</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Certified professionals</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
            {trainers.map((trainer) => (
              <Card 
                key={trainer.id} 
                className="p-3 sm:p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200" 
                data-testid={`trainer-${trainer.id}`}
                onClick={() => { setSelectedTrainer(trainer); setShowTrainerModal(true); }}
              >
                {/* Mobile: Horizontal compact layout */}
                <div className="flex sm:flex-col items-center gap-3 sm:gap-0">
                  <div className="w-14 h-14 sm:w-24 sm:h-24 rounded-full sm:mx-auto sm:mb-4 overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 ring-2 ring-blue-200">
                    {trainer.image ? (
                      <img src={trainer.image} alt={trainer.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-6 h-6 sm:w-12 sm:h-12 text-blue-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left sm:text-center min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">{trainer.name}</h3>
                    <p className="text-sm sm:text-sm text-blue-600 mb-1 truncate">{trainer.title}</p>
                    
                    <div className="flex items-center sm:justify-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="font-semibold">{trainer.rating}</span>
                      </div>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500">{trainer.experience_years}+ yrs</span>
                    </div>
                  </div>
                  {/* Mobile: Quick action indicator */}
                  <ChevronRight className="w-5 h-5 text-gray-400 sm:hidden flex-shrink-0" />
                </div>

                <div className="hidden sm:flex items-center justify-center gap-2 text-sm text-gray-500 mt-3 mb-4">
                  <MapPin className="w-4 h-4" /> {trainer.city}
                  <span>•</span>
                  <span>{trainer.experience_years}+ years</span>
                </div>

                <div className="hidden sm:block">
                  {trainer.specializations && (
                    <div className="flex flex-wrap justify-center gap-1 mb-4">
                      {trainer.specializations.slice(0, 3).map((spec, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {spec.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button 
                  variant="outline" 
                  className="w-full mt-2 sm:mt-0 text-sm h-9 sm:h-10 hidden sm:flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTrainer(trainer);
                    setShowTrainerModal(true);
                  }}
                  data-testid={`view-profile-${trainer.id}`}
                >
                  View Profile
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Training Bundles */}
      {bundles.length > 0 && (
        <div className="py-8 sm:py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-6 sm:mb-12">
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900">Training Bundles</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Everything for home training</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-6">
              {bundles.map((bundle) => (
                <Card 
                  key={bundle.id} 
                  className="p-3 sm:p-6 flex items-center gap-3 sm:gap-6 cursor-pointer hover:shadow-lg hover:bg-blue-50/50 transition-all border-2 border-transparent hover:border-blue-200 active:scale-[0.99]" 
                  data-testid={`bundle-${bundle.id}`}
                  onClick={() => handleAddBundleToCart(bundle)}
                >
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex-shrink-0 overflow-hidden">
                    {bundle.image ? (
                      <img src={bundle.image} alt={bundle.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 sm:w-12 sm:h-12 text-blue-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-0.5 sm:mb-1 line-clamp-2">{bundle.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{bundle.description}</p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg sm:text-xl font-bold text-blue-600">₹{bundle.price?.toLocaleString()}</span>
                      {bundle.original_price && (
                        <>
                          <span className="text-sm text-gray-400 line-through">₹{bundle.original_price?.toLocaleString()}</span>
                          <Badge className="bg-green-100 text-green-700 text-xs">Save ₹{(bundle.original_price - bundle.price)?.toLocaleString()}</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-sm px-4 h-10 flex-shrink-0 whitespace-nowrap">
                    Add to Cart
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Training Products */}
      {products.length > 0 && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Training Essentials</h2>
                <p className="text-gray-600 mt-1">Tools and treats for effective training</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} pillar="learn" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Why Choose Us */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Learn with The Doggy Company?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { icon: Award, title: 'Certified Trainers', desc: 'All trainers are certified professionals' },
              { icon: Heart, title: 'Positive Methods', desc: 'Force-free, reward-based training only' },
              { icon: Target, title: 'Personalized Plans', desc: 'Custom programs for your pet\'s needs' },
              { icon: Users, title: 'Lifetime Support', desc: 'Ongoing guidance even after program ends' }
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Your Training Journey?
          </h2>
          <p className="text-blue-100 mb-8">
            Our concierge will match you with the perfect trainer based on your pet's needs and your goals.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-gray-100"
            onClick={() => setShowRequestModal(true)}
          >
            <GraduationCap className="w-5 h-5 mr-2" /> Get Started Today
          </Button>
        </div>
      </div>

      {/* Training Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              Request Training
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Pet Selection - Works for both logged in and guest users */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Your Pet's Details</Label>
              {userPets.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {userPets.map(pet => (
                    <Card 
                      key={pet.id}
                      className={`p-3 cursor-pointer ${selectedPet?.id === pet.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                      onClick={() => setSelectedPet(pet)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                          <img 
                            src={getPetPhotoUrl(pet)} 
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-xs text-gray-500">{pet.breed}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Pet Name *</Label>
                      <Input
                        placeholder="e.g., Mojo"
                        value={requestForm.guest_pet_name || ''}
                        onChange={(e) => setRequestForm({...requestForm, guest_pet_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Breed</Label>
                      <Input
                        placeholder="e.g., Labrador"
                        value={requestForm.guest_pet_breed || ''}
                        onChange={(e) => setRequestForm({...requestForm, guest_pet_breed: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Age</Label>
                      <Input
                        placeholder="e.g., 2 years"
                        value={requestForm.guest_pet_age || ''}
                        onChange={(e) => setRequestForm({...requestForm, guest_pet_age: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Guest Contact Info - only show if not logged in */}
            {!user && (
              <div className="space-y-3 pt-3 border-t">
                <Label className="text-sm font-medium">Your Contact Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Your Name *</Label>
                    <Input
                      placeholder="Full name"
                      value={requestForm.guest_name || ''}
                      onChange={(e) => setRequestForm({...requestForm, guest_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone *</Label>
                    <Input
                      placeholder="Mobile number"
                      value={requestForm.guest_phone || ''}
                      onChange={(e) => setRequestForm({...requestForm, guest_phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={requestForm.guest_email || ''}
                    onChange={(e) => setRequestForm({...requestForm, guest_email: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Training Type */}
            <div>
              <Label className="text-sm font-medium">Training Type</Label>
              <Select 
                value={requestForm.learn_type} 
                onValueChange={(v) => setRequestForm(prev => ({ ...prev, learn_type: v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEARN_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Training Goals */}
            <div>
              <Label className="text-sm font-medium">Training Goals (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TRAINING_GOALS.map(goal => (
                  <div
                    key={goal.value}
                    className={`p-2 rounded-lg border cursor-pointer text-sm ${
                      requestForm.training_goals.includes(goal.value)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleGoal(goal.value)}
                  >
                    {goal.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Behavior Issues */}
            <div>
              <Label className="text-sm font-medium">Current Behavior Issues (if any)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {BEHAVIOR_ISSUES.map(issue => (
                  <div
                    key={issue.value}
                    className={`p-2 rounded-lg border cursor-pointer text-sm ${
                      requestForm.behavior_issues.includes(issue.value)
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleIssue(issue.value)}
                  >
                    {issue.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Previous Training */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Previous Training?</Label>
                <p className="text-xs text-gray-500">Has your pet had any formal training before?</p>
              </div>
              <Switch 
                checked={requestForm.previous_training} 
                onCheckedChange={(v) => setRequestForm(prev => ({ ...prev, previous_training: v }))} 
              />
            </div>

            {/* Location Preference */}
            <div>
              <Label className="text-sm font-medium">Training Location</Label>
              <Select 
                value={requestForm.location_preference} 
                onValueChange={(v) => setRequestForm(prev => ({ ...prev, location_preference: v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">At My Home</SelectItem>
                  <SelectItem value="trainer_facility">Trainer's Facility</SelectItem>
                  <SelectItem value="outdoor">Outdoor (Park/Public Space)</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Additional Notes */}
            <div>
              <Label className="text-sm font-medium">Additional Notes</Label>
              <Textarea 
                className="mt-2"
                placeholder="Anything else we should know about your pet or training needs..."
                value={requestForm.notes}
                onChange={(e) => setRequestForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmitRequest} 
              disabled={submitting || (!selectedPet && !requestForm.guest_pet_name)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enrollment Modal */}
      <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-600" />
              Enroll in Program
            </DialogTitle>
          </DialogHeader>
          
          {selectedProgram && (
            <div className="space-y-4 py-4">
              <Card className="p-4 bg-blue-50">
                <h3 className="font-bold text-lg">{selectedProgram.name}</h3>
                <p className="text-sm text-gray-600">{selectedProgram.duration} • {selectedProgram.sessions} sessions</p>
                <p className="text-xl font-bold text-blue-600 mt-2">₹{selectedProgram.price?.toLocaleString()}</p>
              </Card>

              {/* Pet Selection - Works for both logged in and guest users */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Your Pet's Details</Label>
                {userPets.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {userPets.map(pet => (
                      <Card 
                        key={pet.id}
                        className={`p-3 cursor-pointer ${selectedPet?.id === pet.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                        onClick={() => setSelectedPet(pet)}
                      >
                        <div className="flex items-center gap-3">
                          <PawPrint className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="font-medium">{pet.name}</p>
                            <p className="text-xs text-gray-500">{pet.breed}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      placeholder="Pet name *"
                      value={requestForm.guest_pet_name || ''}
                      onChange={(e) => setRequestForm({...requestForm, guest_pet_name: e.target.value})}
                    />
                    {!user && (
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Your name *"
                          value={requestForm.guest_name || ''}
                          onChange={(e) => setRequestForm({...requestForm, guest_name: e.target.value})}
                        />
                        <Input
                          placeholder="Phone *"
                          value={requestForm.guest_phone || ''}
                          onChange={(e) => setRequestForm({...requestForm, guest_phone: e.target.value})}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Location */}
              <div>
                <Label className="text-sm font-medium">Preferred Location</Label>
                <Select 
                  value={requestForm.location_preference} 
                  onValueChange={(v) => setRequestForm(prev => ({ ...prev, location_preference: v }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">At My Home</SelectItem>
                    <SelectItem value="trainer_facility">Trainer's Facility</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEnrollModal(false)}>Cancel</Button>
            <Button 
              onClick={handleEnroll} 
              disabled={submitting || (!selectedPet && !requestForm.guest_pet_name)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Confirm Enrollment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trainer Profile Modal */}
      <Dialog open={showTrainerModal} onOpenChange={setShowTrainerModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Trainer Profile
            </DialogTitle>
          </DialogHeader>
          
          {selectedTrainer && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {selectedTrainer.image ? (
                    <img src={selectedTrainer.image} alt={selectedTrainer.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-10 h-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedTrainer.name}</h3>
                  <p className="text-blue-600">{selectedTrainer.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-medium">{selectedTrainer.rating}</span>
                    <span className="text-gray-400">({selectedTrainer.reviews_count} reviews)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{selectedTrainer.city}</span>
                <span className="mx-2">•</span>
                <span>{selectedTrainer.experience_years}+ years experience</span>
              </div>

              {selectedTrainer.description && (
                <p className="text-gray-600">{selectedTrainer.description}</p>
              )}

              {selectedTrainer.specializations && selectedTrainer.specializations.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrainer.specializations.map((spec, i) => (
                      <Badge key={i} className="bg-blue-100 text-blue-700">
                        {spec.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setShowTrainerModal(false);
                    setShowRequestModal(true);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Request Training
                </Button>
                <Button variant="outline" onClick={() => setShowTrainerModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* === SERVICE CATALOG WITH PRICING === */}
      <ServiceCatalogSection 
        pillar="learn"
        title="Learn, Personalised"
        subtitle="See your personalized price based on your city, pet size, and requirements"
        maxServices={8}
      />
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="learn" position="bottom-left" />
    </div>
  );
};

export default LearnPage;

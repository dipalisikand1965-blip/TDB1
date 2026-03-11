import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
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
import { usePillarContext } from '../context/PillarContext';
import MiraAdvisorCard from '../components/MiraAdvisorCard';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import { ConciergeButton } from '../components/mira-os';
import { ChecklistDownloadButton } from '../components/checklists';
import ProductCard from '../components/ProductCard';
import PersonalizedPicks from '../components/PersonalizedPicks';
import PillarPicksSection from '../components/PillarPicksSection';
import MiraCuratedLayer from '../components/Mira/MiraCuratedLayer';
import SoulMadeCollection from '../components/SoulMadeCollection'; // ADDED: Soul Made Products
import NearbyLearnServices from '../components/learn/NearbyLearnServices'; // ADDED: Near Me section
import PetDailyRoutine from '../components/learn/PetDailyRoutine'; // ADDED: Daily Routine
import SupportForPet from '../components/learn/SupportForPet'; // ADDED: Support Services
import AskConciergeForPet from '../components/learn/AskConciergeForPet'; // ADDED: Concierge
import LearnTopicModal from '../components/learn/LearnTopicModal'; // ADDED: Topic Hub Modal
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import { getSoulBasedReason } from '../utils/petSoulInference';
import { getPetPhotoUrl } from '../utils/petAvatar';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, BookOpen, Brain, Star, Award, Trophy,
  CheckCircle, ChevronRight, Sparkles, Loader2, Send,
  ArrowRight, Play, ChevronDown, Target, Users, Calendar,
  MapPin, Clock, PawPrint, Heart, Shield, Zap, ChevronLeft, Search
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
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
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
  
  // Topic Hub Modal state
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  // Use global pet context
  const { currentPet } = usePillarContext();
  const activePet = currentPet || selectedPet;
  
  // YouTube Training Videos
  const [youtubeVideos, setYoutubeVideos] = useState([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [videoTopic, setVideoTopic] = useState('basic_training');
  
  // Ask Mira - AI Learning Assistant
  const [askMiraQuestion, setAskMiraQuestion] = useState('');
  const [askMiraResponse, setAskMiraResponse] = useState(null);
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  const [showAskMira, setShowAskMira] = useState(false);
  
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
        fetch(`${API_URL}/api/products?pillar=learn&limit=20`),
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
      
      // Fetch initial YouTube videos
      fetchYouTubeVideos('basic_training');
    } catch (error) {
      console.error('Failed to fetch learn data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch YouTube training videos by topic
  const fetchYouTubeVideos = async (topic = 'basic_training') => {
    setYoutubeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/mira/youtube/by-topic?topic=${encodeURIComponent(topic)}&max_results=6`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.videos) {
          setYoutubeVideos(data.videos);
        }
      }
    } catch (error) {
      console.error('Failed to fetch YouTube videos:', error);
    } finally {
      setYoutubeLoading(false);
    }
  };

  // Fetch breed-specific videos if pet is selected
  const fetchBreedVideos = async (breed) => {
    setYoutubeLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/mira/youtube/by-breed?breed=${encodeURIComponent(breed)}&max_results=6`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.videos) {
          setYoutubeVideos(data.videos);
        }
      }
    } catch (error) {
      console.error('Failed to fetch breed videos:', error);
    } finally {
      setYoutubeLoading(false);
    }
  };

  // Ask Mira - AI Learning Assistant
  // Handle Ask Mira - Opens Mira AI with the query (like Emergency page)
  const handleAskMira = () => {
    if (!askMiraQuestion.trim()) return;
    
    // Open Mira AI with learn context
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: askMiraQuestion,
        initialQuery: askMiraQuestion,
        context: 'learn',
        pillar: 'learn',
        pet_name: activePet?.name,
        pet_breed: activePet?.breed
      }
    }));
    
    // Clear the input
    setAskMiraQuestion('');
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
      <PillarPageLayout
        pillar="learn"
        title="Learn - Training & Education | The Doggy Company"
        description="Training and guidance that respects personality. Expert-led training programs for dogs of all ages."
      >
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </PillarPageLayout>
    );
  }

  return (
    <PillarPageLayout
      pillar="learn"
      title="Learn - Training & Education | The Doggy Company"
      description="Training and guidance that respects personality. Expert-led training programs for dogs of all ages."
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION: Clean Ask Bar (like Emergency page style) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              What would you like to learn about your dog today?
            </h1>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 shadow-sm p-1.5 pl-5">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <Input
                value={askMiraQuestion}
                onChange={(e) => setAskMiraQuestion(e.target.value)}
                placeholder="Grooming guide for double coats · tips to stop barking"
                className="flex-1 border-0 focus-visible:ring-0 text-sm placeholder:text-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handleAskMira()}
                data-testid="ask-learn-input"
              />
              <Button
                onClick={handleAskMira}
                disabled={askMiraLoading || !askMiraQuestion.trim()}
                className="rounded-full bg-teal-500 hover:bg-teal-600 h-10 w-10 p-0"
              >
                {askMiraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 12 TOPIC BOXES - Each opens a topic hub page at /learn/[topic] */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { slug: 'puppy-basics', title: 'Puppy Basics', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/93c239031e6456380de0efe5eb0dc4f6c5b0c024dd4773902b6e0c573190b1d8.png', desc: 'New puppy checklists, routines, and training guides' },
              { slug: 'breed-guides', title: 'Breed Guides', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/b19ce463f91811f725efcf22558df9a370147e238e79f810d6f6f25776b03144.png', desc: 'Understand the unique traits of different dog breeds' },
              { slug: 'food-feeding', title: 'Food & Feeding', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/5b1a4488a31b3aba09ebc15dd55c6155cee07f252d937530af9763ce6122ed48.png', desc: 'Nutrition advice, feeding schedules, and diet tips' },
              { slug: 'grooming', title: 'Grooming', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/2aeee0fe285e7f4bf9b0695c92778e425922cb62c68d06f1fe8fdc33715f7aac.png', desc: 'Grooming tips, coat care, and brushing guides' },
              { slug: 'behavior', title: 'Behavior', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/22b2a63c7ce6c1bf271784616d997150b922e72b42f23b0b0dea6354151c556b.png', desc: 'Behavioral issues, training tips, and calming advice' },
              { slug: 'training-basics', title: 'Training Basics', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/3e9d2387a56550d68b8a4694f20654d13cb537ecee01b51b0f2cd396ecc09efd.png', desc: 'Training fundamentals, tips, and obedience guides' },
              { slug: 'travel-with-dogs', title: 'Travel with Dogs', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/9b35a1a9ed5767659671cda04fc117a5abeafb2693411704164c5b37a1062ffe.png', desc: 'Travel tips, safety advice, and gear recommendations' },
              { slug: 'senior-dog-care', title: 'Senior Dog Care', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/d9d9ebf8fe66ddcef4c455dbe5001f6143ef5b0c6ddf6e61689713ea03d13ec2.png', desc: 'Senior dog health, comfort, and activity tips' },
              { slug: 'health-basics', title: 'Health Basics', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/c693f115f02adac326f5e6bb07378e3636c4a2774096c30b532317a65464632d.png', desc: 'General health care, first aid, and wellness advice' },
              { slug: 'rescue-indie-care', title: 'Rescue / Indie Care', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/87e1b52ec6d6ab336a68adcea43c4a143f8de59d3cd2824e64e2c3fd9614441a.png', desc: 'Adoption, indie-breed tips, and rehabilitation guides' },
              { slug: 'seasonal-care', title: 'Seasonal Care', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/1e5c1f02a009891fbcef1a3e1004e6f1dfe7201bafd892ee8c1d026697842455.png', desc: 'Weather care tips for summer, winter, and beyond' },
              { slug: 'new-pet-parent-guide', title: 'New Pet Parent Guide', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/484b7ec0a72919db7f6137f25033184bea6787c2ccb296ffb23544249b6ae7a4.png', desc: 'Starting out with a new dog or puppy in your home' }
            ].map((topic) => (
              <Card
                key={topic.slug}
                className="p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
                onClick={() => setSelectedTopic(topic.slug)}
                data-testid={`topic-${topic.slug}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 leading-tight">{topic.title}</h3>
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ml-2">
                    <img src={topic.image} alt={topic.title} className="w-full h-full object-cover" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{topic.desc}</p>
                <button className="flex items-center gap-1 text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors">
                  Explore <ChevronRight className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HOW CAN WE HELP? - 3 Action Buckets */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 px-4 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">How can we help?</h2>
            <p className="text-gray-600 mt-1">Choose what matters most to you right now</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📦</span>
                <h3 className="font-semibold text-gray-900">Products & Routines</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full" />Help me choose the right products</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full" />Build a routine for my dog</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-amber-400 rounded-full" />Help me with grooming choices</li>
              </ul>
            </Card>
            
            <Card className="p-5 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🐕</span>
                <h3 className="font-semibold text-gray-900">Life Stage & Care</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-teal-400 rounded-full" />Guide me for my puppy</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-teal-400 rounded-full" />Help me with senior dog care</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-teal-400 rounded-full" />Recommend what suits my breed</li>
              </ul>
            </Card>
            
            <Card className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🤝</span>
                <h3 className="font-semibold text-gray-900">Support & Services</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-violet-400 rounded-full" />Find the right trainer</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-violet-400 rounded-full" />Help me prepare for travel</li>
                <li className="flex items-center gap-2"><span className="w-1 h-1 bg-violet-400 rounded-full" />Find help near me</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Old sections removed - using new 12 Topic Boxes above */}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* GUIDED LEARNING PATHS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div id="guided-paths" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Target className="w-4 h-4" />
              Step-by-Step Journeys
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Guided Learning Paths</h2>
            <p className="text-gray-600 mt-2">Follow a structured journey tailored to your situation</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { 
                title: 'New Puppy Path', 
                icon: '🐶', 
                steps: ['First week at home', 'Toilet training', 'Teething', 'Sleep routine', 'Socialization'],
                color: 'pink'
              },
              { 
                title: 'New Adoption Path', 
                icon: '🏠', 
                steps: ['Decompression', 'Trust building', 'First routine', 'Home boundaries', 'Emotional settling'],
                color: 'green'
              },
              { 
                title: 'Senior Dog Path', 
                icon: '🦮', 
                steps: ['Mobility support', 'Comfort needs', 'Diet adjustments', 'Rest & sleep', 'When to seek help'],
                color: 'purple'
              },
              { 
                title: 'Travel Path', 
                icon: '✈️', 
                steps: ['Road trips', 'Crates & carriers', 'Hydration', 'Travel anxiety', 'What to pack'],
                color: 'blue'
              },
              { 
                title: 'Grooming Path', 
                icon: '✨', 
                steps: ['Coat type guide', 'Brushing basics', 'Bath routine', 'Ears & eyes', 'Nail care'],
                color: 'amber'
              },
              { 
                title: 'Behavior Path', 
                icon: '🧠', 
                steps: ['Chewing', 'Barking', 'Pulling', 'Separation anxiety', 'Enrichment'],
                color: 'indigo'
              }
            ].map((path, idx) => (
              <Card 
                key={idx}
                className="p-5 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => setShowRequestModal(true)}
                data-testid={`guided-path-${idx}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{path.icon}</span>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{path.title}</h3>
                </div>
                <ul className="space-y-1.5">
                  {path.steps.slice(0, 4).map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className={`w-1.5 h-1.5 rounded-full bg-${path.color}-400`}></div>
                      {step}
                    </li>
                  ))}
                  {path.steps.length > 4 && (
                    <li className="text-xs text-blue-600">+{path.steps.length - 4} more steps</li>
                  )}
                </ul>
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <span className="text-xs text-gray-500">{path.steps.length} steps</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LEARN FOR MY DOG - Personalized Content (matches mockup) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {(activePet || userPets?.[0]) && (() => {
        const pet = activePet || userPets?.[0];
        const petName = pet?.name || 'Your Pet';
        const breed = pet?.breed || '';
        const isSenior = pet?.age_months > 84;
        const isPuppy = pet?.age_months < 12;
        
        // Generate personalized tips based on pet profile
        const personalizedTips = isSenior ? [
          { icon: '🦴', label: 'Joint comfort for senior dogs' },
          { icon: '🌡️', label: `Heat care for ${breed || 'senior dogs'}` },
          { icon: '🦮', label: 'Better leash manners' },
          { icon: '💧', label: 'Summer hydration tips' }
        ] : isPuppy ? [
          { icon: '🐶', label: 'Puppy training basics' },
          { icon: '🦷', label: 'Teething and biting solutions' },
          { icon: '🏠', label: 'Crate training guide' },
          { icon: '🎾', label: 'Socialization tips' }
        ] : [
          { icon: '🎯', label: `Training tips for ${breed || 'your dog'}` },
          { icon: '✨', label: 'Grooming guide' },
          { icon: '🥗', label: 'Nutrition basics' },
          { icon: '🏃', label: 'Exercise recommendations' }
        ];
        
        return (
          <div id="my-dog" className="py-12 bg-gradient-to-br from-blue-50 via-white to-green-50">
            <div className="max-w-6xl mx-auto px-4">
              <Card className="p-6 md:p-8 bg-white/90 backdrop-blur rounded-3xl border-0 shadow-lg">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: Pet Info & Tips */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      Learn for {petName}
                    </h2>
                    <p className="text-gray-600 text-sm mb-6">
                      Tips and advice picked just for your {isSenior ? 'senior ' : isPuppy ? 'puppy ' : ''}{breed || 'dog'}
                    </p>
                    
                    {/* Personalized Tips */}
                    <div className="space-y-3">
                      {personalizedTips.map((tip, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setVideoTopic(tip.label.toLowerCase().replace(/ /g, '_')); }}
                          className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-all text-left"
                        >
                          <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl">
                            {tip.icon}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{tip.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Right: Pet Illustration */}
                  <div className="w-full md:w-64 flex-shrink-0">
                    <div className="relative">
                      <img 
                        src={getPetPhotoUrl(pet)}
                        alt={petName}
                        className="w-full aspect-square object-cover rounded-2xl"
                      />
                      {/* Watercolor effect overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent rounded-2xl" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* WATCH VIDEOS - Let's Watch Some Videos */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {youtubeVideos.length > 0 && (
        <div className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Let's Watch Some Videos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {youtubeVideos.slice(0, 3).map((video, idx) => (
                <Card 
                  key={idx}
                  className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => window.open(`https://youtube.com/watch?v=${video.videoId}`, '_blank')}
                >
                  <div className="relative aspect-video">
                    <img 
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {video.duration || '5 min'}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-6 h-6 text-gray-800 ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{video.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{video.description}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => navigate('/learn/videos')}>
                Explore All Videos <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PRODUCTS THAT HELP (SEPARATE SECTION) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div id="products" className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span>🛍️</span>
              Products That Help
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Training & Learning Products</h2>
            <p className="text-gray-600 mt-2">Quality products to support your learning journey</p>
          </div>
          
          {/* Product Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { id: 'all', label: 'All Products', icon: '🛒' },
              { id: 'training', label: 'Training Tools', icon: '🎯' },
              { id: 'grooming', label: 'Grooming', icon: '✨' },
              { id: 'feeding', label: 'Feeding', icon: '🍽️' },
              { id: 'travel', label: 'Travel', icon: '✈️' },
              { id: 'comfort', label: 'Comfort', icon: '🛋️' }
            ].map((cat) => (
              <Button
                key={cat.id}
                variant="outline"
                size="sm"
                onClick={() => navigate(`/shop?pillar=learn&category=${cat.id}`)}
                className="hover:bg-amber-50 hover:border-amber-300"
                data-testid={`product-category-${cat.id}`}
              >
                {cat.icon} {cat.label}
              </Button>
            ))}
          </div>
          
          {/* Products Grid */}
          <PersonalizedPicks pillar="learn" maxProducts={8} />
          
          <div className="mt-6 text-center">
            <Button 
              onClick={() => navigate('/shop?pillar=learn')}
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              View All Learning Products <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SERVICES THAT HELP (SEPARATE SECTION) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div id="services" className="py-12 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <span>🎓</span>
              Services That Help
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Expert Support & Training</h2>
            <p className="text-gray-600 mt-2">Professional trainers, groomers, and behavioral specialists</p>
          </div>
          
          {/* Service Category Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Training Consult', icon: '🎯', desc: 'One-on-one guidance' },
              { label: 'Grooming Consult', icon: '✨', desc: 'Coat care advice' },
              { label: 'Behavior Support', icon: '🧠', desc: 'Issue resolution' },
              { label: 'Puppy Guidance', icon: '🐶', desc: 'First year support' }
            ].map((service, idx) => (
              <Card 
                key={idx}
                className="p-4 cursor-pointer hover:shadow-lg transition-all bg-white/70 hover:bg-white"
                onClick={() => setShowRequestModal(true)}
                data-testid={`service-card-${idx}`}
              >
                <div className="text-center">
                  <span className="text-3xl mb-2 block">{service.icon}</span>
                  <h3 className="font-semibold text-gray-900 text-sm">{service.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{service.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* NEAR ME - Local trainers, groomers, pet stores, vets */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div id="near-me">
        <NearbyLearnServices />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SUPPORT THAT MIGHT HELP - Personalized Services */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {(activePet || userPets?.[0]) && (
        <SupportForPet 
          pet={activePet || userPets?.[0]} 
          onServiceClick={(service) => {
            setRequestForm(prev => ({ ...prev, learn_type: service.id }));
            setShowRequestModal(true);
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DAILY ROUTINE SUGGESTIONS - Personalized Schedule */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {(activePet || userPets?.[0]) && (
        <PetDailyRoutine 
          pet={activePet || userPets?.[0]}
          onEditRoutine={() => {
            setRequestForm(prev => ({ ...prev, learn_type: 'routine' }));
            setShowRequestModal(true);
          }}
          onProductClick={(productName) => navigate(`/shop?search=${encodeURIComponent(productName)}`)}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ASK CONCIERGE FOR PET - Human Help Layer */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {(activePet || userPets?.[0]) && (
        <AskConciergeForPet
          pet={activePet || userPets?.[0]}
          onAction={(actionId) => {
            setRequestForm(prev => ({ ...prev, learn_type: actionId }));
            setShowRequestModal(true);
          }}
          onAskConcierge={() => {
            window.dispatchEvent(new CustomEvent('openMiraAI', {
              detail: {
                context: 'concierge',
                pillar: 'learn',
                pet_name: (activePet || userPets?.[0])?.name
              }
            }));
          }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MIRA ADVISOR - Training Mentor AI Assistant
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-2xl mx-auto px-4 mb-8">
        <MiraAdvisorCard pillar="learn" activePet={activePet} />
        
        {/* Download Training Milestones Checklist */}
        <div className="mt-4 flex justify-center">
          <ChecklistDownloadButton 
            pillar="learn" 
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          />
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SOUL MADE PRODUCTS - Training/Learn products with breed artwork */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {userPets && userPets[0] && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <SoulMadeCollection
            pillar="learn"
            maxItems={8}
            showTitle={true}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BREED-SMART RECOMMENDATIONS - Based on breed_matrix */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {userPets && userPets[0] && (
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <BreedSmartRecommendations pillar="learn" />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ARCHETYPE-PERSONALIZED PRODUCTS - Multi-factor filtering */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <ArchetypeProducts pillar="learn" maxProducts={8} showTitle={true} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CURATED BUNDLES - Save with handpicked combinations */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <CuratedBundles pillar="learn" showTitle={true} />
      </div>
      
      {/* Unified Curated Layer - Matches Dine/Celebrate gold standard */}
      <MiraCuratedLayer
        pillar="learn"
        activePet={activePet || userPets?.[0]}
        token={token}
        userEmail={user?.email}
        isLoading={!userPets && !!token}
      />
      
      {/* Mira's Picks for Pet */}
      {(activePet || userPets?.[0]) && (
        <div className="max-w-6xl mx-auto px-4 mt-6">
          <PillarPicksSection pillar="learn" pet={activePet || userPets[0]} />
        </div>
      )}

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
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 relative">
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

      {/* YouTube Training Videos Section */}
      <div className="py-16 bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Play className="w-8 h-8 text-red-600" />
              <h2 className="text-3xl font-bold text-gray-900">Training Videos</h2>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Free expert training videos curated for {selectedPet?.name || 'your pet'} - watch and learn at your own pace
            </p>
          </div>
          
          {/* Topic Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {[
              { id: 'basic_training', label: 'Basic Training', icon: '🎯' },
              { id: 'puppy_training', label: 'Puppy Training', icon: '🐶' },
              { id: 'behavior_fix', label: 'Behavior Fixes', icon: '🧠' },
              { id: 'tricks', label: 'Tricks & Fun', icon: '🎪' },
              { id: 'leash_training', label: 'Leash Walking', icon: '🦮' },
              { id: 'anxiety', label: 'Anxiety Help', icon: '💜' },
            ].map((topic) => (
              <Button
                key={topic.id}
                variant={videoTopic === topic.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setVideoTopic(topic.id);
                  fetchYouTubeVideos(topic.id);
                }}
                className={videoTopic === topic.id ? 'bg-red-600 hover:bg-red-700' : ''}
                data-testid={`video-topic-${topic.id}`}
              >
                {topic.icon} {topic.label}
              </Button>
            ))}
            {selectedPet?.breed && (
              <Button
                variant={videoTopic === 'breed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setVideoTopic('breed');
                  fetchBreedVideos(selectedPet.breed);
                }}
                className={videoTopic === 'breed' ? 'bg-red-600 hover:bg-red-700' : ''}
                data-testid="video-topic-breed"
              >
                🐕 {selectedPet.breed} Tips
              </Button>
            )}
          </div>
          
          {/* Video Grid */}
          {youtubeLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
          ) : youtubeVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {youtubeVideos.map((video, idx) => (
                <Card 
                  key={video.id || idx} 
                  className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => window.open(video.url || `https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                  data-testid={`video-card-${idx}`}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all">
                        <Play className="w-8 h-8 text-white ml-1" fill="white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600 transition-colors">
                      {video.title}
                    </h3>
                    {video.channel && (
                      <p className="text-sm text-gray-500">{video.channel}</p>
                    )}
                    {video.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{video.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No videos found. Try a different topic!</p>
            </div>
          )}
        </div>
      </div>

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
      
      {/* Topic Hub Modal - Opens when clicking topic boxes */}
      <LearnTopicModal 
        isOpen={!!selectedTopic}
        onClose={() => setSelectedTopic(null)}
        topicSlug={selectedTopic}
      />
      
      {/* Concierge® Button - Blue C® for Service Desk chat */}
      <ConciergeButton 
        pillar="learn" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default LearnPage;

/**
 * AdvisoryPage.jsx
 * 
 * Decision-support layer for pet parents.
 * "Help me decide what's right for my dog"
 * 
 * Structure follows Emergency page pattern:
 * - 11 Intent Tiles (Concierge is overlay, not tile)
 * - Ask Advisory AI hero
 * - My Dog Advisory personalized section
 * - Guided Paths
 * - Curated Bundles
 * - Soul-Created Products
 * - Near Me Services
 * - Concierge overlay throughout
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePillarContext } from '../context/PillarContext';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import { ConciergeButton } from '../components/mira-os';
import ProductCard from '../components/ProductCard';
import { getPetPhotoUrl } from '../utils/petAvatar';
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import CuratedBundles from '../components/CuratedBundles';
import {
  Brain, Heart, Apple, Home, Stethoscope, GraduationCap,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Users, Calendar, MapPin, Award,
  Phone, MessageCircle, Clock, PawPrint, Shield, ShoppingBag, 
  AlertCircle, Plane, Baby, Scissors, Dumbbell, Sun, Leaf, Dog,
  Search, HelpCircle, Lightbulb, Target, Package, ThermometerSun
} from 'lucide-react';

// 11 Intent Tiles Configuration (Concierge is overlay, not tile)
const ADVISORY_INTENTS = [
  {
    id: 'food_nutrition',
    title: 'Food & Nutrition',
    description: 'What to feed, how much, dietary needs',
    icon: Apple,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    questions: ['Best food for my breed?', 'How much should I feed?', 'Allergies & diet?']
  },
  {
    id: 'puppy_guidance',
    title: 'Puppy Guidance',
    description: 'First year essentials & milestones',
    icon: Baby,
    color: 'from-pink-500 to-rose-600',
    bgColor: 'bg-pink-50',
    questions: ['What to buy first?', 'Vaccination schedule?', 'Toilet training?']
  },
  {
    id: 'breed_guidance',
    title: 'Breed Guidance',
    description: 'Breed-specific care & traits',
    icon: Dog,
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-50',
    questions: ['Care for my breed?', 'Common health issues?', 'Exercise needs?']
  },
  {
    id: 'grooming_coat',
    title: 'Grooming & Coat',
    description: 'Coat care, brushing, bathing',
    icon: Scissors,
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    questions: ['How often to groom?', 'Best brush for coat?', 'Shedding control?']
  },
  {
    id: 'behaviour_training',
    title: 'Behaviour & Training',
    description: 'Training tips, behavior issues',
    icon: Brain,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
    questions: ['Stop pulling on leash?', 'Reduce barking?', 'Separation anxiety?']
  },
  {
    id: 'travel_readiness',
    title: 'Travel Readiness',
    description: 'Travel prep, gear, documents',
    icon: Plane,
    color: 'from-sky-500 to-cyan-600',
    bgColor: 'bg-sky-50',
    questions: ['Is my dog travel ready?', 'What documents needed?', 'Car anxiety help?']
  },
  {
    id: 'senior_care',
    title: 'Senior Dog Care',
    description: 'Comfort, mobility, health for seniors',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-50',
    questions: ['Senior diet changes?', 'Joint support?', 'Comfort products?']
  },
  {
    id: 'home_setup',
    title: 'Home Setup',
    description: 'Beds, crates, safe spaces',
    icon: Home,
    color: 'from-teal-500 to-emerald-600',
    bgColor: 'bg-teal-50',
    questions: ['Best bed for my dog?', 'Crate training?', 'Safe home setup?']
  },
  {
    id: 'new_adoption',
    title: 'New Adoption',
    description: 'First days, settling, bonding',
    icon: PawPrint,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50',
    questions: ['First 7 days guide?', 'Rescue settling tips?', 'Building trust?']
  },
  {
    id: 'product_advice',
    title: 'Product Advice',
    description: 'What to buy for your situation',
    icon: ShoppingBag,
    color: 'from-indigo-500 to-purple-600',
    bgColor: 'bg-indigo-50',
    questions: ['Best products for puppies?', 'Summer essentials?', 'Travel kit?']
  },
  {
    id: 'recovery_care',
    title: 'Recovery & Care',
    description: 'Post-surgery, illness recovery',
    icon: Stethoscope,
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-50',
    questions: ['Post-surgery care?', 'Recovery products?', 'Feeding during illness?']
  }
];

// Guided Paths Configuration
const GUIDED_PATHS = [
  {
    id: 'new_puppy',
    title: 'New Puppy Path',
    description: 'Complete guide for your first year',
    icon: Baby,
    color: 'from-pink-500 to-rose-600',
    steps: [
      { title: 'What to buy first', items: ['Bed', 'Bowls', 'Collar', 'Tag', 'Leash'] },
      { title: 'What to feed', items: ['Puppy food', 'Treats', 'Feeding schedule'] },
      { title: 'First grooming', items: ['Gentle brush', 'Puppy shampoo', 'Nail trimmer'] },
      { title: 'Vaccine tracker', items: ['DHPP', 'Rabies', 'Bordetella', 'Deworming'] },
      { title: 'Toilet training', items: ['Pee pads', 'Enzymatic cleaner', 'Routine tips'] }
    ]
  },
  {
    id: 'new_adoption',
    title: 'New Adoption Path',
    description: 'Help your rescue settle in',
    icon: Heart,
    color: 'from-orange-500 to-amber-600',
    steps: [
      { title: 'First 7 days', items: ['Decompression space', 'Quiet time', 'Patience'] },
      { title: 'Safe home setup', items: ['Remove hazards', 'Create den', 'Baby gates'] },
      { title: 'Feeding & routine', items: ['Set schedule', 'Consistent meals', 'Water access'] },
      { title: 'Emotional settling', items: ['No overwhelming', 'Calm introductions', 'Trust building'] },
      { title: 'Basic health checks', items: ['Vet visit', 'Vaccinations', 'Deworming'] }
    ]
  },
  {
    id: 'senior_dog',
    title: 'Senior Dog Path',
    description: 'Comfort & care for aging pets',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    steps: [
      { title: 'Mobility support', items: ['Ramps', 'Non-slip mats', 'Support harness'] },
      { title: 'Comfort essentials', items: ['Orthopedic bed', 'Soft blankets', 'Heating pad'] },
      { title: 'Diet adjustments', items: ['Senior food', 'Joint supplements', 'Easy-digest'] },
      { title: 'Sleep quality', items: ['Quiet space', 'Temperature control', 'Night light'] },
      { title: 'Recovery support', items: ['Gentle exercise', 'Massage', 'Regular vet checks'] }
    ]
  },
  {
    id: 'travel_ready',
    title: 'Travel Ready Path',
    description: 'Prepare for trips with your pet',
    icon: Plane,
    color: 'from-sky-500 to-blue-600',
    steps: [
      { title: 'Is my dog fit?', items: ['Health check', 'Age appropriate', 'Anxiety level'] },
      { title: 'Documents needed', items: ['Health certificate', 'Vaccination records', 'ID tags'] },
      { title: 'Travel gear', items: ['Carrier', 'Harness', 'Calming aids'] },
      { title: 'Food & hydration', items: ['Travel bowls', 'Sealed food', 'Water bottle'] },
      { title: 'Vet support', items: ['Destination vet contacts', 'Emergency numbers'] }
    ]
  },
  {
    id: 'coat_grooming',
    title: 'Coat & Grooming Path',
    description: 'Care by coat type',
    icon: Scissors,
    color: 'from-purple-500 to-violet-600',
    steps: [
      { title: 'Know your coat', items: ['Short', 'Long', 'Double', 'Curly', 'Wire'] },
      { title: 'Shedding control', items: ['De-shedding brush', 'Regular brushing', 'Diet'] },
      { title: 'Mat prevention', items: ['Detangling spray', 'Slicker brush', 'Regular combing'] },
      { title: 'Special care', items: ['Tear stains', 'Ear cleaning', 'Wrinkle care'] },
      { title: 'Bathing routine', items: ['Frequency', 'Right shampoo', 'Drying tips'] }
    ]
  },
  {
    id: 'behaviour_path',
    title: 'Behaviour Path',
    description: 'Address common issues',
    icon: Brain,
    color: 'from-blue-500 to-indigo-600',
    steps: [
      { title: 'Leash pulling', items: ['Front-clip harness', 'Training treats', 'Patience'] },
      { title: 'Excessive barking', items: ['Identify trigger', 'Redirect', 'Training'] },
      { title: 'Separation anxiety', items: ['Gradual departures', 'Calming aids', 'Safe space'] },
      { title: 'Destructive chewing', items: ['Appropriate chews', 'Redirect', 'Exercise'] },
      { title: 'Guest behaviour', items: ['Controlled introductions', 'Training', 'Safe space'] }
    ]
  }
];

// Seasonal/Climate Advice
const SEASONAL_ADVICE = [
  { 
    id: 'summer', 
    title: 'Summer Care', 
    icon: Sun, 
    color: 'bg-amber-100 text-amber-700',
    tips: ['Hydration', 'Avoid hot pavement', 'Cooling mats', 'Early/late walks']
  },
  { 
    id: 'monsoon', 
    title: 'Monsoon Care', 
    icon: ThermometerSun, 
    color: 'bg-blue-100 text-blue-700',
    tips: ['Paw drying', 'Raincoat', 'Tick prevention', 'Indoor activities']
  },
  { 
    id: 'winter', 
    title: 'Winter Care', 
    icon: ThermometerSun, 
    color: 'bg-cyan-100 text-cyan-700',
    tips: ['Warm bedding', 'Shorter baths', 'Paw protection', 'Extra calories']
  }
];

const AdvisoryPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { currentPet } = usePillarContext();
  
  // Refs for scrolling
  const askAdvisoryRef = useRef(null);
  const myDogRef = useRef(null);
  const guidedPathsRef = useRef(null);
  const productsRef = useRef(null);
  const nearMeRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [advisoryQuery, setAdvisoryQuery] = useState('');
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [showAiResponse, setShowAiResponse] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  const activePet = currentPet;
  const petName = activePet?.name || 'Your Pet';
  const petBreed = activePet?.breed || '';
  const petAge = activePet?.age_years || activePet?.age || 0;
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/advisory/products`),
        fetch(`${API_URL}/api/advisory/bundles`)
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ask Advisory AI
  const handleAskAdvisory = async () => {
    if (!advisoryQuery.trim()) return;
    
    setAiLoading(true);
    setShowAiResponse(true);
    
    try {
      const response = await fetch(`${API_URL}/api/advisory/ask-advisory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          question: advisoryQuery,
          pet_id: activePet?.id,
          pet_name: activePet?.name,
          pet_breed: activePet?.breed,
          pet_age: activePet?.age_years,
          context: 'advisory'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiResponse(data.answer || 'Let me connect you with our Concierge for personalized advice.');
        
        // Store related products for display
        if (data.related_products?.length > 0) {
          setProducts(prev => [...data.related_products, ...prev.filter(p => !data.related_products.find(rp => rp.id === p.id))]);
        }
      } else {
        setAiResponse('Our Concierge® team is ready to help you with this. Tap below to chat!');
      }
    } catch (error) {
      setAiResponse('Our Concierge® team is ready to help you with this. Tap below to chat!');
    } finally {
      setAiLoading(false);
    }
  };

  const openWhatsAppConcierge = (context = '') => {
    const baseMessage = 'Hi, I need advisory help';
    const contextMessage = context ? ` about ${context}` : '';
    const petMessage = activePet ? ` for my ${activePet.breed || 'pet'} ${activePet.name}` : '';
    window.open(`https://wa.me/918971702582?text=${encodeURIComponent(baseMessage + contextMessage + petMessage)}`, '_blank');
  };

  // Get personalized advice based on pet profile
  const getPersonalizedAdvice = () => {
    const advice = [];
    
    if (!activePet) {
      return [
        { title: 'Sign in for personalized advice', description: 'Get recommendations tailored to your pet' }
      ];
    }
    
    // Age-based advice
    if (petAge < 1) {
      advice.push({ 
        title: 'Puppy Development Tips', 
        description: `${petName} is in a critical growth phase`,
        icon: Baby,
        color: 'text-pink-600 bg-pink-50'
      });
    } else if (petAge > 7) {
      advice.push({ 
        title: 'Senior Comfort Guide', 
        description: `Support ${petName}'s golden years`,
        icon: Heart,
        color: 'text-rose-600 bg-rose-50'
      });
    }
    
    // Breed-specific advice
    if (petBreed) {
      const breedLower = petBreed.toLowerCase();
      
      if (breedLower.includes('pug') || breedLower.includes('bulldog') || breedLower.includes('shih')) {
        advice.push({
          title: 'Flat-Face Care Tips',
          description: `Special care for ${petBreed}s in heat`,
          icon: ThermometerSun,
          color: 'text-amber-600 bg-amber-50'
        });
      }
      
      if (breedLower.includes('labrador') || breedLower.includes('golden') || breedLower.includes('husky')) {
        advice.push({
          title: 'Double Coat Care',
          description: `Shedding management for ${petBreed}s`,
          icon: Scissors,
          color: 'text-purple-600 bg-purple-50'
        });
      }
      
      if (breedLower.includes('indie') || breedLower.includes('desi')) {
        advice.push({
          title: 'Indian Breed Care',
          description: `Hardy but special needs for ${petName}`,
          icon: Star,
          color: 'text-orange-600 bg-orange-50'
        });
      }
    }
    
    // Season-based advice (assuming summer for India)
    advice.push({
      title: 'Summer Heat Advisory',
      description: 'Keep cool with these tips',
      icon: Sun,
      color: 'text-yellow-600 bg-yellow-50'
    });
    
    return advice.slice(0, 4);
  };

  const personalizedAdvice = getPersonalizedAdvice();

  return (
    <PillarPageLayout
      pillar="advisory"
      title="Advisory - Pet Guidance | The Doggy Company"
      description="Help deciding what's right for your dog. Food, grooming, training, travel, senior care - personalized guidance based on your pet's needs."
    >
      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 1: ASK ADVISORY - AI Decision Support Hero
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={askAdvisoryRef} className="py-8 px-4 bg-gradient-to-b from-violet-100 to-white" data-testid="ask-advisory-section">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <Badge className="bg-violet-600 text-white mb-3">
              <Lightbulb className="w-3 h-3 mr-1" /> Ask Advisory
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              What would you like help deciding for {petName}?
            </h1>
            <p className="text-gray-600">
              Get personalized guidance based on your pet's actual needs
            </p>
          </div>
          
          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto mb-6">
            <Input
              value={advisoryQuery}
              onChange={(e) => setAdvisoryQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAdvisory()}
              placeholder={`e.g., "Best food for my ${petBreed || 'dog'}" or "What bed should I buy?"`}
              className="w-full py-6 pl-4 pr-12 text-lg rounded-xl border-2 border-violet-200 focus:border-violet-500"
            />
            <Button
              onClick={handleAskAdvisory}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-700"
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          
          {/* AI Response */}
          {showAiResponse && (
            <Card className="max-w-2xl mx-auto p-4 mb-6 bg-violet-50 border-violet-200">
              {aiLoading ? (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-600" />
                  <span className="text-violet-700">Thinking...</span>
                </div>
              ) : (
                <div>
                  <p className="text-gray-700 mb-3">{aiResponse}</p>
                  <Button
                    onClick={() => openWhatsAppConcierge(advisoryQuery)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Talk to Concierge®
                  </Button>
                </div>
              )}
            </Card>
          )}
          
          {/* Example Questions */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              `Best food for ${petBreed || 'puppies'}`,
              'What bed for senior dogs?',
              'Travel prep checklist',
              'Grooming routine help'
            ].map((example, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAdvisoryQuery(example);
                  handleAskAdvisory();
                }}
                className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-sm text-violet-700 hover:bg-violet-50 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 2: 11 INTENT TILES - What kind of help do you need?
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-white" data-testid="intent-tiles-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">What Would You Like Help With?</h2>
            <p className="text-sm text-gray-600">Choose a topic to get started</p>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {ADVISORY_INTENTS.map((intent) => {
              const Icon = intent.icon;
              const isSelected = selectedIntent === intent.id;
              
              return (
                <button
                  key={intent.id}
                  onClick={() => setSelectedIntent(isSelected ? null : intent.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    isSelected 
                      ? `bg-gradient-to-br ${intent.color} text-white shadow-lg scale-105` 
                      : `${intent.bgColor} hover:shadow-md border-2 border-transparent hover:border-gray-200`
                  }`}
                  data-testid={`intent-${intent.id}`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-white' : ''}`} />
                  <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {intent.title}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Selected Intent Details */}
          {selectedIntent && (
            <Card className="mt-6 p-4 border-2 border-violet-200 bg-violet-50/50">
              {(() => {
                const intent = ADVISORY_INTENTS.find(i => i.id === selectedIntent);
                const Icon = intent.icon;
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${intent.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{intent.title}</h3>
                        <p className="text-sm text-gray-600">{intent.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {intent.questions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAdvisoryQuery(q);
                            askAdvisoryRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-white border border-violet-200 rounded-full text-sm text-violet-700 hover:bg-violet-100"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => openWhatsAppConcierge(intent.title)}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Talk to Concierge® about {intent.title}
                    </Button>
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 3: MY DOG ADVISORY - Personalized Recommendations
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={myDogRef} className="py-8 px-4 bg-gradient-to-b from-purple-50 to-white" data-testid="my-dog-advisory-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {activePet ? `Advice for ${petName} Today` : 'Personalized Advice'}
            </h2>
            {activePet && (
              <Badge className="bg-purple-100 text-purple-700">
                {petBreed} • {petAge > 0 ? `${petAge} years` : 'Puppy'}
              </Badge>
            )}
          </div>
          
          {activePet ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {personalizedAdvice.map((advice, idx) => {
                const Icon = advice.icon || Lightbulb;
                return (
                  <Card 
                    key={idx} 
                    className={`p-4 cursor-pointer hover:shadow-lg transition-all ${advice.color || 'bg-gray-50'}`}
                    onClick={() => openWhatsAppConcierge(advice.title)}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{advice.title}</h3>
                    <p className="text-xs text-gray-600">{advice.description}</p>
                    <div className="mt-2 flex items-center text-xs text-violet-600 font-medium">
                      Get advice <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-6 text-center bg-purple-50">
              <PawPrint className="w-12 h-12 mx-auto text-purple-300 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Sign in for Personalized Advice</h3>
              <p className="text-sm text-gray-600 mb-4">Get recommendations tailored to your pet's breed, age, and needs</p>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Sign In
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 4: CONCIERGE ASSISTANCE - Overlay throughout (like Emergency)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <ServiceCatalogSection 
        pillar="advisory"
        title="Concierge® Will Guide You"
        subtitle="We can help you decide what's right for your pet"
        maxServices={6}
        hidePrice={true}
      />

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 5: GUIDED PATHS - Step-by-step decision journeys
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={guidedPathsRef} className="py-8 px-4 bg-white" data-testid="guided-paths-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Guided Decision Paths</h2>
            <p className="text-sm text-gray-600">Step-by-step guidance for common situations</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {GUIDED_PATHS.map((path) => {
              const Icon = path.icon;
              const isExpanded = selectedPath === path.id;
              
              return (
                <div key={path.id}>
                  <button
                    onClick={() => setSelectedPath(isExpanded ? null : path.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      isExpanded 
                        ? `bg-gradient-to-br ${path.color} text-white shadow-lg` 
                        : 'bg-gray-50 hover:shadow-md border border-gray-200'
                    }`}
                  >
                    <Icon className={`w-6 h-6 mb-2 ${isExpanded ? 'text-white' : 'text-violet-600'}`} />
                    <h3 className={`font-semibold text-sm ${isExpanded ? 'text-white' : 'text-gray-900'}`}>
                      {path.title}
                    </h3>
                    <p className={`text-xs mt-1 ${isExpanded ? 'text-white/80' : 'text-gray-500'}`}>
                      {path.description}
                    </p>
                  </button>
                  
                  {isExpanded && (
                    <Card className="mt-2 p-4 bg-white border-2 border-violet-200">
                      <div className="space-y-3">
                        {path.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-gray-900">{step.title}</h4>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {step.items.map((item, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        onClick={() => openWhatsAppConcierge(path.title)}
                        className="w-full mt-4 bg-violet-600 hover:bg-violet-700"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Get Help with {path.title}
                      </Button>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 6: ADVISORY PRODUCTS & BUNDLES - Soul-created structure
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={productsRef} className="py-8 px-4 bg-gradient-to-b from-violet-50 to-white" data-testid="advisory-products-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingBag className="w-6 h-6 text-violet-600" />
            <h2 className="text-xl font-bold text-gray-900">Products for {petName}'s Needs</h2>
          </div>
          
          {/* BUNDLES ON TOP */}
          <div className="mb-8">
            <CuratedBundles pillar="advisory" maxBundles={3} showTitle={true} />
          </div>
          
          {/* SMART PICKS */}
          <BreedSmartRecommendations pillar="advisory" />
          
          {/* ARCHETYPE PRODUCTS */}
          <div className="mt-8">
            <ArchetypeProducts pillar="advisory" maxProducts={8} showTitle={true} />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 7: NEAR ME - Nearby services (trainers, groomers, vets)
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section ref={nearMeRef} className="py-8 px-4 bg-white" data-testid="near-me-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Find Services Near You</h2>
            <p className="text-sm text-gray-600">Trainers, groomers, vets, and more in your area</p>
          </div>
          
          {/* Service Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Pet Trainers', icon: GraduationCap, color: 'bg-blue-50 text-blue-600', search: 'dog+trainer' },
              { name: 'Groomers', icon: Scissors, color: 'bg-purple-50 text-purple-600', search: 'pet+groomer' },
              { name: 'Veterinarians', icon: Stethoscope, color: 'bg-red-50 text-red-600', search: 'veterinary+clinic' },
              { name: 'Pet Stores', icon: ShoppingBag, color: 'bg-green-50 text-green-600', search: 'pet+store' }
            ].map((service) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={service.name}
                  className={`p-4 ${service.color} cursor-pointer hover:shadow-lg transition-all text-center`}
                  onClick={() => window.open(`https://www.google.com/maps/search/${service.search}+near+me`, '_blank')}
                >
                  <Icon className="w-8 h-8 mx-auto mb-2" />
                  <h4 className="font-medium text-sm">{service.name}</h4>
                  <p className="text-xs opacity-70 mt-1">Find nearby</p>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center mt-6">
            <Button
              onClick={() => openWhatsAppConcierge('finding a service near me')}
              variant="outline"
              className="border-violet-300 text-violet-600"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Ask Concierge® for Recommendations
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 8: SEASONAL ADVICE - Climate/moment-based tips
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gradient-to-b from-amber-50 to-white" data-testid="seasonal-advice-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Seasonal Care Tips</h2>
            <p className="text-sm text-gray-600">Climate-based advice for {petName}</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {SEASONAL_ADVICE.map((season) => {
              const Icon = season.icon;
              return (
                <Card 
                  key={season.id} 
                  className={`p-4 ${season.color} cursor-pointer hover:shadow-lg transition-all`}
                  onClick={() => openWhatsAppConcierge(season.title)}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold text-sm mb-2">{season.title}</h3>
                  <ul className="text-xs space-y-1">
                    {season.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> {tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          LAYER 9: CONCIERGE ESCALATION - Always available help
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-violet-600" data-testid="concierge-cta-section">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Still Need Help Deciding?</h2>
          <p className="text-violet-100 mb-6">
            Our Concierge® team can help you choose the right products, services, or experts for {petName}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => openWhatsAppConcierge()}
              className="bg-white text-violet-600 hover:bg-violet-50"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Talk to Concierge®
            </Button>
            <Button
              onClick={() => window.location.href = '/services'}
              variant="outline"
              className="border-white text-white hover:bg-violet-700"
              size="lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Browse All Services
            </Button>
          </div>
        </div>
      </section>
    </PillarPageLayout>
  );
};

export default AdvisoryPage;

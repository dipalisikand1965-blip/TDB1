/**
 * AdoptPage.jsx - REDESIGNED
 * "I am bringing a dog home. Help me do it properly."
 * 
 * NOT a store page. This is a GUIDANCE HUB combining:
 * - Guidance & Checklists
 * - Products organized by need
 * - Services & Concierge help
 * - Breed/Age/Size logic
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import { ConciergeButton } from '../components/mira-os';
import CuratedBundles from '../components/CuratedBundles';
import NearbyAdoptServices from '../components/adopt/NearbyAdoptServices';
import { usePillarContext } from '../context/PillarContext';
import {
  Heart, PawPrint, Home, Calendar, MapPin, Phone, Users,
  ChevronRight, Sparkles, CheckCircle, Package, Utensils,
  Moon, Footprints, Scissors, FileText, ShoppingBag,
  MessageCircle, ArrowRight, Loader2, Baby, User, Crown,
  Dog, HelpCircle, Bed, Droplets, Bone, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════
// INTENT TILES - "I am bringing home a..."
// ═══════════════════════════════════════════════════════════════════════════
const INTENT_TILES = [
  { id: 'puppy', label: "I'm adopting a puppy", icon: Baby, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50' },
  { id: 'adult', label: "I'm adopting an adult dog", icon: Dog, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50' },
  { id: 'senior', label: "I'm adopting a senior dog", icon: Crown, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
  { id: 'indie', label: "I'm adopting an Indie", icon: Heart, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50' },
  { id: 'first-time', label: "First-time dog parent", icon: User, color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50' },
  { id: 'rescue', label: "Bringing home a rescue", icon: Home, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50' },
  { id: 'essentials', label: "Help me choose essentials", icon: ShoppingBag, color: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50' },
  { id: 'concierge', label: "Talk to Concierge", icon: MessageCircle, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50' }
];

// ═══════════════════════════════════════════════════════════════════════════
// ESSENTIALS BUCKETS - "What do I need first?"
// ═══════════════════════════════════════════════════════════════════════════
const ESSENTIALS_BUCKETS = [
  { id: 'day1', name: 'Essentials for Day 1', icon: Package, color: 'text-red-600', bg: 'bg-red-50', urgent: true },
  { id: 'week1', name: 'Essentials for Week 1', icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'home', name: 'Home Setup', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'feeding', name: 'Feeding Setup', icon: Utensils, color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'sleep', name: 'Sleep Setup', icon: Moon, color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'walking', name: 'Walking Setup', icon: Footprints, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { id: 'grooming', name: 'Grooming Basics', icon: Scissors, color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'documents', name: 'Documents & Vet Basics', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' }
];

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT CATEGORIES - Organized by need, not by product type
// ═══════════════════════════════════════════════════════════════════════════
const PRODUCT_CATEGORIES = {
  day1: {
    title: 'Day 1 Essentials',
    subtitle: 'Everything you need before bringing your new family member home',
    icon: Package,
    color: 'from-red-500 to-rose-500',
    products: [
      { name: 'Starter Bowl Set', description: 'Stainless steel food & water bowls', price: 599, icon: '🥣' },
      { name: 'Water Bowl', description: 'Spill-proof design', price: 349, icon: '💧' },
      { name: 'Feeding Mat', description: 'Non-slip, easy to clean', price: 299, icon: '🍽️' },
      { name: 'First Collar', description: 'Adjustable, soft material', price: 399, icon: '📿' },
      { name: 'First Harness', description: 'No-pull design for safety', price: 799, icon: '🎽' },
      { name: 'Leash', description: '5ft nylon with padded handle', price: 449, icon: '🔗' },
      { name: 'ID Tag', description: 'Engraved with your details', price: 199, icon: '🏷️' },
      { name: 'Poop Bag Holder', description: 'With 2 rolls included', price: 249, icon: '🗑️' },
      { name: 'First Bed', description: 'Washable, cozy design', price: 1299, icon: '🛏️' },
      { name: 'Blanket', description: 'Soft fleece for comfort', price: 499, icon: '🧣' },
      { name: 'Crate Mat', description: 'Waterproof, cushioned', price: 699, icon: '📦' },
      { name: 'Pee Pads', description: 'Pack of 30, super absorbent', price: 399, icon: '🧻' },
      { name: 'Food Storage Container', description: 'Airtight, keeps food fresh', price: 599, icon: '🫙' }
    ]
  },
  comfort: {
    title: 'Comfort & Settling In',
    subtitle: 'Help your new dog feel safe and secure in their new home',
    icon: Heart,
    color: 'from-pink-500 to-purple-500',
    products: [
      { name: 'Calming Blanket', description: 'Weighted for anxiety relief', price: 1499, icon: '💆' },
      { name: 'Crate Cover', description: 'Creates a cozy den', price: 899, icon: '🏕️' },
      { name: 'Snuggle Toy', description: 'Heartbeat simulation', price: 999, icon: '🧸' },
      { name: 'Lick Mat', description: 'Reduces stress & anxiety', price: 399, icon: '👅' },
      { name: 'Chew Toys Set', description: 'Safe, durable options', price: 699, icon: '🦴' },
      { name: 'Soft Bed', description: 'Orthopedic support', price: 2499, icon: '☁️' },
      { name: 'Calming Mat', description: 'Lavender infused', price: 1199, icon: '🧘' }
    ]
  },
  home_setup: {
    title: 'Home Setup',
    subtitle: 'Make your home safe and welcoming for your new pet',
    icon: Home,
    color: 'from-blue-500 to-indigo-500',
    products: [
      { name: 'Gate / Barrier', description: 'Keep areas safe', price: 1999, icon: '🚧' },
      { name: 'Sofa Protector', description: 'Waterproof cover', price: 1299, icon: '🛋️' },
      { name: 'Waterproof Mat', description: 'For accidents', price: 799, icon: '💦' },
      { name: 'Feeding Corner Mat', description: 'Catches spills', price: 499, icon: '🍽️' },
      { name: 'Welcome Mat', description: 'Paw print design', price: 699, icon: '🚪' },
      { name: 'Toy Basket', description: 'Keep toys organized', price: 599, icon: '🧺' },
      { name: 'Storage Bins', description: 'For treats & supplies', price: 799, icon: '📦' }
    ]
  },
  grooming: {
    title: 'Grooming Basics',
    subtitle: 'Start good grooming habits from day one',
    icon: Scissors,
    color: 'from-pink-500 to-rose-500',
    products: [
      { name: 'Pet Towel', description: 'Super absorbent microfiber', price: 399, icon: '🛁' },
      { name: 'Brush', description: 'Suitable for all coat types', price: 499, icon: '🖌️' },
      { name: 'Comb', description: 'Detangling comb', price: 299, icon: '📐' },
      { name: 'Puppy Shampoo', description: 'Gentle, tearless formula', price: 449, icon: '🧴' },
      { name: 'Ear Wipes', description: 'Gentle cleaning', price: 249, icon: '👂' },
      { name: 'Eye Wipes', description: 'Tear stain removal', price: 249, icon: '👁️' },
      { name: 'Nail Clipper', description: 'With safety guard', price: 349, icon: '✂️' }
    ]
  },
  walking: {
    title: 'Walking & Outside',
    subtitle: 'Everything for safe outdoor adventures',
    icon: Footprints,
    color: 'from-cyan-500 to-teal-500',
    products: [
      { name: 'Padded Harness', description: 'No-pull, breathable', price: 1299, icon: '🎽' },
      { name: 'Training Lead', description: '6ft with traffic handle', price: 699, icon: '🔗' },
      { name: 'Reflective Collar', description: 'For evening walks', price: 499, icon: '🌟' },
      { name: 'Raincoat', description: 'Waterproof with hood', price: 899, icon: '☔' },
      { name: 'Car Restraint', description: 'Seatbelt attachment', price: 599, icon: '🚗' },
      { name: 'Travel Bowl', description: 'Collapsible silicone', price: 299, icon: '🥣' },
      { name: 'Treat Pouch', description: 'For training on walks', price: 449, icon: '👝' }
    ]
  },
  training: {
    title: 'Training & Learning',
    subtitle: 'Build a strong bond through positive training',
    icon: Sparkles,
    color: 'from-amber-500 to-orange-500',
    products: [
      { name: 'Training Treats', description: 'Small, tasty rewards', price: 299, icon: '🍖' },
      { name: 'Training Pouch', description: 'Easy-access design', price: 449, icon: '👜' },
      { name: 'Clicker', description: 'For positive reinforcement', price: 149, icon: '🔔' },
      { name: 'Long Lead', description: '15ft for recall training', price: 599, icon: '🎗️' },
      { name: 'Chew-safe Toys', description: 'For teething & boredom', price: 499, icon: '🦷' },
      { name: 'Enrichment Toy', description: 'Puzzle feeder', price: 699, icon: '🧩' },
      { name: 'Sniff Mat', description: 'Mental stimulation', price: 599, icon: '👃' }
    ]
  },
  paperwork: {
    title: 'Paperwork & Records',
    subtitle: 'Stay organized with all your pet\'s documents',
    icon: FileText,
    color: 'from-gray-500 to-slate-500',
    products: [
      { name: 'Pet File Folder', description: 'Keep all records together', price: 399, icon: '📁' },
      { name: 'Vaccination Folder', description: 'Track all shots', price: 299, icon: '💉' },
      { name: 'Emergency Info Card', description: 'Wallet-sized', price: 99, icon: '🆘' },
      { name: 'Adoption File', description: 'Store adoption papers', price: 199, icon: '📋' },
      { name: 'Medical Record Sleeve', description: 'Waterproof protection', price: 149, icon: '🏥' }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CONCIERGE HELP OPTIONS
// ═══════════════════════════════════════════════════════════════════════════
const CONCIERGE_HELP = [
  { id: 'starter-kit', title: 'Help choose a starter kit', icon: Package, description: 'Get personalized recommendations based on your dog\'s size and breed' },
  { id: 'size-products', title: 'Size-appropriate products', icon: Dog, description: 'We\'ll help select the right sizes for bowls, beds, collars & more' },
  { id: 'find-vet', title: 'Find a vet nearby', icon: MapPin, description: 'Connect with verified veterinarians in your area' },
  { id: 'find-trainer', title: 'Find a trainer', icon: Users, description: 'Get matched with positive reinforcement trainers' },
  { id: 'first-grooming', title: 'Plan first grooming', icon: Scissors, description: 'Schedule and prepare for your pup\'s first grooming session' },
  { id: 'settling-routine', title: 'Build a settling routine', icon: Calendar, description: 'Get a customized 3-3-3 plan for your new dog' },
  { id: 'travel-help', title: 'Travel assistance', icon: Home, description: 'Help arranging transport if your pet is coming from another city' },
  { id: 'food-advice', title: 'Food & nutrition advice', icon: Utensils, description: 'Get diet recommendations based on age, breed & health' }
];

const AdoptPage = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { currentPet, userPets } = usePillarContext();
  
  // State
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [selectedBucket, setSelectedBucket] = useState('day1');
  const [selectedCategory, setSelectedCategory] = useState('day1');
  const [showConciergeModal, setShowConciergeModal] = useState(false);
  const [conciergeQuery, setConciergeQuery] = useState('');
  const [conciergeHelp, setConciergeHelp] = useState(null);
  
  // AI Adoption Advisor
  const [adoptQuery, setAdoptQuery] = useState('');
  const [adoptResponse, setAdoptResponse] = useState('');
  const [adoptLoading, setAdoptLoading] = useState(false);
  const [showAdoptResponse, setShowAdoptResponse] = useState(false);
  
  // Guided Paths from API
  const [adoptionPaths, setAdoptionPaths] = useState([]);
  const [pathsLoading, setPathsLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState(null);

  // Icon mapping for dynamic paths
  const ICON_MAP = {
    'Heart': Heart,
    'Home': Home,
    'Users': Users,
    'Star': Sparkles,
    'CheckCircle': CheckCircle
  };

  // Fetch guided paths from database
  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const response = await fetch(`${API_URL}/api/guided-paths/adopt`);
        if (response.ok) {
          const data = await response.json();
          const pathsWithIcons = data.paths.map(path => ({
            ...path,
            icon: ICON_MAP[path.icon] || Heart
          }));
          setAdoptionPaths(pathsWithIcons);
        }
      } catch (err) {
        console.error('Failed to fetch adoption paths:', err);
      } finally {
        setPathsLoading(false);
      }
    };
    fetchPaths();
  }, []);

  // Handle intent tile click
  const handleIntentClick = (intent) => {
    if (intent.id === 'concierge') {
      setShowConciergeModal(true);
    } else if (intent.id === 'essentials') {
      document.getElementById('essentials-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setSelectedIntent(intent.id);
      // Scroll to relevant section based on intent
      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // AI Adoption Advisor
  const handleAdoptionAdvice = async () => {
    if (!adoptQuery.trim()) return;
    
    setAdoptLoading(true);
    setShowAdoptResponse(true);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          message: adoptQuery,
          context: 'adoption_advisor',
          pillar: 'adopt'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdoptResponse(data.response || data.message || 'I\'m here to help with your adoption journey!');
      } else {
        setAdoptResponse('I\'m here to help! For personalized adoption advice, please speak with our concierge team.');
      }
    } catch (error) {
      setAdoptResponse('I\'m here to help! For personalized adoption advice, please speak with our concierge team.');
    } finally {
      setAdoptLoading(false);
    }
  };

  // Handle concierge help request
  const handleConciergeHelp = (help) => {
    setConciergeHelp(help);
    toast({
      title: `Concierge Request: ${help.title}`,
      description: 'Our team will reach out shortly to assist you.',
    });
  };

  const currentCategory = PRODUCT_CATEGORIES[selectedCategory];

  return (
    <PillarPageLayout
      pillar="adopt"
      title="Adopt - Bringing a Dog Home | The Doggy Company"
      description="Everything you need to bring a dog home properly. Guidance, checklists, products, and concierge help."
    >
      {/* ═══════════════════════════════════════════════════════════════════════════
          HERO SECTION - "I am bringing a dog home. Help me do it properly."
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Bringing a Dog Home?
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            We'll help you do it properly. Guidance, checklists, products, and expert support.
          </p>

          {/* Intent Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {INTENT_TILES.map((tile) => {
              const Icon = tile.icon;
              return (
                <Card
                  key={tile.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-lg hover:scale-102 ${tile.bg} border-0`}
                  onClick={() => handleIntentClick(tile)}
                  data-testid={`intent-tile-${tile.id}`}
                >
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br ${tile.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-800">{tile.label}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          AI ADOPTION ADVISOR
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4" data-testid="adopt-advisor-section">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 border-2 border-green-200 bg-white shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Adoption Advisor</h3>
                <p className="text-gray-600 text-sm">Ask anything about bringing a new dog home</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="e.g., How do I help a rescue dog adjust to their new home?"
                value={adoptQuery}
                onChange={(e) => setAdoptQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdoptionAdvice()}
                className="flex-1"
                data-testid="adopt-advisor-input"
              />
              <Button 
                onClick={handleAdoptionAdvice}
                disabled={adoptLoading || !adoptQuery.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {adoptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
              </Button>
            </div>
            
            {showAdoptResponse && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                {adoptLoading ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finding the best advice for you...
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-700 leading-relaxed">{adoptResponse}</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setAdoptQuery('');
                        setShowAdoptResponse(false);
                      }}
                      className="mt-3 border-green-300 text-green-600"
                    >
                      Ask Another Question
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          WHAT DO I NEED FIRST? - Hero Section
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section id="essentials-section" className="py-12 px-4 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="bg-green-100 text-green-700 mb-3">Most Important</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What Do I Need First?</h2>
            <p className="text-gray-600 mt-2">Click any category to see the essentials checklist</p>
          </div>

          {/* Essentials Buckets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {ESSENTIALS_BUCKETS.map((bucket) => {
              const Icon = bucket.icon;
              const isSelected = selectedBucket === bucket.id;
              return (
                <Card
                  key={bucket.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-green-500 shadow-lg' : ''
                  } ${bucket.bg}`}
                  onClick={() => {
                    setSelectedBucket(bucket.id);
                    setSelectedCategory(bucket.id === 'day1' ? 'day1' : 
                                        bucket.id === 'week1' ? 'comfort' :
                                        bucket.id === 'home' ? 'home_setup' :
                                        bucket.id === 'feeding' ? 'day1' :
                                        bucket.id === 'sleep' ? 'comfort' :
                                        bucket.id === 'walking' ? 'walking' :
                                        bucket.id === 'grooming' ? 'grooming' :
                                        'paperwork');
                  }}
                  data-testid={`bucket-${bucket.id}`}
                >
                  <Icon className={`w-8 h-8 ${bucket.color} mx-auto mb-2`} />
                  <p className="text-sm font-medium text-gray-800 text-center">{bucket.name}</p>
                  {bucket.urgent && (
                    <Badge className="mt-2 bg-red-500 text-white text-xs mx-auto block w-fit">
                      Start Here
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PRODUCT CATEGORIES - Organized by need
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section id="products-section" className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {Object.entries(PRODUCT_CATEGORIES).map(([key, cat]) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={key}
                  variant={selectedCategory === key ? 'default' : 'outline'}
                  className={selectedCategory === key ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setSelectedCategory(key)}
                  data-testid={`category-${key}`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.title.replace(' Essentials', '').replace(' Basics', '')}
                </Button>
              );
            })}
          </div>

          {/* Current Category Products */}
          {currentCategory && (
            <div>
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gray-900">{currentCategory.title}</h3>
                <p className="text-gray-600">{currentCategory.subtitle}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentCategory.products.map((product, idx) => (
                  <Card
                    key={idx}
                    className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => navigate(`/shop?search=${encodeURIComponent(product.name)}`)}
                    data-testid={`product-${idx}`}
                  >
                    <div className="text-3xl mb-3 text-center">{product.icon}</div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-green-600 font-bold text-sm">₹{product.price}</span>
                      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ShoppingBag className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="text-center mt-8">
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => navigate('/shop?pillar=adopt')}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Browse All {currentCategory.title}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          ADOPTION JOURNEY PATHS - The 3-3-3 Rule
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 px-4 bg-gradient-to-b from-white to-green-50" data-testid="adoption-paths-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Your Adoption Journey</h2>
            <p className="text-gray-600 mt-2">The 3-3-3 Rule: 3 days, 3 weeks, 3 months to feel at home</p>
          </div>
          
          {pathsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adoptionPaths.map((path) => {
                const Icon = path.icon;
                const isExpanded = selectedPath === path.id;
                return (
                  <Card 
                    key={path.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      isExpanded ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => setSelectedPath(isExpanded ? null : path.id)}
                    data-testid={`adoption-path-${path.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${path.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{path.title}</h3>
                        <p className="text-gray-600 text-sm">{path.description}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          {path.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
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
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/shop?pillar=adopt');
                            }}
                            variant="outline"
                            className="flex-1 border-green-300 text-green-600"
                          >
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Shop Essentials
                          </Button>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowConciergeModal(true);
                            }}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Get Help
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          CONCIERGE® SERVICES - No pricing, just helpful guidance
          ═══════════════════════════════════════════════════════════════════════════ */}
      <ServiceCatalogSection 
        pillar="adopt"
        title="Adoption Support"
        subtitle="Our concierge team will help you every step of the way"
        maxServices={4}
        hidePrice={true}
      />

      {/* ═══════════════════════════════════════════════════════════════════════════
          NEAR ME - Find local vets, pet stores, trainers, groomers
          ═══════════════════════════════════════════════════════════════════════════ */}
      <NearbyAdoptServices />

      {/* ═══════════════════════════════════════════════════════════════════════════
          CURATED BUNDLES - Starter kits
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-6xl mx-auto">
          <CuratedBundles pillar="adopt" showTitle={true} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          CONCIERGE HELP OPTIONS
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Need Help?</h2>
            <p className="text-gray-600 mt-2">Our concierge team can assist with any of these</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CONCIERGE_HELP.map((help) => {
              const Icon = help.icon;
              return (
                <Card
                  key={help.id}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-green-300"
                  onClick={() => handleConciergeHelp(help)}
                  data-testid={`concierge-help-${help.id}`}
                >
                  <Icon className="w-8 h-8 text-green-600 mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">{help.title}</h4>
                  <p className="text-sm text-gray-600">{help.description}</p>
                  <Button variant="ghost" size="sm" className="mt-3 text-green-600 p-0">
                    Get Help <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          CONCIERGE MODAL
          ═══════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={showConciergeModal} onOpenChange={setShowConciergeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Talk to Our Adoption Concierge
            </DialogTitle>
            <DialogDescription>
              Tell us what you need help with and we'll connect you with the right expert.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Input
              placeholder="What do you need help with?"
              value={conciergeQuery}
              onChange={(e) => setConciergeQuery(e.target.value)}
            />
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Quick options:</p>
              {CONCIERGE_HELP.slice(0, 4).map((help) => (
                <Button
                  key={help.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => {
                    setConciergeQuery(help.title);
                    handleConciergeHelp(help);
                    setShowConciergeModal(false);
                  }}
                >
                  {help.title}
                </Button>
              ))}
            </div>
            
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => {
              toast({
                title: 'Request Sent!',
                description: 'Our concierge team will contact you shortly.',
              });
              setShowConciergeModal(false);
            }}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Concierge® Button */}
      <ConciergeButton 
        pillar="adopt" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default AdoptPage;

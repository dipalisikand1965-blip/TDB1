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
import { usePillarContext } from '../context/PillarContext';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import { ConciergeButton } from '../components/mira-os';
import PersonalizedPicks from '../components/PersonalizedPicks';
import LearnProductsGrid from '../components/Learn/LearnProductsGrid';
import NearbyLearnServices from '../components/learn/NearbyLearnServices';
import PetDailyRoutine from '../components/learn/PetDailyRoutine';
import SupportForPet from '../components/learn/SupportForPet';
import AskConciergeForPet from '../components/learn/AskConciergeForPet';
import LearnTopicModal from '../components/learn/LearnTopicModal';
import CuratedBundles from '../components/CuratedBundles';
import BreedSmartRecommendations from '../components/BreedSmartRecommendations';
import ArchetypeProducts from '../components/ArchetypeProducts';
import SoulMadeCollection from '../components/SoulMadeCollection';
import PillarPicksSection from '../components/PillarPicksSection';
import { getPetPhotoUrl } from '../utils/petAvatar';
import SoulPersonalizationSection from '../components/SoulPersonalizationSection';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Brain, Star, Award, Trophy,
  CheckCircle, ChevronRight, Sparkles, Loader2, Send,
  ArrowRight, Target, Users,
  MapPin, PawPrint, Heart, Shield, Zap, Search,
  Activity, Sun, CloudRain, Thermometer
} from 'lucide-react';

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

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING PRODUCTS SECTION - Like Advisory's "Care Products" (with category tabs)
// ═══════════════════════════════════════════════════════════════════════════════
const TRAINING_CATEGORIES = [
  { id: 'all', name: 'All Products', icon: Star },
  { id: 'training', name: 'Training Tools', icon: Target },
  { id: 'puzzles', name: 'Puzzles & Enrichment', icon: Brain },
  { id: 'books', name: 'Books & Guides', icon: GraduationCap },
  { id: 'treats', name: 'Training Treats', icon: Heart }
];

const TrainingProductsSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart } = useCart();
  
  useEffect(() => {
    fetchTrainingProducts();
  }, []);
  
  const fetchTrainingProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/learn/products?limit=20`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch training products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price || 999,
      quantity: 1,
      image_url: product.image_url || product.image,
      pillar: 'learn'
    });
    toast({
      title: "Added to cart",
      description: product.name,
    });
    setSelectedProduct(null);
  };
  
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        switch(activeCategory) {
          case 'training': return name.includes('clicker') || name.includes('train') || name.includes('leash') || name.includes('pouch');
          case 'puzzles': return name.includes('puzzle') || name.includes('interactive') || name.includes('enrichment');
          case 'books': return name.includes('book') || name.includes('guide') || desc.includes('guide');
          case 'treats': return name.includes('treat') || name.includes('snack');
          default: return true;
        }
      });
  
  if (loading) {
    return (
      <section className="py-10 bg-gradient-to-b from-white to-amber-50/30">
        <div className="max-w-6xl mx-auto px-4 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </section>
    );
  }
  
  return (
    <section className="py-10 bg-gradient-to-b from-white to-amber-50/30" data-testid="training-products-section">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">Training Products</h2>
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TRAINING_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-amber-50 border border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.name}
              </button>
            );
          })}
        </div>
        
        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.slice(0, 10).map((product, idx) => (
            <Card 
              key={product.id || idx}
              className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                {product.image_url || product.image ? (
                  <img 
                    src={product.image_url || product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <GraduationCap className="w-12 h-12 text-amber-200" />
                  </div>
                )}
                {product.compare_price && product.compare_price > product.price && (
                  <Badge className="absolute top-2 right-2 bg-green-500 text-white text-xs">
                    {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                  </Badge>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{product.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-amber-600 font-bold">₹{product.price}</span>
                  {product.compare_price && product.compare_price > product.price && (
                    <span className="text-gray-400 text-xs line-through">₹{product.compare_price}</span>
                  )}
                </div>
                {product.paw_reward_points && (
                  <p className="text-xs text-gray-500 mt-1">+{product.paw_reward_points} paw points</p>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        {/* View More */}
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={() => window.location.href = '/shop?pillar=learn'}
          >
            View All Training Products <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
      
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedProduct(null)}
        >
          <Card 
            className="bg-white max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative">
              {(selectedProduct.image || selectedProduct.image_url) ? (
                <img 
                  src={selectedProduct.image || selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-56 object-cover"
                />
              ) : (
                <div className="w-full h-56 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <GraduationCap className="w-16 h-16 text-amber-300" />
                </div>
              )}
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <div className="p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
              <p className="text-gray-600 text-sm mb-4">{selectedProduct.description}</p>
              
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-amber-600">₹{selectedProduct.price}</span>
                {selectedProduct.compare_price && selectedProduct.compare_price > selectedProduct.price && (
                  <>
                    <span className="text-gray-400 line-through">₹{selectedProduct.compare_price}</span>
                    <Badge className="bg-green-100 text-green-700">
                      {Math.round((1 - selectedProduct.price / selectedProduct.compare_price) * 100)}% off
                    </Badge>
                  </>
                )}
              </div>
              
              {selectedProduct.paw_reward_points && (
                <p className="text-sm text-amber-600 mb-4 flex items-center gap-1">
                  <PawPrint className="w-4 h-4" />
                  Earn {selectedProduct.paw_reward_points} paw points
                </p>
              )}
              
              <Button 
                onClick={() => handleAddToCart(selectedProduct)}
                className="w-full bg-amber-500 hover:bg-amber-600"
                size="lg"
              >
                Add to Cart - ₹{selectedProduct.price}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </section>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT CMS CONFIG - Used as fallback if CMS returns empty
// ═══════════════════════════════════════════════════════════════════════════════
const DEFAULT_TOPICS = [
  { id: '1', slug: 'puppy-basics', title: 'Puppy Basics', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/93c239031e6456380de0efe5eb0dc4f6c5b0c024dd4773902b6e0c573190b1d8.png', description: 'New puppy checklists, routines, and training guides' },
  { id: '2', slug: 'breed-guides', title: 'Breed Guides', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/b19ce463f91811f725efcf22558df9a370147e238e79f810d6f6f25776b03144.png', description: 'Understand the unique traits of different dog breeds' },
  { id: '3', slug: 'food-feeding', title: 'Food & Feeding', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/5b1a4488a31b3aba09ebc15dd55c6155cee07f252d937530af9763ce6122ed48.png', description: 'Nutrition advice, feeding schedules, and diet tips' },
  { id: '4', slug: 'grooming', title: 'Grooming', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/2aeee0fe285e7f4bf9b0695c92778e425922cb62c68d06f1fe8fdc33715f7aac.png', description: 'Grooming tips, coat care, and brushing guides' },
  { id: '5', slug: 'behavior', title: 'Behavior', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/22b2a63c7ce6c1bf271784616d997150b922e72b42f23b0b0dea6354151c556b.png', description: 'Behavioral issues, training tips, and calming advice' },
  { id: '6', slug: 'training-basics', title: 'Training Basics', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/3e9d2387a56550d68b8a4694f20654d13cb537ecee01b51b0f2cd396ecc09efd.png', description: 'Training fundamentals, tips, and obedience guides' },
  { id: '7', slug: 'travel-with-dogs', title: 'Travel with Dogs', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/9b35a1a9ed5767659671cda04fc117a5abeafb2693411704164c5b37a1062ffe.png', description: 'Travel tips, safety advice, and gear recommendations' },
  { id: '8', slug: 'senior-dog-care', title: 'Senior Dog Care', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/d9d9ebf8fe66ddcef4c455dbe5001f6143ef5b0c6ddf6e61689713ea03d13ec2.png', description: 'Senior dog health, comfort, and activity tips' },
  { id: '9', slug: 'health-basics', title: 'Health Basics', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/c693f115f02adac326f5e6bb07378e3636c4a2774096c30b532317a65464632d.png', description: 'General health care, first aid, and wellness advice' },
  { id: '10', slug: 'rescue-indie-care', title: 'Rescue / Indie Care', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/87e1b52ec6d6ab336a68adcea43c4a143f8de59d3cd2824e64e2c3fd9614441a.png', description: 'Adoption, indie-breed tips, and rehabilitation guides' },
  { id: '11', slug: 'seasonal-care', title: 'Seasonal Care', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/1e5c1f02a009891fbcef1a3e1004e6f1dfe7201bafd892ee8c1d026697842455.png', description: 'Weather care tips for summer, winter, and beyond' },
  { id: '12', slug: 'new-pet-parent-guide', title: 'New Pet Parent Guide', image: 'https://static.prod-images.emergentagent.com/jobs/cc753d4b-8b64-48e8-aae2-bb0326d8de1c/images/484b7ec0a72919db7f6137f25033184bea6787c2ccb296ffb23544249b6ae7a4.png', description: 'Starting out with a new dog or puppy in your home' }
];

const DEFAULT_DAILY_TIPS = [
  { tip: "Dogs learn best in short 5-minute sessions. Three short sessions beat one long one every time.", category: "Training", color: "from-blue-500 to-indigo-500" },
  { tip: "A tired dog is a well-behaved dog. Mental stimulation (puzzle toys, nose work) tires them faster than physical exercise.", category: "Behavior", color: "from-purple-500 to-pink-500" },
  { tip: "Consistency matters more than intensity. Use the same words, same tone, same rewards every single time.", category: "Training", color: "from-teal-500 to-emerald-500" },
  { tip: "Your dog's breed affects how they learn. Hounds follow their nose, herders want a job, terriers need variety.", category: "Breed Tips", color: "from-amber-500 to-orange-500" },
  { tip: "Socialization window closes at 14 weeks. Expose puppies to different sounds, surfaces, people, and gentle dogs early.", category: "Puppy", color: "from-pink-500 to-rose-500" },
  { tip: "If your dog is pulling on leash, stop walking. They learn that pulling = no movement. Loose leash = we go.", category: "Walking", color: "from-green-500 to-teal-500" },
  { tip: "Never punish a dog who comes to you — even if they just did something wrong. Coming to you should always be positive.", category: "Recall", color: "from-indigo-500 to-blue-500" },
];

const DEFAULT_HELP_BUCKETS = [
  { id: '1', title: 'Products & Routines', icon: 'Award', color: 'amber', items: ['Help me choose the right products', 'Build a routine for my dog', 'Help me with grooming choices'] },
  { id: '2', title: 'Life Stage & Care', icon: 'PawPrint', color: 'teal', items: ['Guide me for my puppy', 'Help me with senior dog care', 'Recommend what suits my breed'] },
  { id: '3', title: 'Support & Services', icon: 'Users', color: 'violet', items: ['Find the right trainer', 'Help me prepare for travel', 'Find help near me'] }
];

const LearnPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/learn/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: 'What would you like to learn about {petName} today?',
    subtitle: 'Expert guides, training tips, and resources',
    askMira: {
      enabled: true,
      placeholder: 'Grooming guide for double coats · tips to stop barking',
      buttonColor: 'bg-teal-500'
    },
    sections: {
      askMira: { enabled: true },
      topics: { enabled: true },
      dailyTip: { enabled: true },
      helpBuckets: { enabled: true },
      learnForPet: { enabled: true },
      bundles: { enabled: true },
      products: { enabled: true },
      services: { enabled: true },
      personalized: { enabled: true }
    }
  });
  const [cmsTopics, setCmsTopics] = useState([]);
  const [cmsDailyTips, setCmsDailyTips] = useState([]);
  const [cmsHelpBuckets, setCmsHelpBuckets] = useState([]);
  
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

  const [selectedTopic, setSelectedTopic] = useState(null);
  const [expandedLearnTip, setExpandedLearnTip] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  
  // Use global pet context
  const { currentPet } = usePillarContext();
  const activePet = currentPet || selectedPet;
  
  // Topic Hub Modal state
  const [askMiraQuestion, setAskMiraQuestion] = useState('');
  const [askMiraResponse, setAskMiraResponse] = useState(null);
  const [askMiraLoading, setAskMiraLoading] = useState(false);
  const [showAskMira, setShowAskMira] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES - Topics, Daily Tips with fallback to defaults
  // ═══════════════════════════════════════════════════════════════════════════════
  const topics = cmsTopics.length > 0 ? cmsTopics : DEFAULT_TOPICS;
  const dailyTips = cmsDailyTips.length > 0 ? cmsDailyTips : DEFAULT_DAILY_TIPS;
  const helpBuckets = cmsHelpBuckets.length > 0 ? cmsHelpBuckets : DEFAULT_HELP_BUCKETS;
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your dog') || 
    `What would you like to learn about ${activePet?.name || 'your dog'} today?`;
  
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
  const [modalContext, setModalContext] = useState(null); // Stores context when opened from Support services

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
    fetchCMSConfig(); // Load CMS configuration
    if (user && token) {
      fetchUserPets();
    }
  }, [user, token]);

  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/learn/page-config`);
      if (response.ok) {
        const data = await response.json();
        // Set config if it exists and has content
        if (data.config && Object.keys(data.config).length > 0) {
          setCmsConfig(prev => ({ ...prev, ...data.config }));
        }
        // Set topics if they exist
        if (data.topics && data.topics.length > 0) {
          setCmsTopics(data.topics);
        }
        // Set daily tips if they exist
        if (data.dailyTips && data.dailyTips.length > 0) {
          setCmsDailyTips(data.dailyTips);
        }
        // Set help buckets if they exist
        if (data.helpBuckets && data.helpBuckets.length > 0) {
          setCmsHelpBuckets(data.helpBuckets);
        }
        console.log('[LearnPage] CMS config loaded:', { 
          hasConfig: !!data.config, 
          topicsCount: data.topics?.length || 0,
          dailyTipsCount: data.dailyTips?.length || 0 
        });
      }
    } catch (error) {
      console.error('Failed to fetch CMS config:', error);
      // Fallback to defaults is automatic via useState defaults
    }
  };

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
    } catch (error) {
      console.error('Failed to fetch learn data:', error);
    } finally {
      setLoading(false);
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
    // Fetch weather for breed-specific seasonal tips
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const wRes = await fetch(`${API_URL}/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          if (wRes.ok) setWeatherData(await wRes.json());
        }, () => {
          fetch(`${API_URL}/api/weather?lat=19.076&lon=72.8777`).then(r => r.json()).then(d => setWeatherData(d)).catch(() => {});
        });
      }
    } catch (e) { /* weather is optional */ }
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
      {/* HERO SECTION: Ask Mira Bar - CMS DRIVEN */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.askMira?.enabled !== false && (
        <section className="py-8 px-4 bg-gradient-to-b from-stone-50 to-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900" data-testid="learn-page-title">
                {pageTitle}
              </h1>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-center bg-white rounded-full border border-gray-200 shadow-sm p-1.5 pl-5">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <Input
                  value={askMiraQuestion}
                  onChange={(e) => setAskMiraQuestion(e.target.value)}
                  placeholder={cmsConfig.askMira?.placeholder || "Grooming guide for double coats · tips to stop barking"}
                  className="flex-1 border-0 focus-visible:ring-0 text-sm placeholder:text-gray-400"
                  onKeyDown={(e) => e.key === 'Enter' && handleAskMira()}
                  data-testid="ask-learn-input"
                />
                <Button
                  onClick={handleAskMira}
                  disabled={askMiraLoading || !askMiraQuestion.trim()}
                  className={`rounded-full ${cmsConfig.askMira?.buttonColor || 'bg-teal-500'} hover:opacity-90 h-10 w-10 p-0`}
                >
                  {askMiraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TOPIC BOXES - CMS DRIVEN (loads from cmsTopics or defaults) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.topics?.enabled !== false && (
        <section className="py-8 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {topics.map((topic) => (
                <Card
                  key={topic.slug || topic.id}
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
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">{topic.description || topic.desc}</p>
                  <button className="flex items-center gap-1 text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors">
                    Explore <ChevronRight className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DAILY LEARNING TIP - CMS DRIVEN - Dynamic content that changes every day */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.dailyTip?.enabled !== false && (() => {
        const today = new Date();
        const dayIndex = today.getDate() % dailyTips.length;
        const todaysTip = dailyTips[dayIndex];
        // Map category to icon
        const categoryIcons = {
          'Training': GraduationCap,
          'Behavior': Brain,
          'Breed Tips': Star,
          'Puppy': Heart,
          'Walking': Activity,
          'Recall': Shield,
          'default': Sparkles
        };
        const TipIcon = categoryIcons[todaysTip.category] || categoryIcons.default;
        
        return (
          <div className="py-6 px-4">
            <div className="max-w-5xl mx-auto">
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${todaysTip.color || 'from-blue-500 to-indigo-500'} p-5 md:p-6 text-white`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <TipIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Today's Learning Tip</span>
                      <span className="text-xs text-white/60 ml-auto hidden sm:block">{todaysTip.category}</span>
                    </div>
                    <p className="text-sm md:text-base font-medium leading-relaxed" data-testid="daily-learning-tip">
                      {todaysTip.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HOW CAN WE HELP? - CMS DRIVEN - 3 Action Buckets */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.helpBuckets?.enabled !== false && (
        <section className="py-10 px-4 bg-stone-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">How can we help?</h2>
              <p className="text-gray-600 mt-1">Choose what matters most to you right now</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {helpBuckets.map((bucket, idx) => {
                // Map icon names to components
                const iconMap = { Award, PawPrint, Users, Heart, Star, GraduationCap, Shield, Brain };
                const BucketIcon = iconMap[bucket.icon] || Award;
                const colorMap = {
                  'amber': { bg: 'bg-gradient-to-br from-amber-50 to-orange-50', border: 'border-amber-100', icon: 'bg-amber-100', iconColor: 'text-amber-600', dot: 'bg-amber-400' },
                  'teal': { bg: 'bg-gradient-to-br from-teal-50 to-emerald-50', border: 'border-teal-100', icon: 'bg-teal-100', iconColor: 'text-teal-600', dot: 'bg-teal-400' },
                  'violet': { bg: 'bg-gradient-to-br from-violet-50 to-purple-50', border: 'border-violet-100', icon: 'bg-violet-100', iconColor: 'text-violet-600', dot: 'bg-violet-400' },
                  'blue': { bg: 'bg-gradient-to-br from-blue-50 to-indigo-50', border: 'border-blue-100', icon: 'bg-blue-100', iconColor: 'text-blue-600', dot: 'bg-blue-400' },
                  'pink': { bg: 'bg-gradient-to-br from-pink-50 to-rose-50', border: 'border-pink-100', icon: 'bg-pink-100', iconColor: 'text-pink-600', dot: 'bg-pink-400' }
                };
                const colors = colorMap[bucket.color] || colorMap.amber;
                
                return (
                  <Card 
                    key={bucket.id || idx}
                    className={`p-5 ${colors.bg} ${colors.border} rounded-2xl cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openMiraAI', {
                        detail: { message: bucket.items?.join(', ') || bucket.title, context: 'learn', pillar: 'learn' }
                      }));
                    }}
                    data-testid={`help-bucket-${idx}`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${colors.icon} flex items-center justify-center`}>
                        <BucketIcon className={`w-5 h-5 ${colors.iconColor}`} />
                      </div>
                      <h3 className="font-semibold text-gray-900">{bucket.title}</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600">
                      {(bucket.items || []).map((item, itemIdx) => (
                        <li key={itemIdx} className="flex items-center gap-2">
                          <span className={`w-1 h-1 ${colors.dot} rounded-full`} />{item}
                        </li>
                      ))}
                    </ul>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Old sections removed - using new 12 Topic Boxes above */}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LEARN FOR MY DOG - Personalized Content with real inline advice */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {(activePet || userPets?.[0]) && (() => {
        const pet = activePet || userPets?.[0];
        const petName = pet?.name || 'Your Pet';
        const breed = pet?.breed || '';
        const isSenior = pet?.age_months > 84;
        const isPuppy = pet?.age_months < 12;
        
        const personalizedTips = isSenior ? [
          { icon: GraduationCap, color: 'text-blue-600 bg-blue-100', label: `Training tips for senior ${breed || 'dogs'}`, advice: `Senior ${breed || 'dogs'} respond best to short, positive sessions. Focus on mental stimulation over physical — puzzle feeders, nose work, and gentle obedience refreshers. Avoid jumping or high-impact activities. Use extra-soft treats and be patient with slower responses.` },
          { icon: Sparkles, color: 'text-amber-600 bg-amber-100', label: 'Gentle grooming guide', advice: `Seniors need extra-gentle grooming. Use soft-bristle brushes and warm water baths. Check for lumps, skin changes, or sore spots during every session. Keep nails short to prevent slipping. Massage while brushing — it helps circulation and comfort.` },
          { icon: Heart, color: 'text-rose-600 bg-rose-100', label: 'Senior nutrition basics', advice: `Senior dogs need fewer calories but higher quality protein. Consider joint supplements (glucosamine, fish oil). Feed 2 smaller meals instead of 1 large one. Watch for weight changes — even 500g matters. Warm food slightly to enhance aroma for fussy eaters.` },
          { icon: Activity, color: 'text-teal-600 bg-teal-100', label: 'Low-impact exercise', advice: `Two short walks (15-20 min each) are better than one long walk. Swimming is excellent low-impact exercise. Sniff walks provide mental enrichment without strain. Avoid extreme heat or cold. Watch for limping, panting, or reluctance — these signal it's time to rest.` }
        ] : isPuppy ? [
          { icon: GraduationCap, color: 'text-blue-600 bg-blue-100', label: `Puppy training for ${breed || 'your pup'}`, advice: `Start with name recognition, sit, and come. Keep sessions under 5 minutes — puppies have short attention spans. Use high-value tiny treats. Always end on a positive note. Socialization window closes at 14 weeks — expose to different sounds, surfaces, and gentle people.` },
          { icon: Sparkles, color: 'text-amber-600 bg-amber-100', label: 'Puppy grooming basics', advice: `Start handling paws, ears, and mouth gently from day one — this makes future grooming easy. First bath at 8-10 weeks with puppy shampoo. Brush daily for 2 minutes. Make every grooming touch a positive experience with treats. Introduce nail clipping gradually.` },
          { icon: Heart, color: 'text-rose-600 bg-rose-100', label: 'Puppy nutrition guide', advice: `Feed 3-4 small meals daily until 3 months, then 3 meals until 6 months, then 2 meals. Use puppy-specific food (higher protein and fat). Don't free-feed — scheduled meals help with toilet training. Fresh water always available. Avoid table scraps — some human foods are toxic.` },
          { icon: Activity, color: 'text-teal-600 bg-teal-100', label: 'Play and exercise', advice: `Rule of thumb: 5 minutes of exercise per month of age, twice daily. A 3-month puppy gets 15 minutes. Focus on play, not forced walks. Tug, fetch, and puzzle toys build bonds. Avoid stairs, jumping, or long walks until growth plates close (12-18 months for most breeds).` }
        ] : [
          { icon: GraduationCap, color: 'text-blue-600 bg-blue-100', label: `Training tips for ${breed || 'your dog'}`, advice: `Consistency is everything. Use the same commands, same hand signals. Practice in different locations to generalize learning. ${breed ? `${breed}s are typically intelligent and respond well to positive reinforcement.` : 'Every dog learns at their own pace.'} Keep sessions fun and reward-based. Training is bonding time, not boot camp.` },
          { icon: Sparkles, color: 'text-amber-600 bg-amber-100', label: 'Grooming guide', advice: `Brush ${breed ? `your ${breed}` : 'your dog'} 2-3 times weekly minimum. Check ears weekly for redness or odor. Trim nails every 2-4 weeks. Bath every 4-8 weeks unless dirty. Brush teeth 3 times weekly with dog toothpaste. Regular grooming helps you spot health issues early.` },
          { icon: Heart, color: 'text-rose-600 bg-rose-100', label: 'Nutrition basics', advice: `Feed a balanced diet appropriate for ${breed ? `${breed}s` : 'your dog\'s'} age and size. Adults need 2 meals per day. Measure portions — don't free-feed. Treats should be max 10% of daily calories. Good treat options: carrots, apple slices (no seeds), boiled chicken. Always have fresh water available.` },
          { icon: Activity, color: 'text-teal-600 bg-teal-100', label: 'Exercise recommendations', advice: `${breed ? `${breed}s typically need` : 'Most dogs need'} 30-60 minutes of exercise daily. Mix walks with play and mental stimulation. Sniff walks are great for mental enrichment. Puzzle feeders, training sessions, and nose work count as exercise too. Watch for signs of fatigue — heavy panting, lagging behind, lying down.` }
        ];
        
        return (
          <div id="my-dog" className="py-12 bg-gradient-to-br from-pink-50/50 via-white to-purple-50/50">
            <div className="max-w-6xl mx-auto px-4">
              <Card className="p-6 md:p-8 bg-white/95 backdrop-blur rounded-3xl border-0 shadow-xl overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1" data-testid="learn-for-pet-heading">
                      Learn for {petName}
                    </h2>
                    <p className="text-gray-500 text-sm mb-6">
                      Advice picked just for your {breed || 'Indie'} — tap to read
                    </p>
                    
                    <div className="space-y-3">
                      {personalizedTips.map((tip, idx) => (
                        <div key={idx}>
                          <button
                            onClick={() => setExpandedLearnTip(expandedLearnTip === idx ? null : idx)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left group ${
                              expandedLearnTip === idx 
                                ? 'bg-gradient-to-r from-pink-50 to-purple-50 shadow-sm' 
                                : 'bg-gray-50 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50'
                            }`}
                            data-testid={`learn-for-pet-tip-${idx}`}
                          >
                            <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${tip.color} transition-transform group-hover:scale-110`}>
                              <tip.icon className="w-5 h-5" />
                            </span>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{tip.label}</span>
                            <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${expandedLearnTip === idx ? 'rotate-90 text-teal-500' : 'group-hover:text-teal-500'}`} />
                          </button>
                          {expandedLearnTip === idx && (
                            <div className="mt-2 ml-4 p-4 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl border border-teal-100 animate-in slide-in-from-top-2">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-teal-700 mb-1">Mira's Advice for {petName}</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{tip.advice}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-72 flex-shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-full blur-3xl opacity-40" />
                      <img 
                        src={getPetPhotoUrl(pet)}
                        alt={petName}
                        className="relative w-full aspect-square object-cover rounded-full border-4 border-white shadow-lg"
                        style={{ filter: 'saturate(0.9) contrast(1.05)' }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* BREED SPOTLIGHT + WEATHER ALERT - Dynamic, personalized */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {(activePet || userPets?.[0]) && (() => {
        const pet = activePet || userPets?.[0];
        const petName = pet?.name || 'Your Pet';
        const breed = pet?.breed || 'Indie';
        const isSenior = pet?.age_months > 84;
        const isPuppy = pet?.age_months < 12;
        const ageLabel = isPuppy ? 'puppy' : isSenior ? 'senior' : 'adult';
        
        // Breed fun facts
        const breedFacts = {
          'Indie': [
            'Indies are one of the oldest dog breeds, naturally evolved for India\'s climate',
            'They have exceptional immune systems and are less prone to genetic disorders',
            'Indies are highly intelligent and learn tricks faster than many purebreds',
            'Their short coat makes grooming easy — 5 minutes of brushing 2x a week is enough'
          ],
          'default': [
            `${breed}s are known for their loyalty and intelligence`,
            `Regular mental stimulation is key for ${breed}s — they thrive on learning new things`,
            `${breed}s benefit from a consistent daily routine more than most breeds`,
            `Social interaction with other dogs helps ${breed}s stay emotionally balanced`
          ]
        };
        
        const facts = breedFacts[breed] || breedFacts['default'];
        const today = new Date();
        const factIndex = today.getDate() % facts.length;
        
        // Weather-based tips
        const temp = weatherData?.temperature || weatherData?.temp || weatherData?.feels_like;
        const condition = weatherData?.description || weatherData?.condition || '';
        const isHot = temp > 30;
        const isRainy = condition.toLowerCase().includes('rain') || condition.toLowerCase().includes('drizzle');
        const isCold = temp < 15;
        
        let weatherTip = null;
        if (temp) {
          if (isHot) weatherTip = { icon: Thermometer, color: 'text-red-500', bg: 'bg-red-50', text: `It's ${Math.round(temp)}° — avoid walks between 11am-4pm. Check pavement with your hand — if it's too hot for you, it's too hot for ${petName}'s paws.` };
          else if (isRainy) weatherTip = { icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50', text: `Rain expected today — dry ${petName}'s paws and ears after walks to prevent infections. Indoor enrichment games are perfect for rainy days!` };
          else if (isCold) weatherTip = { icon: Thermometer, color: 'text-blue-500', bg: 'bg-blue-50', text: `It's ${Math.round(temp)}° — ${isPuppy ? 'puppies' : isSenior ? 'senior dogs' : 'short-coated dogs'} may need a light jacket. Keep walks shorter and watch for shivering.` };
          else weatherTip = { icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50', text: `${Math.round(temp)}° — Perfect weather for ${petName}! Great day for outdoor training, a long walk, or socialization at the park.` };
        }
        
        return (
          <div className="py-8 px-4" data-testid="breed-spotlight">
            <div className="max-w-5xl mx-auto space-y-4">
              {/* Breed Spotlight Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 p-5 md:p-6 text-white">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/10 rounded-full translate-y-10 -translate-x-10" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <PawPrint className="w-4 h-4" />
                    <span className="text-xs font-medium text-white/80 uppercase tracking-wider">Breed Spotlight</span>
                    <span className="text-xs text-white/60 ml-auto">{breed}</span>
                  </div>
                  <p className="text-sm md:text-base font-medium leading-relaxed" data-testid="breed-fact">
                    {facts[factIndex]}
                  </p>
                </div>
              </div>
              
              {/* Weather Alert Card */}
              {weatherTip && (
                <div className={`rounded-2xl ${weatherTip.bg} border border-gray-100 p-4 md:p-5`}>
                  <div className="flex items-start gap-3">
                    <weatherTip.icon className={`w-6 h-6 ${weatherTip.color} flex-shrink-0 mt-0.5`} />
                    <div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Weather Tip</span>
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed" data-testid="weather-tip">
                        {weatherTip.text}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* GUIDED LEARNING PATHS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div id="guided-paths" className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
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
                topicSlug: 'puppy-basics',
                steps: ['First week at home', 'Toilet training', 'Teething', 'Sleep routine', 'Socialization'],
                color: 'pink'
              },
              { 
                title: 'New Adoption Path', 
                topicSlug: 'rescue-indie-care',
                steps: ['Decompression', 'Trust building', 'First routine', 'Home boundaries', 'Emotional settling'],
                color: 'green'
              },
              { 
                title: 'Senior Dog Path', 
                topicSlug: 'senior-dog-care',
                steps: ['Mobility support', 'Comfort needs', 'Diet adjustments', 'Rest & sleep', 'When to seek help'],
                color: 'purple'
              },
              { 
                title: 'Travel Path', 
                topicSlug: 'travel-with-dogs',
                steps: ['Road trips', 'Crates & carriers', 'Hydration', 'Travel anxiety', 'What to pack'],
                color: 'blue'
              },
              { 
                title: 'Grooming Path', 
                topicSlug: 'grooming',
                steps: ['Coat type guide', 'Brushing basics', 'Bath routine', 'Ears & eyes', 'Nail care'],
                color: 'amber'
              },
              { 
                title: 'Behavior Path', 
                topicSlug: 'behavior',
                steps: ['Chewing', 'Barking', 'Pulling', 'Separation anxiety', 'Enrichment'],
                color: 'indigo'
              }
            ].map((path, idx) => (
              <Card 
                key={idx}
                className="p-5 cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => setSelectedTopic(path.topicSlug)}
                data-testid={`guided-path-${idx}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${path.color}-100`}>
                    <GraduationCap className={`w-5 h-5 text-${path.color}-600`} />
                  </div>
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
      {/* CURATED BUNDLES - Save with handpicked combinations (Advisory-style) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="py-12 bg-gradient-to-br from-rose-50 via-white to-orange-50">
        <div className="max-w-6xl mx-auto px-4">
          {/* Soul Butterfly Bundles Header - matching Advisory */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" />
              {activePet?.name ? `${activePet.name}'s Training` : 'Training'} Bundles
            </h2>
            <p className="text-gray-600 mt-1">Complete training solutions for {activePet?.name || 'your pet'}</p>
          </div>
          <CuratedBundles pillar="learn" maxBundles={3} showTitle={false} /> */}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SOUL PERSONALIZATION SECTION - THE CENTERPIECE */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <SoulPersonalizationSection pillar="learn" />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TRAINING PRODUCTS - Like Advisory's "Care Products" Section */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <TrainingProductsSection />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* RECOMMENDED FOR PET - Personalized Tags Section (Like Advisory) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activePet && (
        <div className="py-8 bg-gradient-to-b from-amber-50/50 to-white">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img 
                src={getPetPhotoUrl(activePet)} 
                alt={activePet.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-md"
              />
              <h2 className="text-2xl font-bold text-gray-900">
                Recommended for {activePet.name}
              </h2>
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-gray-600 mb-6">Items chosen with {activePet.name} in mind</p>
            
            {/* Pet Tags - breed, age, archetype */}
            <div className="flex flex-wrap justify-center gap-3">
              {activePet.breed && (
                <Badge className="bg-white border-2 border-amber-200 text-amber-700 px-4 py-2 text-sm font-medium shadow-sm">
                  {activePet.breed}
                </Badge>
              )}
              {activePet.age && (
                <Badge className="bg-white border-2 border-amber-200 text-gray-700 px-4 py-2 text-sm font-medium shadow-sm">
                  {activePet.age} years old
                </Badge>
              )}
              {activePet.soul_archetype && (
                <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 text-amber-800 px-4 py-2 text-sm font-semibold shadow-sm">
                  {typeof activePet.soul_archetype === 'object' 
                    ? (activePet.soul_archetype.archetype_name || activePet.soul_archetype.primary_archetype || 'Soul')
                    : activePet.soul_archetype}
                </Badge>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PRODUCTS FOR PET'S NEEDS (Advisory-style layout) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section id="products" className="py-8 px-4 bg-gradient-to-b from-amber-50 to-white" data-testid="learn-products-section">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-6 h-6 text-amber-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {activePet?.breed 
                ? `${activePet.breed} Training Products for ${activePet.name}` 
                : `Training Products for ${activePet?.name || 'Your Pet'}`}
            </h2>
          </div>
          
          {/* Products Grid - Beautiful Advisory-style layout with built-in categories */}
          <LearnProductsGrid maxProducts={24} showCategories={true} />
          
          {/* Smart Recommendations */}
          <div className="mt-8">
            <BreedSmartRecommendations pillar="learn" />
          </div>
          
          {/* Archetype Products */}
          <div className="mt-8">
            <ArchetypeProducts pillar="learn" maxProducts={8} showTitle={true} /> */}
          </div>
          
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
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PERSONALIZED PICKS - FUN PICKS FOR {PET} - CMS DRIVEN */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {cmsConfig.sections?.personalized?.enabled !== false && (
        <section className="py-8 px-4 bg-gradient-to-b from-white to-teal-50/30" data-testid="learn-personalized-picks">
          <div className="max-w-6xl mx-auto">
            <PersonalizedPicks pillar="learn" maxProducts={8} />
          </div>
        </section>
      )}

      {activePet && (
        <section className="py-10 bg-gradient-to-b from-white to-indigo-50/30" data-testid="learn-soul-layer">
          <div className="max-w-6xl mx-auto px-4 space-y-8">
            <div className="text-center">
              <Badge className="bg-indigo-100 text-indigo-700" data-testid="learn-soul-layer-badge">
                Made for {activePet.name}
              </Badge>
              <h2 className="mt-3 text-3xl font-bold text-slate-900" data-testid="learn-soul-layer-title">
                Training picks shaped for {activePet.name}
              </h2>
              <p className="mt-2 text-sm text-slate-600 md:text-base" data-testid="learn-soul-layer-subtitle">
                This learning layer now carries more of the Pet OS feeling — not just training content, but picks and products tuned to {activePet.name}&rsquo;s breed, soul, and learning rhythm.
              </p>
            </div>

            <div className="rounded-3xl border border-indigo-100 bg-white p-4 sm:p-6">
              {/* <SoulMadeCollection pillar="learn" maxItems={8} showTitle={true} /> */}
            </div>

            <PillarPicksSection pillar="learn" pet={activePet} />
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* SERVICES THAT HELP (SEPARATE SECTION) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div id="services" className="py-12 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
              <GraduationCap className="w-4 h-4" />
              Services That Help
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Expert Support & Training</h2>
            <p className="text-gray-600 mt-2">Professional trainers, groomers, and behavioral specialists</p>
          </div>
          
          {/* Service Category Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Training Consult', icon: Target, iconColor: 'text-blue-600', desc: 'One-on-one guidance' },
              { label: 'Grooming Consult', icon: Sparkles, iconColor: 'text-pink-600', desc: 'Coat care advice' },
              { label: 'Behavior Support', icon: Brain, iconColor: 'text-purple-600', desc: 'Issue resolution' },
              { label: 'Puppy Guidance', icon: PawPrint, iconColor: 'text-amber-600', desc: 'First year support' }
            ].map((service, idx) => (
              <Card 
                key={idx}
                className="p-4 cursor-pointer hover:shadow-lg transition-all bg-white/70 hover:bg-white"
                onClick={() => setShowRequestModal(true)}
                data-testid={`service-card-${idx}`}
              >
                <div className="text-center">
                  <service.icon className={`w-8 h-8 mb-2 ${service.iconColor}`} />
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
            // Map support service IDs to closest LEARN_TYPES key
            const serviceTypeMap = {
              'behavior': 'behavior_modification',
              'training': 'advanced_training',
              'grooming': 'basic_obedience',
              'nutrition_adult': 'basic_obedience',
              'exercise': 'agility',
              'wellness': 'basic_obedience',
              'joint_care': 'basic_obedience',
              'senior_routine': 'basic_obedience',
              'leash_training': 'basic_obedience',
              'nutrition': 'basic_obedience',
              'physiotherapy': 'therapy_training',
              'home_comfort': 'basic_obedience',
              'puppy_basics': 'puppy_training',
              'vet_checkup': 'basic_obedience',
              'nutrition_puppy': 'puppy_training',
              'socialization': 'puppy_training',
              'teething': 'puppy_training',
              'home_setup': 'puppy_training',
            };
            const mappedType = serviceTypeMap[service.id] || 'basic_obedience';
            setRequestForm(prev => ({ 
              ...prev, 
              learn_type: mappedType,
              notes: `Interested in: ${service.title}\n${service.desc}`
            }));
            setModalContext({ title: service.title, desc: service.desc });
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


      {/* Training Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={(open) => {
        setShowRequestModal(open);
        if (!open) setModalContext(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              {modalContext ? modalContext.title : 'Request Training'}
            </DialogTitle>
            {modalContext && (
              <p className="text-sm text-gray-500 mt-1">{modalContext.desc}</p>
            )}
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

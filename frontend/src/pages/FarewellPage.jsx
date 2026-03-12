/**
 * FarewellPage.jsx
 * Compassionate End-of-Life Services for Pets
 * Includes: Memorial services, cremation, hospice care, grief support
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import PillarPageLayout from '../components/PillarPageLayout';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import { ConciergeButton } from '../components/mira-os';
import { ChecklistDownloadButton } from '../components/checklists';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Rainbow, Flower2, Star, Calendar, Phone, Mail, MapPin,
  Clock, ChevronRight, ChevronLeft, Sparkles, Home, CheckCircle, Users,
  MessageCircle, ArrowRight, Book, Camera, Music, Loader2, X, ShoppingCart, Download
} from 'lucide-react';
import RainbowBridgeMemorial from '../components/RainbowBridgeMemorial';
import RainbowBridgeWall from '../components/RainbowBridgeWall';
import SoulMadeCollection from '../components/SoulMadeCollection';
import { PillarSoulLayer } from '../components/PillarSoulLayer';
import CuratedBundles from '../components/CuratedBundles';
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';
import { PillarDailyTip, PillarHelpBuckets } from '../components/PillarGoldSections';
import { usePillarContext } from '../context/PillarContext';
import MiraAdvisorCard from '../components/MiraAdvisorCard';

// Service Categories
const SERVICE_CATEGORIES = {
  hospice: {
    id: 'hospice',
    name: 'Hospice & Palliative Care',
    icon: Heart,
    description: 'Compassionate end-of-life care at home',
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600'
  },
  cremation: {
    id: 'cremation',
    name: 'Cremation Services',
    icon: Flower2,
    description: 'Dignified cremation with various memorial options',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  memorial: {
    id: 'memorial',
    name: 'Memorial Services',
    icon: Rainbow,
    description: 'Celebrate your pet\'s life with a beautiful tribute',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  },
  support: {
    id: 'support',
    name: 'Grief Support',
    icon: Users,
    description: 'Resources and counselling for pet loss',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  }
};

// Service Packages
const SERVICE_PACKAGES = [
  {
    id: 'basic_farewell',
    name: 'Peaceful Farewell',
    price: 4999,
    description: 'Basic cremation service with dignity',
    features: [
      'Individual cremation',
      'Basic urn included',
      'Certificate of cremation',
      'Home pickup available'
    ],
    popular: false
  },
  {
    id: 'loving_tribute',
    name: 'Loving Tribute',
    price: 8999,
    description: 'Complete memorial service package',
    features: [
      'Individual cremation',
      'Premium wooden urn',
      'Paw print impression',
      'Memorial certificate',
      'Home pickup & delivery',
      'Fur clipping keepsake'
    ],
    popular: true
  },
  {
    id: 'eternal_love',
    name: 'Eternal Love',
    price: 14999,
    description: 'Premium celebration of life package',
    features: [
      'Individual cremation',
      'Luxury urn of choice',
      'Professional paw print',
      'Memorial photo session',
      'Personalised memorial video',
      'Memory book',
      'Garden memorial stone',
      '24/7 support',
      'Home pickup & delivery'
    ],
    popular: false
  }
];

const FarewellPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { currentPet } = usePillarContext();
  
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // CMS STATE - Loaded from /api/farewell/page-config
  // ═══════════════════════════════════════════════════════════════════════════════
  const [cmsConfig, setCmsConfig] = useState({
    title: "Honoring {petName}'s memory",
    subtitle: 'End-of-life care, memorials & grief support',
    askMira: {
      enabled: true,
      placeholder: "Cremation services... memorial ideas",
      buttonColor: 'bg-slate-500'
    },
    sections: {
      askMira: { enabled: true },
      miraPrompts: { enabled: true },
      categories: { enabled: true },
      bundles: { enabled: true },
      products: { enabled: true },
      conciergeServices: { enabled: true },
      personalized: { enabled: true }
    }
  });
  const [cmsCategories, setCmsCategories] = useState([]);
  const [cmsConciergeServices, setCmsConciergeServices] = useState([]);
  const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);
  const [cmsHelpBuckets, setCmsHelpBuckets] = useState([]);
  const [cmsDailyTips, setCmsDailyTips] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pets, setPets] = useState([]);
  const [userPets, setUserPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // AI Grief Support State
  const [griefQuery, setGriefQuery] = useState('');
  const [griefResponse, setGriefResponse] = useState('');
  const [griefLoading, setGriefLoading] = useState(false);
  const [showGriefResponse, setShowGriefResponse] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  
  // Use global pet context
  const activePet = currentPet || userPets?.[0];
  
  // Personalize title with pet name
  const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') || 
    `Honoring ${activePet?.name || "your pet"}'s memory`;
  
  // ═══════════════════════════════════════════════════════════════════════════════
  // FETCH CMS CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════════
  const fetchCMSConfig = async () => {
    try {
      const response = await fetch(`${API_URL}/api/farewell/page-config`);
      if (response.ok) {
        const data = await response.json();
        if (data.config && Object.keys(data.config).length > 0) {
          setCmsConfig(prev => ({ ...prev, ...data.config }));
        }
        if (data.categories?.length > 0) {
          setCmsCategories(data.categories);
        }
        if (data.conciergeServices?.length > 0) {
          setCmsConciergeServices(data.conciergeServices);
        }
        if (data.miraPrompts?.length > 0) {
          setCmsMiraPrompts(data.miraPrompts);
        }
        if (data.helpBuckets?.length > 0) {
          setCmsHelpBuckets(data.helpBuckets);
        }
        if (data.dailyTips?.length > 0) {
          setCmsDailyTips(data.dailyTips);
        }
        console.log('[FarewellPage] CMS config loaded');
      }
    } catch (error) {
      console.error('[FarewellPage] Failed to fetch CMS config:', error);
    }
  };

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCMSConfig(); // Load CMS config
  }, []);
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/api/pets`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserPets(data.pets || []);
          }
        } catch (error) {
          console.error('Failed to fetch pets:', error);
        }
      }
    };
    fetchPets();
  }, [token]);
  
  // Add to cart handler
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
    toast({
      title: "Added to Cart 🛒",
      description: `${product.name} has been added to your cart`,
    });
  };
  
  // Service request form
  const [serviceForm, setServiceForm] = useState({
    pet_id: '',
    pet_name: '',
    service_type: '',
    package_id: '',
    preferred_date: '',
    preferred_time: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    special_requests: '',
    urgency: 'planned' // planned, urgent, emergency
  });

  // AI Grief Support Handler - Opens Mira with compassionate context
  const handleGriefSupport = () => {
    if (!griefQuery.trim()) return;
    
    // Open Mira with grief support context
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: griefQuery,
        initialQuery: griefQuery,
        context: 'grief_support',
        pillar: 'farewell',
        pet_name: activePet?.name,
        pet_breed: activePet?.breed,
        compassionate: true
      }
    }));
    
    // Clear input
    setGriefQuery('');
    setShowGriefResponse(false);
  };

  // Farewell Journey Guided Paths - Now fetched from database
  const [farewellPaths, setFarewellPaths] = useState([]);
  const [pathsLoading, setPathsLoading] = useState(true);

  // Icon mapping for dynamic paths
  const ICON_MAP = {
    'Heart': Heart,
    'Star': Star,
    'Rainbow': Rainbow,
    'Flower2': Flower2,
    'Home': Home,
    'Users': Users,
    'CheckCircle': CheckCircle
  };

  // Fetch guided paths from database
  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const response = await fetch(`${API_URL}/api/guided-paths/farewell`);
        if (response.ok) {
          const data = await response.json();
          // Map icon strings to actual components
          const pathsWithIcons = data.paths.map(path => ({
            ...path,
            icon: ICON_MAP[path.icon] || Heart
          }));
          setFarewellPaths(pathsWithIcons);
        }
      } catch (err) {
        console.error('Failed to fetch farewell paths:', err);
      } finally {
        setPathsLoading(false);
      }
    };
    fetchPaths();
  }, []);

  // Fetch user's pets
  useEffect(() => {
    if (token) {
      fetchPets();
    }
  }, [token]);

  // Auto-populate user info in form
  useEffect(() => {
    if (user) {
      setServiceForm(prev => ({
        ...prev,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    }
  }, [user]);

  const fetchPets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPets(data.pets || []);
      }
    } catch (err) {
      console.error('Failed to fetch pets:', err);
    }
  };

  const handleServiceRequest = async () => {
    if (!serviceForm.pet_name || !serviceForm.phone || !serviceForm.email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        ...serviceForm,
        user_email: user?.email,
        package: selectedPackage,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const res = await fetch(`${API_URL}/api/farewell/service-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (res.ok) {
        toast({
          title: '💜 Request Submitted',
          description: 'Our compassionate team will contact you within 2 hours.',
          duration: 6000
        });
        setShowServiceModal(false);
        setServiceForm({
          pet_id: '', pet_name: '', service_type: '', package_id: '',
          preferred_date: '', preferred_time: '', address: '', city: '',
          phone: '', email: user?.email || '', special_requests: '', urgency: 'planned'
        });
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Could not submit request. Please call us directly.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const openServiceModal = (pkg) => {
    setSelectedPackage(pkg);
    setServiceForm(prev => ({
      ...prev,
      package_id: pkg.id,
      email: user?.email || ''
    }));
    setShowServiceModal(true);
  };

  return (
    <PillarPageLayout
      pillar="farewell"
      title="Farewell - Memorial Services | The Doggy Company"
      description="Compassionate end-of-life services. Support with dignity and care."
    >
      {/* ═══════════════════════════════════════════════════════════════════════════════
          FAREWELL TOPIC CARDS - Quick access to memorial categories
          End-of-Life Care, Cremation, Memorials, Grief Support
          ═══════════════════════════════════════════════════════════════════════════════ */}
      <PillarTopicsGrid
        pillar="farewell"
        topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.farewell}
        columns={4}
      />

      {/* ════════════════════════════════════════════════════════════════════
          3. DAILY FAREWELL TIP + 4. HOW CAN WE HELP
          Gold Standard sections (Guided Paths already below)
          ════════════════════════════════════════════════════════════════════ */}
      <PillarDailyTip
        tips={cmsDailyTips.length > 0 ? cmsDailyTips : [
          { category: 'Grief Support', tip: 'Grieving a pet is real grief. Research shows pet loss can be as intense as losing a family member. Be kind to yourself during this time.', icon: 'Heart', color: 'from-slate-500 to-gray-600' },
          { category: 'End-of-Life Care', tip: 'Ask your vet about home visits for final appointments. A peaceful, familiar environment can make a profound difference for your pet and family.', icon: 'Home', color: 'from-gray-600 to-slate-700' },
          { category: 'Memorial Ideas', tip: 'A paw print casting or a small tree planted in memory are meaningful tributes that keep your pet\'s presence alive in your home or garden.', icon: 'Star', color: 'from-slate-600 to-gray-700' },
          { category: 'Quality of Life', tip: 'When assessing quality of life, focus on more good days than bad. Ask yourself: Is your pet still enjoying the things they love most?', icon: 'Shield', color: 'from-gray-500 to-slate-600' },
          { category: 'Cremation Options', tip: 'There are two types of cremation: individual (ashes returned to you) and communal (shared). Ask your vet to explain both before making a decision.', icon: 'Clipboard', color: 'from-slate-500 to-gray-500' },
          { category: 'Children & Grief', tip: 'Be honest with children about pet loss. Research shows honest, age-appropriate conversations lead to healthier emotional processing than euphemisms.', icon: 'Users', color: 'from-gray-600 to-slate-700' },
          { category: 'Rainbow Bridge', tip: 'Many pet owners find community in grief groups, both in-person and online. You are not alone. Others understand the depth of what you\'re experiencing.', icon: 'PawPrint', color: 'from-indigo-500 to-slate-600' },
        ]}
        tipLabel="Today's Compassionate Tip"
      />

      <PillarHelpBuckets
        pillar="farewell"
        buckets={cmsHelpBuckets.length > 0 ? cmsHelpBuckets : [
          { id: 'grief', title: 'Grief Support', icon: 'Heart', color: 'indigo', items: ['One-on-one counselling', 'Grief support groups', 'Processing resources', 'Talking to children'] },
          { id: 'services', title: 'End-of-Life Services', icon: 'Star', color: 'violet', items: ['Home vet visits', 'Cremation options', 'Burial services', 'Memorial packages'] },
          { id: 'memories', title: 'Create a Memorial', icon: 'Award', color: 'purple', items: ['Paw print kits', 'Photo albums', 'Memorial gardens', 'Custom portraits'] },
        ]}
      />

      {/* 24/7 Support Banner - Below Hero */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              <span className="text-sm">24/7 Compassionate Support: <strong>+91 98765 43210</strong></span>
            </div>
            <div className="flex gap-3">
              <Button 
                size="sm"
                onClick={() => setShowServiceModal(true)}
                className="bg-white text-purple-700 hover:bg-white/90"
                data-testid="farewell-get-support-btn"
              >
                <Heart className="w-4 h-4 mr-1" />
                Get Support
              </Button>
              <Button 
                size="sm"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10"
                onClick={() => document.getElementById('packages').scrollIntoView({ behavior: 'smooth' })}
              >
                View Services
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Rainbow Bridge Memorial Section - For Mystique 💜 */}
      <section className="py-12 px-4 bg-gradient-to-b from-slate-900 to-purple-950/50">
        <div className="max-w-6xl mx-auto">
          <RainbowBridgeMemorial />
        </div>
      </section>

      {/* Public Memorial Wall - Community Tributes */}
      <section className="py-12 px-4 bg-gradient-to-b from-purple-950/50 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <RainbowBridgeWall />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          AI GRIEF SUPPORT - Compassionate chat
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4 bg-gradient-to-b from-slate-900 to-purple-900/50" data-testid="grief-support-section">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 bg-white/10 backdrop-blur-sm border-purple-400/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-600/30 rounded-full">
                <Heart className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">You're Not Alone</h3>
                <p className="text-purple-200 text-sm">Share what's on your heart. I'm here to listen.</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="How are you feeling? What would help right now?"
                value={griefQuery}
                onChange={(e) => setGriefQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleGriefSupport()}
                className="flex-1 bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300"
                data-testid="grief-support-input"
              />
              <Button 
                onClick={handleGriefSupport}
                disabled={!griefQuery.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Ask Mira
              </Button>
            </div>
            
            <p className="text-xs text-purple-300 mt-2 text-center">
              Powered by Mira AI - compassionate support when you need it
            </p>
          </Card>
          
          {/* Download Rainbow Bridge Guide */}
          <div className="mt-4 flex justify-center">
            <ChecklistDownloadButton 
              pillar="farewell" 
              variant="outline"
              className="border-purple-400 text-purple-300 hover:bg-purple-800/50"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          FAREWELL JOURNEY PATHS - Guided support through grief
          ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 px-4 bg-gradient-to-b from-purple-900/50 to-slate-900" data-testid="farewell-paths-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">Your Farewell Journey</h2>
            <p className="text-purple-200 mt-2">Gentle guidance for wherever you are in this process</p>
          </div>
          
          {pathsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farewellPaths.map((path) => {
                const Icon = path.icon;
                const isExpanded = selectedPath === path.id;
                return (
                  <Card 
                    key={path.id}
                    className={`p-4 cursor-pointer transition-all bg-white/5 backdrop-blur-sm border-purple-400/20 hover:border-purple-400/50 ${
                      isExpanded ? 'ring-2 ring-purple-400' : ''
                    }`}
                    onClick={() => setSelectedPath(isExpanded ? null : path.id)}
                    data-testid={`farewell-path-${path.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${path.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{path.title}</h3>
                        <p className="text-purple-200 text-sm">{path.description}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-purple-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-purple-400/20">
                        <div className="space-y-3">
                          {path.steps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-white">{step.title}</h4>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {step.items.map((item, i) => (
                                    <Badge key={i} variant="outline" className="text-xs bg-purple-600/10 border-purple-400/30 text-purple-200">
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowServiceModal(true);
                          }}
                          className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Get Support for This Step
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <PillarSoulLayer
        pillar="farewell"
        activePet={activePet}
        title={`In memory of ${activePet?.name || 'your pet'}`}
        subtitle={`A gentler memorial layer for ${activePet?.name || 'your pet'} — soul-aware support and recommendations that honour memory with care.`}
        maxProducts={4}
      />

      {/* Service Categories - 2x2 on mobile, 4 cols on desktop */}
      <section className="py-12 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">How Can We Help?</h2>
            <p className="text-gray-600 mt-2">Click any service to connect with our compassionate team</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {Object.values(SERVICE_CATEGORIES).map((cat) => {
              const Icon = cat.icon;
              return (
                <Card 
                  key={cat.id}
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-purple-400 ${
                    selectedCategory === cat.id ? 'ring-2 ring-purple-500 shadow-lg' : ''
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setServiceForm(prev => ({
                      ...prev,
                      service_type: cat.id
                    }));
                    setShowServiceModal(true);
                  }}
                  data-testid={`service-category-${cat.id}`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${cat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{cat.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{cat.description}</p>
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setServiceForm(prev => ({
                        ...prev,
                        service_type: cat.id
                      }));
                      setShowServiceModal(true);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Talk to Concierge
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Packages */}
      <section id="packages" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              <Flower2 className="w-8 h-8 inline mr-2 text-purple-600" />
              Memorial Service Packages
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each package is designed with love and respect to honour your beloved companion.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {SERVICE_PACKAGES.map((pkg) => (
              <Card 
                key={pkg.id} 
                className={`relative overflow-hidden transition-all hover:shadow-xl ${
                  pkg.popular ? 'ring-2 ring-purple-500 shadow-lg' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    Most Chosen
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-purple-600">₹{pkg.price.toLocaleString()}</span>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    onClick={() => openServiceModal(pkg)}
                    className={`w-full ${
                      pkg.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                        : 'bg-purple-600 hover:bg-purple-700'
                    } text-white`}
                    data-testid={`select-package-${pkg.id}`}
                  >
                    Select Package
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Grief Support Resources */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="p-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Grief Support & Resources
                </h2>
                <p className="text-gray-600 mb-6">
                  Losing a pet is losing family. We&apos;re here to support you through this difficult time with compassionate resources and understanding.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">24/7 Support Line</h4>
                      <p className="text-sm text-gray-600">Talk to someone who understands</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Pet Loss Support Group</h4>
                      <p className="text-sm text-gray-600">Connect with others who understand</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Book className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Helpful Resources</h4>
                      <p className="text-sm text-gray-600">Articles, guides & healing activities</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="inline-block p-6 bg-white rounded-2xl shadow-lg">
                  <Rainbow className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 mb-2">
                    &quot;Until we meet again at the Rainbow Bridge&quot;
                  </p>
                  <p className="text-sm text-gray-600">
                    Your love lives on forever in the memories you shared.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* === CONCIERGE® SERVICES - No pricing, just contact concierge === */}
      <ServiceCatalogSection 
        pillar="farewell"
        title="Compassionate Support"
        subtitle="Our concierge team is here to guide you through this difficult time"
        maxServices={4}
        hidePrice={true}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SOUL MADE PRODUCTS - Full AI-generated memorial collection */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 px-4 bg-gradient-to-b from-white to-purple-50" data-testid="farewell-soul-made-section">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Memorial Keepsakes</h2>
            <p className="text-gray-600">Beautiful ways to preserve the memory of your beloved companion</p>
          </div>
          <SoulMadeCollection
            pillar="farewell"
            maxItems={12}
            showTitle={false}
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CURATED BUNDLES - Memorial bundles with savings */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <CuratedBundles pillar="farewell" showTitle={true} />
        </div>
      </section>

      {/* Service Request Modal */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-500" />
              {selectedPackage ? `Request ${selectedPackage.name}` : 
               serviceForm.service_type && SERVICE_CATEGORIES[serviceForm.service_type] 
                 ? `${SERVICE_CATEGORIES[serviceForm.service_type].name}` 
                 : 'Request Support'}
            </DialogTitle>
            <DialogDescription>
              {serviceForm.service_type && SERVICE_CATEGORIES[serviceForm.service_type]
                ? SERVICE_CATEGORIES[serviceForm.service_type].description
                : 'We\'ll handle everything with care and compassion.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Service Type Display (if selected from category cards) */}
            {serviceForm.service_type && SERVICE_CATEGORIES[serviceForm.service_type] && !selectedPackage && (
              <div className={`p-3 rounded-lg ${SERVICE_CATEGORIES[serviceForm.service_type].bgColor} border`}>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = SERVICE_CATEGORIES[serviceForm.service_type].icon;
                    return <Icon className={`w-5 h-5 ${SERVICE_CATEGORIES[serviceForm.service_type].textColor}`} />;
                  })()}
                  <div>
                    <p className={`font-medium ${SERVICE_CATEGORIES[serviceForm.service_type].textColor}`}>
                      {SERVICE_CATEGORIES[serviceForm.service_type].name}
                    </p>
                    <p className="text-xs text-gray-600">Our team will guide you through the process</p>
                  </div>
                </div>
              </div>
            )}

            {/* Urgency Selection */}
            <div>
              <Label>How urgent is this?</Label>
              <div className="flex gap-2 mt-2">
                {[
                  { value: 'planned', label: 'Planned', color: 'bg-gray-100' },
                  { value: 'urgent', label: 'Within 24hrs', color: 'bg-amber-100' },
                  { value: 'emergency', label: 'Emergency', color: 'bg-red-100' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setServiceForm({...serviceForm, urgency: opt.value})}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      serviceForm.urgency === opt.value 
                        ? 'bg-purple-600 text-white' 
                        : `${opt.color} text-gray-700 hover:opacity-80`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Pet Selection - Works for both logged in and guest users */}
            <div>
              <Label className="mb-2">Your Pet&apos;s Details</Label>
              {pets.length > 0 ? (
                <>
                <Select 
                  value={serviceForm.pet_id}
                  onValueChange={v => {
                    const pet = pets.find(p => p.id === v);
                    setServiceForm({
                      ...serviceForm, 
                      pet_id: v,
                      pet_name: v === 'other' ? '' : (pet?.name || '')
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map(pet => (
                      <SelectItem key={pet.id} value={pet.id}>
                        🐾 {pet.name} ({pet.breed})
                      </SelectItem>
                    ))}
                    <SelectItem value="other">
                      ✨ Enter another pet&apos;s name...
                    </SelectItem>
                  </SelectContent>
                </Select>
                {serviceForm.pet_id === 'other' && (
                  <Input
                    className="mt-2"
                    value={serviceForm.pet_name}
                    onChange={e => setServiceForm({...serviceForm, pet_name: e.target.value})}
                    placeholder="Enter pet's name..."
                  />
                )}
                {serviceForm.pet_id && serviceForm.pet_id !== 'other' && (
                  <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-100 flex items-center gap-3">
                    <span className="text-2xl">💜</span>
                    <div>
                      <p className="text-sm text-purple-800 font-medium">
                        Our hearts are with you and {serviceForm.pet_name}
                      </p>
                      <p className="text-xs text-purple-600">We&apos;ll treat them with the utmost care</p>
                    </div>
                  </div>
                )}
              </>
              ) : (
                <div className="space-y-3">
                  <Input
                    value={serviceForm.pet_name}
                    onChange={e => setServiceForm({...serviceForm, pet_name: e.target.value})}
                    placeholder="Your pet's name *"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={serviceForm.pet_breed || ''}
                      onChange={e => setServiceForm({...serviceForm, pet_breed: e.target.value})}
                      placeholder="Breed"
                    />
                    <Input
                      value={serviceForm.pet_age || ''}
                      onChange={e => setServiceForm({...serviceForm, pet_age: e.target.value})}
                      placeholder="Age"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div>
              <Label className="mb-2">Your Contact Details</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    value={serviceForm.phone}
                    onChange={e => setServiceForm({...serviceForm, phone: e.target.value})}
                    placeholder="Phone *"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    value={serviceForm.email}
                    onChange={e => setServiceForm({...serviceForm, email: e.target.value})}
                    placeholder="Email *"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label>Address</Label>
              <Input
                value={serviceForm.address}
                onChange={e => setServiceForm({...serviceForm, address: e.target.value})}
                placeholder="For home pickup service"
              />
            </div>
            
            <div>
              <Label>City</Label>
              <Input
                value={serviceForm.city}
                onChange={e => setServiceForm({...serviceForm, city: e.target.value})}
                placeholder="Your city"
              />
            </div>
            
            <div>
              <Label>Any special requests or notes</Label>
              <Textarea
                value={serviceForm.special_requests}
                onChange={e => setServiceForm({...serviceForm, special_requests: e.target.value})}
                placeholder="Any specific wishes or requirements..."
                rows={3}
              />
            </div>
            
            <Button 
              onClick={handleServiceRequest}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-gray-500">
              Our team will contact you within 2 hours to discuss arrangements.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="py-4">
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <p className="text-gray-600 mb-4">{selectedProduct.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-purple-600">
                  ₹{selectedProduct.price.toLocaleString()}
                </span>
                <Button 
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    setShowProductModal(false);
                  }}
                  data-testid="modal-add-to-cart-btn"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Concierge® Button - Blue C® for Service Desk chat */}
      <ConciergeButton 
        pillar="farewell" 
        position="bottom-right"
        showLabel
      />
    </PillarPageLayout>
  );
};

export default FarewellPage;

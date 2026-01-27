import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import MiraContextPanel from '../components/MiraContextPanel';
import ProductCard from '../components/ProductCard';
import AdminQuickEdit from '../components/AdminQuickEdit';
import { getPetPhotoUrl } from '../utils/petAvatar';
import BreedAutocomplete from '../components/BreedAutocomplete';
import SEOHead from '../components/SEOHead';
import {
  Car, Train, Plane, Truck, MapPin, Calendar, Clock, PawPrint,
  Shield, Heart, CheckCircle, AlertTriangle, MessageCircle, Phone,
  ChevronRight, Sparkles, Package, Star, Loader2, Info, Send,
  ArrowRight, Users, Play, X, ChevronDown, Gift, Zap
} from 'lucide-react';

// Travel Types Configuration
const TRAVEL_TYPES = {
  cab: {
    id: 'cab',
    name: 'Cab / Road Travel',
    icon: Car,
    description: 'Vet visits, grooming, short trips',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  train: {
    id: 'train',
    name: 'Train / Bus',
    icon: Train,
    description: 'Medium-distance travel',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  flight: {
    id: 'flight',
    name: 'Domestic Flight',
    icon: Plane,
    description: 'Air travel within India',
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  },
  relocation: {
    id: 'relocation',
    name: 'Pet Relocation',
    icon: Truck,
    description: 'Full service moves',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600'
  }
};

// Hero Images
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1759340875613-75cb64d2c16d?w=1200&q=80',
  'https://images.unsplash.com/photo-1758991281299-756e997a027b?w=1200&q=80',
  'https://images.unsplash.com/photo-1759559790290-a3c6fce1d55f?w=1200&q=80'
];

// Main Travel Page Component
const TravelPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const formRef = useRef(null);
  
  // State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: type, 2: pet, 3: details, 4: confirm
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [travelProducts, setTravelProducts] = useState([]);
  const [travelBundles, setTravelBundles] = useState([]);
  const [requestResult, setRequestResult] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  
  // Form Data
  const [formData, setFormData] = useState({
    pickup_location: '',
    pickup_city: '',
    drop_location: '',
    drop_city: '',
    travel_date: '',
    travel_time: '',
    return_date: '',
    is_round_trip: false,
    special_requirements: '',
    pet_weight: '',
    crate_trained: null,
    // Manual pet entry (for users without profile)
    pet_name: '',
    pet_breed: '',
    // Contact info (for non-logged in users)
    contact_name: '',
    contact_email: '',
    contact_phone: ''
  });

  // Scroll to top on mount, or to hash if present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      // Wait for content to load then scroll to hash
      setTimeout(() => {
        const element = document.getElementById(hash.replace('#', ''));
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  // Hero image rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Fetch user's pets
  useEffect(() => {
    if (user && token) {
      fetchUserPets();
    }
    fetchTravelProducts();
  }, [user, token]);

  const fetchUserPets = async () => {
    try {
      const response = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserPets(data.pets || []);
      }
    } catch (error) {
      console.error('Error fetching pets:', error);
    }
  };

  const fetchTravelProducts = async () => {
    try {
      const [productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/travel/products`),
        fetch(`${API_URL}/api/travel/bundles`)
      ]);
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setTravelProducts(data.products || []);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setTravelBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching travel products:', error);
    }
  };

  const handleStartPlanning = () => {
    // Open for all - no login required
    setShowWizard(true);
    setWizardStep(1);
  };

  const handleFormSubmit = async () => {
    if (!selectedType) return;
    
    setSubmitting(true);
    try {
      const requestPayload = {
        travel_type: selectedType,
        pet_id: selectedPet?.id !== 'manual' ? selectedPet?.id : null,
        pet_name: selectedPet?.name || formData.pet_name || '',
        pet_breed: selectedPet?.breed || formData.pet_breed || '',
        ...formData,
        user_email: user?.email || formData.contact_email,
        user_phone: user?.phone || formData.contact_phone,
        user_name: user?.name || formData.contact_name
      };

      const response = await fetch(`${API_URL}/api/travel/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const result = await response.json();
        setRequestResult(result);
        setWizardStep(4);
        toast({
          title: "Request Submitted! 🐾",
          description: `We'll review ${selectedPet.name}'s travel needs and get back to you soon.`
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to submit request",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      category: 'travel'
    });
    toast({
      title: "Added to cart! 🛒",
      description: product.name
    });
  };

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setSelectedPet(null);
    setSelectedType(null);
    setRequestResult(null);
    setFormData({
      pickup_location: '',
      pickup_city: '',
      drop_location: '',
      drop_city: '',
      travel_date: '',
      travel_time: '',
      return_date: '',
      is_round_trip: false,
      special_requirements: '',
      pet_weight: '',
      crate_trained: null
    });
  };

  const scrollToProducts = () => {
    document.getElementById('travel-kits')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* SEO Meta Tags */}
      <SEOHead page="travel" path="/travel" />
      
      
      {/* === HERO SECTION === */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 text-white">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Pet Travel" 
            className="w-full h-full object-cover opacity-30 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/90 via-purple-800/80 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium">Concierge®-Led Pet Travel</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Adventures Begin
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400">
                Together
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
              From quick vet runs to cross-country relocations — we plan, coordinate, and ensure your pet travels safely with the care they deserve.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleStartPlanning}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white px-8 py-6 text-lg rounded-full shadow-2xl shadow-pink-500/30 transition-all hover:scale-105"
                data-testid="plan-my-trip-btn"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Plan My Trip
              </Button>
              <Button 
                onClick={scrollToProducts}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
                data-testid="shop-travel-kits-btn"
              >
                <Package className="w-5 h-5 mr-2" />
                Shop Travel Kits
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 mt-12">
              <div className="flex items-center gap-2 text-white/70">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm">Pet Safety First</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm">Expert Concierge®</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-sm">500+ Happy Travels</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </div>
      </div>

      {/* === TRAVEL TYPES STRIP === */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-500 hidden sm:inline">Travel Types:</span>
            </div>
            <div className="flex gap-2">
              {Object.values(TRAVEL_TYPES).map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      handleStartPlanning();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${type.bgColor} ${type.textColor} hover:scale-105 whitespace-nowrap`}
                    data-testid={`travel-type-${type.id}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{type.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* === HOW IT WORKS === */}
      <div className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-purple-100 text-purple-700 mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Stress-Free Pet Travel in 4 Steps
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our concierge team handles everything — so you can focus on the adventure ahead.
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: 1, icon: MessageCircle, title: 'Tell Us', desc: 'Share your travel plans & pet details', color: 'from-blue-500 to-cyan-500' },
              { step: 2, icon: Shield, title: 'We Assess', desc: 'Review safety requirements & options', color: 'from-purple-500 to-violet-500' },
              { step: 3, icon: Users, title: 'Coordinate', desc: 'We handle logistics & partners', color: 'from-pink-500 to-rose-500' },
              { step: 4, icon: Heart, title: 'Travel Safe', desc: 'Enjoy peace of mind throughout', color: 'from-amber-500 to-orange-500' }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative">
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-200 to-transparent" />
                  )}
                  <div className="text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-400 mb-1">STEP {item.step}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              onClick={handleStartPlanning}
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-full px-8"
              data-testid="start-planning-btn"
            >
              Start Planning Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* === TRAVEL BUNDLES === */}
      <div id="travel-kits" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Badge className="bg-green-100 text-green-700 mb-2">Save up to 30%</Badge>
              <h2 className="text-3xl font-bold text-gray-900">Travel Kits & Bundles</h2>
              <p className="text-gray-600 mt-1">Everything your pet needs, bundled with love</p>
            </div>
          </div>
          
          {travelBundles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {travelBundles.map((bundle) => {
                const typeConfig = TRAVEL_TYPES[bundle.travel_type] || TRAVEL_TYPES.cab;
                const Icon = typeConfig.icon;
                return (
                  <Card 
                    key={bundle.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200"
                    data-testid={`bundle-${bundle.id}`}
                  >
                    {/* Bundle Image/Header */}
                    <div className={`h-40 bg-gradient-to-br ${typeConfig.color} p-6 relative overflow-hidden`}>
                      <div className="absolute -right-6 -bottom-6 opacity-20">
                        <Icon className="w-32 h-32 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white backdrop-blur-sm mb-2">
                        {typeConfig.name}
                      </Badge>
                      {bundle.is_recommended && (
                        <Badge className="bg-yellow-400 text-yellow-900 ml-2">
                          <Star className="w-3 h-3 mr-1 fill-current" /> Top Pick
                        </Badge>
                      )}
                      <h3 className="text-xl font-bold text-white mt-2">{bundle.name}</h3>
                    </div>
                    
                    {/* Bundle Details */}
                    <div className="p-5">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{bundle.description}</p>
                      
                      {/* Price */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-gray-900">₹{bundle.price?.toLocaleString()}</span>
                        {bundle.original_price && (
                          <>
                            <span className="text-gray-400 line-through">₹{bundle.original_price?.toLocaleString()}</span>
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              {Math.round((1 - bundle.price / bundle.original_price) * 100)}% OFF
                            </Badge>
                          </>
                        )}
                      </div>
                      
                      {/* Paw Points */}
                      {bundle.paw_reward_points > 0 && (
                        <div className="flex items-center gap-1 text-sm text-purple-600 mb-4">
                          <PawPrint className="w-4 h-4" />
                          Earn {bundle.paw_reward_points} Paw Points
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-gray-900 hover:bg-gray-800"
                        onClick={() => handleAddToCart(bundle)}
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center bg-gray-50">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Travel Bundles Coming Soon</h3>
              <p className="text-gray-500">We're preparing amazing travel kits for your furry friend!</p>
            </Card>
          )}
        </div>
      </div>

      {/* === TRAVEL PRODUCTS === */}
      <div className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Travel Essentials</h2>
              <p className="text-gray-600 mt-1">Individual items for every journey</p>
            </div>
          </div>
          
          {travelProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {travelProducts.map((product) => (
                <ProductCard key={product.id} product={product} pillar="travel" />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center bg-white">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Products Loading...</h3>
            </Card>
          )}
        </div>
      </div>

      {/* === FINAL CTA === */}
      <div className="py-20 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Travel with Your Best Friend?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Our concierge team is ready to make your pet's journey safe, comfortable, and stress-free.
          </p>
          <Button 
            onClick={handleStartPlanning}
            size="lg"
            className="bg-white text-purple-600 hover:bg-gray-100 px-10 py-6 text-lg rounded-full shadow-2xl"
            data-testid="final-cta-btn"
          >
            <Zap className="w-5 h-5 mr-2" />
            Plan My Trip Now
          </Button>
        </div>
      </div>

      {/* === PLANNING WIZARD MODAL === */}
      <Dialog open={showWizard} onOpenChange={(open) => !open && resetWizard()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {wizardStep === 4 ? (
                <>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  Request Submitted!
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <PawPrint className="w-5 h-5 text-purple-600" />
                  </div>
                  Plan Your Trip
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {/* Progress Bar */}
          {wizardStep < 4 && (
            <div className="flex gap-2 mb-6">
              {[1, 2, 3].map((step) => (
                <div 
                  key={step}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    step <= wizardStep ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Step 1: Select Travel Type */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <p className="text-gray-600">What type of travel are you planning?</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(TRAVEL_TYPES).map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => {
                        setSelectedType(type.id);
                        setWizardStep(2);
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left hover:shadow-md ${
                        selectedType === type.id 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                      data-testid={`wizard-type-${type.id}`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900">{type.name}</h4>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select Pet */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <p className="text-gray-600">Who's traveling?</p>
              
              {userPets.length === 0 ? (
                <div className="space-y-4">
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <p className="text-sm text-amber-700 mb-3">No pets on profile yet? No problem! Enter details below:</p>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Pet's Name"
                        className="w-full p-3 border rounded-lg text-sm"
                        value={formData.pet_name || ''}
                        onChange={(e) => setFormData({...formData, pet_name: e.target.value})}
                      />
                      <BreedAutocomplete
                        placeholder="Start typing breed..."
                        value={formData.pet_breed || ''}
                        onChange={(e) => setFormData({...formData, pet_breed: e.target.value})}
                        className="text-sm"
                      />
                    </div>
                  </Card>
                  <Button 
                    onClick={() => {
                      setSelectedPet({ id: 'manual', name: formData.pet_name || 'Pet', breed: formData.pet_breed });
                      setWizardStep(3);
                    }}
                    className="w-full"
                    disabled={!formData.pet_name}
                  >
                    Continue <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => {
                        setSelectedPet(pet);
                        setWizardStep(3);
                      }}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left hover:shadow-md flex items-center gap-4 ${
                        selectedPet?.id === pet.id 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                      data-testid={`wizard-pet-${pet.id}`}
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img 
                          src={getPetPhotoUrl(pet)} 
                          alt={pet.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{pet.name}</h4>
                        <p className="text-sm text-gray-500">{pet.breed} {pet.age && `• ${pet.age}`}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}
              
              <Button variant="ghost" onClick={() => setWizardStep(1)} className="mt-4">
                Back
              </Button>
            </div>
          )}

          {/* Step 3: Journey Details */}
          {wizardStep === 3 && selectedType && (selectedPet || formData.pet_name) && (
            <div className="space-y-4" ref={formRef}>
              {/* Selected Summary */}
              <Card className="p-3 bg-purple-50 border-purple-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  {(() => { const Icon = TRAVEL_TYPES[selectedType]?.icon || Car; return <Icon className="w-5 h-5 text-purple-600" />; })()}
                </div>
                <div className="flex-1">
                  <span className="text-sm text-purple-600">{TRAVEL_TYPES[selectedType]?.name}</span>
                  <span className="mx-2 text-purple-300">•</span>
                  <span className="text-sm font-medium text-purple-900">{selectedPet.name}</span>
                </div>
                <button onClick={() => setWizardStep(1)} className="text-sm text-purple-600 hover:underline">
                  Change
                </button>
              </Card>
              
              {/* Journey Form */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Pickup City</Label>
                  <Input
                    value={formData.pickup_city}
                    onChange={(e) => setFormData({...formData, pickup_city: e.target.value})}
                    placeholder="e.g., Bangalore"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Drop City</Label>
                  <Input
                    value={formData.drop_city}
                    onChange={(e) => setFormData({...formData, drop_city: e.target.value})}
                    placeholder="e.g., Delhi"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label>Pickup Address</Label>
                  <Input
                    value={formData.pickup_location}
                    onChange={(e) => setFormData({...formData, pickup_location: e.target.value})}
                    placeholder="Full address or landmark"
                  />
                </div>
                <div>
                  <Label>Travel Date</Label>
                  <Input
                    type="date"
                    value={formData.travel_date}
                    onChange={(e) => setFormData({...formData, travel_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label>Preferred Time</Label>
                  <select
                    value={formData.travel_time}
                    onChange={(e) => setFormData({...formData, travel_time: e.target.value})}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select time</option>
                    <option value="06:00">6:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="20:00">8:00 PM</option>
                  </select>
                </div>
              </div>
              
              {/* Special Requirements */}
              <div>
                <Label>Special Requirements (Optional)</Label>
                <Textarea
                  value={formData.special_requirements}
                  onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                  placeholder={`Any specific needs for ${selectedPet?.name || 'your pet'}? (anxiety, medication, feeding schedule, etc.)`}
                  rows={3}
                />
              </div>
              
              {/* Contact Info for non-logged in users */}
              {!user && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-gray-700 font-medium">Your Contact Details</Label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full p-3 border rounded-lg text-sm"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="w-full p-3 border rounded-lg text-sm"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full p-3 border rounded-lg text-sm"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  />
                </div>
              )}
              
              {/* Info Box */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">What happens next?</p>
                    <ul className="text-blue-700 mt-1 space-y-1">
                      <li>• Our concierge reviews your request</li>
                      <li>• We contact you within 24 hours</li>
                      <li>• No payment until everything is confirmed</li>
                    </ul>
                  </div>
                </div>
              </Card>
              
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setWizardStep(2)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleFormSubmit}
                  disabled={submitting || !formData.pickup_city || !formData.drop_city || !formData.travel_date}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  data-testid="submit-request-btn"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Submit Request</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {wizardStep === 4 && requestResult && (
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">You're All Set!</h3>
              <p className="text-gray-600 mb-6">
                Your travel request for <strong>{selectedPet?.name}</strong> has been submitted.
                <br />Our concierge team will reach out within 24 hours.
              </p>
              
              <Card className="p-4 bg-gray-50 text-left mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Request ID:</span>
                    <p className="font-medium">{requestResult.request_id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <Badge className="bg-blue-100 text-blue-700 ml-2">Under Review</Badge>
                  </div>
                </div>
              </Card>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetWizard} className="flex-1">
                  New Request
                </Button>
                <Button onClick={() => { resetWizard(); window.location.href = '/my-pets'; }} className="flex-1">
                  View My Requests
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Mira Contextual Panel - Fixed on right side for desktop */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="travel" />
      </div>
      
      {/* Mira Contextual Panel - Bottom slide-up for mobile */}
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30">
        <MiraContextPanel pillar="travel" position="bottom" />
      </div>
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="travel" position="bottom-left" />
    </div>
  );
};

export default TravelPage;

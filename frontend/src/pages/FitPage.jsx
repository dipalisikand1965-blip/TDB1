/**
 * FitPage.jsx
 * Premium Pillar Page - Fit (Fitness & Wellness)
 * Consistent with other pillar pages, spectacular design
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import MiraContextPanel from '../components/MiraContextPanel';
import AdminQuickEdit from '../components/AdminQuickEdit';
import ProductCard from '../components/ProductCard';
import { getPetPhotoUrl } from '../utils/petAvatar';
import {
  Dumbbell, Heart, TrendingUp, Scale, Activity, Trophy,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Target, Zap, Timer, PawPrint,
  Users, Calendar, MapPin, Award, ShoppingBag, AlertCircle,
  Clock, ArrowUpRight, Plus, Check, X, Phone, Package, Shield
} from 'lucide-react';

// Service Category Icons & Config
const SERVICE_ICONS = {
  assessment: { icon: Activity, color: 'from-teal-500 to-emerald-500', bg: 'bg-teal-50', text: 'text-teal-600' },
  training: { icon: Dumbbell, color: 'from-green-500 to-teal-500', bg: 'bg-green-50', text: 'text-green-600' },
  weight: { icon: Scale, color: 'from-emerald-500 to-cyan-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  therapy: { icon: Heart, color: 'from-cyan-500 to-teal-500', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  senior: { icon: Award, color: 'from-teal-500 to-green-500', bg: 'bg-teal-50', text: 'text-teal-600' },
  puppy: { icon: PawPrint, color: 'from-lime-500 to-green-500', bg: 'bg-lime-50', text: 'text-lime-600' },
  agility: { icon: Zap, color: 'from-yellow-500 to-lime-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  wellness: { icon: Sparkles, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-600' }
};

// Fitness Types for sticky nav
const FIT_TYPES = {
  assessment: { name: 'Fitness Assessment', icon: Activity, color: 'from-teal-500 to-emerald-500', bgColor: 'bg-teal-50', textColor: 'text-teal-600' },
  exercise_plan: { name: 'Exercise Plans', icon: Dumbbell, color: 'from-green-500 to-teal-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  weight_management: { name: 'Weight Management', icon: Scale, color: 'from-emerald-500 to-cyan-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  agility: { name: 'Agility Training', icon: Zap, color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  senior_fitness: { name: 'Senior Fitness', icon: Award, color: 'from-teal-500 to-green-500', bgColor: 'bg-teal-50', textColor: 'text-teal-600' }
};

// Activity levels for form
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (Minimal activity)' },
  { value: 'light', label: 'Light (1-2 walks/day)' },
  { value: 'moderate', label: 'Moderate (Regular walks + play)' },
  { value: 'active', label: 'Active (Daily exercise)' },
  { value: 'very_active', label: 'Very Active (Athlete level)' }
];

const FITNESS_GOALS = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_building', label: 'Build Muscle' },
  { value: 'endurance', label: 'Improve Endurance' },
  { value: 'flexibility', label: 'Better Flexibility' },
  { value: 'senior_mobility', label: 'Senior Mobility' },
  { value: 'energy_management', label: 'Energy Management' },
  { value: 'rehabilitation', label: 'Rehabilitation' }
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80',
  'https://images.unsplash.com/photo-1546815693-7533bae19894?w=1200&q=80'
];

// ==================== MAIN FIT PAGE COMPONENT ====================
const FitPage = () => {
  const { user, token } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  
  // Data states
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedType, setSelectedType] = useState(null);
  
  // UI states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [bookingForm, setBookingForm] = useState({
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    preferred_date: '',
    notes: '',
    fitness_goals: [],
    current_activity_level: 'moderate'
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAllData();
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (user && token) {
      fetchUserPets();
      setBookingForm(prev => ({
        ...prev,
        contact_name: user.name || '',
        contact_email: user.email || '',
        contact_phone: user.phone || ''
      }));
    }
  }, [user, token]);
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [servicesRes, productsRes, plansRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/services?pillar=fit`),
        fetch(`${API_URL}/api/products?pillar=fit&limit=10`),
        fetch(`${API_URL}/api/fit/plans`),
        fetch(`${API_URL}/api/fit/bundles`)
      ]);
      
      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }
      
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
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
  
  const handleBookService = (service) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };
  
  const handleStartPlan = (plan) => {
    setSelectedService({
      id: `plan-${plan.id}`,
      name: plan.name,
      price: plan.price,
      description: plan.description,
      category: 'training'
    });
    setShowBookingModal(true);
  };
  
  const toggleGoal = (goal) => {
    const goals = bookingForm.fitness_goals.includes(goal)
      ? bookingForm.fitness_goals.filter(g => g !== goal)
      : [...bookingForm.fitness_goals, goal];
    setBookingForm({ ...bookingForm, fitness_goals: goals });
  };
  
  const submitBooking = async () => {
    if (!bookingForm.contact_name || !bookingForm.contact_phone) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and phone number",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/services/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          service_id: selectedService.id,
          pet_id: selectedPet?.id,
          preferred_date: bookingForm.preferred_date,
          notes: `Goals: ${bookingForm.fitness_goals.join(', ')}. Activity level: ${bookingForm.current_activity_level}. ${bookingForm.notes}`,
          contact_name: bookingForm.contact_name,
          contact_phone: bookingForm.contact_phone,
          contact_email: bookingForm.contact_email
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Booking Confirmed! 💪",
          description: result.message || `Your booking #${result.booking_id} has been received.`
        });
        setShowBookingModal(false);
        setSelectedService(null);
        setSelectedPet(null);
        setBookingForm(prev => ({
          ...prev,
          preferred_date: '',
          notes: '',
          fitness_goals: []
        }));
      } else {
        const error = await response.json();
        toast({
          title: "Booking Failed",
          description: error.detail || "Could not complete booking",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      image: product.image || product.image_url || product.images?.[0],
      quantity: 1
    });
    toast({
      title: "Added to cart",
      description: `${product.name || product.title} added to your cart`
    });
  };

  const scrollToServices = () => {
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToProducts = () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      
      {/* ==================== HERO SECTION (Same style as CarePage) ==================== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-emerald-800 to-green-900 text-white">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Pet Fitness" 
            className="w-full h-full object-cover opacity-30 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/90 via-emerald-800/80 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Dumbbell className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium">Pet Fitness & Wellness</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Fit Paws,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-200">
                Happy Hearts
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
              Expert fitness programmes, weight management, and activity tracking. Build a healthier, happier life together with your furry athlete.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={scrollToServices}
                size="lg"
                className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600 text-emerald-950 font-semibold px-8 py-6 text-lg rounded-full shadow-2xl shadow-emerald-500/30 transition-all hover:scale-105"
                data-testid="get-fit-btn"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Book Assessment
              </Button>
              <Button 
                onClick={scrollToProducts}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
                data-testid="shop-fit-btn"
              >
                <Package className="w-5 h-5 mr-2" />
                Shop Fitness Gear
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 mt-12">
              <div className="flex items-center gap-2 text-white/70">
                <Trophy className="w-5 h-5 text-lime-400" />
                <span className="text-sm">Certified Trainers</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">Progress Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <PawPrint className="w-5 h-5 text-teal-400" />
                <span className="text-sm">Earn Paw Points</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </div>
      </div>

      {/* === FITNESS TYPES STRIP (Same as CarePage) === */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                !selectedType ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Services
            </button>
            {Object.entries(FIT_TYPES).map(([key, type]) => {
              const Icon = type.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedType(selectedType === key ? null : key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                    selectedType === key ? `bg-gradient-to-r ${type.color} text-white` : `${type.bgColor} ${type.textColor} hover:scale-105`
                  }`}
                  data-testid={`fit-type-${key}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{type.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* ==================== CONCIERGE® SERVICES SECTION ==================== */}
      <section id="services" className="py-16 bg-gradient-to-b from-teal-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          {/* Section header */}
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-medium text-teal-600 uppercase tracking-wider">Concierge® Services</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Premium Fitness Services</h2>
          <p className="text-gray-600 mb-10 max-w-2xl">
            Expert-led programmes tailored to your pet's needs. Book a service and our Concierge® team will coordinate everything.
          </p>
          
          {/* Services grid */}
          {services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {services.map((service) => {
                const config = SERVICE_ICONS[service.category] || SERVICE_ICONS.assessment;
                const Icon = config.icon;
                
                return (
                  <Card 
                    key={service.id} 
                    className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    data-testid={`service-card-${service.id}`}
                  >
                    {/* Gradient header */}
                    <div className={`h-24 bg-gradient-to-br ${config.color} p-4 relative`}>
                      <div className="absolute -right-4 -bottom-4 opacity-20">
                        <Icon className="w-24 h-24 text-white" />
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{service.category}</span>
                      </div>
                      <Badge className="absolute top-3 right-3 bg-white/20 text-white backdrop-blur-sm text-xs">
                        Concierge®
                      </Badge>
                    </div>
                    
                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{service.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{service.description}</p>
                      
                      {/* Duration */}
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                        <Clock className="w-3.5 h-3.5" />
                        {service.duration}
                      </div>
                      
                      {/* Includes tags */}
                      {service.includes && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {service.includes.slice(0, 2).map((item, idx) => (
                            <span key={idx} className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}>
                              {item}
                            </span>
                          ))}
                          {service.includes.length > 2 && (
                            <span className="text-xs text-gray-400">+{service.includes.length - 2}</span>
                          )}
                        </div>
                      )}
                      
                      {/* Price & CTA */}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-xl font-bold text-gray-900">₹{service.price?.toLocaleString()}</span>
                          {service.is_subscription && (
                            <span className="text-xs text-gray-400 ml-1">/mo</span>
                          )}
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleBookService(service)}
                          className="bg-teal-600 hover:bg-teal-700 rounded-full"
                          data-testid={`book-${service.id}`}
                        >
                          Book Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center bg-teal-50/50 border-teal-100">
              <Activity className="w-16 h-16 text-teal-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Services Coming Soon</h3>
              <p className="text-gray-500">Our Concierge® fitness services are being set up. Check back soon!</p>
            </Card>
          )}
        </div>
      </section>
      
      {/* ==================== PRODUCTS & BUNDLES SECTION ==================== */}
      <section id="products" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-medium text-teal-600 uppercase tracking-wider">Shop</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Fitness Gear & Bundles</h2>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/shop?pillar=fit')}
              className="hidden md:flex items-center gap-2 rounded-full"
              data-testid="view-all-fit-products"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Bundles */}
          {bundles.length > 0 && (
            <div className="mb-10">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-teal-500" />
                Value Bundles
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundles.map((bundle) => (
                  <Card key={bundle.id} className="p-4 border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                      {bundle.is_recommended && (
                        <Badge className="bg-teal-600 text-white">Recommended</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl font-bold text-teal-600">₹{bundle.price?.toLocaleString()}</span>
                      {bundle.original_price && (
                        <>
                          <span className="text-sm text-gray-400 line-through">₹{bundle.original_price?.toLocaleString()}</span>
                          <Badge variant="outline" className="text-teal-600 border-teal-300">
                            Save ₹{(bundle.original_price - bundle.price)?.toLocaleString()}
                          </Badge>
                        </>
                      )}
                    </div>
                    <Button className="w-full bg-teal-600 hover:bg-teal-700">Add to Cart</Button>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} pillar="fit" />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-gray-100">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Products Coming Soon</h3>
              <p className="text-gray-500 mb-4">Fitness products are being curated for your pets.</p>
              <Button onClick={() => navigate('/shop')} variant="outline" className="rounded-full">
                Browse All Products
              </Button>
            </Card>
          )}
          
          {/* Mobile view all */}
          <div className="md:hidden mt-6 text-center">
            <Button 
              onClick={() => navigate('/shop?pillar=fit')}
              className="rounded-full bg-teal-600 hover:bg-teal-700"
            >
              View All Products <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* ==================== FITNESS PLANS SECTION ==================== */}
      {plans.length > 0 && (
        <section id="plans" className="py-16 bg-gradient-to-b from-white to-teal-50/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              <span className="text-sm font-medium text-teal-600 uppercase tracking-wider">Programmes</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Fitness Plans</h2>
            <p className="text-gray-600 mb-10 max-w-2xl">
              Structured programmes designed by certified trainers. Pick a plan that suits your pet's needs and goals.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const typeConfig = FIT_TYPES[plan.plan_type] || FIT_TYPES.exercise_plan;
                const Icon = typeConfig.icon;
                
                return (
                  <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-all" data-testid={`plan-${plan.id}`}>
                    <div className={`h-28 bg-gradient-to-br ${typeConfig.color} p-4 relative`}>
                      <div className="absolute -right-2 -bottom-2 opacity-20">
                        <Icon className="w-20 h-20 text-white" />
                      </div>
                      {plan.is_featured && (
                        <Badge className="absolute top-3 right-3 bg-amber-400 text-amber-900">
                          <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 text-white">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{typeConfig.name}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h4 className="font-bold text-gray-900 mb-1">{plan.name}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{plan.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {plan.pet_sizes?.slice(0, 2).map((size, i) => (
                          <Badge key={i} variant="outline" className="text-xs capitalize">{size}</Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {plan.duration_weeks} weeks
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5" /> {plan.sessions_per_week}x/week
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-xl font-bold text-gray-900">₹{plan.price?.toLocaleString()}</span>
                          {plan.paw_reward_points > 0 && (
                            <p className="text-xs text-teal-600">🐾 {plan.paw_reward_points} pts</p>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleStartPlan(plan)}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          Enrol
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}
      
      {/* ==================== CTA SECTION ==================== */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Transform Your Pet's Fitness?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Start with a free consultation. Our Concierge® team will help you find the perfect programme.
          </p>
          <Button 
            size="lg"
            onClick={() => handleBookService(services[0] || { id: 'consultation', name: 'Free Consultation', price: 0 })}
            className="bg-white text-teal-700 hover:bg-gray-100 font-semibold px-10 py-6 text-lg rounded-full shadow-2xl transition-all hover:scale-105"
            data-testid="cta-book-btn"
          >
            <Phone className="w-5 h-5 mr-2" />
            Book Free Consultation
          </Button>
        </div>
      </section>
      
      {/* ==================== BOOKING MODAL ==================== */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Book {selectedService?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Service info */}
            {selectedService && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{selectedService.name}</span>
                  <span className="font-bold text-teal-700">₹{selectedService.price?.toLocaleString()}</span>
                </div>
                {selectedService.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{selectedService.description}</p>
                )}
              </div>
            )}
            
            {/* Pet selection */}
            <div>
              <Label className="mb-2 block font-semibold">Select Your Pet (Optional)</Label>
              {userPets.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {userPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(selectedPet?.id === pet.id ? null : pet)}
                      className={`p-3 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                        selectedPet?.id === pet.id 
                          ? 'border-teal-500 bg-teal-50' 
                          : 'border-gray-200 hover:border-teal-200'
                      }`}
                    >
                      <img 
                        src={getPetPhotoUrl(pet)} 
                        alt={pet.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">{pet.name}</p>
                        <p className="text-xs text-gray-500">{pet.breed}</p>
                      </div>
                      {selectedPet?.id === pet.id && (
                        <CheckCircle className="w-4 h-4 text-teal-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                  Sign in to select from your pets, or we'll ask about your pet when we call.
                </p>
              )}
            </div>
            
            {/* Contact info */}
            <div className="space-y-3">
              <Label className="font-semibold">Your Contact Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-500">Name *</Label>
                  <Input
                    placeholder="Your name"
                    value={bookingForm.contact_name}
                    onChange={(e) => setBookingForm({ ...bookingForm, contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Phone *</Label>
                  <Input
                    placeholder="Mobile number"
                    value={bookingForm.contact_phone}
                    onChange={(e) => setBookingForm({ ...bookingForm, contact_phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Email</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={bookingForm.contact_email}
                  onChange={(e) => setBookingForm({ ...bookingForm, contact_email: e.target.value })}
                />
              </div>
            </div>
            
            {/* Preferred date */}
            <div>
              <Label className="text-sm text-gray-500">Preferred Date (Optional)</Label>
              <Input
                type="date"
                value={bookingForm.preferred_date}
                onChange={(e) => setBookingForm({ ...bookingForm, preferred_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Activity Level */}
            <div>
              <Label className="mb-2 block">Current Activity Level</Label>
              <Select 
                value={bookingForm.current_activity_level} 
                onValueChange={(val) => setBookingForm({...bookingForm, current_activity_level: val})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Fitness goals */}
            <div>
              <Label className="mb-2 block font-semibold">Fitness Goals</Label>
              <div className="flex flex-wrap gap-2">
                {FITNESS_GOALS.map((goal) => (
                  <Badge
                    key={goal.value}
                    variant={bookingForm.fitness_goals.includes(goal.value) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${
                      bookingForm.fitness_goals.includes(goal.value) 
                        ? 'bg-teal-600 hover:bg-teal-700' 
                        : 'hover:bg-teal-50'
                    }`}
                    onClick={() => toggleGoal(goal.value)}
                  >
                    {goal.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Notes */}
            <div>
              <Label className="text-sm text-gray-500">Additional Notes</Label>
              <Textarea
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                placeholder="Any specific requirements or health conditions we should know about?"
                rows={3}
              />
            </div>
            
            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowBookingModal(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitBooking}
                disabled={!bookingForm.contact_name || !bookingForm.contact_phone || submitting}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Booking...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Confirm Booking</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* ==================== MIRA PANEL ==================== */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="fit" />
      </div>
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30">
        <MiraContextPanel pillar="fit" position="bottom" />
      </div>
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="fit" position="bottom-left" />
    </div>
  );
};

export default FitPage;

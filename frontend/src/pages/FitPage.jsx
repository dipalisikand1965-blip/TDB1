/**
 * FitPage.jsx
 * The World's Best Pillar Page - Fit (Fitness & Wellness)
 * 
 * Structure:
 * 1. Hero - Asymmetric split with bold typography
 * 2. Concierge® Services - Premium bookable services (NOT shop items)
 * 3. Shop for Fit - Products grid with quick-add
 * 4. Fitness Plans - Programme cards
 * 5. Request Modal - Service booking flow
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
import { getPetPhotoUrl } from '../utils/petAvatar';
import {
  Dumbbell, Heart, TrendingUp, Scale, Activity, Trophy,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Target, Zap, Timer, PawPrint,
  Users, Calendar, MapPin, Award, ShoppingBag, AlertCircle,
  Clock, ArrowUpRight, Plus, Check, X, Phone
} from 'lucide-react';

// Service Category Icons
const SERVICE_ICONS = {
  assessment: Activity,
  training: Dumbbell,
  weight: Scale,
  therapy: Heart,
  senior: Award,
  puppy: PawPrint,
  agility: Zap,
  wellness: Sparkles
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

// ==================== SERVICE CARD COMPONENT ====================
const ServiceCard = ({ service, onBook }) => {
  const Icon = SERVICE_ICONS[service.category] || Activity;
  
  return (
    <div 
      className="group relative overflow-hidden rounded-3xl bg-white border border-emerald-100 p-6 md:p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-emerald-200"
      data-testid={`service-card-${service.id}`}
    >
      {/* Icon badge */}
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white mb-6 shadow-lg shadow-teal-500/20">
        <Icon className="w-7 h-7" />
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
        {service.name}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
        {service.description}
      </p>
      
      {/* Duration & Price */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1.5 text-gray-500">
          <Clock className="w-4 h-4" />
          {service.duration}
        </span>
      </div>
      
      {/* Includes tags */}
      {service.includes && service.includes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {service.includes.slice(0, 3).map((item, idx) => (
            <span key={idx} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              {item}
            </span>
          ))}
          {service.includes.length > 3 && (
            <span className="text-xs text-gray-400">+{service.includes.length - 3} more</span>
          )}
        </div>
      )}
      
      {/* Price & CTA */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <span className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>
            ₹{service.price?.toLocaleString()}
          </span>
          {service.is_subscription && (
            <span className="text-xs text-gray-500 ml-1">/month</span>
          )}
        </div>
        <Button 
          onClick={() => onBook(service)}
          className="bg-lime-500 text-emerald-950 hover:bg-lime-400 font-bold rounded-full px-6 py-2.5 transition-all hover:scale-105 shadow-lg shadow-lime-500/20"
          data-testid={`book-service-${service.id}`}
        >
          Book Now
          <ArrowUpRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      {/* Hover indicator */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge className="bg-emerald-600 text-white">Concierge®</Badge>
      </div>
    </div>
  );
};

// ==================== PRODUCT CARD COMPONENT ====================
const ProductCard = ({ product, onAddToCart }) => {
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  
  const handleAdd = async (e) => {
    e.stopPropagation();
    setAdding(true);
    await onAddToCart(product);
    setTimeout(() => setAdding(false), 500);
  };
  
  const handleClick = () => {
    const slug = product.shopify_handle || product.handle || product.id;
    navigate(`/product/${slug}`);
  };
  
  return (
    <div 
      className="group rounded-2xl bg-white p-3 transition-all hover:shadow-lg border border-transparent hover:border-emerald-100 cursor-pointer"
      onClick={handleClick}
      data-testid={`product-card-${product.id}`}
    >
      {/* Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 mb-3">
        <img 
          src={product.image || product.image_url || product.images?.[0] || 'https://via.placeholder.com/200'} 
          alt={product.name || product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.tags?.includes('new') && (
          <Badge className="absolute top-2 left-2 bg-lime-500 text-emerald-950">New</Badge>
        )}
        {product.tags?.includes('best-seller') && (
          <Badge className="absolute top-2 left-2 bg-amber-500 text-white">Best Seller</Badge>
        )}
        
        {/* Quick add button */}
        <button
          onClick={handleAdd}
          className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-50 hover:scale-110"
          data-testid={`quick-add-${product.id}`}
        >
          {adding ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Plus className="w-4 h-4 text-gray-700" />
          )}
        </button>
      </div>
      
      {/* Info */}
      <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
        {product.name || product.title}
      </h4>
      <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>
        ₹{product.price?.toLocaleString()}
      </p>
    </div>
  );
};

// ==================== PLAN CARD COMPONENT ====================
const PlanCard = ({ plan, onStart }) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-emerald-100" data-testid={`plan-card-${plan.id}`}>
      <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-500" />
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>{plan.name}</h4>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
          </div>
          {plan.is_featured && (
            <Badge className="bg-amber-100 text-amber-700 shrink-0">
              <Star className="w-3 h-3 mr-1 fill-current" /> Featured
            </Badge>
          )}
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {plan.duration_weeks} weeks
          </span>
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            {plan.sessions_per_week}x/week
          </span>
        </div>
        
        {/* Size/Age badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {plan.pet_sizes?.slice(0, 2).map((size, i) => (
            <Badge key={i} variant="outline" className="text-xs capitalize">{size}</Badge>
          ))}
          {plan.pet_ages?.slice(0, 2).map((age, i) => (
            <Badge key={i} variant="outline" className="text-xs capitalize">{age}</Badge>
          ))}
        </div>
        
        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div>
            <span className="text-xl font-bold text-gray-900">₹{plan.price?.toLocaleString()}</span>
            {plan.paw_reward_points > 0 && (
              <p className="text-xs text-emerald-600">🐾 {plan.paw_reward_points} pts</p>
            )}
          </div>
          <Button 
            size="sm" 
            onClick={() => onStart(plan)}
            className="bg-teal-600 hover:bg-teal-700"
            data-testid={`enroll-plan-${plan.id}`}
          >
            Enrol
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ==================== MAIN FIT PAGE COMPONENT ====================
const FitPage = () => {
  const { user, token } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  
  // Data states
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
    fitness_goals: []
  });
  
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAllData();
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
      const [servicesRes, productsRes, plansRes] = await Promise.all([
        fetch(`${API_URL}/api/services?pillar=fit`),
        fetch(`${API_URL}/api/products?pillar=fit&limit=10`),
        fetch(`${API_URL}/api/fit/plans`)
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
          notes: `Goals: ${bookingForm.fitness_goals.join(', ')}. ${bookingForm.notes}`,
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
  
  const handleAddToCart = async (product) => {
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-500" style={{ fontFamily: 'Manrope, sans-serif' }}>Loading fitness programmes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-emerald-800 to-teal-950 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 lg:px-24 py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Dumbbell className="w-4 h-4 text-lime-400" />
                <span className="text-sm font-medium" style={{ fontFamily: 'Manrope, sans-serif' }}>Pet Fitness & Wellness</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-[1.1] tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                Fit Paws,
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-200">
                  Happy Hearts
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg leading-relaxed" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Expert fitness programmes, weight management, and activity tracking. 
                Build a healthier, happier life together with your furry athlete.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  size="lg"
                  className="bg-lime-500 text-emerald-950 hover:bg-lime-400 font-bold px-8 py-6 text-lg rounded-full shadow-2xl shadow-lime-500/30 transition-all hover:scale-105"
                  data-testid="hero-book-btn"
                >
                  <Activity className="w-5 h-5 mr-2" />
                  Book Assessment
                </Button>
                <Button 
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
                  data-testid="hero-shop-btn"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Shop Gear
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 mt-12">
                <div className="flex items-center gap-2 text-white/70">
                  <Trophy className="w-5 h-5 text-lime-400" />
                  <span className="text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>Certified Trainers</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>Progress Tracking</span>
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <PawPrint className="w-5 h-5 text-teal-400" />
                  <span className="text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>Earn Paw Points</span>
                </div>
              </div>
            </div>
            
            {/* Right: Image */}
            <div className="hidden lg:block relative">
              <div className="relative w-full aspect-square max-w-md ml-auto">
                <img 
                  src="https://images.unsplash.com/photo-1546815693-7533bae19894?w=600&q=80"
                  alt="Active dog running"
                  className="w-full h-full object-cover rounded-3xl shadow-2xl"
                />
                {/* Floating stats card */}
                <div className="absolute -left-8 bottom-12 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Manrope, sans-serif' }}>Average Results</p>
                      <p className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>+40% Vitality</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </div>
      </section>
      
      {/* ==================== CONCIERGE® SERVICES SECTION ==================== */}
      <section id="services" className="py-20 md:py-32 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          {/* Section header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Concierge®
              </Badge>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              Premium Fitness Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Expert-led programmes tailored to your pet's needs. Book a service and our Concierge® team will coordinate everything.
            </p>
          </div>
          
          {/* Services grid */}
          {services.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {services.map((service) => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  onBook={handleBookService}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center bg-emerald-50/50 border-emerald-100">
              <Activity className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Services Coming Soon</h3>
              <p className="text-gray-500" style={{ fontFamily: 'Manrope, sans-serif' }}>Our Concierge® fitness services are being set up. Check back soon!</p>
            </Card>
          )}
        </div>
      </section>
      
      {/* ==================== SHOP FOR FIT SECTION ==================== */}
      <section id="products" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          {/* Section header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                Shop for Fit
              </h2>
              <p className="text-gray-600" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Gear up for an active lifestyle
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/shop?pillar=fit')}
              className="hidden md:flex items-center gap-2 rounded-full"
              data-testid="view-all-products-btn"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Products grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center border-gray-100">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>No Products Yet</h3>
              <p className="text-gray-500 mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Fitness products are being curated.</p>
              <Button onClick={() => navigate('/shop')} variant="outline" className="rounded-full">
                Browse All Products
              </Button>
            </Card>
          )}
          
          {/* Mobile view all button */}
          <div className="md:hidden mt-8 text-center">
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
        <section id="plans" className="py-20 md:py-32 bg-gradient-to-b from-white to-emerald-50/30">
          <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
            {/* Section header */}
            <div className="mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                Fitness Programmes
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Structured plans designed by certified trainers. Pick a programme that suits your pet's needs and goals.
              </p>
            </div>
            
            {/* Plans grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard 
                  key={plan.id} 
                  plan={plan} 
                  onStart={handleStartPlan}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      
      {/* ==================== CTA SECTION ==================== */}
      <section className="py-20 bg-gradient-to-br from-teal-600 to-emerald-700">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            Ready to Transform Your Pet's Fitness?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Start with a free consultation. Our Concierge® team will help you find the perfect programme.
          </p>
          <Button 
            size="lg"
            onClick={() => handleBookService(services[0] || { id: 'consultation', name: 'Free Consultation', price: 0 })}
            className="bg-lime-500 text-emerald-950 hover:bg-lime-400 font-bold px-10 py-6 text-lg rounded-full shadow-2xl transition-all hover:scale-105"
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
            <DialogTitle className="flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              <Activity className="w-5 h-5 text-teal-600" />
              Book {selectedService?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Service info */}
            {selectedService && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{selectedService.name}</span>
                  <span className="font-bold text-emerald-700">₹{selectedService.price?.toLocaleString()}</span>
                </div>
                {selectedService.description && (
                  <p className="text-sm text-gray-600 mt-1">{selectedService.description}</p>
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
                className="flex-1 rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={submitBooking}
                disabled={!bookingForm.contact_name || !bookingForm.contact_phone || submitting}
                className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-full"
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

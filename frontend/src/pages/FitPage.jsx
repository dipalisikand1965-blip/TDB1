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
import MiraContextPanel from '../components/MiraContextPanel';
import ProductCard from '../components/ProductCard';
import {
  Dumbbell, Heart, TrendingUp, Scale, Activity, Trophy,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Target, Zap, Timer, PawPrint,
  Users, Calendar, MapPin, Award, ShoppingBag
} from 'lucide-react';

// Fitness Type Configuration
const FIT_TYPES = {
  assessment: { name: 'Fitness Assessment', icon: Activity, color: 'from-teal-500 to-emerald-500', bgColor: 'bg-teal-50', textColor: 'text-teal-600' },
  exercise_plan: { name: 'Exercise Plans', icon: Dumbbell, color: 'from-green-500 to-teal-500', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  weight_management: { name: 'Weight Management', icon: Scale, color: 'from-emerald-500 to-cyan-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  nutrition: { name: 'Nutrition Guidance', icon: Heart, color: 'from-lime-500 to-green-500', bgColor: 'bg-lime-50', textColor: 'text-lime-600' },
  agility: { name: 'Agility Training', icon: Zap, color: 'from-cyan-500 to-teal-500', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
  senior_fitness: { name: 'Senior Fitness', icon: Award, color: 'from-teal-500 to-green-500', bgColor: 'bg-teal-50', textColor: 'text-teal-600' }
};

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
  'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80'
];

const FitPage = () => {
  const { user, token } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [featuredPlans, setFeaturedPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  
  const [requestForm, setRequestForm] = useState({
    fit_type: 'assessment',
    current_activity_level: 'moderate',
    fitness_goals: [],
    health_conditions: '',
    preferred_activities: '',
    schedule_preference: '',
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
      const [plansRes, featuredRes, productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/fit/plans`),
        fetch(`${API_URL}/api/fit/plans?is_featured=true`),
        fetch(`${API_URL}/api/fit/products`),
        fetch(`${API_URL}/api/fit/bundles`)
      ]);
      
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
      }
      if (featuredRes.ok) {
        const data = await featuredRes.json();
        setFeaturedPlans(data.plans || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }
    } catch (error) {
      console.error('Error fetching fitness data:', error);
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

  const handleStartRequest = (fitType = 'assessment') => {
    // Open for all - no login required
    setRequestForm({ ...requestForm, fit_type: fitType });
    setSelectedPet(null);
    setShowRequestModal(true);
  };

  const toggleGoal = (goal) => {
    const goals = requestForm.fitness_goals.includes(goal)
      ? requestForm.fitness_goals.filter(g => g !== goal)
      : [...requestForm.fitness_goals, goal];
    setRequestForm({ ...requestForm, fitness_goals: goals });
  };

  const submitRequest = async () => {
    if (!selectedPet) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/fit/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestForm,
          pet_id: selectedPet.id,
          pet_name: selectedPet.name,
          pet_breed: selectedPet.breed,
          pet_age: selectedPet.age,
          pet_weight: selectedPet.weight,
          pet_size: selectedPet.size,
          health_conditions: requestForm.health_conditions.split(',').map(s => s.trim()).filter(Boolean),
          preferred_activities: requestForm.preferred_activities.split(',').map(s => s.trim()).filter(Boolean),
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          user_phone: user?.phone
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Write to Pet Soul - Record fitness activity
        try {
          await fetch(`${API_URL}/api/pet-vault/${selectedPet.id}/record-fit-activity`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              activity_type: requestForm.fit_type,
              venue_name: 'The Doggy Company - Fit',
              duration_minutes: null,
              distance_km: null,
              date: new Date().toISOString().split('T')[0],
              notes: `Goals: ${requestForm.fitness_goals.join(', ')}. Activity level: ${requestForm.current_activity_level}`,
              booking_id: result.request_id
            })
          });
        } catch (soulError) {
          console.warn('Pet Soul update failed (non-blocking):', soulError);
        }
        
        toast({
          title: "Request Submitted! 💪",
          description: `Your fitness request ${result.request_id} has been created. We'll contact you soon!`
        });
        setShowRequestModal(false);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.detail || "Failed to submit request",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPlans = plans.filter(plan => {
    if (selectedType && plan.plan_type !== selectedType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      
      {/* Hero Section - Green/Teal Theme */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 text-white">
        <div className="absolute inset-0">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Pet Fitness" 
            className="w-full h-full object-cover opacity-25 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-700/90 via-emerald-600/80 to-transparent" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Dumbbell className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium">Pet Fitness & Wellness</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Fit Paws,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-emerald-200">
                Happy Hearts
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg">
              Expert fitness plans, weight management, and activity tracking for your furry athlete. Build a healthier, happier life together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => handleStartRequest('assessment')}
                size="lg"
                className="bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-500 hover:to-emerald-500 text-emerald-900 font-semibold px-8 py-6 text-lg rounded-full shadow-2xl shadow-emerald-500/30"
                data-testid="start-fitness-btn"
              >
                <Activity className="w-5 h-5 mr-2" />
                Get Fitness Assessment
              </Button>
              <Button 
                onClick={() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' })}
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-full"
              >
                View Plans
              </Button>
            </div>
            
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
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </div>
      </div>

      {/* Fitness Types Strip */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-4 py-2 rounded-full transition-all whitespace-nowrap ${
                !selectedType ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Programs
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

      {/* Featured Plans */}
      {featuredPlans.length > 0 && !selectedType && (
        <div className="py-12 bg-gradient-to-b from-white to-teal-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-6 h-6 text-amber-500 fill-current" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Programs</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPlans.slice(0, 3).map((plan) => {
                const typeConfig = FIT_TYPES[plan.plan_type] || FIT_TYPES.exercise_plan;
                const Icon = typeConfig.icon;
                
                return (
                  <Card key={plan.id} className="overflow-hidden hover:shadow-xl transition-all group">
                    <div className={`h-40 bg-gradient-to-br ${typeConfig.color} p-6 relative`}>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-amber-400 text-amber-900">
                          <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                        </Badge>
                      </div>
                      <div className="absolute -right-4 -bottom-4 opacity-20">
                        <Icon className="w-32 h-32 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white backdrop-blur-sm">{typeConfig.name}</Badge>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{plan.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" /> {plan.duration_weeks} weeks
                        </span>
                        <span className="flex items-center gap-1">
                          <Timer className="w-4 h-4" /> {plan.sessions_per_week}x/week
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-teal-600">₹{plan.price}</span>
                          {plan.member_price && (
                            <span className="text-sm text-gray-400 ml-2">Members: ₹{plan.member_price}</span>
                          )}
                        </div>
                        <Button onClick={() => handleStartRequest(plan.plan_type)} className="bg-teal-600 hover:bg-teal-700">
                          Start Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* All Plans */}
      <div id="plans" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedType ? FIT_TYPES[selectedType]?.name : 'All Fitness Programs'}
            </h2>
            <span className="text-gray-500">{filteredPlans.length} programs</span>
          </div>
          
          {filteredPlans.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => {
                const typeConfig = FIT_TYPES[plan.plan_type] || FIT_TYPES.exercise_plan;
                const Icon = typeConfig.icon;
                
                return (
                  <Card key={plan.id} className="overflow-hidden hover:shadow-lg transition-all">
                    <div className={`h-32 bg-gradient-to-br ${typeConfig.color} p-4 relative`}>
                      <div className="absolute -right-2 -bottom-2 opacity-20">
                        <Icon className="w-24 h-24 text-white" />
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{typeConfig.name}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{plan.name}</h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{plan.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {plan.pet_sizes?.map((size, i) => (
                          <Badge key={i} variant="outline" className="text-xs capitalize">{size}</Badge>
                        ))}
                        {plan.pet_ages?.map((age, i) => (
                          <Badge key={i} variant="outline" className="text-xs capitalize">{age}</Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span>{plan.duration_weeks} weeks</span>
                        <span>•</span>
                        <span>{plan.sessions_per_week}x/week</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <span className="text-lg font-bold text-gray-900">₹{plan.price}</span>
                          {plan.paw_reward_points > 0 && (
                            <p className="text-xs text-teal-600">🐾 {plan.paw_reward_points} pts</p>
                          )}
                        </div>
                        <Button size="sm" onClick={() => handleStartRequest(plan.plan_type)} className="bg-teal-600 hover:bg-teal-700">
                          Enroll
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Dumbbell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
              <p className="text-gray-500">Check back soon for new fitness programs!</p>
            </Card>
          )}
        </div>
      </div>

      {/* Products & Bundles Section */}
      {(products.length > 0 || bundles.length > 0) && (
        <div id="fit-products" className="py-12 bg-gradient-to-b from-teal-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-6 h-6 text-teal-600" />
              <h2 className="text-2xl font-bold text-gray-900">Fitness Gear & Bundles</h2>
            </div>
            
            {/* Bundles */}
            {bundles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">💪 Value Bundles</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bundles.map((bundle) => (
                    <Card key={bundle.id} className="p-4 border-2 border-teal-200 bg-teal-50/50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                        {bundle.is_recommended && (
                          <Badge className="bg-teal-600">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-teal-600">₹{bundle.price}</span>
                        <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                        <Badge variant="outline" className="text-teal-600">
                          Save ₹{bundle.original_price - bundle.price}
                        </Badge>
                      </div>
                      {bundle.paw_reward_points > 0 && (
                        <p className="text-xs text-teal-600 mb-3">🐾 Earn {bundle.paw_reward_points} Paw Points</p>
                      )}
                      <Button className="w-full bg-teal-600 hover:bg-teal-700">Add to Cart</Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Products - Using ProductCard for clickable product modals */}
            {products.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-teal-500" />
                  Fitness Products
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {products.slice(0, 10).map((product) => (
                    <ProductCard key={product.id} product={product} pillar="fit" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              Fitness Request
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Request Type */}
            <div>
              <Label className="mb-2 block">What would you like help with?</Label>
              <Select value={requestForm.fit_type} onValueChange={(val) => setRequestForm({...requestForm, fit_type: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(FIT_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pet Selection */}
            <div>
              <Label className="mb-2 block">Select Pet</Label>
              {userPets.length === 0 ? (
                <Card className="p-4 text-center bg-amber-50 border-amber-200">
                  <p className="text-amber-700">Please add a pet profile first</p>
                  <Button size="sm" className="mt-2" onClick={() => window.location.href = '/pet-profile'}>
                    Add Pet
                  </Button>
                </Card>
              ) : (
                <div className="space-y-2">
                  {userPets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => setSelectedPet(pet)}
                      className={`w-full p-3 rounded-lg border-2 text-left flex items-center gap-3 transition-all ${
                        selectedPet?.id === pet.id ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-teal-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <PawPrint className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.breed} • {pet.weight}kg</p>
                      </div>
                      {selectedPet?.id === pet.id && (
                        <CheckCircle className="w-5 h-5 text-teal-600 ml-auto" />
                      )}
                    </button>
                  ))}
                  {selectedPet && (
                    <p className="text-xs text-teal-600 mt-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Activity will be saved to {selectedPet.name}'s Pet Soul
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Activity Level */}
            <div>
              <Label className="mb-2 block">Current Activity Level</Label>
              <Select value={requestForm.current_activity_level} onValueChange={(val) => setRequestForm({...requestForm, current_activity_level: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIVITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fitness Goals */}
            <div>
              <Label className="mb-2 block">Fitness Goals (select all that apply)</Label>
              <div className="flex flex-wrap gap-2">
                {FITNESS_GOALS.map((goal) => (
                  <Badge
                    key={goal.value}
                    variant={requestForm.fitness_goals.includes(goal.value) ? 'default' : 'outline'}
                    className={`cursor-pointer ${requestForm.fitness_goals.includes(goal.value) ? 'bg-teal-600' : ''}`}
                    onClick={() => toggleGoal(goal.value)}
                  >
                    {goal.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Health Conditions */}
            <div>
              <Label>Health Conditions (comma-separated, optional)</Label>
              <Input
                value={requestForm.health_conditions}
                onChange={(e) => setRequestForm({...requestForm, health_conditions: e.target.value})}
                placeholder="e.g., arthritis, hip dysplasia"
              />
            </div>

            {/* Preferred Activities */}
            <div>
              <Label>Preferred Activities (comma-separated, optional)</Label>
              <Input
                value={requestForm.preferred_activities}
                onChange={(e) => setRequestForm({...requestForm, preferred_activities: e.target.value})}
                placeholder="e.g., swimming, fetch, agility"
              />
            </div>

            {/* Notes */}
            <div>
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={requestForm.notes}
                onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                placeholder="Any other information about your pet's fitness needs?"
                rows={2}
              />
            </div>

            {/* Submit */}
            <div className="space-y-2 pt-2">
              {/* Validation message */}
              {(!selectedPet || requestForm.fitness_goals.length === 0) && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {!selectedPet ? 'Please select a pet above' : 'Please select at least one fitness goal'}
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={submitRequest}
                  disabled={!selectedPet || submitting || requestForm.fitness_goals.length === 0}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Submit Request</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Mira Contextual Panel */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="fit" />
      </div>
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30">
        <MiraContextPanel pillar="fit" position="bottom" />
      </div>
    </div>
  );
};

export default FitPage;

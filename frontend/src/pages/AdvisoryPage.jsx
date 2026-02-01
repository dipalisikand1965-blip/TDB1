import React, { useState, useEffect } from 'react';
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
import MiraChatWidget from '../components/MiraChatWidget';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import ProductCard from '../components/ProductCard';
import AdminQuickEdit from '../components/AdminQuickEdit';
import { getPetPhotoUrl } from '../utils/petAvatar';
import SEOHead from '../components/SEOHead';
import {
  Brain, Heart, Apple, Home, Stethoscope, GraduationCap,
  CheckCircle, ChevronRight, Sparkles, Star, Loader2, Send,
  ArrowRight, Play, ChevronDown, Users, Calendar, MapPin, Award,
  Phone, Video, MessageCircle, Mail, Clock, PawPrint, Shield, ShoppingBag, AlertCircle
} from 'lucide-react';

// Advisory Type Configuration - Violet/Purple theme
const ADVISORY_TYPES = {
  behaviour: { name: 'Behaviour Consultations', icon: Brain, color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
  nutrition: { name: 'Nutrition Planning', icon: Apple, color: 'from-emerald-500 to-green-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
  senior_care: { name: 'Senior Pet Planning', icon: Heart, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
  new_pet: { name: 'New Pet Guidance', icon: Home, color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  health: { name: 'Health Advisory', icon: Stethoscope, color: 'from-rose-500 to-pink-600', bgColor: 'bg-rose-50', textColor: 'text-rose-600' },
  training: { name: 'Training Consultations', icon: GraduationCap, color: 'from-indigo-500 to-blue-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' }
};

const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild - Just seeking advice' },
  { value: 'moderate', label: 'Moderate - Ongoing concern' },
  { value: 'severe', label: 'Severe - Significant issue' },
  { value: 'urgent', label: 'Urgent - Need immediate help' }
];

const FORMAT_OPTIONS = [
  { value: 'video_call', label: 'Video Call', icon: Video },
  { value: 'phone_call', label: 'Phone Call', icon: Phone },
  { value: 'chat', label: 'Chat/Messaging', icon: MessageCircle },
  { value: 'email', label: 'Email Consultation', icon: Mail }
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80'
];

const AdvisoryPage = () => {
  const { user, token } = useAuth();
  
  const [advisors, setAdvisors] = useState([]);
  const [featuredAdvisors, setFeaturedAdvisors] = useState([]);
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
    advisory_type: 'behaviour',
    concern: '',
    concern_duration: '',
    severity: 'moderate',
    previous_consultations: false,
    current_treatments: '',
    preferred_format: 'video_call',
    preferred_time: '',
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
      const [advisorsRes, featuredRes, productsRes, bundlesRes] = await Promise.all([
        fetch(`${API_URL}/api/advisory/advisors`),
        fetch(`${API_URL}/api/advisory/advisors?is_featured=true`),
        fetch(`${API_URL}/api/advisory/products`),
        fetch(`${API_URL}/api/advisory/bundles`)
      ]);
      
      if (advisorsRes.ok) {
        const data = await advisorsRes.json();
        setAdvisors(data.advisors || []);
      }
      if (featuredRes.ok) {
        const data = await featuredRes.json();
        setFeaturedAdvisors(data.advisors || []);
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

  const handleConsultationRequest = (type = null) => {
    if (!user) {
      window.location.href = '/login?redirect=/advisory';
      return;
    }
    if (type) {
      setRequestForm(prev => ({ ...prev, advisory_type: type }));
    }
    setSelectedPet(null);
    setShowRequestModal(true);
  };

  const submitRequest = async () => {
    if (!selectedPet) {
      toast({
        title: "Select a Pet",
        description: "Please select which pet needs advisory",
        variant: "destructive"
      });
      return;
    }
    
    if (!requestForm.concern.trim()) {
      toast({
        title: "Describe Your Concern",
        description: "Please describe what you need help with",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/advisory/request`, {
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
          pet_species: selectedPet.species || 'dog',
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          user_phone: user?.phone
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Write to Pet Soul - Record advisory consultation
        try {
          await fetch(`${API_URL}/api/pet-vault/${selectedPet.id}/record-advisory-consult`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              advisor_id: 'tdc-advisory',
              advisor_name: 'The Doggy Company Advisory',
              service_type: requestForm.advisory_type,
              consultation_type: requestForm.preferred_format,
              date: new Date().toISOString().split('T')[0],
              duration_minutes: null,
              summary: requestForm.concern.substring(0, 200),
              recommendations: [],
              follow_up_date: null,
              booking_id: result.request_id
            })
          });
        } catch (soulError) {
          console.warn('Pet Soul update failed (non-blocking):', soulError);
        }
        
        toast({
          title: "Request Submitted! 🧠",
          description: result.message
        });
        setShowRequestModal(false);
        setRequestForm({
          advisory_type: 'behaviour',
          concern: '',
          concern_duration: '',
          severity: 'moderate',
          previous_consultations: false,
          current_treatments: '',
          preferred_format: 'video_call',
          preferred_time: '',
          notes: ''
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
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdvisors = selectedType 
    ? advisors.filter(a => a.specialties?.includes(selectedType))
    : advisors;

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50" data-testid="advisory-page">
      {/* SEO Meta Tags */}
      <SEOHead page="advisory" path="/advisory" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Advisory" 
            className="w-full h-full object-cover transition-opacity duration-1000"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <Badge className="bg-white/20 text-white border-0 mb-4">
              <Brain className="w-3 h-3 mr-1" /> Expert Pet Advisory
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Expert Guidance for Your Pet's Wellbeing
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Connect with certified pet behaviourists, nutritionists, and specialists. 
              Get personalized advice for behaviour, health, nutrition, and more.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-white text-violet-600 hover:bg-violet-50"
                onClick={() => handleConsultationRequest()}
                data-testid="request-consultation-btn"
              >
                <Play className="w-5 h-5 mr-2" /> Request Consultation
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                onClick={() => document.getElementById('advisory-services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ChevronDown className="w-5 h-5 mr-2" /> Explore Services
              </Button>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl">
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-2xl font-bold">{advisors.length}+</p>
              <p className="text-sm opacity-80">Expert Advisors</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-2xl font-bold">24hr</p>
              <p className="text-sm opacity-80">Response Time</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-2xl font-bold">4.9</p>
              <p className="text-sm opacity-80">Avg Rating</p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm opacity-80">
            <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Certified Experts</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Flexible Scheduling</span>
            <span className="flex items-center gap-1"><PawPrint className="w-4 h-4" /> Earn Paw Points</span>
          </div>
        </div>
      </section>

      {/* Advisory Types Grid */}
      <section id="advisory-services" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">How Can We Help?</h2>
            <p className="text-gray-600">Choose a service area to get started</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(ADVISORY_TYPES).map(([key, type]) => {
              const Icon = type.icon;
              const isSelected = selectedType === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedType(isSelected ? null : key)}
                  className={`p-4 rounded-xl text-center transition-all ${
                    isSelected 
                      ? `bg-gradient-to-br ${type.color} text-white shadow-lg scale-105` 
                      : `${type.bgColor} hover:shadow-md hover:scale-102`
                  }`}
                  data-testid={`advisory-type-${key}`}
                >
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    isSelected ? 'bg-white/20' : 'bg-white'
                  }`}>
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : type.textColor}`} />
                  </div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {type.name.split(' ')[0]}
                  </p>
                </button>
              );
            })}
          </div>
          
          {selectedType && (
            <div className="mt-6 text-center">
              <Button 
                className={`bg-gradient-to-r ${ADVISORY_TYPES[selectedType].color}`}
                onClick={() => handleConsultationRequest(selectedType)}
              >
                Request {ADVISORY_TYPES[selectedType].name} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Advisors */}
      {featuredAdvisors.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-white to-violet-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="w-6 h-6 text-violet-600" /> Featured Experts
                </h2>
                <p className="text-gray-600">Top-rated advisors ready to help</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {featuredAdvisors.map((advisor) => (
                <Card key={advisor.id} className="overflow-hidden hover:shadow-xl transition-all group" data-testid={`advisor-${advisor.id}`}>
                  <div className="relative h-32 bg-gradient-to-br from-violet-500 to-purple-600">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                        <Users className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    {advisor.is_featured && (
                      <Badge className="absolute top-2 right-2 bg-amber-500">
                        <Star className="w-3 h-3 mr-1" /> Featured
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{advisor.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{advisor.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {advisor.specialties?.slice(0, 2).map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs capitalize">
                          {spec.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium">{advisor.rating || 4.8}</span>
                        <span className="text-xs text-gray-400">({advisor.reviews_count || 0})</span>
                      </div>
                      <span className="text-violet-600 font-semibold">₹{advisor.consultation_fee || 1500}</span>
                    </div>
                    <Button 
                      className="w-full mt-3 bg-violet-600 hover:bg-violet-700"
                      onClick={() => handleConsultationRequest(advisor.specialties?.[0])}
                    >
                      Book Consultation
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Advisors */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-violet-600" /> 
            {selectedType ? `${ADVISORY_TYPES[selectedType]?.name} Experts` : 'All Advisory Experts'}
            <Badge variant="outline" className="ml-2">{filteredAdvisors.length} available</Badge>
          </h2>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
          ) : filteredAdvisors.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filteredAdvisors.map((advisor) => (
                <Card key={advisor.id} className="p-2.5 sm:p-4 hover:shadow-lg transition-all cursor-pointer">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <h3 className="font-semibold text-gray-900 text-xs sm:text-base line-clamp-1">{advisor.name}</h3>
                      <p className="text-[10px] sm:text-sm text-gray-500 line-clamp-2 hidden sm:block">{advisor.description}</p>
                      <div className="hidden sm:flex flex-wrap gap-1 mt-2">
                        {advisor.specialties?.slice(0, 2).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs capitalize">
                            {spec.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 sm:mt-4 pt-2 sm:pt-4 border-t">
                    <div>
                      <span className="text-sm sm:text-lg font-bold text-violet-600">₹{advisor.consultation_fee || 1500}</span>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-[10px] sm:text-sm px-2 sm:px-3 h-6 sm:h-8"
                      onClick={() => handleConsultationRequest(advisor.specialties?.[0])}
                    >
                      Book
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto text-violet-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No advisors found</h3>
              <p className="text-gray-500">Try selecting a different service area</p>
            </Card>
          )}
        </div>
      </section>

      {/* Products & Bundles Section */}
      {(products.length > 0 || bundles.length > 0) && (
        <div id="advisory-products" className="py-12 bg-gradient-to-b from-violet-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-violet-600" />
              <h2 className="text-2xl font-bold text-gray-900">Advisory Essentials & Bundles</h2>
            </div>
            
            {/* Bundles */}
            {bundles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">🎁 Consultation Bundles</h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {bundles.map((bundle) => (
                    <Card key={bundle.id} className="p-2.5 sm:p-4 border-2 border-violet-200 bg-violet-50/50" data-testid={`bundle-${bundle.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-1 sm:mb-2">
                        <h4 className="font-semibold text-gray-900 text-xs sm:text-base line-clamp-1">{bundle.name}</h4>
                        {bundle.is_recommended && (
                          <Badge className="bg-violet-500 text-[10px] sm:text-xs mt-1 sm:mt-0 w-fit">Top Pick</Badge>
                        )}
                      </div>
                      <p className="text-[10px] sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2 hidden sm:block">{bundle.description}</p>
                      {bundle.includes_consultation && (
                        <Badge variant="outline" className="text-violet-600 mb-1 sm:mb-2 text-[10px] sm:text-xs hidden sm:inline-flex">
                          <Video className="w-2 h-2 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> Includes Call
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2 mb-2 sm:mb-3">
                        <span className="text-sm sm:text-xl font-bold text-violet-600">₹{bundle.price}</span>
                        <span className="text-[10px] sm:text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                      </div>
                      <Button className="w-full bg-violet-500 hover:bg-violet-600 text-[10px] sm:text-sm h-7 sm:h-9">Add</Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Products - Using ProductCard for clickable product modals */}
            {products.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-violet-500" />
                  Advisory Products
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {products.slice(0, 10).map((product) => (
                    <ProductCard key={product.id} product={product} pillar="advisory" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-violet-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Not Sure Where to Start?</h2>
          <p className="text-lg opacity-90 mb-8">
            Book a general consultation and our expert team will guide you to the right specialist.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-violet-600 hover:bg-violet-50"
            onClick={() => handleConsultationRequest()}
          >
            Get Free Guidance <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" />
              Request Advisory Consultation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Advisory Type */}
            <div>
              <Label>Type of Advisory</Label>
              <Select 
                value={requestForm.advisory_type} 
                onValueChange={(v) => setRequestForm({...requestForm, advisory_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ADVISORY_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pet Selection */}
            <div>
              <Label className="mb-2 block">Select Pet</Label>
              {userPets.length === 0 ? (
                <Card className="p-4 text-center bg-violet-50 border-violet-200">
                  <p className="text-violet-700">Please add a pet profile first</p>
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
                        selectedPet?.id === pet.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-violet-100 flex items-center justify-center">
                        <img 
                          src={getPetPhotoUrl(pet)} 
                          alt={pet.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <PawPrint className="w-5 h-5 text-violet-600 hidden" />
                      </div>
                      <div>
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-sm text-gray-500">{pet.breed}</p>
                      </div>
                      {selectedPet?.id === pet.id && (
                        <CheckCircle className="w-5 h-5 text-violet-600 ml-auto" />
                      )}
                    </button>
                  ))}
                  {selectedPet && (
                    <p className="text-xs text-violet-600 mt-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Consultation will be saved to {selectedPet.name}'s Pet Soul
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Concern */}
            <div>
              <Label>Describe Your Concern *</Label>
              <Textarea
                value={requestForm.concern}
                onChange={(e) => setRequestForm({...requestForm, concern: e.target.value})}
                placeholder="What would you like help with? Please describe in detail..."
                rows={3}
              />
            </div>

            {/* Severity */}
            <div>
              <Label>How urgent is this?</Label>
              <Select 
                value={requestForm.severity} 
                onValueChange={(v) => setRequestForm({...requestForm, severity: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preferred Format */}
            <div>
              <Label>Preferred Consultation Format</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {FORMAT_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setRequestForm({...requestForm, preferred_format: opt.value})}
                      className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-all ${
                        requestForm.preferred_format === opt.value 
                          ? 'border-violet-500 bg-violet-50' 
                          : 'border-gray-200 hover:border-violet-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${requestForm.preferred_format === opt.value ? 'text-violet-600' : 'text-gray-400'}`} />
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <Label>Additional Notes (Optional)</Label>
              <Textarea
                value={requestForm.notes}
                onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                placeholder="Any other information that might help..."
                rows={2}
              />
            </div>

            {/* Submit */}
            <div className="space-y-2 pt-2">
              {/* Validation message */}
              {(!selectedPet || !requestForm.concern.trim()) && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {!selectedPet ? 'Please select a pet above' : 'Please describe your concern above'}
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={submitRequest}
                  disabled={!selectedPet || !requestForm.concern.trim() || submitting}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
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
      
      {/* === SERVICE CATALOG WITH PRICING === */}
      <ServiceCatalogSection 
        pillar="advisory"
        title="Advisory, Personalised"
        subtitle="Expert consultation services with transparent pricing"
        maxServices={8}
      />
      
      {/* Mira Floating Chat Widget */}
      <MiraChatWidget pillar="advisory" />
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="advisory" position="bottom-left" />
    </div>
  );
};

export default AdvisoryPage;

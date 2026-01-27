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
import MiraContextPanel from '../components/MiraContextPanel';
import AdminQuickEdit from '../components/AdminQuickEdit';
import ProductCard from '../components/ProductCard';
import { getPetPhotoUrl } from '../utils/petAvatar';
import {
import SEOHead from '../components/SEOHead';
  AlertTriangle, Search, Heart, Phone, MapPin, Clock, Ambulance,
  ChevronRight, Sparkles, Star, Loader2, Send, ArrowRight, Play,
  ChevronDown, Users, Shield, Wind, Skull, CloudLightning, ShieldAlert,
  CheckCircle, PawPrint, PhoneCall, Siren, Radio, AlertCircle, ShoppingBag
} from 'lucide-react';

// Emergency Type Configuration - Red/Urgent theme
const EMERGENCY_TYPES = {
  lost_pet: { name: 'Lost Pet Alert', icon: Search, color: 'from-red-600 to-rose-700', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  medical_emergency: { name: 'Medical Emergency', icon: AlertTriangle, color: 'from-red-500 to-orange-600', bgColor: 'bg-red-50', textColor: 'text-red-600' },
  accident_injury: { name: 'Accident & Injury', icon: Ambulance, color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
  poisoning: { name: 'Poisoning', icon: Skull, color: 'from-purple-600 to-violet-700', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
  breathing_distress: { name: 'Breathing Difficulty', icon: Wind, color: 'from-blue-600 to-cyan-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  found_pet: { name: 'Found Pet Report', icon: Heart, color: 'from-green-500 to-emerald-600', bgColor: 'bg-green-50', textColor: 'text-green-600' },
  natural_disaster: { name: 'Natural Disaster', icon: CloudLightning, color: 'from-slate-600 to-gray-700', bgColor: 'bg-slate-50', textColor: 'text-slate-600' },
  aggressive_animal: { name: 'Aggressive Animal', icon: ShieldAlert, color: 'from-amber-600 to-yellow-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600' }
};

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical - Life Threatening', color: 'bg-red-600' },
  { value: 'urgent', label: 'Urgent - Needs Help Fast', color: 'bg-orange-500' },
  { value: 'high', label: 'High - Serious Concern', color: 'bg-amber-500' },
  { value: 'moderate', label: 'Moderate - Need Guidance', color: 'bg-yellow-500' }
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&q=80',
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80'
];

const EmergencyPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  const [partners, setPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [config, setConfig] = useState({});
  
  const [requestForm, setRequestForm] = useState({
    emergency_type: 'medical_emergency',
    severity: 'urgent',
    description: '',
    location: '',
    city: '',
    landmark: '',
    symptoms: '',
    last_seen_location: '',
    last_seen_time: '',
    distinctive_features: '',
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
      const [partnersRes, productsRes, bundlesRes, configRes] = await Promise.all([
        fetch(`${API_URL}/api/emergency/vets`),
        fetch(`${API_URL}/api/emergency/products`),
        fetch(`${API_URL}/api/emergency/bundles`),
        fetch(`${API_URL}/api/emergency/config`)
      ]);
      
      if (partnersRes.ok) {
        const data = await partnersRes.json();
        setPartners(data.vets || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }
      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
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

  const handleEmergencyRequest = (type = null) => {
    if (!user) {
      window.location.href = '/login?redirect=/emergency';
      return;
    }
    if (type) {
      setRequestForm(prev => ({ ...prev, emergency_type: type }));
    }
    setSelectedPet(null);
    setShowRequestModal(true);
  };

  const submitRequest = async () => {
    if (!selectedPet && requestForm.emergency_type !== 'found_pet') {
      toast({
        title: "Select a Pet",
        description: "Please select which pet needs help",
        variant: "destructive"
      });
      return;
    }
    
    if (!requestForm.description.trim()) {
      toast({
        title: "Describe the Emergency",
        description: "Please describe what happened",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/emergency/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...requestForm,
          pet_id: selectedPet?.id,
          pet_name: selectedPet?.name || requestForm.pet_description,
          pet_breed: selectedPet?.breed,
          pet_age: selectedPet?.age,
          pet_species: selectedPet?.species || 'dog',
          user_id: user?.id,
          user_name: user?.name,
          user_email: user?.email,
          user_phone: user?.phone
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "🚨 Emergency Request Submitted!",
          description: result.message
        });
        setShowRequestModal(false);
        setRequestForm({
          emergency_type: 'medical_emergency',
          severity: 'urgent',
          description: '',
          location: '',
          city: '',
          landmark: '',
          symptoms: '',
          last_seen_location: '',
          last_seen_time: '',
          distinctive_features: '',
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

  const featuredPartners = partners.filter(p => p.is_featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-orange-50" data-testid="emergency-page">
      {/* Hero Section - Red/Urgent Theme */}
      <section className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-rose-800 text-white">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={HERO_IMAGES[heroIndex]} 
            alt="Emergency" 
            className="w-full h-full object-cover transition-opacity duration-1000"
          />
        </div>
        
        {/* Animated Emergency Stripes */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-400 via-red-500 to-yellow-400 animate-pulse"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <Badge className="bg-yellow-400 text-red-800 border-0 mb-4 animate-pulse">
              <Siren className="w-3 h-3 mr-1" /> 24/7 Emergency Support
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Pet Emergency? We're Here 24/7
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Lost pet? Medical emergency? Accident? Get immediate help. 
              Our team and partner network are ready to respond.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-white text-red-600 hover:bg-red-50 animate-pulse"
                onClick={() => handleEmergencyRequest()}
                data-testid="report-emergency-btn"
              >
                <AlertTriangle className="w-5 h-5 mr-2" /> Report Emergency
              </Button>
              <a href={`tel:${config.hotline || '+919663185747'}`}>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10"
                >
                  <PhoneCall className="w-5 h-5 mr-2" /> Call Hotline
                </Button>
              </a>
            </div>
            
            {/* Emergency Hotline Banner */}
            <div className="mt-8 p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center animate-pulse">
                  <Phone className="w-6 h-6 text-red-800" />
                </div>
                <div>
                  <p className="text-sm opacity-80">24/7 Emergency Hotline</p>
                  <p className="text-2xl font-bold">{config.hotline || '+91 96631 85747'}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl">
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-2xl font-bold">&lt;15min</p>
              <p className="text-sm opacity-80">Response Time</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-2xl font-bold">{partners.length}+</p>
              <p className="text-sm opacity-80">Emergency Partners</p>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <p className="text-2xl font-bold">24/7</p>
              <p className="text-sm opacity-80">Always Available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Types Grid */}
      <section id="emergency-services" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">What's Your Emergency?</h2>
            <p className="text-gray-600">Select the type to get started quickly</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(EMERGENCY_TYPES).map(([key, type]) => {
              const Icon = type.icon;
              const isSelected = selectedType === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedType(isSelected ? null : key);
                    handleEmergencyRequest(key);
                  }}
                  className={`p-4 rounded-xl text-center transition-all ${
                    isSelected 
                      ? `bg-gradient-to-br ${type.color} text-white shadow-lg scale-105` 
                      : `${type.bgColor} hover:shadow-md hover:scale-102 border-2 border-transparent hover:border-red-200`
                  }`}
                  data-testid={`emergency-type-${key}`}
                >
                  <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    isSelected ? 'bg-white/20' : 'bg-white shadow-sm'
                  }`}>
                    <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : type.textColor}`} />
                  </div>
                  <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {type.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emergency Vets & Partners */}
      {featuredPartners.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-white to-red-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Ambulance className="w-6 h-6 text-red-600" /> Emergency Partners
                </h2>
                <p className="text-gray-600">24/7 vets, ambulances & rescue services</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredPartners.map((partner) => (
                <Card key={partner.id} className="overflow-hidden hover:shadow-xl transition-all group border-2 border-red-100" data-testid={`partner-${partner.id}`}>
                  <div className="relative h-24 bg-gradient-to-br from-red-500 to-rose-600">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        {partner.partner_type === 'ambulance' ? (
                          <Ambulance className="w-8 h-8 text-white" />
                        ) : partner.partner_type === 'helpline' ? (
                          <Phone className="w-8 h-8 text-white" />
                        ) : (
                          <Shield className="w-8 h-8 text-white" />
                        )}
                      </div>
                    </div>
                    {partner.is_24hr && (
                      <Badge className="absolute top-2 right-2 bg-yellow-400 text-red-800">
                        <Clock className="w-3 h-3 mr-1" /> 24/7
                      </Badge>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{partner.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{partner.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {partner.services?.slice(0, 3).map((service) => (
                        <Badge key={service} variant="outline" className="text-xs capitalize">
                          {service.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-medium">{partner.rating || 4.8}</span>
                      </div>
                      {partner.response_time_minutes && (
                        <span className="text-red-600 font-semibold text-sm">
                          ~{partner.response_time_minutes} min
                        </span>
                      )}
                    </div>
                    <a href={`tel:${partner.emergency_phone || partner.phone}`}>
                      <Button 
                        className="w-full mt-3 bg-red-600 hover:bg-red-700"
                      >
                        <Phone className="w-4 h-4 mr-2" /> Call Now
                      </Button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products & Bundles Section */}
      {(products.length > 0 || bundles.length > 0) && (
        <div id="emergency-products" className="py-12 bg-gradient-to-b from-red-50 to-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Emergency Preparedness</h2>
            </div>
            
            {/* Bundles */}
            {bundles.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">🛡️ Safety Bundles</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bundles.map((bundle) => (
                    <Card key={bundle.id} className="p-4 border-2 border-red-200 bg-red-50/50" data-testid={`bundle-${bundle.id}`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{bundle.name}</h4>
                        {bundle.is_recommended && (
                          <Badge className="bg-red-500">Recommended</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{bundle.description}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl font-bold text-red-600">₹{bundle.price}</span>
                        <span className="text-sm text-gray-400 line-through">₹{bundle.original_price}</span>
                        <Badge variant="outline" className="text-red-600">
                          Save ₹{bundle.original_price - bundle.price}
                        </Badge>
                      </div>
                      {bundle.paw_reward_points > 0 && (
                        <p className="text-xs text-red-600 mb-3">🐾 Earn {bundle.paw_reward_points} Paw Points</p>
                      )}
                      <Button 
                        className="w-full bg-red-500 hover:bg-red-600"
                        onClick={() => {
                          addToCart({
                            id: bundle.id,
                            name: bundle.name,
                            price: bundle.price,
                            image: bundle.image || 'https://via.placeholder.com/200?text=Emergency+Kit',
                            quantity: 1
                          });
                          toast({
                            title: "Added to Cart! 🛒",
                            description: `${bundle.name} added to your cart`
                          });
                        }}
                        data-testid={`add-bundle-${bundle.id}`}
                      >
                        Add to Cart
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Products - Using ProductCard for clickable modals */}
            {products.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-red-500" />
                  Emergency Products
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {products.slice(0, 10).map((product) => (
                    <ProductCard key={product.id} product={product} pillar="emergency" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Tips Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Emergency First Aid Tips</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 border-l-4 border-red-500">
              <h3 className="font-semibold text-gray-900 mb-2">🩹 Bleeding</h3>
              <p className="text-sm text-gray-600">Apply firm pressure with clean cloth. Keep pet calm. Seek vet immediately for deep wounds.</p>
            </Card>
            <Card className="p-6 border-l-4 border-purple-500">
              <h3 className="font-semibold text-gray-900 mb-2">☠️ Poisoning</h3>
              <p className="text-sm text-gray-600">Don't induce vomiting unless advised. Note what was ingested. Call poison helpline immediately.</p>
            </Card>
            <Card className="p-6 border-l-4 border-blue-500">
              <h3 className="font-semibold text-gray-900 mb-2">💨 Breathing Issues</h3>
              <p className="text-sm text-gray-600">Keep airways clear. Don't restrict movement. Rush to nearest emergency vet.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-gradient-to-r from-red-600 to-rose-700 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Be Prepared, Not Scared</h2>
          <p className="text-lg opacity-90 mb-8">
            Set up emergency contacts, get safety products, and have peace of mind knowing help is always available.
          </p>
          <Button 
            size="lg" 
            className="bg-white text-red-600 hover:bg-red-50"
            onClick={() => handleEmergencyRequest()}
          >
            Get Started <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Request Modal */}
      <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Report Emergency
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Emergency Type */}
            <div>
              <Label>Type of Emergency *</Label>
              <Select 
                value={requestForm.emergency_type} 
                onValueChange={(v) => setRequestForm({...requestForm, emergency_type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EMERGENCY_TYPES).map(([key, type]) => (
                    <SelectItem key={key} value={key}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div>
              <Label>How serious is this? *</Label>
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

            {/* Pet Selection - Not for Found Pet */}
            {requestForm.emergency_type !== 'found_pet' && (
              <div>
                <Label className="mb-2 block">Select Your Pet *</Label>
                {userPets.length === 0 ? (
                  <Card className="p-4 text-center bg-red-50 border-red-200">
                    <p className="text-red-700">Please add a pet profile first</p>
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
                          selectedPet?.id === pet.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-200'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-red-100 flex items-center justify-center">
                          <img 
                            src={getPetPhotoUrl(pet)} 
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{pet.name}</p>
                          <p className="text-sm text-gray-500">{pet.breed}</p>
                        </div>
                        {selectedPet?.id === pet.id && (
                          <CheckCircle className="w-5 h-5 text-red-600 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <Label>What happened? *</Label>
              <Textarea
                value={requestForm.description}
                onChange={(e) => setRequestForm({...requestForm, description: e.target.value})}
                placeholder="Describe the emergency in detail..."
                rows={3}
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={requestForm.city}
                  onChange={(e) => setRequestForm({...requestForm, city: e.target.value})}
                  placeholder="Mumbai, Delhi..."
                />
              </div>
              <div>
                <Label>Landmark</Label>
                <Input
                  value={requestForm.landmark}
                  onChange={(e) => setRequestForm({...requestForm, landmark: e.target.value})}
                  placeholder="Near..."
                />
              </div>
            </div>

            <div>
              <Label>Full Address/Location</Label>
              <Textarea
                value={requestForm.location}
                onChange={(e) => setRequestForm({...requestForm, location: e.target.value})}
                placeholder="Complete address for emergency response..."
                rows={2}
              />
            </div>

            {/* Lost Pet Specific Fields */}
            {requestForm.emergency_type === 'lost_pet' && (
              <>
                <div>
                  <Label>Last Seen Location</Label>
                  <Input
                    value={requestForm.last_seen_location}
                    onChange={(e) => setRequestForm({...requestForm, last_seen_location: e.target.value})}
                    placeholder="Where was your pet last seen?"
                  />
                </div>
                <div>
                  <Label>Last Seen Time</Label>
                  <Input
                    type="datetime-local"
                    value={requestForm.last_seen_time}
                    onChange={(e) => setRequestForm({...requestForm, last_seen_time: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Distinctive Features</Label>
                  <Textarea
                    value={requestForm.distinctive_features}
                    onChange={(e) => setRequestForm({...requestForm, distinctive_features: e.target.value})}
                    placeholder="Collar color, unique markings, tags..."
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Additional Notes */}
            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={requestForm.notes}
                onChange={(e) => setRequestForm({...requestForm, notes: e.target.value})}
                placeholder="Any other important information..."
                rows={2}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowRequestModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={submitRequest}
                disabled={(requestForm.emergency_type !== 'found_pet' && !selectedPet) || !requestForm.description.trim() || submitting}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <><Siren className="w-4 h-4 mr-2" /> Submit Emergency</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Mira Contextual Panel - Emergency gets special treatment */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-30">
        <MiraContextPanel pillar="emergency" />
      </div>
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-30">
        <MiraContextPanel pillar="emergency" position="bottom" />
      </div>
      
      {/* Admin Quick Edit */}
      <AdminQuickEdit pillar="emergency" position="bottom-left" />
    </div>
  );
};

export default EmergencyPage;

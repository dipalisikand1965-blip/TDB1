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
import MiraChatWidget from '../components/MiraChatWidget';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import SEOHead from '../components/SEOHead';
import {
  Heart, Rainbow, Flower2, Star, Calendar, Phone, Mail, MapPin,
  Clock, ChevronRight, Sparkles, Home, CheckCircle, Users,
  MessageCircle, ArrowRight, Book, Camera, Music, Loader2, X, ShoppingCart
} from 'lucide-react';

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

// Memorial Products
const MEMORIAL_PRODUCTS = [
  {
    id: 'urn_classic',
    name: 'Classic Wooden Urn',
    description: 'Handcrafted wooden urn with engraved nameplate',
    price: 2499,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80',
    category: 'urns'
  },
  {
    id: 'urn_ceramic',
    name: 'Ceramic Paw Print Urn',
    description: 'Beautiful ceramic urn with paw print design',
    price: 3499,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80',
    category: 'urns'
  },
  {
    id: 'paw_print_kit',
    name: 'Forever Paw Print Kit',
    description: 'Create a lasting impression of your pet\'s paw',
    price: 999,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
    category: 'keepsakes'
  },
  {
    id: 'photo_frame',
    name: 'Memorial Photo Frame',
    description: 'Elegant frame with space for photo and fur clipping',
    price: 1499,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
    category: 'keepsakes'
  },
  {
    id: 'memorial_stone',
    name: 'Garden Memorial Stone',
    description: 'Personalised stone for garden remembrance',
    price: 1999,
    image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&q=80',
    category: 'outdoor'
  },
  {
    id: 'memory_book',
    name: 'Pet Memory Book',
    description: 'Beautiful book to preserve precious memories',
    price: 799,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
    category: 'keepsakes'
  }
];

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-rose-50">
      {/* SEO Meta Tags */}
      <SEOHead page="farewell" path="/farewell" />

      {/* Hero Section - Soft and Compassionate */}
      <section className="relative py-20 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-pink-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Rainbow className="w-5 h-5" />
            <span className="font-medium">Farewell with Love</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Honouring the Bond 🌈
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
            Compassionate end-of-life services to celebrate the beautiful life your pet lived and the love you shared.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={() => setShowServiceModal(true)}
              className="bg-white text-purple-700 hover:bg-white/90 px-8 py-3"
              data-testid="farewell-get-support-btn"
            >
              <Heart className="w-5 h-5 mr-2" />
              Get Support Now
            </Button>
            <Button 
              variant="outline"
              className="border-white/50 text-white hover:bg-white/10 px-8 py-3"
              onClick={() => document.getElementById('packages').scrollIntoView({ behavior: 'smooth' })}
            >
              View Services
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* 24/7 Support Notice */}
          <div className="mt-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <Phone className="w-4 h-4" />
            <span className="text-sm">24/7 Compassionate Support: <strong>+91 98765 43210</strong></span>
          </div>
        </div>
      </section>

      {/* Service Categories - 2x2 on mobile, 4 cols on desktop */}
      <section className="py-12 px-4 -mt-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {Object.values(SERVICE_CATEGORIES).map((cat) => {
              const Icon = cat.icon;
              return (
                <Card 
                  key={cat.id}
                  className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedCategory === cat.id ? 'ring-2 ring-purple-500 shadow-lg' : ''
                  }`}
                  onClick={() => setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id)}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${cat.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{cat.name}</h3>
                  <p className="text-sm text-gray-600">{cat.description}</p>
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
          
          <div className="grid md:grid-cols-3 gap-8">
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

      {/* Memorial Products */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              <Star className="w-8 h-8 inline mr-2 text-amber-500" />
              Memorial Keepsakes
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Beautiful ways to preserve the memory of your beloved companion.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {MEMORIAL_PRODUCTS.map((product) => (
              <Card 
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-all group"
              >
                <div 
                  className="relative h-40 overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowProductModal(true);
                  }}
                >
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-600">₹{product.price.toLocaleString()}</span>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      data-testid={`add-to-cart-${product.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
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

      {/* === SERVICE CATALOG WITH PRICING === */}
      <ServiceCatalogSection 
        pillar="farewell"
        title="Farewell, Personalised"
        subtitle="Compassionate services with transparent pricing"
        maxServices={8}
      />

      {/* Mira Floating Chat Widget */}
      <MiraChatWidget pillar="farewell" />

      {/* Service Request Modal */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-purple-500" />
              {selectedPackage ? `Request ${selectedPackage.name}` : 'Request Support'}
            </DialogTitle>
            <DialogDescription>
              We&apos;ll handle everything with care and compassion.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
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
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FarewellPage;

/**
 * MealsPage.jsx
 * Fresh Pet Meals - Nutritious meals and food subscriptions for pets
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import ProductCard from '../components/ProductCard';
import MiraChatWidget from '../components/MiraChatWidget';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import SEOHead from '../components/SEOHead';
import {
  Utensils, Leaf, Heart, Star, ChevronRight, Sparkles,
  Clock, Truck, Shield, CheckCircle, Package, ChevronLeft,
  Calendar, Award, ShoppingBag, Phone, MessageCircle, Send, X
} from 'lucide-react';

// Meal Categories
const MEAL_CATEGORIES = [
  { id: 'fresh', name: 'Fresh Cooked Meals', icon: Utensils, color: 'bg-orange-100 text-orange-600' },
  { id: 'raw', name: 'Raw Food Diet', icon: Leaf, color: 'bg-green-100 text-green-600' },
  { id: 'toppers', name: 'Meal Toppers', icon: Sparkles, color: 'bg-purple-100 text-purple-600' },
  { id: 'subscription', name: 'Meal Plans', icon: Calendar, color: 'bg-blue-100 text-blue-600' },
];

// Benefits
const BENEFITS = [
  { icon: Heart, title: 'Vet-Formulated', desc: 'All recipes designed by pet nutritionists' },
  { icon: Leaf, title: '100% Natural', desc: 'Human-grade ingredients, no fillers' },
  { icon: Truck, title: 'Fresh Delivery', desc: 'Delivered fresh to your door' },
  { icon: Shield, title: 'Satisfaction Guaranteed', desc: 'Full refund if your pet doesn\'t love it' },
];

const MealsPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    petName: '',
    dietType: 'fresh',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setInquiryForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || user.whatsapp || '',
        email: user.email || '',
        petName: user.pets?.[0]?.name || ''
      }));
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch meal-related products
      const [productsRes, bundlesRes, servicesRes] = await Promise.all([
        fetch(`${API_URL}/api/pillar-resolver/products/dine?limit=24`),
        fetch(`${API_URL}/api/dine/bundles`),
        fetch(`${API_URL}/api/services?pillar=care&category=feed`)
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || []);
      }
      
      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundles(data.bundles || []);
      }

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching meals data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit meal inquiry to unified service flow
  const handleMealInquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: 'meal_consultation',
          pillar: 'dine',
          source: 'fresh_meals_page',
          customer: {
            name: inquiryForm.name,
            phone: inquiryForm.phone,
            email: inquiryForm.email
          },
          details: {
            pet_name: inquiryForm.petName,
            diet_type: inquiryForm.dietType,
            notes: inquiryForm.notes,
            request_type: 'fresh_meal_inquiry'
          },
          priority: 'medium',
          intent: 'meal_subscription'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Inquiry Submitted! 🍽️",
          description: `Ticket ${data.ticket_id} created. Our nutrition expert will contact you within 24 hours.`
        });
        setShowInquiryModal(false);
        setInquiryForm(prev => ({ ...prev, notes: '', dietType: 'fresh' }));
      } else {
        throw new Error('Failed to submit inquiry');
      }
    } catch (error) {
      console.error('Error submitting meal inquiry:', error);
      toast({
        title: "Error",
        description: "Failed to submit inquiry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category?.includes(selectedCategory) || p.tags?.includes(selectedCategory));

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <SEOHead 
        title="Fresh Pet Meals | The Doggy Company"
        description="Nutritious, vet-formulated fresh meals for your pet. Human-grade ingredients, delivered fresh to your door."
        path="/dine/meals"
      />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white py-12 sm:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=1200"
            alt="Fresh Pet Food"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Mobile Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="sm:hidden absolute top-4 left-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-6">
            <Utensils className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">Fresh Pet Nutrition</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4">
            Fresh Meals
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-orange-100 max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Nutritious, vet-formulated meals made with human-grade ingredients. Delivered fresh.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 gap-2 h-12 sm:h-11 text-base font-semibold shadow-lg"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <ShoppingBag className="w-5 h-5" />
              Shop Fresh Meals
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="w-full sm:w-auto border-white text-white hover:bg-white/20 gap-2 h-12 sm:h-11 text-base"
              onClick={() => navigate('/meal-plan')}
            >
              <Calendar className="w-5 h-5" />
              Meal Plans
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Categories */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 sm:-mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {MEAL_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button 
                key={cat.id} 
                onClick={() => {
                  // Meal Plans category navigates to dedicated page
                  if (cat.id === 'subscription') {
                    navigate('/meal-plan');
                  } else {
                    setSelectedCategory(cat.id === selectedCategory ? 'all' : cat.id);
                  }
                }}
                className={`p-3 sm:p-4 text-center bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  selectedCategory === cat.id ? 'ring-2 ring-orange-500' : ''
                }`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">{cat.name}</h3>
              </button>
            );
          })}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <Card key={idx} className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-orange-100 rounded-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600">{benefit.desc}</p>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Products Section */}
      <div id="products" className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Fresh Meal Products</h2>
            <p className="text-gray-600 text-sm sm:text-base">
              {selectedCategory === 'all' ? 'All products' : `Showing ${selectedCategory} products`}
            </p>
          </div>
          {selectedCategory !== 'all' && (
            <Button variant="outline" size="sm" onClick={() => setSelectedCategory('all')}>
              Show All
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="p-3 sm:p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} pillar="dine" />
            ))}
          </div>
        ) : (
          <Card className="p-8 sm:p-12 text-center">
            <Utensils className="w-10 h-10 sm:w-12 sm:h-12 text-orange-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-sm text-gray-600">Try selecting a different category or check back later.</p>
          </Card>
        )}
      </div>

      {/* Meal Plan Bundles */}
      {bundles.length > 0 && (
        <div className="bg-orange-50 py-10 sm:py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-6 sm:mb-10">
              <Badge className="bg-orange-500 text-white mb-3">
                <Package className="w-3 h-3 mr-1 inline" /> Value Bundles
              </Badge>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Meal Plan Bundles</h2>
              <p className="text-gray-600 text-sm sm:text-base">Save more with our curated meal bundles</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {bundles.slice(0, 6).map((bundle) => (
                <Card 
                  key={bundle.id} 
                  className="p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => setSelectedBundle(bundle)}
                >
                  <div className="aspect-video rounded-lg mb-4 overflow-hidden relative">
                    {bundle.image ? (
                      <img 
                        src={bundle.image} 
                        alt={bundle.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                        <Package className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-2">{bundle.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{bundle.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-600">₹{bundle.price?.toLocaleString('en-IN') || bundle.bundle_price?.toLocaleString('en-IN')}</span>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                      View Bundle
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bundle Detail Modal */}
      <Dialog open={!!selectedBundle} onOpenChange={(open) => !open && setSelectedBundle(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              {selectedBundle?.name}
            </DialogTitle>
            <button 
              onClick={() => setSelectedBundle(null)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </DialogHeader>
          
          {selectedBundle && (
            <div className="space-y-4">
              {selectedBundle.image && (
                <div className="aspect-video rounded-lg overflow-hidden">
                  <img 
                    src={selectedBundle.image} 
                    alt={selectedBundle.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <p className="text-gray-600">{selectedBundle.description}</p>
              
              {selectedBundle.includes && selectedBundle.includes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Bundle Includes:</h4>
                  <ul className="space-y-1">
                    {selectedBundle.includes.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-2xl font-bold text-orange-600">
                    ₹{selectedBundle.price?.toLocaleString('en-IN') || selectedBundle.bundle_price?.toLocaleString('en-IN')}
                  </span>
                  {selectedBundle.original_price && (
                    <span className="text-sm text-gray-400 line-through ml-2">
                      ₹{selectedBundle.original_price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 gap-2"
                  onClick={() => {
                    addToCart({
                      id: selectedBundle.id,
                      name: selectedBundle.name,
                      price: selectedBundle.price || selectedBundle.bundle_price,
                      image: selectedBundle.image,
                      category: 'bundle',
                      pillar: 'dine'
                    }, 'Bundle', 'dine', 1);
                    toast({
                      title: "Added to Cart! 🛒",
                      description: `${selectedBundle.name} has been added to your cart.`
                    });
                    setSelectedBundle(null);
                  }}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Add to Cart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Service Catalog */}
      <div id="services">
        <ServiceCatalogSection 
          pillar="care"
          title="Nutrition Services"
          subtitle="Expert nutrition consultation and meal planning for your pet"
          filterCategory="feed"
          maxServices={6}
        />
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Start Your Pet&apos;s Fresh Food Journey
          </h2>
          <p className="text-base sm:text-xl text-orange-100 mb-6 sm:mb-8 px-2">
            Join thousands of pet parents who&apos;ve made the switch to fresh, nutritious meals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-white text-orange-600 hover:bg-orange-50 gap-2 h-12 sm:h-11 font-semibold shadow-lg"
              onClick={() => setShowInquiryModal(true)}
              data-testid="meal-inquiry-btn"
            >
              <MessageCircle className="w-5 h-5" />
              Get Nutrition Advice
            </Button>
            <Link to="/dine" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/20 gap-2 h-12 sm:h-11">
                Back to Dine
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Meal Inquiry Modal - Unified Service Flow */}
      <Dialog open={showInquiryModal} onOpenChange={setShowInquiryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-500" />
              Get Personalized Meal Advice
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMealInquiry} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Your Name</label>
              <Input
                value={inquiryForm.name}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Phone Number</label>
              <Input
                value={inquiryForm.phone}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 98765 43210"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={inquiryForm.email}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Pet&apos;s Name</label>
              <Input
                value={inquiryForm.petName}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, petName: e.target.value }))}
                placeholder="Your pet's name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Diet Preference</label>
              <select
                value={inquiryForm.dietType}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, dietType: e.target.value }))}
                className="w-full p-2 border rounded-md text-sm"
              >
                <option value="fresh">Fresh Cooked Meals</option>
                <option value="raw">Raw Food Diet</option>
                <option value="vegetarian">Vegetarian Meals</option>
                <option value="subscription">Meal Subscription Plan</option>
                <option value="weight_management">Weight Management</option>
                <option value="senior">Senior Pet Diet</option>
                <option value="puppy">Puppy Nutrition</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Tell us more</label>
              <Textarea
                value={inquiryForm.notes}
                onChange={(e) => setInquiryForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any allergies, health conditions, or specific requirements..."
                rows={3}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
              disabled={submitting}
            >
              {submitting ? (
                <>Processing...</>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Inquiry
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              Our nutrition expert will contact you within 24 hours
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mira Chat Widget */}
      <MiraChatWidget pillar="dine" />
    </div>
  );
};

export default MealsPage;

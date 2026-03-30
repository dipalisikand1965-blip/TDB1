/**
 * DineNewPage.jsx - Experimental Dine Pillar
 * 
 * Architecture: Catalogue (Self-Serve) + Concierge® (Ticket-Based)
 * One Spine: All non-self-serve actions create tickets tagged with "dine"
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import { 
  Utensils, ShoppingBag, Sparkles, Heart, Apple, Cookie,
  Calendar, Truck, AlertCircle, ChefHat, Droplets, Brain,
  Scale, Pill, Clock, MapPin, Phone, ArrowRight, Check,
  Star, Zap, Leaf, Shield, PawPrint, MessageCircle,
  Package, RefreshCw, Calculator, BookOpen, Search,
  Coffee, UtensilsCrossed, ChevronRight, Plus, Minus
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import MiraChatWidget from '../components/MiraChatWidget';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════

// Hero Section with Pet Personalization
const DineHero = ({ pet, user }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'breakfast';
    if (hour < 17) return 'lunch';
    return 'dinner';
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl p-6 md:p-8 text-white mb-6">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Utensils className="w-5 h-5" />
          <span className="text-sm font-medium text-white/80">DINE</span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {pet ? `What's ${pet.name} having for ${getGreeting()}?` : 'Nourish with Love'}
        </h1>
        
        <p className="text-white/80 text-sm md:text-base max-w-xl mb-4">
          {pet 
            ? `Smart nutrition tailored for ${pet.name}'s needs. Browse our catalogue or let our concierge plan the perfect diet.`
            : 'Daily nourishment, health-forward choices, and expert guidance for your furry family.'
          }
        </p>
        
        {pet && (
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
              <PawPrint className="w-4 h-4" />
              <span className="text-sm font-medium">{pet.name}</span>
              {pet.breed && <span className="text-xs text-white/70">• {pet.breed}</span>}
            </div>
            {pet.weight && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs">
                {pet.weight} kg
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Quick Actions Bar
const QuickActions = ({ onAction, pet }) => {
  const actions = [
    { id: 'meal-plan', icon: Calendar, label: 'Meal Plan', color: 'from-orange-500 to-amber-500', concierge: true },
    { id: 'fresh-food', icon: Leaf, label: 'Fresh Food', color: 'from-green-500 to-emerald-500', concierge: false },
    { id: 'treats', icon: Cookie, label: 'Treats', color: 'from-amber-500 to-yellow-500', concierge: false },
    { id: 'consult', icon: MessageCircle, label: 'Ask Expert', color: 'from-purple-500 to-pink-500', concierge: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-3 mb-6">
      {actions.map(action => (
        <button
          key={action.id}
          onClick={() => onAction(action)}
          className={`relative flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl bg-gradient-to-br ${action.color} text-white transition-all hover:scale-105 active:scale-95 shadow-lg`}
        >
          <action.icon className="w-5 h-5 md:w-6 md:h-6 mb-1" />
          <span className="text-[10px] md:text-xs font-medium text-center">{action.label}</span>
          {action.concierge && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-purple-500" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

// Catalogue Section - Self-Serve Products
const CatalogueSection = ({ title, subtitle, products, onProductClick, onAddToCart, viewAllLink }) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-orange-500" />
            {title}
          </h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
            View All <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {products.slice(0, 4).map(product => (
          <ProductCard 
            key={product.id} 
            product={product} 
            onClick={() => onProductClick(product)}
            onAddToCart={() => onAddToCart(product)}
          />
        ))}
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, onClick, onAddToCart }) => {
  const imageUrl = product.image_url?.startsWith('http')
    ? product.image_url
    : product.image?.startsWith('http')
    ? product.image
    : product.images?.[0] || '';

  return (
    <Card 
      className="group cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300"
      onClick={onClick}
    >
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        <img 
          src={imageUrl} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = '';
          }}
        />
        {product.discount && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[10px]">
            -{product.discount}%
          </Badge>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-orange-600">₹{product.price}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-gray-400 line-through ml-1">₹{product.original_price}</span>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
            className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};

// Concierge® Section - Services that create tickets
const ConciergeSection = ({ title, subtitle, services, onServiceRequest, pet }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map(service => (
          <ConciergeCard 
            key={service.id}
            service={service}
            pet={pet}
            onRequest={() => onServiceRequest(service)}
          />
        ))}
      </div>
    </div>
  );
};

// Concierge® Service Card
const ConciergeCard = ({ service, pet, onRequest }) => {
  return (
    <Card className="p-4 border border-purple-100 bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color || 'from-purple-500 to-pink-500'} flex items-center justify-center flex-shrink-0`}>
          {service.icon && <service.icon className="w-6 h-6 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-0.5">{service.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{service.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {service.price ? (
                <span className="text-sm font-bold text-purple-600">₹{service.price}</span>
              ) : (
                <span className="text-xs text-purple-600 font-medium">Free consultation</span>
              )}
              {service.duration && (
                <span className="text-xs text-gray-400">• {service.duration}</span>
              )}
            </div>
            <Button 
              size="sm" 
              onClick={onRequest}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs px-4"
            >
              {service.cta || 'Request'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Personalization hint */}
      {pet && service.personalized && (
        <div className="mt-3 pt-3 border-t border-purple-100">
          <p className="text-xs text-purple-600 flex items-center gap-1">
            <PawPrint className="w-3 h-3" />
            Tailored for {pet.name}'s needs
          </p>
        </div>
      )}
    </Card>
  );
};

// Category Pills
const CategoryPills = ({ categories, selected, onSelect }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            selected === cat.id
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat.emoji && <span>{cat.emoji}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  );
};

// Smart Tool Card (Calculators, Checkers)
const SmartToolCard = ({ tool, onClick }) => {
  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-all border-2 border-dashed border-gray-200 hover:border-orange-300 bg-white"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          {tool.icon && <tool.icon className="w-5 h-5 text-orange-600" />}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{tool.name}</h3>
          <p className="text-xs text-gray-500">{tool.description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
      </div>
    </Card>
  );
};

// Pantry Section
const PantrySection = ({ items, onReorder }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-orange-500" />
          Mystique's Pantry
        </h2>
        <Button variant="outline" size="sm" className="text-orange-600 border-orange-200">
          <RefreshCw className="w-3 h-3 mr-1" /> Auto-Reorder
        </Button>
      </div>
      
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4">
        {items && items.length > 0 ? (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-white rounded-xl p-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.remaining}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onReorder(item)}>
                  Reorder
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-orange-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Your pantry is empty</p>
            <p className="text-sm text-gray-400">Products you buy will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

const DineNewPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categories
  const categories = [
    { id: 'all', name: 'All', emoji: '🍽️' },
    { id: 'fresh', name: 'Fresh Food', emoji: '🥗' },
    { id: 'treats', name: 'Treats', emoji: '🦴' },
    { id: 'kibble', name: 'Kibble', emoji: '🥣' },
    { id: 'supplements', name: 'Supplements', emoji: '💊' },
    { id: 'bowls', name: 'Bowls & Feeders', emoji: '🍽️' },
  ];

  // Concierge® Services - These create tickets
  const conciergeServices = [
    {
      id: 'meal-plan',
      name: 'Custom Meal Plan',
      description: 'Personalized feeding schedule based on age, weight, and health goals',
      icon: Calendar,
      color: 'from-orange-500 to-amber-500',
      price: null,
      duration: '24-48 hrs',
      cta: 'Build Plan',
      personalized: true,
      ticketType: 'meal_plan_request'
    },
    {
      id: 'nutrition-consult',
      name: 'Nutrition Consultation',
      description: 'One-on-one with our pet nutrition expert',
      icon: MessageCircle,
      color: 'from-purple-500 to-pink-500',
      price: 499,
      duration: '30 min',
      cta: 'Book',
      personalized: true,
      ticketType: 'nutrition_consultation'
    },
    {
      id: 'allergy-diet',
      name: 'Allergy & Special Diet',
      description: 'Elimination diet planning and novel protein recommendations',
      icon: Shield,
      color: 'from-green-500 to-teal-500',
      price: null,
      duration: '48 hrs',
      cta: 'Get Help',
      personalized: true,
      ticketType: 'allergy_diet_request'
    },
    {
      id: 'fresh-subscription',
      name: 'Fresh Food Subscription',
      description: 'Weekly fresh meals delivered, customised for your dog',
      icon: Truck,
      color: 'from-emerald-500 to-green-500',
      price: null,
      duration: 'Setup: 24 hrs',
      cta: 'Set Up',
      personalized: true,
      ticketType: 'subscription_setup'
    },
  ];

  // Smart Tools - Self-serve utilities
  const smartTools = [
    { id: 'portion', name: 'Portion Calculator', description: 'How much should I feed?', icon: Calculator },
    { id: 'safe-food', name: 'Can My Dog Eat This?', description: 'Check if food is safe', icon: Search },
    { id: 'label-decoder', name: 'Label Decoder', description: 'Understand ingredients', icon: BookOpen },
    { id: 'transition', name: 'Food Transition Guide', description: 'Switch foods safely', icon: RefreshCw },
  ];

  // Load user and pets
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Load user's pets
        const petsRes = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (petsRes.ok) {
          const petsData = await petsRes.json();
          setPets(petsData.pets || []);
          if (petsData.pets?.length > 0) {
            setSelectedPet(petsData.pets[0]);
          }
        }

        // Load products
        const productsRes = await fetch(`${API_URL}/api/products?pillar=dine&limit=12`);
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products || []);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle Quick Action
  const handleQuickAction = (action) => {
    if (action.concierge) {
      // Find the matching service and request it
      const service = conciergeServices.find(s => s.id === action.id);
      if (service) {
        handleServiceRequest(service);
      }
    } else {
      // Navigate to category
      setSelectedCategory(action.id === 'treats' ? 'treats' : action.id === 'fresh-food' ? 'fresh' : 'all');
    }
  };

  // Handle Service Request - Creates Ticket (ONE SPINE)
  const handleServiceRequest = async (service) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Please login to request services');
      navigate('/login');
      return;
    }

    try {
      // Create ticket via API
      const response = await fetch(`${API_URL}/api/service-desk/tickets`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pillar: 'dine',
          type: service.ticketType,
          title: service.name,
          description: `Request for ${service.name} for ${selectedPet?.name || 'my pet'}`,
          pet_id: selectedPet?.id,
          priority: 'normal',
          metadata: {
            service_id: service.id,
            pet_name: selectedPet?.name,
            pet_breed: selectedPet?.breed
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Request submitted!`, {
          description: `Your ${service.name} request (#${data.ticket_id || 'pending'}) is being processed.`
        });
      } else {
        throw new Error('Failed to create request');
      }
    } catch (error) {
      console.error('Service request error:', error);
      toast.error('Something went wrong. Please try again.');
    }
  };

  // Handle Product Click
  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`);
  };

  // Handle Add to Cart
  const handleAddToCart = (product) => {
    // TODO: Add to cart logic
    toast.success(`Added ${product.name} to cart!`);
  };

  // Handle Tool Click
  const handleToolClick = (tool) => {
    // These are self-serve tools - no ticket needed
    toast.info(`${tool.name} coming soon!`);
  };

  // Handle Reorder
  const handleReorder = (item) => {
    toast.success(`Reordering ${item.name}...`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dine | The Doggy Company</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 pb-32">
        <div className="max-w-4xl mx-auto px-4 py-6">
          
          {/* Hero */}
          <DineHero pet={selectedPet} user={user} />

          {/* Quick Actions */}
          <QuickActions onAction={handleQuickAction} pet={selectedPet} />

          {/* Category Pills */}
          <CategoryPills 
            categories={categories} 
            selected={selectedCategory} 
            onSelect={setSelectedCategory}
          />

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CATALOGUE SECTION - Self-Serve Products */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Shop Now</span>
              <span className="text-xs text-gray-400">• Self-serve</span>
            </div>
          </div>

          <CatalogueSection
            title={selectedPet ? `Fresh Picks for ${selectedPet.name}` : 'Fresh Food'}
            subtitle="Healthy, fresh meals delivered"
            products={products.filter(p => selectedCategory === 'all' || p.category === selectedCategory).slice(0, 4)}
            onProductClick={handleProductClick}
            onAddToCart={handleAddToCart}
            viewAllLink="/shop?pillar=dine"
          />

          <CatalogueSection
            title="Training Treats"
            subtitle="Rewards that work"
            products={products.filter(p => p.tags?.includes('treats')).slice(0, 4)}
            onProductClick={handleProductClick}
            onAddToCart={handleAddToCart}
            viewAllLink="/shop?pillar=dine&category=treats"
          />

          {/* Smart Tools - Self Serve */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-orange-500" />
              Smart Tools
              <span className="text-xs text-gray-400 font-normal">• Instant answers</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {smartTools.map(tool => (
                <SmartToolCard key={tool.id} tool={tool} onClick={() => handleToolClick(tool)} />
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* CONCIERGE SECTION - Services that create tickets */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Concierge® Arranges</span>
              <span className="text-xs text-gray-400">• We handle it for you</span>
            </div>
          </div>

          <ConciergeSection
            title="Let Us Plan For You"
            subtitle="Expert guidance, personalized for your pet"
            services={conciergeServices}
            onServiceRequest={handleServiceRequest}
            pet={selectedPet}
          />

          {/* Pantry Section */}
          <PantrySection 
            items={[]} // Would be populated from user's purchase history
            onReorder={handleReorder}
          />

          {/* Dining Out Section */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Coffee className="w-5 h-5 text-orange-500" />
              Dining Out
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/dine/cafes')}>
                <MapPin className="w-6 h-6 text-orange-500 mb-2" />
                <h3 className="font-semibold text-sm">Pet-Friendly Cafés</h3>
                <p className="text-xs text-gray-500">Find spots nearby</p>
              </Card>
              <Card className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => handleToolClick({ name: 'Safe Food Checker' })}>
                <UtensilsCrossed className="w-6 h-6 text-orange-500 mb-2" />
                <h3 className="font-semibold text-sm">Can My Dog Eat This?</h3>
                <p className="text-xs text-gray-500">Check any food</p>
              </Card>
            </div>
          </div>

        </div>
      </div>

      {/* Mira Chat Widget */}
      <MiraChatWidget pillar="dine" />
    </>
  );
};

export default DineNewPage;

/**
 * MiraPillarSandbox.jsx
 * 
 * SANDBOX PAGE - Testing new unified Mira experience on pillar pages
 * 
 * CONCEPT:
 * - Beautiful pillar landing (Stay as test)
 * - Catalogue products (with prices, Add to Cart)
 * - Concierge® Cards (no prices, dynamic, "Ask Concierge®")
 * - ONE "Talk to Mira" FAB → Opens full Mira-demo experience
 * 
 * UNIFIED SERVICE FLOW:
 * User Intent → Service Desk Ticket → Admin Notification → Member Notification → Channel
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Heart, MapPin, Star, PawPrint, ChevronRight, 
  ShoppingBag, MessageCircle, Phone, Calendar, Check,
  Home, Building2, Tent, Castle, Trees, Dog, Cat,
  Shield, Award, Clock, Users, Plane, Car
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../utils/api';
import { toast } from '../hooks/use-toast';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';

// Lazy load the full MiraDemoPage for the modal
const MiraDemoPage = lazy(() => import('./MiraDemoPage'));

// Loading fallback
const MiraLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-purple-200">Loading Mira...</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STAY PILLAR DATA (Test Data)
// ═══════════════════════════════════════════════════════════════════════════════

const STAY_EXPERIENCES = [
  {
    id: 'stay-luxury-retreat',
    title: 'Luxury Pet Resort Retreat',
    description: 'A 5-star stay experience curated for your pet\'s personality and preferences',
    icon: '🏰',
    gradient: 'from-amber-500 to-orange-600',
    badge: 'Most Popular',
    highlights: ['Personalized suite', 'Spa treatments', '24/7 care', 'Daily updates']
  },
  {
    id: 'stay-adventure-camp',
    title: 'Adventure Camp Weekend',
    description: 'Outdoor experiences with swimming, hiking, and socialization',
    icon: '🏕️',
    gradient: 'from-green-500 to-emerald-600',
    highlights: ['Nature trails', 'Water play', 'Group activities', 'Campfire stories']
  },
  {
    id: 'stay-home-sitter',
    title: 'In-Home Pet Sitting',
    description: 'A trusted sitter stays at your home so your pet stays comfortable',
    icon: '🏠',
    gradient: 'from-blue-500 to-cyan-600',
    badge: 'Best for Anxious Pets',
    highlights: ['No travel stress', 'Familiar environment', 'Plant & mail care', 'Daily check-ins']
  },
  {
    id: 'stay-medical-boarding',
    title: 'Medical Boarding Care',
    description: 'Specialized care for pets with medical needs or senior pets',
    icon: '🏥',
    gradient: 'from-rose-500 to-pink-600',
    highlights: ['Vet supervision', 'Medication management', 'Special diets', 'Mobility support']
  }
];

const CATALOGUE_PRODUCTS = [
  {
    id: 'stay-bundle-weekend',
    name: 'Weekend Getaway Bundle',
    description: 'Everything your pet needs for a 2-3 day stay',
    price: 1499,
    originalPrice: 1999,
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600',
    tags: ['Popular', '25% OFF']
  },
  {
    id: 'stay-bundle-extended',
    name: 'Extended Stay Kit',
    description: 'Complete comfort package for 5-7 day stays',
    price: 2499,
    originalPrice: 3299,
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
    tags: ['Best Value']
  },
  {
    id: 'stay-comfort-pack',
    name: 'Comfort & Calm Pack',
    description: 'Anxiety-relief items for pets who need extra comfort',
    price: 899,
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600',
    tags: ['For Anxious Pets']
  },
  {
    id: 'stay-adventure-gear',
    name: 'Adventure Ready Kit',
    description: 'Gear for active pets going on outdoor adventures',
    price: 1299,
    image: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=600',
    tags: ['Active Pets']
  }
];

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT CARD COMPONENT (Catalogue - Has Prices)
// ═══════════════════════════════════════════════════════════════════════════════

const ProductCard = ({ product, onAddToCart }) => (
  <Card className="overflow-hidden rounded-2xl hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col">
    {/* IMAGE HEADER - Fixed height */}
    <div className="relative h-[150px] sm:h-[180px] overflow-hidden flex-shrink-0">
      <img 
        src={product.image} 
        alt={product.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      
      {/* Tags */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
        {product.tags?.map((tag, idx) => (
          <Badge key={idx} className="bg-amber-500 text-white text-xs shadow-sm">
            {tag}
          </Badge>
        ))}
      </div>
      
      {/* Name overlay */}
      <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
        <h3 className="font-bold text-sm sm:text-base line-clamp-1 drop-shadow-md">{product.name}</h3>
      </div>
    </div>

    {/* CONTENT - Separate block */}
    <div className="p-3 sm:p-4 bg-white flex flex-col flex-grow">
      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
      
      {/* Price & CTA */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div>
          <span className="text-lg font-bold text-green-600">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through ml-1">₹{product.originalPrice}</span>
          )}
        </div>
        <Button 
          size="sm" 
          className="bg-amber-500 hover:bg-amber-600 text-xs h-9"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
        >
          <ShoppingBag className="w-3 h-3 mr-1" /> Add
        </Button>
      </div>
    </div>
  </Card>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MIRA FAB COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const MiraFAB = ({ onClick, hasActivity }) => (
  <button
    onClick={onClick}
    className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
      hasActivity 
        ? 'bg-gradient-to-r from-pink-500 to-purple-600 animate-pulse shadow-pink-500/50' 
        : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-500/30'
    }`}
    data-testid="mira-fab"
  >
    <div className="relative">
      <PawPrint className="w-7 h-7 text-white" />
      {hasActivity && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-pink-400 rounded-full animate-ping" />
      )}
    </div>
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const MiraPillarSandbox = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  
  // State
  const [showMiraModal, setShowMiraModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPets(data.pets || []);
          if (data.pets?.length > 0) {
            setSelectedPet(data.pets[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching pets:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPets();
  }, [token]);
  
  // Handle add to cart
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.description,
      category: 'stay_bundle',
      pillar: 'stay'
    }, 'Bundle', 'stay', 1);
    
    toast({
      title: "Added to cart!",
      description: product.name
    });
  };
  
  // Handle Mira open with context
  const handleOpenMira = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to talk to Mira",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    setShowMiraModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ═══════════════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-amber-600 via-orange-500 to-red-500 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pillar badge */}
            <Badge className="bg-white/20 text-white border-white/30 mb-4 text-sm">
              <Home className="w-4 h-4 mr-1" /> Stay Pillar • Sandbox
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Where Your Pet Stays
              <span className="block text-amber-200">While You're Away</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              From luxury resorts to trusted home sitters, we find the perfect stay 
              experience tailored to your pet's soul and personality.
            </p>
            
            {/* Pet selector (if logged in) */}
            {selectedPet && (
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  {selectedPet.species === 'cat' ? '🐱' : '🐕'}
                </div>
                <div className="text-left">
                  <p className="font-semibold">{selectedPet.name}</p>
                  <p className="text-xs text-white/70">Finding stays for {selectedPet.name}</p>
                </div>
              </div>
            )}
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-white text-amber-600 hover:bg-amber-50 font-semibold shadow-lg"
                onClick={handleOpenMira}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Talk to Mira
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-white/50 text-white hover:bg-white/10"
                onClick={() => document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Browse Catalogue
              </Button>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CONCIERGE EXPERIENCES (No Prices - "Ask Concierge®")
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <Badge className="bg-purple-100 text-purple-700 mb-4">
            <Sparkles className="w-3 h-3 mr-1" /> Concierge® Creates
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Personalized Stay Experiences
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            These aren't bookings — they're curated experiences. Tell us about your pet, 
            and we'll create something perfect.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STAY_EXPERIENCES.map((exp) => (
            <ConciergeExperienceCard
              key={exp.id}
              pillar="stay"
              title={exp.title}
              description={exp.description}
              icon={exp.icon}
              gradient={exp.gradient}
              badge={exp.badge}
              highlights={exp.highlights}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CATALOGUE PRODUCTS (Has Prices - Add to Cart)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section id="catalogue" className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-amber-100 text-amber-700 mb-4">
              <ShoppingBag className="w-3 h-3 mr-1" /> Catalogue
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Stay Essentials
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Everything your pet needs for a comfortable stay, curated and ready to order.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CATALOGUE_PRODUCTS.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          WHY MIRA SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-white/10 text-white border-white/20 mb-4">
              <PawPrint className="w-3 h-3 mr-1" /> Pet First
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Talk to Mira?
            </h2>
            <p className="text-purple-200 max-w-2xl mx-auto">
              Mira understands your pet's soul. She doesn't just search — she curates 
              experiences based on personality, preferences, and what makes your pet happy.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-400" />
              </div>
              <h3 className="font-bold text-xl mb-2">Soul-Aware</h3>
              <p className="text-purple-200">
                Mira knows your pet's personality, fears, and joys. Recommendations are personal, not generic.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-bold text-xl mb-2">Concierge® Hands</h3>
              <p className="text-purple-200">
                A real human concierge handles the details. We coordinate, verify, and ensure everything is perfect.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <h3 className="font-bold text-xl mb-2">Growing Together</h3>
              <p className="text-purple-200">
                Every conversation teaches Mira more. Your pet's journey becomes richer over time.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg"
              className="bg-white text-purple-900 hover:bg-purple-50 font-semibold shadow-lg"
              onClick={handleOpenMira}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Talking to Mira
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          MIRA FAB (Floating Action Button)
          ═══════════════════════════════════════════════════════════════════════ */}
      <MiraFAB 
        onClick={handleOpenMira}
        hasActivity={selectedPet !== null}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
          MIRA MODAL (Full Mira-Demo Experience)
          ═══════════════════════════════════════════════════════════════════════ */}
      {showMiraModal && (
        <div 
          className="mira-modal-overlay fixed inset-0 z-[9999]"
          style={{ 
            height: '100dvh',
            width: '100vw'
          }}
        >
          {/* Close button - fixed position so it's always visible */}
          <button
            onClick={() => setShowMiraModal(false)}
            className="fixed top-4 right-4 z-[10001] w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors touch-manipulation border border-white/20"
            data-testid="close-mira-modal"
          >
            <span className="text-white text-2xl font-light">×</span>
          </button>
          
          {/* Full MiraDemoPage - takes entire viewport with proper scrolling */}
          <Suspense fallback={<MiraLoader />}>
            <div className="mira-modal-content">
              <MiraDemoPage />
            </div>
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default MiraPillarSandbox;

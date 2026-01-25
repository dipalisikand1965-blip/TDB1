import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  Sparkles, ArrowRight, PawPrint, 
  Truck, Shield, Heart, Star, Clock,
  ChevronRight, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/api';

/**
 * Home Page - Chewy-inspired clean design
 * 
 * Key design principles:
 * - Clean white backgrounds
 * - Minimal gradients
 * - Consistent spacing
 * - Professional typography
 * - Subtle animations
 */

// Featured Categories
const CATEGORIES = [
  { 
    name: 'Birthday Cakes', 
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=400&fit=crop',
    path: '/cakes',
    color: 'bg-pink-50'
  },
  { 
    name: 'Fresh Treats', 
    image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&h=400&fit=crop',
    path: '/treats',
    color: 'bg-orange-50'
  },
  { 
    name: 'Pet Hotels', 
    image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop',
    path: '/stay',
    color: 'bg-blue-50'
  },
  { 
    name: 'Grooming', 
    image: 'https://images.unsplash.com/photo-1611173622933-91942d394b04?w=400&h=400&fit=crop',
    path: '/care?type=grooming',
    color: 'bg-purple-50'
  },
  { 
    name: 'Training', 
    image: 'https://images.unsplash.com/photo-1707595114464-f7e953d5f3bb?w=400&h=400&fit=crop',
    path: '/learn',
    color: 'bg-teal-50'
  },
  { 
    name: 'Pet Travel', 
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop',
    path: '/travel',
    color: 'bg-indigo-50'
  },
];

// Value Props
const VALUE_PROPS = [
  { icon: Truck, text: 'Free Delivery Over ₹999' },
  { icon: Clock, text: 'Same Day Delivery' },
  { icon: Shield, text: 'Quality Guaranteed' },
  { icon: Heart, text: 'Vet Approved' },
];

// Testimonials
const TESTIMONIALS = [
  {
    name: 'Priya S.',
    pet: 'Golden Retriever Mom',
    text: 'Mira remembered my dog\'s allergies and suggested the perfect birthday cake. No other platform does this!',
    rating: 5
  },
  {
    name: 'Rahul M.',
    pet: 'Beagle Dad',
    text: 'The Pet Soul feature is incredible. It\'s like having a personal assistant who knows everything about my pet.',
    rating: 5
  },
  {
    name: 'Ananya K.',
    pet: 'Labrador Mom',
    text: 'Booked a pet-friendly hotel through them. The whole experience was seamless. Highly recommend!',
    rating: 5
  },
];

const Home = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/products?featured=true&limit=8`);
        if (response.ok) {
          const data = await response.json();
          setFeaturedProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    fetchFeatured();
  }, []);

  const handleOpenMira = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  // Redirect logged in users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="home-page">
      
      {/* ========== HERO SECTION - Clean, Chewy-style ========== */}
      <section className="relative bg-gradient-to-r from-teal-600 to-teal-700 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left: Text Content */}
            <div className="text-white">
              <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4">
                India's First Pet Life OS
              </span>
              <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
                Everything Your Pet Needs, 
                <span className="text-teal-200"> Remembered.</span>
              </h1>
              <p className="text-lg text-teal-100 mb-8 max-w-lg">
                From birthday cakes to vet visits — one intelligent system that learns your pet and grows with them.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/membership">
                  <Button 
                    size="lg" 
                    className="bg-white text-teal-700 hover:bg-gray-100 font-semibold px-8 h-12"
                    data-testid="hero-join-btn"
                  >
                    Join Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleOpenMira}
                  className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-12"
                  data-testid="hero-mira-btn"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ask Mira AI
                </Button>
              </div>
            </div>
            
            {/* Right: Hero Image */}
            <div className="hidden md:block relative">
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=500&fit=crop"
                alt="Happy dog"
                className="rounded-2xl shadow-2xl"
              />
              {/* Floating Card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 max-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <PawPrint className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">Pet Soul™</span>
                </div>
                <p className="text-xs text-gray-500">Your pet's intelligent profile that learns & remembers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== VALUE PROPS BAR ========== */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VALUE_PROPS.map((prop, idx) => (
              <div key={idx} className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <prop.icon className="w-5 h-5 text-teal-600" />
                <span className="font-medium">{prop.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SHOP BY CATEGORY ========== */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
            <Link to="/shop" className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat, idx) => (
              <Link 
                key={idx} 
                to={cat.path}
                className="group"
              >
                <div className={`${cat.color} rounded-xl p-4 text-center hover:shadow-md transition-all duration-200`}>
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-white">
                    <img 
                      src={cat.image} 
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== MIRA AI HIGHLIGHT ========== */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
              <div className="text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6" />
                  <span className="text-lg font-semibold">Meet Mira AI</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Your Pet's Personal Concierge
                </h2>
                <p className="text-purple-100 mb-6">
                  Mira knows your pet — their allergies, preferences, and history. 
                  Ask anything, get personalised answers instantly.
                </p>
                <ul className="space-y-2 mb-6">
                  {['Remembers your pet\'s details', 'Suggests products they\'ll love', 'Plans travel & bookings'].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-300" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={handleOpenMira}
                  className="bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                >
                  Try Mira Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <div className="hidden md:block">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <div className="space-y-4">
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-sm text-white/90">
                        "What treats are safe for my dog with chicken allergies?"
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3 ml-4">
                      <p className="text-sm text-gray-700">
                        Based on Bruno's profile, I recommend our Lamb & Sweet Potato treats. 
                        They're grain-free and perfect for dogs with chicken sensitivities! 🐕
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WHY PET SOUL ========== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Why Pet Parents Love Us
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              We're not just a shop. We're your pet's lifelong companion.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🧠',
                title: 'Pet Soul Technology',
                desc: 'One profile that remembers everything — allergies, preferences, medical history, favourite treats.'
              },
              {
                icon: '🎂',
                title: '14 Life Pillars',
                desc: 'From birthday cakes to end-of-life care. We support every moment of your pet\'s journey.'
              },
              {
                icon: '💬',
                title: 'Mira AI Concierge',
                desc: 'An AI that actually knows your pet. Not generic answers — personalised recommendations.'
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center p-6 rounded-xl border border-gray-200 hover:border-teal-200 hover:shadow-md transition-all">
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Loved by Pet Parents
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600 font-bold">{item.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{item.name}</p>
                    <p className="text-gray-500 text-xs">{item.pet}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="py-16 bg-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Give Your Pet the Best?
          </h2>
          <p className="text-teal-100 mb-8 max-w-xl mx-auto">
            Join thousands of pet parents who trust The Doggy Company for their pet's needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/membership">
              <Button 
                size="lg" 
                className="bg-white text-teal-700 hover:bg-gray-100 font-semibold px-8 h-12"
              >
                Get Started Free
              </Button>
            </Link>
            <Link to="/shop">
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-12"
              >
                Browse Shop
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== TRUST BADGES ========== */}
      <section className="py-8 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span>Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <span>Vet Approved Products</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span>4.9/5 Customer Rating</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

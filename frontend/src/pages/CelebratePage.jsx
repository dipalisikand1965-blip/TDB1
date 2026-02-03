/**
 * CelebratePage.jsx
 * 
 * The Celebrate pillar - Birthday celebrations, parties, and special moments for pets.
 * Features Elevated Concierge® Experiences for curated celebrations.
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  PartyPopper, Cake, Gift, Crown, Sparkles, Camera, Users, 
  Calendar, MapPin, ChevronRight, Star, Heart, Music,
  Palette, ShoppingBag, Package, X, Phone, Mail, Dog, Send, ChevronLeft, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { API_URL } from '../utils/api';
import ConciergeExperienceCard from '../components/ConciergeExperienceCard';
import ProductCard from '../components/ProductCard';
import PersonalizedPicks from '../components/PersonalizedPicks';
import SEOHead from '../components/SEOHead';
import MiraChatWidget from '../components/MiraChatWidget';
import ServiceCatalogSection from '../components/ServiceCatalogSection';
import OccasionBoxBuilder from '../components/OccasionBoxBuilder';
import PartyPlanningWizard from '../components/PartyPlanningWizard';
import PawmeterDisplay, { PawmeterBadge } from '../components/PawmeterDisplay';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// Lazy load Soul Explainer for footer link
const SoulExplainerVideo = lazy(() => import('../components/SoulExplainerVideo'));

// Product categories for Celebrate pillar
const celebrateCategories = [
  { id: 'cakes', name: 'Birthday Cakes', icon: Cake, path: '/celebrate/cakes', color: 'bg-pink-100 text-pink-600' },
  { id: 'breed-cakes', name: 'Breed Cakes', icon: Heart, path: '/celebrate/breed-cakes', color: 'bg-purple-100 text-purple-600' },
  { id: 'pupcakes', name: 'Pupcakes & Dognuts', icon: Sparkles, path: '/celebrate/pupcakes', color: 'bg-amber-100 text-amber-600' },
  { id: 'treats', name: 'Treats', icon: Gift, path: '/celebrate/treats', color: 'bg-green-100 text-green-600' },
  { id: 'hampers', name: 'Gift Hampers', icon: ShoppingBag, path: '/celebrate/hampers', color: 'bg-blue-100 text-blue-600' },
  { id: 'accessories', name: 'Party Accessories', icon: PartyPopper, path: '/celebrate/accessories', color: 'bg-rose-100 text-rose-600' },
];

const CelebratePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBoxBuilder, setShowBoxBuilder] = useState(false);
  const [boxOccasion, setBoxOccasion] = useState('birthday');
  const [showPartyWizard, setShowPartyWizard] = useState(false);
  const [showConciergeModal, setShowConciergeModal] = useState(false);
  const [conciergeSubmitting, setConciergeSubmitting] = useState(false);
  const [userPets, setUserPets] = useState([]);
  const [showSoulExplainer, setShowSoulExplainer] = useState(false);
  const { addToCart } = useCart();
  const { user, token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Concierge request form state
  const [conciergeForm, setConciergeForm] = useState({
    name: '',
    phone: '',
    email: '',
    petId: '',
    petName: '',
    occasion: 'birthday',
    celebrationDate: '',
    guestCount: '',
    budget: '',
    specialRequests: ''
  });

  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const pets = data.pets || [];
          setUserPets(pets);
          // Auto-select first pet if only one, or leave for user to choose
          if (pets.length === 1) {
            setConciergeForm(prev => ({
              ...prev,
              petId: pets[0].id,
              petName: pets[0].name
            }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch pets:', error);
      }
    };
    fetchPets();
  }, [token]);

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setConciergeForm(prev => ({
        ...prev,
        name: user.name || '',
        phone: user.phone || user.whatsapp || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  // Listen for openSoulExplainer event from footer
  useEffect(() => {
    const handleOpenExplainer = () => setShowSoulExplainer(true);
    window.addEventListener('openSoulExplainer', handleOpenExplainer);
    return () => window.removeEventListener('openSoulExplainer', handleOpenExplainer);
  }, []);

  // Submit concierge request to unified flow
  const handleConciergeSubmit = async (e) => {
    e.preventDefault();
    setConciergeSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/api/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          type: 'celebration_concierge',
          pillar: 'celebrate',
          source: 'ask_concierge_button',
          customer: {
            name: conciergeForm.name,
            phone: conciergeForm.phone,
            email: conciergeForm.email
          },
          details: {
            pet_name: conciergeForm.petName,
            occasion: conciergeForm.occasion,
            celebration_date: conciergeForm.celebrationDate,
            guest_count: conciergeForm.guestCount,
            budget: conciergeForm.budget,
            special_requests: conciergeForm.specialRequests
          },
          priority: 'high',
          intent: 'celebration_planning'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Request submitted!', {
          description: `Your celebration request #${data.request_id || data.ticket_id} has been received. Our team will contact you within 2 hours.`
        });
        setShowConciergeModal(false);
        // Reset form
        setConciergeForm(prev => ({
          ...prev,
          petName: '',
          occasion: 'birthday',
          celebrationDate: '',
          guestCount: '',
          budget: '',
          specialRequests: ''
        }));
      } else {
        toast.error('Failed to submit request', { description: data.detail || 'Please try again' });
      }
    } catch (error) {
      console.error('Concierge request error:', error);
      toast.error('Network error', { description: 'Please check your connection and try again' });
    } finally {
      setConciergeSubmitting(false);
    }
  };

  // Check for build_box URL param from reminder emails/links
  useEffect(() => {
    const buildBoxParam = searchParams.get('build_box');
    if (buildBoxParam) {
      // Valid occasions: birthday, gotcha_day, festival
      const validOccasions = ['birthday', 'gotcha_day', 'festival'];
      const occasion = validOccasions.includes(buildBoxParam) ? buildBoxParam : 'birthday';
      setBoxOccasion(occasion);
      setShowBoxBuilder(true);
      // Clear the param from URL
      searchParams.delete('build_box');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      // Use new pillar resolver API for rule-based product filtering
      const response = await fetch(`${API_URL}/api/products?pillar=celebrate&limit=12`);
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.products || data || []);
        console.log(`[CelebratePage] Loaded ${data.count} products via pillar resolver`);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBuildBox = (occasion) => {
    // Navigate to the dedicated occasion box page
    navigate(`/occasion-box/${occasion}`);
  };
  
  const handleAddToCart = (items) => {
    items.forEach(item => {
      addToCart({
        id: item.id,
        title: item.title || item.name,
        price: item.price,
        image: item.image_url || item.image || item.images?.[0],
        quantity: 1
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-20 md:pb-0">
      {/* SEO Meta Tags */}
      <SEOHead 
        title="Celebrate - Pet Birthday Cakes & Parties | The Doggy Company"
        description="Make your pet's special day unforgettable with custom cakes, treats, and party planning services."
        path="/celebrate"
      />
      
      {/* Hero Section - Enhanced for mobile */}
      <div className="relative bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white py-12 sm:py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1530041539828-114de669390e?w=1200"
            alt="Pet Celebration"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Floating decorations - repositioned for mobile */}
        <div className="absolute top-6 sm:top-10 left-4 sm:left-10 text-3xl sm:text-4xl animate-bounce opacity-50">🎈</div>
        <div className="absolute top-12 sm:top-20 right-4 sm:right-20 text-2xl sm:text-3xl animate-pulse opacity-50">🎉</div>
        <div className="absolute bottom-6 sm:bottom-10 left-1/4 text-xl sm:text-2xl animate-bounce opacity-50" style={{animationDelay: '0.5s'}}>🎂</div>
        
        {/* Mobile Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="sm:hidden absolute top-4 left-4 z-10 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4 sm:mb-6 animate-fade-in-up">
            <PartyPopper className="w-4 sm:w-5 h-4 sm:h-5" />
            <span className="font-medium text-sm sm:text-base">Every Paw Deserves a Party</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3 sm:mb-4 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            Celebrate
          </h1>
          <p className="text-base sm:text-xl md:text-2xl text-pink-100 max-w-2xl mx-auto mb-6 sm:mb-8 px-2 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Custom cakes, treats & unforgettable celebrations for your furry family members
          </p>
          
          {/* Mobile: Stack buttons, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <Button 
              size="lg" 
              onClick={() => setShowPartyWizard(true)}
              className="w-full sm:w-auto bg-white text-pink-600 hover:bg-pink-50 gap-2 h-12 sm:h-11 text-base font-semibold shadow-lg active:scale-95 transition-transform"
              data-testid="party-planning-wizard-btn"
            >
              <Sparkles className="w-5 h-5" />
              🎉 Plan My Party
            </Button>
            <Button 
              size="lg" 
              onClick={() => handleBuildBox('birthday')}
              className="w-full sm:w-auto bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/40 gap-2 h-12 sm:h-11 text-base font-semibold active:scale-95 transition-transform"
              data-testid="build-birthday-box-btn"
            >
              <Package className="w-5 h-5" />
              Build Birthday Box
            </Button>
            <Link to="/celebrate/birthday-cakes" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/20 gap-2 h-12 sm:h-11 text-base active:scale-95 transition-transform">
                <Cake className="w-5 h-5" />
                Shop Cakes
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Categories - 2x2 grid on mobile, 6 cols on desktop */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 sm:-mt-8 relative z-10">
        {/* 2x2 grid on mobile, 6 cols on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {celebrateCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link key={cat.id} to={cat.path}>
                <Card className="p-3 sm:p-4 text-center hover:shadow-lg transition-all active:scale-95 cursor-pointer bg-white">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-xl flex items-center justify-center ${cat.color}`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight">{cat.name}</h3>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Personalized Picks for User's Pet */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <PersonalizedPicks pillar="celebrate" maxProducts={6} />
      </div>

      {/* Elevated Concierge® Experiences */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-10">
          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 sm:px-4 py-1 mb-3 sm:mb-4 text-xs sm:text-sm">
            <Crown className="w-3 h-3 mr-1 inline" /> Elevated Concierge®
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Celebrations, Perfected
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base px-2">
            More than cakes. Our Celebrate Concierge® orchestrates every detail of your pet&apos;s special day - 
            from intimate gatherings to grand pawties.
          </p>
        </div>

        {/* Elevated Concierge Experiences - 2x2 on mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Ultimate Birthday Bash®"
            description="A complete birthday celebration package with custom cake, decorations, venue, photography & entertainment."
            icon="🎉"
            gradient="from-pink-500 to-rose-500"
            badge="Signature"
            badgeColor="bg-pink-500"
            highlights={[
              "Custom themed decorations",
              "Professional pet photography",
              "Gourmet cake & treats for all guests",
              "Activity planning & coordination"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Gotcha Day Special®"
            description="Celebrate the anniversary of when your furry friend joined your family with a meaningful experience."
            icon="💜"
            gradient="from-purple-500 to-violet-500"
            highlights={[
              "Memory book creation",
              "Professional photoshoot",
              "Custom celebration cake",
              "Special treats package"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Pawty Planning Pro®"
            description="Full-service party planning for pet birthdays, adoption anniversaries, or any celebration."
            icon="🎈"
            gradient="from-amber-500 to-orange-500"
            badge="Popular"
            badgeColor="bg-amber-500"
            highlights={[
              "Guest list management",
              "Venue sourcing & booking",
              "Catering for pets & humans",
              "Entertainment coordination"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Puppy Shower®"
            description="Welcome a new furry family member with a beautifully organized puppy shower celebration."
            icon="🐾"
            gradient="from-cyan-500 to-teal-500"
            highlights={[
              "Baby shower style setup",
              "Gift registry coordination",
              "New parent essentials guide",
              "Photography included"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Pet Wedding Ceremony®"
            description="A magical ceremony for your pet's special union - complete with outfits, venue & photography."
            icon="💒"
            gradient="from-rose-400 to-pink-500"
            highlights={[
              "Custom pet outfits",
              "Venue decoration",
              "Pet-safe cake & treats",
              "Ceremony coordination"
            ]}
          />
          
          <ConciergeExperienceCard
            pillar="celebrate"
            title="Milestone Moments®"
            description="Professional documentation of your pet's special milestones - first birthday, senior celebration, etc."
            icon="📸"
            gradient="from-indigo-500 to-purple-500"
            highlights={[
              "Professional photography session",
              "Custom milestone props",
              "Digital album creation",
              "Social media-ready photos"
            ]}
          />
        </div>
      </div>

      {/* How Concierge® Works */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-gray-900 mb-6 sm:mb-10">
            How Celebrate Concierge® Works
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {[
              { step: 1, icon: '💬', title: 'Share Vision', desc: 'Tell us your dreams' },
              { step: 2, icon: '✨', title: 'We Plan', desc: 'Custom celebration' },
              { step: 3, icon: '🎯', title: 'We Execute', desc: 'Every detail handled' },
              { step: 4, icon: '🎉', title: 'Celebrate!', desc: 'Stress-free magic' }
            ].map((item) => (
              <Card key={item.step} className="p-3 sm:p-6 text-center bg-white">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-4 bg-pink-100 rounded-full flex items-center justify-center text-xl sm:text-2xl">
                  {item.icon}
                </div>
                <div className="text-pink-500 font-bold text-[10px] sm:text-sm mb-1">Step {item.step}</div>
                <h3 className="font-semibold text-gray-900 text-xs sm:text-base mb-0.5 leading-tight">{item.title}</h3>
                <p className="text-[10px] sm:text-sm text-gray-600 leading-tight">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 🎂 SMART CAKE DISCOVERY - Intelligent Filters */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-10">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            🎂 Find the Perfect Cake
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">Tap what matters most to you</p>
        </div>
        
        {/* Smart Filter Pills - Horizontal scroll on mobile */}
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-3 px-3">
            {[
              { emoji: '🐕', label: 'By Breed', filter: 'breed-cakes', desc: 'Labrador, Pug, GSD...' },
              { emoji: '🎁', label: 'Gift Ready', filter: 'gift-hampers', desc: 'Beautifully packaged' },
              { emoji: '🥜', label: 'Allergy Safe', filter: 'allergy-free', desc: 'No wheat, no nuts' },
              { emoji: '💰', label: 'Under ₹500', filter: 'budget', desc: 'Sweet savings' },
              { emoji: '⚡', label: 'Same Day', filter: 'same-day', desc: 'Order now, get today' },
              { emoji: '🏆', label: 'Bestsellers', filter: 'bestsellers', desc: 'Fan favorites' },
              { emoji: '🐱', label: 'Cat Cakes', filter: 'cat-treats', desc: 'Feline friends' },
              { emoji: '✨', label: 'Premium', filter: 'premium', desc: 'Luxury treats' },
            ].map((item) => (
              <Link 
                key={item.filter}
                to={`/celebrate/${item.filter}`}
                className="flex-shrink-0"
              >
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-pink-200 rounded-full hover:border-pink-400 hover:bg-pink-50 transition-all active:scale-95 cursor-pointer shadow-sm">
                  <span className="text-lg sm:text-xl">{item.emoji}</span>
                  <div className="text-left">
                    <span className="font-semibold text-xs sm:text-sm text-gray-800 block leading-tight">{item.label}</span>
                    <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">{item.desc}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {/* Scroll indicator for mobile */}
          <div className="sm:hidden flex justify-center mt-1">
            <span className="text-[10px] text-gray-400">← Swipe for more →</span>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="flex justify-center gap-4 sm:gap-8 mt-4 sm:mt-6 text-center">
          <div>
            <div className="text-lg sm:text-2xl font-bold text-pink-600">50+</div>
            <div className="text-[10px] sm:text-xs text-gray-500">Cake Designs</div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-pink-600">4.9★</div>
            <div className="text-[10px] sm:text-xs text-gray-500">Avg Rating</div>
          </div>
          <div>
            <div className="text-lg sm:text-2xl font-bold text-pink-600">2hr</div>
            <div className="text-[10px] sm:text-xs text-gray-500">Fastest Delivery</div>
          </div>
        </div>
      </div>

      {/* Featured Products - MOBILE: 2 tiles, DESKTOP: 3 tiles */}
      <div className="max-w-6xl mx-auto px-4 py-10 sm:py-16">
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Featured Celebration Items</h2>
            <p className="text-gray-600 text-sm sm:text-base">Hand-picked treats and cakes</p>
          </div>
          <Link to="/celebrate/cakes">
            <Button variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm">
              View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-3 sm:p-4 md:p-6 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3 sm:mb-4"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {featuredProducts.slice(0, 6).map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="p-8 sm:p-12 text-center">
            <Cake className="w-10 h-10 sm:w-12 sm:h-12 text-pink-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Coming Soon!</h3>
            <p className="text-sm text-gray-600">Our celebration products will be available shortly.</p>
          </Card>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Plan the Pawfect Celebration?
          </h2>
          <p className="text-base sm:text-xl text-pink-100 mb-6 sm:mb-8 px-2">
            Let our Celebrate Concierge® create an unforgettable experience for your furry friend.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
            <Button 
              size="lg" 
              className="w-full sm:w-auto bg-white text-pink-600 hover:bg-pink-50 gap-2 h-12 sm:h-11 font-semibold shadow-lg active:scale-95 transition-transform"
              onClick={() => {
                // Ensure form is pre-filled with current user data when opening
                if (user) {
                  setConciergeForm(prev => ({
                    ...prev,
                    name: user.name || prev.name || '',
                    phone: user.phone || user.whatsapp || prev.phone || '',
                    email: user.email || prev.email || ''
                  }));
                }
                setShowConciergeModal(true);
              }}
              data-testid="ask-concierge-btn"
            >
              <Sparkles className="w-5 h-5" />
              Ask Concierge®
            </Button>
            <Link to="/celebrate/birthday-cakes" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/20 gap-2 h-12 sm:h-11 active:scale-95 transition-transform">
                <ShoppingBag className="w-5 h-5" />
                Shop Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      {/* === SERVICE CATALOG WITH PRICING === */}
      <ServiceCatalogSection 
        pillar="celebrate"
        title="Celebrate, Personalised"
        subtitle="See your personalized price based on your city, pet size, and requirements"
        maxServices={8}
      />
      
      {/* Mira Floating Chat Widget */}
      <MiraChatWidget pillar="celebrate" />
      
      {/* Occasion Box Builder Modal */}
      <OccasionBoxBuilder
        isOpen={showBoxBuilder}
        onClose={() => setShowBoxBuilder(false)}
        occasionType={boxOccasion}
        petName="your pet"
        onAddToCart={handleAddToCart}
      />
      
      {/* Ask Concierge Modal - Celebration Request Form */}
      {showConciergeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConciergeModal(false)}>
          <Card className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Ask Concierge®</h2>
                    <p className="text-pink-100 text-sm">Plan the pawfect celebration</p>
                  </div>
                </div>
                <button onClick={() => setShowConciergeModal(false)} className="p-2 hover:bg-white/20 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={handleConciergeSubmit} className="p-5 space-y-4">
              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Your Name *</label>
                  <Input
                    value={conciergeForm.name}
                    onChange={(e) => setConciergeForm({...conciergeForm, name: e.target.value})}
                    placeholder="Your name"
                    required
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">WhatsApp *</label>
                  <Input
                    type="tel"
                    value={conciergeForm.phone}
                    onChange={(e) => setConciergeForm({...conciergeForm, phone: e.target.value})}
                    placeholder="+91 98765 43210"
                    required
                    className="h-11"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
                <Input
                  type="email"
                  value={conciergeForm.email}
                  onChange={(e) => setConciergeForm({...conciergeForm, email: e.target.value})}
                  placeholder="your@email.com"
                  required
                  className="h-11"
                />
              </div>
              
              {/* Pet & Occasion */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Pet's Name *</label>
                  {userPets.length > 1 ? (
                    <select
                      value={conciergeForm.petId}
                      onChange={(e) => {
                        const pet = userPets.find(p => p.id === e.target.value);
                        setConciergeForm({
                          ...conciergeForm, 
                          petId: e.target.value,
                          petName: pet?.name || ''
                        });
                      }}
                      className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    >
                      <option value="">Select your pet...</option>
                      {userPets.map(pet => (
                        <option key={pet.id} value={pet.id}>
                          {pet.name} ({pet.breed || 'Pet'})
                        </option>
                      ))}
                    </select>
                  ) : userPets.length === 1 ? (
                    <div className="h-11 px-3 flex items-center bg-purple-50 border border-purple-200 rounded-md text-gray-900">
                      <Dog className="w-4 h-4 mr-2 text-purple-500" />
                      {userPets[0].name}
                    </div>
                  ) : (
                    <Input
                      value={conciergeForm.petName}
                      onChange={(e) => setConciergeForm({...conciergeForm, petName: e.target.value})}
                      placeholder="Your pet's name"
                      required
                      className="h-11"
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Occasion *</label>
                  <select
                    value={conciergeForm.occasion}
                    onChange={(e) => setConciergeForm({...conciergeForm, occasion: e.target.value})}
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  >
                    <option value="birthday">🎂 Birthday Party</option>
                    <option value="gotcha_day">🏠 Gotcha Day / Adoption Anniversary</option>
                    <option value="first_birthday">🎉 First Birthday (Big One!)</option>
                    <option value="pawty">🐾 Pawty with Friends</option>
                    <option value="photoshoot">📸 Celebration Photoshoot</option>
                    <option value="surprise">🎁 Surprise Celebration</option>
                    <option value="other">✨ Other Special Occasion</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Celebration Date</label>
                  <Input
                    type="date"
                    value={conciergeForm.celebrationDate}
                    onChange={(e) => setConciergeForm({...conciergeForm, celebrationDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Expected Guests</label>
                  <select
                    value={conciergeForm.guestCount}
                    onChange={(e) => setConciergeForm({...conciergeForm, guestCount: e.target.value})}
                    className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select...</option>
                    <option value="intimate">Just us & pet</option>
                    <option value="small">2-5 guests</option>
                    <option value="medium">6-10 guests</option>
                    <option value="large">10+ guests</option>
                    <option value="pet_party">Pet playdate (multiple pets)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Budget Range</label>
                <select
                  value={conciergeForm.budget}
                  onChange={(e) => setConciergeForm({...conciergeForm, budget: e.target.value})}
                  className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select budget...</option>
                  <option value="under_2000">Under ₹2,000</option>
                  <option value="2000_5000">₹2,000 - ₹5,000</option>
                  <option value="5000_10000">₹5,000 - ₹10,000</option>
                  <option value="10000_25000">₹10,000 - ₹25,000</option>
                  <option value="above_25000">₹25,000+</option>
                  <option value="flexible">Flexible - Surprise me!</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Special Requests / Ideas</label>
                <textarea
                  value={conciergeForm.specialRequests}
                  onChange={(e) => setConciergeForm({...conciergeForm, specialRequests: e.target.value})}
                  placeholder="Tell us about your dream celebration - themes, dietary requirements, venue preferences, any special requests..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                />
              </div>
              
              {/* Submit */}
              <Button 
                type="submit" 
                disabled={conciergeSubmitting}
                className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold text-base"
              >
                {conciergeSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Submit Celebration Request
                  </span>
                )}
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                Our Celebrate Concierge® team will contact you within 2 hours to plan your pawfect celebration! 🎉
              </p>
            </form>
          </Card>
        </div>
      )}
      
      {/* Party Planning Wizard Modal */}
      {showPartyWizard && (
        <PartyPlanningWizard 
          onClose={() => setShowPartyWizard(false)}
          onComplete={(data) => {
            toast.success('Party plan submitted! Our concierge will be in touch.');
            setShowPartyWizard(false);
          }}
        />
      )}
      
      {/* Soul Explainer Modal - Triggered by footer link */}
      {showSoulExplainer && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}>
          <SoulExplainerVideo 
            onClose={() => setShowSoulExplainer(false)}
            petName="your pet"
          />
        </Suspense>
      )}
    </div>
  );
};

export default CelebratePage;

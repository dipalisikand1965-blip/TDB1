/**
 * CelebratePage.jsx
 * 
 * The Celebrate pillar - Birthday celebrations, parties, and special moments for pets.
 * Mobile-first world-class design following pillar layout rules.
 * 
 * Layout Rules:
 * - Concierge: Single-column, full-width mobile, centered web, no tiles
 * - Products: 2 tiles/row mobile, 3-4 tiles/row web, square images
 * - Categories: Horizontal scroll on mobile
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PartyPopper, Cake, Gift, Crown, Sparkles, Camera, 
  Calendar, MapPin, ChevronRight, Star, Heart, Music,
  Palette, ShoppingBag, MessageCircle, Phone, ArrowRight,
  Check, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../utils/api';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';

// Product categories for Celebrate pillar
const celebrateCategories = [
  { id: 'cakes', name: 'Birthday Cakes', icon: Cake, emoji: '🎂', color: 'from-pink-500 to-rose-500' },
  { id: 'breed-cakes', name: 'Breed Cakes', icon: Heart, emoji: '💜', color: 'from-purple-500 to-violet-500' },
  { id: 'pupcakes', name: 'Pupcakes', icon: Sparkles, emoji: '✨', color: 'from-amber-500 to-orange-500' },
  { id: 'treats', name: 'Treats', icon: Gift, emoji: '🦴', color: 'from-green-500 to-emerald-500' },
  { id: 'hampers', name: 'Gift Hampers', icon: ShoppingBag, emoji: '🎁', color: 'from-blue-500 to-cyan-500' },
  { id: 'accessories', name: 'Party Items', icon: PartyPopper, emoji: '🎈', color: 'from-rose-500 to-pink-500' },
];

// Concierge experiences - service-led
const conciergeExperiences = [
  {
    id: 'birthday-bash',
    title: 'Ultimate Birthday Bash®',
    tagline: 'The complete celebration experience',
    description: 'Custom cake, decorations, venue, photography & entertainment - all handled for you.',
    icon: '🎉',
    popular: true
  },
  {
    id: 'gotcha-day',
    title: 'Gotcha Day Special®',
    tagline: 'Celebrate your adoption anniversary',
    description: 'Memory book, professional photos, custom cake & treats package.',
    icon: '💜'
  },
  {
    id: 'pawty-planning',
    title: 'Pawty Planning Pro®',
    tagline: 'Full-service party planning',
    description: 'Guest list, venue, catering for pets & humans, entertainment.',
    icon: '🎈'
  }
];

const CelebratePage = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products?pillar=celebrate&limit=8`);
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.products || data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConciergeChat = () => {
    // Open Mira/Pulse with celebrate context
    window.dispatchEvent(new CustomEvent('openPulse', { detail: { context: 'celebrate' } }));
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title="Celebrate - Pet Birthday Cakes & Parties | The Doggy Company"
        description="Make your pet's special day unforgettable with custom cakes, treats, and party planning services."
        path="/celebrate"
      />
      
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION - Immersive, emotional, mobile-first
      ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[70vh] sm:min-h-[60vh] flex items-end overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1530041539828-114de669390e?w=1200&q=80"
            alt="Happy dog with birthday cake"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        
        {/* Floating celebration elements - subtle */}
        <div className="absolute top-20 right-8 text-4xl opacity-60 animate-float">🎈</div>
        <div className="absolute top-32 left-6 text-3xl opacity-50 animate-float" style={{animationDelay: '1s'}}>🎉</div>
        
        {/* Hero Content */}
        <div className="relative w-full px-4 pb-8 sm:pb-12 pt-20">
          <div className="max-w-6xl mx-auto">
            {/* Pillar Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full mb-4">
              <PartyPopper className="w-4 h-4 text-pink-300" />
              <span className="text-sm font-medium text-white/90">Celebrate Pillar</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3 leading-tight">
              Every Paw<br className="sm:hidden" /> Deserves<br className="hidden sm:block" /> a Party
            </h1>
            
            {/* Subheadline - short on mobile */}
            <p className="text-lg sm:text-xl text-white/80 mb-6 max-w-lg">
              Custom cakes, treats & unforgettable celebrations
            </p>
            
            {/* CTA Buttons - thumb-friendly */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="bg-white text-pink-600 hover:bg-pink-50 font-semibold h-14 sm:h-12 text-base rounded-xl shadow-lg"
                onClick={() => navigate('/shop?pillar=celebrate&category=cakes')}
              >
                <Cake className="w-5 h-5 mr-2" />
                Shop Birthday Cakes
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/50 text-white hover:bg-white/20 h-14 sm:h-12 text-base rounded-xl backdrop-blur-sm"
                onClick={handleConciergeChat}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ask Concierge
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CATEGORY QUICK ACCESS - Horizontal scroll on mobile
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-6 sm:py-8 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          {/* Mobile: Horizontal scroll */}
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:grid sm:grid-cols-6 sm:gap-4 sm:overflow-visible">
            {celebrateCategories.map((cat) => (
              <Link 
                key={cat.id} 
                to={`/shop?pillar=celebrate&category=${cat.id}`}
                className="flex-shrink-0"
              >
                <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all hover:scale-105 min-w-[80px] sm:min-w-0">
                  <span className="text-2xl sm:text-3xl">{cat.emoji}</span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">{cat.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CONCIERGE SECTION - Single column, calm, NO tiles/grids
          Purpose: Reassurance, clarity, escalation to human help
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-gradient-to-b from-pink-50/50 to-white">
        <div className="max-w-2xl mx-auto px-4">
          {/* Section Header - Centered, calm */}
          <div className="text-center mb-8">
            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1.5 mb-4 text-xs font-semibold">
              <Crown className="w-3 h-3 mr-1.5 inline" /> Elevated Concierge®
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              We Handle Everything
            </h2>
            <p className="text-gray-600 text-base">
              Tell us your vision. We make it happen.
            </p>
          </div>

          {/* Concierge Experiences - Single column list, NOT tiles */}
          <div className="space-y-4">
            {conciergeExperiences.map((exp) => (
              <div 
                key={exp.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-pink-50 rounded-xl flex items-center justify-center text-2xl sm:text-3xl">
                    {exp.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg">{exp.title}</h3>
                      {exp.popular && (
                        <Badge className="bg-pink-100 text-pink-600 text-xs px-2 py-0.5">Popular</Badge>
                      )}
                    </div>
                    <p className="text-sm text-pink-600 font-medium mb-1">{exp.tagline}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{exp.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Single CTA - Clear action */}
          <div className="mt-8 text-center">
            <Button 
              size="lg"
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-14 sm:h-12 rounded-xl font-semibold shadow-lg"
              onClick={handleConciergeChat}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Chat with Celebrate Concierge
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              Free consultation • Response within minutes
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PRODUCT SECTION - 2 tiles mobile, 4 tiles web, square images
          Card anatomy: Image, Name, Price, Tag, CTA
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Birthday Cakes & Treats</h2>
              <p className="text-sm text-gray-500 mt-0.5">Hand-picked for celebrations</p>
            </div>
            <Link to="/shop?pillar=celebrate">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Product Grid - HARD RULE: 2 cols mobile, 4 cols web */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1.5"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductTile key={product._id || product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Cake className="w-12 h-12 text-pink-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Coming Soon!</h3>
              <p className="text-sm text-gray-600">Celebration products loading...</p>
            </div>
          )}

          {/* View More CTA for mobile */}
          {featuredProducts.length > 0 && (
            <div className="mt-6 text-center sm:hidden">
              <Link to="/shop?pillar=celebrate">
                <Button variant="outline" className="w-full h-12 rounded-xl">
                  View All Celebration Items
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          HOW IT WORKS - Simple steps, single column on mobile
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-10 sm:py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-8">
            How Concierge Works
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {[
              { step: 1, emoji: '💬', title: 'Share', desc: 'Tell us your vision' },
              { step: 2, emoji: '✨', title: 'Plan', desc: 'We craft the details' },
              { step: 3, emoji: '🎯', title: 'Execute', desc: 'Everything handled' },
              { step: 4, emoji: '🎉', title: 'Celebrate', desc: 'Enjoy the moment' }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 bg-white rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-sm">
                  {item.emoji}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          BOTTOM CTA - Clean, single action
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-pink-500 to-purple-500">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to Celebrate?
          </h2>
          <p className="text-pink-100 mb-6">
            Let us create something magical for your furry friend.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-pink-600 hover:bg-pink-50 h-14 sm:h-12 rounded-xl font-semibold"
              onClick={handleConciergeChat}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Start Planning
            </Button>
            <Link to="/shop?pillar=celebrate">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/50 text-white hover:bg-white/20 h-14 sm:h-12 rounded-xl w-full sm:w-auto"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Shop Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   PRODUCT TILE COMPONENT
   Card anatomy: Square image, Name (max 2 lines), Price, Tag, CTA
═══════════════════════════════════════════════════════════════════════ */
const ProductTile = ({ product }) => {
  const navigate = useNavigate();
  
  const productImage = product.image || product.image_url || product.images?.[0] || 
    'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&q=80';
  
  const price = product.price || product.variants?.[0]?.price || 0;
  const comparePrice = product.compare_at_price || product.variants?.[0]?.compare_at_price;
  const isOnSale = comparePrice && comparePrice > price;
  
  // Get key tag (eggless, puppy-safe, etc.)
  const getKeyTag = () => {
    if (product.is_eggless || product.tags?.includes('eggless')) return { label: 'Eggless', color: 'bg-green-100 text-green-700' };
    if (product.tags?.includes('puppy-safe')) return { label: 'Puppy Safe', color: 'bg-blue-100 text-blue-700' };
    if (product.is_veg || product.tags?.includes('veg')) return { label: 'Veg', color: 'bg-emerald-100 text-emerald-700' };
    if (product.tags?.includes('bestseller')) return { label: 'Bestseller', color: 'bg-amber-100 text-amber-700' };
    return null;
  };
  
  const keyTag = getKeyTag();

  return (
    <div 
      className="group cursor-pointer"
      onClick={() => navigate(`/product/${product.id || product._id}`)}
      data-testid={`product-tile-${product.id || product._id}`}
    >
      {/* Square Image Container */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
        <img 
          src={productImage}
          alt={product.name || product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        
        {/* Sale Badge */}
        {isOnSale && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            Sale
          </div>
        )}
        
        {/* Quick Add Button - shows on hover (desktop) */}
        <div className="absolute inset-x-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
          <Button 
            size="sm" 
            className="w-full bg-white/95 text-gray-900 hover:bg-white text-xs h-8 rounded-lg shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              // Add to cart logic
            }}
          >
            Quick Add
          </Button>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="px-0.5">
        {/* Key Tag */}
        {keyTag && (
          <span className={`inline-block text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded-full mb-1 ${keyTag.color}`}>
            {keyTag.label}
          </span>
        )}
        
        {/* Product Name - Max 2 lines */}
        <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
          {product.name || product.title}
        </h3>
        
        {/* Price */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-900 text-sm">
            ₹{typeof price === 'number' ? price.toLocaleString('en-IN') : price}
          </span>
          {isOnSale && (
            <span className="text-gray-400 text-xs line-through">
              ₹{typeof comparePrice === 'number' ? comparePrice.toLocaleString('en-IN') : comparePrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CelebratePage;

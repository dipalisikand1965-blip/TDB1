/**
 * PillarWisePicks.jsx
 * Shows personalized product recommendations grouped by pillar
 * "Picks for [PetName]" - organized by Nourish, Play, Groom, etc.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Sparkles, ShoppingBag, Heart, ChevronRight, Star, Loader2,
  Utensils, Gamepad2, Scissors, Stethoscope, GraduationCap, Home, Plane
} from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

// Pillar configuration with icons and colors
const PILLAR_CONFIG = {
  dine: {
    label: 'Nourish',
    icon: Utensils,
    emoji: '🍽️',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200'
  },
  enjoy: {
    label: 'Play',
    icon: Gamepad2,
    emoji: '🎾',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    borderColor: 'border-violet-200'
  },
  care: {
    label: 'Groom',
    icon: Scissors,
    emoji: '✂️',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200'
  },
  fit: {
    label: 'Fitness',
    icon: Heart,
    emoji: '💪',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  learn: {
    label: 'Learn',
    icon: GraduationCap,
    emoji: '🎓',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  stay: {
    label: 'Stay',
    icon: Home,
    emoji: '🏠',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200'
  },
  travel: {
    label: 'Travel',
    icon: Plane,
    emoji: '✈️',
    color: 'from-indigo-500 to-blue-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200'
  },
  celebrate: {
    label: 'Celebrate',
    icon: Star,
    emoji: '🎂',
    color: 'from-pink-500 to-amber-500',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200'
  }
};

// Pillars to display (ordered)
const DISPLAY_PILLARS = ['dine', 'enjoy', 'care', 'fit', 'celebrate'];

const PillarWisePicks = ({ 
  petId, 
  petName = 'your pet',
  petBreed = '',
  maxItemsPerPillar = 4,
  showAllPillars = false 
}) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToCart } = useCart();
  
  const [pillarPicks, setPillarPicks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePillar, setActivePillar] = useState(null);

  // Fetch recommendations for each pillar
  useEffect(() => {
    const fetchPillarPicks = async () => {
      if (!petId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const pillarsToFetch = showAllPillars ? Object.keys(PILLAR_CONFIG) : DISPLAY_PILLARS;
      const results = {};

      try {
        // Fetch recommendations for each pillar in parallel
        const promises = pillarsToFetch.map(async (pillar) => {
          try {
            const response = await fetch(
              `${API_URL}/api/products/recommendations/for-pet/${petId}?limit=${maxItemsPerPillar + 2}&pillar=${pillar}`,
              { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
            );
            
            if (response.ok) {
              const data = await response.json();
              return { pillar, products: data.recommendations || [] };
            }
          } catch (err) {
            console.debug(`Failed to fetch ${pillar} picks:`, err);
          }
          return { pillar, products: [] };
        });

        const responses = await Promise.all(promises);
        responses.forEach(({ pillar, products }) => {
          if (products.length > 0) {
            results[pillar] = products.slice(0, maxItemsPerPillar);
          }
        });

        setPillarPicks(results);
        
        // Set first pillar with products as active
        const firstPillarWithProducts = pillarsToFetch.find(p => results[p]?.length > 0);
        setActivePillar(firstPillarWithProducts || null);
        
      } catch (err) {
        console.error('Failed to fetch pillar picks:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPillarPicks();
  }, [petId, token, maxItemsPerPillar, showAllPillars]);

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name || product.title,
      price: product.price,
      image: product.image || product.images?.[0],
      quantity: 1
    });
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="ml-3 text-purple-600">Finding picks for {petName}...</span>
        </div>
      </Card>
    );
  }

  if (error || Object.keys(pillarPicks).length === 0) {
    return null;
  }

  const pillarsWithProducts = Object.keys(pillarPicks).filter(p => pillarPicks[p]?.length > 0);

  return (
    <Card className="overflow-hidden border-purple-100 shadow-lg" data-testid="pillar-wise-picks">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-5 sm:p-6 text-white">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">Picks for {petName}</h2>
            <p className="text-white/80 text-sm sm:text-base">
              {petBreed ? `Curated for your ${petBreed}` : 'Personalized just for your pet'}
            </p>
          </div>
        </div>
      </div>

      {/* Pillar Tabs */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {pillarsWithProducts.map((pillar) => {
            const config = PILLAR_CONFIG[pillar];
            const Icon = config?.icon || Star;
            const isActive = activePillar === pillar;
            
            return (
              <button
                key={pillar}
                onClick={() => setActivePillar(pillar)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${config?.color || 'from-purple-500 to-pink-500'} text-white shadow-md` 
                    : `${config?.bgColor || 'bg-gray-100'} ${config?.textColor || 'text-gray-700'} hover:opacity-80`
                }`}
                data-testid={`pillar-tab-${pillar}`}
              >
                <span className="text-base sm:text-lg">{config?.emoji || '🎁'}</span>
                <span className="font-medium text-sm sm:text-base">{config?.label || pillar}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-white text-gray-600'}`}
                >
                  {pillarPicks[pillar]?.length || 0}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4 sm:p-6">
        {activePillar && pillarPicks[activePillar] && (
          <>
            {/* Section Title */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold text-base sm:text-lg ${PILLAR_CONFIG[activePillar]?.textColor || 'text-gray-900'}`}>
                {PILLAR_CONFIG[activePillar]?.emoji} {PILLAR_CONFIG[activePillar]?.label || activePillar} picks for {petName}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/shop?pillar=${activePillar}`)}
                className={`${PILLAR_CONFIG[activePillar]?.textColor || 'text-purple-600'} hover:bg-gray-100 text-xs sm:text-sm`}
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Products */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {pillarPicks[activePillar].map((product, idx) => {
                const config = PILLAR_CONFIG[activePillar];
                
                return (
                  <div 
                    key={product.id || idx}
                    className={`group bg-white rounded-xl sm:rounded-2xl border ${config?.borderColor || 'border-gray-200'} overflow-hidden hover:shadow-lg transition-all cursor-pointer`}
                    onClick={() => navigate(`/product/${product.handle || product.id}`)}
                    data-testid={`pillar-product-${product.id}`}
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      <img 
                        src={product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200'} 
                        alt={product.name || product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200';
                        }}
                      />
                      <Badge className={`absolute top-2 right-2 ${config?.bgColor || 'bg-purple-50'} ${config?.textColor || 'text-purple-700'} text-xs border ${config?.borderColor || 'border-purple-200'}`}>
                        For {petName}
                      </Badge>
                    </div>
                    
                    {/* Product Info */}
                    <div className="p-2.5 sm:p-3">
                      <p className="font-medium text-gray-900 line-clamp-2 text-xs sm:text-sm mb-1.5 leading-snug">
                        {product.name || product.title}
                      </p>
                      
                      {/* Mira Hint */}
                      {product.mira_hint && (
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1 line-clamp-1">
                          <Sparkles className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <span className="truncate">{product.mira_hint}</span>
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm sm:text-base font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="text-xs text-gray-400 line-through ml-1">
                              ₹{product.compare_at_price?.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          className={`bg-gradient-to-r ${config?.color || 'from-purple-500 to-pink-500'} hover:opacity-90 h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-5 border-t border-purple-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-600 text-center sm:text-left">
            <Sparkles className="w-4 h-4 inline mr-1 text-purple-500" />
            All picks are personalized based on {petName}&apos;s breed, age, and preferences
          </p>
          <Button
            onClick={() => navigate('/shop?pillar=recommended')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Shop All for {petName}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PillarWisePicks;

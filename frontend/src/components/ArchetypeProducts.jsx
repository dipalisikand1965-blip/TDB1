/**
 * ArchetypeProducts.jsx
 * Displays products filtered by multi-factor personalization:
 * - Breed match
 * - Archetype personality affinity
 * - Life stage relevance
 * - Health considerations
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sparkles, Heart, Star, Loader2, ShoppingCart } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import { useCart } from '../context/CartContext';
import { ProductDetailModal } from './ProductCard';
import { 
  getPersonalizedGreeting, 
  getProductIntro,
  getArchetypeDisplayInfo,
  getAccentColor,
  getPillarAwareGreeting,
  getPillarAwareProductIntro
} from '../utils/archetypeCopy';

// Archetype color schemes
const ARCHETYPE_COLORS = {
  wild_explorer: { bg: 'from-amber-50 to-orange-50', accent: 'text-amber-600', border: 'border-amber-200' },
  velcro_baby: { bg: 'from-pink-50 to-rose-50', accent: 'text-pink-600', border: 'border-pink-200' },
  social_butterfly: { bg: 'from-purple-50 to-violet-50', accent: 'text-purple-600', border: 'border-purple-200' },
  zen_master: { bg: 'from-teal-50 to-cyan-50', accent: 'text-teal-600', border: 'border-teal-200' },
  royal_dignity: { bg: 'from-indigo-50 to-blue-50', accent: 'text-indigo-600', border: 'border-indigo-200' },
  playful_clown: { bg: 'from-yellow-50 to-lime-50', accent: 'text-yellow-600', border: 'border-yellow-200' },
  guardian_heart: { bg: 'from-red-50 to-rose-50', accent: 'text-red-600', border: 'border-red-200' },
  default: { bg: 'from-gray-50 to-slate-50', accent: 'text-gray-600', border: 'border-gray-200' }
};

// Archetype display names
const ARCHETYPE_NAMES = {
  wild_explorer: 'Wild Explorer',
  velcro_baby: 'Velcro Baby',
  social_butterfly: 'Social Butterfly',
  zen_master: 'Zen Master',
  royal_dignity: 'Royal Dignity',
  playful_clown: 'Playful Clown',
  guardian_heart: 'Guardian Heart'
};

const ArchetypeProducts = ({ 
  pillar, 
  maxProducts = 6,
  showTitle = true,
  className = ''
}) => {
  const { token } = useAuth();
  const { currentPet } = usePillarContext();
  const { addToCart } = useCart();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [petData, setPetData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  useEffect(() => {
    const fetchProducts = async () => {
      if (!currentPet?.id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_URL}/api/mockups/multi-factor-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            pet_id: currentPet.id,
            pillar: pillar,
            limit: maxProducts
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch personalized products');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
        setPetData({
          name: data.pet_name,
          breed: data.pet_breed,
          archetype: data.archetype,
          life_stage: data.life_stage
        });
        
      } catch (err) {
        console.error('Error fetching archetype products:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [currentPet?.id, pillar, token, maxProducts]);
  
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.mockup_url,
      quantity: 1,
      soul_tier: 'soul_made',
      archetype_match: product.archetype_match
    });
  };
  
  // Don't render if no pet selected
  if (!currentPet?.id) {
    return null;
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
        <p className="mt-2 text-gray-500">Finding perfect matches for {currentPet?.name}...</p>
      </div>
    );
  }
  
  // No products found
  if (!products.length) {
    return null;
  }
  
  const colors = ARCHETYPE_COLORS[petData?.archetype] || ARCHETYPE_COLORS.default;
  const archetypeInfo = getArchetypeDisplayInfo(petData?.archetype);
  // Use pillar-aware copy for emergency context
  const greeting = getPillarAwareGreeting(petData?.archetype, petData?.name, petData?.breed, pillar);
  const productIntro = getPillarAwareProductIntro(petData?.archetype, petData?.name, petData?.breed, pillar);
  
  // Override colors for emergency, advisory, and farewell pillars
  const displayColors = pillar === 'emergency' 
    ? { bg: 'from-red-50 to-rose-50', accent: 'text-red-600', border: 'border-red-200' }
    : pillar === 'advisory'
    ? { bg: 'from-violet-50 to-purple-50', accent: 'text-violet-600', border: 'border-violet-200' }
    : pillar === 'farewell'
    ? { bg: 'from-purple-50 to-indigo-50', accent: 'text-purple-600', border: 'border-purple-200' }
    : pillar === 'adopt'
    ? { bg: 'from-green-50 to-emerald-50', accent: 'text-green-600', border: 'border-green-200' }
    : colors;
  
  return (
    <div className={`py-8 ${className}`} data-testid="archetype-products-section">
      {showTitle && (
        <div className={`text-center mb-8 p-6 rounded-2xl bg-gradient-to-r ${displayColors.bg} ${displayColors.border} border`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{pillar === 'emergency' ? '🚨' : pillar === 'advisory' ? '💡' : pillar === 'farewell' ? '💜' : pillar === 'adopt' ? '🏠' : archetypeInfo.emoji}</span>
            <h3 className="text-lg font-semibold text-gray-800">
              {greeting}
            </h3>
            <Sparkles className={`w-5 h-5 ${displayColors.accent}`} />
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            {productIntro}
          </p>
          
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <Badge variant="outline" className={`${displayColors.border} ${displayColors.accent}`}>
              {petData?.breed?.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="border-gray-300 text-gray-600">
              {petData?.life_stage}
            </Badge>
            {pillar !== 'emergency' && pillar !== 'farewell' && (
              <Badge variant="outline" className={`${displayColors.border} ${displayColors.accent}`}>
                {archetypeInfo.name}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card 
            key={product.id}
            className={`overflow-hidden hover:shadow-lg transition-all duration-300 ${colors.border} border cursor-pointer group`}
            onClick={() => {
              setSelectedProduct(product);
              setShowModal(true);
            }}
            data-testid={`archetype-product-${product.id}`}
          >
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
              {product.mockup_url || product.image_url || product.image ? (
                <img
                  src={product.mockup_url || product.image_url || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              {/* Personalization Score Badge */}
              {product.personalization_score > 100 && (
                <div className="absolute top-2 right-2">
                  <Badge className={`bg-gradient-to-r ${colors.bg} ${colors.accent} border ${colors.border}`}>
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    {Math.round((product.personalization_score - 100) / 10)}+ Match
                  </Badge>
                </div>
              )}
              
              {/* Soul Made Badge */}
              <div className="absolute top-2 left-2">
                <Badge className="bg-purple-600 text-white text-xs">
                  Soul Made
                </Badge>
              </div>
            </div>
            
            {/* Product Info */}
            <div className="p-3">
              <h4 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1">
                {product.name}
              </h4>
              
              {/* Personalization Reasons - Whisper text */}
              {product.personalization_reasons?.length > 0 && (
                <p className={`text-xs ${colors.accent} mb-2 flex items-center gap-1 italic`}>
                  <Heart className="w-3 h-3 fill-current" />
                  <span>{product.personalization_reasons[0]}</span>
                </p>
              )}
              
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-gray-900">
                  ₹{product.price?.toLocaleString()}
                </span>
                
                <Button
                  size="sm"
                  variant="outline"
                  className={`${colors.border} ${colors.accent} hover:bg-purple-50`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Product Detail Modal */}
      {showModal && selectedProduct && createPortal(
        <ProductDetailModal
          product={selectedProduct}
          pillar={pillar}
          selectedPet={currentPet}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedProduct(null);
          }}
          onAddToCart={(product) => {
            addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.mockup_url || product.image_url || product.image,
              quantity: 1,
              pillar: pillar
            });
          }}
        />,
        document.body
      )}
    </div>
  );
};

export default ArchetypeProducts;

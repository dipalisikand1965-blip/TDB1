/**
 * PillarPicksSection.jsx
 * 
 * "Mira's Picks for {Pet}" - Inline on pillar pages
 * 
 * CONCIERGE DNA:
 * - Pet First, Always (soul traits → breed → name fallback)
 * - Products from catalogue + Concierge® curated services
 * - Soul intelligence visible where decisions are made
 * 
 * What drives refresh:
 * 1. Chat Intents (what user asked Mira about recently)
 * 2. Seasonal (summer/winter/monsoon rotation)
 * 3. Birthday (upcoming celebrations)
 * 4. Soul Data (allergies, size, breed, age)
 * 5. Breed Knowledge (grooming, exercise, health)
 * 
 * Built in honor of Mira Sikand - The Guiding Angel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ShoppingCart, MessageCircle, Heart, ChevronRight, 
  Package, Clock, RefreshCw, AlertCircle, Check, Star, X, Plus, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getSoulBasedReason } from '../utils/petSoulInference';
import { toast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Filter out known bad placeholder image URLs (seeded by old agent jobs with toy images)
const _resolvePillarImg = (item) => {
  const candidates = [item.watercolor_image, item.cloudinary_url, item.image_url, item.media?.primary_image, item.image, ...(item.images || [])];
  return candidates.find(u => u && u.startsWith('http') && !u.includes('emergentagent.com') && !u.includes('static.prod-images')) || null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// FALLBACK PICKS - Never leave the section empty
// These are soul-driven Concierge® curated items per pillar
// ═══════════════════════════════════════════════════════════════════════════════
const FALLBACK_PICKS_BY_PILLAR = {
  celebrate: [
    { id: 'celebrate-1', name: 'Birthday Cake', description: 'Custom cake made with safe ingredients', why_it_fits: 'Perfect for your special day!', icon: '🎂', concierge: true },
    { id: 'celebrate-2', name: 'Party Decorations Kit', description: 'Paw-ty themed balloons & banners', why_it_fits: 'Make it Instagram-worthy', icon: '🎈', concierge: true }
  ],
  dine: [
    { id: 'dine-1', name: 'Fresh Meal Plan', description: 'Weekly fresh meals tailored to dietary needs', why_it_fits: 'Nutrition matched to preferences', icon: '🍽️', concierge: true },
    { id: 'dine-2', name: 'Treat Subscription', description: 'Monthly curated treats box', why_it_fits: 'Allergy-safe treats delivered', icon: '🦴', concierge: true }
  ],
  care: [
    { id: 'care-1', name: 'Grooming Session', description: 'Full spa day with coat-specific care', why_it_fits: 'Coat care matched to breed', icon: '✨', concierge: true },
    { id: 'care-2', name: 'Wellness Check', description: 'Complete health assessment', why_it_fits: 'Preventive care is love', icon: '🏥', concierge: true }
  ],
  stay: [
    { id: 'stay-1', name: 'Luxury Boarding', description: 'Premium pet hotel with daily updates', why_it_fits: 'Peace of mind when you travel', icon: '🏨', concierge: true },
    { id: 'stay-2', name: 'In-Home Pet Sitter', description: 'Verified sitter in your home', why_it_fits: 'Comfort of familiar surroundings', icon: '🏠', concierge: true }
  ],
  travel: [
    { id: 'travel-1', name: 'Travel Kit', description: 'Everything needed for safe journeys', why_it_fits: 'Stress-free adventures await', icon: '🧳', concierge: true },
    { id: 'travel-2', name: 'Pet-Friendly Itinerary', description: 'Curated destinations that welcome pets', why_it_fits: 'Adventures together!', icon: '✈️', concierge: true }
  ],
  learn: [
    { id: 'learn-1', name: 'Training Session', description: 'One-on-one with certified trainer', why_it_fits: 'Build better habits together', icon: '🎓', concierge: true },
    { id: 'learn-2', name: 'Behavior Consultation', description: 'Expert assessment & personalized plan', why_it_fits: 'Understand their needs', icon: '🧠', concierge: true }
  ],
  enjoy: [
    { id: 'enjoy-1', name: 'Adventure Day Out', description: 'Guided trip to pet-friendly spots', why_it_fits: 'Make memories together', icon: '🌳', concierge: true },
    { id: 'enjoy-2', name: 'Playdate Arrangement', description: 'Social time with compatible pets', why_it_fits: 'Socialization is important', icon: '🐕', concierge: true }
  ],
  fit: [
    { id: 'fit-1', name: 'Fitness Assessment', description: 'Body condition & exercise plan', why_it_fits: 'Health starts with movement', icon: '🏃', concierge: true },
    { id: 'fit-2', name: 'Swim Session', description: 'Low-impact exercise in warm pool', why_it_fits: 'Joint-friendly fitness', icon: '🏊', concierge: true }
  ],
  paperwork: [
    { id: 'paperwork-1', name: 'Document Organization', description: 'Digitize and organize all pet documents', why_it_fits: 'Everything in one place', icon: '📋', concierge: true },
    { id: 'paperwork-2', name: 'Registration Assistance', description: 'Help with licenses & permits', why_it_fits: 'Stay compliant, stress-free', icon: '📜', concierge: true }
  ],
  advisory: [
    { id: 'advisory-1', name: 'Nutrition Consultation', description: 'Expert dietary guidance', why_it_fits: 'Optimal health through diet', icon: '🥗', concierge: true },
    { id: 'advisory-2', name: 'Wellness Plan', description: 'Comprehensive health roadmap', why_it_fits: 'Preventive care saves lives', icon: '💊', concierge: true }
  ],
  services: [
    { id: 'services-1', name: 'Concierge® Membership', description: 'Premium access to all services', why_it_fits: 'VIP treatment for your pet', icon: '👑', concierge: true },
    { id: 'services-2', name: 'Priority Support', description: '24/7 emergency assistance', why_it_fits: 'Peace of mind anytime', icon: '🆘', concierge: true }
  ],
  shop: [
    { id: 'shop-1', name: 'Personal Shopper', description: 'Curated product selection', why_it_fits: 'Perfect picks, every time', icon: '🛍️', concierge: true },
    { id: 'shop-2', name: 'Custom Merchandise', description: 'Personalized with your pet', why_it_fits: 'One-of-a-kind items', icon: '🎁', concierge: true }
  ],
  // FAREWELL - Sensitive memorial products & grief support
  farewell: [
    { id: 'farewell-1', name: 'Memory Keepsake Box', description: 'Handcrafted wooden box for treasured memories', why_it_fits: 'Preserve precious moments forever', icon: '💜', concierge: true, price: 2499 },
    { id: 'farewell-2', name: 'Paw Print Memorial Kit', description: 'Create a lasting impression with clay mold kit', why_it_fits: 'A tangible memory to hold', icon: '🐾', concierge: true, price: 999 },
    { id: 'farewell-3', name: 'Memorial Photo Frame', description: 'Elegant frame with "Forever in my heart" engraving', why_it_fits: 'Display their beautiful face', icon: '🖼️', concierge: true, price: 1499 },
    { id: 'farewell-4', name: 'Rainbow Bridge Book', description: 'Illustrated comfort book about pet loss', why_it_fits: 'Gentle words for healing hearts', icon: '🌈', concierge: true, price: 699 },
    { id: 'farewell-5', name: 'Memorial Garden Stone', description: 'Personalized stone for garden memorial', why_it_fits: 'A peaceful resting tribute', icon: '🪨', concierge: true, price: 1999 },
    { id: 'farewell-6', name: 'Grief Support Session', description: 'One-on-one with pet loss counselor', why_it_fits: 'You don\'t have to grieve alone', icon: '💙', concierge: true, price: 1500 }
  ],
  // ADOPT - New pet parent essentials & rescue support
  adopt: [
    { id: 'adopt-1', name: 'New Pet Welcome Kit', description: 'Everything for the first week with your rescue', why_it_fits: 'Set up for success from day one', icon: '🏠', concierge: true, price: 2999 },
    { id: 'adopt-2', name: 'Decompression Guide', description: '3-3-3 rule guide for rescue dogs', why_it_fits: 'Help them feel safe', icon: '📖', concierge: true, price: 499 },
    { id: 'adopt-3', name: 'Calming Essentials Bundle', description: 'Anxiety wrap, calming spray, comfort toys', why_it_fits: 'Ease the transition stress', icon: '🧸', concierge: true, price: 1999 },
    { id: 'adopt-4', name: 'First Vet Visit Package', description: 'Health check + vaccination + deworming', why_it_fits: 'Start with a clean bill of health', icon: '🏥', concierge: true, price: 2500 },
    { id: 'adopt-5', name: 'Training Starter Kit', description: 'Clicker, treats, training guide for rescues', why_it_fits: 'Build trust through positive training', icon: '🎓', concierge: true, price: 1299 },
    { id: 'adopt-6', name: 'Adoption Counseling', description: 'Support for adjusting to rescue pet', why_it_fits: 'Expert guidance through challenges', icon: '💚', concierge: true, price: 1200 }
  ],
  // EMERGENCY - Quick access emergency products
  emergency: [
    { id: 'emergency-1', name: 'Pet First Aid Kit', description: 'Complete emergency medical supplies', why_it_fits: 'Be prepared for any situation', icon: '🚑', concierge: true, price: 1999 },
    { id: 'emergency-2', name: 'Emergency Vet Hotline', description: '24/7 vet consultation access', why_it_fits: 'Expert help anytime', icon: '📞', concierge: true, price: 999 }
  ]
};

/**
 * Product Detail Modal - Shows before adding to cart
 */
const ProductDetailModal = ({ product, pet, pillar, onClose, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAdd = async () => {
    setIsAdding(true);
    await onAddToCart(product);
    setIsAdding(false);
    onClose();
  };
  
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };
  
  const hasPrice = product.price != null && (typeof product.price === 'number' ? product.price > 0 : true);
  const priceValue = (product.price && typeof product.price === 'object') 
    ? (product.price.amount || product.price.price || product.price.value || 0)
    : (product.price || 0);
  
  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
        
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {(product.image_url || product.image) && !((product.image_url||product.image||'').includes('emergentagent.com')) && !((product.image_url||product.image||'').includes('static.prod-images')) ? (
            <img 
              src={product.image_url || product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
              <Package className="w-16 h-16 text-purple-300" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.seasonal && (
              <Badge className="bg-orange-500 text-white">Seasonal</Badge>
            )}
            {product.trending && (
              <Badge className="bg-pink-500 text-white">Trending</Badge>
            )}
            {product.new && (
              <Badge className="bg-green-500 text-white">New</Badge>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
          
          {/* Description */}
          {product.description && (
            <p className="text-gray-600 text-sm mb-4">{product.description}</p>
          )}
          
          {/* Why it fits - Soul-aware */}
          {product.why_it_fits && (
            <div className="bg-purple-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-purple-700 font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Why it's perfect for {pet?.name || 'your pet'}
              </p>
              <p className="text-sm text-purple-600 mt-1">{product.why_it_fits}</p>
            </div>
          )}
          
          {/* Additional details from mira_hint */}
          {product.mira_hint && (
            <p className="text-xs text-gray-500 italic mb-4">✨ {product.mira_hint}</p>
          )}
          
          {/* Features if available */}
          {product.features && product.features.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Features</h4>
              <ul className="space-y-1">
                {product.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Price & Add to Cart */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {hasPrice ? (
                <>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(priceValue || 0).toLocaleString()}</p>
                </>
              ) : (
                <p className="text-sm text-purple-600 font-medium">Ask Mira for pricing</p>
              )}
            </div>
            <Button
              onClick={handleAdd}
              disabled={isAdding}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6"
            >
              {isAdding ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {hasPrice ? 'Add to Cart' : 'Request Quote'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

/**
 * ProductPickCard - For catalogue products (opens modal before purchase)
 */
const ProductPickCard = ({ pick, pet, pillar, onAddToCart }) => {
  const [showModal, setShowModal] = useState(false);
  
  const hasPrice = pick.price != null && (typeof pick.price === 'number' ? pick.price > 0 : true);
  const priceValue = (pick.price && typeof pick.price === 'object') 
    ? (pick.price.amount || pick.price.price || pick.price.value || 0)
    : (pick.price || 0);
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setShowModal(true)}
        data-testid={`catalogue-product-${pick.id}`}
      >
        {/* Product Image */}
        <div className="aspect-square bg-gray-50 relative overflow-hidden">
          {pick.image_url || pick.image ? (
            <img 
              src={(pick.image_url || pick.image)?.includes('emergentagent.com') || (pick.image_url || pick.image)?.includes('static.prod-images') ? null : (pick.image_url || pick.image)} 
              alt={pick.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {pick.seasonal && (
              <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] font-medium rounded-full">
                Seasonal
              </span>
            )}
            {pick.trending && (
              <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-medium rounded-full">
                Trending
              </span>
            )}
            {pick.new && (
              <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-medium rounded-full">
                New
              </span>
            )}
          </div>
          
          {/* View Details Overlay */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
            <span className="bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1">
              <Eye className="w-3 h-3" /> View Details
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
            {pick.name}
          </h4>
          
          {/* Why it fits - Soul-aware */}
          {pick.why_it_fits && (
            <p className="text-xs text-purple-600 mb-2 line-clamp-2">
              {pick.why_it_fits}
            </p>
          )}
          
          {/* Price & View Button */}
          <div className="flex items-center justify-between mt-2">
            {hasPrice ? (
              <span className="font-semibold text-gray-900">
                ₹{(priceValue || 0).toLocaleString()}
              </span>
            ) : (
              <span className="text-xs text-purple-600">Ask Mira</span>
            )}
            
            <button
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded-full transition-colors"
            >
              <Eye className="w-3 h-3" />
              <span>View</span>
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductDetailModal
            product={pick}
            pet={pet}
            pillar={pillar}
            onClose={() => setShowModal(false)}
            onAddToCart={onAddToCart}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/**
 * ConciergePickCard - For bespoke concierge services
 */
const ConciergePickCard = ({ pick, pet, pillar, onRequestConcierge }) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const soulReason = getSoulBasedReason(pet, pillar);
  
  const handleRequest = async () => {
    setIsRequesting(true);
    await onRequestConcierge(pick);
    setIsRequesting(false);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 overflow-hidden"
    >
      {/* Header Badge */}
      <div className="px-4 pt-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-full">
          <Sparkles className="w-3 h-3" />
          Concierge® Curated
        </span>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 text-base mb-2">
          {pick.name}
        </h4>
        
        {/* Soul-personalized message */}
        <div className="bg-white/60 rounded-lg p-3 mb-3">
          <p className="text-sm text-purple-700 font-medium">
            Designed for {pet?.name || 'your pet'} {soulReason}
          </p>
          {pick.why_it_fits && (
            <p className="text-xs text-gray-600 mt-1 italic">
              "{pick.why_it_fits}"
            </p>
          )}
        </div>
        
        {/* Description */}
        {pick.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {pick.description}
          </p>
        )}
        
        {/* CTA */}
        <button
          onClick={handleRequest}
          disabled={isRequesting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-xl transition-all disabled:opacity-50"
        >
          {isRequesting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <MessageCircle className="w-4 h-4" />
              <span>Let Mira Arrange This</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
        
        {/* Response time */}
        <p className="text-xs text-gray-500 text-center mt-2 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          Pet Concierge® responds within 2 hours
        </p>
      </div>
    </motion.div>
  );
};

/**
 * Main PillarPicksSection Component
 */
const PillarPicksSection = ({ 
  pillar,           // Current pillar (celebrate, dine, stay, etc.)
  pet,              // Current pet object with soul data
  className = ''
}) => {
  const { token } = useAuth();
  const { addToCart, addConciergeRequest, setIsCartOpen } = useCart();
  
  const [picks, setPicks] = useState({ catalogue: [], concierge: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  // Fetch picks for this pillar
  const fetchPillarPicks = useCallback(async () => {
    if (!pet?.id && !pet?.name) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const petIdentifier = pet.id || pet.name;
      const response = await fetch(
        `${API_URL}/api/mira/top-picks/${encodeURIComponent(petIdentifier)}/pillar/${pillar}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch picks');
      }
      
      const data = await response.json();
      
      setPicks({
        catalogue: data.picks || [],
        concierge: data.concierge_picks || []
      });
      setLastFetch(new Date());
      
    } catch (err) {
      console.error('[PillarPicks] Error fetching:', err);
      setError('Could not load personalized picks');
    } finally {
      setLoading(false);
    }
  }, [pet?.id, pet?.name, pillar, token]);
  
  // Initial fetch
  useEffect(() => {
    fetchPillarPicks();
  }, [fetchPillarPicks]);
  
  // Handle adding product to cart
  const handleAddToCart = async (product) => {
    try {
      addToCart({
        id: product.id || product.shopify_id,
        name: product.name,
        price: product.price,
        image: product.image_url || product.image,
        quantity: 1,
        pillar: pillar
      });
      
      toast({
        title: "Added to cart",
        description: `${product.name} added for ${pet?.name || 'your pet'}`,
      });
      
      setIsCartOpen(true);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast({
        title: "Error",
        description: "Could not add to cart",
        variant: "destructive"
      });
    }
  };
  
  // Handle concierge request
  const handleConciergeRequest = async (service) => {
    try {
      const soulReason = getSoulBasedReason(pet, pillar);
      
      addConciergeRequest({
        id: `concierge-${pillar}-${Date.now()}`,
        name: service.name,
        pillar: pillar,
        petId: pet?.id,
        petName: pet?.name,
        soulReason: soulReason,
        description: service.description || service.why_it_fits,
        requestedAt: new Date().toISOString()
      });
      
      toast({
        title: "Request Added",
        description: `${service.name} request added for ${pet?.name || 'your pet'}`,
      });
      
      setIsCartOpen(true);
    } catch (err) {
      console.error('Error adding concierge request:', err);
      toast({
        title: "Error",
        description: "Could not add request",
        variant: "destructive"
      });
    }
  };
  
  // Don't render if no pet
  if (!pet) return null;
  
  // Loading state
  if (loading) {
    return (
      <div className={`py-8 ${className}`}>
        <div className="flex items-center justify-center gap-3 text-gray-500">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading Mira's picks for {pet.name}...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    // Use fallback picks on error instead of showing error
    const fallbackPicks = FALLBACK_PICKS_BY_PILLAR[pillar] || [];
    if (fallbackPicks.length === 0) {
      return (
        <div className={`py-8 ${className}`}>
          <div className="flex items-center justify-center gap-3 text-gray-500">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button 
              onClick={fetchPillarPicks}
              className="text-purple-600 hover:text-purple-700 underline"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    // Fall through to render with fallback picks
  }
  
  // Get effective picks - use fallback if API returns empty
  const hasPicks = picks.catalogue.length > 0 || picks.concierge.length > 0;
  const effectivePicks = hasPicks 
    ? picks 
    : { catalogue: [], concierge: FALLBACK_PICKS_BY_PILLAR[pillar] || [] };
  
  // Still nothing? Don't render
  if (effectivePicks.catalogue.length === 0 && effectivePicks.concierge.length === 0) {
    return null;
  }
  
  const soulReason = getSoulBasedReason(pet, pillar);
  
  return (
    <section className={`py-8 ${className}`} data-testid="pillar-picks-section">
      {/* Section Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Mira's Picks for {pet.name}
            </h2>
            {soulReason && (
              <p className="text-sm text-purple-600">
                {soulReason}
              </p>
            )}
          </div>
        </div>
        
        {/* Refresh indicator */}
        {lastFetch && hasPicks && (
          <p className="text-xs text-gray-400 flex items-center gap-1 ml-13">
            <Clock className="w-3 h-3" />
            Updated based on {pet.name}'s profile & your conversations with Mira
          </p>
        )}
      </div>
      
      {/* Products Grid */}
      {effectivePicks.catalogue.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            From Our Catalogue
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {effectivePicks.catalogue.slice(0, 5).map((pick, index) => (
              <ProductPickCard
                key={pick.id || index}
                pick={pick}
                pet={pet}
                pillar={pillar}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Concierge® Services */}
      {effectivePicks.concierge.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-500" />
            Concierge® Curated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {effectivePicks.concierge.slice(0, 2).map((pick, index) => (
              <ConciergePickCard
                key={pick.id || index}
                pick={pick}
                pet={pet}
                pillar={pillar}
                onRequestConcierge={handleConciergeRequest}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default PillarPicksSection;

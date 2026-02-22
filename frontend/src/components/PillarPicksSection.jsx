/**
 * PillarPicksSection.jsx
 * 
 * "Mira's Picks for {Pet}" - Inline on pillar pages
 * 
 * CONCIERGE DNA:
 * - Pet First, Always (soul traits → breed → name fallback)
 * - Products from catalogue + Concierge curated services
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
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ShoppingCart, MessageCircle, Heart, ChevronRight, 
  Package, Clock, RefreshCw, AlertCircle, Check, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getSoulBasedReason } from '../utils/petSoulInference';
import { toast } from '../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * ProductPickCard - For catalogue products (direct purchase)
 */
const ProductPickCard = ({ pick, pet, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  const handleAdd = async () => {
    setIsAdding(true);
    await onAddToCart(pick);
    setIsAdding(false);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {pick.image_url || pick.image ? (
          <img 
            src={pick.image_url || pick.image} 
            alt={pick.name}
            className="w-full h-full object-cover"
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
        
        {/* Price & Action */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-gray-900">
            {pick.price ? `₹${pick.price}` : 'Ask Mira'}
          </span>
          
          <button
            onClick={handleAdd}
            disabled={isAdding}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-full transition-colors disabled:opacity-50"
          >
            {isAdding ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="w-3 h-3" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
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
          Concierge Curated
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
  
  // No picks available
  const hasPicks = picks.catalogue.length > 0 || picks.concierge.length > 0;
  if (!hasPicks) {
    return null; // Don't show empty section
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
        {lastFetch && (
          <p className="text-xs text-gray-400 flex items-center gap-1 ml-13">
            <Clock className="w-3 h-3" />
            Updated based on {pet.name}'s profile & your conversations with Mira
          </p>
        )}
      </div>
      
      {/* Products Grid */}
      {picks.catalogue.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            From Our Catalogue
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {picks.catalogue.slice(0, 5).map((pick, index) => (
              <ProductPickCard
                key={pick.id || index}
                pick={pick}
                pet={pet}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Concierge Services */}
      {picks.concierge.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-purple-500" />
            Concierge Curated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {picks.concierge.slice(0, 2).map((pick, index) => (
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

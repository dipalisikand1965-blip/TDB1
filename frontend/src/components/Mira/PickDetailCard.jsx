/**
 * PickDetailCard.jsx
 * 
 * Displays a product or concierge service pick as a chat card
 * Used when user clicks an item in PersonalizedPicksPanel
 * The card appears in the chat conversation with full details
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart, Package, Sparkles, Check, Plus, ChevronDown, ChevronUp,
  ShoppingBag, Star, AlertCircle
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

const PickDetailCard = ({ 
  pick, 
  petName,
  type = 'catalogue', // 'catalogue' or 'concierge'
  onAddToRequest,
  isAdded = false
}) => {
  const [showVariants, setShowVariants] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [added, setAdded] = useState(isAdded);
  
  const isConcierge = type === 'concierge';
  
  // Get variants from product options
  const variants = pick.variants || [];
  const options = pick.options || [];
  const hasVariants = variants.length > 1 || options.some(o => o.values?.length > 1);
  
  // Get the "why" text
  const whyText = pick.why_it_fits || pick.why_reason || pick.why_this_pick;
  
  const handleAddToRequest = () => {
    hapticFeedback.success();
    setAdded(true);
    
    const itemToAdd = {
      ...pick,
      selectedVariant: selectedVariant || pick.variants?.[0]?.title || 'Standard',
      pick_type: type,
      petName: petName,
      addedAt: new Date().toISOString()
    };
    
    onAddToRequest?.(itemToAdd);
  };
  
  // CONCIERGE SERVICE CARD
  if (isConcierge) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-900/60 to-pink-900/40 border border-purple-500/40 max-w-sm"
      >
        {/* Header */}
        <div className="p-4 border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <span className="px-2 py-0.5 bg-pink-500/30 text-pink-300 text-xs rounded-full mb-1 inline-block">
                Concierge Pick
              </span>
              <h4 className="font-semibold text-white text-sm">{pick.name}</h4>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Spec chip */}
          {pick.spec_chip && (
            <div className="flex">
              <span className="px-3 py-1 bg-purple-500/30 text-purple-200 text-xs rounded-full border border-purple-500/40">
                {pick.spec_chip}
              </span>
            </div>
          )}
          
          {/* Why this pick */}
          {whyText && (
            <p className="text-sm text-amber-300 flex items-start gap-2">
              <Heart className="w-4 h-4 flex-shrink-0 mt-0.5 text-pink-400" />
              <span>{whyText}</span>
            </p>
          )}
          
          {/* Description */}
          {pick.description && (
            <p className="text-sm text-gray-300">{pick.description}</p>
          )}
          
          {/* What we source */}
          {pick.what_we_source && (
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs font-medium text-purple-300 mb-1">What We Source</p>
              <p className="text-sm text-gray-300">{pick.what_we_source}</p>
            </div>
          )}
          
          {/* Selection rules */}
          {pick.selection_rules?.length > 0 && (
            <div className="space-y-1">
              {pick.selection_rules.slice(0, 3).map((rule, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Arranged for */}
          <p className="text-xs text-purple-400 text-center">
            Arranged specially for {petName}
          </p>
        </div>
        
        {/* Action Button */}
        <div className="p-4 pt-0">
          <button
            onClick={handleAddToRequest}
            disabled={added}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
              added 
                ? 'bg-green-500/30 text-green-300 cursor-default' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
            }`}
          >
            {added ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Added to Request
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Request This
              </span>
            )}
          </button>
        </div>
      </motion.div>
    );
  }
  
  // CATALOGUE PRODUCT CARD
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden bg-gray-800/80 border border-gray-700/50 max-w-sm"
    >
      {/* Product Image */}
      <div className="relative aspect-[4/3] bg-gray-900">
        {pick.image_url || pick.image ? (
          <img 
            src={pick.image_url || pick.image} 
            alt={pick.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-600" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {pick.isBestseller && (
            <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full">
              Bestseller
            </span>
          )}
          {pick.isNew && (
            <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
              New
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title & Category */}
        <div>
          <h4 className="font-semibold text-white text-base">{pick.name}</h4>
          <div className="flex flex-wrap gap-1 mt-1">
            {pick.category && (
              <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full">
                {pick.category}
              </span>
            )}
            {pick.brand && (
              <span className="px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded-full">
                {pick.brand}
              </span>
            )}
          </div>
        </div>
        
        {/* Why this pick */}
        {whyText && (
          <p className="text-sm text-amber-400 flex items-start gap-2">
            <Heart className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{whyText}</span>
          </p>
        )}
        
        {/* Price */}
        {pick.price && (
          <p className="text-lg font-bold text-white">
            ₹{pick.price.toLocaleString('en-IN')}
          </p>
        )}
        
        {/* Variants Dropdown */}
        {hasVariants && (
          <div>
            <button
              onClick={() => {
                hapticFeedback.buttonTap();
                setShowVariants(!showVariants);
              }}
              className="w-full flex items-center justify-between py-2 px-3 bg-gray-700/50 rounded-lg text-sm text-gray-300"
            >
              <span>{selectedVariant || 'Select variant'}</span>
              {showVariants ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showVariants && (
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {variants.map((variant, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      hapticFeedback.buttonTap();
                      setSelectedVariant(variant.title);
                      setShowVariants(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedVariant === variant.title
                        ? 'bg-purple-500/30 text-purple-300'
                        : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                    }`}
                  >
                    {variant.title} {variant.price ? `- ₹${variant.price}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Mira tip */}
        <p className="text-xs text-gray-500 text-center">
          Handpicked for {petName} by Mira
        </p>
      </div>
      
      {/* Action Button */}
      <div className="p-4 pt-0">
        <button
          onClick={handleAddToRequest}
          disabled={added}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
            added 
              ? 'bg-green-500/30 text-green-300 cursor-default' 
              : 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
          }`}
        >
          {added ? (
            <span className="flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Added to Request
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Add to Request
            </span>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default PickDetailCard;

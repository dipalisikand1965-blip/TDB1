/**
 * ProductQuickViewModal.jsx
 * 
 * Beautiful popup modal for product details in Mira Picks
 * Shows product with Mira's insight and variant selection
 * User selects options → adds to concierge cart
 * 
 * Philosophy: Mira knows your pet, curated just for them
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, Sparkles, Heart, Package, ChevronRight,
  Star, Shield, ShoppingBag, MessageCircle, Info
} from 'lucide-react';
import hapticFeedback from '../../utils/haptic';

/**
 * ProductQuickViewModal
 */
const ProductQuickViewModal = ({
  product,
  pet,
  isOpen,
  onClose,
  onAddToPicks, // Add to concierge cart
  variant = 'dark'
}) => {
  const [selectedVariants, setSelectedVariants] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  
  // Reset selections when product changes
  useEffect(() => {
    if (product) {
      // Pre-select first option of each variant type
      const defaultSelections = {};
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach(variant => {
          if (variant.options && variant.options.length > 0) {
            defaultSelections[variant.name] = variant.options[0];
          }
        });
      }
      setSelectedVariants(defaultSelections);
    }
  }, [product]);
  
  if (!isOpen || !product) return null;
  
  const isDark = variant === 'dark';
  const petName = pet?.name || 'your pet';
  
  // Parse product variants from Shopify-like structure
  const getVariants = () => {
    if (product.variants && Array.isArray(product.variants)) {
      return product.variants;
    }
    // Build from options if available
    const variants = [];
    if (product.options) {
      Object.entries(product.options).forEach(([name, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          variants.push({ name, options: values });
        }
      });
    }
    return variants;
  };
  
  const variants = getVariants();
  const hasVariants = variants.length > 0;
  
  // Get the "why this pick" text
  const whyText = product.why_it_fits || product.why_reason || product.why_this_pick;
  
  const handleClose = () => {
    hapticFeedback.modalClose();
    onClose();
  };
  
  const handleSelectVariant = (variantName, option) => {
    hapticFeedback.buttonTap();
    setSelectedVariants(prev => ({
      ...prev,
      [variantName]: option
    }));
  };
  
  const handleAddToPicks = async () => {
    hapticFeedback.success();
    setIsAdding(true);
    
    try {
      // Build the selection with chosen variants
      const selection = {
        ...product,
        selectedVariants,
        pick_type: 'catalogue',
        addedAt: new Date().toISOString()
      };
      
      await onAddToPicks?.(selection);
      handleClose();
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 ${
          isDark ? 'bg-black/80 backdrop-blur-sm' : 'bg-black/50 backdrop-blur-sm'
        }`}
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={`w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col ${
            isDark 
              ? 'bg-gray-900 border-t border-purple-500/30 sm:border sm:rounded-2xl' 
              : 'bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl'
          }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header Image - PRIORITIZE original Shopify image */}
          <div className="relative h-48 sm:h-56 flex-shrink-0 overflow-hidden">
            <img
              src={(() => {
                // CRITICAL: For marketplace products, use original Shopify image
                if (product.image && product.image.includes('shopify.com')) {
                  return product.image;
                }
                return product.image_url || product.image || '';
              })()}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isDark 
                  ? 'bg-gray-900/80 text-white hover:bg-gray-800' 
                  : 'bg-white/90 text-gray-800 hover:bg-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Product name on image */}
            <div className="absolute bottom-4 left-4 right-4">
              {product.brand && (
                <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>
                  {product.brand}
                </span>
              )}
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {product.name}
              </h2>
            </div>
          </div>
          
          {/* Content - Scrollable */}
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            
            {/* Mira's Insight - Why this pick */}
            {whyText && (
              <div className={`p-3 rounded-xl ${
                isDark 
                  ? 'bg-amber-900/20 border border-amber-500/30' 
                  : 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100'
              }`}>
                <div className="flex items-start gap-2">
                  <Heart className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                    isDark ? 'text-amber-400' : 'text-amber-500'
                  }`} />
                  <div>
                    <p className={`text-xs font-semibold mb-1 ${
                      isDark ? 'text-amber-300' : 'text-amber-600'
                    }`}>
                      Why this for {petName}
                    </p>
                    <p className={`text-sm ${
                      isDark ? 'text-amber-200' : 'text-amber-700'
                    }`}>
                      {whyText}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Description */}
            {product.description && (
              <p className={`text-sm leading-relaxed ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {product.description}
              </p>
            )}
            
            {/* Variant Selection */}
            {hasVariants && (
              <div className="space-y-4">
                {variants.map((variant) => (
                  <div key={variant.name}>
                    <h3 className={`text-sm font-semibold mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {variant.name}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSelectVariant(variant.name, option)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                            selectedVariants[variant.name] === option
                              ? isDark 
                                ? 'bg-purple-600 text-white border-2 border-purple-400'
                                : 'bg-purple-600 text-white border-2 border-purple-600'
                              : isDark
                                ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-purple-500'
                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:border-purple-400'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Trust indicators */}
            <div className="flex flex-wrap gap-2">
              {product.badges?.map((badge, i) => (
                <span key={i} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                  isDark ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-600'
                }`}>
                  <Star className="w-3.5 h-3.5" />
                  {badge}
                </span>
              ))}
              <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}>
                <Shield className="w-3.5 h-3.5" />
                Quality Assured
              </span>
            </div>
            
            {/* Handpicked for */}
            <p className={`text-xs italic ${
              isDark ? 'text-purple-400' : 'text-purple-600'
            }`}>
              Handpicked for {product.handpicked_for || petName}
            </p>
          </div>
          
          {/* Action buttons - Fixed at bottom */}
          <div className={`p-4 border-t flex gap-3 flex-shrink-0 ${
            isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'
          }`} style={{ 
            paddingBottom: 'max(1rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
          }}>
            <button
              onClick={handleAddToPicks}
              disabled={isAdding}
              className={`flex-1 py-4 rounded-xl font-semibold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
                isDark
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90'
              } ${isAdding ? 'opacity-50' : ''}`}
            >
              <ShoppingBag className="w-4 h-4" />
              {isAdding ? 'Adding...' : 'Add to Picks'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProductQuickViewModal;

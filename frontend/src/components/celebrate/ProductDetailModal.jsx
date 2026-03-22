/**
 * ProductDetailModal.jsx
 * Full product modal for pillar Shop tabs
 * - Shows product details, variants, quantity
 * - Add to Cart or Send to Concierge (for service items)
 * - "Customise This" button triggers CustomOrderFlow
 */

import React, { useState } from 'react';
import { tdc } from '../utils/tdc_intent';
import { bookViaConcierge } from '../utils/MiraCardActions';
import { X, Plus, Minus, ShoppingCart, Sparkles, Heart, Check, Star, Palette } from 'lucide-react';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import CustomOrderFlow from './CustomOrderFlow';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/* ── Send to Concierge helper ─────────────────────────────────────────────── */
const sendToConcierge = async ({ requestType, label, message, petName }) => {
  try {
    const resp = await fetch(`${API_BASE}/api/concierge/pillar-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pillar: 'celebrate',
        request_type: requestType,
        request_label: label,
        pet_name: petName,
        message,
        source: 'product_detail_modal',
      }),
    });
    const data = await resp.json();
    return { success: true, ticketId: data.ticket_id, requestId: data.request_id };
  } catch {
    return { success: false };
  }
};

const ProductDetailModal = ({ 
  product, 
  isOpen, 
  onClose, 
  petName = 'your pet',
  pet = null,
  user = null,
  isConcierge = false,
  pillarColor = '#C44DFF'
}) => {
  const isMobile = useResizeMobile();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isSentToConcierge, setIsSentToConcierge] = useState(false);
  const [showCustomOrder, setShowCustomOrder] = useState(false);

  if (!isOpen || !product) return null;

  // Check if this is a Soul/breed product that can be customised
  const isSoulProduct = product.is_mockup || product.id?.startsWith('bp-') || product.product_type;

  const variants = product.variants || [];
  const currentVariant = variants[selectedVariant] || {};
  const price = currentVariant.price || product.price || 0;
  const image = product.image_url || product.image || product.images?.[0];
  const hasVariants = variants.length > 1;

  // Determine if this is a service (no price / concierge)
  const isService = isConcierge || !price || price === 0 || 
    product.category === 'grooming' || 
    product.category === 'portraits' ||
    product.name?.toLowerCase().includes('photoshoot') ||
    product.name?.toLowerCase().includes('booking') ||
    product.name?.toLowerCase().includes('session');

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    // Simulate adding to cart
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Dispatch cart event
    window.dispatchEvent(new CustomEvent('addToCart', { 
      detail: {
        ...product,
        quantity,
        selectedVariant: currentVariant,
        totalPrice: price * quantity
      }
    }));
    
    setIsAdding(false);
    setIsAdded(true);
    
    // Reset after 2s
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1500);
  };

  const handleSendToConcierge = async () => {
    setIsAdding(true);
    // ── tdc.book — canonical intent ──
    tdc.book({ service: product?.name, pillar: product?.pillar || 'platform', channel: 'product_detail_modal' });
    
    const result = await sendToConcierge({
      requestType: product.category || 'service_request',
      label: `Request: ${product.name} for ${petName}`,
      message: `Please arrange "${product.name}" for ${petName}. ${product.description || ''}`,
      petName
    });
    
    setIsAdding(false);
    
    if (result.success) {
      setIsSentToConcierge(true);
      
      // Show toast
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { 
          message: `Sent to Concierge! Ticket: ${result.ticketId}`,
          type: 'success'
        }
      }));
      
      setTimeout(() => {
        setIsSentToConcierge(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex"
      style={{
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '16px',
      }}
      onClick={onClose}
      data-testid="product-detail-modal"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal — bottom sheet on mobile, centered card on desktop */}
      <div 
        className="relative w-full bg-white overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: isMobile ? '100%' : '28rem',
          maxHeight: isMobile ? '92vh' : '90vh',
          borderRadius: isMobile ? '24px 24px 0 0' : 24,
          overflowY: 'auto',
        }}
      >
        {/* Drag handle (mobile) */}
        {isMobile && (
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
        )}

        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow-lg"
          data-testid="modal-close-btn"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Product Image */}
        <div 
          className="relative flex items-center justify-center"
          style={{ height: isMobile ? 220 : 256, background: `linear-gradient(135deg, ${pillarColor}15, ${pillarColor}08)` }}
        >
          {image ? (
            <img 
              src={image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span style={{ fontSize: 64 }}>🎁</span>
              <span className="text-sm text-gray-400">No image available</span>
            </div>
          )}
          
          {/* Pet badge */}
          <div 
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ 
              background: 'linear-gradient(135deg, rgba(196,77,255,0.95), rgba(255,107,157,0.90))',
              color: 'white'
            }}
          >
            <Sparkles className="w-3 h-3" />
            Picked for {petName}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category tag */}
          {product.category && (
            <span 
              className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold mb-3"
              style={{ background: `${pillarColor}15`, color: pillarColor }}
            >
              {product.category.replace(/_/g, ' ')}
            </span>
          )}

          {/* Title */}
          <h2 className="font-bold text-gray-900 mb-2.5 leading-snug" style={{ fontSize: 20 }}>
            {product.name}
          </h2>

          {/* Description */}
          {product.description && (
            <p className="text-gray-500 mb-5 leading-relaxed" style={{ fontSize: 14 }}>
              {product.description}
            </p>
          )}

          {/* Variants selector */}
          {hasVariants && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2.5">Select Option:</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(i)}
                    className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: selectedVariant === i ? pillarColor : 'transparent',
                      color: selectedVariant === i ? 'white' : '#555',
                      border: `1.5px solid ${selectedVariant === i ? pillarColor : '#E5E5E5'}`
                    }}
                  >
                    {v.name || v.size || `Option ${i + 1}`}
                    {v.price && ` — ₹${v.price}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price and Quantity */}
          <div className="flex items-center justify-between mb-6">
            {/* Price */}
            <div>
              {isService ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ fontSize: 18, color: '#C9973A' }}>
                    Concierge Service
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    Custom Quote
                  </span>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="font-bold" style={{ fontSize: 26, color: '#1A0030' }}>
                    ₹{(price * quantity).toLocaleString('en-IN')}
                  </span>
                  {quantity > 1 && (
                    <span className="text-xs text-gray-400">
                      (₹{price.toLocaleString('en-IN')} each)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quantity selector */}
            {!isService && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-base">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-50 transition-colors"
                  disabled={quantity >= 10}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Customise This — triggers the WOW flow for Soul products */}
          {isSoulProduct && (
            <button
              onClick={() => setShowCustomOrder(true)}
              className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mb-3"
              style={{
                fontSize: 15,
                background: `linear-gradient(135deg, ${pillarColor}, #FF6B9D)`,
                color: 'white',
              }}
              data-testid="customise-product-btn"
            >
              <Palette className="w-5 h-5" />
              Customise with {petName}'s Photo
            </button>
          )}

          {/* Action Button */}
          {isService ? (
            <button
              onClick={handleSendToConcierge}
              disabled={isAdding || isSentToConcierge}
              className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
              data-testid="send-concierge-btn"
              style={{
                fontSize: 16,
                background: isSentToConcierge
                  ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                  : 'linear-gradient(135deg, #C9973A, #F0C060)',
                color: isSentToConcierge ? 'white' : '#1A0A00',
                opacity: isAdding ? 0.7 : 1
              }}
            >
              {isSentToConcierge ? (
                <><Check className="w-5 h-5" /> Sent to Concierge!</>
              ) : isAdding ? 'Sending...' : (
                <><Star className="w-5 h-5" /> Request via Concierge</>
              )}
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || isAdded}
              className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
              data-testid="add-to-cart-btn"
              style={{
                fontSize: 16,
                background: isAdded
                  ? 'linear-gradient(135deg, #22C55E, #16A34A)'
                  : `linear-gradient(135deg, ${pillarColor}, #FF6B9D)`,
                color: 'white',
                opacity: isAdding ? 0.7 : 1
              }}
            >
              {isAdded ? (
                <><Check className="w-5 h-5" /> Added to Cart!</>
              ) : isAdding ? 'Adding...' : (
                <><ShoppingCart className="w-5 h-5" /> Add to Cart — ₹{(price * quantity).toLocaleString('en-IN')}</>
              )}
            </button>
          )}

          {/* Additional info */}
          <p className="text-xs text-center text-gray-400 mt-4">
            {isService 
              ? '✦ Our concierge team will contact you within 24 hours'
              : '✦ Free delivery on orders above ₹999'
            }
          </p>
        </div>
      </div>

      {/* Custom Order Flow Modal */}
      {showCustomOrder && (
        <CustomOrderFlow
          product={product}
          pet={pet}
          user={user}
          isOpen={showCustomOrder}
          onClose={() => setShowCustomOrder(false)}
          pillarColor={pillarColor}
        />
      )}
    </div>
  );
};

export default ProductDetailModal;

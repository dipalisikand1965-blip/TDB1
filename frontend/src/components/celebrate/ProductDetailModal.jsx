/**
 * ProductDetailModal.jsx
 * Full product modal for pillar Shop tabs
 * - Shows product details, variants, quantity
 * - Add to Cart or Send to Concierge® (for service items)
 * - "Customise This" button triggers CustomOrderFlow
 */

import React, { useState } from 'react';
import { tdc } from '../../utils/tdc_intent';
import { bookViaConcierge } from '../../utils/MiraCardActions';
import { X, Plus, Minus, ShoppingCart, Sparkles, Heart, Check, Star, Palette, Loader2 } from 'lucide-react';
import { useResizeMobile } from '../../hooks/useResizeMobile';

const API_BASE = process.env.REACT_APP_BACKEND_URL;

/* ── Send to Concierge® helper — canonical via bookViaConcierge ───────────── */
const sendToConcierge = async ({ requestType, label, message, petName, pet, token }) => {
  try {
    await bookViaConcierge({
      service: label || requestType || 'Product request',
      pillar: 'celebrate',
      pet,
      token,
      channel: `celebrate_${requestType || 'product_detail'}`,
      notes: message,
    });
    return { success: true };
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
  const [showConciergeModal, setShowConciergeModal] = useState(false);
  const [conciergeNotes, setConciergeNotes] = useState('');
  const [conciergeSpecialText, setConciergeSpecialText] = useState('');
  const [conciergeSending, setConciergeSending] = useState(false);
  const [conciergeSent, setConciergeSent] = useState(false);

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
      petName, pet, token: null,
    });
    
    setIsAdding(false);
    
    if (result.success) {
      setIsSentToConcierge(true);
      
      // Show toast
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: { 
          message: `Sent to Concierge®! Ticket: ${result.ticketId}`,
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
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
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
                    Concierge® Service
                  </span>
                  <span className="tdc-chip" style={{ background:'#fef3c7', color:'#92400e', borderColor:'#fde68a' }}>
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

          {/* Customise This — opens concierge modal for Soul products */}
          {isSoulProduct && (
            <button
              onClick={() => setShowConciergeModal(true)}
              className="w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all mb-3"
              style={{
                fontSize: 15,
                background: `linear-gradient(135deg, #C9973A, #F0C060)`,
                color: '#1A0A00',
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
                <><Check className="w-5 h-5" /> Sent to Concierge®!</>
              ) : isAdding ? 'Sending...' : (
                <><Star className="w-5 h-5" /> Request via Concierge®</>
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

      {/* Universal Concierge® Modal for Custom Orders */}
      {showConciergeModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)",
                      zIndex:9500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
             onClick={e => e.target===e.currentTarget && !conciergeSent && setShowConciergeModal(false)}
             data-testid="custom-concierge-modal-overlay">
          <div style={{ background:"#fff", borderRadius:20, padding:32,
                        maxWidth:480, width:"100%", maxHeight:"90vh", overflowY:"auto",
                        scrollbarWidth:"none", msOverflowStyle:"none",
                        position:"relative", boxShadow:"0 24px 64px rgba(0,0,0,0.20)" }}
               onClick={e => e.stopPropagation()}>

            {conciergeSent ? (
              <div style={{ textAlign:"center", padding:"16px 0" }}>
                <div style={{
                  width:64, height:64, borderRadius:"50%",
                  background:"rgba(201,151,58,0.15)", border:"2px solid rgba(201,151,58,0.40)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:28, margin:"0 auto 16px"
                }}>♥</div>
                <h3 style={{ fontSize:18, fontWeight:800, color:"#1A0030", marginBottom:10 }}>
                  {petName}'s custom order is in good hands.
                </h3>
                <p style={{ fontSize:14, color:"#666", lineHeight:1.6, marginBottom:24 }}>
                  Your Concierge® has everything they need to create your personalised <strong>{product.name}</strong>. Expect a message within 48 hours with pricing and next steps.
                </p>
                <button onClick={() => { setShowConciergeModal(false); setConciergeSent(false); setConciergeNotes(''); setConciergeSpecialText(''); }}
                  style={{ marginTop:8, background:"linear-gradient(135deg,#C9973A,#F0C060)",
                           color:"#1A0A00", border:"none", borderRadius:12,
                           padding:"12px 32px", fontSize:14, fontWeight:800,
                           cursor:"pointer", width:"100%" }}
                  data-testid="custom-concierge-close">
                  Close
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setShowConciergeModal(false)}
                  style={{ position:"absolute", top:16, right:16, background:"none",
                           border:"none", cursor:"pointer", padding:4, fontSize:20, color:"#888" }}>✕</button>

                <div style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  background:"rgba(201,151,58,0.15)", border:"1px solid rgba(201,151,58,0.40)",
                  borderRadius:9999, padding:"4px 14px",
                  fontSize:12, fontWeight:600, color:"#F0C060", marginBottom:16
                }}>
                  <span style={{ color:"#C9973A" }}>★</span>
                  {petName}'s Concierge®
                </div>

                <h2 style={{ fontSize:"1.25rem", fontFamily:"Georgia,serif", fontWeight:800,
                             color:"#1A0030", marginBottom:6, lineHeight:1.3 }}>
                  Customise {product.name} for {petName}
                </h2>
                <p style={{ fontSize:13, color:"#888", marginBottom:10, lineHeight:1.5 }}>
                  Three questions. Then your Concierge® takes over.
                </p>

                <div style={{ background:"#F8F7F4", borderRadius:10, padding:"10px 14px",
                              marginBottom:20, fontSize:13, fontWeight:600, color:"#1A0030",
                              display:"flex", alignItems:"center", gap:10 }}>
                  {image && <img src={image} alt="" style={{ width:40, height:40, borderRadius:8, objectFit:"cover" }} />}
                  <div>
                    <div>{product.name}</div>
                    <div style={{ fontSize:11, color:"#888", fontWeight:400 }}>{(product.product_type || '').replace(/_/g,' ')}</div>
                  </div>
                </div>

                <div style={{ marginBottom:24 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#1A0030", marginBottom:8 }}>
                    What text should go on the product?
                  </p>
                  <input value={conciergeSpecialText} onChange={e => setConciergeSpecialText(e.target.value)}
                    placeholder={`e.g. "${petName} - Since 2023" or "${petName} the ${(pet?.breed||'').replace(/_/g,' ')}"`}
                    maxLength={50}
                    style={{ width:"100%", padding:"10px 14px", borderRadius:10,
                             border:"1px solid rgba(0,0,0,0.15)", fontSize:13, color:"#1A0030",
                             boxSizing:"border-box" }}
                    data-testid="custom-special-text" />
                  <p style={{ fontSize:11, color:"#aaa", marginTop:4 }}>{conciergeSpecialText.length}/50 characters</p>
                </div>

                <div style={{ marginBottom:24 }}>
                  <p style={{ fontSize:13, fontWeight:700, color:"#1A0030", marginBottom:8 }}>
                    Any special requests for {petName}'s product?
                  </p>
                  <textarea value={conciergeNotes} onChange={e => setConciergeNotes(e.target.value)}
                    placeholder="Colours, layout, specific photo you'll share, allergies if it's food..."
                    rows={3} maxLength={500}
                    style={{ width:"100%", padding:"12px 14px", borderRadius:10,
                             border:"1px solid rgba(0,0,0,0.12)", fontSize:13, color:"#1A0030",
                             lineHeight:1.5, resize:"vertical", boxSizing:"border-box", fontFamily:"inherit" }}
                    data-testid="custom-notes" />
                </div>

                <div style={{ padding:"10px 14px", borderRadius:10, background:"#FFFBEB",
                              border:"1px solid #FEF3C7", marginBottom:20, fontSize:12, color:"#92400E", lineHeight:1.5 }}>
                  Our Concierge® will reach out to collect {petName}'s photo and share pricing. No charges until you confirm.
                </div>

                <button onClick={async () => {
                  setConciergeSending(true);
                  try {
                    const token = localStorage.getItem('tdb_auth_token');
                    const textNote = conciergeSpecialText ? ` Text on product: "${conciergeSpecialText}".` : '';
                    const extraNotes = conciergeNotes ? ` Notes: ${conciergeNotes}` : '';
                    await fetch(`${API_BASE}/api/service_desk/attach_or_create_ticket`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({
                        parent_id: user?.id || user?.email || "guest",
                        pet_id: pet?.id || pet?._id || "unknown",
                        pillar: product.pillar || "celebrate",
                        intent_primary: "custom_order",
                        channel: "soul_picks_customise",
                        life_state: "PLAN",
                        urgency: "high",
                        status: "open",
                        force_new: true,
                        initial_message: {
                          sender: "parent",
                          text: `${petName}'s parent wants to customise: ${product.name} (${(product.product_type||'').replace(/_/g,' ')}).${textNote}${extraNotes} — Please collect pet photo and share pricing.`
                        }
                      })
                    });
                    setConciergeSent(true);
                  } catch(e) {
                    setConciergeSent(true);
                  }
                  setConciergeSending(false);
                }} disabled={conciergeSending}
                  style={{ width:"100%", background:"linear-gradient(135deg,#C9973A,#F0C060)",
                           color:"#1A0A00", border:"none", borderRadius:12, padding:"14px",
                           fontSize:15, fontWeight:800, cursor: conciergeSending ? "not-allowed" : "pointer",
                           opacity: conciergeSending ? 0.7 : 1 }}
                  data-testid="custom-concierge-submit">
                  {conciergeSending ? "Sending..." : "Send to my Concierge® →"}
                </button>

                <p style={{ fontSize:11, color:"#aaa", textAlign:"center", marginTop:12, lineHeight:1.5 }}>
                  We already have your contact details. Your Concierge® will reach out — you don't need to chase.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailModal;

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, RefreshCw, Truck, Gift, Info, Tag, ChevronRight, Sparkles, Package, MessageCircle, Clock, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '../hooks/use-toast';
import { usePillarContext } from '../context/PillarContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import { tdc } from '../utils/tdc_intent';

// ── Allergen keyword map ───────────────────────────────────────────────────
const ALLERGEN_MAP = {
  chicken:  ["chicken", "poultry"],
  beef:     ["beef", "lamb", "mutton"],
  grain:    ["wheat", "grain", "gluten", "flour"],
  dairy:    ["milk", "dairy", "cheese", "yogurt", "curd"],
  fish:     ["fish", "salmon", "tuna", "sardine"],
  soy:      ["soy", "soya"],
  eggs:     ["egg"],
};

// ── Smart cart recommendations fetch ────────────────────────────────────────
async function fetchCartRecommendations(cartItems, selectedPet, token) {
  if (!selectedPet?.id || cartItems.length === 0) return [];
  const petId    = selectedPet.id || selectedPet._id;
  const breed    = (selectedPet.breed || "").toLowerCase();
  const soul     = selectedPet.doggy_soul_answers || {};
  const allergies = soul.food_allergies || [];
  const cartPillar = cartItems[0]?.pillar || "shop";

  try {
    const res = await fetch(
      `${API_URL}/api/mira/claude-picks/${petId}?pillar=${cartPillar}&limit=8`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const picks = data.picks || data.products || [];

    return picks.filter(product => {
      // Rule 1 — breed match
      const productBreed = (product.breed || "").toLowerCase();
      const breedOk =
        !productBreed ||
        productBreed === "all" ||
        productBreed === "none" ||
        breed.includes(productBreed) ||
        productBreed.includes(breed.split(" ")[0]);
      if (!breedOk) return false;

      // Rule 2 — allergen filter
      const combined = `${product.name || ""} ${product.description || ""} ${product.category || ""}`.toLowerCase();
      for (const allergy of allergies) {
        if (!allergy || allergy === "none" || allergy === "none known") continue;
        const keywords = ALLERGEN_MAP[allergy] || [allergy];
        if (keywords.some(kw => combined.includes(kw))) return false;
      }

      // Rule 3 — not already in cart
      if (cartItems.some(ci => (ci.id || ci._id) === (product.id || product._id))) return false;

      return true;
    }).slice(0, 4);
  } catch {
    return [];
  }
}

// ── Cart Recommendation Card ────────────────────────────────────────────────
function CartRecommendationCard({ product, pet, onAdd }) {
  const [added, setAdded] = useState(false);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 10px", borderRadius: 12,
      border: "1px solid #F3E8FF", background: "#FDFAFF",
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, overflow: "hidden", flexShrink: 0,
        background: "#F3E8FF", display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
          : <span style={{ fontSize: 20 }}>✦</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</div>
        {product.mira_reason && (
          <div style={{ fontSize: 10, color: "#7B5EA7", marginTop: 2, lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {product.mira_reason}
          </div>
        )}
        <div style={{ fontSize: 11, fontWeight: 800, color: "#9B59B6", marginTop: 2 }}>
          ₹{product.price}
        </div>
      </div>
      <button
        onClick={() => { onAdd(product); setAdded(true); }}
        disabled={added}
        style={{
          padding: "6px 12px", borderRadius: 20, border: "none", flexShrink: 0,
          background: added ? "#E8F5E9" : "#9B59B6",
          color: added ? "#16A34A" : "#fff",
          fontSize: 11, fontWeight: 700, cursor: added ? "default" : "pointer",
        }}
        data-testid={`cart-rec-add-${product.id || product._id}`}
      >
        {added ? "✓" : "Add"}
      </button>
    </div>
  );
}

const CartSidebar = () => {
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart,
    clearCart,
    getCartTotal, 
    isCartOpen, 
    setIsCartOpen, 
    autoshipSummary,
    addToCart,
    // Concierge requests
    conciergeRequests,
    removeConciergeRequest,
    submitConciergeRequests
  } = useCart();
  const { currentPet } = usePillarContext();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [removingItem, setRemovingItem] = useState(null);
  const [submittingConcierge, setSubmittingConcierge] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // ── Fetch smart cart recommendations whenever pet or cart changes ──
  useEffect(() => {
    if (!currentPet?.id || cartItems.length === 0) {
      setRecommendations([]);
      return;
    }
    fetchCartRecommendations(cartItems, currentPet, token).then(setRecommendations);
  }, [currentPet?.id, cartItems.length, token]);

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  const handleRemove = (itemId) => {
    setRemovingItem(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
      setRemovingItem(null);
    }, 200);
  };

  const handleSubmitConciergeRequests = async () => {
    setSubmittingConcierge(true);
    try {
      const result = await submitConciergeRequests();
      if (result.success) {
        toast({
          title: "✨ Concierge Requests Submitted!",
          description: "Your Pet Concierge® will contact you within 2 hours.",
        });
      } else {
        toast({
          title: "Something went wrong",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit concierge requests",
        variant: "destructive"
      });
    } finally {
      setSubmittingConcierge(false);
    }
  };

  // Calculate item count
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const conciergeCount = conciergeRequests?.length || 0;
  const totalItems = itemCount + conciergeCount;
  const hasProducts = cartItems.length > 0;
  const hasConcierge = conciergeCount > 0;

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-10 bg-white border-b">
          <SheetHeader className="p-4 pb-3">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold">Your Requests</span>
                  {totalItems > 0 && (
                    <p className="text-xs text-gray-500 font-normal">
                      {itemCount > 0 && `${itemCount} product${itemCount !== 1 ? 's' : ''}`}
                      {itemCount > 0 && conciergeCount > 0 && ' • '}
                      {conciergeCount > 0 && `${conciergeCount} concierge`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {cartItems.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2"
                    onClick={() => {
                      if (window.confirm('Clear all items from cart?')) {
                        clearCart();
                      }
                    }}
                    data-testid="clear-cart-btn"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full hover:bg-gray-100"
                  onClick={() => setIsCartOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </SheetTitle>
          </SheetHeader>
          
          {/* Free Shipping Progress Bar */}
          {cartItems.length > 0 && !autoshipSummary.qualifiesForFreeShipping && (
            <div className="px-4 pb-3">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-800 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Add ₹{autoshipSummary.amountToFreeShipping?.toLocaleString()} for FREE shipping
                  </span>
                  <span className="text-xs text-amber-600">
                    {Math.round((autoshipSummary.subtotal / (autoshipSummary.subtotal + autoshipSummary.amountToFreeShipping)) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (autoshipSummary.subtotal / (autoshipSummary.subtotal + autoshipSummary.amountToFreeShipping)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Free Shipping Achieved */}
          {cartItems.length > 0 && autoshipSummary.qualifiesForFreeShipping && (
            <div className="px-4 pb-3">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2.5 border border-green-100 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-green-700">🎉 You've unlocked FREE shipping!</span>
              </div>
            </div>
          )}
        </div>

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto">
          {totalItems === 0 ? (
            /* Empty Cart State */
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6 max-w-xs">
                Discover amazing products and services for your furry friend!
              </p>
              <Button
                onClick={() => setIsCartOpen(false)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* ==================== CONCIERGE REQUESTS SECTION ==================== */}
              {hasConcierge && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <MessageCircle className="w-3 h-3 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Concierge Requests</h4>
                  </div>
                  
                  <AnimatePresence>
                    {conciergeRequests.map((request) => (
                      <motion.div
                        key={request.requestId}
                        initial={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="relative rounded-xl overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}
                      >
                        {/* Gold ribbon at top */}
                        <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                        
                        <div className="p-4">
                          {/* Badge and Remove */}
                          <div className="flex items-start justify-between mb-2">
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              CONCIERGE PICK
                            </Badge>
                            <button
                              onClick={() => removeConciergeRequest(request.requestId)}
                              className="w-6 h-6 rounded-full bg-white/80 hover:bg-red-100 flex items-center justify-center transition-colors"
                            >
                              <X className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                          
                          {/* Title and Icon */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{request.icon}</span>
                            <h5 className="font-semibold text-gray-900">{request.title}</h5>
                          </div>
                          
                          {/* Pet-First Personalization */}
                          <p className="text-sm text-purple-700 mb-2">
                            Designed for <span className="font-semibold">{request.petName}</span>
                            {request.soulReason && (
                              <span className="text-purple-600"> {request.soulReason}</span>
                            )}
                          </p>
                          
                          {/* Description */}
                          {request.description && (
                            <p className="text-xs text-gray-500 italic mb-3">"{request.description}"</p>
                          )}
                          
                          {/* Promise */}
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>Pet Concierge® will contact you within 2 hours</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Divider if both sections exist */}
                  {hasProducts && (
                    <div className="border-t border-dashed border-purple-200 my-4" />
                  )}
                </div>
              )}
              
              {/* ==================== PRODUCTS SECTION ==================== */}
              {hasProducts && (
                <div className="space-y-3">
                  {hasConcierge && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Package className="w-3 h-3 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900">Products</h4>
                    </div>
                  )}
                  
                  <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.itemId}
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ 
                      opacity: removingItem === item.itemId ? 0 : 1,
                      x: removingItem === item.itemId ? 100 : 0
                    }}
                    exit={{ opacity: 0, x: 100 }}
                    className="relative bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    {/* Autoship Ribbon */}
                    {item.isAutoship && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                    )}
                    
                    <div className="p-3 flex gap-3">
                      {/* Product Image */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=200'}
                          alt={item.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                        />
                        {item.isAutoship && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-md">
                            <RefreshCw className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2 pr-6">{item.name}</h4>
                        
                        {/* Variant Info */}
                        {(item.selectedSize || item.selectedFlavor) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[item.selectedSize, item.selectedFlavor].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        
                        {/* Autoship Badge */}
                        {item.isAutoship && (
                          <Badge className="mt-1.5 bg-purple-100 text-purple-700 text-xs px-2 py-0.5">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Every {item.autoshipFrequency || 4} weeks
                          </Badge>
                        )}
                        
                        {/* Custom Details (for cakes, flat art etc) */}
                        {item.customDetails && (
                          <div className="mt-2 text-xs bg-gray-50 rounded-lg p-2 space-y-0.5">
                            {item.customDetails.shape && <p><span className="text-gray-500">Shape:</span> {item.customDetails.shape}</p>}
                            {item.customDetails.customName && <p><span className="text-gray-500">Name:</span> {item.customDetails.customName}</p>}
                            {item.customDetails.date && <p><span className="text-gray-500">Date:</span> {new Date(item.customDetails.date).toLocaleDateString()}</p>}
                            {/* Flat Art illustration details */}
                            {item.customDetails.illustration_url && (
                              <div className="flex items-center gap-2 mt-1">
                                <img src={item.customDetails.illustration_url} alt="illustration"
                                  className="w-8 h-8 rounded-md object-cover border border-amber-200 flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-amber-700">🐾 Flat Art · {item.customDetails.variant}</p>
                                  <p className="text-gray-400">{item.customDetails.breed_display} · For {item.customDetails.pet_name}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Price & Quantity Row */}
                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
                            <button
                              onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3 text-gray-600" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                            >
                              <Plus className="w-3 h-3 text-gray-600" />
                            </button>
                          </div>
                          
                          {/* Price */}
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</p>
                            {item.quantity > 1 && (
                              <p className="text-xs text-gray-400">₹{item.price}/each</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemove(item.itemId)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center transition-colors group"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                    
                    {/* Autoship Savings Info */}
                    {item.isAutoship && item.autoshipDetails && (
                      <div className="px-3 pb-3">
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2.5 border border-purple-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-purple-700">
                              <span className="font-semibold">{item.autoshipDetails.numDeliveries} deliveries</span>
                              <span className="text-purple-500 ml-1">scheduled</span>
                            </span>
                            <span className="text-green-600 font-semibold">
                              Save ₹{item.autoshipDetails.savings?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
              )}
            </div>
          )}

          {/* ✦ Mira Also Recommends — breed-safe, allergen-filtered */}
          {recommendations.length > 0 && cartItems.length > 0 && (
            <div className="px-4 py-3 border-t border-purple-50" data-testid="cart-recommendations-section">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-700">
                  Mira also recommends for {currentPet?.name}
                </span>
                <span className="text-xs text-gray-400 ml-auto">AI Scored</span>
              </div>
              <div className="space-y-2">
                {recommendations.map(rec => (
                  <CartRecommendationCard
                    key={rec.id || rec._id}
                    product={rec}
                    pet={currentPet}
                    onAdd={(p) => {
                      addToCart && addToCart(p);
                      tdc.cart({ product: p, pillar: p.pillar || "shop", pet: currentPet, channel: "cart_recommendation", amount: p.price });
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Sticky Summary & Checkout */}
        {(hasProducts || hasConcierge) && (
          <div className="sticky bottom-0 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            {/* Autoship Summary - Only show if products */}
            {hasProducts && autoshipSummary.autoshipCount > 0 && (
              <div className="px-4 pt-3">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2.5 border border-purple-100 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs text-purple-700">
                    <span className="font-semibold">{autoshipSummary.autoshipCount} Autoship</span> item{autoshipSummary.autoshipCount !== 1 ? 's' : ''} with 25% off
                  </span>
                </div>
              </div>
            )}
            
            {/* Price Summary - Only show if products */}
            {hasProducts && (
              <div className="p-4 pt-3 space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Products Subtotal</span>
                  <span>₹{autoshipSummary.subtotal?.toLocaleString()}</span>
                </div>
                
                {/* Discount */}
                {autoshipSummary.autoshipDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Autoship Discount
                    </span>
                    <span>-₹{autoshipSummary.autoshipDiscount?.toLocaleString()}</span>
                  </div>
                )}
                
                {/* Shipping */}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span className={autoshipSummary.qualifiesForFreeShipping ? 'text-green-600 font-medium' : ''}>
                    {autoshipSummary.qualifiesForFreeShipping ? 'FREE' : `₹${autoshipSummary.shippingCost}`}
                  </span>
                </div>
                
                {/* Divider */}
                <div className="border-t border-dashed my-2" />
                
                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Products Total</span>
                  <span className="text-xl font-bold text-purple-600">
                    ₹{autoshipSummary.finalTotal?.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            
            {/* Concierge Note */}
            {hasConcierge && (
              <div className="px-4 pb-3">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-800">
                      {conciergeCount} Concierge Request{conciergeCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700">
                    Your Pet Concierge® will contact you with personalized options and pricing.
                  </p>
                </div>
              </div>
            )}
            
            {/* Checkout Buttons */}
            <div className="px-4 pb-4 space-y-2">
              {/* Products Checkout */}
              {hasProducts && (
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-base font-semibold shadow-lg shadow-purple-500/25"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Checkout Products (₹{autoshipSummary.finalTotal?.toLocaleString()})
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
              
              {/* Concierge Submit */}
              {hasConcierge && (
                <Button
                  onClick={handleSubmitConciergeRequests}
                  disabled={submittingConcierge}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 h-12 text-base font-semibold shadow-lg shadow-amber-500/25"
                >
                  {submittingConcierge ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Submit Concierge Request{conciergeCount !== 1 ? 's' : ''}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              )}
              
              {/* Submit All Button - Only if both */}
              {hasProducts && hasConcierge && (
                <>
                  <div className="flex items-center gap-2 my-1">
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="flex-1 border-t border-gray-200" />
                  </div>
                  <Button
                    onClick={async () => {
                      await handleSubmitConciergeRequests();
                      handleCheckout();
                    }}
                    variant="outline"
                    className="w-full h-11 border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Submit All & Checkout
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                onClick={() => setIsCartOpen(false)}
                className="w-full text-gray-600 hover:text-gray-900 h-10"
              >
                Continue Shopping
              </Button>
            </div>
            
            {/* Safe Checkout Badge */}
            <div className="px-4 pb-4 pt-0">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Heart className="w-3.5 h-3.5 text-pink-400" />
                <span>Made with love for your furry family</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;

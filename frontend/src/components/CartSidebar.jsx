import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, RefreshCw, Truck, Gift, Info, Tag, ChevronRight, Sparkles, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

const CartSidebar = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, isCartOpen, setIsCartOpen, autoshipSummary } = useCart();
  const navigate = useNavigate();
  const [removingItem, setRemovingItem] = useState(null);

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

  // Calculate item count
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

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
                  <span className="text-lg font-bold">Your Cart</span>
                  {itemCount > 0 && (
                    <p className="text-xs text-gray-500 font-normal">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => setIsCartOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
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
          {cartItems.length === 0 ? (
            /* Empty Cart State */
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-6 max-w-xs">
                Discover amazing products for your furry friend!
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
            /* Cart Items List */
            <div className="p-4 space-y-3">
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
                        
                        {/* Custom Details (for cakes etc) */}
                        {item.customDetails && (
                          <div className="mt-2 text-xs bg-gray-50 rounded-lg p-2 space-y-0.5">
                            {item.customDetails.shape && <p><span className="text-gray-500">Shape:</span> {item.customDetails.shape}</p>}
                            {item.customDetails.customName && <p><span className="text-gray-500">Name:</span> {item.customDetails.customName}</p>}
                            {item.customDetails.date && <p><span className="text-gray-500">Date:</span> {new Date(item.customDetails.date).toLocaleDateString()}</p>}
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

        {/* Footer - Sticky Summary & Checkout */}
        {cartItems.length > 0 && (
          <div className="sticky bottom-0 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            {/* Autoship Summary */}
            {autoshipSummary.autoshipCount > 0 && (
              <div className="px-4 pt-3">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2.5 border border-purple-100 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-xs text-purple-700">
                    <span className="font-semibold">{autoshipSummary.autoshipCount} Autoship</span> item{autoshipSummary.autoshipCount !== 1 ? 's' : ''} with 25% off
                  </span>
                </div>
              </div>
            )}
            
            {/* Price Summary */}
            <div className="p-4 pt-3 space-y-2">
              {/* Subtotal */}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
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
                <span className="font-semibold text-gray-900">Total</span>
                <div className="text-right">
                  {autoshipSummary.autoshipDiscount > 0 && (
                    <span className="text-sm text-gray-400 line-through mr-2">
                      ₹{(autoshipSummary.subtotal + (autoshipSummary.qualifiesForFreeShipping ? 0 : autoshipSummary.shippingCost))?.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xl font-bold text-purple-600">
                    ₹{autoshipSummary.finalTotal?.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Savings Badge */}
              {autoshipSummary.autoshipDiscount > 0 && (
                <div className="text-center">
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    🎉 You're saving ₹{autoshipSummary.autoshipDiscount?.toLocaleString()}!
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Checkout Buttons */}
            <div className="px-4 pb-4 space-y-2">
              <Button
                onClick={handleCheckout}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12 text-base font-semibold shadow-lg shadow-purple-500/25"
              >
                Checkout
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
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
                <Package className="w-3.5 h-3.5" />
                <span>Secure checkout • Fast delivery • Easy returns</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSidebar;

/**
 * ProductDetailPage.jsx
 * Detailed product view with add to cart functionality
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../utils/api';
import { 
  ArrowLeft, ShoppingCart, Heart, Truck, Shield, Star,
  Plus, Minus, Check, Package, Clock, RefreshCw
} from 'lucide-react';
import MiraContextPanel from '../components/MiraContextPanel';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products/${productId}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data.product || data);
          if (data.product?.variants?.length > 0 || data.variants?.length > 0) {
            setSelectedVariant((data.product?.variants || data.variants)[0]);
          }
        } else {
          toast({
            title: "Product not found",
            description: "This product may no longer be available",
            variant: "destructive"
          });
          navigate('/shop');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId, navigate, toast]);
  
  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      if (!token || !productId) return;
      try {
        const res = await fetch(`${API_URL}/api/member/wishlist`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const inWishlist = data.wishlist?.some(item => item.product_id === productId);
          setIsWishlisted(inWishlist);
        }
      } catch (err) {
        console.log('Wishlist check error:', err);
      }
    };
    checkWishlist();
  }, [token, productId]);
  
  const handleAddToCart = () => {
    if (!product) return;
    
    // Check if product has options that need to be selected
    const hasOptions = product.options?.length > 0 && 
      product.options.some(opt => opt.values?.length > 1 || (opt.values?.length === 1 && opt.values[0] !== 'Default Title'));
    
    if (hasOptions && !selectedVariant) {
      toast({
        title: "Please select options",
        description: "Choose your preferred options before adding to cart",
        variant: "destructive"
      });
      return;
    }
    
    const cartItem = {
      id: product.id,
      name: product.name || product.title,
      price: selectedVariant?.price || product.price || product.pricing?.base_price,
      image: product.image || product.image_url || product.images?.[0],
      quantity,
      variant: selectedVariant?.title,
      variantId: selectedVariant?.id,
      options: product.options?.map((opt, idx) => ({
        name: opt.name,
        value: selectedVariant?.[`option${opt.position || idx + 1}`]
      })).filter(o => o.value)
    };
    
    addToCart(cartItem);
    toast({
      title: "Added to Cart! 🛒",
      description: `${quantity}x ${cartItem.name}${cartItem.variant ? ` (${cartItem.variant})` : ''} added to your cart`,
    });
  };
  
  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">This product may no longer be available</p>
          <Button onClick={() => navigate('/shop')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shop
          </Button>
        </Card>
      </div>
    );
  }
  
  const images = product.images?.length > 0 
    ? product.images 
    : [product.image || product.image_url || 'https://via.placeholder.com/500'];
  
  const price = selectedVariant?.price || product.price || product.pricing?.base_price || 0;
  const comparePrice = product.compare_at_price || product.pricing?.compare_at_price;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount ? Math.round((1 - price / comparePrice) * 100) : 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white" data-testid="product-detail-page">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <img
                src={images[activeImageIndex]}
                alt={product.name || product.title}
                className="w-full h-full object-contain"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/500?text=Product'; }}
              />
              {hasDiscount && (
                <Badge className="absolute top-4 left-4 bg-red-500 text-white text-lg px-3 py-1">
                  {discountPercent}% OFF
                </Badge>
              )}
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                      idx === activeImageIndex ? 'border-purple-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name || product.title}
              </h1>
              
              {product.category && (
                <Badge variant="outline" className="mb-4">{product.category}</Badge>
              )}
              
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-4xl font-bold text-purple-600">
                  ₹{price?.toLocaleString()}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-xl text-gray-400 line-through">
                      ₹{comparePrice?.toLocaleString()}
                    </span>
                    <Badge className="bg-green-500 text-white">Save ₹{(comparePrice - price).toLocaleString()}</Badge>
                  </>
                )}
              </div>
            </div>
            
            {/* Description */}
            <div className="prose prose-sm text-gray-600">
              <p>{product.description || product.short_description || 'A wonderful product for your furry friend!'}</p>
            </div>
            
            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-purple-100 text-purple-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Product Options (Base, Flavour, Size, etc.) */}
            {product.options?.length > 0 && product.options.some(opt => opt.values?.length > 1 || (opt.values?.length === 1 && opt.values[0] !== 'Default Title')) && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Customize Your Order
                </h3>
                {product.options.map((option, optIdx) => (
                  // Skip "Default Title" options
                  option.values?.length > 0 && !(option.values.length === 1 && option.values[0] === 'Default Title') && (
                    <div key={optIdx}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {option.name} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {option.values.map((value, valIdx) => {
                          // Check if this value is selected in the current variant
                          const isSelected = selectedVariant?.[`option${option.position}`] === value ||
                                           selectedVariant?.[`option${optIdx + 1}`] === value;
                          
                          return (
                            <Button
                              key={valIdx}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                // Find variant that matches this selection
                                const optionKey = `option${option.position || optIdx + 1}`;
                                const newVariant = product.variants?.find(v => {
                                  // Match this option value
                                  if (v[optionKey] !== value) return false;
                                  // Also match other selected options
                                  for (let i = 0; i < product.options.length; i++) {
                                    if (i !== optIdx) {
                                      const otherKey = `option${product.options[i].position || i + 1}`;
                                      if (selectedVariant?.[otherKey] && v[otherKey] !== selectedVariant[otherKey]) {
                                        return false;
                                      }
                                    }
                                  }
                                  return true;
                                }) || product.variants?.find(v => v[optionKey] === value);
                                
                                if (newVariant) {
                                  setSelectedVariant(newVariant);
                                }
                              }}
                              className={isSelected 
                                ? "bg-purple-600 hover:bg-purple-700" 
                                : "hover:border-purple-300 hover:bg-purple-50"
                              }
                            >
                              {value}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )
                ))}
                
                {/* Show selected variant summary */}
                {selectedVariant && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Selected:</span> {selectedVariant.title}
                    </p>
                    <p className="text-lg font-bold text-purple-600 mt-1">
                      ₹{selectedVariant.price?.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Legacy Variants Display (only if no structured options) */}
            {(!product.options?.length || product.options.every(opt => opt.values?.length === 1 && opt.values[0] === 'Default Title')) && (product.variants?.length > 1) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant, idx) => (
                    <Button
                      key={idx}
                      variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                      onClick={() => setSelectedVariant(variant)}
                      className={selectedVariant?.id === variant.id ? "bg-purple-600" : ""}
                    >
                      {variant.title} - ₹{variant.price?.toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-purple-600 hover:bg-purple-700 py-6 text-lg"
                data-testid="add-to-cart-btn"
              >
                <ShoppingCart className="w-5 h-5 mr-2" /> Add to Cart
              </Button>
              <Button
                onClick={handleBuyNow}
                variant="outline"
                className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50 py-6 text-lg"
              >
                Buy Now
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  if (!token) {
                    toast({
                      title: "Login Required",
                      description: "Please login to save to wishlist",
                      variant: "destructive"
                    });
                    return;
                  }
                  try {
                    if (isWishlisted) {
                      const res = await fetch(`${API_URL}/api/member/wishlist/${product.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (res.ok) {
                        setIsWishlisted(false);
                        toast({ title: "Removed from Wishlist", description: `${product.name || product.title}` });
                      } else {
                        const errData = await res.json().catch(() => ({}));
                        toast({ title: "Error", description: errData.detail || "Failed to remove", variant: "destructive" });
                      }
                    } else {
                      const res = await fetch(`${API_URL}/api/member/wishlist/add`, {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                          product_id: product.id,
                          product_name: product.name || product.title,
                          product_image: images[0],
                          product_price: price
                        })
                      });
                      if (res.ok) {
                        setIsWishlisted(true);
                        toast({ title: "Added to Wishlist ❤️", description: `${product.name || product.title}` });
                      } else {
                        const errData = await res.json().catch(() => ({}));
                        toast({ title: "Error", description: errData.detail || "Failed to add", variant: "destructive" });
                      }
                    }
                  } catch (err) {
                    console.error('Wishlist error:', err);
                    toast({ title: "Network Error", description: "Please try again", variant: "destructive" });
                  }
                }}
                className="py-6"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto text-green-600 mb-1" />
                <p className="text-xs text-gray-600">Free Delivery<br/>Over ₹500</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto text-blue-600 mb-1" />
                <p className="text-xs text-gray-600">100%<br/>Authentic</p>
              </div>
              <div className="text-center">
                <Clock className="w-6 h-6 mx-auto text-orange-600 mb-1" />
                <p className="text-xs text-gray-600">Same Day<br/>Dispatch</p>
              </div>
            </div>
            
            {/* Stock Status */}
            <div className="flex items-center gap-2 text-sm">
              {product.in_stock !== false ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">In Stock - Ready to Ship</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-500">Made to Order - 3-5 Days</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mira Context Panel */}
      <MiraContextPanel pillar="shop" />
    </div>
  );
};

export default ProductDetailPage;

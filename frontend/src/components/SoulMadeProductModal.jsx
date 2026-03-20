/**
import { tdc } from '../utils/tdc_intent';
 * SoulMadeProductModal.jsx
 * 
 * Product detail modal for Soul Made personalized products.
 * Shows:
 * - Large product mockup image
 * - Pet name customization input
 * - Size/variant selection
 * - Add to cart functionality
 * 
 * The personalization happens here - user enters their pet's name
 * and selects options before adding to cart.
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Heart, ShoppingCart, Check, ChevronDown, PawPrint, Truck, Gift, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

// Size options for different product types
const SIZE_OPTIONS = {
  bandana: [
    { id: 'xs', label: 'XS', description: 'Puppies & Toy breeds', neck: '8-12"' },
    { id: 's', label: 'S', description: 'Small breeds', neck: '12-16"' },
    { id: 'm', label: 'M', description: 'Medium breeds', neck: '16-20"' },
    { id: 'l', label: 'L', description: 'Large breeds', neck: '20-26"' },
    { id: 'xl', label: 'XL', description: 'Giant breeds', neck: '26-32"' },
  ],
  blanket: [
    { id: 's', label: 'Small', description: '30" × 40"', price: 999 },
    { id: 'm', label: 'Medium', description: '40" × 50"', price: 1299 },
    { id: 'l', label: 'Large', description: '50" × 60"', price: 1599 },
  ],
  bowl: [
    { id: 's', label: 'Small', description: '1 cup / 8oz', price: 499 },
    { id: 'm', label: 'Medium', description: '2 cups / 16oz', price: 599 },
    { id: 'l', label: 'Large', description: '4 cups / 32oz', price: 699 },
  ],
  welcome_mat: [
    { id: 's', label: 'Standard', description: '18" × 24"', price: 999 },
    { id: 'l', label: 'Large', description: '24" × 36"', price: 1199 },
  ],
  tote_bag: [
    { id: 's', label: 'Small', description: '12" × 14"', price: 599 },
    { id: 'l', label: 'Large', description: '16" × 18"', price: 699 },
  ],
};

// Color options
const COLOR_OPTIONS = {
  bandana: ['White', 'Cream', 'Light Blue', 'Lavender'],
  mug: ['White', 'Black'],
  blanket: ['Cream', 'Grey', 'Soft Pink'],
};

const SoulMadeProductModal = ({ 
  product, 
  petName: defaultPetName = '', 
  breedName = '',
  isOpen, 
  onClose, 
  onAddToCart 
}) => {
  const [customName, setCustomName] = useState(defaultPetName);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setCustomName(defaultPetName);
      // Default to 'm' (Medium) size as most common pet size
      const productType = product.product_type || '';
      const availableSizes = SIZE_OPTIONS[productType];
      if (availableSizes && availableSizes.length > 0) {
        // Try to default to 'm' (medium), otherwise first available size
        const defaultSize = availableSizes.find(s => s.id === 'm') || availableSizes[0];
        setSelectedSize(defaultSize.id);
      } else {
        setSelectedSize(null);
      }
      // Default to 'White' for products with color options
      if (COLOR_OPTIONS[productType]) {
        setSelectedColor('White');
      } else {
        setSelectedColor(null);
      }
      setQuantity(1);
    }
  }, [product, defaultPetName]);

  if (!isOpen || !product) return null;

  const productType = product.product_type || '';
  const hasSizes = SIZE_OPTIONS[productType];
  const hasColors = COLOR_OPTIONS[productType];
  const basePrice = product.price || 0;

  // Calculate final price based on selected size
  const getFinalPrice = () => {
    if (selectedSize && hasSizes) {
      const sizeOption = hasSizes.find(s => s.id === selectedSize);
      if (sizeOption?.price) {
        return sizeOption.price;
      }
    }
    return basePrice;
  };

  const finalPrice = getFinalPrice();

  // Get personalized product name
  const getPersonalizedName = () => {
    const name = customName || defaultPetName || 'Your Pet';
    const type = productType;
    
    if (type === 'bandana') return `${name}'s Special Bandana`;
    if (type === 'mug') return `${name} Lover Mug`;
    if (type === 'bowl') return `${name}'s Dinner Bowl`;
    if (type === 'blanket') return `${name}'s Cozy Blanket`;
    if (type === 'welcome_mat') return `Welcome to ${name}'s Home`;
    if (type === 'treat_jar') return `${name}'s Treat Jar`;
    if (type === 'tote_bag') return `Proud ${name} Parent Tote`;
    if (type === 'keychain') return `${name} Keychain`;
    if (type === 'frame') return `${name}'s Portrait Frame`;
    if (type === 'party_hat') return `${name}'s Party Hat`;
    if (type === 'collar_tag') return `${name}'s ID Tag`;
    return `${product.name} for ${name}`;
  };

  // Check if can add to cart
  const canAddToCart = () => {
    if (!customName.trim()) return false;
    if (hasSizes && !selectedSize) return false;
    if (hasColors && !selectedColor) return false;
    return true;
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!canAddToCart()) return;

    const cartItem = {
      product_id: product.id,
      product_type: productType,
      name: getPersonalizedName(),
      custom_name: customName,
      breed: product.breed,
      breed_name: breedName || product.breed_name,
      size: selectedSize,
      color: selectedColor,
      quantity,
      unit_price: finalPrice,
      total_price: finalPrice * quantity,
      mockup_url: product.mockup_url,
      personalization: {
        pet_name: customName,
        size: selectedSize,
        color: selectedColor
      }
    };

    // tdc.cart — soul product added to cart
    tdc.cart({ product: cartItem, pillar: 'shop', channel: 'soul_made_product_modal', amount: cartItem.total_price });
    onAddToCart?.(cartItem);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="soul-made-modal"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-gray-100 shadow-md transition-colors"
          data-testid="modal-close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Left: Product Image */}
          <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 p-8 flex items-center justify-center">
            {/* Soul Made badge */}
            <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full px-4 py-2 shadow-lg">
              <span className="text-white text-sm font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Soul Made
              </span>
            </div>

            {/* Product image */}
            <div className="w-full aspect-square max-w-md">
              {product.mockup_url ? (
                <img
                  src={product.mockup_url}
                  alt={getPersonalizedName()}
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
                  <PawPrint className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>

            {/* Breed info */}
            <div className="absolute bottom-4 left-4 right-4">
              <Badge className="bg-white/90 text-purple-700 shadow-sm">
                {breedName || product.breed_name || 'Personalized'}
              </Badge>
            </div>
          </div>

          {/* Right: Product Details & Customization */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Product title */}
            <div>
              <Badge className="mb-2 bg-purple-100 text-purple-700 capitalize">
                {productType.replace('_', ' ')}
              </Badge>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {getPersonalizedName()}
              </h2>
              <p className="text-gray-500 text-sm">
                Featuring soulful watercolor {breedName || product.breed_name} illustration
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-purple-600">₹{finalPrice}</span>
              {selectedSize && hasSizes?.find(s => s.id === selectedSize)?.price && (
                <span className="text-sm text-gray-400 line-through">₹{basePrice}</span>
              )}
            </div>

            {/* Name Customization */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <Heart className="w-4 h-4 inline mr-1 text-pink-500" />
                Pet's Name *
              </label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter your pet's name"
                className="text-lg"
                maxLength={20}
                data-testid="pet-name-input"
              />
              <p className="text-xs text-gray-500">
                This name will be printed on your product
              </p>
            </div>

            {/* Size Selection */}
            {hasSizes && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Size *
                  </label>
                  <button 
                    className="text-xs text-purple-600 hover:underline"
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                  >
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {hasSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedSize === size.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      data-testid={`size-${size.id}`}
                    >
                      <div className="font-semibold">{size.label}</div>
                      <div className="text-xs text-gray-500">{size.description}</div>
                      {size.price && (
                        <div className="text-xs text-purple-600 mt-1">₹{size.price}</div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Size Guide */}
                {showSizeGuide && productType === 'bandana' && (
                  <Card className="p-4 bg-gray-50 text-xs">
                    <p className="font-medium mb-2">How to measure:</p>
                    <p>Measure around your pet's neck where the collar sits, then add 2-3 inches for comfort.</p>
                  </Card>
                )}
              </div>
            )}

            {/* Color Selection */}
            {hasColors && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Color *
                </label>
                <div className="flex gap-2 flex-wrap">
                  {hasColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? 'border-purple-600 bg-purple-50 text-purple-700 font-medium'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(10, quantity + 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button
              onClick={handleAddToCart}
              disabled={!canAddToCart()}
              className={`w-full py-6 text-lg ${
                canAddToCart()
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart - ₹{finalPrice * quantity}
            </Button>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <Truck className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <p className="text-xs text-gray-600">Pan India Delivery</p>
              </div>
              <div className="text-center">
                <Gift className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <p className="text-xs text-gray-600">Gift Wrapped</p>
              </div>
              <div className="text-center">
                <Shield className="w-5 h-5 mx-auto text-purple-600 mb-1" />
                <p className="text-xs text-gray-600">Quality Assured</p>
              </div>
            </div>

            {/* Soul Level note */}
            <p className="text-xs text-center text-gray-400">
              <Sparkles className="w-3 h-3 inline mr-1" />
              Soul-Level Personalization • Made with love for {customName || 'your pet'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoulMadeProductModal;

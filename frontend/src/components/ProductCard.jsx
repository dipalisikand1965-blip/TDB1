import React, { useState } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';

const ProductCard = ({ product }) => {
  const sizes = product.sizes || ['Standard'];
  const flavors = product.flavors || ['Classic'];
  
  // Helper to get size name/price
  const getSizeDetails = (size) => {
    if (typeof size === 'object') return size;
    return { name: size, price: product.price };
  };

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedFlavor, setSelectedFlavor] = useState(flavors[0]);
  const { addToCart } = useCart();

  // Get current price based on selection
  const currentSizeDetails = getSizeDetails(selectedSize);
  const currentPrice = currentSizeDetails.price;

  const handleAddToCart = () => {
    // Create a product variant object for the cart
    const cartItem = {
      ...product,
      price: currentPrice, // Use the variant price
      selectedSize: currentSizeDetails.name
    };
    addToCart(cartItem, currentSizeDetails.name, selectedFlavor);
    toast({
      title: 'Added to cart! 🎉',
      description: `${product.name} (${currentSizeDetails.name}, ${selectedFlavor}) - ₹${currentPrice}`,
    });
  };

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
      {/* Image */}
      <div className="relative overflow-hidden aspect-square">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isNew && <Badge className="bg-purple-600">New</Badge>}
          {product.isBestseller && <Badge className="bg-pink-600">Bestseller</Badge>}
          {product.onSale && <Badge className="bg-orange-500">Sale</Badge>}
        </div>
        {/* Wishlist */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">({product.reviews})</span>
        </div>

        {/* Name */}
        <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

        {/* Size Selection */}
        {sizes.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Size</label>
            <div className="flex gap-2 flex-wrap">
              {sizes.map((size) => {
                const details = getSizeDetails(size);
                const isSelected = (typeof selectedSize === 'object' ? selectedSize.name : selectedSize) === details.name;
                
                return (
                  <button
                    key={details.name}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1 text-xs rounded-md border transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-600 font-medium'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {details.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Flavor Selection */}
        {flavors.length > 1 && (
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Flavor</label>
            <select
              value={selectedFlavor}
              onChange={(e) => setSelectedFlavor(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {flavors.map((flavor) => (
                <option key={flavor} value={flavor}>
                  {flavor}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-2xl font-bold text-gray-900">₹{currentPrice}</p>
            {product.originalPrice > currentPrice && (
              <p className="text-sm text-gray-500 line-through">₹{product.originalPrice}</p>
            )}
          </div>
          <Button
            onClick={handleAddToCart}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

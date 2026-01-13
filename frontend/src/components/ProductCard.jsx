import React, { useState } from 'react';
import { ShoppingCart, Star, X, CalendarIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';

const ProductCard = ({ product }) => {
  const [showModal, setShowModal] = useState(false);
  
  // Calculate minimum price for "From Rs. X" display
  const getMinPrice = () => {
    if (product.minPrice) return product.minPrice;
    if (product.sizes && product.sizes.length > 0) {
      const prices = product.sizes.map(s => typeof s === 'object' ? s.price : product.price);
      return Math.min(...prices.filter(p => p > 0));
    }
    return product.price || 0;
  };

  const minPrice = getMinPrice();
  const optionsCount = (product.sizes?.length || 1) * (product.flavors?.length || 1);

  return (
    <>
      {/* Product Card - Shows "From Rs. X" */}
      <div 
        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
        onClick={() => setShowModal(true)}
        data-testid={`product-card-${product.id}`}
      >
        {/* Image */}
        <div className="relative overflow-hidden aspect-square">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && <Badge className="bg-purple-600">New</Badge>}
            {product.isBestseller && <Badge className="bg-pink-600">Bestseller</Badge>}
            {product.onSale && <Badge className="bg-orange-500">Sale</Badge>}
          </div>
          {/* Options count */}
          {optionsCount > 1 && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-white/90 text-gray-700 text-xs">
                {optionsCount} options
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.floor(product.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.reviews || 0})</span>
            </div>
          )}

          {/* Name */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">{product.name}</h3>

          {/* Price - "From Rs. X" */}
          <p className="text-base font-bold text-gray-900">
            From Rs. {minPrice.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Product Detail Modal */}
      {showModal && (
        <ProductDetailModal 
          product={product} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
};

// Product Detail Modal Component
const ProductDetailModal = ({ product, onClose }) => {
  const sizes = product.sizes && product.sizes.length > 0 
    ? product.sizes 
    : [{ name: 'Standard', price: product.price || 0 }];
  const flavors = product.flavors && product.flavors.length > 0 
    ? product.flavors 
    : [];

  // Helper to get size details
  const getSizeDetails = (size) => {
    if (typeof size === 'object') return size;
    return { name: size, price: product.price || 0 };
  };

  // Helper to get flavor details
  const getFlavorDetails = (flavor) => {
    if (typeof flavor === 'object') return flavor;
    return { name: flavor, price: 0 };
  };

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedFlavor, setSelectedFlavor] = useState(flavors.length > 0 ? flavors[0] : null);
  const [cartInput, setCartInput] = useState({
    petName: '',
    date: null,
    time: '',
    age: ''
  });
  
  const { addToCart } = useCart();

  // Get current price based on selection
  const currentSizeDetails = getSizeDetails(selectedSize);
  const currentFlavorDetails = selectedFlavor ? getFlavorDetails(selectedFlavor) : { name: '', price: 0 };
  const currentPrice = (currentSizeDetails.price || 0) + (currentFlavorDetails.price || 0);

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      price: currentPrice,
      selectedSize: currentSizeDetails.name,
      selectedFlavor: currentFlavorDetails.name || 'Standard',
      customDetails: { ...cartInput }
    };
    addToCart(cartItem, currentSizeDetails.name, currentFlavorDetails.name || 'Standard');
    toast({
      title: 'Added to cart! 🎉',
      description: `${product.name} - ₹${currentPrice}`,
    });
    onClose();
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="grid md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square bg-gray-100">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {product.isNew && <Badge className="bg-purple-600">New</Badge>}
              {product.isBestseller && <Badge className="bg-pink-600">Bestseller</Badge>}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 overflow-y-auto max-h-[90vh] md:max-h-none">
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(product.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.reviews || 0})</span>
              </div>
            )}

            {/* Name */}
            <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
            
            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
            )}

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 block mb-2">Select Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {sizes.map((size, idx) => {
                    const details = getSizeDetails(size);
                    const isSelected = (typeof selectedSize === 'object' ? selectedSize.name : selectedSize) === details.name;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-2 text-sm rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-xs">{details.name}</div>
                        <div className="text-purple-600 font-bold">₹{details.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Flavor Selection */}
            {flavors.length > 1 && (
              <div className="mb-4">
                <label className="text-sm font-semibold text-gray-700 block mb-2">Select Flavor</label>
                <div className="flex flex-wrap gap-2">
                  {flavors.map((flavor, idx) => {
                    const details = getFlavorDetails(flavor);
                    const isSelected = selectedFlavor && (typeof selectedFlavor === 'object' ? selectedFlavor.name : selectedFlavor) === details.name;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`px-3 py-1.5 text-xs rounded-full border-2 transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {details.name} {details.price > 0 && <span>(+₹{details.price})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Personalization */}
            <div className="space-y-3 mb-4 pt-3 border-t">
              <label className="text-sm font-semibold text-gray-700 block">Personalization</label>
              <Input 
                placeholder="Pet's Name (for cake)" 
                value={cartInput.petName}
                onChange={(e) => setCartInput({...cartInput, petName: e.target.value})}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="Pet's Age" 
                  value={cartInput.age}
                  onChange={(e) => setCartInput({...cartInput, age: e.target.value})}
                  className="text-sm"
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-sm h-10">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {cartInput.date ? format(cartInput.date, 'PP') : <span className="text-gray-500">Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[10000]" align="start">
                    <Calendar
                      mode="single"
                      selected={cartInput.date}
                      onSelect={(date) => setCartInput({...cartInput, date})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <select 
                className="w-full px-3 py-2 border rounded-lg text-sm"
                value={cartInput.time}
                onChange={(e) => setCartInput({...cartInput, time: e.target.value})}
              >
                <option value="">Select Delivery Time</option>
                <option value="10am-1pm">10 AM - 1 PM</option>
                <option value="1pm-4pm">1 PM - 4 PM</option>
                <option value="4pm-7pm">4 PM - 7 PM</option>
                <option value="7pm-9pm">7 PM - 9 PM</option>
              </select>
            </div>

            {/* Shipping Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-xs">
              <p className="text-yellow-800">
                <strong>Shipping:</strong> ₹150 flat for orders below ₹3000. FREE delivery above ₹3000!
              </p>
            </div>

            {/* Price & Add to Cart */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div>
                <p className="text-xs text-gray-500">Total Price</p>
                <p className="text-2xl font-bold text-gray-900">₹{currentPrice}</p>
              </div>
              <Button
                onClick={handleAddToCart}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 px-6"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

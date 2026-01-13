import React, { useState } from 'react';
import { ShoppingCart, Heart, Star, X, CalendarIcon, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
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
    if (product.price) return product.price;
    if (product.sizes && product.sizes.length > 0) {
      const prices = product.sizes.map(s => typeof s === 'object' ? s.price : product.price);
      return Math.min(...prices.filter(p => p > 0));
    }
    return product.price || 0;
  };

  const minPrice = getMinPrice();

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
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isNew && <Badge className="bg-purple-600">New</Badge>}
            {product.isBestseller && <Badge className="bg-pink-600">Bestseller</Badge>}
            {product.onSale && <Badge className="bg-orange-500">Sale</Badge>}
          </div>
          {/* Options count */}
          {((product.sizes && product.sizes.length > 1) || (product.flavors && product.flavors.length > 1)) && (
            <div className="absolute bottom-3 left-3">
              <Badge variant="secondary" className="bg-white/90 text-gray-700">
                {(product.sizes?.length || 1) * (product.flavors?.length || 1)} options
              </Badge>
            </div>
          )}
          {/* Quick view on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button className="bg-white text-purple-600 hover:bg-purple-50">
              View Options
            </Button>
          </div>
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
              <span className="text-xs text-gray-600">({product.reviews || 0})</span>
            </div>
          )}

          {/* Name */}
          <h3 className="font-bold text-gray-900 line-clamp-2">{product.name}</h3>

          {/* Price - "From Rs. X" */}
          <div className="pt-1">
            <p className="text-lg font-bold text-gray-900">
              From Rs. {minPrice.toLocaleString('en-IN')}
            </p>
          </div>
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
  const sizes = product.sizes || [{ name: 'Standard', price: product.price }];
  const flavors = product.flavors || [{ name: 'Classic', price: 0 }];
  
  // Helper to get size details
  const getSizeDetails = (size) => {
    if (typeof size === 'object') return size;
    return { name: size, price: product.price };
  };

  // Helper to get flavor details
  const getFlavorDetails = (flavor) => {
    if (typeof flavor === 'object') return flavor;
    return { name: flavor, price: 0 };
  };

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedFlavor, setSelectedFlavor] = useState(flavors[0]);
  const [cartInput, setCartInput] = useState({
    petName: '',
    date: null,
    time: '',
    age: ''
  });
  
  const { addToCart } = useCart();

  // Get current price based on selection
  const currentSizeDetails = getSizeDetails(selectedSize);
  const currentFlavorDetails = getFlavorDetails(selectedFlavor);
  const currentPrice = (currentSizeDetails.price || 0) + (currentFlavorDetails.price || 0);

  const handleAddToCart = () => {
    const cartItem = {
      ...product,
      price: currentPrice,
      selectedSize: currentSizeDetails.name,
      selectedFlavor: currentFlavorDetails.name,
      customDetails: { ...cartInput }
    };
    addToCart(cartItem, currentSizeDetails.name, currentFlavorDetails.name);
    toast({
      title: 'Added to cart! 🎉',
      description: `${product.name} (${currentSizeDetails.name}, ${currentFlavorDetails.name}) - ₹${currentPrice}`,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square">
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
          <div className="p-6 space-y-4">
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center gap-2">
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
                <span className="text-sm text-gray-600">({product.reviews || 0} reviews)</span>
              </div>
            )}

            {/* Name & Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
              <p className="text-gray-600 mt-2">{product.description}</p>
            </div>

            {/* Size Selection */}
            {sizes.length > 0 && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Select Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {sizes.map((size, idx) => {
                    const details = getSizeDetails(size);
                    const isSelected = (typeof selectedSize === 'object' ? selectedSize.name : selectedSize) === details.name;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-3 text-sm rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">{details.name}</div>
                        <div className="text-purple-600 font-bold">₹{details.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Flavor Selection */}
            {flavors.length > 1 && (
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-2">Select Flavor</label>
                <div className="grid grid-cols-2 gap-2">
                  {flavors.map((flavor, idx) => {
                    const details = getFlavorDetails(flavor);
                    const isSelected = (typeof selectedFlavor === 'object' ? selectedFlavor.name : selectedFlavor) === details.name;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedFlavor(flavor)}
                        className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {details.name} {details.price > 0 && <span className="text-purple-600">(+₹{details.price})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Personalization */}
            <div className="space-y-3 pt-2 border-t">
              <label className="text-sm font-semibold text-gray-700 block">Personalization</label>
              <Input 
                placeholder="Pet's Name (for cake)" 
                value={cartInput.petName}
                onChange={(e) => setCartInput({...cartInput, petName: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  placeholder="Pet's Age" 
                  value={cartInput.age}
                  onChange={(e) => setCartInput({...cartInput, age: e.target.value})}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {cartInput.date ? format(cartInput.date, 'PPP') : <span>Delivery Date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                className="w-full px-4 py-2 border rounded-lg"
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

            {/* Price & Add to Cart */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-gray-500">Total Price</p>
                <p className="text-3xl font-bold text-gray-900">₹{currentPrice}</p>
              </div>
              <Button
                onClick={handleAddToCart}
                size="lg"
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProductCard;

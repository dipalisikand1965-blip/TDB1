import React, { useState } from 'react';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import { Input } from './ui/input';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';

const ProductCard = ({ product }) => {
  const sizes = product.sizes || ['Standard'];
  const flavors = product.flavors || ['Classic'];
  
  // Helper to get size name/price
  const getSizeDetails = (size) => {
    if (typeof size === 'object') return size;
    return { name: size, price: product.price };
  };

  // Helper to get flavor name/price
  const getFlavorDetails = (flavor) => {
    if (typeof flavor === 'object') return flavor;
    return { name: flavor, price: 0 };
  };

  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedFlavor, setSelectedFlavor] = useState(flavors[0]);
  const [cartInput, setCartInput] = useState({
    petName: '',
    date: null,
    time: ''
    age: '',
  });
  
  const { addToCart } = useCart();

  // Get current price based on selection
  const currentSizeDetails = getSizeDetails(selectedSize);
  const currentFlavorDetails = getFlavorDetails(selectedFlavor);
  
  // Total price = Size Price + Flavor Price
  const currentPrice = currentSizeDetails.price + currentFlavorDetails.price;

  const handleAddToCart = () => {
    // Create a product variant object for the cart
    const cartItem = {
      ...product,
      price: currentPrice, // Use the variant price
      selectedSize: currentSizeDetails.name,
      selectedFlavor: currentFlavorDetails.name,
      customDetails: {
        ...cartInput
      }
    };
    addToCart(cartItem, currentSizeDetails.name, currentFlavorDetails.name);
    toast({
      title: 'Added to cart! 🎉',
      description: `${product.name} (${currentSizeDetails.name}, ${currentFlavorDetails.name}) - ₹${currentPrice}`,
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
              value={typeof selectedFlavor === 'object' ? selectedFlavor.name : selectedFlavor}
              onChange={(e) => {
                const flav = flavors.find(f => (typeof f === 'object' ? f.name : f) === e.target.value);
                setSelectedFlavor(flav);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {flavors.map((flavor) => {
                const details = getFlavorDetails(flavor);
                return (
                  <option key={details.name} value={details.name}>
                    {details.name} {details.price > 0 ? `(+₹${details.price})` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Personalization Inputs */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <Input 
            placeholder="Pet's Name" 
            className="h-8 text-xs"
            value={cartInput.petName}
            onChange={(e) => setCartInput({...cartInput, petName: e.target.value})}
          />
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-8 text-xs justify-start text-left font-normal px-2">
          <div className="flex gap-2">
                  <CalendarIcon className="mr-2 h-3 w-3" />
          <Input 
            placeholder="Age" 
            className="h-8 text-xs w-16"
            value={cartInput.age}
            onChange={(e) => setCartInput({...cartInput, age: e.target.value})}
          />
                  {cartInput.date ? format(cartInput.date, 'PPP') : <span>Delivery Date</span>}
          </div>
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
            <div className="relative w-[100px]">
               <Clock className="absolute left-2 top-2 h-3 w-3 text-gray-500" />
               <select 
                 className="w-full h-8 text-xs border rounded-md pl-6 pr-2 bg-transparent"
                 value={cartInput.time}
                 onChange={(e) => setCartInput({...cartInput, time: e.target.value})}
               >
                 <option value="">Time</option>
                 <option value="10am-1pm">10-1</option>
                 <option value="1pm-4pm">1-4</option>
                 <option value="4pm-7pm">4-7</option>
                 <option value="7pm-9pm">7-9</option>
               </select>
            </div>
          </div>
        </div>

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

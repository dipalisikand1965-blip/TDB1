/**
 * PetDailyRoutine.jsx
 * Personalized daily routine suggestions based on pet profile
 * NOW FETCHES REAL PRODUCTS from Product Box with actual images
 * INCLUDES PRODUCT MODAL for add-to-cart
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Sun, Cloud, Sunset, Moon, ChevronRight, ShoppingBag, Loader2, X, Plus, Minus, ShoppingCart, Truck, Check, Package, PawPrint } from 'lucide-react';
import { API_URL } from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { toast } from '../../hooks/use-toast';

// Product Detail Modal for Routine Products
const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart, currentBreed }) => {
  const [quantity, setQuantity] = useState(1);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen || !product) return null;
  
  const productImage = product.image_url || product.image || product.images?.[0];
  const productName = (product.name || '').toLowerCase();
  const isForCurrentBreed = currentBreed && productName.includes(currentBreed.toLowerCase());
  
  // Detect if product is for another breed
  const allBreeds = ['indie', 'labrador', 'golden retriever', 'pug', 'beagle', 'shih tzu', 
    'german shepherd', 'maltese', 'poodle', 'bulldog', 'husky', 'chihuahua', 'cavalier'];
  const productBreed = allBreeds.find(b => productName.includes(b));
  const isOtherBreed = productBreed && currentBreed && !productName.includes(currentBreed.toLowerCase());
  
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div 
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Image */}
        <div className="relative">
          {productImage ? (
            <img 
              src={productImage} 
              alt={product.name}
              className="w-full h-56 object-cover"
              onError={(e) => {
                e.target.src = 'https://res.cloudinary.com/duoapcx1p/image/upload/v1773293720/doggy/products/puzzle_toys.webp';
              }}
            />
          ) : (
            <div className="w-full h-56 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Package className="w-16 h-16 text-amber-300" />
            </div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Breed badge */}
          {isOtherBreed && (
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-violet-100 text-violet-700 shadow-sm">
                <PawPrint className="w-3 h-3 mr-1" />
                {productBreed.charAt(0).toUpperCase() + productBreed.slice(1)} Product
              </Badge>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[50vh]">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
          <p className="text-gray-600 text-sm mb-4">{product.description || 'Quality training product for your pet.'}</p>
          
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-amber-600">₹{product.price || 999}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-gray-400 line-through">₹{product.original_price}</span>
                <Badge className="bg-green-100 text-green-700">
                  {Math.round((1 - product.price / product.original_price) * 100)}% off
                </Badge>
              </>
            )}
          </div>
          
          {/* Stock & Delivery */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className="flex items-center text-green-600">
              <Check className="w-4 h-4 mr-1" /> In Stock
            </span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center text-gray-500">
              <Truck className="w-4 h-4 mr-1" /> Free delivery over ₹999
            </span>
          </div>
          
          {/* Quantity selector */}
          <div className="flex items-center gap-4 mb-5">
            <span className="text-sm text-gray-600">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-100"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-medium">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 hover:bg-gray-100"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Add to cart button */}
          <Button 
            onClick={() => {
              onAddToCart({ ...product, quantity });
              onClose();
            }}
            className="w-full bg-amber-500 hover:bg-amber-600"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart - ₹{(product.price || 999) * quantity}
          </Button>
        </div>
      </div>
    </div>
  );
};

const getRoutineSuggestions = (pet) => {
  const isSenior = pet?.age_months > 84;
  const isPuppy = pet?.age_months < 12;
  
  if (isSenior) {
    return {
      morning: {
        icon: Sun,
        color: 'from-amber-100 to-orange-100',
        iconColor: 'text-amber-600',
        activities: ['20-30 min gentle walk', 'Hydration check', 'Joint supplement'],
      },
      midday: {
        icon: Cloud,
        color: 'from-sky-100 to-blue-100',
        iconColor: 'text-sky-600',
        activities: ['Cool resting area', 'Short movement break', 'Light play'],
      },
      evening: {
        icon: Sunset,
        color: 'from-rose-100 to-pink-100',
        iconColor: 'text-rose-600',
        activities: ['Long relaxed walk', 'Light stretching', 'Slow feeder dinner'],
      },
      night: {
        icon: Moon,
        color: 'from-indigo-100 to-purple-100',
        iconColor: 'text-indigo-600',
        activities: ['Orthopedic bed', 'Calm environment', 'Comfort check'],
      },
      productKeywords: ['senior', 'orthopedic', 'joint', 'comfort', 'slow feeder', 'supplement']
    };
  }
  
  if (isPuppy) {
    return {
      morning: {
        icon: Sun,
        color: 'from-amber-100 to-orange-100',
        iconColor: 'text-amber-600',
        activities: ['Potty break', 'Breakfast', 'Short play session'],
      },
      midday: {
        icon: Cloud,
        color: 'from-sky-100 to-blue-100',
        iconColor: 'text-sky-600',
        activities: ['Training session (10 min)', 'Nap time', 'Socialization'],
      },
      evening: {
        icon: Sunset,
        color: 'from-rose-100 to-pink-100',
        iconColor: 'text-rose-600',
        activities: ['Active play', 'Dinner', 'Calm bonding time'],
      },
      night: {
        icon: Moon,
        color: 'from-indigo-100 to-purple-100',
        iconColor: 'text-indigo-600',
        activities: ['Last potty break', 'Crate time', 'Quiet sleep'],
      },
      productKeywords: ['puppy', 'training', 'crate', 'treat', 'clicker', 'starter']
    };
  }
  
  // Adult dog default
  return {
    morning: {
      icon: Sun,
      color: 'from-amber-100 to-orange-100',
      iconColor: 'text-amber-600',
      activities: ['45-60 min walk', 'Morning meal', 'Training recap'],
    },
    midday: {
      icon: Cloud,
      color: 'from-sky-100 to-blue-100',
      iconColor: 'text-sky-600',
      activities: ['Enrichment toys', 'Rest period', 'Short play'],
    },
    evening: {
      icon: Sunset,
      color: 'from-rose-100 to-pink-100',
      iconColor: 'text-rose-600',
      activities: ['Long walk or run', 'Evening meal', 'Play time'],
    },
    night: {
      icon: Moon,
      color: 'from-indigo-100 to-purple-100',
      iconColor: 'text-indigo-600',
      activities: ['Last walk', 'Calm time', 'Sleep routine'],
    },
    productKeywords: ['training', 'enrichment', 'puzzle', 'leash', 'toy', 'bed']
  };
};

const PetDailyRoutine = ({ pet, onProductClick }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart } = useCart();
  
  const routine = getRoutineSuggestions(pet);
  const petBreed = (pet?.breed || '').toLowerCase();
  
  // List of all breeds for detecting "other breed" products
  const allBreeds = ['indie', 'labrador', 'golden retriever', 'pug', 'beagle', 'shih tzu', 
    'german shepherd', 'maltese', 'poodle', 'bulldog', 'husky', 'chihuahua', 'cavalier',
    'dachshund', 'great dane', 'corgi', 'pomeranian', 'schnoodle', 'yorkshire'];
  
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price || 999,
      quantity: product.quantity || 1,
      image_url: product.image_url || product.image,
      pillar: 'learn'
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} x${product.quantity || 1}`,
    });
  };
  
  // Fetch REAL products from Product Box based on routine keywords
  useEffect(() => {
    const fetchRoutineProducts = async () => {
      setLoading(true);
      try {
        // Fetch products from Product Box
        const response = await fetch(`${API_URL}/api/product-box/products?pillar=learn&limit=50`);
        if (response.ok) {
          const data = await response.json();
          const allProducts = data.products || [];
          
          // Filter products based on routine keywords
          const keywords = routine.productKeywords || [];
          const petBreed = (pet?.breed || '').toLowerCase();
          
          // Score products by relevance
          const scoredProducts = allProducts.map(p => {
            let score = 0;
            const name = (p.name || '').toLowerCase();
            const description = (p.description || '').toLowerCase();
            const tags = (p.tags || []).map(t => t.toLowerCase());
            
            // Check keyword matches
            keywords.forEach(kw => {
              if (name.includes(kw)) score += 3;
              if (description.includes(kw)) score += 1;
              if (tags.includes(kw)) score += 2;
            });
            
            // Bonus for breed match
            if (petBreed && (name.includes(petBreed) || tags.includes(petBreed))) {
              score += 5;
            }
            
            // Must have an image
            const hasImage = p.image_url || p.image || (p.images && p.images[0]);
            if (!hasImage) score = 0;
            
            return { ...p, score };
          });
          
          // Sort by score and take top 4
          const topProducts = scoredProducts
            .filter(p => p.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);
          
          // If not enough products, fill with any products that have images
          if (topProducts.length < 4) {
            const remainingNeeded = 4 - topProducts.length;
            const existingIds = topProducts.map(p => p.id);
            const additionalProducts = allProducts
              .filter(p => !existingIds.includes(p.id) && (p.image_url || p.image))
              .slice(0, remainingNeeded);
            topProducts.push(...additionalProducts);
          }
          
          setProducts(topProducts);
        }
      } catch (error) {
        console.error('Failed to fetch routine products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoutineProducts();
  }, [pet?.breed, pet?.age_months]);

  if (!pet) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-stone-50 to-amber-50 border-0 shadow-lg" data-testid="pet-daily-routine">
      <h2 className="text-xl font-bold text-gray-900 mb-1">
        {pet.name}'s Daily Routine
      </h2>
      <p className="text-gray-600 mb-6">Personalized schedule based on {pet.breed || 'your pet'}'s needs</p>
      
      {/* Routine Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {['morning', 'midday', 'evening', 'night'].map((time) => {
          const slot = routine[time];
          const Icon = slot.icon;
          return (
            <Card key={time} className={`p-4 bg-gradient-to-br ${slot.color} border-0`}>
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${slot.iconColor}`} />
                <h3 className="font-semibold capitalize text-gray-800">{time}</h3>
              </div>
              <ul className="space-y-1.5">
                {slot.activities.map((activity, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    {activity}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      
      {/* Products Section - REAL products from Product Box */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Products that support {pet.name}'s routine
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {products.map((product, idx) => {
              const imageUrl = product.image_url || product.image || product.images?.[0];
              const productName = (product.name || '').toLowerCase();
              
              // Check if this product is for another breed
              const productBreed = allBreeds.find(b => productName.includes(b));
              const isOtherBreed = productBreed && petBreed && !productName.includes(petBreed);
              
              return (
                <Card 
                  key={product.id || idx}
                  className="p-3 cursor-pointer hover:shadow-lg transition-all bg-white group overflow-hidden relative"
                  onClick={() => setSelectedProduct(product)}
                  data-testid={`routine-product-${idx}`}
                >
                  {/* Other Breed Badge */}
                  {isOtherBreed && (
                    <Badge className="absolute top-2 right-2 z-10 bg-violet-100 text-violet-700 text-xs">
                      <PawPrint className="w-3 h-3 mr-1" />
                      For {productBreed.charAt(0).toUpperCase() + productBreed.slice(1)}
                    </Badge>
                  )}
                  
                  <div className="aspect-square rounded-xl mb-3 overflow-hidden bg-gradient-to-br from-stone-50 to-gray-100">
                    {imageUrl ? (
                      <img 
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{product.name}</h4>
                  <p className="text-sm text-amber-600 font-semibold mt-1">
                    ₹{product.price || product.pricing?.selling_price || '999'}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Click to view</span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        currentBreed={pet?.breed}
      />
    </Card>
  );
};

export default PetDailyRoutine;

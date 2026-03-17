/**
 * EmergencyProductsGrid.jsx
 * Displays emergency products with categories
 * General products vs Personalized products
 * Products open in modal with full CRUD support
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, Shield, Heart, 
  Loader2, ChevronRight, Star, Check,
  Thermometer, Bandage, Droplet, Tag, X, Truck, Info
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCart } from '../../context/CartContext';
import { toast } from '../../hooks/use-toast';
import { usePillarContext } from '../../context/PillarContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Category icons
const CATEGORY_ICONS = {
  'first-aid': Bandage,
  'recovery': Heart,
  'essentials': Droplet,
  'documentation': Tag,
  'restraint': Shield,
  'transport': Package,
  'temperature': Thermometer,
  'tracking': Tag,
  'identification': Tag,
  'default': Package
};

// Product Detail Modal Component
const ProductDetailModal = ({ product, pet, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  
  if (!isOpen || !product) return null;
  
  const Icon = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.default;
  
  // Get personalized recommendation based on pet data
  const getPersonalizedNote = () => {
    if (!pet) return null;
    
    const petWeight = pet.weight || pet.doggy_soul_answers?.weight;
    const petBreed = pet.breed;
    
    if (product.name?.toLowerCase().includes('muzzle') && petWeight) {
      if (petWeight < 5) return `Recommended size for ${pet.name}: XS`;
      if (petWeight < 10) return `Recommended size for ${pet.name}: S`;
      if (petWeight < 20) return `Recommended size for ${pet.name}: M`;
      if (petWeight < 35) return `Recommended size for ${pet.name}: L`;
      return `Recommended size for ${pet.name}: XL`;
    }
    
    if (product.name?.toLowerCase().includes('carrier') && petWeight) {
      if (petWeight < 5) return `${pet.name} needs: Small carrier`;
      if (petWeight < 10) return `${pet.name} needs: Medium carrier`;
      return `${pet.name} needs: Large carrier`;
    }
    
    if (product.name?.toLowerCase().includes('cooling') && petBreed) {
      const hotBreeds = ['bulldog', 'pug', 'shih tzu', 'boxer'];
      if (hotBreeds.some(b => petBreed.toLowerCase().includes(b))) {
        return `Essential for ${petBreed}s - they're prone to overheating`;
      }
    }
    
    return null;
  };
  
  const personalizedNote = getPersonalizedNote();
  
  const handleAdd = () => {
    onAddToCart({
      ...product,
      quantity,
      selectedSize,
      personalized_for: pet?.name
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">{product.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Image */}
          <div className="aspect-square max-h-64 bg-gray-100 rounded-xl mb-6 flex items-center justify-center overflow-hidden">
            {product.image_url || product.image ? (
              <img 
                src={product.image_url || product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Icon className="w-24 h-24 text-gray-300" />
            )}
          </div>
          
          {/* Personalized Note */}
          {personalizedNote && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-purple-800">{personalizedNote}</p>
            </div>
          )}
          
          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{product.original_price}</span>
                <Badge className="bg-green-100 text-green-700">
                  Save {Math.round((1 - product.price / product.original_price) * 100)}%
                </Badge>
              </>
            )}
          </div>
          
          {/* Category */}
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-red-100 text-red-700">{product.category || 'Emergency'}</Badge>
            <Badge className="bg-gray-100 text-gray-600">
              <Truck className="w-3 h-3 mr-1" /> Ships in 24h
            </Badge>
          </div>
          
          {/* Description */}
          {product.description && (
            <p className="text-gray-600 mb-6">{product.description}</p>
          )}
          
          {/* Size Selection (if applicable) */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Size</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedSize === size 
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium text-gray-700">Quantity</label>
            <div className="flex items-center border rounded-lg">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-gray-100"
              >-</button>
              <span className="px-4 py-2 border-x">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 hover:bg-gray-100"
              >+</button>
            </div>
          </div>
          
          {/* Add to Cart Button */}
          <Button 
            className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
            onClick={handleAdd}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart - ₹{(product.price * quantity).toLocaleString()}
          </Button>
        </div>
      </div>
    </div>
  );
};

const EmergencyProductsGrid = ({ maxProducts = 12, showPersonalized = true }) => {
  const { addToCart } = useCart();
  const { currentPet } = usePillarContext();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(`${API_URL}/api/emergency/products?limit=50`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        // Filter out services (price = 0 or no price)
        const realProducts = (data.products || []).filter(p => 
          p.price && p.price > 0 && p.category !== 'service'
        );
        setProducts(realProducts);
      } else {
        setError('Failed to load products');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      original_price: product.original_price,
      image: product.image_url || product.image,
      quantity: 1,
      category: 'emergency'
    });
    
    toast({
      title: `${product.name} added!`,
      description: `₹${product.price} - Emergency essential`
    });
  };

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter products
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const displayProducts = filteredProducts.slice(0, maxProducts);

  // Separate general and personalized
  const generalProducts = displayProducts.filter(p => !p.personalized);
  const personalizedProducts = displayProducts.filter(p => p.personalized);

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-500" />
        <p className="text-sm text-gray-500 mt-2">Loading emergency supplies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-red-500 mb-2">{error}</p>
        <Button size="sm" variant="outline" onClick={fetchProducts}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="emergency-products-grid">
      {/* Category Filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.slice(0, 8).map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? 'All' : cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* General Products */}
      {generalProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-800">Essential for All Pets</h4>
            <Badge className="bg-green-100 text-green-700 text-xs">Universal</Badge>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {generalProducts.slice(0, 8).map(product => {
              const Icon = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.default;
              
              return (
                <Card 
                  key={product.id}
                  className="p-3 hover:shadow-lg transition-all border border-gray-200 cursor-pointer hover:border-red-300"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowModal(true);
                  }}
                  data-testid={`product-card-${product.id}`}
                >
                  {/* Icon/Image */}
                  <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                    {product.image_url || product.image ? (
                      <img 
                        src={product.image_url || product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Icon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <h5 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                    {product.name}
                  </h5>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-gray-900">
                        ₹{product.price?.toLocaleString()}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs text-gray-400 line-through ml-1">
                          ₹{product.original_price}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                      data-testid={`add-product-${product.id}`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Personalized Products */}
      {showPersonalized && personalizedProducts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-800">Personalized by Size & Breed</h4>
            <Badge className="bg-purple-100 text-purple-700 text-xs">Custom Fit</Badge>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {personalizedProducts.slice(0, 8).map(product => {
              const Icon = CATEGORY_ICONS[product.category] || CATEGORY_ICONS.default;
              
              return (
                <Card 
                  key={product.id}
                  className="p-3 hover:shadow-lg transition-all border border-purple-200 bg-purple-50/30 cursor-pointer hover:border-purple-400"
                  onClick={() => {
                    setSelectedProduct(product);
                    setShowModal(true);
                  }}
                  data-testid={`product-card-${product.id}`}
                >
                  {/* Icon/Image */}
                  <div className="w-full h-20 bg-white rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                    {product.image_url || product.image ? (
                      <img 
                        src={product.image_url || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Icon className="w-8 h-8 text-purple-400" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <h5 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1">
                    {product.name}
                  </h5>
                  
                  {/* Size options */}
                  {product.sizes && (
                    <p className="text-xs text-purple-600 mb-2">
                      {product.sizes.length} sizes available
                    </p>
                  )}
                  
                  {/* Personalize by tags */}
                  {product.personalize_by && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {product.personalize_by.slice(0, 2).map((tag, i) => (
                        <Badge key={i} className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0">
                          {tag.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      ₹{product.price?.toLocaleString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* View All - Opens Product Modal */}
      {filteredProducts.length > maxProducts && (
        <div className="text-center">
          <Button 
            variant="outline" 
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => {
              // Navigate to shop with emergency filter
              window.location.href = '/shop?pillar=emergency';
            }}
          >
            Browse All Emergency Supplies
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
      
      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        pet={currentPet}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default EmergencyProductsGrid;

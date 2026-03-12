/**
 * LearnProductsGrid.jsx
 * Products grid for Learn page - styled to match AdvisoryProductsGrid EXACTLY
 * Beautiful card layout with hover effects, category badges, and pricing display
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, Loader2, ChevronRight, Star, Check, X,
  BookOpen, Brain, Target, Sparkles, Baby, GraduationCap,
  Truck, Info, Plus, Minus, Puzzle, Bone, Heart, Scissors
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCart } from '../../context/CartContext';
import { toast } from '../../hooks/use-toast';
import { usePillarContext } from '../../context/PillarContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Category configurations for Learn pillar - MATCHING ADVISORY STYLE
const CATEGORIES = {
  training_aids: { name: 'Training Aids', icon: Target, color: 'bg-amber-100 text-amber-700' },
  puzzles: { name: 'Puzzles & Games', icon: Puzzle, color: 'bg-purple-100 text-purple-700' },
  books: { name: 'Books & Guides', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  behavior: { name: 'Behavior Tools', icon: Brain, color: 'bg-green-100 text-green-700' },
  puppy_training: { name: 'Puppy Training', icon: Baby, color: 'bg-pink-100 text-pink-700' },
  enrichment: { name: 'Enrichment', icon: Sparkles, color: 'bg-orange-100 text-orange-700' },
  education: { name: 'Education', icon: GraduationCap, color: 'bg-cyan-100 text-cyan-700' },
  treats: { name: 'Treats & Rewards', icon: Bone, color: 'bg-red-100 text-red-700' },
  grooming: { name: 'Grooming', icon: Scissors, color: 'bg-violet-100 text-violet-700' },
  'breed-training_logs': { name: 'Training Logs', icon: BookOpen, color: 'bg-amber-100 text-amber-700' },
  'breed-treat_pouchs': { name: 'Treat Pouches', icon: Bone, color: 'bg-pink-100 text-pink-700' },
  'breed-treat_jars': { name: 'Treat Jars', icon: Heart, color: 'bg-red-100 text-red-700' },
  tricks: { name: 'Tricks', icon: Sparkles, color: 'bg-purple-100 text-purple-700' }
};

// Product Detail Modal
const ProductDetailModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  
  if (!isOpen || !product) return null;
  
  const CategoryIcon = CATEGORIES[product.category]?.icon || Package;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          <img 
            src={product.image_url || product.image || 'https://via.placeholder.com/400x300'} 
            alt={product.name}
            className="w-full h-56 object-cover rounded-t-xl"
          />
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 rounded-full p-2 hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
          
          {/* Category badge */}
          <div className="absolute bottom-3 left-3">
            <Badge className={CATEGORIES[product.category]?.color || 'bg-amber-100 text-amber-700'}>
              <CategoryIcon className="w-3 h-3 mr-1" />
              {CATEGORIES[product.category]?.name || 'Learning'}
            </Badge>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h2>
          <p className="text-gray-600 text-sm mb-4">{product.description}</p>
          
          {/* Price */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold text-amber-600">₹{product.price}</span>
            {product.original_price && product.original_price > product.price && (
              <>
                <span className="text-gray-400 line-through">₹{product.original_price}</span>
                <Badge className="bg-green-100 text-green-700">
                  {Math.round((1 - product.price / product.original_price) * 100)}% off
                </Badge>
              </>
            )}
          </div>
          
          {/* Stock status */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            {product.in_stock !== false ? (
              <span className="flex items-center text-green-600">
                <Check className="w-4 h-4 mr-1" /> In Stock
              </span>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
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
            disabled={product.in_stock === false}
            className="w-full bg-amber-500 hover:bg-amber-600"
            size="lg"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Add to Cart - ₹{product.price * quantity}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Main component
const LearnProductsGrid = ({ maxProducts = 8, showCategories = true, categoryFilter = null }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addToCart } = useCart();
  const { currentPet } = usePillarContext();

  useEffect(() => {
    fetchProducts();
  }, []);

  // When categoryFilter changes, apply it
  useEffect(() => {
    if (categoryFilter) {
      const matchingCat = Object.keys(CATEGORIES).find(key => 
        key.toLowerCase().includes(categoryFilter.toLowerCase()) ||
        CATEGORIES[key].name.toLowerCase().includes(categoryFilter.toLowerCase())
      );
      if (matchingCat) {
        setActiveCategory(matchingCat);
      } else {
        setActiveCategory('all');
      }
    } else {
      setActiveCategory('all');
    }
  }, [categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Use unified product-box API for full CRUD support
      const response = await fetch(`${API_URL}/api/product-box/products?pillar=learn&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      } else {
        // Fallback to learn-specific endpoint
        const fallbackRes = await fetch(`${API_URL}/api/learn/products?limit=100`);
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setProducts(fallbackData.products || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch learn products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: product.quantity || 1,
      image_url: product.image_url || product.image,
      pillar: 'learn'
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} x${product.quantity || 1}`,
    });
  };

  // Filter products by category
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);
  
  const displayProducts = filteredProducts.slice(0, maxProducts);
  
  // Get unique categories from products
  const availableCategories = [...new Set(products.map(p => p.category))].filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div data-testid="learn-products-grid">
      {/* Category Tabs */}
      {showCategories && availableCategories.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveCategory('all')}
              className={activeCategory === 'all' ? 'bg-amber-500 hover:bg-amber-600' : ''}
              size="sm"
            >
              All Products
            </Button>
            {availableCategories.map(cat => {
              const config = CATEGORIES[cat];
              if (!config) return null;
              const Icon = config.icon;
              return (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  onClick={() => setActiveCategory(cat)}
                  className={activeCategory === cat ? 'bg-amber-500 hover:bg-amber-600' : ''}
                  size="sm"
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {config.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Grid - Same style as AdvisoryProductsGrid */}
      {displayProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayProducts.map(product => {
            const CategoryIcon = CATEGORIES[product.category]?.icon || Package;
            const productImage = product.image_url || product.image || product.images?.[0];
            
            return (
              <Card 
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedProduct(product)}
                data-testid={`learn-product-card-${product.id}`}
              >
                {/* Image */}
                <div className="relative h-36 bg-gray-100">
                  <img 
                    src={productImage || 'https://via.placeholder.com/200'} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200'; }}
                  />
                  {/* Category badge */}
                  <div className="absolute top-2 left-2">
                    <Badge className={`${CATEGORIES[product.category]?.color || 'bg-amber-100 text-amber-700'} text-xs`}>
                      <CategoryIcon className="w-3 h-3" />
                    </Badge>
                  </div>
                  {/* Discount badge */}
                  {product.original_price && product.original_price > product.price && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500 text-white text-xs">
                        {Math.round((1 - product.price / product.original_price) * 100)}% off
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-3">
                  <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mb-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-600">₹{product.price}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs text-gray-400 line-through ml-1">
                          ₹{product.original_price}
                        </span>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No products found in this category
        </div>
      )}

      {/* View All link */}
      {filteredProducts.length > maxProducts && (
        <div className="text-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/shop?pillar=learn'}
          >
            View All {filteredProducts.length} Products
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default LearnProductsGrid;

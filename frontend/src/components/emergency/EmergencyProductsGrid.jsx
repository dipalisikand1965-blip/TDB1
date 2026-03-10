/**
 * EmergencyProductsGrid.jsx
 * Displays emergency products with categories
 * General products vs Personalized products
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, Package, Shield, Heart, 
  Loader2, ChevronRight, Star, Check,
  Thermometer, Bandage, Droplet, Tag
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useCart } from '../../context/CartContext';
import { toast } from '../../hooks/use-toast';

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

const EmergencyProductsGrid = ({ maxProducts = 12, showPersonalized = true }) => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

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
                  className="p-3 hover:shadow-md transition-shadow border border-gray-200"
                >
                  {/* Icon/Image */}
                  <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
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
                      onClick={() => handleAddToCart(product)}
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
                  className="p-3 hover:shadow-md transition-shadow border border-purple-200 bg-purple-50/30"
                >
                  {/* Icon/Image */}
                  <div className="w-full h-20 bg-white rounded-lg flex items-center justify-center mb-2">
                    <Icon className="w-8 h-8 text-purple-400" />
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
                      onClick={() => handleAddToCart(product)}
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

      {/* View All */}
      {filteredProducts.length > maxProducts && (
        <div className="text-center">
          <Button variant="outline" className="border-red-300 text-red-600">
            View All {filteredProducts.length} Products
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmergencyProductsGrid;

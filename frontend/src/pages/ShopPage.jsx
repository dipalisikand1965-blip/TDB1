/**
 * ShopPage.jsx
 * Comprehensive Shopping Hub for All Pet Products
 * Features: Categories, filters, recommendations, deals
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { toast } from '../hooks/use-toast';
import MiraContextPanel from '../components/MiraContextPanel';
import SEOHead from '../components/SEOHead';
import {
  ShoppingBag, Search, Filter, Grid, List, Heart, Star, 
  ChevronRight, ChevronDown, Sparkles, Tag, Truck, Shield, Gift, ArrowRight,
  SlidersHorizontal, X, Check, Clock, Flame, Award, Package,
  PawPrint, Cake, UtensilsCrossed, Scissors, Dog, Bone
} from 'lucide-react';

// Shop Categories
// Default categories (will be replaced by API data)
const DEFAULT_SHOP_CATEGORIES = [
  { id: 'all', name: 'All Products', emoji: '🛒', color: 'from-purple-500 to-pink-500' },
  { id: 'celebrations', name: 'Celebrations', emoji: '🎂', color: 'from-amber-500 to-yellow-500' },
  { id: 'treats', name: 'Treats', emoji: '🦴', color: 'from-pink-500 to-rose-500' },
  { id: 'pupcakes', name: 'Pupcakes & Dognuts', emoji: '🍩', color: 'from-orange-500 to-amber-500' },
  { id: 'accessories', name: 'Accessories & Toys', emoji: '🎁', color: 'from-blue-500 to-cyan-500' },
  { id: 'fresh-food', name: 'Fresh Food', emoji: '🍕', color: 'from-green-500 to-emerald-500' },
  { id: 'cat-corner', name: 'Cat Corner', emoji: '🐱', color: 'from-violet-500 to-purple-500' },
];

// Quick Filters
const QUICK_FILTERS = [
  { id: 'best-sellers', label: '🏆 Best Sellers', filter: { tag: 'best-seller' } },
  { id: 'new-arrivals', label: '✨ New Arrivals', filter: { tag: 'new' } },
  { id: 'on-sale', label: '🔥 On Sale', filter: { onSale: true } },
  { id: 'grain-free', label: '🌾 Grain Free', filter: { tag: 'grain-free' } },
  { id: 'organic', label: '🌿 Organic', filter: { tag: 'organic' } },
  { id: 'subscription', label: '📦 Subscribe & Save', filter: { subscription: true } }
];

// Pillar Filters for cross-pillar shopping
const PILLAR_FILTERS = [
  { id: 'all', label: 'All Pillars', icon: '🛒' },
  { id: 'celebrate', label: 'Celebrate', icon: '🎂' },
  { id: 'dine', label: 'Dine', icon: '🍖' },
  { id: 'stay', label: 'Stay', icon: '🏠' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'care', label: 'Care', icon: '💊' },
  { id: 'enjoy', label: 'Enjoy', icon: '🎾' },
  { id: 'fit', label: 'Fit', icon: '💪' },
  { id: 'learn', label: 'Learn', icon: '📚' },
  { id: 'shop', label: 'Shop', icon: '🛍️' }
];

// Product Card Component
const ProductCard = ({ product, onAddToCart, viewMode = 'grid' }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const navigate = useNavigate();
  
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.compare_at_price) * 100) 
    : 0;

  const handleClick = () => {
    // Use shopify_handle for cleaner URLs, fallback to id
    const slug = product.shopify_handle || product.handle || product.id;
    navigate(`/product/${slug}`);
  };

  if (viewMode === 'list') {
    return (
      <Card className="flex overflow-hidden hover:shadow-lg transition-all cursor-pointer" onClick={handleClick}>
        <div className="w-48 h-48 flex-shrink-0 relative bg-gray-100">
          <img
            src={product.image || product.image_url || product.images?.[0] || 'https://via.placeholder.com/200'}
            alt={product.title}
            className="w-full h-full object-cover"
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              -{discountPercent}%
            </Badge>
          )}
        </div>
        
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{product.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>
            
            {product.tags?.length > 0 && (
              <div className="flex gap-1 mt-2">
                {product.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-xl font-bold text-teal-600">₹{product.price?.toLocaleString()}</span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 line-through ml-2">
                  ₹{product.compare_at_price?.toLocaleString()}
                </span>
              )}
            </div>
            <Button 
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
      onClick={handleClick}
    >
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        <img
          src={product.image || product.image_url || product.images?.[0] || 'https://via.placeholder.com/200'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge className="bg-red-500 text-white text-xs">-{discountPercent}%</Badge>
          )}
          {product.tags?.includes('best-seller') && (
            <Badge className="bg-amber-500 text-white text-xs">🏆 Best Seller</Badge>
          )}
          {product.tags?.includes('new') && (
            <Badge className="bg-green-500 text-white text-xs">✨ New</Badge>
          )}
          {/* Show options indicator for products with variants */}
          {(product.has_variants || product.variants?.length > 1 || 
            (product.options?.length > 0 && product.options.some(o => o.values?.length > 1))) && (
            <Badge className="bg-purple-500 text-white text-xs">Options Available</Badge>
          )}
        </div>
        
        {/* Wishlist Button */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsWishlisted(!isWishlisted); }}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
        
        {/* Quick Add Button */}
        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          {/* If product has options, go to product page instead of quick add */}
          {(product.has_variants || product.variants?.length > 1 || 
            (product.options?.length > 0 && product.options.some(o => o.values?.length > 1))) ? (
            <Button 
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
              className="w-full bg-white text-purple-700 hover:bg-white/90 text-sm"
              size="sm"
            >
              <Package className="w-4 h-4 mr-1" />
              Select Options
            </Button>
          ) : (
            <Button 
              onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
              className="w-full bg-white text-teal-700 hover:bg-white/90 text-sm"
              size="sm"
            >
              <ShoppingBag className="w-4 h-4 mr-1" />
              Quick Add
            </Button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-teal-600">₹{product.price?.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through ml-1">
                ₹{product.compare_at_price?.toLocaleString()}
              </span>
            )}
          </div>
          
          {product.rating && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">{product.rating}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const ShopPage = () => {
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedParentCategory, setSelectedParentCategory] = useState(searchParams.get('parent') || '');
  const [selectedPillar, setSelectedPillar] = useState(searchParams.get('pillar') || 'all');
  const [activeFilters, setActiveFilters] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);
  const [pets, setPets] = useState([]);
  const [categoryHierarchy, setCategoryHierarchy] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Fetch category hierarchy on mount
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        const res = await fetch(`${API_URL}/api/categories/hierarchy`);
        if (res.ok) {
          const data = await res.json();
          setCategoryHierarchy(data.categories || []);
        }
      } catch (err) {
        console.debug('Could not fetch category hierarchy:', err);
      }
    };
    fetchHierarchy();
  }, []);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedParentCategory, selectedPillar, sortBy]);

  // Fetch user's pets for recommendations
  useEffect(() => {
    if (token) {
      fetchPets();
    }
  }, [token]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/products?limit=200`;
      
      // Use parent_category if selected (shows all subcategories)
      if (selectedParentCategory && selectedParentCategory !== 'all') {
        url += `&parent_category=${selectedParentCategory}`;
      } else if (selectedCategory && selectedCategory !== 'all') {
        // Use specific category (subcategory level)
        url += `&category=${selectedCategory}`;
      }
      
      // Add pillar filter
      if (selectedPillar && selectedPillar !== 'all') {
        url += `&pillar=${selectedPillar}`;
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        let productList = data.products || data || [];
        
        // Sort products
        if (sortBy === 'price-low') {
          productList.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === 'price-high') {
          productList.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === 'newest') {
          productList.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }
        
        setProducts(productList);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPets = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pets/my-pets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPets(data.pets || []);
      }
    } catch (err) {
      console.error('Failed to fetch pets:', err);
    }
  };

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    let result = products;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    
    // Price filter
    result = result.filter(p => 
      (p.price || 0) >= priceRange[0] && (p.price || 0) <= priceRange[1]
    );
    
    // Quick filters
    if (activeFilters.includes('best-sellers')) {
      result = result.filter(p => p.tags?.includes('best-seller'));
    }
    if (activeFilters.includes('new-arrivals')) {
      result = result.filter(p => p.tags?.includes('new'));
    }
    if (activeFilters.includes('on-sale')) {
      result = result.filter(p => p.compare_at_price && p.compare_at_price > p.price);
    }
    
    return result;
  }, [products, searchQuery, priceRange, activeFilters]);

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image || product.image_url || product.images?.[0],
      quantity: 1
    });
    toast({
      title: '🛒 Added to Cart',
      description: `${product.title} has been added to your cart`
    });
  };

  const toggleFilter = (filterId) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Meta Tags */}
      <SEOHead page="shop" path="/shop" />
      
      {/* Hero Section */}
      <section className="bg-teal-600 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Pet Shop
              </h1>
              <p className="text-teal-100 max-w-lg">
                Premium products handpicked for your furry family members.
                {pets.length > 0 && ` Personalised for ${pets[0].name}!`}
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="w-full md:w-96">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="pl-10 py-3 bg-white text-gray-900 border-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation with Subcategories */}
      <section className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Main Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {/* All Products */}
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedParentCategory('');
                setExpandedCategory(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === 'all' && !selectedParentCategory
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              All Products
            </button>
            
            {/* Dynamic Categories from API */}
            {categoryHierarchy.map((cat) => (
              <div key={cat.id} className="relative group">
                <button
                  onClick={() => {
                    setSelectedParentCategory(cat.id);
                    setSelectedCategory('all');
                    setExpandedCategory(expandedCategory === cat.id ? null : cat.id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedParentCategory === cat.id
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.name}
                  <span className="text-xs opacity-70">({cat.count})</span>
                  {cat.subcategories?.length > 0 && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedCategory === cat.id ? 'rotate-180' : ''}`} />
                  )}
                </button>
                
                {/* Subcategory Dropdown */}
                {cat.subcategories?.length > 0 && expandedCategory === cat.id && (
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border py-2 min-w-48 z-50">
                    <button
                      onClick={() => {
                        setSelectedParentCategory(cat.id);
                        setSelectedCategory('all');
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center ${
                        selectedParentCategory === cat.id && selectedCategory === 'all' ? 'bg-teal-50 text-teal-700' : ''
                      }`}
                    >
                      <span>All {cat.name}</span>
                      <span className="text-xs text-gray-400">{cat.count}</span>
                    </button>
                    {cat.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setSelectedCategory(sub.db_categories?.[0] || sub.id);
                          setSelectedParentCategory('');
                          setExpandedCategory(null);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex justify-between items-center ${
                          selectedCategory === (sub.db_categories?.[0] || sub.id) ? 'bg-teal-50 text-teal-700' : ''
                        }`}
                      >
                        <span>{sub.name}</span>
                        <span className="text-xs text-gray-400">{sub.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Active Category Breadcrumb */}
          {(selectedParentCategory || (selectedCategory && selectedCategory !== 'all')) && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <button onClick={() => { setSelectedCategory('all'); setSelectedParentCategory(''); }} className="hover:text-teal-600">
                Shop
              </button>
              <ChevronRight className="w-4 h-4" />
              {selectedParentCategory && (
                <>
                  <span className="font-medium text-teal-700">
                    {categoryHierarchy.find(c => c.id === selectedParentCategory)?.emoji}{' '}
                    {categoryHierarchy.find(c => c.id === selectedParentCategory)?.name}
                  </span>
                  {selectedCategory !== 'all' && (
                    <>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-gray-900">{selectedCategory}</span>
                    </>
                  )}
                </>
              )}
              {!selectedParentCategory && selectedCategory !== 'all' && (
                <span className="font-medium text-teal-700">{selectedCategory}</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card className="p-4 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </h3>
              
              {/* Pillar Filter */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Shop by Pillar</h4>
                <div className="space-y-1">
                  {PILLAR_FILTERS.map((pillar) => (
                    <button
                      key={pillar.id}
                      onClick={() => {
                        setSelectedPillar(pillar.id);
                        setSearchParams(prev => {
                          if (pillar.id === 'all') prev.delete('pillar');
                          else prev.set('pillar', pillar.id);
                          return prev;
                        });
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                        selectedPillar === pillar.id
                          ? 'bg-teal-100 text-teal-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                      data-testid={`pillar-filter-${pillar.id}`}
                    >
                      <span>{pillar.icon}</span>
                      <span>{pillar.label}</span>
                      {selectedPillar === pillar.id && (
                        <Check className="w-4 h-4 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Quick Filters */}
              <div className="space-y-2 mb-6 border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">Quick Filters</h4>
                {QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                      activeFilters.includes(filter.id)
                        ? 'bg-teal-100 text-teal-700 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {filter.label}
                    {activeFilters.includes(filter.id) && (
                      <Check className="w-4 h-4 inline ml-2" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Price Range */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-20 text-sm"
                    placeholder="Min"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-20 text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>
              
              {/* Clear Filters */}
              {(activeFilters.length > 0 || selectedPillar !== 'all') && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => {
                    setActiveFilters([]);
                    setSelectedPillar('all');
                    setSearchParams(prev => {
                      prev.delete('pillar');
                      return prev;
                    });
                  }}
                >
                  Clear All Filters
                </Button>
              )}
            </Card>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {filteredProducts.length} products
                {searchQuery && ` for "${searchQuery}"`}
              </p>
              
              <div className="flex items-center gap-4">
                {/* Mobile Filter Button */}
                <Button 
                  variant="outline" 
                  className="lg:hidden"
                  onClick={() => setShowFilters(true)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
                
                {/* View Toggle */}
                <div className="hidden md:flex border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Pills */}
            {(activeFilters.length > 0 || selectedPillar !== 'all') && (
              <div className="flex flex-wrap gap-2 mb-4">
                {/* Pillar filter pill */}
                {selectedPillar !== 'all' && (
                  <Badge 
                    className="bg-teal-100 text-teal-700 px-3 py-1 cursor-pointer hover:bg-teal-200"
                    onClick={() => {
                      setSelectedPillar('all');
                      setSearchParams(prev => {
                        prev.delete('pillar');
                        return prev;
                      });
                    }}
                  >
                    {PILLAR_FILTERS.find(p => p.id === selectedPillar)?.icon} {PILLAR_FILTERS.find(p => p.id === selectedPillar)?.label}
                    <X className="w-3 h-3 ml-2" />
                  </Badge>
                )}
                {activeFilters.map(filterId => {
                  const filter = QUICK_FILTERS.find(f => f.id === filterId);
                  return (
                    <Badge 
                      key={filterId}
                      className="bg-purple-100 text-purple-700 px-3 py-1 cursor-pointer hover:bg-purple-200"
                      onClick={() => toggleFilter(filterId)}
                    >
                      {filter?.label}
                      <X className="w-3 h-3 ml-2" />
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
                <Button onClick={() => { setSearchQuery(''); setActiveFilters([]); setSelectedCategory('all'); }}>
                  Clear All Filters
                </Button>
              </Card>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6' 
                : 'space-y-4'
              }>
                {filteredProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={handleAddToCart}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mira Contextual Panel - Fixed Position */}
      <div className="hidden lg:block fixed right-4 top-24 w-72 z-[100]">
        <MiraContextPanel pillar="shop" />
      </div>
      <div className="lg:hidden fixed bottom-20 right-4 w-80 max-w-[calc(100vw-2rem)] z-[100]">
        <MiraContextPanel pillar="shop" position="bottom" />
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)}></div>
          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Quick Filters */}
            <div className="space-y-2 mb-6">
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    activeFilters.includes(filter.id)
                      ? 'bg-purple-100 text-purple-700 font-medium'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            <Button 
              onClick={() => setShowFilters(false)}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopPage;

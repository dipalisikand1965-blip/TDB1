import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { SlidersHorizontal, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ProductListing = ({ category = 'all' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `${API_URL}/api/products?limit=500`;
        if (category && category !== 'all') {
          url += `&category=${category}`;
        }
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [category]);

  let filteredProducts = [...products];

  // Filter by price range
  if (priceRange === 'under500') {
    filteredProducts = filteredProducts.filter(p => (p.price || p.minPrice || 0) < 500);
  } else if (priceRange === '500-1000') {
    filteredProducts = filteredProducts.filter(p => {
      const price = p.price || p.minPrice || 0;
      return price >= 500 && price <= 1000;
    });
  } else if (priceRange === 'over1000') {
    filteredProducts = filteredProducts.filter(p => (p.price || p.minPrice || 0) > 1000);
  }

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => (a.price || a.minPrice || 0) - (b.price || b.minPrice || 0));
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.price || b.minPrice || 0) - (a.price || a.minPrice || 0));
  } else if (sortBy === 'rating') {
    filteredProducts = [...filteredProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  const getCategoryTitle = () => {
    switch (category) {
      case 'cakes': return 'Dog Cakes';
      case 'custom': return 'Breed-Specific Cakes';
      case 'breed-cakes': return 'Breed-Specific Cakes';
      case 'treats': return 'Treats & Snacks';
      case 'desi': return 'Desi Doggy Treats 🪔';
      case 'desi-treats': return 'Desi Doggy Treats 🪔';
      case 'merchandise': return 'Gift Hampers & Merchandise';
      case 'meals': return 'Fresh Meals & Pizzas';
      case 'fresh-meals': return 'Fresh Meals';
      case 'frozen': return 'Frozen Treats';
      case 'frozen-treats': return 'Frozen Treats';
      case 'accessories': return 'Accessories & Toys';
      case 'pan-india': return 'Pan India Delivery';
      case 'mini-cakes': return 'Mini Cakes (Pupcakes)';
      case 'cat': return 'Cat Treats';
      case 'cat-treats': return 'Cat Treats';
      case 'pizzas-burgers': return 'Pizzas & Burgers';
      case 'dognuts': return 'Dognuts';
      default: return 'All Products';
    }
  };

  const getCategoryDescription = () => {
    switch (category) {
      case 'cakes': return 'Freshly baked cakes for birthdays and special celebrations';
      case 'custom': 
      case 'breed-cakes': return 'Custom cakes shaped like your beloved breed';
      case 'treats': return 'Healthy treats for everyday joy and training';
      case 'desi': 
      case 'desi-treats': return 'Traditional Indian sweets made pet-friendly!';
      case 'merchandise': return 'Special gift packages and branded items';
      case 'meals':
      case 'fresh-meals': return 'Nutritious fresh meals for your furry friend';
      case 'frozen':
      case 'frozen-treats': return 'Cool treats for hot days';
      case 'accessories': return 'Bandanas, toys, and celebration gear';
      case 'pan-india': return 'Treats and cakes delivered across India';
      case 'mini-cakes': return 'Perfect sized celebration cakes for any occasion';
      case 'cat':
      case 'cat-treats': return 'Special treats for our feline friends';
      default: return 'Explore our complete range of pet treats and cakes';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {getCategoryTitle()}
          </h1>
          <p className="text-gray-600">{getCategoryDescription()}</p>
          <p className="text-purple-600 text-sm mt-2">Showing {filteredProducts.length} products</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-gray-700">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-medium">Filters:</span>
          </div>
          
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Prices" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under500">Under ₹500</SelectItem>
              <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
              <SelectItem value="over1000">Over ₹1000</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListing;

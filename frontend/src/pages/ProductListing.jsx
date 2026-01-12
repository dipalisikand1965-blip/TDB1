import React, { useState } from 'react';
import { products, birthdayCakes, breedCakes, treats, dognuts, desiTreats, nutButters, cakeMix, merchandise, giftCards, miniCakes, frozenTreats, accessories, freshMeals, pizzasBurgers, catTreats, panIndiaCakes } from '../mockData';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { SlidersHorizontal } from 'lucide-react';

const ProductListing = ({ category = 'all' }) => {
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');

  // Get products based on category
  const getProductsByCategory = () => {
    switch (category) {
      case 'cakes':
        return [...birthdayCakes, ...miniCakes, ...panIndiaCakes];
      case 'custom':
        return breedCakes;
      case 'treats':
        return [...treats, ...dognuts, ...nutButters, ...cakeMix];
      case 'desi':
        return desiTreats;
      case 'merchandise':
        return [...merchandise, ...giftCards];
      case 'meals':
        return [...freshMeals, ...pizzasBurgers];
      case 'frozen':
        return frozenTreats;
      case 'accessories':
        return accessories;
      case 'mini-cakes':
        return miniCakes;
      case 'cat':
        return catTreats;
      case 'all':
      default:
      case 'pan-india':
        return panIndiaCakes;
        return products;
    }
  };

  let filteredProducts = getProductsByCategory();

  // Filter by price range
  if (priceRange === 'under500') {
    filteredProducts = filteredProducts.filter(p => p.price < 500);
  } else if (priceRange === '500-1000') {
    filteredProducts = filteredProducts.filter(p => p.price >= 500 && p.price <= 1000);
  } else if (priceRange === 'over1000') {
    filteredProducts = filteredProducts.filter(p => p.price > 1000);
  }

  // Sort products
  if (sortBy === 'price-low') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.rating - a.rating);
  }

  const getCategoryTitle = () => {
    switch (category) {
      case 'cakes': return 'Dog Cakes & Mini Cakes';
      case 'custom': return 'Breed-Specific Cakes';
      case 'treats': return 'Treats & Snacks';
      case 'desi': return 'Desi Doggy Treats 🪔';
      case 'merchandise': return 'Gift Hampers & Merchandise';
      case 'meals': return 'Fresh Meals & Pizzas';
      case 'frozen': return 'Frozen Treats';
      case 'accessories': return 'Accessories & Toys';
      case 'pan-india': return 'Pan India Delivery Cakes';
      case 'mini-cakes': return 'Mini Cakes (Bowto)';
      case 'cat': return 'Cat Treats';
      default: return 'All Products';
    }
  };

  const getCategoryDescription = () => {
    switch (category) {
      case 'cakes': return 'Freshly baked cakes for birthdays and special celebrations';
      case 'custom': return 'Custom cakes shaped like your beloved breed - Golden Retriever, Labrador, Beagle & more!';
      case 'treats': return 'Healthy biscuits, jerky, training treats, nut butters and more';
      case 'desi': return 'Traditional Indian sweets made pet-friendly - Ladoos, Jalebis, Modaks & more!';
      case 'merchandise': return 'Premium gift hampers, subscription boxes, and exclusive merchandise';
      case 'meals': return 'Freshly cooked nutritious meals and fun doggy pizzas';
      case 'frozen': return 'Cool frozen yogurt and jello treats for hot days';
      case 'pan-india': return 'Delicious cakes delivered nationwide across India!';
      case 'accessories': return 'Bandanas, toys, collars, and celebration accessories';
      case 'mini-cakes': return 'Perfect 200g mini cakes for everyday celebrations';
      case 'cat': return 'Delicious treats for our feline friends too!';
      default: return 'Browse our complete collection of pet treats and cakes';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{getCategoryTitle()}</h1>
          <p className="text-gray-600 mb-2">{getCategoryDescription()}</p>
          <p className="text-sm text-purple-600 font-medium">Showing {filteredProducts.length} products</p>
        </div>

        {/* Filters & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center gap-2 flex-1">
            <SlidersHorizontal className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under500">Under ₹500</SelectItem>
              <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
              <SelectItem value="over1000">Over ₹1000</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600 mb-4">No products found</p>
            <Button onClick={() => { setPriceRange('all'); setSortBy('featured'); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListing;

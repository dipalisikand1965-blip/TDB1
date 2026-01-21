import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { SlidersHorizontal, Loader2, ChevronDown, Sparkles, PawPrint } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { API_URL, getApiUrl } from '../utils/api';
import MiraContextPanel from '../components/MiraContextPanel';
import { useAuth } from '../context/AuthContext';

const PRODUCTS_PER_PAGE = 20;

// Map category to pillar for Mira panel
const CATEGORY_TO_PILLAR = {
  'cakes': 'celebrate',
  'custom': 'celebrate',
  'breed-cakes': 'celebrate',
  'treats': 'celebrate',
  'desi': 'celebrate',
  'desi-treats': 'celebrate',
  'hampers': 'celebrate',
  'meals': 'dine',
  'fresh-meals': 'dine',
  'frozen': 'celebrate',
  'frozen-treats': 'celebrate',
  'mini-cakes': 'celebrate',
  'dognuts': 'celebrate',
  'pizzas-burgers': 'dine',
  'merchandise': 'shop',
  'accessories': 'shop',
  'nut-butters': 'shop',
  'pan-india': 'shop',
  'cat': 'shop',
  'cat-treats': 'shop',
  'valentine': 'celebrate',
  'autoship': 'shop',
  'all': 'shop'
};

const ProductListing = ({ category = 'all' }) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const { user, token } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [userPets, setUserPets] = useState([]);
  const [personalizedMessage, setPersonalizedMessage] = useState('');

  // Get the pillar for this category
  const pillar = CATEGORY_TO_PILLAR[category] || 'shop';

  // Fetch user's pets for personalization
  useEffect(() => {
    const fetchPets = async () => {
      if (token) {
        try {
          const res = await fetch(`${getApiUrl()}/api/pets/my-pets`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserPets(data.pets || []);
            
            // Generate personalized message
            if (data.pets && data.pets.length > 0) {
              const pet = data.pets[0];
              const messages = [
                `${pet.name} would love these! 🐾`,
                `Perfect picks for ${pet.name}!`,
                `${pet.name}'s tail will wag for these! 🎉`,
                `Treats ${pet.name} will adore!`,
              ];
              setPersonalizedMessage(messages[Math.floor(Math.random() * messages.length)]);
            }
          }
        } catch (err) {
          console.debug('Failed to fetch pets:', err);
        }
      }
    };
    fetchPets();
  }, [token]);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // For pan-india, fetch multiple categories that can be shipped pan-india
        if (category === 'pan-india') {
          const categories = ['pan-india', 'treats', 'desi-treats', 'nut-butters'];
          const allProducts = [];
          
          for (const cat of categories) {
            const response = await fetch(`${getApiUrl()}/api/products?limit=500&category=${cat}`);
            if (response.ok) {
              const data = await response.json();
              allProducts.push(...(data.products || []));
            }
          }
          
          // Remove duplicates based on id
          const uniqueProducts = allProducts.filter((product, index, self) =>
            index === self.findIndex((p) => p.id === product.id)
          );
          
          setProducts(uniqueProducts);
        } else if (category === 'autoship') {
          // For autoship, fetch all products and filter by autoship_enabled
          const response = await fetch(`${getApiUrl()}/api/products?limit=500&autoship_enabled=true`);
          if (response.ok) {
            const data = await response.json();
            // Filter client-side in case API doesn't support the filter
            const autoshipProducts = (data.products || []).filter(p => p.autoship_enabled === true);
            setProducts(autoshipProducts);
          }
        } else {
          let url = `${API_URL}/api/products?limit=500`;
          if (searchQuery) {
            url += `&search=${encodeURIComponent(searchQuery)}`;
          } else if (category && category !== 'all') {
            // Use collection parameter for special collections like valentine
            const collectionCategories = ['valentine', 'seasonal', 'bestsellers'];
            if (collectionCategories.includes(category.toLowerCase())) {
              url += `&collection=${category}`;
            } else {
              url += `&category=${category}`;
            }
          }
          const response = await fetch(url);
          if (response.ok) {
            const data = await response.json();
            setProducts(data.products || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
      setLoading(false);
    };
    fetchProducts();
    setVisibleCount(PRODUCTS_PER_PAGE); // Reset visible count when category changes
  }, [category, searchQuery]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [priceRange, sortBy]);

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
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    switch (category) {
      case 'cakes': return 'Dog Cakes';
      case 'custom': return 'Breed-Specific Cakes';
      case 'breed-cakes': return 'Breed-Specific Cakes';
      case 'treats': return 'Treats & Snacks';
      case 'desi': return 'Desi Doggy Treats 🪔';
      case 'desi-treats': return 'Desi Doggy Treats 🪔';
      case 'merchandise': return 'Merchandise';
      case 'hampers': return 'Gift Hampers & Party Boxes 🎁';
      case 'meals': return 'Fresh Meals & Pizzas';
      case 'fresh-meals': return 'Fresh Meals';
      case 'frozen': return 'Frozen Treats';
      case 'frozen-treats': return 'Frozen Treats';
      case 'accessories': return 'Accessories & Toys';
      case 'pan-india': return 'Pan India Delivery';
      case 'mini-cakes': return 'Bowto Cakes';
      case 'cat': return 'Cat Treats';
      case 'cat-treats': return 'Cat Treats 🐱';
      case 'pizzas-burgers': return 'Pizzas & Burgers';
      case 'dognuts': return 'Pupcakes & Dognuts';
      case 'nut-butters': return 'Nut Butters';
      case 'autoship': return 'Autoship Products 🔄';
      case 'valentine': return 'Valentine Collection 💕';
      case 'other': return 'More Products';
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
      case 'merchandise': return 'Branded merchandise and gift items';
      case 'hampers': return 'Complete celebration packages with cakes, treats, bandanas, and toys!';
      case 'meals':
      case 'fresh-meals': return 'Nutritious fresh meals for your furry friend';
      case 'frozen':
      case 'frozen-treats': return 'Cool treats for hot days';
      case 'accessories': return 'Bandanas, toys, and celebration gear';
      case 'pan-india': return 'Treats and cakes delivered across India';
      case 'mini-cakes': return 'Bowto celebration cakes for any occasion';
      case 'cat':
      case 'cat-treats': return 'Special treats for our feline friends';
      case 'dognuts': return 'Mini baked treats for dog celebrations - pupcakes and dognuts!';
      case 'nut-butters': return 'Delicious and healthy nut butter treats';
      case 'other': return 'More amazing products for your pets';
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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="text-center mt-12">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8"
                  onClick={() => setVisibleCount(prev => prev + PRODUCTS_PER_PAGE)}
                  data-testid="load-more-btn"
                >
                  <ChevronDown className="w-5 h-5 mr-2" />
                  Load More ({filteredProducts.length - visibleCount} remaining)
                </Button>
              </div>
            )}
            
            {/* Showing count */}
            <p className="text-center text-gray-500 text-sm mt-4">
              Showing {Math.min(visibleCount, filteredProducts.length)} of {filteredProducts.length} products
            </p>
          </>
        )}
      </div>
      
      {/* Mira Context Panel - Celebrate/Shop Pillar */}
      <MiraContextPanel pillar="celebrate" position="right" />
    </div>
  );
};

export default ProductListing;

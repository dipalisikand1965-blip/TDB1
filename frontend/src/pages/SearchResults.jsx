import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Search, Filter, X, ChevronDown, Loader2, SlidersHorizontal, 
  Grid, List, Sparkles, PawPrint, ShoppingBag, HelpCircle,
  MapPin, Calendar, Heart, Star, Tag, Clock, ChevronRight, Gift, Package
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_URL } from '../utils/api';
import OccasionBoxBuilder from '../components/OccasionBoxBuilder';

/**
 * Super Intelligent Search - The One Place to Find Everything
 * 
 * Searches: Products, Services, FAQs, Articles, Events, Pillars
 * Personalizes: By pet profile, allergies, preferences
 * Now triggers Occasion Box Builder for celebration searches!
 */

// Occasion keywords for triggering box builder
const OCCASION_KEYWORDS = {
  birthday: ['birthday', 'bday', 'birth day', 'birthday box', 'birthday kit', 'birthday cake'],
  gotcha_day: ['gotcha', 'gotcha day', 'adoption day', 'adoption anniversary', 'gotcha box'],
  festival: ['diwali', 'christmas', 'holi', 'festival', 'celebration']
};

// Quick search categories
const QUICK_CATEGORIES = [
  { icon: '🎂', name: 'Cakes', query: 'birthday cakes' },
  { icon: '🍪', name: 'Treats', query: 'dog treats' },
  { icon: '🏨', name: 'Hotels', query: 'pet hotels' },
  { icon: '✂️', name: 'Grooming', query: 'grooming services' },
  { icon: '🎓', name: 'Training', query: 'dog training' },
  { icon: '✈️', name: 'Travel', query: 'pet travel' },
];

// FAQ Data (mock - ideally from API)
const FAQ_DATA = [
  { q: 'How do I book a pet hotel?', a: 'Go to Stay > Pet Hotels and select your dates', category: 'Booking' },
  { q: 'What if my dog has allergies?', a: 'Mira AI remembers allergies and filters unsafe products automatically', category: 'Health' },
  { q: 'Do you deliver pan-India?', a: 'Yes! We deliver across India', category: 'Delivery' },
  { q: 'How does Pet Soul work?', a: 'Pet Soul creates an intelligent profile that learns and remembers your pet', category: 'Features' },
  { q: 'Can I cancel my order?', a: 'Yes, orders can be cancelled within 24 hours of placing', category: 'Orders' },
];

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  
  // State
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState({
    products: [],
    services: [],
    faqs: [],
    pillars: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [pet, setPet] = useState(null);
  
  // Occasion Box Builder state
  const [showBoxBuilder, setShowBoxBuilder] = useState(false);
  const [detectedOccasion, setDetectedOccasion] = useState(null);
  
  // Filters
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedPillar, setSelectedPillar] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  
  // Detect occasion from search query
  const detectOccasion = useCallback((searchQuery) => {
    if (!searchQuery) return null;
    const lowerQuery = searchQuery.toLowerCase();
    
    for (const [occasion, keywords] of Object.entries(OCCASION_KEYWORDS)) {
      if (keywords.some(kw => lowerQuery.includes(kw))) {
        return occasion;
      }
    }
    return null;
  }, []);
  
  // Handle adding items to cart from box builder
  const handleAddToCart = (items) => {
    items.forEach(item => {
      addToCart({
        id: item.id,
        title: item.title || item.name,
        price: item.price,
        image: item.image_url || item.image || item.images?.[0],
        quantity: 1
      });
    });
  };

  // Fetch user's pet for personalization
  useEffect(() => {
    const fetchPet = async () => {
      if (!user || !token) return;
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.pets?.length > 0) {
            setPet(data.pets[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching pet:', error);
      }
    };
    fetchPet();
  }, [user, token]);

  // Perform comprehensive search
  const performSearch = useCallback(async () => {
    const searchQuery = searchParams.get('q');
    if (!searchQuery) return;
    
    // Detect if this is an occasion-based search
    const occasion = detectOccasion(searchQuery);
    setDetectedOccasion(occasion);

    setIsLoading(true);
    try {
      // Primary search using /api/products with search param (works reliably)
      const productRes = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(searchQuery)}&limit=100`);
      const productData = productRes.ok ? await productRes.json() : { products: [] };
      
      // Get products from response
      let allProducts = productData.products || [];
      
      // Also try Meilisearch for additional results (may fail if not running)
      try {
        const searchRes = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const searchHits = searchData.hits || [];
          // Add any new products from search
          for (const hit of searchHits) {
            if (!allProducts.find(p => p.id === hit.id || p.name === hit.name)) {
              allProducts.push(hit);
            }
          }
        }
      } catch (e) {
        // Meilisearch not available, that's fine
      }

      // Filter by pet allergies if available
      let filteredProducts = allProducts;
      if (pet?.allergies?.length > 0) {
        filteredProducts = allProducts.map(p => ({
          ...p,
          safeForPet: !pet.allergies.some(allergy => 
            p.name?.toLowerCase().includes(allergy.toLowerCase()) ||
            p.description?.toLowerCase().includes(allergy.toLowerCase())
          )
        }));
      }

      // Search FAQs locally
      const matchedFaqs = FAQ_DATA.filter(faq => 
        faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchQuery.toLowerCase())
      );

      // Match pillars
      const PILLARS = ['celebrate', 'dine', 'stay', 'travel', 'care', 'enjoy', 'fit', 'learn', 'paperwork', 'advisory', 'emergency', 'farewell', 'adopt', 'shop'];
      const matchedPillars = PILLARS.filter(p => 
        p.toLowerCase().includes(searchQuery.toLowerCase()) ||
        searchQuery.toLowerCase().includes(p)
      );

      setResults({
        products: filteredProducts,
        services: filteredProducts.filter(p => p.pillar && p.pillar !== 'celebrate'),
        faqs: matchedFaqs,
        pillars: matchedPillars,
      });

    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, pet]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const handleQuickSearch = (searchQuery) => {
    setQuery(searchQuery);
    setSearchParams({ q: searchQuery });
  };

  const openMira = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  // Count results
  const totalProducts = results.products.length;
  const totalFaqs = results.faqs.length;
  const totalPillars = results.pillars.length;
  const totalResults = totalProducts + totalFaqs + totalPillars;

  // Filter products based on current tab and filters
  const getFilteredProducts = () => {
    let filtered = results.products;
    
    if (selectedPillar) {
      filtered = filtered.filter(p => p.pillar === selectedPillar);
    }
    
    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      filtered = filtered.filter(p => {
        const price = p.price || 0;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    // Sort
    if (sortBy === 'price_low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return filtered;
  };

  const displayProducts = getFilteredProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Pet Personalization Banner */}
          {pet && (
            <div className="flex items-center gap-2 mb-4 text-sm">
              <PawPrint className="w-4 h-4" />
              <span>Searching for <strong>{pet.name}</strong></span>
              {pet.allergies?.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  ⚠️ Filtering out {pet.allergies.join(', ')}
                </span>
              )}
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={pet ? `What does ${pet.name} need today?` : "Search products, services, FAQs..."}
                  className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 rounded-lg focus:outline-none focus:ring-4 focus:ring-white/30"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" size="lg" className="bg-white text-purple-600 hover:bg-gray-100 px-8">
                Search
              </Button>
            </div>
          </form>

          {/* Quick Search Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => handleQuickSearch(cat.query)}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
            <p className="text-gray-600">Searching everything for you...</p>
          </div>
        ) : searchParams.get('q') ? (
          <>
            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Results for "{searchParams.get('q')}"
                </h1>
                <p className="text-gray-600">
                  Found {totalResults} results
                  {pet && <span className="text-purple-600"> • Personalized for {pet.name}</span>}
                </p>
              </div>

              {/* View Controls */}
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  <option value="relevance">Most Relevant</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                </select>
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-600'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Occasion Box Suggestion - Show when search matches celebration keywords */}
            {detectedOccasion && (
              <Card className="mb-6 p-4 sm:p-6 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 border-purple-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg">
                    {detectedOccasion === 'birthday' ? '🎂' : detectedOccasion === 'gotcha_day' ? '💝' : '🎉'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {detectedOccasion === 'birthday' ? 'Planning a Birthday Celebration?' : 
                       detectedOccasion === 'gotcha_day' ? 'Celebrating a Gotcha Day?' : 
                       'Festival Time!'}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {detectedOccasion === 'birthday' 
                        ? 'Build a complete birthday box with cake, treats, toys & accessories - all in one curated package!' 
                        : detectedOccasion === 'gotcha_day'
                        ? 'Create a special gotcha day box to celebrate your furry family member!'
                        : 'Build a festive box with themed treats and accessories!'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setShowBoxBuilder(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 gap-2 w-full sm:w-auto"
                    data-testid="build-box-search-cta"
                  >
                    <Package className="w-4 h-4" />
                    Build {detectedOccasion === 'birthday' ? 'Birthday' : detectedOccasion === 'gotcha_day' ? 'Gotcha Day' : 'Festival'} Box
                  </Button>
                </div>
              </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto pb-2">
              {[
                { id: 'all', label: `All (${totalResults})` },
                { id: 'products', label: `Products (${totalProducts})` },
                { id: 'faqs', label: `FAQs (${totalFaqs})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* AI Suggestion */}
            {totalResults > 0 && (
              <div 
                onClick={openMira}
                className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Need help choosing?</p>
                    <p className="text-sm text-gray-600">
                      Ask Mira for personalized recommendations
                      {pet && ` based on ${pet.name}'s profile`}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            )}

            {/* Matched Pillars */}
            {(activeTab === 'all' || activeTab === 'pillars') && results.pillars.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Related Sections</h2>
                <div className="flex flex-wrap gap-3">
                  {results.pillars.map((pillar) => (
                    <Link
                      key={pillar}
                      to={`/${pillar}`}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all"
                    >
                      <span className="text-lg">
                        {pillar === 'celebrate' && '🎂'}
                        {pillar === 'dine' && '🍽️'}
                        {pillar === 'stay' && '🏨'}
                        {pillar === 'travel' && '✈️'}
                        {pillar === 'care' && '💊'}
                        {pillar === 'enjoy' && '🎾'}
                        {pillar === 'fit' && '🏃'}
                        {pillar === 'learn' && '🎓'}
                        {pillar === 'paperwork' && '📄'}
                        {pillar === 'advisory' && '📋'}
                        {pillar === 'emergency' && '🚨'}
                        {pillar === 'farewell' && '🌈'}
                        {pillar === 'adopt' && '🐾'}
                        {pillar === 'shop' && '🛒'}
                      </span>
                      <span className="font-medium capitalize">{pillar}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {(activeTab === 'all' || activeTab === 'faqs') && results.faqs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {results.faqs.map((faq, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-purple-600 text-sm font-bold">Q</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{faq.q}</p>
                          <p className="text-gray-600 mt-1">{faq.a}</p>
                          <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {faq.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Products Grid */}
            {(activeTab === 'all' || activeTab === 'products') && displayProducts.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-purple-600" />
                  Products & Services ({displayProducts.length})
                </h2>
                
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                  : 'space-y-4'
                }>
                  {displayProducts.map((product, idx) => {
                    const hasOptions = product.options?.length > 0 || product.has_variants;
                    const productSlug = product.slug || product.handle || product.id;
                    
                    return (
                      <Link 
                        key={product.id || idx}
                        to={`/product/${productSlug}`}
                        className={`bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow block ${
                          product.safeForPet === false ? 'opacity-60 relative' : ''
                        } ${viewMode === 'list' ? 'flex' : ''}`}
                      >
                        {/* Unsafe Badge */}
                        {product.safeForPet === false && (
                          <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            ⚠️ Contains allergens
                          </div>
                        )}
                        
                        {/* Options Available Badge */}
                        {hasOptions && (
                          <div className="absolute top-2 right-2 z-10 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                            Options Available
                          </div>
                        )}

                        {/* Image */}
                        <div className={viewMode === 'list' ? 'w-32 flex-shrink-0' : 'relative'}>
                          <img
                            src={product.image_url || product.image || product.images?.[0] || ''}
                            alt={product.name}
                            className={`object-cover bg-gray-100 ${viewMode === 'list' ? 'w-32 h-32' : 'w-full aspect-square'}`}
                          />
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1">
                          {/* Pillar Badge */}
                          {product.pillar && (
                            <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded mb-2 capitalize">
                              {product.pillar}
                            </span>
                          )}
                          
                          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                            {product.name}
                          </h3>
                          
                          {viewMode === 'list' && product.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                              {product.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold text-purple-600">
                              ₹{product.price?.toLocaleString() || 'N/A'}
                            </span>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (hasOptions) {
                                  navigate(`/product/${productSlug}`);
                                } else {
                                  addToCart(product);
                                }
                              }}
                              className="bg-purple-600 hover:bg-purple-700 text-xs"
                              disabled={product.safeForPet === false}
                            >
                              {hasOptions ? 'View Options' : 'Add'}
                            </Button>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {totalResults === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No results found</h2>
                <p className="text-gray-600 mb-6">
                  We couldn't find anything matching "{searchParams.get('q')}"
                </p>
                <Button onClick={openMira} className="bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ask Mira for help
                </Button>
              </div>
            )}
          </>
        ) : (
          /* No search query - Show discovery page */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Find Everything Your Pet Needs
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Search for products, services, answers to questions, and more. 
              {pet && ` Personalized for ${pet.name}.`}
            </p>
            
            {/* Popular Searches */}
            <div className="max-w-2xl mx-auto">
              <p className="text-sm text-gray-500 mb-4">Popular searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['birthday cake', 'breed cake', 'pet hotel mumbai', 'grooming near me', 'puppy training', 'dog food', 'pet travel'].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleQuickSearch(term)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Occasion Box Builder Modal */}
      <OccasionBoxBuilder
        isOpen={showBoxBuilder}
        onClose={() => setShowBoxBuilder(false)}
        occasionType={detectedOccasion || 'birthday'}
        petName={pet?.name || 'your pet'}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};

export default SearchResults;

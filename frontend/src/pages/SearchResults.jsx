import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X, ChevronDown, Loader2, SlidersHorizontal, Grid, List } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import ProductCard from '../components/ProductCard';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Category options for filtering
const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'cakes', label: 'Cakes' },
  { value: 'treats', label: 'Treats & Biscuits' },
  { value: 'dognuts', label: 'Pupcakes & Dognuts' },
  { value: 'mini-cakes', label: 'Bowto Cakes' },
  { value: 'breed-cakes', label: 'Breed Cakes' },
  { value: 'fresh-meals', label: 'Fresh Meals' },
  { value: 'frozen-treats', label: 'Frozen Treats' },
  { value: 'desi-treats', label: 'Desi Treats' },
  { value: 'nut-butters', label: 'Nut Butters' },
  { value: 'cat-treats', label: 'Cat Treats' },
  { value: 'accessories', label: 'Accessories & Toys' },
  { value: 'hampers', label: 'Gift Hampers' },
];

// Sort options
const SORT_OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
];

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [totalHits, setTotalHits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Filters
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [panIndia, setPanIndia] = useState(searchParams.get('pan_india') === 'true');
  const [autoship, setAutoship] = useState(searchParams.get('autoship') === 'true');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  
  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 24;

  // Perform search
  const performSearch = useCallback(async () => {
    const searchQuery = searchParams.get('q');
    if (!searchQuery) return;

    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      params.set('limit', limit);
      params.set('offset', offset);
      
      if (category) params.set('category', category);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (panIndia) params.set('pan_india', 'true');
      if (autoship) params.set('autoship', 'true');
      if (sort) params.set('sort', sort);

      const response = await fetch(`${API_URL}/api/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        if (offset === 0) {
          setResults(data.hits || []);
        } else {
          setResults(prev => [...prev, ...(data.hits || [])]);
        }
        setTotalHits(data.estimatedTotalHits || 0);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, offset, category, minPrice, maxPrice, panIndia, autoship, sort]);

  // Initial search - track query changes
  const currentSearchQuery = searchParams.get('q');
  useEffect(() => {
    setOffset(0);
    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearchQuery, category, minPrice, maxPrice, panIndia, autoship, sort]);

  // Load more
  useEffect(() => {
    if (offset > 0) {
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Handle new search
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      setOffset(0);
    }
  };

  // Update URL params when filters change
  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set('q', searchParams.get('q') || query);
    if (category) params.set('category', category);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (panIndia) params.set('pan_india', 'true');
    if (autoship) params.set('autoship', 'true');
    if (sort) params.set('sort', sort);
    setSearchParams(params);
    setOffset(0);
  };

  // Clear all filters
  const clearFilters = () => {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setPanIndia(false);
    setAutoship(false);
    setSort('');
    setSearchParams({ q: searchParams.get('q') || query });
    setOffset(0);
  };

  const currentQuery = searchParams.get('q') || '';
  const hasActiveFilters = category || minPrice || maxPrice || panIndia || autoship || sort;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-10 h-12 text-lg"
                data-testid="search-page-input"
              />
            </div>
            <Button type="submit" className="h-12 px-6 bg-purple-600 hover:bg-purple-700">
              Search
            </Button>
          </form>
          
          {currentQuery && (
            <div className="mt-4 flex items-center gap-2 text-gray-600">
              <span>Showing results for</span>
              <span className="font-semibold text-gray-900">&ldquo;{currentQuery}&rdquo;</span>
              <span className="text-gray-400">({totalHits} results)</span>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <Select value={category} onValueChange={(val) => { setCategory(val); }}>
              <SelectTrigger className="w-[180px]" data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value || 'all'}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sort} onValueChange={(val) => { setSort(val); }}>
              <SelectTrigger className="w-[180px]" data-testid="sort-filter">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value || 'relevance'}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* More Filters Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              More Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {/* Apply Button */}
            <Button onClick={applyFilters} className="bg-purple-600 hover:bg-purple-700">
              Apply Filters
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-gray-500">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}

            {/* View Mode Toggle */}
            <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Price Range */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Price Range</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-gray-400">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700">Shipping</label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pan-india"
                    checked={panIndia}
                    onCheckedChange={setPanIndia}
                  />
                  <label htmlFor="pan-india" className="text-sm text-gray-600 cursor-pointer">
                    Pan India Shipping
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700">Subscription</label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autoship"
                    checked={autoship}
                    onCheckedChange={setAutoship}
                  />
                  <label htmlFor="autoship" className="text-sm text-gray-600 cursor-pointer">
                    Autoship Available
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-500">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
                : 'grid-cols-1 md:grid-cols-2'
            }`}>
              {results.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {/* Load More */}
            {results.length < totalHits && (
              <div className="mt-8 text-center">
                <Button
                  onClick={() => setOffset(prev => prev + limit)}
                  disabled={isLoading}
                  variant="outline"
                  className="min-w-[200px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${results.length} of ${totalHits})`
                  )}
                </Button>
              </div>
            )}
          </>
        ) : currentQuery ? (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No results found</h3>
            <p className="text-gray-500 mb-6">
              We couldn&apos;t find any products matching &ldquo;{currentQuery}&rdquo;
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => navigate('/cakes')}>
                Browse Cakes
              </Button>
              <Button variant="outline" onClick={() => navigate('/treats')}>
                Browse Treats
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Search for products</h3>
            <p className="text-gray-500">
              Enter a search term to find cakes, treats, and more!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
// Build timestamp: 1768503808

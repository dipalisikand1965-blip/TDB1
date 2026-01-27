import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, ArrowRight, Tag } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { API_URL } from '../utils/api';


const SearchBar = ({ onClose, isOverlay = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], collections: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const debounceTimer = useRef(null);

  // Debounced search - uses universal search
  const performSearch = useCallback(async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults({ products: [], collections: [], services: [], stays: [], boarding: [] });
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use universal search endpoint for comprehensive results
      const response = await fetch(`${API_URL}/api/search/universal?q=${encodeURIComponent(searchQuery)}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        console.log('Universal search results:', data);
        setResults({
          products: data.products || [],
          collections: [],
          services: data.services || [],
          stays: data.stays || [],
          boarding: data.boarding || []
        });
        setIsOpen(true);
      } else {
        // Fallback to typeahead
        const fallbackResponse = await fetch(`${API_URL}/api/search/typeahead?q=${encodeURIComponent(searchQuery)}&limit=8`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.products || fallbackData.collections) {
            setResults(fallbackData);
          } else if (fallbackData.hits) {
            setResults({ products: fallbackData.hits, collections: [] });
          }
          setIsOpen(true);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle search submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
      if (onClose) onClose();
    }
  };

  // Handle product click
  const handleProductClick = (product) => {
    // Navigate to search results for now (we can make this go to product page later)
    navigate(`/search?q=${encodeURIComponent(product.name)}`);
    setIsOpen(false);
    setQuery('');
    if (onClose) onClose();
  };

  // Handle collection click
  const handleCollectionClick = (collection) => {
    const slug = collection.slug || collection.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/${slug}`);
    setIsOpen(false);
    setQuery('');
    if (onClose) onClose();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input on overlay open
  useEffect(() => {
    if (isOverlay && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOverlay]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const hasResults = results.products.length > 0 || results.collections.length > 0;

  return (
    <div className="relative w-full" data-testid="search-bar">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-gray-400 pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for cakes, treats, or ingredients..."
            value={query}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 h-12 text-base rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
            data-testid="search-input"
          />
          {isLoading && (
            <Loader2 className="absolute right-14 w-5 h-5 text-purple-500 animate-spin" />
          )}
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 h-8 w-8"
              onClick={() => {
                setQuery('');
                setResults({ products: [], collections: [] });
                setIsOpen(false);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Typeahead Dropdown */}
      {isOpen && hasResults && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
          data-testid="search-dropdown"
        >
          {/* Collections Section */}
          {results.collections.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                Collections
              </div>
              <div className="flex flex-wrap gap-2">
                {results.collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleCollectionClick(collection)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium hover:bg-purple-100 transition-colors"
                    data-testid={`collection-result-${collection.id}`}
                  >
                    <Tag className="w-3 h-3" />
                    {collection.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          {results.products.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">
                Products
              </div>
              {results.products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  data-testid={`product-result-${product.id}`}
                >
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                      <span className="capitalize">{product.category?.replace(/-/g, ' ')}</span>
                      <span className="text-purple-600 font-semibold">₹{product.price}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* View All Results */}
          <div className="p-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-center gap-2 py-2 text-purple-600 font-medium hover:text-purple-700 transition-colors"
              data-testid="view-all-results-btn"
            >
              <Search className="w-4 h-4" />
              View all results for &ldquo;{query}&rdquo;
            </button>
          </div>
        </div>
      )}

      {/* No Results State */}
      {isOpen && query.length >= 2 && !isLoading && !hasResults && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-6 text-center z-50"
        >
          <div className="text-gray-500">
            No results found for &ldquo;{query}&rdquo;
          </div>
          <div className="text-sm text-gray-400 mt-1">
            Try different keywords or check spelling
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;

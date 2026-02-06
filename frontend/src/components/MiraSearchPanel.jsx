/**
 * MiraSearchPanel.jsx
 * 
 * Unified Mira-powered search panel that replaces traditional product search.
 * Every search flows through Mira's understanding layer.
 * 
 * Part of Phase 1.1: Connect Search to Mira
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Mic, MicOff, Sparkles, ShoppingCart, ArrowRight, MessageCircle, Calendar, HelpCircle, Loader2, X } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';

// Intent badges with colors
const INTENT_STYLES = {
  'FIND': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Search, label: 'Finding' },
  'PLAN': { bg: 'bg-purple-100', text: 'text-purple-700', icon: Calendar, label: 'Planning' },
  'COMPARE': { bg: 'bg-amber-100', text: 'text-amber-700', icon: ArrowRight, label: 'Comparing' },
  'ORDER': { bg: 'bg-green-100', text: 'text-green-700', icon: ShoppingCart, label: 'Ordering' },
  'EXPLORE': { bg: 'bg-teal-100', text: 'text-teal-700', icon: HelpCircle, label: 'Exploring' },
  'REMEMBER': { bg: 'bg-pink-100', text: 'text-pink-700', icon: Sparkles, label: 'Saving' },
};

const MiraSearchPanel = ({ 
  placeholder = "Ask Mira anything...",
  className = "",
  variant = "navbar", // "navbar" | "hero"
  onClose,
  autoFocus = false
}) => {
  const { token } = useAuth();
  const { currentPet } = usePillarContext();
  const navigate = useNavigate();
  
  // Alias for clarity
  const selectedPet = currentPet;
  
  // State
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [miraResponse, setMiraResponse] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Refs
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const panelRef = useRef(null);
  const handleMiraSearchRef = useRef(null);
  
  // Default pet context if no pet selected - memoized
  const petContext = React.useMemo(() => selectedPet ? {
    name: selectedPet.name,
    breed: selectedPet.breed,
    age: selectedPet.age,
    traits: selectedPet.traits || [],
    sensitivities: selectedPet.sensitivities || [],
    favorites: selectedPet.favorites || []
  } : {
    name: "your pet",
    breed: "Dog",
    age: "adult"
  }, [selectedPet]);
  
  // Main Mira search function - defined before useEffect that uses it
  const handleMiraSearch = useCallback(async (searchQuery = null) => {
    const inputQuery = searchQuery || query;
    if (!inputQuery.trim()) return;
    
    setIsProcessing(true);
    setShowResults(true);
    setMiraResponse(null);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/os/understand-with-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          input: inputQuery,
          pet_id: selectedPet?.id,
          pet_context: petContext,
          page_context: window.location.pathname
        })
      });
      
      const data = await response.json();
      setMiraResponse(data);
      
    } catch (error) {
      console.error('Mira search error:', error);
      setMiraResponse({
        success: false,
        error: true,
        response: {
          message: "I'll connect you with your pet concierge to help with this."
        }
      });
    }
    
    setIsProcessing(false);
  }, [query, token, selectedPet, petContext]);
  
  // Keep ref updated with latest function
  useEffect(() => {
    handleMiraSearchRef.current = handleMiraSearch;
  }, [handleMiraSearch]);
  
  // Voice recognition setup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        // Auto-submit voice query using ref
        if (handleMiraSearchRef.current) {
          handleMiraSearchRef.current(transcript);
        }
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);
  
  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Toggle voice
  const toggleVoice = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    handleMiraSearch();
  };
  
  // Handle product click - add to cart or navigate
  const handleProductClick = (product) => {
    if (product.url) {
      navigate(product.url);
    } else if (product.id) {
      navigate(`/product/${product.id}`);
    }
    setShowResults(false);
    setQuery('');
  };
  
  // Handle concierge handoff
  const handleConciergeClick = () => {
    // Open concierge modal or navigate to concierge page
    window.dispatchEvent(new CustomEvent('openMiraAI', { 
      detail: { 
        initialQuery: query,
        miraResponse: miraResponse 
      }
    }));
    setShowResults(false);
    setQuery('');
  };
  
  // Render product card
  const renderProductCard = (product, idx) => (
    <button
      key={idx}
      onClick={() => handleProductClick(product)}
      className="flex items-start gap-3 p-3 hover:bg-purple-50 rounded-lg transition-all text-left w-full group"
      data-testid={`mira-product-${idx}`}
    >
      {/* Product Image */}
      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${product.name}`; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🦴</div>
        )}
      </div>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-purple-700">
          {product.name}
        </h4>
        {product.why_for_pet && (
          <p className="text-xs text-purple-600 mt-0.5 line-clamp-2">
            {product.why_for_pet}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {product.price && (
            <span className="text-sm font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
          )}
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-gray-400 line-through">₹{product.original_price.toLocaleString()}</span>
          )}
        </div>
      </div>
      
      {/* Add to Cart hint */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ShoppingCart className="w-4 h-4 text-purple-500" />
      </div>
    </button>
  );
  
  // Get intent style
  const getIntentStyle = (intent) => INTENT_STYLES[intent] || INTENT_STYLES['FIND'];
  
  return (
    <div ref={panelRef} className={`relative ${className}`}>
      {/* Search Input */}
      <form 
        onSubmit={handleSubmit} 
        className="flex"
        style={{ touchAction: 'manipulation', WebkitTouchCallout: 'none' }}
      >
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => miraResponse && setShowResults(true)}
            onTouchStart={(e) => e.currentTarget.focus()}
            placeholder={selectedPet ? `Ask Mira anything for ${selectedPet.name}...` : placeholder}
            className={`w-full px-4 py-3 text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[48px] appearance-none ${
              variant === 'hero' ? 'rounded-l-full pl-5' : 'rounded-l-md'
            }`}
            style={{ 
              touchAction: 'manipulation', 
              WebkitTapHighlightColor: 'transparent',
              WebkitAppearance: 'none',
              fontSize: '16px'  /* Prevents iOS zoom on focus */
            }}
            data-testid="mira-search-input"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          {isProcessing && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            </div>
          )}
        </div>
        
        {/* Voice Button */}
        <button
          type="button"
          onClick={toggleVoice}
          className={`px-4 min-h-[48px] transition-all ${
            isListening 
              ? 'bg-red-500 animate-pulse' 
              : 'bg-purple-400 hover:bg-purple-500'
          }`}
          style={{ touchAction: 'manipulation' }}
          data-testid="mira-voice-btn"
          aria-label={isListening ? 'Stop listening' : 'Start voice search'}
        >
          {isListening ? (
            <MicOff className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-white" />
          )}
        </button>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className={`px-5 min-h-[48px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-colors ${
            variant === 'hero' ? 'rounded-r-full' : 'rounded-r-md'
          }`}
          style={{ touchAction: 'manipulation' }}
          data-testid="mira-search-btn"
        >
          <Search className="w-5 h-5 text-white" />
        </button>
      </form>
      
      {/* Mira Results Panel */}
      {showResults && miraResponse && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-purple-200 overflow-hidden z-[9999] max-h-[70vh] overflow-y-auto">
          {/* Header with Intent */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Mira</span>
              {miraResponse.understanding?.intent && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${getIntentStyle(miraResponse.understanding.intent).bg} ${getIntentStyle(miraResponse.understanding.intent).text}`}>
                  {getIntentStyle(miraResponse.understanding.intent).label}
                </span>
              )}
            </div>
            <button 
              onClick={() => setShowResults(false)}
              className="p-1 hover:bg-white/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Mira's Message */}
          <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
            <p className="text-sm text-gray-700">
              {miraResponse.response?.message || "Here's what I found..."}
            </p>
            {miraResponse.response?.reasoning && (
              <p className="text-xs text-purple-600 mt-1 italic">
                {miraResponse.response.reasoning}
              </p>
            )}
          </div>
          
          {/* Products (for INSTANT execution) */}
          {miraResponse.execution_type === 'INSTANT' && miraResponse.response?.products?.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {miraResponse.response.has_real_products ? 'Recommended for ' : 'Suggestions for '}
                  {petContext.name}
                </span>
                {miraResponse.response.has_real_products && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Real Products
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {miraResponse.response.products.slice(0, 4).map((product, idx) => 
                  renderProductCard(product, idx)
                )}
              </div>
              
              {/* See More Link */}
              {miraResponse.response.products.length > 4 && (
                <Link
                  to={`/search?q=${encodeURIComponent(query)}&mira=true`}
                  onClick={() => { setShowResults(false); setQuery(''); }}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-purple-600 font-medium text-sm hover:bg-purple-50"
                >
                  See all {miraResponse.response.products.length} results
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}
          
          {/* Concierge Handoff (for CONCIERGE execution) */}
          {miraResponse.execution_type === 'CONCIERGE' && (
            <div className="p-4">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      This needs your Pet Concierge
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {miraResponse.response?.concierge_preview || 
                       "This request involves planning, coordination, or personalized service that our concierge team handles best."}
                    </p>
                    <button
                      onClick={handleConciergeClick}
                      className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
                      data-testid="mira-concierge-btn"
                    >
                      Connect with Concierge
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Still show suggestions if available */}
              {miraResponse.response?.products?.length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2">
                    While you wait, you might like:
                  </span>
                  <div className="mt-2 divide-y divide-gray-100">
                    {miraResponse.response.products.slice(0, 2).map((product, idx) => 
                      renderProductCard(product, idx)
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Error State */}
          {miraResponse.error && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-600 mb-3">
                {miraResponse.response?.message || "Something went wrong"}
              </p>
              <button
                onClick={handleConciergeClick}
                className="px-4 py-2 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-600"
              >
                Talk to Concierge
              </button>
            </div>
          )}
          
          {/* Quick Suggestions */}
          {!miraResponse.response?.products?.length && !miraResponse.error && miraResponse.execution_type === 'INSTANT' && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 mb-3">
                No specific products found. Try asking differently or:
              </p>
              <button
                onClick={handleConciergeClick}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600"
              >
                Ask Your Concierge
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MiraSearchPanel;

import React, { useState, useRef, useEffect } from 'react';
import { Input } from './ui/input';
import { searchBreeds } from '../data/dogBreeds';

/**
 * Breed Autocomplete Input
 * Suggests correct breed names as user types, handling common misspellings
 */
const BreedAutocomplete = ({ value, onChange, placeholder, className, id, name, ...props }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Search breeds when value changes
  useEffect(() => {
    if (value && value.length >= 2) {
      const results = searchBreeds(value, 6);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setHighlightedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target) &&
        suggestionsRef.current && !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    onChange(e);
  };

  const handleSuggestionClick = (breed) => {
    // Simulate an input change event
    const syntheticEvent = {
      target: {
        name: name || 'petBreed',
        value: breed,
        type: 'text'
      }
    };
    onChange(syntheticEvent);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        name={name}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => value && value.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        {...props}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs text-slate-400 bg-slate-900 border-b border-slate-700">
              Suggested breeds
            </div>
            {suggestions.map((breed, index) => (
              <button
                key={breed}
                type="button"
                onClick={() => handleSuggestionClick(breed)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-pink-500/20 transition-colors flex items-center gap-2 ${
                  index === highlightedIndex ? 'bg-pink-500/20 text-pink-300' : 'text-slate-200'
                }`}
              >
                <span className="text-base">🐕</span>
                <span>{breed}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BreedAutocomplete;

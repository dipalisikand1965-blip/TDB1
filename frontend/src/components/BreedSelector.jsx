import React, { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';
import { PawPrint, Search, Check, ChevronDown } from 'lucide-react';

// Comprehensive breed list with categories
const BREED_LIST = [
  // Small Breeds
  { name: 'Shih Tzu', category: 'Small', aliases: ['shihtzu', 'shitzu', 'shih-tzu'] },
  { name: 'Pomeranian', category: 'Small', aliases: ['pom', 'pomerian'] },
  { name: 'Chihuahua', category: 'Small', aliases: ['chi'] },
  { name: 'Maltese', category: 'Small', aliases: [] },
  { name: 'Pug', category: 'Small', aliases: ['pugs'] },
  { name: 'Yorkshire Terrier', category: 'Small', aliases: ['yorkie', 'yorkshire'] },
  { name: 'French Bulldog', category: 'Small', aliases: ['frenchie', 'frenchbulldog'] },
  { name: 'Dachshund', category: 'Small', aliases: ['wiener', 'sausage dog'] },
  { name: 'Beagle', category: 'Small', aliases: [] },
  { name: 'Boston Terrier', category: 'Small', aliases: ['boston'] },
  { name: 'Cavalier King Charles Spaniel', category: 'Small', aliases: ['cavalier', 'ckcs'] },
  { name: 'Jack Russell Terrier', category: 'Small', aliases: ['jackrussell', 'jrt'] },
  { name: 'Miniature Schnauzer', category: 'Small', aliases: ['mini schnauzer', 'minischnauzer'] },
  { name: 'Shiba Inu', category: 'Small', aliases: ['shiba'] },
  { name: 'Corgi', category: 'Small', aliases: ['pembroke welsh corgi', 'welsh corgi'] },
  
  // Medium Breeds
  { name: 'Cocker Spaniel', category: 'Medium', aliases: ['cockerspaniel'] },
  { name: 'Border Collie', category: 'Medium', aliases: ['bordercollie'] },
  { name: 'Australian Shepherd', category: 'Medium', aliases: ['aussie', 'australianshepherd'] },
  { name: 'English Bulldog', category: 'Medium', aliases: ['bulldog', 'englishbulldog'] },
  { name: 'Springer Spaniel', category: 'Medium', aliases: [] },
  { name: 'Boxer', category: 'Medium', aliases: [] },
  { name: 'Dalmatian', category: 'Medium', aliases: [] },
  { name: 'Samoyed', category: 'Medium', aliases: [] },
  
  // Large Breeds
  { name: 'Golden Retriever', category: 'Large', aliases: ['golden', 'goldenretriever'] },
  { name: 'Labrador Retriever', category: 'Large', aliases: ['labrador', 'lab', 'labradorretriever'] },
  { name: 'German Shepherd', category: 'Large', aliases: ['gsd', 'germanshepherd', 'alsatian'] },
  { name: 'Siberian Husky', category: 'Large', aliases: ['husky', 'siberianhusky'] },
  { name: 'Rottweiler', category: 'Large', aliases: ['rottie', 'rotweiler'] },
  { name: 'Doberman Pinscher', category: 'Large', aliases: ['doberman', 'dobermanpinscher'] },
  { name: 'Great Dane', category: 'Large', aliases: ['greatdane'] },
  { name: 'Bernese Mountain Dog', category: 'Large', aliases: ['bernese', 'berner'] },
  { name: 'Saint Bernard', category: 'Large', aliases: [] },
  { name: 'Newfoundland', category: 'Large', aliases: ['newfie'] },
  { name: 'Akita', category: 'Large', aliases: [] },
  { name: 'Alaskan Malamute', category: 'Large', aliases: ['malamute'] },
  
  // Indian Breeds
  { name: 'Indian Pariah', category: 'Indian', aliases: ['indie', 'desi', 'indian pariah dog', 'desi dog'] },
  { name: 'Rajapalayam', category: 'Indian', aliases: [] },
  { name: 'Mudhol Hound', category: 'Indian', aliases: [] },
  { name: 'Kombai', category: 'Indian', aliases: [] },
  { name: 'Chippiparai', category: 'Indian', aliases: [] },
  { name: 'Kanni', category: 'Indian', aliases: [] },

  // Mixed / Indie mixes — extremely common in India, surfaced as first-class breeds
  { name: 'Indie Mix', category: 'Mixed', aliases: ['indie mix', 'indie-mix', 'indian mix', 'desi mix'] },
  { name: 'Labrador Mix', category: 'Mixed', aliases: ['lab mix', 'lab-mix', 'labmix'] },
  { name: 'Golden Retriever Mix', category: 'Mixed', aliases: ['golden mix', 'golden-mix', 'goldmix'] },
  { name: 'German Shepherd Mix', category: 'Mixed', aliases: ['gsd mix', 'shepherd mix'] },
  { name: 'Shih Tzu Mix', category: 'Mixed', aliases: ['shihtzu mix', 'shih-tzu-mix'] },
  { name: 'Pomeranian Mix', category: 'Mixed', aliases: ['pom mix', 'pom-mix'] },
  { name: 'Beagle Mix', category: 'Mixed', aliases: ['beagle-mix'] },
  { name: 'Husky Mix', category: 'Mixed', aliases: ['husky-mix', 'siberian husky mix'] },
  { name: 'Spitz Mix', category: 'Mixed', aliases: ['indian spitz mix', 'spitz-mix'] },
  { name: 'Mixed Breed', category: 'Mixed', aliases: ['mixed', 'mutt', 'crossbreed', 'cross breed', 'cross-breed'] },
  { name: 'Unknown', category: 'Other', aliases: [] },
];

// Prominent "quick pick" breeds shown as chips above the search box.
// Optimised for India: Indie + common mixes lead the list. Do NOT hide mixes in "Other".
export const POPULAR_BREED_CHIPS = [
  'Indian Pariah',
  'Indie Mix',
  'Labrador Mix',
  'Golden Retriever Mix',
  'Mixed Breed',
  'Labrador Retriever',
  'Golden Retriever',
  'Shih Tzu',
];

const BreedSelector = ({ 
  value, 
  onChange, 
  placeholder = "Start typing breed name...",
  className = "",
  error = false 
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Filter breeds based on input
  useEffect(() => {
    if (!inputValue.trim()) {
      setFilteredBreeds(BREED_LIST.slice(0, 10)); // Show top 10 by default
      return;
    }

    const search = inputValue.toLowerCase().replace(/\s+/g, '');
    const matches = BREED_LIST.filter(breed => {
      const nameMatch = breed.name.toLowerCase().replace(/\s+/g, '').includes(search);
      const aliasMatch = breed.aliases.some(alias => 
        alias.toLowerCase().replace(/\s+/g, '').includes(search)
      );
      return nameMatch || aliasMatch;
    });

    // Sort by relevance (exact matches first)
    matches.sort((a, b) => {
      const aExact = a.name.toLowerCase().replace(/\s+/g, '').startsWith(search);
      const bExact = b.name.toLowerCase().replace(/\s+/g, '').startsWith(search);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    setFilteredBreeds(matches.slice(0, 8));
    setHighlightedIndex(0);
  }, [inputValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    onChange?.(newValue);
  };

  const handleSelectBreed = (breed) => {
    setInputValue(breed.name);
    onChange?.(breed.name);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredBreeds.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredBreeds[highlightedIndex]) {
          handleSelectBreed(filteredBreeds[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlighted = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      highlighted?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  // Group breeds by category for display
  const groupedBreeds = filteredBreeds.reduce((acc, breed) => {
    if (!acc[breed.category]) {
      acc[breed.category] = [];
    }
    acc[breed.category].push(breed);
    return acc;
  }, {});

  return (
    <div className={`relative ${className}`}>
      {/* Popular breed chips — India-first, mixes surfaced as first-class options */}
      {!value && (
        <div className="flex flex-wrap gap-2 mb-3" data-testid="breed-popular-chips">
          {POPULAR_BREED_CHIPS.map(name => {
            const breed = BREED_LIST.find(b => b.name === name);
            if (!breed) return null;
            const isMix = breed.category === 'Mixed';
            return (
              <button
                key={name}
                type="button"
                onClick={() => handleSelectBreed(breed)}
                data-testid={`breed-chip-${name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  isMix
                    ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                    : 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100'
                }`}
              >
                {isMix ? '✨ ' : '🐾 '}{name}
              </button>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pl-10 pr-10 h-12 bg-gray-50 border-transparent focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 rounded-xl transition-all ${
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''
          }`}
          data-testid="breed-search-input"
          autoComplete="off"
        />
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown */}
      {isOpen && filteredBreeds.length > 0 && (
        <div 
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-xl max-h-72 overflow-y-auto"
          data-testid="breed-dropdown"
        >
          {Object.entries(groupedBreeds).map(([category, breeds]) => (
            <div key={category}>
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 sticky top-0">
                {category} Breeds
              </div>
              {breeds.map((breed, idx) => {
                const globalIndex = filteredBreeds.indexOf(breed);
                const isHighlighted = globalIndex === highlightedIndex;
                const isSelected = breed.name.toLowerCase() === inputValue.toLowerCase();
                
                return (
                  <button
                    key={breed.name}
                    data-index={globalIndex}
                    onClick={() => handleSelectBreed(breed)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                      isHighlighted ? 'bg-teal-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-teal-100' : 'bg-gray-100'
                    }`}>
                      <PawPrint className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                    </div>
                    <span className={`flex-1 font-medium ${isSelected ? 'text-teal-700' : 'text-gray-700'}`}>
                      {breed.name}
                    </span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-600" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {/* Custom breed option */}
          {inputValue && !filteredBreeds.some(b => b.name.toLowerCase() === inputValue.toLowerCase()) && (
            <button
              onClick={() => {
                onChange?.(inputValue);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 flex items-center gap-3 text-left border-t border-gray-100 hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                <PawPrint className="w-4 h-4 text-teal-600" />
              </div>
              <span className="flex-1 text-gray-700">
                Use "<span className="font-medium text-teal-600">{inputValue}</span>"
              </span>
            </button>
          )}
        </div>
      )}

      {/* No results */}
      {isOpen && filteredBreeds.length === 0 && inputValue && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-gray-200 shadow-xl p-4 text-center">
          <PawPrint className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No breeds found matching "{inputValue}"</p>
          <button
            onClick={() => {
              onChange?.(inputValue);
              setIsOpen(false);
            }}
            className="mt-3 text-teal-600 text-sm font-medium hover:underline"
          >
            Use this as custom breed
          </button>
        </div>
      )}
    </div>
  );
};

export default BreedSelector;
export { BREED_LIST };

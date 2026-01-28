import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, ChevronDown, Sparkles, PawPrint, LogOut } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

/**
 * Clean Navbar with all 14 Pillars
 * No icons in nav row for cleaner look
 */

const PILLARS = [
  {
    id: 'celebrate',
    name: 'Celebrate',
    icon: '🎂',
    path: '/celebrate',
    dropdown: [
      { name: 'Celebrate By Concierge®', path: '/celebrate', highlight: true },
      { name: 'Birthday Cakes', path: '/celebrate/cakes' },
      { name: 'Custom Cake', path: '/custom-cake' },
      { name: 'Breed Cakes', path: '/celebrate/breed-cakes' },
      { name: 'Pupcakes & Dognuts', path: '/celebrate/pupcakes' },
      { name: 'Treats', path: '/celebrate/treats' },
      { name: 'Desi Treats', path: '/celebrate/desi' },
      { name: 'Gift Hampers', path: '/celebrate/hampers' },
      { name: 'Accessories', path: '/celebrate/accessories' },
    ]
  },
  {
    id: 'dine',
    name: 'Dine',
    icon: '🍽️',
    path: '/dine',
    dropdown: [
      { name: 'Dine By Concierge®', path: '/dine', highlight: true },
      { name: 'Pet Restaurants', path: '/dine' },
      { name: 'Fresh Meals', path: '/dine?type=meals' },
      { name: 'Meal Plans', path: '/meal-plan' },
    ]
  },
  {
    id: 'stay',
    name: 'Stay',
    icon: '🏨',
    path: '/stay',
    dropdown: [
      { name: 'Stay By Concierge®', path: '/stay', highlight: true },
      { name: 'Pet Hotels', path: '/stay' },
      { name: 'Boarding', path: '/stay?type=boarding' },
      { name: 'Stay Essentials', path: '/stay#essentials' },
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    path: '/travel',
    dropdown: [
      { name: 'Travel By Concierge®', path: '/travel', highlight: true },
      { name: 'Pet Taxi', path: '/travel?type=taxi' },
      { name: 'Pet Airlines', path: '/travel?type=airline' },
      { name: 'Travel Planning', path: '/travel' },
    ]
  },
  {
    id: 'care',
    name: 'Care',
    icon: '💊',
    path: '/care',
    dropdown: [
      { name: 'Care By Concierge®', path: '/care', highlight: true },
      { name: 'Grooming', path: '/care?type=grooming' },
      { name: 'Vet Care', path: '/care?type=vet' },
      { name: 'Pet Sitting', path: '/care?type=sitting' },
      { name: 'Dog Walking', path: '/care?type=walking' },
    ]
  },
  {
    id: 'enjoy',
    name: 'Enjoy',
    icon: '🎾',
    path: '/enjoy',
    dropdown: [
      { name: 'Enjoy By Concierge®', path: '/enjoy', highlight: true },
      { name: 'Events', path: '/enjoy?type=event' },
      { name: 'Pet Parks', path: '/enjoy?type=park' },
      { name: 'Playdates', path: '/enjoy?type=meetup' },
    ]
  },
  {
    id: 'fit',
    name: 'Fit',
    icon: '🏃',
    path: '/fit',
    dropdown: [
      { name: 'Fit By Concierge®', path: '/fit', highlight: true },
      { name: 'Fitness Plans', path: '/fit#plans' },
      { name: 'Weight Programs', path: '/fit?type=weight' },
      { name: 'Exercise', path: '/fit?type=exercise' },
    ]
  },
  {
    id: 'learn',
    name: 'Learn',
    icon: '🎓',
    path: '/learn',
    dropdown: [
      { name: 'Learn By Concierge®', path: '/learn', highlight: true },
      { name: 'Training Classes', path: '/learn' },
      { name: 'Puppy School', path: '/learn?type=puppy' },
      { name: 'Behaviour', path: '/learn?type=behaviour' },
    ]
  },
  {
    id: 'paperwork',
    name: 'Paperwork',
    icon: '📄',
    path: '/paperwork',
    dropdown: [
      { name: 'Pet Passport', path: '/paperwork?type=passport' },
      { name: 'Health Records', path: '/paperwork?type=records' },
      { name: 'Registration', path: '/paperwork?type=registration' },
    ]
  },
  {
    id: 'advisory',
    name: 'Advisory',
    icon: '📋',
    path: '/advisory',
    dropdown: [
      { name: 'Expert Consult', path: '/advisory' },
      { name: 'Nutrition', path: '/advisory?type=nutrition' },
      { name: 'Behaviour', path: '/advisory?type=behaviour' },
    ]
  },
  {
    id: 'emergency',
    name: 'Emergency',
    icon: '🚨',
    path: '/emergency',
    dropdown: [
      { name: '24/7 Helpline', path: '/emergency' },
      { name: 'Emergency Vets', path: '/emergency?type=vet' },
      { name: 'First Aid', path: '/emergency?type=firstaid' },
    ]
  },
  {
    id: 'farewell',
    name: 'Farewell',
    icon: '🌈',
    path: '/farewell',
    dropdown: [
      { name: 'Memorial', path: '/farewell' },
      { name: 'Cremation', path: '/farewell?type=cremation' },
      { name: 'Grief Support', path: '/farewell?type=support' },
    ]
  },
  {
    id: 'adopt',
    name: 'Adopt',
    icon: '🐾',
    path: '/adopt',
    dropdown: [
      { name: 'Find a Pet', path: '/adopt' },
      { name: 'Foster', path: '/adopt?type=foster' },
      { name: 'Shelters', path: '/adopt?type=shelter' },
    ]
  },
  {
    id: 'shop',
    name: 'Shop',
    icon: '🛒',
    path: '/shop',
    dropdown: [
      { name: 'All Products', path: '/shop' },
      { name: 'Food & Treats', path: '/shop?category=food' },
      { name: 'Toys', path: '/shop?category=toys' },
      { name: 'Accessories', path: '/shop?category=accessories' },
    ]
  },
];

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [petSoulScore, setPetSoulScore] = useState(0);
  const [primaryPet, setPrimaryPet] = useState(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);
  const { getCartCount, setIsCartOpen } = useCart();
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch Pet Soul score
  useEffect(() => {
    const fetchPetSoulScore = async () => {
      if (!user || !token) return;
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const pets = data.pets || [];
          if (pets.length > 0) {
            setPrimaryPet(pets[0]);
            setPetSoulScore(Math.round(pets[0].overall_score || 0));
          }
        }
      } catch (error) {
        console.error('Failed to fetch pet soul score:', error);
      }
    };
    fetchPetSoulScore();
  }, [user, token]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search suggestions - Universal Search (Google of the site)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSearchSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/search/universal?q=${encodeURIComponent(searchQuery)}&limit=12`);
        if (res.ok) {
          const data = await res.json();
          
          // Combine all result types into unified suggestions
          const suggestions = [];
          
          // Add page matches first (highest priority for navigation queries)
          (data.pages || []).forEach(page => {
            suggestions.push({
              type: 'page',
              text: page.name,
              name: page.name,
              description: page.description,
              url: page.url,
              icon: page.icon,
              pilllarType: page.type
            });
          });
          
          // Add products
          (data.products || []).forEach(p => {
            suggestions.push({
              type: 'product',
              text: p.name || p.title,
              name: p.name || p.title,
              id: p.id,
              image: p.image || p.image_url || p.images?.[0],
              price: p.price || p.pricing?.base_price,
              url: p.url || `/product/${p.shopify_handle || p.handle || p.id}`,
              hasVariants: p.has_variants
            });
          });
          
          // Add events
          (data.events || []).forEach(e => {
            suggestions.push({
              type: 'event',
              text: e.name,
              name: e.name,
              description: `${e.venue_name || ''} • ${e.event_date ? new Date(e.event_date).toLocaleDateString() : ''}`,
              url: e.url,
              image: e.image,
              price: e.price
            });
          });
          
          // Add restaurants
          (data.restaurants || []).forEach(r => {
            suggestions.push({
              type: 'restaurant',
              text: r.name,
              name: r.name,
              description: `${r.cuisine || ''} • ${r.location || ''}`,
              url: r.url,
              image: r.image,
              rating: r.rating
            });
          });
          
          // Add adopt pets
          (data.adopt_pets || []).forEach(pet => {
            suggestions.push({
              type: 'adopt_pet',
              text: pet.name,
              name: pet.name,
              description: pet.description,
              url: pet.url,
              image: pet.image
            });
          });
          
          // Add FAQs
          (data.faqs || []).forEach(f => {
            suggestions.push({
              type: 'faq',
              text: f.name,
              name: f.name,
              description: f.description,
              url: f.url
            });
          });
          
          setSearchSuggestions(suggestions.slice(0, 10));
          setShowSearchSuggestions(suggestions.length > 0);
        }
      } catch (error) {
        console.error('Universal search error:', error);
        // Fallback to basic product search
        try {
          const fallbackRes = await fetch(`${API_URL}/api/search/typeahead?q=${encodeURIComponent(searchQuery)}&limit=8`);
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const products = data.products || [];
            const suggestions = products.map(p => ({
              type: 'product',
              text: p.name || p.title,
              name: p.name || p.title,
              id: p.id,
              image: p.image || p.image_url || p.images?.[0],
              price: p.price || p.pricing?.base_price,
              url: `/product/${p.shopify_handle || p.handle || p.id}`,
              hasVariants: p.has_variants || p.variants?.length > 1
            }));
            setSearchSuggestions(suggestions);
            setShowSearchSuggestions(suggestions.length > 0);
          }
        } catch (fallbackError) {
          console.error('Fallback search error:', fallbackError);
        }
      }
    };
    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchSuggestions(false);
    }
  };

  const openMiraAI = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  const handleMouseEnter = (pillarId) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setActiveDropdown(pillarId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Get dropdown position class
  const getDropdownPosition = (index) => {
    if (index <= 1) return 'left-0'; // First 2 items align left
    if (index >= PILLARS.length - 2) return 'right-0'; // Last 2 items align right
    return 'left-1/2 -translate-x-1/2'; // Middle items center
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-1.5 px-4 text-center text-xs font-medium">
        <span>✨ The World's First Pet Life Operating System — Your Pet Concierge® </span>
      </div>

      {/* Main Header Row */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0" data-testid="navbar-logo">
              <div className="h-9 w-9 bg-white rounded-lg p-1 flex items-center justify-center">
                <img src="/logo-new.png" alt="The Doggy Company" className="h-7 w-7 object-contain" />
              </div>
              {/* Mobile: Show abbreviated name */}
              <div className="block sm:hidden">
                <div className="text-sm font-bold leading-none">
                  <span className="text-teal-400">TDC</span>
                </div>
              </div>
              {/* Desktop: Show full name */}
              <div className="hidden sm:block">
                <div className="text-sm font-bold leading-none">
                  <span className="text-teal-400">the</span>
                  <span className="text-purple-400">doggy</span>
                  <span className="text-pink-400">company</span>
                </div>
                <div className="text-[10px] text-teal-400 tracking-wider">PET CONCIERGE®</div>
              </div>
            </Link>

            {/* Search Bar with Suggestions */}
            <div className="flex-1 max-w-xl relative" ref={searchRef}>
              <form onSubmit={handleSearch}>
                <div className="flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchSuggestions(true);
                    }}
                    onFocus={() => setShowSearchSuggestions(true)}
                    placeholder={primaryPet ? `Search for ${primaryPet.name}...` : "Search everything..."}
                    className="w-full px-4 py-2 text-sm text-gray-900 bg-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    data-testid="navbar-search-input"
                  />
                  <button 
                    type="submit"
                    className="px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-r-md transition-colors"
                    data-testid="navbar-search-btn"
                  >
                    <Search className="w-5 h-5 text-white" />
                  </button>
                </div>
              </form>

              {/* Search Suggestions Dropdown - Universal Search Results */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                  {searchSuggestions.map((suggestion, idx) => (
                    <Link
                      key={idx}
                      to={suggestion.url || `/search?q=${encodeURIComponent(suggestion.text || suggestion.name)}`}
                      onClick={() => {
                        setShowSearchSuggestions(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 border-b border-gray-100 last:border-0 group"
                    >
                      {/* Type Icon or Image */}
                      {suggestion.type === 'page' || suggestion.type === 'pillar' ? (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          suggestion.type === 'pillar' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {suggestion.icon === 'info' && <span className="text-lg">ℹ️</span>}
                          {suggestion.icon === 'plane' && <span className="text-lg">✈️</span>}
                          {suggestion.icon === 'utensils' && <span className="text-lg">🍽️</span>}
                          {suggestion.icon === 'home' && <span className="text-lg">🏨</span>}
                          {suggestion.icon === 'heart' && <span className="text-lg">❤️</span>}
                          {suggestion.icon === 'scissors' && <span className="text-lg">✂️</span>}
                          {suggestion.icon === 'award' && <span className="text-lg">🏆</span>}
                          {suggestion.icon === 'gamepad' && <span className="text-lg">🎮</span>}
                          {suggestion.icon === 'calendar' && <span className="text-lg">📅</span>}
                          {suggestion.icon === 'star' && <span className="text-lg">⭐</span>}
                          {suggestion.icon === 'cake' && <span className="text-lg">🎂</span>}
                          {suggestion.icon === 'bowl' && <span className="text-lg">🍲</span>}
                          {suggestion.icon === 'shopping' && <span className="text-lg">🛒</span>}
                          {suggestion.icon === 'shield' && <span className="text-lg">🛡️</span>}
                          {suggestion.icon === 'book' && <span className="text-lg">📚</span>}
                          {suggestion.icon === 'lightbulb' && <span className="text-lg">💡</span>}
                          {suggestion.icon === 'alert' && <span className="text-lg">🚨</span>}
                          {suggestion.icon === 'file' && <span className="text-lg">📄</span>}
                          {suggestion.icon === 'activity' && <span className="text-lg">🏃</span>}
                          {suggestion.icon === 'stethoscope' && <span className="text-lg">🩺</span>}
                          {suggestion.icon === 'user' && <span className="text-lg">👤</span>}
                          {suggestion.icon === 'users' && <span className="text-lg">👥</span>}
                          {suggestion.icon === 'paw' && <span className="text-lg">🐾</span>}
                          {suggestion.icon === 'package' && <span className="text-lg">📦</span>}
                          {suggestion.icon === 'help' && <span className="text-lg">❓</span>}
                          {suggestion.icon === 'phone' && <span className="text-lg">📞</span>}
                          {!suggestion.icon && <span className="text-lg">📄</span>}
                        </div>
                      ) : suggestion.image ? (
                        <img src={suggestion.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          suggestion.type === 'event' ? 'bg-orange-100 text-orange-600' :
                          suggestion.type === 'restaurant' ? 'bg-red-100 text-red-600' :
                          suggestion.type === 'adopt_pet' ? 'bg-pink-100 text-pink-600' :
                          suggestion.type === 'faq' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {suggestion.type === 'event' && <span className="text-lg">📅</span>}
                          {suggestion.type === 'restaurant' && <span className="text-lg">🍽️</span>}
                          {suggestion.type === 'adopt_pet' && <span className="text-lg">🐕</span>}
                          {suggestion.type === 'faq' && <span className="text-lg">❓</span>}
                          {suggestion.type === 'product' && <span className="text-lg">🛍️</span>}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.name || suggestion.text}
                        </div>
                        {suggestion.description && (
                          <div className="text-xs text-gray-500 truncate">{suggestion.description}</div>
                        )}
                        {suggestion.category && !suggestion.description && (
                          <div className="text-xs text-gray-500">{suggestion.category}</div>
                        )}
                      </div>
                      
                      {/* Type badge */}
                      <div className="flex items-center gap-2">
                        {suggestion.price && suggestion.type === 'product' && (
                          <span className="text-sm font-bold text-purple-600">₹{suggestion.price.toLocaleString()}</span>
                        )}
                        {suggestion.rating && (
                          <span className="text-xs text-yellow-600 flex items-center gap-0.5">
                            ⭐ {suggestion.rating}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          suggestion.type === 'page' ? 'bg-blue-100 text-blue-700' :
                          suggestion.type === 'pillar' ? 'bg-purple-100 text-purple-700' :
                          suggestion.type === 'event' ? 'bg-orange-100 text-orange-700' :
                          suggestion.type === 'restaurant' ? 'bg-red-100 text-red-700' :
                          suggestion.type === 'adopt_pet' ? 'bg-pink-100 text-pink-700' :
                          suggestion.type === 'faq' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {suggestion.type === 'page' ? 'Page' :
                           suggestion.type === 'pillar' ? 'Service' :
                           suggestion.type === 'event' ? 'Event' :
                           suggestion.type === 'restaurant' ? 'Dine' :
                           suggestion.type === 'adopt_pet' ? 'Adopt' :
                           suggestion.type === 'faq' ? 'FAQ' :
                           'Product'}
                        </span>
                      </div>
                    </Link>
                  ))}
                  
                  {/* "See all results" footer */}
                  <Link
                    to={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => {
                      setShowSearchSuggestions(false);
                      setSearchQuery('');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 text-purple-600 font-medium text-sm hover:bg-purple-50"
                  >
                    See all results for "{searchQuery}"
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </Link>
                </div>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              
              {/* Account */}
              <Link 
                to={user ? "/dashboard" : "/login"}
                className="hidden sm:flex flex-col items-start text-xs hover:bg-white/10 rounded p-1.5"
                data-testid="navbar-account"
              >
                <span className="text-gray-400 text-[10px]">
                  {user ? `Hello, ${user.name?.split(' ')[0] || 'Member'}` : 'Sign in'}
                </span>
                <span className="font-semibold flex items-center gap-1">
                  Account <ChevronDown className="w-3 h-3" />
                </span>
              </Link>

              {/* Pet Soul Score */}
              {user && primaryPet && (
                <Link 
                  to="/my-pets"
                  className="hidden lg:flex flex-col items-start text-xs hover:bg-white/10 rounded p-1.5"
                  data-testid="navbar-pet-soul"
                >
                  <span className="text-gray-400 text-[10px]">{primaryPet.name}</span>
                  <span className="font-semibold text-purple-400 flex items-center gap-1">
                    <PawPrint className="w-3 h-3" /> {petSoulScore}%
                  </span>
                </Link>
              )}

              {/* Ask Mira Button */}
              <button
                onClick={openMiraAI}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                data-testid="navbar-mira-btn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Mira
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1 hover:bg-white/10 rounded p-1.5"
                data-testid="navbar-cart-btn"
              >
                <ShoppingCart className="w-6 h-6" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
                <span className="hidden sm:inline text-xs font-semibold">Cart</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-1.5 hover:bg-white/10 rounded"
                data-testid="navbar-mobile-menu-btn"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Pillars Navigation Row - Clean text only */}
      <nav className="hidden lg:block bg-slate-800 text-white text-sm border-t border-slate-700" ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-2">
          <ul className="flex items-center">
            {PILLARS.map((pillar, index) => (
              <li 
                key={pillar.id} 
                className="relative"
                onMouseEnter={() => handleMouseEnter(pillar.id)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={pillar.path}
                  className={`flex items-center gap-1 px-3 py-2.5 transition-all font-medium hover:bg-slate-700 hover:text-pink-400 ${
                    isActive(pillar.path) ? 'bg-slate-700 text-pink-400' : ''
                  }`}
                  data-testid={`nav-${pillar.id}`}
                >
                  {pillar.name}
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Link>

                {/* Beautiful Dropdown Menu - Positioned to not get cut off */}
                {pillar.dropdown && activeDropdown === pillar.id && (
                  <div 
                    className={`absolute top-full ${getDropdownPosition(index)} w-52 bg-white text-gray-800 shadow-2xl rounded-lg py-2 z-50 border border-gray-100`}
                    style={{ minWidth: '200px' }}
                    onMouseEnter={() => handleMouseEnter(pillar.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Header */}
                    <div className="px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{pillar.icon}</span>
                        <span className="font-bold text-gray-900">{pillar.name}</span>
                      </div>
                    </div>
                    {/* Items */}
                    {pillar.dropdown.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className={`block px-4 py-2.5 text-sm transition-colors border-l-2 ${
                          item.highlight 
                            ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-semibold border-purple-500 hover:from-purple-100 hover:to-pink-100' 
                            : 'hover:bg-purple-50 text-gray-700 hover:text-purple-600 border-transparent hover:border-purple-500'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                    {/* View All Link */}
                    <div className="px-4 py-2 border-t border-gray-100 mt-1">
                      <Link
                        to={pillar.path}
                        onClick={() => setActiveDropdown(null)}
                        className="text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                      >
                        View All {pillar.name} →
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            
            {/* Mobile Account */}
            {user ? (
              <div className="space-y-2">
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
                  data-testid="mobile-dashboard-link"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{user.name || 'Member'}</div>
                    {primaryPet && (
                      <div className="text-xs text-purple-600">{primaryPet.name} • {petSoulScore}% Soul</div>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); navigate('/'); }}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  data-testid="mobile-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 py-2.5 text-center bg-slate-900 text-white rounded-lg font-medium"
                  data-testid="mobile-signin-btn"
                >
                  Sign In
                </Link>
                <Link
                  to="/membership"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 py-2.5 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
                  data-testid="mobile-join-btn"
                >
                  Join Now
                </Link>
              </div>
            )}

            {/* Ask Mira Button - Mobile */}
            <button
              onClick={() => { openMiraAI(); setIsMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Ask Mira
            </button>

            <div className="border-t border-gray-200 my-3"></div>

            {/* All Pillars - Mobile Grid */}
            <div className="grid grid-cols-2 gap-2">
              {PILLARS.map((pillar) => (
                <Link
                  key={pillar.id}
                  to={pillar.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    isActive(pillar.path) 
                      ? 'bg-purple-50 border-purple-200 text-purple-700' 
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{pillar.icon}</span>
                  <span className="font-medium text-sm">{pillar.name}</span>
                </Link>
              ))}
            </div>

            <div className="border-t border-gray-200 my-3"></div>

            {/* Quick Links - Mobile */}
            <Link
              to="/membership"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 p-3 text-purple-600 font-medium"
            >
              <PawPrint className="w-4 h-4" />
              Pet Life Pass
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

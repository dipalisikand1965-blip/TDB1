import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, ChevronDown, Sparkles, PawPrint } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

/**
 * Navbar with all 14 Pillars + Mira AI
 * Compact design to fit all pillars without scrolling
 */

// All 14 Pillars with icons, paths, and dropdown items
const PILLARS = [
  {
    id: 'celebrate',
    name: 'Celebrate',
    icon: '🎂',
    path: '/celebrate',
    dropdown: [
      { name: 'Birthday Cakes', path: '/cakes' },
      { name: 'Breed Cakes', path: '/celebrate/breed-cakes' },
      { name: 'Pupcakes', path: '/celebrate/pupcakes' },
      { name: 'Desi Treats', path: '/celebrate/desi' },
      { name: 'Gift Hampers', path: '/hampers' },
    ]
  },
  {
    id: 'dine',
    name: 'Dine',
    icon: '🍽️',
    path: '/dine',
    dropdown: [
      { name: 'Pet Restaurants', path: '/dine' },
      { name: 'Fresh Meals', path: '/dine?type=meals' },
      { name: 'Meal Plans', path: '/autoship' },
    ]
  },
  {
    id: 'stay',
    name: 'Stay',
    icon: '🏨',
    path: '/stay',
    dropdown: [
      { name: 'Pet Hotels', path: '/stay' },
      { name: 'Boarding', path: '/stay?type=boarding' },
      { name: 'Day Care', path: '/stay?type=daycare' },
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    path: '/travel',
    dropdown: [
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
      { name: 'Fitness Plans', path: '/fit' },
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
  const dropdownRef = useRef(null);
  const dropdownTimeoutRef = useRef(null);
  const { getCartCount, setIsCartOpen } = useCart();
  const { user, token } = useAuth();
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
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
    }, 200);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-1.5 px-4 text-center text-xs font-medium">
        <span className="hidden sm:inline">🐾 Free Delivery on orders over ₹999 | </span>
        <span>Pet Life Operating System — Where every pet is remembered</span>
      </div>

      {/* Main Header Row */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-3">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0" data-testid="navbar-logo">
              <div className="h-9 w-9 bg-white rounded-lg p-1 flex items-center justify-center">
                <img src="/logo-new.png" alt="The Doggy Company" className="h-7 w-7 object-contain" />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-bold leading-none">
                  <span className="text-teal-400">the</span>
                  <span className="text-purple-400">doggy</span>
                  <span className="text-pink-400">company</span>
                </div>
                <div className="text-[10px] text-teal-400 tracking-wider">PET CONCIERGE®</div>
              </div>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cakes, treats, services..."
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

      {/* Pillars Navigation Row - Desktop - Compact to fit all 14 */}
      <nav className="hidden lg:block bg-slate-800 text-white text-xs border-t border-slate-700" ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-2">
          <ul className="flex items-center justify-between">
            {PILLARS.map((pillar) => (
              <li 
                key={pillar.id} 
                className="relative flex-1"
                onMouseEnter={() => handleMouseEnter(pillar.id)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={pillar.path}
                  className={`flex items-center justify-center gap-1 px-1 py-2.5 transition-all hover:bg-slate-700 ${
                    isActive(pillar.path) ? 'bg-slate-700 border-b-2 border-pink-500' : ''
                  }`}
                  data-testid={`nav-${pillar.id}`}
                >
                  <span className="text-base">{pillar.icon}</span>
                  <span className="font-medium hidden xl:inline">{pillar.name}</span>
                </Link>

                {/* Beautiful Dropdown Menu */}
                {pillar.dropdown && activeDropdown === pillar.id && (
                  <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white text-gray-800 shadow-2xl rounded-lg py-2 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200"
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
                    {pillar.dropdown.map((item, idx) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className="block px-4 py-2.5 hover:bg-purple-50 text-sm text-gray-700 hover:text-purple-600 transition-colors border-l-2 border-transparent hover:border-purple-500"
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
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg"
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
            ) : (
              <div className="flex gap-2 mb-4">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 py-2.5 text-center bg-slate-900 text-white rounded-lg font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/membership"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 py-2.5 text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
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

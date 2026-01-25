import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, ChevronDown, Sparkles, PawPrint } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

/**
 * Navbar with all 14 Pillars + Mira AI
 * Amazon/Chewy-style with beautiful mega dropdowns
 */

// All 14 Pillars with icons, paths, and dropdown items
const PILLARS = [
  {
    id: 'celebrate',
    name: 'Celebrate',
    icon: '🎂',
    path: '/celebrate',
    color: 'hover:text-pink-500',
    dropdown: [
      { name: 'Birthday Cakes', path: '/cakes' },
      { name: 'Breed Cakes', path: '/celebrate/breed-cakes' },
      { name: 'Treats & Biscuits', path: '/treats' },
      { name: 'Gift Hampers', path: '/hampers' },
      { name: 'Custom Cake', path: '/custom-cake' },
    ]
  },
  {
    id: 'dine',
    name: 'Dine',
    icon: '🍽️',
    path: '/dine',
    color: 'hover:text-orange-500',
    dropdown: [
      { name: 'Fresh Meals', path: '/dine?type=meals' },
      { name: 'Pet Restaurants', path: '/dine?type=restaurants' },
      { name: 'Meal Subscriptions', path: '/autoship' },
    ]
  },
  {
    id: 'stay',
    name: 'Stay',
    icon: '🏨',
    path: '/stay',
    color: 'hover:text-blue-500',
    dropdown: [
      { name: 'Pet Hotels', path: '/stay' },
      { name: 'Pet Boarding', path: '/stay?type=boarding' },
      { name: 'Day Care', path: '/stay?type=daycare' },
    ]
  },
  {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    path: '/travel',
    color: 'hover:text-sky-500',
    dropdown: [
      { name: 'Pet Taxi', path: '/travel?type=taxi' },
      { name: 'Airlines', path: '/travel?type=airline' },
      { name: 'Travel Planning', path: '/travel' },
    ]
  },
  {
    id: 'care',
    name: 'Care',
    icon: '💊',
    path: '/care',
    color: 'hover:text-red-500',
    dropdown: [
      { name: 'Vet Consultations', path: '/care?type=vet' },
      { name: 'Grooming', path: '/care?type=grooming' },
      { name: 'Pet Sitting', path: '/care?type=sitting' },
      { name: 'Dog Walking', path: '/care?type=walking' },
    ]
  },
  {
    id: 'enjoy',
    name: 'Enjoy',
    icon: '🎾',
    path: '/enjoy',
    color: 'hover:text-green-500',
    dropdown: [
      { name: 'Events', path: '/enjoy?type=event' },
      { name: 'Pet Parks', path: '/enjoy?type=park' },
      { name: 'Meetups', path: '/enjoy?type=meetup' },
    ]
  },
  {
    id: 'fit',
    name: 'Fit',
    icon: '🏃',
    path: '/fit',
    color: 'hover:text-emerald-500',
    dropdown: [
      { name: 'Fitness Plans', path: '/fit' },
      { name: 'Weight Management', path: '/fit?type=weight' },
      { name: 'Exercise Sessions', path: '/fit?type=exercise' },
    ]
  },
  {
    id: 'learn',
    name: 'Learn',
    icon: '🎓',
    path: '/learn',
    color: 'hover:text-indigo-500',
    dropdown: [
      { name: 'Training Classes', path: '/learn' },
      { name: 'Puppy School', path: '/learn?type=puppy' },
      { name: 'Behaviour Training', path: '/learn?type=behaviour' },
    ]
  },
  {
    id: 'paperwork',
    name: 'Paperwork',
    icon: '📄',
    path: '/paperwork',
    color: 'hover:text-slate-500',
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
    color: 'hover:text-purple-500',
    dropdown: [
      { name: 'Expert Consultation', path: '/advisory' },
      { name: 'Nutrition Advice', path: '/advisory?type=nutrition' },
      { name: 'Behaviour Consult', path: '/advisory?type=behaviour' },
    ]
  },
  {
    id: 'emergency',
    name: 'Emergency',
    icon: '🚨',
    path: '/emergency',
    color: 'hover:text-red-600',
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
    color: 'hover:text-violet-500',
    dropdown: [
      { name: 'Memorial Services', path: '/farewell' },
      { name: 'Cremation', path: '/farewell?type=cremation' },
      { name: 'Grief Support', path: '/farewell?type=support' },
    ]
  },
  {
    id: 'adopt',
    name: 'Adopt',
    icon: '🐾',
    path: '/adopt',
    color: 'hover:text-amber-500',
    dropdown: [
      { name: 'Find a Pet', path: '/adopt' },
      { name: 'Foster', path: '/adopt?type=foster' },
      { name: 'Shelter Support', path: '/adopt?type=shelter' },
    ]
  },
  {
    id: 'shop',
    name: 'Shop',
    icon: '🛒',
    path: '/shop',
    color: 'hover:text-teal-500',
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
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
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
          <div className="flex items-center h-14 gap-4">
            
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
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Account */}
              <Link 
                to={user ? "/dashboard" : "/login"}
                className="hidden sm:flex flex-col items-start text-xs hover:bg-white/10 rounded p-1.5"
                data-testid="navbar-account"
              >
                <span className="text-gray-400 text-[10px]">
                  {user ? `Hello, ${user.name?.split(' ')[0] || 'Member'}` : 'Hello, Sign in'}
                </span>
                <span className="font-semibold flex items-center gap-1">
                  Account <ChevronDown className="w-3 h-3" />
                </span>
              </Link>

              {/* Pet Soul Score */}
              {user && primaryPet && (
                <Link 
                  to="/my-pets"
                  className="hidden md:flex flex-col items-start text-xs hover:bg-white/10 rounded p-1.5"
                  data-testid="navbar-pet-soul"
                >
                  <span className="text-gray-400 text-[10px]">{primaryPet.name}</span>
                  <span className="font-semibold text-purple-400 flex items-center gap-1">
                    <PawPrint className="w-3 h-3" /> {petSoulScore}%
                  </span>
                </Link>
              )}

              {/* Mira AI Button */}
              <button
                onClick={openMiraAI}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                data-testid="navbar-mira-btn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mira AI
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

      {/* Pillars Navigation Row - Desktop */}
      <nav className="hidden lg:block bg-slate-800 text-white text-sm border-t border-slate-700" ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center">
            {PILLARS.map((pillar) => (
              <li 
                key={pillar.id} 
                className="relative"
                onMouseEnter={() => handleMouseEnter(pillar.id)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={pillar.path}
                  className={`flex items-center gap-1.5 px-3 py-2.5 transition-colors ${pillar.color} ${
                    isActive(pillar.path) ? 'bg-slate-700' : 'hover:bg-slate-700'
                  }`}
                  data-testid={`nav-${pillar.id}`}
                >
                  <span>{pillar.icon}</span>
                  <span className="font-medium">{pillar.name}</span>
                  {pillar.dropdown && <ChevronDown className="w-3 h-3 opacity-50" />}
                </Link>

                {/* Dropdown Menu */}
                {pillar.dropdown && activeDropdown === pillar.id && (
                  <div 
                    className="absolute top-full left-0 w-56 bg-white text-gray-800 shadow-xl rounded-b-lg py-2 z-50 border border-gray-100"
                    onMouseEnter={() => handleMouseEnter(pillar.id)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="px-3 py-2 border-b border-gray-100">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{pillar.name}</span>
                    </div>
                    {pillar.dropdown.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className="block px-4 py-2.5 hover:bg-gray-50 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}

            {/* Mira AI in Nav */}
            <li className="ml-auto">
              <button
                onClick={openMiraAI}
                className="flex items-center gap-1.5 px-4 py-2.5 text-pink-400 hover:text-pink-300 font-medium transition-colors"
                data-testid="nav-mira"
              >
                <Sparkles className="w-4 h-4" />
                Ask Mira
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            
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

            {/* Mira AI Button - Mobile */}
            <button
              onClick={() => { openMiraAI(); setIsMenuOpen(false); }}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium"
            >
              <Sparkles className="w-4 h-4" />
              Ask Mira AI
            </button>

            <div className="border-t border-gray-200 my-3"></div>

            {/* All Pillars - Mobile */}
            <div className="grid grid-cols-2 gap-2">
              {PILLARS.map((pillar) => (
                <Link
                  key={pillar.id}
                  to={pillar.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    isActive(pillar.path) ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
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

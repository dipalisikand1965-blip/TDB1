import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, ChevronDown, Sparkles, MapPin, PawPrint } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';

/**
 * Clean Amazon/Chewy-style Navbar
 * 
 * Structure:
 * - Row 1: Logo | Search | Account/Cart
 * - Row 2: Category Navigation
 */
const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [petSoulScore, setPetSoulScore] = useState(0);
  const [primaryPet, setPrimaryPet] = useState(null);
  const dropdownRef = useRef(null);
  const { getCartCount, setIsCartOpen } = useCart();
  const { user, token } = useAuth();
  const location = useLocation();

  // Fetch Pet Soul score when user is logged in
  useEffect(() => {
    const fetchPetSoulScore = async () => {
      if (!user || !token) {
        setPetSoulScore(0);
        setPrimaryPet(null);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const pets = data.pets || [];
          if (pets.length > 0) {
            setPrimaryPet(pets[0]);
            const primaryScore = pets[0].overall_score || 0;
            setPetSoulScore(Math.round(primaryScore));
          } else {
            setPetSoulScore(0);
            setPrimaryPet(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch pet soul score:', error);
      }
    };
    fetchPetSoulScore();
    
    const handleScoreUpdate = (e) => {
      if (e.detail?.score !== undefined) {
        setPetSoulScore(Math.round(e.detail.score));
      }
      if (e.detail?.pet) {
        setPrimaryPet(e.detail.pet);
      }
      fetchPetSoulScore();
    };
    
    window.addEventListener('petSoulScoreUpdated', handleScoreUpdate);
    return () => window.removeEventListener('petSoulScoreUpdated', handleScoreUpdate);
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

  // Navigation categories - simplified like Amazon/Chewy
  const categories = [
    { 
      id: 'celebrate',
      name: 'Celebrate',
      path: '/celebrate',
      dropdown: [
        { name: 'Birthday Cakes', path: '/cakes' },
        { name: 'Custom Cakes', path: '/custom-cake' },
        { name: 'Treats & Biscuits', path: '/treats' },
        { name: 'Gift Hampers', path: '/hampers' },
      ]
    },
    { 
      id: 'shop',
      name: 'Shop',
      path: '/shop',
      dropdown: [
        { name: 'Food & Treats', path: '/shop?category=food' },
        { name: 'Toys & Play', path: '/shop?category=toys' },
        { name: 'Grooming', path: '/shop?category=grooming' },
        { name: 'Health & Wellness', path: '/shop?category=health' },
      ]
    },
    { 
      id: 'services',
      name: 'Services',
      path: '/care',
      dropdown: [
        { name: 'Grooming', path: '/care?type=grooming' },
        { name: 'Training', path: '/learn' },
        { name: 'Vet Care', path: '/care?type=vet' },
        { name: 'Advisory', path: '/advisory' },
      ]
    },
    { 
      id: 'travel',
      name: 'Travel & Stay',
      path: '/travel',
      dropdown: [
        { name: 'Pet Hotels', path: '/stay' },
        { name: 'Pet Taxi', path: '/travel?type=taxi' },
        { name: 'Airlines', path: '/travel?type=airline' },
        { name: 'Paperwork', path: '/paperwork' },
      ]
    },
    { 
      id: 'community',
      name: 'Community',
      path: '/enjoy',
      dropdown: [
        { name: 'Events', path: '/enjoy?type=event' },
        { name: 'Meetups', path: '/enjoy?type=meetup' },
        { name: 'Adopt', path: '/adopt' },
        { name: 'Emergency', path: '/emergency' },
      ]
    },
    { 
      id: 'mira',
      name: 'Ask Mira',
      path: '#',
      isMira: true
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const openMiraAI = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 to-purple-600 text-white py-1.5 px-4 text-center text-xs font-medium">
        <span className="hidden sm:inline">🐾 Free Delivery on orders over ₹999 | </span>
        <span>Pet Life Operating System — Where every pet is remembered</span>
      </div>

      {/* Main Header Row */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14 gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0" data-testid="navbar-logo">
              <img src="/logo-new.png" alt="The Doggy Company" className="h-8 w-8" />
              <div className="hidden sm:block">
                <div className="text-sm font-bold leading-none">
                  <span className="text-teal-400">the</span>
                  <span className="text-purple-400">doggy</span>
                  <span className="text-pink-400">company</span>
                </div>
                <div className="text-[10px] text-teal-400 tracking-wider">PET CONCIERGE®</div>
              </div>
            </Link>

            {/* Deliver To (like Amazon) - Desktop only */}
            <div className="hidden lg:flex items-center gap-1 text-xs cursor-pointer hover:outline hover:outline-1 hover:outline-white rounded p-1">
              <MapPin className="w-4 h-4 text-white" />
              <div>
                <div className="text-gray-400 text-[10px]">Deliver to</div>
                <div className="font-semibold text-white">India</div>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
              <div className="flex">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for cakes, treats, services..."
                  className="w-full px-4 py-2 text-sm text-gray-900 bg-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  data-testid="navbar-search-input"
                />
                <button 
                  type="submit"
                  className="px-4 bg-teal-500 hover:bg-teal-600 rounded-r-md transition-colors"
                  data-testid="navbar-search-btn"
                >
                  <Search className="w-5 h-5 text-slate-900" />
                </button>
              </div>
            </form>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              
              {/* Account */}
              <Link 
                to={user ? "/dashboard" : "/login"}
                className="hidden sm:flex flex-col items-start text-xs hover:outline hover:outline-1 hover:outline-white rounded p-1"
                data-testid="navbar-account"
              >
                <span className="text-gray-400 text-[10px]">
                  {user ? `Hello, ${user.name?.split(' ')[0] || 'Member'}` : 'Hello, Sign in'}
                </span>
                <span className="font-semibold flex items-center gap-1">
                  Account <ChevronDown className="w-3 h-3" />
                </span>
              </Link>

              {/* Pet Soul Score - Only for logged in users */}
              {user && primaryPet && (
                <Link 
                  to="/my-pets"
                  className="hidden md:flex flex-col items-start text-xs hover:outline hover:outline-1 hover:outline-white rounded p-1"
                  data-testid="navbar-pet-soul"
                >
                  <span className="text-gray-400 text-[10px]">{primaryPet.name}</span>
                  <span className="font-semibold text-teal-400 flex items-center gap-1">
                    <PawPrint className="w-3 h-3" /> {petSoulScore}% Soul
                  </span>
                </Link>
              )}

              {/* Mira AI Button */}
              <button
                onClick={openMiraAI}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-xs font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
                data-testid="navbar-mira-btn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Mira
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white rounded p-1"
                data-testid="navbar-cart-btn"
              >
                <ShoppingCart className="w-6 h-6" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal-500 text-slate-900 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
                <span className="hidden sm:inline text-xs font-semibold">Cart</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-1 hover:outline hover:outline-1 hover:outline-white rounded"
                data-testid="navbar-mobile-menu-btn"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Row - Desktop */}
      <nav className="hidden lg:block bg-slate-800 text-white text-sm" ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center gap-0">
            {categories.map((cat) => (
              <li 
                key={cat.id} 
                className="relative"
                onMouseEnter={() => cat.dropdown && setActiveDropdown(cat.id)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                {cat.isMira ? (
                  <button
                    onClick={openMiraAI}
                    className="flex items-center gap-1 px-4 py-2.5 hover:bg-slate-700 transition-colors font-medium text-pink-400"
                    data-testid={`nav-${cat.id}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    {cat.name}
                  </button>
                ) : (
                  <Link
                    to={cat.path}
                    className={`flex items-center gap-1 px-4 py-2.5 hover:bg-slate-700 transition-colors ${
                      isActive(cat.path) ? 'bg-slate-700 border-b-2 border-teal-400' : ''
                    }`}
                    data-testid={`nav-${cat.id}`}
                  >
                    {cat.name}
                    {cat.dropdown && <ChevronDown className="w-3 h-3" />}
                  </Link>
                )}

                {/* Dropdown */}
                {cat.dropdown && activeDropdown === cat.id && (
                  <div className="absolute top-full left-0 w-48 bg-white text-gray-800 shadow-lg rounded-b-md py-2 z-50">
                    {cat.dropdown.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setActiveDropdown(null)}
                        className="block px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}

            {/* Quick Links */}
            <li className="ml-auto">
              <Link
                to="/membership"
                className="px-4 py-2.5 text-teal-400 hover:text-teal-300 font-medium"
                data-testid="nav-membership"
              >
                Pet Life Pass
              </Link>
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
                className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{user.name || 'Member'}</div>
                  {primaryPet && (
                    <div className="text-xs text-teal-600">{primaryPet.name} • {petSoulScore}% Soul</div>
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
                  className="flex-1 py-2.5 text-center bg-gradient-to-r from-teal-500 to-purple-500 text-white rounded-lg font-medium"
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

            {/* Mobile Categories */}
            {categories.filter(c => !c.isMira).map((cat) => (
              <div key={cat.id}>
                <Link
                  to={cat.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isActive(cat.path) ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{cat.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400 -rotate-90" />
                </Link>
              </div>
            ))}

            <div className="border-t border-gray-200 my-3"></div>

            {/* Quick Links - Mobile */}
            <Link
              to="/membership"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 p-3 text-teal-600 font-medium"
            >
              <PawPrint className="w-4 h-4" />
              Pet Life Pass
            </Link>
            <Link
              to="/emergency"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 p-3 text-red-600 font-medium"
            >
              🚨 Emergency
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;

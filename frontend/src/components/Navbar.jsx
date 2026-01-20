import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, Heart, ChevronDown, Sparkles, Cake, UtensilsCrossed, Home, Plane, HeartPulse, Clock, Activity, Brain } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import { API_URL } from '../utils/api';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePillar, setActivePillar] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [navbarCollections, setNavbarCollections] = useState([]);
  const pillarRef = useRef(null);
  const { getCartCount, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const location = useLocation();

  // Fetch collections that should appear in navbar
  useEffect(() => {
    const fetchNavbarCollections = async () => {
      try {
        const res = await fetch(`${API_URL}/api/campaign/collections/navbar`);
        if (res.ok) {
          const data = await res.json();
          setNavbarCollections(data.collections || []);
        }
      } catch (error) {
        console.error('Failed to fetch navbar collections:', error);
      }
    };
    fetchNavbarCollections();
  }, []);

  // Life Pillars - The core navigation
  const pillars = [
    { 
      id: 'celebrate',
      name: 'Celebrate', 
      icon: Cake,
      color: 'from-pink-500 to-purple-600',
      description: 'Cakes, treats & party essentials',
      path: '/celebrate',
      isActive: true,
      subItems: [
        { name: '🎂 Birthday Cakes', path: '/cakes' },
        { name: '✨ Build Your Cake', path: '/custom-cake', highlight: true },
        { name: '🐕 Breed Cakes', path: '/breed-cakes' },
        { name: '🧁 Pupcakes & Dognuts', path: '/pupcakes-dognuts' },
        { name: '🎂 Bowto Cakes', path: '/mini-cakes' },
        { name: '🍪 Treats & Biscuits', path: '/treats' },
        { name: '🍪 Desi Treats', path: '/desi' },
        { name: '🎁 Gift Hampers', path: '/hampers' },
        { name: '📦 Pan India Delivery', path: '/pan-india' },
        { name: '🐱 Cat Treats', path: '/cat-treats' },
        { name: '🧸 Accessories', path: '/accessories' },
      ]
    },
    { 
      id: 'dine',
      name: 'Dine', 
      icon: UtensilsCrossed,
      color: 'from-orange-500 to-red-500',
      description: 'Fresh meals & nutrition',
      path: '/dine',
      isActive: true,
      subItems: [
        { name: '🥘 Fresh Meals', path: '/meals' },
        { name: '🥜 Nut Butters', path: '/nut-butters' },
        { name: '🍦 Frozen Treats', path: '/frozen' },
        { name: '🍽️ Pet-Friendly Restaurants', path: '/dine', highlight: true },
      ]
    },
    { 
      id: 'stay',
      name: 'Stay', 
      icon: Home,
      color: 'from-green-500 to-teal-500',
      description: 'Pet-friendly hotels & resorts',
      path: '/stay',
      isActive: true,
      subItems: [
        { name: '🏨 All Pet-Friendly Stays', path: '/stay' },
      ]
    },
    { 
      id: 'travel',
      name: 'Travel', 
      icon: Plane,
      color: 'from-blue-500 to-cyan-500',
      description: 'Pet travel concierge',
      path: '/travel',
      isActive: true,
      subItems: [
        { name: '🚗 Cab / Road Travel', path: '/travel?type=cab' },
        { name: '🚆 Train / Bus Travel', path: '/travel?type=train' },
        { name: '✈️ Flight (Domestic)', path: '/travel?type=flight' },
        { name: '🚚 Pet Relocation', path: '/travel?type=relocation' },
        { name: '📦 Shop Travel Kits', path: '/travel#travel-kits' },
      ]
    },
    { 
      id: 'care',
      name: 'Care', 
      icon: HeartPulse,
      color: 'from-red-500 to-pink-500',
      description: 'Pet wellbeing & care services',
      path: '/care',
      isActive: true,
      subItems: [
        { name: '✂️ Grooming', path: '/care?type=grooming' },
        { name: '🚶 Walks & Sitting', path: '/care?type=walks' },
        { name: '🎓 Training & Behaviour', path: '/care?type=training' },
        { name: '🏥 Vet Coordination', path: '/care?type=vet' },
        { name: '🐾 Shop Care Essentials', path: '/care#care-kits' },
      ]
    },
    { 
      id: 'enjoy',
      name: 'Enjoy', 
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500',
      description: 'Events, meetups & experiences',
      path: '/enjoy',
      isActive: true,
      subItems: [
        { name: '🎉 Events & Pop-ups', path: '/enjoy?type=event' },
        { name: '🥾 Trails & Walks', path: '/enjoy?type=trail' },
        { name: '🐕 Meetups & Playdates', path: '/enjoy?type=meetup' },
        { name: '☕ Pet Cafés', path: '/enjoy?type=cafe' },
        { name: '📚 Workshops', path: '/enjoy?type=workshop' },
        { name: '🎁 Shop Enjoy Essentials', path: '/enjoy#enjoy-kits' },
      ]
    },
    { 
      id: 'fit',
      name: 'Fit', 
      icon: Activity,
      color: 'from-teal-500 to-emerald-500',
      description: 'Fitness, weight & wellness',
      path: '/fit',
      isActive: true,
      subItems: [
        { name: '🏋️ Exercise Plans', path: '/fit?type=exercise_plan' },
        { name: '⚖️ Weight Management', path: '/fit?type=weight_management' },
        { name: '🥗 Nutrition Guidance', path: '/fit?type=nutrition' },
        { name: '🏃 Agility Training', path: '/fit?type=agility' },
        { name: '🧓 Senior Fitness', path: '/fit?type=senior_fitness' },
        { name: '🎯 Shop Fitness Gear', path: '/fit#fit-products' },
      ]
    },
    { 
      id: 'advisory',
      name: 'Advisory', 
      icon: Brain,
      color: 'from-violet-500 to-purple-500',
      description: 'Expert pet guidance',
      path: '/advisory',
      isActive: true,
      subItems: [
        { name: '🧠 Behaviour Consultations', path: '/advisory?type=behaviour' },
        { name: '🍎 Nutrition Planning', path: '/advisory?type=nutrition' },
        { name: '💜 Senior Pet Care', path: '/advisory?type=senior_care' },
        { name: '🏠 New Pet Guidance', path: '/advisory?type=new_pet' },
        { name: '🩺 Health Advisory', path: '/advisory?type=health' },
        { name: '🎓 Training Consultations', path: '/advisory?type=training' },
      ]
    },
  ];

  const isActive = (path) => location.pathname === path;
  const isPillarActive = (pillar) => {
    if (location.pathname === pillar.path) return true;
    return pillar.subItems?.some(item => location.pathname === item.path);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pillarRef.current && !pillarRef.current.contains(event.target)) {
        setActivePillar(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openMiraAI = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-2 px-4 text-center text-sm font-medium">
        🐾 Welcome to The Doggy Company — Your Pet's Life Operating System! 🚀
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-lg z-[60] animate-in slide-in-from-top-2">
          <div className="max-w-3xl mx-auto p-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchBar onClose={() => setIsSearchOpen(false)} isOverlay={true} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="https://thedoggybakery.com/cdn/shop/files/TDB_Logo_1.3.5-1.png?v=1718969706" 
                alt="The Doggy Company Logo"
                className="h-10 w-auto"
              />
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  The Doggy Company
                </span>
                <span className="block text-[10px] text-gray-500 -mt-1">Pet Life Operating System</span>
              </div>
            </Link>

            {/* Desktop Navigation - Life Pillars */}
            <div className="hidden lg:flex items-center space-x-0.5" ref={pillarRef}>
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                const hasDropdown = pillar.subItems && pillar.subItems.length > 0;
                
                return (
                  <div key={pillar.id} className="relative">
                    <button
                      onClick={() => {
                        if (hasDropdown) {
                          setActivePillar(activePillar === pillar.id ? null : pillar.id);
                        } else if (!pillar.isActive) {
                          // Coming soon pillars - do nothing or show toast
                        }
                      }}
                      onMouseEnter={() => hasDropdown && setActivePillar(pillar.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isPillarActive(pillar)
                          ? `bg-gradient-to-r ${pillar.color} text-white shadow-md`
                          : pillar.isActive
                            ? 'text-gray-700 hover:bg-gray-100'
                            : 'text-gray-400 hover:text-gray-500'
                      }`}
                      data-testid={`pillar-${pillar.id}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {pillar.name}
                      {!pillar.isActive && <Clock className="w-2.5 h-2.5 ml-0.5" />}
                      {hasDropdown && <ChevronDown className={`w-2.5 h-2.5 transition-transform ${activePillar === pillar.id ? 'rotate-180' : ''}`} />}
                    </button>

                    {/* Dropdown for active pillars */}
                    {activePillar === pillar.id && hasDropdown && (
                      <div 
                        className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50"
                        onMouseLeave={() => setActivePillar(null)}
                      >
                        <div className={`px-4 py-2 bg-gradient-to-r ${pillar.color} text-white rounded-t-lg mx-2 mb-2`}>
                          <div className="font-semibold">{pillar.name}</div>
                          <div className="text-xs opacity-90">{pillar.description}</div>
                        </div>
                        {pillar.subItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setActivePillar(null)}
                            className={`block px-4 py-2.5 text-sm transition-colors ${
                              isActive(item.path)
                                ? 'bg-purple-50 text-purple-600 font-medium'
                                : item.highlight
                                  ? 'text-orange-600 font-medium hover:bg-orange-50'
                                  : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Coming Soon tooltip for inactive pillars */}
                    {activePillar === pillar.id && !pillar.isActive && (
                      <div 
                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 text-white text-center rounded-lg py-3 px-4 z-50"
                        onMouseLeave={() => setActivePillar(null)}
                      >
                        <Clock className="w-5 h-5 mx-auto mb-1" />
                        <div className="font-semibold">Coming Soon!</div>
                        <div className="text-xs text-gray-300 mt-1">{pillar.description}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pet Soul & Mira */}
            <div className="hidden md:flex items-center gap-2">
              {/* Dynamic Campaign Collections from API */}
              {navbarCollections.map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.slug}`}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-white hover:opacity-90 transition-all shadow-sm flex items-center gap-1"
                  style={{ backgroundColor: collection.theme_color || '#EC4899' }}
                  data-testid={`nav-collection-${collection.slug}`}
                >
                  {collection.name}
                </Link>
              ))}

              {/* Pet Soul (public) / My Pets (logged in) */}
              <Link
                to={user ? "/my-pets" : "/pet-soul"}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all shadow-sm"
                data-testid="pet-soul-nav-btn"
              >
                {user ? "🐾 My Pets" : "🐾 Pet Soul"}
              </Link>

              <Link
                to="/voice-order"
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-sm flex items-center gap-1"
                data-testid="voice-order-nav-btn"
              >
                🎙️ Voice Order
              </Link>

              <button
                onClick={openMiraAI}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-1 shadow-md hover:shadow-lg"
                data-testid="navbar-mira-ai-btn"
              >
                <Sparkles className="w-3 h-3" />
                Mira
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex h-9 w-9"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                data-testid="search-button"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
                <Heart className="w-5 h-5" />
              </Button>
              <Link to={user ? "/dashboard" : "/login"}>
                <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
                  <User className="w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setIsCartOpen(true)}
                data-testid="cart-button"
              >
                <ShoppingCart className="w-5 h-5" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {getCartCount()}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white max-h-[80vh] overflow-y-auto">
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Pillars */}
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.id} className="space-y-1">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium ${
                      pillar.isActive 
                        ? `bg-gradient-to-r ${pillar.color} text-white`
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                      {pillar.name}
                      {!pillar.isActive && <span className="text-xs ml-auto">Coming Soon</span>}
                    </div>
                    {pillar.isActive && pillar.subItems && (
                      <div className="pl-4 space-y-1">
                        {pillar.subItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMenuOpen(false)}
                            className={`block px-3 py-2 rounded-lg text-sm ${
                              isActive(item.path)
                                ? 'bg-purple-100 text-purple-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {/* Pet Soul (public) / My Pets (logged in) */}
                <Link
                  to={user ? "/my-pets" : "/pet-soul"}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium"
                  data-testid="mobile-pet-soul-link"
                >
                  {user ? "🐾 My Pets" : "🐾 Pet Soul"}
                </Link>
                <Link
                  to="/voice-order"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium"
                  data-testid="mobile-voice-order-link"
                >
                  🎙️ Voice Order
                </Link>
                <button
                  onClick={() => { openMiraAI(); setIsMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium"
                >
                  <Sparkles className="w-5 h-5" />
                  Ask Mira AI
                </button>
                <Link
                  to="/membership"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-700 font-medium"
                >
                  ⭐ Membership
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => { setIsSearchOpen(true); setIsMenuOpen(false); }}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;

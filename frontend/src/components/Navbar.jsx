import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, Heart, ChevronDown, Sparkles, Cake, UtensilsCrossed, Home, Plane, HeartPulse, Clock, Activity, Brain, FileText, MoreHorizontal } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import { API_URL } from '../utils/api';
import Logo from './Logo';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePillar, setActivePillar] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMorePillars, setShowMorePillars] = useState(false);
  const [navbarCollections, setNavbarCollections] = useState([]);
  const pillarRef = useRef(null);
  const moreRef = useRef(null);
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
        { name: '🏨 Pet-Friendly Hotels', path: '/stay?type=hotel' },
        { name: '🏡 Home Boarding', path: '/stay?type=boarding' },
        { name: '🐕 Day Care', path: '/stay?type=daycare' },
      ]
    },
    { 
      id: 'travel',
      name: 'Travel', 
      icon: Plane,
      color: 'from-blue-500 to-indigo-500',
      description: 'Pet travel made easy',
      path: '/travel',
      isActive: true,
      subItems: [
        { name: '✈️ Airline Bookings', path: '/travel?type=airline' },
        { name: '🚗 Pet Taxi', path: '/travel?type=taxi' },
        { name: '📋 Travel Checklist', path: '/travel?type=checklist' },
      ]
    },
    { 
      id: 'care',
      name: 'Care', 
      icon: HeartPulse,
      color: 'from-red-500 to-pink-500',
      description: 'Vet & grooming services',
      path: '/care',
      isActive: true,
      subItems: [
        { name: '🏥 Vet Coordination', path: '/care?type=vet' },
        { name: '✂️ Grooming', path: '/care?type=grooming' },
        { name: '💊 Medication Reminders', path: '/care?type=medication' },
      ]
    },
    { 
      id: 'enjoy',
      name: 'Enjoy', 
      icon: Sparkles,
      color: 'from-amber-500 to-orange-500',
      description: 'Pet events & experiences',
      path: '/enjoy',
      isActive: true,
      subItems: [
        { name: '🎉 Pet Events', path: '/enjoy?type=event' },
        { name: '🐕 Meetups & Playdates', path: '/enjoy?type=meetup' },
        { name: '📸 Pet Photography', path: '/enjoy?type=photo' },
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
      ]
    },
    { 
      id: 'paperwork',
      name: 'Paperwork', 
      icon: FileText,
      color: 'from-blue-600 to-indigo-600',
      description: 'Document vault & records',
      path: '/paperwork',
      isActive: true,
      subItems: [
        { name: '🛡️ Identity Documents', path: '/paperwork?category=identity' },
        { name: '❤️ Medical Records', path: '/paperwork?category=medical' },
        { name: '✈️ Travel Documents', path: '/paperwork?category=travel' },
      ]
    },
    { 
      id: 'emergency',
      name: 'Emergency', 
      icon: Clock,
      color: 'from-red-600 to-rose-700',
      description: '24/7 emergency support',
      path: '/emergency',
      isActive: true,
      isUrgent: true,
      subItems: [
        { name: '🚨 Report Emergency', path: '/emergency', highlight: true },
        { name: '🔍 Lost Pet Alert', path: '/emergency?type=lost_pet' },
        { name: '🚑 Medical Emergency', path: '/emergency?type=medical_emergency' },
      ]
    },
  ];

  // Split pillars into visible and "more" sections
  const visiblePillars = pillars.slice(0, 6);
  const morePillars = pillars.slice(6);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pillarRef.current && !pillarRef.current.contains(event.target)) {
        setActivePillar(null);
      }
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setShowMorePillars(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isPillarActive = (pillar) => {
    if (isActive(pillar.path)) return true;
    return pillar.subItems?.some(item => location.pathname === item.path);
  };

  const openMiraAI = () => {
    window.dispatchEvent(new CustomEvent('openMiraAI'));
  };

  return (
    <>
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white py-1.5 px-4 text-center text-xs font-medium">
        🐾 Welcome to The Doggy Company — Your Pet's Life Operating System! 🚀
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed top-20 left-0 w-full bg-white border-b border-gray-200 shadow-lg z-[60] animate-in slide-in-from-top-2">
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img 
                src="https://thedoggybakery.com/cdn/shop/files/TDB_Logo_1.3.5-1.png?v=1718969706" 
                alt="The Doggy Company Logo"
                className="h-9 w-auto"
              />
              <div className="hidden sm:block">
                <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                  The Doggy Company
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Life Pillars */}
            <div className="hidden lg:flex items-center gap-1" ref={pillarRef}>
              {visiblePillars.map((pillar) => {
                const Icon = pillar.icon;
                const hasDropdown = pillar.subItems && pillar.subItems.length > 0;
                
                return (
                  <div key={pillar.id} className="relative">
                    <Link
                      to={pillar.path}
                      onMouseEnter={() => {
                        if (hasDropdown) setActivePillar(pillar.id);
                        setShowMorePillars(false); // Close More dropdown when hovering over other pillars
                      }}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isPillarActive(pillar)
                          ? `bg-gradient-to-r ${pillar.color} text-white`
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      data-testid={`pillar-${pillar.id}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{pillar.name}</span>
                      {hasDropdown && <ChevronDown className="w-3 h-3" />}
                    </Link>

                    {/* Dropdown */}
                    {activePillar === pillar.id && hasDropdown && (
                      <div 
                        className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-[100]"
                        onMouseLeave={() => setActivePillar(null)}
                      >
                        <div className={`px-3 py-2 bg-gradient-to-r ${pillar.color} text-white mx-1 mb-1 rounded-md`}>
                          <div className="text-sm font-semibold">{pillar.name}</div>
                          <div className="text-xs opacity-90">{pillar.description}</div>
                        </div>
                        {pillar.subItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setActivePillar(null)}
                            className={`block px-3 py-2 text-sm transition-colors ${
                              isActive(item.path)
                                ? 'bg-purple-50 text-purple-600'
                                : item.highlight
                                  ? 'text-orange-600 hover:bg-orange-50'
                                  : 'text-gray-700 hover:bg-gray-50'
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

              {/* More Pillars Dropdown */}
              {morePillars.length > 0 && (
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setShowMorePillars(!showMorePillars)}
                    onMouseEnter={() => {
                      setShowMorePillars(true);
                      setActivePillar(null); // Close other pillar dropdowns
                    }}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                      showMorePillars || morePillars.some(p => isPillarActive(p))
                        ? 'bg-gray-200 text-gray-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                    <span>More</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showMorePillars ? 'rotate-180' : ''}`} />
                  </button>

                  {showMorePillars && (
                    <div 
                      className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-[100]"
                      onMouseLeave={() => setShowMorePillars(false)}
                    >
                      {morePillars.map((pillar) => {
                        const Icon = pillar.icon;
                        return (
                          <Link
                            key={pillar.id}
                            to={pillar.path}
                            onClick={() => setShowMorePillars(false)}
                            className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                              isPillarActive(pillar)
                                ? 'bg-purple-50 text-purple-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-1.5 rounded-md bg-gradient-to-r ${pillar.color}`}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium">{pillar.name}</div>
                              <div className="text-xs text-gray-500">{pillar.description}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-1">
              {/* Pet Soul */}
              <Link
                to={user ? "/my-pets" : "/pet-soul"}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90"
                data-testid="pet-soul-nav-btn"
              >
                🐾 {user ? "My Pets" : "Pet Soul"}
              </Link>

              {/* Voice Order */}
              <Link
                to="/voice-order"
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90"
                data-testid="voice-order-nav-btn"
              >
                🎙️ Voice
              </Link>

              {/* Mira AI */}
              <button
                onClick={openMiraAI}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
                data-testid="navbar-mira-ai-btn"
              >
                <Sparkles className="w-3 h-3" />
                Mira
              </button>

              {/* Search */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                data-testid="search-button"
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* User */}
              <Link to={user ? "/dashboard" : "/login"}>
                <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8">
                  <User className="w-4 h-4" />
                </Button>
              </Link>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-8 w-8"
                onClick={() => setIsCartOpen(true)}
                data-testid="cart-button"
              >
                <ShoppingCart className="w-4 h-4" />
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {getCartCount()}
                  </span>
                )}
              </Button>

              {/* Mobile Menu */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-8 w-8"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200 py-4">
            <div className="px-4 space-y-2">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.id}>
                    <Link
                      to={pillar.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg ${
                        isPillarActive(pillar)
                          ? `bg-gradient-to-r ${pillar.color} text-white`
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{pillar.name}</span>
                    </Link>
                  </div>
                );
              })}
              
              <div className="border-t border-gray-200 my-3"></div>
              
              <Link
                to={user ? "/my-pets" : "/pet-soul"}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
              >
                🐾 {user ? "My Pets" : "Pet Soul"}
              </Link>
              
              <Link
                to="/voice-order"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                🎙️ Voice Order
              </Link>
              
              <button
                onClick={() => { openMiraAI(); setIsMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                <Sparkles className="w-4 h-4" />
                Ask Mira AI
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;

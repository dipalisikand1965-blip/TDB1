import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, Heart, ChevronDown, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const { getCartCount, setIsCartOpen } = useCart();
  const location = useLocation();

  // Main navigation items (visible in navbar) - condensed for cleaner look
  const mainNavigation = [
    { name: 'Cakes', path: '/cakes' },
    { name: 'Build Your Cake', path: '/custom-cake', highlight: true },
    { name: 'Treats', path: '/treats' },
    { name: 'Pan India', path: '/pan-india' },
  ];

  // More dropdown items
  const moreNavigation = [
    { name: '🎂 Bowto Cakes', path: '/mini-cakes' },
    { name: '🐕 Breed Cakes', path: '/breed-cakes' },
    { name: '🧁 Pupcakes & Dognuts', path: '/pupcakes-dognuts' },
    { name: '🎁 Gift Hampers', path: '/hampers' },
    { name: '🥘 Fresh Meals', path: '/meals' },
    { name: '🍦 Frozen Treats', path: '/frozen' },
    { name: '🥜 Nut Butters', path: '/nut-butters' },
    { name: '🍪 Desi Treats', path: '/desi' },
    { name: '🐱 Cat Treats', path: '/cat-treats' },
    { name: '🧸 Accessories & Toys', path: '/accessories' },
    { name: '👕 Merchandise', path: '/merchandise' },
    { name: '⭐ Membership', path: '/membership' },
  ];

  // All navigation for mobile
  const allNavigation = [...mainNavigation, ...moreNavigation];

  const isActive = (path) => location.pathname === path;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
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
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 text-center text-sm font-medium">
        🎉 Same Day Delivery in Mumbai, Bangalore & Gurugram! 🚚
      </div>

      {/* Main Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="https://thedoggybakery.com/cdn/shop/files/TDB_Logo_1.3.5-1.png?v=1718969706" 
                alt="The Doggy Bakery Logo"
                className="h-10 w-auto"
              />
              <span className="text-xl font-bold text-purple-600 hidden sm:block">
                The Doggy Bakery
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {mainNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-purple-600 text-white'
                      : item.highlight 
                        ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white hover:from-orange-500 hover:to-pink-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  data-testid={item.highlight ? 'build-cake-nav-btn' : undefined}
                >
                  {item.highlight && '🎂 '}{item.name}
                </Link>
              ))}

              {/* More Dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className={`flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    isMoreOpen ? 'bg-gray-100' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  More
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {moreNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMoreOpen(false)}
                        className={`block px-4 py-2.5 text-sm transition-colors ${
                          isActive(item.path)
                            ? 'bg-purple-50 text-purple-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pet Soul & Mira - Always visible on tablet+ */}
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/my-pets"
                className="px-3 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 transition-all shadow-sm"
                data-testid="pet-soul-nav-btn"
              >
                🐾 Pet Soul
              </Link>

              <button
                onClick={openMiraAI}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg"
                data-testid="navbar-mira-ai-btn"
              >
                <Sparkles className="w-4 h-4" />
                Mira
              </button>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
                <Heart className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9">
                <User className="w-5 h-5" />
              </Button>
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
          <div className="lg:hidden border-t border-gray-200 bg-white max-h-[70vh] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              {allNavigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-base font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mira AI Button in Mobile */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  openMiraAI();
                }}
                className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-base font-medium flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Chat with Mira AI
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;

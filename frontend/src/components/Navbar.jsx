import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User, Heart, ChevronDown, Sparkles, Cake, UtensilsCrossed, Home, Plane, HeartPulse, Clock, Activity, Brain, FileText, MoreHorizontal, GraduationCap, PawPrint, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import { API_URL } from '../utils/api';
import Logo from './Logo';
import PetSoulScore from './PetSoulScore';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePillar, setActivePillar] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showMorePillars, setShowMorePillars] = useState(false);
  const [navbarCollections, setNavbarCollections] = useState([]);
  const [petSoulScore, setPetSoulScore] = useState(0);
  const [primaryPet, setPrimaryPet] = useState(null);
  const pillarRef = useRef(null);
  const moreRef = useRef(null);
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
            // Store the primary (first) pet for display
            setPrimaryPet(pets[0]);
            
            // Use the overall_score from the API for consistency
            // This score is calculated on the backend based on doggy_soul_answers
            const primaryScore = pets[0].overall_score || 0;
            setPetSoulScore(Math.round(primaryScore));
          } else {
            setPetSoulScore(0);
            setPrimaryPet(null);
          }
        }
      } catch (error) {
        console.error('Failed to fetch pet soul score:', error);
        setPetSoulScore(0);
        setPrimaryPet(null);
      }
    };
    fetchPetSoulScore();
    
    // Listen for score updates from UnifiedPetPage
    const handleScoreUpdate = (e) => {
      if (e.detail?.score !== undefined) {
        setPetSoulScore(Math.round(e.detail.score));
      }
      if (e.detail?.pet) {
        setPrimaryPet(e.detail.pet);
      }
      // Also refetch to ensure we have the latest data
      fetchPetSoulScore();
    };
    
    window.addEventListener('petSoulScoreUpdated', handleScoreUpdate);
    return () => window.removeEventListener('petSoulScoreUpdated', handleScoreUpdate);
  }, [user, token]);

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
      id: 'learn',
      name: 'Learn', 
      icon: GraduationCap,
      color: 'from-blue-500 to-indigo-500',
      description: 'Training & Education',
      path: '/learn',
      isActive: true,
      subItems: [
        { name: '🎓 Basic Obedience', path: '/learn?type=basic_obedience' },
        { name: '🐕 Puppy Training', path: '/learn?type=puppy_training' },
        { name: '🧠 Behavior Modification', path: '/learn?type=behavior_modification' },
        { name: '🏆 Advanced Training', path: '/learn?type=advanced_training' },
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
    { 
      id: 'adopt',
      name: 'Adopt', 
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
      description: 'Find your forever friend',
      path: '/adopt',
      isActive: true,
      subItems: [
        { name: '🐕 Dogs for Adoption', path: '/adopt?species=dog' },
        { name: '🐱 Cats for Adoption', path: '/adopt?species=cat' },
        { name: '📋 Adoption Process', path: '/adopt?type=process' },
        { name: '❤️ Foster Program', path: '/adopt?type=foster' },
      ]
    },
    { 
      id: 'farewell',
      name: 'Farewell', 
      icon: Heart,
      color: 'from-purple-500 to-violet-600',
      description: 'Compassionate end-of-life care',
      path: '/farewell',
      isActive: true,
      subItems: [
        { name: '🕊️ Memorial Services', path: '/farewell?type=memorial' },
        { name: '🌸 Cremation Services', path: '/farewell?type=cremation' },
        { name: '💜 Grief Support', path: '/farewell?type=grief' },
        { name: '🌈 Rainbow Bridge', path: '/farewell?type=rainbow_bridge' },
      ]
    },
    { 
      id: 'shop',
      name: 'Shop', 
      icon: PawPrint,
      color: 'from-amber-500 to-orange-500',
      description: 'Everything for your pet',
      path: '/shop',
      isActive: true,
      subItems: [
        { name: '🦴 Food & Treats', path: '/shop?category=food' },
        { name: '🧸 Toys & Play', path: '/shop?category=toys' },
        { name: '🛁 Grooming', path: '/shop?category=grooming' },
        { name: '🏥 Health & Wellness', path: '/shop?category=health' },
        { name: '🎀 Accessories', path: '/shop?category=accessories' },
      ]
    },
  ];

  // Split pillars into visible and "more" sections
  const activePillars = pillars.filter(p => p.isActive !== false);
  const visiblePillars = activePillars.slice(0, 6);
  const morePillars = activePillars.slice(6);

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
        🐾 Welcome to The Doggy Company — Your Pet&apos;s Life Operating System! 🚀
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
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 overflow-x-hidden">
          <div className="flex items-center justify-between h-24">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <Logo size="xl" showText={true} className="hidden sm:flex" />
              <Logo size="md" showText={false} className="flex sm:hidden" />
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
              {/* Pet Soul / My Pets with Animated Score - Only show when logged in */}
              {user && (
                <PetSoulScore 
                  score={petSoulScore} 
                  isLoggedIn={true}
                  pet={primaryPet}
                  className="hidden md:flex"
                />
              )}

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

              {/* Auth Actions - Different for logged in vs logged out */}
              {user ? (
                /* Logged In: Show My Account */
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1.5 h-8 px-3 text-xs font-medium">
                    <User className="w-3.5 h-3.5" />
                    My Account
                  </Button>
                </Link>
              ) : (
                /* Logged Out: Show Sign in | Join now */
                <div className="hidden sm:flex items-center gap-1">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="h-8 px-3 text-xs font-medium text-gray-600 hover:text-gray-900">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/membership">
                    <Button size="sm" className="h-8 px-3 text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      Join now
                    </Button>
                  </Link>
                </div>
              )}

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
          <div className="lg:hidden bg-white border-t border-gray-200 py-4 w-full">
            <div className="px-4 space-y-2 max-w-full">
              {activePillars.map((pillar) => {
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
              
              {/* Auth Section for Mobile */}
              {user ? (
                <>
                  {/* Mobile Pet Soul Score - Only for logged in */}
                  <Link
                    to="/my-pets"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                  >
                    <span className="text-lg">🐾</span>
                    <span className="flex-1">My Pets</span>
                    <span className="bg-white/20 px-2.5 py-1 rounded-full text-sm font-bold">
                      {petSoulScore}%
                    </span>
                  </Link>
                  
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-100 text-gray-700"
                  >
                    <User className="w-4 h-4" />
                    My Account
                  </Link>
                </>
              ) : (
                <>
                  {/* Mobile Join/Sign In - For logged out */}
                  <Link
                    to="/membership"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium"
                  >
                    <PawPrint className="w-4 h-4" />
                    Join now
                  </Link>
                  
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-100 text-gray-700"
                  >
                    <User className="w-4 h-4" />
                    Sign in
                  </Link>
                </>
              )}
              
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

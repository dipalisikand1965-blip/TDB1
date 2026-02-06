/**
 * PillarPageLayout.jsx
 * 
 * A reusable layout component for all pillar pages.
 * Ensures consistent, personalized design across Celebrate, Dine, Care, Enjoy,
 * Travel, Stay, Fit, Learn, Advisory, Emergency, Paperwork, Farewell, Adopt.
 * 
 * Features:
 * - UnifiedHero with pet photo, soul score arc, Mira's message
 * - PillarNav with Product/Service toggle
 * - Pillar-specific theming and messaging
 * - Mobile-first responsive design
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Wrench, PawPrint } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import UnifiedHero from './UnifiedHero';
import PillarNav from './PillarNav';
import SEOHead from './SEOHead';
import MiraChatWidget from './MiraChatWidget';

// Pillar subcategories configuration
const PILLAR_SUBCATEGORIES = {
  celebrate: [
    { id: 'cakes', name: 'Birthday Cakes', path: '/celebrate/cakes', emoji: '🎂' },
    { id: 'breed-cakes', name: 'Breed Cakes', path: '/celebrate/breed-cakes', emoji: '❤️' },
    { id: 'pupcakes', name: 'Pupcakes & Dognuts', path: '/celebrate/pupcakes', emoji: '✨' },
    { id: 'treats', name: 'Treats', path: '/celebrate/treats', emoji: '🎁' },
    { id: 'hampers', name: 'Gift Hampers', path: '/celebrate/hampers', emoji: '🛍️' },
    { id: 'accessories', name: 'Party Accessories', path: '/celebrate/accessories', emoji: '🎉' }
  ],
  dine: [
    { id: 'fresh-meals', name: 'Fresh Meals', path: '/dine/fresh-meals', emoji: '🥩' },
    { id: 'treats', name: 'Treats', path: '/dine/treats', emoji: '🦴' },
    { id: 'desi-treats', name: 'Desi Treats', path: '/dine/desi-treats', emoji: '🍖' },
    { id: 'frozen', name: 'Frozen', path: '/dine/frozen', emoji: '🧊' },
    { id: 'supplements', name: 'Supplements', path: '/dine/supplements', emoji: '💊' }
  ],
  care: [
    { id: 'grooming', name: 'Grooming', path: '/care/grooming', emoji: '✨' },
    { id: 'health', name: 'Health', path: '/care/health', emoji: '❤️' },
    { id: 'supplements', name: 'Supplements', path: '/care/supplements', emoji: '💊' },
    { id: 'spa', name: 'Spa', path: '/care/spa', emoji: '🛁' }
  ],
  enjoy: [
    { id: 'toys', name: 'Toys', path: '/enjoy/toys', emoji: '🎾' },
    { id: 'chews', name: 'Chews', path: '/enjoy/chews', emoji: '🦴' },
    { id: 'games', name: 'Games', path: '/enjoy/games', emoji: '🎮' },
    { id: 'puzzles', name: 'Puzzles', path: '/enjoy/puzzles', emoji: '🧩' }
  ],
  travel: [
    { id: 'carriers', name: 'Carriers', path: '/travel/carriers', emoji: '🎒' },
    { id: 'car', name: 'Car Accessories', path: '/travel/car', emoji: '🚗' },
    { id: 'outdoor', name: 'Outdoor Gear', path: '/travel/outdoor', emoji: '⛺' }
  ],
  stay: [
    { id: 'beds', name: 'Beds', path: '/stay/beds', emoji: '🛏️' },
    { id: 'mats', name: 'Mats', path: '/stay/mats', emoji: '🧺' },
    { id: 'kennels', name: 'Kennels', path: '/stay/kennels', emoji: '🏠' },
    { id: 'bowls', name: 'Bowls', path: '/stay/bowls', emoji: '🥣' }
  ],
  fit: [
    { id: 'leashes', name: 'Leashes', path: '/fit/leashes', emoji: '🦮' },
    { id: 'harnesses', name: 'Harnesses', path: '/fit/harnesses', emoji: '🎽' },
    { id: 'collars', name: 'Collars', path: '/fit/collars', emoji: '📿' },
    { id: 'apparel', name: 'Apparel', path: '/fit/apparel', emoji: '👕' }
  ],
  learn: [
    { id: 'training', name: 'Training Aids', path: '/learn/training', emoji: '🎓' },
    { id: 'puzzles', name: 'Puzzles', path: '/learn/puzzles', emoji: '🧩' },
    { id: 'books', name: 'Books', path: '/learn/books', emoji: '📚' }
  ],
  advisory: [
    { id: 'nutrition', name: 'Nutrition', path: '/advisory/nutrition', emoji: '🥗' },
    { id: 'behavior', name: 'Behavior', path: '/advisory/behavior', emoji: '🧠' },
    { id: 'health', name: 'Health', path: '/advisory/health', emoji: '❤️' }
  ],
  emergency: [
    { id: 'first-aid', name: 'First Aid', path: '/emergency/first-aid', emoji: '🩹' },
    { id: 'hospitals', name: 'Hospitals', path: '/emergency/hospitals', emoji: '🏥' }
  ],
  paperwork: [
    { id: 'registration', name: 'Registration', path: '/paperwork/registration', emoji: '📋' },
    { id: 'insurance', name: 'Insurance', path: '/paperwork/insurance', emoji: '🛡️' }
  ],
  farewell: [
    { id: 'memorial', name: 'Memorial', path: '/farewell/memorial', emoji: '🌈' },
    { id: 'support', name: 'Support', path: '/farewell/support', emoji: '💕' }
  ],
  adopt: [
    { id: 'rescue', name: 'Rescue', path: '/adopt/rescue', emoji: '🏠' },
    { id: 'shelters', name: 'Shelters', path: '/adopt/shelters', emoji: '🐾' }
  ]
};

/**
 * PillarPageLayout - Wraps pillar-specific content with unified hero and navigation
 * 
 * @param {string} pillar - The pillar identifier (celebrate, dine, care, etc.)
 * @param {string} title - SEO title for the page
 * @param {string} description - SEO description
 * @param {React.ReactNode} children - The pillar-specific content (can be a render prop)
 * @param {string} defaultViewMode - 'products' or 'services' (default: 'products')
 * @param {boolean} showSubcategories - Whether to show subcategory pills (default: true)
 */
const PillarPageLayout = ({
  pillar,
  title,
  description,
  children,
  defaultViewMode = 'products',
  showSubcategories = true
}) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // Pet state
  const [activePet, setActivePet] = useState(null);
  const [userPets, setUserPets] = useState([]);
  const [petSoulData, setPetSoulData] = useState(null);
  
  // Navigation state
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [shoppingForOther, setShoppingForOther] = useState(false);
  
  // Fetch user's pets
  useEffect(() => {
    const fetchPets = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || [];
          setUserPets(pets);
          if (pets.length > 0) {
            setActivePet(pets[0]);
          }
        }
      } catch (err) {
        console.debug('Failed to fetch pets:', err);
      }
    };
    fetchPets();
  }, [token]);
  
  // Fetch soul data when pet changes
  useEffect(() => {
    const fetchSoulData = async () => {
      if (!activePet?.id || !token) return;
      try {
        const response = await fetch(`${API_URL}/api/soul-drip/completeness/${activePet.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setPetSoulData(data);
        }
      } catch (err) {
        console.debug('Failed to fetch soul data:', err);
      }
    };
    fetchSoulData();
  }, [activePet?.id, token]);
  
  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    // Navigate to appropriate page
    if (mode === 'products') {
      navigate('/shop');
    } else {
      navigate('/services');
    }
  };
  
  // Handle search change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };
  
  // Get subcategories for current pillar
  const subcategories = PILLAR_SUBCATEGORIES[pillar] || [];
  
  // Get pillar-specific gradient for bottom section
  const PILLAR_BG = {
    celebrate: 'from-pink-50',
    dine: 'from-amber-50',
    care: 'from-purple-50',
    enjoy: 'from-blue-50',
    travel: 'from-sky-50',
    stay: 'from-green-50',
    fit: 'from-red-50',
    learn: 'from-emerald-50',
    advisory: 'from-indigo-50',
    emergency: 'from-rose-50',
    paperwork: 'from-slate-50',
    farewell: 'from-violet-50',
    adopt: 'from-orange-50'
  };
  
  const bgGradient = PILLAR_BG[pillar] || 'from-gray-50';
  
  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgGradient} to-white pb-20 md:pb-0`} data-testid={`${pillar}-page`}>
      {/* SEO */}
      <SEOHead 
        title={title}
        description={description}
        path={`/${pillar}`}
      />
      
      {/* Unified Hero - Pet is the HERO! */}
      <UnifiedHero
        pet={activePet}
        soulData={petSoulData}
        pillar={pillar}
        viewMode={viewMode}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        shoppingForOther={shoppingForOther}
      />
      
      {/* Navigation Bar - Subcategories Only (Removed clinical Products/Services toggle) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 overflow-hidden">
        <div className="max-w-6xl mx-auto overflow-hidden">
          {/* Subcategories Row - Now the primary navigation */}
          {showSubcategories && subcategories.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3">
              {/* Subcategory Pills - Scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 pr-4">
                <button
                  onClick={() => setSelectedSubcategory(null)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all ${
                    !selectedSubcategory
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid="all-subcategories"
                >
                  <span>✨</span>
                  <span>All {pillar.charAt(0).toUpperCase() + pillar.slice(1)}</span>
                </button>
                {subcategories.map((subcat) => (
                  <Link
                    key={subcat.id}
                    to={subcat.path}
                    onClick={() => setSelectedSubcategory(subcat.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium text-sm transition-all ${
                      selectedSubcategory === subcat.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                    data-testid={`subcat-${subcat.id}`}
                  >
                    <span>{subcat.emoji}</span>
                    <span className="whitespace-nowrap">{subcat.name}</span>
                  </Link>
                ))}
              </div>
              
              {/* Shopping for other dog link - Right aligned */}
              <button 
                onClick={() => setShoppingForOther(!shoppingForOther)}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-gray-600 transition-all ml-2"
                data-testid="shopping-for-other"
              >
                <PawPrint className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shopping for another dog?</span>
                <span className="sm:hidden">🐕</span>
              </button>
            </div>
          )}
          
          {/* If no subcategories, just show the "shopping for other" link */}
          {(!showSubcategories || subcategories.length === 0) && (
            <div className="flex items-center justify-end px-4 py-3">
              <button 
                onClick={() => setShoppingForOther(!shoppingForOther)}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-gray-600 transition-all"
                data-testid="shopping-for-other"
              >
                <PawPrint className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Shopping for another dog?</span>
                <span className="sm:hidden">🐕</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Pillar-specific content */}
      <main>
        {/* Pass context to children via render prop or clone */}
        {typeof children === 'function'
          ? children({
              activePet,
              userPets,
              petSoulData,
              viewMode,
              searchQuery,
              selectedSubcategory,
              subcategories,
              shoppingForOther,
              setActivePet,
              setShoppingForOther,
              setSelectedSubcategory
            })
          : children}
      </main>
      
      {/* Mira Chat Widget */}
      <MiraChatWidget pillar={pillar} />
    </div>
  );
};

export default PillarPageLayout;

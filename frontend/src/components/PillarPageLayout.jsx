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
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Wrench, PawPrint } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import UnifiedHero from './UnifiedHero';
import PillarNav from './PillarNav';
import SEOHead from './SEOHead';
import MiraChatWidget from './MiraChatWidget';

// Pillar subcategories configuration - with images for visual appeal
const PILLAR_SUBCATEGORIES = {
  celebrate: [
    { id: 'cakes', name: 'Birthday Cakes', path: '/celebrate/cakes', emoji: '🎂', image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=200&h=200&fit=crop' },
    { id: 'breed-cakes', name: 'Breed Cakes', path: '/celebrate/breed-cakes', emoji: '❤️', image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=200&h=200&fit=crop' },
    { id: 'pupcakes', name: 'Pupcakes & Dognuts', path: '/celebrate/pupcakes', emoji: '✨', image: 'https://images.unsplash.com/photo-1486427944544-d2c6e30b5d94?w=200&h=200&fit=crop' },
    { id: 'treats', name: 'Treats', path: '/celebrate/treats', emoji: '🎁', image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=200&h=200&fit=crop' },
    { id: 'hampers', name: 'Gift Hampers', path: '/celebrate/hampers', emoji: '🛍️', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200&h=200&fit=crop' },
    { id: 'accessories', name: 'Party Accessories', path: '/celebrate/accessories', emoji: '🎉', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=200&h=200&fit=crop' }
  ],
  dine: [
    { id: 'fresh-meals', name: 'Fresh Meals', path: '/dine/fresh-meals', emoji: '🥩', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop' },
    { id: 'treats', name: 'Treats', path: '/dine/treats', emoji: '🦴', image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=200&h=200&fit=crop' },
    { id: 'desi-treats', name: 'Desi Treats', path: '/dine/desi-treats', emoji: '🍖', image: 'https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=200&h=200&fit=crop' },
    { id: 'frozen', name: 'Frozen', path: '/dine/frozen', emoji: '🧊', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=200&h=200&fit=crop' },
    { id: 'supplements', name: 'Supplements', path: '/dine/supplements', emoji: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop' }
  ],
  care: [
    { id: 'grooming', name: 'Grooming', path: '/care/grooming', emoji: '✨', image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=200&fit=crop' },
    { id: 'health', name: 'Health', path: '/care/health', emoji: '❤️', image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=200&h=200&fit=crop' },
    { id: 'supplements', name: 'Supplements', path: '/care/supplements', emoji: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop' },
    { id: 'spa', name: 'Spa', path: '/care/spa', emoji: '🛁', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop' }
  ],
  enjoy: [
    { id: 'toys', name: 'Toys', path: '/enjoy/toys', emoji: '🎾', image: 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=200&h=200&fit=crop' },
    { id: 'chews', name: 'Chews', path: '/enjoy/chews', emoji: '🦴', image: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=200&h=200&fit=crop' },
    { id: 'games', name: 'Games', path: '/enjoy/games', emoji: '🎮', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
    { id: 'puzzles', name: 'Puzzles', path: '/enjoy/puzzles', emoji: '🧩', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' }
  ],
  travel: [
    { id: 'carriers', name: 'Carriers', path: '/travel/carriers', emoji: '🎒', image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=200&h=200&fit=crop' },
    { id: 'car', name: 'Car Accessories', path: '/travel/car', emoji: '🚗', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop' },
    { id: 'outdoor', name: 'Outdoor Gear', path: '/travel/outdoor', emoji: '⛺', image: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=200&h=200&fit=crop' }
  ],
  stay: [
    { id: 'beds', name: 'Beds', path: '/stay/beds', emoji: '🛏️', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&h=200&fit=crop' },
    { id: 'mats', name: 'Mats', path: '/stay/mats', emoji: '🧺', image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=200&h=200&fit=crop' },
    { id: 'kennels', name: 'Kennels', path: '/stay/kennels', emoji: '🏠', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
    { id: 'bowls', name: 'Bowls', path: '/stay/bowls', emoji: '🥣', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' }
  ],
  fit: [
    { id: 'leashes', name: 'Leashes', path: '/fit/leashes', emoji: '🦮', image: 'https://images.unsplash.com/photo-1594005915193-c1ea7b7c2c90?w=200&h=200&fit=crop' },
    { id: 'harnesses', name: 'Harnesses', path: '/fit/harnesses', emoji: '🎽', image: 'https://images.unsplash.com/photo-1594005915193-c1ea7b7c2c90?w=200&h=200&fit=crop' },
    { id: 'collars', name: 'Collars', path: '/fit/collars', emoji: '📿', image: 'https://images.unsplash.com/photo-1594005915193-c1ea7b7c2c90?w=200&h=200&fit=crop' },
    { id: 'apparel', name: 'Apparel', path: '/fit/apparel', emoji: '👕', image: 'https://images.unsplash.com/photo-1583511655826-05700442b6dd?w=200&h=200&fit=crop' }
  ],
  learn: [
    { id: 'training', name: 'Training Aids', path: '/learn/training', emoji: '🎓', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
    { id: 'puzzles', name: 'Puzzles', path: '/learn/puzzles', emoji: '🧩', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
    { id: 'books', name: 'Books', path: '/learn/books', emoji: '📚', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop' }
  ],
  advisory: [
    { id: 'nutrition', name: 'Nutrition', path: '/advisory/nutrition', emoji: '🥗', image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop' },
    { id: 'behavior', name: 'Behavior', path: '/advisory/behavior', emoji: '🧠', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop' },
    { id: 'health', name: 'Health', path: '/advisory/health', emoji: '❤️', image: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=200&h=200&fit=crop' }
  ],
  emergency: [
    { id: 'first-aid', name: 'First Aid', path: '/emergency/first-aid', emoji: '🩹', image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&h=200&fit=crop' },
    { id: 'hospitals', name: 'Hospitals', path: '/emergency/hospitals', emoji: '🏥', image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=200&h=200&fit=crop' }
  ],
  paperwork: [
    { id: 'registration', name: 'Registration', path: '/paperwork/registration', emoji: '📋', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop' },
    { id: 'insurance', name: 'Insurance', path: '/paperwork/insurance', emoji: '🛡️', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=200&h=200&fit=crop' }
  ],
  farewell: [
    { id: 'memorial', name: 'Memorial', path: '/farewell/memorial', emoji: '🌈', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop' },
    { id: 'support', name: 'Support', path: '/farewell/support', emoji: '💕', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop' }
  ],
  adopt: [
    { id: 'rescue', name: 'Rescue', path: '/adopt/rescue', emoji: '🏠', image: 'https://images.unsplash.com/photo-1516222338250-863216ce01ea?w=200&h=200&fit=crop' },
    { id: 'shelters', name: 'Shelters', path: '/adopt/shelters', emoji: '🐾', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=200&h=200&fit=crop' }
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
 * @param {boolean} useTabNavigation - If true, tabs update state instead of navigating (default: false)
 * @param {function} onSubcategoryChange - Callback when subcategory changes (for tab mode)
 * @param {boolean} hideMiraWidget - Hide the MiraChatWidget (use when page has MiraOSTrigger)
 */
const PillarPageLayout = ({
  pillar,
  title,
  description,
  children,
  defaultViewMode = 'products',
  showSubcategories = true,
  useTabNavigation = false,
  onSubcategoryChange,
  hideMiraWidget = false
}) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Use global pet from PillarContext - ensures consistency when pet is switched elsewhere
  const { currentPet, setCurrentPet, pets: contextPets, soulData: contextSoulData } = usePillarContext();
  
  // Pet state - fallback to local fetch if context not available
  const [localPets, setLocalPets] = useState([]);
  const [localSoulData, setLocalSoulData] = useState(null);
  
  // Use context values if available, otherwise use local
  const userPets = contextPets?.length > 0 ? contextPets : localPets;
  const activePet = currentPet || (userPets.length > 0 ? userPets[0] : null);
  const petSoulData = contextSoulData || localSoulData;
  
  // Navigation state
  const [viewMode, setViewMode] = useState(defaultViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [shoppingForOther, setShoppingForOther] = useState(false);
  
  // Read category from URL params on mount (for tab highlighting after redirects)
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedSubcategory(categoryFromUrl);
    }
  }, [searchParams]);
  
  // Fetch user's pets (fallback if context doesn't have them)
  useEffect(() => {
    const fetchPets = async () => {
      if (!token || contextPets?.length > 0) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const pets = data.pets || [];
          setLocalPets(pets);
          // Set global currentPet if not already set
          if (pets.length > 0 && !currentPet) {
            setCurrentPet(pets[0]);
          }
        }
      } catch (err) {
        console.debug('Failed to fetch pets:', err);
      }
    };
    fetchPets();
  }, [token, contextPets, currentPet, setCurrentPet]);
  
  // Fetch soul data when pet changes (only if context doesn't have it)
  useEffect(() => {
    const fetchSoulData = async () => {
      if (!activePet?.id || !token || contextSoulData) return;
      try {
        const response = await fetch(`${API_URL}/api/soul-drip/completeness/${activePet.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setLocalSoulData(data);
        }
      } catch (err) {
        console.debug('Failed to fetch soul data:', err);
      }
    };
    fetchSoulData();
  }, [activePet?.id, token, contextSoulData]);
  
  // Handle search submit - navigate to search results
  const handleSearchSubmit = (query) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}&pillar=${pillar}`);
    }
  };
  
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
    <div className={`min-h-screen bg-gradient-to-b ${bgGradient} to-white pb-20 md:pb-0 overflow-x-hidden w-full max-w-full`} data-testid={`${pillar}-page`}>
      {/* SEO */}
      <SEOHead 
        title={title}
        description={description}
        path={`/${pillar}`}
      />
      
      {/* Unified Hero - Pet is the HERO! */}
      {/* MIRA OS DOCTRINE: hideSearchBar=true because Mira already knows what pet needs */}
      <UnifiedHero
        pet={activePet}
        soulData={petSoulData}
        pillar={pillar}
        viewMode={viewMode}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        shoppingForOther={shoppingForOther}
        hideSearchBar={true}
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
                  onClick={() => {
                    setSelectedSubcategory(null);
                    onSubcategoryChange?.(null);
                  }}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl font-medium text-xs sm:text-sm transition-all min-w-[80px] ${
                    !selectedSubcategory
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-300'
                  }`}
                  data-testid="all-subcategories"
                >
                  <span className="text-xl">✨</span>
                  <span className="whitespace-nowrap text-center leading-tight">All {pillar.charAt(0).toUpperCase() + pillar.slice(1)}</span>
                </button>
                {subcategories.map((subcat) => (
                  useTabNavigation ? (
                    <button
                      key={subcat.id}
                      onClick={() => {
                        setSelectedSubcategory(subcat.id);
                        onSubcategoryChange?.(subcat.id);
                      }}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl font-medium text-xs sm:text-sm transition-all min-w-[80px] ${
                        selectedSubcategory === subcat.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-300'
                      }`}
                      data-testid={`subcat-${subcat.id}`}
                    >
                      {subcat.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden mb-1">
                          <img src={subcat.image} alt={subcat.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-lg">{subcat.emoji}</span>
                      )}
                      <span className="whitespace-nowrap text-center leading-tight">{subcat.name}</span>
                    </button>
                  ) : (
                    <Link
                      key={subcat.id}
                      to={subcat.path}
                      onClick={() => setSelectedSubcategory(subcat.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl font-medium text-xs sm:text-sm transition-all min-w-[80px] ${
                        selectedSubcategory === subcat.id
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-300'
                      }`}
                      data-testid={`subcat-${subcat.id}`}
                    >
                      {subcat.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden mb-1">
                          <img src={subcat.image} alt={subcat.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-lg">{subcat.emoji}</span>
                      )}
                      <span className="whitespace-nowrap text-center leading-tight">{subcat.name}</span>
                    </Link>
                  )
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
              setActivePet: setCurrentPet,
              setShoppingForOther,
              setSelectedSubcategory
            })
          : children}
      </main>
      
      {/* Mira Chat Widget - hidden when page uses MiraOSTrigger */}
      {!hideMiraWidget && <MiraChatWidget pillar={pillar} />}
    </div>
  );
};

export default PillarPageLayout;

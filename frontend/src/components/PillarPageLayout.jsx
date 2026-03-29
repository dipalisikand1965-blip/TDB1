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
import ReactDOM from 'react-dom';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Wrench, PawPrint } from 'lucide-react';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import UnifiedHero from './UnifiedHero';
import PillarNav from './PillarNav';
import SEOHead from './SEOHead';
import MiraChatWidget from './MiraChatWidget';
import ConciergeRequestBuilder from './services/ConciergeRequestBuilder';
import PillarConciergeCards from './common/PillarConciergeCards';
// MobileMenu removed — Navbar from MainLayout handles mobile navigation

// Pillar subcategories configuration - with REAL product images from Shopify
const PILLAR_SUBCATEGORIES = {
  celebrate: [
    { id: 'cakes', name: 'Birthday Cakes', path: '/celebrate/cakes', emoji: '🎂', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/products/WhatsAppImage2022-05-13at3.24.11PM.jpg?v=1655357921' },
    { id: 'breed-cakes', name: 'Breed Cakes', path: '/celebrate/breed-cakes', emoji: '❤️', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/Untitled_design_17.png?v=1723638766' },
    { id: 'mini-cakes', name: 'Mini Cakes', path: '/celebrate/mini-cakes', emoji: '🧁', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/7_dfd55b51-8b3d-4a5f-b99d-84a6b251e275.png?v=1746685342' },
    { id: 'pupcakes', name: 'Pupcakes & Dognuts', path: '/celebrate/pupcakes', emoji: '✨', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/Designer_5.png?v=1761639445' },
    { id: 'desi-treats', name: 'Desi Treats', path: '/celebrate/desi-treats', emoji: '🪔', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/UntitledDesign-5-Edited.png?v=1759234529' },
    { id: 'treats', name: 'Treats & Biscuits', path: '/celebrate/treats', emoji: '🦴', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/Untitleddesign-2026-01-17T110113.430.png?v=1768627888' },
    { id: 'hampers', name: 'Gift Hampers', path: '/celebrate/hampers', emoji: '🎁', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/Untitleddesign-2026-01-20T122636.295.png?v=1768892215' },
    { id: 'accessories', name: 'Party Accessories', path: '/celebrate/accessories', emoji: '🎉', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/products/FC144498-711C-42A4-8867-99638A34FB8C.png?v=1656737324' },
    { id: 'diy', name: 'DIY Cake Kits', path: '/celebrate/diy', emoji: '🎨', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/IMG_7843.jpg?v=1729504729' },
    { id: 'custom', name: 'Custom Creations', path: '/celebrate/custom', emoji: '✏️', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/products/treatjar2_1.jpg?v=1599218328', isCustom: true },
    { id: 'gift-cards', name: 'Gift Cards', path: '/celebrate/gift-cards', emoji: '💳', image: 'https://cdn.shopify.com/s/files/1/0417/2844/2522/files/Watercolour-Background-Night-Sky-Postcard.jpg?v=1706442619' }
  ],
  dine: [
    { id: 'fresh-meals', name: 'Fresh Meals', path: '/dine/meals', emoji: '🥩', image: 'https://static.prod-images.emergentagent.com/jobs/99ab70cf-a57b-46c1-987d-9e895d2af777/images/84cb230bb28acc363cdf69d0a236b1efac3ec8bf0b82c9c8648399580ada71e2.png' },
    { id: 'treats', name: 'Treats', path: '/celebrate/treats', emoji: '🦴' },
    { id: 'chews', name: 'Chews', path: '/dine?tab=chews', emoji: '🦷' },
    { id: 'frozen', name: 'Frozen', path: '/dine?tab=frozen', emoji: '🧊' },
    { id: 'feeding-tools', name: 'Feeding Tools', path: '/dine?tab=feeding-tools', emoji: '🥣' },
    { id: 'supplements', name: 'Supplements', path: '/dine?tab=supplements', emoji: '💊' },
    { id: 'dine-out', name: 'Dine Out', path: '/dine#restaurants', emoji: '🍽️' }
  ],
  care: [
    { id: 'grooming', name: 'Grooming', path: '/care?type=grooming', emoji: '✂️' },
    { id: 'vet_clinic_booking', name: 'Vet Visits', path: '/care?type=vet_clinic_booking', emoji: '🩺' },
    { id: 'boarding_daycare', name: 'Boarding & Daycare', path: '/care?type=boarding_daycare', emoji: '🏠' },
    { id: 'pet_sitting', name: 'Pet Sitting', path: '/care?type=pet_sitting', emoji: '🐕‍🦺' },
    { id: 'behavior_anxiety_support', name: 'Behavior Support', path: '/care?type=behavior_anxiety_support', emoji: '🧠' },
    { id: 'senior_special_needs_support', name: 'Senior & Special Needs', path: '/care?type=senior_special_needs_support', emoji: '🤍' },
    { id: 'nutrition_consult_booking', name: 'Nutrition Consults', path: '/care?type=nutrition_consult_booking', emoji: '🥗' },
    { id: 'emergency_help', name: 'Emergency Help', path: '/care?type=emergency_help', emoji: '🚨' }
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
 * @param {boolean} useTabNavigation - If true, tabs update state instead of navigating (default: false)
 * @param {function} onSubcategoryChange - Callback when subcategory changes (for tab mode)
 * @param {boolean} hideMiraWidget - Hide the MiraChatWidget (use when page has MiraOSTrigger)
 * @param {boolean} hideHero - Hide the UnifiedHero (use when page has custom hero like Soul-First Celebrate)
 * @param {boolean} hideNavigation - Hide the subcategory navigation bar
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
  hideMiraWidget = false,
  hideHero = false,
  hideNavigation = false
}) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Mobile menu removed - Navbar handles it
  
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
  
  // Concierge Request Builder state (desktop floating button)
  const [conciergeLayoutOpen, setConciergeLayoutOpen] = useState(false);
  const [pillarCardsOpen, setPillarCardsOpen] = useState(false);
  const [isWide, setIsWide] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  useEffect(() => {
    const onResize = () => setIsWide(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  // Get pillar-specific gradient for bottom section
  const PILLAR_BG = {
    celebrate: 'from-pink-50',
    dine: 'from-amber-50',
    care: 'from-teal-50',
    enjoy: 'from-blue-50',
    travel: 'from-cyan-50',
    stay: 'from-green-50',
    fit: 'from-lime-50',
    learn: 'from-indigo-50',
    advisory: 'from-violet-50',
    emergency: 'from-rose-50',
    paperwork: 'from-slate-50',
    farewell: 'from-purple-50',
    adopt: 'from-orange-50'
  };
  
  const bgGradient = PILLAR_BG[pillar] || 'from-gray-50';

  // Pillar-specific accent colours for the Concierge® floating button
  const PILLAR_ACCENT = {
    celebrate : { text: '#F9A8D4', border: 'rgba(249,168,212,0.40)', bg: 'linear-gradient(135deg,#1A0010,#3D0025)' },
    dine      : { text: '#FCD34D', border: 'rgba(252,211,77,0.40)',   bg: 'linear-gradient(135deg,#1A0E00,#3D2200)' },
    care      : { text: '#6EE7B7', border: 'rgba(110,231,183,0.40)',  bg: 'linear-gradient(135deg,#00160D,#003322)' },
    go        : { text: '#93C5FD', border: 'rgba(147,197,253,0.40)',  bg: 'linear-gradient(135deg,#00082A,#001A4D)' },
    play      : { text: '#C4B5FD', border: 'rgba(196,181,253,0.40)',  bg: 'linear-gradient(135deg,#0D001A,#220038)' },
    learn     : { text: '#7DD3FC', border: 'rgba(125,211,252,0.40)',  bg: 'linear-gradient(135deg,#00101A,#002438)' },
    paperwork : { text: '#D1D5DB', border: 'rgba(209,213,219,0.40)',  bg: 'linear-gradient(135deg,#0D0D0D,#1F1F1F)' },
    emergency : { text: '#FCA5A5', border: 'rgba(252,165,165,0.40)',  bg: 'linear-gradient(135deg,#1A0000,#3D0000)' },
    farewell  : { text: '#A5B4FC', border: 'rgba(165,180,252,0.40)',  bg: 'linear-gradient(135deg,#04001A,#0D0040)' },
    adopt     : { text: '#FBCFE8', border: 'rgba(251,207,232,0.40)',  bg: 'linear-gradient(135deg,#1A0010,#3D0030)' },
    shop      : { text: '#FED7AA', border: 'rgba(254,215,170,0.40)',  bg: 'linear-gradient(135deg,#1A0800,#3D1A00)' },
    services  : { text: '#C9973A', border: 'rgba(201,151,58,0.35)',   bg: 'linear-gradient(135deg,#1C0A00,#3D1A00)' },
  };
  const accent = PILLAR_ACCENT[pillar] || PILLAR_ACCENT.services;
  
  return (
    <>
    <div className={`min-h-screen bg-gradient-to-b ${bgGradient} to-white pb-20 md:pb-0 overflow-x-hidden w-full max-w-full`} data-testid={`${pillar}-page`}>
      {/* ── Mobile nav header — REMOVED: Navbar from MainLayout handles this ───────────── */}
      {/* Back button only on mobile, subtly placed below Navbar */}

      {/* MobileMenu is handled by Navbar in MainLayout */}

      {/* SEO */}
      <SEOHead 
        title={title}
        description={description}
        path={`/${pillar}`}
      />
      
      {/* Unified Hero - Pet is the HERO! */}
      {/* MIRA OS DOCTRINE: hideSearchBar=true because Mira already knows what pet needs */}
      {/* Skip if hideHero=true (for pages with custom hero like Soul-First Celebrate) */}
      {!hideHero && (
        <UnifiedHero
          pet={activePet}
          soulData={petSoulData}
          pillar={pillar}
          viewMode={viewMode}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
          hideSearchBar={true}
        />
      )}
      
      {/* Navigation Bar - Subcategories Only (Removed clinical Products/Services toggle) */}
      {!hideNavigation && (
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
                  subcat.isCustom ? (
                    // Custom creations flow to Mira concierge
                    <Link
                      key={subcat.id}
                      to="/mira-demo?custom=true"
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl font-medium text-xs sm:text-sm transition-all min-w-[80px] bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-300 text-purple-700 hover:from-purple-200 hover:to-pink-200`}
                      data-testid={`subcat-${subcat.id}`}
                    >
                      {subcat.image ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden mb-1 ring-2 ring-purple-400">
                          <img src={subcat.image} alt={subcat.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-lg">{subcat.emoji}</span>
                      )}
                      <span className="whitespace-nowrap text-center leading-tight">{subcat.name}</span>
                    </Link>
                  ) : useTabNavigation ? (
                    // Check if path is for internal tab switching or external navigation
                    subcat.path.includes('?tab=') || subcat.path.includes('#') ? (
                      <button
                        key={subcat.id}
                        onClick={() => {
                          setSelectedSubcategory(subcat.id);
                          onSubcategoryChange?.(subcat.id);
                          // Handle hash navigation for anchors
                          if (subcat.path.includes('#')) {
                            const hash = subcat.path.split('#')[1];
                            const element = document.getElementById(hash);
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }
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
                      // External navigation - use Link
                      <Link
                        key={subcat.id}
                        to={subcat.path}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl font-medium text-xs sm:text-sm transition-all min-w-[80px] bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-purple-300`}
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
            </div>
          )}
        </div>
      </div>
      )}
      
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
              setActivePet: setCurrentPet,
              setSelectedSubcategory
            })
          : children}
      </main>
      
      {/* Mira Chat Widget - hidden when page uses MiraOSTrigger */}
      {!hideMiraWidget && <MiraChatWidget pillar={pillar} />}


    </div>
      {/* Portal: renders directly in document.body — escapes ALL overflow-x-hidden ancestors */}
      {ReactDOM.createPortal(
        <>
          {/* Desktop pill button */}
          {isWide && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPillarCardsOpen(true); }}
              data-testid="concierge-builder-float-btn"
              style={{
                position: 'fixed', bottom: 96, right: 24, zIndex: 100000,
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                background: accent.bg, color: accent.text,
                borderRadius: 999, border: `1px solid ${accent.border}`,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(0,0,0,0.30)',
                fontFamily: 'inherit', letterSpacing: '0.03em',
              }}
            >
              <span style={{ fontSize: 14 }}>✦</span>
              Concierge® Requests
            </button>
          )}

          {/* Mobile circle button */}
          {!isWide && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPillarCardsOpen(true); }}
              data-testid="concierge-mobile-float-btn"
              style={{
                position: 'fixed', bottom: 88, right: 16, zIndex: 100000,
                display: 'flex', width: 48, height: 48,
                background: accent.bg, color: accent.text,
                borderRadius: '50%', border: `1.5px solid ${accent.border}`,
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >C®</button>
          )}

          {/* Bottom sheet */}
          {pillarCardsOpen && (console.log('SHEET RENDERING') ||
            <div style={{ position:'fixed', top:0, right:0, bottom:0, left:0, zIndex:2147483647, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
              <div onClick={() => setPillarCardsOpen(false)} style={{ position:'absolute', top:0, right:0, bottom:0, left:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(8px)' }} />
              <div style={{ position:'relative', background:'#fff', borderRadius:'24px 24px 0 0', padding:'24px 24px 40px', maxHeight:'80vh', overflowY:'auto', zIndex:1, maxWidth:600, margin:'0 auto', width:'100%' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                  <div style={{ fontSize:17, fontWeight:800, color:'#1A0A2E' }}>✦ How can Concierge® help?</div>
                  <button onClick={() => setPillarCardsOpen(false)} style={{ background:'#F3F4F6', border:'none', borderRadius:20, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', color:'#6B7280' }}>Close ✕</button>
                </div>
                <PillarConciergeCards pillar={pillar} pet={activePet} token={token} onSheetClose={() => setPillarCardsOpen(false)} />
              </div>
            </div>
          )}
        </>,
        document.body
      )}
      <ConciergeRequestBuilder
        pet={activePet}
        token={token}
        isOpen={conciergeLayoutOpen}
        onClose={() => setConciergeLayoutOpen(false)}
      />
    </>
  );
};

export default PillarPageLayout;

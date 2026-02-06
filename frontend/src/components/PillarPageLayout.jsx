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
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import UnifiedHero from './UnifiedHero';
import PillarNav from './PillarNav';
import SEOHead from './SEOHead';
import MiraChatWidget from './MiraChatWidget';

// Pillar subcategories configuration
const PILLAR_SUBCATEGORIES = {
  celebrate: [
    { id: 'cakes', name: 'Birthday Cakes' },
    { id: 'mini-cakes', name: 'Mini Cakes' },
    { id: 'dognuts', name: 'Dognuts' },
    { id: 'hampers', name: 'Hampers' },
    { id: 'accessories', name: 'Party Accessories' }
  ],
  dine: [
    { id: 'fresh-meals', name: 'Fresh Meals' },
    { id: 'treats', name: 'Treats' },
    { id: 'desi-treats', name: 'Desi Treats' },
    { id: 'frozen', name: 'Frozen' }
  ],
  care: [
    { id: 'grooming', name: 'Grooming' },
    { id: 'health', name: 'Health' },
    { id: 'supplements', name: 'Supplements' }
  ],
  enjoy: [
    { id: 'toys', name: 'Toys' },
    { id: 'chews', name: 'Chews' },
    { id: 'games', name: 'Games' }
  ],
  travel: [
    { id: 'carriers', name: 'Carriers' },
    { id: 'car-accessories', name: 'Car Accessories' }
  ],
  stay: [
    { id: 'beds', name: 'Beds' },
    { id: 'mats', name: 'Mats' },
    { id: 'kennels', name: 'Kennels' }
  ],
  fit: [
    { id: 'leashes', name: 'Leashes' },
    { id: 'harnesses', name: 'Harnesses' },
    { id: 'collars', name: 'Collars' }
  ],
  learn: [
    { id: 'training-aids', name: 'Training Aids' },
    { id: 'puzzles', name: 'Puzzles' }
  ],
  advisory: [],
  emergency: [],
  paperwork: [],
  farewell: [],
  adopt: []
};

/**
 * PillarPageLayout - Wraps pillar-specific content with unified hero and navigation
 * 
 * @param {string} pillar - The pillar identifier (celebrate, dine, care, etc.)
 * @param {string} title - SEO title for the page
 * @param {string} description - SEO description
 * @param {React.ReactNode} children - The pillar-specific content
 * @param {string} defaultViewMode - 'products' or 'services' (default: 'products')
 * @param {Function} onViewModeChange - Callback when view mode changes
 * @param {Function} onSearchChange - Callback when search changes
 * @param {Function} onSubcategoryChange - Callback when subcategory changes
 * @param {boolean} showNav - Whether to show PillarNav (default: true)
 */
const PillarPageLayout = ({
  pillar,
  title,
  description,
  children,
  defaultViewMode = 'products',
  onViewModeChange,
  onSearchChange,
  onSubcategoryChange,
  showNav = true
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
    if (onViewModeChange) {
      onViewModeChange(mode);
    }
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
    if (onSearchChange) {
      onSearchChange(query);
    }
  };
  
  // Handle subcategory change
  const handleSubcategoryChange = (subcat) => {
    setSelectedSubcategory(subcat);
    if (onSubcategoryChange) {
      onSubcategoryChange(subcat);
    }
  };
  
  // Get subcategories for current pillar
  const subcategories = PILLAR_SUBCATEGORIES[pillar] || [];
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0" data-testid={`${pillar}-page`}>
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
      
      {/* Pillar Navigation */}
      {showNav && (
        <PillarNav
          selectedPillar={pillar}
          onSelectPillar={(p) => {
            if (p !== pillar) {
              // Navigate to the selected pillar
              if (p === 'recommended' || p === 'all' || p === 'shop') {
                navigate(viewMode === 'products' ? '/shop' : '/services');
              } else {
                navigate(`/${p}`);
              }
            }
          }}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          petName={activePet?.name || 'Your Pet'}
          shoppingForOther={shoppingForOther}
          onShoppingForOtherClick={() => setShoppingForOther(!shoppingForOther)}
        />
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
              shoppingForOther,
              setActivePet,
              setShoppingForOther,
              onSubcategoryChange: handleSubcategoryChange
            })
          : children}
      </main>
      
      {/* Mira Chat Widget */}
      <MiraChatWidget pillar={pillar} />
    </div>
  );
};

export default PillarPageLayout;

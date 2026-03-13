/**
 * CelebratePageNew.jsx
 * 
 * SOUL-FIRST CELEBRATION ARCHITECTURE
 * 
 * Page Spine:
 * 1. THE ARRIVAL (Hero) → Pet, Soul Score, Soul Chips, Mira's Voice
 * 2. CATEGORY STRIP → For direct shoppers
 * 3. SOUL PILLARS → "How would {petName} love to celebrate?"
 * 4. MIRA'S BIRTHDAY BOX → Build it yourself
 * 5. CELEBRATE CONCIERGE® → Hand it over
 * 6. GUIDED PATHS → Birthday Party | Gotcha Day | Photoshoot
 * 7. CELEBRATION WALL → Community moments
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Context
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';

// Layout
import PillarPageLayout from '../components/PillarPageLayout';

// New Soul-First Components
import {
  CelebrateHero,
  SoulCelebrationPillars,
  MiraCuratedBox,
  CelebrateConcierge,
  GuidedCelebrationPaths,
  CelebrationMemoryWall
} from '../components/celebrate';

// Existing Components (kept for category strip)
import { API_URL, getApiUrl } from '../utils/api';

// Category Strip Component (extracted from existing)
const CategoryStrip = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', name: 'All', icon: '✦', active: true },
    { id: 'birthday-cakes', name: 'Birthday Cakes', icon: '🎂' },
    { id: 'breed-cakes', name: 'Breed Cakes', icon: '🐾' },
    { id: 'pupcakes', name: 'Pupcakes & Dognuts', icon: '🧁' },
    { id: 'desi-treats', name: 'Desi Treats', icon: '🍖' },
    { id: 'gift-hampers', name: 'Gift Hampers', icon: '🎁' },
    { id: 'party-items', name: 'Party Items', icon: '🎀' },
    { id: 'premium', name: 'Premium', icon: '👑' },
  ];

  return (
    <section className="bg-pink-50/50 border-b border-pink-100">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange && onCategoryChange(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                transition-all duration-200 text-sm font-medium
                ${activeCategory === cat.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-white text-gray-600 hover:bg-pink-100 border border-pink-200'
                }
              `}
              data-testid={`category-${cat.id}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// Empty State when no pet
const NoPetState = ({ onAddPet }) => (
  <section 
    className="min-h-[60vh] flex flex-col items-center justify-center px-4"
    style={{
      background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #2d1b4e 100%)'
    }}
  >
    <div className="text-center max-w-md">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Celebrations for your pet
      </h1>
      <p className="text-white/70 text-lg mb-8">
        Add your pet to unlock a personalised celebration experience.
      </p>
      <button
        onClick={onAddPet}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium shadow-lg shadow-purple-500/30 hover:shadow-xl transition-shadow"
        data-testid="add-pet-cta"
      >
        <span>✦</span>
        <span>Add your pet to begin</span>
      </button>
    </div>
  </section>
);

const CelebratePageNew = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  
  // Use currentPet from context
  const selectedPet = currentPet;
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [soulScore, setSoulScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Wait for pet data to load from context
  useEffect(() => {
    // If we have pets in context but no currentPet, select the first one
    if (contextPets?.length > 0 && !currentPet) {
      setCurrentPet(contextPets[0]);
    }
    // If context is loaded (pets checked), we're done loading
    if (contextPets !== undefined) {
      setLoading(false);
    }
  }, [contextPets, currentPet, setCurrentPet]);

  // Fetch soul score
  useEffect(() => {
    const fetchSoulScore = async () => {
      if (!selectedPet?.id) {
        return;
      }

      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/pet-soul/profile/${selectedPet.id}`);
        if (response.ok) {
          const data = await response.json();
          setSoulScore(data.soul_score || data.overall_score || selectedPet.soul_score || 0);
        }
      } catch (error) {
        console.error('[CelebratePageNew] Error fetching soul score:', error);
        setSoulScore(selectedPet?.soul_score || selectedPet?.overall_score || 0);
      }
    };

    fetchSoulScore();
  }, [selectedPet?.id]);

  // Handle add pet
  const handleAddPet = () => {
    if (isAuthenticated) {
      navigate('/dashboard/pets?action=add');
    } else {
      navigate('/login?redirect=/celebrate');
    }
  };

  // Handle open soul builder
  const handleOpenSoulBuilder = useCallback((pillarId) => {
    if (selectedPet?.id) {
      navigate(`/pet-soul/${selectedPet.id}?pillar=${pillarId}`);
    } else {
      toast.info('Please add a pet first to build their soul profile');
      handleAddPet();
    }
  }, [selectedPet?.id, navigate]);

  // Handle build box
  const handleBuildBox = useCallback((items) => {
    // Open box builder modal or navigate
    window.dispatchEvent(new CustomEvent('openOccasionBoxBuilder', {
      detail: { 
        preset: items,
        petName: selectedPet?.name,
        occasion: 'birthday'
      }
    }));
  }, [selectedPet?.name]);

  // Handle talk to concierge
  const handleTalkToConcierge = useCallback(() => {
    window.dispatchEvent(new CustomEvent('openMira', {
      detail: {
        context: 'celebrate-concierge',
        message: `I want to plan a celebration for ${selectedPet?.name || 'my pet'}`
      }
    }));
  }, [selectedPet?.name]);

  // Handle select path
  const handleSelectPath = useCallback((path) => {
    // Open path wizard or navigate
    window.dispatchEvent(new CustomEvent('openCelebrationPath', {
      detail: {
        path: path.id,
        petName: selectedPet?.name
      }
    }));
  }, [selectedPet?.name]);

  // Show loading state
  if (loading) {
    return (
      <PillarPageLayout pillar="celebrate" hideMiraBar={true}>
        <div className="min-h-[60vh] flex items-center justify-center" style={{
          background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #2d1b4e 100%)'
        }}>
          <div className="text-center text-white">
            <div className="text-4xl mb-4 animate-bounce">🎉</div>
            <p className="text-white/70">Loading celebrations...</p>
          </div>
        </div>
      </PillarPageLayout>
    );
  }

  // If no pet, show empty state
  if (!selectedPet && !loading) {
    return (
      <PillarPageLayout pillar="celebrate" hideMiraBar={true}>
        <NoPetState onAddPet={handleAddPet} />
      </PillarPageLayout>
    );
  }

  return (
    <PillarPageLayout 
      pillar="celebrate" 
      hideMiraBar={true}
      className="bg-white"
    >
      {/* 1. THE ARRIVAL - Hero */}
      <CelebrateHero 
        pet={selectedPet} 
        soulScore={soulScore}
      />

      {/* 2. CATEGORY STRIP */}
      <CategoryStrip 
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* 3. SOUL CELEBRATION PILLARS */}
      <SoulCelebrationPillars 
        pet={selectedPet}
        onOpenSoulBuilder={handleOpenSoulBuilder}
      />

      {/* 4. MIRA'S BIRTHDAY BOX */}
      <MiraCuratedBox 
        pet={selectedPet}
        onBuildBox={handleBuildBox}
      />

      {/* 5. CELEBRATE CONCIERGE® */}
      <CelebrateConcierge 
        pet={selectedPet}
        onTalkToConcierge={handleTalkToConcierge}
      />

      {/* 6. GUIDED CELEBRATION PATHS */}
      <GuidedCelebrationPaths 
        pet={selectedPet}
        onSelectPath={handleSelectPath}
      />

      {/* 7. CELEBRATION WALL */}
      <CelebrationMemoryWall 
        petName={selectedPet?.name}
      />
    </PillarPageLayout>
  );
};

export default CelebratePageNew;

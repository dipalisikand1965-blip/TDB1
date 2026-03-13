/**
 * CelebratePageNew.jsx
 * 
 * SOUL-FIRST CELEBRATION ARCHITECTURE
 * Mobile-first, iOS/Android responsive
 * 
 * Page Spine (SINGLE HERO, NO DUPLICATES):
 * 1. THE ARRIVAL (Hero) → Pet, Soul Score, Soul Chips, Mira's Voice
 * 2. CATEGORY STRIP → Opens modals with products/bundles/services
 * 3. SOUL PILLARS → "How would {petName} love to celebrate?"
 * 4. MIRA'S BIRTHDAY BOX → Build it yourself
 * 5. CELEBRATE CONCIERGE® → Hand it over
 * 6. GUIDED PATHS → Birthday Party | Gotcha Day | Photoshoot
 * 7. CELEBRATION WALL → Community moments
 * 
 * IMPORTANT: Mira widget and Concierge button remain visible throughout
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, SendHorizonal } from 'lucide-react';

// Context
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';

// Layout - This includes the Mira widget
import PillarPageLayout from '../components/PillarPageLayout';

// New Soul-First Components
import {
  CelebrateHero,
  CelebrateCategoryStrip,
  SoulCelebrationPillars,
  MiraCuratedBox,
  CelebrateConcierge,
  GuidedCelebrationPaths,
  CelebrationMemoryWall
} from '../components/celebrate';

// API utilities
import { getApiUrl } from '../utils/api';

// Empty State when no pet
const NoPetState = ({ onAddPet }) => (
  <section 
    className="min-h-[60vh] flex flex-col items-center justify-center px-4"
    style={{
      background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #2d1b4e 100%)'
    }}
    data-testid="no-pet-state"
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

// Loading State
const LoadingState = () => (
  <div 
    className="min-h-[60vh] flex items-center justify-center" 
    style={{
      background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #2d1b4e 100%)'
    }}
    data-testid="loading-state"
  >
    <div className="text-center text-white">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-pink-400" />
      <p className="text-white/70">Loading celebrations...</p>
    </div>
  </div>
);

// Mira Ask Bar — minimal, just the input (no extra text)
const MiraAskBar = ({ petName }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  const openMira = (message) => {
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: message || `Tell me how to celebrate ${petName}`,
        context: 'celebrate'
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      openMira(q);
      setQuery('');
    } else {
      openMira();
    }
  };

  return (
    <div className="px-6 mb-8" data-testid="celebrate-mira-ask-bar">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-full overflow-hidden"
          style={{
            background: 'rgba(196,77,255,0.06)',
            border: '1.5px solid rgba(196,77,255,0.25)',
            padding: '4px 4px 4px 18px',
            boxShadow: '0 2px 8px rgba(196,77,255,0.10)'
          }}
        >
          <span className="text-base flex-shrink-0" style={{ color: '#C44DFF' }}>✦</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Ask Mira about ${petName}'s celebrations...`}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: '#1A0A00', padding: '8px 0' }}
            onClick={() => !query.trim() && openMira()}
          />
          <button
            type="submit"
            className="rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
              border: 'none',
              width: 36, height: 36,
              cursor: 'pointer'
            }}
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

const CelebratePageNew = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();
  
  // Use currentPet from context
  const selectedPet = currentPet;
  
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

  // Fetch soul score when pet changes
  useEffect(() => {
    const fetchSoulScore = async () => {
      if (!selectedPet?.id) return;

      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/pet-soul/profile/${selectedPet.id}`);
        if (response.ok) {
          const data = await response.json();
          setSoulScore(data.soul_score || data.overall_score || selectedPet.soul_score || 0);
        } else {
          setSoulScore(selectedPet?.soul_score || selectedPet?.overall_score || 0);
        }
      } catch (error) {
        console.error('[CelebratePageNew] Error fetching soul score:', error);
        setSoulScore(selectedPet?.soul_score || selectedPet?.overall_score || 0);
      }
    };

    fetchSoulScore();
  }, [selectedPet?.id]);

  // Handle add pet
  const handleAddPet = useCallback(() => {
    if (isAuthenticated) {
      navigate('/dashboard/pets?action=add');
    } else {
      navigate('/login?redirect=/celebrate-soul');
    }
  }, [isAuthenticated, navigate]);

  // Handle open soul builder for incomplete pillars
  const handleOpenSoulBuilder = useCallback((pillarId) => {
    if (selectedPet?.id) {
      navigate(`/pet-soul/${selectedPet.id}?section=${pillarId}`);
    } else {
      toast.info('Please add a pet first to build their soul profile');
      handleAddPet();
    }
  }, [selectedPet?.id, navigate, handleAddPet]);

  // Handle build box from Mira's curated box
  const handleBuildBox = useCallback((items) => {
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

  // Handle select guided path
  const handleSelectPath = useCallback((path) => {
    window.dispatchEvent(new CustomEvent('openCelebrationPath', {
      detail: {
        path: path.id,
        petName: selectedPet?.name
      }
    }));
  }, [selectedPet?.name]);

  // Handle category selection from strip
  const handleCategorySelect = useCallback((categoryId) => {
    console.log('[CelebratePageNew] Category selected:', categoryId);
    // The modal is handled inside CelebrateCategoryStrip
  }, []);

  // Show loading state
  if (loading) {
    return (
      <PillarPageLayout pillar="celebrate" hideMiraWidget={false} hideHero={true} hideNavigation={true}>
        <LoadingState />
      </PillarPageLayout>
    );
  }

  // If no pet, show empty state
  if (!selectedPet) {
    return (
      <PillarPageLayout pillar="celebrate" hideMiraWidget={false} hideHero={true} hideNavigation={true}>
        <NoPetState onAddPet={handleAddPet} />
      </PillarPageLayout>
    );
  }

  // Main page with pet
  return (
    <PillarPageLayout 
      pillar="celebrate" 
      hideMiraWidget={false}  // Keep Mira chat visible
      hideHero={true}         // Use our custom CelebrateHero instead of UnifiedHero
      hideNavigation={true}   // Use our custom CelebrateCategoryStrip instead
    >
      {/* 1. THE ARRIVAL - Hero (SINGLE INSTANCE) */}
      <CelebrateHero 
        pet={selectedPet} 
        soulScore={soulScore}
      />

      {/* Main content area with consistent max-width */}
      <div className="max-w-5xl mx-auto w-full">
        {/* 2. CATEGORY STRIP - Opens modals on click */}
        <CelebrateCategoryStrip 
          pet={selectedPet}
          onCategorySelect={handleCategorySelect}
        />

        {/* 3. SOUL CELEBRATION PILLARS */}
        <SoulCelebrationPillars 
          pet={selectedPet}
          onOpenSoulBuilder={handleOpenSoulBuilder}
        />

        {/* Mira Ask Bar — appears right below the pillars section */}
        <MiraAskBar petName={selectedPet?.name} />

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
      </div>
    </PillarPageLayout>
  );
};

export default CelebratePageNew;

/**
 * DineSoulPage.jsx — The /dine pillar
 *
 * Architecture mirrors CelebratePageNew exactly:
 *   PillarPageLayout wrapper (hideHero=true, hideNavigation=true)
 *   DineHero (full-bleed, avatar + soul chips + Mira quote)
 *   max-w-5xl mx-auto content wrapper
 *   Tab "Eat & Nourish": TummyProfile → DineDimensions → MiraMealPick → GuidedNutritionPaths
 *   Tab "Dine Out": PetFriendlySpots → DiningConciergeServices
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';
import PillarPageLayout from '../components/PillarPageLayout';

import DineHero from '../components/dine/DineHero';
import DineTabBar from '../components/dine/DineTabBar';
import TummyProfile from '../components/dine/TummyProfile';
import DineDimensions, { DINE_DIMENSIONS } from '../components/dine/DineDimensions';
import DineDimensionExpanded from '../components/dine/DineDimensionExpanded';
import MiraMealPick from '../components/dine/MiraMealPick';
import GuidedNutritionPaths from '../components/dine/GuidedNutritionPaths';
import PetFriendlySpots from '../components/dine/PetFriendlySpots';
import DiningConciergeServices from '../components/dine/DiningConciergeServices';

// ── Loading ───────────────────────────────────────────────────────────────────
const LoadingState = () => (
  <div
    className="min-h-[60vh] flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #3d1200 0%, #7a2800 50%, #c44400 100%)' }}
    data-testid="dine-loading"
  >
    <div className="text-center text-white">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-300" />
      <p style={{ color: 'rgba(255,255,255,0.70)' }}>Loading Mira's kitchen…</p>
    </div>
  </div>
);

// ── No pet ────────────────────────────────────────────────────────────────────
const NoPetState = ({ onAddPet }) => (
  <section
    className="min-h-[60vh] flex flex-col items-center justify-center px-4"
    style={{ background: 'linear-gradient(135deg, #3d1200 0%, #7a2800 50%, #c44400 100%)' }}
    data-testid="dine-no-pet"
  >
    <div className="text-center max-w-md">
      <div className="text-6xl mb-6">🍽️</div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Food &amp; Nourishment for your pet
      </h1>
      <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.70)' }}>
        Add your pet to unlock a personalised nutrition experience — meals, treats, and restaurants filtered by Mira.
      </p>
      <button
        onClick={onAddPet}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-lg transition-shadow"
        style={{
          background: 'linear-gradient(135deg, #FF8C42, #C44400)',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(196,68,0,0.40)'
        }}
        data-testid="dine-add-pet-btn"
      >
        <span>✦</span>
        <span>Add your dog to begin</span>
      </button>
    </div>
  </section>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const DineSoulPage = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();

  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('eat');
  const [openDimension, setOpenDimension] = useState(null);
  const [petData, setPetData]             = useState(null);
  const [soulScore, setSoulScore]         = useState(0);

  // Sync from pillar context (same as CelebratePageNew)
  useEffect(() => {
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
    if (contextPets !== undefined) setLoading(false);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (currentPet) {
      setPetData(currentPet);
      setSoulScore(currentPet.soul_score || currentPet.overall_score || 0);
    }
  }, [currentPet]);

  // Live soul score updates
  useEffect(() => {
    const handle = (e) => {
      if (e.detail?.petId === petData?.id && e.detail?.score !== undefined) {
        setSoulScore(e.detail.score);
      }
    };
    window.addEventListener('soulScoreUpdated', handle);
    return () => window.removeEventListener('soulScoreUpdated', handle);
  }, [petData?.id]);

  // Optimistic update for TummyProfile saves
  const handlePetUpdate = useCallback((updated) => {
    setPetData(updated);
    setCurrentPet(updated);
  }, [setCurrentPet]);

  const openMira = useCallback((message) => {
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: {
        message: message || `What should ${petData?.name || 'my dog'} eat today?`,
        context: 'dine'
      },
    }));
  }, [petData?.name]);

  const handleAddPet = useCallback(() => {
    if (isAuthenticated) {
      navigate('/dashboard/pets?action=add');
    } else {
      navigate('/login?redirect=/dine');
    }
  }, [isAuthenticated, navigate]);

  const activeDimension = DINE_DIMENSIONS.find(d => d.id === openDimension) || null;

  if (loading) {
    return (
      <PillarPageLayout pillar="dine" hideMiraWidget={false} hideHero={true} hideNavigation={true}>
        <LoadingState />
      </PillarPageLayout>
    );
  }

  if (!petData) {
    return (
      <PillarPageLayout pillar="dine" hideMiraWidget={false} hideHero={true} hideNavigation={true}>
        <NoPetState onAddPet={handleAddPet} />
      </PillarPageLayout>
    );
  }

  return (
    <PillarPageLayout
      pillar="dine"
      hideMiraWidget={false}
      hideHero={true}
      hideNavigation={true}
    >
      <Helmet>
        <title>Dine · {petData.name} · The Doggy Company</title>
        <meta name="description" content={`Everything ${petData.name} eats, filtered by Mira.`} />
      </Helmet>

      {/* 1. HERO — full-bleed, matches CelebrateHero structure */}
      <DineHero
        pet={petData}
        soulScore={soulScore}
        onAskMira={openMira}
      />

      {/* 2. CONTENT WRAPPER — max-w-5xl like CelebratePageNew */}
      <div
        className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8"
        data-testid="dine-soul-page"
      >
        {/* Tummy Profile — the data spine. Always visible. */}
        <TummyProfile pet={petData} token={token} onUpdate={handlePetUpdate} />

        {/* Tab bar */}
        <DineTabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* ── Tab: Eat & Nourish ──────────────────────────────────────────── */}
        {activeTab === 'eat' && (
          <>
            <MiraMealPick pet={petData} />

            <div style={{ marginTop: 24 }}>
              <DineDimensions
                pet={petData}
                openDimension={openDimension}
                onOpen={(id) => setOpenDimension(id === openDimension ? null : id)}
              />
            </div>

            <div style={{ marginTop: 32 }}>
              <GuidedNutritionPaths pet={petData} />
            </div>
          </>
        )}

        {/* ── Tab: Dine Out ──────────────────────────────────────────────── */}
        {activeTab === 'dine-out' && (
          <>
            <PetFriendlySpots pet={petData} />
            <div style={{ marginTop: 32 }}>
              <DiningConciergeServices pet={petData} />
            </div>
          </>
        )}
      </div>

      {/* Dimension expanded panel */}
      {activeDimension && (
        <DineDimensionExpanded
          dimension={activeDimension}
          pet={petData}
          token={token}
          onClose={() => setOpenDimension(null)}
        />
      )}
    </PillarPageLayout>
  );
};

export default DineSoulPage;

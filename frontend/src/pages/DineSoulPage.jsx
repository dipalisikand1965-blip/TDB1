/**
 * DineSoulPage.jsx — The /dine pillar
 * Architecture mirrors /celebrate-soul exactly:
 *   Hero → TummyProfile (data spine) → Tab bar
 *   Tab "Eat & Nourish": MiraMealPick → Dimensions → GuidedNutritionPaths
 *   Tab "Dine Out": PetFriendlySpots → DiningConciergeServices
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePillarContext } from '../context/PillarContext';

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
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
    <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #F0E0D0', borderTopColor: '#C44400', animation: 'spin 0.8s linear infinite' }} />
    <p style={{ fontSize: 14, color: '#888' }}>Loading Mira's kitchen…</p>
  </div>
);

// ── No pet ────────────────────────────────────────────────────────────────────
const NoPetState = ({ onNavigate }) => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
    <div style={{ textAlign: 'center', maxWidth: 400 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1A0A00', marginBottom: 8 }}>Add your dog first</h2>
      <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6, marginBottom: 24 }}>
        Mira needs to know who she's feeding. Add your pet profile and she'll filter every meal, treat, and restaurant to their exact tummy.
      </p>
      <button
        onClick={() => onNavigate('/my-pets')}
        style={{ background: 'linear-gradient(135deg, #C44400, #E86A00)', color: '#fff', border: 'none', borderRadius: 20, padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        data-testid="dine-add-pet-btn"
      >
        Add your dog →
      </button>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const DineSoulPage = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { currentPet, setCurrentPet, pets: contextPets } = usePillarContext();

  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState('eat');
  const [openDimension, setOpenDimension] = useState(null);
  const [petData, setPetData]             = useState(null);

  // Sync from pillar context (same as CelebrateSoulPage)
  useEffect(() => {
    if (contextPets !== undefined) setLoading(false);
    if (contextPets?.length > 0 && !currentPet) setCurrentPet(contextPets[0]);
  }, [contextPets, currentPet, setCurrentPet]);

  useEffect(() => {
    if (currentPet) setPetData(currentPet);
  }, [currentPet]);

  // Optimistic update for TummyProfile saves
  const handlePetUpdate = useCallback((updated) => {
    setPetData(updated);
    setCurrentPet(updated);
  }, [setCurrentPet]);

  const openMira = (message) => {
    window.dispatchEvent(new CustomEvent('openMiraAI', {
      detail: { message: message || `What should ${petData?.name || 'my dog'} eat today?`, context: 'dine' },
    }));
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [loading, user, navigate]);

  const activeDimension = DINE_DIMENSIONS.find(d => d.id === openDimension) || null;

  // Guards (navigate effect handles unauthenticated redirect above)
  if (loading)   return <LoadingState />;
  if (!user)     return null;
  if (!petData)  return <NoPetState onNavigate={navigate} />;

  return (
    <>
      <Helmet>
        <title>Dine · {petData.name} · The Doggy Company</title>
        <meta name="description" content={`Everything ${petData.name} eats, filtered by Mira.`} />
      </Helmet>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        style={{ maxWidth: 800, margin: '0 auto', padding: '16px 16px 100px' }}
        data-testid="dine-soul-page"
      >
        {/* Hero */}
        <DineHero pet={petData} onAskMira={openMira} />

        {/* TummyProfile — the data spine. Always first. */}
        <TummyProfile pet={petData} token={token} onUpdate={handlePetUpdate} />

        {/* Tab bar */}
        <DineTabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* ── Tab: Eat & Nourish ─────────────────────────────────────────── */}
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

      {/* Dimension expanded panel — portal, escapes stacking context */}
      {activeDimension && (
        <DineDimensionExpanded
          dimension={activeDimension}
          pet={petData}
          token={token}
          onClose={() => setOpenDimension(null)}
        />
      )}
    </>
  );
};

export default DineSoulPage;

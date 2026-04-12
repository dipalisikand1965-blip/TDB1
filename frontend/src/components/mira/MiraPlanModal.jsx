/**
 * MiraPlanModal.jsx
 * The Doggy Company — Mira's Personalised Plan Modal
 * Works for ALL pillars: Learn, Play, Go, Dine, Care etc.
 *
 * Usage:
 *   import MiraPlanModal from '../components/mira/MiraPlanModal';
 *   const [planOpen, setPlanOpen] = useState(false);
 *   <MiraPlanModal isOpen={planOpen} onClose={() => setPlanOpen(false)} pet={activePet} pillar="learn" token={token} />
 *   <button onClick={() => setPlanOpen(true)}>Build Learning Plan</button>
 */
import { useState, useEffect } from 'react';
import { API_URL } from '../../utils/api';
import { bookViaConcierge } from '../../utils/MiraCardActions';

const PILLAR_CONFIG = {
  learn: {
    color: '#7C3AED', colorSoft: '#A78BFA', bg: '#1A0A2E', emoji: '🎓',
    title: (name) => `${name}'s Learning Plan`,
    subtitle: 'Mira built this around who you are',
    loadingText: (name) => `Mira is building ${name}'s learning plan…`,
  },
  play: {
    color: '#D97706', colorSoft: '#FCD34D', bg: '#1A1000', emoji: '🎾',
    title: (name) => `${name}'s Play Plan`,
    subtitle: 'Activities matched to your energy and breed',
    loadingText: (name) => `Mira is planning ${name}'s perfect play routine…`,
  },
  go: {
    color: '#0369A1', colorSoft: '#7DD3FC', bg: '#001A2E', emoji: '✈️',
    title: (name) => `${name}'s Adventure Plan`,
    subtitle: 'Travel and outings curated for you both',
    loadingText: (name) => `Mira is planning ${name}'s adventures…`,
  },
  dine: {
    color: '#C8873A', colorSoft: '#E8A85A', bg: '#1A0800', emoji: '🍖',
    title: (name) => `${name}'s Food Plan`,
    subtitle: 'Nutrition built around your soul profile',
    loadingText: (name) => `Mira is building ${name}'s nutrition plan…`,
  },
  care: {
    color: '#40916C', colorSoft: '#74C69D', bg: '#0A1F13', emoji: '🏥',
    title: (name) => `${name}'s Care Plan`,
    subtitle: 'Health and wellness tailored to your needs',
    loadingText: (name) => `Mira is building ${name}'s care plan…`,
  },
  celebrate: {
    color: '#C44DFF', colorSoft: '#E0AAFF', bg: '#1A0030', emoji: '🎉',
    title: (name) => `${name}'s Celebration Plan`,
    subtitle: 'Every celebration made just for you',
    loadingText: (name) => `Mira is planning ${name}'s perfect celebration…`,
  },
  emergency: {
    color: '#DC2626', colorSoft: '#FCA5A5', bg: '#1A0000', emoji: '🚨',
    title: (name) => `${name}'s Safety Plan`,
    subtitle: 'Emergency preparedness personalised for you',
    loadingText: (name) => `Mira is building ${name}'s emergency plan…`,
  },
  farewell: {
    color: '#6B21A8', colorSoft: '#C084FC', bg: '#0F0A1E', emoji: '🌷',
    title: (name) => `${name}'s Farewell Plan`,
    subtitle: 'Mira built this around who you are',
    loadingText: (name) => `Mira is building ${name}'s farewell plan with love…`,
  },
};

const FALLBACK_CARDS = {
  learn: [
    { icon: '🎓', title: 'Foundation Training', reason: 'Every dog thrives with clear communication — start here.', action: 'Explore Foundations', concierge: false },
    { icon: '🧠', title: 'Behaviour & Enrichment', reason: 'Mental stimulation is as important as physical exercise.', action: 'Book a Session', concierge: true },
    { icon: '🏆', title: 'Advanced Skills', reason: 'Build on what your dog already knows.', action: 'Explore Training', concierge: false },
    { icon: '🐕', title: 'Socialisation', reason: 'Confident dogs are happy dogs.', action: 'Find Classes', concierge: true },
  ],
  play: [
    { icon: '🌳', title: 'Outdoor Adventures', reason: 'Explore new places together.', action: 'Find Parks', concierge: false },
    { icon: '🐾', title: 'Playdate Arrangement', reason: 'Social play builds confidence.', action: 'Arrange Playdate', concierge: true },
    { icon: '💪', title: 'Fitness & Training', reason: 'Keep your dog physically sharp.', action: 'Book Session', concierge: true },
    { icon: '🎁', title: 'Enrichment Toys', reason: 'Mental stimulation through play.', action: 'Shop Toys', concierge: false },
  ],
  go: [
    { icon: '🛡️', title: 'Travel Safety Kit', reason: 'Everything you need for safe journeys.', action: 'Shop Safety', concierge: false },
    { icon: '🏡', title: 'Pet-Friendly Stays', reason: 'Find places that welcome you both.', action: 'Find Stays', concierge: true },
    { icon: '✈️', title: 'Flight Preparation', reason: 'Make air travel stress-free.', action: 'Plan Flight', concierge: true },
    { icon: '🗺️', title: 'Adventure Planning', reason: 'Discover new experiences together.', action: 'Plan Adventure', concierge: true },
  ],
  dine: [
    { icon: '🍖', title: 'Daily Meal Plan', reason: 'Nutrition built around your dog\'s needs.', action: 'See Meal Plan', concierge: false },
    { icon: '🎁', title: 'Treat Selection', reason: 'Rewards that are safe and delicious.', action: 'Shop Treats', concierge: false },
    { icon: '💊', title: 'Supplements', reason: 'Support their health from the inside.', action: 'View Supplements', concierge: false },
    { icon: '🍳', title: 'Home Cooking Guide', reason: 'Fresh food made with love.', action: 'Get Recipes', concierge: false },
  ],
  care: [
    { icon: '✂️', title: 'Grooming Schedule', reason: 'Regular grooming keeps them comfortable.', action: 'Book Grooming', concierge: true },
    { icon: '🏥', title: 'Wellness Check', reason: 'Prevention is better than cure.', action: 'Book Vet Visit', concierge: true },
    { icon: '🦷', title: 'Dental Care', reason: 'Dental health affects overall wellbeing.', action: 'Shop Dental', concierge: false },
    { icon: '💊', title: 'Health Supplements', reason: 'Support their joints, coat and immunity.', action: 'View Supplements', concierge: false },
  ],
  celebrate: [
    { icon: '🎂', title: 'Birthday Cake', reason: 'A cake made just for them — safe and delicious.', action: 'Design Cake', concierge: true },
    { icon: '🎉', title: 'Party Planning', reason: 'Let us organise the perfect paw-ty.', action: 'Plan Party', concierge: true },
    { icon: '🎁', title: 'Gift Hamper', reason: 'Curated gifts they\'ll love.', action: 'Shop Gifts', concierge: false },
    { icon: '📸', title: 'Memory Wall', reason: 'Capture every milestone.', action: 'Add Memory', concierge: false },
  ],
  emergency: [
    { icon: '🩺', title: 'Vet on Call', reason: '24/7 vet access for emergencies.', action: 'Call Vet', concierge: true },
    { icon: '💊', title: 'First Aid Kit', reason: 'Be prepared before it happens.', action: 'Shop Kit', concierge: false },
    { icon: '📋', title: 'Emergency Documents', reason: 'Keep all records ready.', action: 'View Documents', concierge: false },
    { icon: '🚑', title: 'Emergency Transport', reason: 'Fast safe transport when needed.', action: 'Book Transport', concierge: true },
  ],
};

async function fetchMiraPlan(petId, pillar, token) {
  try {
    const res = await fetch(`${API_URL}/api/mira/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ pet_id: petId, pillar }),
    });
    if (!res.ok) throw new Error('API failed');
    const data = await res.json();
    return data.cards || null;
  } catch {
    return null;
  }
}

export default function MiraPlanModal({ isOpen = false, onClose, pet = null, pillar = 'learn', token = null }) {
  const [cards, setCards] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookedCards, setBookedCards] = useState([]);
  const [regenerateCount, setRegenerateCount] = useState(0);

  const config = PILLAR_CONFIG[pillar] || PILLAR_CONFIG.learn;
  const petName = pet?.name || 'your dog';
  const petId = pet?.id || pet?._id;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setCards(null);
    setBookedCards([]);

    fetchMiraPlan(petId, pillar, token).then((fetchedCards) => {
      setCards(fetchedCards || FALLBACK_CARDS[pillar] || FALLBACK_CARDS.learn);
      setLoading(false);
    });
  }, [isOpen, petId, pillar, token, regenerateCount]);

  const handleRegenerate = () => {
    setRegenerateCount(c => c + 1);
  };

  const handleBook = async (card, idx) => {
    setBookedCards((prev) => [...prev, idx]);
    await bookViaConcierge({
      service:  card.title,
      pillar,
      pet,
      token,
      channel:  `${pillar}_mira_plan_modal`,
      notes:    card.description || card.subtitle || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.85)' }}
      />
      {/* Modal */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: config.bg, borderRadius: '24px 24px 0 0',
        padding: '24px 16px calc(48px + env(safe-area-inset-bottom))',
        maxHeight: '90vh', overflowY: 'auto',
        animation: 'mira-plan-slide 0.3s ease',
      }}>
        <style>{`@keyframes mira-plan-slide { from{transform:translateY(100%)} to{transform:translateY(0)} }`}</style>

        {/* Drag handle */}
        <div style={{ width: 48, height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.2)', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {pet?.photo_url ? (
              <img src={pet.photo_url} alt={petName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${config.color}` }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `${config.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{config.emoji}</div>
            )}
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', color: config.colorSoft, fontWeight: 700, marginBottom: 2 }}>✦ MIRA · {pillar.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{config.title(petName)}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20, paddingLeft: 56 }}>
          ✦ {config.subtitle}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12, animation: 'spin 2s linear infinite' }}>✦</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{config.loadingText(petName)}</div>
            <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
          </div>
        )}

        {/* Plan Cards */}
        {!loading && cards && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cards.map((card, idx) => {
              const isBooked = bookedCards.includes(idx);
              return (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: `1px solid rgba(255,255,255,0.12)`,
                  borderRadius: 18, padding: '16px',
                }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `${config.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {card.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{card.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginTop: 4 }}>{card.reason}</div>
                    </div>
                  </div>
                  {isBooked ? (
                    <div style={{ fontSize: 13, color: config.colorSoft, fontWeight: 600, textAlign: 'center', padding: '8px 0' }}>
                      ✓ Sent to your Concierge®
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBook(card, idx)}
                      style={{
                        width: '100%', padding: '10px 16px', borderRadius: 12, border: 'none',
                        background: card.concierge ? `linear-gradient(135deg,${config.color},${config.colorSoft}66)` : 'rgba(255,255,255,0.10)',
                        color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>
                      {card.concierge ? `🎩 ${card.action} via Concierge®` : `${card.action} →`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Regenerate button */}
        {!loading && cards && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button
              onClick={handleRegenerate}
              data-testid="mira-plan-regenerate-btn"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${config.colorSoft}44`,
                borderRadius: 20,
                padding: '10px 24px',
                color: config.colorSoft,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'background 0.2s',
              }}
            >
              ↻ Regenerate Plan
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          ♥ Built in memory of Mystique · The Doggy Company
        </div>
      </div>
    </>
  );
}

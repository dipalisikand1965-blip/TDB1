/**
 * DineDimensions.jsx — Five Dine Dimensions grid
 * Each dimension: glow / dim state based on pet data completeness
 * Click → opens DineDimensionExpanded portal
 */

import React from 'react';
import { Lock } from 'lucide-react';
import { useResizeMobile } from '../../hooks/useResizeMobile';
import { useConcierge } from '../../hooks/useConcierge';

export const DINE_DIMENSIONS = [
  {
    id: 'daily-meals',
    title: 'Daily Meals',
    icon: '🍽️',
    description: 'Morning & evening bowls, filtered to your tummy profile',
    color: '#C44400',
    bg: 'rgba(196,68,0,0.06)',
    tabs: ['Morning Meal', 'Evening Meal', 'Meal Toppers', 'Portion Guide'],
    productCategory: 'daily-meals',
    miraQuote: (name, loves, avoid) =>
      avoid.length > 0
        ? `Filtered for ${name} — no ${avoid[0]}.`
        : `Best daily meals for ${name}.`,
    glowWhen: () => true, // always
  },
  {
    id: 'treats-rewards',
    title: 'Treats & Rewards',
    icon: '🦴',
    description: 'Training treats, celebration treats, functional treats',
    color: '#E86A00',
    bg: 'rgba(232,106,0,0.06)',
    tabs: ['Training Treats', 'Celebration Treats', 'Functional Treats', 'Allergy-Safe'],
    productCategory: 'treats',
    miraQuote: (name, loves) =>
      loves.length > 0 ? `${name} loves ${loves[0]} — showing those first.` : `Top treats for ${name}.`,
    glowWhen: (pet) => (pet?.preferences?.favorite_flavors || []).length > 0,
  },
  {
    id: 'supplements',
    title: 'Supplements',
    icon: '💊',
    description: 'Daily wellness, joint support, digestive health, immunity',
    color: '#D14900',
    bg: 'rgba(209,73,0,0.06)',
    tabs: ['Daily Wellness', 'Joint Support', 'Digestive Health', 'Immunity'],
    productCategory: 'supplements',
    miraQuote: (name, loves, avoid, pet) => {
      const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
      const h = Array.isArray(raw) ? raw.join(', ') : String(raw || '');
      return h ? `Tailored for ${name}'s health needs.` : `Daily essentials for ${name}.`;
    },
    glowWhen: (pet) => !!(pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions),
  },
  {
    id: 'frozen-fresh',
    title: 'Frozen & Fresh',
    icon: '❄️',
    description: 'Cold-pressed, raw meals, fresh toppers, frozen treats',
    color: '#8B3A0A',
    bg: 'rgba(139,58,10,0.06)',
    tabs: ['Cold-Pressed', 'Raw Meals', 'Fresh Toppers', 'Frozen Treats'],
    productCategory: 'fresh-frozen',
    miraQuote: (name) => `Fresh, cold, safe. Filtered for ${name}.`,
    glowWhen: () => true,
  },
  {
    id: 'homemade',
    title: 'Homemade & Recipes',
    icon: '👨‍🍳',
    description: 'Recipes, ingredient guides, meal prep, seasonal',
    color: '#A0522D',
    bg: 'rgba(160,82,45,0.06)',
    tabs: ['Recipes', 'Ingredient Guide', 'Meal Prep', 'Seasonal'],
    productCategory: 'homemade',
    miraQuote: (name, loves, avoid) =>
      avoid.length > 0
        ? `Every recipe filtered — no ${avoid.slice(0, 2).join(' or ')}.`
        : `Curated homemade recipes for ${name}.`,
    glowWhen: (pet) => (mergeAllergies(pet)).length > 0,
  },
];

function mergeAllergies(pet) {
  const s = new Set();
  const add = (v) => { if (Array.isArray(v)) v.forEach(x => x && s.add(x)); else if (v) s.add(v); };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  add(pet?.allergies);
  return [...s].filter(a => a.toLowerCase() !== 'none');
}

const DimensionCard = ({ dim, pet, loves, avoid, isOpen, onClick }) => {
  const glows = dim.glowWhen(pet);
  const miraText = dim.miraQuote(pet?.name || 'your dog', loves, avoid, pet);

  return (
    <button
      onClick={onClick}
      data-testid={`dine-dim-${dim.id}`}
      style={{
        width: '100%', textAlign: 'left',
        background: isOpen ? dim.bg : '#FFFFFF',
        border: `2px solid ${isOpen ? dim.color : '#F0E0D0'}`,
        borderRadius: 18, padding: '20px 18px',
        cursor: 'pointer',
        opacity: glows ? 1 : 0.65,
        boxShadow: isOpen
          ? `0 4px 20px ${dim.color}22`
          : glows ? `0 2px 8px ${dim.color}14` : 'none',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Glow dot */}
      {glows && (
        <span style={{
          position: 'absolute', top: 14, right: 14,
          width: 8, height: 8, borderRadius: '50%',
          background: dim.color,
          boxShadow: `0 0 6px ${dim.color}`,
        }} />
      )}
      {!glows && (
        <Lock size={13} color="#ccc" style={{ position: 'absolute', top: 14, right: 14 }} />
      )}

      <div style={{ fontSize: 24, marginBottom: 8 }}>{dim.icon}</div>
      <p style={{ fontSize: 15, fontWeight: 800, color: '#1A0A00', marginBottom: 4 }}>{dim.title}</p>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 1.4 }}>{dim.description}</p>

      {/* Mira quote */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 6,
        background: `${dim.color}0D`,
        borderRadius: 10, padding: '8px 10px',
      }}>
        <span style={{ color: dim.color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>✦</span>
        <p style={{ fontSize: 12, color: dim.color, lineHeight: 1.4 }}>{miraText}</p>
      </div>
    </button>
  );
};

const DineDimensions = ({ pet, openDimension, onOpen }) => {
  const isMobile = useResizeMobile();
  const { request } = useConcierge({ pet, pillar: 'dine' });
  const loves = [
    ...(pet?.preferences?.favorite_flavors || []),
    ...(Array.isArray(pet?.doggy_soul_answers?.favorite_treats)
      ? pet.doggy_soul_answers.favorite_treats
      : pet?.doggy_soul_answers?.favorite_treats ? [pet.doggy_soul_answers.favorite_treats] : [])
  ].filter(Boolean).slice(0, 4);
  const avoid = mergeAllergies(pet);

  return (
    <div data-testid="dine-dimensions">
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A0A00' }}>Eat & Nourish</h2>
        <p style={{ fontSize: 13, color: '#888' }}>5 dimensions, filtered to {pet?.name}</p>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: 12,
      }}>
        {DINE_DIMENSIONS.map((dim) => (
          <DimensionCard
            key={dim.id}
            dim={dim}
            pet={pet}
            loves={loves}
            avoid={avoid}
            isOpen={openDimension === dim.id}
            onClick={() => {
              request(`${pet?.name || 'Pet'} — ${dim.title}`, { channel: 'dine_dimension_card' });
              onOpen(dim.id);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default DineDimensions;

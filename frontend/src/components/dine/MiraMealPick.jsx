/**
 * MiraMealPick.jsx — Templated daily meal recommendation
 *
 * Rules engine: breed weight + life stage + allergies + health condition + nutrition goal
 * → Morning meal, Evening meal, Treat pick, Supplement pick
 * Deterministic, fast, trustworthy. AI layer as future enhancement.
 *
 * Special case: if health condition mentions serious illness, show vet-consult note.
 */

import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useResizeMobile } from '../../hooks/useResizeMobile';

// ── Rules engine ──────────────────────────────────────────────────────────────

const PROTEINS = ['salmon', 'chicken', 'beef', 'lamb', 'duck', 'fish', 'turkey'];

const SERIOUS_CONDITIONS = ['lymphoma', 'cancer', 'tumor', 'tumour', 'kidney failure', 'liver disease', 'diabetes', 'cushings', 'addisons', 'heart disease'];

function mergeAllergies(pet) {
  const s = new Set();
  const add = (v) => { if (Array.isArray(v)) v.forEach(x => x && s.add(String(x).toLowerCase())); else if (v) s.add(String(v).toLowerCase()); };
  add(pet?.preferences?.allergies); add(pet?.doggy_soul_answers?.food_allergies); add(pet?.doggy_soul_answers?.allergies); add(pet?.allergies);
  return [...s].filter(a => a !== 'none' && a !== 'unknown');
}

function getSafeProtein(allergies, loves) {
  const loved = loves.find(f => PROTEINS.includes(f.toLowerCase()));
  if (loved && !allergies.some(a => loved.toLowerCase().includes(a))) return loved;
  return PROTEINS.find(p => !allergies.some(a => a.includes(p) || p.includes(a))) || 'chicken';
}

function getLifeStage(pet) {
  const years = pet?.age_years;
  if (years == null) return 'adult'; // default to adult when unknown
  if (years < 1) return 'puppy';
  if (years >= 8) return 'senior';
  return 'adult';
}

function getSize(pet) {
  const w = pet?.weight;
  if (w == null) return 'medium'; // default to medium when unknown
  if (w > 0 && w < 5) return 'small';
  if (w >= 25) return 'large';
  return 'medium';
}

function isHealthSensitive(pet) {
  const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions || '';
  const note = Array.isArray(raw) ? raw.join(' ') : String(raw || '');
  return SERIOUS_CONDITIONS.some(c => note.toLowerCase().includes(c));
}

const PICKS = {
  puppy: {
    small:  { morning: 'Soft Puppy Chicken Pâté', evening: 'Grain-Free Puppy Wet Food', treat: 'Mini Puppy Training Bites', supplement: 'DHA & Omega Puppy Formula' },
    medium: { morning: 'Puppy Cold-Pressed Kibble', evening: 'Puppy Protein Bowl', treat: 'Puppy Training Biscuits', supplement: 'Puppy Growth Complex' },
    large:  { morning: 'Large Breed Puppy Starter', evening: 'High-Protein Puppy Bowl', treat: 'Large Breed Puppy Treats', supplement: 'Joint Support Puppy' },
  },
  adult: {
    small:  { morning: 'Cold-Pressed {p} Morning Bowl', evening: 'Light {p} Dinner', treat: '{p} Air-Dried Bites', supplement: 'Daily Multivitamin' },
    medium: { morning: 'Balanced {p} Kibble', evening: '{p} Wet Food', treat: '{p} Training Treats', supplement: 'Omega 3 + Joint Care' },
    large:  { morning: 'Large Breed {p} Formula', evening: 'High-Protein Evening Bowl', treat: 'Large Breed Training Treats', supplement: 'Hip & Joint Formula' },
  },
  senior: {
    small:  { morning: 'Soft Senior {p} Food', evening: 'Gentle Senior Dinner', treat: 'Soft Senior Chews', supplement: 'Senior Wellness Pack' },
    medium: { morning: 'Senior Digestive {p} Formula', evening: 'Senior Wet Food', treat: 'Easy-Chew Treats', supplement: 'Senior Complete Supplement' },
    large:  { morning: 'Large Senior {p} Formula', evening: 'Senior Joint-Care Bowl', treat: 'Large Senior Treats', supplement: 'Advanced Senior Care' },
  },
};

const GOAL_MODIFIERS = {
  weight_loss: { prefix: 'Low-Calorie ', suffix: ' (80% normal portion)' },
  weight_gain:  { prefix: 'High-Calorie ', suffix: '' },
  muscle:       { prefix: 'High-Protein ', suffix: '' },
  senior:       { prefix: 'Senior ', suffix: '' },
  puppy:        { prefix: 'Puppy ', suffix: '' },
  maintenance:  { prefix: '', suffix: '' },
};

function buildMealPick(pet) {
  const allergies  = mergeAllergies(pet);
  const loves      = [...(pet?.preferences?.favorite_flavors || [])].map(f => f.toLowerCase());
  const stage      = getLifeStage(pet);
  const size       = getSize(pet);
  const goal       = pet?.nutrition_goal || 'maintenance';
  const protein    = getSafeProtein(allergies, loves);
  const cap        = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const mod        = GOAL_MODIFIERS[goal] || GOAL_MODIFIERS.maintenance;

  const raw = PICKS[stage][size];
  const fill = (s) => (mod.prefix + s.replace('{p}', cap(protein)) + mod.suffix).trim();

  return {
    morning:    fill(raw.morning),
    evening:    fill(raw.evening),
    treat:      fill(raw.treat),
    supplement: fill(raw.supplement),
    protein:    cap(protein),
    lifeStage:  stage,
    size,
    goal,
    healthSensitive: isHealthSensitive(pet),
  };
}

// ── component ─────────────────────────────────────────────────────────────────

const PickCard = ({ emoji, label, pick, color }) => (
  <div style={{
    background: '#FFFBF7',
    border: `1.5px solid ${color}22`,
    borderRadius: 14, padding: '14px 16px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <p style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
    </div>
    <p style={{ fontSize: 14, fontWeight: 700, color: '#1A0A00', lineHeight: 1.4 }}>{pick}</p>
  </div>
);

const MiraMealPick = ({ pet }) => {
  const isMobile = useResizeMobile();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!pet) return null;

  const pick = buildMealPick(pet);
  const petName = pet.name || 'your dog';
  const teaser = `${pick.morning} for mornings, ${pick.treat} as rewards.`;

  return (
    <div style={{ marginBottom: 24 }} data-testid="mira-meal-pick">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="#C44400" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A0A00' }}>Mira's Pick for Today</h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#C44400', fontSize: 13, fontWeight: 600 }}
          data-testid="meal-pick-toggle"
        >
          {isExpanded ? 'Less' : 'See pick'}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Health sensitive warning */}
      {pick.healthSensitive && (
        <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: 12, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 8 }}>
          <span>⚠️</span>
          <p style={{ fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>
            <strong>Vet consultation recommended.</strong> Given {petName}'s health needs, these are gentle options — always confirm any diet change with your vet.
          </p>
        </div>
      )}

      {/* Teaser (always visible) */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(196,68,0,0.06)',
        border: '1.5px solid rgba(196,68,0,0.15)',
        borderRadius: 14, padding: '12px 16px',
        marginBottom: isExpanded ? 12 : 0,
      }}>
        <span style={{ color: '#C44400', fontSize: 16, flexShrink: 0 }}>✦</span>
        <p style={{ fontSize: 13, color: '#7a2800', flex: 1 }}>
          <strong>{petName}</strong> → {teaser}
        </p>
      </div>

      {/* Expanded picks */}
      {isExpanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 10,
        }}>
          <PickCard emoji="🌅" label="Morning Meal" pick={pick.morning} color="#C44400" />
          <PickCard emoji="🌆" label="Evening Meal" pick={pick.evening} color="#E86A00" />
          <PickCard emoji="🦴" label="Treat Pick" pick={pick.treat} color="#D14900" />
          <PickCard emoji="💊" label="Supplement" pick={pick.supplement} color="#8B3A0A" />
        </div>
      )}

      {/* Footer note */}
      {isExpanded && (
        <p style={{ fontSize: 12, color: '#aaa', marginTop: 10, textAlign: 'center' }}>
          Based on {petName}'s {pick.lifeStage} life stage · {pick.size} breed · {pick.protein} preference · {(pick.goal || 'maintenance').replace('_', ' ')} goal
        </p>
      )}
    </div>
  );
};

export default MiraMealPick;

/**
 * GuidedNutritionPaths.jsx
 * 6 paths total. Mira surfaces top 3 based on pet data.
 * Same expansion pattern as celebrate's GuidedCelebrationPaths.
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useResizeMobile } from '../../hooks/useResizeMobile';

const ALL_PATHS = [
  {
    id: 'allergy-navigation',
    title: 'Allergy Navigation Path',
    icon: '🛡️',
    description: 'Full meal plan and product list filtered around known allergens. No guesswork.',
    color: '#DC2626',
    bg: '#FEF2F2',
    steps: ['Map all allergens', 'Find safe proteins', 'Build allergen-free meal plan', 'Get safe product list'],
    score: (pet, avoid) => avoid.length > 0 ? 100 : 0,
  },
  {
    id: 'health-nutrition',
    title: 'Health Nutrition Path',
    icon: '💙',
    description: 'Nutrition protocol tailored to a specific health condition — joints, digestion, immunity, or more.',
    color: '#1D4ED8',
    bg: '#EFF6FF',
    steps: ['Identify health condition', 'Match therapeutic foods', 'Add targeted supplements', 'Monitor and adjust'],
    score: (pet) => (pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions) ? 95 : 10,
  },
  {
    id: 'senior-nutrition',
    title: 'Senior Nutrition Path',
    icon: '🧡',
    description: 'Softer textures, joint-support ingredients, reduced calories, and easier digestion for the golden years.',
    color: '#EA580C',
    bg: '#FFF7ED',
    steps: ['Assess current diet', 'Switch to senior formula', 'Add joint & cognitive support', 'Schedule vet check-in'],
    score: (pet) => (pet?.age_years != null && pet.age_years >= 7) ? 90 : 0,
  },
  {
    id: 'puppy-nutrition',
    title: 'Puppy Nutrition Path',
    icon: '🐶',
    description: 'High-growth meals, DHA for brain development, and correct portion sizes for each growth stage.',
    color: '#16A34A',
    bg: '#F0FDF4',
    steps: ['Choose growth formula', 'Set portion by weight', 'Add DHA & probiotics', 'Track growth milestones'],
    score: (pet) => (pet?.age_years != null && pet.age_years < 2) ? 90 : 0,
  },
  {
    id: 'weight-management',
    title: 'Weight Management Path',
    icon: '⚖️',
    description: 'Controlled calorie plans for weight loss or muscle gain — with safe portion guides.',
    color: '#7C3AED',
    bg: '#F5F3FF',
    steps: ['Set weight goal', 'Calculate daily calories', 'Choose low-cal or high-protein meals', 'Track weekly'],
    score: (pet) => ['weight_loss', 'weight_gain', 'muscle'].includes(pet?.nutrition_goal) ? 85 : 15,
  },
  {
    id: 'homemade-cooking',
    title: 'Homemade Cooking Path',
    icon: '👨‍🍳',
    description: 'Safe, balanced recipes you can make at home — allergy-filtered and vet-reviewed.',
    color: '#A0522D',
    bg: 'rgba(160,82,45,0.06)',
    steps: ['Choose safe proteins', 'Learn balancing basics', 'Get 10 starter recipes', 'Add supplements'],
    score: () => 20,
  },
];

function mergeAllergies(pet) {
  const s = new Set();
  const add = (v) => { if (Array.isArray(v)) v.forEach(x => x && s.add(x)); else if (v) s.add(v); };
  add(pet?.preferences?.allergies); add(pet?.doggy_soul_answers?.food_allergies); add(pet?.doggy_soul_answers?.allergies); add(pet?.allergies);
  return [...s].filter(a => a.toLowerCase() !== 'none');
}

const PathCard = ({ path, petName, isSurfaced }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        border: `2px solid ${isSurfaced ? path.color + '40' : '#F0E0D0'}`,
        borderRadius: 16,
        background: isSurfaced ? path.bg : '#FFFFFF',
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
      data-testid={`nutrition-path-${path.id}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', textAlign: 'left',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '16px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{ fontSize: 24, flexShrink: 0 }}>{path.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#1A0A00' }}>{path.title}</p>
            {isSurfaced && (
              <span style={{ background: path.color, color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 20, padding: '2px 8px' }}>
                Mira Pick
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.4 }}>{path.description}</p>
        </div>
        {expanded ? <ChevronDown size={18} color={path.color} /> : <ChevronRight size={18} color="#ccc" />}
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 18px', borderTop: `1px solid ${path.color}20` }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: path.color, marginBottom: 10, marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Path Steps
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {path.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: path.bg, border: `1.5px solid ${path.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: path.color }}>{i + 1}</span>
                </div>
                <p style={{ fontSize: 13, color: '#444' }}>{step}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message: `Start ${path.title} for ${petName}`, context: 'dine' } }))}
            style={{
              marginTop: 14, background: path.color, color: '#fff',
              border: 'none', borderRadius: 20, padding: '10px 20px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%',
            }}
          >
            Start this path with Mira →
          </button>
        </div>
      )}
    </div>
  );
};

const GuidedNutritionPaths = ({ pet }) => {
  const isMobile = useResizeMobile();
  const [showAll, setShowAll] = useState(false);
  const petName = pet?.name || 'your dog';
  const avoid = mergeAllergies(pet);

  // Score and sort paths, surface top 3
  const scored = ALL_PATHS
    .map(p => ({ ...p, _score: p.score(pet, avoid) }))
    .sort((a, b) => b._score - a._score);

  const surfacedIds = new Set(scored.filter(p => p._score > 0).slice(0, 3).map(p => p.id));
  const visible = showAll ? scored : scored.filter(p => p._score > 0).slice(0, 3);

  return (
    <div style={{ marginBottom: 24 }} data-testid="guided-nutrition-paths">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1A0A00', marginBottom: 2 }}>Guided Nutrition Paths</h2>
          <p style={{ fontSize: 13, color: '#888' }}>Mira picked {visible.length} paths for {petName}</p>
        </div>
        {!showAll && ALL_PATHS.length > 3 && (
          <button onClick={() => setShowAll(true)} style={{ background: 'none', border: '1.5px solid #F0E0D0', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#888', cursor: 'pointer' }}>
            See all {ALL_PATHS.length}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map(path => (
          <PathCard key={path.id} path={path} petName={petName} isSurfaced={surfacedIds.has(path.id)} />
        ))}
      </div>
    </div>
  );
};

export default GuidedNutritionPaths;

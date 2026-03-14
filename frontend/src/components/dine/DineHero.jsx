/**
 * DineHero.jsx — /dine pillar hero
 * Warm dark brown → terracotta amber gradient
 * Shows pet name, soul chips (Loves / Avoid / Health), and Mira quote
 */
import React from 'react';
import { Utensils } from 'lucide-react';

const MIRA_QUOTES = [
  (name) => `Everything ${name} eats. Filtered by Mira.`,
  (name) => `${name}'s tummy speaks. Mira listens.`,
  (name) => `Food that fits ${name}'s soul, not just their bowl.`,
];

const DineHero = ({ pet, onAskMira }) => {
  const petName = pet?.name || 'your dog';
  const allergies = (() => {
    const s = new Set();
    const add = (v) => { if (Array.isArray(v)) v.forEach(x => x && s.add(x)); else if (v) s.add(v); };
    add(pet?.preferences?.allergies);
    add(pet?.doggy_soul_answers?.food_allergies || pet?.doggy_soul_answers?.allergies);
    add(pet?.allergies);
    return [...s].filter(a => a.toLowerCase() !== 'none');
  })();
  const loves = [
    ...(pet?.preferences?.favorite_flavors || []),
    ...(Array.isArray(pet?.doggy_soul_answers?.favorite_treats)
      ? pet.doggy_soul_answers.favorite_treats
      : pet?.doggy_soul_answers?.favorite_treats ? [pet.doggy_soul_answers.favorite_treats] : [])
  ].filter(Boolean).slice(0, 3);
  const healthNote = (() => {
    const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
    if (!raw) return null;
    const str = Array.isArray(raw) ? raw.join(', ') : String(raw);
    return str.toLowerCase() === 'none' || str.trim() === '' ? null : str;
  })();

  const quoteIdx = (petName.charCodeAt(0) || 0) % MIRA_QUOTES.length;
  const mirasLine = MIRA_QUOTES[quoteIdx](petName);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #3d1200 0%, #7a2800 40%, #c44400 75%, #e86a00 100%)',
        borderRadius: 24,
        padding: '40px 32px 32px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 260,
        marginBottom: 8,
      }}
      data-testid="dine-hero"
    >
      {/* Decorative orbs */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Utensils size={16} color="rgba(255,255,255,0.70)" />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.70)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            DINE · {petName.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 4, letterSpacing: '-0.02em' }}>
          Everything {petName}
        </h1>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,0.85)', lineHeight: 1.15, marginBottom: 24, letterSpacing: '-0.02em' }}>
          eats. Filtered by Mira.
        </h1>

        {/* Soul chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {loves.slice(0, 2).map((f) => (
            <span key={f} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 600, borderRadius: 20, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.20)' }}>
              Loves {f}
            </span>
          ))}
          {allergies.slice(0, 2).map((a) => (
            <span key={a} style={{ background: 'rgba(220,38,38,0.25)', color: '#FFD0D0', fontSize: 13, fontWeight: 600, borderRadius: 20, padding: '5px 12px', border: '1px solid rgba(220,38,38,0.30)' }}>
              No {a}
            </span>
          ))}
          {healthNote && (
            <span style={{ background: 'rgba(59,130,246,0.25)', color: '#BFDBFE', fontSize: 13, fontWeight: 600, borderRadius: 20, padding: '5px 12px', border: '1px solid rgba(59,130,246,0.30)' }}>
              {healthNote.length > 20 ? healthNote.substring(0, 20) + '…' : healthNote}
            </span>
          )}
        </div>

        {/* Mira quote bar */}
        <button
          onClick={() => onAskMira?.(`Tell me what ${petName} should eat today`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: 14, padding: '10px 16px',
            cursor: 'pointer', width: '100%', textAlign: 'left',
          }}
          data-testid="dine-hero-mira-bar"
        >
          <span style={{ color: '#FFD6A8', fontSize: 16 }}>✦</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, flex: 1 }}>{mirasLine}</span>
          <span style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12 }}>Ask Mira →</span>
        </button>
      </div>
    </div>
  );
};

export default DineHero;

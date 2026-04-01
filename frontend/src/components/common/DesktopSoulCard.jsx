/**
 * DesktopSoulCard — Srini Thursday feature
 * Shows pet's active allergies + loves at the top of Dine, Care, Play desktop pages.
 *
 * Layout:
 *   🐾 Mojo's Dine         ← title
 *   "A life full of salmon and love"  ← life vision (if present)
 *   ⚠️ No Chicken  ⚠️ No Beef  ❤️ Wild Salmon  ← chips row
 *
 * Empty state: "🐾 Tell us about {name} → Complete Soul Profile →"
 */

import { useNavigate } from 'react-router-dom';

const CLEAN_NONE = /^(no|none|none_confirmed|no_allergies|no allergies|unknown|na|n\/a|nil)$/i;

function extractAllergies(pet) {
  const s = new Set();
  const addStr = v => {
    if (!v) return;
    if (Array.isArray(v)) v.forEach(x => { const t = String(x ?? '').trim().toLowerCase(); if (t && !CLEAN_NONE.test(t)) s.add(t); });
    else { const t = String(v).trim().toLowerCase(); if (t && !CLEAN_NONE.test(t)) s.add(t); }
  };
  // soul answers / preferences (existing sources)
  addStr(pet?.preferences?.allergies);
  addStr(pet?.doggy_soul_answers?.food_allergies);
  addStr(pet?.doggy_soul_answers?.allergies);
  addStr(pet?.allergies);
  // vault.allergies — PRIMARY: vet-confirmed severe allergies live here
  if (pet?.vault?.allergies) {
    const va = pet.vault.allergies;
    if (Array.isArray(va)) va.forEach(alg => { const n = alg?.name || alg; const t = String(n ?? '').trim().toLowerCase(); if (t && !CLEAN_NONE.test(t)) s.add(t); });
    else addStr(va);
  }
  // health_data.allergies — secondary health store
  addStr(pet?.health_data?.allergies);
  return [...s];
}

function extractLoves(pet, allergySet) {
  const raw = [
    ...(pet?.preferences?.favorite_treats || []),
    ...(pet?.soul_enrichments?.favorite_treats || []),
    ...(pet?.doggy_soul_answers?.favorite_treats || []),
    pet?.doggy_soul_answers?.favorite_protein,
    pet?.doggy_soul_answers?.fav_protein,
    ...(pet?.preferences?.favorite_flavors || []),
  ].filter(Boolean).map(v => (typeof v === 'string' ? v : (v?.name || '')).trim()).filter(Boolean);

  const allergyLower = new Set(allergySet.map(a => a.toLowerCase()));
  return [...new Set(raw)].filter(l => !allergyLower.has(l.toLowerCase())).slice(0, 3);
}

const PILLAR_STYLES = {
  dine:  { bg: 'linear-gradient(135deg,#FFF8F0 0%,#FFF3E8 100%)', border: 'rgba(255,140,66,0.22)', accent: '#D97706', titleColor: '#3D1200' },
  care:  { bg: 'linear-gradient(135deg,#F0FFF4 0%,#E8F5E9 100%)', border: 'rgba(64,145,108,0.22)',  accent: '#40916C', titleColor: '#1B4332' },
  play:  { bg: 'linear-gradient(135deg,#FFF5F0 0%,#FFE8DF 100%)', border: 'rgba(255,107,53,0.22)', accent: '#E65A20', titleColor: '#3D1200' },
};

export default function DesktopSoulCard({ pet, pillarLabel, pillar, dataTestId }) {
  const navigate = useNavigate();
  const style = PILLAR_STYLES[pillar] || PILLAR_STYLES.dine;
  const petName = pet?.name || 'your dog';

  const allergyList = extractAllergies(pet);
  const loveList    = extractLoves(pet, allergyList);
  const lifeVision  = pet?.doggy_soul_answers?.life_vision
    || pet?.dsa?.life_vision
    || pet?.soul_enrichments?.life_vision
    || null;

  const hasData = allergyList.length > 0 || loveList.length > 0 || lifeVision;

  // ── Empty state ──
  if (!hasData) {
    return (
      <div
        data-testid={dataTestId || `desktop-soul-card-${pillar}-empty`}
        onClick={() => navigate('/my-pets')}
        style={{
          margin: '12px 0 16px',
          background: '#FAFAFA',
          border: `1.5px dashed ${style.accent}44`,
          borderRadius: 16,
          padding: '14px 20px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = style.accent}
        onMouseLeave={e => e.currentTarget.style.borderColor = `${style.accent}44`}
      >
        <span style={{ fontSize: 24 }}>🐾</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A0A2E', letterSpacing: '-0.2px' }}>
            Tell us about {petName}
          </div>
          <div style={{ fontSize: 12, color: style.accent, fontWeight: 600, marginTop: 2 }}>
            Complete Soul Profile →
          </div>
        </div>
      </div>
    );
  }

  // ── Filled state ──
  return (
    <div
      data-testid={dataTestId || `desktop-soul-card-${pillar}`}
      style={{
        margin: '12px 0 16px',
        background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: '0 2px 14px rgba(26,10,46,0.06)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: lifeVision ? 6 : 10 }}>
        <span style={{ fontSize: 20 }}>🐾</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: style.titleColor, letterSpacing: '-0.3px' }}>
          {petName}'s {pillarLabel}
        </span>
      </div>

      {/* Life vision */}
      {lifeVision && (
        <p style={{ margin: '0 0 10px', fontSize: 13, color: '#6B4C2A', fontStyle: 'italic', lineHeight: 1.5, paddingLeft: 28 }}>
          "{lifeVision}"
        </p>
      )}

      {/* Chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {allergyList.map(a => (
          <span key={a} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,107,100,0.10)', border: '1px solid rgba(255,107,100,0.30)',
            borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#B03A2E',
            letterSpacing: '0.1px',
          }}>
            ⚠️ No {a.charAt(0).toUpperCase() + a.slice(1)}
          </span>
        ))}
        {loveList.map(l => (
          <span key={l} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'rgba(39,174,96,0.09)', border: '1px solid rgba(39,174,96,0.26)',
            borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#1E7A46',
            letterSpacing: '0.1px',
          }}>
            ❤️ {l.charAt(0).toUpperCase() + l.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}

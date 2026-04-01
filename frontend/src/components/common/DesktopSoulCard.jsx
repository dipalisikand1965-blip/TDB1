/**
 * DesktopSoulCard — Pillar-specific pet soul data display
 * Srini Thursday feature — v2 with pillar-specific fact chips
 *
 * Dine:  allergies + loves + sensitive stomach
 * Care:  allergies + coat/grooming + stranger reaction + health
 * Play:  energy/age + social + stranger reaction + training
 * Learn: training level + commands + learn style
 * Go:    travel style + car comfort + social preference
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
  addStr(pet?.preferences?.allergies);
  addStr(pet?.doggy_soul_answers?.food_allergies);
  addStr(pet?.doggy_soul_answers?.allergies);
  addStr(pet?.allergies);
  if (pet?.vault?.allergies) {
    const va = pet.vault.allergies;
    if (Array.isArray(va)) va.forEach(alg => { const n = alg?.name || alg; const t = String(n ?? '').trim().toLowerCase(); if (t && !CLEAN_NONE.test(t)) s.add(t); });
    else addStr(va);
  }
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

function cap(s) { return s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : ''; }
function cleanVal(v) { return typeof v === 'string' ? v.replace(/_/g, ' ').trim() : null; }
function isNegative(v) { return !v || CLEAN_NONE.test(String(v).trim()) || /^(no|none|never|false|not|n\/a|ok|fine|normal)$/i.test(String(v).trim()); }

function formatStranger(val) {
  if (!val) return null;
  const v = val.toLowerCase();
  if (v.includes('shy') || v.includes('nervous') || v.includes('anxious') || v.includes('scared')) return 'Anxious with strangers';
  if (v.includes('reactive') || v.includes('barks') || v.includes('growls')) return 'Reactive with strangers';
  if (v.includes('warm')) return 'Warms up slowly';
  return null;
}

function getPillarFacts(pet, pillar) {
  const soul = pet?.doggy_soul_answers || {};
  const facts = [];

  if (pillar === 'dine') {
    const ss = cleanVal(soul.sensitive_stomach);
    if (ss && !/^(no|never|false|not|n\/a)$/i.test(ss)) {
      facts.push({ icon: '💊', text: 'Sensitive stomach', bg: 'rgba(147,51,234,0.08)', border: 'rgba(147,51,234,0.22)', color: '#6D28D9' });
    }
    return facts;
  }

  if (pillar === 'care') {
    const breed      = cap(pet?.breed || soul.breed || '');
    const coat       = cap(pet?.coat_type || soul.coat_type || '');
    const groomStyle = cleanVal(soul.grooming_style) || cleanVal(soul.grooming_tolerance);
    const groomFreq  = cleanVal(soul.groom_frequency);
    const careRow    = [breed, coat, groomFreq || groomStyle].filter(Boolean).join(' · ');
    if (careRow) facts.push({ icon: '🐕', text: careRow, bg: 'rgba(64,145,108,0.08)', border: 'rgba(64,145,108,0.22)', color: '#1B4332' });

    const strangerLabel = formatStranger(soul.stranger_reaction);
    if (strangerLabel) facts.push({ icon: '😰', text: strangerLabel, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', color: '#92400E' });

    const ss = cleanVal(soul.sensitive_stomach);
    if (ss && !/^(no|never|false|not|n\/a)$/i.test(ss)) {
      facts.push({ icon: '💊', text: 'Sensitive stomach', bg: 'rgba(147,51,234,0.08)', border: 'rgba(147,51,234,0.22)', color: '#6D28D9' });
    }
    const hc = soul.health_conditions;
    const healthText = Array.isArray(hc)
      ? hc.filter(h => h && !isNegative(h)).join(', ')
      : (typeof hc === 'string' && !isNegative(hc) ? hc : null);
    if (healthText) facts.push({ icon: '🏥', text: cap(healthText), bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#B91C1C' });
    return facts;
  }

  if (pillar === 'play') {
    const energy    = cleanVal(soul.energy_level) || cap(cleanVal(soul.activity_level));
    const age       = pet?.age ? `${pet.age} yr` : null;
    const lifeStage = cap(cleanVal(pet?.life_stage || soul.life_stage || ''));
    const energyRow = [cap(energy), lifeStage, age].filter(Boolean).join(' · ');
    if (energyRow) facts.push({ icon: '⚡', text: energyRow, bg: 'rgba(245,158,11,0.09)', border: 'rgba(245,158,11,0.25)', color: '#92400E' });

    const livesWith  = Array.isArray(soul.lives_with) ? soul.lives_with : [];
    const dogsBehav  = cleanVal(soul.behavior_with_dogs);
    const socialParts = [...livesWith.slice(0, 2), dogsBehav || null].filter(Boolean);
    if (socialParts.length) facts.push({ icon: '🐕', text: `Loves: ${socialParts.join(' · ')}`, bg: 'rgba(64,145,108,0.08)', border: 'rgba(64,145,108,0.22)', color: '#1B4332' });

    const strangerLabel = formatStranger(soul.stranger_reaction);
    if (strangerLabel) facts.push({ icon: '😰', text: strangerLabel, bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)', color: '#92400E' });

    const trainLevel = cleanVal(soul.training_level);
    const commands   = Array.isArray(soul.learn_level) ? soul.learn_level.join(', ') : cleanVal(soul.learn_level);
    if (trainLevel) {
      const trainText = commands ? `${trainLevel} · ${commands}` : trainLevel;
      facts.push({ icon: '🎾', text: trainText, bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.22)', color: '#3730A3' });
    }
    return facts;
  }

  if (pillar === 'learn') {
    const trainLevel = cleanVal(soul.training_level);
    const commands   = Array.isArray(soul.learn_level) ? soul.learn_level.join(', ') : null;
    const learnFocus = Array.isArray(soul.learn_focus) ? soul.learn_focus[0] : cleanVal(soul.learn_focus);
    const learnHist  = Array.isArray(soul.learn_history) ? soul.learn_history[0] : null;
    if (trainLevel) facts.push({ icon: '🎾', text: commands ? `${trainLevel} · ${commands}` : trainLevel, bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.22)', color: '#3730A3' });
    if (learnFocus) facts.push({ icon: '⏱️', text: `Sessions: ${learnFocus}`, bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.22)', color: '#0F766E' });
    if (learnHist)  facts.push({ icon: '📋', text: cap(learnHist), bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.22)', color: '#374151' });
    return facts;
  }

  if (pillar === 'go') {
    const carRide   = cleanVal(soul.car_rides);
    const travel    = cleanVal(soul.usual_travel);
    const stay      = cleanVal(soul.stay_preference);
    const travelSoc = cleanVal(soul.travel_social);
    if (carRide && !/^(tolerates|ok|fine)$/i.test(carRide)) facts.push({ icon: '🚗', text: `Car: ${carRide}`, bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.22)', color: '#3730A3' });
    if (travel)      facts.push({ icon: '🗺️', text: `Travels by ${travel}`, bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.22)', color: '#0F766E' });
    if (stay)        facts.push({ icon: '🏡', text: cap(stay), bg: 'rgba(64,145,108,0.08)', border: 'rgba(64,145,108,0.22)', color: '#1B4332' });
    if (travelSoc)   facts.push({ icon: '🧘', text: cap(travelSoc), bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.22)', color: '#374151' });
    return facts;
  }

  return facts;
}

const PILLAR_STYLES = {
  dine:  { bg: 'linear-gradient(135deg,#FFF8F0 0%,#FFF3E8 100%)', border: 'rgba(255,140,66,0.22)',  titleColor: '#3D1200' },
  care:  { bg: 'linear-gradient(135deg,#F0FFF4 0%,#E8F5E9 100%)', border: 'rgba(64,145,108,0.22)', titleColor: '#1B4332' },
  play:  { bg: 'linear-gradient(135deg,#FFF5F0 0%,#FFE8DF 100%)', border: 'rgba(255,107,53,0.22)', titleColor: '#3D1200' },
  learn: { bg: 'linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 100%)', border: 'rgba(99,102,241,0.22)', titleColor: '#1E1B4B' },
  go:    { bg: 'linear-gradient(135deg,#ECFDF5 0%,#D1FAE5 100%)', border: 'rgba(16,185,129,0.22)', titleColor: '#064E3B' },
};

export default function DesktopSoulCard({ pet, pillarLabel, pillar, dataTestId }) {
  const navigate    = useNavigate();
  const style       = PILLAR_STYLES[pillar] || PILLAR_STYLES.dine;
  const petName     = pet?.name || 'your dog';
  const allergyList = extractAllergies(pet);
  const loveList    = pillar === 'dine' ? extractLoves(pet, allergyList) : [];
  const pillarFacts = getPillarFacts(pet, pillar);
  const lifeVision  = pet?.doggy_soul_answers?.life_vision
    || pet?.dsa?.life_vision
    || pet?.soul_enrichments?.life_vision
    || null;

  const hasData = allergyList.length > 0 || loveList.length > 0 || lifeVision || pillarFacts.length > 0;

  if (!hasData) {
    return (
      <div
        data-testid={dataTestId || `desktop-soul-card-${pillar}-empty`}
        onClick={() => navigate('/my-pets')}
        style={{
          margin: '12px 0 16px', background: '#FAFAFA',
          border: `1.5px dashed ${style.border}`,
          borderRadius: 16, padding: '14px 20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{ fontSize: 24 }}>🐾</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1A0A2E' }}>Tell us about {petName}</div>
          <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>Complete Soul Profile →</div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid={dataTestId || `desktop-soul-card-${pillar}`}
      style={{
        margin: '12px 0 16px', background: style.bg,
        border: `1.5px solid ${style.border}`,
        borderRadius: 16, padding: '16px 20px',
        boxShadow: '0 2px 14px rgba(26,10,46,0.06)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: lifeVision ? 6 : 12 }}>
        <span style={{ fontSize: 20 }}>🐾</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: style.titleColor, letterSpacing: '-0.3px' }}>
          {petName}'s {pillarLabel}
        </span>
      </div>

      {/* Life vision */}
      {lifeVision && (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B4C2A', fontStyle: 'italic', lineHeight: 1.5, paddingLeft: 28 }}>
          "{lifeVision}"
        </p>
      )}

      {/* Row 1 — allergen + love chips */}
      {(allergyList.length > 0 || loveList.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: pillarFacts.length > 0 ? 8 : 0 }}>
          {allergyList.map(a => (
            <span key={a} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,107,100,0.10)', border: '1px solid rgba(255,107,100,0.30)',
              borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#B03A2E',
            }}>
              ⚠️ No {a.charAt(0).toUpperCase() + a.slice(1)}
            </span>
          ))}
          {loveList.map(l => (
            <span key={l} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(39,174,96,0.09)', border: '1px solid rgba(39,174,96,0.26)',
              borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#1E7A46',
            }}>
              ❤️ {l.charAt(0).toUpperCase() + l.slice(1)}
            </span>
          ))}
        </div>
      )}

      {/* Row 2+ — pillar-specific fact chips */}
      {pillarFacts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {pillarFacts.map((f, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: f.bg, border: `1px solid ${f.border}`,
              borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: f.color,
            }}>
              {f.icon} {f.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

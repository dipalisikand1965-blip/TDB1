// ─── useSoulChips.js ─────────────────────────────────────────────────────────
// Bible §3.1 — Soul chips must be unique, distinct, 3–5 traits when soul >80%
// Drop-in replacement for wherever soul chips are generated in MiraDemoPage.jsx
// Usage: const chips = useSoulChips(pet)

import { useMemo } from 'react';

// Priority order — most meaningful traits first
const CHIP_EXTRACTORS = [
  // Health flags (always surface first — safety critical)
  (pet) => {
    const allergies = pet?.doggy_soul_answers?.food_allergies
      || pet?.doggy_soul_answers?.allergies
      || pet?.allergies
      || [];
    const allergyList = Array.isArray(allergies) ? allergies : [allergies];
    if (allergyList.length > 0 && allergyList[0]) {
      const allergyName = allergyList[0].replace(/[_-]/g, ' ');
      return {
        id: 'allergy',
        label: `${allergyName.charAt(0).toUpperCase() + allergyName.slice(1)}-free`,
        type: 'health',
        icon: '⚠️',
      };
    }
    return null;
  },

  // Diet preference
  (pet) => {
    const diet = pet?.doggy_soul_answers?.diet_type
      || pet?.doggy_soul_answers?.food_preference;
    if (diet && diet !== 'no_preference') {
      return {
        id: 'diet',
        label: diet.replace(/_/g, '-').replace(/\b\w/g, c => c.toUpperCase()),
        type: 'preference',
        icon: '🍽️',
      };
    }
    return null;
  },

  // Energy / personality (from soul profile)
  (pet) => {
    const energy = pet?.doggy_soul_answers?.energy_level
      || pet?.doggy_soul_answers?.activity_level;
    if (energy) {
      const map = {
        high: 'High energy',
        medium: 'Moderate energy',
        low: 'Calm & gentle',
        very_high: 'Super energetic',
      };
      return {
        id: 'energy',
        label: map[energy] || energy.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        type: 'personality',
        icon: '⚡',
      };
    }
    return null;
  },

  // General nature / personality (DEDUPLICATED against energy)
  (pet, existing) => {
    const nature = pet?.doggy_soul_answers?.general_nature
      || pet?.doggy_soul_answers?.personality_type;
    if (!nature) return null;
    const label = nature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    // Deduplicate — don't show if it's the same as energy chip
    if (existing.some(c => c.label.toLowerCase() === label.toLowerCase())) return null;
    return {
      id: 'nature',
      label,
      type: 'personality',
      icon: '🐾',
    };
  },

  // Key loves (from Mira memories or soul answers)
  (pet) => {
    const loves = pet?.doggy_soul_answers?.favourite_activities
      || pet?.doggy_soul_answers?.loves
      || pet?.mira_memories?.find(m => m.tag === 'loves')?.value;
    if (!loves) return null;
    const loveList = Array.isArray(loves) ? loves : [loves];
    if (loveList[0]) {
      return {
        id: 'loves',
        label: `Loves ${loveList[0].replace(/_/g, ' ').toLowerCase()}`,
        type: 'preference',
        icon: '❤️',
      };
    }
    return null;
  },

  // Age stage
  (pet) => {
    const dob = pet?.date_of_birth || pet?.dob;
    if (!dob) return null;
    const ageYears = (Date.now() - new Date(dob)) / (1000 * 60 * 60 * 24 * 365);
    if (ageYears < 1) return { id: 'age', label: 'Puppy', type: 'identity', icon: '🐶' };
    if (ageYears > 8) return { id: 'age', label: 'Senior', type: 'identity', icon: '🌟' };
    return null;
  },

  // Breed (only if Indie / mixed, otherwise too generic)
  (pet) => {
    const breed = pet?.breed;
    if (breed && breed.toLowerCase().includes('indie')) {
      return { id: 'breed', label: 'Indie', type: 'identity', icon: '🐕' };
    }
    return null;
  },
];

export function useSoulChips(pet, maxChips = 5) {
  return useMemo(() => {
    if (!pet) return [];

    const chips = [];
    const seenLabels = new Set();

    for (const extractor of CHIP_EXTRACTORS) {
      if (chips.length >= maxChips) break;
      try {
        const chip = extractor(pet, chips);
        if (!chip) continue;
        // DEDUPLICATION: skip if label already seen (case-insensitive)
        const normalised = chip.label.toLowerCase().trim();
        if (seenLabels.has(normalised)) continue;
        seenLabels.add(normalised);
        chips.push(chip);
      } catch (e) {
        // Silent fail — never crash the UI for a missing chip
      }
    }

    // Bible §3.2: minimum 1 chip always (soul score chip as fallback)
    if (chips.length === 0) {
      const score = pet?.overall_score || pet?.soul_score || 0;
      chips.push({
        id: 'soul',
        label: score >= 80 ? 'Deeply known' : 'Getting to know',
        type: 'soul',
        icon: '✦',
      });
    }

    return chips;
  }, [pet, maxChips]);
}

// ─── SoulChips component ─────────────────────────────────────────────────────
// Drop-in replacement for whatever renders the chips row in MiraDemoPage
// Props: pet (object), onSoulClick (fn) — opens soul profile

export function SoulChips({ pet, onSoulClick, style = {} }) {
  const chips = useSoulChips(pet);
  const score = pet?.overall_score || pet?.soul_score || 0;

  const chipStyle = (type) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: type === 'soul' ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s',
    ...(type === 'health'
      ? { background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }
      : type === 'personality'
      ? { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#C4B5FD' }
      : type === 'preference'
      ? { background: 'rgba(232,160,69,0.12)', border: '1px solid rgba(232,160,69,0.25)', color: '#FCD34D' }
      : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }
    ),
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', ...style }}>
      {/* Soul score chip — always first, clickable */}
      <div
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(201,109,158,0.25))',
          border: '1px solid rgba(139,92,246,0.4)',
          color: '#E9D5FF', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onClick={onSoulClick}
        onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(201,109,158,0.4))'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(201,109,158,0.25))'; }}
      >
        <span style={{ fontSize: '14px' }}>✦</span>
        {score}% SOUL
        <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
      </div>

      {/* Distinct trait chips — deduplicated */}
      {chips.map(chip => (
        <div key={chip.id} style={chipStyle(chip.type)}>
          {chip.label}
        </div>
      ))}
    </div>
  );
}

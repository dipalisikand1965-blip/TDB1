/**
 * CareHero.jsx — Hero for /care
 * Mirror of DineHero.jsx — same structure, sage green palette.
 *
 * Layout: Avatar centred · eyebrow chip · title · soul chips · Mira quote · scroll chevron
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────
const CLEAN_NONE = /^(no|none|none_confirmed|no_allergies|no allergies|n\/a)$/i;

function getAllergies(pet) {
  const s = new Set();
  const add = v => {
    if (Array.isArray(v)) v.forEach(x => { if (x && !CLEAN_NONE.test(String(x).trim())) s.add(x); });
    else if (v && !CLEAN_NONE.test(String(v).trim())) s.add(v);
  };
  add(pet?.preferences?.allergies);
  add(pet?.doggy_soul_answers?.food_allergies);
  add(pet?.doggy_soul_answers?.allergies);
  add(pet?.allergies);
  return [...s].filter(a => a && !CLEAN_NONE.test(String(a).trim()));
}

// ── SoulChip ───────────────────────────────────────────────────
const SoulChip = ({ icon, label, value, chipStyle }) => (
  <motion.div
    initial={{ opacity: 1, scale: 1 }}
    animate={{ opacity: 1, scale: 1 }}
    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white"
    style={chipStyle}
  >
    <span>{icon}</span>
    {label && <span style={{ opacity: 0.75 }}>{label}:</span>}
    <span>{value}</span>
  </motion.div>
);

// ── Mira quote card ────────────────────────────────────────────
const MiraQuoteCard = ({ pet }) => {
  const petName = pet?.name || 'your dog';

  const quote = useMemo(() => {
    const coat = pet?.doggy_soul_answers?.coat_type || pet?.coat_type;
    const breed = (pet?.breed || '').trim();
    const comfort = pet?.doggy_soul_answers?.grooming_comfort;
    const condition = (() => {
      const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
      if (!raw) return null;
      const s = Array.isArray(raw) ? raw.join(', ') : String(raw);
      return s.toLowerCase() === 'none' || !s.trim() ? null : s;
    })();

    if (breed && coat && comfort) {
      return `I know ${petName} is a ${breed} with a ${coat.toLowerCase()} coat — and they're ${comfort.toLowerCase()} with grooming. Every product here is perfectly matched.${condition ? ` And I'm keeping ${petName}'s ${condition} in mind throughout.` : ''}`;
    }
    if (breed && coat) {
      return `I've matched everything to ${petName}'s ${coat.toLowerCase()} coat. As a ${breed}, their care needs are specific — everything here is chosen for that.`;
    }
    if (breed) {
      return `I know ${petName} is a ${breed}. I've curated their care essentials around their breed — grooming, wellness, and coat care all in one place.`;
    }
    if (coat && comfort) {
      return `I know ${petName} has a ${coat.toLowerCase()} coat and is ${comfort.toLowerCase()} with grooming. Everything here is matched to that.`;
    }
    if (coat) {
      return `${petName}'s ${coat.toLowerCase()} coat deserves nothing but the finest care. I've chosen every product with that in mind.`;
    }
    return `I know ${petName}'s needs as well as I know their soul. Every product here has been filtered and chosen just for them.`;
  }, [pet]);

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="inline-flex items-start gap-2.5 rounded-xl p-3 mt-4"
      style={{
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.15)',
        maxWidth: 440,
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
        style={{ background: 'linear-gradient(135deg, #40916C, #74C69D)' }}
      >
        ✦
      </div>
      <div>
        <p className="text-sm text-white leading-relaxed">"{quote}"</p>
        <span className="text-[12px] block mt-0.5" style={{ color: '#74C69D' }}>
          ♥ Mira knows {pet?.name || 'your dog'}
        </span>
      </div>
    </motion.div>
  );
};

// ── main component ─────────────────────────────────────────────
const CareHero = ({ pet, soulScore }) => {
  const petName = pet?.name || 'your dog';
  const score = Math.round(soulScore || pet?.soul_score || pet?.overall_score || 0);
  const petPhoto = pet?.photo_url || pet?.image_url || pet?.image || null;

  const soulEyebrow = score >= 100
    ? `✦ ${petName}'s care profile is complete. Mira knows everything.`
    : `✦ Care & Wellbeing for ${petName}`;

  const soulChips = useMemo(() => {
    const chips = [];

    // 1. Breed chip (replaces allergy — care is about breed, not food)
    const breed = (pet?.breed || '').trim();
    if (breed) {
      chips.push({
        id: 'breed',
        icon: '🐾',
        label: 'Breed',
        value: breed,
        chipStyle: { background: 'rgba(64,145,108,0.20)', border: '1px solid rgba(116,198,157,0.60)' },
      });
    }

    // 2. Coat type
    const coat = pet?.doggy_soul_answers?.coat_type || pet?.coat_type;
    if (coat) {
      chips.push({
        id: 'coat',
        icon: '🌿',
        label: 'Coat',
        value: coat,
        chipStyle: { background: 'rgba(64,145,108,0.15)', border: '1px solid rgba(116,198,157,0.50)' },
      });
    }

    // 3. Personality / archetype (keep — relevant to care)
    const traits = [];
    const describe3 = pet?.doggy_soul_answers?.describe_3_words;
    if (describe3) traits.push(...describe3.split(/[,·]/).map(w => w.trim()).filter(Boolean).slice(0, 2));
    const archetype = pet?.soul_archetype?.archetype_name;
    if (archetype) traits.push(archetype);
    if (traits.length > 0) {
      chips.push({
        id: 'personality',
        icon: '✦',
        label: null,
        value: traits.slice(0, 2).join(' · '),
        chipStyle: { background: 'rgba(116,198,157,0.10)', border: '1px solid rgba(116,198,157,0.40)' },
      });
    }

    return chips;
  }, [pet]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #051209 0%, #0A2818 25%, #1B4332 55%, #2D6A4F 80%, #40916C 100%)',
        minHeight: 360,
        padding: '40px 32px 0 32px',
      }}
      data-testid="care-hero"
    >
      {/* Glow orbs */}
      <div className="absolute pointer-events-none" style={{
        width: 400, height: 400,
        top: -100, right: -80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(64,145,108,0.28) 0%, transparent 70%)',
        zIndex: 1,
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 250, height: 250,
        bottom: 0, left: 80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(116,198,157,0.16) 0%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Inner layout */}
      <div
        className="relative flex flex-col items-center gap-5 max-w-5xl mx-auto pb-8"
        style={{ zIndex: 2 }}
      >
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-shrink-0 flex flex-col items-center"
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 96, height: 96,
              borderRadius: '50%',
              border: '3px solid transparent',
              background: 'linear-gradient(#1B4332, #1B4332) padding-box, linear-gradient(135deg, #74C69D, #40916C) border-box',
            }}
          >
            {petPhoto ? (
              <img
                src={petPhoto}
                alt={petName}
                style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: 44 }}>🐕</span>
            )}
            {/* Soul % badge */}
            <div
              className="absolute whitespace-nowrap rounded-full text-white font-bold"
              style={{
                bottom: -8, left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #40916C, #2D6A4F)',
                fontSize: 10, fontWeight: 700,
                padding: '2px 8px',
              }}
            >
              Soul {score}%
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center text-center">
          {/* Eyebrow chip */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 text-[11px]"
            style={{
              background: 'rgba(116,198,157,0.15)',
              border: '1px solid rgba(116,198,157,0.30)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {soulEyebrow}
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ lineHeight: 1.1, marginBottom: 8 }}
          >
            <span
              className="block font-extrabold"
              style={{
                fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
                color: '#74C69D',
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Care &amp; Wellbeing
            </span>
            <span
              className="block font-extrabold"
              style={{
                fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              <span style={{ color: '#FFFFFF' }}>for </span>
              <span style={{ color: '#B7E4C7' }}>{petName}</span>
            </span>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm mb-4"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Everything {petName} needs to feel their best — filtered and matched by Mira
          </motion.p>

          {/* Soul chips */}
          {soulChips.length > 0 && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-2 mb-2"
            >
              {soulChips.map(chip => (
                <SoulChip key={chip.id} {...chip} />
              ))}
            </motion.div>
          )}

          {/* Mira quote */}
          <MiraQuoteCard pet={pet} />
        </div>
      </div>

      {/* Scroll chevron */}
      <motion.div
        className="flex justify-center pb-4 relative"
        style={{ zIndex: 2 }}
        animate={{ y: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ChevronDown className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.40)' }} />
      </motion.div>
    </section>
  );
};

export default CareHero;

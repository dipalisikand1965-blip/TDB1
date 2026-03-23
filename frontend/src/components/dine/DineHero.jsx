/**
 * DineHero.jsx
 *
 * THE ARRIVAL — Hero for /dine
 * Mirror of CelebrateHero.jsx — same structure, same golden principles.
 * Amber/terracotta colour identity instead of purple.
 *
 * Layout:
 *  - Desktop: flex row (avatar left, content right), max-w-5xl centred
 *  - Mobile: stacked centred
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────
const SoulChip = ({ icon, label, value, chipStyle }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-white"
    style={chipStyle}
  >
    <span>{icon}</span>
    {label && <span style={{ opacity: 0.75 }}>{label}:</span>}
    <span>{value}</span>
  </motion.div>
);

const MiraQuoteCard = ({ pet }) => {
  const petName = pet?.name || 'your dog';

  const quote = useMemo(() => {
    const allergies = (() => {
      const a = pet?.allergies || [];
      const fromSoul = pet?.doggy_soul_answers?.food_allergies;
      return [
        ...a,
        ...(Array.isArray(fromSoul) ? fromSoul : fromSoul ? [fromSoul] : [])
      ].filter(v => v && v.toLowerCase() !== 'none' && v !== 'none_confirmed');
    })();

    const loves = (() => {
      const l = [];
      const add = (v) => {
        const s = typeof v === 'string' ? v : (v?.name || v?.value || null);
        if (s && !s.includes('Persistence Test') && !s.includes('c6be919d')) l.push(s);
      };
      add(pet?.doggy_soul_answers?.favorite_treats);
      add(pet?.doggy_soul_answers?.favorite_protein);
      if (pet?.favorite_foods?.length) add(pet.favorite_foods[0]);
      return [...new Set(l)].slice(0, 2);
    })();

    const healthRaw = pet?.health_condition || pet?.doggy_soul_answers?.health_condition || '';
    const healthCond = (healthRaw && healthRaw.toLowerCase() !== 'none' && healthRaw.toLowerCase() !== 'none_confirmed' && healthRaw.trim() !== '') ? healthRaw : '';

    if (allergies.length > 0) {
      return `I've already removed everything containing ${allergies.slice(0, 2).join(' and ')}. What you see is safe.${healthCond ? ` I'm also keeping ${petName}'s ${healthCond} in mind.` : ''}`;
    }
    if (loves.length >= 2) {
      return `I know ${petName} loves ${loves[0]} and ${loves[1]}. Every meal here is filtered for them — nothing else.`;
    }
    if (loves.length === 1) {
      return `I know ${petName} loves ${loves[0]}. I've kept that in mind across everything here.`;
    }
    return `I know ${petName}'s body as well as I know their soul. Everything here has been filtered and chosen for them.`;
  }, [pet]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
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
        style={{ background: 'linear-gradient(135deg, #FF8C42, #FF6B9D)' }}
      >
        ✦
      </div>
      <div>
        <p className="text-sm text-white leading-relaxed">"{quote}"</p>
        <span className="text-[12px] block mt-0.5" style={{ color: '#FFD080' }}>
          ♥ Mira knows {pet?.name || 'your dog'}
        </span>
      </div>
    </motion.div>
  );
};

// ── main component ───────────────────────────────────────────────────────────
const DineHero = ({ pet, soulScore }) => {
  const petName = pet?.name || 'your dog';
  const score   = Math.round(soulScore || pet?.soul_score || pet?.overall_score || 0);
  const petPhoto = pet?.photo_url || pet?.image_url || pet?.image || null;

  // Eyebrow — same logic as Celebrate
  const soulEyebrow = score >= 100
    ? `✦ ${petName}'s soul is fully known. Mira knows everything.`
    : `✦ Food & Nourishment for ${petName}`;

  // Soul chips — Allergy · Loves · Personality (3 chips like Celebrate)
  const soulChips = useMemo(() => {
    const chips = [];

    // 1. Allergies
    const raw = pet?.allergies || [];
    const fromSoul = pet?.doggy_soul_answers?.food_allergies;
    const allAllergies = [
      ...raw,
      ...(Array.isArray(fromSoul) ? fromSoul : fromSoul ? [fromSoul] : [])
    ].filter(v => v && v.toLowerCase() !== 'none' && v !== 'none_confirmed');
    if (allAllergies.length > 0) {
      chips.push({
        id: 'allergy',
        icon: '🚫',
        label: 'Allergy',
        value: allAllergies.slice(0, 2).join(', '),
        chipStyle: {
          background: 'rgba(255,107,157,0.12)',
          border: '1px solid rgba(255,107,157,0.50)',
        },
      });
    }

    // 2. Loves (food-focused)
    const loves = [];
    const addLove = (v) => {
      const s = typeof v === 'string' ? v : (v?.name || v?.value || null);
      if (s && !s.includes('Persistence Test') && !s.includes('c6be919d')) loves.push(s);
    };
    addLove(pet?.doggy_soul_answers?.favorite_treats);
    addLove(pet?.doggy_soul_answers?.favorite_protein);
    if (pet?.favorite_foods?.length) addLove(pet.favorite_foods[0]);
    const uniqueLoves = [...new Set(loves)].slice(0, 3);
    if (uniqueLoves.length > 0) {
      chips.push({
        id: 'loves',
        icon: '💚',
        label: 'Loves',
        value: uniqueLoves.join(' · '),
        chipStyle: {
          background: 'rgba(255,208,128,0.10)',
          border: '1px solid rgba(255,208,128,0.50)',
        },
      });
    }

    // 3. Personality traits (same as Celebrate)
    const traits = [];
    const describe3 = pet?.doggy_soul_answers?.describe_3_words;
    if (describe3) {
      traits.push(...describe3.split(/[,·]/).map(w => w.trim()).filter(Boolean).slice(0, 2));
    }
    const archetype = pet?.soul_archetype?.archetype_name;
    if (archetype) traits.push(archetype);
    if (traits.length > 0) {
      chips.push({
        id: 'personality',
        icon: '✦',
        label: null,
        value: traits.slice(0, 3).join(' · '),
        chipStyle: {
          background: 'rgba(196,77,255,0.10)',
          border: '1px solid rgba(196,77,255,0.50)',
        },
      });
    }

    return chips;
  }, [pet]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2d0800 0%, #5a1500 30%, #a33000 65%, #d45500 100%)',
        minHeight: 360,
        padding: '40px 32px 0 32px',
      }}
      data-testid="dine-hero"
    >
      {/* Glow orbs */}
      <div className="absolute pointer-events-none" style={{
        width: 400, height: 400,
        top: -100, right: -80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,140,66,0.30) 0%, transparent 70%)',
        zIndex: 1,
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 250, height: 250,
        bottom: 0, left: 80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(196,77,255,0.18) 0%, transparent 70%)',
        zIndex: 1,
      }} />

      {/* Inner layout — always centred column, matches CelebrateHero */}
      <div
        className="relative flex flex-col items-center gap-5 max-w-5xl mx-auto pb-8"
        style={{ zIndex: 2 }}
      >
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-shrink-0 flex flex-col items-center"
        >
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 96, height: 96,
              borderRadius: '50%',
              border: '3px solid transparent',
              background: 'linear-gradient(#5a1500, #5a1500) padding-box, linear-gradient(135deg, #00E676, #FF8C42) border-box',
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
                background: 'linear-gradient(135deg, #FF8C42, #C44DFF)',
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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 text-[11px]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {soulEyebrow}
          </motion.div>

          {/* Title — Georgia serif, same clamp as Celebrate */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ lineHeight: 1.1, marginBottom: 8 }}
          >
            <span
              className="block font-extrabold"
              style={{
                fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
                color: '#FFD080',
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              Food &amp; Nourishment
            </span>
            <span
              className="block font-extrabold"
              style={{
                fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              <span style={{ color: '#FFFFFF' }}>for </span>
              <span style={{ color: '#FFAAD4' }}>{petName}</span>
            </span>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm mb-4"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            Mark the meals that matter — the way {petName} actually eats
          </motion.p>

          {/* Soul chips */}
          {soulChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-2 mb-2"
            >
              {soulChips.map((chip) => (
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

export default DineHero;

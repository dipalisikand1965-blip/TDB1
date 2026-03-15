/**
 * DineHero.jsx — /dine pillar hero
 *
 * Mirrors CelebrateHero exactly in structure:
 *   - Full-bleed section (no border radius, no max-width)
 *   - Avatar column (left) + Content column (right)
 *   - Soul % chip, eyebrow, title, subtitle, soul chips, Mira quote
 *   - ChevronDown scroll indicator
 *   - Motion animations (framer-motion)
 *
 * COLOUR WORLD: Amber / terracotta — distinct from /celebrate (purple)
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Utensils, ChevronDown } from 'lucide-react';

// ─── Soul Chip ───────────────────────────────────────────────────────────────
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

// ─── Mira Quote Card ─────────────────────────────────────────────────────────
const MiraQuoteCard = ({ pet }) => {
  const petName = pet?.name || 'your dog';
  const allergies = useMemo(() => {
    const s = new Set();
    const add = (v) => {
      if (Array.isArray(v)) v.forEach(x => x && s.add(x));
      else if (v) s.add(v);
    };
    add(pet?.preferences?.allergies);
    add(pet?.doggy_soul_answers?.food_allergies || pet?.doggy_soul_answers?.allergies);
    add(pet?.allergies);
    return [...s].filter(a => a && a.toLowerCase() !== 'none');
  }, [pet]);

  const healthCondition = (() => {
    const raw = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
    if (!raw) return null;
    const str = Array.isArray(raw) ? raw.join(', ') : String(raw);
    return str.toLowerCase() === 'none' || str.trim() === '' ? null : str;
  })();

  let quote = '';
  if (allergies.length > 0 && healthCondition) {
    quote = `I've removed everything containing ${allergies.join(' and ')}. I'm keeping ${petName}'s ${healthCondition} in mind with everything I suggest here.`;
  } else if (allergies.length > 0) {
    quote = `I've already removed everything containing ${allergies.slice(0, 2).join(' and ')}. What you see is safe for ${petName}.`;
  } else if (healthCondition) {
    quote = `I know ${petName}'s ${healthCondition}. Everything I show you here has been filtered with that in mind.`;
  } else {
    quote = `I know ${petName}'s body as well as I know their soul. Everything here has been filtered for them.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="inline-flex items-start gap-2.5 rounded-xl p-3 mt-4"
      style={{
        background: 'rgba(255,255,255,0.10)',
        border: '1px solid rgba(255,255,255,0.15)',
        maxWidth: 440
      }}
    >
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
        style={{ background: 'linear-gradient(135deg, #FF8C42, #C44400)' }}
      >
        ✦
      </div>
      <div>
        <p className="text-sm text-white leading-relaxed">"{quote}"</p>
        <span className="text-[12px] block mt-0.5" style={{ color: '#FFD0A0' }}>
          ♥ Mira knows {petName}
        </span>
      </div>
    </motion.div>
  );
};

// ─── Main Hero ────────────────────────────────────────────────────────────────
const DineHero = ({ pet, soulScore, onAskMira }) => {
  const petName = pet?.name || 'your dog';
  const score = soulScore || pet?.soul_score || pet?.overall_score || 0;
  const petPhoto = pet?.photo_url || pet?.image_url || pet?.image || null;

  const soulEyebrow = score >= 100
    ? `✦ ${petName}'s soul is fully known. Mira knows everything.`
    : `🍽️ ${petName}'s soul is ${Math.round(score)}% discovered — keep going!`;

  const soulChips = useMemo(() => {
    const chips = [];

    // Allergies
    const s = new Set();
    const add = (v) => {
      if (Array.isArray(v)) v.forEach(x => x && s.add(x));
      else if (v) s.add(v);
    };
    add(pet?.preferences?.allergies);
    add(pet?.doggy_soul_answers?.food_allergies || pet?.doggy_soul_answers?.allergies);
    add(pet?.allergies);
    const allergies = [...s].filter(a => a && a.toLowerCase() !== 'none');
    if (allergies.length > 0) {
      chips.push({
        id: 'allergy',
        icon: '🚫',
        label: 'No',
        value: allergies.slice(0, 2).join(', '),
        chipStyle: {
          background: 'rgba(255,107,157,0.12)',
          border: '1px solid rgba(255,107,157,0.50)'
        }
      });
    }

    // Loves
    const loves = [];
    const addLove = (item) => {
      if (!item) return;
      const v = typeof item === 'string' ? item : (item?.name || item?.value || null);
      if (v) loves.push(v);
    };
    addLove(pet?.doggy_soul_answers?.favorite_treats);
    addLove(pet?.doggy_soul_answers?.favorite_protein);
    if (pet?.preferences?.favorite_flavors?.length) addLove(pet.preferences.favorite_flavors[0]);
    const uniqueLoves = [...new Set(loves)].slice(0, 2);
    if (uniqueLoves.length > 0) {
      chips.push({
        id: 'loves',
        icon: '💚',
        label: 'Loves',
        value: uniqueLoves.join(' · '),
        chipStyle: {
          background: 'rgba(255,208,128,0.10)',
          border: '1px solid rgba(255,208,128,0.50)'
        }
      });
    }

    // Health condition
    const rawHealth = pet?.health?.medical_conditions || pet?.doggy_soul_answers?.health_conditions;
    if (rawHealth) {
      const str = Array.isArray(rawHealth) ? rawHealth.join(', ') : String(rawHealth);
      if (str.toLowerCase() !== 'none' && str.trim() !== '') {
        chips.push({
          id: 'health',
          icon: '🛡️',
          label: null,
          value: str.length > 20 ? str.substring(0, 20) + '…' : str,
          chipStyle: {
            background: 'rgba(196,77,255,0.10)',
            border: '1px solid rgba(196,77,255,0.50)'
          }
        });
      }
    }

    return chips;
  }, [pet]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3d1200 0%, #7a2800 40%, #c44400 75%, #e86a00 100%)',
        minHeight: '360px',
        padding: '40px 32px 0 32px'
      }}
      data-testid="dine-hero"
    >
      {/* Glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400,
          top: -100, right: -80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,140,66,0.30) 0%, transparent 70%)',
          zIndex: 1
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 250, height: 250,
          bottom: 0, left: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,77,255,0.15) 0%, transparent 70%)',
          zIndex: 1
        }}
      />

      {/* Inner Layout: flex row desktop, flex col mobile */}
      <div
        className="relative flex flex-col md:flex-row items-center md:items-start gap-7 max-w-5xl mx-auto pb-8"
        style={{ zIndex: 2 }}
      >
        {/* Avatar column */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-shrink-0 flex flex-col items-center"
        >
          {/* Avatar ring with gradient border */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 96, height: 96,
              borderRadius: '50%',
              border: '3px solid transparent',
              background: 'linear-gradient(#3d1200, #3d1200) padding-box, linear-gradient(135deg, #00E676, #FF8C42) border-box'
            }}
          >
            {petPhoto ? (
              <img
                src={petPhoto}
                alt={petName}
                className="w-full h-full object-cover rounded-full"
                style={{ width: 84, height: 84, borderRadius: '50%' }}
              />
            ) : (
              <span className="text-5xl">🐕</span>
            )}

            {/* Soul % chip */}
            <div
              className="absolute whitespace-nowrap rounded-full text-white font-bold"
              style={{
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(135deg, #FF8C42, #C44DFF)',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px'
              }}
            >
              Soul {Math.round(score)}%
            </div>
          </div>
        </motion.div>

        {/* Content column */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
          {/* Eyebrow chip */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-3 text-[11px]"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.20)',
              color: 'rgba(255,255,255,0.85)'
            }}
          >
            {soulEyebrow}
          </motion.div>

          {/* Title */}
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
                fontFamily: "Georgia, 'Times New Roman', serif"
              }}
            >
              Food &amp; Nourishment
            </span>
            <span
              className="block font-extrabold"
              style={{
                fontSize: 'clamp(1.875rem, 4vw, 2.5rem)',
                fontFamily: "Georgia, 'Times New Roman', serif"
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
            Mira knows {petName}'s body as well as she knows their soul
          </motion.p>

          {/* Soul chips */}
          {soulChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center md:justify-start gap-2 mb-2"
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

      {/* Bottom scroll indicator */}
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

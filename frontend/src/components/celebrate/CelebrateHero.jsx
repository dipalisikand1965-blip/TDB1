/**
 * CelebrateHero.jsx
 * 
 * THE ARRIVAL - Hero component for Celebrate page
 * Spec: /app/memory/docs/CELEBRATE_UI_SPEC.md
 * 
 * Layout:
 * - Desktop: flex row (avatar left, content right)
 * - Mobile: stacked centered
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, ChevronDown } from 'lucide-react';

// Helper to calculate days until birthday
const getDaysUntilBirthday = (birthDate) => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
  return Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
};

const isTodayBirthday = (birthDate) => {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
};

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

const MiraQuoteCard = ({ pet, daysUntilBirthday, isBirthdayToday }) => {
  const petName = pet?.name || 'your pet';

  const favorites = useMemo(() => {
    const faves = [];
    const extract = (item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') return item.name || item.value || item.label || null;
      return null;
    };
    const addFave = (item) => {
      const v = extract(item);
      if (v && !v.includes('Persistence Test') && !v.includes('c6be919d')) faves.push(v);
    };
    addFave(pet?.doggy_soul_answers?.favorite_treats);
    addFave(pet?.doggy_soul_answers?.favorite_protein);
    if (pet?.favorites?.length) pet.favorites.slice(0, 2).forEach(addFave);
    if (pet?.favorite_treats?.length) pet.favorite_treats.slice(0, 2).forEach(addFave);
    return [...new Set(faves)].slice(0, 2);
  }, [pet]);

  let quote = '';
  if (isBirthdayToday) {
    quote = `Today is the most important day of the year. Happy birthday, ${petName}. You are so loved.`;
  } else if (daysUntilBirthday && daysUntilBirthday <= 30) {
    quote = `${petName}'s birthday is in ${daysUntilBirthday} days. Mira is already thinking about how to make it perfect.`;
  } else if (favorites.length >= 2) {
    quote = `Every day with ${petName} is worth celebrating — especially the ones with ${favorites[0]} and ${favorites[1]}!`;
  } else if (favorites.length === 1) {
    quote = `Every day with ${petName} is worth celebrating — especially the ones with ${favorites[0]}!`;
  } else {
    quote = `Every day with ${petName} is worth celebrating — and Mira is here to make each moment special.`;
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
        style={{ background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)' }}
      >
        ✦
      </div>
      <div>
        <p className="text-sm text-white leading-relaxed">"{quote}"</p>
        <span className="text-[12px] block mt-0.5" style={{ color: '#FFAAD4' }}>
          ♥ Mira knows {petName}
        </span>
      </div>
    </motion.div>
  );
};

const CelebrateHero = ({ pet, soulScore }) => {
  const petName = pet?.name || 'your pet';
  const score = soulScore || pet?.soul_score || pet?.overall_score || 0;
  const birthDate = pet?.birth_date || pet?.birthday;
  const daysUntilBirthday = getDaysUntilBirthday(birthDate);
  const birthdayToday = isTodayBirthday(birthDate);

  // Pet photo: check multiple possible field names
  const petPhoto = pet?.photo_url || pet?.image_url || pet?.image || null;

  // Soul eyebrow
  const soulEyebrow = score >= 100
    ? `✦ ${petName}'s soul is fully known. Mira knows everything.`
    : `👑 ${petName}'s soul is ${Math.round(score)}% discovered — keep going!`;

  // Soul chips
  const soulChips = useMemo(() => {
    const chips = [];

    // 1. Allergy
    const allergies = pet?.allergies || [];
    const allergyFromSoul = pet?.doggy_soul_answers?.food_allergies;
    const allAllergies = [
      ...allergies,
      ...(Array.isArray(allergyFromSoul) ? allergyFromSoul : allergyFromSoul ? [allergyFromSoul] : [])
    ].filter(a => a && a.toLowerCase() !== 'none');
    if (allAllergies.length > 0) {
      chips.push({
        id: 'allergy',
        icon: '🚫',
        label: 'Allergy',
        value: allAllergies.slice(0, 2).join(', '),
        chipStyle: {
          background: 'rgba(255,107,157,0.12)',
          border: '1px solid rgba(255,107,157,0.50)'
        }
      });
    }

    // 2. Loves
    const loves = [];
    const addLove = (item) => {
      if (!item) return;
      const v = typeof item === 'string' ? item : (item?.name || item?.value || null);
      if (v && !v.includes('Persistence Test') && !v.includes('c6be919d')) loves.push(v);
    };
    addLove(pet?.doggy_soul_answers?.favorite_treats);
    addLove(pet?.doggy_soul_answers?.favorite_protein);
    if (pet?.favorite_toys?.length) addLove(pet.favorite_toys[0]);
    if (pet?.doggy_soul_answers?.car_rides?.toLowerCase()?.includes('love')) loves.push('car rides');
    const uniqueLoves = [...new Set(loves)].slice(0, 3);
    if (uniqueLoves.length > 0) {
      chips.push({
        id: 'loves',
        icon: '⭐',
        label: 'Loves',
        value: uniqueLoves.join(' · '),
        chipStyle: {
          background: 'rgba(255,208,128,0.10)',
          border: '1px solid rgba(255,208,128,0.50)'
        }
      });
    }

    // 3. Personality
    const traits = [];
    const describe3Words = pet?.doggy_soul_answers?.describe_3_words;
    if (describe3Words) {
      traits.push(...describe3Words.split(/[,·]/).map(w => w.trim()).filter(Boolean).slice(0, 2));
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
          border: '1px solid rgba(196,77,255,0.50)'
        }
      });
    }

    return chips;
  }, [pet]);

  return (
    <section
      className="relative w-full overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a0020 0%, #3d0060 40%, #6b0099 75%, #9b0cbf 100%)',
        minHeight: '360px',
        padding: '40px 32px 0 32px'
      }}
      data-testid="celebrate-hero"
    >
      {/* Glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 400, height: 400,
          top: -100, right: -80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,77,255,0.30) 0%, transparent 70%)',
          zIndex: 1
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 250, height: 250,
          bottom: 0, left: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,157,0.20) 0%, transparent 70%)',
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
              background: 'linear-gradient(#3d0060, #3d0060) padding-box, linear-gradient(135deg, #00E676, #C44DFF) border-box'
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
                background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
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
              Celebrations
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
            Mark the moments that matter — the way {petName} actually lives
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
          <MiraQuoteCard
            pet={pet}
            daysUntilBirthday={daysUntilBirthday}
            isBirthdayToday={birthdayToday}
          />
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

export default CelebrateHero;

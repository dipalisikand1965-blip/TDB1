/**
 * CelebrateHero.jsx
 * 
 * THE ARRIVAL - Hero component for Celebrate page
 * Shows: Pet avatar, Soul Score, Soul Chips, Mira's Quote
 * 
 * Soul Chips (max 3):
 * 1. Allergy (if present) - safety first
 * 2. Loves - top favorites
 * 3. Personality - traits + archetype
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Heart, AlertCircle, Star, ChevronDown } from 'lucide-react';
import SoulScoreArc from '../SoulScoreArc';

// Helper to calculate days until birthday
const getDaysUntilBirthday = (birthDate) => {
  if (!birthDate) return null;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  // Set birthday to this year
  const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  
  // If birthday has passed this year, set to next year
  if (nextBirthday < today) {
    nextBirthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = nextBirthday - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Check if today is birthday
const isTodayBirthday = (birthDate) => {
  if (!birthDate) return false;
  
  const today = new Date();
  const birth = new Date(birthDate);
  
  return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
};

// Soul Chip Component
const SoulChip = ({ icon, label, value, variant = 'default' }) => {
  const variants = {
    allergy: 'bg-red-100/80 text-red-700 border-red-200',
    loves: 'bg-amber-100/80 text-amber-700 border-amber-200',
    personality: 'bg-purple-100/80 text-purple-700 border-purple-200',
    default: 'bg-white/20 text-white border-white/30'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full
        border backdrop-blur-sm text-sm font-medium
        ${variants[variant]}
      `}
    >
      <span>{icon}</span>
      {label && <span className="opacity-75">{label}:</span>}
      <span>{value}</span>
    </motion.div>
  );
};

// Mira Quote Card Component
const MiraQuoteCard = ({ pet, daysUntilBirthday, isBirthdayToday }) => {
  const petName = pet?.name || 'your pet';
  
  // Get favorites for quote
  const favorites = useMemo(() => {
    const faves = [];
    if (pet?.doggy_soul_answers?.favorite_treats) faves.push(pet.doggy_soul_answers.favorite_treats);
    if (pet?.favorites?.length) faves.push(...pet.favorites.slice(0, 2));
    if (pet?.favorite_treats?.length) faves.push(...pet.favorite_treats.slice(0, 2));
    return [...new Set(faves)].slice(0, 2);
  }, [pet]);

  // Determine quote based on context
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 max-w-2xl mx-auto mt-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white/90 text-lg italic leading-relaxed">
            "{quote}"
          </p>
          <p className="text-pink-300 text-sm mt-2 flex items-center gap-1">
            <Heart className="w-4 h-4 fill-pink-300" />
            Mira knows {petName}
          </p>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="flex justify-center mt-4"
        animate={{ y: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ChevronDown className="w-6 h-6 text-white/50" />
      </motion.div>
    </motion.div>
  );
};

const CelebrateHero = ({ pet, soulScore }) => {
  const petName = pet?.name || 'your pet';
  const score = soulScore || pet?.soul_score || pet?.overall_score || 0;
  const birthDate = pet?.birth_date || pet?.birthday;
  const daysUntilBirthday = getDaysUntilBirthday(birthDate);
  const birthdayToday = isTodayBirthday(birthDate);

  // Build soul chips
  const soulChips = useMemo(() => {
    const chips = [];
    
    // 1. Allergy chip (always first if present)
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
        variant: 'allergy'
      });
    }

    // 2. Loves chip
    const loves = [];
    if (pet?.doggy_soul_answers?.favorite_treats) loves.push(pet.doggy_soul_answers.favorite_treats);
    if (pet?.doggy_soul_answers?.favorite_protein) loves.push(pet.doggy_soul_answers.favorite_protein);
    if (pet?.favorite_toys?.length) loves.push(pet.favorite_toys[0]);
    if (pet?.doggy_soul_answers?.car_rides?.toLowerCase()?.includes('love')) loves.push('car rides');
    if (pet?.doggy_soul_answers?.walks_per_day) loves.push('walks');
    
    const uniqueLoves = [...new Set(loves)].slice(0, 3);
    if (uniqueLoves.length > 0) {
      chips.push({
        id: 'loves',
        icon: '⭐',
        label: 'Loves',
        value: uniqueLoves.join(' · '),
        variant: 'loves'
      });
    }

    // 3. Personality chip
    const traits = [];
    const describe3Words = pet?.doggy_soul_answers?.describe_3_words;
    if (describe3Words) {
      const words = describe3Words.split(/[,·]/).map(w => w.trim()).filter(Boolean);
      traits.push(...words.slice(0, 2));
    }
    const archetype = pet?.soul_archetype?.archetype_name;
    if (archetype) traits.push(archetype);
    
    if (traits.length > 0) {
      chips.push({
        id: 'personality',
        icon: '✦',
        label: null,
        value: traits.slice(0, 3).join(' · '),
        variant: 'personality'
      });
    }

    return chips;
  }, [pet]);

  // Soul eyebrow text
  const soulEyebrow = score >= 100 
    ? `✦ ${petName}'s soul is fully known. Mira knows everything.`
    : `👑 ${petName}'s soul is ${Math.round(score)}% discovered — keep going!`;

  return (
    <section 
      className="relative min-h-[60vh] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a0a2e 0%, #16082a 50%, #2d1b4e 100%)'
      }}
      data-testid="celebrate-hero"
    >
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 via-transparent to-purple-900/20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-pink-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10 text-center px-4 py-12 max-w-4xl mx-auto">
        {/* Soul Progress Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-sm mb-6"
        >
          {soulEyebrow}
        </motion.div>

        {/* Pet Avatar with Soul Score */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-32 h-32 mx-auto mb-6"
        >
          {/* Soul Score Arc */}
          <div className="absolute inset-0">
            <SoulScoreArc score={score} size={128} strokeWidth={4} />
          </div>
          
          {/* Pet Photo or Placeholder */}
          <div className="absolute inset-2 rounded-full overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            {pet?.image ? (
              <img 
                src={pet.image} 
                alt={petName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-5xl">🐕</span>
            )}
          </div>

          {/* Soul Score Badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold shadow-lg">
            Soul {Math.round(score)}%
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
        >
          Celebrations for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-300">
            {petName}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-white/70 mb-6"
        >
          Mark the moments that matter — the way {petName} actually lives
        </motion.p>

        {/* Soul Chips */}
        {soulChips.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-4"
          >
            {soulChips.map((chip) => (
              <SoulChip key={chip.id} {...chip} />
            ))}
          </motion.div>
        )}

        {/* Mira's Quote Card */}
        <MiraQuoteCard 
          pet={pet} 
          daysUntilBirthday={daysUntilBirthday}
          isBirthdayToday={birthdayToday}
        />
      </div>
    </section>
  );
};

export default CelebrateHero;

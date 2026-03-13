/**
 * MiraCuratedBox.jsx
 * 
 * "The {petName} Birthday Box"
 * Mira's one curated celebration suggestion
 * Dark purple card with personalized items based on soul data
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift, PartyPopper, ChevronRight } from 'lucide-react';

// Generate curated items based on pet's soul data
const generateCuratedItems = (pet) => {
  const items = [];
  const petName = pet?.name || 'your pet';
  
  // 1. Food item based on preferences (avoiding allergies)
  const allergies = (pet?.allergies || []).map(a => a?.toLowerCase());
  const favoriteProtein = pet?.doggy_soul_answers?.favorite_protein?.toLowerCase();
  
  if (favoriteProtein && !allergies.includes(favoriteProtein)) {
    items.push({
      icon: '🎂',
      name: `${favoriteProtein.charAt(0).toUpperCase() + favoriteProtein.slice(1)} birthday cake`,
      type: 'food'
    });
  } else if (!allergies.includes('salmon')) {
    items.push({ icon: '🎂', name: 'Salmon birthday cake', type: 'food' });
  } else if (!allergies.includes('beef')) {
    items.push({ icon: '🎂', name: 'Beef birthday cake', type: 'food' });
  } else {
    items.push({ icon: '🎂', name: 'Allergy-safe birthday cake', type: 'food' });
  }

  // 2. Play item based on energy/toys
  const isPlayful = pet?.doggy_soul_answers?.describe_3_words?.toLowerCase()?.includes('playful');
  const isHighEnergy = pet?.doggy_soul_answers?.energy_level?.toLowerCase()?.includes('high');
  
  if (isPlayful || isHighEnergy) {
    items.push({ icon: '🎾', name: 'Birthday tennis ball', type: 'play' });
  } else {
    items.push({ icon: '🧸', name: 'Plush birthday toy', type: 'play' });
  }

  // 3. Always include bandana
  items.push({ icon: '🎀', name: 'Custom bandana', type: 'grooming' });

  // 4. Memory item
  items.push({ icon: '💌', name: 'Memory card', type: 'memory' });

  // 5. Extra items based on personality
  const isSocialButterfly = pet?.soul_archetype?.archetype_name?.toLowerCase()?.includes('social');
  if (isSocialButterfly) {
    items.push({ icon: '🎉', name: 'Party invite pack', type: 'social' });
  }
  
  const lovesCarRides = pet?.doggy_soul_answers?.car_rides?.toLowerCase()?.includes('love');
  if (lovesCarRides) {
    items.push({ icon: '🚗', name: 'Adventure day pass', type: 'adventure' });
  }

  return items;
};

// Generate description based on pet
const generateDescription = (pet, items) => {
  const petName = pet?.name || 'your pet';
  const foodItem = items.find(i => i.type === 'food')?.name?.toLowerCase() || 'a special cake';
  const playItem = items.find(i => i.type === 'play')?.name?.toLowerCase() || 'their favorite toy';
  
  return `Mira has built one celebration that covers who ${petName} actually is — ${foodItem}, ${playItem} gift-wrapped, a birthday bandana, and a memory card. Everything ${petName} loves. Nothing they can't have.`;
};

// Item Tag Component
const ItemTag = ({ icon, name }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm border border-white/20">
    <span>{icon}</span>
    <span>{name}</span>
  </div>
);

const MiraCuratedBox = ({ pet, onBuildBox }) => {
  const petName = pet?.name || 'your pet';
  
  const curatedItems = useMemo(() => generateCuratedItems(pet), [pet]);
  const description = useMemo(() => generateDescription(pet, curatedItems), [pet, curatedItems]);
  
  const visibleItems = curatedItems.slice(0, 4);
  const extraCount = curatedItems.length - 4;

  const handleBuildBox = () => {
    if (onBuildBox) {
      onBuildBox(curatedItems);
    }
    // Navigate to occasion box builder
    window.location.href = `/occasion-box?occasion=birthday&pet=${encodeURIComponent(petName)}`;
  };

  return (
    <section className="px-6 mb-8" data-testid="mira-curated-box">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #1a0020, #3d0060)',
            padding: 28
          }}
        >
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,107,157,0.15) 0%, transparent 60%)', zIndex: 1 }} />
          
          <div className="relative flex flex-col md:flex-row gap-6" style={{ zIndex: 2 }}>
            {/* Left: Content */}
            <div className="flex-1">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-1.5 rounded-full mb-3"
                style={{
                  background: 'rgba(196,77,255,0.20)',
                  border: '1px solid rgba(196,77,255,0.40)',
                  padding: '4px 12px',
                  color: '#E0AAFF',
                  fontSize: 11,
                  fontWeight: 600
                }}
              >
                <Sparkles className="w-3 h-3" />
                Mira's pick for {petName}'s birthday
              </div>

              {/* Title */}
              <h2 className="font-extrabold text-white mb-1.5" style={{ fontSize: '1.375rem' }}>
                The <span style={{ color: '#FFAAD4' }}>{petName}</span> Birthday Box
              </h2>

              {/* Description */}
              <p className="mb-4 leading-relaxed" style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                {description}
              </p>

              {/* Item Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {visibleItems.map((item, idx) => (
                  <ItemTag key={idx} {...item} />
                ))}
                {extraCount > 0 && (
                  <div
                    className="inline-flex items-center rounded-full font-bold"
                    style={{
                      padding: '5px 12px',
                      background: 'rgba(255,255,255,0.10)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.70)',
                      fontSize: 12
                    }}
                  >
                    + {extraCount} more
                  </div>
                )}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleBuildBox}
                  className="rounded-xl font-bold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  data-testid="build-box-cta"
                >
                  <PartyPopper className="w-4 h-4 inline mr-2" />
                  Build {petName}'s Box
                </button>
                <button
                  onClick={() => window.location.href = '/occasion-box?occasion=birthday'}
                  className="rounded-xl font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.20)',
                    padding: '12px 24px',
                    fontSize: 14,
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  data-testid="birthday-box-cta"
                >
                  Birthday Box
                </button>
              </div>
            </div>

            {/* Right: Mira icon */}
            <div className="hidden md:flex flex-col items-center justify-center flex-shrink-0">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 90, height: 90,
                  background: 'linear-gradient(135deg, #C44DFF, #FF6B9D)',
                  fontSize: 40,
                  marginBottom: 8
                }}
              >
                🎂
              </motion.div>
              <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12, textAlign: 'center' }}>
                Curated by Mira
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MiraCuratedBox;

/**
 * MiraCuratedBox.jsx
 * 
 * "The {petName} Birthday Box"
 * Mira's one curated celebration suggestion
 * Dark purple card with personalized items based on soul data
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift, PartyPopper } from 'lucide-react';
import { Button } from '../ui/button';

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
    } else {
      // Fallback: dispatch event
      window.dispatchEvent(new CustomEvent('openBoxBuilder', { 
        detail: { items: curatedItems, petName } 
      }));
    }
  };

  return (
    <section className="py-12 px-4" data-testid="mira-curated-box">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1a0a2e 100%)'
          }}
        >
          {/* Gradient overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row gap-8">
            {/* Left: Content */}
            <div className="flex-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 backdrop-blur-sm text-white text-sm mb-4 border border-purple-400/30">
                <Sparkles className="w-4 h-4" />
                <span>Mira's pick for {petName}'s birthday</span>
              </div>

              {/* Title */}
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                The <span className="text-pink-400">{petName}</span> Birthday Box
              </h2>

              {/* Description */}
              <p className="text-white/70 text-lg leading-relaxed mb-6">
                {description}
              </p>

              {/* Item Tags */}
              <div className="flex flex-wrap gap-3 mb-6">
                {visibleItems.map((item, idx) => (
                  <ItemTag key={idx} {...item} />
                ))}
                {extraCount > 0 && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/70 text-sm border border-white/20">
                    + {extraCount} more
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={handleBuildBox}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-6 py-3 rounded-full text-lg font-medium shadow-lg shadow-purple-500/30"
                data-testid="build-box-cta"
              >
                <PartyPopper className="w-5 h-5 mr-2" />
                Build {petName}'s Box
              </Button>
            </div>

            {/* Right: Mira Icon */}
            <div className="hidden md:flex flex-col items-center justify-center">
              {/* Mira Avatar */}
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-2xl shadow-purple-500/50"
              >
                <Sparkles className="w-12 h-12 text-white" />
              </motion.div>
              <p className="text-white/60 text-sm mt-4 text-center">
                Mira knows {petName}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MiraCuratedBox;

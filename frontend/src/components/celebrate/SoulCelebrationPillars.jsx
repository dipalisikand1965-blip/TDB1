/**
 * SoulCelebrationPillars.jsx
 * 
 * THE HEART OF SOUL-FIRST CELEBRATION
 * 8 interactive pillars that glow based on pet's soul data
 * 
 * States:
 * - GLOW: Full opacity, coloured dot, personality badge
 * - DIM: 60% opacity, "Explore" badge
 * - INCOMPLETE: 50% opacity, lock icon, "Tell Mira more" badge
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import SoulPillarExpanded from './SoulPillarExpanded';

// Pillar definitions with all copy from spec
const SOUL_PILLARS = [
  {
    id: 'food',
    icon: '🍰',
    name: 'Food & Flavour',
    color: '#FEF3C7',
    borderColor: '#F59E0B',
    tagline: (petName) => `Salmon cake, allergy-safe treats, birthday feast`,
    glowBadge: (petName) => `${petName} loves this`,
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Complete ${petName}'s food preferences to unlock`,
    miraQuote: (pet) => `"We know ${pet.name} loves ${pet.favorites?.[0] || 'treats'} and can't have ${pet.allergies?.[0] || 'nothing specific'}. Every item here is checked. Nothing that would hurt them, everything that makes them happy."`,
    tabs: ['Birthday Cakes', 'Breed Cakes', 'Pupcakes', 'Desi Treats', 'Gift Hampers', 'Treat Boxes'],
    glowCondition: (pet) => {
      const hasAllergies = pet?.allergies?.length > 0 || pet?.doggy_soul_answers?.food_allergies;
      const hasFavoriteProtein = pet?.doggy_soul_answers?.favorite_protein;
      const hasFoodPrefs = pet?.doggy_soul_answers?.food_motivation || pet?.doggy_soul_answers?.treat_preference;
      return hasAllergies || hasFavoriteProtein || hasFoodPrefs;
    },
    incompleteCondition: (pet) => {
      return !pet?.doggy_soul_answers?.food_allergies && !pet?.doggy_soul_answers?.favorite_protein;
    }
  },
  {
    id: 'play',
    icon: '🎾',
    name: 'Play & Joy',
    color: '#D1FAE5',
    borderColor: '#10B981',
    tagline: (petName) => `Toys, enrichment, activity kits — the language ${petName} speaks`,
    glowBadge: () => 'Top soul pillar',
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Tell Mira what ${petName} loves to play with`,
    miraQuote: (pet) => `"${pet.name} is at their best when they're playing. This isn't just a gift — it's speaking their language. We picked everything based on their energy and what makes them come alive."`,
    tabs: ['Toys & Enrichment', 'Activity Kits', 'Gift Wrap a Toy', 'Outdoor Play'],
    glowCondition: (pet) => {
      const energyLevel = pet?.doggy_soul_answers?.energy_level?.toLowerCase() || '';
      const isHighEnergy = energyLevel.includes('high') || energyLevel.includes('active') || energyLevel.includes('playful');
      const hasFavoriteToys = pet?.favorite_toys?.length > 0;
      const isPlayful = pet?.doggy_soul_answers?.describe_3_words?.toLowerCase()?.includes('playful');
      return isHighEnergy || hasFavoriteToys || isPlayful;
    },
    incompleteCondition: (pet) => {
      return !pet?.doggy_soul_answers?.energy_level && !pet?.favorite_toys?.length;
    }
  },
  {
    id: 'social',
    icon: '🦋',
    name: 'Social & Friends',
    color: '#FCE7F3',
    borderColor: '#EC4899',
    tagline: () => `Pawty planning, playdate magic, the full celebration`,
    glowBadge: (petName, pet) => pet?.soul_archetype?.archetype_name || 'Social Butterfly',
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Tell Mira how ${petName} is with other dogs`,
    miraQuote: (pet) => `"${pet.name} is a ${pet?.soul_archetype?.archetype_name || 'Social Butterfly'} — they shine when they're surrounded by the dogs and people they love. Invite Bruno and Cookie. Make this a day everyone remembers."`,
    tabs: ['Pawty Packages', 'Playdate Planning', 'Party Accessories', 'Digital Invitations'],
    glowCondition: (pet) => {
      const isSocialButterfly = pet?.soul_archetype?.archetype_name?.toLowerCase()?.includes('social');
      const lovesDogs = pet?.doggy_soul_answers?.behavior_with_dogs?.toLowerCase()?.includes('love');
      const isFriendlyWithDogs = pet?.doggy_soul_answers?.behavior_with_dogs?.toLowerCase()?.includes('friendly');
      return isSocialButterfly || lovesDogs || isFriendlyWithDogs;
    },
    incompleteCondition: (pet) => {
      return !pet?.doggy_soul_answers?.behavior_with_dogs;
    }
  },
  {
    id: 'adventure',
    icon: '🌅',
    name: 'Adventure & Move',
    color: '#DBEAFE',
    borderColor: '#3B82F6',
    tagline: () => `Sunrise walks, trail outings, the celebrations that move`,
    glowBadge: (petName) => `${petName}'s happy place`,
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Tell Mira if ${petName} loves adventures`,
    miraQuote: (pet) => `"Some dogs celebrate best with a cake. ${pet.name} celebrates best with movement. A new trail. A sunrise walk. An outing to somewhere they've never been. That's the gift."`,
    tabs: ['Experiences', 'Adventure Gear', 'Trail Kits', 'Dog-Friendly Places'],
    glowCondition: (pet) => {
      const lovesCarRides = pet?.doggy_soul_answers?.car_rides?.toLowerCase()?.includes('love');
      const lovesWalks = pet?.doggy_soul_answers?.walks_per_day && parseInt(pet?.doggy_soul_answers?.walks_per_day) >= 2;
      const likesOutdoors = pet?.doggy_soul_answers?.space_preference?.toLowerCase()?.includes('outdoor');
      return lovesCarRides || lovesWalks || likesOutdoors;
    },
    incompleteCondition: (pet) => {
      return !pet?.doggy_soul_answers?.car_rides && !pet?.doggy_soul_answers?.walks_per_day;
    }
  },
  {
    id: 'grooming',
    icon: '✨',
    name: 'Grooming & Beauty',
    color: '#EDE9FE',
    borderColor: '#8B5CF6',
    tagline: () => `Birthday pamper, bandanas, spa — looking the part`,
    glowBadge: () => 'Pamper day',
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Tell Mira about ${petName}'s coat and grooming routine`,
    miraQuote: (pet) => `"Every celebration deserves a moment of beauty. ${pet.name} doesn't just deserve a good day — they deserve to look exactly how they feel on the inside."`,
    tabs: ['Pamper Sessions', 'Birthday Bandanas', 'Spa Kits', 'At-Home Grooming'],
    glowCondition: (pet) => {
      const hasGroomingPrefs = pet?.doggy_soul_answers?.grooming_tolerance || pet?.doggy_soul_answers?.grooming_style;
      const hasCoatType = pet?.coat_type || pet?.identity?.coat_type;
      return hasGroomingPrefs || hasCoatType;
    },
    incompleteCondition: (pet) => {
      return !pet?.doggy_soul_answers?.grooming_tolerance && !pet?.coat_type;
    }
  },
  {
    id: 'learning',
    icon: '🧠',
    name: 'Learning & Mind',
    color: '#FECDD3',
    borderColor: '#F43F5E',
    tagline: (petName) => `New skills, puzzle toys, the celebration that grows ${petName}`,
    glowBadge: () => 'Bright mind',
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Tell Mira about ${petName}'s learning style`,
    miraQuote: (pet) => `"The best birthday gift isn't always the biggest one. Sometimes it's a new thing to figure out. A puzzle. A trick. A skill they'll carry their whole life."`,
    tabs: ['Enrichment', 'Training Gifts', 'Puzzle Toys', 'New Skill Kits'],
    glowCondition: (pet) => {
      const trainingLevel = pet?.doggy_soul_answers?.training_level?.toLowerCase() || '';
      const isTrained = trainingLevel.includes('trained') || trainingLevel.includes('basic');
      const hasMotivation = pet?.doggy_soul_answers?.motivation_type;
      return isTrained || hasMotivation;
    },
    incompleteCondition: (pet) => {
      return !pet?.doggy_soul_answers?.training_level && !pet?.doggy_soul_answers?.motivation_type;
    }
  },
  {
    id: 'health',
    icon: '💚',
    name: 'Health & Wellness',
    color: '#D1FAE5',
    borderColor: '#059669',
    tagline: () => `Wellness gifts, supplements, the most loving thing you can give`,
    glowBadge: () => 'Long healthy life',
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Tell Mira about ${petName}'s health history`,
    miraQuote: (pet) => `"The most loving celebration for ${pet.name} is one that protects their tomorrows. This is not a clinical gift. It is the deepest kind of love."`,
    tabs: ['Wellness Gifts', 'Supplements', 'Vet Gift Cards', 'Annual Care Plans'],
    glowCondition: (pet) => {
      const hasHealthConditions = pet?.doggy_soul_answers?.health_conditions && 
        pet?.doggy_soul_answers?.health_conditions !== 'None' &&
        pet?.doggy_soul_answers?.health_conditions !== 'none';
      const isSenior = pet?.doggy_soul_answers?.life_stage?.toLowerCase()?.includes('senior');
      const age = pet?.age ? parseInt(pet.age) : 0;
      const isSeniorByAge = age >= 7;
      return hasHealthConditions || isSenior || isSeniorByAge;
    },
    incompleteCondition: (pet) => {
      return !pet?.doggy_soul_answers?.health_conditions && !pet?.doggy_soul_answers?.life_stage;
    }
  },
  {
    id: 'memory',
    icon: '📸',
    name: 'Love & Memory',
    color: '#FECDD3',
    borderColor: '#DB2777',
    tagline: () => `Photoshoots, portraits, the birthday that lives forever`,
    glowBadge: () => 'Keep them forever',
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Add ${petName}'s birthday to unlock memory gifts`,
    miraQuote: (pet) => `"One day you will look at a photo from this birthday and it will hold you. Let's make sure that photo exists. Let's make sure this day is captured the way ${pet.name} deserves."`,
    tabs: ['Photoshoots', 'Watercolour Portraits', 'Memory Books', 'Keepsakes'],
    glowCondition: (pet) => {
      const hasBirthday = pet?.birth_date || pet?.birthday;
      const hasGotchaDay = pet?.gotcha_date;
      return hasBirthday || hasGotchaDay;
    },
    incompleteCondition: (pet) => {
      return !pet?.birth_date && !pet?.birthday && !pet?.gotcha_date;
    }
  }
];

// Get pillar state based on pet data
const getPillarState = (pillar, pet) => {
  if (!pet) return 'dim';
  
  if (pillar.incompleteCondition(pet)) {
    return 'incomplete';
  }
  
  if (pillar.glowCondition(pet)) {
    return 'glow';
  }
  
  return 'dim';
};

// Single Pillar Card Component
const PillarCard = ({ pillar, pet, isExpanded, onToggle, onTellMiraMore }) => {
  const state = getPillarState(pillar, pet);
  const petName = pet?.name || 'your pet';
  
  const stateStyles = {
    glow: {
      opacity: 1,
      transform: 'scale(1)',
      boxShadow: `0 0 20px ${pillar.borderColor}40`
    },
    dim: {
      opacity: 0.7,
      transform: 'scale(1)'
    },
    incomplete: {
      opacity: 0.5,
      transform: 'scale(1)'
    }
  };

  const handleClick = () => {
    if (state === 'incomplete') {
      onTellMiraMore(pillar);
    } else {
      onToggle(pillar.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: stateStyles[state].opacity,
        y: 0,
        boxShadow: stateStyles[state].boxShadow || 'none'
      }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div
        onClick={handleClick}
        className={`
          relative rounded-2xl p-5 cursor-pointer transition-all duration-300
          border-2 hover:shadow-lg
          ${isExpanded ? 'ring-2 ring-offset-2' : ''}
        `}
        style={{
          backgroundColor: pillar.color,
          borderColor: state === 'glow' ? pillar.borderColor : 'transparent',
          ringColor: pillar.borderColor
        }}
        data-testid={`pillar-card-${pillar.id}`}
      >
        {/* Glow indicator dot */}
        {state === 'glow' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 right-3 w-3 h-3 rounded-full"
            style={{ backgroundColor: pillar.borderColor }}
          />
        )}

        {/* Lock icon for incomplete */}
        {state === 'incomplete' && (
          <div className="absolute top-3 right-3">
            <Lock className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Icon */}
        <div className="text-4xl mb-3">{pillar.icon}</div>

        {/* Name */}
        <h3 className="font-bold text-gray-900 text-lg mb-1">{pillar.name}</h3>

        {/* Tagline */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {pillar.tagline(petName)}
        </p>

        {/* Badge */}
        <div 
          className={`
            inline-block px-3 py-1 rounded-full text-xs font-medium
            ${state === 'glow' ? 'text-white' : state === 'incomplete' ? 'text-purple-700 bg-purple-100' : 'text-gray-600 bg-white/50'}
          `}
          style={state === 'glow' ? { backgroundColor: pillar.borderColor } : {}}
        >
          {state === 'glow' && (
            typeof pillar.glowBadge === 'function' ? pillar.glowBadge(petName, pet) : pillar.glowBadge
          )}
          {state === 'dim' && pillar.dimBadge}
          {state === 'incomplete' && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tell Mira more
            </span>
          )}
        </div>

        {/* Expand indicator */}
        {state !== 'incomplete' && (
          <div className="absolute bottom-3 right-3">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Component
const SoulCelebrationPillars = ({ pet, onOpenSoulBuilder }) => {
  const [expandedPillar, setExpandedPillar] = useState(null);
  const petName = pet?.name || 'your pet';

  const handleToggle = (pillarId) => {
    setExpandedPillar(expandedPillar === pillarId ? null : pillarId);
  };

  const handleTellMiraMore = (pillar) => {
    // Open soul builder for that specific pillar
    if (onOpenSoulBuilder) {
      onOpenSoulBuilder(pillar.id);
    } else {
      // Fallback: dispatch event
      window.dispatchEvent(new CustomEvent('openSoulBuilder', { 
        detail: { pillar: pillar.id } 
      }));
    }
  };

  const expandedPillarData = SOUL_PILLARS.find(p => p.id === expandedPillar);

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-pink-50/50 to-white" data-testid="soul-celebration-pillars">
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          How would <span className="text-pink-500">{petName}</span> love to celebrate?
        </h2>
        <p className="text-gray-600 text-lg">
          Choose a pillar — everything inside is personalised to {petName}'s soul profile. 
          <span className="text-purple-600 font-medium"> Glowing ones match who {petName} is.</span>
        </p>
      </div>

      {/* Pillars Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {SOUL_PILLARS.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              pet={pet}
              isExpanded={expandedPillar === pillar.id}
              onToggle={handleToggle}
              onTellMiraMore={handleTellMiraMore}
            />
          ))}
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {expandedPillar && expandedPillarData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <SoulPillarExpanded
                pillar={expandedPillarData}
                pet={pet}
                onClose={() => setExpandedPillar(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default SoulCelebrationPillars;
export { SOUL_PILLARS, getPillarState };

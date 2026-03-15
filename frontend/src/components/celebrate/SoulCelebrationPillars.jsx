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

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ChevronDown, ChevronUp } from 'lucide-react';
import SoulPillarExpanded from './SoulPillarExpanded';
import PillarSoulModal from './PillarSoulModal';

// Pillar definitions with spec-compliant colors
const SOUL_PILLARS = [
  {
    id: 'food',
    icon: '🍰',
    name: 'Food & Flavour',
    color: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
    dotColor: '#FF8C42',
    borderColor: '#FF8C42',
    tagline: (petName) => `Salmon cake, allergy-safe treats, birthday feast`,
    glowBadge: (petName) => `${petName} loves this`,
    dimBadge: 'Explore',
    incompleteBadge: (petName) => `Complete ${petName}'s food preferences to unlock`,
    miraQuote: (pet) => {
      const fav = typeof pet?.favorites?.[0] === 'string' ? pet.favorites[0] : (pet?.favorites?.[0]?.name || pet?.favorites?.[0]?.value || 'treats');
      const allergy = pet?.allergies?.[0] || (Array.isArray(pet?.doggy_soul_answers?.food_allergies) ? pet.doggy_soul_answers.food_allergies[0] : pet?.doggy_soul_answers?.food_allergies) || 'nothing specific';
      return `"We know ${pet?.name || 'your pet'} loves ${fav} and can't have ${allergy}. Every item here is checked. Nothing that would hurt them, everything that makes them happy."`;
    },
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
    color: 'linear-gradient(135deg, #FCE4EC, #F8BBD0)',
    dotColor: '#E91E63',
    borderColor: '#E91E63',
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
    color: 'linear-gradient(135deg, #F3E5F5, #E1BEE7)',
    dotColor: '#9C27B0',
    borderColor: '#9C27B0',
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
    color: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    dotColor: '#2196F3',
    borderColor: '#2196F3',
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
    color: 'linear-gradient(135deg, #FFF9C4, #FFF176)',
    dotColor: '#F9A825',
    borderColor: '#F9A825',
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
    color: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    dotColor: '#4CAF50',
    borderColor: '#4CAF50',
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
    color: 'linear-gradient(135deg, #E0F7FA, #B2EBF2)',
    dotColor: '#00BCD4',
    borderColor: '#00BCD4',
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
    color: 'linear-gradient(135deg, #FFF3E0, #FFCCBC)',
    dotColor: '#FF5722',
    borderColor: '#FF5722',
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

// Single Pillar Card Component — matches spec exactly
const PillarCard = ({ pillar, pet, isExpanded, onToggle, onTellMiraMore }) => {
  const state = getPillarState(pillar, pet);
  const petName = pet?.name || 'your pet';

  const handleClick = () => {
    if (state === 'incomplete') {
      onTellMiraMore(pillar);
    } else {
      onToggle(pillar.id);
    }
  };

  const cardStyle = {
    background: pillar.color,
    borderRadius: 16,
    padding: '20px 16px 18px',
    cursor: 'pointer',
    position: 'relative',
    opacity: state === 'glow' ? 1.0 : state === 'dim' ? 0.60 : 0.50,
    boxShadow: state === 'glow' ? '0 0 24px rgba(196,77,255,0.28)' : 'none',
    border: isExpanded ? `2px solid #C44DFF` : '2px solid transparent',
    transition: 'transform 200ms ease, box-shadow 400ms ease'
  };

  const badgeStyle = {
    glow: {
      background: `rgba(${hexToRgb(pillar.dotColor)}, 0.15)`,
      color: darken(pillar.dotColor)
    },
    dim: { background: 'rgba(0,0,0,0.08)', color: '#555555' },
    incomplete: { background: 'rgba(196,77,255,0.15)', color: '#4B0082' }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <div
        onClick={handleClick}
        style={{...cardStyle, display:'flex', flexDirection:'column', height:'100%'}}
        className="hover:-translate-y-0.5"
        data-testid={`pillar-card-${pillar.id}`}
      >
        {/* Glow dot */}
        {state === 'glow' && (
          <span
            className="absolute"
            style={{
              width: 8, height: 8, borderRadius: '50%',
              top: 8, right: 8,
              backgroundColor: pillar.dotColor
            }}
          />
        )}
        {/* Lock icon */}
        {state === 'incomplete' && (
          <div className="absolute" style={{ top: 8, right: 8 }}>
            <Lock className="w-3.5 h-3.5 text-gray-400" />
          </div>
        )}
        {/* Expand chevron */}
        {state !== 'incomplete' && (
          <div className="absolute" style={{ bottom: 8, right: 8 }}>
            {isExpanded
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
            }
          </div>
        )}

        {/* Icon */}
        <span className="block mb-3" style={{ fontSize: 36 }}>{pillar.icon}</span>

        {/* Name */}
        <p className="font-bold mb-1" style={{ fontSize: 16, color: '#1A0A00', lineHeight: 1.2 }}>
          {pillar.name}
        </p>

        {/* Tagline — flex-1 so it stretches, pushing badge to bottom */}
        <p className="flex-1 mb-3 leading-snug" style={{ fontSize: 13, color: '#555', lineHeight: 1.45 }}>
          {pillar.tagline(petName)}
        </p>

        {/* Badge — always at bottom */}
        <span
          className="rounded-full font-bold whitespace-nowrap overflow-hidden text-ellipsis block mt-auto"
          style={{
            fontSize: 12, fontWeight: 700,
            padding: '5px 12px',
            maxWidth: '100%',
            ...badgeStyle[state]
          }}
        >
          {state === 'glow' && (typeof pillar.glowBadge === 'function' ? pillar.glowBadge(petName, pet) : pillar.glowBadge)}
          {state === 'dim' && pillar.dimBadge}
          {state === 'incomplete' && `🔒 Tell Mira more`}
        </span>
      </div>
    </motion.div>
  );
};

// Color helpers
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
function darken(hex) {
  // Return a darker shade for badge text
  const map = {
    '#FF8C42': '#8B4500', '#E91E63': '#880E4F', '#9C27B0': '#4A148C',
    '#2196F3': '#0D47A1', '#F9A825': '#E65100', '#4CAF50': '#1B5E20',
    '#00BCD4': '#006064', '#FF5722': '#BF360C'
  };
  return map[hex] || '#333';
}

// Row groupings per spec (desktop 4-column layout)
const ROW1 = SOUL_PILLARS.slice(0, 4); // Food, Play, Social, Adventure
const ROW2 = SOUL_PILLARS.slice(4, 8); // Grooming, Learning, Health, Memory

// Main Component
const SoulCelebrationPillars = ({ pet, onOpenSoulBuilder }) => {
  const [expandedPillar, setExpandedPillar] = useState(null);
  const [soulModalPillar, setSoulModalPillar] = useState(null);
  const [localPet, setLocalPet] = useState(null);
  const row1ExpRef = useRef(null);
  const row2ExpRef = useRef(null);
  const petName = (localPet || pet)?.name || 'your pet';
  const activePet = localPet || pet;
  const token = localStorage.getItem('token') || localStorage.getItem('access_token');

  const handleToggle = (pillarId) => {
    const isClosing = expandedPillar === pillarId;
    setExpandedPillar(isClosing ? null : pillarId);
    if (!isClosing) {
      const isRow1 = ROW1.some(p => p.id === pillarId);
      setTimeout(() => {
        const ref = isRow1 ? row1ExpRef : row2ExpRef;
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const handleTellMiraMore = (pillar) => {
    setSoulModalPillar(pillar);
  };

  const handleModalComplete = (updatedPet) => {
    if (updatedPet) setLocalPet(updatedPet);
    setSoulModalPillar(null);
  };

  const expandedPillarData = SOUL_PILLARS.find(p => p.id === expandedPillar);
  const row1Expanded = expandedPillar && ROW1.some(p => p.id === expandedPillar);
  const row2Expanded = expandedPillar && ROW2.some(p => p.id === expandedPillar);

  return (
    <section className="py-10 px-4 sm:px-6 bg-white" data-testid="soul-celebration-pillars">
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-7">
        <h2 className="font-bold" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: '#0E0620', marginBottom: 6 }}>
          How would <span style={{ color: '#C44DFF' }}>{petName}</span> love to celebrate?
        </h2>
        <p style={{ fontSize: 15, color: '#888888', lineHeight: 1.5 }}>
          Choose a pillar — everything inside is personalised to {petName}'s soul profile.{' '}
          <span style={{ color: '#7C3AED', fontWeight: 600 }}>Glowing ones match who {petName} is.</span>
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Row 1: Food, Play, Social, Adventure */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {ROW1.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              pet={activePet}
              isExpanded={expandedPillar === pillar.id}
              onToggle={handleToggle}
              onTellMiraMore={handleTellMiraMore}
            />
          ))}
        </div>

        {/* Row 1 Expansion — appears below Row 1, above Row 2 */}
        <AnimatePresence>
          {row1Expanded && expandedPillarData && (
            <motion.div
              ref={row1ExpRef}
              key={expandedPillar + '-row1'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <SoulPillarExpanded
                pillar={expandedPillarData}
                pet={activePet}
                onClose={() => setExpandedPillar(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 2: Grooming, Learning, Health, Memory */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-3">
          {ROW2.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              pet={activePet}
              isExpanded={expandedPillar === pillar.id}
              onToggle={handleToggle}
              onTellMiraMore={handleTellMiraMore}
            />
          ))}
        </div>

        {/* Row 2 Expansion — appears below Row 2 */}
        <AnimatePresence>
          {row2Expanded && expandedPillarData && (
            <motion.div
              ref={row2ExpRef}
              key={expandedPillar + '-row2'}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <SoulPillarExpanded
                pillar={expandedPillarData}
                pet={activePet}
                onClose={() => setExpandedPillar(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PillarSoulModal — opens when INCOMPLETE pillar clicked */}
      <PillarSoulModal
        pillar={soulModalPillar}
        pet={activePet}
        token={token}
        isOpen={!!soulModalPillar}
        onClose={() => setSoulModalPillar(null)}
        onComplete={handleModalComplete}
      />
    </section>
  );
};

export default SoulCelebrationPillars;
export { SOUL_PILLARS, getPillarState };

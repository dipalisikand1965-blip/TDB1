/**
 * Pet Soul Inference Utility
 * ==========================
 * Generates personalized messages based on pet's soul data with breed fallbacks.
 * 
 * Priority:
 * 1. Soul traits from soul_answers
 * 2. Personality traits
 * 3. Breed-based inferences (smart defaults)
 * 4. Generic fallback
 * 
 * Built in honor of Mira Sikand - The Guiding Angel
 */

/**
 * Breed-based personality inferences
 * When we don't have soul data, we can make educated guesses based on breed
 */
export const BREED_INFERENCES = {
  // Small Breeds - Often anxious, need comfort
  'shih tzu': {
    traits: ['loves grooming', 'needs calm environments', 'prefers gentle handling'],
    stay: 'who loves being pampered',
    travel: 'who prefers calm, comfortable journeys',
    celebrate: 'who enjoys intimate gatherings',
    dine: 'who has a refined palate',
    care: 'who needs gentle grooming care',
    default: 'who loves being pampered'
  },
  'chihuahua': {
    traits: ['loyal companion', 'needs warmth', 'prefers one person'],
    stay: 'who needs a cozy, warm space',
    travel: 'who prefers carrier comfort',
    celebrate: 'who loves being the center of attention',
    default: 'who is fiercely loyal'
  },
  'pomeranian': {
    traits: ['energetic', 'loves attention', 'fluffy coat care'],
    stay: 'who loves being the star',
    care: 'who needs regular grooming',
    default: 'who loves attention'
  },
  'maltese': {
    traits: ['gentle soul', 'loves cuddles', 'needs grooming'],
    stay: 'who needs gentle, loving care',
    default: 'who is gentle and loving'
  },
  'yorkshire terrier': {
    traits: ['bold personality', 'silky coat', 'loves adventure'],
    stay: 'who has big personality in a small package',
    default: 'who is bold and adventurous'
  },
  'pug': {
    traits: ['charming', 'loves food', 'needs breathing support'],
    dine: 'who is a true foodie',
    travel: 'who needs climate-controlled comfort',
    care: 'who needs breathing-friendly care',
    default: 'who is charming and lovable'
  },
  
  // Medium Breeds
  'beagle': {
    traits: ['curious explorer', 'food motivated', 'loves sniffing'],
    stay: 'who needs space to explore',
    dine: 'who is highly food motivated',
    travel: 'who loves new scents and places',
    learn: 'who learns best with treats',
    default: 'who is curious and food-loving'
  },
  'cocker spaniel': {
    traits: ['gentle', 'loves water', 'beautiful coat'],
    stay: 'who loves gentle environments',
    care: 'who needs ear and coat care',
    default: 'who is gentle and beautiful'
  },
  'french bulldog': {
    traits: ['playful', 'loves cuddles', 'temperature sensitive'],
    stay: 'who needs climate-controlled spaces',
    travel: 'who needs cool, comfortable transport',
    default: 'who is playful and cuddly'
  },
  'bulldog': {
    traits: ['laid back', 'loves naps', 'temperature sensitive'],
    stay: 'who prefers cool, relaxed spaces',
    fit: 'who needs gentle exercise',
    default: 'who is calm and lovable'
  },
  
  // Large Breeds
  'labrador': {
    traits: ['friendly', 'loves water', 'food motivated'],
    stay: 'who needs space to play',
    dine: 'who loves treats',
    travel: 'who is always ready for adventure',
    fit: 'who has energy to burn',
    default: 'who is friendly and energetic'
  },
  'golden retriever': {
    traits: ['gentle giant', 'loves everyone', 'eager to please'],
    stay: 'who makes friends everywhere',
    learn: 'who is eager to please',
    celebrate: 'who loves parties and people',
    default: 'who is gentle and loving'
  },
  'german shepherd': {
    traits: ['loyal protector', 'intelligent', 'needs mental stimulation'],
    stay: 'who needs secure, trustworthy care',
    learn: 'who is highly intelligent',
    fit: 'who needs regular exercise',
    default: 'who is loyal and intelligent'
  },
  'rottweiler': {
    traits: ['loyal guardian', 'needs training', 'gentle with family'],
    stay: 'who needs experienced handling',
    learn: 'who responds to consistent training',
    default: 'who is loyal and protective'
  },
  'boxer': {
    traits: ['playful', 'energetic', 'great with kids'],
    stay: 'who has boundless energy',
    fit: 'who loves to play and run',
    celebrate: 'who is the life of the party',
    default: 'who is playful and fun'
  },
  'husky': {
    traits: ['independent', 'loves running', 'needs cool climate'],
    stay: 'who needs climate-controlled spaces',
    travel: 'who needs adventure',
    fit: 'who has endless energy',
    default: 'who is independent and adventurous'
  },
  'great dane': {
    traits: ['gentle giant', 'needs space', 'loves family'],
    stay: 'who needs spacious accommodations',
    default: 'who is a gentle giant'
  },
  
  // Indian Breeds
  'indie': {
    traits: ['adaptable', 'intelligent', 'loyal'],
    stay: 'who adapts easily',
    default: 'who is smart and loyal'
  },
  'indian pariah': {
    traits: ['resilient', 'intelligent', 'low maintenance'],
    stay: 'who is adaptable and easy-going',
    default: 'who is resilient and smart'
  },
  'rajapalayam': {
    traits: ['loyal guardian', 'needs exercise', 'single-person bond'],
    stay: 'who bonds deeply',
    default: 'who is fiercely loyal'
  }
};

// Default fallback for unknown breeds
const DEFAULT_BREED_INFERENCE = {
  traits: ['unique personality', 'special needs'],
  stay: 'with their own special needs',
  travel: 'who deserves comfortable journeys',
  celebrate: 'who deserves to be celebrated',
  dine: 'with unique dietary preferences',
  care: 'who needs personalized care',
  default: 'with their own unique personality'
};

/**
 * Get personalization reason based on pet's soul data and pillar
 * @param {Object} pet - Pet object with soul data
 * @param {string} pillar - Current pillar (celebrate, stay, etc.)
 * @returns {string} - Personalized reason string
 */
export const getSoulBasedReason = (pet, pillar) => {
  if (!pet) return '';
  
  // 1. Check for specific soul traits first
  const soulAnswers = pet.doggy_soul_answers || pet.soul_answers || {};
  const preferences = pet.preferences || {};
  const soul = pet.soul || {};
  
  // Priority soul traits by pillar - includes common field name variations
  const pillarTraitMap = {
    stay: ['separation_anxiety', 'alone_comfort', 'temperament', 'general_nature', 'social_dog'],
    travel: ['car_comfort', 'car_anxiety', 'travel_experience', 'motion_sickness'],
    celebrate: ['stranger_comfort', 'stranger_reaction', 'social_gathering', 'noise_sensitivity', 'party_behavior', 'temperament'],
    dine: ['food_allergies', 'favorite_flavors', 'eating_habits', 'dietary_restrictions'],
    care: ['grooming_tolerance', 'vet_anxiety', 'handling_sensitivity', 'medical_conditions', 'temperament'],
    enjoy: ['energy_level', 'play_style', 'favorite_activities', 'outdoor_preference', 'temperament'],
    fit: ['exercise_needs', 'energy_level', 'health_conditions', 'mobility'],
    learn: ['trainability', 'attention_span', 'motivation_type', 'learning_style', 'temperament'],
    emergency: ['medical_conditions', 'allergies', 'special_needs', 'emergency_contacts'],
    advisory: ['behavior_concerns', 'training_needs', 'health_questions', 'temperament'],
    paperwork: ['vaccination_status', 'registration', 'insurance'],
    farewell: ['age', 'health_conditions', 'comfort_needs', 'temperament'],
    adopt: ['compatibility', 'lifestyle_match', 'temperament'],
    shop: ['favorite_toys', 'preferences', 'allergies']
  };
  
  // Check soul answers for relevant traits
  const relevantTraits = pillarTraitMap[pillar] || [];
  
  for (const trait of relevantTraits) {
    const value = soulAnswers[trait] || soul[trait] || preferences[trait];
    if (value && value !== 'None' && value !== 'Unknown') {
      // Generate human-readable reason
      const reason = traitToReason(trait, value, pillar);
      if (reason) return reason;
    }
  }
  
  // 2. Check personality traits array
  if (pet.personality_traits && pet.personality_traits.length > 0) {
    const trait = pet.personality_traits[0];
    if (typeof trait === 'string') {
      return `who is ${trait.toLowerCase()}`;
    }
  }
  
  // 3. Check general nature from soul
  if (soulAnswers.general_nature) {
    return `who has a ${soulAnswers.general_nature.toLowerCase()} nature`;
  }
  
  // 4. Check persona
  if (soul.persona) {
    return `who is ${soul.persona.toLowerCase()}`;
  }
  
  // 5. Fallback to breed inference
  if (pet.breed) {
    const breedLower = pet.breed.toLowerCase();
    const breedData = BREED_INFERENCES[breedLower] || DEFAULT_BREED_INFERENCE;
    return breedData[pillar] || breedData.default || '';
  }
  
  // 6. Last resort - empty string (component will handle)
  return '';
};

/**
 * Convert a soul trait to a human-readable reason
 */
const traitToReason = (trait, value, pillar) => {
  const traitMappings = {
    // Anxiety & Comfort - Supporting multiple answer formats
    'separation_anxiety': {
      'Yes': 'who needs extra comfort when away from home',
      'High': 'who needs extra comfort when away from home',
      'Sometimes': 'who can get anxious when left alone',
      'Moderate': 'who can get anxious when left alone',
      'No': null,
      'Low': null,
      'None': null
    },
    'alone_comfort': {
      'Anxious': 'who needs company and reassurance',
      'Not comfortable': 'who needs company and reassurance',
      'Okay for short periods': 'who does best with check-ins',
      'Okay for Few Hours': 'who does best with check-ins',
      'Short periods only': 'who does best with check-ins',
      'Comfortable': null,
      'Fine alone': null
    },
    'stranger_comfort': {
      'Anxious': 'who prefers familiar faces',
      'Cautious': 'who warms up slowly to new people',
      'Cautious at first': 'who warms up slowly to new people',
      'Wary': 'who prefers familiar faces',
      'Friendly': null
    },
    // Also handle 'stranger_reaction' as an alias
    'stranger_reaction': {
      'Anxious': 'who prefers familiar faces',
      'Cautious': 'who warms up slowly to new people',
      'Cautious at first': 'who warms up slowly to new people',
      'Wary': 'who prefers familiar faces',
      'Friendly': null
    },
    'car_comfort': {
      'Anxious': 'who gets nervous during travel',
      'Gets sick': 'who needs motion sickness care',
      'Loves it': 'who loves car rides',
      'Loves car rides': 'who loves car rides',
      'Comfortable': 'who enjoys car rides'
    },
    'noise_sensitivity': {
      'Very sensitive': 'who needs quiet, calm environments',
      'High': 'who needs quiet, calm environments',
      'Somewhat sensitive': 'who prefers peaceful settings',
      'Moderate': 'who prefers peaceful settings',
      'Not sensitive': null,
      'Low': null
    },
    
    // Temperament (common field from soul data)
    'temperament': {
      'Protective': 'who is naturally protective',
      'Playful': 'who loves to play',
      'Calm': 'who has a calm temperament',
      'Curious': 'who is always exploring',
      'Loving': 'who is full of love',
      'Friendly': 'who loves meeting everyone',
      'Independent': 'who values their independence',
      'Energetic': 'who has boundless energy'
    },
    
    // Social
    'social_dog': {
      'Yes': 'who loves meeting other dogs',
      'Loves them': 'who loves meeting other dogs',
      'Selective': 'who is selective about dog friends',
      'Some dogs': 'who is selective about dog friends',
      'No': 'who prefers solo attention',
      'Not interested': 'who prefers solo attention'
    },
    'general_nature': {
      'Protective': 'who is naturally protective',
      'Playful': 'who loves to play',
      'Calm': 'who has a calm temperament',
      'Curious': 'who is always exploring',
      'Loving': 'who is full of love',
      'Friendly': 'who has a friendly nature',
      'Independent': 'who values their independence'
    },
    
    // Food & Diet
    'food_allergies': value => value && value !== 'None' && value !== 'No' ? `who is allergic to ${value}` : null,
    'favorite_flavors': value => value ? `who loves ${Array.isArray(value) ? value[0] : value}` : null,
    
    // Energy
    'energy_level': {
      'High': 'who has endless energy',
      'Very High': 'who has endless energy',
      'Medium': 'who enjoys balanced activities',
      'Moderate': 'who enjoys balanced activities',
      'Low': 'who prefers calm, relaxed activities'
    },
    
    // Training
    'trainability': {
      'Easy': 'who is eager to learn',
      'Very Trainable': 'who is eager to learn',
      'Moderate': 'who learns at their own pace',
      'Moderately Trainable': 'who learns at their own pace',
      'Challenging': 'who needs patient, consistent training',
      'Stubborn': 'who needs patient, consistent training'
    }
  };
  
  const mapping = traitMappings[trait];
  if (!mapping) return null;
  
  if (typeof mapping === 'function') {
    return mapping(value);
  }
  
  return mapping[value] || null;
};

/**
 * Get a list of known facts about the pet for display
 * @param {Object} pet - Pet object
 * @returns {Array} - Array of {label, value, icon} objects
 */
export const getPetKnownFacts = (pet) => {
  if (!pet) return [];
  
  const facts = [];
  const soulAnswers = pet.doggy_soul_answers || pet.soul_answers || {};
  const preferences = pet.preferences || {};
  const soul = pet.soul || {};
  
  // Allergies
  if (preferences.allergies && preferences.allergies !== 'None') {
    const allergies = Array.isArray(preferences.allergies) 
      ? preferences.allergies.join(', ') 
      : preferences.allergies;
    facts.push({ label: 'Allergies', value: allergies, icon: '⚠️' });
  }
  
  // Favorite foods
  if (preferences.favorite_flavors && preferences.favorite_flavors.length > 0) {
    facts.push({ 
      label: 'Loves', 
      value: preferences.favorite_flavors.slice(0, 2).join(', '), 
      icon: '❤️' 
    });
  }
  
  // Personality
  if (soulAnswers.general_nature) {
    facts.push({ label: 'Nature', value: soulAnswers.general_nature, icon: '⭐' });
  }
  
  // Social
  if (soulAnswers.social_dog) {
    facts.push({ 
      label: 'With dogs', 
      value: soulAnswers.social_dog === 'Yes' ? 'Friendly' : soulAnswers.social_dog, 
      icon: '🐕' 
    });
  }
  
  // Anxiety indicators
  if (soulAnswers.separation_anxiety === 'Yes') {
    facts.push({ label: 'Note', value: 'Separation anxiety', icon: '💙' });
  }
  
  return facts;
};

export default {
  getSoulBasedReason,
  getPetKnownFacts,
  BREED_INFERENCES
};

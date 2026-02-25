/**
 * breedIntelligence.js
 * 
 * Breed-specific recommendations and intelligence for Mira OS
 * Used to personalize FlowModals with breed-aware suggestions
 */

// Breed characteristics database
export const BREED_INTELLIGENCE = {
  // Small/Toy breeds
  'shih tzu': {
    size: 'small',
    coat: 'long',
    groomingNotes: [
      'Regular brushing to prevent matting',
      'Face cleaning around eyes daily',
      'Professional grooming every 4-6 weeks'
    ],
    groomingRecommendations: [
      'Gentle handling preferred',
      'Face/eye area cleaning included',
      'De-matting if needed'
    ],
    vetNotes: [
      'Eye health check recommended',
      'Dental care important for small breeds'
    ],
    temperamentFlags: ['gentle', 'friendly'],
    sensitivityFlags: ['heat_sensitive', 'eye_prone']
  },
  'pomeranian': {
    size: 'small',
    coat: 'double',
    groomingNotes: [
      'Heavy shedding breed',
      'Never shave the double coat',
      'Regular brushing 2-3 times weekly'
    ],
    groomingRecommendations: [
      'De-shedding treatment recommended',
      'Double coat maintenance',
      'No close shaves'
    ],
    temperamentFlags: ['alert', 'active'],
    sensitivityFlags: ['coat_sensitive']
  },
  'maltese': {
    size: 'small',
    coat: 'long',
    groomingNotes: [
      'Single coat, minimal shedding',
      'Daily brushing to prevent tangles',
      'Tear stain cleaning needed'
    ],
    groomingRecommendations: [
      'Gentle detangling',
      'Tear stain treatment',
      'Topknot or short cut options'
    ],
    temperamentFlags: ['gentle', 'affectionate'],
    sensitivityFlags: ['tear_staining']
  },
  'pug': {
    size: 'small',
    coat: 'short',
    groomingNotes: [
      'Facial wrinkle cleaning essential',
      'Moderate shedding despite short coat',
      'Sensitive to heat'
    ],
    groomingRecommendations: [
      'Wrinkle cleaning included',
      'De-shedding treatment',
      'Cool environment preferred'
    ],
    temperamentFlags: ['friendly', 'playful'],
    sensitivityFlags: ['brachycephalic', 'heat_sensitive', 'wrinkle_care']
  },
  
  // Medium breeds
  'indie': {
    size: 'medium',
    coat: 'short',
    groomingNotes: [
      'Generally low maintenance coat',
      'Monthly bath usually sufficient',
      'Tick/flea prevention important'
    ],
    groomingRecommendations: [
      'Tick/flea treatment',
      'Basic hygiene groom',
      'Nail trimming'
    ],
    temperamentFlags: ['adaptable', 'intelligent'],
    sensitivityFlags: []
  },
  'beagle': {
    size: 'medium',
    coat: 'short',
    groomingNotes: [
      'Moderate shedding',
      'Ear cleaning very important',
      'Sensitive nose - avoid strong fragrances'
    ],
    groomingRecommendations: [
      'Ear cleaning included',
      'Mild/unscented products',
      'De-shedding brush'
    ],
    temperamentFlags: ['friendly', 'curious'],
    sensitivityFlags: ['ear_prone', 'scent_sensitive']
  },
  'cocker spaniel': {
    size: 'medium',
    coat: 'long',
    groomingNotes: [
      'Professional grooming every 4-6 weeks',
      'Daily ear checks',
      'Prone to matting without regular care'
    ],
    groomingRecommendations: [
      'Full groom with ear attention',
      'De-matting if needed',
      'Feathering maintenance'
    ],
    temperamentFlags: ['happy', 'gentle'],
    sensitivityFlags: ['ear_prone', 'matting_prone']
  },
  
  // Large breeds
  'golden retriever': {
    size: 'large',
    coat: 'double',
    groomingNotes: [
      'Heavy shedding, especially seasonally',
      'Never shave the double coat',
      'Regular brushing 2-3 times weekly'
    ],
    groomingRecommendations: [
      'De-shedding treatment essential',
      'Double coat care',
      'Ear cleaning'
    ],
    temperamentFlags: ['friendly', 'calm'],
    sensitivityFlags: ['heavy_shedder', 'ear_prone']
  },
  'labrador retriever': {
    size: 'large',
    coat: 'double',
    groomingNotes: [
      'Water-resistant double coat',
      'Heavy shedding seasonally',
      'Loves water - great for baths'
    ],
    groomingRecommendations: [
      'De-shedding treatment',
      'Double coat maintenance',
      'Easy bather'
    ],
    temperamentFlags: ['friendly', 'energetic'],
    sensitivityFlags: ['heavy_shedder']
  },
  'german shepherd': {
    size: 'large',
    coat: 'double',
    groomingNotes: [
      'Heavy year-round shedding',
      'Professional de-shedding recommended',
      'Never shave'
    ],
    groomingRecommendations: [
      'De-shedding specialist',
      'Double coat care',
      'Patient handling for larger dogs'
    ],
    temperamentFlags: ['intelligent', 'loyal'],
    sensitivityFlags: ['heavy_shedder', 'large_dog_handling']
  },
  
  // Cats
  'persian': {
    size: 'medium',
    coat: 'long',
    species: 'cat',
    groomingNotes: [
      'Daily brushing essential',
      'Face cleaning around nose',
      'Prone to matting'
    ],
    groomingRecommendations: [
      'Cat grooming specialist',
      'Gentle handling',
      'Face cleaning included'
    ],
    temperamentFlags: ['calm', 'gentle'],
    sensitivityFlags: ['brachycephalic', 'matting_prone']
  },
  'british shorthair': {
    size: 'medium',
    coat: 'short',
    species: 'cat',
    groomingNotes: [
      'Dense plush coat',
      'Weekly brushing sufficient',
      'Low maintenance'
    ],
    groomingRecommendations: [
      'Cat grooming specialist',
      'De-shedding brush',
      'Basic groom'
    ],
    temperamentFlags: ['calm', 'independent'],
    sensitivityFlags: []
  }
};

/**
 * Get breed intelligence for a pet
 * @param {string} breed - Pet breed name
 * @returns {object} Breed intelligence or default
 */
export const getBreedIntelligence = (breed) => {
  if (!breed) return null;
  
  const normalizedBreed = breed.toLowerCase().trim();
  
  // Direct match
  if (BREED_INTELLIGENCE[normalizedBreed]) {
    return BREED_INTELLIGENCE[normalizedBreed];
  }
  
  // Partial match
  for (const [key, data] of Object.entries(BREED_INTELLIGENCE)) {
    if (normalizedBreed.includes(key) || key.includes(normalizedBreed)) {
      return data;
    }
  }
  
  // Default for unknown breeds
  return {
    size: 'medium',
    coat: 'unknown',
    groomingNotes: ['Regular grooming recommended'],
    groomingRecommendations: ['Standard grooming package'],
    temperamentFlags: [],
    sensitivityFlags: []
  };
};

/**
 * Get grooming recommendation for a breed
 * @param {string} breed - Pet breed name
 * @returns {string} Personalized recommendation
 */
export const getGroomingRecommendation = (breed) => {
  const intel = getBreedIntelligence(breed);
  if (!intel) return null;
  
  const recommendations = intel.groomingRecommendations || [];
  return recommendations.length > 0 ? recommendations[0] : null;
};

/**
 * Get breed-specific grooming tip
 * @param {string} breed - Pet breed name
 * @returns {string} Tip for the breed
 */
export const getBreedGroomingTip = (breed) => {
  const intel = getBreedIntelligence(breed);
  if (!intel) return null;
  
  const notes = intel.groomingNotes || [];
  return notes.length > 0 ? notes[0] : null;
};

/**
 * Check if breed has specific sensitivity
 * @param {string} breed - Pet breed name
 * @param {string} flag - Sensitivity flag to check
 * @returns {boolean}
 */
export const hasBreedSensitivity = (breed, flag) => {
  const intel = getBreedIntelligence(breed);
  if (!intel) return false;
  
  return (intel.sensitivityFlags || []).includes(flag);
};

export default BREED_INTELLIGENCE;

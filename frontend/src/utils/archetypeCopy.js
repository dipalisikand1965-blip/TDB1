/**
 * Archetype Copy Utility
 * =====================
 * Generates personalized copy/text based on pet's archetype.
 * Makes UI messaging dynamic and personality-driven.
 */

// Archetype definitions with copy patterns
export const ARCHETYPE_COPY = {
  gentle_aristocrat: {
    name: "The Gentle Aristocrat",
    emoji: "👑",
    tone: "refined, elegant, understated",
    greetings: [
      "A refined selection for {pet}",
      "Curated with elegance for {pet}",
      "Distinguished choices for your regal companion"
    ],
    productIntro: [
      "Only the finest for {pet}'s discerning taste",
      "Premium selections befitting {pet}'s graceful nature",
      "Exquisite items for your dignified friend"
    ],
    bundleIntro: [
      "A sophisticated collection for {pet}",
      "Elegantly curated for refined tastes",
      "Premium bundles for the distinguished {breed}"
    ],
    celebrationCopy: [
      "An intimate celebration worthy of {pet}",
      "A sophisticated affair for your elegant companion",
      "Refined festivities for {pet}'s special day"
    ],
    careRecommendation: [
      "Premium grooming for {pet}'s luxurious coat",
      "Elegant care befitting your distinguished {breed}",
      "Refined wellness for {pet}"
    ],
    actionVerb: "Discover",
    colorAccent: "#8B7355"
  },
  
  wild_explorer: {
    name: "The Wild Explorer",
    emoji: "🏔️",
    tone: "adventurous, exciting, bold",
    greetings: [
      "Adventure awaits {pet}!",
      "Ready for the next journey with {pet}?",
      "Gear up for {pet}'s wild adventures"
    ],
    productIntro: [
      "Built for {pet}'s bold spirit",
      "Durable gear for every adventure",
      "Ready for whatever {pet} discovers next"
    ],
    bundleIntro: [
      "Adventure-ready bundles for {pet}",
      "Everything for {pet}'s next expedition",
      "Gear packs for the fearless {breed}"
    ],
    celebrationCopy: [
      "An adventure-filled celebration for {pet}!",
      "Party like a wild explorer!",
      "Outdoor festivities for your bold {breed}"
    ],
    careRecommendation: [
      "Post-adventure care for {pet}",
      "Keep {pet} ready for the next trail",
      "Tough gear for tough adventures"
    ],
    actionVerb: "Explore",
    colorAccent: "#2D5016"
  },
  
  velcro_baby: {
    name: "The Velcro Baby",
    emoji: "🤗",
    tone: "warm, reassuring, comforting",
    greetings: [
      "Cozy picks for {pet}",
      "Comfort and closeness for {pet}",
      "Snuggle-worthy selections for your loving companion"
    ],
    productIntro: [
      "Comforting items for {pet}'s sensitive soul",
      "Designed for closeness and comfort",
      "Because {pet} deserves all the snuggles"
    ],
    bundleIntro: [
      "Cozy bundles for {pet}",
      "Comfort collections for your devoted {breed}",
      "Everything for snuggle time with {pet}"
    ],
    celebrationCopy: [
      "A cozy celebration at home with {pet}",
      "Intimate moments for your loving companion",
      "Quality time with your devoted {breed}"
    ],
    careRecommendation: [
      "Gentle care for your sweet {pet}",
      "Comfort-focused wellness for {pet}",
      "Soothing products for your loving {breed}"
    ],
    actionVerb: "Cuddle up with",
    colorAccent: "#FFB6C1"
  },
  
  snack_negotiator: {
    name: "The Snack-Led Negotiator",
    emoji: "🍖",
    tone: "playful, foodie, tempting",
    greetings: [
      "Treat time for {pet}!",
      "The best snacks for {pet}'s discerning palate",
      "Food-forward finds for your clever negotiator"
    ],
    productIntro: [
      "Treat-worthy picks for {pet}",
      "For the pup who knows what they want",
      "Delicious deals {pet} can't resist"
    ],
    bundleIntro: [
      "Foodie bundles for {pet}",
      "Treat-packed collections for your clever {breed}",
      "Everything for {pet}'s culinary adventures"
    ],
    celebrationCopy: [
      "A feast fit for {pet}!",
      "Birthday treats galore!",
      "Snack party for your foodie {breed}"
    ],
    careRecommendation: [
      "Keep {pet} treat-ready",
      "Wellness that tastes as good as it feels",
      "Health meets delicious for {pet}"
    ],
    actionVerb: "Treat yourself to",
    colorAccent: "#FF6B35"
  },
  
  quiet_watcher: {
    name: "The Quiet Watcher",
    emoji: "👁️",
    tone: "gentle, patient, understanding",
    greetings: [
      "Thoughtful selections for {pet}",
      "Gentle choices for your observant companion",
      "Curated with care for {pet}"
    ],
    productIntro: [
      "Calm and gentle options for {pet}",
      "For {pet}'s thoughtful nature",
      "Peaceful products for your quiet friend"
    ],
    bundleIntro: [
      "Gentle bundles for {pet}",
      "Calming collections for your thoughtful {breed}",
      "Peaceful picks for {pet}'s space"
    ],
    celebrationCopy: [
      "A small, intimate gathering for {pet}",
      "Quiet celebration with familiar faces",
      "Gentle festivities for your reserved {breed}"
    ],
    careRecommendation: [
      "Gentle care for your thoughtful {pet}",
      "Calm wellness routines for {pet}",
      "Patient, gentle products for your {breed}"
    ],
    actionVerb: "Discover quietly",
    colorAccent: "#708090"
  },
  
  social_butterfly: {
    name: "The Social Butterfly",
    emoji: "🦋",
    tone: "cheerful, social, celebratory",
    greetings: [
      "Party picks for {pet}!",
      "Social favorites for your popular pup",
      "Fun finds for the life of the party"
    ],
    productIntro: [
      "For {pet}'s next playdate!",
      "Social essentials for your friendly {breed}",
      "Fun gear for {pet}'s busy social calendar"
    ],
    bundleIntro: [
      "Party-ready bundles for {pet}!",
      "Social collections for your charming {breed}",
      "Everything for {pet}'s next gathering"
    ],
    celebrationCopy: [
      "The biggest party for {pet}!",
      "Invite all the friends!",
      "Social celebration for your popular {breed}"
    ],
    careRecommendation: [
      "Keep {pet} playdate-ready!",
      "Social pup grooming for {pet}",
      "Looking good for {pet}'s friends"
    ],
    actionVerb: "Celebrate with",
    colorAccent: "#FF69B4"
  },
  
  brave_worrier: {
    name: "The Brave Little Worrier",
    emoji: "💪",
    tone: "supportive, reassuring, gentle",
    greetings: [
      "Comforting picks for brave {pet}",
      "Supportive selections for your courageous companion",
      "Gentle choices to help {pet} feel safe"
    ],
    productIntro: [
      "Calming products for {pet}'s brave heart",
      "Support for {pet}'s sensitive soul",
      "Reassuring items for your courageous {breed}"
    ],
    bundleIntro: [
      "Comfort bundles for brave {pet}",
      "Calming collections for your sensitive {breed}",
      "Everything to help {pet} feel secure"
    ],
    celebrationCopy: [
      "A calm, controlled celebration for {pet}",
      "Gentle festivities for your brave companion",
      "Safe, happy celebration for {pet}"
    ],
    careRecommendation: [
      "Gentle, calming care for {pet}",
      "Stress-free wellness for your brave {breed}",
      "Soothing routines for {pet}"
    ],
    actionVerb: "Find comfort in",
    colorAccent: "#9370DB"
  }
};

// Default copy for when archetype is unknown
const DEFAULT_COPY = {
  name: "Your Best Friend",
  emoji: "🐕",
  tone: "friendly, helpful",
  greetings: ["Great picks for {pet}", "Personalized for {pet}", "Made for {pet}"],
  productIntro: ["Quality products for {pet}", "Hand-picked for your pup", "Best sellers for {breed}s"],
  bundleIntro: ["Curated bundles for {pet}", "Value packs for your {breed}", "Popular collections"],
  celebrationCopy: ["Celebrate with {pet}!", "Special day for {pet}", "Party time!"],
  careRecommendation: ["Quality care for {pet}", "Keep {pet} healthy", "Wellness for your {breed}"],
  actionVerb: "Shop",
  colorAccent: "#6B7280"
};

/**
 * Get copy data for a specific archetype
 */
export function getArchetypeCopy(archetype) {
  const key = archetype?.toLowerCase()?.replace(/\s+/g, '_');
  return ARCHETYPE_COPY[key] || DEFAULT_COPY;
}

/**
 * Get a random item from an array
 */
function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Replace placeholders in text
 */
function replacePlaceholders(text, petName, breed) {
  return text
    .replace(/{pet}/g, petName || 'your pet')
    .replace(/{breed}/g, formatBreed(breed) || 'pup');
}

/**
 * Format breed name for display
 */
function formatBreed(breed) {
  if (!breed) return '';
  return breed
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get personalized greeting based on archetype
 */
export function getPersonalizedGreeting(archetype, petName, breed) {
  const copy = getArchetypeCopy(archetype);
  const template = getRandomItem(copy.greetings);
  return replacePlaceholders(template, petName, breed);
}

/**
 * Get personalized product intro based on archetype
 */
export function getProductIntro(archetype, petName, breed) {
  const copy = getArchetypeCopy(archetype);
  const template = getRandomItem(copy.productIntro);
  return replacePlaceholders(template, petName, breed);
}

/**
 * Get personalized bundle intro based on archetype
 */
export function getBundleIntro(archetype, petName, breed) {
  const copy = getArchetypeCopy(archetype);
  const template = getRandomItem(copy.bundleIntro);
  return replacePlaceholders(template, petName, breed);
}

/**
 * Get personalized celebration copy based on archetype
 */
export function getCelebrationCopy(archetype, petName, breed) {
  const copy = getArchetypeCopy(archetype);
  const template = getRandomItem(copy.celebrationCopy);
  return replacePlaceholders(template, petName, breed);
}

/**
 * Get personalized care recommendation based on archetype
 */
export function getCareRecommendation(archetype, petName, breed) {
  const copy = getArchetypeCopy(archetype);
  const template = getRandomItem(copy.careRecommendation);
  return replacePlaceholders(template, petName, breed);
}

/**
 * Get action verb for archetype (e.g., "Explore", "Discover", "Shop")
 */
export function getActionVerb(archetype) {
  const copy = getArchetypeCopy(archetype);
  return copy.actionVerb;
}

/**
 * Get accent color for archetype
 */
export function getAccentColor(archetype) {
  const copy = getArchetypeCopy(archetype);
  return copy.colorAccent;
}

/**
 * Get archetype display info
 */
export function getArchetypeDisplayInfo(archetype) {
  const copy = getArchetypeCopy(archetype);
  return {
    name: copy.name,
    emoji: copy.emoji,
    tone: copy.tone
  };
}

/**
 * EMERGENCY-SPECIFIC COPY
 * These override the playful archetype messaging for emergency contexts
 */
const EMERGENCY_COPY = {
  greeting: [
    "Essential care for {pet}",
    "Safety first for {pet}",
    "Emergency essentials for {pet}",
    "Protection & care for {pet}"
  ],
  productIntro: [
    "Items to keep {pet} safe in any situation",
    "Be prepared for unexpected moments with {pet}",
    "Emergency preparedness for your {breed}",
    "Safety supplies for {pet}'s wellbeing"
  ],
  bundleIntro: [
    "Emergency preparedness kits for {pet}",
    "Safety bundles to protect {pet}",
    "Be ready for anything with these essential packs"
  ]
};

/**
 * ADVISORY-SPECIFIC COPY
 * Decision-support focused, guidance-oriented language
 */
const ADVISORY_COPY = {
  greeting: [
    "Guidance for {pet}'s wellbeing",
    "Smart picks for {pet}",
    "Recommended for {pet}",
    "Products suited to {pet}'s needs"
  ],
  productIntro: [
    "Carefully selected items based on {pet}'s profile",
    "Products that match {pet}'s lifestyle",
    "Thoughtful recommendations for your {breed}",
    "Items chosen with {pet} in mind"
  ],
  bundleIntro: [
    "Curated bundles for {pet}'s needs",
    "Complete solutions for your {breed}",
    "Everything {pet} needs in one place"
  ]
};

/**
 * FAREWELL-SPECIFIC COPY
 * Compassionate, gentle, memorial-focused language
 * NEVER use fun/party/social language on farewell pillar
 */
const FAREWELL_COPY = {
  greeting: [
    "Forever in our hearts",
    "Honoring {pet}'s memory",
    "A tribute to {pet}",
    "Cherishing {pet}'s legacy"
  ],
  productIntro: [
    "Memorial keepsakes for {pet}",
    "Treasured remembrances for your beloved {breed}",
    "Honoring the love you shared",
    "Beautiful tributes to cherish forever"
  ],
  bundleIntro: [
    "Memorial collections for {pet}",
    "Complete remembrance packages",
    "Everything to honor {pet}'s memory"
  ],
  sectionTitle: "Forever in our hearts",
  sectionSubtitle: "Beautiful keepsakes to honor {pet}'s memory"
};

/**
 * ADOPT-SPECIFIC COPY
 * Welcoming, hopeful, new beginnings language
 */
const ADOPT_COPY = {
  greeting: [
    "Welcome home essentials",
    "Starting fresh with {pet}",
    "New beginnings for {pet}",
    "Building a new life together"
  ],
  productIntro: [
    "First-day essentials for {pet}",
    "Everything for {pet}'s new home",
    "Starting your journey together",
    "Setting up for success with {pet}"
  ],
  bundleIntro: [
    "New home starter kits for {pet}",
    "Complete adoption bundles",
    "Everything {pet} needs to settle in"
  ]
};

/**
 * Get pillar-aware greeting
 * For emergency pillar, uses calming/supportive language
 * For advisory pillar, uses guidance-focused language
 * For farewell pillar, uses memorial/compassionate language
 * For adopt pillar, uses welcoming/hopeful language
 */
export function getPillarAwareGreeting(archetype, petName, breed, pillar) {
  if (pillar === 'emergency') {
    const template = getRandomItem(EMERGENCY_COPY.greeting);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'advisory') {
    const template = getRandomItem(ADVISORY_COPY.greeting);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'farewell') {
    const template = getRandomItem(FAREWELL_COPY.greeting);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'adopt') {
    const template = getRandomItem(ADOPT_COPY.greeting);
    return replacePlaceholders(template, petName, breed);
  }
  return getPersonalizedGreeting(archetype, petName, breed);
}

/**
 * Get pillar-aware product intro
 */
export function getPillarAwareProductIntro(archetype, petName, breed, pillar) {
  if (pillar === 'emergency') {
    const template = getRandomItem(EMERGENCY_COPY.productIntro);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'advisory') {
    const template = getRandomItem(ADVISORY_COPY.productIntro);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'farewell') {
    const template = getRandomItem(FAREWELL_COPY.productIntro);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'adopt') {
    const template = getRandomItem(ADOPT_COPY.productIntro);
    return replacePlaceholders(template, petName, breed);
  }
  return getProductIntro(archetype, petName, breed);
}

/**
 * Get pillar-aware bundle intro
 */
export function getPillarAwareBundleIntro(archetype, petName, breed, pillar) {
  if (pillar === 'emergency') {
    const template = getRandomItem(EMERGENCY_COPY.bundleIntro);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'advisory') {
    const template = getRandomItem(ADVISORY_COPY.bundleIntro);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'farewell') {
    const template = getRandomItem(FAREWELL_COPY.bundleIntro);
    return replacePlaceholders(template, petName, breed);
  }
  if (pillar === 'adopt') {
    const template = getRandomItem(ADOPT_COPY.bundleIntro);
    return replacePlaceholders(template, petName, breed);
  }
  return getBundleIntro(archetype, petName, breed);
}

/**
 * Generate section title based on archetype and context
 */
export function getSectionTitle(archetype, sectionType, petName, breed) {
  const copy = getArchetypeCopy(archetype);
  
  const titles = {
    products: {
      gentle_aristocrat: `${copy.emoji} Refined Selections for ${petName || 'Your Companion'}`,
      wild_explorer: `${copy.emoji} Adventure Gear for ${petName || 'Your Explorer'}`,
      velcro_baby: `${copy.emoji} Cozy Picks for ${petName || 'Your Snuggle Buddy'}`,
      snack_negotiator: `${copy.emoji} Tasty Finds for ${petName || 'Your Foodie'}`,
      quiet_watcher: `${copy.emoji} Gentle Options for ${petName || 'Your Thoughtful Friend'}`,
      social_butterfly: `${copy.emoji} Party Favorites for ${petName || 'Your Social Star'}`,
      brave_worrier: `${copy.emoji} Comforting Picks for ${petName || 'Your Brave One'}`
    },
    bundles: {
      gentle_aristocrat: `${copy.emoji} Curated Collections`,
      wild_explorer: `${copy.emoji} Adventure Packs`,
      velcro_baby: `${copy.emoji} Comfort Bundles`,
      snack_negotiator: `${copy.emoji} Treat Collections`,
      quiet_watcher: `${copy.emoji} Gentle Bundles`,
      social_butterfly: `${copy.emoji} Party Packs`,
      brave_worrier: `${copy.emoji} Calming Collections`
    },
    services: {
      gentle_aristocrat: `${copy.emoji} Premium Services`,
      wild_explorer: `${copy.emoji} Adventure Services`,
      velcro_baby: `${copy.emoji} Care Services`,
      snack_negotiator: `${copy.emoji} Foodie Services`,
      quiet_watcher: `${copy.emoji} Gentle Care`,
      social_butterfly: `${copy.emoji} Social Services`,
      brave_worrier: `${copy.emoji} Supportive Services`
    }
  };
  
  const key = archetype?.toLowerCase()?.replace(/\s+/g, '_');
  return titles[sectionType]?.[key] || `${DEFAULT_COPY.emoji} ${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)} for ${petName || 'Your Pet'}`;
}

export default {
  ARCHETYPE_COPY,
  getArchetypeCopy,
  getPersonalizedGreeting,
  getProductIntro,
  getBundleIntro,
  getCelebrationCopy,
  getCareRecommendation,
  getActionVerb,
  getAccentColor,
  getArchetypeDisplayInfo,
  getSectionTitle,
  getPillarAwareGreeting,
  getPillarAwareProductIntro,
  getPillarAwareBundleIntro
};

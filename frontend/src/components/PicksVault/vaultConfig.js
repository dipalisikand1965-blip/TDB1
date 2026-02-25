/**
 * CONCIERGE VAULT SYSTEM - Complete Flow Architecture
 * =====================================================
 * "Mira is the Brain, Concierge® is the Hands"
 * 
 * Same plumbing for ALL flows:
 * create_signal() → Notification → Ticket → Inbox
 * 
 * Different CONTENT based on:
 * 1. Pillar (celebrate, dine, stay, travel, care, etc.)
 * 2. Intent (products, advice, booking, places, custom, emergency)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PILLAR DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

export const PILLARS = {
  celebrate: {
    name: 'Celebrate',
    icon: '🎂',
    color: '#ec4899',
    intents: ['birthday', 'party', 'gotcha_day', 'adoption_anniversary']
  },
  dine: {
    name: 'Dine',
    icon: '🍽️',
    color: '#f97316',
    intents: ['food', 'treats', 'meal_plan', 'restaurant', 'diet']
  },
  stay: {
    name: 'Stay',
    icon: '🏨',
    color: '#8b5cf6',
    intents: ['boarding', 'daycare', 'hotel', 'pet_sitting', 'overnight']
  },
  travel: {
    name: 'Travel',
    icon: '✈️',
    color: '#3b82f6',
    intents: ['trip', 'vacation', 'flight', 'road_trip', 'carrier', 'pet_friendly']
  },
  care: {
    name: 'Care',
    icon: '💊',
    color: '#ef4444',
    intents: ['grooming', 'vet', 'health', 'vaccination', 'checkup', 'dental']
  },
  enjoy: {
    name: 'Enjoy',
    icon: '🎾',
    color: '#22c55e',
    intents: ['activity', 'park', 'playdate', 'event', 'meetup', 'cafe']
  },
  fit: {
    name: 'Fit',
    icon: '🏃',
    color: '#14b8a6',
    intents: ['exercise', 'fitness', 'weight', 'walking', 'swimming']
  },
  learn: {
    name: 'Learn',
    icon: '🎓',
    color: '#6366f1',
    intents: ['training', 'obedience', 'behavior', 'puppy_class', 'agility']
  },
  paperwork: {
    name: 'Paperwork',
    icon: '📋',
    color: '#64748b',
    intents: ['insurance', 'certificate', 'registration', 'microchip', 'documents']
  },
  emergency: {
    name: 'Emergency',
    icon: '🚨',
    color: '#dc2626',
    intents: ['urgent', 'poisoning', 'injury', 'lost_pet', 'breathing', 'accident'],
    isUrgent: true
  },
  farewell: {
    name: 'Farewell',
    icon: '🌈',
    color: '#9ca3af',
    intents: ['grief', 'loss', 'memorial', 'cremation', 'rainbow_bridge'],
    isSensitive: true
  },
  adopt: {
    name: 'Adopt',
    icon: '🐾',
    color: '#f59e0b',
    intents: ['adoption', 'foster', 'rescue', 'new_pet', 'breeder']
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT TYPES - What kind of response does user need?
// ═══════════════════════════════════════════════════════════════════════════════

export const VAULT_TYPES = {
  PICKS: 'picks',           // Products/items to select
  TIP_CARD: 'tip_card',     // Advice/plans/guides
  BOOKING: 'booking',       // Service appointments
  PLACES: 'places',         // Locations/venues
  CUSTOM: 'custom',         // Special requests
  EMERGENCY: 'emergency',   // Urgent needs
  MEMORIAL: 'memorial',     // Grief/farewell
  ADOPTION: 'adoption'      // Pet adoption
};

// ═══════════════════════════════════════════════════════════════════════════════
// PILLAR → VAULT TYPE MAPPING
// What vault types are relevant for each pillar?
// ═══════════════════════════════════════════════════════════════════════════════

export const PILLAR_VAULT_MAP = {
  celebrate: [VAULT_TYPES.PICKS, VAULT_TYPES.BOOKING, VAULT_TYPES.PLACES, VAULT_TYPES.CUSTOM],
  dine: [VAULT_TYPES.PICKS, VAULT_TYPES.TIP_CARD, VAULT_TYPES.PLACES],
  stay: [VAULT_TYPES.BOOKING, VAULT_TYPES.PLACES],
  travel: [VAULT_TYPES.PICKS, VAULT_TYPES.TIP_CARD, VAULT_TYPES.PLACES, VAULT_TYPES.BOOKING],
  care: [VAULT_TYPES.PICKS, VAULT_TYPES.TIP_CARD, VAULT_TYPES.BOOKING],
  enjoy: [VAULT_TYPES.PLACES, VAULT_TYPES.BOOKING, VAULT_TYPES.TIP_CARD],
  fit: [VAULT_TYPES.TIP_CARD, VAULT_TYPES.PICKS, VAULT_TYPES.BOOKING],
  learn: [VAULT_TYPES.BOOKING, VAULT_TYPES.TIP_CARD],
  paperwork: [VAULT_TYPES.TIP_CARD, VAULT_TYPES.CUSTOM],
  emergency: [VAULT_TYPES.EMERGENCY],
  farewell: [VAULT_TYPES.MEMORIAL],
  adopt: [VAULT_TYPES.ADOPTION, VAULT_TYPES.TIP_CARD]
};

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT → VAULT TYPE DETECTION
// Based on user's message, what vault should we show?
// ═══════════════════════════════════════════════════════════════════════════════

export const INTENT_VAULT_MAP = {
  // Product intents → PicksVault
  'treats': VAULT_TYPES.PICKS,
  'cake': VAULT_TYPES.PICKS,
  'toy': VAULT_TYPES.PICKS,
  'food': VAULT_TYPES.PICKS,
  'accessories': VAULT_TYPES.PICKS,
  'carrier': VAULT_TYPES.PICKS,
  'bed': VAULT_TYPES.PICKS,
  'collar': VAULT_TYPES.PICKS,
  'leash': VAULT_TYPES.PICKS,
  'bowl': VAULT_TYPES.PICKS,
  'shampoo': VAULT_TYPES.PICKS,
  
  // Advisory intents → TipCardVault
  'meal_plan': VAULT_TYPES.TIP_CARD,
  'diet': VAULT_TYPES.TIP_CARD,
  'exercise_plan': VAULT_TYPES.TIP_CARD,
  'travel_tips': VAULT_TYPES.TIP_CARD,
  'grooming_guide': VAULT_TYPES.TIP_CARD,
  'training_tips': VAULT_TYPES.TIP_CARD,
  'health_advice': VAULT_TYPES.TIP_CARD,
  'checklist': VAULT_TYPES.TIP_CARD,
  
  // Booking intents → BookingVault
  'grooming_appointment': VAULT_TYPES.BOOKING,
  'vet_visit': VAULT_TYPES.BOOKING,
  'training_session': VAULT_TYPES.BOOKING,
  'boarding': VAULT_TYPES.BOOKING,
  'daycare': VAULT_TYPES.BOOKING,
  'dog_walking': VAULT_TYPES.BOOKING,
  'pet_sitting': VAULT_TYPES.BOOKING,
  'photoshoot': VAULT_TYPES.BOOKING,
  'party_planning': VAULT_TYPES.BOOKING,
  
  // Places intents → PlacesVault
  'restaurant': VAULT_TYPES.PLACES,
  'cafe': VAULT_TYPES.PLACES,
  'hotel': VAULT_TYPES.PLACES,
  'park': VAULT_TYPES.PLACES,
  'beach': VAULT_TYPES.PLACES,
  'pet_friendly': VAULT_TYPES.PLACES,
  
  // Emergency intents → EmergencyVault
  'emergency': VAULT_TYPES.EMERGENCY,
  'urgent': VAULT_TYPES.EMERGENCY,
  'poisoning': VAULT_TYPES.EMERGENCY,
  'injury': VAULT_TYPES.EMERGENCY,
  'accident': VAULT_TYPES.EMERGENCY,
  'lost_pet': VAULT_TYPES.EMERGENCY,
  'breathing': VAULT_TYPES.EMERGENCY,
  
  // Custom intents → CustomVault
  'custom': VAULT_TYPES.CUSTOM,
  'special_request': VAULT_TYPES.CUSTOM,
  'not_in_catalog': VAULT_TYPES.CUSTOM,
  'bespoke': VAULT_TYPES.CUSTOM,
  
  // Memorial intents → MemorialVault
  'grief': VAULT_TYPES.MEMORIAL,
  'loss': VAULT_TYPES.MEMORIAL,
  'memorial': VAULT_TYPES.MEMORIAL,
  'cremation': VAULT_TYPES.MEMORIAL,
  'rainbow_bridge': VAULT_TYPES.MEMORIAL,
  
  // Adoption intents → AdoptionVault
  'adopt': VAULT_TYPES.ADOPTION,
  'foster': VAULT_TYPES.ADOPTION,
  'rescue': VAULT_TYPES.ADOPTION,
  'new_pet': VAULT_TYPES.ADOPTION
};

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT CONTENT TEMPLATES
// What fields are needed for each vault type?
// ═══════════════════════════════════════════════════════════════════════════════

export const VAULT_TEMPLATES = {
  [VAULT_TYPES.PICKS]: {
    title: '{pet_name}\'s Picks',
    subtitle: 'Curated with love by Mira',
    fields: ['products', 'services'],
    actions: ['select', 'refresh', 'send_to_concierge'],
    sendMessage: 'Your Pet Concierge® will get back to you shortly'
  },
  
  [VAULT_TYPES.TIP_CARD]: {
    title: '{card_type} for {pet_name}',
    subtitle: 'Mira\'s advice',
    fields: ['content', 'card_type'],
    actions: ['request_formal', 'add_notes', 'send_to_concierge'],
    sendMessage: 'Your Pet Concierge® will get back to you shortly'
  },
  
  [VAULT_TYPES.BOOKING]: {
    title: 'Book {service_type}',
    subtitle: 'For {pet_name}',
    fields: ['service_type', 'preferred_date', 'preferred_time', 'location', 'special_requirements'],
    actions: ['select_date', 'select_time', 'add_notes', 'send_to_concierge'],
    sendMessage: 'Your Pet Concierge® will confirm your booking shortly'
  },
  
  [VAULT_TYPES.PLACES]: {
    title: 'Pet-Friendly {place_type}',
    subtitle: 'Near {location}',
    fields: ['places', 'place_type', 'location'],
    actions: ['select', 'get_directions', 'make_reservation', 'send_to_concierge'],
    sendMessage: 'Your Pet Concierge® will help with arrangements'
  },
  
  [VAULT_TYPES.CUSTOM]: {
    title: 'Custom Request',
    subtitle: 'For {pet_name}',
    fields: ['description', 'requirements', 'budget', 'timeline'],
    actions: ['add_details', 'upload_reference', 'send_to_concierge'],
    sendMessage: 'Your Pet Concierge® will review and get back to you'
  },
  
  [VAULT_TYPES.EMERGENCY]: {
    title: '🚨 Emergency Help',
    subtitle: 'For {pet_name}',
    fields: ['emergency_type', 'symptoms', 'action_taken', 'location'],
    actions: ['call_vet', 'send_to_concierge'],
    sendMessage: 'Help is on the way. Stay calm.',
    isUrgent: true
  },
  
  [VAULT_TYPES.MEMORIAL]: {
    title: 'Remembering {pet_name}',
    subtitle: 'We\'re here with you',
    fields: ['service_type', 'preferences', 'special_wishes'],
    actions: ['select_service', 'add_wishes', 'send_to_concierge'],
    sendMessage: 'Our team will reach out with care and respect',
    isSensitive: true
  },
  
  [VAULT_TYPES.ADOPTION]: {
    title: 'Finding Your New Friend',
    subtitle: 'Let us help',
    fields: ['pet_type', 'breed_preference', 'age_preference', 'living_situation', 'experience'],
    actions: ['set_preferences', 'add_notes', 'send_to_concierge'],
    sendMessage: 'Your Pet Concierge® will help find the perfect match'
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Detect vault type from Mira's response
// ═══════════════════════════════════════════════════════════════════════════════

export function detectVaultType(miraResponse, pillar) {
  // Check if response has products
  if (miraResponse.products && miraResponse.products.length > 0) {
    return VAULT_TYPES.PICKS;
  }
  
  // Check if response has tip card
  if (miraResponse.tip_card || miraResponse.advice) {
    return VAULT_TYPES.TIP_CARD;
  }
  
  // Check if response has places
  if (miraResponse.places && miraResponse.places.length > 0) {
    return VAULT_TYPES.PLACES;
  }
  
  // Check if response suggests booking
  if (miraResponse.suggest_booking || miraResponse.service_type) {
    return VAULT_TYPES.BOOKING;
  }
  
  // Check for emergency
  if (pillar === 'emergency' || miraResponse.is_emergency) {
    return VAULT_TYPES.EMERGENCY;
  }
  
  // Check for farewell
  if (pillar === 'farewell' || miraResponse.is_grief) {
    return VAULT_TYPES.MEMORIAL;
  }
  
  // Check for adoption
  if (pillar === 'adopt' || miraResponse.is_adoption) {
    return VAULT_TYPES.ADOPTION;
  }
  
  // Check for custom request
  if (miraResponse.needs_custom || miraResponse.not_in_catalog) {
    return VAULT_TYPES.CUSTOM;
  }
  
  // Default based on pillar
  const pillarVaults = PILLAR_VAULT_MAP[pillar];
  if (pillarVaults && pillarVaults.length > 0) {
    return pillarVaults[0];
  }
  
  return null; // No vault needed
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Get vault config for rendering
// ═══════════════════════════════════════════════════════════════════════════════

export function getVaultConfig(vaultType, context = {}) {
  const template = VAULT_TEMPLATES[vaultType];
  if (!template) return null;
  
  // Replace placeholders in title/subtitle
  let title = template.title;
  let subtitle = template.subtitle;
  
  Object.entries(context).forEach(([key, value]) => {
    title = title.replace(`{${key}}`, value);
    subtitle = subtitle.replace(`{${key}}`, value);
  });
  
  return {
    ...template,
    title,
    subtitle,
    vaultType
  };
}

export default {
  PILLARS,
  VAULT_TYPES,
  PILLAR_VAULT_MAP,
  INTENT_VAULT_MAP,
  VAULT_TEMPLATES,
  detectVaultType,
  getVaultConfig
};

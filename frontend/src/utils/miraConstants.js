/**
 * Mira Constants & Utilities
 * ==========================
 * Extracted from MiraDemoPage.jsx for better organization
 * 
 * Contains:
 * - Service categories
 * - Experience categories
 * - Test scenarios
 * - Placeholder images
 * - Helper functions (non-hook)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// DOCK ITEMS - Clean and minimal navigation
// ═══════════════════════════════════════════════════════════════════════════════
import { MessageCircle, Package, Calendar, HelpCircle, Heart, Play } from 'lucide-react';

export const DOCK_ITEMS = [
  { id: 'concierge', label: 'Concierge®', icon: MessageCircle, action: 'openConcierge' },
  { id: 'orders', label: 'Orders', icon: Package, path: '/orders' },
  { id: 'plan', label: 'Plan', icon: Calendar, path: '/family-dashboard', tab: 'calendar' },
  { id: 'help', label: 'Help', icon: HelpCircle, action: 'openHelp' },
  { id: 'soul', label: 'Soul', icon: Heart, path: '/dashboard' },
  { id: 'learn', label: 'Learn', icon: Play, action: 'openLearn' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE OPERATING HOURS
// The Concierge works from 6:30 AM to 11:30 PM
// After hours, Mira takes requests and promises follow-up
// ═══════════════════════════════════════════════════════════════════════════════
export const CONCIERGE_HOURS = {
  start: { hour: 6, minute: 30 },
  end: { hour: 23, minute: 30 }
};

export const isConciergeLive = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const startTime = CONCIERGE_HOURS.start.hour * 60 + CONCIERGE_HOURS.start.minute;
  const endTime = CONCIERGE_HOURS.end.hour * 60 + CONCIERGE_HOURS.end.minute;
  return currentTime >= startTime && currentTime <= endTime;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONCIERGE REQUEST GENERATOR
// MIRA DOCTRINE: Concierge can do ANYTHING (legal, moral, no medical)
// ═══════════════════════════════════════════════════════════════════════════════
export const generateConciergeRequest = (query, petName) => {
  const lowerQuery = query.toLowerCase();
  
  let requestType = {
    icon: '✨',
    label: 'Custom Request',
    description: `Let us handle this for ${petName}`,
    color: '#8B5CF6'
  };
  
  // Food/Dining related
  if (lowerQuery.includes('food') || lowerQuery.includes('eat') || lowerQuery.includes('meal') || lowerQuery.includes('diet')) {
    requestType = { icon: '🍽️', label: 'Food & Nutrition', description: 'Custom meal planning and dietary support', color: '#F97316' };
  }
  // Health related (route to vet, not diagnose)
  else if (lowerQuery.includes('sick') || lowerQuery.includes('health') || lowerQuery.includes('vet') || lowerQuery.includes('doctor')) {
    requestType = { icon: '🏥', label: 'Health Support', description: 'Vet coordination and health record management', color: '#EF4444' };
  }
  // Travel related
  else if (lowerQuery.includes('travel') || lowerQuery.includes('trip') || lowerQuery.includes('flight') || lowerQuery.includes('vacation')) {
    requestType = { icon: '✈️', label: 'Travel Planning', description: 'Pet-friendly travel coordination', color: '#3B82F6' };
  }
  // Celebration related
  else if (lowerQuery.includes('birthday') || lowerQuery.includes('party') || lowerQuery.includes('celebrate')) {
    requestType = { icon: '🎂', label: 'Celebration Planning', description: 'Party planning and special occasions', color: '#EC4899' };
  }
  // Grooming related
  else if (lowerQuery.includes('groom') || lowerQuery.includes('haircut') || lowerQuery.includes('bath') || lowerQuery.includes('nail')) {
    requestType = { icon: '✂️', label: 'Grooming', description: 'Professional grooming services', color: '#10B981' };
  }
  // Boarding/Stay related
  else if (lowerQuery.includes('board') || lowerQuery.includes('stay') || lowerQuery.includes('hotel') || lowerQuery.includes('kennel')) {
    requestType = { icon: '🏠', label: 'Boarding & Stay', description: 'Trusted pet care while you\'re away', color: '#F59E0B' };
  }
  // Training related
  else if (lowerQuery.includes('train') || lowerQuery.includes('behavior') || lowerQuery.includes('obedience')) {
    requestType = { icon: '🎓', label: 'Training', description: 'Behavior training and obedience', color: '#6366F1' };
  }
  // Walking/Exercise related
  else if (lowerQuery.includes('walk') || lowerQuery.includes('exercise') || lowerQuery.includes('run')) {
    requestType = { icon: '🐕', label: 'Walking & Exercise', description: 'Daily walks and fitness activities', color: '#22C55E' };
  }
  // Shopping related
  else if (lowerQuery.includes('buy') || lowerQuery.includes('shop') || lowerQuery.includes('order') || lowerQuery.includes('product')) {
    requestType = { icon: '🛒', label: 'Shopping', description: 'Find and order pet supplies', color: '#8B5CF6' };
  }
  // Photography related
  else if (lowerQuery.includes('photo') || lowerQuery.includes('picture') || lowerQuery.includes('shoot')) {
    requestType = { icon: '📸', label: 'Pet Photography', description: 'Professional photo sessions', color: '#F43F5E' };
  }
  // Adoption related
  else if (lowerQuery.includes('adopt') || lowerQuery.includes('rescue') || lowerQuery.includes('new pet')) {
    requestType = { icon: '🐾', label: 'Adoption Support', description: 'Help with pet adoption process', color: '#A855F7' };
  }
  // Paperwork related
  else if (lowerQuery.includes('document') || lowerQuery.includes('vaccine') || lowerQuery.includes('registration') || lowerQuery.includes('license')) {
    requestType = { icon: '📄', label: 'Paperwork & Documents', description: 'Pet documentation and records', color: '#64748B' };
  }
  // Emergency (route appropriately)
  else if (lowerQuery.includes('emergency') || lowerQuery.includes('urgent') || lowerQuery.includes('accident')) {
    requestType = { icon: '🚨', label: 'Emergency Support', description: 'Urgent care coordination', color: '#DC2626' };
  }
  
  return requestType;
};

// ═══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER IMAGES - Beautiful dog images (no competitor branding)
// ═══════════════════════════════════════════════════════════════════════════════
export const DOG_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=200&h=200&fit=crop',
];

export const getPlaceholderImage = (productId) => {
  const hash = (productId || '').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const index = Math.abs(hash) % DOG_PLACEHOLDER_IMAGES.length;
  return DOG_PLACEHOLDER_IMAGES[index];
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SCENARIOS - For development and testing
// ═══════════════════════════════════════════════════════════════════════════════
export const TEST_SCENARIOS = [
  { id: 'treats', label: '🦴 Treats', query: "Show me some treats" },
  { id: 'birthday', label: '🎂 Birthday', query: "I want to plan a birthday party" },
  { id: 'food', label: '🍽️ Food', query: "What food would be best?" },
  { id: 'grooming', label: '✂️ Haircut', query: "Need a haircut, can you help?" },
  { id: 'groom-bath', label: '🛁 Bath', query: "Really needs a bath" },
  { id: 'groom-tools', label: '🧴 Tools', query: "What shampoo should I use?" },
  { id: 'groom-accident', label: '🩹 Accident', query: "I cut the nail too short and it's bleeding" },
  { id: 'health', label: '🏥 Health', query: "I'm worried about coughing" },
  { id: 'anxious', label: '😰 Anxiety', query: "Seems anxious during thunderstorms" },
  { id: 'memorial', label: '🌈 Farewell', query: "I lost my dog last week" },
  { id: 'travel', label: '✈️ Travel', query: "Planning a trip to Goa with my dog" },
  { id: 'boarding', label: '🏠 Boarding', query: "Need someone to watch while I'm away" },
  { id: 'calm', label: '😌 Calm', query: "Something to calm during Diwali fireworks" },
  { id: 'skin', label: '🐾 Skin', query: "Has dry itchy skin, keeps scratching" },
  { id: 'joint', label: '🦴 Joints', query: "Senior dog with stiff joints" },
  { id: 'not-eating', label: '🚫 Not Eating', query: "Not eating and seems tired today" },
  { id: 'acting-weird', label: '❓ Acting Weird', query: "Has been acting strange lately" },
  { id: 'memory', label: '💭 Memory', query: "Remember when we talked about skin issues?" },
  { id: 'learn', label: '📺 Learn', query: "How do I train my dog to stop barking?" },
  { id: 'hotels', label: '🏨 Hotels', query: "Find pet-friendly hotels in Mumbai" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE CATEGORIES - Maps to wizard pages on main site
// ═══════════════════════════════════════════════════════════════════════════════
export const SERVICE_CATEGORIES = {
  grooming: {
    id: 'grooming',
    label: 'Grooming',
    icon: '✂️',
    description: 'Full groom, bath, nail trim, ear cleaning',
    color: '#EC4899',
    wizardUrl: '/care?type=grooming',
    keywords: ['groom', 'haircut', 'bath', 'nail', 'trim', 'shampoo', 'brush', 'coat', 'fur', 'wash']
  },
  walks: {
    id: 'walks',
    label: 'Walks & Sitting',
    icon: '🐕',
    description: 'Daily walks, pet sitting, overnight care',
    color: '#10B981',
    wizardUrl: '/care?type=walks',
    keywords: ['walk', 'walking', 'sitter', 'sitting', 'watch', 'overnight', 'stay']
  },
  training: {
    id: 'training',
    label: 'Training & Behaviour',
    icon: '🎓',
    description: 'Obedience, anxiety, reactivity, puppy training',
    color: '#6366F1',
    wizardUrl: '/care?type=training',
    keywords: ['train', 'training', 'obedience', 'behavior', 'behaviour', 'command', 'puppy', 'leash', 'barking']
  },
  vet: {
    id: 'vet',
    label: 'Vet Coordination',
    icon: '🏥',
    description: 'Find vets, schedule reminders, health records',
    color: '#8B5CF6',
    wizardUrl: '/care?type=vet',
    keywords: ['vet', 'doctor', 'health', 'sick', 'checkup', 'vaccine', 'vaccination', 'medical']
  },
  boarding: {
    id: 'boarding',
    label: 'Boarding & Daycare',
    icon: '🏠',
    description: 'Overnight stays, daycare, kennels',
    color: '#F59E0B',
    wizardUrl: '/care?type=boarding',
    keywords: ['board', 'boarding', 'daycare', 'kennel', 'away', 'travel', 'vacation', 'stay']
  },
  photography: {
    id: 'photography',
    label: 'Pet Photography',
    icon: '📸',
    description: 'Professional photos, portraits, memories',
    color: '#EF4444',
    wizardUrl: '/care?type=photography',
    keywords: ['photo', 'photography', 'picture', 'portrait', 'shoot', 'memory', 'memories']
  }
};

export const detectServiceIntent = (query) => {
  const lowerQuery = query.toLowerCase();
  const matchedServices = [];
  
  Object.values(SERVICE_CATEGORIES).forEach(service => {
    const hasMatch = service.keywords.some(keyword => lowerQuery.includes(keyword));
    if (hasMatch) {
      matchedServices.push(service);
    }
  });
  
  return matchedServices;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMFORT MODE DETECTION
// MIRA DOCTRINE: In emotional moments, Mira is the Great Mother - comfort first
// ═══════════════════════════════════════════════════════════════════════════════
export const COMFORT_KEYWORDS = [
  'anxious', 'anxiety', 'scared', 'fear', 'nervous', 'stressed', 'panic', 'shaking', 'trembling',
  'thunderstorm', 'firework', 'loud noise', 'afraid',
  'sick', 'vomiting', 'diarrhea', 'bleeding', 'limping', 'not eating', 'won\'t eat', 'lethargic',
  'emergency', 'urgent', 'worried', 'concerning',
  'passed away', 'died', 'dying', 'lost', 'grief', 'mourning', 'farewell', 'goodbye', 'miss',
  'put down', 'euthanasia', 'rainbow bridge', 'lost my dog', 'lost my pet',
  'aggressive', 'biting', 'attacking', 'destroying', 'won\'t stop', 'keeps',
  'need help with', 'i need help', 'please help', 'help me cope'
];

export const ACKNOWLEDGMENT_PHRASES = [
  'thank you', 'thanks', 'ok', 'okay', 'i see', 'i understand', 'got it', 
  'alright', 'yes', 'no', 'hmm', 'i appreciate', 'that helps'
];

export const isComfortModeCheck = (query, conversationHistory = []) => {
  const lowerQuery = query.toLowerCase().trim();
  
  if (COMFORT_KEYWORDS.some(keyword => lowerQuery.includes(keyword))) {
    return true;
  }
  
  const isSimpleAcknowledgment = ACKNOWLEDGMENT_PHRASES.some(phrase => 
    lowerQuery === phrase || lowerQuery.startsWith(phrase)
  ) || lowerQuery.length < 20;
  
  if (isSimpleAcknowledgment && conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-4);
    const hasRecentComfortContext = recentMessages.some(msg => {
      if (msg.inComfortMode) return true;
      const content = (msg.content || '').toLowerCase();
      return COMFORT_KEYWORDS.some(keyword => content.includes(keyword));
    });
    
    if (hasRecentComfortContext) {
      return true;
    }
  }
  
  return false;
};

export const getComfortModeServices = (query) => {
  const lowerQuery = query.toLowerCase();
  const services = [];
  
  if (lowerQuery.includes('anxious') || lowerQuery.includes('scared') || 
      lowerQuery.includes('fear') || lowerQuery.includes('thunder') ||
      lowerQuery.includes('firework') || lowerQuery.includes('noise')) {
    services.push({
      ...SERVICE_CATEGORIES.training,
      description: 'Anxiety management and behavior support'
    });
  }
  
  if (lowerQuery.includes('sick') || lowerQuery.includes('emergency') ||
      lowerQuery.includes('bleeding') || lowerQuery.includes('vomit')) {
    services.push({
      ...SERVICE_CATEGORIES.vet,
      description: 'Vet coordination and urgent care support'
    });
  }
  
  return services;
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPERIENCE CATEGORIES - Premium curated experiences
// ═══════════════════════════════════════════════════════════════════════════════
export const EXPERIENCE_CATEGORIES = {
  partyPlanning: {
    id: 'party-planning',
    pillar: 'celebrate',
    label: 'Party Planning Wizard',
    icon: '🎂',
    description: 'Plan a full celebration for your pet',
    color: '#F97316',
    wizardUrl: '/celebrate/cakes',
    keywords: ['birthday', 'party', 'celebrate', 'celebration', 'gotcha', 'anniversary']
  },
  chefsTable: {
    id: 'chefs-table',
    pillar: 'dine',
    label: "Chef's Table",
    icon: '👨‍🍳',
    description: 'Private chef experience at pet-friendly restaurants',
    color: '#EF4444',
    wizardUrl: '/dine',
    keywords: ['chef', 'restaurant', 'dine', 'dining', 'eat out', 'dinner']
  },
  homeDining: {
    id: 'home-dining',
    pillar: 'dine',
    label: 'Private Home Dining',
    icon: '🏠',
    description: 'Chef comes to your home with pet-safe menu',
    color: '#22C55E',
    wizardUrl: '/dine',
    keywords: ['home', 'cook', 'chef at home', 'private', 'meal']
  },
  mealSubscription: {
    id: 'meal-subscription',
    pillar: 'dine',
    label: 'Meal Subscription',
    icon: '📦',
    description: 'Fresh pet meals delivered regularly',
    color: '#8B5CF6',
    wizardUrl: '/dine',
    keywords: ['subscription', 'deliver', 'fresh food', 'regular', 'meal plan']
  },
  pawcation: {
    id: 'pawcation',
    pillar: 'stay',
    label: 'Pawcation Curator®',
    icon: '🏝️',
    description: 'Curated pet-inclusive vacations with genuine pet love',
    color: '#06B6D4',
    wizardUrl: '/stay',
    keywords: ['vacation', 'pawcation', 'holiday', 'getaway', 'trip', 'hotel']
  },
  multiPetTravel: {
    id: 'multi-pet-travel',
    pillar: 'stay',
    label: 'Multi-Pet Travel Suite®',
    icon: '🐾',
    description: 'Coordinated stays for your entire fur family',
    color: '#A855F7',
    wizardUrl: '/stay',
    keywords: ['multiple pets', 'two dogs', 'all pets', 'family', 'together']
  },
  travelPlanning: {
    id: 'travel-planning',
    pillar: 'travel',
    label: 'Travel Planning',
    icon: '✈️',
    description: 'Pet-friendly flights, carriers, and travel essentials',
    color: '#3B82F6',
    wizardUrl: '/travel',
    keywords: ['travel', 'flight', 'fly', 'airport', 'carrier', 'plane']
  }
};

export const detectExperienceIntent = (query) => {
  const lowerQuery = query.toLowerCase();
  const matchedExperiences = [];
  
  Object.values(EXPERIENCE_CATEGORIES).forEach(exp => {
    const hasMatch = exp.keywords.some(keyword => lowerQuery.includes(keyword));
    if (hasMatch) {
      matchedExperiences.push(exp);
    }
  });
  
  return matchedExperiences;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Generate "Why for {Pet}" personalized reasons
// ═══════════════════════════════════════════════════════════════════════════════
export const generateWhyForPet = (product, pet) => {
  const productName = (product.name || '').toLowerCase();
  const petName = pet.name;
  const breed = (pet.breed || '').toLowerCase();
  const sensitivities = pet.sensitivities || [];
  
  if (sensitivities.some(s => s.toLowerCase().includes('chicken')) && 
      !productName.includes('chicken')) {
    return `Chicken-free option for ${petName}'s sensitivity`;
  }
  
  if (breed.includes('golden') || breed.includes('retriever')) {
    if (productName.includes('hip') || productName.includes('joint')) {
      return `Great for ${petName}'s breed joint health`;
    }
  }
  
  if (breed.includes('shih tzu') || breed.includes('maltese')) {
    if (productName.includes('eye') || productName.includes('tear')) {
      return `Perfect for ${petName}'s eye care needs`;
    }
  }
  
  if (productName.includes('treat') || productName.includes('snack')) {
    return `A tasty reward ${petName} will love`;
  }
  
  if (productName.includes('shampoo') || productName.includes('brush') || productName.includes('groom')) {
    return `Keeps ${petName} looking beautiful`;
  }
  
  if (productName.includes('food') || productName.includes('kibble')) {
    return `Nutrition tailored for ${petName}'s needs`;
  }
  
  if (productName.includes('toy') || productName.includes('ball') || productName.includes('chew')) {
    return `Perfect for ${petName}'s playtime`;
  }
  
  return `Selected for ${petName}'s profile`;
};

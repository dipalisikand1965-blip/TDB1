/**
 * MiraDemoPage.jsx
 * 
 * MIRA OS 10/10 - World-Class Pet Life Operating System
 * Premium Chat UI - Apple iMessage Quality + Deep Pet Personalization
 * 
 * FEATURES:
 * - Soul Score integration from member profile
 * - Apple iMessage-like spacing
 * - Pale lilac user bubbles
 * - 2x2 product grid tiles
 * - Pet avatar with concentric rings
 * - Soul traits display
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Mic, MicOff, Send, MessageCircle, Package, Calendar, 
  HelpCircle, Heart, Sparkles, ChevronDown, ChevronUp, ChevronRight,
  ShoppingBag, PawPrint, Bot, History, Plus, Check, Search,
  ThumbsUp, ThumbsDown, X, Phone, Mail, MessageSquare, AlertCircle,
  Star, Crown, Gift, Volume2, VolumeX, Wand2, ArrowRight, ExternalLink, Shield,
  Award, RefreshCw, MapPin, Navigation, Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../utils/api';
import hapticFeedback from '../utils/haptic';
import { correctSpelling } from '../utils/spellCorrect';
import conversationIntelligence from '../utils/conversationIntelligence';

// ═══════════════════════════════════════════════════════════════════════════════
// VAULT SYSTEM - "Mira is the Brain, Concierge® is the Hands"
// ═══════════════════════════════════════════════════════════════════════════════
import { VaultManager } from '../components/PicksVault';

// Formatted Text Component - Renders markdown with proper styling
// Uses wrapper div for className (react-markdown v8+ compatible)
// Pre-processes text to ensure proper markdown formatting
const FormattedText = ({ children, className = '' }) => {
  if (!children) return null;
  
  // Pre-process text to convert inline dashes to proper markdown bullet points
  const processText = (text) => {
    if (typeof text !== 'string') return text;
    
    // Convert inline formatting to proper markdown
    let processed = text
      // Convert inline numbered items to proper list format (e.g., "1. Text" → "\n1. Text")
      .replace(/([.:]\s*)(\d+)\.\s+/g, '$1\n\n$2. ')
      // Handle dashes at start of sentences (after period or colon)
      .replace(/([.:])(\s*)- /g, '$1\n\n- ')
      // Handle remaining inline dashes that look like list items
      .replace(/ - ([A-Z])/g, '\n\n- $1')
      // Convert ### headers to proper format
      .replace(/\s*###\s*/g, '\n\n### ')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n');
    
    return processed.trim();
  };
  
  return (
    <div className={`formatted-text ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-purple-200">{children}</em>,
          ul: ({ children }) => <ul className="formatted-list my-3">{children}</ul>,
          ol: ({ children }) => <ol className="formatted-list formatted-list-numbered my-3">{children}</ol>,
          li: ({ children }) => <li className="formatted-list-item">{children}</li>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-4 text-white">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-3 text-white">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-3 text-purple-200">{children}</h3>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-300 underline hover:text-purple-200">
              {children}
            </a>
          ),
          code: ({ children }) => <code className="bg-purple-900/50 px-1.5 py-0.5 rounded text-xs">{children}</code>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-purple-400 pl-3 my-3 italic text-purple-200">
              {children}
            </blockquote>
          ),
        }}
      >
        {processText(children)}
      </ReactMarkdown>
    </div>
  );
};

// TypedText Component - Streaming text animation like ChatGPT
// Displays text character by character for a premium feel
const TypedText = ({ text, speed = 40, onComplete, isLatest = false }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(!isLatest);
  
  useEffect(() => {
    // Only animate the latest message
    if (!isLatest || !text) {
      setDisplayedText(text || '');
      setIsComplete(true);
      return;
    }
    
    setDisplayedText('');
    setIsComplete(false);
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 1000 / speed);
    
    return () => clearInterval(interval);
  }, [text, speed, isLatest, onComplete]);
  
  return (
    <span className={`typed-text ${isComplete ? 'complete' : 'typing'}`}>
      {displayedText}
      {!isComplete && <span className="typing-cursor">|</span>}
    </span>
  );
};

// Confetti Component - Micro-delight for celebrations
import confetti from 'canvas-confetti';

const triggerCelebrationConfetti = () => {
  // HAPTIC: Success celebration
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([30, 50, 30, 50, 100]);
  }
  
  // Burst from both sides
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  // Fire confetti from left
  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.2 } });
  fire(0.2, { spread: 60, origin: { x: 0.2 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.2 } });
  
  // Fire confetti from right
  fire(0.25, { spread: 26, startVelocity: 55, origin: { x: 0.8 } });
  fire(0.2, { spread: 60, origin: { x: 0.8 } });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, origin: { x: 0.8 } });
};

// Import the production-style CSS (matches thedoggycompany.in)
import '../styles/mira-prod.css';

// Dock Items - Clean and minimal
const DOCK_ITEMS = [
  { id: 'concierge', label: 'Concierge®', icon: MessageCircle, action: 'openChat' },
  { id: 'orders', label: 'Orders', icon: Package, path: '/orders' },
  { id: 'plan', label: 'Plan', icon: Calendar, path: '/family-dashboard', tab: 'calendar' },
  { id: 'help', label: 'Help', icon: HelpCircle, action: 'openHelp' },
  { id: 'soul', label: 'Soul', icon: Heart, path: '/dashboard' },
  { id: 'learn', label: 'Learn', icon: Play, action: 'openLearn' },
];

// CONCIERGE OPERATING HOURS
// The Concierge® works from 6:30 AM to 11:30 PM
// After hours, Mira takes requests and promises follow-up
const CONCIERGE_HOURS = {
  start: { hour: 6, minute: 30 },
  end: { hour: 23, minute: 30 }
};

const isConciergeLive = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const startTime = CONCIERGE_HOURS.start.hour * 60 + CONCIERGE_HOURS.start.minute;
  const endTime = CONCIERGE_HOURS.end.hour * 60 + CONCIERGE_HOURS.end.minute;
  return currentTime >= startTime && currentTime <= endTime;
};

// Generate dynamic Concierge® request card for ANY request
// MIRA DOCTRINE: Concierge® can do ANYTHING (legal, moral, no medical)
const generateConciergeRequest = (query, petName) => {
  const lowerQuery = query.toLowerCase();
  
  // Detect the type of request and generate appropriate card
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

// Beautiful dog placeholder images (no competitor branding)
const DOG_PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop', // Happy golden
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop', // White fluffy
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=200&h=200&fit=crop', // Brown lab
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop', // French bulldog
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop', // Dalmatian
  'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=200&h=200&fit=crop', // Corgi
  'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=200&h=200&fit=crop', // Husky
  'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=200&h=200&fit=crop', // Beagle
];

// Get random placeholder image (consistent per product ID)
const getPlaceholderImage = (productId) => {
  const hash = (productId || '').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
  const index = Math.abs(hash) % DOG_PLACEHOLDER_IMAGES.length;
  return DOG_PLACEHOLDER_IMAGES[index];
};

// Test Scenarios
const TEST_SCENARIOS = [
  // Core scenarios
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
  // E032 Semantic Search tests
  { id: 'calm', label: '😌 Calm', query: "Something to calm during Diwali fireworks" },
  { id: 'skin', label: '🐾 Skin', query: "Has dry itchy skin, keeps scratching" },
  { id: 'joint', label: '🦴 Joints', query: "Senior dog with stiff joints" },
  // E025 Mood Detection tests
  { id: 'not-eating', label: '🚫 Not Eating', query: "Not eating and seems tired today" },
  { id: 'acting-weird', label: '❓ Acting Weird', query: "Has been acting strange lately" },
  // E033 Memory test
  { id: 'memory', label: '💭 Memory', query: "Remember when we talked about skin issues?" },
  // YouTube Training Videos test
  { id: 'learn', label: '📺 Learn', query: "How do I train my dog to stop barking?" },
  // Amadeus Travel test
  { id: 'hotels', label: '🏨 Hotels', query: "Find pet-friendly hotels in Mumbai" },
];

// SERVICE CATEGORIES - Maps to wizard pages on main site
// When Mira detects service intent, she offers self-service OR concierge
const SERVICE_CATEGORIES = {
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

// Detect which services are relevant based on query
const detectServiceIntent = (query) => {
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

// COMFORT MODE DETECTION
// MIRA DOCTRINE: In emotional moments, Mira is the Great Mother - comfort first, NOT a salesman
// When user expresses worry, fear, anxiety, grief - suppress products and be present
const COMFORT_KEYWORDS = [
  // Anxiety & Fear
  'anxious', 'anxiety', 'scared', 'fear', 'nervous', 'stressed', 'panic', 'shaking', 'trembling',
  'thunderstorm', 'firework', 'loud noise', 'afraid',
  // Health Concerns (not shopping moments)
  'sick', 'vomiting', 'diarrhea', 'bleeding', 'limping', 'not eating', 'won\'t eat', 'lethargic',
  'emergency', 'urgent', 'worried', 'concerning',
  // Grief & Loss
  'passed away', 'died', 'dying', 'lost', 'grief', 'mourning', 'farewell', 'goodbye', 'miss',
  'put down', 'euthanasia', 'rainbow bridge', 'lost my dog', 'lost my pet',
  // Behavior issues (need comfort, not products)
  'aggressive', 'biting', 'attacking', 'destroying', 'won\'t stop', 'keeps',
  // Explicit help requests for emotional support (more specific)
  'need help with', 'i need help', 'please help', 'help me cope'
];

// Simple acknowledgment phrases that should NOT trigger products
// If the conversation has emotional context, these maintain that context
const ACKNOWLEDGMENT_PHRASES = [
  'thank you', 'thanks', 'ok', 'okay', 'i see', 'i understand', 'got it', 
  'alright', 'yes', 'no', 'hmm', 'i appreciate', 'that helps'
];

const isComfortMode = (query, conversationHistory = []) => {
  const lowerQuery = query.toLowerCase().trim();
  
  // Direct comfort keyword match
  if (COMFORT_KEYWORDS.some(keyword => lowerQuery.includes(keyword))) {
    return true;
  }
  
  // Check if this is a simple acknowledgment after a comfort conversation
  // If so, stay in comfort mode
  const isSimpleAcknowledgment = ACKNOWLEDGMENT_PHRASES.some(phrase => 
    lowerQuery === phrase || lowerQuery.startsWith(phrase)
  ) || lowerQuery.length < 20; // Short replies after emotional messages
  
  if (isSimpleAcknowledgment && conversationHistory.length > 0) {
    // Check last few messages for comfort context
    const recentMessages = conversationHistory.slice(-4);
    const hasRecentComfortContext = recentMessages.some(msg => {
      if (msg.inComfortMode) return true;
      const content = (msg.content || '').toLowerCase();
      return COMFORT_KEYWORDS.some(keyword => content.includes(keyword));
    });
    
    if (hasRecentComfortContext) {
      console.log('[COMFORT_MODE] Maintaining comfort context for acknowledgment');
      return true;
    }
  }
  
  return false;
};

// When in comfort mode, only show relevant services (like Training for anxiety)
// NOT products
const getComfortModeServices = (query) => {
  const lowerQuery = query.toLowerCase();
  const services = [];
  
  // Anxiety/fear might benefit from training
  if (lowerQuery.includes('anxious') || lowerQuery.includes('scared') || 
      lowerQuery.includes('fear') || lowerQuery.includes('thunder') ||
      lowerQuery.includes('firework') || lowerQuery.includes('noise')) {
    services.push({
      ...SERVICE_CATEGORIES.training,
      description: 'Anxiety management and behavior support'
    });
  }
  
  // Health concerns might need vet coordination
  if (lowerQuery.includes('sick') || lowerQuery.includes('emergency') ||
      lowerQuery.includes('bleeding') || lowerQuery.includes('vomit')) {
    services.push({
      ...SERVICE_CATEGORIES.vet,
      description: 'Vet coordination and urgent care support'
    });
  }
  
  return services;
};

// EXPERIENCE CATEGORIES - Premium curated experiences on main site
// These are special wizard-driven experiences for each pillar
const EXPERIENCE_CATEGORIES = {
  // Celebrate Pillar
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
  // Dine Pillar
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
  // Stay Pillar
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
  // Travel Pillar
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

// Detect which experiences are relevant based on query
const detectExperienceIntent = (query) => {
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

// Helper: Generate "Why for {Pet}" personalized reasons
const generateWhyForPet = (product, pet) => {
  const productName = (product.name || '').toLowerCase();
  const petName = pet.name;
  const breed = (pet.breed || '').toLowerCase();
  const sensitivities = pet.sensitivities || [];
  
  // Check for allergies/sensitivities
  if (sensitivities.some(s => s.toLowerCase().includes('chicken')) && 
      !productName.includes('chicken')) {
    return `Chicken-free option for ${petName}'s sensitivity`;
  }
  
  // Check for breed-specific
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
  
  // Check for treats
  if (productName.includes('treat') || productName.includes('snack')) {
    return `A tasty reward ${petName} will love`;
  }
  
  // Check for grooming
  if (productName.includes('shampoo') || productName.includes('brush') || productName.includes('groom')) {
    return `Keeps ${petName} looking beautiful`;
  }
  
  // Check for food
  if (productName.includes('food') || productName.includes('kibble')) {
    return `Nutrition tailored for ${petName}'s needs`;
  }
  
  // Check for toys
  if (productName.includes('toy') || productName.includes('ball') || productName.includes('chew')) {
    return `Perfect for ${petName}'s playtime`;
  }
  
  // Default personalized message
  return `Selected for ${petName}'s profile`;
};

// Sample pet for demo - with Soul Score traits
// Note: Low soul score to demonstrate the "Help Mira know" prompt
const DEMO_PET = {
  id: 'demo-pet',
  name: 'Buddy',
  breed: 'Golden Retriever',
  age: '3 years',
  traits: ['Playful', 'Friendly', 'Energetic'],
  sensitivities: ['Chicken allergy'],
  favorites: ['Tennis balls', 'Peanut butter treats'],
  photo: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=face',
  soulTraits: [
    { label: 'Playful spirit', icon: '⭐', color: '#f59e0b' },
    { label: 'Gentle paws', icon: '🎀', color: '#ec4899' },
    { label: 'Loyal friend', icon: '❤️', color: '#ef4444' },
  ],
  soulScore: 0 // Starts at 0 - encourages users to complete soul profile
};

// All pets for multi-pet selector
const ALL_PETS = [
  DEMO_PET,
  {
    id: 'pet-2',
    name: 'Luna',
    breed: 'Labrador',
    age: '5 years',
    sensitivities: [],
    photo: null,
    soulTraits: [
      { label: 'Calm soul', icon: '🌙', color: '#8b5cf6' },
      { label: 'Wise eyes', icon: '👁️', color: '#06b6d4' },
    ],
    soulScore: 32 // Low score to show the "Help Mira know" prompt for comparison
  }
];

const MiraDemoBackupPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [activeScenario, setActiveScenario] = useState(null);
  const [showScenarios, setShowScenarios] = useState(true);
  // Remember if user dismissed Test Scenarios modal
  const [showTestScenarios, setShowTestScenarios] = useState(() => {
    const dismissed = localStorage.getItem('mira_test_scenarios_dismissed');
    return dismissed !== 'true';
  });
  const [collapsedSections, setCollapsedSections] = useState({});
  const [currentTicket, setCurrentTicket] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [currentPillar, setPillar] = useState('celebrate');
  const [lastShownProducts, setLastShownProducts] = useState([]);
  const [isRecording, setIsRecording] = useState(false); // For universal search voice
  
  // Core conversation state
  const [query, setQuery] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Pet state
  const [pet, setPet] = useState(DEMO_PET);
  const [allPets, setAllPets] = useState(ALL_PETS);
  
  // UI modals and helpers
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [learnVideos, setLearnVideos] = useState([]);
  const [learnLoading, setLearnLoading] = useState(false);
  const [learnCategory, setLearnCategory] = useState('recommended');
  const [activeDockItem, setActiveDockItem] = useState(null);
  
  // MIRA ENGINE MODES - Visible to user like ChatGPT's "Thinking"
  // /Instant - Quick, lightweight replies
  // /Thinking - Deep reasoning for PLAN, BOOK, EXECUTE, ADVISE
  // /Comfort - Grief, loss, emotional support
  // /Emergency - Vet-first urgent moments
  const [miraMode, setMiraMode] = useState('ready'); // ready, instant, thinking, comfort, emergency
  const [typingText, setTypingText] = useState(''); // For typing animation
  const [isTyping, setIsTyping] = useState(false);
  
  // VOICE OUTPUT - Mira speaks back with ElevenLabs
  const [voiceEnabled, setVoiceEnabled] = useState(true); // Voice ON by default per MIRA SPEED DOCTRINE
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);
  const voiceTimeoutRef = useRef(null); // Track pending voice timeouts to prevent double voice
  const skipVoiceOnNextResponseRef = useRef(false); // Skip voice when tile is clicked
  
  // CONVERSATION HISTORY - Collapsible older messages
  const [showOlderMessages, setShowOlderMessages] = useState(false);
  const VISIBLE_MESSAGE_COUNT = 4; // Show last 4 messages (2 pairs of user+mira)
  
  // CONVERSATION INTELLIGENCE - Context retention for follow-ups
  const [conversationContext, setConversationContext] = useState(() => 
    conversationIntelligence.createConversationContext(pet)
  );
  
  // GEOLOCATION - Get user's actual location for weather/nearby
  const [userGeoLocation, setUserGeoLocation] = useState(null);
  const [userCity, setUserCity] = useState('Mumbai'); // Fallback
  
  // Initialize haptic audio context on first user interaction (required for iOS)
  useEffect(() => {
    const initHapticAudio = () => {
      hapticFeedback.init();
      document.removeEventListener('touchstart', initHapticAudio);
      document.removeEventListener('click', initHapticAudio);
    };
    
    document.addEventListener('touchstart', initHapticAudio, { once: true });
    document.addEventListener('click', initHapticAudio, { once: true });
    
    return () => {
      document.removeEventListener('touchstart', initHapticAudio);
      document.removeEventListener('click', initHapticAudio);
    };
  }, []);
  
  // Fetch user's geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserGeoLocation({ latitude, longitude });
          
          // Reverse geocode to get city name
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            const city = data.address?.city || data.address?.town || data.address?.state || 'Mumbai';
            setUserCity(city);
            console.log('[GEO] User location detected:', city);
          } catch (e) {
            console.log('[GEO] Could not get city name, using default');
          }
        },
        (error) => {
          console.log('[GEO] Location access denied or unavailable:', error.message);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);
  
  // Cleanup voice on unmount to prevent memory leaks and double voice
  useEffect(() => {
    return () => {
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Typing animation - streams text character by character
  const typeText = useCallback((fullText, onComplete, speed = 35) => {
    if (!fullText) {
      onComplete?.();
      return;
    }
    
    setIsTyping(true);
    setTypingText('');
    let index = 0;
    
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypingText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        onComplete?.();
      }
    }, 1000 / speed); // speed = chars per second
    
    return () => clearInterval(interval);
  }, []);
  
  // E024: AUTO VOICE PERSONALITY - Mira auto-detects context and adjusts voice
  const detectVoicePersonality = useCallback((text, context = {}) => {
    const lowerText = (text || '').toLowerCase();
    
    // Celebration context - birthdays, parties, milestones, anniversaries
    if (/birthday|celebrate|party|anniversary|congrat|milestone|achievement|🎂|🎉|🎁|hamper|pawty|gotcha/.test(lowerText)) {
      return 'celebration'; // Happy, excited, joyful
    }
    
    // Comfort context - grief, anxiety, loss, emotional support
    if (/passed away|rainbow bridge|grief|anxious|scared|worried|nervous|miss|lost|sad|crying|comfort|sorry for|🌈|💔/.test(lowerText)) {
      return 'comfort'; // Soft, slow, empathetic
    }
    
    // Health context - vet, medical, vaccines, checkups
    if (/vet|vaccine|checkup|health|medical|sick|symptoms|medicine|doctor|hospital|injury|💉|🏥/.test(lowerText)) {
      return 'health'; // Calm, reassuring, clear
    }
    
    // Urgent context - immediate action needed
    if (/urgent|emergency|immediately|asap|right now|critical|danger|alert|⚠️|🚨/.test(lowerText)) {
      return 'urgent'; // Alert but calm
    }
    
    // Travel/Adventure context - trips, hotels, exploring
    if (/travel|trip|journey|hotel|vacation|holiday|adventure|explore|visit|destination|✈️|🚗|🏨/.test(lowerText)) {
      return 'adventure'; // Upbeat, helpful, encouraging
    }
    
    // Grooming/Care context - spa, grooming, bath
    if (/groom|bath|spa|haircut|nail|brush|coat|clean|🛁|✂️/.test(lowerText)) {
      return 'caring'; // Warm, professional
    }
    
    // Food/Nutrition context - meals, treats, diet
    if (/food|meal|treat|diet|nutrition|feeding|recipe|🍖|🦴/.test(lowerText)) {
      return 'informative'; // Helpful, knowledgeable
    }
    
    // Default warm voice
    return 'default'; // Warm, friendly, conversational
  }, []);
  
  // IN-MIRA SERVICE REQUEST - Everything stays in the OS
  // When user clicks a service card, show form here instead of external link
  const [serviceRequestModal, setServiceRequestModal] = useState({
    isOpen: false,
    service: null,  // The service/experience being requested
    formData: {},   // User's input
    isSubmitting: false,
    submitted: false
  });
  
  // MULTI-PET SUPPORT - Switch between pets
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [userHasOptedInForProducts, setUserHasOptedInForProducts] = useState(false);
  
  // MULTI-SESSION MANAGEMENT - Past chats
  const [pastSessions, setPastSessions] = useState([]);
  const [showPastChats, setShowPastChats] = useState(false);
  const [loadingPastChats, setLoadingPastChats] = useState(false);
  
  // INACTIVITY AUTO-ARCHIVE: After 30 mins of no activity, archive conversation to past chats
  const lastActivityRef = useRef(Date.now());
  const inactivityTimerRef = useRef(null);
  
  // Reset inactivity timer on any user interaction
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);
  
  // CONVERSATION FLOW DETECTION - Track when Mira has provided assistance
  const [conversationComplete, setConversationComplete] = useState(false);
  const [showConversationEndBanner, setShowConversationEndBanner] = useState(false);
  
  // Detect if conversation is "complete" (Mira has provided assistance)
  // A complete flow = User asked → Mira responded with products/action → User acknowledged
  const detectConversationComplete = useCallback((history) => {
    if (history.length < 2) return false;
    
    const lastMessages = history.slice(-4);
    const hasUserMessage = lastMessages.some(m => m.type === 'user');
    const hasMiraResponse = lastMessages.some(m => m.type === 'mira');
    const hasMiraWithProducts = lastMessages.some(m => 
      m.type === 'mira' && (m.showProducts || m.data?.response?.products?.length > 0)
    );
    const hasMiraWithAction = lastMessages.some(m =>
      m.type === 'mira' && (m.showConcierge || m.data?.nearby_places || m.data?.training_videos)
    );
    
    // Complete if: Mira provided products/action AND user sent follow-up (thank you, ok, etc.)
    if ((hasMiraWithProducts || hasMiraWithAction) && hasUserMessage) {
      const lastUserMsg = lastMessages.filter(m => m.type === 'user').pop();
      const acknowledgmentPhrases = ['thank', 'thanks', 'ok', 'okay', 'great', 'perfect', 'got it', 'nice', 'awesome', 'good', 'done', 'yes'];
      const isAcknowledgment = acknowledgmentPhrases.some(p => 
        (lastUserMsg?.content || '').toLowerCase().includes(p)
      );
      return isAcknowledgment;
    }
    
    return false;
  }, []);
  
  // Archive conversation helper
  const archiveCurrentConversation = useCallback((reason = 'manual') => {
    if (conversationHistory.length < 2) return;
    
    const sessionToArchive = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      pet_name: pet.name,
      pet_id: pet.id,
      messages: conversationHistory,
      summary: conversationHistory.find(m => m.type === 'user')?.content?.slice(0, 50) || 'Conversation',
      archived_reason: reason
    };
    
    setPastSessions(prev => [sessionToArchive, ...prev]);
    setConversationHistory([]);
    setMiraPicks({ products: [], services: [], context: '', hasNew: false });
    setConversationComplete(false);
    setShowConversationEndBanner(false);
    lastActivityRef.current = Date.now();
    
    console.log(`[MIRA] Conversation archived: ${reason}`);
  }, [conversationHistory, pet.name, pet.id]);
  
  // Check for inactivity and archive conversation
  useEffect(() => {
    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes (changed from 30)
    
    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      
      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT && conversationHistory.length > 1) {
        archiveCurrentConversation('inactivity');
      }
    };
    
    // Check every 30 seconds for faster detection
    inactivityTimerRef.current = setInterval(checkInactivity, 30 * 1000);
    
    // Track user activity
    const handleActivity = () => resetInactivityTimer();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [conversationHistory, archiveCurrentConversation, resetInactivityTimer]);
  
  // Check for conversation completion after each message
  useEffect(() => {
    if (conversationHistory.length > 0 && detectConversationComplete(conversationHistory)) {
      setConversationComplete(true);
      // Show banner after a short delay
      setTimeout(() => {
        setShowConversationEndBanner(true);
      }, 1500);
    }
  }, [conversationHistory, detectConversationComplete]);
  
  // FLOATING TOOLBAR - Clean conversation flow
  // Insight & Concierge® icons at top, expand on tap
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [showConciergePanel, setShowConciergePanel] = useState(false);
  const [latestInsights, setLatestInsights] = useState([]); // Collected from all messages
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VAULT SYSTEM - "Mira is the Brain, Concierge® is the Hands"
  // Full-screen vault overlay for picks, booking, places, etc.
  // ═══════════════════════════════════════════════════════════════════════════
  const [showVault, setShowVault] = useState(false);
  const [activeVaultData, setActiveVaultData] = useState(null);
  const [vaultUserMessage, setVaultUserMessage] = useState('');
  
  // ═══════════════════════════════════════════════════════════════════════════
  // "READY FOR [PET]" TRAY - World Class UX
  // Conversation stays clean. Products/services ready when customer wants them.
  // Concierge® is ALWAYS by your side - the helping hand.
  // ═══════════════════════════════════════════════════════════════════════════
  const [miraPicks, setMiraPicks] = useState({
    products: [],
    services: [],
    context: '', // e.g., "Road Trip", "Birthday", "Grooming"
    hasNew: false // Glows when Mira has new picks
  });
  const [showMiraTray, setShowMiraTray] = useState(false);
  
  // Unified C® button state (collapsed by default, expands to show WhatsApp/Chat/Email)
  const [showConciergeOptions, setShowConciergeOptions] = useState(false);
  
  // E018 & E019: Proactive Notifications - Birthday/Health Reminders
  const [proactiveAlerts, setProactiveAlerts] = useState({
    celebrations: [],
    healthReminders: [],
    hasUrgent: false
  });
  
  // Proactive Greeting - Time-based and context-aware
  const [proactiveGreeting, setProactiveGreeting] = useState(null);
  
  // Generate proactive greeting based on time and pet context
  useEffect(() => {
    if (!pet?.name) return;
    
    const hour = new Date().getHours();
    let greeting = '';
    let icon = '';
    let hasAlert = false;
    
    // Time-based greeting
    if (hour >= 5 && hour < 12) {
      greeting = `Good morning! How's ${pet.name} today?`;
      icon = '🌅';
    } else if (hour >= 12 && hour < 17) {
      greeting = `Good afternoon! What can I help with for ${pet.name}?`;
      icon = '☀️';
    } else if (hour >= 17 && hour < 21) {
      greeting = `Good evening! How was ${pet.name}'s day?`;
      icon = '🌆';
    } else {
      greeting = `Hello! ${pet.name} keeping you up? 😄`;
      icon = '🌙';
    }
    
    // Check for upcoming celebrations
    if (proactiveAlerts.celebrations.length > 0) {
      const upcoming = proactiveAlerts.celebrations.find(c => c.is_upcoming);
      if (upcoming) {
        greeting = `${upcoming.event} is coming up! Let's plan something special for ${pet.name}! 🎉`;
        icon = '🎂';
        hasAlert = true;
      }
    }
    
    // Check for health reminders
    if (proactiveAlerts.healthReminders.some(r => r.needs_attention)) {
      const urgent = proactiveAlerts.healthReminders.find(r => r.needs_attention);
      if (urgent && !hasAlert) {
        greeting = `Reminder: ${urgent.title} for ${pet.name}. Shall I help schedule?`;
        icon = '💊';
        hasAlert = true;
      }
    }
    
    setProactiveGreeting({ text: greeting, icon, hasAlert });
  }, [pet?.name, proactiveAlerts]);
  
  // HEALTH VAULT - Track completeness and prompt for missing data
  const [healthVault, setHealthVault] = useState({
    completeness: 0, // Start at 0, will update when pet data loads
    missing_fields: [],
    showWizard: false,
    currentField: null
  });
  
  // PERSONALIZATION TICKER - Moving ticker at top
  const [tickerItems, setTickerItems] = useState([]);
  
  // E027: DAILY DIGEST
  const [dailyDigest, setDailyDigest] = useState(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TYPING ANIMATION - Stream text like a real assistant
  // ═══════════════════════════════════════════════════════════════════════════
  // isTyping, typingText already declared above with miraMode
  const [displayedText, setDisplayedText] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Typing speeds per mode (chars per second)
  const TYPING_SPEEDS = {
    default: 40,
    celebration: 50,
    comfort: 20,
    emergency: 30,
    adventure: 45,
    informative: 35,
    caring: 35,
    health: 30
  };
  
  // Stream text with typing animation
  const streamTextAnimation = useCallback(async (text, mode = 'default') => {
    const speed = TYPING_SPEEDS[mode] || TYPING_SPEEDS.default;
    const charDelay = 1000 / speed; // ms per character
    
    setIsTyping(true);
    setDisplayedText('');
    
    // Split into words for more natural feel
    const words = text.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      // Add word with space
      currentText += (i > 0 ? ' ' : '') + word;
      setDisplayedText(currentText);
      
      // Variable delay - longer for punctuation
      let delay = charDelay * word.length;
      if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
        delay += 150; // Pause after sentences
      } else if (word.endsWith(',')) {
        delay += 50; // Small pause after commas
      }
      
      // Cap delay to prevent too slow
      delay = Math.min(delay, 200);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setIsTyping(false);
    return text;
  }, []);
  
  // E028: MILESTONES
  const [milestones, setMilestones] = useState([]);
  
  // E030: MEMORY LANE
  const [memoryLane, setMemoryLane] = useState([]);
  
  // E034: REORDER SUGGESTIONS
  const [reorderSuggestions, setReorderSuggestions] = useState([]);
  
  // SESSION PERSISTENCE - The memory that never forgets
  const [sessionId, setSessionId] = useState(() => {
    // Try to recover session from localStorage first
    const savedSession = localStorage.getItem('mira_session_id');
    if (savedSession) {
      console.log('[SESSION] Recovered session:', savedSession);
      return savedSession;
    }
    // Generate new session if none exists
    const newSession = `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('mira_session_id', newSession);
    console.log('[SESSION] Created new session:', newSession);
    return newSession;
  });
  const [sessionRecovered, setSessionRecovered] = useState(false);
  
  // Conversation stage tracking
  // Stage: 'initial' | 'clarifying' | 'concierge_engaged'
  const [conversationStage, setConversationStage] = useState('initial');
  
  // Step tracking - ANTI-LOOP SYSTEM
  // Tracks which steps (questions) have been asked and answered
  const [completedSteps, setCompletedSteps] = useState([]);  // List of step_ids that are done
  const [currentStep, setCurrentStep] = useState(null);  // Currently open step waiting for answer
  const [stepHistory, setStepHistory] = useState([]);  // Full history of Q&A
  
  // WEATHER & INTERACTIVE FEATURES
  const [currentWeather, setCurrentWeather] = useState(null);
  const [showFeatureShowcase, setShowFeatureShowcase] = useState(true);
  
  // Feature showcase items - What Mira can do
  const MIRA_FEATURES = [
    { 
      id: 'weather', 
      icon: '🌤️', 
      title: 'Weather & Walks', 
      description: 'Is it safe to walk?',
      query: `Is it a good day to take ${pet?.name || 'my dog'} for a walk?`,
      color: '#3B82F6'
    },
    { 
      id: 'vet', 
      icon: '🏥', 
      title: 'Find a Vet', 
      description: 'Nearest clinics',
      query: `Find me a vet clinic nearby`,
      color: '#EF4444'
    },
    { 
      id: 'park', 
      icon: '🌳', 
      title: 'Dog Parks', 
      description: 'Places to play',
      query: `Where can I take ${pet?.name || 'my dog'} to a dog park?`,
      color: '#22C55E'
    },
    { 
      id: 'food', 
      icon: '🍽️', 
      title: 'Pet Cafes', 
      description: 'Dine with your pet',
      query: `Recommend a pet-friendly cafe for brunch`,
      color: '#F97316'
    },
    { 
      id: 'travel', 
      icon: '✈️', 
      title: 'Travel', 
      description: 'Pet-friendly stays',
      query: `Find pet-friendly hotels for a trip`,
      color: '#8B5CF6'
    },
    { 
      id: 'shop', 
      icon: '🛍️', 
      title: 'Shop', 
      description: 'Treats & supplies',
      query: `Show me treats for ${pet?.name || 'my dog'}`,
      color: '#EC4899'
    }
  ];
  
  // Refs
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const handleSubmitRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  // LOAD REAL PET DATA when user is logged in
  useEffect(() => {
    const loadUserPets = async () => {
      if (!token) return;
      
      try {
        console.log('[PETS] Loading user pets...');
        const response = await fetch(`${API_URL}/api/pets`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            console.log('[PETS] Loaded', data.pets.length, 'pets');
            
            // Transform pets to include soul traits
            const transformedPets = data.pets.map(p => {
              // Generate soul traits from doggy_soul_answers
              const soulAnswers = p.doggy_soul_answers || {};
              const soulTraits = [];
              
              if (soulAnswers.general_nature) {
                soulTraits.push({ 
                  label: `${soulAnswers.general_nature} soul`, 
                  icon: '⭐', 
                  color: '#f59e0b' 
                });
              }
              if (soulAnswers.describe_3_words) {
                const words = soulAnswers.describe_3_words.split(',')[0]?.trim();
                if (words) {
                  soulTraits.push({ 
                    label: words, 
                    icon: '🎀', 
                    color: '#ec4899' 
                  });
                }
              }
              if (p.soul?.love_language) {
                soulTraits.push({ 
                  label: `${p.soul.love_language} lover`, 
                  icon: '❤️', 
                  color: '#ef4444' 
                });
              }
              
              // Get sensitivities/allergies
              const sensitivities = [];
              if (p.preferences?.allergies) {
                if (Array.isArray(p.preferences.allergies)) {
                  sensitivities.push(...p.preferences.allergies.map(a => `${a} allergy`));
                } else if (typeof p.preferences.allergies === 'string' && p.preferences.allergies !== 'None') {
                  sensitivities.push(`${p.preferences.allergies} allergy`);
                }
              }
              if (p.health_vault?.allergies) {
                p.health_vault.allergies.forEach(a => {
                  sensitivities.push(`${a.allergen} allergy`);
                });
              }
              
              return {
                id: p.id,
                name: p.name,
                breed: p.breed,
                age: p.age_years ? `${p.age_years} years` : '',
                photo: p.photo_url ? `${API_URL}${p.photo_url}` : null,
                soulScore: Math.round(p.overall_score || 0),
                soulTraits: soulTraits.length > 0 ? soulTraits : [
                  { label: 'Unique soul', icon: '⭐', color: '#f59e0b' }
                ],
                sensitivities: sensitivities,
                favorites: p.preferences?.favorite_flavors || [],
                personality: p.soul?.persona || 'friendly'
              };
            });
            
            setAllPets(transformedPets);
            if (transformedPets.length > 0) {
              setPet(transformedPets[0]);
            }
          }
        }
      } catch (err) {
        console.warn('[PETS] Failed to load pets:', err);
      }
    };
    
    loadUserPets();
  }, [token]);
  
  // SESSION RECOVERY - Load conversation from backend on page load
  useEffect(() => {
    const recoverSession = async () => {
      if (sessionRecovered || !sessionId) return;
      
      try {
        console.log('[SESSION] Attempting to recover session:', sessionId);
        const response = await fetch(`${API_URL}/api/mira/session/${sessionId}/messages?limit=50`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            console.log('[SESSION] Recovered', data.messages.length, 'messages');
            
            // Convert backend format to frontend format
            const recoveredHistory = data.messages.map(msg => ({
              type: msg.role === 'user' ? 'user' : 'mira',
              content: msg.content,
              timestamp: msg.timestamp,
              intent: msg.intent,
              executionType: msg.execution_type,
              products: msg.products || []
            }));
            
            setConversationHistory(recoveredHistory);
            setSessionRecovered(true);
          }
        } else if (response.status === 404) {
          // Session doesn't exist yet - that's OK, it's a new conversation
          console.log('[SESSION] New session, no history to recover');
          setSessionRecovered(true);
        }
      } catch (err) {
        console.warn('[SESSION] Recovery failed:', err);
        setSessionRecovered(true);
      }
    };
    
    recoverSession();
  }, [sessionId, sessionRecovered]);
  
  // Clear session function (for "New Chat" button)
  const startNewSession = () => {
    const newSession = `mira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('mira_session_id', newSession);
    localStorage.setItem('mira_session_pet_id', pet.id); // Track which pet this session is for
    setSessionId(newSession);
    setConversationHistory([]);
    setCompletedSteps([]);
    setCurrentStep(null);
    setStepHistory([]);
    setConversationStage('initial');
    setUserHasOptedInForProducts(false);
    setSessionRecovered(true);
    setShowPastChats(false);
    console.log('[SESSION] Started new session:', newSession, 'for pet:', pet.name);
  };
  
  // FETCH WEATHER DATA for pet activity recommendations
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Priority: pet profile location > geolocation > default
        const weatherCity = pet?.location?.city || pet?.city || userCity;
        const response = await fetch(`${API_URL}/api/mira/weather/pet-activity?city=${encodeURIComponent(weatherCity)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCurrentWeather(data);
            console.log('[WEATHER] Loaded weather for', data.city, ':', data.pet_advisory?.safety_level);
          }
        }
      } catch (error) {
        console.log('[WEATHER] Could not load weather:', error.message);
      }
    };
    
    fetchWeather();
    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [pet?.city, pet?.location?.city, userCity]);
  
  // MULTI-PET: Fetch all user's pets
  useEffect(() => {
    const fetchAllPets = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            const formattedPets = data.pets.map(p => ({
              id: p.id,
              name: p.name,
              breed: p.breed,
              age: p.age || 'Unknown',
              // Ensure arrays - doggy_soul_answers fields might be strings
              traits: (() => {
                const raw = p.doggy_soul_answers?.describe_3_words;
                if (!raw) return ['Loving'];
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
                return ['Loving'];
              })(),
              sensitivities: (() => {
                const raw = p.doggy_soul_answers?.health_conditions;
                if (!raw) return [];
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
                return [];
              })(),
              favorites: (() => {
                const raw = p.doggy_soul_answers?.favorite_treats;
                if (!raw) return [];
                if (Array.isArray(raw)) return raw;
                if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
                return [];
              })(),
              photo: p.photo || null
            }));
            setAllPets(formattedPets);
            // Set first pet as active if no pet selected
            if (!pet || pet.id === 'demo-pet') {
              setPet(formattedPets[0]);
            }
          }
        }
      } catch (err) {
        console.debug('Could not fetch pets, using demo pet');
      }
    };
    fetchAllPets();
  }, [token]);
  
  // E018 & E019: Fetch proactive alerts when pet changes
  useEffect(() => {
    const fetchProactiveAlerts = async () => {
      if (!pet.id || pet.id === 'demo') return;
      
      try {
        // Fetch celebrations, health reminders, health vault status, weather, and bundles in parallel
        const [celebResponse, healthResponse, vaultResponse, weatherResponse, bundlesResponse] = await Promise.all([
          fetch(`${API_URL}/api/mira/celebrations/${pet.id}`),
          fetch(`${API_URL}/api/mira/health-reminders/${pet.id}`),
          fetch(`${API_URL}/api/mira/health-vault/status/${pet.id}`),
          fetch(`${API_URL}/api/mira/weather-suggestions/${pet.id}`),
          fetch(`${API_URL}/api/mira/bundles/${pet.id}`)
        ]);
        
        const celebData = celebResponse.ok ? await celebResponse.json() : { celebrations: [] };
        const healthData = healthResponse.ok ? await healthResponse.json() : { reminders: [] };
        const vaultData = vaultResponse.ok ? await vaultResponse.json() : { completeness: 100, missing_fields: [] };
        const weatherData = weatherResponse.ok ? await weatherResponse.json() : { suggestions: [] };
        const bundlesData = bundlesResponse.ok ? await bundlesResponse.json() : { bundles: [] };
        
        setProactiveAlerts({
          celebrations: celebData.celebrations || [],
          healthReminders: healthData.reminders || [],
          weatherSuggestions: weatherData.suggestions || [],
          weather: weatherData.weather || {},
          bundles: bundlesData.bundles || [],
          hasUrgent: healthData.has_urgent || celebData.celebrations?.some(c => c.is_today)
        });
        
        // Also fetch places, stats, and new E027-E034 features for ticker
        const placesCity = pet?.location?.city || pet?.city || userCity;
        const [placesResponse, statsResponse, digestResponse, milestonesResponse, memoryResponse, reorderResponse] = await Promise.all([
          fetch(`${API_URL}/api/mira/places/${pet.id}?city=${encodeURIComponent(placesCity)}`),
          fetch(`${API_URL}/api/mira/personalization-stats/${pet.id}`),
          fetch(`${API_URL}/api/mira/daily-digest/${pet.id}`),
          fetch(`${API_URL}/api/mira/milestones/${pet.id}`),
          fetch(`${API_URL}/api/mira/memory-lane/${pet.id}`),
          fetch(`${API_URL}/api/mira/reorder-suggestions/${pet.id}`)
        ]);
        
        const placesData = placesResponse.ok ? await placesResponse.json() : { places: [] };
        const statsData = statsResponse.ok ? await statsResponse.json() : { stats: [] };
        const digestData = digestResponse.ok ? await digestResponse.json() : { digest: [] };
        const milestonesData = milestonesResponse.ok ? await milestonesResponse.json() : { milestones: [] };
        const memoryData = memoryResponse.ok ? await memoryResponse.json() : { memories: [] };
        const reorderData = reorderResponse.ok ? await reorderResponse.json() : { suggestions: [] };
        
        // Store new feature data
        setDailyDigest(digestData);
        setMilestones(milestonesData.milestones || []);
        setMemoryLane(memoryData.memories || []);
        setReorderSuggestions(reorderData.suggestions || []);
        
        // Build ticker items
        const tickerItems = [];
        
        // Add weather
        if (weatherData.weather) {
          const temp = weatherData.weather.temp;
          const icon = temp >= 30 ? '☀️' : temp <= 20 ? '❄️' : '🌤️';
          tickerItems.push({
            icon,
            text: `${temp}°C in ${weatherData.city || placesCity}`,
            type: 'weather'
          });
        }
        
        // Add personalization stats
        statsData.stats?.forEach(s => tickerItems.push(s));
        
        // Add milestones to ticker (E028)
        milestonesData.milestones?.filter(m => m.achieved).slice(0, 2).forEach(m => {
          tickerItems.push({
            icon: m.icon,
            text: m.title,
            type: 'milestone'
          });
        });
        
        // Add memory lane moments to ticker (E030)
        memoryData.memories?.slice(0, 1).forEach(m => {
          tickerItems.push({
            icon: m.icon,
            text: m.title,
            type: 'memory'
          });
        });
        
        // Add places
        placesData.places?.slice(0, 3).forEach(p => {
          tickerItems.push({
            icon: p.icon,
            text: `${p.name} welcomes ${pet.name}`,
            type: 'place',
            placeId: p.id
          });
        });
        
        setTickerItems(tickerItems);
        
        // Update health vault status
        setHealthVault(prev => ({
          ...prev,
          completeness: vaultData.completeness || 0,
          missing_fields: vaultData.missing_fields || [],
          needsAttention: vaultData.needs_attention
        }));
        
        console.log('[PROACTIVE] Alerts loaded:', {
          celebrations: celebData.celebrations?.length || 0,
          health: healthData.reminders?.length || 0,
          vaultCompleteness: vaultData.completeness
        });
      } catch (err) {
        console.debug('[PROACTIVE] Could not fetch alerts:', err);
      }
    };
    
    fetchProactiveAlerts();
  }, [pet.id]);
  
  // MULTI-PET: Switch to a different pet
  const switchPet = async (newPet) => {
    if (newPet.id === pet.id) {
      setShowPetSelector(false);
      return;
    }
    
    console.log('[PET SWITCH] Switching to:', newPet.name);
    setPet(newPet);
    setShowPetSelector(false);
    
    // Try to load this pet's latest session
    try {
      const response = await fetch(`${API_URL}/api/mira/session/switch-pet?pet_id=${newPet.id}&pet_name=${encodeURIComponent(newPet.name)}&pet_breed=${encodeURIComponent(newPet.breed || '')}&member_id=${user?.id || 'demo'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const newSessionId = data.session_id;
        
        localStorage.setItem('mira_session_id', newSessionId);
        localStorage.setItem('mira_session_pet_id', newPet.id);
        setSessionId(newSessionId);
        
        if (data.is_new) {
          // New session for this pet
          setConversationHistory([]);
          console.log('[PET SWITCH] Created new session for', newPet.name);
        } else {
          // Existing session - load messages
          const recoveredHistory = (data.messages || []).map(msg => ({
            type: msg.role === 'user' ? 'user' : 'mira',
            content: msg.content,
            timestamp: msg.timestamp,
            intent: msg.intent,
            executionType: msg.execution_type,
            products: msg.products || []
          }));
          setConversationHistory(recoveredHistory);
          console.log('[PET SWITCH] Loaded', recoveredHistory.length, 'messages for', newPet.name);
        }
        
        // Reset conversation state
        setCompletedSteps([]);
        setCurrentStep(null);
        setStepHistory([]);
        setConversationStage('initial');
        setUserHasOptedInForProducts(false);
        setCurrentTicket(null);
        // MULTI-PET FIX: Clear Mira Picks when switching pets
        setMiraPicks({ products: [], services: [], hasNew: false, context: '' });
      }
    } catch (err) {
      console.error('[PET SWITCH] Error:', err);
      // Fallback: just start fresh
      startNewSession();
      // MULTI-PET FIX: Also clear Mira Picks on error
      setMiraPicks({ products: [], services: [], hasNew: false, context: '' });
    }
  };
  
  // MULTI-SESSION: Load past chats
  const loadPastChats = async () => {
    if (loadingPastChats) return;
    setLoadingPastChats(true);
    
    try {
      const memberId = user?.id || user?.email || 'demo';
      const response = await fetch(`${API_URL}/api/mira/session/list/by-member/${encodeURIComponent(memberId)}?limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      if (response.ok) {
        const data = await response.json();
        setPastSessions(data.sessions || []);
        console.log('[PAST CHATS] Loaded', data.sessions?.length || 0, 'sessions');
      }
    } catch (err) {
      console.error('[PAST CHATS] Error loading:', err);
    }
    
    setLoadingPastChats(false);
  };
  
  // MULTI-SESSION: Load a specific past session
  const loadSession = async (session) => {
    console.log('[LOAD SESSION]', session.session_id);
    
    try {
      const response = await fetch(`${API_URL}/api/mira/session/${session.session_id}/messages?limit=50`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Update session ID
        localStorage.setItem('mira_session_id', session.session_id);
        setSessionId(session.session_id);
        
        // Load messages
        const recoveredHistory = (data.messages || []).map(msg => ({
          type: msg.role === 'user' ? 'user' : 'mira',
          content: msg.content,
          timestamp: msg.timestamp,
          intent: msg.intent,
          executionType: msg.execution_type,
          products: msg.products || []
        }));
        setConversationHistory(recoveredHistory);
        
        // If this session was for a different pet, switch to that pet
        if (session.pet_id && session.pet_id !== pet.id) {
          const sessionPet = allPets.find(p => p.id === session.pet_id);
          if (sessionPet) {
            setPet(sessionPet);
          }
        }
        
        // Reset state
        setCompletedSteps([]);
        setCurrentStep(null);
        setStepHistory([]);
        setShowPastChats(false);
        
        console.log('[LOAD SESSION] Loaded', recoveredHistory.length, 'messages');
      }
    } catch (err) {
      console.error('[LOAD SESSION] Error:', err);
    }
  };
  
  // Format date for past chats display
  const formatSessionDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };
  
  // Fetch user's pet if logged in
  useEffect(() => {
    const fetchPet = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/api/pets/my-pets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          if (data.pets && data.pets.length > 0) {
            const p = data.pets[0];
            // Helper to ensure array format
            const ensureArray = (val, defaultVal = []) => {
              if (!val) return defaultVal;
              if (Array.isArray(val)) return val;
              if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
              return defaultVal;
            };
            setPet({
              id: p.id,
              name: p.name,
              breed: p.breed,
              age: p.age || 'Unknown',
              traits: ensureArray(p.doggy_soul_answers?.describe_3_words, ['Loving']),
              sensitivities: ensureArray(p.doggy_soul_answers?.health_conditions),
              favorites: ensureArray(p.doggy_soul_answers?.favorite_treats)
            });
          }
        }
      } catch (err) {
        console.debug('Using demo pet');
      }
    };
    fetchPet();
  }, [token]);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
    setHasNewMessages(false);
  }, []);
  
  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(atBottom);
    if (atBottom) setHasNewMessages(false);
  }, []);
  
  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    } else if (conversationHistory.length > 0) {
      setHasNewMessages(true);
    }
  }, [conversationHistory, isAtBottom, scrollToBottom]);
  
  // Silent ticket creation - Every conversation = a service ticket
  // Follows: User Intent → Service Desk Ticket → Admin Notification → Pillar Request
  const createOrAttachTicket = useCallback(async (message, intent, pillar, miraResponse = null) => {
    // Determine pillar from intent if not provided
    const determinedPillar = pillar || (() => {
      if (intent?.startsWith('GROOM')) return 'Grooming';
      if (intent?.startsWith('FOOD')) return 'Food';
      if (intent?.includes('TRAVEL')) return 'Travel';
      if (intent?.includes('BOARD')) return 'Boarding';
      if (intent?.includes('HEALTH') || intent === 'CONCERN') return 'Health';
      if (intent?.includes('CELEBRATE')) return 'Celebrate';
      return 'General';
    })();
    
    // Check for existing open ticket for same (parent, pet, pillar) within 48-72 hours
    const ticketWindow = 72 * 60 * 60 * 1000; // 72 hours in ms
    const now = new Date();
    
    if (currentTicket && 
        currentTicket.pillar === determinedPillar && 
        currentTicket.status !== 'closed' &&
        (now - new Date(currentTicket.created_at)) < ticketWindow) {
      // Attach to existing ticket - append conversation
      console.log('[TICKET] Attaching to existing ticket:', currentTicket.id);
      const updatedTicket = {
        ...currentTicket,
        updated_at: now.toISOString(),
        conversation: [
          ...(currentTicket.conversation || []),
          { sender: 'parent', text: message, timestamp: now.toISOString() }
        ]
      };
      if (miraResponse) {
        updatedTicket.conversation.push({
          sender: 'mira',
          text: miraResponse,
          timestamp: now.toISOString()
        });
      }
      setCurrentTicket(updatedTicket);
      return updatedTicket;
    }
    
    // Create new ticket
    const newTicket = {
      id: `TCK-${now.getFullYear()}-${String(Date.now()).slice(-6)}`,
      parent_id: user?.id || 'demo-parent',
      pet_id: pet.id,
      pet_name: pet.name,
      pillar: determinedPillar,
      intent_primary: intent || 'GENERAL',
      channel: 'Mira_OS',
      status: 'open_mira_only',
      life_state: intent === 'CONCERN' ? 'CONCERN' : intent === 'HOLD' ? 'HOLD' : 'PLAN',
      tags: ['mira', determinedPillar.toLowerCase()],
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      conversation: [
        { sender: 'parent', text: message, timestamp: now.toISOString() }
      ]
    };
    
    if (miraResponse) {
      newTicket.conversation.push({
        sender: 'mira',
        text: miraResponse,
        timestamp: now.toISOString()
      });
    }
    
    setCurrentTicket(newTicket);
    console.log('[TICKET] Created new service ticket:', newTicket.id, 'Pillar:', determinedPillar);
    
    // In production: POST to /api/tickets/create
    // For now, we log it
    return newTicket;
  }, [currentTicket, pet, user]);
  
  // Engage Concierge® - Flip ticket status, NOT create new ticket
  const engageConcierge = useCallback(async (reason, contextData = {}) => {
    if (!currentTicket) return;
    
    const now = new Date();
    
    // Build human-readable summary based on reason
    let latestMiraSummary = 'Parent requested Concierge® assistance.';
    let userFacingMessage = 'Your pet Concierge® is joining this chat...';
    
    if (reason === 'hotel_booking' && contextData.hotel_name) {
      latestMiraSummary = `Parent wants to book ${contextData.hotel_name} in ${contextData.city} for ${contextData.pet_name}.`;
      userFacingMessage = `✨ Mira has got it! I'm working on booking "${contextData.hotel_name}" in ${contextData.city} for ${contextData.pet_name}. Our live Concierge® team is on it - you'll hear back shortly with confirmation details!`;
    } else if (reason === 'product_request' && contextData.product_name) {
      latestMiraSummary = `Parent interested in ${contextData.product_name} for ${contextData.pet_name}.`;
      userFacingMessage = `✨ Got it! I'll have our Concierge® help you with "${contextData.product_name}" for ${contextData.pet_name}. They'll reach out with more details shortly!`;
    } else if (typeof contextData === 'string') {
      latestMiraSummary = contextData;
    }
    
    // Call the handoff API
    try {
      await fetch(`${API_URL}/api/mira/tickets/handoff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: currentTicket.id,
          handoff_reason: reason,
          latest_mira_summary: latestMiraSummary,
          context_data: contextData
        })
      });
      console.log('[HANDOFF] Ticket handed to Concierge®:', currentTicket.id);
    } catch (error) {
      console.error('[HANDOFF] API error:', error);
    }
    
    // Update local state
    const updatedTicket = {
      ...currentTicket,
      status: 'open_concierge_engaged',
      handoff_to_concierge: true,
      concierge_queue: currentTicket.pillar?.toUpperCase() || 'GENERAL',
      handoff_time: now.toISOString(),
      handoff_reason: reason,
      updated_at: now.toISOString()
    };
    
    setCurrentTicket(updatedTicket);
    
    // Add visual message to conversation with context-aware text
    const systemMessage = {
      type: 'system',
      content: userFacingMessage,
      isBookingConfirmation: reason === 'hotel_booking',
      timestamp: now
    };
    setConversationHistory(prev => [...prev, systemMessage]);
  }, [currentTicket, token]);
  
  // Extract quick reply options from Mira's response
  // Parses the actual question to generate contextual chips
  const extractQuickReplies = useCallback((miraData) => {
    if (!miraData) return [];
    
    // First, check if backend provided quick_replies
    const backendReplies = miraData.response?.quick_replies;
    if (backendReplies && backendReplies.length > 0) {
      return backendReplies.map(r => ({
        text: r,
        value: r
      }));
    }
    
    const message = miraData.response?.message || '';
    const intent = miraData.understanding?.intent || '';
    const messageLower = message.toLowerCase();
    
    // Only show chips if there's a question being asked
    if (!message.includes('?')) return [];
    
    const quickReplies = [];
    
    // === CONCIERGE FLOW ===
    // If user asks for concierge help
    if (messageLower.includes('concierge') || messageLower.includes('would you like the')) {
      return [
        { text: 'Yes, connect me to Concierge®', value: 'Yes, connect me to my Concierge®.' },
        { text: 'Tell me more first', value: 'Tell me more first.' },
        { text: 'Maybe later', value: 'Maybe later.' }
      ];
    }
    
    // === GROOMING FLOWS ===
    // "Are you thinking of a simple trim... or a fuller grooming session?"
    if (messageLower.includes('simple trim') && messageLower.includes('grooming session')) {
      return [
        { text: 'Simple trim', value: 'Simple trim.' },
        { text: 'Full grooming session', value: 'Full grooming session.' },
        { text: "I'm not sure, tell me more", value: "I'm not sure, tell me more about each option." }
      ];
    }
    
    // "Would you like to do this at home... or prefer a professional groomer?"
    if (messageLower.includes('at home') && messageLower.includes('groomer')) {
      return [
        { text: 'I want a groomer', value: 'I want a groomer.' },
        { text: 'Help me try at home', value: 'Help me try at home.' },
        { text: 'Not sure yet', value: "I'm not sure yet." }
      ];
    }
    
    // "adding a bath as well, or just focusing on the trim?"
    if (messageLower.includes('bath') && messageLower.includes('trim')) {
      return [
        { text: 'Yes, add a bath', value: 'Yes, add a bath as well.' },
        { text: 'Just the trim', value: 'Just the trim this time.' },
        { text: 'Tell me more', value: 'Tell me more about what a bath would involve.' }
      ];
    }
    
    // Bath: "bathing at home... or taking to a groomer?"
    if (messageLower.includes('bath') && (messageLower.includes('at home') || messageLower.includes('groomer'))) {
      return [
        { text: 'Bath at home', value: 'I want to bathe him at home.' },
        { text: 'Take to groomer', value: 'Take him to a groomer.' },
        { text: "What's easier?", value: "What would you recommend as easier?" }
      ];
    }
    
    // === TOY FLOWS ===
    // "Would you like me to suggest some toy options?"
    if (messageLower.includes('toy') && (messageLower.includes('suggest') || messageLower.includes('options'))) {
      return [
        { text: 'Suggest 3-5 toys', value: 'Yes, suggest some toys that fit him.' },
        { text: 'Interactive toys', value: 'Show me interactive toys.' },
        { text: 'Chew toys', value: 'Show me chew toys.' },
        { text: 'Something else', value: 'Something else.' }
      ];
    }
    
    // === FOOD FLOWS ===
    // "Are you thinking of everyday light treats, or something more special-occasion?"
    if (messageLower.includes('everyday') && (messageLower.includes('special') || messageLower.includes('occasion'))) {
      return [
        { text: 'Everyday light treats', value: 'Everyday light treats.' },
        { text: 'Special-occasion treats', value: 'Something special-occasion.' },
        { text: "I'm not sure yet", value: "I'm not sure yet." }
      ];
    }
    
    // Food type: "dry food, wet food, or open to either?"
    if (messageLower.includes('dry food') || messageLower.includes('wet food') || messageLower.includes('kibble')) {
      return [
        { text: 'Dry food (kibble)', value: 'I prefer dry food.' },
        { text: 'Wet food', value: 'I prefer wet food.' },
        { text: 'Open to either', value: 'I\'m open to either.' }
      ];
    }
    
    // "Suggest treats" - but NOT if asking about toys
    if (messageLower.includes('suggest') && messageLower.includes('treat') && !messageLower.includes('toy')) {
      return [
        { text: 'Suggest 3-5 treats', value: 'Suggest 3-5 treats that fit.' },
        { text: 'Help with a treat routine', value: 'Help me with a treat routine.' },
        { text: 'Something else', value: 'Something else.' }
      ];
    }
    
    // === TRAVEL FLOWS ===
    // "Are you planning to travel by car, flight, or train?" or "Are you driving or flying?"
    if ((messageLower.includes('car') && (messageLower.includes('flight') || messageLower.includes('train'))) ||
        (messageLower.includes('driving') && messageLower.includes('flying')) ||
        (messageLower.includes('drive') && messageLower.includes('fly'))) {
      return [
        { text: 'Car', value: 'Car.' },
        { text: 'Flight', value: 'Flight.' },
        { text: 'Train', value: 'Train.' },
        { text: 'Not sure yet', value: 'Not sure yet.' }
      ];
    }
    
    // "Pet-friendly stays... packing list... both?"
    if (messageLower.includes('pet-friendly') || messageLower.includes('packing list')) {
      return [
        { text: 'Pet-friendly stays', value: 'Pet-friendly stays.' },
        { text: 'Packing list & routine', value: 'Packing list and routine.' },
        { text: 'Both', value: 'Both.' }
      ];
    }
    
    // === HEALTH FLOWS ===
    // "Would you like me to help find a vet?"
    if (messageLower.includes('vet') && messageLower.includes('find')) {
      return [
        { text: 'Yes, find a vet', value: 'Yes, please help me find a vet.' },
        { text: 'I have a vet already', value: 'I already have a vet.' },
        { text: 'Tell me more first', value: 'Tell me more about what to watch for first.' }
      ];
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BIRTHDAY / CELEBRATE FLOWS - CHIPS MUST MATCH THE QUESTION
    // ═══════════════════════════════════════════════════════════════
    
    // FIRST BIRTHDAY QUESTION: "active and playful... or simpler, cosy?"
    // This MUST have chips that answer the question, NOT generic Yes/No
    if ((messageLower.includes('active') && messageLower.includes('playful')) || 
        (messageLower.includes('simpler') && (messageLower.includes('cosy') || messageLower.includes('cozy'))) ||
        (messageLower.includes('celebration') && messageLower.includes('year'))) {
      return [
        { text: 'Active and playful', value: 'Active and playful.' },
        { text: 'Simpler and cosy', value: 'Simpler and cosy.' },
        { text: "I'm not sure yet", value: "I'm not sure yet." },
        { text: "I'd like a cake as well", value: "I'd like a birthday cake for him as well." }
      ];
    }
    
    // SECOND BIRTHDAY QUESTION: "food vs play vs ritual?"
    // "What would you like us to focus on - the food, the play, or marking the moment?"
    if ((messageLower.includes('focus') && (messageLower.includes('food') || messageLower.includes('play'))) ||
        (messageLower.includes('food') && messageLower.includes('play') && 
        (messageLower.includes('ritual') || messageLower.includes('marking')))) {
      return [
        { text: 'Food / cake / treats', value: 'Food / cake / treats.' },
        { text: 'Play / games', value: 'Play / games.' },
        { text: 'Marking the moment', value: 'Mostly marking the moment.' },
        { text: 'All of it', value: 'All of it.' }
      ];
    }
    
    // THIRD BIRTHDAY QUESTION: "everyday treats vs special cake?"
    if ((messageLower.includes('everyday') && messageLower.includes('special')) ||
        (messageLower.includes('cake') && messageLower.includes('treat')) ||
        (messageLower.includes('proper cake') || messageLower.includes('dog cake'))) {
      return [
        { text: 'Everyday light treats', value: 'Everyday light treats.' },
        { text: 'Special-occasion cake', value: 'Special-occasion cake.' },
        { text: 'Both', value: 'Both.' },
        { text: 'Show me cake ideas', value: 'Show me some cake ideas.' }
      ];
    }
    
    // CAKE FOCUS: "focus on sourcing a cake, or other birthday elements?"
    if ((messageLower.includes('focus on') && messageLower.includes('cake')) ||
        (messageLower.includes('sourcing') && messageLower.includes('cake')) ||
        (messageLower.includes('cake') && messageLower.includes('birthday') && messageLower.includes('elements')) ||
        (messageLower.includes('cake') && messageLower.includes('decorations'))) {
      return [
        { text: 'Just the cake', value: 'Just the cake for now.' },
        { text: 'Cake + activities', value: 'I want help with cake and activities.' },
        { text: 'Show me cake ideas', value: 'Show me some birthday cake ideas for Buddy.' }
      ];
    }
    
    // "small celebration at home, or party with others?"
    if ((messageLower.includes('at home') && messageLower.includes('party')) ||
        (messageLower.includes('small') && messageLower.includes('celebration'))) {
      return [
        { text: 'Small at home', value: 'Small celebration at home.' },
        { text: 'Party with others', value: 'Party with others.' },
        { text: 'Not sure yet', value: "I'm not sure yet." }
      ];
    }
    
    // ═══════════════════════════════════════════════════════════════
    // GENERIC PATTERNS - FALLBACK ONLY
    // These should only match if NO specific pattern above matched
    // ═══════════════════════════════════════════════════════════════
    
    // "Would you like to...?" or "Would you prefer...?" - GENERIC FALLBACK
    if (messageLower.includes('would you like') || messageLower.includes('would you prefer')) {
      // Check if this is actually asking about specific options
      // If so, don't use generic chips
      if (messageLower.includes(' or ')) {
        // There's an "or" in the question - try to extract the options
        // Return null to let the UI show no chips rather than wrong chips
        return [];
      }
      return [
        { text: 'Yes, please', value: 'Yes, please.' },
        { text: 'Tell me more', value: 'Can you tell me more first?' },
        { text: 'Maybe later', value: 'Maybe later.' }
      ];
    }
    
    // "Are you thinking of...?" pattern
    if (messageLower.includes('are you thinking')) {
      return [
        { text: 'Yes', value: 'Yes, that\'s what I\'m thinking.' },
        { text: 'Not quite', value: 'Not quite, let me explain.' },
        { text: 'Tell me more', value: 'Tell me more about my options.' }
      ];
    }
    
    // Default: If there's a question but no specific pattern matched
    if (message.includes('?')) {
      return [
        { text: 'Yes', value: 'Yes.' },
        { text: 'No', value: 'No.' },
        { text: 'Tell me more', value: 'Can you tell me more?' }
      ];
    }
    
    return quickReplies;
  }, []);
  
  // Helper: Split message to highlight the question part
  // Returns { mainText, questionText } for separate rendering
  const splitMessageWithQuestion = useCallback((content) => {
    if (!content || !content.includes('?')) {
      return { mainText: content, questionText: null };
    }
    
    // Find the last question in the message
    const sentences = content.split(/(?<=[.!?])\s+/);
    const questionSentences = [];
    const mainSentences = [];
    
    // Go through sentences from the end to find questions
    let foundQuestion = false;
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();
      if (sentence.includes('?') && !foundQuestion) {
        questionSentences.unshift(sentence);
        // Continue to catch the setup sentence (e.g., "To get this right for him, I'd like to understand...")
        if (sentence.toLowerCase().includes('are you') || 
            sentence.toLowerCase().includes('would you') ||
            sentence.toLowerCase().includes('do you prefer')) {
          foundQuestion = true;
        }
      } else if (questionSentences.length > 0 && !foundQuestion) {
        // Include preceding context sentence if it leads into the question
        if (sentence.toLowerCase().includes('understand') || 
            sentence.toLowerCase().includes('know') ||
            sentence.toLowerCase().includes('help')) {
          questionSentences.unshift(sentence);
        } else {
          mainSentences.unshift(sentence);
        }
        foundQuestion = true;
      } else {
        mainSentences.unshift(sentence);
      }
    }
    
    return {
      mainText: mainSentences.join(' ').trim(),
      questionText: questionSentences.join(' ').trim()
    };
  }, []);
  
  // Transcript sync - send messages to service desk in real-time
  // Uses new /api/service_desk/append_message API
  const syncToServiceDesk = useCallback(async (ticketId, message, meta = null) => {
    if (!ticketId) return;
    
    try {
      await fetch(`${API_URL}/api/service_desk/append_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          sender: message.type === 'user' ? 'parent' : message.type,
          source: 'Mira_OS',
          text: message.content,
          meta: meta
        })
      });
      console.log('[SYNC] Message synced to ticket:', ticketId);
    } catch (error) {
      console.error('[SYNC] Failed to sync message:', error);
    }
  }, [token]);
  
  // Complete a step when user answers a clarifying question
  // This is the KEY anti-loop mechanism
  const completeStep = useCallback(async (ticketId, stepId, userAnswer) => {
    if (!ticketId || !stepId) return;
    
    try {
      const response = await fetch(`${API_URL}/api/service_desk/complete_step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          step_id: stepId,
          user_answer: userAnswer
        })
      });
      
      const data = await response.json();
      
      if (data.success && !data.already_completed) {
        // Update local state
        setCompletedSteps(prev => [...prev, stepId]);
        setCurrentStep(null);
        setStepHistory(prev => [...prev, { step_id: stepId, answer: userAnswer }]);
        console.log('[STEP] Completed step:', stepId, '-> Answer:', userAnswer);
      } else if (data.already_completed) {
        console.log('[STEP] Step already completed:', stepId);
      }
      
      return data;
    } catch (error) {
      console.error('[STEP] Failed to complete step:', error);
    }
  }, [token]);
  
  // Check if a step has already been completed (to prevent re-asking)
  const isStepCompleted = useCallback((stepId) => {
    return completedSteps.includes(stepId);
  }, [completedSteps]);
  
  // Check if user's response is asking for more info (NOT answering the question)
  // These should NOT complete the current step - Mira should explain and repeat the question
  const isAskingForMoreInfo = useCallback((inputQuery) => {
    const lowerInput = inputQuery.toLowerCase();
    
    const moreInfoPhrases = [
      'tell me more', 'can you explain', 'what do you mean',
      'more info', 'more information', 'explain more',
      'not sure yet', 'i\'m not sure', 'help me understand',
      'what\'s the difference', 'what are the options'
    ];
    
    return moreInfoPhrases.some(phrase => lowerInput.includes(phrase));
  }, []);
  
  // VOICE CONTROL - Stop speaking immediately and cancel pending voice
  const stopSpeaking = useCallback(() => {
    // Clear any pending voice timeout to prevent double voice
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);
  
  // VOICE OUTPUT - ElevenLabs TTS for Mira's voice (must be before handleSubmit)
  const speakWithMira = useCallback(async (text) => {
    if (!voiceEnabled || !text) return;
    
    // CRITICAL: Stop any existing voice before starting new one (prevents double voice)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    
    try {
      setIsSpeaking(true);
      
      // E024: Auto-detect voice personality from response content
      const personality = detectVoicePersonality(text);
      console.log('[Mira Voice] Auto-detected personality:', personality);
      
      // Clean text for natural speech
      let cleanText = text
        .replace(/[🎉🐕✨🦴💜🎂🏥☀️🌤️🌙🌟🐾🎒📅📋😊💝🎁🎤💡]/g, '')
        .replace(/\*\*/g, '')
        .replace(/[*#_~`]/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\n/g, ' ')
        .replace(/®/g, '')
        .trim();
      
      // Smart truncation - cut at sentence boundary (up to 800 chars)
      if (cleanText.length > 800) {
        // Find the last sentence ending before 800 chars
        const truncated = cleanText.substring(0, 800);
        const lastSentenceEnd = Math.max(
          truncated.lastIndexOf('. '),
          truncated.lastIndexOf('? '),
          truncated.lastIndexOf('! ')
        );
        if (lastSentenceEnd > 400) {
          cleanText = truncated.substring(0, lastSentenceEnd + 1);
        } else {
          cleanText = truncated;
        }
      }
      
      // E024: Pass auto-detected voice personality to TTS endpoint
      const response = await fetch(`${API_URL}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: cleanText,
          personality: personality 
        })
      });
      
      if (!response.ok) {
        throw new Error('TTS request failed');
      }
      
      const data = await response.json();
      
      // Create and play audio
      const audio = new Audio();
      audio.preload = 'auto';
      audio.volume = 1.0;
      
      audio.onended = () => {
        console.log('[Mira Voice] Finished speaking');
        setIsSpeaking(false);
      };
      
      audio.onerror = () => {
        setIsSpeaking(false);
      };
      
      audio.oncanplaythrough = () => {
        audio.play().catch((e) => {
          console.log('[Mira Voice] Playback blocked:', e.message);
          setIsSpeaking(false);
        });
      };
      
      audio.src = `data:audio/mpeg;base64,${data.audio_base64}`;
      audio.load();
      audioRef.current = audio;
      
    } catch (error) {
      console.log('[Mira Voice] Error:', error.message);
      setIsSpeaking(false);
    }
  }, [voiceEnabled, detectVoicePersonality]);
  
  // Handle submit - MIRA DOCTRINE: Let Mira's intelligence decide what to show
  const handleSubmit = useCallback(async (e, voiceQuery = null) => {
    if (e) e.preventDefault();
    
    let inputQuery = voiceQuery || query;
    if (!inputQuery.trim()) return;
    
    // ═══════════════════════════════════════════════════════════════════
    // VOICE SYNC FIX: Stop any playing voice when user sends new message
    // ═══════════════════════════════════════════════════════════════════
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    stopSpeaking();
    
    // HAPTIC: Send message feedback
    hapticFeedback.sendMessage();
    
    // INTELLIGENT SPELLING CORRECTION
    const { corrected, corrections, hasCorrections } = correctSpelling(inputQuery);
    if (hasCorrections) {
      console.log('[MIRA] Spelling corrected:', corrections);
      inputQuery = corrected;
    }
    
    // CONVERSATION INTELLIGENCE - Detect follow-ups and enrich query
    const intelligence = conversationIntelligence.enrichQueryWithContext(inputQuery, conversationContext);
    console.log('[MIRA Intelligence]', {
      isFollowUp: intelligence.followUp.isFollowUp,
      followUpType: intelligence.followUp.type,
      topic: intelligence.topic,
      contextUsed: intelligence.contextUsed
    });
    
    // If it's a selection follow-up, resolve the reference
    if (intelligence.followUp.isFollowUp && intelligence.followUp.type === 'select_item') {
      const resolved = conversationIntelligence.resolveReference(inputQuery, conversationContext.lastResults);
      if (resolved?.resolved) {
        console.log('[MIRA] Resolved reference:', resolved.item?.name || resolved.item);
        // Add resolved item info to query for backend
        inputQuery = `${inputQuery} [RESOLVED: ${JSON.stringify(resolved.item)}]`;
      }
    }
    
    // Use enriched query if context was used
    if (intelligence.contextUsed.length > 0) {
      console.log('[MIRA] Using enriched query:', intelligence.enrichedQuery);
      inputQuery = intelligence.enrichedQuery;
    }
    
    // CRITICAL: Stop any existing voice when user sends new message
    stopSpeaking();
    
    // MIRA ENGINE MODE DETECTION - Set mode before processing
    const lowerQuery = inputQuery.toLowerCase();
    if (/passed away|rainbow bridge|grief|lost.*dog|lost.*pet|loss|miss.*so much|crying|heartbreak|💔|🌈|farewell|goodbye/.test(lowerQuery)) {
      setMiraMode('comfort');
    } else if (/emergency|urgent|bleeding|vomiting blood|collapse|seizure|not breathing|🚨|accident|hurt|injured/.test(lowerQuery)) {
      setMiraMode('emergency');
    } else if (/show me|find|browse|what.*have|list of|toys|treats|products|catalog/.test(lowerQuery)) {
      setMiraMode('instant');
    } else {
      setMiraMode('thinking'); // Default for PLAN, BOOK, ADVISE
    }
    
    setIsProcessing(true);
    setQuery('');
    
    // Show skeleton loader after 800ms if still processing
    const skeletonTimer = setTimeout(() => {
      setShowSkeleton(true);
    }, 800);
    
    const userMessage = {
      type: 'user',
      content: corrected || inputQuery, // Show corrected query to user
      timestamp: new Date()
    };
    setConversationHistory(prev => [...prev, userMessage]);
    
    try {
      // E033: Check for relevant past conversation memory
      let memoryContext = null;
      if (pet?.id) {
        try {
          const memoryResponse = await fetch(`${API_URL}/api/mira/conversation-memory/recall`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pet_id: pet.id, query: inputQuery })
          });
          const memoryData = await memoryResponse.json();
          if (memoryData.success && memoryData.relevant_memory) {
            memoryContext = memoryData;
            console.log('[MEMORY] Found relevant past conversation:', memoryData.relevant_memory.topic);
          }
        } catch (e) {
          console.log('[MEMORY] Recall check failed:', e.message);
        }
      }
      
      // E025: Check for pet mood concerns in user message
      let moodContext = null;
      if (pet?.id) {
        try {
          const moodResponse = await fetch(`${API_URL}/api/mira/detect-mood`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: inputQuery, pet_name: pet.name })
          });
          const moodData = await moodResponse.json();
          if (moodData.success && moodData.mood_detected) {
            moodContext = moodData;
            console.log('[MOOD] Detected pet mood concern:', moodData.concern_level);
          }
        } catch (e) {
          console.log('[MOOD] Detection failed:', e.message);
        }
      }
      
      // STEP 1: Route intent (first call for first message)
      let pillar = currentTicket?.pillar || 'General';
      let intent = currentTicket?.intent || 'GENERAL_HELP';
      let lifeState = currentTicket?.lifeState || 'EXPLORE';
      let ticketId = currentTicket?.id;
      
      // Check if user is asking for more info (NOT answering the question)
      // In this case, DON'T complete the step - Mira should explain and repeat the question
      const askingForMoreInfo = isAskingForMoreInfo(inputQuery);
      
      // ANTI-LOOP: If there's a current step waiting for answer, complete it
      // UNLESS the user is just asking for more info
      if (currentStep && currentTicket?.id && !askingForMoreInfo) {
        await completeStep(currentTicket.id, currentStep.step_id, inputQuery);
        console.log('[STEP] Answered pending step:', currentStep.step_id, '-> Answer:', inputQuery);
      } else if (askingForMoreInfo) {
        console.log('[STEP] User asking for more info, NOT completing step:', currentStep?.step_id);
      }
      
      if (!currentTicket) {
        // First message - route intent and create ticket
        const routeResponse = await fetch(`${API_URL}/api/mira/route_intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            parent_id: user?.id || 'DEMO-PARENT',
            pet_id: pet.id,
            utterance: inputQuery,
            source_event: 'search',
            device: 'web',
            pet_context: {
              name: pet.name,
              breed: pet.breed,
              age_years: parseInt(pet.age) || 3,
              // Ensure arrays - convert strings to arrays if needed
              allergies: Array.isArray(pet.sensitivities) ? pet.sensitivities : (pet.sensitivities ? [pet.sensitivities] : []),
              notes: Array.isArray(pet.traits) ? pet.traits : (pet.traits ? [pet.traits] : []),
              // E042: Include user's detected city for local places
              city: pet?.city || pet?.location?.city || userCity || 'Mumbai'
            }
          })
        });
        
        const intentData = await routeResponse.json();
        pillar = intentData.pillar;
        intent = intentData.intent_primary;
        lifeState = intentData.life_state;
        
        // STEP 2: Create/attach ticket
        const ticketResponse = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            parent_id: user?.id || 'DEMO-PARENT',
            pet_id: pet.id,
            pillar: pillar,
            intent_primary: intent,
            intent_secondary: intentData.intent_secondary || [],
            life_state: lifeState,
            channel: 'Mira_OS',
            initial_message: {
              sender: 'parent',
              source: 'Mira_OS',
              text: inputQuery
            }
          })
        });
        
        const ticketData = await ticketResponse.json();
        ticketId = ticketData.ticket_id;
        
        setCurrentTicket({
          id: ticketId,
          status: ticketData.status,
          pillar: pillar,
          intent: intent,
          lifeState: lifeState
        });
        
        console.log('[TICKET] Created/attached:', ticketId, 'Pillar:', pillar);
      } else {
        // Not the first message - just sync the user message
        await syncToServiceDesk(currentTicket.id, userMessage);
      }
      
      // MIRA DOCTRINE: Let Mira show products when her intelligence decides it's relevant
      // No restrictive gates - Mira understands, judges, reasons, then shows options
      // Products are shown based on AI decision, not explicit user phrases
      
      // STEP 3: Get Mira's response
      // IMPORTANT: Pass completed_steps and step_history so LLM knows what's already been asked
      const response = await fetch(`${API_URL}/api/mira/os/understand-with-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          input: inputQuery,
          pet_id: pet.id,
          pet_context: {
            name: pet.name,
            breed: pet.breed,
            age: pet.age,
            traits: pet.traits,
            sensitivities: pet.sensitivities,
            favorites: pet.favorites,
            // E042: Include user's detected city for local places
            city: pet?.city || pet?.location?.city || userCity || 'Mumbai',
            location: { city: pet?.city || pet?.location?.city || userCity || 'Mumbai' }
          },
          page_context: 'mira-os',
          // SESSION PERSISTENCE - Pass session_id for conversation tracking
          session_id: sessionId,
          // MIRA DOCTRINE: Always let AI decide when products are relevant
          include_products: true,
          pillar: pillar,
          conversation_stage: conversationStage,
          ticket_id: ticketId,
          // ANTI-LOOP: Pass completed steps so LLM knows what's already been asked
          completed_steps: completedSteps,
          step_history: stepHistory.map(s => ({ step_id: s.step_id, answer: s.answer })),
          // FULL CONVERSATION HISTORY for context (last 10 messages)
          conversation_history: conversationHistory.slice(-10).map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          // Tell LLM if user is asking for more info (should explain options, not complete step)
          user_asking_for_more_info: askingForMoreInfo,
          // Pass the current pending step so LLM knows what question to explain
          current_step: currentStep?.step_id || null
        })
      });
      
      const data = await response.json();
      
      // ═══════════════════════════════════════════════════════════════════
      // REAL-TIME SOUL SCORE UPDATE - The Pet Soul grows with every conversation!
      // ═══════════════════════════════════════════════════════════════════
      if (data.pet_soul_score !== undefined && data.pet_soul_score !== null) {
        setPet(prev => ({
          ...prev,
          soulScore: Math.round(data.pet_soul_score)
        }));
        console.log('[SOUL SCORE] Updated to:', data.pet_soul_score);
      }
      
      let miraResponseText = data.response?.message || "I'm here to help!";
      
      // E033: Prepend memory context if relevant past conversation found
      if (memoryContext?.relevant_memory) {
        const mem = memoryContext.relevant_memory;
        const daysAgo = mem.days_ago;
        let memoryPrefix = '';
        
        if (daysAgo && daysAgo > 0) {
          if (daysAgo === 1) {
            memoryPrefix = `I remember we talked about ${mem.topic} yesterday. `;
          } else if (daysAgo < 7) {
            memoryPrefix = `I recall we discussed ${mem.topic} a few days ago. `;
          } else if (daysAgo < 30) {
            memoryPrefix = `Last time we talked about ${mem.topic}, `;
          } else {
            memoryPrefix = `I remember when we discussed ${mem.topic} before. `;
          }
          
          if (mem.mira_advice) {
            memoryPrefix += `I suggested ${mem.mira_advice.substring(0, 80)}... Did that help? `;
          }
        }
        
        if (memoryPrefix) {
          miraResponseText = memoryPrefix + miraResponseText;
          console.log('[MEMORY] Added memory context to response');
        }
      }
      
      // E025: Handle mood detection - modify response if pet mood concern detected
      if (moodContext?.mood_detected) {
        const moodResponse = moodContext.response;
        miraResponseText = `${moodResponse.intro} ${moodResponse.suggestion}\n\n${miraResponseText}`;
        console.log('[MOOD] Added mood-aware intro to response');
        
        // Save this to conversation memory if significant
        if (moodContext.should_save_memory && pet?.id) {
          fetch(`${API_URL}/api/mira/conversation-memory/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pet_id: pet.id,
              topic: 'behavior',
              summary: `${pet.name} ${moodContext.matched_indicator}`,
              user_query: inputQuery,
              mira_advice: moodResponse.suggestion
            })
          }).catch(e => console.log('[MEMORY] Failed to save:', e.message));
        }
      }
      
      // Extract contextual quick replies based on Mira's question
      const quickReplies = extractQuickReplies(data);
      
      // Check if Mira's response has a new clarifying question (step_id)
      // If LLM didn't return step_id, detect it from the question content
      let miraStepId = data.response?.step_id;
      
      // Fallback: detect step_id from question patterns if not provided
      // This covers ALL canonical flows: Treats, Grooming, Birthday, Travel
      if (!miraStepId && miraResponseText.includes('?')) {
        const lowerText = miraResponseText.toLowerCase();
        
        // ═══════════════════════════════════════════════════════════════
        // TREATS / FOOD FLOW STEPS
        // ═══════════════════════════════════════════════════════════════
        if ((lowerText.includes('everyday') && lowerText.includes('special')) ||
            (lowerText.includes('light treats') && lowerText.includes('special-occasion')) ||
            (lowerText.includes('everyday light') && lowerText.includes('special'))) {
          miraStepId = 'TREATS_TYPE';
        } 
        else if ((lowerText.includes('suggest') && lowerText.includes('treats')) ||
                 (lowerText.includes('specific treats') && lowerText.includes('fit')) ||
                 lowerText.includes('would you like me to suggest')) {
          miraStepId = 'TREATS_SUGGEST_OR_ROUTINE';
        }
        else if (lowerText.includes('training') && (lowerText.includes('snack') || lowerText.includes('reward'))) {
          miraStepId = 'TREATS_PURPOSE';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // GROOMING FLOW STEPS
        // ═══════════════════════════════════════════════════════════════
        else if ((lowerText.includes('simple trim') && lowerText.includes('full grooming')) ||
                 (lowerText.includes('trim') && lowerText.includes('bath')) ||
                 (lowerText.includes('tidy') && lowerText.includes('session'))) {
          miraStepId = 'GROOMING_MODE';
        }
        else if ((lowerText.includes('at home') && lowerText.includes('groomer')) ||
                 (lowerText.includes('home') && lowerText.includes('salon')) ||
                 lowerText.includes('try at home') || lowerText.includes('professional groomer')) {
          miraStepId = 'GROOMING_LOCATION';
        }
        else if ((lowerText.includes('area') && lowerText.includes('weekday')) ||
                 (lowerText.includes('location') && lowerText.includes('prefer')) ||
                 lowerText.includes('which area') || lowerText.includes('when would')) {
          miraStepId = 'GROOMING_SCHEDULE';
        }
        else if ((lowerText.includes('basic tools') && lowerText.includes('suggestions')) ||
                 (lowerText.includes('brush') && lowerText.includes('comb')) ||
                 lowerText.includes('minimal set') || lowerText.includes('what tools')) {
          miraStepId = 'GROOMING_TOOLS';
        }
        // Home grooming session structure
        else if ((lowerText.includes('step-by-step') && lowerText.includes('guide')) ||
                 (lowerText.includes('checklist') && lowerText.includes('grooming')) ||
                 (lowerText.includes('broken into') && lowerText.includes('brush'))) {
          miraStepId = 'GROOMING_HOME_GUIDE';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // BIRTHDAY / CELEBRATE FLOW STEPS
        // ═══════════════════════════════════════════════════════════════
        else if ((lowerText.includes('active') && lowerText.includes('playful')) || 
                 (lowerText.includes('simpler') && lowerText.includes('cosy')) ||
                 (lowerText.includes('small') && lowerText.includes('celebration')) ||
                 (lowerText.includes('party') && lowerText.includes('others'))) {
          miraStepId = 'BIRTHDAY_SHAPE';
        } 
        else if ((lowerText.includes('food') && (lowerText.includes('play') || lowerText.includes('ritual'))) ||
                 (lowerText.includes('cake') && lowerText.includes('toy')) ||
                 (lowerText.includes('important') && lowerText.includes('year'))) {
          miraStepId = 'BIRTHDAY_FOCUS';
        } 
        else if ((lowerText.includes('dog cake') && lowerText.includes('smaller treats')) ||
                 (lowerText.includes('proper cake') || lowerText.includes('birthday cake')) ||
                 (lowerText.includes('centrepiece') && lowerText.includes('treat'))) {
          miraStepId = 'BIRTHDAY_FOOD_TYPE';
        }
        else if ((lowerText.includes('dogs') && lowerText.includes('humans')) ||
                 (lowerText.includes('pet-friendly') && lowerText.includes('venue')) ||
                 lowerText.includes('how many guests')) {
          miraStepId = 'BIRTHDAY_PARTY_DETAILS';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // TRAVEL FLOW STEPS
        // ═══════════════════════════════════════════════════════════════
        else if ((lowerText.includes('car') && lowerText.includes('flight')) ||
                 (lowerText.includes('car') && lowerText.includes('train')) ||
                 (lowerText.includes('travel') && lowerText.includes('how'))) {
          miraStepId = 'TRAVEL_MODE';
        }
        else if ((lowerText.includes('where') && lowerText.includes('driving')) ||
                 (lowerText.includes('route') || lowerText.includes('destination')) ||
                 lowerText.includes('from and to')) {
          miraStepId = 'TRAVEL_ROUTE';
        }
        else if ((lowerText.includes('pet-friendly') && lowerText.includes('stay')) ||
                 (lowerText.includes('hotel') && lowerText.includes('homestay')) ||
                 lowerText.includes('where to stay')) {
          miraStepId = 'TRAVEL_STAY';
        }
        else if ((lowerText.includes('dates') && lowerText.includes('budget')) ||
                 (lowerText.includes('when') && lowerText.includes('flexible')) ||
                 lowerText.includes('dates in mind')) {
          miraStepId = 'TRAVEL_DATES';
        }
        else if ((lowerText.includes('pack') && lowerText.includes('trip')) ||
                 (lowerText.includes('checklist') && lowerText.includes('tools')) ||
                 lowerText.includes('what should i pack')) {
          miraStepId = 'TRAVEL_PACKING';
        }
        else if ((lowerText.includes('within india') && lowerText.includes('international')) ||
                 lowerText.includes('domestic') && lowerText.includes('international')) {
          miraStepId = 'TRAVEL_FLIGHT_TYPE';
        }
        else if ((lowerText.includes('boarding') && lowerText.includes('homestay')) ||
                 lowerText.includes('leave him') || lowerText.includes('pet sitter')) {
          miraStepId = 'TRAVEL_BOARDING';
        }
        
        // ═══════════════════════════════════════════════════════════════
        // GENERIC FALLBACK - If question detected but no specific pattern
        // ═══════════════════════════════════════════════════════════════
        if (!miraStepId && lowerText.includes('?')) {
          // Generate a unique step ID based on first few words of question
          const questionMatch = miraResponseText.match(/([^.!?]*\?)/);
          if (questionMatch) {
            const questionText = questionMatch[1].toLowerCase();
            const words = questionText.split(' ').slice(0, 4).join('_').replace(/[^a-z_]/g, '');
            miraStepId = `STEP_${words.toUpperCase()}`;
          }
        }
        
        if (miraStepId) {
          console.log('[STEP] Auto-detected step_id:', miraStepId);
        }
      }
      
      // Check if this step has already been completed (anti-loop)
      const isAlreadyCompleted = miraStepId && completedSteps.includes(miraStepId);
      const isNewClarifyingQuestion = miraStepId && !isAlreadyCompleted;
      
      if (isAlreadyCompleted) {
        console.log('[ANTI-LOOP] Step already completed, should not show:', miraStepId);
      }
      
      if (isNewClarifyingQuestion) {
        // Set this as the current step waiting for answer
        setCurrentStep({
          step_id: miraStepId,
          question: miraResponseText
        });
        console.log('[STEP] New clarifying question, step_id:', miraStepId);
      }
      
      // MIRA DOCTRINE: Show products when AI decides they're relevant
      // No gates - Mira's intelligence determines when products are helpful
      let shouldShowProducts = data.response?.products?.length > 0;
      
      // MIRA DOCTRINE: COMFORT MODE - Be the Great Mother, not a salesman
      // In emotional moments (anxiety, fear, grief, health concerns), suppress products
      // Show presence, tips, empathy - NOT irrelevant product recommendations
      // Pass conversation history to maintain context (e.g., "thank you" after grief)
      const inComfortMode = isComfortMode(inputQuery, conversationHistory);
      
      if (inComfortMode) {
        console.log('[COMFORT_MODE] Detected emotional moment - suppressing products, being present');
        shouldShowProducts = false; // Don't push products during emotional moments
      }
      
      // MIRA DOCTRINE: Detect service intent for self-service wizard cards
      // In comfort mode, only show relevant services (training for anxiety, vet for health)
      let detectedServices = [];
      if (inComfortMode) {
        detectedServices = getComfortModeServices(inputQuery);
      } else {
        detectedServices = detectServiceIntent(inputQuery);
      }
      const hasServiceIntent = detectedServices.length > 0;
      
      // MIRA DOCTRINE: Detect experience intent for premium curated experiences
      // Suppress experiences in comfort mode - not the time
      let detectedExperiences = [];
      if (!inComfortMode) {
        detectedExperiences = detectExperienceIntent(inputQuery);
      }
      const hasExperienceIntent = detectedExperiences.length > 0;
      
      // MIRA DOCTRINE: CONCIERGE CAN DO ANYTHING (legal, moral, no medical)
      // In comfort mode, concierge is even more important - human touch for emotional moments
      const hasNoDirectMatch = !shouldShowProducts && !hasServiceIntent && !hasExperienceIntent;
      const dynamicConciergeRequest = hasNoDirectMatch ? generateConciergeRequest(inputQuery, pet.name) : null;
      
      // Check if Concierge® is live (6:30 AM - 11:30 PM)
      const conciergeIsLive = isConciergeLive();
      
      // MIRA DOCTRINE: Concierge® is premium service, not failure
      // ALWAYS show concierge - they can do ANYTHING
      const userWantsConcierge = inputQuery.toLowerCase().includes('concierge') || 
                                  inputQuery.toLowerCase().includes('help me') ||
                                  inputQuery.toLowerCase().includes('can you handle') ||
                                  inputQuery.toLowerCase().includes('plan');
      const hasConciergeFraming = data.response?.concierge_framing && data.response.concierge_framing.length > 0;
      // ALWAYS suggest concierge - they can handle any request
      const shouldSuggestConcierge = true; // Concierge® can do ANYTHING
      
      const miraMessage = {
        type: 'mira',
        content: miraResponseText,
        data: {
          ...data,
          nearby_places: data.nearby_places,  // Explicitly pass nearby places
          weather: data.weather,  // Explicitly pass weather
          response: {
            ...data.response,
            products: shouldShowProducts ? data.response?.products : [],
            suggest_concierge: shouldSuggestConcierge,
            detected_services: detectedServices,
            detected_experiences: detectedExperiences,
            services_from_db: data.response?.services || []  // E014: Services from API
          }
        },
        quickReplies: quickReplies,
        // ═══════════════════════════════════════════════════════════════════
        // WORLD CLASS UX: Don't auto-show products/services in conversation
        // Store them in miraPicks tray - customer opens when ready
        // ═══════════════════════════════════════════════════════════════════
        showProducts: false, // Never auto-show - use tray instead
        showServices: false, // Never auto-show - use tray instead  
        showExperiences: false, // Never auto-show - use tray instead
        detectedServices: [], // Moved to tray
        detectedExperiences: [], // Moved to tray
        dynamicConciergeRequest: null, // Concierge® always in tray
        conciergeIsLive: conciergeIsLive,
        inComfortMode: inComfortMode, // NEW: Emotional support mode
        stepId: miraStepId,
        isClarifyingQuestion: isNewClarifyingQuestion,
        timestamp: new Date()
      };
      
      // ═══════════════════════════════════════════════════════════════════
      // MIRA PICKS TRAY - Store products/services for "Ready for [Pet]"
      // IMPORTANT: Always store products in tray regardless of shouldShowProducts
      // The tray is "on-demand" - user opens when ready
      // Only suppress products in COMFORT MODE (grief/emotional moments)
      // ═══════════════════════════════════════════════════════════════════
      let newProducts = !inComfortMode ? (data.response?.products || []) : [];
      let newServices = (data.response?.services?.length > 0) 
        ? data.response.services 
        : (hasServiceIntent ? detectedServices : []);
      let newExperiences = hasExperienceIntent ? detectedExperiences : [];
      
      // Detect context from intent
      let pickContext = '';
      let detectedTopic = 'general';
      if (inputQuery.toLowerCase().includes('travel') || inputQuery.toLowerCase().includes('trip')) {
        pickContext = `${pet.name}'s Journey`;
        detectedTopic = 'travel';
      } else if (inputQuery.toLowerCase().includes('party') || inputQuery.toLowerCase().includes('plan') && inputQuery.toLowerCase().includes('birthday')) {
        // PARTY PLANNING intent - full party experience
        pickContext = `Plan ${pet.name}'s Party`;
        detectedTopic = 'party_planning';
      } else if (inputQuery.toLowerCase().includes('cake') || inputQuery.toLowerCase().includes('hamper') || inputQuery.toLowerCase().includes('bundle')) {
        // CAKE/PRODUCT SHOPPING intent - want products
        pickContext = `${pet.name}'s Celebration Picks`;
        detectedTopic = 'cake_shopping';
      } else if (inputQuery.toLowerCase().includes('birthday') || inputQuery.toLowerCase().includes('celebration') || inputQuery.toLowerCase().includes('gotcha')) {
        // Generic celebration - could be either
        pickContext = `${pet.name}'s Celebration`;
        detectedTopic = 'celebration';
      } else if (inputQuery.toLowerCase().includes('groom')) {
        pickContext = `Grooming for ${pet.name}`;
        detectedTopic = 'grooming';
      } else if (inputQuery.toLowerCase().includes('food') || inputQuery.toLowerCase().includes('treat')) {
        pickContext = `${pet.name}'s Treats & Food`;
        detectedTopic = 'food';
      } else if (inputQuery.toLowerCase().includes('health') || inputQuery.toLowerCase().includes('vet') || inputQuery.toLowerCase().includes('sick')) {
        detectedTopic = 'health';
      } else if (inputQuery.toLowerCase().includes('scratch') || inputQuery.toLowerCase().includes('skin') || inputQuery.toLowerCase().includes('itch')) {
        detectedTopic = 'skin';
      } else if (newProducts.length > 0 || newServices.length > 0) {
        pickContext = `Picks for ${pet.name}`;
      }
      
      // Store detected topic for tray rendering
      const celebrationSubIntent = detectedTopic;
      
      // ═══════════════════════════════════════════════════════════════════
      // YOUTUBE TRAINING VIDEOS - Detect training/learn intents
      // ═══════════════════════════════════════════════════════════════════
      let trainingVideos = [];
      const trainingKeywords = ['train', 'training', 'teach', 'learn', 'how to', 'puppy', 'behavior', 'obedience', 'trick', 'command', 'potty', 'leash', 'bite', 'bark', 'recall'];
      const hasTrainingIntent = trainingKeywords.some(kw => inputQuery.toLowerCase().includes(kw));
      
      if (hasTrainingIntent && pet?.id) {
        try {
          // Extract topic from query for better video matching
          let videoTopic = inputQuery.toLowerCase()
            .replace(/how (do i|to|can i)/g, '')
            .replace(/my (dog|puppy|pet)/g, '')
            .replace(/[?!]/g, '')
            .trim();
          
          const videoResponse = await fetch(`${API_URL}/api/mira/youtube/by-topic?topic=${encodeURIComponent(videoTopic)}&breed=${encodeURIComponent(pet.breed || '')}&max_results=3`);
          const videoData = await videoResponse.json();
          
          if (videoData.success && videoData.videos?.length > 0) {
            trainingVideos = videoData.videos;
            console.log('[YOUTUBE] Found', trainingVideos.length, 'training videos for:', videoTopic);
          }
        } catch (e) {
          console.log('[YOUTUBE] Video fetch failed:', e.message);
        }
      }
      
      // ═══════════════════════════════════════════════════════════════════
      // AMADEUS TRAVEL - Only fetch hotels AFTER conversation flow confirms
      // Per MIRA DOCTRINE: Ask questions first, then show results
      // WORLDWIDE SUPPORT: Extract any city name from user query
      // ═══════════════════════════════════════════════════════════════════
      let travelHotels = [];
      let travelAttractions = [];
      
      // Smart city extraction - works for ANY city worldwide
      // Patterns: "trip to [city]", "visit [city]", "going to [city]", "hotels in [city]", "[city] hotels", etc.
      const extractCityFromQuery = (query) => {
        const lowerQuery = query.toLowerCase();
        
        // Common travel/location patterns
        const patterns = [
          /(?:trip|travel|visit|going|vacation|holiday|stay|hotels?|accommodations?)\s+(?:to|in|at|near)\s+([a-zA-Z\s]+?)(?:\s+with|\s+for|\s*$|\s*[,?!.])/i,
          /(?:to|in|at|near)\s+([a-zA-Z\s]+?)\s+(?:trip|travel|visit|vacation|holiday|hotels?|stay)/i,
          /([a-zA-Z\s]+?)\s+(?:trip|travel|vacation|holiday|hotels?)/i,
          /(?:book|find|show|suggest)\s+(?:me\s+)?(?:hotels?|stays?|accommodations?)\s+(?:in|at|near)\s+([a-zA-Z\s]+)/i,
          /(?:pet[- ]?friendly)\s+(?:hotels?|stays?)\s+(?:in|at|near)\s+([a-zA-Z\s]+)/i,
        ];
        
        for (const pattern of patterns) {
          const match = query.match(pattern);
          if (match && match[1]) {
            // Clean up the extracted city name
            let city = match[1].trim()
              .replace(/\s+/g, ' ')
              .replace(/^(the|a|an)\s+/i, '')
              .replace(/\s+(please|now|today|asap|quickly)$/i, '')
              .trim();
            
            // Filter out common non-city words
            const nonCityWords = ['my', 'our', 'the', 'dog', 'puppy', 'pet', 'buddy', 'cat', 'kitten', 'some', 'good', 'nice', 'best'];
            if (city.length > 2 && !nonCityWords.includes(city.toLowerCase())) {
              // Capitalize first letter of each word
              city = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
              console.log('[CITY EXTRACT] Found city:', city);
              return city;
            }
          }
        }
        
        return null;
      };
      
      const detectedCity = extractCityFromQuery(inputQuery);
      
      // Check if this is a CONFIRMED travel request (user has answered questions)
      // Look for signals that user has provided details OR backend triggered hotel fetch
      const travelConfirmationSignals = [
        'show me hotels', 'find hotels', 'book hotel', 'suggest hotels',
        'show accommodations', 'where to stay', 'hotel options', 'hotel recommendations',
        'yes', 'sounds good', 'go ahead', 'please find', 'help me book'
      ];
      const hasConversationHistory = conversationHistory.length >= 2; // At least 1 back-and-forth
      const hasTravelConfirmation = travelConfirmationSignals.some(signal => 
        inputQuery.toLowerCase().includes(signal)
      );
      
      // Backend signals when to show hotels via show_travel_results flag
      const backendSaysShowHotels = data?.show_travel_results === true || 
                                     data?.response?.message?.toLowerCase().includes('browse these hotels') ||
                                     data?.response?.message?.toLowerCase().includes('here are some pet-friendly');
      
      // Only fetch hotels if:
      // 1. User has had conversation (not first message) AND explicitly asked for hotels, OR
      // 2. Backend said it's time to show hotels
      const shouldFetchHotels = detectedCity && (
        (hasConversationHistory && hasTravelConfirmation) || 
        backendSaysShowHotels
      );
      
      if (shouldFetchHotels) {
        console.log('[TRAVEL FLOW] Confirmed - fetching hotels for:', detectedCity);
        try {
          const hotelResponse = await fetch(`${API_URL}/api/mira/amadeus/hotels?city=${encodeURIComponent(detectedCity)}&max_results=3`);
          const hotelData = await hotelResponse.json();
          
          if (hotelData.success && hotelData.hotels?.length > 0) {
            travelHotels = hotelData.hotels;
            console.log('[AMADEUS] Found', travelHotels.length, 'hotels in:', detectedCity);
          }
        } catch (e) {
          console.log('[AMADEUS] Hotel fetch failed:', e.message);
        }
        
        // Also fetch attractions when showing hotels
        try {
          const attractionResponse = await fetch(`${API_URL}/api/mira/viator/pet-friendly?city=${encodeURIComponent(detectedCity)}&limit=3`);
          const attractionData = await attractionResponse.json();
          
          if (attractionData.success && attractionData.attractions?.length > 0) {
            travelAttractions = attractionData.attractions;
            console.log('[VIATOR] Found', travelAttractions.length, 'attractions in:', detectedCity);
          }
        } catch (e) {
          console.log('[VIATOR] Attraction fetch failed:', e.message);
        }
      } else if (detectedCity) {
        console.log('[TRAVEL FLOW] City detected but waiting for confirmation. City:', detectedCity, '| History length:', conversationHistory.length);
      }
      
      // Add YouTube, Amadeus, and Viator data to message
      miraMessage.data.training_videos = trainingVideos;
      miraMessage.data.travel_hotels = travelHotels;
      miraMessage.data.travel_attractions = travelAttractions;
      miraMessage.data.travel_city = detectedCity;
      
      // E032: SEMANTIC SEARCH - Enhance tray with intent-based recommendations
      // If main API returned few results, use semantic search to find more relevant items
      if (!inComfortMode && pet?.id && (newProducts.length < 3 || newServices.length < 1)) {
        try {
          const semanticResponse = await fetch(`${API_URL}/api/mira/semantic-search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: inputQuery,
              pet_id: pet.id,
              pet_name: pet.name,
              limit: 6
            })
          });
          const semanticData = await semanticResponse.json();
          
          if (semanticData.success && semanticData.intent_detected) {
            console.log('[SEMANTIC] Intent detected:', semanticData.primary_intent, '| Results:', semanticData.total_results);
            
            // Merge semantic results with existing results (avoid duplicates)
            const existingProductIds = new Set(newProducts.map(p => p.id));
            const semanticProducts = (semanticData.products || []).filter(p => !existingProductIds.has(p.id));
            newProducts = [...newProducts, ...semanticProducts].slice(0, 8);
            
            // Add semantic services
            const existingServiceIds = new Set(newServices.map(s => s.id));
            const semanticServices = (semanticData.services || []).filter(s => !existingServiceIds.has(s.id));
            newServices = [...newServices, ...semanticServices].slice(0, 4);
            
            // Add experiences
            const semanticExperiences = semanticData.experiences || [];
            newExperiences = [...newExperiences, ...semanticExperiences].slice(0, 3);
            
            // Use semantic context for tray label if we have meaningful results
            if (semanticData.tray_context && semanticData.total_results > 0 && !pickContext) {
              pickContext = semanticData.tray_context;
            }
          }
        } catch (e) {
          console.log('[SEMANTIC] Search failed:', e.message);
        }
      }
      
      // E033: Save meaningful conversations to memory (for topics worth remembering)
      const meaningfulTopics = ['health', 'skin', 'grooming', 'food', 'travel', 'birthday', 'behavior'];
      if (pet?.id && meaningfulTopics.includes(detectedTopic) && miraResponseText.length > 50) {
        fetch(`${API_URL}/api/mira/conversation-memory/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pet_id: pet.id,
            topic: detectedTopic,
            summary: inputQuery.substring(0, 100),
            user_query: inputQuery,
            mira_advice: miraResponseText.substring(0, 200)
          })
        }).catch(e => console.log('[MEMORY] Auto-save failed:', e.message));
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // MODE SYSTEM - Respect backend flags for what to show
      // ═══════════════════════════════════════════════════════════════════════════
      const miraMode = data.mode || 'GENERAL';
      const clarifyOnly = data.clarify_only || false;
      const shouldShowProductsFromBackend = data.show_products !== false;
      const shouldShowServicesFromBackend = data.show_services !== false;
      const shouldShowConcierge = data.show_concierge !== false;
      
      console.log(`[MODE SYSTEM] Mode: ${miraMode} | Clarify only: ${clarifyOnly} | Show products: ${shouldShowProductsFromBackend}`);
      
      // Update miraPicks only if backend says we can show products/services
      // OR if it's a celebration sub-intent that needs special handling
      if ((shouldShowProductsFromBackend && (newProducts.length > 0 || newServices.length > 0 || newExperiences.length > 0)) || 
          (!clarifyOnly && ['party_planning', 'cake_shopping', 'celebration'].includes(celebrationSubIntent))) {
        setMiraPicks({
          products: clarifyOnly ? [] : newProducts,
          services: clarifyOnly ? [] : [...newServices, ...newExperiences],
          context: pickContext,
          subIntent: celebrationSubIntent,
          mode: miraMode,
          clarifyOnly: clarifyOnly,
          showConcierge: shouldShowConcierge,
          hasNew: !clarifyOnly && (newProducts.length > 0 || newServices.length > 0)
        });
        
        // ═══════════════════════════════════════════════════════════════════════════
        // VAULT SYSTEM - Auto-trigger vault for products/services
        // "Mira is the Brain, Concierge® is the Hands"
        // ═══════════════════════════════════════════════════════════════════════════
        if (!clarifyOnly && (newProducts.length > 0 || newServices.length > 0)) {
          setActiveVaultData(data.response || data);
          setVaultUserMessage(inputQuery);
          // Small delay to let the message render first
          setTimeout(() => {
            setShowVault(true);
          }, 800);
        }
      } else if (clarifyOnly) {
        // Clarify-only mode - clear any existing picks
        setMiraPicks(prev => ({
          ...prev,
          products: [],
          services: [],
          mode: miraMode,
          clarifyOnly: true,
          showConcierge: false,
          hasNew: false
        }));
      }
      
      // ═══════════════════════════════════════════════════════════════════════════
      // TOPIC SHIFT HANDLING - Reset context when topic changes
      // ═══════════════════════════════════════════════════════════════════════════
      const topicShiftDetected = data.topic_shift || false;
      const currentPillar = data.current_pillar || 'general';
      const previousPillar = data.previous_pillar || null;
      
      if (topicShiftDetected) {
        console.log(`[TOPIC SHIFT] ${previousPillar} → ${currentPillar}`);
        // Add a topic shift indicator message
        const shiftIndicator = {
          type: 'topic_shift',
          fromPillar: previousPillar,
          toPillar: currentPillar
        };
        setConversationHistory(prev => [...prev, shiftIndicator, miraMessage]);
      } else {
        setConversationHistory(prev => [...prev, miraMessage]);
      }
      
      // UPDATE CONVERSATION CONTEXT - For follow-up intelligence
      const resultsToStore = data.nearby_places?.places || data.products || data.services || [];
      const resultsType = data.nearby_places?.type || (data.products?.length ? 'products' : 'services');
      const detectedLocation = data.nearby_places?.city || intelligence.entities.locations[0] || conversationContext.lastLocation;
      
      setConversationContext(prev => conversationIntelligence.updateContext(prev, {
        topic: intelligence.topic,
        results: resultsToStore,
        resultsType: resultsType,
        location: detectedLocation,
        preferences: intelligence.entities.preferences,
      }));
      
      console.log('[MIRA Context Updated]', {
        topic: intelligence.topic,
        resultsCount: resultsToStore.length,
        location: detectedLocation
      });
      
      // HAPTIC: Mira response complete
      hapticFeedback.miraResponse();
      
      // Clear skeleton loader
      clearTimeout(skeletonTimer);
      setShowSkeleton(false);
      
      // 🎉 MICRO-DELIGHT: Confetti for celebrations (birthday, party, anniversary)
      const celebrationKeywords = ['birthday', 'party', 'celebrate', 'celebration', 'anniversary', 'gotcha day', 'pawty'];
      const isCelebrationQuery = celebrationKeywords.some(kw => inputQuery.toLowerCase().includes(kw));
      if (isCelebrationQuery && !inComfortMode) {
        // Slight delay for visual impact
        setTimeout(() => {
          triggerCelebrationConfetti();
        }, 800);
      }
      
      // VOICE OUTPUT - Speak Mira's response
      // VOICE-TEXT SYNC: Wait for text to appear, then speak
      if (voiceEnabled && miraResponseText) {
        console.log('[MIRA VOICE] Triggering voice for response, text length:', miraResponseText.length);
        // CRITICAL: Clear any pending voice timeout to prevent double voice
        if (voiceTimeoutRef.current) {
          clearTimeout(voiceTimeoutRef.current);
        }
        
        // Calculate approximate typing time based on text length and speed
        const typingSpeed = miraMode === 'comfort' ? 25 : 
                          miraMode === 'emergency' ? 50 :
                          miraMode === 'instant' ? 60 : 40;
        const typingTime = (miraResponseText.length / typingSpeed) * 1000;
        
        // Check if voice should be skipped (tile was clicked)
        if (skipVoiceOnNextResponseRef.current) {
          console.log('[MIRA VOICE] Skipping voice - response triggered by tile click');
          skipVoiceOnNextResponseRef.current = false; // Reset for next response
        } else {
          // Wait for text animation to complete, then speak
          voiceTimeoutRef.current = setTimeout(() => {
            console.log('[MIRA VOICE] Now calling speakWithMira');
            speakWithMira(miraResponseText);
            voiceTimeoutRef.current = null;
          }, Math.min(typingTime + 500, 3000)); // Cap at 3 seconds to avoid too long wait
        }
      } else {
        console.log('[MIRA VOICE] Voice not triggered - voiceEnabled:', voiceEnabled, 'text:', !!miraResponseText);
      }
      
      // Sync Mira's response to service desk
      if (ticketId || currentTicket?.id) {
        await syncToServiceDesk(ticketId || currentTicket.id, {
          type: 'mira',
          content: miraResponseText
        }, {
          label: lifeState,
          chips_offered: quickReplies.map(r => r.text),
          product_suggestions: shouldShowProducts ? 
            data.response?.products?.slice(0, 5).map(p => ({ sku: p.id, name: p.name })) : [],
          step_id: miraStepId,
          is_clarifying_question: isNewClarifyingQuestion
        });
      }
      
      // Update conversation stage
      if (conversationStage === 'initial') {
        setConversationStage('clarifying');
      }
      
    } catch (error) {
      console.error('Mira error:', error);
      // Clear skeleton on error
      clearTimeout(skeletonTimer);
      setShowSkeleton(false);
      setIsTyping(false);
      
      // Instead of just handing to Concierge®, show a more helpful error
      // HAPTIC: Error feedback
      hapticFeedback.error();
      const errorMessage = {
        type: 'mira',
        content: "I'm having a moment - let me try that again. If this keeps happening, your pet Concierge® is always here to help.",
        error: true,
        quickReplies: [
          { text: 'Try again', value: query },
          { text: 'Connect to Concierge®', value: 'Yes, connect me to my Concierge®.' }
        ],
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
    
    setIsProcessing(false);
    setShowSkeleton(false); // Always clear skeleton when done
  }, [query, token, user, pet, extractQuickReplies, currentTicket, syncToServiceDesk, 
      conversationStage, completedSteps, stepHistory, currentStep, completeStep, isAskingForMoreInfo,
      voiceEnabled, speakWithMira, stopSpeaking]);
  
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);
  
  // Handle Concierge® handoff - flip ticket status, don't create new ticket
  const handleConciergeHandoff = useCallback(async () => {
    if (!currentTicket?.id) {
      console.warn('[HANDOFF] No active ticket to hand off');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Build summary from conversation history
      const conversationSummary = conversationHistory
        .filter(msg => msg.type !== 'user')
        .slice(-3)
        .map(msg => msg.content)
        .join(' ');
      
      // Map pillar to queue
      const queueMap = {
        'Food': 'FOOD',
        'Grooming': 'GROOMING',
        'Celebrate': 'CELEBRATE',
        'Travel': 'TRAVEL',
        'Health': 'HEALTH',
        'General': 'GENERAL'
      };
      const conciergeQueue = queueMap[currentTicket.pillar] || 'GENERAL';
      
      const response = await fetch(`${API_URL}/api/service_desk/handoff_to_concierge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ticket_id: currentTicket.id,
          concierge_queue: conciergeQueue,
          latest_mira_summary: `Parent needs help with ${currentTicket.pillar.toLowerCase()} for ${pet.name} (${pet.breed}, ${pet.age}y). ${pet.sensitivities?.length ? `Allergies: ${pet.sensitivities.join(', ')}.` : ''} ${conversationSummary}`
        })
      });
      
      const data = await response.json();
      
      // Update local state
      setCurrentTicket(prev => ({
        ...prev,
        status: 'open_concierge'
      }));
      setConversationStage('concierge_engaged');
      
      // Add Mira's confirmation message
      const miraConfirmation = {
        type: 'mira',
        content: `I've asked your pet Concierge® to help with this. They'll review everything we've discussed about ${pet.name} and get back to you here.`,
        isConciergeHandoff: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, miraConfirmation]);
      
      console.log('[HANDOFF] Ticket handed off to Concierge®:', currentTicket.id, '-> Queue:', conciergeQueue);
      
    } catch (error) {
      console.error('[HANDOFF] Failed:', error);
      const errorMessage = {
        type: 'mira',
        content: "I couldn't connect you right now, but I've noted your request. A Concierge® will reach out shortly.",
        error: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
    
    setIsProcessing(false);
  }, [currentTicket, conversationHistory, pet, token]);
  
  // Handle quick reply
  const handleQuickReply = useCallback((replyValue, skipVoice = false) => {
    // ═══════════════════════════════════════════════════════════════════
    // VOICE SYNC FIX: Cancel any pending/playing voice before new action
    // This prevents overlap when tiles are clicked rapidly
    // ═══════════════════════════════════════════════════════════════════
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    stopSpeaking();
    
    // Mark that the next response should skip voice (tile was clicked)
    skipVoiceOnNextResponseRef.current = true;
    
    // HAPTIC: Chip tap
    hapticFeedback.chipTap();
    setQuery(replyValue);
    setTimeout(() => {
      if (handleSubmitRef.current) {
        handleSubmitRef.current(null, replyValue);
      }
    }, 50);
  }, [stopSpeaking]);
  
  // IN-MIRA SERVICE REQUEST HANDLERS
  // Open service request modal when clicking a service/experience card
  const openServiceRequest = useCallback((service, isExperience = false) => {
    // HAPTIC: Card tap
    hapticFeedback.cardTap();
    setServiceRequestModal({
      isOpen: true,
      service: { ...service, isExperience },
      formData: {
        notes: '',
        preferredDate: '',
        urgency: 'normal'
      },
      isSubmitting: false,
      submitted: false
    });
    console.log('[SERVICE_REQUEST] Opened modal for:', service.label);
  }, []);
  
  // Update form data in service request modal
  const updateServiceFormData = useCallback((field, value) => {
    setServiceRequestModal(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value }
    }));
  }, []);
  
  // Submit service request - creates ticket, notifies admin, updates soul
  const submitServiceRequest = useCallback(async () => {
    if (!serviceRequestModal.service) return;
    
    setServiceRequestModal(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      const service = serviceRequestModal.service;
      const formData = serviceRequestModal.formData;
      
      // Map service to pillar
      const pillarMap = {
        'grooming': 'Care',
        'walks': 'Care',
        'training': 'Learn',
        'vet': 'Care',
        'boarding': 'Stay',
        'photography': 'Celebrate',
        'party-planning': 'Celebrate',
        'chefs-table': 'Dine',
        'home-dining': 'Dine',
        'meal-subscription': 'Dine',
        'pawcation': 'Stay',
        'multi-pet-travel': 'Travel',
        'travel-planning': 'Travel'
      };
      const pillar = pillarMap[service.id] || 'General';
      
      // Create the service request message
      const requestMessage = `I'd like to request ${service.label} for ${pet.name}. ${formData.notes ? `Additional notes: ${formData.notes}` : ''} ${formData.preferredDate ? `Preferred date: ${formData.preferredDate}` : ''} Urgency: ${formData.urgency}`;
      
      // Create/attach ticket via existing API
      const ticketResponse = await fetch(`${API_URL}/api/service_desk/attach_or_create_ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          parent_id: user?.id || 'demo-user',
          pet_id: pet.id,
          pillar: pillar,
          intent_primary: service.label.toUpperCase().replace(/\s+/g, '_'),
          intent_secondary: [service.isExperience ? 'EXPERIENCE' : 'SERVICE'],
          life_state: formData.urgency === 'urgent' ? 'URGENT' : 'PLANNING',
          channel: 'mira_os_demo',
          initial_message: {
            sender: 'parent',
            source: 'mira_os',
            text: requestMessage
          }
        })
      });
      
      const ticketData = await ticketResponse.json();
      
      if (ticketResponse.ok) {
        console.log('[SERVICE_REQUEST] Ticket created:', ticketData.ticket_id);
        
        // Add confirmation message to chat
        const confirmationMessage = {
          type: 'mira',
          content: `I've submitted your ${service.label} request for ${pet.name}. Your request ID is **${ticketData.ticket_id}**. ${isConciergeLive() ? 'Your pet Concierge® has been notified and will reach out shortly!' : 'Our team will follow up first thing at 6:30 AM.'}`,
          isConfirmation: true,
          serviceRequest: {
            id: ticketData.ticket_id,
            service: service.label,
            status: 'submitted'
          },
          timestamp: new Date()
        };
        setConversationHistory(prev => [...prev, confirmationMessage]);
        
        // Update soul score for the interaction
        try {
          await fetch(`${API_URL}/api/mira/increment-soul-score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({
              pet_id: pet.id,
              interaction_type: 'service_request',
              points: 1.5  // Service requests grow the soul
            })
          });
          console.log('[SOUL] Soul score incremented for service request');
        } catch (err) {
          console.log('[SOUL] Could not increment soul score:', err);
        }
        
        setServiceRequestModal(prev => ({
          ...prev,
          isSubmitting: false,
          submitted: true
        }));
        
        // Close modal after showing success briefly
        setTimeout(() => {
          setServiceRequestModal({
            isOpen: false,
            service: null,
            formData: {},
            isSubmitting: false,
            submitted: false
          });
        }, 2500);
        
      } else {
        throw new Error(ticketData.detail || 'Failed to create request');
      }
      
    } catch (error) {
      console.error('[SERVICE_REQUEST] Error:', error);
      setServiceRequestModal(prev => ({ ...prev, isSubmitting: false }));
      
      // Add error message to chat
      const errorMessage = {
        type: 'mira',
        content: `I couldn't submit that request right now, but don't worry—you can reach your Concierge® directly via WhatsApp and they'll take care of it.`,
        error: true,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, errorMessage]);
    }
  }, [serviceRequestModal, pet, token, user]);
  
  // Close service request modal
  const closeServiceRequest = useCallback(() => {
    setServiceRequestModal({
      isOpen: false,
      service: null,
      formData: {},
      isSubmitting: false,
      submitted: false
    });
  }, []);
  
  // Voice recognition state
  const [voiceError, setVoiceError] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState(true);
  
  // Voice recognition - Enhanced for iOS compatibility
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      console.log('Speech recognition not supported in this browser');
      return;
    }
    
    try {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true; // Show interim results for better UX
      recognitionRef.current.lang = 'en-US'; // Explicit language setting
      recognitionRef.current.maxAlternatives = 1;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Show interim results while speaking
        if (interimTranscript) {
          setQuery(interimTranscript);
        }
        
        // Submit on final result
        if (finalTranscript) {
          setQuery(finalTranscript);
          setIsListening(false);
          setVoiceError(null);
          if (handleSubmitRef.current) {
            setTimeout(() => {
              handleSubmitRef.current(null, finalTranscript);
            }, 300);
          }
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        // Handle specific errors
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            setVoiceError('Microphone access denied. Please allow microphone in your browser settings.');
            break;
          case 'no-speech':
            setVoiceError('No speech detected. Please try again.');
            break;
          case 'network':
            setVoiceError('Network error. Please check your connection.');
            break;
          case 'aborted':
            // User aborted, no error message needed
            break;
          default:
            setVoiceError('Voice input error. Please try again.');
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setVoiceSupported(false);
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);
  
  const toggleVoice = async () => {
    // Clear any previous error
    setVoiceError(null);
    
    if (!recognitionRef.current) {
      setVoiceError('Voice input not available in this browser. Try Chrome or Safari.');
      return;
    }
    
    if (isListening) {
      // HAPTIC: Voice stop
      hapticFeedback.voiceStop();
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      setIsListening(false);
    } else {
      // HAPTIC: Voice start
      hapticFeedback.voiceStart();
      
      // Request microphone permission explicitly for iOS
      try {
        // Check if we need to request permission (iOS Safari)
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Microphone permission error:', error);
        setVoiceError('Please allow microphone access to use voice input.');
        setIsListening(false);
      }
    }
  };
  
  // Toggle voice output
  const toggleVoiceOutput = () => {
    // HAPTIC: Toggle
    hapticFeedback.toggle();
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
    setVoiceEnabled(!voiceEnabled);
  };
  
  // Handle dock click
  const handleDockClick = (item) => {
    // HAPTIC: Navigation
    hapticFeedback.navigate();
    setActiveDockItem(item.id);
    if (item.action === 'openChat') {
      window.dispatchEvent(new CustomEvent('openMiraAI'));
    } else if (item.action === 'openHelp') {
      setShowHelpModal(true);
    } else if (item.action === 'openLearn') {
      setShowLearnModal(true);
      fetchLearnVideos('recommended');
    } else if (item.path) {
      navigate(item.tab ? `${item.path}?tab=${item.tab}` : item.path);
    }
  };
  
  // Fetch Learn videos
  const fetchLearnVideos = async (category) => {
    setLearnLoading(true);
    setLearnCategory(category);
    try {
      let url = `${API_URL}/api/mira/youtube/`;
      // For demo pet or recommended, use by-breed instead
      const isRealPet = pet.id && !pet.id.startsWith('demo') && !pet.id.startsWith('pet-');
      
      switch (category) {
        case 'recommended':
          if (isRealPet) {
            url += `recommended/${pet.id}?max_results=6`;
          } else {
            url += `by-breed?breed=${encodeURIComponent(pet.breed || 'dog')}&max_results=6`;
          }
          break;
        case 'barking':
          url += `by-topic?topic=stop%20barking&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'potty':
          url += `by-topic?topic=potty%20training&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'leash':
          url += `by-topic?topic=leash%20walking&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'tricks':
          url += `by-topic?topic=dog%20tricks&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'anxiety':
          url += `by-topic?topic=dog%20anxiety%20calm&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        case 'puppy':
          url += `by-age?age_years=0.5&breed=${encodeURIComponent(pet.breed || '')}&max_results=6`;
          break;
        default:
          url += `by-breed?breed=${encodeURIComponent(pet.breed || 'dog')}&max_results=6`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setLearnVideos(data.videos || []);
    } catch (e) {
      console.error('[LEARN] Failed to fetch videos:', e);
      setLearnVideos([]);
    } finally {
      setLearnLoading(false);
    }
  };
  
  // Handle feedback
  const handleFeedback = async (messageIndex, isPositive) => {
    setConversationHistory(prev => prev.map((msg, idx) => 
      idx === messageIndex 
        ? { ...msg, feedbackGiven: isPositive ? 'positive' : 'negative' }
        : msg
    ));
    
    try {
      await fetch(`${API_URL}/api/mira/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          message_id: conversationHistory[messageIndex]?.data?.understanding?.entities?.message_id || `msg_${messageIndex}`,
          is_positive: isPositive,
          pet_id: pet.id
        })
      });
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };
  
  const getIntentColor = (intent) => {
    const colors = {
      'FIND': 'bg-blue-500/20 text-blue-300',
      'PLAN': 'bg-purple-500/20 text-purple-300',
      'ORDER': 'bg-green-500/20 text-green-300',
      'CONCERN': 'bg-amber-500/20 text-amber-300',
      'COMPARE': 'bg-cyan-500/20 text-cyan-300',
      'EXPLORE': 'bg-pink-500/20 text-pink-300',
      'HOLD': 'bg-purple-500/20 text-purple-300'
    };
    return colors[intent] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="mira-prod">
      {/* PERSONALIZATION TICKER - Animated ribbon showing how Mira knows the pet */}
      {tickerItems.length > 0 && (
        <div className="mira-ticker">
          <div className="ticker-track">
            <div className="ticker-content">
              {/* Duplicate items for seamless loop */}
              {[...tickerItems, ...tickerItems, ...tickerItems].map((item, i) => (
                <span 
                  key={`ticker-${i}`} 
                  className={`ticker-item ticker-${item.type}`}
                  onClick={() => {
                    if (item.type === 'place') {
                      handleQuickReply(`Tell me about ${item.text.split(' welcomes')[0]} for ${pet.name}`);
                    } else if (item.type === 'weather') {
                      handleQuickReply(`What activities are good for ${pet.name} in this weather?`);
                    }
                  }}
                >
                  <span className="ticker-icon">{item.icon}</span>
                  <span className="ticker-text">{item.text}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* HEADER */}
      <header className="mp-header">
        <div className="mp-header-inner">
          {/* Left: Mira Logo - Pink circle */}
          <div className="mp-logo">
            <div className="mp-logo-icon">
              <Sparkles />
            </div>
            <div className="mp-logo-text">
              <span className="mp-logo-title">Mira</span>
              <span className="mp-logo-subtitle">Your Pet Companion</span>
            </div>
          </div>
          
          {/* Right: Pet Badge - Orange */}
          <button 
            className="mp-pet-badge"
            onClick={() => setShowPetSelector(!showPetSelector)}
            data-testid="pet-selector-btn"
          >
            <div className="mp-pet-avatar">
              {pet.photo ? <img src={pet.photo} alt={pet.name} /> : <PawPrint />}
            </div>
            <span className="mp-pet-name">{pet.name}</span>
          </button>
          
          {/* Pet Dropdown */}
          {showPetSelector && (
            <div className="mp-pet-dropdown">
              {allPets.map((p) => (
                <button key={p.id} onClick={() => switchPet(p)} className={`mp-pet-option ${p.id === pet.id ? 'active' : ''}`}>
                  <div className="mp-pet-avatar">
                    {p.photo ? <img src={p.photo} alt={p.name} /> : <PawPrint />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ display: 'block', color: 'white', fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      {p.breed}
                      {p.soulScore > 10 ? (
                        <span style={{ 
                          background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                          padding: '2px 6px', 
                          borderRadius: '8px', 
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white'
                        }}>
                          {p.soulScore}%
                        </span>
                      ) : (
                        <span style={{ 
                          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                          padding: '2px 6px', 
                          borderRadius: '8px', 
                          fontSize: '9px',
                          fontWeight: '600',
                          color: 'white',
                          animation: 'pulse 2s infinite'
                        }}>
                          ✨ New
                        </span>
                      )}
                    </span>
                  </div>
                  {p.id === pet.id && <Check style={{ color: '#a855f7' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      
      {/* NAVIGATION DOCK - Horizontal Pills */}
      <nav className="mp-dock">
        <button onClick={() => inputRef.current?.focus()} className="mp-dock-btn" data-testid="dock-concierge">
          <MessageCircle /> <span>Concierge®</span>
        </button>
        <button onClick={() => navigate('/orders')} className="mp-dock-btn" data-testid="dock-orders">
          <Package /> <span>Orders</span>
        </button>
        <button onClick={() => navigate('/family-dashboard')} className="mp-dock-btn" data-testid="dock-plan">
          <Calendar /> <span>Plan</span>
        </button>
        <button onClick={() => setShowHelpModal(true)} className="mp-dock-btn" data-testid="dock-help">
          <HelpCircle /> <span>Help</span>
        </button>
        <button onClick={() => navigate('/dashboard')} className="mp-dock-btn" data-testid="dock-soul">
          <Heart /> <span>Soul</span>
        </button>
        <button onClick={() => { setShowLearnModal(true); fetchLearnVideos('recommended'); }} className="mp-dock-btn" data-testid="dock-learn">
          <Play /> <span>Learn</span>
        </button>
      </nav>
      
      {/* FLOATING ACTION BAR - Always visible, clean icons for Insight/Concierge®/History */}
      {conversationHistory.length > 0 && (
        <div className="mp-floating-bar" data-testid="floating-action-bar">
          {/* Past Chats */}
          <button 
            className={`mp-float-btn ${showPastChats ? 'active' : ''}`}
            onClick={() => { loadPastChats(); setShowPastChats(true); }}
            data-testid="float-history-btn"
            title="Past Chats"
          >
            <History size={18} />
          </button>
          
          {/* Mira's Insights - Paw icon */}
          <button 
            className={`mp-float-btn insight-btn ${showInsightsPanel ? 'active' : ''}`}
            onClick={() => setShowInsightsPanel(!showInsightsPanel)}
            data-testid="float-insight-btn"
            title="Mira's Insights"
          >
            <PawPrint size={18} />
            <Sparkles size={10} className="insight-sparkle" />
          </button>
          
          {/* Concierge® Help - C° icon */}
          <button 
            className={`mp-float-btn concierge-float-btn ${showConciergePanel ? 'active' : ''}`}
            onClick={() => setShowConciergePanel(!showConciergePanel)}
            data-testid="float-concierge-btn"
            title="Get Help"
          >
            <span className="float-c">C</span>
            <span className="float-degree">°</span>
          </button>
          
          {/* New Chat */}
          <button 
            className="mp-float-btn new-chat-btn"
            onClick={startNewSession}
            data-testid="float-new-chat-btn"
            title="New Chat"
          >
            <Plus size={18} />
          </button>
        </div>
      )}
      
      {/* INSIGHTS PANEL - Slides down when insight icon clicked */}
      {showInsightsPanel && (
        <div className="mp-insights-panel" data-testid="insights-panel">
          <div className="mp-insights-header">
            <span><PawPrint size={14} /> <Sparkles size={12} /> Mira's Insights for {pet.name}</span>
            <button onClick={() => setShowInsightsPanel(false)}><X size={16} /></button>
          </div>
          <div className="mp-insights-content">
            {conversationHistory
              .filter(msg => msg.type === 'mira' && msg.data?.response?.tips?.length > 0)
              .flatMap(msg => msg.data.response.tips)
              .slice(-5)
              .map((tip, idx) => (
                <div key={idx} className="mp-insight-item">
                  <span className="insight-bullet">💡</span>
                  <span>{tip}</span>
                </div>
              ))}
            {conversationHistory.filter(msg => msg.type === 'mira' && msg.data?.response?.tips?.length > 0).length === 0 && (
              <p className="mp-no-insights">Keep chatting and I'll share helpful insights for {pet.name}!</p>
            )}
          </div>
        </div>
      )}
      
      {/* CONCIERGE PANEL - Quick access to help */}
      {showConciergePanel && (
        <div className="mp-concierge-panel" data-testid="concierge-panel">
          <div className="mp-concierge-panel-header">
            <span><span className="panel-c">C</span><span className="panel-degree">°</span> Concierge® Help</span>
            <button onClick={() => setShowConciergePanel(false)}><X size={16} /></button>
          </div>
          <p className="mp-concierge-panel-desc">Your pet Concierge® can help with anything for {pet.name}.</p>
          <div className="mp-concierge-panel-options">
            <a 
              href={`https://wa.me/919663185747?text=${encodeURIComponent(`Hi, I need help with ${pet.name} (${pet.breed}).`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="concierge-panel-opt whatsapp"
            >
              <Phone size={16} /> WhatsApp
            </a>
            <button onClick={handleConciergeHandoff} className="concierge-panel-opt chat">
              <MessageSquare size={16} /> Chat
            </button>
            <a 
              href={`mailto:concierge@thedoggycompany.in?subject=Help with ${pet.name}`}
              className="concierge-panel-opt email"
            >
              <Mail size={16} /> Email
            </a>
          </div>
        </div>
      )}
      
      {/* TEST SCENARIOS PANEL - Dark Card (like production) */}
      {showTestScenarios && (
        <div className="mp-test-panel">
          <div className="mp-test-header">
            <span className="mp-test-title">
              <Sparkles /> Test Scenarios
            </span>
            <button className="mp-test-close" onClick={() => {
              localStorage.setItem('mira_test_scenarios_dismissed', 'true');
              setShowTestScenarios(false);
            }}>
              <X />
            </button>
          </div>
          <div className="mp-test-grid">
            {TEST_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => { hapticFeedback.chipTap(); setActiveScenario(scenario.id); handleQuickReply(scenario.query); }}
                data-testid={`scenario-${scenario.id}`}
                className={`mp-test-chip ${activeScenario === scenario.id ? 'active' : ''}`}
              >
                {scenario.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Past Chats Sidebar */}
      {showPastChats && (
        <div className="mp-past-chats">
          <div className="mp-past-chats-header">
            <h3 className="mp-past-chats-title">Past Chats</h3>
            <button onClick={() => { hapticFeedback.modalClose(); setShowPastChats(false); }} className="mp-past-chats-close">
              <X />
            </button>
          </div>
          
          <div className="mp-past-chats-list">
            {loadingPastChats ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading...</div>
            ) : pastSessions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>No past conversations</div>
            ) : (
              pastSessions.map((session) => (
                <button
                  key={session.session_id}
                  onClick={() => { hapticFeedback.cardTap(); loadSession(session); }}
                  className={`mp-session-btn ${session.session_id === sessionId ? 'active' : ''}`}
                  data-testid={`session-${session.session_id}`}
                >
                  <div className="mp-session-meta">
                    <PawPrint />
                    <span className="mp-session-pet">{session.pet_name}</span>
                    <span className="mp-session-date">{formatSessionDate(session.updated_at)}</span>
                  </div>
                  <p className="mp-session-preview">{session.preview || 'Empty conversation'}</p>
                </button>
              ))
            )}
          </div>
          
          <div className="mp-past-chats-footer">
            <button onClick={() => { hapticFeedback.buttonTap(); startNewSession(); setShowPastChats(false); }} className="mp-concierge-btn">
              <Plus /> Start New Chat
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Area - Apple iMessage Spacing */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="mp-messages"
      >
        <div className="mp-messages-inner">
          {/* Welcome State - Premium "For Pet" Experience - Matches UnifiedHero from Pillar Pages */}
          {conversationHistory.length === 0 && !isProcessing && (
            <div className="mira-hero-welcome">
              {/* Action Buttons Row */}
              <div className="hero-actions-row">
                {/* Soul / Dashboard Button - Goes to dashboard for logged-in users */}
                <button 
                  className="soul-journey-btn" 
                  onClick={() => navigate(token ? '/dashboard' : `/pet-soul/${pet.id || ''}`)}
                  data-testid="soul-journey-btn"
                >
                  <Crown className="w-4 h-4" />
                  <span>{token ? `Enhance ${pet.name}'s Soul` : `Start ${pet.name}'s soul journey`}</span>
                </button>
                
                {/* View Past Chats Button */}
                <button 
                  className="history-btn" 
                  onClick={() => { loadPastChats(); setShowPastChats(true); }}
                  data-testid="view-history-btn"
                >
                  <History className="w-4 h-4" />
                  <span>Past Chats</span>
                </button>
              </div>
              
              {/* Hero Layout - Avatar Left, Content Right */}
              <div className="hero-layout">
                {/* Pet Avatar with Multiple Animated Rings */}
                <div className="hero-avatar-container">
                  {/* Glow effect */}
                  <div className="avatar-glow"></div>
                  
                  {/* Multiple concentric rings */}
                  <div className="avatar-ring ring-1"></div>
                  <div className="avatar-ring ring-2"></div>
                  <div className="avatar-ring ring-3"></div>
                  
                  {/* Pet Photo */}
                  <div className="avatar-photo">
                    {pet.photo ? (
                      <img 
                        src={pet.photo} 
                        alt={pet.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/lorelei/svg?seed=${pet.name}&backgroundColor=ffdfbf`;
                        }}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        <PawPrint className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  
                  {/* Soul Score Badge - Mira prompt when incomplete */}
                  {pet.soulScore > 10 ? (
                    <div className="soul-score-badge" onClick={() => navigate(`/pet-soul/${pet.id || ''}`)}>
                      <span className="soul-percent">{pet.soulScore}%</span>
                      <span className="soul-label">SOUL<br/>KNOWN</span>
                    </div>
                  ) : (
                    <div 
                      className="soul-score-badge soul-incomplete" 
                      onClick={() => navigate(`/pet-soul/${pet.id || ''}`)}
                      data-testid="soul-incomplete-prompt"
                    >
                      <span className="soul-sparkle">✨</span>
                      <span className="soul-cta">Help Mira<br/>know {pet.name}</span>
                    </div>
                  )}
                  
                  {/* Health Tile - Links to /dashboard */}
                  <a 
                    href="/dashboard"
                    className="health-tile"
                    data-testid="health-tile"
                  >
                    <div className="health-tile-icon">
                      <Heart size={16} />
                    </div>
                    <div className="health-tile-content">
                      <span className="health-tile-label">Health</span>
                      {healthVault.completeness < 100 ? (
                        <span className="health-tile-status incomplete">{healthVault.completeness}%</span>
                      ) : (
                        <span className="health-tile-status complete">✓</span>
                      )}
                    </div>
                  </a>
                </div>
                
                {/* Content Side */}
                <div className="hero-content">
                  {/* Title */}
                  <h1 className="hero-title">
                    For <span className="gradient-text">{pet.name}</span>
                  </h1>
                  
                  {/* Subtitle */}
                  <p className="hero-subtitle">Curated with love for {pet.name}</p>
                  
                  {/* Proactive Greeting - Time/Context based */}
                  {proactiveGreeting && (
                    <div 
                      className={`proactive-greeting ${proactiveGreeting.hasAlert ? 'has-alert' : ''}`}
                      onClick={() => {
                        if (proactiveGreeting.hasAlert) {
                          handleQuickReply(proactiveGreeting.text);
                        }
                      }}
                    >
                      <span className="greeting-icon">{proactiveGreeting.icon}</span>
                      <span className="greeting-text">{proactiveGreeting.text}</span>
                      {proactiveGreeting.hasAlert && <ChevronRight className="greeting-arrow" />}
                    </div>
                  )}
                  
                  {/* Soul Traits - Generate from pet data */}
                  <div className="soul-traits">
                    {(() => {
                      // Generate traits dynamically from pet soul data
                      const traits = [];
                      
                      // 1. Personality tag (if set)
                      if (pet.soul?.personality_tag) {
                        traits.push({ label: pet.soul.personality_tag, icon: '✨', color: '#a855f7' });
                      } else if (pet.doggy_soul_answers?.general_nature) {
                        traits.push({ label: `${pet.doggy_soul_answers.general_nature} soul`, icon: '✨', color: '#a855f7' });
                      }
                      
                      // 2. Love language or describe words
                      if (pet.soul?.love_language) {
                        traits.push({ label: `${pet.soul.love_language} lover`, icon: '❤️', color: '#ef4444' });
                      } else if (pet.doggy_soul_answers?.describe_3_words) {
                        const firstWord = pet.doggy_soul_answers.describe_3_words.split(',')[0]?.trim();
                        if (firstWord) traits.push({ label: firstWord, icon: '🎀', color: '#ec4899' });
                      }
                      
                      // 3. Energy level or special trait
                      if (pet.soul?.energy_level) {
                        traits.push({ label: `${pet.soul.energy_level} energy`, icon: '⚡', color: '#f59e0b' });
                      } else if (pet.doggy_soul_answers?.energy_level) {
                        traits.push({ label: pet.doggy_soul_answers.energy_level, icon: '⚡', color: '#f59e0b' });
                      }
                      
                      // Use soulTraits from prop if available
                      const finalTraits = pet.soulTraits?.length > 0 ? pet.soulTraits : 
                                          traits.length > 0 ? traits : 
                                          [{ label: 'Unique soul', icon: '⭐', color: '#f59e0b' }];
                      
                      return finalTraits.slice(0, 3).map((trait, i) => (
                        <div key={i} className="trait-chip">
                          <span className="trait-icon">{trait.icon}</span>
                          <span className="trait-label">{trait.label}</span>
                        </div>
                      ));
                    })()}
                  </div>
                  
                  {/* Personalized Picks Card - "Mira knows" style */}
                  <div className="mira-love-card" onClick={() => handleQuickReply(`Show me personalized picks for ${pet.name}`)}>
                    <div className="love-card-icon">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="love-card-content">
                      <p className="love-card-title">
                        "💕 Personalized picks for {pet.name}"
                      </p>
                      <p className="love-card-subtitle">
                        <Heart className="w-3 h-3" /> Mira knows {pet.name}
                      </p>
                    </div>
                    <Sparkles className="love-card-sparkle" />
                  </div>
                  
                  {/* HEALTH VAULT PROMPT - When data is incomplete */}
                  {healthVault.completeness < 100 && healthVault.missing_fields.length > 0 && (
                    <div 
                      className="health-vault-prompt"
                      onClick={() => setHealthVault(prev => ({ ...prev, showWizard: true }))}
                      data-testid="health-vault-prompt"
                    >
                      <div className="vault-icon">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="vault-content">
                        <div className="vault-progress">
                          <div className="vault-progress-bar" style={{ width: `${healthVault.completeness}%` }} />
                        </div>
                        <p className="vault-title">
                          Complete {pet.name}'s Health Vault
                        </p>
                        <p className="vault-subtitle">
                          {healthVault.completeness}% complete • {healthVault.missing_fields.length} items missing
                        </p>
                      </div>
                      <ChevronRight className="vault-arrow" />
                    </div>
                  )}
                  
                  {/* E018 & E019: Proactive Alerts */}
                  {(proactiveAlerts.celebrations.length > 0 || proactiveAlerts.healthReminders.filter(r => r.needs_attention).length > 0) && (
                    <div className="proactive-alerts">
                      {/* Upcoming Celebrations */}
                      {proactiveAlerts.celebrations.filter(c => c.is_upcoming).map((celeb, i) => (
                        <div 
                          key={`celeb-${i}`} 
                          className={`proactive-alert ${celeb.is_today ? 'alert-today' : 'alert-upcoming'}`}
                          onClick={() => handleQuickReply(celeb.is_today ? `It's ${pet.name}'s ${celeb.type}! What should we do?` : `${pet.name}'s ${celeb.type} is coming up!`)}
                        >
                          <span className="alert-icon">{celeb.type === 'birthday' ? '🎂' : '💜'}</span>
                          <span className="alert-text">
                            {celeb.is_today 
                              ? `Today is ${pet.name}'s ${celeb.type === 'birthday' ? 'Birthday' : 'Gotcha Day'}!` 
                              : `${celeb.name} in ${celeb.days_until} days`}
                          </span>
                        </div>
                      ))}
                      
                      {/* Health Reminders */}
                      {proactiveAlerts.healthReminders.filter(r => r.needs_attention).slice(0, 2).map((reminder, i) => (
                        <div 
                          key={`health-${i}`} 
                          className={`proactive-alert ${reminder.urgent || reminder.is_overdue ? 'alert-urgent' : 'alert-notice'}`}
                          onClick={() => handleQuickReply(reminder.type === 'vaccine' ? `${pet.name} needs ${reminder.name} vaccine` : `Schedule a vet checkup for ${pet.name}`)}
                        >
                          <span className="alert-icon">{reminder.urgent ? '⚠️' : '💉'}</span>
                          <span className="alert-text">
                            {reminder.type === 'vet_visit' 
                              ? reminder.message 
                              : `${reminder.name} ${reminder.is_overdue ? 'overdue' : 'due soon'}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* FEATURE SHOWCASE - What Mira Can Do */}
              <div className="mira-feature-showcase" data-testid="feature-showcase">
                <div className="feature-showcase-header">
                  <Sparkles className="w-4 h-4" />
                  <span>What can Mira help with?</span>
                </div>
                
                {/* Weather Card - Dynamic based on current conditions */}
                {currentWeather && (
                  <div 
                    className={`weather-card weather-${currentWeather.pet_advisory?.safety_level || 'good'}`}
                    onClick={() => handleQuickReply(`Is it a good day to take ${pet.name} for a walk?`)}
                    data-testid="weather-card"
                  >
                    <div className="weather-card-icon">
                      {currentWeather.pet_advisory?.safety_level === 'danger' ? '🔥' :
                       currentWeather.pet_advisory?.safety_level === 'warning' ? '⚠️' :
                       currentWeather.pet_advisory?.safety_level === 'caution' ? '☀️' : '✨'}
                    </div>
                    <div className="weather-card-content">
                      <div className="weather-card-title">
                        {currentWeather.current_weather?.temperature}°C in {currentWeather.city}
                      </div>
                      <div className="weather-card-subtitle">
                        {currentWeather.pet_advisory?.walk_message}
                      </div>
                    </div>
                    <ChevronRight className="weather-card-arrow" />
                  </div>
                )}
                
                {/* Feature Grid */}
                <div className="feature-grid">
                  {MIRA_FEATURES.map((feature) => (
                    <button
                      key={feature.id}
                      className="feature-card"
                      style={{ '--feature-color': feature.color }}
                      onClick={() => handleQuickReply(feature.query)}
                      data-testid={`feature-${feature.id}`}
                    >
                      <span className="feature-icon">{feature.icon}</span>
                      <span className="feature-title">{feature.title}</span>
                      <span className="feature-desc">{feature.description}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Quick Suggestion Chips */}
              <div className="quick-chips">
                {[
                  { text: `Birthday party for ${pet.name}`, icon: '🎂' },
                  { text: 'Health checkup reminder', icon: '💉' },
                  { text: 'Custom meal plan', icon: '🍖' }
                ].map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleQuickReply(s.text)} 
                    className="quick-chip"
                    data-testid={`quick-chip-${i}`}
                  >
                    <span className="chip-icon">{s.icon}</span>
                    <span className="chip-text">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Conversation Messages */}
          {conversationHistory.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Collapsed Older Messages */}
              {conversationHistory.length > VISIBLE_MESSAGE_COUNT && (
                <div className="mp-history-toggle" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => { hapticFeedback.historyToggle(); setShowOlderMessages(!showOlderMessages); }}
                data-testid="toggle-history-btn"
                >
                  <History size={14} style={{ opacity: 0.7 }} />
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                    {showOlderMessages ? 'Hide' : 'Show'} {conversationHistory.length - VISIBLE_MESSAGE_COUNT} earlier messages
                  </span>
                  {showOlderMessages ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              )}
              
              {/* Older Messages (Collapsible) */}
              {showOlderMessages && conversationHistory.slice(0, -VISIBLE_MESSAGE_COUNT).map((msg, idx) => (
                <div key={`old-${idx}`} style={{ opacity: 0.7 }}>
                  {msg.type === 'user' ? (
                    <div className="mp-msg-user">
                      <div className="mp-bubble-user" style={{ fontSize: '13px' }}>{msg.content}</div>
                    </div>
                  ) : msg.type === 'mira' && (
                    <div className="mp-msg-mira">
                      <div className="mp-card" style={{ padding: '12px' }}>
                        <div className="mp-card-header" style={{ marginBottom: '8px' }}>
                          <div className="mp-mira-avatar" style={{ width: '24px', height: '24px' }}><Sparkles size={12} /></div>
                          <span className="mp-mira-name" style={{ fontSize: '12px' }}>Mira</span>
                        </div>
                        <div className="mp-card-body" style={{ fontSize: '13px' }}>
                          {msg.content?.substring(0, 200)}{msg.content?.length > 200 ? '...' : ''}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Visible Recent Messages */}
              {(conversationHistory.length > VISIBLE_MESSAGE_COUNT ? conversationHistory.slice(-VISIBLE_MESSAGE_COUNT) : conversationHistory).map((msg, idx) => (
                <React.Fragment key={idx}>
                  {/* Topic Shift Indicator */}
                  {msg.type === 'topic_shift' ? (
                    <div className="mp-topic-shift">
                      <div className="mp-topic-shift-line"></div>
                      <span className="mp-topic-shift-label">
                        <RefreshCw size={12} /> New Topic
                      </span>
                      <div className="mp-topic-shift-line"></div>
                    </div>
                  ) : msg.type === 'user' ? (
                    /* User Message - Pale Lilac */
                    <div className="mp-msg-user">
                      <div className="mp-bubble-user">{msg.content}</div>
                    </div>
                  ) : msg.type === 'system' ? (
                    /* System Message */
                    <div style={{ textAlign: 'center', padding: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    /* Mira Message Card - Glass Panel */
                    <div className="mp-msg-mira">
                      <div className="mp-card">
                        {/* Card Header - Clean top bar: Mira | Tiles | Help | Insight Icon | Picks Icon */}
                        <div className="mp-card-header">
                          <div className="mp-mira-avatar"><Sparkles /></div>
                          <span className="mp-mira-name">Mira</span>
                          
                          {/* Quick Reply Tiles - In header bar */}
                          {msg.quickReplies && msg.quickReplies.length > 0 && (
                            <div className="mp-header-tiles">
                              {msg.quickReplies.map((chip, cIdx) => (
                                <button 
                                  key={cIdx} 
                                  onClick={() => { hapticFeedback.chipTap(); handleQuickReply(chip.value); }} 
                                  className="mp-header-tile"
                                  data-testid={`header-tile-${cIdx}`}
                                >
                                  {chip.text}
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* Need help? Concierge® CTA - Always visible */}
                          <button 
                            className="mp-header-help"
                            onClick={() => { hapticFeedback.buttonTap(); setShowConciergePanel(true); }}
                          >
                            C° <span>Need help? Tap here</span> <ChevronRight size={12} />
                          </button>
                          
                          {/* Insight Icon - Small icon that opens insight panel */}
                          {(msg.data?.response?.tips?.length > 0 || msg.data?.insights?.length > 0) && (
                            <button 
                              className="mp-header-insight-icon"
                              onClick={() => setShowInsightsPanel(true)}
                              title="View insights"
                            >
                              <PawPrint size={16} />
                              <span className="mp-insight-count">
                                {(msg.data?.response?.tips?.length || 0) + (msg.data?.insights?.length || 0)}
                              </span>
                            </button>
                          )}
                          
                          {/* Picks Icon - Gift with pet face or paw */}
                          <button 
                            className="mp-header-picks-icon"
                            onClick={() => { hapticFeedback.trayOpen(); setShowMiraTray(true); }}
                            title={`${pet.name}'s Picks`}
                          >
                            <div className="mp-picks-gift">
                              <Gift size={18} />
                            </div>
                            {pet.photo ? (
                              <img 
                                src={pet.photo} 
                                alt={pet.name}
                                className="mp-picks-pet-face"
                              />
                            ) : (
                              <div className="mp-picks-paw">
                                <PawPrint size={12} />
                              </div>
                            )}
                            {(miraPicks.products.length + miraPicks.services.length) > 0 && (
                              <span className="mp-picks-count">
                                {miraPicks.products.length + miraPicks.services.length}
                              </span>
                            )}
                          </button>
                        </div>
                        
                        {/* Card Body - CLEAN conversation only */}
                        <div className="mp-card-body">
                          {/* Message Text - With Typing Animation for Latest Message */}
                          {(() => {
                            const isLatestMira = idx === conversationHistory.length - 1 && msg.type === 'mira';
                            const { mainText, questionText } = splitMessageWithQuestion(msg.content);
                            
                            // Determine typing speed based on mode
                            const typingSpeed = miraMode === 'comfort' ? 25 : 
                                               miraMode === 'emergency' ? 50 :
                                               miraMode === 'instant' ? 60 : 40;
                            
                            return (
                              <>
                                {mainText && (
                                  <div className="mp-card-text">
                                    <FormattedText>{mainText}</FormattedText>
                                  </div>
                                )}
                                {questionText && (
                                  <div className="mp-question">
                                    <div className="mp-question-text">
                                      <FormattedText>{questionText}</FormattedText>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                          
                          {/* Quick Reply Chips - MOVED TO HEADER BAR */}
                          {/* Tiles now appear in mp-card-header above */}
                          
                          {/* Products - CATALOG STYLE with Pillar Badge & See More */}
                          {msg.showProducts && msg.data?.response?.products?.length > 0 && (
                            <div className="mp-products mp-products-catalog" data-testid="products-catalog">
                              <div className="mp-products-catalog-header">
                                <div className="mp-products-catalog-left">
                                  {/* Pet Photo */}
                                  {pet.photo && (
                                    <img 
                                      src={pet.photo} 
                                      alt={pet.name}
                                      className="mp-products-pet-photo"
                                    />
                                  )}
                                  <div>
                                    <p className="mp-products-title">
                                      <span className="pet-name">{pet.name}'s</span> Picks
                                    </p>
                                    {/* Pillar Badge - Shows context (check both pillar and current_pillar) */}
                                    {(msg.data?.response?.pillar || msg.data?.current_pillar) && (
                                      <span className="mp-products-pillar-badge">
                                        <span className="mp-products-pillar-icon">
                                          {(() => {
                                            const p = msg.data?.response?.pillar || msg.data?.current_pillar;
                                            return p === 'celebrate' ? '🎂' :
                                                   p === 'dine' ? '🍽️' :
                                                   p === 'stay' ? '🏨' :
                                                   p === 'travel' ? '✈️' :
                                                   p === 'care' ? '💊' :
                                                   p === 'enjoy' ? '🎾' :
                                                   p === 'fit' ? '🏃' :
                                                   p === 'learn' ? '🎓' :
                                                   p === 'shop' ? '🛒' : '✨';
                                          })()}
                                        </span>
                                        {(() => {
                                          const p = msg.data?.response?.pillar || msg.data?.current_pillar;
                                          return p ? p.charAt(0).toUpperCase() + p.slice(1) : '';
                                        })()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                
                                {/* See More Button - Links to pillar page */}
                                {(msg.data?.response?.pillar || msg.data?.current_pillar) && (
                                  <a 
                                    href={`/${(() => {
                                      const p = msg.data?.response?.pillar || msg.data?.current_pillar;
                                      return p === 'shop' ? 'shop' : p;
                                    })()}`}
                                    className="mp-see-more-btn"
                                    data-testid="see-more-btn"
                                  >
                                    See More <ArrowRight />
                                  </a>
                                )}
                              </div>
                              
                              <div className="mp-products-grid">
                                {msg.data.response.products.slice(0, 4).map((product, pIdx) => (
                                  <div key={pIdx} className="mp-product-tile" data-testid={`product-tile-${pIdx}`}>
                                    {/* Match Badge - Shows why this product */}
                                    {product.match_type && (
                                      <span className={`mp-product-match-badge ${product.match_type}`}>
                                        {product.match_type === 'breed' ? `🐕 ${pet.breed?.split(' ')[0] || 'Breed'} match` :
                                         product.match_type === 'pillar' ? '✨ Context match' :
                                         '✓ For ' + pet.name}
                                      </span>
                                    )}
                                    
                                    <div className="mp-product-img-wrapper">
                                      <img 
                                        src={product.image || product.images?.[0] || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop`} 
                                        alt={product.name} 
                                        className="mp-product-img"
                                        loading="lazy"
                                      />
                                    </div>
                                    <div className="mp-product-content">
                                      <p className="mp-product-name">{product.name || product.suggestion}</p>
                                      {product.price && <p className="mp-product-price">₹{product.price}</p>}
                                      
                                      {/* Why for {Pet} - Personalized Insight */}
                                      <div className="mp-why-for-pet">
                                        <span className="mp-why-icon">💡</span>
                                        <span className="mp-why-text">
                                          {product.why_for_pet || generateWhyForPet(product, pet)}
                                        </span>
                                      </div>
                                      
                                      {/* Concierge® Whisper - Personalized curator note */}
                                      {product.concierge_whisper && (
                                        <div className="mp-concierge-whisper">
                                          <span className="mp-whisper-badge">C°</span>
                                          <span className="mp-whisper-text">{product.concierge_whisper}</span>
                                        </div>
                                      )}
                                      
                                      <button 
                                        className="mp-product-add mp-send-concierge"
                                        onClick={() => { 
                                          hapticFeedback.productSelect(); 
                                          // Add to picks for Concierge® - no cart functionality
                                          console.log(`[PICKS] Added ${product.name} to Concierge® picks`);
                                        }}
                                        data-testid={`add-product-${pIdx}`}
                                      >
                                        <ShoppingBag /> Pick
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* "Explore Full Catalog" CTA for more than 4 products */}
                              {msg.data.response.products.length > 4 && (
                                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                  <a 
                                    href={`/${msg.data?.response?.pillar || msg.data?.current_pillar || 'shop'}`}
                                    className="mp-see-more-btn"
                                    style={{ display: 'inline-flex' }}
                                  >
                                    View all {msg.data.response.products.length} products <ArrowRight />
                                  </a>
                                </div>
                              )}
                              
                              {/* CONCIERGE CURATION MESSAGE */}
                              <div className="mp-concierge-curation-message" data-testid="concierge-curation-msg">
                                <div className="curation-icon">C°</div>
                                <p>Your pet Concierge® will review these picks and curate something special for {pet.name}.</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Mira's Insight - MOVED TO HEADER BAR */}
                          {/* Button now appears in mp-card-header above */}
                          
                          {/* NEARBY PLACES CARDS - Vets, Restaurants, Parks with click-to-call */}
                          {msg.data?.nearby_places?.places?.length > 0 && (
                            <div className="nearby-places-section" data-testid="nearby-places">
                              <div className="nearby-places-title">
                                <MapPin size={14} />
                                <span>
                                  {msg.data.nearby_places.type === 'vet_clinics' ? '🏥 Nearby Vet Clinics' :
                                   msg.data.nearby_places.type === 'restaurants' ? '🍽️ Pet-Friendly Restaurants' :
                                   msg.data.nearby_places.type === 'dog_parks' ? '🌳 Dog Parks' :
                                   msg.data.nearby_places.type === 'stays' ? '🏨 Pet-Friendly Stays' :
                                   msg.data.nearby_places.type === 'pet_stores' ? '🛍️ Pet Stores' :
                                   '📍 Nearby Places'}
                                  {msg.data.nearby_places.city && ` in ${msg.data.nearby_places.city}`}
                                </span>
                              </div>
                              
                              {msg.data.nearby_places.places.slice(0, 3).map((place, pIdx) => (
                                <div key={pIdx} className="nearby-place-card" data-testid={`place-card-${pIdx}`}>
                                  <div className={`place-icon ${place.is_emergency || place.is_24_hours ? 'emergency' : ''}`}>
                                    {msg.data.nearby_places.type === 'vet_clinics' ? '🏥' :
                                     msg.data.nearby_places.type === 'restaurants' ? '🍽️' :
                                     msg.data.nearby_places.type === 'dog_parks' ? '🌳' :
                                     msg.data.nearby_places.type === 'pet_stores' ? '🛍️' : '📍'}
                                  </div>
                                  <div className="place-info">
                                    <div className="place-name">{place.name}</div>
                                    <div className="place-details">
                                      {place.rating && (
                                        <span className="place-rating">
                                          <Star size={10} fill="#f59e0b" /> {place.rating}
                                        </span>
                                      )}
                                      {place.is_24_hours && (
                                        <span className="place-badge emergency-badge">24/7</span>
                                      )}
                                      {place.is_open_now === true && (
                                        <span className="place-badge">Open Now</span>
                                      )}
                                      {place.area && <span>{place.area}</span>}
                                    </div>
                                  </div>
                                  {place.phone && (
                                    <a 
                                      href={`tel:${place.phone}`} 
                                      className="place-phone"
                                      onClick={(e) => e.stopPropagation()}
                                      data-testid={`call-place-${pIdx}`}
                                    >
                                      <Phone size={12} /> Call
                                    </a>
                                  )}
                                </div>
                              ))}
                              
                              {/* Get Directions Button */}
                              {msg.data.nearby_places.places[0] && (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(msg.data.nearby_places.places[0].name + ' ' + (msg.data.nearby_places.places[0].address || msg.data.nearby_places.city))}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="directions-btn"
                                  data-testid="get-directions-btn"
                                >
                                  <Navigation size={14} /> Get Directions to {msg.data.nearby_places.places[0].name?.split(' ').slice(0, 2).join(' ')}
                                </a>
                              )}
                            </div>
                          )}
                          
                          {/* WEATHER ADVISORY CARD - When weather data is included */}
                          {msg.data?.weather && (
                            <div className={`weather-advisory-card weather-${msg.data.weather.pet_advisory?.safety_level || 'good'}`}>
                              <div className="weather-advisory-header">
                                <span className="weather-advisory-icon">
                                  {msg.data.weather.pet_advisory?.safety_level === 'danger' ? '🔥' :
                                   msg.data.weather.pet_advisory?.safety_level === 'warning' ? '⚠️' :
                                   msg.data.weather.pet_advisory?.safety_level === 'caution' ? '☀️' : '✨'}
                                </span>
                                <span className="weather-advisory-title">
                                  {msg.data.weather.current_weather?.temperature}°C in {msg.data.weather.city}
                                </span>
                              </div>
                              <div className="weather-advisory-message">
                                {msg.data.weather.pet_advisory?.walk_message}
                              </div>
                              {msg.data.weather.suggested_activities?.length > 0 && (
                                <div className="weather-activities">
                                  {msg.data.weather.suggested_activities.slice(0, 3).map((activity, aIdx) => (
                                    <span key={aIdx} className="weather-activity">{activity}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* TRAINING VIDEOS - YouTube videos when training intent detected */}
                          {msg.data?.training_videos?.length > 0 && (
                            <div className="training-videos-section" data-testid="training-videos">
                              <div className="training-videos-title">
                                <span className="training-icon">📺</span>
                                <span>Training Videos for {pet.name}</span>
                              </div>
                              <div className="training-videos-grid">
                                {msg.data.training_videos.slice(0, 3).map((video, vIdx) => (
                                  <a 
                                    key={vIdx} 
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="training-video-card"
                                    data-testid={`video-card-${vIdx}`}
                                  >
                                    <div className="video-thumbnail">
                                      <img src={video.thumbnail} alt={video.title} />
                                      <div className="video-play-overlay">
                                        <Play size={24} fill="white" />
                                      </div>
                                    </div>
                                    <div className="video-info">
                                      <div className="video-title">{video.title?.substring(0, 60)}{video.title?.length > 60 ? '...' : ''}</div>
                                      <div className="video-channel">{video.channel}</div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* TRAVEL HOTELS - Amadeus hotels when travel intent detected */}
                          {msg.data?.travel_hotels?.length > 0 && (
                            <div className="travel-hotels-section" data-testid="travel-hotels">
                              <div className="travel-hotels-title">
                                <span className="travel-icon">🏨</span>
                                <span>Pet-Friendly Hotels in {msg.data.travel_city?.charAt(0).toUpperCase() + msg.data.travel_city?.slice(1)}</span>
                              </div>
                              {msg.data.travel_hotels.slice(0, 3).map((hotel, hIdx) => (
                                <div key={hIdx} className="travel-hotel-card" data-testid={`hotel-card-${hIdx}`}>
                                  <div className={`hotel-icon ${hotel.pet_friendly_likelihood === 'high' ? 'pet-friendly' : ''}`}>
                                    🏨
                                  </div>
                                  <div className="hotel-info">
                                    <div className="hotel-name">{hotel.name}</div>
                                    <div className="hotel-details">
                                      {hotel.pet_friendly_likelihood === 'high' && (
                                        <span className="hotel-badge pet-badge">🐾 Pet Friendly</span>
                                      )}
                                      {hotel.distance && (
                                        <span className="hotel-distance">{hotel.distance} {hotel.distance_unit}</span>
                                      )}
                                      {hotel.city && <span>{hotel.city}</span>}
                                    </div>
                                    {hotel.pet_policy_note && (
                                      <div className="hotel-policy">{hotel.pet_policy_note}</div>
                                    )}
                                  </div>
                                  <button 
                                    className="hotel-book-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Engage Concierge® for hotel booking
                                      engageConcierge('hotel_booking', {
                                        hotel_name: hotel.name,
                                        city: hotel.city || msg.data.travel_city,
                                        pet_name: pet.name
                                      });
                                    }}
                                    data-testid={`hotel-book-${hIdx}`}
                                  >
                                    <Calendar size={12} /> Book Now
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* TRAVEL ATTRACTIONS - Viator pet-friendly experiences */}
                          {msg.data?.travel_attractions?.length > 0 && (
                            <div className="travel-attractions-section" data-testid="travel-attractions">
                              <div className="travel-attractions-title">
                                <span className="attractions-icon">🎯</span>
                                <span>Pet-Friendly Experiences in {msg.data.travel_city?.charAt(0).toUpperCase() + msg.data.travel_city?.slice(1)}</span>
                              </div>
                              {msg.data.travel_attractions.slice(0, 3).map((attr, aIdx) => (
                                <a 
                                  key={aIdx} 
                                  href={attr.booking_url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="travel-attraction-card"
                                  data-testid={`attraction-card-${aIdx}`}
                                >
                                  {attr.image_url && (
                                    <div className="attraction-image">
                                      <img src={attr.image_url} alt={attr.title} />
                                    </div>
                                  )}
                                  <div className="attraction-info">
                                    <div className="attraction-title">{attr.title?.substring(0, 50)}{attr.title?.length > 50 ? '...' : ''}</div>
                                    <div className="attraction-meta">
                                      {attr.rating && (
                                        <span className="attraction-rating">
                                          <Star size={12} fill="#f59e0b" stroke="#f59e0b" /> {attr.rating.toFixed(1)}
                                        </span>
                                      )}
                                      {attr.duration && (
                                        <span className="attraction-duration">{attr.duration}</span>
                                      )}
                                      {attr.price_from && (
                                        <span className="attraction-price">From ₹{Math.round(attr.price_from)}</span>
                                      )}
                                    </div>
                                    {attr.is_outdoor && (
                                      <span className="attraction-badge outdoor-badge">🌿 Outdoor Activity</span>
                                    )}
                                  </div>
                                  <div className="attraction-book">
                                    Book <ArrowRight size={14} />
                                  </div>
                                </a>
                              ))}
                            </div>
                          )}
                          
                          {/* SERVICE CARDS - Self-service wizard options */}
                          {/* MIRA DOCTRINE: Mira is a router - offer choice between self-service and concierge */}
                          {/* E014: Services now come from database API */}
                          
                          {/* E013: REMEMBERED PROVIDERS - Show past providers first */}
                          {msg.data?.response?.remembered_providers?.length > 0 && (
                            <div className="mp-remembered-providers">
                              <p className="mp-remembered-intro">
                                🕐 Based on {pet.name}'s history:
                              </p>
                              <div className="mp-remembered-list">
                                {msg.data.response.remembered_providers.map((provider, pIdx) => (
                                  <button
                                    key={pIdx}
                                    onClick={() => openServiceRequest({
                                      id: `remembered-${provider.provider_name}`,
                                      label: `Book ${provider.provider_name} again`,
                                      icon: '⭐',
                                      description: provider.notes || `Previously used for ${provider.service_type}`,
                                      color: '#F59E0B'
                                    }, false)}
                                    className="mp-remembered-card"
                                    data-testid={`remembered-provider-${pIdx}`}
                                  >
                                    <span className="mp-remembered-icon">⭐</span>
                                    <div className="mp-remembered-info">
                                      <span className="mp-remembered-name">{provider.provider_name}</span>
                                      <span className="mp-remembered-suggestion">{provider.suggested_message}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {msg.showServices && msg.detectedServices?.length > 0 && (
                            <div className="mp-service-cards">
                              <p className="mp-service-intro">
                                {msg.data?.response?.remembered_providers?.length > 0 
                                  ? 'Or explore other options:' 
                                  : 'Choose how you\'d like to proceed:'}
                              </p>
                              <div className="mp-service-grid">
                                {msg.detectedServices.map((service, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => openServiceRequest(service, false)}
                                    className={`mp-service-card ${service.isConcierge ? 'mp-concierge-card' : ''}`}
                                    style={{ '--service-color': service.color || '#A855F7' }}
                                    data-testid={`service-${service.id}`}
                                  >
                                    <span className="mp-service-icon">{service.icon}</span>
                                    <div className="mp-service-info">
                                      <span className="mp-service-label">{service.label}</span>
                                      <span className="mp-service-desc">{service.description}</span>
                                      {service.price && (
                                        <span className="mp-service-price">From ₹{service.price}</span>
                                      )}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* EXPERIENCE CARDS - Premium curated experiences */}
                          {/* MIRA DOCTRINE: Experiences are special wizard-driven offerings */}
                          {msg.showExperiences && msg.detectedExperiences?.length > 0 && (
                            <div className="mp-experience-cards">
                              <p className="mp-experience-intro">
                                ✨ Curated experiences for {pet.name}:
                              </p>
                              <div className="mp-experience-grid">
                                {msg.detectedExperiences.map((exp, eIdx) => (
                                  <button
                                    key={eIdx}
                                    onClick={() => openServiceRequest(exp, true)}
                                    className="mp-experience-card"
                                    style={{ '--experience-color': exp.color }}
                                    data-testid={`experience-${exp.id}`}
                                  >
                                    <span className="mp-experience-icon">{exp.icon}</span>
                                    <div className="mp-experience-info">
                                      <span className="mp-experience-label">{exp.label}</span>
                                      <span className="mp-experience-desc">{exp.description}</span>
                                    </div>
                                    <span className="mp-experience-badge">Experience</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* DYNAMIC CONCIERGE REQUEST - For ANY request without direct match */}
                          {/* MIRA DOCTRINE: Concierge® can do ANYTHING (legal, moral, no medical) */}
                          {msg.dynamicConciergeRequest && (
                            <div className="mp-dynamic-request">
                              <p className="mp-dynamic-intro">
                                Let your pet Concierge® handle this for {pet.name}:
                              </p>
                              <div 
                                className="mp-dynamic-card"
                                style={{ '--request-color': msg.dynamicConciergeRequest.color }}
                              >
                                <span className="mp-dynamic-icon">{msg.dynamicConciergeRequest.icon}</span>
                                <div className="mp-dynamic-info">
                                  <span className="mp-dynamic-label">{msg.dynamicConciergeRequest.label}</span>
                                  <span className="mp-dynamic-desc">{msg.dynamicConciergeRequest.description}</span>
                                </div>
                                <span className="mp-dynamic-badge">Concierge® Request</span>
                              </div>
                            </div>
                          )}
                          
                          {/* CONCIERGE HINT - MOVED TO HEADER BAR */}
                          {/* The "Need help? Tap here" is now in mp-card-header */}
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
              
              {/* MIRA MODE INDICATOR - Like ChatGPT's "Thinking" */}
              {showSkeleton && isProcessing && (
                <div className="mp-msg-mira mp-skeleton-loader">
                  <div className="mp-mira-avatar"><Sparkles className="pulse" /></div>
                  <div className="mp-skeleton-content">
                    <div className={`mp-mode-badge mp-mode-${miraMode}`}>
                      {miraMode === 'thinking' && (
                        <>
                          <span className="mp-mode-icon">🧠</span>
                          <span className="mp-mode-label">Mira is getting her thoughts together for {pet.name}…</span>
                        </>
                      )}
                      {miraMode === 'instant' && (
                        <>
                          <span className="mp-mode-icon">⚡</span>
                          <span className="mp-mode-label"></span>
                        </>
                      )}
                      {miraMode === 'comfort' && (
                        <>
                          <span className="mp-mode-icon">💜</span>
                          <span className="mp-mode-label">I'm here with you. We can go as slowly as you need.</span>
                        </>
                      )}
                      {miraMode === 'emergency' && (
                        <>
                          <span className="mp-mode-icon">🚨</span>
                          <span className="mp-mode-label">This sounds serious enough that a vet should see {pet.name} as soon as possible.</span>
                        </>
                      )}
                      {(miraMode === 'ready' || !miraMode) && (
                        <>
                          <span className="mp-mode-icon">✨</span>
                          <span className="mp-mode-label">Mira is thinking about {pet.name}...</span>
                        </>
                      )}
                    </div>
                    <div className="mp-skeleton-lines">
                      <div className="mp-skeleton-line"></div>
                      <div className="mp-skeleton-line short"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Loading Indicator - Quick dots before skeleton */}
              {isProcessing && !showSkeleton && (
                <div className="mp-msg-mira">
                  <div className="mp-loading">
                    <div className="mp-mira-avatar"><Sparkles /></div>
                    <div className="mp-loading-dots">
                      <div className="mp-loading-dot"></div>
                      <div className="mp-loading-dot"></div>
                      <div className="mp-loading-dot"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
              
              {/* CONVERSATION COMPLETE BANNER - Compact, non-intrusive */}
              {showConversationEndBanner && conversationComplete && (
                <div className="mp-picks-curated-banner" data-testid="picks-curated-banner">
                  <div className="picks-curated-content">
                    <span className="picks-curated-text">
                      Mira has curated for {pet.name}
                    </span>
                    <button 
                      className="picks-curated-icon"
                      onClick={() => setShowMiraTray(true)}
                      title="View Picks"
                    >
                      <Gift size={16} className="picks-icon-pulse" />
                    </button>
                  </div>
                  <span className="picks-curated-subtext">
                    Your Concierge® will take it from here
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Scroll to Bottom Button */}
      {hasNewMessages && !isAtBottom && (
        <button onClick={() => scrollToBottom()} style={{
          position: 'fixed', bottom: '120px', left: '50%', transform: 'translateX(-50%)',
          padding: '8px 16px', background: 'rgba(168, 85, 247, 0.9)', border: 'none',
          borderRadius: '20px', boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)',
          fontSize: '13px', fontWeight: '500', cursor: 'pointer', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: '6px', color: 'white'
        }}>
          <ChevronDown /> New messages
        </button>
      )}
      
      {/* Input Composer - Premium */}
      <div className="mp-composer">
        {/* "Ready for Pet" button moved to header bar as compact icon */}
        
        <div className="mp-composer-inner">
          <form onSubmit={handleSubmit} className="mp-input-row">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                // VOICE SYNC: Stop voice and cancel pending voice when user types
                if (e.target.value.length > 0) {
                  if (voiceTimeoutRef.current) {
                    clearTimeout(voiceTimeoutRef.current);
                    voiceTimeoutRef.current = null;
                  }
                  if (isSpeaking) {
                    stopSpeaking();
                  }
                }
              }}
              placeholder={`Ask Mira anything...`}
              className="mp-input"
              disabled={isProcessing}
              data-testid="mira-input"
            />
            
            {/* E024: Voice Output Toggle - Auto-detects personality from context */}
            <button
              type="button"
              onClick={toggleVoiceOutput}
              className={`mp-btn-voice ${voiceEnabled ? 'active' : ''} ${isSpeaking ? 'speaking' : ''}`}
              data-testid="voice-output-btn"
              title={voiceEnabled ? 'Mira voice ON (auto-adjusts to context)' : 'Mira voice OFF'}
            >
              {voiceEnabled ? <Volume2 /> : <VolumeX />}
            </button>
            
            {/* Voice Input Button - Enhanced with error state and visual feedback */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                className={`mp-btn-mic ${isListening ? 'recording' : ''} ${voiceError ? 'error' : ''}`}
                data-testid="mic-btn"
                title={voiceError || (isListening ? 'Listening... Tap to stop' : 'Tap to speak')}
              >
                {isListening ? (
                  <div className="mp-mic-recording">
                    <MicOff />
                    <span className="mp-mic-pulse"></span>
                  </div>
                ) : (
                  <Mic />
                )}
              </button>
            )}
            
            {/* Voice Error Toast */}
            {voiceError && (
              <div className="mp-voice-error" onClick={() => setVoiceError(null)}>
                <span>{voiceError}</span>
                <X size={14} />
              </div>
            )}
            
            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              className="mp-btn-send"
              data-testid="send-btn"
            >
              <Send />
            </button>
          </form>
        </div>
      </div>
      
      {/* Sandbox Footer */}
      <div className="mp-sandbox-footer">
        🧪 Sandbox Mode — Mira OS 10/10 Premium Experience
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          MIRA PICKS TRAY - Now opens the full Vault system
          "Mira is the Brain, Concierge® is the Hands"
      ═══════════════════════════════════════════════════════════════════ */}
      {showMiraTray && !showVault && (
        <div 
          className="mp-tray-overlay" 
          onClick={() => {
            setShowMiraTray(false);
            setMiraPicks(prev => ({ ...prev, hasNew: false }));
          }}
        >
          <div className="mp-tray mp-tray-mini" onClick={(e) => e.stopPropagation()}>
            {/* Tray Header */}
            <div className="mp-tray-header">
              <div className="mp-tray-handle" />
              <div className="mp-tray-title">
                <img 
                  src={pet.photo || `https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100`} 
                  alt={pet.name}
                  className="mp-tray-pet-photo"
                />
                <div>
                  <h3>{miraPicks.context || `Picks for ${pet.name}`}</h3>
                  <p>{miraPicks.products?.length || 0} items curated by Mira</p>
                </div>
              </div>
              <button 
                className="mp-tray-close" 
                onClick={() => {
                  setShowMiraTray(false);
                  setMiraPicks(prev => ({ ...prev, hasNew: false }));
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Quick Preview + Open Vault Button */}
            <div className="mp-tray-content mp-tray-mini-content">
              <div className="mp-tray-preview">
                {miraPicks.products?.slice(0, 3).map((product, idx) => (
                  <div key={idx} className="mp-tray-preview-item">
                    {product.image ? (
                      <img src={product.image} alt={product.name} />
                    ) : (
                      <div className="mp-tray-preview-placeholder">🎁</div>
                    )}
                  </div>
                ))}
                {miraPicks.products?.length > 3 && (
                  <div className="mp-tray-preview-more">
                    +{miraPicks.products.length - 3}
                  </div>
                )}
              </div>
              
              <button 
                className="mp-tray-open-vault"
                onClick={() => {
                  setShowMiraTray(false);
                  setActiveVaultData({
                    products: miraPicks.products,
                    services: miraPicks.services
                  });
                  setVaultUserMessage(miraPicks.context || '');
                  setShowVault(true);
                }}
                data-testid="open-vault-btn"
              >
                <span>View & Select Picks</span>
                <ChevronRight size={20} />
              </button>
              
              <p className="mp-tray-concierge-note">
                <span className="mp-concierge-icon">C°</span>
                Your Concierge® will help finalize your selections
              </p>
            </div>
          </div>
        </div>
      )}
      {/* HEALTH VAULT WIZARD MODAL */}
      {healthVault.showWizard && (
        <div className="mp-modal-overlay" onClick={() => setHealthVault(prev => ({ ...prev, showWizard: false }))}>
          <div className="health-vault-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="vault-modal-header">
              <div className="vault-modal-icon">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2>{pet.name}'s Health Vault</h2>
                <p>{healthVault.completeness}% complete</p>
              </div>
              <button onClick={() => setHealthVault(prev => ({ ...prev, showWizard: false }))} className="vault-close-btn">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Progress */}
            <div className="vault-modal-progress">
              <div className="vault-modal-progress-bar" style={{ width: `${healthVault.completeness}%` }} />
            </div>
            
            {/* Missing Fields */}
            <div className="vault-fields">
              <p className="vault-fields-intro">
                Help Mira care for {pet.name} better! Complete these fields to unlock proactive health reminders.
              </p>
              
              {healthVault.missing_fields.map((field, i) => (
                <button 
                  key={field.field}
                  className={`vault-field-item ${field.priority === 'high' ? 'priority-high' : field.priority === 'medium' ? 'priority-medium' : 'priority-low'}`}
                  onClick={() => {
                    setHealthVault(prev => ({ ...prev, showWizard: false }));
                    handleQuickReply(`I want to add ${pet.name}'s ${field.label.toLowerCase()}`);
                  }}
                >
                  <span className="field-icon">
                    {field.field === 'birthday' ? '🎂' : 
                     field.field === 'gotcha_day' ? '💜' :
                     field.field === 'last_vet_visit' ? '🏥' :
                     field.field === 'vaccinations' ? '💉' :
                     field.field === 'allergies' ? '⚠️' :
                     field.field === 'weight' ? '⚖️' : '📋'}
                  </span>
                  <span className="field-label">{field.label}</span>
                  <span className="field-priority">{field.priority === 'high' ? 'Required' : field.priority === 'medium' ? 'Recommended' : 'Optional'}</span>
                  <ChevronRight className="field-arrow" />
                </button>
              ))}
            </div>
            
            {/* Footer */}
            <div className="vault-modal-footer">
              <button 
                className="vault-skip-btn"
                onClick={() => setHealthVault(prev => ({ ...prev, showWizard: false }))}
              >
                I'll do this later
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Help Modal */}
      {showHelpModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }} onClick={() => setShowHelpModal(false)}>
          <div style={{
            background: 'white', borderRadius: '20px', maxWidth: '400px', width: '90%', overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>How can we help?</h3>
              <button onClick={() => setShowHelpModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                <X />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => { setShowHelpModal(false); handleQuickReply('I need help with my order'); }} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px',
                border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer', textAlign: 'left'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Package />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>Order & Delivery</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Track, modify or report issues</p>
                </div>
              </button>
              <button onClick={() => { setShowHelpModal(false); handleConciergeHandoff(); }} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px',
                border: '1px solid #e5e7eb', borderRadius: '12px', background: 'white', cursor: 'pointer', textAlign: 'left'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>Chat with Concierge®</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>Personal assistance</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* LEARN MODAL - Training videos for pet */}
      {showLearnModal && (
        <div className="learn-modal-overlay" onClick={() => setShowLearnModal(false)} data-testid="learn-modal">
          <div className="learn-modal" onClick={(e) => e.stopPropagation()}>
            <div className="learn-modal-header">
              <div className="learn-modal-title">
                <span className="learn-icon">📺</span>
                <div>
                  <h3>Learn with {pet.name}</h3>
                  <p>Training videos tailored for {pet.breed || 'your pet'}</p>
                </div>
              </div>
              <button onClick={() => setShowLearnModal(false)} className="learn-close-btn">
                <X />
              </button>
            </div>
            
            {/* Category Tabs */}
            <div className="learn-categories">
              {[
                { id: 'recommended', label: '✨ For You', icon: '✨' },
                { id: 'barking', label: '🔊 Barking', icon: '🔊' },
                { id: 'potty', label: '🚽 Potty', icon: '🚽' },
                { id: 'leash', label: '🦮 Leash', icon: '🦮' },
                { id: 'tricks', label: '🎪 Tricks', icon: '🎪' },
                { id: 'anxiety', label: '😰 Anxiety', icon: '😰' },
                { id: 'puppy', label: '🐕 Puppy', icon: '🐕' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  className={`learn-category-btn ${learnCategory === cat.id ? 'active' : ''}`}
                  onClick={() => fetchLearnVideos(cat.id)}
                  data-testid={`learn-category-${cat.id}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            {/* Videos Grid */}
            <div className="learn-videos-container">
              {learnLoading ? (
                <div className="learn-loading">
                  <div className="learn-spinner"></div>
                  <p>Finding videos for {pet.name}...</p>
                </div>
              ) : learnVideos.length > 0 ? (
                <div className="learn-videos-grid">
                  {learnVideos.map((video, idx) => (
                    <a
                      key={idx}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="learn-video-card"
                      data-testid={`learn-video-${idx}`}
                    >
                      <div className="learn-video-thumbnail">
                        <img src={video.thumbnail} alt={video.title} />
                        <div className="learn-video-play">
                          <Play size={32} fill="white" />
                        </div>
                      </div>
                      <div className="learn-video-info">
                        <h4>{video.title?.substring(0, 50)}{video.title?.length > 50 ? '...' : ''}</h4>
                        <p>{video.channel}</p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="learn-empty">
                  <p>No videos found for this category.</p>
                  <button onClick={() => fetchLearnVideos('recommended')}>View recommended videos</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* SERVICE REQUEST MODAL - Everything stays in Mira OS */}
      {serviceRequestModal.isOpen && serviceRequestModal.service && (
        <div className="mp-modal-overlay" onClick={closeServiceRequest}>
          <div className="mp-service-modal" onClick={(e) => e.stopPropagation()}>
            {serviceRequestModal.submitted ? (
              <div className="mp-modal-success">
                <div className="mp-success-icon">✓</div>
                <h3>Request Submitted!</h3>
                <p>Your Concierge® has been notified and will reach out shortly.</p>
              </div>
            ) : (
              <>
                <div className="mp-modal-header">
                  <div className="mp-modal-title-row">
                    <span className="mp-modal-icon" style={{ background: serviceRequestModal.service.color }}>
                      {serviceRequestModal.service.icon}
                    </span>
                    <div>
                      <h3 className="mp-modal-title">{serviceRequestModal.service.label}</h3>
                      <p className="mp-modal-subtitle">for {pet.name}</p>
                    </div>
                  </div>
                  <button onClick={closeServiceRequest} className="mp-modal-close">
                    <X />
                  </button>
                </div>
                
                <div className="mp-modal-body">
                  <p className="mp-modal-desc">{serviceRequestModal.service.description}</p>
                  
                  <div className="mp-form-group">
                    <label className="mp-form-label">Additional Details</label>
                    <textarea
                      className="mp-form-textarea"
                      placeholder={`Tell us more about what you need for ${pet.name}...`}
                      value={serviceRequestModal.formData.notes || ''}
                      onChange={(e) => updateServiceFormData('notes', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="mp-form-row">
                    <div className="mp-form-group">
                      <label className="mp-form-label">Preferred Date</label>
                      <input
                        type="date"
                        className="mp-form-input"
                        value={serviceRequestModal.formData.preferredDate || ''}
                        onChange={(e) => updateServiceFormData('preferredDate', e.target.value)}
                      />
                    </div>
                    
                    <div className="mp-form-group">
                      <label className="mp-form-label">Urgency</label>
                      <select
                        className="mp-form-select"
                        value={serviceRequestModal.formData.urgency || 'normal'}
                        onChange={(e) => updateServiceFormData('urgency', e.target.value)}
                      >
                        <option value="flexible">Flexible</option>
                        <option value="normal">Normal</option>
                        <option value="soon">Soon (this week)</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  {!isConciergeLive() && (
                    <div className="mp-after-hours-notice">
                      🌙 Our team is resting (11:30 PM - 6:30 AM). Your request will be processed first thing at 6:30 AM!
                    </div>
                  )}
                </div>
                
                <div className="mp-modal-footer">
                  <button 
                    onClick={closeServiceRequest}
                    className="mp-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitServiceRequest}
                    className="mp-btn-primary"
                    disabled={serviceRequestModal.isSubmitting}
                  >
                    {serviceRequestModal.isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          VAULT SYSTEM - Full-screen overlay for picks, bookings, places, etc.
          "Mira is the Brain, Concierge® is the Hands"
          ═══════════════════════════════════════════════════════════════════════════ */}
      {showVault && (
        <div className="vault-overlay" data-testid="vault-overlay">
          <VaultManager
            isOpen={showVault}
            onClose={() => {
              setShowVault(false);
              setActiveVaultData(null);
              setVaultUserMessage('');
            }}
            miraResponse={{
              products: miraPicks.products,
              services: miraPicks.services,
              response: activeVaultData,
              pillar: currentPillar,
              ...(activeVaultData || {})
            }}
            userMessage={vaultUserMessage}
            pet={pet}
            pillar={currentPillar}
            sessionId={sessionId}
            member={user}
            onVaultSent={(result) => {
              console.log('[VAULT] Sent to Concierge®:', result);
              if (result.success) {
                setMessages(prev => [...prev, {
                  type: 'mira',
                  content: `✨ Your picks have been sent to your Pet Concierge®! They'll get back to you shortly.`,
                  timestamp: new Date().toISOString(),
                  isVaultConfirmation: true
                }]);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MiraDemoBackupPage;


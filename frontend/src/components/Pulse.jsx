/**
 * PULSE - Voice Intent Accelerator
 * 
 * Pulse is NOT the core intelligence. That's Mira.
 * Pulse is the fast voice capture layer that:
 * - Captures voice input quickly
 * - Structures user intent
 * - Hands off to Mira for reasoning
 * 
 * ICON: ⚡ (lightning bolt - speed & energy)
 * COLOR: Electric blue/cyan gradient
 * 
 * All outputs are structured intents designed to speed up Mira's reasoning.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  Mic, MicOff, Volume2, VolumeX, X, Zap, 
  ShoppingCart, Calendar, Heart, HelpCircle, Loader2,
  Stethoscope, Gift, PawPrint, MessageCircle, Send, Activity
} from 'lucide-react';

// Pulse voice settings - quick, responsive
const PULSE_VOICE_CONFIG = {
  rate: 0.95,  // Slightly faster than Mira
  pitch: 1.0,
  volume: 0.9
};

// Pulse opening - personalized with pet name (set dynamically)
// Default fallback if no pet name available
const PULSE_OPENING_DEFAULT = "Speak or type. Pulse gets things moving.";

// Max voice response time in seconds
const MAX_VOICE_SECONDS = 8; // Shorter than Mira - Pulse is quick

// Command patterns - Pulse captures intent, Mira reasons
// COMPREHENSIVE PET PARENT COMMAND ENCYCLOPEDIA
const COMMAND_PATTERNS = [
  // ============================================
  // 🚨 HEALTH ESCALATION - ALWAYS FIRST (highest priority)
  // ============================================
  {
    patterns: ['sick', 'vomiting', 'diarrhea', 'not eating', 'pain', 'bleeding', 'seizure', 'breathing', 'emergency', 'hurt', 'injured', 'collapsed', 'lethargic', 'fever', 'shaking', 'trembling', 'swelling', 'limping', 'paralysis', 'unconscious', 'choking', 'poisoned', 'toxic', 'ate chocolate', 'ate grapes', 'ate onion', 'bloated', 'stomach twisted'],
    intent: 'health_escalation',
    response: (petName) => `I can hear you're worried about ${petName}, and that's completely understandable. I can't assess this medically, but our Care Concierge can help you right now. Let me connect you.`,
    action: 'navigate',
    path: '/care?urgent=true',
    escalation: true
  },
  {
    patterns: ['medication', 'medicine', 'dose', 'dosage', 'tablet', 'treatment', 'antibiotic', 'steroid', 'pain killer', 'deworming', 'flea treatment', 'tick medicine'],
    intent: 'medication_escalation',
    response: (petName) => `For any medication questions about ${petName}, it's safest to speak with a vet or our Care Concierge. I want to make sure you get accurate guidance.`,
    action: 'navigate',
    path: '/care',
    escalation: true
  },
  
  // ============================================
  // 🛒 SHOPPING & TREATS
  // ============================================
  {
    patterns: ['order', 'buy', 'get', 'treats', 'favorite', 'snack', 'biscuit', 'chew', 'dental chew'],
    intent: 'order_treats',
    response: (petName) => `Ooh, treats for ${petName}! Great choice. ${petName} deserves something yummy. Let me show you the best options!`,
    action: 'navigate',
    path: '/shop?category=treats'
  },
  {
    patterns: ['food', 'kibble', 'dry food', 'wet food', 'meal', 'diet', 'nutrition', 'feeding'],
    intent: 'order_food',
    response: (petName) => `Time to stock up on food for ${petName}! Good nutrition is key. Let me show you quality options that ${petName} will love.`,
    action: 'navigate',
    path: '/shop?category=food'
  },
  {
    patterns: ['toy', 'toys', 'play', 'ball', 'rope', 'squeaky', 'plush', 'chew toy'],
    intent: 'order_toys',
    response: (petName) => `Playtime for ${petName}! A good toy keeps them happy and entertained. Let me show you some favorites.`,
    action: 'navigate',
    path: '/shop?category=toys'
  },
  {
    patterns: ['bed', 'mattress', 'blanket', 'cushion', 'crate', 'carrier', 'kennel'],
    intent: 'order_bedding',
    response: (petName) => `A cozy spot for ${petName} to rest! Let me show you our bedding options.`,
    action: 'navigate',
    path: '/shop?category=bedding'
  },
  {
    patterns: ['collar', 'leash', 'harness', 'tag', 'id tag', 'muzzle'],
    intent: 'order_accessories',
    response: (petName) => `Looking for walking gear for ${petName}? Let me show you our collection.`,
    action: 'navigate',
    path: '/shop?category=accessories'
  },
  {
    patterns: ['bowl', 'feeder', 'water bowl', 'fountain', 'slow feeder'],
    intent: 'order_feeding',
    response: (petName) => `Feeding essentials for ${petName}! Here are our options.`,
    action: 'navigate',
    path: '/shop?category=feeding'
  },
  {
    patterns: ['shampoo', 'conditioner', 'brush', 'nail clipper', 'ear cleaner', 'grooming kit'],
    intent: 'order_grooming_products',
    response: (petName) => `Grooming supplies for ${petName}! Let me show you what we have.`,
    action: 'navigate',
    path: '/shop?category=grooming'
  },
  {
    patterns: ['reorder', 're-order', 'order again', 'same order', 'repeat order', 'last order'],
    intent: 'reorder',
    response: (petName) => `Let me check ${petName}'s previous orders so you can quickly reorder.`,
    action: 'navigate',
    path: '/dashboard?tab=orders'
  },
  {
    patterns: ['cart', 'checkout', 'basket', 'pay', 'payment'],
    intent: 'checkout',
    response: (petName) => `Ready to checkout? Let me take you to your cart.`,
    action: 'navigate',
    path: '/checkout'
  },
  {
    patterns: ['wishlist', 'saved', 'favorites', 'save for later'],
    intent: 'wishlist',
    response: (petName) => `Let me show you ${petName}'s wishlist!`,
    action: 'navigate',
    path: '/wishlist'
  },
  
  // ============================================
  // 💈 GROOMING & SPA
  // ============================================
  {
    patterns: ['groom', 'grooming', 'haircut', 'bath', 'spa', 'fur', 'coat', 'trim'],
    intent: 'book_grooming',
    response: (petName) => `A grooming session for ${petName}! Let me show you our trusted grooming partners.`,
    action: 'navigate',
    path: '/care?type=grooming'
  },
  {
    patterns: ['nail', 'nails', 'paw', 'paws', 'pedicure', 'nail trim'],
    intent: 'nail_care',
    response: (petName) => `Time for ${petName}'s nail care? Our groomers can help with that.`,
    action: 'navigate',
    path: '/care?type=grooming'
  },
  {
    patterns: ['shedding', 'hair fall', 'fur falling', 'losing hair', 'bald patch'],
    intent: 'shedding_help',
    response: (petName) => `Shedding can be normal, but excessive hair loss might need a vet check. Meanwhile, regular grooming helps! Want to book a session for ${petName}?`,
    action: 'navigate',
    path: '/care?type=grooming'
  },
  
  // ============================================
  // 🏥 HEALTH & VET
  // ============================================
  {
    patterns: ['vaccination', 'vaccine', 'next shot', 'due', 'vet visit', 'immunization', 'booster'],
    intent: 'check_vaccination',
    response: (petName, data) => {
      if (data?.nextVaccination) {
        return `${petName}'s next vaccination is coming up on ${data.nextVaccination}. Would you like me to help you prepare?`;
      }
      return `I don't have ${petName}'s vaccination schedule yet. Our Care team can help you set this up.`;
    },
    action: 'navigate',
    path: '/pet/{petId}?tab=health'
  },
  {
    patterns: ['vet', 'veterinarian', 'doctor', 'clinic', 'hospital', 'checkup', 'check up', 'health check'],
    intent: 'find_vet',
    response: (petName) => `Looking for a vet for ${petName}? Our Care Concierge can connect you with trusted veterinarians.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['tick', 'flea', 'parasite', 'worm', 'deworming', 'itching', 'scratching'],
    intent: 'parasite_help',
    response: (petName) => `Parasites can be uncomfortable for ${petName}. Our Care team can recommend the right treatment. Let me connect you.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['allergy', 'allergic', 'skin problem', 'rash', 'hot spot', 'red skin'],
    intent: 'allergy_help',
    response: (petName) => `Skin issues can have many causes. For ${petName}'s comfort, it's best to consult with our Care Concierge or a vet.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['weight', 'overweight', 'underweight', 'fat', 'thin', 'obese', 'diet plan'],
    intent: 'weight_management',
    response: (petName) => `Managing ${petName}'s weight is important for health! Our Care team can help with a diet plan.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['spay', 'neuter', 'sterilize', 'castrate', 'fix'],
    intent: 'sterilization',
    response: (petName) => `Thinking about spaying/neutering ${petName}? Our Care Concierge can guide you through the process and connect you with trusted vets.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['teeth', 'dental', 'mouth', 'bad breath', 'tooth', 'gum', 'tartar'],
    intent: 'dental_care',
    response: (petName) => `Dental health is so important for ${petName}! Our Care team can recommend dental care options.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['ear', 'ears', 'ear infection', 'ear cleaning', 'head shaking'],
    intent: 'ear_care',
    response: (petName) => `Ear issues can be uncomfortable. Let me connect you with our Care team to help ${petName}.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['eye', 'eyes', 'eye discharge', 'red eye', 'watery eye', 'cloudy eye'],
    intent: 'eye_care',
    response: (petName) => `Eye problems need prompt attention. Let me connect you with our Care team for ${petName}.`,
    action: 'navigate',
    path: '/care'
  },
  
  // ============================================
  // 🎂 CELEBRATIONS
  // ============================================
  {
    patterns: ['birthday', 'celebration', 'party', 'cake', 'bday', 'birth day', 'gotcha day', 'adoption day'],
    intent: 'birthday',
    response: (petName) => `How exciting! Let's make ${petName}'s celebration special. What kind of celebration are you planning?`,
    action: 'navigate',
    path: '/celebrate'
  },
  {
    patterns: ['gift', 'present', 'surprise', 'treat box', 'gift box'],
    intent: 'gift',
    response: (petName) => `A special gift for ${petName}! Let me show you our celebration options.`,
    action: 'navigate',
    path: '/celebrate'
  },
  
  // ============================================
  // 🏨 BOARDING & DAYCARE
  // ============================================
  {
    patterns: ['boarding', 'board', 'kennel', 'stay overnight', 'pet hotel', 'hostel'],
    intent: 'boarding',
    response: (petName) => `Looking for boarding for ${petName}? Let me show you our trusted partners.`,
    action: 'navigate',
    path: '/stay'
  },
  {
    patterns: ['daycare', 'day care', 'creche', 'drop off', 'pet sitting', 'dog sitting'],
    intent: 'daycare',
    response: (petName) => `Need daycare for ${petName}? We have great options!`,
    action: 'navigate',
    path: '/stay?type=daycare'
  },
  {
    patterns: ['pet sitter', 'sitter', 'home visit', 'someone to watch', 'house sitting'],
    intent: 'pet_sitter',
    response: (petName) => `A pet sitter for ${petName}! Our Stay pillar has trusted options.`,
    action: 'navigate',
    path: '/stay'
  },
  
  // ============================================
  // ✈️ TRAVEL
  // ============================================
  {
    patterns: ['travel', 'trip', 'vacation', 'holiday', 'travelling with', 'road trip'],
    intent: 'travel_planning',
    response: (petName) => `Planning to travel with ${petName}? Let me help you prepare!`,
    action: 'navigate',
    path: '/travel'
  },
  {
    patterns: ['pet friendly', 'dog friendly', 'allows dogs', 'allows pets', 'pet allowed'],
    intent: 'pet_friendly',
    response: (petName) => `Looking for pet-friendly places? Our Travel pillar has everything you need!`,
    action: 'navigate',
    path: '/travel'
  },
  {
    patterns: ['flight', 'flying', 'airplane', 'airline', 'air travel'],
    intent: 'air_travel',
    response: (petName) => `Flying with ${petName}? Our Travel Concierge can help with all the requirements and documentation.`,
    action: 'navigate',
    path: '/travel?type=air'
  },
  {
    patterns: ['train', 'railway', 'rail travel'],
    intent: 'train_travel',
    response: (petName) => `Taking ${petName} on a train? Let me show you the requirements and options.`,
    action: 'navigate',
    path: '/travel?type=train'
  },
  {
    patterns: ['cab', 'taxi', 'uber', 'ola', 'car ride'],
    intent: 'cab_travel',
    response: (petName) => `Need a pet-friendly cab for ${petName}? Let me help you find one!`,
    action: 'navigate',
    path: '/travel?type=cab'
  },
  {
    patterns: ['documents', 'papers', 'certificate', 'health certificate', 'travel documents'],
    intent: 'travel_documents',
    response: (petName) => `Travel documentation for ${petName}? Our Paperwork pillar can help you get everything ready.`,
    action: 'navigate',
    path: '/paperwork'
  },
  
  // ============================================
  // 🍽️ DINING
  // ============================================
  {
    patterns: ['restaurant', 'cafe', 'eat out', 'dining', 'brunch', 'lunch', 'dinner out', 'pet cafe'],
    intent: 'dining',
    response: (petName) => `Looking for a pet-friendly place to dine with ${petName}? Let me show you some options!`,
    action: 'navigate',
    path: '/dine'
  },
  
  // ============================================
  // 🎾 ACTIVITIES & FITNESS
  // ============================================
  {
    patterns: ['walk', 'walking', 'walker', 'dog walker', 'exercise'],
    intent: 'walking',
    response: (petName) => `Looking for walking services for ${petName}? Our Fit pillar has great options!`,
    action: 'navigate',
    path: '/fit'
  },
  {
    patterns: ['training', 'trainer', 'obedience', 'behavior', 'puppy training', 'basic commands'],
    intent: 'training',
    response: (petName) => `Training for ${petName}? Great idea! Let me show you our trusted trainers.`,
    action: 'navigate',
    path: '/fit?type=training'
  },
  {
    patterns: ['swimming', 'swim', 'pool', 'hydrotherapy'],
    intent: 'swimming',
    response: (petName) => `Swimming for ${petName}? It's great exercise! Let me find options near you.`,
    action: 'navigate',
    path: '/fit?type=swimming'
  },
  {
    patterns: ['park', 'dog park', 'play area', 'off leash', 'play date'],
    intent: 'parks',
    response: (petName) => `Looking for a place for ${petName} to play? Let me show you nearby options!`,
    action: 'navigate',
    path: '/enjoy'
  },
  
  // ============================================
  // 📋 PET PROFILE & SOUL SCORE
  // ============================================
  {
    patterns: ['soul score', 'profile', 'score', 'completion', 'pet profile', 'my pet', 'pet details'],
    intent: 'soul_score',
    response: (petName, data) => {
      const score = data?.soulScore || 0;
      if (score >= 90) return `${petName}'s Soul Score is ${score}%. That's wonderful - we know ${petName} really well now!`;
      if (score >= 50) return `${petName}'s Soul Score is ${score}%. We're getting to know ${petName} better!`;
      return `${petName}'s Soul Score is ${score}%. Let's answer some questions to help us understand ${petName} better.`;
    },
    action: 'navigate',
    path: '/pet/{petId}'
  },
  {
    patterns: ['add pet', 'new pet', 'register pet', 'another pet', 'second dog'],
    intent: 'add_pet',
    response: (petName) => `Adding a new furry family member? Let me help you get them registered!`,
    action: 'navigate',
    path: '/my-pets'
  },
  {
    patterns: ['update', 'edit', 'change', 'modify', 'update profile', 'edit profile'],
    intent: 'edit_profile',
    response: (petName) => `Want to update ${petName}'s profile? Let me take you there.`,
    action: 'navigate',
    path: '/pet/{petId}'
  },
  {
    patterns: ['photo', 'picture', 'image', 'upload photo', 'change photo'],
    intent: 'update_photo',
    response: (petName) => `Want to update ${petName}'s photo? Let me take you to the profile.`,
    action: 'navigate',
    path: '/pet/{petId}'
  },
  {
    patterns: ['breed', 'what breed', 'breed info', 'breed characteristics'],
    intent: 'breed_info',
    response: (petName, data) => {
      if (data?.breed) {
        return `${petName} is a ${data.breed}! Each breed has unique traits. Would you like breed-specific tips?`;
      }
      return `What's ${petName}'s breed? Knowing this helps me give better recommendations!`;
    }
  },
  {
    patterns: ['age', 'how old', 'birthday', 'born', 'years old', 'months old'],
    intent: 'age_info',
    response: (petName, data) => {
      if (data?.age) {
        return `${petName} is ${data.age}! Different life stages need different care. Want some age-specific tips?`;
      }
      return `How old is ${petName}? This helps me personalize recommendations!`;
    }
  },
  
  // ============================================
  // 📱 ACCOUNT & SETTINGS
  // ============================================
  {
    patterns: ['account', 'my account', 'profile settings', 'settings', 'preferences'],
    intent: 'settings',
    response: (petName) => `Let me take you to your account settings.`,
    action: 'navigate',
    path: '/dashboard?tab=settings'
  },
  {
    patterns: ['orders', 'my orders', 'order history', 'past orders', 'order status'],
    intent: 'orders',
    response: (petName) => `Let me show you your order history.`,
    action: 'navigate',
    path: '/dashboard?tab=orders'
  },
  {
    patterns: ['address', 'delivery address', 'change address', 'add address'],
    intent: 'address',
    response: (petName) => `Let me take you to manage your addresses.`,
    action: 'navigate',
    path: '/dashboard?tab=settings'
  },
  {
    patterns: ['points', 'paw points', 'rewards', 'loyalty', 'redeem'],
    intent: 'rewards',
    response: (petName) => `Let me show you your Paw Points and rewards!`,
    action: 'navigate',
    path: '/dashboard'
  },
  {
    patterns: ['notifications', 'alerts', 'notify', 'reminders'],
    intent: 'notifications',
    response: (petName) => `Managing your notifications? Let me take you to settings.`,
    action: 'navigate',
    path: '/dashboard?tab=settings'
  },
  
  // ============================================
  // 🔍 RECOMMENDATIONS & DISCOVERY
  // ============================================
  {
    patterns: ['recommend', 'suggestion', 'picks', 'show me', 'what should', 'best for'],
    intent: 'recommendations',
    response: (petName) => `Based on what I know about ${petName}, here are some options. Want me to show you?`,
    action: 'navigate',
    path: '/shop'
  },
  {
    patterns: ['new', "what's new", 'latest', 'arrivals', 'new products'],
    intent: 'new_arrivals',
    response: (petName) => `Let me show you what's new for ${petName}!`,
    action: 'navigate',
    path: '/shop?sort=newest'
  },
  {
    patterns: ['sale', 'discount', 'offer', 'deal', 'cheap', 'affordable'],
    intent: 'deals',
    response: (petName) => `Looking for deals? Let me show you current offers!`,
    action: 'navigate',
    path: '/shop?filter=sale'
  },
  {
    patterns: ['popular', 'best seller', 'trending', 'top rated', 'most bought'],
    intent: 'popular',
    response: (petName) => `Let me show you what other pet parents love!`,
    action: 'navigate',
    path: '/shop?sort=popular'
  },
  
  // ============================================
  // 📚 LEARNING & INFORMATION
  // ============================================
  {
    patterns: ['learn', 'how to', 'guide', 'tips', 'advice', 'information'],
    intent: 'learn',
    response: (petName) => `I'd love to help you learn more about caring for ${petName}! What topic interests you?`
  },
  {
    patterns: ['puppy', 'new dog', 'first dog', 'just got', 'adopted recently'],
    intent: 'new_pet_parent',
    response: (petName) => `Congratulations on ${petName}! Being a new pet parent is exciting. Let me guide you through the essentials.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['senior', 'old dog', 'aging', 'elderly', 'geriatric'],
    intent: 'senior_care',
    response: (petName) => `Caring for a senior pet like ${petName} requires special attention. Our Care team can help with age-appropriate recommendations.`,
    action: 'navigate',
    path: '/care'
  },
  
  // ============================================
  // 💔 SENSITIVE TOPICS
  // ============================================
  {
    patterns: ['farewell', 'end of life', 'passing', 'cremation', 'memorial', 'euthanasia', 'put to sleep', 'dying', 'lost my pet'],
    intent: 'farewell',
    response: (petName) => `I'm so sorry you're going through this. Our Farewell pillar is here to support you with compassion and care during this difficult time.`,
    action: 'navigate',
    path: '/farewell'
  },
  {
    patterns: ['adopt', 'adoption', 'rescue', 'shelter', 'foster', 'looking for dog'],
    intent: 'adoption',
    response: (petName) => `Thinking about adoption? That's wonderful! Let me show you pets looking for their forever home.`,
    action: 'navigate',
    path: '/adopt'
  },
  {
    patterns: ['lost', 'missing', 'runaway', 'escaped', 'find my dog', 'lost dog'],
    intent: 'lost_pet',
    response: (petName) => `Oh no, I'm so sorry to hear that. Let me connect you with our Care Concierge immediately to help.`,
    action: 'navigate',
    path: '/care?urgent=true'
  },
  
  // ============================================
  // 🤝 SUPPORT & HELP
  // ============================================
  {
    patterns: ['help', 'what can you do', 'commands', 'how do i', 'where is'],
    intent: 'help',
    response: (petName) => `I'm here to help you with ${petName}'s everyday needs - treats, grooming, celebrations, travel, boarding, and more. For health concerns, our Care Concierge is your best support. Just ask me anything!`
  },
  {
    patterns: ['contact', 'call', 'phone', 'customer service', 'support', 'talk to human', 'real person'],
    intent: 'contact_support',
    response: (petName) => `I'll connect you with our Care Concierge right away. They're here to help!`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['complaint', 'problem', 'issue', 'not working', 'bug', 'error'],
    intent: 'complaint',
    response: (petName) => `I'm sorry you're having trouble. Let me connect you with our team to resolve this.`,
    action: 'navigate',
    path: '/care'
  },
  {
    patterns: ['refund', 'return', 'cancel order', 'wrong order', 'damaged'],
    intent: 'refund',
    response: (petName) => `I understand you need help with an order issue. Let me connect you with our team.`,
    action: 'navigate',
    path: '/dashboard?tab=orders'
  },
  
  // ============================================
  // 🗣️ SOCIAL RESPONSES
  // ============================================
  {
    patterns: ['hello', 'hi', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening'],
    intent: 'greeting',
    response: (petName) => `Hello! How's ${petName} doing? What can I help you with today?`
  },
  {
    patterns: ['thank', 'thanks', 'awesome', 'great', 'perfect', 'amazing'],
    intent: 'thanks',
    response: (petName) => `You're welcome! Looking after ${petName} is what I'm here for.`
  },
  {
    patterns: ['bye', 'goodbye', 'see you', 'later', 'talk later'],
    intent: 'goodbye',
    response: (petName) => `Goodbye for now! Give ${petName} a gentle pat from me.`
  },
  {
    patterns: ['good boy', 'good girl', 'good dog', 'cute', 'adorable', 'love my dog'],
    intent: 'pet_love',
    response: (petName) => `Aww, ${petName} is lucky to have such a loving pet parent! Is there anything I can help you with today?`
  },
  
  // ============================================
  // 🎤 VOICE SPECIFIC COMMANDS
  // ============================================
  {
    patterns: ['stop', 'quiet', 'silence', 'mute', 'stop talking'],
    intent: 'mute',
    response: (petName) => `Okay, I'll stay quiet. Tap the mic when you need me!`
  },
  {
    patterns: ['repeat', 'say again', 'what did you say', "didn't hear"],
    intent: 'repeat',
    response: (petName) => `Sure! I said... Actually, you can see our conversation above. Is there something specific I can help with?`
  },
  {
    patterns: ['speak', 'talk', 'unmute', 'voice on', 'turn on voice'],
    intent: 'unmute',
    response: (petName) => `I'm here and ready to help ${petName}! What do you need?`
  }
];

const findCommand = (text) => {
  const lower = text.toLowerCase();
  for (const cmd of COMMAND_PATTERNS) {
    if (cmd.patterns.some(p => lower.includes(p))) return cmd;
  }
  return null;
};

const getFallbackResponse = (petName) => {
  const name = petName || 'your pet';
  const responses = [
    `Got it! Routing to Mira for ${name}...`,
    `On it! Mira will take care of ${name}'s request.`,
    `Captured! Sending to Mira now for ${name}.`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Main Pulse Component - Voice Intent Accelerator
// PURPOSE: Fast capture, intent structuring, handoff to Mira
const Pulse = ({
  isOpen,
  onClose, 
  petName = 'your pup', 
  petId,
  petData = {},
  onNavigate,
  voicePreference = 'text',
  currentPillar = null,
  startWithVoice = false
}) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(voicePreference === 'text');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(true);
  const [hasShownOpening, setHasShownOpening] = useState(false);
  const [memories, setMemories] = useState([]);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const API_URL = process.env.REACT_APP_BACKEND_URL;
  
  // Fetch relevant memories when Pulse opens
  useEffect(() => {
    const fetchMemories = async () => {
      if (!isOpen || !petId) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch(`${API_URL}/api/mira/memories?pet_id=${petId}&limit=3`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.memories && data.memories.length > 0) {
            setMemories(data.memories);
          }
        }
      } catch (err) {
        console.log('Could not fetch memories:', err);
      }
    };
    
    fetchMemories();
  }, [isOpen, petId, API_URL]);
  
  // Show personalized opening line with memory recall when first opened (TEXT only, no voice)
  useEffect(() => {
    if (isOpen && !hasShownOpening && messages.length === 0) {
      // PULSE OPENING - Personalized with pet name
      const displayName = petName && petName !== 'your pup' ? petName : 'your pet';
      const personalizedOpening = `Speak or type. Pulse gets things moving for ${displayName}.`;
      
      // Add memory recall if we have relevant memories
      let fullOpening = personalizedOpening;
      if (memories.length > 0) {
        const recentMemory = memories[0];
        if (recentMemory.content) {
          fullOpening += `\n\n🧠 Mira remembers: "${recentMemory.content}"`;
        }
      }
      
      setMessages([{
        role: 'pulse',
        text: fullOpening,
        timestamp: new Date()
      }]);
      setHasShownOpening(true);
      
      // If startWithVoice, auto-start listening
      if (startWithVoice && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (e) {
            console.log('Could not auto-start listening');
          }
        }, 500);
      }
    }
  }, [isOpen, hasShownOpening, messages.length, petName, memories, startWithVoice]);
  
  // TTS function - Pulse is quick, max 8 seconds
  const speakWithElevenLabs = useCallback(async (text) => {
    if (isMuted) return;
    
    // Enforce max length - Pulse is quick
    const words = text.split(' ');
    const maxWords = 25; // ~8 seconds at normal speech rate
    const truncatedText = words.length > maxWords 
      ? words.slice(0, maxWords).join(' ') + '...'
      : text;
    
    try {
      const response = await fetch(`${API_URL}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: truncatedText })
      });
      
      if (!response.ok) {
        throw new Error('ElevenLabs TTS failed');
      }
      
      const data = await response.json();
      
      // Create audio from base64
      if (data.audio_base64) {
        const audioData = `data:audio/mpeg;base64,${data.audio_base64}`;
        if (audioRef.current) {
          audioRef.current.pause();
        }
        audioRef.current = new Audio(audioData);
        audioRef.current.onplay = () => setIsSpeaking(true);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.onerror = () => setIsSpeaking(false);
        await audioRef.current.play();
        return true;
      }
    } catch (err) {
      console.log('ElevenLabs TTS unavailable, falling back to Web Speech API');
      setUseElevenLabs(false);
      return false;
    }
    return false;
  }, [API_URL, isMuted]);
  
  // Remove emojis from text for natural speech
  const cleanTextForSpeech = useCallback((text) => {
    // Remove common emojis
    let cleaned = text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Symbols & pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport & map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
      .replace(/🐾|🐕|🐶|🎂|🎉|❤️|💜|✨|🌟|⭐|😊|💪|🏆|🔥|💯|🎁|🦴|💊|🛒|📦/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Fix "Mira" pronunciation to "Meera"
    cleaned = cleaned.replace(/\bMira\b/gi, 'Meera');
    
    return cleaned;
  }, []);
  
  // Web Speech API with Indian English voice preference
  const speakWithWebSpeech = useCallback((text) => {
    if (!synthRef.current || isMuted) return;
    
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = PULSE_VOICE_CONFIG.rate;
    utterance.pitch = PULSE_VOICE_CONFIG.pitch;
    
    const voices = synthRef.current.getVoices();
    
    // Priority order for voice selection (best Indian female voices)
    const voicePreference = [
      // Google Indian English (best quality)
      v => v.name.includes('Google') && v.lang === 'en-IN',
      // Any Indian English voice
      v => v.lang === 'en-IN' || v.lang === 'en_IN',
      // Hindi voices (natural Indian accent)
      v => v.lang.startsWith('hi'),
      // Microsoft Indian voices
      v => v.name.includes('Neerja') || v.name.includes('Heera'),
      // Google UK female (similar intonation)
      v => v.name.includes('Google UK English Female'),
      // Any female voice
      v => v.name.toLowerCase().includes('female') || 
           v.name.includes('Samantha') || 
           v.name.includes('Zira') ||
           v.name.includes('Karen')
    ];
    
    for (const preference of voicePreference) {
      const voice = voices.find(preference);
      if (voice) {
        utterance.voice = voice;
        break;
      }
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [isMuted, cleanTextForSpeech]);
  
  // Main speak function - tries ElevenLabs first, then falls back
  const speak = useCallback(async (text) => {
    if (isMuted) return;
    
    if (useElevenLabs) {
      const success = await speakWithElevenLabs(text);
      if (!success) {
        speakWithWebSpeech(text);
      }
    } else {
      speakWithWebSpeech(text);
    }
  }, [isMuted, useElevenLabs, speakWithElevenLabs, speakWithWebSpeech]);
  
  const addPulseMessage = useCallback((text) => {
    setMessages(prev => [...prev, { role: 'pulse', text, timestamp: new Date() }]);
    if (!isMuted) speak(text);
  }, [isMuted, speak]);
  
  // Session ID for tracking conversations
  const sessionIdRef = useRef(`pulse-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  const handleSend = useCallback(async (text = inputText) => {
    if (!text.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text, timestamp: new Date() }]);
    setInputText('');
    setIsProcessing(true);
    
    // ALWAYS create a ticket in the service desk via Mira API
    // This ensures unified inbox visibility for ALL interactions
    const createTicketPromise = fetch(`${API_URL}/api/mira/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('token') && { 'Authorization': `Bearer ${localStorage.getItem('token')}` })
      },
      body: JSON.stringify({
        message: text,
        session_id: sessionIdRef.current,
        current_pillar: currentPillar,
        selected_pet_id: petId,
        source: 'pulse_voice'
      })
    }).catch(err => console.log('Ticket creation background:', err));
    
    // PULSE INTENT MATCHING - Fast local processing for instant responses
    const command = findCommand(text);
    
    if (command) {
      // Found a matching command - use Pulse's fast local processing for instant UX
      const commandData = { 
        soulScore: petData?.overall_score || 0,
        breed: petData?.breed,
        age: petData?.age,
        nextVaccination: petData?.next_vaccination
      };
      
      const pulseResponse = typeof command.response === 'function' 
        ? command.response(petName, commandData)
        : command.response;
      
      addPulseMessage(pulseResponse);
      
      // Handle navigation actions
      if (command.action === 'navigate' && command.path && onNavigate) {
        const finalPath = command.path.replace('{petId}', petId || '');
        setTimeout(() => {
          onNavigate(finalPath);
          onClose();
        }, 1500);
      }
      
      // Ensure ticket is created before finishing
      await createTicketPromise;
      setIsProcessing(false);
      return;
    }
    
    // No local command match - use Mira API response for conversational/complex queries
    try {
      const response = await createTicketPromise;
      
      if (response && response.ok) {
        const data = await response.json();
        const miraResponse = data.response || data.message || getFallbackResponse(petName);
        addPulseMessage(`🧠 Mira says: ${miraResponse}`);
        
        // Handle navigation if backend suggests it
        if (data.action?.type === 'navigate' && data.action?.path && onNavigate) {
          setTimeout(() => {
            onNavigate(data.action.path);
            onClose();
          }, 2000);
        }
      } else {
        addPulseMessage(getFallbackResponse(petName));
      }
    } catch (err) {
      console.error('Pulse → Mira error:', err);
      addPulseMessage(getFallbackResponse(petName));
    }
    
    setIsProcessing(false);
  }, [inputText, petName, petData, petId, currentPillar, API_URL, addPulseMessage, onNavigate, onClose]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setInputText(text);
      handleSend(text);
    };
    
    recognition.onerror = (e) => {
      console.error('Speech error:', e.error);
      setIsListening(false);
      if (e.error === 'no-speech') {
        addPulseMessage("⚡ Didn't catch that. Tap to try again!");
      }
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    
    return () => recognition.abort();
  }, [handleSend, addPulseMessage]);
  
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      addPulseMessage("Voice isn't available in this browser. Type your message instead!");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening, addPulseMessage]);
  
  // Quick commands - personalized with pet name
  const getQuickCommands = () => {
    const name = petName && petName !== 'your pup' ? petName : null;
    return [
      { 
        id: 'treats', 
        label: name ? `🦴 Treats for ${name}` : '🦴 Order Treats',
        command: name ? `Order treats for ${name}` : 'Order treats for my pet',
        icon: '🦴'
      },
      { 
        id: 'grooming', 
        label: name ? `✂️ Groom ${name}` : '✂️ Book Grooming',
        command: name ? `Book grooming for ${name}` : 'Book grooming for my pet',
        icon: '✂️'
      },
      { 
        id: 'vet', 
        label: name ? `🏥 Vet for ${name}` : '🏥 Find Vet',
        command: name ? `Find a vet for ${name}` : 'Find a vet for my pet',
        icon: '🏥'
      },
      { 
        id: 'food', 
        label: name ? `🍖 Food for ${name}` : '🍖 Order Food',
        command: name ? `Order food for ${name}` : 'Order food for my pet',
        icon: '🍖'
      },
      { 
        id: 'birthday', 
        label: name ? `🎂 ${name}'s Birthday` : '🎂 Birthday Cake',
        command: name ? `Plan ${name}'s birthday celebration` : 'Plan birthday celebration',
        icon: '🎂'
      },
      { 
        id: 'boarding', 
        label: name ? `🏠 Board ${name}` : '🏠 Pet Boarding',
        command: name ? `Find boarding for ${name}` : 'Find pet boarding',
        icon: '🏠'
      }
    ];
  };

  const handleQuickCommand = (command) => {
    setInputText(command);
    // Auto-send after a brief moment so user sees what's being sent
    setTimeout(() => {
      handleSend(command);
    }, 300);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <Card className="w-full sm:max-w-md h-[85vh] sm:h-[600px] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" data-testid="pulse-voice-assistant">
        {/* PULSE Header - Electric Cyan/Blue gradient */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 p-4 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm ${isListening ? 'animate-pulse' : ''}`}>
                <Zap className="w-7 h-7 text-yellow-300" />
              </div>
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  Pulse
                  <Activity className="w-4 h-4 text-yellow-300" />
                </h2>
                <p className="text-white/80 text-xs">Voice → Mira</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Flow indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
            <span className="px-2 py-0.5 bg-white/20 rounded-full flex items-center gap-1">
              <Mic className="w-3 h-3" /> Capture
            </span>
            <span className="text-yellow-300">→</span>
            <span className="px-2 py-0.5 bg-white/20 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> Structure
            </span>
            <span className="text-yellow-300">→</span>
            <span className="px-2 py-0.5 bg-purple-400/50 rounded-full">🧠 Mira</span>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-cyan-50/30 to-white">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-md' 
                  : 'bg-white border border-cyan-100 shadow-sm rounded-bl-md'
              }`}>
                {msg.role === 'pulse' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-3 h-3 text-cyan-500" />
                    <span className="text-xs font-medium text-cyan-600">Pulse</span>
                  </div>
                )}
                <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>
                  {msg.text}
                </p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white border border-cyan-100 rounded-2xl rounded-bl-md p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cyan-500 animate-spin" />
                  <span className="text-sm text-gray-500">Creating ticket & routing to Mira...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick Commands - Personalized with pet name */}
        {messages.length <= 1 && (
          <div className="px-4 py-3 bg-gradient-to-r from-cyan-50 to-blue-50 border-t border-cyan-100 flex-shrink-0">
            <p className="text-xs text-cyan-700 font-medium mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Quick actions for {petName || 'your pet'}
            </p>
            <div className="flex flex-wrap gap-2">
              {getQuickCommands().slice(0, 6).map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleQuickCommand(cmd.command)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-cyan-200 rounded-full text-cyan-700 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 transition-all shadow-sm hover:shadow-md active:scale-95"
                  data-testid={`pulse-quick-${cmd.id}`}
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input Area - Clean, focused design */}
        <div className="p-4 border-t bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isListening ? "⚡ Listening..." : "Type or tap mic..."}
                className="w-full px-4 py-2.5 pr-10 rounded-full border border-gray-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 outline-none text-sm"
                disabled={isListening}
              />
              {isListening && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
                </div>
              )}
            </div>
            
            {/* Voice Button - PULSE ICON (Lightning) */}
            <button
              onClick={toggleListening}
              className={`p-3 rounded-full transition-all shadow-lg ${
                isListening 
                  ? 'bg-yellow-400 text-gray-900 animate-pulse scale-110' 
                  : 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white hover:scale-110 hover:shadow-xl'
              }`}
              title={isListening ? 'Stop' : 'Speak'}
              data-testid="pulse-voice-mic-btn"
            >
              {isListening ? <Activity className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
            </button>
            
            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isProcessing}
              className="p-3 bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          
          {/* Pulse hint */}
          {!isListening && !inputText && (
            <p className="text-center text-xs text-gray-400 mt-1">
              ⚡ Tap to speak or type below
            </p>
          )}
          
          {/* Voice Status */}
          {isListening && (
            <p className="text-center text-xs text-cyan-600 mt-2 animate-pulse">
              ⚡ Capturing... Speak now!
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

// Floating button to trigger Pulse
export const PulseButton = ({ onClick, petName }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-20 z-40 w-14 h-14 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-500 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform group"
      title="Pulse - Quick Voice"
      data-testid="pulse-button"
    >
      <Zap className="w-6 h-6" />
      
      {/* Tooltip */}
      <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        ⚡ Quick Voice → Mira
      </span>
    </button>
  );
};

export default Pulse;

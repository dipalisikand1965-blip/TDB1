/**
 * useChat Hook - Chat Submission Logic
 * =====================================
 * Extracted from MiraDemoPage.jsx handleSubmit function
 * Contains helper functions for:
 * - Input preprocessing (spelling, intelligence)
 * - Mode detection (comfort, emergency, instant)
 * - Step ID detection from Mira's questions
 * - City extraction for travel
 * - Context topic detection
 * 
 * Refactoring Stage 6
 */

import { useCallback } from 'react';
import { API_URL } from '../../utils/api';
import { correctSpelling } from '../../utils/spellCorrect';
import conversationIntelligence from '../../utils/conversationIntelligence';

// ═══════════════════════════════════════════════════════════════════════════════
// MODE DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect Mira's response mode based on user query
 * @param {string} query - User's input query
 * @returns {string} - Mode: 'comfort', 'emergency', 'instant', or 'thinking'
 */
export const detectMiraMode = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Comfort mode - emotional situations
  if (/passed away|rainbow bridge|grief|lost.*dog|lost.*pet|loss|miss.*so much|crying|heartbreak|💔|🌈|farewell|goodbye/.test(lowerQuery)) {
    return 'comfort';
  }
  
  // Emergency mode - urgent health situations
  if (/emergency|urgent|bleeding|vomiting blood|collapse|seizure|not breathing|🚨|accident|hurt|injured/.test(lowerQuery)) {
    return 'emergency';
  }
  
  // Instant mode - product browsing
  if (/show me|find|browse|what.*have|list of|toys|treats|products|catalog/.test(lowerQuery)) {
    return 'instant';
  }
  
  // Default - thinking mode
  return 'thinking';
};

// ═══════════════════════════════════════════════════════════════════════════════
// INPUT PREPROCESSING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Preprocess user input with spelling correction and context enrichment
 * @param {string} inputQuery - Raw user input
 * @param {object} conversationContext - Current conversation context
 * @returns {object} - { processedQuery, corrections, intelligence }
 */
export const preprocessInput = (inputQuery, conversationContext) => {
  // Spelling correction
  const { corrected, corrections, hasCorrections } = correctSpelling(inputQuery);
  let processedQuery = hasCorrections ? corrected : inputQuery;
  
  if (hasCorrections) {
    console.log('[MIRA] Spelling corrected:', corrections);
  }
  
  // Conversation intelligence - detect follow-ups and enrich
  const intelligence = conversationIntelligence.enrichQueryWithContext(processedQuery, conversationContext);
  console.log('[MIRA Intelligence]', {
    isFollowUp: intelligence.followUp.isFollowUp,
    followUpType: intelligence.followUp.type,
    topic: intelligence.topic,
    contextUsed: intelligence.contextUsed
  });
  
  // Resolve references for selection follow-ups
  if (intelligence.followUp.isFollowUp && intelligence.followUp.type === 'select_item') {
    const resolved = conversationIntelligence.resolveReference(processedQuery, conversationContext.lastResults);
    if (resolved?.resolved) {
      console.log('[MIRA] Resolved reference:', resolved.item?.name || resolved.item);
      processedQuery = `${processedQuery} [RESOLVED: ${JSON.stringify(resolved.item)}]`;
    }
  }
  
  // Use enriched query if context was applied
  if (intelligence.contextUsed.length > 0) {
    console.log('[MIRA] Using enriched query:', intelligence.enrichedQuery);
    processedQuery = intelligence.enrichedQuery;
  }
  
  return {
    processedQuery,
    correctedQuery: corrected,
    corrections,
    hasCorrections,
    intelligence
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP ID DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect step ID from Mira's response text
 * Covers all canonical flows: Treats, Grooming, Birthday, Travel
 * @param {string} responseText - Mira's response text
 * @returns {string|null} - Detected step ID or null
 */
export const detectStepId = (responseText) => {
  if (!responseText?.includes('?')) return null;
  
  const lowerText = responseText.toLowerCase();
  
  // ═══════════════════════════════════════════════════════════════
  // TREATS / FOOD FLOW STEPS
  // ═══════════════════════════════════════════════════════════════
  if ((lowerText.includes('everyday') && lowerText.includes('special')) ||
      (lowerText.includes('light treats') && lowerText.includes('special-occasion')) ||
      (lowerText.includes('everyday light') && lowerText.includes('special'))) {
    return 'TREATS_TYPE';
  } 
  if ((lowerText.includes('suggest') && lowerText.includes('treats')) ||
      (lowerText.includes('specific treats') && lowerText.includes('fit')) ||
      lowerText.includes('would you like me to suggest')) {
    return 'TREATS_SUGGEST_OR_ROUTINE';
  }
  if (lowerText.includes('training') && (lowerText.includes('snack') || lowerText.includes('reward'))) {
    return 'TREATS_PURPOSE';
  }
  
  // ═══════════════════════════════════════════════════════════════
  // GROOMING FLOW STEPS
  // ═══════════════════════════════════════════════════════════════
  if ((lowerText.includes('simple trim') && lowerText.includes('full grooming')) ||
      (lowerText.includes('trim') && lowerText.includes('bath')) ||
      (lowerText.includes('tidy') && lowerText.includes('session'))) {
    return 'GROOMING_MODE';
  }
  if ((lowerText.includes('at home') && lowerText.includes('groomer')) ||
      (lowerText.includes('home') && lowerText.includes('salon')) ||
      lowerText.includes('try at home') || lowerText.includes('professional groomer')) {
    return 'GROOMING_LOCATION';
  }
  if ((lowerText.includes('area') && lowerText.includes('weekday')) ||
      (lowerText.includes('location') && lowerText.includes('prefer')) ||
      lowerText.includes('which area') || lowerText.includes('when would')) {
    return 'GROOMING_SCHEDULE';
  }
  if ((lowerText.includes('basic tools') && lowerText.includes('suggestions')) ||
      (lowerText.includes('brush') && lowerText.includes('comb')) ||
      lowerText.includes('minimal set') || lowerText.includes('what tools')) {
    return 'GROOMING_TOOLS';
  }
  if ((lowerText.includes('step-by-step') && lowerText.includes('guide')) ||
      (lowerText.includes('checklist') && lowerText.includes('grooming')) ||
      (lowerText.includes('broken into') && lowerText.includes('brush'))) {
    return 'GROOMING_HOME_GUIDE';
  }
  
  // ═══════════════════════════════════════════════════════════════
  // BIRTHDAY / CELEBRATE FLOW STEPS
  // ═══════════════════════════════════════════════════════════════
  if ((lowerText.includes('active') && lowerText.includes('playful')) || 
      (lowerText.includes('simpler') && lowerText.includes('cosy')) ||
      (lowerText.includes('small') && lowerText.includes('celebration')) ||
      (lowerText.includes('party') && lowerText.includes('others'))) {
    return 'BIRTHDAY_SHAPE';
  } 
  if ((lowerText.includes('food') && (lowerText.includes('play') || lowerText.includes('ritual'))) ||
      (lowerText.includes('cake') && lowerText.includes('toy')) ||
      (lowerText.includes('important') && lowerText.includes('year'))) {
    return 'BIRTHDAY_FOCUS';
  } 
  if ((lowerText.includes('dog cake') && lowerText.includes('smaller treats')) ||
      (lowerText.includes('proper cake') || lowerText.includes('birthday cake')) ||
      (lowerText.includes('centrepiece') && lowerText.includes('treat'))) {
    return 'BIRTHDAY_FOOD_TYPE';
  }
  if ((lowerText.includes('dogs') && lowerText.includes('humans')) ||
      (lowerText.includes('pet-friendly') && lowerText.includes('venue')) ||
      lowerText.includes('how many guests')) {
    return 'BIRTHDAY_PARTY_DETAILS';
  }
  
  // ═══════════════════════════════════════════════════════════════
  // TRAVEL FLOW STEPS
  // ═══════════════════════════════════════════════════════════════
  if ((lowerText.includes('car') && lowerText.includes('flight')) ||
      (lowerText.includes('car') && lowerText.includes('train')) ||
      (lowerText.includes('travel') && lowerText.includes('how'))) {
    return 'TRAVEL_MODE';
  }
  if ((lowerText.includes('where') && lowerText.includes('driving')) ||
      (lowerText.includes('route') || lowerText.includes('destination')) ||
      lowerText.includes('from and to')) {
    return 'TRAVEL_ROUTE';
  }
  if ((lowerText.includes('pet-friendly') && lowerText.includes('stay')) ||
      (lowerText.includes('hotel') && lowerText.includes('homestay')) ||
      lowerText.includes('where to stay')) {
    return 'TRAVEL_STAY';
  }
  if ((lowerText.includes('dates') && lowerText.includes('budget')) ||
      (lowerText.includes('when') && lowerText.includes('flexible')) ||
      lowerText.includes('dates in mind')) {
    return 'TRAVEL_DATES';
  }
  if ((lowerText.includes('pack') && lowerText.includes('trip')) ||
      (lowerText.includes('checklist') && lowerText.includes('tools')) ||
      lowerText.includes('what should i pack')) {
    return 'TRAVEL_PACKING';
  }
  if ((lowerText.includes('within india') && lowerText.includes('international')) ||
      lowerText.includes('domestic') && lowerText.includes('international')) {
    return 'TRAVEL_FLIGHT_TYPE';
  }
  if ((lowerText.includes('boarding') && lowerText.includes('homestay')) ||
      lowerText.includes('leave him') || lowerText.includes('pet sitter')) {
    return 'TRAVEL_BOARDING';
  }
  
  // ═══════════════════════════════════════════════════════════════
  // GENERIC FALLBACK - Generate unique step ID from question
  // ═══════════════════════════════════════════════════════════════
  if (lowerText.includes('?')) {
    const questionMatch = responseText.match(/([^.!?]*\?)/);
    if (questionMatch) {
      const questionText = questionMatch[1].toLowerCase();
      const words = questionText.split(' ').slice(0, 4).join('_').replace(/[^a-z_]/g, '');
      return `STEP_${words.toUpperCase()}`;
    }
  }
  
  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// CITY EXTRACTION FOR TRAVEL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract city name from travel-related query
 * Works for any city worldwide
 * @param {string} query - User's input query
 * @returns {string|null} - Extracted city name or null
 */
export const extractCityFromQuery = (query) => {
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

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT TOPIC DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Detect topic from user query for tray context
 * @param {string} query - User's input query
 * @param {string} petName - Pet's name
 * @returns {object} - { topic, context }
 */
export const detectContextTopic = (query, petName) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('travel') || lowerQuery.includes('trip')) {
    return { topic: 'travel', context: `${petName}'s Journey` };
  }
  if ((lowerQuery.includes('party') || lowerQuery.includes('plan')) && lowerQuery.includes('birthday')) {
    return { topic: 'party_planning', context: `Plan ${petName}'s Party` };
  }
  if (lowerQuery.includes('cake') || lowerQuery.includes('hamper') || lowerQuery.includes('bundle')) {
    return { topic: 'cake_shopping', context: `${petName}'s Celebration Picks` };
  }
  if (lowerQuery.includes('birthday') || lowerQuery.includes('celebration') || lowerQuery.includes('gotcha')) {
    return { topic: 'celebration', context: `${petName}'s Celebration` };
  }
  if (lowerQuery.includes('groom')) {
    return { topic: 'grooming', context: `Grooming for ${petName}` };
  }
  if (lowerQuery.includes('food') || lowerQuery.includes('treat')) {
    return { topic: 'food', context: `${petName}'s Treats & Food` };
  }
  if (lowerQuery.includes('health') || lowerQuery.includes('vet') || lowerQuery.includes('sick')) {
    return { topic: 'health', context: '' };
  }
  if (lowerQuery.includes('scratch') || lowerQuery.includes('skin') || lowerQuery.includes('itch')) {
    return { topic: 'skin', context: '' };
  }
  
  return { topic: 'general', context: `Picks for ${petName}` };
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRAINING VIDEO KEYWORDS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if query has training intent
 * @param {string} query - User's input query
 * @returns {boolean}
 */
export const hasTrainingIntent = (query) => {
  const trainingKeywords = [
    'train', 'training', 'teach', 'learn', 'how to', 
    'puppy', 'behavior', 'obedience', 'trick', 'command', 
    'potty', 'leash', 'bite', 'bark', 'recall'
  ];
  const lowerQuery = query.toLowerCase();
  return trainingKeywords.some(kw => lowerQuery.includes(kw));
};

/**
 * Extract training topic from query for video search
 * @param {string} query - User's input query
 * @returns {string}
 */
export const extractTrainingTopic = (query) => {
  return query.toLowerCase()
    .replace(/how (do i|to|can i)/g, '')
    .replace(/my (dog|puppy|pet)/g, '')
    .replace(/[?!]/g, '')
    .trim();
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRAVEL CONFIRMATION DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if user has confirmed travel request
 * @param {string} query - User's input query
 * @param {number} historyLength - Current conversation history length
 * @param {object} backendData - Backend response data
 * @returns {boolean}
 */
export const shouldFetchTravelData = (query, historyLength, backendData) => {
  const travelConfirmationSignals = [
    'show me hotels', 'find hotels', 'book hotel', 'suggest hotels',
    'show accommodations', 'where to stay', 'hotel options', 'hotel recommendations',
    'yes', 'sounds good', 'go ahead', 'please find', 'help me book'
  ];
  
  const hasConversationHistory = historyLength >= 2;
  const hasTravelConfirmation = travelConfirmationSignals.some(signal => 
    query.toLowerCase().includes(signal)
  );
  
  const backendSaysShowHotels = backendData?.show_travel_results === true || 
    backendData?.response?.message?.toLowerCase().includes('browse these hotels') ||
    backendData?.response?.message?.toLowerCase().includes('here are some pet-friendly');
  
  return (hasConversationHistory && hasTravelConfirmation) || backendSaysShowHotels;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MEANINGFUL TOPICS FOR MEMORY SAVE
// ═══════════════════════════════════════════════════════════════════════════════

export const MEANINGFUL_TOPICS = ['health', 'skin', 'grooming', 'food', 'travel', 'birthday', 'behavior'];

/**
 * Check if topic is worth saving to memory
 * @param {string} topic - Detected topic
 * @returns {boolean}
 */
export const isMeaningfulTopic = (topic) => {
  return MEANINGFUL_TOPICS.includes(topic);
};

// ═══════════════════════════════════════════════════════════════════════════════
// CELEBRATION DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const CELEBRATION_KEYWORDS = ['birthday', 'party', 'celebrate', 'celebration', 'anniversary', 'gotcha day', 'pawty'];

/**
 * Check if query is about celebration
 * @param {string} query - User's input query
 * @returns {boolean}
 */
export const isCelebrationQuery = (query) => {
  const lowerQuery = query.toLowerCase();
  return CELEBRATION_KEYWORDS.some(kw => lowerQuery.includes(kw));
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

const useChat = () => {
  // This hook can be expanded to include the full handleSubmit logic
  // For now, it exports utility functions
  return {
    detectMiraMode,
    preprocessInput,
    detectStepId,
    extractCityFromQuery,
    detectContextTopic,
    hasTrainingIntent,
    extractTrainingTopic,
    shouldFetchTravelData,
    isMeaningfulTopic,
    isCelebrationQuery
  };
};

export default useChat;

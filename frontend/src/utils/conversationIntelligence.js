/**
 * Conversation Intelligence Service
 * Handles context retention, follow-ups, and pronoun resolution
 */

// Follow-up patterns that reference previous context
const FOLLOW_UP_PATTERNS = [
  // Price/budget follow-ups
  { pattern: /(?:what about|any|show me|are there)(?: some| any)? (?:cheaper|budget|affordable|less expensive)/i, type: 'filter_cheaper' },
  { pattern: /(?:what about|any|show me)(?: some| any)? (?:premium|expensive|luxury|high.?end)/i, type: 'filter_expensive' },
  
  // More results
  { pattern: /(?:show|see|get|any) (?:me )?more/i, type: 'show_more' },
  { pattern: /(?:what|any) (?:other|else|alternatives)/i, type: 'show_more' },
  { pattern: /more (?:options|choices|suggestions)/i, type: 'show_more' },
  
  // Filtering
  { pattern: /(?:any|what about)(?: that are| ones)? (?:24.?(?:7|hour)|open now|nearby|closer)/i, type: 'filter_attribute' },
  { pattern: /(?:only|just) (?:show|the) (?:ones|those) (?:that|with|near)/i, type: 'filter_attribute' },
  
  // Selection
  { pattern: /(?:book|select|choose|get|i(?:'ll| will) take) (?:the )?(first|second|third|last|that) (?:one)?/i, type: 'select_item' },
  { pattern: /(?:book|select|choose|get) (?:it|this|that)/i, type: 'select_item' },
  { pattern: /(?:the )?(first|second|third|1st|2nd|3rd|last) one/i, type: 'select_item' },
  { pattern: /(?:yes|yeah|yep|sure),? (?:book|that|this)/i, type: 'confirm_selection' },
  
  // Topic continuation
  { pattern: /(?:what about|how about|and) (?:for )?(food|treats|toys|grooming|training)/i, type: 'related_topic' },
  { pattern: /(?:also|and|plus),? (?:find|show|get|i need)/i, type: 'add_request' },
  
  // Clarification/correction
  { pattern: /(?:no|not that|i meant|actually|sorry),? (?:i meant|i want|i need|looking for)/i, type: 'correction' },
  { pattern: /(?:never ?mind|forget (?:it|that)|let'?s talk about)/i, type: 'topic_change' },
  
  // Location context
  { pattern: /(?:what about|any|show me)(?: in| near| around)? (?:there|that area|nearby)/i, type: 'same_location' },
  { pattern: /(?:near|around|in) (?:there|that|the same)/i, type: 'same_location' },
];

// Entity extraction patterns
const ENTITY_PATTERNS = {
  location: /(?:in|near|around|at) ([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/g,
  time: /(?:today|tomorrow|this week|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
  budget: /(?:under|below|around|about|max|maximum|budget) (?:rs\.?|₹|inr)?\s?(\d+(?:,\d+)?(?:k)?)/gi,
  preference: /(?:prefer|want|need|looking for|must have|should be) ([^,.]+)/gi,
};

// Ordinal to number mapping
const ORDINAL_MAP = {
  'first': 0, '1st': 0, 'one': 0,
  'second': 1, '2nd': 1, 'two': 1,
  'third': 2, '3rd': 2, 'three': 2,
  'fourth': 3, '4th': 3, 'four': 3,
  'fifth': 4, '5th': 4, 'five': 4,
  'last': -1, 'final': -1,
};

/**
 * Detect if message is a follow-up to previous context
 */
export const detectFollowUp = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  
  for (const { pattern, type } of FOLLOW_UP_PATTERNS) {
    const match = lowerMessage.match(pattern);
    if (match) {
      return {
        isFollowUp: true,
        type,
        match: match[0],
        captures: match.slice(1),
      };
    }
  }
  
  // Check for very short messages that likely reference context
  if (lowerMessage.length < 20 && !lowerMessage.includes('find') && !lowerMessage.includes('search')) {
    const shortFollowUps = ['yes', 'no', 'ok', 'sure', 'that one', 'this one', 'more', 'cheaper', 'closer'];
    if (shortFollowUps.some(f => lowerMessage.includes(f))) {
      return {
        isFollowUp: true,
        type: 'short_response',
        match: lowerMessage,
      };
    }
  }
  
  return { isFollowUp: false };
};

/**
 * Extract entities from message
 */
export const extractEntities = (message) => {
  const entities = {
    locations: [],
    times: [],
    budgets: [],
    preferences: [],
  };
  
  // Extract locations
  const locationMatches = message.matchAll(ENTITY_PATTERNS.location);
  for (const match of locationMatches) {
    if (match[1] && !['I', 'My', 'The', 'A', 'An'].includes(match[1])) {
      entities.locations.push(match[1]);
    }
  }
  
  // Extract times
  const timeMatches = message.matchAll(ENTITY_PATTERNS.time);
  for (const match of timeMatches) {
    entities.times.push(match[0].toLowerCase());
  }
  
  // Extract budgets
  const budgetMatches = message.matchAll(ENTITY_PATTERNS.budget);
  for (const match of budgetMatches) {
    let amount = match[1].replace(/,/g, '');
    if (amount.toLowerCase().endsWith('k')) {
      amount = parseInt(amount) * 1000;
    }
    entities.budgets.push(parseInt(amount));
  }
  
  return entities;
};

/**
 * Resolve pronoun/ordinal references to actual items
 */
export const resolveReference = (message, lastResults) => {
  if (!lastResults || lastResults.length === 0) return null;
  
  const lowerMessage = message.toLowerCase();
  
  // Check for ordinal references
  for (const [word, index] of Object.entries(ORDINAL_MAP)) {
    if (lowerMessage.includes(word)) {
      const actualIndex = index === -1 ? lastResults.length - 1 : index;
      if (actualIndex < lastResults.length) {
        return {
          resolved: true,
          item: lastResults[actualIndex],
          index: actualIndex,
          reference: word,
        };
      }
    }
  }
  
  // Check for "it", "this", "that" - default to first/last mentioned
  if (/\b(it|this|that)\b/i.test(lowerMessage)) {
    return {
      resolved: true,
      item: lastResults[0], // Most recently shown
      index: 0,
      reference: 'it/this/that',
    };
  }
  
  return null;
};

/**
 * Detect topic/intent from message
 */
export const detectTopic = (message) => {
  const lowerMessage = message.toLowerCase();
  
  const topics = {
    vet: /\b(vet|veterinary|doctor|clinic|hospital|checkup|vaccine|sick|unwell|health)\b/,
    grooming: /\b(groom|grooming|bath|haircut|nail|spa|salon)\b/,
    food: /\b(food|feed|diet|eat|meal|nutrition|kibble|treat)\b/,
    park: /\b(park|walk|exercise|play|outdoor|off.?leash)\b/,
    store: /\b(store|shop|buy|purchase|pet.?store|supplies)\b/,
    travel: /\b(travel|trip|vacation|hotel|stay|flight|car)\b/,
    restaurant: /\b(restaurant|cafe|dine|eat.?out|brunch|lunch|dinner)\b/,
    training: /\b(train|training|obedience|behavior|command)\b/,
    emergency: /\b(emergency|urgent|immediate|bleeding|accident|poison)\b/,
    celebration: /\b(birthday|party|celebrate|anniversary|gotcha)\b/,
  };
  
  for (const [topic, pattern] of Object.entries(topics)) {
    if (pattern.test(lowerMessage)) {
      return topic;
    }
  }
  
  return 'general';
};

/**
 * Build enriched query with context
 */
export const enrichQueryWithContext = (message, context) => {
  const followUp = detectFollowUp(message);
  const entities = extractEntities(message);
  const topic = detectTopic(message);
  
  let enrichedQuery = message;
  let contextUsed = [];
  
  // If it's a follow-up and we have context, enrich the query
  if (followUp.isFollowUp && context) {
    // Add location if not mentioned but known
    if (entities.locations.length === 0 && context.lastLocation) {
      enrichedQuery += ` in ${context.lastLocation}`;
      contextUsed.push(`location: ${context.lastLocation}`);
    }
    
    // Add topic if continuing same topic
    if (context.lastTopic && topic === 'general') {
      contextUsed.push(`topic: ${context.lastTopic}`);
    }
  }
  
  return {
    originalQuery: message,
    enrichedQuery,
    followUp,
    entities,
    topic,
    contextUsed,
  };
};

/**
 * Create a new conversation context
 */
export const createConversationContext = (pet = {}) => ({
  pet: {
    id: pet.id,
    name: pet.name || 'your pet',
    breed: pet.breed,
    age: pet.age,
    city: pet.city,
  },
  lastTopic: null,
  lastIntent: null,
  lastLocation: pet.city || null,
  lastResults: [],
  lastResultsType: null, // 'vets', 'products', 'parks', etc.
  mentionedPreferences: [],
  rejectedItems: [],
  conversationTurns: 0,
});

/**
 * Update context after a conversation turn
 */
export const updateContext = (context, { topic, results, resultsType, location, preferences }) => {
  return {
    ...context,
    lastTopic: topic || context.lastTopic,
    lastResults: results || context.lastResults,
    lastResultsType: resultsType || context.lastResultsType,
    lastLocation: location || context.lastLocation,
    mentionedPreferences: [
      ...context.mentionedPreferences,
      ...(preferences || []),
    ].slice(-10), // Keep last 10 preferences
    conversationTurns: context.conversationTurns + 1,
  };
};

export default {
  detectFollowUp,
  extractEntities,
  resolveReference,
  detectTopic,
  enrichQueryWithContext,
  createConversationContext,
  updateContext,
};

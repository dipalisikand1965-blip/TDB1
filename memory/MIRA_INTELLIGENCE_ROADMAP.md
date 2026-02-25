# MIRA OS - Conversational Intelligence Roadmap

**Created:** February 8, 2026
**Status:** 🔴 IN PROGRESS
**Priority:** P0 - Core Differentiator

---

## Vision

Mira should feel like talking to a **knowledgeable friend who remembers everything** about your pet, not a generic chatbot. Every interaction should build on previous ones.

---

## Intelligence Pillars

### 1. 🧠 Context Retention (Session Memory)
**Current State:** Basic - loses context after a few messages
**Target:** Remember full conversation context within session

| Feature | Status | Priority |
|---------|--------|----------|
| Remember pet name throughout session | ✅ Done | P0 |
| Remember user preferences mentioned | 🔴 TODO | P0 |
| Track conversation topic/intent | 🔴 TODO | P0 |
| Handle follow-up questions ("what about cheaper ones?") | 🔴 TODO | P0 |
| Remember rejected suggestions | 🔴 TODO | P1 |

**Implementation:**
```javascript
// Conversation context object to maintain
{
  pet: { name, breed, age, city },
  currentTopic: 'vet_search',
  lastIntent: 'find_vet',
  mentionedPreferences: ['24/7', 'near Koramangala'],
  rejectedSuggestions: ['ABC Vet Clinic'],
  followUpContext: { ... }
}
```

---

### 2. 🎯 Intent Understanding
**Current State:** Keyword matching
**Target:** True semantic understanding

| Feature | Status | Priority |
|---------|--------|----------|
| Basic intent detection (vet, food, park) | ✅ Done | P0 |
| Multi-intent queries ("vet and groomer nearby") | 🔴 TODO | P0 |
| Implicit intent ("he's not eating well" → health concern) | 🔴 TODO | P0 |
| Clarifying questions when ambiguous | 🟡 Partial | P1 |
| Sentiment detection (frustrated, happy, worried) | 🔴 TODO | P1 |

**Examples to handle:**
- "he's been scratching a lot" → Skin issue, suggest vet + products
- "we're going to Goa next month" → Travel mode, suggest pet-friendly stays
- "it's her birthday tomorrow" → Celebration mode, suggest party + treats

---

### 3. 📝 Long-term Memory (Cross-session)
**Current State:** None
**Target:** Remember everything about the pet across sessions

| Feature | Status | Priority |
|---------|--------|----------|
| Pet profile persistence | ✅ Done | P0 |
| Remember past conversations | 🟡 Partial (session list) | P0 |
| Remember vet preferences | 🔴 TODO | P1 |
| Remember food preferences/allergies | 🔴 TODO | P1 |
| Remember locations visited | 🔴 TODO | P2 |
| Build pet "personality profile" | 🔴 TODO | P2 |

**Database Schema Addition:**
```javascript
pet_memory: {
  pet_id: ObjectId,
  preferences: {
    preferred_vets: [...],
    avoided_foods: [...],
    favorite_treats: [...],
    usual_groomer: {...}
  },
  health_history: [...],
  conversation_insights: [...]
}
```

---

### 4. 🔄 Contextual Follow-ups
**Current State:** Each message treated independently
**Target:** Natural conversation flow

| Feature | Status | Priority |
|---------|--------|----------|
| "What about..." follow-ups | 🔴 TODO | P0 |
| "Show me more like this" | 🔴 TODO | P0 |
| Pronoun resolution ("book that one") | 🔴 TODO | P0 |
| "Actually, I meant..." corrections | 🔴 TODO | P1 |
| "Never mind, let's talk about..." topic switch | 🔴 TODO | P1 |

**Examples:**
```
User: Find me a vet in Bangalore
Mira: Here are 3 vets... [shows list]
User: Any that are 24/7?  ← Should filter previous results
User: Book the second one ← Should know which one
User: What about pet stores nearby? ← Should remember Bangalore
```

---

### 5. 🎨 Personalization
**Current State:** Basic (uses pet name)
**Target:** Deeply personalized responses

| Feature | Status | Priority |
|---------|--------|----------|
| Use pet name in responses | ✅ Done | P0 |
| Breed-specific advice | 🟡 Partial | P0 |
| Age-appropriate suggestions | 🟡 Partial | P0 |
| Size-based product filtering | ✅ Done | P0 |
| Health condition awareness | 🔴 TODO | P1 |
| Personality-based suggestions | 🔴 TODO | P2 |

---

### 6. 🗣️ Conversation Quality
**Current State:** Good but can be verbose
**Target:** Concise, helpful, warm

| Feature | Status | Priority |
|---------|--------|----------|
| Concise responses (not walls of text) | 🟡 Partial | P0 |
| Action-oriented (always suggest next step) | 🟡 Partial | P0 |
| Emotional intelligence (comfort mode) | ✅ Done | P0 |
| Humor when appropriate | 🔴 TODO | P2 |
| Regional language support | 🔴 TODO | P2 |

---

## Implementation Phases

### Phase 1: Session Intelligence (THIS SPRINT)
1. ✅ Spelling correction
2. 🔴 Conversation context object
3. 🔴 Follow-up query handling
4. 🔴 Pronoun resolution
5. 🔴 Topic tracking

### Phase 2: Memory & Personalization
1. Pet memory database schema
2. Preference learning
3. Cross-session context
4. Personalized greetings

### Phase 3: Advanced Understanding
1. Multi-intent parsing
2. Implicit intent detection
3. Sentiment analysis
4. Proactive suggestions

---

## Technical Architecture

### Frontend Context Manager
```javascript
// New: ConversationContext.jsx
const ConversationContext = {
  sessionId: string,
  pet: PetProfile,
  currentTopic: string,
  lastResults: [], // For "show more", "book that one"
  mentionedEntities: {
    locations: [],
    preferences: [],
    timeframes: []
  },
  conversationStack: [] // For "go back to..."
};
```

### Backend Intelligence Layer
```python
# New: conversation_intelligence.py
class ConversationIntelligence:
    def parse_follow_up(self, message, context):
        """Detect if message is a follow-up and resolve references"""
        
    def extract_entities(self, message):
        """Extract locations, times, preferences"""
        
    def resolve_pronouns(self, message, last_results):
        """'Book that one' → specific item from last_results"""
        
    def get_implicit_intent(self, message):
        """'He's scratching a lot' → health_concern"""
```

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Follow-up success rate | ~30% | 90% |
| Context retention (5 msgs) | ~50% | 95% |
| Intent accuracy | ~70% | 95% |
| User satisfaction | - | 4.5/5 |

---

## Files to Create/Modify

### New Files
- `/app/frontend/src/context/ConversationContext.jsx`
- `/app/backend/services/conversation_intelligence.py`
- `/app/backend/models/pet_memory.py`

### Modify
- `/app/backend/mira_routes.py` - Add context handling
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Use context manager

---

## Next Immediate Actions

1. **Create ConversationContext** - Track session state
2. **Add follow-up detection** - "what about", "show more", "that one"
3. **Implement pronoun resolution** - Map "it", "that", "the first one"
4. **Add topic memory** - Remember we're talking about vets in Bangalore

---

*This is the intelligence roadmap. Execute Phase 1 first.*

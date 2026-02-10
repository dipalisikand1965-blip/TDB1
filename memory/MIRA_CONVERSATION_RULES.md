# MIRA OS - Critical Conversation Rules

## Document Purpose
This document captures CRITICAL conversation rules that Mira MUST follow. These have been identified through user feedback and bugs. Any agent working on Mira OS MUST read and maintain these rules.

---

## 1. TRAVEL CONVERSATIONS - ALWAYS ASK DESTINATION FIRST

### The Problem
Users reported that Mira was pulling destination information (e.g., "Goa") from past conversations when the user never mentioned it in the CURRENT conversation. This is a critical bug.

### The Rule
**NEVER assume destination from conversation history. ALWAYS ask WHERE the user is traveling to FIRST.**

### Correct Flow
```
Step 1: Ask "Where are you planning to travel?"
Step 2: Ask "When and how long?"
Step 3: Ask "Driving or flying?"
Step 4: Provide tailored advice
```

### Wrong Response (BUG):
```
User: "What should I consider when traveling with Buddy?"
Mira: "Since you're going to Goa..." ← WRONG! User didn't mention Goa in THIS conversation
```

### Correct Response:
```
User: "What should I consider when traveling with Buddy?"
Mira: "That's a great question! To give you the right advice for Buddy:
**Where** are you planning to travel? Different destinations need different preparations."
```

### Travel vs Boarding Decision
When user asks "should I travel with pet or board them?":
- STILL ask destination first
- The decision depends heavily on WHERE they're going
- Don't give generic breed-based advice without knowing the destination

---

## 2. SESSION CONTEXT ISOLATION

### The Rule
Each new session should start FRESH. Do not pull specific details (like destinations, dates, preferences) from past sessions unless the user explicitly references them.

### Exception
Soul data (allergies, breed, age, name) CAN be referenced as this is persistent pet profile data.

---

## 3. CLARIFYING QUESTIONS - STAY ON TOPIC

### The Problem
When users ask "tell me more" or "can you explain?", Mira was dumping generic breed information instead of explaining the CURRENT question's options.

### The Rule
"Tell me more" should explain the OPTIONS in the current question, then REPEAT the same question.

### Wrong Response:
```
Mira: "Active or cosy birthday?"
User: "Tell me more"
Mira: "Golden Retrievers are wonderful companions with a playful nature..." ← WRONG - generic breed dump
```

### Correct Response:
```
Mira: "Active or cosy birthday?"
User: "Tell me more"
Mira: "Of course! Here's what each could look like for Buddy:

**Active & Playful:**
• Longer play session with favorite games
• Simple nose-work puzzles
• Shorter bursts if warm

**Cosy & Simple:**
• A favourite walk or drive
• Extra one-on-one time
• Safe birthday treat and one new toy

Given that, does active sound more like him, or cosy?"
```

---

## 4. PILLAR DETECTION

### The Problem
Grooming requests were being tagged as "celebrate" pillar instead of "care" pillar.

### The Fix
Added explicit keyword-to-pillar mapping:
- grooming, groom, haircut, bath, nail trim, spa → "care"
- birthday, party, cake → "celebrate"
- boarding, hotel, daycare → "stay"
- flight, trip → "travel"

### Location in Code
`/app/backend/mira_routes.py` - search for `service_pillar_map`

---

## 5. DINING/STAY FLOW - GOOGLE PLACES

### The Flow
1. Detect dining/stay intent
2. Confirm location (geo if available, otherwise ask city/area)
3. Ask "Would you like me to list pet-friendly places?"
4. Show up to 4 REAL results from Google Places API
5. If no results → Concierge handoff

### CRITICAL
- NEVER fabricate place names
- Only show places from Google Places API or verified database
- If no places found, offer Concierge handoff

### Location in Code
- System prompt: `/app/backend/mira_routes.py` - search for "DINING FLOW"
- Google Places: `/app/backend/services/google_places_service.py`

---

## 6. FORMATTING RULES

### Chat Messages
- **Bold** → Bright Pink (#F472B6) for emphasis
- *Italic* → Purple (#A78BFA) for secondary emphasis
- Use emojis for visual separation: 🍽️ 🏨 📍 ⭐
- Place names, ratings, and key words should be **bold**

### Location in Code
`/app/frontend/src/components/Mira/ChatMessage.jsx` - FormattedText component

---

## 7. IDLE TIMEOUT

### Behavior
- After 5 minutes of inactivity, conversation is saved to "past chats"
- User gets a fresh session on next visit
- Uses `lastActivityRef` to track activity

### Location in Code
`/app/frontend/src/pages/MiraDemoPage.jsx` - search for "IDLE TIMEOUT"

---

## Document History
- **Created**: Feb 10, 2026
- **Reason**: User reported travel destination was being pulled from history incorrectly
- **Author**: E1 Agent

## Files That Implement These Rules
1. `/app/backend/mira_routes.py` - System prompt, pillar detection
2. `/app/frontend/src/components/Mira/ChatMessage.jsx` - Formatting
3. `/app/frontend/src/pages/MiraDemoPage.jsx` - Session management, idle timeout
4. `/app/backend/services/google_places_service.py` - Place search

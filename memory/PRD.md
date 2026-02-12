# The Doggy Company - Mira AI Pet Companion

## Original Problem Statement
MIRA to function as a "Lifestyle OS" - context-aware, proactive, safe, OS-like behavior with dynamic picks. **MIRA is NOT a chatbot - she is a memory-driven Pet Operating System.**

## Core Doctrine (READ FIRST)
See `/app/memory/MIRA_OS_DOCTRINE.md` for the foundational system behavior.

**The One Truth:**
- Mira is a Memory System First. Conversation Second.
- Every pet has a continuously evolving intelligence profile.
- If memory is not being captured, structured, and reused — Mira is not functioning as an operating system.
- If Mira asks for information that already exists → **SYSTEM FAILURE**

---

## OS Intelligence Scorecard (Feb 12, 2026)

| Area | Score | Status | Details |
|------|-------|--------|---------|
| **1. Memory System First** | **60/100** | 🟢 Working | Memory extraction + injection integrated |
| **2. Soul Questionnaire** | **50/100** | 🟡 Partial | 34 questions, needs versioned storage |
| **3. Every Interaction Updates Memory** | **70/100** | 🟢 Working | Patterns extract behavior, allergies, routine |
| **4. Structured Memory Model** | **45/100** | 🟡 Partial | Using `conversation_memories` collection |
| **5. Reason From Memory First** | **75/100** | 🟢 Good | Memories injected into LLM context |
| **6. Memory Enrichment** | **60/100** | 🟢 Working | Auto-extracts from every chat |
| **7. Personalisation Hierarchy** | **70/100** | 🟢 Good | Pet-specific data used first |
| **8. No Human Memory (Mira Never Forgets)** | **60/100** | 🟢 Working | Memories persist across sessions |
| **9. Continuous Profile Growth** | **35/100** | 🟡 Basic | No versioning yet |
| **10. Soul Score = Intelligence Depth** | **50/100** | 🟡 Partial | Completion % only |
| **11. Conversation Feeds Intelligence** | **70/100** | 🟢 Working | Full pipeline integrated |
| **12. Pet Context Pack** | **65/100** | 🟢 Good | Retrieved before every response |

**Overall OS Intelligence: 55/100** (up from 43/100)

---

## What's Implemented (Feb 12, 2026)

### Memory Extraction Pipeline (NEW - TODAY)
`/app/backend/services/memory_service.py`

**Features:**
- Extracts intelligence from every conversation turn
- Patterns for: food preferences, allergies, behavior, health, routine, environment
- Stores to `conversation_memories` collection with confidence scores
- Auto-injects memories into LLM context before each response
- Pillar-aware memory retrieval (DINE gets food memories, STAY gets behavior memories)

**Extraction Patterns:**
| Category | Signal Types | Example |
|----------|--------------|---------|
| food_preference | positive, negative | "she loves peanut butter" |
| allergy | allergy, restriction, reaction | "allergic to chicken" |
| behavior | anxiety_trigger, temperament, dislike | "anxious during thunderstorms" |
| health | condition, medication, symptom | "has arthritis" |
| routine | walk_time, meal_time, sleep_location | "walks at 8am" |
| environment | housing, outdoor_space, household | "lives in apartment with kids" |

### Soul Intelligence Service
`/app/backend/services/soul_intelligence.py`

**Features:**
- 34 Soul questions across 10 categories
- Real-time completion score calculation
- Dynamic question suggestions based on pillar + context
- Natural phrasing generation for conversation flow

### Profile-First Questioning (VERIFIED ✅)
All pillars now use complete profile data:
- Temperament, energy level, personality
- Allergies and sensitivities
- Life stage, handling comfort
- Birthday, favorite treats
- Health conditions, breed-specific care

### Test Results (Mystique)
- ✅ Birthday recognized: "14 May 2016"
- ✅ Allergies used: "chicken, beef, wheat, corn"
- ✅ Temperament: "calm, gentle, low energy"
- ✅ Soul Score: 50% complete (17/34)
- ✅ Memory extraction working (7+ memories captured)
- ✅ Memories injected into LLM context

---

## Database Collections

### Memory-Related Collections
| Collection | Purpose | Docs |
|------------|---------|------|
| `conversation_memories` | Extracted signals from chat | Active |
| `mira_memories` | Long-term structured memories | 138 |
| `mira_signals` | UI/behavior signals | 1141 |
| `soul_drip_history` | Question drip campaign | 2 |

### Key Schema (conversation_memories)
```json
{
  "pet_id": "pet-xxx",
  "category": "behavior",
  "signal_type": "anxiety_trigger",
  "value": "thunderstorms",
  "confidence": 70,
  "source": "conversation",
  "pillar": "advisory",
  "timestamp": "2026-02-12T09:22:16.123Z"
}
```

---

## Test Credentials
- **Admin**: username: aditya, password: lola4304
- **Test Pet**: Mystique (pet-3661ae55d2e2), Shih Tzu, Senior
- **Preview URL**: https://pet-os-core.preview.emergentagent.com

## Key Files
- `/app/backend/mira_routes.py` - Main chat logic (18,242 lines)
- `/app/backend/services/soul_intelligence.py` - Soul questions + scoring
- `/app/backend/services/memory_service.py` - Memory extraction + retrieval
- `/app/memory/MIRA_OS_DOCTRINE.md` - System doctrine

---

## Remaining Work (Priority Order)

### P0 - Data Sync Issue
- Preview DB has 17 soul answers vs production's 55+
- Needs investigation/sync mechanism

### P1 - Versioned Storage
- Implement `soul_answers` table with versioning
- Implement `traits` table with confidence evolution
- Add temporal tracking for behavioral shifts

### P2 - Intelligence Depth Score
- Move beyond completion % to true intelligence depth
- Factor in: observation count, confidence levels, recency

### P3 - MiraDemoPage Refactor
- 4,298 lines - causing performance issues
- Break into smaller components

---
*Last Updated: February 12, 2026 09:25 UTC*

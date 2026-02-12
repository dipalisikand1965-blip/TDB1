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

## What's Implemented (Feb 12, 2026)

### Soul Intelligence Service (NEW)
`/app/backend/services/soul_intelligence.py`

**Features:**
- 34 Soul questions across 10 categories
- Real-time completion score calculation
- Dynamic question suggestions based on pillar + context
- Natural phrasing generation for conversation flow

**Categories:**
| Category | Questions | Purpose |
|----------|-----------|---------|
| identity | 5 | Breed, birthday, gender, weight, size |
| temperament | 4 | Energy, temperament, nature, description |
| social | 3 | Dogs, humans, strangers |
| emotional | 3 | Separation anxiety, triggers, loud sounds |
| food | 4 | Allergies, treats, motivation, diet type |
| care | 3 | Handling, grooming, vet comfort |
| health | 3 | Conditions, medications, life stage |
| lifestyle | 4 | Lives with, sleep, alone time, walks |
| travel | 4 | Car rides, crate, hotel, travel mode |
| training | 2 | Level, learning style |

### Memory Service (NEW)
`/app/backend/services/memory_service.py`

**Features:**
- Conversation memory extraction (every turn)
- Trait detection with confidence scores
- Pattern extraction (preferences, behavior, health, routine)
- Pet Context Pack retrieval

### API Response Enhancement
Chat response now includes:
```json
"soul_intelligence": {
  "completion_score": {
    "total_score": 50.0,
    "answered": 17,
    "total": 34,
    "categories": {
      "temperament": {"percentage": 100.0},
      "identity": {"percentage": 80.0},
      ...
    }
  },
  "unanswered_questions": [
    {"question": "What triggers anxiety?", "category": "emotional"}
  ],
  "suggested_question": {
    "question": "...",
    "natural_phrasing": "To ensure the best care, I'd love to know: ..."
  }
}
```

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
- ✅ Suggested questions contextual to pillar

## Documents in Memory
- `/app/memory/MIRA_OS_DOCTRINE.md` - **READ FIRST** - System doctrine
- `/app/memory/MIRA_BIBLE.md` - Core principles
- `/app/memory/MIRA_CONVERSATION_RULES.md` - Conversation rules

## Test Credentials
- **Admin**: username: aditya, password: lola4304
- **Test Pet**: Mystique (pet-3661ae55d2e2), Shih Tzu, Senior
- **Preview URL**: https://pet-os-core.preview.emergentagent.com

## Key Files
- `/app/backend/mira_routes.py` - Main chat logic
- `/app/backend/services/soul_intelligence.py` - NEW - Soul questions
- `/app/backend/services/memory_service.py` - NEW - Memory extraction

---
*Last Updated: February 12, 2026*

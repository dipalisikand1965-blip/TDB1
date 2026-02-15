# The Doggy Company - Mira OS Product Requirements Document
## Pet Operating System Evolution

---

## Original Problem Statement
Transform the pet e-commerce platform into a "Pet Operating System" centered on the principle "Mira knows, Mira doesn't ask." The core goal is making Mira the "Pet Operating Soul System" that understands each pet's unique "Soul" through 8 Golden Pillars.

---

## What's Been Implemented (Feb 15, 2026)

### ✅ Completed Features
1. **Mira OS Modal (BETA)**
   - Accessible via "Mira OS (BETA)" button on `/celebrate-new`
   - Three tabs: Picks, Concierge®, Services
   
2. **Concierge® Rebranding**
   - Chat tab renamed to Concierge® with Freshchat-style icon
   - Consistent branding across modal

3. **Backend-Driven Intelligent Quick Replies**
   - `generate_intelligent_quick_replies()` in `server.py`
   - Dynamic, pet-first contextual prompts
   - Inline conversational UI in `MiraOSModal.jsx`

4. **Bug Fix: `/celebrate-new` Array Error (Feb 15)**
   - Fixed `l.some is not a function` by ensuring array validation for petAllergies/petFavorites

5. **UNIFIED 8 GOLDEN PILLARS SCORING SYSTEM (Feb 15)**
   - Restructured `pet_soul_config.py` from 6 categories → 8 pillars
   - 39 scored questions (up from 26), total still = 100 points
   - Distribution:
     - 🎭 Identity & Temperament: 15 pts (5 questions)
     - 👨‍👩‍👧‍👦 Family & Pack: 12 pts (5 questions) - NEW
     - ⏰ Rhythm & Routine: 14 pts (6 questions) - NEW
     - 🏠 Home Comforts: 8 pts (4 questions)
     - ✈️ Travel Style: 10 pts (4 questions) - NEW
     - 🍖 Taste & Treat: 14 pts (5 questions)
     - 🎓 Training & Behaviour: 10 pts (4 questions)
     - 🌅 Long Horizon (Health): 17 pts (6 questions)
   - New endpoint: `GET /api/pet-soul/profile/{pet_id}/8-pillars`

### Pet Soul System Architecture
- **55+ questions in DOGGY_SOUL_QUESTIONS** (`pet_soul_routes.py`)
- **39 questions now SCORED** (`pet_soul_config.py`)
- **5 Tier System:**
  - 🐾 Curious Pup (0-24%)
  - 🌱 Loyal Companion (25-49%)
  - 🤝 Trusted Guardian (50-74%)
  - 🐕‍🦺 Pack Leader (75-89%)
  - ✨ Soul Master (90-100%)

- **Quick Questions Engine** (`pet_soul_routes.py`):
  - `/api/pet-soul/profile/{pet_id}/quick-questions`
  - Returns max 3 unanswered high-weight questions
  - Ensures diversity across folders

- **Mira System Prompt** (`mira_routes.py`):
  - Soul-First Response Generation doctrine
  - Injects pet allergies, favorites, temperament
  - Conversation memory integration

---

## Prioritized Backlog

### P0 - Critical (Immediate)
- [ ] Test & Fix ElevenLabs voice in Mira OS
- [ ] Weave Quick Questions into Concierge® chat flow
- [ ] Update /mira-demo UI to show 8-pillar visual breakdown

### P1 - Important (Next Sprint)
- [ ] Connect Concierge indicator (🤲) states
- [ ] Proactive Mira prompts based on pillar gaps

### P2 - Nice to Have
- [ ] Gate Mira OS for paid members

### P3 - Future
- [ ] Phase out old FAB
- [ ] Replace `/celebrate` with `/celebrate-new`
- [ ] Backend modular refactor (`server.py` → routers)

---

## Known Issues
1. **ElevenLabs Voice** - Code added but untested in Mira OS
2. **Original FAB** - Multi-pet switching broken (not priority)
3. **Production Domain** - `thedoggycompany.in` DNS issue (external blocker)

---

## Key Files Reference
- `backend/server.py` - Main API with Mira chat
- `backend/mira_routes.py` - Mira system prompt builder
- `backend/pet_soul_routes.py` - Quick Questions + 8-pillars endpoint
- `backend/pet_soul_config.py` - **UNIFIED** Soul scoring config (8 pillars, 100 pts)
- `frontend/src/components/mira-os/MiraOSModal.jsx` - Mira OS UI
- `frontend/src/pages/CelebrateNewPage.jsx` - Fixed array bug
- `frontend/src/pages/MiraDemoPage.jsx` - Pet Soul page
- `memory/MIRA_SOUL_SCORECARD.md` - Intelligence assessment

---

## API Endpoints - Soul System

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pet-soul/profile/{pet_id}/8-pillars` | GET | **NEW** - Full 8-pillar breakdown, tier, gaps |
| `/api/pet-soul/profile/{pet_id}/quick-questions` | GET | Top 3 unanswered high-weight questions |
| `/api/pet-soul/profile/{pet_id}/answers` | POST | Save soul answers |
| `/api/mira/chat` | POST | Mira chat with intelligent quick replies |

---

## Credentials
- Test User: `dipali@clubconcierge.in` / `test123` (may need to recreate)
- DB Pet IDs: `pet-99a708f1722a` (Mojo - 89% score)

---

*Last Updated: February 15, 2026*

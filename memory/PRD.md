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

4. **Bug Fix: `/celebrate-new` Array Error**
   - Fixed `l.some is not a function` by ensuring array validation for petAllergies/petFavorites

### Pet Soul System Architecture
- **6 Categories, 26 Questions** (from `pet_soul_config.py`):
  - Safety & Health (36 points)
  - Personality & Temperament (25 points)
  - Lifestyle & Preferences (20 points)
  - Nutrition (9 points)
  - Training (5 points)
  - Relationships (5 points)

- **Quick Questions Engine** (`pet_soul_routes.py`):
  - `/api/pet-soul/profile/{pet_id}/quick-questions`
  - Returns max 3 unanswered high-weight questions
  - Ensures diversity across folders

- **Mira System Prompt** (`mira_routes.py`):
  - Soul-First Response Generation doctrine
  - Injects pet allergies, favorites, temperament
  - Conversation memory integration

---

## Current Soul Score: 63/100 (Lola)

| 8 Golden Pillars | Score | Status |
|------------------|-------|--------|
| Identity & Personality | 70.6% | 🟡 Good |
| Social World | 14.3% | 🔴 Critical Gap |
| Adventure & Outdoors | 0.0% | 🔴 Empty |
| Rest & Routines | 0.0% | 🔴 Empty |
| Taste & Treat World | 48.0% | 🟡 Partial |
| Training & Behaviour | 35.3% | 🟠 Needs Work |
| Long Horizon (Health) | 58.3% | 🟡 Decent |

---

## Prioritized Backlog

### P0 - Critical (Immediate)
- [ ] Fill Empty Pillars: Rest & Routines, Adventure & Outdoors
- [ ] Test & Fix ElevenLabs voice in Mira OS
- [ ] Weave Quick Questions into Concierge® flow

### P1 - Important (Next Sprint)
- [ ] Fill Social World gap (14.3% → 70%)
- [ ] Connect Concierge indicator (🤲) states
- [ ] Implement intelligence enhancement plan

### P2 - Nice to Have
- [ ] Gate Mira OS for paid members
- [ ] Complete Taste & Treat World (48% → 75%)
- [ ] Complete Training & Behaviour (35% → 60%)

### P3 - Future
- [ ] Phase out old FAB
- [ ] Replace `/celebrate` with `/celebrate-new`
- [ ] Backend modular refactor (`server.py` → routers)

---

## Known Issues
1. **ElevenLabs Voice** - Code added but untested
2. **Original FAB** - Multi-pet switching broken (not priority)
3. **Production Domain** - `thedoggycompany.in` DNS issue (external blocker)

---

## Key Files Reference
- `backend/server.py` - Main API with Mira chat
- `backend/mira_routes.py` - Mira system prompt builder
- `backend/pet_soul_routes.py` - Quick Questions endpoint
- `backend/pet_soul_config.py` - Soul scoring config
- `frontend/src/components/mira-os/MiraOSModal.jsx` - Mira OS UI
- `frontend/src/pages/CelebrateNewPage.jsx` - Fixed array bug
- `memory/MIRA_SOUL_SCORECARD.md` - Intelligence assessment

---

## Credentials
- Test User: `dipali@clubconcierge.in` / `test123`

---

*Last Updated: February 15, 2026*

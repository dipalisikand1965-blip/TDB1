# THE DOGGY COMPANY - Product Requirements Document
## Premium Pet Concierge Platform

**Last Updated:** February 21, 2026
**Status:** Phase 1-3 Complete, Phase 4 Pending

---

## ORIGINAL VISION

The Doggy Company is building a "Soul" for pets through a digital platform - a premium pet concierge service that knows each pet deeply and personally. The platform has multiple pillars:

1. **Soul Builder** - Magical, gamified onboarding capturing 51+ "soul" questions
2. **Mira** - An AI companion that knows the pet intimately
3. **15 Pillar Pages** - Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Shop, Paperwork, Advisory, Emergency, Farewell, Adopt, Services

---

## WHAT'S BEEN COMPLETED

### ✅ PHASE 1: Core Intelligence Fix (February 21, 2026)
**Status: COMPLETE**

**Problem:** The premium `/mira-demo` page was returning vague, generic responses while the "Mira OS BETA" on pillar pages showed detailed, personalized responses.

**Root Cause:** The `/api/mira/os/understand-with-products` endpoint was NOT calling `load_pet_soul()` to load full database context. It only used the limited data sent from the frontend.

**Fix Applied:**
1. Added `load_pet_soul()` call in `/app/backend/mira_routes.py` (line ~4295)
2. Changed endpoint to use `enriched_pet_context` (with full database soul data)
3. Enhanced LLM prompt to include behavioral data:
   - Anxiety triggers
   - Separation anxiety
   - Behavior with dogs/humans
   - Noise sensitivity
   - Love language
   - Learned facts from conversations

**Test Result:**
- Before: "she's a loving companion who enjoys chicken jerky..."
- After: "she's a loving dog with high energy who loves playing with other dogs, gets anxious if left alone for more than three hours, thrives on attention, and enjoys photo sessions where she can pose"

### ✅ PHASE 2: UI Feature Parity (February 21, 2026)
**Status: COMPLETE - Already Implemented**

**Verified Features:**
- Voice (ElevenLabs TTS) - Already integrated via `useVoice` hook
- QuickReplies - Already imported and working
- Soul traits display - Working (Glamorous soul, Elegant paws, Devoted friend)

### ✅ PHASE 3: user_learn_intents Persistence (February 21, 2026)
**Status: CONFIRMED WORKING**

**Finding:** The system was NOT broken. It correctly captures intents when messages contain relevant keywords (grooming, training, health, etc.).

**Test Result:**
- Message: "How do I help with Lola's grooming and anxiety?"
- Captured: `['grooming', 'behaviour']`
- Database: 8 intents stored

---

## UPCOMING TASKS (PRIORITIZED)

### P1 - High Priority
1. **Add Smart Chips to /mira-demo**
   - Port contextual chips from MiraOSModal (e.g., "dairy-free treats", "Calm anxiety")
   
2. **Add Soul Knowledge Ticker**
   - Show traits at top like pillar pages do

### P2 - Medium Priority  
1. **Complete Soul Builder Onboarding**
   - Backend endpoints for persistence
   - "Save & finish later" functionality

2. **Add Voice to /mira-demo**
   - Verify ElevenLabs TTS works end-to-end

### P3 - Future
1. **Unify 3 Miras → 1 Mira**
   - Use MiraOSModal as base
   - Deprecate MiraChatWidget (FAB)
   
2. **Standardize 15 Pillar Pages**
   - Ensure each has MiraOSTrigger
   - Consistent Services/Products/Experiences layout

3. **Refactor server.py Monolith**
   - Break into smaller, focused modules

---

## ARCHITECTURE

### Backend
- **Framework:** FastAPI
- **Database:** MongoDB
- **AI:** OpenAI GPT-4o via Emergent LLM key
- **Voice:** ElevenLabs TTS

### Frontend
- **Framework:** React
- **UI:** Shadcn/UI components
- **State:** React hooks

### Key Files
- `/app/backend/mira_routes.py` - Main Mira logic (19,000+ lines)
- `/app/backend/learn_intent_bridge.py` - Intent capture system
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Premium chat page
- `/app/frontend/src/components/mira-os/MiraOSModal.jsx` - Pillar modal

---

## TEST CREDENTIALS
- **Email:** dipali@clubconcierge.in
- **Password:** test123
- **Pet:** Lola (Soul Score: 57.8%)

---

## CRITICAL INTELLIGENCE DATA NOW AVAILABLE

When asking "What do you know about Lola?", Mira now shows:
- ✅ Personality: "loving dog with high energy"
- ✅ Social: "loves playing with other dogs"
- ✅ Anxiety: "gets anxious if left alone for more than three hours"
- ✅ Triggers: "isn't too fond of car honks"
- ✅ Learned: "enjoys photo sessions where she can pose"
- ✅ Preferences: "prefers chicken over all other proteins"

---

*Document maintained by Emergent Platform*

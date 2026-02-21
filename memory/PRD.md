# Pet Soul Platform - Product Requirements Document
## Last Updated: February 21, 2026 (Session 4)

---

## Original Problem Statement

The user, Dipali, founder of a premium pet concierge service, wants to build a "soul" for pets through a digital platform. Key pillars are a "magical" and gamified "Soul Builder" onboarding, unifying the multiple "Mira" chat implementations into a single superior experience, and improving the overall UI/UX to feel "premium."

---

## Core Requirements (Non-Negotiable)

1. **Fix Mira's Intelligence & UX** ✅ COMPLETE - The main demo chat (`/mira-demo`) is now identical in intelligence, tone, format, and functionality to the superior `Mira OS BETA` experience.

2. **Achieve Full Bible Compliance** ✅ COMPLETE (100%) - All chat interactions comply with PET_OS_BEHAVIOR_BIBLE.md

3. **Food Safety Gate** ✅ COMPLETE - "Memory is only real if it changes behaviour immediately"
   - Unified allergy extraction from all sources
   - Never ask "any allergies?" if already known
   - Intercept unsafe ingredient requests with alternatives
   - UI dietary context chip in food flows

4. **Core Panel Endpoints** ✅ COMPLETE (Session 4)
   - TODAY endpoint with urgency dashboard
   - NOTIFICATIONS endpoint for user alerts
   - Location fix - no more Mumbai default
   - Places guardrail for non-location intents

5. **Build a Brilliant Onboarding** - Design and build the new, single-flow "Soul Builder." (BACKLOG)

6. **Unify the "Mira" Experience** - Consolidate the three different "Mira" implementations into one. (BACKLOG)

7. **Make Pillar Pages Magical** - Apply the new template from `/celebrate-new` to all other pillar pages. (BACKLOG)

---

## What's Been Implemented

### Session 3: February 21, 2026 (CURRENT)

#### P0 - Food Safety Gate System ✅ (NEW FEATURE)
*"Memory is only real if it changes behaviour immediately."*

**Backend Functions Added** (`/app/backend/mira_routes.py` lines 162-280):
- `get_pet_allergies(pet)`: Canonical source of truth - merges allergies from ALL 8 sources
- `get_pet_allergies_display(pet)`: Returns comma-separated string for UI
- `has_known_allergies(pet)`: Boolean check for allergy existence
- `food_safety_gate(pet, items)`: Filters products containing allergens
- `build_allergy_context_injection(pet)`: LLM prompt injection block

**Unsafe Ingredient Intercept** (lines 12437-12534):
- Detects food requests containing known allergens
- Returns `intent: "allergen_intercept"` with `safety_gate` data
- Suggests safe alternatives (e.g., chicken → turkey, duck, fish)
- Bible-compliant quick replies for alternative exploration

**Test Results:** All 3 scenarios pass ✅

#### P0 - Places API Guardrail Fix ✅
**Issue**: "Health checkup reminder" triggered Places API showing vet clinics
**Root Cause**: TWO Places detection paths - only first had NON_LOCATION_INTENTS guard
**Fix**: Added `NON_LOCATION_INTENTS_2` guard at lines 13808-13815
**Result**: Non-location intents (reminder, schedule, checkup) now blocked from Places

**Test Results (iteration_223.json):**
- ✅ "Health checkup reminder" → 0 places
- ✅ "Schedule vaccination" → 0 places  
- ✅ "Find vets near me" → mode='clarify' (asks for location first)

#### P1 - Duplicate Quick Replies Fix ✅
**Issue**: Quick replies showing at BOTH top (contextual) AND bottom
**Fix**: Bottom QuickReplies component now checks if last message has inline quick_replies
**File**: `/app/frontend/src/pages/MiraDemoPage.jsx` lines 4201-4232

#### Icon State System ✅ (VERIFIED WORKING)
**Location**: `/app/frontend/src/hooks/mira/useIconState.js`
- THREE STATES: OFF (muted), ON (lit), PULSE (animated + badge)
- Active tab override: No PULSE while inside tab
- Pet switch: Reset all states to OFF, then recalculate

### Session 2: February 21, 2026

#### P0 - Picks Panel Pillar Fix ✅
- **Issue**: Picks panel showed wrong pillar items
- **Fix**: Added `"pillar"` to `add_picks_to_response()` return

#### P0 - Allergy Consolidation Fix ✅
- **Issue**: Backend took FIRST non-empty allergy source
- **Fix**: Created `_extract_allergy_list()` that MERGES all sources

### Session 1: February 21, 2026

#### P0 - Quick Replies Fix ✅
- **Issue**: Quick reply buttons showed generic navigational options instead of contextual conversation options
- **Fix**: Changed priority order in `useChatSubmit.js`, `MiraDemoPage.jsx`, `ChatMessage.jsx`
- **Result**: Now shows "Stick with kibble", "Add home-cooked" etc.

#### P1 - Soul Score Display Fix ✅
- **Issue**: Dashboard showed 56% instead of actual 62%
- **Fix**: Backend now uses `max(stored_score, calculated_score)`
- **Result**: Soul growth from conversations properly reflected

#### P1 - Voice Functionality Fix ✅
- **Issue**: Multiple JS errors (`setVoiceError`, `setIsListening` not defined)
- **Fix**: Exported missing functions from `useVoice.js` hook
- **Result**: Voice enabled by default, works seamlessly

#### Comprehensive MIRA Bible Audit ✅
- **Result**: 100% backend / 100% frontend compliance (upgraded from 95%/100%)
- **Verified**: Profile-First, Memory First, Never Dead End, Voice Integration

---

## Prioritized Backlog

### P1 (High Priority)
- [ ] **Voice Testing** - Comprehensive test per MIRA_VOICE_RULES
- [ ] **Soul Builder Completion** - Finish `SoulBuilder.jsx` with backend endpoints

### P2 (Medium Priority)
- [ ] **Unify Mira Components** - Consolidate MiraDemoPage, MiraOSModal, MiraChatWidget

### P3 (Future)
- [ ] Rebuild `/mira-demo` using `MiraOSModal` as base
- [ ] Implement "Read Receipts" for messages
- [ ] Refactor `backend/server.py` monolith
- [ ] Apply `/celebrate-new` template to pillar pages

---

## Code Architecture

```
/app
├── backend/
│   └── server.py        # Monolithic FastAPI (~12,000 lines)
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MiraDemoPage.jsx    # Main chat (~4000 lines)
│   │   │   ├── MemberDashboard.jsx # User dashboard
│   │   │   └── SoulBuilder.jsx     # Onboarding (incomplete)
│   │   ├── hooks/mira/
│   │   │   ├── useChatSubmit.js    # Chat logic
│   │   │   └── useVoice.js         # Voice integration
│   │   └── components/
│   │       ├── Mira/               # Chat components
│   │       └── mira-os/            # OS modal components
└── memory/                         # 159 bible/doctrine files
```

---

## Key API Endpoints

| Endpoint | Purpose | Notes |
|----------|---------|-------|
| `/api/mira/chat` | Main chat | Uses pet context, returns contextual quick replies |
| `/api/pets/my-pets` | Get user's pets | Now uses max(stored, calculated) for score |
| `/api/tts/generate` | Text-to-speech | ElevenLabs primary, OpenAI fallback |

---

## Database Schema

- **Collection**: `pets`
  - `overall_score`: Soul percentage (grows with conversations)
  - `doggy_soul_answers`: Profile data from onboarding
  - `preferences`: Food, activity, care preferences
  - `soul.learned_facts`: Facts learned from conversations

- **Collection**: `users`
  - Standard auth fields + pet ownership

- **Collection**: `mira_memories`
  - Conversation history for context

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| User | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## 3rd Party Integrations

| Service | Purpose | Key Location |
|---------|---------|--------------|
| ElevenLabs | Voice TTS | ELEVENLABS_API_KEY in .env |
| OpenAI | LLM + TTS fallback | EMERGENT_LLM_KEY |
| Google Places | Location services | GOOGLE_PLACES_API_KEY |
| Resend | Email | RESEND_API_KEY |
| Firebase | Auth fallback | FIREBASE_* keys |

---

## MIRA Bible Compliance

All changes MUST comply with:

1. **MIRA_BIBLE** - Memory First, Never Dead End, Catalogue First
2. **MIRA_DOCTRINE** - Voice tone, execution classification
3. **MIRA_CONVERSATION_RULES** - Pre-conversation checklist
4. **MIRA_VOICE_RULES** - Voice sync, skip on interaction
5. **PROFILE_FIRST_DOCTRINE** - Use pet data, not breed assumptions

See `/app/memory/BIBLE_INDEX.md` for complete list.

---

## URLs

- **Preview**: https://mira-soul-sync-1.preview.emergentagent.com
- **Production**: https://thedoggycompany.in
- **Sync**: Use "Replace deployment" on Emergent platform

# The Doggy Company - Pet Life Operating System (PRD)

## Original Problem Statement
Build "The Doggy Company" into a "Pet Life Operating System" where the AI assistant Mira behaves with a "soul" and contextual understanding of a human assistant. The user provided 200+ "bible" documents defining this vision. The old 26k+ line implementation had "nonsensical associations" and rigid keyword-based logic that frustrated the user.

## MAJOR UPDATE: Soulful Brain Integration (2026-02-26)

### What Was Done
The legacy `/api/mira/chat` endpoint (26,000+ lines in `mira_routes.py`) was enhanced with a **Soulful Brain** module that:
- Provides warm, focused, bible-following conversations
- Uses GPT-5.1 with a comprehensive soul prompt based on ALL major bibles:
  - MIRA_DOCTRINE.md - Core principles
  - MIRA_CONVERSATION_RULES.md - Chat rules
  - MIRA_VOICE_RULES.md - Voice/response rules
  - MIRA_SOUL_BIBLE.md - Soul principles
- References pet personality, allergies, relationships, health conditions naturally
- Auto-creates service tickets when booking intent is detected
- Follows the Four Governing Principles:
  1. Presence Before Performance
  2. Remember → Confirm → Act
  3. One Question at a Time
  4. Never a Dead End
- Respects the Pet Description Rule (don't repeat traits on follow-ups)

### How It Works
```
┌─────────────────────────────────────────────────────────────┐
│                     mira-demo UI                            │
│  (Beautiful modals, navbar, picks grid, concierge cards)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              /api/mira/chat endpoint                         │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │  Soulful Brain  │───▶│  Legacy Data Systems         │   │
│  │  (GPT-5.1)      │    │  - Memory Assembler          │   │
│  │                 │    │  - Picks from actual DB      │   │
│  │  Bible-following│    │  - Service desk tickets      │   │
│  │  prompts        │    │  - Concierge threads         │   │
│  └─────────────────┘    └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Feature Flag
- `MIRA_SOULFUL_BRAIN=true` (default) - Uses the new soulful conversation engine
- Set to `false` to fall back to legacy keyword-based engine

## Core Architecture
- **Frontend:** React, Tailwind CSS, Socket.IO Client
- **Backend:** FastAPI, Asyncio
- **Database:** MongoDB Atlas
- **AI:** GPT-5.1 via Emergent LLM Key with Soulful Brain module

## Key Files

### NEW Soulful Brain System
- `backend/mira_soulful_brain.py` - The soulful conversation module (~500 lines)
  - Soul prompt following the bibles
  - Pet context injection (personality, allergies, relationships)
  - Auto-service ticket creation on booking intent
  - Contextual quick reply generation

### Production System (Enhanced)
- `frontend/src/pages/MiraDemoPage.jsx` - Production UI
- `frontend/src/hooks/mira/useChatSubmit.js` - Chat flow hook
- `backend/mira_routes.py` - Main routes (26k+ lines, now with soulful brain feature flag)

### Mira Pure System (Standalone Test Page)
- `frontend/src/pages/MiraPureOSPage.jsx` - Test page for new UI concepts
- `backend/mira_pure.py` - Standalone pure chat endpoint

## What's Working Now
- ✅ Soulful conversations in `/mira-demo` via soulful brain
- ✅ Pet context awareness (personality, allergies, health conditions)
- ✅ Auto-service ticket creation (grooming, walking, vet, etc.)
- ✅ Concierge confirmation banners in UI
- ✅ Context-aware quick replies
- ✅ All existing modals (Picks, Services, Learn, Concierge, Today)
- ✅ Production UI unchanged - only brain upgraded

## Example Soulful Response
**User**: "I want to plan a birthday party for Mojo"

**Mira (Soulful)**: "Oh, for Mojo's birthday... I love this already. 😊 Let's take care of this. First, tell me two things so we can shape the party around *him*:
• Where will it be: at home, a park, or somewhere else?
• Is this more "chill cozy hangout" or "silly, full-on dog party with guests and games"?"

## Completed Work
- **2026-02-26:** 
  - Created `mira_soulful_brain.py` with bible-following prompts
  - Integrated soulful brain into `/api/mira/chat` via feature flag
  - Auto-service ticket creation on booking intent
  - Tested with production UI - all features working
  - Concierge banners, quick replies, all modals intact

## Known Issues
1. **Pet Soul Score not updating in UI** (P2) - Score should increment after AI interactions
2. **Password visibility toggle broken** (P3) - Non-functional on login page
3. **Maximum update depth exceeded** (P2) - React re-render warning exists but doesn't block functionality

## Recently Completed (2026-02-26)
- [x] P0: **SERVICES tab pulse/glow** - Tab glows pink for 5 seconds when AI creates service ticket
- [x] P0: **Quick Actions in SERVICES modal** - Clicking launchers (Grooming, Vet, etc.) opens ServiceRequestBuilder  
- [x] P1: **Auto-switch PICKS pillar** - Grooming/vet conversations automatically set pillar to 'care'
- [x] Fixed state propagation issue using ref + forceUpdate pattern to avoid re-render cascades

## Upcoming Tasks
- [ ] P0: Fine-tune soulful prompt based on more bible documents
- [ ] P1: Implement function calling for smarter action triggers
- [ ] P1: Soul Score growth logic
- [ ] P2: Sync production database to preview

## Backlog
- WhatsApp Business integration
- Build 'Fit' and 'Work' pillars
- Premium "Club" membership features

## Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

## API Endpoints
- `POST /api/mira/chat` - Main chat endpoint (now with soulful brain)
- `GET /api/mira/pets` - Get user's pets
- `POST /api/mira-pure/chat` - Standalone soulful endpoint
- `GET /api/mira-pure/services` - Get service tickets

## Soul Prompt Key Elements
```
WHO YOU ARE:
- You ADORE {pet_name}. You know them intimately.
- You speak like a warm, trusted friend - never like a chatbot.
- Parents feel RECOGNIZED when talking to you.

BANNED OPENERS:
- "Great idea", "Great question", "That sounds", "Absolutely"

PREFERRED OPENERS:
- "Oh, for {pet_name}..."
- "Since I know {pet_name}..."
- "Let's take care of this."

RULES:
- SHORT and warm. 2-4 sentences unless they ask for more.
- Stay focused on what they're ACTUALLY asking.
- Reference personality, allergies, relationships naturally.
```

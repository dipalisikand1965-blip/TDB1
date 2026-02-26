# The Doggy Company - Pet Life Operating System (PRD)

## Original Problem Statement
Build "The Doggy Company" into a "Pet Life Operating System" where the AI assistant Mira behaves with a "soul" and contextual understanding of a human assistant. The application should have a "Unified Service Flow" where any user intent creates a service ticket, accessible from every part of the application.

## Core Architecture
- **Frontend:** React, Tailwind CSS, Socket.IO Client
- **Backend:** FastAPI, Asyncio
- **Database:** MongoDB Atlas
- **AI:** LLM-based conversational AI with deep context injection (Emergent LLM Key)

## NEW: Mira Pure Architecture (2026-02-26)
The legacy `mira_routes.py` (26,000+ lines) has been replaced by a new "Mira Pure" architecture:
- **Backend:** `backend/mira_pure.py` (~450 lines) - Clean GPT-5.1 function calling
- **Functions:** `backend/mira_pure_functions.py` (~500 lines) - Actions (picks, services, today, learn)
- **Frontend:** `frontend/src/pages/MiraPureOSPage.jsx` - Complete OS UI with modals

### Key Features of Mira Pure
- **Soulful AI**: Warm, human-like responses that reference pet's personality, allergies, chronic conditions
- **Function Calling**: AI can create service tickets, fetch picks, show today's actions, provide learning content
- **Full OS UI**: Header, Pet Selector, OS Tabs (Today, Picks, Services, Learn, Concierge), Pillar Tabs (10 pillars)
- **Context-Aware Quick Replies**: Change based on conversation and last action
- **Modals**: Pet Profile (Mojo), Picks, Services, Today, Learn, Concierge

## Key Features Implemented
- ✅ Soulful AI (Mira) with full pet context injection
- ✅ META Proactive OS System for contextual alerts
- ✅ Unified Service Flow architecture
- ✅ Real-time WebSocket notifications
- ✅ **NEW** Mira Pure OS Page (`/mira-pure-os`) with complete UI (2026-02-26)
- ✅ **NEW** OS Tabs: Today, Picks, Services, Learn, Concierge (2026-02-26)
- ✅ **NEW** Pillar Tabs: Celebrate, Dine, Care, Travel, Stay, Enjoy, Fit, Learn, Advisory, Services (2026-02-26)
- ✅ **NEW** Service creation via AI function calling (2026-02-26)
- ✅ **NEW** Services modal with real-time fetch from database (2026-02-26)
- ✅ **NEW** Pet profile modal showing soul score, personality, allergies, preferences (2026-02-26)
- ✅ **NEW** Picks modal with pillar-specific items (2026-02-26)
- ✅ **NEW** Context-aware quick replies (2026-02-26)

## Completed Work
- **2026-02-26:** Built complete Mira Pure OS page with:
  - Header with pet selector and soul score
  - OS Tabs (Today, Picks, Services, Learn, Concierge) with working modals
  - 10 Pillar tabs that change the picks grid content
  - Pet Profile (Mojo) modal showing personality, allergies, favorites
  - Services modal that fetches tickets from database
  - Picks modal with "Get for Mojo" and "Have Concierge create" buttons
  - Chat with soulful AI that creates service tickets via function calling
  - Quick replies that adapt to conversation context
  - Fixed services endpoint to fetch from correct collection
  - Fixed response model to include actions array
- **2025-02-25:** Fixed multiple legacy system bugs (context switching, concierge status, chat errors, etc.)

## In Progress
- [ ] P0: Complete remaining OS tab logic (Today, Learn content from backend)

## Known Issues
1. **Pet Soul Score not updating in UI** (P2) - Score should increment after AI interactions
2. **Password visibility toggle broken** (P3) - Non-functional on login page
3. **Admin vs Member inbox confusion** (P4) - UX clarity needed

## Upcoming Tasks
- Implement Soul Score growth logic within Mira Pure flow
- Add real learning content from bible documents to Learn modal
- Add real today actions based on calendar/reminders to Today modal
- Build "Paw Points" redemption flow at checkout

## Backlog
- Migrate from old `/mira-demo` to new `/mira-pure-os`
- Delete legacy `mira_routes.py` after migration
- WhatsApp Business integration
- Build 'Fit' and 'Work' pillars
- Premium "Club" membership features

## Key Files
### NEW Mira Pure System
- `frontend/src/pages/MiraPureOSPage.jsx` - Complete OS UI page
- `backend/mira_pure.py` - Chat endpoint with GPT-5.1 function calling
- `backend/mira_pure_functions.py` - Actions (picks, services, today, learn)

### Legacy System (to be deprecated)
- `frontend/src/pages/MiraDemoPage.jsx` - Old UI
- `backend/routes/mira_routes.py` - Old AI logic (26k+ lines)

## API Endpoints
### NEW Mira Pure Endpoints
- `POST /api/mira-pure/chat` - Soulful AI chat with function calling
- `GET /api/mira-pure/pets` - Get pets for Pure OS
- `GET /api/mira-pure/services` - Get service tickets
- `GET /api/mira-pure/health` - Health check

### Legacy Endpoints
- `POST /api/mira/chat` - Old AI chat
- `GET /api/proactive/alerts/{pet_id}` - META proactive alerts

## Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

## Service Request Data Model (Mira Pure)
```json
{
  "ticket_id": "TKT-XXXXXXXX",
  "type": "grooming|dog_walker|vet_visit|birthday_party|travel|boarding|other",
  "status": "pending|in_progress|completed",
  "priority": "normal|high|urgent",
  "pet_id": "...",
  "pet_name": "Mojo",
  "user_email": "dipali@clubconcierge.in",
  "description": "User's request message",
  "created_at": "2026-02-26T...",
  "source": "mira_pure"
}
```

## Pet Soul Data Model
```json
{
  "soul_data": {
    "personality": ["calm", "drama-queen", "motherly", "food-motivated"],
    "temperament": "gentle and observant",
    "energy_level": 4,
    "love_language": "quality time",
    "preferences": {
      "favorite_activities": ["walks", "napping", "being pampered"],
      "favorite_foods": ["chicken-free treats"],
      "favorite_toys": ["plush toys"]
    },
    "dislikes": ["loud noises", "being alone"],
    "quirks": ["always wants to be held"],
    "soul_completeness": 87
  },
  "health_data": {
    "allergies": ["chicken"],
    "chronic_conditions": "lymphoma",
    "sensitivities": []
  }
}
```

# Pet Soul Platform - Product Requirements Document

## Original Problem Statement
The user, Dipali, founder of a premium pet concierge service, wants to build a "soul" for pets through a digital platform. Key pillars are a "magical" and gamified "Soul Builder" onboarding, unifying the multiple "Mira" chat implementations into a single superior experience, and improving the overall UI/UX to feel "premium."

## Core Requirements (Non-Negotiable)
1. **Fix Mira's Intelligence & UX** - The main demo chat (`/mira-demo`) must be identical in intelligence, tone, format, and functionality to the superior `Mira OS BETA` experience.
2. **Build a Brilliant Onboarding** - Design and build the new, single-flow "Soul Builder."
3. **Unify the "Mira" Experience** - Consolidate the three different "Mira" implementations into one.
4. **Make Pillar Pages Magical** - Apply the new template from `/celebrate-new` to all other pillar pages.
5. **Fix Core Bugs** - Address any long-standing issues, such as data persistence.

## What's Been Implemented

### Session: February 21, 2026

#### P0 - Quick Replies Fix (COMPLETED ✅)
- **Issue**: Quick reply buttons on `/mira-demo` were showing generic navigational options ("View in Services", "Add one detail") instead of contextual conversation options like "Stick with kibble", "Add home-cooked"
- **Root Cause**: Three files were prioritizing `conversation_contract.quick_replies` over contextual `quick_replies` from the API response
- **Fix Applied**:
  1. `frontend/src/hooks/mira/useChatSubmit.js` (lines 1130-1149) - Now uses contextual quick replies first, falls back to generic only if none exist
  2. `frontend/src/pages/MiraDemoPage.jsx` (extractQuickReplies function) - Fixed priority order to check contextual replies before contract replies
  3. `frontend/src/components/Mira/ChatMessage.jsx` (lines 1030-1050) - Filters out navigational contract replies when contextual ones exist
- **Verified**: Testing agent confirmed 100% pass rate

#### P1 - Stale Soul Score on Dashboard (COMPLETED ✅)
- **Issue**: Dashboard showed 56% soul score for Lola while database stored 62.16%
- **Root Cause**: `/api/pets/my-pets` endpoint was recalculating score from `doggy_soul_answers` only, ignoring stored `overall_score` that grows through conversations
- **Fix Applied**: `backend/server.py` (lines 11202-11230) - Now uses `max(stored_score, calculated_score)` to ensure conversation-based growth is reflected
- **Verified**: API now returns 62.16% for Lola

### Previously Completed (From Handoff)
- **Mira Intelligence Parity** ✅ - `/mira-demo` now calls the same `/api/mira/chat` endpoint as BETA widget
- **Chat Intent Persistence** ✅ - `user_learn_intents` collection working correctly
- **Soul Score Growth** ✅ - Conversations increment pet's soul score in database

## Prioritized Backlog

### P0 (Immediate)
- None - All P0 issues resolved

### P1 (High Priority)
- [ ] Voice functionality testing on `/mira-demo` (ElevenLabs integration)
- [ ] Complete "Soul Builder" onboarding flow (`SoulBuilder.jsx`)

### P2 (Medium Priority)  
- [ ] Unify Mira chat components (legacy `MiraChatWidget` vs `MiraOSModal`)
- [ ] Rebuild `/mira-demo` using `MiraOSModal` as base
- [ ] Implement "Save & finish later" feature for Soul Builder

### P3 (Future)
- [ ] Implement "Read Receipts" for messages
- [ ] Refactor `backend/server.py` monolith
- [ ] Apply `/celebrate-new` template to all pillar pages

## Code Architecture
```
/app
├── backend
│   └── server.py        # Monolithic FastAPI server
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── Mira/
│   │   │   │   ├── ChatMessage.jsx     # Renders Mira's responses with quick replies
│   │   │   │   └── QuickReplies.jsx    # Generic quick reply generation
│   │   │   ├── mira-os/MiraOSModal.jsx # Superior chat modal (BETA widget)
│   │   ├── hooks
│   │   │   └── mira/
│   │   │       ├── useChatSubmit.js    # Main chat submission logic
│   │   │       └── useChat.js          # Chat helper functions
│   │   └── pages
│   │       ├── MiraDemoPage.jsx        # Premium chat page
│   │       ├── MemberDashboard.jsx     # User dashboard
│   │       └── SoulBuilder.jsx         # Onboarding flow (incomplete)
```

## Key API Endpoints
- `/api/mira/chat` - Primary intelligent chat endpoint (used by both `/mira-demo` and BETA widget)
- `/api/pets/my-pets` - Returns user's pets with overall_score (now uses max of stored vs calculated)

## Database Schema
- `pets` collection: Contains `overall_score`, `doggy_soul_answers`, `soul.learned_facts`
- `user_learn_intents` collection: Stores user interests from conversations

## Test Credentials
- **User Login**: `dipali@clubconcierge.in` / `test123`

## 3rd Party Integrations
- Google Places
- YouTube
- WhatsApp (Gupshup, Meta)
- Resend
- Shopify
- ElevenLabs
- Firebase

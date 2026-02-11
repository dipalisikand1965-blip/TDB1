# The Doggy Company - Mira AI Pet Companion

## Original Problem Statement
Build and maintain the Mira AI Pet Companion feature for The Doggy Company platform. Core philosophy: "Mira is the Soul & Brain, Concierge is the Hands" - a premium, personalized pet operating system, not generic e-commerce.

### Key Philosophy
- **Mira** = Soul & Brain (speaks for the pet)
- **Concierge** = Hands (makes it happen)
- The experience should make **the dog say "this was for me"** and **pet parents sigh with relief**
- This is a **Pet Operating System**, not e-commerce or chatbot

## Core Architecture
```
/app
├── backend (FastAPI)
│   ├── routes/
│   │   ├── mira_routes.py - Chat intent detection
│   │   └── top_picks_routes.py - Picks retrieval logic
│   ├── server.py - Main API with soul endpoints
│   └── utils/haptic.py
├── frontend (React)
│   └── src/
│       ├── components/
│       │   ├── Mira/
│       │   │   ├── MiraTopBar.jsx - Unified navigation
│       │   │   ├── PersonalizedPicksPanel.jsx - Picks component
│       │   │   ├── SoulFormModal.jsx - Quick soul questions
│       │   │   ├── PastChatsPanel.jsx - History with portal render
│       │   │   └── ...
│       │   ├── ProductCard.jsx - Contains ProductDetailModal
│       │   └── PicksVault/UnifiedPicksVault.jsx - Conversation picks
│       ├── pages/MiraDemoPage.jsx - Main demo page
│       └── hooks/mira/ - Custom hooks
```

## What's Been Implemented

### Latest Update: Feb 11, 2026 - Bug Fixes for Bank Demo

#### Bug Fixes (ALL VERIFIED - 100% Pass Rate)
1. **Scrolling Fix** - Added proper height constraints to main container, messages area scrolls correctly
2. **Soul Score Update** - onSoulUpdated now updates both `pet` and `allPets` state arrays
3. **Past Chats Background Bleed** - Rewrote PastChatsPanel with createPortal + backdrop
4. **Product Modal Centering** - ProductDetailModal rendered via createPortal to document.body

#### Files Changed:
- `/app/frontend/src/styles/mira-prod.css` - Container scroll fixes
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Portal for ProductDetailModal, soul score sync
- `/app/frontend/src/components/Mira/PastChatsPanel.jsx` - Complete rewrite with portal

### Previous Update: Feb 11, 2026 - UI/UX Overhaul

#### MiraTopBar Component
Created a unified top bar that consolidates all navigation and actions:
- Pet photo with Soul Score ring
- Pet name + Auto-detected location
- Dashboard button
- Action tabs: Picks, History, Reminders, Insights, Soul, Learn, Concierge®, New Chat

## Current Status
**Status: WORKING** (Verified Feb 11, 2026 via testing agent - iteration_147)

All 5 bug fix test flows passed:
- Page scrolling ✅
- Soul score update ✅
- Past Chats panel backdrop ✅
- Product modal centering ✅
- History button ✅

## Prioritized Backlog

### P0 - Immediate
- [x] Fix scrolling on /mira-demo
- [x] Fix soul score not updating
- [x] Fix background bleed-through (Past Chats)
- [x] Fix product modal centering
- [ ] User verification of fixes
- [ ] Enhancement suggestions for "bank demo ready"

### P1 - High Priority
- [ ] **BEGIN MIRA OS Implementation** on `/mira-os` page (Phase 1 per MIRA_OS_SPEC.md)
  - Create route and page file
  - Header, Pet Selector, Bottom Nav, FAB
  - Layer System architecture
- [ ] Verify Soul Score correctly syncs with /my-pets page
- [ ] Mobile UI & Haptics audit

### P2 - Medium Priority
- [ ] MIRA OS Phase 2: Core Layers (Mojo, Today, Picks, Services)
- [ ] MIRA OS Phase 3: Intelligence features
- [ ] ServiceQuickViewModal on /services page

### P3 - Low Priority / Future
- [ ] MIRA OS Phase 4: Polish (animations, offline support)
- [ ] Performance optimizations (page causes screenshot tool crashes)
- [ ] Review UnifiedPicksVault polish

## Key API Endpoints
- `POST /api/mira/os/understand-with-products` - Main chat endpoint
- `GET /api/mira/top-picks/{pet_name}` - Curated picks for pet
- `POST /api/pet-soul/profile/{pet_id}/answers/bulk` - Save multiple soul answers
- `GET /api/pet-soul/profile/{pet_id}` - Get pet soul profile
- `GET /api/past_chats` - Conversation history

## Database Schema
**pets collection:**
```json
{
  "id": "pet-xxxxx",
  "name": "Mojo",
  "doggy_soul_answers": {
    "energy_level": "High energy",
    "food_motivation": "Very food motivated",
    ...
  },
  "overall_score": 60.2,
  "score_tier": "soul_explorer",
  "soulScore": 60.2
}
```

## Test Credentials
- Email: dipali@clubconcierge.in
- Password: test123

## Key Documents
- `/app/MIRA_OS_SPEC.md` - Complete architecture specification for new MIRA OS build
- `/app/test_reports/iteration_147.json` - Latest test report (100% pass)

## Known Issues
- Screenshot tool crashes on /mira-demo due to high memory usage
- This is acknowledged and the new `/mira-os` build is designed to solve it

## 3rd Party Integrations Available
- Gupshup (WhatsApp integration)
- Resend (Email)
- YouTube API (Learn tab)

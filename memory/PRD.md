# Pet Soul - Mira OS Product Requirements Document

**Last Updated:** February 18, 2026

---

## Recent Changes (Feb 18, 2026)

### ✅ PICKS Panel Dynamic Shelves - COMPLETED
- Updated `PersonalizedPicksPanel.jsx` to render new dynamic shelves:
  - **Intent-Driven Shelf** - "{Pet} needs this for {Intent}" with Products + Services
  - **Personalized Shelf** - "✨ Personalized for {Pet}" horizontal scroll
  - **Celebrate Shelf** - Birthday items with cake designer link
- All shelves now rendering correctly with proper badges and styling
- Backend APIs `/api/mira/top-picks/{pet_id}` providing all data

---

## Original Problem Statement

Create a "Golden Standard Communication System" centered around an AI named "Mira." 

### Core Rules:
1. **"Uniform Service Flow"** - All actions create/attach to ticket spine (TCK-*)
2. **"Health-First Safety Rule"** - Health facts override preferences
3. **Mental Model**: "Chat is where you ask. Services is where it gets done."

### Architecture Philosophy:
- **MIRA = The Brain** - Understands pet, detects intent, generates recommendations
- **CONCIERGE = The Hands** - Executes, arranges, fulfills
- **Pet First Doctrine** - Everything is for THAT pet. "{Pet} needs this."

---

## 🧠 NEW: Intent-Driven Dynamic Cards Engine

**The Missing Piece: MIRA (Brain) → CONCIERGE (Hands)**

When user says "I want to house train Lola":
- OLD: Show generic products from catalogue
- NEW: Generate **dynamic Concierge cards** for exactly what the pet needs

### How It Works:
```
User Message: "I want to house train Lola"
    ↓
MIRA detects intent: "house_training"
    ↓
Generates Dynamic Cards:
    PICKS: Pee Pads, Training Treats, Enzymatic Cleaner (Concierge-sourced, no price)
    SERVICES: Dog Trainer, Puppy School, Home Visit Training (Concierge-arranged)
    ↓
Shelf Title: "Lola needs this for House Training"
Badge: "For Lola", "Lola needs this"
```

### Key Features:
- **No Price** - Concierge sources these (not from catalogue)
- **Always Personalized** - "{Pet} needs this for {Intent}"
- **Breed-Aware** - "Perfect for Malteses like Lola"
- **Intent Categories**: house_training, grooming, health_check, travel, food, boarding, walking, birthday, anxiety, etc.

### API Endpoint:
```
POST /api/mira/intent-driven-cards
{
  "message": "I want to house train Lola",
  "pet_name": "Lola",
  "pet_id": "pet-xxx",
  "pet_context": {"breed": "Maltese"}
}

Returns:
{
  "success": true,
  "intent": "house_training",
  "shelf_title": "Lola needs this for House Training",
  "picks": [...],  // Concierge-sourced (no price)
  "services": [...] // Concierge-arranged
}
```

### Files:
- `/app/backend/intent_driven_cards.py` - Core engine
- `/app/backend/personalized_products.py` - Personalized products engine
- `/app/backend/mira_routes.py` - API endpoints + Concierge sync fix
- `/app/backend/app/api/top_picks_routes.py` - Personalized shelf
- `/app/memory/INTENT_ENGINE_BIBLE.md` - **CANONICAL** documentation

---

## 🎁 NEW: Personalized Products Shelf

**"Personalized for {Pet}"** - ALWAYS shown proactively in PICKS:

| Product | Description | Badge |
|---------|-------------|-------|
| ☕ Custom Photo Mug | Pet's face on mug | For Lola |
| 🥤 Photo Coaster Set | Photo coasters | For Lola |
| 🎀 Custom Name Bandana | Embroidered name | For Lola |
| 🖼️ AI Pet Portrait | Artistic portrait | For Lola |
| 🏷️ Custom Collar Tag | Engraved tag | For Lola |
| 🧸 Lookalike Plush | Custom plush toy | For Lola |

**All go to Concierge** - no fixed price, Concierge creates.

---

## 🎂 NEW: Celebrate Integration

When birthday intent detected:
- Shows **"Celebrate {Pet}'s Birthday"** shelf
- Includes **Design Your Cake** → links to `/celebrate` tool
- Party kits, photo banners, birthday outfits

---

## 🧠 Mira Soul Integration - COMPLETE

**Mira now "knows" what the pet parent is thinking about across ALL OS layers:**

| Layer | Feature | Status |
|-------|---------|--------|
| **LEARN** | "{petName} might need this" guides | ✅ Working |
| **PICKS** | "{petName} might need this" products | ✅ Working |
| **SERVICES** | "{petName} might need this" services | ✅ Working |
| **INTENT** | Dynamic Concierge cards | ✅ NEW |
| **PERSONALIZED** | Photo products shelf | ✅ NEW |
| **CELEBRATE** | Birthday shelf + cake tool | ✅ NEW |

---

## Current System Status

| System | Status |
|--------|--------|
| One Spine | ✅ CERTIFIED |
| Notification System | ✅ FIXED |
| Ticket-to-Soul Enrichment | ✅ COMPLETE |
| LEARN Tab | ✅ WORKING |
| Soul Integration (LEARN/PICKS/SERVICES) | ✅ COMPLETE |
| Banned Opener Filter | ✅ IMPLEMENTED |
| PICKS Concierge Fallback | ✅ IMPLEMENTED |
| Intent-Driven Dynamic Cards | ✅ NEW - IMPLEMENTED |
| Uniform Service Flow | ✅ 95% COMPLETE |

---

## Prioritized Backlog

### P0 - Critical
- [x] ~~Soul Integration - LEARN~~ ✅
- [x] ~~Soul Integration - PICKS~~ ✅
- [x] ~~Soul Integration - SERVICES~~ ✅
- [x] ~~Banned Opener Filter~~ ✅
- [x] ~~PICKS Concierge Fallback~~ ✅
- [x] ~~Intent-Driven Dynamic Cards Engine~~ ✅ NEW
- [ ] **UI: "Test Scenarios" Panel** - Move to bottom sheet
- [ ] **UI: "Concierge Replied" Banner** - Compact banner

### P1 - High Priority
- [ ] **Frontend Integration** - Wire intent-driven cards to PICKS/SERVICES panels
- [ ] **TODAY Soul Integration** - Contextual TODAY content
- [ ] **"All pets" toggle** in notifications
- [ ] **Soul-Capture Onboarding** - 8-10 steps

### P2 - Medium Priority
- [ ] WhatsApp Webhook Idempotency
- [ ] Legacy Ticket Migration
- [ ] Weight History Timeline
- [ ] Training History & Progress Notes

---

## Test Credentials

```
Email: dipali@clubconcierge.in
Password: test123
URL: /mira-demo

Admin: aditya@thedoggycompany.in / lola4304
```

---

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| POST `/api/mira/chat` | Main chat |
| POST `/api/mira/intent-driven-cards` | **NEW** - Get dynamic cards for intent |
| GET `/api/os/learn/home?pet_id=X` | LEARN panel content |
| GET `/api/mira/top-picks/{pet_id}` | PICKS panel content |
| GET `/api/os/services/launchers?pet_id=X` | SERVICES panel content |

---
| **P0: Banned Opener Filter** | ✅ FIXED | Post-processing filter removes "Great idea!", "I'd be happy to" etc. |
| **P0: PICKS Concierge Fallback** | ✅ FIXED | Shows "Concierge Arranges" cards instead of empty state |
| **P1: Icon State System** | ✅ VERIFIED | Already implemented in `useIconState.js` |

### Files Modified:
- `/app/backend/mira_routes.py` - Added `filter_banned_openers()` function
- `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` - Concierge fallback UI

### Remaining Gaps (Not Yet Addressed):
- P0: Emergency Two-Tier Triage (partially implemented, needs testing)
- P1: Weight History Timeline
- P1: Training History & Progress Notes
- P1: Climate Field & Seasonal Risks

---

## Current System Status

| System | Status |
|--------|--------|
| One Spine | ✅ CERTIFIED |
| Notification System | ✅ FIXED |
| Ticket-to-Soul Enrichment | ✅ COMPLETE |
| LEARN Tab | ✅ WORKING |
| Soul Integration (LEARN/PICKS/SERVICES) | ✅ COMPLETE |
| Banned Opener Filter | ✅ IMPLEMENTED |
| PICKS Concierge Fallback | ✅ IMPLEMENTED |

---

## Prioritized Backlog

### P0 - Critical
- [x] ~~Soul Integration - LEARN~~ ✅
- [x] ~~Soul Integration - PICKS~~ ✅
- [x] ~~Soul Integration - SERVICES~~ ✅
- [x] ~~Banned Opener Filter~~ ✅
- [x] ~~PICKS Concierge Fallback~~ ✅
- [ ] **UI: "Test Scenarios" Panel** - Move to bottom sheet
- [ ] **UI: "Concierge Replied" Banner** - Compact banner

### P1 - High Priority
- [ ] **TODAY Soul Integration** - Contextual TODAY content
- [ ] **"All pets" toggle** in notifications
- [ ] **Soul-Capture Onboarding** - 8-10 steps
- [ ] **Emergency Two-Tier Triage** - Full testing

### P2 - Medium Priority
- [ ] WhatsApp Webhook Idempotency
- [ ] Legacy Ticket Migration
- [ ] Weight History Timeline
- [ ] Training History & Progress Notes

### P3 - Backlog
- [ ] Refactor monoliths
- [ ] Climate Field & Seasonal Risks

---

## Test Credentials

```
Email: dipali@clubconcierge.in
Password: test123
URL: /mira-demo

Admin: aditya@thedoggycompany.in / lola4304
```

---

## Key API Endpoints

| Endpoint | Soul Integration |
|----------|-----------------|
| POST `/api/mira/chat` | Captures intents |
| GET `/api/os/learn/home?pet_id=X` | Returns `from_your_chat` shelf |
| GET `/api/mira/top-picks/{pet_id}` | Returns `timely_picks` shelf |
| GET `/api/os/services/launchers?pet_id=X` | Returns `timely_services` shelf |

---

## 3rd Party Integrations

Google Places, YouTube, WhatsApp, Resend, Shopify, ElevenLabs, Firebase

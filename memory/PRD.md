# Pet Soul - Mira OS Product Requirements Document

**Last Updated:** February 18, 2026 (17:05 UTC)

---

## 🚨 GOLDEN STANDARD: UNIFIED SERVICE FLOW - NEVER FORGET 🚨

**EVERY USER INTENT from ANYWHERE (Chat, Search, PICKS, Vault, FAB, Mobile, Desktop) MUST create:**

```
User Request 
    → Service Desk Ticket 
    → Admin Notification 
    → Member Notification 
    → Pillar Request 
    → Tickets 
    → Channel Intakes
```

**WHY:** The Concierge® sits BEHIND the Service Desk and answers ALL requests. Without this flow, requests get lost and users never hear back.

**ENFORCEMENT CHECKLIST:**
| Step | Collection | Purpose |
|------|------------|---------|
| 1. Service Desk Ticket | `service_desk_tickets` | Admin sees in Command Center |
| 2. Admin Notification | `admin_notifications` | Admin bell icon alert |
| 3. Member Notification | `member_notifications` | User bell icon confirmation |
| 4. Pillar Request | `concierge_requests` / context-specific | Original request details |
| 5. Legacy Tickets | `tickets` | Backward compatibility |
| 6. Channel Intakes | `channel_intakes` | Unified inbox |

**NO EXCEPTIONS.** Mobile = Desktop = PWA = Any Device. Same plumbing.

---

## ⚠️ CRITICAL: DEPLOYMENT BIBLE - READ BEFORE EVERY DEPLOY ⚠️

### 🚨 FRONTEND URL FIX (MUST DO BEFORE EVERY DEPLOYMENT)

**Problem:** Each new Emergent session/fork resets `REACT_APP_BACKEND_URL` to the preview URL. Production will NOT work until this is fixed.

**Fix:** Before deploying to production, ALWAYS run:
```bash
# Check current value
cat /app/frontend/.env | grep REACT_APP_BACKEND_URL

# If it shows preview URL, fix it:
sed -i 's|REACT_APP_BACKEND_URL=.*|REACT_APP_BACKEND_URL=https://thedoggycompany.in|' /app/frontend/.env

# Restart frontend
sudo supervisorctl restart frontend

# Then DEPLOY
```

**Why this happens:** Emergent preview environment uses its own URL. When you fork/start a new session, it resets to preview. Production site (thedoggycompany.in) needs the production URL.

| Environment | REACT_APP_BACKEND_URL |
|-------------|----------------------|
| Preview (Emergent) | https://concierge-fix.preview.emergentagent.com |
| **Production** | **https://thedoggycompany.in** ← ALWAYS SET THIS BEFORE DEPLOY |

**YOUR WORK IS NOT GONE** - it's just pointing to the wrong backend URL!

---

## Recent Changes (Feb 18, 2026)

### ✅ PICKS Panel Dynamic Shelves - COMPLETED
- Updated `PersonalizedPicksPanel.jsx` to render new dynamic shelves:
  - **Intent-Driven Shelf** - "{Pet} needs this for {Intent}" with Products + Services
  - **Personalized Shelf** - "✨ Personalized for {Pet}" horizontal scroll
  - **Celebrate Shelf** - Birthday items with cake designer link
- All shelves now rendering correctly with proper badges and styling
- Backend APIs `/api/mira/top-picks/{pet_id}` providing all data

### ✅ MOJO Bible P1 Fields - COMPLETED
Added new data models and API endpoints for MOJO Bible compliance:

1. **Weight History Timeline** - Track weight changes over time
   - `GET/POST /api/pet-soul/profile/{pet_id}/weight-history`
   - Supports trend analysis (gaining/losing/stable)
   - Target weight tracking

2. **Training History & Progress Notes** - Track skill mastery
   - `GET/POST /api/pet-soul/profile/{pet_id}/training-history`
   - Skills: not_started → in_progress → mastered
   - Stats: mastered count, current focus skills

3. **Environment & Climate Profile** - Pet's living context
   - `GET/POST /api/pet-soul/profile/{pet_id}/environment`
   - City, climate zone, housing type, AC status
   - Auto-calculated seasonal risks (monsoon, heat stroke, etc.)
   - Integrates with breed_knowledge.py climate data

### ✅ MOJO Bible P0 Items - ALREADY IMPLEMENTED
Verified existing implementations:
- ✅ Banned Opener Filter (mira_routes.py lines 220-305)
- ✅ Emergency Two-Tier Triage (14 references in mira_routes.py)
- ✅ PICKS Concierge Fallback (PersonalizedPicksPanel.jsx lines 1738+)
- ✅ Icon State System (useIconState.js - OFF/ON/PULSE)

### ✅ Smart Fallback Picks - COMPLETED
When no chat intents exist, Mira still shows intelligent picks based on:
- **Breed knowledge** - "Golden Retrievers like Lola love this"
- **Seasonal context** - Mumbai monsoon = tick prevention
- **Life stage** - Puppy training, senior joint care
- **File:** `top_picks_routes.py` function `get_smart_fallback_picks()`

---

## 🔴 CRITICAL BUGS TO FIX

### ✅ FIXED (Feb 18, 2026): Member Notification Bug
- **Problem:** Users didn't receive notifications when sending concierge requests
- **Root Cause:** Multiple endpoints missing member notification creation
- **Fix Applied:**
  - Added member notification to `central_signal_flow.py` (centralized fix)
  - Fixed individual endpoints that didn't use central flow
  - Frontend now passes `user_email` to all concierge endpoints
- **Files Changed:**
  - `/app/backend/central_signal_flow.py` (CENTRAL FIX - step 4 added)
  - `/app/backend/concierge_routes.py`
  - `/app/backend/mira_routes.py`
  - `/app/frontend/src/components/mira-os/MiraOSModal.jsx`

### ✅ FIXED (Feb 18, 2026): City Not Persisted (P2)
- **Problem:** Pet profile had `city: null`
- **Fix Applied:**
  - Added `city` and `pincode` fields to `PetProfileUpdate` model
  - Updated onboarding to save city from parent to pet
  - Ran migration to backfill city from owner to pets
- **Files Changed:**
  - `/app/backend/models.py`
  - `/app/backend/auth_routes.py`

### ✅ IMPLEMENTED (Feb 18, 2026): Outlook-Style Inbox Drawer
- Created `ConciergeInboxDrawer.jsx` component
- Modified `NotificationBell.jsx` to open drawer instead of navigating
- Added `/api/service_desk/tickets/{id}/reply` endpoint for member replies
- **Files Created/Changed:**
  - `/app/frontend/src/components/Mira/ConciergeInboxDrawer.jsx` (NEW)
  - `/app/frontend/src/components/Mira/NotificationBell.jsx` (MODIFIED)
  - `/app/backend/mira_service_desk.py` (ADDED member_reply endpoint)

### 1. Intent Capture (P1) - VERIFIED WORKING
- **Status:** NOT A BUG - Intent capture IS working
- **Evidence:** `user_learn_intents` collection has data, test message captured "health/tick" intent at 16:53:10
- **Collection:** `user_learn_intents` has 3+ records

### 2. Pet Memory Allergy Test (P3)
- Logic for "Health-First Safety Rule" not investigated

---

## 📋 UPCOMING TASKS (Priority Order)

1. 🔧 **Fix intent capture** - Debug DB storage
2. 📍 **Add city to pet profile** - Onboarding update  
3. 📬 **Build Concierge Inbox** - Outlook-style drawer (see `/app/memory/CONCIERGE_INBOX_SPEC.md`)
4. 🎨 **P1 Frontend UIs** - Weight chart, training tracker in MojoProfileModal

---

## 📁 SPEC DOCUMENTS

| Document | Purpose |
|----------|---------|
| `/app/memory/GOLDEN_STANDARD_UNIFIED_FLOW.md` | **MANDATORY** - All endpoints MUST follow this |
| `/app/memory/DEPLOYMENT_BIBLE.md` | Deploy URL fix |
| `/app/memory/CONCIERGE_INBOX_SPEC.md` | Outlook-style inbox design |
| `/app/memory/SOUL_ONBOARDING_REBUILD_PROPOSAL.md` | Onboarding gaps |
| `/app/memory/SYSTEMS_INVENTORY.md` | All personalization systems |
| `/app/memory/AGENT_HANDOFF_FEB18.md` | Full context for next agent |

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

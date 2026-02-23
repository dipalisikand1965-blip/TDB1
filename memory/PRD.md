# Mira Pet OS - Product Requirements Document (SSOT)
## Single Source of Truth - Last Updated: February 23, 2026

---

## 🎯 ORIGINAL PROBLEM STATEMENT

**Mira** is a "pet operating system" centered around **Soul Intelligence** (a pet personality system) and an AI concierge. The goal is to move beyond standard e-commerce and create a high-touch, personalized experience where curated recommendations for products and services are dynamically generated based on a pet's unique soul profile.

**Core Vision**: "Mira is the soul, the Concierge controls the experience, and the System is the capillary enabler."

**Key Principle**: Every concierge action must create a service desk ticket and trigger real-time notifications, capturing user intent and enabling a premium, consultative service model.

---

## 📋 CURRENT SESSION WORK (Feb 23, 2026)

### ✅ COMPLETED TODAY

| Task | Status | Files |
|------|--------|-------|
| P0: Verify navigation fix (no /inbox redirect) | ✅ VERIFIED | Testing confirmed page stays on `/dine/meals` after CTA click |
| P1: Update Mira chat quick chips for Fresh Meals | ✅ DONE | `MiraChatWidget.jsx` - Line 308, 1155 |
| P2: Hero text contrast improvement | ✅ DONE | `MealsPage.jsx` - Stronger gradient overlay |
| P2: Ask Mira orb size reduction | ✅ DONE | `MiraChatWidget.jsx` - Line 1223 size='sm' |
| /dine page restructure | ✅ DONE | `DinePage.jsx` - New category cards, combined Dine Out section |
| Dine Essentials - Feeding Tools seeding | ✅ DONE | 6 new products in `dine_bundles` collection |
| Dine Essentials - Supplements seeding | ✅ DONE | 6 new products in `dine_bundles` collection |
| Dine Essentials - Category pills UI | ✅ DONE | `DinePage.jsx` - All, Feeding Tools, Supplements, Gift Kits |
| Dining Products - Load More | ✅ DONE | `DinePage.jsx` - 3 rows + load more button |

### ✅ PREVIOUSLY COMPLETED

| Task | Status | Files |
|------|--------|-------|
| Fixed `/dine` page crash | ✅ DONE | `MealsPage.jsx` - removed duplicate JSX |
| Phase 1: Fresh Meals UI Fixes | ✅ DONE | `MealsPage.jsx` - petAvoid prop, placeholder |
| Phase 2: FlowModal Engine | ✅ DONE | `FlowModal.jsx`, `freshMealsFlows.js` |
| Universal Service Command Hook | ✅ DONE | `useUniversalServiceCommand.js` |
| Fresh Meals Curated Picks (4 cards) | ✅ DONE | `FreshMealsCuratedPicks.jsx`, `fresh_meals_concierge_cards.py` |
| Removed duplicate floating buttons | ✅ DONE | `MealsPage.jsx` |

---

## 🗂️ /DINE PAGE STRUCTURE (NEW ORDER)

1. **Curated Picks** - Mira's personalized picks for active pet
2. **Need Dining Help?** - DiningConciergePicker widget
3. **Elevated Concierge®** - Private Chef, VIP Access, Birthday Package
4. **Explore Dine Categories** (5 cards):
   - Fresh Meals → `/dine/meals` (Gold Standard)
   - Treats → `/celebrate/treats`
   - Frozen → `/celebrate/treats` (temporary)
   - Feeding Tools → Dine Essentials section
   - Supplements → Dine Essentials section
5. **🍽️ Dine Out Section** (combined):
   - Buddy Meetups card
   - Concierge® Featured Restaurants (with Load More)
   - Pet Cafes Near Me (city search)
6. **Dine Essentials** (with category pills):
   - All | Feeding Tools | Supplements | Gift Kits
   - 17 total products seeded
7. **Dining Products** - 3 rows + Load More
8. **Own a Pet-Friendly Restaurant?** - CTA for partners

---

## 🏗️ ARCHITECTURE

### File Structure
```
/app/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   ├── fresh_meals_concierge_cards.py  # NEW - 4 curated cards
│   │   │   ├── dine_concierge_cards.py
│   │   │   └── celebrate_concierge_cards.py
│   │   └── intelligence_layer.py  # MODIFIED - added fresh_meals support
│   └── server.py
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── FlowModal.jsx                    # NEW - Multi-step intake engine
│       │   ├── UniversalServiceButton.jsx       # NEW - Floating help button
│       │   ├── FreshMealsCuratedPicks.jsx       # NEW - 4 curated cards display
│       │   └── mira-os/
│       │       └── index.js                     # MODIFIED - exports USC
│       ├── hooks/
│       │   └── useUniversalServiceCommand.js    # NEW - Central request submission
│       ├── schemas/
│       │   └── freshMealsFlows.js               # NEW - 3 flow schemas (5 steps each)
│       └── pages/
│           └── MealsPage.jsx                    # MODIFIED - Fresh Meals Gold Standard
│
└── memory/
    ├── PRD.md                                   # THIS FILE
    └── CHANGELOG.md
```

### Unified Service Command Flow (INTENDED)
```
User Intent (any entry point)
    ↓
useUniversalServiceCommand.submitRequest()
    ↓
POST /api/service-requests
    ↓
Ticket Created (TKT-xxx)
    ↓
Admin Notification (service desk queue)
    ↓
Member Notification (toast + action button)
    ↓
User stays on page (can click "Open request" to view ticket)
```

### Current Flow (ACTUAL - BUGGY)
```
User clicks card CTA
    ↓
submitRequest() called
    ↓
Ticket created ✅
    ↓
Page navigates to /inbox ❌ (should stay on page)
```

---

## 📦 NEW FILES CREATED THIS SESSION

### 1. `/app/frontend/src/schemas/freshMealsFlows.js`
- **Purpose**: Schema definitions for FlowModal
- **Contains**: 
  - `TRIAL_PACK_SCHEMA` (5 steps)
  - `WEEKLY_PLAN_SCHEMA` (5 steps)
  - `ALLERGY_SAFE_SCHEMA` (5 steps)
  - `resolvePrefill()` helper
  - `saveDraft()`, `loadDraft()`, `clearDraft()` for localStorage
  - `buildTicketPayload()` for uniform ticket structure

### 2. `/app/frontend/src/components/FlowModal.jsx`
- **Purpose**: Reusable multi-step intake wizard
- **Features**:
  - Progress bar (step X/5)
  - Constraint enforcement (blocked proteins disabled)
  - Draft persistence to localStorage
  - Resume from previous progress
  - Ticket creation on final Submit only
- **BUG**: Still navigates to /inbox after submit

### 3. `/app/frontend/src/hooks/useUniversalServiceCommand.js`
- **Purpose**: Central hook for ALL service requests
- **Exports**:
  - `submitRequest()` - main function
  - `quickInquiry()` - text-based quick help
  - `askMira()` - from Mira chat
  - `searchIntent()` - from search bar
  - `conciergeRequest()` - from C® button
  - `ENTRY_POINTS` - enum of all entry points
  - `REQUEST_TYPES` - enum of request types
- **Config**: `navigateToInbox` param controls navigation

### 4. `/app/frontend/src/components/UniversalServiceButton.jsx`
- **Purpose**: Floating "Need Help?" button with quick intake modal
- **Variants**: floating, inline, minimal, header
- **Status**: REMOVED from MealsPage (was redundant with C®)

### 5. `/app/frontend/src/components/FreshMealsCuratedPicks.jsx`
- **Purpose**: Display 4 personalized curated cards
- **Features**:
  - Fetches from Intelligence Layer API
  - Falls back to static cards if API fails
  - Pet name personalization
  - Allergy-aware badge
  - Uses Universal Service Command for submissions
- **BUG**: Still navigates to /inbox

### 6. `/app/backend/app/data/fresh_meals_concierge_cards.py`
- **Purpose**: Backend card definitions
- **Cards**:
  1. Custom Fresh Meal Plan (product)
  2. Fresh Food Transition (product, Popular badge)
  3. Fresh Nutrition Consultation (service, Expert badge)
  4. Kitchen Partner Introduction (service, Local badge)
- **Features**:
  - Persona-based scoring
  - Why phrases based on traits
  - Question templates

---

## 🔧 KEY CONFIGURATION

### Credentials
- **Member Login**: `dipali@clubconcierge.in` / `test123`
- **Admin Login**: `aditya` / `lola4304`

### URLs
- **Frontend**: `https://concierge-pillars.preview.emergentagent.com`
- **Fresh Meals Page**: `/dine/meals`
- **Admin Service Desk**: `/admin/service-desk`
- **API**: `/api/service-requests`

### Pet Data (Mystique)
- Has chicken allergy → triggers constraint enforcement
- Allergy-safe auto-on when pet has allergies
- Chicken protein chip disabled on page AND in FlowModal

---

## 🐛 BUGS TO FIX (PRIORITY ORDER)

### P0: Navigation Bug
**Problem**: Card CTAs navigate to `/inbox?ticket=xxx` instead of staying on page
**Location**: 
- `/app/frontend/src/components/FreshMealsCuratedPicks.jsx` line ~215
- `/app/frontend/src/components/FlowModal.jsx` line ~513
**Attempted Fix**: Set `navigateToInbox: false` - NOT VERIFIED WORKING
**Root Cause**: Need to trace where navigation is happening

### P1: Toast Visibility
**Problem**: Success toast may not be showing or may be hidden
**Expected**: "Request sent to Concierge®" with "Open request" action button

### P2: Inbox Page Empty
**Problem**: `/inbox` page shows footer only, no content
**Impact**: Users can't see their tickets in inbox

---

## 📝 WHAT USER WANTED (FROM MESSAGES)

1. **Unified Service Command** - ✅ Built but has navigation bug
2. **Stay on page after submit** - ❌ Still navigates away
3. **Toast with action button** - ⚠️ Not verified
4. **Admin can see tickets** - ✅ Verified via API (tickets ARE created)
5. **MiraOrb leave as is** - ✅ Not touched
6. **Chips on top = Fresh Meals curated** - ✅ 4 curated cards displayed

---

## 🔜 NEXT STEPS FOR NEW AGENT

1. **FIX THE NAVIGATION BUG** - This is P0
   - Check if `navigateToInbox: false` is actually being respected
   - Check `useUniversalServiceCommand.js` line ~170 for navigation logic
   - May need to remove `navigate()` calls entirely

2. **Verify toast is showing** - Take screenshot after CTA click

3. **Test the full flow**:
   - Click card CTA
   - Ticket should be created (verify via `/api/tickets`)
   - Page should NOT navigate
   - Toast should appear with "Open request" button

4. **After fixing bugs, continue with**:
   - Replicate Gold Standard to Treats, Chews, Supplements
   - Integrate USC into other pillars

---

## 📊 TICKETS CREATED (VERIFIED WORKING)

Recent tickets from API:
- `TKT-B5022AD3` - Kitchen Partner Introduction (Bruno)
- `TKT-51FC2FC1` - Fresh Food Transition
- `TKT-6D262998` - Fresh Nutrition Consultation (Mystique)

**Ticket creation is working correctly. The bug is the UI behavior after creation.**

---

## 🚨 CRITICAL NOTES

1. **User is frustrated** - They've asked for SSOT/handover multiple times
2. **Don't navigate away** - This is the main pain point
3. **Tickets ARE being created** - Backend is working, frontend behavior is the issue
4. **Test before claiming fixed** - Previous "fixes" weren't verified

---

*Document created: Feb 23, 2026*
*Last working on: Navigation bug in Unified Service Command*

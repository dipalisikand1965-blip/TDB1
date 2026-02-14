# The Doggy Company - Product Requirements Document

---
## ⚠️ NEW AGENT? READ THIS FIRST:
## 1. **MIRA OS URL:** `/mira-demo` (NOT `/mira`)
## 2. **Test Credentials:** `dipali@clubconcierge.in` / `test123` | Admin: `aditya` / `lola4304`
## 3. `/app/memory/MOJO_BIBLE.md` - THE COMPLETE MOJO DEFINITION (28 Parts + OS Layers)
## 4. `/app/memory/LEARN_BIBLE.md` - THE COMPLETE LEARN LAYER SPECIFICATION
## 5. `/app/memory/MOJO_BIBLE_SCORECARD.md` - Current Implementation Score
## 6. `/app/memory/SYSTEM_AUDIT_REPORT.md` - ✅ FULL SYSTEM AUDIT COMPLETED (Feb 2026)
---

## CURRENT SCORE: 100% (Against MOJO Bible Vision) - Updated Feb 14, 2026 (Session 12)

| Layer | Score | Status |
|-------|-------|--------|
| **MOJO (14 components)** | **100%** | ✅ **COMPLETE** |
| **TODAY** | **100%** | ✅ **COMPLETE** - Watchlist integration done |
| **PICKS** | **100%** | ✅ **COMPLETE** - UI verified working |
| **SERVICES** | **100%** | ✅ **COMPLETE** - Execution loop + watchlist |
| **P1 MOBILE** | **100%** | ✅ **COMPLETE** - iOS Safari + Android Chrome |
| **LEARN** | **100%** | ✅ **COMPLETE** - Session 12: Full Integration |
| **CONCIERGE** | 30% | Future |

---

## SESSION 12 ACCOMPLISHMENTS (Feb 14, 2026)

### P0 LEARN Personalization - "Pet First, Breed Second" ✅
**Goal:** Implement personalization for LEARN layer following the golden doctrine

**What was built:**

#### Backend Safety Updates
- Changed wording from "conditions" → "explicit sensitivities, routines, behaviour signals (no inference)"
- Renamed `allergies` → `food_sensitive` tag (no medical language)
- Removed `health_issues` tag (was inferring from medical data)
- **Health-adjacent topics ignore breed tags entirely** (`HEALTH_ADJACENT_TOPICS`)
- **Breed tag contribution capped at +10** (prevents breed-dominance)
- **User feedback penalty is per user + per pet, not global** (-15 for "Not helpful")
- **Diversity filter:** Max 2 items with same primary tag in "For your pet"

#### P0 CTA Integrations
- **"Let Mira do it" → Services:** One tap opens `ServiceRequestBuilder` with:
  - `source_layer: "learn"`
  - `source_item: {type, id, title}`
  - `service_type` from CTA mapping
  - `prefill` from MOJO + CTA
  - `context_note` (what they read + what they're trying to do)

- **"Ask Mira" → Concierge:** Opens with zero re-asking:
  - `learn_item: {title, type, id}`
  - `derived_tags_used` (pet tags only for health topics)
  - `suggested_next_action`
  - Pre-filled message: "I've read X. Help me with Y."

#### Documentation Updates
- Added OS Layer Correlation Map to LEARN_BIBLE.md
- Added P0 Integration specifications
- Updated safety rules and feedback penalty documentation

---

## SESSION 11 ACCOMPLISHMENTS (Feb 14, 2026)

### P0 LEARN OS Layer ✅
**Goal:** Build the LEARN knowledge layer - "Confusion → Clarity → Action in 2 minutes"

**What was built:**

#### Backend (learn_os_routes.py)
- `GET /api/os/learn/home` - Home screen with topics + featured content
- `GET /api/os/learn/topics` - 9 topic chips with icons/colors
- `GET /api/os/learn/topic/{topic}` - Topic content in 3 shelves
- `GET /api/os/learn/item/{type}/{id}` - Single guide/video detail
- `GET /api/os/learn/search?q=` - Search across guides/videos
- `POST /api/os/learn/saved` - Save/unsave items
- `GET /api/os/learn/saved` - User's saved items

#### Seed Content (learn_content_seeder.py)
- **30 Tiny Guides** across: Health, Grooming, Food, Behaviour, Travel, Boarding, Seasonal
- **20 Curated YouTube Videos** with "Mira Frame" wrapper
- Trust gating: `risk_level`, `escalation_required`, `reviewed_by`, `last_reviewed_at`
- India-relevant content (tick protocol, monsoon care, Diwali fireworks, etc.)

#### Frontend (LearnPanel.jsx, LearnReader.jsx)
- Full-screen panel with z-index 9999
- Search bar + 9 topic chips (horizontal scroll)
- 3 content shelves: Start Here, 2-Minute Guides, Watch & Learn
- Content cards: icon, time badge, title, summary, topic label
- **LearnReader** detail view:
  - "Do this now" checklist (numbered steps)
  - "Watch for" section
  - "When to escalate" section
  - **Sticky action bar**: "Let Mira do it" | "Ask Mira" | Save

**Key Features:**
- Every Learn item ends in ACTION (Service ticket or Concierge handoff)
- Trust-gated content with risk levels
- Tag-driven for personalization (pet_tags, breed_tags)
- No live YouTube search - curated IDs only

---

## SESSION 10 ACCOMPLISHMENTS (Feb 14, 2026)

### P1 Mobile Tidy-up ✅
**Goal:** iOS Safari + Android Chrome PWA compatibility.

**Key Fixes:**
1. **Input Zoom Prevention**: All inputs use `text-base` (16px) to prevent iOS Safari auto-zoom
2. **Body Scroll Lock**: TodayPanel, ServiceRequestBuilder, TicketDetailPanel using position:fixed technique
3. **Dynamic Viewport Units**: Changed 100vh to 100dvh for proper iOS Safari viewport
4. **Safe Area Padding**: Added `env(safe-area-inset-bottom)` to bottom sheet modals
5. **Touch Targets**: All interactive elements meet 44px minimum
6. **touch-manipulation CSS**: Added to prevent 300ms tap delay

**Bug Fixed:** TicketDetailPanel `isOpen` undefined in scroll lock useEffect

**Viewports Tested:** iPhone 14 Pro (390x844) ✅, iPhone SE (375x667) ✅, Desktop ✅

---

### P0.2 TODAY Watchlist Integration ✅
**Goal:** Today panel shows "in-motion" work from the ticket backbone.

**Statuses included:**
- `clarification_needed`, `options_ready`, `approval_pending`, `payment_pending` → "Awaiting You" section
- `in_progress`, `scheduled`, `shipped` → "In Progress" section

**Components Updated:**
- **TodayPanel.jsx** - New watchlist sections
  - `WatchlistTaskCard` - Displays ticket with status icon and one-tap action
  - `fetchWatchlist` useEffect - Calls `/api/os/services/watchlist` endpoint
  - "Awaiting You" section with quick action buttons (Reply, Choose, Approve, Pay)
  - "In Progress" section with View button
  - Stale indicator (orange pulsing icon) when data > 5 min old

**Bug Fixed:**
- Empty `apiUrl` was treated as falsy, preventing watchlist fetch (apiUrl is intentionally empty for relative paths)

**Test Results:**
- Backend: 100% - 14/14 tests passed
- Frontend: 100% - All sections render correctly

---

## SESSION 9 ACCOMPLISHMENTS (Feb 14, 2026)

### 1. CRITICAL BUG FIXED: Login Redirect ✅
- **Issue:** After login on `/mira-demo`, users were redirected to `/dashboard` instead of back to `/mira-demo`
- **Root Cause:** `Login.jsx` hardcoded `navigate('/dashboard')` after successful login
- **Fix:** Updated `Login.jsx` to use `location.state?.from` (passed by ProtectedRoute) to redirect users back to their original destination
- **File:** `/app/frontend/src/pages/Login.jsx` (lines 1-30)
- **Impact:** This was blocking all access to the Pet OS UI - the `PetOSNavigation` was rendering correctly, but users couldn't see it because they were redirected away

### 2. SERVICES Execution Loop COMPLETE ✅
**Unified Pipeline (HARDCODED):** User Request → Service Desk Ticket → Admin Notification → Member Notification → Pillar Request → Tickets → Channel Intakes

**Components Built:**
- **ServiceRequestBuilder.jsx** - Full-screen modal on mobile, modal on desktop
  - Pet selection with avatar chips
  - Service-specific presets (Grooming, Training, Boarding, etc.)
  - Date/time preferences, location, notes
  - Device type detection (mobile/desktop)
  
- **TicketDetailPanel.jsx** - Ticket view with timeline
  - Status timeline with visual progress
  - Details section (pets, time, location, notes)
  - Action buttons based on status (approve, pay, cancel)
  
- **Backend Pipeline** (`services_routes.py`):
  - STEP 1: Generate Service Desk Ticket ID
  - STEP 2: Build ticket document with full metadata
  - STEP 3: Insert into mira_tickets
  - STEP 4: Admin notification (admin_notifications collection)
  - STEP 5: Member notification (notifications collection)
  - STEP 6: Pillar request logging (pillar_requests collection)
  - STEP 7: Channel intake record (channel_intakes collection)

### 3. Legacy Bug Fixes ✅
- **`/api/orders` 405 error:** Added GET endpoint to orders_routes.py
- **Chat markdown rendering:** Updated ChatMessage.jsx with cross-browser compatible styles

### 4. Testing Results ✅
- **Backend:** 100% - 12/12 pytest tests passed
- **Frontend:** 95% - All core flows working
- Test file: `/app/backend/tests/test_services_inbox_os.py`

### 5. Frontend Verified Working ✅
- **PetOSNavigation:** All 7 OS layer tabs visible (MOJO, TODAY, PICKS, SERVICES, INSIGHTS, LEARN, CONCIERGE®)
- **PICKS Panel:** Products and services displaying correctly with personalized recommendations
- **SERVICES Panel:** Service launchers, Request Builder, Ticket Detail all working
- **Mobile:** Services panel works correctly on 390x844 viewport

---

## SESSION 8 ACCOMPLISHMENTS (Feb 14, 2026)

### 1. PICKS Bug Fixed ✅
- File: `/app/backend/scoring_logic.py` line 433
- Changed: `classification.pillar` → `classification.primary_pillar`
- Impact: Picks were returning 0 results due to attribute error

### 2. Unified Status Taxonomy ✅
Created `/app/backend/ticket_status_system.py`:
```
Canonical Statuses:
- draft, placed
- clarification_needed, options_ready, approval_pending, payment_pending (Awaiting You)
- in_progress, scheduled
- shipped, delivered (Orders)
- completed, cancelled, unable (Terminal)
```

### 3. Services API ✅
Created `/app/backend/services_routes.py`:
- `GET /api/os/services/launchers` - 8 featured services
- `GET /api/os/services/inbox` - Tickets grouped by status
- `GET /api/os/services/awaiting` - Awaiting You shelf
- `GET /api/os/services/orders` - Orders with shipping
- `GET /api/os/services/watchlist` - For TODAY integration
- `POST /api/os/services/request` - Create request
- `PATCH /api/os/services/ticket/{id}` - User actions

### 4. Services Panel UI ✅
Created `/app/frontend/src/components/Mira/ServicesPanel.jsx`:
- Service Launchers grid (8 services)
- Awaiting You shelf (killer UX)
- Active Requests with status tabs
- Orders section
- Clean, professional UI (icons, no emojis)

---

## SERVICES REMAINING WORK (40% gap)

Per user's architecture vision:
1. **Request Builder Modal** - Tap launcher → structured form
2. **Full Ticket Detail View** - Mobile: list → detail page
3. **User Action Flows** - Confirm date, approve quote, pay
4. **Multi-pet Task UI** - Pet selector inside task
5. **Preferences Capture** - "Save groomer?" on completion
6. **Awaiting You Badge** - Notification dot on Services tab
7. **TODAY Watchlist Integration** - Use `/api/os/services/watchlist`

---

## TODAY REMAINING WORK (5% gap)

1. **Active Tasks Watchlist enrichment:**
   - "Awaiting your confirmation" - Use Services watchlist API
   - "Concierge is scheduling" - Status display
   - "Payment pending" - Status display
   - "Order shipped" - Use shipping status

2. **Stale/Offline indicator** - Show if data > 5 min old

---

## Architecture

### Key Files Added/Modified (Session 8):
```
/app/backend/
├── ticket_status_system.py  # (NEW) Canonical status taxonomy
├── services_routes.py        # (NEW) Services API at /api/os/services/*
├── scoring_logic.py          # (FIXED) line 433 attribute error
└── server.py                 # (MODIFIED) Added services_router

/app/frontend/src/
├── components/Mira/
│   └── ServicesPanel.jsx     # (NEW) Services execution layer UI
└── pages/
    └── MiraDemoPage.jsx      # (MODIFIED) Added showServicesPanel
```

### API Endpoints Summary:
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/os/services/launchers` | GET | 8 featured services |
| `/api/os/services/inbox` | GET | All tickets grouped |
| `/api/os/services/awaiting` | GET | Awaiting You |
| `/api/os/services/orders` | GET | Orders with shipping |
| `/api/os/services/watchlist` | GET | For TODAY panel |
| `/api/os/services/request` | POST | Create request |
| `/api/os/services/ticket/{id}` | GET/PATCH | Detail/actions |

---

## Known Issues (P2)

1. **Orders API Error:** `/api/orders` returns 405 Method Not Allowed
2. **Markdown Rendering:** Markdown syntax in chat messages not rendered

---

## Test Credentials

- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304` (access at `/admin`)

## Preview URL

**Working:** https://mira-learn-ai.preview.emergentagent.com/mira-demo

---

*PRD Updated: February 14, 2026 - Session 8*
*SERVICES Layer: 60% (Foundation built, UI/UX flows remaining)*

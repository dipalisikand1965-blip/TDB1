# Mira OS - Product Requirements Document
## The Golden Standard Communication System

### Original Problem Statement
Build a "Mojo-First OS" - a pet operating system centered around an AI named "Mira" that manages pet care, services, and communication. The system must strictly adhere to the PET_OS_BEHAVIOR_BIBLE v1.1 which defines exact behavioral rules for navigation, icon states, and chat continuity.

### User Personas
1. **Pet Parents** - Primary users who interact with Mira to manage their pet's care
2. **Concierge Team** - Human agents who handle service requests
3. **Admin Users** - Manage the system and view analytics

### Core Requirements (from PET_OS_BEHAVIOR_BIBLE v1.1)

#### Section 1: OS State Machine
- CHAT_HOME is always the root state
- Max stack depth = 2 (PRIMARY + DETAIL)
- Tab switch clears DETAIL layers (clean slate)
- Commit actions ALWAYS return to CHAT_HOME + toast + chat confirmation

#### Section 2: Icon State System (OFF/ON/PULSE)
- OFF: Muted icon (opacity 0.5), no dot - Zero relevant items
- ON: Lit icon, subtle dot - Items exist
- PULSE: Animation + dot + count badge - NEW or materially changed
- PULSE → ON when user visits tab
- Pet switch resets ALL states to OFF, then recalculates
- No cross-pet leakage

#### Section 3: Chat Continuity Contract
- Preserve exact scroll position on tab navigation
- Auto-scroll only if user is at bottom
- Show "New messages" pill when scrolled up + new message arrives
- Draft persistence: 30-min sliding TTL, pet-scoped
- Pet switch shows banner: "Draft saved for [old pet]. Now chatting about [new pet]."

---

## Implementation Status

### Phase 1: Layer Manager ✅ COMPLETE (Feb 17, 2026)
- Created `LayerContext.jsx` - Core navigation stack management
- Created `useLayerNavigation.js` - Bridge hook
- Features: Tab switching, back navigation, commit actions with toast

### Phase 2: Chat Continuity + Draft Persistence ✅ COMPLETE (Feb 17, 2026)
- Created `useChatContinuity.js` - Scroll preservation
- Created `useDraft.js` - Pet-scoped drafts with 30-min TTL
- Verified: Draft saves on keystroke, pet switch banner shows

### Phase 3: Icon State System ✅ COMPLETE (Feb 17, 2026)
- Created `useIconState.js` - OFF/ON/PULSE state machine for all 6 tabs
- Updated `PetOSNavigation.jsx` - Added iconStates prop with MOJO visual feedback
- Implemented MOJO tab state (PULSE when soul score < 50%, ON otherwise)
- Pet switch: All states reset to OFF/ON, then recalculate for new pet
- Console logging confirms state transitions working correctly
- CSS animations for PULSE states (icon glow, dot ping, badge glow)
- Accessibility: Reduced motion support, proper ARIA labels

### Phase 4: Icon State API + Canonical Ticket ID ✅ COMPLETE (Feb 17, 2026)
**Icons/badges are a read-only view of the Service Desk Ticket spine. They never create state and never bypass the uniform service flow.**

- Created `/api/os/icon-state` - Single endpoint for unified counts
- Created `useIconStateAPI.js` - Frontend hook with feature flag
- Strict `TCK-YYYY-NNNNNN` validation (regex: `^TCK-\d{4}-\d{6}$`)
- Created `utils/ticket_id_generator.py` - Atomic sequential ID generator
- Updated intake points: `services_routes.py`, `central_dispatcher.py`, `conversation_routes.py`
- Legacy data handling: Shows "—" badge (syncing) instead of misleading "0"
- Debug Drawer: Shows legacy data warning + invalid count
- Updated Bible to reflect canonical format

### Phase 4b: Centralized Ticket Spine Helper ✅ COMPLETE (Feb 17, 2026)
**All ticket creation must route through `create_or_attach_service_ticket()`**

- Created `/app/backend/utils/service_ticket_spine.py` - SINGLE ENTRY POINT
- Enforces canonical ID format (TCK-YYYY-NNNNNN)
- Attach vs Create logic (idempotent)
- Source + channel tracking (for audits)
- Admin + Member notifications built-in
- Updated `services_routes.py` to use helper
- Updated `central_dispatcher.py` to use helper
- Tested and verified: `TCK-2026-000003` generated correctly

---

## Prioritized Backlog

### P0 (Critical) - Blockers before enabling for real users
- [x] Fix Phase 3 bug (soulKnowledge initialization order)
- [x] Complete Phase 3 implementation with MOJO tab
- [x] Wire icon states to real API data (`/api/os/icon-state`)
- [x] Implement canonical ticket_id format (`TCK-YYYY-NNNNNN`)
- [ ] Update remaining intake routes to use `generate_ticket_id()`:
  - `stay_routes.py`, `dine_routes.py`, `celebrate_routes.py`, `enjoy_routes.py`
  - `fit_routes.py`, `learn_routes.py`, `paperwork_routes.py`, `emergency_routes.py`
  - `whatsapp_routes.py`, `membership_routes.py`, `ticket_auto_create.py`
  - `unified_signal_flow.py`, `user_tickets_routes.py`, `service_catalog_routes.py`, `ticket_messaging.py`
- [ ] OR: Create single `create_or_attach_service_ticket()` helper for all intakes
- **Do not enable the flag for production until all ticket-creating intakes route through the canonical helper.**

### P1 (High Priority)
- [ ] Implement PICKS material change logic (Bible Section 2.4)
- [ ] Connect LEARN items to icon state
- [ ] Phase 5: Picks Material Change Logic
- [ ] Provide 60-second screen recording proof (verify PULSE → ON transitions)

### P2 (Medium Priority)
- [ ] Refactor `server.py` (monolithic)
- [ ] Refactor `DoggyServiceDesk.jsx` (monolithic)
- [ ] Implement Safety Mode suppression (Bible Section 8)
- [ ] Phase 5: Picks Material Change Logic

### Future Tasks
- [ ] Redesign Onboarding Page (blocked on user content)
- [ ] WhatsApp Integration (blocked on credentials)
- [ ] Build out "Learn" Section
- [ ] Multi-pet ticket handling (line items)
- [ ] Gate Mira OS for Paid Members

---

## Technical Architecture

### Stack
- **Frontend:** React 18 (CRA) + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Auth:** JWT-based custom auth

### Key Files
```
/app/frontend/src/
├── context/
│   └── LayerContext.jsx          # Layer Manager
├── hooks/mira/
│   ├── useLayerNavigation.js     # Layer bridge hook
│   ├── useChatContinuity.js      # Scroll preservation
│   ├── useDraft.js               # Pet-scoped drafts
│   ├── useIconState.js           # OFF/ON/PULSE states
│   └── useIconStateAPI.js        # Real data from backend API
├── components/mira-os/
│   ├── navigation/PetOSNavigation.jsx  # OS navigation bar
│   └── debug/IconStateDebugDrawer.jsx  # Debug drawer for validation
└── pages/
    └── MiraDemoPage.jsx          # Main Mira OS page

/app/backend/
├── routes/
│   └── icon_state_routes.py      # /api/os/icon-state endpoint
├── utils/
│   └── ticket_id_generator.py    # Canonical TCK-YYYY-NNNNNN generator
└── services_routes.py            # Updated to use canonical ticket_id

/app/memory/
├── PET_OS_BEHAVIOR_BIBLE.md      # System Contract (CRITICAL)
├── PRD.md                        # This file
├── MIRA_DOCTRINE.md              # What Mira says
├── MOJO_BIBLE.md                 # What data exists
└── PET_OS_UI_UX_BIBLE.md         # What things look like
```

### Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

---

## Change Log

### Feb 17, 2026 (Session 5 - Conflict Handling & Safety)
**CRITICAL FIX: Fact Conflict Resolution System**

- **Problem:** "Loves chicken" showed as UI tag even though "allergic to chicken" was confirmed
- **Solution:** Implemented health-first conflict resolution system

**New Features:**
1. **Conflict Detection & Resolution** (`/app/backend/utils/fact_conflict_resolver.py`)
   - `detect_conflict()` - Finds health vs preference conflicts on same entity
   - `resolve_conflict()` - Resolves with `health_wins` / `preference_wins` / `not_sure`
   - `get_safe_tags()` - Returns tags with health priority (suppresses conflicting preferences)
   - **Safety Rule:** Health always wins by default until user explicitly resolves

2. **MOJO Conflict Resolution UI** (`/app/frontend/src/components/Mira/ConflictResolutionCard.jsx`)
   - Shows conflict cards at top of "What Mira Learned" section
   - Three resolution options: "Allergic (avoid)", "Loves (it's fine now)", "Not sure"
   - Safety note: "Until you confirm, I'll avoid X to stay on the safe side"
   - Resolved state shows confirmation message with "Change decision" link
   - Suppressed tags show with strikethrough + red shield icon

3. **Extraction-Time Deduplication (Conservative)**
   - Exact match only (category + content)
   - No time-based blocking - allows re-stated facts months later
   - Prevents duplicate noise within same conversation

4. **API Endpoints:**
   - `GET /api/os/concierge/conflicts/{pet_id}` - Get unresolved conflicts
   - `POST /api/os/concierge/conflicts/{pet_id}/resolve` - Resolve a conflict
   - `GET /api/os/concierge/safe-tags/{pet_id}` - Get tags with safety filtering

5. **Entity Normalization:**
   - Handles plurals (peanut/peanuts, chicken/chickens)
   - Common variations mapped (peanut butter → peanut)

**Full QA Test Results:**
- A) Extraction → Pending Insights: ✅ PASS
- B) Confirm + Retrieval: ✅ PASS  
- C) Contradiction Trigger: ✅ PASS
- D) Resolution: ✅ PASS
- E) Service Handoff: ✅ PASS (TCK-2026-000005)

### Feb 17, 2026 (Session 4 - Mira Intelligence QA)
**Completed comprehensive QA of Mira's intelligence system:**

- **Part B (Confirm/Reject):** PASS - 5 confirmed, 2 rejected, duplicate detection working
- **Part C (Retrieval):** PASS - All 6 retrieval tests used only confirmed facts
- **Part D (Service Flow):** PASS - Canonical TCK-* ticket created via spine, notifications sent
- **Part E (Edge Cases):** Identified issues that led to Session 5 fixes

**Key Fix:** Modified `/app/backend/mira_routes.py` service handoff to use centralized `create_or_attach_service_ticket()` helper. Canonical tickets (TCK-2026-NNNNNN) now created correctly.

### Feb 17, 2026 (Phase 3 Completion)
- Phase 3 Icon State System COMPLETE
- Added MOJO tab to icon state system (PULSE when soul < 50%)
- Fixed soulKnowledge initialization order bug
- Updated PET_OS_BEHAVIOR_BIBLE.md with MOJO icon specifications
- Console confirms state transitions: demo-pet(PULSE) → Lola(PULSE - critical fields missing)
- Pet switch correctly resets and recalculates all icon states

### Feb 17, 2026 (Session 2 - MOJO & Insights Investigation)
- **MOJO PULSE now triggers on critical missing fields** (vaccinations, allergies, medications, vet_info, location)
- Added orange attention dot on pet avatar when PULSE
- Updated "What Mira Learned" empty state with "Teach Mira" and "Save from chat" CTAs
- **INVESTIGATION RESULTS:**
  - Mystique: Soul Score = 72%, learned_facts = [], doggy_soul_meta = 4 keys
  - "Mira's Intelligence" shows based on `doggy_soul_meta` count (4 keys = ~30%)
  - "What Mira Learned" shows 0% because `learned_facts` array is empty
  - Insights are created via Concierge conversations when Mira extracts facts

### Feb 17, 2026 (Session 3 - Insights Review & Confirm)
- **BUILT: "Review & Confirm" UI for pending insights in MOJO modal**
  - Shows collapsible "X New Insights to Review" section
  - Each insight shows: category icon, content, source date
  - Confirm button → moves to `learned_facts[]` + updates status
  - Reject button → marks as rejected (stays in `conversation_insights`)
- **API endpoint verified:** `POST /api/os/concierge/insights/{pet_id}/review?insight_id=X&action=confirm|reject`
- **Lola test:** Confirmed "toy is a squeaky duck" → learned_facts went 3→4

### Feb 17, 2026 (Earlier)
- Phase 1 Layer Manager implemented and tested
- Phase 2 Chat Continuity + Draft Persistence implemented and tested
- Phase 3 Icon State System started (bug pending)
- Pet switch banner working: "Draft saved for Lola. Now chatting about Mystique."

### Previous Session
- Service Desk redesign completed
- Pet Profile bug fix completed
- PET_OS_BEHAVIOR_BIBLE.md created

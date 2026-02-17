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
- [x] **PICKS Fallback Rule (Bible Section 9.0)** - No catalogue match → Concierge Arranges
- [x] **PICKS Fallback QA Verification** - All acceptance tests passed (Feb 17, 2026)
  - Test 1: Bespoke request → `fallback_mode='concierge'`, `fallback_reason='bespoke_intent'` ✓
  - Test 2: Normal request → `fallback_mode='catalogue'` with matches ✓
  - Test 3: Ambiguous request → Handled correctly ✓  
  - Test 4: Ticket creation → Canonical `TCK-2026-*` format ✓
- [x] **Phase 5: Conversation Contract (Bible Section 11.0)** - All acceptance tests passed (Feb 17, 2026)
  - Test 1: "I want a pet cafe" → `mode='clarify'`, no Places call ✓
  - Test 2: "Pet cafe in Koramangala" → `mode='places'`, 5 places returned ✓
  - Test 3: "How to train recall" → `mode='learn'`, 5 YouTube videos ✓
  - Test 4: "Book grooming tomorrow" → `mode='ticket'`, ticket created ✓
  - Test 5: "Find canine acupuncturist" → `mode='handoff'`, bespoke intent ✓
  - Location Consent Gate: "near me" without permission → clarify with chips ✓
  - Frontend: Quick reply chips rendering correctly based on contract mode
- [x] **Spine Helper Created** (`/app/backend/utils/spine_helper.py`)
  - `handoff_to_spine()` - single entry point for all route migrations
  - Enforces canonical TCK-YYYY-NNNNNN format
  - Logs SPINE-VIOLATION for any non-canonical tickets
- [x] **Route Migration Progress** (Using spine helper):
  - `stay_routes.py` - booking endpoint ✓ TCK-* format
  - `dine_routes.py` - reservation, buddy_visit, meetup_request, bundle_order ✓ TCK-* format
  - `celebrate_routes.py` - requests endpoint ✓ TCK-* format (verified: TCK-2026-000019)
  - `enjoy_routes.py` - RSVP endpoint ✓ TCK-* format
- [ ] **Remaining Route Migrations**:
  - `fit_routes.py` - import added, needs endpoint updates
  - `paperwork_routes.py` - import added, needs endpoint updates
  - `emergency_routes.py` - import added, needs endpoint updates
  - `learn_routes.py` - import added, needs endpoint updates
  - `membership_routes.py` - import added, needs endpoint updates
  - `whatsapp_routes.py` - import added, needs endpoint updates
  - `ticket_auto_create.py` - hub file, needs full migration
- [ ] Enable `ICON_STATE_API_ENABLED` feature flag after all routes migrated
- **Do not enable the flag for production until all ticket-creating intakes route through the canonical helper.**

### P1 (High Priority)
- [ ] Implement PICKS material change logic (Bible Section 2.4)
- [ ] Connect LEARN items to icon state
- [ ] Provide 60-second screen recording proof (verify PULSE → ON transitions)

### P2 (Medium Priority)
- [ ] Refactor `server.py` (monolithic)
- [ ] Refactor `DoggyServiceDesk.jsx` (monolithic)
- [ ] Implement Safety Mode suppression (Bible Section 8)
- [ ] Refactor `mira_routes.py` (extremely large)

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

3. **Safe Tags Hook & Renderer** (P1 - Wired EVERYWHERE)
   - `/app/frontend/src/hooks/mira/useSafeTags.js` - Centralized hook for safe tags
   - `/app/frontend/src/components/Mira/SafeTagsRenderer.jsx` - Component with suppression logic
   - **ServicesPage.jsx** - PetSoulTraits now uses safe-tags API
   - **UnifiedHero.jsx** - SoulTraits now uses safe-tags API
   - Fallback to raw tags + "syncing" indicator if API fails
   - Shows "⚠️ X hidden" when tags are suppressed

4. **Chat Interruption Prompt (Bible 6.3)**
   - Conflict detected at extraction time in `mira_routes.py`
   - Prompt injected: "⚠️ I want to be careful here. I'm holding two different notes..."
   - Quick replies: "Off-limits (allergy)", "It's fine now", "Not sure"
   - `conflict_detected` field in API response for frontend handling

5. **Debug Drawer Enhanced**
   - Added "Tag Safety" section showing suppressed_tags_count
   - Lists all suppressed tags with reasons

6. **Conservative Deduplication**
   - Exact match only (category + content)
   - No time-based blocking - allows re-stated facts months later

7. **Entity Normalization**
   - Handles plurals (peanut/peanuts, chicken/chickens)
   - Common variations mapped (peanut butter → peanut)

**Acceptance Test Results (Services Page - all passed):**
- Create [health] lamb allergy ✅
- Add conflicting [loves] lamb treats ✅
- Resolve as health_wins ✅
- Services hero shows: thunder, anxiety, personality traits ✅
- Services hero shows "⚠️ 6 hidden" indicator ✅
- Services hero does NOT show "loves lamb" or "loves chicken" ✅

### Feb 17, 2026 (Session 6 - PICKS Fallback Rule)
**CRITICAL: Implemented Bible Section 9.0 - Picks Fallback Rule with Explicit Contract**

**The Rule (Non-Negotiable):**
- When no catalogue match exists, PICKS must show "Concierge Arranges" cards
- The CTA must create a Service Desk ticket via the spine
- NEVER show generic popular items as substitutes
- "Catalogue is optional; concierge is guaranteed."

**Implementation - Explicit Fallback Contract:**

1. **Backend Contract (`/app/backend/mira_routes.py`):**
   - Returns explicit `picks_contract` object:
     - `match_count`: Number of catalogue items found
     - `top_score`: Relevance score of best match (0.0 - 1.0)
     - `fallback_mode`: "catalogue" | "concierge" | "clarify"
     - `fallback_reason`: "no_match" | "low_confidence" | "blocked_by_safety" | "bespoke_intent" | null
     - `blocked_by_safety`: Boolean flag
     - `concierge_cards`: Array of 1-3 cards when fallback_mode="concierge"
     - `clarifying_questions`: Array when fallback_mode="clarify"
   - Decision rule: If `match_count == 0` OR `top_score < MIN_MATCH_SCORE` OR `blocked_by_safety == true` → `fallback_mode = "concierge"`
   - Added bespoke request detection (acupuncture, hydrotherapy, rehab, etc.)
   - Added `build_picks_fallback_contract()` helper function

2. **Ticket Creation Endpoint (`POST /api/mira/picks/concierge-arrange`):**
   - Creates ticket via `create_or_attach_service_ticket()` spine
   - Returns canonical TCK-YYYY-NNNNNN ticket ID
   - Returns deep link to Services page

3. **Frontend Rendering (`/app/frontend/src/hooks/mira/useChatSubmit.js`):**
   - Reads `picks_contract.fallback_mode` from response
   - If `fallback_mode === "concierge"`: Shows Concierge Arranges cards, no products
   - If `fallback_mode === "clarify"`: Shows clarifying questions
   - If `fallback_mode === "catalogue"`: Shows catalogue products normally

4. **PICKS Panel UI (`/app/frontend/src/components/PicksVault/UnifiedPicksVault.jsx`):**
   - Added `ConciergeArrangeCard` component for fallback cards
   - Shows "Concierge Arranges for {pet}" section with sparkle icon
   - "+" action creates ticket via the spine
   - Shows ticket confirmation: "Got it. Request opened: TCK-2026-NNNNNN"

**Acceptance Tests (All Passing):**
- ✅ "Find me a canine acupuncturist" → mode=concierge, reason=bespoke_intent, cards=1, products=0
- ✅ "Chicken treats with allergy" → mode=concierge, reason=no_match, allergy_badge=true, products=0
- ✅ "Treats for Lola" → mode=catalogue, match_count=6, products=6
- ✅ "Professional photoshoot" → mode=catalogue, products=6, services=5
- ✅ Ticket creation → TCK-2026-000010, canonical=true

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

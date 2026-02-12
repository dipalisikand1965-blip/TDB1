# The Doggy Company - MIRA OS
## Mobile-First Pet Life Operating System

---

## ⚠️ CRITICAL: READ FIRST

**ALL AGENTS MUST READ `/app/memory/AGENT_START_HERE.md` BEFORE ANY WORK**

---

## WHAT IS MIRA OS?

**MIRA is a MOBILE-FIRST PET LIFE OPERATING SYSTEM.**

It is:
- An intelligent OS that runs a pet's entire life
- Memory-driven, context-aware, proactive
- Built for iOS and Android mobile devices FIRST

It is NOT:
- An e-commerce platform
- A chatbot
- A web-first application

---

## TEST CREDENTIALS

| Role | Email/Username | Password |
|------|----------------|----------|
| **Test User** | dipali@clubconcierge.in | test123 |
| **Admin** | aditya | lola4304 |

**Preview URL:** https://smart-picks-24.preview.emergentagent.com

---

## CORE DOCUMENTS (READ IN ORDER)

| Priority | Document | Purpose |
|----------|----------|---------|
| **P0** | `/app/memory/PICKS_ENGINE_HANDOVER.md` | **START HERE - Complete handover for Picks Engine** |
| **P0** | `/app/memory/AGENT_START_HERE.md` | Master onboarding doc |
| **P0** | `/app/memory/MIRA_OS_14_PILLARS_BIBLE.md` | 14 pillars definitive reference |
| **P0** | `/app/memory/PICKS_ENGINE_SPEC_v1.md` | **PICKS ENGINE COMPLETE SPEC** |
| **P0** | `/app/memory/MOBILE_FIRST_GOLDEN_RULES.md` | UI/UX compliance rules |
| **P0** | `/app/memory/seeds/B0_DRAFT_TAXONOMY_FOR_APPROVAL.md` | **B0 Taxonomy (COMPLETE)** |
| **P0** | `/app/memory/seeds/B1_PICKS_CATALOGUE.md` | **B1 Picks Catalogue (COMPLETE)** |
| **P0** | `/app/memory/seeds/B2_CLASSIFICATION_TESTS.md` | **B2 Classification Tests (COMPLETE)** |
| **P1** | `/app/memory/MIRA_OS_AUDIT.md` | Current system audit (68/100) |
| **P1** | `/app/memory/MIRA_OS_ROADMAP.md` | Enhancement roadmap |
| **P1** | `/app/memory/seeds/CANONICAL_TAGS_SEED.md` | Canonical tags data |
| **P1** | `/app/memory/seeds/TAG_SYNONYMS_SEED.md` | Tag synonyms mapping |
| **P1** | `/app/memory/seeds/SERVICE_TYPES_SPEC.md` | Service types spec |
| **P2** | `/app/memory/PILLAR_ARCHITECTURE_DOCTRINE.md` | Architecture decisions |
| **P2** | `/app/memory/PROFILE_FIRST_DOCTRINE.md` | Profile-first doctrine |
| **P2** | `/app/memory/CRITICAL_FIXES_DO_NOT_REVERT.md` | Protected bug fixes |

---

## 🧬 MIRA OS LIFE MODEL

| Layer | Purpose |
|-------|---------|
| Who the pet is | MOJO / SOUL |
| What matters now | TODAY |
| What should happen | PICKS |
| What gets done | SERVICES |
| What patterns exist | INSIGHTS |
| What the parent understands | LEARN |
| When humans step in | CONCIERGE |

> **Pillars operate invisibly underneath. Users don't navigate pillars - Mira infers them.**

---

## CURRENT AUDIT SCORE: 78/100 (Updated Dec 2025)

| Domain | Score | Notes |
|--------|-------|-------|
| Memory System | 70/100 | |
| Soul Intelligence | 75/100 | Improved with Profile-First |
| Conversational Context | 75/100 | |
| **Picks Engine** | **70/100** | **B0, B1, B2 COMPLETE** |
| Services Execution | 50/100 | |
| Proactive System | 40/100 | |
| 14 Pillars Coverage | 85/100 | All 13 pillars seeded |
| UI/UX Mobile | 80/100 | |
| Infrastructure | 95/100 | |

---

## 🎯 PICKS ENGINE STATUS (December 2025)

### ✅ COMPLETED PHASES

| Phase | Description | Status | Tests |
|-------|-------------|--------|-------|
| B0 | Taxonomy Seeding | ✅ COMPLETE | - |
| B1 | Picks Catalogue | ✅ COMPLETE | - |
| B2 | Classification Pipeline | ✅ COMPLETE | 28 passing |
| B3 | Safety Gate | ✅ COMPLETE | 21 passing |
| B4 | Scoring Function | ✅ COMPLETE | 29 passing |
| B5 | Concierge Logic | ✅ COMPLETE | 41 passing |
| B6 | API Integration | ✅ COMPLETE | Live in /api/mira/chat |

### ⏳ PENDING PHASES

| Phase | Description | Status |
|-------|-------------|--------|
| B7 | Events Log + Analytics | ⏳ PENDING |
| B8 | Scenario Testing + Tuning | ⏳ PENDING |

### KEY FILES

```
/app/backend/classification_pipeline.py     ← B2 classification engine
/app/backend/safety_gate.py                 ← B3 safety gate + first aid
/app/backend/scoring_logic.py               ← B4 scoring + ranking
/app/backend/concierge_logic.py             ← B5 concierge prominence (NEW)
/app/backend/scripts/seed_taxonomy.py       ← B0 seeder (idempotent)
/app/backend/scripts/seed_picks_catalogue.py ← B1 seeder (idempotent, ENHANCED)
/app/backend/tests/test_classification.py   ← 28 unit tests
/app/backend/tests/test_safety_gate.py      ← 21 unit tests
/app/backend/tests/test_scoring_logic.py    ← 29 unit tests
/app/backend/tests/test_concierge_logic.py  ← 41 unit tests (NEW)
/app/memory/PICKS_ENGINE_HANDOVER.md        ← COMPLETE HANDOVER DOC
```

### DATABASE COLLECTIONS

| Collection | Count | Purpose |
|------------|-------|---------|
| canonical_tags | 220+ | Tag vocabulary (boarding, party_planning, choking_suspected added) |
| tag_synonyms | 640+ | Human language → tags (kennel→boarding, pawty→party_planning) |
| service_verticals | 8 | Booking categories |
| service_vertical_synonyms | 46 | Service matching |
| service_types | 8 | Fulfilment modes |
| service_type_synonyms | 61 | Fulfilment matching |
| picks_catalogue | 110 | Next-best-actions (enhanced with doc_requirements, warning_type) |
| events_log | Growing | Audit trail |

### KEY SCHEMA PATTERNS (UPDATED Dec 2025)

| Pattern | Purpose | Example |
|---------|---------|---------|
| `reason_template_enhanced` | Richer copy when profile complete | Uses `{breed}`, `{energy_level}` |
| `required_booking_fields` | Questions before booking CTA | `["city", "airport", "transfer_date", "pickup_or_drop"]` |
| `optional_booking_fields` | Non-blocking optional fields | `["flight_number", "pet_weight", "crate_size"]` |
| `temporal_triggers` | Boost picks on time-bound intent | `{"travel_date": true}` |
| `if_brachycephalic` | Breed-specific safety warnings | `"show_warning"` for pugs, bulldogs |
| `warning_type` | Abstracted warning lookup | `"air_travel_brachy"` |
| `doc_requirements` | Links picks to paperwork | `["fit_to_fly", "vaccination_records"]` |
| `service_modes` | Standardized service delivery | `["pickup_drop"]` |
| `concierge_complexity` | Guides=low, Bookings=medium/high | Prevents over-showing concierge |

### CONCIERGE LOGIC (B5) - KEY PRINCIPLES

| Principle | Description |
|-----------|-------------|
| **Always On** | Concierge® is ALWAYS available (mode: "always_on") |
| **Prominence Shifts** | CTA prominence shifts based on context: primary / secondary / quiet |
| **Never Hidden** | Concierge is never "shown/hidden" - only prominence changes |

### Concierge PRIMARY Triggers (Mandatory)

| Trigger | Reason Code | When |
|---------|-------------|------|
| Safety | `safety_override` | `safety_level = "caution"` or `"emergency"` |
| Ambiguity | `low_confidence` | `confidence < 0.65` |
| Time Pressure | `tight_timeline` | "today", "tomorrow", "urgent", "asap" detected |
| Multi-Step | `multi_step` | `len(service_verticals) >= 2` |
| High Complexity | `pick_complexity` | `top_pick.concierge_complexity = "high"` |
| Coordination | `coordination_value` | celebrate/travel/stay + booking intent |

### Concierge Output Contract

```json
{
  "mode": "always_on",
  "cta_prominence": "primary|secondary|quiet",
  "reason": "safety_override|tight_timeline|...",
  "cta": "Have Concierge® coordinate",
  "suppress_commerce": false
}
```

### CROSS-PILLAR BOOST RULES

| Trigger | Boosted Pillar | Boost Value | Purpose |
|---------|----------------|-------------|---------|
| Travel intent detected | Paperwork | +15 | Proactive doc reminders |

---

## 🎯 Memory Endpoint Fix ✅ COMPLETE (Feb 12, 2026)

### Problem
- `/api/mira/memory/pet/{pet_id}` only queried `mira_memories` collection (1 record)
- `conversation_memories` collection (11 records) was ignored
- Memories tab showed incomplete data

### Solution
- Updated endpoint to **combine both sources**:
  - `mira_memories` - Explicit user statements ("Mira, remember...")
  - `conversation_memories` - Auto-extracted from chat
- Added `sources` field to response showing counts from each
- Fixed datetime/string sorting issue

### Result
- Mystique: 1 mira_memory + 11 conversation_memories = **12 total memories displayed**

---

## 🎯 YouTube Integration for LEARN Pillar ✅ COMPLETE (Feb 12, 2026)

### Implementation Details
- **Fixed field name mismatch** in `get_learn_video_support()` function
  - Changed `video.get("video_id")` → `video.get("id")`
  - Changed `video.get("channel_title")` → `video.get("channel")`
- **Made video loading work without pet_id** - now returns videos even without specific pet context
- **Fixed null handling** for `age_years` field with proper fallbacks

### API Endpoints Working
- `GET /api/mira/learn/guides/{topic}` - Returns guide + supporting video
- `GET /api/mira/youtube/videos` - Search YouTube videos
- `GET /api/mira/youtube/by-topic?topic=X` - Topic-specific videos
- `GET /api/mira/youtube/test` - API health check

### Available Guides with Videos
- `potty_training`, `leash_training`, `recall_training`, `barking`

---

## 🎯 Question Bank Coverage - 100/100 ✅ (Feb 12, 2026)

### Architecture Decisions (LOCKED)
| Topic | Decision |
|-------|----------|
| Grooming | Inside CARE (service, not pillar) |
| Shop | NOT a pillar (inside Services execution layer) |
| Pet Photography | Inside CELEBRATE (service, not pillar) |
| YouTube | Allowed inside LEARN as supporting media only |

### Key Implementation
- **Priority overrides** for ambiguous keywords (trainer→LEARN, not travel)
- **Word boundary checking** for short keywords (ola, cab, car, train)
- **Context detection** for symptoms (signs/not agreeing→CARE)

---

## 🎯 P0 Bug Fixes (Feb 12, 2026) ✅ COMPLETE

### Issue 1: Intelligence Score Not Counting Conversation Memories
**Problem**: Intelligence score was returning low values because it only checked the `conversation_memories` collection, not the inline `conversation_memories` array stored in the pet document.

**Fix Applied** (`/app/backend/services/intelligence_score.py` lines 85-100):
- Added fallback to check inline `pet.conversation_memories` when the collection is empty
- Converts inline format to expected format for scoring
- Result: Lola's score went from 5% to 10% with conversation_learning=5.5

### Issue 2: Pillar Detection False Positives
**Problem**: "Lola needs a haircut" was detected as `travel` because "Lola" contains "ola" (Indian cab service keyword).

**Fix Applied** (`/app/backend/mira_routes.py` lines 6028-6038):
- Added word boundary checking for short keywords prone to substring matches
- Keywords in `WORD_BOUNDARY_KEYWORDS` set: ola, cab, car, fly, air, bus, van, pet, sit, mat, bed, eat
- Uses regex `\b` word boundaries for matching
- Result: "Lola needs a haircut" → `care`, "Book an Ola cab" → `travel`

**Testing**: ALL 10 TESTS PASSED ✅ (see `/app/test_reports/iteration_161.json`)

---

## 🎯 MiraDemoPage.jsx Refactoring Status (Feb 12, 2026)

### Phase 1: Extract handleSubmit ✅ COMPLETE

**Goal**: Extract the 900-line `handleSubmit` function into a reusable custom hook.

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **MiraDemoPage.jsx** | ~4,300 lines | 3,515 lines | **-785 lines (-18%)** |
| **useChatSubmit.js** | N/A | 919 lines | **New hook created** |

**Files Modified**:
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Removed handleSubmit, uses hook
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - New hook with chat logic
- `/app/frontend/src/hooks/mira/index.js` - Exports new hook

**Testing**: PASSED ✅
- Login flow: PASS
- Page load: PASS
- Pet selector visible: PASS
- Chat send/receive: PASS
- API verification: PASS (3/3)

### Remaining Phases (TODO)
- **Phase 2**: Extract `useConversation.js` (chat messages, loading states)
- **Phase 3**: Extract `useMiraUI.js` (modal toggles, panels)
- **Phase 4**: Extract `useProactiveAlerts.js` (alerts logic)
- **Phase 5**: Extract `useServiceDesk.js` (ticket integration)

---

## 🎯 OS Intelligence Status (Feb 12, 2026)

### Inline Pet Concierge® Card: IMPLEMENTED ✅ (Feb 12, 2026)

**Feature**: When Mira mentions connecting to concierge in chat, an inline "Pet Concierge®" card appears with contact options.

**Implementation**:
- `InlineConciergeCard.jsx` - Card component with WhatsApp, Chat, Email buttons
- Text displays "Pet Concierge®" in pink color (#F472B6) with glow effect
- Auto-detected via regex patterns in `shouldShowConciergeCard()` function
- Triggered by 40+ concierge-related phrases in Mira's response

### Text Formatting in Chat: VERIFIED ✅

**Implementation**: `ChatMessage.jsx` uses `FormattedText` component with ReactMarkdown
- Bold text: #F472B6 pink color with text-shadow
- Lists (ul/ol): Proper indentation and spacing
- Links: Blue color (#60A5FA) with underline

### Soul Card with Pet Photo: IMPLEMENTED ✅ (Feb 12, 2026)

**Feature**: Soul Knowledge Ticker expanded panel now shows pet photo with score overlay.

**Implementation**:
- `SoulKnowledgeTicker.jsx` now accepts `petPhoto` prop
- Expanded panel shows circular pet photo with score overlay
- Falls back to score circle if no photo available

### Photo Display Issue: FIXED ✅

**Problem**: Pet photo was showing as yellow placeholder with paw print instead of actual photo.

**Root Cause**: Two bugs in MiraDemoPage.jsx:
1. Line 1132: Used `p.photo` instead of `p.photo_url` when formatting pets from `/api/pets/my-pets`
2. Line 1473: Missing `photo` property when setting pet from individual pet fetch

**Fix Applied (Feb 12, 2026)**:
- Line 1132: Changed `photo: p.photo || null` → `photo: p.photo_url ? \`${API_URL}${p.photo_url}\` : null`
- Line 1478: Added `photo: p.photo_url ? \`${API_URL}${p.photo_url}\` : null` to setPet call

---

## Data Sync Issue: RESOLVED ✅

**Problem**: Only 17/41 data points were being used for intelligence scoring.

**Root Cause**: `load_pet_soul()` function was not including raw `soul` and `preferences` dictionaries.

**Fix Applied**: Modified `/app/backend/mira_routes.py` to include all data sources.

### Current Intelligence for Mystique (pet-3661ae55d2e2)
| Source | Data Points | Status |
|--------|-------------|--------|
| soul_form (doggy_soul_answers) | 17 | ✅ |
| soul_deep (soul) | 5 | ✅ |
| preferences | 5 | ✅ |
| conversation_memories | 7+ | ✅ |
| **TOTAL** | **34+** | ✅ |

**Score**: 60% (50% base + 10% conversation bonus)

---

## What's Implemented

### Memory Intelligence System ✅
- **Memory Extraction Pipeline**: Extracts signals from every conversation
- **LLM Context Injection**: Memories injected before each response
- **Pet Intelligence API**: `GET /api/mira/pet-intelligence/{pet_id}`
- **Intelligence Card**: Frontend component for displaying learnings

### Soul Intelligence Service ✅
- 34 Soul questions across 10 categories
- Real-time completion score calculation
- Dynamic question suggestions
- Multi-source aggregation (form + preferences + conversation)

### Profile-First Questioning ✅
- All pillars use complete profile data
- Mira never asks for information in memory

---

## Key Files

### Backend Services
| File | Purpose |
|------|---------|
| `/app/backend/services/soul_intelligence.py` | Soul completion scoring, question suggestions |
| `/app/backend/services/memory_service.py` | Memory extraction, retrieval, formatting |
| `/app/backend/mira_routes.py` | Main chat logic, pet-intelligence endpoint |

### Frontend Components
| File | Purpose |
|------|---------|
| `/app/frontend/src/components/Mira/MemoryIntelligenceCard.jsx` | Intelligence card UI |
| `/app/frontend/src/components/Mira/PetSelector.jsx` | Pet selector with intelligence indicator |

### Documentation
| File | Purpose |
|------|---------|
| `/app/memory/MIRA_OS_DOCTRINE.md` | System doctrine |
| `/app/memory/VERSIONED_STORAGE_PLAN.md` | P1/P2 implementation plan |
| `/app/memory/DATA_SYNC_PRODUCTION_GUIDE.md` | Deployment guide & handoff |

---

## API Endpoints

### Chat Endpoint
`POST /api/mira/chat`
- Returns `soul_intelligence` block with:
  - `completion_score` (total_score, base_score, conversation_bonus, data_sources, total_data_points)
  - `unanswered_questions`
  - `suggested_question`

### Pet Intelligence Endpoint
`GET /api/mira/pet-intelligence/{pet_id}`
- Returns:
  - `recent_learnings` (category, signal_type, value, confidence)
  - `stats` (total, categories breakdown)
  - `growth_since_last_session`

---

## Database Collections

| Collection | Purpose |
|------------|---------|
| `conversation_memories` | Extracted signals from chat |
| `mira_memories` | Long-term structured memories |
| `pets` | Pet profiles with soul data |

---

## Test Credentials
- **Admin**: username=aditya, password=lola4304
- **Test Pet**: Mystique (pet-3661ae55d2e2), Shih Tzu, Senior, 10kg
- **Test User**: dipali@clubconcierge.in
- **Preview URL**: https://smart-picks-24.preview.emergentagent.com

---

## Remaining Work

### 🟢 P0 - COMPLETED (Feb 12, 2026)
- ~~Data Sync Issue~~ - FIXED
- ~~Personalisation Hierarchy~~ - FIXED (was inverted, now pet-first)
- ~~Versioned Storage~~ - IMPLEMENTED
- ~~Intelligence Depth Score~~ - IMPLEMENTED

### 🟡 P1 - Picks Engine Re-ranking (Next Priority)
- Dynamic picks based on conversation context
- Catalogue-first, concierge-always principle
- Pillar-aware suggestions

### 🟡 P2 - Service/Purchase History
- Track bookings and purchases
- Learn from transaction patterns
- Enable smart re-ordering

### 🔵 P3 - MiraDemoPage Refactor
- 4,298 lines causing performance issues
- Break into smaller components

---

## New APIs Added (Feb 12, 2026)

### Intelligence Score
```bash
curl "$API_URL/api/mira/intelligence-score/{pet_id}"
# Returns: total_score, tier, breakdown, suggestions
```

### Versioned Storage
```bash
# Store trait with confidence evolution
POST /api/mira/versioned/store-trait?pet_id=xxx&trait_type=anxiety_trigger&trait_value=thunderstorms

# Get all traits
GET /api/mira/versioned/all-traits/{pet_id}

# Detect behavioral shifts
GET /api/mira/versioned/behavioral-shifts/{pet_id}
```

---

## Production Deployment Notes

### Auto-Deployment Ready
All changes are in main codebase files:
- No migration scripts needed
- Uses existing collections
- Memory extraction starts automatically
- New versioned storage creates indexes automatically

### Verification Command
```bash
curl -s -X POST "$API_URL/api/mira/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "selected_pet_id": "pet-xxx", "session_id": "test"}' \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print(r.get('soul_intelligence',{}).get('completion_score'))"
```

---

## Comprehensive Roadmap Audit (Feb 12, 2026)

### OVERALL SYSTEM SCORE: 68/100 (up from 58)

| Domain | Before | After | Change |
|--------|--------|-------|--------|
| Memory System (CORE) | 45/100 | 60/100 | +15 |
| Soul Intelligence | 60/100 | 75/100 | +15 |
| Conversational Context | 70/100 | 75/100 | +5 |
| Picks Engine | 35/100 | 35/100 | (Next) |
| Services Execution | 50/100 | 50/100 | - |
| Proactive System | 40/100 | 40/100 | - |
| 14 Pillars Coverage | 55/100 | 55/100 | - |
| UI/UX | 75/100 | 80/100 | +5 |
| Infrastructure | 95/100 | 95/100 | - |

### P0 Items COMPLETED (Feb 12, 2026):
1. **Personalisation Hierarchy** - FIXED (was inverted, now pet-first)
2. **Versioned Storage** - IMPLEMENTED with confidence evolution
3. **Intelligence Depth Score** - IMPLEMENTED with 5-tier system
4. **Enhanced Memory Extraction** - Auto-stores traits

### Remaining Critical Gaps:
1. **Picks Engine Re-ranking** - Doesn't update based on conversation
2. **Service/Purchase History** - Zero tracking of transactions

### Full Audit Document: `/app/memory/COMPREHENSIVE_ROADMAP_AUDIT.md`

---
*Last Updated: February 12, 2026 10:45 UTC*
*Status: PRODUCTION READY (Core) | DOCTRINE COMPLIANCE: 68%*

---

## Recent Feature: Inline Concierge Card (Feb 12, 2026)

### Implementation
- Created `InlineConciergeCard.jsx` component
- Integrated into `ChatMessage.jsx` for automatic display when Mira mentions concierge
- Added pattern detection in `useChat.js` for `showConciergeCard` flag

### How it works
1. When Mira's response contains concierge-related phrases (e.g., "our human Concierge®", "loop in our", "concierge® to fine-tune")
2. The InlineConciergeCard automatically appears below the message
3. Card offers: WhatsApp, Chat, Email contact options
4. "New Topic" button resets conversation

### Files Modified
- `/app/frontend/src/components/Mira/InlineConciergeCard.jsx` (NEW)
- `/app/frontend/src/components/Mira/ChatMessage.jsx` (pattern detection + card rendering)
- `/app/frontend/src/hooks/mira/useChat.js` (buildMiraMessage adds showConciergeCard flag)

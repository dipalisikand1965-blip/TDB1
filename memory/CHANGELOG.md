# MIRA OS - CHANGELOG

## [2025-12-XX] - Picks Engine B6 API Integration Complete

### Added

**Picks Engine Orchestrator** (`/app/backend/picks_engine.py`)
- Full pipeline: classification → safety gate → scoring → concierge logic
- Async/await support for seamless integration
- Safety override enforcement (emergency/caution non-negotiables)
- Debug mode with full classification trace

**API Integration** (`/api/mira/chat`)
- New response fields: `picks[]`, `concierge{}`, `safety_override{}`, `missing_profile_fields[]`
- `debug: true` request flag shows matched_synonyms, tags, intent, top 10 picks with scores
- Concierge always_on with prominence shifts based on context

**Response Contract**
```json
{
  "picks": [...],
  "concierge": {"mode": "always_on", "cta_prominence": "primary|secondary|quiet", ...},
  "safety_override": {"active": bool, "level": "emergency|caution|normal", ...},
  "missing_profile_fields": ["breed", "city", ...],
  "picks_debug": {...}  // only if debug=true
}
```

### Safety Non-Negotiables (Enforced)
- **Emergency**: Hard override, suppress commerce, show vet routing + first aid + Concierge PRIMARY
- **Caution**: Suppress shopping, allow education + "contact vet" routing
- **No Health pillar**: Symptoms route to Care (education + vet routing), never "diagnose"

### Taxonomy Additions
- Added `fly` and `fly to` synonyms for air_travel
- Added `pug` as brachycephalic_breed for breed-specific warnings

### Test Results
- B2 Classification: 28 passing
- B3 Safety Gate: 21 passing
- B4 Scoring Logic: 29 passing
- B5 Concierge Logic: 41 passing
- **Total: 119 tests passing**

---

## [2025-12-XX] - Picks Engine B5 Concierge Logic Complete

### Added

**Concierge Logic Module** (`/app/backend/concierge_logic.py`)
- Implements "always-on" concierge paradigm - never shown/hidden, only prominence shifts
- Three prominence levels: PRIMARY, SECONDARY, QUIET
- Mandatory PRIMARY triggers: safety, low confidence, time pressure, multi-step
- Experience-level PRIMARY triggers: coordination value, pick complexity
- Dynamic CTA text based on pillar and context
- Commerce suppression for safety overrides

**Test Suite** (`/app/backend/tests/test_concierge_logic.py`)
- 41 unit tests covering all concierge scenarios
- Tests for time pressure detection, multi-step detection, coordination value
- Integration tests for grooming, cake, emergency scenarios

### Key Concierge Logic Rules
- `safety_level = emergency/caution` → PRIMARY + suppress commerce
- `confidence < 0.65` → PRIMARY (ambiguity)
- Time keywords (today/urgent/asap) → PRIMARY
- Multiple service verticals → PRIMARY (multi-step)
- Celebrate/Travel/Stay + booking intent → PRIMARY (coordination value)
- `concierge_complexity = high` → PRIMARY
- Simple guide requests → QUIET

### Test Results
- B2 Classification: 28 passing
- B3 Safety Gate: 21 passing
- B4 Scoring Logic: 29 passing
- B5 Concierge Logic: 41 passing
- **Total: 119 tests passing**

---

## [2025-12-XX] - Picks Engine B4 Scoring Logic Complete

### Added

**Scoring Logic Module** (`/app/backend/scoring_logic.py`)
- Complete scoring and ranking engine for Picks
- Profile-based boosts and penalties
- Cross-pillar boost rules (Travel → Paperwork +15)
- Brachycephalic breed detection and warnings
- Degrade-safe reason template rendering
- Booking field extraction (required/optional)

**Enhanced Travel Picks** (`seed_picks_catalogue.py`)
- `travel_air_guide`: Added `doc_requirements`, `warning_type`, `reason_template_enhanced`
- `travel_airport_transfer`: Added `required_booking_fields`, `optional_booking_fields`, `service_modes`
- Tuned `concierge_complexity`: guides=low, bookings=medium

**New Schema Patterns**
- `doc_requirements`: Links travel picks to paperwork (e.g., `["fit_to_fly", "vaccination_records"]`)
- `warning_type`: Abstract warning lookup (e.g., `"air_travel_brachy"`)
- `optional_booking_fields`: Non-blocking booking qualifiers
- Cross-pillar boost rules for proactive suggestions

**Test Suite** (`/app/backend/tests/test_scoring_logic.py`)
- 29 new unit tests covering all scoring patterns
- Tests for brachycephalic detection, Travel→Paperwork boost, booking fields, reason templates

### Updated
- `picks_catalogue` collection: 110 picks with enhanced schemas
- PRD.md: Updated B4 status and schema patterns documentation

### Test Results
- B2 Classification: 28 passing
- B3 Safety Gate: 21 passing  
- B4 Scoring Logic: 29 passing
- **Total: 78 tests passing**

---


# MIRA OS - CHANGELOG

## [2026-02-11] - Agent Audit & Verification Session

### Verified Working
- **Backend tip card type detection** working correctly:
  - Scratching queries → "health_advice" with "Skin Care Tips" title
  - Meal plan queries → "meal_plan" type  
  - Senior diet queries → "meal_plan" type
  - Tick prevention → "health_advice" with products
- **Pet type filtering** - Cat products correctly returned for cat pet_type (62 cat products)
- **Service request flow** - Creates tickets, admin notifications, channel intakes
- **Pillar pages** - All loading correctly (Celebrate, Care, Shop, etc.)
- **VaultManager** - Empty state fix verified
- **Loading state** - Text visibility improved in CSS
- **Admin panel** - Accessible with credentials

### Database Stats
- Unified products: 3,387 (Dog: 1,057 | Cat: 62 | Unspecified: 2,268)
- Services: 2,406
- Service desk tickets: 2,420
- Admin notifications: 2,487
- Channel intakes: 2,239

### Known Issues
1. **BLOCKER: Playwright crashes on /mira-demo** - 4035 line component causes memory issues
2. **Cached tip cards** - Old tips in browser localStorage (backend fixed)
3. **"For You" empty** - Shows no products when not logged in

---

## [2026-02-10] - Major Intelligence & Soul Score Update

### Added

**Conversation Intelligence** (`/app/backend/conversation_intelligence.py`)
- Pronoun resolution: "that one", "the first one", "book that"
- Follow-up context: "cheaper ones", "show me more", "can I include eggs?"
- 8 new tip card types: festival_safety, celebration_tips, new_pet_guide, home_tips

**Soul Score Dynamic Glow** (`/app/frontend/src/styles/mira-prod.css`)
- `soul-grow-pulse` animation - bursts when score increases
- `soul-breathe` animation - constant subtle glow
- `score-count` animation - number counts up

**User Pets Endpoint** (`/app/backend/auth_routes.py`)
- `GET /api/auth/pets` - Returns logged-in user's pets with soul scores and photos

**Enhanced InsightsPanel** (`/app/frontend/src/components/Mira/InsightsPanel.jsx`)
- Tip cards section with icons
- Memory context section ("What I know about Pet")
- Quick tips section

**WhatsApp/Gupshup Integration** (`/app/backend/whatsapp_routes.py`)
- Gupshup webhook handler
- Gupshup send message endpoint
- Auto-creates tickets from WhatsApp messages

### Fixed

**Pillar Detection**
- "celebrate mojo" → celebrate (was: advisory)
- "gotcha day" → celebrate (was: advisory)
- "not eating 2 days" → emergency (was: advisory)
- "limping badly" → emergency (was: advisory)
- "teach to sit" → learn (was: advisory)
- "diwali safety" → celebrate with festival_safety tip card

**PlacesVault**
- nearby_places (restaurants, cafes) now properly stored in miraPicks
- PlacesVault renders when user asks about pet cafes/restaurants

**HandoffSummary**
- Now detects all 12 pillars correctly from conversation context

### Test Results
- 30/30 query tests passing (100%)
- Backend tests: 13/13 passing
- Soul Score API returning correct values

---

## [Previous Sessions]
See `/app/memory/PRD.md` for historical changes

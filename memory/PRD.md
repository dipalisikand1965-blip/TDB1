# Pet Soul - Mira OS Product Requirements Document

## Original Problem Statement
Create a "Golden Standard Communication System" centered around an AI named "Mira." Development is guided by `PET_OS_BEHAVIOR_BIBLE.md`. 

### Core Architectural Rules:
1. **"Uniform Service Flow"** - All service actions create/attach to a single canonical "Service Desk Ticket" spine using `TCK-YYYY-NNNNNN` ID format
2. **"Health-First Safety Rule"** - Pet health facts always override conflicting preferences
3. **Mental Model**: "Chat is where you ask. Services is where it gets done."

## Key Documentation

| Document | Purpose |
|----------|---------|
| `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` | The Law - Design specification |
| `/app/memory/ONE_SPINE_SPEC.md` | Ticket system spec, bug naming, 5 Hard Proofs |
| `/app/memory/ONE_SPINE_AUDIT_REPORT.md` | Latest audit status |
| `/app/memory/AGENT_INSTRUCTIONS.md` | QA protocols |

---

## Pet Soul Data Architecture (51 Fields)

### Field Categories:
| Category | Fields | Weight |
|----------|--------|--------|
| **Identity** | name, breed, age, weight, size, gender | 5% |
| **Health** | allergies, medical_conditions, sensitive_stomach, dietary_restrictions, medications, vaccination_status, spayed_neutered, last_vet_visit | 30% |
| **Personality** | general_nature, energy_level, stranger_reaction, behavior_with_dogs, behavior_with_humans, separation_anxiety | 15% |
| **Fears** | anxiety_triggers, loud_sounds, fear_response | 10% |
| **Preferences** | favorite_treats, favorite_toys, favorite_activities, dislikes, diet_type, food_brand, feeding_schedule | 20% |
| **Travel** | travel_style, car_comfort, motion_sickness, crate_trained, hotel_experience, flight_experience | 10% |
| **Training** | training_level, commands_known, leash_behavior, potty_trained, crate_behavior | 5% |
| **Lifestyle** | daily_routine, sleeping_spot, exercise_needs, grooming_frequency, last_grooming | 3% |
| **Special** | special_needs, emergency_contact, vet_clinic, do_not_recommend, good_for | 2% |

---

## What's Been Implemented

### Session: Feb 18, 2026

#### ✅ One Spine Specification & Audit
- Created comprehensive `/app/memory/ONE_SPINE_SPEC.md` with:
  - Bug naming conventions (member-facing vs internal)
  - Mental model copy to use everywhere
  - 5 Hard Proofs for verification
  - Complete QA script
- Created `/app/memory/ONE_SPINE_AUDIT_REPORT.md` with full audit results
- Updated `/app/memory/AGENT_INSTRUCTIONS.md` with spec references

#### ✅ Fixed Ownership Bug
- `UnifiedPicksVault.jsx` - Now passes `token` and `user` to API calls
- `MiraDemoPage.jsx` - Added `user` prop to UnifiedPicksVault

#### ✅ Database Backfill
- Added `has_unread_concierge_reply` field to all 2,113 tickets
- TCK tickets with member.email: 57% (historical data)

#### ✅ Pet Soul Enrichment
- 5 pets enriched with 50+ fields each
- All pillars tested and verified (Health-First, Emergency, Personalization, etc.)

#### ✅ Previous Session Work
- CELEBRATE Pillar Logic Fix
- Soul Learning Engine Implementation
- Breed Substitution Bug Instrumentation
- Full "One Spine" QA Verification

---

## Audit Status: One Spine

### Re-Audit Results (Feb 18, 2026)

**Test:** Created 3 fresh tickets from different entry points

| Test | Ticket ID | Status |
|------|-----------|--------|
| Chat Entry | TCK-2026-000038 | ✅ All proofs pass |
| Picks Entry | TCK-2026-000039 | ✅ All proofs pass |

**5 Hard Proofs - All PASS:**

| Proof | Status | Evidence |
|-------|--------|----------|
| 1. Canonical TCK Format | ✅ PASS | `TCK-2026-000038` matches `^TCK-\d{4}-\d{6}$` |
| 2. Services Visibility | ✅ PASS | Ticket in `mira_tickets` collection |
| 3a. member.email | ✅ PASS | `dipali@clubconcierge.in` |
| 3b. member.id | ✅ PASS | `a152181a-2f81-4323-8...` |
| 3c. parent_id | ✅ PASS | `a152181a-2f81-4323-8...` |
| 4. Two-Way Replies | ✅ PASS | Concierge reply appended to same thread |
| 5. Unread Indicator | ✅ PASS | `has_unread_concierge_reply: true` after reply |

**One Spine Status: ✅ CERTIFIED for new tickets**

### Legacy Data Status
- TCK tickets with ownership: 57% (covered by unified query)
- `has_unread_concierge_reply` field: 100% (backfilled)

---

## Prioritized Backlog

### P0 - Critical
- [x] **Re-run One Spine audit** - ✅ CERTIFIED (Feb 18, 2026)
- [ ] **Soul-Capture Onboarding** - 8-10 step experience

### P1 - High Priority
- [ ] **Mobile Specs Audit** - Typography & tap targets vs Bible
- [x] **Help Section** - Added FAQ with mental model copy
- [ ] **Monitor Breed Bug** - Check logs for `[BREED MISMATCH]`

### P2 - Medium Priority
- [ ] **WhatsApp Webhook Idempotency**
- [ ] **Legacy Ticket Migration** - 134+ tickets to `TCK-*` format

### P3 - Backlog
- [ ] Refactor `mira_routes.py` (20k+ lines)
- [ ] Refactor `MiraDemoPage.jsx`
- [ ] Push notification system

---

## Test Credentials
- **Email:** dipali@clubconcierge.in
- **Password:** test123
- **Test Pets:** Mystique, Lola, Meister, Bruno, Luna (all enriched)
- **Debug URL:** `/mira-demo?debug=1`

---

## Key Files Reference

### Specifications
- `/app/memory/ONE_SPINE_SPEC.md` - 5 Hard Proofs, QA script
- `/app/memory/ONE_SPINE_AUDIT_REPORT.md` - Current audit status
- `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` - The Law

### Backend
- `/app/backend/utils/service_ticket_spine.py` - Canonical ticket creation
- `/app/backend/utils/spine_helper.py` - Route adapter
- `/app/backend/routes/mira_routes.py` - Main chat logic

### Frontend
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Main UI
- `/app/frontend/src/components/PicksVault/UnifiedPicksVault.jsx` - Picks display
- `/app/frontend/src/components/Mira/OnboardingTooltip.jsx` - Mental model UI

### Tests
- `/app/backend/tests/test_pet_soul_enriched_data.py` - Soul data tests
- `/app/backend/scripts/enrich_pet_souls.py` - Pet enrichment script

---

## 3rd Party Integrations
- Google Places
- YouTube
- WhatsApp (Gupshup, Meta)
- Resend
- Shopify
- ElevenLabs
- Firebase

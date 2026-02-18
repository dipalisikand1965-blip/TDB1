# Pet Soul - Mira OS Product Requirements Document

## Original Problem Statement
Create a "Golden Standard Communication System" centered around an AI named "Mira." Development is guided by `PET_OS_BEHAVIOR_BIBLE.md`. 

### Core Architectural Rules:
1. **"Uniform Service Flow"** - All service actions create/attach to a single canonical "Service Desk Ticket" spine using `TCK-YYYY-NNNNNN` ID format
2. **"Health-First Safety Rule"** - Pet health facts always override conflicting preferences
3. **Mental Model**: "Chat is where you ask. Services is where it gets done."

## Product Requirements

### 1. Mental Model Reinforcement
All UI copy, notifications, and interaction flows must guide users to ask in Chat and manage execution/replies in Services.

### 2. Uniform Service Flow
Enforce single ticket backbone (`TCK-*` IDs) for all service requests.

### 3. Picks Fallback Logic
If Mira cannot find a matching product, the "Picks" panel must fall back to "Concierge Arranges" flow.

### 4. Deterministic UI Contracts
Frontend renders strictly based on `conversation_contract` from backend, including `mode` and `quick_replies`.

### 5. Explicit Location Consent
For "near me" queries, system must ask for consent before triggering geolocation.

### 6. Reply Guardrail
Prevent users from replying to open tickets in main Chat view by nudging them to Services thread.

### 7. Consistent Ownership
Ticket ownership derived from unified identity model.

### 8. Pet First, Breed Second Doctrine
Personalization logic prioritizes pet's individual traits over breed characteristics.

---

## Pet Soul Data Architecture (51 Fields)

### Field Categories:
| Category | Fields | Weight (Proposed) |
|----------|--------|-------------------|
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

#### ✅ Pet Soul Enrichment Complete
- **5 pets enriched** with comprehensive 50+ field data
- **Mystique**: Senior Shihtzu, arthritis, chicken/wheat allergy (85% soul score)
- **Lola**: Young Maltese, energetic, beef/corn allergy (78% soul score)
- **Meister**: Senior Shih Tzu, heart condition, severe anxiety (92% soul score)
- **Bruno**: Young Labrador, high energy, loves swimming (65% soul score)
- **Luna**: Golden Retriever, hip dysplasia, grain allergy (88% soul score)

#### ✅ All Pillars Tested & Verified
| Pillar | Test | Result |
|--------|------|--------|
| Health-First Safety | Chicken treats for Mystique | ✅ Allergy acknowledged |
| Health-First Safety | Food for Meister | ✅ Heart condition considered |
| Emergency Triage | Chocolate emergency | ✅ Immediate vet guidance |
| Personalization | Activities for Bruno | ✅ Active recommendations |
| Fear/Anxiety | Travel for Meister | ✅ No flight suggestions |
| Soul Learning | Memory trace | ✅ `_memory_trace` returned |
| Celebrate | Birthday for Lola | ✅ Uses preferences |
| Travel | Trip for Luna | ✅ Joint-friendly suggestions |

#### Previous Session Accomplishments:
- **CELEBRATE Pillar Logic Fix** - Multi-step conversation flow
- **Pet Soul Data Loading Fix** - Complete pet soul data loads from database
- **Soul Learning Engine** - Extracts and saves durable facts from conversations
- **Breed Substitution Bug Instrumentation** - Monitoring system active
- **Full "One Spine" QA Verification** - Ticketing flow verified

---

## Prioritized Backlog

### P0 - Critical
- [ ] **Recalibrate Soul Score** - Use 51-field framework with weighted categories
- [ ] **Soul-Capture Onboarding** - 8-10 step experience covering critical fields
- [ ] Perform Exhaustive Audit using `/app/memory/EXHAUSTIVE_AUDIT_FRAMEWORK.md`

### P1 - High Priority
- [ ] **Mobile Specs Audit** - Verify UI against Bible specs
- [ ] **Monitor Breed Bug** - Check logs for `[BREED MISMATCH]` alerts
- [ ] **UI Pet Context Switching** - Auto-switch context when asking about different pet
- [ ] Past Chats Panel UI implementation

### P2 - Medium Priority
- [ ] **WhatsApp Webhook Idempotency** - Use `source.provider_message_id`
- [ ] **Pet Memory Allergy Test** - Verify Health-First Safety Rule logic
- [ ] Legacy Ticket Migration (134+ tickets to `TCK-*` format)

### P3 - Backlog
- [ ] Refactor `mira_routes.py` (20k+ lines monolith)
- [ ] Refactor `MiraDemoPage.jsx`
- [ ] Picks Engine enhancements
- [ ] Push notification system

---

## Key Files Reference

### Backend
- `/app/backend/routes/mira_routes.py` - Main Mira chat logic
- `/app/backend/soul_intelligence.py` - Pet soul data handling (SOUL_FIELD_MAPPING)
- `/app/backend/utils/soul_learning_engine.py` - Conversation learning
- `/app/backend/utils/breed_mention_detector.py` - Breed bug monitoring
- `/app/backend/scripts/enrich_pet_souls.py` - Pet enrichment script

### Tests
- `/app/backend/tests/test_pet_soul_enriched_data.py` - Comprehensive soul data tests

### Frontend
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Main Mira UI

### Documentation
- `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` - Design specification
- `/app/memory/AGENT_INSTRUCTIONS.md` - Mandatory QA protocol

---

## Test Credentials
- **Email:** dipali@clubconcierge.in
- **Password:** test123
- **Test Pets:** Mystique, Lola, Meister, Bruno, Luna (all enriched)
- **Debug URL:** `/mira-demo?debug=1`

---

## 3rd Party Integrations
- Google Places
- YouTube
- WhatsApp (Gupshup, Meta)
- Resend
- Shopify
- ElevenLabs
- Firebase

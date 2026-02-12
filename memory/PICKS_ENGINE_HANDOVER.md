# MIRA OS PICKS ENGINE - COMPLETE AGENT HANDOVER
## Date: December 2025
## Status: B0, B1, B2 COMPLETE | B3-B9 PENDING

---

# ⚠️ CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE DOING ANYTHING

---

## 1. WHAT IS MIRA OS?

MIRA OS is a **life-led pet concierge system** - an intelligent assistant that helps pet parents manage every aspect of their pet's life across 13 life domains (pillars). The system classifies user messages, determines intent, applies safety gates, and returns personalized "Picks" (next-best-action recommendations).

**Core Principle:** Profile-First Doctrine - always use the specific pet's data (allergies, preferences, personality) over generic breed information.

---

## 2. WHAT HAS BEEN COMPLETED

### ✅ B0: Taxonomy Seeding (COMPLETE)
**Collections created:**
- `canonical_tags` (217 entries) - The vocabulary of what Mira understands
- `tag_synonyms` (625 entries) - Maps human language to canonical tags
- `service_verticals` (8 entries) - UI groupings for bookable services
- `service_vertical_synonyms` (46 entries)
- `service_types` (8 entries) - Fulfilment modes (at_home, salon, clinic, etc.)
- `service_type_synonyms` (61 entries)

**Seed script:** `/app/backend/scripts/seed_taxonomy.py` (IDEMPOTENT - safe to rerun)

### ✅ B1: Picks Catalogue Seeding (COMPLETE)
**Collection created:**
- `picks_catalogue` (110 picks) - Next-best-action recommendations

**Distribution:**
| Pillar | Picks |
|--------|-------|
| care | 18 |
| dine | 12 |
| stay | 10 |
| travel | 10 |
| enjoy | 8 |
| fit | 8 |
| learn | 8 |
| celebrate | 8 |
| adopt | 6 |
| advisory | 6 |
| paperwork | 6 |
| emergency | 6 |
| farewell | 4 |

**Seed script:** `/app/backend/scripts/seed_picks_catalogue.py` (IDEMPOTENT)

### ✅ B2: Classification Pipeline (COMPLETE + FIXED)
**Files created:**
- `/app/backend/classification_pipeline.py` - Main classification engine
- `/app/backend/tests/test_classification.py` - 28 unit tests (ALL PASSING)
- `/app/memory/seeds/B2_CLASSIFICATION_TESTS.md` - 50 test prompts

**Collection created:**
- `events_log` - Audit trail for all classifications

**Pipeline Order (MUST NOT CHANGE):**
1. Synonym match → canonical tags
2. Safety gate (emergency override)
3. Intent detection (buy vs book vs learn)
4. Pillar resolution
5. LLM fallback only if confidence < 0.6 OR no tags found

**B2 Fixes Applied:**
- Intent: "looking for a cake" now returns `buy` (not `book`)
- Confidence: Single synonym match capped at 0.92, emergency at 0.99

### ✅ B3: Safety Gate (COMPLETE + FIXED)
**Files created:**
- `/app/backend/safety_gate.py` - Behavioural override layer
- `/app/backend/tests/test_safety_gate.py` - 21 unit tests (ALL PASSING)

**B3 Fix Applied:**
- "gagging after eating" now returns `caution` (not emergency)
- Added `choking_suspected` as a CAUTION tag with gating questions
- Emergency choking only triggers with: "can't breathe", "blue tongue", "collapsed", etc.

**Gating Questions for Escalation:**
```json
{
  "choking_suspected": {
    "questions": [
      "Can your pet breathe at all? (even labored or noisy breathing)",
      "Is their tongue or gums turning blue/purple?"
    ],
    "escalation_answers": {
      "q1_no": "emergency",
      "q2_yes": "emergency"
    }
  }
}
```

**Safety Gate Behavior:**
| Level | Behavior |
|-------|----------|
| `emergency` | Suppress ALL commerce, show ER vet CTA, first aid steps, emergency-red UI |
| `caution` | Suppress shopping, allow education + vet booking, caution-yellow UI, gating questions |
| `normal` | No restrictions |

**Returns `safety_override` object:**
```json
{
  "is_active": true,
  "level": "emergency",
  "suppress_products": true,
  "suppress_bookings": true,
  "suppress_shop": true,
  "show_emergency_banner": true,
  "emergency_vet_cta": "Call/Go to Nearest Emergency Vet Now",
  "first_aid_steps": ["Step 1", "Step 2", ...],
  "allowed_pick_types": ["emergency", "concierge"],
  "ui_theme": "emergency-red",
  "gating_questions": ["..."],  // For caution tags needing escalation assessment
  "escalation_info": {...}
}
```

### ✅ B4: Scoring Function (COMPLETE)
**Files created:**
- `/app/backend/picks_scorer.py` - Picks scoring and ranking engine

**Scoring Formula:**
```
final_score = (base_score * tag_match_multiplier) - profile_penalty + recency_bonus

Where:
- base_score: From picks_catalogue (0-100)
- tag_match_multiplier: 1.0 + (0.15 * num_matching_tags), capped at 1.5x
- profile_penalty: 5 points per missing required field
- recency_bonus: Up to 10 points based on last_service_date
```

**B4 Features:**
1. **Safety gates respected** - Emergency filters to emergency-only picks
2. **Intent gates** - Buy prioritizes products, Book prioritizes bookings
3. **Profile penalty** - Missing required fields reduce score
4. **Micro-question generation** - Prompts for missing profile data
5. **Diversity rerank** - Ensures variety (booking/product + guide + concierge)

**Example Scoring Results:**
| Query | Intent | Top Pick | Score |
|-------|--------|----------|-------|
| "grooming for Mojo" | book | care_grooming_book | 92.0 |
| "cake for Mojo" | buy | celebrate_cake_order | 92.0 |
| "ate chocolate" | emergency | emergency_vet_now | 100 |
| "vomiting twice" | caution | care_vomiting_vet | 97.75 |

---

## 3. LOCKED ARCHITECTURE (DO NOT MODIFY)

### 13 Locked Pillars (NEVER ADD NEW ONES)
```python
LOCKED_PILLARS = [
    "care",      # Physical wellbeing, grooming, preventive health (NON-MEDICAL)
    "dine",      # Nutrition, feeding, diet
    "stay",      # Boarding, sitting, habitat
    "travel",    # Movement, transport, documentation
    "enjoy",     # Play, enrichment, social
    "fit",       # Exercise, mobility, training
    "learn",     # Education, guides, videos
    "celebrate", # Milestones, events, memories
    "adopt",     # Adoption, fostering, integration
    "advisory",  # Expert guidance, second opinions
    "paperwork", # Documents, certificates
    "emergency", # Acute risk, immediate response (HARD OVERRIDE)
    "farewell"   # End-of-life, memorial, grief
]
```

### What is NOT a Pillar
- `health` - Lives inside `care` (non-medical guidance only)
- `shop` - Is a CLUSTER triggered by buy intent
- `services` - Is a LAYER triggered by book/arrange intent

### Safety Levels
```
normal   → Standard routing
caution  → Suppress shopping, allow education + vet routing
emergency → HARD OVERRIDE to emergency pillar, suppress ALL commerce
```

### Routing Priority (HARDCODED)
```
1. Emergency gate (safety_level = emergency) → Override to emergency pillar
2. Caution flag (safety_level = caution) → Suppress shop, allow learn + vet
3. Book/Arrange intent → Services layer
4. Buy intent → Shop cluster
5. Else → Route to matching pillar
```

---

## 4. KEY FILES TO READ

### Documentation (READ THESE FIRST)
```
/app/memory/seeds/B0_DRAFT_TAXONOMY_FOR_APPROVAL.md  ← Full taxonomy spec
/app/memory/seeds/B1_PICKS_CATALOGUE.md              ← All 110 picks + 20 test prompts
/app/memory/seeds/B2_CLASSIFICATION_TESTS.md         ← 50 classification test prompts
/app/memory/MIRA_OS_14_PILLARS_BIBLE.md              ← Pillar definitions
/app/memory/PROFILE_FIRST_DOCTRINE.md                ← Personalization rules
/app/memory/PICKS_ENGINE_SPEC_v1.md                  ← Original spec
```

### Code (UNDERSTAND BEFORE MODIFYING)
```
/app/backend/classification_pipeline.py              ← B2 classification engine
/app/backend/safety_gate.py                          ← B3 safety gate + first aid + gating questions
/app/backend/picks_scorer.py                         ← B4 scoring + ranking + diversity
/app/backend/scripts/seed_taxonomy.py                ← B0 seeder
/app/backend/scripts/seed_picks_catalogue.py         ← B1 seeder
/app/backend/tests/test_classification.py            ← B2 unit tests (28 passing)
/app/backend/tests/test_safety_gate.py               ← B3 unit tests (21 passing)
/app/backend/server.py                               ← Main FastAPI server
```

---

## 5. DATABASE SCHEMA

### canonical_tags
```json
{
  "pillar": "string (lowercase)",
  "pillar_display": "string (Title Case)",
  "cluster": "string",
  "tag": "string (snake_case, UNIQUE)",
  "tag_display": "string",
  "definition": "string",
  "safety_level": "normal | caution | emergency",
  "is_emergency": "boolean",
  "is_caution": "boolean",
  "priority": "low | medium | high | critical",
  "deprecated": "boolean",
  "replaced_by": "string (optional)",
  "seed_version": "string",
  "source_doc_version": "string",
  "created_at": "datetime"
}
```

### tag_synonyms
```json
{
  "synonym": "string (lowercase, UNIQUE)",
  "tag": "string (references canonical_tags.tag)",
  "pillar": "string",
  "confidence": "float (0-1)",
  "protected": "boolean (for emergency tags)",
  "deprecated": "boolean",
  "seed_version": "string",
  "source_doc_version": "string",
  "created_at": "datetime"
}
```

### picks_catalogue
```json
{
  "pick_id": "string (UNIQUE)",
  "pillar": "string",
  "canonical_tags": ["array"],
  "pick_type": "guide | booking | product | checklist | concierge | emergency",
  "title": "string",
  "cta": "string",
  "reason_template": "string with {pet_name}, {breed}, {age_stage}, etc.",
  "constraints": {
    "species": ["dog", "cat"],
    "age_stage": ["puppy", "adult", "senior", null],
    "exclude_health_flags": [],
    "required_profile_fields": []
  },
  "service_vertical": "string (for booking picks)",
  "service_types": ["array"],
  "base_score": "number (0-100)",
  "concierge_complexity": "low | medium | high",
  "safety_level": "normal | caution | emergency",
  "seed_version": "string",
  "source_doc_version": "string",
  "created_at": "datetime"
}
```

### events_log
```json
{
  "message_id": "string",
  "pet_id": "string",
  "user_id": "string",
  "message": "string",
  "primary_pillar": "string",
  "canonical_tags": ["array"],
  "service_verticals": ["array"],
  "service_types": ["array"],
  "intent": "learn | buy | book | plan | track | emergency | unknown",
  "confidence": "float (0-1)",
  "safety_level": "normal | caution | emergency",
  "matched_synonyms": ["array"],
  "synonyms_hit": "number",
  "missing_profile_fields": ["array"],
  "timestamp": "datetime",
  "picks_shown": ["array of pick_ids"]
}
```

---

## 6. CLASSIFICATION OUTPUT SCHEMA (NEVER MODIFY)

Every classification MUST return:
```json
{
  "primary_pillar": "string (from locked 13)",
  "canonical_tags": ["array"],
  "service_verticals": ["array (optional)"],
  "service_types": ["array (optional)"],
  "intent": "learn | buy | book | plan | track | emergency | unknown",
  "confidence": "float (0-1)",
  "safety_level": "normal | caution | emergency",
  "matched_synonyms": ["array (for audit/debug)"],
  "missing_profile_fields": ["array (for Picks personalization)"]
}
```

---

## 7. WHAT NEEDS TO BE DONE NEXT

### PHASE B OVERVIEW (B0-B8)
```
B0 ✅ Taxonomy Seeding (canonical_tags, synonyms, service types)
B1 ✅ Picks Catalogue (110 picks across 13 pillars)
B2 ✅ Classification Pipeline (synonym match → safety → intent → pillar)
B3 ✅ Safety Gate (emergency/caution override + first aid + gating questions)
B4 ✅ Scoring Function (tag match, profile penalty, diversity rerank)
B5 ⏳ Concierge Logic (when to show "Concierge® can coordinate")
B6 ⏳ API Integration (wire into /api/mira/chat)
B7 ⏳ Events Log + Analytics (shown/clicked/booked/suppressed)
B8 ⏳ Scenario Testing + Tuning (50 real-world prompts, adjust weights)
```

### B5: Concierge Logic (NEXT)
**Requirements:**
- Always show Concierge pick when:
  - `concierge_complexity` is "medium" or "high"
  - Classification `confidence` < 0.6
  - No direct catalogue match found
  - User explicitly asks for help coordinating
- Concierge reasons:
  - "This seems complex - Concierge® can coordinate multiple services"
  - "Not sure exactly what you need? Concierge® can help clarify"
  - "This requires coordination across providers"

### B6: Integration into /api/mira/chat
**Requirements:**
- Wire `classify_with_safety()` + `score_picks()` into chat endpoint
- Return picks alongside chat response:
```json
{
  "message": "...",
  "picks": {
    "picks": [...],
    "micro_questions": [...]
  },
  "safety_override": {...}
}
```
- Update `events_log` with `picks_shown` array

### B7: Events Log + Analytics
**Requirements:**
- Track in `events_log`:
  - `picks_shown`: Array of pick_ids shown to user
  - `picks_clicked`: Array of pick_ids clicked
  - `picks_booked`: Array of picks that led to booking
  - `picks_suppressed`: Array of picks filtered by safety/intent
  - `suppression_reason`: Why picks were suppressed
- Enable analytics queries:
  - Click-through rate per pick
  - Conversion rate per pick_type
  - Safety gate trigger frequency
  - Most common missing profile fields

### B8: Scenario Testing + Tuning
**Requirements:**
- Test 50 real-world prompts:
  - Clean queries: "book grooming", "order cake"
  - Messy queries: "groming for mojo", "bday cake"
  - Hinglish: "vet appointment book karna hai"
  - Emergencies: "ate chocolate", "not breathing"
  - Caution: "vomiting", "limping", "gagging"
- For each: verify pillar, intent, safety_level, top 3 picks
- Adjust scoring weights if needed:
  - Tag match multiplier (currently 0.15)
  - Profile penalty (currently 5 per field)
  - Base score distributions
- Document edge cases and fixes

---

## 8. NON-NEGOTIABLES (VIOLATIONS WILL BREAK THE SYSTEM)

### 1. NEVER invent a new pillar
```python
# WRONG
result["primary_pillar"] = "health"  # ❌ NOT A PILLAR

# RIGHT
result["primary_pillar"] = "care"    # ✅ From locked 13
```

### 2. NEVER give medical advice
```python
# WRONG
"Your dog has parvo. Give them antibiotics."  # ❌ DIAGNOSIS + PRESCRIPTION

# RIGHT
"This sounds serious. Please contact a vet immediately."  # ✅ ROUTING
```

### 3. Emergency ALWAYS overrides
```python
# If safety_level == "emergency":
#   - Suppress ALL products
#   - Suppress ALL bookings (except ER vet routing)
#   - Show emergency picks ONLY
```

### 4. Caution suppresses shopping
```python
# If safety_level == "caution":
#   - Suppress product picks
#   - Allow education (guides)
#   - Allow vet coordination
```

### 5. Services is NOT a pillar
```python
# WRONG
result["primary_pillar"] = "services"  # ❌ NOT A PILLAR

# RIGHT
# Services is triggered by intent: book/arrange/schedule
# The pillar is still care, stay, travel, etc.
```

### 6. Shop is NOT a pillar
```python
# WRONG
result["primary_pillar"] = "shop"  # ❌ NOT A PILLAR

# RIGHT
# Shop is triggered by intent: buy/purchase/order
# The pillar is still dine, care, celebrate, etc.
```

---

## 9. TEST CREDENTIALS

```
Test User: dipaliclubconceirge.in / test123 (pet: Mystique)
Admin: aditya / lola4304 (pet: Lola)
```

---

## 10. HOW TO RUN TESTS

### Unit Tests
```bash
cd /app/backend
python -m pytest tests/test_classification.py -v
```

### Manual Classification Test
```bash
cd /app/backend
python classification_pipeline.py
```

### Re-run Seeders (SAFE - Idempotent)
```bash
cd /app/backend
python scripts/seed_taxonomy.py        # B0
python scripts/seed_picks_catalogue.py # B1
```

---

## 11. EXAMPLE CLASSIFICATIONS (UPDATED)

### "looking for grooming for mojo"
```json
{
  "primary_pillar": "care",
  "canonical_tags": ["grooming"],
  "service_verticals": ["grooming"],
  "intent": "book",
  "confidence": 0.92,
  "safety_level": "normal",
  "picks": [
    {"pick_id": "care_grooming_book", "score": 92.0, "type": "booking"},
    {"pick_id": "care_grooming_home", "score": 86.25, "type": "booking"},
    {"pick_id": "care_coat_guide", "score": 60.0, "type": "guide"}
  ]
}
```

### "looking for a cake for mojo"
```json
{
  "primary_pillar": "celebrate",
  "canonical_tags": ["cakes"],
  "intent": "buy",
  "confidence": 0.92,
  "safety_level": "normal",
  "picks": [
    {"pick_id": "celebrate_cake_order", "score": 92.0, "type": "product"},
    {"pick_id": "celebrate_birthday", "score": 80.0, "type": "guide"},
    {"pick_id": "celebrate_photo_shoot", "score": 75.0, "type": "booking"}
  ]
}
```

### "my dog ate chocolate"
```json
{
  "primary_pillar": "emergency",
  "canonical_tags": ["poison_ingestion"],
  "intent": "emergency",
  "confidence": 0.99,
  "safety_level": "emergency",
  "safety_override": {
    "is_active": true,
    "level": "emergency",
    "suppress_products": true,
    "emergency_vet_cta": "Call/Go to Nearest Emergency Vet Now",
    "first_aid_steps": ["Do NOT induce vomiting...", "Note what was eaten...", "..."],
    "ui_theme": "emergency-red"
  },
  "picks": [
    {"pick_id": "emergency_vet_now", "score": 100, "type": "emergency"},
    {"pick_id": "emergency_poison", "score": 100, "type": "emergency"}
  ]
}
```

### "gagging after eating" (FIXED - Now Caution)
```json
{
  "primary_pillar": "care",
  "canonical_tags": ["choking_suspected"],
  "intent": "unknown",
  "confidence": 0.85,
  "safety_level": "caution",
  "safety_override": {
    "is_active": true,
    "level": "caution",
    "suppress_products": true,
    "suppress_shop": true,
    "show_caution_banner": true,
    "caution_message": "Your pet may have something stuck. Monitor closely and answer these questions to assess severity.",
    "gating_questions": [
      "Can your pet breathe at all? (even labored or noisy breathing)",
      "Is their tongue or gums turning blue/purple?"
    ],
    "ui_theme": "caution-yellow"
  }
}
```

---

## 12. MONGODB COLLECTIONS SUMMARY

| Collection | Count | Purpose |
|------------|-------|---------|
| canonical_tags | 217 | Tag vocabulary |
| tag_synonyms | 625 | Human language → tags |
| service_verticals | 8 | Booking categories |
| service_vertical_synonyms | 46 | Service matching |
| service_types | 8 | Fulfilment modes |
| service_type_synonyms | 61 | Fulfilment matching |
| picks_catalogue | 110 | Next-best-actions |
| events_log | Growing | Audit trail |

---

## 13. FRONTEND INTEGRATION NOTES

The frontend is at `/app/frontend/src/pages/MiraDemoPage/MiraDemoPage.jsx` (3400+ lines).

When integrating picks:
1. Call classification endpoint
2. Receive picks in response
3. Display picks based on safety_level:
   - `emergency` → Red/urgent UI, suppress all commerce
   - `caution` → Yellow/warning UI, suppress shopping
   - `normal` → Standard UI
4. Interpolate reason_template with pet data

---

## 14. ENVIRONMENT VARIABLES

```bash
# Backend (.env)
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database

# Frontend (.env)
REACT_APP_BACKEND_URL=<from env file>
```

---

## 15. WHAT TO DO IMMEDIATELY

1. **READ** this entire document
2. **READ** `/app/memory/seeds/B0_DRAFT_TAXONOMY_FOR_APPROVAL.md`
3. **READ** `/app/memory/seeds/B1_PICKS_CATALOGUE.md`
4. **READ** `/app/memory/seeds/B2_CLASSIFICATION_TESTS.md`
5. **RUN** `python -m pytest tests/test_classification.py tests/test_safety_gate.py -v` to verify tests pass
6. **RUN** `python picks_scorer.py` to see scoring example output
7. **THEN** proceed with B5 (Concierge Logic)

---

## 16. PHASE B COMPLETE STATUS

| Phase | Description | Status | Tests |
|-------|-------------|--------|-------|
| B0 | Taxonomy Seeding | ✅ COMPLETE | - |
| B1 | Picks Catalogue | ✅ COMPLETE | - |
| B2 | Classification Pipeline | ✅ COMPLETE | 28 passing |
| B3 | Safety Gate | ✅ COMPLETE | 21 passing |
| B4 | Scoring Function | ✅ COMPLETE | - |
| B5 | Concierge Logic | ⏳ PENDING | - |
| B6 | API Integration | ⏳ PENDING | - |
| B7 | Events Log + Analytics | ⏳ PENDING | - |
| B8 | Scenario Testing | ⏳ PENDING | - |

**Total Unit Tests: 49 passing**

---

## 16. CONTACT / ESCALATION

If something seems wrong:
1. Check events_log for recent classifications
2. Run unit tests
3. Check if seeders need to be re-run
4. Refer to original spec: `/app/memory/PICKS_ENGINE_SPEC_v1.md`

---

## 17. FINAL CHECKLIST BEFORE STARTING

- [ ] Read this document completely
- [ ] Understand the 13 locked pillars
- [ ] Understand safety_level behavior
- [ ] Understand routing priority
- [ ] Run unit tests successfully
- [ ] Review classification_pipeline.py code
- [ ] Confirm you will NOT invent new pillars
- [ ] Confirm you will NOT give medical advice

---

*Handover created: December 2025*
*Last updated: December 2025 (B4 complete)*
*B0, B1, B2, B3, B4: COMPLETE*
*B5, B6, B7, B8: PENDING*
*Total entries seeded: 1,100+*
*Total unit tests: 49 passing*

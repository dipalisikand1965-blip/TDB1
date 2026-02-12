# PICKS ENGINE v1 - COMPLETE SPECIFICATION
## MANDATORY READ FOR ALL AGENTS

> This document contains the COMPLETE, EXHAUSTIVE specification for the Picks Engine.
> It was created from discussions with the product owner and the master specification documents.
> DO NOT deviate from this spec without explicit approval.

---

## 1. WHAT IS THE PICKS ENGINE?

**Picks = "Next Best Actions"** - Smart, contextual suggestions computed from:
- `primary_pillar` + `canonical_tags` + `service_types` + universal pet profile

Picks are NOT:
- Generic keyword suggestions
- Random product recommendations
- Hardcoded responses

---

## 2. NON-NEGOTIABLES FOR v1

### 2.1 Safety Gating FIRST
If Emergency/Care risk tags fire (poison, breathing distress, seizure, collapse, severe vomiting/diarrhoea):
- Picks MUST switch to Emergency protocol + nearest ER vet
- SUPPRESS product pushes
- ALWAYS log why safety gate triggered

### 2.2 Taxonomy-First Matching
- Conversation text → canonical tags using synonyms map
- Picks are tied to TAGS, not raw keywords
- Every pick must include `pick_type` and `reason` for audit

### 2.3 Pick Types (enum)
```
guide | booking | product | checklist | program | concierge | emergency
```

### 2.4 Temporal Triggers
Hard boosts for:
- Vaccines due
- Gotcha day / birthday window (7 days)
- Travel date approaching
- Expiry tracking

### 2.5 Concierge Rules
Show Concierge® when:
- Complexity is HIGH (multi-step, multi-pillar)
- Confidence is LOW (< 0.65)
- User asks "help me plan" / "arrange" / "coordinate"
- Top pick has `concierge_complexity: high`

**NOT always for Travel/Celebrate/Stay** - only when genuinely complex.

---

## 3. SCORING FORMULA (v1)

```
score = (tag_match × 0.4) + (profile_fit × 0.25) + (temporal × 0.2) + (hard_boosts × 0.15)
```

### 3.1 Tag Match (40% - DOMINANT)
- Tag overlap between pick and classification
- Service type overlap adds bonus
- Multiplied by classification confidence

### 3.2 Profile Fit (25%)
- `age_stage` match
- `breed` / `size` match
- `health_flags` match/exclude

### 3.3 Temporal Boost (20%)
- Birthday window: +0.8
- Vaccines overdue: +0.9
- Grooming due: +0.5
- Travel within 30 days: +0.7

### 3.4 Hard Boosts (15%)
- Rule-driven from pick metadata
- Stored in `temporal_triggers` field
- Engine stays generic, rules in data

---

## 4. SAFETY STATES (enum)

| State | Behaviour |
|-------|-----------|
| `normal` | Standard picks flow |
| `caution` | Suppress products, vet-first advisory, allow educational |
| `emergency` | Override all, show ER vet, immediate concierge |

### Emergency Tags (HARD OVERRIDE)
```
poison_ingestion, breathing_distress, seizure, collapse,
severe_vomiting, severe_diarrhea, bleeding_severe,
unconscious, choking, heatstroke, not_breathing
```

### Caution Tags (SOFT OVERRIDE)
```
mild_vomiting, diarrhea, lethargy, loss_appetite, limping,
excessive_scratching, unusual_behavior, eye_discharge
```

---

## 5. DATA MODELS

### 5.1 canonical_tags Collection
```json
{
  "tag": "grooming",           // snake_case, UNIQUE across system
  "tag_display": "Grooming",   // Human-friendly
  "pillar": "care",            // lowercase enum
  "cluster": "hygiene",        // Grouping within pillar
  "definition": "Professional pet grooming services",
  "example_request": "My dog needs a haircut",
  "applies_to": "dog|cat",
  "priority": "medium",        // critical > high > medium > low
  "safety_level": "normal",    // normal | caution | emergency
  "parent_tag": null           // For hierarchy
}
```

### 5.2 tag_synonyms Collection
```json
{
  "synonym": "haircut",        // User phrase (lowercase)
  "tag": "grooming",           // Maps to canonical tag
  "confidence": 0.95,
  "notes": "Common term"
}
```

### 5.3 service_types Collection
```json
{
  "service_type": "grooming",  // Canonical identifier
  "display": "Grooming",
  "definition": "Grooming delivered at salon or home",
  "service_modes": ["salon", "at_home"]
}
```

### 5.4 service_type_synonyms Collection
```json
{
  "synonym": "groomer",
  "service_type": "grooming",
  "confidence": 0.9,
  "notes": "Care pillar"
}
```

### 5.5 picks_catalogue Collection
```json
{
  "pick_id": "pick-grooming-booking",
  "title": "Book Grooming Session",
  "pick_type": "booking",
  "pillar": "care",
  "canonical_tags": ["grooming", "coat_care"],
  "service_types": ["grooming"],
  "constraints": {
    "applies_to": ["dog", "cat"],
    "age_stages": ["puppy", "adult", "senior"],
    "include_health_flags": [],
    "exclude_health_flags": ["skin_condition_active"],
    "requires_profile_fields": ["last_groom_date"],
    "suppress_if_safety_state": ["emergency"]
  },
  "temporal_triggers": {
    "grooming_due_days": 45,
    "birthday_window_days": null,
    "vaccine_due": false
  },
  "reason_template": "Based on {pet_name}'s {coat_type} coat",
  "catalogue_ref": null,
  "cta": "Book",
  "concierge_complexity": "low",
  "base_score": 50
}
```

### 5.6 tag_rules Collection
```json
{
  "tag": "emergency",
  "required_fields": ["pet_id", "symptoms"],
  "questions": ["What symptoms are you seeing?"],
  "safety_gate": "emergency",
  "route_to": "emergency_flow",
  "suppress_picks_flags": ["product", "booking"]
}
```

### 5.7 events_log Collection (Audit)
```json
{
  "timestamp": "2026-02-12T...",
  "user_id": "...",
  "pet_id": "...",
  "message_id": "...",
  "primary_pillar": "care",
  "tags": ["grooming"],
  "service_types": ["grooming"],
  "safety_state": "normal",
  "safety_triggered_by": [],
  "picks_shown": ["pick-grooming-booking"],
  "confidence": 0.87
}
```

---

## 6. SERVICE TYPES (Canonical)

| service_type | Definition |
|--------------|------------|
| `grooming` | Grooming at salon or home (bath, haircut, nails, ears, dental) |
| `training` | Trainer/behaviourist sessions for obedience or behaviour |
| `boarding` | Overnight boarding/kennel/villa including medical boarding |
| `daycare` | Daytime supervised daycare or day boarding |
| `vet_care` | Vet appointment booking, diagnostics, vaccinations, referrals |
| `dog_walking` | Dog walking scheduling incl. subscriptions |
| `pet_photography` | Studio/outdoor/event photography |
| `transport` | Pet taxi / pickup-drop / chauffeur logistics |

### Service Modes (How service is delivered)
```
salon | at_home | clinic | online | field | boarding_facility | daycare_center
```

**CRITICAL:** Service types are FULFILMENT methods, not pillars.
- "booking" and "at_home" are NOT service types
- They are `pick_type=booking` or `service_mode=at_home`

---

## 7. CLASSIFICATION PIPELINE

```
1. User Input
2. Extract candidate phrases
3. Match against tag_synonyms → get canonical_tags
4. Match against service_type_synonyms → get service_types
5. Resolve primary_pillar from tags (highest confidence)
6. SAFETY GATE CHECK (emergency override)
7. LLM fallback only when confidence < 0.6
8. Output: Classification object
```

### Classification Output Schema
```json
{
  "primary_pillar": "care",
  "tags": ["grooming", "coat_care"],
  "service_types": ["grooming"],
  "universal_tags": ["age_stage:adult", "size:medium"],
  "confidence": 0.87,
  "safety_state": "normal",
  "safety_triggered_by": []
}
```

---

## 8. PICKS ENGINE PIPELINE

```
1. Receive Classification
2. SAFETY GATE (if emergency → emergency picks only)
3. Fetch candidate picks by tags + service_types + pillar
4. Apply constraints filters
5. Score + rerank
6. Include Concierge® (conditional)
7. Output top 3-6 picks
8. Log to events_log
```

### Picks Output Schema
```json
{
  "picks": [
    {
      "pick_id": "pick-grooming-booking",
      "pick_type": "booking",
      "title": "Book Grooming Session",
      "reason": "Lola's double coat hasn't been groomed in 52 days",
      "score": 0.87,
      "cta": "Book",
      "catalogue_ref": "svc-grooming-salon"
    }
  ],
  "concierge": {
    "show": true,
    "reason": "complexity_medium",
    "cta": "Have Concierge® coordinate"
  },
  "safety_override": null
}
```

---

## 9. CONCIERGE LOGIC (Conditional)

Show Concierge® when:
1. **Multi-step request** (multiple service types)
2. **Tight timeline** ("tomorrow", "urgent", "asap")
3. **Low confidence** (< 0.65)
4. **User explicitly asks** ("help me plan", "arrange", "coordinate")
5. **Top pick complexity is high**
6. **Multiple pillars detected**

**DO NOT show for simple Travel/Celebrate/Stay** - only when genuinely complex.

---

## 10. API ENDPOINTS

### 10.1 Classification API
```
POST /api/mira/classify
Input: { message, pet_id }
Output: Classification object
```

### 10.2 Picks API
```
POST /api/mira/picks
Input: { classification, pet_profile, temporal_context }
Output: Picks array + concierge + safety_override
```

### 10.3 Main Chat (Integrated)
```
POST /api/mira/chat
Returns picks inline with chat response
```

---

## 11. IMPLEMENTATION PHASES

| Phase | Task | Status |
|-------|------|--------|
| 0 | Seed canonical_tags + tag_synonyms | PENDING |
| 1 | Create service_types + service_type_synonyms | PENDING |
| 2 | Seed picks_catalogue (80-120 picks all pillars) | PENDING |
| 3 | Build classification pipeline | PENDING |
| 4 | Build safety gate (emergency + caution) | PENDING |
| 5 | Build scoring function | PENDING |
| 6 | Build concierge logic | PENDING |
| 7 | Integrate into /api/mira/chat + expose /api/mira/picks | PENDING |
| 8 | Create events_log for audit | PENDING |
| 9 | Test with 20+ scenarios | PENDING |

---

## 12. PILLAR CASING RULES

- **Store internally:** lowercase (`care`, `travel`, `dine`)
- **Store for display:** Title Case (`Care`, `Travel`, `Dine`)
- **Accept both at input:** Always normalize on write
- **Don't migrate everything:** Just normalize going forward

---

## 13. DEFER TO LATER

- A/B testing infrastructure (wait until picks are stable)
- Full catalogue integration (start simple)
- Complex scoring weights (v1 is simple additive)

---

*Document Version: 1.2*
*Created: February 12, 2026*
*Source: User discussions + Mira_OS_Taxonomy_Routing_Picks_Spec_v1_2_Master.docx*

# PICKS ENGINE SPEC v1.0 (Original Discussion Document)
## Mira OS Taxonomy, Routing, and Picks Engine Specification

> **NOTE:** This is the ORIGINAL v1.0 discussion document.
> See `/app/memory/PICKS_ENGINE_SPEC_v1.md` for the FINAL approved spec (v1.2).
> This document is preserved for reference and understanding of the evolution.

---

## DOCUMENT HISTORY

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | Feb 2026 | Initial spec for discussion |
| v1.1 | Feb 2026 | Addendum: Canonical clarification, missing pillars |
| v1.2 | Feb 12, 2026 | Final approved spec with all corrections |

---

## I. CORE DATA MODEL

### Structure for User Request

```json
{
  "primary_pillar": "string (required)",  // Exactly one pillar
  "tags": ["string (required)"],          // One or more canonical tags
  "service_types": ["string (optional)"], // Fulfilment methods
  "universal_tags": ["string (optional)"], // Profile and control tags
  "confidence": 0.85,                      // 0-1, required
  "safety_state": "normal"                 // enum: normal | caution | emergency
}
```

---

## II. PILLARS (User Intent Categories)

### Finalized Pillars

| Pillar | Purpose |
|--------|---------|
| Celebrate | Occasions, milestones, birthdays |
| Dine | Nutrition, feeding, food |
| Stay | Boarding, daycare, home setup |
| Travel | Transport, trips, relocation |
| Care | Physical wellbeing, grooming, hygiene |
| Enjoy | Play, enrichment, social |
| Fit | Exercise, mobility, fitness |
| Shop Assist | Product discovery and shopping |
| Paperwork | Documents, licenses, records |
| Advisory | Professional guidance, consults |
| Emergency | Urgent care, crisis response |
| Farewell | End-of-life, memorial (identified as needing full population) |
| Adopt | Adoption, integration (identified as needing full population) |
| Learn | Training, education (identified as needing full population) |

### KEY CLARIFICATION

**"Services" is NOT a pillar.** Services are FULFILMENT METHODS stored as `service_type`.

---

## III. SERVICE TYPES (Fulfilment Model)

### Definition
Service types represent the **method of fulfilment** (booking, scheduling, sourcing a provider).
Stored as a separate field from pillars.

### Defined Service Types (v1 Baseline)

| service_type | Description |
|--------------|-------------|
| `grooming` | Grooming services |
| `training` | Trainer/behaviourist sessions |
| `boarding` | Overnight boarding |
| `daycare` | Daytime care |
| `vet_care` | Vet appointments |
| `dog_walking` | Walking services |
| `pet_photography` | Photography services |
| `transport` | Pet taxi/transport |

### Extended Service Types (from Addendum)

| service_type | Synonyms | Notes |
|--------------|----------|-------|
| `grooming_booking` | grooming appointment, salon grooming | Care pillar |
| `at_home_grooming` | home grooming, groomer at home | Care pillar |
| `training_session` | trainer, obedience class | Fit or Learn |
| `vet_visit_booking` | vet appointment, consult, check-up | Care / Emergency |
| `tele_vet` | online vet, video consult | Care |
| `boarding_booking` | kennel, boarding, pet hotel | Stay |
| `daycare_booking` | daycare, day boarding | Stay |
| `dog_walking` | walker, walks, daily walk service | Fit |
| `pet_sitting` | sitter, drop-in, overnight sitter | Stay |
| `pet_transport` | pet taxi, cab with pet, transport | Travel |
| `pet_photography` | photoshoot, photographer | Celebrate / Enjoy |
| `concierge_handoff` | arrange, coordinate, manage end-to-end | Always available |
| `emergency_routing` | emergency now, urgent vet, ER | Emergency |

---

## IV. CANONICAL TAG DICTIONARY STRUCTURE

### Schema

| Field | Description |
|-------|-------------|
| `pillar` | Parent pillar (lowercase) |
| `cluster` | Grouping within pillar |
| `tag` | lowercase snake_case, STABLE identifier |
| `tag_display` | Human-friendly display name |
| `definition` | What this tag means |
| `example_request` | Sample user request |
| `applies_to` | dog\|cat or more specific |
| `priority` | critical > high > medium > low |
| `parent_tag` | For hierarchy (optional) |
| `notes` | Implementation notes |

### Conventions

1. `tag` is lowercase snake_case and STABLE (never changes)
2. `tag_display` is human-friendly and CAN change
3. Each tag lives in EXACTLY ONE pillar (no duplicates across pillars)
4. Use `parent_tag` for hierarchical relationships
5. `applies_to` determines species applicability
6. `priority` affects sorting and display

### De-duplication Rule

If a concept could live in multiple pillars:
- Create separate tags with explicit context, OR
- Model context via `pillar` + `service_type` combination

---

## V. UNIVERSAL TAGS (Profile + Controls)

### Profile Tags

| Category | Tags |
|----------|------|
| Pet Type | `pet_type` |
| Breed | `breed` |
| Age | `age_stage` (puppy, adult, senior) |
| Size | `size` |
| Temperament | `temperament` |
| Energy | `energy_level` |
| Social | `sociability` |

### Health Flags

| Tag | Purpose |
|-----|---------|
| `health_flags_allergies` | Known allergies |
| `health_flags_chronic` | Chronic conditions |
| `meds_required` | Medications needed |
| `mobility_limitations` | Mobility issues |

### Preferences

| Tag | Purpose |
|-----|---------|
| `brand_pref` | Brand preferences |
| `eco_pref` | Eco-conscious preferences |
| `quiet_pref` | Preference for quiet |
| `crowd_avoid` | Avoid crowded places |
| `routine_strict` | Strict routine adherence |

### Service Controls

| Tag | Purpose |
|-----|---------|
| `timeline_today` | Needed today |
| `timeline_48h` | Needed within 48 hours |
| `timeline_week` | Needed this week |
| `planned` | Planned in advance |
| `delivery_pickup` | Pickup preferred |
| `delivery_home` | Home delivery preferred |
| `in_person` | In-person service |
| `home_visit` | Home visit preferred |
| `whatsapp_ok` | WhatsApp contact OK |
| `call_ok` | Phone call OK |
| `handheld_only` | Handheld pet only |
| `one_time` | One-time service |
| `recurring` | Recurring service |
| `subscription_universal` | Subscription model |
| `verified_required` | Verification required |
| `vetted_only` | Vetted providers only |

### Location

| Tag | Purpose |
|-----|---------|
| `city` | City location |
| `neighbourhood` | Neighbourhood |
| `distance_limit` | Maximum distance |

---

## VI. SYNONYMS AND CANONICAL MAPPING

### Tables Required

1. **tag_synonyms**: Maps user phrases → canonical tags
   - Fields: `synonym`, `tag`, `confidence`, `notes`

2. **service_type_synonyms**: Maps user phrases → service types
   - Fields: `synonym`, `service_type`, `confidence`, `notes`

### Mapping Workflow

```
1. Extract phrases from user input
2. Match against synonym tables
3. Resolve conflicts by priority:
   - Safety > Paperwork > Intent > Shopping
4. Return matches with confidence and provenance
```

### GAP IDENTIFIED (v1 Addendum)

**The actual synonym lists are NOT YET POPULATED as machine-readable tables.**
This is a significant implementation task.

---

## VII. RULES ENGINE

### Purpose
Drives:
- Required fields
- Follow-up questions
- Safety escalation
- Flow routing

### Inputs
- `primary_pillar`
- `tags[]`
- `service_types[]`
- Universal tags
- Conversation context
- Recency
- Temporal triggers

### Outputs
- `required_fields` list
- `next_questions` list
- `safety_state` override
- `route_to` flow
- Optional pick suppression flags

### Safety Gating Rules

| Condition | Action |
|-----------|--------|
| Emergency tag detected | Route to Emergency flow, suppress commercial picks |
| Clinical red flags | Emergency override |
| Mild/unclear symptoms | Caution state, vet-first advisory |
| All safety events | Log `safety_state` and evidence |

---

## VIII. PICKS ENGINE SPECIFICATION

### Purpose
Surface next-best actions to the user.

### Pick Types (enum)

```
guide | booking | product | checklist | program | concierge | emergency
```

### Pick Object Schema

```json
{
  "pick_id": "string",
  "title": "string",
  "pick_type": "enum",
  "pillar": "string",
  "canonical_tags": ["string"],
  "service_types": ["string"],
  "constraints": {
    "applies_to": ["dog", "cat"],
    "age_stage": ["puppy", "adult", "senior"],
    "health_flags": {}
  },
  "temporal_trigger": {},
  "catalogue_ref": "string (optional)",
  "reason": "string",
  "score": 0.85,
  "debug": {}
}
```

### Candidate Generation Rules

| State | Rule |
|-------|------|
| Emergency | Only emergency picks + nearest options + call-first |
| Normal | Match `canonical_tags` and `primary_pillar` |
| All | Include `service_type` candidates |
| All | Apply constraints |
| All | Always include concierge for high complexity or low confidence |

### Scoring Formula (v1)

```
score = (tag_match_confidence × dominant)
      + pillar_match (exact boost, adjacent boost)
      + profile_fit (age, size, health)
      + temporal_boost (due items, dates)
      + recency
      + hard_boosts (vaccines due, travel date)
      - hard_suppressions (emergency → no commercial products)
```

### Concierge Inclusion Rule

Always include Concierge® when:
- Multi-part request
- Travel + Stay + Docs combination
- Rare items requested
- User says "plan everything" or "arrange"
- Confidence < 0.65
- Multiple pillars tie for primary

### Catalogue Linking (Optional)

- Attach `catalogue_ref` for product/booking picks
- Safety and intent override catalogue
- If no catalogue match, fallback to concierge/guide

---

## IX. REQUIRED TABLES AND INTERFACES

### Storage Tables

| Table | Purpose |
|-------|---------|
| `canonical_tags` | Master tag dictionary |
| `tag_synonyms` | User phrase → tag mapping |
| `service_types` | Service type definitions |
| `service_type_synonyms` | User phrase → service type mapping |
| `tag_rules` | Rules engine configuration |
| `picks_catalogue` | Pick definitions |
| `events_log` | Audit trail |

### Interfaces

| API | Input | Output |
|-----|-------|--------|
| Classify API | text + pet_profile | primary_pillar, tags[], service_types[], universal_tags[], confidence, safety_state |
| Picks API | classify output + temporal context | ranked picks[] with reason + score |
| Rules API | classify output | required_fields + questions + safety actions |

---

## X. END-TO-END EXAMPLES

### Example 1: Leash Pulling

**User:** "My dog keeps pulling on the leash"

**Classification:**
- `primary_pillar`: learn (or fit)
- `tags`: ["leash_training", "behavior_issue"]
- `service_types`: ["training"]
- `confidence`: 0.85
- `safety_state`: normal

**Picks:**
1. Guide: "Leash Training Tips" (guide)
2. Booking: "Book Trainer Session" (booking)
3. Product: "No-Pull Harness" (product)
4. Concierge: "Have Concierge® help" (concierge)

---

### Example 2: Poison Ingestion (Emergency)

**User:** "My dog ate chocolate"

**Classification:**
- `primary_pillar`: emergency
- `tags`: ["poison_ingestion", "toxic_food"]
- `service_types`: ["emergency_routing"]
- `confidence`: 0.95
- `safety_state`: **emergency**

**Picks:**
1. Emergency: "Call ER Vet Now" (emergency)
2. Emergency: "Nearest Emergency Clinic" (emergency)
3. Checklist: "First Aid Steps" (checklist)
4. Concierge: "Emergency Concierge®" (concierge)

**Products SUPPRESSED**

---

### Example 3: Travel Next Month

**User:** "Taking Lola to Goa next month"

**Classification:**
- `primary_pillar`: travel
- `tags`: ["destination_trip", "travel_planning"]
- `service_types`: ["transport", "boarding"]
- `confidence`: 0.80
- `safety_state`: normal

**Picks:**
1. Checklist: "Travel Document Checklist" (checklist)
2. Booking: "Pet-Friendly Hotels in Goa" (booking)
3. Product: "Travel Carrier" (product)
4. Concierge: "Have Concierge® plan trip" (concierge) ← **Always shown for travel**

---

## XI. ACCEPTANCE CRITERIA (Definition of Done)

- [ ] Taxonomy table loaded as canonical source of truth
- [ ] Classifier outputs correct `primary_pillar`, tags, confidence
- [ ] Classifier handles emergency override
- [ ] Service types stored separately and populated for fulfillment intents
- [ ] Rules engine produces required fields and questions
- [ ] Safety gates function as specified
- [ ] Picks are taxonomy-driven
- [ ] Picks are safety-gated
- [ ] Picks are explainable (reason field)
- [ ] Picks are reproducible
- [ ] All outputs logged in `events_log`

---

## XII. ADDENDUM v1.1 - COVERAGE GAPS

### Clarification of "Canonical"

**Canonical** = The single, standard internal ID for one concept.
- Example: `grooming` is the canonical tag, "haircut" is a synonym
- Example: `emergency` is the canonical pillar, "urgent" is a synonym

### Missing Pillar Coverage (Identified in v1.1)

| Pillar | Gap |
|--------|-----|
| **Learn** | Missing canonical tags, synonym mapping, workflows |
| **Farewell** | Missing canonical tags, synonym mapping, end-of-life ownership |
| **Adopt** | Missing canonical tags, synonym mapping, workflows |

### Synonym Population Gap

**The synonym lists are NOT YET POPULATED in machine-readable format.**
This is the most critical implementation gap.

### De-duplication Recommendation

Centralize related concepts in a single "home" pillar.
Example: All end-of-life concepts should live in **Farewell** pillar.

---

## XIII. WHAT CHANGED IN v1.2 (Final Approved)

| Item | v1.0 | v1.2 |
|------|------|------|
| Service Types | Basic list | Expanded with modes (salon, at_home, clinic, etc.) |
| Missing Pillars | Identified as gaps | Full canonical tags provided |
| Synonym Tables | Empty | Seed data provided (200+ synonyms) |
| Safety States | emergency only | emergency + **caution** |
| Scoring | General formula | Specific weights (40% tag, 25% profile, 20% temporal, 15% hard) |
| Concierge | Always for Travel/Celebrate | **Conditional** based on complexity |

---

*Document Version: 1.0 (Original for discussion)*
*Final Version: See `/app/memory/PICKS_ENGINE_SPEC_v1.md`*
*Created: February 12, 2026*

# Ticket → Soul Auto-Enrichment System

**Implementation Date:** February 18, 2026
**Status:** ✅ IMPLEMENTED

---

## Overview

When a ticket is resolved, the system automatically extracts durable learnings and persists them into the pet's Soul profile.

**Doctrine:** "One resolution = One permanent learning opportunity"

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    TICKET RESOLVED                               │
│                    (resolve_ticket())                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              TICKET → SOUL AUTO-ENRICHMENT                      │
│              (ticket_soul_enrichment.py)                        │
│                                                                  │
│  1. Extract conversation text                                   │
│  2. Detect categories (grooming, dietary, health, etc.)         │
│  3. Run pattern matching for insights                           │
│  4. Write to doggy_soul_answers                                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PET SOUL ENRICHED                            │
│                                                                  │
│  New fields added:                                              │
│  - food_allergies_from_tickets                                  │
│  - preferences_from_tickets                                     │
│  - health_notes_from_tickets                                    │
│  - anxiety_triggers_from_tickets                                │
│  - grooming_notes_from_tickets                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Extractable Categories

| Category | Keywords | Soul Fields |
|----------|----------|-------------|
| **Grooming** | groom, bath, haircut, nail, coat | grooming_preference, grooming_frequency |
| **Dietary** | food, treat, allergy, eat, meal | food_allergies, favorite_treats |
| **Health** | health, vet, medicine, condition | health_conditions, medications |
| **Behavioral** | anxiety, fear, calm, training | anxiety_triggers, temperament |
| **Travel** | travel, car, flight, board | travel_preferences, car_behavior |
| **Activity** | walk, play, exercise, energy | energy_level, favorite_activities |

---

## Extraction Patterns

### Allergies (Highest Priority - Safety)
```python
r"allergic to (\w+)"
r"can't have (\w+)"
r"avoid (\w+)"
r"no (\w+) please"
```

### Preferences
```python
r"she loves (\w+)"
r"favorite is (\w+)"
r"really enjoys (\w+)"
```

### Health Conditions
```python
r"has (\w+ condition)"
r"diagnosed with (\w+)"
r"suffering from (\w+)"
```

### Anxiety Triggers
```python
r"scared of (\w+)"
r"anxious around (\w+)"
r"(\w+) makes her nervous"
```

---

## Integration Points

### 1. Automatic (On Ticket Resolution)
**File:** `/app/backend/mira_service_desk.py`
**Function:** `resolve_ticket()`

```python
# Called automatically when ticket is resolved
enrichment_result = await process_ticket_resolution_enrichment(db, ticket_id)
```

### 2. Manual (Admin Backfill)
**Endpoint:** `POST /api/admin/env-sync/enrich-from-tickets/{pet_id}`

```bash
curl -X POST ".../api/admin/env-sync/enrich-from-tickets/pet-3661ae55d2e2?token=sync-preview-to-prod-2026" \
  -u "aditya:lola4304"
```

### 3. Test Extraction
**Endpoint:** `POST /api/admin/env-sync/test-enrichment/{ticket_id}`

```bash
curl -X POST ".../api/admin/env-sync/test-enrichment/TCK-2026-000040?token=sync-preview-to-prod-2026" \
  -u "aditya:lola4304"
```

---

## Response Format

```json
{
  "success": true,
  "pet_id": "pet-3661ae55d2e2",
  "learnings_extracted": 3,
  "fields_updated": [
    "food_allergies_from_tickets",
    "anxiety_triggers_from_tickets",
    "grooming_notes_from_tickets"
  ],
  "message": "Soul enriched with 3 new insights"
}
```

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `/app/backend/ticket_soul_enrichment.py` | **NEW** - Core enrichment logic |
| `/app/backend/mira_service_desk.py` | **MODIFIED** - Added auto-enrichment on resolve |
| `/app/backend/admin_sync_routes.py` | **MODIFIED** - Added manual enrichment endpoints |

---

## Benefits

1. **Compounds Intelligence** - Every ticket makes Mira smarter
2. **No Rediscovery** - Once learned, always remembered
3. **Safety First** - Allergies extracted with highest priority
4. **Automatic** - No manual intervention needed
5. **Auditable** - All enrichments logged and traceable

---

## Deployment Notes

After deploying:
1. New tickets will auto-enrich on resolution
2. Use `/enrich-from-tickets/{pet_id}` to backfill existing tickets
3. Use `/test-enrichment/{ticket_id}` to verify extraction quality

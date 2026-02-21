# PICKS SYSTEM DATA MODEL
## Last Updated: December 2025

---

## DATA CLEANUP COMPLETED ✅

### Results:
| Metric | Before | After |
|--------|--------|-------|
| Products intent-aligned | 57% | **100%** |
| Services intent-aligned | 66% | **100%** |
| Cross-contamination | 88 issues | **0** ✅ |
| life_state_exclusions | 0% | **100%** |
| occasion (celebrate) | 0% | **100%** |

---

## PILLAR-INTENT MAPPING (ENFORCED)

Each pillar can ONLY have these semantic_intents:

```python
PILLAR_ALLOWED_INTENTS = {
    "celebrate": ["birthday_celebration"],
    "dine": ["dining_cafe", "fresh_food", "everyday_treats"],
    "stay": ["boarding_stay"],
    "travel": ["travel_adventure"],
    "care": ["skin_coat", "dental_oral", "digestion_gut", "joint_mobility", 
             "senior_care", "puppy_essentials", "calm_anxiety", "emergency_care"],
    "enjoy": ["play_enrichment"],
    "fit": ["weight_fitness", "swimming_spa"],
    "learn": ["training_behavior"],
    "paperwork": ["documentation_legal"],
    "advisory": ["consultation_advice"],
    "emergency": ["emergency_care", "safety_id"],
    "farewell": ["memorial_farewell"],
    "adopt": ["consultation_advice"],
    "shop": ["home_decor", "fashion_wearables", "play_enrichment", 
             "everyday_treats", "training_behavior"],
}
```

---

## LIFE STATE EXCLUSIONS

Products/services have `life_state_exclusions` array to prevent cross-pillar errors:

```python
LIFE_STATE_EXCLUSIONS = {
    "celebrate": ["GRIEF", "FAREWELL", "EMERGENCY", "MEMORIAL"],
    "farewell": ["BIRTHDAY", "CELEBRATION", "PARTY", "FUN"],
    "emergency": ["CELEBRATION", "PARTY", "FUN"],
    "travel": ["GRIEF", "FAREWELL", "MEMORIAL"],
    "dine": ["GRIEF", "FAREWELL", "MEMORIAL"],
    "enjoy": ["GRIEF", "FAREWELL", "MEMORIAL"],
    "care": [],  # Care is neutral
    "fit": [],
    "learn": [],
    "stay": [],
    "shop": [],
}
```

---

## OCCASION FIELD (Celebrate Pillar)

All 420 celebrate products now have `occasion` field:

| Occasion | Count |
|----------|-------|
| birthday | 318 |
| gotcha_day | 37 |
| generic | 22 |
| valentine | 17 |
| special-treat | 12 |
| festival | 7 |
| halloween | 4 |
| holi | 3 |

---

## SAMPLE PRODUCT STRUCTURE

```json
{
  "name": "Go Bananas Box",
  "pillar": "celebrate",
  "category": "cakes",
  "semantic_intents": ["birthday_celebration"],
  "semantic_tags": ["birthday_celebration"],
  "life_state_exclusions": ["GRIEF", "FAREWELL", "EMERGENCY", "MEMORIAL"],
  "occasion": "birthday",
  "mira_hint": "✨ Sweet banana bliss sparks tail-wagging joy!",
  "applicable_breeds": ["all"],
  "price": 499
}
```

---

## PICKS SEARCH LOGIC

To get pillar-locked picks:

```python
async def get_picks(pillar: str, intent: str, pet_context: dict):
    """Get picks that are 100% pillar-relevant"""
    
    query = {
        "pillar": pillar,  # ALWAYS filter by pillar first
        "semantic_intents": {"$in": [intent]} if intent else {"$exists": True}
    }
    
    # Never show if life state is excluded
    if pet_context.get("life_state"):
        query["life_state_exclusions"] = {"$nin": [pet_context["life_state"]]}
    
    # Filter by occasion for celebrate
    if pillar == "celebrate" and pet_context.get("occasion"):
        query["occasion"] = pet_context["occasion"]
    
    return await db.products_master.find(query).limit(4).to_list(4)
```

---

## FORBIDDEN COMBINATIONS

These should NEVER happen:

| User talks about | Should NOT see |
|------------------|----------------|
| Dog walking | Birthday cake |
| Grooming | Funeral products |
| Cake | Holiday package |
| Travel | Memorial items |
| Birthday | Farewell services |

All prevented by:
1. `pillar` field filtering
2. `semantic_intents` alignment
3. `life_state_exclusions` array

---

## NEXT STEPS

1. **Implement Picks Vault** - Store picks with service ticket
2. **Build Icon Cards** - For when no product/service exists
3. **Add Concierge handoff** - "Your pet Concierge® will curate..."
4. **No add-to-cart** - This is a curation OS

---

*Data is now 100% ready for Picks system implementation.*

# Pet Soul Canonical Answer System
## Complete Documentation

---

## Overview

The Pet Soul system uses **two question sets**:
- **UI Question Set (35 questions)**: Used in the frontend forms across 8 folders
- **Canonical Scoring Set (26 fields)**: Used for score calculation (weights = exactly 100)

The `canonical_answers.py` module provides the single source of truth that:
1. Maps UI field names → canonical scoring field names
2. Normalizes answers on save/read/score
3. Preserves non-scoring fields for Mira context
4. Ensures consistent data access across the system

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (UI)                                 │
│   35 Questions in 8 Folders (Identity, Family, Travel, etc.)        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/pet-soul/profile/{pet_id}/answer
                              │ { question_id: "general_nature", answer: "calm" }
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    canonicalize_answers()                            │
│   • Maps UI field names → canonical scoring fields                   │
│   • Preserves non-scoring fields for Mira                           │
│   • Pulls additional data from preferences/soul                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  pets.doggy_soul_answers                             │
│   CANONICAL STORAGE (MongoDB)                                        │
│   • All UI answers saved here (both canonical + non-scoring)        │
│   • Single source of truth                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌───────────────────────┐     ┌───────────────────────────────┐
│  get_scoring_answers  │     │      get_mira_context         │
│  (26 canonical only)  │     │  (All Mira-relevant fields)   │
└───────────────────────┘     └───────────────────────────────┘
              │                               │
              ▼                               ▼
┌───────────────────────┐     ┌───────────────────────────────┐
│  calculate_soul_score │     │   Mira Soul-First Context     │
│  Weights = 100        │     │   (build_soul_context_summary) │
└───────────────────────┘     └───────────────────────────────┘
```

---

## UI Question Set (35 Questions, 8 Folders)

### Folder 1: Identity & Temperament 🎭 (6 questions)
| UI Field | Maps To | Weight |
|----------|---------|--------|
| `describe_3_words` | `temperament` | 8 |
| `general_nature` | `temperament` | 8 |
| `stranger_reaction` | `social_with_people` | 4 |
| `loud_sounds` | `noise_sensitivity` | 4 |
| `social_preference` | (non-scoring) | 0 |
| `handling_comfort` | `grooming_tolerance` | 4 |

### Folder 2: Family & Pack 👨‍👩‍👧‍👦 (4 questions)
| UI Field | Maps To | Weight |
|----------|---------|--------|
| `lives_with` | `other_pets` + `kids_at_home` | 2+1 |
| `behavior_with_dogs` | `social_with_dogs` | 4 |
| `most_attached_to` | `primary_bond` | 2 |
| `attention_seeking` | (non-scoring) | 0 |

### Folder 3: Rhythm & Routine ⏰ (5 questions)
| UI Field | Maps To | Weight |
|----------|---------|--------|
| `walks_per_day` | `exercise_needs` | 2 |
| `energetic_time` | `morning_routine` | 2 |
| `sleep_location` | (non-scoring) | 0 |
| `alone_comfort` | `alone_time_comfort` | 5 |
| `separation_anxiety` | `alone_time_comfort` | 5 |

### Folder 4: Home Comforts 🏠 (4 questions)
| UI Field | Maps To | Weight |
|----------|---------|--------|
| `favorite_item` | (non-scoring) | 0 |
| `space_preference` | `favorite_spot` | 2 |
| `crate_trained` | (non-scoring) | 0 |
| `car_rides` | `car_comfort` | 4 |

### Folder 5: Travel Style ✈️ (4 questions)
| UI Field | Maps To | Weight |
|----------|---------|--------|
| `usual_travel` | `travel_readiness` | 3 |
| `hotel_experience` | (non-scoring) | 0 |
| `stay_preference` | (non-scoring) | 0 |
| `travel_social` | (non-scoring) | 0 |

**Note**: `travel_anxiety` is a non-scoring field that Mira uses but doesn't affect score.

### Folder 6: Taste & Treat 🍖 (4 questions)
| UI Field | Maps To | Weight |
|----------|---------|--------|
| `diet_type` | (non-scoring) | 0 |
| `food_allergies` | `food_allergies` | 10 |
| `favorite_treats` | `treat_preference` | 3 |
| `sensitive_stomach` | (non-scoring) | 0 |

### Folder 7: Training & Behaviour 🎓 (4 questions)
| UI Field | Maps To | Weight |
|----------|---------|--------|
| `training_level` | `training_level` | 3 |
| `training_response` | `motivation_type` | 2 |
| `leash_behavior` | (non-scoring) | 0 |
| `barking` | (non-scoring) | 0 |

### Folder 8: Long Horizon 🌅 (4 questions)
| UI Field | Maps To | Weight |
|----------|---------|--------|
| `main_wish` | (non-scoring) | 0 |
| `help_needed` | (non-scoring) | 0 |
| `dream_life` | (non-scoring) | 0 |
| `celebration_preferences` | (non-scoring) | 0 |

---

## Canonical Scoring Set (26 Fields, 100 Points)

### Category Breakdown

| Category | Fields | Total Points |
|----------|--------|--------------|
| Safety & Health | 6 | 36 |
| Personality | 5 | 25 |
| Lifestyle | 7 | 20 |
| Nutrition | 3 | 9 |
| Training | 2 | 5 |
| Relationships | 3 | 5 |
| **TOTAL** | **26** | **100** |

### Complete Field List

| # | Canonical Field | Weight | Category |
|---|-----------------|--------|----------|
| 1 | `food_allergies` | 10 | safety |
| 2 | `health_conditions` | 8 | safety |
| 3 | `temperament` | 8 | personality |
| 4 | `energy_level` | 6 | personality |
| 5 | `vet_comfort` | 5 | safety |
| 6 | `life_stage` | 5 | safety |
| 7 | `alone_time_comfort` | 5 | lifestyle |
| 8 | `grooming_tolerance` | 4 | safety |
| 9 | `noise_sensitivity` | 4 | safety |
| 10 | `social_with_dogs` | 4 | personality |
| 11 | `social_with_people` | 4 | personality |
| 12 | `car_comfort` | 4 | lifestyle |
| 13 | `behavior_issues` | 3 | personality |
| 14 | `travel_readiness` | 3 | lifestyle |
| 15 | `favorite_protein` | 3 | nutrition |
| 16 | `food_motivation` | 3 | nutrition |
| 17 | `treat_preference` | 3 | nutrition |
| 18 | `training_level` | 3 | training |
| 19 | `favorite_spot` | 2 | lifestyle |
| 20 | `morning_routine` | 2 | lifestyle |
| 21 | `exercise_needs` | 2 | lifestyle |
| 22 | `feeding_times` | 2 | lifestyle |
| 23 | `motivation_type` | 2 | training |
| 24 | `primary_bond` | 2 | relationships |
| 25 | `other_pets` | 2 | relationships |
| 26 | `kids_at_home` | 1 | relationships |

---

## UI → Canonical Mapping Table

```python
UI_TO_CANONICAL_MAP = {
    # Temperament
    "general_nature": "temperament",
    "describe_3_words": "temperament",
    
    # Social
    "stranger_reaction": "social_with_people",
    "behavior_with_dogs": "social_with_dogs",
    
    # Comfort
    "handling_comfort": "grooming_tolerance",
    "loud_sounds": "noise_sensitivity",
    
    # Alone Time
    "separation_anxiety": "alone_time_comfort",
    "alone_comfort": "alone_time_comfort",
    
    # Exercise
    "walks_per_day": "exercise_needs",
    
    # Travel
    "car_rides": "car_comfort",
    "usual_travel": "travel_readiness",
    
    # Food
    "favorite_treats": "treat_preference",
    "favorite_flavors": "favorite_protein",
    
    # Routine
    "energetic_time": "morning_routine",
    "space_preference": "favorite_spot",
    
    # Training
    "training_response": "motivation_type",
    
    # Relationships
    "most_attached_to": "primary_bond",
    "lives_with": "other_pets",  # Also extracts kids_at_home
    
    # Other
    "vet_anxiety": "vet_comfort",
}
```

---

## Non-Scoring Fields (Mira Context Only)

These fields are saved but **do not affect the Soul Score**. They're used by Mira for personalized responses:

| Field | Category | Mira Uses For |
|-------|----------|---------------|
| `travel_anxiety` | travel | Trip planning, stay recommendations |
| `hotel_experience` | travel | Stay recommendations |
| `stay_preference` | travel | Accommodation matching |
| `describe_3_words` | personality | Conversation personalization |
| `dream_life` | dreams | Understanding owner goals |
| `celebration_preferences` | dreams | Event planning |
| `sleep_location` | routine | Boarding recommendations |
| `sensitive_stomach` | nutrition | Food recommendations |
| `barking` | behavior | Training recommendations |

---

## Usage

### On Save (API Endpoint)
```python
from canonical_answers import canonicalize_answers

@router.post("/pet-soul/profile/{pet_id}/answer")
async def save_answer(pet_id: str, data: dict):
    # Raw answer from UI
    raw = {data["question_id"]: data["answer"]}
    
    # Merge with existing answers
    existing = pet.get("doggy_soul_answers", {})
    merged = {**existing, **raw}
    
    # Canonicalize (normalizes field names, preserves non-scoring)
    canonical = canonicalize_answers(merged, pet.get("preferences"), pet.get("soul"))
    
    # Calculate score
    from pet_score_logic import calculate_pet_soul_score
    score = calculate_pet_soul_score(canonical)
    
    # Save to DB
    db.pets.update_one(
        {"id": pet_id},
        {"$set": {
            "doggy_soul_answers": canonical,  # Single canonical storage
            "overall_score": score["total_score"],
            "score_tier": score["tier"]["key"]
        }}
    )
```

### On Read (For Display)
```python
from canonical_answers import canonicalize_answers, get_scoring_answers

pet = db.pets.find_one({"id": pet_id})
canonical = canonicalize_answers(pet.get("doggy_soul_answers", {}))
scoring = get_scoring_answers(canonical)  # Only 26 scoring fields
```

### For Mira Context
```python
from canonical_answers import canonicalize_answers, get_mira_context

pet = db.pets.find_one({"id": pet_id})
canonical = canonicalize_answers(pet.get("doggy_soul_answers", {}))
mira_context = get_mira_context(canonical)  # All Mira-relevant fields
```

---

## Score Tiers

| Tier | Score Range | Emoji | Description |
|------|-------------|-------|-------------|
| Newcomer | 0-24% | 🐾 | Just getting started |
| Soul Seeker | 25-49% | 🌱 | Building understanding |
| Soul Explorer | 50-74% | 🌟 | Deep knowledge |
| Soul Master | 75-100% | 👑 | Complete profile |

---

## Files

| File | Purpose |
|------|---------|
| `/app/backend/canonical_answers.py` | Core canonicalization logic |
| `/app/backend/pet_score_logic.py` | Score calculation (uses canonical) |
| `/app/backend/soul_first_logic.py` | Mira context builder (uses canonical) |
| `/app/backend/tests/test_canonical_answers.py` | Unit tests (23 tests) |

---

## Key Guarantees

1. **Weights = Exactly 100**: Score calculation always uses exactly 100 total weight
2. **Single Storage**: All answers stored in `pets.doggy_soul_answers`
3. **UI Transparency**: Frontend can use any field name; backend normalizes
4. **Non-scoring Preserved**: Fields like `travel_anxiety` saved for Mira but don't affect score
5. **Idempotent**: Calling `canonicalize_answers` multiple times produces same result

---

*Document generated: February 2026*
*Tests: 23/23 passing*

# 8 GOLDEN PILLARS - COMPLETE TECHNICAL SPECIFICATION
## Pet Soul Scoring System
### Last Updated: February 15, 2026

---

## OVERVIEW

The 8 Golden Pillars system is the core data architecture for understanding a pet's "Soul". It replaces the old 6-category system with a more comprehensive 8-pillar approach.

**Key Change (Feb 15, 2026):** Unified scoring config to match the 8-pillar question structure.

---

## TWO SYSTEMS - NOW UNIFIED

### 1. Question Collection (`pet_soul_routes.py`)
- **DOGGY_SOUL_QUESTIONS** - 55+ questions across 8 folders
- Used by Quick Questions endpoint
- Stores all possible questions

### 2. Scoring System (`pet_soul_config.py`)
- **PET_SOUL_QUESTIONS** - 39 questions that ARE SCORED
- Total: 100 points
- Determines tier and progress

**IMPORTANT:** Not all 55 questions are scored! Only 39 contribute to the Soul Score.

---

## PILLAR DETAILS

### 🎭 Pillar 1: Identity & Temperament (15 points)
**Purpose:** Who your dog is at their core

| Question ID | Label | Points | Level |
|-------------|-------|--------|-------|
| general_nature | General Nature | 4 | core |
| temperament | Temperament | 3 | core |
| life_stage | Life Stage | 3 | core |
| loud_sounds | Noise Sensitivity | 3 | important |
| handling_comfort | Handling Comfort | 2 | important |

**AI Usage:** Personality-based recommendations, activity suggestions

---

### 👨‍👩‍👧‍👦 Pillar 2: Family & Pack (12 points)
**Purpose:** Social world and relationships

| Question ID | Label | Points | Level |
|-------------|-------|--------|-------|
| lives_with | Lives With | 3 | core |
| kids_at_home | Kids at Home | 2 | important |
| other_pets | Other Pets | 2 | important |
| behavior_with_dogs | Social with Dogs | 3 | important |
| most_attached_to | Primary Bond | 2 | advanced |

**AI Usage:** Multi-pet household recommendations, kid-safe products

---

### ⏰ Pillar 3: Rhythm & Routine (14 points)
**Purpose:** Daily life patterns

| Question ID | Label | Points | Level |
|-------------|-------|--------|-------|
| feeding_times | Feeding Times | 2 | core |
| exercise_needs | Exercise Needs | 3 | core |
| walks_per_day | Walks Per Day | 2 | important |
| alone_comfort | Alone Time Comfort | 3 | important |
| separation_anxiety | Separation Anxiety | 3 | core |
| sleep_location | Sleep Location | 1 | advanced |

**AI Usage:** Schedule-based reminders, anxiety management tips

---

### 🏠 Pillar 4: Home Comforts (8 points)
**Purpose:** Safety and happiness at home

| Question ID | Label | Points | Level |
|-------------|-------|--------|-------|
| favorite_spot | Favorite Spot | 2 | advanced |
| crate_trained | Crate Trained | 2 | important |
| car_rides | Car Comfort | 3 | important |
| space_preference | Space Preference | 1 | advanced |

**AI Usage:** Product recommendations for home comfort

---

### ✈️ Pillar 5: Travel Style (10 points)
**Purpose:** Adventure preferences

| Question ID | Label | Points | Level |
|-------------|-------|--------|-------|
| usual_travel | Travel Mode | 3 | important |
| hotel_experience | Hotel Experience | 3 | important |
| stay_preference | Stay Preference | 2 | advanced |
| travel_social | Travel Social | 2 | advanced |

**AI Usage:** Travel recommendations, pet-friendly venue suggestions

---

### 🍖 Pillar 6: Taste & Treat (14 points)
**Purpose:** Food personality - CRITICAL FOR SAFETY

| Question ID | Label | Points | Level |
|-------------|-------|--------|-------|
| food_allergies | Food Allergies | 5 | core |
| food_motivation | Food Motivation | 2 | important |
| favorite_protein | Favorite Protein | 2 | important |
| treat_preference | Treat Preference | 2 | advanced |
| sensitive_stomach | Sensitive Stomach | 3 | important |

**AI Usage:** NEVER recommend allergens, food filtering

---

### 🎓 Pillar 7: Training & Behaviour (10 points)
**Purpose:** Learning style and behavior

| Question ID | Label | Points | Level |
|-------------|-------|--------|-------|
| training_level | Training Level | 3 | important |
| motivation_type | Motivation Type | 2 | important |
| behavior_issues | Behavior Issues | 3 | important |
| leash_behavior | Leash Behavior | 2 | advanced |

**AI Usage:** Training product recommendations, behavior tips

---

### 🌅 Pillar 8: Long Horizon / Health (17 points)
**Purpose:** Health conditions and future care - HIGHEST WEIGHT

| Question ID | Label | Points | Level |
|-------------|-------|--------|-------|
| health_conditions | Health Conditions | 5 | core |
| vet_comfort | Vet Comfort | 3 | important |
| grooming_tolerance | Grooming Tolerance | 3 | important |
| vaccination_status | Vaccination Status | 3 | core |
| main_wish | Main Wish | 1 | advanced |
| celebration_preferences | Celebration Preferences | 2 | advanced |

**AI Usage:** Health-aware recommendations, vet reminders

---

## TIER SYSTEM

| Tier | Score Range | Emoji | Description |
|------|-------------|-------|-------------|
| Curious Pup | 0-24% | 🐾 | Early understanding |
| Loyal Companion | 25-49% | 🌱 | Core context built |
| Trusted Guardian | 50-74% | 🤝 | Concierge-ready |
| Pack Leader | 75-89% | 🐕‍🦺 | Deep understanding |
| Soul Master | 90-100% | ✨ | True soul connection |

---

## API ENDPOINTS

### Get 8-Pillar Summary
```
GET /api/pet-soul/profile/{pet_id}/8-pillars

Response:
{
  "pet_id": "pet-xxx",
  "pet_name": "Mojo",
  "overall_score": 89,
  "tier": {
    "key": "pack_leader",
    "name": "Pack Leader",
    "emoji": "🐕‍🦺",
    "description": "Deep understanding - bespoke concierge experience"
  },
  "next_tier": {
    "key": "soul_master",
    "name": "Soul Master",
    "at_percent": 90,
    "percent_to_go": 1
  },
  "pillars": [
    {"pillar_key": "identity_temperament", "name": "Identity & Temperament", "icon": "🎭", "percent": 100, "status": "complete"},
    ...
  ],
  "pillar_completion": {
    "identity_temperament": 100,
    "family_pack": 100,
    ...
  },
  "sections": { ... detailed section breakdown ... },
  "missing_high_impact": [ ... top 5 missing questions ... ],
  "stats": {
    "total_questions": 39,
    "answered": 36,
    "total_points": 100,
    "earned_points": 89
  }
}
```

### Get Quick Questions
```
GET /api/pet-soul/profile/{pet_id}/quick-questions?limit=3

Response:
{
  "questions": [
    {
      "id": "separation_anxiety",
      "text": "Does Mojo show signs of separation anxiety?",
      "options": ["Yes, significant", "Mild", "No"],
      "weight": 3,
      "folder": "rhythm_routine"
    },
    ...
  ]
}
```

### Save Answer
```
POST /api/pet-soul/profile/{pet_id}/answer
Content-Type: application/json

{
  "question_id": "separation_anxiety",
  "answer": "Mild"
}

Response:
{
  "message": "Answer saved",
  "question_id": "separation_anxiety",
  "answer": "Mild",
  "scores": {
    "overall": 92.0,
    "tier": "soul_master",
    "answered_count": 37
  },
  "next_question": { ... }
}
```

---

## HOW MIRA USES PILLAR DATA

The `build_mira_system_prompt()` function in `mira_routes.py` injects pillar data into the AI context:

1. **Allergies** - NEVER RECOMMEND gate (highest priority)
2. **Health Conditions** - Careful recommendations
3. **Temperament** - Personality-matched suggestions
4. **Favorites** - Preference-based picks
5. **Training Level** - Appropriate complexity

Example system prompt injection:
```
🐕 PET CONTEXT FOR MOJO:
- Allergies: Chicken (NEVER RECOMMEND)
- Health: Joint issues
- Temperament: Playful, energetic
- Training: Intermediate
- Separation Anxiety: Mild
```

---

## QUESTION MAPPING (DOGGY_SOUL_QUESTIONS → PET_SOUL_QUESTIONS)

The `pet_soul_routes.py` has 55+ questions in DOGGY_SOUL_QUESTIONS.
The `pet_soul_config.py` scores only 39 of them.

Mapping table:
| DOGGY_SOUL folder | PET_SOUL pillar | Scored? |
|-------------------|-----------------|---------|
| identity_temperament | identity_temperament | YES (5 of 8) |
| family_pack | family_pack | YES (5 of 6) |
| rhythm_routine | rhythm_routine | YES (6 of 8) |
| home_comforts | home_comforts | YES (4 of 5) |
| travel_style | travel_style | YES (4 of 4) |
| taste_treat | taste_treat | YES (5 of 6) |
| training_behaviour | training_behaviour | YES (4 of 5) |
| long_horizon | long_horizon | YES (6 of 8) |

---

## FILES REFERENCE

| File | Purpose |
|------|---------|
| `/app/backend/pet_soul_config.py` | Scoring weights, tier logic |
| `/app/backend/pet_soul_routes.py` | API endpoints, question bank |
| `/app/backend/mira_routes.py` | AI prompt building |
| `/app/backend/soul_first_logic.py` | Response generation |

---

*This document is the technical specification for the 8 Golden Pillars system.*

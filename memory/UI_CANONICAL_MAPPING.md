# UI Questions → Canonical Scoring Fields Mapping

**Last Updated:** Feb 13, 2026  
**Source of Truth:** `/app/backend/member_logic_config.py`

---

## Overview

The MIRA OS collects pet information through two systems:
1. **UI Collection Set** (35+ questions) - What users answer
2. **Scoring Set** (26 weighted fields) - What affects Soul Score

This document maps how UI questions feed into scoring.

---

## 26 Canonical Scoring Fields

| # | Canonical Field | Category | Weight | UI Question ID | Notes |
|---|-----------------|----------|--------|----------------|-------|
| 1 | `food_allergies` | Safety & Health | 7 | `food_allergies` | Direct match |
| 2 | `health_conditions` | Safety & Health | 7 | `health_conditions` | Direct match |
| 3 | `vet_comfort` | Safety & Health | 6 | `vet_comfort` | Direct match |
| 4 | `life_stage` | Safety & Health | 6 | `life_stage` | Direct match |
| 5 | `grooming_tolerance` | Safety & Health | 5 | `grooming_tolerance` | Direct match |
| 6 | `noise_sensitivity` | Safety & Health | 5 | `noise_sensitivity` | Direct match |
| 7 | `temperament` | Personality | 6 | `temperament` | Direct match |
| 8 | `energy_level` | Personality | 5 | `energy_level` | Direct match |
| 9 | `social_with_dogs` | Personality | 5 | `social_with_dogs` | Direct match |
| 10 | `social_with_people` | Personality | 5 | `social_with_people` | Direct match |
| 11 | `behavior_issues` | Personality | 4 | `behavior_issues` | Direct match |
| 12 | `alone_time_comfort` | Lifestyle | 3 | `alone_time_comfort` | Direct match |
| 13 | `car_comfort` | Lifestyle | 3 | `car_comfort` | Direct match |
| 14 | `travel_readiness` | Lifestyle | 3 | `travel_readiness` | Direct match |
| 15 | `favorite_spot` | Lifestyle | 3 | `favorite_spot` | Direct match |
| 16 | `morning_routine` | Lifestyle | 3 | `morning_routine` | Direct match |
| 17 | `exercise_needs` | Lifestyle | 3 | `exercise_needs` | Direct match |
| 18 | `sleep_preferences` | Lifestyle | 2 | `sleep_preferences` | Direct match |
| 19 | `feeding_times` | Nutrition | 3 | `feeding_times` | Direct match |
| 20 | `favorite_protein` | Nutrition | 3 | `favorite_protein` | Direct match |
| 21 | `food_motivation` | Nutrition | 3 | `food_motivation` | Direct match |
| 22 | `training_level` | Training | 3 | `training_level` | Direct match |
| 23 | `motivation_type` | Training | 2 | `motivation_type` | Direct match |
| 24 | `primary_bond` | Relationships | 2 | `primary_bond` | Direct match |
| 25 | `other_pets` | Relationships | 2 | `other_pets` | Direct match |
| 26 | `kids_at_home` | Relationships | 1 | `kids_at_home` | Direct match |

**Total: 100 points**

---

## Memory-Only Questions (Don't Affect Score)

These UI questions are collected but stored as memory only:

| UI Question ID | Purpose | Why Not Scored |
|----------------|---------|----------------|
| `treat_preference` | Personalization | Not safety-critical |
| `favorite_toy` | Personalization | Not safety-critical |
| `play_style` | Context | Covered by energy_level |
| `walking_preference` | Context | Covered by exercise_needs |
| `bath_tolerance` | Context | Covered by grooming_tolerance |
| `nail_trim_tolerance` | Context | Covered by grooming_tolerance |
| `ear_cleaning_tolerance` | Context | Covered by grooming_tolerance |
| `medication_ease` | Context | Covered by health_conditions |
| `stranger_reaction` | Context | Covered by social_with_people |

---

## Badge Thresholds (Question-Count Based)

Badges are triggered by **number of UI questions answered**, not score percentage.

| Badge | Threshold | Points Reward |
|-------|-----------|---------------|
| `soul_starter` | 5 questions | 50 pts |
| `soul_seeker` | 10 questions | 100 pts |
| `soul_explorer` | 15 questions | 250 pts |
| `soul_guardian` | 20 questions | 500 pts |

**Important:** Count includes ALL UI question IDs (not just scoring fields).

---

## Paw Points per Action

| Action | Points | Notes |
|--------|--------|-------|
| First Order | 100 | One-time |
| Product Purchase | 5% of value | Floored |
| Soul Question | 10 | Per new answer only |
| Review | 25 | Per review |
| Referral | 500 | When friend orders |
| Service Booking | 50-200 | Varies by pillar |

---

## Soul Score Tiers

| Tier | Range | Emoji |
|------|-------|-------|
| Curious Pup | 0-24% | 🐾 |
| Loyal Companion | 25-49% | 🌱 |
| Trusted Guardian | 50-74% | 🤝 |
| Pack Leader | 75-100% | 🐕‍🦺 |

---

## Emergency Suppression

When `safety_level = "emergency"`:

**SUPPRESS:**
- Reward nudges
- Shop CTAs
- Commerce picks
- Upsell prompts
- Discount offers

**ALLOW:**
- Urgent routing
- Vet contact CTA
- Emergency resources
- Safety instructions

---

## Verification Tests

Run the unit tests to verify mapping integrity:

```bash
pytest /app/backend/tests/test_member_logic.py -v
```

Key test cases:
1. Badge thresholds match spec (5/10/15/20 questions)
2. Question counting uses UI IDs only
3. Scoring uses 26 canonical fields only
4. Paw points rules match spec
5. Emergency suppression works

# SOUL QUESTIONS - COMPLETE INVENTORY
## Total Questions = 27 scoring + bonuses

## CURRENT QUESTIONS BY PILLAR (FROM BACKEND SCORING)

### 1. SAFETY & HEALTH (36 points) - CRITICAL
| Question | Weight | Why Important |
|----------|--------|---------------|
| food_allergies | 10 | Critical for safe product recommendations |
| health_conditions | 8 | Ensures appropriate service recommendations |
| vet_comfort | 5 | Helps prepare for care appointments |
| life_stage | 5 | Age-appropriate recommendations |
| grooming_tolerance | 4 | Better grooming experiences |
| noise_sensitivity | 4 | Important for stay & travel planning |

### 2. PERSONALITY & TEMPERAMENT (25 points) - ESSENTIAL
| Question | Weight | Why Important |
|----------|--------|---------------|
| temperament | 8 | Core personality understanding |
| energy_level | 6 | Activity and product matching |
| social_with_dogs | 4 | Important for daycare and play dates |
| social_with_people | 4 | Service provider preparation |
| behavior_issues | 3 | Helps match with right trainers |

### 3. LIFESTYLE & PREFERENCES (20 points)
| Question | Weight | Why Important |
|----------|--------|---------------|
| alone_time_comfort | 5 | Stay and boarding planning |
| car_comfort | 4 | Travel service planning |
| travel_readiness | 3 | Adventure planning |
| favorite_spot | 2 | Comfort understanding |
| morning_routine | 2 | Scheduling optimization |
| exercise_needs | 2 | Activity planning |
| feeding_times | 2 | Stay planning |

### 4. FOOD & NUTRITION (9 points)
| Question | Weight | Why Important |
|----------|--------|---------------|
| favorite_protein | 3 | Food personalization |
| food_motivation | 3 | Training approach |
| treat_preference | 3 | Treat selection |

### 5. TRAINING & DEVELOPMENT (5 points)
| Question | Weight | Why Important |
|----------|--------|---------------|
| training_level | 3 | Service matching |
| motivation_type | 2 | Training effectiveness |

### 6. RELATIONSHIPS (5 points)
| Question | Weight | Why Important |
|----------|--------|---------------|
| primary_bond | 2 | Family understanding |
| other_pets | 2 | Household dynamics |
| kids_at_home | 1 | Safety considerations |

---

## TOTAL SCORING = 100 points possible

## FRONTEND ADDITIONAL QUESTIONS (NON-SCORING)
These are in UI but don't contribute to score:
- name, breed, dob, gender, weight, size
- describe_3_words, stranger_reaction, handling_comfort
- lives_with, attention_seeking, walks_per_day, energetic_time
- sleep_location, separation_anxiety, space_preference, crate_trained
- favorite_item, outdoor_access, car_rides, hotel_experience, travel_anxiety
- favorite_treats, diet_type, sensitive_stomach
- training_response, leash_behavior, barking
- medical_conditions, medications, vet_name, vaccination_status, spayed_neutered

---

## ONBOARDING FLOW DESIGN (8-10 Steps for 80%+ Score)

### STEP 1: WELCOME & IDENTITY (5%)
- Pet name ✓
- Species (dog/cat) ✓
- Breed ✓

### STEP 2: AGE & SIZE (10%)
- Date of birth ✓
- Life stage [5 points]
- Weight ✓
- Size ✓

### STEP 3: PHOTO & FIRST IMPRESSION
- Pet photo upload
- Gender ✓

### STEP 4: PERSONALITY CORE (14%)
- Temperament [8 points]
- Energy level [6 points]

### STEP 5: HEALTH ESSENTIALS (18%)
- Food allergies [10 points]
- Health conditions [8 points]

### STEP 6: SOCIAL BEHAVIORS (8%)
- Social with dogs [4 points]
- Social with people [4 points]

### STEP 7: COMFORT & CARE (14%)
- Vet comfort [5 points]
- Grooming tolerance [4 points]
- Noise sensitivity [4 points]
- Alone time comfort [5 points]

### STEP 8: FOOD & TREATS (9%)
- Favorite protein [3 points]
- Food motivation [3 points]
- Treat preference [3 points]

### STEP 9: TRAINING & BEHAVIOR (8%)
- Training level [3 points]
- Motivation type [2 points]
- Behavior issues [3 points]

### STEP 10: FAMILY & LIFESTYLE (14%)
- Primary bond [2 points]
- Other pets [2 points]
- Kids at home [1 point]
- Car comfort [4 points]
- Travel readiness [3 points]
- Exercise needs [2 points]

---

## MINIMUM FOR 80% SOUL SCORE
Users MUST answer these high-weight questions:
1. food_allergies (10)
2. temperament (8)
3. health_conditions (8)
4. energy_level (6)
5. life_stage (5)
6. vet_comfort (5)
7. alone_time_comfort (5)
8. social_with_dogs (4)
9. social_with_people (4)
10. car_comfort (4)
11. grooming_tolerance (4)
12. noise_sensitivity (4)

Total = 67 points + any 13 points from remaining = 80%

---

## WHAT'S MISSING FOR 100% ONBOARDING?

### Currently NOT asked in onboarding:
1. morning_routine [2]
2. favorite_spot [2]
3. feeding_times [2]

These are lower priority (2 pts each) - can be asked later via Mira drip questions.

### Nice to have (non-scoring but useful):
- separation_anxiety (for boarding prep)
- vaccination_status (for services)
- spayed_neutered (for daycare)

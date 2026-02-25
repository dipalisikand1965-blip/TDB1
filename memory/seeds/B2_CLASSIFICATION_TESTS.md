# B2 CLASSIFICATION TESTS - 50 Test Prompts
## MIRA OS Classification Pipeline Test Harness
## seed_version: 1.0.0

---

## TEST CRITERIA

Each test specifies:
- **Input**: Raw user message (including messy phrasing, Hinglish, spelling errors)
- **Expected pillar**: Primary pillar from locked 13
- **Expected tags**: Top 3 canonical tags
- **Expected safety_level**: normal | caution | emergency
- **Expected intent**: learn | buy | book | plan | track | emergency | unknown

---

## 50 TEST PROMPTS

### CARE (8 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 1 | "groomer" | care | grooming | normal | book |
| 2 | "looking for grooming for mojo" | care | grooming | normal | book |
| 3 | "need a bath for my dog" | care | bath | normal | book |
| 4 | "nail cut karo" | care | nail_trim | normal | book |
| 5 | "vet appointment book karna hai" | care | vet_appointment | normal | book |
| 6 | "vaccine due hai" | care | vaccination_schedule | normal | book |
| 7 | "my dog is vomiting" | care | mild_vomiting | caution | learn |
| 8 | "dog ko loose motion ho raha hai" | care | diarrhea | caution | learn |

### DINE (6 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 9 | "food for puppy" | dine | puppy_nutrition, meals | normal | learn |
| 10 | "my dog won't eat" | dine | picky_eater, loss_appetite | caution | learn |
| 11 | "best treats for dogs" | dine | treats | normal | buy |
| 12 | "allergy safe food kya hai" | dine | allergy_safe | normal | learn |
| 13 | "can dogs eat chocolate" | dine | toxic_avoidance | normal | learn |
| 14 | "senior dog diet" | dine | senior_nutrition | normal | learn |

### STAY (5 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 15 | "boarding" | stay | kennel | normal | book |
| 16 | "daycare near me" | stay | daycare | normal | book |
| 17 | "pet sitter chahiye" | stay | pet_sitting | normal | book |
| 18 | "going on vacation need dog hotel" | stay | kennel, premium_boarding | normal | book |
| 19 | "separation anxiety boarding" | stay | separation_anxiety_stay | normal | learn |

### TRAVEL (5 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 20 | "flying with dog" | travel | air_travel | normal | learn |
| 21 | "pet taxi book karo" | travel | pet_taxi | normal | book |
| 22 | "fit to fly certificate" | travel | fit_to_fly | normal | learn |
| 23 | "international relocation with pet" | travel | international_travel | normal | learn |
| 24 | "car travel tips" | travel | car_travel | normal | learn |

### ENJOY (4 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 25 | "dog park near me" | enjoy | dog_parks | normal | learn |
| 26 | "pet cafe in mumbai" | enjoy | cafes | normal | learn |
| 27 | "toys for bored dog" | enjoy | toys, enrichment_games | normal | buy |
| 28 | "scared of diwali crackers" | enjoy | noise_phobia_support | normal | learn |

### FIT (4 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 29 | "dog walker" | fit | daily_walks | normal | book |
| 30 | "training class for puppy" | fit | basic_obedience | normal | book |
| 31 | "leash pulling problem" | fit | leash_training | normal | learn |
| 32 | "reactive dog help" | fit | reactivity | normal | learn |

### LEARN (4 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 33 | "potty training kaise kare" | learn | training_basics_education | normal | learn |
| 34 | "new puppy owner guide" | learn | new_pet_parenting | normal | learn |
| 35 | "labrador breed info" | learn | breed_guide | normal | learn |
| 36 | "first aid for dogs" | learn | first_aid_education | normal | learn |

### CELEBRATE (4 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 37 | "cake" | celebrate | cakes | normal | buy |
| 38 | "birthday party for dog" | celebrate | birthday, pawty | normal | plan |
| 39 | "photoshoot book karna hai" | celebrate | photo_shoot | normal | book |
| 40 | "gotcha day celebration ideas" | celebrate | gotcha_day | normal | learn |

### ADOPT (3 tests)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 41 | "want to adopt a dog" | adopt | where_to_adopt | normal | learn |
| 42 | "first week with new puppy" | adopt | first_week_plan | normal | learn |
| 43 | "introduce new dog to cat" | adopt | introduce_to_pets | normal | learn |

### EMERGENCY (6 tests) - CRITICAL

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 44 | "my dog ate chocolate" | emergency | poison_ingestion | emergency | emergency |
| 45 | "dog can't breathe" | emergency | breathing_distress | emergency | emergency |
| 46 | "seizure ho raha hai" | emergency | seizure | emergency | emergency |
| 47 | "bleeding nahi ruk rahi" | emergency | severe_bleeding | emergency | emergency |
| 48 | "collapsed suddenly" | emergency | collapse_unconscious | emergency | emergency |
| 49 | "emergency vet near me" | emergency | emergency_vet | emergency | emergency |

### FAREWELL (1 test)

| # | Input | Expected Pillar | Expected Tags | Safety | Intent |
|---|-------|-----------------|---------------|--------|--------|
| 50 | "cremation options for my dog" | farewell | cremation_burial | normal | learn |

---

## EDGE CASES

### Short prompts (single word)
- "groomer" → care/grooming
- "cake" → celebrate/cakes
- "vomiting" → care/mild_vomiting (caution)
- "boarding" → stay/kennel
- "emergency" → emergency/emergency_vet

### Hinglish
- "nail cut karo" → care/nail_trim
- "vaccine due hai" → care/vaccination_schedule
- "pet taxi book karo" → travel/pet_taxi
- "potty training kaise kare" → learn/training_basics_education

### Spelling errors
- "groming" → care/grooming (fuzzy match)
- "bording" → stay/kennel (fuzzy match)
- "vacination" → care/vaccination_schedule

### Multi-intent
- "book grooming and buy treats" → care/grooming (primary), book intent
- "birthday cake and party" → celebrate/birthday + cakes, plan intent

---

## EXPECTED BEHAVIOR

### Emergency Override
Any message containing emergency synonyms:
- Returns `safety_level: emergency`
- Returns `primary_pillar: emergency`
- Returns `intent: emergency`
- Suppresses all other picks

### Caution Flag
Messages with caution tags (vomiting, diarrhea, limping):
- Returns `safety_level: caution`
- Allows education + vet routing
- Suppresses shopping pushes

### Service Vertical Detection
When booking intent detected:
- Populates `service_verticals[]`
- Populates `service_types[]` if mentioned

### Confidence Scoring
- High confidence (0.8+): Multiple synonym matches, protected tags
- Medium confidence (0.6-0.8): Single strong match
- Low confidence (<0.6): Triggers LLM fallback

---

*B2 Classification Tests - Created December 2025*
*seed_version: 1.0.0*

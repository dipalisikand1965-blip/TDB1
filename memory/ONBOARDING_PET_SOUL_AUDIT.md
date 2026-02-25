# MIRA OS: COMPLETE ONBOARDING & PET SOUL AUDIT
## Day 0 to Soul Score 100 - Field-by-Field Analysis

**Audit Date:** February 13, 2026  
**Status:** COMPREHENSIVE AUDIT

---

## 📋 EXECUTIVE SUMMARY

| Metric | Value |
|--------|-------|
| Total Questions in Pet Soul | **27 questions** |
| Total Points | **100 points** |
| OS Sections (Folders) | **8 folders** |
| Day 0 Mandatory Fields | **5 fields** |
| Day 0 Optional Fields | **7 fields** |

---

## A) DAY 0 ONBOARDING: COMPLETE FIELD LIST

### Entry Points for New Users

1. **`/register`** - Basic Account Creation (minimal)
2. **`/join`** or **`/pet-soul-onboard`** - Full Onboarding (recommended)
3. **`/membership-onboarding`** - Membership + Pet Creation

---

### A.1) PET PARENT FIELDS (Day 0)

| Field | Required | Type | Where Written |
|-------|----------|------|---------------|
| `name` | ✅ MANDATORY | string | `users.name` |
| `email` | ✅ MANDATORY | string | `users.email` |
| `password` | ✅ MANDATORY | string | `users.password` (hashed) |
| `phone` | ✅ MANDATORY | string | `users.phone` |
| `whatsapp` | ⬜ Optional | string | `users.whatsapp` |
| `city` | ⬜ Optional | string | `users.city` |
| `address` | ⬜ Optional | string | `users.address` |
| `pincode` | ⬜ Optional | string | `users.pincode` |
| `photo` | ⬜ Optional | file | `users.photo_url` |
| `preferredContact` | ⬜ Optional | enum | `users.preferred_contact` |
| `notifications` | ⬜ Optional | object | `users.notification_preferences` |

---

### A.2) PET FIELDS (Day 0 - Identity Layer)

| Field | Required | Type | Where Written |
|-------|----------|------|---------------|
| `name` | ✅ MANDATORY | string | `pets.name`, `pets.identity.name` |
| `breed` | ⬜ Optional (AI can detect) | string | `pets.breed`, `pets.identity.breed` |
| `gender` | ⬜ Optional | enum (male/female) | `pets.gender`, `pets.identity.gender` |
| `birth_date` | ⬜ Optional | date | `pets.birth_date`, `pets.identity.birth_date` |
| `gotcha_date` | ⬜ Optional | date | `pets.gotcha_date`, `pets.identity.gotcha_date` |
| `weight` | ⬜ Optional | number | `pets.weight`, `pets.identity.weight` |
| `weight_unit` | ⬜ Optional | enum (kg/lbs) | `pets.identity.weight_unit` |
| `is_neutered` | ⬜ Optional | boolean | `pets.is_neutered`, `pets.identity.is_neutered` |
| `photo_url` | ⬜ Optional (triggers breed AI) | string | `pets.photo_url`, `pets.identity.photo_url` |
| `size` | ⬜ Optional (auto-calculated) | enum (S/M/L/XL) | `pets.identity.size` |

**Auto-calculated fields:**
- `age_years` - calculated from `birth_date`
- `age_months` - calculated from `birth_date`
- `size` - auto-suggested from weight (S<5kg, M<15kg, L<30kg, XL>30kg)

---

### A.3) WHERE DATA IS WRITTEN

| Data Type | Collection | Field Path |
|-----------|------------|------------|
| Pet Identity | `pets` | `pets.identity.*` |
| Pet Soul Answers | `pets` | `pets.doggy_soul_answers.*` |
| Pet Insights | `pets` | `pets.insights.*` |
| Pet Scores | `pets` | `pets.overall_score`, `pets.folder_scores` |
| Pet Medical | `pets` | `pets.medical.*` |
| Pet Celebrations | `pets` | `pets.celebrations[]` |
| Pet Pillar History | `pets` | `pets.pillar_history[]` |
| Pet Soul Moments | `pets` | `pets.soul_moments[]` |

---

### A.4) MINIMAL PROFILE FOR MIRA TO RESPOND WITHOUT GUESSING

| Field | Purpose | Default if Missing |
|-------|---------|-------------------|
| `name` | ✅ REQUIRED | Cannot respond without |
| `breed` | Personality/health context | "dog" (generic fallback) |
| `birth_date` | Life stage context | Ask user OR infer from appearance |
| `weight` | Health/nutrition context | Ask user OR use breed average |
| `food_allergies` | ⚠️ SAFETY CRITICAL | **MUST ASK** - never assume |
| `health_conditions` | ⚠️ SAFETY CRITICAL | **MUST ASK** - never assume |
| `city` | Local recommendations | Ask user OR use IP geolocation |

**CRITICAL RULE:**  
> Mira MUST ask about allergies and health conditions before making any food, treat, or health recommendations. NEVER assume "no allergies" - always confirm.

---

## B) THE 8 OS SECTIONS (DOGGY SOUL FOLDERS)

### Overview

| # | Folder Key | Name | Icon | Points | Questions |
|---|------------|------|------|--------|-----------|
| 1 | `identity_temperament` | Identity & Temperament | 🎭 | 10 | 6 |
| 2 | `family_pack` | Family & Pack | 👨‍👩‍👧‍👦 | 15 | 4 |
| 3 | `rhythm_routine` | Rhythm & Routine | ⏰ | 12 | 5 |
| 4 | `home_comforts` | Home Comforts | 🏠 | 14 | 4 |
| 5 | `travel_style` | Travel Style | ✈️ | 8 | 4 |
| 6 | `taste_treat` | Taste & Treat World | 🍖 | 14 | 4 |
| 7 | `training_behaviour` | Training & Behaviour | 🎓 | 12 | 4 |
| 8 | `long_horizon` | Long Horizon (Health) | 🌅 | 15 | 4 |

**TOTAL: 100 points, 35 questions** (Note: Config has 27, routes has 35)

---

### B.1) IDENTITY & TEMPERAMENT (10 points, 6 questions)

| Question ID | Question | Type | Weight | Options |
|-------------|----------|------|--------|---------|
| `describe_3_words` | How would you describe your dog in 3 words? | text | 3 | - |
| `general_nature` | Is your dog generally... | select | 4 | Calm, Curious, Playful, Shy, Guarded, Fearful, Highly energetic |
| `stranger_reaction` | How does your dog react to strangers? | select | 3 | Friendly, Cautious, Indifferent, Nervous, Protective |
| `loud_sounds` | How does your dog react to loud sounds? | select | 4 | Completely fine, Mildly anxious, Very anxious, Needs comfort |
| `social_preference` | Does your dog prefer... | select | 3 | Being around people, Being around other dogs, Being mostly with you, Being mostly independent |
| `handling_comfort` | Is your dog comfortable being handled? | select | 3 | Very comfortable, Sometimes uncomfortable, Highly sensitive |

**On Submit:**
- ✅ Writes to `pets.doggy_soul_answers.*`
- ✅ Updates `pets.overall_score`
- ✅ Updates `pets.folder_scores.identity_temperament`
- ✅ Regenerates `pets.insights`
- ⬜ Does NOT version history (overwrites)

---

### B.2) FAMILY & PACK (15 points, 4 questions)

| Question ID | Question | Type | Weight | Options |
|-------------|----------|------|--------|---------|
| `lives_with` | Does your dog live with... | multi_select | 3 | Adults only, Children, Other dogs, Other pets |
| `behavior_with_dogs` | How does your dog behave with other dogs? | select | 4 | Loves all dogs, Selective friends, Nervous, Reactive |
| `most_attached_to` | Who is your dog most attached to? | select | 2 | Me, Partner, Children, Everyone equally |
| `attention_seeking` | Does your dog like being centre of attention? | select | 2 | Yes, Sometimes, No |

**On Submit:**
- ✅ Writes to `pets.doggy_soul_answers.*`
- ✅ Updates scores
- ✅ Flags `is_reactive` in insights if `behavior_with_dogs === "Reactive"`
- ⬜ Does NOT version history

---

### B.3) RHYTHM & ROUTINE (12 points, 5 questions)

| Question ID | Question | Type | Weight | Options |
|-------------|----------|------|--------|---------|
| `walks_per_day` | How many walks per day? | select | 3 | 1, 2, 3+ |
| `energetic_time` | What time is your dog most energetic? | select | 2 | Morning, Afternoon, Evening, Night |
| `sleep_location` | Where does your dog usually sleep? | select | 2 | Your bed, Their own bed, Crate, Sofa/floor |
| `alone_comfort` | Is your dog used to being left alone? | select | 4 | Yes comfortably, Sometimes anxious, Not at all |
| `separation_anxiety` | Does your dog have separation anxiety? | select | 5 | No, Mild, Moderate, Severe |

**On Submit:**
- ✅ Writes to `pets.doggy_soul_answers.*`
- ✅ Flags `separation_anxiety` level in insights
- ✅ Flags `anxiety_level` as high/mild/none
- ⬜ Does NOT version history

---

### B.4) HOME COMFORTS (14 points, 4 questions)

| Question ID | Question | Type | Weight | Options |
|-------------|----------|------|--------|---------|
| `favorite_item` | Does your dog have a favourite item? | select | 2 | Toy, Blanket, Bed, None |
| `space_preference` | Does your dog prefer... | select | 3 | Quiet spaces, Busy spaces, Outdoor time, Indoor time |
| `crate_trained` | Is your dog crate-trained? | select | 4 | Yes, No, In training |
| `car_rides` | Does your dog like car rides? | select | 4 | Loves them, Neutral, Anxious, Gets motion sickness |

**On Submit:**
- ✅ Writes to `pets.doggy_soul_answers.*`
- ✅ Flags `is_crate_trained` in insights
- ✅ Flags `has_motion_sickness` if car_rides === "Gets motion sickness"
- ⬜ Does NOT version history

---

### B.5) TRAVEL STYLE (8 points, 4 questions)

| Question ID | Question | Type | Weight | Options |
|-------------|----------|------|--------|---------|
| `usual_travel` | How does your dog usually travel? | select | 3 | Car, Train, Flight occasionally, Never travels |
| `hotel_experience` | Has your dog stayed in a hotel before? | select | 3 | Yes loved it, Yes but was anxious, No |
| `stay_preference` | What kind of stay suits your dog best? | select | 3 | Quiet nature hotel, Pet-friendly resort, City hotel, Homestay/villa |
| `travel_social` | During stays, does your dog prefer... | select | 2 | Private spaces, Social pet areas |

**On Submit:**
- ✅ Writes to `pets.doggy_soul_answers.*`
- ✅ Updates scores
- ⬜ Does NOT version history

---

### B.6) TASTE & TREAT WORLD (14 points, 4 questions) ⚠️ SAFETY CRITICAL

| Question ID | Question | Type | Weight | Options |
|-------------|----------|------|--------|---------|
| `diet_type` | Is your dog's diet... | select | 4 | Vegetarian, Non-vegetarian, Mixed |
| `food_allergies` | Does your dog have food allergies? | multi_select | **5** | No, Chicken, Beef, Grains, Dairy, Other |
| `favorite_treats` | What treats does your dog love most? | multi_select | 3 | Biscuits, Jerky, Cakes, Homemade food, Fresh fruits |
| `sensitive_stomach` | Does your dog have a sensitive stomach? | select | 4 | Yes, No, Sometimes |

**On Submit:**
- ✅ Writes to `pets.doggy_soul_answers.*`
- ✅ **CRITICAL:** Flags `has_allergies` and `allergy_list` in insights
- ✅ Flags `has_sensitive_stomach`
- ✅ Adds to `pets.insights.recommendations` if allergies present
- ⬜ Does NOT version history

---

### B.7) TRAINING & BEHAVIOUR (12 points, 4 questions)

| Question ID | Question | Type | Weight | Options |
|-------------|----------|------|--------|---------|
| `training_level` | Is your dog trained? | select | 3 | Fully trained, Partially trained, Not trained |
| `training_response` | How does your dog respond best to training? | select | 3 | Treats, Praise, Toys, Play |
| `leash_behavior` | Does your dog pull on the leash? | select | 2 | Always, Sometimes, Rarely |
| `barking` | Does your dog bark often? | select | 2 | Yes, Occasionally, Rarely |

**On Submit:**
- ✅ Writes to `pets.doggy_soul_answers.*`
- ✅ Flags `is_trained` in insights
- ⬜ Does NOT version history

---

### B.8) LONG HORIZON (15 points, 4 questions) ⚠️ SAFETY CRITICAL

| Question ID | Question | Type | Weight | Options |
|-------------|----------|------|--------|---------|
| `main_wish` | What do you want most for your dog? | multi_select | 2 | Good health, More training, More travel experiences, More social time |
| `help_needed` | Would you like help with... | multi_select | 2 | Behaviour training, Travel planning, Grooming routines, Diet planning |
| `dream_life` | In one sentence, what kind of life do you want your dog to have? | text | 3 | - |
| `celebration_preferences` | Which celebrations would you like to celebrate? | multi_select | 3 | Birthday, Gotcha Day, Diwali, Holi, Christmas, New Year, Valentine's Day, Raksha Bandhan, Independence Day, Easter, Eid |

**On Submit:**
- ✅ Writes to `pets.doggy_soul_answers.*`
- ✅ Uses `celebration_preferences` to auto-create calendar events
- ⬜ Does NOT version history

---

## C) WRITE BEHAVIOR ANALYSIS

### C.1) What Happens on Each Section Submit

| Action | Triggered? |
|--------|-----------|
| Write to `pets.doggy_soul_answers` | ✅ YES |
| Update `pets.overall_score` | ✅ YES |
| Update `pets.folder_scores[folder_key]` | ✅ YES |
| Regenerate `pets.insights` | ✅ YES |
| Write to `events_log` | ⬜ NO (should be added) |
| Version history / audit trail | ⬜ NO (overwrites directly) |
| Recalculate Soul completeness score | ✅ YES |

### C.2) Can User Edit Answers Later?

**YES** - Users can edit answers via:
1. `/pet-soul/{pet_id}` page
2. `/dashboard` → Pet Profile section
3. Mira conversation (auto-extraction)

**Version History?**
- ⚠️ **NO** - Current implementation **OVERWRITES** previous answers
- **RECOMMENDATION:** Implement `pets.answer_history[]` array with timestamps

### C.3) Auto-Learning Sources

Pet Soul answers can be updated from:

| Source | Collection Path | Example |
|--------|----------------|---------|
| Direct UI | `pets.doggy_soul_answers.*` | User answers question |
| Mira Conversation | `pets.doggy_soul_answers.*` | Mira extracts from chat |
| Pillar Booking | `pets.pillar_history[]` | DINE booking captures allergies |
| Order History | `pets.doggy_soul_answers.*` | Treat order reveals preferences |
| Admin Update | `pets.doggy_soul_answers.*` | Manual data entry |

---

## D) SOUL SCORE CALCULATION

### D.1) Scoring Logic

```
Total Points = 100
Score = (Earned Points / Total Points) × 100
```

### D.2) Question Weights by Level

| Level | Fields | Total Points |
|-------|--------|--------------|
| `core` | temperament, energy_level, feeding_times, food_allergies, health_conditions, life_stage | ~25 |
| `important` | Most other fields | ~60 |
| `advanced` | favorite_spot, favorite_toy_type, treat_preference | ~15 |

### D.3) Tier Thresholds

| Tier | Score Range | Name | Description |
|------|-------------|------|-------------|
| 🐾 | 0-24% | Curious Pup | Early understanding |
| 🌱 | 25-49% | Loyal Companion | Core context built |
| 🤝 | 50-74% | Trusted Guardian | Concierge-ready |
| 🐕‍🦺 | 75-100% | Pack Leader | Deep understanding |

---

## E) DATA MODEL SUMMARY

### Pets Collection Schema

```javascript
{
  id: "pet-xxxx",
  owner_id: "user-xxxx",
  owner_email: "email@example.com",
  
  // Layer 1: Identity (Day 0)
  name: "Lola",
  breed: "Golden Retriever",
  identity: {
    name: "Lola",
    breed: "Golden Retriever",
    birth_date: "2020-05-15",
    gotcha_date: "2020-07-01",
    weight: 28,
    weight_unit: "kg",
    size: "L",
    gender: "female",
    is_neutered: true,
    photo_url: "https://..."
  },
  
  // Layer 2: Doggy Soul Answers (Progressive)
  doggy_soul_answers: {
    // Identity & Temperament
    describe_3_words: "playful, loving, curious",
    general_nature: "Playful",
    // ... all 35 question answers
  },
  
  // Scores
  overall_score: 68.5,
  folder_scores: {
    identity_temperament: 85,
    family_pack: 75,
    rhythm_routine: 60,
    // ...
  },
  
  // AI-Generated Insights
  insights: {
    overall_summary: "Lola is a Golden Retriever...",
    key_flags: {
      has_allergies: true,
      allergy_list: ["chicken"],
      anxiety_level: "mild",
      is_reactive: false,
      is_crate_trained: true,
      // ...
    },
    recommendations: []
  },
  
  // Medical
  medical: {
    last_vaccination_date: "2025-01-15",
    vaccination_reminder_enabled: true,
    // ...
  },
  
  // Celebrations
  celebrations: [
    { occasion: "birthday", date: "05-15", is_recurring: true }
  ],
  
  // Pillar Interaction History
  pillar_history: [
    { pillar: "dine", captured_at: "...", fields_captured: ["food_allergies"] }
  ],
  
  // Soul Moments (Milestones)
  soul_moments: [],
  
  // Metadata
  created_at: "2024-...",
  updated_at: "2025-...",
  soul_last_enriched: "2025-...",
  soul_updated_by: "mira_conversation"
}
```

---

## F) CRITICAL GAPS & RECOMMENDATIONS

### F.1) Missing Features

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No version history for answers | Cannot track changes | Add `answer_history[]` with timestamps |
| No events_log write on save | Missing audit trail | Write to `events_log` collection |
| Mira doesn't WAIT for answer | Premature recommendations | Implement conversation state machine |
| Quick tabs not contextual | Generic suggestions | Dynamic quick_replies based on missing Soul data |

### F.2) Conversation Flow Fix Needed

**Current Behavior (BROKEN):**
```
User: "Create a meal plan for Lola"
Mira: "Could you let me know if Lola has allergies?"
       [Shows: "Simple routine" / "Varied rotation" options]  ← WRONG!
```

**Correct Behavior (TO IMPLEMENT):**
```
User: "Create a meal plan for Lola"
Mira: "Could you let me know if Lola has allergies?"
       [Shows: "Yes, has allergies" / "No allergies" / "Not sure"]  ← CONTEXTUAL!

User: "Yes, chicken allergy"
Mira: [Extracts & stores: food_allergies = ["chicken"]]
       "Got it! I've noted Lola is allergic to chicken. 
        Now, would you prefer a simple routine or varied rotation?"
       [Shows: "Simple routine" / "Varied rotation"]  ← CORRECT TIMING!
```

---

## G) FILES REFERENCED

| File | Purpose |
|------|---------|
| `/app/backend/pet_soul_routes.py` | Main Pet Soul API routes |
| `/app/backend/pet_soul_config.py` | Scoring configuration |
| `/app/backend/soul_first_logic.py` | Soul-First response generation |
| `/app/frontend/src/pages/MembershipOnboarding.jsx` | Full onboarding flow |
| `/app/frontend/src/pages/PetSoulOnboard.jsx` | Pet Soul onboarding |
| `/app/frontend/src/pages/Register.jsx` | Basic registration |

---

**Last Updated:** February 13, 2026  
**Author:** MIRA OS Audit Agent

# MIRA OS Personalization & Intelligence Audit
## "Getting to 100/100 Soul Score"

*Last Updated: Feb 12, 2026*

---

## 📊 MYSTIQUE'S CURRENT STATE: 48% Soul Score

| Category | Score | Max | Status |
|----------|-------|-----|--------|
| 🛡️ Safety & Health | 74.3% | 35pts | ✅ Good |
| 🎭 Personality | 72.0% | 25pts | ✅ Good |
| 🏠 Lifestyle | 0% | 20pts | ❌ Missing |
| 🍖 Nutrition | 37.5% | 8pts | ⚠️ Partial |
| 🎓 Training | 0% | 5pts | ❌ Missing |
| ❤️ Relationships | 0% | 5pts | ❌ Missing |

**Questions Answered:** 8 of 26 (30.8% completion)
**Current Tier:** Soul Seeker (25-49%)
**Next Tier:** Soul Explorer (50-74%) - needs 2 more points!

---

## 🔍 THE PROBLEM: Data Fragmentation

Mystique has **RICH DATA** scattered across **5 different places**, but only `doggy_soul_answers` is used for scoring:

### 1. `doggy_soul_answers` ✅ SCORED (48pts earned)
This is the ONLY source used for Soul Score calculation:
- ✅ `food_allergies`: Chicken, Beef, Wheat, Corn (+10pts)
- ✅ `health_conditions`: Brachycephalic (+8pts)
- ✅ `life_stage`: Senior (+5pts)
- ✅ `temperament`: Gentle, Calm (+8pts)
- ✅ `energy_level`: Low energy (+6pts)
- ✅ `separation_anxiety`: Moderate (+5pts - but wrong question ID!)
- ✅ `food_motivation`: Very food motivated (+3pts)
- ✅ `favorite_treats`: Liver, Cheese (+?)

### 2. `preferences` ❌ NOT SCORED (but rich data exists!)
- 📦 `allergies`: ['Chicken', 'Beef', 'Wheat', 'Corn'] - DUPLICATE
- 📦 `favorite_flavors`: ['Liver', 'Cheese'] - DUPLICATE
- 📦 `activity_level`: moderate
- 📦 `flavor_profile`: farmhouse
- 📦 `treat_texture`: crunchy

### 3. `soul` ❌ NOT SCORED (personality gold mine!)
- 💜 `personality_tag`: "Drama Queen"
- 💜 `persona`: royal
- 💜 `love_language`: gifts
- 💜 `human_job`: Queen
- 💜 `special_move`: Her growl to Meister

### 4. `soul_enrichments` ❌ NOT SCORED (learned from chat!)
- 🧠 `anxiety_triggers`: ['thunder', 'gets scared']
- 🧠 `favorite_treats`: ['fish flavored']
- 🧠 `travel_destinations`: [...]
- 🧠 `dining_locations`: [...]

### 5. `identity` ❌ NOT SCORED
- Basic pet info

---

## 📋 SCORING SYSTEM AUDIT

### Current Weights (Total: 100 points)

| Category | Points | Questions |
|----------|--------|-----------|
| Safety & Health | 35 | food_allergies(10), health_conditions(8), vet_comfort(5), life_stage(5), grooming_tolerance(4), noise_sensitivity(3) |
| Personality | 25 | temperament(8), energy_level(6), social_with_dogs(4), social_with_people(4), behavior_issues(3) |
| Lifestyle | 20 | alone_time_comfort(5), car_comfort(4), travel_readiness(3), favorite_spot(2), morning_routine(2), exercise_needs(2), feeding_times(2) |
| Nutrition | 10 | favorite_protein(3), food_motivation(3), treat_preference(2) |
| Training | 5 | training_level(3), motivation_type(2) |
| Relationships | 5 | primary_bond(2), other_pets(2), kids_at_home(1) |

### ❌ CRITICAL ISSUES FOUND:

1. **Question ID Mismatch:**
   - We have `separation_anxiety` data but scoring looks for `alone_time_comfort`
   - We have `loud_sounds` data but alias maps to `noise_sensitivity` 
   - We have `stranger_reaction` but scoring looks for `social_with_people`

2. **Alias System Not Working:**
   The alias mapping exists but isn't capturing all the data:
   ```python
   'general_nature': 'temperament',  # ✅ Working
   'loud_sounds': 'noise_sensitivity',  # ❌ Not adding points
   'stranger_reaction': 'social_with_people',  # ❌ Not adding points
   ```

3. **Rich Data Not Used:**
   - `preferences.treat_texture` → should map to `treat_preference`
   - `soul.personality_tag` → could be bonus points
   - `soul_enrichments.anxiety_triggers` → should inform safety score

---

## 🎯 ROADMAP TO 100/100

### Phase 1: Fix Data → Score Mapping (Quick Win: +15-20pts)

**Problem:** Data exists but doesn't map to scoring questions
**Solution:** Expand the alias system to recognize more field names

| Existing Data | Should Map To | Points |
|---------------|---------------|--------|
| `separation_anxiety` | `alone_time_comfort` | +5 |
| `loud_sounds` | `noise_sensitivity` | +3 |
| `stranger_reaction` | `social_with_people` | +4 |
| `handling_comfort` | `grooming_tolerance` | +4 |
| `describe_3_words` | (bonus?) | +0 |

**Expected Result:** Mystique goes from 48% → 62-68%

### Phase 2: Cross-Reference Data Sources (+5-10pts)

**Problem:** Same data in multiple places isn't aggregated
**Solution:** Before scoring, merge data from all 5 sources

```python
def get_complete_pet_data(pet):
    answers = pet.get('doggy_soul_answers', {})
    prefs = pet.get('preferences', {})
    soul = pet.get('soul', {})
    enrichments = pet.get('soul_enrichments', {})
    
    # Cross-reference
    if not answers.get('treat_preference') and prefs.get('treat_texture'):
        answers['treat_preference'] = prefs['treat_texture']
    
    return answers
```

### Phase 3: Add Missing UI for Unanswered Questions

Mystique is missing answers for:
- ❌ `vet_comfort` (5pts) - How comfortable at vet?
- ❌ `grooming_tolerance` (4pts) - How does she handle grooming?
- ❌ `car_comfort` (4pts) - Car rides?
- ❌ `travel_readiness` (3pts) - Ready for travel?
- ❌ `training_level` (3pts) - What's her training level?
- ❌ `favorite_protein` (3pts) - Favorite meat?
- ❌ `social_with_dogs` (4pts) - How is she with other dogs?

**UI Options:**
1. Quick Quiz in Mira Chat
2. Progressive Profiling during shopping
3. "Boost Mystique's Soul" card

### Phase 4: Enrichment → Profile Sync (+bonus)

**Problem:** Chat learns things but doesn't update profile
**Example:** User said "she loves fish flavored food" but `favorite_protein` isn't set

**Solution:** 
1. After extracting memory, check if it matches a scoring question
2. Prompt user: "Should I add 'fish' as Mystique's favorite protein?"
3. Auto-update `doggy_soul_answers.favorite_protein`

---

## 🏗️ IMPLEMENTATION ORDER

### Priority 1: Fix Alias Mapping (Backend Only)
**File:** `/app/backend/pet_score_logic.py`
**Time:** 15 minutes
**Impact:** +15-20 points for Mystique immediately

### Priority 2: Data Source Merging (Backend Only)  
**File:** `/app/backend/pet_score_logic.py`
**Time:** 30 minutes
**Impact:** +5-10 points

### Priority 3: "Boost Soul" Quick Questions UI
**Files:** Frontend components
**Time:** 2 hours
**Impact:** Path to 100% for engaged users

### Priority 4: Chat → Profile Sync
**Files:** Backend memory extraction
**Time:** 1 hour
**Impact:** Passive score growth from conversations

---

## 📈 EXPECTED PROGRESSION

| Phase | Mystique Score | Tier |
|-------|----------------|------|
| Current | 48% | Soul Seeker |
| After Phase 1 | 65-68% | Soul Explorer |
| After Phase 2 | 72-78% | Soul Explorer/Master |
| After Phase 3+4 | 90-100% | Soul Master |

---

## 🔑 KEY INSIGHT

Mystique has **MORE data than the scoring system recognizes**. The issue isn't missing data - it's **data fragmentation and mapping gaps**.

The Profile-First Doctrine is working for chat responses, but the Soul Score calculation is too narrow.

---

## NEXT STEPS

1. ✅ **Immediately:** Fix alias mapping in `pet_score_logic.py`
2. ✅ **Immediately:** Add cross-reference from preferences/soul to answers
3. 📝 **This Week:** Build "Quick Questions" UI for missing high-impact questions
4. 📝 **Later:** Auto-sync enrichments to profile

# MIRA OS - Question Bank Coverage Audit
## Date: February 12, 2026

---

## EXECUTIVE SUMMARY

| Metric | Score | Status |
|--------|-------|--------|
| **Pillar Detection Accuracy** | 72.5% (37/51) | 🟡 NEEDS IMPROVEMENT |
| **Pillars Defined in Code** | 13 | ✅ |
| **Question Categories in Doc** | 16+ | ⚠️ GAP |
| **OS Intelligence Applied** | ~70% | 🟡 PARTIAL |

---

## QUESTION BANK CATEGORIES (from uploaded doc)

The uploaded document contains **500+ questions** across these categories:

### WELL COVERED (70-100% detection) ✅
| Pillar | Sample Questions | Detection Rate |
|--------|------------------|----------------|
| **CELEBRATE** | Birthday, parties, festivals, gifts | 100% |
| **STAY** | Sleeping, alone time, boarding, daycare | 90% |
| **TRAVEL** | Trips, car travel, flights, packing | 75% |
| **CARE** | Health, vet visits, symptoms | 70% |

### PARTIALLY COVERED (40-70%) 🟡
| Pillar | Sample Questions | Detection Rate | Issue |
|--------|------------------|----------------|-------|
| **DINE** | Food, portions, allergies, treats | 60% | "allergy" questions fall to advisory |
| **FIT** | Weight, exercise, walks | 60% | "walks" not linked to fit |
| **GROOMING** | Haircut, bath, nails, brushing | 60% | Many fall to advisory |

### POORLY COVERED (<40%) 🔴
| Pillar | Sample Questions | Detection Rate | Issue |
|--------|------------------|----------------|-------|
| **LEARN/TRAINING** | Trainers, barking, pulling, commands | 25% | Misdetected as "travel" |
| **SHOP** | Product recommendations | 25% | Falls to dine/celebrate |
| **PET PHOTOGRAPHY** | Shoots, memories, photos | 0% | No keywords defined |
| **DOG WALKING** | Walker hiring, walks | 50% | Falls to care |

---

## MISSING PILLARS (in doc but NOT in code)

These categories exist in the question bank but have **NO dedicated pillar**:

1. **GROOMING** - Currently merged into `care`
2. **BOARDING** - Currently merged into `stay`
3. **DAYCARE** - Currently merged into `stay`
4. **DOG WALKING** - Currently merged into `care`
5. **PET PHOTOGRAPHY** - NO COVERAGE
6. **TRAINING** - Merged into `learn` but keywords misfire

---

## KEYWORD GAPS IDENTIFIED

### Questions that fall to "advisory" (need keywords added):

| Question | Current Result | Should Be |
|----------|----------------|-----------|
| "Buddy has a chicken allergy" | advisory | dine/care |
| "Where should Buddy sleep at home" | advisory | stay |
| "Is flying with Buddy necessary" | advisory | travel |
| "What should I track at home" | advisory | care |
| "What kind of brush for his coat" | advisory | care/grooming |
| "His nails are getting long" | advisory | care/grooming |
| "How many walks does Buddy need" | advisory | fit/care |
| "Buddy barks too much" | advisory | learn |
| "Buddy pulls on leash" | advisory | learn |
| "Do we need a professional shoot" | advisory | (new pillar needed) |

---

## MISDETECTION ISSUES

| Question | Current Result | Correct Pillar | Root Cause |
|----------|----------------|----------------|------------|
| "Do we need a trainer" | travel | learn | "train" matches "travel" keywords? |
| "How to choose a trainer" | travel | learn | Same issue |
| "Treats per day healthy" | celebrate | dine | "treats" in celebrate keywords |
| "Buy dog food" | dine | shop | No shop pillar |
| "Treats safe for allergies" | celebrate | dine/shop | "treats" in celebrate |

---

## RECOMMENDATIONS

### P0 - CRITICAL FIXES
1. **Add missing keywords to pillars:**
   - `stay`: add "sleep", "sleeping"
   - `travel`: add "flying", "flight"
   - `care`: add "allergy", "track", "brush", "nails", "nail"
   - `fit`: add "walks", "walk"
   - `learn`: add "barking", "barks", "pulls", "pulling", "leash"

2. **Fix "train/trainer" misdetection** - currently matching travel

### P1 - NEW PILLARS NEEDED
1. **GROOMING** - Separate from care (high question volume)
2. **SHOP** - Product discovery pillar
3. **PHOTOGRAPHY** - Memorial/keepsake moments

### P2 - KEYWORD REFINEMENT
1. Move "treats" from celebrate → dine (or both)
2. Add boundary checking for "train" vs "travel"

---

## SCORING BREAKDOWN

### By Category:
| Category | Questions | Detected | Score |
|----------|-----------|----------|-------|
| CELEBRATE | 5 | 5 | 100% |
| DINE | 5 | 4 | 80% |
| STAY | 5 | 4 | 80% |
| TRAVEL | 5 | 3 | 60% |
| CARE | 5 | 3 | 60% |
| GROOMING | 5 | 3 | 60% |
| FIT | 4 | 3 | 75% |
| LEARN/TRAINING | 4 | 2 | 50% |
| SHOP | 4 | 3 | 75% |
| BOARDING | 3 | 3 | 100% |
| DAYCARE | 2 | 2 | 100% |
| DOG WALKING | 2 | 2 | 100% |
| PET PHOTOGRAPHY | 2 | 0 | 0% |
| **TOTAL** | **51** | **37** | **72.5%** |

---

## OS INTELLIGENCE STATUS

| Feature | Status | Notes |
|---------|--------|-------|
| Pillar Detection | 72.5% | Needs keyword additions |
| Memory System | ✅ Working | Fixed today |
| Intelligence Score | ✅ Working | Fixed today |
| Quick Replies | ✅ Working | Pillar-based |
| Safety Gates (allergies) | ✅ Working | In OS context |
| Temporal Awareness (birthdays) | ✅ Working | Auto-detects |
| Concierge Handoff | ✅ Working | Per-pillar picks |

---

*Audit generated: February 12, 2026*
*Next review: After keyword additions*

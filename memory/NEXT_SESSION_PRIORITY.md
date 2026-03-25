# NEXT SESSION: ONBOARDING REDESIGN
## February 16, 2026 - HANDOFF

---

## CORE DOCTRINE (READ FIRST!)

> **"MIRA IS THE BRAIN, CONCIERGE IS THE HANDS"**
> - Mira is the **Bible for the pet** - she knows EVERYTHING
> - Mira works when she knows the pet's **SOUL**
> - All 39 questions = 100 points = 100% Soul Score
> - Pet First. Always.

---

## WHAT USER WANTS

Transform the onboarding from a boring form into an **EXCITING** multi-chapter experience where ALL 39 Soul Questions are asked in an engaging way.

**User's exact words:**
- "Make all questions 100% on onboarding in a really much more exciting way"
- "Mira works when she knows the soul of the dog"
- "Pet first - Mira is the Bible for the (pet), Concierge the hands"

---

## CURRENT STATE

### Onboarding Flow
**File:** `/app/frontend/src/pages/MembershipOnboarding.jsx`
- Step 1: Pet Parent Details (name, email, phone, address)
- Step 2: Pet Details (name, breed, birth date)
- Step 3: Celebrations (birthday, gotcha day, etc.)
- Step 4: Review & Payment

### Soul Questions Backend (READY!)
**File:** `/app/backend/pet_soul_config.py`
- 39 questions across 8 pillars
- Scoring weights: 100 points total
- API endpoints working

---

## THE 8 GOLDEN PILLARS (39 Questions = 100 Points)

| Pillar | Emoji | Points | Questions |
|--------|-------|--------|-----------|
| Identity & Temperament | 🎭 | 15 | general_nature, temperament, life_stage, loud_sounds, handling_comfort |
| Family & Pack | 👨‍👩‍👧‍👦 | 12 | lives_with, kids_at_home, other_pets, behavior_with_dogs, most_attached_to |
| Rhythm & Routine | ⏰ | 14 | feeding_times, exercise_needs, walks_per_day, alone_comfort, separation_anxiety, sleep_location |
| Home Comforts | 🏠 | 8 | favorite_spot, crate_trained, car_rides, space_preference |
| Travel Style | ✈️ | 10 | usual_travel, hotel_experience, stay_preference, travel_social |
| Taste & Treat | 🍖 | 14 | food_allergies, food_motivation, favorite_protein, treat_preference, sensitive_stomach |
| Training & Behaviour | 🎓 | 10 | training_level, motivation_type, behavior_issues, leash_behavior |
| Long Horizon (Health) | 🌅 | 17 | health_conditions, vet_comfort, grooming_tolerance, vaccination_status, main_wish, celebration_preferences |

---

## DESIGN APPROACH (Suggestions)

### Option 1: Chapter-Based Journey
```
"Let Mira Get to Know [Pet Name]"

Chapter 1: "Who is [Pet]?" (Identity - 5 questions)
Chapter 2: "The Pack" (Family - 5 questions)
Chapter 3: "A Day in the Life" (Rhythm - 6 questions)
Chapter 4: "Home Sweet Home" (Comforts - 4 questions)
Chapter 5: "Adventure Awaits" (Travel - 4 questions)
Chapter 6: "Foodie Profile" (Taste - 5 questions)
Chapter 7: "The Learning Path" (Training - 4 questions)
Chapter 8: "Health & Dreams" (Long Horizon - 6 questions)
```

### Option 2: Conversational Flow
Mira asks questions one by one in her voice:
- "First things first - how would you describe [Pet]'s personality?"
- "And what about other furry friends - does [Pet] have siblings?"

### Option 3: Visual Cards (Swipe/Select)
Each question as a beautiful card with images:
- Swipe left/right for yes/no
- Tap cards for multiple choice
- Progress ring showing Soul % building in real-time

---

## KEY FILES TO READ

1. `/app/memory/MIRA_DOCTRINE.md` - Mira's voice & personality
2. `/app/memory/8_GOLDEN_PILLARS_SPEC.md` - All questions & scoring
3. `/app/memory/COMPLETE_QUESTIONS_LIST.md` - Full question bank
4. `/app/memory/GOLDEN_PRINCIPLES_UI_UX.md` - Design standards
5. `/app/backend/pet_soul_config.py` - Scoring implementation

---

## API ENDPOINTS (Already Working!)

```
# Save a single answer
POST /api/pet-soul/profile/{pet_id}/answer
Body: {"question_id": "food_allergies", "answer": "Chicken"}

# Save multiple answers
POST /api/pet-soul/profile/{pet_id}/answers/bulk
Body: {"answers": [{"question_id": "...", "answer": "..."}]}

# Get 8-pillar summary
GET /api/pet-soul/profile/{pet_id}/8-pillars

# Get quick questions
GET /api/pet-soul/profile/{pet_id}/quick-questions?limit=5
```

---

## REMEMBER

1. **Store Forever** - Every answer must be saved
2. **Soul Score = Trust** - Higher score = better Mira recommendations
3. **Never a Dead End** - If user skips, gracefully move on
4. **One Question at a Time** - Don't overwhelm
5. **Mira's Voice** - Warm, knowledgeable, never pushy

---

## TEST DATA

| Pet | ID | Current Score | Test With |
|-----|-----|---------------|-----------|
| Mojo | pet-99a708f1722a | 89% | High score |
| Lola | (login as dipali) | 63% | Active user |
| Lennu | pet-79d93864ca5d | 5% | Low score |

**Credentials:**
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304

---

## SESSION 10 FIXES (For Context)

Today we fixed:
1. Service Desk → Concierge sync (replies now reach customers)
2. 24/7 mode enabled (shows "Live now")
3. C° dock button → opens header Concierge panel
4. Pet avatar image alignment

---

**Preview URL:** https://pillar-parity-sprint.preview.emergentagent.com

*Handoff created: February 16, 2026*

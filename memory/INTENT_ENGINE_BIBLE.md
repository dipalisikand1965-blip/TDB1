# INTENT ENGINE BIBLE
## The Master Doctrine for Intent-Driven Dynamic Cards
### HARDCODED SPECIFICATION FOR ALL FUTURE AGENTS

**Last Updated:** February 2026
**Status:** CANONICAL - DO NOT DEVIATE

---

# CORE PHILOSOPHY

```
MIRA = THE BRAIN
  └─ Understands pet + context
  └─ Detects user intent
  └─ Generates recommendations

CONCIERGE = THE HANDS
  └─ Receives MIRA's instructions
  └─ Sources products (no catalogue)
  └─ Arranges services
  └─ Fulfills requests

PET FIRST DOCTRINE
  └─ Everything is for THAT pet
  └─ "{Pet} needs this" - always personalized
  └─ Never generic, always specific
```

---

# INTENT DETECTION SYSTEM

## How Intent Detection Works

```
User Message: "I want to house train Lola"
    ↓
1. KEYWORD MATCHING
   - "house train" → matches "house_training" keywords
   - Score = count of keyword matches
    ↓
2. INTENT SELECTION
   - Highest scoring intent wins
   - Minimum score: 1 keyword match
    ↓
3. RECOMMENDATION GENERATION
   - Lookup INTENT_RECOMMENDATIONS[intent]
   - Generate dynamic picks (Concierge-sourced)
   - Generate dynamic services (Concierge-arranged)
    ↓
4. PERSONALIZATION
   - Add pet name to all cards
   - Add breed-specific reasons
   - Set shelf title: "{Pet} needs this for {Intent}"
```

---

# INTENT CATEGORIES (CANONICAL LIST)

| Intent Key | Display Name | Keywords |
|------------|--------------|----------|
| `house_training` | House Training | house train, potty train, toilet train, pee, poop, accident, indoor training, housebreak |
| `obedience_training` | Obedience Training | obedience, sit, stay, come, heel, commands, basic training, listen |
| `behavior_training` | Behavior Training | behavior, aggression, biting, barking, jumping, pulling, reactive, fear |
| `grooming` | Grooming | groom, bath, haircut, nail, brush, mat, shed, fur, coat |
| `health_check` | Health Check | health, checkup, vet, sick, unwell, symptoms, check up |
| `dental` | Dental Care | dental, teeth, breath, plaque, gum, mouth |
| `travel` | Travel | travel, trip, vacation, flight, car ride, journey, relocate, moving |
| `food` | Food & Nutrition | food, eat, feed, diet, nutrition, meal, hungry |
| `diet` | Diet & Weight | weight, fat, overweight, slim, diet, calories, portion |
| `boarding` | Boarding & Sitting | boarding, pet hotel, sitter, daycare, leave, going away, vacation care |
| `walking` | Walking & Exercise | walk, exercise, run, hike, outdoor, leash |
| `birthday` | Birthday Celebration | birthday, celebrate, party, anniversary, gotcha day, adoption day |
| `anxiety` | Anxiety & Comfort | anxiety, scared, nervous, stress, thunder, fireworks, separation, afraid, panic |

---

# DYNAMIC PICKS SPECIFICATION

## What Are Dynamic Picks?

Dynamic picks are **Concierge-sourced products** that:
1. Are NOT from the product catalogue
2. Have NO fixed price (Concierge sources)
3. Are generated based on detected intent
4. Are personalized to the specific pet

## Pick Card Structure

```json
{
  "id": "intent-pick-house_training-pee-pads",
  "name": "Pee Pads",
  "display_name": "Pee Pads for Lola",
  "description": "Essential for indoor training",
  "reason": "Perfect for Malteses like Lola",
  "icon": "🐾",
  "category": "training",
  "type": "concierge_pick",
  "is_dynamic": true,
  "intent": "house_training",
  "intent_display": "House Training",
  "pet_name": "Lola",
  "price": null,
  "price_display": "Concierge will source",
  "cta": "Arrange for me",
  "badge": "For Lola",
  "source": "mira_intent_engine"
}
```

## Picks Per Intent

### house_training
- 🐾 Pee Pads - Essential for indoor training
- 🦴 Training Treats - Positive reinforcement rewards
- ✨ Enzymatic Cleaner - Eliminates accident odors
- 🏠 Crate or Playpen - Safe space for training
- 🔔 Bell for Door - Teaches to signal bathroom needs

### grooming
- 🧴 Breed-Specific Shampoo - Formulated for coat type
- 🪮 Slicker Brush - Removes tangles and loose fur
- ✂️ Nail Clippers - Safe at-home nail care
- 👂 Ear Cleaner - Prevents infections

### health_check
- 🩹 Pet First Aid Kit - Emergency essentials
- 🛡️ Flea & Tick Prevention - Monthly protection
- 🦷 Dental Chews - Daily oral health

### travel
- 🧳 Travel Carrier - Safe transport
- 💧 Portable Water Bottle - Hydration on the go
- 🩹 Travel First Aid Kit - Emergency supplies
- 🌿 Calming Treats - Reduces travel anxiety
- 🚗 Car Seat Cover - Vehicle protection

### birthday
- 🎂 Dog-Safe Birthday Cake - Safe celebration
- 🎀 Birthday Bandana - Festive photo op
- 🎁 Party Treats Box - Shareable goodies
- 🧸 Birthday Toy - Special day gift

### anxiety
- 🌿 Calming Treats - Natural stress relief
- 👕 Thunder Shirt - Gentle calming pressure
- 🕯️ Calming Diffuser - Pheromone therapy
- 🛏️ Anxiety Bed - Cozy secure space

---

# DYNAMIC SERVICES SPECIFICATION

## What Are Dynamic Services?

Dynamic services are **Concierge-arranged services** that:
1. Are NOT fixed-price services
2. Concierge coordinates and arranges
3. Are generated based on detected intent
4. Are personalized to the specific pet

## Service Card Structure

```json
{
  "id": "intent-service-house_training-dog-trainer",
  "name": "Dog Trainer",
  "display_name": "Dog Trainer for Lola",
  "description": "Professional house training guidance",
  "reason": "For Lola's house training",
  "icon": "🎓",
  "duration": "Per session",
  "type": "concierge_service",
  "is_dynamic": true,
  "intent": "house_training",
  "intent_display": "House Training",
  "pet_name": "Lola",
  "price": null,
  "price_display": "Concierge arranges",
  "cta": "Book for Lola",
  "badge": "Lola needs this",
  "source": "mira_intent_engine"
}
```

## Services Per Intent

### house_training
- 🎓 Dog Trainer - Professional guidance (Per session)
- 📚 Puppy School - Group classes (6-8 weeks)
- 🏡 Home Visit Training - Trainer at home (Per visit)

### grooming
- ✨ Full Grooming Session - Bath, haircut, nails (2-3 hours)
- 🛁 Bath & Brush - Quick refresh (1 hour)
- 🚐 Mobile Groomer - At your doorstep (Varies)

### health_check
- 🏥 Vet Checkup - Health assessment (30-60 min)
- 💉 Vaccination - Immunizations (15-30 min)
- 🔬 Blood Work Panel - Health insights (24-48h results)

### travel
- 🚕 Pet Taxi - Door-to-door transport (Per trip)
- ✈️ Airport Pickup/Drop - Airport transfers (Per trip)
- 📄 Pet Passport Service - Documentation (1-2 weeks)
- 🌍 Pet Relocation - Moving assistance (Varies)

### birthday
- 📸 Birthday Photoshoot - Capture memories (1 hour)
- 🎉 Pawty Planning - Full party setup (Event)
- 🎂 Custom Cake Order - Made for your pet (2-3 days)

---

# API SPECIFICATION

## Endpoint: POST /api/mira/intent-driven-cards

### Request
```json
{
  "message": "I want to house train Lola",
  "pet_name": "Lola",
  "pet_id": "pet-e6348b13c975",
  "pet_context": {
    "breed": "Maltese",
    "name": "Lola",
    "age": 3
  }
}
```

### Response
```json
{
  "success": true,
  "has_recommendations": true,
  "intent": "house_training",
  "intent_display": "House Training",
  "shelf_title": "Lola needs this for House Training",
  "picks": [...],
  "services": [...]
}
```

---

# SHELF DISPLAY RULES

## Shelf Title Format
```
"{Pet Name} needs this for {Intent Display}"
```

Examples:
- "Lola needs this for House Training"
- "Bruno needs this for Grooming"
- "Mystique needs this for Birthday Celebration"

## Badge Format
- Picks: "For {Pet Name}"
- Services: "{Pet Name} needs this"

## Reason Format (with breed)
```
"Perfect for {Breed}s like {Pet Name}"
```

Example: "Perfect for Malteses like Lola"

---

# INTEGRATION POINTS

## 1. Chat Response
When user sends message:
1. Detect intent from message
2. Generate dynamic cards
3. Include in response as `intent_driven` object
4. Frontend displays "{Pet} needs this" shelf

## 2. PICKS Panel
When user opens PICKS:
1. Check `user_learn_intents` for current intent
2. Generate dynamic picks for that intent
3. Display as top shelf: "{Pet} needs this for {Intent}"

## 3. SERVICES Panel
When user opens SERVICES:
1. Check `user_learn_intents` for current intent
2. Generate dynamic services for that intent
3. Display as top shelf: "{Pet} needs this for {Intent}"

## 4. Concierge Tab Sync
When user confirms "Send to Concierge":
1. Create `concierge_tasks` entry (admin)
2. Create `concierge_threads` entry (member) ← CRITICAL
3. Create `admin_notifications` entry
4. Request visible in BOTH admin AND member Concierge tabs

---

# CONCIERGE TAB SYNC DOCTRINE

## The Rule (NEVER VIOLATE)
```
Every request to Concierge MUST appear in BOTH:
1. Admin Service Desk (concierge_tasks)
2. Member Concierge Tab (concierge_threads)
```

## Implementation
```python
# When creating concierge request:
await db.concierge_tasks.insert_one(task_doc)      # Admin sees this
await db.concierge_threads.insert_one(thread_doc)  # Member sees this
await db.admin_notifications.insert_one(notif_doc) # Admin gets notified
```

## Why Both?
- Member expects to see their request in Concierge tab
- Admin expects to see request in Service Desk
- Without both, requests "disappear" from user's view

---

# FILE LOCATIONS

| File | Purpose |
|------|---------|
| `/app/backend/intent_driven_cards.py` | Core intent engine |
| `/app/backend/mira_routes.py` | API endpoints |
| `/app/backend/app/api/top_picks_routes.py` | PICKS integration |
| `/app/backend/services_routes.py` | SERVICES integration |
| `/app/memory/INTENT_ENGINE_BIBLE.md` | This documentation |

---

# ADDING NEW INTENTS

## Step 1: Add Keywords
```python
INTENT_KEYWORDS = {
    ...
    "new_intent": ["keyword1", "keyword2", "keyword3"],
}
```

## Step 2: Add Recommendations
```python
INTENT_RECOMMENDATIONS = {
    ...
    "new_intent": {
        "display_name": "New Intent Display",
        "picks": [
            {"name": "Product 1", "reason": "Why needed", "icon": "🐾", "category": "cat"},
            ...
        ],
        "services": [
            {"name": "Service 1", "reason": "Why needed", "icon": "🎯", "duration": "X hours"},
            ...
        ]
    }
}
```

## Step 3: Test
```bash
curl -X POST /api/mira/intent-driven-cards \
  -d '{"message": "keyword1 keyword2", "pet_name": "TestPet"}'
```

---

# GOLDEN RULES

1. **MIRA is the Brain** - Always generate recommendations based on understanding
2. **Concierge is the Hands** - Never show prices for dynamic cards
3. **Pet First** - Always personalize to "{Pet} needs this"
4. **Concierge Tab Sync** - ALWAYS create both task AND thread
5. **No Empty States** - Always show Concierge fallback if no catalogue match
6. **Intent Drives Content** - Chat intent flows to PICKS, SERVICES, LEARN

---

*This Bible is CANONICAL. All future agents MUST follow these specifications.*
*Any deviation requires explicit approval and Bible update.*

**Bible Version:** 1.0
**Last Updated:** February 2026

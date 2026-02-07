# 🚨 NEXT AGENT: READ THIS ENTIRE FILE BEFORE DOING ANYTHING

## THE USER HAS INVESTED 65+ DAYS INTO THIS PROJECT. DO NOT BREAK WHAT WORKS.

---

# PART 0: CRITICAL NEW FEATURES

## A. Concierge Can Do ANYTHING
- **Live Hours:** 6:30 AM to 11:30 PM
- **After Hours:** "We've noted your request, back at 6:30 AM"
- **NEVER** say "no products found" or "we can't help"
- **ALWAYS** offer a path forward

## B. IN-MIRA SERVICE REQUESTS (NEW!)
Service/Experience cards now **stay in Mira OS** instead of linking externally.

**The Flow:**
1. User clicks service card (e.g., Grooming)
2. → Opens modal **inside Mira** (not external page)
3. → User fills brief form (notes, date, urgency)
4. → Submits → Creates ticket via `/api/service_desk/attach_or_create_ticket`
5. → Admin notified via existing notification system
6. → Member sees confirmation in chat
7. → Soul Score increments (+1.5 points)

**Key Functions:**
- `openServiceRequest(service, isExperience)` - Opens modal
- `submitServiceRequest()` - Creates ticket
- `closeServiceRequest()` - Closes modal
- `isConciergeLive()` - Checks operating hours (6:30 AM - 11:30 PM)

---

# PART 1: WHAT IS MIRA?

**Mira is the World's First Pet Life Operating System.**

- **NOT** a chatbot
- **NOT** an e-commerce site  
- **NOT** a search engine

Mira is a **thinking layer** that sits between pet parents and the world. She:
1. **Understands** the situation (life-state + pet-state)
2. **Decides** what matters (safety, comfort, joy, effort)
3. **Either executes instantly OR hands to Concierge®**

```
USER: "I need grooming for Buddy"
         ↓
    MIRA (Brain)
         ↓
   ┌─────┴─────┐
   ↓           ↓
INSTANT    CONCIERGE
(Products,  (Human
Services,   handles
Experiences) everything)
```

---

# PART 2: WHAT WAS JUST BUILT (DO NOT REDO THIS)

## ✅ Products Integration
- 2,151 products in database
- Shows when Mira's AI decides it's relevant
- "Why for {Pet}" personalized reasons
- "Recommended for Buddy" header

## ✅ Services Integration  
- 6 service categories: Grooming, Walks, Training, Vet, Boarding, Photography
- Service cards link to wizards on main site
- Shows when service intent detected

## ✅ Experiences Integration
- 7 experience types: Party Planning, Chef's Table, Home Dining, Meal Subscription, Pawcation, Multi-Pet Travel, Travel Planning
- Premium gradient cards with "EXPERIENCE" badge
- Links to wizard pages on thedoggycompany.in

## ✅ Voice Integration
- ElevenLabs "Elise" voice for Mira speaking
- Volume toggle button in input area
- Voice INPUT (mic) for speech-to-text

## ✅ Two-Way Conversation
- Users can reply and continue conversations
- Removed restrictive `isProductOptIn` gate
- Concierge is subtle (only shows when relevant)

## ✅ Soul Score System
- Dynamic score that grows with interactions
- Displayed as "87% SOUL KNOWN" badge
- Capped at 100%

---

# PART 3: THE 14 PILLARS + 7 SERVICES

## 14 PILLARS (Life Moments)
| Pillar | Emoji | URL |
|--------|-------|-----|
| Celebrate | 🎂 | /celebrate |
| Dine | 🍽️ | /dine |
| Stay | 🏨 | /stay |
| Travel | ✈️ | /travel |
| Care | 💊 | /care |
| Enjoy | 🎾 | /enjoy |
| Fit | 🏃 | /fit |
| Learn | 🎓 | /learn |
| Paperwork | 📄 | /paperwork |
| Advisory | 📋 | /advisory |
| Emergency | 🚨 | /emergency |
| Farewell | 🌈 | /farewell |
| Adopt | 🐾 | /adopt |
| Shop | 🛒 | /shop |

## 7 SERVICES
| Service | Emoji |
|---------|-------|
| Grooming | ✂️ |
| Training | 🎓 |
| Boarding | 🏠 |
| Daycare | 🌞 |
| Vet Care | 🏥 |
| Dog Walking | 🐕 |
| Pet Photography | 📸 |

---

# PART 4: KEY FILES (MEMORIZE THESE)

```
DEMO PAGE (what we built):
/app/frontend/src/pages/MiraDemoPage.jsx    # 2500+ lines - THE MAIN FILE
/app/frontend/src/styles/mira-prod.css       # 2100+ lines - ALL STYLING

MAIN SITE (DO NOT TOUCH):
/app/frontend/src/components/MiraAI.jsx      # Main site widget
/app/frontend/src/components/MiraWidget.jsx  # Universal search bar

BACKEND:
/app/backend/mira_routes.py                  # Core API (8700+ lines)
/app/backend/tts_routes.py                   # Voice (ElevenLabs)
/app/backend/mira_voice.py                   # Voice endpoint

MEMORY (READ THESE):
/app/memory/MIRA_DOCTRINE.md                 # THE BIBLE - Complete guide
/app/memory/PRD.md                           # Product requirements
/app/memory/START_HERE_NEXT_AGENT.md         # This file
```

---

# PART 5: CREDENTIALS

```
Customer Login:
- Email: dipali@clubconcierge.in
- Password: test123

Admin Login:
- Username: aditya
- Password: lola4304

Database: test_database

Main Site: https://thedoggycompany.in
Demo Page: https://thedoggycompany.in/mira-demo
```

---

# PART 6: API ENDPOINTS

| Endpoint | Method | What It Does |
|----------|--------|--------------|
| `/api/mira/os/understand-with-products` | POST | Main Mira chat - returns products, intent, concierge suggestion |
| `/api/mira/user-pets` | GET | Get all pets for logged-in user |
| `/api/mira/voice/speak` | POST | ElevenLabs TTS |
| `/api/tts/generate` | POST | Alternative TTS endpoint |
| `/api/services?limit=5` | GET | Get services from database |
| `/api/products?limit=5` | GET | Get products from database |

---

# PART 7: HOW MIRA RESPONDS

When a user asks something, Mira:

1. **Understands intent** via LLM
2. **Checks pet profile** (breed, allergies, preferences)
3. **Returns structured response**:
   - `message` - Mira's text response
   - `products[]` - Array of recommended products
   - `tips[]` - "Important to Watch For" warnings
   - `suggest_concierge` - Boolean
   - `concierge_framing` - Custom concierge message
   - `execution_type` - "INSTANT" or "CONCIERGE"

4. **Frontend adds**:
   - `detectedServices[]` - Based on keywords
   - `detectedExperiences[]` - Based on keywords

---

# PART 8: WHAT TO DO IF USER REPORTS ISSUES

## "Products not showing"
→ Check `shouldShowProducts` logic in MiraDemoPage.jsx (~line 1640)
→ API returns products but frontend may be blocking

## "Concierge showing everywhere"
→ Check `shouldSuggestConcierge` logic (~line 1650)
→ Should only show when `suggest_concierge: true` OR service/experience detected

## "Voice not working"
→ Check `/api/tts/generate` endpoint
→ Check `voiceEnabled` state in MiraDemoPage.jsx
→ ElevenLabs API key is in `/app/backend/.env`

## "Services/Experiences not showing"
→ Check `SERVICE_CATEGORIES` and `EXPERIENCE_CATEGORIES` in MiraDemoPage.jsx
→ Check keyword matching in `detectServiceIntent` and `detectExperienceIntent`

---

# PART 9: WHAT USER WANTS NEXT

## Priority 1: Verification
- Push to GitHub
- Test on production site (thedoggycompany.in/mira-demo)
- Verify iOS and Android work

## Priority 2: More Experiences
- Add experiences as user builds more wizards on main site
- Each pillar can have multiple experiences

## Priority 3: Proactive Mira
- Birthday reminders
- Vaccination alerts
- Time-of-day awareness ("Good morning Buddy!")

## Priority 4: MasterSync
- User mentioned syncing from admin panel
- May need to investigate what MasterSync does

---

# PART 10: THINGS TO NEVER DO

1. **NEVER** touch the main site components (MiraAI.jsx, MiraWidget.jsx) unless user explicitly asks
2. **NEVER** remove the service/experience detection logic
3. **NEVER** add `isProductOptIn` gate back - it was blocking products
4. **NEVER** show Concierge on every message - it should be subtle
5. **NEVER** start over - build on what exists
6. **NEVER** say "I can't help" - there's always a next step

---

# PART 11: THE USER'S WORDS (REMEMBER THIS)

> "I started with 5000 credits and I am 65 days into this"
> "I am so scared"
> "Please tell next agent what to do"
> "I love you" (when we built the service + experience cards)

**This user has invested EVERYTHING. Treat this project with respect.**

---

# PART 12: QUICK TEST COMMANDS

```bash
# Test backend health
curl https://mira-care-hub.preview.emergentagent.com/api/health

# Test Mira chat
curl -X POST https://mira-care-hub.preview.emergentagent.com/api/mira/os/understand-with-products \
  -H "Content-Type: application/json" \
  -d '{"input": "treats for Buddy", "pet_context": {"name": "Buddy", "breed": "Golden Retriever"}, "include_products": true}'

# Test TTS
curl -X POST https://mira-care-hub.preview.emergentagent.com/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, I am Mira"}'
```

---

# PART 13: DATABASE COLLECTIONS

| Collection | Count | Purpose |
|------------|-------|---------|
| products | 2,151 | Product catalog |
| services | 2,406 | Service offerings |
| breed_catalogue | 64 | Breed information |
| pets | 58 | User pets with soul data |
| users | 50 | User accounts |

---

# PART 14: CURRENT STATUS

**Progress: 95%**

✅ Soul Score (dynamic, grows)
✅ Products (2,151 with personalization)
✅ Services (6 categories with wizard links)
✅ Experiences (7 types with premium cards)
✅ Voice Input (mic)
✅ Voice Output (ElevenLabs)
✅ Two-way conversation
✅ Concierge handoff (subtle)
✅ Mobile responsive

⬜ Proactive Mira (birthday reminders)
⬜ More experiences per pillar
⬜ MasterSync from admin

---

# FINAL MESSAGE TO NEXT AGENT

You are building the **World's First Pet Operating System**.

Not a chatbot. Not an app. An **operating system** for pet life.

Your job: **Continue the mission. Don't start over. Don't break what works.**

The intelligence is there. The soul is there. The user trusts you.

🐕 **For every pet. For every pet parent. Across every moment of life.**

---

*Read /app/memory/MIRA_DOCTRINE.md for the complete philosophy.*
*Read /app/memory/PRD.md for the product requirements.*

**NOW GO MAKE MIRA EVEN BETTER.**

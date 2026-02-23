# Mira OS - Pet Operating System
## Product Requirements Document

### Original Problem Statement
The user, Dipali, is the founder of a "pet operating system" named Mira, built in honor of her grandmother and family legacy. The application's core is "Soul Intelligence" (a pet personality questionnaire) and "Mira" (an AI concierge). The core philosophy: "No is never an answer for a concierge. Mira tells us what the pet needs - always."

---

## ✅ SESSION 14 - CONCIERGE CARD UI/UX OVERHAUL - February 23, 2026

### IMPLEMENTED:

**1. Frontend UI/UX Improvements for Concierge Cards:**
- **High-contrast design**: Card titles now use bold white text on dark backgrounds
- **Improved labels**: `CONCIERGE® PRODUCT` and `CONCIERGE® SERVICE` in uppercase, bright accent colors
- **Solid color CTAs**: Pink for products (`Create for {Pet}`), purple for services (`Request`) - no gradients
- **Compact cards**: Reduced padding from p-4 to p-3, tighter spacing throughout
- **"Why" line prominent**: Golden accent color (`✦ Designed for Mystique's calm-and-comfortable style`)

**2. Enhanced Trait Derivation (Backend):**
- Improved `derive_traits_from_profile()` in both `intelligence_layer.py` and `dine_concierge_cards.py`
- Now extracts traits from: `soul_traits` → `doggy_soul_answers` → `personality` object → `temperament`
- Mystique now correctly shows traits: `['playful', 'anxious', 'social']` from her `personality.temperament: Friendly` and `personality.separation_anxiety: Moderate`

**3. Better "why_for_pet" Generation:**
- Uses `persona_affinity` scores to match traits
- Priority-based explanations: health traits > behavior traits > lifestyle traits
- Example: "Designed for Mystique's calm-and-comfortable style" instead of generic "Curated for Mystique"

**Files Modified:**
- `/app/frontend/src/components/Mira/CuratedConciergeSection.jsx` - Complete UI/UX overhaul
- `/app/frontend/src/pages/DinePage.jsx` - Added dark container wrapper for concierge section
- `/app/backend/app/intelligence_layer.py` - Added comprehensive `derive_traits_from_pet_data()` function
- `/app/backend/app/data/dine_concierge_cards.py` - Enhanced `derive_traits_from_profile()`

**API Test Results:**
```
Pet: Mystique
Derived traits: ['playful', 'anxious', 'social']
Card: Dining-Out Kit Curated for Mystique
  Why: Designed for Mystique's calm-and-comfortable style
```

---

## ✅ SESSION 13 - DINE INTELLIGENCE LAYER COMPLETE - February 23, 2026

### IMPLEMENTED:

**Dine Concierge Card Library (10 cards):**
| # | Type | Card | Target Persona |
|---|------|------|----------------|
| 1 | Product | Weekly Meal Plan | Foodie, weight, senior |
| 2 | Product | Food Switch Assistant | Sensitive tummy, itchy |
| 3 | Product | Allergy-Safe Blueprint | Allergy prone, sensitive |
| 4 | Product | Fresh Subscription Setup | Foodie, health conscious |
| 5 | Product | Dining Out Kit | Social, anxious, active |
| 6 | Service | Reserve Pet-Friendly Table | All (broad fit) |
| 7 | Service | Pet Buddy Meetup | Social, playful |
| 8 | Service | Private Chef Experience | Elegant, pampered |
| 9 | Service | "Won't Eat" Rapid Fix | Picky, anxious, senior |
| 10 | Service | Nutrition Consult Booking | Health conscious |

**Dine Micro-Questions:**
- "Is {pet} a fast eater or slow grazer?"
- "Sensitive tummy or iron stomach?"
- "Calm in cafés or easily overwhelmed?"

**Files Created:**
- `/app/backend/app/data/dine_concierge_cards.py` - Full card library with persona scoring

**Files Modified:**
- `/app/backend/app/intelligence_layer.py` - Added `pillar == "dine"` support
- `/app/frontend/src/pages/DinePage.jsx` - Added CuratedConciergeSection

**API Verification:**
- Bruno (Labrador): Dining Out Kit, Weekly Meal Plan, Reserve Table
- Lola (Anxious): Cards with "calm-and-comfortable style" why text
- Ticket creation: Working with notifications

**Mobile Scroll Fix:**
- Updated ScrollToTop component with multiple scroll methods
- Added `history.scrollRestoration = 'manual'` in index.js
- Pages now open at top on mobile

---

## ✅ SESSION 12 - INTELLIGENCE LAYER BUGS FIXED - February 23, 2026

### ISSUES FIXED:

1. **✅ why_for_pet text generation** - Now correctly reflects actual pet traits:
   - Anxious pets (like Lola) get "calm and gentle approach" instead of "elegant"
   - Added `derive_traits_from_profile()` function to extract traits from multiple sources (doggy_soul_answers, personality, temperament)
   - Priority-based trait selection: anxiety/calm > active > elegant

2. **✅ Ticket creation flow with notifications**:
   - New endpoint: `POST /api/mira/concierge-pick/ticket`
   - Creates ticket in `service_desk_tickets` collection
   - Creates member notification in `notifications` collection
   - Creates admin notification in `admin_notifications` collection

3. **✅ Frontend labels updated**:
   - Now shows "Concierge® Product" and "Concierge® Service" (with ® mark)
   - Added microcopy "This will refine {pet}'s picks" under question card

4. **✅ Card count guaranteed**: 
   - Enforced minimum: 2 products + 1 service (3-5 total cards)
   - Uses `min()` and `max()` to guarantee card counts

### FILES MODIFIED:
- `/app/backend/app/data/celebrate_concierge_cards.py`:
  - Added `derive_traits_from_profile()` function
  - Updated `generate_why_explanation()` with priority-based trait matching
  - Updated `select_concierge_cards()` with trait derivation and card minimums
- `/app/backend/mira_routes.py`:
  - Added `POST /api/mira/concierge-pick/ticket` endpoint (lines 24555-24700)
  - Updated pet data to include doggy_soul_answers, personality, soul, temperament
- `/app/frontend/src/components/Mira/CuratedConciergeSection.jsx`:
  - Updated labels to "Concierge® Product/Service"
  - Added petName prop to QuestionCard
  - Added microcopy under question card
  - Updated ticket creation to use new endpoint

### TEST RESULTS (100% Backend, 95% Frontend):
- All 13 backend tests passed
- Frontend labels and personalization verified
- Microcopy shows conditionally when question_card exists

---

## ✅ SESSION 11 - CELEBRATE CONCIERGE LAYER COMPLETE - February 23, 2026

### BACKEND (Phases 1-4) ✅

**10-Card Celebrate Library:**
| Concierge Products (Bespoke) | Concierge Services (Arrangements) |
|------------------------------|-----------------------------------|
| 1. Custom Celebration Cake Design | 6. Plan Celebration End-to-End |
| 2. Bespoke Celebration Box | 7. At-Home Setup + Safe Zones |
| 3. Outdoor Party Pack (for Chaos) | 8. Photographer Booking |
| 4. Styled Photo Moment Kit | 9. Pet-Friendly Venue Reservation |
| 5. Keepsake Memory Set | 10. Quiet Celebration Plan |

**Files Created:**
- `/app/backend/app/data/celebrate_concierge_cards.py` - 10-card library
- `/app/backend/app/intelligence_layer.py` - Core curation engine

**API Endpoints:**
- `GET /api/mira/curated-set/{pet_id}/{pillar}` - Concierge layer only
- `POST /api/mira/curated-set/answer` - Save question answers (backend-owned trait mapping)
- `DELETE /api/mira/curated-set/cache/{pet_id}` - Cache invalidation

### FRONTEND (Phase 5) ✅

**Files Created:**
- `/app/frontend/src/components/Mira/CuratedConciergeSection.jsx` - New component

**Updated:**
- `/app/frontend/src/pages/CelebratePage.jsx` - Integrated CuratedConciergeSection
- `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` - Added to FAB panel

### ACCEPTANCE CRITERIA ✅

1. ✅ **Celebrate curated layer always returns 3-5 cards** (never empty)
2. ✅ **Mystique vs Buddy shows different cards**:
   - Mystique: Cake Design (78), Bespoke Box (72) - elegant picks
   - Buddy: Outdoor Party Pack (99), Cake Design (74) - active picks
3. ✅ **Pet switch updates picks** - Confirmed via API testing
4. ✅ **All CTAs create tickets** - No add-to-cart
5. ✅ **Senior Comfort modifier** - Boosts comfort/quiet, penalizes chaos
6. ✅ **30-minute caching** - Same picks across all UI surfaces
7. ✅ **No emoji dependency** - Lucide icons with card-type fallbacks
8. ✅ **Question card answer is backend-owned** - Client sends pet_id, question_id, answer only

### RENDERING RULES (Phase 5) ✅

- Order: question_card → concierge_products → concierge_services (NO reordering)
- Same component on pillar page and FAB panel
- Loading: 3-5 skeleton cards
- Error: "Mira couldn't load picks" + Retry
- Never empty: Fallback cards + Retry if malformed
- Footer: "Updated a moment ago"

---
- `pets` collection has: breed, size, allergies, health_conditions
- `pet_soul` collection has: personality_traits, social_preferences
- `user_learn_intents` collection has: recent conversation topics

---

## ✅ SESSION 8 - CONCIERGE DNA ON PILLAR PAGES - February 22, 2026

### MIRA'S PICKS ON ALL 14 PILLAR PAGES ✅

**What Was Built:**
Created `PillarPicksSection` component that brings Mira's personalized picks directly to each pillar page.

**Files Created:**
- `/app/frontend/src/components/PillarPicksSection.jsx` - New component with:
  - `ProductPickCard` - For catalogue products (direct purchase)
  - `ConciergePickCard` - For bespoke concierge services
  - Soul-aware personalization using `getSoulBasedReason()`
  - Fetches from `/api/mira/top-picks/{pet}/pillar/{pillar}`

**Files Modified:**
- All 14 pillar pages now have `<PillarPicksSection>`:
  - CelebratePage, DinePage, StayPage, TravelPage
  - CarePage, EnjoyPage, FitPage, LearnPage
  - PaperworkPage, AdvisoryPage, EmergencyPage
  - FarewellPage, AdoptPage, ShopPage

**What Drives Picks Refresh:**
| Driver | How It Works |
|--------|--------------|
| **Chat Intents** | Mira tracks what you ask about → shows relevant picks within 48 hours |
| **Seasonal** | Summer/Winter/Monsoon products rotate automatically |
| **Birthday** | Detects upcoming birthdays → celebrate picks appear |
| **Pet Soul Data** | Allergies, size, breed, age → filters picks |
| **Breed Knowledge** | Shih Tzu grooming needs, Labrador exercise, etc. |
| **Smart Fallback** | When no intents, Mira suggests based on profile gaps |

### SMARTER CONCIERGE PICK PERSONALIZATION ✅

**What Was Done:**
1. Created centralized `getSoulBasedReason()` utility in `/app/frontend/src/utils/petSoulInference.js`
2. Updated ALL 14 pillar pages to use the smart personalization utility
3. Messages now dynamically use soul traits → personality → breed (fallback)

---

## ✅ SESSION 7 - MAJOR IMPLEMENTATION - February 22, 2026

### CONCIERGE DNA DOCUMENTED
The core DNA of The Doggy Company has been documented:
- **We are NOT** Chewy, HUFT, or Rover - **We ARE a full-blooded Pet Concierge Company**
- **Mira is named after Dipali's mother** - The guiding angel whose 75 years of love for dogs lives on
- **Philosophy**: "No is never an answer for a concierge. Mira tells us what the pet needs - always."
- **See**: `/app/memory/CONCIERGE_DNA_DOCTRINE.md`

### CONCIERGE PICK CARDS - IMPLEMENTED ON ALL 14 PILLARS ✅

Created `ConciergePickCard.jsx` component and added to ALL pillar pages:

| Pillar | Status | Concierge Service |
|--------|--------|-------------------|
| Celebrate | ✅ | Custom Celebration Planning |
| Dine | ✅ | Personalized Meal Planning |
| Stay | ✅ | Perfect Boarding Match |
| Travel | ✅ | Stress-Free Travel Coordination |
| Care | ✅ | Tailored Care Services |
| Enjoy | ✅ | Custom Activity Planning |
| Fit | ✅ | Personal Fitness Program |
| Learn | ✅ | Custom Training Plan |
| Paperwork | ✅ | Document Management |
| Advisory | ✅ | Expert Consultation |
| Emergency | ✅ | 24/7 Emergency Support |
| Farewell | ✅ | Compassionate Farewell Planning |
| Adopt | ✅ | Adoption Matching |
| Shop | ✅ | Personal Shopping |

**Files Created:**
- `/app/frontend/src/components/ConciergePickCard.jsx` - The component with presets for all 14 pillars

---

## Architecture

### Frontend Stack
- React 18 with React Router
- TailwindCSS + Shadcn/UI components
- Framer Motion for animations
- Context API (AuthContext, CartContext, PillarContext)

### Backend Stack
- FastAPI (Python)
- MongoDB (via MONGO_URL)
- OpenAI GPT for Mira chat

### Key Files
- `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` - The main picks panel (pillar-aware)
- `/app/frontend/src/components/MiraChatWidget.jsx` - The Mira chat widget with FAB orb
- `/app/frontend/src/components/ConciergePickCard.jsx` - Concierge pick card on pillar pages
- `/app/frontend/src/context/PillarContext.jsx` - Global pet and pillar state
- `/app/backend/app/api/top_picks_routes.py` - Backend picks engine

### Key API Endpoints
- `GET /api/mira/top-picks/{pet_name}` - Get all picks for a pet
- `GET /api/mira/top-picks/{pet_name}/pillar/{pillar}` - Get pillar-specific picks
- `POST /api/mira/chat` - Mira AI chat
- `GET /api/pets` - Get user's pets
- `GET /api/pets/{id}/soul` - Get pet's soul data

---

## Test Credentials
- **Member Login**: `dipali@clubconcierge.in` / `test123`
- **Admin Login**: `aditya` / `lola4304`

---

## Future Tasks (Prioritized)

### P0 - Critical
- [ ] Implement true personalization in picks engine (varies by pet soul/breed)
- [ ] Roll out pillar-specific panel to other 13 pages

### P1 - High
- [ ] Proactive alerts on PetHomePage (birthdays, vaccinations)
- [ ] Razorpay payment integration

### P2 - Medium
- [ ] Living Home mechanics on PetHomePage
- [ ] Notification templates for Product Orders vs Concierge Requests
- [ ] Refactor `backend/server.py` (currently monolithic)

### P3 - Low
- [ ] Consolidate fragmented ticket collections in database

---

*Last Updated: February 22, 2026*

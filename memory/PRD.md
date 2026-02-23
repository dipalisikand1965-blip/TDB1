# Mira OS - Pet Operating System
## Product Requirements Document

### Original Problem Statement
The user, Dipali, is the founder of a "pet operating system" named Mira, built in honor of her grandmother and family legacy. The application's core is "Soul Intelligence" (a pet personality questionnaire) and "Mira" (an AI concierge). The core philosophy: "No is never an answer for a concierge. Mira tells us what the pet needs - always."

---

## ✅ SESSION 10 - INTELLIGENCE LAYER (Phase 1-4) - February 23, 2026

### UI FIXES COMPLETED ✅

**1. Chat Scrolling Under Header** - Fixed CSS with solid background and proper z-index
**2. Soul Score** - Now showing correctly (87% for Mystique)
**3. PetHomePage Main Navbar** - Added site navigation for pillar access
**4. MiraDemoPage Footer** - Added footer component

### INTELLIGENCE LAYER BACKEND COMPLETE ✅

Built the full Intelligence Layer for dynamic, personalized picks:

**New Files Created:**
- `/app/backend/app/intelligence_layer.py` - Core curation engine
- Updated `/app/backend/app/data/service_cards.py` - Celebrate services library

**API Endpoints Added:**
- `GET /api/mira/curated-set/{pet_id}/{pillar}` - Main curated picks endpoint
- `POST /api/mira/curated-set/answer` - Save thin-profile question answers
- `DELETE /api/mira/curated-set/cache/{pet_id}` - Cache invalidation

**Features Implemented:**
1. **Safety First - Allergy Filtering**: Products with pet's known allergens are filtered BEFORE any other logic
2. **Soul-Based Scoring**: Products and services scored by soul trait affinity
3. **Breed/Size Matching**: Recommendations adjusted for pet characteristics
4. **Event Proximity**: Birthday/gotcha day detection for timely recommendations
5. **30-Minute Caching**: Dynamic but synced - same picks across all UI surfaces
6. **Thin Profile Questions**: Micro-question cards when pet data is sparse

**Example Response for Mystique (Shih Tzu, allergic to chicken):**
```json
{
  "catalogue_picks": [{"name": "Classic Birthday Cake", "why_for_pet": "Curated for Mystique"}],
  "concierge_picks": [
    {"name": "Quiet Celebration Plan", "score": 80.5, "_why": "Matched: warms_up_slowly"},
    {"name": "Playdate Party", "score": 62.5},
    {"name": "Custom Cake Design", "score": 59.0}
  ],
  "question_card": null,
  "meta": {
    "personalization_summary": "Personalized by soul traits: Protective, warms_up_slowly, Friendly; breed: Shih Tzu; size: small; allergies filtered: chicken",
    "cache_expires_at": "30 minutes from generation"
  }
}
```

---

## 🔴 NEXT: FRONTEND INTEGRATION (Phase 5)

### What Needs to Happen:
Update `/celebrate` page and components to call the new `/api/mira/curated-set` endpoint:

1. **PersonalizedPicksPanel.jsx** - Fetch from new endpoint
2. **ConciergePickCard.jsx** - Render catalogue_picks and concierge_picks
3. **Question Card UI** - New component for thin-profile questions

---
        if pet.allergies and pick.contains_allergen(pet.allergies):
            score = -100  # Exclude
            
        scored_picks.append((pick, score))
    
    return sorted(scored_picks, key=lambda x: x[1], reverse=True)[:5]
```

**2. Frontend Changes:**
- Picks already render dynamically from API response
- Just need backend to return different picks per pet

**3. Database Schema (existing):**
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

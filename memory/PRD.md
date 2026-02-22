# Mira OS - Pet Operating System
## Product Requirements Document

### Original Problem Statement
The user, Dipali, is the founder of a "pet operating system" named Mira, built in honor of her grandmother and family legacy. The application's core is "Soul Intelligence" (a pet personality questionnaire) and "Mira" (an AI concierge). The core philosophy: "No is never an answer for a concierge. Mira tells us what the pet needs - always."

---

## ✅ SESSION 9 - PILLAR-SPECIFIC PICKS PANEL - February 22, 2026

### FAB MODAL NOW PILLAR-AWARE ✅

**The Problem:**
When on `/celebrate` page and clicking "Ask Mira" FAB or "Mystique's Picks", the panel showed ALL pillar tabs (Dine, Care, Travel, Stay, Enjoy, etc.) - confusing users who were already in celebrate context.

**The Solution:**
Modified `PersonalizedPicksPanel.jsx` to accept a `pillar` prop that LOCKS the panel to show only that pillar.

**How It Works:**
```jsx
// PersonalizedPicksPanel.jsx
const PersonalizedPicksPanel = ({ pillar = null, ...props }) => {
  const isPillarLocked = Boolean(pillar);
  const displayPillars = isPillarLocked 
    ? PILLARS.filter(p => p.id === pillar)  // Show only locked pillar
    : PILLARS;                               // Show all pillars
}
```

**Files Modified:**
- `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` - Added `pillar` prop, `isPillarLocked`, `displayPillars` logic
- `/app/frontend/src/components/MiraChatWidget.jsx` - Passes `pillar` prop to lock panel
- `/app/frontend/src/pages/CelebratePage.jsx` - Uses `usePillarContext()` for pet sync

### CONCIERGE PICK CARD WITH FULL PICKS ✅

**What Changed:**
The Concierge Pick card on `/celebrate` now shows:
1. Title: "Mira's Picks for {Pet}" (pet-first)
2. Full pick cards with icon, name, description
3. "Concierge creates" label
4. "Create for {Pet}" button
5. Dynamic picks from API (not hardcoded)

**Files Modified:**
- `/app/frontend/src/components/ConciergePickCard.jsx`

### PET SWITCHING NOW SYNCED ✅

**The Problem:**
When switching pets via navbar dropdown, the Concierge card still showed the old pet name.

**The Solution:**
Changed `CelebratePage.jsx` to use `usePillarContext()` instead of local state:
```jsx
const { currentPet } = usePillarContext();
const activePet = currentPet; // Syncs with global pet selector
```

---

## 🔴 NEXT: THE INTELLIGENCE LAYER

### What's Currently Happening:
Picks are fetched from `/api/mira/top-picks/{pet}` but the returned picks are still somewhat generic - the same "Custom allergy-safe birthday cake" shows for ALL pets.

### What SHOULD Happen:
Picks must be TRULY personalized based on the pet's unique profile:

| Data Source | Example for Mystique (Shih Tzu) | Example for Buddy (Golden Retriever) |
|-------------|--------------------------------|-------------------------------------|
| **Soul Traits** | "warms up slowly to new people" → Intimate party | "playful, energetic" → Big bash |
| **Breed** | Small dog → Indoor venues | Large dog → Outdoor/park venues |
| **Health** | Sensitive stomach → Special diet cake | No restrictions → Any treats |
| **Conversation** | Asked about grooming → Show grooming picks | Asked about hiking → Show adventure picks |

### Implementation Plan:

**1. Backend Changes (`top_picks_routes.py`):**
```python
def get_personalized_picks(pet_id, pillar):
    pet = get_pet(pet_id)
    soul = get_soul_data(pet_id)
    
    # Score each pick based on pet profile
    scored_picks = []
    for pick in CONCIERGE_SUGGESTIONS[pillar]:
        score = 0
        
        # Soul trait matching
        if 'anxious' in soul.traits and pick.is_calm_option:
            score += 10
        if 'energetic' in soul.traits and pick.is_active_option:
            score += 10
            
        # Breed matching
        if pet.size == 'small' and pick.suitable_for_small:
            score += 5
            
        # Allergy filtering
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

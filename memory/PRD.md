# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. Core vision: "vision-first, commerce-later" approach, centered around "Pet Soul™" and "Mira® AI" concierge.

---

## Session 8 Completed Work (January 25, 2026)

### 1. BLANK HEALTH TAB BUG FIX ✅ (P1)
- Created `UnifiedPetPage.jsx` for `/pet/:petId?tab=xxx` routes
- All tabs working: Overview, Pet Soul, Health, Vaccines, Services, Pet Pass

### 2. SERVER-SIDE PET SOUL SCORE SYSTEM ✅ (P0)
Created `/app/backend/pet_score_logic.py`:
- Weighted question configuration (100 points across 6 categories)
- 4-tier system: Newcomer → Soul Seeker → Soul Explorer → Soul Master
- APIs: `/score_state`, `/quick-questions`, `/tiers`, `/config`, `/recalculate`

### 3. GAMIFICATION SYSTEM ✅ (NEW)
Created `/app/frontend/src/components/PetAchievements.jsx`:
- **13 achievements** across categories: Tier, Category, Streak, Special
- **Confetti celebrations** with `canvas-confetti` library
- **Achievement badges** with lock/unlock states
- **useAchievements hook** for automatic unlock detection

### 4. UNIVERSAL PET AVATAR INTEGRATION ✅ (P1)
Updated components to use `getPetPhotoUrl()`:
- ✅ MemberDashboard.jsx (3 places)
- ✅ Checkout.jsx (pet selector)
- ✅ Admin.jsx (4 places: pet table, profile modal, member details, health vault)
- ✅ UnifiedPetPage.jsx
- ✅ Navbar, MiraAI, PetPassCard (previous session)

### 5. SERVICE DESK CUSTOMER NAME FIX ✅ (P2)
Updated `/app/backend/ticket_routes.py`:
- Fixed fallback logic for "Website Visitor" names
- Added email prefix extraction as name fallback
- Improved contact field propagation

Updated `/app/backend/mira_routes.py`:
- Enhanced phone pattern matching
- Added "name:" prefix pattern
- Email prefix name extraction
- More robust name filtering

---

## Achievements System

| Achievement | Points | Type | Trigger |
|-------------|--------|------|---------|
| First Steps | 10 | Milestone | First answer |
| Soul Seeker | 50 | Tier | Reach 25% |
| Soul Explorer | 100 | Tier | Reach 50% |
| Soul Master | 200 | Tier | Reach 75% |
| Pet Soul Complete | 500 | Tier | Reach 100% |
| Safety First | 75 | Category | 100% safety |
| Personality Pro | 75 | Category | 100% personality |
| Lifestyle Guru | 60 | Category | 100% lifestyle |
| Nutrition Ninja | 40 | Category | 100% nutrition |
| Training Expert | 30 | Category | 100% training |
| Getting Started | 25 | Streak | 3-day streak |
| On Fire | 50 | Streak | 7-day streak |
| Picture Perfect | 20 | Special | Photo uploaded |
| Allergy Aware | 30 | Special | Allergy info added |

---

## Key Files Updated This Session

| File | Changes |
|------|---------|
| `/backend/pet_score_logic.py` | NEW - Server-side scoring |
| `/backend/ticket_routes.py` | Customer name fallback fix |
| `/backend/mira_routes.py` | Enhanced contact extraction |
| `/frontend/src/components/PetAchievements.jsx` | NEW - Gamification |
| `/frontend/src/utils/petScore.js` | NEW - Score hook |
| `/frontend/src/components/PetScoreCard.jsx` | NEW - Tier-aware display |
| `/frontend/src/pages/UnifiedPetPage.jsx` | Tab-based pet view |
| `/frontend/src/pages/MemberDashboard.jsx` | Universal avatar |
| `/frontend/src/pages/Checkout.jsx` | Universal avatar |
| `/frontend/src/pages/Admin.jsx` | Universal avatar (4 places) |

---

## Prioritized Backlog

### P0 - Critical (All Completed ✅)
- ~~Session Persistence~~ ✅
- ~~Blank Health Tab Bug~~ ✅
- ~~Server-Side Pet Soul Score~~ ✅

### P1 - High Priority (Completed)
- ~~Universal Pet Avatar Integration~~ ✅
- ~~Gamification (Achievements, Confetti)~~ ✅
- ~~Service Desk Customer Name Fix~~ ✅

### P2 - Medium Priority (Pending User Bug List)
1. "Untitled" Products from Shopify Sync (recurring)
2. Mobile Cart View redesign
3. Additional bugs from user's list

### P3 - Future
- Build remaining pillar pages (Adopt, Farewell, etc.)
- Paw Rewards ledger system
- Mira Conversation History storage

---

## Test Credentials
- **Test User**: dipali@clubconcierge.in / lola4304
- **Admin**: aditya / lola4304
- **Test Pet ID**: pet-99a708f1722a (Mojo)

---

*Last updated: January 25, 2026*

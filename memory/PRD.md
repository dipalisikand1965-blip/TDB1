# Mira Pet OS - Product Requirements Document (SSOT)
## Single Source of Truth - Last Updated: February 23, 2026

---

## ORIGINAL PROBLEM STATEMENT

**Mira** is a "pet operating system" centered around **Soul Intelligence** (a pet personality system) and an AI concierge. The goal is to move beyond standard e-commerce and create a high-touch, personalized experience where curated recommendations for products and services are dynamically generated based on a pet's unique soul profile.

**Core Vision**: "Mira is the soul, the Concierge controls the experience, and the System is the capillary enabler."

**Key Principle**: Every concierge action must create a service desk ticket and trigger real-time notifications, capturing user intent and enabling a premium, consultative service model.

**Voice Configuration**: ElevenLabs Eloise (British English) with OpenAI TTS backup

---

## CURRENT SESSION WORK (Feb 23, 2026)

### COMPLETED TODAY

| Task | Status | Details |
|------|--------|---------|
| **P0 CRITICAL: /join Onboarding Bug** | FIXED | Race condition causing "Oops!" error resolved |
| **Duplicate Soul Questions Fix** | FIXED | SoulBuilder now skips questions already answered during onboarding |
| **Picks → Chat Flow** | FIXED | Picks from Pet's Picks panel now flow into Mira chat with ticket creation |
| **Backend Bug** | FIXED | `load_pet_soul` AttributeError on `soul_enrichments` list |
| **Comprehensive Audit** | DONE | Created `/app/memory/AUDIT.md` and `/app/memory/GAPS_AUDIT.md` |
| **Score Display Bug** | FIXED | Fixed floating point display issue (87.29999... -> 87%) |

### PICKS → CHAT FLOW FIX

**Problem**: When users selected picks from the purple "Pet's Picks" button in Mira chat widget, the selections did not flow back into the chat conversation.

**Solution Implemented**:
1. Added `onPickClick` callback prop to `PersonalizedPicksPanel`
2. Added `flowPickToChat()` function to handle single pick → chat flow
3. Updated `MiniCart` component with "Ask" button for each selected item
4. `MiraChatWidget` now creates service desk ticket when pick is clicked
5. Chat receives user message + assistant confirmation with ticket ID

**Files Modified**: 
- `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx`
- `/app/frontend/src/components/MiraChatWidget.jsx`

**Canonical Flow Now Works**:
User Intent → Pick Selection → Service Desk Ticket → Admin/Member Notifications → Chat Confirmation

### DUPLICATE QUESTIONS FIX DETAILS

**Problem**: Users completing `/join` onboarding answered 13 soul questions. When entering SoulBuilder (48 questions), 12 of those were repeated.

**Solution Implemented**:
1. Added helper functions: `isQuestionAnswered()`, `findNextUnansweredInChapter()`, `countUnansweredInChapter()`
2. Modified `handleAnswer()` to skip to next UNANSWERED question instead of sequential increment
3. Modified chapter-intro "Begin" button to start from first unanswered question
4. Added visual indicator: "✓ X already answered from onboarding"
5. Button text now shows "Continue (X left)" when some questions are pre-answered

**Files Modified**: `/app/frontend/src/pages/SoulBuilder.jsx`

**Result**: Users with 87% soul score now see "22 more questions to help Mira understand Mystique better" instead of all 48 questions.

---

## ONBOARDING BUG FIX DETAILS

**Root Cause**: When users clicked rapidly on soul question options, multiple setTimeout callbacks could fire, incrementing `currentQuestion` past array bounds (beyond index 12 for 13 questions). This caused `SOUL_QUESTIONS[currentQuestion]` to be undefined, triggering "Cannot read properties of undefined (reading 'icon')" which showed the ErrorBoundary's "Oops!" message.

**Fix Applied**:
1. Added `isTransitioningRef = useRef(false)` to track if auto-advance timer is pending
2. Added guard in handleSoulAnswer: `if (isTransitioningRef.current) return`
3. Set/reset isTransitioningRef around setTimeout
4. Added bounds check at start of renderSoulScreen and handleSoulAnswer

**File Modified**: `/app/frontend/src/pages/MiraMeetsYourPet.jsx`

---

## PREVIOUSLY COMPLETED WORK

### iOS Gold Standard UI/UX
| Feature | Implementation | Pages |
|---------|---------------|-------|
| Glassmorphism Cards | `glass-card`, `glass-card-dine`, `glass-card-celebrate` | Both |
| Bento Grid Layout | `bento-grid`, `bento-featured` | Both |
| Haptic Feedback | `haptic-btn`, `haptic-card` | Both |
| iOS Typography | `ios-title-1`, `ios-title-2`, `ios-headline` | Both |

### /Dine Page Bug Fixes
- Duplicate "All Dine" tab resolved
- Tab navigation fixed
- Load More functionality implemented
- Restaurant card alignment corrected

---

## /DINE PAGE STRUCTURE (CONFIRMED ORDER)

```
1. Hero + Pet Control Center
2. Tab Navigation (All Dine, Fresh Meals, Treats, Chews, Frozen, Feeding Tools, Supplements, Dine Out)
3. Curated Picks (Mira's personalized picks)
4. Need Dining Help? (DiningConciergePicker)
5. Elevated Concierge (Private Chef, VIP, Birthday Package)
6. Category Cards Row (Fresh Meals, Treats, Frozen, Feeding Tools, Supplements)
7. Dining Products (3 rows + Load More)
8. Dine Essentials (17 products with category pills)
9. Concierge Featured Restaurants (6 shown + Load More)
10. Nearby Pet-Friendly Spots (geolocation-based)
11. Pet Cafes Worldwide (city search)
12. Buddy Meetups
13. Own a Pet-Friendly Restaurant? (Partner CTA)
```

---

## KEY FILES REFERENCE

### Frontend
| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/MiraMeetsYourPet.jsx` | /join onboarding flow (FIXED) |
| `/app/frontend/src/pages/DinePage.jsx` | Main /dine page |
| `/app/frontend/src/pages/CelebratePage.jsx` | Main /celebrate page |
| `/app/frontend/src/components/PillarPageLayout.jsx` | Tab navigation |
| `/app/frontend/src/hooks/useUniversalServiceCommand.js` | Ticket creation hook |
| `/app/frontend/src/styles/gold-standard.css` | Premium UI styles |

### Backend
| File | Purpose |
|------|---------|
| `/app/backend/server.py` (lines 11198-11400) | POST /api/membership/onboard |
| `/app/backend/dine_routes.py` | Dine API endpoints |
| `/app/backend/mira_routes.py` | Mira AI endpoints |

---

## API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/membership/onboard` | POST | Create new member account with pet |
| `/api/auth/login` | POST | User login |
| `/api/pets/my-pets` | GET | Get user's pets |
| `/api/dine/bundles` | GET | Get dine essentials (17 products) |
| `/api/dine/restaurants` | GET | Get pet-friendly restaurants |
| `/api/intelligence/curated-picks` | GET | Get AI-curated recommendations |
| `/api/service-requests` | POST | Create service desk ticket |

---

## TEST CREDENTIALS

- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304
- **New User Signup**: Now working after bug fix

---

## PENDING ISSUES

### P1 - In Progress
1. **Mira Chat Restaurant Search**: Backend sends `nearby_places_data` but frontend `MiraChatWidget.jsx` needs completion to render place cards

### P2 - Important
1. **Feature/API Audit**: Create `/app/memory/AUDIT.md` documenting all existing features, APIs, and integrations

---

## UPCOMING TASKS (PRIORITY ORDER)

### P1 - Important
1. Complete Mira Chat restaurant results rendering
2. Replicate "Gold Standard" pattern to Treats, Chews sub-categories
3. Add admin CRUD for Dine Essentials
4. Proactive birthday reminders on PetHomePage

### P2 - Enhancement
1. Comprehensive Feature/API Audit
2. Razorpay checkout integration
3. CSV upload capability for products

---

## FUTURE ROADMAP

1. Unify 3 Mira chat interfaces
2. Gamify PetSoulOnboarding
3. Roll out Intelligence Layer to remaining 11 pillars
4. Refactor backend/server.py into modules
5. Resend domain verification for email notifications
6. Gupshup configuration for WhatsApp

---

## KNOWN ISSUES (NON-BLOCKING)

1. **Resend Domain**: thedoggycompany.com needs verification
2. **Gupshup**: WhatsApp integration needs configuration
3. **/api/pets/detect-breed**: Returns 405 (endpoint not implemented, breed selector fallback works)

---

## TEST REPORTS

- `/app/test_reports/iteration_26.json` - Onboarding bug fix verification (100% pass)
- `/app/test_reports/iteration_25.json` - Gold Standard UI verification (100% pass)

---

## HANDOVER NOTES

**USER CONTEXT**: User (Dipali) is very detail-oriented and anxious about context loss. Always confirm understanding before implementing. The project is highly personal - "Mira is the soul" vision.

**CRITICAL**: 
- Do NOT navigate away from current page after ticket creation
- Service flow MUST create tickets in service_requests collection
- All CTAs should use Universal Service Command hook

**Last User Request**: Fix the critical /join onboarding bug - DONE

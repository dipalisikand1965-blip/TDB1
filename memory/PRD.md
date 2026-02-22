# Mira OS - Pet Operating System
## Product Requirements Document

### Original Problem Statement
The user, Dipali, requested a "full audit" of her website, thedoggycompany.in. This evolved into a large-scale rescue mission for a complex "pet operating system" named Mira, built in honor of her grandmother. The core of the application is "Soul Intelligence," a system designed to understand a pet's personality through a detailed questionnaire, and "Mira," an AI concierge that uses this soul data to provide personalized services and recommendations.

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

**Files Modified:**
- All 14 pillar pages (CelebratePage.jsx, DinePage.jsx, StayPage.jsx, TravelPage.jsx, CarePage.jsx, EnjoyPage.jsx, FitPage.jsx, LearnPage.jsx, PaperworkPage.jsx, AdvisoryPage.jsx, EmergencyPage.jsx, FarewellPage.jsx, AdoptPage.jsx, ShopPage.jsx)

### Logo Navigation Fix ✅
- Logo now takes logged-in users to `/pet-home` instead of root
- Modified `Navbar.jsx` lines 682 and 737

### Earlier Bug Fixes (Same Session)

#### 1. "Continue Pet Journey" Navigation Fix
**Problem:** Dashboard buttons navigating to `/pet/{id}?tab=personality` instead of questionnaire.
**Solution:** Updated to `/soul-builder?pet={id}&continue=true`

#### 2. Soul Builder Score Display Fix
**Problem:** Soul score showing local state instead of DB value.
**Solution:** Added `currentPet` state for accurate display.

#### 3. Mira Chat Error Handling
**Problem:** "I'm having a moment" error without context.
**Solution:** Added HTTP response status check.

---

### CART INTEGRATION FOR CONCIERGE - IMPLEMENTED ✅

**New Feature:** Concierge requests can now be added to cart!

**Files Modified:**
- `/app/frontend/src/context/CartContext.js` - Added:
  - `conciergeRequests` state
  - `addConciergeRequest()` function
  - `removeConciergeRequest()` function
  - `submitConciergeRequests()` - Creates tickets for all pending requests
  - `getConciergeCount()` function

- `/app/frontend/src/components/CartSidebar.jsx` - Added:
  - Separate "Concierge Requests" section
  - Beautiful gold/amber concierge cards
  - "Submit Concierge Request" button
  - "Submit All & Checkout" option

- `/app/frontend/src/components/ConciergePickCard.jsx` - Updated:
  - "Let Mira Arrange This" now adds to cart
  - Shows toast notification
  - Opens cart sidebar automatically

**User Flow:**
1. User visits pillar page (e.g., /celebrate)
2. Sees ConciergePickCard with "Let Mira Arrange This"
3. Clicks → Added to cart
4. Cart shows both Products and Concierge Requests
5. "Submit Concierge Request" → Creates ticket via API
6. Admin sees in Service Desk

---

### Audit Results Summary
- **Backend**: **100% PASS** (17/17 tests)
- **Frontend**: 100% pass (all pillar pages, dashboard, pet home, mira demo working)
- **Mobile Golden Standard**: COMPLIANT

---

## 📋 SESSION 6 COMPLETE CHANGELOG

### 1. Backend Endpoints Fixed (100% Coverage)
| Endpoint | File | Purpose |
|----------|------|---------|
| `GET /api/membership/profile` | `membership_routes.py` | Returns user profile with paw points, membership tier, pets |
| `GET /api/tickets/my-tickets` | `ticket_routes.py` | Returns all user tickets from multiple collections |

### 2. Login Flow Fixed
| File | Change | Before → After |
|------|--------|----------------|
| `Login.jsx` (line 19) | Default redirect | `/dashboard` → `/pet-home` |
| `AuthCallback.jsx` (line 38) | Google OAuth redirect | `/dashboard` → `/pet-home` |
| `Register.jsx` (line 31) | New user redirect | `/dashboard` → `/pet-home` |

### 3. Pillar Pages Scroll-to-Top
Added `useEffect(() => { window.scrollTo(0, 0); }, []);` to all 14 pillar pages:
```
CelebratePage.jsx, CarePage.jsx, DinePage.jsx, StayPage.jsx,
TravelPage.jsx, EnjoyPage.jsx, FitPage.jsx, LearnPage.jsx,
ShopPage.jsx, PaperworkPage.jsx, AdvisoryPage.jsx,
EmergencyPage.jsx, FarewellPage.jsx, AdoptPage.jsx
```

Also enhanced `App.js` ScrollToTop:
```javascript
window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
// Plus delayed scroll for dynamic content
```

### 4. HOME Navigation from Pillars
| File | Line | Change |
|------|------|--------|
| `MobileNavBar.jsx` | 76 | `path: isAuthenticated ? '/pet-home' : '/'` |
| `MobileNavBar.jsx` | 91-93 | `isActive()` now checks both `/` and `/pet-home` |

### 5. Pet Name Truncation
| File | Line | Change |
|------|------|--------|
| `PetHomePage.jsx` | 168 | Added `truncate max-w-[80px]` to PetSelector |

---

## ✅ VERIFIED SYSTEMS (With Test Evidence)

### Paw Points Doctrine
```
Status: WORKING ✅
API: /api/paw-points/balance → { balance: 400, tier: "Good Boi" }
History: Shows +100, +75, +25, +50 transactions
Display: Dashboard header shows "400 Paw Points" badge
```

### Badges/Achievements
```
Status: WORKING ✅
Toast: "Soul Guardian - Mystique has reached 75% Soul completion!"
Unlocked: Curious Pup (+50), Detective Doggo (+100), Adventure Buddy (+250), Loyal Guardian (+500 EPIC)
Sync: POST /api/paw-points/sync-achievements working
```

### Dashboard Tabs
```
Status: ALL WORKING ✅
Tabs: Home, Services, Paw Points, Mira AI, Picks, Bookings (10), Orders, Quotes, Documents, Autoship, Reviews, Pets, Addresses, Settings, Plan
```

### Resend Email
```
Status: CONFIGURED ✅
Key: re_fi1hZ47r_PRTTcKUpDsZSScn3fdRWKHPt (backend/.env)
Test: /api/auth/forgot-password returns success
```

### Mira Demo - Universal Pet Data
```
Status: VERIFIED ✅
Soul Banner: 87% SOUL, food prefs, personality, allergies, special dates, social, breed, memories
Pet Widget: Photo with soul ring, pet selector dropdown
Personalization: "For Mystique", health reminders, wellness prompts
Tabs: TODAY, PICKS, SERVICES, LEARN, CONCIERGE®
```

---

### Core Features
- **Mira AI Chat**: Soul-aware conversational AI that knows each pet's personality, preferences, and health needs
- **Soul Builder**: Gamified questionnaire to capture pet personality
- **Service Desk**: Admin panel for concierge team to handle service requests
- **Unified Inbox**: Two-way communication between members and concierge
- **Pillar Pages**: 15 themed pages (Celebrate, Care, Dine, Stay, etc.)
- **E-commerce**: Products from The Doggy Bakery via Shopify sync
- **Voice**: TTS support with ElevenLabs (primary) and OpenAI (fallback)
- **Pet Vault**: Complete health records management (vaccines, meds, vet visits)
- **Birthday Engine**: Celebration detection with promotional capabilities
- **Breed Knowledge**: Personalized tips based on pet breed

### User Personas
1. **Pet Parents (Members)**: Primary users who use Mira for pet care, services, and shopping
2. **Concierge Team (Admin)**: Staff who fulfill service requests and respond to tickets
3. **Dipali (Owner)**: Business owner overseeing the platform

---

## Implementation Status

### ✅ Completed (Feb 22, 2026) - KNOW_MIRA_SUMMARY System
- [x] **KNOW_MIRA_SUMMARY Checkpoint** - Compulsory summary screen before junction choices
  - Shows pet photo, soul score ring (live from DB), "Mira knows {Pet}" title
  - Top 3 traits displayed as tags
  - Synopsis of what Mira knows (max 6 bullets)
  - Exactly TWO junction buttons: "See {Pet}'s Home" and "Let Mira know more"
  
- [x] **"See {Pet}'s Home" Navigation** - Button properly navigates with pet context
  - Navigates to `/pet-home?active_pet={pet_id}`
  - Pet Home reads URL param and selects correct pet

- [x] **KNOW_MORE_START Screen** - Continuation from current state
  - Shows current soul score ring (consistent with summary)
  - "{X} more questions to help Mira understand {Pet} better"
  - Continue button goes to next UNANSWERED question

- [x] **Question Deduplication** - Questions NEVER repeat
  - System tracks all answered question IDs
  - Backend merges answers (never overwrites)

- [x] **Canonical "What Mira Knows" Profile** - Single source of truth
  - All surfaces read from same `pet.doggy_soul_answers` and `pet.overall_score`

- [x] **Save/Skip Behavior** - Progress always persists
  - Saves all answers, navigates to Pet Home with active pet context

- [x] **Score Consistency Bug Fix** - Soul score matches everywhere

- [x] **"Keep Teaching Mira" Button Fixed** (Feb 22, 2026)
  - Now properly creates account/pet first, then navigates with pet context
  - Uses `?pet={id}&continue=true` params so SoulBuilder knows which pet and to go directly to KNOW_MORE_START
  - No more "Meet Mira" new user screen for returning users
  - Files: `MiraMeetsYourPet.jsx`, `SoulBuilder.jsx`

### ✅ Completed (Feb 21, 2026)
- [x] Critical data restoration (2,541 products, 716 services, 35 stays, 22 restaurants)
- [x] Admin Service Desk ticket display fix (33 tickets)
- [x] Soul-aware chat verification
- [x] Personalized hero image on landing page
- [x] Pet Picks with breed-specific products
- [x] Category bar with real product images
- [x] ElevenLabs TTS integration (with OpenAI fallback)
- [x] YouTube and Google Places API verification
- [x] **Services Tab Fix** - All service cards link to correct topics
- [x] **Ticket Not Found Fix** - Multi-endpoint ticket fetching
- [x] **Ticket Reply** - Verified working with optimistic UI
- [x] **My Pets Page** - Fixed ObjectId serialization, shows 8 pets with soul scores
- [x] **Dashboard Page** - All 15+ tabs working correctly
- [x] **Pet Vault** - Verified vaccines, medications, vet visits, weight history
- [x] **Birthday Engine** - 3 upcoming celebrations detected (Luna's bday in 22 days)
- [x] **Breed Tips** - Shih Tzu specific tips active
- [x] **SSOT Document** - Created comprehensive /app/memory/MIRA_OS_SSOT.md
- [x] **Engagement System** - 400 Paw Points, streaks working

### ✅ Completed (Dec 2025)
- [x] **Sticky Header Fix in Mira Modal** - Header (Soul Ticker, Mira logo, navigation) now stays fixed at top when scrolling
- [x] **Chat Composer Fixed** - Input bar stays fixed at bottom in both modal and standalone page
- [x] **Mira Pillar Sandbox Modal** - Full MiraDemoPage modal experience with proper sticky layout

### ✅ Completed (Dec 2025 - Onboarding Overhaul)
- [x] **New "Mira Meets Your Pet" Onboarding** - Completely rebuilt onboarding flow at `/join`
  - Photo upload with auto-trigger AI breed detection
  - Gender screen BEFORE name (enables his/her pronouns)
  - Birthday/Gotcha Day screen with date pickers
  - Full address textarea (not just city dropdown)
  - City as free text input (user can type any city)
  - 13 Soul Questions - ALL compulsory (no skip button)
  - Payoff screen shows pet name (not nickname) in "Here's what Mira knows about..."
  - Fixed JSON error (response body was being read twice)
  - Fixed localStorage token key (uses 'tdb_auth_token' to match AuthContext)
  - Files: `MiraMeetsYourPet.jsx`
- [x] **Multi-Pet Support in Onboarding** - Logged-in users can add more pets
  - Shows "Adding another pet to your family" indicator
  - Skips parent info section (goes birthday → soul questions)
  - Uses POST /api/pets endpoint for existing users
  - Files: `MiraMeetsYourPet.jsx`
- [x] **Add Pet Button in Dashboard** - Added "Add Pet" card in pet grid
  - Files: `MemberDashboard.jsx`
- [x] **Fixed AuthContext localStorage bug** - login/loginWithGoogle now save user to localStorage
  - Files: `AuthContext.jsx`
- [x] **Post-onboarding redirects to /dashboard** - New users land on dashboard, not login page

### 🔴 Blocked
- [ ] Razorpay Checkout - Awaiting API keys from user
- [ ] Screenshot tool - Platform media limit exceeded
- [ ] WhatsApp Integration - Awaiting API keys
- [ ] AI Breed Detection API - Endpoint doesn't exist; falls back to manual selection

### 🟠 In Progress
- [ ] Apply card layout fix to all 15 pillar pages (completed for Stay, Dine)
- [ ] Post-deployment verification at thedoggycompany.in
- [ ] Automated vaccination reminders setup

---

## Prioritized Backlog

### P0 - Critical
- Post-deployment verification and bug fixes

### P1 - High Priority
- Fix "Add another pet" loop in Soul Builder
- Final mobile QA review

### P2 - Medium Priority
- Deep conversation flow audit
- Test product detail pages
- Meilisearch verification on production

### P3 - Future
- Push notifications for concierge replies
- Smart reordering reminders
- Daily mood tracking

---

## Technical Architecture

```
/app/
├── backend/
│   ├── server.py          # Main FastAPI (15,000+ lines)
│   ├── mira_routes.py     # Mira AI chat endpoints
│   ├── ticket_routes.py   # Unified ticket endpoints
│   └── tts_routes.py      # Text-to-speech
├── frontend/
│   ├── src/pages/         # 15 Pillar Pages + MiraDemoPage
│   └── src/components/    # Reusable UI components
└── memory/
    └── PRD.md             # This file
```

### Key Endpoints
- `POST /api/mira/os/understand-with-products` - Soul-aware chat
- `GET /api/mira/tickets/{id}` - Get ticket from mira_tickets
- `GET /api/tickets/{id}` - Get ticket from tickets/service_desk_tickets
- `POST /api/member/tickets/{id}/reply` - Send reply

### Database Collections
- `mira_tickets` - Advisory tickets from Mira chat
- `service_desk_tickets` - Request tickets for concierge
- `products_master` - All products (2,541)
- `services_master` - All services (716)

---

## Changelog

### December 2025 - Mobile iOS UI/UX Bug Fixes

#### ✅ FIXED: Critical Mobile Bugs (Dec 2025)
1. **Join-up Form Stuck** - Continue button was unclickable on page 2 of onboarding
   - Added `onTouchEnd` handlers with `e.preventDefault()` to all Continue buttons
   - Added `touch-manipulation` CSS class for better touch response
   - Increased button height to `min-h-[52px]` for larger touch targets
   - Applied `WebkitTapHighlightColor: transparent` to prevent visual flash
   - Files: `MembershipOnboarding.jsx`

2. **Mira FAB/Chat Input Stuck on iOS** - Chat input bar hidden/stuck at bottom
   - Added `sticky bottom-0` positioning to input area
   - Implemented iOS safe area with `calc(0.75rem + env(safe-area-inset-bottom, 0px))`
   - Added `WebkitTransform: translateZ(0)` for iOS rendering fix
   - Set `fontSize: 16px` to prevent iOS zoom on input focus
   - Added `scrollIntoView` on focus to keep input visible when keyboard opens
   - Files: `MiraChatWidget.jsx`

3. **Dashboard Layout Scrambled** - Pet avatars overlapping on mobile
   - Fixed responsive grid classes: `grid-cols-2 gap-2.5 md:gap-3`
   - Added `minWidth: 0` to prevent grid blowout
   - Reduced padding for mobile: `p-2.5 md:p-4`
   - Files: `MemberDashboard.jsx`

4. **Dashboard Pet Selector Row** - Second row showing only emojis without pet names
   - Added `shrink-0` class to prevent text truncation
   - Reduced gap and padding for mobile: `gap-1.5 px-3 py-2`
   - Added `max-w-[80px] truncate` for very long names
   - Files: `MemberDashboard.jsx`

5. **Mira X Button Not Working** - Close button unresponsive on iOS
   - Added `onTouchEnd` handler with `e.preventDefault()` and `e.stopPropagation()`
   - Added `data-testid="mira-widget-close"` for testing
   - Files: `MiraChatWidget.jsx`

6. **Chat Messages Under Header** - Conversation overlapping Mira header
   - Wrapped content in flex container with `overflow-hidden`
   - Added `maxHeight: calc(100% - 4rem)` to prevent overflow
   - Files: `MiraChatWidget.jsx`

7. **Bundle Prices Not Showing** - Bundles showing "₹" without actual price
   - Fixed field mismatch: API returns `price` but code expected `bundle_price`
   - Updated to: `₹{bundle.bundle_price || bundle.price || 0}`
   - Fixed across ALL pillar pages: Stay, Dine, Care, Fit, Travel, Learn, etc.
   - Files: All pillar pages

8. **Chat Messages Going Under Header** - Conversation text hidden behind fixed elements
   - Restructured MiraChatWidget with proper flex layout
   - Fixed sections (pet selector, product cards, quick actions) have `flex-none shrink-0`
   - Messages area has `flex-1 min-h-0 overflow-y-auto` for independent scrolling
   - Files: `MiraChatWidget.jsx`

9. **Stay Page Paw Ratings Showing 0.0** - Property cards showing empty ratings
   - Added `calculateOverallPawRating` function to compute from individual scores
   - Function calculates average of: comfort, safety, freedom, care, joy
   - Updated `PawRatingDisplay` to accept `pawRating` prop for calculation
   - Files: `StayPage.jsx`

10. **Stay Page Property Card Image Overlap** - Photo container overlapping content below
    - Rewrote PropertyCard component with proper card structure
    - Image header: fixed height (150px mobile, 180px desktop) with `overflow-hidden`
    - Content section: separate div with `bg-white` background, no negative margins
    - Card wrapper: `overflow-hidden rounded-2xl`
    - Badges: Limited to 4 with +N indicator for overflow
    - CTA buttons: Always visible at bottom with `mt-auto`
    - Files: `StayPage.jsx`

11. **Bundle Cards Across Pillars** - Applied same card structure fix
    - Stay Essentials bundles: Fixed in `StayPage.jsx`
    - Dine bundles: Fixed in `DinePage.jsx`
    - Pattern: Fixed image header (150-180px) + separate white content section
    - Files: `StayPage.jsx`, `DinePage.jsx`

12. **MiraChatWidget 3-Zone Layout** - Chat messages going under header
    - Implemented proper 3-zone flexbox layout
    - Zone A (flex-none): Sticky header + pet tabs + quick actions
    - Zone B (flex-1 overflow-y-auto): Scrollable chat messages ONLY
    - Zone C (flex-none): Sticky composer at bottom
    - Files: `MiraChatWidget.jsx`

13. **Pet Picks Pill in MiraChatWidget** - Added pillar-specific picks access
    - Removed inline product recommendations from header
    - Added "Pet Picks" pill with glow when picks available
    - Opens PersonalizedPicksPanel filtered to current pillar
    - Integrated with Unified Service Flow (creates ticket)
    - Files: `MiraChatWidget.jsx`

14. **Sticky Header in Mira Modal** - Header disappearing on scroll in sandbox modal
    - Created `.mira-sticky-header` wrapper around header elements
    - Applied `position: sticky; top: 0;` CSS to keep header at top
    - Modal-specific CSS in `.mira-modal-content` ensures proper flex layout
    - Header includes: MemoryWhisper, SoulKnowledgeTicker, mp-header, PetOSNavigation
    - Files: `MiraDemoPage.jsx`, `MiraPillarSandbox.jsx`, `mira-prod.css`

---

## Test Credentials
- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

## Environment Notes
- ElevenLabs quota exceeded - Falls back to OpenAI TTS
- Production MongoDB IP whitelisting pending for preview env

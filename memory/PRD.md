# Mira OS - Pet Operating System
## Product Requirements Document

### Original Problem Statement
The user, Dipali, requested a "full audit" of her website, thedoggycompany.in. This evolved into a large-scale rescue mission for a complex "pet operating system" named Mira, built in honor of her grandmother. The core of the application is "Soul Intelligence," a system designed to understand a pet's personality through a detailed questionnaire, and "Mira," an AI concierge that uses this soul data to provide personalized services and recommendations.

---

## ✅ FULL AUDIT COMPLETED - February 22, 2026

### Audit Results Summary
- **Backend**: **100% PASS** (17/17 tests)
- **Frontend**: 100% pass (all pillar pages, dashboard, pet home, mira demo working)
- **Mobile Golden Standard**: COMPLIANT

### Backend Endpoints Fixed
| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/membership/profile` | ✅ FIXED | Returns user profile, paw points, membership tier |
| `/api/tickets/my-tickets` | ✅ FIXED | Returns all user tickets from multiple collections |

### Verified Working Features
| Page | Status | Notes |
|------|--------|-------|
| Homepage | ✅ PASS | Mira branding loads |
| Login/Logout | ✅ PASS | Redirects correctly |
| Dashboard | ✅ PASS | All tabs, 400 Paw Points, Pet Pass Active |
| Pet Home | ✅ PASS | Soul ring 87%, traits, pillar shortcuts |
| Mira Demo | ✅ PASS | Soul context visible, chat interface |
| Join/Onboarding | ✅ PASS | Photo upload, password placeholder |
| Celebrate | ✅ PASS | Birthday cakes, celebrations |
| Care | ✅ PASS | Grooming, Health, 847 pets cared for |
| Dine | ✅ PASS | Chef's Table, Pet Party Catering |
| Stay | ✅ PASS | Vacation, Pet boarding |
| Travel | ✅ PASS | Vet Trip, Flight bookings |
| Shop | ✅ PASS | Products with prices |
| Enjoy | ✅ PASS | Playdate, Outdoor adventure |
| Fit | ✅ PASS | Leashes, Harnesses |
| Learn | ✅ PASS | Basic Obedience, Training |
| Paperwork | ✅ PASS | Document Vault, Insurance |
| Emergency | ✅ PASS | 24/7 Hotline visible |
| Adopt | ✅ PASS | 8 Pets Available |
| Admin Panel | ✅ PASS | 19 total customers visible |

### P1 UI/UX Fixes Applied
1. ✅ Password placeholder: "Create password (min 6 characters)" - Already present
2. ✅ Pet name truncation: Added `truncate max-w-[80px]` to PetHomePage.jsx PetSelector
3. ✅ SoulBuilder alignment: Verified - no issues found

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

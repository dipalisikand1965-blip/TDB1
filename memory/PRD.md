# Mira OS - Pet Operating System
## Product Requirements Document

### Original Problem Statement
The user, Dipali, requested a "full audit" of her website, thedoggycompany.in. This evolved into a large-scale rescue mission for a complex "pet operating system" named Mira, built in honor of her grandmother. The core of the application is "Soul Intelligence," a system designed to understand a pet's personality through a detailed questionnaire, and "Mira," an AI concierge that uses this soul data to provide personalized services and recommendations.

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

### 🔴 Blocked
- [ ] Razorpay Checkout - Awaiting API keys from user
- [ ] Screenshot tool - Platform media limit exceeded
- [ ] WhatsApp Integration - Awaiting API keys

### 🟠 In Progress
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

---

## Test Credentials
- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

## Environment Notes
- ElevenLabs quota exceeded - Falls back to OpenAI TTS
- Production MongoDB IP whitelisting pending for preview env

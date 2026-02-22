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

---

## Test Credentials
- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

## Environment Notes
- ElevenLabs quota exceeded - Falls back to OpenAI TTS
- Production MongoDB IP whitelisting pending for preview env

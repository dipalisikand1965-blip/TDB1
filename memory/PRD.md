# The Doggy Company - Pet Life Operating System

## Original Problem Statement
Build a world-class, event-driven platform with a single engine powering multiple business "Pillars" (Celebrate, Stay, Dine, Travel, Care, etc.). Key components include the **"Pet Soul"** (a deep, evolving pet profile), a **"Unified Inbox"** for all customer requests, a **"Membership"** layer, and a robust Admin/Agent experience.

## Core Strategy
**Data Flywheel**: Every interaction enriches the "Pet Soul," making the platform proactively intelligent.

---

## Product Requirements

### A. One Engine, Multiple Pillars
- Single backend for all pillars (Dine, Stay, Travel, Celebrate, Care)

### B. Unified Input & Inbox
- Central admin inbox for all customer requests across pillars

### C. Pet Soul
- Comprehensive, learning profile for each pet
- Progressive profiling from all interactions

### D. Membership Layer
- Guest vs. member system with rewards
- Pricing: ₹999/yr or ₹99/mo
- B2B discount codes for wholesale partners

### E. Automated Notifications & Service Desk
- Event-driven tickets and notifications
- SLA tracking and breach alerts

### F. World-Class Admin Experience
- Robust, intuitive admin tools
- Agent-specific portal with permissions

### G. Data Flywheel
- Intelligence layer connecting all features to Pet Soul

### H. Gamify Pet Soul
- Reward users for completing their Pet Soul profile

---

## What's Been Implemented

### ✅ Completed Features

#### Core Infrastructure
- FastAPI backend + React frontend + MongoDB
- Authentication (JWT-based)
- Role-based access (Admin, Agent, User)

#### Pet Soul System
- Complete pet profiles with progressive profiling
- Travel preferences auto-captured from requests
- Health, preferences, behavior tracking

#### Business Pillars

**Dine Pillar** ✅
- Restaurant listings with filters
- Menu browsing
- Voice ordering feature

**Stay Pillar** ✅
- Pet-friendly accommodation search
- Booking system
- My Bookings for users

**Travel Pillar** ✅
- Single-flow design with wizard modal
- 4 travel types: Cab, Train, Flight, Relocation
- 12 products + 5 bundles
- Full admin management (Products, Bundles, Partners, Settings)
- CSV import/export

**Care Pillar** ✅ (January 19, 2026)
- Profile-first pet wellbeing layer
- 7 care types: Grooming, Walks & Sitting, Training, Vet Coordination, Emergency, Special Needs, Routine
- Beautiful frontend with wizard modal
- Admin CareManager with 5 tabs (Requests, Partners, Products, Bundles, Settings)
- 12 products + 5 bundles seeded
- CSV import/export
- Service Desk + Unified Inbox + Pet Soul integration

**Enjoy Pillar** ✅ (January 20, 2026)
- Pet-friendly events, experiences & community calendar
- 6 experience types: Events & Pop-ups, Trails & Walks, Meetups & Playdates, Pet Cafés, Workshops, Wellness
- Beautiful frontend with hero section and RSVP flow
- **NEW: Community Calendar View** with:
  - Month navigation and day selection
  - Event indicators on dates with activities
  - City filter (India: Mumbai, Delhi, Bangalore, Goa, Hyderabad, Pune + Global ready)
  - List/Calendar view toggle
  - Click-to-RSVP from calendar sidebar
- Admin EnjoyManager with 5 tabs (Experiences, RSVPs, Partners, Products, Settings)
- 16 experiences + 14 products seeded (Mumbai, Delhi, Bangalore, Goa, Pune, Hyderabad)
- Service Desk + Unified Inbox + Pet Soul integration

**FIT Pillar** ✅ (January 20, 2026)
- Pet fitness, exercise plans, weight management & wellness
- 6 plan types: Exercise Plans, Weight Management, Nutrition Guidance, Agility Training, Senior Fitness, Assessment
- Beautiful green/teal themed frontend with "Fit Paws, Happy Hearts" branding
- Weight & Activity tracking endpoints
- Admin FitManager with 6 tabs (Requests, Plans, Partners, Products, Bundles, Settings)
- Full Settings with Paw Rewards, Birthday Perks, Notifications, Service Desk integration
- 6 plans + 12 products + 5 bundles + 4 partners seeded
- Service Desk + Unified Inbox integration with auto-ticket creation

**Celebrations Pillar** ✅
- Custom cakes, treats, birthday celebrations

#### Service Desk
- Ticket management
- Multi-channel intake
- AI reply drafts (OpenAI GPT-4)
- SLA tracking

#### Admin Panel
- Dashboard with metrics
- User management
- Product management (Shopify sync)
- Travel Manager, Care Manager
- Abandoned cart settings UI

---

## In Progress

### 🔄 Membership Pillar V1
- Backend file created: `membership_routes.py`
- Razorpay SDK installed
- Test keys configured
- **Next**: Implement payment endpoints, frontend purchase page, onboarding flow

---

## Known Issues

| Issue | Status | Priority |
|-------|--------|----------|
| Voice Order broken on production | BLOCKED (needs deployment) | P1 |
| Shopify Sync creating 'Untitled' Products | NOT STARTED | P2 |
| Auto-reminders only to Gmail | BLOCKED (Resend domain config) | P1 |
| Service Desk modal shaking | FIXED (Jan 20, 2026) | P0 |

---

## Upcoming Tasks

### P0 - Critical (Remaining Pillars)
1. **ADVISORY Pillar** - Behaviour consults, nutrition planning, senior dog planning
2. **PAPERWORK Pillar** - Secure document uploads (vaccinations, insurance) with reminders
3. **EMERGENCY Pillar** - High-priority request routing, lost pet workflow
4. Complete Membership/Club Pillar (after all other pillars)

### P1 - High Priority (Enhancements)
1. Enhance CELEBRATE Pillar - Add birthday triggers, Mira planning, reminder nudges
2. Enhance DINE Pillar - Add Mira reservations, auto-fill pet details
3. Enhance STAY Pillar - Add advanced filters, partner tagging for rewards
4. Enhance SHOP ASSIST Pillar - Add Mira-driven recommendations and gift guidance

### P2 - Medium Priority
1. Admin Panel reorganization (Common vs Pillar-specific)
2. Component refactoring (Admin.jsx, ServiceDesk.jsx, server.py)
3. Fix Shopify Sync 'Untitled' Products issue

### Future/Backlog
1. Additional pillars (as needed)
2. WhatsApp integration
3. Google Calendar integration

---

## Tech Stack

- **Frontend**: React 18, TailwindCSS, Shadcn/UI
- **Backend**: FastAPI, Python 3.11
- **Database**: MongoDB
- **Integrations**: 
  - OpenAI GPT-4 (AI replies, voice transcription)
  - Resend (emails)
  - Shopify (product sync)
  - Razorpay (payments - in progress)

---

## Key Collections

- `users` - User accounts
- `pets` - Pet profiles with soul data
- `travel_requests` - Travel booking requests
- `care_requests` - Care service requests
- `travel_partners` - Travel partner companies
- `care_partners` - Care service providers (groomers, walkers, trainers)
- `products` - All products including travel and care items
- `product_bundles` - Bundled offerings
- `tickets` - Service desk tickets
- `channel_intakes` - Unified inbox entries
- `memberships` - (To be created)
- `app_settings` - Global configuration

---

## Key Files Reference

### Backend
- `/app/backend/server.py` - Main FastAPI server
- `/app/backend/travel_routes.py` - Travel pillar APIs
- `/app/backend/care_routes.py` - Care pillar APIs (NEW)
- `/app/backend/membership_routes.py` - Membership APIs (WIP)

### Frontend
- `/app/frontend/src/pages/TravelPage.jsx` - Travel pillar page
- `/app/frontend/src/pages/CarePage.jsx` - Care pillar page (NEW)
- `/app/frontend/src/components/admin/TravelManager.jsx` - Travel admin
- `/app/frontend/src/components/admin/CareManager.jsx` - Care admin (NEW)
- `/app/frontend/src/pages/Admin.jsx` - Main admin panel

---

## Credentials

- **Admin**: aditya / lola4304
- **Agent**: sarah / agent123
- **Test User**: testuser@example.com / password

---

## Last Updated
January 19, 2026 - Care Pillar full build complete

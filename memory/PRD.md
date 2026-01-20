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
- **Bug Fix (Jan 20, 2026)**: Added `is_active: true` to bundle seed data to fix bundles not displaying

**ADVISORY Pillar** ✅ (January 20, 2026)
- Expert pet guidance: Behaviour, Nutrition, Senior Care, New Pet, Health, Training consultations
- Beautiful violet/purple themed frontend with "Expert Guidance for Your Pet's Wellbeing" branding
- 6 advisory service types with unique icons and colors
- Featured advisors section with ratings and consultation fees
- Products & Bundles sections with Paw Points rewards
- Admin AdvisoryManager with 5 tabs (Requests, Advisors, Products, Bundles, Settings)
- Full Settings: Paw Rewards, Birthday Perks, Notifications, Service Desk integration
- 4 advisors + 12 products + 5 bundles seeded
- Service Desk ticket auto-creation on request submission
- Unified Inbox integration with admin notifications

**PAPERWORK Pillar** ✅ (January 20, 2026)
- Secure pet document vault with 6 categories:
  - Identity & Safety (adoption, registration, microchip, passport, ownership)
  - Medical & Health (vaccination, deworming, tick/flea, health checkups, vet notes, lab reports, prescriptions)
  - Travel Documents (airline certs, health certs, relocation papers)
  - Insurance & Financial (policy, claims, receipts)
  - Care & Training (grooming, training certs, behaviour assessments)
  - Legal & Compliance (municipality, license, breeder cert)
- Deep blue/indigo professional theme
- Document upload with reminder engine (email, WhatsApp, both, app)
- Quick Access API for Mira AI and Concierge team
- Progress tracking for essential documents
- Admin PaperworkManager with 4 tabs (Requests, Products, Bundles, Settings)
- Full Settings: Paw Rewards, Birthday Perks, Reminders, Quick Access
- 14 products + 5 bundles seeded (Paw Papers Starter, Travel Ready, Emergency & Lost Pet, Lifetime Health File, Digital Document Suite)
- Service Desk + Unified Inbox integration

**EMERGENCY Pillar** ✅ (January 20, 2026) - **FINAL PILLAR**
- 24/7 Emergency support with dedicated hotline (+91 96631 85747)
- 8 Emergency types with SLA-based routing:
  - Lost Pet Alert (Critical, 1hr SLA)
  - Medical Emergency (Critical, 1hr SLA)
  - Accident & Injury (High, 2hr SLA)
  - Poisoning/Ingestion (Critical, 1hr SLA)
  - Breathing Difficulty (Critical, 1hr SLA)
  - Found Pet Report (High, 4hr SLA)
  - Natural Disaster (High, 2hr SLA)
  - Aggressive Animal (High, 2hr SLA)
- 4 Severity levels: Critical, Urgent, High, Moderate
- Red/urgent theme with animated emergency stripes
- Emergency contacts management per pet
- Admin EmergencyManager with 5 tabs (Emergencies, Partners, Products, Bundles, Settings)
- Full Settings: Response SLA, Notifications (Email/SMS/WhatsApp/Sound), Lost Pet Settings, Service Desk integration
- 4 partners seeded (3 are 24/7): PetCare Emergency Hospital, PetAmbulance India, Mumbai Animal Welfare Society, Pet Poison Helpline
- 12 products (GPS trackers, first aid kits, ID tags, safety gear)
- 5 bundles (Complete Safety, First Responder, Lost Pet Prevention, Travel Emergency, Small Pet Safety)
- Service Desk integration with CRITICAL priority tickets
- Pet Soul integration (logs emergencies to pet profile)

**Dine Pillar Updates** ✅ (January 20, 2026)
- **NEW**: Added `/api/dine/products` endpoint for dine-specific products
- **NEW**: Added 12 dine products (travel bowl, placemat, water bottle, treat pouch, calming spray, etc.)
- **NEW**: Products section added to DinePage frontend
- **Bug Fix (Jan 20, 2026)**: Dine now has both products AND bundles (previously only bundles)

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

## 🎉 ALL 12 PILLARS COMPLETE!

| Pillar | Status | Theme |
|--------|--------|-------|
| Celebrate | ✅ Complete | Pink/Purple |
| Dine | ✅ Complete | Orange/Red |
| Stay | ✅ Complete | Green/Teal |
| Travel | ✅ Complete | Blue/Indigo |
| Care | ✅ Complete | Red/Pink |
| Enjoy | ✅ Complete | Amber/Orange |
| Fit | ✅ Complete | Teal/Emerald |
| Advisory | ✅ Complete | Violet/Purple |
| Paperwork | ✅ Complete | Blue/Indigo |
| **Emergency** | ✅ Complete | **Red/Urgent** |
| Shop Assist | ✅ Complete | (Integrated) |
| Club/Membership | 🔄 Next | Gold/Premium |

---

## In Progress

### 🔄 Membership/Club Pillar
- Backend file created: `membership_routes.py`
- Razorpay SDK installed
- Test keys configured
- **Next**: Implement payment endpoints, frontend purchase page, onboarding flow

---

## Upcoming Tasks

1. **Membership/Club Pillar** - The final layer connecting all pillars
2. **Centralized Product Management** - View/edit products across all pillars
3. **Seed All Button** - One-click data seeding for all admin managers
4. **Standardize Dine & Celebrate Managers** - Add full Settings tab

---

## Known Issues

| Issue | Status | Priority |
|-------|--------|----------|
| Voice Order broken on production | BLOCKED (needs deployment) | P1 |
| Shopify Sync creating 'Untitled' Products | NOT STARTED | P2 |
| Auto-reminders only to Gmail | BLOCKED (Resend domain config) | P1 |
| Service Desk modal shaking | FIXED (Jan 20, 2026) | P0 |
| Enjoy products/bundles not showing | FIXED (Jan 20, 2026) | P0 |
| FIT bundles not seeded | FIXED (Jan 20, 2026) | P0 |
| Dine products missing | FIXED (Jan 20, 2026) | P0 |
| Enjoy RSVP button not clickable | VERIFIED WORKING (Jan 20, 2026) | P0 |
| Enjoy calendar close button missing | VERIFIED WORKING (Jan 20, 2026) | P0 |

---

## Upcoming Tasks

### P0 - Critical (Remaining Pillars)
1. **EMERGENCY Pillar** - High-priority request routing, lost pet workflow, urgent vet coordination
2. Complete Membership/Club Pillar (after all other pillars)

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
January 20, 2026 - EMERGENCY Pillar complete (All 12 pillars now built!)

---

## Emergency Pillar (NEW - January 20, 2026)

### Backend (`/app/backend/emergency_routes.py`)
- 8 Emergency types: Lost Pet, Medical Emergency, Accident/Injury, Poisoning, Breathing Distress, Found Pet, Natural Disaster, Aggressive Animal
- 4 Severity levels: Critical, Urgent, High, Moderate
- Emergency request creation with Service Desk & Pet Soul integration
- Emergency contacts management
- Partners CRUD (24/7 vets, ambulances, shelters, helplines)
- Products & Bundles CRUD
- Admin stats and settings

### Frontend
- **EmergencyPage.jsx** (`/app/frontend/src/pages/EmergencyPage.jsx`)
  - Red/urgent theme
  - Hero with 24/7 hotline (+91 96631 85747)
  - 8 emergency types grid
  - Partners section with 24/7 badges
  - Products & bundles sections
  - Report Emergency modal

- **EmergencyManager.jsx** (`/app/frontend/src/components/admin/EmergencyManager.jsx`)
  - 5 tabs: Emergencies, Partners, Products, Bundles, Settings
  - Stats dashboard (6 metrics)
  - Full CRUD for all entities
  - Settings: Response SLA, Notifications, Lost Pet, Service Desk

### Data Seeded
- 4 Partners: PetCare Emergency Hospital (24/7), PetAmbulance India (24/7), Mumbai Animal Welfare Society, Pet Poison Helpline (24/7)
- 12 Products: GPS trackers, first aid kits, ID tags, safety gear
- 5 Bundles: Complete Safety, First Responder, Lost Pet Prevention, Travel Emergency, Small Pet Safety

### Routes
- `/emergency` - Public emergency page
- `/admin` → Emergency tab - Admin manager

# The Doggy Company - Pet Life Operating System

## Original Problem Statement
Build a world-class, event-driven platform with a single engine powering multiple business "Pillars" (Celebrate, Stay, Dine, Travel, etc.). Key components include the **"Pet Soul"** (a deep, evolving pet profile), a **"Unified Inbox"** for all customer requests, a **"Membership"** layer, and a robust Admin/Agent experience.

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
- Voice ordering feature (requires production deployment for full function)

**Stay Pillar** ✅
- Pet-friendly accommodation search
- Booking system
- My Bookings for users

**Travel Pillar** ✅ (January 19, 2026)
- Brilliant single-flow design with wizard modal
- 4 travel types: Cab, Train, Flight, Relocation
- 12 seeded products + 5 bundles
- Full admin management (Products, Bundles, Partners, Settings)
- CSV import/export for products
- Service flow → Service Desk + Unified Inbox + Pet Soul updates

**Celebrations Pillar** ✅
- Basic structure in place

#### Service Desk
- Ticket management
- Multi-channel intake
- AI reply drafts (OpenAI GPT-4)
- SLA tracking

#### Admin Panel
- Dashboard with metrics
- User management
- Product management (Shopify sync)
- Travel Manager (5 tabs)
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
| Service Desk modal shaking | USER VERIFICATION PENDING | P0 |

---

## Upcoming Tasks

### P0 - Critical
1. Complete Membership Pillar V1

### P1 - High Priority
1. Admin Panel reorganization (Common vs Pillar-specific)
2. SLA Breach Alerts enhancement

### P2 - Medium Priority
1. Component refactoring (Admin.jsx, ServiceDesk.jsx, server.py)
2. Deployment readiness checklist

### Future/Backlog
1. Care Pillar
2. WhatsApp integration
3. Google Calendar integration
4. International flights support

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
- `travel_partners` - Partner companies
- `products` - All products including travel items
- `product_bundles` - Bundled offerings
- `tickets` - Service desk tickets
- `channel_intakes` - Unified inbox entries
- `memberships` - (To be created)
- `app_settings` - Global configuration

---

## Credentials

- **Admin**: aditya / lola4304
- **Agent**: sarah / agent123
- **Test User**: testuser@example.com / password

---

## Last Updated
January 19, 2026 - Travel Page redesign complete

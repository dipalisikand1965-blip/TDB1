# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System." The vision is a world-class, event-driven platform with a single engine powering 12 business "Pillars" (Celebrate, Dine, Travel, Stay, Enjoy, Care, Fit, Advisory, Club, Shop Assist, Paperwork, Emergency). Key components include the **"Pet Soul"** (a deep, evolving pet profile), a **"Unified Inbox"** for all customer requests, a **"Membership"** layer (the "Club" pillar), and a robust Admin/Agent experience.

## Core Architecture Principles
- **A. One Engine, Multiple Pillars**: A single backend for all pillars
- **B. Unified Input & Inbox**: Central admin inbox for all customer requests
- **C. Pet Soul**: A comprehensive, learning profile for each pet
- **D. Membership Layer (Club Pillar)**: To be built last
- **E. Automated Notifications & Service Desk**: Event-driven integration
- **F. World-Class Admin Experience**: Every pillar must have full-featured Admin Manager
- **G. Data Flywheel**: Intelligence layer connecting all features to Pet Soul

---

## What's Been Implemented

### January 2025 (Current Session)

#### Phase 1 - Admin Standardization ✅
- **CelebrateManager Created** - Full admin with Requests | Partners | Products | Bundles | Settings
- **CSV Import/Export Added** to Advisory, Paperwork, Emergency, Celebrate
- **Tags Manager Updated** - Now supports all 10 pillars

#### Pet Soul Integration - Celebrate Pillar ✅
- **Pet Selection in Product Modal** - Users can select from their registered pets
- **Auto-fill Pet Details** - Name, age, breed automatically filled from Pet Soul
- **Order History Recording** - Celebrate orders written to Pet Soul (`soul.celebrate_history`)
- **Preference Tracking** - Favorite cake categories tracked for recommendations
- **Backend Endpoint Added** - `POST /api/pets/{pet_id}/soul/celebrate`

---

## Current Pet Soul Integration Status

| Pillar | Fetches Pets | Pet Selection | Writes to Soul | Status |
|--------|-------------|---------------|----------------|--------|
| **Celebrate** | ✅ YES | ✅ YES | ✅ YES | **COMPLETE** |
| **Travel** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Care** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Emergency** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Paperwork** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Enjoy** | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| **Dine** | ✅ Yes | ✅ Yes | ❌ No | Needs update |
| **Fit** | ✅ Yes | ✅ Yes | ❌ No | Needs update |
| **Advisory** | ✅ Yes | ✅ Yes | ❌ No | Needs update |
| **Stay** | ❌ No | ❌ No | ❌ No | **NEEDS WORK** |

---

## Remaining Work

### P0 - Critical (Data Flywheel)
1. **Stay + Pet Soul** - Add pet selection to booking flow, write travel preferences
2. **Dine + Pet Soul** - Write dining preferences to soul
3. **Fit + Pet Soul** - Write fitness/activity data to soul
4. **Advisory + Pet Soul** - Write consultation history to soul
5. **Mira Proactive** - Enable birthday/anniversary suggestions from Pet Soul

### P1 - User Journey
6. New landing page with pillar showcase
7. Membership tiers (Club pillar)
8. Onboarding flow with Pet Soul creation
9. Auto-checkout per pillar

### P2 - Admin & Code
10. Complete admin tabs for Stay, Dine, Enjoy
11. Pillar-wise shipping rules
12. Campaign system
13. Code reorganization (backend folder structure)

---

## Key Files Modified This Session

### Backend
- `/app/backend/celebrate_routes.py` - NEW complete pillar routes
- `/app/backend/advisory_routes.py` - Added CSV import/export
- `/app/backend/paperwork_routes.py` - Added CSV import/export
- `/app/backend/emergency_routes.py` - Added CSV import/export
- `/app/backend/server.py` - Added `/api/pets/{pet_id}/soul/celebrate` endpoint

### Frontend
- `/app/frontend/src/components/admin/CelebrateManager.jsx` - NEW full admin
- `/app/frontend/src/components/admin/AdvisoryManager.jsx` - Added CSV buttons
- `/app/frontend/src/components/admin/PaperworkManager.jsx` - Added CSV buttons
- `/app/frontend/src/components/admin/EmergencyManager.jsx` - Added CSV buttons
- `/app/frontend/src/components/ProductCard.jsx` - **Pet Soul integration in product modal**

---

## Tech Stack
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI + MongoDB
- AI: OpenAI GPT-4 (via Emergent LLM Key)
- Payments: Razorpay (test keys)
- Email: Resend

## Credentials
- Admin: aditya / lola4304

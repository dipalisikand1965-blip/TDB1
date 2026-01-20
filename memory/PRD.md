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

## What's Been Implemented

### December 2025
- All 12 pillars built (Celebrate, Dine, Travel, Stay, Enjoy, Care, Fit, Advisory, Paperwork, Emergency, Club planned, Shop Assist)
- EMERGENCY Pillar completed end-to-end
- Mira AI + Pet Soul Integration
- "Seed All Pillars" feature with upsert protection
- Platform Audit completed

### January 2025 (Current Session)

#### Phase 1 - Admin Standardization (IN PROGRESS)
**CelebrateManager Created (NEW)**
- Full admin component with standard tabs: Requests | Partners | Products | Bundles | Settings
- CSV Import/Export for products and bundles
- Backend routes: `/api/celebrate/*`

**CSV Import/Export Added**
- Celebrate: ✅ Products + Bundles
- Advisory: ✅ Products + Bundles
- Paperwork: ✅ Products + Bundles  
- Emergency: ✅ Products + Bundles
- Care: Already had it
- Travel: Already had it
- Dine: Already had it
- Stay: Already had it

**Tags Manager Updated**
- Now includes all 10 pillars (was missing 5)

## Remaining Work

### P0 - Critical
1. **Build CLUB (Membership) Pillar** - Final major feature
2. **Complete Admin Standardization** - Some pillars still need Settings tab:
   - Stay: Missing Settings
   - Dine: Missing Settings, Requests
   - Enjoy: Missing Bundles tab
   - Paperwork: Missing Partners tab

### P1 - High Priority
3. **Pillar-wise Shipping Rules** - Currently general only
4. **Fulfillment Pillar Recognition** - Only recognizes "celebrate" pillar
5. **Campaigns System** - Build cross-pillar campaign feature
6. **Centralized Product Management** - Single view for all pillar products

### P2 - Medium Priority
7. Shopify Sync 'Untitled' Products bug (recurring)
8. Service Desk settings modal shaking
9. Voice Order connection issues
10. Auto-reminders only sent to Gmail

### Future
- Cross-pillar recommendations
- Proactive Mira AI suggestions
- Refactor server.py (break into route files)
- Admin Panel reorganization

## Key Files Reference
- `/app/backend/celebrate_routes.py` - NEW
- `/app/frontend/src/components/admin/CelebrateManager.jsx` - NEW
- `/app/backend/advisory_routes.py` - Updated with CSV
- `/app/backend/paperwork_routes.py` - Updated with CSV
- `/app/backend/emergency_routes.py` - Updated with CSV
- `/app/memory/PLATFORM_AUDIT.md` - Gap analysis

## Tech Stack
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI + MongoDB
- AI: OpenAI GPT-4 (via Emergent LLM Key)
- Payments: Razorpay (test keys)
- Email: Resend

## Credentials
- Admin: aditya / lola4304

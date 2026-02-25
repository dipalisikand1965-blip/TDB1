# MIRA PET OS - Product Requirements Document

## Original Problem Statement
Building "Mira," a "pet operating system" centered on "Soul Intelligence." The goal is a high-touch, personalized experience where the AI concierge proactively recommends products and services based on a pet's soul profile. All actions must generate service desk tickets ("Unified Service Command").

## Core Architecture

### Dual-Layer Architecture
1. **Pillar Pages (`/care`, `/dine`)**: A "freemium visual layer" where users can browse, and MiraChat guides them. Actions here are modal-based FlowModals.
2. **Mira-Demo Page (`/mira-demo`)**: A "central intelligence layer" with a single conversational bar (the "OS2 Bar"). This bar is the primary interface, where conversations drive actions.

### 6-Layer OS2 Architecture (mira-demo)
| Layer | ID | Purpose | 
|-------|-----|---------|
| **MOJO** | `mojo` | Pet Identity - "Who is this pet?" |
| **TODAY** | `today` | Time Layer - "What needs attention now?" |
| **PICKS** | `picks` | Intelligence Layer - "What should I get?" |
| **SERVICES** | `services` | Action Layer - "What can I book/arrange?" |
| **LEARN** | `learn` | Knowledge Layer - "How do I understand this?" |
| **CONCIERGE** | `concierge` | Human Layer - "I need real help" |

## What's Been Implemented

### February 25, 2026 - Care Pillar FlowModals Complete

**✅ Implemented:**
1. **Grooming FlowModal** - Full 6-step wizard
   - Mode selection (At Home / Salon / Mira Recommend)
   - Service format (Individual / Full Groom / Bundle / Maintenance)
   - Services selection (conditional)
   - Comfort & behavior questions
   - Logistics (address/area, timing)
   - Review & submit to Concierge

2. **Vet Visit FlowModal** - 5-step wizard
   - 10 visit reason options
   - Additional concerns multi-select
   - Timing & urgency
   - Handling preferences
   - Location preferences

3. **Boarding & Daycare FlowModal** - 5-step wizard
   - Service type (Daycare / Overnight / Extended / Mira Recommend)
   - Dates and urgency
   - Pet personality & needs
   - Accommodation preferences
   - Location

4. **Pet Sitting FlowModal** - 5-step wizard
   - Service type (Drop-in / House sitting / Mira Recommend)
   - Schedule
   - Tasks needed
   - Pet temperament
   - Location & access

5. **Emergency Help FlowModal** - 3-step fast-track
   - Emergency type (Vet Emergency / Lost Pet / Transport / After Hours)
   - Pet state (for vet emergencies)
   - Help needed & contact

6. **8 Care Subcategory Tabs** - All aligned with locked CARE categories
   - Grooming, Vet Visits, Boarding & Daycare, Pet Sitting
   - Behavior Support, Senior & Special Needs, Nutrition Consults, Emergency Help

**✅ Technical Implementation:**
- All FlowModals create tickets via POST `/api/tickets/`
- Flexbox layout ensures footer navigation always visible
- data-testid attributes for automated testing
- Draft saving to localStorage
- Pet context sidebar with real-time summary
- Progress bar and step navigation

### Earlier Implementations
- Care product taxonomy (18 products, 12 bundles)
- Admin CareManager CRUD
- MiraCarePlan proactive recommendations
- 8 locked CARE categories in CARE_TYPES

## Files Created/Modified This Session

### New Files:
- `/app/frontend/src/components/VetVisitFlowModal.jsx`
- `/app/frontend/src/components/CareFlowModal.jsx` (generic)
- `/app/frontend/src/schemas/vetVisitFlows.js`
- `/app/frontend/src/schemas/boardingDaycareFlows.js`
- `/app/frontend/src/schemas/petSittingFlows.js`
- `/app/frontend/src/schemas/emergencyHelpFlows.js`

### Modified Files:
- `/app/frontend/src/components/GroomingFlowModal.jsx` - Added data-testid, flexbox fix
- `/app/frontend/src/components/MiraCarePlan.jsx` - Opens FlowModals instead of direct tickets
- `/app/frontend/src/pages/CarePage.jsx` - Added all FlowModal imports and state
- `/app/frontend/src/components/PillarPageLayout.jsx` - Updated PILLAR_SUBCATEGORIES.care
- `/app/frontend/src/schemas/groomingFlows.js` - Updated payload builder

## Prioritized Backlog

### P0 - Immediate
- [x] Fix Continue button visibility in FlowModals
- [x] Grooming FlowModal end-to-end ticket creation
- [x] Vet Visit FlowModal
- [x] Boarding & Daycare FlowModal
- [x] Pet Sitting FlowModal
- [x] Emergency Help FlowModal

### P1 - Next
- [ ] Behavior Support FlowModal (lighter flow)
- [ ] Senior & Special Needs FlowModal
- [ ] Nutrition Consults FlowModal
- [ ] Dual-layer sync (Care actions → mira-demo SERVICES tab)
- [ ] MiraCarePlan recommendations → mira-demo PICKS tab

### P2 - Future
- [ ] Full GROOMING_OS.md integration
- [ ] TransformationStories backend connection
- [ ] End-to-end notification flow (Resend/Gupshup)
- [ ] Voice commands integration
- [ ] Razorpay payments

## Test Credentials
- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

## Key API Endpoints
- POST `/api/tickets/` - Create service desk ticket
- GET `/api/mira/care-plan/{pet_id}` - Get MiraCarePlan recommendations
- GET `/api/care/products` - Get care products
- POST `/api/auth/login` - Login

## Database Collections
- `tickets` - Service desk tickets
- `products_master` - Care products and bundles
- `pets` - Pet profiles with soul data
- `users` - Member accounts

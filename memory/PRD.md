# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build a comprehensive Pet Life Operating System platform for The Doggy Company, featuring AI-powered pet care assistant (Mira), gamification elements, and a modern 7-tab header navigation system.

## Core Requirements

### P0 - Critical 
- [x] **Production Deployment Fix** - Service worker disabled, ErrorBoundary handles chunk errors
- [x] **CSS Chunk Loading Fix (2026-02-13)** - Removed problematic `ios-premium.css` import that was causing CSS chunk load failures on production
  - **Root Cause**: `ios-premium.css` imported non-existent Google Fonts (SF Pro - Apple proprietary)
  - **Files Fixed**: `MiraDemoPage.jsx`, `MiraOSPage.jsx`
  - **Working URL**: https://mira-css-fix.preview.emergentagent.com
- [x] **MOJO Profile Modal - Phase 1 (2026-02-13)** - Pet Identity Layer (Pet OS Core)
  - **Entry Points**: "78% SOUL" badge and pet name both open MOJO modal
  - **Features**: Pet Snapshot, Soul Profile (default expanded), Health Profile, Diet & Food, Behaviour & Training, Grooming & Care, Routine Tracker, Documents Vault, Life Timeline, Preferences & Constraints, Membership & Rewards
  - **Files Created**: `/app/frontend/src/components/Mira/MojoProfileModal.jsx`
  - **Files Modified**: `MiraDemoPage.jsx`, `SoulKnowledgeTicker.jsx`, `PetSelector.jsx`

### P1 - High Priority
- [ ] **Header Shell Integration** - Refactor `/mira-demo` page with 7-tab navigation
  - Use "dual placement" strategy for component migration
  - Map components from `NavigationDock` and `FloatingActionBar` to new tabs
- [ ] **Port Missing Features from Backup Page** - Migrate personalization features from `MiraDemoBackupPage.jsx`:
  - Weather Card integration
  - Health Vault Progress indicator  
  - "Why for {Pet}" badges on recommendations
- [ ] **MOJO Modal Phase 2** - Complete remaining sections:
  - Connect real membership/rewards data from backend
  - Add edit functionality for each section
  - Implement proactive questions engine

### P2 - Medium Priority
- [ ] Render API data in new tabs (`picks[]`, `concierge{}`, `safety_override{}`)
- [ ] Mobile UX verification (iOS Safari, Android Chrome)
- [ ] Fix markdown rendering in chat responses
- [ ] Fix pet photo display bug

## Completed Work

### 2026-02-13 (Latest Session)

#### 1. Uniform Service Handoff Flow (P0) ✅ **NEW**
Implemented the execution-ready pillar of Mira OS - when user triggers a service action, the system now:

**Implementation:**
- Detects service triggers: "arrange table", "book grooming", "nutrition consult", "book vet", "book boarding", "travel planning"
- Creates ticket in `concierge_tasks` collection with `source: mira_service_handoff`
- Returns `service_confirmation` object with ticket_id, service_name, status, icon, message
- Frontend shows confirmation card (emerald/teal gradient) with service details
- Toast notification: "Service Request Confirmed!"

**Service Triggers:**
| Trigger | Service Name | Category |
|---------|-------------|----------|
| arrange a table | Table Reservation | dine |
| book grooming | Grooming Appointment | care |
| nutrition consult | Nutrition Consultation | care |
| book vet | Vet Appointment | care |
| book boarding | Boarding Arrangement | stay |

**Files Modified:**
- Backend: `/app/backend/mira_routes.py` (lines 9610-9750)
- Frontend: `/app/frontend/src/components/MiraChatWidget.jsx` (lines 1028-1052, 1571-1600)

**Test Results:** 10/10 backend tests passed (iteration_172.json)

#### 2. MIRA OS Conversational Flow Refactor (P0) ✅
Completely refactored the place search conversation to follow Mira OS doctrine:

**Mira OS Doctrine Implemented:**
- **Pet-first**: Anchors all conversations with pet name + traits
- **Context-aware**: Doesn't ask for info already known (e.g., location from pet_context)
- **Memory-driven**: Uses pet's temperament, energy level in responses
- **Max 2 questions rule**: Only asks what's MISSING
- **Execution-ready**: Always offers action options at end

**Flow Example:**
```
User: "I want to take Mojo out for lunch"
Mira: "That sounds lovely — an outing with Mojo.
       Based on what I know about him — high energy, playful and friendly — 
       I'll look for spaces that suit his comfort.
       Just one quick detail: Indoor café or outdoor seating preferred?"

User: "Outdoor please"
Mira: "Here are a few places that would suit Mojo's comfort.
       I can:
       • check availability
       • arrange a table
       • confirm pet policies
       Which would you like me to arrange for Mojo?"
       [Shows 4 Google Places results with PlacesWithConcierge component]
```

**Pronoun System:**
- Female pet (gender: "female") → she/her
- Male pet (gender: "male") → he/his  
- Unknown gender → they/their

**Test Results:** 11/11 tests passed (iteration_171.json)

#### 2. Allergy Capture Flow (Previous)
- When user clicks "Yes, has allergies" → Mira asks for specific allergies
- Quick-select chips: Chicken, Beef, Grains/Wheat, Dairy, Multiple
- Saves to `doggy_soul_answers.food_allergies` in Pet Soul as a list
- File: `/app/backend/mira_routes.py` (lines 9622-9744)

#### 3. Production Deployment Fix
- Disabled service worker completely
- ErrorBoundary clears cache and reloads on chunk errors
- ⚠️ **Still BLOCKED**: CDN cache purge needed from Emergent support

### Previous Sessions
- Member Logic E2E Verification completed
- Header Shell prototype created at `/mira-os`
- Fixed corrupted `.gitignore` file
- Added `GET /api/pets/{pet_id}/soul` endpoint

## Architecture

### Frontend
```
/app/frontend/
├── public/
│   ├── meta.json (version manifest)
│   └── service-worker.js
├── src/
│   ├── components/
│   │   ├── mira/
│   │   │   └── HeaderShell.jsx (7-tab header)
│   │   └── ErrorBoundary.jsx (chunk error handling)
│   ├── pages/
│   │   ├── MiraDemoPage.jsx
│   │   └── MiraOS/MiraOSPage.jsx (Prototype)
│   └── serviceWorkerRegistration.js (DISABLED)
```

### Backend
```
/app/backend/
├── mira_routes.py 
│   ├── Uniform Service Handoff Flow (lines 9610-9750) **NEW**
│   ├── Allergy capture flow (lines 9750-9880)
│   └── Location/Place search flow (lines 9880-10500)
├── mira_concierge_handoff.py (Concierge task management)
├── soul_intelligence.py (save_soul_enrichment function)
└── services/google_places_service.py
```

## Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

## Known Issues
- **CDN Caching**: Production domain serving stale CSS chunks - needs Emergent CDN purge
- **Preview URL works**: https://mira-css-fix.preview.emergentagent.com

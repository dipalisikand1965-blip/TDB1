# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build a comprehensive Pet Life Operating System platform for The Doggy Company, featuring AI-powered pet care assistant (Mira), gamification elements, and a modern 7-tab header navigation system.

## Core Requirements

### P0 - Critical 
- [x] **Production Deployment Fix** - Service worker disabled, ErrorBoundary handles chunk errors
  - ⚠️ **BLOCKED**: CDN cache purge needed from Emergent support
  - **Working URL**: https://luna-chat-fix.preview.emergentagent.com

### P1 - High Priority
- [ ] **Header Shell Integration** - Refactor `/mira-demo` page with 7-tab navigation
  - Use "dual placement" strategy for component migration
  - Map components from `NavigationDock` and `FloatingActionBar` to new tabs
  - **BLOCKED** on production CDN issue

### P2 - Medium Priority
- [ ] Render API data in new tabs (`picks[]`, `concierge{}`, `safety_override{}`)
- [ ] Mobile UX verification (iOS Safari, Android Chrome)
- [ ] Fix markdown rendering in chat responses
- [ ] Fix pet photo display bug

## Completed Work

### 2026-02-13 (Latest Session)

#### 1. Allergy Capture Flow
- When user clicks "Yes, has allergies" → Mira asks for specific allergies
- Quick-select chips: Chicken, Beef, Grains/Wheat, Dairy, Multiple
- Saves to `doggy_soul_answers.food_allergies` in Pet Soul as a list
- Fixed bug: `'list' object has no attribute 'split'` when allergies stored as list
- File: `/app/backend/mira_routes.py` (lines 9622-9744)

#### 2. Location-Based Search Flow
- **Before**: Mira would show results from wrong location (e.g., Vijayawada from IP) while asking for location
- **After**: Mira asks "Which city and area?" FIRST before showing any results
- User specifies location → THEN Google Places API is called
- Added support for areas: Koramangala, Indiranagar, Whitefield, HSR, BTM, Bandra, Andheri, Powai, etc.
- File: `/app/backend/mira_routes.py` (lines 9746-9815)

**Flow:**
```
User: "Find me a restaurant"
Mira: "Which city and area would you like me to search in?"
[Chips: Koramangala, Indiranagar, Bandra, Use my location]

User: "Koramangala"
Mira: [Shows pet-friendly restaurants in Koramangala]
```

#### 3. Production Deployment Fix
- Disabled service worker completely
- ErrorBoundary clears cache and reloads on chunk errors
- Version checker for future deployments
- Files modified:
  - `/app/frontend/src/serviceWorkerRegistration.js`
  - `/app/frontend/src/components/ErrorBoundary.jsx`
  - `/app/frontend/public/index.html`

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
│   ├── Allergy capture flow (lines 9622-9744)
│   └── Location confirmation flow (lines 9746-9815)
├── soul_intelligence.py (save_soul_enrichment function)
└── services/google_places_service.py
```

## Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

## Known Issues
- **CDN Caching**: Production domain serving stale CSS chunks - needs Emergent CDN purge
- **Preview URL works**: https://luna-chat-fix.preview.emergentagent.com

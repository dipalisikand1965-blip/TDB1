# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build a comprehensive Pet Life Operating System platform for The Doggy Company, featuring AI-powered pet care assistant (Mira), gamification elements, and a modern 7-tab header navigation system.

## Core Requirements

### P0 - Critical 
- [x] **Production Deployment Fix** - Implemented version-checking and force-reload mechanism
  - Service worker disabled to prevent caching issues
  - ErrorBoundary catches chunk errors and clears cache
  - ⚠️ **BLOCKED**: CDN cache purge needed from Emergent support
  - **Working URL**: https://reload-fix-7.preview.emergentagent.com

### P1 - High Priority (In Progress)
- [ ] **Header Shell Integration** - Refactor `/mira-demo` page with 7-tab navigation
  - Use "dual placement" strategy for component migration
  - Map components from `NavigationDock` and `FloatingActionBar` to new tabs
  - Keep `/orders` and `/family-dashboard` as route links
  - Mobile-responsive layout
  - **BLOCKED** on production CDN issue

### P2 - Medium Priority
- [ ] Render API data in new tabs (`picks[]`, `concierge{}`, `safety_override{}`)
- [ ] Mobile UX verification (iOS Safari, Android Chrome)
- [ ] Fix markdown rendering in chat responses
- [ ] Fix pet photo display bug

### P3 - Low Priority
- [ ] Refactor `mira_routes.py` backend file
- [ ] B7 analytics and B8 scenario testing
- [ ] Dashboard API improvements
- [ ] Orders API fix (currently 405 error)

## Completed Work

### 2026-02-13 (Latest)
- **Allergy Capture Flow**: Implemented full allergy capture in Mira chat
  - User says "Yes, has allergies" → Mira asks for specifics
  - Quick-select chips: Chicken, Beef, Grains/Wheat, Dairy, Multiple
  - Saves to `doggy_soul_answers.food_allergies` in Pet Soul
  - Confirmation with success tip card
  - File: `/app/backend/mira_routes.py` (lines 9610-9720)

- **Production Deployment Fix (P0)**: 
  - Disabled service worker completely to prevent caching
  - ErrorBoundary clears cache and reloads on chunk errors
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
├── scripts/
│   └── update-version.js
├── src/
│   ├── components/
│   │   ├── mira/
│   │   │   └── HeaderShell.jsx (7-tab header)
│   │   └── ErrorBoundary.jsx (chunk error handling)
│   ├── pages/
│   │   ├── MiraDemoPage.jsx
│   │   └── MiraOS/MiraOSPage.jsx (Prototype)
│   ├── utils/
│   │   └── versionChecker.js
│   └── serviceWorkerRegistration.js (DISABLED)
```

### Backend
```
/app/backend/
├── mira_routes.py (Allergy capture flow added)
├── soul_intelligence.py (save_soul_enrichment function)
└── pet_soul_routes.py
```

## Key Technical Decisions
1. **Service Worker Disabled**: To prevent CDN/cache conflicts
2. **Allergy Flow**: Direct save to `doggy_soul_answers.food_allergies` 
3. **Version Checking**: Using timestamp-based versioning with localStorage

## Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

## Reference Documents
- `/app/memory/component_inventory.md` - Component audit for header migration
- `/app/test_reports/iteration_*.json` - Test results

## Known Issues
- **CDN Caching**: Production domain serving stale CSS chunks - needs Emergent CDN purge
- **Preview URL works**: https://reload-fix-7.preview.emergentagent.com

# The Doggy Company - Product Requirements Document

## Original Problem Statement
Build a comprehensive Pet Life Operating System platform for The Doggy Company, featuring AI-powered pet care assistant (Mira), gamification elements, and a modern 7-tab header navigation system.

## Core Requirements

### P0 - Critical (Completed)
- [x] **Production Deployment Fix** - Implement version-checking and force-reload mechanism to solve CSS chunk loading errors after deployments
  - `meta.json` version manifest
  - `versionChecker.js` utility for automatic detection and reload
  - Service worker updates for SKIP_WAITING handling
  - Pre-build script for version generation

### P1 - High Priority (In Progress)
- [ ] **Header Shell Integration** - Refactor `/mira-demo` page with 7-tab navigation
  - Use "dual placement" strategy for component migration
  - Map components from `NavigationDock` and `FloatingActionBar` to new tabs
  - Keep `/orders` and `/family-dashboard` as route links
  - Mobile-responsive layout

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

### 2026-02-13
- **Production Deployment Fix (P0)**: Implemented automatic version-checking mechanism
  - Created `/app/frontend/public/meta.json` - Version manifest
  - Created `/app/frontend/src/utils/versionChecker.js` - Version check logic
  - Created `/app/frontend/scripts/update-version.js` - Build-time version generator
  - Updated `/app/frontend/package.json` - Added prebuild hook
  - Updated `/app/frontend/public/service-worker.js` - Added SKIP_WAITING handler
  - Updated `/app/frontend/src/index.js` - Integrated version checker

### Previous Sessions
- Member Logic E2E Verification completed
- Header Shell prototype created at `/mira-os`
- Fixed corrupted `.gitignore` file
- Added `GET /api/pets/{pet_id}/soul` endpoint
- Service worker chunk exclusion rules added

## Architecture

### Frontend
```
/app/frontend/
├── public/
│   ├── meta.json (NEW - version manifest)
│   └── service-worker.js (MODIFIED)
├── scripts/
│   └── update-version.js (NEW)
├── src/
│   ├── components/mira/
│   │   └── HeaderShell.jsx (NEW - 7-tab header)
│   ├── pages/
│   │   ├── MiraDemoPage.jsx (TO BE MODIFIED)
│   │   └── MiraOS/MiraOSPage.jsx (Prototype)
│   ├── utils/
│   │   └── versionChecker.js (NEW)
│   └── index.js (MODIFIED)
```

### Backend
```
/app/backend/
└── routes/
    └── pet_soul_routes.py (MODIFIED)
```

## Key Technical Decisions
1. **Version Checking**: Using timestamp-based versioning with localStorage comparison
2. **Cache Busting**: Aggressive cache clearing + service worker unregistration on version mismatch
3. **Auto-Reload**: Silent automatic reload (no user prompt needed)

## Test Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

## Reference Documents
- `/app/memory/component_inventory.md` - Component audit for header migration
- `/app/test_reports/iteration_*.json` - Test results

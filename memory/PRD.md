# The Doggy Company - Mira AI Pet Companion

## Original Problem Statement
Build and maintain the Mira AI Pet Companion feature for The Doggy Company platform. Key requirements from users:
1. Remove prices from Concierge Suggestion cards
2. Trigger "Picks" panel from chat command ("Show me personalized picks for Mojo")
3. Implement category/pillar picker in UI
4. Allow individual item selection instead of sending all items
5. Full UI/UX audit for mobile and desktop with haptic feedback
6. Beautiful redesign of Concierge cards
7. Display 5 catalogue + 5 concierge picks per pillar
8. Confirmation modal before sending to concierge
9. Selection summary panel
10. Expandable catalogue item cards

## Core Architecture
```
/app
├── backend (FastAPI)
│   ├── routes/
│   │   ├── mira_routes.py - Chat intent detection
│   │   └── top_picks_routes.py - Picks retrieval logic
│   └── utils/haptic.py
├── frontend (React)
│   └── src/
│       ├── components/
│       │   ├── PicksVault/UnifiedPicksVault.jsx - Main picks component
│       │   └── Mira/ - Mira-related components
│       ├── pages/MiraDemoPage.jsx - Main demo page
│       └── hooks/mira/ - Custom hooks
└── test_top_picks.py
```

## What's Been Implemented
**Date: Feb 11, 2026**

### Backend
- ✅ Intent detection for opening picks vault from chat
- ✅ Picks retrieval: 5 catalogue + 5 concierge per pillar
- ✅ Detailed data structure for concierge suggestions
- ✅ Fixed "Fit" and "Learn" pillar data bugs
- ✅ "Cat" product filtering

### Frontend
- ✅ `UnifiedPicksVault.jsx` - Unified picks, tips, personalized picks
- ✅ `ConciergeCard.jsx` - Beautiful dark-theme cards
- ✅ `ExpandablePickCard.jsx` - Expandable catalogue items
- ✅ `ConciergeConfirmationModal.jsx` - Confirmation before sending
- ✅ `CustomRequestBox.jsx` - Custom user input
- ✅ `SelectionSummaryPanel.jsx` - Review selections
- ✅ Pillar filter tabs
- ✅ Individual item selection with checkboxes
- ✅ Removed floating "C" button
- ✅ Haptic feedback utility

## Current Status
**UI Status:** ✅ Working (verified Feb 11, 2026)
- The MiraDemoPage and UnifiedPicksVault render correctly
- All components loading properly
- No critical console errors

## Prioritized Backlog

### P1 - High Priority
- [ ] Haptic & UX Audit Implementation - 19 components need haptic feedback

### P2 - Medium Priority
- [ ] Refactor `UnifiedPicksVault.jsx` (4000+ lines) into smaller components

### P3 - Low Priority / Future
- [ ] Full mobile/desktop visual polish
- [ ] Performance optimizations

## Key API Endpoints
- `POST /api/mira/os/understand-with-products` - Main chat endpoint
- `GET /api/mira/top-picks/<pet_name>` - Curated picks for pet

## Database Schema
**unified_products collection:**
```json
{
  "name": "String",
  "pillars": ["Array of pillar IDs"],
  "pillar": "String",
  "tags": ["Array"],
  "in_stock": "Boolean",
  "visibility": { "status": "String" }
}
```

## Test Credentials
- Email: dipali@clubconcierge.in
- Password: test123

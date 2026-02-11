# The Doggy Company - Mira AI Pet Companion

## Original Problem Statement
Build and maintain the Mira AI Pet Companion feature for The Doggy Company platform. Core philosophy: "Mira knows your pet" - a premium, personalized concierge experience, not generic e-commerce.

### Key Requirements
1. Remove prices from Concierge Suggestion cards
2. Trigger "Picks" panel from chat command
3. Implement category/pillar picker in UI
4. Allow individual item selection (not bulk sending)
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
│       │   ├── Mira/
│       │   │   ├── PersonalizedPicksPanel.jsx - NEW main picks component
│       │   │   ├── ConciergeDetailModal.jsx - Concierge item modal
│       │   │   ├── ConciergeServiceStrip.jsx - Expandable services
│       │   │   └── ...
│       │   ├── ProductCard.jsx - Contains ProductDetailModal
│       │   └── PicksVault/UnifiedPicksVault.jsx - Conversation picks
│       ├── pages/MiraDemoPage.jsx - Main demo page
│       └── hooks/mira/ - Custom hooks
```

## What's Been Implemented

**Latest Update: Feb 11, 2026**

### P0 Bug Fix - COMPLETED
- Fixed: Products now correctly add to request list from ProductDetailModal
- The `onAddToPicks` callback properly passes from PersonalizedPicksPanel to ProductDetailModal
- handleAddToCart in ProductCard.jsx correctly checks and uses the callback
- Fixed console error: Changed `setIsLoading` to `setIsProcessing` in MiraDemoPage.jsx

### PersonalizedPicksPanel Feature - COMPLETED
- Built new `PersonalizedPicksPanel.jsx` from scratch replacing old TopPicksPanel
- Dark theme matching site design
- Personalized headers ("Mojo's Curated Finds")
- Side-by-side layout: Catalogue Picks | Concierge Picks
- Product modals via ProductDetailModal with "Add to Picks" functionality
- Concierge modals via ConciergeDetailModal
- Mini-cart at bottom for selection review
- "Anything Else" free-text custom request field
- Confirmation modal before sending to concierge
- Success callback adds confirmation message to chat

### Backend
- Intent detection for opening picks vault from chat
- Picks retrieval: 5 catalogue + 5 concierge per pillar
- `/api/mira/top-picks/{pet_name}` - Curated picks endpoint
- `/api/concierge/picks-request` - Submit picks to concierge
- Session history limited to 3 sessions per `/api/past_chats`

### Frontend Components
- `PersonalizedPicksPanel.jsx` - Main picks component (NEW)
- `ConciergeDetailModal.jsx` - Matching modal for concierge picks
- `ConciergeServiceStrip.jsx` - Expandable service categories
- `ProductDetailModal` in ProductCard.jsx - Product details with variant selection
- Pillar filter tabs with haptic feedback
- Individual item selection with visual feedback

## Current Status
**Status: WORKING** (Verified Feb 11, 2026 via testing agent)

Full flow tested:
1. Login -> Dashboard
2. Navigate to /mira-demo
3. Open PersonalizedPicksPanel
4. Click catalogue product -> ProductDetailModal opens
5. Click "Add to Picks" -> Product added to mini-cart
6. Click "Send to My Concierge" -> Confirmation modal
7. Confirm -> Success message in chat

## Prioritized Backlog

### P1 - High Priority
- [ ] Integrate ConciergeServiceStrip into PersonalizedPicksPanel
- [ ] ServiceQuickViewModal on /services page
- [ ] Mobile UI & Haptics audit - fix button cut-offs on iOS

### P2 - Medium Priority
- [ ] "Anything Else" field capture in API submission
- [ ] Review UnifiedPicksVault for conversation-specific picks polish
- [ ] Refactor ProductDetailModal out of ProductCard.jsx into separate file

### P3 - Low Priority / Future
- [ ] Performance optimizations
- [ ] Full mobile/desktop visual polish
- [ ] Investigate root cause of original UI distortion bug

## Key API Endpoints
- `POST /api/mira/os/understand-with-products` - Main chat endpoint
- `GET /api/mira/top-picks/{pet_name}` - Curated picks for pet
- `POST /api/concierge/picks-request` - Submit picks request
- `GET /api/past_chats` - Conversation history (limited to 3 sessions)

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

## Files of Reference
- `src/components/Mira/PersonalizedPicksPanel.jsx` - Main picks panel
- `src/components/ProductCard.jsx` - ProductDetailModal component (lines 489-1542)
- `src/pages/MiraDemoPage.jsx` - Main page integration
- `src/components/Mira/ConciergeDetailModal.jsx` - Concierge item modal

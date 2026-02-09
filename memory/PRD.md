# Mira OS - Product Requirements Document

## Original Problem Statement
Mira OS is a pet concierge application that provides personalized pet care recommendations, services, and products. The app features conversational AI (Mira) that understands pet context, handles various pillars (Celebrate, Care, Learn, etc.), and integrates with Shopify for product recommendations.

## Core Architecture
- **Frontend**: React.js with premium UI (MiraDemoPage.jsx ~6000 lines)
- **Backend**: FastAPI/Flask Python backend
- **Database**: MongoDB with products_master, pets, users collections
- **External APIs**: Google Places, Shopify (thedoggybakery.com), OpenAI

## Recent Session (Feb 2025) - Completed Work

### 1. Shopify Product Sync ✅
- Synced **392 products** from thedoggybakery.com
- Categories: cakes (106), breed-cakes (69), mini-cakes (48), hampers (39), accessories, etc.
- All products have beautiful Shopify CDN images
- Breed-specific cakes available: Indie, Labrador, Golden Retriever, Beagle, etc.

### 2. Celebrate Pillar Test Scenarios ✅
- Updated TEST_SCENARIOS with 15 celebrate-focused test cases
- Covers: Birthday, Gotcha Day, Diwali, Holi, Christmas, Micro-celebrations

### 3. "Friend's Dog" Context Bug ✅
- **Fixed**: Mira no longer confuses friend's pet with user's registered pet
- Detection phrases: "friend's dog", "neighbor's cat", "someone else's pet", etc.
- When detected: Skips pet context, asks about the OTHER pet

### 4. Barking Question Misclassification ✅
- **Fixed**: "I don't know what to do about my dog's barking" no longer triggers "overwhelm"
- Added behavior_keywords filter to exclude behavior questions from overwhelm
- Added "seeking_help" undertone category for advisory questions

### 5. UI Repositioning ✅
- Added smart suggestion chips BELOW input bar (context-aware)
- Chips change based on last message context (celebrate, groom, health, food)
- Enhanced haptic feedback on tray open/close

### 6. Haptic Feedback Enhancement ✅
- Added `trayOpen()` and `trayClose()` to haptic.js
- Applied to Ready for [Pet] button and tray overlay

## Key Files Modified
- `backend/mira_routes.py` - Breed boost, friend's dog detection, behavior classification
- `frontend/src/pages/MiraDemoPage.jsx` - Smart chips, haptic integration
- `frontend/src/utils/haptic.js` - New tray haptic functions
- `frontend/src/styles/mira-premium.css` - Smart chips CSS

## Pending/Upcoming Tasks

### P0 - In Progress
1. **Product/Service Recommendation Architecture** - Smart Suggestion Cards (design doc at `/app/memory/MIRA_PRODUCT_SERVICE_ARCHITECTURE.md`)

### P1 - Upcoming
1. **Long-Term Memory** - Store pet preferences, health issues in DB
2. **MiraDemoPage Refactoring** - Break 6000-line file into smaller components

### P2 - Future
1. **Proactive Intelligence** - Smart reminders (vet check-ups, birthdays)
2. **Multi-Modal Understanding** - Image upload support

## Test Reports
- Latest: `/app/test_reports/iteration_112.json`
- Backend: 100% pass rate (12/12 tests)
- Frontend: Code verified, UI loads correctly

## Known Limitations
- MiraDemoPage.jsx is very large (~6000 lines) - screenshot tool may crash
- Foursquare API keys are invalid (deprecated in favor of Google Places)

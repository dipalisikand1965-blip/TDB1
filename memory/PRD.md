# THE DOGGY COMPANY - PRD
## Updated: February 21, 2026

## What Was Done
- Full site audit of thedoggycompany.in (15 pillars, 3 Miras, APIs, console errors)
- Deep Mira Demo audit (all 5 tabs, chat, voice, soul data)
- **Cloned full TDB1 codebase (68MB, 200+ docs, 100+ backend files) into this workspace**
- **Got the entire Doggy Company platform running locally** (backend + frontend)
- Seeded Mystique pet with full soul data (allergies, personality, anxiety triggers, favorites)
- Fixed babel-metadata-plugin crash for complex codebase (disabled visual-edits)
- **Verified soul data loading**: Chicken allergy badge shows, personalized responses work

## What's Working in This Workspace
- Homepage, all pillar pages, Mira Demo
- Login: dipali@clubconcierge.in / test123
- Chat AI with soul-aware responses
- Picks populate after chat (+7 items)
- Soul score (87%) displays
- Allergy warnings ("Strict avoids: chicken")
- Voice TTS responses

## Remaining Issues to Fix
1. Duplicate quick reply chips (verify - may already be fixed in this version)
2. SERVICES tab redirects to /shop instead of in-page
3. CONCIERGE tab "Failed to load" 
4. Test scenarios don't auto-hide after use
5. Voice auto-plays without consent
6. CORS for pet-engage-hub icon-state API (only affects live domain)

## Key Files
- Backend: /app/backend/server.py (807KB), /app/backend/mira_routes.py
- Frontend: /app/frontend/src/pages/MiraDemoPage.jsx (211KB)
- Bibles: /app/memory/MIRA_BIBLE.md, DIPALI_VISION.md, MOJO_BIBLE.md

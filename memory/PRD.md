# THE DOGGY COMPANY - PRD
## Updated: February 21, 2026

## Current Status: RUNNING IN site-audit-check WORKSPACE

### What's Working
- Full site running: Homepage, 15 pillar pages, Mira Demo, Shop, Services
- Login: dipali@clubconcierge.in / test123 
- **8 pets seeded with soul data**: Mystique (87%), Luna (88%), Mojo (78%), Meister (56%), Bruno (29%), Lola (9%), Buddy (10%), TestScoring (100%)
- Multi-pet switching works on Mira Demo
- Soul data loads: Chicken allergy badge shows, personality traits display
- AI chat responds with personalized soul-aware responses
- PICKS +7 items populate after chat
- Voice TTS works
- Pillar pages: Mira OS BETA button + Ask Mira FAB present
- Care page "847 fitness journeys" wrong copy still present (needs fix)

### Known Issues Remaining
1. SERVICES tab on Mira Demo redirects to /shop 
2. CONCIERGE tab shows "Failed to load concierge data"
3. Test Scenarios don't auto-hide after clicking
4. Voice auto-plays without consent
5. Care/Stay pages show "847 fitness journeys" (wrong copy)
6. Personality traits show same for all pets (Glamorous soul, Elegant paws, Devoted friend)

### Architecture
- Backend: FastAPI on port 8001 (807KB server.py + 100+ route files)
- Frontend: React with Craco (4909-line MiraDemoPage.jsx + 200+ components)
- Database: Local MongoDB (test_database)
- AI: Emergent LLM Key for GPT responses
- Products: Shopify integration
- Voice: ElevenLabs TTS

### Key Credentials
- User: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304
- GitHub: dipalisikand1965-blip/TDB1 (branch: tdb123)

# MIRA OS - CHANGELOG

## [2026-02-10] - Major Intelligence & Soul Score Update

### Added

**Conversation Intelligence** (`/app/backend/conversation_intelligence.py`)
- Pronoun resolution: "that one", "the first one", "book that"
- Follow-up context: "cheaper ones", "show me more", "can I include eggs?"
- 8 new tip card types: festival_safety, celebration_tips, new_pet_guide, home_tips

**Soul Score Dynamic Glow** (`/app/frontend/src/styles/mira-prod.css`)
- `soul-grow-pulse` animation - bursts when score increases
- `soul-breathe` animation - constant subtle glow
- `score-count` animation - number counts up

**User Pets Endpoint** (`/app/backend/auth_routes.py`)
- `GET /api/auth/pets` - Returns logged-in user's pets with soul scores and photos

**Enhanced InsightsPanel** (`/app/frontend/src/components/Mira/InsightsPanel.jsx`)
- Tip cards section with icons
- Memory context section ("What I know about Pet")
- Quick tips section

**WhatsApp/Gupshup Integration** (`/app/backend/whatsapp_routes.py`)
- Gupshup webhook handler
- Gupshup send message endpoint
- Auto-creates tickets from WhatsApp messages

### Fixed

**Pillar Detection**
- "celebrate mojo" → celebrate (was: advisory)
- "gotcha day" → celebrate (was: advisory)
- "not eating 2 days" → emergency (was: advisory)
- "limping badly" → emergency (was: advisory)
- "teach to sit" → learn (was: advisory)
- "diwali safety" → celebrate with festival_safety tip card

**PlacesVault**
- nearby_places (restaurants, cafes) now properly stored in miraPicks
- PlacesVault renders when user asks about pet cafes/restaurants

**HandoffSummary**
- Now detects all 12 pillars correctly from conversation context

### Test Results
- 30/30 query tests passing (100%)
- Backend tests: 13/13 passing
- Soul Score API returning correct values

---

## [Previous Sessions]
See `/app/memory/PRD.md` for historical changes

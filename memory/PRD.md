# The Doggy Company - Mira AI Pet Companion

## Original Problem Statement
The user wants MIRA to function as a "Lifestyle OS" rather than a simple chatbot. Key principles from the MIRA BIBLE:
- Context-aware (temporally, personally)
- Proactive (anticipates needs)
- Safe (respects allergies, health constraints)
- OS-like behavior (picks update dynamically, layers activate based on conversation)

## Core Requirements
1. **Pet Intelligence** - Use stored profile (age, allergies, health flags, behavior)
2. **Live Conversation Context** - Infer active pillar, topic signals, risk level
3. **Always-On Loop** - Classify pillar, generate picks, apply safety gates
4. **Concierge Pick Cards** - "Arranged for [Pet]" language, actionable CTAs
5. **Connect to Concierge** - Always available for coordination-heavy pillars

## What's Implemented

### Backend Intelligence (VERIFIED ✅)
- **OS Context Generation** (`mira_routes.py`)
  - `layer_activation` - Active pillar detection
  - `temporal_context` - Birthday detection, upcoming events
  - `safety_gates` - Allergy extraction from pet profile
  - `picks_update` - Signal for frontend to refresh picks
  - `memory_recall` - Relevant past memories surfaced

### DINE Pillar OS-Awareness (IMPLEMENTED ✅ Feb 12, 2026)
- **Pillar Keywords Updated**: Added home nutrition keywords
- **DINE Context Generation**: Returns pet's diet info, allergies, restrictions
- **DINE Picks Generation**: Diet Transition, Portioning, Treat Strategy, etc.
- **Correct Chat Flow**: Asks 2-3 targeted questions per MIRA BIBLE

### STAY Pillar OS-Awareness (IMPLEMENTED ✅ Feb 12, 2026)
- **Pillar Keywords Updated**: Boarding, daycare, hotel, alone time, home setup, etc.
- **STAY Context Generation**: Returns temperament, vaccinations, social comfort, health flags
- **STAY Picks Generation**: Concierge Pick Cards with `concierge_always: true`:
  - Boarding Shortlist (matched to temperament + vaccinations)
  - In-Home Sitter Brief (for anxious dogs)
  - Home Stay Layout Plan (zones, gates, safety)
  - Daycare Shortlist (energy + social comfort matched)
  - Pet-Friendly Hotel Search (`uses_google_places: true`)
  - Comfort Corner Setup (seniors, recovery)
- **Concierge Handoff**: Always available for STAY (`concierge_handoff.available: true`)
- **Google Places Integration**: Hotel searches signal `uses_google_places: true`

### Frontend OS Context Handling (IMPLEMENTED ✅)
- Temporal Alert Display
- Safety Gates Logging
- Proactive Alerts Integration
- Memory Recall Display

### Admin Panel (VERIFIED ✅)
- Pet Parents Directory
- Member Profile Console with 10 tabs

## Test Verification (Feb 12, 2026)

### STAY Pillar Tests
| Query | Pillar | Picks Generated | Concierge |
|-------|--------|-----------------|-----------|
| "Find pet-friendly boarding" | stay | Boarding Shortlist, Hotel Search | ✅ Available |
| "Pet-friendly hotel in Mumbai" | stay | Hotel Search (uses_google_places) | ✅ Available |
| "Can dog stay alone at home?" | stay | Home Stay Layout Plan | ✅ Available |
| "Daycare options" | stay | Daycare Shortlist | ✅ Available |

### DINE Pillar Tests
| Query | Pillar | Picks Generated |
|-------|--------|-----------------|
| "Create meal plan" | dine | Diet Assessment, Nutrition Consult |
| "How much to feed?" | dine | Portioning Setup |
| "Switch to new food" | dine | Diet Transition Plan |

### Non-Affected Pillars
| Query | Expected | Result |
|-------|----------|--------|
| "Birthday party" | celebrate | ✅ PASS |
| "Grooming appointment" | care | ✅ PASS |

## Known Issues
1. **Frontend Page Crash** (P1) - MiraDemoPage.jsx (4247 lines) causes memory issues
2. **Chat Response Duplication** (P2) - Reported but not reproduced

## Architecture
```
/app
├── backend/
│   └── mira_routes.py         # OS Intelligence Layer
│       - get_mira_os_context() # Generates pillar-specific context
│       - PILLARS dict          # All 14+ pillars with keywords
│       - DINE context/picks    # Home nutrition support
│       - STAY context/picks    # Boarding/daycare/hotel support
│       - concierge_handoff     # Always available for STAY
├── frontend/
│   └── pages/MiraDemoPage.jsx # Main Mira UI
└── memory/
    └── PRD.md                 # This file
```

## Pillar-to-Pillar Mapping (per MIRA BIBLE Questionnaire)

The questionnaire document defines 20 pillars with detailed question flows:
1. CELEBRATE - Birthdays, festivals, micro-celebrations
2. DINE - Core food decisions, portions, allergies, treats
3. STAY - Home base, boarding, daycare, hotels
4. TRAVEL - Trips, transport, relocation
5. CARE - Health, wellness, vet coordination
6. ENJOY - Play, activities, socializing
7. FIT - Exercise, weight management
8. LEARN - Training, behavior
9. EMERGENCY - Crisis handling
10. FAREWELL - End of life support
11. ADOPT - New pet guidance
12. ADVISORY - Expert coordination
13. PAPERWORK - Records, documents
14. SHOP - Product curation
15. DOG WALKING - Walking services
16. PET PHOTOGRAPHY - Photo sessions
17. GROOMING - Grooming services
18. TRAINING - Professional trainers
19. BOARDING - Overnight stays (detailed)
20. DAYCARE - Daytime care (detailed)

## Upcoming Tasks (Priority Order)

### P0 - Critical
- [x] ~~Implement "Dine" pillar OS-awareness~~ ✅ DONE
- [x] ~~Implement "Stay" pillar OS-awareness with Concierge~~ ✅ DONE
- [ ] Fix frontend memory issues (code splitting MiraDemoPage)

### P1 - High Priority
- [ ] Implement TRAVEL pillar OS-awareness
- [ ] Implement CARE pillar OS-awareness
- [ ] Surface proactive alerts prominently on main OS page
- [ ] Implement new header architecture

### P2 - Medium Priority
- [ ] Implement OS-awareness for remaining pillars
- [ ] Response streaming (SSE)
- [ ] Voice-text synchronization

### Future
- [ ] Add all Concierge services from questionnaire
- [ ] Implement "TODAY" badge
- [ ] Notifications bell

## API Endpoints
- `POST /api/mira/chat` - Main chat with os_context
  - Returns: pillar, os_context (layer_activation, temporal_context, safety_gates)
  - DINE: dine_context, dine_picks
  - STAY: stay_context, stay_picks, concierge_handoff, uses_google_places

## Test Credentials
- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304
- **Test Pet**: Mojo (pet-99a708f1722a), birthday Feb 14, chicken allergy

---
*Last Updated: February 12, 2026*
*Preview URL: https://mira-kibble-flow.preview.emergentagent.com*

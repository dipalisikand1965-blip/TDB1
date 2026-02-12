# The Doggy Company - Mira AI Pet Companion

## Original Problem Statement
Build and maintain the Mira AI Pet Companion feature for The Doggy Company platform. Key requirements:
1. Personalized Picks Panel - A soulful concierge experience, not e-commerce
2. Products and concierge services organized by pillars (Celebrate, Dine, Care, etc.)
3. Multi-select flow: User can select multiple items before sending
4. Confirmation modal INSIDE the panel (not in chat)
5. After confirm, panel closes and success message appears in chat
6. **iOS Premium Experience** - Apple App Store quality across the site
7. **Soul Score Consistency** - Score synced across all pages (MiraDemo, MyPets, Dashboard)

## Test Credentials (IMPORTANT - Use These!)
- **Member Login**: dipali@clubconcierge.in / test123
- **Admin Login**: aditya / lola4304

## Core Architecture
```
/app
├── backend (Node.js/Express + FastAPI)
│   ├── server.py - Main application
│   ├── pet_soul_routes.py - Soul Score + Quick Questions API
│   ├── mira_memory_routes.py - Memory + "What Mira Knows" API
│   ├── mira_memory.py - Memory storage system
│   └── pet_score_logic.py - Soul Score calculation (authoritative)
├── frontend (React)
│   └── src/
│       ├── components/
│       │   └── Mira/
│       │       ├── PersonalizedPicksPanel.jsx - Multi-select picks panel
│       │       ├── SoulKnowledgeTicker.jsx - Dynamic soul ticker (LINKS TO MY PETS)
│       │       └── ConciergeServiceStrip.jsx - Expandable service categories
│       ├── pages/
│       │   ├── MiraDemoPage.jsx - Main Mira interface
│       │   └── MyPets.jsx - Pet profiles with "What Mira Knows" section
│       └── utils/
│           └── haptic.js - Premium haptic feedback system
└── test_reports/ - Testing output
```

## What's Been Implemented (Feb 12, 2026)

### SOUL SCORE SYSTEM OVERHAUL (COMPLETE)

**1. Score Consistency Fix**
- Fixed inconsistency between endpoints (all now use `pet_score_logic.calculate_pet_soul_score`)
- Soul Score now identical on MiraDemo, MyPets, and Dashboard
- Test verified: Mojo at 56.1% across all pages

**2. Soul Score Badge Links to My Pets**
- `SoulKnowledgeTicker.jsx` updated - clicking badge navigates to `/my-pets?pet={petId}`
- Uses `useNavigate` hook from react-router-dom
- External link icon added for UX clarity

**3. "What Mira Knows" Section on My Pets**
- New expandable section showing all knowledge about a pet
- Combines:
  - Soul Profile data (personality, allergies, behaviors)
  - Memories from conversations
  - AI-generated insights
- Fetches from `/api/mira/memory/pet/{pet_id}/what-mira-knows`

**4. Dynamic Quick Questions (Max 3 per session)**
- New API: `GET /api/pet-soul/profile/{pet_id}/quick-questions?limit=3`
- Returns unanswered questions from diverse folders
- Prioritizes high-weight questions
- Session tracking prevents question fatigue

### Previous Implementations

**iOS Premium Experience (COMPLETE)**
- Premium CSS with spring physics animations
- Enhanced Haptic System with 40+ feedback patterns
- Safe area insets for notched iPhones

**Personalized Picks Flow (COMPLETE)**
- Multi-select products and services by pillar
- Confirmation modal inside panel
- Single confirmation message on submit (Bug fixed - was showing 3 messages)

## API Endpoints

### Soul Score APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pet-soul/profile/{pet_id}` | GET | Full pet soul profile |
| `/api/pet-soul/profile/{pet_id}/quick-questions` | GET | Unanswered questions (max 3) |
| `/api/pet-soul/profile/{pet_id}/answer` | POST | Save soul answer |
| `/api/pet-soul/profile/{pet_id}/progress` | GET | Profile completion progress |

### Memory APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mira/memory/pet/{pet_id}/what-mira-knows` | GET | Combined soul + memories |
| `/api/mira/memory/pet/{pet_id}` | GET | Pet memories by type |
| `/api/mira/memory/me` | GET | All user memories |

### Core APIs
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mira/os/understand-with-products` | POST | Main chat endpoint |
| `/api/mira/top-picks/{pet_name}` | GET | Curated picks for pet |
| `/api/concierge/picks-request` | POST | Submit picks to concierge |

## User Flow Summary

### Soul Score Flow
```
1. User visits /mira-demo
2. Soul Score badge shows current % (e.g., "56% SOUL")
3. Click badge → Navigates to /my-pets?pet={petId}
4. Pet tab opens with "What Mira Knows" expanded
5. User can see all knowledge + answer more questions
6. Score updates in real-time across all pages
```

### Personalized Picks Flow
```
1. Click [data-testid="personalized-picks-btn"]
2. Panel slides up with products + concierge services
3. Click items to toggle selection (pink checkmark)
4. Click "Send to My Concierge" button at bottom
5. Confirmation modal appears IN PANEL
6. Click "Confirm"
7. Panel closes
8. Chat shows: "Your X personalized picks have been sent to your Concierge!"
```

## Remaining Tasks

### P0 - Critical
- [x] Soul Score consistency across pages
- [x] Score badge links to My Pets
- [x] "What Mira Knows" section
- [x] Dynamic quick questions

### P1 - High Priority
- [ ] Cross-session memory surfacing in Mira conversations
- [ ] Proactive birthday alerts
- [ ] Shimmer loading effects when AI is processing
- [ ] Confetti animation on successful pick confirmation

### P2 - Medium Priority
- [ ] Refactor: Extract ProductDetailModal to its own file
- [ ] Remove deprecated TopPicksPanel and related dead code
- [ ] Score breakdown by pillar on My Pets page
- [ ] "Help Mira know" prompts in chat

### P3 - Low Priority
- [ ] Performance optimization for heavy MiraDemoPage
- [ ] Refactor UnifiedPicksVault.jsx (4000+ lines)
- [ ] Enhanced typing indicator for AI
- [ ] Message reactions (heart/paw icons)
- [ ] Tinder-style swipe card interface for picks panel

### OS v2 Roadmap (Future)
- Phase 2: Pillar Intelligence - Intent recognition for 15 pillars
- Phase 3: Service Intelligence
- Phase 4: Proactive Intelligence
- Phase 5: Deep Personalization
- Phase 6: Ecosystem Completion

## Score Calculation (IMPORTANT FOR FUTURE AGENTS)

The authoritative score calculation is in `/app/backend/pet_score_logic.py`:
- Uses 6-category weighted system (Safety, Personality, Lifestyle, Nutrition, Training, Relationships)
- Total 100 points
- Server.py and all APIs must use `calculate_pet_soul_score()` from this file
- DO NOT use the 8-folder calculation in `pet_soul_routes.py` for display scores

## Known Issues
- MiraDemoPage.jsx is 5600+ lines - needs refactoring
- Meilisearch unavailable (non-blocking)
- Some pets have stale `overall_score` in DB - recalculate on display

# The Doggy Company - Mira AI Pet Companion

## Original Problem Statement
Build and maintain the Mira AI Pet Companion feature with deep personalization.

**Mira is the SOUL of the dog** - She is the brain, the super mother who knows every single dog intimately. She never gives general stuff - she associates with breed, age, lifestyle, likes, dislikes, allergies and more to be the Pet Operating System.

## THE MIRA BIBLE (Critical - Read /app/memory/MIRA_BIBLE.md)

> **Mira is NOT a chatbot, NOT a shop, NOT a dashboard.**
> **Mira is a Lifestyle Operating System. Concierge is her hands.**

### Mira's Essence:
- She remembers the birthday.
- She knows Mojo's temperament.
- She quietly updates Picks.
- She shapes options clearly.
- She asks only what she must.

### Core Principles:
1. Everything is layered. Chat is always underneath.
2. Each layer has one job (Mojo/Today/Picks/Services/Insights/Learn/Concierge)
3. Mira asks as little as possible
4. Catalogue-first, Concierge-always
5. User never feels redirected - Mira expands, executes, returns

## Test Credentials (IMPORTANT!)
- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

## Core Architecture
```
/app
├── backend (Node.js/Express + FastAPI)
│   ├── server.py - Main application
│   ├── pet_soul_routes.py - Soul Score + Quick Questions API
│   ├── mira_memory_routes.py - Memory + "What Mira Knows" API
│   └── pet_score_logic.py - Soul Score calculation
├── frontend (React)
│   └── src/
│       ├── components/Mira/
│       │   ├── SoulKnowledgeTicker.jsx - Soul badge + "What Mira Knows" panel
│       │   ├── PetSelector.jsx - Dropdown with clickable scores
│       │   └── WelcomeHero.jsx - Pet hero image
│       ├── pages/MiraDemoPage.jsx - Main Mira interface
│       └── styles/mira-prod.css - Premium styling
└── test_reports/
```

## What's Been Implemented (Feb 12, 2026)

### "WHAT MIRA KNOWS" PANEL - COMPLETE ✅

**Design Matches User's Screenshot:**
1. **Score Circle at Top** - Large circle showing percentage + "SOUL KNOWN" label
2. **Action Buttons Row** - History, Soul Questions, Profile, Add Memory buttons
3. **Two-Column Grid:**
   - **SOUL Section (Purple)** - Soul Score percentage, personality traits, "Help Mira know better" CTA
   - **BREED Section (Cyan/Teal)** - Pet breed name, exercise requirements, breed personality traits
   - **MEMORY Section (Amber)** - Spans both columns, memory count, recent conversation memories
4. **View Full Profile Button** - Navigates to `/my-pets?pet={petId}`

**API Endpoint:**
```
GET /api/mira/memory/pet/{pet_id}/what-mira-knows

Response:
{
  "pet_id": "pet-xxx",
  "pet_name": "Mystique",
  "pet_breed": "Shihtzu",
  "overall_score": 24.5,
  "soul_knowledge": [...],     // Soul profile items
  "breed_knowledge": [...],    // Breed-specific traits
  "memory_knowledge": [...],   // Conversation memories
  "insights_knowledge": [...]  // AI insights
}
```

**Breed-Specific Knowledge:**
- Exercise requirements (e.g., "Shihtzus need 30-45 minutes daily exercise")
- Personality traits (e.g., "Shihtzus are naturally affectionate")
- Supports: Golden Retriever, Labrador, German Shepherd, Beagle, Bulldog, Poodle, Shihtzu, Yorkshire Terrier, Indie, Dachshund, Husky, Maltese

### Previous Implementations
- ✅ Soul Score consistency across all pages
- ✅ Dropdown scores clickable → Navigate to pet profile
- ✅ Z-index fix for ticker
- ✅ Pet hero image 200px+ with glow
- ✅ Score sync after answering questions
- ✅ iOS Premium Experience (haptic feedback, spring animations)

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mira/memory/pet/{pet_id}/what-mira-knows` | GET | Full knowledge (Soul, Breed, Memory) |
| `/api/pet-soul/profile/{pet_id}/quick-questions` | GET | Max 3 unanswered questions |
| `/api/pet-soul/profile/{pet_id}/answer` | POST | Save soul answer |
| `/api/mira/top-picks/{pet_name}` | GET | Personalized picks |
| `/api/concierge/picks-request` | POST | Submit picks |

## User Flow: Soul Score Interaction
```
1. User sees Soul Score badge (e.g., "63% SOUL") in ticker
2. Click badge → "What Mira knows about [Pet]" panel opens
3. Panel shows:
   - Large score circle (63% SOUL KNOWN)
   - Action buttons row (4 icons)
   - SOUL section (purple) - Soul score, personality
   - BREED section (cyan) - Breed name, exercise, traits
   - MEMORY section (amber) - Memory count, recent conversations
4. "View Full Profile" → Navigate to /my-pets?pet={petId}
5. "Help Mira know better" → Opens soul questions
```

## Remaining Tasks

### P1 - High Priority
- [ ] Cross-session memory surfacing ("I remember...") in Mira conversations
- [ ] Geolocation auto-detect with session persistence
- [ ] Proactive birthday alerts enhancement
- [ ] Shimmer loading effects

### P2 - Medium Priority
- [ ] Confetti animation on successful pick confirmation
- [ ] Score breakdown by pillar on My Pets page
- [ ] Quick questions in chat area (currently in ticker)

### P3 - Low Priority
- [ ] Refactor MiraDemoPage.jsx (5600+ lines)
- [ ] Performance optimization
- [ ] Tinder-style swipe for picks

### OS v2 Roadmap
- Phase 2: Pillar Intelligence
- Phase 3: Service Intelligence
- Phase 4: Proactive Intelligence
- Phase 5: Deep Personalization
- Phase 6: Ecosystem Completion

## Key Design Principles
1. **Mira is the Soul** - Knows everything intimately
2. **Pet is the Hero** - Large avatar with glow
3. **Personalization First** - Never generic
4. **iOS Premium** - Apple quality
5. **Score Visibility** - Always visible and linked

# Pet Operating System - PRD

## Original Problem Statement
Transform a standard e-commerce site into a "Personal Pet Operating System" that is deeply magical, personalized, and emotionally resonant for the pet parent. The user wants:
1. **"Meister as the Hero":** The entire UX should revolve around the user's pet
2. **Emotional Connection:** Magical UI elements that create an emotional bond
3. **Unified & Seamless Design:** All pages share consistent, personalized header design
4. **Seamless Navigation:** Product/Service toggle and pillar navigation
5. **Hyper-Personalized Content:** Breed-specific and unique messaging
6. **De-emphasize E-commerce:** Focus on "caring" not "shopping"

---

## CRITICAL REFERENCE: MIRA DOCTRINE

> **ALL AGENTS MUST READ `/app/memory/MIRA_DOCTRINE.md` BEFORE ANY MIRA-RELATED WORK**

This file contains the canonical guide to Mira's voice, tone, and behavior. Key principles:

1. **Presence before performance** - Acknowledge feelings before giving information
2. **Knowledge is remembered. Execution is invited.** - Never bulldoze with a plan
3. **Remember → Confirm → Act** - Always ask before deciding
4. **Products after alignment** - Suggestions are secondary, optional
5. **Concierge as quiet option** - Never "escalation" or "ticketing"
6. **Never a dead end** - Always provide a next step
7. **Boundary rules** - Medical/legal/ethical handled with care

---

## Current Status: MIRA OS PHASE 3 IN PROGRESS

### MIRA OS - The Pet Life Operating System
**Vision**: "Mira is not a chatbot. Mira is the operating system for dog life."

**The One Sentence**: "Knowledge is remembered. Execution is invited."

---

## PHASE 3 COMPLETE - Feb 7, 2026

### ✅ Mira Doctrine Implemented
**The Transformation**: Mira went from a "smart recommendation engine" to a "trusted companion"

**Before** (Wrong):
> "Since Buddy is a Golden Retriever, I've planned a pool party with fetch games..."

**After** (Correct):
> "I'm really glad you told me. When a cough keeps showing up, it's natural to feel worried, especially with a dog like Buddy who's usually full of energy. I can't assess medical conditions myself, but a persistent cough is something a veterinarian should look at so you're not left guessing. If you'd like, I can help you find a trusted vet nearby, so you can focus on Buddy."

### ✅ Test Scenarios Panel
8 scenarios for role-playing Mira's responses at `/mira-demo`:
- 🎂 Birthday - Tests emotional acknowledgment and alignment question
- 🏥 Health Concern - Tests presence before performance
- 🦴 Find Treats - Tests simple product discovery
- ✈️ Travel - Tests remember → confirm → act
- 😰 Anxiety - Tests emotional support
- 🍽️ Food Choice - Tests asking before recommending
- 🌈 Farewell - Tests pure presence, no performance
- ✂️ Grooming - Tests service coordination

### ✅ Feedback System (P1)
- 👍/👎 buttons on every Mira response
- Endpoint: `POST /api/mira/feedback`

### ✅ Remember Command (P1)
- Endpoint: `POST /api/mira/remember`
- Stores pet facts for future context

### ✅ Dock Navigation (P1)
All 5 dock items functional:
| Item | Action |
|------|--------|
| Concierge | Opens Mira AI chat widget |
| Orders | Navigates to /orders |
| Plan | Navigates to /family-dashboard?tab=calendar |
| Help | Opens help modal with options |
| Soul | Navigates to /pet-soul/{petId} |

### ✅ Safety Tips Display
When health concerns detected, shows red alert box:
- "Important to Watch For:" section
- Breed-specific safety information
- Emergency guidance

### ✅ Enhanced Concierge Handoff UI
- "Your Pet Concierge is on it" header
- Estimated response time displayed
- Gradient styling with user icon
- "Chat with Concierge" button

---

## Test Results (Iteration 100)
- **Backend**: 11/11 tests passed (100%)
- **Frontend**: All UI features working (100%)
- See: `/app/test_reports/iteration_100.json`

---

## Key Files Modified This Session
- `/app/backend/mira_routes.py` - Rich concierge prompts, feedback/remember endpoints
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Dock navigation, feedback buttons, help modal
- `/app/memory/MIRA_ANALYSIS_REPORT.md` - Comprehensive vision vs reality analysis

---

## NEXT PRIORITIES

### P0 - Add to Cart Integration
- Connect product cards in Mira responses to actual cart
- Currently shows `alert()` - needs real cart API

### P1 - Proactive Mode
- Birthday approaching alerts
- Reorder suggestions
- Weather-based tips

### P1 - Voice Output
- Text-to-speech for Mira responses
- Accessibility improvement

### P2 - Concierge Dashboard Enhancement
- Admin view for Mira-generated tickets
- Pet context visible
- Quick response templates

---

## REFERENCE DOCUMENTS
- `/app/memory/MIRA_OPERATING_SPEC.md` - Full specification
- `/app/memory/MIRA_MASTERPLAN.md` - Feature roadmap
- `/app/memory/MIRA_ANALYSIS_REPORT.md` - Vision vs reality analysis

### Completed Features (Earlier Sessions)

#### 1. ✅ UNIFIED PILLAR PAGE DESIGN - COMPLETE
All 15 pillar pages now use the unified `PillarPageLayout` with emotionally-driven "dog soul colors":

| Pillar | Soul Colors | Emotional Feel |
|--------|-------------|----------------|
| Celebrate | Pink/Rose gradient | Joy, festivity |
| Dine | Orange/Amber gradient | Warmth, nourishment |
| Care | Blue/Teal gradient | Trust, comfort |
| Enjoy | Yellow/Orange gradient | Playfulness, happiness |
| Travel | Blue/Sky gradient | Freedom, adventure |
| Stay | Green/Forest gradient | Security, coziness |
| Fit | Teal/Cyan gradient | Energy, vitality |
| Learn | Blue/Indigo gradient | Growth, intelligence |
| Advisory | Slate/Gray gradient | Wisdom, clarity |
| Emergency | Red/Orange gradient | Urgency, alertness |
| Paperwork | Blue/Slate gradient | Trust, security |
| Farewell | Purple/Violet gradient | Peace, remembrance |
| Adopt | Pink/Purple gradient | Love, new beginnings |
| Shop | Indigo/Purple gradient | Discovery |
| Services | Teal/Green gradient | Care, professionalism |

#### 2. Header Copy (Per User's Table)
| Pillar | Main Heading | Tagline |
|--------|-------------|---------|
| Celebrate | Celebrations for {name} | Mark the moments that matter |
| Dine | Food & Treats for {name} | Chosen around taste, energy, and needs |
| Care | Everyday Care for {name} | Support for health, comfort, and routine |
| Enjoy | Joyful Experiences for {name} | Play, enrichment, and little delights |
| Travel | Travel with {name} | Thought through so the journey feels easy |
| Stay | Places {name} Feels at Home | Stays where welcome and comfortable |
| Fit | Movement & Energy for {name} | Activity that matches rhythm |
| Learn | Learning with {name} | Training and guidance that respects personality |
| Advisory | Guidance for {name} | When clarity helps before deciding |
| Emergency | If Something Feels Urgent | Immediate support when it matters most |
| Paperwork | Paperwork for {name} | Handled quietly, without stress |
| Farewell | Honouring {name} | Support with dignity and care |
| Adopt | Finding the Right Companion | Thoughtful matching, not impulse |
| Shop | Products for {name} | Thoughtfully curated for how {name} lives |
| Services | Services for {name} | Trusted help, when needed |

#### 3. Voice Search Functionality
- Added Web Speech API integration to UnifiedHero.jsx
- Microphone button in search bar starts/stops voice recognition
- Shows "Listening..." indicator when active
- **Status**: UI implemented, needs backend integration for search

#### 4. All Pillar Pages Working with Unified Design
- ✅ /celebrate, /dine, /care, /enjoy, /travel, /stay
- ✅ /fit, /learn, /advisory, /emergency, /paperwork
- ✅ /farewell, /adopt, /shop, /services

#### 5. Sub-Pages with Category-Specific Heroes
Added routes and hero content for all sub-pages:
- /dine/fresh-meals, /dine/treats, /dine/desi-treats, /dine/frozen, /dine/supplements
- /care/grooming, /care/health, /care/supplements, /care/spa
- /enjoy/toys, /enjoy/chews, /enjoy/games, /enjoy/puzzles
- /travel/carriers, /travel/car, /travel/outdoor
- /stay/beds, /stay/mats, /stay/kennels, /stay/bowls
- /fit/leashes, /fit/harnesses, /fit/collars, /fit/apparel
- /learn/training, /learn/puzzles, /learn/books

#### 6. Components Created/Updated
- `PillarPageLayout.jsx` - Reusable layout component with UnifiedHero
- `UnifiedHero.jsx` - Hero with voice search & pillar-specific soul colors
- `PillarContext.jsx` - Central config for all pillar soul colors and messaging
- All pillar pages refactored to use PillarPageLayout

### Testing Status (Latest: iteration_257)
- All 15 main pillar pages: ✅ PASS
- All sub-pages: ✅ PASS
- Voice search button present: ✅ PASS
- Products/Services toggle: ✅ REMOVED (too clinical)
- Subcategory pills navigation: ✅ PASS
- "Shopping for another dog?" link: ✅ PASS
- Soul colors rendered correctly: ✅ PASS
- Mobile wobble fix: ✅ PASS
- Pet images with fallback: ✅ PASS
- Soul Journey clickable: ✅ PASS (navigates to /pet-soul/{petId})
- Soul badge glass effect: ✅ PASS (backdrop-blur-lg)
- Soul badge contextual messaging: ✅ PASS (Start/Continue/Complete)
- Trait badges animation: ✅ PASS (float-gentle keyframes)
- Multi-pet unique traits: ✅ PASS (breed-based + hash for variety)
- Pet switching across pages: ✅ PASS (petSelectionChanged event)
- Farewell empathy messaging: ✅ PASS
- Global pet switching: ✅ PASS (PillarContext syncs with localStorage)
- No JavaScript errors: ✅ PASS
- Success rate: 100%

### Completed in This Session (February 6, 2026)
1. ✅ Removed "Products/Services" toggle (was clinical, not emotionally resonant)
2. ✅ Fixed mobile wobbling issue (comprehensive overflow control in index.css)
3. ✅ Verified all sub-pillar routes work with category-specific hero content
4. ✅ Confirmed pet images load with DiceBear fallback
5. ✅ Subcategory pills now primary navigation with "Shopping for another dog?" on right
6. ✅ **Fixed Soul Journey clickability** - Links to specific pet's soul page
7. ✅ **Fixed pet switching** - PillarContext syncs with localStorage + petSelectionChanged event
8. ✅ **Fixed PillarProvider** - Added PillarProvider to App.js provider hierarchy
9. ✅ **Fixed SoulScoreArc** - Accepts children prop for wrapper pattern
10. ✅ **Soul badge glass effect** - Subtle backdrop-blur-lg with border-white/10
11. ✅ **Contextual soul journey messaging** - "Start/Continue/shines bright" based on progress
12. ✅ **Animated trait badges** - Float-gentle animation with staggered delays
13. ✅ **Multi-pet unique traits** - 6 breed pools + hash function for variety
14. ✅ **Farewell empathy** - Gentle, empathetic messaging in PillarContext

### Remaining/Future Tasks
1. **P0** - User verification of Mira OS `/mira-demo` page
2. **P1** - Add Mira to Main Site Header (replace existing search)
3. **P1** - Make voice search functional (connect to backend/Mira)
4. **P2** - Build Thin Dock Navigation
5. **P2** - Finalize comprehensive page audit document
6. **P3** - Contextual pillar messaging (birthday awareness, festivals)
7. **P3** - Time-of-day aware greetings
8. **P3** - Add subtle animations for "magical" feel
9. **P3** - Improve AI logic for "Why for [PetName]" whispers
10. **BACKLOG** - Fix missing pet photos (data issue - Mojo)
11. **BACKLOG** - Fix duplicate names (data issue - "Lola Lola")

## Architecture

### Frontend
- React (Vite)
- Tailwind CSS
- Shadcn UI
- React Router

### Backend
- Python FastAPI
- MongoDB

### Key Files
- `/app/frontend/src/App.js` - Main router
- `/app/frontend/src/components/` - Reusable components
- `/app/frontend/src/pages/` - Page components
- `/app/frontend/src/context/` - React contexts

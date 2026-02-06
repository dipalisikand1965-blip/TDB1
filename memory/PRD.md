# Pet Operating System - PRD

## Original Problem Statement
Transform a standard e-commerce site into a "Personal Pet Operating System" that is deeply magical, personalized, and emotionally resonant for the pet parent. The user wants:
1. **"Meister as the Hero":** The entire UX should revolve around the user's pet
2. **Emotional Connection:** Magical UI elements that create an emotional bond
3. **Unified & Seamless Design:** All pages share consistent, personalized header design
4. **Seamless Navigation:** Product/Service toggle and pillar navigation
5. **Hyper-Personalized Content:** Breed-specific and unique messaging
6. **De-emphasize E-commerce:** Focus on "caring" not "shopping"

## Current Status: MIRA OS IN PROGRESS

### MIRA OS - The Pet Life Operating System
**Vision**: Transform from e-commerce to AI-first conversational interface where "Mira" understands user intent, context (pet's needs, history), and decides whether to execute instantly or hand off to human Concierge.

#### Phase 1 (IN PROGRESS): Connect Mira to Real Products
**Status**: ✅ BACKEND COMPLETE, FRONTEND NEEDS USER VERIFICATION

**Completed (Feb 6, 2026):**
- ✅ Fixed database connection error in `mira_routes.py`
- ✅ Fixed `TypeError: 'dict' object has no attribute 'lower'` with safe type conversion helpers
- ✅ Backend `/api/mira/os/understand-with-products` returns REAL products from database
- ✅ Products include actual prices, images, and personalized "why_for_pet" reasons
- ✅ Fixed frontend `MiraDemoPage.jsx` handleSubmit declaration order issue
- ✅ Added useCallback pattern for voice recognition callback

**API Test (WORKING):**
```bash
curl -X POST /api/mira/os/understand-with-products -d '{
  "input": "show me birthday cakes for dogs",
  "pet_context": {"name": "Max", "breed": "Labrador"}
}'
# Returns:
# - success: true
# - has_real_products: true
# - Products: Dog Birthday Cake Hamper (₹1599), Breed Birthday Cake Hamper (₹1899), etc.
```

**Files Modified:**
- `/app/backend/mira_routes.py` - Added `safe_lower()`, `safe_string_list()` helpers
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Fixed handleSubmit ordering with useCallback

#### Next Steps (Mira OS Roadmap)
1. **P0** - User verification of `/mira-demo` page functionality
2. **P1** - Add Mira to Main Site Header (replace existing search bar)
3. **P1** - Make Voice Search Functional (browser speech recognition)
4. **P2** - Build Thin Dock Navigation (`Concierge | Orders | Plan | Help | Soul`)

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

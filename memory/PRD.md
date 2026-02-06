# Pet Operating System - PRD

## Original Problem Statement
Transform a standard e-commerce site into a "Personal Pet Operating System" that is deeply magical, personalized, and emotionally resonant for the pet parent. The user wants:
1. **"Meister as the Hero":** The entire UX should revolve around the user's pet
2. **Emotional Connection:** Magical UI elements that create an emotional bond
3. **Unified & Seamless Design:** All pages share consistent, personalized header design
4. **Seamless Navigation:** Product/Service toggle and pillar navigation
5. **Hyper-Personalized Content:** Breed-specific and unique messaging
6. **De-emphasize E-commerce:** Focus on "caring" not "shopping"

## Current Status: WORKING

### Completed Features (February 6, 2025)

#### 1. Header Copy Updated (Per User's Table)
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

#### 2. Voice Search Functionality
- Added Web Speech API integration to UnifiedHero.jsx
- Microphone button in search bar starts/stops voice recognition
- Shows "Listening..." indicator when active

#### 3. All Pillar Pages Working
- /celebrate, /dine, /care, /enjoy, /travel, /stay, /fit, /learn
- /advisory, /emergency, /paperwork, /farewell, /adopt
- /shop, /services

#### 4. Sub-Pages with Category-Specific Heroes
Added routes and hero content for all sub-pages:
- /dine/fresh-meals, /dine/treats, /dine/desi-treats, /dine/frozen, /dine/supplements
- /care/grooming, /care/health, /care/supplements, /care/spa
- /enjoy/toys, /enjoy/chews, /enjoy/games, /enjoy/puzzles
- /travel/carriers, /travel/car, /travel/outdoor
- /stay/beds, /stay/mats, /stay/kennels, /stay/bowls
- /fit/leashes, /fit/harnesses, /fit/collars, /fit/apparel
- /learn/training, /learn/puzzles, /learn/books

#### 5. Components Created/Updated
- `PillarPageLayout.jsx` - Reusable layout component
- `UnifiedHero.jsx` - Updated with voice search & new copy
- `PillarContext.jsx` - Updated with Mira whispers per pillar
- `ProductListing.jsx` - Added category-specific hero content

### Testing Status
- All 15 main pillar pages: PASS
- All 6 tested sub-pages: PASS
- Voice search button: PASS
- Products/Services toggle: PASS
- Success rate: 100%

### Files Modified
- /app/frontend/src/components/UnifiedHero.jsx
- /app/frontend/src/components/PillarPageLayout.jsx
- /app/frontend/src/context/PillarContext.jsx
- /app/frontend/src/pages/ProductListing.jsx
- /app/frontend/src/pages/DinePage.jsx
- /app/frontend/src/pages/CarePage.jsx
- /app/frontend/src/pages/EnjoyPage.jsx
- /app/frontend/src/pages/TravelPage.jsx
- /app/frontend/src/pages/AdvisoryPage.jsx
- /app/frontend/src/App.js (added sub-page routes)

### Remaining/Future Tasks
1. **P2** - Update remaining pillar pages (Stay, Fit, Learn, etc.) to use unified `PillarPageLayout`
2. **P2** - Remove product/service counts from all pages
3. **P3** - Relocate "All Breeds" selector with "Shopping for another dog?" label
4. **P3** - Contextual pillar messaging (birthday awareness, festivals)
5. **P3** - Add subtle animations for "magical" feel
6. **P3** - Improve AI logic for "Why for [PetName]" whispers

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

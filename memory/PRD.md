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

## LATEST UPDATE: Feb 7, 2026 - Natural Conversation + WhatsApp + Voice

### ✅ MAJOR CHANGES
1. **Removed Quick-Reply Chips** - Conversation is now natural, like talking to a human
   - User feedback: "chips distract from conversation flow"
   - Mira now relies on intelligence to understand context
   
2. **WhatsApp Concierge® Integration** - Direct link to WhatsApp
   - Button: "WhatsApp Concierge®" 
   - Opens: `wa.me/919663185747` with pre-filled message about pet
   
3. **Prominent "Talk to Mira" Voice Button**
   - Large purple button above input field
   - Pulse animation when listening
   - Visual listening indicator

4. **Breed Info Strip** - Always visible at top
   - Shows breed-specific context
   
5. **Persistent Concierge® Bar** - Above composer (NOT floating)

### ✅ DATA SYNC STATUS
| Data Type | Count | Status |
|-----------|-------|--------|
| Products | 2,151 | ✅ Synced |
| Services | 2,406 | ✅ Synced |
| Breeds | 62 | ✅ Intelligence loaded |

---

## ChatGPT-Style Layout - Feb 7, 2026

### ✅ UI REDESIGN - ChatGPT Style as Requested
**User Request**: "Mira should come top... make it broader... so I can keep typing like I am to you"

**What's Now in Place:**
1. **"How can I help with Buddy today?"** - Clear heading at TOP (like ChatGPT)
2. **Context shown** - "I know Buddy is a Golden Retriever with Chicken allergy"
3. **Wide input at bottom** - "Ask me anything about Buddy..." - ready for free typing
4. **Quick suggestions** - 🦴 Treats, ✂️ Grooming, 🎂 Birthday, ✈️ Travel
5. **Test Scenarios** - Collapsible panel (click to expand for demo)
6. **Compact header** - Mira | Pet Life OS for Buddy | Buddy's photo
7. **Deep purple gradient** - Original aesthetic preserved
8. **Clean white chat cards** - With amber question strips

### ✅ DOCTRINE COMPLIANCE VERIFIED
| Principle | Status |
|-----------|--------|
| Presence Before Performance | ✅ "That's a lovely thought" before planning |
| Knowledge Remembered | ✅ "From what I know about Buddy..." |
| Remember → Confirm → Act | ✅ Context → Question → Then products |
| Products After Alignment | ✅ Only after explicit opt-in |
| Concierge® (with ®) | ✅ Proper trademark usage |
| Never a Dead End | ✅ Always a next step |
| Ends with Question | ✅ Clarifying questions always |

### ✅ QUICK-REPLY CHIPS FIXED
All four canonical flows now show contextual chips matching the question:

| Flow | Question | Chips |
|------|----------|-------|
| Birthday | "Active and playful... or simpler, cosy?" | Active and playful, Simpler and cosy, I'm not sure yet, I'd like a cake as well |
| Grooming | "Simple trim... or fuller grooming session?" | Simple trim, Full grooming session, I'm not sure, tell me more |
| Treats | "Everyday light treats... or special-occasion?" | Everyday light treats, Special-occasion treats, I'm not sure yet |
| Travel | "Are you driving or flying?" | Car, Flight, Train, Not sure yet |

---

## CRITICAL REFERENCES

> **ALL AGENTS MUST READ THESE FILES BEFORE ANY MIRA-RELATED WORK:**
> 1. `/app/memory/MIRA_DOCTRINE.md` - Core persona, voice, and governing principles
> 2. `/app/memory/GROOMING_OS.md` - Complete grooming intelligence (intents, flows, boundaries)
> 3. `/app/memory/FOOD_NUTRITION_OS.md` - Complete food & nutrition intelligence
> 4. `/app/memory/DESIGN_BENCHMARKS.md` - UI/UX design reference

### Mira Doctrine Key Principles:
1. **Presence before performance** - Acknowledge feelings before giving information
2. **Knowledge is remembered. Execution is invited.** - Never bulldoze with a plan
3. **Remember → Confirm → Act** - Always ask before deciding
4. **Products after alignment** - Suggestions are secondary, optional
5. **Concierge® as quiet option** - Never "escalation" or "ticketing"
6. **Never a dead end** - Always provide a next step
7. **Boundary rules** - Medical/legal/ethical handled with care

---

## Current Status: ALL CANONICAL FLOWS COMPLETE - Feb 2026

### ✅ MIRA SERVICE DESK - FULLY IMPLEMENTED

#### Canonical Conversational Flows (ALL 4 PILLARS)
**Key Rule**: Products shown ONLY after explicit user opt-in (never on first message)

| Pillar | First Question | Step IDs Tracked |
|--------|----------------|------------------|
| **Treats** | Everyday vs Special-occasion? | TREATS_TYPE, TREATS_SUGGEST_OR_ROUTINE |
| **Grooming** | Simple trim vs Full session? At home vs Groomer? | GROOMING_MODE, GROOMING_LOCATION, GROOMING_SCHEDULE, GROOMING_TOOLS |
| **Birthday** | Active/playful vs Simpler/cosy? Food vs Play vs Ritual? | BIRTHDAY_SHAPE, BIRTHDAY_FOCUS, BIRTHDAY_FOOD_TYPE, BIRTHDAY_PARTY_DETAILS |
| **Travel** | Car vs Flight vs Train? Route? Pet-friendly stays? | TRAVEL_MODE, TRAVEL_ROUTE, TRAVEL_STAY, TRAVEL_DATES, TRAVEL_PACKING |

#### Anti-Loop Step Tracking System
- **Internal only** - No visible progress UI to pet parents
- **Auto-detects step_id** from question patterns
- **Marks steps complete** when user answers
- **Never repeats** a question that's already been answered
- Natural language progression ("To start...", "Next, let's...")

#### Service Desk APIs
| Endpoint | Purpose |
|----------|---------|
| `POST /api/mira/route_intent` | Classify utterance into pillar/intent |
| `POST /api/service_desk/attach_or_create_ticket` | Create/attach ticket (72hr window) |
| `POST /api/service_desk/append_message` | Real-time transcript logging |
| `POST /api/service_desk/complete_step` | Mark step as answered |
| `GET /api/service_desk/completed_steps/{ticket_id}` | Get all completed steps |
| `POST /api/service_desk/handoff_to_concierge` | Flip status, assign queue |

#### Ticket Structure
```
{
  ticket_id: "TCK-2026-000XXX",
  status: "open_mira_only" | "open_concierge",
  completed_steps: ["TREATS_TYPE", "TREATS_SUGGEST"],
  current_step: null,
  step_history: [{ step_id, question, answer, timestamps }],
  conversation: [{ sender, text, timestamp, meta }]
}
```

#### Concierge® Handoff
- Closing line: *"I've shared everything we've discussed with your pet Concierge®. They'll take it forward from here and get back to you in this chat."*
- Same ticket used (no new ticket created)
- Status flips to `open_concierge`

#### UI Components (Updated Feb 7, 2026)
- **Quick reply chips** - Contextual, matching the specific question options (amber-colored)
- **Clarifying question** - Highlighted in amber strip with border-left accent
- **Products** - Horizontal carousel with "why for pet" lines (ONLY after opt-in)
- **Concierge® CTA** - Small link-style, not banner
- **Composer** - Always pinned at bottom with voice and send buttons
- **No progress indicators** - Conversational feel preserved

---

### MIRA OS - The Pet Life Operating System
**Vision**: "Mira is not a chatbot. Mira is the operating system for dog life."

**The One Sentence**: "Knowledge is remembered. Execution is invited."

---

## FOOD & NUTRITION OS - COMPLETE (Dec 2025)

### ✅ Comprehensive Food Intelligence
10 distinct food intent types with specific handling:

| Intent | Triggers | Products? | Action |
|--------|----------|-----------|--------|
| FOOD_MAIN | "what should he eat", everyday diet | After clarification | Ask questions first |
| FOOD_PORTION | "how much?", amounts | NO | Guidance + vet referral |
| FOOD_ROUTINE | schedules, multi-dog feeding | NO | Structure advice |
| FOOD_TREAT | treats, snacks, training rewards | YES | Show treat products |
| FOOD_RULES | "can my dog eat X?" | NO | Safety guidance only |
| FOOD_WEIGHT | overweight/underweight | NO | VET COORDINATION |
| FOOD_HEALTH_ADJACENT | vomiting, diarrhea, itching | NO | VET IMMEDIATELY |
| FOOD_PREFERENCE | picky eater, not eating | Depends | Behaviour vs medical |
| FOOD_TRAVEL | food for trips/boarding | After plan | Travel food guidance |
| FOOD_ORDERING | "order this", "subscription" | N/A | Concierge® execution |

### ✅ Medical Boundaries Enforced
- Vomiting/diarrhea → VET immediately, NO products
- Weight concerns → VET coordination, NO diet plans
- Toxic foods → Immediate warning, emergency guidance
- Mira never prescribes diets or diagnoses

### ✅ New Test Scenarios in Sandbox
Food scenarios added to `/mira-demo`:
- 🍽️ Food, ⚖️ Portion, 🕐 Schedule, 🍎 Can Eat?
- 📈 Weight (vet), 😒 Picky, 🤢 Vomiting (vet)

---

## GROOMING OS - COMPLETE (Dec 2025)

### ✅ Comprehensive Grooming Intelligence
7 distinct grooming intent types with specific handling:

| Intent | Triggers | Products? | Action |
|--------|----------|-----------|--------|
| GROOM_PLAN | haircut, bath, trim, shedding | NO | Guidance + clarifying questions |
| GROOM_TOOLS | shampoo, brush, "what do I need" | YES | May show grooming products |
| GROOM_CONCERN | hates grooming, nervous | NO | Tips + trainer referral |
| GROOM_ACCIDENT | cut, nick, bleeding | NO | VET IMMEDIATELY |
| GROOM_POST | scratching after grooming | NO | VET, NO products |
| GROOM_LIFESTAGE | puppy first groom, senior dog | NO | Gentle guidance + Concierge® |
| GROOM_BOOKING | "book groomer", "schedule" | NO | Concierge® orchestration |

### ✅ Grooming Test Scenarios
- ✂️ Haircut, 🛁 Bath, 🧴 Tools (products allowed)
- 🩹 Accident (vet), 📅 Book (Concierge®)

---

## PHASE 3 COMPLETE - Feb 7, 2026

### ✅ Mira Doctrine Implemented
**The Transformation**: Mira went from a "smart recommendation engine" to a "trusted companion"

### ✅ Test Scenarios Panel
22+ scenarios for role-playing Mira's responses at `/mira-demo`:
- **Food**: 🍽️ Food, ⚖️ Portion, 🕐 Schedule, 🍎 Can Eat?, 📈 Weight, 😒 Picky, 🤢 Vomiting
- **Grooming**: ✂️ Haircut, 🛁 Bath, 🧴 Tools, 🩹 Accident, 📅 Book
- **Other**: 🦴 Treats, 🎂 Birthday, ✈️ Travel, 🏥 Health, 😰 Anxiety, 🌈 Farewell, ⚖️ Compare, 🏠 Boarding, 🎓 Training

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
| Concierge® | Opens Mira AI chat widget |
| Orders | Navigates to /orders |
| Plan | Navigates to /family-dashboard?tab=calendar |
| Help | Opens help modal with options |
| Soul | Navigates to /pet-soul/{petId} |

---

## Key Files Modified This Session
- `/app/backend/mira_routes.py` - Grooming OS + Food OS in system prompt
- `/app/frontend/src/pages/MiraDemoPage.jsx` - 22+ test scenarios
- `/app/memory/GROOMING_OS.md` - Complete grooming intelligence
- `/app/memory/FOOD_NUTRITION_OS.md` - Complete food intelligence

---

## LATEST UPDATE: Feb 7, 2026 - Multi-Pet + Multi-Session COMPLETE ✅

### ✅ SESSION PERSISTENCE - FULLY WORKING
**Tested End-to-End:**
1. **Backend Routes**: `/api/mira/session/*` routes registered in server.py
2. **Session Creation**: Creates sessions in MongoDB `mira_sessions` collection
3. **Message Persistence**: Both user and assistant messages saved on each turn
4. **Session Recovery**: Frontend recovers history from localStorage session_id → backend fetch
5. **Context Maintained**: Multi-turn conversations preserve pet context (allergies, preferences)

### ✅ MULTI-SESSION MANAGEMENT (NEW)
**"Past Chats" Feature:**
- **History Button**: Added to dock navigation 
- **Past Chats Sidebar**: Shows all previous conversations
- **Session Loading**: Click any past session to load it
- **New Chat Button**: Start fresh conversation anytime
- **Date Display**: "Today", "Yesterday", "X days ago"

**New Backend Endpoints:**
- `GET /api/mira/session/list/by-member/{member_id}` - List all user's sessions
- `GET /api/mira/session/list/by-pet/{pet_id}` - List sessions for a specific pet
- `GET /api/mira/session/latest/by-pet/{pet_id}` - Get most recent session for a pet
- `POST /api/mira/session/switch-pet` - Switch to different pet (load/create session)

### ✅ MULTI-PET SUPPORT (NEW)
**Pet Switching Feature:**
- **Pet Selector Dropdown**: Click on pet badge to see all pets
- **Switch Pet**: Select different pet → loads their latest session or creates new
- **Session Isolation**: Each pet has their own conversation history
- **Context Switching**: Breed info strip updates for selected pet

**Files Modified:**
- `/app/backend/mira_session_persistence.py` - Added multi-session and multi-pet endpoints
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Added History sidebar, pet selector dropdown

---

## NEXT PRIORITIES

### P0 - Add to Cart Integration
- Connect product cards in Mira responses to actual cart
- Currently shows `alert()` - needs real cart API

### P1 - Intelligent Context Understanding
- Fix "what is in this?" queries
- Better handling of product detail requests

### P1 - Seamless Concierge® Handoff
- Structured task creation (vs WhatsApp link)
- Full service desk integration

### P2 - Proactive Mode
- Birthday approaching alerts
- Reorder suggestions
- Weather-based tips

### P2 - Voice Output
- Text-to-speech for Mira responses
- ElevenLabs "Eloise" voice integration

### P3 - Thin Dock UI
- Per thedoggycompany.in design
- Floating widget, pet selector

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

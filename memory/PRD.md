# The Doggy Company - Product Requirements Document

---
## ⚠️ NEW AGENT? READ THIS FIRST:
## 1. **MIRA OS URL:** `/mira-demo` (NOT `/mira`)
## 2. **Test Credentials:** `dipali@clubconcierge.in` / `test123` | Admin: `aditya` / `lola4304`
## 3. `/app/memory/MOJO_BIBLE.md` - THE COMPLETE MOJO DEFINITION (28 Parts + OS Layers)
## 4. `/app/memory/MOJO_BIBLE_SCORECARD.md` - Current Implementation Score (100% MOJO / 73% Overall)
## 5. `/app/memory/SYSTEM_AUDIT_REPORT.md` - ✅ FULL SYSTEM AUDIT COMPLETED (Feb 2026)
---

## CURRENT SCORE: 73% (Against MOJO Bible Vision) - Updated Feb 14, 2026
| Layer | Score | Status |
|-------|-------|--------|
| **MOJO (14 components)** | **100%** | ✅ **COMPLETE - All components working** |
| Pet Snapshot | 100% | ✅ Complete |
| Soul Profile | 100% | ✅ Complete |
| Health Vault | 100% | ✅ Weight History + Next Vaccination |
| Diet Profile | 100% | ✅ All fields editable |
| Behaviour Profile | 100% | ✅ Training style, response added |
| Grooming Profile | 100% | ✅ Shedding, nail trim, ear care |
| Routine Profile | 100% | ✅ All 8 fields complete |
| Environment Profile | 100% | ✅ All fields added |
| Preferences | 100% | ✅ All fields complete |
| Life Timeline | 100% | ✅ API aggregates orders, tickets, health |
| Membership | 100% | ✅ Pet Life Pass card in MOJO modal |
| Documents Vault | 100% | ✅ Integrated with /paperwork |
| **Trait Graph** | **100%** | ✅ **NEW - Service/Purchase → MOJO + UI Visualization** |
| Soul Completion | 100% | ✅ Consistent scoring everywhere |
| **TODAY** | 95% | ✅ Full Time Layer per MOJO Bible |
| PICKS | 45% | ⚠️ No auto-refresh on chat turn |

## ⚠️ CRITICAL: TWO-WAY MEMORY SYNC
**Every conversation updates MOJO automatically!**
- Code: `/app/backend/mira_routes.py` lines 11414-11455
- Mira remembers EVERYTHING from conversations

## ✅ FULL SYSTEM AUDIT COMPLETED (Feb 2026):
See `/app/memory/SYSTEM_AUDIT_REPORT.md` for complete findings:

### Key Findings:
1. **8/14 pillars** have unified service flow (Notification → Ticket → Inbox)
2. **6 pillars MISSING** unified flow: Enjoy, Emergency, Farewell, Adopt, Advisory, Paperwork
3. **MOJO updated** from pillar service outcomes via Trait Graph service
4. **Admin panel 100% compliant** - all pillars visible
5. **Frontend pillar pages** fetch pets but don't show constraints (safety gap)

---

## Original Problem Statement
Build a comprehensive Pet Life Operating System platform for The Doggy Company, featuring AI-powered pet care assistant (Mira), gamification elements, and a modern 7-tab header navigation system.

**Philosophy:**
- **MOJO** = The Pet's Passport / DNA - Single source of truth about the pet
- **Mira** = The Pet's Soul - AI intelligence that knows the pet
- **Concierge®** = The Pet's Hands - Human execution layer

## Core Requirements

### P0 - Critical (ALL COMPLETED ✅)
- [x] **Production Deployment Fix** - Service worker disabled, ErrorBoundary handles chunk errors
- [x] **CSS Chunk Loading Fix (2026-02-13)** - Removed `ios-premium.css` import causing chunk failures
- [x] **MOJO Profile Modal - Phase 1** - Pet Identity Layer with 11 sections
- [x] **Pet OS Navigation Bar** - 7-Layer OS Navigation with beautiful pet avatar
- [x] **Multi-Pet Switching** - Tested - switching pets updates entire OS
- [x] **Dynamic MOJO System (2026-02-13)** - Soul Score, Badges, Paw Points update in real-time
- [x] **Two-Way Memory-Soul Sync (2026-02-13)** - Chat conversations update Pet Soul automatically
- [x] **MOJO Auto-Save (2026-02-13)** - Changes auto-save after 1.5s debounce, no manual save needed
- [x] **MOJO Vision Audit (2026-02-13)** - Scored at 72% against Product Doctrine
- [x] **Handover Document v2 (2026-02-13)** - Complete handover with all credentials
- [x] **✅ COMPLETED: Confidence Scores & "Mira Learned" Badges (2026-02-14)** - Intelligence visibility:
- [x] **✅ FIXED: MOJO Modal Header Bug (2026-02-14)** - Header now shows pet's name dynamically instead of static "MOJO"
  - File: `/app/frontend/src/components/Mira/MojoProfileModal.jsx` (Line 1725)
  - Changed from `<h2>MOJO</h2>` to `<h2>{petData?.name || 'MOJO'}</h2>`
  - Verified working via screenshot - header shows "Lola" when viewing Lola's profile
- [x] **✅ NEW: Weight History Tracking (2026-02-14)** - Track pet weight over time
  - File: `/app/frontend/src/components/Mira/MojoSectionEditors.jsx`
  - Expandable section with add/remove entries, date picker, auto-save
- [x] **✅ NEW: Next Vaccination Date (2026-02-14)** - Added to Health Vault editor

### P1 - High Priority (COMPLETED ✅)
- [x] **✅ TODAY Panel REBUILT - Full MOJO Bible Spec (2026-02-14)**
  - File: `/app/frontend/src/components/Mira/TodayPanel.jsx` (800+ lines complete rewrite)
  - **Components per spec:**
    1. Today Summary Header - Count badge, refresh, timestamp, close button
    2. Urgent Stack (always top) - Overdue vaccinations, checkups, emergency follow-ups
    3. Due Soon Cards - Grooming due, vet appointments, parasite prevention
    4. Season + Environment Alerts - Heat/cold warnings, tick season, fireworks anxiety
    5. Active Tasks Watchlist - Awaiting confirmation, scheduling, payment pending
    6. Documents + Compliance - Expiring certificates, missing documents
    7. Other Pets (compact) - Alerts for other pets in household
    8. Empty State - "All caught up!" with proper messaging
  - One-tap actions on each card (Arrange/Book/Schedule/Upload/Confirm)
  - **Responsive:** Desktop (centered modal 440px), Mobile (bottom sheet full width)
  - **iOS-specific:** Safe area insets, momentum scrolling, 48x48px touch targets
  - **Animations:** 200ms ease-out open, 150ms close (per MOJO Bible)
  - **Accessibility:** Reduced motion support, proper ARIA labels
  - **Testing:** 100% pass rate (8/8 features verified)
  - Other pets summary section
  - Integrated into MiraDemoPage with lazy loading
  - Traits now show confidence percentage (e.g., "85%") based on source
  - "🧠 MIRA LEARNED" badge shows when data was inferred from conversation
  - Metadata stored in `doggy_soul_meta` field in MongoDB
  - Backend: `soul_first_logic.py` and `pet_soul_routes.py` updated
  - Frontend: `TraitBadge` component with gradient styling

### P1 - High Priority
- [x] **✅ COMPLETED: Connect ALL MOJO Data (2026-02-13)** - Pet data now fully integrated:
  - Fetches from `/api/member/profile?user_email=X` for membership, loyalty_points, badges
  - Fetches from `/api/pets/{pet_id}` for complete pet data including doggy_soul_answers
  - Fetches from `/api/mira/personalization-stats/{pet_id}` for soul scores
  - All 11 MOJO sections display real data with calculated completion percentages
  - Multi-pet switching tested and working
- [x] **✅ COMPLETED: Weather Card (2026-02-13)** - Shows pet walk safety:
  - Displays temperature, city, humidity
  - Safety level badge (SAFE/CAUTION/UNSAFE)
  - Pet-specific advisory message
  - Integrated into WelcomeHero component
- [x] **✅ COMPLETED: "Why for Pet" Badges (2026-02-13)** - Enhanced personalization reasons:
  - Shows WHY products are recommended for specific pets
  - Considers allergies, breed, age, sensitivities
  - Updated `generateWhyForPet` in ChatMessage.jsx and miraConstants.js
- [x] **✅ COMPLETED: MOJO Modal Phase 2 - Drill-In Editing (2026-02-13)**
  - Each MOJO section now has inline Edit button
  - Clicking Edit opens inline editor form with dropdowns, multi-selects, and text fields
  - Save button calls `/api/pet-soul/profile/{pet_id}/answers/bulk`
  - Cancel button returns to view mode
  - Data updates immediately after save
  - Soul score recalculates automatically
  - **Files Created:**
    - `/app/frontend/src/components/Mira/MojoSectionEditors.jsx` - 9 inline editor components
  - **Files Modified:**
    - `/app/frontend/src/components/Mira/MojoProfileModal.jsx` - Added edit mode state and handlers
- [x] **✅ COMPLETED: Auto-Save Feature (2026-02-13)**
  - Added `useAutoSave` custom hook with debounce
  - All 9 editors now auto-save after 1.5s of inactivity
  - Status indicator shows: pending → saving → saved
  - "Done" button replaces Save/Cancel buttons

### P1 - NEXT PRIORITY (From MOJO Bible Scorecard)
- [x] **Document Upload UI in MOJO** - ✅ Integrated with /paperwork pillar
- [x] **Health Vault Expansion** - ✅ Added vet_details, chronic_conditions, medications, emergency_contacts, microchip, insurance
- [x] **Environment Profile** - ✅ NEW section with home_type, living_space, family_structure, other_pets, travel_frequency
- [x] ~~**Add Confidence Scores** - Show data source on derived traits~~ ✅ DONE (2026-02-14)
- [ ] **Build TODAY Tab** - Vaccination reminders, grooming cadence, birthday countdown

### P2 - Medium Priority
- [ ] **OS Tab Content** - Populate content for PICKS, SERVICES, INSIGHTS, LEARN tabs
- [ ] Render API data in new tabs (picks[], concierge{}, safety_override{})
- [ ] Mobile UX verification (iOS Safari, Android Chrome)

---

## 🎯 SESSION WORK COMPLETED (2026-02-13)

### Auto-Save Feature Implementation
1. **Added `useAutoSave` custom hook** - Debounces changes and auto-triggers save after 1.5s
2. **Fixed callback reference bug** - Using `useRef` to store `onSave` callback to prevent stale closures
3. **Added `AutoSaveIndicator` component** - Shows pending → saving → saved → idle states
4. **Updated all 9 editors** - SoulProfileEditor, HealthProfileEditor, DietProfileEditor, BehaviourProfileEditor, GroomingProfileEditor, RoutineProfileEditor, PreferencesProfileEditor, TimelineEventEditor, BasicDetailsEditor

### Documentation Created
1. **MOJO Audit Document** - `/app/memory/MOJO_AUDIT_VISION_SCORE.md` - Scores MOJO at 72% against Product Doctrine
2. **Handover Document v2** - `/app/summary/COMPLETE_HANDOVER_README_v2.md` - Complete credentials, doctrines, service flow

### Testing
- Backend API tested successfully: `/api/pet-soul/profile/{pet_id}/answers/bulk` returns correct response
- Testing agent fixed a critical bug in `useAutoSave` hook (callback reference instability)

---

### 1. CSS Chunk Loading Fix ✅
**Problem:** `/mira-demo` page broken on production with "CSS chunk failed to load" error
**Root Cause:** `ios-premium.css` imported non-existent Google Fonts (SF Pro - Apple proprietary)
**Solution:** Removed `ios-premium.css` import from `MiraDemoPage.jsx` and `MiraOSPage.jsx`
**Files Modified:**
- `/app/frontend/src/pages/MiraDemoPage.jsx` (line 112)
- `/app/frontend/src/pages/MiraOSPage.jsx` (line 91)

### 2. Pet OS Navigation Bar ✅
**Created:** `/app/frontend/src/components/Mira/PetOSNavigation.jsx` (500+ lines)

**7 OS Layers Implemented:**
```
[ 🐕 Lola 15% ] | TODAY | PICKS | SERVICES | INSIGHTS | LEARN | CONCIERGE®
   (MOJO)
```

**Pet Avatar Design Features:**
- Beautiful circular design with concentric purple rings
- Health indicator badge (red heart - top left)
- Soul score badge (orange - bottom) showing X% SOUL
- Multi-pet dropdown for switching between pets
- Click opens MOJO Profile Modal

**Multi-Pet Switching Tested:**
- Switched from Lola → Luna
- Entire OS updated: reminders, chat context, "For Luna" section
- **"MOJO feeds all other layers"** - confirmed working

### 3. MOJO Profile Modal ✅
**Created:** `/app/frontend/src/components/Mira/MojoProfileModal.jsx` (1800+ lines)

**Data Integration Completed (2026-02-13):**
- Parallel API fetches from 3 endpoints: `/api/pets/{pet_id}`, `/api/mira/personalization-stats/{pet_id}`, `/api/member/profile`
- Soul score displays from real `overall_score` data
- All 11 sections populated with real `doggy_soul_answers` data
- Section completion percentages calculated dynamically from actual data fields
- Membership tier and loyalty points display correctly
- Bug fixed: `scrollIntoView` null reference error in setTimeout callback

### 4. Dynamic MOJO System ✅ (NEW - 2026-02-13)
**Enhanced:** `/app/frontend/src/components/Mira/SoulFormModal.jsx`

**Dynamic Features Implemented:**
- Soul Score updates in real-time when user answers questions
- Achievement sync after submitting bulk answers (`/api/paw-points/sync-achievements`)
- Badge award notifications via toast when new achievements are earned
- Paw Points earned display (+10 per question answered)
- New badges displayed in completion UI (soul_starter, soul_seeker, etc.)

**Tested & Verified:**
- Backend APIs working: `answers/bulk` returns new scores, `sync-achievements` awards badges
- Dashboard displays updated scores: Buddy went from 0% → 41%
- Paw Points balance increased: 1690 → 1780
- Achievement toast: "Soul Seeker - Lola has reached 25% Soul completion" confirmed

**Entry Points:**
1. Click pet avatar in OS navigation → Opens MOJO modal
2. Click "78% SOUL" badge in ticker → Opens MOJO modal (deep-links to Soul section)

**11 Sections (Accordion Layout):**
| Section | Default State | Purpose |
|---------|--------------|---------|
| Pet Snapshot | Always Visible | Photo, name, breed, age, soul ring, membership |
| Soul Profile | Expanded | 55-question personality vault |
| Health Profile | Collapsed | Allergies, weight, vaccinations |
| Diet & Food | Collapsed | Diet type, feeding schedule |
| Behaviour & Training | Collapsed | Training level, commands |
| Grooming & Care | Collapsed | Coat type, grooming schedule |
| Routine Tracker | Collapsed | Walk frequency, sleep pattern |
| Documents Vault | Collapsed | Certificates, insurance |
| Life Timeline | Collapsed | Milestones, events |
| Preferences & Constraints | Collapsed | Likes, dislikes, fear triggers |
| Membership & Rewards | Bottom | Tier, paw points, badges |

**Files Modified:**
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Integration, state management
- `/app/frontend/src/components/Mira/SoulKnowledgeTicker.jsx` - Added `onSoulBadgeClick` prop
- `/app/frontend/src/components/Mira/PetSelector.jsx` - Added `onPetNameClick` prop

### 5. Two-Way Memory-Soul Sync ✅ (NEW - 2026-02-13)
**Enhanced:** `/app/backend/soul_first_logic.py`

**Implementation:**
- Added `recalculate_pet_soul_score()` function (line 1141) that:
  - Fetches pet's current `doggy_soul_answers`
  - Calculates weighted folder scores matching the question bank
  - Updates `overall_score`, `folder_scores`, and timestamps
- Modified `write_soul_data_to_pet()` to call `recalculate_pet_soul_score()` after data write
- Chat endpoint in `mira_routes.py` (lines 11414-11455) extracts data from EVERY user message

**Data Extraction Patterns:**
- Food allergies: "allergic to", "can't eat", "sensitive to", "no chicken/beef/etc."
- Diet preferences: "kibble", "wet food", "raw", "home cooked"
- Health conditions: "arthritis", "diabetes", "hip dysplasia", etc.
- Behaviors: "anxious", "calm", "playful", "reactive", etc.
- Grooming: "long coat", "short hair", "home grooming", "salon"
- Location: Indian cities (Mumbai, Delhi, Bangalore, etc.)

**Tested & Verified:**
- Lola's score increased: 34% → 44% after chat message "allergic to chicken and beef"
- Data written to: `pets.doggy_soul_answers.food_allergies = ["chicken", "beef"]`
- Enrichment logged: `pets.enrichment_history` with source, confidence, timestamp
- Achievement toast appeared: "Soul Seeker - Lola has reached 25% Soul completion"

---

## 🔴 NEXT AGENT INSTRUCTIONS (Updated Feb 14, 2026)

### ⚠️ CRITICAL: READ THESE FILES FIRST
1. `/app/memory/MOJO_BIBLE.md` - Complete MOJO definition (vision)
2. `/app/memory/MOJO_BIBLE_SCORECARD.md` - Current scores (91% MOJO)
3. `/app/memory/HANDOVER_FEB14_2026.md` - Full handover with credentials

### MOJO Status: 91% Complete
To reach 100%, implement:
1. **Life Timeline (67% → 100%)**: Integrate past services/purchases from order history
2. **Trait Graph service**: Service outcomes → MOJO feedback loop
3. **Weight history**: Track weight over time (array)

### Test Credentials
- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `/admin` with `aditya` / `lola4304`
- **Mira OS URL:** `/mira-demo` (NOT `/mira`)

### Files of Reference:
- `/app/frontend/src/components/Mira/MojoSectionEditors.jsx` - All 10 editor components
- `/app/frontend/src/components/Mira/MojoProfileModal.jsx` - Main modal (1800+ lines)
- `/app/backend/pet_soul_routes.py` - Line 551: bulk answers endpoint

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/login` | POST | Login, returns `access_token` |
| `/api/pets/my-pets` | GET | List all user's pets with soul scores |
| `/api/pets/{pet_id}` | GET | Single pet full profile |
| `/api/member/profile?user_email=X` | GET | Membership, paw points, badges |
| `/api/mira/pet/{pet_id}/what-mira-knows` | GET | Soul knowledge items |
| `/api/mira/personalization-stats/{pet_id}` | GET | Soul score details |
| `/api/pet-photo/{pet_id}` | GET | Pet photo (returns image) |

---

## Test Credentials
- **User:** `dipali@clubconcierge.in` / `test123`
- **Admin:** `aditya` / `lola4304` (access at `/admin`)
- **Test Pets:** Lola (52%), Mystique (72%), Bruno (29%), Luna (88%), Buddy (41%), Meister (23%), TestScoring (100%)

## ⚠️ CRITICAL: URL PATHS
- **Mira OS:** `/mira-demo` ← THIS IS THE MAIN OS BUILD (NOT `/mira`)
- **Admin Panel:** `/admin`
- **Member Dashboard:** `/member-dashboard`
- **Preview URL:** `https://pet-soul-sync-1.preview.emergentagent.com`

---

## Architecture

### Frontend Files (Key)
```
/app/frontend/src/
├── components/Mira/
│   ├── PetOSNavigation.jsx     # NEW: 7-layer OS navigation bar
│   ├── MojoProfileModal.jsx    # NEW: Pet Identity Layer modal
│   ├── SoulKnowledgeTicker.jsx # Modified: onSoulBadgeClick prop
│   ├── PetSelector.jsx         # Modified: onPetNameClick prop
│   └── MiraChatWidget.jsx      # Chat widget with service handoff
├── pages/
│   ├── MiraDemoPage.jsx        # Main demo page with OS navigation
│   ├── MiraDemoBackupPage.jsx  # BACKUP - has missing features to port
│   └── MemberDashboard.jsx     # Reference for member data fetching
```

### Backend Files (Key)
```
/app/backend/
├── mira_routes.py              # Main Mira chat API (20,000+ lines)
├── mira_memory_routes.py       # Pet knowledge, what-mira-knows
├── member_rewards_routes.py    # Membership, paw points, badges
├── adopt_routes.py             # Pet CRUD operations
└── auth_routes.py              # Authentication, user data
```

---

## 🧠 CRITICAL: TWO-WAY MEMORY-SOUL CONNECTION

### ✅ COMPLETED (2026-02-13) - TWO-WAY SYNC FULLY WORKING

The Pet OS has a TWO-WAY data flow between Mira's Memory and Pet Soul:

**Direction 1: Soul → Mira (Mira reads Pet Soul)** ✅
- When Mira responds, she reads `pets.doggy_soul_answers`
- Uses `soul_first_logic.py` to build pet context
- Personalizes all responses based on soul data

**Direction 2: Mira → Soul (Conversations update Pet Soul)** ✅ IMPLEMENTED
- When user tells Mira "Lola is allergic to chicken and beef"
- Mira extracts: `food_allergies = ["chicken", "beef"]`
- Saves to: `pets.doggy_soul_answers.food_allergies`
- **Recalculates Soul Score** automatically via `recalculate_pet_soul_score()`
- Awards achievements if thresholds crossed
- Example: Lola's score went from 34% → 44% after chat-based extraction

**Implementation Details:**
- `soul_first_logic.py`: Added `recalculate_pet_soul_score()` function at line 1141
- `mira_routes.py`: Chat endpoint calls `extract_soul_data_from_response()` and `write_soul_data_to_pet()` (lines 11414-11455)
- Extraction patterns cover: allergies, diet preferences, health conditions, behaviors, grooming preferences, locations
- Test verified: 16/16 backend tests passed, 100% frontend tests passed

### Backend Files for Memory System
```
/app/backend/
├── mira_memory.py           # Core memory storage (4 types: event, health, shopping, general)
├── mira_memory_routes.py    # Memory API endpoints
├── soul_first_logic.py      # Builds pet context for Mira's responses
└── mira_session_persistence.py # Session management
```

### Memory Types
| Type | Icon | Description | Updates Soul? |
|------|------|-------------|---------------|
| event | 🗓️ | Birthdays, trips, milestones | No |
| health | 🏥 | Allergies, conditions, vet visits | YES |
| shopping | 🛒 | Product preferences | Partial |
| general | 💬 | Life context | No |

---

## Missing Features to Port from Backup Page

From `/app/frontend/src/pages/MiraDemoBackupPage.jsx`:

1. **Weather Card** - ✅ COMPLETED (2026-02-13)
2. **"Why for {Pet}" Badge** - ✅ COMPLETED (2026-02-13)
3. **Health Vault Progress** - "Complete {Pet}'s Health Vault - X% complete"
4. **Vaccine/Vet Reminders** - Inline alerts for overdue items
5. **Daily Digest** - Daily summary of pet info
6. **Milestones** - Pet achievement milestones
7. **Memory Lane** - Historical pet memories
8. **Reorder Suggestions** - "Time to reorder X?" prompts
9. **Concierge® Whisper** - Curator notes on products
10. **MIRA Features Grid** - "What can Mira help with?" feature showcase

---

## 🔴 COMPREHENSIVE PRODUCT BIBLE FOR NEXT AGENT

### THE DOGGY COMPANY - Pet Life Operating System

**Philosophy - MOJO MUST COME ALIVE:**
- **MOJO** = Pet's Passport/DNA - Single source of truth. Lives dynamically through EVERY interaction
- **Mira** = Pet's Soul - AI that knows the pet intimately, learns with each conversation
- **Concierge®** = Pet's Hands - Human execution layer for services

**Login Credentials:**
- Test User: `dipali@clubconcierge.in` / `test123` (7 pets: Lola, Mystique, Bruno, Luna, Buddy, Meister, TestScoring)
- Admin: `/admin` - username: `aditya` / password: `lola4304`

### ADMIN PANEL CAPABILITIES (TDB Admin at /admin)

**COMMAND CENTER:**
- Dashboard, Service Desk, Unified Inbox, Finance, Pillar Queues

**MEMBERS & PETS:**
- Pet Parents, Pet Profiles, Membership, Loyalty, Engagement, Celebrations

**COMMERCE:**
- Orders, Fulfilment, Product Box, Service Box, Collections, Pricing, Autoship, Abandoned, Discounts

**14 PILLARS (Service Categories):**
- Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Shop

**MIRA & AI:**
- Mira Chats, Memory, Kit Assembly, Communications, Reminders

**MARKETING:**
- Campaigns, Occasion Boxes, Proactive, Push

**ANALYTICS:**
- Live MIS, Reports, Analytics, Reviews, Pawmeter, Site Status

**CONTENT:**
- Blog, Testimonials, FAQs, About, CMS, Landing Page

**CONFIG:**
- Agents, Customers, Concierge XP, Tags, Breeds, Custom Cakes, Streaties, Franchise

### MOBILE/iOS/ANDROID SPECS

**iOS CSS file:** `/app/frontend/src/styles/ios-premium.css`
- Uses iOS system colors, safe areas, native iOS feel
- Note: SF Pro fonts were removed (proprietary) - replaced with system fonts

**Mobile Responsive CSS:** 
- `/app/frontend/src/styles/mira-prod.css` - Production styles
- `/app/frontend/src/styles/mira-10x.css` - iOS Safe Areas

**Key Mobile Considerations:**
- All components must work with `env(safe-area-inset-*)` for notched devices
- Bottom navigation must account for home indicator
- Touch targets minimum 44x44px
- Smooth animations using `transform` not `width/height`

### KEY API ENDPOINTS

| Endpoint | Purpose |
|----------|---------|
| `/api/pets` | Get all pets for user |
| `/api/pets/{pet_id}` | Get single pet with doggy_soul_answers |
| `/api/pets/my-pets` | Get user's pets (alternate) |
| `/api/mira/personalization-stats/{pet_id}` | Soul score, knowledge items |
| `/api/member/profile?user_email=X` | Membership, paw points, badges |
| `/api/mira/weather/pet-activity?city=X` | Weather + pet walk safety |
| `/api/mira/chat` | Mira AI chat endpoint |
| `/api/pet-soul/quick-questions/{pet_id}` | Proactive soul questions |
| `/api/member/badges` | User's earned badges |

### FILE STRUCTURE - KEY FILES

**Frontend Components (76 pages, 40+ Mira components):**
```
/app/frontend/src/
├── pages/
│   ├── MiraDemoPage.jsx (3500+ lines - Main page)
│   ├── MiraDemoBackupPage.jsx (Source for missing features)
│   ├── MemberDashboard.jsx
│   └── MyPets.jsx
├── components/Mira/
│   ├── PetOSNavigation.jsx (NEW - 7 OS tabs)
│   ├── MojoProfileModal.jsx (NEW - Pet Passport 1800+ lines)
│   ├── WeatherCard.jsx (NEW - Walk safety)
│   ├── WhyForPetBadge.jsx (NEW - Personalization reasons)
│   ├── ChatMessage.jsx
│   ├── WelcomeHero.jsx (Has inline WeatherCard)
│   └── SoulKnowledgeTicker.jsx
├── hooks/mira/
│   ├── usePet.js
│   ├── useProactiveAlerts.js
│   └── index.js
└── utils/
    └── miraConstants.js (Has generateWhyForPet)
```

**Backend (176 Python files):**
```
/app/backend/
├── server.py (Main FastAPI app)
├── mira_routes.py (Mira AI endpoints)
├── member_rewards_routes.py
├── pet_routes.py
├── soul_intelligence.py
└── ... (many more)
```

### MOJO - THE 11 SECTIONS

1. **Soul Profile** - Temperament, energy, personality (from doggy_soul_answers)
2. **Health Profile** - Allergies, weight, conditions
3. **Diet & Food** - Diet type, feeding schedule, treats
4. **Behaviour & Training** - Training level, commands, leash behavior
5. **Grooming & Care** - Coat type, grooming frequency
6. **Routine Tracker** - Walk schedule, exercise, sleep
7. **Documents Vault** - Vaccination records, medical records
8. **Life Timeline** - Birthday, milestones, memories
9. **Preferences** - Likes, dislikes, fears, special needs
10. **Membership & Rewards** - Tier, paw points, badges
11. **Basic Details** - Name, breed, age, location

### NEXT AGENT CRITICAL TASKS

1. **Make MOJO Come ALIVE** - Every Mira interaction should potentially update MOJO data
2. **MOJO Phase 2 - Drill-in Editing** - Each section expands to edit form
3. **OS Tab Content** - Populate PICKS, SERVICES, INSIGHTS, LEARN with relevant content
4. **Health Vault Progress** - Show completion % of health records
5. **Concierge® Whisper** - Show curator notes on products

### BEFORE STARTING - UNDERSTAND THE BUILD

1. Read this PRD.md completely
2. Scan `/admin` as aditya/lola4304 to see all capabilities
3. Login as test user and explore `/mira-demo` 
4. Open MOJO modal (click pet avatar) to see all 11 sections
5. Try Weather Card and product recommendations
6. Check multi-pet switching (Luna has highest 88% soul score!)

---

## Known Issues
- Pet photos may use relative URLs (`/api/pet-photo/pet-xxx`) - need to prepend base URL
- Some pets have no photo - fallback to dicebear avatar
- Membership data requires `user_email` query param

---

## Preview URL
**Working:** https://pet-soul-sync-1.preview.emergentagent.com/mira-demo

---

## User's Key Quote
> "MOJO = Identity Layer. Mira is his soul, Concierge® is his hands. MOJO feeds all other layers. The pet's whole DNA is there."

# The Doggy Company - Product Requirements Document

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

### P1 - High Priority (NEXT AGENT TASK)
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
- [ ] **MOJO Modal Phase 2** - Edit functionality for each section (drill-in editing)
- [ ] **OS Tab Content** - Populate content for PICKS, SERVICES, INSIGHTS, LEARN tabs

### P2 - Medium Priority
- [ ] Render API data in new tabs (picks[], concierge{}, safety_override{})
- [ ] Mobile UX verification (iOS Safari, Android Chrome)

---

## 🎯 SESSION WORK COMPLETED (2026-02-13)

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

---

## 🔴 NEXT AGENT INSTRUCTIONS

### Task: Port Missing Features from Backup Page

**Now that MOJO data integration is complete, the next phase is:**

1. **Weather Card Integration** - Port the weather widget from `MiraDemoBackupPage.jsx` to the TODAY tab
2. **"Why for {Pet}" Badges** - Show personalization reasons on recommendations
3. **Health Vault Progress** - Visual indicator of health records completion
4. **MOJO Modal Phase 2** - Add "drill-in" editing for each of the 11 sections

**Files to Study:**
- `/app/frontend/src/pages/MiraDemoBackupPage.jsx` - Source of missing features
- `/app/frontend/src/components/Mira/PetOSNavigation.jsx` - Add weather to TODAY tab

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
- **Admin:** `aditya` / `lola4304`
- **Test Pets:** Lola (34%), Mystique (72%), Bruno (29%), Luna (88%), Buddy (0%), Meister (23%), TestScoring (100%)

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

### NEXT AGENT MUST VERIFY THIS IS WORKING

The Pet OS has a TWO-WAY data flow between Mira's Memory and Pet Soul:

**Direction 1: Soul → Mira (Mira reads Pet Soul)**
- When Mira responds, she reads `pets.doggy_soul_answers`
- Uses `soul_first_logic.py` to build pet context
- Personalizes all responses based on soul data

**Direction 2: Mira → Soul (Conversations update Pet Soul)** 
- When user tells Mira "Lola is allergic to chicken"
- Mira extracts: allergy = "chicken"
- Saves to: `pets.doggy_soul_answers.food_allergies`
- Also saves to: `mira_memories` collection

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
**Working:** https://pet-soul-sync.preview.emergentagent.com/mira-demo

---

## User's Key Quote
> "MOJO = Identity Layer. Mira is his soul, Concierge® is his hands. MOJO feeds all other layers. The pet's whole DNA is there."

# Pet Life Operating System (Mira Soul OS) - PRD

## Original Problem Statement
Build a "Pet Life Operating System" where the AI assistant Mira possesses a "soul" and human-like contextual understanding. The user provided 200+ "bible" documents defining this vision. The existing production UI (`/mira-demo`) was kept, and only the AI "brain" was replaced with a new soulful conversation engine powered by GPT-5.1.

## User's Preferred Language
English

## Test Credentials
- **Email:** `dipali@clubconcierge.in`
- **Password:** `test123`
- **Admin:** `aditya` / `lola4304`

## Preview URL
https://pet-os-auth-fix.preview.emergentagent.com/mira-demo

---

## COMPLETED FEATURES (2026-02-26)

### 1. SERVICES Tab Pulse/Glow (P0) ✅
**What:** When Mira creates a service ticket via chat, the SERVICES tab glows pink for 5 seconds.
**How it works:**
- Backend returns `highlight_tab: "services"` when ticket created
- `useChatSubmit.js` (line 438-445) calls `setServicesPulse(true)` 
- `MiraDemoPage.jsx` uses ref+forceUpdate pattern to avoid React re-render cascade
- `MiraUnifiedHeader.jsx` (line 303-310) passes `servicesPulse` to OSTab, overrides iconState to 'PULSE'
- CSS animation in `mira-unified-header.css` (line 279-298) creates dramatic pink glow

**Key Files:**
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Lines 746-756 (servicesPulse ref+forceUpdate)
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - Lines 438-445 (highlight_tab handling)
- `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx` - Lines 303-310 (effectiveIconState)
- `/app/frontend/src/styles/mira-unified-header.css` - Lines 279-298 (.mira-os-tab.pulse animation)

### 2. Quick Actions in SERVICES Modal (P0) ✅
**What:** Clicking launchers (Grooming, Vet, etc.) opens ServiceRequestBuilder modal.
**Status:** Was already working, verified via screenshots.

**Key Files:**
- `/app/frontend/src/components/Mira/ServicesPanel.jsx` - Line 395 (handleLauncherClick)
- `/app/frontend/src/components/Mira/ServiceRequestBuilder.jsx` - The booking modal

### 3. Location Flow (P1) ✅
**What:** 
- Weather widget shows city next to temperature (e.g., "25°C • Mumbai")
- Click on weather widget opens Location Change modal
- Mira confirms location before giving location-based suggestions

**How it works:**
- `MiraUnifiedHeader.jsx` - TemperatureDisplay component shows `{temp}°C • {city}`
- `LocationPromptModal.jsx` - New component with auto-detect, city search, popular cities
- `MiraDemoPage.jsx` - handleLocationSet saves to localStorage and refreshes weather
- `mira_soulful_brain.py` - Added location confirmation rule to system prompt
- Backend accepts `user_city` in MiraChatRequest model

**Key Files:**
- `/app/frontend/src/components/Mira/LocationPromptModal.jsx` - NEW file
- `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx` - Lines 152-170 (TemperatureDisplay)
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Lines 1007-1070 (location handling)
- `/app/backend/mira_soulful_brain.py` - Lines 180-190 (location confirmation prompt)
- `/app/backend/mira_routes.py` - Line 7822 (user_city in MiraChatRequest)

### 4. CONCIERGE Integration (P1) ✅
**What:** Mira-created tickets appear in CONCIERGE panel's "Active Requests".

**How it works:**
- `mira_soulful_brain.py` now writes to BOTH `service_requests` AND `mira_tickets` collections
- Also creates admin notification in `admin_notifications` collection
- `concierge_routes.py` queries both `service_desk_tickets` AND `mira_tickets`
- Supports user_id matching by both email AND UUID formats

**Key Files:**
- `/app/backend/mira_soulful_brain.py` - Lines 274-370 (execute_create_service_ticket - writes to both collections)
- `/app/backend/mira_routes.py` - Lines 12341-12380 (extracts user_email from JWT)
- `/app/backend/concierge_routes.py` - Lines 4193-4220 (dual collection query)

**Database Collections:**
- `mira_tickets` - Unified tickets for CONCIERGE (ticket_id, user_id, pet_name, title, status, timeline)
- `service_requests` - Legacy collection (backward compat)
- `admin_notifications` - Notifications for Service Desk

### 5. Auto-switch PICKS Pillar (P1) ✅
**What:** Grooming/vet conversations automatically set pillar to 'care'.

**Key Files:**
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - Lines 446-449 (setPillar from suggested_pillar)
- `/app/backend/mira_soulful_brain.py` - Returns `suggested_pillar` in response

### 6. Unified Service Flow - Admin Notification Fix (P0) ✅
**What:** Service desk tickets now correctly send notifications to admin when:
1. User explicitly requests a service (booking, grooming, vet, etc.)
2. Conversation auto-completes after max clarifying questions

**Problem Fixed:**
- Admin notifications were created with `read_at: None` but missing `read: False` field
- The admin API queries for `read: False`, so notifications weren't appearing in unread count
- Conversation auto-completion (max clarifying questions) wasn't triggering handoff/notification

**How it works:**
- **Frontend (useChatSubmit.js):** When conversation auto-completes (max 4 clarifying questions), calls `/api/service_desk/handoff_to_concierge` API
- **Backend (mira_service_desk.py):** `handoff_to_concierge` creates admin notification with `read: False`
- **Backend (mira_soulful_brain.py):** Direct service creation also includes `read: False`

**Key Files:**
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - Lines 1402-1451 (auto-handoff on conversation complete)
- `/app/backend/mira_service_desk.py` - Line 851 (added `read: False` to admin notification)
- `/app/backend/mira_soulful_brain.py` - Line 349 (already had `read: False`)

**Service Flow:**
```
User Intent → Service Desk Ticket → Admin Notification → Member Notification → Pillar Request → Tickets → Channel Intakes
```

### 7. Live Conversation Threads - Real-time Service Desk (P0) ✅
**What:** Every conversation with Mira is captured as a "Live Thread" that the Service Desk can monitor in real-time. Concierge can see all active conversations and "jump in" to respond as human.

**Flow:**
```
User Opens Conversation → Service Desk Thread Created (silently) → Admin Notification → 
Every Message (user + Mira) Flows Into Thread → Concierge Can Jump In
```

**How it works:**
- When user sends first message via `/api/mira/chat`, a live thread is auto-created
- Both user messages AND Mira responses are appended to the thread in real-time
- Admin Service Desk sees "Live Threads" tab with all active conversations
- Admin can click thread to see full conversation history
- Admin can type reply to "jump in" as Concierge
- User receives notification when Concierge responds

**Backend Endpoints:**
- `POST /api/live_threads/start` - Start new thread
- `POST /api/live_threads/append` - Append message to thread
- `GET /api/live_threads/active` - Get all active threads (admin auth)
- `GET /api/live_threads/{thread_id}` - Get thread details with messages
- `POST /api/live_threads/{thread_id}/reply` - Concierge reply
- `POST /api/live_threads/{thread_id}/close` - Close thread
- `GET /api/live_threads/stats/overview` - Stats overview

**Key Files:**
- `/app/backend/live_conversation_routes.py` - NEW file - All live thread endpoints
- `/app/backend/mira_routes.py` - Lines 12368-12420 (auto-creates thread on chat)
- `/app/frontend/src/components/admin/LiveConversationThreads.jsx` - NEW file - Admin dashboard component
- `/app/frontend/src/pages/Admin.jsx` - Added "Live Threads" tab under MIRA & AI

**Database Collection:**
- `live_conversation_threads` - Stores all threads with messages array

**Admin Dashboard Features:**
- Stats cards: Active Now, Need Attention, Today New, Closed Today
- Thread list with user/pet info, message preview, timestamp
- Click thread to open detail modal
- Full conversation view (user messages in purple, Mira in white, Concierge in green)
- Reply input for Concierge to respond
- Close thread button

---

### 8. Breed-Specific LEARN Content Filtering (P1) ✅
**What:** LEARN tab content is personalized based on the selected pet's breed. A Shih Tzu owner sees content relevant to brachycephalic breeds, long coats, and toy breeds.

**How it works:**
- `BREED_TAG_MAP` maps breeds to characteristic tags (e.g., "shih tzu" → `["brachy", "long_coat", "toy"]`)
- `derive_pet_tags_from_profile()` extracts both pet tags (life stage, behavior) and breed tags
- `calculate_relevance_score()` scores content based on tag matches
- "For your pet" shelf shows personalized content with "For {pet_name}" badges

**Key Files:**
- `/app/backend/learn_os_routes.py` - Lines 76-286 (BREED_TAG_MAP, derive_pet_tags_from_profile)
- `/app/frontend/src/components/Mira/LearnPanel.jsx` - Lines 325-340 (passes pet_id to API)

**Test Results:**
- Shih Tzu "Mojo" gets tags: `[brachy, long_coat, toy]`
- "For your pet" shelf: 7 personalized items, 2 with "For Mojo" badge
- Grooming topic correctly applies breed_tags for personalization

### 9. Auto-switch PICKS Pillar (P1) ✅
**What:** PICKS pillar automatically switches based on conversation context. Grooming conversations auto-switch to "care" pillar.

**How it works:**
- Backend returns `suggested_pillar` in chat response based on detected intent
- Frontend `useChatSubmit.js` calls `setPillar(data.suggested_pillar)` to update state
- Also returns `highlight_tab` to highlight relevant OS tabs

**Pillar Mappings:**
| Intent | Pillar | Highlight Tab |
|--------|--------|---------------|
| grooming | care | services |
| vet visit | care | services |
| food/meal | dine | - |
| birthday | celebrate | - |
| travel | travel | - |
| boarding | stay | - |

**Key Files:**
- `/app/backend/mira_soulful_brain.py` - Returns suggested_pillar based on conversation
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - Lines 447-449 (setPillar from suggested_pillar)

### 10. Mira Suggestions → PICKS Panel (P1) ✅
**What:** When Mira gives concrete suggestions (cake, decorations, etc.), they appear as selectable cards in the PICKS panel with "Send to Concierge" option.

**How it works:**
1. User asks for party/service planning
2. Mira asks 2-3 clarifying questions
3. Mira gives 3-4 suggestions formatted with emojis (🎂, 🎈, 📸, 🦴)
4. Backend extracts suggestions and creates `concierge_arranges` cards
5. Frontend PICKS panel displays "CONCIERGE® ARRANGES" section
6. User can tap any card to add to their request
7. "Send to Concierge" submits selected suggestions

**Backend Response Structure:**
```json
{
  "response": "Here are ideas for Mystique's party...",
  "concierge_arranges": [
    {"id": "...", "type": "mira_suggestion", "title": "🎂 Dog-friendly cake", ...}
  ],
  "picks_contract": {"fallback_mode": "concierge", "concierge_cards": [...]}
}
```

**Key Files:**
- `/app/backend/mira_soulful_brain.py` - Lines 175-205 (suggestion format prompt)
- `/app/backend/mira_soulful_brain.py` - Lines 830-920 (suggestion extraction)
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - Lines 840-870 (CONCIERGE FALLBACK)
- `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` - Renders concierge cards

---

## FIXES APPLIED (2026-02-26)

### P0: PICKS Panel Dynamic Suggestions Fix ✅
**What:** The PICKS panel was not showing Mira's dynamic suggestions from chat conversations. Instead of showing "Mira's Suggestions from Our Chat" section with birthday party ideas, it showed static picks.

**Root Cause:** In `/app/frontend/src/hooks/mira/useChatSubmit.js`, line 888 was setting `conciergeArranges: []` in CATALOGUE MODE, which cleared any dynamic suggestions from the backend response.

**Fix Applied:**
- Changed `conciergeArranges: []` to `conciergeArranges: conciergeCards` in multiple places
- Lines 771, 798, 824, 892, 952 in useChatSubmit.js
- Backend correctly returns `concierge_arranges` array with suggestion cards
- Frontend now preserves these in `miraPicks.conciergeArranges`
- PersonalizedPicksPanel renders them in "Mira's Suggestions" section

**Key Files:**
- `/app/frontend/src/hooks/mira/useChatSubmit.js` - Lines 879-905 (CATALOGUE MODE preserves conciergeCards)
- `/app/frontend/src/components/Mira/PersonalizedPicksPanel.jsx` - Lines 1925-1973 (renders conversationSuggestions)
- `/app/frontend/src/pages/MiraDemoPage.jsx` - Line 5059 (passes miraPicks.conciergeArranges)

### P0: Services Not Showing in PICKS Panel ✅
**What:** When user asked for grooming/party/vet services, the PICKS panel showed 0 services. The soulful brain was bypassing legacy product/service fetching.

**Root Cause:** 
1. The soulful brain response was returning `products: []` and `services: []` without querying the database
2. The services collection in DB was empty (services were hardcoded but never inserted)

**Fix Applied:**
1. Added service/product fetching back into the soulful response path (`mira_routes.py` lines 12494-12525)
2. Added hardcoded services fallback when DB is empty (`mira_routes.py` lines 4505-4570)
3. Added party/celebrate keywords to service detection

**Key Files:**
- `/app/backend/mira_routes.py` - Lines 12494-12525 (restore legacy service fetching)
- `/app/backend/mira_routes.py` - Lines 4505-4570 (HARDCODED_SERVICES fallback)

### P0: Full Pet Memory Not Used by Mira ✅
**What:** Mira was only using basic pet info (name, breed, age) and ignoring critical soul data like handling_comfort, anxiety_triggers, temperament, energy_level, etc.

**Root Cause:** The `get_soulful_response()` function in `mira_soulful_brain.py` only extracted a few fields from `pet_context`, not the full `doggy_soul_answers`.

**Fix Applied:**
- Expanded context building in `mira_soulful_brain.py` (lines 637-750) to include ALL doggy_soul_answers fields:
  - temperament, energy_level, handling_comfort, coat_type
  - behavior_with_dogs, social_with_people, stranger_reaction
  - anxiety_triggers, loud_sounds, separation_anxiety
  - food_motivation, favorite_treats, health_conditions, life_stage
  - training_level, behavior_concerns, allergies

**Key Files:**
- `/app/backend/mira_soulful_brain.py` - Lines 637-750 (full doggy_soul_answers extraction)

### P1: Soul Score Update Fix ✅
**What:** Soul Score was stuck at 0% because the backend was using wrong query pattern.

**Root Cause:** Backend pet_soul_routes.py was querying for `{"id": pet_id}` but some pets only have `_id` field (MongoDB ObjectId).

**Fix Applied:**
- `/app/backend/pet_soul_routes.py` - Updated `save_answer` and `save_bulk_answers` endpoints
- Now tries `{"id": pet_id}` first, then falls back to `{"_id": ObjectId(pet_id)}`
- Uses `pet["_id"]` for update queries to ensure correct matching

---

## REMAINING TASKS

### P2: Real-time SERVICES Badge via WebSockets
- **Status:** NOT STARTED
- **Description:** Update SERVICES tab badge in real-time when ticket status changes
- **Approach:** Use existing socket.io-client, emit events from backend on ticket updates

### P2: "Maximum update depth exceeded" Warning
- **Status:** NOT STARTED  
- **Description:** React warning appears but doesn't block functionality
- **Root cause:** Likely in MiraDemoPage state management
- **Impact:** Low - app works but console has warnings

### Future Tasks
- WhatsApp Business integration
- Build 'Fit' and 'Work' pillars
- CONCIERGE drawer enhancement (Outlook-style thread viewer)
- Delete unused files: `MiraPureOs.jsx`, `mira_pure.py`

---

## ARCHITECTURE

### Frontend Structure
```
/app/frontend/src/
├── pages/
│   └── MiraDemoPage.jsx          # Main page (5000+ lines) - ALL work happens here
├── hooks/
│   └── mira/
│       └── useChatSubmit.js      # Chat API handler (1457 lines)
├── components/
│   └── Mira/
│       ├── MiraUnifiedHeader.jsx # Header with tabs, weather, location
│       ├── LocationPromptModal.jsx # NEW - Location selection modal
│       ├── ServicesPanel.jsx     # Services modal
│       ├── ServiceRequestBuilder.jsx # Booking modal
│       ├── ConciergeHomePanel.jsx # CONCIERGE panel
│       └── LearnPanel.jsx        # LEARN panel (need to verify)
└── styles/
    └── mira-unified-header.css   # Tab styles, pulse animation
```

### Backend Structure
```
/app/backend/
├── server.py                     # Main FastAPI app (18000+ lines)
├── mira_routes.py                # Chat endpoint (26000+ lines) - /api/mira/chat
├── mira_soulful_brain.py         # Soulful AI logic (762 lines)
├── concierge_routes.py           # CONCIERGE endpoints (4258 lines)
├── learn_os_routes.py            # LEARN endpoints (1639 lines) - /api/os/learn/*
├── learn_content_seeder.py       # Seeds LEARN content
└── learn_models.py               # LEARN data models
```

### Database (MongoDB)
- **DB Name:** `pet-os-live-test_database` (from .env)
- **Key Collections:**
  - `users` - User accounts (id is UUID, email is string)
  - `pets` - Pet profiles (name, breed, age, doggy_soul_answers)
  - `mira_tickets` - Unified tickets for CONCIERGE
  - `service_requests` - Legacy tickets (backward compat)
  - `learn_guides` - Curated guides with pet_tags, breed_tags
  - `learn_videos` - Curated YouTube videos with pet_tags, breed_tags
  - `admin_notifications` - Notifications for Service Desk

### API Endpoints
- `POST /api/mira/chat` - Main chat endpoint (soulful brain)
- `GET /api/os/concierge/home` - CONCIERGE panel data
- `GET /api/os/learn/home` - LEARN home with personalization
- `GET /api/os/learn/topic/{topic}` - Topic-specific content
- `GET /api/os/services/launchers` - Quick action launchers

---

## CRITICAL IMPLEMENTATION DETAILS

### 1. User ID Format Issue (SOLVED)
- **Problem:** Frontend uses UUID (`user.id`), backend used email
- **Solution:** Query with `$or` for both formats
- **Location:** `concierge_routes.py` lines 4193-4220

### 2. Dual Collection Write (SOLVED)
- **Problem:** Mira wrote to `service_requests`, CONCIERGE read from `mira_tickets`
- **Solution:** `execute_create_service_ticket` now writes to BOTH collections
- **Location:** `mira_soulful_brain.py` lines 274-370

### 3. SERVICES Tab Pulse Re-render Issue (SOLVED)
- **Problem:** useState caused "Maximum update depth exceeded"
- **Solution:** Use ref + forceUpdate pattern instead of useState
- **Location:** `MiraDemoPage.jsx` lines 746-756

### 4. User Email Extraction from JWT (SOLVED)
- **Problem:** `user_email` was None when creating tickets
- **Solution:** Decode JWT in mira_routes.py to extract email
- **Location:** `mira_routes.py` lines 12350-12360

---

## DEBUGGING CHECKLIST

### Backend Not Starting
```bash
tail -50 /var/log/supervisor/backend.err.log
sudo supervisorctl restart backend
```

### Frontend Issues
```bash
tail -50 /var/log/supervisor/frontend.err.log
sudo supervisorctl restart frontend
```

### Database Check
```python
python3 -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
with open('/app/backend/.env') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            key, val = line.strip().split('=', 1)
            os.environ[key] = val

async def check():
    client = AsyncIOMotorClient(os.environ.get('MONGO_URL'))
    db = client[os.environ.get('DB_NAME')]
    # Your queries here
    client.close()
asyncio.run(check())
"
```

### API Testing
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"dipali@clubconcierge.in","password":"test123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
curl -s "$API_URL/api/os/learn/home?pet_id=XXX" -H "Authorization: Bearer $TOKEN"
```

---

## BIBLE DOCUMENTS LOCATION
All product vision documents are in `/app/memory/`:
- `SSOT.md` - **SINGLE SOURCE OF TRUTH** (READ THIS FIRST!)
- `CONCIERGE_BIBLE.md` - CONCIERGE panel behavior
- `LEARN_BIBLE.md` - LEARN tab behavior
- `MOJO_BIBLE.md` - Pet identity system
- `TODAY_SPEC.md` - TODAY panel requirements
- `UNIFIED_SERVICE_FLOW.md` - Service request flow
- `PICKS_BIBLE.md` - PICKS recommendations
- `SERVICES_BIBLE.md` - Services flow
- And 200+ more defining Mira's personality and behavior

---

## SESSION LOG: 2026-02-27

### COMPLETED THIS SESSION:

1. **Service Request Modal Cut-off (FIXED)**
   - Increased z-index to 9999 in ServiceRequestBuilder.jsx
   - Adjusted maxHeight to 90vh
   - Submit button now fully visible on mobile

2. **"What Mira Learned" Feature (NEW)**
   - Added learning extraction to `mira_soulful_brain.py`
   - Extracts: allergies, preferences, behaviors, health info
   - Saves to `learned_facts` array in pet document
   - Also saves to `conversation_memories` collection

3. **Pet Switch Module (FIXED)**
   - Added Pet Selector Modal to MiraDemoPage.jsx
   - Shows all pets with soul scores
   - Checkmark on currently selected pet

4. **Pet Data Synced from Production**
   - Created `/app/backend/scripts/sync_prod_pets.py`
   - Synced 8 pets with proper `id` fields
   - Soul scores now showing correctly

5. **Mobile UI/UX (VERIFIED)**
   - Tested iPhone SE, iPhone 14 Pro, iPhone 14 Pro Max
   - Tested Pixel 5, Galaxy S8
   - All panels rendering correctly

---

## NEXT AGENT INSTRUCTIONS

### CRITICAL: Read SSOT First!
**ALWAYS start by reading `/app/memory/SSOT.md`** - it contains:
- Complete feature status (all panels 100% complete)
- Technical details and gotchas
- Rules for future agents
- Quick reference commands

### Current Backlog:
1. **P1:** WhatsApp Business integration
2. **P1:** Production data sync automation
3. **P2:** Build 'Fit' pillar
4. **P2:** Build 'Work' pillar
5. **P2:** Saved Learn feature (bookmark/favorite articles)
6. **Tech Debt:** Remove hardcoded services fallback from mira_routes.py

### Known Issues:
- Must pass `pet_id` in chat requests for learning to work
- Query pets by `id` field, not `_id`

---

## SESSION LOG: 2026-02-27 (Session 2)

### 🔴 CRITICAL FIX: Mira Pet Context Loading

**Issue:** Mira was saying "I don't know anything about your dog" despite having pet data in DB

**Root Cause:**
```
File: /app/backend/mira_routes.py (line 12418)
Code: pet_ctx = request.pet_context or {}
Problem: Frontend sends pet_id but not full pet_context → Mira had empty {}
```

**Fix Applied (Lines 12417-12441):**
```python
# CRITICAL: If pet_context is empty but we have pet_id, fetch from DB
if pet_id and (not pet_ctx or not pet_ctx.get("doggy_soul_answers")):
    pet_doc = await db.pets.find_one(
        {"$or": [{"id": pet_id}, {"_id": pet_id}]},
        {"_id": 0}
    )
    if pet_doc:
        pet_ctx = pet_doc
```

**Verification Results:**
| Test | Before | After |
|------|--------|-------|
| "Tell me about my dog" | "I don't know" | Lists 8 pets with soul data ✅ |
| "Chicken treats for Mojo?" | Generic | **REFUSES** - chicken allergy ✅ |
| "Mojo's personality?" | Unknown | "Friendly, playful, high energy" ✅ |

---

### COMPLETED THIS SESSION:

1. **🔴 CRITICAL: Pet Context DB Fetch (FIX)**
   - File: `/app/backend/mira_routes.py`
   - Lines: 12417-12441
   - Impact: Mira now ALWAYS knows pet's soul
   - Test: `/app/test_reports/iteration_52.json` - 9/9 PASSED

2. **Password Toggle Verification (CONFIRMED WORKING)**
   - Verified password toggle on login page is fully functional
   - Type toggles between 'password' and 'text' correctly
   - Eye/EyeOff icon toggles appropriately
   - Location: `/app/frontend/src/pages/Login.jsx` lines 200-209

3. **Document Upload in Concierge (NEW FEATURE)**
   - Added document upload functionality to ConciergeHomePanel
   - Users can now upload pet documents (vaccination records, prescriptions, etc.)
   - Features:
     - "Upload Docs" chip in suggestion area
     - Drag-and-drop upload zone
     - Multi-file upload support
     - Progress indicator during upload
     - Success/failure status for each file
   - Accepts: Images (jpg, png, gif, webp), Documents (pdf, doc, docx)
   - Max file size: 10MB
   - Files stored in MongoDB `mira_uploads` collection

4. **Mobile Compatibility Verified**
   - iOS (390x844): No overflow ✅
   - Android (360x800): No overflow ✅
   - Minor: Multiple onboarding modals for first-time users

5. **PICKS API Verified Working**
   - Endpoint: `GET /api/mira/top-picks/{pet_id}`
   - Returns: timely_picks, celebrate, pillars, personalized

**Key Files Modified:**
- `/app/backend/mira_routes.py` - Lines 12417-12441 (pet context fetch)
- `/app/frontend/src/components/Mira/ConciergeHomePanel.jsx` - DocumentUploadSection
- `/app/backend/mira_upload.py` - Fixed `if db:` → `if db is not None:` (line 103)

**API Endpoints Tested:**
- `POST /api/mira/chat` - With pet_id, now loads full soul context ✅
- `POST /api/mira/upload/file` - Document upload ✅
- `GET /api/mira/top-picks/{pet_id}` - Personalized picks ✅

### TESTING RESULTS:
- Backend: 100% (9/9 soul memory tests + 4/4 upload tests)
- Frontend: 95% (Mobile UI works, minor onboarding UX note)
- Test reports: 
  - `/app/test_reports/iteration_51.json` (Document Upload)
  - `/app/test_reports/iteration_52.json` (Soul Memory + Mobile)

---

---

## COMPLETED FIX: UI/UX Scrolling Issue (2026-03-03) ✅

### Issue Description
The Mira page input bar "Ask Mira anything..." was going under OS taskbars on desktop and needed proper safe area handling for iOS devices.

### Memorial Edition - In Memory of Mystique
This fix was made as a tribute to the user's beloved pet Mystique who passed away. The goal was to make the UI/UX perfect across all devices.

### What Was Fixed

1. **Desktop Input Bar Positioning**
   - Added extra bottom padding to `.mp-composer` to clear Windows taskbars and macOS docks
   - Progressive padding: 16px (base) → 24px (tablet) → 32px (large desktop)

2. **Mobile Safe Area Support**
   - Enhanced iOS safe area inset handling using `env(safe-area-inset-bottom)`
   - Added extra 29px clearance for iPhone home bar indicator
   - Small phones (iPhone SE) get dedicated breakpoint styling

3. **Content Scroll Area**
   - Increased `.mp-messages` bottom padding by 64px for comfortable scrolling
   - Content now scrolls completely above the fixed input bar
   - Added custom scrollbar styling (thin, purple)

### Key CSS Changes (mira-prod.css)
```css
/* Lines 491-520 - Composer positioning */
.mp-composer {
  padding-bottom: calc(var(--space-2xl) + 16px);
}

@media (min-width: 769px) { padding-bottom: calc(var(--space-2xl) + 24px); }
@media (min-width: 1200px) { padding-bottom: calc(var(--space-2xl) + 32px); }

/* Lines 104-163 - Content scroll area */
.mp-messages {
  padding-bottom: calc(
    max(var(--mira-interaction-footer-h), var(--mira-footer-fallback))
    + var(--page-bottom-space)
    + 64px
  );
}

/* Lines 2353-2371 - Safe area insets */
@supports (padding: env(safe-area-inset-bottom)) {
  .mp-composer {
    padding-bottom: calc(var(--space-2xl) + env(safe-area-inset-bottom) + 16px);
  }
}
```

### Testing Results
- **Desktop (1920x900)**: Input bar 31px from bottom ✅
- **Mobile iPhone 14 Pro (390x844)**: Input bar 29px from bottom ✅
- **iOS Safe Area**: Properly handled ✅
- **Content Scrolling**: Works without going behind input bar ✅
- **Navigation Tabs**: All clickable and functional ✅

**Test Report:** `/app/test_reports/iteration_53.json`

---

## Production Login Fix Status (2026-03-03)

### Issue
Production site `thedoggycompany.com` had a login redirect loop.

### Fix Applied
Added comprehensive debug logging with version marker `v5_production_debug_20250610` to trace auth flow:
- `ProtectedRoute.jsx` - Detailed token and user state logging
- `AuthContext.jsx` - Token storage verification logging
- `Login.jsx` - Redirect destination logging

### User Verification Required
User confirmed the debug logging is now appearing on production and the login flow is WORKING.

**Key Files Modified:**
- `/app/frontend/src/components/ProtectedRoute.jsx` - Lines 95-145
- `/app/frontend/src/context/AuthContext.jsx` - Lines 114-132
- `/app/frontend/src/pages/Login.jsx` - Lines 22-44

---

*Last Updated: 2026-03-03 02:45 UTC*

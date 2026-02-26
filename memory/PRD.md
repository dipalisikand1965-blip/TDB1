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
https://pet-life-ai.preview.emergentagent.com/mira-demo

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
- `CONCIERGE_BIBLE.md` - CONCIERGE panel behavior
- `LEARN_BIBLE.md` - LEARN tab behavior
- `PICKS_BIBLE.md` - PICKS recommendations
- `SERVICES_BIBLE.md` - Services flow
- And 200+ more defining Mira's personality and behavior

---

## NEXT AGENT INSTRUCTIONS

### Immediate Task: Verify Breed-Specific LEARN Filtering
1. **Check if pet_id is passed to LEARN API** - Look at frontend component
2. **Test API directly:**
   ```bash
   # Get pet_id for Mojo first
   # Then: GET /api/os/learn/home?pet_id={mojo_id}
   # Check response.personalization.breed_tags
   ```
3. **If breed_tags empty:** Check if `pets.breed` is populated in DB
4. **If working but not visible:** Check frontend renders "For your pet" shelf

### If LEARN Already Works
Move to:
1. P2: Real-time SERVICES badge (WebSockets)
2. P2: Fix React "Maximum update depth exceeded" warning
3. Future: WhatsApp Business integration

---

*Last Updated: 2026-02-26 06:10 UTC*

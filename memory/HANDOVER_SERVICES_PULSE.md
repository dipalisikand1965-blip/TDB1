# HARD HANDOVER - Mira Pure OS Integration

## CRITICAL: Work In Progress

### Currently Implementing: Services Tab Pulse + Pillar Auto-Selection

**STATUS**: 70% complete - Code added to backend, frontend partially done

---

## WHAT'S DONE (This Session)

### 1. Soulful Brain Integration ✅
- **File**: `/app/backend/mira_soulful_brain.py` (NEW - ~650 lines)
- **What**: GPT-5.1 with bible-following prompts, function calling for service tickets
- **Integrated into**: `/app/backend/mira_routes.py` at line ~12300 (feature flag `MIRA_SOULFUL_BRAIN=true`)

### 2. LEARN Content Seeded ✅
- **Database**: `pet-os-live-test_database`
- **Collections**: `learn_guides` (36 docs), `learn_videos` (22 docs)
- **All 9 topics**: grooming, health, food, behaviour, travel, boarding, puppies, senior, seasonal

### 3. Mobile CSS Fixed ✅
- **File**: `/app/frontend/src/styles/mira-premium.css` line ~1972
- **Fix**: Added `svg { width: 14px; height: 14px; }` to `.learn-topic-chip`

### 4. Notification Bell Added ✅
- **File**: `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx`
- **What**: Separate bell icon that opens `/notifications` inbox
- **CSS**: `/app/frontend/src/styles/mira-unified-header.css` (new `.mira-notification-bell` styles)

### 5. Service Keyword Detection Enhanced ✅
- **File**: `/app/backend/mira_soulful_brain.py` lines ~505-545
- **Keywords**: hotel, travel, grooming, walker, vet, boarding, birthday, etc.
- **Creates tickets for**: `travel_planning`, `grooming`, `dog_walker`, `vet_visit`, etc.

---

## WHAT'S IN PROGRESS (INCOMPLETE)

### 1. Services Tab Pulse After Ticket Creation

**Backend (DONE)**:
- `/app/backend/mira_soulful_brain.py` line ~558: Returns `highlight_tab` and `suggested_pillar`
- `/app/backend/mira_routes.py` line ~12370: Passes these to frontend response

**Frontend (PARTIALLY DONE)**:
- `/app/frontend/src/hooks/mira/useChatSubmit.js`:
  - Line ~148: Added `setServicesPulse` parameter
  - Line ~432-445: Added handler for `highlight_tab` and `suggested_pillar`
  - Line ~987-998: Added `setServicesPulse(true)` when `concierge_confirmation` received

**Frontend (NOT DONE)**:
- `/app/frontend/src/pages/MiraDemoPage.jsx`:
  - Need to add: `const [servicesPulse, setServicesPulse] = useState(false);` near line 740
  - Need to pass `setServicesPulse` to useChatSubmit call at line ~3066
  - Need to use `servicesPulse` in `iconStates` computation or pass to MiraUnifiedHeader

### 2. Pillar Auto-Selection from Conversation Context

**Backend (DONE)**:
- Returns `suggested_pillar` based on conversation keywords

**Frontend (PARTIALLY DONE)**:
- `useChatSubmit.js` line ~993: Calls `setPillar(data.suggested_pillar)`
- `setPillar` already exists and is passed to useChatSubmit

**Testing Needed**: Verify that when user says "grooming", the PICKS panel auto-selects "Care" pillar

### 3. CONCIERGE® Ticket Link

**Issue**: Service tickets created via Mira don't appear in CONCIERGE tab conversations
**Root Cause**: Mira saves to `service_requests` collection, CONCIERGE reads from `concierge_threads`

**Fix Needed**:
- When creating ticket in `mira_soulful_brain.py`, also create a `concierge_threads` entry
- OR modify CONCIERGE panel to also query `service_requests`

---

## FILES TO REVIEW/MODIFY

### Backend
1. `/app/backend/mira_soulful_brain.py` - Soulful brain module (DONE)
2. `/app/backend/mira_routes.py` - Integration at ~line 12300 (DONE)
3. `/app/backend/mira_pure.py` - Standalone endpoint (existing, works)
4. `/app/backend/learn_content_seeder.py` - LEARN content seeder (DONE)

### Frontend
1. `/app/frontend/src/pages/MiraDemoPage.jsx` - Main page (NEEDS: servicesPulse state)
2. `/app/frontend/src/hooks/mira/useChatSubmit.js` - Chat handler (PARTIALLY DONE)
3. `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx` - Header with tabs (HAS: iconState support)
4. `/app/frontend/src/components/Mira/ServicesPanel.jsx` - Services modal (HAS: Quick Actions with modals)
5. `/app/frontend/src/hooks/mira/useIconState.js` - Tab icon states (HAS: PULSE state support)

### CSS
1. `/app/frontend/src/styles/mira-premium.css` - LEARN styles (FIXED)
2. `/app/frontend/src/styles/mira-unified-header.css` - Header styles (ADDED: notification bell)

---

## REMAINING TASKS (Priority Order)

### P0: Complete Services Tab Pulse
```javascript
// In MiraDemoPage.jsx near line 740:
const [servicesPulse, setServicesPulse] = useState(false);

// In useChatSubmit call near line 3066, add:
setServicesPulse,

// In iconStates or MiraUnifiedHeader, use servicesPulse to add PULSE state to services tab
```

### P0: Link Mira Tickets to CONCIERGE
```python
# In mira_soulful_brain.py execute_create_service_ticket function:
# After creating service_requests entry, also create concierge_threads entry:

concierge_thread = {
    "thread_id": ticket_id,
    "pet_id": pet_id,
    "pet_name": pet_name,
    "user_email": user_email,
    "subject": f"{service_type} request for {pet_name}",
    "status": "open",
    "created_at": datetime.utcnow(),
    "source": "mira_soulful",
    "messages": [{
        "role": "user",
        "content": description,
        "timestamp": datetime.utcnow()
    }]
}
await db.concierge_threads.insert_one(concierge_thread)
```

### P1: Breed-Specific LEARN Content
- Add `breed_tags` to learn_guides/learn_videos documents
- Filter content by pet's breed in `/app/backend/learn_os_routes.py`

### P1: Real-time Services Badge Update
- When ticket created, emit WebSocket event
- Update services count in `useIconState.js`

### P2: Mobile Responsive Polish
- Test all modals on 390x844 viewport
- Fix any text truncation issues

---

## TEST URLS

- **Main Demo**: https://birthday-box-1.preview.emergentagent.com/mira-demo
- **Pure OS Test**: https://birthday-box-1.preview.emergentagent.com/mira-pure-os
- **Login**: `dipali@clubconcierge.in` / `test123`

## TEST SCENARIOS

1. **Grooming Flow**:
   - Say "Book grooming for Mojo"
   - Should: Create ticket, show banner, SERVICES tab should pulse, PICKS should show Care pillar

2. **Travel Flow**:
   - Say "Arrange hotels for Goa trip with Mojo"
   - Should: Create travel_planning ticket, suggest Travel pillar

3. **LEARN Content**:
   - Click LEARN tab → Click Grooming topic
   - Should: Show 6 guides + 4 videos for grooming

4. **CONCIERGE**:
   - Click CONCIERGE tab
   - Should: Show Mira-created tickets as conversations (CURRENTLY BROKEN)

---

## KEY BIBLE REFERENCES

- `/app/memory/MIRA_SOUL_BIBLE.md` - Mira's personality
- `/app/memory/GROOMING_OS.md` - Grooming flow patterns
- `/app/memory/UNIFIED_SERVICE_FLOW.md` - Ticket creation flow
- `/app/memory/LEARN_BIBLE.md` - LEARN tab behavior
- `/app/memory/CONCIERGE_BIBLE.md` - Concierge integration

---

## DATABASE

- **DB Name**: `pet-os-live-test_database`
- **Collections**:
  - `service_requests` - Mira-created tickets
  - `concierge_threads` - Concierge conversations (NEEDS: link to service_requests)
  - `learn_guides` - 36 documents
  - `learn_videos` - 22 documents
  - `pets` - Pet profiles with soul_data, health_data

---

## IMPORTANT CONTEXT

The user was frustrated with:
1. Old AI giving "nonsensical associations" and "height of stupidity" responses
2. Rigid keyword-based logic that didn't follow the 200+ bible documents

The new "Soulful Brain" architecture:
- Uses GPT-5.1 with carefully crafted prompts from the bibles
- Stays focused on what user is ACTUALLY asking
- References pet personality, allergies, health conditions naturally
- Auto-creates service tickets when booking intent detected
- Is MUCH shorter (~650 lines vs 26,000 lines in legacy)

The user wants the **production mira-demo UI** (which they love) with the **new soulful brain** (which gives better conversations).

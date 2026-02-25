# MIRA OS AGENT MASTER PROTOCOL
## MANDATORY Reading Before ANY Work on /mira-demo

---

# ⛔ STOP - COMPLETE HANDOVER PROTOCOL FIRST

**Before reading this file, complete:**
`/app/memory/MANDATORY_HANDOVER_PROTOCOL.md`

That file contains:
1. Required reading order
2. STATE SNAPSHOT template (paste at session start)
3. NON-NEGOTIABLES confirmation
4. PROOF STANDARD requirements
5. NEXT AGENT TASK template
6. MID-TASK HANDOVER template

**This file (AGENT_MASTER_PROTOCOL.md) is the technical reference.**
**MANDATORY_HANDOVER_PROTOCOL.md is the process enforcement.**

---

# ⛔ STOP - READ THIS ENTIRE DOCUMENT FIRST

**This is not optional.** Every agent working on this codebase MUST:
1. Read this entire document
2. Understand all protocols
3. Follow all QA scripts
4. Never skip verification steps

**Failure to follow this protocol will break the system.**

---

# TABLE OF CONTENTS

1. [Core Architecture](#1-core-architecture)
2. [The One Spine Rule](#2-the-one-spine-rule)
3. [Mental Model Copy](#3-mental-model-copy)
4. [Notification System](#4-notification-system)
5. [5 Hard Proofs QA Script](#5-five-hard-proofs-qa-script)
6. [Bug Naming Convention](#6-bug-naming-convention)
7. [UI Copy Locations](#7-ui-copy-locations)
8. [Database Schema](#8-database-schema)
9. [API Endpoints Reference](#9-api-endpoints-reference)
10. [Test Credentials](#10-test-credentials)
11. [File Reference Map](#11-file-reference-map)
12. [Common Failure Modes](#12-common-failure-modes)
13. [Checklist Before Finishing](#13-checklist-before-finishing)

---

# 1. CORE ARCHITECTURE

## The Mental Model (MEMORIZE THIS)

```
┌─────────────────────────────────────────────────────────────┐
│                     MEMBER EXPERIENCE                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   CHAT ──────────► "Where you ASK"                          │
│     │                                                        │
│     ▼                                                        │
│   MIRA AI ───────► Understands intent, creates ticket       │
│     │                                                        │
│     ▼                                                        │
│   SERVICES ──────► "Where it gets DONE"                     │
│     │               (Ticket thread lives here)               │
│     │                                                        │
│     ▼                                                        │
│   NOTIFICATIONS ─► "Doorway back to thread"                 │
│                    (Bell icon, per-pet filtered)             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## The One-Line Spec

> **Chat is where you ask. Services is where it gets done. Notifications simply bring you back to the thread.**

---

# 2. THE ONE SPINE RULE

## Definition

**One Spine = Every execution request becomes ONE canonical ticket thread.**

- Format: `TCK-YYYY-NNNNNN` (e.g., `TCK-2026-000038`)
- Collection: `mira_tickets`
- Every message, update, proof, and notification points back to that same thread.

## Entry Points (ALL must create same spine)

| Entry Point | Handler | Must Call |
|-------------|---------|-----------|
| Chat message | `mira_routes.py` | `handoff_to_spine()` |
| PICKS → Concierge Arranges | `mira_routes.py` | `handoff_to_spine()` |
| SERVICES quick actions | Various routes | `handoff_to_spine()` |
| WhatsApp | `whatsapp_routes.py` | `handoff_to_spine()` |
| System triggers | Various | `handoff_to_spine()` |

## Non-Negotiable Fields on Every Ticket

```javascript
{
  "ticket_id": "TCK-2026-NNNNNN",  // REQUIRED - Canonical format
  "member": {
    "email": "user@example.com",   // REQUIRED
    "id": "uuid",                   // REQUIRED
    "name": "User Name"             // Optional but recommended
  },
  "parent_id": "uuid",              // REQUIRED - Legacy back-compat
  "pet_id": "pet_xxx",              // REQUIRED - For per-pet filtering
  "pet_name": "Mystique",           // REQUIRED - For display
  "has_unread_concierge_reply": false,  // REQUIRED - For badge
  "messages": [],                   // Thread messages
  "created_at": "ISO timestamp",
  "updated_at": "ISO timestamp"
}
```

## The Rule

**If ANY of these fields are missing, the ticket is INVALID.**

---

# 3. MENTAL MODEL COPY

## The Core Sentence (Use Everywhere)

> **Chat is where you ask. Services is where it gets done.**
> Any request you create becomes a tracked thread in Services, where you and Concierge message each other.

## Follow-On Line (Removes Doubt)

> If you want to add details or change timing, reply inside the Services thread so Concierge sees it immediately.

## Required Placements

| Location | File | Status |
|----------|------|--------|
| Onboarding tooltip | `OnboardingTooltip.jsx` | ✅ |
| Confirmation banner | `ConciergeConfirmation.jsx` | ✅ |
| Reply nudge | `ReplyNudge.jsx` | ✅ |
| Help modal FAQs | `HelpModal.jsx` | ✅ |
| Services header | `MiraDemoPage.jsx` | ✅ |

## Help Section FAQs (Verbatim)

```
Q: Where do I see replies from Concierge?
A: In Services. That's your request thread.

Q: What is Chat for then?
A: Chat is where you ask. If it needs action, Mira opens a tracked request in Services.

Q: How do I add details after I've asked?
A: Reply inside the Services thread so Concierge sees it instantly.

Q: What does the badge mean?
A: A badge on Services means Concierge has replied and you haven't opened it yet.
```

---

# 4. NOTIFICATION SYSTEM

## Where Notifications Live

**Bell icon in header** (`NotificationBell.jsx`)
- Location: Top-right of `/mira-demo`
- Polls every 30 seconds
- Filtered by active pet by default

## Notification Card Requirements

Each card MUST show:
- [x] Pet avatar (first letter of pet name)
- [x] Pet name tag
- [x] 1-line title (e.g., "Concierge replied • TCK-2026-000038")
- [x] 1-line preview (truncated message)
- [x] Timestamp
- [x] Unread dot (if unread)

## On Tap Behavior

```javascript
// CORRECT: Go to Services → ticket thread
if (notification.type === 'concierge_reply' && notification.ticket_id) {
    url.pathname = '/mira-demo';
    url.searchParams.set('tab', 'services');
    url.searchParams.set('ticket', notification.ticket_id);
}

// WRONG: Do NOT go to Concierge tab
// url.searchParams.set('tab', 'concierge');  // ❌ NEVER DO THIS
```

## Badge Logic

```
Bell badge = unread notifications (per active pet)
Services badge = unread concierge replies (per active pet)
```

## Two-Way Guarantee

**Every notification MUST have:**
- `ticket_id` (REQUIRED - No ticket = no notification)
- `pet_id` (REQUIRED - For per-pet filtering)
- `user_email` (REQUIRED - For ownership)
- `read` (REQUIRED - For badge state)

## Concierge Reply → Notification Flow

```
Concierge sends reply
    ↓
POST /api/service_desk/concierge_reply
    ↓
Updates mira_tickets.messages[] ✅
Sets has_unread_concierge_reply = true ✅
Creates member_notifications record ✅  ← FIXED
    ↓
Bell badge increments
Member sees notification
Taps → Services → ticket thread
```

## TICKET CREATION CONTRACT (CRITICAL FIX APPLIED)

**Rule:** If user is in pet context, `pet_id` and `pet_name` are MANDATORY.

**Auto-Resolution Logic (in handoff_to_spine):**
1. If pet context provided → use it directly
2. If user has exactly 1 pet → auto-attach that pet
3. If user has multiple pets and none specified → set `needs_pet_selection=true`
4. Never guess the pet silently

**Required Fields on Every Ticket:**
```javascript
{
  ticket_id: "TCK-2026-NNNNNN",  // REQUIRED
  member: {
    email: "...",                 // REQUIRED
    id: "...",                    // REQUIRED (derived)
  },
  parent_id: "...",               // REQUIRED (legacy)
  pet_id: "...",                  // REQUIRED (for per-pet)
  pet_name: "...",                // REQUIRED (for display)
  needs_pet_selection: false,     // True if pet must be selected
}
```

---

# 5. FIVE HARD PROOFS QA SCRIPT

## Run This After ANY Ticketing Changes

### Pre-Conditions
```
Test URL: /mira-demo?debug=1
User: dipali@clubconcierge.in / test123
Pet: Any enriched pet (Mystique, Lola, etc.)
```

### Proof 1: Canonical Ticket Created

```bash
# After creating request in Chat
# Check: ticket_id format is TCK-YYYY-NNNNNN
db.mira_tickets.findOne({ticket_id: /^TCK-/}, {ticket_id: 1})
```

**PASS:** Returns document with valid TCK format
**FAIL:** No document or wrong format

### Proof 2: Ticket Appears in Services

```
1. Create request in Chat
2. Click Services tab
3. EXPECT: New ticket visible immediately
4. Click ticket → thread displays
```

**PASS:** Ticket visible within 1 second
**FAIL:** Delay or missing

### Proof 3: Ownership Fields Populated

```bash
db.mira_tickets.findOne({ticket_id: "TCK-XXXX"}, {
  "member.email": 1,
  "member.id": 1,
  "parent_id": 1,
  "pet_id": 1,
  "pet_name": 1
})
```

**PASS:** All 5 fields present and non-null
**FAIL:** Any field missing or null

### Proof 4: Two-Way Replies in Same Thread

```bash
# 1. Member replies in Services thread
POST /api/user/ticket/{ticket_id}/message

# 2. Check message added
db.mira_tickets.findOne({ticket_id: "TCK-XXXX"}).messages.length

# 3. Concierge replies
POST /api/service_desk/concierge_reply?ticket_id=TCK-XXXX&...

# 4. Check same thread
db.mira_tickets.findOne({ticket_id: "TCK-XXXX"}).messages.length
```

**PASS:** Both messages in same document
**FAIL:** Separate documents or missing messages

### Proof 5: Unread Indicator Works

```bash
# 1. After concierge reply
db.mira_tickets.findOne({ticket_id: "TCK-XXXX"}).has_unread_concierge_reply
# EXPECT: true

# 2. After member opens thread
# EXPECT: false (cleared)

# 3. Check notification created
db.member_notifications.findOne({ticket_id: "TCK-XXXX"})
# EXPECT: Document with read: false
```

**PASS:** Flag toggles correctly, notification exists
**FAIL:** Flag stuck or notification missing

### Pass/Fail Criteria

| Proof | PASS | FAIL |
|-------|------|------|
| 1. Canonical ticket | TCK-YYYY-NNNNNN created | No ticket or wrong format |
| 2. Services visibility | Shows immediately | Delay or missing |
| 3. Ownership fields | All 5 fields present | Any field missing |
| 4. Two-way replies | Same thread | Separate threads |
| 5. Unread indicator | Works + notification | Broken |

**⚠️ If ANY proof fails, One Spine is NOT certified. DO NOT proceed.**

---

# 6. BUG NAMING CONVENTION

## Member-Facing Label (Never Scary)

**"Syncing history"**

Subtext: "Some older requests may appear gradually. New requests are always tracked."

## Internal / Engineering Name

**"Ticket ownership mismatch (parent_id back-compat)"**
Or shorter: **"Ownership contract mismatch"**

## QA Shorthand

**"Spine ownership drift"**

## When Asking Members for Info

```
"If you're following up on a request, please reply in Services 
and include your ticket number (TCK-XXXXXX)."

"A screenshot of the Services thread helps us move faster."
```

**NEVER say to members:** "debug", "logs", "proof panel"

---

# 7. UI COPY LOCATIONS

## The Anchor Sentence (Use Everywhere)
> **Chat is where you ask. Services is where it gets done.**

## Platform-Specific Tooltip Variants

### iOS (Shorter, punchier)
```
Headline: "Chat is where you ask."
Subtext: "Replies appear in Services."
CTA: "Show me"
```

### Android (Slightly more explanatory)
```
Headline: "Chat is where you ask."
Subtext: "When Concierge handles your request, you'll find replies in Services."
CTA: "Show me Services"
```

### Web (Full experience)
```
Headline: "Chat is where you ask."
Subtext: "When Concierge replies or handles your request, you'll find it in Services."
CTA: "Show me Services"
```

## UI Microcopy Locations

| Location | Copy | File |
|----------|------|------|
| Under chat input | "Ask for anything. If it needs action, we'll open a request and handle it in Services." | `ChatInputBar.jsx` |
| Confirmation banner | "Request opened • TCK-XXXXXX<br>Reply in Services to add details or change timing." | `ConciergeConfirmation.jsx` |
| Services header subtitle | "Your execution thread with Concierge. Updates and replies live here." | `ServicesPanel.jsx` |
| Notification dropdown header | "Updates from Concierge. Tap to open the thread in Services." | `NotificationBell.jsx` |
| Onboarding tooltip | Platform-specific variants above | `OnboardingTooltip.jsx` |

## Help/FAQ Copy (Member-Facing)

| Question | Answer |
|----------|--------|
| Where do I see replies from Concierge? | You'll see them in Services. Every request becomes a tracked thread there, and that's where Concierge replies. |
| What is Chat for, then? | Chat is where you ask. If it needs action, we open a request and move it into Services so it's tracked and handled properly. |
| I tapped a notification. Where will it take me? | It opens the exact request thread in Services, so you can see the update and reply in the right place. |
| Can I reply from the notification itself? | Not from the bell dropdown. Tap the notification to open the thread in Services, then reply there. |
| I added details in Chat. Will Concierge see it? | If it's about an open request, add it in Services so it lands inside the same thread and nothing gets missed. |
| What does the badge on Services mean? | It means there's an unread update from Concierge for that pet. |

---

# 8. DATABASE SCHEMA

## mira_tickets (Canonical Spine)

```javascript
{
  "_id": ObjectId,
  "ticket_id": "TCK-2026-000123",
  "title": "Grooming request for Mystique",
  "status": "open|in_progress|completed|cancelled",
  
  // Ownership (ALL 3 REQUIRED)
  "member": {
    "email": "dipali@clubconcierge.in",
    "id": "a152181a-...",
    "name": "Dipali"
  },
  "parent_id": "a152181a-...",
  
  // Pet Context (REQUIRED)
  "pet_id": "pet_xxx",
  "pet_name": "Mystique",
  "pet_context": { /* full pet data */ },
  
  // Thread
  "messages": [
    {
      "id": "msg_xxx",
      "sender": "member|concierge|mira",
      "content": "...",
      "timestamp": "ISO"
    }
  ],
  
  // State
  "has_unread_concierge_reply": false,
  "last_concierge_reply_at": "ISO",
  "created_at": "ISO",
  "updated_at": "ISO",
  
  // Source
  "source": {
    "route": "mira_routes.py:service_handoff",
    "channel": "web|whatsapp|app"
  }
}
```

## member_notifications

```javascript
{
  "id": "notif_xxx",
  "user_email": "dipali@clubconcierge.in",
  "ticket_id": "TCK-2026-000123",  // REQUIRED
  "pet_id": "pet_xxx",              // REQUIRED
  "pet_name": "Mystique",
  "type": "concierge_reply|status_update|confirmation",
  "title": "Concierge replied • TCK-2026-000123",
  "message": "Preview text...",
  "read": false,
  "created_at": "ISO",
  "data": {
    "thread_url": "/mira-demo?tab=services&ticket=TCK-2026-000123"
  }
}
```

## pets (Soul Data)

```javascript
{
  "id": "pet_xxx",
  "name": "Mystique",
  "breed": "Shihtzu",
  "owner_email": "dipali@clubconcierge.in",
  
  // Soul Data (51 fields)
  "doggy_soul_answers": {
    // Identity (6 fields)
    "name", "breed", "age", "weight", "size", "gender",
    
    // Health (8 fields) - CRITICAL for Health-First Rule
    "allergies", "medical_conditions", "sensitive_stomach",
    "dietary_restrictions", "medications", "vaccination_status",
    "spayed_neutered", "last_vet_visit",
    
    // Personality (6 fields)
    "general_nature", "energy_level", "stranger_reaction",
    "behavior_with_dogs", "behavior_with_humans", "separation_anxiety",
    
    // Fears (3 fields)
    "anxiety_triggers", "loud_sounds", "fear_response",
    
    // Preferences (7 fields)
    "favorite_treats", "favorite_toys", "favorite_activities",
    "dislikes", "diet_type", "food_brand", "feeding_schedule",
    
    // Travel (6 fields)
    "travel_style", "car_comfort", "motion_sickness",
    "crate_trained", "hotel_experience", "flight_experience",
    
    // Training (5 fields)
    "training_level", "commands_known", "leash_behavior",
    "potty_trained", "crate_behavior",
    
    // Lifestyle (5 fields)
    "daily_routine", "sleeping_spot", "exercise_needs",
    "grooming_frequency", "last_grooming",
    
    // Special (5 fields)
    "special_needs", "emergency_contact", "vet_clinic",
    "do_not_recommend", "good_for"
  },
  
  // Soul Enrichments (learned from conversations)
  "soul_enrichments": {
    "learned_facts": [],
    "dislikes": [],
    "preferences_learned": {}
  },
  
  "overall_score": 85.0,
  "score_tier": "soul_mate|best_friend|newcomer"
}
```

---

# 9. API ENDPOINTS REFERENCE

## Ticket Operations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/mira/chat` | POST | Main chat, creates tickets |
| `/api/mira/tickets` | GET | Get user's tickets for Services |
| `/api/service_desk/concierge_reply` | POST | Concierge sends reply |
| `/api/user/ticket/{id}/message` | POST | Member sends message |

## Notification Operations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/member/notifications/inbox/{email}` | GET | Get notifications (with pet filter) |
| `/api/member/notifications/{id}/mark-read` | PUT | Mark notification read |
| `/api/member/notifications/mark-all-read/{email}` | PUT | Mark all read |

## Pet Operations

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/pets/my-pets` | GET | Get user's pets |
| `/api/pets/{id}` | GET | Get single pet |

---

# 10. TEST CREDENTIALS

```
Email: dipali@clubconcierge.in
Password: test123

Test Pets (Enriched with 50+ fields):
- Mystique (senior, arthritis, chicken/wheat allergy)
- Lola (young, energetic, beef/corn allergy)
- Meister (senior, heart condition, severe anxiety)
- Bruno (young, high energy, loves swimming)
- Luna (hip dysplasia, grain allergy)

Debug URL: /mira-demo?debug=1
```

---

# 11. FILE REFERENCE MAP

## Backend (Critical Files)

| File | Purpose |
|------|---------|
| `/app/backend/mira_routes.py` | Main chat logic (20k+ lines - needs refactor) |
| `/app/backend/mira_service_desk.py` | Service desk operations, concierge_reply |
| `/app/backend/utils/service_ticket_spine.py` | Canonical ticket creation |
| `/app/backend/utils/spine_helper.py` | Route adapter for spine |
| `/app/backend/soul_intelligence.py` | Pet soul data handling |
| `/app/backend/utils/soul_learning_engine.py` | Learns from conversations |
| `/app/backend/utils/breed_mention_detector.py` | Breed bug monitoring |

## Frontend (Critical Files)

| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/MiraDemoPage.jsx` | Main Mira UI (large - needs refactor) |
| `/app/frontend/src/components/Mira/NotificationBell.jsx` | Bell icon + dropdown |
| `/app/frontend/src/components/Mira/OnboardingTooltip.jsx` | Mental model tooltip |
| `/app/frontend/src/components/Mira/HelpModal.jsx` | Help FAQs |
| `/app/frontend/src/components/Mira/ConciergeConfirmation.jsx` | Confirmation banner |
| `/app/frontend/src/components/PicksVault/UnifiedPicksVault.jsx` | Picks display |

## Memory/Documentation

| File | Purpose |
|------|---------|
| `/app/memory/PET_OS_BEHAVIOR_BIBLE.md` | The Law - Design spec |
| `/app/memory/ONE_SPINE_SPEC.md` | Ticket system spec |
| `/app/memory/ONE_SPINE_AUDIT_REPORT.md` | Latest audit results |
| `/app/memory/NOTIFICATION_SYSTEM_AUDIT.md` | Notification audit |
| `/app/memory/PRD.md` | Product requirements |
| `/app/memory/AGENT_MASTER_PROTOCOL.md` | THIS FILE |

---

# 12. COMMON FAILURE MODES

## Failure: Ticket not appearing in Services

**Cause:** Missing user_id or wrong collection
**Fix:** Verify `handoff_to_spine()` writes to `mira_tickets` with member fields

## Failure: Badge not showing

**Cause:** `has_unread_concierge_reply` not set
**Fix:** Check concierge_reply endpoint sets flag to `true`

## Failure: Badge not clearing

**Cause:** Mark-read not called
**Fix:** Verify frontend calls mark-read when ticket opened

## Failure: Replies in separate threads

**Cause:** New ticket created instead of appending
**Fix:** Use `$push` to messages array, not new document

## Failure: Notification not created

**Cause:** `concierge_reply` missing notification insert
**Fix:** Add `member_notifications.insert_one()` after reply

## Failure: Notification tap goes wrong place

**Cause:** Deep-link goes to Concierge tab instead of Services
**Fix:** Set `tab=services&ticket=TCK-XXX`

## Failure: Pet context missing

**Cause:** Ticket created without pet_id/pet_name
**Fix:** Ensure `handoff_to_spine()` receives pet context

---

# 13. CHECKLIST BEFORE FINISHING

## After ANY Ticketing Work

- [ ] Ran 5 Hard Proofs QA script
- [ ] All 5 proofs PASS
- [ ] Tested notification flow (concierge reply → bell badge)
- [ ] Verified deep-link goes to Services (not Concierge)
- [ ] Checked pet context on new tickets
- [ ] Updated relevant audit documents

## After ANY UI Copy Changes

- [ ] Verified copy matches Mental Model spec
- [ ] Checked all 5 copy locations
- [ ] Tested Help FAQs display correctly

## After ANY Notification Changes

- [ ] Tested concierge_reply creates notification
- [ ] Verified notification has ticket_id and pet_id
- [ ] Tested tap navigation to Services
- [ ] Verified badge logic per-pet

## Before Handoff to Next Agent

- [ ] Updated `/app/memory/PRD.md`
- [ ] Updated relevant audit documents
- [ ] Documented any new failure modes
- [ ] Listed pending issues clearly
- [ ] Provided test commands for verification

---

# DOCUMENT VERSION

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 18, 2026 | Emergent Agent | Initial comprehensive protocol |

---

# REMEMBER

> **Chat is where you ask. Services is where it gets done. Notifications simply bring you back to the thread.**

**If you break One Spine, you break the entire user experience.**

Read the Bible. Follow the protocol. Run the QA. Every. Single. Time.

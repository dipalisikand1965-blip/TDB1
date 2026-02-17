# PET_OS_BEHAVIOR_BIBLE
## System Contract & Operational Specification
### Version 1.0 | February 17, 2026

---

# PREAMBLE

This document defines **HOW the Mira OS behaves** as a system. It is the companion to:
- **PET_OS_UI_UX_BIBLE** (what things look like)
- **MIRA_DOCTRINE** (what Mira says)
- **MOJO_BIBLE** (what data exists)

**This Bible answers:** How does the system respond to user actions? What are the exact rules?

---

# SECTION 1: OS STATE MACHINE

## 1.1 The Hierarchy (This Is Law)

```
Active Pet (Mojo) → Tab (Today/Picks/Services/Learn/Concierge) → Flow (task/booking/plan/advice) → Output (saved + tracked)
```

**If something breaks this order, it will feel wrong.**

---

## 1.2 Root State

The OS always has one root state:

```
CHAT_HOME (default, always present underneath)
```

Chat is never "closed." It is the substrate. Everything else overlays.

---

## 1.3 Layer States (Overlays)

| Layer State | Opens From | Contains |
|-------------|------------|----------|
| `MOJO_OPEN` | Pet avatar tap | Pet identity, soul, settings |
| `TODAY_OPEN` | TODAY tab | Urgency dashboard |
| `PICKS_OPEN` | PICKS tab | Curated recommendations |
| `SERVICES_OPEN` | SERVICES tab or Pick tap | Execution inbox |
| `LEARN_OPEN` | LEARN tab | Education library |
| `CONCIERGE_OPEN` | CONCIERGE tab or C° icon | Human handoff threads |
| `TASK_DETAIL_OPEN` | Task tap (from any layer) | Single task view |

---

## 1.4 Layer Stacking Rules

### Rule A: Maximum Stack Depth = 2
```
CHAT_HOME → Layer 1 (e.g., PICKS_OPEN) → Layer 2 (e.g., TASK_DETAIL_OPEN)
```

Never allow 3+ layers. If user tries to open a third, close Layer 1 first.

### Rule B: Tabs Never Hard-Navigate
Tapping a header tab opens that layer **over** chat. It does NOT navigate away.

### Rule C: What Closes What

| Action | Result |
|--------|--------|
| Tap same tab again | Close that layer → return to CHAT_HOME |
| Tap different tab | Close current layer → open new layer |
| Tap BACK | Close topmost layer → return to previous |
| Tap overlay background | Close topmost layer |
| ESC key (desktop) | Close topmost layer |
| Complete action (confirm/send) | Close all layers → return to CHAT_HOME with success toast |

### Rule D: Return to Chat After Every Action

After any of these:
- Task created
- Task confirmed
- Message sent to Concierge
- Insight saved
- Service booked

**System MUST:**
1. Close all layers
2. Return to CHAT_HOME
3. Show success toast (3 seconds)
4. Optionally show confirmation message in chat

---

## 1.5 BACK Behavior Specification

| Current State | BACK Result |
|---------------|-------------|
| CHAT_HOME | No-op (already at root) |
| Layer 1 open | Close Layer 1 → CHAT_HOME |
| Layer 2 open (detail) | Close Layer 2 → Layer 1 |
| Layer 2 open (from chat CTA) | Close Layer 2 → CHAT_HOME |

### Mobile Back Button / Swipe
- Must follow same rules
- Never exit app from CHAT_HOME (show "tap again to exit" toast)

---

## 1.6 State Persistence on Layer Close

When a layer closes:

| Element | Behavior |
|---------|----------|
| Scroll position in layer | Reset to top on next open |
| Filter selections | Persist per session per pet |
| Draft in layer forms | Persist for 5 minutes, then clear |
| Chat scroll position | Preserved exactly |
| Chat draft message | Preserved until sent or cleared |

---

# SECTION 2: ICON STATE SYSTEM (OFF / ON / PULSE)

## 2.1 The Three States

| State | Visual | Meaning |
|-------|--------|---------|
| **OFF** | Dim/muted icon, no indicator | No relevant items for current pet in that category |
| **ON** | Lit icon, subtle dot | Relevant items exist (even if previously seen) |
| **PULSE** | Animated glow/pulse, prominent dot | NEW items added/changed since last checkpoint |

---

## 2.2 State Definitions Per Tab

### MOJO Icon (Pet Avatar)
| State | Condition |
|-------|-----------|
| OFF | Never OFF - pet always exists when in OS |
| ON | Pet profile exists AND soul score >= 50% |
| PULSE | Soul score < 50% (incomplete profile) OR new insights discovered OR pending suggestions to enhance profile |

**Visual Implementation:**
- MOJO uses the pet avatar ring instead of a traditional icon
- PULSE state shows animated glow effect + attention dot on avatar
- ON state shows normal avatar with soul score badge
- The avatar's ring color indicates soul score progress

### TODAY Icon
| State | Condition |
|-------|-----------|
| OFF | Zero alerts, zero due items, zero active tasks for this pet |
| ON | Has alerts OR due items OR active tasks |
| PULSE | New alert added OR task status changed since last visit |

### PICKS Icon
| State | Condition |
|-------|-----------|
| OFF | Zero relevant picks generated (rare - should almost never happen) |
| ON | Picks exist for current pet + current context |
| PULSE | Picks regenerated with new items since last visit |

### SERVICES Icon
| State | Condition |
|-------|-----------|
| OFF | Zero active service requests for this pet |
| ON | Has active requests OR conversation triggered service intent |
| PULSE | New request created OR status changed OR "Awaiting you" item exists |

### CONCIERGE Icon (C°)
| State | Condition |
|-------|-----------|
| OFF | No active threads, Concierge offline |
| ON | Concierge available OR has open threads |
| PULSE | New message received OR "Awaiting you" response needed |

### LEARN Icon
| State | Condition |
|-------|-----------|
| OFF | No personalized content flagged |
| ON | Has "For your pet" content available |
| PULSE | New content added matching pet profile |

---

## 2.3 State Transition Rules

### Visiting Tab: PULSE → ON (Not ON → OFF)

```
User visits PICKS tab:
  - If state was PULSE → becomes ON
  - If state was ON → stays ON
  - If state was OFF → stays OFF

ON does NOT become OFF just because user visited.
ON only becomes OFF when items literally become zero.
```

### Conversation Intent Triggers

| User Says | Icon That Lights Up |
|-----------|---------------------|
| "groom", "haircut", "bath", "nails" | SERVICES (pre-filter: Grooming) |
| "vet", "checkup", "vaccination" | SERVICES (pre-filter: Vet Care) |
| "train", "behavior", "commands" | SERVICES (pre-filter: Training) |
| "board", "stay", "daycare" | SERVICES (pre-filter: Boarding) |
| "walk", "walker", "exercise" | SERVICES (pre-filter: Walking) |
| "birthday", "party", "celebrate" | PICKS (Celebrate pillar) |
| "treats", "food", "kibble" | PICKS (Dine pillar) |
| "travel", "trip", "flight" | PICKS (Travel pillar) |
| Any task/reminder created | TODAY |
| "help", "talk to someone", "concierge" | CONCIERGE |

---

## 2.4 Pet Switch Behavior

When user switches active pet:

```
1. ALL icon states reset to OFF
2. System re-evaluates each tab for new pet
3. States set to ON or PULSE based on new pet's data
4. Picks regenerate for new pet
5. Today refreshes for new pet
6. Services filters to new pet's requests
7. Concierge filters to new pet's threads
```

**No cross-pet state leakage. Ever.**

---

## 2.5 Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Color alone not sufficient | Dot indicator + count badge |
| Screen reader | Announce: "{Tab} - {count} items, {new/updated}" |
| Reduced motion | No pulse animation, use static "new" badge instead |
| High contrast | Ensure dot visible in all themes |

### Visual Spec

```
OFF:   Icon at 50% opacity, no dot
ON:    Icon at 100% opacity, small dot (6px) bottom-right
PULSE: Icon at 100% opacity, dot with subtle pulse animation (1s loop), count badge if >1
```

---

## 2.6 PULSE Decay Rules

| Scenario | PULSE Duration |
|----------|----------------|
| User visits the tab | Immediately becomes ON |
| User doesn't visit | Stays PULSE indefinitely |
| New items added while already PULSE | Stays PULSE, count updates |
| Session ends (app closed) | On reopen, recalculate fresh |

**PULSE is not time-based. It's visit-based.**

---

# SECTION 3: CHAT CONTINUITY CONTRACT

## 3.1 Scroll Position Rules

| Scenario | Behavior |
|----------|----------|
| User navigates to tab, returns to chat | **Exact scroll position preserved** |
| User is at bottom, new message arrives | Auto-scroll to bottom |
| User scrolled up, new message arrives | Show "↓ New message" indicator, do NOT auto-scroll |
| User taps "↓ New message" | Smooth scroll to bottom |
| App returns from background (<5 min) | Preserve exact position |
| App returns from background (>5 min) | Scroll to bottom, show "Catching up..." if loading |

---

## 3.2 Draft Message Persistence

| Scenario | Behavior |
|----------|----------|
| User types, navigates to tab | Draft preserved |
| User types, switches pet | Draft cleared (new pet = new context) |
| User types, app goes to background | Draft preserved for 30 minutes |
| User types, closes app | Draft preserved for 30 minutes |
| User types, session expires | Draft cleared |

### Draft Storage
```javascript
{
  pet_id: "pet-xxx",
  draft_text: "I want to...",
  draft_attachments: [],
  timestamp: "2026-02-17T...",
  expires_at: "2026-02-17T..." // +30 minutes
}
```

---

## 3.3 "New Updates" Indicator Rules

### When User Is Away From Chat

| Event | Indicator |
|-------|-----------|
| Mira sends a message | Show "1 new message" pill |
| Multiple messages | Show "{n} new messages" pill |
| Task status changed | Show "Updates available" pill |
| Concierge replied | Show "New reply" pill + CONCIERGE icon PULSE |

### Indicator Placement
- Floating pill above chat input
- Tap to scroll to first unread
- Auto-dismiss when user scrolls to those messages

---

## 3.4 Long Idle / Refresh Handling

| Idle Duration | Behavior |
|---------------|----------|
| < 5 minutes | No refresh, preserve all state |
| 5-30 minutes | Soft refresh: check for new messages, preserve scroll |
| 30-60 minutes | Medium refresh: reload picks, preserve chat history |
| > 60 minutes | Full refresh: reload all, scroll to bottom, show "Welcome back" |

### Reconnection After Offline

```
1. Show "Reconnecting..." toast
2. Fetch missed messages
3. If messages exist: show "X new messages" indicator
4. If no messages: silent reconnect
5. Never lose typed draft during reconnect
```

---

# SECTION 4: INSIGHTS PRODUCT OBJECT

## 4.1 What Is An Insight?

**Insight = A discrete piece of learned intelligence about a pet that the user or Mira wants to remember.**

### Insight Types

| Type | Example | Source |
|------|---------|--------|
| `preference` | "Lola prefers chicken over beef" | Chat extraction |
| `behavior` | "Gets anxious during thunderstorms" | Chat extraction |
| `health_note` | "Sensitive stomach, needs bland diet" | Chat extraction |
| `routine` | "Walks at 7am and 6pm daily" | Chat extraction |
| `tip` | "Use peanut butter for nail trimming" | Learn save |
| `meal_plan` | "Weekly meal rotation schedule" | Mira generation |
| `grooming_pref` | "Prefers mobile groomer, scared of salons" | Service outcome |
| `memory` | "First beach trip - loved the water" | User manual save |

---

## 4.2 Where Insights Live

```
Primary Storage: Pet Hub → Insights Section
                 (NOT in chat, NOT in separate app section)

Access Path: Tap Pet Avatar → Mojo Hub → Insights tab
```

### Insight Schema

```json
{
  "id": "ins-xxx",
  "pet_id": "pet-xxx",
  "type": "preference",
  "category": "food",
  "title": "Protein Preference",
  "content": "Lola prefers chicken over beef and lamb",
  "confidence": 0.9,
  "source": "chat_extraction",
  "source_ref": "msg-xxx",
  "created_at": "2026-02-17T...",
  "updated_at": "2026-02-17T...",
  "verified_by_user": false,
  "tags": ["food", "preference", "protein"]
}
```

---

## 4.3 Teaser-In-Chat Rules

### What Shows In Chat

```
┌────────────────────────────────────────────────────────────────┐
│ 💡 Saved to Lola's Insights  •  "Prefers chicken"  →  [View]  │
└────────────────────────────────────────────────────────────────┘
```

**Rules:**
- Single line only (max 60 characters)
- Shows immediately after Mira extracts/saves an insight
- Tap "[View]" → Opens Mojo Hub → Insights
- Auto-dismiss after 10 seconds OR user scrolls past
- Maximum 1 teaser visible at a time

### What Does NOT Show In Chat
- ❌ Full insight cards
- ❌ Insight lists/grids
- ❌ Insight editing UI
- ❌ Multiple stacked teasers

---

## 4.4 Save Rules

### Auto-Save (Mira Extraction)
Mira automatically saves when detecting:
- Explicit preferences: "He loves X" / "She hates Y"
- Health info: "allergic to X" / "sensitive stomach"
- Behavior: "gets scared of X" / "loves to X"
- Routine: "we always X at Y time"

**Confidence Threshold for Auto-Save: 0.7+**

### Manual Save
User can save from:
- Learn article: "Save this tip"
- Chat: Long-press message → "Save as insight"
- Mira suggestion: "Want me to remember this?"

### Confirmation Requirement

| Source | Requires Confirmation? |
|--------|------------------------|
| User explicitly says "remember this" | No |
| User saves from Learn | No |
| Mira extracts from casual mention | Yes - show teaser + "Saved ✓" |
| Mira infers from context | Yes - ask "Should I remember that X?" |

---

## 4.5 Differentiation From Other Data

| Data Type | What It Is | Where It Lives |
|-----------|------------|----------------|
| **Insight** | Discrete learned fact | Mojo Hub → Insights |
| **Trait** | Scored attribute in trait graph | Backend only, powers AI |
| **Timeline Event** | Historical occurrence | Mojo Hub → Timeline |
| **Picks Reasoning** | Why a pick was shown | Pick card "Why this?" |
| **Learn Save** | Bookmarked article | Learn → Saved |
| **Memory (Soul)** | Raw extraction from chat | Backend memory store |

**Insights are USER-FACING. Traits are SYSTEM-INTERNAL.**

---

# SECTION 5: UNIFIED SERVICE TICKET SCHEMA

## 5.0 Canonical Ticket ID Format

**Format:** `TCK-YYYY-NNNNNN`

| Component | Description | Example |
|-----------|-------------|---------|
| `TCK` | Fixed prefix | TCK |
| `YYYY` | Current year | 2026 |
| `NNNNNN` | 6-digit sequential (atomic counter) | 000001 |

**Example:** `TCK-2026-000001`, `TCK-2026-000002`, ...

**Validation Regex:** `^TCK-\d{4}-\d{6}$`

**Why this format:**
- Sequential IDs are sortable and audit-friendly
- No random suffix collisions or debug ambiguity
- Easy for support teams to reference
- Atomic counter prevents duplicates

**UNIFORM SERVICE FLOW (Non-negotiable):**
```
User Intent (from anywhere, incl Search) → User Request → Service Desk Ticket → 
Admin Notification → Member Notification → Pillar Request → Tickets → Channel Intakes
```

Every actionable request MUST create or attach to a Service Desk Ticket with a canonical `ticket_id`.
Icons/badges are a READOUT of this spine, not independent features.

**⚠️ CRITICAL: All ticket creation must route through `create_or_attach_service_ticket()`**

Located at: `/app/backend/utils/service_ticket_spine.py`

This is the SINGLE ENTRY POINT for ALL ticket creation/attachment. NO route should generate ticket_id directly.
The helper enforces:
- Canonical ID format (TCK-YYYY-NNNNNN)
- Attach vs Create logic (idempotent)
- Source + channel tracking (for audits)
- Admin + Member notifications

**Legacy Format:** `TKT-YYYYMMDD-XXXX` is deprecated. Use `legacy_ticket_id` field for migration/tracing only.

## 5.1 Ticket Schema (Complete)

```json
{
  // === IDENTITY ===
  // CANONICAL FORMAT: TCK-YYYY-NNNNNN (e.g., TCK-2026-000001)
  // - TCK: Fixed prefix
  // - YYYY: Current year
  // - NNNNNN: 6-digit sequential number (atomic counter)
  // 
  // Why sequential: Sortable, audit-friendly, no collision, easy support comms
  // Legacy format (TKT-YYYYMMDD-XXXX) is deprecated - alias only for tracing
  "ticket_id": "TCK-2026-000001",
  "short_id": "000001",
  "legacy_ticket_id": null, // For migration: old TKT-... format if exists
  
  // === CLASSIFICATION ===
  "type": "grooming_request",
  "pillar": "care",
  "category": "grooming",
  "subcategory": "full_groom",
  "priority": "normal", // low | normal | high | urgent | emergency
  
  // === OWNERSHIP ===
  "pet_id": "pet-xxx",
  "pet_name": "Lola",
  "user_id": "user-xxx",
  "user_name": "Dipali",
  "user_email": "dipali@...",
  "user_phone": "+91...",
  
  // === STATUS ===
  "status": "requested",
  "status_history": [
    {"status": "draft", "at": "...", "by": "user"},
    {"status": "requested", "at": "...", "by": "user"}
  ],
  
  // === TIMESTAMPS (SLA) ===
  "created_at": "2026-02-17T10:00:00Z",
  "first_response_at": null,
  "resolved_at": null,
  "closed_at": null,
  "due_by": "2026-02-18T10:00:00Z", // SLA deadline
  
  // === ASSIGNMENT ===
  "assigned_to": null, // agent user_id
  "assigned_at": null,
  "vendor_id": null,
  "vendor_name": null,
  
  // === CONTENT ===
  "subject": "Grooming for Lola",
  "description": "Full groom needed, she's getting matted",
  "requirements": {
    "preferred_date": "2026-02-20",
    "preferred_time": "morning",
    "location": "home",
    "special_instructions": "She's scared of dryers"
  },
  
  // === PET CONTEXT (Auto-filled from Mojo) ===
  "pet_context": {
    "breed": "Maltese",
    "coat_type": "long",
    "allergies": ["chicken"],
    "behavior_notes": "anxious with strangers",
    "grooming_history": "last groomed 6 weeks ago"
  },
  
  // === OPTIONS (Concierge-provided) ===
  "options": [
    {
      "option_id": "opt-1",
      "title": "Home Grooming - PetCare Pro",
      "price": 1500,
      "currency": "INR",
      "time_slot": "Feb 20, 10am-12pm",
      "inclusions": ["bath", "haircut", "nails", "ears"],
      "selected": false
    }
  ],
  "selected_option_id": null,
  
  // === COMMUNICATIONS ===
  "messages": [
    {
      "id": "msg-xxx",
      "sender": "user", // user | agent | system | mira
      "channel": "chat", // chat | email | whatsapp
      "content": "...",
      "attachments": [],
      "created_at": "..."
    }
  ],
  "thread_id": "thread-xxx", // links to Concierge thread
  
  // === EXTERNAL COMMS MAPPING ===
  "email_thread_id": "email-xxx",
  "whatsapp_thread_id": "wa-xxx",
  
  // === OUTCOME ===
  "resolution": null,
  "outcome": null, // completed | cancelled | unable
  "outcome_notes": null,
  "rating": null,
  "feedback": null,
  
  // === AUDIT ===
  "audit_log": [
    {
      "action": "created",
      "by": "user-xxx",
      "at": "...",
      "details": {}
    }
  ],
  
  // === METADATA ===
  "source": "mira_chat", // mira_chat | web | whatsapp | email | admin
  "tags": [],
  "internal_notes": []
}
```

---

## 5.2 Status Definitions & Transitions

| Status | Meaning | Who Can Set |
|--------|---------|-------------|
| `draft` | User started but not submitted | User |
| `requested` | User submitted, awaiting response | User, Mira |
| `acknowledged` | Agent saw it, working on options | Agent |
| `options_ready` | Options provided, awaiting user choice | Agent |
| `awaiting_user` | Need user input/decision | Agent |
| `user_confirmed` | User chose an option | User |
| `in_progress` | Service being executed | Agent, System |
| `scheduled` | Appointment confirmed | Agent |
| `completed` | Service delivered | Agent |
| `cancelled` | User or agent cancelled | User, Agent |
| `unable` | Cannot fulfill | Agent |

### Valid Transitions

```
draft → requested
requested → acknowledged | cancelled
acknowledged → options_ready | in_progress | unable | cancelled
options_ready → awaiting_user | user_confirmed | cancelled
awaiting_user → user_confirmed | cancelled
user_confirmed → scheduled | in_progress
scheduled → in_progress | cancelled
in_progress → completed | cancelled | unable
```

---

## 5.3 SLA Definitions

| Priority | First Response | Resolution |
|----------|----------------|------------|
| `emergency` | 15 minutes | 2 hours |
| `urgent` | 1 hour | 24 hours |
| `high` | 4 hours | 48 hours |
| `normal` | 24 hours | 72 hours |
| `low` | 48 hours | 1 week |

### SLA Breach Handling

```
If first_response_at is null AND now > created_at + SLA:
  → Flag ticket as "SLA Breach - First Response"
  → Notify admin
  → Auto-escalate if configured

If resolved_at is null AND now > created_at + Resolution SLA:
  → Flag ticket as "SLA Breach - Resolution"
  → Notify admin + manager
```

---

## 5.4 WhatsApp / Email Thread Mapping

### Incoming Message Routing

```
1. Message arrives on WhatsApp/Email
2. System checks: does sender have open ticket?
   - YES → Append to that ticket's messages[]
   - NO → Create new ticket with source = "whatsapp" | "email"
3. Update ticket.messages[] with channel info
4. Notify agent
5. Update ticket status if needed
```

### Outgoing Message Routing

```
1. Agent sends reply from Service Desk
2. System checks ticket.messages for last user channel
3. Send via same channel (WhatsApp/Email/Chat)
4. Store in ticket.messages[] with channel info
5. If Concierge chat: also push to user's Concierge thread
```

---

## 5.5 Audit Trail Rules

**Every change to a ticket MUST be logged:**

```json
{
  "action": "status_changed",
  "by": "agent-xxx",
  "by_name": "Aditya",
  "at": "2026-02-17T12:30:00Z",
  "details": {
    "from": "requested",
    "to": "acknowledged"
  }
}
```

### Required Audit Events

- created
- status_changed
- assigned
- option_added
- option_selected
- message_sent
- message_received
- sla_breached
- escalated
- resolved
- cancelled

---

# SECTION 6: MEMORY WRITE POLICY

## 6.1 What Chat Can Write Directly to Mojo

| Data Type | Can Write? | Confidence Required | Confirmation? |
|-----------|------------|---------------------|---------------|
| Preference (food) | ✅ Yes | 0.8+ | Teaser only |
| Preference (other) | ✅ Yes | 0.8+ | Teaser only |
| Allergy | ⚠️ Careful | 0.95+ | Must confirm |
| Health condition | ❌ No | N/A | Requires Soul Form |
| Weight | ❌ No | N/A | Requires manual entry |
| Behavior trait | ✅ Yes | 0.7+ | Teaser only |
| Routine | ✅ Yes | 0.7+ | Teaser only |
| Dislike | ✅ Yes | 0.8+ | Teaser only |

---

## 6.2 Confidence Scoring

| Source | Base Confidence |
|--------|-----------------|
| Soul Form answer | 1.0 |
| User explicit statement: "Lola is allergic to X" | 0.95 |
| User explicit preference: "She loves X" | 0.9 |
| Repeated mentions (3+) | +0.1 to base |
| Single casual mention | 0.7 |
| Inferred from context | 0.5 |
| Breed default | 0.3 |

### Confidence Threshold for Writing

```
Write immediately: confidence >= 0.8
Ask to confirm: confidence 0.6 - 0.79
Do not write: confidence < 0.6 (store in memory, not Mojo)
```

---

## 6.3 Contradiction Handling

### Detection

```
Existing: "Lola loves chicken"
New input: "She doesn't like chicken anymore"

System detects: contradiction on (pet=Lola, attribute=food_preference, value=chicken)
```

### Resolution Flow

```
1. DO NOT overwrite immediately
2. Ask user: "I remember Lola loved chicken. Has that changed?"
3. User confirms → Create new version, mark old as superseded
4. User denies → Keep existing, discard new
5. Log contradiction event for review
```

### Versioning Schema

```json
{
  "attribute": "food_preference_protein",
  "current_value": "chicken",
  "current_confidence": 0.95,
  "history": [
    {
      "value": "beef",
      "confidence": 0.8,
      "set_at": "2026-01-15",
      "superseded_at": "2026-02-17",
      "superseded_reason": "user_correction"
    }
  ]
}
```

---

## 6.4 Parent Preference vs Pet Preference

| Type | Example | Storage Location |
|------|---------|------------------|
| Pet Preference | "Lola loves chicken" | `pet.preferences.food` |
| Parent Preference | "I prefer morning appointments" | `user.preferences.scheduling` |
| Pet-Parent Combo | "I don't want Lola eating rawhide" | `pet.constraints.parent_rules` |

### Write Rules

- Pet preferences → Write to pet document
- Parent preferences → Write to user document
- Parent rules about pet → Write to pet.constraints with source="parent"

---

## 6.5 Service Outcomes → Trait Updates

When a service completes successfully:

```
1. Extract relevant trait signals:
   - Grooming completed → update pet.grooming.last_groomed
   - Groomer feedback "calm during session" → increase pet.behavior.grooming_comfort confidence
   - User rated 5 stars → store vendor preference

2. Update trait graph with new evidence:
   - Add evidence entry
   - Recalculate confidence
   - Update soul score if new category completed

3. Log update in audit trail
```

---

# SECTION 7: MULTI-PET RULES

## 7.1 Chat Scope

**Decision: Chat is PER-PET**

| Approach | Our Choice |
|----------|------------|
| ❌ Shared chat for all pets | Confusing context |
| ✅ Separate chat per pet | Clear context |

### Implementation

```
- Each pet has own chat thread
- Switching pet loads that pet's chat history
- Chat input placeholder: "Ask about {pet_name}..."
- Clear visual indicator: pet avatar in chat header
```

### Banner on Pet Switch

When user switches pet mid-conversation:

```
┌──────────────────────────────────────────────┐
│ 🐕 Now chatting about Bruno                  │
│ (Lola's conversation is saved)               │
└──────────────────────────────────────────────┘
```

---

## 7.2 Cross-Pet Tasks

### Single Ticket, Multiple Pets

For services that can cover multiple pets (e.g., grooming both dogs):

```json
{
  "ticket_id": "TKT-xxx",
  "pets": [
    {"pet_id": "pet-1", "pet_name": "Lola"},
    {"pet_id": "pet-2", "pet_name": "Bruno"}
  ],
  "is_multi_pet": true,
  "primary_pet_id": "pet-1" // for display purposes
}
```

### Rules

- Shows in SERVICES for ALL included pets
- Status synced across pets
- Pricing may be combined or itemized
- Completion marks for all pets

### When to Split

```
Split into separate tickets when:
- Different service types per pet
- Different scheduling requirements
- Different vendors needed
- User explicitly requests separate handling
```

---

## 7.3 Today "Other Pets" Shelf

### Placement
Bottom of TODAY, collapsed by default

### What Qualifies

```
Show "Other pets need attention" when any non-active pet has:
- Urgent alert (vaccination overdue, health concern)
- Task in "Awaiting you" status
- Upcoming appointment in next 24 hours
```

### Display Rules

```
┌─────────────────────────────────────────────┐
│ 🐕 Other pets                          [▼]  │
├─────────────────────────────────────────────┤
│ Bruno: Vaccination overdue                  │
│ Max: Grooming tomorrow 10am                 │
└─────────────────────────────────────────────┘

- Maximum 3 items shown
- Tap item → switch to that pet + open relevant layer
- Tap header → expand to show all (max 10)
```

---

## 7.4 Pick Generation for Multi-Pet Requests

When user mentions multiple pets:

> "I need grooming for Lola and Bruno"

### Handling

```
1. Primary pet = first mentioned OR active pet
2. Generate picks for primary pet
3. Add note: "Also scheduling for Bruno"
4. Create multi-pet task on pick tap
5. Picks panel shows: "Grooming for Lola & Bruno"
```

### What NOT To Do

- ❌ Don't show duplicate picks for each pet
- ❌ Don't switch active pet automatically
- ❌ Don't generate separate pick sets side by side

---

# SECTION 8: SAFETY MODE SUPPRESSION RULES

## 8.1 Emergency Override

### Trigger Detection

```
Emergency keywords:
- choking, seizure, unconscious, not breathing
- bleeding heavily, hit by car, poisoned
- ate chocolate/xylitol/grapes, swallowed object
- collapsed, can't walk, extreme pain

Emergency intent confidence >= 0.8 triggers override
```

### What Gets Suppressed

| Element | Normal | Emergency |
|---------|--------|-----------|
| Product picks | ✅ Show | ❌ Hide |
| Service picks | ✅ Show | ⚠️ Only emergency services |
| Shopping CTAs | ✅ Show | ❌ Hide |
| Concierge | ✅ Normal | 🔴 Prominent + urgent |
| Learn content | ✅ Show | ❌ Hide |
| Ads/promos | ✅ Show | ❌ Hide |

### Emergency UI

```
┌─────────────────────────────────────────────────┐
│ 🚨 EMERGENCY MODE                               │
├─────────────────────────────────────────────────┤
│ [📞 Call Emergency Vet]  [🏥 Find Nearest Vet] │
│                                                 │
│ [💬 Talk to Concierge NOW]                     │
├─────────────────────────────────────────────────┤
│ While you wait:                                 │
│ • Keep pet calm and still                       │
│ • Do not give food or water                     │
│ • Note symptoms and time started               │
└─────────────────────────────────────────────────┘
```

---

## 8.2 Comfort Mode

### Trigger Detection

```
Comfort mode keywords:
- passed away, died, put to sleep, euthanasia
- grief, mourning, lost my dog, miss him/her
- rainbow bridge, saying goodbye
- really worried, so scared, anxious about
```

### What Gets Suppressed

| Element | Normal | Comfort |
|---------|--------|---------|
| Product picks | ✅ Show | ⚠️ Only memorial/comfort items if relevant |
| Service picks | ✅ Show | ⚠️ Only grief support/counseling |
| Shopping CTAs | ✅ Show | ❌ Hide |
| Upsells | ✅ Show | ❌ Hide |
| Soul questions | ✅ Ask | ❌ Pause |

### Comfort Mode Voice

```
Mira in comfort mode:
- Shorter responses
- More acknowledgment, less problem-solving
- "I'm here with you"
- "Take your time"
- No suggestions unless asked
- Offer Concierge gently: "Would you like to talk to someone?"
```

---

## 8.3 Escalation Path Placement

### Always Visible Paths

| Mode | Escalation CTA |
|------|----------------|
| Normal | "Ask Mira" in overflow menu |
| Emergency | "Talk to Concierge NOW" - full-width button, top of chat |
| Comfort | "Talk to someone" - gentle link, below Mira response |
| Confusion (3+ back-to-back questions) | "Need help?" - floating pill |

### Maximum Taps to Human

```
From any state to human concierge: ≤ 2 taps

Normal: Menu → Concierge (2 taps)
Emergency: Button visible (1 tap)
Comfort: Link visible (1 tap)
```

---

## 8.4 Repeated Medical Advice Handling

### Detection

```
If user asks medical questions 3+ times in session:
- "is this normal"
- "should I be worried"
- "what does X symptom mean"
- "is X dangerous"
```

### Response

```
After 3rd medical question:

"I can see you're concerned about {pet}'s health. 
I'm not a vet and can't diagnose, but I can help you:

[🏥 Find a vet near you]
[📋 Prepare questions for the vet]
[💬 Talk to Concierge about next steps]"

Suppress further medical Q&A. Redirect to professional.
```

---

# SECTION 9: DESKTOP FILTER SPEC (PICKS)

## 9.0 PICKS FALLBACK RULE (CRITICAL)

**Rule: No catalogue match → Concierge Arranges (ticket), NOT generic picks**

When user intent has no matching product/service in the catalogue (or matches < MIN_RELEVANCE_THRESHOLD):

### Trigger
```
if catalogue_matches.length === 0 OR all_matches_below_threshold:
    return concierge_fallback = true
```

### UI Layout (Same Picks Panel)

**Left Column: Catalogue Picks (Empty State)**
```
┌─────────────────────────────────────────────┐
│ ♡ MIRA'S PICKS FOR {PET}                    │
│ Handpicked because Mira knows {Pet}         │
├─────────────────────────────────────────────┤
│                                             │
│   Nothing in the catalogue for this         │
│   request yet.                              │
│                                             │
│   [Send to Concierge →]                     │
│                                             │
└─────────────────────────────────────────────┘
```

**Right Column: Concierge Arranges**
```
┌─────────────────────────────────────────────┐
│ ✦ CONCIERGE ARRANGES FOR {PET}              │
│ We'll source and arrange everything         │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ [Concierge Pick]                        │ │
│ │ {Intent-based title}                    │ │
│ │ {Personalization note}                  │ │
│ │ ♡ Made to {Pet}'s requirements          │+│
│ └─────────────────────────────────────────┘ │
│                                             │
│ "We don't have this in the catalogue yet —  │
│ we can arrange it for {Pet}."               │
└─────────────────────────────────────────────┘
```

### Concierge Pick Card Structure
- **Label**: "Concierge Pick" (badge)
- **Title**: Intent-derived (e.g., "Custom allergy-safe birthday cake")
- **Subtitle**: Safety note (e.g., "Allergy-safe")
- **Description**: "Made to {Pet}'s [diet rules/requirements], [benefit]."
- **Price**: NO PRICE (Concierge arranges pricing)
- **Action (+)**: Creates Service Desk Ticket

### Ticket Creation on "+" Action
```javascript
create_or_attach_service_ticket({
  intent: user_intent_summary,
  intent_type: "request",
  pillar: detected_pillar,
  category: "concierge_arranges",
  pet_ids: [pet.id],
  pet_names: [pet.name],
  source_route: "picks_concierge_fallback",
  channel: "web",
  created_by: "mira",
  status: "placed",
  payload: {
    original_request: user_message,
    no_catalogue_match: true,
    pet_constraints: pet.health_restrictions
  },
  notify_admin: true,
  notify_member: true
})
```

### Guardrails (Non-Negotiable)
1. **Never fill "no match" with popular/featured products** - breaks trust
2. **Concierge fallback must respect**:
   - Health/safety suppressions (safe-tags)
   - Legality/morality constraints
3. **All "Arrange this" actions route into Uniform Service Flow**:
   ```
   User Intent → Service Desk Ticket → Admin Notification → 
   Member Notification → Pillar Request → Tickets → Channel Intakes
   ```

### Summary Statement (Non-Negotiable)

**"When no catalogue match exists, PICKS must switch to Concierge fallback (Concierge Arranges) and the CTA must create a Service Desk ticket via the spine. Never show generic popular items as substitutes."**

**"Catalogue is optional; concierge is guaranteed."**

### Guardrails (Prevent Drift)

These rules are **non-negotiable** and must never be relaxed:

1. **No generic fallback ever.** If `fallback_mode !== "catalogue"`, do NOT render featured/popular items. The screen stays clean with only Concierge Arranges cards.

2. **Concierge cards must always CTA into the spine.** The `+` action MUST call `create_or_attach_service_ticket()` and return a canonical `TCK-YYYY-NNNNNN` ticket. Never create a separate thread or side-channel.

3. **Clarify mode is only for truly vague requests.** Use `fallback_mode = "clarify"` when user intent is ambiguous ("something fun this weekend"). Do NOT use clarify mode as a workaround for missing catalogue inventory — that's concierge territory.

4. **PICKS is not a shop. It's a decision layer.** If the catalogue can't satisfy the intent (no match / low confidence / safety block / bespoke), route to Concierge. No "popular products" padding. No pretending. No dead ends.

---

## 9.1 Filter Definitions

| Filter | Type | Options |
|--------|------|---------|
| Pillar | Single-select | All, Celebrate, Dine, Stay, Travel, Care... |
| Price Range | Range slider | Min - Max (currency-aware) |
| Availability | Toggle | Available now, Coming soon, All |
| Location | Single-select | Near me, City-wide, Online/Delivery |
| Diet/Allergy | Multi-select | Auto-populated from pet.allergies |

---

## 9.2 Filter → Ranking Impact

Filters affect ranking, not just visibility:

```
Base score = relevance_to_pet + pillar_match + safety_score

With filters:
- Pillar filter → Only show matching, others hidden
- Price filter → Hidden if outside range, no rank change
- Availability → Hidden if unavailable, no rank change
- Location → Boost nearby (+20% score), hide if incompatible
- Diet/Allergy → HARD FILTER - never show violating items
```

---

## 9.3 Filter Persistence

| Scope | Behavior |
|-------|----------|
| Within session | Persist until changed |
| Across sessions (same pet) | Persist for 7 days |
| Pet switch | Reset to defaults |
| Pillar switch (via chat) | Reset pillar filter, keep others |

### Storage

```json
{
  "pet_id": "pet-xxx",
  "picks_filters": {
    "pillar": "all",
    "price_min": null,
    "price_max": 5000,
    "availability": "available",
    "location": "near_me"
  },
  "updated_at": "...",
  "expires_at": "..." // +7 days
}
```

---

## 9.4 Chat Intent → Filter Sync

When conversation implies a filter:

| User Says | Filter Applied |
|-----------|----------------|
| "under 500 rupees" | price_max: 500 |
| "something nearby" | location: near_me |
| "available this week" | availability: available |
| "for her birthday" | pillar: celebrate |

**Sync is ONE-WAY: Chat → Filters. Changing filters does NOT change chat context.**

### Visual Indication

When filter auto-applied from chat:

```
┌─────────────────────────────────────────────┐
│ 🎯 Filtered: Celebrate, Under ₹500          │
│ (based on your conversation)     [Clear]    │
└─────────────────────────────────────────────┘
```

---

# SECTION 10: OS-LEVEL REGRESSION TESTS

## 10.1 Golden Flow 1: Message → Picks → Task → Today → Return

```
SETUP:
- User logged in with pet "Lola"
- PICKS showing Care pillar items

TEST STEPS:
1. User sends: "Lola needs grooming"
   VERIFY: 
   - SERVICES icon lights up (ON or PULSE)
   - PICKS refresh with Grooming items
   - Response mentions grooming

2. User taps a grooming pick card
   VERIFY:
   - Layer opens: SERVICES or TASK_DETAIL
   - Task pre-filled with Lola's constraints
   - Form shows minimal required fields

3. User confirms/submits task
   VERIFY:
   - Task created with status "requested"
   - Success toast shown
   - Layers close → return to CHAT_HOME
   - Confirmation message in chat

4. User opens TODAY
   VERIFY:
   - New task visible in "Active" or "Requested" section
   - Status chip shows correctly
   - Tap opens task detail

PASS CRITERIA: All verifications pass
```

---

## 10.2 Golden Flow 2: Concierge Option → Choose → Status → Memory

```
SETUP:
- User has open ticket with options_ready
- Concierge provided 2 options

TEST STEPS:
1. User opens CONCIERGE
   VERIFY:
   - Thread shows with options as cards
   - Each option has "Choose this" CTA

2. User taps "Choose this" on Option A
   VERIFY:
   - Confirmation: "Confirm Option A?"
   - User confirms

3. System processes selection
   VERIFY:
   - Ticket status → user_confirmed
   - Status chip updates in real-time
   - Concierge notified
   - Success message in thread

4. Check memory update
   VERIFY:
   - If vendor selected: pet.preferences.vendors updated
   - Audit log has selection event
   - Soul score incremented if applicable

PASS CRITERIA: All verifications pass
```

---

## 10.3 Golden Flow 3: Pet Switch → No Leakage → States Reset

```
SETUP:
- User has 2 pets: Lola (active), Bruno
- Lola has: 3 today items, Care picks, 1 open task
- Bruno has: 1 today item, Dine picks, 0 tasks

TEST STEPS:
1. Verify Lola state
   VERIFY:
   - TODAY shows 3 items
   - PICKS shows Care-focused
   - SERVICES shows 1 task
   - Chat shows Lola conversation

2. Switch to Bruno
   VERIFY:
   - Switch animation/indicator
   - Banner: "Now viewing Bruno"

3. Verify Bruno state (NO LEAKAGE)
   VERIFY:
   - TODAY shows 1 item (not 3)
   - PICKS regenerate for Bruno
   - SERVICES shows 0 tasks (not 1)
   - Chat shows Bruno conversation (or empty)
   - All icon states recalculated for Bruno

4. Switch back to Lola
   VERIFY:
   - Lola state restored exactly
   - Chat scroll position preserved
   - Draft message preserved (if any)

PASS CRITERIA: Zero cross-pet data leakage
```

---

## 10.4 Golden Flow 4: Emergency → Suppression → Escalation Visible

```
SETUP:
- Normal chat state
- PICKS showing shopping items
- No emergency mode active

TEST STEPS:
1. User sends: "Lola is choking and can't breathe"
   VERIFY:
   - Emergency detection triggers
   - Mode switches to EMERGENCY

2. Check suppression
   VERIFY:
   - Shopping picks HIDDEN
   - Learn content HIDDEN
   - Promos HIDDEN
   - Only emergency actions visible

3. Check escalation visibility
   VERIFY:
   - "Call Emergency Vet" visible (1 tap)
   - "Talk to Concierge NOW" visible (1 tap)
   - Both above the fold, no scrolling needed

4. Check response
   VERIFY:
   - Mira response is actionable, not chatty
   - First-aid guidance if appropriate
   - No product suggestions

5. User sends: "She's okay now, false alarm"
   VERIFY:
   - Emergency mode deactivates
   - Normal UI restores
   - Picks return

PASS CRITERIA: Full suppression during emergency, clean restore after
```

---

## 10.5 Golden Flow 5: Insight Extraction → Teaser → Save → Retrieve

```
SETUP:
- User chatting about food preferences
- No existing "protein preference" insight

TEST STEPS:
1. User sends: "Lola absolutely loves salmon, it's her favorite"
   VERIFY:
   - Mira acknowledges preference
   - Insight extracted: protein_preference = salmon

2. Check teaser
   VERIFY:
   - Slim teaser appears: "Saved to Lola's Insights • Loves salmon"
   - Teaser auto-dismisses after 10 seconds OR scroll

3. User taps teaser [View]
   VERIFY:
   - Opens Mojo Hub → Insights section
   - New insight visible with correct data
   - Confidence score shown (should be ~0.9)

4. Return to chat
   VERIFY:
   - Chat state preserved
   - No duplicate teasers

5. Future conversation test
   User sends: "What treats should I get?"
   VERIFY:
   - Mira references salmon preference
   - Picks include salmon-based treats

PASS CRITERIA: Full insight lifecycle works
```

---

## 10.6 Test Execution Checklist

| Flow | Last Tested | Result | Notes |
|------|-------------|--------|-------|
| Golden Flow 1 | ___ | ⬜ | |
| Golden Flow 2 | ___ | ⬜ | |
| Golden Flow 3 | ___ | ⬜ | |
| Golden Flow 4 | ___ | ⬜ | |
| Golden Flow 5 | ___ | ⬜ | |

**Run all 5 flows before every release.**

---

# APPENDIX A: QUICK REFERENCE TABLES

## A.1 Layer → BACK Behavior

| From | BACK Goes To |
|------|--------------|
| CHAT_HOME | No-op |
| TODAY_OPEN | CHAT_HOME |
| PICKS_OPEN | CHAT_HOME |
| SERVICES_OPEN | CHAT_HOME |
| TASK_DETAIL (from SERVICES) | SERVICES_OPEN |
| TASK_DETAIL (from TODAY) | TODAY_OPEN |
| TASK_DETAIL (from chat CTA) | CHAT_HOME |

## A.2 Icon State Summary

| Tab | OFF When | ON When | PULSE When |
|-----|----------|---------|------------|
| TODAY | 0 items | Has items | New/changed item |
| PICKS | 0 picks | Has picks | Regenerated |
| SERVICES | 0 requests | Has requests | New/status change |
| CONCIERGE | Offline + no threads | Online OR has threads | New message |

## A.3 Confidence Thresholds

| Action | Min Confidence |
|--------|----------------|
| Auto-write to Mojo | 0.8 |
| Ask to confirm first | 0.6 - 0.79 |
| Store in memory only | < 0.6 |
| Allergy (special) | 0.95 |

---

# APPENDIX B: IMPLEMENTATION CHECKLIST

## For Engineers

- [ ] State machine implemented per Section 1
- [ ] Icon states implemented per Section 2
- [ ] Chat continuity per Section 3
- [ ] Insight schema per Section 4
- [ ] Ticket schema per Section 5
- [ ] Memory write policy per Section 6
- [ ] Multi-pet rules per Section 7
- [ ] Safety modes per Section 8
- [ ] Desktop filters per Section 9
- [ ] All 5 golden flows passing per Section 10

---

*PET_OS_BEHAVIOR_BIBLE v1.0*
*Created: February 17, 2026*
*This is the System Contract. Protect it.*

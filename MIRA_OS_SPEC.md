# MIRA OS - Lifestyle Operating System
## Complete Architecture Specification v1.0

> **"Mira is the Soul & Brain, Concierge® is the Hands"**
> This is a Pet Operating System, not e-commerce or a chatbot.

---

## THE PHILOSOPHY

**Mira = Lifestyle Operating System**
Everything is layered. Nothing is permanent.

### Core Principles:
1. User never feels like they "left chat"
2. Mira **expanded**, **handled**, **returned**
3. Chat = Conversation Layer (always underneath)
4. No page reloads, no route flicker, no blank loading screens

---

## NAVIGATION ARCHITECTURE

### Desktop Header:
```
[Mojo ▼] | Today ●3 | Picks | Services | Insights | Learn | Concierge® | [🔔] | [New Chat]
```

### Mobile Header:
```
[Mojo ▼]                              [🔔] 
```

### Mobile Bottom Bar (5 items):
```
🐕 Mojo | 📅 Today | 🎁 Picks | 🛎️ Services | ••• More
```

### Mobile FAB:
```
[+ New Chat] (bottom right, always visible)
```

---

## THE 7 LAYERS

### 🟣 MOJO (Identity + Soul Layer)
**Purpose:** Who - The permanent intelligence vault

**Includes:**
- Pet Dashboard (single source of truth)
- Soul profile (personality, traits, emotional markers)
- Health flags + allergies
- Medical records + documents
- Vaccination record
- Travel readiness
- Household context
- Memory timeline
- Mojo Score (dynamic wellness + care index)

**Behavior:**
- 3 proactive questions shown only when:
  - First-ever setup
  - Major change detected (season shift, age milestone, long inactivity)
  - Score drops significantly
  - Session with important change
- Otherwise: Direct to Dashboard

**Rule:** Mojo is storage. Not execution.

---

### 🟣 TODAY (Live Awareness Layer)
**Purpose:** Now - Time-based intelligence

**Includes:**
- Upcoming grooming due
- Prevention reminders
- Vaccination upcoming
- Birthday countdown
- Weather alerts relevant to pet
- Health check reminders
- Expiring documents
- Active tasks in progress
- "You haven't logged a walk in 3 days"
- Seasonal alerts (heat, ticks, fireworks)
- **"Other pets" strip** (urgent items from other pets)

**Badge:** `TODAY ● 3` (subtle dot notation)

**Count ONLY:**
- Time-sensitive
- Action-required
- Expiring soon
- Health-flagged

**Rule:** Everything here must support ONE-TAP ACTION.
TODAY is NOT browsing. It is awareness → action.

---

### 🟣 PICKS (Mira's Intelligence Engine)
**Purpose:** Smart Suggestions - Dynamic recommendations

**Updates:** Every chat turn

**Sources:**
- Pet profile
- Conversation context
- Season
- Behaviour patterns

**Includes:**
- Pet Pick Vault
- Conversation-driven suggestions
- Seasonal picks
- Behaviour-based suggestions
- Advisory tips
- Breed-specific guidance
- Health-aware product/service ideas
- Starter essentials (if profile thin)

**Display Logic:**
- If item exists in catalogue → Catalogue card
- If not → Concierge pick card

**Rule:** NO reminders here. Picks ≠ alerts.
This is recommendation intelligence only.

---

### 🟣 SERVICES (Execution Layer)
**Purpose:** Do - Anything requiring coordination

**Includes:**
- Grooming bookings
- Vet appointment coordination
- Boarding & daycare
- Travel planning
- Party setup
- Trainer matching
- Diet transition plan setup
- Walk scheduling
- Pet photography
- Emergency transport coordination
- Documentation handling
- Subscription setup
- Refills
- Second opinion coordination
- My Orders / Active Tasks

**Rule:** If it needs arranging → it lives here.
No education. No insights.

---

### 🟣 INSIGHTS (Pattern + Analytics Layer)
**Purpose:** Understand - Long-term intelligence

**Includes:**
- Weight trends
- Activity trends
- Behaviour patterns
- Reminder adherence
- Feeding history
- Spending patterns
- Health pattern flags
- Preventive compliance score
- Seasonal risk exposure
- Grooming cadence analysis
- Dental risk score
- Aging alerts

**Rule:** Pattern recognition only.
No booking. No browsing.

---

### 🟣 LEARN (Knowledge Layer)
**Purpose:** Grow - Educational content

**Includes:**
- Training guides
- Nutrition basics
- Coat care education
- Travel prep guides
- Emergency first-aid basics (non-medical)
- Behaviour tips
- Seasonal care guides
- Breed-specific care overview
- Puppy guide
- Senior dog guide

**Rule:** No CTA that triggers fulfilment.
It educates only.

---

### 🟣 CONCIERGE® (Human Escalation Layer)
**Purpose:** Escalate - When Mira hands over

**This is NOT a feature tab. It is escalation.**

**Options:**
- WhatsApp
- Email
- Speak to Concierge
- Emergency routing
- Feedback
- Technical help
- Upload document
- Track fulfilment

**Emergency Access:**
- Red priority card in TODAY (always top)
- Long-press Concierge → Emergency Mode

---

### 🟣 NEW CHAT (Primary Action)
**Position:** Right-aligned (desktop), FAB (mobile)

**Behavior:**
- Always visible
- Primary accent color
- Never disabled
- Clears conversation canvas
- Does NOT reset Picks intelligence
- Does NOT reset Today
- Mira OS memory persists

---

## THE 14 PILLARS (Backend Architecture)

Pillars are **invisible architecture**. Never exposed in navigation.

| Pillar | PICKS | SERVICES | INSIGHTS | LEARN |
|--------|-------|----------|----------|-------|
| Care | ✓ Coat recs | Grooming, Vet | Grooming cadence | Coat care guide |
| Celebrate | ✓ Party ideas | Party setup | - | Safe party planning |
| Dine | ✓ Food recs | Diet transition | Feeding trends | Nutrition basics |
| Travel | ✓ Travel gear | Travel planning | - | Travel prep guide |
| Stay | ✓ Boarding recs | Boarding booking | - | - |
| Learn | ✓ Training recs | Trainer matching | - | Training guides |
| Advisory | ✓ Expert tips | Second opinion | - | Breed-specific care |
| Emergency | ✓ First-aid tips | Emergency transport | Incident frequency | First-aid basics |
| Adopt | ✓ - | - | - | Puppy/senior guide |
| Paperwork | ✓ Doc reminders | Documentation | Compliance score | - |
| Shop | ✓ Product recs | Subscription setup | Spending patterns | - |
| Fit | ✓ Activity ideas | Walk scheduling | Activity trends | Exercise guide |
| Enjoy | ✓ Fun suggestions | Photography | - | - |
| Farewell | ✓ Support recs | Support coordination | - | End-of-life guide |

---

## BEHAVIOR SPECIFICATIONS

### 1. Pet Switching
- First position in header. Always.
- Switching pets:
  - ✓ Resets Today
  - ✓ Resets Picks
  - ✓ Resets Services view
  - ✓ Preserves chat history per pet

### 2. Notifications (🔔) vs TODAY
- **TODAY** = proactive intelligence
- **🔔** = system activity (order shipped, concierge replied, etc.)
- Notification tap → Deep link to Services task + background TODAY sync

### 3. State During Interruption
- Resume with soft prompt after 30 minutes
- "Continue arranging grooming for Mojo? [Continue] [Not now]"
- Re-validate stale data silently on continue

### 4. Cross-Pet Actions
- "Book grooming for all my dogs"
- Clarify: "All pets, or specific ones? [All 7] [Choose pets]"
- Creates single multi-pet task in Services

### 5. Error States (Calm)
```
Couldn't complete that right now.
We can keep trying, or hand this to Concierge.
[Try again] [Ask Concierge]
```
- Inline card, not modal
- No red unless Emergency

### 6. Voice → UI Flow
- Voice triggers chat response first
- UI action follows after 300ms delay
- Feels conversational

### 7. Undo / Regret
- 5-second undo toast: "✓ Grooming request created [Undo]"
- After 5s: Can still cancel in Services

### 8. Offline Mode
- Header shows: `○ Offline`
- Browse: Cached data with "Last updated..."
- Actions: Queue with "We'll send when online"
- Reconnect: Silent sync + "✓ Back online"

---

## TRANSITION TIMINGS

| Action | Duration | Easing |
|--------|----------|--------|
| Panel slide in | 200ms | ease-out |
| Panel slide out | 150ms | ease-in |
| Overlay fade | 120-150ms | linear |
| Button state | 100ms | ease |
| Success check | 300-350ms | spring |
| Toast appear | 200ms | ease-out |
| Toast dismiss | 150ms | ease-in |

---

## HAPTIC FEEDBACK MAP

| Action | Haptic |
|--------|--------|
| Tab tap | Light |
| Open panel | Medium |
| Confirm action | Success |
| Error | Gentle error |
| Pull refresh | Light (threshold) |
| Long press | Heavy |

---

## ACCESSIBILITY (Auto-Respect OS)

- `prefers-reduced-motion` → instant transitions
- 44px minimum tap targets
- Badge = color + count (not color-only)
- Screen reader labels on all icons
- Haptics follow system setting

---

## MOBILE VS DESKTOP

### Mobile:
- Full immersive overlays
- Bottom navigation (5 items max)
- FAB for New Chat
- Swipe from right edge = optional Picks gesture

### Desktop:
- Slide-in panels (not full screen)
- Chat remains visible but dimmed
- No permanent side panels
- Breathing space

---

## GLOBAL TASK ROUTER

Every action creates a consistent task object:

```javascript
{
  id: "task_xxx",
  type: "grooming" | "vaccination" | "booking" | ...,
  status: "pending" | "queued" | "confirmed" | "completed" | "cancelled",
  pets: ["pet_mojo", "pet_lola"],  // Multi-pet support
  source: "picks" | "services" | "chat" | "today",
  created_at: timestamp,
  updated_at: timestamp,
  metadata: {
    requested_date: date,
    notes: string,
    // ... task-specific fields
  }
}
```

---

## WHAT WE DO NOT IMPLEMENT

- ❌ Visible cart in header
- ❌ Visible global search bar
- ❌ Too many bottom tabs
- ❌ Persistent clutter panels
- ❌ Marketplace behavior
- ❌ Page reloads
- ❌ Modal stacking
- ❌ Pop-up dialogs

---

## THE MENTAL MODEL

| Layer | Purpose |
|-------|---------|
| Mojo | Who |
| Today | Now |
| Picks | Suggest |
| Services | Do |
| Insights | Understand |
| Learn | Grow |
| Concierge | Escalate |

**That is a Lifestyle Operating System.**

---

## IMPLEMENTATION PHASES

### Phase 1: Foundation
1. Clean header with Pet Selector
2. Global Task Router schema
3. Bottom tabs (mobile)
4. New Chat FAB (mobile)
5. Layer system (panels over chat)
6. 🔔 Notifications (separate from TODAY)

### Phase 2: Core Layers
7. MOJO → Dashboard (3 questions logic)
8. TODAY → Alerts + "Other pets" strip
9. PICKS → Pure recommendations
10. SERVICES → Execution forms

### Phase 3: Intelligence
11. Ambient Intelligence Bar
12. INSIGHTS → Analytics
13. LEARN → Education
14. Context-aware PICKS updates

### Phase 4: Polish
15. Transitions/animations
16. Offline support + queue
17. Voice → Chat → UI flow
18. Undo toast system
19. Accessibility audit

---

## DOCUMENT INFO

- **Version:** 1.0
- **Created:** Feb 11, 2026
- **Status:** Ready for Implementation
- **Path:** `/app/MIRA_OS_SPEC.md`

---

*"Design is not just what it looks like and feels like. Design is how it works."* — Steve Jobs

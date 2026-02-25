# MIRA SOUL BIBLE
## The Doggy Company - Pet Life Operating System

*Last Updated: Feb 25, 2026*

---

## PART 1: WHO IS MIRA?

### Mira = Claude with Pet Memory

Mira is NOT a chatbot with keyword matching.
Mira is NOT a flow-based assistant.
Mira IS an intelligence that understands, remembers, and acts.

**How Mira Should Think:**

When user says: "Birthday party for Mystique"
Then says: "home with the crew"

Mira THINKS:
> "They just asked about Mystique's birthday. Now they said 'home with the crew.' 
> I know Mystique has 3 dog friends. This is a home birthday party with the gang. 
> What would Mystique love? She's food-motivated, so cake is key. 
> She's calm, so no loud activities..."

**That's the magic.**

### The Only Guardrails
- Medical advice → Disclaimer + route to vet
- Legal advice → Disclaimer + route to professional
- Everything else → FREE FLOW conversation

### No Keyword Matching
❌ WRONG: `if "book grooming" in message → open modal`
✅ RIGHT: LLM understands intent from conversation + memory

---

## PART 2: HOW MIRA LEARNS

### Knowledge Sources

1. **Onboarding** → Initial pet profile, breed, age, allergies
2. **Conversations** → What user asks, how they phrase things
3. **Browsing** → What they look at, click, spend time on
4. **Orders** → What they buy, reorder, skip
5. **Pillars** → Travel history, Dine favorites, Care patterns
6. **Context** → Time of day, season, location, upcoming events

### Memory Growth

Mira starts with **breed knowledge as fallback**.

As user interacts more:
- "I know Mystique loves walks"
- "Mystique ordered this cake last year"
- "Mystique has 3 dog friends"
- "Mystique has chicken allergy"
- "Mystique is turning 7 next month"
- "Mystique is noise-sensitive"
- "Mystique prefers at-home grooming"

### The Pet Soul

Every pet has a SOUL profile:
- Personality traits (calm, energetic, anxious, playful)
- Preferences (food, activities, social)
- Sensitivities (allergies, fears, triggers)
- Routines (walk times, feeding schedule)
- Relationships (friends, favorite people)
- History (past orders, services, experiences)
- Milestones (birthday, gotcha day, achievements)

---

## PART 3: THE OS ARCHITECTURE

### The Simple Frame

```
PET (Mojo/Mystique) = WHO this is for
TABS (Today/Picks/Services/Concierge/Learn) = WHAT kind of help I need
```

**Pet = Context Anchor**
**Tabs = Modes of Interaction**

---

## PART 4: EACH TAB'S PURPOSE

### 1. PET (Mojo/Mystique)
**Role:** Active Operating Context
**Think of it as:** "Current workspace" (like selecting which project)

**What it tells Mira:**
- Which pet is active
- Breed / age / size
- Temperament
- Sensitivities/allergies
- Routines
- Health flags (for concierge coordination only)
- City/location context
- Milestones (birthday, gotcha day)
- Soul memory / preferences

**What it does:**
- Switches entire OS context to that pet
- Changes recommendations, quick replies, products, services INSTANTLY
- Drives personalization across ALL tabs

---

### 2. TODAY
**Role:** Daily Command Center / Briefing
**Think of it as:** "What needs attention NOW?"

**What belongs here:**
- Reminders (walk due, grooming due, medication)
- Upcoming bookings (groomer tomorrow, vet Friday)
- Expiring items (food running low, flea/tick due)
- Daily wellness prompts
- Urgent follow-ups from open tickets
- Quick actions ("Book groom", "Reorder food", "Ask Mira")

**What does NOT belong:**
- Giant catalog browsing
- Long educational content
- Too many random recommendations

---

### 3. PICKS
**Role:** Personalized Recommendation Layer
**Think of it as:** "Your personalized storefront + plan"
**Feel:** "Mira suggests"

**What belongs here:**
- Mira-curated care recommendations
- Product picks (breed/coat/size-sensitive)
- Bundles (starter kits, sensitive skin kit, senior comfort kit)
- Experience picks (pet-friendly cafe, quiet groomer, pool session)
- Seasonal picks (summer coat care, monsoon paw care)
- Milestone picks (birthday plan, gotcha-day celebration)

**Important:**
Picks = CURATED suggestions, NOT full inventory

Examples:
- "Mira's Care Plan for Mystique"
- "Top 3 grooming options"
- "Because Mystique is noise-sensitive..."

---

### 4. SERVICES
**Role:** Structured Service Directory
**Think of it as:** "Service catalog + booking entry point"
**Feel:** "Browse what exists"

**What belongs here:**
- Category grid/cards (Grooming, Vet Visits, Boarding, Pet Sitting, etc.)
- Service detail pages/cards
- Individual vs bundle options
- Filters (at-home / centre, pet size, city, urgency)
- "Ask Mira to arrange" CTA on every service
- Entry into flow modals

**Important:**
Services = the MENU of capabilities, NOT conversation thread

---

### 5. CONCIERGE
**Role:** Execution Layer (Ticket Spine)
**Think of it as:** "Inbox + request execution + approvals"
**Feel:** "Mira is handling this"

**What belongs here:**
- Active conversations/threads
- Requests/tickets (open, in progress, awaiting approval, resolved)
- Status updates
- Approvals ("Approve this groomer/slot?")
- Clarifications
- Attachments
- Concierge messages and handoffs
- Notification-linked threads

**Critical:**
Concierge should NOT feel static. It's the WORKING AREA.

When user asks in Picks or Services:
1. Ticket is created
2. It appears in Concierge
3. User continues execution there

---

### 6. LEARN
**Role:** Education and Confidence Layer
**Think of it as:** "Trusted knowledge layer"
**Feel:** "Understand before acting"

**What belongs here:**
- Breed-aware care guides
- Coat care basics
- Puppy routines / Senior support basics
- Behavior/anxiety explainer content
- Nutrition education (general guidance, NOT medical advice)
- Checklists ("What to prepare before grooming")
- "When to seek urgent vet care" red-flag guidance (with disclaimer)
- Concierge-prep content ("How Mira handles clinic booking")

**Important:**
Learn is NOT diagnosis and NOT booking flow.
It increases confidence → then routes to Picks/Services/Concierge

---

## PART 5: USER JOURNEYS

### Path A: User wants help NOW
```
Today → Concierge
sees "Grooming due" → taps "Book grooming" → ticket opens in Concierge
```

### Path B: User wants suggestions
```
Picks → Services/Concierge
sees "Mira recommends quiet at-home groom" → taps CTA → execution in Concierge
```

### Path C: User wants to browse options
```
Services → Concierge
opens Grooming → chooses at-home/salon → submits request → execution in Concierge
```

### Path D: User wants to understand first
```
Learn → Picks/Services → Concierge
reads "Noise-sensitive grooming prep" → taps "See options" → enters Picks/Services → request → Concierge
```

---

## PART 6: THE TEST

**For every UI block, ask:**

| Question | Tab |
|----------|-----|
| Is this a recommendation? | → Picks |
| Is this a catalog/listing? | → Services |
| Is this a live request/thread/status? | → Concierge |
| Is this a guide/explainer/checklist? | → Learn |
| Is this a today-specific alert/reminder? | → Today |
| Is this about which pet? | → Pet context |

---

## PART 7: THE BIGGEST MISTAKE

**If Picks, Services, and Concierge all show the same cards and same chat-like blocks, the OS loses meaning.**

They MUST feel different:
- **Picks** = "Mira suggests"
- **Services** = "Browse what exists"
- **Concierge** = "Mira is handling this"
- **Learn** = "Understand before acting"

---

## PART 8: EXAMPLE - MYSTIQUE GROOMING

| Tab | Content |
|-----|---------|
| **Today** | "Grooming due soon for Mystique" |
| **Picks** | "Quiet at-home grooming recommended (noise-sensitive)" |
| **Services** | "Grooming category + at-home/salon options + bundles" |
| **Concierge** | "REQ-20260225-0014, awaiting your choice: at-home vs salon" |
| **Learn** | "How to prepare a noise-sensitive dog for grooming" |

**That separation is what makes the OS feel premium and intelligent.**

---

## PART 9: MIRA'S BEHAVIOR

### What Mira Does
1. **Remembers** - Full pet soul + conversation history
2. **Understands** - LLM processes context, not keywords
3. **Suggests** - Based on memory + understanding
4. **Instructs** - Tells concierge what to execute

### What Mira Does NOT Do
- Pattern match keywords
- Ask rigid clarifying questions
- Show irrelevant results
- Lose conversation context
- Treat every pet the same

### Mira's Voice
- Warm but efficient
- Knows the pet personally
- References past interactions naturally
- Proactive, not reactive
- Confident in suggestions

---

## PART 10: IMPLEMENTATION PRINCIPLES

### For the Chat Core
1. Load FULL pet soul into every conversation
2. Include conversation history (last N messages)
3. Let LLM understand naturally
4. NO keyword-to-action mapping
5. Trust the intelligence

### For the UI
1. Each tab has distinct visual language
2. Chat lives in the center, tabs are modes
3. Picks fills with suggestions during conversation
4. Services fills when service context detected
5. Concierge shows when execution starts

### For Data
1. Every interaction updates pet memory
2. Browse patterns inform preferences
3. Orders inform favorites
4. Conversation insights stored
5. Soul score updates based on learning

---

*This is the single source of truth for Mira's behavior and the OS architecture.*

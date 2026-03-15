# MOJO BIBLE
## The Single Source of Truth for Pet Identity in Mira OS
### Created: February 2026

---

# PART 1: MOJO - COMPLETE COMPONENT DEFINITION
## (Pet Identity Layer - WHO the pet is)

---

## 1. Pet Snapshot (Always at top)

**This is the permanent identity header.**

### Contains:
- Pet photo
- Name
- Species
- Breed / type
- Age / DOB / age band
- Sex
- Neutered status
- Weight
- Size class
- Coat type
- Location / city / climate
- Member tier / rewards (if applicable)
- Soul completeness score (78% Soul Known)

### Purpose:
Immediate identity context for everything else.

### Never here:
- actions
- booking buttons
- products
- reminders

---

## 2. Soul Profile (Personality Intelligence)

**The "who the pet is emotionally and behaviourally"**

### Contains:
- Personality traits (playful, curious, calm, etc.)
- Energy level scale
- Temperament
- Social behaviour
  - dog friendly
  - child friendly
  - stranger comfort
- Anxiety triggers
  - thunder
  - separation
  - guests
- Behaviour tendencies
  - chew style
  - reactivity
  - curiosity level
- Preferences
- Dislikes
- Soul questionnaire answers (55+)
- Soul completeness progress

### Source:
Soul Form only + validated behaviour signals.

---

## 3. Health Vault (Medical & Safety Layer)

**The most critical section.**

### Contains:
- Allergies
- Sensitivities
- Chronic conditions (if user provided)
- Vaccination records
- Vet details
- Weight history
- Medical documents
- Lab reports
- Medication records (tracking only, no advice)
- Health flags
  - skin sensitive
  - GI sensitive
  - dental risk
- Emergency contacts
- Microchip info
- Insurance details

### Purpose:
Hard safety gates for all recommendations.

### Never:
- diagnosis
- medical advice
- dosing guidance

---

## 4. Diet & Food Profile

**Baseline nutrition identity.**

### Contains:
- Diet type
  - kibble
  - home cooked
  - wet
  - raw
- Protein preferences
- Ingredient dislikes
- Allergens
- Feeding frequency
- Treat preferences
- Portion patterns
- Digestive sensitivity flags
- Favourite foods
- Past successful diets

### Used by:
Picks + Services filtering.

---

## 5. Behaviour & Training Profile

**How the pet behaves and learns.**

### Contains:
- Training level
- Commands known
- Behaviour challenges
- Training history
- Response style
- Motivation type
- Socialisation level
- Behaviour incidents
- Progress notes

---

## 6. Grooming & Care Baseline

**Physical care needs.**

### Contains:
- Coat type classification
- Grooming cadence
- Shedding level
- Skin sensitivity
- Bath tolerance
- Nail trim cadence
- Ear care notes
- Grooming history

---

## 7. Routine Profile

**Daily rhythm.**

### Contains:
- Walk frequency
- Preferred walk times
- Sleep pattern
- Feeding schedule
- Activity level pattern
- Bathroom pattern
- Exercise habits
- Routine stability level

---

## 8. Environment Profile

**Where and how the pet lives.**

### Contains:
- City
- Climate
- Home type
- Living space size
- Family structure
- Other pets
- Seasonal risks
  - ticks
  - heat
  - fireworks
- Travel frequency

---

## 9. Preferences & Constraints

**Hard boundaries Mira must respect.**

### Contains:
- Handling preferences
- Food restrictions
- Behaviour triggers
- Care constraints
- Parent preferences
- Service restrictions
- Comfort limits

**This is used as global filters.**

---

## 10. Documents Vault

**Permanent records.**

### Contains:
- Vaccination certificates
- Medical records
- Insurance documents
- Travel documents
- Licenses
- Prescriptions (records only)
- Registration papers

---

## 11. Life Timeline (Memory Layer)

**The pet's life history.**

### Contains:
- Birthday records
- Milestones
- Past services
- Past purchases
- Key events
- Adoption date
- Major life changes
- Important memories

**This feeds Insights.**

---

## 12. Membership & Rewards

**(Optional engagement layer)**

### Contains:
- Member tier
- Loyalty status
- Paw points
- Badges
- Achievement milestones

---

## 13. Trait Graph (Internal - Not fully visible to user)

**The intelligence layer powering everything.**

### Derived from:
- Soul answers
- Chat history
- Service outcomes
- Purchases
- Behaviour observations

### Stores:
- trait key
- confidence score
- evidence count
- timestamps
- source priority

**This is what makes Mira "know the pet."**

---

## 14. Soul Completion Engine

**Growth driver.**

### Contains:
- Missing profile prompts
- Suggested questions
- Progress indicators
- Completion goals

**Purpose: grow identity continuously.**

---

## What MUST NOT live under MOJO

**Very important for architecture clarity.**

- booking services
- shopping
- task execution
- alerts
- recommendations
- reminders
- chat actions
- learn articles
- scheduling
- transaction history UI

**Those belong elsewhere.**

---

## Simple mental model

**MOJO answers one question only:**

> Who is this pet?

If the data describes the pet's identity, baseline state, history, or constraints -> MOJO.

Everything else is another OS layer.

---

## Ultra-simple definition for engineering

**MOJO = Persistent Pet Identity Store**

- static identity
- personality
- health
- preferences
- constraints
- history
- documents
- traits

**No execution. No time. No commerce.**

---

# PART 2: TODAY - TIME LAYER

**What matters now**

## Purpose:
Surface time-sensitive items that need attention or are due soon. This is proactive awareness, not shopping.

## Components under TODAY:

### 1. Today Summary Header
- "Today 3" count
- Last updated timestamp
- Optional "Offline / stale" indicator

### 2. Urgent Stack (always top)
- Overdue vaccinations / parasite doses
- Pending emergency follow-up
- Critical expiring documents
- Anything tagged "urgent"

### 3. Due Soon Cards
- Grooming due in X days
- Prevention reminder in X days
- Vet follow-up due
- Reorder window approaching (if consumption known)

### 4. Season + Environment Alerts
- Heat risk alert
- Tick risk elevated this week
- Fireworks week anxiety prep
- Rain gear reminder

### 5. Active Tasks Watchlist
- "Awaiting your confirmation"
- "Concierge is scheduling"
- "Payment pending"
- "Order shipped"

### 6. Documents + Compliance
- Vaccination certificate missing
- License renewal due
- Travel document expiry

### 7. Other Pets (compact, non-clutter)
- "Other pets need attention"
- 1-3 condensed lines only

## Must NOT be in TODAY:
- Browsing products
- Full recommendations sets (that's Picks)
- Booking flows (that's Services)
- Long education content (that's Learn)
- Analytics (that's Insights)

---

# PART 3: PICKS - INTELLIGENCE LAYER (EXHAUSTIVE SPEC)

**PICKS is Mira's real-time intelligence engine that converts conversation + pet memory into ranked next-best actions, mixing catalogue picks with arranged-for concierge picks, and it refreshes every single turn.**

It's not a page. It's a living layer.

---

## 1. Purpose

PICKS exists to do three things simultaneously:
1. Show the best next step for what the user is talking about right now
2. Pre-empt obvious needs (due soon, seasonal, behaviour-triggered) without nagging
3. Turn intelligence into action: every card is tappable and becomes a task

**If PICKS doesn't update every turn, Mira becomes a chat app. Not an OS.**

---

## 2. Inputs (every refresh uses these)

### A) Pet Intelligence (from MOJO)
Hard constraints + personal fit:
- age band, size/weight, coat type
- allergies/sensitivities
- health flags (non-diagnostic)
- chew style / energy level / anxiety triggers
- routine patterns
- purchase + service history + outcomes (worked/didn't)
- location/climate if known

### B) Live Conversation Context
Derived every message:
- active pillar (one of 14)
- secondary pillar (optional)
- topic signals (dental, ticks, cakes, travel carrier, boarding…)
- urgency (normal vs urgent / emergency risk)

### C) Safety Gates (global)
- blocked items list
- size/age choking rules
- allergy exclusion rules
- "no dosing / no sedation / no medical directives"

### D) Season + Location (optional but powerful)
- heat, rain, fireworks, ticks
- local availability constraints (if you track)

---

## 3. Core Behaviour (must happen every turn)

### Refresh Loop
On every user message and every Mira reply:
1. Infer active pillar + topic
2. Fetch Pet Context Pack
3. Generate ranked picks
4. Render picks into UI
5. Every card is actionable → creates/updates a task on tap

### Non-negotiable Outcomes
- PICKS is never empty
- PICKS switches instantly when topic switches
- PICKS includes services, not only products
- PICKS shows catalogue-first, but never feels limited by catalog coverage

---

## 4. Pick Types (two types only)

### A) Catalogue Pick Card
Shown when there's a high-confidence match in dataset.

**Displays:**
- title, image, key fit line (why for pet)
- availability/price only if stored
- subtle fit badges (optional)

**CTA:** Request / Arrange / Add / Plan (depending on category)

### B) Concierge Pick Card (Arranged-for Card)
Shown when:
- catalogue has no match, OR
- catalogue match exists but is weak, and the OS needs a better answer

**Must NOT use the word "source".**

Use:
- Arranged for {Pet}
- Prepared for {Pet}
- Planned for {Pet}
- Checked for {Pet}

**Card Template:**
- Title (generic, brand-free)
- Why it fits (1 line personalised)
- What's included (3–6 bullets)
- What we need (1–2 fields max)
- Safety note (1 line)
- CTA: Arrange / Plan / Book / Start / Request

Every concierge pick still creates a task.

---

## 5. Composition Rules (what the panel must contain)

### Output Size
6–10 cards per refresh

### Required Mix
- Top 4–6 = active pillar dominant
- Minimum 1 service card when applicable
- 1–2 essentials only when relevant (thin profile or context supports it)
- If Emergency/Farewell: reduce products heavily, actions/services dominate

### Ranking Rule (so it feels premium)
1. Best fit to pet + safest
2. Most relevant to active pillar + topic
3. Most likely "next step" (actionable)
4. Season/location boost
5. History boost ("worked last time")

---

## 6. What counts as a "Service Card" inside PICKS

Service cards are execution entry points, not education and not browsing.

**Examples:**
- Arrange grooming
- Book vet coordination
- Plan birthday setup
- Find pet-friendly stay
- Trainer matching
- Diet transition setup
- Document handling (vaccination / travel cert)
- Emergency transport coordination

Service cards live in PICKS as "next best action", but the actual workflow lives in SERVICES.

---

## 7. Task Behaviour (every card is actionable)

When a user taps any card (catalogue or concierge pick):
1. Create a task using your existing task object
2. Auto-fill constraints from MOJO (allergies, location, behaviour flags, timing preferences)
3. Set status:
   - if no input needed → Requested
   - if missing details → Draft / Awaiting user
4. Return user to chat with a calm confirmation line

**Undo:** 5-second undo toast after task creation.

---

## 8. Pillar Switching Logic (must be deterministic)

PICKS switches based on what the user is discussing now.

**Examples:**
- "itching / ticks / grooming / dental" → Care picks
- "cake / birthday / party" → Celebrate picks
- "kibble / treats / meal plan" → Dine picks
- "travel / flight / carrier" → Travel picks
- "boarding / sitter / hotel" → Stay picks
- "trainer / leash manners" → Learn picks
- "vomiting / seizure / choking" → Emergency override

If multiple topics in one message:
- choose a primary pillar
- allow secondary pillar cards (max 2)

---

## 9. UI Components Under PICKS (Exhaustive)

### Picks Header
- Picks for {Pet}
- Updated just now
- Optional: "Why these picks" (tap to expand)

### Primary Picks Stack
- 4–6 dominant cards
- mixed product + service

### Concierge Picks Section
- appears when catalogue coverage is weak
- visually distinct but elegant (no "missing inventory" vibe)

### Starter Essentials (conditional)
- only when relevant
- must not repeat the same essentials every time

### Fit Badges (subtle)
- Allergy-aware
- Small-mouth safe
- Heat-safe
- Anxiety-friendly

Never loud.

### One-tap Actions
- Arrange / Plan / Start / Request / Book
- No "want to see options?" when options are already being shown.

### Empty-state Prevention
- If no catalogue and concierge disabled, show "prepared actions" cards (services) anyway.

---

## 10. What must NEVER happen (hard failures)

- PICKS panel is empty
- PICKS doesn't switch when topic switches
- Looks like marketplace inventory
- Shows price upfront unless known
- Asks "want me to show options" after user asked for options
- Re-asks known pet details
- Suggests risky items by default
- Emergency message still shows shopping picks

---

## 11. How PICKS interacts with SERVICES

- PICKS recommends and initiates
- SERVICES executes and tracks

Flow:
1. Tap in PICKS → opens SERVICES task detail
2. Confirm in SERVICES → returns to chat
3. Task updates → refresh PICKS automatically

---

## PICKS Summary (for quick reference)

PICKS is the always-on intelligence layer. It refreshes every chat turn using Pet Context Pack + active pillar intent + safety gates. It outputs 6–10 ranked cards: 4–6 active pillar dominant, at least 1 service card when applicable, and concierge arranged-for cards whenever catalogue coverage is weak. PICKS is never empty, never marketplace-like, and switches instantly when the user shifts topic. Any pick tap creates/updates a task and routes into SERVICES for execution, then returns seamlessly to chat.

---

# PART 4: SERVICES - EXECUTION LAYER

**Where hands move**

## Purpose:
Turn intent into real outcomes via tasks. Services is not a pillar. It's the orchestration engine.

## Components under SERVICES:

### 1. Service Launcher Cards (top)
These are action entry points:
- Grooming
- Training
- Boarding / daycare
- Vet coordination
- Dog walking
- Photography
- Party setup
- Diet transition setup
- Travel planning
- Documentation handling
- Second opinion coordination
- Emergency transport

### 2. Task Inbox
All active tasks grouped by status:
- Draft (needs details)
- Requested
- In progress
- Awaiting user
- Confirmed
- Completed
- Cancelled

### 3. Task Detail View (single task screen)
- "Arranged for {Pet}"
- What we'll arrange
- What we need (minimal fields)
- Constraints (auto-filled from MOJO)
- Timeline
- Updates log
- CTA: Confirm / Upload / Approve / Change

### 4. Multi-pet Tasks
- "Grooming for multiple pets"
- Pet selector inside task

### 5. Orders + Tracking
- "My Orders"
- "Shipped / Delivered"
- Refill schedules
- Subscriptions

### 6. Undo + Safety UI
- 5-second undo after creating task
- Calm error cards (Try again / Ask concierge)

## What must NOT live in SERVICES:
- Long education (Learn)
- Recommendation feed (Picks)
- Due reminders (Today)
- Profile editing (Mojo)

---

# PART 5: LEARN - KNOWLEDGE LAYER

**Calm, structured guidance**

## Purpose:
Teach without selling or executing. This is clarity and confidence.

## Components under LEARN:

### 1. Guides Library
- Puppy starter
- Senior dog
- Nutrition basics
- Coat care
- Travel prep
- Enrichment games
- Emergency first aid basics (non-medical)

### 2. Breed Overviews
Only as education. Never as assumptions.

### 3. Short "How to" Modules
- "How to brush"
- "How to introduce a new food"
- "How to pack for travel"

### 4. Saved / Recently Viewed
- keep it calm, no feed chaos

## Must NOT be in LEARN:
- booking
- tasks
- "buy now"
- product tiles as the main action

---

# PART 6: CONCIERGE - HUMAN LAYER

**Escalation + handoff**

## Purpose:
When the user wants a human, or when complexity/risk needs handholding.

## Components under CONCIERGE:

### 1. Talk to Concierge
- WhatsApp
- Email
- (Optional) Call request

### 2. Escalate Current Request
- One-tap: "Escalate"
- Auto-attaches context pack + picks + task summary

### 3. Upload Documents to Team
- vaccination records
- prescriptions (records)
- travel docs

### 4. Help + Feedback
- technical help
- service feedback
- report an issue

### 5. Emergency Routing
Fast path to emergency support (also mirrored in TODAY)

## Must NOT be in CONCIERGE:
- product browsing
- long education
- task forms (Services owns that)

---

# PART 7: HOW INTERDEPENDENCE WORKS

## The OS engine loop (architecture Emergent must build)

### The truth map:
- MOJO = Identity source
- TODAY = Time engine
- PICKS = Recommendation engine
- SERVICES = Task engine
- LEARN = Education
- CONCIERGE = Human escalation

### What feeds what (system-level):

#### 1. MOJO -> feeds EVERYTHING
- Picks uses traits + allergies + constraints
- Today uses schedules + dates + cadences
- Services auto-fills constraints
- Learn can personalise reading order (lightly)
- Concierge handoff includes MOJO context

#### 2. Chat turn -> updates PICKS every time
User message:
- intent classifier (active pillar + urgency)
- topic extraction
- retrieve pet context pack
- generate picks (catalogue-first, concierge-always)
- UI updates picks panel immediately

#### 3. PICKS -> creates SERVICES tasks
Any pick card tap:
- creates a task (existing schema)
- returns to chat with confirmation
- Today updates ("Scheduled" replaces "Due")

#### 4. SERVICES -> updates MOJO and INSIGHTS
When tasks complete:
- record outcome
- update traits with high confidence
- log event in timeline
- adjust cadences (grooming interval etc.)

#### 5. TODAY -> triggers SERVICES
Today card CTA always leads to a task:
- "Arrange grooming" -> Services task draft
- "Upload vaccination" -> Concierge upload flow or document task

#### 6. NOTIFICATIONS -> deep-link to SERVICES
Notification is a trigger, not a destination.
Tap notification:
- open task detail
- resolve/dismiss related Today card automatically when appropriate

#### 7. LEARN -> can be suggested by PICKS
Learn should be recommended only when helpful:
- "How to introduce a new food" (after meal plan chat)
But Learn never executes.

#### 8. CONCIERGE -> attaches everything
Escalation should auto-attach:
- last user intent
- pet context pack highlights
- picks shown
- any active tasks

---

# PART 8: QUICK RULE SET

## Where does something go?
- If it describes the pet: MOJO
- If it's due soon: TODAY
- If it's a suggestion set: PICKS
- If it requires coordination: SERVICES
- If it's education: LEARN
- If it needs a human: CONCIERGE

## Every user message must do 3 things:
1. update conversation intent (pillar)
2. refresh picks
3. optionally create tasks if user acts

---

# PART 9: HOW THE OS MUST WORK (Operating Doctrine)

## The core idea:

**Mira is not a chat feature.**
**Mira is a memory-driven operating system.**

Every interaction must follow this loop:

> Understand -> Remember -> Personalise -> Suggest -> Execute -> Learn

If any step breaks, the OS breaks.

---

## The OS execution cycle (every single user action)

### 1. Context first (always)
System loads:
- selected pet
- pet traits
- constraints (allergies, fears, preferences)
- active tasks
- time alerts

**User should feel:**
"Mira already knows my dog."

**Never:**
"Tell me again."

### 2. Intent detection (what user wants now)
Every message must detect:
- active pillar
- urgency
- topic
- risk level

Example:
- "birthday cake" -> Celebrate
- "itching" -> Care (high priority)
- "walk" -> Routine/Care

### 3. Memory ingestion (nothing is lost)
System stores:
- every answer
- every preference
- every outcome
- every task result
- every correction

Memory becomes intelligence.

**If memory isn't growing -> OS failed.**

### 4. Personalised response
Response must use:
- pet traits
- history
- constraints
- environment
- current context

**No generic replies.**

### 5. Auto-update picks
Every turn:
- picks change
- services change
- suggestions refine

**UI always moves with conversation.**

### 6. Execution ready
User can act instantly:
- arrange
- plan
- confirm
- escalate
- upload

**No dead ends.**

### 7. Learn from outcomes
After execution:
- update traits
- record success/failure
- improve future decisions

**System becomes smarter daily.**

---

# PART 10: WHAT SUCCESS LOOKS LIKE (Non-Negotiable Outcomes)

## 1. User never repeats information
If user already told the system:
- allergies
- preferences
- routines
- weight
- behaviour

**Mira never asks again.**

If repetition happens -> failure.

## 2. Picks always feel relevant
User should think:
"How did it know this fits my dog?"

If picks feel random -> failure.

## 3. OS feels alive, not static
Every interaction changes something:
- memory grows
- traits refine
- picks evolve
- tasks update

If nothing changes -> it's just a chatbot.

## 4. Conversation -> action -> outcome
Users move smoothly from:
idea -> suggestion -> execution -> result

No friction.

## 5. System becomes more accurate over time
After 30 days:
- fewer questions
- better recommendations
- faster execution
- higher confidence

If accuracy doesn't improve -> failure.

## 6. Pet-first experience
Everything revolves around the pet.

Not:
- products first
- services first
- chat first

Always:
**pet identity -> decision**

## 7. Calm experience
No chaos.
- minimal questions
- minimal friction
- no noise
- clear next steps

Feels like a private assistant.

## 8. Safety always wins
If risk detected:
- emergency overrides normal flow
- no selling
- action first

---

# PART 11: MEASURABLE SUCCESS METRICS

## Memory KPIs
- % of user data reused without asking again
- number of traits captured per pet
- contradiction handling accuracy
- memory growth per session

## Personalisation KPIs
- pick relevance score
- click-through on picks
- task conversion rate
- repeat usage per pet

## Execution KPIs
- task completion rate
- time to task creation
- failure recovery success

## Experience KPIs
- average questions asked per task (should decrease)
- session length growth
- return frequency
- escalation satisfaction

## Intelligence KPIs
- recommendation improvement over time
- reduced clarification questions
- trait confidence growth

---

# PART 12: WHAT WE ARE NOT BUILDING

**Very important clarity.**

We are NOT building:
- a chatbot
- a product marketplace
- a search engine
- a knowledge base
- a recommendation feed
- a shopping app

We ARE building:
**A memory-first Pet Operating System that knows each pet deeply and orchestrates life around them.**

---

# PART 13: 10 ABSOLUTE RULES (Non-Negotiable)

## Rule 1 - Memory Before Response
Mira must always load pet memory before replying.

Always check:
- pet identity
- traits
- allergies
- preferences
- history
- active tasks

If known data exists -> never ask again.

**Violation = system failure.**

## Rule 2 - Pet Context Is Global
Everything happens inside the selected pet context.

Switch pet -> system context changes:
- chat context
- picks
- services
- tasks
- insights
- today alerts

**No cross-pet leakage ever.**

## Rule 3 - No Generic Answers
Every response must be personalised using:
- pet traits
- behaviour
- environment
- history
- constraints

Never give generic advice.

If personalisation unavailable -> ask first.

## Rule 4 - Minimal Questions Only
Ask only what is missing for the current moment.

Maximum:
- 1-2 questions normally
- 3 maximum for complex tasks

**Never run questionnaires inside chat.**

## Rule 5 - Catalogue First, Concierge Always
System always tries:
1. Best existing solution
2. Ideal concierge execution if none exists

Never show empty states.
Never show random products.

## Rule 6 - Conversation Must Lead to Action
Every interaction must allow execution.

User must always be able to:
- arrange
- plan
- confirm
- escalate
- save
- act

**No dead ends.**

## Rule 7 - Every Interaction Creates Memory
Everything must update intelligence:
- soul answers
- chat statements
- service outcomes
- corrections
- preferences

**If memory does not grow -> OS is broken.**

## Rule 8 - Layers, Not Pages
Mira is an operating system.
- chat always underneath
- panels overlay
- user never "leaves"
- return path always exists

**No hard navigation.**

## Rule 9 - Safety Overrides Everything
If risk or emergency detected:
- show action guidance first
- suppress selling
- prioritise help
- escalate fast

**Safety > commerce.**

## Rule 10 - The System Must Improve Over Time
The system must become smarter daily:
- fewer questions
- better picks
- faster decisions
- higher confidence

**If behaviour doesn't improve -> architecture is wrong.**

---

## The One Line Philosophy

> **Mira OS exists to know each pet deeply, remember everything, and orchestrate life around them.**

---

# PART 14: 5 DEADLY MISTAKES (Must Never Happen)

## 1. Asking What Is Already Known
Worst experience possible.

Never:
- ask allergies if stored
- ask weight if stored
- ask preferences already answered
- ask same question again in same session

**What this means:**
System did not load memory.

**Impact: breaks trust instantly.**

## 2. Generic Advice Instead of Pet-Specific
Mira cannot behave like Google.

Never say:
- "Dogs generally..."
- "Usually pets..."
- generic health advice
- breed stereotypes without confirmation

Always:
- personalise
- ask first if unsure

## 3. Breaking Conversation Flow
User must never feel redirected.

Never:
- open new pages
- lose chat context
- reset state randomly
- show dashboards without reason

Always:
conversation -> intelligence -> execution -> return.

## 4. Marketplace Behaviour
Mira is not Amazon.

Never:
- show product grids randomly
- show price-first UI
- show "catalog listing"
- push shopping

Always:
- curated picks
- arranged for pet
- service-first tone

## 5. Ignoring Safety Context
If risk exists -> help first.

Never:
- sell products during distress
- ignore symptoms
- delay escalation

Emergency -> action -> support -> execution.

---

# PART 15: MIRA OS DECISION TREE (How System Thinks Every Turn)

## STEP 1 - Load Context
```
load pet
load traits
load active tasks
load recent events
load today alerts
```

## STEP 2 - Understand Intent
```
classify message
detect pillar
detect urgency
detect risk
detect missing data
```

## STEP 3 - Safety Check
```
if emergency -> override everything
```

## STEP 4 - Check Memory Completeness
```
if required data exists -> use
if missing -> ask minimal question
```

## STEP 5 - Generate Response
```
personalised explanation
calm tone
one next step
```

## STEP 6 - Update Intelligence
```
store event
update traits
update confidence
update picks
```

## STEP 7 - Update UI Layers
```
refresh picks
refresh services
update today
```

---

# PART 16: LLM BEHAVIOUR LAWS (How Mira Must Speak)

## 1. Speak Like a Private Concierge
Calm, refined, certain, never robotic.

## 2. Personalise First Sentence
Always begin with pet context.

Example:
- "For Mojo, given his coat type..."
- "Since Luna prefers calm environments..."

## 3. Never Over Explain
Luxury = clarity.
Short sentences.
Clear next step.

## 4. Ask Before Assuming
If uncertain -> ask.
Never guess.

## 5. One Decision at a Time
No long option lists.
Guide -> decide -> proceed.

## 6. Always Offer Execution
Every response ends with ability to act.
- arrange
- plan
- confirm
- review

## 7. Never Show System Mechanics
Never mention:
- AI
- database
- algorithm
- system logic

**User sees care, not machinery.**

---

# PART 17: UI BEHAVIOUR LAWS (Apple-Level Consistency)

## 1. Calm Interface Always
No clutter, no loud colours, no chaos, soft transitions.

## 2. Layers Not Pages
Everything overlays:
- Picks layer
- Services layer
- Mojo layer

**Chat always underneath.**

## 3. One Primary Action Per Screen
No competing buttons.
User always knows what to do.

## 4. Intelligence Updates Live
Picks and Today change automatically after actions.
**System feels alive.**

## 5. Minimal Animation
- smooth
- fast
- purposeful

Never decorative.

## 6. Always Reversible
Undo window for actions.

## 7. Never Show Empty States
Always show:
- suggestion
- concierge option
- next step

---

# PART 18: THE ULTIMATE TEST

If a new user opens Mira and asks:

> "Help me with my dog"

The system must:
- ask about the dog
- learn the dog
- remember permanently
- personalise immediately
- allow execution
- improve next time

**If not -> Mira OS is not working.**

---

# PART 19: GOLDEN UI/UX JOURNEY

## Core philosophy:
> Calm -> Intelligent -> Personal -> Effortless -> Always in control

User never learns the app.
**The app learns the user.**

---

## First-Time User Journey

### STEP 1 - First Open
User sees:

**Desktop:**
- Clean screen
- Pet selector / Add Pet
- Calm chat canvas
- One message: "Tell me about your pet. I'll remember everything."

**Mobile:**
- Minimal header
- Chat full screen
- One clear prompt
- Mic visible

No menus. No dashboard. No overwhelm.

### STEP 2 - Pet Creation Flow
System asks naturally:
- name
- age
- size
- diet
- behaviour
- sensitivities

**Feels like conversation, not form.**

### STEP 3 - Instant Intelligence
User finishes setup -> immediately sees:
- Picks for pet
- Today alerts
- Soul score
- Personal suggestions

**User feels: "It already knows my dog."**

Trust created.

### STEP 4 - First Action
Mira suggests:
- grooming
- treats
- care
- routine

User taps -> task created -> success animation.

**User learns: Mira acts.**

---

## Daily User Journey (Retention Loop)

### User Opens App

**Desktop:**
Header -> Pet | Today | Picks | Services | Insights | Learn
Chat center
Picks panel right

**Mobile:**
Minimal header
Chat center
Bottom navigation

### System Shows Immediately

**TODAY layer:**
- what needs attention
- due items
- reminders
- alerts

No browsing required.

**User thinks:** "What should I do for my dog today?"

### User Action Loop
User -> sees alert
Tap -> arrange
Return to chat
System updates
No friction.

### Picks Updates Automatically
Conversation changes -> recommendations change instantly.
Feels intelligent.

### Micro-Success Moment
- grooming scheduled
- reminder cleared
- soul score increased

Small reward loop.

---

## Power User Journey (Long-Term Experience)

### User Stops Asking Basic Things
System already knows:
- preferences
- routine
- behaviour
- health flags

User just says:
"Same grooming as last time."
Execution happens.

### Predictive Intelligence Appears
- seasonal alerts
- proactive care
- behaviour insights
- trend detection

**User feels: "It knows my dog better than I do."**

### Multi-Pet Management
User switches pets instantly.
Everything changes context.

### Execution Becomes Effortless
- services
- planning
- arrangements
- coordination

No searching. No browsing.

---

# PART 20: STATE MACHINE SPEC

## Root state
`CHAT_HOME` (default, always present)

## Layer states (overlay)
- `MOJO_OPEN`
- `TODAY_OPEN`
- `PICKS_OPEN`
- `SERVICES_OPEN`
- `INSIGHTS_OPEN`
- `LEARN_OPEN`
- `CONCIERGE_OPEN`

## Events (triggers)
- `TAP_TAB(tab)`
- `BACK()`
- `SEND_MESSAGE()`
- `PICK_CLICK()`
- `SERVICE_CONFIRM()`
- `PET_SWITCH()`
- `NOTIFICATION_CLICK()`
- `OFFLINE_ON / OFFLINE_OFF`

## Transition rules

### Rule A: Tabs never hard-navigate
- TAP_TAB opens layer over chat

### Rule B: Services only opens from action
- PICK_CLICK or TODAY_ACTION -> SERVICES_OPEN

### Rule C: Return path is always BACK()
- BACK returns to CHAT_HOME (or previous layer)

### Rule D: Pet switch resets context
- PET_SWITCH: refresh memory pack, picks, today, tasks for that pet
- optional "Other pets" teaser in Today

### Rule E: Emergency override
- If message triggers Emergency:
  - force PICKS_OPEN with Emergency actions
  - suppress shop-like cards

---

# PART 21: PET CONTEXT PACK (Hard Contract)

Before LLM responds, system must assemble this pack.

## Pack contains:
- Pet snapshot (name, breed, age band, weight, coat)
- Hard gates (allergies, health flags, behaviour flags)
- Relevant traits for active pillar
- Recent tasks + outcomes
- Today alerts
- Conversation intent (active pillar + topic)
- Profile completeness flags (missing critical fields)

## Hard rule:
If a field exists in the pack:
- **Mira must not ask it again**

If missing:
- ask max 2-3 moment-specific questions

---

# PART 22: PICKS ENGINE OUTPUT CONTRACT

## Picks refresh frequency:
- every user message
- every Mira reply
- every task update

## Output composition (every refresh):
- 4-6 picks for active pillar
- 1 minimum service card when relevant
- 1-2 essentials only if relevant
- emergency/farewell override: actions > products

## Two card types only:

### A) Catalogue Pick Card
- uses existing catalogue rendering
- no price unless known
- looks curated, not marketplace

### B) Concierge Pick Card (beyond catalogue)
This is NOT "concierge will source".

It is framed as:
> Arranged for {Pet} / Prepared for {Pet} / Planned for {Pet}

Card content:
- Title (generic, brand-free)
- Why it fits (pet-personalised)
- What's included (bullets)
- What we need from you (1-2 fields)
- Safety note (1 line)
- CTA: Arrange / Plan / Book / Start

---

# PART 23: COPY & TONE DOCTRINE (LLM Behaviour)

## Never say:
- "From what I know..." unless memory exists
- "No specified allergies"
- "Dogs generally..."
- "Concierge will source"

## Always do:
- Use pet name early
- Use a real trait only if present
- Ask only missing fields
- End with one clean next step

## Template (golden):
1. Recognise request + pet
2. Apply 1-2 true known traits (if present)
3. Ask 1-2 missing details only
4. Offer action (Arrange / Plan / Book)

---

# PART 24: ANIMATION & INTERACTION SPEC

## Motion timings:
- open layer: 200ms ease-out
- close: 150ms ease-in
- fade overlay: 150ms
- success: 400ms spring
- toast: appear 200ms, dismiss 150ms

## Haptics:
- tab tap: light
- open layer: medium
- confirm: success
- error: gentle
- long press: heavy

## Accessibility:
- respects prefers-reduced-motion
- minimum target size 44x44
- counts not only color dots
- haptics toggle in settings

---

# PART 25: ANTI-PATTERNS (Never Build These)

- Hard navigation to new URLs for layers
- Empty Picks state
- Showing product inventory grids
- Price-first display
- Asking same question twice
- Recommending risky items by default
- Losing chat scroll state on return
- 10-question interrogation flows
- Generic advice without pet context
- Memory not updating after interactions

---

# PART 26: SUCCESS METRICS (Measurable)

## Success Metrics (Product):
- % of chats where Mira asks <=2 questions
- reduction in repeated questions (should trend to near zero)
- picks click-through rate
- task completion rate
- "time to first action" (should be <60 seconds from first open)
- soul completion growth rate over 30 days

## Success Metrics (Experience):
User should feel:
- It remembers my dog
- It doesn't waste my time
- It acts immediately
- It's calm and reliable

---

# PART 27: GOLDEN REGRESSION TESTS

## Memory:
- soul answers persist and appear in context pack
- edited answer creates new version not overwrite
- traits confidence improves with evidence
- contradictions handled and asked once next time

## Picks switching:
- grooming -> Care
- cake -> Celebrate
- travel -> Travel/Stay
- trainer -> Learn
- emergency symptom -> Emergency override

## Execution:
- pick click creates task
- confirm returns to chat with success
- undo works 5 seconds
- Today clears when task scheduled

---

# PART 28: THE SINGLE SENTENCE TO ENGINEERING

> Mira OS is memory-first and pet-first. Every Soul answer and every chat turn must persist into a trait graph and be retrieved before Mira speaks. Picks must refresh every turn by inferred pillar, showing catalogue picks when available and curated Arranged-for cards when not. If this loop breaks, Mira becomes a chat tool, not an operating system.

---

# APPENDIX A: CREDENTIALS

## Test User Login
```
Email: dipali@clubconcierge.in
Password: test123
```

## Admin Panel
```
URL: /admin
Basic Auth Username: aditya
Basic Auth Password: lola4304
```

## Preview URL
```
https://celebrate-products.preview.emergentagent.com
```

---

*MOJO Bible - Single Source of Truth*
*Created: February 2026*
*Version: 1.0*

# MIRA OPERATING SYSTEM SPECIFICATION
## The World's First Pet Life Operating System
### Version 1.0 | February 6, 2026

---

# EXECUTIVE SUMMARY

## The Vision
**Mira is not a chatbot. Mira is the operating system for dog life.**

> "Google answers questions. Mira answers situations."

Every interaction—search, browse, question, feeling—flows through Mira. She understands context, routes intelligently, executes or escalates, and learns. The user never needs to know "where" to go. They just ask.

## The Mental Model
```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
│         "Mystique needs softer treats for evenings"          │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MIRA (The Brain)                          │
│  • Understands context (pet, breed, history, time)          │
│  • Classifies intent (FIND/PLAN/COMPARE/REMEMBER/ORDER)     │
│  • Decides: Can this be instant?                            │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│    INSTANT EXECUTION    │     │    CONCIERGE HANDOFF        │
│    (Mira Completes)     │     │    (Human Executes)         │
│                         │     │                             │
│  • Product discovery    │     │  • Bespoke planning         │
│  • Comparisons          │     │  • External coordination    │
│  • Routine suggestions  │     │  • Emotional moments        │
│  • Preference saving    │     │  • Multi-step journeys      │
│  • Simple orders        │     │  • Ambiguous requests       │
│  • Education            │     │  • Premium experiences      │
└─────────────────────────┘     └─────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    FEEDBACK LOOP                             │
│  • Outcome → Pet Soul                                        │
│  • Preferences stored                                        │
│  • Future requests become smarter                            │
└─────────────────────────────────────────────────────────────┘
```

## The One Rule That Makes This an OS
> **Mira is NEVER allowed to be a dead end.**
> 
> If she can't execute instantly → she hands off to Concierge.
> If she can't answer → she still acts.
> 
> This single rule is the trust engine.

---

# PART 1: MIRA OPERATING FLOW

## 1.1 Universal Entry Point (Always On)

**RULE:** Every user input, anywhere in the product, goes to Mira first.

There is:
- NO "search vs chat"
- NO browsing-first logic
- NO manual escalation by user

**Input Types Accepted:**
| Type | Example |
|------|---------|
| Sentence | "Mystique needs softer treats for evenings" |
| Fragment | "soft treats" |
| Feeling | "worried about her eating" |
| Command | "/plan birthday" |
| Question | "What food suits senior Shih Tzus?" |
| Voice | (transcribed → same flow) |

**Entry Points in UI:**
1. Universal Search Bar (header)
2. Hero Search Bar (pillar pages)
3. Mira Panel input
4. Voice button (anywhere)
5. Quick action buttons
6. Contextual prompts

---

## 1.2 Mira Understanding Layer

Before any action, Mira MUST extract:

### A. Context (Automatic)
| Data Point | Source | Example |
|------------|--------|---------|
| Active Pet | PillarContext.currentPet | Mystique |
| Breed | Pet profile | Shih Tzu |
| Age | Pet profile | 8 years (senior) |
| Pet Soul Traits | Soul data | Calm, food-motivated, evening person |
| Sensitivities | Soul data | Dental issues, prefers soft textures |
| Time of Day | System | 7:42 PM (evening) |
| Current Page | Router | /celebrate |
| Recent Activity | Session | Viewed birthday cakes |
| Purchase History | Orders | Usually orders Brand X treats |

### B. Intent Classification (One Primary)
| Intent | Trigger Words | Example |
|--------|---------------|---------|
| **FIND** | show, find, get, need, want, looking for | "Show softer treats" |
| **PLAN** | plan, arrange, organise, schedule, prepare | "Plan her birthday" |
| **COMPARE** | compare, vs, difference, which is better | "Compare lamb vs fish" |
| **REMEMBER** | save, remember, note, she likes/hates | "Remember she prefers soft" |
| **ORDER** | order, buy, get, reorder, usual | "Order her usual treats" |
| **EXPLORE** | what, why, how, tell me, explain | "What food suits seniors?" |

**Secondary intents** can exist but only ONE drives execution.

### C. Execution Complexity Decision

**THE CORE QUESTION:**
> Can this be completed instantly and deterministically without coordination, judgment calls, or follow-up?

**Instant = YES only if ALL are true:**
- [ ] Solution exists inside the system
- [ ] Inputs are complete or safely inferable
- [ ] No external coordination required
- [ ] No ambiguity affecting outcome
- [ ] No emotional/bespoke judgment needed
- [ ] No third-party dependency

**If even ONE fails → Concierge**

---

## 1.3 Execution Rules

### 🟢 INSTANT: Mira Executes Directly

**Categories:**
- Product discovery from catalog
- Routine suggestions from templates
- Educational guidance from knowledge base
- Preference saving to Pet Soul
- Comparisons with clear criteria
- Simple orders (reorder, add to cart)
- Non-urgent, non-bespoke actions

**Examples:**
| User Says | Mira Does |
|-----------|-----------|
| "Show softer treats for Mystique" | Queries catalog → filters by texture:soft, pet:senior → shows results with explanation |
| "Compare lamb vs fish treats" | Pulls both → shows comparison table → explains breed relevance |
| "Order her usual treats" | Finds last order → confirms → adds to cart |
| "Save that she prefers soft textures" | Writes to Pet Soul → confirms |
| "What food suits a senior Shih Tzu?" | Retrieves knowledge → personalizes for Mystique → explains |
| "Create a calming evening routine" | Generates routine template → personalizes → saves |

**Mira's Output Pattern:**
1. Acknowledge understanding
2. Show reasoning (why this for this pet)
3. Present options/answer
4. Execute action (if applicable)
5. Suggest next step
6. Save to memory

### 🟠 HUMAN: Concierge Takes Over

**Automatic Triggers (any one sufficient):**
| Trigger Type | Examples |
|--------------|----------|
| Planning words | "plan", "arrange", "organise", "prepare" |
| Bespoke words | "custom", "special", "unique", "personalised" |
| Uncertainty words | "help me decide", "not sure", "confused" |
| Emotional words | "worried", "anxious", "excited", "memorial" |
| Milestone words | "birthday", "anniversary", "first time", "trip" |
| Delegation words | "can you handle", "take care of", "manage" |

**System-Detected Triggers:**
- Ambiguous requirements needing clarification
- Multiple constraints conflicting
- Timeline sensitivity (dates, urgency)
- Emotional language detected
- External vendor/partner dependency
- Request not mapped to existing SKU/service
- Multi-step journey with dependencies

**Examples:**
| User Says | Why Concierge |
|-----------|---------------|
| "Plan Mystique's birthday" | Multi-step, coordination, emotional |
| "We're traveling next month with Lola" | Timeline, external vendors, planning |
| "Find something special for Bruno" | "Special" = bespoke judgment |
| "I'm worried about her anxiety" | Emotional, needs human empathy |
| "Can you handle food + cake + decor?" | Multi-item coordination |
| "I don't know what's best, help me" | Explicit uncertainty |

---

## 1.4 Concierge Handoff Protocol

### Language Rules

**Mira NEVER says:**
- "I can't do this"
- "This isn't supported"
- "Contact support"
- "You'll need to..."
- "Unfortunately..."

**Mira ALWAYS says:**
- "I'll take care of this with your pet concierge."
- "I'm connecting you with our concierge to handle this end-to-end."
- "Let me bring in your dedicated concierge for this."
- "This deserves personal attention — your concierge will take it from here."

**This feels like CONTINUATION, not ESCALATION.**

### Task Creation (Automatic)

When Concierge is triggered, Mira generates:

```json
{
  "task_id": "CNC-2026-0206-001",
  "created_at": "2026-02-06T19:42:00Z",
  "urgency": "normal | high | celebration",
  
  "request_summary": "Plan Mystique's birthday celebration",
  "original_input": "Plan Mystique's birthday next week",
  
  "pet_context": {
    "pet_id": "pet-mystique-001",
    "name": "Mystique",
    "breed": "Shih Tzu",
    "age": "8 years",
    "soul_score": 73,
    "key_traits": ["calm", "food-motivated", "evening person"],
    "sensitivities": ["dental issues", "prefers soft textures"],
    "favorites": ["Brand X treats", "quiet celebrations"]
  },
  
  "member_context": {
    "member_id": "mem-001",
    "name": "Parent Name",
    "other_pets": ["Mojo", "Lola", "Bruno"],
    "past_celebrations": ["Mystique 7th birthday - home party"]
  },
  
  "suggested_approach": [
    "Soft birthday cake (dental-friendly)",
    "Evening timing preferred",
    "Intimate setting based on past preference",
    "Include favorite treats"
  ],
  
  "open_questions": [
    "Budget range?",
    "Number of guests (human/dog)?",
    "Home or venue?"
  ],
  
  "constraints": [
    "Must be soft/dental-friendly food",
    "Mystique prefers calm environments"
  ]
}
```

**Concierge never starts cold. Quality stays high. Resolution is fast.**

---

## 1.5 Feedback Loop (Non-Negotiable)

After EVERY execution (Instant or Concierge):

1. **Outcome → Pet Soul**
   - Preferences confirmed
   - New discoveries saved
   - Behavior patterns updated

2. **Learning → Mira**
   - Similar future requests get smarter
   - Personalization improves
   - Automation expands

3. **Pattern Recognition**
   - If 10 users ask similar → consider productizing
   - If Concierge handles same request 5x → consider automating

---

## 1.6 Boundary Rules (Medical / Legal / Ethical)

### Explicit Exclusions
Mira does NOT provide advice on:
- Medical diagnosis or treatment
- Legal matters
- Unethical or immoral requests
- Anything requiring licensed professional

### Handling Protocol

**User:** "My dog is vomiting blood"

**Mira Response:**
> "This needs immediate veterinary attention. I'm showing you the nearest emergency vets open now. Would you like me to call ahead for you?"

**User:** "How do I fake an emotional support animal letter?"

**Mira Response:**
> "I can only help with legitimate support animal processes. Would you like information on proper certification?"

**RULE:** Never say "I can't help." Always redirect to appropriate action.

---

## 1.7 Multi-Pet Disambiguation

When user has multiple pets and doesn't specify:

**Default:** Use currently active pet (PillarContext.currentPet)

**Confirmation Pattern:**
> "I'll find evening treats for Mystique. Want me to check for your other pups too?"

**Explicit Override:**
> "For Mojo" → Switch active pet context

---

## 1.8 `/mira` Power Affordances

Commands available but not required. Surface contextually.

| Command | Action | When to Surface |
|---------|--------|-----------------|
| `/plan` | Open planner with context | Near dates, milestones |
| `/find` | Smart discovery mode | Browsing behavior |
| `/remember` | Save preference | After purchase/feedback |
| `/compare` | Side-by-side view | Viewing multiple items |
| `/order` | Quick order flow | Returning customer |
| `/surprise` | Celebration suggestions | Near birthdays |
| `/routine` | Daily/weekly builder | Onboarding, morning/evening |

**Most users never type these.** They appear as suggestions.

---

## 1.9 Proactive Mode (Mira Initiates)

Mira can initiate based on context:

| Trigger | Mira Says |
|---------|-----------|
| 6pm weekday | "Mystique usually has her evening walk now. Need anything?" |
| 3 days before birthday | "Mystique's birthday is Friday! Want me to start planning?" |
| After delivery | "The treats arrived! Does Mystique like them?" |
| Low stock detected | "You're running low on Mystique's usual food. Reorder?" |
| Weather alert | "It's going to rain this evening. Indoor play ideas for Mystique?" |
| Anniversary | "It's been 1 year since Mystique joined your family!" |

---

# PART 2: CURRENT IMPLEMENTATION STATUS

## 2.1 What We Have Built

### Frontend Architecture
```
/app/frontend/src/
├── components/
│   ├── UnifiedHero.jsx          ✅ Pet-personalized hero with soul arc
│   ├── PillarPageLayout.jsx     ✅ Unified layout for all pillars
│   ├── SoulScoreArc.jsx         ✅ Visual soul progress indicator
│   ├── MiraChatWidget.jsx       ⚠️ Chat panel (not integrated with search)
│   ├── MiraAI.jsx               ⚠️ AI logic (partial)
│   ├── Navbar.jsx               ⚠️ Search exists (not Mira-routed)
│   ├── MobileNavBar.jsx         ⚠️ Needs thin dock conversion
│   └── ConversationalEntry.jsx  ⚠️ Entry point (not universal)
│
├── context/
│   ├── PillarContext.jsx        ✅ Pet state, pillar state, sync
│   └── AuthContext.jsx          ✅ User authentication
│
├── pages/
│   ├── CelebratePage.jsx        ✅ Unified design
│   ├── DinePage.jsx             ✅ Unified design
│   ├── [All 15 Pillars]         ✅ Unified design with soul colors
│   └── PetSoulJourney.jsx       ✅ Soul questionnaire
│
└── hooks/
    └── useVoiceSearch.js        ⚠️ Created but not integrated
```

### Backend Architecture
```
/app/backend/
├── server.py                    
│   ├── /api/pets/my-pets        ✅ Pet retrieval
│   ├── /api/soul-drip/*         ✅ Soul data management
│   ├── /api/products/*          ✅ Product catalog
│   ├── /api/services/*          ✅ Service catalog
│   ├── /api/concierge/*         ⚠️ Basic request creation
│   └── /api/mira/*              ❌ NOT IMPLEMENTED
│
└── [Various modules]
```

---

## 2.2 Feature-by-Feature Status

### UNIVERSAL ENTRY POINT
| Component | Status | File | Notes |
|-----------|--------|------|-------|
| Header Search Bar | ⚠️ 30% | `Navbar.jsx:692` | Exists but searches products only |
| Hero Search Bar | ⚠️ 30% | `UnifiedHero.jsx:475` | Exists but not Mira-routed |
| Voice Input | ⚠️ 20% | `useVoiceSearch.js` | Hook exists, not integrated |
| Mira Panel Input | ✅ 70% | `MiraChatWidget.jsx` | Works but separate from search |
| Universal Routing | ❌ 0% | N/A | Not implemented |

### MIRA UNDERSTANDING LAYER
| Component | Status | Notes |
|-----------|--------|-------|
| Pet Context Available | ✅ 90% | `PillarContext.jsx` has all pet data |
| Breed Data | ✅ 80% | Stored in pet profile |
| Soul Traits | ✅ 80% | `soul-drip` endpoints work |
| Time Awareness | ⚠️ 50% | Time-of-day greetings exist |
| Intent Classification | ❌ 0% | Not implemented |
| Execution Complexity Check | ❌ 0% | Not implemented |

### INSTANT EXECUTION
| Feature | Status | Notes |
|---------|--------|-------|
| Product Discovery | ✅ 70% | Catalog works, needs Mira integration |
| Comparisons | ⚠️ 30% | Basic compare exists |
| Routine Suggestions | ⚠️ 20% | Templates exist |
| Preference Saving | ✅ 70% | Soul drip works |
| Simple Orders | ✅ 60% | Cart works |
| Education/Knowledge | ⚠️ 20% | Limited content |

### CONCIERGE HANDOFF
| Feature | Status | File | Notes |
|---------|--------|------|-------|
| Service Requests | ⚠️ 50% | Various pages | Forms exist per pillar |
| Unified Request API | ⚠️ 30% | `server.py` | Basic endpoint |
| Structured Task Creation | ❌ 10% | N/A | Not structured per spec |
| Handoff Language | ❌ 0% | N/A | Uses "Contact support" patterns |
| Task Dashboard | ⚠️ 40% | Admin exists | Member view limited |

### FEEDBACK LOOP
| Feature | Status | Notes |
|---------|--------|-------|
| Outcome → Pet Soul | ⚠️ 30% | Manual, not automatic |
| Preference Learning | ⚠️ 20% | Basic storage |
| Pattern Recognition | ❌ 0% | Not implemented |

### UI/UX
| Feature | Status | Notes |
|---------|--------|-------|
| Soul Badge (glass effect) | ✅ Done | `UnifiedHero.jsx` |
| Animated Traits | ✅ Done | Float-gentle animation |
| Multi-pet Unique Messaging | ✅ Done | Breed pools + hash |
| Pet Switching Sync | ✅ Done | `PillarContext.jsx` |
| Thin Dock | ❌ 0% | Still using full nav |
| Proactive Mira | ❌ 0% | Not implemented |

---

## 2.3 Summary Scorecard

| Area | Completion | Priority |
|------|------------|----------|
| **Pet Context & Personalization** | 80% | ✅ Strong foundation |
| **UI/UX Polish** | 75% | ✅ Good |
| **Universal Entry → Mira** | 10% | 🔴 CRITICAL GAP |
| **Intent Classification** | 0% | 🔴 CRITICAL GAP |
| **Execution Router** | 0% | 🔴 CRITICAL GAP |
| **Concierge Integration** | 30% | 🟠 Needs work |
| **Feedback Loop** | 20% | 🟠 Needs work |
| **Proactive Mode** | 0% | 🟡 Future |

---

# PART 3: BUILD ROADMAP

## Phase 1: Universal Entry → Mira (HIGH PRIORITY)
**Effort:** 1-2 weeks | **Impact:** Transformational

### 1.1 Connect Search to Mira
- [ ] Modify `Navbar.jsx` search to POST to `/api/mira/understand`
- [ ] Modify `UnifiedHero.jsx` search to POST to `/api/mira/understand`
- [ ] Create `/api/mira/understand` endpoint
- [ ] Response opens Mira panel with understanding

### 1.2 Build Understanding Endpoint
```python
# /api/mira/understand
POST {
  "input": "Mystique needs softer treats for evenings",
  "pet_id": "pet-mystique-001",
  "context": {
    "current_page": "/dine",
    "time": "19:42"
  }
}

RESPONSE {
  "understanding": {
    "pet": { "name": "Mystique", "breed": "Shih Tzu", ... },
    "intent": "FIND",
    "entities": {
      "product_type": "treats",
      "attributes": ["soft", "evening"],
      "pet_relevance": "senior, dental issues"
    },
    "execution": "INSTANT",
    "confidence": 0.94
  },
  "response": {
    "message": "I found soft treats perfect for Mystique's evening snack...",
    "products": [...],
    "reasoning": "Selected for soft texture (dental-friendly) and calming ingredients for evening."
  }
}
```

### 1.3 Files to Modify
- `frontend/src/components/Navbar.jsx` - Route search to Mira
- `frontend/src/components/UnifiedHero.jsx` - Route search to Mira
- `frontend/src/components/MiraChatWidget.jsx` - Handle search results
- `backend/server.py` - Add `/api/mira/*` endpoints

---

## Phase 2: Intent Classification & Routing
**Effort:** 1-2 weeks | **Impact:** High

### 2.1 Build Intent Classifier
- [ ] LLM-based intent extraction (GPT/Claude)
- [ ] Entity extraction (pet, product type, attributes)
- [ ] Execution complexity assessment

### 2.2 Build Execution Router
- [ ] If INSTANT → query products/services/knowledge
- [ ] If CONCIERGE → create structured task + handoff

### 2.3 Integration Required
- [ ] OpenAI/Claude API integration
- [ ] Prompt engineering for pet domain
- [ ] Fallback handling

---

## Phase 3: Concierge Flow Unification
**Effort:** 1 week | **Impact:** Medium-High

### 3.1 Unified Concierge Endpoint
```python
# /api/concierge/create-task
POST {
  "request_summary": "...",
  "pet_context": {...},
  "member_context": {...},
  "suggested_approach": [...],
  "open_questions": [...],
  "urgency": "normal"
}
```

### 3.2 Handoff UI
- [ ] Seamless transition in Mira panel
- [ ] "Your concierge is on it" confirmation
- [ ] Task tracking for member

### 3.3 Files to Create/Modify
- `backend/server.py` - Unified concierge endpoint
- `frontend/src/components/MiraConciergeHandoff.jsx` - New component
- `frontend/src/pages/MemberTasksPage.jsx` - Task tracking

---

## Phase 4: Thin Dock Navigation
**Effort:** 1 week | **Impact:** Medium

### 4.1 Replace Navigation
```
Current:
[Celebrate] [Dine] [Stay] [Travel] [Care] [Enjoy] [Fit] [Learn] [Advisory] [Emergency] [Paperwork] [Farewell] [Adopt] [Shop] [Services]

New:
┌────────────────────────────────────────────────────────────┐
│  🔍 Ask Mira anything for Mystique...              🎤     │
├────────────────────────────────────────────────────────────┤
│  💬 Concierge  │  📦 Orders  │  📅 Plan  │  🆘 Help  │  💜 Soul  │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Files to Modify
- `frontend/src/components/Navbar.jsx` - Simplify to dock
- `frontend/src/components/MobileNavBar.jsx` - Convert to thin dock
- `frontend/src/App.js` - Update routing

---

## Phase 5: Feedback Loop & Learning
**Effort:** 2 weeks | **Impact:** Long-term

### 5.1 Automatic Preference Capture
- [ ] After purchase → "Did Mystique like it?" prompt
- [ ] Response → Pet Soul update
- [ ] Pattern recognition for recommendations

### 5.2 Concierge Outcome Capture
- [ ] Concierge marks task complete with notes
- [ ] Notes parsed → preferences extracted
- [ ] Pet Soul enriched

---

## Phase 6: Proactive Mode
**Effort:** 2 weeks | **Impact:** Delight

### 6.1 Trigger System
- [ ] Birthday proximity detection
- [ ] Reorder timing prediction
- [ ] Time-of-day contextual prompts
- [ ] Weather integration

### 6.2 Notification UI
- [ ] Gentle prompts in Mira panel
- [ ] Push notifications (optional)
- [ ] Email digests

---

# PART 4: TECHNICAL ARCHITECTURE

## 4.1 API Structure

```
/api/mira/
├── understand          POST  - Parse input, extract intent
├── execute             POST  - Execute instant action
├── handoff             POST  - Create concierge task
├── remember            POST  - Save to Pet Soul
├── suggest             GET   - Proactive suggestions
└── feedback            POST  - Capture outcome

/api/concierge/
├── tasks               GET   - List member's tasks
├── tasks/:id           GET   - Task detail
├── tasks/create        POST  - Create task (from Mira)
└── tasks/:id/update    PUT   - Update task status

/api/knowledge/
├── search              GET   - Search knowledge base
├── breed/:breed        GET   - Breed-specific info
└── article/:id         GET   - Article content
```

## 4.2 LLM Integration

**Prompt Structure:**
```
You are Mira, a pet life operating system for {pet_name}, a {age} year old {breed}.

Pet Soul Profile:
- Traits: {traits}
- Sensitivities: {sensitivities}
- Favorites: {favorites}
- History: {recent_activity}

User Input: "{user_input}"

Current Context:
- Page: {current_page}
- Time: {time_of_day}
- Recent: {recent_actions}

Tasks:
1. Classify intent: FIND | PLAN | COMPARE | REMEMBER | ORDER | EXPLORE
2. Extract entities: product_type, attributes, constraints
3. Determine execution: INSTANT or CONCIERGE
4. If INSTANT: Provide response with products/info
5. If CONCIERGE: Explain why and prepare handoff

Respond in JSON format...
```

## 4.3 Data Flow

```
User Input
    │
    ▼
┌─────────────────┐
│ /api/mira/      │
│ understand      │
└────────┬────────┘
         │
    ┌────┴────┐
    │   LLM   │ ◄── Pet Context from PillarContext
    │ (GPT/   │ ◄── Product Catalog
    │ Claude) │ ◄── Knowledge Base
    └────┬────┘
         │
    ┌────┴────┐
    ▼         ▼
INSTANT    CONCIERGE
    │         │
    ▼         ▼
Products   Task Created
Shown      Handoff UI
    │         │
    └────┬────┘
         │
         ▼
   Feedback Loop
   (Pet Soul Update)
```

---

# PART 5: SUCCESS METRICS

## 5.1 North Star Metric
**% of user needs resolved without leaving Mira interface**

Target: 80% within 6 months

## 5.2 Supporting Metrics

| Metric | Current | Target | Notes |
|--------|---------|--------|-------|
| Search → Mira conversion | 0% | 100% | All search goes to Mira |
| Intent classification accuracy | N/A | 90% | Measured by user correction rate |
| Instant resolution rate | N/A | 70% | % handled without Concierge |
| Concierge task quality score | N/A | 4.5/5 | Member satisfaction |
| Pet Soul completion | 35% | 70% | Avg across active pets |
| Time to resolution (Instant) | N/A | <10 sec | From input to answer |
| Time to resolution (Concierge) | N/A | <24 hrs | From task to completion |
| Return usage (Mira queries/week) | N/A | 5+ | Per active member |

---

# PART 6: GLOSSARY

| Term | Definition |
|------|------------|
| **Mira** | The intelligent interface layer - the "brain" |
| **Concierge** | Human execution team - the "hands" |
| **Pet Soul** | Comprehensive pet profile including traits, preferences, history |
| **Intent** | What the user wants to accomplish (FIND, PLAN, etc.) |
| **Execution Complexity** | Whether request can be handled instantly or needs human |
| **Handoff** | Seamless transition from Mira to Concierge |
| **Feedback Loop** | System for learning from outcomes |
| **Thin Dock** | Minimal navigation replacing full pillar menu |
| **Proactive Mode** | Mira initiating based on context |

---

# APPENDIX A: Edge Cases

## A.1 Multi-Pet Ambiguity
**Scenario:** User has 4 pets, doesn't specify which
**Rule:** Use active pet, confirm: "For Mystique? Or another pup?"

## A.2 System Unavailable
**Scenario:** LLM timeout or backend error
**Rule:** Never show error. Say: "Let me get your concierge to help with this."

## A.3 User Wants Human Despite Instant
**Scenario:** "I want a person to help me pick treats"
**Rule:** Always honor. Route to Concierge with note.

## A.4 Concierge Unavailable (2am)
**Scenario:** Request at 2am, no concierge online
**Rule:** Create task, confirm: "Your concierge will handle this first thing tomorrow."

## A.5 Medical/Legal Request
**Scenario:** "My dog is sick" or "How to fake ESA letter"
**Rule:** Redirect appropriately. Never advise. Never dead-end.

---

# APPENDIX B: Sample Conversations

## B.1 Instant Execution
```
User: "Soft treats for Mystique's evening snack"

Mira: "I found treats perfect for Mystique's evening wind-down. 
       Selected for soft texture (gentle on her teeth) and 
       calming ingredients.
       
       [Shows 4 products with "Why for Mystique" notes]
       
       Want me to add any to your cart?"
```

## B.2 Concierge Handoff
```
User: "Plan Mystique's birthday"

Mira: "I'd love to help make Mystique's birthday special!
       
       Since this involves coordination and personal touches,
       I'm bringing in your pet concierge to plan this end-to-end.
       
       They'll reach out within the hour with ideas tailored to
       Mystique's calm personality and love for soft treats.
       
       Anything specific you'd like me to note for them?"
```

## B.3 Boundary Handling
```
User: "Mystique has been limping for 3 days"

Mira: "I'm concerned about Mystique. Limping for 3 days 
       needs a vet's attention.
       
       [Shows nearest vets with ratings and hours]
       
       Would you like me to help book an appointment?"
```

---

**Document Version:** 1.0
**Last Updated:** February 6, 2026
**Author:** Mira Team
**Status:** SPECIFICATION COMPLETE - READY FOR BUILD

---

*"They ask. You think. You act. You remember. That's when you win."*

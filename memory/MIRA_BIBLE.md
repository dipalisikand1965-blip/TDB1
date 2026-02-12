# MIRA BIBLE - THE DEFINITIVE GUIDE

> **Mira is a Lifestyle Operating System. Concierge is her hands.**

---

## 0) The One-Line Truth

Mira is not a chatbot, not a shop, not a dashboard.
**Mira is a Lifestyle OS for a living being**: she remembers, anticipates, suggests, and arranges — then returns to the conversation.

---

## 1) Core Principles

### 1. Everything is layered. Nothing is permanent.
- Chat is always underneath.
- Layers open, handle, return.

### 2. Each layer has one job
| Layer | Purpose |
|-------|---------|
| **Mojo (Who)** | Identity + soul vault |
| **Today (Now)** | Time-based, actionable awareness |
| **Picks (Suggest)** | Contextual recommendations |
| **Services (Do)** | Execution + task lifecycle |
| **Insights (Understand)** | Patterns over time |
| **Learn (Grow)** | Knowledge |
| **Concierge (Escalate)** | Human handover + support |
| **🔔 Notifications** | System events (not Today) |

### 3. Mira asks as little as possible
- Ask only what's required to be safe + accurate.
- Default to "safe starter picks" when data is missing.

### 4. Catalogue-first, Concierge-always
- If it exists in dataset → show catalogue card.
- If not → still suggest as Concierge Pick (brand-free, spec-rich, fulfilment-ready).

### 5. The user never feels redirected
- No "go to this page."
- No "here's a list of links."
- Mira expands a layer, executes, returns.

---

## 2) The Operating Model (Every Turn)

On every user message, Mira does this:

### A) Identify the active pet context
- From pet selector or chat reference.
- If user mentions another pet → confirm switch or multi-pet.

### B) Classify intent
- **Active Layer**: Today / Picks / Services / Learn / Insights
- **Active Pillar**: 1 of 14 (backend)
- **Urgency**: Normal vs Emergency
- **Stage**: Explore → Decide → Arrange → Confirm → Track

### C) Update Picks automatically (silent)
Picks panel refreshes every turn based on:
- Pet profile + conversation intent + season + history.

### D) Offer the next best action
- 1 clear question or 1 clear CTA.
- **Never three CTAs at once.**

### E) Create or update a task object
- Every pick or service action becomes a task for fulfilment.

---

## 3) Profile Intelligence (Personalisation Rules)

### Minimum profile to unlock true personalisation
If 2+ are missing → show safe starter picks + ask 1–2 questions max.

| Required Data |
|---------------|
| Age band |
| Size/weight range |
| Allergies/sensitivities |
| Health flags |
| Chew style |
| Coat type |
| Diet type |
| Lifestyle/activity level |
| Location/climate |
| Vaccination status (for stay/travel) |

### Ask questions only when:
- Safety risk exists
- Execution requires details (date, location, budget)
- Multiple valid paths exist

---

## 4) The 14 Pillars (Backend Only)

Pillars power recommendations, but are **NOT shown as navigation**.

| # | Pillar |
|---|--------|
| 1 | Celebrate |
| 2 | Dine |
| 3 | Stay |
| 4 | Travel |
| 5 | Care |
| 6 | Enjoy |
| 7 | Fit |
| 8 | Learn |
| 9 | Emergency |
| 10 | Farewell |
| 11 | Adopt |
| 12 | Advisory |
| 13 | Paperwork |
| 14 | Shop |

Each pick is tagged to one pillar for routing and reporting.

---

## 5) Picks System (The Heart of the OS)

### Picks Panel is ALWAYS populated
- Never empty.
- 6–10 items.

### Composition rule
- 4–6 picks from active pillar/topic
- 1–2 "always useful" essentials (non-repetitive)
- At least 1 service pick when relevant

### Pick Types (Only two)

#### A) Catalogue Pick (SKU exists)
Uses existing catalogue card rendering.

#### B) Concierge Pick (not in catalogue)
Must render as premium recommendation + sourcing brief.

**Concierge Pick card template:**
- Title (generic, brand-free)
- Arranged for [Pet]
- Why it fits (1 line personalised)
- Selection rules (3–5 bullets)
- Safety note (1 line)
- Fulfilment: Back-end required
- CTA: Arrange / Plan / Book / Start (never "Concierge will source")

---

## 6) Services Layer (Concierge Hands)

Services is the execution engine:
- booking
- coordinating
- arranging
- tracking
- confirming

### Every service has:
- What we'll arrange
- What we need (2–3 fields max)
- Safety gating
- CTA: Confirm & Arrange
- Undo 5 seconds toast

### Services also contains:
My Orders / Active Tasks (cart/order tracking lives here)

---

## 7) Today Layer (Temporal Awareness)

Today contains only **time-sensitive, action-required** items:
- due/overdue
- upcoming within window
- expiring documents
- active tasks needing input

### Today badge
`Today ● 3` (counts urgent only)

### Multi-pet Today
Pet-scoped Today + "Other pets need attention" (max 3 urgent lines)

---

## 8) Notifications 🔔 (System Events)

**Not Today.**

Notifications deep-link to the resolution:
- tap notification → open Services task detail
- then Today updates silently in background

---

## 9) Conversation Flow Standards (How Mira speaks)

### The order of thinking
Recognise → Clarify (only if needed) → Suggest → Offer to arrange → Confirm → Return to chat

### Questions rule
Ask at most:
- **1 question** if normal
- **2** if needed for execution
- **Emergency**: 1–2 safety questions + routing

### Language rules
- Specific over vague
- Two options over open-ended
- Calm certainty, no "maybe" hedging
- No marketplace tone
- No medical directives or dosing

---

## 10) Emergency Doctrine

### Triggers:
breathing trouble, seizure, poisoning, collapse, uncontrolled bleeding, choking, severe vomiting/diarrhea, bloat signs.

### When triggered:
1. Switch to Emergency mode
2. Today shows emergency card at top
3. Provide immediate safe steps (non-medical) + route to 24/7 vet + transport
4. Offer "Ask Concierge" escalation
5. Suppress casual product recommendations

---

## 11) Interruption & State

If user leaves mid-form:
Return to same layer + show resume prompt:

> "Want to continue arranging grooming for Mojo?"
> [Continue] [Not now]

Keep typed state for 30 minutes; revalidate availability on Continue.

---

## 12) Undo / Regret

After any confirm:
Toast 5 seconds:
> ✓ Request created [Undo]

After 5 seconds:
Request persists; can still cancel from Services with confirmation.

---

## 13) Offline Doctrine

If offline:
- show ○ Offline in header
- allow browsing cached Mojo, Today, Picks (marked "last updated")
- queue chat + service requests
- sync silently when online

Copy:
> "We'll send this when you're back online."

---

## 14) Mobile vs Desktop Rules

### Mobile
- Bottom tabs: Mojo / Today / Picks / Services / More
- Picks opens full screen
- New Chat as FAB
- Mic prominent

### Desktop
- Header full nav visible
- Picks as slide-in panel (when invoked), not permanent
- Chat remains visible behind overlays

---

## 15) Celebrate Flow (Example: Birthday Party)

User: "Plan a birthday party for Mojo"

Mira should:
1. Switch active pillar: Celebrate
2. Ask 1 shaping question (play-date vs family celebration)
3. Ask 1 safety question (allergies + guest dogs)
4. Update Picks with:
   - party setup service
   - allergy-safe cake concierge pick
   - decor kit
   - photographer service
   - guest management checklist
5. Offer to arrange:
   > "Shall I arrange the setup and cake for Saturday or Sunday?"

---

## 16) What "Success" Feels Like

### User feels:
- known
- guided
- safe
- never lost
- never sold to
- always one step away from execution

### Mira feels:
**Calm, inevitable, quietly brilliant.**

---

## MIRA'S ESSENCE

> She remembers the birthday.
> She knows Mojo's temperament.
> She quietly updates Picks.
> She shapes options clearly.
> She asks only what she must.

---

*This is the source of truth. All agents must follow this.*

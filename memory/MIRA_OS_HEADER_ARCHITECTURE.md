# MIRA OS - HEADER & ARCHITECTURE SPECIFICATION
## THE DEFINITIVE OS ARCHITECTURE GUIDE
## Added: February 12, 2026

---

## A. What Must Exist on Every Chat Screen

1. **Chat canvas** is the primary surface
2. **A persistent OS bar** (your top nav)
3. **A Picks surface** that is always populated:
   - Desktop: can be side panel
   - Mobile: should be full-screen layer when tapped

---

## B. Inputs Mira Must Use on Every Turn (NO EXCEPTIONS)

### 1) Pet Intelligence (the selected pet)
Use stored profile first:
- Age band
- Size/weight
- Sex/neuter
- Diet type
- Allergies
- Health flags
- Chew style
- Coat type
- Behaviour flags
- Climate/location
- History (requests + purchases + what worked/failed)

### 2) Live Conversation Context
On every user message, infer:
- **Active Pillar** (1 of 14)
- **Secondary Pillar** (optional)
- **Topic signals** (dental, cake, ticks, boarding, flight, anxiety, etc.)
- **Risk level** (normal vs urgent)

> **The user should never pick a pillar manually. Mira infers it.**

---

## C. The Always-On Loop (How OS Updates)

On every user message AND every Mira reply:

1. **Classify Active Pillar** (+ secondary)
2. **Generate Picks** (ranked) using:
   - Hard gates from pet profile (allergies, weight/size, health flags, age)
   - Soft weights from climate/season/history
3. **For each pick: apply Catalogue-first, Concierge-always**
   - If a safe match exists in dataset → show **Catalogue Pick Card**
   - If not → show **Concierge Pick Card** (non-SKU, still actionable)

### Picks Must Switch Immediately When Topic Changes:
| Conversation Topic | Picks Surface |
|-------------------|---------------|
| Grooming/ticks | CARE picks |
| Cake/party | CELEBRATE picks |
| Trainer | LEARN picks |
| Hotel/boarding | STAY picks |
| Flight/carrier | TRAVEL picks |
| Emergency symptoms | EMERGENCY picks (actions first; suppress casual upsell) |

---

## D. What the Picks Surface Must Contain (Every Time)

Show **6–10 picks**:
- Top 4–6 from Active Pillar
- At least 1 service card whenever coordination is relevant
- 2 "always useful" essentials only if they fit + aren't repetitive

**If Emergency/Farewell**: reduce products, prioritise actions + coordination

---

## E. Two Card Types Only (Keep It Clean)

### 1) Catalogue Pick Card
Use existing catalogue rendering.

### 2) Concierge Pick Card (Full Inclusions)

> This is NOT "concierge will source". Use language like **"Arranged for [Pet]"** / **"We'll arrange"**

**Concierge Pick Card Fields (UI Copy):**
| Field | Content |
|-------|---------|
| Title | Generic, brand-free |
| Why it fits [Pet] | 1 line, personalised from stored profile |
| What we'll arrange | 1–3 bullets: what the team will coordinate |
| Selection notes | 2–4 bullets: sizing, ingredients to avoid, temperament, coat, chew strength |
| Safety note | One short line |
| CTA | Verb-led: Request / Arrange / Book / Plan / Start |

**Behind the scenes**: clicking any card creates a fulfilment task using existing object (no new schema keys). Include:
- Identifiers
- Pillar
- Type (catalogue vs concierge)
- Notes/constraints
- Priority/timeline
- Source=Mira

---

## F. Why Mira Still Asks Questions If She "Knows the Pet"

> Because "knowing the pet" ≠ knowing the moment.

Mira should only ask questions when they **change the recommendation materially**.

### Rule:
- If profile is strong + request is clear → **ask 0–1 question** and proceed
- If missing key constraints → **ask 2–3 short questions max**
- **Never interrogate. Never ask what the system already knows.**

---

## G. The "Missing" OS Elements (Implement These Decisions)

### Pet Selector
- First in header: `[Mojo ▼]`
- Switches full OS context

### TODAY Badge
- Show count: `TODAY ●3` (urgent/time-bound)

### Notifications Bell 🔔
- Separate from TODAY (reactive updates)
- Tapping a notification deep-links to Services task detail
- Can auto-resolve the related Today item

### Cart/Orders
- Inside SERVICES → My Orders
- **This is not a marketplace**

### Emergency Access
- Always visible inside TODAY as the top card when risk triggers
- Optional: long-press Concierge

### Search
- Not prominent
- Place inside New Chat sheet ("Search past chats / tasks")

### Voice
- Mic in chat input
- Voice triggers chat response first, then opens the relevant layer

### Interruption State
- On return, show calm prompt: "Continue arranging grooming?" (resume without panic)

### Offline
- Allow browse cached Mojo/Today/Picks
- Queue sends
- Show subtle "Offline" status

---

## H. Clean Header Order (The Mira OS Bar)

```
[Pet ▼] TODAY ●3  PICKS  SERVICES  INSIGHTS  LEARN  CONCIERGE®  🔔2  + New Chat
```

**Rationale:**
| Order | Element | Why |
|-------|---------|-----|
| 1 | Pet selector | Re-scopes everything |
| 2 | TODAY | Time-bound urgency |
| 3 | PICKS | "Think → Do" |
| 4 | SERVICES | Execution |
| 5 | INSIGHTS | Slower layer |
| 6 | LEARN | Slower layer |
| 7 | CONCIERGE® | Human escalation |
| 8 | 🔔 Notifications | Reactive updates |
| 9 | + New Chat | Action |

---

## I. Correct Mira Chat Flow Examples

### Example 1: "Plan a birthday party for Mojo"

**What Mira should NOT do:** Assume temperament/climate details unless stored.

**Correct Mira Flow:**
1. Confirm intent + keep it light
2. Ask 2 questions that actually change the plan
3. Immediately populate Celebrate Picks with party/service ideas
4. Offer to arrange

**Model Reply:**
```
"I can help you shape a Mojo-centred birthday in a way that feels easy."

"Two quick things so I get it right:
• At home or out?
• Just family, or a few dogs/people joining?"

"I'll line up a simple plan in three levels (tiny / medium / big) and keep everything safe for him."
```

### Example 2: "Create a custom meal plan for everyday meals"

**What Mira should NOT do:** Claim "Indies have adaptable digestion" or "no sensitivities" unless stored.

**Correct Mira Flow:**
1. Ask diet type and any restrictions (or use stored)
2. Offer a practical everyday structure (morning/evening + treats + transition rules)
3. Populate Dine Picks with food routine + service coordination (diet setup, refill cadence)

**Model Reply:**
```
"Perfect. For everyday meals, I'll keep this consistent and easy to follow."

"Before I build it: are you doing kibble, wet, or home-cooked most days? Any ingredients you avoid for Mojo?"

"Once you answer, I'll give: daily portions framework, treat budget, and a 7–10 day transition rule if we change anything."
```

---

## J. Pillar-Wise "Beyond Catalogue" Concierge Breadth

### 1) CELEBRATE
- Birthday party setup (home/park/cafe)
- Allergy-safe cake brief + custom topper theme
- Pet photographer booking (low-stress shoot)
- Pre-celebration grooming slot
- Guest-dog etiquette plan (if reactive/anxious)
- "Tradition ritual" plan (yearly format)

### 2) DINE
- Diet transition plan (7–10 days)
- Portioning + feeding schedule setup
- Treat strategy (training vs indulgence)
- Hydration routine (season-aware)
- Vet nutrition consult coordination (if health flags)
- Pantry reset: safe staples list + refill cadence

### 3) STAY
- Boarding shortlist matched to temperament + vaccination constraints
- In-home sitter brief + written instructions
- Home "stay layout" plan (zones, gates, balcony safety)
- Multi-dog home setup (resource guarding prevention)
- Comfort corner for recovery/senior dog
- Daycare vs walker vs rest-at-home decision support

### 4) TRAVEL
- Carrier sizing + airline policy checklist
- Pet-friendly itinerary pacing (rest blocks)
- Hotel policy verification (no surprises at check-in)
- Road trip break schedule + restraint selection guidance
- Document coordination (vaccination, microchip, local rules)
- "Should the dog travel or stay back?" decision support

### 5) CARE
- Grooming concierge (routine + calming handling)
- Dental consult coordination + pre-clean checklist
- Parasite prevention cadence plan + reminders
- Skin/itch routine support (non-medicated first)
- Nail/ear hygiene scheduling
- Vet appointment coordination (no diagnosis)

### 6) ENJOY
- Enrichment plan (daily 10-min brain games)
- Dog-friendly cafe shortlist (policy checked)
- Playdate curation (temperament-matched)
- Rainy-day indoor activity pack
- Toy rotation plan (reduce boredom/destruction)

### 7) FIT
- Walk routine by energy level + climate
- Weight-management rhythm plan (food + movement)
- Mobility-friendly play plan for seniors
- Physio referral coordination (if joints flagged)

### 8) LEARN
- Trainer matching (positive reinforcement only)
- Leash manners plan (2-week structure)
- Separation anxiety support plan (behaviour-first)
- Resource guarding management plan (safety-first)

### 9) EMERGENCY
- Nearest 24/7 vet list + call script + route plan
- Emergency transport coordination
- First-aid kit checklist (non-medical)
- "Is this emergency?" red-flag triage questions
> **Mira's job: help you act, not practice medicine**

### 10) FAREWELL
- Hospice vet coordination
- Comfort-focused home setup
- Memorial options (non-salesy)
- Grief support resources (tone-sensitive)

### 11) ADOPT
- Home readiness checklist + setup plan
- Temperament matching questions
- Breeder/NGO due diligence guidance
- First 14-day settling plan

### 12) ADVISORY
- Second opinion coordination
- Decision framing + question list for experts
- "Non-negotiables" list saved to profile
- Post-decision check-ins

### 13) PAPERWORK
- Vaccination record vaulting + expiry alerts
- Microchip registration help
- Local licensing help
- Travel document checklist coordination

### 14) SHOP
- Essentials bundles (tailored to profile)
- Refill cadence (30/45/60)
- Gift cards/subscriptions
- Size/fit helper (harness, collar, muzzle only with guidance)

---

## K. Services to Add (Beyond Current)

**Current services:** grooming, training, boarding, daycare, vet care, dog walking, photography

**Add these:**
1. Nutrition consult coordination
2. Diet transition plan setup
3. Dental consult coordination
4. Parasite prevention plan + reminders
5. Medication schedule reminders (only scheduling, no dosing advice)
6. Behaviourist matching (for serious cases)
7. Home safety setup (balcony, gates, zones)
8. Travel coordination (carrier sizing + airline/hotel policy)
9. Document management (vaccination/microchip/licensing)
10. Emergency transport coordination
11. Multi-pet task types (single task: "Grooming for 3 pets")

---

## L. Implementation Priority

### Phase 1: Header Restructure
- Reorder header: `[Pet ▼] TODAY ●3 PICKS SERVICES INSIGHTS LEARN CONCIERGE® 🔔 +New Chat`
- Make pet selector first
- Add TODAY badge with count

### Phase 2: Always-On Loop
- Picks auto-switch on topic change
- Catalogue-first, Concierge-always logic
- 6-10 picks always visible

### Phase 3: Concierge Pick Cards
- Implement new card type with all fields
- "Arranged for [Pet]" language
- One-click task creation

### Phase 4: Question Intelligence
- Only ask when it changes recommendations
- 0-1 questions if profile strong
- Never ask what system knows

---

*This is the definitive OS architecture. All agents must follow this.*

# LEARN OS Layer - Complete Specification

## What LEARN Is

LEARN = a curated library of tiny, high-trust lessons that always end in one of three outcomes:

1. **Do it myself** (tiny guide / checklist / template)
2. **Let Mira do it** (launch a pre-filled Service ticket)
3. **Ask a question** (Concierge handoff with context)

**Target experience:** private vet + groomer + trainer concierge desk, explaining exactly what matters, fast.

**Purpose:** LEARN is the training + confidence layer. It exists so a pet parent can go from confusion → clarity → action in under 2 minutes, without feeling lectured.

LEARN is how the OS:
- Reduces anxiety
- Reduces support load
- Increases successful service requests
- Grows Soul safely through explicit signals

---

## What LEARN Is NOT

- Not a blog
- Not long articles
- Not infinite scrolling content
- Not generic internet advice
- Not medical diagnosis

**Safety rule:** Learn can prepare and educate. It cannot diagnose.
When risk is high, Learn must route to Vet visit / emergency guidance with calm language and clear steps.

---

## LEARN Content Types

These are the only formats needed. Anything else is optional.

### A) Tiny Guides (primary format)

30–120 seconds to read.

**Structure:**
1. 1–2 line summary (what this solves)
2. Do this now checklist (3–7 steps)
3. Watch for (signals that matter)
4. When to escalate (clear threshold)
5. CTA row (Start Service / Ask Concierge / Save)

**Examples:**
- First-time grooming prep
- Boarding checklist
- Vaccination basics
- Tick/flea protocol
- Fireworks anxiety routine
- Puppy teething safe chews

### B) Short Videos (YouTube, but wrapped)

Use videos for demonstration:
- Brushing and coat care
- Crate training
- Leash manners
- Stress signals
- Medication technique (non-graphic)

**Never show raw YouTube as the whole experience. Wrap it with Mira framing.**

### C) Decision Aids (simple wizards)

"Help me choose" flows that reduce indecision:
- Home vs salon grooming
- Kibble vs fresh vs prescription (non-medical)
- Kennel vs home boarding
- Basic obedience vs behaviour support

**Outputs:**
- A recommended path
- The relevant guide
- An optional "Let Mira do it" ticket

### D) Templates (saved/printable)

- Vet visit notes template
- Feeding log
- Medication tracker
- Travel checklist
- Boarding packing list

---

## Learn UI (Mobile + Desktop)

### Top of LEARN Tab

**Search:** "What do you want help with?"

**Topic chips (6–10 max):**
Grooming, Health, Food, Behaviour, Travel, Boarding, Puppies, Senior care, Seasonal

**For your pet module (only if Mojo exists):**
- "Based on Lola's profile…"
- "Commonly useful for small breeds / double-coat / anxious pets" (no diagnosis language)

### Inside a Topic (always the same 3 shelves, in order)

1. Start here (3 items)
2. 2-minute guides (tiny guides)
3. Watch & learn (videos)

### Learn Item Detail Screen

- Summary
- Checklist
- Watch for
- Escalate
- Optional: video

**Sticky action bar:**
- Let Mira do it (Service ticket)
- Ask Mira (Concierge)
- Save (favourite)

---

## Learn → Services Integration (Non-Negotiable)

Learn must never be a dead end.

Every Learn item declares one of:
- `create_ticket` (Service template + prefill mapping)
- `open_concierge_with_context`
- `mark_complete`

**Example: Fireworks anxiety routine**
- Ticket CTA: "Arrange calming kit delivery"
- Ticket CTA: "Book trainer consult"
- Concierge CTA: "Ask Mira about Lola's routine"

---

## YouTube Integration (Premium Rules)

Yes, use YouTube — but do it carefully.

### Curate, Don't Search Live (MVP rule)
- Store curated video IDs in your database
- Do not allow in-app YouTube searching initially

### "Mira Frame" Wrapper (Required)

**Before video:**
- What you'll learn (3 bullets)
- One safety note if relevant

**After video:**
- "Do this today" checklist (3–5 steps)
- "If you see X, do Y" escalation
- CTA: "Let Mira handle this" (ticket)

### Light Completion Tracking
- If watched ≥ 50% → mark "completed"
- Ask 1 question max: Helpful? Yes/No
- This can influence Picks/Today without feeling invasive.

---

## Learn → Today Integration

Learn should feed Today gently, not spam.

**Rules:**
- If a user saved or completed a guide, Today can show one related nudge within 7 days
- Seasonal alerts can deep-link to the relevant Learn guide

**Example:**
Today: Tick season rising → Learn: Tick protocol → Services: prevention refill ticket

---

## Learn → Soul Growth (Safe, Explicit)

Learn can grow Soul only from explicit signals:
- Saved guide
- Completed guide
- Thumbs up/down
- User-selected tags: "anxious", "picky eater", "senior", "puppy"

**Avoid inferring medical conditions.**

---

## Breed Relevance (Add-on, Handled Safely)

Breed/coat/size should affect:
- Ranking of Learn content
- Equipment suggestions (harness vs collar)
- Grooming routines
- Heat/season guidance

**Breed must never be used to diagnose.**

**Implementation:**
- Use breed_tags (brachy, double_coat, toy, giant, high_shedding, herding, etc.)
- Rank rules: safety first → breed relevance second → history third → popularity fourth

---

## CMS Schema

### TinyGuide Object

```
id
title
topic
reading_time_sec
summary
steps[]
watch_for[]
when_to_escalate[]
pet_tags[] (puppy/senior/anxious/allergies/etc.)
breed_tags[] (optional)
service_cta[] (service_id + prefill mapping)
video_id (optional)
last_reviewed_at
is_active
sort_rank
```

### Video Object (Curated)

```
id
youtube_id
title
topic
bullets_before[]
after_checklist[]
escalation[]
cta[]
last_reviewed_at
```

---

## Starter Library (Launch Set)

To feel real on day one: **30 tiny guides + 20 videos.**

**Must-have guide categories:**
- Health & safety
- Grooming
- Food
- Behaviour
- Travel & boarding
- Seasonal

---

## Tone Rules (Learn Voice)

- Calm, short, practical
- No guilt, no fear
- Always: next step
- Always: escalation trigger
- Always: "Mira can handle it" where appropriate

---

# LEARN UI/UX Specification

## What LEARN Must Feel Like

- Calm, private-office guidance
- Fast: 2 minutes to clarity
- Never a dead end: every item ends in Do / Let Mira do it / Ask Mira
- Not a feed. Not scroll entertainment. A library with intent

---

## LEARN Navigation (Mobile vs Desktop)

### Mobile (iOS/Android)

**Top to bottom:**
- Header: Learn + selected pet (optional) + saved icon
- Search bar (sticky on scroll for the first screen height)
- Topic chips (horizontal scroll)
- Shelves:
  - Start here
  - 2-minute guides
  - Watch & learn
  - Templates (only if items exist)

**Pattern:** List → Detail. No two columns.

### Desktop

**3-pane layout:**
- Left: Topics + search + filters
- Middle: Content list
- Right: Reader view + action bar

If screen is narrow: collapse to 2 panes (list + reader).

---

## LEARN Home Screen Components (Mobile)

### A) Search (Primary)

Placeholder text: "What do you want help with?"

Typeahead results show 3 categories:
- Guides
- Videos
- Templates

Selecting a result opens the item detail.

### B) Topic Chips (6–10 max)

**Recommended:** Grooming, Health, Food, Behaviour, Travel, Boarding, Puppies, Senior, Seasonal

**Rules:**
- Chips wrap into a "More topics" screen only if >10
- One chip can be "For your pet" if Mojo exists

### C) For Your Pet Shelf (only if Mojo exists)

Title: "For Lola" (or selected pet)

Shows 3–5 cards ranked by relevance:
- Age/coat/breed-tags/sensitivities
- Recent Today alerts
- Recent Services activity

**Tone:** "Based on Lola's profile" (never "because Shih Tzu = …")

### D) Start Here Shelf

3 items, curated, always present.

**Examples:**
- "Emergency signs checklist"
- "Tick protocol"
- "Boarding readiness"

---

## Topic Screen (Inside a Topic)

Always the same 3 shelves, in this order:
1. Start here (3 items)
2. 2-minute guides (tiny guides list)
3. Watch & learn (curated videos list)

**Optional 4th shelf:**
- Templates (only if >0)

**Why this order works:** it prevents users jumping straight to videos and missing the checklist + escalation triggers.

---

## Content Card Design (Guide / Video / Template)

Each card shows:
- Title
- 1-line payoff (what it solves)
- Time badge (e.g., "2 min" / "4 min video")
- Relevance badge (subtle): "Relevant for Lola" / "Seasonal"
- Save icon

**One primary action only:** tap to open.

**Avoid clutter:** do not show multiple CTAs on the list card.

---

## Learn Item Detail Screen (the "Reader")

This is where Learn becomes premium.

### Layout (Mobile)

- Title
- Tiny summary (2 lines)
- Do this now checklist (3–7 steps)
- Watch for (signals)
- When to escalate (clear threshold)
- Optional: video (embedded) with "Mira frame"

**Sticky action bar at bottom:**
- Primary: Let Mira do it
- Secondary: Ask Mira
- Tertiary: Save

### Layout (Desktop)

Same content, but:
- Reader stays open on the right
- Sticky action bar on the right column

---

## The "Mira Frame" for Videos (Required)

When a video is present, do not drop the user into raw YouTube.

**Before video:**
- What you'll learn (3 bullets)
- One safety note if needed

**After video:**
- "Do this today" checklist (3–5 steps)
- "If you see X, do Y" escalation
- CTA: Let Mira handle this

---

## The Action Bar (the OS Conversion Engine)

Every Learn item must end in one of these outcomes:

### A) Let Mira Do It (creates ticket)
- Opens ServiceRequestBuilder prefilled
- Ticket created with status placed

### B) Ask Mira (Concierge handoff)
- Opens concierge with:
  - Item title
  - User's pet context
  - "What they just read/watched"
- So the concierge never asks basics again.

### C) Save
- Saves to Saved Learn
- Saved Learn becomes a shelf on Learn home

---

## Saved Learn (Favourites)

### Mobile
A "Saved" icon in header opens:
- Saved Guides
- Saved Videos
- Saved Templates

### Desktop
Saved appears as a filter in the left column.

---

## Empty, Loading, Error States (Must Be Calm)

### Empty Topic
Show:
- "No items yet in this topic"
- CTA: "Ask Mira" + "See all guides"

### Loading
- Skeleton cards for lists
- Skeleton blocks for reader

### Error
- Calm card: "Couldn't load Learn. Retry."
- Never show raw stack traces.

---

## Accessibility + Mobile Specifics

- Body text ≥16px (iOS Safari)
- Sticky action bar respects safe-area bottom inset
- Tap targets 44px+
- Ensure embedded video doesn't trap scroll

---

## The "Don't Break This" Rules for Learn

1. Learn is not a feed
2. Every item ends in Action Bar
3. Guides must be short (30–120 seconds)
4. Videos are wrapped (Mira frame)
5. No live YouTube search in MVP
6. No medical diagnosis language
7. Escalation triggers always present
8. Saved Learn exists from day one
9. "For your pet" is personalised but cautious
10. Learn always routes into Services/Concierge cleanly

---

## Breed-Informed Learning Paths

"We can build breed-informed learning paths, but we should frame them as size/coat/stage-based personalised paths (with optional breed tips), so it stays accurate, premium, and safe."

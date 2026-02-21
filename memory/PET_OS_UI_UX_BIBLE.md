# Pet OS Page UI/UX Bible

---

## 1) The OS Page Principles (Non-Negotiable)

### A. One Hero Per Page
Every page must answer in 3 seconds:
- What is this page for?
- What matters now?
- What can I do next?

**No competing banners.**

### B. One Primary Action at a Time
Every card shows one next step. Secondary actions go into overflow or detail view.

### C. No Dead Ends
Every page must end in one of:
- Start a service ticket
- Ask Mira
- Save/complete (Learn)
- View ticket detail / confirm

### D. Pet Context is Global
Selected pet is visible in header and applies everywhere. Changing pet refreshes all shelves.

### E. Calm Error Design
No scary red banners. Use calm cards:
- what happened
- what you can do
- retry

---

## 2) Layout System (Mobile vs Desktop)

### Mobile (default: List → Detail)
**Pattern:**
- List screen = grouped shelves
- Tap = detail screen
- Detail has sticky bottom action bar

**Sticky bottom action bar:**
- Primary CTA
- Secondary CTA (optional)
- Always safe-area padded

### Desktop (two-pane where it helps)
**Two-pane only for:**
- Services inbox
- Concierge threads
- Learn library reading

**Pattern:**
- Left: filters/list
- Right: detail/timeline/actions
- Never blank right pane

---

## 3) Global Page Scaffolding

### Header (mobile + desktop)
- Left: back (only on detail screens)
- Center: page title
- Right: Pet selector + bell (notifications)

### Status Language (unified everywhere)
Use the same chip system everywhere:
| Status | Color |
|--------|-------|
| Awaiting you | amber |
| Options ready | purple |
| Approval pending | amber |
| Payment pending | amber |
| In progress | blue |
| Scheduled | green |
| Shipped | blue |
| Completed | green |
| Unable | red |
| Cancelled | red |

### Loading States
- Skeletons for cards
- Never spinner-only pages

### Empty States (premium)
- One line of reassurance
- One suggested action (Ask Mira / Start a service)
- Optional 2–3 example prompts

---

## 4) Card System (The OS Design Language)

**You should have only 6 card types across the entire OS.**

### Alert Card (Today)
- urgency icon + short text
- CTA: "View guide" or "Start service"
- never more than 2 lines of copy

### Watchlist Ticket Card (Today / Services / Concierge)
- title, status chip, last update
- next action CTA appears only if "Awaiting you"

### Pick Card
- what it is + why it fits (1 line)
- CTA: "Make it happen"
- Secondary: "Ask Mira" (optional)

### Learn Content Card
- time badge (2 min / video)
- relevance badge ("For Lola")
- CTA: "Open"

### Option Card (Concierge / Services)
- Option A/B
- price, time, inclusions
- CTA: "Choose this"

### System Card (Recovery / Offline / Safety)
- calm header
- what happened
- what's happening next
- CTA: Retry / Ask Mira

**Rule: Don't invent new card styles per tab.**

---

## 5) Page-by-Page UI/UX Spec

### A) MOJO (identity)
**Goal:** "Update once, benefit everywhere."

**Mobile:**
- Pet snapshot top
- Sections: Health (non-diagnostic), Food, Behaviour, Grooming, Routine, Docs, Preferences
- Inline edit per section

**Desktop:**
- Two columns
- Right column: "This affects" (Services/Today/Learn)

**Key UX:**
- No giant edit forms
- Save confirmation toast

### B) TODAY (urgency dashboard)
**Order is fixed:**
1. Urgent stack (max 3)
2. Due soon
3. Watchlist (tickets in motion)
4. One smart nudge (Learn nudge, max 1)
5. Docs/compliance
6. Other pets (collapsed)

**Desktop:**
- Left: urgent + due soon
- Right: watchlist + docs

**Key UX:**
- Today must stay short, operational
- Every card has a next step

### C) PICKS (curation)
**Mobile:**
- One hero pick
- 6–10 total cards
- Each pick has one CTA: "Make it happen" → ticket

**Desktop:**
- 2–3 column grid
- Filter rail optional (city/date/budget)

**Key UX:**
- Picks should feel like "best next moves," not a catalogue

### D) SERVICES (execution)
**Mobile:**
- Launcher grid (8 + More)
- Awaiting you pinned
- Active requests grouped by status
- Orders shelf only if exists

**Desktop:**
- Left: status filters + list
- Right: ticket detail + timeline + actions

**Key UX:**
- "Next action required" must be visible without scroll
- Actions appear only when needed

### E) LEARN (confidence)
**Mobile:**
- Search
- Topic chips
- Shelves: Start here → 2-min guides → Watch & learn
- "For your pet" shelf at top when pet selected

**Desktop:**
- Left: topics
- Middle: list
- Right: reader + sticky action bar

**Key UX:**
- Every Learn item ends in action:
  - Let Mira do it
  - Ask Mira
  - Save

### F) CONCIERGE (judgment)
**Mobile:**
- Header: pet + live status
- Input: "Tell Mira what you need"
- Pinned "Awaiting you"
- Threads list

**Desktop:**
- Left: threads/filters
- Right: chat + ticket panel

**Key UX:**
- Options appear as cards, not paragraphs
- Recovery has a dedicated system card pattern
- Ask Mira never feels like a handoff to "support"

---

## 6) Mobile iOS/Android Hard Requirements

| Requirement | Value |
|-------------|-------|
| Input text | 16px on iOS Safari |
| Tap targets | 44px iOS / 48dp Android |
| Safe-area padding | For bottom bars |
| Hover affordances | None (tap-only) |
| Scroll performance | No heavy shadows or nested scroll traps |

---

## 7) The OS Cohesion Tests (Page-Level)

Every page must pass:
- [ ] Pet context visible and applied
- [ ] Canonical statuses used (where relevant)
- [ ] One primary action per card
- [ ] "Ask Mira" available where user may be stuck
- [ ] No dead ends (always a next step)
- [ ] Calm empty + error states

---

## 8) Implementation Checklist

### Copy-paste instruction to Emergent:
> Standardise page UI/UX across the Pet OS using one layout system (mobile list→detail, desktop two-pane where appropriate) and one shared card language (alert, watchlist ticket, pick, learn, option, system). Enforce fixed shelf ordering for Today, pinned Awaiting You in Services/Concierge, and canonical statuses everywhere. Every page must have one hero, one primary action per card, no dead ends, and calm empty/error states. Validate iOS/Android requirements (16px input, 44/48 tap targets, safe areas).

---

*Reference: Pet OS Page UI/UX Bible v1.0*
*Last Updated: February 14, 2026*

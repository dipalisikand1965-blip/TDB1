# CONCIERGE Bible v1.0

Mira OS is backed by trained, live human Concierge operators (Club Concierge / Les Concierges standard). Concierge is the execution backbone for pet parents for anything legal, moral, and non-medical, delivered through WhatsApp + Email and governed by the Unified Service Flow (one pipeline, one ticket, one timeline).

## 0) Golden Doctrine

**Pet First**
If there's a trade-off between convenience and the pet's safety/comfort/dignity, we choose the pet. Always.

**One OS, One Truth**
All work must be represented as a ticket with a truthful timeline. No silent actions.

## 1) What Concierge Is

**Concierge = Judgment + Execution + Accountability.**

- **Judgment:** interpret what the member really needs, recommend decisively
- **Execution:** coordinate vendors, logistics, guardians, deliveries, bookings
- **Accountability:** keep the member updated, close loops, capture learnings into MOJO/Soul

Concierge is not a "feature". It's the living service desk behind Mira.

## 2) What Concierge Is NOT

- Not medical diagnosis, prescriptions, dosage advice, or treatment decisions
- Not emergency triage beyond calm safe-first guidance ("seek vet help now")
- Not illegal/immoral requests
- Not surveillance/stalking/identity deception
- Not "here's a list, go do it" — we execute

**Allowed in medical-adjacent situations:** scheduling, transport, coordination, records, reminders, vendor liaison.
**Not allowed:** interpreting symptoms, recommending medication, replacing a vet.

## 3) Where Concierge Sits Inside Mira OS

Concierge is a door into the same house.

```
MOJO (identity) → TODAY (urgency) → PICKS (curation) → LEARN (confidence) → CONCIERGE (judgment) → SERVICES (execution)
```

All roads lead to the Unified Service Flow.

## 4) The Unified Service Flow (non-negotiable)

Everything must run through one pipe:

```
Intent (anywhere) → Request Draft → Ticket → Admin Service Desk → Updates → Outcome → MOJO/Soul grows
```

**Sources of intent:**
- Today cards
- Picks cards
- Learn "Ask Mira" or "Let Mira do it"
- Concierge chat (WhatsApp)
- Concierge email
- Direct Services launcher

**Single handoff object:**
- One ticket object (mira_tickets)
- One status taxonomy
- One timeline (member visible)

## 5) Channels: WhatsApp + Email

### WhatsApp (default)
Best for:
- rapid clarifications
- confirmations
- live updates
- photos/videos from user (pet, document, situation)

Rules:
- short messages
- one next step
- never ask 12 questions
- always end with what happens next + when

### Email (formal + longform)
Best for:
- detailed confirmations
- quotes / approvals
- policy language
- vendor documentation
- travel/boarding checklists
- multi-party coordination threads

Rules:
- subject line must include ticket ID + pet name
- bullet points, no walls of text
- summary at top, details below
- attachments referenced and logged into the ticket

### Cross-channel rule (critical)
WhatsApp and Email are just surfaces. The ticket is the truth.
Every meaningful message must be logged to the ticket timeline (automatically if possible).

## 6) Concierge Experience Model

**User sees Mira, not "a call centre."**

**Button language:**
- In Learn/Today/Services: "Ask Mira"
- In navigation: "Concierge"

**What "Ask Mira" does:**
Opens a concierge thread with context prefilled:
- pet_id
- source layer (learn/today/picks/services)
- item/today-card reference
- constraints from MOJO
- user's last intent

So the concierge never re-asks basics.

## 7) Concierge Intake (the 6-question discipline)

Concierge asks only what unblocks execution:

1. **Who** is it for? (pet / multi-pet)
2. **What** outcome do you want? (definition of success)
3. **When** (time window + urgency)
4. **Where** (location + pickup/drop preferences)
5. **Constraints** (from MOJO + any new ones)
6. **Budget** posture (value / standard / premium)

If member doesn't know: "Not sure, guide me" is always offered.

## 8) Concierge Modes

### A) Quick Handle
Simple coordination: grooming booking, walking setup, supplies, pet taxi.

### B) White-Glove Coordination
Multi-step: travel, parties, long boarding, relocation, multi-vendor planning.

### C) Recovery Mode
Fix failures: cancellations, delays, poor service complaints, refunds/credits, replacements.

### D) Safety Mode
Lost pet, potential hazard, aggression incident, ingestion concern: safe-first routing + coordination.

## 9) Ticketing Rules

Concierge is a WhatsApp + Email human layer behind Mira OS. All concierge work must run through the Unified Service Flow:

```
intent → ticket → admin service desk → updates → outcome → Soul/Mojo updates
```

"Ask Mira" opens concierge with full context; concierge turns ambiguity into structured tickets and uses canonical statuses only.

**No silent actions:** every meaningful admin move writes to the ticket timeline and triggers member notifications when relevant.

Concierge handles anything legal/moral/non-medical; medical is limited to scheduling/logistics/records and safe escalation.

---

## IMPLEMENTATION STATUS

### Phase 1 - Complete (Session 14, Feb 14, 2026)

#### Backend APIs
- `GET /api/os/concierge/status` - Live/offline indicator
- `GET /api/os/concierge/home` - Home screen data
- `POST /api/os/concierge/thread` - Create thread
- `GET /api/os/concierge/thread/{id}` - Thread detail
- `POST /api/os/concierge/message` - Send message

#### Frontend Components
- **ConciergeHomePanel.jsx** - Home screen with pet dropdown, status, input, chips, requests, threads
- **ConciergeThreadPanel.jsx** - Conversation view with bubbles, context drawer

#### Data Model
- `concierge_threads` collection
- `concierge_messages` collection

### Phase 2 - Future

- Admin Concierge Dashboard (respond to threads)
- WhatsApp Business API integration
- Email logging to ticket timeline
- Thread → Ticket auto-conversion rules
- Multi-step White-Glove coordination flows
- Recovery Mode workflows

# MIRA PET OS - Single Source of Truth (SSOT)

## Original Problem Statement
Building "Mira," a "pet operating system" centered on "Soul Intelligence." The goal is a high-touch, personalized experience where the AI concierge (Concierge®) proactively recommends products and services based on a pet's soul profile. All actions must generate service desk tickets ("Unified Service Command").

---

## Core Architecture

### Dual-Layer Architecture
1. **Pillar Pages (`/care`, `/dine`, `/fit`, `/celebrate`, etc.)**: A "freemium visual layer" where users can browse, and MiraChat guides them. Actions open FlowModals that create Concierge® tickets.
2. **Mira-Demo Page (`/mira-demo`)**: A "central intelligence layer" with a single conversational bar (the "OS2 Bar"). 6 tabs that sync with pillar actions.

### 6-Layer OS2 Architecture (mira-demo)
| Layer | ID | Purpose |
|-------|-----|---------|
| **MOJO** | `mojo` | Pet Identity - "Who is this pet?" |
| **TODAY** | `today` | Time Layer - "What needs attention now?" |
| **PICKS** | `picks` | Intelligence Layer - "What should I get?" |
| **SERVICES** | `services` | Action Layer - "What can I book/arrange?" |
| **LEARN** | `learn` | Knowledge Layer - "How do I understand this?" |
| **CONCIERGE** | `concierge` | Human Layer - "I need real help" |

---

## FLOWMODAL PATTERN (SSOT for All Pillars)

### Core Principle
**Every service card click → FlowModal → Ticket created → Concierge® thread → Member inbox + Admin service desk**

No direct booking. No pricing display. All requests go through Concierge®.

### FlowModal Structure
```
┌─────────────────────────────────────────┐
│ HEADER (gradient, progress bar)         │
│ - Badge with service icon               │
│ - Title: "{Service} for {PetName}"      │
│ - Subtitle: Mira-led description        │
│ - Progress: Step X of Y                 │
├─────────────────────────────────────────┤
│ PET CONTEXT STRIP                       │
│ - Pet photo + name + breed              │
│ - Breed intelligence tip (if available) │
│   "Mira knows: {breed-specific tip}"    │
├─────────────────────────────────────────┤
│ STEP CONTENT (scrollable)               │
│ - Question title                        │
│ - Field components (SingleSelect,       │
│   MultiSelect, Text, etc.)              │
├─────────────────────────────────────────┤
│ FOOTER (fixed)                          │
│ - Back button (if not first step)       │
│ - Continue / Send to Concierge® button  │
└─────────────────────────────────────────┘
```

---

## VERIFICATION STATUS (Feb 25, 2026)

### ✅ TICKET ROUTING - VERIFIED WORKING
- FlowModal tickets successfully create in database
- Member inbox shows tickets via `/api/tickets/my-tickets`
- Admin service desk shows tickets via `/api/tickets`
- Unified Service Command flow complete

### ✅ CARE PILLAR - 100% VERIFIED
| ID | Name | FlowModal | Status |
|----|------|-----------|--------|
| `grooming` | Grooming | GroomingFlowModal | ✅ Complete |
| `vet_clinic_booking` | Vet Visits | VetVisitFlowModal | ✅ Complete |
| `boarding_daycare` | Boarding & Daycare | CareFlowModal | ✅ Complete |
| `pet_sitting` | Pet Sitting | CareFlowModal | ✅ Complete |
| `emergency_help` | Emergency Help | CareFlowModal | ✅ Complete |
| `behavior_anxiety_support` | Behavior Support | CareFlowModal | 🔜 P1 |
| `senior_special_needs_support` | Senior & Special Needs | CareFlowModal | 🔜 P1 |
| `nutrition_consult_booking` | Nutrition Consults | CareFlowModal | 🔜 P1 |

### ✅ MIRA-DEMO OS BAR - FUNCTIONAL
- 6 OS Layers implemented and navigable
- PetOSNavigation component renders all tabs
- Layer navigation via useLayerNavigation hook
- Chat interface functional

---

## KEY FILES

### Care Pillar FlowModals
| File | Purpose |
|------|---------|
| `/app/frontend/src/components/GroomingFlowModal.jsx` | Custom 6-step grooming wizard with breed intelligence |
| `/app/frontend/src/components/VetVisitFlowModal.jsx` | Custom 5-step vet visit wizard |
| `/app/frontend/src/components/CareFlowModal.jsx` | Generic flow modal for any schema |
| `/app/frontend/src/schemas/groomingFlows.js` | Grooming schema + options + payload builder |
| `/app/frontend/src/schemas/vetVisitFlows.js` | Vet visit schema |
| `/app/frontend/src/schemas/boardingDaycareFlows.js` | Boarding schema |
| `/app/frontend/src/schemas/petSittingFlows.js` | Pet sitting schema |
| `/app/frontend/src/schemas/emergencyHelpFlows.js` | Emergency schema |

### Mira-Demo OS
| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/MiraDemoPage.jsx` | Main OS page with chat + 6-layer navigation |
| `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx` | **NEW** Single top bar header component |
| `/app/frontend/src/components/Mira/PetOSNavigation.jsx` | OS tab navigation component (legacy, replaced by unified header) |
| `/app/frontend/src/hooks/mira/useLayerNavigation.js` | Layer navigation hook |
| `/app/frontend/src/components/Mira/TodayPanel.jsx` | TODAY layer panel |
| `/app/frontend/src/components/Mira/ServicesPanel.jsx` | SERVICES layer panel |
| `/app/frontend/src/styles/mira-unified-header.css` | **NEW** Styles for unified header |

---

## MIRA OS SHELL ARCHITECTURE (Updated Feb 25, 2026)

### Single Top Bar Header Design
The mira-demo page now uses a unified single horizontal top bar design:

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [Mira Logo] [Pet+Soul Score] [TODAY][PICKS][SERVICES][LEARN][CONCIERGE®] [Weather][Profile] │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Components (left to right):**
1. **Mira Logo**: Pink sparkle icon + "Mira" + "Your Pet Companion"
2. **Pet Soul Badge**: Pet avatar with golden progress ring showing soul score %
3. **OS Tabs**: 3D perspective glass-morphism tabs (TODAY, PICKS, SERVICES, LEARN, CONCIERGE®)
4. **Weather**: Temperature display that opens TODAY panel
5. **Pet Profile**: Avatar with name for quick pet switching

**Key Features:**
- Single row layout (no multi-row stacking)
- 3D perspective effect on tabs
- Responsive design (collapses gracefully on mobile)
- Pet dropdown for multi-pet switching

---

## TICKET CREATION API

### Endpoint
`POST /api/tickets/`

### Payload Structure
```javascript
{
  member: {
    name: string,
    email: string,
    phone: string
  },
  category: string, // pillar name
  sub_category: string, // service name
  urgency: 'low' | 'medium' | 'high',
  description: string, // Markdown formatted
  source: 'flow_modal',
  source_reference: string, // entry point
  attachments: [],
  metadata: {
    ticket_type: string,
    pillar: string,
    sub_pillar: string,
    pet_id: string,
    pet_name: string,
    // ... service-specific data
  }
}
```

---

## PRIORITIZED BACKLOG

### P0 - COMPLETE ✅
- [x] FlowModal pattern for Care pillar
- [x] Ticket routing verification (member inbox + admin desk)
- [x] Mira-demo OS Bar structure
- [x] **Single Top Bar Header** - Unified header design implemented (Feb 25, 2026)

### P1 - Immediate
- [ ] Fix Picks and Learn tabs functionality (not returning correct content)
- [ ] Behavior Support FlowModal schema
- [ ] Senior & Special Needs FlowModal schema
- [ ] Nutrition Consults FlowModal schema
- [ ] Connect SERVICES panel to real ticket data

### P2 - Next (Apply FlowModal to Other Pillars)
- [ ] DINE pillar FlowModals (Fresh Meals, Treats, etc.)
- [ ] FIT pillar FlowModals (Dog Walking, Training, etc.)
- [ ] CELEBRATE pillar FlowModals (Birthday, Photography, etc.)

### P3 - Future
- [ ] TransformationStories backend connection
- [ ] Notification flow (Resend/Gupshup) - pending domain verification
- [ ] Razorpay payment integration
- [ ] Voice commands (ElevenLabs/OpenAI)
- [ ] Refactor backend server.py into modules

---

## TEST CREDENTIALS

| Role | Email/Username | Password |
|------|----------------|----------|
| Member | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## KEY TECHNICAL NOTES

1. **Trailing slash required**: API endpoint is `/api/tickets/` (with trailing slash)
2. **Token field**: Login returns `access_token`, not `token`
3. **Flexbox for modals**: Use `flex flex-col` and `flex-shrink-0` to keep footer visible
4. **data-testid pattern**: `option-{field_id}-{option_id}` for automated testing
5. **Breed intelligence**: Falls back to generic if breed not in database

---

*Last Updated: February 25, 2026*

---

## CHANGELOG

### Feb 25, 2026 - Single Top Bar Header Refactor
**Completed:**
- Created `MiraUnifiedHeader.jsx` - New unified single top bar component
- Created `mira-unified-header.css` - Dedicated styles for the header
- Updated `MiraDemoPage.jsx` to use the new unified header
- Removed multi-row header stacking (SoulKnowledgeTicker, separate header, PetOSNavigation)
- Implemented 3D perspective glass-morphism tabs
- Added responsive design for mobile/desktop

**Design Reference:**
- Left: Mira logo (pink icon) + text
- Center-left: Pet avatar with golden soul score badge (e.g., "64% SOUL")
- Center: OS tabs (TODAY, PICKS, SERVICES, LEARN, CONCIERGE®) with 3D perspective
- Right: Weather display + Pet profile avatar

**Files Changed:**
- `/app/frontend/src/components/Mira/MiraUnifiedHeader.jsx` (new)
- `/app/frontend/src/styles/mira-unified-header.css` (new)
- `/app/frontend/src/pages/MiraDemoPage.jsx` (modified)

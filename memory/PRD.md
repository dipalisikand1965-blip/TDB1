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
| `/app/frontend/src/components/Mira/PetOSNavigation.jsx` | OS tab navigation component |
| `/app/frontend/src/hooks/mira/useLayerNavigation.js` | Layer navigation hook |
| `/app/frontend/src/components/Mira/TodayPanel.jsx` | TODAY layer panel |
| `/app/frontend/src/components/Mira/ServicesPanel.jsx` | SERVICES layer panel |

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

### P1 - Immediate
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

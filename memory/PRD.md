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

### Success Screen Structure
```
┌─────────────────────────────────────────┐
│ ✓ Request Sent to Concierge®            │
│                                         │
│ Your {service} request for {PetName}    │
│ has been received.                      │
│                                         │
│ Our Concierge® team will review and     │
│ get back to you shortly.                │
│                                         │
│ [📥 Added to your Inbox]                │
│                                         │
│ [Open Request Thread]                   │
│ [Back to {Pillar}]                      │
└─────────────────────────────────────────┘
```

---

## HOW TO ADD A NEW SERVICE FLOW

### Step 1: Create Schema File
Location: `/app/frontend/src/schemas/{serviceName}Flows.js`

```javascript
// Template for new service flow schema
export const FIELD_TYPES = {
  SINGLE_SELECT: 'single_select',
  MULTI_SELECT: 'multi_select',
  TEXT: 'text',
  DATE: 'date',
  NUMBER: 'number'
};

export const SERVICE_OPTIONS = {
  // Define all options for each field
  serviceType: [
    { id: 'option1', label: 'Option 1', icon: '🎯', desc: 'Description' },
    { id: 'mira_recommend', label: 'Let Mira Recommend', icon: '✨' }
  ],
  // ... more option groups
};

export const SERVICE_FLOW_SCHEMA = {
  id: 'service-request',
  title: '{Service} for {petName}',
  subtitle: 'Mira will help arrange the best {service}',
  ticketType: 'SERVICE_REQUEST',
  steps: [
    {
      id: 'step1',
      title: 'Question for step 1?',
      subtitle: 'Optional subtitle',
      showIf: (data) => true, // Conditional step
      fields: [
        {
          id: 'field_name',
          type: FIELD_TYPES.SINGLE_SELECT,
          label: 'Field label',
          required: true,
          options: SERVICE_OPTIONS.serviceType,
          showIf: (data) => true // Conditional field
        }
      ]
    }
    // ... more steps
  ]
};

// Build ticket payload for API
export const buildServiceTicketPayload = (data, pet, user, entryPoint) => {
  return {
    member: {
      name: user?.name || user?.email?.split('@')[0] || 'Member',
      email: user?.email || '',
      phone: user?.phone || ''
    },
    category: 'pillar_name', // care, dine, fit, etc.
    sub_category: 'service_name',
    urgency: data.urgency === 'asap' ? 'high' : 'medium',
    description: `**{Service} Request for ${pet?.name}**\n\n...`,
    source: 'flow_modal',
    source_reference: entryPoint,
    metadata: {
      ticket_type: 'SERVICE_REQUEST',
      pillar: 'pillar_name',
      sub_pillar: 'service_name',
      pet_id: pet?.id || pet?._id,
      pet_name: pet?.name,
      // ... all form data
    }
  };
};

export default SERVICE_FLOW_SCHEMA;
```

### Step 2: Create or Use Generic FlowModal Component

**Option A: Use Generic CareFlowModal** (recommended for simple flows)
```jsx
import CareFlowModal from '../components/CareFlowModal';
import SERVICE_SCHEMA, { buildServiceTicketPayload } from '../schemas/serviceFlows';

<CareFlowModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  pet={selectedPet}
  user={user}
  token={token}
  schema={SERVICE_SCHEMA}
  buildPayload={buildServiceTicketPayload}
  entryPoint="pillar_page_grid"
  accentColor="teal" // teal, violet, blue, green, red
  headerGradient="from-teal-500 to-cyan-500"
  iconLabel="Service Name"
/>
```

**Option B: Create Custom FlowModal** (for complex flows with breed intelligence)
Copy `/app/frontend/src/components/GroomingFlowModal.jsx` as template.

### Step 3: Add to Pillar Page
```jsx
// In PillarPage.jsx
import CareFlowModal from '../components/CareFlowModal';
import SERVICE_SCHEMA, { buildServiceTicketPayload } from '../schemas/serviceFlows';

// Add state
const [showServiceModal, setShowServiceModal] = useState(false);

// Add to grid click handler
onClick={() => {
  if (type.id === 'service_name') {
    setShowServiceModal(true);
  }
}}

// Add modal component
<CareFlowModal
  isOpen={showServiceModal}
  onClose={() => setShowServiceModal(false)}
  // ... props
/>
```

---

## BREED INTELLIGENCE

### Location
`/app/frontend/src/utils/breedIntelligence.js`

### How to Use
```jsx
import { getBreedIntelligence, getBreedGroomingTip } from '../utils/breedIntelligence';

// Get full breed data
const breedData = getBreedIntelligence(pet.breed);
// Returns: { size, coat, groomingNotes, groomingRecommendations, temperamentFlags, sensitivityFlags }

// Get specific grooming tip
const tip = getBreedGroomingTip(pet.breed);
// Returns: "Regular brushing to prevent matting" (for Shih Tzu)
```

### Adding New Breeds
Add to `BREED_INTELLIGENCE` object in breedIntelligence.js:
```javascript
'new breed name': {
  size: 'small' | 'medium' | 'large',
  coat: 'short' | 'long' | 'double',
  groomingNotes: ['Tip 1', 'Tip 2'],
  groomingRecommendations: ['Rec 1', 'Rec 2'],
  vetNotes: ['Note 1'],
  temperamentFlags: ['gentle', 'friendly'],
  sensitivityFlags: ['heat_sensitive', 'ear_prone']
}
```

---

## CONCIERGE® BRANDING GUIDELINES

### Always Use
- **Concierge®** (with registered trademark symbol)
- "Request Sent to Concierge®"
- "Send to Concierge®" (button text)
- "Our Concierge® team will review..."
- "Added to your Inbox" (with inbox icon)

### Toast Notifications
```javascript
toast.success(`Request sent to Concierge® for ${petName}`, {
  description: 'Check your inbox for updates.'
});
```

### Medical Disclaimer (for vet-related flows)
"We do not provide medical advice. Mira coordinates clinic discovery and bookings."

---

## CARE PILLAR - COMPLETED FLOWS

### 8 Locked CARE Categories
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

### Care FlowModal Files
| File | Purpose |
|------|---------|
| `/app/frontend/src/components/GroomingFlowModal.jsx` | Custom 6-step grooming wizard with breed intelligence |
| `/app/frontend/src/components/VetVisitFlowModal.jsx` | Custom 5-step vet visit wizard |
| `/app/frontend/src/components/CareFlowModal.jsx` | Generic flow modal for any schema |
| `/app/frontend/src/schemas/groomingFlows.js` | Grooming schema + options + payload builder |
| `/app/frontend/src/schemas/vetVisitFlows.js` | Vet visit schema |
| `/app/frontend/src/schemas/boardingDaycareFlows.js` | Boarding schema |
| `/app/frontend/src/schemas/petSittingFlows.js` | Pet sitting schema |
| `/app/frontend/src/schemas/emergencyHelpFlows.js` | Emergency schema (3-step fast-track) |

### Care Page Integration
- File: `/app/frontend/src/pages/CarePage.jsx`
- Imports all FlowModals and schemas
- Grid click handler opens appropriate FlowModal based on `type.id`
- Subcategory tabs defined in `/app/frontend/src/components/PillarPageLayout.jsx`

---

## OTHER PILLARS - APPLY SAME PATTERN

### DINE Pillar (To Be Implemented)
Locked Categories:
- Fresh Meals
- Treats & Snacks
- Dining Out (Pet-Friendly Cafes)
- Special Diet Consults
- Autoship Management

### FIT Pillar (To Be Implemented)
Locked Categories:
- Dog Walking
- Training Sessions
- Fitness Programs
- Swimming
- Agility

### CELEBRATE Pillar (To Be Implemented)
Locked Categories:
- Birthday Party
- Gotcha Day
- Pet Photography
- Custom Celebrations

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

### Response
```javascript
{
  success: true,
  ticket: {
    ticket_id: "TKT-20260225-001",
    id: "objectid",
    // ... ticket data
  }
}
```

---

## FILES CREATED THIS SESSION

### New Files
- `/app/frontend/src/components/VetVisitFlowModal.jsx`
- `/app/frontend/src/components/CareFlowModal.jsx`
- `/app/frontend/src/schemas/vetVisitFlows.js`
- `/app/frontend/src/schemas/boardingDaycareFlows.js`
- `/app/frontend/src/schemas/petSittingFlows.js`
- `/app/frontend/src/schemas/emergencyHelpFlows.js`
- `/app/frontend/src/utils/breedIntelligence.js`

### Modified Files
- `/app/frontend/src/components/GroomingFlowModal.jsx` - Added breed intelligence, Concierge® branding
- `/app/frontend/src/components/MiraCarePlan.jsx` - Opens FlowModals
- `/app/frontend/src/pages/CarePage.jsx` - All FlowModal integrations
- `/app/frontend/src/components/PillarPageLayout.jsx` - 8 Care subcategory tabs

---

## PRIORITIZED BACKLOG

### P1 - Immediate (Care Pillar Completion)
- [ ] Behavior Support FlowModal (lighter 4-step)
- [ ] Senior & Special Needs FlowModal (lighter 4-step)
- [ ] Nutrition Consults FlowModal (lighter 4-step)

### P0 - Next (mira-demo Integration)
- [ ] Sync FlowModal submissions to CONCIERGE tab
- [ ] Sync MiraCarePlan recommendations to PICKS tab
- [ ] Show active requests in TODAY tab
- [ ] Implement the 6-layer OS2 bar flow

### P2 - Future
- [ ] Apply FlowModal pattern to DINE pillar
- [ ] Apply FlowModal pattern to FIT pillar
- [ ] Apply FlowModal pattern to CELEBRATE pillar
- [ ] TransformationStories backend connection
- [ ] Notification flow (Resend/Gupshup)

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

## NEXT AGENT INSTRUCTIONS

1. **Read this SSOT first** - Contains all patterns and guidelines
2. **P1 Priority**: Create remaining 3 Care FlowModals (Behavior, Senior, Nutrition) using CareFlowModal component
3. **P0 After P1**: mira-demo OS bar integration - user provided detailed spec in last message
4. **Always use Concierge®** with registered trademark
5. **Test with testing_agent** after implementation
6. **Update this SSOT** when adding new flows or patterns

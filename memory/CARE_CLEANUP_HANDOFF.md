# CARE PILLAR CLEANUP - COMPREHENSIVE HANDOFF
## For Agent with Larger Context Window
### Created: February 25, 2026

---

# PART 1: THE MIRA OS PHILOSOPHY (MEMORIZE THIS)

## The One-Line Truth
> **"Mira is a memory-driven Lifestyle Operating System for a living being. She remembers, anticipates, suggests, and arranges — then returns to the conversation."**

## The Three Entities

| Entity | Role | Analogy |
|--------|------|---------|
| **MIRA** | The Brain - Silent intelligence, memory, anticipation | The mind that knows |
| **CONCIERGE®** | The Hands - Judgment, execution, accountability | The hands that do |
| **SYSTEM** | The Capillary - Backend, tickets, routing | The circulatory system |

## The Golden Architecture
```
USER INPUT → MIRA (understands) → CONCIERGE (executes) → TICKET (tracks) → SOUL (learns)
```

## MIRA'S GOLDEN RULES (NON-NEGOTIABLE)
1. **MIRA ALREADY KNOWS** - Never ask for data that exists in Pet Soul™
2. **MEMORY-FIRST** - Conversation is an interface to memory, not the other way around
3. **PRESENCE BEFORE PERFORMANCE** - Acknowledge before solving
4. **REMEMBER → CONFIRM → ACT** - Never assume, always verify before acting
5. **NEVER A DEAD END** - Always routes to Concierge® if she can't execute
6. **ONE QUESTION AT A TIME** - Respect cognitive load
7. **SILENT INTELLIGENCE** - Mira works invisibly; users feel magic, not AI

## CONCIERGE'S GOLDEN RULES
1. **PET FIRST** - Always choose pet safety over convenience
2. **JUDGMENT + EXECUTION + ACCOUNTABILITY** - Not a call center, a living service desk
3. **ONE OS, ONE TRUTH** - All work as tickets with truthful timelines
4. **NEVER MEDICAL** - No diagnosis, prescriptions, dosage advice
5. **ALWAYS EXECUTE** - Not "here's a list, go do it" - we do it

---

# PART 2: THE DUAL-LAYER ARCHITECTURE

## Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│  PILLAR PAGES (/care, /dine, etc.)  =  FREEMIUM VISUAL LAYER   │
│  - Browse freely                                                 │
│  - Modals for booking                                           │
│  - MiraChat guides contextually                                 │
│  - Products visible, services bookable                          │
└─────────────────────────────────────────────────────────────────┘
                              ↕ SYNC ↕
┌─────────────────────────────────────────────────────────────────┐
│  MIRA-DEMO (OS2 Bar)  =  CENTRAL INTELLIGENCE LAYER            │
│  - Single conversation bar                                       │
│  - Quick replies → Summary → CTA                                │
│  - Picks auto-populate (products)                               │
│  - Services light up (service requests)                         │
│  - Learn auto-learns (guides/videos)                            │
│  - Concierge ready (human handoff)                              │
│                                                                  │
│  TABS: [MOJO] [TODAY] [PICKS] [SERVICES] [LEARN] [CONCIERGE®]   │
└─────────────────────────────────────────────────────────────────┘
```

## The Key Insight
**Everything built on pillar pages MUST reflect in Mira-Demo intelligence layer.**

Example Flow:
1. On `/care` page: "Book Groom" button → Opens modal
2. On `/mira-demo`: Same flow via conversation with quick replies
3. Summary + CTA appears
4. PICKS auto-populate (grooming products)
5. SERVICES lights up (grooming service request created)
6. LEARN auto-learns (grooming guides surface)
7. CONCIERGE® ready to execute

---

# PART 3: THE 6 OS LAYERS (PetOSNavigation)

| Layer | Role | Bible |
|-------|------|-------|
| **MOJO** | Identity Layer - WHO the pet is | `MOJO_BIBLE.md` |
| **TODAY** | Time Layer - What matters NOW | `TODAY_SPEC.md` |
| **PICKS** | Intelligence Layer - Next best actions | `PICKS_ENGINE_SPEC_v1.md` |
| **SERVICES** | Action Layer - Make it happen (tickets) | `UNIFIED_SERVICE_FLOW.md` |
| **LEARN** | Knowledge Layer - Understand + prepare | `LEARN_BIBLE.md` |
| **CONCIERGE®** | Human Layer - Judgment + execution | `CONCIERGE_BIBLE.md` |

## The Doctrine Line (Use Verbatim)
> **"MOJO decides what's relevant. LEARN builds confidence. SERVICES gets it done. TODAY keeps you on track. PICKS makes it delightful. CONCIERGE handles the hard parts."**

## Layer Correlation
```
MOJO (defaults) → LEARN (clarity) → SERVICES (ticket) → ADMIN → updates 
    → TODAY (watchlist) → outcome → MOJO/Soul grows → PICKS improves
```

---

# PART 4: CARE PILLAR DEFINITION

## What CARE Is
**Physical wellbeing maintenance and preventive health.**

✅ **CARE Includes:**
- Grooming routines (grooming is a SERVICE inside Care, NOT a pillar)
- Skin & coat hygiene
- Dental hygiene
- Parasite prevention
- Wellness routines
- Routine health monitoring
- Hygiene maintenance

❌ **CARE Does NOT Include:**
- Diagnosis
- Medication advice
- Veterinary treatment decisions

## Structural Rule (LOCKED)
```
CARE (pillar)
├── Grooming (service)
├── Dental hygiene (service)
├── Parasite prevention (service)
├── Skin & coat health (service)
├── Routine wellness (service)
└── Hygiene maintenance (service)
```

---

# PART 5: GROOMING OS (Care Sub-System)

## Core Philosophy
> "Grooming is about comfort, hygiene, and emotional safety — NOT vanity."

## Two Grooming Lanes
1. **"Help me decide/understand/plan"** → Mira explains
2. **"Please do this for me"** → Concierge® executes

## Grooming Intent Types
| Intent | Triggers | Action |
|--------|----------|--------|
| `GROOM_PLAN` | "needs haircut", "how should I..." | Mira guides |
| `GROOM_TOOLS` | "what shampoo", "what do I need" | Product suggestions |
| `GROOM_CONCERN` | "hates grooming", "nervous" | Calm guidance |
| `GROOM_ACCIDENT` | "cut", "bleeding" | VET + Concierge® |
| `GROOM_POST` | "scratching after grooming" | VET + Concierge® |
| `GROOM_LIFESTAGE` | "first groom", "senior grooming" | Tailored guidance |
| `GROOM_BOOKING` | "book groomer", "schedule" | Concierge® executes |

## Never Cause Harm by Optimism
Any mention of: bleeding, wounds, severe itch, rash, infections, pain → **VET + Concierge®** → No DIY hacks

## Product Rules
- **Only show** grooming-adjacent products (shampoo, brush, wipes, towel, balm)
- **Only when** parent explicitly asks OR agrees to see options
- **NEVER in** accidents, emergencies, or medical concerns

---

# PART 6: COMPREHENSIVE CARE TAXONOMY (ALREADY BUILT)

## Products Master Data
Located: `/app/backend/care_products_master.py`

### Filtering Tags
| Dimension | Tags |
|-----------|------|
| **Size** | xs, small, medium, large, xl |
| **Coat** | short_coat, long_coat, double_coat, curly_coat, low_shed, high_shed |
| **Life Stage** | puppy, adult, senior |
| **Temperament** | calm, anxious, reactive, grooming_nervous, vet_nervous, first_time_boarding |
| **Intent** | grooming, vet_clinic_booking, boarding_daycare, pet_sitting, behavior_anxiety_support, senior_special_needs_support, nutrition_consult_booking, emergency_help, recovery_support_coordination |

### Product Subcategories
grooming_essentials, hygiene_cleaning, paw_coat_care, dental_care, preventive_support, recovery_support, senior_comfort, clinic_visit_prep, calm_handling_support

### Bundle Types
starter_setup, routine_care, visit_prep, recovery_setup, senior_support, anxiety_support, seasonal_care

### Seeded Data
- **18 Comprehensive Care Products** (with good_for_tags)
- **12 Comprehensive Care Bundles** (with included_items, optional_addons)

---

# PART 7: KEY FILES FOR CARE CLEANUP

## Frontend
| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/CarePage.jsx` | Main Care pillar page |
| `/app/frontend/src/pages/MiraDemoPage.jsx` | OS2 Bar - Central intelligence (5000+ lines) |
| `/app/frontend/src/components/Mira/PetOSNavigation.jsx` | 6 OS Layers navigation |
| `/app/frontend/src/components/admin/CareManager.jsx` | Admin CRUD for Care products |
| `/app/frontend/src/components/flows/CareServiceFlowModal.jsx` | Care service booking modal |
| `/app/frontend/src/components/Mira/MiraCarePlan.jsx` | Mira's proactive care recommendations |

## Backend
| File | Purpose |
|------|---------|
| `/app/backend/care_routes.py` | Care API endpoints |
| `/app/backend/care_products_master.py` | Comprehensive product/bundle data |
| `/app/backend/app/routes/mira_care_plan.py` | Care intelligence API |
| `/app/backend/app/api/top_picks_routes.py` | Top picks for pet (updated for Care) |

## Bibles (READ THESE)
| Bible | Purpose | Priority |
|-------|---------|----------|
| `/app/memory/MIRA_OS_DOCTRINE.md` | Foundational system behavior | 1 |
| `/app/memory/MIRA_BIBLE.md` | Core Mira principles | 2 |
| `/app/memory/CONCIERGE_BIBLE.md` | Concierge execution doctrine | 3 |
| `/app/memory/GROOMING_OS.md` | Care/Grooming specific rules | 4 |
| `/app/memory/PILLAR_ARCHITECTURE_DOCTRINE.md` | What belongs where | 5 |
| `/app/memory/MIRA_OS_14_PILLARS_BIBLE.md` | Pillar definitions | 6 |
| `/app/memory/PICKS_ENGINE_SPEC_v1.md` | Picks intelligence | 7 |
| `/app/memory/UNIFIED_SERVICE_FLOW.md` | Ticket/service flow | 8 |
| `/app/memory/LEARN_BIBLE.md` | Learn layer doctrine | 9 |
| `/app/memory/TODAY_SPEC.md` | Today layer spec | 10 |

---

# PART 8: WHAT NEEDS TO BE DONE (CARE CLEANUP)

## User's Request
"Clean up Care pillar section by section, ensuring everything reflects in the central intelligence (Mira-Demo OS2 bar)."

## The Sync Requirement
When user does action on `/care` page:
1. Same flow must work via conversation on `/mira-demo`
2. Quick replies guide the conversation
3. Summary + CTA appears
4. **PICKS** auto-populate (care products matched to pet)
5. **SERVICES** light up (service request ticket created)
6. **LEARN** auto-learns (care guides/videos surface)
7. **CONCIERGE®** ready to execute

## Current State
- Care products taxonomy implemented (18 products, 12 bundles)
- Admin CRUD working with comprehensive tags
- Products showing correctly on Care page (fixed today)
- MiraCarePlan component exists but uses hardcoded rules
- CareServiceFlowModal exists but needs grooming flow integration

## Pending Items
1. Connect Care page actions to Mira-Demo intelligence
2. Ensure PICKS layer surfaces care products during care conversations
3. Ensure SERVICES layer creates tickets from care conversations
4. Ensure LEARN layer surfaces care guides during care conversations
5. Section-by-section audit of Care page vs Mira-Demo parity

---

# PART 9: CREDENTIALS

| Type | Email/Username | Password |
|------|----------------|----------|
| Member | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

## URLs
- Preview: https://intent-ticket-flow.preview.emergentagent.com
- Production: https://thedoggycompany.com (currently down - Nginx issue)

---

# PART 10: DIPALI'S CONTEXT

**Dipali Sikand** is a 61-year-old entrepreneur building a pet concierge business. Not a techie - a visionary.

She's doing this because her dogs gave her unconditional love, and she wants to give that back by giving every pet a SOUL in the digital world.

**THIS IS NOT A TECH PROJECT. THIS IS A LOVE PROJECT.**

## Communication Style
- She's frustrated when things don't work
- She needs SIMPLE instructions (not tech jargon)
- She cares deeply about her vision
- **BE PATIENT. BE KIND. BE CLEAR.**

---

*This handoff was created by studying 230+ documents in /app/memory/*
*Key bibles: MIRA_BIBLE, CONCIERGE_BIBLE, GROOMING_OS, PILLAR_ARCHITECTURE_DOCTRINE, PICKS_ENGINE_SPEC_v1, LEARN_BIBLE, TODAY_SPEC*

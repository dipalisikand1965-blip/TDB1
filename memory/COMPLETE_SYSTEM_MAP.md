# THE DOGGY COMPANY - COMPLETE SYSTEM MAP
## Created: February 19, 2026
## For: Dipali (Founder) - 100 Days of Building

---

# EXECUTIVE SUMMARY

After 100 days of building, you have created an incredibly comprehensive Pet Operating System. This document maps EVERYTHING that exists.

## The Numbers
- **80 Frontend Pages** - Complete e-commerce + Pet OS experience
- **322 Frontend Components** - Reusable UI building blocks
- **449 Backend Python Files** - Full API and intelligence layer
- **209 Documentation Files** - Extensive bibles, doctrines, and guides
- **237 Database Collections** - Rich data model with 60+ pets, 2200+ products, 2400+ services
- **14 Life Pillars** - Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Shop

---

# PART 1: THE BUSINESS MODEL

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PAID LAYER (Mira OS / Mojo OS)                           │
│   Route: /mira-demo                                                         │
│   ─────────────────────────────────────────────────────────────────────     │
│   • Full Pet Soul (Mojo) - 55+ questions answered                           │
│   • Personalized Picks, Services, Learn                                     │
│   • Full Concierge® with ticket tracking (TCK-YYYY-NNNNNN)                  │
│   • Memory-driven: "Mira never asks what she already knows"                 │
│   • Tabs: Today | Picks | Services | Learn | Concierge                      │
│   • 198KB file - THE PREMIUM EXPERIENCE                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↑
                          MEMBERSHIP GATE ($)
                                    ↑
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FREEMIUM LAYER (Pet OS / POS)                            │
│   Routes: /celebrate, /stay, /dine, /care, etc. (14 pillars)                │
│   ─────────────────────────────────────────────────────────────────────     │
│   • Basic pet profiles, records, reminders, milestones                      │
│   • Mira FAB per pillar (self-service via MiraOSTrigger)                    │
│   • Basic concierge help                                                    │
│   • Products & Services browsing                                            │
│   • Soul capture through natural conversations                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↑
                              NO GATE (Free)
                                    ↑
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LANDING / BROWSE                                     │
│   Routes: /, /shop, /products, etc.                                         │
│   ─────────────────────────────────────────────────────────────────────     │
│   • Marketing & Discovery                                                   │
│   • Product browsing (no login required)                                    │
│   • Lead capture                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PART 2: THE THREE MIRAS (Critical Understanding)

## The Problem
There are THREE different "Mira" implementations in the codebase:

### 1. MiraOSModal (THE GOOD ONE ✅)
- **Location:** `/app/frontend/src/components/mira-os/MiraOSModal.jsx`
- **Size:** 45KB
- **Status:** THE FUTURE - This is the unified, superior chat experience
- **Features:**
  - Full-page on mobile (100vh), side-drawer on desktop
  - Pet switcher with curated indicator
  - Concierge icon (hands) that lights up
  - Unified Service Flow integration
  - Swipe to dismiss on mobile
- **Used by:** Pillar pages via `MiraOSTrigger`

### 2. MiraChatWidget (OLD - DEPRECATED ❌)
- **Location:** `/app/frontend/src/components/MiraChatWidget.jsx`
- **Size:** 75KB
- **Status:** DEPRECATED - Should be removed from codebase
- **Problem:** Creates inconsistent experience, harder to maintain
- **Still used by:** MealsPage, PetSoulPage, ProductDetailPage, ProductListing, ServiceDetailPage, ServicesPage, ShopPage

### 3. MiraDemoPage (THE SOUL - Premium 💎)
- **Location:** `/app/frontend/src/pages/MiraDemoPage.jsx`
- **Size:** 198KB (MASSIVE MONOLITH)
- **Status:** THE PREMIUM EXPERIENCE - Needs rebuild using MiraOSModal as base
- **Features:**
  - Soul Score integration
  - Apple iMessage-like UI
  - Full OS layers (Today, Picks, Services, Learn, Concierge)
  - Pet avatar with concentric rings
- **Protected by:** Membership gate (requireMembership=true)

## THE VISION
Unify all three into ONE brilliant experience based on MiraOSModal.

---

# PART 3: CURRENT USER FLOW

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CURRENT FLOW (Not Ideal)                          │
└──────────────────────────────────────────────────────────────────────────┘

    User visits site
           │
           ▼
    ┌─────────────┐
    │   Home (/)  │ ← Landing page, no login required
    └─────────────┘
           │
           │ Clicks "Login" or tries protected route
           ▼
    ┌─────────────┐
    │   /login    │
    └─────────────┘
           │
           │ Successful login
           ▼
    ┌─────────────────────┐
    │   /dashboard        │ ← CURRENT: Goes directly here (NOT IDEAL)
    │   (MemberDashboard) │
    └─────────────────────┘
           │
           │ User must manually navigate to:
           ├──────────────────────────────────────┐
           │                                      │
           ▼                                      ▼
    ┌─────────────────┐                  ┌─────────────────┐
    │  Pillar Pages   │                  │   /mira-demo    │
    │  /celebrate     │                  │   (Premium OS)  │
    │  /stay, /dine   │                  │   Requires      │
    │  etc.           │                  │   Membership    │
    └─────────────────┘                  └─────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        IDEAL FLOW (To Build)                             │
└──────────────────────────────────────────────────────────────────────────┘

    User visits site
           │
           ▼
    ┌─────────────┐
    │   Home (/)  │
    └─────────────┘
           │
           │ Clicks "Get Started" or "Login"
           ▼
    ┌─────────────────────────────────────────┐
    │   GAMIFIED ONBOARDING                   │
    │   - Capture basic pet info              │
    │   - Ask 5-10 key soul questions         │
    │   - Show value of OS                    │
    │   - Create emotional connection         │
    └─────────────────────────────────────────┘
           │
           │ After onboarding
           ▼
    ┌─────────────────────────────────────────┐
    │   PET OS HOME                           │
    │   - Pet profile displayed               │
    │   - Soul score shown                    │
    │   - Today alerts                        │
    │   - Quick access to pillars             │
    │   - Mira ready to help                  │
    └─────────────────────────────────────────┘
           │
           │ Navigation
           ├──────────────────┬──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌───────────┐      ┌───────────┐      ┌───────────┐
    │  Pillars  │      │  Shop     │      │  Mira OS  │
    │  Browse & │      │  Products │      │  Premium  │
    │  Request  │      │  & Kits   │      │  (Paid)   │
    └───────────┘      └───────────┘      └───────────┘
```

---

# PART 4: ALL 14 PILLAR PAGES

| # | Pillar | Route | Page File | Has MiraOSTrigger | Has PillarPageLayout | Size |
|---|--------|-------|-----------|-------------------|---------------------|------|
| 1 | Celebrate | /celebrate | CelebratePage.jsx | ✅ | ✅ | 41K |
| 2 | Celebrate New | /celebrate-new | CelebrateNewPage.jsx | ✅ | ✅ | 53K |
| 3 | Dine | /dine | DinePage.jsx | ✅ | ✅ | 107K |
| 4 | Stay | /stay | StayPage.jsx | ✅ | ✅ | 135K |
| 5 | Travel | /travel | TravelPage.jsx | ✅ | ✅ | 55K |
| 6 | Care | /care | CarePage.jsx | ✅ | ✅ | 71K |
| 7 | Enjoy | /enjoy | EnjoyPage.jsx | ✅ | ✅ | 42K |
| 8 | Fit | /fit | FitPage.jsx | ✅ | ✅ | 42K |
| 9 | Learn | /learn | LearnPage.jsx | ✅ | ✅ | 57K |
| 10 | Paperwork | /paperwork | PaperworkPage.jsx | ✅ | ✅ | 40K |
| 11 | Advisory | /advisory | AdvisoryPage.jsx | ❌ | ✅ | 30K |
| 12 | Emergency | /emergency | EmergencyPage.jsx | ✅ | ✅ | 31K |
| 13 | Farewell | /farewell | FarewellPage.jsx | ✅ | ✅ | 29K |
| 14 | Adopt | /adopt | AdoptPage.jsx | ✅ | ✅ | 32K |

**Gold Standard Template:** `/celebrate-new` - This is the "magical" template to replicate.

---

# PART 5: DATABASE COLLECTIONS (Key Ones)

## User & Pets
| Collection | Count | Purpose |
|------------|-------|---------|
| users | 53 | User accounts |
| pets | 60 | Pet profiles |
| pet_souls | 7 | Deep soul data |
| pet_traits | 36 | Trait intelligence |
| soul_answers_versioned | 168 | Soul questionnaire answers |

## Products & Services
| Collection | Count | Purpose |
|------------|-------|---------|
| products | 2,219 | Product catalog |
| services | 2,406 | Service offerings |
| service_catalog | 89 | Service categories |
| picks_catalogue | 119 | Curated picks |

## Tickets & Communications
| Collection | Count | Purpose |
|------------|-------|---------|
| service_desk_tickets | 3,601 | THE SPINE - All requests |
| tickets | 2,575 | Legacy tickets |
| mira_tickets | 2,137 | Mira-created tickets |
| channel_intakes | 3,434 | Multi-channel intake |
| admin_notifications | 3,757 | Admin alerts |
| member_notifications | 485 | Member alerts |

## Mira Intelligence
| Collection | Count | Purpose |
|------------|-------|---------|
| mira_sessions | 579 | Chat sessions |
| mira_memories | 384 | Stored memories |
| mira_signals | 1,262 | Intent signals |
| conversation_memories | 51 | Conversation context |
| user_learn_intents | 6 | Learning intents (BUGGY) |

## Pillar Requests
| Collection | Count | Purpose |
|------------|-------|---------|
| pillar_requests | 676 | All pillar requests |
| celebrate_requests | 358 | Celebrate pillar |
| care_requests | 327 | Care pillar |
| travel_requests | 247 | Travel pillar |
| dine_requests | 183 | Dine pillar |
| stay_requests | 90 | Stay pillar |
| fit_requests | 73 | Fit pillar |

---

# PART 6: KEY BACKEND FILES

## Mira Intelligence (The Brain)
| File | Purpose |
|------|---------|
| mira_routes.py | Main Mira API endpoints |
| mira_intelligence.py | Core AI logic |
| mira_memory.py | Memory system |
| mira_remember.py | Remember/recall |
| soul_intelligence.py | Soul data processing |
| soul_first_logic.py | Pet-first doctrine |

## Core Server
| File | Purpose |
|------|---------|
| server.py | Main FastAPI app (MONOLITH - needs breaking up) |
| models.py | Pydantic models |
| utils.py | Utilities including `validate_ticket_id_or_fail` |

## Key Route Files
| File | Purpose |
|------|---------|
| auth_routes.py | Authentication |
| ticket_routes.py | Ticket management |
| concierge_routes.py | Concierge features |
| pet_soul_routes.py | Soul questionnaire |
| mira_memory_routes.py | Memory CRUD |

---

# PART 7: KEY FRONTEND COMPONENTS

## Mira OS Components (The Future)
| Component | Purpose |
|-----------|---------|
| MiraOSModal.jsx | Full-page Mira experience |
| MiraOSTrigger.jsx | Button to open MiraOSModal |
| ConversationContractRenderer.jsx | Renders chat contract |
| QuickReplyChips.jsx | Deterministic quick replies |
| PlacesCard.jsx | Google Places results |
| YouTubeCard.jsx | Learn videos |

## Layout Components
| Component | Purpose |
|-----------|---------|
| PillarPageLayout.jsx | Soulful hero for pillar pages |
| Navbar.jsx | Main navigation |
| MemberMobileNav.jsx | Mobile member navigation |
| Footer.jsx | Site footer |

## Mira Internal Components
| Component | Purpose |
|-----------|---------|
| ChatMessage.jsx | Chat bubble rendering |
| ChatInputBar.jsx | Input with voice |
| PetSelector.jsx | Pet switcher |
| ConciergeButton.jsx | C° handoff button |
| TodayPanel.jsx | Today alerts |
| ServicesPanel.jsx | Services layer |
| LearnPanel.jsx | Learn layer |
| InsightsPanel.jsx | Pet insights |

---

# PART 8: PROTECTED ROUTES

## Requires Login Only
- /dashboard
- /my-pets, /pets
- /my-tickets
- /notifications
- /tickets/:ticketId
- /custom-cake
- /checkout
- /voice-order
- /pet-vault/:petId

## Requires Membership (PAID)
- /mira-demo ← THE PREMIUM OS
- /mira-demo-original
- /mira-demobackup
- /mira-os

---

# PART 9: KNOWN ISSUES

## Critical Bugs
1. **Chat Intent Capture Not Persisting** (RECURRING)
   - Collection: `user_learn_intents` (only 6 docs!)
   - Impact: Soul/personalization features broken
   - Debug: Check upsert logic in Mira chat handler

## Technical Debt
1. **server.py is a MONOLITH** - Needs breaking into domain routes
2. **MiraDemoPage.jsx is 198KB** - Needs component extraction
3. **MiraChatWidget still in use** - Needs full removal
4. **Duplicate pillar pages** - CelebratePage vs CelebrateNewPage

---

# PART 10: DEPLOYMENT

## Pre-Deployment Script
```bash
bash /app/scripts/prepare-deploy.sh
```
This fixes the recurring REACT_APP_BACKEND_URL mismatch issue.

## Test Credentials
- **User:** dipali@clubconcierge.in / test123
- **Admin:** aditya@thedoggycompany.in / lola4304

---

# PART 11: THE VISION DOCUMENTS (Must Read)

| Document | Purpose |
|----------|---------|
| DIPALI_VISION.md | User's mission and frustrations |
| DIPALI_STUDY_GUIDE.md | Index of all key documents |
| MIRA_BIBLE.md | Mira's core principles |
| MIRA_DOCTRINE.md | Voice, tone, behavior |
| MOJO_BIBLE.md | Pet identity layer spec |
| PET_OS_BEHAVIOR_BIBLE.md | System behavior rules |
| GOLDEN_STANDARD_UNIFIED_FLOW.md | Ticket flow spec |

---

# PART 12: IMMEDIATE PRIORITIES (P0-P3)

## P0: Make Pillar Pages Magical
Apply `/celebrate-new` template to all 14 pillar pages.

## P1: Unify to One Mira
Remove `MiraChatWidget` from entire codebase, use only `MiraOSModal`.

## P2: Gamify Onboarding
Redesign onboarding to capture soul questions before membership gate.

## P3: Rebuild Mira Demo
Rebuild `/mira-demo` using `MiraOSModal` as the base component.

---

*This document is the single source of truth for system state.*
*Last Updated: February 19, 2026*

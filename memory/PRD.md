# The Doggy Company® - Product Requirements Document
## Pet Life Operating System

**Last Updated:** January 22, 2026

---

## THE DOCTRINE (Foundational Principles)

> **"The longer a pet lives with us, the less their parent has to explain."**

### Core Truths
1. **No member without a pet** - Membership requires at least one registered pet
2. **Pet Parent (Hooman)** is the account; **Pet Soul** is the intelligence
3. **Every system** must read/write Pet Soul
4. **Mira AI** must use Pet Soul context live
5. **Questions are progressive**, never repetitive
6. **Recognition > Recommendation**
7. **Silence is better than irrelevant messaging**

---

## Original Problem Statement
The Doggy Company® is building a "Pet Life Operating System" with 12 business "Pillars". The core vision includes a deep "Pet Soul™" profile for each pet, a "Unified Inbox," a mandatory "Membership" layer, and a central "Mira® AI" concierge.

---

## Registered Trademarks
- **The Doggy Company®**
- **The Doggy Bakery®** (thedoggybakery.com)
- **Les Concierges®** (lesconcierges.co.in) - Since 1998
- **Club Concierge®** (clubconcierge.in)
- **Mira®** - AI Concierge
- **Pet Soul™** - Pet profile technology

---

## What's Been Implemented

### ✅ Homepage (Vision-First Design)
- **Hero Section**: "A System That Learns, Remembers & Cares"
- **Proof Blocks**: 45,000+ pets | Since 2020 | Since 1998 | 30+ Years
- **Outcome Statements** (not feature tiles):
  - "We remember how your dog reacts at the groomer"
  - "We plan travel without making you repeat paperwork"
  - "We celebrate milestones without reminders"
  - "We suggest food they'll actually eat"
  - "We know which vet they trust"
  - "We anticipate before you ask"
- **Pet Soul™ Explainer**: Visual flow (Pet → Interactions → Memory → Better Care)
- **Meet Mira® Section**: Positioned as Intelligence Layer (Memory, Judgement, Relationship)
- **Privacy & Data Safety**: "Pet Soul Data is Sacred"
- **Concierge Lineage**: Links to Les Concierges®, Club Concierge®, The Doggy Bakery®
- **Footer with Mira Dedication**: Popup modal honoring Dipali's mother

### ✅ About Us Page
- **Mira's Story**: The soul behind everything (Dipali's mother)
- **Team**: Dipali (Les Concierges® & Club Concierge®), Aditya (The Doggy Bakery®)
- **Doctrine Quote**: "Care before convenience, memory before automation, relationships before transactions"
- **Pet Soul™ Section**: 8 pillars explained
- **All registered trademarks (®) properly displayed**

### ✅ Pet Life Pass (Membership)
- **Rebranded**: "Membership" → "Pet Life Pass"
- **Positioning**: "Founding Members" - Early invitation, not discount
- **Pricing**:
  - Annual: ₹4,999/year + GST (displayed FIRST with "FOUNDING MEMBER" badge)
  - Monthly: ₹499/month + GST
  - Additional pets: ₹2,499/year or ₹249/month + GST
- **Benefits**: All 12 pillars, Mira AI, Pet Soul, Health Vault, Priority Support

### ✅ Membership Onboarding (`/pet-soul`)
- Multi-step form capturing:
  - Pet Parent Name, Email, Phone
  - Communication preferences
  - Soul Whispers (WhatsApp drip) opt-in
  - Multiple pets support
  - Terms & Privacy acceptance
- Connected to `/api/membership/onboard` endpoint

### ✅ Admin Panel Features
- **Page Content Manager**: 
  - Covers ALL pages (Core, 12 Pillars, Legal, Other)
  - Hero section editor (badge, title, highlight, subtitle, CTAs)
  - Custom sections with markdown
  - SEO settings (meta title, description, keywords)
  - Draft/Publish toggle
  - Import/Export JSON
  - Seed All Defaults button
- **Pet Parent Directory**:
  - Search by name/email
  - Pet Soul view with 8-pillar breakdown
  - Circular progress score
  - View Full Soul button → opens `/pet-soul-journey/:petId`
  - Send Soul Whisper button
- **Product Manager**: CSV import/export, bulk edit

### ✅ Mira AI Concierge System
- GPT-5.1 integration via Emergent LLM Key
- Pet-first context loading
- Pillar intent detection (all 12 pillars)
- Never re-asks known information
- Soul enrichment from conversations
- Research mode for factual queries
- Context-aware quick prompts
- Voice input support
- Chat history & session management

### ✅ Pet Soul Intelligence
- 8 Pillars: Identity, Family, Rhythm, Home, Travel, Taste, Training, Long Horizon
- Progressive enrichment from:
  - Onboarding form
  - Mira conversations
  - Order completion (behavioral inference)
- Allergy-based product filtering
- Soul completeness scoring
- Weekly drip question selection

### ✅ Multi-Pet Household Features
- **Endpoints**:
  - `GET /api/household/{email}` - Household info & benefits
  - `POST /api/household/{email}/add-pet` - Add pet to family
  - `GET /api/household/{email}/recommendations` - Products safe for ALL pets
- **Benefits**:
  - 10% family discount (2+ pets)
  - Shared delivery
  - Bulk pricing (3+ pets)
  - Family events

### ✅ Commerce Features
- Product filtering by Pet Soul allergies
- Visual banner: "Filtered for [Pet]'s safety"
- Order-based soul enrichment
- Autoship management

### ✅ Bug Fixes (This Session)
- Voice Order: Fixed file read issue
- Checkout Form: Fixed async validation race condition
- View Full Soul button: Now handles both `id` and `_id`
- "Pet Parent Name" label on onboarding form

---

## API Endpoints Summary

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | User registration |
| `/api/auth/login` | POST | User login |
| `/api/auth/me` | GET | Current user info |

### Membership
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/membership/onboard` | POST | New member onboarding |
| `/api/membership/upgrade` | POST | Upgrade membership tier |

### Pets & Pet Soul
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/pets` | GET | List user's pets |
| `/api/pets/{pet_id}` | GET | Get pet details |
| `/api/pets/{pet_id}/soul` | GET | Get Pet Soul data |
| `/api/pet-gate/filter-products/{pet_id}` | GET | Filter products by allergies |
| `/api/soul-drip/next-question/{pet_id}` | GET | Get next soul question |

### Household
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/household/{email}` | GET | Household info & benefits |
| `/api/household/{email}/add-pet` | POST | Add pet to household |
| `/api/household/{email}/recommendations` | GET | Safe products for all pets |

### Mira AI
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mira/chat` | POST | Chat with Mira |
| `/api/mira/history` | GET | Chat history |
| `/api/mira/signal` | POST | Track browsing signals |

### Admin Pages
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/pages` | GET | List all pages |
| `/api/admin/pages/{slug}` | GET/PUT | Get/update page content |
| `/api/admin/pages/seed-all` | POST | Seed all default content |
| `/api/admin/pages/export` | GET | Export all pages as JSON |
| `/api/admin/pages/import` | POST | Import pages from JSON |

---

## File Structure

```
/app
├── backend/
│   ├── server.py              # Main FastAPI app
│   ├── mira_routes.py         # Mira AI endpoints
│   ├── mira_intelligence.py   # AI intelligence engine
│   ├── soul_intelligence.py   # Pet Soul engine
│   ├── pet_gate_routes.py     # Pet-first gating
│   ├── pet_soul_routes.py     # Soul management
│   ├── channel_intake.py      # Voice/text order intake
│   └── auth_routes.py         # Authentication
│
├── frontend/src/
│   ├── pages/
│   │   ├── Home.jsx           # Vision-first homepage
│   │   ├── AboutPage.jsx      # Mira's story + team
│   │   ├── MembershipPage.jsx # Pet Life Pass
│   │   ├── MembershipOnboarding.jsx # /pet-soul form
│   │   ├── PetSoulJourneyPage.jsx # Full soul view
│   │   ├── ProductListing.jsx # With allergy filtering
│   │   └── Checkout.jsx       # Fixed validation
│   │
│   ├── components/
│   │   ├── admin/
│   │   │   ├── PageContentManager.jsx # Full CMS
│   │   │   └── MemberDirectory.jsx    # Pet Parent Directory
│   │   ├── MiraAI.jsx         # Chat widget
│   │   ├── PetSoulJourney.jsx # Soul visualization
│   │   └── ui/                # Shadcn components
│   │
│   └── utils/
│       └── api.js             # API URL config
│
└── memory/
    ├── PRD.md                 # This file
    ├── TASK_LIST.md           # Task tracking
    └── DOCTRINE.md            # Core principles
```

---

## Remaining Tasks

### 🔴 Critical (Before Go-Live)
- [ ] Re-enable ProtectedRoute.jsx for auth gating
- [ ] Production Razorpay keys

### 🟡 Medium Priority
- [ ] WhatsApp Soul Drip (backend ready, needs WhatsApp Business API)
- [ ] Behavioral inference from returns
- [ ] Backend code cleanup (remove duplicate function definitions)

### 🔵 Backlog
- [ ] Full WhatsApp Business API integration
- [ ] Member analytics dashboard
- [ ] Standardize all 12 pillar admin managers

---

## Test Credentials

```
Admin: aditya / lola4304
Test User: dipali@clubconcierge.in / lola4304
Test Pets: Mojo (36% soul), Mystique (0%), Luna (61%)
```

---

## Technical Notes

### Razorpay
- Currently using TEST keys (not production)

### Meilisearch
- Not available in current environment (non-blocking warning)

### MongoDB Collections
- `users` - User accounts
- `pets` - Pet profiles with `doggy_soul_answers`
- `orders` - Order history
- `page_content` - CMS content
- `products` - Product catalog
- `service_desk_tickets` - Mira-created tickets

---

*This document is automatically updated by the development agent.*

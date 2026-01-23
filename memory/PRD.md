# The Doggy Company® - Product Requirements Document
## Pet Life Operating System

**Last Updated:** January 23, 2026 (Session 14 - Backend Refactoring Phase 3: Admin Members, Household, Reviews Extracted)

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
The Doggy Company® is building a "Pet Life Operating System" with **14 business "Pillars"**:
1. Celebrate, 2. Dine, 3. Stay, 4. Travel, 5. Care, 6. Enjoy, 7. Fit, 8. Learn, 9. Paperwork, 10. Advisory, 11. Emergency, 12. Farewell, 13. Adopt, 14. Shop

The core vision includes a deep "Pet Soul™" profile for each pet, a "Unified Inbox," a mandatory "Membership" layer, and a central "Mira® AI" concierge.

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
- **Communications Manager** (NEW):
  - Integration status cards (Email ✅, WhatsApp provisional, In-App ✅)
  - Analytics dashboard (Total Sent, Last 7 Days, Templates count, Pending)
  - **Template Management**: Create, Edit, Delete custom templates
  - **Schedule Send**: Choose template, date/time, recipients (all or selected pets)
  - Templates view with preview modal
  - History view with sent/scheduled status
  - Pending reminders view with "Send Now" button
  - Send Test Email functionality
  - Intelligence rules display (1 msg/week limit, quiet hours)

### ✅ Mira AI Concierge System (UPDATED Jan 22, 2026)
**"Mira is the CONCIERGE, not an advisor."**

- GPT-5.1 integration via Emergent LLM Key
- **Pet-first context loading** - Correctly fetches pets via member → pet ID lookup
- **Multi-pet household support** - Asks which pet when user has multiple
- **Personalized responses** - Uses pet name, breed, personality, preferences in EVERY response
- **Allergy-safe recommendations** - Always checks allergies before suggesting food products
- Pillar intent detection (all 12 pillars)
- Never re-asks known information (flavors, textures, allergies already in Pet Soul)
- Soul enrichment from conversations
- Research mode for factual queries (used as context, not shared raw)
- Context-aware quick prompts
- Voice input support
- Chat history & session management

### ✅ Concierge Action Auto-Ticketing (NEW - Jan 22, 2026)
**Mira NEVER tells member to call/verify/check anything themselves.**

**Auto-Detection Triggers:**
- **Dining**: restaurant, cafe, lunch, dinner, reservation, pet-friendly restaurant
- **Stay**: hotel, accommodation, resort, pawcation, book a room
- **Travel**: trip, flight, train, cab, transport, pet relocation
- **Care**: vet, grooming, appointment, vaccination, checkup
- **Verification**: "is it pet-friendly", "do they allow pets", "can I bring my dog"

**Auto-Created Tickets:**
- Service Desk Ticket (e.g., `DIN-20260122-0001`)
- Routed to Unified Inbox
- Visible in Mira AI Admin folder
- Tagged with: action_type, priority, pillar, pet_count

**Member Experience:**
- Mira says: "I'll take care of this for you. I'm checking [specific details]. Our live concierge will confirm shortly."
- Member NEVER instructed to call, message, or verify anything themselves

**Priority by Request Type:**
- HIGH: health, travel, emergency
- MEDIUM: dining, stay, verification
- LOW: general inquiry

### ✅ Mira Relationship Memory System (NEW - Jan 22, 2026)
**"Store forever. Surface selectively."** — This is relationship memory, not session memory.

**Memory Types:**
- 🗓️ **Events & Milestones** - Birthdays, trips, adoption days (identity-level, resurface when relevant)
- 🏥 **Health & Medical** - Symptoms, conditions, vet visits (longitudinal, never auto-delete)
- 🛒 **Shopping & Preferences** - Product interests, brand preferences (weighted by recency)
- 💬 **Life Context** - Living situation, lifestyle changes (surface only if relevant)

**Surfacing Rules:**
- Memories are NEVER auto-deleted (unless manually cleared)
- Old preferences don't disappear, they just get lower priority
- Critical memories can be flagged to always surface
- Concierge can suppress specific memories from auto-recall

**Admin Controls:**
- View all memories by type for any member
- Add concierge notes as memories
- Flag memories as critical
- Suppress/unsuppress auto-recall
- Delete (soft delete) memories

**Pet Parent Controls:**
- View their own memory categories
- Edit/correct memories
- Clear specific items

**API Endpoints:**
- `GET /api/mira/memory/me` - Pet parent's own memories
- `POST /api/mira/memory/me` - Add memory manually
- `GET /api/mira/memory/admin/member/{email}` - Admin view of member memories
- `PUT /api/mira/memory/admin/{id}/flag-critical` - Flag as critical
- `PUT /api/mira/memory/admin/{id}/suppress` - Suppress from recall
- `GET /api/mira/memory/stats` - Overall memory statistics

### ✅ Family Dashboard (NEW - Jan 22, 2026)
**"This is how a pet parent thinks"** — A household dashboard, not a list.

**Features:**
- **Family Header**: Shows all pets count + family discount badge when applicable
- **Health Alerts**: Overdue vaccines highlighted with "Schedule Now" action
- **Upcoming Moments**: 
  - Birthdays (next 30 days)
  - Gotcha Days (next 30 days)
  - Vaccine Due Dates (next 14 days)
- **Pet Cards** with:
  - Photo (or placeholder)
  - Persona badge (e.g., "mischief maker", "royal")
  - Breed info
  - Pet Soul™ completeness progress bar
  - Birthday display
- **Family Actions** (Bulk actions with intelligence):
  - Book Grooming (for all pets)
  - Order Treats (respects individual allergies)
  - Vet Checkup (group booking)
  - Set Reminders (sync schedules)
- **Memory Timeline** - Shows family journey with relationship memories

**View Modes:**
- **Family Dashboard** - Default view, household-centric
- **Detailed View** - Individual pet cards with full inline editing

### ✅ Automated Reminders Admin UI (NEW - Jan 22, 2026)
**Admin Panel to manage automated health and celebration reminders**

**Features:**
- **Stats Dashboard**: Pending, Total Sent, Last 7 Days, Scheduler Status
- **Overview Tab**: Reminder types (Vaccination, Grooming, Birthday, Health Checkup)
- **Pending Tab**: Queue of reminders with "Send Now" action
- **History Tab**: Recent communications sent
- **Intelligence Rules Display**:
  - Max 1 message/week per pet
  - Quiet Hours (9 PM - 8 AM IST)
  - Health reminders priority over promotional
- **Manual Trigger**: "Run Scheduler Now" button

### ✅ Concierge Command Center (NEW - Jan 23, 2026)
**"Everything opens into it, nothing pulls you away from it."** — The concierge's unified workstation.

**Features:**
- **Unified Queue**: Aggregates actionable items from ALL sources:
  - Mira AI Action Requests (service_desk_tickets)
  - Service Desk Tickets
  - Orders (pending fulfillment)
  - Unified Inbox (unread messages)
  - Health Alerts (overdue vaccines)
  - Upcoming Birthdays (next 3 days)
  
- **Priority System**:
  - Real-time priority scoring based on type, age, member tier, escalation status
  - Four buckets: Urgent (🔴), High (🟠), Medium (🟡), Low (🟢)
  - SLA breach detection and warnings
  
- **Attention Strip** (Top banner):
  - SLA breaching count (clickable filter)
  - High priority unclaimed count
  - Health alerts overdue
  - Upcoming birthdays
  
- **Smart Filters**:
  - Source filter (Mira, Orders, Inbox, Health, Birthdays, Service Desk)
  - Priority bucket filter
  - Search by ticket ID, member name, email, or request content
  - "Clear" button to reset all filters
  
- **Slide-in Detail Panel** (4 vertical zones per spec):
  1. **Member & Pet Snapshot**: Name, tier, contact info, all pets with allergies highlighted
  2. **The Request**: Original request text with timestamp
  3. **Mira's Intelligence**: Past orders, memories, Pet Soul insights, AI draft generation
  4. **Actions Panel**: Claim/unclaim, escalate, resolve with send options
  
- **Actions Available**:
  - **Claim**: Agent takes ownership
  - **Unclaim**: Release back to queue
  - **Escalate**: Flag as high priority with reason
  - **Add Note**: Internal or member-facing notes
  - **Resolve**: Close with resolution notes, send via Mira thread or Email
  - **Generate AI Draft**: Uses member history to auto-draft response
  
- **State Preservation**: 
  - Scroll position saved when viewing item
  - Filters persist when navigating back

**API Endpoints:**
- `GET /api/concierge/queue` - Unified priority queue with filters
- `GET /api/concierge/item/{ticket_id}` - Full detail with Mira intelligence
- `POST /api/concierge/item/{ticket_id}/claim` - Claim item
- `POST /api/concierge/item/{ticket_id}/unclaim` - Release item
- `POST /api/concierge/item/{ticket_id}/resolve` - Resolve and notify
- `POST /api/concierge/item/{ticket_id}/escalate` - Escalate priority
- `POST /api/concierge/item/{ticket_id}/add-note` - Add concierge notes
- `POST /api/concierge/item/{ticket_id}/generate-draft` - AI draft generation

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
- Email domain: Updated from thedoggybakery.in to thedoggycompany.in across codebase

### ✅ Command Center Phase 2 (NEW - Jan 23, 2026)
**SLA Timers, Auto-Assignment, Reporting, Omni-Channel Replies**

**SLA System:**
- Real-time countdown timers (⏱️ HH:MM:SS format)
- SLA times: Urgent=2h, High=4h, Medium=24h, Low=48h
- Visual alerts: Red for breached, Orange for warning (<1h)
- `/api/concierge/sla-status/{ticket_id}` - Get SLA status for ticket
- `/api/concierge/sla-breaches` - Get all breached/warning tickets

**Auto-Assignment:**
- Load-balanced assignment (assigns to agent with least active tickets)
- `/api/concierge/agents` - List agents with workload
- `/api/concierge/auto-assign/{ticket_id}` - Auto-assign single ticket
- `/api/concierge/bulk-auto-assign` - Auto-assign multiple unassigned tickets

**Reporting:**
- `/api/concierge/reports/overview` - Dashboard stats (total, open, SLA breaches, agent performance)
- `/api/concierge/reports/daily` - 7-day ticket history (created vs resolved)

**Omni-Channel Replies:**
- `/api/concierge/reply/email` - Send via Resend (woof@thedoggycompany.in)
- `/api/concierge/reply/whatsapp` - Generate WhatsApp click-to-chat link
- UI: 4 send options (Mira Thread, Email, WhatsApp, Resolve Only)

### ✅ Pet Health Information Collection (NEW - Jan 23, 2026)
**"Know your pet's health needs from day one."** — Health data integrated into Pet Soul.

**Implementation:**
- **New Health Step in Pet Registration** (Step 3 of 7):
  - Added between Lifestyle (Step 2) and Soul Persona (Step 4)
  - All 12 health fields are OPTIONAL
  - Secure messaging: "Your pet's health data is secure"
  
- **Health Information Fields:**
  1. Primary Veterinarian (name, clinic, phone)
  2. Medical Conditions (chronic issues, surgeries)
  3. Current Medications (with dosage/frequency)
  4. Dietary Restrictions (beyond allergies)
  5. Spayed/Neutered status (Yes/No/Not Sure)
  6. Microchipped status (checkbox + number)
  7. Insurance Provider
  8. Emergency Contact (name + phone)

- **Backend Model (`PetHealthInfo` in models.py):**
  - All fields Optional with sensible defaults
  - Integrated into `PetProfileCreate` and `PetProfileUpdate`
  - Stored in MongoDB `pets` collection

- **API Endpoints Updated:**
  - `POST /api/pets` - Accepts health data (authenticated)
  - `POST /api/pets/public` - Accepts health data (public)
  - `GET /api/pets/{pet_id}` - Returns health data
  - `GET /api/pets` - Returns pets with health data

- **My Pets Health Profile Display:**
  - New "Health Profile" section in Health Vault expandable area
  - Shows: Primary Vet, Medical Conditions, Medications, Dietary Restrictions
  - Shows: Spayed/Neutered, Microchipped status, Insurance, Emergency Contact
  - Only displays fields that have data

- **Files Modified:**
  - `models.py` - Added `PetHealthInfo` class, updated `PetProfileCreate/Update`
  - `server.py` - Fixed duplicate model import from user_routes.py
  - `user_routes.py` - Now imports from models.py (removed duplicate classes)
  - `PetProfile.jsx` - Added `renderStepHealth()`, updated navigation
  - `MyPets.jsx` - Added Health Profile display in Health Vault section

### ✅ Pet Soul Page 14 Pillars (VERIFIED - Jan 23, 2026)
**All 14 official pillars displayed correctly:**
1. Celebrate - Birthday parties, special occasions
2. Dine - Pet-friendly restaurants, special menus
3. Stay - Boarding, daycare, pet hotels
4. Travel - Pet relocation, documentation
5. Care - Veterinary care, grooming, health
6. Enjoy - Toys, accessories, enrichment
7. Fit - Exercise programs, swimming
8. Learn - Training, behavior modification
9. Paperwork - Registration, licenses
10. Advisory - Legal advice, insurance
11. Emergency - 24/7 emergency care
12. Farewell - End-of-life care, memorials
13. Adopt - Adoption, foster, rescue
14. Shop - Pet supplies, food, treats

**Note:** "Community" is a future feature, NOT a pillar.

### ✅ Self-Service Portal (NEW - Jan 23, 2026)
**Member-facing ticket tracker at `/my-tickets`**

**Features:**
- View all open and resolved tickets
- Stats dashboard (Total, Open, Resolved counts)
- Ticket detail with conversation timeline
- Add replies to open tickets
- Status badges (Open, In Progress, Resolved, Closed)
- New Reply indicator

**API Endpoints:**
- `GET /api/concierge/member/tickets?email=` - Get member's tickets
- `GET /api/concierge/member/ticket/{id}?email=` - Get ticket detail (ownership verified)
- `POST /api/concierge/member/ticket/{id}/reply?email=` - Add member reply

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
| `/api/pets` | GET | List user's pets (includes health data) |
| `/api/pets` | POST | Create pet with health info (authenticated) |
| `/api/pets/public` | POST | Create pet with health info (public) |
| `/api/pets/{pet_id}` | GET | Get pet details (includes health data) |
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
│   ├── communication_engine.py # NEW: Unified Reminder System engine
│   ├── communication_routes.py # NEW: Communication API endpoints
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
│   │   │   ├── MemberDirectory.jsx    # Pet Parent Directory
│   │   │   └── AgentManagement.jsx    # Agent portal management (fixed modal)
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

## Unified Reminder & Mailing System (NEW)

### Overview
A memory-driven communication system that:
- Remembers each pet via Pet Soul™
- Decides when to speak (max 1 message/week per pet)
- Chooses the right channel (Email via Resend, WhatsApp provisional)
- Knows when to stay silent

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/communications/templates` | GET | All communication templates |
| `/api/admin/communications/templates/defaults` | GET | Default system templates |
| `/api/admin/communications/templates` | POST | Create custom template |
| `/api/admin/communications/analytics` | GET | Communication analytics |
| `/api/admin/communications/pending` | GET | Pending reminders |
| `/api/admin/communications/send` | POST | Send/schedule communication |
| `/api/admin/communications/soul-questions` | GET | Soul enrichment questions |
| `/api/admin/communications/history` | GET | Communication history |
| `/api/admin/communications/config-status` | GET | Integration status |
| `/api/admin/communications/test-email` | POST | Send test email |

### Default Templates (9)
- `vaccination_upcoming` - 7 days before due
- `vaccination_overdue` - 3 days after due
- `birthday_nudge` - 5 days before birthday
- `adoption_day_nudge` - 5 days before gotcha day
- `grooming_reminder` - Based on coat type
- `weekly_soul_question` - Progressive soul enrichment
- `relationship_checkin` - 30-45 days inactivity
- `travel_advisory` - Contextual travel tips
- `celebration_followup` - Post-event follow-up

### Channel Status
- **Email**: ✅ Configured (Resend API, sender: woof@thedoggycompany.in)
- **WhatsApp**: 🟡 PROVISIONAL (click-to-chat links until Business API integrated)
- **In-App**: ✅ Ready

---

## Remaining Tasks

### 🔴 Critical (Before Go-Live)
- [ ] Re-enable ProtectedRoute.jsx for auth gating
- [ ] Production Razorpay keys

### 🟡 Medium Priority
- [ ] WhatsApp Business API integration (currently provisional with click-to-chat links)
- [ ] Member analytics dashboard
- [ ] Export health records as PDF
- [x] ~~Backend code cleanup (remove duplicate function definitions in server.py)~~ **IN PROGRESS** - Refactoring active

### 🔵 Backlog
- [ ] Multi-pet household advanced features
- [ ] Standardize all 12 pillar admin managers
- [ ] Birthday email automation (scheduler integration)
- [ ] Custom template creation UI in Communications Manager
- [ ] Build Farewell & Adopt Pillar Pages

---

## Backend Refactoring Progress (January 2026)

### Overview
Major refactoring effort to break down the monolithic `server.py` into modular route files.

### Completed Extractions
| Module | File | Lines | Status |
|--------|------|-------|--------|
| FAQ Routes | `faq_routes.py` | ~150 | ✅ Done |
| Content Routes (Blog/Testimonials) | `content_routes.py` | ~200 | ✅ Done |
| Loyalty Routes (Paw Rewards) | `loyalty_routes.py` | 249 | ✅ Done |
| Discount Routes | `discount_routes.py` | 204 | ✅ Done |
| Abandoned Cart Routes | `cart_routes.py` | 676 | ✅ Done |
| Shopify Sync Routes | `shopify_sync_routes.py` | 627 | ✅ Done |
| **Orders API** | `orders_routes.py` | ~230 | ✅ Done (Jan 23, 2026) |
| **Autoship System** | `autoship_routes.py` | ~330 | ✅ Done (Jan 23, 2026) |

### Current server.py Status
- **Before refactoring (initial)**: 11,569 lines
- **Before this session**: 9,376 lines
- **Current**: 8,914 lines
- **Total reduction**: ~2,655 lines (~23%)

### Extracted Modules (Phase 1-3)
| Module | File | Lines | Status |
|--------|------|-------|--------|
| FAQ Routes | `faq_routes.py` | 106 | ✅ Verified |
| Content Routes | `content_routes.py` | 206 | ✅ Verified |
| Loyalty Routes | `loyalty_routes.py` | 249 | ✅ Verified |
| Discount Routes | `discount_routes.py` | 204 | ✅ Verified |
| Cart Routes | `cart_routes.py` | 676 | ✅ Verified |
| Shopify Sync | `shopify_sync_routes.py` | 626 | ✅ Verified |
| Orders Routes | `orders_routes.py` | 268 | ✅ Verified |
| Autoship Routes | `autoship_routes.py` | 407 | ✅ Verified |
| Admin Members | `admin_member_routes.py` | 244 | ✅ Verified (Jan 23) |
| Household Routes | `household_routes.py` | 208 | ✅ Verified (Jan 23) |
| Review Routes | `review_routes.py` | 308 | ✅ Verified (Jan 23) |

### Remaining Candidates for Extraction
- [ ] Product Management routes
- [ ] Email/notification routes
- [ ] Settings routes

---

## Bug Fixes (This Session)
- ✅ **Agent Form Modal**: Fixed modal overflow issue
- ✅ **Pet Profile Modal**: Added "View Full Soul" and "Health Vault" buttons
- ✅ **Travel Navigation**: Removed from public navbar (members-only)

---

## My Pets Page Enhancements (NEW)
### Overview
Completely redesigned pet profile cards with inline editing and expanded health/soul sections.

### Features
- **Pet Card Header**: Photo, name, breed, species, gender, persona badge
- **Editable Fields**: Name, breed, species, gender, birthday, gotcha day - all inline editable
- **Health Vault Expansion**: Shows vaccines (with due soon/overdue badges) and active medications
- **Pet Soul Answers Expansion**: Shows soul progress bar and individual Q&A responses
- **Action Buttons**: Edit (pencil), Delete (trash), Cancel (X), Save (✓)

### UI Components
- Expandable accordion sections for Health Vault and Pet Soul
- Color-coded badges (orange for due soon, red for overdue, green for vaccines, purple for medications)
- Progress bar for soul completion percentage
- Date pickers for birthday and gotcha day

---

## Health Vault Feature (NEW)
### Overview
Comprehensive pet health management in Admin Panel:
- **Vaccines**: Track vaccinations with due date reminders
- **Medications**: Manage active and past medications
- **Vet Visits**: Record visit history with diagnosis/treatment
- **Weight History**: Monitor pet weight over time

### Frontend Components (Admin.jsx)
- Health Vault modal accessible from Pet Profile
- Tabbed interface with record counts
- Add Vaccine and Add Medication forms
- Color-coded due date badges (blue=upcoming, red=overdue)

### API Endpoints (pet_vault_routes.py)
- `GET/POST /api/pet-vault/{pet_id}/vaccines`
- `GET/POST /api/pet-vault/{pet_id}/medications`
- `GET /api/pet-vault/{pet_id}/visits`
- `GET/POST /api/pet-vault/{pet_id}/weight`
- `GET /api/pet-vault/{pet_id}/summary`

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
- `pets` - Pet profiles with `doggy_soul_answers` and `pet_pass_number`
- `orders` - Order history
- `page_content` - CMS content
- `products` - Product catalog
- `service_desk_tickets` - Mira-created tickets
- `tickets` - Manual tickets
- `mira_memories` - AI memory storage
- `paw_rewards_earned` - Loyalty points
- `enhanced_collections` - Campaign collections
- `faqs` - Help center content

---

## 📚 Documentation

### Admin Panel Guide
A comprehensive "Dummy's Guide" for every admin feature is available at:
**`/app/memory/ADMIN_GUIDE.md`**

This guide includes:
- What each tab contains
- Purpose and data sources
- Rules and business logic
- What can be done
- How to modify

---

## 🛍️ Universal Pillar-Aware Product Experience (NEW - Jan 23, 2026)

### Overview
All pillar pages now use a unified `ProductCard` component that provides a consistent, pillar-aware shopping experience with dynamic cross-sell titles.

### Implementation
- **`ProductCard.jsx`** - Centralized component accepting a `pillar` prop
- **Dynamic Cross-Sell Titles** - Each pillar shows contextual upsell messaging:
  - `celebrate` → "Complete the Celebration!"
  - `dine` → "Complete the Dining Experience!"
  - `stay` → "Complete the Stay!"
  - `travel` → "Complete the Trip!"
  - `care` → "Complete the Care Package!"
  - `shop` → "Complete Your Order!"
  - `enjoy` → "Add More Fun!"
  - `fit` → "Complete the Fitness Pack!"
  - `learn` → "Enhance the Learning!"
  - `adopt` → "Welcome Home Essentials!"
  - `insure` → "Add More Coverage!"
  - `farewell` → "Memorial Additions"
  - `community` → "Community Favorites!"

### Pages Refactored
| Page | Status | Pillar Prop |
|------|--------|-------------|
| TravelPage.jsx | ✅ Complete | `pillar="travel"` |
| CarePage.jsx | ✅ Complete | `pillar="care"` |
| DinePage.jsx | ✅ Complete | `pillar="dine"` |
| StayPage.jsx | Bundles only (no individual products) | N/A |

### Product Modal Features
- Smart related product recommendations based on pillar
- Pillar-specific cross-sell section title
- Consistent UI across all pillar pages
- Reviews section
- Add to Cart with autoship options

---

## 📊 Advanced Analytics Dashboard (NEW - Jan 23, 2026)

### Overview
Full-featured analytics dashboard with 6 tabs providing insights into revenue, tickets, agent performance, SLA compliance, and NPS.

### Tabs
1. **📊 Overview** - KPI cards (Revenue, Tickets, NPS, SLA) + Quick Stats
2. **💰 Revenue** - Revenue by pillar with bar charts and distribution
3. **👥 Agent Performance** - Leaderboard with rankings and metrics
4. **⏱️ SLA Compliance** - Met/Breached/At Risk counts, compliance by priority
5. **⭐ NPS & Satisfaction** - NPS score breakdown, promoter/passive/detractor counts
6. **🏛️ Pillar Breakdown** - All 14 pillars with individual metrics

### API Endpoints
- `GET /api/analytics/revenue?days=30` - Revenue metrics
- `GET /api/analytics/tickets?days=30` - Ticket/SLA metrics
- `GET /api/analytics/agents?days=30` - Agent performance
- `GET /api/analytics/nps/stats?days=30` - NPS statistics

### Features
- Date range filter (7/30/90/365 days)
- CSV export functionality
- Real-time data refresh

---

## ⭐ NPS (Net Pawmoter Score) System (NEW - Jan 23, 2026)

### Flow
1. Ticket resolved in Command Center → NPS survey email sent automatically
2. Customer clicks score (0-10) in email → Opens feedback page
3. Customer can add comments → Optionally allow review to be featured
4. Data aggregated in Analytics → NPS tab

### NPS Categories
- **Promoters (9-10)** 🎉 - Loyal enthusiasts
- **Passives (7-8)** 😊 - Satisfied but unenthusiastic
- **Detractors (0-6)** 😔 - Unhappy customers

### NPS Score Formula
```
NPS = % Promoters - % Detractors
Range: -100 to +100
```

### Feedback Page URL
`/feedback?ticket={ticket_id}&token={survey_token}&score={optional_prescore}`

---

## 🌐 Production Data Seeding (Updated Jan 23, 2026)

### Auto-Seeding on Startup (NEW - Jan 23, 2026)
The system now **automatically seeds critical data on every startup** via the `auto_seed_critical_data()` function:
- **FAQs** are auto-seeded if the collection is empty (8 initial FAQs)
- **Collections** are auto-seeded if the collection is empty (3 initial collections)

This ensures data survives deployments without manual intervention.

### Manual Endpoint: `/api/admin/seed-production-data`
For additional seeding or re-seeding:
- **FAQs** (16+ pre-configured questions across categories: Delivery, Products, Orders, Membership, Payment, Pet Soul, Mira AI, and Pillar-specific FAQs)
- **Collections** (4 campaign collections: Valentine's Day, Birthday Celebration, Healthy Bites, Diwali Special)
- **Sample Tickets** (5 realistic, editable tickets for Command Center testing)

**Usage:**
```bash
curl -X POST https://thedoggycompany.in/api/admin/seed-production-data
```

**Features:**
- Uses UPSERT - safe to run multiple times without duplicates
- All seeded data is fully editable via admin panel
- Sample tickets marked with `is_sample: true` for identification

---

## 🐛 Bug Fixes (Session 8 - Jan 23, 2026)

### Critical Bugs Fixed:

1. **Data Disappearing on Redeployment** ✅
   - **Problem**: FAQs, Collections disappeared after deployment
   - **Fix**: Added `auto_seed_critical_data()` function that runs on every startup, seeding FAQs and Collections if empty
   - **File**: `/app/backend/server.py` (lines 657-703)

2. **Orders Not Creating Tickets** ✅
   - **Problem**: New orders weren't generating tickets in Command Center
   - **Fix**: Confirmed working - `create_ticket_from_event()` in `ticket_auto_create.py` creates tickets with `ticket_id = order_id`
   - **Verified**: Test orders create tickets correctly

3. **"Unknown Customer" in Tickets** ✅
   - **Problem**: Command Center showed "Unknown Customer" instead of customer name
   - **Fix**: Normalized `member` data in `concierge_routes.py` to handle `parentName` field from checkout
   - **File**: `/app/backend/concierge_routes.py` (lines 267-291)

---

*This document is automatically updated by the development agent.*


---

## 🎓 Learn Pillar - Complete Implementation (Session 9 - Jan 23, 2026)

### What Was Implemented

1. **LearnManager.jsx Admin Component** - Full admin panel for Learn pillar
   - Stats cards: Total Requests, Pending, In Progress, Completed, Programs
   - 6 tabs: Requests, Programs, Trainers, Products, Bundles, Settings
   - CRUD operations for programs, trainers, products, bundles
   - Export CSV functionality
   - Seed Data button

2. **Backend Admin Endpoints** (`/app/backend/learn_routes.py`)
   - `PUT /api/learn/requests/{id}` - Update request status
   - `POST/PUT/DELETE /api/learn/admin/programs/{id}` - Program CRUD
   - `POST/PUT/DELETE /api/learn/admin/trainers/{id}` - Trainer CRUD
   - `POST/PUT/DELETE /api/learn/admin/products/{id}` - Product CRUD
   - `POST/PUT/DELETE /api/learn/admin/bundles/{id}` - Bundle CRUD
   - `POST /api/learn/admin/seed` - Seed sample data

3. **LearnPage.jsx Improvements**
   - Fixed MiraContextPanel positioning (fixed right-4 top-24 like other pillars)
   - Added Trainer Profile Modal with "View Profile" button functionality
   - Improved Request Training Modal with login prompt for non-logged-in users
   - Added proper state management for selectedTrainer

4. **Admin.jsx Integration**
   - Added "🎓 Learn" tab to PILLAR TOOLS section
   - Imported LearnManager component
   - Added GraduationCap icon import

5. **Cross-Pillar Integration**
   - Learn pillar in Command Center (`ConciergeCommandCenter.jsx` line 183)
   - Learn pillar in Service Desk (`ServiceDesk.jsx` lines 30, 54)
   - Learn pillar in Unified Inbox (`UnifiedInbox.jsx` line 81)

### DinePage Fix
- Added `window.scrollTo(0, 0)` on mount for better UX when navigating

---

*This document is automatically updated by the development agent.*

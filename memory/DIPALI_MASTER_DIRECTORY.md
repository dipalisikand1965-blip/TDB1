# THE DOGGY COMPANY - MASTER DIRECTORY
## Everything Built in 100 Days
## For: Dipali (Founder)
## Created: February 19, 2026

---

# HOW TO USE THIS DOCUMENT

This is your **single source of truth** for everything that exists. Read section by section.

---

# PART 1: THE PRODUCT ARCHITECTURE

## Two User Journeys (Same Soul Foundation)

```
                        ┌─────────────────────────────────────┐
                        │         PET SOUL FOUNDATION         │
                        │   (Both journeys start here)        │
                        │   • Pet profile creation            │
                        │   • Basic soul questions            │
                        │   • Personality capture             │
                        └─────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
    ┌───────────────────────────────┐     ┌───────────────────────────────┐
    │     FREEMIUM JOURNEY          │     │       PAID JOURNEY            │
    │   (Pet OS / POS)              │     │    (Mira OS / Mojo OS)        │
    ├───────────────────────────────┤     ├───────────────────────────────┤
    │ • 14 Pillar Pages             │     │ • Full Mira Demo OS           │
    │ • Mira FAB (MiraOSTrigger)    │     │ • Deep Soul (55+ questions)   │
    │ • Product browsing            │     │ • Personalized Picks          │
    │ • Service browsing            │     │ • Today / Services / Learn    │
    │ • Basic Concierge support     │     │ • Full Concierge with C°      │
    │ • Checkout & Orders           │     │ • Memory-driven experience    │
    │ • Unified Service Flow        │     │ • "Mira never asks twice"     │
    └───────────────────────────────┘     └───────────────────────────────┘
              │                                       │
              │                                       │
              ▼                                       ▼
    ┌───────────────────────────────┐     ┌───────────────────────────────┐
    │       ADMIN BACKEND           │     │       ADMIN BACKEND           │
    │   (Same for both)             │     │    (Same for both)            │
    │   /admin                      │     │    /admin                     │
    │   Service Desk (3,601 tickets)│     │    Service Desk               │
    │   Unified Inbox               │     │    Unified Inbox              │
    │   14 Pillar Queues            │     │    14 Pillar Queues           │
    └───────────────────────────────┘     └───────────────────────────────┘
```

---

# PART 2: WHAT EXISTS - FRONTEND (80 Pages)

## Landing & Marketing
| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Home | `/` | Landing page - "They can't tell you what they need. But I can." | ✅ Working |
| About | `/about` | About The Doggy Company | ✅ Working |
| Membership | `/membership` | Membership sales page | ✅ Working |
| Franchise | `/franchise` | Franchise inquiries | ✅ Working |
| Contact | `/contact` | Contact form | ✅ Working |

## Authentication & Onboarding
| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Login | `/login` | Member login | ✅ Working |
| Register | `/register` | New member signup | ✅ Working |
| MembershipOnboarding | `/join`, `/pet-soul-onboard` | 4-step onboarding flow | ⚠️ Needs work |
| AuthCallback | (internal) | Google OAuth handler | ✅ Working |

## Member Dashboard
| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| MemberDashboard | `/dashboard` | Main member hub with soul scores | ✅ Working |
| MyPets | `/my-pets`, `/pets` | Pet management | ✅ Working |
| MyTickets | `/my-tickets` | Ticket history | ✅ Working |
| PetVault | `/pet-vault/:petId` | Pet documents | ✅ Working |
| NotificationsInbox | `/notifications` | iOS Mail-style inbox | ✅ Working |
| TicketThread | `/tickets/:ticketId` | Individual ticket view | ✅ Working |

## The 14 Pillar Pages (FREEMIUM)
| # | Pillar | Route | Has MiraOSTrigger | Has PillarPageLayout | Status |
|---|--------|-------|-------------------|---------------------|--------|
| 1 | Celebrate | `/celebrate` | ✅ | ✅ | Working |
| 2 | Celebrate New | `/celebrate-new` | ✅ | ✅ | GOLD STANDARD |
| 3 | Dine | `/dine` | ✅ | ✅ | Working |
| 4 | Stay | `/stay` | ✅ | ✅ | Working |
| 5 | Travel | `/travel` | ✅ | ✅ | Working |
| 6 | Care | `/care` | ✅ | ✅ | Working |
| 7 | Enjoy | `/enjoy` | ✅ | ✅ | Working |
| 8 | Fit | `/fit` | ✅ | ✅ | Working |
| 9 | Learn | `/learn` | ✅ | ✅ | Working |
| 10 | Paperwork | `/paperwork` | ✅ | ✅ | Working |
| 11 | Advisory | `/advisory` | ❌ | ✅ | Needs MiraOSTrigger |
| 12 | Emergency | `/emergency` | ✅ | ✅ | Working |
| 13 | Farewell | `/farewell` | ✅ | ✅ | Working |
| 14 | Adopt | `/adopt` | ✅ | ✅ | Working |

## Premium OS Pages (PAID - Behind Membership)
| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| MiraDemoPage | `/mira-demo` | THE SOUL - Full Mira OS | ⚠️ Works but needs rebuild |
| MiraDemoOriginalPage | `/mira-demo-original` | Day 1 clean version | Reference |
| MiraDemoBackupPage | `/mira-demobackup` | Untouched backup | Reference |
| MiraOSPage | `/mira-os` | Header shell navigation | ✅ Working |

## Shop & Products
| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| ShopPage | `/shop` | Main shop | ✅ Working |
| ProductListing | Various | Category listings | ✅ Working |
| ProductDetailPage | `/product/:id` | Product detail | ✅ Working |
| SearchResults | `/search` | Search results | ✅ Working |

## Checkout & Orders
| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| UnifiedCheckout | `/checkout` | Main checkout | ✅ Working |
| MembershipPayment | `/membership/payment` | Membership purchase | ✅ Working |
| PaymentSuccess | `/payment/success`, `/welcome` | Success page | ✅ Working |

## Admin Pages
| Page | Route | Purpose | Status |
|------|-------|---------|--------|
| Admin | `/admin` | MASSIVE Admin Dashboard | ✅ BEAUTIFUL |
| ServiceDeskPage | `/admin/service-desk` | Full-screen service desk | ✅ Working |
| ServiceCRUDAdmin | `/admin/services` | Service management | ✅ Working |
| ConciergeDashboard | `/admin/mira-concierge` | Mira handoff tickets | ✅ Working |
| AgentPortal | `/agent` | Agent workspace | ✅ Working |

---

# PART 3: WHAT EXISTS - BACKEND (Key Files)

## Mira Intelligence (The Brain)
| File | Purpose | Lines |
|------|---------|-------|
| `mira_routes.py` | Main Mira API | 8,700+ |
| `mira_intelligence.py` | Core AI logic | Large |
| `mira_memory.py` | Memory system | Medium |
| `mira_remember.py` | Remember/recall | Medium |
| `soul_intelligence.py` | Soul data processing | Medium |
| `soul_first_logic.py` | Pet-first doctrine | Medium |

## Core Server
| File | Purpose | Notes |
|------|---------|-------|
| `server.py` | Main FastAPI app | MONOLITH - needs breaking up |
| `models.py` | Pydantic models | Comprehensive |
| `utils.py` | Utilities | Has `validate_ticket_id_or_fail` |

## Route Files (60+ files!)
Every pillar has its own routes:
- `celebrate_routes.py`, `dine_routes.py`, `stay_routes.py`, etc.
- `auth_routes.py`, `ticket_routes.py`, `concierge_routes.py`
- `pet_soul_routes.py`, `mira_memory_routes.py`

---

# PART 4: WHAT EXISTS - DATABASE (237 Collections)

## User & Pets
| Collection | Documents | Purpose |
|------------|-----------|---------|
| users | 53 | User accounts |
| pets | 60 | Pet profiles |
| pet_souls | 7 | Deep soul data |
| pet_traits | 36 | Trait intelligence |
| soul_answers_versioned | 168 | Soul Q&A history |

## Products & Services
| Collection | Documents | Purpose |
|------------|-----------|---------|
| products | 2,219 | Product catalog |
| services | 2,406 | Service offerings |
| service_catalog | 89 | Service categories |
| picks_catalogue | 119 | Curated picks |
| unified_products | 5,606 | Unified product view |

## THE SPINE - Tickets & Communications
| Collection | Documents | Purpose |
|------------|-----------|---------|
| service_desk_tickets | 3,601 | THE SPINE - All requests |
| tickets | 2,575 | Legacy tickets |
| mira_tickets | 2,137 | Mira-created tickets |
| channel_intakes | 3,434 | Multi-channel intake |
| unified_inbox | 904 | Unified message view |

## Notifications
| Collection | Documents | Purpose |
|------------|-----------|---------|
| admin_notifications | 3,757 | Admin alerts |
| member_notifications | 485 | Member alerts |
| notifications | 32 | General notifications |

## Mira Intelligence
| Collection | Documents | Purpose |
|------------|-----------|---------|
| mira_sessions | 579 | Chat sessions |
| mira_memories | 384 | Stored memories |
| mira_signals | 1,262 | Intent signals |
| mira_conversations | 41 | Conversations |
| user_learn_intents | 6 | Learning intents (BUGGY) |

## Pillar Requests (All flowing through spine)
| Collection | Documents | Purpose |
|------------|-----------|---------|
| pillar_requests | 676 | All pillar requests |
| celebrate_requests | 358 | Celebrate pillar |
| care_requests | 327 | Care pillar |
| travel_requests | 247 | Travel pillar |
| dine_requests | 183 | Dine pillar |
| stay_requests | 90 | Stay pillar |
| fit_requests | 73 | Fit pillar |

## Commerce
| Collection | Documents | Purpose |
|------------|-----------|---------|
| orders | 32 | Completed orders |
| membership_orders | 16 | Membership purchases |
| abandoned_carts | 89 | Abandoned carts |
| payments | 7 | Payment records |

---

# PART 5: WHAT EXISTS - ADMIN PANEL (/admin)

## Login: `aditya` / `lola4304`

## Sections Available:

### Command Center
- Dashboard - Today's snapshot
- Service Desk - Ticket management
- Unified Inbox - All communications
- Finance - Financial overview
- Pillar Queues - Queue by pillar

### Members & Pets
- Pet Parents - User management
- Pet Profiles - Pet management
- Membership - Membership admin
- Loyalty - Loyalty program
- Engagement - User engagement
- Celebrations - Birthday/Gotcha tracking

### Commerce
- Orders - Order management
- Fulfilment - Fulfillment tracking
- Product Box - Product bundling
- Service Box - Service bundling
- Collections - Product collections
- Pricing - Price management
- Autoship - Subscription management
- Abandoned - Cart recovery
- Discounts - Discount codes

### 14 Pillars
- All 14 pillars manageable from admin
- Each has its own queue and settings

### Mira & AI
- Mira Chats - Chat history
- Memory - Memory management
- Kit Assembly - Box building
- Communications - Message templates
- Reminders - Reminder system

### Marketing
- Campaigns - Marketing campaigns
- Occasion Boxes - Preset boxes
- Proactive - Proactive outreach
- Push - Push notifications

### Analytics
- Live MIS - Real-time metrics
- Reports - Report builder
- Analytics - Deep analytics
- Reviews - Review management
- Pawmeter - Pet metrics
- Site Status - System health

### Content
- Blog - Blog management
- Testimonials - Customer stories
- FAQs - FAQ management
- About - About page
- CMS - Content management
- Landing Page - Landing customization

### Config
- Agents - Agent management
- Customers - Customer settings
- Concierge XP - Experience settings
- Tags - Tag management
- Breeds - Breed database (64 breeds!)
- Custom Cakes - Cake customization
- Streaties - Treat customization
- Franchise - Franchise settings
- MASTER SYNC - Data synchronization

---

# PART 6: WHAT EXISTS - DOCUMENTATION (209 Files)

## Core Bibles (Read These First)
| Document | Purpose | Priority |
|----------|---------|----------|
| `MIRA_BIBLE.md` | Mira's core principles | P0 |
| `MIRA_DOCTRINE.md` | Voice, tone, behavior | P0 |
| `MOJO_BIBLE.md` | Pet identity layer | P0 |
| `PET_OS_BEHAVIOR_BIBLE.md` | System behavior rules | P0 |
| `GOLDEN_STANDARD_UNIFIED_FLOW.md` | Ticket flow spec | P0 |
| `CONCIERGE_BIBLE.md` | Concierge operations | P1 |
| `LEARN_BIBLE.md` | Learn layer spec | P1 |

## Vision Documents
| Document | Purpose |
|----------|---------|
| `DIPALI_VISION.md` | Your mission and goals |
| `DIPALI_STUDY_GUIDE.md` | Index of key docs |
| `COMPLETE_SYSTEM_MAP.md` | Technical overview |

## Architecture Specs
| Document | Purpose |
|----------|---------|
| `ONE_SPINE_SPEC.md` | Unified ticket flow |
| `PICKS_ENGINE_SPEC_v1.md` | Picks system design |
| `TODAY_SPEC.md` | Today layer spec |
| `CONVERSATION_ARCHITECTURE.md` | Chat system design |
| `NAVIGATION_ARCHITECTURE.md` | Navigation design |

## Roadmaps
| Document | Purpose |
|----------|---------|
| `ROADMAP_TO_100.md` | 100-day roadmap |
| `WORLD_CLASS_ROADMAP.md` | World-class vision |
| `MIRA_INTELLIGENCE_ROADMAP.md` | AI roadmap |

---

# PART 7: THE THREE MIRAS (Critical)

## 1. MiraOSModal (THE GOOD ONE) ✅
- **File:** `/app/frontend/src/components/mira-os/MiraOSModal.jsx`
- **Size:** 45KB
- **Used by:** Pillar pages via MiraOSTrigger
- **Features:** Full-page mobile, side-drawer desktop, pet switcher

## 2. MiraChatWidget (DEPRECATED) ❌
- **File:** `/app/frontend/src/components/MiraChatWidget.jsx`
- **Size:** 75KB
- **Still used by:** MealsPage, PetSoulPage, ProductDetailPage, ProductListing, ServiceDetailPage, ServicesPage, ShopPage
- **Action:** Remove and replace with MiraOSTrigger

## 3. MiraDemoPage (THE SOUL - Premium) 💎
- **File:** `/app/frontend/src/pages/MiraDemoPage.jsx`
- **Size:** 198KB (MONOLITH)
- **Route:** `/mira-demo` (behind membership)
- **Features:** Full OS with Today, Picks, Services, Learn, Concierge
- **Action:** Rebuild using MiraOSModal as base

---

# PART 8: INTEGRATIONS BUILT

| Integration | Purpose | Status |
|-------------|---------|--------|
| Google Places | Vet/Park/Cafe finder | ✅ Working |
| YouTube | Learn videos | ✅ Working |
| WhatsApp (Gupshup/Meta) | Messaging | ✅ Working |
| Resend | Email | ✅ Working |
| Shopify | Product sync | ✅ Working |
| ElevenLabs | Voice (Mira speaks) | ✅ Working |
| Firebase | Push notifications | ✅ Working |
| Razorpay | Payments | ✅ Working |

---

# PART 9: TEST CREDENTIALS

## Member Login
```
Email: dipali@clubconcierge.in
Password: test123
```

## Admin Login
```
URL: /admin
Username: aditya
Password: lola4304
```

---

*This is your complete inventory. Use it as reference.*
*Last Updated: February 19, 2026*

# The Doggy Company - Pet Life Operating System
## Complete Product Requirements Document (PRD)

**Document Version:** 5.0.0  
**Last Updated:** December 7, 2026  
**Status:** Production Ready - E2E Verified  
**Prepared By:** Development Team via Emergent AI

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Philosophy](#2-product-vision--philosophy)
3. [User Personas](#3-user-personas)
4. [Core Features & Pillars](#4-core-features--pillars)
5. [Technical Architecture](#5-technical-architecture)
6. [Integrations](#6-integrations)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)
9. [Authentication & Security](#9-authentication--security)
10. [Membership Model](#10-membership-model)
11. [Universal Service Flow](#11-universal-service-flow)
12. [Communication System](#12-communication-system)
13. [Admin Panel](#13-admin-panel)
14. [Mira AI System](#14-mira-ai-system)
15. [File Structure](#15-file-structure)
16. [Environment Configuration](#16-environment-configuration)
17. [Deployment Guide](#17-deployment-guide)
18. [Testing Credentials](#18-testing-credentials)
19. [Completed Work Log](#19-completed-work-log)
20. [Known Issues & Limitations](#20-known-issues--limitations)
21. [Future Roadmap](#21-future-roadmap)

---

## 1. EXECUTIVE SUMMARY

**The Doggy Company** is India's first "Pet Life Operating System" - a comprehensive digital platform serving as the central hub for all pet parent needs. The platform combines AI-powered assistance (Mira), service marketplace, e-commerce, membership benefits, and multi-channel communication into a unified experience.

### Key Metrics (December 7, 2026)
| Metric | Count |
|--------|-------|
| Services | 1,115+ in `services_master` |
| Products | 2,197+ synced from Shopify |
| Pillars | 14 life pillars |
| Active Tickets | 350 |
| Admin Notifications | 496+ |
| Users | 9+ |
| Pets | 19+ |

### URLs
- **Production:** https://thedoggycompany.com
- **Preview:** https://panel-refresh-debug.preview.emergentagent.com

### E2E Test Results (December 7, 2026)
| Component | Status |
|-----------|--------|
| Service Requests | WORKING |
| Admin Dashboard | WORKING (350 total, 19 action needed) |
| WhatsApp (Gupshup) | WORKING |
| Email (Resend) | WORKING |
| Razorpay | LIVE (configured for production domain) |

---

## 2. PRODUCT VISION & PHILOSOPHY

### Mission Statement
> "A dog is not in your life. You are in theirs."
> "To be known. To be seen. To be loved. With accuracy."

### Core Principles
1. **Pet-Centric Design:** Every feature serves the pet's wellbeing
2. **Personalisation:** AI-driven recommendations based on pet profiles
3. **Unified Experience:** Single platform for all pet needs
4. **Multi-Channel:** Meet users where they are (Web, WhatsApp, Email)

### Dedication
Built with love, honoring the memory of **Kouros** (black Newfoundland) and **Mystique** (Shih Tzu).

---

## 3. USER PERSONAS

### Primary Users

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **New Pet Parent** | First-time dog owner, overwhelmed | Guidance, basic services, learning resources |
| **Experienced Owner** | Multiple pets, knows what they want | Convenience, premium services, health tracking |
| **Premium Member** | High-value customer, wants VIP treatment | Priority support, exclusive access, concierge |
| **Service Provider** | Groomers, vets, trainers | Lead generation, booking management |

### Admin Users
- **Super Admin:** Full platform access
- **Concierge Team:** Service desk, customer communication
- **Content Manager:** Product/service catalog management

---

## 4. CORE FEATURES & PILLARS

### The 14 Life Pillars

| # | Pillar | Route | Description | Status |
|---|--------|-------|-------------|--------|
| 1 | **Celebrate** | `/celebrate` | Birthdays, cakes, parties, gifts | Complete |
| 2 | **Dine** | `/dine` | Fresh meals, restaurants, nutrition | Complete |
| 3 | **Stay** | `/stay` | Hotels, boarding, daycare | Complete |
| 4 | **Travel** | `/travel` | Trips, carriers, planning | Complete |
| 5 | **Care** | `/care` | Grooming, vet, wellness | Complete |
| 6 | **Enjoy** | `/enjoy` | Experiences, events, outings | Complete |
| 7 | **Play** | `/play` | Toys, games, activities | Complete |
| 8 | **Fit** | `/fit` | Exercise, fitness, agility | Complete |
| 9 | **Learn** | `/learn` | Training, guides, Ask Mira AI | Complete |
| 10 | **Advisory** | `/advisory` | Expert consultations | Complete |
| 11 | **Shop** | `/shop` | E-commerce, products | Complete |
| 12 | **Emergency** | `/emergency` | 24/7 emergency services | Complete |
| 13 | **Farewell** | `/farewell` | End-of-life services, Rainbow Bridge | Complete |
| 14 | **Adopt** | `/adopt` | Adoption, fostering | Complete |

---

## 5. TECHNICAL ARCHITECTURE

### Stack
- **Frontend:** React 18 with Tailwind CSS, Shadcn/UI
- **Backend:** FastAPI (Python 3.11)
- **Database:** MongoDB (Atlas in production)
- **AI:** OpenAI GPT via Emergent LLM Key
- **Hosting:** Kubernetes (Emergent Platform)

### Key Files
```
/app
├── backend/
│   ├── server.py              # Main FastAPI application (20,000+ lines)
│   ├── concierge_routes.py    # Service desk endpoints
│   ├── concierge_engine.py    # Stats and notes (fixed Dec 7)
│   ├── whatsapp_routes.py     # WhatsApp webhook
│   ├── whatsapp_notifications.py  # Notification functions
│   ├── learn_os_routes.py     # Learn page + Ask Mira
│   └── .env                   # Environment configuration
└── frontend/
    └── src/
        ├── App.js             # Main routing
        ├── pages/
        │   ├── MiraDemoPage.jsx    # Mira OS (fixed ticket creation)
        │   ├── LearnPage.jsx       # Learn + Ask Mira
        │   ├── CelebratePage.jsx   # Celebrate (fixed breed filtering)
        │   └── Checkout.jsx        # Cart checkout
        └── components/
            └── admin/
                └── ConciergeRequestsDashboard.jsx  # Fixed auth
```

---

## 6. INTEGRATIONS

### Active Integrations

| Integration | Status | Configuration |
|-------------|--------|---------------|
| **Razorpay** | LIVE | Key: `rzp_live_<REDACTED_ROTATED>`, Domain: thedoggycompany.com |
| **Gupshup WhatsApp** | LIVE | App: "The Doggy Company", Number: 918971702582 |
| **Resend Email** | LIVE | Key: `re_RyFymGmF_QE6qJSpEH4CSKTiN3WQYUU9G`, Domain: thedoggycompany.com |
| **OpenAI (Mira)** | LIVE | Using Emergent LLM Key |
| **Shopify** | SYNCED | thedoggybakery.com, 2,197+ products |
| **MongoDB Atlas** | CONNECTED | Database: pet-os-live-test_database |
| **YouTube** | LIVE | Learn page video content |
| **Google Places** | LIVE | Location services |
| **ElevenLabs** | CONFIGURED | Mira voice |

---

## 7. DATABASE SCHEMA

### Collections

| Collection | Documents | Purpose |
|------------|-----------|---------|
| `users` | 9+ | User accounts |
| `pets` | 19+ | Pet profiles |
| `memberships` | 3+ | Active memberships |
| `products` | 2,197+ | Shopify products |
| `services_master` | 1,115+ | All services |
| `service_requests` | 86+ | Universal requests |
| `service_desk_tickets` | 262+ | Service desk items |
| `tickets` | 80+ | Legacy tickets |
| `orders` | 3+ | Product orders |
| `admin_notifications` | 496+ | Admin alerts |
| `member_notifications` | Varies | User notifications |
| `concierge_notes` | 0 | Legacy notes |

---

## 8. API REFERENCE

### Authentication
```
POST /api/auth/login          - Returns access_token
POST /api/auth/register       - New user registration
GET  /api/auth/me             - Current user profile
```

### Universal Service Flow
```
POST /api/service-requests              - Create service request
POST /api/concierge/mira-request        - Mira conversation ticket
POST /api/orders                        - Create order (auto-ticket)
GET  /api/concierge/requests            - Admin: All requests
GET  /api/concierge/stats               - Admin: Dashboard stats
GET  /api/concierge/queue               - Admin: Service desk queue
```

### Learn & Mira AI
```
GET  /api/learn/guides                  - Get learn guides
GET  /api/learn/videos                  - Get learn videos
POST /api/os/learn/ask-mira             - Ask Mira (creates ticket)
```

### Products & Services
```
GET  /api/products                      - Get products (?category=breed-cakes)
GET  /api/service-box/services          - Get services by pillar
GET  /api/membership/plans              - Membership plans
POST /api/membership/create-order       - Razorpay order
```

### Notifications
```
POST /api/whatsapp/test-notification    - Test WhatsApp
POST /api/admin/communications/test-email - Test email
GET  /api/whatsapp/status               - Integration status
```

### Admin
```
GET  /api/admin/dashboard               - Comprehensive stats
```

---

## 9. AUTHENTICATION & SECURITY

### User Authentication
- JWT-based authentication
- Token returned as `access_token` in login response
- Header: `Authorization: Bearer <token>`

### Admin Authentication
- Basic Auth for admin endpoints
- Header: `Authorization: Basic <base64(username:password)>`
- Credentials: `aditya:lola4304`

---

## 10. MEMBERSHIP MODEL

| Plan | Price | Features |
|------|-------|----------|
| **Free** | Rs 0 | Basic access, 3 Mira queries/day |
| **Essential** | Rs 2,499/month | 10% discounts, unlimited Mira, priority support, birthday rewards |
| **Premium** | Rs 9,999/month | 20% discounts, VIP concierge, exclusive events, all Essential features |

---

## 11. UNIVERSAL SERVICE FLOW

### Flow Diagram
```
User Intent (from anywhere)
    ↓
Service Request (/api/service-requests)
    ↓
Service Desk Ticket (service_desk_tickets)
    ↓
Admin Notification (admin_notifications)
    ↓
Member Notification (member_notifications)
    ↓
Dashboard Update (Real-time stats)
```

### Sources That Create Tickets
1. **Mira OS Page:** Posts to `/api/concierge/mira-request`
2. **Learn Ask Mira:** Posts to `/api/service-requests`
3. **Checkout/Orders:** Posts to `/api/orders` (auto-creates ticket)
4. **Service Booking:** Posts to `/api/service-requests`

### December 7, 2026 Fixes
- MiraDemoPage now actually posts to backend (was local state only)
- LearnPage Ask Mira now creates service requests
- Concierge stats endpoint merges all collections

---

## 12. COMMUNICATION SYSTEM

### WhatsApp (Gupshup)
- **Webhook:** `/api/whatsapp/webhook`
- **Notification Types:** welcome, payment, membership, booking, birthday
- **Status:** LIVE and tested

### Email (Resend)
- **From:** woof@thedoggycompany.com
- **Domain:** thedoggycompany.com (verified)
- **API Key:** re_RyFymGmF_QE6qJSpEH4CSKTiN3WQYUU9G

### Important Configuration
```
GUPSHUP_APP_NAME="The Doggy Company"  # MUST be quoted!
```

---

## 13. ADMIN PANEL

### Dashboard Stats (December 7, 2026)
| Metric | Value |
|--------|-------|
| Total Requests | 350 |
| Action Needed | 19 |
| Care | 121 |
| Learn | 21 |
| Travel | 2 |
| Stay | 2 |
| Enjoy | 1 |

### Key Admin Routes
- `/admin` - Main admin panel
- `/admin/concierge` - Concierge Requests Dashboard
- `/admin/products` - Product management
- `/admin/services` - Service management

---

## 14. MIRA AI SYSTEM

### Capabilities
- Natural language understanding
- Pet-specific responses based on profile
- Service recommendations
- Learning assistance (Ask Mira on Learn page)

### Integration Points
- Mira OS Page (`/mira-os`)
- Learn Page Ask Mira
- WhatsApp (contextual responses)
- Concierge chat

---

## 15. FILE STRUCTURE

### Modified Files (December 7, 2026)
```
/app/frontend/src/pages/MiraDemoPage.jsx       # Fixed: ticket creation to backend
/app/frontend/src/pages/LearnPage.jsx          # Added: service request after Ask Mira
/app/frontend/src/pages/CelebratePage.jsx      # Fixed: breed cakes URL params
/app/frontend/src/components/ProductCard.jsx   # Enhanced: flavors, sizes display
/app/frontend/src/components/ServiceCatalogSection.jsx  # Added: Load More button
/app/frontend/src/components/admin/ConciergeRequestsDashboard.jsx  # Fixed: auth & stats
/app/frontend/src/components/Mira/ConciergeButton.jsx  # Fixed: wa.me link

/app/backend/server.py                         # Updated: admin dashboard stats
/app/backend/concierge_engine.py               # Fixed: stats from all collections
/app/backend/concierge_routes.py               # Fixed: requests from all collections
```

---

## 16. ENVIRONMENT CONFIGURATION

### Backend .env
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=pet-os-live-test_database
RAZORPAY_KEY_ID=rzp_live_<REDACTED_ROTATED>
RAZORPAY_KEY_SECRET=<secret>
RESEND_API_KEY=re_RyFymGmF_QE6qJSpEH4CSKTiN3WQYUU9G
SENDER_EMAIL=woof@thedoggycompany.com
GUPSHUP_API_KEY=sk4wevmqj8cvrcvj9rnlsn8wr2eqg5zo
GUPSHUP_APP_NAME="The Doggy Company"
WHATSAPP_NUMBER=918971702582
```

### Frontend .env
```
REACT_APP_BACKEND_URL=https://panel-refresh-debug.preview.emergentagent.com
```

---

## 17. DEPLOYMENT GUIDE

### Pre-Deployment Checklist
- [ ] All environment variables configured
- [ ] GUPSHUP_APP_NAME is quoted
- [ ] Gupshup webhook URL set to production
- [ ] Razorpay configured for production domain
- [ ] Resend domain verified

### Post-Deployment Steps
1. Run MASTER SYNC in Admin panel
2. Test one membership payment
3. Test WhatsApp message delivery
4. Verify email delivery
5. Monitor service desk for tickets

### Gupshup Webhook Configuration
```
URL: https://thedoggycompany.com/api/whatsapp/webhook
Method: POST
```

---

## 18. TESTING CREDENTIALS

### Test User
- **Email:** dipali@clubconcierge.in
- **Password:** test123

### Admin Panel
- **URL:** /admin
- **Username:** aditya
- **Password:** lola4304

---

## 19. COMPLETED WORK LOG

### December 7, 2026 - Universal Service Flow Fix

#### Critical Fixes
1. **MiraDemoPage Ticket Creation**
   - Was: Creating tickets locally in state, never posting to backend
   - Fixed: Now posts to `/api/concierge/mira-request`

2. **LearnPage Ask Mira**
   - Was: Only returning AI answers, no ticket creation
   - Fixed: Now creates service request via `/api/service-requests`

3. **Admin Dashboard**
   - Was: Showing 0 for most stats (querying wrong collections)
   - Fixed: Now aggregates from service_requests, service_desk_tickets, orders, etc.

4. **Concierge Stats Endpoint**
   - Was: Duplicate endpoint in concierge_engine.py querying empty collection
   - Fixed: Merged all collections (86 service_requests + 262 service_desk_tickets)

5. **ConciergeRequestsDashboard**
   - Was: Using Bearer token for admin endpoints
   - Fixed: Changed to Basic Auth, updated stats field names

#### Celebrate Page Fixes
- Fixed breed cakes filtering (URL params race condition)
- Enhanced ProductCard modal (flavors, sizes, breed tags)
- Added Load More button to ServiceCatalogSection

#### Email Domain Consistency
- Updated 30 occurrences of thedoggycompany.in to thedoggycompany.com
- Updated Resend API key for .com domain

#### WhatsApp Link Fix
- Changed click-to-chat from api.whatsapp.com to wa.me

#### E2E Test Results
| Step | Status | Details |
|------|--------|---------|
| User Login | PASS | Token obtained |
| Service Request | PASS | REQ-20260307-2DE4 created |
| Ticket Created | PASS | TKT-087EB1AA |
| Admin Notification | PASS | NOTIF-79BDF702 |
| Admin Dashboard | PASS | 350 total, 19 action needed |
| WhatsApp | PASS | Message submitted |
| Email | PASS | Email sent via Resend |

---

## 20. KNOWN ISSUES & LIMITATIONS

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| Admin auth hardcoded | Low | Known | Future: migrate to role-based |
| Large components | Low | Known | Admin.jsx (2600+ lines), DoggyServiceDesk.jsx (6000+ lines) |
| Razorpay on preview | Expected | N/A | Only works on thedoggycompany.com |

---

## 21. FUTURE ROADMAP

### P1 - High Priority
- Refactor large components (Admin.jsx, DoggyServiceDesk.jsx)
- Admin auth migration to role-based system

### P2 - Medium Priority
- Content population (transformation stories)
- E-commerce expansion (HUFT integration)
- Mobile app (React Native)

### P3 - Low Priority
- Analytics dashboard
- A/B testing framework
- Advanced Mira memory

---

**Document End**

*Built with love, in memory of Kouros & Mystique*

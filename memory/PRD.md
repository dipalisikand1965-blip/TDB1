# Mira OS - Pet Operating System
## Product Requirements Document

### Original Problem Statement
The user, Dipali, requested a "full audit" of her website, thedoggycompany.in. This evolved into a large-scale rescue mission for a complex "pet operating system" named Mira, built in honor of her grandmother. The core of the application is "Soul Intelligence," a system designed to understand a pet's personality through a detailed questionnaire, and "Mira," an AI concierge that uses this soul data to provide personalized services and recommendations.

### Core Features
- **Mira AI Chat**: Soul-aware conversational AI that knows each pet's personality, preferences, and health needs
- **Soul Builder**: Gamified questionnaire to capture pet personality
- **Service Desk**: Admin panel for concierge team to handle service requests
- **Unified Inbox**: Two-way communication between members and concierge
- **Pillar Pages**: 15 themed pages (Celebrate, Care, Dine, Stay, etc.)
- **E-commerce**: Products from The Doggy Bakery via Shopify sync
- **Voice**: TTS support with ElevenLabs (primary) and OpenAI (fallback)

### User Personas
1. **Pet Parents (Members)**: Primary users who use Mira for pet care, services, and shopping
2. **Concierge Team (Admin)**: Staff who fulfill service requests and respond to tickets
3. **Dipali (Owner)**: Business owner overseeing the platform

---

## Implementation Status

### ✅ Completed (Feb 21, 2026)
- [x] Critical data restoration (2,541 products, 716 services, 35 stays, 22 restaurants)
- [x] Admin Service Desk ticket display fix (33 tickets)
- [x] Soul-aware chat verification
- [x] Personalized hero image on landing page
- [x] Pet Picks with breed-specific products
- [x] Category bar with real product images
- [x] ElevenLabs TTS integration (with OpenAI fallback)
- [x] YouTube and Google Places API verification
- [x] **Services Tab Fix** - All service cards link to correct topics
- [x] **Ticket Not Found Fix** - Multi-endpoint ticket fetching
- [x] **Ticket Reply** - Verified working with optimistic UI

### 🔴 Blocked
- [ ] Razorpay Checkout - Awaiting API keys from user
- [ ] Screenshot tool - Platform media limit exceeded

### 🟠 In Progress
- [ ] Post-deployment verification at thedoggycompany.in

---

## Prioritized Backlog

### P0 - Critical
- Post-deployment verification and bug fixes

### P1 - High Priority
- Fix "Add another pet" loop in Soul Builder
- Final mobile QA review

### P2 - Medium Priority
- Deep conversation flow audit
- Test product detail pages
- Meilisearch verification on production

### P3 - Future
- Push notifications for concierge replies
- Smart reordering reminders
- Daily mood tracking

---

## Technical Architecture

```
/app/
├── backend/
│   ├── server.py          # Main FastAPI (15,000+ lines)
│   ├── mira_routes.py     # Mira AI chat endpoints
│   ├── ticket_routes.py   # Unified ticket endpoints
│   └── tts_routes.py      # Text-to-speech
├── frontend/
│   ├── src/pages/         # 15 Pillar Pages + MiraDemoPage
│   └── src/components/    # Reusable UI components
└── memory/
    └── PRD.md             # This file
```

### Key Endpoints
- `POST /api/mira/os/understand-with-products` - Soul-aware chat
- `GET /api/mira/tickets/{id}` - Get ticket from mira_tickets
- `GET /api/tickets/{id}` - Get ticket from tickets/service_desk_tickets
- `POST /api/member/tickets/{id}/reply` - Send reply

### Database Collections
- `mira_tickets` - Advisory tickets from Mira chat
- `service_desk_tickets` - Request tickets for concierge
- `products_master` - All products (2,541)
- `services_master` - All services (716)

---

## Test Credentials
- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

## Environment Notes
- ElevenLabs quota exceeded - Falls back to OpenAI TTS
- Production MongoDB IP whitelisting pending for preview env

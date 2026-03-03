# Pet Life Operating System - PRD

## Original Problem Statement
Build a comprehensive "Pet Life Operating System" - a digital guardian platform for pet owners featuring AI-powered assistance (Mira), pet profiles with soul scores, health tracking, and concierge services across 14 life pillars.

*Built in Memory of Mystique 💜🐾*

## Core Architecture
- **Frontend:** React + Tailwind CSS + Framer Motion
- **Backend:** FastAPI + Python
- **Database:** MongoDB Atlas
- **AI:** OpenAI GPT (via Emergent LLM Key)

## What's Been Implemented

### March 3, 2026 (Latest Session)
- **MULTI-PET ONBOARDING FLOW COMPLETE:**
  - Pet count screen (1-8 quick buttons + custom 1-50)
  - 33+ breed avatar selection as photo alternative
  - Avatar displays correctly on all screens
  - Multi-pet loop: Complete Pet 1 → Reset → Pet 2 → Parent Info
  - All bugs fixed and tested (10/10 tests passed)

- **SERVICE DESK & NOTIFICATION SYSTEM:**
  - Investigated full Concierge flow end-to-end
  - Added `has_unread_concierge_reply` flag when concierge replies
  - Added `has_unread_reply` to pet parent's active requests API
  - Updated frontend ActiveRequestCard with pink highlight + "NEW" badge
  - Added mark-as-read endpoint: `POST /api/os/concierge/ticket/{id}/mark-read`
  - Fixed collection query to include main `tickets` collection

### Previous Implementations
- UI consistency across 14 pillar pages
- Universal search bar on all pages
- Critical bug fixes (account hijacking, page crashes, mobile modal)
- Rainbow Bridge Memorial feature
- Admin Guide Dashboard

## Service Desk Flow

### How It Works:
1. **Pet Parent Asks** (Search bar, Mira chat, Services Quick Actions)
2. **Ticket Created** → Goes to Service Desk
3. **Concierge Sees** in Service Desk dashboard
4. **Concierge Replies** → `has_unread_concierge_reply: True`
5. **Pet Parent Sees** reply in Services panel with "NEW" badge

### Key Endpoints:
- `POST /api/mira/os/understand-with-products` - Pet parent asks Mira
- `GET /api/os/concierge/home` - Pet parent's active requests
- `POST /api/tickets/{id}/reply` - Concierge replies
- `POST /api/os/concierge/ticket/{id}/mark-read` - Clear unread flag

## Known Issues

### P1 (Infrastructure)
- WebSocket "Reconnecting..." - Known preview environment limitation
- Real-time updates work via polling (page refresh)

## Prioritized Backlog

### P0 (Launch Critical)
- ✅ Multi-pet onboarding - DONE
- ✅ Service desk flow verification - DONE
- Razorpay integration (API keys needed)
- Email notifications (Resend API key needed)

### P1 (High Priority)  
- WhatsApp Business API integration
- Cart checkout flow testing
- Enhance 'Fit' Pillar - activity tracking
- Enhance 'Paperwork' Pillar - document upload

### P2 (Medium Priority)
- Refactor MiraMeetsYourPet.jsx into components
- Refactor MiraDemoPage.jsx (5,300 lines)
- Code cleanup and optimization

### P3 (Future)
- Progressive Soul Building
- Full WhatsApp integration

## Key Files
- `/app/frontend/src/pages/MiraMeetsYourPet.jsx` - Onboarding
- `/app/frontend/src/components/Mira/ConciergeHomePanel.jsx` - Services UI
- `/app/backend/concierge_routes.py` - Main concierge API (4,300+ lines)
- `/app/backend/ticket_routes.py` - Ticket management (4,900+ lines)
- `/app/backend/routes/concierge_os_routes.py` - OS concierge routes

## Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

## 3rd Party Integrations
- OpenAI GPT (Emergent LLM Key)
- MongoDB Atlas
- YouTube (LEARN panel)
- Shopify (product sync)

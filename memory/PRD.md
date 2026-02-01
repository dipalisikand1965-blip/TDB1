# Pet Life Operating System - Product Requirements Document

## Project Overview
A comprehensive Pet Life Operating System for The Doggy Company - India's #1 Pet Platform featuring premium dog cakes, pet-friendly dining, stays & services with same-day delivery.

## Original Problem Statement
Build a complete service booking experience and admin management interface for the Pet Life Operating System. The platform serves pet parents with:
- 14 Life Pillars (Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Advisory, Emergency, Farewell, Adopt, Insure)
- Mira AI Concierge for personalized recommendations
- Member Dashboard with comprehensive pet management
- Admin Panel with Service Desk, Paperwork Manager, and more

## User Personas
1. **Pet Parents (Members)**: Users managing pets, ordering products, booking services
2. **Admin Staff**: Managing orders, service requests, documents, tickets
3. **Mira AI**: AI-powered concierge for recommendations and assistance

## Core Requirements

### Member Dashboard
- ✅ Overview with pet selector for multi-pet households
- ✅ Clickable request cards navigating to requests tab
- ✅ Documents tab for viewing pet documents
- ✅ Browse Recommendations button linked to shop
- ✅ Lazy-loaded tab components for performance
- ✅ Pet Soul completion progress
- ✅ Quick reorder widget
- ✅ Upcoming events (birthdays, vaccinations)

### Admin Panel
- ✅ Service Desk with ticket management (lock/delete)
- ✅ Paperwork Manager with Document Vault
- ✅ Member management
- ✅ Order management

### Integrations
- ✅ OpenAI GPT-4o for Mira AI chat
- ✅ Resend for transactional emails
- 🔄 Razorpay (pending user API keys)
- 🔄 WhatsApp Business (pending Meta approval)

## What's Been Implemented

### Session: February 1, 2026
**Bug Fixes Completed:**
1. ✅ Fixed duplicate `/>` syntax error in MemberDashboard.jsx
2. ✅ Added Documents TabsContent with proper props (pets, token, API_URL)
3. ✅ Fixed SmartRecommendationsCard "View All" button - added onClick handler
4. ✅ Verified pet selector already implemented in OverviewTab
5. ✅ Verified request cards already clickable with onTabChange handler

**All 4 Dashboard Bugs Fixed:**
- Bug 1: "My Requests" cards now clickable → navigate to requests tab
- Bug 2: Pet selector dropdown shows for users with multiple pets
- Bug 3: "Browse Recommendations" buttons navigate to /shop
- Bug 4: Documents tab visible in both desktop and mobile navigation

### Previous Session Accomplishments
- Member Dashboard Refactor: 3,500+ line file split into 15 lazy-loaded components
- File Upload Implementation: Proper upload endpoint and UI
- Admin Document Vault: New tab in Paperwork Manager
- Service Desk Enhancements: Lock/delete ticket functionality

## Architecture

```
/app
├── backend
│   ├── server.py                    # Main FastAPI server
│   ├── paperwork_routes.py          # File upload & admin docs
│   ├── ticket_routes.py             # Service desk tickets
│   └── mira_routes.py               # Mira AI endpoints
└── frontend
    └── src
        ├── App.js                   # Main routing
        ├── pages
        │   ├── MemberDashboard.jsx  # Lazy-loading container
        │   └── PaperworkPage.jsx    # Document upload UI
        ├── components
        │   ├── admin/
        │   │   ├── DoggyServiceDesk.jsx
        │   │   └── PaperworkManager.jsx
        │   ├── dashboard/tabs/      # 15+ tab components
        │   │   ├── OverviewTab.jsx
        │   │   ├── DocumentsTab.jsx
        │   │   └── ...
        │   ├── MiraPicksCard.jsx
        │   └── SmartRecommendationsCard.jsx
        └── context/
            ├── AuthContext.js
            └── CartContext.js
```

## Test Credentials
- **Member Login**: dipali@clubconcierge.in / test123
- **Admin Panel**: aditya / lola4304

## Prioritized Backlog

### P0 (High Priority)
- [ ] Implement Membership Business Model (Freemium vs Members-Only)
- [ ] Kit Assembly Admin Controls
- [ ] Mira Picks Admin Dashboard
- [ ] Fix Cinema Kit voice cutting off issue

### P1 (Medium Priority)
- [ ] "Pet Parent Magnet" features (First box free, Pet Parent Score)
- [ ] Rewards Program finalization

### P2 (Lower Priority)
- [ ] Razorpay Payment Integration (awaiting keys)
- [ ] WhatsApp Business Integration (awaiting approval)
- [ ] Partner Portal development
- [ ] Saved Kits UI in Member Dashboard

### Refactoring Tasks
- [ ] DoggyServiceDesk.jsx (5000+ lines) needs component extraction

## Known Issues
- Dashboard page is memory-intensive and may crash Playwright screenshot tools
- Meilisearch unavailable (non-blocking for core functionality)

## API Endpoints Reference
- POST /api/auth/login
- GET /api/pets/my-pets
- GET /api/paperwork/documents/{pet_id}
- GET /api/mira/my-requests
- GET /api/user/bookings
- POST /api/paperwork/documents/upload
- GET /api/paperwork/admin/documents

# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System." A world-class, event-driven platform with a single engine powering 12 business "Pillars" with Pet Soul integration, Unified Inbox, and Mira AI concierge.

**Brand Identity**: World's First Pet Concierge® — "Concierge®" is the registered trademark of Club Concierge® in India, held by Dipali Sikand since 2016.

**Company Address**: #83, 3rd Floor, 7th Cross, 4th B Block, Koramangala, Bangalore - 560034

---

## What's Been Implemented (Latest - Jan 20, 2026)

### P0 UI & Branding Refresh - COMPLETE ✅
- **Landing Page Redesigned**: Now focuses on Concierge® experience, removed bakery-heavy sections
- **Footer Updated**: Bangalore office (#83, 3rd Floor, 7th Cross, 4th B Block, Koramangala, Bangalore - 560034)
- **Navbar Logo**: "The Doggy Company" branding applied globally
- **Concierge® Trademark**: Added ® symbol across all user-facing instances
- **Mira AI Section Updated**: "Super Pet Concierge®" with use case examples

### Authentication Gating with Member Benefits - COMPLETE ✅
- **ALL 12 Pillars Protected**: Users must sign in to access any pillar
- **Member Benefits Preview Page**: Instead of just redirecting, users see pillar-specific benefits they'll unlock
- **Pillar-Specific Benefits**: Each protected route shows relevant benefits (e.g., Celebrate shows "10% off cakes", Dine shows "Priority reservations")
- **Full Membership Benefits Card**: Shows all benefits across 12 pillars with "Show All" toggle
- **Note**: The Doggy Bakery is the supplier for Celebrate products (not a separate brand)

### FAQs Page Redesigned - COMPLETE ✅
- **Covers All 12 Pillars**: Concierge®, Membership, Celebrate, Dine, Travel, Stay, Care, Enjoy, Fit, Advisory, Paperwork, Emergency, Orders, Payments
- **Filter Pills**: Quick access to FAQ categories
- **Search**: Search across all pillars
- **Mira AI Integration**: "Ask Mira AI" button at bottom

### Admin Reports - All 12 Pillars - COMPLETE ✅
- **Pillar Sub-tabs Added**: Summary, Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Advisory, Paperwork, Emergency, Club
- **Generic Template**: Pillars without specific data show "Coming Soon" with basic metrics placeholder

### Membership Manager Enhanced - COMPLETE ✅
- **Add Member Button**: Manual member registration for offline events/exhibitions
- **Import CSV**: Bulk upload for offline memberships with template download
- **Export CSV**: Download member list for offline analysis
- **Bulk Actions**: Select multiple members and apply actions (upgrade tier, extend subscription, add points, send reminders)
- **Member Selection**: Checkbox selection for bulk operations

### Membership Page Enhancement - COMPLETE ✅
- **Pet Soul™ Preview Section**: Bruno's sample profile
- **Gamification & Levels**: 4 doggy-themed membership levels
- **How to Earn Paw Points** guide

### Razorpay Payment Integration - IN PROGRESS 🟡
- **Backend Routes**: `/api/payment/create-order`, `/api/payment/verify`
- **Frontend Component**: `MembershipPayment.jsx`
- **Status**: Infrastructure built, needs E2E testing with test cards

---

## Data Flywheel Status (Pet Soul Integration)

| Pillar | Fetches Pets | Pet Selection UI | Writes to Soul | Status |
|--------|-------------|------------------|----------------|--------|
| **Celebrate** | ✅ YES | ✅ YES | ✅ YES | **COMPLETE** ✅ |
| **Stay** | ✅ YES | ✅ YES | ✅ YES | **COMPLETE** ✅ |
| **Dine** | ✅ YES | ✅ YES | ✅ YES | **COMPLETE** ✅ |
| **Fit** | ✅ YES | ✅ YES | ✅ YES | **COMPLETE** ✅ |
| **Advisory** | ✅ YES | ✅ YES | ✅ YES | **COMPLETE** ✅ |
| Travel | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| Care | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| Emergency | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| Paperwork | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| Enjoy | ✅ Yes | ✅ Yes | ✅ Yes | Complete |
| Club | 🔴 No | 🔴 No | 🔴 No | **NOT STARTED** |
| Shop Assist | 🟡 Partial | 🟡 Partial | 🔴 No | Needs work |

---

## Priority Backlog

### P0 - Critical
- [ ] **Razorpay E2E Testing**: Complete payment flow verification

### P1 - High Priority
- [ ] **Voice Order Fix**: "Connection failed" error
- [ ] **Mira Proactive Suggestions**: Check Pet Soul for upcoming events (birthdays, vaccinations)

### P2 - Medium Priority
- [ ] **Shopify Sync "Untitled" Products**: Recurring data integrity issue (6+ occurrences)
- [ ] **Onboarding Flow**: Pet Soul creation during registration

### P3 - Future/Backlog
- [ ] Pet Soul page for continuous profile enrichment
- [ ] Auto-checkout per pillar
- [ ] Standardize remaining Admin Managers
- [ ] Centralized Product Management System
- [ ] Refactor `server.py` (9000+ lines) into smaller modules

---

## Known Issues

| Issue | Priority | Status | Notes |
|-------|----------|--------|-------|
| Voice Order broken | P1 | NOT STARTED | "Connection failed" error |
| Shopify creates 'Untitled' products | P2 | RECURRING | 6+ occurrences |
| Razorpay E2E testing | P0 | IN PROGRESS | Infrastructure built |

---

## Key Technical Decisions

- **Authentication**: JWT + Emergent Google OAuth
- **Payment Gateway**: Razorpay (test keys in backend/.env)
- **LLM Integration**: OpenAI GPT-4 via Emergent LLM Key
- **File Storage**: `/app/uploads/` directory
- **Database**: MongoDB (collections: users, pets, orders, etc.)

---

## API Endpoints Added This Session

### Member Management
- `POST /api/admin/members` - Add new member (for offline registrations)
- `POST /api/admin/members/import` - Bulk import members from CSV
- `POST /api/admin/members/bulk-action` - Execute bulk actions on selected members

---

## Files Reference

### Core Files Modified
- `/app/backend/server.py` - Added member management endpoints
- `/app/frontend/src/App.js` - Protected all pillar routes
- `/app/frontend/src/pages/Home.jsx` - Concierge-focused landing page
- `/app/frontend/src/pages/FAQs.jsx` - All-pillars FAQ page
- `/app/frontend/src/components/Footer.jsx` - Bangalore address
- `/app/frontend/src/components/Navbar.jsx` - "The Doggy Company" branding
- `/app/frontend/src/components/ProtectedRoute.jsx` - Member benefits preview gate
- `/app/frontend/src/components/ReportsManager.jsx` - All 12 pillars in reports
- `/app/frontend/src/components/admin/MembershipManager.jsx` - CSV upload, add member, bulk actions

---

## Credentials

- **Admin**: `aditya` / `lola4304`
- **Razorpay**: Test keys in `backend/.env`

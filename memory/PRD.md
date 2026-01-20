# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System." A world-class, event-driven platform with a single engine powering 12 business "Pillars" with Pet Soul integration, Unified Inbox, and Mira AI concierge.

**Brand Identity**: World's First Pet Concierge® — "Concierge®" is the registered trademark of Club Concierge® in India, held by Dipali Sikand since 2016.

---

## What's Been Implemented (Latest - Jan 20, 2026)

### P0 UI & Branding Refresh - COMPLETE ✅
- **Landing Page Redesigned**: Now focuses on Concierge® experience, removed bakery-heavy sections
- **Footer Updated**: Bangalore office (#83, 3rd Floor, 7th Cross, 4th B Block, Koramangala, Bangalore - 560034)
- **Navbar Logo**: "The Doggy Company" branding applied globally
- **Concierge® Trademark**: Added ® symbol across all user-facing instances
- **Mira AI Section Updated**: "Super Pet Concierge®" with use case examples

### Authentication Gating - COMPLETE ✅
- **ALL 12 Pillars Protected**: Users must sign in to access any pillar
- **Product Routes Protected**: /cakes, /treats, /celebrate/* all require membership
- **Redirects to /membership**: Non-authenticated users sent to membership page
- **Note**: The Doggy Bakery is the supplier for Celebrate products (not a separate brand)

### FAQs Page Redesigned - COMPLETE ✅
- **Covers All 12 Pillars**: Concierge®, Membership, Celebrate, Dine, Travel, Stay, Care, Enjoy, Fit, Advisory, Paperwork, Emergency
- **Filter Pills**: Quick access to FAQ categories
- **Search**: Search across all pillars
- **Mira AI Integration**: "Ask Mira AI" button at bottom

### Membership Page Enhancement - COMPLETE ✅
- **Pet Soul™ Preview Section**: Bruno's sample profile
- **Gamification & Levels**: 4 doggy-themed membership levels
- **How to Earn Paw Points** guide

### Razorpay Payment Integration - IN PROGRESS 🟡
- **Backend Routes**: `/api/payment/create-order`, `/api/payment/verify`
- **Frontend Component**: `MembershipPayment.jsx`
- **Status**: Infrastructure built, needs E2E testing with test cards

### Admin Content Management - COMPLETE ✅
- **MembershipManager**: Full member CRUD with tier management
- **AboutManager**: Team and dogs management with image upload
- **AboutPage**: Dynamic content from backend

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
- [ ] **Mira Proactive Suggestions**: Check Pet Soul for upcoming events

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

## Files Reference

### Core Files
- `/app/backend/server.py` - Main FastAPI backend
- `/app/frontend/src/App.js` - React router with protected routes
- `/app/frontend/src/pages/Home.jsx` - Concierge-focused landing page
- `/app/frontend/src/pages/FAQs.jsx` - All-pillars FAQ page
- `/app/frontend/src/components/Footer.jsx` - Updated Bangalore address
- `/app/frontend/src/components/Navbar.jsx` - "The Doggy Company" branding
- `/app/frontend/src/components/ProtectedRoute.jsx` - Auth gating component

### Admin Components
- `/app/frontend/src/components/admin/MembershipManager.jsx`
- `/app/frontend/src/components/admin/AboutManager.jsx`

---

## Credentials

- **Admin**: `aditya` / `lola4304`
- **Razorpay**: Test keys in `backend/.env`

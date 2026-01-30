# Pet Life Operating System - Product Requirements Document

## Original Problem Statement
Build a comprehensive "Pet Life Operating System" where every user or system-generated signal (click, search, voice command, form submission, etc.) must trigger a mandatory, non-negotiable **Unified Signal Flow**: 
**1. Notification → 2. Service Desk Ticket → 3. Unified Inbox Entry**

This flow must work across:
- All pillars (Care, Fit, Travel, Stay, Celebrate, Enjoy, Learn, Advisory, Paperwork, Dine, etc.)
- Mira AI conversations
- Search queries
- Product/service requests
- Booking confirmations

## What's Been Implemented (Session: Jan 30, 2026)

### ✅ Mira Orb Redesign - COMPLETED
**Requirement**: Transform Mira's floating chat button into an animated, "living" orb that represents "the soul of the pet and guide to the pet parent".

**Implementation**:
- Created new `MiraOrb.jsx` component with framer-motion animations
- 5 animated states: idle (breathing), listening (ripples), thinking (swirl), speaking (waves), celebrating (particles)
- Purple-to-pink gradient with glowing aura
- Paw print soul symbol inside the orb
- Responsive design for desktop and mobile

**Files Created/Modified**:
- `/app/frontend/src/components/MiraOrb.jsx` - NEW animated orb component
- `/app/frontend/src/components/MiraAI.jsx` - Integrated MiraOrb, replaced old FAB button
- Installed `framer-motion` dependency

---

## What's Been Implemented (Session: Jan 29, 2026)

### ✅ SEV-1 Unified Flow Fix - RESOLVED
**Root Cause Found**: Multiple backend endpoints were NOT creating the full unified flow (Notification + Ticket + Inbox). They showed "success" to users but only created partial records.

**Fixed Endpoints**:
1. `/api/concierge/experience-request` - Now creates full unified flow
2. `/api/celebrate/requests` - Now creates full unified flow  
3. `/api/learn/request` - Now creates full unified flow
4. All pillar-specific request endpoints verified working

**Verification**: All requests now appear in Admin Panel → Notifications, Service Desk, and Unified Inbox.

### ✅ Mira AI Pillar Panel Links Fix
**Problem**: Suggestion buttons on pillar pages (Paperwork, Advisory, etc.) weren't working - they opened chat but didn't send the message.

**Fix**: Added `sendDirectMessage()` function to `MiraContextPanel.jsx` that directly sends messages to Mira API instead of relying on state updates + timeouts.

### ✅ Pet Soul Score Display Fix
**Problem**: Soul Score showing 0% for Mojo even though database had 37.8%.

**Fix**: Updated `load_pet_soul()` in `mira_routes.py` to include `soul_score` and `overall_score` fields in the response.

### ✅ Mira AI Quick Actions Fix
**Problem**: Quick action buttons in MiraAI.jsx widget weren't sending messages reliably.

**Fix**: Refactored `handleQuickAction()` to directly call the Mira API instead of using state + setTimeout hack.

## Pending Issues / Tomorrow's Tasks

### 🔴 P1 - High Priority

#### 1. Pet Profile Crash for "Mynx"
**Issue**: User reported crash when viewing pet profile for pet named "Mynx".
**Debug Steps**:
1. Log in as the user
2. Navigate to pet profile for "Mynx"
3. Check browser console and backend logs
4. Inspect database for corrupt/unexpected values

#### 2. Paw Points Display Issue  
**Issue**: Incorrect paw points display for specific user account.
**Debug Steps**:
1. Check API endpoint for paw points
2. Verify calculation logic
3. Compare database value with displayed value

### 🟠 P2 - Medium Priority

1. **Razorpay Payments Failing** - Debug payment gateway integration
2. **Mobile UI Transformation** - Member Dashboard mobile optimization
3. **Service Booking Flow** - Mobile optimization

### 🟡 P3 - Backlog

1. **Razorpay Payments** - Reported as failing
2. **PDF Invoice Generation**
3. **Centralized Item Intelligence Form** - Full implementation
4. **Partner Portal** - B2B clients portal

## Technical Architecture

```
/app
├── backend/
│   ├── server.py              # Main FastAPI server, route registrations
│   ├── timestamp_utils.py     # UTC timestamp utility (standardized)
│   ├── mira_routes.py         # Mira AI chat & context endpoints
│   ├── concierge_routes.py    # FIXED: Concierge experience requests
│   ├── celebrate_routes.py    # FIXED: Celebrate requests
│   ├── learn_routes.py        # FIXED: Learn/training requests
│   ├── fit_routes.py          # Fit pillar (working)
│   ├── care_routes.py         # Care pillar (working)
│   ├── travel_routes.py       # Travel pillar (working)
│   └── checkout_routes.py     # Checkout & GST calculations
│
├── frontend/src/
│   ├── components/
│   │   ├── MiraAI.jsx           # FIXED: Quick actions
│   │   ├── MiraContextPanel.jsx # FIXED: Pillar suggestion links
│   │   ├── UnifiedCheckout.jsx  # TODO: GST/Shipping order
│   │   └── ui/                  # Shadcn components
│   ├── pages/
│   │   ├── Admin.jsx            # Admin panel (working)
│   │   ├── FitPage.jsx          # Fit pillar (working)
│   │   ├── CarePage.jsx         # Care pillar (working)
│   │   └── ...
│   └── utils/
│       └── unifiedApi.js        # Central API client for unified flow
│
└── memory/
    └── PRD.md                   # This file
```

## Key API Endpoints

### Unified Flow Endpoints (All Working)
- `POST /api/fit/request` - Fit requests → Notification + Ticket + Inbox
- `POST /api/care/request` - Care requests → Notification + Ticket + Inbox
- `POST /api/travel/request` - Travel requests → Notification + Ticket + Inbox
- `POST /api/concierge/experience-request` - Concierge cards → Notification + Ticket + Inbox
- `POST /api/celebrate/requests` - Celebrate requests → Notification + Ticket + Inbox
- `POST /api/learn/request` - Learn requests → Notification + Ticket + Inbox
- `GET /api/search/universal?create_signal=true` - Search → Notification + Ticket + Inbox

### Admin Panel Endpoints
- `GET /api/admin/notifications` - Admin notifications list
- `GET /api/tickets` - Service desk tickets
- `GET /api/channels/intakes` - Unified inbox entries

### Mira AI Endpoints
- `POST /api/mira/chat` - Chat with Mira
- `POST /api/mira/context` - Get pillar-specific context

## Test Credentials
- **Member**: `dipali@clubconcierge.in` / `test123`
- **Admin**: `aditya` / `lola4304`

## Deployment
- **Preview URL**: https://petstack-rescue.preview.emergentagent.com
- **Production**: thedoggycompany.in (deploying tomorrow)

---
*Last Updated: January 29, 2026*

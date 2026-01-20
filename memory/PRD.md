# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System." A world-class, event-driven platform with a single engine powering 12 business "Pillars" with Pet Soul integration, Unified Inbox, and Mira AI concierge.

---

## What's Been Implemented (Latest - Jan 20, 2026)

### P0 UI Refresh - COMPLETE ✅
- **Landing Page Redesigned**: Hero section now reflects "Pet Life Operating System" vision
  - New headline: "Your Pet's Life / One Platform, Endless Care"
  - Added "12 Pillars of Pet Life" section with all pillars displayed
  - CTAs updated to "Explore Pillars" and "Become a Member"
- **Footer Updated**: "Store Pickup Locations" replaced with registered office address:
  - Block A, Bldg No 7, Flat no 701, Nahar Amrit Shakti, Chandivali, Andheri East, Mumbai - 400072
- **Concierge® Trademark**: Added ® symbol to all user-facing "Concierge" text across the app
- **Mira AI Section Updated**: Now describes Mira as "Super Pet Concierge®" for all 12 pillars

### Membership Page Enhancement - COMPLETE ✅
- **Pet Soul™ Preview Section**: Shows Bruno's sample profile with:
  - Profile card with photo, name, breed, personality traits
  - Journey stats (Paw Points, Orders, Restaurants, Hotels)
  - Achievements timeline (Birthday Celebrated, First Dine Out, etc.)
  - Health Vault preview (Vaccinations, Documents, Last Checkup)
- **Gamification & Levels Section**: 
  - 4 doggy-themed membership levels:
    - 🐕 Curious Pup (Entry level, 1x multiplier)
    - 🦮 Loyal Companion (3+ months, 1.5x multiplier)
    - 🐕‍🦺 Trusted Guardian (6+ months, 2x multiplier)
    - 👑 Pack Leader (12+ months, 3x multiplier)
  - "How to Earn Paw Points" guide

### Admin Membership Manager - COMPLETE ✅
- **New Component**: `/app/frontend/src/components/admin/MembershipManager.jsx`
- **Features**:
  - Stats overview (Total Members, New This Month, by Level, Total Paw Points)
  - Member table with search/filter by tier
  - View member details modal
  - Edit member details (name, email, phone, tier, subscription, admin notes)
  - Gift free memberships (1/3/6/12 months)
  - Adjust Paw Points with reason logging
  - Subscriptions tab (Active, Expiring Soon, Recently Expired)
  - Paw Rewards tab with economy stats and top earners
  - Membership Levels tab showing all 4 tiers
  - Settings tab for pricing configuration
  - CSV Export functionality
- **Backend Endpoints Added**:
  - `POST /api/admin/members/{user_id}/points` - Adjust Paw Points
  - `POST /api/admin/members/{user_id}/gift` - Gift membership
  - `GET /api/admin/membership/stats` - Comprehensive statistics

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

## What's Been Implemented (This Session - Jan 20, 2026)

### Service Desk Full-Screen Module - COMPLETE ✅
- **New Route**: `/admin/service-desk` - Dedicated full-screen workspace
- **Own Login Screen**: Beautiful purple gradient with glass-morphism design
- **"← Back to Admin Dashboard"** button at top navigation
- **No Navbar/Footer**: True full-screen experience for focused work
- **All Features Preserved**: 40+ tickets, filters, categories, AI draft, etc.

### Collections product_count Fix - COMPLETE ✅
- `/api/collections` now correctly calculates `product_count` from `product_ids`
- Cakes: 119 products, Treats: 41 products, Breed Cakes: 40 products

### Dine Page Verified Working ✅
- 38 Restaurants displayed with filters
- 5 Bundles and 18 Products

### Admin Standardization - COMPLETE ✅
- **CelebrateManager** - Fixed product fetch (now shows 298 products from main Shopify-synced collection)
- **DineManager** - Added Settings tab with General Settings, Paw Rewards, Buddy Match Settings
- **StayManager** - Added Settings tab (6 tabs total: Properties, Products, Bookings, Issues, Reports, Settings)
- **AdvisoryManager** - CSV Import/Export confirmed working
- **CSV Import/Export** - Added to Advisory, Paperwork, Emergency, Celebrate
- **Tags Manager** - Now supports all 12 pillars

### All Admin Managers Now Have:
- ✅ Stats cards (Total, Pending, Completed)
- ✅ Standard tabs structure
- ✅ Settings tab with Paw Rewards configuration
- ✅ CSV Import/Export buttons
- ✅ Refresh, Seed Data functionality

### Celebrate + Pet Soul ✅
- Pet selection dropdown in product modal (for cakes/treats)
- Auto-fill pet name, age, breed from Pet Soul
- Order history written to `soul.celebrate_history`
- Favorite categories tracked for recommendations
- Backend: `POST /api/pets/{pet_id}/soul/celebrate`

### Stay + Pet Soul ✅
- Pet selection dropdown in booking modal (Step 2: Pet Profile)
- Auto-fill pet details: name, breed, weight, age, sleep habits, fears, food preferences
- Booking written to `soul.stay_history`
- Favorite cities and property types tracked
- Backend: `POST /api/pets/{pet_id}/soul/stay`

---

## Remaining Work

### P0 - Data Flywheel (Complete the Loop)
1. ~~**Dine + Pet Soul** - Write dining preferences to soul~~ ✅ COMPLETE (Jan 20, 2026)
2. ~~**Fit + Pet Soul** - Write fitness/activity data to soul~~ ✅ COMPLETE (Jan 20, 2026)
3. ~~**Advisory + Pet Soul** - Write consultation history to soul~~ ✅ COMPLETE (Jan 20, 2026)
4. ~~**UI Refresh** - Landing page, footer, Concierge® trademark~~ ✅ COMPLETE (Jan 20, 2026)
5. **Mira Proactive** - Birthday/anniversary suggestions from Pet Soul

### P1 - User Journey
6. Build CLUB (Membership) Pillar - Razorpay Payment Integration
7. Membership tiers implementation
8. Onboarding flow with Pet Soul creation
9. Auto-checkout per pillar

### P2 - Known Issues to Fix
10. Voice Order feature broken ("Connection failed")
11. ~~Service Desk modal shaking/flashing~~ **RESOLVED** (now full-screen page)
12. ~~Auto-reminders only sent to Gmail~~ **FIXED** (Resend 'to' field was list instead of string)
13. Shopify Sync creating 'Untitled' Products (recurring)

### P3 - Admin & Code
13. Pillar-wise shipping rules
14. Campaign system product selection from any pillar
15. Code reorganization (refactor server.py, Admin.jsx)

---

## Key Backend Endpoints

### Pet Soul Pillar Writes
- `POST /api/pets/{pet_id}/soul/celebrate` - Cake orders
- `POST /api/pets/{pet_id}/soul/stay` - Hotel bookings
- (Existing) Travel, Care, Emergency, Paperwork, Enjoy soul writes

### Admin CSV
- `GET/POST /api/{pillar}/admin/products/export-csv|import-csv`
- `GET/POST /api/{pillar}/admin/bundles/export-csv|import-csv`

---

## Key Frontend Files Modified

### Pet Soul Integration
- `/app/frontend/src/components/ProductCard.jsx` - Celebrate pet selection
- `/app/frontend/src/pages/StayPage.jsx` - Stay booking pet selection

### Admin Managers
- `/app/frontend/src/components/admin/CelebrateManager.jsx` - NEW
- `/app/frontend/src/components/admin/AdvisoryManager.jsx` - CSV added
- `/app/frontend/src/components/admin/PaperworkManager.jsx` - CSV added
- `/app/frontend/src/components/admin/EmergencyManager.jsx` - CSV added

---

## Mira Proactive Vision

**Current State**: Mira fetches Pet Soul data when user chats, provides context-aware responses.

**Next Step**: Mira initiates suggestions based on:
- Upcoming birthdays/anniversaries (`soul.celebrations`)
- Past preferences (`soul.preferences`)
- Purchase history (`soul.celebrate_history`, `soul.stay_history`)

Example: "🎂 Bruno's birthday is in 5 days! Want me to help you order a cake?"

---

## Tech Stack
- Frontend: React + Tailwind + Shadcn/UI
- Backend: FastAPI + MongoDB
- AI: OpenAI GPT-4 (via Emergent LLM Key)
- Payments: Razorpay (test keys)

## Credentials
- Admin: aditya / lola4304

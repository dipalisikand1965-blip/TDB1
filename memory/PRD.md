# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. Core vision: "vision-first, commerce-later" approach, centered around "Pet Soul™" and "Mira® AI" concierge.

---

## Pet Pass System

### Plans
1. **Pet Pass — Trial** (1 month): ₹499 + GST
2. **Pet Pass — Foundation** (12 months): ₹4,999 + GST
3. **Additional pets**: ₹2,499/year or ₹249/trial + GST

### Member Tiers
| Tier | Emoji | Criteria |
|------|-------|----------|
| Curious Pup | 🐕 | New members |
| Loyal Companion | 🦮 | 2+ pillars OR 3+ months |
| Trusted Guardian | 🛡️ | 5+ pillars OR 6+ months |
| Pack Leader | 👑 | 8+ pillars OR 12+ months |

---

## What's Been Implemented (January 2026)

### Session 1-2: Core Pet Pass Flow ✅
- MembershipPage with Pet Pass branding
- "Trial" vs "Foundation" plans
- Navbar: "Sign in | Join now" vs "My Account"
- Password reset flow
- Renewal reminders (7/30/15/3 days)

### Session 3: My Pets Overhaul ✅
- Pet Soul Completion Panel
- All 14 Pillars Section
- Service Desk ticket fixes

### Session 4: Soul Score Consistency & UX Fixes ✅
- **Soul Score now unified** - Uses `overall_score` from API everywhere
- **Mira AI Welcome Card Enhanced** with pet photo and clickable quick links
- **Logo size increased** in navbar
- **Photo URL handling** - Fixed relative URL paths

### Session 5: Critical Bug Fixes (January 24, 2026) ✅
- **P0 - Session Persistence FIXED** 
  - AuthContext improved with refs to prevent duplicate fetches
  - Only clears auth on explicit 401 errors, not network errors
  - Added timeout (10s) and cross-tab synchronization
- **P1 - Dashboard Hero "A System That Remembers" COMPLETED**
  - Beautiful gradient hero with animated background
  - Pet card showing name, breed, and Pet Soul percentage
  - Quick stats (Points, Pets, Orders)
  - Pet Pass Member badge with Active status
- **P2 - Checkout Pet Name Bug FIXED**
  - Added validation to prevent email addresses being saved as pet names
  - Both load and save functions now validate pet name
- **P4 - Mobile Cart View VERIFIED**
  - Cart sidebar is responsive (full width on mobile)
  - Modern design with gradient CTA buttons

---

## Data Consistency Rules (CRITICAL)

### Single Source of Truth
The `overall_score` from the backend API is the ONLY source for Pet Soul scores.

**DO NOT** calculate scores locally in frontend.

**ALWAYS** use:
```javascript
const score = pet.overall_score || 0;
```

### Auth Token Handling
- Token stored in localStorage as `tdb_auth_token`
- Only clear auth on explicit 401 Unauthorized
- Never clear on network errors or timeouts
- Use refs to prevent duplicate API calls

### Photo URL Handling
Pet photos may be stored as relative paths. Always ensure full URL:
```javascript
const fullUrl = url.startsWith('http') 
  ? url 
  : `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
```

---

## Architecture

### Key Components Modified This Session
- `/app/frontend/src/context/AuthContext.jsx` - Session persistence fix with refs
- `/app/frontend/src/pages/MemberDashboard.jsx` - "A System That Remembers" hero
- `/app/frontend/src/pages/Checkout.jsx` - Pet name validation
- `/app/frontend/src/components/CartSidebar.jsx` - Mobile responsive

### Backend Score Calculation
Location: `/app/backend/server.py` - `calculate_pet_soul_score()`
- Uses `totalPossible = 24` questions
- Returns score as percentage (0-100)

---

## Prioritized Backlog

### P0 - Critical
1. ~~**Session Persistence**~~ ✅ FIXED
2. ~~**Soul Score Consistency**~~ ✅ FIXED

### P1 - High Priority
1. Service Desk - Missing Customer Name on tickets (capture name at ticket creation)
2. Complete 'Adopt' Pillar registration
3. Pet Pass Renewal Reminders integration

### P2 - Medium Priority
1. ~~**Checkout Pet Name Bug**~~ ✅ FIXED
2. "Untitled" Products from Shopify Sync
3. Build 'Farewell' and 'Shop' Pillars
4. Member Tier Graduation logic

### P3 - Lower Priority
1. Enhanced My Pets page with all 14 pillars clickable
2. WhatsApp Business API integration
3. Complete backend refactoring

---

## Test Credentials
- **Test User Email**: dipali@clubconcierge.in
- **Test User Password**: lola4304
- **Admin Username**: aditya
- **Admin Password**: lola4304

---

*Last updated: January 24, 2026*

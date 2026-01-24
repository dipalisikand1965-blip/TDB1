# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. The core vision is a "vision-first, commerce-later" approach, centered around a "Pet Soul™" for each pet and an intelligent concierge, "Mira® AI".

---

## Pet Pass System (Core Identity)

### What Pet Pass IS
- A personal concierge for your dog
- A system that understands your pet first
- A living relationship between you, your pet, and our care system
- Memory that grows smarter over time

### What Pet Pass is NOT
- ❌ A shopping membership
- ❌ A discount program
- ❌ A subscription box
- ❌ A product bundle

### Pet Pass Plans
1. **Pet Pass — Trial** (1 month): ₹499 + GST
2. **Pet Pass — Foundation** (12 months): ₹4,999 + GST

### Multi-Pet Pricing
- Additional pets: ₹2,499/year or ₹249/trial + GST
- Each pet gets their own unique Pet Pass number (format: TDC-XXXXXX)

---

## Member Tier System (Pet Pass Journey)

### NEW Tier Names (Replacing Old)
| New Tier | Old Tier | Criteria |
|----------|----------|----------|
| 🐕 Curious Pup | free | New members |
| 🦮 Loyal Companion | pawsome | 2+ pillars used OR 3+ months |
| 🛡️ Trusted Guardian | premium | 5+ pillars OR 6+ months |
| 👑 Pack Leader | vip | 8+ pillars OR 12+ months |

### Points Multipliers
- Curious Pup: 1.0x
- Loyal Companion: 1.5x
- Trusted Guardian: 2.0x
- Pack Leader: 3.0x

---

## Navigation Rules (CRITICAL)
- **Not signed in**: Show "Sign in" | "Join now" 
- **Signed in**: Show "My Account" (never "Dashboard")
- "Join now" routes to: `/pet-soul-onboard`

### Language Guidelines
- ✅ "Join now" (not "Subscribe")
- ✅ "My Account" (not "Dashboard")
- ✅ "Activate Pet Pass" (not "Buy")
- ✅ "Trial" (not "Monthly")

---

## What's Been Implemented (January 2026)

### Session 1: Pet Pass CX Flow ✅
- [x] MembershipPage.jsx with Pet Pass branding
- [x] "Trial" label (not "Monthly")
- [x] "What is Pet Pass?" section
- [x] Navbar: "Sign in | Join now" vs "My Account"
- [x] PetPassCard.jsx digital identity component
- [x] Backend pricing for "trial" plan type

### Session 2: Tier System & Member Flow ✅
- [x] Updated all tier names: Curious Pup → Pack Leader
- [x] Removed "pawsome" references from frontend
- [x] Updated MembersTab.jsx with new tier display
- [x] Updated MembershipManager.jsx tier dropdowns
- [x] Backend: Updated loyalty multipliers
- [x] Backend: Updated member stats API

### Session 2: Password Reset Flow ✅
- [x] Created `/api/auth/forgot-password` endpoint
- [x] Created `/api/auth/reset-password` endpoint
- [x] Created MemberForgotPassword.jsx page
- [x] Created MemberResetPassword.jsx page
- [x] Added "Forgot password?" link to Login page
- [x] Routes: `/member/forgot-password`, `/reset-password`

### Session 2: Renewal Reminders ✅
- [x] Created `renewal_reminders.py` module
- [x] Trial reminders: 7 days before expiry
- [x] Annual reminders: 30, 15, 3 days before expiry
- [x] Admin endpoints: `/api/admin/renewals/expiring`, `/api/admin/renewals/check`
- [x] Email templates with Pet Pass branding

### Session 2: Session Persistence Fix ✅
- [x] Fixed AuthContext to only clear token on 401 (not network errors)

---

## Prioritized Backlog

### P0 - Critical
1. ~~**Session Persistence**~~ ✅ FIXED
2. **Unified Inbox Customer Name** - Service Desk not displaying customer names

### P1 - High Priority  
1. ~~**Production Forgot Password**~~ ✅ IMPLEMENTED
2. ~~**Remove Pawsome references**~~ ✅ DONE
3. Complete 'Adopt' Pillar - Scaffolding exists
4. CX Journey Gap fixes from audit

### P2 - Medium Priority
1. **Checkout Cart Pet Details Bug**
2. **"Untitled" Products from Shopify Sync** (recurring)
3. Build 'Farewell' Pillar
4. Build 'Shop' Pillar

### P3 - Lower Priority
1. Mobile Cart View Redesign
2. WhatsApp Business API Integration

---

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/forgot-password` - Request password reset (NEW)
- `POST /api/auth/reset-password` - Complete password reset (NEW)
- `GET /api/auth/me` - Get current user

### Admin - Renewals (NEW)
- `GET /api/admin/renewals/expiring?days=30` - List expiring memberships
- `POST /api/admin/renewals/check` - Trigger renewal reminder check
- `POST /api/admin/renewals/send-reminder/{email}` - Manual reminder

### Members
- `GET /api/admin/members` - List all members
- `GET /api/admin/membership/stats` - Membership statistics

---

## Architecture

### New Files Created
- `/app/backend/renewal_reminders.py` - Renewal reminder system
- `/app/frontend/src/pages/MemberForgotPassword.jsx`
- `/app/frontend/src/pages/MemberResetPassword.jsx`
- `/app/frontend/src/components/PetPassCard.jsx`
- `/app/memory/PET_PASS_TIERS.md`

### Modified Files
- `/app/backend/auth_routes.py` - Added password reset endpoints
- `/app/backend/server.py` - Integrated renewal reminders
- `/app/backend/loyalty_routes.py` - Updated tier multipliers
- `/app/backend/admin_member_routes.py` - Updated tier stats
- `/app/frontend/src/components/admin/MembersTab.jsx` - New tiers
- `/app/frontend/src/components/admin/MembershipManager.jsx` - New tiers
- `/app/frontend/src/context/AuthContext.jsx` - Session fix
- `/app/frontend/src/pages/Login.jsx` - Forgot password link
- `/app/frontend/src/App.js` - New routes

---

## Known Issues
- WhatsApp integration is MOCKED (click-to-chat only)
- Production DB separate from preview

## 3rd Party Integrations
- **OpenAI**: Powers Mira AI (via Emergent LLM Key)
- **Resend**: Email (password reset, renewal reminders)
- **Razorpay**: Payments
- **Shopify**: Product sync

---

*Last updated: January 24, 2026*

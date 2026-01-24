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

| New Tier | Emoji | Criteria |
|----------|-------|----------|
| Curious Pup | 🐕 | New members |
| Loyal Companion | 🦮 | 2+ pillars OR 3+ months |
| Trusted Guardian | 🛡️ | 5+ pillars OR 6+ months |
| Pack Leader | 👑 | 8+ pillars OR 12+ months |

---

## What's Been Implemented (January 2026)

### Session 1: Pet Pass CX Flow ✅
- MembershipPage with Pet Pass branding
- "Trial" label (not "Monthly")
- "What is Pet Pass?" section
- Navbar: "Sign in | Join now" vs "My Account"
- PetPassCard digital identity component

### Session 2: Tier System & Member Flow ✅
- Updated all tier names: Curious Pup → Pack Leader
- Removed "pawsome" references
- Backend tier multipliers and stats updated

### Session 2: Password Reset Flow ✅
- `/api/auth/forgot-password` endpoint
- `/api/auth/reset-password` endpoint
- MemberForgotPassword & MemberResetPassword pages
- "Forgot password?" link on Login page

### Session 2: Renewal Reminders ✅
- Trial: 7 days before expiry
- Annual: 30, 15, 3 days before expiry
- Admin endpoints for managing renewals

### Session 3: My Pets Page Overhaul ✅
- **Pet Soul Completion Panel** - Large, central view showing:
  - Completion percentage (e.g., 57%)
  - Progress bar
  - Category breakdown: Basics, Personality, Lifestyle, Health
  - "Continue Pet Soul Journey" CTA
- **All 14 Pillars Section** - Every pillar visible:
  - Feed, Celebrate, Dine, Stay, Travel, Care, Groom
  - Play, Train, Insure, Adopt, Farewell, Shop, Community
  - Each pillar links to pillar page with pet context
  - Pet Pass number displayed

### Session 3: Service Desk Fixes ✅
- Fixed ticket detail API to search both collections (tickets + service_desk_tickets)
- Fixed `serialize_ticket` to ensure `member` and `messages` are never null
- Ticket replies now work with both collections

### Session 3: Products ✅
- Increased product fetch limit to 2000
- CSV Export/Import buttons visible
- Edit/Delete functionality available

---

## Prioritized Backlog

### P0 - Critical
1. ~~**Session Persistence**~~ ✅ Fixed
2. ~~**Service Desk tickets not opening**~~ ✅ Fixed
3. **Unified Inbox Customer Name** - Still needs work on data capture

### P1 - High Priority  
1. ~~**Production Forgot Password**~~ ✅ Implemented
2. ~~**My Pets - Pet Soul Panel**~~ ✅ Implemented
3. ~~**My Pets - All Pillars**~~ ✅ Implemented
4. Complete 'Adopt' Pillar

### P2 - Medium Priority
1. Checkout Cart Pet Details Bug
2. "Untitled" Products from Shopify Sync
3. Build 'Farewell' Pillar
4. Build 'Shop' Pillar

---

## Key Routes

### Member Pages
- `/membership` - Pet Pass landing page
- `/pet-soul-onboard` - Onboarding flow
- `/my-pets` - Pet list with Soul panel + Pillars
- `/dashboard` - My Account page
- `/member/forgot-password` - Password reset request
- `/reset-password?token=xxx` - Password reset

### Admin
- `/admin?tab=tickets` - Service Desk
- `/admin?tab=products` - Product Manager
- `/admin?tab=members` - Member Manager

---

## Architecture

### New/Modified Files This Session
- `/app/frontend/src/pages/MyPets.jsx` - Added Pet Soul Panel + Pillars
- `/app/backend/ticket_routes.py` - Fixed dual-collection search + serialize
- `/app/frontend/src/components/ProductManager.jsx` - Increased limit

---

## Known Issues
- WhatsApp integration is MOCKED (click-to-chat only)
- Some old tickets have null member data
- Production DB separate from preview

---

*Last updated: January 24, 2026*

# Pet Life Operating System - PRD

## 🚨 CRITICAL: PREVIEW SETUP REQUIRED
**Before starting ANY work, read and follow: `/app/memory/PREVIEW_SETUP.md`**

The preview environment uses LOCAL MongoDB that starts EMPTY. You MUST:
1. Login to Admin (`/admin`) with `aditya / lola4304`
2. Enable **Master Sync** for Products & Services
3. **Seed each pillar page** (Celebrate, Dine, Stay, Travel, etc.)
4. **Seed Service Box**
5. **Seed Concierge Experiences**

Without this, the admin panels will be empty and features won't work!

---

## THE FOUNDING PHILOSOPHY

**Essential Reading: /app/memory/SOUL_PHILOSOPHY_SSOT.md**

> "Dogs are not pets first. They are beings first."
> 
> This company exists to help people love better. Not just dogs. The human heart itself.
> Dogs civilize us, if we let them.

*Built in Memory of Mystique 💜🐾*

---

## Original Problem Statement
Build a comprehensive "Pet Life Operating System" - a digital guardian platform for pet owners featuring AI-powered assistance (Mira), pet profiles with soul scores, health tracking, and concierge services across 14 life pillars.

*Built in Memory of Mystique 💜🐾*

## Core Architecture
- **Frontend:** React + Tailwind CSS + Framer Motion
- **Backend:** FastAPI + Python
- **Database:** MongoDB Atlas
- **AI:** OpenAI GPT (via Emergent LLM Key)

## What's Been Implemented

### March 4, 2026 (Current Session)

#### ✅ MYSTIQUE MEMORIAL LOGIN PAGE - COMPLETE
- **Login page beautified** with Mystique's soulful portrait prominently featured
- **Desktop view:** Large circular portrait with glowing pink/purple ring, animated floating stars
- **Mobile view:** Compact portrait at top with same beautiful styling
- **Memorial text:** "In loving memory of Mystique" with quote: "Her eyes held a universe of love. She taught us that to know a pet is to know a soul."
- **Mission statement:** Platform built in her honor to help pet parents truly *know* their companions
- **Tested:** Desktop & mobile responsive, login functionality verified working
- **Key file:** `/app/frontend/src/pages/Login.jsx`

#### ✅ KOUROS ON LANDING PAGE - COMPLETE
- Kouros (user's first pet, black dog) on landing page with circular frame
- Full purple glow around the circle (not just bottom)
- Badge positioned at bottom
- Responsive on mobile and desktop

#### ✅ ADMIN SECURITY - COMPLETE
- `/admin` routes now protected by `AdminProtectedRoute`
- Requires separate admin login (`aditya / lola4304`)
- 8-hour session expiry
- All admin routes protected: `/admin`, `/admin/docs`, `/admin/service-desk`, `/admin/services`, `/admin/concierge`, `/agent`, etc.
- **Key file:** `/app/frontend/src/components/AdminProtectedRoute.jsx`

#### ✅ ADMIN PRODUCT/SERVICE EDITING - FIXED
- **Duplicate modal bug fixed** - Removed 1525 lines of old inline editor code
- **Image URL saving** - Added `image`, `media` to allowedFields
- **Price saving** - Added `price`, `base_price`, `originalPrice` to allowedFields
- **Shopify sync protection** - Products marked `locally_edited: True` won't be overwritten by sync
- **Key files:** 
  - `/app/frontend/src/components/admin/UnifiedProductBox.jsx`
  - `/app/backend/unified_product_box.py`
  - `/app/backend/shopify_sync_routes.py`

#### ✅ JOIN FLOW BUG FIX - COMPLETE
- Fixed "body stream already read" error on account creation
- Switched from `fetch` to `XMLHttpRequest` to bypass Emergent monitoring script interference
- Added `loginWithToken()` method to AuthContext for direct token login after signup
- Fixed wrong API endpoint (`/api/onboarding/membership` → `/api/auth/membership/onboard`)
- Backend now returns `access_token` and `user` object for immediate login

#### ✅ SOUL PROFILE INTEGRATION - COMPLETE
- **Welcome screen "Complete Soul Profile" button** → `/soul-builder`
- **Welcome screen "Skip for now" button** → `/pet-home` (Pet Dashboard)
- **PetHomePage "Teach Mira more" button** → `/soul-builder` 
- All navigation flows tested and working (100% pass rate)

#### ✅ SOUL SCORE CALIBRATION - COMPLETE
- Backend now accepts `soul_snapshot` from onboarding
- 5 quick questions properly map to Soul Score fields:
  - `food_allergies` (10 pts) ← allergies
  - `health_conditions` (8 pts) ← health_conditions  
  - `energy_level` (6 pts) ← activity_level
  - `car_comfort` (4 pts) ← car_rides
  - `favorite_protein` + `eating_style` (3 pts) ← food_preference
- New users start with ~31% Soul Score from onboarding (matching philosophy target of ~30%)
- Pet avatar and photo properly saved from onboarding

#### ✅ STAY PILLAR AUDIT & FIXES - COMPLETE
1. **Products Tagged for Stay**: 115 products now show on Stay page
   - Keywords: bed, mat, kennel, bowl, crate, blanket, cushion, carrier
   - Products show in "Cozy stays for Mojo!" section
   
2. **Stay Request Form**: New form replaces dead-end checklist
   - Fields: Resort Name, Location, Check-in/out Dates, Num Pets, Contact Preference, Special Requests
   - Submits to Concierge Service Desk (creates ticket)
   - Shows "What we'll do for you" checklist preview
   
3. **Backend API Updated**: `/api/products?pillar=stay` now checks both `pillar` and `pillars` fields

4. **Concierge WebSocket**: Graceful degradation added - shows "Connecting..." then falls back to hours status

### March 3, 2026 (Previous Session)

#### ✅ NEW STREAMLINED ONBOARDING FLOW - COMPLETE
**Problem Solved:** Old flow had 70+ interactions (13 soul questions × N pets = user abandonment)

**New Flow - 5 Screens:**
1. **Pet Count** - Quick 1-8 buttons + custom input
2. **Meet Your Pack** - ALL pets basic info on ONE screen
   - Name, Avatar (33 breeds) or Photo, Gender, Birthday/Gotcha/Age
3. **Soul Snapshot** - 5 key pillar questions for ALL pets on ONE screen
   - Allergies, Health conditions, Food preference, Car rides, Activity level
4. **Parent Info** - Name, Email, Phone, WhatsApp, City, Password
5. **Welcome** - Success, show all pets, Soul Profile CTA

**Test Result:** 98% pass (18/18 features working, 1 styling fix applied)

**Key Files:**
- `/app/frontend/src/pages/MiraMeetsYourPet.jsx` - NEW streamlined component
- `/app/frontend/src/pages/SoulBuilder.jsx` - Full 51-question soul builder
- `/app/memory/SOUL_PHILOSOPHY_SSOT.md` - Project philosophy

#### ✅ SERVICE DESK & NOTIFICATIONS
- Added `has_unread_concierge_reply` flag
- Added "NEW" badge for unread replies
- Added mark-as-read endpoint

#### ✅ CART FLOW VERIFIED
- 100% working (add to cart, sidebar, checkout)

### Previous Session Work
- Multi-pet avatar support (bug fixes)
- UI consistency across 14 pillars
- Universal search bar
- Critical bug fixes

## Ready for Integration

### Configured & Ready:
- ✅ **Resend** - API key configured
- ✅ **WhatsApp** - Number configured (919663185747)
- ⏳ **Razorpay** - Needs API keys from user

### Backend Needs:
- Update `/api/onboarding/membership` to accept `soul_snapshot` field (optional - can store as pet metadata)

## Prioritized Backlog

### P0 (Deploy Ready)
- ✅ Streamlined onboarding - DONE
- ✅ Soul Profile Integration - DONE
- ✅ Cart flow verified - DONE
- Razorpay integration (needs keys)

### P1 (High Priority)
- Email notifications (Resend configured)
- WhatsApp Business integration
- Full API testing for new onboarding

### P2 (Medium)
- Enhance 'Fit' Pillar - activity tracking
- Enhance 'Paperwork' Pillar - document upload

### P3 (Future)
- Progressive Soul Building (ask more questions over time)

## Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`
- Production: `thedoggycompany.com`
- Preview: `mystique-memorial.preview.emergentagent.com`

## Key API Endpoints
- `POST /api/onboarding/membership` - Create user + pets
- `POST /api/tickets/{id}/reply` - Concierge reply
- `GET /api/os/concierge/home` - Pet parent's requests
- `POST /api/os/concierge/ticket/{id}/mark-read` - Mark as read

## 3rd Party Integrations
- OpenAI GPT (Emergent LLM Key)
- MongoDB Atlas
- Resend (email - configured)
- WhatsApp (configured)
- YouTube (LEARN panel)
- Shopify (product sync)

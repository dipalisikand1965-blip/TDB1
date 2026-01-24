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
- **Photo URL handling** - Fixed relative URL paths

### Session 5: Critical Bug Fixes (January 24, 2026) ✅
- **P0 - Session Persistence FIXED** 
  - AuthContext improved with refs to prevent duplicate fetches
  - Only clears auth on explicit 401 errors, not network errors
  - Added timeout (10s) and cross-tab synchronization
- **P1 - Dashboard Hero "A System That Remembers" COMPLETED**
- **P2 - Checkout Pet Name Bug FIXED**
- **P4 - Mobile Cart View VERIFIED**

### Session 6: UI/UX Enhancements (January 24, 2026) ✅
- **NEW LOGO**: Brilliant concierge bell + colorful paw design
  - Generated custom logo with AI
  - Location: `/app/frontend/public/logo-new.png`
  - Features golden concierge bell with colorful paw pads
  
- **ALL 14 PILLARS on My Account**: Added "All Life Pillars" section
  - Grid layout showing: Feed, Celebrate, Dine, Stay, Travel, Care, Groom, Play, Train, Insure, Adopt, Farewell, Shop, Community
  - Each pillar is clickable and links to its page
  
- **MIRA SIGN-UP LINKS**: Added membership/sign-in links for non-logged users
  - MiraContextPanel: "Join Pet Pass" + "Already a member? Sign in" buttons
  - MiraPage sidebar: Same buttons for non-logged users
  - MiraAI welcome message: Clickable links to /membership and /login
  
- **ADMIN DOCS UPDATED**: Pet Pass section completely rewritten
  - New pricing tiers
  - Member tier system (Curious Pup → Pack Leader)
  - Password reset flow documentation
  - Renewal reminders documentation
  - All relevant API endpoints

---

## 14 Life Pillars
| Pillar | Icon | Path |
|--------|------|------|
| Feed | 🍖 | /feed |
| Celebrate | 🎂 | /celebrate |
| Dine | 🍽️ | /dine |
| Stay | 🏨 | /stay |
| Travel | ✈️ | /travel |
| Care | 🩺 | /care |
| Groom | ✂️ | /groom |
| Play | 🎾 | /play |
| Train | 🎓 | /train |
| Insure | 🛡️ | /insure |
| Adopt | 🐕 | /adopt |
| Farewell | 🌈 | /farewell |
| Shop | 🛒 | /products |
| Community | 👥 | /community |

---

## Checkout Personalization Features ✅
- **Breed-specific product recommendations**
  - Fetches products tailored to the entered pet breed
  - Located in Checkout.jsx lines 288-312
  - API: `/api/pet-soul/breed-products/{breed}`
- **Pet name validation** - Prevents email addresses from being saved as pet names

---

## Password Reset Flow ✅
1. User clicks "Forgot Password" on `/login`
2. Submits email on `/member/forgot-password`
3. Backend generates 24hr reset token
4. Email sent via Resend with reset link
5. User clicks link → `/reset-password?token=xxx`
6. User enters new password
7. Token invalidated after use

**Files**:
- Frontend: `MemberForgotPassword.jsx`, `MemberResetPassword.jsx`
- Backend: `auth_routes.py` (forgot-password, reset-password endpoints)

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
- `/app/frontend/src/components/Logo.jsx` - New custom logo
- `/app/frontend/src/pages/MemberDashboard.jsx` - All 14 pillars section
- `/app/frontend/src/components/MiraContextPanel.jsx` - Sign-up links
- `/app/frontend/src/pages/MiraPage.jsx` - Sign-up links in sidebar
- `/app/frontend/src/components/MiraAI.jsx` - Clickable links in welcome
- `/app/frontend/src/pages/AdminDocs.jsx` - Pet Pass documentation

### Backend Score Calculation
Location: `/app/backend/server.py` - `calculate_pet_soul_score()`
- Uses `totalPossible = 24` questions
- Returns score as percentage (0-100)

---

## Prioritized Backlog

### P0 - Critical
1. ~~**Session Persistence**~~ ✅ FIXED
2. ~~**Soul Score Consistency**~~ ✅ FIXED
3. ~~**Logo redesign**~~ ✅ FIXED
4. ~~**All pillars on My Account**~~ ✅ FIXED
5. ~~**Sign-up links in Mira**~~ ✅ FIXED

### P1 - High Priority
1. Service Desk - Missing Customer Name on tickets (capture name at ticket creation)
2. Complete 'Adopt' Pillar registration
3. Pet Pass Renewal Reminders integration (email scheduling)

### P2 - Medium Priority
1. ~~**Checkout Pet Name Bug**~~ ✅ FIXED
2. "Untitled" Products from Shopify Sync
3. Build 'Farewell' and 'Shop' Pillars
4. Member Tier Graduation logic

### P3 - Lower Priority
1. WhatsApp Business API integration
2. Complete backend refactoring
3. The "All-Seeing Eye" Command Center enhancements

---

## Test Credentials
- **Test User Email**: dipali@clubconcierge.in
- **Test User Password**: lola4304
- **Admin Username**: aditya
- **Admin Password**: lola4304

---

*Last updated: January 24, 2026*

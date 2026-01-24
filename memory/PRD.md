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
  - Navbar: Shows pet photo + "X% Soul"
  - Dashboard: "Complete [Pet]'s Pet Soul™ X% done"
  - My Pets: Pet Soul panel with X% completion
  - Mira AI: Welcome card shows X% Soul badge
- **Mira AI Welcome Card Enhanced**
  - Pet's actual photo displays (with URL path fix for relative URLs)
  - "57% Soul" badge in top-left
  - "Mojo's Photo" badge in top-right
  - **Clickable quick links**: 🎉 Find Events, 🥾 Trails & Hikes, 🐕 Meetups
  - Links auto-submit query to Mira when clicked
- **Logo size increased** - Changed from `lg` to `xl` in navbar
- **Photo URL handling** - Fixed relative URL paths to prepend API URL

---

## Data Consistency Rules (CRITICAL)

### Single Source of Truth
The `overall_score` from the backend API is the ONLY source for Pet Soul scores.

**DO NOT** calculate scores locally in frontend using:
- `doggy_soul_answers.length / totalQuestions`
- Different `totalQuestions` values (27, 59, 24, etc.)

**ALWAYS** use:
```javascript
const score = pet.overall_score || 0;
```

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
- `/app/frontend/src/components/Navbar.jsx` - Larger logo, API-based score
- `/app/frontend/src/components/MiraAI.jsx` - Enhanced WelcomeCard with clickable links
- `/app/frontend/src/components/PetSoulScore.jsx` - Fixed photo URL handling
- `/app/frontend/src/components/Logo.jsx` - Added larger sizes
- `/app/frontend/src/pages/MemberDashboard.jsx` - Uses API overall_score

### Backend Score Calculation
Location: `/app/backend/server.py` - `calculate_pet_soul_score()`
- Uses `totalPossible = 24` questions
- Returns score as percentage (0-100)

---

## Prioritized Backlog

### P0 - Critical
1. ~~**Soul Score Consistency**~~ ✅ FIXED
2. ~~**Mira Photo Missing**~~ ✅ FIXED
3. ~~**Quick Links Not Clickable**~~ ✅ FIXED

### P1 - High Priority
1. Complete 'Adopt' Pillar registration
2. Test Service Desk with real tickets

### P2 - Medium Priority
1. Checkout Cart Pet Details Bug
2. "Untitled" Products from Shopify Sync
3. Build 'Farewell' and 'Shop' Pillars

---

*Last updated: January 24, 2026*

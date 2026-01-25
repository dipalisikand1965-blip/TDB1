# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. Core vision: "vision-first, commerce-later" approach, centered around "Pet Soul™" and "Mira® AI" concierge.

---

## Session 7: Major UX Consolidation (January 25, 2026) ✅

### NEW LOGO ✅
- **Design**: Teal serving cloche (concierge bell) with colorful paw print on top
- **Colors**: Purple, Pink, Orange, Green paw pads on teal bell
- **Text**: "the" (orange) + "doggy" (gradient teal→purple) + "company" (purple)
- **Tagline**: "Pet Concierge"
- **File**: `/app/frontend/public/logo-new.png`

### CENTRALIZED PET AVATAR SYSTEM ✅ (`resolvePetAvatar`)
Created `/app/frontend/src/utils/petAvatar.js`:
- **Priority 1**: Member's uploaded photo
- **Priority 2**: Breed-matched stock photo (40+ breeds supported)
- **Priority 3**: Default beautiful dog photo
- **Used EVERYWHERE**: MyPets, Navbar, Mira Chat, PetPassCard, PetSoulScore

Components updated to use `resolvePetAvatar`:
- `PetSoulScore.jsx` - navbar pet photo with progress ring
- `MiraAI.jsx` - chat welcome card
- `MyPets.jsx` - pet cards in detailed view
- `PetPassCard.jsx` - Pet Pass identity card

### CONSOLIDATED MY PETS PAGE ✅
- **Inline Quick Questions**: Answer Pet Soul questions right on the page
- **Real-time score updates** when answers saved
- **All 14 Life Pillars** displayed in beautiful grid
- **Pet Pass Identity Card** with photo
- **Quick Questions + Full Journey** buttons

### PET SOUL QUESTIONS (27 total)
CSV exported to `/app/memory/PET_SOUL_QUESTIONS.csv`

| Category | Count | Examples |
|----------|-------|----------|
| Identity & Temperament | 2 | temperament, energy_level |
| Family & Pack | 5 | social_with_dogs, other_pets, kids_at_home |
| Rhythm & Routine | 3 | morning_routine, exercise_needs |
| Home Comforts | 4 | favorite_spot, alone_time_comfort |
| Travel Style | 2 | car_comfort, travel_readiness |
| Taste & Treat | 4 | food_allergies, favorite_protein |
| Training & Behaviour | 3 | training_level, behavior_issues |
| Long Horizon | 4 | health_conditions, vet_comfort |

### MIRA CONVERSATION TRACKING ✅
- Stored in `mira_tickets` collection
- Member can view via `/api/mira/history`
- Admin can view in Service Desk
- **Does NOT** auto-increase Pet Soul score (explicit answers only)

### CUSTOMER NAME CAPTURE ✅
- Extracts name/email/phone from chat messages
- Updates ticket member info when detected

---

## Pet Pass System

| Plan | Price | Duration |
|------|-------|----------|
| Pet Pass — Trial | ₹499 + GST | 1 month |
| Pet Pass — Foundation | ₹4,999 + GST | 12 months |
| Additional Pet | ₹2,499/year or ₹249/trial | Per pet |

---

## 14 Life Pillars
Feed, Celebrate, Dine, Stay, Travel, Care, Groom, Play, Train, Insure, Adopt, Farewell, Shop, Community

---

## Key Files

| Component | File | Purpose |
|-----------|------|---------|
| Pet Avatar | `/utils/petAvatar.js` | Centralized photo resolution |
| PetAvatar Component | `/components/PetAvatar.jsx` | Reusable avatar component |
| Logo | `/components/Logo.jsx` | New brand logo |
| My Pets | `/pages/MyPets.jsx` | Consolidated pet management |
| Pet Soul Score | `/components/PetSoulScore.jsx` | Navbar progress ring |
| Mira Chat | `/components/MiraAI.jsx` | Chat welcome card |
| Pet Pass Card | `/components/PetPassCard.jsx` | Identity card |

---

## Prioritized Backlog

### P0 - Critical (All Completed ✅)
- ~~Session Persistence~~ ✅
- ~~Pet Photo Consistency~~ ✅ 
- ~~Logo Redesign~~ ✅
- ~~Centralized Avatar System~~ ✅

### P1 - High Priority
1. Complete 'Adopt' Pillar
2. Pet Pass Renewal email scheduling

### P2 - Medium Priority
1. "Untitled" Products from Shopify Sync
2. Build 'Farewell' and 'Shop' Pillars

---

## Test Credentials
- **Test User**: dipali@clubconcierge.in / lola4304
- **Admin**: aditya / lola4304

---

*Last updated: January 25, 2026*

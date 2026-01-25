# The Doggy Company - Product Requirements Document

## Original Problem Statement
Building **The Doggy Company**, a "Pet Life Operating System" designed as a pet-first platform. Core vision: "vision-first, commerce-later" approach, centered around "Pet Soul™" and "Mira® AI" concierge.

---

## Session 8: Unified Pet Page & Pillar Routes Fix (January 25, 2026) ✅

### BLANK HEALTH TAB BUG FIX ✅
**Problem**: Clicking on a pillar (e.g., Health) from MiraContextPanel navigated to a blank page at `/pet/pet-xxx?tab=health`
**Solution**: Created a new `UnifiedPetPage.jsx` component that handles the `/pet/:petId` route with tab query parameter support

### NEW UNIFIED PET PAGE ✅ (`/pet/:petId`)
Created `/app/frontend/src/pages/UnifiedPetPage.jsx`:
- **Tabs**: Overview, Pet Soul, Health, Vaccines, Services, Pet Pass
- **URL-based navigation**: `?tab=overview`, `?tab=health`, `?tab=vaccines`, `?tab=personality`, `?tab=pillars`, `?tab=identity`
- **Features**:
  - Pet profile header with photo, name, breed, dates
  - Edit mode for pet details
  - Photo upload capability
  - Pet Soul Score progress card
  - Quick Questions inline answering
  - All 14 Life Pillars grid
  - Health tab with active medications
  - Vaccines tab with due soon alerts and records
  - Pet Pass identity card display

### ALL 14 PILLAR ROUTES ADDED ✅
Added routes in `App.js` for:
- `/feed` - Premium nutrition & fresh meals
- `/groom` - Professional grooming & spa services
- `/play` - Toys, activities & enrichment
- `/train` - Professional training & behavior
- `/insure` - Pet insurance & protection plans
- `/adopt` - Find your perfect furry companion
- `/farewell` - Compassionate end-of-life care
- `/community` - Connect with fellow pet parents

### PILLAR PAGE CONFIGURATION EXPANDED ✅
Updated `PillarPage.jsx` with configurations for all 14 pillars:
- Each pillar has: name, icon, color gradient, description, features list, image
- Coming Soon pages for pillars not yet active
- Active pillars (celebrate, shop) redirect to their live pages

---

## Session 7: Major UX Consolidation (January 25, 2026) ✅

### NEW LOGO ✅
- **Design**: Teal serving cloche (concierge bell) with colorful paw print on top
- **Colors**: Purple, Pink, Orange, Green paw pads on teal bell
- **Text**: "the" (orange) + "doggy" (gradient teal→purple) + "company" (purple)
- **Tagline**: "Pet Concierge"

### CENTRALIZED PET AVATAR SYSTEM ✅ (`resolvePetAvatar`)
Created `/app/frontend/src/utils/petAvatar.js`:
- **Priority 1**: Member's uploaded photo
- **Priority 2**: Breed-matched stock photo (40+ breeds supported)
- **Priority 3**: Default beautiful dog photo

### CONSOLIDATED MY PETS PAGE ✅
- Inline Quick Questions: Answer Pet Soul questions right on the page
- Real-time score updates when answers saved
- All 14 Life Pillars displayed in beautiful grid
- Pet Pass Identity Card with photo

---

## 14 Life Pillars
| Pillar | Status | Route |
|--------|--------|-------|
| Feed | Coming Soon | `/feed` |
| Celebrate | Active | `/celebrate` |
| Dine | Active | `/dine` |
| Stay | Active | `/stay` |
| Travel | Active | `/travel` |
| Care | Active | `/care` |
| Groom | Coming Soon | `/groom` |
| Play | Coming Soon | `/play` |
| Train | Coming Soon | `/train` |
| Insure | Coming Soon | `/insure` |
| Adopt | Coming Soon | `/adopt` |
| Farewell | Coming Soon | `/farewell` |
| Shop | Active | `/all` |
| Community | Coming Soon | `/community` |

---

## Key Files

| Component | File | Purpose |
|-----------|------|---------|
| Unified Pet Page | `/pages/UnifiedPetPage.jsx` | NEW - Handles /pet/:petId with tabs |
| App Routes | `App.js` | Updated with all pillar routes |
| Pillar Page | `/pages/PillarPage.jsx` | All 14 pillar configurations |
| Pet Avatar | `/utils/petAvatar.js` | Centralized photo resolution |
| My Pets | `/pages/MyPets.jsx` | Fixed pillar link paths |
| Mira Context | `/components/MiraContextPanel.jsx` | Links to unified pet page tabs |

---

## Prioritized Backlog

### P0 - Critical (All Completed ✅)
- ~~Session Persistence~~ ✅
- ~~Pet Photo Consistency~~ ✅ 
- ~~Logo Redesign~~ ✅
- ~~Centralized Avatar System~~ ✅
- ~~Blank Health Tab Bug~~ ✅
- ~~Missing Pillar Routes~~ ✅

### P1 - High Priority (In Progress)
1. Implement New Pet Soul Score & Paw Rewards Doctrine
   - Server-side weighted question configuration
   - GET /api/pet/{id}/score_state API endpoint
   - Frontend refactor to use single source of truth
2. Consolidate All Pet-Related Pages (partially done with UnifiedPetPage)
3. Complete Universal Pet Avatar integration across all components

### P2 - Medium Priority
1. "Untitled" Products from Shopify Sync
2. Service Desk Missing Customer Name verification
3. Mobile Cart View redesign
4. Build remaining pillar pages (Adopt, Farewell, etc.)

### P3 - Future
- Store and Display Mira Conversation History
- Implement "Soft Gating" in Shopping Flow
- Paw Rewards ledger system
- Concierge Command Center Phase 3

---

## Test Credentials
- **Test User**: dipali@clubconcierge.in / lola4304
- **Admin**: aditya / lola4304
- **Test Pet ID**: pet-99a708f1722a (Mojo)

---

*Last updated: January 25, 2026*

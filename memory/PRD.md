# Mira Pet OS - Product Requirements Document (SSOT)
## Single Source of Truth - Last Updated: February 23, 2026

---

## 🎯 ORIGINAL PROBLEM STATEMENT

**Mira** is a "pet operating system" centered around **Soul Intelligence** (a pet personality system) and an AI concierge. The goal is to move beyond standard e-commerce and create a high-touch, personalized experience where curated recommendations for products and services are dynamically generated based on a pet's unique soul profile.

**Core Vision**: "Mira is the soul, the Concierge controls the experience, and the System is the capillary enabler."

**Key Principle**: Every concierge action must create a service desk ticket and trigger real-time notifications, capturing user intent and enabling a premium, consultative service model.

---

## 📋 CURRENT SESSION WORK (Feb 23, 2026)

### ✅ COMPLETED TODAY

| Task | Status | Details |
|------|--------|---------|
| P0: Navigation fix verified | ✅ DONE | CTA clicks stay on page, no /inbox redirect |
| P1: Mira chat chips updated | ✅ DONE | Fresh Meals specific: "Compare Meal Plans", "Ask about ingredients", "Transitioning to fresh" |
| P2: Hero text contrast | ✅ DONE | Stronger gradient overlay in MealsPage.jsx |
| P2: Ask Mira orb size | ✅ DONE | Reduced from md to sm |
| Duplicate "All Dine" tab | ✅ FIXED | Only one "All Dine" tab now displays |
| /Dine page restructure | ✅ DONE | New section order implemented |
| Dine Essentials seeding | ✅ DONE | 12 new products (6 Feeding Tools + 6 Supplements) |
| Restaurants Load More | ✅ DONE | Shows 6 initially, load more button added |
| **Tab filtering for Feeding Tools** | ✅ DONE | Clicking Feeding Tools tab filters to show only Feeding Tools products |
| **Tab filtering for Supplements** | ✅ DONE | Clicking Supplements tab filters to show only Supplements products |
| **Category card links fixed** | ✅ DONE | Cards link to /dine?section=essentials&category=xxx and auto-scroll to section |
| **Products visibility** | ✅ VERIFIED | All 17 bundles display correctly in Dine Essentials section |

### 🔴 PENDING ISSUES - ALL FIXED
All 5 reported issues from the user have been resolved and verified by testing agent:
1. ✅ Products (Feeding Tools & Supplements) ARE showing
2. ✅ Duplicate "All Dine" tab - FIXED (only 1 tab)
3. ✅ Restaurants "Load More" - IMPLEMENTED (correct logic)
4. ✅ Category card links - FIXED (auto-scroll to section)
5. ✅ Sub-pillar tab links - FIXED (filtering works for Feeding Tools/Supplements)

---

## 🗂️ /DINE PAGE STRUCTURE (CONFIRMED ORDER)

```
1. Hero + Pet Control Center
2. Tab Navigation (All Dine, Fresh Meals, Treats, Chews, Frozen, Feeding Tools, Supplements, Dine Out)
3. Curated Picks (Mira's personalized picks)
4. Need Dining Help? (DiningConciergePicker)
5. Elevated Concierge® (Private Chef, VIP, Birthday Package)
6. Category Cards Row (Fresh Meals, Treats, Frozen, Feeding Tools, Supplements)
7. Dining Products (3 rows + Load More)
8. Dine Essentials (17 products with category pills)
9. Concierge Featured Restaurants (6 shown + Load More)
10. Nearby Pet-Friendly Spots (geolocation-based)
11. Pet Cafes Worldwide (city search)
12. Buddy Meetups
13. Own a Pet-Friendly Restaurant? (Partner CTA)
```

---

## 🔗 TAB/LINK ROUTING (MUST FIX)

| Tab/Card | Current Path | Should Go To |
|----------|--------------|--------------|
| Fresh Meals | /dine?tab=fresh-meals | /dine/meals |
| Treats | /dine?tab=treats | /celebrate/treats |
| Frozen | /dine?tab=frozen | /celebrate/treats (temp) |
| Chews | /dine?tab=chews | /dine?tab=chews (keep) |
| Feeding Tools | /dine?tab=feeding-tools | Scroll to Dine Essentials |
| Supplements | /dine?tab=supplements | Scroll to Dine Essentials |
| Dine Out | /dine?tab=dine-out | Scroll to restaurants |

---

## 🛒 DINE ESSENTIALS PRODUCTS (SEEDED)

### Feeding Tools (6 products)
1. Slow Feeder Anti-Gulp Bowl - ₹599
2. Elevated Feeding Station - ₹1299
3. Smart Auto Feeder Pro - ₹3999
4. Travel Feeding Kit - ₹899
5. Interactive Puzzle Feeder Set - ₹1199
6. No-Spill Water Station - ₹799

### Supplements (6 products)
1. Daily Multivitamin Chews - ₹699
2. Joint Health Glucosamine+ - ₹1199
3. Probiotic Digestive Support - ₹899
4. Omega-3 Fish Oil Soft Gels - ₹799
5. Calming Stress Relief Chews - ₹649
6. Dental Health Enzyme Powder - ₹549

### Original Products (5)
- Pawty Birthday Package, Fine Dining Kit, Adoption Anniversary Special, Gourmet Treats Box, Pet Parent Gift Card

**Total: 17 products in dine_bundles collection**

---

## 🏗️ KEY FILES REFERENCE

### Frontend
| File | Purpose |
|------|---------|
| `/app/frontend/src/pages/DinePage.jsx` | Main /dine page with all sections |
| `/app/frontend/src/pages/MealsPage.jsx` | /dine/meals "Gold Standard" page |
| `/app/frontend/src/components/PillarPageLayout.jsx` | Tab navigation for all pillars |
| `/app/frontend/src/components/FlowModal.jsx` | Multi-step user intent capture |
| `/app/frontend/src/hooks/useUniversalServiceCommand.js` | Ticket creation hook |
| `/app/frontend/src/components/MiraChatWidget.jsx` | AI chat widget with quick chips |

### Backend
| File | Purpose |
|------|---------|
| `/app/backend/dine_routes.py` | Dine API endpoints including /dine/bundles |
| `/app/backend/scripts/seed_dine_essentials.py` | Seeds feeding tools & supplements |
| `/app/backend/app/data/fresh_meals_concierge_cards.py` | Curated cards data |

---

## 🔧 DEBUG CHECKLIST FOR NEXT AGENT

### If products not showing:
1. Check API: `curl https://concierge-flow.preview.emergentagent.com/api/dine/bundles`
2. Verify bundles state in DinePage.jsx (line ~80)
3. Check if bundles.map() is rendering (line ~570)

### If tabs not linking correctly:
1. Check PillarPageLayout.jsx lines 42-48 for path values
2. Update paths to use actual routes not query params

### If duplicate elements appear:
1. Clear browser cache
2. Check for duplicate JSX in DinePage.jsx
3. Verify PillarPageLayout subcategories array

---

## 📊 API ENDPOINTS

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dine/bundles` | GET | Get all dine essentials (17 products) |
| `/api/dine/restaurants` | GET | Get pet-friendly restaurants |
| `/api/intelligence/curated-picks` | GET | Get AI-curated recommendations |
| `/api/service-requests` | POST | Create service desk ticket |

---

## 🔐 TEST CREDENTIALS

- **Member**: dipali@clubconcierge.in / test123
- **Admin**: aditya / lola4304

---

## 📝 UPCOMING TASKS (PRIORITY ORDER)

### P0 - Critical
1. Fix Fresh Pet Meals card links (Fresh Treats → /celebrate/treats, Fresh Meals → /dine/meals)
2. Fix tab navigation links in PillarPageLayout
3. Verify new products render on frontend

### P1 - Important
1. Make category pills interactive (filter products on click)
2. Add admin CRUD for Dine Essentials
3. CSV upload capability for products

### P2 - Enhancement
1. Replicate Gold Standard to Treats/Chews tabs
2. Razorpay checkout integration
3. Birthday reminders on PetHomePage

---

## 🚀 FUTURE ROADMAP

1. Unify 3 Mira chat interfaces
2. Gamify PetSoulOnboarding
3. Roll out Intelligence Layer to remaining 11 pillars
4. Refactor backend/server.py into modules
5. Resend domain verification for email notifications
6. Gupshup configuration for WhatsApp

---

## ⚠️ KNOWN ISSUES

1. **Resend Domain**: thedoggycompany.com needs verification
2. **Gupshup**: WhatsApp integration needs configuration
3. **Screenshot Tool**: Sometimes unreliable with login sessions

---

## 📞 HANDOVER NOTES

**USER CONTEXT**: User (Dipali) is very detail-oriented and anxious about context loss. Always confirm understanding before implementing. The project is highly personal - "Mira is the soul" vision.

**CRITICAL**: 
- Do NOT navigate away from current page after ticket creation
- Service flow MUST create tickets in service_requests collection
- All CTAs should use Universal Service Command hook

**Last User Request**: Fix link routing for tabs and Fresh Pet Meals cards, ensure products are visible, update SSOT/PRD.

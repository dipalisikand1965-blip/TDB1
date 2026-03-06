# Pet Life Operating System - The Doggy Company
## Product Requirements Document

**Last Updated:** December 6, 2025
**Version:** 2.6.0
**Status:** Production Ready for Investor Demo

---

## 1. EXECUTIVE SUMMARY

The Doggy Company is a "Pet Life Operating System" - a comprehensive platform that serves as the central hub for all pet parent needs. Built with love, honoring the memory of Kouros and Mystique.

**Core Philosophy:**
> "A dog is not in your life. You are in theirs."
> "To be known. To be seen. To be loved. With accuracy."

**Live Production:** https://thedoggycompany.com
**Preview Environment:** https://pet-os-v1.preview.emergentagent.com

---

## 2. ARCHITECTURE

### Tech Stack
- **Frontend:** React 18 + Tailwind CSS + Shadcn/UI
- **Backend:** FastAPI (Python)
- **Database:** MongoDB (Emergent-hosted)
- **AI:** OpenAI GPT (via Emergent LLM Key)
- **E-commerce:** Shopify sync (doggybakery.com)

### Key Collections
- `users` - User accounts
- `pets` - Pet profiles with soul scores
- `products_master` - All products (~2200+)
- `services` / `services_master` - Services (~1100+)
- `unified_products` - Unified product view
- `tickets` / `mira_tickets` - Service requests

---

## 3. THE 14 PILLARS

| Pillar | Purpose | Status |
|--------|---------|--------|
| **Celebrate** | Birthdays, parties, cakes | Shopify synced |
| **Dine** | Fresh meals, restaurants | 100% images |
| **Stay** | Hotels, boarding, daycare | 100% images |
| **Travel** | Trips, carriers, planning | 100% images |
| **Care** | Grooming, vet, wellness | 94% images |
| **Enjoy** | Experiences, outings | 100% images |
| **Play** | Toys, games, activities | 100% images |
| **Fit** | Exercise, fitness, agility | 93% images |
| **Learn** | Training, education | 100% images |
| **Paperwork** | Insurance, documents | 70% images |
| **Advisory** | Consultations, planning | 100% images |
| **Emergency** | 24/7 urgent care | 100% images |
| **Farewell** | Memorial services | 100% images |
| **Adopt** | Rescue, adoption | 100% images |

---

## 4. COMPLETED WORK

### Session - December 6, 2025: UI Polish & Handover
- Fixed **Bottom Nav Active State** - Enhanced with stronger gradient, shadow, scale, and glow effects
- Fixed **Price Display Consistency** - Products with ₹0 now show "Price on request" 
- Fixed **Mobile Product Detail Scroll** - Added `overflow-y-auto` and `pb-24` for proper scrolling
- Updated PRD.md with comprehensive documentation

### Previous Sessions: Major Features
- **AI Image Generation** for ALL 14 pillars (~2000+ products, ~1100+ services)
- **Master Sync Step 7** - Auto-applies images on deployment
- **Soul Score Board** - Verified working (74%, 83%, etc.)
- **Allergy Filtering** - Products filter based on pet allergies
- **Emergency Guest Flow** - Guests can report without login
- **Kouros Image Fix** - Correct black dog on About page
- **Breed Selection** - 64 breeds + custom input
- **Pillar Colors** - Each pillar has unique gradient

---

## 5. PENDING TASKS

### HIGH PRIORITY
1. **Paperwork Pillar Images** - Only 70% coverage
   - Run: `POST /api/admin/migrate-product-images`

2. **Broken Shopify Images** - Some products have test URLs
   - Syncs from doggybakery.com - may need Shopify data check

### MEDIUM PRIORITY
3. **Test Ask Mira Search** - Verify search suggestions work
4. **Test Guest Emergency Flow** - Submit test emergency as guest

### INTEGRATIONS (Need API Keys)
5. **Razorpay** - Payment gateway for checkout
6. **WhatsApp Business** - Meta API verification

### INTEGRATIONS (Already Working)
- **Google Places API** - FULLY INTEGRATED for hotels, vets, restaurants, dog parks, pet stores, groomers, photographers (API key configured)

### CODE REFACTORING (Future)
8. **Admin.jsx** - 2600+ lines, needs splitting
9. **DoggyServiceDesk.jsx** - 6000+ lines
10. **MiraDemoPage.jsx** - 5000+ lines
11. **Admin Auth** - Move from hardcoded to backend roles

---

## 6. KEY FILES REFERENCE

### Frontend
```
/app/frontend/src/
├── pages/
│   ├── Home.jsx              # Landing page (Kouros hero)
│   ├── AboutPage.jsx         # About + Philosophy (Kouros image)
│   ├── Login.jsx             # Login + Mystique memorial
│   ├── ShopPage.jsx          # Main shop with pillars
│   ├── ProductDetailPage.jsx # Product details (FIXED scroll)
│   └── Pillars/
│       └── EmergencyPage.jsx # Emergency flow (guest support)
├── components/
│   ├── ProductCard.jsx       # Product cards (FIXED price display)
│   ├── MobileNavBar.jsx      # Bottom nav (active state)
│   ├── MiraAI.jsx            # Mira chat interface
│   └── Navbar.jsx            # Top navigation
├── config/
│   └── pillarConfig.js       # Pillar colors & config
└── index.css                 # Global styles (FIXED nav active state)
```

### Backend
```
/app/backend/
├── server.py                 # Main server + Master Sync (7 steps)
├── product_intelligence.py   # Allergy filtering
├── dine_routes.py           # Dine products seed
├── care_routes.py           # Care products seed
├── documentation_generator.py # Doc generation
└── scripts/
    ├── update_dine_images_api.py
    └── update_care_images_api.py
```

---

## 7. MASTER SYNC STEPS

When you click MASTER SYNC in Admin:
1. Shopify sync (doggybakery.com products)
2. Care products seed
3. Dine products seed  
4. Breed catalogue seed
5. Default data seed
6. Mira context update
7. **Product images migration** (auto-applies AI images)

---

## 8. SOUL SCORE SYSTEM

Pets have soul scores (0-100%) that affect personalization:
- Higher score = Better recommendations
- Tracks: allergies, preferences, health conditions
- Achievement badges: "Soul Guardian" at 75%

**Allergy Filtering:**
- Checks: `pet.allergies`, `preferences.allergies`, `doggy_soul_answers.allergies`
- Example: Chicken allergy → No chicken products in "For You"

---

## 9. CREDENTIALS

### Test User
- Email: `dipali@clubconcierge.in`
- Password: `test123`

### Admin
- Username: `aditya`
- Password: `lola4304`
- URL: `/admin`

---

## 10. DEPLOYMENT CHECKLIST

After deploying to production:
1. Go to Admin panel (`/admin`)
2. Click **MASTER SYNC**
3. Wait for all 7 steps to complete
4. Verify images appear on Shop page
5. Test a product detail page
6. Test mobile bottom nav

---

## 11. KNOWN ISSUES

| Issue | Status | Notes |
|-------|--------|-------|
| WebSocket connection | Workaround | Graceful fallback in place |
| Production DB from preview | Blocked | Needs IP whitelist in Atlas |
| Some Shopify images broken | Known | Test URLs in Shopify data |

---

## 12. CONTACT & RESOURCES

- **Shopify Store:** https://thedoggybakery.com
- **Admin Panel:** /admin (aditya/lola4304)
- **Mira AI:** Click button or use Ask Mira search
- **Documentation:** /complete-documentation.html

---

## 13. RECENT FIXES (December 6, 2025)

### Mobile Nav Active State Enhancement
**File:** `/app/frontend/src/index.css`
- Increased gradient opacity from 0.15 to 0.25
- Enhanced box shadow with inset glow
- Increased icon scale from 1.1 to 1.2
- Strengthened drop shadow effect
- Bolder font weight (800 vs 700)
- Added letter-spacing for better readability

### Price Display Consistency
**File:** `/app/frontend/src/components/ProductCard.jsx`
- Added conditional check for `minPrice > 0`
- Products with zero/missing price now show "Price on request"
- Purple text styling for request-based pricing

### Mobile Product Detail Scroll Fix
**File:** `/app/frontend/src/pages/ProductDetailPage.jsx`
- Added `overflow-y-auto` to main container
- Added `pb-24` padding for mobile nav clearance
- Ensures all product content is scrollable on mobile

---

*Built with love for Kouros & Mystique*

# Pet Life Operating System - The Doggy Company
## Product Requirements Document

**Last Updated:** March 6, 2026
**Version:** 2.5.0
**Status:** Production Ready for Investor Demo

---

## 1. EXECUTIVE SUMMARY

The Doggy Company is a "Pet Life Operating System" - a comprehensive platform that serves as the central hub for all pet parent needs. Built with love, honoring the memory of Kouros and Mystique.

**Core Philosophy:**
> "A dog is not in your life. You are in theirs."
> "To be known. To be seen. To be loved. With accuracy."

**Live Production:** https://thedoggycompany.com
**Preview Environment:** https://authenticity-check-35.preview.emergentagent.com

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
| **Celebrate** | Birthdays, parties, cakes | ✅ Shopify synced |
| **Dine** | Fresh meals, restaurants | ✅ 100% images |
| **Stay** | Hotels, boarding, daycare | ✅ 100% images |
| **Travel** | Trips, carriers, planning | ✅ 100% images |
| **Care** | Grooming, vet, wellness | ✅ 94% images |
| **Enjoy** | Experiences, outings | ✅ 100% images |
| **Play** | Toys, games, activities | ✅ 100% images |
| **Fit** | Exercise, fitness, agility | ✅ 93% images |
| **Learn** | Training, education | ✅ 100% images |
| **Paperwork** | Insurance, documents | 🟡 70% images |
| **Advisory** | Consultations, planning | ✅ 100% images |
| **Emergency** | 24/7 urgent care | ✅ 100% images |
| **Farewell** | Memorial services | ✅ 100% images |
| **Adopt** | Rescue, adoption | ✅ 100% images |

---

## 4. COMPLETED WORK (March 6, 2026)

### Session 1: Audit & Critical Fixes
- ✅ **Landing Page Scroll Bug** - Fixed CSS (`height: 100%` → `min-height: 100%`)
- ✅ **Mobile Login Memorial** - Added Mystique memorial text
- ✅ **Fake Stats Removed** - Replaced with authentic messaging
- ✅ **Philosophy Section** - Added to About page
- ✅ **Kouros Image Fixed** - Correct black dog now on About page
- ✅ **Breed Selection Overhaul** - 64 breeds + custom input
- ✅ **Pillar Colors** - Each pillar has unique gradient

### Session 2: Product Images (MAJOR)
- ✅ **Generated AI images** for ALL 14 pillars
- ✅ **~2000+ products** now have beautiful images
- ✅ **~1100+ services** have images
- ✅ **Master Sync Step 7** - Auto-applies images on deployment

### Session 3: Polish & Verification
- ✅ **Soul Score Board** - Verified working (74%, 83%, etc.)
- ✅ **Allergy Filtering** - Products filter based on pet allergies
- ✅ **Mobile Bottom Nav** - Enhanced active state styling
- ✅ **Emergency Guest Flow** - Guests can report without login

### Image Types Generated
- Fresh meal bowls (chicken, veggie, fish)
- Pet travel carriers & accessories
- Grooming tools & spa products
- Training kits & agility equipment
- Hotel rooms & cottages
- Vet wellness & first aid
- Memorial & farewell scenes
- Adoption & rescue imagery

---

## 5. PENDING TASKS (For Next Agent)

### 🔴 HIGH PRIORITY
1. **Price Display Consistency** - Some products show ₹0 or no price
   - File: `/app/frontend/src/components/ProductCard.jsx` (line ~347-356)
   - Check `getMinPrice()` function

2. **Product Detail Page Scroll** - Mobile scroll doesn't work below fold
   - File: `/app/frontend/src/pages/ProductDetailPage.jsx`
   - CSS issue with fixed positioning

3. **Paperwork Pillar Images** - Only 70% coverage
   - Run: `POST /api/admin/migrate-product-images`

### 🟡 MEDIUM PRIORITY
4. **Test Ask Mira Search** - Verify search suggestions work
5. **Test Guest Emergency Flow** - Submit test emergency as guest
6. **Celebrate Broken Images** - Some Shopify products have test URLs
   - These sync from doggybakery.com - may need Shopify sync

### 🟢 INTEGRATIONS (Need API Keys)
7. **Razorpay** - Payment gateway for checkout
8. **Google Places API** - Hotel search for Stay pillar
9. **WhatsApp Business** - Meta API verification

### 🔵 CODE REFACTORING (Future)
10. **Admin.jsx** - 2600+ lines, needs splitting
11. **DoggyServiceDesk.jsx** - 6000+ lines
12. **MiraDemoPage.jsx** - 5000+ lines
13. **Admin Auth** - Move from hardcoded to backend roles

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
│   ├── ProductDetailPage.jsx # Product details (scroll issue)
│   └── Pillars/
│       └── EmergencyPage.jsx # Emergency flow (guest support)
├── components/
│   ├── ProductCard.jsx       # Product cards (price display)
│   ├── MobileNavBar.jsx      # Bottom nav (active state)
│   ├── MiraAI.jsx            # Mira chat interface
│   └── Navbar.jsx            # Top navigation
├── config/
│   └── pillarConfig.js       # Pillar colors & config
└── index.css                 # Global styles (nav active state)
```

### Backend
```
/app/backend/
├── server.py                 # Main server + Master Sync
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

When you click 🚀 MASTER SYNC in Admin:
1. ✅ Shopify sync (doggybakery.com products)
2. ✅ Care products seed
3. ✅ Dine products seed  
4. ✅ Breed catalogue seed
5. ✅ Default data seed
6. ✅ Mira context update
7. ✅ **Product images migration** (NEW - auto-applies AI images)

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
1. ✅ Go to Admin panel (`/admin`)
2. ✅ Click **🚀 MASTER SYNC**
3. ✅ Wait for all 7 steps to complete
4. ✅ Verify images appear on Shop page
5. ✅ Test a product detail page
6. ✅ Test mobile bottom nav

---

## 11. KNOWN ISSUES

| Issue | Status | Notes |
|-------|--------|-------|
| WebSocket connection | Workaround | Graceful fallback in place |
| Production DB from preview | Blocked | Needs IP whitelist in Atlas |
| Some Shopify images broken | Known | Test URLs in Shopify data |
| Product detail scroll | Bug | CSS fix needed |

---

## 12. CONTACT & RESOURCES

- **Shopify Store:** https://thedoggybakery.com
- **Admin Panel:** /admin (aditya/lola4304)
- **Mira AI:** Click ✨ button or use Ask Mira search
- **Documentation:** /complete-documentation.html

---

*Built with love for Kouros & Mystique* 🐕💜

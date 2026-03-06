# Pet Life Operating System - The Doggy Company
## Product Requirements Document

**Last Updated:** December 6, 2025
**Version:** 2.7.0
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
- `services_master` - Services (~1100+)
- `unified_products` - Unified product view
- `tickets` / `mira_tickets` - Service requests
- `enjoy_experiences` - Events & Experiences

---

## 3. THE 14 PILLARS

| Pillar | Purpose | Image Status |
|--------|---------|--------------|
| **Celebrate** | Birthdays, parties, cakes | ✅ Shopify + Services |
| **Dine** | Fresh meals, restaurants | ✅ 100% |
| **Stay** | Hotels, boarding, daycare | ✅ 100% |
| **Travel** | Trips, carriers, planning | ✅ 100% |
| **Care** | Grooming, vet, wellness | ✅ 100% |
| **Enjoy** | Experiences, outings | ✅ 100% |
| **Play** | Toys, games, activities | ✅ 100% |
| **Fit** | Exercise, fitness, agility | ✅ 100% |
| **Learn** | Training, education | ✅ 100% |
| **Paperwork** | Insurance, documents | ✅ 100% |
| **Advisory** | Consultations, planning | ✅ 100% |
| **Emergency** | 24/7 urgent care | ✅ 100% |
| **Farewell** | Memorial services | ✅ 100% |
| **Adopt** | Rescue, adoption | ✅ 100% |

---

## 4. COMPLETED WORK - December 6, 2025

### Session Highlights

#### Image & Content Fixes
- **Travel Services**: 10 unique AI images (Pet Taxi, Airport Transfer, Relocation, etc.)
- **Paperwork Services**: 5 insurance/document images
- **Celebrate Services**: 11 contextual party/celebration images
- **Shopify Fix**: "Love in the Air Mini" broken image replaced
- **ServiceCatalogSection**: Now shows actual images instead of gradient+emoji

#### UI/UX Improvements
- **Load More Buttons**: Added to Enjoy page products
- **Removed "X of Y" Text**: From all pillar pages (Dine, Fit, Stay, Travel, Celebrate, ProductListing)
- **Mobile Nav Active State**: Enhanced with stronger gradient, shadow, scale effects
- **Price Display**: Products with ₹0 now show "Price on request"
- **Mobile Product Scroll**: Fixed overflow on ProductDetailPage
- **Text Readability**: Improved contrast on PersonalizedPillarSection dark backgrounds

#### Transformation Stories
- **Large Card Format**: Single dog photos (not confusing before/after)
- **Click Modal**: View full story details with before/after comparison
- **Mobile Scrollable**: Horizontal swipe with snap points
- **Truthful Content**: "Share Your Story" invitation when no real stories exist

#### Kouros & Mystique Memorial
- **Login Page**: Now shows BOTH Kouros & Mystique side by side with heart
- **About Page**: Updated Kouros image (beautiful black Newfoundland with amber eyes)
- **Memorial Text**: "In loving memory of Kouros & Mystique"

#### Product Card/Modal Fix
- **Image Mismatch Bug**: Fixed - card and modal now show same image
- **Consistent Logic**: Both use `product.image` → `product.images[0]` → placeholder

#### Master Sync Updates
- **Step 7**: Product images migration (all pillars)
- **Step 8 (NEW)**: Service images migration (Celebrate + Travel services)

---

## 5. MASTER SYNC STEPS

When you click MASTER SYNC in Admin:
1. Shopify sync (doggybakery.com products)
2. Care products seed
3. Dine products seed
4. Breed catalogue seed
5. Default data seed
6. Mira context update
7. Product images migration (auto-applies AI images)
8. **Service images migration (Celebrate + Travel services)**

---

## 6. KEY FEATURES

### Soul Score System
- Pets have soul scores (0-100%) affecting personalization
- Higher score = Better recommendations
- Achievement badges: "Soul Guardian" at 75%

### Allergy Filtering
- Checks: `pet.allergies`, `preferences.allergies`, `doggy_soul_answers.allergies`
- Example: Chicken allergy → No chicken products in "For You"

### Events & Experiences (Enjoy)
- **Admin Location**: Admin → 14 PILLARS → Enjoy → Enjoy Manager
- 16 experiences with RSVPs, Partners, Products tabs
- Add/Edit/Delete/Feature events

### Google Places API (Already Integrated)
- Pet-friendly hotels, vets, restaurants, dog parks
- Pet stores, groomers, photographers
- API key configured in backend/.env

---

## 7. CREDENTIALS

### Test User
- Email: `dipali@clubconcierge.in`
- Password: `test123`

### Admin
- Username: `aditya`
- Password: `lola4304`
- URL: `/admin`

---

## 8. KEY FILES REFERENCE

### Frontend
```
/app/frontend/src/
├── pages/
│   ├── Login.jsx              # Kouros & Mystique memorial
│   ├── AboutPage.jsx          # Updated Kouros image
│   ├── CelebratePage.jsx      # Shopify products + services
│   ├── TravelPage.jsx         # Large format transformation stories
│   ├── EnjoyPage.jsx          # Load More + Share Your Story
│   └── ProductDetailPage.jsx  # Mobile scroll fixed
├── components/
│   ├── ProductCard.jsx        # Image mismatch fixed
│   ├── TransformationStories.jsx # Click modal + large format
│   ├── ServiceCatalogSection.jsx # Shows actual images now
│   └── PersonalizedPillarSection.jsx # Text readability improved
└── index.css                  # Mobile nav active state enhanced
```

### Backend
```
/app/backend/
├── server.py                  # Master Sync with Step 7 & 8
├── services/
│   └── google_places_service.py # Hotels, vets, restaurants
└── enjoy_routes.py            # Events & Experiences API
```

---

## 9. PENDING TASKS

### HIGH PRIORITY
1. **Payment Integration** - Add Razorpay API keys for checkout testing
2. **WhatsApp Business** - Meta API verification pending

### MEDIUM PRIORITY
3. **Add More Transformation Stories** - Via Admin or API
4. **E-commerce Expansion** - HUFT, Amazon integration

### CODE REFACTORING (Future)
5. **Admin.jsx** - 2600+ lines, needs splitting
6. **DoggyServiceDesk.jsx** - 6000+ lines
7. **MiraDemoPage.jsx** - 5000+ lines
8. **Admin Auth** - Move from hardcoded to backend roles

---

## 10. KNOWN ISSUES

| Issue | Status | Notes |
|-------|--------|-------|
| WebSocket connection | Workaround | Graceful fallback in place |
| Production DB from preview | Blocked | Needs IP whitelist in Atlas |
| Some Shopify images broken | Known | Test URLs in Shopify data |

---

## 11. 3RD PARTY INTEGRATIONS

| Integration | Status | Notes |
|-------------|--------|-------|
| OpenAI GPT | ✅ Working | Via Emergent LLM Key |
| MongoDB Atlas | ✅ Working | Preview blocked by IP |
| Shopify | ✅ Working | doggybakery.com sync |
| Google Places API | ✅ Working | Hotels, vets, restaurants |
| YouTube | ✅ Working | Video embeds |
| Razorpay | ⏳ Needs Keys | Payment gateway |
| Resend | ✅ Configured | Email service |
| WhatsApp | ⏳ Needs Verification | Meta API |

---

## 12. DEPLOYMENT CHECKLIST

After deploying to production:
1. Go to Admin panel (`/admin`)
2. Click **MASTER SYNC**
3. Wait for all 8 steps to complete
4. Verify images appear on Shop page
5. Test a product detail page
6. Test mobile bottom nav
7. Check Celebrate services have images

---

## 13. CONTACT & RESOURCES

- **Shopify Store:** https://thedoggybakery.com
- **Admin Panel:** /admin (aditya/lola4304)
- **Mira AI:** Click button or use Ask Mira search
- **Documentation:** /complete-documentation.html

---

*Built with love for Kouros & Mystique* 🐾

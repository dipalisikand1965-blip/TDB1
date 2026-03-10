# The Doggy Company - PRD (Product Requirements Document)
**Last Updated:** March 10, 2026 21:30 IST  
**Status:** Soul Made Products - 37.9% Mockups Generated (974/2569) | Production: 84.3% (862/1022)

---

## 🎯 PRODUCT VISION

"The Doggy Company" is a hyper-personalized pet platform featuring:
- **Memory-Led Personalization**: Products shaped around who each pet really is
- **Soul Archetype System**: 7 personality archetypes driving product recommendations
- **Breed-Specific AI Artwork**: Custom mockups for 33 breeds across 65 product types
- **Golden Standard Layout**: Unified experience across all 13 pillar pages

---

## 📊 CURRENT STATE (March 10, 2026)

| Metric | Preview | Production |
|--------|---------|------------|
| **Total Products** | 2,569 | 1,022 |
| **With Mockups** | 960 (37.4%) | 862 (84.3%) |
| **Breeds** | 33 | 33 |
| **Product Types** | 65 | 65 |

### Mockup Generation
- **Status:** RUNNING in background (new batch started)
- **Progress:** 960/2569 (37.4%)
- **Check:** `curl $API_URL/api/mockups/stats`
- **Start batch:** `curl -X POST $API_URL/api/mockups/generate-batch -d '{"limit":50}'`
- **Sync to prod:** `curl -X POST $API_URL/api/mockups/sync-to-production`

---

## ✅ COMPLETED FEATURES

### Phase 1: Core Platform ✅
- [x] User authentication (JWT)
- [x] Pet registration with photos
- [x] 13 Pillar pages (Celebrate, Travel, Stay, Care, Dine, Fit, Enjoy, Learn, Farewell, Emergency, Adopt, Advisory, Paperwork)
- [x] Shopping cart and checkout
- [x] Admin dashboard

### Phase 2: Soul System ✅
- [x] SoulBuilder (51-question quiz)
- [x] 7 Soul Archetypes with product affinity
- [x] Soul-based product recommendations
- [x] Pet personality profiles

### Phase 3: AI Product Generation ✅
- [x] Cloudinary integration for image hosting
- [x] GPT-4o prompt generation for mockups
- [x] 65 product types seeded across 33 breeds
- [x] Automatic mockup generation pipeline
- [x] Production sync endpoint

### Phase 4: Golden Standard Layout ✅ COMPLETE (March 10, 2026)
All 13 pillar pages now have:
- [x] **SoulMadeCollection** - AI-generated breed products with artwork
- [x] **BreedSmartRecommendations** - Functional tips from breed_matrix
- [x] **ArchetypeProducts** - Multi-factor personalized products (NEW)
- [x] **CuratedBundles** - Pre-made bundles with savings (NEW)
- [x] **MiraCuratedLayer** - Unified concierge recommendations
- [x] **PillarPicksSection** - Mira's picks for the selected pet
- [x] **PersonalizedPicks** - General personalized products
- [x] **ServiceCatalogSection** - Services with pricing
- [x] **ConciergeButton** - Ask Mira floating button

### Phase 5: Multi-Factor Filtering ✅ IMPLEMENTED (March 10, 2026)
- [x] API: `POST /api/mockups/multi-factor-products`
- [x] Filters: Breed, Archetype, Life Stage, Health considerations
- [x] Scoring: Base 100 + 50 archetype match + 30 life stage
- [x] Frontend: `ArchetypeProducts.jsx` component

### Phase 6: Soul Tier Admin UI ✅ IMPLEMENTED (March 10, 2026)
- [x] Edit modal in SoulProductsManager.jsx
- [x] Stock quantity management
- [x] Variants (size, color) with price modifiers
- [x] Sale price setting
- [x] Soul tier assignment (standard/soul_made/soul_selected/soul_gifted)
- [x] API: `PUT /api/mockups/soul-made/products/{id}`

### Phase 7: Archetype Tone System ✅ IMPLEMENTED (March 10, 2026)
- [x] Created `archetypeCopy.js` utility with 7 archetype copy definitions
- [x] Personalized greetings based on pet archetype
- [x] Dynamic product intro copy per archetype
- [x] Archetype-aware bundle descriptions
- [x] Accent colors per archetype

### Phase 8: Curated Bundles System ✅ IMPLEMENTED (March 10, 2026)
- [x] Backend API: `/api/bundles` (CRUD operations)
- [x] MongoDB storage for bundles across all pillars
- [x] Admin UI: `BundlesManager.jsx` with full CRUD
- [x] Default bundles seeded (10 bundles for 6 pillars)
- [x] Master Sync integration (Step 12/12)
- [x] Production sync endpoint: `POST /api/bundles/sync-to-production`
- [x] AI Image Generation for bundles: `POST /api/bundles/{id}/generate-image`
- [x] Bulk image generation: `POST /api/bundles/generate-all-images`

**Bundle Pillars Covered:**
- Celebrate: Birthday Pawty, Gotcha Day
- Travel: Adventure Ready, Road Trip
- Dine: Premium Mealtime, Treat Lover
- Care: Spa Day
- Stay: Home Comfort
- Fit: Daily Walker
- Farewell: Forever Loved

---

## 🔴 PENDING ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| **Razorpay checkout "body error"** | P1 | NOT STARTED |
| **Mobile dashboard scrambled** | P2 | USER VERIFICATION PENDING |

---

## 🟡 IN PROGRESS

| Task | Progress | Notes |
|------|----------|-------|
| **Mockup Generation** | 37.9% | 974/2569 - Running in background |
| **Production Sync** | 84.3% | 862/1022 - Sync as new mockups complete |

---

## 🔵 UPCOMING TASKS

1. **Complete mockup generation** - ~1,700 remaining
2. **Fix Razorpay checkout** - P1 blocker for revenue
3. **Verify mobile dashboard** - Get user confirmation
4. **Archetype copy tone** - Personalize UI text based on personality
5. **Add bundles for more pillars** - Currently only 6 pillars have bundles

---

## 📁 KEY FILES

### Frontend Components
- `/app/frontend/src/components/ArchetypeProducts.jsx` - Multi-factor filtered products
- `/app/frontend/src/components/CuratedBundles.jsx` - Bundle deals per pillar (API-backed)
- `/app/frontend/src/components/SoulMadeCollection.jsx` - AI mockup products
- `/app/frontend/src/components/BreedSmartRecommendations.jsx` - Breed-specific tips
- `/app/frontend/src/components/admin/SoulProductsManager.jsx` - Admin product management
- `/app/frontend/src/components/admin/BundlesManager.jsx` - **NEW:** Bundle CRUD admin UI
- `/app/frontend/src/utils/archetypeCopy.js` - Archetype-based copy utility

### Backend APIs
- `/app/backend/app/api/mockup_routes.py` - All mockup & soul-made APIs
- `/app/backend/app/api/bundle_routes.py` - **NEW:** Bundle CRUD & AI image generation
- `/app/backend/app/api/breed_routes.py` - Breed matrix recommendations
- `/app/backend/soul_archetype_engine.py` - 7 archetypes definitions

### Pillar Pages (All 13 with Golden Standard)
- `/app/frontend/src/pages/CelebratePage.jsx`
- `/app/frontend/src/pages/TravelPage.jsx`
- `/app/frontend/src/pages/StayPage.jsx`
- `/app/frontend/src/pages/CarePage.jsx`
- `/app/frontend/src/pages/DinePage.jsx`
- `/app/frontend/src/pages/FitPage.jsx`
- `/app/frontend/src/pages/EnjoyPage.jsx`
- `/app/frontend/src/pages/LearnPage.jsx`
- `/app/frontend/src/pages/FarewellPage.jsx`
- `/app/frontend/src/pages/EmergencyPage.jsx`
- `/app/frontend/src/pages/AdoptPage.jsx`
- `/app/frontend/src/pages/AdvisoryPage.jsx`
- `/app/frontend/src/pages/PaperworkPage.jsx`

---

## 🔑 KEY API ENDPOINTS

### Mockup Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mockups/stats` | GET | Overall mockup statistics |
| `/api/mockups/status` | GET | Current generation status |
| `/api/mockups/generate-batch` | POST | Start batch generation |
| `/api/mockups/sync-to-production` | POST | Sync mockups to production |
| `/api/mockups/multi-factor-products` | POST | Get personalized products |
| `/api/mockups/soul-made/products/{id}` | PUT | Update product (stock, variants, price) |
| `/api/mockups/soul-made/products` | GET | List products with filters |

### Breed Matrix
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/breed-matrix/{breed}` | GET | Get breed-specific recommendations |

---

## 🔐 CREDENTIALS

### Test User
- **Email:** `dipali@clubconcierge.in`
- **Password:** `test123`
- **Has 9 pets** including Mojo, Mystique, Bruno, etc.

### Admin
- **Username:** `aditya`
- **Password:** `lola4304`

---

## 🏗️ ARCHITECTURE

```
/app
├── backend/
│   ├── app/api/
│   │   ├── mockup_routes.py      # Mockup generation & management
│   │   ├── breed_routes.py       # Breed matrix API
│   │   ├── archetype_routes.py   # Soul archetype API
│   │   └── ...
│   ├── scripts/
│   │   └── gen_remaining.py      # Background generation script
│   └── soul_archetype_engine.py  # 7 archetypes definitions
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArchetypeProducts.jsx     # NEW: Multi-factor products
│   │   │   ├── CuratedBundles.jsx        # NEW: Bundle deals
│   │   │   ├── SoulMadeCollection.jsx    # AI mockup products
│   │   │   ├── BreedSmartRecommendations.jsx
│   │   │   └── admin/
│   │   │       └── SoulProductsManager.jsx  # UPDATED: Edit modals
│   │   └── pages/
│   │       └── *.jsx  # All 13 pillar pages with Golden Standard
└── memory/
    ├── PRD.md                    # This file
    ├── COMPREHENSIVE_GAP_ANALYSIS.md
    ├── GOLDEN_STANDARD_LAYOUT.md
    └── complete-documentation.html
```

---

## 📋 HANDOVER CHECKLIST

For the next agent:

1. **Check mockup generation status:**
   ```bash
   curl $API_URL/api/mockups/stats
   ```

2. **If generation stopped, restart:**
   ```bash
   curl -X POST $API_URL/api/mockups/generate-batch -H "Content-Type: application/json" -d '{"limit": 50}'
   ```

3. **Sync new mockups to production periodically:**
   ```bash
   curl -X POST $API_URL/api/mockups/sync-to-production
   ```

4. **Test personalization by logging in as test user:**
   - Email: dipali@clubconcierge.in
   - Password: test123
   - Select different pets to see personalized content

5. **Priority tasks:**
   - P1: Fix Razorpay checkout bug
   - P0: Continue mockup generation (runs automatically)
   - P2: Verify mobile dashboard with user

---

## 📝 SESSION SUMMARY (March 10, 2026)

### What Was Accomplished:
1. ✅ Fixed all 13 pillar pages with Golden Standard components
2. ✅ Added ArchetypeProducts to all pages (multi-factor filtering)
3. ✅ Added CuratedBundles to all pages (bundle deals)
4. ✅ Created Soul Tier Admin UI with edit modals (stock, variants, sale price)
5. ✅ Fixed pet context consistency (selected pet shows correctly everywhere)
6. ✅ Fixed production sync endpoint (server-side to bypass CORS)
7. ✅ Synced 862 products to production
8. ✅ **NEW: Archetype Tone System** - Dynamic UI copy based on pet personality
   - Created `/frontend/src/utils/archetypeCopy.js` utility
   - Updated ArchetypeProducts.jsx with personalized greetings
   - Updated CuratedBundles.jsx with archetype-based bundle intro
   - Updated SoulMadeCollection.jsx with archetype-aware product intro

### What's Running:
- Mockup generation: ~36% complete (925/2569) - progressing
- Background batch processing continues automatically

### What Needs Attention:
- Razorpay P1 bug (checkout fails) - User requested to fix LAST
- Mobile dashboard visual bug (needs user verification)
- ~1,644 more mockups to generate

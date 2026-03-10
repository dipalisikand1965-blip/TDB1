# The Doggy Company - PRD (Product Requirements Document)
**Last Updated:** March 10, 2026 23:45 IST  
**Status:** Soul Made Products - 48.7% Mockups Generated (1250/2569) | Auto-Generator Running

---

## PRODUCT VISION
Hyper-personalized pet platform using "memory-led personalization" - products, content, and experiences tailored to each pet's breed, archetype, and life stage.

---

## COMPLETED FEATURES

### Phase 1: Core Infrastructure
- [x] FastAPI backend with MongoDB
- [x] React frontend with Tailwind CSS
- [x] User authentication (JWT)
- [x] Pet profile management (9 test pets)
- [x] Shopify product sync (2199 products)

### Phase 2: Soul Profile System
- [x] 51-question soul questionnaire
- [x] 26 canonical scoring fields
- [x] 7 Archetypes: Gentle Aristocrat, Wild Explorer, Velcro Baby, Snack Negotiator, Quiet Watcher, Social Butterfly, Brave Worrier

### Phase 3: Golden Standard Layout (All 13 Pillars)
- [x] Hero section with pet personalization
- [x] Mira's Quick Help (AI concierge)
- [x] Soul Made Products section
- [x] Breed-Smart Recommendations
- [x] Curated Bundles
- [x] Archetype Products

### Phase 4: AI Mockup Generation
- [x] OpenAI GPT Image 1 integration
- [x] Cloudinary upload and storage
- [x] 33 breeds x 65+ product types = 2569 products
- [x] Auto-generator script running in background
- [x] Progress: 1250/2569 (48.7%)

### Phase 5: Multi-Factor Filtering API
- [x] GET /api/products/multi-factor-filter
- [x] Filters by breed, archetype, life_stage
- [x] Personalization score calculation

### Phase 6: Soul Tier Admin UI
- [x] SoulProductsManager.jsx with edit modals
- [x] Stock, variants, sale price management
- [x] Real-time stats display (FIXED)
- [x] Auto-refresh every 30 seconds

### Phase 7: Archetype Tone System
- [x] archetypeCopy.js utility
- [x] Dynamic UI copy per archetype
- [x] Personalized greetings and product intros

### Phase 8: Curated Bundles System
- [x] 19 bundles across 12 pillars
- [x] All bundles have AI-generated images
- [x] Full CRUD API (/api/bundles)
- [x] Admin BundlesManager.jsx
- [x] Production sync endpoint

### Phase 9: Admin UI Fixes
- [x] Fixed stats showing 0/2569 -> now shows real numbers
- [x] Added fetchMockupStats() to initial load
- [x] Auto-refresh on Mockups tab
- [x] Loading skeletons while fetching
- [x] Synced breed_products to products_master (1244 products)

---

## IN PROGRESS

| Task | Progress | Notes |
|------|----------|-------|
| **Mockup Generation** | 48.7% | 1250/2569 - Auto-generator running |
| **Production Sync** | Pending | Run after mockups hit 80%+ |

---

## PENDING ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| Razorpay checkout "body error" | P1 | NOT STARTED |
| Mobile dashboard scrambled | P2 | User verification needed |

---

## KEY FILES

### Frontend
- `/app/frontend/src/components/admin/SoulProductsManager.jsx` - AI Mockups admin
- `/app/frontend/src/components/admin/BundlesManager.jsx` - Bundles admin
- `/app/frontend/src/components/ArchetypeProducts.jsx` - Archetype filtering
- `/app/frontend/src/components/CuratedBundles.jsx` - Bundle display
- `/app/frontend/src/utils/archetypeCopy.js` - Archetype copy utility

### Backend
- `/app/backend/app/api/mockup_routes.py` - Mockup generation APIs
- `/app/backend/app/api/bundle_routes.py` - Bundle CRUD APIs
- `/app/backend/auto_mockup_generator.py` - Auto-restart script
- `/app/backend/soul_archetype_engine.py` - Archetype definitions

---

## KEY API ENDPOINTS

### Mockups
- `GET /api/mockups/stats` - Overall statistics
- `GET /api/mockups/status` - Current generation status
- `POST /api/mockups/generate-batch` - Start batch generation
- `POST /api/mockups/sync-to-production` - Sync to prod

### Bundles
- `GET /api/bundles` - List bundles (filter by pillar)
- `POST /api/bundles` - Create bundle
- `PUT /api/bundles/{id}` - Update bundle
- `POST /api/bundles/{id}/generate-image` - Generate AI image
- `POST /api/bundles/sync-to-production` - Sync to prod

### Products
- `GET /api/products/multi-factor-filter` - Personalized filtering
- `GET /api/breed-products` - Breed-specific products

---

## DATABASE COLLECTIONS

- `products_master` - 3443 products (Shopify + Soul Made)
- `breed_products` - 2569 breed-specific products
- `unified_products` - 3338 unified catalog
- `bundles` - 19 curated bundles
- `pets` - Pet profiles with archetypes

---

## TEST CREDENTIALS

- **User:** dipali@clubconcierge.in / test123
- **Admin:** aditya / lola4304

---

## NEXT STEPS

1. **Monitor mockup generation** - Auto-running, check with `/api/mockups/stats`
2. **Fix Razorpay checkout** - P1 blocker
3. **Verify mobile dashboard** - Need user screenshot
4. **Run production sync** - After 80%+ mockups complete

---

## AUTO-GENERATOR

Running at: `/app/backend/auto_mockup_generator.py`
Log file: `/tmp/auto_mockup_generator.log`
Check status: `tail -20 /tmp/auto_mockup_generator.log`

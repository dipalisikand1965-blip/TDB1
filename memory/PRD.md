# The Doggy Company - MASTER PRD & ARCHITECTURE
## Last Updated: December 14, 2025 | Version 12.7.0

---

# CRITICAL: THE LEARN PAGE IS THE GOLD STANDARD

Every pillar page MUST follow the LEARN page's exact hierarchy. This is non-negotiable.

---

## GOLD STANDARD SECTION HIERARCHY (From Learn Page)

```
SECTION ORDER (Every Pillar Page MUST Follow):

1. ASK MIRA BAR (CMS DRIVEN)
   - Title with {petName} placeholder
   - Search input with CMS placeholder
   - Button with CMS color

2. TOPIC BOXES (4 topic cards, CMS DRIVEN)
   - Grid layout (2x2 on mobile, 4 columns on desktop)
   - UNIQUE AI watercolor images per topic
   - Opens PillarTopicModal (Overview | Products | Services)
   
3. DAILY TIP (Rotates based on day)
   - Category-specific icon
   - Tip content with expert advice
   - Badge showing category

4. HOW CAN WE HELP? (3 Action Buckets)
   - Opens Mira chat with context
   - Color-coded by category
   - 4 action items per bucket

5. PERSONALIZED FOR {PET} (Logged-in users)
   - Pet photo
   - MiraCarePlan / MiraLearnPlan component
   - Expandable tips based on breed/age

6. GUIDED PATHS (6 step-by-step journeys)
   - Each path has 5 steps
   - Color-coded by theme
   - Opens Mira for guidance

7. CURATED BUNDLES
   - CuratedBundles component
   - Watercolor AI images
   - Save messaging

8. PRODUCTS SECTION
   - SoulMadeCollection (breed-specific)
   - BreedSmartRecommendations
   - ArchetypeProducts

9. PERSONALIZED PICKS
   - PersonalizedPicks component
   - "Fun picks for {pet}"

10. MIRA CURATED LAYER
    - MiraCuratedLayer component
    - "Curated for {petName}" section
    - Unified concierge recommendations

11. SERVICES SECTION
    - "Services That Help" heading
    - Grid of service cards
    - Opens flow modals
```

---

## PILLAR PAGE AUDIT (December 14, 2025)

| # | Pillar | Ask Mira | Topics | Daily Tip | Help Buckets | Guided Paths | Bundles | Products | Picks | Curated | STATUS |
|---|--------|----------|--------|-----------|--------------|--------------|---------|----------|-------|---------|--------|
| 1 | Learn | YES | YES | YES | YES | YES | YES | YES | YES | - | GOLD STANDARD |
| 2 | Care | YES | YES | YES | YES | YES | YES | YES | YES | YES | COMPLETE |
| 3 | Dine | YES | YES | YES | YES | YES | YES | YES | YES | YES | COMPLETE |
| 4 | Fit | YES | YES | YES | YES | YES | YES | YES | YES | YES | COMPLETE |
| 5 | Travel | YES | YES | PARTIAL | NO | PARTIAL | YES | YES | YES | YES | NEEDS WORK |
| 6 | Stay | PARTIAL | YES | NO | NO | NO | YES | YES | YES | YES | NEEDS WORK |
| 7 | Enjoy | PARTIAL | YES | NO | NO | NO | YES | YES | YES | YES | NEEDS WORK |
| 8 | Celebrate | PARTIAL | YES | NO | NO | NO | YES | YES | YES | YES | NEEDS WORK |
| 9 | Emergency | PARTIAL | YES | NO | NO | NO | YES | YES | NO | NO | NEEDS WORK |
| 10 | Advisory | PARTIAL | YES | NO | NO | YES | YES | YES | NO | NO | NEEDS WORK |
| 11 | Farewell | PARTIAL | YES | NO | NO | PARTIAL | YES | YES | NO | NO | NEEDS WORK |
| 12 | Adopt | PARTIAL | YES | NO | NO | PARTIAL | YES | NO | NO | NO | NEEDS WORK |
| 13 | Shop | PARTIAL | YES | NO | NO | NO | NO | NO | YES | YES | NEEDS WORK |
| 14 | Paperwork | YES | NO | NO | NO | NO | YES | YES | YES | YES | NEEDS WORK |

### Summary:
- **COMPLETE (4):** Learn, Care, Dine, Fit
- **NEEDS WORK (10):** Travel, Stay, Enjoy, Celebrate, Emergency, Advisory, Farewell, Adopt, Shop, Paperwork

---

## PRODUCT/SERVICE IMAGE STATUS

### Current State (December 14, 2025):
- **Total Products:** 209 (97 in products_master + 112 in unified_products)
- **Products with AI watercolor images:** 209 (100%)
- **Products needing images:** 0

### Services:
- **Stay services:** Updated with new watercolor images (Dec 14)
- **Dine services:** Service cards added to page

---

## CMS ARCHITECTURE

### Admin Panel Location
`/admin` -> Select pillar tab (e.g., `care-cms`, `dine-cms`)

### CMS Components Location
```
/app/frontend/src/components/admin/
  PillarPageCMS.jsx       # Generic CMS (12 pillars)
  LearnPageCMS.jsx        # Custom Learn CMS
  PaperworkPageCMS.jsx    # Custom Paperwork CMS
```

### CMS Tabs (Standard for all pillars):
1. **Page Settings** - Title, Subtitle, Hero Image, Theme Color
2. **Ask Mira Bar** - Enabled, Placeholder, Button Color
3. **Topics/Categories** - Name, Icon, Color, Description, Image
4. **Products** - Selected products for pillar
5. **Bundles** - Curated bundles
6. **Services** - Related services
7. **Personalized** - Breed/archetype/soul picks toggles
8. **Concierge** - Premium assistance options
9. **Mira Prompts** - AI suggestion triggers
10. **Help Buckets** - 3 action buckets (NEW)
11. **Daily Tips** - Rotating tips (NEW)
12. **Guided Paths** - Step-by-step journeys (NEW)

### CMS-Editable Status:
- [x] Page Settings (Title, Subtitle)
- [x] Ask Mira Bar
- [x] Topics/Categories
- [x] Products
- [x] Bundles
- [x] Services
- [x] Help Buckets (3 action buckets) - IMPLEMENTED DEC 14
- [x] Daily Tips (rotating tips) - IMPLEMENTED DEC 14
- [x] Guided Paths (step-by-step journeys) - IMPLEMENTED DEC 14

---

## KEY COMPONENTS

### Page Components
```
/app/frontend/src/components/
  PillarTopicsGrid.jsx       # Topic cards + modal (48 AI images)
  PillarTopicModal.jsx       # Modal: Overview | Products | Services
  PersonalizedPicks.jsx      # "Fun picks for {pet}"
  ArchetypeProducts.jsx      # "Party picks for {pet}"
  SoulMadeCollection.jsx     # Breed-specific products
  BreedSmartRecommendations.jsx
  CuratedBundles.jsx
  Mira/
    MiraCuratedLayer.jsx   # "Curated for {petName}" - Unified concierge
    MiraCarePlan.jsx       # Care-specific plan
```

### Page Files
```
/app/frontend/src/pages/
  LearnPage.jsx       # GOLD STANDARD - Reference for all pages
  CarePage.jsx        # COMPLETE - Gold Standard compliant
  DinePage.jsx        # COMPLETE - Gold Standard compliant
  FitPage.jsx         # COMPLETE - Gold Standard compliant
  TravelPage.jsx      # NEEDS: Help Buckets, Daily Tip
  StayPage.jsx        # NEEDS: Ask Mira, Daily Tip, Help Buckets, Guided Paths
  EnjoyPage.jsx       # NEEDS: Ask Mira, Daily Tip, Help Buckets, Guided Paths
  CelebratePage.jsx   # NEEDS: Ask Mira, Daily Tip, Help Buckets, Guided Paths
  EmergencyPage.jsx   # NEEDS: Ask Mira, Daily Tip, Help Buckets, Guided Paths, Picks, Curated
  AdvisoryPage.jsx    # NEEDS: Ask Mira, Daily Tip, Help Buckets, Picks, Curated
  FarewellPage.jsx    # NEEDS: Ask Mira, Daily Tip, Help Buckets, Picks, Curated
  AdoptPage.jsx       # NEEDS: Ask Mira, Daily Tip, Help Buckets, Products, Picks, Curated
  ShopPage.jsx        # NEEDS: Ask Mira, Daily Tip, Help Buckets, Guided Paths, Bundles, Products
  PaperworkPage.jsx   # NEEDS: Topics, Daily Tip, Help Buckets, Guided Paths
```

---

## KNOWN ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| 10 pillars need Gold Standard refactor | P0 | IDENTIFIED |
| Sync to production "body stream already read" error | P1 | TO FIX |
| Razorpay checkout failure | P2 | NOT STARTED |
| Mobile pet dashboard scrambled | P3 | NOT STARTED |

---

## API ENDPOINTS

### CMS Config
```
GET  /api/{pillar}/page-config
POST /api/{pillar}/page-config
```

### Products & Bundles
```
GET /api/products?pillar={pillar}&search={term}&limit={n}
GET /api/bundles?pillar={pillar}
```

### Services
```
GET /api/services?pillar={pillar}&search={term}&limit={n}
```

### Image Updates (Admin)
```
POST /api/admin/fix-service-images?password=lola4304
POST /api/paperwork/admin/products/bulk-update-images
POST /api/paperwork/admin/bundles/bulk-update-images
```

### Sync to Production
```
POST /api/admin/sync-to-production
```

---

## TESTING CREDENTIALS

| Role | Username/Email | Password |
|------|----------------|----------|
| Admin | `aditya` | `lola4304` |
| User | `dipali@clubconcierge.in` | `test123` |

Test pet: **Mojo** (Shih Tzu), **Mystique** (Shih Tzu)

---

## PRIORITY TASK LIST (December 14, 2025)

1. ~~**P0**: Make Help Buckets, Daily Tips, Guided Paths CMS-editable~~ **DONE**
2. ~~**P0**: Create Admin Guide document for content editors~~ **DONE**
3. ~~**P0**: Generate AI watercolor images for all products~~ **DONE** (209 products)
4. **P0**: Refactor remaining 10 pillars to Gold Standard
   - Travel: Add Help Buckets, Daily Tip
   - Stay: Add Ask Mira, Daily Tip, Help Buckets, Guided Paths
   - Enjoy: Add Ask Mira, Daily Tip, Help Buckets, Guided Paths
   - Celebrate: Add Ask Mira, Daily Tip, Help Buckets, Guided Paths
   - Emergency: Add Ask Mira, Daily Tip, Help Buckets, Guided Paths, Picks, Curated
   - Advisory: Add Ask Mira, Daily Tip, Help Buckets, Picks, Curated
   - Farewell: Add Ask Mira, Daily Tip, Help Buckets, Picks, Curated
   - Adopt: Add Ask Mira, Daily Tip, Help Buckets, Products, Picks, Curated
   - Shop: Add Ask Mira, Daily Tip, Help Buckets, Guided Paths, Bundles, Products
   - Paperwork: Add Topics, Daily Tip, Help Buckets, Guided Paths
5. **P1**: Fix "Sync to production" body stream error
6. **P2**: Fix Razorpay checkout
7. **P3**: Fix mobile pet dashboard

---

## CHANGELOG

### December 14, 2025
- **Comprehensive Audit Complete**: Identified 10 pillars needing Gold Standard refactor
- **Product Image Makeover COMPLETE**: Generated 97 unique AI watercolor images for all products
- **Stay Service Images Updated**: New watercolor illustrations for hotel, boarding, daycare services
- **Dine Services Added**: Service category cards (Cafe Reservations, Birthday, Catering, Nutrition)
- **Gold Standard Refactoring**:
  - FitPage: Ask Mira Bar + Daily Tip + Help Buckets + Guided Paths - COMPLETE
  - TravelPage: Ask Mira Bar - ADDED
- CMS-editable sections implemented: Help Buckets, Daily Tips, Guided Paths
- Updated PillarPageCMS.jsx with 3 new tabs for editing page sections
- Updated backend API to save/load helpBuckets, dailyTips, guidedPaths
- Created Admin Guide document at /app/admin-guide.html
- Documentation updated proactively

### December 12, 2025
- Care page refactored to Gold Standard
- Dine page refactored to Gold Standard
- Generated 48 unique AI watercolor images (4 per pillar x 12 pillars)
- Updated PillarTopicsGrid with all new images
- Created PillarTopicModal for consistent modal experience

---

**END OF PRD - Version 12.7.0**

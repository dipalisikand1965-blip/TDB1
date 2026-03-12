# The Doggy Company - MASTER PRD & ARCHITECTURE
## Last Updated: December 14, 2025 | Version 12.6.0

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
    - Unified concierge recommendations

11. SERVICES SECTION
    - "Services That Help" heading
    - Grid of service cards
    - Opens flow modals

12. REQUEST FORM (Where applicable)
    - Service request wizard
```

---

## PILLAR REFACTORING STATUS

| # | Pillar | Gold Standard? | Unique AI Images? | Status |
|---|--------|----------------|-------------------|--------|
| 1 | Learn | REFERENCE | YES (12 topics) | COMPLETE |
| 2 | Care | YES | YES (4 topics) | COMPLETE |
| 3 | Dine | YES | YES (4 topics) | COMPLETE |
| 4 | Paperwork | Partial | YES | NEEDS REFACTOR |
| 5 | Fit | YES | YES (4 topics) | COMPLETE - Ask Mira at top |
| 6 | Travel | YES | YES (4 topics) | COMPLETE - Ask Mira at top |
| 7 | Stay | Partial | YES (4 topics) | NEEDS REFACTOR |
| 8 | Enjoy | Partial | YES (4 topics) | NEEDS REFACTOR |
| 9 | Celebrate | Partial | YES (4 topics) | NEEDS REFACTOR |
| 10 | Emergency | Partial | YES (4 topics) | NEEDS REFACTOR |
| 11 | Advisory | Partial | YES (4 topics) | NEEDS REFACTOR |
| 12 | Farewell | Partial | YES (4 topics) | NEEDS REFACTOR |
| 13 | Adopt | Partial | YES (4 topics) | NEEDS REFACTOR |
| 14 | Shop | Partial | YES (4 topics) | NEEDS REFACTOR |

---

## AI WATERCOLOR IMAGES - ALL 48 TOPIC IMAGES GENERATED

### Care Topics (COMPLETE)
- Grooming: Golden retriever being brushed
- Health & Wellness: Puppy with veterinarian
- Dental Care: Dog with sparkling teeth
- Skin & Coat: Fluffy dog with healthy coat

### Dine Topics (COMPLETE)
- Fresh Food: Dog with homemade food bowl
- Dry Food: Dog with premium kibble
- Treats: Dog with healthy treats
- Special Diets: Dog with hypoallergenic meal

### Fit Topics (COMPLETE)
- Exercise Plans: Athletic dog running
- Weight Management: Dog being weighed
- Agility Training: Dog jumping obstacles
- Swimming: Happy dog in water

### Travel Topics (COMPLETE)
- Air Travel: Dog in carrier at airport
- Road Trips: Dog looking out car window
- Destinations: Dog at beach paradise
- Travel Gear: Organized pet travel supplies

### Stay Topics (COMPLETE)
- Boarding, Daycare, Hotels, Sitting

### Enjoy Topics (COMPLETE)
- Pet Events, Playdates, Toys & Games, Enrichment

### Celebrate Topics (COMPLETE)
- Birthdays, Gotcha Day, Gifts, Photoshoots

### Emergency Topics (COMPLETE)
- Emergency Vet, First Aid, Poison Control, Lost Pet

### Advisory Topics (COMPLETE)
- Behavior, Nutrition, Training, Health

### Farewell Topics (COMPLETE)
- End-of-Life Care, Cremation, Memorials, Grief Support

### Adopt Topics (COMPLETE)
- Adopt a Dog, Foster, Shelters, Adoption Prep

### Shop Topics (COMPLETE)
- Essentials, New Arrivals, Bestsellers, Deals

---

## PRODUCT/SERVICE IMAGE STATUS

### Current State (December 14, 2025):
- **Total Products:** 209 (97 in products_master + 112 in unified_products)
- **Products with AI watercolor images:** 209 (100%)
- **Products needing images:** 0

### Image Generation Completed:
- Emergency pillar: 20 products
- Advisory pillar: 77 products (food, grooming, home comfort, training, travel, puppy, senior, seasonal)
- All products now have unique, contextual AI-generated watercolor illustrations

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
10. **Custom** - Pillar-specific features

### CMS-Editable Status:
- [x] Page Settings (Title, Subtitle)
- [x] Ask Mira Bar
- [x] Topics/Categories
- [x] Products
- [x] Bundles
- [x] Services
- [x] Help Buckets (3 action buckets) - **IMPLEMENTED DEC 14**
- [x] Daily Tips (rotating tips) - **IMPLEMENTED DEC 14**
- [x] Guided Paths (step-by-step journeys) - **IMPLEMENTED DEC 14**

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
    MiraCuratedLayer.jsx   # Unified concierge
    MiraCarePlan.jsx       # Care-specific plan
```

### Page Files
```
/app/frontend/src/pages/
  LearnPage.jsx       # GOLD STANDARD - Reference for all pages
  CarePage.jsx        # REFACTORED to Gold Standard
  DinePage.jsx        # REFACTORED to Gold Standard
  PaperworkPage.jsx   # Needs refactor
  FitPage.jsx         # Needs refactor
  TravelPage.jsx      # Needs refactor
  StayPage.jsx        # Needs refactor
  EnjoyPage.jsx       # Needs refactor
  CelebratePage.jsx   # Needs refactor
  EmergencyPage.jsx   # Needs refactor
  AdvisoryPage.jsx    # Needs refactor
  FarewellPage.jsx    # Needs refactor
  AdoptPage.jsx       # Needs refactor
  ShopPage.jsx        # Needs refactor
```

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

---

## TESTING CREDENTIALS

| Role | Username/Email | Password |
|------|----------------|----------|
| Admin | `aditya` | `lola4304` |
| User | `dipali@clubconcierge.in` | `test123` |

Test pet: **Mojo** (Shih Tzu)

---

## KNOWN ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| ~880 products missing images | P0 | IDENTIFIED - NOT STARTED |
| 11 pillars need Gold Standard refactor | P0 | IN PROGRESS |
| Razorpay checkout failure | P2 | NOT STARTED |
| Mobile pet dashboard scrambled | P3 | NOT STARTED |

---

## PRODUCTION SYNC COMMANDS

```bash
# Run after deployment
curl -X POST "https://thedoggycompany.com/api/admin/cleanup-duplicate-services?password=lola4304"
curl -X POST "https://thedoggycompany.com/api/admin/fix-service-images?password=lola4304"
```

---

## PRIORITY TASK LIST (December 14, 2025)

1. ~~**P0**: Make Help Buckets, Daily Tips, Guided Paths CMS-editable~~ **DONE**
2. ~~**P0**: Create Admin Guide document for content editors~~ **DONE**
3. ~~**P0**: Generate AI watercolor images for all products~~ **DONE** (209 products)
4. **P0**: Refactor remaining 11 pillars to Gold Standard
5. **P2**: Fix Razorpay checkout
6. **P3**: Fix mobile pet dashboard

---

## CHANGELOG

### December 14, 2025
- **Product Image Makeover COMPLETE**: Generated 97 unique AI watercolor images for all products
  - Emergency pillar: First aid kits, medical supplies, recovery items
  - Advisory pillar: Food/feeding, grooming, home comfort, training, travel, puppy, senior, seasonal products
  - All products_master (97) and unified_products (112) now have images
- **Gold Standard Refactoring IN PROGRESS**:
  - FitPage: Added Ask Mira Bar, Daily Tips, Help Buckets, Guided Paths sections
  - TravelPage: Added Ask Mira Bar at top
- CMS-editable sections implemented: Help Buckets, Daily Tips, Guided Paths
- Updated PillarPageCMS.jsx with 3 new tabs for editing page sections
- Updated backend API to save/load helpBuckets, dailyTips, guidedPaths
- Updated CarePage.jsx to use CMS data when available (falls back to defaults)
- Created Admin Guide document at /app/admin-guide.html
- Documentation updated proactively

### December 12, 2025
- Care page refactored to Gold Standard
- Dine page refactored to Gold Standard
- Generated 48 unique AI watercolor images (4 per pillar x 12 pillars)
- Updated PillarTopicsGrid with all new images
- Created PillarTopicModal for consistent modal experience
- Identified ~880 products needing images

### Previous Sessions
- All 14 pillar pages have CMS integration
- Product modals fixed (ArchetypeProducts, PersonalizedPicks)
- Paperwork page images complete
- Stay/Insurance service images updated

---

**END OF PRD - Version 12.6.0**

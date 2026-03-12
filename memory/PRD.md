# The Doggy Company - MASTER PRD & ARCHITECTURE
## Last Updated: December 12, 2025 | Version 12.4.0

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
| 1 | Learn | ✅ REFERENCE | ✅ YES | COMPLETE |
| 2 | Care | ✅ YES | ✅ YES (4 topics) | COMPLETE |
| 3 | Paperwork | ⚠️ Partial | ✅ YES | NEEDS REFACTOR |
| 4 | Dine | ❌ NO | ⚠️ Partial | NEEDS REFACTOR |
| 5 | Fit | ❌ NO | ⚠️ Partial | NEEDS REFACTOR |
| 6 | Travel | ❌ NO | ⚠️ Partial | NEEDS REFACTOR |
| 7 | Stay | ⚠️ Partial | ✅ YES | NEEDS REFACTOR |
| 8 | Enjoy | ❌ NO | ❌ NO | NEEDS REFACTOR |
| 9 | Celebrate | ❌ NO | ❌ NO | NEEDS REFACTOR |
| 10 | Emergency | ❌ NO | ❌ NO | NEEDS REFACTOR |
| 11 | Advisory | ❌ NO | ❌ NO | NEEDS REFACTOR |
| 12 | Farewell | ❌ NO | ❌ NO | NEEDS REFACTOR |
| 13 | Adopt | ❌ NO | ❌ NO | NEEDS REFACTOR |
| 14 | Shop | ❌ NO | ❌ NO | NEEDS REFACTOR |

---

## AI WATERCOLOR IMAGE REQUIREMENTS

**Every pillar needs:**
1. **4 Topic Card Images** - Unique watercolor illustration for each topic
2. **Bundle Images** - Watercolor style product bundles
3. **Service Images** - Contextual watercolor for services

**Image Style Guide:**
- Soft watercolor brush strokes
- Pastel/muted color palettes
- Dogs as main subjects (matching pillar theme)
- Warm, inviting, professional feel
- No text in images

**Generated Images So Far:**

### Care Topics (COMPLETE)
- Grooming: `ac244e936762d5167e08003826cc212675edb4681160ab0e623ac427b2eab48b.png`
- Health: `ca83e28df7d4b5d0a20b026170ebdf5877e4e4af30c34b3d51d24eb3be141afc.png`
- Dental: `de501f8bdf811377aeea9412f9b7ff6fb5e443ab900da010dd6a687f2fc0c816.png`
- Skin & Coat: `ce13cb96affa028566a1a81358f797d00b0ccd1536b26b6e8c38e18d8cf415d2.png`

### Stay Topics (COMPLETE)
- Boarding, Daycare, Hotels, Sitting - All have unique images

### Paperwork (COMPLETE)
- 14 products, 9 bundles - All have unique watercolor images

---

## CMS CONDITIONAL RENDERING PATTERN

```jsx
// EVERY section must be wrapped with CMS conditional
{cmsConfig.sections?.askMira?.enabled !== false && (
  <AskMiraSection />
)}

{cmsConfig.sections?.topics?.enabled !== false && (
  <PillarTopicsGrid pillar="care" />
)}

{cmsConfig.sections?.dailyTip?.enabled !== false && (
  <DailyTipSection />
)}

{cmsConfig.sections?.helpBuckets?.enabled !== false && (
  <HelpBucketsSection />
)}
```

---

## COMPONENT LOCATIONS

```
/app/frontend/src/components/
├── PillarTopicsGrid.jsx       # Topic cards + modal
├── PillarTopicModal.jsx       # Modal for topic details
├── PersonalizedPicks.jsx      # "Fun picks for {pet}"
├── ArchetypeProducts.jsx      # "Party picks for {pet}"
├── SoulMadeCollection.jsx     # Breed-specific products
├── BreedSmartRecommendations.jsx
├── CuratedBundles.jsx
├── Mira/
│   ├── MiraCuratedLayer.jsx   # Unified concierge layer
│   └── MiraCarePlan.jsx       # Care-specific Mira plan
└── admin/
    ├── PillarPageCMS.jsx      # Generic CMS (12 pillars)
    ├── LearnPageCMS.jsx       # Custom Learn CMS
    └── PaperworkPageCMS.jsx   # Custom Paperwork CMS
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
GET /api/products?pillar={pillar}&search={term}
GET /api/bundles?pillar={pillar}
```

### Services
```
GET /api/services?pillar={pillar}&search={term}
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

---

## PRODUCTION SYNC COMMANDS

```bash
# Run after deployment
curl -X POST "https://thedoggycompany.com/api/admin/cleanup-duplicate-services?password=lola4304"
curl -X POST "https://thedoggycompany.com/api/admin/fix-service-images?password=lola4304"
```

---

## KNOWN ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| Razorpay checkout failure | P2 | NOT STARTED |
| Mobile pet dashboard scrambled | P3 | NOT STARTED |

---

## NEXT TASKS (Priority Order)

1. **P0**: Refactor ALL remaining 11 pillars to Gold Standard
2. **P1**: Generate unique AI watercolor images for each pillar's topics
3. **P1**: Update bundle images to watercolor style
4. **P2**: Fix Razorpay checkout
5. **P3**: Fix mobile pet dashboard

---

**END OF PRD - Version 12.4.0**

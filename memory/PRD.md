# The Doggy Company - MASTER DOCUMENTATION
## Last Updated: December 12, 2025 | Version 12.3.0

---

# CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE MAKING ANY CHANGES

---

## LATEST UPDATES (Dec 12, 2025)

### COMPLETED TODAY:
1. **ALL 14 PILLAR PAGES NOW HAVE CMS INTEGRATION** 
   - Learn, Paperwork, Care, Fit, Travel, Stay, Dine, Enjoy, Celebrate, Emergency, Advisory, Farewell, Adopt, Shop
   - Each page fetches config from `/api/{pillar}/page-config`
   - Personalized titles using `{petName}` placeholders

2. **PRODUCT MODALS FIXED**
   - ArchetypeProducts component ("Party picks for {pet}") now opens full product modal on click
   - PersonalizedPicks component ("Fun picks for {pet}") has working modals
   - All product cards across the app have modal functionality

3. **AI-GENERATED WATERCOLOR IMAGES**
   - 14 Paperwork products with unique images
   - 9 Paperwork bundles with unique images
   - 29+ services updated with contextual images (Stay, Insurance, etc.)
   - Topic card images for Care, Fit, Travel, Dine, Stay pillars

4. **NEW COMPONENTS CREATED**
   - `PillarTopicsGrid.jsx` - Reusable topic cards component for any pillar
   - Default topics with AI images for Stay, Care, Fit, Travel, Dine

5. **SERVICE IMAGES FIXED**
   - All Stay, Insurance services now have AI-generated watercolor images
   - Backend endpoint `/api/admin/fix-service-images` updates all generic placeholders
   - Services API confirmed returning new images

---

## TABLE OF CONTENTS
1. [Original Problem Statement](#1-original-problem-statement)
2. [14-PILLAR CMS ARCHITECTURE](#2-14-pillar-cms-architecture)
3. [Technical Implementation](#3-technical-implementation)
4. [All 14 Pillar CMS Status](#4-all-14-pillar-cms-status)
5. [How To Build a CMS-Driven Page](#5-how-to-build-a-cms-driven-page)
6. [API Reference](#6-api-reference)
7. [File Structure Map](#7-file-structure-map)
8. [Personalization System](#8-personalization-system)
9. [Testing Credentials](#9-testing-credentials)
10. [Known Issues](#10-known-issues)
11. [Future Tasks & Roadmap](#11-future-tasks--roadmap)
12. [PillarTopicsGrid Component](#12-pillartopicsgrid-component)

---

# 1. ORIGINAL PROBLEM STATEMENT

Build **"The World's First Pet Life Operating System"** - **The Doggy Company**

| Feature | Description |
|---------|-------------|
| **14 Life Pillars** | Learn, Paperwork, Care, Fit, Travel, Stay, Dine, Enjoy, Celebrate, Emergency, Advisory, Farewell, Adopt, Shop |
| **AI Concierge (Mira)** | Conversational AI that knows pet's soul, breed, health, preferences |
| **Pet Soul Engine** | Personality profiling, archetype matching, breed intelligence |
| **Product Catalog** | 5,000+ products with Shopify integration |
| **Service Catalog** | 1,100+ services across all pillars |
| **Deep Personalization** | Based on pet profile, breed, age, health conditions |
| **AI Watercolor Aesthetic** | All visual assets in watercolor style |

---

# 2. 14-PILLAR CMS ARCHITECTURE

## 2.1 Architecture Overview

```
┌─────────────────────────────────────────┐
│           ADMIN PANEL                   │
│    /admin?tab={pillar}-cms              │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PillarPageCMS.jsx                             │
│    Generic React component for 12 pillars                        │
│    LearnPageCMS.jsx / PaperworkPageCMS.jsx for custom needs     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
┌─────────────────────┐  ┌────────────────┐  ┌────────────────────┐
│ GET /api/{pillar}/  │  │ POST /api/     │  │  MongoDB           │
│   page-config       │  │ {pillar}/      │  │  Collections       │
│                     │  │ page-config    │  │  - page_configs    │
└─────────────────────┘  └────────────────┘  │  - pillar_cms_*    │
                                             └────────────────────┘
```

## 2.2 Key Components with Product Modals

| Component | Location | Modal Status |
|-----------|----------|--------------|
| PersonalizedPicks | `/components/PersonalizedPicks.jsx` | ✅ HAS MODAL |
| ArchetypeProducts | `/components/ArchetypeProducts.jsx` | ✅ HAS MODAL (FIXED) |
| SoulMadeCollection | `/components/SoulMadeCollection.jsx` | ✅ HAS MODAL |
| LearnProductsGrid | `/components/Learn/LearnProductsGrid.jsx` | ✅ HAS MODAL |
| PillarTopicsGrid | `/components/PillarTopicsGrid.jsx` | ✅ Topic cards |
| ProductCard | `/components/ProductCard.jsx` | ✅ Contains ProductDetailModal |

## 2.3 Standard CMS Tabs (10 Tabs)

| # | Tab Name | Key Fields |
|---|----------|------------|
| 1 | Page Settings | title, subtitle, heroImage, themeColor |
| 2 | Ask Mira Bar | enabled, placeholder, buttonColor |
| 3 | Categories/Topics | name, icon, color, description, image |
| 4 | Products | selectedProducts[] |
| 5 | Bundles | selectedBundles[] |
| 6 | Services | selectedServices[] |
| 7 | Personalized | breedSmart, lifeStage, archetypePicks |
| 8 | Concierge | name, description, price, includes[] |
| 9 | Mira Prompts | type, trigger, message |
| 10 | Custom | Pillar-specific features |

---

# 3. TECHNICAL IMPLEMENTATION

## 3.1 CMS State Pattern (Add to any page)

```javascript
// CMS STATE
const [cmsConfig, setCmsConfig] = useState({
  title: "Page title with {petName}",
  subtitle: 'Subtitle text',
  askMira: { enabled: true, placeholder: "Search...", buttonColor: 'bg-blue-500' },
  sections: {
    askMira: { enabled: true },
    categories: { enabled: true },
    products: { enabled: true },
    personalized: { enabled: true }
  }
});
const [cmsCategories, setCmsCategories] = useState([]);
const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);

// Fetch function
const fetchCMSConfig = async () => {
  const response = await fetch(`${API_URL}/api/{pillar}/page-config`);
  if (response.ok) {
    const data = await response.json();
    if (data.config) setCmsConfig(prev => ({ ...prev, ...data.config }));
    if (data.categories?.length) setCmsCategories(data.categories);
  }
};

// Call in useEffect
useEffect(() => {
  fetchCMSConfig();
}, []);
```

## 3.2 Image Update Endpoints

```bash
# Fix service images (replaces generic Unsplash/Cloudinary placeholders)
POST /api/admin/fix-service-images?password=lola4304

# Bulk update product images
POST /api/paperwork/admin/products/bulk-update-images
Body: { "images": { "product_id": "image_url", ... } }

# Bulk update bundle images
POST /api/paperwork/admin/bundles/bulk-update-images
Body: { "images": { "bundle_id": "image_url", ... } }
```

---

# 4. ALL 14 PILLAR CMS STATUS

## 4.1 Admin CMS UI Status - ALL COMPLETE ✅

| # | Pillar | Admin Tab | CMS Component |
|---|--------|-----------|---------------|
| 1 | Learn | `learn-cms` | LearnPageCMS.jsx |
| 2 | Paperwork | `paperwork-cms` | PaperworkPageCMS.jsx |
| 3-14 | Others | `{pillar}-cms` | PillarPageCMS.jsx (generic) |

## 4.2 Page Dynamic Rendering Status - ALL COMPLETE

| # | Pillar | CMS-Driven? | Product Modals? | Topic Cards? |
|---|--------|-------------|-----------------|--------------|
| 1 | Learn | YES | YES | YES (12 topics) |
| 2 | Paperwork | YES | YES | YES (6 categories) |
| 3 | Care | YES | YES | YES (4 cards) |
| 4 | Fit | YES | YES | YES (4 cards) |
| 5 | Travel | YES | YES | YES (4 cards) |
| 6 | Stay | YES | YES | YES (4 cards) |
| 7 | Dine | YES | YES | YES (4 cards) |
| 8 | Enjoy | YES | YES | YES (4 cards) |
| 9 | Celebrate | YES | YES | YES (4 cards) |
| 10 | Emergency | YES | YES | YES (4 cards) |
| 11 | Advisory | YES | YES | YES (4 cards) |
| 12 | Farewell | YES | YES | YES (4 cards) |
| 13 | Adopt | YES | YES | YES (4 cards) |
| 14 | Shop | YES | YES | YES (4 cards) |

---

# 5. HOW TO BUILD A CMS-DRIVEN PAGE

## Step-by-Step Checklist

- [x] 1. Add CMS state variables (cmsConfig, cmsCategories, etc.)
- [x] 2. Add `fetchCMSConfig()` function
- [x] 3. Call `fetchCMSConfig()` in useEffect
- [x] 4. Create computed values with fallbacks
- [x] 5. Render sections conditionally based on `cmsConfig.sections`
- [x] 6. Use `{petName}` placeholders in titles
- [ ] 7. Add PillarTopicsGrid component for topic cards
- [ ] 8. Test with admin CMS changes

---

# 6. API REFERENCE

## 6.1 Generic CMS Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{pillar}/page-config` | Get page config |
| POST | `/api/{pillar}/page-config` | Save page config |

**Valid pillars:** care, fit, travel, stay, dine, enjoy, celebrate, emergency, advisory, farewell, adopt, shop

## 6.2 Dedicated Endpoints

| Method | Endpoint |
|--------|----------|
| GET/POST | `/api/learn/page-config` |
| GET/POST | `/api/paperwork/page-config` |

## 6.3 Admin Image Fix Endpoints

```bash
# Production sync commands (run after deployment)
curl -X POST "https://thedoggycompany.com/api/admin/cleanup-duplicate-services?password=lola4304"
curl -X POST "https://thedoggycompany.com/api/admin/fix-service-images?password=lola4304"
```

---

# 7. FILE STRUCTURE MAP

## 7.1 CMS Admin Components

```
/app/frontend/src/components/admin/
├── LearnPageCMS.jsx           # Custom CMS for Learn
├── PaperworkPageCMS.jsx       # Custom CMS for Paperwork
├── PillarPageCMS.jsx          # GENERIC CMS for 12 pillars
└── CloudinaryUploader.jsx     # Image uploads
```

## 7.2 Page Components (ALL CMS-DRIVEN)

```
/app/frontend/src/pages/
├── LearnPage.jsx              # ✅ CMS + Topics
├── PaperworkPage.jsx          # ✅ CMS + Categories
├── CarePage.jsx               # ✅ CMS
├── FitPage.jsx                # ✅ CMS
├── TravelPage.jsx             # ✅ CMS
├── StayPage.jsx               # ✅ CMS
├── DinePage.jsx               # ✅ CMS
├── EnjoyPage.jsx              # ✅ CMS
├── CelebratePage.jsx          # ✅ CMS
├── EmergencyPage.jsx          # ✅ CMS
├── AdvisoryPage.jsx           # ✅ CMS
├── FarewellPage.jsx           # ✅ CMS
├── AdoptPage.jsx              # ✅ CMS
└── ShopPage.jsx               # ✅ CMS
```

## 7.3 Product Display Components (ALL HAVE MODALS)

```
/app/frontend/src/components/
├── PersonalizedPicks.jsx      # "Fun picks for {pet}" ✅
├── ArchetypeProducts.jsx      # "Party picks for {pet}" ✅ FIXED
├── SoulMadeCollection.jsx     # Soul-based products ✅
├── BreedSmartRecommendations.jsx
├── CuratedBundles.jsx
├── PillarTopicsGrid.jsx       # Topic cards ✅
└── ProductCard.jsx            # ProductDetailModal
```

---

# 8. PERSONALIZATION SYSTEM

## 8.1 Dynamic Variables

| Variable | Example |
|----------|---------|
| `{petName}` | "Mojo" |
| `{breedName}` | "Shih Tzu" |
| `{petAge}` | "3 years" |

## 8.2 Personalization Types

| Type | CMS Toggle |
|------|------------|
| Breed-Smart | `breedSmart.enabled` |
| Life Stage | `lifeStage.enabled` |
| Archetype | `archetypePicks.enabled` |
| Soul Collection | `soulCollection.enabled` |

---

# 9. TESTING CREDENTIALS

| Role | Username/Email | Password |
|------|----------------|----------|
| **Admin** | `aditya` | `lola4304` |
| **User** | `dipali@clubconcierge.in` | `test123` |

Test pet: **Mojo** (Shih Tzu)

---

# 10. KNOWN ISSUES

| Issue | Priority | Status |
|-------|----------|--------|
| Razorpay checkout failure | P2 | NOT STARTED |
| Mobile pet dashboard scrambled | P3 | NOT STARTED |

---

# 11. FUTURE TASKS & ROADMAP

## 11.1 COMPLETED ✅

1. All 14 pillar pages have CMS integration
2. ArchetypeProducts modal fixed
3. AI images for Paperwork products/bundles
4. AI images for Stay/Insurance services
5. PillarTopicsGrid component created with AI images
6. Service images updated in backend

## 11.2 NEXT (P1)

1. Generate remaining AI topic images for Enjoy, Celebrate, Emergency, Advisory, Farewell, Adopt, Shop pillars (using default gradient placeholders currently)

## 11.3 LATER (P2)

1. Fix Razorpay checkout
2. Mobile pet dashboard
3. Instagram integration for Celebration Wall

---

# 12. PILLARTOPICSGRID COMPONENT

## 12.1 Location
`/app/frontend/src/components/PillarTopicsGrid.jsx`

## 12.2 Usage

```jsx
import PillarTopicsGrid, { DEFAULT_PILLAR_TOPICS } from '../components/PillarTopicsGrid';

// In your page component:
<PillarTopicsGrid
  pillar="stay"
  topics={cmsCategories.length > 0 ? cmsCategories : DEFAULT_PILLAR_TOPICS.stay}
  onTopicClick={(topic) => handleTopicClick(topic)}
  columns={4}
/>
```

## 12.3 Pillars with AI Images

| Pillar | Topics with Images |
|--------|-------------------|
| Stay | Boarding, Daycare, Hotels, Sitting |
| Care | Grooming, Health, Dental, Skin |
| Fit | Exercise, Weight, Agility, Swimming |
| Travel | Flights, Road, Destinations, Gear |
| Dine | Fresh, Dry, Treats, Special |

## 12.4 Pillars Pending Images

Enjoy, Celebrate, Emergency, Advisory, Farewell, Adopt, Shop

---

# PRODUCTION SYNC COMMANDS

```bash
# Run these after deployment to sync images and cleanup
curl -X POST "https://thedoggycompany.com/api/admin/cleanup-duplicate-services?password=lola4304"
curl -X POST "https://thedoggycompany.com/api/admin/fix-service-images?password=lola4304"
```

---

**END OF DOCUMENTATION - Version 12.3.0**

# The Doggy Company - MASTER DOCUMENTATION
## Last Updated: December 12, 2025 | Version 12.1.0

---

# CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE MAKING ANY CHANGES

---

## RECENT CHANGES (Dec 12, 2025)
- **ArchetypeProducts component now has product modals** - "Party picks for {pet}" section now opens full product detail modal on click
- **Paperwork products updated** - 14 unique AI-generated watercolor images for all products
- **Paperwork bundles updated** - 9 unique contextual images for all bundles
- **Added bulk image update endpoints** - POST `/api/paperwork/admin/products/bulk-update-images` and `/api/paperwork/admin/bundles/bulk-update-images`

---

## TABLE OF CONTENTS
1. [Original Problem Statement](#1-original-problem-statement)
2. [14-PILLAR CMS ARCHITECTURE - THE GOLDEN STANDARD](#2-14-pillar-cms-architecture---the-golden-standard)
3. [Technical Implementation Details](#3-technical-implementation-details)
4. [All 14 Pillar CMS Status](#4-all-14-pillar-cms-status)
5. [How To Build a New CMS-Driven Page](#5-how-to-build-a-new-cms-driven-page)
6. [API Reference](#6-api-reference)
7. [File Structure Map](#7-file-structure-map)
8. [Personalization System](#8-personalization-system)
9. [Testing Credentials](#9-testing-credentials)
10. [Known Issues](#10-known-issues)
11. [Future Tasks & Roadmap](#11-future-tasks--roadmap)

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
| **Concierge Service Desk** | Ticket system, SLA tracking, escalation |

---

# 2. 14-PILLAR CMS ARCHITECTURE - THE GOLDEN STANDARD

## 2.1 What is the Page CMS?

The Page CMS is a **centralized, database-driven content management system** that allows admins to control **every aspect** of pillar pages from the Admin Panel without touching code.

### Key Principles:
- **NO hardcoded content** - All text, images, categories, and sections come from the database
- **Admins control everything** - Non-technical users can modify page content
- **Consistent structure** - All 14 pillars follow the same architectural pattern
- **Dynamic rendering** - Pages render content fetched from API at runtime
- **Personalization preserved** - CMS content supports placeholders like `{petName}` and `{breedName}`

## 2.2 Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │           ADMIN PANEL                   │
                    │    /admin?tab={pillar}-cms              │
                    └─────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PillarPageCMS.jsx                                     │
│    Generic React component that renders 10-tab CMS UI for ANY pillar        │
│    Usage: <PillarPageCMS pillar="care" />                                   │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
┌─────────────────────┐  ┌────────────────┐  ┌────────────────────┐
│ GET /api/{pillar}/  │  │ POST /api/     │  │  MongoDB           │
│   page-config       │  │ {pillar}/      │  │  Collections       │
│                     │  │ page-config    │  │                    │
│ Fetches all config  │  │                │  │ - page_configs     │
│ for a pillar        │  │ Saves config   │  │ - pillar_cms_      │
│                     │  │ to MongoDB     │  │   categories       │
└─────────────────────┘  └────────────────┘  │ - pillar_cms_      │
                                             │   content          │
                                             │ - page_selections  │
                                             └────────────────────┘
                                  │
                                  ▼
              ┌─────────────────────────────────────────┐
              │        PILLAR PAGE (Frontend)           │
              │        e.g. LearnPage.jsx               │
              │                                         │
              │  1. Calls fetchCMSConfig()              │
              │  2. Sets state from API response        │
              │  3. Renders sections conditionally      │
              │  4. Uses CMS data with fallbacks        │
              └─────────────────────────────────────────┘
```

## 2.3 The Generic CMS Component

**File:** `/app/frontend/src/components/admin/PillarPageCMS.jsx`

This single component powers the CMS admin UI for 12 of the 14 pillars (Learn and Paperwork have custom CMS components for their unique requirements).

### Usage:
```jsx
import PillarPageCMS from '../components/admin/PillarPageCMS';

// In Admin.jsx render:
{activeTab === 'care-cms' && <PillarPageCMS pillar="care" />}
{activeTab === 'fit-cms' && <PillarPageCMS pillar="fit" />}
// ... etc for all 12 generic pillars
```

### Built-in Pillar Configurations:
```javascript
const PILLAR_CONFIGS = {
  care: { name: 'Care', icon: Heart, color: 'from-rose-500 to-pink-600', ... },
  fit: { name: 'Fit', icon: Dumbbell, color: 'from-green-500 to-emerald-600', ... },
  travel: { name: 'Travel', icon: Plane, color: 'from-cyan-500 to-blue-600', ... },
  stay: { name: 'Stay', icon: Bed, color: 'from-indigo-500 to-purple-600', ... },
  dine: { name: 'Dine', icon: Utensils, color: 'from-orange-500 to-amber-600', ... },
  enjoy: { name: 'Enjoy', icon: PartyPopper, color: 'from-pink-500 to-rose-600', ... },
  celebrate: { name: 'Celebrate', icon: PartyPopper, color: 'from-purple-500 to-pink-600', ... },
  emergency: { name: 'Emergency', icon: AlertTriangle, color: 'from-red-500 to-rose-600', ... },
  advisory: { name: 'Advisory', icon: BookOpen, color: 'from-teal-500 to-emerald-600', ... },
  farewell: { name: 'Farewell', icon: Flower2, color: 'from-gray-500 to-slate-600', ... },
  adopt: { name: 'Adopt', icon: Dog, color: 'from-amber-500 to-orange-600', ... },
  shop: { name: 'Shop', icon: ShoppingBag, color: 'from-blue-500 to-indigo-600', ... }
};
```

## 2.4 Standard CMS Tabs (10 Tabs)

Every pillar CMS has these 10 configurable tabs:

| Tab # | Tab Name | Description | Key Fields |
|-------|----------|-------------|------------|
| 1 | Page Settings | Overall page configuration | title, subtitle, heroImage, themeColor, sectionToggles |
| 2 | Ask Mira Bar | AI search bar configuration | enabled, placeholder, buttonColor, quickSuggestions[] |
| 3 | Categories/Topics | Main content sections | name, icon, color, description, image, subcategories[] |
| 4 | Products | Featured products selection | Select from unified_products catalog |
| 5 | Bundles | Curated bundles | Select from bundles collection |
| 6 | Services | Related services | Select from services_master catalog |
| 7 | Personalized | Personalization toggles | breedSmart, lifeStage, archetypePicks, soulCollection |
| 8 | Concierge | Premium services | name, description, price, turnaround, includes[] |
| 9 | Mira Prompts | AI contextual tips | type, trigger, message (with {petName} placeholders) |
| 10 | Custom | Pillar-specific features | Varies by pillar |

## 2.5 Standard Page Layout (Mira on Top)

All pillar pages should follow this standardized layout:

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER / NAVIGATION                                        │
├─────────────────────────────────────────────────────────────┤
│  1. ASK MIRA BAR (Search/AI)                                │
│     "What would you like to learn about {petName} today?"   │
├─────────────────────────────────────────────────────────────┤
│  2. MIRA'S CONTEXTUAL TIP                                   │
│     "Mystique doesn't have microchip records yet..."        │
├─────────────────────────────────────────────────────────────┤
│  3. MAIN CONTENT (Categories/Topics Grid)                   │
│     [Topic 1] [Topic 2] [Topic 3] [Topic 4]                 │
│     [Topic 5] [Topic 6] [Topic 7] [Topic 8]                 │
├─────────────────────────────────────────────────────────────┤
│  4. DAILY TIP (Rotating content)                            │
├─────────────────────────────────────────────────────────────┤
│  5. PERSONALIZED FOR {petName}                              │
│     (Breed-smart picks, archetype recommendations)          │
├─────────────────────────────────────────────────────────────┤
│  6. CURATED BUNDLES                                         │
├─────────────────────────────────────────────────────────────┤
│  7. PRODUCTS                                                │
├─────────────────────────────────────────────────────────────┤
│  8. CONCIERGE SERVICES                                      │
└─────────────────────────────────────────────────────────────┘
```

---

# 3. TECHNICAL IMPLEMENTATION DETAILS

## 3.1 Backend API Endpoints

**Generic Endpoint for 12 Pillars:**

```python
# File: /app/backend/server.py

VALID_CMS_PILLARS = ['care', 'fit', 'travel', 'stay', 'dine', 'enjoy', 
                     'celebrate', 'emergency', 'advisory', 'farewell', 'adopt', 'shop']

@api_router.get("/{pillar}/page-config")
async def get_pillar_page_config(pillar: str):
    """
    GET /api/{pillar}/page-config
    Returns complete page configuration for any pillar
    """
    if pillar not in VALID_CMS_PILLARS:
        raise HTTPException(status_code=404, detail=f"Use dedicated route for {pillar}")
    
    config = await db.page_configs.find_one({"pillar": pillar}, {"_id": 0})
    categories = await db.pillar_cms_categories.find({"pillar": pillar}, {"_id": 0}).to_list(50)
    cms_content = await db.pillar_cms_content.find_one({"pillar": pillar}, {"_id": 0})
    selections = await db.page_selections.find_one({"pillar": pillar}, {"_id": 0})
    
    return {
        "config": config or {},
        "categories": categories or [],
        "conciergeServices": (cms_content or {}).get("conciergeServices", []),
        "miraPrompts": (cms_content or {}).get("miraPrompts", []),
        "selectedProducts": (selections or {}).get("products", []),
        "selectedBundles": (selections or {}).get("bundles", []),
        "selectedServices": (selections or {}).get("services", []),
        "personalizationConfig": (cms_content or {}).get("personalizationConfig", {
            "breedSmart": {"enabled": True},
            "lifeStage": {"enabled": True},
            "archetypePicks": {"enabled": True},
            "soulCollection": {"enabled": True}
        })
    }

@api_router.post("/{pillar}/page-config")
async def save_pillar_page_config(pillar: str, data: dict):
    """
    POST /api/{pillar}/page-config
    Saves complete page configuration for any pillar
    """
    # Saves to: page_configs, pillar_cms_categories, pillar_cms_content, page_selections
```

**Dedicated Endpoints for Learn and Paperwork:**

- Learn: `/api/learn/page-config` - Has additional fields for topics, dailyTips, guidedPaths
- Paperwork: `/api/paperwork/page-config` - Has additional fields for documentCategories, vaultItems, checklistItems

## 3.2 Database Collections

```
MongoDB Database: the_doggy_company

Collections for CMS:
├── page_configs           # Main page settings (title, subtitle, theme)
│   └── Index: { pillar: 1 }
│
├── pillar_cms_categories  # Categories/topics for each pillar
│   └── Index: { pillar: 1 }
│
├── pillar_cms_content     # Concierge services, Mira prompts, personalization config
│   └── Index: { pillar: 1 }
│
├── page_selections        # Selected products, bundles, services
│   └── Index: { pillar: 1 }
│
├── learn_topics           # Learn page specific topics (12 topics)
│
├── learn_cms_content      # Learn page daily tips, help buckets
│
├── paperwork_cms_categories  # Paperwork document categories
│
└── paperwork_cms_content     # Paperwork checklists, reminders
```

## 3.3 Response Format

```json
{
  "config": {
    "pillar": "care",
    "title": "Everything {petName} needs to feel loved",
    "subtitle": "Grooming, health, wellness & daily care essentials",
    "heroImage": "https://...",
    "themeColor": "rose",
    "askMira": {
      "enabled": true,
      "placeholder": "Grooming tips for {breedName}...",
      "buttonColor": "bg-rose-500"
    },
    "sections": {
      "askMira": { "enabled": true },
      "categories": { "enabled": true },
      "dailyTip": { "enabled": true },
      "personalized": { "enabled": true },
      "bundles": { "enabled": true },
      "products": { "enabled": true },
      "concierge": { "enabled": true }
    }
  },
  "categories": [
    {
      "id": "grooming",
      "name": "Grooming",
      "icon": "Sparkles",
      "color": "from-pink-500 to-rose-500",
      "description": "Keep your pet looking and feeling their best",
      "image": "https://..."
    }
  ],
  "conciergeServices": [
    {
      "id": "1",
      "name": "Personal Grooming Consultation",
      "description": "1-on-1 grooming guidance for your pet's specific needs",
      "price": 999,
      "turnaround": "24 hours",
      "includes": ["Video call", "Written plan", "Product recommendations"]
    }
  ],
  "miraPrompts": [
    {
      "type": "tip",
      "trigger": "page_load",
      "message": "Did you know? {breedName}s need grooming every 4-6 weeks!"
    }
  ],
  "selectedProducts": ["prod_123", "prod_456"],
  "selectedBundles": ["bundle_789"],
  "selectedServices": ["svc_abc"],
  "personalizationConfig": {
    "breedSmart": { "enabled": true },
    "lifeStage": { "enabled": true },
    "archetypePicks": { "enabled": true },
    "soulCollection": { "enabled": true }
  }
}
```

---

# 4. ALL 14 PILLAR CMS STATUS

## 4.1 Admin CMS UI Status

| # | Pillar | CMS Component | Admin Tab | Default Categories | Status |
|---|--------|---------------|-----------|---------------------|--------|
| 1 | Learn | `LearnPageCMS.jsx` | `learn-cms` | 12 Topics | COMPLETE |
| 2 | Paperwork | `PaperworkPageCMS.jsx` | `paperwork-cms` | 6 Doc Types | COMPLETE |
| 3 | Care | `PillarPageCMS.jsx` | `care-cms` | 6 Categories | COMPLETE |
| 4 | Fit | `PillarPageCMS.jsx` | `fit-cms` | 6 Categories | COMPLETE |
| 5 | Travel | `PillarPageCMS.jsx` | `travel-cms` | 6 Categories | COMPLETE |
| 6 | Stay | `PillarPageCMS.jsx` | `stay-cms` | 6 Categories | COMPLETE |
| 7 | Dine | `PillarPageCMS.jsx` | `dine-cms` | 6 Categories | COMPLETE |
| 8 | Enjoy | `PillarPageCMS.jsx` | `enjoy-cms` | 6 Categories | COMPLETE |
| 9 | Celebrate | `PillarPageCMS.jsx` | `celebrate-cms` | 6 Categories | COMPLETE |
| 10 | Emergency | `PillarPageCMS.jsx` | `emergency-cms` | 6 Categories | COMPLETE |
| 11 | Advisory | `PillarPageCMS.jsx` | `advisory-cms` | 6 Categories | COMPLETE |
| 12 | Farewell | `PillarPageCMS.jsx` | `farewell-cms` | 6 Categories | COMPLETE |
| 13 | Adopt | `PillarPageCMS.jsx` | `adopt-cms` | 6 Categories | COMPLETE |
| 14 | Shop | `PillarPageCMS.jsx` | `shop-cms` | 6 Categories | COMPLETE |

## 4.2 Page Dynamic Rendering Status

| # | Pillar | Page File | CMS-Driven? | Personalization? | Status |
|---|--------|-----------|-------------|------------------|--------|
| 1 | Learn | `LearnPage.jsx` | YES | YES | COMPLETE |
| 2 | Paperwork | `PaperworkPage.jsx` | YES | YES | COMPLETE |
| 3 | Stay | `StayPage.jsx` | YES | YES | COMPLETE |
| 4 | Care | `CarePage.jsx` | YES | YES | COMPLETE |
| 5 | Fit | `FitPage.jsx` | YES | YES | COMPLETE |
| 6 | Travel | `TravelPage.jsx` | YES | YES | COMPLETE |
| 7 | Dine | `DinePage.jsx` | YES | YES | COMPLETE |
| 8 | Enjoy | `EnjoyPage.jsx` | YES | YES | COMPLETE |
| 9 | Celebrate | `CelebratePage.jsx` | YES | YES | COMPLETE |
| 10 | Emergency | `EmergencyPage.jsx` | YES | YES | COMPLETE |
| 11 | Advisory | `AdvisoryPage.jsx` | YES | YES | COMPLETE |
| 12 | Farewell | `FarewellPage.jsx` | YES | YES | COMPLETE |
| 13 | Adopt | `AdoptPage.jsx` | YES | YES | COMPLETE |
| 14 | Shop | `ShopPage.jsx` | YES | YES | COMPLETE |

---

# 5. HOW TO BUILD A NEW CMS-DRIVEN PAGE

## Step 1: Verify CMS Admin Exists

1. Login as admin: `/admin?tab={pillar}-cms`
2. If it renders, CMS admin is ready
3. If not, add to `Admin.jsx`:

```jsx
// In Admin.jsx, add to the PAGE CMS section tabs:
{ id: '{pillar}-cms', label: '{Pillar}', icon: IconComponent },

// Add render:
{activeTab === '{pillar}-cms' && <PillarPageCMS pillar="{pillar}" />}
```

## Step 2: Add CMS State to Page Component

```jsx
// At top of component (e.g., CarePage.jsx):

// CMS State
const [cmsConfig, setCmsConfig] = useState({
  title: 'Default title with {petName}',
  subtitle: 'Default subtitle',
  askMira: { enabled: true, placeholder: 'Search...' },
  sections: {
    askMira: { enabled: true },
    categories: { enabled: true },
    dailyTip: { enabled: true },
    personalized: { enabled: true },
    bundles: { enabled: true },
    products: { enabled: true },
    concierge: { enabled: true }
  }
});
const [cmsCategories, setCmsCategories] = useState([]);
const [cmsConciergeServices, setCmsConciergeServices] = useState([]);
const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);
```

## Step 3: Add fetchCMSConfig Function

```jsx
// Fetch CMS configuration
const fetchCMSConfig = async () => {
  try {
    const response = await fetch(`${API_URL}/api/{pillar}/page-config`);
    if (response.ok) {
      const data = await response.json();
      
      // Update config if exists
      if (data.config && Object.keys(data.config).length > 0) {
        setCmsConfig(prev => ({ ...prev, ...data.config }));
      }
      
      // Update categories if exists
      if (data.categories && data.categories.length > 0) {
        setCmsCategories(data.categories);
      }
      
      // Update concierge services
      if (data.conciergeServices && data.conciergeServices.length > 0) {
        setCmsConciergeServices(data.conciergeServices);
      }
      
      // Update Mira prompts
      if (data.miraPrompts && data.miraPrompts.length > 0) {
        setCmsMiraPrompts(data.miraPrompts);
      }
      
      console.log(`[{Pillar}Page] CMS config loaded`);
    }
  } catch (error) {
    console.error('Failed to fetch CMS config:', error);
    // Fallback to defaults is automatic
  }
};
```

## Step 4: Call in useEffect

```jsx
useEffect(() => {
  fetchCMSConfig();  // Load CMS config first
  fetchOtherData();  // Other data fetches
}, []);
```

## Step 5: Create Computed Values with Fallbacks

```jsx
// Use CMS data with fallback to defaults
const categories = cmsCategories.length > 0 ? cmsCategories : DEFAULT_CATEGORIES;
const conciergeServices = cmsConciergeServices.length > 0 ? cmsConciergeServices : DEFAULT_SERVICES;

// Personalize title with pet name
const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet') ||
  `Default title for ${activePet?.name || 'your pet'}`;
```

## Step 6: Render Sections Conditionally

```jsx
// Only render if enabled in CMS
{cmsConfig.sections?.askMira?.enabled !== false && (
  <AskMiraSection 
    placeholder={cmsConfig.askMira?.placeholder} 
    buttonColor={cmsConfig.askMira?.buttonColor}
  />
)}

{cmsConfig.sections?.categories?.enabled !== false && (
  <CategoriesSection categories={categories} />
)}

{cmsConfig.sections?.personalized?.enabled !== false && activePet && (
  <PersonalizedSection pet={activePet} />
)}
```

## Step 7: Test

1. Login as admin: `aditya / lola4304`
2. Go to `/admin?tab={pillar}-cms`
3. Make changes, save
4. Visit `/{pillar}` page as user
5. Verify changes appear
6. Test personalization with logged-in user who has a pet

---

# 6. API REFERENCE

## 6.1 Generic Pillar Page Config Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{pillar}/page-config` | Get page configuration |
| POST | `/api/{pillar}/page-config` | Save page configuration |

**Valid pillars:** care, fit, travel, stay, dine, enjoy, celebrate, emergency, advisory, farewell, adopt, shop

## 6.2 Dedicated Endpoints (Learn & Paperwork)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/learn/page-config` | Get Learn page config |
| POST | `/api/learn/page-config` | Save Learn page config |
| GET | `/api/paperwork/page-config` | Get Paperwork page config |
| POST | `/api/paperwork/page-config` | Save Paperwork page config |

## 6.3 Example Curl Commands

```bash
# Get Care page config
curl -X GET "https://yourapp.com/api/care/page-config"

# Save Care page config
curl -X POST "https://yourapp.com/api/care/page-config" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "title": "Care for {petName}",
      "subtitle": "Complete wellness solutions",
      "askMira": { "enabled": true, "placeholder": "Search care..." }
    },
    "categories": [...],
    "conciergeServices": [...],
    "miraPrompts": [...]
  }'
```

---

# 7. FILE STRUCTURE MAP

## 7.1 CMS Admin Components

```
/app/frontend/src/components/admin/
├── LearnPageCMS.jsx           # Custom CMS for Learn (unique tabs)
├── PaperworkPageCMS.jsx       # Custom CMS for Paperwork (unique tabs)
├── PillarPageCMS.jsx          # GENERIC CMS for 12 pillars (1098 lines)
└── CloudinaryUploader.jsx     # Image upload component
```

## 7.2 Page Components (to be refactored)

```
/app/frontend/src/pages/
├── LearnPage.jsx              # DONE - CMS-driven
├── PaperworkPage.jsx          # DONE - CMS-driven with product modals
├── StayPage.jsx               # DONE - CMS-driven
├── CarePage.jsx               # TODO
├── FitPage.jsx                # TODO
├── TravelPage.jsx             # TODO
├── DinePage.jsx               # TODO
├── EnjoyPage.jsx              # TODO
├── CelebratePage.jsx          # TODO
├── EmergencyPage.jsx          # TODO
├── AdvisoryPage.jsx           # TODO
├── FarewellPage.jsx           # TODO
├── AdoptPage.jsx              # TODO
└── ShopPage.jsx               # TODO
```

## 7.3 Key Product Display Components (All have Product Modals)

```
/app/frontend/src/components/
├── PersonalizedPicks.jsx      # "Fun picks for {pet}" - HAS product modal
├── ArchetypeProducts.jsx      # "Party picks for {pet}" - HAS product modal (FIXED)
├── SoulMadeCollection.jsx     # Soul-based products - HAS product modal
├── BreedSmartRecommendations.jsx # Breed-specific products
├── CuratedBundles.jsx         # Bundle cards
└── ProductCard.jsx            # Contains ProductDetailModal (shared)
```

## 7.3 Backend

```
/app/backend/
├── server.py                  # Main server - contains generic CMS endpoints
│   ├── GET/POST /{pillar}/page-config (line ~6500)
│   └── VALID_CMS_PILLARS list
├── learn_routes.py            # Learn-specific endpoints (if exists)
└── paperwork_routes.py        # Paperwork-specific endpoints (if exists)
```

## 7.4 Admin Panel Integration

```
/app/frontend/src/pages/Admin.jsx

Line ~2977-2990: PAGE CMS tab definitions
├── { id: 'learn-cms', label: 'Learn', icon: GraduationCap }
├── { id: 'paperwork-cms', label: 'Paperwork', icon: FileText }
├── { id: 'care-cms', label: 'Care', icon: Heart }
│   ... (all 14 pillars)
└── { id: 'shop-cms', label: 'Shop', icon: ShoppingBag }

Line ~3670-3691: Tab rendering
├── {activeTab === 'learn-cms' && <LearnPageCMS />}
├── {activeTab === 'paperwork-cms' && <PaperworkPageCMS />}
├── {activeTab === 'care-cms' && <PillarPageCMS pillar="care" />}
│   ... (all 12 generic pillars)
└── {activeTab === 'shop-cms' && <PillarPageCMS pillar="shop" />}
```

---

# 8. PERSONALIZATION SYSTEM

## 8.1 Dynamic Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{petName}` | Current pet's name | "Mojo" |
| `{breedName}` | Pet's breed | "Shih Tzu" |
| `{petAge}` | Pet's age in human terms | "3 years" |
| `{percent}` | Completion percentage | "67" |
| `{days}` | Days until event | "30" |

## 8.2 Personalization Types

| Type | Description | CMS Toggle |
|------|-------------|------------|
| **Breed-Smart** | Products filtered by breed characteristics | `breedSmart.enabled` |
| **Life Stage** | Puppy/Adult/Senior appropriate products | `lifeStage.enabled` |
| **Archetype** | Based on pet personality type (Guardian, Explorer, etc.) | `archetypePicks.enabled` |
| **Soul Collection** | Based on pet soul profile analysis | `soulCollection.enabled` |

## 8.3 How Personalization Works

1. Page loads and calls `fetchCMSConfig()`
2. Gets current pet from `usePillarContext()` hook
3. Replaces `{petName}`, `{breedName}` placeholders in CMS text
4. Filters products/services based on pet's breed, age, size
5. Shows archetype-specific recommendations if soul profile exists

---

# 9. TESTING CREDENTIALS

| Role | Username/Email | Password |
|------|----------------|----------|
| **Admin** | `aditya` | `lola4304` |
| **User** | `dipali@clubconcierge.in` | `test123` |

### Test User's Pet Data
- Pet Name: **Mojo**
- Breed: **Shih Tzu**
- Has soul profile: Yes

---

# 10. KNOWN ISSUES

## 10.1 Current Issues

| Issue | Priority | Status |
|-------|----------|--------|
| Razorpay checkout "body error" | P2 | NOT STARTED |
| Mobile pet dashboard scrambled | P3 | NOT STARTED |
| AI image generation not persistent | P1 | NOT STARTED |
| Bidirectional sync needs UI | P2 | NOT STARTED |

## 10.2 Common Fixes

| Issue | Solution |
|-------|----------|
| MongoDB ObjectId error | Exclude `_id` in projections: `{"_id": 0}` |
| React hooks error | All hooks must be called before any early return |
| CMS not loading | Check pillar is in VALID_CMS_PILLARS or has dedicated route |
| Personalization not showing | Verify user is logged in and has a pet profile |

---

# 11. FUTURE TASKS & ROADMAP

## 11.1 COMPLETED

1. **All 14 Pillar Pages have CMS Integration** - COMPLETE (Dec 12, 2025)
   - Learn, Paperwork, Care, Fit, Travel, Stay, Dine, Enjoy, Celebrate, Emergency, Advisory, Farewell, Adopt, Shop
   - All pages fetch config from `/api/{pillar}/page-config`
   - All pages have personalized titles using `{petName}` placeholders
   - All pages have CMS-driven sections toggle

2. **ArchetypeProducts now has product modals** - COMPLETE
   - "Party picks for {pet}" section opens full product detail modal on click

3. **Paperwork products updated** - COMPLETE
   - 14 unique AI-generated watercolor images
   - 9 unique bundle images

4. **Insurance service images fixed** - COMPLETE
   - 5 insurance services now have proper contextual images

## 11.2 Next Phase (P1)

5. **Test all pages thoroughly** - Verify CMS works on all pages

## 11.3 Later (P2)

4. Fix Razorpay checkout
5. Add bidirectional sync UI to admin
6. Fix mobile pet dashboard

## 11.4 Page Refactor Checklist

For each pillar page, verify:
- [ ] CMS state variables added
- [ ] `fetchCMSConfig()` function added
- [ ] Called in useEffect
- [ ] Default fallbacks exist
- [ ] Hardcoded content replaced with CMS data
- [ ] Ask Mira bar at top
- [ ] Contextual Mira prompt shown
- [ ] Personalized sections work
- [ ] Concierge services render from CMS
- [ ] Tested with logged-in user
- [ ] Personalization verified with pet profile

---

# 12. PILLAR DEFAULT CATEGORIES

## Learn (12 Topics)
1. Puppy Basics
2. Breed Guides
3. Food & Feeding
4. Grooming
5. Behavior
6. Training Basics
7. Travel with Dogs
8. Senior Dog Care
9. Health Basics
10. Rescue / Indie Care
11. Seasonal Care
12. New Pet Parent Guide

## Other Pillars (6 Categories each)

**Paperwork:** Identity & Safety, Medical & Health, Travel Documents, Insurance & Financial, Care & Training, Legal & Compliance

**Care:** Grooming, Health & Wellness, Hygiene, Dental Care, Skin & Coat, Senior Care

**Fit:** Exercise & Activity, Weight Management, Agility & Sports, Swimming, Walks & Hikes, Rest & Recovery

**Travel:** Air Travel, Road Trips, Pet-Friendly Destinations, Travel Gear, Travel Documents, Travel Safety

**Stay:** Pet Boarding, Daycare, Pet Hotels, Home Sitting, Overnight Care, Special Needs Boarding

**Dine:** Fresh Food, Dry Food & Kibble, Treats & Snacks, Supplements, Special Diets, Meal Plans

**Enjoy:** Pet Events, Activities, Playdates, Toys & Games, Enrichment, Experiences

**Celebrate:** Birthdays, Gotcha Day, Special Occasions, Gifts & Surprises, Pet Cakes & Treats, Photoshoots

**Emergency:** Emergency Vet, First Aid, Poison Control, Lost Pet Help, Urgent Care, Emergency Insurance

**Advisory:** Nutrition Advisory, Behavior Consultation, Training Guidance, Health Advisory, Breed Expert, Lifestyle Planning

**Farewell:** End-of-Life Care, Cremation Services, Memorials, Urns & Keepsakes, Grief Support, Rainbow Bridge

**Adopt:** Adopt a Dog, Foster, Rescue Support, Shelters Near You, Rehoming, Adoption Prep

**Shop:** Essentials, Collections, New Arrivals, Bestsellers, Deals & Offers, Subscriptions

---

# END OF DOCUMENTATION

**This document is the SINGLE SOURCE OF TRUTH for the 14-Pillar CMS Architecture.**
**ALL future development MUST adhere to this standard.**

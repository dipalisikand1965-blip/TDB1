# The Doggy Company — MASTER DOCUMENTATION
## Last Updated: December 12, 2025 | Version 11.0.0

---

# ⚠️ CRITICAL: READ THIS ENTIRE DOCUMENT BEFORE MAKING ANY CHANGES ⚠️

---

## TABLE OF CONTENTS
1. [Original Problem Statement](#1-original-problem-statement)
2. [PAGE CMS ARCHITECTURE - THE GOLDEN STANDARD](#2-page-cms-architecture)
3. [ALL 14 PILLAR CMS STATUS](#3-all-14-pillar-cms-status)
4. [HOW TO BUILD A NEW PILLAR PAGE](#4-how-to-build-a-new-pillar-page)
5. [API ENDPOINTS REFERENCE](#5-api-endpoints-reference)
6. [FILE STRUCTURE](#6-file-structure)
7. [PERSONALIZATION SYSTEM](#7-personalization-system)
8. [TESTING CREDENTIALS](#8-testing-credentials)
9. [KNOWN ISSUES & FIXES](#9-known-issues)
10. [FUTURE TASKS](#10-future-tasks)

---

# 1. ORIGINAL PROBLEM STATEMENT

Build **"The World's First Pet Life Operating System"** — **The Doggy Company** with:

| Feature | Description |
|---------|-------------|
| **14 Life Pillars** | Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Emergency, Advisory, Farewell, Adopt, Shop |
| **AI Concierge (Mira)** | Conversational AI that knows pet's soul, breed, health, preferences |
| **Pet Soul Engine** | Personality profiling, archetype matching, breed intelligence |
| **Product Catalog** | 5,000+ products with Shopify integration |
| **Service Catalog** | 1,100+ services across all pillars |
| **Deep Personalization** | Based on pet profile, breed, age, health conditions |
| **AI Watercolor Aesthetic** | All visual assets in watercolor style |
| **Concierge Service Desk** | Ticket system, SLA tracking, escalation |

---

# 2. PAGE CMS ARCHITECTURE - THE GOLDEN STANDARD

## ⚠️ EVERY PILLAR PAGE MUST USE THIS ARCHITECTURE ⚠️

### 2.1 What is Page CMS?

A centralized Admin interface where **EVERY component** of a pillar page is configurable:
- No hardcoded content
- Admins control everything from Admin Panel
- Consistent structure across all 14 pillars
- Pages render dynamically from database

### 2.2 Standard CMS Structure (9 Tabs)

```
PILLAR PAGE CMS
│
├── Tab 1: 🎨 PAGE SETTINGS
│   ├── Page Title (use {petName} for personalization)
│   ├── Page Subtitle
│   ├── Hero Image (Cloudinary upload)
│   ├── Theme Color
│   └── Section Visibility Toggles
│
├── Tab 2: 🔍 ASK MIRA BAR
│   ├── Enable/Disable toggle
│   ├── Placeholder text
│   ├── Button color
│   └── Quick suggestions (array)
│
├── Tab 3: 📁 CATEGORIES/TOPICS
│   ├── Add/Edit/Delete categories
│   ├── Each category has:
│   │   ├── Name
│   │   ├── Icon
│   │   ├── Color gradient
│   │   ├── Description
│   │   ├── Image (Cloudinary)
│   │   └── Subcategories (array)
│
├── Tab 4: 🛍️ PRODUCTS
│   └── Select featured products from catalog
│
├── Tab 5: 🎁 BUNDLES
│   └── Select featured bundles from catalog
│
├── Tab 6: 💼 SERVICES
│   └── Select featured services from catalog
│
├── Tab 7: 🐕 PERSONALIZED
│   ├── Breed-Smart Recommendations (toggle)
│   ├── Life Stage Products (toggle)
│   ├── Archetype-Based Picks (toggle)
│   └── Soul-Made Collection (toggle)
│
├── Tab 8: 👑 CONCIERGE SERVICES
│   ├── Add/Edit/Delete premium services
│   ├── Each service has:
│   │   ├── Name
│   │   ├── Description
│   │   ├── Price (₹)
│   │   ├── Turnaround time
│   │   ├── CTA button text
│   │   └── Includes (array)
│
└── Tab 9: 🧠 MIRA PROMPTS
    ├── Add/Edit/Delete AI prompts
    ├── Each prompt has:
    │   ├── Type (tip/reminder/suggestion/nudge)
    │   ├── Trigger condition
    │   └── Message (use {petName}, {breedName})
```

### 2.3 Page Layout Standard (Option A - Mira on Top)

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 ASK MIRA BAR (Search/AI assistant)                      │
├─────────────────────────────────────────────────────────────┤
│  💬 MIRA'S CONTEXTUAL TIP                                   │
│  "Mystique doesn't have microchip records yet..."           │
├─────────────────────────────────────────────────────────────┤
│  📁 MAIN CONTENT (Categories/Topics/Vault)                  │
├─────────────────────────────────────────────────────────────┤
│  🐕 PERSONALIZED FOR {petName}                              │
│  (Breed-smart, archetype picks, soul collection)            │
├─────────────────────────────────────────────────────────────┤
│  🎁 BUNDLES                                                 │
├─────────────────────────────────────────────────────────────┤
│  🛍️ PRODUCTS                                                │
├─────────────────────────────────────────────────────────────┤
│  👑 CONCIERGE SERVICES                                      │
└─────────────────────────────────────────────────────────────┘
```

---

# 3. ALL 14 PILLAR CMS STATUS

## 3.1 CMS Admin UI Status

| # | Pillar | CMS File | Admin Tab | Status | Categories |
|---|--------|----------|-----------|--------|------------|
| 1 | Learn | `LearnPageCMS.jsx` | `learn-cms` | ✅ COMPLETE | 12 Topics |
| 2 | Paperwork | `PaperworkPageCMS.jsx` | `paperwork-cms` | ✅ COMPLETE | 6 Doc Types |
| 3 | Care | `PillarPageCMS.jsx` | `care-cms` | ✅ COMPLETE | 6 Categories |
| 4 | Fit | `PillarPageCMS.jsx` | `fit-cms` | ✅ COMPLETE | 6 Categories |
| 5 | Travel | `PillarPageCMS.jsx` | `travel-cms` | ✅ COMPLETE | 6 Categories |
| 6 | Stay | `PillarPageCMS.jsx` | `stay-cms` | ✅ COMPLETE | 6 Categories |
| 7 | Dine | `PillarPageCMS.jsx` | `dine-cms` | ✅ COMPLETE | 6 Categories |
| 8 | Enjoy | `PillarPageCMS.jsx` | `enjoy-cms` | ✅ COMPLETE | 6 Categories |
| 9 | Celebrate | `PillarPageCMS.jsx` | `celebrate-cms` | ✅ COMPLETE | 6 Categories |
| 10 | Emergency | `PillarPageCMS.jsx` | `emergency-cms` | ✅ COMPLETE | 6 Categories |
| 11 | Advisory | `PillarPageCMS.jsx` | `advisory-cms` | ✅ COMPLETE | 6 Categories |
| 12 | Farewell | `PillarPageCMS.jsx` | `farewell-cms` | ✅ COMPLETE | 6 Categories |
| 13 | Adopt | `PillarPageCMS.jsx` | `adopt-cms` | ✅ COMPLETE | 6 Categories |
| 14 | Shop | `PillarPageCMS.jsx` | `shop-cms` | ✅ COMPLETE | 6 Categories |

## 3.2 Page Dynamic Rendering Status

| # | Pillar | Page File | Renders from CMS? | Status |
|---|--------|-----------|-------------------|--------|
| 1 | Learn | `LearnPage.jsx` | ✅ YES | COMPLETE |
| 2 | Paperwork | `PaperworkPage.jsx` | 🔄 IN PROGRESS | Refactoring |
| 3 | Care | `CarePage.jsx` | ❌ NO | TODO |
| 4 | Fit | `FitPage.jsx` | ❌ NO | TODO |
| 5 | Travel | `TravelPage.jsx` | ❌ NO | TODO |
| 6 | Stay | `StayPage.jsx` | ❌ NO | TODO |
| 7 | Dine | `DinePage.jsx` | ❌ NO | TODO |
| 8 | Enjoy | `EnjoyPage.jsx` | ❌ NO | TODO |
| 9 | Celebrate | `CelebratePage.jsx` | ❌ NO | TODO |
| 10 | Emergency | `EmergencyPage.jsx` | ❌ NO | TODO |
| 11 | Advisory | `AdvisoryPage.jsx` | ❌ NO | TODO |
| 12 | Farewell | `FarewellPage.jsx` | ❌ NO | TODO |
| 13 | Adopt | `AdoptPage.jsx` | ❌ NO | TODO |
| 14 | Shop | `ShopPage.jsx` | ❌ NO | TODO |

---

# 4. HOW TO BUILD A NEW PILLAR PAGE (CMS-Driven)

## Step 1: Check if CMS Admin exists
- Go to `/admin?tab={pillar}-cms`
- If it loads, CMS admin is ready
- If not, add to `Admin.jsx` (see Section 6)

## Step 2: Seed default data
```bash
curl -X POST "{API_URL}/api/{pillar}/page-config" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "pillar": "{pillar}",
      "title": "Title with {petName}",
      "subtitle": "Subtitle here",
      "askMira": { "enabled": true, "placeholder": "Search..." }
    },
    "categories": [...],
    "conciergeServices": [...],
    "miraPrompts": [...]
  }'
```

## Step 3: Refactor the Page component

```jsx
// 1. Add CMS state at top of component
const [cmsConfig, setCmsConfig] = useState({
  title: 'Default title with {petName}',
  subtitle: 'Default subtitle',
  askMira: { enabled: true, placeholder: 'Search...' },
  sections: { askMira: { enabled: true }, ... }
});
const [cmsCategories, setCmsCategories] = useState([]);
const [cmsConciergeServices, setCmsConciergeServices] = useState([]);
const [cmsMiraPrompts, setCmsMiraPrompts] = useState([]);

// 2. Add fetchCMSConfig function
const fetchCMSConfig = async () => {
  try {
    const res = await fetch(`${API_URL}/api/{pillar}/page-config`);
    if (res.ok) {
      const data = await res.json();
      if (data.config) setCmsConfig(prev => ({ ...prev, ...data.config }));
      if (data.categories?.length) setCmsCategories(data.categories);
      if (data.conciergeServices?.length) setCmsConciergeServices(data.conciergeServices);
      if (data.miraPrompts?.length) setCmsMiraPrompts(data.miraPrompts);
    }
  } catch (err) { console.error(err); }
};

// 3. Call in useEffect
useEffect(() => {
  fetchCMSConfig();
  // ... other fetch calls
}, []);

// 4. Use computed values with fallbacks
const categories = cmsCategories.length > 0 ? cmsCategories : DEFAULT_CATEGORIES;
const pageTitle = cmsConfig.title?.replace('{petName}', activePet?.name || 'your pet');

// 5. Render conditionally based on sections
{cmsConfig.sections?.askMira?.enabled !== false && (
  <AskMiraSection placeholder={cmsConfig.askMira?.placeholder} />
)}
```

## Step 4: Test
1. Login as admin: `aditya / lola4304`
2. Go to `/admin?tab={pillar}-cms`
3. Make changes, save
4. Visit `/{pillar}` page
5. Verify changes appear

---

# 5. API ENDPOINTS REFERENCE

## 5.1 Page Config Endpoints

| Pillar | GET Endpoint | POST Endpoint |
|--------|--------------|---------------|
| Learn | `/api/learn/page-config` | `/api/learn/page-config` |
| Paperwork | `/api/paperwork/page-config` | `/api/paperwork/page-config` |
| Care | `/api/care/page-config` | `/api/care/page-config` |
| Fit | `/api/fit/page-config` | `/api/fit/page-config` |
| Travel | `/api/travel/page-config` | `/api/travel/page-config` |
| Stay | `/api/stay/page-config` | `/api/stay/page-config` |
| Dine | `/api/dine/page-config` | `/api/dine/page-config` |
| Enjoy | `/api/enjoy/page-config` | `/api/enjoy/page-config` |
| Celebrate | `/api/celebrate/page-config` | `/api/celebrate/page-config` |
| Emergency | `/api/emergency/page-config` | `/api/emergency/page-config` |
| Advisory | `/api/advisory/page-config` | `/api/advisory/page-config` |
| Farewell | `/api/farewell/page-config` | `/api/farewell/page-config` |
| Adopt | `/api/adopt/page-config` | `/api/adopt/page-config` |
| Shop | `/api/shop/page-config` | `/api/shop/page-config` |

## 5.2 Response Format

```json
{
  "config": {
    "pillar": "care",
    "title": "Everything {petName} needs",
    "subtitle": "Grooming, health, wellness",
    "askMira": { "enabled": true, "placeholder": "..." },
    "sections": { "askMira": { "enabled": true }, ... }
  },
  "categories": [...],
  "conciergeServices": [...],
  "miraPrompts": [...],
  "selectedProducts": [...],
  "selectedBundles": [...],
  "selectedServices": [...],
  "personalizationConfig": {
    "breedSmart": { "enabled": true },
    "lifeStage": { "enabled": true },
    "archetypePicks": { "enabled": true },
    "soulCollection": { "enabled": true }
  }
}
```

---

# 6. FILE STRUCTURE

## 6.1 CMS Admin Components

```
/app/frontend/src/components/admin/
├── LearnPageCMS.jsx          # Custom CMS for Learn (825 lines)
├── PaperworkPageCMS.jsx      # Custom CMS for Paperwork (900+ lines)
├── PillarPageCMS.jsx         # Universal CMS for all other pillars (1095 lines)
└── CloudinaryUploader.jsx    # Image upload component
```

## 6.2 Page Components

```
/app/frontend/src/pages/
├── LearnPage.jsx             # ✅ CMS-driven
├── PaperworkPage.jsx         # 🔄 Refactoring to CMS
├── CarePage.jsx              # ❌ TODO: Refactor
├── FitPage.jsx               # ❌ TODO: Refactor
├── TravelPage.jsx            # ❌ TODO: Refactor
├── StayPage.jsx              # ❌ TODO: Refactor
├── DinePage.jsx              # ❌ TODO: Refactor
├── EnjoyPage.jsx             # ❌ TODO: Refactor
├── CelebratePage.jsx         # ❌ TODO: Refactor
├── EmergencyPage.jsx         # ❌ TODO: Refactor
├── AdvisoryPage.jsx          # ❌ TODO: Refactor
├── FarewellPage.jsx          # ❌ TODO: Refactor
├── AdoptPage.jsx             # ❌ TODO: Refactor
└── ShopPage.jsx              # ❌ TODO: Refactor
```

## 6.3 Backend Routes

```
/app/backend/
├── server.py                 # Generic /api/{pillar}/page-config endpoints
├── learn_routes.py           # /api/learn/* endpoints
└── paperwork_routes.py       # /api/paperwork/* endpoints
```

## 6.4 Database Collections

```
MongoDB Collections:
├── page_configs              # Stores pillar page settings
├── pillar_cms_categories     # Categories for each pillar
├── pillar_cms_content        # Concierge services, Mira prompts
├── page_selections           # Selected products/bundles/services
├── learn_topics              # Learn page topics
├── learn_cms_content         # Learn page daily tips, guided paths
├── paperwork_cms_categories  # Paperwork document categories
└── paperwork_cms_content     # Paperwork checklist, reminders
```

---

# 7. PERSONALIZATION SYSTEM

## 7.1 Dynamic Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{petName}` | Current pet's name | "Mystique" |
| `{breedName}` | Pet's breed | "Shih Tzu" |
| `{percent}` | Completion percentage | "67" |
| `{days}` | Days until event | "30" |

## 7.2 Personalization Types

| Type | Description | CMS Toggle |
|------|-------------|------------|
| **Breed-Smart** | Products matched to breed | `breedSmart.enabled` |
| **Life Stage** | Puppy/Adult/Senior products | `lifeStage.enabled` |
| **Archetype** | Based on personality type | `archetypePicks.enabled` |
| **Soul Collection** | Based on pet soul profile | `soulCollection.enabled` |

## 7.3 How Personalization Works

1. Page loads → fetches CMS config
2. Gets current pet from context (`usePillarContext`)
3. Replaces `{petName}` in titles with actual name
4. Filters products based on breed/size/age
5. Shows archetype-specific recommendations

---

# 8. TESTING CREDENTIALS

| Role | Username/Email | Password |
|------|----------------|----------|
| **Admin** | `aditya` | `lola4304` |
| **User** | `dipali@clubconcierge.in` | `test123` |

### User's Pet Data
- Pet Name: **Mojo** (previously Mystique)
- Breed: **Shih Tzu**
- Has soul profile: Yes

---

# 9. KNOWN ISSUES & FIXES

## 9.1 Current Issues

| Issue | Priority | Status |
|-------|----------|--------|
| Razorpay checkout "body error" | P2 | NOT STARTED |
| Mobile pet dashboard scrambled | P3 | NOT STARTED |
| AI image generation not persistent | P1 | NOT STARTED |
| Bidirectional sync needs UI | P2 | NOT STARTED |

## 9.2 Recurring Issues

| Issue | Fix |
|-------|-----|
| AI generation stops | Restart via `/api/ai-images/generate-product-images?password=lola4304` |
| MongoDB ObjectId error | Exclude `_id` in projections: `{"_id": 0}` |
| React hooks error | All hooks must be called before any early return |

---

# 10. FUTURE TASKS

## 10.1 Priority Order

1. **P0**: Finish PaperworkPage.jsx refactor (Mira on top, CMS-driven)
2. **P1**: Refactor remaining 12 pillar pages to be CMS-driven
3. **P1**: Generate AI watercolor illustrations for personalized sections
4. **P2**: Fix Razorpay checkout
5. **P2**: Add bidirectional sync UI to admin
6. **P3**: Fix mobile pet dashboard
7. **P3**: Make AI generation persistent (queue-based)

## 10.2 Page Refactor Checklist

For each pillar page:
- [ ] Add CMS state variables
- [ ] Add `fetchCMSConfig()` function
- [ ] Call in useEffect
- [ ] Add default fallbacks
- [ ] Replace hardcoded content with CMS data
- [ ] Add Mira bar at top
- [ ] Add contextual Mira prompt
- [ ] Add personalized sections
- [ ] Add concierge services from CMS
- [ ] Test with logged-in user
- [ ] Verify personalization works

---

# 11. PILLAR CATEGORY DEFAULTS

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

## Paperwork (6 Categories)
1. Identity & Safety (microchip, adoption, registration)
2. Medical & Health (vaccination, deworming, health checkup)
3. Travel Documents (airline cert, health cert, passport)
4. Insurance & Financial (policy, claims, receipts)
5. Care & Training (grooming, training certs)
6. Legal & Compliance (license, permits)

## Care (6 Categories)
1. Grooming
2. Health & Wellness
3. Hygiene
4. Dental Care
5. Skin & Coat
6. Senior Care

## Fit (6 Categories)
1. Exercise & Activity
2. Weight Management
3. Agility & Sports
4. Swimming
5. Walks & Hikes
6. Rest & Recovery

## Travel (6 Categories)
1. Air Travel
2. Road Trips
3. Pet-Friendly Destinations
4. Travel Gear
5. Travel Documents
6. Travel Safety

## Stay (6 Categories)
1. Pet Boarding
2. Daycare
3. Pet Hotels
4. Home Sitting
5. Overnight Care
6. Special Needs Boarding

## Dine (6 Categories)
1. Fresh Food
2. Dry Food & Kibble
3. Treats & Snacks
4. Supplements
5. Special Diets
6. Meal Plans

## Enjoy (6 Categories)
1. Pet Events
2. Activities
3. Playdates
4. Toys & Games
5. Enrichment
6. Experiences

## Celebrate (6 Categories)
1. Birthdays
2. Gotcha Day
3. Special Occasions
4. Gifts & Surprises
5. Pet Cakes & Treats
6. Photoshoots

## Emergency (6 Categories)
1. Emergency Vet
2. First Aid
3. Poison Control
4. Lost Pet Help
5. Urgent Care
6. Emergency Insurance

## Advisory (6 Categories)
1. Nutrition Advisory
2. Behavior Consultation
3. Training Guidance
4. Health Advisory
5. Breed Expert
6. Lifestyle Planning

## Farewell (6 Categories)
1. End-of-Life Care
2. Cremation Services
3. Memorials
4. Urns & Keepsakes
5. Grief Support
6. Rainbow Bridge

## Adopt (6 Categories)
1. Adopt a Dog
2. Foster
3. Rescue Support
4. Shelters Near You
5. Rehoming
6. Adoption Prep

## Shop (6 Categories)
1. Essentials
2. Collections
3. New Arrivals
4. Bestsellers
5. Deals & Offers
6. Subscriptions

---

# END OF DOCUMENTATION

**This document is the SINGLE SOURCE OF TRUTH for the Page CMS architecture.**
**ALL future agents MUST read this before making changes.**

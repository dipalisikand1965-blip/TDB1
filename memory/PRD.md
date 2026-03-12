# The Doggy Company — Complete Product Requirements Document
## Last Updated: December 12, 2025 (Version 10.2 - Learn Page Fully CMS-Driven)

---

## 1. Original Problem Statement

Build **"The World's First Pet Life Operating System"** — a comprehensive platform called **The Doggy Company** with:
- **14 life pillars** (Celebrate, Dine, Stay, Travel, Care, Enjoy, Fit, Learn, Paperwork, Emergency, Advisory, Farewell, Adopt, Shop)
- **AI-powered concierge (Mira)** — conversational AI that knows your pet's soul, breed, health, preferences
- **Pet Soul Engine** — personality profiling, archetype matching, breed intelligence
- **5,000+ products** and **1,100+ services** catalog with Shopify integration
- **Deep personalization** based on pet profile, breed, age, health conditions
- **AI watercolor aesthetic** for all visual assets
- **Concierge-grade service desk** with ticket system, SLA tracking, escalation

---

## LATEST: ALL 14 PILLAR CMS SYSTEMS COMPLETE (December 12, 2025)

### Universal CMS Architecture
Created a **scalable, reusable CMS** that works for ALL 14 pillars:

| Pillar | CMS Status | Default Categories |
|--------|------------|-------------------|
| Learn | ✅ Custom (LearnPageCMS.jsx) | 12 Topics |
| Paperwork | ✅ Custom (PaperworkPageCMS.jsx) | 6 Doc Categories |
| Care | ✅ Universal (PillarPageCMS.jsx) | 6 Categories |
| Fit | ✅ Universal | 6 Categories |
| Travel | ✅ Universal | 6 Categories |
| Stay | ✅ Universal | 6 Categories |
| Dine | ✅ Universal | 6 Categories |
| Enjoy | ✅ Universal | 6 Categories |
| Celebrate | ✅ Universal | 6 Categories |
| Emergency | ✅ Universal | 6 Categories |
| Advisory | ✅ Universal | 6 Categories |
| Farewell | ✅ Universal | 6 Categories |
| Adopt | ✅ Universal | 6 Categories |
| Shop | ✅ Universal | 6 Categories |

### CMS Features (9 Tabs per Pillar)
1. **Settings** - Title with {petName}, Subtitle, Hero Image, Section Visibility
2. **Ask Mira** - Search bar config, placeholder, suggestions
3. **Categories** - Add/edit categories with images, subcategories, colors
4. **Products** - Select featured products
5. **Bundles** - Select featured bundles
6. **Services** - Select featured services
7. **Personalized** - Breed-smart, life stage, archetype, soul toggles
8. **Concierge** - Premium services with pricing & CTAs
9. **Mira Prompts** - Contextual tips, reminders, suggestions, nudges

### Backend API
- **Generic Endpoint**: `GET/POST /api/{pillar}/page-config`
- Works for all 12 pillars (care, fit, travel, stay, dine, enjoy, celebrate, emergency, advisory, farewell, adopt, shop)
- Learn and Paperwork have dedicated routes

### Files Created
- `/app/frontend/src/components/admin/PillarPageCMS.jsx` - Universal CMS component (1095 lines)
- Updated `/app/backend/server.py` - Generic page-config endpoints

---

## PREVIOUS: PAPERWORK PAGE CMS (December 12, 2025)

### What Was Built
A **comprehensive Paperwork Page CMS** with 11 tabs controlling every aspect:

| Tab | Features |
|-----|----------|
| **Settings** | Page Title with `{petName}`, Subtitle, Theme Color, Hero Image, Section Visibility |
| **Ask Mira** | Enable/disable, Placeholder text, Button color, Quick suggestions |
| **Categories** | 6 document folders (Identity, Medical, Travel, Insurance, Care, Legal) with subcategories |
| **Checklist** | Essential + recommended documents for completion tracker |
| **Reminders** | 5 reminder templates with days, message, channels (email/sms/push) |
| **Products** | Select featured paperwork products |
| **Bundles** | Select featured paperwork bundles |
| **Services** | Select document services |
| **Personalized** | Breed-smart, life stage, archetype, soul collection toggles |
| **Concierge** | 6 premium services (Document Assist, Passport, Microchip, Insurance, Emergency, Renewal) |
| **Mira Prompts** | Contextual tips, reminders, suggestions, nudges with triggers |

### Pre-Seeded Data
- **6 Document Categories** with subcategories
- **6 Checklist Items** (Microchip, Vaccination, Adoption, Insurance, License, Health Cert)
- **5 Reminder Templates** (Vaccination, Insurance, License, Health Checkup, Deworming)
- **6 Concierge Services** with pricing (₹0 to ₹2999)
- **6 Mira Prompts** (tips, reminders, suggestions, nudges)

### Testing Status: ✅ 100% PASSED (iteration_97)
- Backend: 14/14 tests passed
- Frontend: All 11 tabs verified

---

## PREVIOUS: LEARN PAGE CMS (December 12, 2025)

### Phase 1: Admin CMS UI ✅ COMPLETE
A **comprehensive Learn Page CMS** with 7 tabs controlling every aspect of the Learn page:

| Tab | Features |
|-----|----------|
| **Settings** | Page Title with `{petName}` personalization, Subtitle, Theme Color, Hero Image, Section Visibility |
| **Ask Mira** | Enable/disable search bar, Placeholder text, Button color, Quick suggestions |
| **Topics** | Add/edit/delete 12 topics, each with subtopics, YouTube videos, products, services |
| **Content** | Daily Learning Tips (rotating), Guided Learning Paths, Help Buckets |
| **Bundles** | Select featured bundles to display |
| **Products** | Select featured products |
| **Services** | Select featured services |

### Phase 2: Dynamic Page Rendering ✅ COMPLETE
**LearnPage.jsx refactored to be 100% CMS-driven:**
- Fetches configuration from `/api/learn/page-config` on page load
- Topics, Daily Tips, Help Buckets all render from CMS data
- Title personalization: `{petName}` → actual pet name (e.g., "Mojo")
- Default fallbacks if CMS returns empty data (ensures page never breaks)

### Personalization Verified ✅
| User State | Title Shows |
|------------|-------------|
| Guest (not logged in) | "What would you like to learn about **your dog** today?" |
| Logged in with pet | "What would you like to learn about **Mojo** today?" |

### Testing Status: ✅ 100% PASSED (Both iterations)
- **iteration_95.json**: CMS Admin UI - all 7 tabs functional
- **iteration_96.json**: Dynamic page rendering + personalization verified

### Files Modified
- `/app/frontend/src/components/admin/LearnPageCMS.jsx` - Complete CMS UI (825+ lines)
- `/app/frontend/src/pages/LearnPage.jsx` - Refactored for CMS-driven rendering
- `/app/backend/learn_routes.py` - Updated endpoints for dailyTips, guidedPaths, helpBuckets

---

## 2. PAGE CMS ARCHITECTURE (⚠️ CRITICAL - READ THIS FIRST)

### 2.1 Overview

**ALL pillar pages MUST use the Page CMS architecture.** This ensures:
- Admins control ALL content from the Admin Panel
- No hardcoded product/service assignments
- Consistent structure across all pillars
- Easy maintenance and updates

### 2.2 Page CMS Structure

```
PILLAR PAGE CMS (Template for ALL Pillars)
│
├── 🎨 PAGE SETTINGS
│   ├── Page Title (editable)
│   ├── Page Subtitle (editable)
│   ├── Hero Image (Cloudinary upload)
│   ├── Theme Color
│   └── Section Visibility Toggles
│
├── 📚 TOPICS SECTION
│   ├── Section Title
│   └── Topics (add/remove/reorder):
│       └── EACH TOPIC:
│           ├── Title, Slug, Description
│           ├── Image (Cloudinary upload)
│           └── MODAL CONTENT:
│               ├── Subtopics → Overview Tab
│               ├── Videos (YouTube URLs) → Videos Tab
│               ├── Products (pick from catalog) → Products Tab
│               └── Services (pick from catalog) → Services Tab
│
├── 🎁 BUNDLES SECTION
│   └── Selected Bundles (pick from catalog)
│
├── 🛍️ PRODUCTS SECTION
│   └── Featured Products (pick from catalog)
│
├── 🔧 SERVICES SECTION
│   └── Featured Services (pick from catalog)
│
└── 👤 PERSONALIZATION
    ├── Show breed-specific products
    ├── Show archetype recommendations
    └── Show "Recommended for {pet}"
```

### 2.3 Database Collections

| Collection | Purpose |
|------------|---------|
| `page_configs` | Page-level settings (title, hero, sections) |
| `{pillar}_topics` | Topics for each pillar page |
| `page_selections` | Featured bundles/products/services per page |

### 2.4 API Endpoints Pattern

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/{pillar}/page-config` | GET | Load page configuration |
| `/api/{pillar}/page-config` | POST | Save page configuration |
| `/api/{pillar}/topic-products/{slug}` | GET | Get products for topic modal |

### 2.5 Frontend Files Pattern

| File | Purpose |
|------|---------|
| `/components/admin/{Pillar}PageCMS.jsx` | Admin CMS interface |
| `/pages/{Pillar}Page.jsx` | The pillar page (reads from CMS) |
| `/components/{pillar}/{Pillar}TopicModal.jsx` | Topic modal component |

### 2.6 How to Add CMS to a New Pillar

**Step 1: Copy Learn as Template**
```bash
# Copy these files and rename:
cp LearnPageCMS.jsx {Pillar}PageCMS.jsx
cp LearnTopicModal.jsx {Pillar}TopicModal.jsx
```

**Step 2: Create Backend Endpoints**
```python
# In {pillar}_routes.py

@router.get("/page-config")
async def get_page_config():
    db = get_db()
    config = await db.page_configs.find_one({"pillar": "{pillar}"})
    topics = await db.{pillar}_topics.find({}).sort("order", 1).to_list(50)
    return {"config": config, "topics": topics}

@router.post("/page-config")
async def save_page_config(data: dict):
    # Save config and topics
    ...
```

**Step 3: Add to Admin Panel**
```jsx
// In Admin.jsx
import {Pillar}PageCMS from '../components/admin/{Pillar}PageCMS';

// Add tab
{ id: '{pillar}-cms', label: '{Pillar} Page', icon: Icon }

// Add content
{activeTab === '{pillar}-cms' && <{Pillar}PageCMS />}
```

**Step 4: Update Pillar Page to Read from CMS**
```jsx
// In {Pillar}Page.jsx
useEffect(() => {
    fetch(`${API_URL}/api/{pillar}/page-config`)
        .then(res => res.json())
        .then(data => {
            setPageConfig(data.config);
            setTopics(data.topics);
        });
}, []);
```

### 2.7 ⚠️ RULES FOR ALL AGENTS

1. **NEVER hardcode product/service assignments**
2. **ALWAYS use CMS for admin-controlled content**
3. **ALWAYS provide fallbacks when no products assigned**
4. **ALWAYS use CloudinaryUploader for images**
5. **ALWAYS follow the same structure for ALL pillars**

---

## 3. Platform Architecture

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS + Shadcn/UI |
| Backend | FastAPI (Python) + MongoDB Atlas |
| AI | OpenAI GPT-4o via Emergent LLM Key |
| Images | Cloudinary + AI watercolor generation |
| Payments | Razorpay (BROKEN), Shopify sync |
| APIs | Google Places, OpenWeatherMap, YouTube Data API, Shopify |
| Auth | JWT-based custom auth |
| Hosting | Kubernetes (Emergent preview) |

### Key URLs
- Preview: `https://learn-page-studio.preview.emergentagent.com`
- Production: `https://thedoggycompany.com`

### Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

---

## 4. Learn Page CMS (REFERENCE IMPLEMENTATION)

### 4.1 Files

| File | Path | Purpose |
|------|------|---------|
| LearnPageCMS.jsx | `/frontend/src/components/admin/LearnPageCMS.jsx` | Admin CMS |
| LearnTopicModal.jsx | `/frontend/src/components/learn/LearnTopicModal.jsx` | Topic modal |
| LearnPage.jsx | `/frontend/src/pages/LearnPage.jsx` | The page |
| learn_routes.py | `/backend/learn_routes.py` | API endpoints |

### 4.2 Admin Location

Admin Panel → **Page CMS** → **Learn Page**

### 4.3 What Admin Can Control

- Page title and subtitle
- Hero image
- Topics (add/remove/reorder)
- For each topic: subtopics, videos, products, services
- Featured bundles
- Featured products
- Featured services
- Section visibility

---

## 5. Pillar Implementation Status

| Pillar | CMS Implemented | Status |
|--------|-----------------|--------|
| Learn | ✅ YES | Golden Standard |
| Advisory | ❌ Hardcoded | Needs CMS |
| Care | ❌ Hardcoded | Needs CMS |
| Fit | ❌ Hardcoded | Needs CMS |
| Stay | ❌ Hardcoded | Needs CMS |
| Travel | ❌ Hardcoded | Needs CMS |
| Dine | ❌ Hardcoded | Needs CMS |
| Enjoy | ❌ Hardcoded | Needs CMS |
| Celebrate | ❌ Hardcoded | Needs CMS |
| Paperwork | ❌ Hardcoded | Needs CMS |
| Emergency | ❌ Hardcoded | Needs CMS |
| Farewell | ❌ Hardcoded | Needs CMS |
| Adopt | ❌ Hardcoded | Needs CMS |
| Shop | N/A | Different structure |

---

## 6. AI Image Generation System

### Status
- Running in background
- Generates watercolor images for breed-specific products
- Progress visible in Admin Panel

### Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/ai-images/status` | Check if running |
| `GET /api/ai-images/stats` | Coverage stats |
| `POST /api/ai-images/generate-product-images?password=lola4304` | Start generation |
| `POST /api/ai-images/stop` | Stop generation |

### ⚠️ Note for Agents
AI generation is an in-memory process. It STOPS when the backend restarts or agent forks. Restart it with:
```bash
curl -X POST "https://URL/api/ai-images/generate-product-images?password=lola4304"
```

---

## 7. Current Issues (Prioritized)

### P0 - Critical
- [ ] Apply CMS pattern to remaining pillars

### P1 - High
- [ ] Fix Razorpay checkout
- [ ] Make AI generation persistent (survives restarts)

### P2 - Medium
- [ ] Fix mobile pet dashboard
- [ ] Instagram integration

### P3 - Low
- [ ] YouTube API quota upgrade

---

## 8. Testing Credentials

| Type | Username | Password |
|------|----------|----------|
| User | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## 9. Post-Deployment Checklist

```bash
# 1. Restart AI image generation
curl -X POST "https://URL/api/ai-images/generate-product-images?password=lola4304"

# 2. Seed topic products
curl -X POST "https://URL/api/learn/topic-products/seed"

# 3. Check page config API
curl "https://URL/api/learn/page-config"
```

---

## 10. Next Agent Instructions

1. **Check AI generation status** - Restart if not running
2. **Use Learn Page CMS as template** for other pillars
3. **Follow the CMS architecture** - No hardcoding!
4. **Test modals** - Products tab should show admin-assigned products
8. ArchetypeProducts

### 3.2 Learn Bundles (4 NEW - in `learn_bundles` collection)

| Bundle | Price | Items |
|--------|-------|-------|
| New Puppy Training Bundle | ₹6,499 | Puppy Training Course, Clicker, Treat Pouch, Treats |
| Behavior Bootcamp Bundle | ₹7,499 | Behavior Program, Anxiety Course, Harness, Calming |
| Training Tools Starter Kit | ₹999 | Clicker, Treat Pouch, 2x Training Treats |
| Recall & Leash Mastery Bundle | ₹4,499 | Recall Course, Leash Course, Lead, Treats |

### 3.3 Personalization Logic

**How Products are Filtered by Breed:**
```javascript
// In LearnProductsGrid.jsx
const petBreed = currentPet?.breed?.toLowerCase() || '';

// 1. Get breed-specific products
const breedSpecific = products.filter(p => 
  p.name.includes(petBreed) || 
  p.tags.includes(petBreed) ||
  p.description.includes(petBreed)
);

// 2. Exclude OTHER breeds' products
const genericProducts = products.filter(p => {
  const otherBreeds = ['chihuahua', 'pug', 'shih tzu', ...];
  const isOtherBreed = otherBreeds.some(b => 
    p.name.includes(b) && !p.name.includes(petBreed)
  );
  return !isOtherBreed;
});

// 3. Combine: breed-specific first, then generic
allProducts = [...breedSpecific, ...genericProducts];
```

### 3.4 AI Image Generation System

**Status:** RUNNING IN BACKGROUND
**Important:** This is an in-memory Python process that stops on agent fork.

| Endpoint | Purpose |
|----------|---------|
| `GET /api/ai-images/status` | Check if running, current progress |
| `GET /api/ai-images/stats` | Total products, coverage percentage |
| `POST /api/ai-images/generate-product-images?password=lola4304` | Start generation |
| `POST /api/ai-images/stop` | Stop generation |

**Admin UI:** Floating progress panel (bottom-right) shows real-time status.

### 3.5 Cloudinary Image Upload System

**Reusable Component:** `CloudinaryUploader.jsx`
**Integrated Into:** ProductBoxEditor, ServiceBox, BundlesManager, ShopManager

**Backend Endpoints:**
```
POST /api/admin/product/{id}/upload-image
POST /api/admin/service/{id}/upload-image
POST /api/admin/bundle/{id}/upload-image
POST /api/upload/cloudinary (generic)
```

---

## 4. Current System Status

### Pillar Completion Status
| Pillar | Status | Key Features |
|--------|--------|--------------|
| Learn | **95%** | Bundles, Products, Topics, Personalization, AI Images |
| Advisory | **95%** | AI Chat, Guided Paths, Watercolor illustrations |
| Farewell | 100% | Grief Support AI, Memorial Services |
| Adopt | 100% | Adoption Advisor, 3-3-3 Rule Paths |
| Celebrate | ~90% | Bundles, Soul Made products |
| Shop | ~85% | Products, filters |
| Care | ~85% | Grooming, wellness |
| Dine | ~85% | Restaurants, meal plans |
| Stay | ~80% | Boarding, daycare |
| Travel | ~80% | Pet-friendly destinations |
| Enjoy | ~75% | Parks, activities |
| Fit | ~75% | Exercise, weight management |
| Paperwork | ~70% | Documents, insurance |

### Known Issues

**BROKEN:**
- Razorpay Checkout — Fails with "body error" (recurring 5+ sessions)
- YouTube Videos — Some links to unavailable videos

**DEGRADED:**
- YouTube API — Quota may be exceeded, using static fallback

**UI BUGS:**
- Mobile Pet Dashboard — Scrambled layout (not addressed)
- Soul Made Products — Some show same breed portrait

---

## 5. Files Modified This Session

### Frontend
```
/app/frontend/src/pages/LearnPage.jsx
/app/frontend/src/components/Learn/LearnProductsGrid.jsx
/app/frontend/src/components/admin/CloudinaryUploader.jsx
/app/frontend/src/pages/Admin.jsx
```

### Backend
```
/app/backend/server.py (Cloudinary upload endpoints)
/app/backend/ai_image_service.py (AI generation service)
```

---

## 6. Post-Deployment Commands

**RUN THESE AFTER EVERY DEPLOYMENT:**
```bash
# Step 1: Clean up duplicate services
curl -X POST "https://thedoggycompany.com/api/admin/cleanup-duplicate-services?password=lola4304"

# Step 2: Fix service images
curl -X POST "https://thedoggycompany.com/api/admin/fix-service-images?password=lola4304"

# Step 3: Restart AI image generation (if needed)
curl -X POST "https://thedoggycompany.com/api/ai-images/generate-product-images?password=lola4304"
```

---

## 7. Prioritized Backlog

### P0 — Critical
- [ ] Keep AI image generation running (manually restart after forks)
- [ ] Ensure Learn page personalization works with logged-in users

### P1 — High
- [ ] Fix Razorpay checkout
- [ ] Enhance remaining pillar pages to golden standard (Fit, Stay, Travel, Dine)
- [ ] Add bidirectional sync UI to admin panel

### P2 — Medium
- [ ] Fix mobile pet dashboard scramble
- [ ] Unique images for Soul Made products
- [ ] Instagram integration for Celebration Wall

### P3 — Low
- [ ] YouTube API quota upgrade
- [ ] Paperwork page verification

---

## 8. API Endpoints Reference

### Learn Pillar
```
GET  /api/learn/bundles           → From learn_bundles collection
GET  /api/product-box/products?pillar=learn&limit=200
```

### AI Image Generation
```
GET  /api/ai-images/status
GET  /api/ai-images/stats
POST /api/ai-images/generate-product-images?password=lola4304
POST /api/ai-images/stop
```

### Image Upload (Cloudinary)
```
POST /api/admin/product/{id}/upload-image
POST /api/admin/service/{id}/upload-image
POST /api/admin/bundle/{id}/upload-image
POST /api/upload/cloudinary
```

---

## 9. Database Collections

| Collection | Purpose |
|------------|---------|
| products | Main product catalog |
| unified_products | Product Box unified view |
| services | Service catalog |
| bundles | Generic bundles (all pillars) |
| **learn_bundles** | Learn-specific bundles (4 items) |
| learn_content | Learn topic content |
| pets | User pets with soul data |
| users | User accounts |

---

## 10. Next Agent Instructions

1. **CHECK AI GENERATION:** `curl /api/ai-images/status` - restart if not running
2. **VERIFY LEARN BUNDLES:** Should show 4 bundles with watercolor images
3. **TEST PERSONALIZATION:** Login as user, check products filter by pet breed
4. **MONITOR PROGRESS:** Admin Panel → AI IMAGES → Check progress panel

**DO NOT:**
- Change `learn_bundles` collection name
- Remove Cloudinary upload endpoints
- Modify the personalization logic in LearnProductsGrid.jsx

---

## 11. Testing Credentials

| Type | Username | Password |
|------|----------|----------|
| User | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

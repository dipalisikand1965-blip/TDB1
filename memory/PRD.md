# The Doggy Company — Complete Product Requirements Document
## Last Updated: December 2025 (Session 9.0 - Learn Golden Standard + Persistent AI)

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

## 2. Platform Architecture

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
- Preview: `https://learn-golden-2.preview.emergentagent.com`
- Production: `https://thedoggycompany.com`

### Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

---

## 3. Session 9.0 Complete Work Summary (December 2025)

### 3.1 Learn Page Elevated to Golden Standard (MATCHES ADVISORY)

**What Was Achieved:**
- Learn page now has EXACT same structure as Advisory page
- Products personalized by pet's breed (breed-specific first, generic after)
- 4 curated Learn bundles with Cloudinary watercolor images
- Real-time AI image generation progress panel in admin

**Learn Page Structure:**
1. Hero with watercolor gradient
2. Category tabs (All Learn, Training Aids, Puzzles, Books)
3. Topic cards with watercolor images
4. "{Pet Name}'s Bundles" section with 4 curated bundles
5. "Recommended for {Pet Name}" with breed/age/archetype tags
6. "Products for {Pet}'s Learning" - breed-filtered products (24 max)
7. BreedSmartRecommendations
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

# The Doggy Company — Complete Product Requirements Document
## Last Updated: March 12, 2026 (Session 8.9 - Deep Handover)

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
- Preview: `https://learn-golden-1.preview.emergentagent.com`
- Production: `https://thedoggycompany.com`

### Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

---

## 3. Session 8.9 Complete Work Summary

### 3.1 Admin Image Upload to Cloudinary (PERSISTS THROUGH DEPLOYMENTS)

**Problem Solved:** Admin could only paste URLs, images lost on deployment.

**Solution Implemented:**
| Component | File | Feature |
|-----------|------|---------|
| ProductBoxEditor.jsx | `/app/frontend/src/components/admin/ProductBoxEditor.jsx` | Purple "Choose File" button in Media tab |
| ServiceBox.jsx | `/app/frontend/src/components/admin/ServiceBox.jsx` | File upload with Cloudinary integration |
| BundlesManager.jsx | `/app/frontend/src/components/admin/BundlesManager.jsx` | CloudinaryUploader component |
| ShopManager.jsx | `/app/frontend/src/components/admin/ShopManager.jsx` | CloudinaryUploader component |
| CloudinaryUploader.jsx | `/app/frontend/src/components/admin/CloudinaryUploader.jsx` | **REUSABLE** component for any admin editor |

**Backend Endpoints Created:**
```
POST /api/admin/product/{id}/upload-image
POST /api/admin/service/{id}/upload-image
POST /api/admin/bundle/{id}/upload-image
POST /api/admin/experience/{id}/upload-image
POST /api/admin/sync-from-production (bidirectional sync)
```

### 3.2 Learn Page Elevated to Golden Standard

**Components Updated:**
| Component | Changes |
|-----------|---------|
| LearnPage.jsx | Added 3 Advisory-style sections: Bundles, Recommended for Pet, Products |
| LearnProductsGrid.jsx | Now fetches from Product Box, filters by pet breed, 24 products max |
| LearnTopicModal.jsx | Fixed product images (image_url), breed-based filtering |
| PetDailyRoutine.jsx | **COMPLETE REWRITE** - Now fetches REAL products from Product Box API |

**Learn Page Structure (Matches Advisory):**
1. Hero with watercolor gradient
2. Category tabs (All Learn, Training Aids, Puzzles, Books)
3. Topic cards with watercolor images (8 topics)
4. "{Soul Archetype} Bundles" section
5. "Recommended for {Pet Name}" with breed/age/archetype tags
6. "Products for {Pet}'s Learning" - breed-filtered products
7. BreedSmartRecommendations
8. ArchetypeProducts

### 3.3 Learn Bundles Created (4 NEW)

| Bundle | Price | Items | Image |
|--------|-------|-------|-------|
| New Puppy Training Bundle | ₹6,499 | Puppy Training Course, Clicker, Treat Pouch, Treats | ✅ Cloudinary |
| Behavior Bootcamp Bundle | ₹7,499 | Behavior Program, Anxiety Course, Harness, Calming | ✅ Cloudinary |
| Training Tools Starter Kit | ₹999 | Clicker, Treat Pouch, 2x Training Treats | ✅ Cloudinary |
| Recall & Leash Mastery Bundle | ₹4,499 | Recall Course, Leash Course, Lead, Treats | ✅ Cloudinary |

**Database:** `learn_bundles` collection (not `bundles`)

### 3.4 AI Image Generation System

**Current Status:** RUNNING - 133/412 complete (32%)
**Total AI Generated:** 612 products have AI images
**Coverage:** 612/890 products (69%)

**Admin UI:** 
- AI IMAGES button shows real-time progress
- Floating progress panel (bottom-right)
- 📊 button to check status anytime

### 3.5 Personalization Fixes

**Products now filtered by pet's breed:**
- Breed-specific products shown FIRST
- Products for OTHER breeds EXCLUDED
- Generic training products shown after breed-specific

**soul_archetype crash fixed:**
- Now handles both string and object formats
- Extracts `archetype_name` from object if needed

---

## 4. Current System Status

### Pillar Completion Status
| Pillar | Status | Key Features |
|--------|--------|--------------|
| Learn | 95% | Bundles, Products, Topics, Personalization |
| Advisory | 95% | AI Chat, Guided Paths, Watercolor illustrations |
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
| Paperwork | ~70% | Crash fix pending verification |

### Known Issues

**BROKEN:**
- Razorpay Checkout — Fails with "body error" (recurring 5+ sessions)
- YouTube Videos — Links to unavailable videos (need to update video IDs)

**DEGRADED:**
- YouTube API — Quota exceeded, using static fallback

**UI BUGS:**
- Mobile Pet Dashboard — Scrambled layout (not addressed)
- Soul Made Products — All show same breed portrait

---

## 5. Files Modified This Session

### Frontend
```
/app/frontend/src/pages/LearnPage.jsx
/app/frontend/src/components/Learn/LearnProductsGrid.jsx
/app/frontend/src/components/learn/LearnTopicModal.jsx
/app/frontend/src/components/learn/PetDailyRoutine.jsx
/app/frontend/src/components/admin/ProductBoxEditor.jsx
/app/frontend/src/components/admin/ServiceBox.jsx
/app/frontend/src/components/admin/BundlesManager.jsx
/app/frontend/src/components/admin/ShopManager.jsx
/app/frontend/src/components/admin/CloudinaryUploader.jsx (NEW)
/app/frontend/src/pages/Admin.jsx (AI progress panel)
```

### Backend
```
/app/backend/server.py (Cloudinary upload endpoints, bidirectional sync)
```

---

## 6. Post-Deployment Commands

**RUN THESE AFTER EVERY DEPLOYMENT:**
```bash
# Step 1: Clean up duplicate services
curl -X POST "https://thedoggycompany.com/api/admin/cleanup-duplicate-services?password=lola4304"

# Step 2: Fix service images
curl -X POST "https://thedoggycompany.com/api/admin/fix-service-images?password=lola4304"

# Step 3: Sync from production (preserve admin edits)
curl -X POST "https://thedoggycompany.com/api/admin/sync-from-production?password=lola4304"
```

---

## 7. Prioritized Backlog

### P0 — Critical
- [ ] Fix YouTube video links (videos unavailable)
- [ ] Complete AI image generation (133/412 in progress)
- [ ] Sync generated images to production

### P1 — High
- [ ] Generate images for 34 services
- [ ] Fix Razorpay checkout
- [ ] Enhance remaining pillar pages to golden standard

### P2 — Medium
- [ ] Fix mobile pet dashboard scramble
- [ ] Unique images for Soul Made products
- [ ] Instagram integration for Celebration Wall

### P3 — Low
- [ ] Paperwork page verification
- [ ] YouTube API quota upgrade

---

## 8. API Endpoints Reference

### Image Upload (NEW)
```
POST /api/admin/product/{id}/upload-image
POST /api/admin/service/{id}/upload-image
POST /api/admin/bundle/{id}/upload-image
POST /api/admin/experience/{id}/upload-image
POST /api/upload/product-image (generic)
POST /api/upload/service-image (generic)
```

### AI Image Generation
```
GET  /api/ai-images/status
GET  /api/ai-images/stats
POST /api/ai-images/generate-product-images
POST /api/ai-images/generate-service-images
POST /api/ai-images/stop
```

### Learn Pillar
```
GET  /api/learn/bundles (from learn_bundles collection)
GET  /api/learn/products
GET  /api/product-box/products?pillar=learn
```

### Sync
```
POST /api/admin/sync-from-production?password=lola4304
GET  /api/admin/production-sync-status
```

---

## 9. Database Collections

| Collection | Purpose |
|------------|---------|
| products | Main product catalog |
| unified_products | Product Box unified view |
| services | Service catalog |
| bundles | Generic bundles (all pillars) |
| learn_bundles | **Learn-specific bundles** |
| learn_content | Learn topic content |
| pets | User pets with soul data |
| users | User accounts |

---

## 10. Testing Credentials

| Type | Username | Password |
|------|----------|----------|
| User | dipali@clubconcierge.in | test123 |
| Admin | aditya | lola4304 |

---

## 11. Next Agent Instructions

1. **FIRST:** Check AI image generation status (should be ~133/412)
2. **PRIORITY:** Fix YouTube video IDs in LearnTopicModal.jsx (CURATED_VIDEOS)
3. **VERIFY:** Learn bundles display correctly (4 bundles with watercolor images)
4. **TEST:** Product personalization when logged in (should filter by pet breed)
5. **MONITOR:** AI image generation progress via Admin → 📊

**DO NOT:**
- Restart AI image generation (it's running)
- Change learn_bundles collection name
- Remove Cloudinary upload endpoints

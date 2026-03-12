# The Doggy Company — Complete Product Requirements Document
## Last Updated: March 12, 2026

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

The current focus was elevating the **Learn page** to a "10/10 golden standard" and fixing issues across the platform.

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
- Preview: `https://ai-watercolor.preview.emergentagent.com`
- Production: `https://thedoggycompany.com`

### Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304`

---

## 3. What Has Been Implemented (This Session)

### Learn Page — GOLDEN STANDARD ✅ (1,458 lines)

**Page Flow (top to bottom):**
1. **Hero + Ask Bar** — "What would you like to learn about your dog today?" with Mira AI integration
2. **12 Topic Hub Boxes** — Watercolor illustrations, click to open dynamic modal
3. **Today's Learning Tip** — Rotating daily banner (7 tips, changes by date)
4. **How Can We Help** — 3 clickable action cards (Products & Routines, Life Stage & Care, Support & Services) with lucide-react icons, open Mira AI with context
5. **Learn for [Pet Name]** — Personalized section with 4 expandable tips that show inline "Mira's Advice" (breed-specific, age-aware: puppy/adult/senior)
6. **Breed Spotlight** — Dynamic breed fact card (pink-to-orange gradient), rotates daily
7. **Today's Weather Tip** — LIVE OpenWeatherMap API, shows temperature-based advice ("It's 31° — avoid walks between 11am-4pm")
8. **Guided Learning Paths** — 6 paths (Puppy, Adoption, Senior, Travel, Grooming, Behavior) that open corresponding topic modals
9. **Curated Bundles** — 3 bundles (Training Success, Puppy Starter, Mental Enrichment)
10. **Products That Help** — Category filter tabs + PersonalizedPicks grid
11. **Services That Help** — 4 service cards with lucide-react icons
12. **Near Me** — Location-based service finder (trainers, groomers, vets)
13. **Support That Might Help [Pet]** — 6 service cards, click opens context-aware modal
14. **[Pet]'s Daily Routine** — 4 time-of-day cards (Morning/Midday/Evening/Night) with watercolor gradients
15. **Ask Concierge** — Direct concierge access
16. **Service Catalog** — Full service listing with pricing

**Key Components:**
- `LearnPage.jsx` — Main page (1,458 lines)
- `LearnTopicModal.jsx` — Dynamic tabbed modal (790 lines): Overview, Videos, Products, Services
- `SupportForPet.jsx` — 6 service cards with lucide-react icons (103 lines)
- `PetDailyRoutine.jsx` — Watercolor time-of-day routine (201 lines)
- `AskConciergeForPet.jsx` — Concierge access (98 lines)
- `NearbyLearnServices.jsx` — Location services (493 lines)
- `LearnTopicIcons.jsx` — Watercolor topic illustrations (203 lines)

**Bugs Fixed:**
- Products tab in modal showed cakes instead of training products → Fixed: uses `pillar=learn` filter
- YouTube videos broken (API quota exceeded) → Fixed: curated fallback + "Browse on YouTube" button
- "Learn for Mojo" tips didn't give advice → Fixed: inline expandable advice with breed-specific content
- Guided Learning Paths did nothing when clicked → Fixed: open corresponding topic modals
- "Edit Routine" button confused users → Removed
- Support modal showed generic "Request Training" → Fixed: shows specific title (e.g., "Behavior Consultation")
- All emojis replaced with lucide-react icons across entire page
- ~400 lines of boilerplate removed (Why Choose Us, CTA, duplicate bundles, old YouTube section, etc.)

### Advisory Page — Watercolor Illustrations Added ✅
- Generated 4 watercolor illustrations for Guided Decision Paths:
  - First-time Owner Path
  - Multi-dog Household
  - Flat-faced Dog Care
  - Allergy Management Path
- Illustrations added to both fallback data and API-transformed paths

### AI Image Generation System ✅
- Background task generates watercolor product images via OpenAI GPT-4o
- Uploads to Cloudinary automatically
- **Status: 181/500 products processed, 0 failures**
- Triggered from Admin panel "AI IMAGES" button
- Backend: `ai_image_service.py` (565 lines)

### Care Page Crash Fix ✅
- Fixed `TypeError` in `CuratedBundles.jsx` — added safety check for `bundle.items`

---

## 4. Pillar Page Status

| Pillar | Status | Notes |
|--------|--------|-------|
| **Learn** | **95%** | **Golden standard. All sections working. Weather + Breed dynamic.** |
| Emergency | 100% | AI Triage, 15 Guides, Guest Profile, Near Me |
| Advisory | 95% | AI Chat, Guided Paths with watercolor illustrations, Products |
| Farewell | 100% | Grief Support AI, Memorial Services |
| Adopt | 100% | Adoption Advisor, 3-3-3 Rule Paths |
| Celebrate | ~90% | Working, bundles, Soul Made products |
| Dine | ~85% | Restaurants, meal plans |
| Stay | ~80% | Boarding, daycare |
| Travel | ~80% | Pet-friendly destinations |
| Care | ~85% | Grooming, wellness (crash fixed) |
| Enjoy | ~75% | Parks, activities |
| Fit | ~75% | Exercise, weight management |
| Shop | ~85% | Products display, filters |
| Paperwork | ~70% | Was crashing, fix pending verification |

---

## 5. Known Issues & Broken Features

### BROKEN
- **Razorpay Checkout** — Fails with "body error". Recurring 5+ sessions. Not addressed.

### DEGRADED
- **YouTube Video Features** — API quota exceeded daily. Using static fallback with YouTube search links.
- **Instagram Feed** — API mocked/non-functional.
- **Admin Auth** — Basic authentication, not production-grade.

### UI BUGS
- **Mobile Pet Dashboard** — Scrambled layout. Recurring, not addressed.
- **Soul Made Products** — All show same breed portrait instead of unique product-specific images.

### PENDING VERIFICATION
- **Paperwork Page** — Previous crash fix needs user testing.

---

## 6. Prioritized Backlog

### P0 — Critical
- [ ] Complete AI image generation (181/500 in progress, 0 failures)
- [ ] Generate unique images for Soul Made products (not same portrait)
- [ ] Sync generated images to production via admin API
- [ ] Replicate Advisory-style product/bundle display on Learn page

### P1 — High
- [ ] Quick Quiz using unanswered soul questions (gamification)
- [ ] Background generation for service watercolor illustrations
- [ ] Enhance remaining pillar pages (Fit, Stay, Travel, Dine) to golden standard
- [ ] Fix Razorpay checkout

### P2 — Medium
- [ ] "Continue Learning" progress tracking
- [ ] "Trending This Week" social proof section
- [ ] Instagram integration for Celebration Wall
- [ ] Fix scrambled mobile pet dashboard

### P3 — Future
- [ ] Seasonal Alert content (monsoon care, summer heat)
- [ ] More pillar pages to golden standard
- [ ] Advanced personalization features
- [ ] Production deployment hardening

---

## 7. Database Schema (Key Collections)

### products
- `shopify_id`, `name`, `description`, `category`, `pillar`
- `image` (Shopify CDN), `image_url` (AI-generated/Cloudinary)
- `price`, `compare_at_price`, `available`
- `tags[]`, `breed_tags[]`, `life_stage_tags[]`
- Total: **4,174 products** (3,763 with images, 411 without)

### services
- `name`, `description`, `category`, `pillar`
- `price`, `duration`, `availability`
- Total: **1,115 services**

### pets
- `name`, `breed`, `age_months`, `weight_kg`
- `soul_score`, `archetype`, `personality_traits[]`
- `allergies[]`, `health_conditions[]`
- `owner_id` (references users)

### users
- `email`, `name`, `membership_tier`
- `pets[]` (referenced)

### tickets
- `ticket_id`, `user_id`, `pet_id`
- `type`, `pillar`, `status`, `priority`
- `messages[]`, `sla_deadline`

---

## 8. API Endpoints (Key)

### Auth
- `POST /api/auth/login` — Returns `access_token`
- `POST /api/auth/register`

### Products
- `GET /api/products?pillar=learn&search=training&limit=8`
- `GET /api/products?limit=500` — Full catalog

### Services
- `GET /api/services?pillar=learn`

### Pets
- `GET /api/pets/my-pets` — Requires auth token

### Weather
- `GET /api/weather?lat=19.076&lon=72.8777` — Returns `{feels_like, description, humidity, city}`

### AI Images
- `POST /api/ai-images/generate-product-images` — Start background generation
- `GET /api/ai-images/status` — Check progress

### Admin
- `POST /api/admin/login` — Admin auth
- Various CRUD endpoints for products, services, tickets

---

## 9. 3rd Party Integrations

| Service | Status | Key Location |
|---------|--------|-------------|
| OpenAI GPT-4o | ✅ Working | Via Emergent LLM Key |
| Cloudinary | ✅ Working | `backend/.env` (CLOUDINARY_*) |
| OpenWeatherMap | ✅ Working | `backend/.env` (OPENWEATHER_API_KEY) |
| Google Places | ✅ Working | `backend/.env` (GOOGLE_PLACES_API_KEY) |
| YouTube Data API | ⚠️ Quota exceeded | `backend/.env` (YOUTUBE_API_KEY) |
| Shopify | ✅ Sync working | `backend/.env` (SHOPIFY_*) |
| MongoDB Atlas | ✅ Working | `backend/.env` (MONGO_URL) |
| Razorpay | ❌ Broken | `backend/.env` (RAZORPAY_*) |
| Instagram | ⚠️ Mocked | Not functional |

---

## 10. Testing Summary

| Test Run | Tests | Pass Rate | Scope |
|----------|-------|-----------|-------|
| iteration_89 | 16/16 | 100% | Learn page cleanup, topic modals |
| iteration_90 | 10/10 | 100% | Inline advice, guided paths, products, videos |
| iteration_91 | 17/17 | 100% | Emoji→icon replacement, mobile, support verification |
| iteration_92 | 100% | 100% | Breed spotlight, weather tip, modal title fix |

---

## 11. File Reference Map

### Frontend — Pages (Key)
```
/app/frontend/src/pages/
├── LearnPage.jsx          # 1,458 lines — GOLDEN STANDARD
├── AdvisoryPage.jsx       # 1,344 lines — Watercolor paths added
├── EmergencyPage.jsx      # Reference for golden standard
├── CarePage.jsx           # Crash fixed
├── Admin.jsx              # AI Images button added
├── Home.jsx               # Landing page
├── ShopPage.jsx           # Product catalog
└── [60+ other pages]
```

### Frontend — Learn Components
```
/app/frontend/src/components/learn/
├── LearnTopicModal.jsx    # 790 lines — Dynamic tabbed modal
├── NearbyLearnServices.jsx # 493 lines — Location services
├── LearnTopicIcons.jsx    # 203 lines — Watercolor illustrations
├── PetDailyRoutine.jsx    # 201 lines — Time-of-day routine
├── SupportForPet.jsx      # 103 lines — Service cards
└── AskConciergeForPet.jsx # 98 lines — Concierge access
```

### Frontend — Shared Components
```
/app/frontend/src/components/
├── CuratedBundles.jsx     # Bundle display (learn has 3 bundles)
├── PersonalizedPicks.jsx  # Product grid with images/prices
├── ProductCard.jsx        # Individual product card
├── PillarPageLayout.jsx   # Wrapper for all pillar pages
├── MiraAdvisorCard.jsx    # Mira AI advisor
├── ServiceCatalogSection.jsx # Service listing
└── [100+ other components]
```

### Backend — Key Files
```
/app/backend/
├── server.py              # Main FastAPI server (16,000+ lines)
├── ai_image_service.py    # AI image generation + Cloudinary upload
├── product_routes.py      # Product CRUD + search
├── services_routes.py     # Services CRUD
├── mira_routes.py         # Mira AI chat
├── auth_routes.py         # Authentication
├── learn_routes.py        # Learn pillar API
├── advisory_routes.py     # Advisory pillar API
└── [200+ other files]
```

---

## 12. Brand Identity

### Colors (from Mira OS)
- **Primary Magenta:** #E91E8C
- **Orange Accent:** #FF6B35
- **Yellow Accent:** #FFD166
- **Purple:** #7C3AED
- **Dark Navy:** #1E1B4B
- **Light Background:** #F8FAFC

### Design Principles
- AI watercolor aesthetic for all illustrations
- lucide-react icons (NO emojis)
- Soft gradients, rounded corners (pill shapes)
- Warm, inviting, premium but approachable
- Shadcn/UI components as base

---

## 13. Critical Notes for Next Agent

1. **AI Image Generation is RUNNING** — Check status: `curl $API_URL/api/ai-images/status`. Currently 181/500, 0 failures. Don't restart unless it stops.

2. **YouTube API quota resets daily** at midnight Pacific Time. Videos tab uses fallback with YouTube search links.

3. **Login flow in Playwright** — Use `input[placeholder="you@example.com"]` and `input[placeholder="Enter your password"]`, then press Enter. Button click is unreliable.

4. **Weather API returns `feels_like`** not `temp`. Code already handles this fallback.

5. **The user is very specific** about their vision. They reference the Bible (`complete-documentation.html`) constantly. Read it thoroughly.

6. **No emojis anywhere** — Every icon must be lucide-react. This was a major cleanup effort.

7. **Advisory page has a pre-existing `<ReactMarkdown>` build issue** that appears intermittently during hot reload. A frontend restart (`sudo supervisorctl restart frontend`) fixes it.

8. **Soul Made products** all share the same breed portrait. User wants unique per-product images via AI generation.

9. **Razorpay** has been broken for 5+ sessions. Nobody has fixed it.

10. **The user wants Advisory-style product/bundle display replicated on Learn page** — this is the immediate next task.

# The Doggy Company® — Pet Life Operating System
## Product Requirements Document — MASTER
## Last Updated: Mar 19, 2026 (Session 83 — Learn Pillar Live, Breed Filtering System-wide, Fit Hidden)

---

## PRODUCT VISION
The Doggy Company's Pet Life Operating System (PLOS) is a pillar-based platform where each pillar (DINE, CARE, GO, CELEBRATE, LEARN, etc.) is a fully personalised experience for a named dog, powered by Mira — the AI concierge who knows every dog by name, breed, size, health and soul. Every product recommendation, every guided path, every service booking is filtered through Mira's knowledge of the pet.

**Core Philosophy**: PET FIRST, BREED NEXT. The soul profile is the dog's operating system. Every pillar reads from it and personalises everything.

---

## APPLICATION ARCHITECTURE

### Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion, Lucide-React icons, Shadcn/UI components
- **Backend**: FastAPI (Python), MongoDB, LiteLLM (Claude Sonnet via Emergent LLM Key)
- **Services**: Google Places API, OpenAI DALL-E (Emergent LLM Key), Razorpay, YouTube Data API v3
- **Hosting**: Kubernetes container (Emergent platform)

### URL Structure
- Frontend: `https://care-soul-fixes.preview.emergentagent.com`
- Backend: Port 8001, all API routes prefixed with `/api`

### Key Backend Files
```
/app/backend/
├── server.py                   # Main FastAPI app, router registration
├── mira_routes.py              # General Mira endpoints
├── mira_score_engine.py        # AI product scoring — /api/mira/claude-picks/{pet_id}
├── dine_routes.py              # Dine + Places (pet-friendly-stays endpoint)
├── admin_routes.py             # Admin, pillar products, service box
├── soul_routes.py              # Soul profile, soul questions
├── care_routes.py              # Care pillar backend
├── learn_routes.py             # Learn pillar backend (APIs, programs, trainers)
├── services/youtube_service.py # YouTube Data API v3 integration
└── app/api/soul_products_routes.py  # Soul products admin
```

### Key Frontend Files
```
/app/frontend/src/
├── pages/
│   ├── GoSoulPage.jsx          # GO pillar (~1,800 lines)
│   ├── CareSoulPage.jsx        # CARE pillar (~2,281 lines)
│   ├── DineSoulPage.jsx        # DINE pillar
│   ├── PlaySoulPage.jsx        # PLAY pillar
│   ├── LearnSoulPage.jsx       # LEARN pillar (~1,300 lines) — LIVE as of Session 83
│   └── PetHomePage.jsx         # Pet dashboard / 13-pillar selector
├── components/
│   ├── learn/
│   │   └── LearnNearMe.jsx     # NEW — Find Learn Near Me (Google Places)
│   ├── care/
│   │   ├── CareHero.jsx
│   │   ├── CareCategoryStrip.jsx
│   │   └── CareContentModal.jsx  # Breed filter now applied to Mira picks
│   ├── admin/
│   │   └── BundlesManager.jsx  # CSV export added
│   ├── common/
│   │   └── ConciergeToast.jsx  # learn: "#7C3AED" added to PILLAR_COLOR
│   ├── Navbar.jsx              # Fit removed
│   ├── MemberMobileNav.jsx     # Fit removed
│   ├── PillarNav.jsx           # Fit removed
│   ├── MobileNavBar.jsx        # Fit removed from pillarMap
│   └── Footer.jsx              # Fit removed from both sections
├── App.js                      # /learn → LearnSoulPage (ProtectedRoute)
└── context/
    ├── AuthContext.jsx
    └── PillarContext.jsx
```

---

## ACTIVE PILLARS STATUS

| Pillar | Status | Notes |
|--------|--------|-------|
| CELEBRATE | ✅ Live | Full pillar, products/services/bundles |
| CARE | ✅ Live | Full pillar, 8 dims, CareContentModal, breed filter |
| DINE | ✅ Live | Full pillar, TummyProfile, breed filter |
| GO | ✅ Live | Full pillar, PetFriendlyStays, breed filter |
| PLAY | ✅ Live | Full pillar, ActivityProfile, breed filter |
| LEARN | ✅ Live | Full pillar launched Session 83, 7 dims + YouTube per dim |
| ENJOY | ⚠️ Partial | Basic page exists |
| SHOP | ⚠️ Partial | Basic page exists |
| ADOPT | 🔴 Stub | Route exists, no content |
| PAPERWORK | 🔴 Stub | Route exists, no content |
| ADVISORY | 🔴 Stub | Route exists, no content |
| EMERGENCY | 🔴 Stub | Route exists, no content |
| FAREWELL | 🔴 Stub | Route exists, no content |
| SERVICES | 🔴 Stub | Route exists, no content |
| FIT | ❌ Hidden | Removed from all navigation & footer |

---

## PILLAR ARCHITECTURE PATTERN (Care-parity standard)

Every pillar MUST follow this pattern:
1. **Hero** — centered, pet avatar + Soul % badge, h1 `clamp(1.875rem,4vw,2.5rem)`, breed chips, Mira quote, chevron
2. **Category strip** — 82px × 72px icon+label pills, each opens ContentModal
3. **Tab bar** — 3 tabs below strip: `{Pillar} & Products | Book a Session | Find {Pillar}`
4. **Soul Profile bar** — collapsed → click → modal with dark header, big %, progress bar, ✕ close
5. **Mira Picks** — `MiraImagineCard` fallback (PET FIRST, BREED NEXT naming)
6. **Breed filter** — `filterBreedProducts()` applied at every product fetch point

---

## BREED FILTERING — SYSTEM-WIDE RULE

**"PET FIRST, BREED NEXT" — Never show wrong breed products**

Applied in:
- `CareContentModal.jsx` — mira category picks filtered by breed
- `CareSoulPage.jsx` — `filterBreedProducts()` in MiraPicksSection
- `PlaySoulPage.jsx` — breed param in claude-picks API call
- `DineSoulPage.jsx` — breed param added (Session 83)
- `GoSoulPage.jsx` — breed param + client-side filterBreed (Session 83)
- `LearnSoulPage.jsx` — `KNOWN_BREEDS` + `filterBreedProducts()` (Session 83)

Rule: If a product name contains a specific breed (e.g. "American Bully Grooming Kit"), it will ONLY show to pets of that breed. General products show to all.

---

## SOUL SCORE CONSISTENCY

**All pillars use `pet.overall_score || pet.soul_score || 0`** (NOT `soul_score` alone)

Fixed in Session 81 for: Care, Dine, Play, Go
Fixed in Session 83 for: Learn (added to LearnProfile component)

---

## KEY APIS

### Pet & Soul
- `GET /api/pets/my-pets` — user's pets list
- `GET /api/pet-soul/profile/{pet_id}` — full soul profile + questions
- `POST /api/pet-soul/profile/{pet_id}/answer` — save soul answer, returns updated score

### Mira
- `GET /api/mira/claude-picks/{pet_id}?pillar={p}&limit=12&min_score=60&entity_type=product&breed={b}` — AI scored picks
- `POST /api/mira/ask` — Mira AI chat

### Products & Services
- `GET /api/admin/pillar-products?pillar={p}&category={c}&breed={b}&limit={n}` — products by pillar/category
- `GET /api/service-box/services?pillar={p}` — services by pillar
- `GET /api/bundles?pillar={p}&active_only=true` — bundles

### Learn
- `GET /api/learn/page-config` — CMS config
- `GET /api/learn/programs` — training programs
- `GET /api/learn/products` — training products
- `GET /api/learn/bundles` — training bundles
- `GET /api/test/youtube?query={q}&max_results={n}` — YouTube videos (response: `{success, query, videos: [{id, title, thumbnail, channel, url}]}`)

### Admin
- `GET /api/admin/site-status` — system health
- `POST /api/service_desk/attach_or_create_ticket` — concierge booking

---

## ADMIN CREDENTIALS
- **Admin login**: `aditya` / `lola4304`
- **Test user**: `dipali@clubconcierge.in` / `test123`

---

## LEARN PILLAR — DB SCRIPTS PENDING (Aditya runs in MongoDB)

```js
// Script 1 — tag 33 training journals
db.products.find({category:'breed-training_logs'}).forEach(p => {
  db.products.updateOne({_id:p._id},{$set:{pillar:'learn',dimension:'Soul Learn Products',sub_category:'soul',price:399}});
});
// Script 2 — tag 33 treat pouches
db.products.find({category:'breed-treat_pouchs'}).forEach(p => {
  db.products.updateOne({_id:p._id},{$set:{pillar:'learn',dimension:'Soul Learn Products',sub_category:'soul',price:299}});
});
// Script 3 — tag 33 treat jars
db.products.find({category:'breed-treat_jars'}).forEach(p => {
  db.products.updateOne({_id:p._id},{$set:{pillar:'learn',dimension:'Soul Learn Products',sub_category:'soul',price:349}});
});
// Script 4 — tag 198 care guide books
db.products.find({name:/Care Guide Book/}).forEach(p => {
  db.products.updateOne({_id:p._id},{$set:{pillar:'learn',dimension:'Breed Knowledge',sub_category:'breed_guides',price:0}});
});
// Script 5 — merge 32 services → 8 canonical learn services
db.services.updateMany(
  {name:{$in:['Puppy Foundations Class','New Pet Parent Onboarding','Behaviour Consultation','Behaviour Modification Programme','Obedience Training','Advanced Training & Tricks','Breed Education Session','Senior Pet Care Education']}},
  {$set:{pillar:'learn'}}
);
```

---

## UPCOMING TASKS (P0 → P2)

### P0 — Immediate
- Run DB scripts 1-5 above (unlocks Learn products + services)
- Learn: Insert 25 new products from TDC_Learn_Pillar_Database_v1.xlsx Sheet 4
- Learn: Insert 10 bundles (BUN-LRN-001 to BUN-LRN-010) from Sheet 5

### P1 — Next Sprint
- **Adopt Pillar** — full implementation
- **Razorpay checkout failure** — known low-priority bug

### P2 — Future
- **Love Pillar** + Love Memory Drawer
- Refactor DB schema (`bundles` / `services` / `products_master` consistency)
- Consolidate pillar content modals into single reusable component
- Stub pillars: Paperwork, Advisory, Emergency, Farewell, Services — full implementation

---

## KNOWN ISSUES / TECHNICAL DEBT
- Razorpay checkout failure (low priority, not addressed)
- DB schema inconsistency: `products_master` vs `bundles` vs `services` collections
- Learn YouTube API quota: 10,000 units/day on free tier — cached per session

---

## TEST CREDENTIALS
```
Test User:  dipali@clubconcierge.in / test123
Admin:      aditya / lola4304
Pets:       Mojo (Indie), Mystique (Indie), Bruno (German Shepherd)
```


---

## PRODUCT VISION
The Doggy Company's Pet Life Operating System (PLOS) is a pillar-based platform where each pillar (DINE, CARE, GO, CELEBRATE, etc.) is a fully personalised experience for a named dog, powered by Mira — the AI concierge who knows every dog by name, breed, size, health and soul. Every product recommendation, every guided path, every service booking is filtered through Mira's knowledge of the pet.

**Core Philosophy**: The soul profile is the dog's operating system. Every pillar reads from it and personalises everything.

---

## APPLICATION ARCHITECTURE

### Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion, Lucide-React icons, Shadcn/UI components
- **Backend**: FastAPI (Python), MongoDB, LiteLLM (Claude Sonnet via Emergent LLM Key)
- **Services**: Google Places API, OpenAI DALL-E (Emergent LLM Key), Razorpay
- **Hosting**: Kubernetes container (Emergent platform)

### URL Structure
- Frontend: `https://care-soul-fixes.preview.emergentagent.com`
- Backend: Port 8001, all API routes prefixed with `/api`

### Key Backend Files
```
/app/backend/
├── server.py                   # Main FastAPI app, router registration
├── mira_routes.py              # General Mira endpoints
├── mira_score_engine.py        # AI product scoring — /api/mira/claude-picks/{pet_id}
├── dine_routes.py              # Dine + Places (pet-friendly-stays endpoint)
├── admin_routes.py             # Admin, pillar products, service box
├── soul_routes.py              # Soul profile, soul questions
├── care_routes.py              # Care pillar backend
├── app/api/soul_products_routes.py  # Soul products admin
└── app/api/mockup_routes.py    # Product image mockup generator
```

### Key Frontend Files
```
/app/frontend/src/
├── pages/
│   ├── GoSoulPage.jsx       # GO pillar main page (~1,750 lines)
│   ├── CareSoulPage.jsx     # CARE pillar main page (~2,145 lines)
│   ├── DineSoulPage.jsx     # DINE pillar main page
│   └── PetHomePage.jsx      # Pet dashboard / pillar selector
├── components/
│   ├── go/
│   │   ├── GoHero.jsx               # Hero section (centered column, matches Dine)
│   │   ├── GoCategoryStrip.jsx      # 6 scrollable pills → opens GoContentModal
│   │   ├── GoContentModal.jsx       # Category product modal (teal, allergy-filtered)
│   │   ├── GuidedGoPaths.jsx        # 3-column card grid (matches GuidedCarePaths)
│   │   ├── GoConciergeSection.jsx   # DB-driven service cards
│   │   ├── GoConciergeModal.jsx     # Service booking modal
│   │   └── PetFriendlyStays.jsx     # Worldwide stay search (auto-fetches pet's city)
│   ├── care/
│   │   ├── CareHero.jsx             # Care hero
│   │   ├── CareCategoryStrip.jsx    # 8 pills → CareContentModal
│   │   ├── CareContentModal.jsx     # Care products modal
│   │   ├── CareConciergeSection.jsx # Care services
│   │   └── GuidedCarePaths.jsx      # Care paths (3-column grid reference)
│   ├── dine/
│   │   ├── DineHero.jsx             # Reference for Go hero centering
│   │   ├── DineTabBar.jsx           # Reference for centered tab bar
│   │   └── PetFriendlySpots.jsx     # Dine location finder
│   └── common/
│       ├── Header.jsx               # Navigation (DINE, CARE, GO, CELEBRATE, PLAY, LOVE)
│       ├── NavigationDock.jsx       # Mobile bottom nav
│       ├── DimExpandedModal.jsx     # Shared bottom-sheet modal (used in PlaySoulPage)
│       └── PersonalisedBreedSection.jsx  # Breed-specific soul products tab (all pillars)
└── utils/
    └── api.js                   # API_URL, getApiUrl, getAuthHeaders
```

---

## PILLAR STATUS TABLE

| Pillar | Route | Status | Key Features |
|--------|-------|--------|--------------|
| DINE | `/dine` | ✅ COMPLETE | DineHero, DineCategoryStrip, DineContentModal, DimExpanded + Personalised tab, PetFriendlySpots |
| CARE | `/care` | ✅ COMPLETE | CareHero, 8-pill strip, DimExpanded + Personalised tab, WellnessProfile, GuidedCarePaths, CareConcierge |
| GO | `/go` | ✅ COMPLETE | GoHero, GoCategoryStrip (Soul Go + Mira's Picks), DimExpanded + Personalised tab, PetFriendlyStays, GuidedGoPaths |
| CELEBRATE | `/celebrate` | ✅ COMPLETE | CelebratePage with cake designer, occasion box |
| PLAY | `/play` | ✅ COMPLETE | PlayHero, PlayCategoryStrip (connected to DimExpandedModal), DimExpanded + Personalised tab, GuidedPlayPaths, PlayNearMe |
| LOVE | `/love` | ❌ NOT STARTED | Future pillar |

---

## GO PILLAR — DETAILED CURRENT STATE

### What's Working ✅
1. **GoHero** — Centered column layout (matches DineHero): avatar top-center, "Travel & Go / for [name]" two-line serif title, soul chips (breed + city + size + anxiety), Mira quote
2. **GoTabBar** — Centered pill tabs: "✈️ Go Essentials" | "🏡 Find a Stay" | "🗺️ Book a Service"
3. **GoCategoryStrip** — 6 scrollable pills: Safety 🛡️, Calming 😌, Carriers 🎒, Feeding 🥣, Health & Docs 💊, Stay & Board 🏡 → each opens GoContentModal popup
4. **GoContentModal** — Teal popup with allergy-filtered products, Mira quote, sub-category tabs, Mira Imagines cards
5. **GuidedGoPaths** — 3-column card grid (EXACTLY like GuidedCarePaths): 6 paths, GoPathCard with accent bg + icon + chips + Mira Pick badge + PathFlowModal
6. **PetFriendlyStays** — Worldwide destination search: autocomplete (30 suggestions), 12 popular city chips, 6 type filters (Hotels/Resorts/Homestays/Boarding/Camping), auto-fetches pet's city on mount, Google Places backend
7. **TripProfile compact bar** — Always shows: breed chip + city chip + size chip + anxiety chip + allergy chips (never empty)
8. **DimExpanded inline panels** — 6 dimension cards expand inline with products (DIM_ID_TO_KEYWORDS keyword matching)
9. **MiraPicksSection** — AI-scored picks with shimmer skeleton loader; fires background scoring on page load
10. **Go Essentials tab** — TripProfile + MiraPicksSection + dim cards + DimExpanded + GuidedGoPaths (clean, no concierge)
11. **Book a Service tab** — GoConcierge + GoConciergeSection

### What's MISSING / Pending 🔴

#### IMMEDIATE (P0) — Requested in latest user message:
1. **TripProfile drawer never empty** — When all soul questions answered, the drawer should show **breed-specific travel tips** (like Care's "BEST PRACTICES · INDIE" section shows breed care tips). For Go, this means: breed-specific travel tips (e.g., for Indies: "Short-coated, adaptable — heat management on long car journeys essential"), travel watch-outs (e.g., heat stroke risk in long boot journeys), comfort preferences. CURRENTLY: shows "Mojo's trip profile is complete!" with ✈️ emoji and blank space below — needs the breed travel insight cards like Care's wellness drawer.

2. **Soul Picks pill in GoCategoryStrip** — Screenshot shows "Soul Care" (purple sparkle 🌟) and "Mira's Picks" (pink magic wand 🪄) as icon pills in the strip. For Go: **"Soul Go" pill** that opens a modal showing AI soul-scored products for travel (breed + size + travel-profile filtered). This is DIFFERENT from the regular category pills — it surfaces the TOP products across all 6 categories that are most relevant to this specific dog.

3. **Mira's Picks pill in GoCategoryStrip** — Second special pill: **"Mira's Picks"** (pink wand icon) that opens a modal showing Mira's top picks + Mira Imagines travel destination cards at the bottom. Same pattern as Care.

4. **Service box blocks in "Book a Service" tab** — The Excel has 8 canonical Go services (GO-SVC-001 to GO-SVC-008). These need to be:
   - Inserted into the `service_box` MongoDB collection with `pillar: 'go'`
   - Displayed in two visual blocks: "Travel Services" and "Stay & Board Services"
   - Each block shows watercolour illustration cards (same as "Care, Personally" in the screenshot)
   - The watercolour images need to be generated for each service

#### DATABASE WORK (from Excel):
5. **23 new Go Essentials products** (GO-SAF-001 to GO-HLT-002) — Status: ADD in Excel
6. **13 Stay & Board products** (GO-STY-001 to GO-SS-003) — Status: ADD in Excel
7. **21 Stay & Board sub-category products** (GO-BC-001 to GO-SS-003) with tabs: boarding_comfort, daycare_essentials, pet_sitting_kit, hotel_comfort, first_stay_anxiety, soul_stay
8. **14 bundles** (BUN-GO-T001 to BUN-GO-S008) — 6 travel + 8 stay bundles
9. **DALL-E images** need to be generated for all new products using the admin panel's Soul Products → Mockup Generator tool
10. **8 canonical Go services** to insert into service_box collection

---

## GO PILLAR — NEXT AGENT ACTION ITEMS

### Step 1: TripProfile Breed Travel Tips (Care Pattern)
**File**: `/app/frontend/src/pages/GoSoulPage.jsx`
**Function**: `TripProfile` component (starts around line 443)
**What to do**: After the soul score progress bar and either the questions list OR the "profile complete" state, add a **`GoBreedTravelInsights`** sub-component that shows:
- Dark teal header card: "TRAVEL TIPS · [BREED NAME]" (like Care's "BEST PRACTICES · INDIE")
- 4 insight cards in a 2×2 grid:
  1. Travel preparation tip (carrier/harness sizing for breed)
  2. Journey comfort tip (heat management, hydration)
  3. Stay tip (boarding suitability, familiar scents)
  4. Watch-out card (orange: anxiety triggers, health risks in transit)
  5. A "Dental/Docs" equivalent = "Documents" card (blue: vaccination cert, health cert, pet passport)
- This should show even when "profile is complete" — replace the empty area below the ✈️ emoji

**Reference implementation**: `WellnessProfile.jsx` (look for `BreedInsightCard` function, around line 200+). Copy the structure, change colors from sage green to teal.

**Breed data needed**: Build a lookup table `GO_BREED_TRAVEL_TIPS` with entries for: Indie, Golden Retriever, Labrador, Beagle, Shih Tzu, Pug, German Shepherd, Husky, Poodle, Dachshund, Rottweiler, Cocker Spaniel. Each entry has: preparation, comfort, stay, watchFor, documents fields. Default for unknown breeds.

### Step 2: Soul Go + Mira's Picks Pills in GoCategoryStrip
**File**: `/app/frontend/src/components/go/GoCategoryStrip.jsx`
**What to do**:
1. Add two special icon-only pills at the START of the strip (before Safety):
   - **Soul Go** pill: Purple-to-lilac gradient background, ✨ sparkle icon, label "Soul Go" — opens a `SoulGoModal` (new file)
   - **Mira's Picks** pill: Pink gradient background, 🪄 wand icon, label "Mira's Picks" — opens `MiraGoPicksModal` (new file)
2. **`SoulGoModal`** (new component): Fetches `/api/mira/claude-picks/{petId}?pillar=go` → Shows top AI-scored products across all go categories, with allergy filtering. Falls back to Mira Imagines if no scored picks.
3. **`MiraGoPicksModal`** (new component): Shows `MiraPicksSection` content (from GoSoulPage) in a full modal + Mira Imagines travel destination cards at the bottom.

**Reference**: See `CareCategoryStrip.jsx` for how Soul Care + Mira's Picks pills are implemented there.

### Step 3: Service Box — Insert Go Services + Build UI
**Backend**:
- Insert the 8 canonical Go services (GO-SVC-001 to GO-SVC-008) into MongoDB `service_box` collection with `pillar: 'go'`
- Script: Write a migration script `/app/backend/seed_go_services.py`
- Each service needs: `id, name, pillar, sub_pillar (travel|stay), tagline, description, steps[], accent_colour, watercolour_image_url (null initially), base_price, is_bookable`

**Frontend** - Update `GoConciergeSection.jsx`:
- Currently fetches `GET /api/service-box/services?pillar=go` → returns 0 (no go services yet)
- After seeding, this will return 8 services
- **Split into 2 sections**:
  - Section 1: "Go, Personally — Travel" — Shows travel services (flight, road, taxi, planning, emergency, relocation)
  - Section 2: "Go, Personally — Stay & Board" — Shows stay services (boarding, sitting, daycare, hotel finding)
- Each card: watercolour illustration (or gradient fallback), category badge, service name, description, "Book [pet]'s [service] →" CTA in gold

**Reference**: `CareConciergeSection.jsx` for the exact UI pattern. Check the screenshot (image 4 in user's last message) — "Care, Personally" with 4-col grid of watercolour illustration cards.

### Step 4: Insert New Products from Excel
**Script**: `/app/backend/seed_go_products_v4.py`
- 23 Go Essentials products (GO-SAF-001 to GO-HLT-002)
- 13 Stay & Board products (GO-STY-001 to GO-SS-003)
- 21 Stay & Board sub-category products (GO-BC-001 to GO-SS-003)
- All with `pillar: 'go'` and proper `category` + `sub_category` fields
- Image generation: Use admin panel → Soul Products → Mockup Generator (user task, not DALL-E)
- 14 bundles to insert into `bundles_go` collection (or unified `bundles` collection)

---

## DATABASE COLLECTIONS

| Collection | Count | Notes |
|-----------|-------|-------|
| `products_master` | ~2,000+ | Main product catalog. Go: 528, Care: 468, Dine: 524 |
| `service_box` | 200+ | Services. Currently only `adopt` + `advisory` pillars active |
| `mira_product_scores` | Variable | AI scoring results per pet per pillar |
| `pet_soul_profile` | Variable | Dog soul answers, soul score |
| `users` | Variable | Member accounts |
| `pets` | Variable | Pet data |

### Critical DB Fix Needed
The `service_box` collection has NO `go` pillar services. 8 canonical services from Excel need to be inserted before the "Book a Service" tab can show anything meaningful.

---

## KEY API ENDPOINTS

### Go Pillar APIs
| Endpoint | Method | Purpose |
|---------|--------|---------|
| `GET /api/admin/pillar-products?pillar=go&limit=200` | GET | All Go products (52 total) |
| `GET /api/places/pet-friendly-stays?city={city}&type={type}` | GET | Google Places pet-friendly stays |
|| `GET /api/places/care-providers?city={city}&type={type}` | GET | Google Places care providers (new) |
| `GET /api/mira/claude-picks/{pet_id}?pillar=go&limit=10` | GET | AI-scored picks for pet |
| `POST /api/mira/score-for-pet` | POST | Trigger background scoring |
| `GET /api/mira/score-status/{pet_id}` | GET | Check if scoring complete |
| `GET /api/service-box/services?pillar=go` | GET | Go services (8 canonical — 6 travel, 2 stay) |
| `GET /api/pet-soul/profile/{pet_id}/quick-questions` | GET | Unanswered soul questions |

### Soul / Auth APIs
| Endpoint | Method | Purpose |
|---------|--------|---------|
| `POST /api/auth/login` | POST | `{email, password}` → JWT token |
| `GET /api/pets` | GET | Pet list for logged-in user |
| `GET /api/pet-soul/profile/{pet_id}` | GET | Full soul profile |

---

## MIRA SCORING ENGINE
- **File**: `/app/backend/mira_score_engine.py`
- **Endpoint**: `GET /api/mira/claude-picks/{pet_id}?pillar=go&limit=10&min_score=60`
- **How it works**: Fetches pet soul profile + pillar products → asks Claude Sonnet to score each product 0-100 for relevance to this specific dog → stores in `mira_product_scores` collection
- **Go pillar added**: ✅ (Session 66 — "go" added to `pillars_to_score` default list)
- **Auto-trigger**: GoSoulPage auto-fires `POST /api/mira/score-for-pet` on mount (fire-and-forget)
- **First visit**: Shows shimmer skeleton → then "Mira Imagines" cards (picks available on 2nd visit)

---

## TEST CREDENTIALS

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Member | dipali@clubconcierge.in | test123 | Mojo = Indie, 95% soul score, Goa, Chicken allergy |
| Admin | aditya | lola4304 | Full admin access |

---

## COMPLETED SESSION LOG

### Session 82 (Mar 18, 2026) — Care Crash + Pet Photo + Soul Chip Visibility
- **Care page crash fixed**: `anxiety_triggers` stored as string (`'None really '`) — normalised to always be an array in `CareSoulPage.jsx`
- **Pet photo fix across ALL pets**: `PetHomePage.jsx` used `pet.photo` but API returns `pet.photo_url` — fixed both avatar instances with `pet.photo || pet.photo_url`
- **Soul question chips now clearly selectable**: Selected state changed from 25% transparent orange (invisible on dark bg) → solid `#E76F51` + white 2px border + `scale(1.04)`. Same fix applied to both Play and Care pages
- **`e.stopPropagation()` added** to all chip click handlers to prevent modal close interference
- **Save button state clear**: disabled = faded 50%, enabled = bright orange gradient with glow

### Session 81 (Mar 18, 2026) — Soul Score Consistency + Question Type Fix + Bundle Modal
- **Soul score now consistent across ALL pillars**: Play, Care, Dine, Go now use `pet.overall_score` first (was using stale `pet.soul_score`). Lola: 94% everywhere (was 9%)
- **Soul question chips now show options**: Fallback questions were missing `type: "select"` — added. Dynamic type detection: `q.type || (Array.isArray(q.options) ? "select" : "text")`
- **MiraPicksSection breed filter fixed**: Fallback fetch now applies full `breed_targets`-priority filter — no more American Bully/Akita products for Indie Mojo
- **Bundle admin modal scrollable**: `max-h-[90vh] overflow-y-auto` added to `DialogContent` — image upload + AI generator now reachable

### Session 80 (Mar 18, 2026) — Play Page 5 Critical Issues Fixed (15/15 tests)
- **Soul Picks breed filter**: Fixed `breed_targets` priority over `breed_tags='all_breeds'` in both `PlayContentModal.jsx` and prefetch
- **Mira's Picks pill → full-screen modal**: `onMiraPicks` now calls `setModalCategory("miras-picks")` instead of scrolling
- **Bundles pill shows real bundles**: Fetches from `bundles` collection (`enjoy` + `fit` pillars). New `BundleCard` component. Bundles dim card also opens modal
- **Services heading**: "Play, Personally" (was "Book a play experience for Mojo")
- **Bundle admin AI image generation**: New endpoint `POST /api/admin/bundles/{bundle_id}/generate-image` using `bundles` collection

### Session 73 (Feb 2026) — Breed Filtering Fix + Play DB Cleanup + Soul Products in Grids
- **Breed filtering in All Products**: PlaySoulPage, GoSoulPage, CareSoulPage products fetch now depends on `[petData]` — soul products (breed_tags set) filtered to only show the current pet's breed. Generic products (no breed_tags) show for all pets.
- **Soul products in Care/Play grids**: After loading products, also fetches `/api/breed-catalogue/products?pillar={pillar}&breed={petBreed}` and merges into the soul dimension group. Now Care "Soul Care" dim and Play "Soul Play" dim both show breed-specific products.
- **DB cleanup**: Deleted 7 fake play products ("Outings & Parks", "Playdates", "Dog Walking", etc. with Rs.999). Remaining: 21 real play products + 8 services + 132 breed bandanas/cards.
- **Multiple pets confirmed working**: Mojo (Indie), Mystique (Shih Tzu), Bruno (Labrador) — each sees their own breed's soul products.

### Session 72 (Feb 2026) — Concierge CTAs + Sub-cat Formatting + Soul Go Personalised
- **ConciergeToast**: New `/app/frontend/src/components/common/ConciergeToast.jsx` — bottom fixed toast slides up when "Book via Concierge" clicked on any nearby place card. Auto-dismisses in 5s.
- **handleNearMeBook wired**: GoSoulPage (TRAVEL queue), CareSoulPage (GROOMING queue), PlaySoulPage (PLAY queue) all now POST to `/api/service_desk/attach_or_create_ticket` + `handoff_to_concierge` and show `ConciergeToast`.
- **Sub-category names fixed**: All DimExpanded tab labels now use `.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())` — `boarding_comfort` → `Boarding Comfort` across all 4 pillars.
- **GoContentModal Personalised tab**: Added Products/Personalised toggle to ALL GoContentModal categories (not just soul). Shows `PersonalisedBreedSection` with breed-specific go products when "Personalised" is selected.
- **Play category strip connected** (carried over from Session 71): PlayCategoryStrip pills now trigger `setOpenDim` to open DimExpandedModal.
- **Personalised tab in all DimExpanded**: All 4 pillars' inline DimExpanded panels now have Products/Personalised toggle showing PersonalisedBreedSection.

### Session 71 (Mar 18, 2026) — PLAY Pillar All 8 UI Issues Fixed
- **Play Pillar `/play` route**: Full 3-tab page (Play & Explore | Find Play | Book a Service)
- **PlayNearMe**: Google Places parks search with `features[]` array (off_lead, beach_access, shade, water_nearby, dog_park mapped from Google types)
- **Backend**: `/api/places/play-spots` endpoint with automatic Google Places types → features mapping
- **25 new Play products** seeded (PL-OUT-001 to PL-SL-004) + 66 soul play products tagged
- **8 canonical Play services** seeded into services_master
- **PlayCategoryStrip**: Soul Play + Mira's Picks as first 2 pills
- **Navbar**: "Enjoy" → "Play" with /play route
- **Complete HTML docs**: `/app/complete-go-play-documentation.html` created
- **Mira Orb**: Teal #1ABC9C (was pink/purple)
- **Dine duplicate heading**: Fixed — "How would Mojo love to eat?" now only in eat tab
- **Care Find Care tab**: Added 3rd tab with CareNearMe.jsx + `/api/places/care-providers` backend

### Session 69 (Mar 17, 2026) — GO Pillar P0/P1 Features Complete
- **Soul Go + Mira's Picks pills**: Added 2 special AI-powered pills as first entries in GoCategoryStrip.jsx; wired to GoContentModal.jsx with special fetch logic for `/api/mira/claude-picks/{pet_id}?pillar=go`
- **GoBreedTravelInsights**: Added always-visible breed travel insights to TripProfile drawer; dark teal header + 4-tip grid + Watch For + Documents cards; 12 breeds + Indie + default fallback
- **Book a Service tab populated**: GoConciergeSection.jsx rewrote to show 2 separate sections — "Go, Personally — Travel" (6 services) + "Go, Personally — Stay & Board" (2 services)
- **21 new Stay & Board products seeded**: GO-BC-001 to GO-SS-003 inserted into `products_master` (boarding_comfort, daycare_essentials, pet_sitting_kit, hotel_comfort, first_stay_anxiety, soul_stay)
- **8 canonical Go services seeded**: GO-SVC-001 to GO-SVC-008 inserted into `services_master` with `pillar=go`
- **AI images generated**: All 52 go products now have Cloudinary AI-generated images
- **Continuous image generation**: `continuous_image_gen.py` + `auto_mockup_generator.py` running in background cycling through all pillars

### Session 73b (Mar 18, 2026) — Play Products Fixed + Mira's Picks Dim Card Added
- **PlaySoulPage.jsx breed filter fix**: Products tagged with `breed_tags: ['all_breeds']` were being incorrectly filtered out. Fixed to allow `all_breeds`/`all` tagged products to show for all pets. Indie pets now see 109 play products (was broken before).
- **Mira's Picks dim card added**: Play page now has 7 dimension cards (was 6). Added "Mira's Picks" (🪄) card to the grid matching Care/Dine pattern. Clicking it opens a centered modal showing MiraPicksSection (AI-scored products with breed/energy/size matching).
- **Standalone MiraPicksSection removed** from Play page body (it's now exclusively inside the Mira's Picks dim card).
- All 25 Excel play products confirmed present in DB.


- **PlaySoulPage.jsx**: Fixed `DimExpandedModal` from bottom-sheet → centered full-screen modal on desktop (responsive: centered on ≥768px, bottom-sheet on mobile). Added `isDesktop` state with window resize listener.
- **All 4 pillar pages**: Added `SoulMadeCollection` component below `PersonalisedBreedSection` in the "Personalised" tab. Pillar→pillar mapping: play→enjoy, go→travel, care→care, dine→dine
- **GoContentModal.jsx**: Also updated with `SoulMadeCollection` in the Personalised tab (pillar=travel)
- Imported `SoulMadeCollection` in GoSoulPage, CareSoulPage, DineSoulPage, PlaySoulPage
- All 5 files passed lint checks (0 errors)


- Created comprehensive PRD.md with full pending task specification
- Updated complete-documentation.html to v16.0.0

### Session 67 (Mar 17, 2026) — GO Page Visual Fixes
- GoHero: Centered column layout matching DineHero, "Travel & Go / for [name]"
- GoCategoryStrip: Removed fixed height:72px → labels no longer cut off
- GuidedGoPaths: Replaced accordion → 3-column card grid (matches GuidedCarePaths)
- Testing: 10/10 pass (iteration_167.json)

### Session 67 earlier (Mar 17, 2026) — GO Page 10-Point UI Overhaul
- GoHero no longer contains tab bar
- GoTabBar added as centered pills below GoCategoryStrip
- GoConcierge moved to "Book a Service" tab only
- TripProfile compact bar: always shows breed + city chips
- apiProducts fetch: fixed DIM_ID_TO_KEYWORDS keyword matching
- PetFriendlyStays: auto-fetches pet's city on mount
- Testing: 10/10 pass (iteration_166.json)

### Session 66 (Mar 17, 2026) — GO Pillar Core Features
- GoCategoryStrip → GoContentModal wiring
- GoHero 3rd tab "Find a Stay"
- Go pillar added to batch scoring
- Loading skeleton for MiraPicksSection
- Backend: camping type added, 500→graceful error
- Testing: 10/10 pass (iteration_165.json)

### Session 65B (Mar 17, 2026) — Go Pillar Scaffolding
- Route /go, GoSoulPage.jsx created
- 478 products tagged pillar:go
- 31 new Go products inserted + DALL-E images
- PetFriendlyStays basic version

### Session 65A (Mar 17, 2026) — Care Pillar P0/P1/P2 Verification
- All tests passed 100%
- Care page fully verified with Mojo

---

## P0/P1/P2 BACKLOG

### P0 — All Complete ✅
- All 4 pillars (Dine, Care, Go, Play) have "Personalised" tab with breed-specific products
- Play category strip now functional (connected to DimExpandedModal)
- **Play modal is now centered** (was bottom-sheet, now centered full-screen on desktop)
- **Soul Made (AI) products** now appear in Personalised tabs across all 4 pillars via `SoulMadeCollection`

### P1 — Important Improvements
- **PLAY pillar**: /play route fully functional with orange/rust color scheme (#E76F51, #7B2D00)
  - PlayHero: no tabs inside, orange gradient (matches GoHero pattern)
  - PlayTabBar: separate sticky tab bar with 3 tabs (Play & Explore, Find Play, Book a Service)
  - Products loading: fixed sub_category→dim.id grouping (241 products across 6 dimensions)
  - Mira Picks: Promise.allSettled + AbortController (5s timeout) so fallback shows when slow
  - GuidedPlayPaths: 6 paths seeded and displayed
  - Find Play tab: PlayNearMe with Google Places map
  - Services: 8 play services seeded (Dog Park Outing, Playdate, Swim, Agility, etc.)

### P1 — Important Improvements
- **Implement the "Adopt" pillar** — /adopt route, AdoptSoulPage
- **Go service watercolour images** — Generate using admin → Soul Products tool or DALL-E
- **Consolidate duplicate services** — 89+ travel/stay services in DB → 8 canonical ones
- **Care soul product images** — 35 Care products in DB without images (use admin mockup tool)
- **Add new mock product templates** to `batch_scorers.py` for the Soul Product Generator
- **Implement CTAs from TDC_instructions.docx** — Read `/app/TDC_instructions.docx` and implement CTAs on frontend

### P2 — Future Pillars & Features
- **Razorpay checkout fix** — Known low-priority bug
- **LOVE pillar** — /love route, LoveSoulPage, Love Memory Drawer
- **Consolidate bundles collections** — Multiple bundles collections need merging
- **Generic shared components** — Reduce code duplication across DINE/CARE/GO/PLAY pillars (refactor DimExpanded into a truly shared component)
- **complete-documentation.html** — Keep updated with each session (v18.0.0 current)

---

## DESIGN SYSTEM

### Color Palettes by Pillar
| Pillar | Primary | Secondary | Accent |
|--------|---------|-----------|--------|
| DINE | `#1A2F1A` (forest deep) | `#2D5016` | `#C9973A` (gold) |
| CARE | `#0A2A1A` (sage deep) | `#1A5E3A` | `#C9973A` (gold) |
| GO | `#0D3349` (teal deep) | `#1A5276` | `#1ABC9C` (teal) |
| CELEBRATE | `#1A0A2E` (purple deep) | `#4A1459` | `#C9973A` (gold) |
| PLAY | `#7B2D00` (rust deep) | `#7B3F00` (brown) | `#E76F51` (orange) |

### Typography
- **Headings**: Georgia / Times New Roman (serif) — `font-family: "Georgia,'Times New Roman',serif"`
- **Body**: System UI / -apple-system
- **H1 (hero)**: `clamp(1.875rem, 4vw, 2.5rem)` — `font-weight:900`
- **H2 (section)**: `clamp(1.375rem, 3vw, 1.875rem)` — `font-weight:800`
- **Body**: `text-sm` to `text-base`
- **Chips/labels**: `text-xs` (`10-11px`)

### Key UI Patterns
- **Tab bars**: Centered pill buttons (`border-radius:9999`, gradient on active)
- **Category strips**: Horizontal scroll with icon pill buttons, `min-width:80px`
- **Dimension cards**: Grid expanding inline (not popup modal)
- **Mira quote card**: Teal/green glass card with ✦ Mira logo
- **Imagines cards**: Dark gradient with gold CTA "Request a Quote →"

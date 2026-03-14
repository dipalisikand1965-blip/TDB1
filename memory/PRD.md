# The Doggy Company® — Pet Life Operating System
## Product Requirements Document — MASTER
## Last Updated: March 14, 2026 (Session 9 — Celebrate Pillars Master Build: Special Panels + DrawerBottomBar)

---

## THE VISION
> "We are not a commerce platform. We are a Pet Operating System. The Soul comes first."

The world's first soul-driven Pet Operating System. Every dog has a personality, lifestyle, health story — the Soul. The platform captures this and uses it to power every recommendation, every Mira response, and every concierge interaction.

**3,777 products in DB. 221+ API endpoints. 51 Soul Questions. 14 Pillars.**

---

## 🔄 SESSION 9 SPEC — Celebrate Pillars Master Build (March 14, 2026)
### SOURCE: Celebrate_Pillars_MASTER.docx — CANONICAL, EVERY VALUE IS FINAL

### PILLAR SYSTEM STATUS:
| Feature | Status |
|---|---|
| 8-pillar grid GLOW/DIM/INCOMPLETE | ✅ SoulCelebrationPillars.jsx |
| Row-based inline expansion (Row 1 below Row 1, Row 2 below Row 2) | ✅ IMPLEMENTED |
| Special panels (4 pillars: food, social, health, memory) | ✅ IMPLEMENTED |
| DrawerBottomBar (3 states, purple gradient, pillar-specific whispers) | ✅ IMPLEMENTED |
| Correct 4 tabs per pillar per spec | ✅ IMPLEMENTED |
| Mira bar gradient styling | ✅ IMPLEMENTED |
| Pet Wrapped download on PetHomePage | ✅ EXISTS |

### SPECIAL PANELS (exact from doc):
- **FeastMenuCard** (Pillar 1): `bg: linear-gradient(135deg,#FFF8F0,#FEF3FF)`, 3 items display-only, NO add buttons
  - 🎂 Salmon Birthday Cake ₹899 · 🍪 Treat Platter ₹449 · 🧁 Paw Cupcakes ₹349
- **PawtyPlannerCard** (Pillar 3): `bg: linear-gradient(135deg,#F3E5F5,#FCE4EC)`, 4 step cards with purple circles
- **WellnessHeroCard** (Pillar 7): `bg: linear-gradient(135deg,#E0F7FA,#E8F5E9)`, NO CTA inside
- **MemoryInvitationCard** (Pillar 8): `bg: linear-gradient(135deg,#1A0030,#3D0060)`, HAS CTA for Concierge photoshoot

### DRAWER BOTTOM BAR (sticky bottom, 72px):
- `bg: linear-gradient(135deg,#2D0050,#6B0099,#C44DFF)`
- State 1 (0 items): whisper "✦ Everything personalised for {petName}" · btn "Explore More →"
- State 2 (1 item): context-specific whisper · btn "Build {petName}'s Birthday Plan →"
- State 3 (2+ items): count badge on pulse dot · btn "Keep Building →"
- NEVER use: Continue Shopping, Back, Close, Done, Checkout

---

## ✅ SESSION 8 COMPLETED (March 14, 2026) — TESTED ✅

### FEATURE 1 — Soul Score Constant Glow (COMPLETED ✅)
- Replaced `key={score}` spring-remount with `useAnimation()` imperative control + `useEffect` trigger
- Added `motion.span` with `textShadow` cycling `16px→48px→16px` glow, `repeat: Infinity` — NEVER stops
- Score changes: smooth tween pop via `scoreControls.start({ scale: [1,1.12,1] })` — no bounce

### FEATURE 2 — PetWrap Teaser in Mira's Picks (COMPLETED ✅)
- `PetWrapTeaser` component renders in `miras-picks` section of `CelebrateContentModal`
- Loads from `GET /api/wrapped/generate/{petId}` (API now exposes `archetype_name`, `archetype_emoji`, `soul_score` at top level)
- Shows: pet name, year, soul score %, archetype, "View Full Wrap" CTA + Share button

### FEATURE 3 — Celebrate-Context Soul Questions (COMPLETED ✅)
- Backend: `GET /api/pet-soul/profile/{petId}/quick-questions?context=celebrate` added
- Priority order: `celebration_preferences` (if unanswered) → `taste_treat` folder → motivation/activity → others
- Frontend: CelebrateContentModal passes `?context=celebrate&limit=5` to soul questions

### FEATURE 4 — Occasion Countdown Card (COMPLETED ✅)
- `OccasionCountdownCard` renders at TOP of Mira's Picks
- Checks `pet.birthday`, `pet.gotcha_date`, and soul-answered celebration_preferences (Diwali, Holi, Christmas etc.)
- Gold styling when within 7 days, purple when 8-45 days, shows "TODAY" badge
- Holi/festival dates mapped to approximate annual dates

### FEATURE 5 — Archetype-Based Imagined Products (COMPLETED ✅)
- 6 archetypes mapped: gentle_aristocrat, wild_explorer, velcro_baby, social_butterfly, foodie_gourmet, zen_philosopher
- Always includes at least 1 archetype card: `archetypeSlots = Math.max(1, Math.min(2, 5 - imaginaryProducts.length))`
- Total limit expanded to 5 imagined products

### FEATURE 6 — Mira Memory Loop (COMPLETED ✅)
- `celebrate_routes.py`: When concierge request created with `pet_id`, writes to `pets.learned_facts`
- Format: `{type, category, product_name, request_type, request_id, date}`
- Mira chat backend already reads `learned_facts` in system prompt via `get_pet_context_pack`

### BUG FIX — Text Duplication (COMPLETED ✅)
- "salmon treats treats" text duplication fixed: `cleanFood` properly strips "treats/cake/food" suffixes

---

## ✅ SESSION 7 FIXES (March 14, 2026) — TESTED ✅

### FEATURE 1 — Soul Score Constant Glow (P0)
**Problem:** The `key={score}` on the score number causes it to re-mount and re-animate with `scale: 1.4` on every update — creating a "bounce" effect. After answering, the score jumps forward and back.
**Fix:**
- Remove `key={score}` re-mount strategy
- Replace spring animation with `@keyframes pulse-glow` CSS that runs INFINITELY
- Score always glows (`text-shadow` pulse animation, never stops)
- Score changes counter-animate with a smooth `useSpring` value (no bounce)
- File: `CelebrateContentModal.jsx` — SoulQuestionsSection component

### FEATURE 2 — PetWrap Mini-Card in Mira's Picks (P1)
**What:** PetWrap (`/wrapped/:petId`) is a beautiful 5-card pet year-in-review (Cover, Soul Score, Mira Moments, Pillars, Closing). It already exists. User wants it visible NEXT TO the soul section inside the Mira's Picks modal.
**Design:**
- Compact PetWrap teaser card: shows cover card info (soul score, archetype, year)
- "View Full Wrap" → opens `/wrapped/:petId` in new tab
- Share button using `navigator.share` or clipboard fallback
- Dynamically loads from `/api/wrapped/generate/{petId}`
- File: `CelebrateContentModal.jsx` — inside `category === 'miras-picks'` section

### FEATURE 3 — Celebrate-Context Soul Questions (P1) ← KEY FEATURE
**What:** When in the celebrate modal, soul questions should be CELEBRATE-FIRST. Current behavior: random from all 9 folders. Target: celebrate-relevant folders first.

**Celebrate-Relevant Folders (PRIORITY ORDER):**
1. `taste_treat` → "What protein does {pet} love?" → Auto-generates cake/treat imagined cards
2. `celebration_preferences` question → "Which celebrations do you want to remember?" → Occasions setup
3. `toy_play` (if exists) / `identity_temperament` motivation → toy gift imaginations
4. Other folders after these

**Backend change:** `GET /api/pet-soul/profile/{petId}/quick-questions?context=celebrate&limit=5`
- When `context=celebrate`: move `taste_treat` + `celebration_preferences` questions to the TOP of the selection
- File: `pet_soul_routes.py` — `get_quick_questions` endpoint

**Frontend change after answering a celebrate question:**
- The `onAnswered` callback fires → `onRefreshMiraCards()` runs
- Re-generates Mira Imagines cards based on NEW soul data
- NEW IMAGINATION TYPES (not just cakes): toys, accessories, hampers, treats, activity kits
  - `favorite_protein = "Chicken"` → "Chicken Celebration Cake" + "Chicken Jerky Hamper"
  - `favorite_treats = ["Cakes", "Jerky"]` → imagined product cards for those types
  - `motivation_type = "Toys/play"` → "Custom Fetch Toy Gift Set" imagined card
  - Soul archetype `wild_explorer` → "Adventure Birthday Hamper" imagined card
- All imagined products → CONCIERGE FLOW (not add-to-cart)
- File: `CelebrateContentModal.jsx` — `generateMiraImagines` function (EXPAND beyond cakes)

### FEATURE 4 — Occasion-Based Cards in Mira's Picks (P1)
**What:** 
- Check if `doggy_soul_answers.celebration_preferences` is answered for the pet
- If answered with ["Birthday", "Diwali" etc.] + pet has `birthday` or `gotcha_date` → show special occasion countdown card in Mira's Picks: "Mojo's birthday is in 15 days — here's what Mira prepared 🎂"
- If NOT answered → `celebration_preferences` question appears FIRST in soul questions (already handled by FEATURE 3)
- Occasion types: Birthday, Gotcha Day, Diwali, Holi, Christmas, New Year, Valentine's Day, Raksha Bandhan, Rakhi, Independence Day, Easter, Eid

**Where in UI:** At TOP of `miras-picks` section, before imagined cards
**File:** `CelebrateContentModal.jsx` — new `OccasionCountdownCard` component

### FEATURE 5 — Mira Memory Loop: Product Selections → learned_facts (P2)
**What:** When a pet parent sends a concierge request (e.g., "Salmon Delight Cake"), store this as a `learned_fact` on the pet.
**Backend:** In the celebrate concierge request endpoint → add:
```python
await db.pets.update_one(
  {"id": pet_id},
  {"$push": {"learned_facts": {
    "type": "concierge_request", 
    "category": "celebrate",
    "product_name": product_name,
    "occasion": occasion,
    "date": datetime.now(timezone.utc).isoformat()
  }}}
)
```
**Mira already uses `learned_facts`** in system prompt (verified — `mira_routes.py` line 3088+)
**Result:** Next time user opens Mira widget, she says: "Last time you asked about {product_name} for {petName} — want to revisit that?"
**File:** `celebrate_routes.py` — concierge request endpoint

### FEATURE 6 — Soul Archetype → Imagined Products (P2)
**What:** The soul archetype engine (`/api/soul-archetype/pet/{petId}`) derives personality from soul answers. This should influence what Mira imagines:
- `gentle_aristocrat` → Premium/elegant items: "Luxury Birthday Hamper", "Velvet Bow Tie"
- `wild_explorer` → Adventure items: "Adventure Birthday Kit", "Rope Tug Gift Set"
- `velcro_baby` → Comfort items: "Comfort Snuggle Pack", "Mom's Scent Toy"
- `social_butterfly` → Party items: "Pawty Decoration Kit", "Group Treat Bag"
- `foodie_gourmet` → Food items: "Gourmet Tasting Kit", "Custom Recipe Cake"
**File:** `CelebrateContentModal.jsx` — `generateMiraImagines` function — add archetype-based imaginations

---

## ✅ SESSION 7 FIXES (March 14, 2026) — TESTED ✅
### P0 — Soul Question Cards UI (COMPLETED ✅)
- **Problem**: SoulQuestionCard had light blue/white theme (`rgba(68,136,255,0.06)`) — unreadable on white modal
- **Fix**: Restored **deep purple dark theme**: `background: linear-gradient(135deg, #12003A 0%, #2D0060 100%)`, purple borders (`rgba(196,77,255,0.35)`), white text, purple/pink CTAs
- **File**: `CelebrateContentModal.jsx` — SoulQuestionCard component + SoulQuestionsSection component

### P0 — Soul Score Display Enhancement (COMPLETED ✅)
- Score counter: 38px → **64px** font size with spring animation + glow effect (`text-shadow: 0 0 24px rgba(196,77,255,0.55)`)
- Added session delta badge: "+X% this session"
- Added animated progress bar (purple → gold when ≥80%)
- Section uses deep purple gradient header matching hero/MiraImaginesCard

### P1 — Admin Panel Auth + Robustness (COMPLETED ✅)
- **Root cause**: `GET /api/admin/products` used `verify_admin` (Basic Auth ONLY) → JWT Bearer tokens rejected → 0 products
- **Backend fix**: Changed to `verify_admin_auth` (accepts both Basic Auth AND JWT Bearer)
- **Frontend fix 1**: `Promise.all` → `Promise.allSettled` in `fetchAllData` — one failure no longer kills entire load
- **Frontend fix 2**: Added fallback fetch (public `/api/products` by category) when admin endpoint fails
- **Frontend fix 3**: `showInactive` default `false` → `true` — admin now shows ALL products including inactive party accessories
- **Verified**: Party accessories (Pawty Hat Set, Happy Birthday Tiara etc.) + celebration_addons showing in admin ✅

---

## ✅ CELEBRATE PAGE — SOUL-FIRST REDESIGN STATUS

### Route: `/celebrate-soul` (must replace `/celebrate` once Aditya approves)

### COMPLETED ✅ (Updated Mar 13, 2026 — Session 4 Round 2)
1. **CelebrateHero** — Pet photo, gradient avatar ring, Soul % chip, soul chips, Mira quote
2. **CelebrateCategoryStrip** — **11 categories**: Birthday Cakes, Breed Cakes, Pupcakes, Desi Treats, **Frozen Treats**, Gift Hampers, Bundles, **Party & Decor**, **Nut Butters**, Soul Picks, Mira's Picks
3. **SoulCelebrationPillars**, **MiraAskBar**, **GuidedCelebrationPaths**, **CelebrationMemoryWall** — spec-compliant
4. **CelebrateContentModal** — Fully rebuilt, responsive:
   - **Desktop**: Large centered dialog (max-w-5xl wrapper div, NOT transform — Framer Motion safe)
   - **Mobile**: Bottom sheet (93vh, drag handle)
   - `birthday-cakes` → `cakes` (111 actual TDB bakery cakes ✅ was wrongly pointing to `celebration`)
   - `miras-picks` → `cakes` fetched then **breed-filtered client-side** (Indie dog gets Indie cakes) ✅
   - `frozen-treats` → 24 products ✅ NEW
   - `party` → party_accessories + party_kits + celebration_addons ✅ NEW
   - `nut-butters` → 6 products ✅ NEW
   - **BundleDetailSheet**: X close button added, image uses `object-contain` (max 320px, no crop) ✅
   - **Soul Picks**: Now uses `SoulPickCard` (wraps ProductCard with "For {pet}" badge) — proper modal with X ✅
   - **Footer bar (2-state dynamic)**: 
     - Browsing (nothing added): `✦ Everything here is personalised for {pet}` | `Explore More for {pet}` (closes modal)
     - Active (items added): `{emoji} + N things — {pet}'s plan is growing` | `Keep Building →` (opens Mira AI with context)
     - `addedCount` increments on every `addToCart` custom event while modal is open; resets on category switch
   - All product images: `object-contain` — no cropping ✅
5. **Admin CelebrateManager** — loads 308+ products, category dropdown has celebration/frozen-treats/party_accessories

### PRODUCT COUNTS — CELEBRATE UNIVERSE
| Category | DB Name | Count |
|----------|---------|-------|
| Birthday / Celebration Cakes (actual TDB cakes) | **cakes** | 111 |
| Celebration packages/kits (NOT in birthday-cakes tab) | celebration | 106 |
| Breed Cakes | breed-cakes | 42 |
| Gift Hampers | hampers | 37 |
| Pupcakes & Dognuts | dognuts | 30 |
| Frozen Treats | frozen-treats | 24 |
| Desi Treats | desi-treats | 7 |
| Nut Butters | nut-butters | 6 |
| Party Accessories | party_accessories | 6 |
| Celebration Add-ons | celebration_addons | 6 |
| Party Kits | party_kits | 4 |
| **Total in strip tabs** | | **~279 products** |
| Celebrate Bundles (separate collection) | celebrate_bundles | 6 |

### KEY DATA INSIGHT ⚠️
`cakes` (111) = actual TDB bakery cake products (beautiful illustrated cakes)
`celebration` (106) = celebration packages/kits/bundles by breed — NOT birthday cakes
NEVER use `celebration` for the Birthday Cakes tab. Use `cakes`.

### PRODUCT COUNTS — CELEBRATE UNIVERSE
| Category | Count |
|----------|-------|
| celebration (Birthday Cakes) | 106 |
| breed-cakes | 42 |
| hampers | 37 |
| dognuts (Pupcakes) | 30 |
| frozen-treats | 24 |
| desi-treats | 7 |
| nut-butters | 6 |
| party_accessories | 6 |
| celebration_addons | 6 |
| party_kits | 4 |
| **Total celebrate products** | **~279** |
### PRODUCT COUNTS — CELEBRATE UNIVERSE (Confirmed Mar 13, 2026)
| Category | DB Name | Count | Status |
|----------|---------|-------|--------|
| Birthday / Celebration Cakes | celebration | 106 | ✅ Strip tab "Birthday Cakes" |
| Breed Cakes | breed-cakes | 42 | ✅ Strip tab "Breed Cakes" |
| Gift Hampers | hampers | 37 | ✅ Strip tab "Gift Hampers" |
| Pupcakes & Dognuts | dognuts | 30 | ✅ Strip tab "Pupcakes" |
| Frozen Treats | frozen-treats | 24 | ✅ NEW Strip tab |
| Desi Treats | desi-treats | 7 | ✅ Strip tab |
| Nut Butters | nut-butters | 6 | ✅ NEW Strip tab |
| Party Accessories | party_accessories | 6 | ✅ NEW "Party & Decor" tab |
| Celebration Add-ons | celebration_addons | 6 | ✅ Part of "Party & Decor" |
| Party Kits | party_kits | 4 | ✅ Part of "Party & Decor" |
| Celebrate Bundles | (separate collection) | 6 | ✅ "Bundles" tab |
| **Total Celebrate Products** | | **~279** | |
| Admin Panel Shows | (filtered) | 308 | includes some extras |

### ✅ COMPLETED — AI Image Generation for Party & Accessories (Mar 14, 2026)
1. **AI Image Generation** — 15 realistic product images generated using Cloudinary AI engine (GPT Image 1)
   - **Script:** `/app/backend/scripts/generate_party_accessory_images.py`
   - **Products:** Generic party items applicable across ALL breeds
   - **Storage:** `products_master` collection
   - **Visibility:** Party & Decor category tab shows 33 items with AI images first

### ✅ FIXED — Session 6 (Mar 15, 2026) — Critical Regression Restored
**Root Cause:** Previous session's cleanup script set `is_active: None` on all celebrate products, filtering them out.
**Fix Applied:**
- Re-activated 253 products: `breed-cakes`(42), `cakes`(111), `dognuts`(30), `frozen-treats`(24), `desi-treats`(7), `nut-butters`(6), `hampers`(37), `celebration`(106)
- Backend API `is_active` filter now also accepts `None`/`null` values (robustness)
- `getLovedFoods()` improved: handles both learned_facts formats (type:'loves' + category:'loves')
- `extractSoulTraits()` improved: cleaner, handles all fact formats, deduped

### ✅ Mira's Picks — Enhanced & Working (Mar 15, 2026)
- Food-based: Mojo loves "salmon treats" → "Salmon Delight Cake" imagined card
- Activity-based: "morning walks" → "Adventure Walk Party Pack"
- Soul onboarding: If no soul data → prompt card with "Help Mira Know Me"
- Works for ALL pets (Mojo, Mystique, any new pet)

### IN PROGRESS 🚧 — NEXT TASKS
1. **Replace `/celebrate` with `/celebrate-soul`** — once Aditya approves
2. **Standardize other pillar pages** — `/dine`, `/stay`, `/learn` using celebrate as template
3. **500 uncategorized products** — Admin needs to categorize or AI auto-categorize

---

## 🌟 MIRA IMAGINES CARD — FUTURE VISION (Product Research Engine)
> The MiraImaginesCard is a hidden gem — it's essentially a "dream item" that doesn't exist yet but Mira can will into existence.

### Current State
- Shows hypothetical products based on pet's loved foods (e.g., "Salmon Delight Cake")
- "Request a Quote" button → Concierge toast notification
- Max 3 imaginary cards per session

### Future Extension (P1)
**Extend MiraImaginesCard to ALL categories based on pet's soul profile:**
- If Mojo's soul mentions "loves swimming" → Mira imagines "Pool Day Party Kit"
- If pet loves car rides → Mira imagines "Road Trip Celebration Box"
- Every "Request a Quote" click creates a feedback loop → tells us exactly what products to build next
- **Mira becomes a product research engine** — user demand data for new product development

### Technical Implementation (Future)
```javascript
// In CelebrateContentModal.jsx - extend imaginedProducts generation
const generateSoulBasedImagines = (pet) => {
  const preferences = pet?.soul?.preferences || [];
  const activities = pet?.learned_facts?.filter(f => f.type === 'activity') || [];
  
  // Map soul data to imaginary products
  // "loves swimming" → "Pool Day Party Kit", "Pool Party Bandana Set"
  // "loves fetch" → "Ultimate Fetch Birthday Box"
  // This is the PRODUCT RESEARCH ENGINE
};
```

### Data Collection for Product Development
```javascript
// Track "Request a Quote" clicks
const trackImaginaryProductRequest = async (product, pet) => {
  await fetch('/api/mira/imaginary-requests', {
    method: 'POST',
    body: JSON.stringify({
      product_name: product.name,
      pet_breed: pet.breed,
      pet_soul_traits: pet.soul?.preferences,
      requested_at: new Date().toISOString()
    })
  });
  // This data tells us what to build next!
};

---

## CRITICAL ARCHITECTURE — Celebrate Page

### File Structure
```
/app/frontend/src/
├── App.js                                    # /celebrate-soul → CelebratePageNew
├── pages/
│   ├── CelebratePageNew.jsx                  # NEW soul-first page (USE THIS)
│   └── CelebratePage.jsx                     # OLD page (still at /celebrate)
└── components/
    └── celebrate/
        ├── index.js                          # Export index
        ├── CelebrateHero.jsx                 # ✅ DONE - pet photo + soul chips + Mira quote
        ├── CelebrateCategoryStrip.jsx        # 🚧 NEEDS MORE CATEGORIES + BIGGER ICONS
        ├── CelebrateContentModal.jsx         # 🚧 NEEDS BETTER IMAGE RENDERING + BIGGER MODAL
        ├── SoulCelebrationPillars.jsx        # ✅ DONE - 8 pillars
        ├── SoulPillarExpanded.jsx            # ✅ DONE - real products
        ├── MiraCuratedBox.jsx                # ✅ DONE - birthday box
        ├── CelebrateConcierge.jsx            # ✅ DONE - drawer with tabs
        ├── GuidedCelebrationPaths.jsx        # ✅ DONE
        └── CelebrationMemoryWall.jsx         # ✅ DONE
```

### Backend (Celebrate)
```
/app/backend/celebrate_routes.py              # /api/celebrate/* endpoints
/app/frontend/src/components/admin/CelebrateManager.jsx  # Admin panel (FIXED category dropdown)
```

---

## API ENDPOINTS (Celebrate-critical)

```
GET /api/products?category={X}&limit=40              # Shopify products by category
GET /api/products?limit=500                          # All products (paginates)
GET /api/celebrate/bundles                           # 6 illustrated bundles
GET /api/celebrate/products?category={X}            # Celebrate-specific products
GET /api/mockups/breed-products?breed={slug}&pillar=celebrate&limit=20  # Breed merch
GET /api/products/admin/{product_id}                 # Update product (backend has this)
PUT /api/celebrate/admin/products/{product_id}       # Update celebrate product
```

### Breed Slug Mapping (for `/api/mockups/breed-products`)
```js
const BREED_SLUG_MAP = {
  'indian pariah': 'indie', 'indie': 'indie',
  'labrador retriever': 'labrador', 'labrador': 'labrador',
  'golden retriever': 'golden', 'golden': 'golden',
  // ... see CelebrateContentModal.jsx getBreedSlug()
};
```

---

## DESIGN TOKENS — CELEBRATE PAGE (CRITICAL — DO NOT CHANGE)

| Token | Value | Usage |
|-------|-------|-------|
| Hero bg | `linear-gradient(135deg, #1a0020 0%, #3d0060 40%, #6b0099 75%, #9b0cbf 100%)` | Hero section |
| Birthday Box bg | `linear-gradient(135deg, #1a0020, #3d0060)` | MiraCuratedBox |
| Concierge bg | `#0E0620` (FLAT, NOT gradient) | CelebrateConcierge |
| Concierge CTA | `linear-gradient(135deg, #C9973A, #F0C060)` | Gold CTA |
| Birthday Box CTA | `linear-gradient(135deg, #C44DFF, #FF6B9D)` | Purple-pink CTA |
| Pillar glow shadow | `0 0 20px rgba(196,77,255,0.25)` | Glowing pillar cards |
| Pet photo field | `pet?.photo_url \|\| pet?.image_url` | NOT `pet?.image` |
| Mira open event | `window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message, context: 'celebrate' } }))` | Open Mira |
| Add to cart event | `window.dispatchEvent(new CustomEvent('addToCart', { detail: product }))` | Add product |

---

## SOUL PILLAR COLORS (Exact, from spec)
| Pillar | Background | Dot |
|--------|-----------|-----|
| Food & Flavour 🍰 | `linear-gradient(135deg, #FFF3E0, #FFE0B2)` | `#FF8C42` |
| Play & Joy 🎾 | `linear-gradient(135deg, #FCE4EC, #F8BBD0)` | `#E91E63` |
| Social & Friends 🦋 | `linear-gradient(135deg, #F3E5F5, #E1BEE7)` | `#9C27B0` |
| Adventure & Move 🌅 | `linear-gradient(135deg, #E3F2FD, #BBDEFB)` | `#2196F3` |
| Grooming & Beauty ✨ | `linear-gradient(135deg, #FFF9C4, #FFF176)` | `#F9A825` |
| Learning & Mind 🧠 | `linear-gradient(135deg, #E8F5E9, #C8E6C9)` | `#4CAF50` |
| Health & Wellness 💚 | `linear-gradient(135deg, #E0F7FA, #B2EBF2)` | `#00BCD4` |
| Love & Memory 📸 | `linear-gradient(135deg, #FFF3E0, #FFCCBC)` | `#FF5722` |

---

## TEST CREDENTIALS
- User: `dipali@clubconcierge.in` / `test123` (Mojo = 89% soul, chicken allergy, breed=indie)
- Admin: `aditya` / `lola4304`

---

## KNOWN ISSUES / BUGS (Not Fixed)
| Issue | Priority | Notes |
|-------|----------|-------|
| Birthday Cakes shows 80 of 111 (limit) | P3 | Intentional page limit. Consider infinite scroll or "Show More" |
| Category strip icons clipped/small | P2 | 34px icon box → need 52-62px |
| 500 uncategorized products | P2 | Need to query by tags/handle and auto-assign categories |
| Razorpay checkout failure | P3 | Legacy bug |
| Scrambled mobile pet dashboard | P3 | Layout bug |
| Admin Product Editor Image Upload Bug | P3 | File upload component |

---

## UPCOMING TASKS (Post Celebrate)
1. Make `/celebrate-soul` the live `/celebrate` (swap route in App.js) — awaiting Aditya approval
2. Apply soul-first template to `/dine` pillar
3. Standardize all 14 pillars
4. Add more Soul Products categories to Celebrate (blankets, plush toys, pet robes)
5. "Build a box" functionality — high value revenue feature
6. CMS audit for new celebrate sections

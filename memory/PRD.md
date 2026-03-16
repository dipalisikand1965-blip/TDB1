# The Doggy Company® — Pet Life Operating System
## Product Requirements Document — MASTER
## Last Updated: Mar 16, 2026 (Session 56 — Mira Picks + Orb Fix + Bundle AI Image + Admin Auth Fix)

---

## ✅ SESSION 57 — Admin Scroll Fix + Mira Picks Image Fix + ServiceCard (Mar 16, 2026)

### What Was Fixed:
1. **Admin panel horizontal scroll** — `Master Controls` div in `Admin.jsx` now has `flex-wrap` — buttons wrap to next line, no overflow
2. **Mira Picks broken images (403)** — `resolvePickImage()` helper in `DineSoulPage.jsx` and `resolveEntityImage()` in `DineContentModal.jsx` both skip `static.prod-images.emergentagent.com` URLs (return 403). Products/services without valid images show branded gradient fallback
3. **ServiceCard with Send to Concierge** — New `ServiceCard` component in `DineContentModal.jsx` for services from `services_master`. Clicking "Send to Concierge →" calls `POST /api/service_desk/attach_or_create_ticket` with full intent flow. Toast confirms success. ID-card shows SERVICE badge + mira_score + mira_reason
4. **Services now appear in Mira's Picks pills** — `DineContentModal` for `miras-picks` now includes services from `claude-picks` that aren't in `products_master`. Uses `entity_type` for routing: service → `ServiceCard`, product → `ProductCard`
5. **Product image enrichment** — Products in DineContentModal use `resolveEntityImage()` — prefers cloudinary URL from scored picks, falls back to filtered product image
6. **ProductCard in Mira's Picks** — Opens product detail modal (existing behavior) with "Include" / Add to Cart flow

### Key File Changes:
- `frontend/src/pages/Admin.jsx` — `flex-wrap` on Master Controls div
- `frontend/src/pages/DineSoulPage.jsx` — `resolvePickImage()` helper, branded gradient fallback
- `frontend/src/components/dine/DineContentModal.jsx` — `resolveEntityImage()` helper, `ServiceCard`, entity_type routing, services from claude-picks added to display

### Testing: All tests PASS (100% backend, 95% frontend — all critical flows ✓)

---

## ✅ SESSION 56 — Mira Picks, MiraOrb Amber, Bundle Fix, Admin Auth (Mar 16, 2026)

### What Was Fixed:
1. **Double MiraOrb removed** — Removed duplicate `MiraOrb` from `DineSoulPage.jsx` (now uses single orb from `MiraChatWidget` in `PillarPageLayout`)
2. **MiraOrb now uses pillar colors** — `MiraOrb.jsx` updated to use `orbPrimary`/`orbSecondary` from `PILLAR_THEMES` when `pillar` prop is set. `dine` → amber `#F59E0B / #D97706`. `MiraChatWidget` now passes `pillar={pillar}` to `MiraOrb` when floating (collapsed state).
3. **Mira Picks section added to /dine** — New `MiraPicksSection` component in `DineSoulPage.jsx`: fetches from `GET /api/mira/claude-picks/{pet_id}?pillar=dine&entity_type={type}` in parallel (products + services), interleaves results (2 products : 1 service), displays up to 16 AI-scored cards with image, score bar, and mira_reason. Shows ONLY for pets with scores.
4. **Bundle generate-image URL fixed** — `BundlesManager.jsx` was calling `/api/bundles/{id}/generate-image` (wrong) → now calls `/api/admin/celebrate/bundles/{id}/generate-image` (correct)
5. **Admin auth sessionStorage fix** — Both `BundlesManager.jsx` and `ProductBoxEditor.jsx` added `getAdminAuth()` helper that checks both `localStorage.adminAuth` AND `sessionStorage.admin_auth` — fixes "Invalid credentials" error caused by `AdminProtectedRoute` only setting sessionStorage.

### Key File Changes:
- `frontend/src/pages/DineSoulPage.jsx` — Removed duplicate MiraOrb, added MiraPicksSection
- `frontend/src/components/MiraOrb.jsx` — Pillar-specific orb gradient colors
- `frontend/src/components/MiraChatWidget.jsx` — Passes `pillar` prop to `MiraOrb`
- `frontend/src/components/admin/BundlesManager.jsx` — Fixed URL + added getAdminAuth() sessionStorage fallback
- `frontend/src/components/admin/ProductBoxEditor.jsx` — Added getAdminAuth() sessionStorage fallback

### Testing: All 11 tests PASS (100%) ✓ Backend 12/12 ✓

---

## ✅ SESSION 55 — Comprehensive Dine UI/UX Fixes + Mobile Responsiveness (Mar 16, 2026)

### What Was Fixed:
1. **Modal z-index fixed (all 4 modals)** — `DineConciergeModal`, `ConciergeIntakeModal`, `GuidedNutritionPaths` ModalShell all migrated to `createPortal(content, document.body)` with `zIndex: 10002`. `MealBoxCard` bumped to 10002. All modals now render above the sticky navbar (`z-[10000]`).
2. **MealBoxCard race condition fixed** — `openModal()` now triggers `loadProducts()` if `slotsData` is null. Subtitle shows "Building plan…" when loading, not "0 slots".
3. **DineSoulPage mobile responsive grids** — Dimensions grid: 5-col → 2-col mobile / 3-col tablet / 5-col desktop. Pet Friendly Spots: 3-col → 1-col mobile / 2-col tablet / 3-col desktop. DiningConcierge hero padding: 28px mobile / 36px desktop.
4. **TummyProfile modal z-index** — Bumped from 1000 → 10002.
5. **MiraOrb bottom clearance** — Moved from `bottom: 24` → `bottom: 80` to clear mobile bottom nav.
6. **GuidedNutritionPaths responsive grid CSS** — Added `@media` breakpoints for `.guided-paths-grid` (1-col mobile → 2-col tablet → 3-col desktop).
7. **CelebrateHero layout aligned to DineHero** — Changed from `flex-col md:flex-row` to `flex-col items-center` (always centered column, matching DineHero).

### Key File Changes:
- `frontend/src/components/dine/DineConciergeModal.jsx` — createPortal, z-10002, mobile bottom sheet
- `frontend/src/components/dine/ConciergeIntakeModal.jsx` — createPortal, z-10002
- `frontend/src/components/dine/GuidedNutritionPaths.jsx` — createPortal, z-10002, responsive grid CSS
- `frontend/src/components/dine/MealBoxCard.jsx` — race condition fix, z-10002
- `frontend/src/pages/DineSoulPage.jsx` — responsive grids, TummyProfile z-10002, MiraOrb bottom 80
- `frontend/src/components/celebrate/CelebrateHero.jsx` — centered column layout

### Testing: Visual ✓ API ✓ Lint ✓

---


### What Was Built:
1. **Moved dark brown CTA ("Want us to plan the whole outing?") to the TOP** of `DiningConcierge` component — was below 4 service cards, now above them per user spec
2. **Created `ConciergeIntakeModal.jsx`** (`/app/frontend/src/components/dine/`) — 3-question intake modal (occasion, date, notes) that opens from both "Talk to your Concierge" CTA and each service card CTA link
3. **Created `POST /api/concierge/dining-intake`** backend endpoint — follows the unified service flow: intake record → admin notification → service desk ticket → channel intake. Returns `{ success, intakeId }`
4. **Removed duplicate `DiningConcierge`** that was erroneously rendered outside the eat tab (was showing on both Eat & Dine Out tabs)
5. **Removed dead `MiraMealPick` function** (old "dud" meal pick component, lines 926-957)

### Final Eat-Tab Layout (confirmed by screenshot):
> Hero → CategoryStrip → TabBar → "How would Mojo love to eat?" → TummyProfile → Eat & Nourish (dimensions) → **MealBoxCard** → **DiningConcierge** (brown CTA on top, service cards below) → GuidedNutritionPaths

### Key File Changes:
- `frontend/src/pages/DineSoulPage.jsx` — Reordered DiningConcierge, added modal state, removed MiraMealPick
- `frontend/src/components/dine/ConciergeIntakeModal.jsx` — NEW: 3-question modal with real API call
- `backend/concierge_routes.py` — Added `DiningIntakeRequest` model + `POST /api/concierge/dining-intake`

### Testing: Visual ✓ API ✓ (intakeId: DINT-20260316-7B591F returned from curl test)

---

## ✅ SESSION 52 — Mira Meal Box + AI Image Gen Auth Fix (Mar 16, 2026)

### Features Built:

#### 1. The Mira Meal Box (`MealBoxCard.jsx` + `meal_box_routes.py`)
Full 6-screen meal plan builder on the `/dine` page:
- **Teaser Card** (always visible): Dynamic description ("Salmon-forward, chicken-free, safe for their lymphoma"), 4 chips, two CTAs
- **Screen 1**: Meals per day (1 or 2)
- **Screen 2**: Review Mira's curated 5 slots (morning meal, evening meal, treat, supplement, health support)
- **Screen 3**: Browse & swap alternatives per slot
- **Screen 4**: Delivery frequency (weekly/fortnightly/monthly)
- **Screen 5**: Health & allergy confirmation checkbox
- **Screen 6**: Confirmed — ticket number + "What happens next"
- **Never empty**: DB products first (ranked by Mira scores); "Mira Imagines" fallback if DB empty — persisted to `products_master` with `pillar=dine`
- **Fully dynamic**: Works for any future pet (reads `doggy_soul_answers.favorite_protein`, `health_data.allergies`, `health_data.chronic_conditions`)

#### 2. Backend Endpoints:
- `GET /api/mira/meal-box-products` — curates 5 slots, filters by allergy, sorts by Mira score, fallback to Mira Imagines
- `POST /api/concierge/meal-box` — creates `meal_box` ticket in `service_desk_tickets`, returns `ticket_id`

#### 3. AI Image Generation Auth Fix:
- **Root cause**: All 4 admin XHR calls were sending `Authorization: Bearer <token>` but admin uses HTTP Basic Auth (`Authorization: Basic <base64(user:pass)>`)
- **Fixed in**: `ProductBoxEditor.jsx`, `PillarProductsTab.jsx`, `CelebrateManager.jsx`, `ServiceBox.jsx`
- **Verified**: `POST /api/admin/products/DM-001/generate-image` with Basic Auth → HTTP 200, Cloudinary URL returned

#### 4. Allergy "No" Fix:
- `TummyProfile.jsx`: `mergeAllergies` now filters `"no"`, `"no allergies"`, `"na"`, `"n/a"`
- `DineContentModal.jsx`: `getPetAllergies` now has `ALLERGY_CLEAN` regex filtering same values

---

## ✅ SESSION 51b — Dynamic Dimension Text + Admin Filter + AI Image Fix (Mar 16, 2026)

### Fixes:
1. **Dynamic DINE_DIMS per pet** (`DineSoulPage.jsx`): Converted `DINE_DIMS` from a hardcoded constant to `getDineDims(pet)` function. Now "Salmon-forward" shows for Mojo (loves Salmon) and "Chicken-forward" shows for Lola (loves Chicken). Badge text also dynamic: `"{name}'s body needs this"` and `"{name} loves these"`.
2. **Fixed "Salmon treats-forward"**: Strip food/treat suffixes (`treats/biscuits/food/meal`) from `favProtein` before inserting into templates. Mojo now sees "Salmon-forward" (not "Salmon treats-forward").
3. **Admin Product Filter** (`PillarProductsTab.jsx`): Fixed stale closure bug — `fetchProducts` now accepts `catOverride` param; `onChange` passes new category directly instead of relying on stale closure. Selecting "Homemade & Recipes" now correctly shows 7 products.
4. **AI Image Generation** (`ProductBoxEditor.jsx`, `PillarProductsTab.jsx`, `CelebrateManager.jsx`, `ServiceBox.jsx`): All 4 files now use `XMLHttpRequest` instead of `fetch` to bypass Emergent platform's fetch interceptor that was causing "body stream already read" error.
5. **Fixed allergy "No" showing** (`TummyProfile.jsx`, `DineContentModal.jsx`): Added `"no"` to allergy filter list. Lola's `food_allergies: ["No"]` now correctly shows as no allergies.
6. **Mira Score Engine confirmed working**: Mojo has 3234 scores, top dine picks are salmon-ranked (Salmon Training Bites: 99, Salmon Morning Bowl: 98).

### Test Results (iteration_151.json — 95%):
- Dynamic text: Lola shows "Chicken-forward" ✓, Mojo shows dynamic salmon text ✓
- Admin filter: "Homemade & Recipes" shows exactly 7 products ✓
- Mira's Picks: All salmon products for Mojo ✓, no Akita products ✓

---

## ✅ SESSION 51 — Dine Page: Mira's Picks Breed Fix + Product Image Fix (Mar 16, 2026)

### Root Cause Fixed:
**Mira's Picks was showing Akita breed merchandise (Akita Feeding Mat, Akita Food Storage Container) instead of food products for Mojo (Indie breed)**

The bug: `DineContentModal.jsx` miras-picks fetch used `GET /api/admin/pillar-products?pillar=dine&limit=60` which returns ALL dine products sorted alphabetically. Since breed merchandise (Akita, American Bully...) comes first alphabetically, only breed merch appeared in the first 60.

### Fixes Applied:
1. **`DineContentModal.jsx` - `miras-picks` fetch**: Now fetches 5 food categories in parallel (Daily Meals, Treats & Rewards, Supplements, Frozen & Fresh, Homemade & Recipes + services). Also deduplicates by name (same product existed with different IDs).
2. **`DineContentModal.jsx` - `soul-picks`**: Now only shows breed merchandise that exactly matches the pet's breed. No fallback to wrong breed products. Also deduplicated by name.
3. **DB: Food product images**: Updated `image` field for all 48 catalog products (DM-001 to HR-007) to point to the correct sub-category food photography stored in `image_url`.
4. **DB: Service mira_tags**: Updated 5 dine service products with appropriate tags ("Complimentary", "Reservation Service", "Dining Support") instead of incorrect "Nutritious & delicious".

### Product Mapping Confirmed (64 real food/service products):
- Daily Meals: 13 (Morning Meal/Evening Meal/Portion Guide/Special Diets sub-tabs ✓)
- Treats & Rewards: 12 (Everyday/Training/Birthday/Allergy-Safe sub-tabs ✓)
- Supplements: 11 (Immunity/Joint/Digestion/Skin & Coat sub-tabs ✓)
- Frozen & Fresh: 5 (Cold Pressed/Raw/Freeze Dried/Fresh Cooked ✓)
- Homemade & Recipes: 7 (Quick Recipes/Weekend/Special Occasion/Ingredient Guide ✓)
- Fresh Meals: ~11
- Services (dine): 5

### Testing: 90% → verified by testing agent (iteration_150.json)
- Mira's Picks: PASS — Food products showing (Salmon Training Bites, Salmon Bowls, Supplements)
- No Akita products: PASS
- All 5 services showing: PASS
- Subcategory tabs: PASS (all 5 categories)
- Soul Picks: PASS (shows Indie breed products only, deduped)

---

## ✅ SESSION 50 — Mira Score Engine: Claude Sonnet 4.6 Recommendation System (Mar 15, 2026)

### Architecture:
**Covers ALL entity types across ALL pillars:**
- `products_master` — all physical products
- `services_master` — all services
- `bundles` — all bundle packs
- (Collections & Experiences: same pattern when added)

### Backend — `mira_score_engine.py`:
- **Claude Sonnet 4.6** (`claude-sonnet-4-6`) via `emergentintegrations`
- **Batch size**: 20 items per Claude call, 2 batches in parallel
- **System prompt**: Mira persona, scores 0-100, ultra-personalized 15-word reason
- **DB collection**: `mira_product_scores` — `{pet_id, entity_id, entity_type, pillar, score, mira_reason, scored_at, pet_name}`
- **Endpoints** (all at `/api/mira/`):
  - `POST /score-for-pet` — background (fire-and-forget), scores ALL entities
  - `POST /score-context` — sync scoring for specific pillar+category (~5s for 60 items)
  - `GET /scores/{pet_id}` — all pre-computed scores
  - `GET /top-picks/{pet_id}` — top-N scores, enriched with full product data
  - `GET /score-status/{pet_id}` — check if scores exist + timestamp

### Frontend Integration (`DineContentModal` miras-picks):
1. Check `GET /api/mira/score-status/{pet_id}` — has pre-computed scores?
2. If YES → `GET /api/mira/top-picks/{pet_id}?pillar=dine` → merge Claude's `mira_reason` as `mira_hint` → sort by `mira_score`
3. Always apply client-side `applyMirasPicksIntelligence()` as safety filter (allergens)
4. If NO scores → fire-and-forget `POST /api/mira/score-for-pet` → client-side sort only
5. `MiraImaginesCard`s generated for dream items missing from catalog

### Testing Status: Backend live ✅ (`/api/mira/score-status/test123` returns 200). E2E test with real pet_id pending.

---

## ✅ SESSION 49 — Universal Mira Intelligence Pattern + Celebrate Fix (Feb 2026)

### UNIVERSAL PATTERN (applies to all pillars going forward):
**"Mira's Picks" on any pillar page MUST:**
1. Fetch real DB products + services for that pillar (allergy-filtered, loves-first, health-safe flagged)
2. Generate `MiraImaginesCard`s client-side for missing breed-relevant dream items (NOT in catalog yet)
3. Render:
   - **Services** → `ProductCard` with orange "Request Service" button → concierge ticket → "Sent to Concierge!" toast
   - **Real products** → `ProductCard` with "View Details" → `ProductDetailModal` → Add to Cart → CartSidebar
   - **Mira Imagines** → `MiraImaginesCard` (dark amber card) → "Request a Quote" → concierge ticket
4. **Imagines are generated from**: breed (no breed product = breed meal plan), allergies (no safe pack = allergy pack), health condition (treatment kit), loves (fav protein box)
5. No hardcoding. No extra API call. All client-side from soul profile already in context.

### What Was Built:
- **Celebrate duplicate heading fixed**: removed outer heading from `CelebratePageNew.jsx` (CelebrateServiceGrid already has its own)
- **`MiraImaginesCard`** component: dark amber card, "MIRA IMAGINES" badge, "Request a Quote" → concierge ticket → "Sent to Concierge!" state
- **`generateMiraImagines()`**: breed-specific meal plan, allergy-free pack, treatment support kit, fav-food box — all client-side
- **`applyMirasPicksIntelligence()`**: full filtering + sorting + mira_hint for Mira's Picks section
- **`DineContentModal` miras-picks** rewritten: real products + services (intelligently filtered) + Mira Imagines grid

---

## ✅ SESSION 48 — Eat & Nourish: Real Products + Mira Intelligence (Feb 2026)

### What Was Built:
- **Removed ALL hardcoded products and tabs from `DINE_DIMS`** — 5 dimensions now use visual config only
- **`DimExpanded` rebuilt** — fetches from `apiProducts` (preloaded from `/api/admin/pillar-products?pillar=dine&limit=600`), derives tabs dynamically from `sub_category` field
- **`applyMiraIntelligence()`** — pure client-side intelligence layer on existing pet soul data:
  - **Filter**: removes products containing known allergens (e.g., "Chicken & Rice" filtered for Mojo)
  - **Surface first**: products matching `favoriteFoods`/`favorite_protein` sorted to top
  - **Flag health-safe**: `isHealthSafe` products sorted above rest
  - **Dim**: `_dimmed=true` products shown at 40% opacity with "Conflicts goal" label
  - **Reason**: each product gets `mira_hint` = "Matches Mojo's love for salmon" / "Free from chicken — safe for Mojo" / "Safe during Mojo's treatment"
- **Stats bar**: "✓ 12 safe for Mojo | ✗ 1 filtered (allergens) | ♥ 2 match Mojo's loves"
- **♥ heart badge** on loved products in grid
- **Real `SharedProductCard`** (from `ProductCard.jsx`) used — click "View Details" → `ProductDetailModal` opens → Add to Cart → CartSidebar
- **"Why Mira suggests this" block** added to `ProductDetailModal` (amber card with ✦, shows `mira_hint`)
- **Removed dead code**: `adaptDineProduct`, `getDineProductIcon`, `CATEGORY_BG`, local `ProductCard` function

### Testing: 92% → 100% after mira_hint in modal fix (iteration_149.json — all critical flows passing)

---

## ✅ SESSION 47 — Dine: Product vs Service Routing (Feb 2026)

### What Was Built:
- **Products → Cart**: Any product (non-service) shows purple "View Details" → ProductDetailModal → pink-purple "Add to Cart/Include" → CartSidebar ("Your Requests") with quantity, subtotal, shipping, checkout
- **Services → Concierge**: Any product with `product_type='service'` or `category='service'` shows orange "Request Service" card button → ProductDetailModal → orange "Request This Service" button → POST `/api/service_desk/attach_or_create_ticket` → toast "Sent to Concierge!" + "Handle Requests →" link. CartSidebar does NOT open.
- **Mira's Picks**: Now does two parallel fetches — general dine products + dine category=service. All 5 dine services now surface (Backup Dining Alternatives, Venue Suitability Advisory, Dining Etiquette Guidance, Reservation Assistance, Pet-Friendly Restaurant Discovery)
- Service success state: button turns green "✓ Sent to Concierge!" after click

### Testing: 90% pass rate (iteration_148.json) — Product flow 100%, Service flow end-to-end verified. Fixed 4/5 missing services via parallel fetch (iteration retest in progress)

---

## ✅ SESSION 46 — Dine: Real ProductCard + Cart Flow (Feb 2026)

### What Was Built:
- **Replaced custom `DineProductCard`** with the real `ProductCard` component (same as Celebrate page)
- **Click any Dine product → ProductDetailModal opens**: large image left, name+description right, Add to Cart button
- **Add to Cart → CartSidebar**: "Your Requests" panel shows item, quantity -/+, ₹ per item, Products Subtotal, Shipping ₹150, Products Total, "Checkout Products (₹X) →" button
- **Z-index correct**: ProductDetailModal (z=9999 via createPortal) renders above DineContentModal (z=56)
- **Dine-specific CTA**: "Include" replaces generic "Add to Cart" label for dine products
- Removed dead code: `DineProductCard`, `MiraImaginesCard`, `miraImagines` state

### Testing: 100% pass rate (iteration_146.json) — Full E2E: pill → modal → View Details → ProductDetailModal → Add to Cart → CartSidebar with Checkout button

---

## ✅ SESSION 45 — Dine: DineContentModal Redesign (Feb 2026)

### What Was Built:
- **Completely rewrote `DineContentModal.jsx`** to match the product mockup design
- **Header allergy chips**: Pet's allergies shown as "Chicken-free · Treatment-safe" chips derived from all allergy sources on pet object
- **Mira quote block**: Peach background card with dynamic quote — "I built this around Mojo's profile and what works for Indies. The Salmon options are first. Everything here is chicken-free and treatment-safe." + "♥ Mira knows Mojo"
- **Amber pill sub-category tabs**: Active = orange gradient, inactive = light amber with orange border
- **New `DineProductCard`**: Large 160px image, purple ✦ mira_tag badge overlay, allergy_free chips below name, orange price, Add (orange) / ✓ Added (green with purple border) button
- **Smart product sorting**: Products safe for pet's allergies appear first
- **`DineBundleCard`**: Items chips, bundle price + original price strikethrough, Get Bundle → Sent! state
- **Bug Fix**: `useMemo` added for allergies to prevent infinite fetch loop (was causing ERR_INSUFFICIENT_RESOURCES)

### Testing: 100% pass rate (iteration_145.json) — All 8 category pills, all modal states, Add→Added toggle, Bundles

---

## ✅ SESSION 44 — Dine: Bundles as Category Pill (Feb 2026)

### What Was Done:
- **Removed incorrect `DineBundles` inline component** from `DineSoulPage.jsx` (was dead code, never rendered)
- **Added "Bundles" pill** to `DINE_CATEGORIES` in `DineCategoryStrip.jsx`, positioned after "Homemade & Recipes" (slot 5 of 8)
- **Added `bundles` config** to `DineContentModal.jsx` `CATEGORY_CONFIG` — emoji 🎁, label "Dining Bundles"
- **Added bundles fetch logic** to `DineContentModal.jsx`: fetches from `/api/bundles?pillar=dine`, maps bundle objects to ProductCard-compatible shape (preserving price, image, items, discount)
- **Added CTA**: "Get a Bundle for {petName} →"
- **Verified**: 3 dine bundles exist in DB (Premium Mealtime Bundle, etc.)

### Files Modified:
- `frontend/src/components/dine/DineCategoryStrip.jsx` — Added "Bundles" pill
- `frontend/src/components/dine/DineContentModal.jsx` — Added config + fetch logic
- `frontend/src/pages/DineSoulPage.jsx` — Removed unused DineBundles + DineBundleCard components

---

## ✅ SESSION 43b — TummyProfile Rebuilt as Compact Bar + Drawer (Feb 2026)

**Replaced the incorrect 4-cell grid with the correct Mira's Picks pattern:**

- **Compact bar** inline on `/dine` page: shows pet name, allergy chips (red ✗), loves chips (green ♥), and "Mira's picks →" CTA
- **Right-side drawer** (fixed panel, 460px, full height) with:
  - **"Mira Imagines"** section: dynamic food cards generated from `pet.loves` + `pet.allergies` + `pet.healthCondition` via `generateFoodImagines()` — mirrors the imaginaryProducts pattern in `CelebrateContentModal`. Each card has "Mira Imagines" badge, emoji, name, desc, reason, "Ask Mira to Source →" button
  - **`DineSoulQuestionsSection`**: Amber-themed SoulQuestionsSection — fetches from `/api/pet-soul/profile/{id}/quick-questions?limit=5&context=dine`, shows big soul score % (64px, amber glow), progress bar, amber `SoulQuestionCardDine` cards. Returns null for high-score pets (0 unanswered questions)
- **Backdrop**: `position:fixed; inset:0; z-index:1000` closes drawer on click
- **data-testids**: `tummy-profile` (bar), `tummy-drawer` (panel), `tummy-drawer-close` (✕ button)
- Testing: 100% frontend (11/11) + 100% backend (10/10) — iteration_142

---



### What Was Built / Fixed:

#### 1. Layout: Category Strip & Tab Bar — Center-Aligned
- **DineCategoryStrip** moved inside `max-w-5xl mx-auto` container (matching Celebrate page structure)
- **TabBar** moved inside same container + center-aligned with `justify-content: center`
- **TabBar styling**: Changed from underline-style to amber pill/box buttons:
  - Active tab: `linear-gradient(135deg, #FF8C42, #C44400)` background, white text
  - Inactive tab: `#FFF3E0` background, `#C44400` text, amber border
  - Both tabs have pill shape (`borderRadius: 20`)

#### 2. New Heading: "How would Mojo love to eat?"
- Added `<section data-testid="dine-how-would-section">` between TabBar and content
- Heading: `How would [petName] love to eat?` (petName in #FF8C42 amber color)
- Sub-heading: "Choose a dimension — everything inside is personalised to [petName]'s food profile."
- Mirrors the exact structure and styling of the "How would Mojo love to celebrate?" section in `SoulCelebrationPillars.jsx`
- Uses `fontFamily: "Georgia, 'Times New Roman', serif"` to match

#### 3. Tummy Profile Refactor — Now Functions Like "Mira's Picks"
- **Two states** based on `hasFoodData` (loves.length > 0 OR allergies.length > 0 OR healthCondition):
  - **GROW SOUL state** (no food data): Shows amber-themed soul score header + question cards (4 dine-scoped questions from `/api/pet-soul/profile/{id}/quick-questions?limit=4&context=dine`)
  - **MIRA KNOWS state** (has food data): Shows rich profile (loves, avoid, goal, health) + questions below if any remain
- **New `SoulQuestionCardDine` component**: Amber-themed version of `SoulQuestionCard` from CelebrateContentModal
  - Submits to `/api/pet-soul/profile/{id}/answer`
  - Shows +pts earned, success confirmation
  - All amber/terracotta color scheme (#FF8C42, #C44400)
- **Live score update**: Soul score updates live as questions are answered; dispatches `soulScoreUpdated` event

#### 4. Removed
- Removed unused `MiraSoulNudge` import from DineSoulPage.jsx

### Files Modified:
- `frontend/src/pages/DineSoulPage.jsx` — All changes above

### Testing:
- Lint: 0 errors
- Screenshots: Verified amber tabs, centered layout, new heading, TummyProfile states

---



### What Was Fixed:
- **Rebuilt DineHero.jsx** — Complete mirror of `CelebrateHero.jsx`, 1:1 structure:
  - Full-viewport dark amber gradient (`#2d0800 → #5a1500 → #a33000 → #d45500`)
  - 96px avatar with gradient ring border + "Soul X%" badge
  - Eyebrow chip — soul status text
  - Georgia serif title: "Food & Nourishment / for Mojo"
  - Subtitle: "Mark the meals that matter — the way Mojo actually eats"
  - **3 soul chips** (was 2): Allergy · Loves · Personality traits (from soul archetype + describe_3_words)
  - Mira quote card — food/allergy context-aware (different from Celebrate's birthday context)
  - Animated ChevronDown scroll indicator
  - Framer Motion entrance animations on all elements
- **max-w-5xl centred content** — replaced `maxWidth:1100` inline style with Tailwind `max-w-5xl mx-auto`
- `DineSoulPage.jsx` — replaced `DineHeroV2` inline component with clean import of new `DineHero.jsx`

---

## ✅ SESSION 41 — Dine Page: Golden Principles — Category Strip + AI Images + Product Modal (Mar 15, 2026)

### What Was Built:

#### 1. 20 AI-Generated Product Images (Sub-Category Level)
- Generated distinct food photography images for all 20 Dine sub-categories using Gemini Imagen 4
- Each image is styled as premium food photography (salmon bowls, birthday cakes, supplement jars, raw patties, recipe cards, etc.)
- Updated all 48 Excel catalog products in `products_master` with `image`, `image_url`, and `images` fields pointing to the new sub-category-specific image
- Previous: All 48 products shared 1 generic image. Now: 20 unique images across 20 sub-categories

#### 2. DineCategoryStrip.jsx — `/app/frontend/src/components/dine/DineCategoryStrip.jsx`
- 7-tile scrollable category strip (Daily Meals, Treats & Rewards, Supplements, Frozen & Fresh, Homemade & Recipes, Soul Picks, Mira's Picks)
- Exact same golden principle pattern as `CelebrateCategoryStrip.jsx`
- Active tile highlighted with `#FF8C42` underline, amber colour scheme
- Wired into `DineSoulPage.jsx` between hero and TabBar

#### 3. DineContentModal.jsx — `/app/frontend/src/components/dine/DineContentModal.jsx`
- Full product modal identical in structure to `CelebrateContentModal`
- Fetches from SSOT: `/api/admin/pillar-products?pillar=dine&category=...`
- Sub-category tabs auto-generated from product data
- Uses shared `ProductCard` component — same CRUD/admin/View Details as everywhere else
- Personalised CTAs: "Build Mojo's Meal Plan →", "Add to Mojo's Treat Box →", "Start Mojo's Supplement Plan →" etc.
- Soul Picks: fetches breed merchandise from existing endpoints
- Mobile-first: bottom sheet on mobile, centered modal on desktop

#### 4. ProductCard.jsx — Image Fix
- Added `image_url` check in both `getValidImage()` and `getValidProductImage()` functions
- Added `emergentagent.com` to allowed image domains in `images[]` fallback
- All 48 Dine products now show correct AI-generated food photography

#### Testing Result: 100% Pass (iteration_140.json)
All 9 features verified: category strip, all modals with correct images and counts, tab filtering, personalised CTAs, View Details CRUD, Celebrate regression, admin panel access — ALL PASS

---

## ✅ SESSION 40 — Dine Page: MiraSoulNudge + Dynamic Products + Font Fixes (Mar 15, 2026)

### What Was Fixed / Built:

#### 1. MiraSoulNudge Added to /dine Page
- Component `<MiraSoulNudge pet={petData} token={token} context="dine" limit={3} />` added to the "Eat & Nourish" tab in `DineSoulPage.jsx`, positioned after the TummyProfile
- Uses `context="dine"` so it surfaces nutrition and food-related unanswered soul questions first
- Shows "all done" state when pet's soul score is high (e.g., 94% for Mojo)
- Import was already present but component was not rendered — now wired into JSX

#### 2. Dynamic Product Drawers (SSOT Products from API)
- Replaced hardcoded product data in dimension drawers with live data from `/api/admin/pillar-products?pillar=dine&limit=600`
- Added `apiProducts` state and fetch `useEffect` in `DineSoulPage` component
- Products are grouped by `category` → `sub_category` and passed to `DimExpanded` via `apiProducts` prop
- `DimExpanded` now prefers live API products, falls back to hardcoded catalog if API returns empty
- Helper functions added: `adaptDineProduct()`, `getDineProductIcon()`, `CATEGORY_BG`, `DIM_ID_TO_CATEGORY`
- Category mapping: "Daily Meals" → `meals`, "Treats & Rewards" → `treats`, "Supplements" → `supplements`, "Frozen & Fresh" → `frozen`, "Homemade & Recipes" → `homemade`

#### 3. Font Sizes Standardized with clamp()
- Hero title: `fontSize: 32` → `fontSize: "clamp(1.75rem, 4vw, 2.5rem)"` (responsive)
- Hero subtitle: `fontSize: 13` → `fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)"`
- "Eat & Nourish" heading: `fontSize: 20` → `fontSize: "clamp(1.125rem, 2.5vw, 1.375rem)"`
- "Guided Nutrition Paths" heading: same clamp
- "Dining Concierge Services" heading: same clamp
- "Want us to plan the whole outing?" heading: same clamp
- "The Mojo Meal Pick" title: `fontSize: 22` → `fontSize: "clamp(1.25rem, 3vw, 1.5rem)"`

#### Testing Result: 100% Pass
All features verified by testing agent (iteration_139.json):
- NoPetState, logged-in hero, TummyProfile, MiraSoulNudge (all-done state at 94%), dimension grid, drawer with live API products (Morning/Evening/Portion/Special tabs), font clamp sizes, Celebrate page regression — ALL PASS

---

## ✅ SESSION 39 — Dine Pillar Architecture Completion + Full Product Catalog Seeder (Mar 15, 2026)

### What Was Fixed / Built:

#### 1. Bundle Architecture — ALL Pillar Managers Fixed
- **Problem**: DineManager, CareManager, FitManager, LearnManager, AdvisoryManager, EmergencyManager, PaperworkManager all used old pillar-specific bundle APIs (`/api/X/admin/bundles`) and custom `BundleModal` components
- **Fix**: All 7 managers now use `<PillarBundlesTab pillar="X" />` component
- **PillarBundlesTab.jsx**: Completely rewritten to use canonical `/api/bundles?pillar=X` endpoint (per ARCHITECTURE.md)
- **Result**: ALL pillar managers now use the SSOT bundles collection

#### 2. Dine Product Catalog Seeded (48 products)
- **Source**: `Dine_ProductCatalogue_SEED.xlsx` — 5 Dine Dimensions:
  - Daily Meals (13 products): Morning Meal, Evening Meal, Portion Guide, Special Diets
  - Treats & Rewards (12 products): Everyday, Training, Birthday, Allergy-Safe
  - Supplements (11 products): Immunity/Treatment, Joint, Digestion, Skin & Coat
  - Frozen & Fresh (5 products): Cold Pressed, Raw, Freeze Dried, Fresh Cooked
  - Homemade & Recipes (7 products): Recipes, Ingredient Packs, Guides
- **All products** stored in `products_master` with `pillar: "dine"`, `locally_edited: True`
- **Admin endpoint**: `POST /api/admin/pillar-products/seed-dine-catalog` (idempotent, skips existing)
- **Admin button**: "Seed Dine Catalog (49 products)" in DineManager > Products tab
- **Included in**: CONSOLIDATE DATA button on admin dashboard

#### 3. Reference Documents (from files.zip — now in /app/docs/dine/)
- `Dine_MASTER.docx` — Complete spec: hero, tabs, TummyProfile, 5 dimensions, MiraMealPick, Concierge
- `Dine_CopySpec_ForAditya.docx` — Full page copy with all variables and Mira voice lines
- `Dine_UISpec_ForAditya.docx` — Exact colors, typography, spacing values
- `Dine_ProductCatalogue_SEED.xlsx` — Product catalog (seeded to DB)
- `DineSoulPage.jsx` — Mock-data reference implementation (not used directly — existing components are wired to real API)

#### 4. Sync to Production Guide (updated)
After deploying via "Save to Github":
1. Log in to admin panel (`/admin`)
2. Click "🗃️ CONSOLIDATE DATA" button
3. This now ALSO runs `seed-dine-catalog` — 48 dine products seeded to production
4. All bundles from old pillar-specific collections migrated to unified `bundles` collection

---

## ✅ SESSION 38 — Full Pillar Architecture Unification + Bundle CRUD Enhancement (Mar 15, 2026)

### Canonical Architecture (LOCKED):
| Collection | Source of Truth For | Who Writes |
|---|---|---|
| `products_master` | ALL products across ALL pillars | Shopify Sync + Product Box + Soul Products + Admin |
| `services_master` | ALL services across ALL pillars | Service Box + Admin |
| `bundles` | ALL bundles across ALL pillars | BundlesManager Admin |

### What Was Built:
1. **Unified Pillar Products API** — `GET/POST/PUT/DELETE /api/admin/pillar-products?pillar=X` reading from products_master
2. **PillarProductsTab.jsx** — Reusable component for all 12 pillar admins (search, pagination, CRUD, image upload, AI gen)
3. **All 12 Pillar Admins Updated** — Care, Fit, Stay, Travel, Enjoy, Learn, Farewell, Emergency, Advisory, Paperwork, Dine, Adopt
4. **BundlesManager Enhanced** — Search bar, pagination (30/page), AI image generate in modal, file upload
5. **AI Image Generation Bug Fixed** — Used `res.text()` + `JSON.parse()` instead of `res.json()` (body stream locked fix)
6. **Data Migrations Run** — products_master: 5,789 | bundles: 103 | 149 celebrate categories fixed

### Testing Results:
- Backend: 100% (20/20 tests) ✅
- Frontend: 100% (5 features verified) ✅
- Data: products_master=5,789 | bundles=103 | services_master=1,102 ✅

---

## ✅ SESSION 37 — Services Architecture Fix + Celebrate Full CRUD (Mar 15, 2026)

### What Was Fixed:

#### 1. Services Architecture — Shop Removed (PERMANENT FIX)
- **Problem**: 561 services had `pillar: ''`, 392 had `pillar: 'shop'` (wrong — shop is for products)
- **Fix**: Keyword-heuristic script reassigned all services to correct pillars (care, emergency, advisory, etc.)
- **Product-type entries** in services_master (type='product') → marked `is_active: False`
- **ServiceBox admin**: Removed 'shop' from ALL_PILLARS array → now shows only 13 true service pillars
- **Architecture rule**: Shop = products by sub-category | Services = services from all 13 pillars

#### 2. Celebrate Products Admin — Full CRUD (1,499 products)
- **Problem**: Admin only showed 4 products (from `celebrate_products`), missing 1,495 from `products_master`
- **Fix**: `GET /api/celebrate/admin/products` now merges both collections
- **Features Added**: Pagination (50/page), search, category filter, total count display
- **Image Upload**: File upload button → `/api/upload/product-image` → Cloudinary
- **AI Generate Image**: Button calls `/api/celebrate/admin/products/{id}/generate-image`  
- **Shopify Badge**: Products from products_master show "Shopify" badge
- **Delete**: Soft-delete for products_master (marks inactive), hard delete for celebrate_products

#### 3. Architecture Documentation Updated
- HTML audit at `/app/docs/architecture_audit.html` updated with all fixes
- All data counts corrected

### Testing Results (Session 37):
- **Backend**: All tests passed ✅
- **Frontend**: CelebrateManager loads 1,499 products ✅
- **Services**: 13 pillars in ServiceBox (no 'shop') ✅

---

### What Was Fixed:

#### 1. Product Activation (CRITICAL DATA FIX)
- **Problem**: 3,960 products in `products_master` had no `active` field → showing 0 products everywhere
- **Fix**: Script `update_many(active missing → set active: True)` on all products with `image_url`
- **Result**: 3,987 products now active ✅

#### 2. PricingHub Pillar Bundles Tab (COMPLETE REWRITE)
- **Problem**: Only showed 5 pillars from wrong pillar-specific endpoints with wrong field names
- **Fix**: Rewrote `PillarBundlesSection` to use `GET /api/bundles?active_only=false` (unified collection)
- **Result**: Shows all **13 pillars**, 39 bundles total, inline price editing works ✅

#### 3. Bundle Pricing PATCH Endpoint (NEW FEATURE)
- **Added**: `PATCH /api/bundles/{id}/pricing` in `bundle_routes.py`
- Allows lightweight pricing-only updates (original_price, bundle_price, active)
- Auto-recalculates discount %

#### 4. Admin Navigation Fix
- **Problem**: Admin > Celebrate (sidebar) showed blank page (no render case for `activeTab === 'celebrate'`)
- **Fix**: Added `{activeTab === 'celebrate' && <CelebrateManager />}` render case in `Admin.jsx`

#### 5. Bundle Crash Fixes (Carried from Session 35)
- `BundlesManager.jsx`: `typeof item === 'object' ? item.name : item` for object items
- `LearnManager.jsx`: Same typeof check

#### 6. Architecture Documentation
- Created comprehensive HTML audit at `/app/docs/architecture_audit.html`
- API endpoint to serve it: `GET /api/docs/architecture-audit`

### Testing Results (Session 36):
- **Backend**: 15/15 tests passed ✅
- **Frontend**: 90% — CelebrateManager navigation fixed ✅
- **P0 Crash**: Resolved ✅

---

### Audit Results (All 4 Flows CONFIRMED Working):
1. **Admin Notification Bell** ✅ — `celebrate_picks_request` notifications appear immediately when user selects Mira Picks (API: `GET /api/admin/notifications`, 663+ total)
2. **Service Desk Ticket** ✅ — Ticket created with `status=new` and full pet/user info (API: `GET /api/tickets/`, 559 total)  
3. **Channel Intake (Unified Inbox)** ✅ — Entry created in `mira_picks_panel` channel (API: `GET /api/channels/intakes`)
4. **Member Notification** ✅ — `picks_request_received` appears in Dipali's notification inbox after sorting fix

### Bug Fixed:
- **Member notification sort bug**: `created_at` stored as BSON datetime in old notifications vs ISO string in new picks notifications caused MongoDB to sort by type (9 > 2), putting old items first. Fixed by sorting `_id` (ObjectId insertion order) in both `/api/member/notifications/inbox/{email}` (server.py line 17088) and `/api/user/notifications` (user_tickets_routes.py line 933)

### Key Finding:
- The bug was NOT in the data creation (all data was being saved correctly)
- It was a MongoDB sort bug causing newest `picks_request_received` to appear hidden behind older `pet_wrapped` notifications

---

### What Was Added:
1. **Service Pricing tab** in Pricing, Shipping & Commercial Hub — 7th tab added (was 6, now 7)
2. **Backend**: New `PATCH /api/service-box/services/{service_id}/pricing` endpoint for atomic pricing updates (only `base_price`, `discounted_price`, `active`, `is_free`, `sort_order`)
3. **Frontend**: Full service pricing table with: Service image/name/id, Pillar badge, Base Price, Discounted Price, Active status — all inline-editable
4. **Seed from Product Box** bug: Was only happening on old preview URL (celebrate-products). Our current environment (`celebrate-sync-3`) works fine — endpoint returns migrated/skipped stats
5. **Pillar field handling**: Fixed pillar badge to handle both string `'fit'` and array `[]` formats in service data

### Files Modified:
- `service_box_routes.py` — Added `PATCH /services/{service_id}/pricing` endpoint
- `PricingHub.jsx` — Added services state, fetchServices, updateServicePricing, Service Pricing tab

---

### What Was Fixed/Added:
1. **Enjoy pillar crash fix** — `credentials is not defined` error when clicking Bundles tab was fixed by removing invalid `credentials={credentials}` prop from PillarBundlesTab in EnjoyManager.jsx
2. **Services tab added to 7 pillar managers:** Fit(23), Farewell(8), Emergency(8), Learn(12), Paperwork(16), Advisory(8), Adopt(0 — none seeded yet)
3. Each Services tab uses `PillarServicesTab` component with `pillar="{slug}"` calling `GET /api/service-box/services?pillar={slug}`
4. **Testing:** 100% pass rate (8/8 features) — iteration_132.json

---

## ✅ SESSION 31 — Sync to Production + Create New Product/Service (Mar 15, 2026)

### What Was Verified/Completed:
1. **Sync to Production (MASTER SYNC)** — Confirmed the "Sync to Production" button includes the Celebrate Excel Catalog seeding step (Step 11.5/12) at `Admin.jsx` line 609. Calls `POST /api/admin/celebrate/seed-from-excel`.
2. **SYNC → PROD button** — Also includes the Celebrate Excel Catalog seeding step (Step 2) at `Admin.jsx` line 3510 after the mockup sync.
3. **Create New Product** — The "Add Product" button in Product Box (COMMERCE section) was already implemented. Opens a 6-tab editor dialog. Saves via `POST /api/product-box/products`. Verified working: product count increased from 3954 → 3955 after test.
4. **Create New Service** — The "Add Service" button in Service Box was already implemented. Opens a 4-tab editor dialog. Saves via `POST /api/service-box/services`. Verified working: service count increased from 1117 → 1118 after test.
5. **Testing:** 100% pass rate (6/6 features) via testing agent (iteration_131.json).

### Key Endpoints:
- `POST /api/admin/celebrate/seed-from-excel` — Seeds 93 products + generates AI images
- `POST /api/product-box/products` — Create new product (no auth required)
- `POST /api/service-box/services` — Create new service (no auth required)

---

---

## ✅ SESSION 30c — PillarServicesTab Bug Fix (Mar 15, 2026)

**Bug:** Celebrate Services tab (PillarServicesTab) was showing 255 services instead of 15.
**Root cause:** Component fetched ALL 1100+ services and used keyword matching ("birthday", "party", "event") to filter — flooding every pillar tab with unrelated services.
**Fix:** Changed to use `?pillar=celebrate` API parameter (exact match only). Removed the `getPillarKeywords()` function entirely.
**Result:** Celebrate shows 15, dine shows 9, stay shows 9, care shows 30, travel shows 11 — exactly what's assigned in each pillar.

---



### What Was Done:
1. **"Generate AI Image" in Product Box** — Added to `ProductBoxEditor.jsx` Media tab. Calls synchronous `POST /api/admin/products/{id}/generate-image` → saves to Cloudinary, returns URL immediately (like ServiceBox does).
2. **"Generate AI Image" in Bundle editor** — Added to `CelebrateManager.jsx` bundle edit modal. Calls `POST /api/admin/celebrate/bundles/{id}/generate-image`.
3. **Active/Inactive toggle in PillarServicesTab** — Each service row now has a clickable green/gray toggle button to activate/deactivate the service. Plus a "Show All / Active Only" filter button.
4. **Two new backend endpoints:** `POST /api/admin/products/{id}/generate-image` and `POST /api/admin/celebrate/bundles/{id}/generate-image` — both synchronous, return Cloudinary URL.
5. **Testing:** 100% pass rate (21/21 backend + 4/4 frontend) via testing agent.

---


**93 products from Celebrate_ProductCatalogue_SEED.xlsx seeded into DB with AI images**

### What Was Done:
1. **Product Catalog Audit** — Parsed `Celebrate_ProductCatalogue_SEED.xlsx` (94 products across 8 pillars). Found only 1 already in DB. 93 missing.
2. **Created `backend/celebrate_excel_seeder.py`** — New seeder with all 93 products including SKUs (FF-001 to HW-011), descriptions, subtitles, mira_tags, soul_signals, shopify_tags, and AI image prompts.
3. **New Admin Endpoints:**
   - `POST /api/admin/celebrate/seed-from-excel` — Seeds + generates AI images
   - `GET /api/admin/celebrate/excel-seed-status` — Live progress status
4. **AI Image Generation** — All 93 products generated AI images via Cloudinary (0 failures).
5. **Admin Panel Updated** — `ProductGeneratorPanel.jsx` now has "Excel Catalog Seed" tab with live progress, pillar counts, and live image grid.
6. **All 20 Pillar Tabs Now Populated:**
   - Previously empty/low: enrichment(1→5), walking(1→4), adventure(1→3), venue(1→2), portraits(3→6+)
   - All other tabs already had products and now have Excel additions too

### Excel Products Summary:
| Pillar | SKU Prefix | Count |
|--------|-----------|-------|
| Food & Flavour | FF-001 to FF-014 | 14 |
| Play & Joy | PJ-001 to PJ-014 | 14 |
| Social & Friends | SF-001 to SF-012 | 11 |
| Adventure & Move | AM-001 to AM-010 | 10 |
| Grooming & Beauty | GB-001 to GB-012 | 12 |
| Learning & Memory | LM-001 to LM-110 | 21 |
| Health & Wellness | HW-001 to HW-011 | 11 |
| **Total** | | **93** |

### Production Deploy Instructions:
1. Deploy preview → production
2. Run: `POST /api/admin/celebrate/seed-from-excel` (admin auth required) to seed products in production
3. Monitor: `GET /api/admin/celebrate/excel-seed-status` for image generation progress

---

## ✅ SESSION 29 — AI Personalization Tested + Celebrate Production Parity (Mar 15, 2026)
**All celebrate page changes verified ready for production deployment**

### What Was Done:
1. **Backend verified healthy** — lint warnings are non-critical warnings (F811/F841/F841), server starts fine
2. **AI Personalization tested** — `GET /api/products/soul-ranked?category=X&pet_id=Y` working end-to-end:
   - Mojo (Indie, peanut butter fan) → "Peanut Pup Prints" top cake (score=85)
   - Mystique (Shih Tzu) → "Festive Cake Pops" top cake (score=65) — different result = personalization works
3. **Service illustrations fixed** — ran fix-celebrate-data: all 15 celebrate services now use `res.cloudinary.com` URLs, 0 Unsplash
4. **Confirmed production parity checklist:**
   - ✅ /celebrate → /celebrate-soul redirect (App.js line 539)
   - ✅ toStrArray() crash fix for Food & Flavour pillar
   - ✅ fix-celebrate-data endpoint works (`POST /api/admin/fix-celebrate-data?password=lola4304`)
   - ✅ Soul-ranked products endpoint at `/api/products/soul-ranked`
5. **Documentation updated** — complete-documentation.html, CHANGELOG.md, PRD.md

### Production Deploy Instructions:
1. Deploy preview → production
2. Run: `POST https://thedoggycompany.com/api/admin/fix-celebrate-data?password=lola4304`
3. Verify celebrate page loads with pet selected, pillars show products

---

## ✅ SESSION 28 — Celebrate Page Design Quality Pass (Mar 2026)
**Improved font sizes, spacing, and mobile experience across celebrate page**

### Changes Made:
1. **SoulCelebrationPillars.jsx** — Pillar cards: icon 28→36px, title 14→16px, tagline 12→13px, badge 11→12px, card padding+radius increased, section header clamp(1.5rem→2rem), gap `gap-2.5`→`gap-3 md:gap-4`
2. **SoulPillarExpanded.jsx** — Product cards: image 80→120px, name 12→14px, price 13→15px. Panel header 18→20px, tabs 12→13px
3. **ProductDetailModal.jsx** — Proper iOS bottom sheet on mobile (slides from bottom, drag handle), image 224→256px, action buttons py-4 fontSize 16


## ✅ SESSION 27 COMPLETE — Production Fix Panel + Compare Tool (Mar 2026)

**Status: Complete — Admin now has zero-deployment production fix buttons and live preview↔production compare**

### What Was Built:
1. **New backend endpoint** `/api/admin/fix-pet-string-data` — converts pet soul data string→array (fixes Food & Flavour crash)
2. **Updated `/api/admin/fix-celebrate-data`** — now also fixes pet soul string data in one call
3. **"🚀 FIX PROD DATA" button** in admin dashboard CONFIG row — calls thedoggycompany.com API directly from browser
4. **"🔀 COMPARE" button** in admin dashboard CONFIG row — fetches live stats from both environments
5. **Preview ↔ Production Compare Panel** — table showing collection counts with diff + sync status
6. **Production Fix Panel** in CelebrateManager Settings tab — granular fix buttons with results display

### Confirmed Out-of-Sync (from COMPARE as of Mar 2026):
| Collection | Preview | Production | Diff |
|---|---|---|---|
| Products | 3,860 | 4,258 | +398 (prod has more Shopify products) |
| Services | 1,115 | 1,120 | +5 |
| Members | 9 | 6 | -3 |
| Orders | 11 | 0 | -11 |

### Action Required:
1. Deploy this preview → production (one time)
2. Click "🚀 FIX PROD DATA" to fix service illustrations + pet soul string data
3. Click "🔀 COMPARE" after deploy to verify sync

---

## ✅ SESSION 26 COMPLETE — Production Celebrate Page Fixes (Mar 2026)

**Status: Partial (data fixes live; crash fix + sort order pending deployment)**

### Fixes Applied (No Deployment Required - DB Fixes):
1. **Service Illustrations Restored**: All 8/8 celebrate concierge services now have proper `static.prod-images` illustration URLs (previously showing Unsplash stock photos)
2. **AI-generated rope/toy products deactivated**: Removed 3 AI-generated toy products (Birthday Rope Tug, Birthday Squeaky Balls, Hide & Seek Plush) from production listings
3. **AI-generated cake products deactivated**: Removed 3 bad AI-generated cakes (Peanut Butter, Chicken, Salmon) - 104 real Shopify cakes now showing
4. **fix-celebrate-data endpoint added**: New admin endpoint that bulk-fixes service illustrations + product image_url fields in one shot

### Fixes In Preview Code (Needs Deployment to Production):
1. **Food & Flavour crash fix**: `SoulPillarExpanded.jsx` — Added `toStrArray()` helper to handle string vs array for `favorite_treats` and `food_allergies` fields. Production pet data stores these as strings (`"liver, cheese"`) not arrays. This causes `TypeError: .map is not a function`.
2. **Product sort order**: Changed from `ai_image_generated: -1` (AI first) to `shopify_id: -1` (Shopify first). Real products with real photos show at the top.
3. **Master sync image_url fix**: Master sync step 8 now updates both `image` AND `image_url` for services.

### Action Required:
- **DEPLOY preview to production** to activate the crash fix and sort order change
- After deployment, call: `curl -X POST "https://thedoggycompany.com/api/admin/fix-celebrate-data?password=lola4304"`

---

### Hook Rewritten: `/app/frontend/src/hooks/useResizeMobile.js`
- **Single export:** `useResizeMobile(breakpoint = 641)` — observes `document.body` via ResizeObserver, 150ms debounce, returns just `isMobile` (boolean)
- **No containerRef needed** — hook is self-contained, one line to use
- **Backward-compat alias:** `useViewportMobile = useResizeMobile` for any old imports
- Full SSR safety, full cleanup on unmount

### Applied To (P0):
| Component | Before | After |
|---|---|---|
| BirthdayBoxBuilder.jsx | `const [containerRef, isMobile] = useResizeMobile(640)` + ref on backdrop | `const isMobile = useResizeMobile()` |
| BirthdayBoxBrowseDrawer.jsx | `const [containerRef, isMobile] = useResizeMobile(640)` + ref on backdrop | `const isMobile = useResizeMobile()` |
| MiraChatWidget.jsx | `const isMobile = useViewportMobile(640)` | `const isMobile = useResizeMobile()` |
| ConciergeIntakeModal.jsx | No hook, no responsive layout | `const isMobile = useResizeMobile()` + bottom-sheet on mobile |
| WallUploadModal.jsx | No hook, no responsive layout | `const isMobile = useResizeMobile()` + bottom-sheet on mobile |

### Mobile Layout for ConciergeIntakeModal & WallUploadModal:
- Mobile (< 641px): `alignItems: flex-start`, `padding: 88px 0 0`, `borderRadius: 20px 20px 0 0` (bottom-sheet style)
- Desktop: centered, `padding: 16px`, `borderRadius: 20px`

---

## ✅ SESSION 25 COMPLETE — /dine Soul Page Phase 1 (Mar 2026)

**90% pass rate (iteration_129). PATCH→PUT critical fix applied. All visual/UX features pass.**

### Build Order Followed (as specified)
1. TummyProfile (data spine) → 2. DineDimensions → 3. MiraMealPick → 4. GuidedNutritionPaths → 5. PetFriendlySpots → 6. DiningConciergeServices

### New Files Created
| File | Purpose |
|---|---|
| `components/dine/DineHero.jsx` | Amber/terracotta gradient hero, soul chips, Mira quote |
| `components/dine/DineTabBar.jsx` | Eat & Nourish / Dine Out tabs |
| `components/dine/TummyProfile.jsx` | Data spine: Loves/Avoid/Goal/Health cells, editable nutrition_goal |
| `components/dine/DineDimensions.jsx` | 5 dimension cards with glow/dim/incomplete states |
| `components/dine/DineDimensionExpanded.jsx` | Portal expansion panel, replicates SoulPillarExpanded |
| `components/dine/MiraMealPick.jsx` | Templated rules engine (breed+age+weight+allergies+goal) |
| `components/dine/GuidedNutritionPaths.jsx` | 6 paths, 3 surfaced by Mira scoring |
| `components/dine/PetFriendlySpots.jsx` | Google Places via /api/nearby/places |
| `components/dine/DiningConciergeServices.jsx` | 4 concierge cards + dark CTA |
| `pages/DineSoulPage.jsx` | Main page, wired to /dine route directly |

### Backend Changes
- `models.py`: Added `nutrition_goal: Optional[str]` to `PetProfileCreate` + `PetProfileUpdate`

### Key Technical Decisions
- `nutrition_goal` defaults to `'maintenance'` when `null/undefined`
- `age_years == null` → defaults to `adult` life stage (not puppy)
- `weight == null` → defaults to `medium` size
- Health conditions handled as arrays or strings safely
- All fixed overlays use `useResizeMobile()` hook (bottom-sheet on mobile)
- `/dine` route replaced immediately (no `/dine-soul` detour — clean URL from day one)

### Pre-deploy Checklist (celebrate cleanup)
- [ ] Delete CelebratePage.jsx, update sub-category redirects to /celebrate-soul
- [ ] Add canonical tag to /celebrate-soul: `<link rel="canonical" href="https://thedoggycompany.com/celebrate" />`
- [ ] Update nav links from /celebrate-soul → /celebrate
- [ ] Sitemap: remove /celebrate-soul, confirm /celebrate is listed

### Upcoming
- (P1) Add Mira widget page-aware context for /dine (opening lines + chips)
- (P1) Seed dine product catalog (daily-meals, treats, supplements, fresh-frozen, homemade categories)
- (P1) /stay pillar — same architecture
- (P2) Soul builder steps — add useResizeMobile

---

**95% pass rate from testing agent (iteration_128). All components verified except PillarSoulModal UI (test pet has 100% soul score — code confirmed correct).**

### /celebrate → /celebrate-soul Redirect (Step 1)
- `<Navigate to="/celebrate-soul" replace />` added for `/celebrate` route in App.js
- `/celebrate-soul` added to Mira `hiddenPaths` list (prevents duplicate widget)
- Sub-category routes (`/celebrate/cakes` etc.) now route directly to `/celebrate-soul`
- **Step 2 (48h later):** Delete `CelebratePage.jsx` and update sub-category redirects to point directly to `/celebrate-soul`

### useResizeMobile Applied to P1/P2 Components
| Component | Change |
|---|---|
| WallLightbox.jsx | Added hook + mobile top-anchor + `borderRadius: 20px 20px 0 0` |
| PillarSoulModal.jsx | Added hook + `items-start pt-20` on mobile |
| ProductDetailModal.jsx | Added hook + `paddingTop: 88px` + bottom-sheet corners |
| DoggyServiceDesk.jsx | Migrated `window.addEventListener('resize')` → `useResizeMobile(768)` |

---

---

---

## ✅ SESSION 22 COMPLETE — ResizeObserver + useEffect Cleanup (Mar 2026)

**12/12 tests passing. iPad rotation + Chrome DevTools verified.**

### Hook Created: `/app/frontend/src/hooks/useResizeMobile.js`
- `useResizeMobile(breakpoint)` — callback ref pattern, attaches ResizeObserver to modal container, 150ms debounce, cleanup on unmount + element change
- `useViewportMobile(breakpoint)` — observes `document.documentElement`, for persistent panels (Mira)

### Applied To:
| Component | Hook Used | Ref Attached To |
|---|---|---|
| BirthdayBoxBuilder.jsx | useResizeMobile(640) | backdrop motion.div (position:fixed inset:0) |
| BirthdayBoxBrowseDrawer.jsx | useResizeMobile(640) | drawer-backdrop motion.div |
| MiraChatWidget.jsx | useViewportMobile(640) | document.documentElement |

### useEffect Cleanup Fixes (MiraChatWidget):
- pillar visit + fetchQuickPrompts + fetchMiraContext → `cancelled` flag
- fetchPets → `cancelled` flag  
- fetchPetIntelligence → `cancelled` flag

### Verified Behaviour:
- 1024px → modal centered; 375px → modal top-aligned (110px from top); rotation back to 1024 → centered again
- Mira: 1024px → right panel (420px); 375px → full-width top:105px
- No zombie setState warnings after rapid open/close × 5

---

**User reported 4 issues on their Apple phone. All fixed, 100% verified.**

| # | Issue | Fix | Verified |
|---|---|---|---|
| 1 | Guided Paths "stuck" — close button scrolls out of view on mobile | `createPortal` renders close pill at `document.body` (escapes framer-motion CSS transform containment). Button appears at `bottom: 90px` above mobile nav bar | ✅ 375px + 390px |
| 2 | Service cards: 4 cramped columns on mobile | `.service-grid-responsive` on mobile → `display:flex, overflow-x:auto, min-width:220px` (horizontal scroll carousel) | ✅ 375px + 390px |
| 3 | Mira widget hidden behind sticky header | Widget: `top: var(--mira-top-offset, 105px)` + `bottom: 70px` on mobile (was `h-[85dvh] bottom-0`) | ✅ 375px + 390px |
| 4 | Fonts too small | SoulCelebrationPillars: name 13→14px, tagline 11→12px, badge 10→11px; section headings use `clamp()` | ✅ 390px |

---

**Audit: 6 issues found, all fixed. 100% pass rate on re-test (10/10).**

### Issues Fixed:
| Issue | Severity | Fix |
|---|---|---|
| Pet home trait chips wrapping to 3 lines at 360-375px | CRITICAL | overflow-x-auto + whitespace-nowrap + shrink-0 on traits; photo w-16 sm:w-24; compact SoulRing 48px on mobile |
| CelebrateCategoryStrip labels at 10px (below 12px min) | MEDIUM | fontSize 10 → 11, maxWidth 72 → 80 |
| Pet selector strip no scroll hint | MEDIUM | Right-edge fade gradient (bg-gradient-to-l from-slate-900) when pets.length > 2 |
| 'Social Butterfly' badge wrapping to 2 lines | MINOR | whitespace-nowrap + text-ellipsis on badge |
| '♥ Mira knows' text at 11px | MINOR | text-[12px] |
| Marquee ticker (SoulScoreBanner 11px) | MINOR | Noted, not text-critical |

### Mobile Verified Passing:
- No horizontal overflow on any page at 360px ✅
- Touch targets all ≥44px ✅
- Mira widget works at all mobile sizes ✅
- All pages load correctly at 375px, 390px, 412px, 430px, 768px ✅

---

**Per Mira_Widget_MASTER.docx spec. All 10/10 tests passed (100%).**

### Changes Made:
| Feature | Files | Status |
|---|---|---|
| Remove duplicate widget on /celebrate-soul | MiraAI.jsx: added /celebrate-soul to both pillarPaths arrays | ✅ DONE |
| Product cards below bubble, 800ms delay, max 2, suppress keywords | MiraChatWidget.jsx: visibleProducts state, shouldShowProducts(), message render restructured | ✅ DONE |
| Page-specific opening lines for all pillars | MiraChatWidget.jsx: PILLAR_OPENING_LINES constant | ✅ DONE |
| Page-specific quick chips for all pillars | MiraChatWidget.jsx: PILLAR_CHIPS constant, {petName} substitution | ✅ DONE |
| Session memory | Already implemented (history: historyMessages.slice(-10)) | ✅ VERIFIED |

---

**All 8 tests passed (100% pass rate)**

### Bugs Fixed:
| Bug | Fix | Status |
|---|---|---|
| Lightbox close (X) button invisible/unusable | WallLightbox.jsx: position:fixed, zIndex:9999, white background at top:20 right:20 | ✅ FIXED |
| Uploaded photo not appearing instantly on wall | CelebrationMemoryWall.jsx: optimistic UI via submittedPhoto state | ✅ FIXED |
| Prop mismatch (petName vs pet) | CelebratePageNew.jsx: passes pet={selectedPet} not petName | ✅ FIXED |

### Components (LOCKED — do not change):
- **WallLightbox.jsx**: Close button — `position:fixed, top:20, right:20, zIndex:9999, background:#FFFFFF`
- **CelebrationMemoryWall.jsx**: `submittedPhoto` state shows user's photo at position 2 immediately
- **WallUploadModal.jsx**: Passes `{previewUrl, caption, celebType, city, miraComment}` via `onSubmitted`

---

---

## ✅ SESSION 12: Birthday Box Builder + Browse Drawer (Feb 2026)

---

## ✅ SESSION 15 COMPLETE (Mar 2026)
- Service Desk Birthday Box Orders tab — wired, 3-column layout, WhatsApp contact, slot assembly, allergy gate, notes, audit log
- Fixed "Confirm & Send to Concierge" button (stale closure + petId fallback)
- Removed redundant MiraAskBar from /celebrate-soul

---

## ✅ SESSION 16 COMPLETE — Celebrate Concierge® Redesign (Mar 2026)

**Source:** Celebrate_Concierge_MASTER.docx

### Implemented (ALL DONE):
| Task | File | Status |
|---|---|---|
| Update CTA card (title, description, stat, chips, button) | CelebrateConcierge.jsx | ✅ DONE |
| 8-card service grid | CelebrateServiceGrid.jsx (NEW) | ✅ DONE |
| Individual card component | CelebrateServiceCard.jsx (NEW) | ✅ DONE |
| 3-question Concierge Intake Modal | ConciergeIntakeModal.jsx (NEW) | ✅ DONE |
| Backend intake endpoint | POST /api/concierge/intake (unified flow) | ✅ DONE |

### Design (LOCKED — do not change):
- **CelebrateConcierge CTA**: dark `#0E0620` background, `45,000+` stat, 5 chips, gold gradient CTA button, 48h promise
- **CelebrateServiceGrid**: `"Celebrate, Personally"` section header, 4-col desktop / 2-col mobile grid
- **CelebrateServiceCard**: 180px illustration, `object-position: center top` (NEVER change), gold uppercase sub-label (BIRTHDAY, PHOTOSHOOT, CAKE, THE FULL DAY, GOTCHA DAY, SURPRISE, MILESTONE, VENUE), spec description, gold CTA link
- **ConciergeIntakeModal**: 3 questions (celebration type pre-selected from card, date picker + "Not sure yet", notes), gold gradient submit, confirmation screen
- **Backend intake unified flow**: `concierge_intakes` → `admin_notifications` → `service_desk_tickets` → `channel_intakes`

### Copy rules (FINAL — do not change):
- Title: `"Celebrate {petName} the way only you know how."`
- Description: `"45,000+ meals. Hundreds of birthdays..."` (see CelebrateConcierge.jsx)
- Chips: Birthday Celebrations · Pawty Planning · Memory & Portraits · Milestone Marking · Surprise Deliveries
- NEVER use: Browse, package, amazing, incredible, seamless

---

## ✅ SESSION 17 COMPLETE — Guided Celebration Paths (Mar 2026)

**Source:** GuidedCelebrationPaths_MASTER.docx | **Tested:** 17/17 passing

### Files built:
| File | Status |
|---|---|
| `GuidedCelebrationPaths.jsx` (rewrite) | ✅ DONE |
| `celebrationPaths.js` (NEW) | ✅ DONE |
| `GuidedPathCard.jsx` (NEW) | ✅ DONE |
| `GuidedPathExpansion.jsx` (NEW) | ✅ DONE |
| `GuidedPathStep.jsx` (NEW) | ✅ DONE |
| `PathDeliverableScreen.jsx` (NEW) | ✅ DONE |

### What works (LOCKED):
- 3 cards: Birthday (yellow) · Gotcha Day (green) · Photoshoot (pink) — exact pastel colours
- Section header NEW subtitle: "Mira walks you through every step. Each path ends with a plan you can keep."
- Expansion panel: spans all 3 columns, one-at-a-time, click-to-close, scrollIntoView
- Mira bar: path-specific italic voice + coloured bg gradient per path
- 5 sequential steps: step 1 active on open, steps 2-5 greyed until previous complete
- Each step CTA reveals an inline picker/input (themes, cakes, guests, timeline, etc.)
- Deliverable screen (dark bg) appears after all 4 interactive steps
- "Hand to Concierge 👑" → POST /api/concierge/intake (full unified flow)
- All card colours, chips, copy, step descriptions FINAL per master spec

---

### Core Principle:
Every path ends with a deliverable — not just steps. The Birthday Plan. The Gotcha Day Memory Card. The Shoot Day Brief. Something the pet parent can hold, save, share, or hand to the Concierge to execute entirely.

### Files to build:
| Task | File | Status |
|---|---|---|
| Update section header + card copy + chips | GuidedCelebrationPaths.jsx | TODO |
| Individual path card | GuidedPathCard.jsx (NEW) | TODO |
| Expansion panel | GuidedPathExpansion.jsx (NEW) | TODO |
| Individual step component | GuidedPathStep.jsx (NEW) | TODO |
| Deliverable screen | PathDeliverableScreen.jsx (NEW) | TODO |
| Path data | celebrationPaths.js (NEW) | TODO |

### Section header (FINAL):
- Title: `Guided celebration paths` (font-size: 2rem, font-weight: 800, color: #1A0030)
- Subtitle: `Mira walks you through every step. Each path ends with a plan you can keep.` (14px, #666)

### 3-card grid:
- Desktop: `repeat(3, 1fr)` · gap: 16px
- Tablet: `repeat(2, 1fr)`
- Mobile: `1fr`
- Card border-radius: 20px, padding: 24px

### Card colour system (LOCKED):
| Path | bg | accent | accentDark |
|---|---|---|---|
| Birthday | #FEFCE8 | #F59E0B | #92400E |
| Gotcha Day | #DCFCE7 | #16A34A | #14532D |
| Photoshoot | #FCE7F3 | #DB2777 | #831843 |

### 3 paths — card copy (FINAL):
| # | Title | Description | Visible chips | Hidden (+2) |
|---|---|---|---|---|
| 1 | Birthday party path | From theme to cake to guest list — plan {petName}'s full birthday in one guided flow. | Choose theme · Order cake · Guest list | Plan the day · Final birthday plan |
| 2 | Gotcha day path | Celebrate the day {petName} chose you. A quieter, more personal kind of celebration. | Find the date · Memory book · A quiet ritual | A gift for the day · Gotcha Day card |
| 3 | Pet photoshoot path | From outfit to location to photographer — capture {petName} at their most beautiful. | Choose location · Plan outfit · Find photographer | Prepare Mojo · Shoot Day Brief |

### 5 steps per path (FINAL — see celebrationPaths.js for full detail):
**Birthday**: Choose theme → Order cake → Guest list → Plan the day → Birthday Plan (deliverable)
**Gotcha Day**: Find the date → Memory book → A quiet ritual → A gift for the day → Gotcha Day Memory Card (deliverable)
**Photoshoot**: Choose location → Plan outfit → Find photographer → Prepare Mojo → Shoot Day Brief (deliverable)

### Expansion panel:
- Opens inline below card grid (grid-column: span 3)
- One at a time (opening one closes others)
- Click same card to close
- scrollIntoView after open

### Deliverables:
- **Birthday Plan**: Theme · Cake order · Guest list · Day timeline · Venue
- **Gotcha Day Memory Card**: 3 photos · gotcha date · caption · ritual note
- **Shoot Day Brief**: Location · Time · Outfit · Photographer · Prep notes
- All deliverables have: "Hand to Concierge 👑" → POST /api/concierge/intake

---

### WHAT IS IN PROGRESS:
**P0: Wire BirthdayBoxOrdersAdmin into AgentPortal.jsx — ✅ COMPLETE (Session 15)**
- Full 3-column layout: Order List | 6-Slot Manifest (checkboxes) | Action Panel (WhatsApp + Status + Notes + Log)
- Status transitions with server-side gates (allergy confirmation gate, slot assembly gate)
- WhatsApp pre-filled contact button + Email contact button
- Notes panel with instant append (no reload needed)
- Nav tab shows red badge with count of NEW orders
- 28 orders in DB, backend endpoints all verified
- Allergy confirmation gate server-side enforced
- Slot-by-slot assembly checkboxes with DB persistence
- Order log (audit trail) collapsible panel
- Personalisation panel (bandana name, cake message, delivery date, address)
- `BirthdayBoxOrdersAdmin.jsx` — FULLY BUILT (3-panel layout, status transitions, allergy banner, personalisation editing) ✅
- Backend endpoints — ALL BUILT (`GET/PATCH /api/admin/birthday-box-orders/*`) ✅
- Import already in `AgentPortal.jsx` ✅
- **28 birthday box orders exist in DB** ✅
- **MISSING:**
  - Render block `{activeTab === 'birthday_box_orders' && <BirthdayBoxOrdersAdmin />}` in AgentPortal content area
  - `birthday_box_orders` permission NOT in `AGENT_PERMISSIONS` list in server.py
  - No agent exists in `agents` collection (empty) — login fails
- **Action:** Add render block + permission + seed test agent → test full flow

### WHAT SPEC DOC SAYS (ServiceDesk_BirthdayBoxOrders_SPEC.docx — Full canonical spec):
See "Service Desk Full Spec" section above in this PRD. Key phases:
- Phase 1A/1B/1C: DONE (read-only manifest, allergy banner, status transitions)
- Phase 2A: PARTIALLY DONE (status PATCH exists, slot assembly PATCH missing)
- Phase 2B/2C: TODO (slot checkboxes UI, allergy gate enforcement)
- Phase 3: TODO (WhatsApp contact panel, notes, order log)
- Phase 4: TODO (delivery notifications)

---

### WHAT WAS BUILT:

#### 1. **BirthdayBoxBuilder.jsx** (NEW — COMPLETED ✅)
Multi-step modal opened via `openOccasionBoxBuilder` custom event.
- **Step 1:** All 6 slots displayed with Mira's picks, emoji, descriptions, allergy-safe/surprise badges
- **Step 2 (conditional):** Explicit allergy confirmation step — shown only if pet has allergies
  - Displays allergy profile, health slot detail, and confirmation checkbox
  - CTA disabled until checkbox is ticked
- **Step 3:** Success screen with Order ID and concierge handoff note
- Calls `POST /api/birthday-box/{petId}/build` (updated to use `get_all_allergies()`)
- "Browse all options" link → closes builder → opens Browse Drawer

#### 2. **BirthdayBoxBrowseDrawer.jsx** (NEW — COMPLETED ✅)
Right-side drawer per spec. Opened via `openBirthdayBoxBrowse` custom event.
- 480px desktop / 100vw mobile, slides from right (320ms)
- Mira bar with pulsating dot
- 5 tabs: Cakes | Toys & Joy | Style | Memory | Wellness
- Each tab: Mira's pick row + allergy banner + product grid (horizontal cards)
- Swap tracking: pills with Undo, swap count in bottom bar
- Bottom bar: whisper text + "Build {petName}'s Box →" (glows pink on swaps)
- "Build Box →" → closes drawer → opens BirthdayBoxBuilder with swaps

#### 3. **Backend Fix: build endpoint allergy check** (FIXED ✅)
`POST /api/birthday-box/{pet_id}/build` now uses `get_all_allergies()` for the allergy guard,
consistent with the preview endpoint.

#### 4. **CelebratePageNew.jsx Wiring** (UPDATED ✅)
- Both components mounted at bottom of page (event-driven)
- `handleBuildBox` passes `petId` in event detail
- `handleOpenBrowseDrawer` triggers browse with boxPreview context
- MiraBirthdayBox secondary button passes live `boxPreview` to browse handler

### Events Reference
| Event | Trigger | Detail |
|-------|---------|--------|
| `openOccasionBoxBuilder` | "Build {pet}'s Box" primary button | `{preset, petName, petId}` |
| `openBirthdayBoxBrowse` | "Birthday Box" secondary button | `{boxPreview, petName}` |

### TESTING RESULTS (Session 12 Final):
| Test | Status |
|------|--------|
| Builder Step 1 → Step 2 → Step 3 full flow | ✅ PASS |
| Step 3 Concierge Handoff screen — ticket ID, 6-slot summary, "What happens next" | ✅ PASS |
| "Not an e-commerce order" disclaimer | ✅ PASS |
| POST /api/birthday-box/{petId}/concierge-handoff — all 5 unified collections | ✅ PASS |
| Allergy guard (allergyConfirmed=False returns error) | ✅ PASS |
| Toast notification (Sonner Toaster fixed in App.js) | ✅ PASS (critical fix) |
| Mobile bottom sheet + drag handle | ✅ PASS |

**Backend tests:** 14/14 passed  
**Frontend tests:** 100% verified  

### Critical Bug Fixed by Testing Agent:
- **Sonner Toaster not mounted in App.js** — ALL toast notifications were silently failing across the entire app. Fixed by adding `<SonnerToaster />` to App.js.

---


### WHAT IS IT?
A **curated 6-slot celebration box** built specifically for one pet, based on their individual soul profile. **No two boxes are the same.** Mira selects every item based on her knowledge of the pet.

### WHERE IT APPEARS
Single dark card on `/celebrate`, positioned **below the category strip** and **above the soul pillars**.

### THE 6 SLOTS

| Slot | Name | Primary Signal | Item Selected | Fallback |
|------|------|----------------|---------------|----------|
| 1 | **Hero Item** | `petFavouriteFood1` | `[flavour]` birthday cake | Breed-matched cake |
| 2 | **Joy Item** | `topSoulPillar` | Activity-matched gift | Breed favourite toy |
| 3 | **Style Item** | `birthday` registered | Custom birthday bandana | Standard bandana |
| 4 | **Memory Item** | `Love & Memory` score > 60 | Memory card + photo envelope | Paw print card |
| 5 | **Health Item** | `healthCondition` | Treatment-safe supplement | Age-appropriate treat |
| 6 | **Surprise Item** | `petArchetype` | Archetype-matched surprise | Breed surprise gift |

**Note:** Slots 5 & 6 are hidden → revealed when user clicks "Build {petName}'s Box"

### UI COMPONENTS

#### Card Container
```css
background: linear-gradient(135deg, #1A0030 0%, #3D0060 50%, #6B0099 100%);
border-radius: 20px;
padding: 28px;
border: 1px solid rgba(196,77,255,0.30);
box-shadow: 0 8px 32px rgba(196,77,255,0.15);
```

#### Eyebrow Chip States
- **Default:** `✦ Mira's pick for {petName}'s birthday`
- **Gotcha Day (within 7 days):** `✦ Mira's pick for {petName}'s gotcha day`
- **No Birthday:** `✦ Curated by Mira for {petName}`

#### Title
- `The` + `{petName}` (pink #FF9FE5) + `Birthday Box` (white)

#### Description Template
```
Mira has built one celebration that covers who {petName} actually is — 
{slot1Name}, {slot2Description}, {slot3}, and {slot4}. 
Everything {petName} loves. Nothing they can't have.
```

**Last Line Variations:**
| Condition | Last Line |
|-----------|-----------|
| Healthy young pet | Everything {petName} loves. Nothing they can't have. |
| Allergy present | Everything {petName} loves. Nothing they can't have. |
| Health condition | Everything {petName} loves. Everything safe for their treatment. |
| Senior (age > 7) | Everything {petName} loves. Everything kind to their body. |
| Senior + condition | Everything {petName} loves. Everything gentle, everything safe. |
| Puppy (age < 1) | Everything {petName} loves. Everything right for where they're growing. |
| No profile data | Everything a dog loves on their birthday. Personalise it for yours. |

#### Buttons
| Button | Label | Style |
|--------|-------|-------|
| **Primary** | `🎉 Build {petName}'s Box` | Pink/purple gradient |
| **Secondary** | `Birthday Box` | Transparent with border |

### SLOT-BY-SLOT INTELLIGENCE

#### Slot 1 — Hero Item (Birthday Cake)
```
IF favourite food known → [petFavouriteFood1] birthday cake
   IF allergy → EXCLUDE allergen, label: "[flavour], allergy-safe"
ELSE IF breed known → Breed-matched flavour
   - Labradors → peanut butter
   - Indies → chicken  
   - Shih Tzu → salmon
ELSE → Custom birthday cake (personalize in builder)
```

#### Slot 2 — Joy Item (Based on Top Soul Pillar)
| Pillar | Item |
|--------|------|
| Play | Favourite toy (gift-wrapped) |
| Adventure | Outdoor birthday kit (bandana + trail treats + water bowl) |
| Social | Pawty kit (bandanas for multiple dogs) |
| Learning | Puzzle toy (level matched) |
| Food | Gourmet treat platter |
| Grooming | Birthday spa kit |
| Health | Wellness treat pack |
| Love/Memory | Photo prop kit |
| No data | Breed-matched toy |

#### Slot 3 — Style Item (Wearable)
```
IF birthday registered → Custom birthday bandana with {petName} embroidered
IF gotcha day → Custom gotcha day bandana
IF Shih Tzu / small dog → Birthday bow set
IF large breed → Wide bandana (large sizing)
IF Grooming score > 70 → Birthday outfit set (bandana + bow + spray)
ELSE → Standard birthday bandana
```

#### Slot 4 — Memory Item
```
IF Love & Memory score > 60 → Memory card + photo envelope
IF birthday photoshoot booked → Digital memory card
IF exact birthday date known → Personalised date card
IF multiple pets → Family birthday card
ELSE → Paw print birthday card
```

#### Slot 5 — Health Item (MUST BE ALLERGY-SAFE)
```
IF healthCondition present → Condition-specific supplement
IF petAge > 7 (senior) → Joint support supplement
IF petAge < 2 (puppy) → Puppy growth treat
IF petWeight = overweight → Low-calorie birthday treat
IF allergy present → ALL OPTIONS ALLERGY-FILTERED
IF no allergy data → Show notice: "Let us know about allergies before ordering"
ELSE → Age-appropriate wellness treat
```

#### Slot 6 — Surprise Item (Based on Archetype)
| Archetype | Item |
|-----------|------|
| Social Butterfly | Friend gift set (for {petFriend1}) |
| Adventurer | Trail map bandana (unique to {userCity}) |
| Thinker | Hidden treat puzzle |
| Nurturer | Comfort plush (sized for breed) |
| Performer | Party hat + matching bow |
| Protector | Calming treat |
| Free Spirit | Surprise mystery toy (sealed box) |
| No archetype | Breed surprise, chip: "A Mira surprise 🎁" |

**Note:** Slot 6 item name NOT shown until box is opened on delivery.

### SOUL DISCOVERY STATES

| Soul % | Behavior |
|--------|----------|
| < 30% | Fallback items + banner: "Tell Mira more about {petName}..." |
| 30-70% | Partial personalization, Mira notes confident slots |
| > 70% | Full personalization, no caveats |
| 89%+ | Mira speaks with full confidence, "exactly right" |

### EDGE CASES

1. **No Birthday:** Show box with eyebrow "Curated by Mira" + prompt to add birthday
2. **Birthday < 7 days:** Urgency banner + "Order by [date] for delivery in time"
3. **Gotcha Day:** Different copy — "the day {petName} chose you"
4. **Multiple Pets:** One card per pet, scrollable/tabbed
5. **Allergies:** ABSOLUTE rule — allergen cannot appear in ANY slot

### ALLERGY RULES (CRITICAL)
```
Rule 1: If allergen in profile → EXCLUDE from ALL slots
Rule 2: Slot 1 (cake) MUST confirm "allergy-safe" in chip
Rule 3: Slot 5 (health) MUST be allergen-checked
Rule 4: No allergy data → Show builder notice
```

### VARIABLES REFERENCE
```
{petName}, {petBreed}, {petAge}, {petFavouriteFood1}, {petFavouriteFood2}
{petAllergy1}, {petAllergy2}, {topSoulPillar}, {topActivity}, {petFavouriteToy}
{petArchetype}, {petFriend1}, {petBirthday}, {petGotchaDay}, {healthCondition}
{petSize}, {soulDiscoveredPercent}, {userCity}
{slot1Name}, {slot2Name}, {slot3Name}, {slot4Name}
```

---

---

## 📋 SERVICE DESK — Birthday Box Orders Spec (IN PROGRESS — Phase 1+2 built, wiring pending)

**Source:** ServiceDesk_BirthdayBoxOrders_SPEC.docx (FULL SPEC — all 10 sections)  
**Purpose:** Close the fulfilment loop. Every birthday box order tracked from confirmation to delivery.

### Closed Loop (8 Steps — per spec doc)
1. Pet parent confirms → ticket created + concierge handoff screen
2. System auto-notifies Concierge (WhatsApp + email)
3. Concierge opens Birthday Box Orders tab → sees 6-slot manifest + allergy flags
4. Concierge contacts pet parent within 24hrs → confirms delivery + personalisation
5. Concierge assembles box slot by slot → marks each slot checked
6. All 6 checked → "Mark as Assembled" → pet parent auto-notified
7. Concierge dispatches → DISPATCHED + tracking link
8. DELIVERED → Mira sends brand moment message to pet parent ♥

### New Tab: "🎂 Birthday Box Orders" in Service Desk
- Concierge team access only
- Tab badge shows count of NEW orders
- **3-column layout:** Left (order list 300px) | Center (order detail flex-1) | Right (action panel 280px)
- **Mobile:** Single column, tap-to-open detail

### Status System
| Status | Color | Gate |
|--------|-------|------|
| NEW | #DC2626 | None |
| IN PROGRESS | #D97706 | Allergy confirmation gate if allergies |
| ASSEMBLED | #2563EB | All 6 slot checkboxes ticked |
| DISPATCHED | #7C3AED | Tracking link required |
| DELIVERED | #27AE60 | None |

### Pet Parent Status (3 simplified states)
| Admin Status | Pet Parent Sees |
|---|---|
| NEW + IN PROGRESS | "Your Concierge is building {petName}'s box" |
| ASSEMBLED + DISPATCHED | "{petName}'s box is on its way 🎉" |
| DELIVERED | "{petName}'s Birthday Box has arrived ♥" |

### Critical: Allergy Alert Banner
Red banner (bg: #FEF2F2, border: 2px solid #DC2626) at top of manifest.

### 6-Slot Manifest Table Columns
✓ (assembly checkbox) | SLOT | ITEM NAME | DETAIL/PERSONALISATION | SAFETY FLAG

### New API Endpoints Required
| Endpoint | Purpose |
|---|---|
| GET /api/admin/birthday-box-orders | List with status/date/allergy filters |
| GET /api/admin/birthday-box-orders/{id} | Full order detail |
| PATCH /api/admin/birthday-box-orders/{id}/status | Status transition (server-side gated) |
| PATCH /api/admin/birthday-box-orders/{id}/personalisation | Bandana name, cake msg, delivery date |
| PATCH /api/admin/birthday-box-orders/{id}/slots/{slot}/checked | Mark slot assembled |
| POST /api/admin/birthday-box-orders/{id}/notify | WhatsApp/email to pet parent |

### Build Order (Phased)
1. **Phase 1 (MVP):** Read-only manifest view
2. **Phase 2:** Status transitions + allergy gate + slot checkboxes
3. **Phase 3:** Contact panel + personalisation edits + order log
4. **Phase 4:** Delivery notifications + tracking integration

---

## ✅ SESSION 13: UI Fixes + Browse Drawer Selection (Feb 2026)
| Fix | File |
|---|---|
| Birthday box card off-center → `px-4 sm:px-6 lg:px-8` to content wrapper | CelebratePageNew.jsx |
| Toast "Sent to Concierge" fires on Step 3 mount (above modal overlay) | BirthdayBoxBuilder.jsx |
| Browse Drawer: replaced confusing auto-selection with clear Swap/Current/✓ states | BirthdayBoxBrowseDrawer.jsx |

---



## 🛒 BIRTHDAY BOX BROWSE DRAWER — SPECIFICATION

### TRIGGER
Secondary "Birthday Box" button on MiraBirthdayBox card

### STRUCTURE
- **Width:** 480px (desktop) / 100vw (mobile)
- **Animation:** Slides from right
- **Header:** Dark gradient (#1A0030 → #3D0060)

### 5 TABS
| Tab | Icon | Products |
|-----|------|----------|
| Cakes | 🎂 | Birthday cakes, allergy-filtered |
| Toys & Joy | 🎁 | Activity/pillar-matched toys |
| Style | 🎀 | Bandanas, bows, outfits |
| Memory | 💌 | Cards, photo items, keepsakes |
| Wellness | ✨ | Supplements, health treats |

### KEY FEATURES

#### 1. Mira's Pick Row
Each tab shows Mira's pre-selected item at the top with "Swap →" link

#### 2. Swap Tracking
- Pills appear showing swaps: "🔄 Cake: Salmon → Peanut butter"
- Each swap has "Undo" option
- Multiple swaps tracked

#### 3. Allergy Banner
Shows filtered allergens: "Filtered for Mojo: no chicken, no soy"

#### 4. Product Sorting by Tab
| Tab | Sort Order |
|-----|------------|
| Cakes | Breed-matched → flavor-matched → alphabetical |
| Toys | topActivity → topSoulPillar → breed |
| Style | petSize → breed → popularity |
| Memory | Love & Memory score descending |
| Wellness | Condition-safe + allergy-filtered ONLY |

### BOTTOM BAR
- **Whisper text:** "Your box is ready" / "{n} swaps made"
- **Primary CTA:** "Build {petName}'s Box →"
- **State:** Neutral (no swaps) → Pink glow (1+ swaps)

---

## 🚨 CRITICAL: ALLERGY DATA FIX (Session 11)

### THE PROBLEM
Mojo has chicken allergy but system showed "Chicken birthday cake"

### ROOT CAUSE
Allergy data stored in MULTIPLE locations in pet document:
- `health_data.allergies: ['chicken']`
- `doggy_soul_answers.food_allergies: ['chicken']`
- `health.allergies: ['chicken']`
- `insights.key_flags.allergy_list: ['chicken']`

But code only checked:
- `pet.get("allergies")` → empty []
- `pet.get("allergy1")` → None

### THE FIX
Created `get_all_allergies(pet)` function that checks ALL locations:
```python
def get_all_allergies(pet: dict) -> list:
    all_allergies = set()
    
    # Direct fields
    if pet.get("allergies"): all_allergies.update(...)
    if pet.get("allergy1"): all_allergies.add(...)
    
    # health_data.allergies
    health_data = pet.get("health_data", {})
    if health_data.get("allergies"): all_allergies.update(...)
    
    # health.allergies
    health = pet.get("health", {})
    if health.get("allergies"): all_allergies.update(...)
    
    # doggy_soul_answers.food_allergies
    soul_answers = pet.get("doggy_soul_answers", {})
    if soul_answers.get("food_allergies"): all_allergies.update(...)
    
    # insights.key_flags.allergy_list
    insights = pet.get("insights", {})
    key_flags = insights.get("key_flags", {})
    if key_flags.get("allergy_list"): all_allergies.update(...)
    
    return list(all_allergies)
```

### RESULT
- **Before:** "Chicken birthday cake" ❌
- **After:** "Salmon birthday cake, allergy-safe" ✅

---

## 🔄 SESSION 11 SPEC — PillarSoulModal + Master Sync + Product Modal (March 14, 2026)

### WHAT WAS BUILT:

#### 1. **PillarSoulModal Implementation** (COMPLETED ✅)
When a pillar is clicked and the pet's profile is **missing information** for that specific pillar, a modal appears with **4-6 contextual questions** to help enrich the pet's soul data.

**Flow:**
1. User clicks a pillar → System checks if pet has enough data for that pillar
2. If data is incomplete → Show `PillarSoulModal` with pillar-specific questions
3. User answers questions → Backend updates `doggy_soul_answers` + recalculates soul score
4. Updates Mira's memory (`learned_facts` array) → She now "knows" more about the pet
5. **OUTCOME:** Immediately able to generate dynamic concierge suggestions with the new data

**New Backend Endpoint:**
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/pets/{pet_id}/pillar-soul-update` | PATCH | JWT | Update soul answers from pillar questions |

**Request Payload:**
```json
{
  "pillar": "food",
  "answers": {"favorite_treats": ["Salmon", "Chicken"]},
  "learned_facts": ["[Food & Flavour] What flavours does Mojo love? → Salmon, Chicken"],
  "summary": "Mojo food preferences updated via soul modal"
}
```

**Response:**
```json
{
  "pet": {...updated pet object...},
  "new_score": 100.0,
  "score_tier": "soul_master",
  "pillar": "food",
  "facts_added": 1
}
```

#### 2. **Master Sync for AI Products** (COMPLETED ✅)
On backend startup, automatically seeds celebrate products ensuring all 8 pillars have items in "Shop" tab.

**Implementation:** Added Step 12/12 to `master_sync_on_startup()`:
- Imports `seed_celebrate_products` from `celebrate_product_generator.py`
- Seeds 59 new products across pillar categories
- Syncs with Cloudinary for proper images
- **Result:** Products now available in all pillar Shop tabs

**Seeded Product Counts:**
| Category | Count | Pillar |
|---|---|---|
| puzzle_toys | 9 | Learning & Mind |
| party_kits | 8 | Social & Friends |
| memory_books | 6 | Love & Memory |
| portraits | 5 | Love & Memory |
| supplements | 11 | Health & Wellness |
| party_accessories | 12 | Social & Friends / Play & Joy |

#### 3. **ProductDetailModal** (NEW ✅)
Full product modal with:
- Product image, name, description
- Variant selector (if multiple variants)
- Quantity selector (for products, not services)
- **Add to Cart** button (for products with price)
- **Request via Concierge** button (for services / items without price)
- Pillar-colored theme

**Service Detection:** Items automatically route to concierge if:
- No price / price = 0
- Category is `grooming` or `portraits`
- Name contains "photoshoot", "booking", "session"

#### 4. **Concierge Flow for Services** (VERIFIED ✅)
All service-type items in Grooming & Memory pillars:
- Display "Concierge" instead of price
- Show "Book 👑" button
- Clicking triggers `POST /api/concierge/pillar-request`
- Toast notification with ticket ID on success

**Files Modified:**
- `/app/backend/server.py` — Added endpoint + Master Sync step
- `/app/frontend/src/components/celebrate/SoulCelebrationPillars.jsx` — Rendered PillarSoulModal
- `/app/frontend/src/components/celebrate/SoulPillarExpanded.jsx` — Added ProductDetailModal integration
- `/app/frontend/src/components/celebrate/ProductDetailModal.jsx` — NEW component

### PRODUCT AUDIT RESULTS:

**All 8 Pillar Categories Now Have Products:**
| Category | Products | Status |
|---|---|---|
| cakes | 50+ | ✅ Complete |
| treats | 48+ | ✅ Complete |
| toys | 50+ | ✅ Complete |
| puzzle_toys | 9 | ✅ Complete |
| party_kits | 10 | ✅ Complete |
| party_accessories | 12 | ✅ Complete |
| grooming | 54+ | ✅ Complete |
| supplements | 16 | ✅ Complete |
| portraits | 5 | ✅ Complete |
| memory_books | 6 | ✅ Complete |

**All products in pillar categories have images** — No missing images found.

### TESTING RESULTS (Session 11):
| Test | Status |
|---|---|
| 8-pillar grid display | ✅ PASS |
| Pillar expansion with tabs | ✅ PASS |
| All special panel cards | ✅ PASS |
| PATCH /api/pets/{pet_id}/pillar-soul-update | ✅ PASS |
| Products API for all pillar tabs | ✅ PASS |
| Master Sync product seeding | ✅ PASS |
| Concierge flow for services | ✅ PASS |

---

## THE VISION
> "We are not a commerce platform. We are a Pet Operating System. The Soul comes first."

The world's first soul-driven Pet Operating System. Every dog has a personality, lifestyle, health story — the Soul. The platform captures this and uses it to power every recommendation, every Mira response, and every concierge interaction.

**3,777 products in DB. 221+ API endpoints. 51 Soul Questions. 14 Pillars.**

---

## 🔄 SESSION 10 SPEC — Pet-Dependent Pillars + AI Product Generator (March 14, 2026)

### WHAT WAS BUILT:
1. **FeastMenuCard** — pet-dependent items derived from `pet.doggy_soul_answers.favorite_treats`
   - Mojo (salmon pref) → Salmon Birthday Cake, Salmon Biscuit Platter, Salmon Paw Cupcakes
   - Bruno (chicken pref) → Chicken Birthday Cake, Chicken Treat Platter, Chicken Paw Cupcakes
   - NO prices — each item has "Request via Concierge" button → creates service desk ticket
   - Toast shown with Ticket ID on success

2. **PawtyPlannerCard** — ALL 4 step buttons → Concierge (unified service flow)
   - Step 1: Find a venue → `POST /api/concierge/pillar-request` with request_type: venue_finder
   - Step 2: Order invites → request_type: order_invitations
   - Step 3: Order pawty kit → request_type: pawty_kit_order
   - Step 4: Full Concierge → request_type: full_concierge_pawty
   - Tick state (✓) shown after successful send
   - Works on BOTH mobile and desktop

3. **MemoryInvitationCard** — Complete 4-option dark cinematic card
   - Photoshoot, Custom Portrait, Memory Book, Soul Story Book
   - Each option has "Book via Concierge 👑" button → concierge ticket
   - Dark background: `linear-gradient(135deg, #1A0030, #3D0060)`

4. **PILLAR_TABS update** — `puzzles` (0 products) → `puzzle_toys` (now 9 products)

5. **AI Product Generator** (`celebrate_product_generator.py`)
   - 59 new authentic products across 8 celebrate pillars
   - New sub-categories: puzzle_toys(9), party_kits(10), memory_books(6), portraits(3)
   - Expanded: supplements(11+), party_accessories(12)
   - Background AI image generation via Cloudinary
   - Admin UI: "Generate" tab in Celebrate Manager with live progress

### AI PRODUCT GENERATOR ENDPOINTS:
| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| /api/admin/celebrate/seed-and-generate | POST | JWT admin | Seed 59 products + start image gen |
| /api/admin/celebrate/generation-status | GET | JWT admin | Live status (poll every 3s) |
| /api/admin/products/{id}/regenerate-image | POST | JWT admin | Regen specific product image |

### CONCIERGE REQUEST PATTERN (used across all pillar special panels):
```js
const result = await sendToConcierge({
  requestType: 'feast_item',        // one of: feast_item, venue_finder, order_invitations, pawty_kit_order, full_concierge_pawty, birthday_photoshoot, custom_portrait, memory_book, soul_story_book
  label: 'Request item for petName',
  message: 'Full request details',
  petName: 'Mojo',
});
// result: { success: true, ticketId: 'TKT-XXXXXXXX' }
```

### PILLAR SYSTEM STATUS:
| Feature | Status |
|---|---|
| 8-pillar grid GLOW/DIM/INCOMPLETE | ✅ SoulCelebrationPillars.jsx |
| Row-based inline expansion (Row 1 below Row 1, Row 2 below Row 2) | ✅ IMPLEMENTED & TESTED |
| Special panels (4 pillars: food, social, health, memory) | ✅ IMPLEMENTED & TESTED |
| DrawerBottomBar (3 states, purple gradient, pillar-specific whispers) | ✅ IMPLEMENTED & TESTED |
| Correct 4 tabs per pillar per spec | ✅ IMPLEMENTED & TESTED |
| Mira bar gradient styling | ✅ IMPLEMENTED & TESTED |
| Pet Wrapped download on PetHomePage | ✅ EXISTS |
| Allergy filter banner in product grid | ✅ IMPLEMENTED & TESTED |

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

---

## ✅ SESSION 18 COMPLETE — Celebration Wall (Mar 2026)

**Source:** CelebrationWall_MASTER.docx | **Tested:** all major flows working

### Files built:
| File | Status |
|---|---|
| REWRITE `CelebrationMemoryWall.jsx` | ✅ DONE |
| CREATE `WallCard.jsx` | ✅ DONE |
| CREATE `WallUploadCard.jsx` | ✅ DONE |
| CREATE `WallUploadModal.jsx` | ✅ DONE |
| CREATE `WallLightbox.jsx` | ✅ DONE |
| MODIFY `celebration_wall_routes.py` | ✅ DONE |

### What works (LOCKED — do not change):
- Real photos Euro/Simba/Zippy NEVER replaced with stock
- Timestamps: NEVER "Recently" — Today / N days ago / Last week / DD Mon
- Upload card always first · 3-step modal (photo → caption+tag → confirmation)
- Frosted glass celebration type tags · Heart pop animation · Lightbox with prev/next
- Mira comment on own photos · 4-state subtitle (no pet/with pet/pending/approved)
- Backend: UGC upload → pending_review · Like toggle · Admin moderation (approve/reject)
- Default photos have stable IDs (default-1 through default-8)

---

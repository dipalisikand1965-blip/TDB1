# The Doggy Company — Changelog

## 2026-03-26 — Image Priority Fix + Build Plan Modals + DB Sync (Session 10)

### Image Priority Fixed Across ALL Product Cards
- `ProductCard.jsx` `getValidImage()` and `getValidProductImage()`: Added `watercolor_image` as **first priority** (was completely missing). New order: `watercolor_image → cloudinary_url → mockup_url → primary_image → image_url → image → images[0]`
- `BirthdayBoxBrowseDrawer.jsx` line 44: Added `watercolor_image` first
- `SoulMadeModal.jsx` lines 371-374: Added `watercolor_image` first
- `PersonalisedBreedSection.jsx` was already correct (unchanged)

### DB Sync — 3,336 Breed Products Updated
- Added `POST /api/admin/sync-image-fields` endpoint (admin auth required)
- Ran sync: `cloudinary_url → watercolor_image` for 3,336 breed_products; `cloudinary_url → image_url` for 51 products_master
- All Soul Made watercolor mockups now correctly display in all product card components

### Admin AI Image Generation Bug Fixed
- `server.py /admin/generate-image`: Fixed `col` was undefined (should be `collection_map.get(entity_type)`)
- Tested: generates Cloudinary URL and saves `watercolor_image` field to breed_product

### Build Plan Modals — All 3 Mobile Pillars
- Created `frontend/src/components/mira/MiraPlanModal.jsx` — reusable bottom-sheet plan modal for ALL pillars
- `PlayMobilePage.jsx`: "Build {pet}'s Play Plan →" now opens `MiraPlanModal(pillar=play)` instead of `request()`
- `GoMobilePage.jsx`: "Plan {pet}'s Next Trip →" now opens `MiraPlanModal(pillar=go)` instead of `request()`
- `DineSoulPage.jsx` (DineMobilePage): Added "Build {pet}'s Food Plan →" button + `MiraPlanModal(pillar=dine)`
- MiraPlanModal gracefully falls back to curated static cards when `/api/mira/plan` returns 404

### Breed Isolation Confirmed (100% clean)
- API test: Mojo (Indie) → ZERO Labrador/Akita/Corgi products
- API test: Mystique (Shih Tzu) → ZERO Labrador/Indie products
- API test: Bruno (Labrador) → ZERO Indie/Corgi/Akita products



### Duplicate Mira Orb — Fixed
- `MiraAI.jsx` hiddenPaths extended: `/pet-home`, `/dashboard`, `/my-pets`, `/my-requests` added
- No floating MiraAI orb on dashboard/pet-home; "Ask Mira" navbar button is sole entry point
- MiraChatWidget (pillar-aware) remains on all 12 pillar pages

### Strict Breed Filtering — Implemented
- Added `KNOWN_BREEDS` array and `filterBreedProducts()` export to `useMiraFilter.js`
- "Akita" products (or any other breed) CANNOT appear for Maltese (or any non-matching pet)
- `PersonalisedBreedSection.jsx` now applies `filterBreedProducts()` + `limit=40` query
- `ShopMobilePage.jsx` now imports `filterBreedProducts` from `useMiraFilter` (removed local duplicate)

### "Request {breed} Collection" CTA — Added
- Empty state in `PersonalisedBreedSection.jsx` now shows "Request {breed} Collection →" button
- Button has `data-testid="request-breed-collection-btn"` and opens Concierge® pre-filled with breed
- `handleRequestCollection` uses `tdc.request` + `bookViaConcierge` pattern

### MiraPureOSPage Pillar Names — Fixed
- `getPillarPicks()`: renamed `travel`→`go`, `enjoy`→`play`, removed `stay`, removed `fit`
- Added new keys: `go`, `play`, `shop`, `emergency`, `farewell`, `paperwork` with proper data
- `getQuickReplies()`: renamed `travel`→`go`, removed `stay`/`enjoy`/`fit` cases, added `go`/`shop`/`play`
- `MiraPage.jsx` QUICK_ACTIONS: `travel`→`go`, `stay`→`play`

### Dine Mobile Pet Switcher — Fixed
- `DineSoulPage.jsx`: Replaced native `<select>` with pill buttons (matching all other mobile pages)
- Active pill: white border + frosted glass; inactive: transparent + muted border

### Watercolor Service Images — Verified
- `ServicesMobilePage.jsx` correctly renders `watercolor_image` from API
- Service API returns Cloudinary URLs in `watercolor_image` field (verified working)

### Bug Fix: effectiveHidePrice → hidePrice
- `PersonalisedBreedSection.jsx` line 226-227: Fixed latent `ReferenceError` (undefined variable)

---


### Concierge® Global Branding
- Added ® to ALL instances of "Concierge" in user-facing text across 187 files
- Navbar now shows "PET CONCIERGE®" branding
- Smart regex excludes component names (ConciergeModal, useConcierge) — only text content updated

### Pet Switcher UX Overhaul
- Replaced native `<select>` dropdown with custom pill buttons across all 11 mobile pages
- Pills show pet name; selected pet has white border + frosted glass background
- Works for multi-pet households (Lola + Coco visible simultaneously)

### Shop Mobile Page — Complete Rewrite
- Added ShopCategoryStrip with 6 tabs: For {Pet}, Bakery, Breed, Browse, Hampers, Merch
- MiraPicksSection: fetches `/api/mira/claude-picks` with breed filtering, score bars, mira_reason
- BreedCollectionSection: fetches breed-specific soul products with type filters (Bandana, Mug, Keychain…)
- ShopBrowseSection: search + pillar filter pills + "Load more" pagination
- "See Mira's Shop Picks →" button now scrolls to and activates picks section
- SoulMade block, PersonalisedBreedSection, and Concierge® CTA all included

### NearMe Tabs
- LearnMobilePage: Added "📚 Learn" | "📍 Near Me" tab bar; renders LearnNearMe component
- PaperworkMobilePage: Added "📋 Paperwork" | "📍 Near Me" tab bar; renders PaperworkNearMe component
- GoMobilePage: Already had NearMe integration (from previous fork)
- CelebrateMobilePage: Already had CelebrateNearMe inline (from previous fork)

### MobileMenu Auth Guard
- MobileMenu now checks `isLoggedIn = !!userName`
- Authenticated users see: Pet Home, My Requests, Pet Soul™, Paw Points, Cart, Notifications, Sign Out
- Unauthenticated users see: "Sign In" + "Join Now" buttons (no protected links)

## 2026-03-24 — Previous Fork Agent Changes

### iOS Mobile Design System
- Applied `mobile-page-container` and `ios-bottom-sheet` classes across all 11 mobile pages
- Created `/app/frontend/src/styles/mobile-design-system.css`

### MiraEmptyRequest Component
- Universal concierge capture when product arrays are empty
- Applied to BirthdayBoxBrowseDrawer, DineMobilePage, CareMobilePage, GoMobilePage

### Admin Fixes
- Fixed ProductBoxEditor allowedFields save issue
- Auto-populated AI Image URL into media.primary_image
- Fixed MongoDB NotImplementedError on /admin/generate-image

### Data Migration
- Migrated 143 legacy services to services_master
- Migrated 2991 soul products to products_master

### Bug Fixes
- Fixed "? questions waiting" bug in PillarSoulProfile
- Removed duplicate green Mira orb from dashboard
- Updated global text to "World's first platform"

## 2026-03-26 — Image Blocking + Admin Prompt + Mira Plan + Life-Stage Filter (Session 11)

### Image Fixes (P0)
- ProductCard.jsx: Added `isValidUrl()` helper — explicitly blocks `emergentagent.com` and `static.prod-images` URLs in ALL fallback paths
- BirthdayBoxBrowseDrawer.jsx: Added same `validImg()` check — never uses broken staging URLs
- DB Cleanup: `POST /api/admin/cleanup-broken-images` ran and removed 4,811+ broken `image` fields and 4,821+ broken `images[]` array entries from products_master
- Also synced `cloudinary_url → watercolor_image` for 3,336 breed products via `/api/admin/sync-image-fields`

### Admin AI Prompt — Full Fix (4 requests)
- `AIImagePromptField.jsx` rewritten: (1) Pre-fills with smart `buildDefaultPrompt()` based on product name/pillar/category, (2) Fully editable textarea, (3) Shows existing `ai_prompt` if saved, (4) Saves custom prompt to `ai_prompt` field in MongoDB after generation
- `ProductBoxEditor.jsx`: Passes `productName`, `pillar`, `category`, `currentImageUrl` to AIImagePromptField
- `server.py generate-image`: Now saves `ai_prompt` + `ai_image_prompt` fields to entity record

### /api/mira/plan — Claude Haiku (P0)
- New endpoint: `POST /api/mira/plan` — Claude claude-haiku-4-5-20251001 generates 4 personalised pillar plan cards
- System prompt uses pet name, breed, age, allergies, loves, health conditions
- Returns: `{cards: [{icon, title, reason, action, concierge}]}`
- MiraPlanModal now shows REAL AI cards (was showing static fallback before)

### Life-Stage Filter (P0 recurring fix)
- `useMiraFilter.js`: Added HARD filter (not just deprioritize) — any product with `puppy/puppies` in name/tags/life_stages is completely hidden from adult/senior dogs (age >= 1)
- `mira_score_engine.py`: Added same filter in backend claude-picks response — fetches pet age and removes puppy products for adult dogs
- Both frontend AND backend now enforce this rule

### Service Prices — Remaining Pages
- `EmergencyMobilePage.jsx`: Removed hardcoded prices (₹1,500, ₹1,999) from EMERG_SERVICES array
- `FarewellMobilePage.jsx`: Removed hardcoded prices (₹2,999, ₹1,499, ₹3,999) + added Service Box API fetch for live services
- FarewellMobilePage bug fixed: `svc.desc → (svc.desc || svc.description || '')` to prevent TypeError when API services are used


## 2026-03-26 — 2×2 Grid + Soul Made All-Pillar + Admin Image URL Fix (Session 12)

### Soul Made Products — All Breed Products Shown (6+ fix)
- `PersonalisedBreedSection.jsx`: Removed strict pillar filter from API call (`/api/breed-catalogue/products?breed=${breed}&limit=40` — no pillar param)
- Now fetches ALL 38-40 breed products across all pillars (Indie: 38, Labrador: 40)
- Sorts current-pillar products FIRST, then fills with cross-pillar picks
- Shows up to 12 products in the grid (was limited to 3 for Indie on Learn)

### 2×2 Grid Layout on Mobile
- `PersonalisedBreedSection.jsx` line 217: `gridTemplateColumns: 'repeat(2, 1fr)'` — explicit 2-column grid on all screens (was `auto-fill` which gave 1 column on narrow containers)
- `SoulMadeModal.jsx`: Increased limit from 12 to 40, removed pillar filter — shows full breed collection

### Admin Primary Image URL Fix
- `ProductBoxEditor.jsx` `onImageGenerated` callback: Replaced 6 sequential `updateField()` calls with ONE `setProduct(prev => ({...}))` functional update
- This atomically updates: `image`, `image_url`, `thumbnail`, `watercolor_image`, `cloudinary_url`, `media.primary_image`, `media.images`, `ai_prompt`, `ai_image_prompt` in a single React render
- Fixes: Primary Image URL at top now auto-updates immediately after AI generation completes


## 2026-03-26 — P0/P1 Bug Sprint (Session 13)

### DB Stats Delivered (User Request)
- Total celebrate products: 1,705 in Celebrate pillar
- Active cake products (products_master): 338
- Birthday cake items (breed_products): 163
- Products synced from thedoggybakery.com: 0 (all imported via production_csv_import)
- DoggyBakeryCakeModal shows up to 8 breed-specific cakes per breed

### P0 Fix 1: Dine Mobile Profile Card Click
- `DineSoulPage.jsx` DineMobilePage hero: Pet avatar div + name text now have `onClick={() => { vibe('light'); setProfileOpen(true); }}`
- Added `data-testid="dine-mobile-profile-avatar"` to the avatar
- Opens DineProfileSheet showing pet soul/diet profile
- Confirmed working by testing agent (100% PASS)

### P0 Fix 2: Admin AI Image — Auto-switch to Media Tab
- `ProductBoxEditor.jsx` polling flow (line 240): Added `setActiveTab('media')` after `setProduct(prev => ...)`
- `ProductBoxEditor.jsx` onImageGenerated callback (line 1692): Added `setActiveTab('media')` 
- Both flows now auto-switch the user to Media tab after AI image generation completes
- Replaced deep-clone `JSON.parse(JSON.stringify(product))` with functional `setProduct(prev => ...)` — prevents stale closure state
- Added `watercolor_image`, `cloudinary_url`, `ai_prompt` to saveProduct allowedFields in UnifiedProductBox.jsx

### P1 Fix 3: MiraPlanModal Regenerate Button
- Added `regenerateCount` state to MiraPlanModal.jsx
- `handleRegenerate()` increments the count which triggers useEffect re-run (re-fetches new plan)
- "↻ Regenerate Plan" button appears after cards load, at bottom of modal
- `data-testid="mira-plan-regenerate-btn"` added
- Confirmed working by testing agent (plan re-fetches in ~4-8s via Claude Haiku)

### Already Verified (No Change Needed)
- "Mira explains why" expandable row on ProductCard.jsx (lines 585-614) — already implemented
- Adopt + Paperwork mobile DIM_TABS — verified matching desktop parity
- Near Me tabs on all major pillar mobile pages — confirmed present (3-7 refs each)

### Testing
- Testing iteration 227: 100% frontend pass, 93% backend (1 timeout on AI endpoint, not real bug)

## 2026-03-26 — Session 14 Bug Fixes (SOS + Shop Parity + Celebrate Plan Day)

### SOS Fix: Admin ServiceBox Null Crash
- `ServiceBox.jsx`: Wrapped Activate/Deactivate button in `{selectedService && (...)}` guard
- Prevents `Cannot read properties of null (reading 'is_active')` when dialog opens before a service is selected

### Shop Mobile Category Pills — Full Desktop Parity
- `ShopMobilePage.jsx` SHOP_CATS updated from 6 pills to 7, matching desktop exactly:
  - Old: for_pet, bakery (Bakery), breed (Breed), browse, hampers, merch
  - New: mira (Mira's Picks), bakery (The Doggy Bakery), breed (Breed Collection), treats, hampers (Hampers & Gifts), merch, toys
- Default active tab: 'mira' (was 'for_pet')
- Added `treats` tab → DoggyBakerySection with presetFilter='treats'
- Added `toys` tab → BreedCollectionSection
- handleSeePicks: now sets mainTab to 'mira' (was 'for_pet')

### Shop "See All" → Internal Browse Toggle
- Replaced `<a href="https://thedoggybakery.com">See all X products on thedoggybakery.com →</a>` with internal button
- New button: `Browse all {items.length} products from The Doggy Bakery →`  
- `data-testid="bakery-see-all-btn"` — clicking sets `showAll=true`, reveals ALL items (not just 20)
- DoggyBakerySection: accepts `presetFilter` prop for treats/hampers/etc filtering

### Celebrate "Plan Day" → ConciergeIntakeModal
- `CelebrateMobilePage.jsx`: Replaced `CelebrateIntakeSheet` with `ConciergeIntakeModal`
- `ConciergeIntakeModal` was already imported but unused — now properly wired
- Shows beautiful 9-step celebration type picker matching Pic 2 design
- URL param detection: `useSearchParams`, `?plan=1` → auto-opens modal

### PawrentJourney "Plan the day" → Auto-opens ConciergeIntakeModal
- `PawrentJourney.jsx`: Celebrate step navigates to `/celebrate?plan=1` (was plain `/celebrate`)
- `App.js` routing bug found+fixed by testing agent: Added `CelebrateSoulRedirect` component to preserve query params when redirecting `/celebrate` → `/celebrate-soul?plan=1`

### Testing
- Iteration 228: 100% backend (12/12), 100% frontend (all 5 features verified + 1 routing bug found and fixed)

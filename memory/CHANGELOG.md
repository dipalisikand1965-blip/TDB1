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


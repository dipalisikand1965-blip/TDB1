# The Doggy Company — Changelog

## 2026-03-26 — Mobile UI Polish & Breed Filtering Sprint (Session 7)

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

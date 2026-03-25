# Changelog — The Doggy Company Platform

---

## SESSION 5 — 2026-03-26 (Admin Fixes + Mobile UI Overhaul)

### BATCH 1 — Admin Critical Fixes (All tested ✅)

**Fix 1: ProductBoxEditor/UnifiedProductBox — Save Whitelist**
- Added 8 missing fields to `allowedFields`: `is_active`, `ai_image_prompt`, `categories`, `inventory`, `mira_ai`, `mrp`, `shape`, `suitability`
- Previously, these fields were silently dropped on every Save — now fully persisted
- File: `/app/frontend/src/components/admin/UnifiedProductBox.jsx`

**Fix 2: Import 143 Legacy Services → services_master**
- New endpoint: `POST /api/admin/migrate/legacy-services` (HTTP Basic Auth)
- Migrates `services` + `service_catalog` collections with pillar translation map: feed→dine, groom→care, stay→go, travel→go, advisory→paperwork, enjoy→play, fit→play
- Result: services_master grew from 1021 → 1067 docs (46 new services imported)
- File: `/app/backend/server.py`

**Fix 3: Import 2991 Soul Products → products_master**
- New endpoint: `POST /api/admin/migrate/soul-products` (HTTP Basic Auth)
- Migrates `breed_products` collection with pillar normalization (food→dine, grooming→care, etc.)
- Result: products_master grew from 6042 → 7519 docs (1477 new products imported)
- File: `/app/backend/server.py`

**Fix 4: AI Image URL Auto-Populate in ProductBoxEditor**
- `handleGenerateAIImage` in `ProductBoxEditor.jsx` now sets `media.primary_image` and `media.images` when AI generation completes
- Previously only `image`, `image_url`, `images` were set (legacy fields); now full `media` object is updated
- File: `/app/frontend/src/components/admin/ProductBoxEditor.jsx`

### BATCH 2 — Mobile UI Overhaul (iOS Quality Design System)

**New: `/app/frontend/src/styles/mobile-design-system.css`**
- Typography: Cormorant Garamond (serif headings) + -apple-system/-apple-system (body)
- Type scale: 12px minimum (xs), 14px (sm), 16px (base), 22px (xl), 34px (h1)
- iOS utility classes: `.ios-h1`, `.ios-h2`, `.ios-h3`, `.ios-body`, `.ios-btn-primary`, `.ios-tab-bar`, `.ios-tab`, `.ios-card`
- Bottom sheet system: `.ios-bottom-sheet-content`, `.ios-drag-handle`, `slideUp` animation
- Mobile page container: `.mobile-page-container` with system fonts, safe-area padding, anti-aliasing
- Imported globally in `index.css`

**Font Size Upgrades (All 11 mobile pages)**
- Bumped: 10px→12px, 11px→13px, 12px→14px, 13px→14px across all CSS strings
- Font family: `'DM Sans'` → `-apple-system, BlinkMacSystemFont, 'SF Pro Display'`
- Files: All `*MobilePage.jsx` files

**iOS Bottom Sheet Modals**
- `ProductDetailModal` → `items-end sm:items-center`, `borderRadius: 28px 28px 0 0`, `slideUp` animation, drag handle pill
- `ConciergeOnlyProductDetailModal` → same treatment
- `ServiceBookingModal` → already has `ios-bottom-sheet-content` + `ios-drag-handle` (confirmed working)
- File: `/app/frontend/src/components/ProductCard.jsx`

**Go Page Fixes**
- `GoMobilePage.jsx` → tab bar migrated from custom `go-tab` CSS class to `ios-tab-bar` system
- `GoConciergeSection.jsx` → fixed services loading: now shows all go services when category-specific filters return empty
- Files: `/app/frontend/src/pages/GoMobilePage.jsx`, `/app/frontend/src/components/go/GoConciergeSection.jsx`

**Bug Fix: CareMobilePage vibe() function missing**
- `vibe()` haptic feedback function was missing from `CareMobilePage.jsx` (present in all other mobile pages)
- Caused runtime `ReferenceError` when clicking Care Services tab
- Fixed by testing agent (added at line 57)

---

## SESSION 3 — 2026-03-25 (Mira Filtering + Service Booking Modal + Admin Backend Fixes)

### BATCH 1 — Mira Product Intelligence Filter (All tested ✅)

**New: `/app/frontend/src/hooks/useMiraFilter.js`**
- ALLERGEN_MAP: ingredient synonym matching (chicken→[chicken,poultry,fowl], soy→[soy,soya,tofu,edamame], etc.)
- GOAL_CONFLICTS: nutrition goal conflict detection (weight loss → blocks high-calorie products)
- `applyMiraFilter(products, pet)` → filters allergens, ranks by loves, dims goal conflicts
- Returns `mira_hint`, `_loved`, `_dimmed`, `miraPick` flags on every product
- `SharedProductCard` auto-renders `mira_hint` as "Why Mira suggests this"

**Updated: All 11 mobile pillar pages + DineSoulPageDesktopLegacy**
- `DineSoulPage.jsx` — upgraded ALLERGEN_MAP synonym matching, added miraPick callout + footer
- `DineSoulPageDesktopLegacy.jsx` — upgraded ALLERGEN_MAP, added Mira's pick callout
- `CareMobilePage.jsx` — replaced basic allergen filter with full applyMiraFilter + callout
- `GoMobilePage.jsx` — same
- `PlayMobilePage.jsx` — same
- `CelebrateMobilePage.jsx` — applyMiraFilter applied to miraProducts before display
- `AdoptMobilePage.jsx`, `FarewellMobilePage.jsx`, `EmergencyMobilePage.jsx` — applyMiraFilter after filterBreedProducts
- `LearnMobilePage.jsx`, `PaperworkMobilePage.jsx`, `ShopMobilePage.jsx` — same

**Mira's pick callout** — amber gradient banner above product grids (✦ icon + product name + reason)
**Footer** — "N items · filtered for {pet} · no {allergens}"
**Empty state** — "🛡️ Mira filtered everything for {pet}'s allergies" with Concierge CTA

**Fixed: GuidedCarePaths null pet crash** (`if (!pet) return []` guard added)

---

### BATCH 2 — ServiceBookingModal Mobile (All tested ✅)

**Updated: `ServiceBookingModal.jsx`**
- Added 4 new service types: `boarding`, `sitting`, `daycare`, `pet_taxi`
- Added `guessServiceType(svcNameOrObj)` utility export — maps service name strings to service type keys
- `boarding`: Hotel / Home Boarding / Resort / Long Stay sub-services
- `sitting`: In-Home / Overnight / Drop-In / Housesitting
- `daycare`: Full Day / Half Day / Weekly / Socialisation
- `pet_taxi`: Vet Transfer / Airport / Groomer Drop / Outstation

**Wired: `ServicesMobilePage.jsx`**
- Replaced old "Concierge will contact you" sheet with full 4-step `ServiceBookingModal`
- `handleBook` now calls `guessServiceType(svc)` + `setSvcBooking()`

**Wired: `CareMobilePage.jsx`**
- NearMe `onBook` now opens `ServiceBookingModal` with guessServiceType mapping

**Wired: `GoMobilePage.jsx`**
- PetFriendlyStays `onBook` now opens `ServiceBookingModal` (default: `boarding` type)

**Wired: `PlayMobilePage.jsx`**
- PlayNearMe `onBook` now opens `ServiceBookingModal` (default: `training` type)

**Wired: `LearnMobilePage.jsx`**
- Dim service book buttons now open `ServiceBookingModal` (default: `training` type)

---

### BATCH 3 — Admin Backend Fixes (All tested ✅ 15/16 pass)

**Fixed: Archive/Delete product (UnifiedProductBox + unified_product_box.py)**
- `DELETE /api/product-box/products/{id}` now sets `is_active: false, active: false, visibility.status: "archived"`
- `GET /api/product-box/products` now EXCLUDES archived products by default (`visibility.status != "archived"`)
- Products disappear from admin list immediately after archiving ✅

**Fixed: Toggle Active/Inactive (server.py)**
- `PATCH /api/admin/products/{id}/toggle-active` no longer changes `visibility.status` when deactivating
- When deactivating: only sets `is_active: false` — product STAYS in admin list ✅
- When re-activating: sets `is_active: true` + restores `visibility.status: "active"` (un-archives if needed) ✅

**Fixed: AI Image Custom Prompt (AIImagePromptField.jsx)**
- `handleGenerate` now reads `localStorage.getItem('adminAuth')` and adds `Authorization: Basic` header
- `POST /api/admin/generate-image` no longer returns 401 ✅

**Fixed: Service price in admin list (UnifiedProductBox.jsx)**
- Price column shows orange "Service" badge instead of "₹0" for `product_type === 'service'` or `basics.is_service === true`

**Fixed: Service tab auto-behaviour (ProductBoxEditor.jsx)**
- Toggling `is_service: true` now auto-sets:
  - `price: 0`, `pricing.base_price: 0`, `pricing.selling_price: 0`
  - `basics.concierge_only: true` (hides add-to-cart, shows "Talk to Concierge")
  - `inventory.track_inventory: false`
- Shows info callout: "Service mode active — price hidden, concierge flow enabled"

**Fixed: Admin nav duplicate id (Admin.jsx)**
- Duplicate `id='go'` for two nav tabs → fixed to `id='go'` (Stay/Home) and `id='travel'` (Travel/Plane)

**Fixed: Stats mira.suggestable hardcoded -1 (unified_product_box.py)**
- Now queries DB for `mira_visibility.can_suggest_proactively: true` count

---

## SESSION 2 — 2026-03-25 (Mobile Parity Sprint + Emergency WhatsApp)

### BATCH 1 — Non-Pillar Page Fixes (All tested ✅)
- Landing page: Fixed 5 broken `className inside style={}` bugs
- Checkout: Moved order summary ABOVE form on mobile
- Membership: Responsive padding for pricing card
- Register: Dark theme matching Login page (slate-950, gradient button)

### BATCH 2 — Core Mobile Pillar Pages (All 12 tested ✅)
- Adopt, Farewell, Emergency mobile pages — 3-tab layout + full product + service wiring
- Services mobile page — 7 service group cards
- Care, Go, Play mobile pages — 3-tab + dimTab + Mira bar
- Learn, Paperwork mobile pages — 7 dimension pills + DocumentVault
- Celebrate mobile page — full feature parity with desktop

### BATCH 3 — Emergency WhatsApp
- `POST /api/notifications/emergency-whatsapp` wired to Gupshup
- Sends alert with pet name, breed, allergies, urgency

### BATCH 4 — Build Fix
- OOM crash fixed: `GENERATE_SOURCEMAP=false NODE_OPTIONS="--max-old-space-size=4096"`

---

## SESSION 3 — 2026-03-25 (Admin Pillar Managers Consistency Sprint)

### Fix 1 — JSX Error Fixed
- Removed extra `</div>` from `SoulProductsManager.jsx` line 1806 (was causing compile error)

### Fix 2 — All 12 Pillar Managers Now Consistent (7 standard tabs each)
- Rewrote `PillarManager.jsx` with all 7 Shadcn Tabs: Requests (live from service_desk API), Partners, Products, Services, Bundles, Tips, Settings
- Added missing tabs to: CelebrateManager (Tips), DineManager (Partners+Tips), LearnManager (Partners+Tips), EmergencyManager (Tips), FarewellManager (Tips), AdoptManager (Requests+Partners+Tips+Settings), PaperworkManager (Partners+Tips), ShopManager (Requests+Partners+Services+Tips)
- GoManager and PlayManager automatically benefit from PillarManager rewrite

### Fix 3 — Pagination 20/page
- Changed ITEMS_PER_PAGE from 50 to 20 in `PillarProductsTab.jsx`

### Fix 4 — Creation → Immediate Appearance
- Confirmed: Products (Product Box → products_master → pillar page): YES
- Confirmed: Services (Service Box → services_master → pillar page): YES
- Confirmed: Bundles (BundlesManager → bundles_master → pillar page): YES
- Confirmed: Soul products → MUST use "Add to catalog" to appear on pillar pages (separate collection)

### Fix 5 — ProductBoxEditor Save — Critical Bug Fixed
- `saveProduct` in `UnifiedProductBox.jsx` now saves ALL fields including:
  - `pillar` (primary pillar), `approval_status` (Status in Pillar)
  - `commerce_ops` (pricing, margin), `basics` (nested metadata)
  - `pillars_occasions` (secondary pillars), `breed`, `life_stage`, `pet_size`
  - `sub_category`, `allergens`, `soul_tier`
- Previously: Status in Pillar and Secondary Pillars in Product Box were NOT persisting on save

### Fix 6 — Quick Add Button on All Pillar Managers
- Added "Quick Add" dropdown in PillarManager header (+ Add Product, + Add Service, + Add Bundle)
- Clicking switches to the correct tab AND triggers the create modal
- `PillarProductsTab`: accepts `createTrigger` prop, opens create modal when triggered
- `PillarBundlesTab`: accepts `createTrigger` prop, calls openCreate()
- `PillarServicesTab`: accepts `createTrigger` prop + new inline "Add Service" modal with name, description, price, category fields

### Documentation
- Updated `complete-documentation.html` — full exhaustive handover document
- Updated `ROADMAP.md` — deployment-aware priority order
- Updated `PRD.md` — session 4 reflected



- Implemented `useResize` hook + `isDesktop` split pattern
- Created all 11 `*MobilePage.jsx` files
- Wired Dine mobile (inline DineDimensionsRail + full applyMiraIntelligence)
- All 12 pillar pages wired with mobile split

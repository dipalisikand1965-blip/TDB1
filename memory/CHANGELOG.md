# Changelog — The Doggy Company Platform

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

## SESSION 1 — 2026-03-18 (Responsive Split + All Pillars)

- Implemented `useResize` hook + `isDesktop` split pattern
- Created all 11 `*MobilePage.jsx` files
- Wired Dine mobile (inline DineDimensionsRail + full applyMiraIntelligence)
- All 12 pillar pages wired with mobile split

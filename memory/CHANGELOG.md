# CHANGELOG

## 2026-04-05 (Session 52 — Write-Through Sync + Task 2 Backfill)

### Architecture: Single Source of Truth (products_master)

1. **`_sync_to_products_master` helper** — Added to `/app/backend/app/api/mockup_routes.py`
   - Writes `soul_made: True`, `soul_tier: "soul_made"`, `cloudinary_url`, `image_url`, `breed_tags`, `pillar`, `original_price` to `products_master` on every breed product write
   - Pillar safety fix included: handles both list and string `pillars` field
   - `$setOnInsert: visibility.status: "active"` ensures new records are consumer-visible immediately
   - Applied at all 8 `breed_products.update_one` locations

2. **Backfill** — 1,946 orphan `breed_products` (active) synced to `products_master` with `soul_made: True`
   - Zero orphans remaining
   - `products_master` soul_made total: 5,557

3. **Visibility fix** — 1,069 existing soul_made records in `products_master` that were missing `visibility.status` field got patched to `visibility.status: "active"`

### Verified
- 1 live generation test: German Shepherd Sofa Cushion Cover → synced to `products_master` in real-time ✅
- Soul Box admin shows newly generated products immediately ✅
- Consumer-facing pages now see all active soul products ✅



### Performance
1. **Production build** — `yarn build` completed in 70s. Build artifacts in `/app/frontend/build/`.
   - Main chunk: 1.8MB (gzip ~450KB)
   - 20+ code-split lazy chunks (97 lazy routes in App.js)
   - No source maps (GENERATE_SOURCEMAP=false)

### Redesign
2. **Insights.jsx** — Full dark midnight TDC redesign (was: light purple gradient, "TDB Insights").
   - Background `#1A0A2E` · Cormorant Garamond headlines · DM Sans body
   - Hero: "TDC INSIGHTS" label · "Stories from the soul of dog parenting."
   - Category filter pills: All / Travel / Health / Dine / Care / Celebrate (amber gold active state)
   - Featured: full-width editorial card with image zoom, author, read-time
   - Grid: dark glass-morphism cards with category colour badges, hover lift
   - Article modal: dark midnight, left-colour-bar excerpt, full content scroll
   - Newsletter strip: dark amber CTA at bottom
   - SEO: `<SEO>` component added with title/description/keywords/url
   - Error/empty/loading states all properly styled in dark theme

3. **Footer** — Added `✦ Experience Demo` amber link in both desktop Intelligence column and mobile collapsible section → `/demo`

---



### New Features
1. **`DemoPage.jsx`** — Created `/app/frontend/src/pages/DemoPage.jsx` as a standalone, fully public, no-auth luxury editorial showcase page.
   - Section 1: Hero — "Every dog has a soul. For the first time in the world — a platform that knows it."
   - Section 2: Three Truths — "Google suggests. Amazon sells. The Doggy Company does. For the first time. Anywhere."
   - Section 3: Mira — "Meet Mira — The world's first Pet Life OS" with capability cards
   - Section 4: Mojo's interactive soul card (Indie · Senior · High energy · Allergies: Chicken/Beef · Loves: Salmon/Peanut Butter · Celebrations: 5 tracked)
   - Section 5: 12 Pillars grid (hover effects, descriptions)
   - Section 6: Animated stats counters (1,247+ dogs, 12 pillars, 97% accuracy, 286+ services)
   - Section 7: Waitlist CTA with email form + success state
   - Footer: "Built in memory of Mystique. Launched on her birthday — May 15, 2026."
   - Design: `#1A0A2E` deep midnight, Cormorant Garamond + DM Sans, amber gold `#C9973A`, animated Mira orb
2. **App.js route** — Added `<Route path="/demo" element={<DemoPage />} />` as a public route outside MainLayout (no Navbar/Footer from main app).

### Test Results — Screenshot verified (all 7 sections render correctly)

### Blog Post Published
4. **"Why I Built This at Midnight"** — Dipali Sikand's founder essay published via API as the first Insights post.
   - Category: Soul Stories (auto-appeared as a new filter pill)
   - Author: Dipali Sikand · Featured: true · Status: published
   - Excerpt: "Her name was Mystique. She was a Shih Tzu. Ten years old..."
   - No image provided → gradient fallback with ✦ symbol (intentionally elegant)

---

 — P0: Ghost Cache Purge + ServiceBox Add/Toggle Fix + Service Card Modal Routing)

### Bug Fixes
1. **Ghost service cache purge** — Deleted 364 stale `mira_product_scores` entries for 68 archived `svc-*` ghost services. "Vet Appointment Coordination" and 67 others no longer appear in Mira Picks.
2. **mira_score_engine.py get_top_picks** — `products_master` Layer 3 lookup now filters `is_active/$ne:False, visibility.status/$ne:"archived"`. Archived products never resurface through score cache.
3. **ServiceBox.jsx handleToggleActive** — Fixed `ReferenceError: svcId is not defined`. Now uses `svc.id || svc._id` from the closure parameter correctly.
4. **ProductCard.jsx service modal routing** — `(isConciergeOnly || isServiceProduct)` now gates `ConciergeOnlyProductDetailModal`. Services from ALL pillars (not just paperwork) show the Concierge modal. No "Add to Cart" ever shown for services.
5. **ConciergeOnlyProductDetailModal label** — Dynamic: shows `"Care Service · Concierge® Only"` not hardcoded `"Concierge®-first paperwork pick"`.

### New Features
6. **ServiceBox "+ Add Service" button** — Opens `ProductBoxEditor` in create mode. Calls `POST /api/service-box/services`. Defaults price=₹0, pillar=activePillar.
7. **ProductCard.jsx shared image resolver** — Replaced 3 separate image chains with single module-level `getProductImage(p)`. Card thumbnail + both modals (ConciergeOnly + ProductDetail) always show identical image. Priority: `watercolor_image → cloudinary_url → mockup_url → primary_image → image_url → image (cloudinary/shopify only)`.

### Test Results (iteration_255) — 100% (21/21 pass)

---

## 2026-03-31 (Session 39 — P0: Inactive Filtering + Admin Search Debounce)

### Bug Fixes
1. **Inactive Services on Consumer Frontend** — `GET /api/service-box/services` now defaults `active_only=True`. Previously 437 inactive services (out of 1048 total) were being returned to consumer pages (e.g. adopt pillar now returns 21 active vs. 31 total). Consumer pages like `ServicesSoulPage`, `FarewellSoulPage`, `AdoptSoulPage` no longer show deactivated services.

### Enhancements
2. **ServiceBox.jsx search** — Added 350ms debounce + multi-field search (id, name, category, sub_category, pillar, description) + relevance sort (name starts-with query first).
3. **BundleBox.jsx search** — Same debounce + multi-field search + relevance sort pattern.
4. **SoulProductsManager.jsx search** — Same debounce + multi-field search (id, name, category, sub_category, soul_tier, pillar, description) + relevance sort.

### Test Results (iteration_254)
- Backend: 100% (8/8 pass)
- Frontend: 100% (3/3 debounce tests pass, consumer page verified)



### Bug Fixes
1. **Shop "Ask Concierge®" button** — was calling silent `request()`, now opens `ConciergeRequestBuilder` modal correctly
2. **Admin ticket photo dedup bug** — photo messages were being deduplicated away (same sender+timestamp as initial message). Fixed dedup key to include first 40 chars of text
3. **useConcierge.js metadata** — was spreading `...metadata` at root level (Pydantic silently dropped it). Now sends as proper nested `metadata:` object
4. **Universal media attachments in Admin** — replaced soul-made-only photo banner with universal `extractAllMedia()` that scans ticket.metadata, all conversation messages, and embedded text URLs for images/documents
5. **BreedCakeOrderModal** — now passes `metadata.image_url` with chosen illustration URL to ticket
6. **Backend `attach_or_create_ticket`** — now handles `metadata.image_url`, `metadata.document_url`, `metadata.file_url` (not just `metadata.photo_url`). Top-level `photo_url` and `soul_made` fields added to admin_ticket doc

### Smoke Test Results
- Backend: 100% (13/13 pass)
- Frontend: 95% (all key pages + new features verified)
- Ready for deployment ✅

---
## Session 42 — 2026-03-31

### Go NearMe Modal Fix
- **PetFriendlyStays.onBook** in `GoMobilePage.jsx` now opens `NearMeConciergeModal` instead of the 4-step `ServiceBookingModal`. Stays/hotels in the Go pillar now correctly use the "BOOK VIA CONCIERGE · GO" modal.

### NearMeConciergeModal — Full MasterBriefing Wiring
- `handleSend` now passes structured `details` (service_name, venue_address, preferred_date, notes) and a `note` string to `useConcierge.request()` so `buildMasterBriefing` includes the full venue info, date, and notes in the service desk ticket.

### CSV Export — Backend-Powered (50 columns)
- `exportToCSV` in `UnifiedProductBox.jsx` now calls `GET /api/product-box/export/csv?include_all_fields=true` instead of doing a limited client-side generation.
- 50 columns: id, sku, name, brand, product_type, primary_pillar, pillars, category, subcategory, mrp, selling_price, cost_price, margin_band, inventory_status, in_stock, is_bakery_product, mira_recommendable, mira_hint, life_stages, size_options, applicable_breeds, occasions, use_case_tags, image, tags, short_description, long_description, gst_rate, hsn_code, delivery_type, returnable, cold_chain_required, fragile, available_cities, quality_tier, approval_status, allergy_aware, common_avoids, material_safety_flags, energy_level_match, chew_strength, play_types, coat_type_match, brachycephalic_friendly, senior_friendly, is_giftable, subscription_friendly, travel_friendly, breed_metadata, intelligent_tags.
- Pillar-filtered export supported via `?pillar=dine` etc.

### CSV Import — Full Field Mapping + Backend Endpoint
- Added `POST /api/product-box/import` endpoint in `unified_product_box.py`. Accepts flat CSV rows, maps all 50 columns to the full nested product schema, upserts by `id` (or creates new PROD-xxx).
- Added `parseCSVText` (proper quoted-field parser) + `importFromCSV` in `UnifiedProductBox.jsx`.
- Import button shows loading state during import and a detailed "Import Complete" toast (imported / updated / failed counts).

### Testing
- iteration_256: 15/15 backend, 5/5 frontend — all 3 fixes confirmed working.

---
## Session 43 — 2026-03-31 (Strict Breed Filter — Dine + Cross Pillar)

### Root Cause
- `DineMobilePage.jsx` fetched products WITHOUT `breed` param → unfiltered 338 products loaded per category
- `DineContentModal.jsx` (DineCategoryStrip tiles) also missing `breed` param at lines 618 and 697
- Backend `KNOWN_BREED_NAMES` missing `'shiba inu'`, `'maltipoo'`, `'italian greyhound'`, `'collie'`, `'bernese mountain dog'` → those products treated as universal and shown to all breeds

### Fixes Applied
1. **`DineMobilePage.jsx`** — `fetchProducts` now passes `&breed=${encodeURIComponent(pet.breed)}` to all 5 FOOD_CATS API calls; limit bumped 100→200
2. **`DineContentModal.jsx`** — Added `breedFilter` to the parallel FOOD_CATS batch fetch (line 618) and the standard category fetch (line 697)
3. **`pillar_products_routes.py`** — Added `'shiba inu'`, `'maltipoo'`, `'italian greyhound'`, `'collie'`, `'bernese mountain dog'` to `KNOWN_BREED_NAMES`
4. **`useMiraFilter.js`** — Added same 5 breeds to frontend `KNOWN_BREEDS` for client-side safety net

### Verification
- Backend: 29/29 tests pass — all 7 pillars (dine, care, play, learn, go, shop, paperwork) return 0 contaminated products for `breed=Indie`
- Shiba Inu contamination (was 3 products in Care) → 0 ✓
- Test iteration_257 all green

---
## Session 44 — 2026-03-31 (ServiceBox + BundleBox: Full CRUD + CSV)

### ServiceBox Improvements
- Added `deleteService()` function + 🗑 Delete button on every row (calls DELETE /api/service-box/services/{id})
- `exportCSV()` now calls `/api/service-box/export-csv`, converts JSON to 27-column CSV (id, name, pillar, category, sub_category, description, base_price, price, duration, is_active, is_bookable, is_free, approval_status, image_url, mira_whisper, includes, tags, available_cities, paw_points_eligible, paw_points_value, whisper_default, whisper_golden_retriever, whisper_labrador, whisper_pug, whisper_beagle, whisper_shih_tzu, whisper_german_shepherd)
- `handleImportCSV()` replaces broken 5-field parser with proper quoted CSV parser + full 27-field mapping + calls `POST /api/admin/services/import-csv`
- Added `importingCSV` / `exportingCSV` loading states on toolbar buttons

### BundleBox Improvements (Full CRUD)
- Added `createBundle()` + **"+ Add Bundle"** button (POST to new `/api/admin/bundles/all` endpoint)
- Added `deleteBundle()` + 🗑 Delete button on every row (calls DELETE `/api/admin/bundles/all/{id}`)
- `exportCSV()` calls GET `/api/admin/bundles/all/export-csv` → real CSV download with 18 columns
- `handleImportCSV()` replaces broken 4-field parser with proper quoted CSV parser + 13-field mapping + calls `POST /api/admin/bundles/all/import-csv`

### Backend New/Updated Endpoints
- `POST /api/admin/bundles/all` — Create new bundle (auto-generates id)
- `DELETE /api/admin/bundles/all/{id}` — Hard-delete bundle
- `PATCH /api/admin/bundles/all/{id}` — Now accepts ALL bundle fields (was restricted to 5)
- `GET /api/admin/bundles/all/export-csv` — Updated to 18 columns with proper CSV escaping
- Fixed: All import-csv endpoints now use `Body(...)` to avoid FastAPI 422 validation error
- Removed duplicate `api_router` export endpoint to prevent route conflict

### Testing: iteration_258 — All backend endpoints verified ✓

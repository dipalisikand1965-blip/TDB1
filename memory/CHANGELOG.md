# CHANGELOG

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

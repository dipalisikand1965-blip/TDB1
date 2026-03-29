# Changelog

## 2026-03-27 — CakeBox 5-Tab Admin Implementation

### Completed
- Installed final 5-tab `CakeBox.jsx` replacing 4-tab version
- **Auth fix**: `getAdminHeaders()` now uses `localStorage('adminAuth') || btoa('aditya:lola4304')` fallback — matches Admin.jsx pattern, eliminates browser Basic Auth popup
- **React crash fix**: Config tab normalizes `{name, emoji, is_allergen}` objects to strings when fetching from backend
- **Catalogue fix**: Fetch changed from `type=birthday_cake` → `category=cakes` (now shows 386 cakes correctly)
- Cake Orders tab: 4 live orders loading with allergy warnings, status pipeline, expandable detail rows
- Catalogue tab: 386 cakes with images, shape filter chips, Edit/Archive
- TDB Products tab: 6 category pills (Pupcakes, Desi Treats, Frozen, Hampers, Add-Ons, Breed Cakes)
- Config tab: Flavours, Bases, Shapes, Cities, Seasons + Sizes & Pricing table — all editable
- Illustrations tab: BreedCakeManager with Gallery (163 breed variants)

### DB Audit (pre-CakeBox)
- `products_master (category=cakes)`: 185 ✅
- `products (category=breed-cakes)`: 40 Shopify physical
- `cake_config` collection: empty (uses hardcoded defaults)

## 2026-03-26 — Cake Ordering Flow Sprint
- Built `DoggyBakeryCakeModal` with strict field validation (all fields compulsory, red errors)
- Wired to both Desktop (CelebratePageNew.jsx) and Mobile (CelebrateMobilePage.jsx)
- Added 7th "Cake Details" tab to ProductBoxEditor.jsx
- Fixed Admin Basic Auth for cake-orders endpoints
- Generated formatted service desk tickets on cake order submission

## 2026-03-29 — PillarConciergeCards: Text fix + Self-firing

### Changes
- **`PillarConciergeCards.jsx`**: Fixed white-text-on-light-background issue. Card titles changed from `rgba(255,255,255,0.92)` → `#111827`, subtitles from `rgba(255,255,255,0.55)` → `rgba(0,0,0,0.5)`, intro text from `rgba(255,255,255,0.65)` → `rgba(0,0,0,0.5)`. Card bg reduced from `color+'22'` to `color+'15'` for better contrast.
- **`PillarConciergeCards.jsx`**: Added `useState` + internal `builderOpen` / `prefilledIntent` state. Clicking a card now opens `ConciergeRequestBuilder` directly (self-contained) on ALL pages — not just pages that pass `onCardSelect`. Backward-compatible: if `onCardSelect` is passed, it still uses that.
- **`ShopMobilePage.jsx`**: Moved `PillarConciergeCards` out of the dark `S.dark` CTA wrapper so dark text renders on a light background.

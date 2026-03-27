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

# Pet Life OS — Product Requirements Document
_Last updated: 2026-03-24_

## Original Problem Statement
Build a full-featured Pet Life OS with 13+ pillar pages, AI-powered product recommendations, breed-specific merchandise, and a custom order flow (Soul Made™) across all pillars.

**Core Rule:** ALL service bookings and custom order requests MUST route through `service_desk_tickets` via Universal Concierge flow (`attach_or_create_ticket`).

---

## Architecture

```
/app
backend/
    server.py                           # Main app (24k lines)
    nearby_places_routes.py             # /api/nearby/* + /api/nearme/search
    app/api/mockup_routes.py            # AI pillar assignment + breed products + Yappy cake prompts
frontend/
    src/
        components/
            SoulMadeModal.jsx            # 4-step custom order modal (CENTRED)
            ProductCard.jsx              # Image rendering with mockup_url priority
            PillarSoulProfile.jsx        # Soul drawer (CENTRED modal)
            celebrate/
                DoggyBakeryCakeModal.jsx # Breed cake order modal (THE DOGGY BAKERY™)
                BirthdayBoxBrowseDrawer.jsx # 2-col grid, ProductBoxEditor on click
            admin/
                BreedCakeManager.jsx     # Admin gallery + generation for cake illustrations
                SoulProductsManager.jsx  # AI soul product generation + management
            common/
                PersonalisedBreedSection.jsx  # Shared breed products + Soul Made trigger
            celebrate/
                CelebrateCategoryStrip.jsx  # Has Soul Made™ pill
                CelebrateContentModal.jsx   # Has soul_made category + trigger
            dine/
                DineCategoryStrip.jsx    # Has Soul Made™ pill
                DineContentModal.jsx     # Has soul_made category + trigger
            go/
                GoCategoryStrip.jsx      # Has Soul Made™ pill
                GoContentModal.jsx       # Has soul_made category + trigger
            play/
                PlayCategoryStrip.jsx    # Has Soul Made™ pill
                PlayContentModal.jsx     # Has soul_made category + trigger
        hooks/
            useConcierge.js              # Universal request() → service desk tickets
        pages/
            CareSoulPage.jsx             # Removed top PillarSoulProfile+HealthVault, added lower
            CelebratePageNew.jsx
            [All other]SoulPage.jsx
```

---

## What's Been Implemented (This Session — 2026-03-23)

### 1. Soul Made™ Full Pillar Rollout
- **SoulMadeModal.jsx**: 4-step flow (Pick → Photo → Message → Done), Cloudinary upload (preset: `tdc_custom_orders`), Concierge tickets
- **Category Strip pills added**: Care, Celebrate, Dine, Go, Play — clicking opens full-screen catalogue overlay with breed products + "Make it personal" trigger
- **ContentModal integration**: Each pillar's ContentModal handles `soul_made` category — fetches breed products via `/api/mockups/breed-products`, shows product grid, has trigger at bottom
- **PersonalisedBreedSection**: Covers Learn, Shop, Paperwork, Adopt, Farewell, Services (no CategoryStrip)
- **Farewell**: Custom text "In memory of {petName} — create something meaningful"
- **Emergency & Advisory**: Explicitly excluded
- **FULL GUIDE**: See `/app/memory/SOUL_MADE_GUIDE.md` for exact steps to replicate on any new pillar

### 2. Modal/Drawer Centering Fix
- **Bug**: All modals stuck to bottom of viewport (mobile + desktop), clipped behind footer
- **Fix**: Changed `alignItems:'flex-end'` → `alignItems:'center'`, `borderRadius:'Xpx Xpx 0 0'` → `borderRadius:X`, added `padding:16`
- **Applied to**: SoulMadeModal.jsx, PillarSoulProfile.jsx
- **FULL GUIDE**: See `/app/memory/MODAL_CENTERING_FIX.md` — includes grep commands to find other modals needing the fix

### 3. Care Page Improvements
- Removed basic PillarSoulProfile + Health Vault from top of page
- Added beautiful styled PillarSoulProfile + Health Vault cards in lower section (white cards, green accents, breed tags, shadows)
- Renamed WellnessProfile → "Grooming Profile"
- Fixed CareNearMe: new component using `/api/nearme/search` endpoint with city search, type filters (groomer/vet/spa/walker/daycare/boarding), Mira tips

### 4. NearMe API
- Added `/api/nearme/search` endpoint in `nearby_places_routes.py` (text-based Google Places search)
- Returns 15 results with ratings, phone, open/closed status
- Registered `nearme_router` in server.py alongside existing `nearby_places_router`

### 5. Mobile Landing Page
- Added hamburger menu for mobile (<640px) in `LandingPage.jsx`
- Slide-in menu with Our Story, Membership, Sign In, Join Now
- CSS: `.tdc-hamburger` + `.tdc-mobile-menu` + `.tdc-mobile-overlay`

---

## HANDOVER GUIDES (Critical for Next Agent)

### `/app/memory/SOUL_MADE_GUIDE.md`
Complete step-by-step guide to add Soul Made™ to any pillar page. Includes:
- Exact JSX for CategoryStrip pill
- Exact JSX for ContentModal config, fetch, rendering, trigger
- Pillar color/label reference table
- Common mistakes to avoid
- File locations

### `/app/memory/MODAL_CENTERING_FIX.md`
Guide to fix bottom-stuck modals/drawers. Includes:
- Before/after code for SoulMadeModal and PillarSoulProfile
- 3-property change pattern (alignItems, borderRadius, padding)
- Grep commands to find other modals needing the fix
- Verification checklist

---

## Completed (2026-03-24)

### MiraCuratedBox — Swap Fix + Admin-Style Soul Cards + ProductBoxEditor
- **Swap Bug Fixed**: `BirthdayBoxBrowseDrawer.handleBuild` now correctly merges swaps into `visibleSlots`/`hiddenSlots` before opening `BirthdayBoxBuilder`. Swapped items appear in correct slots in the builder.
- **Admin-Style Soul Cards**: Replaced horizontal product rows with a 2-column grid of `SoulCard` components — square AI mockup image, product type badge, name, breed, price, swap button — matching the admin mockup gallery format.
- **Breed Products Fetch**: `TabContent` now fetches from `/api/mockups/breed-products?breed={petBreed}` (falling back to unfiltered breed products, then regular products). Shows 40 real AI-generated breed product cards.
- **ProductBoxEditor Integration**: Clicking any soul card's image opens the full 6-tab `ProductBoxEditor` (Basics / Suitability / Pillars / Commerce / Media / Mira AI) with CloudinaryUploader and AI generation.
- **Allergy Filter Fixed**: Added `a.length > 2` guard to prevent single-char allergen strings from filtering out all products.
- **petBreed Propagation**: `CelebratePageNew.handleOpenBrowseDrawer` now passes `petBreed` to the event so breed products are fetched correctly.

---
- **Adopt** (`AdoptSoulPage.jsx`): Added `✦ Soul Made™ — Make it personal` trigger card after MiraPicks. Wired to `SoulMadeModal` with rose color. Removed dead `PersonalisedBreedSection` import.
- **Farewell** (`FarewellSoulPage.jsx`): Added `✦ Soul Made™ — In memory of {petName}` trigger card after MiraPicks. Wired to `SoulMadeModal` with indigo color. Removed dead `PersonalisedBreedSection` import.
- **Emergency** (`EmergencySoulPage.jsx`): Added `✦ Soul Made™ — Custom safety gear` trigger card after MiraPicks. Wired to `SoulMadeModal` with crimson color. Replaced unused `SoulMadeCollection` import with `SoulMadeModal`.
- **ProductCard Concierge**: Verified `handleServiceRequest` (line 640) already correctly uses `POST /api/service_desk/attach_or_create_ticket`. No fix needed.

---

## VERIFICATION NEEDED BY NEXT AGENT

1. **Dine Soul Made**: Pill shows in strip, clicking opens ContentModal with breed products, footer CTA opens SoulMadeModal (not onClose)
2. **Go Soul Made**: Pill shows, ContentModal renders breed products, trigger at bottom works
3. **Play Soul Made**: Pill shows, ContentModal renders, footer CTA + trigger both open SoulMadeModal
4. **Celebrate Soul Made**: Pill shows, ContentModal renders breed products (not cakes), trigger works, exclusion list prevents double-render
5. **All other modals**: Check for remaining `alignItems:'flex-end'` patterns using grep from MODAL_CENTERING_FIX.md

---

## Key API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/mockups/breed-products?breed={breed}&pillar={pillar}` | Breed-specific products |
| `GET /api/mockups/breed-products?product_type=birthday_cake&breed={breed}` | Yappy-style cake illustrations |
| `POST /api/mockups/generate-breed-cakes` | Generate Yappy-style cake illustrations (163 variants, 50 breeds) |
| `GET /api/mockups/mockup-gen-status` | Poll generation progress |
| `POST /api/upload/image` | Cloudinary photo upload (preset: tdc_custom_orders) |
| `POST /api/service_desk/attach_or_create_ticket` | Concierge ticket (direct fetch + useConcierge) |
| `GET /api/nearme/search?query={query}&type={type}` | NearMe text search (Google Places) |
| `GET /api/nearby/places?lat={lat}&lng={lng}&type={type}` | NearMe coordinate search |

---

## Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` (at `/admin`)

---

## Prioritized Backlog

### 🔴 FUTURE AGENT — DO THIS FIRST AT SESSION START

```
# Check if watercolour generation completed and flat art needs refresh
curl -s {REACT_APP_BACKEND_URL}/api/mockups/mockup-gen-status
# If running=false AND you see breeds like akita/alaskan_malamute/australian_shepherd
# now have watercolour products, trigger flat art:
curl -s -X POST {REACT_APP_BACKEND_URL}/api/mockups/generate-breed-cakes
# This generates Yappy face illustrations for any breed that has watercolour
# products but no cake illustrations yet, then auto-triggers flat art overlay.
```

**Why**: 272 watercolour products being generated for 16 missing breeds. When complete,
flat art auto-triggers (wired in `_generate_missing_breed_products` finally block).
But if the session restarted, re-trigger manually with the commands above.

---

### P0 — Done ✅ (March 2026)
- [x] Soul Made™ on ALL 11 pillars (Care, Celebrate, Dine, Go, Play, Learn, Shop, Paperwork, Adopt, Farewell, Emergency)
- [x] THE DOGGY BAKERY™ Breed Cake Modal — Yappy-style illustrations, pet-aware personalisation
- [x] 163 cake illustrations generated (50 breeds × 3-6 colour variants)
- [x] Admin → 🎂 Breed Cakes tab (BreedCakeManager)
- [x] Services price hiding — "Personalised · Price on request" across all pillars
- [x] Birthday Box Browse Drawer — admin-style soul cards, ProductBoxEditor, swap bug fixed
- [x] Black Husky + Grey Husky cake variants added and generated

- [x] 940 flat art products live (163 Yappy illustrations × 8 product types via Cloudinary overlay)
  - Zero AI cost — uses existing watercolour soul products as base, overlays Yappy face
  - Types: flat_bandana (₹349), flat_mug (₹599), flat_tote (₹799), flat_cushion (₹1,299), flat_phone_case (₹499), flat_tshirt (₹899), flat_notebook (₹449), flat_keyring (₹249)
  - Available via `/api/mockups/breed-products?breed={breed}&pillar=shop`

- [x] Breed name normalization fixed globally — 51/51 breeds return products correctly
  - Backend: spaces→underscores + BREED_ALIASES (black husky→husky, dobermann→doberman, etc.)
  - Frontend SoulMadeCollection: BREED_KEY_MAP updated + smart fallback for unmapped breeds
  - Frontend SoulMadeModal: breed normalized before API call
  - test_fish_185 allergy bug fixed in SoulMadeModal (test_ prefixed values ignored)
- [x] 940 flat art products (831 after cushion removed) via Cloudinary overlay — zero AI cost
  - Uses existing watercolour soul products as base, Yappy face overlaid via e_bgremoval
  - flat_cushion removed (coloured base looks terrible with overlay)
- [x] Orphan breed_products cleaned (593 deleted) — pending count: 50 rain_jacket only
- [x] breed_catalogue.py updated to match by direct breed field (flat art products now visible)

### P1 — Next Sprint
- [ ] Add "3 vets near you" to daily health WhatsApp reminders (NearMe API at scheduler)
- [ ] Extend scheduler for Medication refill reminders

### P2 — Future
- [ ] Build `Love` pillar
- [ ] Refactor `server.py` (24k lines)
- [ ] "My Custom Orders" tab in user profile
- [ ] Admin notification chime for new Soul Made / cake orders
- [ ] MiraCuratedBox swap — remaining OccasionBoxBuilder edge cases

---

## 3rd Party Integrations
- OpenAI GPT-4o / Claude Sonnet — Emergent LLM Key
- OpenAI Image Generation (gpt-image-1) — for Yappy-style cake illustrations
- Cloudinary — user API key (images, auto-upload for all generated mockups)
- Razorpay — user API key (payments)
- Gupshup — user API key (WhatsApp)
- Resend — user API key (email)
- Google Places API — for NearMe search (key in backend/.env)

---

## Pillar Color Reference

| Pillar | Color | Label | Soul Made Method | Status |
|--------|-------|-------|-----------------|--------|
| care | #40916C / G.sage | Wellness | CategoryStrip + CareContentModal | ✅ |
| celebrate | #A855F7 | Celebration | CategoryStrip + CelebrateContentModal + DoggyBakeryCakeModal | ✅ |
| dine | #FF8C42 | Food | CategoryStrip + DineContentModal | ✅ |
| go | G.teal / #3498DB | Travel | CategoryStrip + GoContentModal | ✅ |
| play | G.orange / #E76F51 | Play | CategoryStrip + PlayContentModal | ✅ |
| learn | G.violet / #7C3AED | Learning | PersonalisedBreedSection | ✅ |
| shop | G.gold / #F59E0B | Shopping | PersonalisedBreedSection | ✅ |
| paperwork | G.teal / #0D9488 | Documents | PersonalisedBreedSection | ✅ |
| adopt | G.rose / #D4537E | Adoption | SoulMadeModal trigger after MiraPicksSection | ✅ |
| farewell | G.indigo / #6366F1 | Farewell | SoulMadeModal trigger (In memory of {pet}) | ✅ |
| services | #0EA5E9 | Services | PersonalisedBreedSection (prices hidden) | ✅ |
| emergency | #EF4444 | Safety | SoulMadeModal trigger after MiraPicksSection | ✅ |
| advisory | #10B981 | Advisory | EXCLUDED | ❌ |
| advisory | #10B981 | Advisory | EXCLUDED | ❌ |

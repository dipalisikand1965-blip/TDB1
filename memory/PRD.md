# Pet Life OS — Product Requirements Document
_Last updated: 2026-03-23_

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
    app/api/mockup_routes.py            # AI pillar assignment + breed products
frontend/
    src/
        components/
            SoulMadeModal.jsx            # 4-step custom order modal (CENTERED, not bottom-stuck)
            ProductCard.jsx              # Image rendering with mockup_url priority
            PillarSoulProfile.jsx        # Soul drawer (CENTERED modal, not bottom-stuck)
            common/
                PersonalisedBreedSection.jsx  # Shared breed products + Soul Made trigger
            care/
                CareCategoryStrip.jsx    # Has Soul Made™ pill
                CareContentModal.jsx     # Has soul_made category + trigger
                CareNearMe.jsx           # Fixed: uses /api/nearme/search
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

### Soul Made™ — Adopt, Farewell, Emergency Triggers Added
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
| `POST /api/upload/image` | Cloudinary photo upload (preset: tdc_custom_orders) |
| `POST /api/service_desk/attach_or_create_ticket` | Concierge ticket (via useConcierge) |
| `GET /api/nearme/search?query={query}&type={type}` | NearMe text search (Google Places) |
| `GET /api/nearby/places?lat={lat}&lng={lng}&type={type}` | NearMe coordinate search |

---

## Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` (at `/admin`)

---

## Prioritized Backlog

### P0 — Immediate (Verification)
- [ ] Verify Soul Made works on all 5 ContentModal pillars (Dine, Go, Play, Celebrate, Care)
- [ ] Check remaining modals for bottom-stuck bug (grep for `alignItems.*flex-end`)

### P1 — Next Sprint
- [ ] Add "3 vets near you" to daily health WhatsApp reminders (NearMe API at scheduler)
- [ ] Extend scheduler for Medication refill reminders

### P2 — Future
- [ ] Build `Love` pillar
- [ ] Refactor `server.py` (24k lines) and `MiraDemoPage.jsx`
- [ ] Remove "Skip Payment" from onboarding
- [ ] "My Custom Orders" tab in user profile
- [ ] Admin notification for new Soul Made orders

---

## 3rd Party Integrations
- OpenAI GPT-4o / Claude Sonnet — Emergent LLM Key
- Cloudinary — user API key (images, preset: tdc_custom_orders)
- Razorpay — user API key (payments)
- Gupshup — user API key (WhatsApp)
- Resend — user API key (email)
- Google Places API — for NearMe search (key in backend/.env)

---

## Pillar Color Reference

| Pillar | Color | Label | Soul Made Method | Status |
|--------|-------|-------|-----------------|--------|
| care | #40916C / G.sage | Wellness | CategoryStrip + CareContentModal | ✅ |
| celebrate | #A855F7 | Celebration | CategoryStrip + CelebrateContentModal | ✅ |
| dine | #FF8C42 | Food | CategoryStrip + DineContentModal | ✅ Needs verification |
| go | G.teal / #3498DB | Travel | CategoryStrip + GoContentModal | ✅ Needs verification |
| play | G.orange / #E76F51 | Play | CategoryStrip + PlayContentModal | ✅ Needs verification |
| learn | G.violet / #7C3AED | Learning | PersonalisedBreedSection | ✅ |
| shop | G.gold / #F59E0B | Shopping | PersonalisedBreedSection | ✅ |
| paperwork | G.teal / #0D9488 | Documents | PersonalisedBreedSection | ✅ |
| adopt | G.rose / #D4537E | Adoption | SoulMadeModal trigger after MiraPicksSection | ✅ |
| farewell | G.indigo / #6366F1 | Farewell | SoulMadeModal trigger (In memory of {pet}) | ✅ |
| services | #0EA5E9 | Services | PersonalisedBreedSection | ✅ |
| emergency | #EF4444 | Safety | SoulMadeModal trigger after MiraPicksSection | ✅ |
| advisory | #10B981 | Advisory | EXCLUDED | ❌ |

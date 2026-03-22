# Pet Life OS — Product Requirements Document
_Last updated: 2026-03-22_

## Original Problem Statement
1. Import and map 2,409 products from CSV to respective pillars without hardcoding.
2. Run AI background engine to assign pillars to remaining pending products.
3. Integrate AI Mockup generation tool in Admin panel for new product types.
4. Implement "Wow" Custom Order / Photo Delivery — Soul Made feature.
5. Fix `/services` page to use Universal Concierge ticketing flow.
6. Fix Soul Picks to display actual product mockups (`image_url`), not watercolour dog portraits.
7. Add styled Soul Made trigger button to 11 pillar pages (excluding Emergency & Advisory).

**Core Rule:** ALL service bookings and custom order requests MUST route through `service_desk_tickets` via Universal Concierge flow (`attach_or_create_ticket`).

---

## Architecture

```
/app
backend/
    server.py                       # Main app (24k lines — needs splitting P2)
    app/api/mockup_routes.py        # AI pillar assignment + breed product management
frontend/
    src/
        components/
            SoulMadeModal.jsx        # Soul Made 4-step custom order modal
            ProductCard.jsx          # Fixed: mockup_url/cloudinary_url fallback
            PillarSoulProfile.jsx    # Fixed: textarea for free-text soul questions
            admin/
                SoulProductsManager.jsx  # Added: "Add Single Product" form
            common/
                MiraImaginesBreed.jsx  # Added: go/emergency/play/paperwork/adopt/farewell cards
        hooks/
            useConcierge.js          # Universal hook: request() creates service desk tickets
        pages/
            CelebratePageNew.jsx    # Soul Made styled trigger (purple #A855F7)
            CareSoulPage.jsx        # Soul Made styled trigger (sage G.sage)
            DineSoulPage.jsx        # Soul Made styled trigger (#FF8C42)
            GoSoulPage.jsx          # Soul Made styled trigger (teal G.teal)
            PlaySoulPage.jsx        # Soul Made styled trigger (orange G.orange)
            LearnSoulPage.jsx       # Soul Made styled trigger (violet G.violet)
            ShopSoulPage.jsx        # Soul Made styled trigger (gold G.gold)
            PaperworkSoulPage.jsx   # Soul Made styled trigger (teal G.teal)
            AdoptSoulPage.jsx       # Soul Made styled trigger (rose G.rose)
            FarewellSoulPage.jsx    # Soul Made styled trigger (indigo G.indigo) + CUSTOM TEXT
            ServicesSoulPage.jsx    # Soul Made styled trigger (#0EA5E9)
            EmergencySoulPage.jsx   # NO Soul Made (removed)
            AdvisoryPage.jsx        # NO Soul Made (never added)
```

---

## What's Been Implemented

### Phase 1 — Data Foundation
- CSV import: 2,409 products mapped to pillars in `breed_products`
- AI auto-assign: GPT batch for remaining ~756 pending products (restarted 2026-03-22)
- DB fix: 1,778 products — `mockup_url` copied to `image_url` (all breeds/pillars)

### Phase 2 — Admin Panel
- AI Mockup generation: fixed stuck running flag, restarted successfully
- Admin Soul Products: "Add Single Product" form added (breed + pillar + price + image)

### Phase 3 — Soul Picks Display
- ProductCard.jsx: `mockup_url`/`cloudinary_url` fallback BEFORE breed illustration
- CelebrateContentModal.jsx: Breed Cakes sorted pet's breed first
- Soul Picks: All 14+ celebrate products show real Cloudinary mockups

### Phase 4 — Emergency Page
- EmergencySoulPage: fetch + render "Emergency Kit for {pet}" section
- 9 emergency products show for Indie with real mockup images
- DimExpanded: falls back to breedProducts when pillar-products catalogue is empty
- MiraImaginesBreed: Added emergency/go/play/paperwork/adopt/farewell pillar cards

### Phase 5 — Soul Made (Modal)
- SoulMadeModal.jsx: 4-step modal (Pick product -> Upload photo -> Write message -> Done)
- Backend: `POST /api/upload/image` endpoint for photo upload (Cloudinary preset: tdc_custom_orders)
- All custom orders route through Universal Concierge -> service_desk_tickets

### Phase 6 — Soul Made Styled Trigger Buttons (2026-03-22)
- Replaced basic pill buttons with styled card-like div triggers on ALL 11 pillar pages
- Each trigger uses pillar-specific color with subtle background tint and border
- Farewell pillar has custom text: "In memory of {petName} — create something meaningful"
- Emergency and Advisory pillars explicitly excluded (no Soul Made)
- LearnSoulPage and ServicesSoulPage: NEW Soul Made integration added (import + state + trigger + modal)
- 100% test pass rate across all 11 pillars + Emergency exclusion verified

### Phase 7 — UI Fixes
- PillarSoulProfile: Free-text soul questions now show textarea input
- Services page: Universal Concierge flow, not generic buttons

---

## Key Technical Concepts
- **Universal Concierge Flow**: All requests -> `POST /api/service_desk/attach_or_create_ticket` -> Admin Service Desk
- **Image Priority**: `image_url` -> `mockup_url` -> `cloudinary_url` -> breed illustration -> placeholder
- **Soul Picks**: `GET /api/mockups/breed-products?breed={breed}&pillar={pillar}` -> product grid
- **Soul Made Trigger**: Styled div with `data-testid="soul-made-trigger"`, pillar color + subtitle text, opens SoulMadeModal on click

---

## DB Schema
- `breed_products`: `{id, breed, pillar, name, product_type, price, image_url, mockup_url, active}`
- `services_master`: `{id, pillar, price, features}`
- `service_desk_tickets`: main collection for all concierge interactions

---

## Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` (at `/admin`)

---

## Prioritized Backlog

### P1 — Next Sprint
- [ ] Add "3 vets near you" context to daily health WhatsApp reminders (NearMe API at scheduler time)
- [ ] Extend scheduler for Medication refill reminders

### P2 — Future
- [ ] Build `Love` pillar (post-launch)
- [ ] Refactor `MiraDemoPage.jsx` and `server.py` (24,000+ lines)
- [ ] Remove "Skip Payment" from onboarding (post soft-launch)
- [ ] Add "My Custom Orders" tab in user profile for order tracking
- [ ] Add admin notification banner/chime in Service Desk for new Soul Made orders

---

## 3rd Party Integrations
- OpenAI GPT-4o / Claude Sonnet — Emergent LLM Key
- Cloudinary — user API key (images)
- Razorpay — user API key (payments)
- Gupshup — user API key (WhatsApp)
- Resend — user API key (email)

## Pillar Color Reference
| Pillar | Color | Label | Soul Made |
|--------|-------|-------|-----------|
| care | #40916C / G.sage | Wellness | Yes |
| dine | #C9973A / #FF8C42 | Food | Yes |
| go | #3498DB / G.teal | Travel | Yes |
| play | #E76F51 / G.orange | Play | Yes |
| learn | #7C3AED / G.violet | Learning | Yes |
| celebrate | #A855F7 | Celebration | Yes |
| shop | #F59E0B / G.gold | Shopping | Yes |
| paperwork | #0D9488 / G.teal | Documents | Yes |
| adopt | #65A30D / G.rose | Adoption | Yes |
| farewell | #8B5CF6 / G.indigo | Farewell | Yes (custom text) |
| services | #0EA5E9 | Services | Yes |
| emergency | #EF4444 | Safety | NO |
| advisory | #10B981 | Advisory | NO |

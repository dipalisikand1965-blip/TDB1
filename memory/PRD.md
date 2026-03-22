# Pet Life OS — Product Requirements Document
_Last updated: 2026-03-22_

## Original Problem Statement
1. Import and map 2,409 products from CSV to respective pillars without hardcoding.
2. Run AI background engine to assign pillars to remaining pending products.
3. Integrate AI Mockup generation tool in Admin panel for new product types.
4. Implement "Wow" Custom Order / Photo Delivery — Soul Made feature.
5. Fix `/services` page to use Universal Concierge ticketing flow.
6. Fix Soul Picks to display actual product mockups (`image_url`), not watercolour dog portraits.
7. Add styled Soul Made trigger button INSIDE Soul Picks section on all pillar pages (excluding Emergency & Advisory).

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
            common/
                PersonalisedBreedSection.jsx  # Shared breed products + Soul Made trigger
            celebrate/
                CelebrateContentModal.jsx     # Celebrate soul-picks + Soul Made trigger
            admin/
                SoulProductsManager.jsx       # Added: "Add Single Product" form
            common/
                MiraImaginesBreed.jsx         # Added: go/emergency/play/paperwork/adopt/farewell cards
        hooks/
            useConcierge.js          # Universal hook: request() creates service desk tickets
        pages/
            CelebratePageNew.jsx    # Uses CelebrateContentModal for Soul Picks trigger
            CareSoulPage.jsx        # Uses PersonalisedBreedSection (DimExpanded)
            DineSoulPage.jsx        # Uses PersonalisedBreedSection (DimExpanded)
            GoSoulPage.jsx          # Uses PersonalisedBreedSection (DimExpanded)
            PlaySoulPage.jsx        # Uses PersonalisedBreedSection (DimExpanded)
            LearnSoulPage.jsx       # Uses PersonalisedBreedSection (Personalised tab)
            ShopSoulPage.jsx        # Uses PersonalisedBreedSection
            PaperworkSoulPage.jsx   # Uses PersonalisedBreedSection (DimExpanded)
            AdoptSoulPage.jsx       # Uses PersonalisedBreedSection
            FarewellSoulPage.jsx    # Uses PersonalisedBreedSection (custom "In memory of" text)
            ServicesSoulPage.jsx    # Uses PersonalisedBreedSection
            EmergencySoulPage.jsx   # NO Soul Made (removed)
            AdvisoryPage.jsx        # NO Soul Made (never added)
```

---

## What's Been Implemented

### Phase 1 — Data Foundation
- CSV import: 2,409 products mapped to pillars in `breed_products`
- AI auto-assign: GPT batch for remaining ~756 pending products
- DB fix: 1,778 products — `mockup_url` copied to `image_url`

### Phase 2 — Admin Panel
- AI Mockup generation: fixed stuck running flag, restarted
- Admin Soul Products: "Add Single Product" form added

### Phase 3 — Soul Picks Display
- ProductCard.jsx: `mockup_url`/`cloudinary_url` fallback BEFORE breed illustration
- Soul Picks: All 14+ celebrate products show real Cloudinary mockups

### Phase 4 — Emergency Page
- EmergencySoulPage: fetch + render "Emergency Kit for {pet}" section
- 9 emergency products show for Indie with real mockup images

### Phase 5 — Soul Made Modal
- SoulMadeModal.jsx: 4-step modal (Pick → Upload photo → Write message → Done)
- Backend: `POST /api/upload/image` (Cloudinary preset: tdc_custom_orders)
- All custom orders → Universal Concierge → service_desk_tickets

### Phase 6 — Soul Made Trigger INSIDE Soul Picks (2026-03-22)
- **PersonalisedBreedSection.jsx**: Added Soul Made trigger at bottom of breed products grid + in empty state
  - Supports all pillar colors via PILLAR_COLORS lookup
  - Farewell pillar gets custom text: "In memory of {petName} — create something meaningful"
  - Trigger available even when no breed products exist yet
- **CelebrateContentModal.jsx**: Added trigger inside soul-picks category section
- **Removed all standalone triggers** from 11 page bodies
- **Cleaned up**: SoulMadeModal imports + soulMadeOpen state from all pages
- **PersonalisedBreedSection added to**: Learn, Farewell, Shop, Adopt, Services pages
- Emergency and Advisory pillars excluded

---

## Key Technical Concepts
- **Soul Made Trigger Architecture**: Lives inside `PersonalisedBreedSection` (most pillars) and `CelebrateContentModal` (Celebrate). NOT on the page body.
- **Universal Concierge Flow**: All requests → `POST /api/service_desk/attach_or_create_ticket` → Admin Service Desk
- **Image Priority**: `image_url` → `mockup_url` → `cloudinary_url` → breed illustration → placeholder

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
- [ ] Add admin notification banner in Service Desk for new Soul Made orders

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
| care | #40916C / G.sage | Wellness | PersonalisedBreedSection |
| dine | #C9973A | Food | PersonalisedBreedSection |
| go | #1ABC9C / G.teal | Travel | PersonalisedBreedSection |
| play | #E76F51 / G.orange | Play | PersonalisedBreedSection |
| learn | #7C3AED / G.violet | Learning | PersonalisedBreedSection |
| celebrate | #A855F7 | Celebration | CelebrateContentModal |
| shop | #F59E0B / G.gold | Shopping | PersonalisedBreedSection |
| paperwork | #0D9488 / G.teal | Documents | PersonalisedBreedSection |
| adopt | #65A30D / G.rose | Adoption | PersonalisedBreedSection |
| farewell | #8B5CF6 / G.indigo | Farewell | PersonalisedBreedSection (custom text) |
| services | #0EA5E9 | Services | PersonalisedBreedSection |
| emergency | #EF4444 | Safety | NO |
| advisory | #10B981 | Advisory | NO |

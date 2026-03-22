# Pet Life OS — Product Requirements Document
_Last updated: 2026-03-22_

## Original Problem Statement
1. Import and map 2,409 products from CSV to respective pillars without hardcoding.
2. Run AI background engine to assign pillars to remaining pending products.
3. Integrate AI Mockup generation tool in Admin panel for new product types.
4. Implement "Wow" Custom Order / Photo Delivery — Soul Made™ feature.
5. Fix `/services` page to use Universal Concierge ticketing flow.
6. Fix Soul Picks to display actual product mockups (`image_url`), not watercolour dog portraits.

**Core Rule:** ALL service bookings and custom order requests MUST route through `service_desk_tickets` via Universal Concierge flow (`attach_or_create_ticket`).

---

## Architecture

```
/app
├── backend/
│   ├── server.py                       # Main app (24k lines — needs splitting P2)
│   ├── app/api/mockup_routes.py        # AI pillar assignment + breed product management
│   └── app/api/custom_order_routes.py  # DELETED (orphaned — all goes to service desk)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── SoulMadeModal.jsx        # NEW: Soul Made™ 4-step custom order modal
    │   │   ├── ProductCard.jsx          # Fixed: mockup_url/cloudinary_url fallback
    │   │   ├── PillarSoulProfile.jsx    # Fixed: textarea for free-text soul questions
    │   │   ├── admin/
    │   │   │   └── SoulProductsManager.jsx  # Added: "Add Single Product" form
    │   │   ├── celebrate/
    │   │   │   ├── CelebrateContentModal.jsx
    │   │   │   ├── ProductDetailModal.jsx
    │   │   │   └── ConciergeIntakeModal.jsx
    │   │   └── common/
    │   │       └── MiraImaginesBreed.jsx  # Added: go/emergency/play/paperwork/adopt/farewell cards
    │   └── pages/
    │       ├── CelebratePageNew.jsx    # Wired: SoulMadeModal
    │       ├── CareSoulPage.jsx        # Wired: SoulMadeModal
    │       ├── EmergencySoulPage.jsx   # Wired: SoulMadeModal + MiraImaginesBreed + Emergency Kit
    │       ├── DineSoulPage.jsx        # Wired: SoulMadeModal
    │       ├── GoSoulPage.jsx          # Wired: SoulMadeModal
    │       ├── PlaySoulPage.jsx        # Wired: SoulMadeModal
    │       ├── PaperworkSoulPage.jsx   # Wired: SoulMadeModal
    │       ├── FarewellSoulPage.jsx    # Wired: SoulMadeModal
    │       ├── AdoptSoulPage.jsx       # Wired: SoulMadeModal
    │       └── ShopSoulPage.jsx        # Wired: SoulMadeModal
```

---

## What's Been Implemented

### Phase 1 — Data Foundation ✅
- CSV import: 2,409 products mapped to pillars in `breed_products`
- AI auto-assign: GPT batch for remaining ~756 pending products (restarted 2026-03-22)
- DB fix: 1,778 products — `mockup_url` copied to `image_url` (all breeds/pillars)

### Phase 2 — Admin Panel ✅
- AI Mockup generation: fixed stuck running flag, restarted successfully
- Admin Soul Products: "Add Single Product" form added (breed + pillar + price + image)
- New Product Type: AI mockup generation per breed type

### Phase 3 — Soul Picks Display ✅
- ProductCard.jsx: `mockup_url`/`cloudinary_url` fallback BEFORE breed illustration
- CelebrateContentModal.jsx: Breed Cakes sorted pet's breed first, AI dummies deactivated
- Soul Picks: All 14+ celebrate products show real Cloudinary mockups
- Farewell page: Removed "Indie" tab bleed

### Phase 4 — Emergency Page ✅
- EmergencySoulPage: fetch + render "Emergency Kit for {pet}" section
- 9 emergency products show for Indie with real mockup images
- DimExpanded: falls back to breedProducts when pillar-products catalogue is empty
- MiraImaginesBreed: Added emergency/go/play/paperwork/adopt/farewell pillar cards

### Phase 5 — Soul Made™ ✅
- SoulMadeModal.jsx: 4-step modal (Pick product → Upload photo → Write message → Done)
- Wired to ALL 10 pillar pages with pillar-specific colors and labels
- Backend: `POST /api/upload/image` endpoint for photo upload
- All custom orders route through Universal Concierge → service_desk_tickets

### Phase 6 — UI Fixes ✅
- PillarSoulProfile: Free-text soul questions now show textarea input
- Services page: Universal Concierge flow, not generic buttons
- ProductCard: Removed "Often paired with" text and "Soul Made" badges

---

## Key Technical Concepts
- **Universal Concierge Flow**: All requests → `POST /api/service_desk/attach_or_create_ticket` → Admin Service Desk
- **Image Priority**: `image_url` → `mockup_url` → `cloudinary_url` → breed illustration → placeholder
- **Soul Picks**: `GET /api/mockups/breed-products?breed={breed}&pillar={pillar}` → product grid

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

### P0 — Immediate
- [ ] Verify SoulMadeModal Step 2 (photo upload) works end-to-end with Cloudinary

### P1 — Next Sprint
- [ ] Add "3 vets near you" context to daily health WhatsApp reminders
- [ ] Paperwork Mira Picks badge shows "Makes celebrations special" — wrong pillar text

### P2 — Future
- [ ] Extend scheduler for Medication refill reminders
- [ ] Build `Love` pillar
- [ ] Refactor `MiraDemoPage.jsx` (5,400+ lines) and `server.py` (24,000+ lines)
- [ ] Remove "Skip Payment" from onboarding (post soft-launch)
- [ ] Add "My Custom Orders" tab in user profile

---

## 3rd Party Integrations
- OpenAI GPT-4o / Claude Sonnet — Emergent LLM Key
- Cloudinary — user API key (images)
- Razorpay — user API key (payments)
- Gupshup — user API key (WhatsApp)
- Resend — user API key (email)

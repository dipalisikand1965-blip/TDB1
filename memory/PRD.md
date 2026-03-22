# The Doggy Company — Pet Life OS — PRD

## Original Problem Statement
Build a universal, soulful platform for dog parents: **The Doggy Company's Pet Life OS**. A cohesive system spanning adoption, care, celebration, dining, learning, play, emergency, paperwork, farewell, and travel — powered by AI (Mira) and concierge services.

**Session Focus:** CSV pillar import, AI mockup generation, Custom Order WOW feature.

---

## Core Architecture
```
/app
├── backend/
│   ├── server.py                            # Main app (24K+ lines)
│   ├── breed_catalogue.py                   # Breed product fetching
│   └── app/api/
│       ├── mockup_routes.py                 # AI mockup generation + auto-assign pillars
│       ├── custom_order_routes.py           # Custom Order + Photo Upload (NEW)
│       └── bundle_routes.py                 # Product bundles
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/SoulProductsManager.jsx  # AI Mockups admin (CRUD, CSV, Generation)
    │   │   ├── celebrate/
    │   │   │   ├── CelebrateContentModal.jsx  # Soul Picks modal
    │   │   │   ├── CustomOrderFlow.jsx        # Custom Order WOW feature (NEW)
    │   │   │   └── ProductDetailModal.jsx     # Product detail with Customise btn
    │   │   └── ProductCard.jsx                # Universal product card with CustomOrder
    │   └── pages/
    │       ├── ShopSoulPage.jsx               # Load More pagination
    │       └── [Pillar]SoulPage.jsx           # Tabbed products per pillar
```

---

## What's Been Implemented

### Session: Mar 22, 2026
1. **CSV Pillar Import (2,409 products)** — DONE
   - Imported user-provided CSV mapping all products to pillars
   - Admin can re-import via `POST /api/admin/breed-products/import`
   - All 3,826 breed_products now have `pillar` and `pillars` fields assigned
   - Frontend shows products breed-wise under correct pillar pages

2. **AI Auto-Assign Pillars** — DONE
   - Built rule-based + keyword matching for auto-assigning pillars
   - Endpoint: `POST /api/mockups/auto-assign-pillars` (background)
   - Status: `GET /api/mockups/pillar-assign-status`
   - All products now have pillars (0 remaining without)

3. **AI Mockup Generation for New Product Types** — DONE
   - Admin "New Product Type" wired to generate AI images via GPT Image
   - Endpoint: `POST /api/mockups/generate-product-type` (background)
   - Generates professional mockup images per breed per product type
   - Status polling + stop functionality
   - Progress bar in Admin UI

4. **Custom Order + Photo Delivery (WOW Feature)** — DONE
   - Multi-step custom order flow: Preview → Upload Photo → Personalise → Confirm
   - Photo upload to Cloudinary (quality:100, max 10MB, JPG/PNG/HEIC)
   - Creates Service Desk ticket with full context (photos, notes, product ref, pet profile)
   - Admin sees everything needed to send to printer/baker
   - Concierge pricing (no upfront cost, admin shares price offline)
   - Delivery estimate matrix by product type
   - "Customise with [Pet]'s Photo" button in every Soul product detail modal
   - Backend: `POST /api/custom-orders`, `GET /api/custom-orders`, `PATCH /api/custom-orders/{id}/status`

### Previous Sessions (Summary)
- Watercolour portrait filtering (`is_mockup` logic)
- SoulMadeCollection carousels removed from tabbed pages
- Admin CSV exports with filters
- Breed Products CRUD tab
- `sub_category` auto-mapping for 4,071 products
- `is_active` → `active` DB migration (3,600+ products exposed)
- Load More pagination for Soul Products
- Emergency/Farewell/Adopt pillar product clicks + concierge tickets

---

## Key Technical Concepts
- **Image Filtering (`is_mockup`)**: Legitimate mockups have URLs starting with `breed-`. Portraits start with `soul-` or `bp-`.
- **Pillar Field**: `pillar` (primary), `pillars` (array, for multi-pillar products). All endpoints filter using `pillars` with `$in`.
- **Custom Orders**: Creates entry in `custom_orders` + `service_desk_tickets` collections. Photos stored permanently on Cloudinary.

---

## Key API Endpoints
- `GET /api/mockups/breed-products?breed={breed}&pillar={pillar}` — Soul Products
- `POST /api/admin/breed-products/import` — CSV re-import
- `POST /api/mockups/generate-product-type` — AI mockup generation
- `POST /api/mockups/auto-assign-pillars` — Auto-assign pillars
- `POST /api/custom-orders` — Create custom order
- `POST /api/custom-orders/upload-photo` — Upload pet photo
- `GET /api/custom-orders` — List orders
- `PATCH /api/custom-orders/{order_id}/status` — Update order status

---

## DB Collections
- `breed_products`: {breed, pillar, pillars[], product_type, mockup_url, cloudinary_url, is_mockup, is_active, active, name, price, sub_category, category}
- `custom_orders`: {order_id, status, product{}, pet{}, customer{}, photo_urls[], personalisation_notes, special_text}
- `service_desk_tickets`: {ticket_id, type, status, priority, subject, description, photo_urls[], order_id, tags[]}

---

## Prioritized Backlog

### P1 (Upcoming)
- Admin: "Generate All Pending for Breed" button to batch-generate remaining 756 pending products
- Add "3 vets near you" context to daily health WhatsApp reminders

### P2 (Future)
- Build the `Love` pillar
- Extend scheduler for Medication refill reminders
- Refactor MiraDemoPage.jsx (5,400+ lines)
- Refactor server.py (24K+ lines)
- Remove "Skip Payment" from onboarding
- WhatsApp "BOOK" keyword handler
- Activate inactive breeds: indian_spitz, labradoodle, maltipoo

---

## 3rd Party Integrations
- OpenAI GPT-4o / Claude Sonnet (Emergent LLM Key)
- Cloudinary (Images) — User API Key
- Razorpay (Payments) — User API Key
- Gupshup (WhatsApp) — User API Key
- Resend (Email) — User API Key

## Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` (at `/admin`)

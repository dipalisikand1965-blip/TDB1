# Pet Life OS — Product Requirements Document
_Last updated: 2026-03-27 · The Doggy Company™_

## Original Problem Statement
Build a full-featured Pet Life OS with 13+ pillar pages, AI-powered product recommendations (Mira), breed-specific merchandise (Soul Made™), and a universal custom order flow across all pillars. Core rule: ALL service bookings and custom orders MUST route through `service_desk_tickets` via Universal Concierge (`attach_or_create_ticket`).

---

## Architecture

```
/app
backend/
    server.py                        # Monolithic main app (~24k lines — P2: refactor needed)
    unified_product_box.py           # Unified Product Box API (products_master)
    nearby_places_routes.py          # /api/nearby/* + /api/nearme/search
    app/api/mockup_routes.py         # Breed products API (flat_only, skip, search, total)
    ai_image_service.py              # AI image generation service
    breed_catalogue.py               # BREED_ALIASES map (spaces vs underscores)

frontend/src/
    components/
        SoulMadeModal.jsx            # 4-step custom order modal (700px, 2-col grid)
        ProductCard.jsx              # overrideImageUrl + artStyleLabel props, service CTA
        CartSidebar.jsx              # Flat art illustration thumbnail + Clear Cart button
        UnifiedCheckout.jsx          # Mira also recommends — breed filter (50+ breeds)
        common/
            FlatArtPickerCard.jsx    # Product card → modal with illustration picker → Add to Cart
        admin/
            AIImagePromptField.jsx   # Reusable AI image generation widget (all editors)
            BreedCakeManager.jsx     # Admin: cake gallery + Flat Art tab
            SoulProductsManager.jsx  # Admin: AI soul products + pagination + search
            ProductBoxEditor.jsx     # Fixed product_type read order + AIImagePromptField
            UnifiedProductBox.jsx    # Active/inactive toggle on product rows
            BundlesManager.jsx       # Active/inactive toggle + AIImagePromptField
            ServicesManager.jsx      # AIImagePromptField added
        dine/DineContentModal.jsx    # Fixed tabs, Watercolour/Flat Art toggle + FlatArtPickerCard
        go/GoContentModal.jsx        # Fixed filter, toggle + FlatArtPickerCard
        play/PlayContentModal.jsx    # Fixed tabs/filter, toggle + FlatArtPickerCard
        celebrate/CelebrateContentModal.jsx  # Toggle + FlatArtPickerCard
    utils/
        blankTemplates.js            # 24 blank product template URLs (one per product shape)
    context/
        CartContext.js               # CART_VERSION=2 guard — auto-wipes stale localStorage
    hooks/
        useConcierge.js              # Universal request() → service desk tickets
    pages/
        CelebratePageNew.jsx         # Shimmer skeleton while Mira picks load
        CareSoulPage.jsx             # Shimmer skeleton while picks load
```

---

## DB Collections

| Collection | Count | Admin Panel |
|---|---|---|
| `products_master` | 5,151 (incl. 20 flat art templates) | /admin → Product Box |
| `breed_products` | 3,448 (watercolour soul + Yappy cake illustrations) | /admin → Soul Products → CRUD |
| `services_master` | 1,025 | /admin → Service Box |
| `bundles` | 96 | /admin → Bundles |
| `service_desk_tickets` | Growing | /admin → Service Desk |

**breed_products breakdown:**
- Watercolour soul mockups: ~3,285 (50 breeds × ~80 product types)
- Birthday cake illustrations (Yappy faces): 163 (50 breeds × 3–6 colour variants)
- Flat art Cloudinary overlays: **DELETED** (clashed with watercolour style)

---

## Credentials
- User: `dipali@clubconcierge.in` / `test123`
- Admin: `aditya` / `lola4304` at `/admin`
- App: `https://flat-art-picker.preview.emergentagent.com`
- MongoDB: `mongodb://localhost:27017` / DB: `pet-os-live-test_database`

---

## Flat Art System — Current State (CRITICAL FOR NEXT AGENT)

### Three-part system:
1. **163 Yappy cake illustrations** in `breed_products` (`product_type=birthday_cake`), 50 breeds × 3–6 variants
2. **20 flat art template products** in `products_master` (`soul_tier=flat_art`, IDs: `flat-art-flat_art_mug-template` etc.)
3. **24 blank product templates** — URLs in `/app/frontend/src/utils/blankTemplates.js`

### UX Flow (Watercolour / Flat Art toggle):
1. Customer opens Soul Made in any ContentModal (Dine/Go/Play/Celebrate)
2. Sees toggle: 🎨 Watercolour | 🐾 Flat Art
3. **Watercolour** → standard ProductCard grid with full ProductDetailModal on click
4. **Flat Art** → FlatArtPickerCard grid (blank template image + "Choose style →" button)
5. Click on flat art card → FlatArtPickerModal opens (like ProductDetailModal)
6. Picks breed illustration variant (Ginger, Fawn, Black, Brindle, Patchy)
7. Clicks "Add to Cart — Ginger" → cart item with `customDetails.illustration_url`
8. CartSidebar shows: illustration thumbnail + "🐾 Flat Art · Ginger · Indie · For Mojo"

### Key FlatArtPickerCard bugs that were fixed:
- Wrong product added to cart → fixed by `modalProduct` snapshot at click time
- Stale `artStyle='flat_art'` persisting across navigation → reset at START of every fetch
- Birthday_cake products appearing as orderable items → filtered from soul_made grid
- Cart localStorage persisting wrong product → `CART_VERSION=2` guard auto-wipes on reload

### Future: Proper AI Mockups
Currently uses blank white product templates. Goal: 350 AI-generated images (50 breeds × 7 types) showing Yappy face ON the product. When ready, update `blankTemplates.js`.

---

## P0 — Done ✅ (This Agent Session, March 2026)

- [x] ContentModal tab bugs — no duplicate "All" tab, filter checks product_type (not just sub_category)
- [x] Watercolour/Flat Art toggle in all 4 ContentModals (Dine, Go, Play, Celebrate)
- [x] FlatArtPickerCard — proper ProductCard-style card → modal → illustration picker → Add to Cart
- [x] FlatArtPickerModal — proper portal modal (like ProductDetailModal) with illustration picker
- [x] 20 flat art template products in products_master (editable in Product Box)
- [x] 24 blank product templates generated + mapped in blankTemplates.js
- [x] CartSidebar — illustration thumbnail + breed/variant for flat art cart items
- [x] Clear Cart button added to CartSidebar header
- [x] CartContext CART_VERSION=2 guard — auto-wipes stale localStorage on page load
- [x] artStyle bug fixed — resets to 'watercolour' at START of every ContentModal fetch
- [x] birthday_cake products filtered from soul_made orderable grid
- [x] Product snapshot bug fixed — modalProduct captured at click time (stable ref)
- [x] React key stability — key={p.id || p.name || idx} on all FlatArtPickerCard grids
- [x] Admin Soul Products gallery pagination (48/page) + search bar
- [x] AI Image Prompt field in ALL 5 admin editors (generates image, saves to entity)
- [x] Universal /api/admin/generate-image endpoint
- [x] Service product cards — price hidden, "Talk to Concierge →" CTA shown
- [x] ProductBoxEditor product_type read order fixed (reads product_type before basics.product_type)
- [x] Admin stats Active count fixed (was 3, now 4730+)
- [x] Active/Inactive toggle on UnifiedProductBox rows + BundlesManager cards
- [x] Party accessories + party breed sorting (pet's breed shown first)
- [x] No-image placeholder — paw SVG icon (replaced rope tug Unsplash)
- [x] Mira picks shimmer skeleton on Celebrate + Care pages
- [x] SoulMadeModal widened to 700px, 2-column grid layout
- [x] 831 bad flat art Cloudinary overlay products deleted
- [x] Checkout "Mira also recommends" breed filter expanded to 50+ breeds
- [x] Checkout breed filter: empty breed shows products (not hides them)
- [x] Content modal bottom padding fixed (pb-80) — products no longer cut off
- [x] CloudinaryUploader added to SoulProductsManager edit modal

---

## P1 — Next Sprint (NEXT AGENT: Start Here)

- [ ] **VERIFY**: After hard refresh, cart should be empty (version guard clears stale Party Favor Pack)
- [ ] **VERIFY**: Flat art modal opens correct product when "Choose style →" clicked (not wrong product)
- [ ] **VERIFY**: Watercolour products still open ProductDetailModal correctly in all 4 ContentModals
- [ ] Add "3 vets near you" to daily health WhatsApp reminders (NearMe API at scheduler time)
- [ ] Extend scheduler for Medication refill reminders
- [ ] Mobile/iOS audit page-by-page (font sizes small, images weird on Apple devices — start with Dine → Go → Play → Celebrate → Care → Learn → Shop)

## Recently Completed (27 March 2026)

- [x] Test pets cleanup — deleted TestScoring, TestScoringWeight + duplicate Coco from `pets` collection
- [x] Cleaned 2,253 orphan records from `mira_product_scores`, 2 from `soul_score_history`, 1 from `pet_wrapped`
- [x] Closed 2 orphaned service desk tickets linked to test pets
- [x] Documentation updated (PRD.md + complete-documentation.html)
- [x] **Fix 1**: Nav pillar dropdown shake removed — clean static border, no transition bounce
- [x] **Fix 2**: Mira OS "< Pet Home" back navigation added to MiraDemoPage header
- [x] **Fix 3**: Mojo allergy data corrected — `food_allergies: chicken`, `allergy_info` now has proper vet-confirmed data
- [x] **Fix 4**: Category strip mobile tap targets enlarged (44px min-height, 78px min-width, 16px padding, 13px font)
- [x] **Fix 5**: Announcement bar enabled — "India's first Pet Life OS · Built in memory of Mystique · Now in early access"
- [x] **Fix 6**: CelebrateHero load animation changed to fade-only (removed scale bounce from SoulChip and pet avatar)
- [x] **Fix 7**: Mira OS pill nav already has proper mobile horizontal scroll (CSS verified)
- [x] **Fix 8**: Test pets removed from DB (TestScoring, TestScoringWeight, duplicate Coco)
- [x] **Fix 9**: `/custom-cake` deprecated — redirects to `/celebrate` via React Router Navigate
- [x] **P0.2 complete**: Added `favourite_treat: peanut_butter`, `birthday_quarter: q4` to Mojo's soul data
- [x] **P0.3**: `pet_breed` now included in service desk ticket creation (mira_service_desk.py)
- [x] **MiraAI multi-pet bug**: Global widget now always sends first pet's ID for multi-pet users
- [x] **Soul Made™ strip redesign**: Premium dark purple gradient card with glow CTA, applied to ALL 10 pillar locations (Celebrate×2, Dine, Go, Play, Care content modals + Adopt, Farewell, Emergency, Learn, Paperwork soul pages), now visible as cross-sell in ALL categories
- [x] **MiraChatWidget pet context fix**: Backend `/api/mira/os/stream` now reads `selected_pet_id` field + enriched pet context with vault allergies, favourite treat, personality, gender
- [x] **Emergency page chunk error**: Fixed by frontend restart (stale webpack cache)

---

## P2 — Backlog

- [ ] Universal Concierge flow verification page-by-page (tickets reach admin + notifications)
- [ ] Build `Love` pillar
- [ ] Refactor `server.py` (24k lines — split into modules)
- [ ] "My Custom Orders" tab in user profile
- [ ] Admin notification chime when new Soul Made order arrives
- [ ] Generate 350 proper flat art mockups (50 breeds × 7 product types) using GPT Image 1
- [x] Test pets cleanup — deleted TestScoring, TestScoringWeight, duplicate Coco + 2,255 orphan records (March 2026)
- [x] Duplicate pet fix — kept real Coco (pet-d2458b677a4d), deleted test duplicate (March 2026)

---

## Key API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | /api/mockups/breed-products | Breed products. Params: breed, pillar, product_type, flat_only, skip, search, limit. Returns total |
| GET | /api/mockups/breed-products?breed={}&product_type=birthday_cake&limit=10 | Yappy illustrations (3–6 per breed) |
| POST | /api/admin/generate-image | Universal AI image generator {prompt, entity_type, entity_id} |
| PATCH | /api/admin/products/{id}/toggle-active | Toggle is_active + active + visibility.status |
| GET | /api/product-box/stats | Product Box stats (active count correct now) |
| POST | /api/service_desk/attach_or_create_ticket | Universal Concierge ticket |
| GET | /api/nearme/search?query=&type= | NearMe Google Places search |
| PUT | /api/bundles/{id} | Update bundle (incl. is_active) |

---

## 3rd Party Integrations

- OpenAI gpt-image-1 — AI image generation (`/api/admin/generate-image`)
- OpenAI GPT-4o / Claude Sonnet — Emergent LLM Key (Mira AI picks)
- Cloudinary — cloud: duoapcx1p (all mockup images)
- Razorpay — payments
- Gupshup — WhatsApp
- Google Places — NearMe search

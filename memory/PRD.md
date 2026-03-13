# The Doggy Company® — Pet Life Operating System
## Product Requirements Document — MASTER
## Last Updated: March 13, 2026 (Session 4 — Celebrate Modal Fixes)

---

## THE VISION
> "We are not a commerce platform. We are a Pet Operating System. The Soul comes first."

The world's first soul-driven Pet Operating System. Every dog has a personality, lifestyle, health story — the Soul. The platform captures this and uses it to power every recommendation, every Mira response, and every concierge interaction.

**3,777 products in DB. 221+ API endpoints. 51 Soul Questions. 14 Pillars.**

---

## ✅ CELEBRATE PAGE — SOUL-FIRST REDESIGN STATUS

### Route: `/celebrate-soul` (must replace `/celebrate` once Aditya approves)

### COMPLETED ✅
1. **CelebrateHero** — Pet photo via `pet?.photo_url || pet?.image_url`, gradient avatar ring, Soul % chip, soul chips, Mira quote, spec-compliant layout
2. **CelebrateCategoryStrip** — **11 categories** (updated Mar 13): Birthday Cakes, Breed Cakes, Pupcakes & Dognuts, Desi Treats, **Frozen Treats (NEW)**, Gift Hampers, Bundles, **Party & Decor (NEW)**, **Nut Butters (NEW)**, Soul Picks, Mira's Picks
3. **SoulCelebrationPillars** — 8 pillar cards, spec-compliant
4. **MiraAskBar** — Below soul pillars, opens Mira widget
5. **CelebrateContentModal** — Fully rebuilt, responsive:
   - **Desktop**: Large centered dialog (max-w-5xl, 90vh) — Framer Motion centering bug FIXED (wrapper div pattern)
   - **Mobile**: Bottom sheet (93vh, drag handle)
   - Birthday Cakes → `celebration` category (106 products) — FIXED (was pointing to empty `cakes`)
   - Frozen Treats → `frozen-treats` category (24 products) — NEW
   - Party & Decor → `party_accessories` + `party_kits` + `celebration_addons` — NEW
   - Nut Butters → `nut-butters` category (6 products) — NEW
   - Bundles → 6 bundles, uncropped images (object-contain)
   - All product images: `object-contain` (no cropping) — FIXED
   - Close button (X) with data-testid="celebrate-modal-close"
6. **Admin CelebrateManager**:
   - Loads **308+ products** from products_master (limit=2000, comprehensive filter) — FIXED (was only 4)
   - Category dropdown FIXED (native select, no z-index issues)
   - CATEGORY_OPTIONS includes `celebration`, `frozen-treats`, `party_accessories` — UPDATED
7. **ProductCard** — `object-contain` for both thumbnail AND modal image — FIXED

### PRODUCT COUNTS — CELEBRATE UNIVERSE
| Category | Count |
|----------|-------|
| celebration (Birthday Cakes) | 106 |
| breed-cakes | 42 |
| hampers | 37 |
| dognuts (Pupcakes) | 30 |
| frozen-treats | 24 |
| desi-treats | 7 |
| nut-butters | 6 |
| party_accessories | 6 |
| celebration_addons | 6 |
| party_kits | 4 |
| **Total celebrate products** | **~279** |
### PRODUCT COUNTS — CELEBRATE UNIVERSE (Confirmed Mar 13, 2026)
| Category | DB Name | Count | Status |
|----------|---------|-------|--------|
| Birthday / Celebration Cakes | celebration | 106 | ✅ Strip tab "Birthday Cakes" |
| Breed Cakes | breed-cakes | 42 | ✅ Strip tab "Breed Cakes" |
| Gift Hampers | hampers | 37 | ✅ Strip tab "Gift Hampers" |
| Pupcakes & Dognuts | dognuts | 30 | ✅ Strip tab "Pupcakes" |
| Frozen Treats | frozen-treats | 24 | ✅ NEW Strip tab |
| Desi Treats | desi-treats | 7 | ✅ Strip tab |
| Nut Butters | nut-butters | 6 | ✅ NEW Strip tab |
| Party Accessories | party_accessories | 6 | ✅ NEW "Party & Decor" tab |
| Celebration Add-ons | celebration_addons | 6 | ✅ Part of "Party & Decor" |
| Party Kits | party_kits | 4 | ✅ Part of "Party & Decor" |
| Celebrate Bundles | (separate collection) | 6 | ✅ "Bundles" tab |
| **Total Celebrate Products** | | **~279** | |
| Admin Panel Shows | (filtered) | 308 | includes some extras |

### IN PROGRESS 🚧 — NEXT TASKS
1. **Replace `/celebrate` with `/celebrate-soul`** — once Aditya approves
2. **Standardize other pillar pages** — `/dine`, `/stay`, `/learn` using celebrate as template
3. **500 uncategorized products** — Admin needs to categorize or AI auto-categorize

---

## CRITICAL ARCHITECTURE — Celebrate Page

### File Structure
```
/app/frontend/src/
├── App.js                                    # /celebrate-soul → CelebratePageNew
├── pages/
│   ├── CelebratePageNew.jsx                  # NEW soul-first page (USE THIS)
│   └── CelebratePage.jsx                     # OLD page (still at /celebrate)
└── components/
    └── celebrate/
        ├── index.js                          # Export index
        ├── CelebrateHero.jsx                 # ✅ DONE - pet photo + soul chips + Mira quote
        ├── CelebrateCategoryStrip.jsx        # 🚧 NEEDS MORE CATEGORIES + BIGGER ICONS
        ├── CelebrateContentModal.jsx         # 🚧 NEEDS BETTER IMAGE RENDERING + BIGGER MODAL
        ├── SoulCelebrationPillars.jsx        # ✅ DONE - 8 pillars
        ├── SoulPillarExpanded.jsx            # ✅ DONE - real products
        ├── MiraCuratedBox.jsx                # ✅ DONE - birthday box
        ├── CelebrateConcierge.jsx            # ✅ DONE - drawer with tabs
        ├── GuidedCelebrationPaths.jsx        # ✅ DONE
        └── CelebrationMemoryWall.jsx         # ✅ DONE
```

### Backend (Celebrate)
```
/app/backend/celebrate_routes.py              # /api/celebrate/* endpoints
/app/frontend/src/components/admin/CelebrateManager.jsx  # Admin panel (FIXED category dropdown)
```

---

## API ENDPOINTS (Celebrate-critical)

```
GET /api/products?category={X}&limit=40              # Shopify products by category
GET /api/products?limit=500                          # All products (paginates)
GET /api/celebrate/bundles                           # 6 illustrated bundles
GET /api/celebrate/products?category={X}            # Celebrate-specific products
GET /api/mockups/breed-products?breed={slug}&pillar=celebrate&limit=20  # Breed merch
GET /api/products/admin/{product_id}                 # Update product (backend has this)
PUT /api/celebrate/admin/products/{product_id}       # Update celebrate product
```

### Breed Slug Mapping (for `/api/mockups/breed-products`)
```js
const BREED_SLUG_MAP = {
  'indian pariah': 'indie', 'indie': 'indie',
  'labrador retriever': 'labrador', 'labrador': 'labrador',
  'golden retriever': 'golden', 'golden': 'golden',
  // ... see CelebrateContentModal.jsx getBreedSlug()
};
```

---

## DESIGN TOKENS — CELEBRATE PAGE (CRITICAL — DO NOT CHANGE)

| Token | Value | Usage |
|-------|-------|-------|
| Hero bg | `linear-gradient(135deg, #1a0020 0%, #3d0060 40%, #6b0099 75%, #9b0cbf 100%)` | Hero section |
| Birthday Box bg | `linear-gradient(135deg, #1a0020, #3d0060)` | MiraCuratedBox |
| Concierge bg | `#0E0620` (FLAT, NOT gradient) | CelebrateConcierge |
| Concierge CTA | `linear-gradient(135deg, #C9973A, #F0C060)` | Gold CTA |
| Birthday Box CTA | `linear-gradient(135deg, #C44DFF, #FF6B9D)` | Purple-pink CTA |
| Pillar glow shadow | `0 0 20px rgba(196,77,255,0.25)` | Glowing pillar cards |
| Pet photo field | `pet?.photo_url \|\| pet?.image_url` | NOT `pet?.image` |
| Mira open event | `window.dispatchEvent(new CustomEvent('openMiraAI', { detail: { message, context: 'celebrate' } }))` | Open Mira |
| Add to cart event | `window.dispatchEvent(new CustomEvent('addToCart', { detail: product }))` | Add product |

---

## SOUL PILLAR COLORS (Exact, from spec)
| Pillar | Background | Dot |
|--------|-----------|-----|
| Food & Flavour 🍰 | `linear-gradient(135deg, #FFF3E0, #FFE0B2)` | `#FF8C42` |
| Play & Joy 🎾 | `linear-gradient(135deg, #FCE4EC, #F8BBD0)` | `#E91E63` |
| Social & Friends 🦋 | `linear-gradient(135deg, #F3E5F5, #E1BEE7)` | `#9C27B0` |
| Adventure & Move 🌅 | `linear-gradient(135deg, #E3F2FD, #BBDEFB)` | `#2196F3` |
| Grooming & Beauty ✨ | `linear-gradient(135deg, #FFF9C4, #FFF176)` | `#F9A825` |
| Learning & Mind 🧠 | `linear-gradient(135deg, #E8F5E9, #C8E6C9)` | `#4CAF50` |
| Health & Wellness 💚 | `linear-gradient(135deg, #E0F7FA, #B2EBF2)` | `#00BCD4` |
| Love & Memory 📸 | `linear-gradient(135deg, #FFF3E0, #FFCCBC)` | `#FF5722` |

---

## TEST CREDENTIALS
- User: `dipali@clubconcierge.in` / `test123` (Mojo = 89% soul, chicken allergy, breed=indie)
- Admin: `aditya` / `lola4304`

---

## KNOWN ISSUES / BUGS (Not Fixed)
| Issue | Priority | Notes |
|-------|----------|-------|
| Category strip icons clipped/small | P0 | 34px icon box → need 52-62px, image bleeding outside circle |
| Product modal needs to be bigger | P0 | Increase from full-width bottom sheet to 90vh |
| 500 uncategorized products | P0 | Need to query by tags/handle and auto-assign categories |
| X button on ProductCard detail modal | P0 | ProductCard.jsx already has X, but check visibility |
| Images in product cards clipped | P1 | Use aspect-ratio: 1/1 with object-contain not object-cover |
| Treats (39), Mini Cakes (10), Frozen Treats (24), Fresh Meals (15) not in strip | P1 | Need to add tabs |
| Razorpay checkout failure | P3 | Legacy bug |
| Scrambled mobile pet dashboard | P3 | Layout bug |
| Admin Product Editor Image Upload Bug | P3 | File upload component |

---

## UPCOMING TASKS (Post Celebrate)
1. Make `/celebrate-soul` the live `/celebrate` (swap route in App.js)
2. Apply soul-first template to `/dine` pillar
3. Standardize all 14 pillars
4. CMS audit for new celebrate sections

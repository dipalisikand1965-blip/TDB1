# The Doggy Company® — Pet Life Operating System
## Product Requirements Document — MASTER
## Last Updated: March 13, 2026 (Session 3 — Critical Handoff)

---

## THE VISION
> "We are not a commerce platform. We are a Pet Operating System. The Soul comes first."

The world's first soul-driven Pet Operating System. Every dog has a personality, lifestyle, health story — the Soul. The platform captures this and uses it to power every recommendation, every Mira response, and every concierge interaction.

**3,777 products in DB. 221+ API endpoints. 51 Soul Questions. 14 Pillars.**

---

## ✅ CELEBRATE PAGE — SOUL-FIRST REDESIGN STATUS

### Route: `/celebrate-soul` (must replace `/celebrate` once Aditya approves)

### COMPLETED ✅
1. **CelebrateHero** — Pet photo via `pet?.photo_url || pet?.image_url`, gradient avatar ring (green→purple), Soul % chip, soul chips (Allergy/Loves/Personality), Mira quote, spec-compliant layout (avatar left / content right desktop, stacked mobile)
2. **CelebrateCategoryStrip** — 8 categories: Birthday Cakes, Breed Cakes, Pupcakes & Dognuts, Desi Treats, Gift Hampers, Bundles, Soul Picks, Mira's Picks. Each opens CelebrateContentModal.
3. **SoulCelebrationPillars** — 8 pillar cards (4-col grid), spec-compliant colors (glow/dim/incomplete states), badge text, glow dot
4. **MiraAskBar** — Below soul pillars, no label, input opens Mira widget via `openMiraAI` custom event
5. **CelebrateContentModal** — Fully rebuilt, responsive bottom sheet:
   - Birthday Cakes → 40+ real Shopify/TDB products with "View Details" (opens ProductCard modal)
   - Bundles → 6 illustrated bundles (Cloudinary images), each opens BundleDetailSheet
   - Soul Picks → breed products from `/api/mockups/breed-products`
   - Breed cakes, Desi Treats, Hampers, Pupcakes → real Shopify data
6. **MiraCuratedBox** — "The {PetName} Birthday Box" with CTAs to `/occasion-box?occasion=birthday`
7. **CelebrateConcierge** — FLAT `#0E0620` bg (not gradient). CTA opens drawer with Celebrate tab (TDB cakes) + Personalised tab (bundles)
8. **SoulPillarExpanded** — Real API products per pillar (tabs, allergy filtering)
9. **GuidedCelebrationPaths** — 3 paths (Birthday, Gotcha Day, Photoshoot)
10. **CelebrationMemoryWall** — Community gallery
11. **Admin CelebrateManager** — Category dropdown FIXED (was ShadCN Select with z-index bug inside Dialog → replaced with native `<select>`). Added all categories.

### IN PROGRESS 🚧 — NEXT AGENT MUST FINISH
1. **Category Strip Icon Size** — Icons look circular/clipped on mobile. Need larger round icons (62x62px or bigger) with proper image rendering. Current: 34x34px icon box with emoji. Should match spec (38x38 icon box, visible label, not truncated)
2. **Missing Categories** — Current strip has 8. The following TDB categories have products and need strip tabs:
   - `mini-cakes` (10 products) → "Mini Cakes" tab
   - `frozen-treats` (24 products) → "Frozen Treats" tab
   - `fresh-meals` (15 products) → "Fresh Meals" tab
   - `nut-butters` (6 products) → "Nut Butters" tab
   - `treats` (39 products) → "Treats & Biscuits" tab
   - `merchandise` (6 products) → potentially "Merch" tab
3. **500 Uncategorized Products** — DB has 500 products with `category: ""`. These need to be categorized. Admin needs to provide categorization OR we need an AI auto-categorization script.
4. **Product Modal Improvements:**
   - Make modal BIGGER on desktop (currently takes full width, should be max ~80% width centered, or keep bottom sheet but increase height)
   - Images should NOT be cut — use aspect-ratio preserved images (not `object-cover` cutting)
   - X button to close the PRODUCT DETAIL MODAL (the one that opens from ProductCard "View Details" — this is the ProductDetailModal in ProductCard.jsx)
   - Product grid should be scrollable smoothly on mobile
5. **All 390 Shopify products in correct categories** — many products are in wrong pillars or uncategorized
6. **Admin sync** — User wants to see the admin celebrate section and manage/reassign products

---

## PRODUCT CATEGORIES IN DATABASE (as of March 13, 2026)

| Category | Count | Notes |
|----------|-------|-------|
| (empty/uncategorized) | 500 | NEEDS FIXING |
| cakes | 104 | Birthday cakes ✅ showing |
| accessories | 67 | Various |
| breed-cakes | 40 | ✅ showing |
| treats | 39 | NOT in strip yet |
| hampers | 33 | ✅ showing |
| dognuts | 30 | ✅ showing (pupcakes category) |
| frozen-treats | 24 | NOT in strip |
| fresh-meals | 15 | NOT in strip |
| paperwork | 14 | Ignore |
| mini-cakes | 10 | NOT in strip |
| desi-treats | 7 | ✅ showing |
| nut-butters | 6 | NOT in strip |
| merchandise | 6 | Could be soul picks |

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

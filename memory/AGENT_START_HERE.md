# 🚨 AGENT START HERE - READ THIS FIRST 🚨

> **Last Updated:** March 15, 2026 (Latest Sessions: 44-50, Mar 15)
> **Purpose:** Fast, current recovery guide for the next agent

---

## 🟣 LATEST SESSIONS SUMMARY (Mar 15, 2026 — Sessions 44–50)

**What was built in this fork (current codebase state):**

### ✅ Universal Product/Service/Bundle Routing Pattern (CRITICAL — APPLIES ALL PILLARS)
Every "Mira's Picks" and product display section follows this rule:
- **Physical Products** → `ProductCard` → "View Details" → `ProductDetailModal` → **Add to Cart** → `CartSidebar` checkout
- **Services** (`product_type=service` OR `category=service`) → `ProductCard` → "Request Service" (orange button) → `ProductDetailModal` → **"Request This Service"** → POST `/api/service_desk/attach_or_create_ticket` → toast "Sent to Concierge! Handle Requests →"
- **Missing/Dream items** → `MiraImaginesCard` (dark amber, "MIRA IMAGINES" badge) → **"Request a Quote"** → concierge ticket → "Sent to Concierge!"

### ✅ Mira Score Engine (NEW — Claude Sonnet 4.6)
- **File:** `/app/backend/mira_score_engine.py`
- **Routes:** `/api/mira/*` (registered in server.py)
- **DB collection:** `mira_product_scores`
- **Schema:** `{pet_id, entity_id, entity_type (product/service/bundle), pillar, score (0-100), mira_reason, scored_at}`
- **Endpoints:**
  - `POST /api/mira/score-for-pet` → background scoring ALL entities for a pet
  - `POST /api/mira/score-context` → sync scoring for specific pillar+category (fast)
  - `GET /api/mira/scores/{pet_id}` → fetch all pre-computed scores
  - `GET /api/mira/top-picks/{pet_id}` → top-N scored items with full product data
  - `GET /api/mira/score-status/{pet_id}` → check if scores exist + when last computed
- **How it works:** Sends pet soul profile + batches of 20 items to Claude Sonnet 4.6. Returns `{id, score (0-100), reason}` per item. Stores in `mira_product_scores`. Frontend checks for pre-computed scores first (fast path), falls back to client-side `applyMiraIntelligence()`, triggers background scoring on first visit.
- **Covers:** products_master, services_master, bundles (ALL pillars, ALL entity types)

### ✅ Dine Page — Eat & Nourish Dimensions (SSOT, no hardcoding)
- `DINE_DIMS` in `DineSoulPage.jsx` now has **zero hardcoded products or tabs**
- `DimExpanded` fetches from `apiProducts` (preloaded from `/api/admin/pillar-products?pillar=dine`)
- `applyMiraIntelligence()` client-side: filters allergens, sorts loves-first, health-safe flagged, dims goal conflicts, adds `mira_hint` reason per product
- Stats bar: "✓ 12 safe · ✗ 1 filtered · ♥ 2 match Mojo's loves"
- Clicking any product → `ProductDetailModal` → Add to Cart → CartSidebar

### ✅ Dine Page — Category Pills (DineContentModal)
- 8 pills: Daily Meals, Treats & Rewards, Supplements, Frozen & Fresh, Homemade & Recipes, **Bundles**, Soul Picks, Mira's Picks
- "Bundles" is pill #6 (after Homemade) — fetches from `/api/bundles?pillar=dine`
- All pills use `ProductCard` (real, same as Celebrate) with full ProductDetailModal + cart
- Allergy chips in modal header (e.g., "Chicken-free · Treatment-safe")
- Mira quote block in each modal

### ✅ Mira's Picks in DineContentModal (SSOT + Intelligence)
- Fetches real products + services (parallel: `/api/admin/pillar-products?pillar=dine`)
- Checks pre-computed Claude scores from `mira_product_scores` (fast path when available)
- Falls back to `applyMirasPicksIntelligence()` client-side
- Generates `MiraImaginesCard`s for missing breed-relevant dream items
- Triggers background `POST /api/mira/score-for-pet` on first visit (fire-and-forget)

### ✅ Celebrate Fix
- Removed duplicate "Celebrate, Personally" heading from `CelebratePageNew.jsx`

### ✅ ProductCard.jsx (Universal)
- Detects services via `product.product_type === 'service' || product.category === 'service'`
- Orange "Request Service" card button for services
- ProductDetailModal shows "Why Mira suggests this" amber block (from `product.mira_hint`)
- ProductDetailModal shows "Request This Service" (orange) vs "Add to Cart" (pink-purple) based on type

### Key Files (latest):
- `frontend/src/components/dine/DineContentModal.jsx` — Full intelligence, Mira Imagines, pre-scored
- `frontend/src/components/dine/DineCategoryStrip.jsx` — 8 pills including Bundles
- `frontend/src/pages/DineSoulPage.jsx` — DINE_DIMS (no hardcoding), DimExpanded with applyMiraIntelligence
- `frontend/src/components/ProductCard.jsx` — Service detection, "Why Mira suggests this", concierge flow
- `backend/mira_score_engine.py` — Claude Sonnet 4.6 scoring engine
- `backend/server.py` — mira_score_router registered + set_score_engine_db(db)

### Pending (for next agent):
- Fix `CONC_SERVICES` card gradients on Dine page (all amber, need unique colors)
- Wire `MOCK_SPOTS` restaurants to actual DB collection
- Add dine product `options`/`variants` (protein/portion) for ProductDetailModal parity
- Apply universal Mira's Picks pattern to Celebrate + Care + Fit pillars
- Test Mira Score Engine E2E with real pet_id from DB

---

## 🔴 MANDATORY READ ORDER

Before changing anything, read these in order:
1. `/app/memory/AGENT_START_HERE.md`
2. `/app/memory/ARCHITECTURE.md` ← **NEW — READ THIS FOR DATA MODEL RULES**
3. `/app/memory/PRD.md`
4. `/app/memory/NEXT_AGENT_CRITICAL.md`
5. `/app/memory/COMPLETE_SESSION_HANDOFF.md`
6. `/app/memory/PILLAR_AUDIT.md`

Then review the live-served documentation target:
- `/app/frontend/public/complete-documentation.html`
- Live: `https://thedoggycompany.com/complete-documentation.html`

---

## 🔴 CRITICAL DATA ARCHITECTURE (Session 38 — Mar 15, 2026)

### CANONICAL DATA MODEL — NON-NEGOTIABLE
```
products_master  → ALL products, ALL pillars (source of truth)
services_master  → ALL services, ALL pillars (source of truth)
bundles          → ALL bundles, ALL pillars (source of truth)
```

**NEVER** create `care_products`, `dine_bundles` etc. Use master collections with `pillar` field.

**Every pillar admin** uses reusable components:
- `<PillarProductsTab pillar="X" />` — reads products_master
- `<PillarServicesTab pillar="X" />` — reads services_master
- `<PillarBundlesTab pillar="X" />` — reads bundles

**Admin edits to products** MUST set `locally_edited: True` to survive Shopify sync.

**Full architecture rules:** `/app/memory/ARCHITECTURE.md`

---

### 1. THE $1000 MOCKUP BUG MUST NEVER RETURN

Do **not** break Soul Made mockup persistence.

**Safe pattern:**
```python
await db.breed_products.update_one(
    {"id": product_id},
    {
        "$set": updatable_fields,
        "$setOnInsert": insert_only_fields
    },
    upsert=True
)
```

**File:** `/app/backend/scripts/generate_all_mockups.py`

### 2. IMAGE STYLE GOLDEN RULES

- **Products** = realistic / product photography
- **Services** = watercolor illustrations
- **Bundles** = watercolor illustrated compositions
- Keep already-good saved images; replace only bad/default/generic ones

### 3. PILLAR GOLD STANDARD ORDER

Every pillar should follow this order:
1. Ask Mira Bar
2. Topic Cards
3. Daily Tip
4. Help Buckets
5. **Soul Personalization Section** ⭐ (THE CENTERPIECE - see below)
6. Guided Paths
7. Bundles
8. Products
9. Mira Curated Layer
10. Services

Use `LearnPage.jsx` as the structural source of truth.
Use `AdoptPage.jsx` as the Soul Personalization Section template.

### 4. SOUL PERSONALIZATION SECTION - THE CENTERPIECE

**What it is:** The deeply personalized "Pet Operating System layer" that shows pillar-specific insights based on the pet's full soul profile.

**Where it appears:** Celebrate, Care, Dine, Stay, Fit, Learn, Enjoy, Travel, Shop, Advisory, Adopt
**Excluded from:** Farewell, Emergency, Paperwork

**Component:** `<SoulPersonalizationSection pillar="celebrate" />`

**Data sources for personalization:**
- `soul_archetype`: primary_archetype, archetype_name, archetype_emoji, celebration_style
- `personality`: describe_3_words, general_nature, behavior_with_dogs
- `preferences`: favorite_treats, dislikes, activity_level
- `health_data`: allergies, sensitivities, chronic_conditions
- `relationships`: dog_friends, human_favorites
- `learned_facts`: loves, prefers (from Mira conversations)
- `service_history`: grooming_preference, travel_history
- `milestones`: achievements, gotcha_day
- `travel`: crate_trained, preferred_transport

**Example personalization:**
- Celebrate: "Mojo's a social butterfly 🦋 who loves salmon treats - let's plan a fetch party with Bruno, Cookie & Max!"
- Care: "Mojo has sensitive skin and is a drama-queen - grooming should be calm & reassuring"
- Dine: "Food-motivated Mojo ❤️ salmon but avoid chicken (allergy)"

---

## ✅ CURRENT STATE (MARCH 13, 2026)

### Documentation
- `complete-documentation.html` is now generated from the **full** `/app/memory` corpus
- Current served scale is roughly **296 docs / 88k+ lines**

### Soul / Pet OS rollout completed on visible pillars
- Adopt ✅ (has full Soul Personalization Section - use as template)
- Emergency
- Advisory
- Farewell
- Learn
- Shop

### Recent structural fixes
- **Fit**: personalized section moved before guided paths
- **Dine**: personalized picks moved earlier; nearby pet-friendly spots now render live cards instead of empty skeletons

### Admin media/upload fixes completed
- Product uploads persist to `products_master`
- Product/Service new drafts can upload before save
- Bundle upload endpoint exists
- Service Box now correctly reads `image_url || watercolor_image || image`

### Service illustration cleanup completed this session
Selective watercolor regeneration finished for:
- **Celebrate** services
- **Care** services with generic stock images
- **Fit** services with generic stock images

After normalization, these pillars are now strong in Service Box:
- Celebrate
- Care
- Fit
- Advisory
- Dine
- Emergency
- Enjoy
- Learn

---

## 🟡 WHAT STILL NEEDS WORK

### Pillar structure sweep still needed
Remaining pillars that still need stricter Gold Standard review:
- Stay
- Travel
- Celebrate (full structure sweep, not just images)
- Care
- Paperwork
- Enjoy

### Service image review still needed
Do **not** blindly overwrite these. Review first, preserve good generated art:
- Stay
- Travel
- Farewell
- Adopt
- Paperwork

### Bundle image recovery still needed
- Adopt bundles: missing images
- Farewell bundles: missing images
- Advisory bundles: old/default visuals

### Core bugs still open
- Sync-to-Production `db_name` failure
- Razorpay checkout issue
- Mobile member dashboard issues

---

## TEST ACCOUNTS

| Role | Login | Password |
|------|-------|----------|
| Member | `dipali@clubconcierge.in` | `test123` |
| Admin | `aditya` | `lola4304` |

---

## QUICK COMMANDS

```bash
# Preview URL
python3 - <<'PY'
from pathlib import Path
for line in Path('/app/frontend/.env').read_text().splitlines():
    if line.startswith('REACT_APP_BACKEND_URL='):
        print(line.split('=',1)[1])
        break
PY

# Regenerate complete documentation
cd /app/backend && python3 -c "from documentation_generator import generate_complete_documentation; print(generate_complete_documentation())"

# Test login
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -s -X POST "$API_URL/api/auth/login" -H "Content-Type: application/json" -d '{"email":"dipali@clubconcierge.in","password":"test123"}'
```

---

## NEXT AGENT PRIORITY ORDER

1. Preserve current documentation + PRD truth
2. Finish the Gold Standard order sweep on remaining pillars
3. Replace only bad/default service and bundle visuals
4. Then fix Sync-to-Production / Razorpay

---

## FINAL RULE

When you complete meaningful work:
- Update `/app/memory/PRD.md`
- Update this file if priorities changed
- Regenerate `/app/frontend/public/complete-documentation.html`

Do **not** leave stale handover notes behind.

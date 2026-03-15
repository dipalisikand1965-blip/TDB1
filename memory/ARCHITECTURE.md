# The Doggy Company — Architecture Rulebook
## READ THIS FIRST — Every agent, every session, every feature

---

## THE CANONICAL DATA MODEL (NON-NEGOTIABLE)

```
MASTER COLLECTIONS — Single Source of Truth
├── products_master     → ALL products across ALL pillars
├── services_master     → ALL services across ALL pillars
├── bundles             → ALL bundles across ALL pillars
└── concierge_experiences → Experiences (own collection, own system)
```

### Rule #1: NEVER create a new pillar-specific collection for products, services, or bundles.
Bad: `care_products`, `dine_bundles`, `fit_services`
Good: `products_master` where `pillar = "care"`, `bundles` where `pillar = "dine"`

### Rule #2: Every product/service/bundle MUST have a `pillar` field.
Valid pillars: `celebrate`, `dine`, `care`, `fit`, `stay`, `travel`, `enjoy`, `learn`,
              `farewell`, `emergency`, `adopt`, `advisory`, `paperwork`

### Rule #3: Every product/service/bundle MUST have a `category` field.
This is used for sub-category filtering in each pillar's admin page.

---

## WHAT FEEDS EACH COLLECTION

| What | Goes Into | Who Writes |
|------|-----------|-----------|
| Shopify products | `products_master` | Auto-sync on startup (shopify_sync_routes.py) |
| Soul/AI products | `products_master` | Soul product generator |
| Product Box admin | `products_master` | Admin (ProductBoxManager) |
| Service Box admin | `services_master` | Admin (ServiceBoxManager) |
| Bundle admin | `bundles` | Admin (BundlesManager) |

---

## HOW EACH PILLAR ADMIN PAGE IS STRUCTURED

Every pillar manager (CareManager, DineManager, etc.) has 3 tabs:
```
Products tab  → <PillarProductsTab pillar="X" />  → reads products_master filtered by pillar
Services tab  → <PillarServicesTab pillar="X" />  → reads services_master filtered by pillar
Bundles tab   → <PillarBundlesTab pillar="X" />   → reads bundles filtered by pillar
```

### Rule #4: All pillar admins MUST use these reusable tab components.
NEVER build a custom product/service/bundle list inside a pillar manager.
Reusable components live at:
- `frontend/src/components/admin/PillarProductsTab.jsx`
- `frontend/src/components/admin/PillarServicesTab.jsx`
- `frontend/src/components/admin/PillarBundlesTab.jsx`

---

## ADMIN PANEL ROLE SEPARATION

| Admin Page | Purpose | Can Create/Edit/Delete? |
|---|---|---|
| **BundlesManager** | CRUD for ALL bundles | YES — full CRUD + image + AI gen |
| **PricingHub → Bundles** | Pricing sync view only | Inline price edit only, NO CRUD |
| **PricingHub → Products** | Pricing sync view only | Inline price edit only |
| **PricingHub → Services** | Pricing sync view only | Inline price edit only |
| **CelebrateManager → Products** | CRUD for Celebrate products | YES |
| **Each Pillar Manager** | CRUD for that pillar | YES via PillarProductsTab |
| **ServiceBox** | CRUD for ALL services | YES — full CRUD |
| **ProductBox** | CRUD for ALL products | YES — full CRUD |

### Rule #5: PricingHub is for PRICE EDITING ONLY. Never add CRUD to PricingHub.

---

## PROTECTING ADMIN CHANGES FROM SHOPIFY OVERWRITE

Shopify sync runs on every deployment and upserts products_master.
BUT: if a product has `locally_edited: True`, Shopify sync only updates `available` and `shopify_updated_at`.

### Rule #6: Every admin update/create endpoint that writes to products_master MUST set:
```python
"locally_edited": True,
"locally_edited_at": datetime.now(timezone.utc).isoformat()
```
This is already done in:
- `pillar_products_routes.py` (PUT and POST endpoints)
- `celebrate_routes.py` (admin_update_product)

If you add a new product admin endpoint, ADD THESE TWO FIELDS.

---

## BACKEND API ROUTES — CANONICAL ENDPOINTS

```
Products:
  GET  /api/admin/pillar-products?pillar=X&page=N&limit=N&search=X&category=X
  POST /api/admin/pillar-products                → create product in products_master
  PUT  /api/admin/pillar-products/{id}           → update product in products_master
  DEL  /api/admin/pillar-products/{id}           → soft-delete (active=False)

Bundles:
  GET  /api/bundles?pillar=X&page=N&limit=N&search=X&active_only=false
  POST /api/bundles                              → create bundle
  PUT  /api/bundles/{id}                         → update bundle
  DEL  /api/bundles/{id}                         → delete bundle
  POST /api/bundles/{id}/upload-image            → upload image
  POST /api/bundles/{id}/generate-image          → AI generate image

Services:
  GET  /api/service-box/services?pillar=X        → read services_master
  POST /api/service-box/services                 → create service

Celebrate Products (legacy endpoint, still works):
  GET  /api/celebrate/admin/products             → celebrate products (merged view)
  POST /api/celebrate/admin/products/{id}/generate-image → AI generate image
```

---

## DATA MIGRATION (ONE-TIME SETUP)

When deploying to a NEW environment or after adding new pillar collections:
1. Log into admin panel
2. Click **🗃️ CONSOLIDATE DATA** button
3. This migrates all pillar-specific collections → master collections (idempotent)

Backend endpoint: `POST /api/admin/consolidate-data?password=lola4304`

---

## REUSABLE COMPONENT PATTERNS

### Adding a new pillar admin:
1. Create `{Pillar}Manager.jsx`
2. Import `PillarProductsTab`, `PillarServicesTab`, `PillarBundlesTab`
3. Add 3 tabs: `<PillarProductsTab pillar="newpillar" />` etc.
4. Register in `Admin.jsx`
5. Done. NO custom product/service fetching code needed.

### AI Image Generation (correct pattern):
```javascript
const res = await fetch(`${API_URL}/api/.../generate-image`, { method: 'POST' });
const text = await res.text();                    // ALWAYS use .text() first
const data = text ? JSON.parse(text) : {};        // NEVER use res.json() directly
// reason: avoids "body stream is locked" TypeError
```

---

## FILE LOCATIONS REFERENCE

```
backend/
  pillar_products_routes.py    → Unified products API (all pillars)
  celebrate_routes.py          → Celebrate-specific product CRUD + AI image
  app/api/bundle_routes.py     → Bundle CRUD + image upload/generation
  shopify_sync_routes.py       → Shopify sync (respects locally_edited flag)
  server.py                    → Main app, startup, MASTER SYNC, CONSOLIDATE DATA

frontend/src/components/admin/
  PillarProductsTab.jsx        → Reusable products tab (search, pagination, CRUD)
  PillarServicesTab.jsx        → Reusable services tab
  PillarBundlesTab.jsx         → Reusable bundles tab
  BundlesManager.jsx           → Full bundle CRUD with search, pagination, AI gen
  CelebrateManager.jsx         → Celebrate-specific full product management
  [Pillar]Manager.jsx          → Each pillar's admin page (uses reusable tabs above)

frontend/src/components/
  PricingHub.jsx               → Pricing sync view ONLY (no CRUD)
```

---

## DATA COUNTS (as of Session 38, Mar 2026)
- `products_master`: ~5,789 products (from Shopify + pillar migrations)
- `services_master`: ~1,102 services
- `bundles`: ~111 bundles (from 13 pillar collections merged)
- Active pillars: 13 (celebrate, dine, care, fit, stay, travel, enjoy, learn, farewell, emergency, adopt, advisory, paperwork)

---

## QUICK SANITY CHECKS BEFORE FINISHING ANY FEATURE

Before marking any feature complete, verify:
- [ ] New product endpoints set `locally_edited: True`
- [ ] New pillar admin uses `PillarProductsTab` (not custom product list)
- [ ] No new pillar-specific product/service/bundle collections created
- [ ] PricingHub not modified for CRUD operations
- [ ] Bundles go through BundlesManager → `bundles` collection

---
*Last updated: Session 38, Mar 15, 2026*
*Maintained by: Every agent working on The Doggy Company codebase*

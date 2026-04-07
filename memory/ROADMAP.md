# Roadmap — The Doggy Company Platform
## Last Updated: 2026-03-25 (Session 4 — Admin Consistency + Save Fix Sprint)

**LIVE DEPLOYMENT: Day after (2026-03-26)**
**Critical path: Complete all P0 items before 6pm on 2026-03-25**

---

## CURRENT STATUS

| Layer | Status |
|---|---|
| Desktop (all 12 pillars) | ✅ PRODUCTION-READY |
| Mobile (all 12 pillars) | ✅ Functionally complete |
| Admin — Product Box | ✅ Save fixed (all fields now persist incl. Status in Pillar, Secondary Pillars) |
| Admin — 12 Pillar Managers | ✅ Consistent 7-tab structure + Quick Add |
| Admin — Service Box | ✅ 1,021 services, correct pillar mapping |
| Admin — Bundles | ✅ Working |
| Admin — Soul Products | ✅ 3,448 in breed_products, 457 in products_master |
| DB — Migration | ✅ 14,980 docs remapped to 12 pillars |
| Mira Filter | ✅ Client-side ranking by breed/size/life-stage |

---

## ✅ DONE — Sessions 1–4

| Item | Session | Status |
|---|---|---|
| Responsive split — all 12 pillars | 1 | ✅ |
| All `*MobilePage.jsx` files created | 1 | ✅ |
| Dine mobile — full DineDimensionsRail | 1 | ✅ |
| Landing page — 5 className bugs | 2 | ✅ |
| Register / Checkout / Membership fixes | 2 | ✅ |
| All 12 pillar mobile pages wired | 2 | ✅ |
| Emergency WhatsApp alert | 2 | ✅ |
| Mira product filter (`useMiraFilter.js`) | 3 | ✅ |
| Mira's pick callout + footer on grids | 3 | ✅ |
| ServiceBookingModal — 8 service types | 3 | ✅ |
| ServiceBookingModal wired to 5 mobile pages | 3 | ✅ |
| Admin: archive/delete works | 3 | ✅ |
| Admin: toggle active/inactive fixed | 3 | ✅ |
| Admin: AI image auth (no Basic Auth popup) | 3 | ✅ |
| DB migration — 14,980 docs to 12 pillars | 4 | ✅ |
| useMiraFilter.js — breed/size/life-stage | 4 | ✅ |
| Admin — 12 Pillar menu labels fixed | 4 | ✅ |
| Admin — Pillar CMS → full ProductBoxEditor | 4 | ✅ |
| Admin — Sub-category dropdowns | 4 | ✅ |
| Admin — MediaTabPanel created | 4 | ✅ |
| Admin — SoulProductsManager JSX error fixed | 4 | ✅ |
| Admin — All 12 managers: 7-tab consistency | 4 | ✅ |
| Admin — Pagination 20/page on all tabs | 4 | ✅ |
| Admin — Quick Add button (Products/Services/Bundles) | 4 | ✅ |
| Admin — ProductBox save fix (approval_status, pillar, commerce_ops, pillars_occasions) | 4 | ✅ |
| Admin — PillarServicesTab: inline Add Service | 4 | ✅ |

---

## 🔴 P0 — IMMEDIATE (Must do next)

### 1. WhatsApp Mira Intelligence Upgrade
**Plan:** `/app/memory/WHATSAPP_MIRA_INTELLIGENCE_PLAN.md`  
- Wire semantic search (9,355 products) into WhatsApp Mira response
- Load full pet soul profile (allergies, breed traits, favorites)
- GPT replies with real product names, prices, allergen awareness
- **Trigger:** After current redeploy verified working
- **Risk:** Zero — isolated to `get_mira_ai_response()` in `whatsapp_routes.py`

### 2. 2nd Redeploy (already code-ready — waiting for deploy)
- ProductCard `media.primary_image` image fix (Anxiety Relief Vest + others)
- WhatsApp prompt fixes (dog context + correct tickets collection)
- LearnNearMe suggestion handler fixes

---

## 🟠 P1 — Complete this week (Mobile Parity)

### 1. Services Import (Waiting for user confirmation)
- 46 services in old `services` collection (OLD pillar names) — NOT in services_master
- 97 services in `service_catalog` collection (OLD pillar names) — NOT in services_master
- Action: Map old pillar names → new pillar names → import to services_master
- **Blocked: User must confirm before any changes**

### 2. Fix 5 & Fix 6 in remaining Admin Modals
- Apply MediaTabPanel + Active toggle to `BreedCakeManager.jsx` inline edit panel
- **NOT YET DONE** (was interrupted by JSX error in previous session)

### 3. Admin "Add New" flows across 5 entities
- **+ Add Service** ✅ (done in PillarServicesTab)
- **+ Add Bundle** ✅ (done in PillarBundlesTab)  
- **+ Add Product** ✅ (done in PillarProductsTab)
- **+ Add Breed Product** in Soul Products — auto-generates with realistic dog mockups
- **+ New Type** in Soul Products — seeds a new product type across all breeds
- **+ Add Breed Cake** in BreedCakes — AI flat lay cake art

### 4. Mira "Explains Why" expandable card
- One tap reveals full soul profile reasoning on Dine/Care/Celebrate product cards
- **NOT YET STARTED** — User explicitly approved this feature

---

## 🟠 P1 — Complete this week (Mobile Parity)

### Mobile Sprint (Priority for tomorrow 2026-03-26)
| Mobile Feature | Status |
|---|---|
| BirthdayCountdown (Celebrate) | ❌ Not started |
| SoulCelebrationPillars (Celebrate) | ❌ Not started |
| CelebrationMemoryWall (Celebrate) | ❌ Not started |
| MiraSoulNudge (Celebrate) | ❌ Not started |
| LearnNearMe component | ❌ Not started |
| PaperworkNearMe component | ❌ Not started |
| GoNearMe component | ❌ Not started |
| Full mobile service booking on ALL pillars | ✅ Done (Care, Go, Play, Learn, Services) |

---

## 🟡 P2 — Post-deployment week

| Item | Notes |
|---|---|
| Watch & Learn YouTube sections | Care and Go pillars |
| Admin "Add New" for Breed Products | Soul Products / SoulProductsManager |
| Admin "Add New" for Breed Cakes | BreedCakeManager |
| WhatsApp Daily Digest cron | Gupshup integration |
| Medication refill reminders | WhatsApp automation |

---

## 🟢 P3 — Future

| Item | Notes |
|---|---|
| Production DB migration | Atlas IP whitelist currently BLOCKED |
| Refactor Admin.jsx | >7,000 lines — needs componentization |
| Refactor server.py | >24,000 lines — needs route splitting |
| Build Love pillar | Full CRUD + mobile page |
| Services audit — 143 old services import | After user confirmation |

---

## DATABASE STATE (2026-04-05)

| Collection | Count | Notes |
|---|---|---|
| products_master | 6,042+ | 457 soul_made, 5,585 regular |
| services_master | 1,021 | All 12 pillars mapped correctly |
| breed_products | 4,577 | Soul catalog — 4,260 active (295 freshly regenerated with breed-specific images) |
| bundles_master | ~20+ | Care and other pillars |
| services (old) | 46 | Pre-migration, OLD pillar names |
| service_catalog (old) | 97 | Pre-migration, OLD pillar names |

## BREED COVERAGE AUDIT (2026-04-05)
- **22/56 breeds HEALTHY** (≥94 products, all pillars)
- **34/56 breeds need attention** (see AGENT_RULES.md RULE 7 for full list)
- **Critical gap: `adopt` pillar only covers 35/56 breeds** — 21 breeds missing adopt products
- Average products per breed: 76.1 (vs target 94)
- Duplicate breed slugs inflating gap numbers: indie=indian_pariah, husky=siberian_husky, etc.

---

## KNOWN CONSTRAINTS

1. **Production DB**: Atlas network access blocked (local MongoDB only in preview)
2. **Soul Products**: `breed_products` → only appear on pillar pages if "Added to catalog" → `products_master`
3. **Desktop files (`*SoulPage.jsx`)**: STRICTLY LOCKED — do not modify
4. **server.py**: Never modify — fragile monolith, route splitting only in separate files
5. **DO NOT use `if collection:` in PyMongo** → always `if collection is not None:`

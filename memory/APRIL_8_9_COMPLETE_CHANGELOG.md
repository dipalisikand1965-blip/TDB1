# TDC Platform — Complete Work Log: April 8–9, 2026
## Generated: April 10, 2026
## Preview URL: https://pet-soul-ranking.preview.emergentagent.com
## Production URL: https://thedoggycompany.com (requires separate deploy + DB restore)

---

## TABLE OF CONTENTS
1. [April 8 — All Work Done](#april-8)
2. [April 9 — All Work Done](#april-9)
3. [All Files Changed — Master List](#all-files-changed)
4. [All Bugs Fixed](#all-bugs-fixed)
5. [All Features Built](#all-features-built)
6. [All Tests Run](#all-tests-run)
7. [All Database Changes](#all-database-changes)
8. [All Migration Files Re-exported](#migration-files)
9. [Current State — Preview vs Production](#current-state)
10. [What Is NOT Yet in Production](#not-in-production)
11. [Known Open Issues](#known-open-issues)
12. [Pending Items Before May 15 Launch](#pending-before-may-15)

---

## APRIL 8, 2026 {#april-8}

### 8A — Admin Box Complete Audit (Commits: ~04:08–16:30 UTC)

#### Features Built
**1. `UnifiedProductBox.jsx` — Duplicate Product Dedup Fix**
- File: `frontend/src/components/admin/UnifiedProductBox.jsx`
- Root cause: `products_master` had TWO documents with identical `id` field
  (e.g., `bp-akita-designer-bandana-969f46` existed as both old and new version)
- Fix: O(1) `Set` dedup added to supplemental breed_products merge so duplicate
  IDs are dropped before React render. Prevents duplicate React key warnings.
- Also fixed: supplemental `breed_query` now mirrors the `visibility.status` filter
  so archived breed_products cannot appear in the active admin list.

**2. `ProductCard.jsx` — "Mira Explains Why" Expandable Row (User Approved)**
- File: `frontend/src/components/ProductCard.jsx` (lines ~606–660)
- Previously: only showed `✦ MIRA PICK` if `product.mira_hint` came from DB (almost never set)
- Now: always shows expandable `✦ MIRA` row. Logic:
  ```
  miraText = product.mira_hint  (DB field — set by useMiraFilter)
           || productMiraTip    (always-computed local tip e.g. "Makes celebrations special")
           || product._miraReason
  ```
- One-tap expand reveals: `✦ WHY MIRA PICKED THIS`, rank badge (`#1 Match`),
  allergen info, breed match, life stage match
- `data-testid="mira-explains-{product.id}"` added
- Works on ALL ProductCard instances across all 12 pillars automatically

**3. `PersonalisedBreedSection.jsx` — Watercolor Image Priority**
- File: `frontend/src/components/common/PersonalisedBreedSection.jsx`
- Changed image resolver to check `watercolor_image` first (Soul Made illustrations)
  before falling back to `cloudinary_url`

**4. `AdminGuideDashboard.jsx` — Restore Database UI**
- File: `frontend/src/components/admin/AdminGuideDashboard.jsx`
- Added live restore progress polling (polls `/api/admin/db/restore-progress` every 2s)
- Shows per-collection progress: `Restoring 3/14 collections — pets`
- Shows final summary toast: `✅ Database restored + visitor tickets patched`
- "Export Database" button wired to `/api/admin/export-database`

**5. `AmazonExplorerBox.jsx` — New Component**
- File: `frontend/src/components/shop/AmazonExplorerBox.jsx`
- Standalone "browse beyond" box: user types what their dog needs,
  generates clean Amazon.in search query (pet name stripped), opens affiliate link
- Affiliate tag from `AMAZON_AFFILIATE_TAG` env var
- Added to `ShopMobilePage.jsx` and `ShopSoulPage.jsx`

**6. `ShopMobilePage.jsx` + `ShopSoulPage.jsx` — AmazonExplorerBox Integration**
- Files: `frontend/src/pages/ShopMobilePage.jsx`, `frontend/src/pages/ShopSoulPage.jsx`
- AmazonExplorerBox placed in Shop page below main product grid

**7. `DineMobilePage.jsx` + `DineSoulPage.jsx` — Mira Filter Improvements**
- Files: `frontend/src/pages/DineMobilePage.jsx`, `frontend/src/pages/DineSoulPage.jsx`
- Updated to use latest `applyMiraFilter` from `useMiraFilter.js`
- Health condition filtering now applied to Dine products

**8. `CelebrateMobilePage.jsx` — Mira Filter**
- File: `frontend/src/pages/CelebrateMobilePage.jsx`
- `applyMiraFilter` applied to Mira-curated birthday products
- `mira_hint` displayed on celebration product cards

**9. `GuidedCarePaths.jsx` / `GuidedNutritionPaths.jsx` / `GuidedCelebrationPaths.jsx`**
- Files:
  - `frontend/src/components/care/GuidedCarePaths.jsx`
  - `frontend/src/components/dine/GuidedNutritionPaths.jsx`
  - `frontend/src/components/celebrate/GuidedCelebrationPaths.jsx`
- Wired to read `pet.healthCondition` from context
- Pass condition to product display logic for safety filtering

**10. `MiraSearchPage.jsx` — 7 Service Modal Triggers**
- File: `frontend/src/pages/MiraSearchPage.jsx`
- 7 keyword-triggered modals wired:
  - `GroomingFlowModal` → "grooming/groom/bath/spa/trim/nail"
  - `VetVisitFlowModal` → "vet/checkup/vaccine/doctor/consult"
  - `ServiceBookingModal(boarding)` → "boarding/daycare/pet-sitting"
  - `ServiceBookingModal(training)` → "training/train/obedience"
  - `GoConciergeModal` → "walk/hike/transport/trip/travel"
  - `ServiceConciergeModal(celebrate)` → "birthday/celebrate/party"
  - `ServiceConciergeModal(learn)` → "class/lesson/course/learn"

**11. `products_master.json.gz` — Re-exported**
- File: `backend/migration_data/products_master.json.gz`
- Re-exported twice: 16:16 UTC and 16:25 UTC (April 8)
- Contains 9,358 products (Shopify sync + soul products)

**12. `imageless_products.csv` — Audit Output**
- File: `imageless_products.csv`
- Generated audit of products in `products_master` without images
- For Aditya's review — not imported back

---

## APRIL 9, 2026 {#april-9}

### 9A — AI Image Service + Admin Fixes (Commits: ~02:00–11:00 UTC)

**13. `ai_image_service.py` — Motor AsyncIO Fix**
- File: `backend/ai_image_service.py`
- Root cause: Used `db.products_master.find(...)` on Motor's `AsyncIOMotorCollection`
  but also had truthiness check `if db:` which throws `NotImplementedError` in PyMongo/Motor
- Fix: Changed all `if db:` → `if db is not None:`, changed all `.find()` calls
  to proper `await db.collection.find().to_list(length=N)` pattern
- Also fixed: `ACTIVE_IMAGE_KEY` selection logic — prefers `OPENAI_API_KEY` if set,
  falls back to `EMERGENT_LLM_KEY`
- Also fixed: Cloudinary upload runs in thread executor (was blocking the event loop)

**14. `server.py` — Multiple Fixes**
- File: `backend/server.py`
- Fix 1 — `toggle-active` endpoint (line ~12019):
  ```python
  # When re-activating: restore visibility.status = "active"
  # When deactivating: set visibility.status = "inactive"
  # Previously: only changed is_active flag, visibility.status remained "archived"
  ```
- Fix 2 — Admin services filter (line ~7032):
  Added `{"approval_status": {"$ne": "archived"}}` to ensure soft-archived services
  never appear in admin list
- Fix 3 — PyMongo `NotImplementedError` guards: all `if collection:` changed to
  `if collection is not None:`

**15. `mira_nudges.py` — New Proactive Nudge Engine**
- File: `backend/mira_nudges.py` (NEW — ~281 lines)
- Endpoints:
  - `GET /api/nudges/admin/types` — list nudge types
  - `PUT /api/nudges/admin/types` — update nudge configs
  - `POST /api/nudges/generate/{pet_id}` — generate nudges for one pet
  - `GET /api/nudges/pending/{user_id}` — pending nudges for user
  - `POST /api/nudges/dismiss/{nudge_id}` — dismiss a nudge
  - `POST /api/nudges/complete/{nudge_id}` — mark complete
  - `POST /api/nudges/process-all` — admin: process all pets
  - `POST /api/nudges/process-overdue` — expire stale nudges
- Nudge types: vaccination_reminder, grooming_reminder, birthday, gotcha_day,
  health_check, medication_reminder, reorder_suggestion
- Integrates with: push notifications, WhatsApp, admin alerts, service desk tickets

**16. `db_restore_routes.py` — Visitor Ticket Auto-Patching**
- File: `backend/db_restore_routes.py`
- Added post-restore step: after restoring all 14 collections, automatically
  finds service_desk_tickets where `pet_name` matches a real pet in DB and patches
  missing `owner_id` / `owner_email` fields (backfill for visitor-created tickets)
- Background restore (non-blocking) with `/restore-progress` polling endpoint
- `_restore_state` in-memory dict tracks: `status, current_collection, collections_done,
  collections_total, total_docs, visitor_tickets_patched, errors, duration_seconds`

**17. `DataMigration.jsx` — Restore Flow UI**
- File: `frontend/src/components/DataMigration.jsx` (updated)
- Wired to new background restore endpoint
- Shows live collection-by-collection progress: `Restoring 3/14 — pets`
- Shows final: `✅ Database restored + X visitor tickets patched`
- Export button: calls `/api/admin/export-database`

**18. `AdminGuideDashboard.jsx` — Updated Restore Flow**
- File: `frontend/src/components/admin/AdminGuideDashboard.jsx` (updated again)
- Added real-time progress display in Guide & Backup tab
- Wired to same background restore + polling pattern

### 9B — Health Condition Filtering (Commits: ~11:00–13:00 UTC)

**19. `condition_map.py` — New Backend File**
- File: `backend/condition_map.py` (NEW — 281 lines)
- Single source of truth for health condition → ingredient blocking map
- Conditions covered (each with `block_keywords`, `safe_keywords`, `safe_proteins`,
  `mira_note`, `pillar_note`, `severity: high/medium/low`):
  - `pancreatitis`, `pancreatitis chronic`
  - `diabetes`
  - `obesity`, `overweight`
  - `kidney disease`, `kidney disease chronic`
  - `liver disease`
  - `heart disease`
  - `allergies`, `food allergies`, `skin allergies`
  - `hypothyroidism`
  - `hyperthyroidism`
  - `cushing's disease`
  - `addison's disease`
  - `epilepsy`
  - `arthritis`, `osteoarthritis`
  - `cancer`
  - `inflammatory bowel disease`, `ibd`
  - `colitis`
  - `bloat prone`, `gastric dilation-volvulus`
  - `dental disease`
  - `eye problems`
  - `ear infections`
- Helper functions:
  - `normalise_condition(cond)` — lowercase, strip, strip "chronic"
  - `get_conditions_for_pet(pet)` — reads from `pet.health_conditions`,
    `pet.doggy_soul_answers.health_conditions`, `pet.health_data.conditions`
  - `build_condition_rule(conditions)` — builds WhatsApp/Mira system prompt block

**20. `useMiraFilter.js` — Health Condition Filtering (Client-Side)**
- File: `frontend/src/hooks/useMiraFilter.js` (updated)
- Added `CONDITION_BLOCK_MAP` (lines ~39–108) — JS mirror of `condition_map.py`
  - Maps 20 conditions to their blocked/safe keywords
- Added `extractConditionsFromPet(pet)` (line ~109) — reads from:
  - `pet.health_conditions`
  - `pet.doggy_soul_answers.health_conditions`
  - `pet.health_data.conditions`
- Added `productViolatesCondition(product, conditions)` (line ~123)
  - Scans product `tags`, `name`, `description`, `allergens`, `ingredients`
  against condition block keywords
- Added `getConditionNote(product, conditions)` (line ~141)
  - Returns positive Mira note when product is SAFE for a condition
  (e.g. "low fat — safe for pancreatitis")
- Integrated into `applyMiraFilter()` (line ~495):
  - Health condition hard block = `rank 100` (same as allergen block)
  - Condition-safe products boosted to `rank 3`
  - `mira_hint` overridden with condition note when applicable
  - ALL condition-blocked products filtered OUT entirely at line ~693

**21. `MiraSearchPage.jsx` — Health Condition Filtering Applied**
- File: `frontend/src/pages/MiraSearchPage.jsx` (updated again)
- `applyMiraFilter` now also applies health condition blocking to:
  - Search results (line ~637)
  - AI-returned products from `/api/mira/picks/default` (line ~659)
- `ResultChip` component (line ~260) updated:
  - Shows `✦ MIRA PICK` badge when `_miraRank > 0`
  - Shows `✦ {mira_hint}` reason line when rank > 0 AND hint present

### 9C — WhatsApp Intelligence Upgrade (Commits: ~10:00–15:00 UTC)

**22. `whatsapp_routes.py` — 5 Major Feature Additions**
- File: `backend/whatsapp_routes.py` (updated multiple times across the day)

**Feature A — Multi-Pet Disambiguation (line ~1482)**
- Trigger: User says "my dog" or "our dog" but has 2+ pets on their account
- Response: "Which dog are you asking about — {pet1} or {pet2}?"
- After user picks: subsequent messages lock to that pet for the session

**Feature B — Stale Ticket Validation**
- On each incoming message, checks if the active ticket (`ticket_pet_name`) refers to
  a pet that still exists in the DB
- If not found: clears the stale ticket state, creates fresh context
- Prevents ghost "currently booking for [deleted dog]" state

**Feature C — Pillar-Filtered MongoDB Fallback (line ~1511)**
- When semantic search returns 0 results: old code ran a broad product fetch
- New code: identifies the likely pillar from message keywords
  (e.g. "food" → dine, "walk" → go, "groom" → care) then queries
  `products_master` filtered by `{"pillar": detected_pillar, "visibility.status": "active"}`
- Falls back to cross-pillar only if pillar detection fails

**Feature D — Mira Imagines Protocol (WhatsApp)**
- When catalog search returns 0 AND no fallback products found:
  Mira uses a special "Mira Imagines" tone instead of "not found" error:
  "I don't have [item] in our catalog yet — but Mira imagines the perfect
  [thing] for [pet]! Let me get our Concierge on this 🎨"

**Feature E — Archetype Tone Injection (line ~1658)**
- Reads `pet.primary_archetype` (top-level, written by `infer_archetype.py`)
  via `p.get("primary_archetype") || p.get("archetype") || soul.get("primary_archetype")`
- Looks up `ARCHETYPE_TONES[archetype]` (updated dict — see Feature 23 below)
- Injects tone block into Mira system prompt:
  ```
  🎭 MIRA TONE FOR THIS DOG — 🌿 WILD EXPLORER:
  Be bold, adventurous and outdoorsy. Talk about trails, discoveries, freedom.
  Products are gear for the next adventure.
  ```
- Logs: `[MIRA-AI] Archetype tone injected: 🌿 WILD EXPLORER`

**Feature F — Multi-Account Linking (line ~1360)**
- When user messages from WhatsApp, system:
  1. Finds their account by phone number → `user_email`
  2. Fetches pets for that email
  3. Also looks up any OTHER accounts with the identical `name` string
     (handles split accounts where e.g. Dipali has 2 emails)
  4. Pools all pets from both accounts → unified pet list for Mira context

**23. `ARCHETYPE_TONES` Dict Expanded (in `whatsapp_routes.py` + `mira_routes.py` x2)**
- Added 7 new archetypes to ALL three `ARCHETYPE_TONES` dicts
  (whatsapp_routes.py line ~1646, mira_routes.py line ~3256, mira_routes.py line ~19035):

| Key | Label | Tone |
|---|---|---|
| `drama_queen` | 🎭 DRAMA QUEEN | Empathetic, extra reassuring, validates every sensitivity |
| `lone_wolf` | 🌑 LONE WOLF | Calm, minimal, non-pushy, fewer options |
| `foodie` | 🍖 FOODIE | Flavour-forward, sensory, taste/texture/smell |
| `gentle_soul` | 🌸 GENTLE SOUL | Soft, unhurried, warm, never overwhelming |
| `guardian` | 🛡️ GUARDIAN | Loyal, grounded, trust-building, quiet authority |
| `playful_spirit` | 🎉 PLAYFUL SPIRIT | Fun, light, joyful, infectious energy |
| `curious_mind` | 🔍 CURIOUS MIND | Interesting, stimulating, enrichment-focused |

- Legacy keys kept: `snack_led_negotiator`, `brave_worrier`, `quiet_watcher`,
  `gentle_aristocrat`, `royal`, `athlete`

**24. `mira_routes.py` — `/os/stream` Archetype Tone + Read Path Fix**
- File: `backend/mira_routes.py`
- Fix 1: `_ARCHETYPE_TONES_STREAM` dict expanded (same 7 new archetypes)
- Fix 2: Archetype read path (line ~19051) changed from:
  ```python
  _arch_pet = await get_db().pets.find_one({"id": pet_id}, {"_id": 0, "archetype": 1, ...})
  _ar = _arch_pet.get("archetype") or soul.get("primary_archetype", "")
  ```
  to:
  ```python
  _arch_pet = await get_db().pets.find_one({"id": pet_id}, {"_id": 0, "primary_archetype": 1, ...})
  _ar = _arch_pet.get("primary_archetype") or _arch_pet.get("archetype") or soul.get("primary_archetype", "")
  ```
  This fixes the key mismatch: `infer_archetype.py` writes to `pet.primary_archetype`
  (top-level) but old code was reading from `pet.archetype` (old field)

### 9D — Documentation + Deployment Rules (Commits: ~12:00–16:30 UTC)

**25. `DEPLOYMENT_RULES.md` — Created**
- File: `memory/DEPLOYMENT_RULES.md` (NEW)
- Single source of truth for ALL agents/humans on deploy sequence
- Includes: what triggers re-export, how to re-export single/multiple collections,
  full deploy sequence (8 steps), common mistakes that break production,
  env var two-place rule, WhatsApp/Gupshup notes, migration file reference table

**26. `complete-documentation.html` + `owners-guide.html` — Updated**
- Files: `frontend/public/complete-documentation.html`, `frontend/public/owners-guide.html`
- Added Phase 2 Proactive Roadmap documentation:
  - Mira Remembers (cross-session memory)
  - Life Event Intelligence (proactive transition nudges)
  - WhatsApp Vision (photo understanding without diagnosing)
  - Soul Completion Loop
- Updated with WhatsApp intelligence features
- Updated with Health Condition Filtering specs

**27. `test_mira_wa.py` + `test_mira_wa_debug.py` — WhatsApp Test Scripts**
- Files: `backend/test_mira_wa.py`, `backend/test_mira_wa_debug.py` (NEW)
- Bash/Python test scripts for manually invoking WhatsApp webhook with test payloads
- Tests multi-pet disambiguation, archetype injection, fallback products

### 9E — Soul Archetype Inference (Commits: ~16:40–16:46 UTC)

**28. `infer_archetype.py` — New Inference Script**
- File: `backend/scripts/infer_archetype.py` (NEW — ~280 lines)
- 10-archetype scoring engine. Signal priority:
  - `attention_seeking + separation_anxiety` → `velcro_baby`
  - `social_preference=other_dogs + high_energy + friendly` → `social_butterfly`
  - `high_energy + outdoor_spot + pulls_leash` → `wild_explorer`
  - `barking + noise_sensitive + cautious_strangers` → `drama_queen`
  - `independent + no_sep_anxiety + low_energy` → `lone_wolf`
  - `very_food_motivated + treat_responsive` → `foodie`
  - `gentle_temperament + calm_energy` → `gentle_soul`
  - `protective + cautious + devoted` → `guardian`
  - `playful_describe + active_play_style` → `playful_spirit`
  - `curious_nature + highly_trainable` → `curious_mind`
- Handles sparse profiles with `playful_spirit` warm default
- Writes `primary_archetype` (snake_case) + `archetype_reason` + `archetype_inferred_at` to DB
- **Writes snake_case keys** (e.g. `wild_explorer`) that match `ARCHETYPE_TONES` dict directly

**29. Soul Archetype Inference Run**
- Script run: `cd /app/backend && python3 scripts/infer_archetype.py`
- Result: 33/33 pets inferred and written to `pets` collection
- Distribution:
  ```
  playful_spirit:   13 pets (sparse profiles get warm default)
  wild_explorer:    10 pets (Mojo, Bruno, Mynx, Miracle, Mars, Moon, Mia, Magica, Maya, Mercury)
  social_butterfly:  4 pets (Buddy×2, Luna, Badmash)
  foodie:            3 pets (Mystique, Meister, Coco)
  velcro_baby:       2 pets (Lola, Sultan)
  lone_wolf:         1 pet  (Luna)
  ```
- Tone match verification: **33/33 pets** — every pet's archetype key exists in
  `ARCHETYPE_TONES` → tone injection will work for all users in WhatsApp + Mira OS

---

## ALL FILES CHANGED — MASTER LIST {#all-files-changed}

### Backend Files
| File | Changed | What Changed |
|---|---|---|
| `backend/server.py` | Apr 8-9 | toggle-active fix; services visibility filter; PyMongo truthiness guards |
| `backend/unified_product_box.py` | Apr 8 | Supplemental breed_query visibility filter; O(1) dedup |
| `backend/ai_image_service.py` | Apr 9 (02:00–10:31) | Motor async fix; Cloudinary thread executor; image key selection |
| `backend/condition_map.py` | Apr 9 (12:50) | NEW — Health condition block map (20 conditions) |
| `backend/mira_routes.py` | Apr 9 (14:14, 16:46) | ARCHETYPE_TONES expanded; archetype read path fixed; `/os/stream` tone |
| `backend/whatsapp_routes.py` | Apr 9 (10:44–15:42) | Multi-pet disambiguation; stale ticket; pillar fallback; Mira Imagines; archetype tone; multi-account linking; ARCHETYPE_TONES expanded |
| `backend/mira_nudges.py` | Apr 9 (11:53) | NEW — Proactive nudge engine (8 endpoints) |
| `backend/db_restore_routes.py` | Apr 9 (11:59, 12:30) | Background restore; visitor ticket patching; progress polling |
| `backend/scripts/infer_archetype.py` | Apr 9 (16:46) | NEW — Soul archetype inference script |
| `backend/test_mira_wa.py` | Apr 9 (11:13, 11:01, 10:49) | NEW — WhatsApp test scripts |
| `backend/test_mira_wa_debug.py` | Apr 9 (11:13) | NEW — WhatsApp debug script |

### Frontend Files
| File | Changed | What Changed |
|---|---|---|
| `frontend/src/hooks/useMiraFilter.js` | Apr 9 (12:50, 12:56) | CONDITION_BLOCK_MAP; extractConditionsFromPet; productViolatesCondition; applyMiraFilter health block |
| `frontend/src/pages/MiraSearchPage.jsx` | Apr 8 (7 modal triggers); Apr 9 (13:01, 13:05) | Health condition filtering; MIRA PICK badge; mira_hint on ResultChip |
| `frontend/src/pages/DineMobilePage.jsx` | Apr 8 (16:25) | applyMiraFilter with health conditions |
| `frontend/src/pages/DineSoulPage.jsx` | Apr 8 (16:25) | applyMiraFilter with health conditions |
| `frontend/src/pages/CelebrateMobilePage.jsx` | Apr 8 (16:25) | applyMiraFilter applied to celebration picks |
| `frontend/src/pages/ShopMobilePage.jsx` | Apr 8 (01:34, 16:25) | AmazonExplorerBox added |
| `frontend/src/pages/ShopSoulPage.jsx` | Apr 8 (01:34, 16:25) | AmazonExplorerBox added |
| `frontend/src/pages/UnifiedPetPage.jsx` | Apr 8 (05:48) | Minor update |
| `frontend/src/components/ProductCard.jsx` | Apr 8 (02:34, 02:54) | "Mira explains why" expandable row; shared `getProductImage()` resolver |
| `frontend/src/components/common/PersonalisedBreedSection.jsx` | Apr 8 (02:34) | watercolor_image priority in image resolver |
| `frontend/src/components/admin/UnifiedProductBox.jsx` | Apr 8 (02:35) | O(1) dedup; breed_query visibility filter |
| `frontend/src/components/admin/AdminGuideDashboard.jsx` | Apr 8 (02:03, 04:08); Apr 9 (12:30, 11:59) | Restore DB UI; live progress polling; export button |
| `frontend/src/components/DataMigration.jsx` | Apr 9 (11:59, 12:30) | Background restore flow; live progress |
| `frontend/src/components/shop/AmazonExplorerBox.jsx` | Apr 8 (01:34) | NEW — Amazon affiliate search box |
| `frontend/src/components/care/GuidedCarePaths.jsx` | Apr 8 (01:18) | health condition context read |
| `frontend/src/components/dine/GuidedNutritionPaths.jsx` | Apr 8 (01:18) | health condition context read |
| `frontend/src/components/celebrate/GuidedCelebrationPaths.jsx` | Apr 8 (01:18) | health condition context read |

### Documentation / Memory Files
| File | Changed | What Changed |
|---|---|---|
| `memory/DEPLOYMENT_RULES.md` | Apr 9 (16:27) | NEW — Complete deploy rules |
| `memory/PRD.md` | Apr 9 (multiple) | Mira Intelligence Roadmap updated; archetype system documented |
| `frontend/public/complete-documentation.html` | Apr 8-9 (many commits) | Phase 2 docs; WhatsApp intelligence; health condition filtering |
| `frontend/public/owners-guide.html` | Apr 8-9 (many commits) | Updated alongside docs |
| `complete-documentation.html` (root) | Apr 9 | Same — moved to public/ |
| `imageless_products.csv` | Apr 8 | Audit output (products without images) |
| `duplicate_products_to_archive.json` / `.txt` | Apr 8 | Audit output (duplicate products) |

---

## ALL BUGS FIXED {#all-bugs-fixed}

### Bug 1 — AI Image Generator 401 Unauthorized Pop-up (Admin)
- **Root cause**: `AIImagePromptField` was calling `/api/admin/generate-image`
  without the `Authorization: Basic <base64>` header. Browser prompted for credentials.
- **Fix**: Passed `adminAuth` prop through component chain; added
  `headers: { Authorization: "Basic " + adminAuth }` to fetch call
- **File**: `frontend/src/components/admin/AIImagePromptField.jsx`
- **Status**: ✅ Fixed (Apr 7-8 session)

### Bug 2 — MongoDB `NotImplementedError` on `/admin/generate-image`
- **Root cause**: `ai_image_service.py` had `if db:` truthiness check on a Motor
  `AsyncIOMotorDatabase` object. PyMongo/Motor raises `NotImplementedError` when
  you evaluate a database object in a boolean context.
- **Fix**: Changed `if db:` → `if db is not None:` throughout `ai_image_service.py`
  and `server.py`. This is a critical PyMongo rule (documented in PRD as Critical Rule 12).
- **Files**: `backend/ai_image_service.py`, `backend/server.py`
- **Status**: ✅ Fixed (Apr 9, 02:00–03:00 UTC)

### Bug 3 — toggle-active Leaving Products in "Archived" State
- **Root cause**: `PATCH /api/products/{id}/toggle-active` only toggled `is_active`
  flag. If a product had been archived (`visibility.status = "archived"`), reactivating
  via toggle would set `is_active = True` but leave `visibility.status = "archived"`.
  The admin list still filtered on `visibility.status != "archived"`, so the product
  stayed invisible.
- **Fix**: When re-activating: also set `visibility.status = "active"` and
  `visibility.is_active = True`. When deactivating: set `visibility.status = "inactive"`
  and `visibility.is_active = False`.
- **File**: `backend/server.py` (line ~12031–12043)
- **Status**: ✅ Fixed

### Bug 4 — Admin Product List Showing Archived Products
- **Root cause**: `GET /api/product-box/products` (unified_product_box.py) had a filter
  that only excluded `visibility.status == "archived"` on the primary `products_master`
  query, but the supplemental `breed_products` sub-query had NO visibility filter.
  Archived breed products could surface in the admin list.
- **Fix**: Added mirrored `visibility.status` filter to `breed_query` (line ~790–808
  in `unified_product_box.py`)
- **File**: `backend/unified_product_box.py`
- **Status**: ✅ Fixed

### Bug 5 — React Duplicate Key Warning (products_master data corruption)
- **Root cause**: `products_master` collection contained TWO MongoDB documents with
  identical `id` field: `bp-akita-designer-bandana-969f46` (old name + new name version).
  When both returned by API, React threw duplicate key warning.
- **Fix**: O(1) Set-based dedup added to admin product list merge in
  `UnifiedProductBox.jsx` before rendering
- **Root data issue**: Two DB documents with same `id` — cannot be fixed by frontend alone.
  The `id` field needs a unique index in MongoDB. Left as known medium-priority issue.
- **Status**: ✅ Frontend deduplicated (medium priority DB issue remains)

### Bug 6 — WhatsApp Goes Silent After Merge
- **Root cause**: After GitHub merge, production deployed new code but the webhook
  URL (Gupshup) still pointed to production. The new `whatsapp_routes.py` had a
  syntax/import error that crashed the backend on startup, silencing all webhooks.
- **Fix**: Fixed the import error; backend restarted successfully
- **Status**: ✅ Fixed (Apr 9, early morning)

### Bug 7 — Archetype Tone Injection Never Firing
- **Root cause (3-layer bug)**:
  1. `infer_archetype.py` was writing `primary_archetype: "Wild Explorer"` (Title Case)
  2. `ARCHETYPE_TONES` dict keys were snake_case (`wild_explorer`)
  3. Lookup `active_pet_archetype in ARCHETYPE_TONES` always `False` → no tone
- **Fix**:
  1. Changed inference script to write snake_case: `"wild_explorer"`
  2. Added 7 new archetypes to `ARCHETYPE_TONES` in all 3 locations
  3. Fixed read path in `mira_routes.py` to check `pet.primary_archetype` first
  4. Fixed read path in `whatsapp_routes.py` same
- **Files**: `backend/scripts/infer_archetype.py`, `backend/whatsapp_routes.py`,
  `backend/mira_routes.py`
- **Status**: ✅ Fixed (Apr 9, 16:46 UTC)

### Bug 8 — WhatsApp `NameError: TEMPLATES_APPROVED` (notification logging)
- **Root cause**: `_log_send()` in `services/whatsapp_service.py` (line ~101) referenced
  `TEMPLATES_APPROVED` as a bare name. The correct function is `_templates_approved()`
  (callable). Send logs were not being persisted to DB.
- **Status**: ⚠️ Identified in iteration_261. Fix needed in
  `backend/services/whatsapp_service.py` — not yet committed.

### Bug 9 — Duplicate Allergen Badges on Pet Cards
- **Root cause**: `getAllergiesFromPet()` returned both `"chicken"` and `"Chicken"` from
  different DB fields (soul answers vs vault). Set dedup was case-sensitive.
- **Status**: ⚠️ Identified in iteration_261. Fix needed in
  `frontend/src/utils/petHelpers.js` (or wherever `getAllergiesFromPet` is defined).
  Add `.toLowerCase()` normalisation before Set insertion.

---

## ALL FEATURES BUILT {#all-features-built}

| Feature | Status | Files |
|---|---|---|
| Mira Health Condition Filtering — Frontend | ✅ Live on Preview | `useMiraFilter.js`, all `*MobilePage.jsx` files |
| Mira Health Condition Filtering — Mira Search | ✅ Live on Preview | `MiraSearchPage.jsx` |
| "Mira Explains Why" expandable row on ProductCard | ✅ Live on Preview | `ProductCard.jsx` |
| WhatsApp Multi-Pet Disambiguation | ✅ Live on Preview (prod needs deploy) | `whatsapp_routes.py` |
| WhatsApp Stale Ticket Validation | ✅ Live on Preview | `whatsapp_routes.py` |
| WhatsApp Pillar-Filtered Fallback | ✅ Live on Preview | `whatsapp_routes.py` |
| WhatsApp Mira Imagines Protocol | ✅ Live on Preview | `whatsapp_routes.py` |
| WhatsApp Archetype Tone Injection | ✅ Live on Preview | `whatsapp_routes.py` |
| WhatsApp Multi-Account Linking | ✅ Live on Preview | `whatsapp_routes.py` |
| Mira OS (`/os/stream`) Archetype Tone | ✅ Live on Preview | `mira_routes.py` |
| Soul Archetype Inference (10 archetypes) | ✅ DB written (Preview) | `scripts/infer_archetype.py` |
| ARCHETYPE_TONES — 7 new archetypes | ✅ Live on Preview | `whatsapp_routes.py`, `mira_routes.py` |
| AmazonExplorerBox on Shop | ✅ Live on Preview | `AmazonExplorerBox.jsx`, `ShopMobilePage.jsx` |
| MiraSearchPage — 7 Service Modal Triggers | ✅ Live on Preview | `MiraSearchPage.jsx` |
| Mira Nudge Engine | ✅ Live on Preview (backend) | `mira_nudges.py` |
| DB Restore — Background + Progress Polling | ✅ Live on Preview | `db_restore_routes.py`, `AdminGuideDashboard.jsx` |
| DB Restore — Visitor Ticket Auto-Patching | ✅ Live on Preview | `db_restore_routes.py` |
| condition_map.py — Backend health condition map | ✅ Live on Preview | `condition_map.py` |
| DEPLOYMENT_RULES.md | ✅ Documented | `memory/DEPLOYMENT_RULES.md` |
| Phase 2 Proactive Roadmap Docs | ✅ Documented | `complete-documentation.html` |

---

## ALL TESTS RUN {#all-tests-run}

### iteration_260.json — April 6, 2026 (Admin Box Full Audit)
- **28/28 PASS**
- Scope: Product Box archive/restore, Service Box archive/restore/edit,
  Soul Box generate-image routing, admin services filtering, frontend UI
- Notable pass: All 7 frontend scenarios (Show Archived toggle, Restore buttons,
  Archive/Restore flow, Status filter, ProductBoxEditor, Dominant image preview)
- Notable minor bug found: Duplicate `id` in products_master (React key warning) —
  marked medium priority, not blocking

### iteration_261.json — April 6, 2026 (Pre-Launch Audit)
- **26/26 PASS** (with 2 WARNINGS)
- Scope: Service desk tickets (8a/8b/8c), WhatsApp notifications (8d),
  allergen safety chain (9a/9b/9c/9d), mobile modal z-index (10a/10b/10c),
  pet switching (11a/11b)
- All critical paths verified
- **WARNING 1**: `NameError: TEMPLATES_APPROVED` in `whatsapp_service.py` — WA
  send logs not persisted (still sends, just not logged)
- **WARNING 2**: Duplicate allergen badges (case-sensitivity in `getAllergiesFromPet`)
- Both warnings identified, need fixes before production launch

### Manual WhatsApp Tests (Apr 9)
- `test_mira_wa.py` — Invoked webhook with test payload for +91 9739908844
- Verified: disambiguation message fires when 2+ pets on account
- Verified: archetype tone logged when `primary_archetype` present
- Verified: pillar fallback runs when semantic search returns 0

### Soul Archetype Inference Verification (Apr 9, 16:46 UTC)
- Script: `python3 backend/scripts/infer_archetype.py`
- Result: 33/33 pets inferred, 33/33 written to DB
- Tone match check: **33/33 archetype keys exist in ARCHETYPE_TONES**
- Re-exported `pets.json.gz` immediately after

---

## ALL DATABASE CHANGES {#all-database-changes}

### Collection: `pets`
- **33 documents updated** — added fields:
  - `primary_archetype`: snake_case archetype key (e.g. `"wild_explorer"`)
  - `archetype_reason`: human-readable explanation (e.g. `"Score 9: high energy + outdoor lover + pulls on leash"`)
  - `archetype_inferred_at`: `"2026-04-10"` (date of inference run)
- Before: 0/33 pets had `primary_archetype`
- After: 33/33 pets have `primary_archetype`

### Collection: `products_master`
- 9,358 total documents. No structural changes.
- Re-exported to `products_master.json.gz` (Apr 8: 16:16 and 16:25 UTC)

### Collection: `service_desk_tickets`
- 124 total tickets
- The "mahi" open ticket was manually closed (resolved) by user
- Re-exported to `service_desk_tickets.json.gz` (Apr 9: 16:24 UTC)

### Collection: `users`
- 21 total users
- Re-exported to `users.json.gz` (Apr 9: 16:24 UTC)

### Collection: `services_master`
- 1,040 total services
- Re-exported to `services_master.json.gz` (Apr 8: 15:46 UTC)

---

## ALL MIGRATION FILES RE-EXPORTED {#migration-files}

| File | Last Exported | Docs | Notes |
|---|---|---|---|
| `pets.json.gz` | Apr 9, 16:45 UTC | 33 | ⭐ CRITICAL — contains new `primary_archetype` |
| `users.json.gz` | Apr 9, 16:24 UTC | 21 | |
| `service_desk_tickets.json.gz` | Apr 9, 16:24 UTC | 124 | "mahi" ticket resolved |
| `guided_paths.json.gz` | Apr 9, 16:28 UTC | ~44 | |
| `product_soul_tiers.json.gz` | Apr 9, 16:28 UTC | - | |
| `products_master.json.gz` | Apr 8, 16:25 UTC | 9,358 | |
| `services_master.json.gz` | Apr 8, 15:46 UTC | 1,040 | |
| `breed_products.json.gz` | Apr 6, 10:38 UTC | 4,941 | No changes since Apr 6 |
| `bundles.json.gz` | Apr 6, 10:38 UTC | - | No changes since Apr 6 |
| `care_bundles.json.gz` | Apr 6, 11:58 UTC | - | No changes since Apr 6 |
| `learn_guides.json.gz` | Apr 6, 10:38 UTC | - | No changes since Apr 6 |
| `mira_conversations.json.gz` | Apr 6, 10:38 UTC | - | No changes since Apr 6 |
| `product_bundles.json.gz` | Apr 6, 10:38 UTC | - | No changes since Apr 6 |
| `service_catalog.json.gz` | Apr 6, 10:38 UTC | - | No changes since Apr 6 |

**Files that have NOT been re-exported but MAY have changed:**
- `breed_products.json.gz` — No code changes to breed_products collection since Apr 6.
  Safe to use Apr 6 export.
- All other Apr 6 files — No changes. Safe.

---

## CURRENT STATE — PREVIEW vs PRODUCTION {#current-state}

### PREVIEW (https://pet-soul-ranking.preview.emergentagent.com)
- **Backend**: RUNNING ✅ (pid 47, uptime >12min at time of check)
- **Frontend**: RUNNING ✅ (pid 49)
- **MongoDB**: RUNNING ✅ (pid 50)
- All April 8-9 code changes: **LIVE ON PREVIEW** ✅
- `pets` collection in preview DB: **33/33 with `primary_archetype`** ✅
- WhatsApp webhook: **DOES NOT RECEIVE MESSAGES IN PREVIEW**
  (Gupshup webhook URL points to production only)

### PRODUCTION (https://thedoggycompany.com)
- **Code**: Last deployed commit is from **before April 8** (exact commit unknown)
- **DB State**: Based on last "Restore Database" run — likely **pets.json.gz from before Apr 6**
  (0/33 pets have `primary_archetype`)
- **Missing from production**:
  - Health Condition Filtering (all layers)
  - "Mira Explains Why" ProductCard
  - WhatsApp multi-pet disambiguation
  - WhatsApp archetype tone injection
  - WhatsApp stale ticket fix
  - WhatsApp multi-account linking
  - Mira OS archetype tone in `/os/stream`
  - AmazonExplorerBox on Shop
  - 7 service modals in MiraSearchPage
  - Soul archetype inference (pets have no `primary_archetype` in prod)
  - Mira Nudge Engine
  - Background DB Restore with progress polling
  - DB Restore visitor ticket patching
  - All `condition_map.py` logic
  - MiraSearchPage `✦ MIRA PICK` badges + mira_hint

---

## WHAT IS NOT YET IN PRODUCTION {#not-in-production}

**To get everything from April 8-9 into production, follow these steps:**

```
STEP 1: Save to GitHub (Emergent chat input → "Save to GitHub")
STEP 2: Dipali merges PR on GitHub into main
STEP 3: Redeploy triggers (or press Redeploy in Emergent — wait 10-15 min)
STEP 4: Go to thedoggycompany.com/admin → Guide & Backup
STEP 5: Click "Restore Database" green button
STEP 6: Wait for toast: "✅ Database restored + X visitor tickets patched"
STEP 7: Test on production — key things to verify:
  - /dine (mobile): health condition filtering works, no allergen products shown
  - /mira-search: MIRA PICK badge visible, mira_hint displayed
  - WhatsApp (send test message): archetype tone in Mira response
  - Admin → AI Image Generator: no 401 popup
  - Admin → product list: archived products not visible
```

**Code changes NOT yet in production (need GitHub push + redeploy):**
1. `backend/condition_map.py` (NEW FILE — health conditions)
2. `backend/whatsapp_routes.py` (multi-pet, tone, stale ticket, fallback, multi-account)
3. `backend/mira_routes.py` (archetype tone, 7 new archetypes)
4. `backend/mira_nudges.py` (NEW FILE — nudge engine)
5. `backend/db_restore_routes.py` (background restore, visitor ticket patch)
6. `backend/ai_image_service.py` (Motor async fix)
7. `backend/server.py` (toggle-active fix, services filter)
8. `backend/scripts/infer_archetype.py` (NEW FILE)
9. `frontend/src/hooks/useMiraFilter.js` (health condition filtering)
10. `frontend/src/pages/MiraSearchPage.jsx` (MIRA PICK badge, 7 modals)
11. `frontend/src/pages/DineMobilePage.jsx` (health filter)
12. `frontend/src/pages/DineSoulPage.jsx` (health filter)
13. `frontend/src/pages/CelebrateMobilePage.jsx` (health filter)
14. `frontend/src/pages/ShopMobilePage.jsx` (AmazonExplorerBox)
15. `frontend/src/pages/ShopSoulPage.jsx` (AmazonExplorerBox)
16. `frontend/src/components/ProductCard.jsx` (Mira explains why)
17. `frontend/src/components/admin/UnifiedProductBox.jsx` (dedup)
18. `frontend/src/components/admin/AdminGuideDashboard.jsx` (restore UI)
19. `frontend/src/components/DataMigration.jsx` (restore UI)
20. `frontend/src/components/shop/AmazonExplorerBox.jsx` (NEW FILE)
21. `frontend/src/components/common/PersonalisedBreedSection.jsx`
22. `memory/DEPLOYMENT_RULES.md` (NEW FILE)

**DB changes NOT yet in production (need Restore Database after deploy):**
- `pets.json.gz` (Apr 9, 16:45) — contains `primary_archetype` for all 33 pets
- `service_desk_tickets.json.gz` (Apr 9, 16:24) — mahi ticket resolved
- `users.json.gz` (Apr 9, 16:24)
- `guided_paths.json.gz` (Apr 9, 16:28)
- `products_master.json.gz` (Apr 8, 16:25)
- `services_master.json.gz` (Apr 8, 15:46)

---

## KNOWN OPEN ISSUES {#known-open-issues}

### Issue 1 — NameError in WhatsApp Send Log (MEDIUM)
- **Location**: `backend/services/whatsapp_service.py`, line ~101
- **Error**: `NameError: name 'TEMPLATES_APPROVED' is not defined`
- **Impact**: WhatsApp messages SEND correctly but send logs are NOT persisted to MongoDB.
  Admin cannot see delivery history for these sends.
- **Fix needed**: Change `TEMPLATES_APPROVED` → `_templates_approved()` (callable)
- **Status**: Identified in iteration_261. NOT YET FIXED.

### Issue 2 — Duplicate Allergen Badges (LOW)
- **Location**: `frontend/src/utils/petHelpers.js` (or `getAllergiesFromPet`)
- **Error**: Same allergen appears twice (e.g., "chicken" from soul answers, "Chicken"
  from vault). Case-sensitive Set dedup fails.
- **Fix needed**: Add `.toLowerCase()` before inserting into Set
- **Status**: Identified in iteration_261. NOT YET FIXED.

### Issue 3 — Duplicate Products in products_master (MEDIUM DATA)
- **Location**: `backend/migration_data/products_master.json.gz`
- **Error**: Two MongoDB documents with `id = "bp-akita-designer-bandana-969f46"`.
  Causes React duplicate key warning in Admin.
- **Fix needed**: Run dedup script on `products_master`, add unique index on `id` field.
- **Status**: Frontend workaround applied (O(1) Set dedup). Root DB issue open.

### Issue 4 — Production DB Atlas IP Whitelist (BLOCKED)
- **Location**: MongoDB Atlas Dashboard
- **Error**: `ServerSelectionTimeoutError` when trying to connect to prod Atlas from preview
- **Impact**: Cannot run scripts directly against production DB. Must use
  migration file → deploy → Restore Database workflow.
- **Fix needed**: Dipali must whitelist preview pod IP in Atlas → Network Access
- **Status**: Recurrence count 7+ across all sessions. BLOCKED on user action.

### Issue 5 — WhatsApp Preview Testing Not Possible
- **Impact**: All WhatsApp changes can only be verified on production (Gupshup webhook
  points to prod URL, not preview).
- **Workaround**: Deploy to production, test via WhatsApp messages to +91 9739908844
- **Status**: By design. Not fixable without separate Gupshup webhook endpoint.

### Issue 6 — `yarn build` OOM in Preview
- **Location**: Preview container memory limit
- **Error**: `yarn build` exits with code -9 (killed by OOM)
- **Impact**: Cannot verify production build in preview. Must rely on Emergent's
  deployment pipeline for the actual build.
- **Workaround**: `GENERATE_SOURCEMAP=false NODE_OPTIONS=--max-old-space-size=4096`
  in build command (already set in PRD). Still OOMs at preview level.
- **Status**: Known limitation. Not fixable from code.

---

## PENDING ITEMS BEFORE MAY 15, 2026 LAUNCH {#pending-before-may-15}

### P0 — MUST HAVE FOR LAUNCH

| # | Item | Effort | Files |
|---|---|---|---|
| 1 | **Deploy April 8-9 code to production** | 30 min | (follow deploy steps above) |
| 2 | **Fix WhatsApp NameError** (`TEMPLATES_APPROVED`) | 15 min | `services/whatsapp_service.py` line ~101 |
| 3 | **Fix duplicate allergen badges** (case-insensitive dedup) | 15 min | `petHelpers.js` or `getAllergiesFromPet` |
| 4 | **Verify production end-to-end after deploy** | 1 hour | Manual test on thedoggycompany.com |
| 5 | **DemoPage live** (`/demo`) — for May 15 launch | Already built | `DemoPage.jsx` (built Apr 5) |

### P1 — HIGH PRIORITY (Before or at Launch)

| # | Item | Effort | Notes |
|---|---|---|---|
| 6 | **"Mira explains why" on Dine/Care/Celebrate desktop** | 2 hrs | Already on all ProductCards — need to verify desktop rendering |
| 7 | **Celebrate mobile parity** — `BirthdayCountdown`, `CelebrationMemoryWall`, `MiraSoulNudge` | 4 hrs | Missing from `CelebrateMobilePage.jsx` |
| 8 | **`LearnNearMe`**, **`PaperworkNearMe`**, **`GoNearMe`** on mobile pages | 3 hrs | Components exist, need wiring |
| 9 | **Multi-Pet Household Safety** — basket splitting if conflicting allergens | 4 hrs | New feature, needs spec |
| 10 | **Atlas IP Whitelist** — Enable direct prod DB access from preview | 10 min | Dipali must do in Atlas dashboard |
| 11 | **Re-run `infer_archetype.py` on production** after deploy + restore | 5 min | `cd /app/backend && python3 scripts/infer_archetype.py` |

### P2 — POST-LAUNCH

| # | Item | Effort | Notes |
|---|---|---|---|
| 12 | **WhatsApp Templates go live** — Set `WHATSAPP_TEMPLATES_APPROVED=true` in env | 5 min | After Gupshup approves all 8 templates |
| 13 | **Pet archetype badge on PetHomePage** — Show `🌿 Wild Explorer` on pet card | 2 hrs | Quick win, high delight |
| 14 | **Watch & Learn YouTube** in Care + Go desktop DimExpanded | Already built | Verify working in prod |
| 15 | **Mira Nudge Engine — enable crons** | 2 hrs | `mira_nudges.py` built, needs scheduled trigger |
| 16 | **Phase 2: Mira Remembers** (cross-session memory) | 1 week | Documented in `complete-documentation.html` |
| 17 | **Phase 2: Life Event Intelligence** | 1 week | Proactive transition nudges |
| 18 | **Phase 2: WhatsApp Vision** | 2 weeks | Photo understanding (Gemini Vision) |
| 19 | **Phase 2: Soul Completion Loop** | 3 days | Proactive "complete your soul profile" nudges |

### REFACTORING (Post-Launch, Non-Critical)

| # | Item | Effort | Notes |
|---|---|---|---|
| 20 | **Split `server.py`** (25,000+ lines) into route files | 3 days | Low risk if done carefully |
| 21 | **Split `Admin.jsx`** (7,000+ lines) into components | 2 days | |
| 22 | **Deduplicate `products_master`** (unique index on `id`) | 2 hrs | Run dedup script first |
| 23 | **Build Love pillar** | 1 week | Not yet started |
| 24 | **WhatsApp Daily Digest cron** | 1 day | Backend exists, needs trigger |
| 25 | **Medication Refill Reminders** | 1 day | Backend exists, needs trigger |

---

## CRITICAL RULES FOR NEXT AGENT

1. **Desktop `*SoulPage.jsx` files are STRICTLY LOCKED** — never modify them
2. **PyMongo**: NEVER `if collection:` or `if db:` → always `if collection is not None:`
   This throws `NotImplementedError` and crashes the backend
3. **MongoDB `_id`**: Always exclude from responses (`{"_id": 0}` in projections)
4. **WhatsApp testing**: Only possible on production (Gupshup webhook → prod URL)
5. **Deploy sequence**: Code push → Redeploy → Restore Database (ALL THREE required)
6. **`primary_archetype` field**: Top-level on pet document, snake_case values
   (e.g. `"wild_explorer"`, not `"Wild Explorer"`)
7. **Re-run `infer_archetype.py` after each deploy** + DB restore to populate archetypes
   on production (script reads preview DB — must run again against prod after restore)
8. **Never hard-delete products** — always soft-archive: `visibility.status = "archived"`
9. **`ARCHETYPE_TONES` is in 3 places** — always update all 3:
   - `whatsapp_routes.py` (line ~1646)
   - `mira_routes.py` (line ~3256)
   - `mira_routes.py` (line ~19035, `_ARCHETYPE_TONES_STREAM`)

---

## TEST CREDENTIALS

| Role | Credentials |
|---|---|
| Member | `dipali@clubconcierge.in` / `test123` |
| Admin | `aditya` / `lola4304` at `/admin` |
| WhatsApp test | +91 9739908844 |

---

*Document generated by E1 agent. All timestamps are UTC.*
*Git range covered: `2e4005082108` (Apr 8 04:08) → `a1fee73a2f54` (Apr 9 16:46)*

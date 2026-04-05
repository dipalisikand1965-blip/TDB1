# Soul Products — Complete Briefing
## Last Updated: 2026-04-XX (Current Session)
## READ THIS BEFORE TOUCHING SOUL PRODUCTS

---

## THE VISION (What We Are Building)

Every pet parent on The Doggy Company sees **94 soul-made products** for their dog's breed,
spread across 11 pillar pages (Dine, Care, Play, Go, Learn, Celebrate, Farewell, Paperwork,
Emergency, Adopt, Shop) AND visible all together in /shop.

The pipeline that makes this work:
```
Soul Generator (breed_products collection)
    ↓ AI generates watercolor breed-specific product mockup
Soul Box (Admin UI — reads products_master)
    ↓ synced automatically via _sync_to_products_master()
Products Master (products_master collection)
    ↓ filtered by breed_tags + pillar + visibility.status=active
Frontend (each pillar page + /shop)
    ↓
Pet Parent sees THEIR breed's products with watercolor art
```

---

## TEST CREDENTIALS

| Role | Login | Notes |
|---|---|---|
| Member | dipali@clubconcierge.in / test123 | Pet: Mojo, Breed: indie |
| Admin | aditya / lola4304 at /admin | Use for Soul Generator |

**Mojo = Indie = Indian Pariah** — always test with Mojo for indie breed

---

## WHAT WAS DONE IN THIS SESSION (in order)

### Step 1 — Diagnosed the 3 root causes
Three problems were causing soul products to be invisible despite existing in the DB:
1. **693 products archived in products_master** but active in breed_products (celebrate + dine pillars)
2. **1,110 products had breed field set** but breed_tags array was None/missing
3. **1,838 breed_products had images** but is_mockup was not True → invisible in Soul Generator

### Step 2 — Fix 1: Restored 693 archived products ✅ DONE
```python
# Restored products that were active in Soul Generator but archived in products_master
db.products_master.update_many(
    { 'id': {'$in': active_bp_ids}, 'soul_made': True,
      '$or': [{'is_active': False}, {'visibility.status': 'archived'}] },
    {'$set': {'is_active': True, 'visibility': {'status': 'active'}}}
)
# Result: 693 modified — all were celebrate + dine pillar products
# All had valid watercolor images already (Cloudinary URLs present)
```

### Step 3 — Fix 2: Backfilled breed_tags for 1,110 products ✅ DONE
```python
# Products had correct 'breed' field but breed_tags array was None
# Frontend filters by breed_tags, so these were invisible to members
db.products_master.update_many(
    { 'soul_made': True, 'is_active': True,
      'breed_tags': None,
      'breed': {'$exists': True, '$nin': [None, '']} },
    [{'$set': {'breed_tags': ['$breed']}}]  # aggregation pipeline update
)
# Result: 1,110 modified
# IMPORTANT: use $nin not duplicate $ne (Python dict drops duplicate keys)
```

### Step 4 — Fix 3: Stamped is_mockup=True for 1,838 breed_products ✅ DONE
```python
# Soul Generator only shows products with is_mockup:True
# Many products had valid Cloudinary images but were missing this flag
db.breed_products.update_many(
    { 'is_mockup': {'$ne': True},
      '$or': [
          {'cloudinary_url': {'$exists': True, '$nin': [None, '']}},
          {'mockup_url': {'$exists': True, '$nin': [None, '']}}
      ]},
    {'$set': {'is_mockup': True}}
)
# Result: 1,838 modified
# Newfoundland went from 2 visible → 118 visible in Soul Generator
```

---

## CURRENT STATE (After All Fixes)

### Key Fields & What They Do
| Field | Collection | Purpose | Value Needed |
|---|---|---|---|
| soul_made | products_master | Marks as soul product | True |
| visibility.status | products_master | Member visibility | 'active' |
| breed_tags | products_master | Frontend breed filter | ['breed_slug'] e.g. ['labrador'] |
| is_active | products_master | Active flag | True |
| is_mockup | breed_products | Soul Generator visibility | True |
| is_active | breed_products | Soul Generator list | True |
| breed | breed_products | Breed slug | e.g. 'newfoundland' |
| pillar | breed_products | Which pillar | e.g. 'dine' |

### Full Breed Status (post all fixes)
Format: `breed | members_see | soul_gen_active | missing_pillars`

```
akita              | 100 | 84  | ALL 11 PILLARS ✓
alaskan_malamute   |  51 | 39  | MISSING: farewell, adopt
american_bully     |  76 | 44  | MISSING: adopt
australian_shepherd|  67 | 82  | ALL 11 PILLARS ✓
basenji            |  36 | 25  | MISSING: farewell, adopt
beagle             | 135 | 101 | ALL 11 PILLARS ✓
bernese_mountain   |  67 | 66  | ALL 11 PILLARS ✓
bichon_frise       |  28 | 23  | MISSING: farewell, adopt
border_collie      |  80 | 101 | ALL 11 PILLARS ✓
boston_terrier     |  69 | 66  | ALL 11 PILLARS ✓
boxer              | 134 | 100 | ALL 11 PILLARS ✓
bulldog            |  77 | 42  | MISSING: farewell, adopt
cavalier           |  73 | 44  | MISSING: adopt
cavalier_king_charles| 68| 67  | ALL 11 PILLARS ✓
chihuahua          | 135 | 101 | ALL 11 PILLARS ✓
chow_chow          |  46 | 44  | MISSING: adopt
cocker_spaniel     |  80 | 101 | ALL 11 PILLARS ✓
corgi              |  38 | 23  | MISSING: farewell, adopt
dachshund          | 135 | 101 | ALL 11 PILLARS ✓
dalmatian          |  87 | 53  | MISSING: adopt
doberman           | 139 | 100 | ALL 11 PILLARS ✓
english_bulldog    |  70 | 92  | ALL 11 PILLARS ✓
french_bulldog     |  36 | 54  | MISSING: adopt
german_shepherd    |  81 | 101 | ALL 11 PILLARS ✓
golden_retriever   |  81 | 101 | ALL 11 PILLARS ✓
great_dane         |  79 | 100 | ALL 11 PILLARS ✓
greyhound          |  58 | 47  | MISSING: adopt
havanese           |  73 | 66  | ALL 11 PILLARS ✓
husky              |  91 | 57  | MISSING: adopt
indian_pariah      |  62 | 61  | ALL 11 PILLARS ✓
indian_spitz       |  25 | 23  | MISSING: farewell, adopt
indie              |  95 | 59  | MISSING: adopt
irish_setter       |  21 | 44  | MISSING: adopt  ← ALSO breed_tags gap (21 vs 44)
jack_russell       |  25 | 44  | MISSING: adopt  ← ALSO breed_tags gap (25 vs 44)
labradoodle        |  42 | 23  | MISSING: farewell, adopt
labrador           | 140 | 102 | ALL 11 PILLARS ✓
lhasa_apso         |  46 | 44  | MISSING: adopt
maltese            | 135 | 103 | ALL 11 PILLARS ✓
maltipoo           | 113 | 94  | ALL 11 PILLARS ✓
newfoundland       | 120 | 118 | ALL 11 PILLARS ✓ (was 2 visible, now 118!)
pomeranian         | 134 | 100 | ALL 11 PILLARS ✓
poodle             | 135 | 101 | ALL 11 PILLARS ✓
pug                | 134 | 100 | ALL 11 PILLARS ✓
rottweiler         | 133 | 99  | ALL 11 PILLARS ✓
saint_bernard      |  29 | 24  | MISSING: farewell, adopt
samoyed            |  81 | 66  | ALL 11 PILLARS ✓
schnoodle          |  76 | 44  | MISSING: adopt
scottish_terrier   |  92 | 91  | ALL 11 PILLARS ✓
shetland_sheepdog  |  69 | 66  | ALL 11 PILLARS ✓
shih_tzu           |  81 | 101 | ALL 11 PILLARS ✓
siberian_husky     |  67 | 66  | ALL 11 PILLARS ✓
st_bernard         |  25 | 91  | ALL 11 PILLARS ✓ ← BREED_TAGS GAP (25 vs 91)
vizsla             |  77 | 66  | ALL 11 PILLARS ✓
weimaraner         |  81 | 66  | ALL 11 PILLARS ✓
yorkshire          |  73 | 44  | MISSING: adopt
yorkshire_terrier  |  85 | 85  | ALL 11 PILLARS ✓
```

---

## REMAINING ISSUES (In Priority Order)

### ISSUE A — breed_tags GAP breeds ✅ FIXED (Step 5)
Fixed 2026-04. Three breeds had breed_tags stored with spaces instead of underscores.
- "saint bernard" → "st_bernard" (108 products fixed) → members: 25 → 133
- "irish setter" → "irish_setter" (55 products fixed) → members: 21 → 76
- "jack russell" → "jack_russell" (52 products fixed) → members: 25 → 77

### ISSUE A (RESOLVED) — breed_tags GAP breeds (was P0)
These breeds have products in breed_products but they're not reaching members.
The soul_gen count is much higher than member count. This means products_master
has them BUT breed_tags field is set incorrectly (wrong breed slug format).

| Breed | Members See | Soul Gen Has | Gap | Likely Cause |
|---|---|---|---|---|
| st_bernard | 25 | 91 | 66 missing | breed_tags might say 'saint bernard' or 'St. Bernard' |
| irish_setter | 21 | 44 | 23 missing | breed_tags mismatch |
| jack_russell | 25 | 44 | 19 missing | breed_tags mismatch |

**How to diagnose:**
```python
# Check what breed_tags value is actually stored for st_bernard products
db.products_master.find(
    {'soul_made': True, '$or': [{'breed': 'st_bernard'}, {'id': {'$regex': 'st.bernard'}}]},
    {'id':1, 'breed_tags':1, 'breed':1}
).limit(5)
```

**How to fix:** Once you know the actual stored value (e.g. 'st. bernard'), update:
```python
db.products_master.update_many(
    {'soul_made': True, 'breed_tags': 'st. bernard'},  # whatever the wrong value is
    {'$set': {'breed_tags': ['st_bernard']}}
)
```

### ISSUE B — Missing ADOPT pillar (P1) — 21 breeds need adopt products
These breeds have NO adopt products in breed_products at all.
They need NEW products generated via the AI mockup pipeline.

**Breeds missing adopt (21 total):**
alaskan_malamute, american_bully, basenji, bichon_frise, bulldog, cavalier,
chow_chow, corgi, dalmatian, french_bulldog, greyhound, husky, indie,
indian_spitz, irish_setter, jack_russell, labradoodle, lhasa_apso,
saint_bernard, schnoodle, yorkshire

**What adopt products look like (from indian_pariah which HAS them):**
- adoption_folder, breed_checklist, starter_kit, welcome_kit (2 products per breed)

**How to generate (use the batch API):**
```
POST /api/mockups/generate-batch
{
  "pillar": "adopt",
  "limit": 2,
  "breed_filter": "alaskan_malamute"   ← one breed at a time
}
```
CRITICAL: Always use "pillar" filter (not just tag_pillar) — see AGENT_RULES.md Rule 1

### ISSUE C — Missing FAREWELL pillar (P1) — 8 breeds
Breeds with NO farewell products:
alaskan_malamute, basenji, bichon_frise, bulldog (english), corgi,
indian_spitz, labradoodle, saint_bernard

Same generation approach as adopt above but with "pillar": "farewell"

### ISSUE D — Genuinely sparse breeds (P2) — need full generation
These breeds have < 50 products total and need full generation across all pillars:

| Breed | Members See | Target | Shortfall |
|---|---|---|---|
| indian_spitz | 25 | 94 | 69 missing |
| saint_bernard | 29 | 94 | 65 missing |
| irish_setter | 21 | 94 | 73 missing |
| jack_russell | 25 | 94 | 69 missing |
| basenji | 36 | 94 | 58 missing |
| bichon_frise | 28 | 94 | 66 missing |
| corgi | 38 | 94 | 56 missing |

---

## THE PRODUCT TYPES (What Each Pillar Contains)

### What a "complete" breed looks like (based on labrador/beagle/chihuahua ~101 products):

| Pillar | Product Types | Count |
|---|---|---|
| celebrate | bandana, mug, keychain, frame, tote_bag, party_hat, birthday_cake_topper, pupcake_set, birthday_card, party_banner, party_favor_pack, color_variants(4) | ~17 |
| go | blanket, carrier_tag, luggage_tag, passport_holder, travel_bowl, welcome_mat, car_sticker, car_seat_protector, walking_set, personalized_lead | ~17 |
| care | grooming_apron, grooming_pouch, pet_robe, pet_towel, lick_mat, feeding_mat, food_container, placemat, crate_mat, care_guide | ~17 |
| dine | food_bowl, feeding_mat, food_container, dining_placemat, lick_mat, placemat | ~9 |
| shop | phone_case, wall_art, room_sign, cushion_cover, tote_bag | ~5-6 |
| play | play_bandana, playdate_card, fetch_toy_set, rope_toy, activity_toy, personalized_toy | ~14 |
| learn | care_guide, training_log, treat_pouch, milestone_book, breed_checklist | ~5 |
| paperwork | vaccine_folder, document_holder, id_tag, passport_holder | ~5 |
| emergency | emergency_card, medical_alert_tag, emergency_pouch, first_aid_kit, id_tag | ~4 |
| farewell | memorial_ornament, paw_print_frame, keepsake_box, remembrance_card, memorial_candle | ~6 |
| adopt | adoption_folder, breed_checklist, starter_kit, welcome_kit | ~2 |

---

## THE WATERCOLOR STYLE (What "Yappy Style" Means Here)

All soul products use this prompt pattern:
```
A premium [PRODUCT_DESCRIPTION] on a clean white background.
The [product] features a beautiful soulful watercolor illustration of a [BREED_NAME] dog face
[printed/visible on] the [product surface].
The watercolor illustration style is soft, emotional, and artistic - warm earth tones,
gentle soulful expression.
NO TEXT on the [product] - just the beautiful dog portrait illustration.
Professional product photography, premium quality.
```

Example — Labrador Bandana:
"A premium white cotton pet bandana laid flat on a clean white background.
The bandana features a beautiful soulful watercolor illustration of a Labrador Retriever
dog face PRINTED DIRECTLY ON the fabric center. The watercolor illustration style is soft,
emotional, and artistic - warm earth tones, gentle soulful expression. NO TEXT on the
bandana — just the beautiful dog portrait illustration."

---

## CRITICAL RULES (Never Break These)

1. **NEVER use `if collection:` in PyMongo** → use `if collection is not None:`
2. **NEVER use `pillar: tag_pillar` alone in batch generation** → always use `pillar` as filter
3. **DO NOT regenerate the 295 GROUP 2 products** (hash-suffix IDs `bp-{breed}-{name}-xxxxxx`)
   These were fixed manually and are stable. Regenerating will overwrite with generic images.
4. **breed_tags must always be underscore format** → ['st_bernard'] not ['st bernard'] not ['St. Bernard']
5. **indie and indian_pariah are the same breed** — backend aliases handle it, DO NOT merge
6. **Desktop SoulPage.jsx files are LOCKED** — never modify
7. **server.py is never modified directly** — only add new route files

---

## STEP BY STEP PLAN (What To Do Next)

### Step 5 — Fix all breed_tags with spaces ✅ DONE
Fixed st_bernard (108), irish_setter (55), jack_russell (52) + swept ALL 56 breeds.
683 more products fixed. Zero breed_tags with spaces remaining anywhere.
Result: 27 HEALTHY breeds (90+), 25 GOOD (40-89), 4 LOW (basenji/bichon_frise/corgi/saint_bernard)

### Step 6 — Wrong-image GROUP 2 dine products fixed ✅ DONE
- Scanned all GROUP 2 (hash-suffix) products across all 11 pillars
- Only dine had wrong images. Other pillars were clean.
- 21 recipe cards archived (showed bowl image — no correct image exists)
  Affected breeds: beagle, border_collie, boxer, chihuahua, cocker_spaniel, dachshund,
  dalmatian, doberman, french_bulldog, german_shepherd, golden_retriever, great_dane,
  husky, indie, labrador, maltese, pomeranian, poodle, pug, rottweiler, shih_tzu
- 4 food mats fixed with correct feeding_mat.webp image (indie, husky, french_bulldog, dalmatian)
- 38 ceramic bowl products left untouched (correctly using bowl image ✓)

### Step 7 — All breed_tags space→underscore sweep ✅ DONE
Fixed 683 additional products across all 56 breeds. Zero breed_tags with spaces remaining.
Full mapping: border collie→border_collie, great dane→great_dane, shih tzu→shih_tzu, etc.

### Step 8 — Seeded 84 missing adopt + farewell entries with correct prompts ✅ DONE
Script: /app/backend/scripts/seed_missing_adopt_farewell.py
- 34 new ADOPT entries (21 breeds × 2 types: welcome_kit, adoption_folder)
  8 already existed so skipped
- 50 new FAREWELL entries (8 breeds × 7 types: memorial_ornament, memory_box,
  paw_print_frame, paw_print_kit, keepsake_box, memorial_candle, remembrance_card)
  6 already existed so skipped
- All have CORRECT breed-specific prompts
- All have is_mockup=False (no image yet) — READY FOR AI GENERATION
- Will auto-sync to products_master when images are generated

### Step 9 — Generate AI images for the 84 seeded entries (NEXT)
Diagnose why members see far fewer products than exist in soul gen.
Check: what is breed_tags actually set to in products_master for these breeds?
Fix: normalize to correct underscore slug.

### Step 6 — Generate missing adopt products for 21 breeds
Run targeted batch: `POST /api/mockups/generate-batch {"pillar":"adopt","limit":2,"breed_filter":"<breed>"}`
Do one breed at a time. Verify image generated. Repeat for all 21.

### Step 7 — Generate missing farewell products for 8 breeds
Same approach as Step 6 but pillar: "farewell"

### Step 8 — Full generation for sparse breeds (indian_spitz, saint_bernard, etc.)
These need a full sweep across all pillars.
Start with: `{"pillar":"dine","limit":9,"breed_filter":"indian_spitz"}`
Then care, play, go, learn, shop, paperwork, emergency, farewell, adopt.

---

## DB COLLECTION REFERENCE

| Collection | Purpose | Key Query |
|---|---|---|
| breed_products | Soul Generator source of truth | {breed:'labrador', is_active:True} |
| products_master | Member-facing catalog | {soul_made:True, breed_tags:'labrador', visibility.status:'active'} |

**MongoDB:** `mongodb://localhost:27017` / DB: `pet-os-live-test_database`

---

## API REFERENCE

| Endpoint | Purpose | Example |
|---|---|---|
| POST /api/mockups/generate-batch | Generate AI products | {"pillar":"adopt","breed_filter":"corgi","limit":2} |
| GET /api/admin/breed-products | View Soul Generator products | ?breed=newfoundland&limit=50 |
| GET /api/product-box/products | View Soul Box products | ?soul_made=true&breed=labrador |

---

## ADOPT PROMPT TEMPLATES (use these exactly — do not invent new ones)

```
welcome_kit:
"Professional product photography of a new pet welcome home kit for {BREED_NAME} dogs,
includes welcome banner, first toy, treat jar, collar, and certificate,
gift presentation, white background. Warm joyful colours, celebration of a new family member."

adoption_folder:
"Professional product photography of a pet adoption document folder with {BREED_NAME} dog design,
holds adoption certificate and papers, keepsake organizer, new pet paperwork, white background.
Premium quality, tasteful design."
```

## FAREWELL PROMPT TEMPLATES (use these exactly — do not invent new ones)

```
memorial_ornament:
"A beautiful memorial Christmas ornament photographed on a soft white background.
The ornament features a beautiful soulful watercolor illustration of a {BREED_NAME} dog face
ON the ceramic surface. Angel wings surrounding the portrait, soft golden halo effect.
'Forever in Our Hearts' text delicately hand-lettered below the portrait.
Warm, comforting, memorial aesthetic."

memory_box:
"Beautifully crafted wooden memory box with {BREED_NAME} silhouette engraved on lid,
velvet interior, keepsake quality, warm amber wood tones, studio photography, white background."

paw_print_frame:
"A premium memorial frame with paw print impression area photographed on a clean white background.
The frame features a beautiful soulful watercolor illustration of a {BREED_NAME} dog in the main photo area.
Space for clay paw print impression on the side.
'Always With Me' text elegantly engraved on the frame border."

paw_print_kit:
"Professional product photography of a pet paw print impression kit for {BREED_NAME} dogs,
clay and frame included, memorial keepsake, sample paw print visible,
sentimental memorial product, white background."

keepsake_box:
"Professional product photography of a beautiful wooden pet memorial keepsake box
with engraved {BREED_NAME} dog design, velvet interior visible,
collar and photo inside, remembrance storage, white background."

memorial_candle:
"Professional product photography of a pet memorial candle in glass jar with
{BREED_NAME} dog silhouette design, soft glowing light, remembrance tribute,
peaceful and calming aesthetic, white background."

remembrance_card:
"Professional product photography of a set of pet remembrance memorial cards
featuring beautiful {BREED_NAME} dog artwork, sympathy cards with envelopes,
tasteful design, tribute stationery, white background."
```

## HOW TO GENERATE IMAGES FOR THE 84 SEEDED ENTRIES

Run the batch API — one breed at a time:
```
POST /api/mockups/generate-batch
{"pillar": "adopt",   "breed_filter": "corgi",   "limit": 2}
{"pillar": "farewell","breed_filter": "corgi",   "limit": 7}
```
After generation: images upload to Cloudinary → auto-sync to products_master → visible to members.
Script to re-run seeding if needed: /app/backend/scripts/seed_missing_adopt_farewell.py

---
*Document updated 2026-04. All fixes applied, 84 entries seeded with correct prompts.*

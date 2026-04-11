# Mira Picks — Living Constitution
> Last updated: 2026-04-11 | Maintained by: Aditya + Emergent Agent
> Status: REPAIR IN PROGRESS — update this file as each pillar is verified

---

## ARTICLE 1 — What Mira Picks IS

Mira Picks is the personalisation engine that decides **which products and services show first — and why — for each specific pet** across all 12 pillars.

**It is NOT a generic bestseller list.**
**It is NOT sorted by price or date.**
**It IS a pet-aware, breed-aware, allergen-safe ranking system.**

---

## ARTICLE 2 — The Two-Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│  LAYER A: CLIENT-SIDE INSTANT FILTER  (useMiraFilter.js) │
│  Runs: Every page load. In the browser. 0ms. No API.     │
│  Does: BLOCKS allergens. RANKS by breed/loves/size.      │
│  Source: Pet document from DB (allergies, loves, breed)  │
└──────────────────────────────────────────────────────────┘
                         (works alongside)
┌──────────────────────────────────────────────────────────┐
│  LAYER B: SERVER-SIDE AI SCORING (mira_score_engine.py)  │
│  Runs: Background, once per 24h per pet×pillar.          │
│  Does: Deep personalisation via Claude Sonnet 4.6        │
│  Saves: mira_product_scores collection in MongoDB        │
│  NOTE: Currently BYPASSED in Mira Picks section (see §6) │
└──────────────────────────────────────────────────────────┘
```

---

## ARTICLE 3 — The Priority Order (Inviolable)

This order MUST be respected on every pillar. No exceptions.

```
PRIORITY 1 — ALLERGEN BLOCK (hard removal, not deprioritise)
  ● Mojo allergic to chicken → ZERO chicken products shown. Ever.
  ● Reads from: vault.allergies, health_data.allergies, learned_facts
  ● Synonym map: chicken → [chicken, poultry, fowl]
  ●              fish   → [fish, salmon, tuna, cod, anchovy]  ← NOTE: if allergic to fish
  ●              beef   → [beef, bovine]
  ●              soy    → [soy, soya, tofu, edamame]

PRIORITY 2 — LOVES FIRST (rank 0-1, top of list)
  ● Mojo loves salmon → salmon products appear first
  ● Reads from: preferences.favorite_treats, doggy_soul_answers.favorite_protein, learned_facts
  ● Rank 0: breed match + love (perfect)
  ● Rank 1: loves match only

PRIORITY 3 — BREED PRODUCTS (rank 2)
  ● Mojo is Indie → Indie-specific products rank next
  ● Coco is Maltipoo → Maltipoo-specific products rank next
  ● Reads from: pet.breed, product name, product breed_tags, product breed_targets
  ● "Wrong breed" products: rank 14 (shown last, not hidden)

PRIORITY 4 — HEALTH & SAFETY (rank 3-4)
  ● Products safe for health condition → rank 3
  ● Products explicitly allergen-free → rank 4

PRIORITY 5 — SIZE & LIFE STAGE (rank 5-6)
  ● Right size for pet weight → rank 5
  ● Right life stage (puppy/adult/senior) → rank 6
  ● Puppy products shown to adult dogs: HARD BLOCK

PRIORITY 6 — NEUTRAL / UNIVERSAL (rank 10)
  ● Products that are safe but have no specific signal

PRIORITY 7 — WRONG FIT (rank 11-15, shown last)
  ● Wrong life stage → rank 11
  ● Wrong size → rank 13
  ● Wrong breed (specific other breed) → rank 14
  ● Conflicts nutrition goal → rank 15, dimmed at 55% opacity
```

---

## ARTICLE 4 — Pillar-Level Category Rules

Each pillar has a BLOCKED category list. Products from these categories
MUST NOT appear in that pillar's Mira Picks, even if the DB tags them there.

```
DINE pillar — block these categories:
  [cakes, breed-cakes, mini-cakes, pupcakes, dognuts, hampers,
   cat-cakes, cat-party, cat-hampers, cat-gotcha, birthday-cakes]
  Also block: any product with pillar=celebrate
  Applied on: DineSoulPageDesktopLegacy (CELEBRATE_CATS) + DineMobilePage (CELEBRATE_CATS) ✅

CELEBRATE pillar — block these categories:
  [food, dry-food, wet-food, supplements, probiotics, grooming, leashes,
   collars, harnesses, training]
  Also block: any product with pillar=dine
  Applied on: CelebrateMobilePage (DINE_BLOCK_CATS) + CelebratePageNew (DINE_BLOCK_CATS) ✅

GO pillar — block these categories:
  [cakes, food, supplements] ← not yet implemented; add during verify sprint

CARE pillar — block these categories:
  [cakes, food] ← not yet implemented

SHOP pillar — no hard blocks; all merchandise is universal
  Exception: products with pillar=celebrate (birthday cakes etc.)

All others (Adopt, Farewell, Emergency, Learn, Paperwork):
  No hard category blocks currently. Add as issues are discovered.
```

---

## ARTICLE 5 — Services in Mira Picks

Services always appear INTERLEAVED with products. The interleave pattern is:
```
[Product 1] [Product 2] [Service 1] [Product 3] [Product 4] [Service 2] ...
```

Services NEVER get allergen-filtered (grooming, training, etc. are safe).
Services are fetched from: `GET /api/services?pillar={pillar}&limit=4`
Services have NO Claude score — they always appear (up to 4 per pillar).

---

## ARTICLE 6 — Current Architecture Decision (Post-April 11 Fix)

**As of 2026-04-11, the Mira Picks section on ALL desktop pages uses:**

```
❌ REMOVED:  GET /api/mira/claude-picks/{pet_id}?pillar=X
   WHY:      Backend scoring (mira_score_engine.py) used litellm.completion()
             (synchronous) inside async def — blocked the event loop for
             10-15s per Claude batch, timing out ALL API requests site-wide.

✅ REPLACED: GET /api/admin/pillar-products?pillar=X&limit=200&breed=...&allergens=...
             + applyMiraFilter(products, pet)  [client-side, instant]
   WHY:      Instant. Allergen-safe. Breed-aware. Fresh every load.
             No stale scores. No event loop blocking.
```

**Layer B (Claude scoring) is still running** in the background and saving to
`mira_product_scores`. It will be re-enabled for Mira Picks once the async
fix is validated and the scores are clean.

---

## ARTICLE 7 — Known Bugs & Repair Status

| Pillar | Breed-First | Allergen Block | No Cross-Pillar | Services | Status |
|--------|-------------|----------------|-----------------|----------|--------|
| Dine | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 (desktop + mobile) | ✅ | VERIFIED ✅ |
| Celebrate | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 (mobile + desktop) | ✅ | VERIFIED ✅ |
| Go | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ Not added yet | ✅ | VERIFY NEXT |
| Care | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |
| Play | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |
| Shop | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |
| Adopt | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |
| Farewell | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |
| Emergency | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |
| Learn | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |
| Paperwork | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |
| Fit | ✅ Fixed Apr 11 | ✅ Fixed Apr 11 | ⬜ | ✅ | VERIFY NEXT |

---

## ARTICLE 8 — The Data Sources for Pet Profile

`getAllergiesFromPet(pet)` reads from (in order):
1. `pet.vault.allergies[].name`  ← PRIMARY (set by Health Panel)
2. `pet.health_data.allergies`   ← Secondary (legacy sync)
3. `pet.doggy_soul_answers.food_allergies`
4. `pet.preferences.allergies`
5. `pet.learned_facts[type=allergy].value`

`extractLoves(pet)` reads from:
1. `pet.preferences.favorite_treats`
2. `pet.doggy_soul_answers.favorite_protein`
3. `pet.learned_facts[type=loves].value`

`extractBreed(pet)` reads from:
1. `pet.breed`  ← normalised via BREED_SYNONYMS
2. `pet.doggy_soul_answers.breed`

---

## ARTICLE 9 — The 40,000 Score Question

At 4am UTC on April 11, 2026, the production DB had ~40,000 `mira_product_scores`.
The preview DB had ~44,891.

These are NOT 40,000 unique products. They are:
```
number_of_pets × number_of_pillars × products_per_pillar
Example: 50 pets × 6 pillars × ~150 products = 45,000 score records
```

After deletion of Mojo's stale scores and restart: preview DB now has 15,154.
The scores are rebuilding as pets visit pages.

**What broke the 40,000:** Unknown. Likely a production DB restore that
used a preview snapshot taken at a point when preview had fewer scores.
The Emergent deploy history (not in git log) holds the exact timestamp.

---

## ARTICLE 10 — Rules for Future Agents

1. **NEVER use `filterBreedProducts` alone** for Mira Picks. Always use `applyMiraFilter`
   which does allergens + breeds + loves + size + life stage in one pass.

2. **NEVER re-enable `claude-picks` endpoint** for Mira Picks until `litellm.acompletion`
   is confirmed working end-to-end AND scores are verified clean.

3. **ALWAYS use `getAllergiesFromPet(pet)` from `useMiraFilter.js`** — NOT the local
   `getAllergies(pet)` function in each page (it misses `vault.allergies`).

4. **NEVER call `litellm.completion()` inside an `async def`** — use `litellm.acompletion()`.
   The sync version blocks the entire FastAPI event loop.

5. **Desktop pages are `*SoulPage.jsx` and `*DesktopLegacy.jsx`.**
   Mobile pages are `*MobilePage.jsx`. They are SEPARATE. Fix one, check the other.

6. **PILLAR_CATS in `mira_score_engine.py`** is the server-side category allowlist.
   **CELEBRATE_CATS in `DineSoulPageDesktopLegacy.jsx`** is the client-side block list.
   Both must be kept in sync as new products are added.

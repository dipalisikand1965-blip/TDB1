# AGENT RULES — The Doggy Company
## Last Updated: 2026-04-05
## READ THIS BEFORE TOUCHING BREED PRODUCTS OR GENERATION

---

## RULE 1: The `tag_pillar` parameter NEVER writes to `breed_products`

The `tag_pillar` parameter in `/api/mockups/generate-batch` is ONLY used as a fallback
for `products_master` sync when the product has no pillar set.
It must NEVER overwrite the `pillar` field in `breed_products`.

**WHY THIS RULE EXISTS:**
An agent passed `tag_pillar: "emergency"` to generate emergency products.
The batch picked up ALL 88 pending products (not just emergency ones), and wrote
`pillar: "emergency"` back to 32 Journal Notebook records in `breed_products`.
This corrupted the paperwork pillar data. All 32 had to be manually restored.

**CORRECT PATTERN — always use `pillar` (filter), never `tag_pillar` alone:**
```json
{ "pillar": "emergency", "limit": 32 }
```
This restricts which products are fetched. `tag_pillar` is only a metadata tag.

---

## RULE 2: The 463 wrong-image products (hash-suffix IDs)

Products with IDs matching the pattern `bp-{breed}-{name}-[a-f0-9]{6}` (e.g.
`bp-labrador-breed-play-bandana-6ea4bf`) were generated in an EARLY BATCH with a
completely generic, non-breed-specific prompt:
> "Watercolour illustration of a dog product, soft pastel style, white background"

These images are WRONG — generic stock photos, not breed-specific watercolor art.

**STATUS AS OF 2026-04-05:**
- 168 confirmed duplicates → ARCHIVED (do NOT restore, proper versions exist)
- 295 unique products → REGENERATED with proper breed-specific prompts

**DO NOT restore the 168 archived hash-suffix products. Proper versions exist.**

---

## RULE 3: Mojo = Indie = Indian Pariah

- Member login: `dipali@clubconcierge.in` / `test123`
- Pet name: Mojo, Breed: `indie` (reverse-aliased to `indian_pariah` on backend)
- Products tagged `breed: indie` OR `breed: indian_pariah` both show for Mojo
- When verifying Indie products, always log in as Mojo

---

## RULE 4: Product ID formats — know the difference

| Format | Example | Status |
|---|---|---|
| `bp-{breed}-{type}-{pillar}` | `bp-labrador-bandana-celebrate` | CLEAN ✓ |
| `breed-{breed}-{type}` | `breed-labrador-bandana` | OLD format, valid ✓ |
| `bp-{breed}-{name}-[6-char-hex]` | `bp-labrador-play-bandana-6ea4bf` | EARLY BATCH — may have wrong images |
| `seed-{pillar}-{name}` | `seed-celebrate-birthday-cake` | Manually seeded — verify soul_made |

---

## RULE 5: Never use `tag_pillar` with a large limit without a `pillar` filter

Always pair `tag_pillar` with the `pillar` filter parameter. Without the filter,
the batch picks up ALL pending products across ALL pillars and tags them wrong.

---

## RULE 6: Archive/Restore propagates to BOTH collections

As of 2026-04-05, archiving/restoring a soul_made product via the admin panel
propagates visibility state to BOTH `products_master` AND `breed_products`.
This is implemented in `unified_product_box.py` PUT endpoint.

---

## RULE 7: Expected product count per breed ~94 products across 11 pillars

Each of the 56 breeds should have approximately 94 products.
Significantly fewer = missing or incorrectly archived products. Investigate before touching.

---

## RULE 8: Soul Box requires soul_made + visibility in products_master

For a product to appear in Soul Box:
1. `soul_made: True` in `products_master`
2. `visibility.status: active` in `products_master`
3. The write-through `_sync_to_products_master` in `mockup_routes.py` handles
   this automatically for all generated products. Do not bypass it.

---

## KNOWN TECHNICAL DEBT (do not fix without user approval)

- `server.py` 25,000+ lines — needs route splitting (P2, do not touch)
- `Admin.jsx` 7,000+ lines — needs componentization (P2, do not touch)
- Production Atlas DB has IP whitelist blocked — always use local preview DB
- Breed name duplicates: yorkshire/yorkshire_terrier, husky/siberian_husky,
  cavalier/cavalier_king_charles — cosmetic only, do not merge without approval

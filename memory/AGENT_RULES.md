# THE DOG COMPANY — AGENT MASTER RULES
# Read this FIRST before doing ANYTHING on any pillar
# Last updated: March 2026

---

## 1. THE GOLDEN RULE — SINGLE SOURCE OF TRUTH

```
products_master (MongoDB) = THE ONLY place products are created, stored, and edited.
```

### Workflow for ANY new product:
1. CREATE the product in **Unified Product Box** (`/admin` → Product Box → + New Product)
2. ASSIGN pillar(s) + category in Product Box editor
3. The pillar page READS from `products_master` — it never owns data

**Never create products directly in a pillar-specific collection or seed script without also adding them to `products_master`.**

---

## 2. IMAGE RULES — NEVER BREAK THESE

| Product Type | Image Rule | Where Stored |
|---|---|---|
| Regular products (dine, care, fit, etc.) | AI-generated **realistic contextual photography** | Cloudinary (`res.cloudinary.com`) |
| Services (all pillars) | **Watercolour illustrations** | Cloudinary |
| Bundles | **Watercolour illustrations** | Cloudinary |
| Soul Made products | **Custom AI breed illustration** | Cloudinary |

### Forbidden image sources:
- **Unsplash** — never acceptable as a final image. Only used as temporary placeholder.
- **static.prod-images.emergentagent.com** (the "rope toy" URL) — delete immediately if found
- Leaving `image_url` empty — always run AI Images before finishing a pillar

### Image field priority (frontend rendering):
```
product.image_url  →  first (Cloudinary AI photo)
product.image      →  fallback ONLY if image_url is empty AND image contains shopify.com
product.images[0]  →  last resort
```
**This order is already correct in all 28+ frontend components. Do NOT change it.**

---

## 3. AI IMAGE GENERATION — HOW IT WORKS

### To generate images for a pillar:
```
Admin Panel → AI IMAGES button → OK (Products) → type pillar name (e.g. "care")
```

### LOOP SAFETY (critical):
- Products with `res.cloudinary.com` in `image_url` are **NEVER re-processed**
- `force_regenerate=False` by default — this is the protection
- You can safely click AI IMAGES multiple times — it only processes what's missing

### If generation was interrupted (agent ran out of context, server restart, etc.):
```bash
# Any agent can call this ONE endpoint to resume from exactly where it stopped:
POST /api/ai-images/auto-resume

# Check progress:
GET /api/ai-images/status

# Check how many still need generation:
GET /api/ai-images/stats
```
Or from curl:
```bash
API_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
curl -X POST "$API_URL/api/ai-images/auto-resume"
curl -s "$API_URL/api/ai-images/status"
```

### Generation runs on the SERVER, not the agent:
- If your agent context ends mid-generation, the generation continues on the server
- The browser admin panel shows live progress (bottom-right panel)
- Just keep the admin tab open

---

## 4. DATABASE RULES

### Collection to use:
```python
db.products_master  # ALWAYS — this is the SSOT
db.products         # Legacy Shopify products only — do not mix with pillar products
```

### Image field update (when saving generated images):
```python
# ALWAYS update BOTH fields together:
{
    "$set": {
        "image_url": cloudinary_url,  # Primary — all frontend uses this
        "image": cloudinary_url,       # Sync to legacy field too
        "ai_generated_image": True,    # Marks as done — prevents re-generation
        "image_updated_at": datetime.now(timezone.utc).isoformat()
    }
}
```

### Seed safety:
- Seed scripts check existing IDs and **skip** products already in `products_master`
- Safe to run "Seed All Pillars" — it never overwrites existing products
- The server NEVER auto-seeds `products_master` on startup (only FAQs/Collections/Services)

---

## 5. PRODUCT BOX ADMIN UI — HOW TO USE

### Find products for a pillar:
1. Admin → Product Box
2. Click pillar button (e.g. "Care")
3. A search bar appears — type product name or sub-category (e.g. "supplements")
4. Results appear (search always resets to page 1)

### Change a product's pillar:
- Click the pencil icon on any product row → select "Pillars" quick edit
- Updates `pillar` + `pillars` + `primary_pillar` fields all at once

### Edit product image:
- Click the product's thumbnail image directly
- Paste new URL or upload file
- AI Images tool generates Cloudinary images automatically

---

## 6. PILLAR SETUP CHECKLIST (for ANY new pillar, e.g. CARE)

Before calling a pillar "done", verify all items:

```
[ ] Products created in Product Box with pillar + category assigned
[ ] AI IMAGES run for this pillar → all images are Cloudinary (not Unsplash/empty)
    POST /api/ai-images/generate-pillar-images?pillar=care&force_regenerate=false
[ ] Services created for this pillar with watercolour illustrations
    POST /api/ai-images/generate-service-images
[ ] Pillar page (/care) shows products from products_master (verify via /api/products?pillar=care)
[ ] Product names, prices, and categories are correct
[ ] No duplicate images (run: check products with same image_url in same pillar)
[ ] Admin Product Box search finds all products by name and sub-category
[ ] Verify stats: GET /api/ai-images/stats → pillar.care.products.needs_generation should be 0
```

---

## 7. VERIFY YOUR WORK — QUICK CHECKS

```bash
# Check image quality for a pillar:
python3 -c "
import pymongo
db = pymongo.MongoClient('mongodb://localhost:27017')['pet-os-live-test_database']
from collections import Counter
products = list(db.products_master.find({'pillar': 'care'}, {'name':1,'image_url':1,'_id':0}))
types = Counter()
for p in products:
    url = p.get('image_url','')
    if 'cloudinary' in url: types['cloudinary'] += 1
    elif 'unsplash' in url: types['unsplash'] += 1
    elif url: types['other'] += 1
    else: types['empty'] += 1
print(f'Total: {len(products)}')
for k,v in types.items(): print(f'  {k}: {v}')
"

# Check for duplicate images:
python3 -c "
import pymongo
from collections import Counter
db = pymongo.MongoClient('mongodb://localhost:27017')['pet-os-live-test_database']
urls = [p.get('image_url','') for p in db.products_master.find({'pillar': 'care'})]
dupes = [(url, count) for url, count in Counter(urls).items() if count > 1 and url]
print(f'Duplicate images: {len(dupes)}')
for url, count in dupes[:5]: print(f'  {count}x {url[:60]}')
"
```

---

## 8. KNOWN ANTI-PATTERNS — NEVER DO THESE

1. **Never** use `product.image` before `product.image_url` in frontend rendering
2. **Never** leave `image_url` as Unsplash URL when finishing a pillar
3. **Never** create products in a pillar-specific collection instead of `products_master`
4. **Never** run "Seed All Pillars" expecting it to add images — it only creates empty products
5. **Never** call `generate-product-images` endpoint for pillar products (wrong collection) — use `generate-pillar-images`
6. **Never** bulk-update ALL products with the same image URL
7. **Never** hardcode image URLs in frontend components

---

## 9. KEY API ENDPOINTS REFERENCE

```
# Products
GET  /api/products?pillar=care&limit=20          — public pillar products
GET  /api/product-box/products?pillar=care&search=shampoo  — admin search
PUT  /api/product-box/products/{id}              — update product (pillar, image, etc.)

# AI Images
POST /api/ai-images/generate-pillar-images?pillar=care&force_regenerate=false
POST /api/ai-images/generate-service-images
POST /api/ai-images/auto-resume                  — resumes any incomplete generation
GET  /api/ai-images/status                       — live progress
GET  /api/ai-images/stats                        — counts by pillar (from products_master)

# Admin
GET  /api/admin/pillar-products?pillar=care&limit=100  — pillar-specific products
POST /api/admin/products/bulk-assign-category    — bulk assign categories
```

---

## 10. CURRENT STATUS (as of March 2026)

| Pillar | Products | Cloudinary Images | Status |
|---|---|---|---|
| Dine | 48 food products | Unsplash (generation in progress) | IN PROGRESS |
| Celebrate | varies | 1496 Cloudinary done | PARTIAL |
| Shop | varies | 1337 Cloudinary done | PARTIAL |
| Care | - | - | NOT STARTED |
| All others | varies | partial | PARTIAL |

Run `GET /api/ai-images/stats` for current numbers.

# The Doggy Company - Complete Image Source Documentation
## Where Every Image Comes From

> **Last Updated:** March 13, 2026
> **Purpose:** Comprehensive reference for all image sources in the platform

---

## IMAGE GOLDEN RULES (NON-NEGOTIABLE)

| Content Type | Image Style | Source |
|-------------|-------------|--------|
| **Products** | Realistic photography | AI-generated (GPT-Image-1) or Cloudinary uploads |
| **Services** | Watercolor illustrations | AI-generated (GPT-Image-1) + Cloudinary |
| **Bundles** | Watercolor illustrated compositions | AI-generated (GPT-Image-1) + Cloudinary |
| **Topic Cards** | Watercolor illustrations | AI-generated + Cloudinary |
| **Breed Illustrations** | Soulful watercolor portraits | AI-generated + Cloudinary |

---

## 1. PRODUCT IMAGES

### Source Collections
- `products_master` - Main product catalog
- `unified_products` - Unified product view across pillars
- `products` - Legacy products

### Image Fields (in order of priority)
```javascript
image_url || image || null
```

### Generation Method
- **Endpoint**: `/api/ai-images/generate-product-images`
- **Service File**: `/app/backend/ai_image_service.py`
- **Prompt Style**: Realistic product photography, clean background
- **Storage**: Cloudinary (`res.cloudinary.com/duoapcx1p/`)
- **Alternative**: emergentagent CDN (`static.prod-images.emergentagent.com/`)

### Admin Upload
- **Component**: `/app/frontend/src/components/admin/ProductEditor.jsx`
- **Endpoint**: `/api/admin/product/{product_id}/upload-image`
- **Storage**: Cloudinary with public_id `doggy/products/{timestamp}`

---

## 2. SERVICE IMAGES (Watercolor Illustrations)

### Source Collections
- `services_master` - Main service catalog (1,115+ services)
- `services` - Legacy services

### Image Fields (in order of priority)
```javascript
image_url || watercolor_image || image || null
```

### Generation Method
- **Function**: `get_service_image_prompt()` in `/app/backend/ai_image_service.py`
- **Endpoint**: `/api/ai-images/generate-service-images`
- **Prompt Style**: "Soft watercolor illustration, warm pastel colors, gentle brushstrokes, elegant and playful, minimal background, artistic pet illustration style"
- **Storage**: Cloudinary

### Pillar-Specific Prompts
Each pillar has customized watercolor prompts:
- **Celebrate**: Party scenes, cake, decorations
- **Care**: Grooming, health, comfort items
- **Dine**: Food bowls, treats, mealtime
- **Stay**: Cozy beds, boarding facilities
- **Fit**: Active dogs, exercise equipment
- **Learn**: Training scenes, education
- **Travel**: Carriers, adventure gear
- **Advisory**: Consultation, planning scenes
- **Emergency**: Urgent care, first aid
- **Farewell**: Memorial, peaceful scenes
- **Adopt**: New home, welcome scenes

---

## 3. BUNDLE IMAGES (Watercolor Compositions)

### Source Collections
- `bundles` - General bundles
- `product_bundles` - Product bundle packages
- `{pillar}_bundles` - Pillar-specific bundles (e.g., `care_bundles`, `dine_bundles`)

### Image Fields
```javascript
image_url || image || watercolor_image || null
```

### Generation Method
- **Function**: `get_bundle_image_prompt()` in `/app/backend/ai_image_service.py`
- **Endpoint**: `/api/ai-images/generate-bundle-images`
- **Prompt Style**: "Soft watercolor illustrated composition, warm pastel colors, gentle brushstrokes, elegant arrangement of pet care items, artistic illustration style, whimsical and playful, cream or soft white background"
- **Storage**: Cloudinary

### Fix Script
- **File**: `/app/backend/scripts/fix_care_bundle_images.py`
- **Purpose**: Regenerate bundle images that have stock photos (Unsplash)

---

## 4. MIRA'S PICKS IMAGES

### Source
- **Component**: `/app/frontend/src/components/PillarPicksSection.jsx`
- **API Endpoint**: `/api/mira/top-picks/{pet_id}/pillar/{pillar}`
- **Route File**: `/app/backend/app/api/top_picks_routes.py`

### Data Sources (in order)
1. `unified_products` - Soul-matched products
2. `products_master` - Fallback products
3. `services_master` - Pillar services
4. Concierge suggestions (AI-generated, no image)

### Image Resolution
```javascript
item.image_url || item.image || null
```

---

## 5. TOPIC CARDS / PILLAR CATEGORIES

### Source
- **Component**: `/app/frontend/src/components/PillarTopicsGrid.jsx`
- **Data**: `DEFAULT_PILLAR_TOPICS` constant in component

### Image Fields
```javascript
topic.image || topic.imageUrl || null
```

### Storage
- Cloudinary watercolor illustrations
- Generated via AI image service

---

## 6. BREED ILLUSTRATIONS (Soul Portraits)

### Source Collections
- `breed_illustrations` - Breed-specific watercolor portraits
- `breed_products` - Breed-matched products with illustrations

### Generation
- **Endpoint**: `/api/breed-illustrations/generate`
- **Style**: "Soulful watercolor breed portrait, warm tones, artistic"

---

## 7. PET PHOTOS (User Uploaded)

### Source
- `pets` collection - `photo_url` or `photo_base64` fields

### Upload Flow
1. User uploads via `/my-pets` or onboarding
2. Stored in Cloudinary
3. Reference saved to pet document

### Helper Function
```javascript
// /app/frontend/src/utils/petAvatar.js
getPetPhotoUrl(pet) {
  if (pet?.photo_url) return pet.photo_url;
  if (pet?.photo_base64) return `data:${pet.photo_content_type || 'image/png'};base64,${pet.photo_base64}`;
  return '/placeholder-pet.png';
}
```

---

## 8. SOUL MADE COLLECTION (AI Mockups)

### Source Collection
- `breed_products` - AI-generated personalized products

### Generation
- **Script**: `/app/backend/scripts/generate_all_mockups.py`
- **Endpoint**: `/api/mockups/generate`
- **Style**: Realistic product mockups with breed customization

### CRITICAL: $1000 Bug Protection
```python
# SAFE PATTERN - preserves existing mockups
await db.breed_products.update_one(
    {"id": product_id},
    {
        "$set": updatable_fields,
        "$setOnInsert": insert_only_fields
    },
    upsert=True
)
```

---

## 9. ARCHETYPE PRODUCTS (Beautiful Product Cards)

### Source
- **Component**: `/app/frontend/src/components/ArchetypeProducts.jsx`
- **API**: `/api/products?pillar={pillar}&archetype={archetype}`

### Data Source
- `products_master` filtered by pillar and archetype match

### Image Resolution
```javascript
product.image_url || product.image || null
```

---

## 10. CURATED BUNDLES

### Source
- **Component**: `/app/frontend/src/components/CuratedBundles.jsx`
- **API**: `/api/{pillar}/bundles`

### Route Files by Pillar
- `/app/backend/care_routes.py` → `/api/care/bundles`
- `/app/backend/dine_routes.py` → `/api/dine/bundles`
- `/app/backend/stay_routes.py` → `/api/stay/bundles`
- `/app/backend/farewell_routes.py` → `/api/farewell/bundles`
- `/app/backend/adopt_routes.py` → `/api/adopt/bundles`
- `/app/backend/server.py` → Generic `/api/{pillar}/bundles`

---

## IMAGE STORAGE LOCATIONS

### Primary: Cloudinary
- **URL Pattern**: `https://res.cloudinary.com/duoapcx1p/image/upload/...`
- **Public IDs**: `doggy/{category}/{timestamp}`
- **Format**: WebP (auto quality)

### Secondary: Emergent CDN
- **URL Pattern**: `https://static.prod-images.emergentagent.com/jobs/...`
- **Used for**: AI-generated product images

### Legacy: Unsplash (Stock Photos - TO BE REPLACED)
- **URL Pattern**: `https://images.unsplash.com/...`
- **Status**: Being systematically replaced with AI-generated images
- **Detection Query**:
```javascript
{ image: { $regex: "unsplash", $options: "i" } }
```

---

## IMAGE GENERATION SERVICE

### Main Service File
`/app/backend/ai_image_service.py`

### Key Functions
- `generate_ai_image(prompt)` - Core generation using GPT-Image-1
- `get_service_image_prompt(service)` - Watercolor prompts for services
- `get_bundle_image_prompt(bundle)` - Watercolor prompts for bundles
- `process_services_batch(pillar)` - Batch service image generation
- `process_bundles_batch(pillar)` - Batch bundle image generation

### API Endpoints
- `POST /api/ai-images/generate-service-images` - Generate service watercolors
- `POST /api/ai-images/generate-bundle-images` - Generate bundle watercolors
- `GET /api/ai-images/status` - Check generation progress
- `POST /api/ai-images/stop` - Stop current generation

### Environment Variables
- `EMERGENT_LLM_KEY` - For GPT-Image-1 generation
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - For storage

---

## IMAGE FIX SCRIPTS

### Fix Bad Bundle Images
```bash
cd /app/backend && python3 scripts/fix_care_bundle_images.py
```

### Find Products with Stock Photos
```javascript
db.products_master.find({
  $or: [
    { image: { $regex: "unsplash", $options: "i" } },
    { image_url: { $regex: "unsplash", $options: "i" } }
  ]
})
```

### Batch Regenerate Images
```bash
# Via API
curl -X POST "$API_URL/api/ai-images/generate-bundle-images?force_regenerate=true"

# Check progress
curl "$API_URL/api/ai-images/status"
```

---

## TROUBLESHOOTING

### Image Not Showing
1. Check if `image_url` or `image` field exists in document
2. Verify URL is accessible (not expired/deleted)
3. Check if using stock photo URL (needs regeneration)

### Wrong Image Style
1. Products should be realistic → regenerate with product prompt
2. Services should be watercolor → regenerate with service prompt
3. Bundles should be watercolor composition → regenerate with bundle prompt

### Duplicate Images (Same Image Multiple Items)
- Usually indicates batch generation used same prompt
- Fix: Regenerate with unique prompts per item
- Example: The "woman in meeting" bug was 100 products with same static URL

---

## REFERENCE: IMAGE FIELD PRIORITY

```javascript
// Standard resolution order across all components
const getImageUrl = (item) => {
  return item.image_url 
    || item.watercolor_image 
    || item.image 
    || item.thumbnail 
    || '/placeholder.png';
};
```

---

*This documentation is auto-generated and maintained in `/app/memory/docs/IMAGE_SOURCES.md`*
*HTML version at `/app/frontend/public/complete-documentation.html`*

"""
Generate & upload proper product images for the Adopt pillar (91 products).
Run: nohup python3 generate_adopt_images.py > /tmp/adopt_gen.log 2>&1 &
"""
import asyncio, os, sys, base64, logging
from datetime import datetime, timezone

sys.path.insert(0, '/app/backend')
os.chdir('/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

import cloudinary, cloudinary.uploader
from motor.motor_asyncio import AsyncIOMotorClient

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.FileHandler('/tmp/adopt_gen.log'), logging.StreamHandler()]
)
log = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']
LLM_KEY   = os.environ['EMERGENT_LLM_KEY']

PROMPT = "Premium product photo of {name} pet item, clean white background, professional studio photography, high detail, no words"

# ------------------------------------------------------------------
# 29 products to generate
# shared=True  → one image URL applied to ALL products in that group
# ------------------------------------------------------------------
PRODUCTS = [
    # ----- SHARED (1 image → many products) -----
    {
        "slug": "welcome-home-kit",
        "name": "Welcome Home Kit",
        "shared": True,
        "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp",
                  "category": "adoption", "name": {"$regex": "Welcome Home Kit"}},
    },
    {
        "slug": "adoption-document-folder",
        "name": "Adoption Document Folder",
        "shared": True,
        "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp",
                  "category": "adoption", "name": {"$regex": "Adoption Document Folder"}},
    },

    # ----- ESSENTIALS (individual) -----
    {"slug": "collapsible-food-water-bowl",  "name": "Collapsible Food and Water Bowl",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Collapsible Food & Water Bowl"}},
    {"slug": "leather-collar",               "name": "Leather Collar",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Leather Collar"}},
    {"slug": "padded-leash",                 "name": "Padded Leash",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Padded Leash"}},
    {"slug": "plush-monster-toy",            "name": "Plush Monster Toy",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Plush Monster Toy"}},
    {"slug": "adjustable-pet-gate",          "name": "Adjustable Pet Gate",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Adjustable Pet Gate"}},
    {"slug": "paw-print-welcome-mat",        "name": "Paw Print Welcome Mat",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Paw Print Welcome Mat"}},
    {"slug": "bamboo-food-container",        "name": "Bamboo Food Container",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Bamboo Food Container"}},
    {"slug": "woven-toy-basket",             "name": "Woven Toy Basket",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Woven Toy Basket"}},
    {"slug": "slicker-grooming-brush",       "name": "Slicker Grooming Brush",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Slicker Grooming Brush"}},
    {"slug": "natural-puppy-shampoo",        "name": "Natural Puppy Shampoo",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Natural Puppy Shampoo"}},
    {"slug": "safety-nail-clippers",         "name": "Safety Nail Clippers",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Safety Nail Clippers"}},
    {"slug": "microfiber-pet-towel",         "name": "Microfiber Pet Towel",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Microfiber Pet Towel"}},
    {"slug": "stay-essentials-kit",          "name": "Stay Essentials Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Stay Essentials Kit"}},

    # ----- KITS (individual) -----
    {"slug": "new-pet-starter-kit",    "name": "New Pet Starter Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "New Pet Starter Kit"}},
    {"slug": "adoption-day-package",   "name": "Adoption Day Package",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Adoption Day Package"}},
    {"slug": "pet-picnic-kit",         "name": "Pet Picnic Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Pet Picnic Kit"}},
    {"slug": "fetch-training-kit",     "name": "Fetch Training Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Fetch Training Kit"}},
    {"slug": "cool-down-kit",          "name": "Cool Down Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Cool Down Kit"}},
    {"slug": "clicker-training-kit",   "name": "Clicker Training Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Clicker Training Kit"}},
    {"slug": "travel-comfort-kit",     "name": "Travel Comfort Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Travel Comfort Kit"}},
    {"slug": "foster-preparation-kit", "name": "Foster Preparation Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Foster Preparation Kit"}},

    # ----- ADOPT (individual) -----
    {"slug": "shelter-donation-gift-card",  "name": "Shelter Donation Gift Card",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Shelter Donation Gift Card"}},
    {"slug": "comfort-crate-new-pets",      "name": "Comfort Crate for New Pets",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Comfort Crate for New Pets"}},
    {"slug": "new-pet-welcome-kit",         "name": "New Pet Welcome Kit",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "New Pet Welcome Kit"}},
    {"slug": "rescue-calming-supplement",   "name": "Rescue Calming Supplement",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Rescue Calming Supplement"}},
    {"slug": "orthopedic-comfort-bed",      "name": "Orthopedic Comfort Bed",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Orthopedic Comfort Bed"}},
    {"slug": "adoption-success-guide-book", "name": "Adoption Success Guide Book",
     "match": {"cloudinary_url": "https://res.cloudinary.com/duoapcx1p/image/upload/v1775235438/tdc/products/shared/adoption.webp", "name": "Adoption Success Guide Book"}},
]


async def generate_image_openai(name: str) -> bytes | None:
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        gen = OpenAIImageGeneration(api_key=LLM_KEY)
        prompt = PROMPT.format(name=name)
        images = await gen.generate_images(prompt=prompt, number_of_images=1, model="gpt-image-1")
        return images[0] if images else None
    except Exception as e:
        log.error(f"OpenAI gen failed for {name}: {e}")
        return None


def upload_to_cloudinary(image_bytes: bytes, slug: str) -> str | None:
    try:
        b64 = base64.b64encode(image_bytes).decode()
        data_url = f"data:image/png;base64,{b64}"
        result = cloudinary.uploader.upload(
            data_url,
            public_id=f"tdc/products/shared/{slug}",
            overwrite=True,
            resource_type="image",
            format="webp",
            quality="auto:good"
        )
        return result.get("secure_url")
    except Exception as e:
        log.error(f"Cloudinary upload failed for {slug}: {e}")
        return None


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    log.info(f"=== ADOPT PILLAR IMAGE GENERATOR — {len(PRODUCTS)} items ===")

    generated = 0
    failed = 0

    for i, item in enumerate(PRODUCTS):
        slug = item["slug"]
        name = item["name"]
        is_shared = item.get("shared", False)
        match_filter = item["match"]

        log.info(f"[{i+1}/{len(PRODUCTS)}] Generating: {name}")

        # Generate image
        image_bytes = await generate_image_openai(name)
        if not image_bytes:
            log.warning(f"  SKIPPED (no image) — {name}")
            failed += 1
            await asyncio.sleep(3)
            continue

        # Upload to Cloudinary (sync in thread)
        loop = asyncio.get_running_loop()
        url = await loop.run_in_executor(None, upload_to_cloudinary, image_bytes, slug)

        if not url:
            log.warning(f"  SKIPPED (upload failed) — {name}")
            failed += 1
            await asyncio.sleep(3)
            continue

        log.info(f"  Uploaded → {url}")

        # Update MongoDB — all products matching the filter
        result = await db.products_master.update_many(
            match_filter,
            {"$set": {
                "cloudinary_url": url,
                "image_url": url,
                "image": url,
                "images": [url],
                "image_updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  DB updated: {result.modified_count} products → {slug}")
        generated += 1

        # Rate limit pause
        await asyncio.sleep(4)

    log.info(f"=== DONE === Generated: {generated} | Failed: {failed}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())

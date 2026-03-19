"""
cloudinary_migration.py — TDC Full Cloudinary Image Pipeline
Runs as background job. Handles:
  1. Migration: Emergent CDN → Cloudinary for all existing product/service/bundle images
  2. Service watercolour generation (services_master — all 981)
  3. Bundle watercolour generation (care_bundles)
  4. Mira Imagines watercolour generation (per pillar × breed × stage)
  5. Product realistic image generation (products_master without images)

Run: python3 cloudinary_migration.py [--task migrate|services|bundles|imagines|products|all]
"""

import asyncio
import argparse
import os
import sys
import logging
from datetime import datetime, timezone
from typing import Optional

import cloudinary
import cloudinary.uploader
from motor.motor_asyncio import AsyncIOMotorClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("tdc_cloudinary")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME   = os.environ.get("DB_NAME", "pet-os-live-test_database")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", ""),
    api_key=os.environ.get("CLOUDINARY_API_KEY", ""),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET", "")
)

# ── Helpers ──────────────────────────────────────────────────────────────────
def is_cloudinary_url(url: str) -> bool:
    return bool(url and "cloudinary.com" in url)

async def upload_url_to_cloudinary(url: str, public_id: str) -> Optional[str]:
    """Upload an existing image URL to Cloudinary."""
    try:
        result = cloudinary.uploader.upload(
            url, public_id=public_id, overwrite=True,
            resource_type="image", format="webp",
            transformation=[{"width": 800, "height": 800, "crop": "limit"}, {"quality": "auto:good"}]
        )
        return result.get("secure_url")
    except Exception as e:
        log.warning(f"Cloudinary upload failed for {public_id}: {e}")
        return None

async def generate_and_upload(prompt: str, public_id: str) -> Optional[str]:
    """Generate image with AI and upload to Cloudinary."""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        import base64
        gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await gen.generate_images(prompt=prompt, number_of_images=1, model="gpt-image-1")
        if not images: return None
        img_data = f"data:image/png;base64,{base64.b64encode(images[0]).decode()}"
        result = cloudinary.uploader.upload(
            img_data, public_id=public_id, overwrite=True,
            resource_type="image", format="webp", quality="auto:good"
        )
        return result.get("secure_url")
    except Exception as e:
        log.error(f"Image generation failed for {public_id}: {e}")
        return None

# ── TASK 1: Migrate existing images ──────────────────────────────────────────
async def migrate_existing_images(db):
    """Move all non-Cloudinary image_url values to Cloudinary."""
    log.info("=== TASK 1: Migration of existing images to Cloudinary ===")
    total_migrated = 0

    for collection, id_field, img_field in [
        ("products_master", "id", "image_url"),
        ("services_master",  "id", "image_url"),
        ("care_bundles",     "id", "image_url"),
    ]:
        col = db[collection]
        # Find non-Cloudinary, non-empty image URLs
        cursor = col.find(
            {img_field: {"$exists": True, "$ne": "", "$nin": [None, ""]}},
            {"_id": 0, id_field: 1, img_field: 1, "pillar": 1}
        )
        items = await cursor.to_list(length=5000)
        to_migrate = [i for i in items if not is_cloudinary_url(i.get(img_field, ""))]
        log.info(f"{collection}: {len(items)} with images, {len(to_migrate)} need migration")

        for item in to_migrate:
            item_id = item.get(id_field, "unknown")
            url = item.get(img_field, "")
            pillar = item.get("pillar", "general")
            if not url or not url.startswith("http"):
                continue
            pub_id = f"tdc/{collection}/{pillar}/{item_id}"
            new_url = await upload_url_to_cloudinary(url, pub_id)
            if new_url:
                await col.update_one({id_field: item_id}, {"$set": {img_field: new_url}})
                total_migrated += 1
                log.info(f"  ✓ Migrated {item_id[:30]}")
            await asyncio.sleep(0.3)

    log.info(f"=== Migration complete: {total_migrated} images moved to Cloudinary ===")
    return total_migrated

# ── TASK 2: Generate service watercolours (services_master) ──────────────────
WATERCOLOUR_STYLE = "soft watercolour illustration, warm pastel tones, gentle brushstrokes, artistic pet illustration, minimal clean background, professional and warm"

def service_watercolour_prompt(svc: dict) -> str:
    name = (svc.get("name") or "Pet Service").lower()
    pillar = (svc.get("pillar") or "").lower()
    if pillar in ("learn", "training") or any(w in name for w in ["train","class","obedience","behaviour","trick","puppy foundations","recall"]):
        return f"Watercolour illustration of a happy dog learning to sit with a trainer, treats and reward, warm and encouraging scene. {WATERCOLOUR_STYLE}"
    if pillar == "care" or any(w in name for w in ["groom","vet","health","dental","wellness","bath"]):
        return f"Watercolour illustration of a happy dog being gently groomed or at vet, caring and reassuring. {WATERCOLOUR_STYLE}"
    if pillar == "dine" or any(w in name for w in ["food","meal","diet","nutrition"]):
        return f"Watercolour illustration of a happy dog with a beautiful food bowl, healthy and joyful. {WATERCOLOUR_STYLE}"
    if pillar in ("go","travel") or any(w in name for w in ["travel","trip","transport","hotel","boarding"]):
        return f"Watercolour illustration of a dog going on an adventure, carrier bag and travel accessories. {WATERCOLOUR_STYLE}"
    if pillar == "celebrate" or any(w in name for w in ["party","birthday","celebration","event"]):
        return f"Watercolour illustration of a dog at a birthday party, balloons and cake, festive joy. {WATERCOLOUR_STYLE}"
    if pillar == "farewell" or any(w in name for w in ["memorial","farewell","rainbow"]):
        return f"Watercolour illustration of a peaceful rainbow bridge scene, gentle and serene. {WATERCOLOUR_STYLE}"
    if pillar == "adopt" or any(w in name for w in ["adopt","rescue","rehome"]):
        return f"Watercolour illustration of a hopeful dog finding a loving home, heartwarming. {WATERCOLOUR_STYLE}"
    return f"Watercolour illustration of a happy dog receiving professional pet care service. {WATERCOLOUR_STYLE}"

async def generate_service_watercolours(db, pillar: Optional[str] = None, limit: int = 50):
    log.info(f"=== TASK 2: Service watercolours (pillar={pillar or 'all'}, limit={limit}) ===")
    query = {"$or": [{"watercolor_image": {"$exists": False}}, {"watercolor_image": None}, {"watercolor_image": ""}]}
    if pillar: query["pillar"] = pillar
    services = await db.services_master.find(query, {"_id": 0}).to_list(length=limit)
    log.info(f"Found {len(services)} services needing watercolours")
    done = 0
    for svc in services:
        svc_id = svc.get("id", "unknown")
        svc_pillar = svc.get("pillar", "general")
        pub_id = f"tdc/services/{svc_pillar}/{svc_id}"
        prompt = service_watercolour_prompt(svc)
        url = await generate_and_upload(prompt, pub_id)
        if url:
            await db.services_master.update_one(
                {"id": svc_id},
                {"$set": {"watercolor_image": url, "image_url": url, "ai_generated_image": True}}
            )
            done += 1
            log.info(f"  ✓ {svc.get('name','?')[:40]}")
        else:
            log.warning(f"  ✗ {svc.get('name','?')[:40]}")
        await asyncio.sleep(4)
    log.info(f"=== Services done: {done}/{len(services)} ===")
    return done

# ── TASK 3: Generate bundle watercolours ─────────────────────────────────────
def bundle_watercolour_prompt(bundle: dict) -> str:
    pillar = (bundle.get("pillar") or "learn").lower()
    name = bundle.get("name", "Pet Bundle")
    items = bundle.get("items", [])
    items_str = ", ".join(i if isinstance(i, str) else i.get("name", "") for i in items[:3])
    return f"Watercolour illustration of a beautiful curated pet gift box with {items_str or 'pet essentials'} for {pillar}, soft pastel tones, artistic and inviting, warm and premium feel. {WATERCOLOUR_STYLE}"

async def generate_bundle_watercolours(db, pillar: Optional[str] = None):
    log.info(f"=== TASK 3: Bundle watercolours (pillar={pillar or 'all'}) ===")
    query = {"$or": [{"image_url": {"$exists": False}}, {"image_url": None}, {"image_url": ""}]}
    if pillar: query["pillar"] = pillar
    bundles = await db.care_bundles.find(query, {"_id": 0}).to_list(length=100)
    log.info(f"Found {len(bundles)} bundles needing images")
    done = 0
    for b in bundles:
        b_id = b.get("id", "unknown")
        b_pillar = b.get("pillar", "learn")
        pub_id = f"tdc/bundles/{b_pillar}/{b_id}"
        prompt = bundle_watercolour_prompt(b)
        url = await generate_and_upload(prompt, pub_id)
        if url:
            await db.care_bundles.update_one(
                {"id": b_id},
                {"$set": {"image_url": url, "watercolor_image": url, "ai_generated_image": True}}
            )
            done += 1
            log.info(f"  ✓ {b.get('name','?')[:40]}")
        await asyncio.sleep(4)
    log.info(f"=== Bundles done: {done}/{len(bundles)} ===")
    return done

# ── TASK 4: Mira Imagines watercolours (pillar × breed × stage) ──────────────
MIRA_IMAGINES_BREEDS = [
    "labrador", "golden_retriever", "german_shepherd", "indie", "french_bulldog",
    "beagle", "shih_tzu", "poodle", "rottweiler", "husky", "cocker_spaniel",
    "boxer", "doberman", "chihuahua", "pug", "maltese", "yorkshire_terrier",
    "dachshund", "border_collie", "lhasa_apso", "great_dane", "dalmatian",
    "jack_russell", "cavalier", "american_bully", "chow_chow", "samoyed",
    "akita", "corgi", "shiba_inu", "australian_shepherd", "pomeranian", "schnauzer"
]

MIRA_IMAGINES_PILLARS = {
    "learn":     ("dog learning to sit with trainer, training journal and treat pouch nearby", "#1A1363"),
    "care":      ("dog being lovingly groomed, caring hands, wellness scene",                "#1B4332"),
    "dine":      ("dog with a beautiful healthy meal in a ceramic bowl, nutritious food",   "#92400E"),
    "go":        ("dog in a travel carrier, adventure accessories, excited to explore",     "#1E3A5F"),
    "celebrate": ("dog at birthday celebration, balloons and cake, festive joy",            "#5B21B6"),
    "play":      ("dog playing joyfully in a park, ball and frisbee, pure happiness",      "#7C2D12"),
}

BREED_FULL_NAMES = {
    "labrador": "Labrador Retriever", "golden_retriever": "Golden Retriever",
    "german_shepherd": "German Shepherd", "indie": "Indian Street Dog (Indie)",
    "french_bulldog": "French Bulldog", "beagle": "Beagle",
    "shih_tzu": "Shih Tzu", "poodle": "Poodle", "rottweiler": "Rottweiler",
    "husky": "Siberian Husky", "cocker_spaniel": "Cocker Spaniel",
    "boxer": "Boxer", "doberman": "Doberman Pinscher", "chihuahua": "Chihuahua",
    "pug": "Pug", "maltese": "Maltese", "yorkshire_terrier": "Yorkshire Terrier",
    "dachshund": "Dachshund", "border_collie": "Border Collie",
    "lhasa_apso": "Lhasa Apso", "great_dane": "Great Dane",
    "dalmatian": "Dalmatian", "jack_russell": "Jack Russell Terrier",
    "cavalier": "Cavalier King Charles Spaniel", "american_bully": "American Bully",
    "chow_chow": "Chow Chow", "samoyed": "Samoyed", "akita": "Akita",
    "corgi": "Pembroke Welsh Corgi", "shiba_inu": "Shiba Inu",
    "australian_shepherd": "Australian Shepherd", "pomeranian": "Pomeranian",
    "schnauzer": "Schnauzer",
}

async def generate_mira_imagines(db, pillar: Optional[str] = None, breed: Optional[str] = None):
    log.info(f"=== TASK 4: Mira Imagines (pillar={pillar or 'all'}, breed={breed or 'all'}) ===")
    pillars_to_run = {pillar: MIRA_IMAGINES_PILLARS[pillar]} if pillar and pillar in MIRA_IMAGINES_PILLARS else MIRA_IMAGINES_PILLARS
    breeds_to_run  = [breed] if breed else MIRA_IMAGINES_BREEDS
    done = 0
    for p_id, (scene, _) in pillars_to_run.items():
        for breed_key in breeds_to_run:
            breed_full = BREED_FULL_NAMES.get(breed_key, breed_key.replace("_"," ").title())
            pub_id = f"tdc/mira-imagines/{p_id}/{breed_key}"
            # Check if already exists in DB
            existing = await db.mira_imagines_cache.find_one({"pillar": p_id, "breed": breed_key}, {"_id": 0})
            if existing and existing.get("url"): 
                log.info(f"  → Already exists: {p_id}/{breed_key}")
                continue
            prompt = (
                f"Watercolour illustration of a beautiful {breed_full} dog {scene}. "
                f"The dog looks healthy, happy and soulful. Warm pastel tones, gentle artistic brushstrokes, "
                f"soft background, premium pet lifestyle illustration. No text in image."
            )
            url = await generate_and_upload(prompt, pub_id)
            if url:
                await db.mira_imagines_cache.update_one(
                    {"pillar": p_id, "breed": breed_key},
                    {"$set": {"pillar": p_id, "breed": breed_key, "url": url, "updated_at": datetime.now(timezone.utc).isoformat()}},
                    upsert=True
                )
                done += 1
                log.info(f"  ✓ {p_id}/{breed_key}")
            else:
                log.warning(f"  ✗ {p_id}/{breed_key}")
            await asyncio.sleep(5)
    log.info(f"=== Mira Imagines done: {done} generated ===")
    return done

# ── TASK 5: Product realistic images ─────────────────────────────────────────
async def generate_product_images(db, pillar: Optional[str] = None, limit: int = 50):
    """Generate realistic product images for products_master without images."""
    log.info(f"=== TASK 5: Product images (pillar={pillar or 'all'}, limit={limit}) ===")
    try:
        from ai_image_service import get_product_image_prompt
    except ImportError:
        log.error("Cannot import get_product_image_prompt")
        return 0
    query = {"$or": [{"image_url": {"$exists": False}}, {"image_url": None}, {"image_url": ""}]}
    if pillar: query["pillar"] = pillar
    products = await db.products_master.find(query, {"_id": 0}).to_list(length=limit)
    log.info(f"Found {len(products)} products needing images")
    done = 0
    for prod in products:
        prod_id = prod.get("id", "unknown")
        prod_pillar = prod.get("pillar", "general")
        pub_id = f"tdc/products/{prod_pillar}/{prod_id}"
        prompt = get_product_image_prompt(prod)
        url = await generate_and_upload(prompt, pub_id)
        if url:
            await db.products_master.update_one(
                {"id": prod_id},
                {"$set": {"image_url": url, "ai_generated_image": True}}
            )
            done += 1
            log.info(f"  ✓ {prod.get('name','?')[:40]}")
        await asyncio.sleep(4)
    log.info(f"=== Products done: {done}/{len(products)} ===")
    return done

# ── Main runner ───────────────────────────────────────────────────────────────
async def main(task: str = "all", pillar: Optional[str] = None, breed: Optional[str] = None, limit: int = 50):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    log.info(f"Connected to DB: {DB_NAME}")
    log.info(f"Task: {task} | Pillar: {pillar or 'all'} | Breed: {breed or 'all'} | Limit: {limit}")

    results = {}
    if task in ("migrate", "all"):
        results["migrate"] = await migrate_existing_images(db)
    if task in ("services", "all"):
        results["services"] = await generate_service_watercolours(db, pillar, limit)
    if task in ("bundles", "all"):
        results["bundles"] = await generate_bundle_watercolours(db, pillar)
    if task in ("imagines", "all"):
        results["imagines"] = await generate_mira_imagines(db, pillar, breed)
    if task in ("products",):  # Products separate — very slow, don't auto-run in 'all'
        results["products"] = await generate_product_images(db, pillar, limit)

    log.info(f"=== ALL DONE: {results} ===")
    client.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--task",   default="all",  choices=["migrate","services","bundles","imagines","products","all"])
    parser.add_argument("--pillar", default=None)
    parser.add_argument("--breed",  default=None)
    parser.add_argument("--limit",  type=int, default=50)
    args = parser.parse_args()
    asyncio.run(main(args.task, args.pillar, args.breed, args.limit))

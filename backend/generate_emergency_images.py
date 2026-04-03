"""
Generate images for the emergency pillar.

Products to fix:
1. SAFETY category (99 products = 33 breeds × 3 types):
   - [Breed] First Aid Kit          → shared: emergency-first-aid-kit
   - [Breed] Pet Inside Car Sticker → shared: emergency-car-sticker
   - [Breed] Emergency Grab Pouch   → shared: emergency-grab-pouch

2. EMERGENCY category physical products (15 items, some are services - skip those)
3. FIRST-AID categories (7 products across 3 category spellings)

Run: python3 generate_emergency_images.py
"""
import asyncio, os, sys, base64, logging, re
sys.path.insert(0, '/app/backend')
os.chdir('/app/backend')
from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
import cloudinary, cloudinary.uploader
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.FileHandler('/tmp/emergency_gen.log'), logging.StreamHandler()]
)
log = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']
LLM_KEY   = os.environ['EMERGENT_LLM_KEY']

# ── Image generation ──────────────────────────────────────────────────────────
async def generate_image(prompt: str) -> bytes | None:
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        gen = OpenAIImageGeneration(api_key=LLM_KEY)
        images = await gen.generate_images(
            prompt=prompt, number_of_images=1, model="gpt-image-1"
        )
        return images[0] if images else None
    except Exception as e:
        log.error(f"  Generation error: {e}")
        return None

def upload_to_cloudinary(image_bytes: bytes, slug: str) -> str | None:
    try:
        data_url = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"
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
        log.error(f"  Cloudinary upload error: {e}")
        return None

# ── PHASE 1: Safety category shared images ───────────────────────────────────
SAFETY_IMAGES = [
    {
        "slug": "emergency-first-aid-kit",
        "prompt": "Professional product photo of a complete dog pet first aid kit in a bright red zippered case, containing bandages, gauze, antiseptic wipes, scissors, and tweezers, clean white background, studio lighting, no text",
        "name_pattern": "First Aid Kit",
        "description": "First Aid Kit"
    },
    {
        "slug": "emergency-car-sticker",
        "prompt": "Product photo of a square 'Dog Inside' pet emergency car window sticker with a paw print icon and emergency contact info template, bright yellow and red colors, clean white background, studio lighting, no text beyond the sticker design",
        "name_pattern": "Pet Inside Car Sticker",
        "description": "Car Sticker"
    },
    {
        "slug": "emergency-grab-pouch",
        "prompt": "Product photo of an orange emergency dog grab bag pouch with reflective strips, carabiner clip, compact and durable, laid flat showing its contents silhouette, clean white background, studio lighting, no text",
        "name_pattern": "Emergency Grab Pouch",
        "description": "Emergency Grab Pouch"
    },
]

# ── PHASE 2: Individual emergency-category products ──────────────────────────
EMERGENCY_PRODUCTS = [
    {
        "slug": "emergency-gps-tracker",
        "prompt": "Product photo of a compact mini GPS pet tracker tag in red and black, with a silver clip, LED indicator, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "GPS Pet Tracker", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-airtag-holder",
        "prompt": "Product photo of a silicone apple airtag collar holder for dogs in red color, round disc shape with a snap-on lid, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "AirTag Collar Holder", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-qr-id-tag",
        "prompt": "Product photo of a stainless steel QR code pet ID tag with a QR pattern engraved on a round metal disc, polished finish, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "QR.*ID Tag|Smart QR", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-reflective-vest",
        "prompt": "Product photo of a bright orange high-visibility reflective dog safety vest with bright yellow reflective strips, adjustable straps, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Reflective Vest|High-Visibility", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-thermal-blanket",
        "prompt": "Product photo of a silver mylar thermal emergency blanket for pets, folded neatly showing its metallic sheen, with a small paw print label, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Thermal Blanket", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-muzzle-set",
        "prompt": "Product photo of a set of three soft nylon emergency dog muzzles in small, medium and large sizes, arranged side by side in red and black colors, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Muzzle", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-calming-spray",
        "prompt": "Product photo of a small red spray bottle of pet emergency calming spray with a minimal design, 50ml travel size, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Calming Spray", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-wound-care-kit",
        "prompt": "Product photo of a compact pet wound care kit containing antiseptic spray, gauze pads, medical tape and nitrile gloves in a small red pouch, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Wound Care Kit", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-car-kit",
        "prompt": "Product photo of a dog emergency car kit in a red zipper bag containing a collapsible bowl, leash, paw wipes, and emergency card, arranged neatly, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Car Emergency Kit", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-lost-pet-kit",
        "prompt": "Product photo of a lost pet recovery kit laid flat with flyers, QR stickers, a reflective collar tag and a waterproof info card, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Lost Pet Recovery Kit", "$options": "i"}, "pillar": "emergency"}
    },
]

# ── PHASE 3: First-aid individual products ───────────────────────────────────
FIRST_AID_PRODUCTS = [
    {
        "slug": "emergency-thermometer",
        "prompt": "Product photo of a digital pet thermometer, slim white and silver design, LCD display, with a protective case, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Thermometer", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-gauze-bandage",
        "prompt": "Product photo of a pet first aid gauze and bandage wrap set, two rolls of white gauze bandage and a cohesive bandage in blue, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Gauze|Bandage Wrap", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-tick-remover",
        "prompt": "Product photo of a pet tick remover tool set with two plastic hook-shaped removers in different sizes in a small red case, clean white background, studio lighting, no text",
        "update_filter": {"name": {"$regex": "Tick Remover", "$options": "i"}, "pillar": "emergency"}
    },
    {
        "slug": "emergency-contact-card",
        "prompt": "Product photo of a laminated pet emergency contact card in bright red, showing sections for vet name, allergies and emergency numbers, clean white background, studio lighting, no text on the actual card",
        "update_filter": {"name": {"$regex": "Contact Card|Emergency Contact", "$options": "i"}, "pillar": "emergency"}
    },
]

# ── Shared first-aid-kit image for all 'First Aid Kit' variants ──────────────
# (will reuse the safety-category slug after Phase 1)

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    loop = asyncio.get_running_loop()
    results = {}

    # ── PHASE 1: Safety category shared images ──────────────────────────────
    log.info("=== PHASE 1: Safety category shared images (3 images → 99 products) ===")
    for i, item in enumerate(SAFETY_IMAGES):
        log.info(f"[{i+1}/{len(SAFETY_IMAGES)}] Generating: {item['description']}")
        img_bytes = await generate_image(item['prompt'])
        if not img_bytes:
            log.warning(f"  SKIPPED — generation failed"); await asyncio.sleep(3); continue

        url = await loop.run_in_executor(None, upload_to_cloudinary, img_bytes, item['slug'])
        if not url:
            log.warning(f"  SKIPPED — upload failed"); await asyncio.sleep(3); continue

        log.info(f"  Uploaded → {url}")
        results[item['slug']] = url

        # Update all matching safety products
        res = await db.products_master.update_many(
            {
                'pillar': 'emergency',
                'category': 'safety',
                'name': {'$regex': re.escape(item['name_pattern']), '$options': 'i'}
            },
            {'$set': {
                'cloudinary_url': url, 'image_url': url, 'image': url, 'images': [url],
                'image_updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  DB: {res.modified_count} safety products updated")
        await asyncio.sleep(5)

    # ── Also update first-aid-kit variants in first-aid category (reuse slug if generated) ──
    first_aid_kit_url = results.get("emergency-first-aid-kit")
    if first_aid_kit_url:
        res = await db.products_master.update_many(
            {'pillar': 'emergency', 'name': {'$regex': 'First Aid Kit', '$options': 'i'}},
            {'$set': {
                'cloudinary_url': first_aid_kit_url,
                'image_url': first_aid_kit_url,
                'image': first_aid_kit_url,
                'images': [first_aid_kit_url],
                'image_updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  Reused first-aid-kit image for {res.modified_count} additional products")

    # ── PHASE 2: Emergency category individual products ─────────────────────
    log.info(f"\n=== PHASE 2: Emergency category products ({len(EMERGENCY_PRODUCTS)} images) ===")
    for i, item in enumerate(EMERGENCY_PRODUCTS):
        log.info(f"[{i+1}/{len(EMERGENCY_PRODUCTS)}] Generating: {item['slug']}")
        img_bytes = await generate_image(item['prompt'])
        if not img_bytes:
            log.warning(f"  SKIPPED — generation failed"); await asyncio.sleep(3); continue

        url = await loop.run_in_executor(None, upload_to_cloudinary, img_bytes, item['slug'])
        if not url:
            log.warning(f"  SKIPPED — upload failed"); await asyncio.sleep(3); continue

        log.info(f"  Uploaded → {url}")
        res = await db.products_master.update_many(
            item['update_filter'],
            {'$set': {
                'cloudinary_url': url, 'image_url': url, 'image': url, 'images': [url],
                'image_updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  DB: {res.modified_count} products updated")
        await asyncio.sleep(5)

    # ── PHASE 3: First-aid individual products ──────────────────────────────
    log.info(f"\n=== PHASE 3: First-aid individual products ({len(FIRST_AID_PRODUCTS)} images) ===")
    for i, item in enumerate(FIRST_AID_PRODUCTS):
        log.info(f"[{i+1}/{len(FIRST_AID_PRODUCTS)}] Generating: {item['slug']}")
        img_bytes = await generate_image(item['prompt'])
        if not img_bytes:
            log.warning(f"  SKIPPED — generation failed"); await asyncio.sleep(3); continue

        url = await loop.run_in_executor(None, upload_to_cloudinary, img_bytes, item['slug'])
        if not url:
            log.warning(f"  SKIPPED — upload failed"); await asyncio.sleep(3); continue

        log.info(f"  Uploaded → {url}")
        res = await db.products_master.update_many(
            item['update_filter'],
            {'$set': {
                'cloudinary_url': url, 'image_url': url, 'image': url, 'images': [url],
                'image_updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  DB: {res.modified_count} products updated")
        await asyncio.sleep(5)

    # ── Summary ──────────────────────────────────────────────────────────────
    log.info("\n=== COMPLETE ===")
    log.info("Generated URLs:")
    for slug, url in results.items():
        log.info(f"  {slug}: {url}")

    # Final verification
    remaining = await db.products_master.count_documents({
        'pillar': 'emergency',
        'cloudinary_url': {'$exists': False},
        'visibility.status': {'$ne': 'archived'},
        'category': {'$not': {'$regex': 'service', '$options': 'i'}}
    })
    log.info(f"\nProducts still without cloudinary_url (excluding services): {remaining}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())

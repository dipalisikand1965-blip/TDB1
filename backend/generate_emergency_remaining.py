"""
Generate images for the 12 remaining emergency pillar physical products.
Skips service-type entries — those are handled from Admin Service Box.
Run: python3 generate_emergency_remaining.py
"""
import asyncio, os, sys, base64, logging
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
    handlers=[logging.FileHandler('/tmp/emergency_remaining.log'), logging.StreamHandler()]
)
log = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']
LLM_KEY   = os.environ['EMERGENT_LLM_KEY']

PRODUCTS = [
    {
        "slug": "emergency-ecollar-cone",
        "prompt": "Professional product photo of a clear plastic elizabethan e-collar cone for dogs, transparent with soft padded edge, clean white background, studio lighting, no text",
        "name_regex": "E-Collar|Cone"
    },
    {
        "slug": "emergency-recovery-suit",
        "prompt": "Professional product photo of a light blue post-surgery recovery suit for dogs, full body soft cotton onesie with snap buttons, clean white background, studio lighting, no text",
        "name_regex": "Recovery Suit"
    },
    {
        "slug": "emergency-fund-tracker",
        "prompt": "Professional product photo of a pet emergency fund tracker notebook in red with a paw print on the cover, spiral bound, clean white background, studio lighting, no text",
        "name_regex": "Fund Tracker"
    },
    {
        "slug": "emergency-vet-summary-pad",
        "prompt": "Professional product photo of a veterinary visit summary notepad in white and red, with ruled lines and a paw print header, clean white background, studio lighting, no text",
        "name_regex": "Summary Pad"
    },
    {
        "slug": "emergency-peace-of-mind-package",
        "prompt": "Professional product photo of a pet emergency peace of mind package box set in red and white, containing a booklet, ID card, and emergency card neatly arranged, clean white background, studio lighting, no text",
        "name_regex": "Peace of Mind"
    },
    {
        "slug": "emergency-slip-leash",
        "prompt": "Professional product photo of a bright red emergency slip leash for dogs, nylon rope style with an adjustable loop, clean white background, studio lighting, no text",
        "name_regex": "Slip Leash"
    },
    {
        "slug": "emergency-transport-carrier",
        "prompt": "Professional product photo of a sturdy pet transport carrier bag in red and black with mesh ventilation panels and a top handle, clean white background, studio lighting, no text",
        "name_regex": "Transport Carrier"
    },
    {
        "slug": "emergency-pee-pads",
        "prompt": "Professional product photo of a pack of 20 absorbent dog pee pads in blue and white packaging, shown fanned out to show the pad texture, clean white background, studio lighting, no text",
        "name_regex": "Pee Pads"
    },
    {
        "slug": "emergency-cooling-mat",
        "prompt": "Professional product photo of a blue gel cooling mat for dogs, flat rectangular shape with a non-slip texture, clean white background, studio lighting, no text",
        "name_regex": "Cooling Mat"
    },
    {
        "slug": "emergency-motion-sickness-tablets",
        "prompt": "Professional product photo of a small blister pack of pet motion sickness relief tablets, white and red packaging with a dog icon, clean white background, studio lighting, no text",
        "name_regex": "Motion Sickness"
    },
    {
        "slug": "emergency-toxic-plant-guide",
        "prompt": "Professional product photo of a laminated toxic plant guide card for pet owners, bright yellow border with botanical illustrations of common toxic plants, clean white background, studio lighting, no text on the card face",
        "name_regex": "Toxic Plant Guide"
    },
    {
        "slug": "emergency-go-bag",
        "prompt": "Professional product photo of a bright red pet emergency go-bag backpack with reflective strips and multiple compartments, laid flat showing full design, clean white background, studio lighting, no text",
        "name_regex": "Go-Bag"
    },
]

async def generate_image(prompt: str) -> bytes | None:
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        gen = OpenAIImageGeneration(api_key=LLM_KEY)
        images = await gen.generate_images(prompt=prompt, number_of_images=1, model="gpt-image-1")
        return images[0] if images else None
    except Exception as e:
        log.error(f"  Gen error: {e}")
        return None

def upload(image_bytes: bytes, slug: str) -> str | None:
    try:
        data_url = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"
        result = cloudinary.uploader.upload(
            data_url, public_id=f"tdc/products/shared/{slug}",
            overwrite=True, resource_type="image", format="webp", quality="auto:good"
        )
        return result.get("secure_url")
    except Exception as e:
        log.error(f"  Upload error: {e}")
        return None

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    loop = asyncio.get_running_loop()
    log.info(f"=== Generating {len(PRODUCTS)} remaining emergency product images ===")

    for i, item in enumerate(PRODUCTS):
        log.info(f"[{i+1}/{len(PRODUCTS)}] {item['slug']}")
        img_bytes = await generate_image(item['prompt'])
        if not img_bytes:
            log.warning("  SKIPPED — generation failed"); await asyncio.sleep(3); continue

        url = await loop.run_in_executor(None, upload, img_bytes, item['slug'])
        if not url:
            log.warning("  SKIPPED — upload failed"); await asyncio.sleep(3); continue

        log.info(f"  Uploaded → {url}")
        res = await db.products_master.update_many(
            {'pillar': 'emergency', 'name': {'$regex': item['name_regex'], '$options': 'i'}},
            {'$set': {
                'cloudinary_url': url, 'image_url': url, 'image': url, 'images': [url],
                'image_updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  DB: {res.modified_count} products updated")
        await asyncio.sleep(5)

    # Final count
    remaining = await db.products_master.count_documents({
        'pillar': 'emergency',
        'cloudinary_url': {'$exists': False},
        'category': {'$nin': ['service']}
    })
    log.info(f"\n=== DONE — Products still without image (excl. services): {remaining} ===")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())

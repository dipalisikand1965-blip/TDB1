"""
Generate 4 shared images for farewell pillar memorial products.
Run: python3 generate_farewell_images.py
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
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s',
    handlers=[logging.FileHandler('/tmp/farewell_gen.log'), logging.StreamHandler()])
log = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']
LLM_KEY   = os.environ['EMERGENT_LLM_KEY']
PROMPT    = "Premium product photo of {name} pet item, clean white background, professional studio photography, high detail, no words"

PRODUCTS = [
    {
        "slug": "memorial-keepsake-box",
        "name": "Memorial Keepsake Box",
        "match_name_regex": "Memorial Keepsake Box"
    },
    {
        "slug": "memorial-candle",
        "name": "Memorial Candle",
        "match_name_regex": "Memorial Candle"
    },
    {
        "slug": "remembrance-card-set",
        "name": "Remembrance Card Set",
        "match_name_regex": "Remembrance Card Set"
    },
    {
        "slug": "paw-print-keepsake-kit",
        "name": "Paw Print Keepsake Kit",
        "match_name_regex": "Paw Print Keepsake Kit"
    },
]

async def generate_image(name: str) -> bytes | None:
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        gen = OpenAIImageGeneration(api_key=LLM_KEY)
        images = await gen.generate_images(prompt=PROMPT.format(name=name), number_of_images=1, model="gpt-image-1")
        return images[0] if images else None
    except Exception as e:
        log.error(f"Gen failed for {name}: {e}")
        return None

def upload(image_bytes: bytes, slug: str) -> str | None:
    try:
        data_url = f"data:image/png;base64,{base64.b64encode(image_bytes).decode()}"
        result = cloudinary.uploader.upload(data_url, public_id=f"tdc/products/shared/{slug}",
            overwrite=True, resource_type="image", format="webp", quality="auto:good")
        return result.get("secure_url")
    except Exception as e:
        log.error(f"Upload failed for {slug}: {e}")
        return None

async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    log.info("=== FAREWELL PILLAR — 4 images for 131 products ===")

    for i, item in enumerate(PRODUCTS):
        log.info(f"[{i+1}/4] Generating: {item['name']}")
        img_bytes = await generate_image(item['name'])
        if not img_bytes:
            log.warning(f"  FAILED — {item['name']}"); await asyncio.sleep(3); continue

        loop = asyncio.get_running_loop()
        url = await loop.run_in_executor(None, upload, img_bytes, item['slug'])
        if not url:
            log.warning(f"  UPLOAD FAILED — {item['slug']}"); await asyncio.sleep(3); continue

        log.info(f"  Uploaded → {url}")

        result = await db.products_master.update_many(
            {'pillar': 'farewell', 'category': 'memorial',
             'name': {'$regex': item['match_name_regex'], '$options': 'i'}},
            {'$set': {
                'cloudinary_url': url, 'image_url': url, 'image': url, 'images': [url],
                'image_updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  DB updated: {result.modified_count} products")
        await asyncio.sleep(5)

    log.info("=== DONE ===")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())

"""Generate images for 9 farewell products with no real image."""
import asyncio, os, sys, base64, logging
sys.path.insert(0, '/app/backend')
os.chdir('/app/backend')
from dotenv import load_dotenv; load_dotenv('/app/backend/.env')
import cloudinary, cloudinary.uploader
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone

cloudinary.config(cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"), api_secret=os.getenv("CLOUDINARY_API_SECRET"), secure=True)
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger(__name__)

LLM_KEY  = os.environ['EMERGENT_LLM_KEY']
PROMPT   = "Premium product photo of {name} pet item, clean white background, professional studio photography, high detail, no words"

PRODUCTS = [
    {"slug": "biodegradable-urn",        "name": "Biodegradable Urn",              "exact_name": "Biodegradable Urn"},
    {"slug": "paw-print-casting-kit",    "name": "Paw Print Casting Kit",          "exact_name": "Paw Print Casting Kit"},
    {"slug": "memory-box-keepsake-kit",  "name": "Memory Box Keepsake Kit",        "exact_name": "Memory Box — Keepsake Kit"},
    {"slug": "rainbow-bridge-journal",   "name": "Rainbow Bridge Journal",         "exact_name": "Rainbow Bridge Journal"},
    {"slug": "custom-memorial-candle",   "name": "Custom Memorial Candle",         "exact_name": "Custom Memorial Candle"},
    {"slug": "euthanasia-coordination",  "name": "Euthanasia Coordination Service","exact_name": "Euthanasia Coordination"},
    {"slug": "cremation-burial-service", "name": "Cremation and Burial Service",   "exact_name": "Cremation & Burial"},
    {"slug": "memorial-remembrance",     "name": "Pet Memorial and Remembrance",   "exact_name": "Memorial & Remembrance"},
    {"slug": "grief-support-resources",  "name": "Pet Grief Support Resources",    "exact_name": "Grief Support Resources"},
]

async def generate_image(name):
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        gen = OpenAIImageGeneration(api_key=LLM_KEY)
        imgs = await gen.generate_images(prompt=PROMPT.format(name=name), number_of_images=1, model="gpt-image-1")
        return imgs[0] if imgs else None
    except Exception as e:
        log.error(f"Gen failed {name}: {e}"); return None

def upload(img_bytes, slug):
    try:
        data_url = f"data:image/png;base64,{base64.b64encode(img_bytes).decode()}"
        r = cloudinary.uploader.upload(data_url, public_id=f"tdc/products/shared/{slug}",
            overwrite=True, resource_type="image", format="webp", quality="auto:good")
        return r.get("secure_url")
    except Exception as e:
        log.error(f"Upload failed {slug}: {e}"); return None

async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    log.info("=== FAREWELL missing 9 products ===")
    for i, item in enumerate(PRODUCTS):
        log.info(f"[{i+1}/9] {item['name']}")
        img = await generate_image(item['name'])
        if not img: await asyncio.sleep(3); continue
        loop = asyncio.get_running_loop()
        url = await loop.run_in_executor(None, upload, img, item['slug'])
        if not url: await asyncio.sleep(3); continue
        log.info(f"  → {url.split('/')[-1]}")
        r = await db.products_master.update_one(
            {'pillar': 'farewell', 'name': item['exact_name']},
            {'$set': {'cloudinary_url': url, 'image_url': url, 'image': url, 'images': [url],
                      'image_updated_at': datetime.now(timezone.utc).isoformat()}}
        )
        log.info(f"  DB: {r.modified_count} updated ({'✅' if r.modified_count else '⚠️ name mismatch'})")
        await asyncio.sleep(5)
    log.info("=== DONE ==="); client.close()

if __name__ == "__main__":
    asyncio.run(main())

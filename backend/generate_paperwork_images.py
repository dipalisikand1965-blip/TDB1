"""
Generate 6 images for the paperwork pillar.
- 4 shared product photos (vaccine folder, medical binder, profile book, document holder)
- 1 paw-print care checklist poster (breed-agnostic)
- 1 paw-print care guide book (breed-agnostic)
Run: python3 generate_paperwork_images.py
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
    handlers=[logging.FileHandler('/tmp/paperwork_gen.log'), logging.StreamHandler()]
)
log = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']
LLM_KEY   = os.environ['EMERGENT_LLM_KEY']

IMAGES = [
    # ── Problem 1: Replace documents.webp (130 products) ─────────────────────
    {
        "slug":   "paperwork-vaccine-folder",
        "prompt": "Professional product photo of a pet vaccine record document folder in blue and white, accordion-style with labeled index tabs, sits upright showing its full height, clean white background, studio lighting, no text",
        "filter": {"pillar": "paperwork", "name": {"$regex": "Vaccine Record Folder", "$options": "i"}},
        "label":  "Vaccine Record Folder (33 products)"
    },
    {
        "slug":   "paperwork-medical-binder",
        "prompt": "Professional product photo of a red pet medical record ring binder, A4 size, lying slightly open showing tabbed divider pages inside, a small paw print embossed on the cover, clean white background, studio lighting, no text",
        "filter": {"pillar": "paperwork", "name": {"$regex": "Medical Record Binder", "$options": "i"}},
        "label":  "Medical Record Binder (32 products)"
    },
    {
        "slug":   "paperwork-pet-profile-book",
        "prompt": "Professional product photo of a hardcover pet profile keepsake journal, teal and gold colour, with decorative paw prints on the front cover and ribbon bookmark, clean white background, studio lighting, no text",
        "filter": {"pillar": "paperwork", "name": {"$regex": "Pet Profile Book", "$options": "i"}},
        "label":  "Pet Profile Book (32 products)"
    },
    {
        "slug":   "paperwork-document-holder",
        "prompt": "Professional product photo of a navy blue zippered pet document wallet, multiple card-slot pockets visible when slightly open, small paw print embossed on the front flap, clean white background, studio lighting, no text",
        "filter": {"pillar": "paperwork", "name": {"$regex": "Document Holder", "$options": "i"}},
        "label":  "Document Holder (33 products)"
    },
    # ── Problem 2: Care Checklist Poster — paw print, breed-agnostic ─────────
    {
        "slug":   "paperwork-care-checklist-poster",
        "prompt": "Professional product photo of a minimalist dog care checklist poster print, landscape A4, clean white background with a single large bold paw print watermark centred at top, simple checkbox rows below in light grey, soft drop shadow, studio lighting, no text",
        "filter": {"pillar": "paperwork", "name": {"$regex": "Care Checklist Poster", "$options": "i"}},
        "label":  "Care Checklist Poster — paw print (33 products)"
    },
    # ── Problem 3: Care Guide Book — paw print, breed-agnostic ───────────────
    {
        "slug":   "paperwork-care-guide-book",
        "prompt": "Professional product photo of a spiral-bound dog breed care guide book, white cover, a prominent bold paw print at the top centre, a blank name plate rectangle below it, soft shadow, clean white background, studio lighting, no text inside the paw print or name plate",
        "filter": {"pillar": "paperwork", "name": {"$regex": "Care Guide Book", "$options": "i"}},
        "label":  "Care Guide Book — paw print (33 products)"
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
    log.info(f"=== PAPERWORK PILLAR — {len(IMAGES)} images ===")

    for i, item in enumerate(IMAGES):
        log.info(f"\n[{i+1}/{len(IMAGES)}] {item['label']}")
        img_bytes = await generate_image(item['prompt'])
        if not img_bytes:
            log.warning("  SKIPPED — generation failed"); await asyncio.sleep(3); continue

        url = await loop.run_in_executor(None, upload, img_bytes, item['slug'])
        if not url:
            log.warning("  SKIPPED — upload failed"); await asyncio.sleep(3); continue

        log.info(f"  Uploaded → {url}")
        res = await db.products_master.update_many(
            item['filter'],
            {'$set': {
                'cloudinary_url': url, 'image_url': url, 'image': url, 'images': [url],
                'image_updated_at': datetime.now(timezone.utc).isoformat()
            }}
        )
        log.info(f"  DB updated: {res.modified_count} products")
        await asyncio.sleep(5)

    # ── Final report ──────────────────────────────────────────────────────────
    still_docs    = await db.products_master.count_documents({'pillar': 'paperwork', 'cloudinary_url': {'$regex': 'documents.webp'}})
    still_adv     = await db.products_master.count_documents({'pillar': 'paperwork', 'cloudinary_url': {'$regex': 'advisory.webp'}})
    no_primary    = await db.products_master.count_documents({'pillar': 'paperwork', 'cloudinary_url': {'$exists': False}})
    log.info(f"\n=== DONE ===")
    log.info(f"Still on documents.webp : {still_docs}")
    log.info(f"Still on advisory.webp  : {still_adv}")
    log.info(f"No cloudinary_url at all: {no_primary}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())

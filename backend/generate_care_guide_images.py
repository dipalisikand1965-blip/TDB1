"""
Background generator for 33 missing breed-care-guide (First Year Memory Book) images.
Run: nohup python3 generate_care_guide_images.py > /tmp/care_guide_gen.log 2>&1 &
"""
import asyncio
import os
import sys
import base64
import logging
from datetime import datetime, timezone

sys.path.insert(0, '/app/backend')
os.chdir('/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from motor.motor_asyncio import AsyncIOMotorClient
import cloudinary
import cloudinary.uploader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)s  %(message)s',
    handlers=[
        logging.FileHandler('/tmp/care_guide_gen.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

WATERCOLOUR_STYLE = (
    "loose watercolour illustration, soft pastel palette, white watercolour paper texture, "
    "delicate ink outlines, gold leaf accent details, dreamy washes of colour, "
    "elegant artisan Indian craftsmanship feel, no text, no people, "
    "clean product flat-lay composition, premium lifestyle brand"
)

def make_prompt(breed_name: str) -> str:
    return (
        f"A beautiful premium hardcover memory book / milestone journal photographed on a clean white background. "
        f"The book cover features a stunning soulful watercolour illustration of a {breed_name} puppy face "
        f"painted directly on the cover — warm earthy tones, soft expressive eyes, gentle brushstrokes. "
        f"The journal has gold-embossed spine, pastel cream pages fanning out slightly. "
        f"'FIRST YEAR' elegantly embossed in gold on the cover. "
        f"No people, no animals in background — just the book product. "
        f"{WATERCOLOUR_STYLE}. "
        f"Professional studio product photography, soft shadow, centered composition."
    )


async def generate_and_upload(breed_name: str) -> str | None:
    """Generate image using OpenAI and upload to Cloudinary."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration

        EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY") or os.getenv("OPENAI_API_KEY")
        if not EMERGENT_LLM_KEY:
            log.error("No LLM key found")
            return None

        prompt = make_prompt(breed_name)
        log.info(f"Generating image for: {breed_name}")

        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=prompt,
            number_of_images=1,
            model="gpt-image-1"
        )

        if not images:
            log.warning(f"No image returned for {breed_name}")
            return None

        image_base64 = base64.b64encode(images[0]).decode('utf-8')
        image_data_url = f"data:image/png;base64,{image_base64}"

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        public_id = f"doggy/ai_generated/{timestamp}"

        result = cloudinary.uploader.upload(
            image_data_url,
            public_id=public_id,
            overwrite=True,
            resource_type="image",
            format="webp",
            quality="auto:good"
        )
        url = result.get("secure_url")
        log.info(f"  Uploaded: {url}")
        return url

    except Exception as e:
        log.error(f"Error generating {breed_name}: {e}")
        return None


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Find all 33 missing breed-care-guide products
    missing = await db.products_master.find(
        {'category': 'breed-care-guide', '$or': [{'cloudinary_url': None}, {'cloudinary_url': ''}]},
        {'_id': 0, 'id': 1, 'name': 1, 'breed_name': 1, 'breed': 1}
    ).to_list(100)

    log.info(f"=== Starting breed-care-guide image generator ===")
    log.info(f"Total to generate: {len(missing)}")

    generated = 0
    failed = 0

    for i, product in enumerate(missing):
        product_id = product['id']
        # Use breed_name if set, else extract from product name
        breed_name = product.get('breed_name') or product['name'].replace(' First Year Memory Book', '').strip()
        log.info(f"[{i+1}/{len(missing)}] Processing: {product['name']} (breed: {breed_name})")

        url = await generate_and_upload(breed_name)

        if url:
            await db.products_master.update_one(
                {'id': product_id},
                {'$set': {
                    'cloudinary_url': url,
                    'mockup_url': url,
                    'image_url': url,
                    'image': url,
                    'images': [url],
                    'ai_generated_image': True,
                    'image_updated_at': datetime.now(timezone.utc).isoformat()
                }}
            )
            generated += 1
            log.info(f"  DB updated for: {product['name']}")
        else:
            failed += 1
            log.warning(f"  FAILED: {product['name']}")

        # Small delay to avoid rate limits
        if i < len(missing) - 1:
            await asyncio.sleep(5)

    log.info(f"=== DONE === Generated: {generated} | Failed: {failed}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())

"""
Soul Made™ Watercolour Image Generator
Generates beautiful watercolour AI images for the 19 Soul flat_art products
and saves them directly to products_master via the existing generate_ai_image pipeline.

Run: python3 generate_soul_images.py  (background-safe, logs to /tmp/soul_images.log)
"""
import asyncio
import logging
import sys
import os

sys.path.insert(0, '/app/backend')
os.chdir('/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from motor.motor_asyncio import AsyncIOMotorClient
from ai_image_service import generate_ai_image

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)s  %(message)s',
    handlers=[
        logging.FileHandler('/tmp/soul_images.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME   = os.environ['DB_NAME']

# ── Watercolour prompts per Soul product ─────────────────────────────────────
# Style: loose watercolour illustration, pastel tones, white paper texture,
#        gentle washes, gold accent lines, elegant Indian artisan aesthetic
WATERCOLOUR_STYLE = (
    "loose watercolour illustration, soft pastel palette, white watercolour paper texture, "
    "delicate ink outlines, gold leaf accent details, dreamy washes of colour, "
    "elegant artisan Indian craftsmanship feel, no text, no people, no animals, "
    "clean product flat-lay composition, premium lifestyle brand"
)

SOUL_PROMPTS = {
    "Soul Mug — Flat Art": (
        f"A beautifully illustrated ceramic mug with a watercolour paw-print and soul mandala motif, "
        f"warm terracotta and blush pink washes, gold rim accent, {WATERCOLOUR_STYLE}"
    ),
    "Soul Bowl — Flat Art": (
        f"A handcrafted ceramic pet feeding bowl with soft watercolour lotus and paw motifs, "
        f"sage green and cream washes, gold trim, {WATERCOLOUR_STYLE}"
    ),
    "Soul Bandana — Flat Art": (
        f"A folded triangle pet bandana with hand-painted watercolour wildflowers and tiny paw prints, "
        f"blush pink, lavender and gold palette, {WATERCOLOUR_STYLE}"
    ),
    "Soul Tote Bag — Flat Art": (
        f"A canvas tote bag illustrated with a watercolour dog silhouette surrounded by botanicals, "
        f"sage, cream and dusty rose palette, gold drawstring detail, {WATERCOLOUR_STYLE}"
    ),
    "Soul Blanket — Flat Art": (
        f"A folded soft blanket with a watercolour pattern of overlapping mandalas and paw prints, "
        f"dusty blue and warm ivory washes, fringe edges, {WATERCOLOUR_STYLE}"
    ),
    "Soul Cushion Cover — Flat Art": (
        f"A square cushion cover with a centred watercolour portrait of an abstract dog soul, "
        f"inky midnight blue and gold highlights, tasselled corners, {WATERCOLOUR_STYLE}"
    ),
    "Soul Frame — Flat Art": (
        f"An ornate watercolour-illustrated wooden photo frame with botanical vines and paw motifs, "
        f"antique gold and soft forest green, vintage artisan feel, {WATERCOLOUR_STYLE}"
    ),
    "Soul Keychain — Flat Art": (
        f"A small leather keychain charm illustrated with a tiny watercolour dog silhouette and heart, "
        f"warm amber and rose gold foil detail, minimal elegant design, {WATERCOLOUR_STYLE}"
    ),
    "Soul Party Hat — Flat Art": (
        f"A conical pet party hat decorated with watercolour confetti bursts, gold stars and paw prints, "
        f"blush, coral and champagne gold palette, elastic string, {WATERCOLOUR_STYLE}"
    ),
    "Soul Memorial Candle — Flat Art": (
        f"A frosted glass memorial candle with a hand-painted watercolour rainbow bridge and gentle paw prints, "
        f"soft lavender, cloud white and gold leaf accents, peaceful serene mood, {WATERCOLOUR_STYLE}"
    ),
    "Soul Journal — Flat Art": (
        f"A hardcover journal with a watercolour-painted cover showing a dog's paw print transforming into a flower, "
        f"earthy terracotta, sage and gold foil title area, {WATERCOLOUR_STYLE}"
    ),
    "Soul Passport Holder — Flat Art": (
        f"A slim leather passport holder with embossed watercolour-style artwork of a dog with travel stamps, "
        f"rich burgundy and gold detail, travel chic aesthetic, {WATERCOLOUR_STYLE}"
    ),
    "Soul Greeting Card — Flat Art": (
        f"A luxury greeting card with a hand-painted watercolour dog portrait surrounded by florals, "
        f"blush pink, sage and champagne gold, envelope visible, artisan stationery, {WATERCOLOUR_STYLE}"
    ),
    "Soul Treat Jar — Flat Art": (
        f"A glass treat jar with a watercolour-painted label showing a joyful dog silhouette and paw motifs, "
        f"amber glass, copper lid, warm honey and blush tones, {WATERCOLOUR_STYLE}"
    ),
    "Soul Feeding Mat — Flat Art": (
        f"A silicone feeding mat with a raised watercolour-inspired paw print mandala design, "
        f"sage green and cream, minimalist flat-lay view, {WATERCOLOUR_STYLE}"
    ),
    "Soul Cake Topper — Flat Art": (
        f"Elegant acrylic cake toppers with watercolour-style illustrated paw prints, stars and dog silhouettes, "
        f"blush, gold and ivory, delicate laser-cut detail, {WATERCOLOUR_STYLE}"
    ),
    "Soul Pouch — Flat Art": (
        f"A velvet zipper pouch embroidered with a watercolour-inspired dog soul mandala, "
        f"deep teal and gold thread accents, luxury feel, {WATERCOLOUR_STYLE}"
    ),
    "Soul Plush Toy — Flat Art": (
        f"A handcrafted plush stuffed dog toy with watercolour fabric patches in blush, ivory and gold, "
        f"stitched paw details, artisan toy aesthetic, soft and cuddly, {WATERCOLOUR_STYLE}"
    ),
    "Soul Keepsake Box — Flat Art": (
        f"A lacquered keepsake box with a watercolour-painted lid showing a dog among botanicals and stars, "
        f"midnight blue exterior, gold hinge, velvet interior, heirloom quality, {WATERCOLOUR_STYLE}"
    ),
}

async def generate_all():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    products = await db.products_master.find(
        {"category": "flat_art", "is_active": True},
        {"_id": 1, "name": 1, "image_url": 1}
    ).to_list(50)

    log.info(f"Found {len(products)} Soul flat_art products to process")

    success, failed = 0, []

    for p in products:
        name = p.get("name", "")
        pid  = p["_id"]
        prompt = SOUL_PROMPTS.get(name)

        if not prompt:
            log.warning(f"No prompt defined for: {name} — skipping")
            continue

        log.info(f"Generating: {name}")
        try:
            url = await generate_ai_image(prompt)
            if url:
                await db.products_master.update_one(
                    {"_id": pid},
                    {"$set": {
                        "image_url":           url,
                        "cloudinary_url":      url,
                        "ai_image_prompt":     prompt,
                        "ai_image_generated":  True,
                        "locally_edited":      True
                    }}
                )
                log.info(f"  ✓ Saved: {name}  →  {url[:60]}...")
                success += 1
            else:
                log.error(f"  ✗ No URL returned for: {name}")
                failed.append(name)
        except Exception as e:
            log.error(f"  ✗ Error for {name}: {e}")
            failed.append(name)

        # Small pause to avoid hammering the API
        await asyncio.sleep(2)

    log.info(f"\n{'='*60}")
    log.info(f"Done. Success: {success} / {len(products)}")
    if failed:
        log.info(f"Failed: {failed}")
    log.info(f"{'='*60}")
    client.close()

if __name__ == "__main__":
    asyncio.run(generate_all())

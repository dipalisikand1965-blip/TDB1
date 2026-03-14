#!/usr/bin/env python3
"""
Party Products AI Image Generator - REALISTIC PRODUCT PHOTOS
============================================================
Generates professional product photography for party/celebration items.
Images show ACTUAL PRODUCTS (hats, balloons, banners) - NOT dog photos.

Uses GPT Image 1 via Emergent + Cloudinary storage.
"""

import os
import sys
import asyncio
import logging
import base64
import secrets
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

sys.path.append('/app/backend')

from pymongo import MongoClient
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'pet-os-live-test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# PARTY PRODUCTS - Each has a VERY SPECIFIC prompt for realistic product photography
PARTY_PRODUCTS = [
    # === PARTY HATS ===
    {
        "name": "Birthday Celebration Hat",
        "description": "Make your pup the star of their special day! This vibrant cone party hat features an adjustable elastic strap that fits comfortably. Because every soul deserves to feel celebrated.",
        "mira_hint": "Perfect for marking those milestone moments. When a birthday calls, this hat answers.",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 249.0,
        "mrp": 349.0,
        "prompt": "Professional e-commerce product photography of a colorful paper cone birthday party hat for dogs, classic cone shape with vibrant rainbow stripes and polka dots, small elastic chin strap attached, tiny pom-pom on top, studio lighting, clean pure white background, centered composition, high resolution, sharp focus, Amazon product listing style, isolated product only, no pets no people",
        "tags": ["party-hat", "birthday", "cone-hat", "celebration"]
    },
    {
        "name": "Golden Crown of Joy",
        "description": "For the soul who rules your heart. This sparkly golden crown turns any day into a royal celebration. Adjustable fit ensures comfort.",
        "mira_hint": "Because some souls are born royalty. This crown knows it.",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 299.0,
        "mrp": 399.0,
        "prompt": "Professional product photo of a small golden glitter fabric crown for pets, sparkly gold crown with soft padded interior, velcro or elastic strap visible, royal king crown shape, clean white background, studio photography, e-commerce style, isolated product, no animals, centered, sharp detail",
        "tags": ["crown", "golden", "royalty", "glitter"]
    },
    {
        "name": "Princess Tiara",
        "description": "For the little one who brings magic into your life. Delicate pink and silver design with clip-on attachment. Perfect for capturing unforgettable moments.",
        "mira_hint": "Some souls sparkle brighter. This tiara simply reflects what's already there.",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 199.0,
        "mrp": 279.0,
        "prompt": "E-commerce product photo of a small pink pet princess tiara with faux rhinestones and silver accents, cute mini crown headband for small dogs, hair clip attachment visible, feminine sparkly design, white studio background, professional lighting, isolated accessory only, no pets",
        "tags": ["tiara", "princess", "pink", "sparkle"]
    },
    
    # === BANNERS ===
    {
        "name": "Happy Barkday Banner",
        "description": "Transform any space into a celebration! Pre-strung letter banner sets the stage for memories that last forever.",
        "mira_hint": "The backdrop to moments you'll cherish. Hang it up and let the celebration begin.",
        "category": "party_accessories",
        "subcategory": "banners",
        "price": 349.0,
        "mrp": 449.0,
        "prompt": "Professional product photography of a paper letter banner spelling HAPPY BARKDAY, colorful cardstock letters strung on twine or ribbon, dog birthday party decoration, each letter is a separate piece connected by string, festive colors pink gold blue, white background, flat lay or hanging display style, isolated decoration only",
        "tags": ["banner", "barkday", "letters", "decoration"]
    },
    {
        "name": "Pawty Time Letter Set",
        "description": "Announce the celebration in style! Playful letter banner with paw print bunting creates the perfect party atmosphere.",
        "mira_hint": "Every pawty needs an entrance. This makes the statement.",
        "category": "party_accessories",
        "subcategory": "banners",
        "price": 399.0,
        "mrp": 499.0,
        "prompt": "Product photography of a colorful party banner set with PAW-TY TIME letters plus small paw print shaped bunting flags, festive garland decoration, pink purple and gold colors, strung on decorative cord, white background, professional e-commerce style, isolated party supplies only",
        "tags": ["banner", "pawty", "letters", "garland"]
    },
    
    # === BALLOONS ===
    {
        "name": "Paw Print Balloon Collection",
        "description": "Fill the room with joy! Curated collection of 20 balloons featuring adorable paw prints. Pet-safe latex materials.",
        "mira_hint": "Joy should fill every corner. These balloons make sure it does.",
        "category": "party_accessories",
        "subcategory": "balloons",
        "price": 399.0,
        "mrp": 499.0,
        "prompt": "Professional product photo of a bundle of colorful latex balloons with paw print patterns printed on them, assorted colors including pink blue gold white, multiple balloons tied together with curly ribbon, clean white background, party supplies e-commerce style, isolated balloons only, no people no pets",
        "tags": ["balloons", "paw-print", "latex", "colorful"]
    },
    {
        "name": "Bone & Paw Foil Balloon Set",
        "description": "Make a statement! Premium foil balloons in bone and paw shapes bring extra sparkle to the celebration.",
        "mira_hint": "Some moments deserve to shine. These balloons deliver.",
        "category": "party_accessories",
        "subcategory": "balloons",
        "price": 499.0,
        "mrp": 649.0,
        "prompt": "E-commerce product photography of premium metallic foil balloons for pet party, one large dog bone shaped foil balloon and one paw print shaped foil balloon, rose gold and silver colors, shiny mylar material, white background, professional studio lighting, party decoration product shot, isolated items only",
        "tags": ["foil", "bone-shape", "paw-shape", "metallic"]
    },
    
    # === BOW TIES ===
    {
        "name": "Dapper Bow Tie Collection",
        "description": "Four bow ties for four different moods. From sparkly celebrations to classic charm. Easy clip-on design fits any collar.",
        "mira_hint": "Style speaks. Let your pup say something.",
        "category": "party_accessories",
        "subcategory": "bow-ties",
        "price": 299.0,
        "mrp": 399.0,
        "prompt": "Professional flat lay product photo of a set of four fancy pet bow ties for dogs, different patterns including gold glitter fabric, silver sequin, colorful stripes, and polka dots, collar clip attachments visible on back, arranged neatly on white background, e-commerce accessory photography, isolated bow ties only",
        "tags": ["bow-tie", "set", "dapper", "collar-clip"]
    },
    {
        "name": "Celebration Bow Tie - Gold Sparkle",
        "description": "The showstopper! Gold sparkle bow tie that catches every light. Elastic loop fits most collar sizes.",
        "mira_hint": "When you want all eyes on your pup.",
        "category": "party_accessories",
        "subcategory": "bow-ties",
        "price": 199.0,
        "mrp": 279.0,
        "prompt": "Product photography of a single gold glitter dog bow tie, sparkly fabric with shiny sequins or glitter, collar attachment loop visible, celebration party accessory for pets, clean white background, professional studio shot, sharp focus on texture, isolated bow tie only",
        "tags": ["bow-tie", "gold", "sparkle", "single"]
    },
    
    # === PHOTO PROPS ===
    {
        "name": "Silly Photo Prop Kit",
        "description": "Capture the personality! Fun glasses and quirky mini hat that bring out your pup's playful side.",
        "mira_hint": "The best photos capture personality. This kit helps you do exactly that.",
        "category": "party_accessories",
        "subcategory": "photo-props",
        "price": 349.0,
        "mrp": 449.0,
        "prompt": "E-commerce product photo of a pet photo prop kit including novelty heart-shaped sunglasses and a small colorful top hat or party hat, fun costume accessories for dogs, elastic straps visible, bright cheerful colors, white background, product flat lay style, isolated props only no animals",
        "tags": ["glasses", "hat", "props", "costume"]
    },
    {
        "name": "Birthday Star Headband Set",
        "description": "Three ways to shine! Headband collection includes birthday cake topper, balloon design, and star crown. Adjustable fit.",
        "mira_hint": "Stars are born, not made. But these headbands help announce it.",
        "category": "party_accessories",
        "subcategory": "headbands",
        "price": 379.0,
        "mrp": 479.0,
        "prompt": "Professional product photography of a set of three decorative pet headbands, one with small birthday cake decoration on top, one with balloon shapes, one with star or crown, fabric headbands with elastic, colorful festive designs, white background, flat lay arrangement, isolated headbands only, no pets",
        "tags": ["headband", "birthday", "star", "set"]
    },
    
    # === PARTY KITS ===
    {
        "name": "Photo Moment Backdrop",
        "description": "Create the perfect setting for celebration photos! Complete backdrop kit with everything needed for milestone moments.",
        "mira_hint": "Moments become memories. This backdrop frames them beautifully.",
        "category": "party_kits",
        "subcategory": "backdrop",
        "price": 799.0,
        "mrp": 999.0,
        "prompt": "Product photography of a pet birthday photo backdrop kit, fabric backdrop with paw prints and bones pattern in pastel colors, rolled up or folded, includes small balloon arch frame components, party decoration package, white background, e-commerce style, isolated kit components",
        "tags": ["backdrop", "photo-booth", "kit", "setup"]
    },
    {
        "name": "Celebration Confetti Pack",
        "description": "Sprinkle joy everywhere! Pet-safe paper confetti in paw and bone shapes. Biodegradable and worry-free.",
        "mira_hint": "Joy should rain down. Safely. This confetti does both.",
        "category": "celebration_addons",
        "subcategory": "confetti",
        "price": 199.0,
        "mrp": 279.0,
        "prompt": "E-commerce product photo of colorful paper confetti pieces in paw print and bone shapes, scattered confetti shown plus small bag or package, pink gold and white colors, party table decoration, biodegradable paper confetti, white background, overhead flat lay style, isolated confetti only",
        "tags": ["confetti", "biodegradable", "paw-shape", "safe"]
    },
    {
        "name": "Ultimate Celebration Bundle",
        "description": "Everything for the perfect celebration! Hat, bow tie, banner, balloons, confetti, and props — all curated.",
        "mira_hint": "When you want everything to be just right. This bundle makes it so.",
        "category": "party_kits",
        "subcategory": "bundles",
        "price": 1499.0,
        "mrp": 1999.0,
        "prompt": "Professional product photography of a complete pet birthday party bundle flat lay, including small party hat, bow tie, letter banner, colorful balloons, confetti pack, and photo props, all items arranged neatly together, comprehensive celebration kit, white background, e-commerce style, isolated party supplies only, no pets no people",
        "tags": ["bundle", "complete", "all-in-one", "value"]
    },
]


async def generate_image(prompt: str) -> bytes:
    """Generate image using GPT Image 1"""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not found")
            return None
            
        image_gen = OpenAIImageGeneration(api_key=api_key)
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            return images[0]
    except Exception as e:
        logger.error(f"Image generation error: {e}")
    return None


def upload_to_cloudinary(image_bytes: bytes, product_id: str) -> str:
    """Upload to Cloudinary party products folder"""
    try:
        b64 = base64.b64encode(image_bytes).decode('utf-8')
        result = cloudinary.uploader.upload(
            f"data:image/png;base64,{b64}",
            folder="celebrate_party_realistic",
            public_id=f"party_{product_id}",
            overwrite=True
        )
        return result.get('secure_url')
    except Exception as e:
        logger.error(f"Upload error: {e}")
    return None


def create_product_doc(product: dict, product_id: str, image_url: str) -> dict:
    """Create product document for MongoDB"""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": product_id,
        "name": product["name"],
        "product_name": product["name"],
        "display_name": product["name"],
        "description": product["description"],
        "short_description": product["description"][:100] + "..." if len(product["description"]) > 100 else product["description"],
        "sku": f"PARTY-{secrets.token_hex(4).upper()}",
        "price": product["price"],
        "mrp": product["mrp"],
        "base_price": product["price"],
        "pricing": {"base_price": product["price"], "mrp": product["mrp"], "currency": "INR"},
        "category": product["category"],
        "subcategory": product["subcategory"],
        "product_type": "physical",
        "brand": "The Doggy Company",
        "primary_pillar": "celebrate",
        "pillars": ["celebrate", "shop"],
        "tags": product["tags"] + ["party", "celebration"],
        "image_url": image_url,
        "images": [image_url],
        "thumbnail": image_url,
        "ai_image_generated": True,
        "ai_image_prompt": product["prompt"],
        "mira_hint": product["mira_hint"],
        "suitability": {"pet_filters": {"species": ["dog"], "life_stages": ["all"]}},
        "occasions": ["birthday", "gotcha_day", "celebration"],
        "mira_visibility": {"can_reference": True, "can_suggest_proactively": True},
        "in_stock": True,
        "inventory": {"inventory_status": "in_stock", "stock_quantity": 50},
        "is_pan_india": True,
        "status": "active",
        "is_active": True,
        "source": "party_realistic_v3",
        "is_celebration_item": True,
        "is_party_item": True,
        "created_at": now,
        "updated_at": now
    }


async def main():
    """Generate party products with realistic AI images"""
    logger.info("=" * 70)
    logger.info("PARTY PRODUCTS - REALISTIC AI IMAGE GENERATOR")
    logger.info("=" * 70)
    logger.info(f"Products to create: {len(PARTY_PRODUCTS)}")
    
    success = 0
    failed = 0
    
    for i, product in enumerate(PARTY_PRODUCTS, 1):
        logger.info(f"\n[{i}/{len(PARTY_PRODUCTS)}] {product['name']}")
        
        # Skip if exists
        existing = db.products_master.find_one({"name": product["name"], "source": "party_realistic_v3"})
        if existing:
            logger.info(f"  Already exists, skipping")
            continue
        
        product_id = f"party-real-{secrets.token_hex(6)}"
        
        logger.info(f"  Generating image...")
        image_bytes = await generate_image(product["prompt"])
        
        if image_bytes:
            logger.info(f"  Uploading to Cloudinary...")
            image_url = upload_to_cloudinary(image_bytes, product_id)
            if image_url:
                doc = create_product_doc(product, product_id, image_url)
                db.products_master.insert_one(doc)
                logger.info(f"  ✓ Created: {image_url[:60]}...")
                success += 1
            else:
                logger.warning(f"  ✗ Upload failed")
                failed += 1
        else:
            logger.warning(f"  ✗ Generation failed")
            failed += 1
        
        # Delay to avoid rate limiting
        await asyncio.sleep(5)
    
    logger.info("\n" + "=" * 70)
    logger.info(f"COMPLETE: {success} created, {failed} failed")
    logger.info("=" * 70)
    
    # Show created products
    products = list(db.products_master.find(
        {"source": "party_realistic_v3"},
        {"name": 1, "image_url": 1, "_id": 0}
    ))
    logger.info(f"\nTotal party products: {len(products)}")
    for p in products:
        logger.info(f"  - {p['name']}")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(main())

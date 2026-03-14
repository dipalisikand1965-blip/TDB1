#!/usr/bin/env python3
"""
Party & Celebration Products Generator v2
==========================================
Soul-first product generation for The Doggy Company.
NOT generic e-commerce — these products are about celebrating your pet's unique soul.

Uses GPT Image 1 via Emergent Integrations + Cloudinary storage.
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

# Soul-driven party products - NOT generic e-commerce copy!
PARTY_PRODUCTS = [
    # PARTY HATS
    {
        "name": "Birthday Celebration Hat",
        "description": "Make your pup the star of their special day! This vibrant cone party hat features an adjustable elastic strap that fits comfortably. Because every soul deserves to feel celebrated.",
        "mira_hint": "Perfect for marking those milestone moments. When a birthday calls, this hat answers.",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 249.0,
        "mrp": 349.0,
        "prompt": "Professional studio product photo of a single colorful cone-shaped dog birthday party hat, rainbow stripes pattern, fluffy pompom on top, elastic strap, clean white background, centered, high-end product photography, soft shadows, no dog in image",
        "tags": ["party-hat", "birthday", "celebration", "milestone"]
    },
    {
        "name": "Golden Crown of Joy",
        "description": "For the soul who rules your heart. This sparkly golden crown turns any day into a royal celebration. Adjustable fit ensures comfort throughout the pawty.",
        "mira_hint": "Because some souls are born royalty. This crown knows it.",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 299.0,
        "mrp": 399.0,
        "prompt": "Professional product photo of a sparkly gold pet birthday crown, glitter finish, elegant royal design, small crown for dogs, adjustable elastic band, white studio background, isolated product, luxury pet accessory photography",
        "tags": ["crown", "golden", "royalty", "celebration"]
    },
    {
        "name": "Princess Tiara",
        "description": "For the little one who brings magic into your life. Delicate pink and silver design with clip-on attachment. Perfect for capturing those unforgettable moments.",
        "mira_hint": "Some souls sparkle brighter. This tiara simply reflects what's already there.",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 199.0,
        "mrp": 279.0,
        "prompt": "Product photography of a cute mini pink and silver pet tiara, small crown with rhinestones, delicate princess design, hair clip attachment, white background, isolated elegant pet accessory, feminine and sparkly",
        "tags": ["tiara", "princess", "sparkle", "photoshoot"]
    },
    
    # BANNERS
    {
        "name": "Happy Barkday Banner",
        "description": "Transform any space into a celebration of your pup's special day. Pre-strung and ready to hang, this banner sets the stage for memories that last forever.",
        "mira_hint": "The backdrop to moments you'll cherish. Hang it up and let the celebration begin.",
        "category": "party_accessories",
        "subcategory": "banners",
        "price": 349.0,
        "mrp": 449.0,
        "prompt": "Professional product photo of a Happy Birthday dog party banner with letters spelling HAPPY BARKDAY, colorful bunting style, paw print decorations, string attached, white background, party decoration flat lay, high quality",
        "tags": ["banner", "barkday", "decoration", "celebration"]
    },
    {
        "name": "Pawty Time Letter Set",
        "description": "Announce the celebration in style! This playful letter banner with coordinating paw bunting creates the perfect party atmosphere. Reusable for years of celebrations to come.",
        "mira_hint": "Every pawty needs an entrance. This makes the statement.",
        "category": "party_accessories",
        "subcategory": "banners",
        "price": 399.0,
        "mrp": 499.0,
        "prompt": "Product photo of a colorful PAWTY TIME letter banner set with paw print garland, festive party bunting, pink and gold colors, hanging decoration, clean white background, party supplies flat lay",
        "tags": ["banner", "pawty", "garland", "festive"]
    },
    
    # BALLOONS
    {
        "name": "Paw Print Balloon Collection",
        "description": "Fill the room with joy! This curated collection of 20 balloons features adorable paw prints in party colors. Pet-safe materials for worry-free celebrating.",
        "mira_hint": "Joy should fill every corner. These balloons make sure it does.",
        "category": "party_accessories",
        "subcategory": "balloons",
        "price": 399.0,
        "mrp": 499.0,
        "prompt": "Professional photo of a bundle of colorful latex balloons with paw print patterns, mix of pink blue purple and gold balloons, pet party decorations, tied with ribbon, white background, celebration supplies",
        "tags": ["balloons", "paw-print", "colorful", "celebration"]
    },
    {
        "name": "Bone & Paw Foil Balloon Set",
        "description": "Make a statement! Premium foil balloons in bone and paw shapes bring that extra sparkle to the celebration. Includes coordinating latex balloons for the complete look.",
        "mira_hint": "Some moments deserve to shine. These balloons deliver.",
        "category": "party_accessories",
        "subcategory": "balloons",
        "price": 499.0,
        "mrp": 649.0,
        "prompt": "Product photo of premium metallic foil balloons, one large bone-shaped balloon and one paw-shaped balloon, rose gold and silver colors, with smaller matching balloons, white background, luxury party supplies",
        "tags": ["foil", "bone-shape", "paw-shape", "premium"]
    },
    
    # PHOTO PROPS
    {
        "name": "Dapper Bow Tie Collection",
        "description": "Four bow ties for four different moods. From sparkly celebrations to classic charm, dress your pup for every special moment. Easy clip-on design fits any collar.",
        "mira_hint": "Style speaks. Let your pup say something.",
        "category": "party_accessories",
        "subcategory": "photo-props",
        "price": 299.0,
        "mrp": 399.0,
        "prompt": "Professional flat lay photo of a set of four fancy dog bow ties, different patterns including gold glitter, silver sparkle, polka dots, and stripes, collar clip attachments visible, white background, pet fashion accessories",
        "tags": ["bow-tie", "dapper", "style", "photo-prop"]
    },
    {
        "name": "Silly Photo Prop Kit",
        "description": "Capture the personality! Fun glasses and a quirky mini hat that bring out your pup's playful side. Perfect for those photos that make everyone smile.",
        "mira_hint": "The best photos capture personality. This kit helps you do exactly that.",
        "category": "party_accessories",
        "subcategory": "photo-props",
        "price": 349.0,
        "mrp": 449.0,
        "prompt": "Product photo of fun dog photo props including novelty sunglasses with heart shapes and a small colorful party top hat, pet costume accessories, playful and cute, white background, isolated products",
        "tags": ["glasses", "hat", "silly", "photoshoot"]
    },
    {
        "name": "Birthday Star Headband Set",
        "description": "Three ways to shine! This headband collection includes a birthday cake topper, balloon design, and star crown. Adjustable to fit souls of all sizes.",
        "mira_hint": "Stars are born, not made. But these headbands help announce it.",
        "category": "party_accessories",
        "subcategory": "photo-props",
        "price": 379.0,
        "mrp": 479.0,
        "prompt": "Product photo of three cute pet birthday headbands laid out, one with birthday cake decoration, one with balloon shapes, one with star crown design, colorful fabric headbands for dogs, white background",
        "tags": ["headband", "star", "birthday", "collection"]
    },
    
    # PARTY KITS & DECOR
    {
        "name": "Photo Moment Backdrop",
        "description": "Create the perfect setting for celebration photos! This complete backdrop kit includes everything you need to capture those milestone moments in style.",
        "mira_hint": "Moments become memories. This backdrop frames them beautifully.",
        "category": "party_kits",
        "subcategory": "decor",
        "price": 799.0,
        "mrp": 999.0,
        "prompt": "Professional product photo of a dog party photo backdrop setup kit, fabric backdrop with bone and paw print pattern in soft colors, decorative frame elements, white background, party decoration package",
        "tags": ["backdrop", "photoshoot", "memories", "setup"]
    },
    {
        "name": "Celebration Confetti",
        "description": "Sprinkle joy everywhere! Pet-safe paper confetti in adorable paw and bone shapes. Biodegradable and worry-free — because celebrations should be fun for everyone.",
        "mira_hint": "Joy should rain down. Safely. This confetti does both.",
        "category": "celebration_addons",
        "subcategory": "confetti",
        "price": 199.0,
        "mrp": 279.0,
        "prompt": "Product photo of colorful paper confetti in paw print and bone shapes, scattered artfully, pet safe biodegradable party confetti, pink gold and white colors, white background, celebration supplies",
        "tags": ["confetti", "pet-safe", "biodegradable", "joy"]
    },
    {
        "name": "Pawty Table Setting",
        "description": "Set the scene for celebration! Complete table decor including plates, cups, napkins, and centerpiece. Coordinates beautifully for that Instagram-worthy party setup.",
        "mira_hint": "Every detail matters when celebrating someone you love.",
        "category": "celebration_addons",
        "subcategory": "table-decor",
        "price": 599.0,
        "mrp": 749.0,
        "prompt": "Product photo of a coordinated dog birthday party table setting set, paw print themed plates cups and napkins in pink and gold, party tableware package, flat lay on white background, celebration supplies",
        "tags": ["tableware", "setting", "coordinated", "pawty"]
    },
    
    # BUNDLES
    {
        "name": "Ultimate Celebration Bundle",
        "description": "Everything for the perfect celebration! Hat, bow tie, banner, balloons, confetti, and photo props — all curated to create unforgettable moments. Worth celebrating.",
        "mira_hint": "When you want everything to be just right. This bundle makes it so.",
        "category": "party_kits",
        "subcategory": "bundles",
        "price": 1499.0,
        "mrp": 1999.0,
        "prompt": "Professional product photo of a complete dog birthday party bundle laid out, including party hat, bow tie, banner, balloons, confetti, and props, comprehensive celebration kit, white background, styled flat lay",
        "tags": ["bundle", "complete", "celebration", "value"]
    },
    {
        "name": "Memory Maker Photo Kit",
        "description": "Capture every precious moment! Premium collection of crowns, bow ties, backdrop, and props designed for creating photos that last forever. Because these days deserve to be remembered.",
        "mira_hint": "Memories deserve to be made with intention. This kit helps you do that.",
        "category": "party_kits",
        "subcategory": "bundles",
        "price": 1299.0,
        "mrp": 1699.0,
        "prompt": "Product photo of a premium dog photo session kit, including two fancy crowns, three bow ties, mini backdrop piece, celebration sash, and photo props, deluxe party package, white background, luxury pet accessories",
        "tags": ["photo-kit", "memories", "premium", "keepsake"]
    }
]


async def generate_image_with_emergent(prompt: str) -> bytes:
    """Generate image using Emergent's GPT Image integration"""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        emergent_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('EMERGENT_MODEL_API_KEY')
        if not emergent_key:
            logger.error("EMERGENT_LLM_KEY not found")
            return None
            
        image_gen = OpenAIImageGeneration(api_key=emergent_key)
        
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            logger.info(f"  Image generated successfully")
            return images[0]
            
    except Exception as e:
        logger.error(f"Error generating image: {e}")
    return None


def upload_to_cloudinary(image_bytes: bytes, product_id: str) -> str:
    """Upload image bytes to Cloudinary"""
    try:
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        data_uri = f"data:image/png;base64,{image_base64}"
        
        result = cloudinary.uploader.upload(
            data_uri,
            folder="celebrate_party_v2",
            public_id=f"party_{product_id}",
            overwrite=True,
            resource_type="image"
        )
        return result.get('secure_url')
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return None


def create_product_doc(product: dict, product_id: str, image_url: str) -> dict:
    """Create soul-driven product document"""
    now = datetime.now(timezone.utc).isoformat()
    
    return {
        "id": product_id,
        "name": product["name"],
        "product_name": product["name"],
        "display_name": product["name"],
        "description": product["description"],
        "short_description": product["description"][:100] + "..." if len(product["description"]) > 100 else product["description"],
        "sku": f"CELEB-{secrets.token_hex(4).upper()}",
        
        "price": product["price"],
        "mrp": product["mrp"],
        "base_price": product["price"],
        "pricing": {
            "base_price": product["price"],
            "mrp": product["mrp"],
            "selling_price": product["price"],
            "currency": "INR"
        },
        
        "category": product["category"],
        "subcategory": product["subcategory"],
        "product_type": "physical",
        "brand": "The Doggy Company",
        
        "primary_pillar": "celebrate",
        "pillars": ["celebrate", "shop"],
        
        "tags": product["tags"] + ["party", "celebration", "soul-celebration"],
        
        "image_url": image_url,
        "images": [image_url],
        "thumbnail": image_url,
        "ai_image_generated": True,
        
        # Soul-driven hint for Mira - NO generic language!
        "mira_hint": product["mira_hint"],
        
        "suitability": {
            "pet_filters": {
                "species": ["dog"],
                "life_stages": ["all"],
                "size_options": ["XS", "S", "M", "L", "XL"],
                "breed_applicability": "all"
            }
        },
        
        "occasions": ["birthday", "gotcha_day", "celebration", "milestone"],
        
        "mira_visibility": {
            "can_reference": True,
            "can_suggest_proactively": True
        },
        
        "in_stock": True,
        "inventory": {
            "inventory_status": "in_stock",
            "stock_quantity": 50
        },
        
        "is_pan_india": True,
        "status": "active",
        "source": "party_generator_v2",
        "is_celebration_item": True,
        "is_party_item": True,
        
        "created_at": now,
        "updated_at": now
    }


async def main():
    """Generate party products with soul-driven descriptions"""
    logger.info("=" * 70)
    logger.info("SOUL-DRIVEN PARTY PRODUCTS GENERATOR v2")
    logger.info("=" * 70)
    logger.info(f"Products to create: {len(PARTY_PRODUCTS)}")
    logger.info("=" * 70)
    
    success = 0
    failed = 0
    
    for i, product in enumerate(PARTY_PRODUCTS, 1):
        logger.info(f"\n[{i}/{len(PARTY_PRODUCTS)}] {product['name']}")
        
        # Check if exists
        existing = db.products_master.find_one({"name": product["name"], "source": "party_generator_v2"})
        if existing:
            logger.info(f"  Already exists, skipping")
            continue
        
        product_id = f"party-v2-{secrets.token_hex(6)}"
        
        # Generate image
        image_bytes = await generate_image_with_emergent(product["prompt"])
        
        if image_bytes:
            image_url = upload_to_cloudinary(image_bytes, product_id)
            if image_url:
                doc = create_product_doc(product, product_id, image_url)
                db.products_master.insert_one(doc)
                logger.info(f"  Saved: {image_url[:60]}...")
                success += 1
            else:
                failed += 1
        else:
            failed += 1
        
        # Delay between requests
        await asyncio.sleep(4)
    
    logger.info("\n" + "=" * 70)
    logger.info(f"COMPLETE: {success} created, {failed} failed")
    logger.info("=" * 70)
    
    # Show results
    products = list(db.products_master.find(
        {"source": "party_generator_v2"},
        {"name": 1, "mira_hint": 1, "_id": 0}
    ))
    logger.info(f"\nCreated {len(products)} soul-driven party products")
    
    client.close()
    return success


if __name__ == "__main__":
    asyncio.run(main())

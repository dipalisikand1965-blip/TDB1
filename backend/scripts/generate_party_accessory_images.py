#!/usr/bin/env python3
"""
Generate AI images for Party & Accessory Products
=================================================
Uses GPT Image 1 via Emergent Integrations and uploads to Cloudinary.
Creates GENERIC party products applicable across ALL breeds.

Products:
- Party Hats (classic cone, glitter crown, mini crown)
- Celebration Banners ("Happy Barkday", "Paw-ty Time")
- Balloon Bundles (paw prints, confetti-safe)
- Photo Props (bow ties, glasses, headbands)
- Photo Backdrop Kit
- Confetti (pet-safe paper)
- Complete Party Bundles

Target: products_master collection → Admin + Celebrate Page
"""

import os
import sys
import asyncio
import logging
import base64
import secrets
from datetime import datetime, timezone

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add backend to path
sys.path.append('/app/backend')

from pymongo import MongoClient
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv('/app/backend/.env')

# Cloudinary config
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

# MongoDB
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'pet-os-live-test_database')
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Party & Accessory Products with AI Image Prompts
PARTY_PRODUCTS = [
    # PARTY HATS
    {
        "name": "Classic Birthday Party Hat",
        "description": "Festive cone-shaped party hat for dogs. Features colorful stripes and a fluffy pom-pom on top. Elastic chin strap for secure fit. One size fits most dogs.",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 249.0,
        "mrp": 349.0,
        "prompt": "Professional product photography of a colorful dog birthday party hat, cone shaped with rainbow stripes, fluffy pom-pom on top, elastic strap visible, clean white studio background, no dog, isolated product, high quality commercial photo",
        "tags": ["party-hat", "birthday", "celebration", "festive", "all-breeds"]
    },
    {
        "name": "Glitter Birthday Crown",
        "description": "Sparkly glitter crown that makes your pup royalty for the day! Gold and silver glitter with 'Birthday King/Queen' text. Adjustable elastic band.",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 299.0,
        "mrp": 399.0,
        "prompt": "Professional product photo of a sparkly gold and silver glitter dog birthday crown, 'Birthday' text visible, fabric crown with elastic band, clean white background, isolated product, no dog, commercial product photography",
        "tags": ["crown", "glitter", "birthday", "royalty", "all-breeds"]
    },
    {
        "name": "Mini Birthday Tiara",
        "description": "Adorable mini tiara for small dogs. Pink and gold design with faux gems. Clip-on attachment for easy wear. Perfect for photos!",
        "category": "party_accessories",
        "subcategory": "party-hats",
        "price": 199.0,
        "mrp": 279.0,
        "prompt": "Product photo of a cute mini dog birthday tiara, pink and gold with fake gems, small crown for pets, clip attachment visible, white studio background, no animal, isolated product shot",
        "tags": ["tiara", "small-dogs", "birthday", "princess", "photo-prop"]
    },
    
    # BANNERS
    {
        "name": "Happy Barkday Banner",
        "description": "Colorful 'Happy Barkday' letter banner for your pup's party. 2 meters long, pre-strung and ready to hang. Reusable for many celebrations!",
        "category": "party_accessories",
        "subcategory": "banners",
        "price": 349.0,
        "mrp": 449.0,
        "prompt": "Product photo of a colorful 'Happy Barkday' letter banner for dog birthday party, hanging letters with paw prints, festive colors, white background, isolated product, commercial photography",
        "tags": ["banner", "barkday", "decoration", "party", "reusable"]
    },
    {
        "name": "Paw-ty Time Banner Set",
        "description": "Fun 'Paw-ty Time' banner with paw print garland. Includes main banner plus decorative paw bunting. Total length 3 meters.",
        "category": "party_accessories",
        "subcategory": "banners",
        "price": 399.0,
        "mrp": 499.0,
        "prompt": "Product photo of a 'Paw-ty Time' party banner set with paw print garland, colorful letters and paw shapes, dog party decoration, white background, isolated product shot, no pets",
        "tags": ["banner", "paw-print", "garland", "party-set", "decoration"]
    },
    
    # BALLOONS
    {
        "name": "Paw Print Balloon Bundle",
        "description": "Set of 20 balloons featuring adorable paw print designs. Mix of regular and metallic balloons in party colors. Pet-safe latex.",
        "category": "party_accessories",
        "subcategory": "balloons",
        "price": 399.0,
        "mrp": 499.0,
        "prompt": "Product photo of colorful dog party balloons with paw print designs, bundle of latex balloons in pink blue gold colors, pet birthday party decorations, white background, no people or pets",
        "tags": ["balloons", "paw-print", "latex", "bundle", "party"]
    },
    {
        "name": "Foil Bone & Paw Balloon Set",
        "description": "Premium foil balloon set with bone-shaped and paw-shaped balloons. Includes 3 large foil shapes plus 10 matching latex balloons.",
        "category": "party_accessories",
        "subcategory": "balloons",
        "price": 499.0,
        "mrp": 649.0,
        "prompt": "Product photo of premium foil dog party balloons, bone shaped and paw shaped metallic foil balloons, gold and rose gold colors, white background, isolated product, commercial photo",
        "tags": ["foil-balloons", "bone-shaped", "paw-shaped", "premium", "party"]
    },
    
    # PHOTO PROPS
    {
        "name": "Celebration Bow Tie Set",
        "description": "Set of 4 festive bow ties in party colors. Clips onto collar easily. Includes: Gold glitter, Silver sparkle, Birthday stripes, Paw print pattern.",
        "category": "party_accessories",
        "subcategory": "photo-props",
        "price": 299.0,
        "mrp": 399.0,
        "prompt": "Product photo of a set of 4 colorful dog bow ties for parties, gold glitter and sparkly fabrics, pet collar bow tie clips, white background, isolated products laid out, commercial photography",
        "tags": ["bow-tie", "collar", "photo-prop", "set", "fancy"]
    },
    {
        "name": "Party Glasses & Hat Combo",
        "description": "Fun photo prop set with silly glasses and mini top hat. Elastic straps fit most dogs. Perfect for birthday photoshoots!",
        "category": "party_accessories",
        "subcategory": "photo-props",
        "price": 349.0,
        "mrp": 449.0,
        "prompt": "Product photo of dog party photo props, silly novelty glasses and mini top hat for pets, colorful fun costume accessories, white background, no dog, isolated products",
        "tags": ["glasses", "hat", "photo-prop", "costume", "fun"]
    },
    {
        "name": "Birthday Headband Collection",
        "description": "Set of 3 birthday headbands: Birthday cake topper, Party balloon design, Star crown. Adjustable elastic fits all sizes.",
        "category": "party_accessories",
        "subcategory": "photo-props",
        "price": 379.0,
        "mrp": 479.0,
        "prompt": "Product photo of dog birthday headbands set, cute pet hair bands with birthday cake and balloon decorations, party accessories for dogs, white background, isolated products",
        "tags": ["headband", "birthday", "photo-prop", "set", "adjustable"]
    },
    
    # PARTY KITS & DECOR
    {
        "name": "Photo Backdrop Kit",
        "description": "Complete photo backdrop for pet party pictures! Includes: 5x7ft backdrop with bone & paw design, mini balloon arch, floor mat. Easy setup.",
        "category": "party_kits",
        "subcategory": "decor",
        "price": 799.0,
        "mrp": 999.0,
        "prompt": "Product photo of a dog party photo backdrop kit, fabric backdrop with paw prints and bones, mini balloon arch frame, party decoration setup, white background, commercial product shot",
        "tags": ["backdrop", "photo-booth", "kit", "setup", "party"]
    },
    {
        "name": "Pet-Safe Paper Confetti Pack",
        "description": "Biodegradable paper confetti in paw and bone shapes. Safe if your pup eats a piece! Great for photos and celebrations. 100g pack.",
        "category": "celebration_addons",
        "subcategory": "confetti",
        "price": 199.0,
        "mrp": 279.0,
        "prompt": "Product photo of colorful paper confetti in paw and bone shapes, biodegradable pet safe confetti pack, scattered confetti pieces, white background, commercial product photography",
        "tags": ["confetti", "pet-safe", "biodegradable", "paw-shape", "decoration"]
    },
    {
        "name": "Table Decoration Set",
        "description": "Complete table decor for your dog's party! Includes: paw print tablecloth, 8 plates, 8 cups, 8 napkins, centerpiece topper. Serves 8 guests.",
        "category": "celebration_addons",
        "subcategory": "table-decor",
        "price": 599.0,
        "mrp": 749.0,
        "prompt": "Product photo of dog party table decoration set, paw print tablecloth plates cups and napkins, pet birthday party supplies, colorful tableware, white background, flat lay",
        "tags": ["tableware", "plates", "cups", "tablecloth", "party-set"]
    },
    
    # BUNDLES
    {
        "name": "Complete Paw-ty Bundle",
        "description": "Everything you need for the ultimate dog birthday party! Includes: party hat, bow tie, banner, balloon set (20 pcs), confetti pack, and photo props. Worth ₹2000+ separately!",
        "category": "party_kits",
        "subcategory": "bundles",
        "price": 1499.0,
        "mrp": 1999.0,
        "prompt": "Product photo of complete dog birthday party bundle, party hat bow tie banner balloons confetti and props laid out together, ultimate pet celebration kit, white background, commercial flat lay photography",
        "tags": ["bundle", "complete-set", "value-pack", "all-in-one", "birthday"]
    },
    {
        "name": "Deluxe Photo Session Kit",
        "description": "Premium photo props collection for amazing birthday shots! Includes: 2 crowns, 3 bow ties, backdrop, confetti, 'Birthday Star' sash, and photo frame prop.",
        "category": "party_kits",
        "subcategory": "bundles",
        "price": 1299.0,
        "mrp": 1699.0,
        "prompt": "Product photo of deluxe dog photo session kit, crowns bow ties backdrop confetti and sash for pet photography, premium party props collection, white background, styled flat lay",
        "tags": ["photo-kit", "premium", "props", "backdrop", "professional"]
    }
]


async def generate_image_with_emergent(prompt: str) -> bytes:
    """Generate image using Emergent's GPT Image integration"""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        emergent_key = os.environ.get('EMERGENT_LLM_KEY') or os.environ.get('EMERGENT_MODEL_API_KEY')
        if not emergent_key:
            logger.error("EMERGENT_LLM_KEY not found in environment")
            return None
            
        image_gen = OpenAIImageGeneration(api_key=emergent_key)
        
        # Generate image with GPT Image 1
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if images and len(images) > 0:
            logger.info(f"  ✓ Image generated successfully")
            return images[0]
            
    except Exception as e:
        logger.error(f"Error generating image: {e}")
    return None


def upload_bytes_to_cloudinary(image_bytes: bytes, product_id: str) -> str:
    """Upload image bytes to Cloudinary"""
    try:
        # Convert bytes to base64 data URI
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        data_uri = f"data:image/png;base64,{image_base64}"
        
        result = cloudinary.uploader.upload(
            data_uri,
            folder="celebrate_party_products",
            public_id=f"party_{product_id}",
            overwrite=True,
            resource_type="image"
        )
        return result.get('secure_url')
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        return None


async def generate_product_image(product: dict, product_id: str) -> str:
    """Generate AI image for a product and upload to Cloudinary"""
    name = product.get('name', 'party product')
    prompt = product.get('prompt', f"Professional product photo of {name}, white background, isolated, commercial photography")
    
    logger.info(f"Generating image for: {name}")
    
    # Generate
    image_bytes = await generate_image_with_emergent(prompt)
    
    if image_bytes:
        # Upload to Cloudinary
        cloudinary_url = upload_bytes_to_cloudinary(image_bytes, product_id)
        if cloudinary_url:
            logger.info(f"  ✓ Uploaded to Cloudinary: {cloudinary_url[:60]}...")
            return cloudinary_url
        else:
            logger.warning(f"  ✗ Failed to upload {name} to Cloudinary")
    else:
        logger.warning(f"  ✗ Failed to generate image for {name}")
    
    return None


def create_product_document(product: dict, product_id: str, image_url: str) -> dict:
    """Create a complete product document for MongoDB"""
    now = datetime.now(timezone.utc).isoformat()
    
    return {
        "id": product_id,
        "name": product["name"],
        "product_name": product["name"],
        "display_name": product["name"],
        "description": product["description"],
        "short_description": product["description"][:100] + "..." if len(product["description"]) > 100 else product["description"],
        "sku": f"PARTY-{secrets.token_hex(4).upper()}",
        
        # Pricing
        "price": product["price"],
        "mrp": product["mrp"],
        "base_price": product["price"],
        "pricing": {
            "base_price": product["price"],
            "mrp": product["mrp"],
            "selling_price": product["price"],
            "cost_price": product["price"] * 0.5,
            "gst_rate": 18,
            "currency": "INR"
        },
        
        # Categorization
        "category": product["category"],
        "subcategory": product["subcategory"],
        "product_type": "physical",
        "brand": "The Doggy Company",
        
        # Pillar mapping - CELEBRATE is primary!
        "primary_pillar": "celebrate",
        "pillars": ["celebrate", "shop"],
        
        # Tags
        "tags": product["tags"] + ["party", "celebration", "generic", "all-breeds"],
        
        # Media - AI Generated
        "image_url": image_url,
        "images": [image_url],
        "thumbnail": image_url,
        "ai_image_generated": True,
        "ai_image_prompt": product["prompt"],
        
        # Suitability - GENERIC for ALL breeds
        "suitability": {
            "pet_filters": {
                "species": ["dog"],
                "life_stages": ["all"],
                "size_options": ["XS", "S", "M", "L", "XL"],
                "breed_applicability": "all",
                "applicable_breeds": []
            }
        },
        "is_breed_specific": False,
        "is_generic": True,
        
        # Occasions
        "occasions": ["birthday", "gotcha_day", "party", "celebration"],
        
        # Mira visibility
        "mira_visibility": {
            "can_reference": True,
            "can_suggest_proactively": True
        },
        "mira_hint": f"Generic party item suitable for all dogs! {product['name']} is perfect for any dog's birthday or celebration.",
        
        # Inventory
        "in_stock": True,
        "inventory": {
            "inventory_status": "in_stock",
            "track_inventory": True,
            "stock_quantity": 50,
            "low_stock_threshold": 10
        },
        
        # Fulfillment
        "is_pan_india": True,
        "shipping": {
            "delivery_type": "ship",
            "is_pan_india": True
        },
        
        # Visibility
        "visibility": {
            "status": "active",
            "visible_on_site": True
        },
        "status": "active",
        
        # Source tracking
        "source": "party_accessory_generator",
        "is_celebration_item": True,
        "is_party_item": True,
        
        # Timestamps
        "created_at": now,
        "updated_at": now,
        "image_generated_at": now
    }


async def main():
    """Main function to generate all party & accessory products"""
    logger.info("=" * 70)
    logger.info("PARTY & ACCESSORY PRODUCT IMAGE GENERATOR")
    logger.info("=" * 70)
    logger.info(f"Products to create: {len(PARTY_PRODUCTS)}")
    logger.info(f"Target collection: products_master")
    logger.info("=" * 70)
    
    success_count = 0
    skipped_count = 0
    failed_count = 0
    
    for i, product in enumerate(PARTY_PRODUCTS, 1):
        logger.info(f"\n[{i}/{len(PARTY_PRODUCTS)}] Processing: {product['name']}")
        
        # Check if product already exists
        existing = db.products_master.find_one({"name": product["name"], "is_party_item": True})
        if existing:
            logger.info(f"  → Already exists, skipping")
            skipped_count += 1
            continue
        
        # Generate unique ID
        product_id = f"party-{product['subcategory']}-{secrets.token_hex(4)}"
        
        # Generate AI image
        image_url = await generate_product_image(product, product_id)
        
        if image_url:
            # Create product document
            doc = create_product_document(product, product_id, image_url)
            
            # Insert into database
            db.products_master.insert_one(doc)
            logger.info(f"  ✓ Saved to products_master")
            success_count += 1
        else:
            logger.warning(f"  ✗ Failed to generate image, skipping product")
            failed_count += 1
        
        # Delay between API calls to avoid rate limiting
        await asyncio.sleep(3)
    
    # Summary
    logger.info("\n" + "=" * 70)
    logger.info("GENERATION COMPLETE!")
    logger.info("=" * 70)
    logger.info(f"  ✓ Created:  {success_count}")
    logger.info(f"  → Skipped:  {skipped_count}")
    logger.info(f"  ✗ Failed:   {failed_count}")
    logger.info("=" * 70)
    
    # Verify counts
    total_master = db.products_master.count_documents({})
    party_items = db.products_master.count_documents({"is_party_item": True})
    party_category = db.products_master.count_documents({"category": "party_accessories"})
    party_kits = db.products_master.count_documents({"category": "party_kits"})
    celebration_addons = db.products_master.count_documents({"category": "celebration_addons"})
    
    logger.info(f"\nDATABASE STATS:")
    logger.info(f"  Total products in master:  {total_master}")
    logger.info(f"  Party items (is_party_item): {party_items}")
    logger.info(f"  Category 'party_accessories': {party_category}")
    logger.info(f"  Category 'party_kits':        {party_kits}")
    logger.info(f"  Category 'celebration_addons': {celebration_addons}")
    
    # Show created products
    logger.info(f"\nNEWLY CREATED PRODUCTS:")
    new_products = list(db.products_master.find(
        {"is_party_item": True, "source": "party_accessory_generator"},
        {"name": 1, "price": 1, "category": 1, "image_url": 1, "_id": 0}
    ).limit(20))
    
    for p in new_products:
        logger.info(f"  - {p['name']} | ₹{p['price']} | {p['category']}")
    
    client.close()
    return success_count


if __name__ == "__main__":
    asyncio.run(main())

"""
AI Image Generation Service
Generates AI images for products and services and uploads to Cloudinary
Runs in background with progress tracking
"""

import os
import asyncio
import logging
import httpx
import cloudinary
import cloudinary.uploader
from datetime import datetime, timezone
from typing import Optional, Dict, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Router
ai_image_router = APIRouter(prefix="/api/ai-images", tags=["AI Image Generation"])

# Database reference
db = None

def set_db(database):
    global db
    db = database

# Progress tracking
generation_status = {
    "running": False,
    "type": None,  # "products" or "services"
    "total": 0,
    "completed": 0,
    "failed": 0,
    "current_item": None,
    "pillar": None,
    "started_at": None,
    "last_update": None,
    "results": []
}

# Emergent LLM Key for image generation
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

def is_cloudinary_configured():
    return all([
        os.getenv("CLOUDINARY_CLOUD_NAME"),
        os.getenv("CLOUDINARY_API_KEY"),
        os.getenv("CLOUDINARY_API_SECRET")
    ])


def get_product_image_prompt(product: dict) -> str:
    """Generate a realistic, contextual product photography prompt — NEVER generic Unsplash stock"""
    name = (product.get("name") or product.get("title") or "")
    name_lower = name.lower()
    category = (product.get("category") or "").lower()
    pillar = (product.get("pillar") or "").lower()

    # ── SOUL MADE™ BREED PRODUCTS — category starts with "breed-" ───────────
    # These are personalised merchandise with a watercolour breed illustration printed on them.
    # The breed name is stored in product.breed (e.g. "indie", "labrador", "golden retriever")
    if category.startswith("breed-"):
        breed_raw   = (product.get("breed") or "indie dog").strip()
        breed_full  = breed_raw.replace("-", " ").title()
        soul_style  = (
            "professional product photography, clean white studio background, "
            "photorealistic product mockup, sharp focus, commercial quality, 4K, "
            f"beautiful watercolour illustration of a {breed_full} dog (expressive eyes, "
            f"warm coat colours true to breed, friendly and soulful expression) "
            "printed on the product surface, high-quality print visible, detailed breed likeness"
        )
        # Map category suffix → product-specific prompt
        cat_suffix = category.replace("breed-", "").replace("_", " ")
        breed_prompts = {
            "mugs":             f"White ceramic coffee mug with a beautiful watercolour {breed_full} portrait on it, warm golden handle, steam rising, cozy morning light, {soul_style}",
            "mug":              f"White ceramic coffee mug with a beautiful watercolour {breed_full} portrait on it, warm golden handle, {soul_style}",
            "bandanas":         f"Soft cotton dog triangle bandana laid flat showing a watercolour {breed_full} portrait in the centre, warm earthy tones, {soul_style}",
            "frames":           f"Elegant wooden picture frame displayed on a shelf containing a watercolour {breed_full} portrait, warm ambient light, {soul_style}",
            "keychains":        f"Metal keychain charm with a laser-etched watercolour {breed_full} silhouette, photographed on white marble, {soul_style}",
            "party hats":       f"Conical dog birthday party hat with watercolour {breed_full} illustration and gold confetti, festive styling, {soul_style}",
            "party_hats":       f"Conical dog birthday party hat with watercolour {breed_full} illustration and gold confetti, festive styling, {soul_style}",
            "cake toppers":     f"Acrylic birthday cake topper with watercolour {breed_full} silhouette, gold and ivory accents, clean background, {soul_style}",
            "cake-toppers":     f"Acrylic birthday cake topper with watercolour {breed_full} silhouette, gold and ivory accents, clean background, {soul_style}",
            "playdate cards":   f"Beautifully designed playdate invitation card featuring a watercolour {breed_full} portrait, printed on premium textured card stock, {soul_style}",
            "playdate_cards":   f"Beautifully designed playdate invitation card featuring a watercolour {breed_full} portrait, printed on premium textured card stock, {soul_style}",
            "towels":           f"Soft microfibre pet towel neatly folded showing watercolour {breed_full} illustration embroidered/printed on it, {soul_style}",
            "pet_towels":       f"Soft microfibre pet towel neatly folded showing watercolour {breed_full} illustration printed on it, {soul_style}",
            "robes":            f"Plush dog bathrobe hanging on a hook with watercolour {breed_full} monogram embroidery, luxury spa aesthetic, {soul_style}",
            "pet_robes":        f"Plush dog bathrobe hanging on a hook with watercolour {breed_full} illustration embroidered, luxury aesthetic, {soul_style}",
            "treat pouches":    f"Canvas dog treat pouch with watercolour {breed_full} illustration printed on front panel, training accessory, {soul_style}",
            "treat_pouchs":     f"Canvas dog treat pouch with watercolour {breed_full} illustration printed on front panel, training accessory, {soul_style}",
            "carrier tags":     f"Premium leather carrier tag with watercolour {breed_full} silhouette embossed, luggage tag style, {soul_style}",
            "carrier_tags":     f"Premium leather carrier tag with watercolour {breed_full} silhouette embossed, luggage tag style, {soul_style}",
            "collar tags":      f"Circular metal collar tag engraved with watercolour-style {breed_full} illustration, hanging on a leather collar close-up, {soul_style}",
            "collar_tags":      f"Circular metal collar tag engraved with watercolour-style {breed_full} illustration, hanging on a leather collar, {soul_style}",
            "play bandanas":    f"Soft cotton bandana with watercolour {breed_full} portrait, styled for outdoor adventure, {soul_style}",
            "memorial ornaments": f"Ceramic memorial ornament with a hand-painted watercolour {breed_full} portrait, soft warm lighting, tribute aesthetic, {soul_style}",
            "memorial_ornaments": f"Ceramic memorial ornament with a hand-painted watercolour {breed_full} portrait, soft warm lighting, tribute aesthetic, {soul_style}",
            "paw print frames": f"Shadow-box frame containing an actual paw print with watercolour {breed_full} portrait, memorial keepsake, {soul_style}",
            "paw_print_frames": f"Shadow-box frame containing an actual paw print with watercolour {breed_full} portrait, memorial keepsake, {soul_style}",
            "memory boxes":     f"Lacquered wooden memory box with watercolour {breed_full} portrait on the lid, keepsake chest, {soul_style}",
            "memory_boxes":     f"Lacquered wooden memory box with watercolour {breed_full} portrait on the lid, keepsake chest, {soul_style}",
            "emergency cards":  f"Wallet-sized emergency card with watercolour {breed_full} ID portrait and contact details layout, {soul_style}",
            "emergency_cards":  f"Wallet-sized emergency card with watercolour {breed_full} ID portrait and contact details layout, {soul_style}",
            "medical alert tags": f"Medical alert collar tag with watercolour {breed_full} silhouette and red cross emblem, {soul_style}",
            "medical_alert_tags": f"Medical alert collar tag with watercolour {breed_full} silhouette and red cross emblem, {soul_style}",
            "passports":        f"Premium pet passport booklet with watercolour {breed_full} portrait on the cover, official-looking with gold emboss, {soul_style}",
            "phone_cases":      f"Slim phone case with a vibrant watercolour {breed_full} portrait printed on the back, lifestyle flat-lay, {soul_style}",
        }
        # Look up by cleaned suffix
        matched_prompt = breed_prompts.get(cat_suffix)
        if matched_prompt:
            return matched_prompt
        # Fallback for unknown breed-* category
        return f"Premium personalised pet product '{name}' featuring a beautiful watercolour {breed_full} illustration, {soul_style}"

    style = "clean white background, professional product photography, sharp focus, photorealistic, high detail, commercial quality, 4K"
    
    # ── DINE PILLAR: Food products ──────────────────────────────────────────
    if pillar == "dine" or category in ["daily meals", "treats & rewards", "supplements", "frozen & fresh", "homemade & recipes"]:
        
        if any(x in name_lower for x in ["biscuit", "cookie", "bone"]):
            return f"Homemade dog biscuits beautifully arranged on a rustic wooden board, natural golden-brown colour, shaped like bones and paws, '{name}', {style}"
        if any(x in name_lower for x in ["birthday cake", "birthday treat", "cupcake", "paw print"]):
            return f"Beautiful dog-safe birthday cake with natural frosting, decorated with dog bone shapes and a single candle, '{name}', celebratory, warm kitchen background, {style}"
        if any(x in name_lower for x in ["salmon"]):
            return f"Fresh premium salmon fillet pieces on a slate board, with herbs, for dog food, appetizing natural presentation, '{name}', {style}"
        if any(x in name_lower for x in ["chicken", "rice"]):
            return f"Freshly cooked chicken and rice in a premium dog bowl, wholesome meal presentation, natural ingredients visible, '{name}', {style}"
        if any(x in name_lower for x in ["lamb", "stew"]):
            return f"Hearty slow-cooked lamb and vegetable stew in a ceramic bowl, rich natural colours, healthy dog meal, '{name}', {style}"
        if any(x in name_lower for x in ["peanut butter"]):
            return f"Natural peanut butter in a small jar with dog treats, warm golden tones, '{name}', {style}"
        if any(x in name_lower for x in ["liver", "jerky", "freeze"]):
            return f"Freeze-dried liver training treats scattered on a slate surface, rich brown colour, high-value reward treats, '{name}', {style}"
        if any(x in name_lower for x in ["veggie", "vegetable", "carrot"]):
            return f"Colourful dog-safe vegetable chews arranged neatly, fresh carrot, sweet potato and pumpkin, natural wholesome look, '{name}', {style}"
        if any(x in name_lower for x in ["supplement", "vitamin", "probiotic", "omega", "glucosamine", "enzyme", "mushroom", "turmeric", "coconut oil", "elm"]):
            return f"Premium pet supplement in a clean minimalist amber glass bottle with label, '{name}', natural wellness product, {style}"
        if any(x in name_lower for x in ["frozen", "patty", "raw", "mince"]):
            return f"Premium raw frozen dog food patties arranged on a wooden board with fresh ingredients visible, '{name}', {style}"
        if any(x in name_lower for x in ["recipe", "guide", "ingredient pack"]):
            return f"Premium recipe card and fresh ingredients for homemade dog food, flat lay on marble surface, '{name}', artisan food prep, {style}"
        if any(x in name_lower for x in ["meal", "bowl", "dinner", "morning", "evening"]):
            return f"Beautifully plated fresh dog meal in a premium ceramic bowl, wholesome ingredients visible, '{name}', {style}"
        # Generic dine fallback
        return f"Premium dog food product, '{name}', appetizing natural ingredients, beautiful presentation, {style}"
    
    # ── CELEBRATE PILLAR ────────────────────────────────────────────────────
    if pillar == "celebrate" or any(x in name_lower for x in ["birthday", "party", "cake", "celebration"]):
        return f"Festive dog birthday cake with natural pet-safe frosting, colourful decoration, '{name}', celebratory warm background, {style}"
    
    # ── CARE PILLAR ─────────────────────────────────────────────────────────
    if pillar == "care" or any(x in name_lower for x in ["shampoo", "grooming", "brush", "comb", "nail"]):
        return f"Premium dog grooming product, '{name}', professional quality, natural ingredients, clean bathroom counter, {style}"
    
    # ── TRAVEL PILLAR ───────────────────────────────────────────────────────
    if pillar == "travel" or any(x in name_lower for x in ["carrier", "crate", "travel", "portable bowl"]):
        return f"Premium pet travel product, '{name}', durable stylish design, adventure-ready, {style}"
    
    # ── FIT PILLAR ──────────────────────────────────────────────────────────
    if pillar == "fit" or any(x in name_lower for x in ["leash", "harness", "collar", "toy", "ball", "rope"]):
        return f"Premium dog fitness and play product, '{name}', durable colourful design, active lifestyle, {style}"
    
    # ── BED / HOME ──────────────────────────────────────────────────────────
    if any(x in name_lower for x in ["bed", "mat", "blanket", "cushion", "crate"]):
        return f"Luxurious dog bed or comfort product, '{name}', soft premium materials, cozy home setting, {style}"
    
    # ── ACCESSORIES / CLOTHING ──────────────────────────────────────────────
    if any(x in name_lower for x in ["collar", "tag", "bandana", "sweater", "coat", "jacket"]):
        return f"Stylish dog accessory, '{name}', premium quality materials, elegant design, {style}"
    
    # ── SOUL MADE™ FLAT ART MERCHANDISE ────────────────────────────────────
    # These are generic Soul products (no breed) — use watercolour soul-dog illustration
    # matching the same aesthetic as the breed product mockups in admin Soul Box
    product_type = (product.get("product_type") or "").lower()
    if product_type.startswith("flat_art_") or category == "flat_art":
        soul_style = (
            "professional product photography, studio lighting, clean white background, "
            "photorealistic product mockup, watercolour illustration of a happy Indian mixed-breed dog "
            "(warm tan coat, expressive eyes, friendly smile) printed on the product surface, "
            "high quality print, sharp focus, commercial photography"
        )
        flat_type = product_type.replace("flat_art_", "")
        prompts = {
            "mug":        f"White ceramic coffee mug with a beautiful watercolour illustration of a happy Indian mixed-breed dog printed on it, {soul_style}",
            "bowl":       f"Premium ceramic pet food bowl with a watercolour soul-dog illustration on the outer surface, {soul_style}",
            "bandana":    f"Dog triangle bandana laid flat, soft cotton fabric with a watercolour soul-dog portrait printed on it, {soul_style}",
            "tote":       f"Canvas tote bag displayed flat, watercolour soul-dog illustration printed on the front panel, {soul_style}",
            "tote_bag":   f"Canvas tote bag displayed flat, watercolour soul-dog illustration printed on the front panel, {soul_style}",
            "blanket":    f"Soft fleece pet blanket folded neatly on a wooden surface, watercolour soul-dog pattern, {soul_style}",
            "cushion":    f"Square throw cushion with a centred watercolour soul-dog portrait printed on it, {soul_style}",
            "frame":      f"Wooden picture frame with a beautiful watercolour portrait of a soul-dog inside, shelf setting, {soul_style}",
            "keychain":   f"Metal keychain charm with a watercolour soul-dog silhouette, photographed on white surface, {soul_style}",
            "party_hat":  f"Conical birthday party hat for dogs with watercolour soul-dog and confetti illustration, festive, {soul_style}",
            "candle":     f"Frosted glass memorial candle with a watercolour soul-dog illustration on the label, warm glow, {soul_style}",
            "journal":    f"Hardcover journal with watercolour soul-dog artwork on the cover, elegant stationery, {soul_style}",
            "folder":     f"Slim leather passport holder with embossed watercolour soul-dog artwork, travel accessory, {soul_style}",
            "card":       f"Luxury greeting card with hand-painted watercolour soul-dog portrait surrounded by florals, artisan stationery, {soul_style}",
            "treat_jar":  f"Ceramic treat jar with a soul-dog watercolour illustration and 'Treats' lettering, kitchen setting, {soul_style}",
            "mat":        f"Silicone pet feeding mat with watercolour soul-dog paw mandala design, flat-lay view, {soul_style}",
            "cake_topper": f"Acrylic birthday cake toppers with watercolour soul-dog silhouette, gold and ivory accents, {soul_style}",
            "pouch":      f"Velvet zipper pouch with watercolour soul-dog mandala embroidery, luxury feel, {soul_style}",
            "plush":      f"Handcrafted plush stuffed dog toy with watercolour fabric patches, artisan toy, {soul_style}",
            "box":        f"Lacquered keepsake box with watercolour soul-dog botanical artwork on the lid, heirloom quality, {soul_style}",
        }
        return prompts.get(flat_type, f"Premium Soul Made™ product '{name}' with watercolour soul-dog illustration, {soul_style}")

    # ── DEFAULT ─────────────────────────────────────────────────────────────
    return f"Premium pet product '{name}', high quality, beautiful packaging and presentation, {style}"


def get_bundle_image_prompt(bundle: dict) -> str:
    """Generate a watercolor illustration prompt for a bundle - GOLDEN RULE: Bundles = Watercolor Illustrated Compositions"""
    name = (bundle.get("name") or "").lower()
    pillar = (bundle.get("pillar") or bundle.get("care_type") or "").lower()
    
    base_style = "soft watercolor illustrated composition, warm pastel colors, gentle brushstrokes, elegant arrangement of pet care items, artistic illustration style, whimsical and playful, cream or soft white background"
    
    if "grooming" in name or "grooming" in pillar:
        return f"Watercolor illustration composition of pet grooming items: soft brushes, gentle shampoo bottles, fluffy towel, with a happy calm dog silhouette, {bundle.get('name')}, {base_style}"
    
    if "vet" in name or "clinic" in name or "health" in pillar:
        return f"Watercolor illustration composition of pet health items: gentle first aid kit, calming treats, soft carrier blanket, with caring veterinary symbols, {bundle.get('name')}, {base_style}"
    
    if "boarding" in name or "daycare" in name:
        return f"Watercolor illustration composition of pet boarding essentials: cozy bed, favorite toy, comfort blanket, food bowl, {bundle.get('name')}, {base_style}"
    
    if "puppy" in name or "starter" in name:
        return f"Watercolor illustration composition of puppy starter items: tiny collar, soft toys, training treats, puppy bed, {bundle.get('name')}, {base_style}"
    
    if "senior" in name or "comfort" in name:
        return f"Watercolor illustration composition of senior dog comfort items: orthopedic bed, gentle supplements, soft blanket, {bundle.get('name')}, {base_style}"
    
    if "recovery" in name or "support" in name:
        return f"Watercolor illustration composition of pet recovery items: soft cone alternative, healing treats, comfort mat, {bundle.get('name')}, {base_style}"
    
    if "coat" in name or "shed" in name or "brush" in name:
        return f"Watercolor illustration composition of coat care items: de-shedding tools, conditioning sprays, gentle brushes, {bundle.get('name')}, {base_style}"
    
    # Default bundle illustration
    return f"Watercolor illustrated composition of premium pet care bundle items arranged artistically, {bundle.get('name')}, soft pastel colors, gentle brushstrokes, whimsical pet care collection, {base_style}"


def get_service_image_prompt(service: dict) -> str:
    """Generate a watercolor illustration prompt for a service"""
    name = (service.get("name") or "").lower()
    pillar = (service.get("pillar") or "").lower()
    
    base_style = "soft watercolor illustration, warm pastel colors, gentle brushstrokes, elegant and playful, minimal background, artistic pet illustration style"
    
    if pillar == "care" or any(x in name for x in ["vet", "health", "medical", "grooming"]):
        return f"Watercolor illustration of a happy dog being groomed or at vet, {service.get('name')}, caring hands, {base_style}"
    
    if pillar == "learn" or any(x in name for x in ["training", "class", "lesson"]):
        return f"Watercolor illustration of a dog learning or training, {service.get('name')}, attentive pose, treats, {base_style}"
    
    if pillar == "stay" or any(x in name for x in ["boarding", "hotel", "daycare"]):
        return f"Watercolor illustration of a cozy dog in a comfortable pet hotel, {service.get('name')}, relaxed happy dog, {base_style}"
    
    if pillar == "travel" or any(x in name for x in ["travel", "transport", "trip"]):
        return f"Watercolor illustration of a dog traveling, {service.get('name')}, adventure mood, {base_style}"
    
    if pillar == "celebrate" or any(x in name for x in ["party", "birthday", "celebration"]):
        return f"Watercolor illustration of a dog at a birthday party, {service.get('name')}, festive balloons and cake, {base_style}"
    
    if pillar == "fit" or any(x in name for x in ["fitness", "exercise", "walk"]):
        return f"Watercolor illustration of an active happy dog exercising, {service.get('name')}, energetic pose, {base_style}"
    
    if pillar == "dine" or any(x in name for x in ["food", "meal", "restaurant"]):
        return f"Watercolor illustration of a dog enjoying a meal, {service.get('name')}, delicious food bowl, {base_style}"
    
    if pillar == "emergency" or any(x in name for x in ["emergency", "urgent"]):
        return f"Watercolor illustration of caring veterinary assistance, {service.get('name')}, gentle and reassuring, {base_style}"
    
    if pillar == "farewell" or any(x in name for x in ["memorial", "farewell"]):
        return f"Watercolor illustration of a peaceful rainbow bridge scene, {service.get('name')}, gentle and serene, {base_style}"
    
    if pillar == "adopt" or any(x in name for x in ["adopt", "rescue"]):
        return f"Watercolor illustration of a hopeful dog finding a home, {service.get('name')}, heartwarming, {base_style}"
    
    # Default service illustration
    return f"Watercolor illustration of a happy dog receiving pet service, {service.get('name')}, professional and caring, {base_style}"


async def generate_ai_image(prompt: str) -> Optional[str]:
    """Generate an image using Emergent's AI image generation and upload to Cloudinary"""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        import base64
        
        if not EMERGENT_LLM_KEY:
            logger.error("EMERGENT_LLM_KEY not configured")
            return None
        
        # Generate image using OpenAI gpt-image-1
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_LLM_KEY)
        images = await image_gen.generate_images(
            prompt=prompt,
            number_of_images=1,
            model="gpt-image-1"
        )
        
        if not images or len(images) == 0:
            logger.error("No images generated")
            return None
        
        # Convert bytes to base64 for Cloudinary upload
        image_base64 = base64.b64encode(images[0]).decode('utf-8')
        image_data_url = f"data:image/png;base64,{image_base64}"
        
        # Upload to Cloudinary — run in executor so sync call never blocks event loop
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET")
        )
        
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        public_id = f"doggy/ai_generated/{timestamp}"
        
        def _upload():
            return cloudinary.uploader.upload(
                image_data_url,
                public_id=public_id,
                overwrite=True,
                resource_type="image",
                format="webp",
                quality="auto:good"
            )
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, _upload)
        
        return result.get("secure_url")
        
    except Exception as e:
        logger.error(f"AI image generation failed: {str(e)}")
        return None


async def upload_to_cloudinary(image_url: str, item_id: str, item_type: str, pillar: str = "general") -> Optional[str]:
    """Upload image from URL to Cloudinary"""
    if not is_cloudinary_configured():
        return None
    
    try:
        clean_pillar = pillar.lower().replace(" ", "_")[:30] if pillar else "general"
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        public_id = f"doggy/{item_type}/{clean_pillar}/{item_id}_{timestamp}"
        
        result = cloudinary.uploader.upload(
            image_url,
            public_id=public_id,
            overwrite=True,
            resource_type="image",
            format="webp",
            quality="auto:good",
            transformation=[
                {"width": 1000, "height": 1000, "crop": "limit"},
                {"quality": "auto:good"}
            ]
        )
        
        return result.get("secure_url")
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {str(e)}")
        return None


async def process_products_batch(pillar: Optional[str] = None):
    """Process products without images in background — queries products_master (SSOT)"""
    global generation_status
    
    if db is None:
        logger.error("Database not connected")
        return
    
    try:
        # Products needing AI images: missing cloudinary_url OR image_url, or using Unsplash
        no_image_condition = {
            "$or": [
                {"cloudinary_url": {"$exists": False}},
                {"cloudinary_url": None},
                {"cloudinary_url": ""},
                {"image_url": {"$exists": False}},
                {"image_url": None},
                {"image_url": ""},
                {"image_url": {"$regex": "unsplash", "$options": "i"}},
            ]
        }
        
        # Never touch products that already have a Shopify-synced original image
        query = {"$and": [no_image_condition, {"is_active": True}, {"cloudinary_image_url": {"$in": [None, ""]}}]}
        
        if pillar:
            query = {
                "$and": [
                    no_image_condition,
                    {"is_active": True},
                    {"$or": [
                        {"pillar": pillar},
                        {"pillars": pillar},
                        {"primary_pillar": pillar}
                    ]}
                ]
            }
        
        # Query products_master — this is the SSOT for all products
        # Sort: breed-* products first (priority for Soul Made™ catalogue completeness)
        all_products = await db.products_master.find(query, {"_id": 0}).to_list(length=3000)
        
        # Partition: breed-specific first, then everything else
        breed_products = [p for p in all_products if (p.get("category") or "").lower().startswith("breed-")]
        other_products = [p for p in all_products if not (p.get("category") or "").lower().startswith("breed-")]
        products = breed_products + other_products
        
        # Skip legacy products collection — products_master is the SSOT
        
        generation_status["total"] = len(products)
        generation_status["type"] = "products"
        generation_status["pillar"] = pillar
        
        for idx, product in enumerate(products):
            if not generation_status["running"]:
                break
            
            product_id = product.get("id")
            product_name = product.get("name", "Unknown")
            
            generation_status["current_item"] = product_name
            generation_status["completed"] = idx
            generation_status["last_update"] = datetime.now(timezone.utc).isoformat()
            
            try:
                # Generate prompt and image (uploads to Cloudinary automatically)
                prompt = get_product_image_prompt(product)
                cloudinary_url = await generate_ai_image(prompt)
                
                if cloudinary_url:
                    # Update in products_master — set cloudinary_url, image_url, mockup_url, image
                    update_result = await db.products_master.update_one(
                        {"id": product_id},
                        {
                            "$set": {
                                "cloudinary_url": cloudinary_url,
                                "mockup_url": cloudinary_url,
                                "image_url": cloudinary_url,
                                "image": cloudinary_url,
                                "images": [cloudinary_url],
                                "ai_generated_image": True,
                                "needs_image_generation": False,
                                "image_updated_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    if update_result.matched_count == 0:
                        # Fallback: update legacy products collection
                        await db.products.update_one(
                            {"id": product_id},
                            {
                                "$set": {
                                    "image_url": cloudinary_url,
                                    "image": cloudinary_url,
                                    "images": [cloudinary_url],
                                    "ai_generated_image": True,
                                    "image_updated_at": datetime.now(timezone.utc).isoformat()
                                }
                            }
                        )
                    
                    generation_status["results"].append({
                        "id": product_id,
                        "name": product_name,
                        "status": "success",
                        "url": cloudinary_url
                    })
                    logger.info(f"Generated image for product: {product_name}")
                else:
                    generation_status["failed"] += 1
                    logger.warning(f"Failed to generate image for: {product_name}")
                    
            except Exception as e:
                logger.error(f"Failed to process product {product_id}: {str(e)}")
                generation_status["failed"] += 1
            
            # Small delay to avoid rate limits
            await asyncio.sleep(3)
        
        generation_status["completed"] = len(products)
        
    except Exception as e:
        logger.error(f"Product batch processing failed: {str(e)}")
    finally:
        generation_status["running"] = False


async def process_bundles_batch(pillar: Optional[str] = None, force_regenerate: bool = False):
    """Process bundles with stock photos, replacing with watercolor illustrations - GOLDEN RULE: Bundles = Watercolor"""
    global generation_status
    
    if db is None:
        logger.error("Database not connected")
        return
    
    try:
        # Build query for bundles with stock photos (Unsplash) or missing images
        if force_regenerate:
            # Force regenerate: process ALL bundles with stock images
            query = {
                "$or": [
                    {"image": {"$regex": "unsplash", "$options": "i"}},
                    {"image_url": {"$regex": "unsplash", "$options": "i"}},
                    {"image_url": {"$exists": False}},
                    {"image_url": None},
                    {"image_url": ""},
                    {"image": {"$exists": False}},
                    {"image": None},
                    {"image": ""}
                ]
            }
        else:
            query = {
                "$or": [
                    {"image_url": {"$exists": False}},
                    {"image_url": None},
                    {"image_url": ""},
                    {"image": {"$exists": False}},
                    {"image": None},
                    {"image": ""}
                ]
            }
        
        if pillar:
            query["$and"] = [{"$or": [{"pillar": pillar}, {"care_type": pillar}]}]
        
        # Get bundles from multiple collections - including pillar-specific bundles and product_bundles
        bundles = []
        bundle_collections = ["bundles", "care_bundles", "celebrate_bundles", "fit_bundles", "stay_bundles", "travel_bundles", "dine_bundles", "adopt_bundles", "farewell_bundles", "advisory_bundles", "product_bundles"]
        for collection_name in bundle_collections:
            try:
                collection = db[collection_name]
                items = await collection.find(query, {"_id": 0}).to_list(length=100)
                for item in items:
                    item["_collection"] = collection_name
                bundles.extend(items)
            except Exception as e:
                logger.warning(f"Could not query {collection_name}: {e}")
        
        generation_status["total"] = len(bundles)
        generation_status["type"] = "bundles"
        generation_status["pillar"] = pillar
        
        for idx, bundle in enumerate(bundles):
            if not generation_status["running"]:
                break
            
            bundle_id = bundle.get("id")
            bundle_name = bundle.get("name", "Unknown")
            collection_name = bundle.get("_collection", "bundles")
            
            generation_status["current_item"] = bundle_name
            generation_status["completed"] = idx
            generation_status["last_update"] = datetime.now(timezone.utc).isoformat()
            
            try:
                # Generate watercolor prompt and image
                prompt = get_bundle_image_prompt(bundle)
                cloudinary_url = await generate_ai_image(prompt)
                
                if cloudinary_url:
                    # Update bundle in database
                    await db[collection_name].update_one(
                        {"id": bundle_id},
                        {
                            "$set": {
                                "image_url": cloudinary_url,
                                "image": cloudinary_url,
                                "watercolor_image": cloudinary_url,
                                "ai_generated_image": True,
                                "image_style": "watercolor",
                                "image_updated_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    
                    generation_status["results"].append({
                        "id": bundle_id,
                        "name": bundle_name,
                        "collection": collection_name,
                        "status": "success",
                        "url": cloudinary_url
                    })
                    logger.info(f"Generated watercolor for bundle: {bundle_name}")
                else:
                    generation_status["failed"] += 1
                    logger.warning(f"Failed to generate watercolor for bundle: {bundle_name}")
                    
            except Exception as e:
                logger.error(f"Failed to process bundle {bundle_id}: {str(e)}")
                generation_status["failed"] += 1
            
            # Small delay to avoid rate limits
            await asyncio.sleep(3)
        
        generation_status["completed"] = len(bundles)
        
    except Exception as e:
        logger.error(f"Bundle batch processing failed: {str(e)}")
    finally:
        generation_status["running"] = False


async def process_services_batch(pillar: Optional[str] = None):
    """Process services without watercolor illustrations in background"""
    global generation_status
    
    if db is None:
        logger.error("Database not connected")
        return
    
    try:
        # Build query for services without images
        query = {
            "$or": [
                {"image_url": {"$exists": False}},
                {"image_url": None},
                {"image_url": ""},
                {"watercolor_image": {"$exists": False}}
            ]
        }
        
        if pillar:
            query["pillar"] = pillar
        
        # Get services
        services = await db.services.find(query, {"_id": 0}).to_list(length=200)
        
        generation_status["total"] = len(services)
        generation_status["type"] = "services"
        generation_status["pillar"] = pillar
        
        for idx, service in enumerate(services):
            if not generation_status["running"]:
                break
            
            service_id = service.get("id")
            service_name = service.get("name", "Unknown")
            
            generation_status["current_item"] = service_name
            generation_status["completed"] = idx
            generation_status["last_update"] = datetime.now(timezone.utc).isoformat()
            
            try:
                # Generate watercolor prompt and image
                prompt = get_service_image_prompt(service)
                cloudinary_url = await generate_ai_image(prompt)
                
                if cloudinary_url:
                    # Update service in database
                    await db.services.update_one(
                        {"id": service_id},
                        {
                            "$set": {
                                "image_url": cloudinary_url,
                                "watercolor_image": cloudinary_url,
                                "ai_generated_image": True,
                                "image_updated_at": datetime.now(timezone.utc).isoformat()
                            }
                        }
                    )
                    
                    generation_status["results"].append({
                        "id": service_id,
                        "name": service_name,
                        "status": "success",
                        "url": cloudinary_url
                    })
                    logger.info(f"Generated watercolor for service: {service_name}")
                else:
                    generation_status["failed"] += 1
                    logger.warning(f"Failed to generate watercolor for: {service_name}")
                    
            except Exception as e:
                logger.error(f"Failed to process service {service_id}: {str(e)}")
                generation_status["failed"] += 1
            
            # Small delay to avoid rate limits
            await asyncio.sleep(3)
        
        generation_status["completed"] = len(services)
        
    except Exception as e:
        logger.error(f"Service batch processing failed: {str(e)}")
    finally:
        generation_status["running"] = False


# ===== API ENDPOINTS =====

@ai_image_router.get("/status")
async def get_generation_status():
    """Get current AI image generation status"""
    return {
        "running": generation_status["running"],
        "type": generation_status["type"],
        "pillar": generation_status["pillar"],
        "total": generation_status["total"],
        "completed": generation_status["completed"],
        "failed": generation_status["failed"],
        "current_item": generation_status["current_item"],
        "progress": round((generation_status["completed"] / generation_status["total"] * 100) if generation_status["total"] > 0 else 0, 1),
        "started_at": generation_status["started_at"],
        "last_update": generation_status["last_update"],
        "recent_results": generation_status["results"][-10:] if generation_status["results"] else []
    }


@ai_image_router.post("/generate-product-images")
async def start_product_image_generation(
    background_tasks: BackgroundTasks,
    pillar: Optional[str] = None
):
    """Start background AI image generation for products without images"""
    global generation_status
    
    if generation_status["running"]:
        raise HTTPException(status_code=400, detail="Generation already in progress")
    
    # Reset status
    generation_status = {
        "running": True,
        "type": "products",
        "pillar": pillar,
        "total": 0,
        "completed": 0,
        "failed": 0,
        "current_item": None,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "last_update": None,
        "results": []
    }
    
    # Start background task
    background_tasks.add_task(process_products_batch, pillar)
    
    return {
        "message": "Product image generation started",
        "pillar": pillar or "all",
        "status": "running"
    }


@ai_image_router.post("/generate-service-images")
async def start_service_image_generation(
    background_tasks: BackgroundTasks,
    pillar: Optional[str] = None
):
    """Start background watercolor illustration generation for services"""
    global generation_status
    
    if generation_status["running"]:
        raise HTTPException(status_code=400, detail="Generation already in progress")
    
    # Reset status
    generation_status = {
        "running": True,
        "type": "services",
        "pillar": pillar,
        "total": 0,
        "completed": 0,
        "failed": 0,
        "current_item": None,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "last_update": None,
        "results": []
    }
    
    # Start background task
    background_tasks.add_task(process_services_batch, pillar)
    
    return {
        "message": "Service watercolor generation started",
        "pillar": pillar or "all",
        "status": "running"
    }


@ai_image_router.post("/generate-bundle-images")
async def start_bundle_image_generation(
    background_tasks: BackgroundTasks,
    pillar: Optional[str] = None,
    force_regenerate: bool = False
):
    """Start background watercolor illustration generation for bundles - GOLDEN RULE: Bundles = Watercolor"""
    global generation_status
    
    if generation_status["running"]:
        raise HTTPException(status_code=400, detail="Generation already in progress")
    
    # Reset status
    generation_status = {
        "running": True,
        "type": "bundles",
        "pillar": pillar,
        "total": 0,
        "completed": 0,
        "failed": 0,
        "current_item": None,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "last_update": None,
        "results": []
    }
    
    # Start background task
    background_tasks.add_task(process_bundles_batch, pillar, force_regenerate)
    
    return {
        "message": "Bundle watercolor generation started",
        "pillar": pillar or "all",
        "force_regenerate": force_regenerate,
        "status": "running"
    }


@ai_image_router.post("/stop")
async def stop_generation():
    """Stop the current generation process"""
    global generation_status
    generation_status["running"] = False
    return {"message": "Generation stopped", "final_status": generation_status}


@ai_image_router.post("/auto-resume")
async def auto_resume_generation(background_tasks: BackgroundTasks):
    """
    Auto-resume: Checks products_master for any products still needing AI images
    (no image OR unsplash). Starts generation for ALL pillars in sequence.
    Safe to call multiple times — Cloudinary images are always skipped.
    Designed to be called by any agent at session start to continue incomplete work.
    """
    global generation_status

    if generation_status["running"]:
        return {"status": "already_running", "message": "Generation is already in progress", "current": generation_status}

    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    # Count products still needing generation
    needs_gen_query = {
        "$or": [
            {"image_url": {"$exists": False}},
            {"image_url": {"$in": [None, ""]}},
            {"image_url": {"$regex": "unsplash", "$options": "i"}},
        ]
    }
    needs_count = await db.products_master.count_documents(needs_gen_query)

    if needs_count == 0:
        return {"status": "complete", "message": "All products already have Cloudinary images. Nothing to do.", "needs_generation": 0}

    # Start generation for ALL products (no pillar filter) — skips Cloudinary ones automatically
    generation_status = {
        "running": True,
        "type": "products (auto-resume, all)",
        "pillar": None,
        "total": 0,
        "completed": 0,
        "failed": 0,
        "current_item": "Starting auto-resume...",
        "started_at": datetime.now(timezone.utc).isoformat(),
        "last_update": None,
        "results": [],
    }

    background_tasks.add_task(process_products_batch, None)

    return {
        "status": "running",
        "message": f"Auto-resume started. {needs_count} products queued. Cloudinary images will be skipped.",
        "needs_generation": needs_count,
        "instruction": "Poll GET /api/ai-images/status for progress."
    }


@ai_image_router.post("/generate-pillar-images")
async def start_pillar_image_generation(
    background_tasks: BackgroundTasks,
    pillar: str = "dine",
    force_regenerate: bool = False,
    limit: int = 100,
):
    """
    Generate AI photo-realistic images for products in products_master for a specific pillar.
    Only processes products WITHOUT a cloudinary image (unless force_regenerate=True).
    Saves to Cloudinary and updates products_master.
    """
    global generation_status

    if generation_status["running"]:
        raise HTTPException(status_code=400, detail="Generation already in progress")

    generation_status = {
        "running": True,
        "type": f"pillar-products-{pillar}",
        "pillar": pillar,
        "total": 0,
        "completed": 0,
        "failed": 0,
        "current_item": None,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "last_update": None,
        "results": [],
    }

    async def run():
        global generation_status
        if db is None:
            generation_status["running"] = False
            return

        try:
            query: dict = {"pillar": pillar}
            if not force_regenerate:
                # Only products that do NOT have a cloudinary URL already
                query["$or"] = [
                    {"image_url": {"$exists": False}},
                    {"image_url": None},
                    {"image_url": ""},
                    {"image_url": {"$not": {"$regex": "res.cloudinary.com"}}},
                ]

            products = await db.products_master.find(query, {"_id": 0}).limit(limit).to_list(length=limit)
            generation_status["total"] = len(products)
            logger.info(f"Generating images for {len(products)} {pillar} products in products_master")

            for idx, product in enumerate(products):
                if not generation_status["running"]:
                    break

                pid = product.get("id")
                pname = product.get("name", "Unknown")
                generation_status["current_item"] = pname
                generation_status["completed"] = idx
                generation_status["last_update"] = datetime.now(timezone.utc).isoformat()

                try:
                    prompt = get_product_image_prompt(product)
                    cloudinary_url = await generate_ai_image(prompt)

                    if cloudinary_url:
                        now = datetime.now(timezone.utc).isoformat()
                        await db.products_master.update_one(
                            {"id": pid},
                            {"$set": {
                                "image_url": cloudinary_url,
                                "image": cloudinary_url,
                                "images": [cloudinary_url],
                                "ai_generated_image": True,
                                "image_updated_at": now,
                                "updated_at": now,
                            }}
                        )
                        generation_status["results"].append({"id": pid, "name": pname, "status": "success", "url": cloudinary_url})
                        logger.info(f"[PillarImages] Generated: {pname}")
                    else:
                        generation_status["failed"] += 1
                except Exception as e:
                    logger.error(f"[PillarImages] Failed {pid}: {e}")
                    generation_status["failed"] += 1

                await asyncio.sleep(3)  # Rate limit guard

            generation_status["completed"] = len(products)
        except Exception as e:
            logger.error(f"[PillarImages] Batch error: {e}")
        finally:
            generation_status["running"] = False

    background_tasks.add_task(run)
    return {
        "message": f"Pillar image generation started for '{pillar}'",
        "pillar": pillar,
        "force_regenerate": force_regenerate,
        "limit": limit,
        "status": "running",
    }


@ai_image_router.get("/stats")
async def get_image_stats():
    """Get comprehensive image statistics — queries products_master (SSOT)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Products stats from products_master (SSOT)
    total_products = await db.products_master.count_documents({})
    products_with_cloudinary = await db.products_master.count_documents({
        "image_url": {"$regex": "res.cloudinary.com", "$options": "i"}
    })
    products_with_unsplash = await db.products_master.count_documents({
        "image_url": {"$regex": "unsplash", "$options": "i"}
    })
    products_no_image = await db.products_master.count_documents({
        "$or": [
            {"image_url": {"$exists": False}},
            {"image_url": {"$in": [None, ""]}}
        ]
    })
    products_ai_generated = await db.products_master.count_documents({"ai_generated_image": True})
    # Products that NEED generation = no image OR unsplash (not yet contextual)
    products_needing_generation = products_with_unsplash + products_no_image
    
    # Services stats (unchanged — services collection is correct)
    total_services = await db.services.count_documents({})
    services_with_images = await db.services.count_documents({
        "$or": [
            {"image_url": {"$exists": True, "$nin": [None, ""]}},
            {"watercolor_image": {"$exists": True, "$nin": [None, ""]}}
        ]
    })
    services_ai_generated = await db.services.count_documents({"ai_generated_image": True})
    
    # Per-pillar breakdown from products_master
    pillars = ["celebrate", "dine", "stay", "travel", "care", "enjoy", "fit", "learn", "paperwork", "advisory", "emergency", "farewell", "adopt", "shop"]
    
    pillar_stats = {}
    for pillar in pillars:
        pillar_filter = {"$or": [{"pillar": pillar}, {"pillars": pillar}]}
        p_total = await db.products_master.count_documents(pillar_filter)
        p_cloudinary = await db.products_master.count_documents({
            **pillar_filter,
            "image_url": {"$regex": "res.cloudinary.com", "$options": "i"}
        })
        p_unsplash = await db.products_master.count_documents({
            **pillar_filter,
            "image_url": {"$regex": "unsplash", "$options": "i"}
        })
        p_no_img = await db.products_master.count_documents({
            **pillar_filter,
            "$or": [
                {"image_url": {"$exists": False}},
                {"image_url": {"$in": [None, ""]}}
            ]
        })
        p_ai = await db.products_master.count_documents({**pillar_filter, "ai_generated_image": True})
        
        s_total = await db.services.count_documents({"pillar": pillar})
        s_with_img = await db.services.count_documents({
            "pillar": pillar,
            "$or": [
                {"image_url": {"$exists": True, "$nin": [None, ""]}},
                {"watercolor_image": {"$exists": True, "$nin": [None, ""]}}
            ]
        })
        
        pillar_stats[pillar] = {
            "products": {
                "total": p_total,
                "cloudinary": p_cloudinary,
                "unsplash": p_unsplash,
                "no_image": p_no_img,
                "ai_generated": p_ai,
                "needs_generation": p_unsplash + p_no_img
            },
            "services": {"total": s_total, "with_images": s_with_img, "missing": s_total - s_with_img}
        }
    
    return {
        "products": {
            "total": total_products,
            "with_cloudinary": products_with_cloudinary,
            "with_unsplash": products_with_unsplash,
            "no_image": products_no_image,
            "needs_generation": products_needing_generation,
            "missing_images": products_needing_generation,
            "ai_generated": products_ai_generated,
            "coverage_percent": round((products_with_cloudinary / total_products * 100) if total_products > 0 else 0, 1)
        },
        "services": {
            "total": total_services,
            "with_images": services_with_images,
            "missing_images": total_services - services_with_images,
            "ai_generated": services_ai_generated,
            "coverage_percent": round((services_with_images / total_services * 100) if total_services > 0 else 0, 1)
        },
        "by_pillar": pillar_stats
    }



# ─────────────────────────────────────────────────────────────────────────────
# FULL CLOUDINARY PIPELINE ENDPOINTS
# Covers: migration + services_master + care_bundles + mira_imagines_cache
# ─────────────────────────────────────────────────────────────────────────────

@ai_image_router.post("/pipeline/migrate")
async def run_migration_pipeline(background_tasks: BackgroundTasks):
    """Migrate all existing non-Cloudinary images to Cloudinary."""
    async def _run():
        import cloudinary.uploader
        if db is None: return
        migrated = 0
        for collection, id_field, img_field in [
            ("products_master", "id", "image_url"),
            ("services_master",  "id", "image_url"),
            ("care_bundles",     "id", "image_url"),
        ]:
            col = db[collection]
            cursor = col.find(
                {img_field: {"$exists": True, "$ne": "", "$nin": [None, ""]}},
                {"_id": 0, id_field: 1, img_field: 1, "pillar": 1}
            )
            items = await cursor.to_list(length=5000)
            to_migrate = [i for i in items if i.get(img_field) and "cloudinary.com" not in i.get(img_field, "")]
            logger.info(f"[migrate] {collection}: {len(to_migrate)} to migrate")
            for item in to_migrate:
                item_id = item.get(id_field, "unknown")
                url = item.get(img_field, "")
                if not url or not url.startswith("http"): continue
                pillar = item.get("pillar", "general")
                pub_id = f"tdc/{collection}/{pillar}/{item_id}"
                try:
                    result = cloudinary.uploader.upload(
                        url, public_id=pub_id, overwrite=False,
                        resource_type="image", format="webp",
                        transformation=[{"width": 800, "height": 800, "crop": "limit"}, {"quality": "auto:good"}]
                    )
                    new_url = result.get("secure_url")
                    if new_url:
                        await col.update_one({id_field: item_id}, {"$set": {img_field: new_url}})
                        migrated += 1
                except Exception as e:
                    logger.warning(f"[migrate] {item_id}: {e}")
                await asyncio.sleep(0.2)
        logger.info(f"[migrate] Complete: {migrated} images migrated to Cloudinary")
    background_tasks.add_task(_run)
    return {"status": "migration_started", "message": "Migrating existing images to Cloudinary in background"}


@ai_image_router.post("/pipeline/services-master")
async def run_services_master_watercolour(
    background_tasks: BackgroundTasks,
    pillar: Optional[str] = None,
    limit: int = 100
):
    """Generate watercolour illustrations for services_master (not services collection)."""
    async def _run():
        if db is None: return
        query = {"$or": [
            {"watercolor_image": {"$exists": False}},
            {"watercolor_image": None},
            {"watercolor_image": ""},
        ]}
        if pillar: query["pillar"] = pillar
        services = await db.services_master.find(query, {"_id": 0}).to_list(length=limit)
        logger.info(f"[services-master] {len(services)} services to process")
        done = 0
        STYLE = "soft watercolour illustration, warm pastel tones, gentle brushstrokes, artistic pet illustration, minimal clean background"
        pillar_prompts = {
            "learn": "dog learning to sit with a trainer, treats and reward, attentive pose",
            "care": "dog being lovingly groomed, caring hands, wellness scene",
            "dine": "dog with a beautiful healthy meal, nutritious food bowl",
            "go": "dog in a travel carrier, adventure accessories, excited to explore",
            "celebrate": "dog at birthday celebration, balloons and cake, festive joy",
            "play": "dog playing joyfully with toys, pure happiness",
            "farewell": "peaceful rainbow bridge scene, gentle and serene",
            "adopt": "hopeful dog finding a loving home, heartwarming moment",
            "emergency": "caring veterinary assistance, gentle and reassuring",
        }
        for svc in services:
            svc_id = svc.get("id", "unknown")
            svc_pillar = (svc.get("pillar") or "general").lower()
            pub_id = f"tdc/services-master/{svc_pillar}/{svc_id}"
            scene = pillar_prompts.get(svc_pillar, "happy dog receiving professional pet care")
            prompt = f"Watercolour illustration of a {scene}. {STYLE}."
            url = await generate_ai_image(prompt)
            if url:
                await db.services_master.update_one(
                    {"id": svc_id},
                    {"$set": {"watercolor_image": url, "image_url": url, "ai_generated_image": True}}
                )
                done += 1
                logger.info(f"[services-master] ✓ {svc.get('name','?')[:40]}")
            await asyncio.sleep(4)
        logger.info(f"[services-master] Complete: {done}/{len(services)}")
    background_tasks.add_task(_run)
    return {"status": "started", "pillar": pillar or "all", "limit": limit}


@ai_image_router.post("/pipeline/bundles")
async def run_bundles_watercolour(
    background_tasks: BackgroundTasks,
    pillar: Optional[str] = None
):
    """Generate watercolour illustrations for bundles missing images."""
    async def _run():
        if db is None: return
        query = {"$or": [
            {"image_url": {"$exists": False}},
            {"image_url": None}, {"image_url": ""}
        ]}
        if pillar: query["pillar"] = pillar
        bundles = await db.care_bundles.find(query, {"_id": 0}).to_list(length=100)
        logger.info(f"[bundles] {len(bundles)} bundles to process")
        done = 0
        STYLE = "soft watercolour illustration, warm pastel tones, premium pet lifestyle, minimal clean background"
        for b in bundles:
            b_id = b.get("id", "unknown")
            b_pillar = (b.get("pillar") or "learn").lower()
            items = b.get("items", [])
            items_str = ", ".join(
                (i if isinstance(i, str) else i.get("name", "")) for i in items[:3]
            )
            pub_id = f"tdc/bundles/{b_pillar}/{b_id}"
            prompt = f"Watercolour illustration of a curated pet gift box with {items_str or 'pet care essentials'}, beautiful packaging, warm and inviting. {STYLE}."
            url = await generate_ai_image(prompt)
            if url:
                await db.care_bundles.update_one(
                    {"id": b_id},
                    {"$set": {"image_url": url, "watercolor_image": url, "ai_generated_image": True}}
                )
                done += 1
                logger.info(f"[bundles] ✓ {b.get('name','?')[:40]}")
            await asyncio.sleep(4)
        logger.info(f"[bundles] Complete: {done}/{len(bundles)}")
    background_tasks.add_task(_run)
    return {"status": "started", "pillar": pillar or "all"}


@ai_image_router.post("/pipeline/mira-imagines")
async def run_mira_imagines_generation(
    background_tasks: BackgroundTasks,
    pillar: Optional[str] = None,
    breed: Optional[str] = None,
    limit: int = 20
):
    """Generate breed × pillar watercolours for Mira Imagines cards."""
    BREEDS = [
        "labrador", "golden_retriever", "german_shepherd", "indie",
        "french_bulldog", "beagle", "shih_tzu", "poodle", "rottweiler",
        "husky", "cocker_spaniel", "boxer", "chihuahua", "pug", "maltese",
        "yorkshire_terrier", "dachshund", "border_collie", "lhasa_apso",
        "jack_russell", "cavalier", "american_bully", "samoyed", "corgi",
        "pomeranian", "schnauzer", "great_dane", "dalmatian", "akita",
        "shiba_inu", "australian_shepherd", "chow_chow", "doberman"
    ]
    BREED_NAMES = {
        "labrador":"Labrador Retriever","golden_retriever":"Golden Retriever",
        "german_shepherd":"German Shepherd","indie":"Indian Street Dog",
        "french_bulldog":"French Bulldog","beagle":"Beagle","shih_tzu":"Shih Tzu",
        "poodle":"Poodle","rottweiler":"Rottweiler","husky":"Siberian Husky",
        "cocker_spaniel":"Cocker Spaniel","boxer":"Boxer","chihuahua":"Chihuahua",
        "pug":"Pug","maltese":"Maltese","yorkshire_terrier":"Yorkshire Terrier",
        "dachshund":"Dachshund","border_collie":"Border Collie","lhasa_apso":"Lhasa Apso",
        "jack_russell":"Jack Russell Terrier","cavalier":"Cavalier King Charles Spaniel",
        "american_bully":"American Bully","samoyed":"Samoyed","corgi":"Welsh Corgi",
        "pomeranian":"Pomeranian","schnauzer":"Schnauzer","great_dane":"Great Dane",
        "dalmatian":"Dalmatian","akita":"Akita","shiba_inu":"Shiba Inu",
        "australian_shepherd":"Australian Shepherd","chow_chow":"Chow Chow","doberman":"Doberman Pinscher"
    }
    PILLAR_SCENES = {
        "learn":     "learning to sit with a trainer, treat pouch and training journal nearby",
        "care":      "being lovingly groomed, wellness scene, caring and gentle",
        "dine":      "enjoying a healthy gourmet meal from a beautiful ceramic bowl",
        "go":        "exploring on an adventure, travel carrier and accessories",
        "celebrate": "at a birthday party, festive balloons and cake",
        "play":      "playing joyfully with toys in a park, pure happiness",
    }
    STYLE = "soft watercolour illustration, warm pastel tones, artistic brushstrokes, soulful pet portrait, minimal background, premium pet lifestyle"

    async def _run():
        if db is None: return
        breeds_to_run = [breed] if breed else BREEDS
        pillars_to_run = [pillar] if pillar else list(PILLAR_SCENES.keys())
        done = 0; total_cap = limit
        for p in pillars_to_run:
            if done >= total_cap: break
            scene = PILLAR_SCENES.get(p, "receiving professional pet care")
            for b_key in breeds_to_run:
                if done >= total_cap: break
                existing = await db.mira_imagines_cache.find_one({"pillar": p, "breed": b_key})
                if existing and existing.get("url"): continue
                breed_full = BREED_NAMES.get(b_key, b_key.replace("_"," ").title())
                pub_id = f"tdc/mira-imagines/{p}/{b_key}"
                prompt = (
                    f"Watercolour illustration of a beautiful {breed_full} dog {scene}. "
                    f"The dog looks healthy, happy and soulful. {STYLE}. No text in image."
                )
                url = await generate_ai_image(prompt)
                if url:
                    await db.mira_imagines_cache.update_one(
                        {"pillar": p, "breed": b_key},
                        {"$set": {"pillar": p, "breed": b_key, "url": url,
                                  "updated_at": datetime.now(timezone.utc).isoformat()}},
                        upsert=True
                    )
                    done += 1
                    logger.info(f"[mira-imagines] ✓ {p}/{b_key}")
                await asyncio.sleep(5)
        logger.info(f"[mira-imagines] Complete: {done} generated")
    background_tasks.add_task(_run)
    return {"status": "started", "pillar": pillar or "all", "breed": breed or "all", "limit": limit}


@ai_image_router.get("/pipeline/mira-imagines/{pillar}/{breed}")
async def get_mira_imagines_url(pillar: str, breed: str):
    """Get cached Mira Imagines watercolour URL for a pillar+breed combo."""
    if db is None:
        return {"url": None}
    breed_key = breed.lower().replace(" ", "_").replace("-", "_")
    doc = await db.mira_imagines_cache.find_one({"pillar": pillar, "breed": breed_key}, {"_id": 0})
    return {"url": doc.get("url") if doc else None, "pillar": pillar, "breed": breed_key}

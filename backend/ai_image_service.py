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
        
        # Upload to Cloudinary and return URL
        cloudinary.config(
            cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
            api_key=os.getenv("CLOUDINARY_API_KEY"),
            api_secret=os.getenv("CLOUDINARY_API_SECRET")
        )
        
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
        # Products needing AI images: missing image_url OR using Unsplash (never contextual)
        no_image_condition = {
            "$or": [
                {"image_url": {"$exists": False}},
                {"image_url": None},
                {"image_url": ""},
                {"image_url": {"$regex": "unsplash", "$options": "i"}},
            ]
        }
        
        query = no_image_condition.copy()
        
        if pillar:
            query = {
                "$and": [
                    no_image_condition,
                    {"$or": [
                        {"pillar": pillar},
                        {"pillars": pillar},
                        {"primary_pillar": pillar}
                    ]}
                ]
            }
        
        # Query products_master — this is the SSOT for all products
        products = await db.products_master.find(query, {"_id": 0}).to_list(length=500)
        
        # Also grab from legacy products collection (Shopify products)
        legacy_products = await db.products.find(query, {"_id": 0}).to_list(length=200)
        
        # Deduplicate by id
        seen_ids = {p.get("id") for p in products}
        for p in legacy_products:
            if p.get("id") not in seen_ids:
                products.append(p)
        
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
                    # Update in products_master first (SSOT), then fallback to legacy products
                    update_result = await db.products_master.update_one(
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
    """Get comprehensive image statistics by pillar"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    
    # Products stats
    total_products = await db.products.count_documents({})
    products_with_images = await db.products.count_documents({
        "$or": [
            {"image_url": {"$exists": True, "$ne": None, "$ne": ""}},
            {"image": {"$exists": True, "$ne": None, "$ne": ""}}
        ]
    })
    products_ai_generated = await db.products.count_documents({"ai_generated_image": True})
    
    # Services stats
    total_services = await db.services.count_documents({})
    services_with_images = await db.services.count_documents({
        "$or": [
            {"image_url": {"$exists": True, "$ne": None, "$ne": ""}},
            {"watercolor_image": {"$exists": True, "$ne": None, "$ne": ""}}
        ]
    })
    services_ai_generated = await db.services.count_documents({"ai_generated_image": True})
    
    # By pillar breakdown
    pillars = ["celebrate", "dine", "stay", "travel", "care", "enjoy", "fit", "learn", "paperwork", "advisory", "emergency", "farewell", "adopt", "shop"]
    
    pillar_stats = {}
    for pillar in pillars:
        p_total = await db.products.count_documents({"pillar": pillar})
        p_with_img = await db.products.count_documents({
            "pillar": pillar,
            "$or": [
                {"image_url": {"$exists": True, "$ne": None, "$ne": ""}},
                {"image": {"$exists": True, "$ne": None, "$ne": ""}}
            ]
        })
        
        s_total = await db.services.count_documents({"pillar": pillar})
        s_with_img = await db.services.count_documents({
            "pillar": pillar,
            "$or": [
                {"image_url": {"$exists": True, "$ne": None, "$ne": ""}},
                {"watercolor_image": {"$exists": True, "$ne": None, "$ne": ""}}
            ]
        })
        
        pillar_stats[pillar] = {
            "products": {"total": p_total, "with_images": p_with_img, "missing": p_total - p_with_img},
            "services": {"total": s_total, "with_images": s_with_img, "missing": s_total - s_with_img}
        }
    
    return {
        "products": {
            "total": total_products,
            "with_images": products_with_images,
            "missing_images": total_products - products_with_images,
            "ai_generated": products_ai_generated,
            "coverage_percent": round((products_with_images / total_products * 100) if total_products > 0 else 0, 1)
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

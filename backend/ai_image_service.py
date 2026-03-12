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
    """Generate an appropriate prompt for a product image"""
    name = (product.get("name") or "").lower()
    category = (product.get("category") or "").lower()
    pillar = (product.get("pillar") or "").lower()
    
    # Category-specific prompts for realistic product photography
    if any(x in name for x in ["treat", "snack", "biscuit", "cookie"]):
        return f"Dog treats in premium packaging, {product.get('name')}, natural ingredients, appetizing display, clean white background, professional product photography, realistic, high quality"
    
    if any(x in name for x in ["food", "meal", "kibble"]):
        return f"Premium dog food bag, {product.get('name')}, nutritious formula, attractive modern packaging, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["toy", "ball", "chew", "rope"]):
        return f"Dog toy, {product.get('name')}, colorful and durable, pet-safe materials, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["bed", "mat", "blanket", "cushion"]):
        return f"Cozy dog bed, {product.get('name')}, soft and comfortable, premium quality materials, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["collar", "leash", "harness"]):
        return f"Dog collar or leash, {product.get('name')}, adjustable and stylish, durable hardware, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["bowl", "feeder", "water"]):
        return f"Dog bowl or feeder, {product.get('name')}, modern design, pet-safe materials, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["shampoo", "grooming", "brush", "comb"]):
        return f"Dog grooming product, {product.get('name')}, professional quality, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["folder", "document", "adoption"]):
        return f"Elegant pet document folder, {product.get('name')}, premium leather-look cover with paw print emboss, professional organizer, clean white background, product photography, realistic"
    
    if any(x in name for x in ["supplement", "vitamin", "health"]):
        return f"Pet health supplement, {product.get('name')}, veterinary grade packaging, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["carrier", "crate", "travel"]):
        return f"Pet carrier or travel crate, {product.get('name')}, comfortable and secure design, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["sweater", "coat", "jacket", "clothes"]):
        return f"Dog clothing, {product.get('name')}, stylish and comfortable, clean white background, professional product photography, realistic"
    
    if any(x in name for x in ["cake", "birthday", "party", "celebration"]):
        return f"Dog birthday treat or party item, {product.get('name')}, festive and pet-safe, colorful design, clean white background, professional product photography, realistic"
    
    # Default prompt
    return f"Premium pet product, {product.get('name')}, high quality, attractive packaging, clean white background, professional product photography, realistic"


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
    """Process products without images in background"""
    global generation_status
    
    if db is None:
        logger.error("Database not connected")
        return
    
    try:
        # Build query for products without images
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
            query["pillar"] = pillar
        
        # Get products
        products = await db.products.find(query, {"_id": 0}).to_list(length=500)
        
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
                    # Update product in database
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

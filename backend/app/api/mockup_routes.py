"""
Product Mockup API Routes
=========================
Endpoints for generating AI-powered personalized product mockups.

Includes:
- Single mockup generation
- Batch mockup generation for all breeds
- Admin endpoints for triggering generation
- Statistics and status endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List, Dict
import logging
import asyncio
import os
import base64
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mockups", tags=["Product Mockups"])

# Database reference
_db = None

# Background task state
_generation_status = {
    "running": False,
    "progress": 0,
    "total": 0,
    "generated": 0,
    "failed": 0,
    "current_product": None,
    "started_at": None,
    "completed_at": None
}

def set_mockup_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


class MockupRequest(BaseModel):
    product_name: str
    pet_name: str
    breed: str
    product_id: Optional[str] = None


class BulkMockupRequest(BaseModel):
    product_ids: List[str]
    pet_name: str
    breed: str


class BatchGenerationRequest(BaseModel):
    limit: Optional[int] = None
    breed_filter: Optional[str] = None
    product_type_filter: Optional[str] = None


@router.post("/generate")
async def generate_mockup(request: MockupRequest):
    """
    Generate a personalized product mockup with pet name and breed illustration.
    
    This uses AI image generation to create a realistic product visualization
    showing how the product would look with the pet's name and breed art.
    """
    from services.product_mockup_generator import generate_product_mockup
    
    logger.info(f"Generating mockup: {request.product_name} for {request.pet_name} ({request.breed})")
    
    result = await generate_product_mockup(
        product_name=request.product_name,
        pet_name=request.pet_name,
        breed=request.breed
    )
    
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Cache the mockup in database
    db = get_db()
    if db and request.product_id:
        await db.product_mockups.update_one(
            {
                "product_id": request.product_id,
                "pet_name": request.pet_name,
                "breed": request.breed
            },
            {"$set": {
                "image_url": result.get("image_url"),
                "product_name": request.product_name,
                "created_at": asyncio.get_event_loop().time()
            }},
            upsert=True
        )
    
    return result


@router.get("/cached/{product_id}")
async def get_cached_mockup(product_id: str, pet_name: str, breed: str):
    """Get a cached mockup if it exists."""
    db = get_db()
    
    mockup = await db.product_mockups.find_one(
        {
            "product_id": product_id,
            "pet_name": pet_name,
            "breed": breed
        },
        {"_id": 0}
    )
    
    if mockup:
        return {"cached": True, "mockup": mockup}
    
    return {"cached": False, "mockup": None}


@router.post("/generate-for-pet/{pet_id}")
async def generate_mockups_for_pet(pet_id: str, product_ids: List[str]):
    """
    Generate mockups for multiple products for a specific pet.
    This runs in background and caches results.
    """
    db = get_db()
    
    # Get pet info
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "name": 1, "breed": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_name = pet.get("name", "Pet")
    breed = pet.get("breed", "Dog")
    
    # Get product names
    products = await db.products_master.find(
        {"id": {"$in": product_ids}},
        {"_id": 0, "id": 1, "name": 1, "title": 1}
    ).to_list(len(product_ids))
    
    if not products:
        raise HTTPException(status_code=404, detail="No products found")
    
    # Generate mockups
    from services.product_mockup_generator import generate_multiple_mockups
    
    results = await generate_multiple_mockups(products, pet_name, breed)
    
    # Cache results
    for result in results:
        if result.get("success") and result.get("product_id"):
            await db.product_mockups.update_one(
                {
                    "product_id": result["product_id"],
                    "pet_name": pet_name,
                    "breed": breed
                },
                {"$set": {
                    "image_url": result.get("image_url"),
                    "product_name": result.get("product_name"),
                    "created_at": asyncio.get_event_loop().time()
                }},
                upsert=True
            )
    
    return {
        "pet_name": pet_name,
        "breed": breed,
        "generated": len([r for r in results if r.get("success")]),
        "failed": len([r for r in results if r.get("error")]),
        "results": results
    }


@router.get("/product-types")
async def get_supported_product_types():
    """Get list of product types supported for mockup generation."""
    return {
        "product_types": [
            {"type": "cake", "description": "Birthday cakes with pet decoration"},
            {"type": "bandana", "description": "Pet bandanas with printed illustration"},
            {"type": "mug", "description": "Coffee/tea mugs with pet illustration"},
            {"type": "keychain", "description": "Metal keychains with breed art"},
            {"type": "frame", "description": "Photo frames with pet portrait"},
            {"type": "welcome_mat", "description": "Welcome mats with breed illustration"},
            {"type": "bowl", "description": "Pet food bowls with name"},
            {"type": "tote_bag", "description": "Tote bags for dog parents"},
            {"type": "treat_jar", "description": "Treat jars with personalized label"},
            {"type": "blanket", "description": "Cozy blankets with breed art"},
            {"type": "collar_tag", "description": "Pet ID tags with engraved name"},
            {"type": "party_hat", "description": "Party hats with breed illustration"}
        ]
    }


# ═══════════════════════════════════════════════════════════════════════════
# ADMIN ENDPOINTS - Batch Generation
# ═══════════════════════════════════════════════════════════════════════════

@router.get("/stats")
async def get_mockup_stats():
    """Get statistics on breed products and mockup generation status."""
    db = get_db()
    
    total = await db.breed_products.count_documents({})
    # Count products with actual mockup URLs (not null, not empty string)
    with_mockups = await db.breed_products.count_documents({
        "mockup_url": {"$nin": [None, "", "null"]}
    })
    without_mockups = total - with_mockups
    
    # By product type
    pipeline = [
        {"$group": {
            "_id": "$product_type", 
            "count": {"$sum": 1}, 
            "with_mockups": {"$sum": {"$cond": [{"$and": [{"$ne": ["$mockup_url", None]}, {"$ne": ["$mockup_url", ""]}]}, 1, 0]}}
        }}
    ]
    by_type = await db.breed_products.aggregate(pipeline).to_list(20)
    
    # By breed
    pipeline = [
        {"$group": {
            "_id": "$breed", 
            "count": {"$sum": 1}, 
            "with_mockups": {"$sum": {"$cond": [{"$and": [{"$ne": ["$mockup_url", None]}, {"$ne": ["$mockup_url", ""]}]}, 1, 0]}}
        }}
    ]
    by_breed = await db.breed_products.aggregate(pipeline).to_list(40)
    
    return {
        "total_products": total,
        "products_with_mockups": with_mockups,
        "products_without_mockups": without_mockups,
        "completion_percentage": round((with_mockups / total * 100) if total > 0 else 0, 1),
        "by_product_type": {item["_id"]: {"total": item["count"], "with_mockups": item["with_mockups"]} for item in by_type if item["_id"]},
        "by_breed": {item["_id"]: {"total": item["count"], "with_mockups": item["with_mockups"]} for item in by_breed if item["_id"]},
        "generation_status": _generation_status
    }


@router.get("/status")
async def get_generation_status():
    """Get current batch generation status."""
    return _generation_status


async def _generate_mockup_image(prompt: str, slug: str, breed: str = "unknown") -> Optional[str]:
    """Generate a single mockup image using OpenAI GPT Image 1 and upload to Cloudinary."""
    try:
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
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
            image_base64 = base64.b64encode(images[0]).decode('utf-8')
            base64_url = f"data:image/png;base64,{image_base64}"
            
            # Try to upload to Cloudinary immediately if configured
            try:
                from mockup_cloud_storage import upload_base64_to_cloudinary, is_cloudinary_configured
                if is_cloudinary_configured():
                    cloud_url = await upload_base64_to_cloudinary(base64_url, slug, breed)
                    if cloud_url:
                        logger.info(f"✓ Uploaded {slug} directly to Cloudinary")
                        return cloud_url
                    else:
                        logger.warning(f"Cloudinary upload failed for {slug}, falling back to base64")
            except Exception as cloud_err:
                logger.warning(f"Cloudinary not available: {cloud_err}, using base64")
            
            return base64_url
        
        return None
        
    except Exception as e:
        logger.error(f"Error generating {slug}: {e}")
        return None


async def _batch_generate_mockups(db, limit: Optional[int] = None, breed_filter: Optional[str] = None, product_type_filter: Optional[str] = None):
    """Background task to generate mockups for all pending products."""
    global _generation_status
    
    _generation_status["running"] = True
    _generation_status["started_at"] = datetime.utcnow().isoformat()
    _generation_status["completed_at"] = None
    
    try:
        # Build query - ONLY products with prompts but no mockup
        query = {
            "$and": [
                {"mockup_prompt": {"$exists": True, "$ne": None, "$ne": ""}},
                {"$or": [
                    {"mockup_url": {"$exists": False}},
                    {"mockup_url": None},
                    {"mockup_url": ""}
                ]}
            ]
        }
        if breed_filter:
            query["$and"].append({"breed": breed_filter})
        if product_type_filter:
            query["$and"].append({"product_type": product_type_filter})
        
        cursor = db.breed_products.find(query)
        if limit:
            cursor = cursor.limit(limit)
        
        products = await cursor.to_list(500)
        
        _generation_status["total"] = len(products)
        _generation_status["progress"] = 0
        _generation_status["generated"] = 0
        _generation_status["failed"] = 0
        
        logger.info(f"Starting batch generation for {len(products)} products with prompts")
        
        for i, product in enumerate(products):
            _generation_status["progress"] = i + 1
            _generation_status["current_product"] = product.get("name", product.get("id", "unknown"))
            
            try:
                slug = product.get("id", f"bp-{product.get('breed')}-{product.get('product_type')}")
                prompt = product.get("mockup_prompt", "")
                
                if not prompt:
                    logger.warning(f"No prompt for {slug}")
                    _generation_status["failed"] += 1
                    continue
                
                mockup_url = await _generate_mockup_image(prompt, slug, product.get("breed", "unknown"))
                
                if mockup_url:
                    await db.breed_products.update_one(
                        {"_id": product["_id"]},
                        {"$set": {
                            "mockup_url": mockup_url,
                            "mockup_generated_at": datetime.utcnow().isoformat()
                        }}
                    )
                    _generation_status["generated"] += 1
                    logger.info(f"✓ Generated mockup for {slug}")
                else:
                    _generation_status["failed"] += 1
                    logger.warning(f"✗ Failed to generate {slug}")
                
                # Small delay to avoid rate limits
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Error processing {product.get('id', 'unknown')}: {e}")
                _generation_status["failed"] += 1
        
        _generation_status["completed_at"] = datetime.utcnow().isoformat()
        logger.info(f"Batch generation complete: {_generation_status['generated']} generated, {_generation_status['failed']} failed")
        
    except Exception as e:
        logger.error(f"Batch generation error: {e}")
    finally:
        _generation_status["running"] = False
        _generation_status["current_product"] = None


@router.post("/generate-batch")
async def start_batch_generation(request: BatchGenerationRequest, background_tasks: BackgroundTasks):
    """
    Start batch generation of mockups for all breed products.
    This runs in the background - use /status to check progress.
    """
    global _generation_status
    
    if _generation_status["running"]:
        raise HTTPException(
            status_code=409, 
            detail="Generation already in progress. Check /status for progress."
        )
    
    db = get_db()
    
    # Only get products that HAVE a mockup_prompt but don't have a mockup_url
    query = {
        "$and": [
            {"mockup_prompt": {"$exists": True, "$ne": None, "$ne": ""}},
            {"$or": [
                {"mockup_url": {"$exists": False}},
                {"mockup_url": None},
                {"mockup_url": ""}
            ]}
        ]
    }
    if request.breed_filter:
        query["$and"].append({"breed": request.breed_filter})
    if request.product_type_filter:
        query["$and"].append({"product_type": request.product_type_filter})
    
    pending_count = await db.breed_products.count_documents(query)
    
    if pending_count == 0:
        return {"message": "All products with prompts already have mockups", "pending": 0}
    
    # Start background task
    background_tasks.add_task(
        _batch_generate_mockups, 
        db, 
        request.limit, 
        request.breed_filter, 
        request.product_type_filter
    )
    
    return {
        "message": "Batch generation started",
        "pending": pending_count,
        "limit": request.limit,
        "filters": {
            "breed": request.breed_filter,
            "product_type": request.product_type_filter
        },
        "check_status": "/api/mockups/status"
    }


@router.post("/stop-generation")
async def stop_generation():
    """Stop the current batch generation (gracefully completes current item)."""
    global _generation_status
    
    if not _generation_status["running"]:
        return {"message": "No generation in progress"}
    
    # This is a soft stop - the loop will check this flag
    _generation_status["running"] = False
    
    return {"message": "Generation will stop after current item completes"}


@router.get("/breed-products")
async def get_breed_products(
    breed: Optional[str] = None,
    product_type: Optional[str] = None,
    has_mockup: Optional[bool] = None,
    pillar: Optional[str] = None,
    limit: int = 50
):
    """Get breed products with optional filters."""
    db = get_db()
    
    query = {}
    if breed:
        query["breed"] = breed
    if product_type:
        query["product_type"] = product_type
    if pillar:
        # pillars is an array field, use $in to check if pillar is in the array
        query["pillars"] = {"$in": [pillar]}
    if has_mockup is not None:
        if has_mockup:
            query["mockup_url"] = {"$ne": None}
        else:
            query["mockup_url"] = None
    
    products = await db.breed_products.find(query, {"_id": 0}).limit(limit).to_list(limit)
    
    return {
        "products": products,
        "count": len(products),
        "filters": {"breed": breed, "product_type": product_type, "pillar": pillar, "has_mockup": has_mockup}
    }


@router.get("/breed-products/{product_id}")
async def get_breed_product(product_id: str):
    """Get a specific breed product."""
    db = get_db()
    
    product = await db.breed_products.find_one({"id": product_id}, {"_id": 0})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.post("/seed-products")
async def seed_breed_products():
    """Seed all breed products (33 breeds × all product types) into database."""
    from scripts.generate_all_mockups import seed_all_breed_products, BREEDS, PRODUCT_TYPES
    
    db = get_db()
    
    count = await seed_all_breed_products(db)
    
    return {
        "message": f"Seeded {count} breed products",
        "breeds": len(BREEDS),
        "product_types": len(PRODUCT_TYPES),
        "total": count
    }


@router.post("/seed-new-products")
async def seed_new_product_types():
    """
    Seed ONLY the NEW product types (Travel, Care, Learn, Farewell, Emergency, Enjoy).
    This creates 33 breeds × 14 new product types = 462 new products.
    Existing products are NOT affected.
    """
    from scripts.generate_all_mockups import BREEDS, PRODUCT_TYPES
    from datetime import datetime
    
    db = get_db()
    
    # New product types added in this update
    new_types = [
        "passport_holder", "carrier_tag", "travel_bowl", "luggage_tag",
        "pet_towel", "pet_robe", "grooming_apron",
        "treat_pouch", "training_log",
        "memorial_ornament", "paw_print_frame",
        "emergency_card", "medical_alert_tag",
        "play_bandana", "playdate_card"
    ]
    
    products_created = 0
    
    for breed in BREEDS:
        for product_type in PRODUCT_TYPES:
            if product_type["type"] not in new_types:
                continue
                
            product_name = product_type["name_template"].format(breed=breed["short"])
            product_id = f"breed-{breed['key']}-{product_type['type']}"
            
            # Build the prompt with breed name
            prompt = product_type["prompt"].format(breed_full=breed["name"])
            
            # Get pillars
            pillars_list = product_type.get("pillars", [product_type["pillar"]])
            
            # Fields that can be safely updated every time
            updatable_fields = {
                "name": product_name,
                "title": product_name,
                "category": f"breed-{product_type['type']}s",
                "pillar": product_type["pillar"],
                "pillars": pillars_list,
                "price": product_type["price"],
                "breed": breed["key"],
                "breed_name": breed["name"],
                "product_type": product_type["type"],
                "soul_tier": "soul_made",
                "mockup_prompt": prompt,
                "description": f"Beautiful {product_name} featuring soulful watercolor illustration. Personalize with your pet's name.",
                "tags": ["breed-specific", breed["key"], product_type["type"], "personalized", "soul-made"],
                "in_stock": True,
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Fields that should ONLY be set on first insert (never overwrite)
            insert_only_fields = {
                "id": product_id,
                "mockup_url": None,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Use $set for updates, $setOnInsert for fields we don't want to overwrite
            await db.breed_products.update_one(
                {"id": product_id},
                {
                    "$set": updatable_fields,
                    "$setOnInsert": insert_only_fields
                },
                upsert=True
            )
            products_created += 1
    
    return {
        "message": f"Seeded {products_created} NEW product types",
        "new_product_types": new_types,
        "breeds": len(BREEDS),
        "total_created": products_created
    }



# ==========================================
# PRODUCTION SYNC ENDPOINTS
# ==========================================

@router.get("/export-mockup-urls")
async def export_mockup_urls():
    """
    Export all Soul Made products with Cloudinary URLs for production sync.
    Returns products with mockup_url that starts with cloudinary URL.
    """
    db = get_db()
    
    # Get all products with Cloudinary mockup URLs
    query = {
        "mockup_url": {"$regex": "^https://res.cloudinary.com"}
    }
    
    products = await db.breed_products.find(
        query, 
        {"_id": 0}  # Exclude MongoDB _id
    ).to_list(length=5000)
    
    logger.info(f"[EXPORT] Found {len(products)} products with Cloudinary URLs")
    
    return {
        "total_exported": len(products),
        "products": products,
        "export_timestamp": datetime.now().isoformat()
    }


@router.post("/import-mockup-urls")
async def import_mockup_urls(data: dict):
    """
    Import Soul Made products from another environment.
    Used for syncing preview to production.
    """
    db = get_db()
    
    products = data.get("products", [])
    if not products:
        raise HTTPException(status_code=400, detail="No products provided")
    
    imported = 0
    updated = 0
    
    for product in products:
        # Use breed + product_type as unique identifier
        breed = product.get("breed")
        product_type = product.get("product_type")
        
        if not breed or not product_type:
            continue
        
        # Check if product exists
        existing = await db.breed_products.find_one({
            "breed": breed,
            "product_type": product_type
        })
        
        # Remove any _id if present (shouldn't be, but safety check)
        product.pop("_id", None)
        
        if existing:
            # Update existing product
            await db.breed_products.update_one(
                {"breed": breed, "product_type": product_type},
                {"$set": product}
            )
            updated += 1
        else:
            # Insert new product
            await db.breed_products.insert_one(product)
            imported += 1
    
    logger.info(f"[IMPORT] Imported {imported} new, updated {updated} existing products")
    
    return {
        "imported": imported,
        "updated": updated,
        "total": imported + updated,
        "import_timestamp": datetime.now().isoformat()
    }

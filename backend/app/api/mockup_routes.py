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

# Production sync state
_sync_status = {
    "running": False,
    "progress": 0,
    "total_batches": 0,
    "current_batch": 0,
    "total_products": 0,
    "imported": 0,
    "updated": 0,
    "failed_batches": 0,
    "started_at": None,
    "completed_at": None,
    "message": ""
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
    pillar: Optional[str] = None        # filter products by pillar
    tag_pillar: Optional[str] = None    # tag generated products with this pillar


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


async def _batch_generate_mockups(db, limit: Optional[int] = None, breed_filter: Optional[str] = None, product_type_filter: Optional[str] = None, tag_pillar: Optional[str] = None):
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
                    update_fields = {
                        "mockup_url": mockup_url,
                        "mockup_generated_at": datetime.utcnow().isoformat(),
                        "image_url": mockup_url,      # also set as main image_url
                    }
                    if tag_pillar:
                        update_fields["pillar"] = tag_pillar
                    await db.breed_products.update_one(
                        {"_id": product["_id"]},
                        {"$set": update_fields}
                    )
                    # Also upsert into products_master with pillar tag
                    if tag_pillar:
                        prod_doc = dict(product)
                        prod_doc.pop("_id", None)
                        prod_doc["mockup_url"] = mockup_url
                        prod_doc["image_url"] = mockup_url
                        prod_doc["pillar"] = tag_pillar
                        prod_doc["soul_product"] = True
                        prod_id = prod_doc.get("id")
                        if prod_id:
                            await db.products_master.update_one(
                                {"id": prod_id},
                                {"$set": prod_doc},
                                upsert=True
                            )
                    _generation_status["generated"] += 1
                    logger.info(f"✓ Generated mockup for {slug}{' → '+tag_pillar if tag_pillar else ''}")
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
    if request.pillar:
        query["$and"].append({"$or": [{"pillar": request.pillar}, {"pillars": {"$in": [request.pillar]}}]})
    
    pending_count = await db.breed_products.count_documents(query)
    
    if pending_count == 0:
        return {"message": "All products with prompts already have mockups", "pending": 0}
    
    # Start background task
    background_tasks.add_task(
        _batch_generate_mockups, 
        db, 
        request.limit, 
        request.breed_filter, 
        request.product_type_filter,
        request.tag_pillar or request.pillar   # tag generated products with pillar
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
    """Get breed products from breed_products collection only.
    Filters to is_mockup=True (proper product mockups)."""
    db = get_db()
    
    query = {"is_mockup": True}
    if breed:
        query["$or"] = [
            {"breed": breed},
            {"breed": "all"},
        ]
    if product_type:
        query["product_type"] = product_type
    if pillar:
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


@router.get("/sync-status")
async def get_sync_status():
    """Get current production sync status"""
    return _sync_status


@router.post("/sync-to-production")
async def sync_to_production(batch_size: int = 100):
    """
    Server-side sync of all mockups to production in batches.
    This bypasses browser CORS issues by making the request server-side.
    Batches products to avoid timeout issues with large datasets.
    """
    global _sync_status
    import httpx
    
    # Check if already running
    if _sync_status["running"]:
        return {
            "success": False,
            "message": "Sync already in progress",
            "status": _sync_status
        }
    
    db = get_db()
    PRODUCTION_URL = "https://thedoggycompany.com"
    
    try:
        # Get all products with mockup_url (Cloudinary URLs)
        products = await db.breed_products.find(
            {"mockup_url": {"$regex": "cloudinary.com|res.cloudinary"}},
            {"_id": 0}
        ).to_list(length=None)
        
        if not products:
            return {
                "success": False,
                "message": "No Cloudinary mockups found to sync",
                "synced": 0
            }
        
        total_products = len(products)
        total_batches = (total_products + batch_size - 1) // batch_size
        
        # Initialize sync status
        _sync_status = {
            "running": True,
            "progress": 0,
            "total_batches": total_batches,
            "current_batch": 0,
            "total_products": total_products,
            "imported": 0,
            "updated": 0,
            "failed_batches": 0,
            "started_at": datetime.now().isoformat(),
            "completed_at": None,
            "message": f"Starting sync of {total_products} products in {total_batches} batches..."
        }
        
        logger.info(f"[SYNC] Found {total_products} products with Cloudinary mockups, syncing in batches of {batch_size}")
        
        # Batch sync to avoid timeouts
        total_imported = 0
        total_updated = 0
        failed_batches = 0
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            for i in range(0, total_products, batch_size):
                batch = products[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                
                # Update status
                _sync_status["current_batch"] = batch_num
                _sync_status["progress"] = int((batch_num / total_batches) * 100)
                _sync_status["message"] = f"Syncing batch {batch_num}/{total_batches} ({len(batch)} products)..."
                
                try:
                    logger.info(f"[SYNC] Sending batch {batch_num}/{total_batches} ({len(batch)} products)")
                    
                    response = await client.post(
                        f"{PRODUCTION_URL}/api/mockups/import-mockup-urls",
                        json={"products": batch},
                        headers={"Content-Type": "application/json"}
                    )
                    
                    if response.status_code == 200:
                        result = response.json()
                        total_imported += result.get("imported", 0)
                        total_updated += result.get("updated", 0)
                        _sync_status["imported"] = total_imported
                        _sync_status["updated"] = total_updated
                        logger.info(f"[SYNC] Batch {batch_num} successful: {result.get('total', 0)} products")
                    else:
                        failed_batches += 1
                        _sync_status["failed_batches"] = failed_batches
                        logger.error(f"[SYNC] Batch {batch_num} failed: {response.status_code}")
                        
                except Exception as batch_error:
                    failed_batches += 1
                    _sync_status["failed_batches"] = failed_batches
                    logger.error(f"[SYNC] Batch {batch_num} error: {batch_error}")
        
        # Finalize status
        _sync_status["running"] = False
        _sync_status["progress"] = 100
        _sync_status["completed_at"] = datetime.now().isoformat()
        
        if failed_batches == 0:
            _sync_status["message"] = f"✅ Synced {total_products} products successfully!"
            logger.info(f"[SYNC] Production sync complete: {total_imported} imported, {total_updated} updated")
            return {
                "success": True,
                "message": f"Synced {total_products} products to production in {total_batches} batches",
                "imported": total_imported,
                "updated": total_updated,
                "total": total_products
            }
        else:
            _sync_status["message"] = f"⚠️ Sync complete with {failed_batches} failed batches"
            return {
                "success": False,
                "message": f"Sync partially complete. {failed_batches} batches failed.",
                "imported": total_imported,
                "updated": total_updated,
                "total": total_products,
                "failed_batches": failed_batches
            }
                
    except Exception as e:
        _sync_status["running"] = False
        _sync_status["message"] = f"❌ Error: {str(e)}"
        _sync_status["completed_at"] = datetime.now().isoformat()
        logger.error(f"[SYNC] Error syncing to production: {e}")
        return {
            "success": False,
            "message": f"Sync error: {str(e)}",
            "synced": 0
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



# ==========================================
# BREED MATRIX ENDPOINTS (Breed-Smart Recommendations)
# ==========================================

@router.get("/breed-recommendations/{breed}")
async def get_breed_recommendations(breed: str, pillar: Optional[str] = None):
    """
    Get breed-specific product recommendations from the breed matrix.
    
    Args:
        breed: Breed name (e.g., "labrador", "shih_tzu", "Shih Tzu")
        pillar: Optional pillar to filter (e.g., "travel", "care", "dine")
    
    Returns:
        Breed traits and recommendations for the specified pillar(s)
    """
    db = get_db()
    
    # Normalize breed key
    breed_key = breed.lower().replace(' ', '_').replace('-', '_')
    
    # Find breed in matrix
    breed_doc = await db.breed_matrix.find_one({
        "$or": [
            {"breed_key": breed_key},
            {"breed": {"$regex": f"^{breed}$", "$options": "i"}}
        ]
    })
    
    if not breed_doc:
        # Try partial match
        breed_doc = await db.breed_matrix.find_one({
            "breed": {"$regex": breed, "$options": "i"}
        })
    
    if not breed_doc:
        return {
            "found": False,
            "breed": breed,
            "message": f"No recommendations found for breed: {breed}",
            "available_breeds": await db.breed_matrix.distinct("breed")
        }
    
    # Filter by pillar if specified
    recommendations = breed_doc.get('recommendations', {})
    if pillar:
        pillar_lower = pillar.lower()
        if pillar_lower in recommendations:
            recommendations = {pillar_lower: recommendations[pillar_lower]}
        else:
            recommendations = {}
    
    return {
        "found": True,
        "breed": breed_doc.get('breed'),
        "breed_key": breed_doc.get('breed_key'),
        "traits": breed_doc.get('traits', []),
        "trait_summary": breed_doc.get('trait_text', ''),
        "recommendations": recommendations,
        "pillar_count": len(recommendations)
    }


@router.get("/breed-matrix/all")
async def get_all_breed_recommendations():
    """Get the complete breed matrix for all breeds."""
    db = get_db()
    
    breeds = await db.breed_matrix.find({}, {"_id": 0}).to_list(length=100)
    
    return {
        "total_breeds": len(breeds),
        "breeds": breeds
    }


@router.get("/breed-matrix/pillars")
async def get_pillar_recommendations(pillar: str):
    """Get recommendations for a specific pillar across all breeds."""
    db = get_db()
    
    pillar_lower = pillar.lower()
    
    breeds = await db.breed_matrix.find(
        {f"recommendations.{pillar_lower}": {"$exists": True}},
        {"_id": 0, "breed": 1, "breed_key": 1, "traits": 1, f"recommendations.{pillar_lower}": 1}
    ).to_list(length=100)
    
    return {
        "pillar": pillar_lower,
        "breeds_with_recommendations": len(breeds),
        "breeds": breeds
    }



# ═══════════════════════════════════════════════════════════════════════════════
# MULTI-FACTOR PRODUCT FILTERING
# ═══════════════════════════════════════════════════════════════════════════════

class MultiFactorFilterRequest(BaseModel):
    pet_id: str
    pillar: str
    limit: int = 12

@router.post("/multi-factor-products")
async def get_multi_factor_products(request: MultiFactorFilterRequest):
    """
    Get products filtered by multiple factors:
    1. Breed (exact match)
    2. Archetype (product_affinity matching)
    3. Life Stage (puppy/adult/senior)
    4. Health Considerations (allergies, sensitivities)
    
    This is the "Golden Standard" personalization - not just breed-based,
    but truly personalized based on who the pet really is.
    """
    db = get_db()
    
    # Get pet data
    pet = await db.pets.find_one({"id": request.pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    breed = pet.get("breed", "").lower().replace(" ", "_")
    pillar = request.pillar.lower()
    
    # Get archetype data
    archetype_key = None
    product_affinity = []
    
    if pet.get("soul_archetype"):
        archetype_key = pet["soul_archetype"].get("primary_archetype")
        product_affinity = pet["soul_archetype"].get("product_affinity", [])
    elif pet.get("doggy_soul_answers"):
        # Derive archetype on-the-fly
        try:
            from soul_archetype_engine import derive_archetype
            soul_data = pet.get("doggy_soul_answers") or {}
            archetype_key, archetype_details = derive_archetype(soul_data)
            product_affinity = archetype_details.get("product_affinity", [])
        except Exception as e:
            logger.warning(f"Could not derive archetype: {e}")
    
    # Determine life stage from age
    age = pet.get("age", "")
    life_stage = "adult"  # default
    if age:
        age_lower = age.lower()
        if "puppy" in age_lower or "month" in age_lower or ("year" in age_lower and any(c.isdigit() and int(c) < 2 for c in age_lower)):
            life_stage = "puppy"
        elif "senior" in age_lower or ("year" in age_lower and any(c.isdigit() and int(c) > 7 for c in age_lower)):
            life_stage = "senior"
    
    # Get health considerations
    health_issues = pet.get("health_conditions", []) or []
    allergies = pet.get("allergies", []) or []
    
    logger.info(f"[MULTI-FACTOR] Pet: {pet.get('name')}, Breed: {breed}, Archetype: {archetype_key}, Life Stage: {life_stage}")
    
    # Build query - start with breed and pillar
    query = {
        "breed": {"$regex": f"^{breed}$", "$options": "i"},  # Case-insensitive breed match
        "$or": [
            {"pillars": pillar},
            {"pillar": pillar}  # Some products use singular "pillar"
        ],
        "mockup_url": {"$exists": True, "$ne": None, "$ne": ""}
    }
    
    # Archetype display names mapping
    ARCHETYPE_DISPLAY_NAMES = {
        "wild_explorer": "Wild Explorer",
        "velcro_baby": "Velcro Baby", 
        "social_butterfly": "Social Butterfly",
        "zen_master": "Zen Master",
        "royal_dignity": "Royal Dignity",
        "playful_clown": "Playful Clown",
        "guardian_heart": "Guardian Heart",
        "gentle_aristocrat": "Gentle Aristocrat",
        "snack_negotiator": "Snack Negotiator",
        "quiet_watcher": "Quiet Watcher",
        "brave_worrier": "Brave Worrier"
    }
    
    # Personalized whisper texts based on archetype + product type
    ARCHETYPE_WHISPERS = {
        "wild_explorer": [
            "Adventure gear for explorers",
            "Built for outdoor fun",
            "Perfect for adventures"
        ],
        "velcro_baby": [
            "Extra love included",
            "Cuddle-approved",
            "Made for snuggle time"
        ],
        "social_butterfly": [
            "Party-ready pick",
            "Stand out in style", 
            "Social pup approved"
        ],
        "gentle_aristocrat": [
            "Refined elegance",
            "Sophisticated choice",
            "Premium quality pick"
        ],
        "snack_negotiator": [
            "Treat-lover tested",
            "Foodie approved",
            "Worth the wag"
        ],
        "quiet_watcher": [
            "Calm companion choice",
            "Thoughtfully selected",
            "Peaceful pup pick"
        ],
        "brave_worrier": [
            "Comfort & confidence",
            "Security blanket pick",
            "Safe & soothing"
        ]
    }
    
    # Get all matching products first
    products = await db.breed_products.find(
        query,
        {"_id": 0}
    ).to_list(length=100)
    
    # Score each product based on multi-factor matching
    scored_products = []
    for product in products:
        score = 100  # Base score
        reasons = []
        
        # Archetype affinity boost
        product_type = product.get("product_type_name", "").lower()
        if product_affinity:
            for affinity in product_affinity:
                if affinity.lower() in product_type or product_type in affinity.lower():
                    score += 50
                    # Get personalized whisper text
                    whispers = ARCHETYPE_WHISPERS.get(archetype_key, ["Perfectly matched"])
                    import random
                    whisper = random.choice(whispers)
                    reasons.append(whisper)
                    break
        
        # If no archetype reason added, add a formatted one
        if not reasons and archetype_key:
            display_name = ARCHETYPE_DISPLAY_NAMES.get(archetype_key, archetype_key.replace("_", " ").title())
            reasons.append(f"For {display_name}s")
        
        # Life stage relevance
        product_name = product.get("name", "").lower()
        if life_stage == "puppy":
            if any(term in product_name for term in ["puppy", "training", "starter", "small"]):
                score += 30
                reasons.append("Perfect for puppies")
        elif life_stage == "senior":
            if any(term in product_name for term in ["senior", "comfort", "gentle", "easy"]):
                score += 30
                reasons.append("Ideal for senior pets")
        
        # Health-aware filtering (negative scoring for incompatible items)
        if allergies:
            for allergy in allergies:
                if allergy.lower() in product_name:
                    score -= 100  # Heavily penalize
                    reasons.append(f"May contain {allergy}")
        
        scored_products.append({
            **product,
            "personalization_score": score,
            "personalization_reasons": reasons,
            "archetype_match": archetype_key,
            "life_stage_match": life_stage
        })
    
    # Sort by score and limit
    scored_products.sort(key=lambda x: x["personalization_score"], reverse=True)
    top_products = scored_products[:request.limit]
    
    return {
        "pet_name": pet.get("name"),
        "pet_breed": breed,
        "archetype": archetype_key,
        "life_stage": life_stage,
        "pillar": pillar,
        "filters_applied": {
            "breed": breed,
            "archetype": archetype_key,
            "life_stage": life_stage,
            "health_aware": len(allergies) > 0
        },
        "total_matches": len(products),
        "products": top_products
    }


@router.get("/archetype-products/{archetype_key}/{pillar}")
async def get_archetype_products(archetype_key: str, pillar: str, limit: int = 12):
    """
    Get products that match a specific archetype's product affinity.
    Used for "Recommended for [Archetype Name] personalities" sections.
    """
    db = get_db()
    
    # Get archetype details
    try:
        from soul_archetype_engine import ARCHETYPES
        archetype = ARCHETYPES.get(archetype_key)
        if not archetype:
            raise HTTPException(status_code=404, detail=f"Archetype '{archetype_key}' not found")
        
        product_affinity = archetype.get("product_affinity", [])
        copy_tone = archetype.get("copy_tone", {})
        
    except ImportError:
        raise HTTPException(status_code=500, detail="Archetype engine not available")
    
    # Query products matching any of the affinity keywords
    pillar_lower = pillar.lower()
    
    # Build regex for product type matching
    affinity_regex = "|".join([a.lower().replace(" ", ".*") for a in product_affinity])
    
    products = await db.breed_products.find(
        {
            "pillars": pillar_lower,
            "mockup_url": {"$exists": True, "$ne": None},
            "$or": [
                {"product_type_name": {"$regex": affinity_regex, "$options": "i"}},
                {"name": {"$regex": affinity_regex, "$options": "i"}}
            ]
        },
        {"_id": 0}
    ).limit(limit).to_list(length=limit)
    
    return {
        "archetype": {
            "key": archetype_key,
            "name": archetype["name"],
            "emoji": archetype["emoji"],
            "description": archetype["description"][:100] + "..."
        },
        "copy_tone": copy_tone,
        "pillar": pillar_lower,
        "product_affinity": product_affinity,
        "products": products
    }



# ═══════════════════════════════════════════════════════════════════════════════
# SOUL MADE PRODUCT MANAGEMENT - Admin CRUD
# ═══════════════════════════════════════════════════════════════════════════════

class SoulMadeProductUpdate(BaseModel):
    stock: Optional[int] = None
    variants: Optional[list] = None
    sale_price: Optional[int] = None
    description: Optional[str] = None
    soul_tier: Optional[str] = None
    price: Optional[int] = None


@router.put("/soul-made/products/{product_id}")
async def update_soul_made_product(product_id: str, update: SoulMadeProductUpdate):
    """
    Update Soul Made product details:
    - stock: inventory count (0 = unlimited/made to order)
    - variants: list of {name, price_modifier}
    - sale_price: discounted price
    - description: product description
    - soul_tier: standard/soul_made/soul_selected/soul_gifted
    - price: base price
    """
    db = get_db()
    
    # Build update dict with only non-None values
    update_dict = {}
    if update.stock is not None:
        update_dict["stock"] = update.stock
    if update.variants is not None:
        update_dict["variants"] = update.variants
    if update.sale_price is not None:
        update_dict["sale_price"] = update.sale_price
    if update.description is not None:
        update_dict["description"] = update.description
    if update.soul_tier is not None:
        update_dict["soul_tier"] = update.soul_tier
    if update.price is not None:
        update_dict["price"] = update.price
    
    if not update_dict:
        return {"message": "No updates provided", "product_id": product_id}
    
    update_dict["updated_at"] = datetime.utcnow().isoformat()
    
    # Try to find and update in breed_products collection
    result = await db.breed_products.update_one(
        {"id": product_id},
        {"$set": update_dict}
    )
    
    if result.modified_count == 0:
        # Try products_master collection as fallback
        result = await db.products_master.update_one(
            {"id": product_id},
            {"$set": update_dict}
        )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    logger.info(f"[SOUL-MADE] Updated product {product_id}: {update_dict}")
    
    return {
        "success": True,
        "message": "Product updated successfully",
        "product_id": product_id,
        "updates": update_dict
    }


@router.get("/soul-made/products")
async def list_soul_made_products(
    breed: str = None,
    pillar: str = None,
    soul_tier: str = None,
    has_mockup: bool = None,
    limit: int = 50,
    skip: int = 0
):
    """
    List Soul Made products with filtering options.
    """
    db = get_db()
    
    query = {}
    
    if breed:
        query["breed"] = {"$regex": breed, "$options": "i"}
    if pillar:
        query["$or"] = [{"pillars": pillar}, {"pillar": pillar}]
    if soul_tier:
        query["soul_tier"] = soul_tier
    if has_mockup is not None:
        if has_mockup:
            query["mockup_url"] = {"$exists": True, "$ne": None, "$ne": ""}
        else:
            query["$or"] = [
                {"mockup_url": {"$exists": False}},
                {"mockup_url": None},
                {"mockup_url": ""}
            ]
    
    products = await db.breed_products.find(
        query,
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(length=limit)
    
    total = await db.breed_products.count_documents(query)
    
    return {
        "products": products,
        "total": total,
        "limit": limit,
        "skip": skip
    }



# ═══════════════════════════════════════════════════════════════════════════════
# AI AUTO-ASSIGN PILLARS FOR PENDING PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════════

_pillar_assign_status = {
    "running": False, "total": 0, "processed": 0, "assigned": 0, "failed": 0,
    "started_at": None, "completed_at": None
}

PILLAR_MAP = {
    "adopt": ["adoption_folder", "welcome_kit", "breed_checklist", "starter_kit"],
    "care": ["care_guide", "grooming_apron", "grooming_pouch", "pet_journal", "pet_robe",
             "pet_towel", "first_bed", "crate_mat", "cushion_cover", "room_sign", "blanket",
             "collar_tag"],
    "celebrate": ["bandana", "birthday_card", "cake_topper", "frame", "keychain", "mug",
                  "milestone_book", "party_banner", "party_hat", "photo_props", "pupcake_set",
                  "return_gift_pack", "tote_bag"],
    "dine": ["bowl", "feeding_mat", "food_container", "lick_mat", "placemat", "treat_jar"],
    "emergency": ["emergency_card", "emergency_pouch", "first_aid_kit", "medical_alert_tag", "id_tag"],
    "farewell": ["keepsake_box", "memorial_candle", "memorial_ornament", "paw_print_frame",
                 "paw_print_kit", "remembrance_card"],
    "go": ["car_seat_protector", "car_sticker", "carrier_tag", "luggage_tag", "passport_holder",
           "personalized_lead", "poop_bag_holder", "travel_bowl", "travel_pouch", "walking_set",
           "welcome_mat"],
    "learn": ["learning_cards", "training_kit", "training_log", "treat_pouch"],
    "paperwork": ["document_holder", "medical_file", "pet_profile_book", "vaccine_folder"],
    "play": ["activity_toy", "breed_plush", "enrichment_mat", "fetch_toy_set", "personalized_toy",
             "play_bandana", "playdate_card", "rope_toy"],
}


def _guess_pillar(product_type: str, name: str = "") -> tuple:
    """Guess pillar from product_type using the mapping. Returns (pillar, pillars_list)."""
    pt = product_type.lower().strip()
    for pillar, types in PILLAR_MAP.items():
        if pt in types:
            return pillar, [pillar]
    
    # Fallback: keyword matching in name
    name_lower = (name or "").lower()
    keyword_map = {
        "farewell": ["memorial", "remembrance", "keepsake", "paw print"],
        "celebrate": ["birthday", "party", "cake", "celebration"],
        "care": ["groom", "towel", "robe", "bed", "cushion", "blanket"],
        "dine": ["bowl", "food", "treat", "feeding", "meal"],
        "go": ["travel", "car", "luggage", "passport", "walk"],
        "play": ["toy", "play", "fetch", "rope", "plush"],
        "learn": ["train", "learn", "flash"],
        "emergency": ["emergency", "first aid", "medical alert"],
        "adopt": ["adopt", "welcome", "starter"],
        "paperwork": ["document", "vaccine", "medical file", "profile book"],
    }
    for pillar, keywords in keyword_map.items():
        for kw in keywords:
            if kw in name_lower or kw in pt:
                return pillar, [pillar]
    
    return "shop", ["shop"]


async def _auto_assign_pillars_background(db, use_ai: bool = True):
    """Background task: auto-assign pillars to products that don't have one."""
    global _pillar_assign_status
    _pillar_assign_status = {
        "running": True, "total": 0, "processed": 0, "assigned": 0, "failed": 0,
        "started_at": datetime.utcnow().isoformat(), "completed_at": None
    }
    
    try:
        # Find products without pillar
        query = {"$or": [
            {"pillar": {"$exists": False}}, {"pillar": None}, {"pillar": ""}
        ]}
        products = await db.breed_products.find(query).to_list(2000)
        _pillar_assign_status["total"] = len(products)
        
        logger.info(f"[PILLAR-ASSIGN] Found {len(products)} products without pillar")
        
        for i, product in enumerate(products):
            _pillar_assign_status["processed"] = i + 1
            try:
                pt = product.get("product_type", "")
                name = product.get("name", "")
                pillar, pillars = _guess_pillar(pt, name)
                
                await db.breed_products.update_one(
                    {"_id": product["_id"]},
                    {"$set": {"pillar": pillar, "pillars": pillars, "updated_at": datetime.utcnow().isoformat()}}
                )
                _pillar_assign_status["assigned"] += 1
            except Exception as e:
                logger.error(f"[PILLAR-ASSIGN] Error: {e}")
                _pillar_assign_status["failed"] += 1
        
        _pillar_assign_status["completed_at"] = datetime.utcnow().isoformat()
        logger.info(f"[PILLAR-ASSIGN] Done: {_pillar_assign_status['assigned']} assigned, {_pillar_assign_status['failed']} failed")
    except Exception as e:
        logger.error(f"[PILLAR-ASSIGN] Background error: {e}")
    finally:
        _pillar_assign_status["running"] = False


@router.post("/auto-assign-pillars")
async def auto_assign_pillars(background_tasks: BackgroundTasks):
    """Auto-assign pillars to all products that are missing them. Runs in background."""
    global _pillar_assign_status
    if _pillar_assign_status["running"]:
        return {"message": "Already running", "status": _pillar_assign_status}
    
    db = get_db()
    pending = await db.breed_products.count_documents({
        "$or": [{"pillar": {"$exists": False}}, {"pillar": None}, {"pillar": ""}]
    })
    
    if pending == 0:
        return {"message": "All products already have pillars assigned", "pending": 0}
    
    background_tasks.add_task(_auto_assign_pillars_background, db)
    return {"message": f"Auto-assigning pillars for {pending} products in background", "pending": pending}


@router.get("/pillar-assign-status")
async def get_pillar_assign_status():
    """Get status of background pillar assignment."""
    return _pillar_assign_status


# ═══════════════════════════════════════════════════════════════════════════════
# AI MOCKUP IMAGE GENERATION FOR NEW PRODUCT TYPES
# ═══════════════════════════════════════════════════════════════════════════════

class GenerateProductMockupRequest(BaseModel):
    product_type: str
    breeds: Optional[List[str]] = None  # None = all breeds in DB
    pillars: List[str] = []
    price: Optional[int] = 0
    name_template: str = "{breed} {product_type}"
    description: str = ""

_mockup_gen_status = {
    "running": False, "total": 0, "generated": 0, "failed": 0,
    "current": None, "started_at": None, "completed_at": None
}


def _build_mockup_prompt(breed: str, product_type: str, name: str, colour_variant: str = "") -> str:
    """Build an AI image generation prompt for a product mockup."""
    breed_display = breed.replace("_", " ").title()
    pt_display = product_type.replace("_", " ").title()
    colour = colour_variant or BREED_COLOURS.get(breed.lower().replace(" ", "_"), "warm golden")

    prompt_map = {
        "birthday_cake": (
            f"Yappy.com style dog portrait illustration, head and face ONLY (cropped at neck, no body visible), "
            f"{colour} {breed_display} dog, "
            f"pure flat vector art with solid colour fills, absolutely NO outlines NO strokes NO gradients NO shadows, "
            f"pure white background, "
            f"small black oval eyes each with a single tiny white highlight dot, "
            f"prominent black inverted-teardrop nose centred below the eyes, "
            f"bright pink tongue peeking out from the bottom of the muzzle, "
            f"friendly happy forward-facing expression, "
            f"simplified geometric head shape characteristic of {breed_display}, "
            f"breed-accurate ear shape (e.g. floppy for Labrador, erect triangular for Husky, long droopy for Beagle), "
            f"minimalist clean flat design, bold distinct colours, "
            f"perfectly suitable for edible cake printing or fondant cake toppers, "
            f"centred composition with generous white margin, square format"
        ),
        "cake": (
            f"Yappy.com style dog portrait illustration, head and face ONLY (cropped at neck, no body visible), "
            f"{colour} {breed_display} dog, "
            f"pure flat vector art, solid colour fills, NO outlines NO gradients NO shadows, "
            f"pure white background, small black oval eyes with white highlight dot, "
            f"black teardrop nose, pink tongue, happy friendly expression, "
            f"minimalist geometric shapes, centred square composition, "
            f"suitable for edible cake printing"
        ),
        "mug": f"Professional product photography of a white ceramic coffee mug with a beautiful watercolor illustration of a {breed_display} dog printed on it. The mug is on a clean marble surface with soft studio lighting. The illustration shows the dog's face in soft watercolor style. Photorealistic product mockup.",
        "bandana": f"Professional product photography of a dog bandana laid flat on a white surface. The bandana has a beautiful watercolor illustration of a {breed_display} dog printed on the fabric. Soft cotton material, triangle fold. Clean studio lighting. Product mockup.",
        "frame": f"Professional product photo of a wooden picture frame with a beautiful watercolor portrait of a {breed_display} dog inside. The frame is on a shelf with soft lighting. Clean, elegant presentation. Product mockup.",
        "keychain": f"Professional product photo of a metal keychain with a {breed_display} dog breed silhouette design. The keychain is photographed on a clean white surface with studio lighting. Detailed engraving visible. Product mockup.",
        "tote_bag": f"Professional product photo of a canvas tote bag with a watercolor illustration of a {breed_display} dog printed on it. The bag is displayed flat on a white background. Clean studio lighting. Product mockup.",
        "bowl": f"Professional product photo of a ceramic pet food bowl with a {breed_display} dog illustration on the outer rim. The bowl is on a clean surface. Product mockup with studio lighting.",
        "blanket": f"Professional product photo of a cozy pet blanket with a watercolor {breed_display} dog pattern printed on soft fleece fabric. Folded neatly on a wooden surface. Product mockup.",
        "cake_topper": f"Professional product photo of a wooden birthday cake topper with a {breed_display} dog silhouette laser-cut design. Photographed on a white cake. Product mockup.",
        "collar_tag": f"Professional product photo of a stainless steel dog ID tag engraved with a {breed_display} dog silhouette and the name 'Buddy'. Photographed on a clean surface. Product mockup.",
        "memorial_candle": f"Professional product photo of an elegant white memorial candle in a glass jar with a watercolor {breed_display} dog illustration on the label. Soft warm lighting. Product mockup.",
        "treat_jar": f"Professional product photo of a ceramic treat jar with a {breed_display} dog illustration and the word 'Treats' on it. On a kitchen counter. Product mockup.",
        "party_hat": f"Professional product photo of a cute birthday party hat for dogs with a {breed_display} dog illustration printed on it. Colorful, festive. Product mockup.",
    }

    base = prompt_map.get(product_type)
    if not base:
        base = f"Professional product photography of a {pt_display} featuring a beautiful watercolor illustration of a {breed_display} dog. The product is displayed on a clean surface with soft studio lighting. High-quality photorealistic product mockup."

    return base


# ── Breed → characteristic colour (fallback for non-cake products) ──────────
BREED_COLOURS = {
    "indie": "warm tan ginger",
    "labrador": "golden yellow",
    "labrador_retriever": "golden yellow",
    "golden_retriever": "golden",
    "beagle": "tricolour tan black and white",
    "pug": "fawn",
    "bulldog": "white and brindle",
    "english_bulldog": "white and brindle",
    "french_bulldog": "brindle grey",
    "dachshund": "rich chocolate brown",
    "shih_tzu": "white and gold",
    "poodle": "fluffy white",
    "cocker_spaniel": "golden brown",
    "husky": "grey and white",
    "chihuahua": "tan",
    "maltese": "pure white",
    "pomeranian": "vibrant orange",
    "rottweiler": "black and tan",
    "german_shepherd": "black and tan",
    "doberman": "black and tan",
    "boxer": "fawn",
    "dalmatian": "white with black spots",
    "border_collie": "black and white",
    "akita": "red and white",
    "corgi": "golden orange",
    "australian_shepherd": "blue merle",
    "cavalier": "chestnut and white",
    "bichon_frise": "fluffy white",
    "chow_chow": "cinnamon red",
    "boston_terrier": "black and white",
    "bernese_mountain": "tricolour black brown white",
    "alaskan_malamute": "grey and white",
    "american_bully": "slate grey",
    "lhasa_apso": "golden",
    "yorkshire": "steel blue and tan",
    "basenji": "red and white",
    "samoyed": "pure white",
}

# ── Per-breed colour variants for cake illustrations (Yappy-style) ──────────
# Each entry: (colour_descriptor_for_prompt, display_label_for_UI)
BREED_COLOUR_VARIANTS: dict = {
    "indie": [
        ("warm tan ginger coat",           "Ginger"),
        ("jet black coat",                  "Black"),
        ("fawn cream coat",                 "Fawn"),
        ("brindle brown coat",              "Brindle"),
        ("white with tan patches coat",     "Patchy"),
    ],
    "labrador": [
        ("golden yellow coat",              "Yellow"),
        ("jet black coat",                  "Black"),
        ("rich chocolate brown coat",       "Chocolate"),
        ("fox red coat",                    "Fox Red"),
    ],
    "golden_retriever": [
        ("light golden cream coat",         "Light Golden"),
        ("rich dark golden coat",           "Dark Golden"),
        ("pale cream white coat",           "Cream"),
        ("deep copper red coat",            "Red"),
    ],
    "beagle": [
        ("tricolour tan black and white coat",  "Tricolour"),
        ("lemon and white coat",                "Lemon"),
        ("red and white coat",                  "Red & White"),
        ("chocolate tricolour coat",            "Chocolate Tri"),
    ],
    "husky": [
        ("grey and white coat with bright blue eyes",                           "Blue Eyes"),
        ("black and white coat with heterochromatic one blue one amber eye",    "Hetero Eyes"),
        ("pure white coat with pale blue eyes",                                 "White"),
        ("agouti grey and white coat",                                          "Agouti"),
    ],
    "pug": [
        ("fawn coat with black face mask",  "Fawn"),
        ("jet black coat",                  "Black"),
        ("silver grey coat",                "Silver"),
    ],
    "german_shepherd": [
        ("black and tan saddle coat",       "Black & Tan"),
        ("sable dark grey coat",            "Sable"),
        ("all black coat",                  "Black"),
        ("white coat",                      "White"),
    ],
    "poodle": [
        ("fluffy white coat",               "White"),
        ("apricot cream coat",              "Apricot"),
        ("silver grey coat",                "Silver"),
        ("jet black coat",                  "Black"),
    ],
    "cocker_spaniel": [
        ("golden brown coat",               "Golden"),
        ("black coat",                      "Black"),
        ("roan blue and white coat",        "Blue Roan"),
        ("chocolate and tan coat",          "Chocolate"),
    ],
    "dachshund": [
        ("rich chocolate brown coat",       "Chocolate"),
        ("red coat",                        "Red"),
        ("black and tan coat",              "Black & Tan"),
        ("dapple merle coat",               "Dapple"),
    ],
    "shih_tzu": [
        ("white and gold coat",             "Gold & White"),
        ("solid gold coat",                 "Gold"),
        ("black and white coat",            "Black & White"),
        ("liver and white coat",            "Liver"),
    ],
    "chihuahua": [
        ("tan coat",                        "Tan"),
        ("fawn coat",                       "Fawn"),
        ("black and tan coat",              "Black & Tan"),
        ("white coat",                      "White"),
    ],
    "border_collie": [
        ("black and white coat",            "Black & White"),
        ("red and white coat",              "Red & White"),
        ("blue merle coat",                 "Blue Merle"),
        ("tricolour coat",                  "Tri"),
    ],
    "dalmatian": [
        ("white with black spots coat",     "Black Spots"),
        ("white with liver brown spots coat","Liver Spots"),
    ],
    "rottweiler": [
        ("black and tan coat",              "Black & Tan"),
        ("black and mahogany coat",         "Mahogany"),
    ],
}

# Default variants for breeds not in the map above (3 generic colour variants)
DEFAULT_VARIANTS = [
    ("natural coat colour",         "Natural"),
    ("light coat colour variant",   "Light"),
    ("dark coat colour variant",    "Dark"),
]


async def _generate_breed_cake_art(db, breeds: list):
    """
    Background task: generate Yappy-style face-only cake illustrations.
    Creates 3-5 colour variant products per breed.
    Uses birthday_cake prompt type.
    """
    global _mockup_gen_status

    all_variants = []
    for breed in breeds:
        variants = BREED_COLOUR_VARIANTS.get(breed.lower().replace(" ", "_"), DEFAULT_VARIANTS)
        for colour, label in variants:
            all_variants.append((breed, colour, label))

    _mockup_gen_status.update({
        "running": True, "current": None,
        "generated": 0, "failed": 0, "skipped": 0,
        "total": len(all_variants),
        "started_at": datetime.utcnow().isoformat(),
        "completed_at": None,
    })

    logger.info(f"[CAKE-ART] Starting Yappy-style generation: {len(all_variants)} variants across {len(breeds)} breeds")

    try:
        for breed, colour, label in all_variants:
            if not _mockup_gen_status["running"]:
                logger.info("[CAKE-ART] Stopped by request")
                break

            safe_breed   = breed.lower().replace(" ", "_")
            safe_label   = label.lower().replace(" & ", "_").replace(" ", "_").replace("/", "_")
            product_id   = f"cake-{safe_breed}-{safe_label}"
            display_name = f"{breed.replace('_',' ').title()} — {label}"

            _mockup_gen_status["current"] = f"{display_name} ({_mockup_gen_status['generated']+1}/{len(all_variants)})"

            # Skip if already exists with a mockup
            existing = await db.breed_products.find_one({"id": product_id}, {"_id": 0, "mockup_url": 1})
            if existing and existing.get("mockup_url"):
                logger.info(f"[CAKE-ART] Skip {product_id} — already has image")
                _mockup_gen_status["skipped"] = _mockup_gen_status.get("skipped", 0) + 1
                continue

            prompt = _build_mockup_prompt(breed, "birthday_cake", display_name, colour)

            try:
                img_url = await _generate_mockup_image(prompt, product_id, breed)

                if img_url:
                    doc = {
                        "id":           product_id,
                        "breed":        safe_breed,
                        "breed_display": breed.replace("_", " ").title(),
                        "name":         display_name,
                        "product_type": "birthday_cake",
                        "colour_variant": colour,
                        "colour_label": label,
                        "price":        950,
                        "description":  f"Yappy-style flat face illustration — {label} {breed.replace('_',' ').title()} — for cake printing",
                        "mockup_url":   img_url,
                        "cloudinary_url": img_url if img_url.startswith("http") else None,
                        "image_url":    img_url,
                        "pillars":      ["celebrate"],
                        "pillar":       "celebrate",
                        "is_mockup":    True,
                        "is_active":    True,
                        "created_at":   datetime.utcnow().isoformat(),
                        "mockup_prompt": prompt,
                    }
                    await db.breed_products.update_one(
                        {"id": product_id},
                        {"$set": doc},
                        upsert=True
                    )
                    _mockup_gen_status["generated"] += 1
                    logger.info(f"[CAKE-ART] ✓ {display_name}")
                else:
                    _mockup_gen_status["failed"] += 1
                    logger.warning(f"[CAKE-ART] ✗ No image returned for {display_name}")

                await asyncio.sleep(4)  # Rate limit

            except Exception as e:
                logger.error(f"[CAKE-ART] Error for {display_name}: {e}")
                _mockup_gen_status["failed"] += 1

    except Exception as e:
        logger.error(f"[CAKE-ART] Fatal error: {e}")
    finally:
        _mockup_gen_status["running"]      = False
        _mockup_gen_status["current"]      = None
        _mockup_gen_status["completed_at"] = datetime.utcnow().isoformat()
        logger.info(f"[CAKE-ART] Done — {_mockup_gen_status['generated']} generated, {_mockup_gen_status['failed']} failed")


async def _generate_mockups_for_type(db, product_type: str, breeds: List[str], pillars: List[str], price: int, name_template: str, description: str):
    """Background: generate AI mockup images for a product type across breeds."""
    global _mockup_gen_status
    _mockup_gen_status = {
        "running": True, "total": len(breeds), "generated": 0, "failed": 0,
        "current": None, "started_at": datetime.utcnow().isoformat(), "completed_at": None
    }
    
    try:
        for i, breed in enumerate(breeds):
            if not _mockup_gen_status["running"]:
                break
            
            product_id = f"bp-{breed}-{product_type}"
            display_name = name_template.replace("{breed}", breed.replace("_", " ").title()).replace("{product_type}", product_type.replace("_", " ").title())
            _mockup_gen_status["current"] = f"{display_name} ({i+1}/{len(breeds)})"
            
            try:
                prompt = _build_mockup_prompt(breed, product_type, display_name)
                slug = f"breed-{breed}-{product_type}"
                
                mockup_url = await _generate_mockup_image(prompt, slug, breed)
                
                if mockup_url:
                    pillar = pillars[0] if pillars else _guess_pillar(product_type, display_name)[0]
                    await db.breed_products.update_one(
                        {"breed": breed, "product_type": product_type},
                        {"$set": {
                            "id": product_id,
                            "name": display_name,
                            "product_type": product_type,
                            "breed": breed,
                            "pillar": pillar,
                            "pillars": pillars if pillars else [pillar],
                            "price": price,
                            "description": description or f"Beautiful {display_name} featuring soulful watercolor breed illustration.",
                            "mockup_url": mockup_url,
                            "cloudinary_url": mockup_url if mockup_url.startswith("http") else None,
                            "image_url": mockup_url,
                            "is_mockup": True,
                            "is_active": True,
                            "active": True,
                            "mockup_generated_at": datetime.utcnow().isoformat(),
                            "updated_at": datetime.utcnow().isoformat(),
                        },
                        "$setOnInsert": {"created_at": datetime.utcnow().isoformat()}},
                        upsert=True
                    )
                    _mockup_gen_status["generated"] += 1
                    logger.info(f"[MOCKUP-GEN] Generated {slug}")
                else:
                    _mockup_gen_status["failed"] += 1
                    logger.warning(f"[MOCKUP-GEN] Failed {slug}")
                
                await asyncio.sleep(3)  # Rate limit
                
            except Exception as e:
                logger.error(f"[MOCKUP-GEN] Error for {breed}/{product_type}: {e}")
                _mockup_gen_status["failed"] += 1
        
        _mockup_gen_status["completed_at"] = datetime.utcnow().isoformat()
        logger.info(f"[MOCKUP-GEN] Complete: {_mockup_gen_status['generated']} generated, {_mockup_gen_status['failed']} failed")
    except Exception as e:
        logger.error(f"[MOCKUP-GEN] Background error: {e}")
    finally:
        _mockup_gen_status["running"] = False
        _mockup_gen_status["current"] = None


@router.post("/generate-product-type")
async def generate_mockups_for_product_type(request: GenerateProductMockupRequest, background_tasks: BackgroundTasks):
    """Generate AI mockup images for a product type across selected breeds. Runs in background."""
    global _mockup_gen_status
    if _mockup_gen_status["running"]:
        return {"message": "Generation already running", "status": _mockup_gen_status}
    
    db = get_db()
    
    if request.breeds:
        breeds = request.breeds
    else:
        breeds = await db.breed_products.distinct("breed")
        breeds = [b for b in breeds if b and b != "all"]
    
    if not breeds:
        return {"message": "No breeds found", "breeds": 0}
    
    background_tasks.add_task(
        _generate_mockups_for_type, db,
        request.product_type.lower().strip(),
        breeds, request.pillars, request.price or 0,
        request.name_template, request.description
    )
    
    return {
        "message": f"Generating mockups for {request.product_type} across {len(breeds)} breeds",
        "breeds": len(breeds),
        "product_type": request.product_type,
        "check_status": "/api/mockups/mockup-gen-status"
    }


@router.get("/mockup-gen-status")
async def get_mockup_gen_status():
    """Get status of product type mockup generation."""
    return _mockup_gen_status


@router.post("/stop-mockup-gen")
async def stop_mockup_gen():
    """Stop background mockup generation."""
    global _mockup_gen_status
    if not _mockup_gen_status["running"]:
        return {"message": "No generation in progress"}
    _mockup_gen_status["running"] = False
    return {"message": "Generation will stop after current item"}


@router.post("/generate-breed-cakes")
async def generate_breed_cake_illustrations(background_tasks: BackgroundTasks, breeds: Optional[List[str]] = None):
    """
    Generate Yappy-style flat face-only cake illustrations with colour variants per breed.
    Indie gets 5 variants, most breeds get 3-4 variants.
    """
    global _mockup_gen_status
    if _mockup_gen_status.get("running"):
        return {"message": "Generation already running", "status": _mockup_gen_status}

    db = get_db()
    all_breeds = breeds or [b for b in await db.breed_products.distinct("breed") if b and b != "all"]
    if not all_breeds:
        return {"message": "No breeds found"}

    # Count total variants
    total_variants = sum(
        len(BREED_COLOUR_VARIANTS.get(b.lower().replace(" ","_"), DEFAULT_VARIANTS))
        for b in all_breeds
    )

    background_tasks.add_task(_generate_breed_cake_art, db, all_breeds)

    return {
        "message": f"Generating Yappy-style face illustrations for {len(all_breeds)} breeds ({total_variants} colour variants total)",
        "breeds": len(all_breeds),
        "total_variants": total_variants,
        "indie_variants": len(BREED_COLOUR_VARIANTS.get("indie", DEFAULT_VARIANTS)),
        "check_status": "/api/mockups/mockup-gen-status",
    }

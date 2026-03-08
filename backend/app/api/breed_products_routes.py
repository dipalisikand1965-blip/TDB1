"""
Breed Products API Routes
=========================
Endpoints for breed-specific personalized products.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import logging
import asyncio
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/breed-products", tags=["Breed Products"])

# Database reference
_db = None

def set_breed_products_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


@router.get("/all")
async def get_all_breed_products(limit: int = 100, skip: int = 0):
    """Get all breed products."""
    db = get_db()
    
    products = await db.breed_products.find(
        {},
        {"_id": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    total = await db.breed_products.count_documents({})
    
    return {
        "products": products,
        "total": total,
        "limit": limit,
        "skip": skip
    }


@router.get("/by-breed/{breed}")
async def get_products_by_breed(breed: str):
    """Get all products for a specific breed."""
    db = get_db()
    
    products = await db.breed_products.find(
        {"breed": breed.lower().replace(" ", "_")},
        {"_id": 0}
    ).to_list(20)
    
    return {"breed": breed, "products": products, "count": len(products)}


@router.get("/by-type/{product_type}")
async def get_products_by_type(product_type: str):
    """Get all products of a specific type (mug, bandana, etc.)."""
    db = get_db()
    
    products = await db.breed_products.find(
        {"product_type": product_type.lower()},
        {"_id": 0}
    ).to_list(50)
    
    return {"product_type": product_type, "products": products, "count": len(products)}


@router.get("/by-pillar/{pillar}")
async def get_products_by_pillar(pillar: str):
    """Get all products for a specific pillar."""
    db = get_db()
    
    products = await db.breed_products.find(
        {"pillar": pillar.lower()},
        {"_id": 0}
    ).to_list(100)
    
    return {"pillar": pillar, "products": products, "count": len(products)}


@router.get("/product/{product_id}")
async def get_product(product_id: str):
    """Get a specific breed product by ID."""
    db = get_db()
    
    product = await db.breed_products.find_one(
        {"id": product_id},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.get("/stats")
async def get_breed_products_stats():
    """Get statistics on breed products."""
    db = get_db()
    
    total = await db.breed_products.count_documents({})
    with_mockups = await db.breed_products.count_documents({"mockup_url": {"$ne": None}})
    
    # By product type
    pipeline = [
        {"$group": {"_id": "$product_type", "count": {"$sum": 1}}}
    ]
    by_type = await db.breed_products.aggregate(pipeline).to_list(20)
    
    # By breed
    pipeline = [
        {"$group": {"_id": "$breed", "count": {"$sum": 1}}}
    ]
    by_breed = await db.breed_products.aggregate(pipeline).to_list(40)
    
    # By pillar
    pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}}
    ]
    by_pillar = await db.breed_products.aggregate(pipeline).to_list(10)
    
    return {
        "total_products": total,
        "with_mockups": with_mockups,
        "pending_mockups": total - with_mockups,
        "by_product_type": {item["_id"]: item["count"] for item in by_type},
        "by_breed": {item["_id"]: item["count"] for item in by_breed},
        "by_pillar": {item["_id"]: item["count"] for item in by_pillar}
    }


@router.get("/customization-options")
async def get_customization_options():
    """Get all available customization options."""
    return {
        "pet_name": {
            "type": "text",
            "label": "Pet Name",
            "placeholder": "Enter your pet's name",
            "max_length": 20,
            "required": True
        },
        "age": {
            "type": "number",
            "label": "Age",
            "placeholder": "Pet's age",
            "min": 1,
            "max": 25
        },
        "message": {
            "type": "text",
            "label": "Cake Message",
            "placeholder": "Happy Birthday [Name]!",
            "max_length": 50
        },
        "custom_quote": {
            "type": "text",
            "label": "Custom Quote",
            "placeholder": "Forever in our hearts",
            "max_length": 100
        },
        "size": {
            "type": "select",
            "label": "Size",
            "options": [
                {"value": "S", "label": "Small"},
                {"value": "M", "label": "Medium"},
                {"value": "L", "label": "Large"},
                {"value": "XL", "label": "Extra Large"}
            ]
        },
        "custom_saying": {
            "type": "select",
            "label": "Custom Saying",
            "options": [
                {"value": "none", "label": "No text"},
                {"value": "best_dog", "label": "Best Dog Ever"},
                {"value": "fur_baby", "label": "Fur Baby"},
                {"value": "rescue_dog", "label": "Rescue Dog"},
                {"value": "loved", "label": "Loved Beyond Words"},
                {"value": "custom", "label": "Custom text..."}
            ]
        },
        "custom_text": {
            "type": "text",
            "label": "Custom Text",
            "placeholder": "Best Dog Mom",
            "max_length": 30
        },
        "phone_number": {
            "type": "text",
            "label": "Phone Number",
            "placeholder": "For ID tag",
            "max_length": 15
        }
    }


@router.post("/generate-mockups")
async def trigger_mockup_generation(
    background_tasks: BackgroundTasks,
    breed: Optional[str] = None,
    product_type: Optional[str] = None,
    limit: int = 10
):
    """
    Trigger mockup generation for breed products.
    Runs in background to avoid timeout.
    """
    db = get_db()
    
    # Build filter
    filter_query = {"mockup_url": None}
    if breed:
        filter_query["breed"] = breed.lower().replace(" ", "_")
    if product_type:
        filter_query["product_type"] = product_type.lower()
    
    # Get products needing mockups
    pending = await db.breed_products.count_documents(filter_query)
    
    # Start background task
    background_tasks.add_task(
        generate_mockups_background,
        db,
        filter_query,
        min(limit, pending)
    )
    
    return {
        "status": "started",
        "pending_mockups": pending,
        "generating": min(limit, pending),
        "message": f"Generating {min(limit, pending)} mockups in background"
    }


async def generate_mockups_background(db, filter_query, limit):
    """Background task to generate mockups."""
    try:
        from emergentintegrations.llm.gemini import GeminiImageGeneration
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            logger.error("EMERGENT_LLM_KEY not found")
            return
        
        products = await db.breed_products.find(
            filter_query,
            {"_id": 0}
        ).limit(limit).to_list(limit)
        
        image_gen = GeminiImageGeneration(api_key=api_key)
        
        for product in products:
            try:
                result = await image_gen.generate_image(
                    prompt=product["mockup_prompt"],
                    model="imagen-3.0-generate-002"
                )
                
                if result and result.get("image_url"):
                    await db.breed_products.update_one(
                        {"id": product["id"]},
                        {"$set": {"mockup_url": result["image_url"]}}
                    )
                    logger.info(f"Generated mockup for {product['id']}")
                
                # Small delay to avoid rate limits
                await asyncio.sleep(2)
                
            except Exception as e:
                logger.error(f"Failed to generate mockup for {product['id']}: {e}")
        
    except Exception as e:
        logger.error(f"Background mockup generation failed: {e}")


@router.get("/for-pet/{pet_id}")
async def get_products_for_pet(pet_id: str):
    """
    Get personalized breed products for a specific pet.
    Returns products matching the pet's breed.
    """
    db = get_db()
    
    # Get pet info
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "name": 1, "breed": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    pet_breed = (pet.get("breed") or "indie").lower().replace(" ", "_")
    
    # Get matching products
    products = await db.breed_products.find(
        {"breed": pet_breed},
        {"_id": 0}
    ).to_list(20)
    
    # Personalize the product names
    pet_name = pet.get("name", "Your Pet")
    for product in products:
        product["personalized_name"] = product["name"].replace(
            product.get("breed_name", ""),
            f"{pet_name}'s"
        )
    
    return {
        "pet_name": pet_name,
        "pet_breed": pet_breed,
        "products": products,
        "count": len(products)
    }

"""
Product Mockup API Routes
=========================
Endpoints for generating AI-powered personalized product mockups.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mockups", tags=["Product Mockups"])

# Database reference
_db = None

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
            {"type": "mug", "description": "Coffee/tea mugs with pet illustration"},
            {"type": "bowl", "description": "Pet food/water bowls with name"},
            {"type": "cake", "description": "Birthday cakes with pet decoration"},
            {"type": "bandana", "description": "Pet bandanas with embroidered name"},
            {"type": "frame", "description": "Photo frames with pet portrait"},
            {"type": "treat_box", "description": "Treat boxes with personalized label"},
            {"type": "collar_tag", "description": "Pet ID tags with engraved name"},
            {"type": "tote_bag", "description": "Tote bags for dog parents"}
        ]
    }

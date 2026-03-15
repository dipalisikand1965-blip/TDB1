"""
Bundle Routes - CRUD API for Curated Bundles
Allows admin to create, edit, and manage product bundles
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bundles", tags=["bundles"])

# Module-level database reference
_db = None

def set_bundle_db(database):
    """Initialize bundle routes with database reference"""
    global _db
    _db = database
    logger.info("Bundle routes initialized with database")

def get_db():
    """Get database reference"""
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db

# Pydantic Models
class BundleItem(BaseModel):
    product_id: Optional[str] = None
    product_name: str
    product_type: Optional[str] = None

class BundleCreate(BaseModel):
    name: str
    description: str
    pillar: str  # celebrate, dine, travel, care, etc.
    items: List[str]  # List of product names/types
    original_price: float
    bundle_price: float
    icon: str = "📦"
    popular: bool = False
    active: bool = True

class BundleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    pillar: Optional[str] = None
    items: Optional[List[str]] = None
    original_price: Optional[float] = None
    bundle_price: Optional[float] = None
    icon: Optional[str] = None
    popular: Optional[bool] = None
    active: Optional[bool] = None

@router.get("")
async def get_bundles(
    pillar: Optional[str] = None,
    active_only: bool = True
):
    """Get all bundles, optionally filtered by pillar"""
    try:
        db = get_db()
        query = {}
        if pillar:
            query["pillar"] = pillar
        if active_only:
            query["active"] = True
        
        cursor = db.bundles.find(query, {"_id": 0})
        bundles = await cursor.to_list(length=100)
        
        # If no bundles in DB, return default bundles
        if not bundles:
            bundles = get_default_bundles(pillar)
        
        return {
            "bundles": bundles,
            "total": len(bundles),
            "pillar": pillar
        }
    except Exception as e:
        logger.error(f"Error fetching bundles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{bundle_id}")
async def get_bundle(bundle_id: str):
    """Get a specific bundle by ID"""
    try:
        db = get_db()
        bundle = await db.bundles.find_one({"id": bundle_id}, {"_id": 0})
        if not bundle:
            raise HTTPException(status_code=404, detail="Bundle not found")
        return bundle
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching bundle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_bundle(bundle: BundleCreate):
    """Create a new bundle"""
    try:
        db = get_db()
        # Generate unique ID
        bundle_id = f"{bundle.pillar}-{bundle.name.lower().replace(' ', '-')}-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        
        # Calculate discount percentage
        discount = round((1 - bundle.bundle_price / bundle.original_price) * 100) if bundle.original_price > 0 else 0
        
        bundle_doc = {
            "id": bundle_id,
            "name": bundle.name,
            "description": bundle.description,
            "pillar": bundle.pillar,
            "items": bundle.items,
            "original_price": bundle.original_price,
            "bundle_price": bundle.bundle_price,
            "discount": discount,
            "icon": bundle.icon,
            "popular": bundle.popular,
            "active": bundle.active,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.bundles.insert_one(bundle_doc)
        
        # Remove _id before returning
        bundle_doc.pop("_id", None)
        
        logger.info(f"Created bundle: {bundle_id}")
        return {"message": "Bundle created", "bundle": bundle_doc}
    except Exception as e:
        logger.error(f"Error creating bundle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{bundle_id}")
async def update_bundle(bundle_id: str, updates: BundleUpdate):
    """Update an existing bundle"""
    try:
        db = get_db()
        # Build update document
        update_doc = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        for field, value in updates.dict(exclude_unset=True).items():
            if value is not None:
                update_doc[field] = value
        
        # Recalculate discount if prices changed
        if "original_price" in update_doc or "bundle_price" in update_doc:
            bundle = await db.bundles.find_one({"id": bundle_id})
            if bundle:
                original = update_doc.get("original_price", bundle.get("original_price", 0))
                bundle_price = update_doc.get("bundle_price", bundle.get("bundle_price", 0))
                if original > 0:
                    update_doc["discount"] = round((1 - bundle_price / original) * 100)
        
        result = await db.bundles.update_one(
            {"id": bundle_id},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bundle not found")
        
        # Get updated bundle
        updated_bundle = await db.bundles.find_one({"id": bundle_id}, {"_id": 0})
        
        logger.info(f"Updated bundle: {bundle_id}")
        return {"message": "Bundle updated", "bundle": updated_bundle}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating bundle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{bundle_id}/pricing")
async def update_bundle_pricing(bundle_id: str, pricing: dict):
    """Update bundle pricing fields only (original_price, bundle_price, active)"""
    try:
        db = get_db()
        allowed = {"original_price", "bundle_price", "active"}
        update_doc = {k: v for k, v in pricing.items() if k in allowed}
        update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Recalculate discount
        bundle = await db.bundles.find_one({"id": bundle_id})
        if bundle:
            original = update_doc.get("original_price", bundle.get("original_price", 0))
            bp = update_doc.get("bundle_price", bundle.get("bundle_price", 0))
            if original > 0:
                update_doc["discount"] = round((1 - bp / original) * 100)

        result = await db.bundles.update_one({"id": bundle_id}, {"$set": update_doc})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bundle not found")

        updated = await db.bundles.find_one({"id": bundle_id}, {"_id": 0})
        return {"message": "Bundle pricing updated", "bundle": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating bundle pricing: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{bundle_id}")
async def delete_bundle(bundle_id: str):
    """Delete a bundle (soft delete - sets active=False)"""
    try:
        db = get_db()
        result = await db.bundles.update_one(
            {"id": bundle_id},
            {"$set": {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bundle not found")
        
        logger.info(f"Deleted (deactivated) bundle: {bundle_id}")
        return {"message": "Bundle deleted", "bundle_id": bundle_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting bundle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed-defaults")
async def seed_default_bundles():
    """Seed the database with default bundles"""
    try:
        db = get_db()
        default_bundles = get_all_default_bundles()
        
        inserted = 0
        for bundle in default_bundles:
            # Check if bundle already exists
            existing = await db.bundles.find_one({"id": bundle["id"]})
            if not existing:
                bundle["created_at"] = datetime.now(timezone.utc).isoformat()
                bundle["updated_at"] = datetime.now(timezone.utc).isoformat()
                await db.bundles.insert_one(bundle)
                inserted += 1
        
        total = await db.bundles.count_documents({})
        
        logger.info(f"Seeded {inserted} default bundles")
        return {
            "message": f"Seeded {inserted} new bundles",
            "total_bundles": total
        }
    except Exception as e:
        logger.error(f"Error seeding bundles: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_default_bundles(pillar: Optional[str] = None) -> List[dict]:
    """Get default bundles, optionally filtered by pillar"""
    all_bundles = get_all_default_bundles()
    if pillar:
        return [b for b in all_bundles if b["pillar"] == pillar]
    return all_bundles

def get_all_default_bundles() -> List[dict]:
    """Return all default bundle configurations"""
    return [
        # Celebrate
        {
            "id": "celebrate-birthday-bundle",
            "name": "Birthday Pawty Bundle",
            "description": "Everything for the perfect birthday celebration",
            "pillar": "celebrate",
            "items": ["Party Hat", "Birthday Bandana", "Celebration Mug", "Treat Jar"],
            "original_price": 2196,
            "bundle_price": 1799,
            "discount": 18,
            "icon": "🎂",
            "popular": True,
            "active": True
        },
        {
            "id": "celebrate-gotcha-bundle",
            "name": "Gotcha Day Bundle",
            "description": "Celebrate the day they joined your family",
            "pillar": "celebrate",
            "items": ["Welcome Mat", "Photo Frame", "Celebration Bandana"],
            "original_price": 1697,
            "bundle_price": 1399,
            "discount": 17,
            "icon": "🏠",
            "popular": False,
            "active": True
        },
        # Travel
        {
            "id": "travel-adventure-bundle",
            "name": "Adventure Ready Bundle",
            "description": "Everything for trips with your furry friend",
            "pillar": "travel",
            "items": ["Passport Holder", "Carrier Tag", "Travel Bowl", "Luggage Tag"],
            "original_price": 1896,
            "bundle_price": 1499,
            "discount": 21,
            "icon": "✈️",
            "popular": True,
            "active": True
        },
        {
            "id": "travel-road-trip-bundle",
            "name": "Road Trip Essentials",
            "description": "Perfect for car adventures",
            "pillar": "travel",
            "items": ["Travel Bowl", "Pet Towel", "Car Bandana"],
            "original_price": 1347,
            "bundle_price": 1099,
            "discount": 18,
            "icon": "🚗",
            "popular": False,
            "active": True
        },
        # Dine
        {
            "id": "dine-mealtime-bundle",
            "name": "Premium Mealtime Bundle",
            "description": "Elevate every meal with personalized gear",
            "pillar": "dine",
            "items": ["Food Bowl", "Treat Jar", "Feeding Mat", "Food Scoop"],
            "original_price": 2296,
            "bundle_price": 1799,
            "discount": 22,
            "icon": "🍽️",
            "popular": True,
            "active": True
        },
        {
            "id": "dine-treats-bundle",
            "name": "Treat Lover Bundle",
            "description": "For the treat-motivated pup",
            "pillar": "dine",
            "items": ["Treat Jar", "Treat Pouch", "Training Treats Bag"],
            "original_price": 1497,
            "bundle_price": 1199,
            "discount": 20,
            "icon": "🦴",
            "popular": False,
            "active": True
        },
        # Care
        {
            "id": "care-grooming-bundle",
            "name": "Spa Day Bundle",
            "description": "Complete grooming essentials",
            "pillar": "care",
            "items": ["Pet Robe", "Grooming Apron", "Pet Towel"],
            "original_price": 1847,
            "bundle_price": 1449,
            "discount": 21,
            "icon": "🛁",
            "popular": True,
            "active": True
        },
        # Stay
        {
            "id": "stay-comfort-bundle",
            "name": "Home Comfort Bundle",
            "description": "Make home the coziest place",
            "pillar": "stay",
            "items": ["Cozy Blanket", "Cushion Cover", "Room Sign"],
            "original_price": 1797,
            "bundle_price": 1399,
            "discount": 22,
            "icon": "🏠",
            "popular": True,
            "active": True
        },
        # Fit
        {
            "id": "fit-walker-bundle",
            "name": "Daily Walker Bundle",
            "description": "Everything for daily walks",
            "pillar": "fit",
            "items": ["Walking Leash", "Training Pouch", "Poop Bag Holder"],
            "original_price": 1497,
            "bundle_price": 1199,
            "discount": 20,
            "icon": "🚶",
            "popular": True,
            "active": True
        },
        # Farewell - Memorial Bundles
        {
            "id": "farewell-memorial-bundle",
            "name": "Forever in Heart Bundle",
            "description": "Cherish their memory forever",
            "pillar": "farewell",
            "items": ["Memorial Ornament", "Paw Print Frame", "Memory Mug"],
            "original_price": 1897,
            "bundle_price": 1499,
            "discount": 21,
            "icon": "🌈",
            "popular": True,
            "active": True
        },
        {
            "id": "farewell-keepsake-bundle",
            "name": "Precious Memories Bundle",
            "description": "Beautiful keepsakes to honor their legacy",
            "pillar": "farewell",
            "items": ["Photo Engraved Frame", "Memorial Garden Stone", "Pawprint Keychain", "Memory Box"],
            "original_price": 2499,
            "bundle_price": 1899,
            "discount": 24,
            "icon": "💜",
            "popular": False,
            "active": True
        },
        {
            "id": "farewell-tribute-bundle",
            "name": "Loving Tribute Bundle",
            "description": "A complete memorial collection",
            "pillar": "farewell",
            "items": ["Angel Wing Ornament", "Rainbow Bridge Frame", "Heart Pendant", "Memorial Candle"],
            "original_price": 2199,
            "bundle_price": 1699,
            "discount": 23,
            "icon": "🕊️",
            "popular": False,
            "active": True
        },
        # Adopt Bundles
        {
            "id": "adopt-day1-essentials",
            "name": "Day 1 Essentials Bundle",
            "description": "Everything you need before bringing your new dog home",
            "pillar": "adopt",
            "items": ["Starter Bowl Set", "First Collar", "Leash", "ID Tag", "Pee Pads", "Bed", "Blanket"],
            "original_price": 3999,
            "bundle_price": 2999,
            "discount": 25,
            "icon": "📦",
            "popular": True,
            "active": True
        },
        {
            "id": "adopt-comfort-bundle",
            "name": "Comfort & Settling Bundle",
            "description": "Help your rescue feel safe and secure in their new home",
            "pillar": "adopt",
            "items": ["Calming Blanket", "Snuggle Toy", "Crate Cover", "Lick Mat", "Calming Mat"],
            "original_price": 3499,
            "bundle_price": 2699,
            "discount": 23,
            "icon": "💆",
            "popular": False,
            "active": True
        },
        {
            "id": "adopt-puppy-starter",
            "name": "New Puppy Starter Kit",
            "description": "Complete essentials for your new puppy's first month",
            "pillar": "adopt",
            "items": ["Puppy Food Bowl", "Training Treats", "Clicker", "Pee Pads", "Chew Toys", "Crate Mat", "Brush"],
            "original_price": 2999,
            "bundle_price": 2299,
            "discount": 23,
            "icon": "🐶",
            "popular": False,
            "active": True
        }
    ]


@router.post("/sync-to-production")
async def sync_bundles_to_production():
    """
    Server-side sync of all bundles to production.
    """
    import httpx
    
    db = get_db()
    PRODUCTION_URL = "https://thedoggycompany.com"
    
    try:
        # Get all active bundles
        cursor = db.bundles.find({"active": True}, {"_id": 0})
        bundles = await cursor.to_list(length=100)
        
        if not bundles:
            return {
                "success": False,
                "message": "No bundles found to sync",
                "synced": 0
            }
        
        logger.info(f"[BUNDLE SYNC] Found {len(bundles)} bundles to sync")
        
        # Send to production
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{PRODUCTION_URL}/api/bundles/import",
                json={"bundles": bundles},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"[BUNDLE SYNC] Production sync successful: {result}")
                return {
                    "success": True,
                    "message": f"Synced {result.get('imported', len(bundles))} bundles to production",
                    "synced": result.get("imported", len(bundles))
                }
            else:
                logger.error(f"[BUNDLE SYNC] Failed: {response.status_code}")
                return {
                    "success": False,
                    "message": f"Sync failed: {response.status_code}",
                    "error": response.text[:200]
                }
                
    except Exception as e:
        logger.error(f"[BUNDLE SYNC] Error: {e}")
        return {
            "success": False,
            "message": f"Sync error: {str(e)}",
            "synced": 0
        }

@router.post("/import")
async def import_bundles(data: dict):
    """
    Import bundles from another environment (preview -> production).
    """
    try:
        db = get_db()
        bundles = data.get("bundles", [])
        
        if not bundles:
            return {"imported": 0, "message": "No bundles provided"}
        
        imported = 0
        updated = 0
        
        for bundle in bundles:
            bundle_id = bundle.get("id")
            if not bundle_id:
                continue
            
            # Check if exists
            existing = await db.bundles.find_one({"id": bundle_id})
            
            if existing:
                # Update existing
                await db.bundles.update_one(
                    {"id": bundle_id},
                    {"$set": bundle}
                )
                updated += 1
            else:
                # Insert new
                await db.bundles.insert_one(bundle)
                imported += 1
        
        logger.info(f"[BUNDLE IMPORT] Imported {imported}, Updated {updated}")
        return {
            "imported": imported,
            "updated": updated,
            "total": imported + updated
        }
    except Exception as e:
        logger.error(f"[BUNDLE IMPORT] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{bundle_id}/generate-image")
async def generate_bundle_image(bundle_id: str):
    """
    Generate AI composite image for a bundle showing all items together.
    Uses the same AI mockup system as products.
    """
    import os
    import httpx
    import cloudinary
    import cloudinary.uploader
    
    db = get_db()
    
    try:
        # Get the bundle
        bundle = await db.bundles.find_one({"id": bundle_id}, {"_id": 0})
        if not bundle:
            raise HTTPException(status_code=404, detail="Bundle not found")
        
        # Build AI prompt based on bundle items and pillar
        items_text = ", ".join(bundle.get("items", []))
        pillar = bundle.get("pillar", "general")
        bundle_name = bundle.get("name", "Bundle")
        
        # Pillar-specific styling
        pillar_styles = {
            "celebrate": "joyful watercolor celebration still life with ribbons, cake, and keepsakes",
            "travel": "watercolor travel kit composition with maps, tags, and carrier accessories",
            "dine": "watercolor dining still life with bowls, treats, and mealtime accessories",
            "care": "watercolor wellness arrangement with grooming and care essentials",
            "stay": "watercolor cozy home vignette with bedding and comfort items",
            "fit": "watercolor movement bundle layout with active gear and outdoor energy",
            "farewell": "peaceful memorial watercolor arrangement with keepsakes and soft candlelight mood",
            "enjoy": "playful watercolor activity setup with toys and enrichment items",
            "learn": "watercolor learning table layout with training aids and guidebooks"
        }
        
        style = pillar_styles.get(pillar, "watercolor bundle illustration")
        
        prompt = f"""Premium watercolor illustration of a pet product bundle: {bundle_name}.
Items included: {items_text}.
Style direction: {style}. Arrange the items in an elegant top-down or three-quarter composition with tasteful spacing.
Use soft handcrafted brush textures, warm emotional tones, premium editorial styling, no text or labels, not photorealistic."""
        
        # Generate image using OpenAI (same as mockup generation)
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        EMERGENT_API_KEY = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY")
        if not EMERGENT_API_KEY:
            return {"success": False, "message": "AI key not configured"}
        
        image_gen = OpenAIImageGeneration(api_key=EMERGENT_API_KEY)
        
        logger.info(f"[BUNDLE IMAGE] Generating image for: {bundle_name}")
        
        images = await image_gen.generate_images(
            prompt=prompt,
            model="gpt-image-1",
            number_of_images=1
        )
        
        if not images or len(images) == 0:
            return {"success": False, "message": "Image generation failed"}
        
        # Convert to base64 for Cloudinary upload
        import base64
        image_base64 = base64.b64encode(images[0]).decode('utf-8')
        base64_url = f"data:image/png;base64,{image_base64}"
        
        # Upload to Cloudinary
        cloudinary.config(
            cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
            api_key=os.environ.get("CLOUDINARY_API_KEY"),
            api_secret=os.environ.get("CLOUDINARY_API_SECRET")
        )
        
        upload_result = cloudinary.uploader.upload(
            base64_url,
            folder=f"doggy-company/bundles/{pillar}",
            public_id=bundle_id,
            overwrite=True
        )
        
        cloudinary_url = upload_result.get("secure_url")
        
        # Update bundle with image URL
        await db.bundles.update_one(
            {"id": bundle_id},
            {"$set": {
                "image_url": cloudinary_url,
                "image_generated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"[BUNDLE IMAGE] Generated and uploaded: {cloudinary_url}")
        
        return {
            "success": True,
            "bundle_id": bundle_id,
            "image_url": cloudinary_url,
            "message": f"Image generated for {bundle_name}"
        }
        
    except Exception as e:
        logger.error(f"[BUNDLE IMAGE] Error: {e}")
        return {"success": False, "message": str(e)}


@router.post("/generate-all-images")
async def generate_all_bundle_images():
    """
    Generate AI images for all bundles that don't have images yet.
    """
    db = get_db()
    
    try:
        # Get bundles without images
        cursor = db.bundles.find(
            {"$or": [{"image_url": {"$exists": False}}, {"image_url": None}, {"image_url": ""}]},
            {"_id": 0, "id": 1, "name": 1}
        )
        bundles = await cursor.to_list(length=100)
        
        if not bundles:
            return {"message": "All bundles already have images", "generated": 0}
        
        results = {"generated": 0, "failed": 0, "bundles": []}
        
        for bundle in bundles:
            try:
                # Call the individual generate endpoint
                result = await generate_bundle_image(bundle["id"])
                if result.get("success"):
                    results["generated"] += 1
                    results["bundles"].append(bundle["name"])
                else:
                    results["failed"] += 1
            except Exception as e:
                logger.error(f"Failed to generate image for {bundle['id']}: {e}")
                results["failed"] += 1
        
        return results
        
    except Exception as e:
        logger.error(f"[BUNDLE IMAGES] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


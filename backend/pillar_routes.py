"""
Pillar & Category Management Routes
Handles multi-pillar product classification system
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime, timezone
import uuid

# Will be set from server.py
db = None
verify_admin = None

def set_pillar_db(database):
    global db
    db = database

def set_pillar_admin_verify(verify_func):
    global verify_admin
    verify_admin = verify_func

router = APIRouter(prefix="/api/admin/pillars", tags=["Pillars"])

# ==================== MODELS ====================

class PillarCreate(BaseModel):
    name: str
    slug: str
    icon: Optional[str] = "Package"  # Lucide icon name
    color: Optional[str] = "#8B5CF6"  # Default purple
    description: Optional[str] = None
    nav_order: Optional[int] = 0
    show_in_nav: Optional[bool] = True
    is_active: Optional[bool] = True

class PillarUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    nav_order: Optional[int] = None
    show_in_nav: Optional[bool] = None
    is_active: Optional[bool] = None

class CategoryCreate(BaseModel):
    name: str
    slug: str
    pillar_id: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class ProductPlacement(BaseModel):
    pillar_id: str
    category_id: str
    is_primary: Optional[bool] = False
    visible_in_listings: Optional[bool] = True
    display_order: Optional[int] = 0

class ProductPlacementsUpdate(BaseModel):
    placements: List[ProductPlacement]

# ==================== PILLAR ROUTES ====================

@router.get("")
async def get_pillars(username: str = Depends(lambda: verify_admin)):
    """Get all pillars with their categories"""
    pillars = await db.pillars.find({}, {"_id": 0}).sort("nav_order", 1).to_list(100)
    
    # Get categories for each pillar
    for pillar in pillars:
        categories = await db.categories.find(
            {"pillar_id": pillar["id"]}, 
            {"_id": 0}
        ).sort("display_order", 1).to_list(100)
        pillar["categories"] = categories
        
        # Get product count for this pillar
        count = await db.products_master.count_documents({
            "placements.pillar_id": pillar["id"]
        })
        pillar["product_count"] = count
    
    return {"pillars": pillars}

@router.get("/public")
async def get_public_pillars():
    """Get active pillars for public navigation"""
    pillars = await db.pillars.find(
        {"is_active": True, "show_in_nav": True}, 
        {"_id": 0}
    ).sort("nav_order", 1).to_list(100)
    
    for pillar in pillars:
        categories = await db.categories.find(
            {"pillar_id": pillar["id"], "is_active": True}, 
            {"_id": 0}
        ).sort("display_order", 1).to_list(100)
        pillar["categories"] = categories
    
    return {"pillars": pillars}

@router.post("")
async def create_pillar(pillar: PillarCreate, username: str = Depends(lambda: verify_admin)):
    """Create a new pillar"""
    # Check if slug exists
    existing = await db.pillars.find_one({"slug": pillar.slug})
    if existing:
        raise HTTPException(status_code=400, detail="Pillar with this slug already exists")
    
    new_pillar = {
        "id": f"pillar-{uuid.uuid4().hex[:12]}",
        **pillar.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pillars.insert_one(new_pillar)
    return {"pillar": {k: v for k, v in new_pillar.items() if k != "_id"}}

@router.put("/{pillar_id}")
async def update_pillar(pillar_id: str, pillar: PillarUpdate, username: str = Depends(lambda: verify_admin)):
    """Update a pillar"""
    existing = await db.pillars.find_one({"id": pillar_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Pillar not found")
    
    update_data = {k: v for k, v in pillar.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.pillars.update_one({"id": pillar_id}, {"$set": update_data})
    
    updated = await db.pillars.find_one({"id": pillar_id}, {"_id": 0})
    return {"pillar": updated}

@router.delete("/{pillar_id}")
async def delete_pillar(pillar_id: str, username: str = Depends(lambda: verify_admin)):
    """Delete a pillar and its categories"""
    existing = await db.pillars.find_one({"id": pillar_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Pillar not found")
    
    # Check if products are assigned
    product_count = await db.products_master.count_documents({"placements.pillar_id": pillar_id})
    if product_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete pillar with {product_count} assigned products. Remove products first."
        )
    
    # Delete categories under this pillar
    await db.categories.delete_many({"pillar_id": pillar_id})
    
    # Delete the pillar
    await db.pillars.delete_one({"id": pillar_id})
    
    return {"message": "Pillar deleted"}

@router.put("/reorder")
async def reorder_pillars(pillar_ids: List[str], username: str = Depends(lambda: verify_admin)):
    """Reorder pillars by updating nav_order"""
    for idx, pillar_id in enumerate(pillar_ids):
        await db.pillars.update_one(
            {"id": pillar_id},
            {"$set": {"nav_order": idx}}
        )
    return {"message": "Pillars reordered"}

# ==================== CATEGORY ROUTES ====================

@router.get("/categories")
async def get_all_categories(username: str = Depends(lambda: verify_admin)):
    """Get all categories grouped by pillar"""
    categories = await db.categories.find({}, {"_id": 0}).to_list(500)
    return {"categories": categories}

@router.get("/{pillar_id}/categories")
async def get_pillar_categories(pillar_id: str, username: str = Depends(lambda: verify_admin)):
    """Get categories for a specific pillar"""
    categories = await db.categories.find(
        {"pillar_id": pillar_id}, 
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    return {"categories": categories}

@router.post("/categories")
async def create_category(category: CategoryCreate, username: str = Depends(lambda: verify_admin)):
    """Create a new category"""
    # Verify pillar exists
    pillar = await db.pillars.find_one({"id": category.pillar_id})
    if not pillar:
        raise HTTPException(status_code=404, detail="Pillar not found")
    
    # Check if slug exists within this pillar
    existing = await db.categories.find_one({
        "pillar_id": category.pillar_id, 
        "slug": category.slug
    })
    if existing:
        raise HTTPException(status_code=400, detail="Category with this slug already exists in this pillar")
    
    new_category = {
        "id": f"cat-{uuid.uuid4().hex[:12]}",
        **category.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.categories.insert_one(new_category)
    return {"category": {k: v for k, v in new_category.items() if k != "_id"}}

@router.put("/categories/{category_id}")
async def update_category(category_id: str, category: CategoryUpdate, username: str = Depends(lambda: verify_admin)):
    """Update a category"""
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = {k: v for k, v in category.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.categories.update_one({"id": category_id}, {"$set": update_data})
    
    updated = await db.categories.find_one({"id": category_id}, {"_id": 0})
    return {"category": updated}

@router.delete("/categories/{category_id}")
async def delete_category(category_id: str, username: str = Depends(lambda: verify_admin)):
    """Delete a category"""
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if products are assigned
    product_count = await db.products_master.count_documents({
        "placements.category_id": category_id
    })
    if product_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete category with {product_count} assigned products. Remove products first."
        )
    
    await db.categories.delete_one({"id": category_id})
    return {"message": "Category deleted"}

# ==================== PRODUCT PLACEMENT ROUTES ====================

@router.get("/products/{product_id}/placements")
async def get_product_placements(product_id: str, username: str = Depends(lambda: verify_admin)):
    """Get placements for a specific product"""
    product = await db.products_master.find_one({"id": product_id}, {"_id": 0, "placements": 1})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"placements": product.get("placements", [])}

@router.put("/products/{product_id}/placements")
async def update_product_placements(
    product_id: str, 
    data: ProductPlacementsUpdate, 
    username: str = Depends(lambda: verify_admin)
):
    """Update placements for a product"""
    product = await db.products_master.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate placements
    placements = []
    primary_count = 0
    
    for placement in data.placements:
        # Verify pillar exists
        pillar = await db.pillars.find_one({"id": placement.pillar_id})
        if not pillar:
            raise HTTPException(status_code=400, detail=f"Pillar {placement.pillar_id} not found")
        
        # Verify category exists and belongs to pillar
        category = await db.categories.find_one({
            "id": placement.category_id,
            "pillar_id": placement.pillar_id
        })
        if not category:
            raise HTTPException(
                status_code=400, 
                detail=f"Category {placement.category_id} not found in pillar {placement.pillar_id}"
            )
        
        if placement.is_primary:
            primary_count += 1
        
        placements.append({
            "pillar_id": placement.pillar_id,
            "pillar_name": pillar["name"],
            "pillar_slug": pillar["slug"],
            "category_id": placement.category_id,
            "category_name": category["name"],
            "category_slug": category["slug"],
            "is_primary": placement.is_primary,
            "visible_in_listings": placement.visible_in_listings,
            "display_order": placement.display_order
        })
    
    # Ensure exactly one primary placement if any placements exist
    if placements and primary_count == 0:
        placements[0]["is_primary"] = True
    elif primary_count > 1:
        raise HTTPException(status_code=400, detail="Only one placement can be primary")
    
    # Update product
    await db.products_master.update_one(
        {"id": product_id},
        {
            "$set": {
                "placements": placements,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"placements": placements, "message": "Placements updated"}

# ==================== BULK OPERATIONS ====================

@router.post("/migrate-legacy-categories")
async def migrate_legacy_categories(username: str = Depends(lambda: verify_admin)):
    """
    One-time migration to convert existing category field to placements.
    Maps old categories to new pillar/category structure.
    """
    # Define mapping from old category to new pillar/category
    # This assumes pillars and categories have been created first
    
    # Get the Celebrate pillar (default for most products)
    celebrate = await db.pillars.find_one({"slug": "celebrate"})
    dine = await db.pillars.find_one({"slug": "dine"})
    
    if not celebrate:
        raise HTTPException(
            status_code=400, 
            detail="Please create 'Celebrate' pillar first before migration"
        )
    
    # Map old categories to pillar
    dine_categories = ["fresh-meals", "frozen-treats", "nut-butters"]
    
    # Get products without placements
    products = await db.products_master.find(
        {"placements": {"$exists": False}},
        {"_id": 0, "id": 1, "category": 1}
    ).to_list(10000)
    
    migrated = 0
    for product in products:
        old_category = product.get("category", "other")
        
        # Determine pillar
        if old_category in dine_categories and dine:
            pillar = dine
        else:
            pillar = celebrate
        
        # Find or create category in the pillar
        category = await db.categories.find_one({
            "pillar_id": pillar["id"],
            "slug": old_category
        })
        
        if not category:
            # Create the category
            category = {
                "id": f"cat-{uuid.uuid4().hex[:12]}",
                "name": old_category.replace("-", " ").title(),
                "slug": old_category,
                "pillar_id": pillar["id"],
                "display_order": 0,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.categories.insert_one(category)
        
        # Create placement
        placement = {
            "pillar_id": pillar["id"],
            "pillar_name": pillar["name"],
            "pillar_slug": pillar["slug"],
            "category_id": category["id"],
            "category_name": category["name"],
            "category_slug": category["slug"],
            "is_primary": True,
            "visible_in_listings": True,
            "display_order": 0
        }
        
        await db.products_master.update_one(
            {"id": product["id"]},
            {"$set": {"placements": [placement]}}
        )
        migrated += 1
    
    return {
        "message": f"Migrated {migrated} products",
        "total_processed": len(products)
    }

# ==================== PUBLIC ROUTES FOR FRONTEND ====================

public_router = APIRouter(prefix="/api/pillars", tags=["Public Pillars"])

@public_router.get("")
async def public_get_pillars():
    """Get active pillars for public site navigation"""
    pillars = await db.pillars.find(
        {"is_active": True}, 
        {"_id": 0}
    ).sort("nav_order", 1).to_list(100)
    
    for pillar in pillars:
        categories = await db.categories.find(
            {"pillar_id": pillar["id"], "is_active": True}, 
            {"_id": 0}
        ).sort("display_order", 1).to_list(100)
        pillar["categories"] = categories
    
    return {"pillars": pillars}

@public_router.get("/{pillar_slug}")
async def public_get_pillar(pillar_slug: str):
    """Get a specific pillar with its categories and products"""
    pillar = await db.pillars.find_one(
        {"slug": pillar_slug, "is_active": True}, 
        {"_id": 0}
    )
    if not pillar:
        raise HTTPException(status_code=404, detail="Pillar not found")
    
    # Get categories
    categories = await db.categories.find(
        {"pillar_id": pillar["id"], "is_active": True}, 
        {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    pillar["categories"] = categories
    
    # Get products for this pillar
    products = await db.products_master.find(
        {
            "placements": {
                "$elemMatch": {
                    "pillar_id": pillar["id"],
                    "visible_in_listings": True
                }
            },
            "available": True
        },
        {"_id": 0}
    ).to_list(1000)
    
    return {"pillar": pillar, "products": products}

@public_router.get("/{pillar_slug}/{category_slug}")
async def public_get_category_products(pillar_slug: str, category_slug: str):
    """Get products for a specific pillar/category combination"""
    pillar = await db.pillars.find_one(
        {"slug": pillar_slug, "is_active": True}, 
        {"_id": 0}
    )
    if not pillar:
        raise HTTPException(status_code=404, detail="Pillar not found")
    
    category = await db.categories.find_one(
        {"pillar_id": pillar["id"], "slug": category_slug, "is_active": True},
        {"_id": 0}
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Get products for this pillar/category
    products = await db.products_master.find(
        {
            "placements": {
                "$elemMatch": {
                    "pillar_id": pillar["id"],
                    "category_id": category["id"],
                    "visible_in_listings": True
                }
            },
            "available": True
        },
        {"_id": 0}
    ).to_list(1000)
    
    return {
        "pillar": pillar,
        "category": category,
        "products": products
    }


# ==================== PILLAR QUEUE ROUTES ====================
# Endpoints for viewing pillar-specific service requests/tickets

PILLAR_COLLECTION_MAP = {
    "fit": "fit_requests",
    "care": "care_requests",
    "celebrate": "celebrate_requests",
    "dine": "dine_requests",
    "stay": "stay_requests",
    "travel": "travel_requests",
    "learn": "learn_requests",
    "enjoy": "enjoy_requests",
    "advisory": "advisory_requests",
    "paperwork": "paperwork_requests",
    "emergency": "emergency_requests",
    "adopt": "adopt_requests",
    "farewell": "farewell_requests",
    "shop": "shop_requests"
}

@router.get("/queues")
async def get_pillar_queues_overview(username: str = Depends(lambda: verify_admin)):
    """Get overview of all pillar queues with counts"""
    queues = []
    
    for pillar, collection in PILLAR_COLLECTION_MAP.items():
        try:
            total = await db[collection].count_documents({})
            pending = await db[collection].count_documents({"status": {"$in": ["pending", "open", "new"]}})
            in_progress = await db[collection].count_documents({"status": "in_progress"})
            
            queues.append({
                "pillar": pillar,
                "collection": collection,
                "total": total,
                "pending": pending,
                "in_progress": in_progress,
                "icon": get_pillar_icon(pillar)
            })
        except Exception as e:
            queues.append({
                "pillar": pillar,
                "collection": collection,
                "total": 0,
                "pending": 0,
                "in_progress": 0,
                "icon": get_pillar_icon(pillar),
                "error": str(e)
            })
    
    return {"queues": queues}

@router.get("/queues/{pillar}")
async def get_pillar_queue(
    pillar: str,
    status: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    username: str = Depends(lambda: verify_admin)
):
    """Get requests from a specific pillar's queue"""
    collection_name = PILLAR_COLLECTION_MAP.get(pillar)
    if not collection_name:
        raise HTTPException(status_code=404, detail=f"Unknown pillar: {pillar}")
    
    query = {}
    if status:
        query["status"] = status
    
    requests = await db[collection_name].find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db[collection_name].count_documents(query)
    
    # Get stats
    stats = {
        "total": total,
        "pending": await db[collection_name].count_documents({"status": {"$in": ["pending", "open", "new"]}}),
        "in_progress": await db[collection_name].count_documents({"status": "in_progress"}),
        "completed": await db[collection_name].count_documents({"status": {"$in": ["completed", "resolved", "closed"]}})
    }
    
    return {
        "pillar": pillar,
        "requests": requests,
        "stats": stats,
        "pagination": {
            "total": total,
            "limit": limit,
            "skip": skip,
            "has_more": skip + limit < total
        }
    }

@router.put("/queues/{pillar}/{request_id}")
async def update_pillar_request(
    pillar: str,
    request_id: str,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    notes: Optional[str] = None,
    username: str = Depends(lambda: verify_admin)
):
    """Update a request in a pillar queue"""
    collection_name = PILLAR_COLLECTION_MAP.get(pillar)
    if not collection_name:
        raise HTTPException(status_code=404, detail=f"Unknown pillar: {pillar}")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if status:
        update_data["status"] = status
    if assigned_to:
        update_data["assigned_to"] = assigned_to
    if notes:
        update_data["notes"] = notes
    
    result = await db[collection_name].update_one(
        {"$or": [{"id": request_id}, {"request_id": request_id}, {"ticket_id": request_id}]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"message": "Request updated", "pillar": pillar, "request_id": request_id}

def get_pillar_icon(pillar: str) -> str:
    """Get icon emoji for a pillar"""
    icons = {
        "fit": "🏃",
        "care": "💊",
        "celebrate": "🎂",
        "dine": "🍽️",
        "stay": "🏨",
        "travel": "✈️",
        "learn": "🎓",
        "enjoy": "🎾",
        "advisory": "📋",
        "paperwork": "📄",
        "emergency": "🚨",
        "adopt": "🐾",
        "farewell": "🌈",
        "shop": "🛒"
    }
    return icons.get(pillar, "📦")

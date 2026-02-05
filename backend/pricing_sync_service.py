"""
Pricing Sync Service - Keeps Products and Services in sync
============================================================
When a product is added/edited, sync to services and vice versa.
New items always appear at top (sorted by created_at desc).
"""

from datetime import datetime, timezone
import logging
import secrets

logger = logging.getLogger(__name__)

db = None

def set_pricing_sync_db(database):
    """Set database reference"""
    global db
    db = database

def get_utc_timestamp():
    return datetime.now(timezone.utc).isoformat()


async def sync_product_to_service(product: dict) -> dict:
    """
    When a product is created/updated, create/update corresponding service entry.
    This ensures pricing stays in sync.
    """
    if db is None:
        return {"success": False, "error": "Database not initialized"}
    
    try:
        # Extract product data
        product_id = product.get("id") or product.get("product_id")
        name = product.get("name", "")
        price = product.get("price", 0)
        pillar = product.get("pillar", "shop")
        description = product.get("description", "")
        category = product.get("category", "general")
        image = product.get("image") or product.get("image_url", "")
        tags = product.get("tags", [])
        
        # Create service entry
        service_id = f"svc-{product_id}" if product_id else f"svc-{secrets.token_hex(4)}"
        
        service_data = {
            "id": service_id,
            "source_product_id": product_id,
            "name": name,
            "service_type": "product",
            "pillar": pillar,
            "category": category,
            "description": description,
            "base_price": price,
            "price": price,
            "image_url": image,
            "tags": tags,
            "is_synced_from_product": True,
            "sync_timestamp": get_utc_timestamp(),
            "status": "active",
            "updated_at": get_utc_timestamp()
        }
        
        # Upsert to services collection
        await db.services_master.update_one(
            {"source_product_id": product_id},
            {"$set": service_data, "$setOnInsert": {"created_at": get_utc_timestamp()}},
            upsert=True
        )
        
        logger.info(f"✓ Synced product {product_id} to service {service_id}")
        return {"success": True, "service_id": service_id}
        
    except Exception as e:
        logger.error(f"Failed to sync product to service: {e}")
        return {"success": False, "error": str(e)}


async def sync_service_to_product(service: dict) -> dict:
    """
    When a service is created/updated, create/update corresponding product entry.
    This ensures pricing stays in sync.
    """
    if db is None:
        return {"success": False, "error": "Database not initialized"}
    
    try:
        # Extract service data
        service_id = service.get("id") or service.get("service_id")
        name = service.get("name", "")
        price = service.get("price") or service.get("base_price", 0)
        pillar = service.get("pillar", "care")
        description = service.get("description", "")
        category = service.get("category", "service")
        image = service.get("image_url") or service.get("image", "")
        tags = service.get("tags", [])
        
        # Create product entry
        product_id = f"prod-{service_id}" if service_id else f"prod-{secrets.token_hex(4)}"
        
        product_data = {
            "id": product_id,
            "source_service_id": service_id,
            "name": name,
            "product_type": "service",
            "pillar": pillar,
            "category": category,
            "description": description,
            "price": price,
            "image": image,
            "image_url": image,
            "tags": tags,
            "is_synced_from_service": True,
            "sync_timestamp": get_utc_timestamp(),
            "in_stock": True,
            "status": "active",
            "updated_at": get_utc_timestamp()
        }
        
        # Upsert to unified_products collection
        await db.unified_products.update_one(
            {"source_service_id": service_id},
            {"$set": product_data, "$setOnInsert": {"created_at": get_utc_timestamp()}},
            upsert=True
        )
        
        logger.info(f"✓ Synced service {service_id} to product {product_id}")
        return {"success": True, "product_id": product_id}
        
    except Exception as e:
        logger.error(f"Failed to sync service to product: {e}")
        return {"success": False, "error": str(e)}


async def sync_all_products_to_services() -> dict:
    """Batch sync all products to services"""
    if db is None:
        return {"success": False, "error": "Database not initialized"}
    
    synced = 0
    errors = []
    
    # Sync from unified_products
    async for product in db.unified_products.find({}):
        result = await sync_product_to_service(product)
        if result.get("success"):
            synced += 1
        else:
            errors.append(result.get("error"))
    
    # Sync from products collection as well
    async for product in db.products_master.find({}):
        result = await sync_product_to_service(product)
        if result.get("success"):
            synced += 1
        else:
            errors.append(result.get("error"))
    
    return {
        "success": True,
        "synced_count": synced,
        "errors": errors[:5]  # First 5 errors
    }


async def sync_all_services_to_products() -> dict:
    """Batch sync all services to products"""
    if db is None:
        return {"success": False, "error": "Database not initialized"}
    
    synced = 0
    errors = []
    
    async for service in db.services_master.find({"is_synced_from_product": {"$ne": True}}):
        result = await sync_service_to_product(service)
        if result.get("success"):
            synced += 1
        else:
            errors.append(result.get("error"))
    
    return {
        "success": True,
        "synced_count": synced,
        "errors": errors[:5]
    }


async def update_product_price(product_id: str, new_price: float) -> dict:
    """Update product price and sync to service"""
    if db is None:
        return {"success": False, "error": "Database not initialized"}
    
    timestamp = get_utc_timestamp()
    
    # Update in products collection
    await db.products_master.update_one(
        {"id": product_id},
        {"$set": {"price": new_price, "updated_at": timestamp}}
    )
    
    # Update in unified_products collection
    await db.unified_products.update_one(
        {"id": product_id},
        {"$set": {"price": new_price, "updated_at": timestamp}}
    )
    
    # Sync to service
    await db.services_master.update_one(
        {"source_product_id": product_id},
        {"$set": {"price": new_price, "base_price": new_price, "sync_timestamp": timestamp, "updated_at": timestamp}}
    )
    
    return {"success": True, "new_price": new_price}


async def update_service_price(service_id: str, new_price: float) -> dict:
    """Update service price and sync to product"""
    if db is None:
        return {"success": False, "error": "Database not initialized"}
    
    timestamp = get_utc_timestamp()
    
    # Update in services collection
    await db.services_master.update_one(
        {"id": service_id},
        {"$set": {"price": new_price, "base_price": new_price, "updated_at": timestamp}}
    )
    
    # Sync to product
    await db.unified_products.update_one(
        {"source_service_id": service_id},
        {"$set": {"price": new_price, "sync_timestamp": timestamp, "updated_at": timestamp}}
    )
    
    return {"success": True, "new_price": new_price}


# ============================================
# PAWMETER INTEGRATION
# ============================================

PAWMETER_CRITERIA = {
    "comfort": {"weight": 0.2, "description": "How comfortable is this for the pet?"},
    "safety": {"weight": 0.25, "description": "Safety rating"},
    "quality": {"weight": 0.2, "description": "Product/service quality"},
    "value": {"weight": 0.15, "description": "Value for money"},
    "joy": {"weight": 0.2, "description": "How much joy does it bring?"}
}

async def calculate_pawmeter_score(item: dict) -> dict:
    """
    Calculate Pawmeter score for a product or service.
    Uses ratings, reviews, and AI analysis.
    """
    item_id = item.get("id")
    item_type = "product" if item.get("price") else "service"
    
    # Get existing ratings
    ratings = []
    if db is not None:
        cursor = db.paw_ratings.find({"item_id": item_id})
        ratings = await cursor.to_list(100)
    
    # Calculate average scores per criteria
    criteria_scores = {}
    for criteria in PAWMETER_CRITERIA.keys():
        scores = [r.get(criteria, 0) for r in ratings if r.get(criteria)]
        criteria_scores[criteria] = sum(scores) / len(scores) if scores else 3.0  # Default 3/5
    
    # Calculate weighted overall score
    overall = 0
    for criteria, config in PAWMETER_CRITERIA.items():
        overall += criteria_scores.get(criteria, 3.0) * config["weight"]
    
    pawmeter = {
        "overall": round(overall, 1),
        "comfort": round(criteria_scores.get("comfort", 3.0), 1),
        "safety": round(criteria_scores.get("safety", 3.0), 1),
        "quality": round(criteria_scores.get("quality", 3.0), 1),
        "value": round(criteria_scores.get("value", 3.0), 1),
        "joy": round(criteria_scores.get("joy", 3.0), 1),
        "rating_count": len(ratings),
        "last_updated": get_utc_timestamp()
    }
    
    return pawmeter


async def update_item_pawmeter(item_id: str, item_type: str = "product") -> dict:
    """Update Pawmeter score for an item"""
    if db is None:
        return {"success": False, "error": "Database not initialized"}
    
    # Get item
    collection = db.unified_products if item_type == "product" else db.services_master
    item = await collection.find_one({"id": item_id})
    
    if not item:
        return {"success": False, "error": "Item not found"}
    
    # Calculate new pawmeter
    pawmeter = await calculate_pawmeter_score(item)
    
    # Update item
    await collection.update_one(
        {"id": item_id},
        {"$set": {"pawmeter": pawmeter, "updated_at": get_utc_timestamp()}}
    )
    
    return {"success": True, "pawmeter": pawmeter}


async def batch_update_pawmeters() -> dict:
    """Update Pawmeter scores for all products and services"""
    if db is None:
        return {"success": False, "error": "Database not initialized"}
    
    updated = {"products": 0, "services": 0}
    
    # Update products
    async for product in db.unified_products.find({}):
        pawmeter = await calculate_pawmeter_score(product)
        await db.unified_products.update_one(
            {"_id": product["_id"]},
            {"$set": {"pawmeter": pawmeter}}
        )
        updated["products"] += 1
    
    # Update services
    async for service in db.services_master.find({}):
        pawmeter = await calculate_pawmeter_score(service)
        await db.services_master.update_one(
            {"_id": service["_id"]},
            {"$set": {"pawmeter": pawmeter}}
        )
        updated["services"] += 1
    
    return {"success": True, "updated": updated}

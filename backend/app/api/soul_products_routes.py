"""
Soul Products API Routes
========================
Endpoints for managing Soul-Level Personalization product tiers.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/products", tags=["Soul Products"])

# Database reference
_db = None

def set_soul_products_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


class SoulTierUpdate(BaseModel):
    soul_tier: str  # soul_made, soul_selected, soul_gifted, standard


class BulkSoulTierUpdate(BaseModel):
    product_ids: List[str]
    soul_tier: str


@router.patch("/{product_id}/soul-tier")
async def update_product_soul_tier(product_id: str, update: SoulTierUpdate):
    """Update the soul tier for a single product."""
    db = get_db()
    
    valid_tiers = ['soul_made', 'soul_selected', 'soul_gifted', 'standard']
    if update.soul_tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {valid_tiers}")
    
    # Try different product collections
    collections = ['products_master', 'products', 'shopify_products']
    
    for coll in collections:
        try:
            result = await db[coll].update_one(
                {"id": product_id},
                {"$set": {"soul_tier": update.soul_tier}}
            )
            if result.modified_count > 0:
                logger.info(f"Updated soul_tier for product {product_id} to {update.soul_tier}")
                return {"success": True, "product_id": product_id, "soul_tier": update.soul_tier}
        except Exception as e:
            logger.debug(f"Collection {coll} not found or error: {e}")
            continue
    
    # If no product found, create the tier record anyway (for flexibility)
    await db.product_soul_tiers.update_one(
        {"product_id": product_id},
        {"$set": {"soul_tier": update.soul_tier}},
        upsert=True
    )
    
    return {"success": True, "product_id": product_id, "soul_tier": update.soul_tier}


@router.patch("/bulk-soul-tier")
async def bulk_update_soul_tiers(update: BulkSoulTierUpdate):
    """Update soul tier for multiple products at once."""
    db = get_db()
    
    valid_tiers = ['soul_made', 'soul_selected', 'soul_gifted', 'standard']
    if update.soul_tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {valid_tiers}")
    
    updated_count = 0
    
    # Try to update in products_master first
    try:
        result = await db.products_master.update_many(
            {"id": {"$in": update.product_ids}},
            {"$set": {"soul_tier": update.soul_tier}}
        )
        updated_count = result.modified_count
    except Exception as e:
        logger.debug(f"products_master update failed: {e}")
    
    # Also store in dedicated collection for reliability
    for product_id in update.product_ids:
        await db.product_soul_tiers.update_one(
            {"product_id": product_id},
            {"$set": {"soul_tier": update.soul_tier}},
            upsert=True
        )
    
    logger.info(f"Bulk updated {len(update.product_ids)} products to tier {update.soul_tier}")
    
    return {
        "success": True,
        "updated_count": len(update.product_ids),
        "soul_tier": update.soul_tier
    }


@router.get("/soul-tiers")
async def get_all_soul_tiers():
    """Get all product soul tier assignments."""
    db = get_db()
    
    tiers = await db.product_soul_tiers.find({}, {"_id": 0}).to_list(1000)
    
    return {"tiers": tiers}


@router.get("/by-soul-tier/{tier}")
async def get_products_by_tier(tier: str, limit: int = 50):
    """Get all products with a specific soul tier."""
    db = get_db()
    
    valid_tiers = ['soul_made', 'soul_selected', 'soul_gifted', 'standard']
    if tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {valid_tiers}")
    
    # Get from products_master
    products = await db.products_master.find(
        {"soul_tier": tier},
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # If none found, check dedicated collection
    if not products:
        tier_records = await db.product_soul_tiers.find(
            {"soul_tier": tier},
            {"_id": 0, "product_id": 1}
        ).to_list(1000)
        
        if tier_records:
            product_ids = [r["product_id"] for r in tier_records]
            products = await db.products_master.find(
                {"id": {"$in": product_ids}},
                {"_id": 0}
            ).limit(limit).to_list(limit)
    
    return {"products": products, "count": len(products), "tier": tier}


@router.get("/categories")
async def get_product_categories():
    """Get all unique product categories."""
    db = get_db()
    
    try:
        # Get unique categories from products_master
        categories = await db.products_master.distinct("category")
        categories = [c for c in categories if c]  # Remove None/empty
        return {"categories": sorted(categories)}
    except Exception as e:
        logger.error(f"Failed to get categories: {e}")
        # Return default categories
        return {
            "categories": [
                "cakes", "breed-cakes", "accessories", "treats", 
                "hampers", "dognuts", "frozen-treats", "mini-cakes"
            ]
        }

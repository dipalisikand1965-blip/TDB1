"""
Pillar Products Routes - Unified admin API for ALL pillar product management
All products are stored in products_master with a 'pillar' field
This is the single source of truth for all pillars
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/pillar-products", tags=["Pillar Products Admin"])

_db = None

def set_db(database):
    global _db
    _db = database

def get_db():
    if _db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return _db


@router.get("")
async def get_pillar_products(
    pillar: str,
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    category: Optional[str] = None,
    active_only: bool = False
):
    """
    Get products for a specific pillar from products_master.
    Single unified endpoint used by all pillar admin pages.
    """
    db = get_db()
    try:
        query = {"pillar": pillar}
        if active_only:
            query["$or"] = [{"active": True}, {"is_active": True}]
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
            ]
        if category:
            query["category"] = category

        total = await db.products_master.count_documents(query)
        skip = (page - 1) * limit

        cursor = db.products_master.find(query, {"_id": 0}).sort("name", 1).skip(skip).limit(limit)
        products = await cursor.to_list(length=limit)

        # Get unique categories for filter
        cat_pipeline = [
            {"$match": {"pillar": pillar, "category": {"$exists": True, "$ne": ""}}},
            {"$group": {"_id": "$category"}},
            {"$sort": {"_id": 1}}
        ]
        cat_cursor = db.products_master.aggregate(cat_pipeline)
        cat_docs = await cat_cursor.to_list(length=100)
        categories = [c["_id"] for c in cat_docs if c["_id"]]

        return {
            "products": products,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": max(1, -(-total // limit)),
            "pillar": pillar,
            "categories": categories
        }
    except Exception as e:
        logger.error(f"Error fetching pillar products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_pillar_product(product: dict):
    """Create a new product in products_master for a specific pillar"""
    db = get_db()
    try:
        pillar = product.get("pillar")
        if not pillar:
            raise HTTPException(status_code=400, detail="pillar is required")

        product_id = product.get("id") or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        doc = {
            "id": product_id,
            "pillar": pillar,
            "name": product.get("name", ""),
            "description": product.get("description", ""),
            "category": product.get("category", ""),
            "sub_category": product.get("sub_category", ""),
            "price": float(product.get("price", 0)),
            "compare_price": float(product.get("compare_price", 0)),
            "image_url": product.get("image_url", ""),
            "active": product.get("active", True),
            "is_active": product.get("active", True),
            "source": "admin",
            "created_at": now,
            "updated_at": now,
        }
        # Include any extra fields
        for k, v in product.items():
            if k not in doc and k != "_id":
                doc[k] = v

        await db.products_master.insert_one(doc)
        doc.pop("_id", None)
        return {"message": "Product created", "product": doc}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}")
async def update_pillar_product(product_id: str, updates: dict):
    """Update a product in products_master"""
    db = get_db()
    try:
        updates.pop("_id", None)
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()

        result = await db.products_master.update_one(
            {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
            {"$set": updates}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")

        updated = await db.products_master.find_one(
            {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
            {"_id": 0}
        )
        return {"message": "Product updated", "product": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
async def delete_pillar_product(product_id: str):
    """Soft-delete a product (mark inactive)"""
    db = get_db()
    try:
        result = await db.products_master.update_one(
            {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
            {"$set": {"active": False, "is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"message": "Product deactivated", "product_id": product_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sub-categories")
async def get_sub_categories(pillar: str):
    """Get all sub-categories for a pillar"""
    db = get_db()
    try:
        pipeline = [
            {"$match": {"pillar": pillar}},
            {"$group": {"_id": "$category"}},
            {"$sort": {"_id": 1}}
        ]
        cursor = db.products_master.aggregate(pipeline)
        docs = await cursor.to_list(length=100)
        return {"categories": [d["_id"] for d in docs if d["_id"]]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

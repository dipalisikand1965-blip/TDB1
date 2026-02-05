"""
Shop Pillar Routes
Comprehensive shop management: products, orders, inventory, reports
Manages all shop-related admin operations
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import uuid
import os

router = APIRouter(prefix="/api/shop", tags=["shop"])

# Get MongoDB connection from server.py
def get_db():
    from server import db
    return db

# Get logger from server
def get_logger():
    from server import logger
    return logger


# Product Categories
SHOP_CATEGORIES = {
    "treats": {"name": "Treats & Snacks", "icon": "🍪", "pillar": "Feed"},
    "cakes": {"name": "Celebration Cakes", "icon": "🎂", "pillar": "Celebrate"},
    "food": {"name": "Pet Food", "icon": "🍖", "pillar": "Feed"},
    "toys": {"name": "Toys & Play", "icon": "🎾", "pillar": "Play"},
    "accessories": {"name": "Accessories", "icon": "🎀", "pillar": "Groom"},
    "health": {"name": "Health & Wellness", "icon": "💊", "pillar": "Care"},
    "grooming": {"name": "Grooming Products", "icon": "✨", "pillar": "Groom"},
    "travel": {"name": "Travel Gear", "icon": "✈️", "pillar": "Travel"},
    "memorial": {"name": "Memorial Items", "icon": "🌈", "pillar": "Farewell"}
}


@router.get("/categories")
async def get_shop_categories():
    """Get all shop categories"""
    return {"categories": SHOP_CATEGORIES}


@router.get("/stats")
async def get_shop_stats():
    """Get comprehensive shop statistics"""
    db = get_db()
    
    # Product stats
    total_products = await db.products_master.count_documents({})
    unified_products = await db.products_master.count_documents({})
    in_stock = await db.products_master.count_documents({"available": True})
    out_of_stock = await db.products_master.count_documents({"available": False})
    
    # Order stats (from orders collection)
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": {"$in": ["pending", "processing"]}})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    # Revenue stats (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    recent_orders = await db.orders.find({
        "created_at": {"$gte": thirty_days_ago.isoformat()}
    }).to_list(1000)
    
    monthly_revenue = sum(order.get("total", 0) for order in recent_orders)
    
    # Top categories
    category_counts = {}
    products = await db.products_master.find({}, {"category": 1}).to_list(5000)
    for p in products:
        cat = p.get("category", "uncategorised")
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    return {
        "products": {
            "total": total_products,
            "unified": unified_products,
            "in_stock": in_stock,
            "out_of_stock": out_of_stock
        },
        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "completed": completed_orders
        },
        "revenue": {
            "monthly": monthly_revenue,
            "currency": "INR"
        },
        "categories": category_counts
    }


# ============ PRODUCTS MANAGEMENT ============

@router.get("/products")
async def get_shop_products(
    category: Optional[str] = None,
    pillar: Optional[str] = None,
    in_stock: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(50, le=500),
    skip: int = 0
):
    """Get shop products with filters"""
    db = get_db()
    
    query = {}
    
    if category:
        query["category"] = category
    if pillar:
        query["pillars"] = pillar
    if in_stock is not None:
        query["available"] = in_stock
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products_master.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.products_master.count_documents(query)
    
    return {"products": products, "total": total}


@router.get("/products/{product_id}")
async def get_shop_product(product_id: str):
    """Get a single product by ID"""
    db = get_db()
    
    product = await db.products_master.find_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"_id": 0}
    )
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return product


@router.post("/admin/products")
async def create_shop_product(product_data: dict):
    """Create a new shop product"""
    db = get_db()
    
    product = {
        "id": f"prod-{uuid.uuid4().hex[:8]}",
        **product_data,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "available": True,
        "source": "admin"
    }
    
    await db.products_master.insert_one(product)
    
    # Also add to unified_products
    unified = {**product, "sync_source": "admin_created"}
    await db.products_master.update_one(
        {"id": product["id"]},
        {"$set": unified},
        upsert=True
    )
    
    return {"success": True, "product_id": product["id"]}


@router.put("/admin/products/{product_id}")
async def update_shop_product(product_id: str, product_data: dict):
    """Update a shop product"""
    db = get_db()
    
    product_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.products_master.update_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"$set": product_data}
    )
    
    # Also update unified_products
    await db.products_master.update_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"$set": product_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True}


@router.delete("/admin/products/{product_id}")
async def delete_shop_product(product_id: str):
    """Delete a shop product"""
    db = get_db()
    
    result = await db.products_master.delete_one({"$or": [{"id": product_id}, {"shopify_id": product_id}]})
    await db.products_master.delete_one({"$or": [{"id": product_id}, {"shopify_id": product_id}]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True}


@router.get("/admin/products/export")
async def export_shop_products():
    """Export all products for CSV download"""
    db = get_db()
    
    products = await db.products_master.find({}, {"_id": 0}).to_list(10000)
    return {"products": products}


@router.post("/admin/products/import")
async def import_shop_products(products: List[dict]):
    """Import products from CSV"""
    db = get_db()
    
    imported = 0
    for product in products:
        product["id"] = product.get("id") or f"prod-{uuid.uuid4().hex[:8]}"
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        product["source"] = "csv_import"
        
        await db.products_master.update_one(
            {"id": product["id"]},
            {"$set": product},
            upsert=True
        )
        
        # Also sync to unified
        await db.products_master.update_one(
            {"id": product["id"]},
            {"$set": {**product, "sync_source": "csv_import"}},
            upsert=True
        )
        
        imported += 1
    
    return {"success": True, "imported": imported}


# ============ ORDERS MANAGEMENT ============

@router.get("/orders")
async def get_shop_orders(
    status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(50, le=200),
    skip: int = 0
):
    """Get shop orders"""
    db = get_db()
    
    query = {}
    if status and status != 'all':
        query["status"] = status
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.orders.count_documents(query)
    
    return {"orders": orders, "total": total}


@router.get("/orders/{order_id}")
async def get_shop_order(order_id: str):
    """Get a single order"""
    db = get_db()
    
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return order


@router.patch("/orders/{order_id}")
async def update_shop_order(order_id: str, update_data: dict):
    """Update order status/details"""
    db = get_db()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"success": True}


@router.get("/admin/orders/export")
async def export_shop_orders(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Export orders for CSV download"""
    db = get_db()
    
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(10000)
    return {"orders": orders}


# ============ INVENTORY MANAGEMENT ============

@router.get("/inventory")
async def get_inventory_status():
    """Get inventory overview"""
    db = get_db()
    
    # Low stock products (quantity < 10)
    low_stock = await db.products_master.find(
        {"quantity": {"$lt": 10, "$gt": 0}},
        {"_id": 0, "id": 1, "title": 1, "quantity": 1}
    ).to_list(100)
    
    # Out of stock
    out_of_stock = await db.products_master.find(
        {"$or": [{"quantity": 0}, {"available": False}]},
        {"_id": 0, "id": 1, "title": 1}
    ).to_list(100)
    
    return {
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "low_stock_count": len(low_stock),
        "out_of_stock_count": len(out_of_stock)
    }


@router.put("/inventory/{product_id}")
async def update_inventory(product_id: str, inventory_data: dict):
    """Update product inventory"""
    db = get_db()
    
    update = {
        "quantity": inventory_data.get("quantity"),
        "available": inventory_data.get("quantity", 0) > 0,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.products_master.update_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"$set": update}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"success": True}


# ============ REPORTS ============

@router.get("/reports/sales")
async def get_sales_report(
    period: str = "month",  # day, week, month, year
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get sales report"""
    db = get_db()
    
    # Calculate date range
    now = datetime.now(timezone.utc)
    if period == "day":
        start = now - timedelta(days=1)
    elif period == "week":
        start = now - timedelta(weeks=1)
    elif period == "month":
        start = now - timedelta(days=30)
    else:
        start = now - timedelta(days=365)
    
    if start_date:
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    if end_date:
        now = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    orders = await db.orders.find({
        "created_at": {"$gte": start.isoformat(), "$lte": now.isoformat()},
        "status": {"$in": ["completed", "delivered"]}
    }).to_list(10000)
    
    total_revenue = sum(o.get("total", 0) for o in orders)
    total_orders = len(orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Top products
    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            pid = item.get("product_id", item.get("id", "unknown"))
            if pid not in product_sales:
                product_sales[pid] = {"name": item.get("title", "Unknown"), "quantity": 0, "revenue": 0}
            product_sales[pid]["quantity"] += item.get("quantity", 1)
            product_sales[pid]["revenue"] += item.get("price", 0) * item.get("quantity", 1)
    
    top_products = sorted(product_sales.values(), key=lambda x: x["revenue"], reverse=True)[:10]
    
    return {
        "period": period,
        "start_date": start.isoformat(),
        "end_date": now.isoformat(),
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "average_order_value": round(avg_order_value, 2),
        "top_products": top_products
    }


@router.get("/reports/products")
async def get_products_report():
    """Get products performance report"""
    db = get_db()
    
    # Products by category
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    by_category = await db.products_master.aggregate(pipeline).to_list(50)
    
    # Products by pillar
    pipeline_pillar = [
        {"$unwind": {"path": "$pillars", "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": "$pillars", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    by_pillar = await db.products_master.aggregate(pipeline_pillar).to_list(20)
    
    return {
        "by_category": [{"category": c["_id"] or "Uncategorised", "count": c["count"]} for c in by_category],
        "by_pillar": [{"pillar": p["_id"] or "No Pillar", "count": p["count"]} for p in by_pillar]
    }


# ============ SETTINGS ============

@router.get("/admin/settings")
async def get_shop_settings():
    """Get shop settings"""
    db = get_db()
    
    settings = await db.shop_settings.find_one({}, {"_id": 0})
    
    if not settings:
        settings = {
            "currency": "INR",
            "tax_rate": 18,
            "free_shipping_threshold": 999,
            "shipping_charge": 99,
            "cod_available": True,
            "cod_charge": 50,
            "paw_rewards": {
                "enabled": True,
                "points_per_rupee": 1,
                "redemption_value": 100  # 100 points = ₹1
            },
            "notifications": {
                "order_confirmation": True,
                "shipping_updates": True,
                "delivery_confirmation": True
            }
        }
    
    return settings


@router.put("/admin/settings")
async def update_shop_settings(settings: dict):
    """Update shop settings"""
    db = get_db()
    
    settings["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.shop_settings.update_one(
        {},
        {"$set": settings},
        upsert=True
    )
    
    return {"success": True}


# ============ SYNC OPERATIONS ============

@router.post("/admin/sync-unified")
async def sync_to_unified_products():
    """Sync all products to unified_products collection"""
    db = get_db()
    logger = get_logger()
    
    products = await db.products_master.find({}, {"_id": 0}).to_list(10000)
    
    synced = 0
    for product in products:
        await db.products_master.update_one(
            {"$or": [{"id": product.get("id")}, {"shopify_id": product.get("shopify_id")}]},
            {"$set": {**product, "sync_source": "manual_sync", "synced_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True
        )
        synced += 1
    
    logger.info(f"Synced {synced} products to unified_products")
    
    return {"success": True, "synced": synced}


@router.get("/admin/sync-status")
async def get_sync_status():
    """Get sync status between products and unified_products"""
    db = get_db()
    
    products_count = await db.products_master.count_documents({})
    unified_count = await db.products_master.count_documents({})
    
    return {
        "products_collection": products_count,
        "unified_products_collection": unified_count,
        "difference": products_count - unified_count,
        "in_sync": products_count == unified_count
    }

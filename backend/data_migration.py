"""
Data Migration Module for The Doggy Company
Allows exporting all data from preview and importing to production
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from bson import ObjectId
import json

router = APIRouter(prefix="/api/admin/migration", tags=["Data Migration"])

# These will be set by server.py
db = None
verify_admin = None

def set_migration_db(database):
    global db
    db = database

def set_migration_admin_verify(admin_verify_func):
    global verify_admin
    verify_admin = admin_verify_func

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                result['_id'] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = [serialize_doc(item) if isinstance(item, (dict, list)) else item for item in value]
            else:
                result[key] = value
        return result
    elif isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    return doc


@router.get("/export-all")
async def export_all_data(username: str = Depends(lambda: verify_admin)):
    """
    Export all critical data from the database for migration.
    Returns a JSON structure with all collections.
    """
    try:
        export_data = {
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "collections": {}
        }
        
        # Export Products
        products = await db.products.find({}).to_list(length=10000)
        export_data["collections"]["products"] = [serialize_doc(p) for p in products]
        
        # Export Restaurants
        restaurants = await db.restaurants.find({}).to_list(length=1000)
        export_data["collections"]["restaurants"] = [serialize_doc(r) for r in restaurants]
        
        # Export Pillars
        pillars = await db.pillars.find({}).to_list(length=100)
        export_data["collections"]["pillars"] = [serialize_doc(p) for p in pillars]
        
        # Export Categories
        categories = await db.categories.find({}).to_list(length=500)
        export_data["collections"]["categories"] = [serialize_doc(c) for c in categories]
        
        # Export Enhanced Collections (Campaign Pages)
        collections = await db.enhanced_collections.find({}).to_list(length=100)
        export_data["collections"]["enhanced_collections"] = [serialize_doc(c) for c in collections]
        
        # Export Product Placements
        placements = await db.product_placements.find({}).to_list(length=1000)
        export_data["collections"]["product_placements"] = [serialize_doc(p) for p in placements]
        
        # Export Shipping Rules
        shipping_rules = await db.shipping_rules.find({}).to_list(length=100)
        export_data["collections"]["shipping_rules"] = [serialize_doc(s) for s in shipping_rules]
        
        # Export Pillar Commissions
        pillar_commissions = await db.pillar_commissions.find({}).to_list(length=100)
        export_data["collections"]["pillar_commissions"] = [serialize_doc(c) for c in pillar_commissions]
        
        # Summary
        export_data["summary"] = {
            "products": len(export_data["collections"]["products"]),
            "restaurants": len(export_data["collections"]["restaurants"]),
            "pillars": len(export_data["collections"]["pillars"]),
            "categories": len(export_data["collections"]["categories"]),
            "enhanced_collections": len(export_data["collections"]["enhanced_collections"]),
            "product_placements": len(export_data["collections"]["product_placements"]),
            "shipping_rules": len(export_data["collections"]["shipping_rules"]),
            "pillar_commissions": len(export_data["collections"]["pillar_commissions"]),
        }
        
        return export_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.post("/import-all")
async def import_all_data(data: Dict[str, Any], username: str = Depends(lambda: verify_admin)):
    """
    Import data into the database. Uses upsert to avoid duplicates.
    """
    try:
        results = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "imported": {},
            "errors": []
        }
        
        collections_data = data.get("collections", {})
        
        # Import Pillars first (they're referenced by other collections)
        if "pillars" in collections_data:
            count = 0
            for pillar in collections_data["pillars"]:
                pillar_id = pillar.get("id") or pillar.get("_id")
                if pillar_id:
                    pillar.pop("_id", None)  # Remove MongoDB _id
                    await db.pillars.update_one(
                        {"id": pillar_id},
                        {"$set": pillar},
                        upsert=True
                    )
                    count += 1
            results["imported"]["pillars"] = count
        
        # Import Categories
        if "categories" in collections_data:
            count = 0
            for category in collections_data["categories"]:
                cat_id = category.get("id") or category.get("_id")
                if cat_id:
                    category.pop("_id", None)
                    await db.categories.update_one(
                        {"id": cat_id},
                        {"$set": category},
                        upsert=True
                    )
                    count += 1
            results["imported"]["categories"] = count
        
        # Import Products
        if "products" in collections_data:
            count = 0
            for product in collections_data["products"]:
                prod_id = product.get("id") or product.get("shopify_id") or product.get("_id")
                if prod_id:
                    product.pop("_id", None)
                    # Use id or shopify_id as the unique identifier
                    query = {"id": prod_id} if product.get("id") else {"shopify_id": prod_id}
                    await db.products.update_one(
                        query,
                        {"$set": product},
                        upsert=True
                    )
                    count += 1
            results["imported"]["products"] = count
        
        # Import Restaurants
        if "restaurants" in collections_data:
            count = 0
            for restaurant in collections_data["restaurants"]:
                rest_id = restaurant.get("id") or restaurant.get("_id")
                if rest_id:
                    restaurant.pop("_id", None)
                    await db.restaurants.update_one(
                        {"id": rest_id},
                        {"$set": restaurant},
                        upsert=True
                    )
                    count += 1
            results["imported"]["restaurants"] = count
        
        # Import Enhanced Collections
        if "enhanced_collections" in collections_data:
            count = 0
            for collection in collections_data["enhanced_collections"]:
                coll_id = collection.get("id") or collection.get("_id")
                if coll_id:
                    collection.pop("_id", None)
                    await db.enhanced_collections.update_one(
                        {"id": coll_id},
                        {"$set": collection},
                        upsert=True
                    )
                    count += 1
            results["imported"]["enhanced_collections"] = count
        
        # Import Product Placements
        if "product_placements" in collections_data:
            count = 0
            for placement in collections_data["product_placements"]:
                place_id = placement.get("id") or placement.get("_id")
                if place_id:
                    placement.pop("_id", None)
                    await db.product_placements.update_one(
                        {"id": place_id},
                        {"$set": placement},
                        upsert=True
                    )
                    count += 1
            results["imported"]["product_placements"] = count
        
        # Import Shipping Rules
        if "shipping_rules" in collections_data:
            count = 0
            for rule in collections_data["shipping_rules"]:
                rule_id = rule.get("id") or rule.get("_id")
                if rule_id:
                    rule.pop("_id", None)
                    await db.shipping_rules.update_one(
                        {"id": rule_id},
                        {"$set": rule},
                        upsert=True
                    )
                    count += 1
            results["imported"]["shipping_rules"] = count
        
        # Import Pillar Commissions
        if "pillar_commissions" in collections_data:
            count = 0
            for commission in collections_data["pillar_commissions"]:
                comm_id = commission.get("id") or commission.get("pillar_id") or commission.get("_id")
                if comm_id:
                    commission.pop("_id", None)
                    query = {"id": comm_id} if commission.get("id") else {"pillar_id": comm_id}
                    await db.pillar_commissions.update_one(
                        query,
                        {"$set": commission},
                        upsert=True
                    )
                    count += 1
            results["imported"]["pillar_commissions"] = count
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


@router.get("/stats")
async def get_database_stats(username: str = Depends(lambda: verify_admin)):
    """Get current database statistics"""
    try:
        stats = {
            "products": await db.products.count_documents({}),
            "restaurants": await db.restaurants.count_documents({}),
            "pillars": await db.pillars.count_documents({}),
            "categories": await db.categories.count_documents({}),
            "enhanced_collections": await db.enhanced_collections.count_documents({}),
            "product_placements": await db.product_placements.count_documents({}),
            "shipping_rules": await db.shipping_rules.count_documents({}),
            "pillar_commissions": await db.pillar_commissions.count_documents({}),
            "orders": await db.orders.count_documents({}),
            "users": await db.users.count_documents({}),
            "partner_applications": await db.partner_applications.count_documents({}),
        }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stats: {str(e)}")


@router.post("/seed-core-data")
async def seed_core_data(username: str = Depends(lambda: verify_admin)):
    """
    Seed core reference data (Pillars and Categories) if they don't exist.
    This is safe to run multiple times.
    """
    try:
        results = {"pillars_created": 0, "categories_created": 0}
        
        # Default Pillars
        default_pillars = [
            {"id": "celebrate", "name": "Celebrate", "slug": "celebrate", "icon": "🎉", "description": "Products for pet celebrations", "order": 1, "is_active": True},
            {"id": "dine", "name": "Dine", "slug": "dine", "icon": "🍽️", "description": "Pet-friendly restaurants", "order": 2, "is_active": True},
            {"id": "stay", "name": "Stay", "slug": "stay", "icon": "🏨", "description": "Pet-friendly stays & boarding", "order": 3, "is_active": True},
            {"id": "travel", "name": "Travel", "slug": "travel", "icon": "✈️", "description": "Pet travel services", "order": 4, "is_active": True},
            {"id": "care", "name": "Care", "slug": "care", "icon": "💝", "description": "Pet care services", "order": 5, "is_active": True},
        ]
        
        for pillar in default_pillars:
            result = await db.pillars.update_one(
                {"id": pillar["id"]},
                {"$setOnInsert": pillar},
                upsert=True
            )
            if result.upserted_id:
                results["pillars_created"] += 1
        
        # Default Categories for Celebrate pillar
        default_categories = [
            {"id": "birthday-cakes", "name": "Birthday Cakes", "pillar_id": "celebrate", "slug": "birthday-cakes", "order": 1, "is_active": True},
            {"id": "treats", "name": "Treats & Cookies", "pillar_id": "celebrate", "slug": "treats", "order": 2, "is_active": True},
            {"id": "party-supplies", "name": "Party Supplies", "pillar_id": "celebrate", "slug": "party-supplies", "order": 3, "is_active": True},
            {"id": "gifts", "name": "Gift Sets", "pillar_id": "celebrate", "slug": "gifts", "order": 4, "is_active": True},
        ]
        
        for category in default_categories:
            result = await db.categories.update_one(
                {"id": category["id"]},
                {"$setOnInsert": category},
                upsert=True
            )
            if result.upserted_id:
                results["categories_created"] += 1
        
        return {
            "success": True,
            "message": "Core data seeded successfully",
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")

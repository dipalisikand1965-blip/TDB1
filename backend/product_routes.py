"""
Product Routes for The Doggy Company
Handles public product listing, details, search, collections, and reviews
"""

import os
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import secrets

logger = logging.getLogger(__name__)

# Create router
product_router = APIRouter(prefix="/api", tags=["Products"])

# Database and services references
db: AsyncIOMotorDatabase = None
search_service = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_search_service(service):
    global search_service
    search_service = service


def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    """Verify admin credentials"""
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(credentials.password, ADMIN_PASSWORD)
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


# ==================== MODELS ====================

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    title: Optional[str] = None
    image_url: Optional[str] = None


# ==================== PUBLIC PRODUCT ROUTES ====================

@product_router.get("/products")
async def get_public_products(
    category: Optional[str] = None,
    pan_india: Optional[bool] = None,
    search: Optional[str] = None
):
    """Public endpoint for products"""
    query = {}

    # Search logic
    if search:
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"name": search_regex},
            {"tags": search_regex},
            {"category": search_regex},
            {"description": search_regex},
            {"sizes.name": search_regex},
            {"flavors.name": search_regex}
        ]

    # Special handling for pan-india category
    if category == "pan-india" or pan_india:
        pan_india_query = {
            "$or": [
                {"category": "pan-india"},
                {"is_pan_india_shippable": True},
                {"category": {"$in": ["treats", "nut-butters", "desi-treats", "gift-cards"]}}
            ]
        }
        if query:
            query = {"$and": [query, pan_india_query]}
        else:
            query = pan_india_query
    elif category:
        if query:
            query = {"$and": [query, {"category": category}]}
        else:
            query["category"] = category

    products = await db.products.find(query, {"_id": 0}).to_list(500)
    return {"products": products}


@product_router.get("/products/{product_id}/related")
async def get_related_products(product_id: str, limit: int = 4):
    """Get products that go well with the specified product"""

    # Find the current product
    product = await db.products.find_one(
        {"$or": [{"id": product_id}, {"shopify_id": product_id}]},
        {"_id": 0}
    )

    if not product:
        return {"related": [], "bundles": []}

    current_category = product.get("category", "")
    current_price = product.get("price", 0)

    # Define complementary categories for upselling
    upsell_map = {
        "cakes": ["treats", "accessories", "bandanas", "party-supplies"],
        "pupcakes": ["treats", "accessories", "bandanas"],
        "dognuts": ["treats", "cakes", "accessories"],
        "treats": ["cakes", "nut-butters", "accessories"],
        "desi-treats": ["cakes", "treats", "accessories"],
        "fresh-meals": ["treats", "supplements", "bowls"],
        "pan-india": ["pan-india", "treats", "nut-butters", "desi-treats"],
        "nut-butters": ["treats", "cakes", "fresh-meals"],
        "cat-treats": ["cat-cakes", "accessories"],
        "accessories": ["treats", "cakes", "bandanas"],
        "hampers": ["cakes", "treats", "accessories"],
    }

    # Get complementary categories
    complementary_cats = upsell_map.get(current_category, ["treats", "accessories"])

    related_products = []

    # For pan-india category, prioritize pan-india shippable products
    if current_category == "pan-india":
        pan_india_products = await db.products.find(
            {"category": "pan-india", "id": {"$ne": product_id}},
            {"_id": 0}
        ).limit(limit).to_list(limit)
        related_products.extend(pan_india_products)

        if len(related_products) < limit:
            remaining = limit - len(related_products)
            treats = await db.products.find(
                {"category": {"$in": ["treats", "nut-butters", "desi-treats"]}},
                {"_id": 0}
            ).limit(remaining).to_list(remaining)
            related_products.extend(treats)
    else:
        for comp_cat in complementary_cats:
            cat_products = await db.products.find(
                {"category": comp_cat},
                {"_id": 0}
            ).limit(3).to_list(3)
            related_products.extend(cat_products)

    # Also get similar products from same category
    similar = await db.products.find(
        {
            "category": current_category,
            "id": {"$ne": product_id},
            "price": {"$gte": current_price * 0.5, "$lte": current_price * 1.5}
        },
        {"_id": 0}
    ).limit(2).to_list(2)

    # Remove duplicates and limit
    seen_ids = {product_id}
    unique_related = []
    for p in related_products + similar:
        pid = p.get("id") or p.get("shopify_id")
        if pid and pid not in seen_ids:
            seen_ids.add(pid)
            unique_related.append(p)
            if len(unique_related) >= limit:
                break

    # Create bundle suggestions
    bundles = []
    if current_category in ["cakes", "pupcakes"]:
        treat = await db.products.find_one({"category": "treats"}, {"_id": 0})
        bandana = await db.products.find_one({"category": {"$in": ["accessories", "bandanas"]}}, {"_id": 0})
        if treat and bandana:
            bundle_price = current_price + treat.get("price", 0) + bandana.get("price", 0)
            bundles.append({
                "name": "🎉 Celebration Bundle",
                "description": "Complete the pawty!",
                "items": [product, treat, bandana],
                "originalPrice": bundle_price,
                "bundlePrice": int(bundle_price * 0.9),
                "savings": int(bundle_price * 0.1)
            })

    return {
        "related": unique_related,
        "bundles": bundles,
        "category": current_category
    }


# ==================== SEARCH ROUTES ====================

async def mongodb_fallback_search(
    q: str,
    limit: int = 20,
    offset: int = 0,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort: Optional[str] = None
):
    """Fallback search using MongoDB when Meilisearch is unavailable"""
    search_regex = {"$regex": q, "$options": "i"}
    query = {
        "$or": [
            {"name": search_regex},
            {"description": search_regex},
            {"tags": search_regex},
            {"category": search_regex},
        ]
    }
    
    # Add filters
    if category:
        query["category"] = category
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        if "price" in query:
            query["price"]["$lte"] = max_price
        else:
            query["price"] = {"$lte": max_price}
    
    # Determine sort
    sort_field = [("name", 1)]  # default
    if sort == "price_asc":
        sort_field = [("price", 1)]
    elif sort == "price_desc":
        sort_field = [("price", -1)]
    elif sort == "name_desc":
        sort_field = [("name", -1)]
    
    # Get total count
    total = await db.products.count_documents(query)
    
    # Get products
    products = await db.products.find(query, {"_id": 0}).sort(sort_field).skip(offset).limit(limit).to_list(limit)
    
    return {
        "hits": products,
        "query": q,
        "estimatedTotalHits": total,
        "limit": limit,
        "offset": offset,
        "fallback": True
    }


@product_router.get("/search")
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None,
    collection_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    tags: Optional[str] = None,
    pan_india: Optional[bool] = None,
    autoship: Optional[bool] = None,
    sort: Optional[str] = Query(None, description="Sort by: price_asc, price_desc, name_asc, name_desc"),
):
    """Smart search endpoint with typo tolerance, filters, and faceted results"""
    # Use MongoDB fallback if Meilisearch is not available
    if not search_service or not search_service._initialized:
        return await mongodb_fallback_search(q, limit, offset, category, min_price, max_price, sort)

    filters = {}
    if category:
        filters["category"] = category
    if collection_id:
        filters["collection_id"] = collection_id
    if min_price is not None:
        filters["min_price"] = min_price
    if max_price is not None:
        filters["max_price"] = max_price
    if tags:
        filters["tags"] = tags.split(",")
    if pan_india:
        filters["is_pan_india"] = True
    if autoship:
        filters["autoship_enabled"] = True

    sort_options = None
    if sort:
        sort_map = {
            "price_asc": ["price:asc"],
            "price_desc": ["price:desc"],
            "name_asc": ["name:asc"],
            "name_desc": ["name:desc"],
        }
        sort_options = sort_map.get(sort)

    results = await search_service.search(
        query=q,
        limit=limit,
        offset=offset,
        filters=filters if filters else None,
        sort=sort_options,
    )

    return results


@product_router.get("/search/typeahead")
async def search_typeahead(
    q: str = Query(..., min_length=2, description="Search query for typeahead"),
    limit: int = Query(8, ge=1, le=20),
):
    """Fast typeahead search for autocomplete"""
    if not search_service:
        raise HTTPException(status_code=503, detail="Search service not available")

    results = await search_service.typeahead(query=q, limit=limit)
    return results


@product_router.get("/search/stats")
async def get_search_stats():
    """Get search index statistics"""
    if not search_service:
        return {"error": "Search service not available"}
    return await search_service.get_stats()


@product_router.post("/search/reindex")
async def reindex_search(credentials: HTTPBasicCredentials = Depends(security)):
    """Reindex all products in the search engine (admin only)"""
    verify_admin(credentials)

    products = await db.products.find({}, {"_id": 0}).to_list(10000)

    if products:
        await search_service.index_products_batch(products)

    collections = await db.collections.find({}, {"_id": 0}).to_list(1000)
    if collections:
        await search_service.index_collections_batch(collections)

    return {
        "success": True,
        "products_indexed": len(products),
        "collections_indexed": len(collections)
    }


# ==================== COLLECTION ROUTES ====================

@product_router.get("/collections")
async def get_public_collections():
    """Get all collections (public)"""
    collections = await db.collections.find({}, {"_id": 0}).to_list(100)
    return {"collections": collections}


@product_router.get("/collections/{collection_id}")
async def get_collection(collection_id: str):
    """Get a specific collection with its products"""
    collection = await db.collections.find_one(
        {"$or": [{"id": collection_id}, {"handle": collection_id}]},
        {"_id": 0}
    )

    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    # Get products in this collection
    product_ids = collection.get("product_ids", [])
    products = await db.products.find(
        {"id": {"$in": product_ids}},
        {"_id": 0}
    ).to_list(100)

    return {
        "collection": collection,
        "products": products
    }


# ==================== REVIEW ROUTES (PUBLIC) ====================

@product_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    """Get approved reviews for a product"""
    reviews = await db.reviews.find(
        {"product_id": product_id, "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)

    # Calculate stats
    if reviews:
        total = len(reviews)
        avg_rating = sum(r.get("rating", 0) for r in reviews) / total
        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for r in reviews:
            rating = r.get("rating", 5)
            if rating in rating_dist:
                rating_dist[rating] += 1
    else:
        total = 0
        avg_rating = 0
        rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}

    return {
        "reviews": reviews,
        "stats": {
            "total": total,
            "average_rating": round(avg_rating, 1),
            "rating_distribution": rating_dist
        }
    }


@product_router.post("/reviews")
async def submit_review(review: ReviewCreate):
    """Submit a product review (public endpoint)"""
    # Get product info
    product = await db.products.find_one({"id": review.product_id}, {"_id": 0, "name": 1, "image": 1})

    review_doc = {
        "id": f"review_{uuid.uuid4().hex[:12]}",
        "product_id": review.product_id,
        "rating": review.rating,
        "content": review.comment,
        "title": review.title,
        "author_name": review.reviewer_name or "Anonymous",
        "user_email": review.reviewer_email,
        "image_url": review.image_url,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if product:
        review_doc["product_name"] = product.get("name")
        review_doc["product_image"] = product.get("image")

    await db.reviews.insert_one(review_doc)

    return {"message": "Review submitted for approval", "review_id": review_doc["id"]}

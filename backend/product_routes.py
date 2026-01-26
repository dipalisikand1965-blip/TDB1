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
# NOTE: Main product routes are in server.py (api_router)
# The routes below are kept for reference but commented out to avoid conflicts
# In a future refactor, move server.py product routes here

# These routes are DISABLED - server.py has the comprehensive versions:
# - GET /products (server.py has pillar-aware, better search)
# - GET /products/{product_id}/related (server.py has pillar-aware recommendations)

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
    # Split query into words for better matching
    query_words = [w.strip() for w in q.lower().split() if w.strip()]
    
    # Build comprehensive OR conditions
    or_conditions = []
    
    # Full query match
    full_regex = {"$regex": q, "$options": "i"}
    or_conditions.extend([
        {"name": full_regex},
        {"description": full_regex},
    ])
    
    # Individual word matching across all searchable fields
    searchable_fields = [
        "name", "description", "category", "tags",
        "intelligent_tags", "breed_tags", "health_tags", 
        "occasion_tags", "diet_tags", "lifestage_tags",
        "size_tags", "search_keywords"
    ]
    
    for word in query_words:
        word_regex = {"$regex": word, "$options": "i"}
        for field in searchable_fields:
            or_conditions.append({field: word_regex})
    
    query = {"$or": or_conditions}
    
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
    
    # Get total count
    total = await db.products.count_documents(query)
    
    # Get products with relevance scoring using aggregation
    pipeline = [
        {"$match": query},
        {
            "$addFields": {
                "relevance_score": {
                    "$add": [
                        # High weight for name match
                        {"$cond": [{"$regexMatch": {"input": {"$toLower": "$name"}, "regex": q.lower()}}, 100, 0]},
                        # Medium weight for breed tags
                        {"$cond": [{"$in": [q.lower(), {"$ifNull": [{"$map": {"input": {"$ifNull": ["$breed_tags", []]}, "as": "t", "in": {"$toLower": "$$t"}}}, []]}]}, 50, 0]},
                        # Weight for occasion tags
                        {"$cond": [{"$gt": [{"$size": {"$ifNull": ["$occasion_tags", []]}}, 0]}, 20, 0]},
                        # Base weight for any match
                        10
                    ]
                }
            }
        },
        {"$sort": {"relevance_score": -1, "name": 1}},
        {"$skip": offset},
        {"$limit": limit},
        {"$project": {"relevance_score": 0}}  # Remove the score from output
    ]
    
    # Apply custom sort if specified
    if sort == "price_asc":
        pipeline[3] = {"$sort": {"price": 1}}
    elif sort == "price_desc":
        pipeline[3] = {"$sort": {"price": -1}}
    elif sort == "name_desc":
        pipeline[3] = {"$sort": {"name": -1}}
    
    products = await db.products.aggregate(pipeline).to_list(limit)
    
    # Remove _id from results
    for p in products:
        p.pop("_id", None)
    
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
    # Use MongoDB fallback if Meilisearch is not available
    if not search_service or not search_service._initialized:
        search_regex = {"$regex": q, "$options": "i"}
        products = await db.products.find(
            {"$or": [{"name": search_regex}, {"tags": search_regex}, {"category": search_regex}]},
            {"_id": 0, "id": 1, "name": 1, "image": 1, "price": 1, "category": 1}
        ).limit(limit).to_list(limit)
        
        collections = await db.collections.find(
            {"$or": [{"name": search_regex}, {"description": search_regex}]},
            {"_id": 0, "id": 1, "name": 1, "slug": 1, "image": 1}
        ).limit(4).to_list(4)
        
        return {"products": products, "collections": collections, "query": q, "fallback": True}

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
    # Calculate product_count from product_ids
    for col in collections:
        col["product_count"] = len(col.get("product_ids", []))
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


# NOTE: POST /api/reviews endpoint moved to review_routes.py (Phase 3 refactoring)
# The review_routes.py version includes admin notifications and user association

"""
PawMeter API
Universal 1-10 paw rating system for products

Replaces traditional star reviews with a paw-based scoring system.
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pawmeter", tags=["PawMeter"])

# Database reference
db = None

def set_pawmeter_db(database):
    global db
    db = database

def get_utc_timestamp():
    return datetime.now(timezone.utc).isoformat()


# Models
class PawRatingCreate(BaseModel):
    product_id: str
    paw_score: int  # 1-10
    feedback: Optional[str] = None
    user_email: Optional[EmailStr] = None
    user_name: Optional[str] = "Anonymous"


class PawRatingResponse(BaseModel):
    id: str
    product_id: str
    paw_score: int
    feedback: Optional[str]
    user_name: str
    created_at: str
    status: str


# Routes
@router.post("/rate")
async def submit_paw_rating(rating: PawRatingCreate):
    """Submit a PawMeter rating for a product"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Validate paw score
    if not 1 <= rating.paw_score <= 10:
        raise HTTPException(status_code=400, detail="Paw score must be between 1 and 10")
    
    # Check if product exists
    product = await db.products.find_one({"id": rating.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Create rating document
    rating_doc = {
        "id": f"PAW-{uuid.uuid4().hex[:8].upper()}",
        "product_id": rating.product_id,
        "product_name": product.get("name", "Unknown"),
        "paw_score": rating.paw_score,
        "feedback": rating.feedback,
        "user_email": rating.user_email,
        "user_name": rating.user_name or "Anonymous",
        "status": "approved",  # Auto-approve for now
        "created_at": get_utc_timestamp(),
        "updated_at": get_utc_timestamp()
    }
    
    # Insert rating
    await db.paw_ratings.insert_one(rating_doc)
    
    # Update product's average paw score
    await update_product_paw_score(rating.product_id)
    
    logger.info(f"PawMeter rating submitted: {rating_doc['id']} for product {rating.product_id}")
    
    return {
        "id": rating_doc["id"],
        "product_id": rating.product_id,
        "paw_score": rating.paw_score,
        "new_average": await get_product_paw_score(rating.product_id),
        "message": "Rating submitted successfully"
    }


@router.get("/product/{product_id}")
async def get_product_ratings(product_id: str, limit: int = 20, skip: int = 0):
    """Get all PawMeter ratings for a product"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    # Get ratings
    cursor = db.paw_ratings.find(
        {"product_id": product_id, "status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    ratings = await cursor.to_list(length=limit)
    
    # Get stats
    stats = await get_product_paw_stats(product_id)
    
    return {
        "product_id": product_id,
        "ratings": ratings,
        "stats": stats,
        "total": stats.get("total_ratings", 0)
    }


@router.get("/product/{product_id}/score")
async def get_product_score(product_id: str):
    """Get just the PawMeter score for a product"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    stats = await get_product_paw_stats(product_id)
    
    return {
        "product_id": product_id,
        "paw_score": stats.get("average_score", 0),
        "total_ratings": stats.get("total_ratings", 0),
        "distribution": stats.get("distribution", {})
    }


@router.get("/recent")
async def get_recent_ratings(limit: int = 10):
    """Get most recent PawMeter ratings across all products"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    cursor = db.paw_ratings.find(
        {"status": "approved"},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit)
    
    ratings = await cursor.to_list(length=limit)
    
    return {"ratings": ratings, "count": len(ratings)}


@router.get("/top-rated")
async def get_top_rated_products(limit: int = 10, min_ratings: int = 3):
    """Get top-rated products by PawMeter score"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    pipeline = [
        {"$match": {"status": "approved"}},
        {"$group": {
            "_id": "$product_id",
            "product_name": {"$first": "$product_name"},
            "average_score": {"$avg": "$paw_score"},
            "total_ratings": {"$sum": 1}
        }},
        {"$match": {"total_ratings": {"$gte": min_ratings}}},
        {"$sort": {"average_score": -1}},
        {"$limit": limit}
    ]
    
    results = await db.paw_ratings.aggregate(pipeline).to_list(length=limit)
    
    # Enrich with product details
    top_products = []
    for r in results:
        product = await db.products.find_one({"id": r["_id"]}, {"_id": 0, "id": 1, "name": 1, "image": 1, "price": 1})
        if product:
            top_products.append({
                "product": product,
                "paw_score": round(r["average_score"], 1),
                "total_ratings": r["total_ratings"]
            })
    
    return {"top_rated": top_products}


# Helper functions
async def get_product_paw_stats(product_id: str) -> dict:
    """Get comprehensive PawMeter stats for a product"""
    pipeline = [
        {"$match": {"product_id": product_id, "status": "approved"}},
        {"$group": {
            "_id": None,
            "average_score": {"$avg": "$paw_score"},
            "total_ratings": {"$sum": 1},
            "score_1_2": {"$sum": {"$cond": [{"$lte": ["$paw_score", 2]}, 1, 0]}},
            "score_3_4": {"$sum": {"$cond": [{"$and": [{"$gt": ["$paw_score", 2]}, {"$lte": ["$paw_score", 4]}]}, 1, 0]}},
            "score_5_6": {"$sum": {"$cond": [{"$and": [{"$gt": ["$paw_score", 4]}, {"$lte": ["$paw_score", 6]}]}, 1, 0]}},
            "score_7_8": {"$sum": {"$cond": [{"$and": [{"$gt": ["$paw_score", 6]}, {"$lte": ["$paw_score", 8]}]}, 1, 0]}},
            "score_9_10": {"$sum": {"$cond": [{"$gt": ["$paw_score", 8]}, 1, 0]}}
        }}
    ]
    
    results = await db.paw_ratings.aggregate(pipeline).to_list(length=1)
    
    if not results:
        return {
            "average_score": 0,
            "total_ratings": 0,
            "distribution": {"1-2": 0, "3-4": 0, "5-6": 0, "7-8": 0, "9-10": 0}
        }
    
    r = results[0]
    return {
        "average_score": round(r["average_score"], 1),
        "total_ratings": r["total_ratings"],
        "distribution": {
            "1-2": r["score_1_2"],
            "3-4": r["score_3_4"],
            "5-6": r["score_5_6"],
            "7-8": r["score_7_8"],
            "9-10": r["score_9_10"]
        }
    }


async def get_product_paw_score(product_id: str) -> float:
    """Get just the average paw score for a product"""
    stats = await get_product_paw_stats(product_id)
    return stats.get("average_score", 0)


async def update_product_paw_score(product_id: str):
    """Update the cached paw score on the product document"""
    stats = await get_product_paw_stats(product_id)
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {
            "paw_score": stats.get("average_score", 0),
            "paw_ratings_count": stats.get("total_ratings", 0),
            "paw_score_updated_at": get_utc_timestamp()
        }}
    )


# Admin routes
@router.get("/admin/all")
async def get_all_ratings(limit: int = 50, skip: int = 0, status: str = None):
    """Admin: Get all ratings with optional status filter"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if status:
        query["status"] = status
    
    cursor = db.paw_ratings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    ratings = await cursor.to_list(length=limit)
    total = await db.paw_ratings.count_documents(query)
    
    return {"ratings": ratings, "total": total}


@router.put("/admin/{rating_id}/status")
async def update_rating_status(rating_id: str, status: str):
    """Admin: Update rating status (approved/pending/rejected)"""
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    if status not in ["approved", "pending", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.paw_ratings.update_one(
        {"id": rating_id},
        {"$set": {"status": status, "updated_at": get_utc_timestamp()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    # Update product score if status changed
    rating = await db.paw_ratings.find_one({"id": rating_id})
    if rating:
        await update_product_paw_score(rating["product_id"])
    
    return {"message": f"Rating {rating_id} status updated to {status}"}

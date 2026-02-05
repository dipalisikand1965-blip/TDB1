"""
Review Routes for The Doggy Company
Handles product reviews - user submission, admin moderation, and display
"""

import os
import uuid
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
import jwt

logger = logging.getLogger(__name__)

# Create routers
review_router = APIRouter(prefix="/api", tags=["Reviews"])
admin_review_router = APIRouter(prefix="/api/admin", tags=["Admin Reviews"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()

# JWT Settings
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"

# Dependencies
_create_admin_notification_func = None


# Pydantic models
class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str
    reviewer_name: Optional[str] = None
    reviewer_email: Optional[str] = None
    title: Optional[str] = None
    image_url: Optional[str] = None


class Review(BaseModel):
    id: str = None
    product_id: str
    author_name: str
    user_email: Optional[str] = None
    user_id: Optional[str] = None
    rating: int
    title: Optional[str] = None
    content: str
    image_url: Optional[str] = None
    status: str = "pending"
    created_at: str = None
    
    def __init__(self, **data):
        if 'id' not in data or data['id'] is None:
            data['id'] = f"rev-{uuid.uuid4().hex[:12]}"
        if 'created_at' not in data or data['created_at'] is None:
            data['created_at'] = datetime.now(timezone.utc).isoformat()
        super().__init__(**data)


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


def set_dependencies(
    get_current_user_func,
    get_current_user_optional_func,
    verify_admin_func,
    create_admin_notification_func
):
    """Inject dependencies from server.py"""
    global _create_admin_notification_func
    _create_admin_notification_func = create_admin_notification_func


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


async def get_current_user_from_token(authorization: str = Header(None)):
    """Extract and validate user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_current_user_optional(authorization: str = Header(None)):
    """Get current user if authenticated, otherwise return None"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except jwt.PyJWTError:
        return None
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    return user


async def create_admin_notification(**kwargs):
    """Wrapper for admin notification"""
    if _create_admin_notification_func:
        return await _create_admin_notification_func(**kwargs)


# ==================== PUBLIC/USER REVIEW ROUTES ====================

@review_router.post("/reviews")
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user_optional)):
    """Submit a new review"""
    # Get product info for the review
    product = await db.products_master.find_one({"id": review.product_id}, {"_id": 0, "name": 1, "image": 1})
    
    review_doc = Review(
        product_id=review.product_id,
        author_name=review.reviewer_name or (current_user.get("name") if current_user else "Anonymous"),
        user_email=review.reviewer_email or (current_user.get("email") if current_user else None),
        user_id=current_user.get("id") if current_user else None,
        rating=review.rating,
        title=review.title,
        content=review.comment,
        image_url=review.image_url
    ).model_dump()
    
    # Add product info for display
    if product:
        review_doc["product_name"] = product.get("name")
        review_doc["product_image"] = product.get("image")
    
    await db.reviews.insert_one(review_doc)
    
    # Create admin notification for new review
    await create_admin_notification(
        notification_type="review",
        title=f"⭐ New {review.rating}-Star Review",
        message=f"{review_doc.get('author_name', 'Someone')} reviewed {product.get('name', 'a product') if product else 'a product'}",
        category="celebrate",
        related_id=review_doc.get("id"),
        link_to="/admin?tab=reviews",
        priority="high" if review.rating <= 2 else "normal",
        metadata={
            "rating": review.rating,
            "product": product.get("name") if product else None,
            "reviewer": review_doc.get("author_name")
        }
    )
    
    return {"message": "Review submitted for approval", "review": {k: v for k, v in review_doc.items() if k != "_id"}}


@review_router.get("/reviews/my-reviews")
async def get_my_reviews(current_user: dict = Depends(get_current_user_from_token)):
    """Get reviews submitted by the logged-in user"""
    reviews = await db.reviews.find(
        {"user_email": current_user["email"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with product info
    for r in reviews:
        product = await db.products_master.find_one({"id": r.get("product_id")}, {"_id": 0, "name": 1, "image": 1})
        if product:
            r["product_name"] = product.get("name")
            r["product_image"] = product.get("image")
        # Map content to comment for frontend compatibility
        r["comment"] = r.get("content", "")
    
    return {"reviews": reviews}


@review_router.put("/reviews/{review_id}")
async def update_user_review(review_id: str, update: ReviewCreate, current_user: dict = Depends(get_current_user_from_token)):
    """Update a review (only by the owner)"""
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Verify ownership
    if review.get("user_email") != current_user.get("email"):
        raise HTTPException(status_code=403, detail="You can only edit your own reviews")
    
    # Update the review
    update_data = {
        "author_name": update.reviewer_name or current_user.get("name"),
        "rating": update.rating,
        "content": update.comment,
        "status": "pending"  # Re-submit for approval when edited
    }
    if update.title:
        update_data["title"] = update.title
    
    await db.reviews.update_one({"id": review_id}, {"$set": update_data})
    return {"message": "Review updated and submitted for re-approval"}


@review_router.delete("/reviews/{review_id}")
async def delete_user_review(review_id: str, current_user: dict = Depends(get_current_user_from_token)):
    """Delete a review (only by the owner)"""
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Verify ownership
    if review.get("user_email") != current_user.get("email"):
        raise HTTPException(status_code=403, detail="You can only delete your own reviews")
    
    await db.reviews.delete_one({"id": review_id})
    return {"message": "Review deleted"}


@review_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    """Get approved reviews for a product"""
    reviews = await db.reviews.find(
        {"product_id": product_id, "status": "approved"}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return {"reviews": reviews}


# ==================== ADMIN REVIEW ROUTES ====================

@admin_review_router.get("/reviews")
async def get_admin_reviews(status: Optional[str] = None, username: str = Depends(verify_admin)):
    """Get all reviews for admin"""
    query = {}
    if status:
        query["status"] = status
        
    reviews = await db.reviews.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Enrich with product names
    for r in reviews:
        product = await db.products_master.find_one({"id": r["product_id"]}, {"name": 1})
        if product:
            r["product_name"] = product["name"]
            
    return {"reviews": reviews}


@admin_review_router.put("/reviews/{review_id}")
async def update_review_status(review_id: str, update: dict, username: str = Depends(verify_admin)):
    """Approve or reject a review"""
    status = update.get("status")
    if status not in ["approved", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    await db.reviews.update_one({"id": review_id}, {"$set": {"status": status}})
    
    # If approved, update product rating stats
    if status == "approved":
        review = await db.reviews.find_one({"id": review_id})
        if review:
            # Recalculate average
            pipeline = [
                {"$match": {"product_id": review["product_id"], "status": "approved"}},
                {"$group": {"_id": "$product_id", "avg_rating": {"$avg": "$rating"}, "count": {"$sum": 1}}}
            ]
            stats = await db.reviews.aggregate(pipeline).to_list(1)
            if stats:
                await db.products_master.update_one(
                    {"id": review["product_id"]},
                    {"$set": {
                        "rating": stats[0]["avg_rating"],
                        "reviews": stats[0]["count"]
                    }}
                )
    
    return {"message": "Review updated"}

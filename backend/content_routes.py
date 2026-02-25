"""
Content Routes for The Doggy Company
Handles Testimonials and Blog/Insights CRUD operations
"""

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

# Create routers
content_router = APIRouter(prefix="/api", tags=["Content"])
content_admin_router = APIRouter(prefix="/api/admin", tags=["Content Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

# Admin credentials
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "woof2025")
security = HTTPBasic()


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


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


# ==================== TESTIMONIALS ADMIN ROUTES ====================

@content_admin_router.get("/testimonials")
async def get_all_testimonials(username: str = Depends(verify_admin)):
    """Get all testimonials for admin"""
    testimonials = await db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"testimonials": testimonials, "total": len(testimonials)}


@content_admin_router.post("/testimonials")
async def create_testimonial(testimonial: dict, username: str = Depends(verify_admin)):
    """Create a new testimonial"""
    data = {
        "id": f"test-{uuid.uuid4().hex[:8]}",
        "name": testimonial.get("name", ""),
        "location": testimonial.get("location", ""),
        "pet_name": testimonial.get("pet_name", ""),
        "rating": testimonial.get("rating", 5),
        "text": testimonial.get("text", ""),
        "photo_url": testimonial.get("photo_url"),
        "is_featured": testimonial.get("is_featured", False),
        "is_approved": testimonial.get("is_approved", True),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.testimonials.insert_one(data)
    return {"message": "Testimonial created", "testimonial": {k: v for k, v in data.items() if k != "_id"}}


@content_admin_router.put("/testimonials/{testimonial_id}")
async def update_testimonial(testimonial_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a testimonial"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.testimonials.update_one({"id": testimonial_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    updated = await db.testimonials.find_one({"id": testimonial_id}, {"_id": 0})
    return {"message": "Testimonial updated", "testimonial": updated}


@content_admin_router.delete("/testimonials/{testimonial_id}")
async def delete_testimonial(testimonial_id: str, username: str = Depends(verify_admin)):
    """Delete a testimonial"""
    result = await db.testimonials.delete_one({"id": testimonial_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"message": "Testimonial deleted"}


# ==================== TESTIMONIALS PUBLIC ROUTES ====================

@content_router.get("/testimonials")
async def get_public_testimonials(featured_only: bool = False):
    """Public endpoint for testimonials"""
    query = {"is_approved": True}
    if featured_only:
        query["is_featured"] = True
    testimonials = await db.testimonials.find(query, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"testimonials": testimonials}


# ==================== BLOG/INSIGHTS ADMIN ROUTES ====================

@content_admin_router.get("/blog-posts")
async def get_all_blog_posts(username: str = Depends(verify_admin)):
    """Get all blog posts for admin"""
    posts = await db.blog_posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"posts": posts, "total": len(posts)}


@content_admin_router.post("/blog-posts")
async def create_blog_post(post: dict, username: str = Depends(verify_admin)):
    """Create a new blog post"""
    slug = post.get("title", "").lower().replace(" ", "-").replace("'", "")[:50]
    data = {
        "id": f"post-{uuid.uuid4().hex[:8]}",
        "slug": slug,
        "title": post.get("title", ""),
        "excerpt": post.get("excerpt", ""),
        "content": post.get("content", ""),
        "image_url": post.get("image_url"),
        "category": post.get("category", "Tips"),
        "author": post.get("author", "TDB Team"),
        "status": post.get("status", "draft"),
        "is_featured": post.get("is_featured", False),
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "published_at": None
    }
    await db.blog_posts.insert_one(data)
    return {"message": "Blog post created", "post": {k: v for k, v in data.items() if k != "_id"}}


@content_admin_router.put("/blog-posts/{post_id}")
async def update_blog_post(post_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a blog post"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if updates.get("status") == "published" and not updates.get("published_at"):
        updates["published_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.blog_posts.update_one({"id": post_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    updated = await db.blog_posts.find_one({"id": post_id}, {"_id": 0})
    return {"message": "Blog post updated", "post": updated}


@content_admin_router.delete("/blog-posts/{post_id}")
async def delete_blog_post(post_id: str, username: str = Depends(verify_admin)):
    """Delete a blog post"""
    result = await db.blog_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted"}


@content_admin_router.post("/blog-posts/seed")
async def seed_blog_posts(username: str = Depends(verify_admin)):
    """Seed sample blog posts"""
    import secrets
    from timestamp_utils import get_utc_timestamp
    
    sample_posts = [
        {
            "id": f"post-{secrets.token_hex(4)}",
            "slug": "top-10-pet-friendly-hotels-in-india",
            "title": "Top 10 Pet-Friendly Hotels in India",
            "excerpt": "Discover the best accommodations where your furry friend is as welcome as you are.",
            "content": "Planning a vacation with your pet? Here are our top picks for pet-friendly hotels across India, from beachside resorts in Goa to mountain retreats in Himachal Pradesh...",
            "image_url": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
            "featured_image": "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
            "category": "Travel",
            "author": "The Doggy Company Team",
            "status": "published",
            "is_featured": True,
            "views": 0,
            "created_at": get_utc_timestamp(),
            "updated_at": get_utc_timestamp(),
            "published_at": get_utc_timestamp()
        },
        {
            "id": f"post-{secrets.token_hex(4)}",
            "slug": "healthy-homemade-treats-for-your-dog",
            "title": "Healthy Homemade Treats for Your Dog",
            "excerpt": "Simple recipes to make nutritious and delicious treats at home.",
            "content": "While our bakery offers premium treats, sometimes you might want to whip up something special at home. Here are 5 vet-approved recipes that your dog will love...",
            "image_url": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800",
            "featured_image": "https://images.unsplash.com/photo-1544568100-847a948585b9?w=800",
            "category": "Health",
            "author": "Dr. Sneha Patel",
            "status": "published",
            "is_featured": False,
            "views": 0,
            "created_at": get_utc_timestamp(),
            "updated_at": get_utc_timestamp(),
            "published_at": get_utc_timestamp()
        },
        {
            "id": f"post-{secrets.token_hex(4)}",
            "slug": "pet-friendly-cafes-in-bangalore",
            "title": "Pet-Friendly Cafes in Bangalore: A Complete Guide",
            "excerpt": "Brunch spots where your pooch can join the fun too!",
            "content": "Bangalore has embraced the pet-friendly cafe culture like no other city in India. Here is our curated list of the best spots for a pawsome meal out...",
            "image_url": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800",
            "featured_image": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800",
            "category": "Dine",
            "author": "Foodie Paws",
            "status": "published",
            "is_featured": True,
            "views": 0,
            "created_at": get_utc_timestamp(),
            "updated_at": get_utc_timestamp(),
            "published_at": get_utc_timestamp()
        },
        {
            "id": f"post-{secrets.token_hex(4)}",
            "slug": "understanding-your-dogs-body-language",
            "title": "Understanding Your Dog's Body Language",
            "excerpt": "Learn to decode what your furry friend is really trying to tell you.",
            "content": "Dogs communicate through a rich vocabulary of body language. From tail wags to ear positions, understanding these signals can strengthen your bond...",
            "image_url": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800",
            "featured_image": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800",
            "category": "Care",
            "author": "Dr. Amit Kumar",
            "status": "published",
            "is_featured": False,
            "views": 0,
            "created_at": get_utc_timestamp(),
            "updated_at": get_utc_timestamp(),
            "published_at": get_utc_timestamp()
        },
        {
            "id": f"post-{secrets.token_hex(4)}",
            "slug": "how-to-plan-the-perfect-gotcha-day-celebration",
            "title": "How to Plan the Perfect Gotcha Day Celebration",
            "excerpt": "Make your adopted pet's anniversary unforgettable!",
            "content": "Gotcha Day - the anniversary of when your rescue pet joined your family - deserves to be celebrated! Here are creative ideas to make it special...",
            "image_url": "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800",
            "featured_image": "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800",
            "category": "Celebrate",
            "author": "The Doggy Company Team",
            "status": "published",
            "is_featured": True,
            "views": 0,
            "created_at": get_utc_timestamp(),
            "updated_at": get_utc_timestamp(),
            "published_at": get_utc_timestamp()
        },
        {
            "id": f"post-{secrets.token_hex(4)}",
            "slug": "5-tips-for-dog-birthday-parties",
            "title": "5 Tips for Throwing the Perfect Dog Birthday Party",
            "excerpt": "Make your pup's birthday celebration unforgettable!",
            "content": "Your furry friend's birthday deserves a pawsome celebration! Here are our top tips for throwing the perfect dog birthday party that both pups and humans will enjoy...",
            "image_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800",
            "featured_image": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800",
            "category": "Celebrate",
            "author": "TDB Team",
            "status": "published",
            "is_featured": True,
            "views": 0,
            "created_at": get_utc_timestamp(),
            "updated_at": get_utc_timestamp(),
            "published_at": get_utc_timestamp()
        }
    ]
    
    seeded = 0
    for post in sample_posts:
        existing = await db.blog_posts.find_one({"slug": post["slug"]})
        if not existing:
            await db.blog_posts.insert_one(post)
            seeded += 1
    
    return {"success": True, "message": f"Seeded {seeded} blog posts", "seeded": seeded}


# ==================== BLOG/INSIGHTS PUBLIC ROUTES ====================

@content_router.get("/blog-posts")
async def get_public_blog_posts(
    category: Optional[str] = None, 
    featured_only: bool = False,
    limit: int = 20
):
    """Public endpoint for blog posts"""
    query = {"status": "published"}
    if category:
        query["category"] = category
    if featured_only:
        query["is_featured"] = True
    posts = await db.blog_posts.find(query, {"_id": 0, "content": 0}).sort("published_at", -1).limit(limit).to_list(limit)
    return {"posts": posts}


@content_router.get("/blog-posts/{slug}")
async def get_blog_post(slug: str):
    """Get single blog post by slug"""
    post = await db.blog_posts.find_one(
        {"$or": [{"slug": slug}, {"id": slug}]},
        {"_id": 0}
    )
    if not post:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    # Increment view count
    await db.blog_posts.update_one(
        {"$or": [{"slug": slug}, {"id": slug}]},
        {"$inc": {"views": 1}}
    )
    
    return post


@content_router.get("/blog-categories")
async def get_blog_categories():
    """Get all blog categories"""
    categories = await db.blog_posts.distinct("category", {"status": "published"})
    return {"categories": categories}

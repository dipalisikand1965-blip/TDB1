"""
Celebration Wall API Routes
Manage celebration photos displayed on the Celebrate page
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
import os

router = APIRouter(prefix="/api/celebration-wall", tags=["celebration-wall"])

# MongoDB connection
from motor.motor_asyncio import AsyncIOMotorClient
MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

def get_db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


# ═══════════════════════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════════════════════

class CelebrationPhoto(BaseModel):
    image_url: str = Field(..., description="URL of the celebration photo")
    pet_name: str = Field(..., description="Name of the pet in the photo")
    occasion: str = Field(default="Birthday", description="Type of celebration")
    caption: str = Field(default="", description="Caption for the photo")
    location: str = Field(default="", description="City/Location")
    likes: int = Field(default=0, description="Number of likes")
    is_featured: bool = Field(default=False, description="Show on celebration wall")
    display_order: int = Field(default=0, description="Order in the gallery")
    source: str = Field(default="shopify", description="Source: shopify, ugc, admin")

class CelebrationPhotoCreate(BaseModel):
    image_url: str
    pet_name: str
    occasion: str = "Birthday"
    caption: str = ""
    location: str = ""
    likes: int = 0
    is_featured: bool = True
    display_order: int = 0
    source: str = "admin"


class UGCPhotoCreate(BaseModel):
    """UGC upload from the wall's 'Share Your Story' 3-step modal."""
    image_url: str
    pet_name: str
    pet_id: Optional[str] = None
    caption: str
    celebration_type: str = "Birthday"
    city: Optional[str] = None
    mira_comment: Optional[str] = None
    source: str = "ugc"

class CelebrationPhotoUpdate(BaseModel):
    image_url: Optional[str] = None
    pet_name: Optional[str] = None
    occasion: Optional[str] = None
    caption: Optional[str] = None
    location: Optional[str] = None
    likes: Optional[int] = None
    is_featured: Optional[bool] = None
    display_order: Optional[int] = None


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/photos")
async def get_celebration_photos(
    featured_only: bool = True,
    limit: int = 20
):
    """Get celebration photos for the wall — uses aggregation to return proper id field."""
    db = get_db()
    
    query = {}
    if featured_only:
        query["is_featured"] = True
    
    # Use aggregation pipeline so $toString works (can't use aggregation operators in find() projection)
    pipeline = [
        {"$match": query},
        {"$sort": {"display_order": 1, "created_at": -1}},
        {"$limit": limit},
        {"$addFields": {"id": {"$toString": "$_id"}}},
        {"$project": {"_id": 0}}
    ]
    photos = await db.celebration_photos.aggregate(pipeline).to_list(limit)
    
    # If no photos in DB, return default TheDoggyBakery photos
    if not photos:
        photos = get_default_photos()
    
    return {"photos": photos, "total": len(photos)}


@router.post("/photos")
async def create_celebration_photo(photo: CelebrationPhotoCreate):
    """Add a new celebration photo (Admin)"""
    db = get_db()
    
    photo_dict = photo.dict()
    photo_dict["created_at"] = datetime.now(timezone.utc)
    photo_dict["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.celebration_photos.insert_one(photo_dict)
    
    return {
        "success": True,
        "message": "Photo added successfully",
        "id": str(result.inserted_id)
    }


@router.put("/photos/{photo_id}")
async def update_celebration_photo(photo_id: str, photo: CelebrationPhotoUpdate):
    """Update a celebration photo (Admin)"""
    db = get_db()
    
    update_data = {k: v for k, v in photo.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    result = await db.celebration_photos.update_one(
        {"_id": ObjectId(photo_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return {"success": True, "message": "Photo updated successfully"}


@router.delete("/photos/{photo_id}")
async def delete_celebration_photo(photo_id: str):
    """Delete a celebration photo (Admin)"""
    db = get_db()
    
    result = await db.celebration_photos.delete_one({"_id": ObjectId(photo_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    
    return {"success": True, "message": "Photo deleted successfully"}


@router.post("/photos/ugc")
async def create_ugc_photo(photo: UGCPhotoCreate):
    """
    UGC upload from the Celebration Wall 'Share Your Story' modal.
    Creates a pending-review photo with mira_comment pre-generated.
    """
    db = get_db()

    photo_dict = photo.dict()
    photo_dict["occasion"] = photo.celebration_type
    photo_dict["location"] = photo.city or ""
    photo_dict["likes"] = 0
    photo_dict["is_pending_review"] = True
    photo_dict["is_featured"] = False
    photo_dict["is_approved"] = False
    photo_dict["source"] = "ugc"
    photo_dict["created_at"] = datetime.now(timezone.utc)
    photo_dict["updated_at"] = datetime.now(timezone.utc)

    result = await db.celebration_photos.insert_one(photo_dict)
    photo_id = str(result.inserted_id)

    return {
        "success": True,
        "message": "Your story is on the wall ♥",
        "photo_id": photo_id,
        "status": "pending_review"
    }


@router.post("/photos/{photo_id}/like")
async def toggle_like(photo_id: str):
    """Toggle like on a photo. Returns updated like count."""
    db = get_db()

    try:
        # Try ObjectId lookup first (DB photos)
        from bson import ObjectId
        try:
            photo = await db.celebration_photos.find_one({"_id": ObjectId(photo_id)})
        except Exception:
            photo = await db.celebration_photos.find_one({"id": photo_id})

        if not photo:
            return {"success": True, "likes": 0}

        current_likes = photo.get("likes", 0)
        new_likes = current_likes + 1

        try:
            await db.celebration_photos.update_one(
                {"_id": ObjectId(photo_id)},
                {"$set": {"likes": new_likes, "updated_at": datetime.now(timezone.utc)}}
            )
        except Exception:
            pass
        return {"success": True, "likes": new_likes}
    except Exception:
        return {"success": True, "likes": 0}


# ── Admin moderation endpoints ────────────────────────────────────────────────

@router.get("/admin/pending")
async def get_pending_ugc():
    """List UGC photos pending review for moderation."""
    db = get_db()
    photos = await db.celebration_photos.find(
        {"is_pending_review": True, "source": "ugc"},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return {"photos": photos, "total": len(photos)}


@router.patch("/admin/photos/{photo_id}/approve")
async def approve_ugc_photo(photo_id: str):
    """Approve a UGC photo — makes it visible on the wall."""
    db = get_db()
    try:
        await db.celebration_photos.update_one(
            {"_id": ObjectId(photo_id)},
            {"$set": {"is_pending_review": False, "is_approved": True, "is_featured": True, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"success": True, "message": "Photo approved and visible on the wall."}
    except Exception:
        raise HTTPException(status_code=404, detail="Photo not found")


@router.patch("/admin/photos/{photo_id}/reject")
async def reject_ugc_photo(photo_id: str, reason: str = ""):
    """Reject a UGC photo."""
    db = get_db()
    try:
        await db.celebration_photos.update_one(
            {"_id": ObjectId(photo_id)},
            {"$set": {"is_pending_review": False, "is_approved": False, "rejected_reason": reason, "updated_at": datetime.now(timezone.utc)}}
        )
        return {"success": True, "message": "Photo rejected."}
    except Exception:
        raise HTTPException(status_code=404, detail="Photo not found")


@router.post("/seed-defaults")
async def seed_default_photos():
    """Seed the database with default TheDoggyBakery photos"""
    db = get_db()
    
    # Check if already seeded
    count = await db.celebration_photos.count_documents({})
    if count > 0:
        return {"success": False, "message": f"Already have {count} photos. Clear first to reseed."}
    
    default_photos = get_default_photos()
    
    for i, photo in enumerate(default_photos):
        photo["display_order"] = i
        photo["is_featured"] = True
        photo["source"] = "shopify"
        photo["created_at"] = datetime.now(timezone.utc)
        photo["updated_at"] = datetime.now(timezone.utc)
    
    await db.celebration_photos.insert_many(default_photos)
    
    return {"success": True, "message": f"Seeded {len(default_photos)} default photos"}


@router.post("/clear-all")
async def clear_all_photos():
    """Clear all celebration photos (Admin - use with caution)"""
    db = get_db()
    
    result = await db.celebration_photos.delete_many({})
    
    return {"success": True, "message": f"Deleted {result.deleted_count} photos"}


# ═══════════════════════════════════════════════════════════════════════════════
# DEFAULT PHOTOS - TheDoggyBakery Shopify Store
# ═══════════════════════════════════════════════════════════════════════════════

def get_default_photos():
    """Return default celebration photos from TheDoggyBakery (with stable IDs for like/lightbox)."""
    photos = [
        {
            "id": "default-1",
            "image_url": "https://thedoggybakery.com/cdn/shop/files/the_doggy_bakery_do_checkout_for_more_variety_in_cakes_and_treats_._Euro_love_it_._birthdayc.jpg?v=1759753685&width=800",
            "pet_name": "Euro", "occasion": "Birthday",
            "caption": "Euro loved his birthday cake! The best day ever 🎂",
            "likes": 234, "location": "Mumbai", "date": "2 days ago"
        },
        {
            "id": "default-2",
            "image_url": "https://thedoggybakery.com/cdn/shop/files/If_Love_had_a_profile_picture_you_re_looking_at_it_..Glad_you_enjoyed_your_birthday_Simba_.._dogfood_dogs_doggygoals_celebratingpets_cakesfordogs_doggydesserts_dogtreats_dogfoodie_pet.jpg?v=1759753273&width=800",
            "pet_name": "Simba", "occasion": "Birthday",
            "caption": "If love had a profile picture, you're looking at it 💕",
            "likes": 389, "location": "Bangalore", "date": "5 days ago"
        },
        {
            "id": "default-3",
            "image_url": "https://thedoggybakery.com/cdn/shop/files/zippy-april-4-1024x1024.png?v=1759752249&width=800",
            "pet_name": "Zippy", "occasion": "Birthday",
            "caption": "Birthday celebrations with the whole cake! 🎉",
            "likes": 312, "location": "Delhi", "date": "Last week"
        },
        {
            "id": "default-4",
            "image_url": "https://thedoggybakery.com/cdn/shop/files/BOBA_MILK_TEA_7_f31d3215-5971-4b5b-bf65-da4157fed6d9.jpg?v=1759752285&width=800",
            "pet_name": "Boba", "occasion": "First Birthday",
            "caption": "Our little one turns 1! Time flies so fast 🥺",
            "likes": 445, "location": "Pune", "date": "Last week"
        },
        {
            "id": "default-5",
            "image_url": "https://thedoggybakery.com/cdn/shop/files/438102159_450377974383140_7930303494133678708_n_78132051-77d9-455c-8a9c-3050abdeef81.jpg?v=1725448195&width=800",
            "pet_name": "Muffin", "occasion": "Birthday",
            "caption": "Best birthday party ever with all my friends! 💪",
            "likes": 892, "location": "Chennai", "date": "14 Mar"
        },
        {
            "id": "default-6",
            "image_url": "https://thedoggybakery.com/cdn/shop/files/Breed_Birthday_Cake_Hamper_Toy.png?v=1723637829&width=800",
            "pet_name": "Luna", "occasion": "Gotcha Day",
            "caption": "Celebrating 3 years since Luna joined our family!",
            "likes": 267, "location": "Hyderabad", "date": "7 Mar"
        },
        {
            "id": "default-7",
            "image_url": "https://thedoggybakery.com/cdn/shop/files/Breed_Cake_Party_Box.png?v=1723638074&width=800",
            "pet_name": "Rocky", "occasion": "Birthday",
            "caption": "The breed cake looked exactly like me! 🐕",
            "likes": 523, "location": "Gurgaon", "date": "28 Feb"
        },
        {
            "id": "default-8",
            "image_url": "https://thedoggybakery.com/cdn/shop/files/Untitled_design_16.png?v=1723638287&width=800",
            "pet_name": "Charlie", "occasion": "First Birthday",
            "caption": "The pawfect party box for Charlie's big day!",
            "likes": 678, "location": "Kolkata", "date": "21 Feb"
        }
    ]
    return photos

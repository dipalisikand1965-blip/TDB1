"""
Landing Page CMS Routes for The Doggy Company
Allows admin to manage hero images, bond gallery, and other landing page content
"""

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Create routers
landing_page_router = APIRouter(prefix="/api", tags=["Landing Page"])
landing_page_admin_router = APIRouter(prefix="/api/admin", tags=["Landing Page Admin"])

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


# ==================== PYDANTIC MODELS ====================

class HeroImage(BaseModel):
    id: Optional[str] = None
    image_url: str
    alt_text: str = "Beloved pet"
    order: int = 0
    is_active: bool = True


class BondGalleryImage(BaseModel):
    id: Optional[str] = None
    image_url: str
    caption: str = ""
    is_tall: bool = False
    is_wide: bool = False
    order: int = 0
    is_active: bool = True


class LandingPageConfig(BaseModel):
    hero_images: List[HeroImage] = []
    bond_gallery: List[BondGalleryImage] = []
    headline: str = "Every Pet Has a Soul"
    subheadline: str = "We don't just manage pet services. We nurture the soul of your companion."
    cta_text: str = "Discover Your Pet's Soul"


# ==================== DEFAULT CONTENT ====================

DEFAULT_HERO_IMAGES = [
    {
        "id": "hero-1",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/0iy6sezo_shutterstock_504980047%20%282%29.jpg",
        "alt_text": "Man cuddling with beagle",
        "order": 0,
        "is_active": True
    },
    {
        "id": "hero-2",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/phjxi6rd_dog-1194087_1920%20%281%29.jpg",
        "alt_text": "Black retriever with soulful eyes",
        "order": 1,
        "is_active": True
    },
    {
        "id": "hero-3",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/3cqhqxwf_shutterstock_171983261%20%281%29.jpg",
        "alt_text": "Man cuddling weimaraner",
        "order": 2,
        "is_active": True
    },
    {
        "id": "hero-4",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/jlabx5e0_dog-813103%20%281%29.jpg",
        "alt_text": "Artistic hound close-up",
        "order": 3,
        "is_active": True
    },
    {
        "id": "hero-5",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/n600xuze_shutterstock_134149577%20%281%29.jpg",
        "alt_text": "Golden puppy with purple bandana",
        "order": 4,
        "is_active": True
    }
]

DEFAULT_BOND_GALLERY = [
    {
        "id": "bond-1",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/0iy6sezo_shutterstock_504980047%20%282%29.jpg",
        "caption": "Unconditional love",
        "is_tall": False,
        "is_wide": False,
        "order": 0,
        "is_active": True
    },
    {
        "id": "bond-2",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/7oe8caws_shutterstock_1293337687%20%282%29.jpg",
        "caption": "Pure joy",
        "is_tall": False,
        "is_wide": False,
        "order": 1,
        "is_active": True
    },
    {
        "id": "bond-3",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/phjxi6rd_dog-1194087_1920%20%281%29.jpg",
        "caption": "Those soulful eyes",
        "is_tall": True,
        "is_wide": False,
        "order": 2,
        "is_active": True
    },
    {
        "id": "bond-4",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/mjwttjs6_shutterstock_297030209%20%281%29.jpg",
        "caption": "Adorable personality",
        "is_tall": False,
        "is_wide": False,
        "order": 3,
        "is_active": True
    },
    {
        "id": "bond-5",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/3cqhqxwf_shutterstock_171983261%20%281%29.jpg",
        "caption": "The bond we cherish",
        "is_tall": False,
        "is_wide": False,
        "order": 4,
        "is_active": True
    },
    {
        "id": "bond-6",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/n600xuze_shutterstock_134149577%20%281%29.jpg",
        "caption": "Puppy love",
        "is_tall": False,
        "is_wide": False,
        "order": 5,
        "is_active": True
    },
    {
        "id": "bond-7",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/dbyt7aqs_shutterstock_139089332%20%281%29.jpg",
        "caption": "Best friends",
        "is_tall": False,
        "is_wide": True,
        "order": 6,
        "is_active": True
    },
    {
        "id": "bond-8",
        "image_url": "https://customer-assets.emergentagent.com/job_pet-soul-platform/artifacts/jlabx5e0_dog-813103%20%281%29.jpg",
        "caption": "Every pet has a soul",
        "is_tall": False,
        "is_wide": False,
        "order": 7,
        "is_active": True
    }
]


# ==================== PUBLIC ROUTES ====================

@landing_page_router.get("/landing-page/content")
async def get_landing_page_content():
    """Get landing page content for public display"""
    config = await db.landing_page_config.find_one({"type": "main"}, {"_id": 0})
    
    if not config:
        # Return default content if none exists
        return {
            "hero_images": DEFAULT_HERO_IMAGES,
            "bond_gallery": DEFAULT_BOND_GALLERY,
            "headline": "Every Pet Has a Soul",
            "subheadline": "We don't just manage pet services. We nurture the soul of your companion.",
            "cta_text": "Discover Your Pet's Soul"
        }
    
    # Filter to only active images
    hero_images = [img for img in config.get("hero_images", []) if img.get("is_active", True)]
    bond_gallery = [img for img in config.get("bond_gallery", []) if img.get("is_active", True)]
    
    # Sort by order
    hero_images.sort(key=lambda x: x.get("order", 0))
    bond_gallery.sort(key=lambda x: x.get("order", 0))
    
    return {
        "hero_images": hero_images,
        "bond_gallery": bond_gallery,
        "headline": config.get("headline", "Every Pet Has a Soul"),
        "subheadline": config.get("subheadline", "We don't just manage pet services. We nurture the soul of your companion."),
        "cta_text": config.get("cta_text", "Discover Your Pet's Soul")
    }


# ==================== ADMIN ROUTES ====================

@landing_page_admin_router.get("/landing-page")
async def admin_get_landing_page(username: str = Depends(verify_admin)):
    """Get full landing page config for admin"""
    config = await db.landing_page_config.find_one({"type": "main"}, {"_id": 0})
    
    if not config:
        # Initialize with defaults
        config = {
            "type": "main",
            "hero_images": DEFAULT_HERO_IMAGES,
            "bond_gallery": DEFAULT_BOND_GALLERY,
            "headline": "Every Pet Has a Soul",
            "subheadline": "We don't just manage pet services. We nurture the soul of your companion.",
            "cta_text": "Discover Your Pet's Soul",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.landing_page_config.insert_one(config)
        config.pop("_id", None)
    
    return config


@landing_page_admin_router.put("/landing-page")
async def admin_update_landing_page(updates: dict, username: str = Depends(verify_admin)):
    """Update landing page config"""
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.landing_page_config.update_one(
        {"type": "main"},
        {"$set": updates},
        upsert=True
    )
    
    return {"message": "Landing page updated", "modified": result.modified_count}


# ==================== HERO IMAGES ADMIN ====================

@landing_page_admin_router.post("/landing-page/hero-images")
async def admin_add_hero_image(image: dict, username: str = Depends(verify_admin)):
    """Add a new hero image"""
    image_data = {
        "id": f"hero-{uuid.uuid4().hex[:8]}",
        "image_url": image.get("image_url", ""),
        "alt_text": image.get("alt_text", "Beloved pet"),
        "order": image.get("order", 99),
        "is_active": image.get("is_active", True)
    }
    
    await db.landing_page_config.update_one(
        {"type": "main"},
        {
            "$push": {"hero_images": image_data},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"message": "Hero image added", "image": image_data}


@landing_page_admin_router.put("/landing-page/hero-images/{image_id}")
async def admin_update_hero_image(image_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a hero image"""
    await db.landing_page_config.update_one(
        {"type": "main", "hero_images.id": image_id},
        {
            "$set": {
                "hero_images.$.image_url": updates.get("image_url"),
                "hero_images.$.alt_text": updates.get("alt_text"),
                "hero_images.$.order": updates.get("order"),
                "hero_images.$.is_active": updates.get("is_active"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Hero image updated"}


@landing_page_admin_router.delete("/landing-page/hero-images/{image_id}")
async def admin_delete_hero_image(image_id: str, username: str = Depends(verify_admin)):
    """Delete a hero image"""
    await db.landing_page_config.update_one(
        {"type": "main"},
        {
            "$pull": {"hero_images": {"id": image_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Hero image deleted"}


# ==================== BOND GALLERY ADMIN ====================

@landing_page_admin_router.post("/landing-page/bond-gallery")
async def admin_add_bond_image(image: dict, username: str = Depends(verify_admin)):
    """Add a new bond gallery image"""
    image_data = {
        "id": f"bond-{uuid.uuid4().hex[:8]}",
        "image_url": image.get("image_url", ""),
        "caption": image.get("caption", ""),
        "is_tall": image.get("is_tall", False),
        "is_wide": image.get("is_wide", False),
        "order": image.get("order", 99),
        "is_active": image.get("is_active", True)
    }
    
    await db.landing_page_config.update_one(
        {"type": "main"},
        {
            "$push": {"bond_gallery": image_data},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"message": "Bond gallery image added", "image": image_data}


@landing_page_admin_router.put("/landing-page/bond-gallery/{image_id}")
async def admin_update_bond_image(image_id: str, updates: dict, username: str = Depends(verify_admin)):
    """Update a bond gallery image"""
    await db.landing_page_config.update_one(
        {"type": "main", "bond_gallery.id": image_id},
        {
            "$set": {
                "bond_gallery.$.image_url": updates.get("image_url"),
                "bond_gallery.$.caption": updates.get("caption"),
                "bond_gallery.$.is_tall": updates.get("is_tall"),
                "bond_gallery.$.is_wide": updates.get("is_wide"),
                "bond_gallery.$.order": updates.get("order"),
                "bond_gallery.$.is_active": updates.get("is_active"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"message": "Bond gallery image updated"}


@landing_page_admin_router.delete("/landing-page/bond-gallery/{image_id}")
async def admin_delete_bond_image(image_id: str, username: str = Depends(verify_admin)):
    """Delete a bond gallery image"""
    await db.landing_page_config.update_one(
        {"type": "main"},
        {
            "$pull": {"bond_gallery": {"id": image_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Bond gallery image deleted"}

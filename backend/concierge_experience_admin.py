"""
Concierge Experience Management
Admin endpoints for managing Concierge® experiences across all pillars.
"""

import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid

logger = logging.getLogger(__name__)

# Router
experience_admin_router = APIRouter(prefix="/api/admin/concierge-experiences", tags=["Concierge Experiences Admin"])

# Database reference
db: AsyncIOMotorDatabase = None

def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== MODELS ====================

class ConciergeExperienceModel(BaseModel):
    """Model for a Concierge® Experience that appears on pillar pages."""
    id: Optional[str] = None
    
    # Basic Info
    pillar: str  # travel, stay, care, enjoy, learn, dine, celebrate, fit, etc.
    title: str  # e.g., "Luxe Air Concierge®"
    description: str  # Brief description
    icon: str  # Emoji icon (e.g., "✈️", "🏨")
    
    # Visual
    gradient: str = "from-violet-500 to-purple-600"  # Tailwind gradient
    image_url: Optional[str] = None  # Optional background/card image
    
    # Badge
    badge: Optional[str] = None  # e.g., "Signature", "Popular", "New"
    badge_color: str = "bg-amber-500"
    
    # Features/Highlights
    highlights: List[str] = []  # Bullet points
    
    # CTA
    cta_text: str = "Ask Concierge®"
    cta_url: Optional[str] = None  # Optional custom URL
    
    # Settings
    is_active: bool = True
    sort_order: int = 0
    
    # Metadata
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    created_by: Optional[str] = None


class ExperienceCreateUpdate(BaseModel):
    """Request model for creating/updating experiences."""
    pillar: str
    title: str
    description: str
    icon: str
    gradient: str = "from-violet-500 to-purple-600"
    image_url: Optional[str] = None
    badge: Optional[str] = None
    badge_color: str = "bg-amber-500"
    highlights: List[str] = []
    cta_text: str = "Ask Concierge®"
    cta_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


# ==================== SEED DATA ====================

DEFAULT_EXPERIENCES = [
    # TRAVEL
    {
        "pillar": "travel",
        "title": "Luxe Air Concierge®",
        "description": "End-to-end air travel coordination - from booking pet-friendly airlines to arranging in-cabin comfort.",
        "icon": "✈️",
        "gradient": "from-violet-500 to-purple-600",
        "badge": "Signature",
        "badge_color": "bg-violet-500",
        "highlights": [
            "Pet-friendly airline selection",
            "In-cabin arrangement assistance",
            "Travel documentation support",
            "Airport lounge recommendations"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 1
    },
    {
        "pillar": "travel",
        "title": "Road Trip Architect®",
        "description": "Custom road trip planning with pet-friendly stops, accommodations, and activities mapped out.",
        "icon": "🚗",
        "gradient": "from-teal-500 to-cyan-500",
        "highlights": [
            "Route optimization for pets",
            "Pet-friendly pit stops",
            "Accommodation booking",
            "Activity recommendations"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 2
    },
    # STAY
    {
        "pillar": "stay",
        "title": "Boutique Stay Curator®",
        "description": "Handpicked pet-friendly hotels and resorts with special amenities for your furry companion.",
        "icon": "🏨",
        "gradient": "from-amber-500 to-orange-500",
        "badge": "Popular",
        "badge_color": "bg-amber-500",
        "highlights": [
            "Verified pet-friendly properties",
            "In-room pet amenities",
            "Dog-walking services",
            "Pet spa arrangements"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 1
    },
    {
        "pillar": "stay",
        "title": "Home Away Finder®",
        "description": "Private villas and vacation rentals perfect for families with pets - fully vetted for safety.",
        "icon": "🏡",
        "gradient": "from-green-500 to-emerald-500",
        "highlights": [
            "Fenced yard verification",
            "Pet safety checks",
            "Local vet contacts",
            "Emergency support"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 2
    },
    # CARE
    {
        "pillar": "care",
        "title": "Wellness Navigator®",
        "description": "Personalized health & wellness plans developed with veterinary professionals for your pet.",
        "icon": "🩺",
        "gradient": "from-rose-500 to-pink-500",
        "badge": "Signature",
        "badge_color": "bg-rose-500",
        "highlights": [
            "Vet consultations arranged",
            "Preventive care scheduling",
            "Nutrition planning",
            "Health monitoring support"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 1
    },
    {
        "pillar": "care",
        "title": "Grooming Maestro®",
        "description": "Premium grooming experiences - from breed-specific styling to spa treatments.",
        "icon": "✨",
        "gradient": "from-purple-500 to-indigo-500",
        "highlights": [
            "Breed-specific grooming",
            "Spa treatments",
            "At-home services",
            "Premium products"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 2
    },
    # DINE
    {
        "pillar": "dine",
        "title": "Private Chef Experience®",
        "description": "A personal chef prepares a gourmet meal for you and your pet in your home or a private venue.",
        "icon": "👨‍🍳",
        "gradient": "from-orange-500 to-red-500",
        "badge": "Signature",
        "badge_color": "bg-orange-500",
        "highlights": [
            "Menu customized for pet dietary needs",
            "Human & pet courses paired together",
            "Available for celebrations & events",
            "Hypoallergenic options available"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 1
    },
    {
        "pillar": "dine",
        "title": "Restaurant VIP Access®",
        "description": "Get priority reservations and special pet-friendly arrangements at exclusive restaurants.",
        "icon": "🍽️",
        "gradient": "from-amber-500 to-orange-500",
        "highlights": [
            "Reserved pet-friendly tables",
            "Custom pet menu arrangements",
            "Celebration setups available",
            "Multi-city restaurant network"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 2
    },
    {
        "pillar": "dine",
        "title": "Birthday Dining Package®",
        "description": "Complete birthday celebration with cake, decorations, and pet-friendly venue coordination.",
        "icon": "🎂",
        "gradient": "from-pink-500 to-rose-500",
        "badge": "Popular",
        "badge_color": "bg-pink-500",
        "highlights": [
            "Custom cake from our bakery",
            "Pet-safe decorations",
            "Photographer arrangement",
            "Guest coordination"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 3
    },
    # CELEBRATE
    {
        "pillar": "celebrate",
        "title": "Ultimate Birthday Bash®",
        "description": "A complete birthday celebration package with custom cake, decorations, venue, photography & entertainment.",
        "icon": "🎉",
        "gradient": "from-pink-500 to-rose-500",
        "badge": "Signature",
        "badge_color": "bg-pink-500",
        "highlights": [
            "Custom themed decorations",
            "Professional pet photography",
            "Gourmet cake & treats for all guests",
            "Activity planning & coordination"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 1
    },
    {
        "pillar": "celebrate",
        "title": "Gotcha Day Special®",
        "description": "Celebrate the anniversary of when your furry friend joined your family with a meaningful experience.",
        "icon": "💜",
        "gradient": "from-purple-500 to-violet-500",
        "highlights": [
            "Memory book creation",
            "Professional photoshoot",
            "Custom celebration cake",
            "Special treats package"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 2
    },
    {
        "pillar": "celebrate",
        "title": "Pawty Planning Pro®",
        "description": "Full-service party planning for pet birthdays, adoption anniversaries, or any celebration.",
        "icon": "🎈",
        "gradient": "from-amber-500 to-orange-500",
        "badge": "Popular",
        "badge_color": "bg-amber-500",
        "highlights": [
            "Guest list management",
            "Venue sourcing & booking",
            "Catering for pets & humans",
            "Entertainment coordination"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 3
    },
    # ENJOY
    {
        "pillar": "enjoy",
        "title": "Adventure Curator®",
        "description": "Unique outdoor experiences - from hiking trails to beach days - all vetted for pet safety.",
        "icon": "🏞️",
        "gradient": "from-green-500 to-teal-500",
        "badge": "Popular",
        "badge_color": "bg-green-500",
        "highlights": [
            "Trail difficulty assessment",
            "Safety gear recommendations",
            "Emergency vet contacts",
            "Weather monitoring"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 1
    },
    {
        "pillar": "enjoy",
        "title": "Playdate Matchmaker®",
        "description": "Find the perfect playmates for your pet - temperament-matched and vet-verified.",
        "icon": "🐕",
        "gradient": "from-blue-500 to-indigo-500",
        "highlights": [
            "Temperament matching",
            "Supervised introductions",
            "Safe play spaces",
            "Regular playgroup options"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 2
    },
    # LEARN
    {
        "pillar": "learn",
        "title": "Training Maestro®",
        "description": "Connect with certified trainers for personalized training programs tailored to your pet.",
        "icon": "🎓",
        "gradient": "from-indigo-500 to-purple-500",
        "badge": "Signature",
        "badge_color": "bg-indigo-500",
        "highlights": [
            "Certified trainer matching",
            "Customized training plans",
            "Progress tracking",
            "Behavioral consultations"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 1
    },
    {
        "pillar": "learn",
        "title": "Puppy School Advisor®",
        "description": "Find the best puppy classes and socialization programs in your area.",
        "icon": "🐾",
        "gradient": "from-cyan-500 to-blue-500",
        "highlights": [
            "School vetting & reviews",
            "Curriculum assessment",
            "Class scheduling",
            "Progress reports"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 2
    },
    # FIT
    {
        "pillar": "fit",
        "title": "Fitness Coach®",
        "description": "Personalized fitness programs for your pet - from weight management to agility training.",
        "icon": "💪",
        "gradient": "from-orange-500 to-red-500",
        "badge": "Popular",
        "badge_color": "bg-orange-500",
        "highlights": [
            "Custom exercise plans",
            "Progress monitoring",
            "Diet coordination",
            "Equipment recommendations"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 1
    },
    {
        "pillar": "fit",
        "title": "Swim & Hydro Therapy®",
        "description": "Aquatic fitness and rehabilitation services for pets of all ages and abilities.",
        "icon": "🏊",
        "gradient": "from-cyan-500 to-blue-500",
        "highlights": [
            "Pool session booking",
            "Hydrotherapy for seniors",
            "Post-surgery rehab",
            "Fun swim sessions"
        ],
        "cta_text": "Ask Concierge®",
        "sort_order": 2
    }
]


# ==================== ENDPOINTS ====================

@experience_admin_router.get("/")
async def list_experiences(pillar: Optional[str] = None, active_only: bool = False):
    """List all Concierge® experiences, optionally filtered by pillar."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    query = {}
    if pillar:
        query["pillar"] = pillar
    if active_only:
        query["is_active"] = True
    
    experiences = await db.concierge_experiences.find(query, {"_id": 0}).sort("sort_order", 1).to_list(100)
    
    # Group by pillar
    by_pillar = {}
    for exp in experiences:
        p = exp.get("pillar", "other")
        if p not in by_pillar:
            by_pillar[p] = []
        by_pillar[p].append(exp)
    
    return {
        "experiences": experiences,
        "by_pillar": by_pillar,
        "total": len(experiences)
    }


@experience_admin_router.get("/pillars")
async def get_pillar_list():
    """Get list of all pillars with experience counts."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    
    result = await db.concierge_experiences.aggregate(pipeline).to_list(100)
    
    pillars = [
        {"id": "travel", "name": "Travel", "icon": "✈️"},
        {"id": "stay", "name": "Stay", "icon": "🏨"},
        {"id": "care", "name": "Care", "icon": "🩺"},
        {"id": "dine", "name": "Dine", "icon": "🍽️"},
        {"id": "celebrate", "name": "Celebrate", "icon": "🎉"},
        {"id": "enjoy", "name": "Enjoy", "icon": "🎯"},
        {"id": "learn", "name": "Learn", "icon": "🎓"},
        {"id": "fit", "name": "Fit", "icon": "💪"},
        {"id": "paperwork", "name": "Paperwork", "icon": "📋"},
        {"id": "advisory", "name": "Advisory", "icon": "💡"},
        {"id": "emergency", "name": "Emergency", "icon": "🚨"},
        {"id": "farewell", "name": "Farewell", "icon": "🌈"},
        {"id": "adopt", "name": "Adopt", "icon": "🏠"},
        {"id": "shop", "name": "Shop", "icon": "🛒"},
    ]
    
    # Add counts
    counts = {r["_id"]: r["count"] for r in result}
    for p in pillars:
        p["experience_count"] = counts.get(p["id"], 0)
    
    return {"pillars": pillars}


@experience_admin_router.get("/{experience_id}")
async def get_experience(experience_id: str):
    """Get a single experience by ID."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    exp = await db.concierge_experiences.find_one({"id": experience_id}, {"_id": 0})
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    return exp


@experience_admin_router.post("/")
async def create_experience(experience: ExperienceCreateUpdate):
    """Create a new Concierge® experience."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    now = datetime.now(timezone.utc).isoformat()
    exp_id = f"exp-{uuid.uuid4().hex[:8]}"
    
    exp_doc = {
        "id": exp_id,
        **experience.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    await db.concierge_experiences.insert_one(exp_doc)
    
    return {"success": True, "id": exp_id, "experience": {k: v for k, v in exp_doc.items() if k != "_id"}}


@experience_admin_router.put("/{experience_id}")
async def update_experience(experience_id: str, experience: ExperienceCreateUpdate):
    """Update an existing Concierge® experience."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    now = datetime.now(timezone.utc).isoformat()
    
    result = await db.concierge_experiences.update_one(
        {"id": experience_id},
        {"$set": {**experience.dict(), "updated_at": now}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    return {"success": True, "id": experience_id, "updated": True}


@experience_admin_router.delete("/{experience_id}")
async def delete_experience(experience_id: str):
    """Delete a Concierge® experience."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = await db.concierge_experiences.delete_one({"id": experience_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    return {"success": True, "deleted": True}


@experience_admin_router.post("/seed")
async def seed_default_experiences():
    """Seed the database with default Concierge® experiences."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    now = datetime.now(timezone.utc).isoformat()
    seeded = 0
    updated = 0
    
    for exp_data in DEFAULT_EXPERIENCES:
        exp_id = f"exp-{exp_data['pillar']}-{exp_data['title'].lower().replace(' ', '-').replace('®', '').replace('&', 'and')[:20]}"
        
        existing = await db.concierge_experiences.find_one({"id": exp_id})
        
        if existing:
            # Update existing
            await db.concierge_experiences.update_one(
                {"id": exp_id},
                {"$set": {**exp_data, "updated_at": now}}
            )
            updated += 1
        else:
            # Create new
            exp_doc = {
                "id": exp_id,
                **exp_data,
                "is_active": True,
                "created_at": now,
                "updated_at": now
            }
            await db.concierge_experiences.insert_one(exp_doc)
            seeded += 1
    
    return {
        "success": True,
        "seeded": seeded,
        "updated": updated,
        "total_default": len(DEFAULT_EXPERIENCES)
    }


@experience_admin_router.post("/{experience_id}/toggle")
async def toggle_experience(experience_id: str):
    """Toggle an experience's active status."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    exp = await db.concierge_experiences.find_one({"id": experience_id})
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    new_status = not exp.get("is_active", True)
    
    await db.concierge_experiences.update_one(
        {"id": experience_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"success": True, "is_active": new_status}


@experience_admin_router.post("/{experience_id}/duplicate")
async def duplicate_experience(experience_id: str, target_pillar: Optional[str] = None):
    """Duplicate an experience, optionally to a different pillar."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    exp = await db.concierge_experiences.find_one({"id": experience_id}, {"_id": 0})
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    
    now = datetime.now(timezone.utc).isoformat()
    new_id = f"exp-{uuid.uuid4().hex[:8]}"
    
    new_exp = {
        **exp,
        "id": new_id,
        "title": f"{exp['title']} (Copy)",
        "pillar": target_pillar or exp["pillar"],
        "created_at": now,
        "updated_at": now
    }
    
    await db.concierge_experiences.insert_one(new_exp)
    
    return {"success": True, "new_id": new_id, "experience": {k: v for k, v in new_exp.items() if k != "_id"}}


# ==================== PUBLIC ENDPOINT ====================

@experience_admin_router.get("/public/{pillar}")
async def get_public_experiences(pillar: str):
    """Get active experiences for a pillar (public endpoint for frontend)."""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    experiences = await db.concierge_experiences.find(
        {"pillar": pillar, "is_active": True},
        {"_id": 0}
    ).sort("sort_order", 1).to_list(20)
    
    return {"pillar": pillar, "experiences": experiences}

"""
Guided Paths API - Manage pillar-specific journey guides
Supports: Emergency Guides, Advisory Paths, Farewell Journeys, Adoption Journeys
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/guided-paths", tags=["guided-paths"])

# Module-level database reference
db = None

def set_guided_paths_db(database):
    """Set the database reference for guided paths routes."""
    global db
    db = database
    logger.info("Guided Paths routes initialized with database")

def get_db():
    """Get database reference."""
    global db
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db


# ═══════════════════════════════════════════════════════════════════════════════
# GET PATHS BY PILLAR
# ═══════════════════════════════════════════════════════════════════════════════
@router.get("/{pillar}")
async def get_guided_paths(pillar: str, active_only: bool = True):
    """Get all guided paths for a specific pillar"""
    db = get_db()
    
    query = {"pillar": pillar}
    if active_only:
        query["is_active"] = True
    
    paths = await db.guided_paths.find(query, {"_id": 0}).sort("order", 1).to_list(100)
    
    return {
        "pillar": pillar,
        "paths": paths,
        "total": len(paths)
    }


# ═══════════════════════════════════════════════════════════════════════════════
# ADMIN CRUD OPERATIONS
# ═══════════════════════════════════════════════════════════════════════════════
@router.get("/admin/all")
async def get_all_paths():
    """Get all guided paths (admin view)"""
    db = get_db()
    
    paths = await db.guided_paths.find({}, {"_id": 0}).sort([("pillar", 1), ("order", 1)]).to_list(500)
    
    # Group by pillar
    by_pillar = {}
    for path in paths:
        pillar = path.get("pillar", "other")
        if pillar not in by_pillar:
            by_pillar[pillar] = []
        by_pillar[pillar].append(path)
    
    return {
        "paths": paths,
        "by_pillar": by_pillar,
        "total": len(paths)
    }


@router.post("/admin/create")
async def create_guided_path(path_data: dict):
    """Create a new guided path"""
    db = get_db()
    
    path = {
        "id": f"path-{uuid.uuid4().hex[:8]}",
        "pillar": path_data.get("pillar", "advisory"),
        "title": path_data.get("title"),
        "description": path_data.get("description"),
        "icon": path_data.get("icon", "Heart"),
        "color": path_data.get("color", "from-purple-500 to-pink-600"),
        "steps": path_data.get("steps", []),
        "order": path_data.get("order", 0),
        "is_active": path_data.get("is_active", True),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.guided_paths.insert_one(path)
    
    return {"success": True, "path_id": path["id"], "path": {k: v for k, v in path.items() if k != "_id"}}


@router.put("/admin/{path_id}")
async def update_guided_path(path_id: str, path_data: dict):
    """Update a guided path"""
    db = get_db()
    
    path_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Remove id if present (shouldn't be updated)
    path_data.pop("id", None)
    path_data.pop("_id", None)
    
    result = await db.guided_paths.update_one(
        {"id": path_id},
        {"$set": path_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Path not found")
    
    return {"success": True, "path_id": path_id}


@router.delete("/admin/{path_id}")
async def delete_guided_path(path_id: str):
    """Delete a guided path"""
    db = get_db()
    
    result = await db.guided_paths.delete_one({"id": path_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Path not found")
    
    return {"success": True, "path_id": path_id}


# ═══════════════════════════════════════════════════════════════════════════════
# SEED DATA - Initial guided paths for all pillars
# ═══════════════════════════════════════════════════════════════════════════════
SEED_GUIDED_PATHS = [
    # ============ FAREWELL JOURNEYS ============
    {
        "id": "farewell-preparing",
        "pillar": "farewell",
        "title": "Preparing to Say Goodbye",
        "description": "When you know the time is coming",
        "icon": "Heart",
        "color": "from-rose-500 to-pink-600",
        "order": 1,
        "steps": [
            {"title": "Quality time together", "items": ["Favorite activities", "Extra cuddles", "Special treats", "Photo memories"]},
            {"title": "Comfort measures", "items": ["Pain management", "Soft bedding", "Peaceful space", "Familiar scents"]},
            {"title": "Practical planning", "items": ["Vet consultation", "Home euthanasia option", "Memorial choices", "Family involvement"]}
        ],
        "is_active": True
    },
    {
        "id": "farewell-day-of",
        "pillar": "farewell",
        "title": "The Day Of",
        "description": "Being present in the moment",
        "icon": "Star",
        "color": "from-purple-500 to-indigo-600",
        "order": 2,
        "steps": [
            {"title": "Create peace", "items": ["Quiet environment", "Loved ones present", "Soft music", "Comfort items"]},
            {"title": "Say goodbye", "items": ["Words of love", "Gentle touch", "No rush", "Honor the moment"]},
            {"title": "After care", "items": ["Take your time", "Memorial keepsakes", "Transportation arranged", "Self-compassion"]}
        ],
        "is_active": True
    },
    {
        "id": "farewell-grief",
        "pillar": "farewell",
        "title": "The Grief Journey",
        "description": "Navigating life after loss",
        "icon": "Rainbow",
        "color": "from-blue-500 to-cyan-600",
        "order": 3,
        "steps": [
            {"title": "First days", "items": ["Allow all feelings", "Rest when needed", "Reach out for support", "No pressure"]},
            {"title": "Honoring memory", "items": ["Create memorial", "Share stories", "Plant something", "Donate in their name"]},
            {"title": "Finding peace", "items": ["Grief counseling", "Support groups", "When ready, open heart again"]}
        ],
        "is_active": True
    },
    {
        "id": "farewell-memorial",
        "pillar": "farewell",
        "title": "Creating a Memorial",
        "description": "Celebrating their life",
        "icon": "Flower2",
        "color": "from-amber-500 to-orange-600",
        "order": 4,
        "steps": [
            {"title": "Physical memorials", "items": ["Paw print casting", "Photo display", "Garden stone", "Jewelry"]},
            {"title": "Digital memories", "items": ["Photo album", "Video montage", "Social tribute", "Rainbow Bridge wall"]},
            {"title": "Living tributes", "items": ["Charity donation", "Volunteer work", "Sponsor a rescue", "Memorial tree"]}
        ],
        "is_active": True
    },
    
    # ============ ADOPTION JOURNEYS ============
    {
        "id": "adopt-before",
        "pillar": "adopt",
        "title": "Before You Adopt",
        "description": "Is adoption right for you?",
        "icon": "Heart",
        "color": "from-green-500 to-emerald-600",
        "order": 1,
        "steps": [
            {"title": "Self-assessment", "items": ["Time commitment", "Financial readiness", "Living situation", "Family agreement"]},
            {"title": "Research", "items": ["Breed characteristics", "Energy levels", "Space needs", "Special needs dogs"]},
            {"title": "Home preparation", "items": ["Safe spaces", "Pet-proofing", "Supplies ready", "Vet identified"]}
        ],
        "is_active": True
    },
    {
        "id": "adopt-first-7-days",
        "pillar": "adopt",
        "title": "First 7 Days",
        "description": "The 3-3-3 rule begins",
        "icon": "Home",
        "color": "from-blue-500 to-cyan-600",
        "order": 2,
        "steps": [
            {"title": "Day 1-3: Decompression", "items": ["Quiet environment", "Limited interaction", "Safe space", "Routine starts"]},
            {"title": "Day 3-5: Building trust", "items": ["Gentle introductions", "Short walks", "Consistent feeding", "Patience"]},
            {"title": "Day 5-7: Settling in", "items": ["House rules intro", "Family bonding", "Vet visit", "Training begins"]}
        ],
        "is_active": True
    },
    {
        "id": "adopt-first-3-weeks",
        "pillar": "adopt",
        "title": "First 3 Weeks",
        "description": "True personality emerges",
        "icon": "Users",
        "color": "from-purple-500 to-violet-600",
        "order": 3,
        "steps": [
            {"title": "Behavior observation", "items": ["Real personality shows", "Triggers identified", "Comfort zones", "Social preferences"]},
            {"title": "Training foundation", "items": ["Basic commands", "House training", "Leash manners", "Name recognition"]},
            {"title": "Socialization", "items": ["Controlled introductions", "New environments", "Car rides", "Vet comfort"]}
        ],
        "is_active": True
    },
    {
        "id": "adopt-first-3-months",
        "pillar": "adopt",
        "title": "First 3 Months",
        "description": "Feeling at home",
        "icon": "Heart",
        "color": "from-rose-500 to-pink-600",
        "order": 4,
        "steps": [
            {"title": "Full bonding", "items": ["Trust established", "Routine solid", "Behavioral baseline", "Family integration"]},
            {"title": "Address challenges", "items": ["Separation anxiety", "Resource guarding", "Fear responses", "Professional help"]},
            {"title": "Long-term success", "items": ["Ongoing training", "Health maintenance", "Exercise routine", "Forever family"]}
        ],
        "is_active": True
    },
    
    # ============ ADVISORY PATHS ============
    {
        "id": "advisory-first-time-owner",
        "pillar": "advisory",
        "title": "First-time Owner Path",
        "description": "Everything new dog parents need",
        "icon": "Heart",
        "color": "from-blue-500 to-cyan-600",
        "order": 1,
        "steps": [
            {"title": "Getting started", "items": ["Essential supplies", "Vet registration", "Basic training", "Feeding schedule"]},
            {"title": "Building routine", "items": ["Exercise needs", "Grooming basics", "Socialization", "House rules"]},
            {"title": "Growing together", "items": ["Health checkups", "Advanced training", "Diet optimization", "Bonding activities"]}
        ],
        "is_active": True
    },
    {
        "id": "advisory-multi-dog",
        "pillar": "advisory",
        "title": "Multi-dog Household",
        "description": "Managing multiple dogs",
        "icon": "Users",
        "color": "from-purple-500 to-violet-600",
        "order": 2,
        "steps": [
            {"title": "Introduction protocol", "items": ["Neutral territory meet", "Supervised interactions", "Separate feeding", "Individual attention"]},
            {"title": "Harmony at home", "items": ["Resource management", "Pack dynamics", "Conflict prevention", "Equal love"]},
            {"title": "Group activities", "items": ["Pack walks", "Play sessions", "Training together", "Shared adventures"]}
        ],
        "is_active": True
    },
    {
        "id": "advisory-flat-faced",
        "pillar": "advisory",
        "title": "Flat-faced Dog Care",
        "description": "Special care for Pugs, Bulldogs, etc.",
        "icon": "Heart",
        "color": "from-amber-500 to-orange-600",
        "order": 3,
        "steps": [
            {"title": "Breathing care", "items": ["Temperature monitoring", "Exercise limits", "Air quality", "Weight management"]},
            {"title": "Skin & wrinkle care", "items": ["Daily cleaning", "Moisture control", "Yeast prevention", "Gentle products"]},
            {"title": "Health monitoring", "items": ["Regular vet visits", "BOAS awareness", "Eye care", "Dental health"]}
        ],
        "is_active": True
    },
    {
        "id": "advisory-allergy",
        "pillar": "advisory",
        "title": "Allergy Management Path",
        "description": "Control and manage pet allergies",
        "icon": "Shield",
        "color": "from-green-500 to-emerald-600",
        "order": 4,
        "steps": [
            {"title": "Identification", "items": ["Allergy testing", "Elimination diet", "Environmental triggers", "Symptom tracking"]},
            {"title": "Management", "items": ["Hypoallergenic food", "Air purifiers", "Frequent bathing", "Medication if needed"]},
            {"title": "Prevention", "items": ["Regular cleaning", "Flea control", "Seasonal adjustments", "Immune support"]}
        ],
        "is_active": True
    },
    
    # ============ EMERGENCY GUIDES ============
    {
        "id": "emergency-poisoning",
        "pillar": "emergency",
        "title": "Suspected Poisoning",
        "description": "What to do if your pet ingested something toxic",
        "icon": "AlertTriangle",
        "color": "from-red-500 to-rose-600",
        "order": 1,
        "severity": "critical",
        "steps": [
            {"title": "Immediate actions", "items": ["Remove from source", "Note what was eaten", "Check breathing", "Call vet immediately"]},
            {"title": "Do NOT", "items": ["Induce vomiting unless told", "Give milk or water", "Wait to see symptoms", "Panic"]},
            {"title": "Information to have ready", "items": ["Substance name", "Amount consumed", "Time of ingestion", "Pet's weight"]}
        ],
        "is_active": True
    },
    {
        "id": "emergency-bleeding",
        "pillar": "emergency",
        "title": "Severe Bleeding",
        "description": "How to control bleeding and get help",
        "icon": "Droplet",
        "color": "from-red-600 to-red-800",
        "order": 2,
        "severity": "critical",
        "steps": [
            {"title": "Stop the bleeding", "items": ["Apply firm pressure", "Use clean cloth", "Elevate if possible", "Don't remove soaked cloth"]},
            {"title": "Get help", "items": ["Call emergency vet", "Keep pet warm", "Keep calm", "Transport safely"]},
            {"title": "Signs of shock", "items": ["Pale gums", "Rapid breathing", "Weak pulse", "Cool extremities"]}
        ],
        "is_active": True
    },
    {
        "id": "emergency-breathing",
        "pillar": "emergency",
        "title": "Breathing Difficulties",
        "description": "Signs of respiratory distress and what to do",
        "icon": "Wind",
        "color": "from-blue-600 to-indigo-700",
        "order": 3,
        "severity": "critical",
        "steps": [
            {"title": "Warning signs", "items": ["Labored breathing", "Blue gums/tongue", "Extended neck", "Noisy breathing"]},
            {"title": "Immediate care", "items": ["Keep pet calm", "Cool environment", "Clear airway if safe", "Rush to vet"]},
            {"title": "Causes", "items": ["Allergic reaction", "Heart disease", "Choking", "Heat stroke"]}
        ],
        "is_active": True
    },
    {
        "id": "emergency-heatstroke",
        "pillar": "emergency",
        "title": "Heat Stroke",
        "description": "Recognize and respond to overheating",
        "icon": "Sun",
        "color": "from-orange-500 to-red-600",
        "order": 4,
        "severity": "urgent",
        "steps": [
            {"title": "Signs", "items": ["Heavy panting", "Drooling", "Red gums", "Vomiting", "Collapse"]},
            {"title": "Cool down", "items": ["Move to shade", "Cool (not cold) water", "Wet towels on neck/groin", "Fan air"]},
            {"title": "Get to vet", "items": ["Even if recovering", "Internal damage possible", "Monitor temperature", "Prevent re-heating"]}
        ],
        "is_active": True
    },
    {
        "id": "emergency-seizure",
        "pillar": "emergency",
        "title": "Seizures",
        "description": "What to do during and after a seizure",
        "icon": "Zap",
        "color": "from-purple-600 to-indigo-700",
        "order": 5,
        "severity": "urgent",
        "steps": [
            {"title": "During seizure", "items": ["Don't restrain", "Clear area of objects", "Time the seizure", "Stay calm"]},
            {"title": "After seizure", "items": ["Keep quiet and dim", "Comfort gently", "Note behavior", "Call vet"]},
            {"title": "Emergency if", "items": ["Lasts >5 minutes", "Multiple seizures", "First-time seizure", "Doesn't recover"]}
        ],
        "is_active": True
    },
    {
        "id": "emergency-choking",
        "pillar": "emergency",
        "title": "Choking",
        "description": "Clear airway obstruction safely",
        "icon": "AlertCircle",
        "color": "from-red-500 to-pink-600",
        "order": 6,
        "severity": "critical",
        "steps": [
            {"title": "Signs", "items": ["Pawing at mouth", "Gagging", "Blue gums", "Panic"]},
            {"title": "Try first", "items": ["Look in mouth", "Sweep with finger if visible", "Don't push deeper", "Be careful of bites"]},
            {"title": "Heimlich for dogs", "items": ["Small dog: Hold upside down", "Large dog: Behind ribs thrust", "Rush to vet if unsuccessful"]}
        ],
        "is_active": True
    },
    {
        "id": "emergency-eye-injury",
        "pillar": "emergency",
        "title": "Eye Injury or Irritation",
        "description": "Protect vision and reduce pain",
        "icon": "Eye",
        "color": "from-cyan-500 to-blue-600",
        "order": 7,
        "severity": "urgent",
        "steps": [
            {"title": "Signs", "items": ["Squinting", "Redness", "Discharge", "Pawing at eye"]},
            {"title": "First aid", "items": ["Prevent rubbing", "E-collar if available", "Flush with saline", "Don't remove objects"]},
            {"title": "See vet", "items": ["Same day appointment", "Note what happened", "Keep eye moist", "Don't apply pressure"]}
        ],
        "is_active": True
    },
    {
        "id": "emergency-bloat",
        "pillar": "emergency",
        "title": "Bloat / Twisted Stomach (GDV)",
        "description": "Life-threatening emergency in dogs",
        "icon": "AlertTriangle",
        "color": "from-red-700 to-red-900",
        "order": 8,
        "severity": "critical",
        "steps": [
            {"title": "Warning signs", "items": ["Swollen belly", "Retching without vomit", "Restlessness", "Rapid breathing"]},
            {"title": "EMERGENCY", "items": ["Call vet NOW", "This is fatal without surgery", "Time is critical", "Don't wait to see if it improves"]},
            {"title": "High risk breeds", "items": ["Great Danes", "German Shepherds", "Standard Poodles", "Deep-chested dogs"]}
        ],
        "is_active": True
    }
]


@router.post("/admin/seed")
async def seed_guided_paths():
    """Seed all guided paths to database"""
    db = get_db()
    
    inserted = 0
    updated = 0
    
    for path in SEED_GUIDED_PATHS:
        path_copy = {**path}
        path_copy["created_at"] = datetime.now(timezone.utc).isoformat()
        path_copy["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        # Upsert - update if exists, insert if not
        result = await db.guided_paths.update_one(
            {"id": path["id"]},
            {"$set": path_copy},
            upsert=True
        )
        
        if result.upserted_id:
            inserted += 1
        elif result.modified_count > 0:
            updated += 1
    
    total = await db.guided_paths.count_documents({})
    
    return {
        "success": True,
        "inserted": inserted,
        "updated": updated,
        "total_paths": total,
        "by_pillar": {
            "farewell": await db.guided_paths.count_documents({"pillar": "farewell"}),
            "adopt": await db.guided_paths.count_documents({"pillar": "adopt"}),
            "advisory": await db.guided_paths.count_documents({"pillar": "advisory"}),
            "emergency": await db.guided_paths.count_documents({"pillar": "emergency"})
        }
    }


@router.get("/admin/stats")
async def get_guided_paths_stats():
    """Get statistics about guided paths"""
    db = get_db()
    
    total = await db.guided_paths.count_documents({})
    active = await db.guided_paths.count_documents({"is_active": True})
    
    by_pillar = {}
    for pillar in ["farewell", "adopt", "advisory", "emergency"]:
        by_pillar[pillar] = await db.guided_paths.count_documents({"pillar": pillar})
    
    return {
        "total": total,
        "active": active,
        "by_pillar": by_pillar
    }

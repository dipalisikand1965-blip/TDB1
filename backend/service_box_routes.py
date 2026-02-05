"""
Service Box Admin Routes
Full CRUD for services with filtering, stats, and bulk operations
"""

from fastapi import APIRouter, HTTPException, Query, Header
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/service-box", tags=["service-box"])

# Database reference
_db = None

def set_service_box_db(db):
    global _db
    _db = db

def get_db():
    if _db is None:
        from server import db
        return db
    return _db


# All 14 pillars
ALL_PILLARS = [
    {"id": "celebrate", "name": "Celebrate", "icon": "🎂"},
    {"id": "dine", "name": "Dine", "icon": "🍽️"},
    {"id": "stay", "name": "Stay", "icon": "🏨"},
    {"id": "travel", "name": "Travel", "icon": "✈️"},
    {"id": "care", "name": "Care", "icon": "💊"},
    {"id": "enjoy", "name": "Enjoy", "icon": "🎾"},
    {"id": "fit", "name": "Fit", "icon": "🏃"},
    {"id": "learn", "name": "Learn", "icon": "🎓"},
    {"id": "paperwork", "name": "Paperwork", "icon": "📄"},
    {"id": "advisory", "name": "Advisory", "icon": "📋"},
    {"id": "emergency", "name": "Emergency", "icon": "🚨"},
    {"id": "farewell", "name": "Farewell", "icon": "🌈"},
    {"id": "adopt", "name": "Adopt", "icon": "🐾"},
    {"id": "shop", "name": "Shop", "icon": "🛒"},
]


# ==================== MODELS ====================

class ServiceCreate(BaseModel):
    """Create/Update service"""
    id: Optional[str] = None
    name: str
    pillar: str
    description: str = ""
    
    # Booking config
    is_bookable: bool = True
    requires_consultation: bool = False
    is_free: bool = False
    is_24x7: bool = False
    
    # Pricing
    base_price: Optional[float] = 0
    duration_minutes: Optional[int] = None
    city_pricing: Dict[str, float] = {}
    pet_size_pricing: Dict[str, float] = {}
    pet_count_pricing: Dict[str, float] = {}
    deposit_percentage: float = 20
    payment_timing: str = "configurable"
    
    # Availability
    available_cities: List[str] = []
    available_days: List[str] = []
    available_time_slots: List[str] = []
    
    # Content
    includes: List[str] = []
    add_ons: List[Dict[str, Any]] = []
    image_url: Optional[str] = None
    
    # Rewards
    paw_points_eligible: bool = False
    paw_points_value: int = 0
    
    # Status
    is_active: bool = True


# ==================== STATS ====================

@router.get("/stats")
async def get_service_stats():
    """Get service statistics"""
    db = get_db()
    
    total = await db.services_master.count_documents({})
    active = await db.services_master.count_documents({"is_active": {"$ne": False}})
    bookable = await db.services_master.count_documents({"is_bookable": True})
    free_services = await db.services_master.count_documents({"is_free": True})
    consultation_required = await db.services_master.count_documents({"requires_consultation": True})
    emergency_24x7 = await db.services_master.count_documents({"is_24x7": True})
    
    # Count by pillar
    pillar_counts = {}
    pipeline = [
        {"$group": {"_id": "$pillar", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    async for doc in db.services_master.aggregate(pipeline):
        pillar_counts[doc["_id"]] = doc["count"]
    
    return {
        "total": total,
        "active": active,
        "bookable": bookable,
        "free": free_services,
        "consultation_required": consultation_required,
        "emergency_24x7": emergency_24x7,
        "inactive": total - active,
        "by_pillar": pillar_counts
    }


# ==================== LIST SERVICES ====================

@router.get("/services")
async def list_services(
    search: Optional[str] = None,
    pillar: Optional[str] = None,
    is_bookable: Optional[bool] = None,
    is_active: Optional[bool] = None,
    is_free: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50
):
    """List services with filters"""
    db = get_db()
    
    query = {}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"id": {"$regex": search, "$options": "i"}}
        ]
    
    if pillar:
        query["pillar"] = pillar
    
    if is_bookable is not None:
        query["is_bookable"] = is_bookable
    
    if is_active is not None:
        if is_active:
            query["is_active"] = {"$ne": False}
        else:
            query["is_active"] = False
    
    if is_free is not None:
        query["is_free"] = is_free
    
    # Get total count
    total = await db.service_catalog.count_documents(query)
    
    # Get services
    services = await db.service_catalog.find(query, {"_id": 0}).sort("pillar", 1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "services": services,
        "total": total,
        "skip": skip,
        "limit": limit,
        "pillars": ALL_PILLARS
    }


# ==================== GET SERVICE ====================

@router.get("/services/{service_id}")
async def get_service(service_id: str):
    """Get single service by ID"""
    db = get_db()
    
    service = await db.service_catalog.find_one({"id": service_id}, {"_id": 0})
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    return service


# ==================== CREATE SERVICE ====================

@router.post("/services")
async def create_service(service: ServiceCreate):
    """Create new service"""
    db = get_db()
    
    # Generate ID if not provided
    if not service.id:
        pillar_prefix = service.pillar.upper()[:4]
        short_name = service.name.upper().replace(" ", "-")[:20]
        service_id = f"SVC-{pillar_prefix}-{short_name}"
    else:
        service_id = service.id
    
    # Check if exists
    existing = await db.service_catalog.find_one({"id": service_id})
    if existing:
        raise HTTPException(status_code=400, detail=f"Service with ID {service_id} already exists")
    
    # Find pillar info
    pillar_info = next((p for p in ALL_PILLARS if p["id"] == service.pillar), None)
    pillar_name = pillar_info["name"] if pillar_info else service.pillar.title()
    pillar_icon = pillar_info["icon"] if pillar_info else "📦"
    
    now = datetime.now(timezone.utc)
    
    service_doc = {
        "id": service_id,
        "name": service.name,
        "pillar": service.pillar,
        "pillar_name": pillar_name,
        "pillar_icon": pillar_icon,
        "description": service.description,
        
        "is_bookable": service.is_bookable,
        "requires_consultation": service.requires_consultation,
        "is_free": service.is_free,
        "is_24x7": service.is_24x7,
        
        "base_price": service.base_price,
        "duration_minutes": service.duration_minutes,
        "city_pricing": service.city_pricing,
        "pet_size_pricing": service.pet_size_pricing,
        "pet_count_pricing": service.pet_count_pricing,
        "deposit_percentage": service.deposit_percentage,
        "payment_timing": service.payment_timing,
        
        "available_cities": service.available_cities,
        "available_days": service.available_days,
        "available_time_slots": service.available_time_slots,
        
        "includes": service.includes,
        "add_ons": service.add_ons,
        "image_url": service.image_url,
        
        "paw_points_eligible": service.paw_points_eligible,
        "paw_points_value": service.paw_points_value,
        
        "is_active": service.is_active,
        "created_at": now,
        "updated_at": now
    }
    
    await db.service_catalog.insert_one(service_doc)
    
    logger.info(f"[SERVICE BOX] Created service: {service_id}")
    
    return {"success": True, "service_id": service_id, "service": {k: v for k, v in service_doc.items() if k != "_id"}}


# ==================== UPDATE SERVICE ====================

@router.put("/services/{service_id}")
async def update_service(service_id: str, service: ServiceCreate):
    """Update existing service"""
    db = get_db()
    
    existing = await db.service_catalog.find_one({"id": service_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Find pillar info
    pillar_info = next((p for p in ALL_PILLARS if p["id"] == service.pillar), None)
    pillar_name = pillar_info["name"] if pillar_info else service.pillar.title()
    pillar_icon = pillar_info["icon"] if pillar_info else "📦"
    
    update_doc = {
        "name": service.name,
        "pillar": service.pillar,
        "pillar_name": pillar_name,
        "pillar_icon": pillar_icon,
        "description": service.description,
        
        "is_bookable": service.is_bookable,
        "requires_consultation": service.requires_consultation,
        "is_free": service.is_free,
        "is_24x7": service.is_24x7,
        
        "base_price": service.base_price,
        "duration_minutes": service.duration_minutes,
        "city_pricing": service.city_pricing,
        "pet_size_pricing": service.pet_size_pricing,
        "pet_count_pricing": service.pet_count_pricing,
        "deposit_percentage": service.deposit_percentage,
        "payment_timing": service.payment_timing,
        
        "available_cities": service.available_cities,
        "available_days": service.available_days,
        "available_time_slots": service.available_time_slots,
        
        "includes": service.includes,
        "add_ons": service.add_ons,
        "image_url": service.image_url,
        
        "paw_points_eligible": service.paw_points_eligible,
        "paw_points_value": service.paw_points_value,
        
        "is_active": service.is_active,
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.service_catalog.update_one({"id": service_id}, {"$set": update_doc})
    
    logger.info(f"[SERVICE BOX] Updated service: {service_id}")
    
    return {"success": True, "service_id": service_id}


# ==================== DELETE SERVICE ====================

@router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    """Archive/deactivate service (soft delete)"""
    db = get_db()
    
    existing = await db.service_catalog.find_one({"id": service_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    await db.service_catalog.update_one(
        {"id": service_id},
        {"$set": {"is_active": False, "archived_at": datetime.now(timezone.utc)}}
    )
    
    logger.info(f"[SERVICE BOX] Archived service: {service_id}")
    
    return {"success": True, "message": "Service archived"}


# ==================== CLONE SERVICE ====================

@router.post("/services/{service_id}/clone")
async def clone_service(service_id: str):
    """Clone existing service"""
    db = get_db()
    
    existing = await db.service_catalog.find_one({"id": service_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Generate new ID
    new_id = f"{service_id}-COPY-{uuid.uuid4().hex[:6].upper()}"
    
    now = datetime.now(timezone.utc)
    
    new_service = {
        **existing,
        "id": new_id,
        "name": f"{existing['name']} (Copy)",
        "is_active": False,  # Start as draft
        "created_at": now,
        "updated_at": now
    }
    
    await db.service_catalog.insert_one(new_service)
    
    logger.info(f"[SERVICE BOX] Cloned service {service_id} to {new_id}")
    
    return {"success": True, "new_service_id": new_id, "service": {k: v for k, v in new_service.items() if k != "_id"}}


# ==================== TOGGLE SERVICE STATUS ====================

@router.post("/services/{service_id}/toggle")
async def toggle_service(service_id: str):
    """Toggle service active/inactive"""
    db = get_db()
    
    existing = await db.service_catalog.find_one({"id": service_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    new_status = not existing.get("is_active", True)
    
    await db.service_catalog.update_one(
        {"id": service_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    logger.info(f"[SERVICE BOX] Toggled service {service_id} to {'active' if new_status else 'inactive'}")
    
    return {"success": True, "is_active": new_status}


# ==================== SEED ALL SERVICES ====================

@router.post("/seed-all")
async def seed_all_services():
    """Seed all services from master list"""
    db = get_db()
    
    # Import and run the seeder
    try:
        from seed_master_services import MASTER_SERVICES
        
        now = datetime.now(timezone.utc)
        total_created = 0
        total_updated = 0
        
        for pillar, pillar_data in MASTER_SERVICES.items():
            for service in pillar_data["services"]:
                service_doc = {
                    **service,
                    "pillar": pillar,
                    "pillar_name": pillar_data["pillar_name"],
                    "pillar_icon": pillar_data["icon"],
                    "is_active": True,
                    "updated_at": now,
                    "is_bookable": service.get("is_bookable", False),
                    "base_price": service.get("base_price"),
                    "duration_minutes": service.get("duration_minutes"),
                    "requires_consultation": service.get("requires_consultation", False),
                    "is_free": service.get("is_free", False),
                    "is_24x7": service.get("is_24x7", False),
                    "city_pricing": service.get("city_pricing", {}),
                    "pet_size_pricing": service.get("pet_size_pricing", {}),
                    "pet_count_pricing": service.get("pet_count_pricing", {}),
                    "includes": service.get("includes", []),
                    "add_ons": service.get("add_ons", []),
                    "payment_timing": "configurable",
                    "deposit_percentage": 20
                }
                
                existing = await db.service_catalog.find_one({"id": service["id"]})
                
                if existing:
                    await db.service_catalog.update_one(
                        {"id": service["id"]},
                        {"$set": {**service_doc, "created_at": existing.get("created_at", now)}}
                    )
                    total_updated += 1
                else:
                    service_doc["created_at"] = now
                    await db.service_catalog.insert_one(service_doc)
                    total_created += 1
        
        # Ensure indexes
        await db.service_catalog.create_index("id", unique=True)
        await db.service_catalog.create_index("pillar")
        await db.service_catalog.create_index("is_bookable")
        await db.service_catalog.create_index("is_active")
        
        logger.info(f"[SERVICE BOX] Seed complete: {total_created} created, {total_updated} updated")
        
        return {
            "success": True,
            "created": total_created,
            "updated": total_updated,
            "total": total_created + total_updated
        }
        
    except Exception as e:
        logger.error(f"[SERVICE BOX] Seed error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== EXPORT CSV ====================

@router.get("/export")
async def export_services():
    """Export all services as JSON (for CSV conversion in frontend)"""
    db = get_db()
    
    services = await db.service_catalog.find({}, {"_id": 0}).to_list(1000)
    
    return {
        "services": services,
        "count": len(services),
        "exported_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== SERVICE BOOKINGS ====================

@router.get("/bookings")
async def get_service_bookings(
    service_id: Optional[str] = None,
    pillar: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get service bookings/orders"""
    db = get_db()
    
    query = {}
    
    if service_id:
        query["service_id"] = service_id
    
    if pillar:
        query["pillar"] = pillar
    
    if status:
        query["status"] = status
    
    # Check quick_bookings collection for service bookings
    total = await db.quick_bookings.count_documents(query)
    bookings = await db.quick_bookings.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return {
        "bookings": bookings,
        "total": total,
        "skip": skip,
        "limit": limit
    }

"""
Service Box Admin Routes
Full CRUD for services with filtering, stats, and bulk operations
"""

from fastapi import APIRouter, HTTPException, Query, Header, Request
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
    approval_status: Optional[str] = "live"  # live | paused | draft | archived


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
    active_only: bool = True,  # Default TRUE — inactive services must never appear on consumer frontend
    skip: int = 0,
    limit: int = 50
):
    """List services with filters"""
    db = get_db()
    
    query = {}

    # Strict inactive filtering — applied unless caller explicitly passes is_active=false
    if active_only and is_active is None:
        query["is_active"] = {"$ne": False}

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
    total = await db.services_master.count_documents(query)
    
    # Get services
    services = await db.services_master.find(query, {"_id": 0}).sort("pillar", 1).skip(skip).limit(limit).to_list(limit)

    for service in services:
        # Prefer watercolor_image (Cloudinary) over image_url (may be old static URL)
        preferred_image = service.get("watercolor_image") or service.get("image_url") or service.get("image")
        if preferred_image:
            service["image_url"] = preferred_image
            service["image"] = preferred_image
        # Mark as service type so SharedProductCard shows Concierge flow, not Add to Cart
        # Exception: pillar=shop items are purchasable bakery/retail items — keep as-is
        if service.get("pillar") != "shop":
            service["product_type"] = "service"
    
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
    
    service = await db.services_master.find_one({"id": service_id}, {"_id": 0})
    
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Prefer watercolor_image (Cloudinary) over image_url (may be old static URL)
    preferred_image = service.get("watercolor_image") or service.get("image_url") or service.get("image")
    if preferred_image:
        service["image_url"] = preferred_image
        service["image"] = preferred_image
    
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
    existing = await db.services_master.find_one({"id": service_id})
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
    
    await db.services_master.insert_one(service_doc)
    
    logger.info(f"[SERVICE BOX] Created service: {service_id}")
    
    return {"success": True, "service_id": service_id, "service": {k: v for k, v in service_doc.items() if k != "_id"}}


# ==================== UPDATE SERVICE ====================

@router.put("/services/{service_id}")
async def update_service(service_id: str, service: ServiceCreate):
    """Update existing service"""
    db = get_db()
    
    existing = await db.services_master.find_one({"id": service_id})
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
        "approval_status": service.approval_status or ("live" if service.is_active else "paused"),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.services_master.update_one({"id": service_id}, {"$set": update_doc})
    
    logger.info(f"[SERVICE BOX] Updated service: {service_id}")
    
    return {"success": True, "service_id": service_id}


# ==================== DELETE SERVICE ====================

@router.delete("/services/{service_id}")
async def delete_service(service_id: str):
    """Hard delete a service from the database"""
    db = get_db()
    
    existing = await db.services_master.find_one({"id": service_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    await db.services_master.delete_one({"id": service_id})
    
    logger.info(f"[SERVICE BOX] Deleted service: {service_id}")
    
    return {"success": True, "message": "Service deleted"}



# ==================== PATCH SERVICE PRICING ====================

@router.patch("/services/{service_id}/pricing")
async def patch_service_pricing(service_id: str, updates: dict):
    """Update only service pricing fields — used by Pricing Hub"""
    db = get_db()
    allowed_fields = {"base_price", "discounted_price", "active", "is_free", "sort_order"}
    update_doc = {k: v for k, v in updates.items() if k in allowed_fields}
    if not update_doc:
        raise HTTPException(status_code=400, detail="No valid pricing fields provided")
    update_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.services_master.update_one({"id": service_id}, {"$set": update_doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    updated = await db.services_master.find_one({"id": service_id}, {"_id": 0})
    return {"success": True, "service": updated}


# ==================== CLONE SERVICE ====================

@router.post("/services/{service_id}/clone")
async def clone_service(service_id: str):
    """Clone existing service"""
    db = get_db()
    
    existing = await db.services_master.find_one({"id": service_id}, {"_id": 0})
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
    
    await db.services_master.insert_one(new_service)
    
    logger.info(f"[SERVICE BOX] Cloned service {service_id} to {new_id}")
    
    return {"success": True, "new_service_id": new_id, "service": {k: v for k, v in new_service.items() if k != "_id"}}


# ==================== TOGGLE SERVICE STATUS ====================

@router.post("/services/{service_id}/toggle")
async def toggle_service(service_id: str):
    """Toggle service active/inactive"""
    db = get_db()
    
    existing = await db.services_master.find_one({"id": service_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Service not found")
    
    new_status = not existing.get("is_active", True)
    
    await db.services_master.update_one(
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
                
                existing = await db.services_master.find_one({"id": service["id"]})
                
                if existing:
                    await db.services_master.update_one(
                        {"id": service["id"]},
                        {"$set": {**service_doc, "created_at": existing.get("created_at", now)}}
                    )
                    total_updated += 1
                else:
                    service_doc["created_at"] = now
                    await db.services_master.insert_one(service_doc)
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
    
    services = await db.services_master.find({}, {"_id": 0}).to_list(1000)
    
    return {
        "services": services,
        "count": len(services),
        "exported_at": datetime.now(timezone.utc).isoformat()
    }


@router.get("/export-csv")
async def export_services_csv():
    """Export services as CSV-ready format"""
    db = get_db()
    
    services = await db.services_master.find({}, {"_id": 0}).to_list(1000)
    
    # Flatten for CSV
    csv_services = []
    for s in services:
        csv_row = {
            "id": s.get("id", ""),
            "name": s.get("name", ""),
            "pillar": s.get("pillar", ""),
            "description": s.get("description", ""),
            "base_price": s.get("base_price", 0),
            "duration": s.get("duration", ""),
            "is_bookable": s.get("is_bookable", True),
            "is_free": s.get("is_free", False),
            "is_active": s.get("is_active", True),
            "mira_whisper": s.get("mira_whisper", ""),
            "includes": ";".join(s.get("includes", [])),
            # Breed whispers flattened
            "whisper_shih_tzu": s.get("breed_whispers", {}).get("shih_tzu", ""),
            "whisper_golden_retriever": s.get("breed_whispers", {}).get("golden_retriever", ""),
            "whisper_labrador": s.get("breed_whispers", {}).get("labrador", ""),
            "whisper_pug": s.get("breed_whispers", {}).get("pug", ""),
            "whisper_beagle": s.get("breed_whispers", {}).get("beagle", ""),
            "whisper_german_shepherd": s.get("breed_whispers", {}).get("german_shepherd", ""),
            "whisper_default": s.get("breed_whispers", {}).get("default", ""),
        }
        csv_services.append(csv_row)
    
    return {
        "services": csv_services,
        "count": len(csv_services),
        "columns": list(csv_services[0].keys()) if csv_services else [],
        "exported_at": datetime.now(timezone.utc).isoformat()
    }


# ==================== IMPORT CSV ====================

from pydantic import BaseModel as PydanticBaseModel

class ServiceImportRow(PydanticBaseModel):
    id: str
    name: str
    pillar: str
    description: Optional[str] = ""
    base_price: Optional[float] = 0
    duration: Optional[str] = ""
    is_bookable: Optional[bool] = True
    is_free: Optional[bool] = False
    is_active: Optional[bool] = True
    mira_whisper: Optional[str] = ""
    includes: Optional[str] = ""
    whisper_shih_tzu: Optional[str] = ""
    whisper_golden_retriever: Optional[str] = ""
    whisper_labrador: Optional[str] = ""
    whisper_pug: Optional[str] = ""
    whisper_beagle: Optional[str] = ""
    whisper_german_shepherd: Optional[str] = ""
    whisper_default: Optional[str] = ""

@router.post("/import-csv")
async def import_services_csv(services: List[ServiceImportRow]):
    """Import services from CSV format"""
    db = get_db()
    
    now = datetime.now(timezone.utc)
    created = 0
    updated = 0
    errors = []
    
    for row in services:
        try:
            # Build breed whispers
            breed_whispers = {}
            if row.whisper_shih_tzu:
                breed_whispers["shih_tzu"] = row.whisper_shih_tzu
            if row.whisper_golden_retriever:
                breed_whispers["golden_retriever"] = row.whisper_golden_retriever
            if row.whisper_labrador:
                breed_whispers["labrador"] = row.whisper_labrador
            if row.whisper_pug:
                breed_whispers["pug"] = row.whisper_pug
            if row.whisper_beagle:
                breed_whispers["beagle"] = row.whisper_beagle
            if row.whisper_german_shepherd:
                breed_whispers["german_shepherd"] = row.whisper_german_shepherd
            if row.whisper_default:
                breed_whispers["default"] = row.whisper_default
            
            # Find pillar info
            pillar_info = next((p for p in ALL_PILLARS if p["id"] == row.pillar), None)
            
            service_doc = {
                "id": row.id,
                "name": row.name,
                "pillar": row.pillar,
                "pillars": [row.pillar],
                "pillar_name": pillar_info["name"] if pillar_info else row.pillar.title(),
                "pillar_icon": pillar_info["icon"] if pillar_info else "📦",
                "description": row.description or "",
                "base_price": row.base_price,
                "duration": row.duration,
                "is_bookable": row.is_bookable,
                "is_free": row.is_free,
                "is_active": row.is_active,
                "mira_whisper": row.mira_whisper or row.whisper_default or "Curated for your companion",
                "breed_whispers": breed_whispers if breed_whispers else {"default": "Curated for your companion"},
                "includes": row.includes.split(";") if row.includes else [],
                "updated_at": now
            }
            
            existing = await db.services_master.find_one({"id": row.id})
            
            if existing:
                await db.services_master.update_one(
                    {"id": row.id},
                    {"$set": {**service_doc, "created_at": existing.get("created_at", now)}}
                )
                updated += 1
            else:
                service_doc["created_at"] = now
                await db.services_master.insert_one(service_doc)
                created += 1
                
        except Exception as e:
            errors.append({"id": row.id, "error": str(e)})
    
    return {
        "success": True,
        "created": created,
        "updated": updated,
        "errors": errors,
        "total_processed": created + updated
    }


# ==================== SEED BREED-SPECIFIC SERVICES ====================

@router.post("/seed-breed-services")
async def seed_breed_specific_services():
    """Seed services with breed-specific Mira whispers"""
    db = get_db()
    
    try:
        from seed_breed_services import seed_services_with_whispers
        result = await seed_services_with_whispers(db)
        
        logger.info(f"[SERVICE BOX] Breed-specific seed complete: {result}")
        
        return {
            "success": True,
            **result,
            "message": "Services seeded with breed-specific Mira whispers"
        }
    except Exception as e:
        logger.error(f"[SERVICE BOX] Seed error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-all-whispers")
async def update_all_service_whispers():
    """Update ALL existing services with appropriate Mira whispers"""
    db = get_db()
    
    try:
        from update_service_whispers import update_existing_services_with_whispers
        result = await update_existing_services_with_whispers(db)
        
        logger.info(f"[SERVICE BOX] Whispers update complete: {result}")
        
        return {
            "success": True,
            **result,
            "message": "All services updated with Mira whispers"
        }
    except Exception as e:
        logger.error(f"[SERVICE BOX] Update whispers error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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



# ==================== AI IMAGE GENERATION ====================

# Service-specific image prompts for contextual AI generation
SERVICE_IMAGE_PROMPTS = {
    # Advisory
    "Pet Life Planning": "Professional pet consultant with tablet reviewing pet care plan with dog owner in modern office, warm lighting, premium service, clean minimal style",
    "Housing & Society Advisory": "Pet-friendly apartment building consultation, real estate advisor with happy dog family, modern living space, welcoming atmosphere",
    "Multi-Pet Household Planning": "Multiple pets (dog and cat) peacefully coexisting in organized home, pet behavior specialist consulting family, harmonious setup",
    "Behavior Escalation Pathways": "Professional dog behaviorist working with anxious dog, calm training environment, behavioral therapy session, supportive atmosphere",
    "End-of-Life Preparation": "Compassionate veterinarian with elderly dog, peaceful setting, gentle care moment, soft pastel colors, dignified and loving",
    
    # Care
    "Veterinary Consultation": "Modern veterinary clinic with friendly vet examining happy dog, clean medical environment, professional pet healthcare",
    "Pet Grooming": "Professional dog groomer styling fluffy dog in modern salon, grooming tools, spa-like atmosphere, pampered pet",
    "Health Checkup": "Veterinarian performing routine checkup on dog with stethoscope, clean clinic, preventive care, healthy pet",
    "Vaccination": "Veterinarian giving gentle vaccination to puppy, caring environment, pet protection, medical care",
    "Dental Care": "Pet dental specialist cleaning dog's teeth, specialized equipment, oral health care for pets",
    
    # Celebrate
    "Pet Birthday Party": "Colorful dog birthday party setup with cake, balloons, party hats, celebration decorations, joyful atmosphere",
    "Gotcha Day Celebration": "Happy adopted dog anniversary celebration, special treats, family gathering, heartwarming moment",
    "Pet Photography": "Professional pet photographer with studio setup capturing beautiful dog portrait, artistic lighting",
    
    # Travel
    "Pet Taxi": "Premium pet-friendly vehicle service, comfortable car interior with happy dog, professional driver, safe transport",
    "Pet Relocation": "Professional pet relocation service with travel crate, airline-approved carrier, international pet travel",
    "Pet-Friendly Hotels": "Luxury pet-friendly hotel room with dog on bed, amenities, premium accommodations, travel comfort",
    
    # Emergency
    "24/7 Emergency Vet": "Emergency veterinary clinic at night, urgent care for pets, medical equipment, life-saving care",
    "Pet Ambulance": "Pet ambulance vehicle with medical equipment, emergency response, professional service",
    
    # Farewell
    "Pet Memorial": "Beautiful pet memorial garden with flowers, peaceful tribute, loving remembrance, soft natural lighting",
    "Cremation Services": "Dignified pet cremation facility, respectful farewell service, compassionate care, serene atmosphere",
    
    # Learn
    "Puppy Training": "Professional dog trainer with playful puppy in training class, positive reinforcement, learning environment",
    "Obedience Training": "Well-trained dog performing commands with trainer, professional training facility, disciplined session",
    "Agility Training": "Dog running through agility course obstacles, active training, athletic performance, exciting action",
    
    # Fit
    "Dog Walking": "Professional dog walker with happy dogs in beautiful park, exercise outdoors, healthy activity",
    "Pet Swimming": "Dog swimming in pool with trainer, hydrotherapy session, fitness activity, water exercise",
    "Pet Yoga": "Calm yoga session with dog, doga class, wellness activity, relaxation and bonding",
    
    # Stay
    "Pet Boarding": "Luxury pet boarding facility with comfortable sleeping areas, professional care, home away from home",
    "Doggy Daycare": "Happy dogs playing in daycare facility, supervised playtime, social interaction, fun environment",
    "Pet Sitting": "Professional pet sitter at home with relaxed dog, in-home care, trusted companion care",
    
    # Adopt
    "Pet Adoption": "Happy family adopting dog from shelter, heartwarming moment, new beginnings, loving home",
    "Foster Care": "Foster family caring for rescue dog, temporary home, nurturing environment, second chance",
}

# Default prompt for services without specific mapping
DEFAULT_SERVICE_PROMPT = "Professional pet service in modern setting, happy dog with caring staff, premium quality service, warm atmosphere, clean design"


@router.post("/services/{service_id}/generate-image")
async def generate_service_image(service_id: str, request: Request, x_admin_user: Optional[str] = Header(None)):
    """Generate watercolor AI image for a specific service"""
    import os
    import cloudinary
    import cloudinary.uploader
    
    db = get_db()
    
    # Find the service
    service = await db.services_master.find_one({"id": service_id})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service_name = service.get("name", "Pet Service")
    pillar = service.get("pillar", "care")
    
    # Get contextual prompt — use custom prompt from request body if provided
    try:
        body = await request.json()
        custom_prompt = body.get("prompt", "")
        breed = body.get("breed", "")
    except Exception:
        custom_prompt = ""
        breed = ""
    prompt = custom_prompt if custom_prompt else SERVICE_IMAGE_PROMPTS.get(service_name, DEFAULT_SERVICE_PROMPT)

    # Inject breed into prompt for personalised illustrations
    if breed:
        prompt = f"A {breed} {prompt}"
    
    # Add pillar context to prompt
    pillar_context = {
        "celebrate": "festive, joyful celebration",
        "care": "healthcare, medical care, wellness",
        "travel": "travel, transport, journey",
        "stay": "accommodation, comfort, home",
        "fit": "fitness, exercise, activity",
        "learn": "training, education, learning",
        "emergency": "urgent care, emergency response",
        "farewell": "memorial, peaceful, compassionate",
        "advisory": "consultation, professional advice",
        "adopt": "adoption, new family, rescue",
        "dine": "food, nutrition, mealtime",
        "enjoy": "fun, play, entertainment",
        "paperwork": "documents, legal, administration"
    }
    
    enhanced_prompt = (
        f"{prompt}. Context: {pillar_context.get(pillar, 'premium pet service')}. "
        "Style: soulful watercolor illustration, elegant brushwork, soft layered pigments, premium editorial composition, "
        "warm emotional palette, no text overlay, not photorealistic, suitable for a premium pet concierge service card."
    )
    
    logger.info(f"Generating image for service: {service_name} with prompt: {enhanced_prompt[:100]}...")
    
    try:
        # Generate image using OpenAI
        from emergentintegrations.llm.openai.image_generation import OpenAIImageGeneration
        
        emergent_api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY") or os.environ.get("EMERGENT_MODEL_API_KEY")
        if not emergent_api_key:
            raise HTTPException(status_code=500, detail="EMERGENT_API_KEY not configured")
        
        # Generate image
        image_gen = OpenAIImageGeneration(api_key=emergent_api_key)
        images = await image_gen.generate_images(
            prompt=enhanced_prompt,
            number_of_images=1,
            model="gpt-image-1"
        )
        
        if not images or len(images) == 0:
            raise HTTPException(status_code=500, detail="Failed to generate image")
        
        # The images are returned as bytes, need to convert to base64 for Cloudinary
        import base64
        image_base64 = base64.b64encode(images[0]).decode('utf-8')
        image_data_url = f"data:image/png;base64,{image_base64}"
        
        # Upload to Cloudinary
        cloudinary.config(
            cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME", "duoapcx1p"),
            api_key=os.environ.get("CLOUDINARY_API_KEY"),
            api_secret=os.environ.get("CLOUDINARY_API_SECRET")
        )
        
        # Create a clean folder path
        folder = f"doggy/services/{pillar}"
        public_id = f"{folder}/{service_id.lower().replace(' ', '-')}"
        
        upload_result = cloudinary.uploader.upload(
            image_data_url,
            public_id=public_id,
            overwrite=True,
            resource_type="image"
        )
        
        cloudinary_url = upload_result.get("secure_url")
        
        # Update service with new watercolor image
        await db.services_master.update_one(
            {"id": service_id},
            {
                "$set": {
                    "image_url": cloudinary_url,
                    "image": cloudinary_url,
                    "watercolor_image": cloudinary_url,
                    "image_generated_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        logger.info(f"Successfully generated image for service {service_id}: {cloudinary_url}")
        
        return {
            "success": True,
            "service_id": service_id,
            "service_name": service_name,
            "image_url": cloudinary_url,
            "message": f"Image generated for {service_name}"
        }
        
    except Exception as e:
        logger.error(f"Error generating image for service {service_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate image: {str(e)}")


@router.post("/generate-all-images")
async def generate_all_service_images(
    pillar: Optional[str] = Query(None, description="Filter by pillar"),
    limit: int = Query(10, description="Max images to generate"),
    x_admin_user: Optional[str] = Header(None)
):
    """Generate AI images for multiple services (batch operation)"""
    db = get_db()
    
    # Find services without proper images or with default images
    query = {
        "$or": [
            {"image_url": {"$exists": False}},
            {"image_url": None},
            {"image_url": ""},
            {"image_url": {"$regex": "static.prod-images.emergentagent.com"}}  # Default placeholder
        ]
    }
    
    if pillar:
        query["pillar"] = pillar
    
    services = await db.services_master.find(query, {"_id": 0, "id": 1, "name": 1, "pillar": 1}).to_list(length=limit)
    
    results = []
    for service in services:
        try:
            result = await generate_service_image(service["id"])
            results.append({"service_id": service["id"], "success": True, "image_url": result.get("image_url")})
        except Exception as e:
            results.append({"service_id": service["id"], "success": False, "error": str(e)})
    
    successful = sum(1 for r in results if r["success"])
    
    return {
        "total_processed": len(results),
        "successful": successful,
        "failed": len(results) - successful,
        "results": results
    }

"""
ADVISORY Pillar Routes - Expert Pet Guidance & Consultations
Behaviour consults, nutrition planning, senior care, training guidance
Complete CRUD with Service Desk, Notifications, and Unified Inbox integration
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import logging
import csv
import io

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/advisory", tags=["advisory"])

def get_db():
    from server import db
    return db


# Advisory Service Types
ADVISORY_TYPES = {
    "behaviour": {
        "name": "Behaviour Consultations",
        "icon": "Brain",
        "description": "Expert help with anxiety, aggression, fear, and other behavioural issues",
        "color": "from-violet-500 to-purple-600"
    },
    "nutrition": {
        "name": "Nutrition Planning",
        "icon": "Apple",
        "description": "Custom diet plans, weight management, and food recommendations",
        "color": "from-green-500 to-emerald-600"
    },
    "senior_care": {
        "name": "Senior Pet Planning",
        "icon": "Heart",
        "description": "Mobility support, comfort care, and quality of life planning for aging pets",
        "color": "from-amber-500 to-orange-600"
    },
    "new_pet": {
        "name": "New Pet Guidance",
        "icon": "Home",
        "description": "First-time owner support, puppy/kitten prep, and adoption guidance",
        "color": "from-blue-500 to-cyan-600"
    },
    "health": {
        "name": "Health Advisory",
        "icon": "Stethoscope",
        "description": "General wellness guidance, preventive care, and health monitoring",
        "color": "from-rose-500 to-pink-600"
    },
    "training": {
        "name": "Training Consultations",
        "icon": "GraduationCap",
        "description": "Obedience, tricks, socialization, and specialized training guidance",
        "color": "from-indigo-500 to-blue-600"
    }
}

# Consultation Formats
CONSULTATION_FORMATS = ["video_call", "phone_call", "in_person", "chat", "email"]


# ==================== ADVISORY REQUESTS ====================

@router.post("/request")
async def create_advisory_request(request_data: dict):
    """Create a new advisory request with Service Desk integration"""
    db = get_db()
    
    request_id = f"ADV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    advisory_request = {
        "id": request_id,
        "request_id": request_id,
        "advisory_type": request_data.get("advisory_type", "behaviour"),
        "status": "pending",
        "priority": request_data.get("priority", "normal"),
        
        # Pet Details
        "pet_id": request_data.get("pet_id"),
        "pet_name": request_data.get("pet_name"),
        "pet_breed": request_data.get("pet_breed"),
        "pet_age": request_data.get("pet_age"),
        "pet_species": request_data.get("pet_species", "dog"),
        
        # User Details
        "user_id": request_data.get("user_id"),
        "user_name": request_data.get("user_name"),
        "user_email": request_data.get("user_email"),
        "user_phone": request_data.get("user_phone"),
        
        # Advisory Details
        "concern": request_data.get("concern", ""),
        "concern_duration": request_data.get("concern_duration"),  # days, weeks, months
        "severity": request_data.get("severity", "moderate"),  # mild, moderate, severe, urgent
        "previous_consultations": request_data.get("previous_consultations", False),
        "current_treatments": request_data.get("current_treatments", ""),
        "preferred_format": request_data.get("preferred_format", "video_call"),
        "preferred_time": request_data.get("preferred_time"),
        "budget_range": request_data.get("budget_range"),
        "notes": request_data.get("notes", ""),
        
        # Tracking
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "assigned_to": None,
        "advisor_id": None,
        "consultation_date": None,
        "follow_up_date": None
    }
    
    await db.advisory_requests.insert_one({k: v for k, v in advisory_request.items() if k != "_id"})
    
    # Create Service Desk Ticket
    ticket = {
        "id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "source": "advisory_pillar",
        "source_id": request_id,
        "category": "advisory",
        "subcategory": advisory_request["advisory_type"],
        "subject": f"Advisory Request: {ADVISORY_TYPES.get(advisory_request['advisory_type'], {}).get('name', 'Consultation')} for {advisory_request['pet_name']}",
        "description": f"New advisory request from {advisory_request['user_name']} for {advisory_request['pet_name']}.\nConcern: {advisory_request['concern']}\nSeverity: {advisory_request['severity']}\nPreferred Format: {advisory_request['preferred_format']}",
        "status": "open",
        "priority": "high" if advisory_request["severity"] in ["severe", "urgent"] else advisory_request["priority"],
        "urgency": "high" if advisory_request["severity"] == "urgent" else "medium",
        "customer_name": advisory_request["user_name"],
        "customer_email": advisory_request["user_email"],
        "customer_phone": advisory_request["user_phone"],
        "pet_name": advisory_request["pet_name"],
        "pet_id": advisory_request["pet_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "tags": ["advisory", advisory_request["advisory_type"], advisory_request["severity"]],
        "pillar": "advisory"
    }
    
    await db.tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    
    # Add to Unified Inbox
    inbox_item = {
        "id": f"INB-{uuid.uuid4().hex[:8].upper()}",
        "type": "advisory_request",
        "source": "advisory_pillar",
        "reference_id": request_id,
        "ticket_id": ticket["id"],
        "title": f"New Advisory Request: {ADVISORY_TYPES.get(advisory_request['advisory_type'], {}).get('name', 'Consultation')}",
        "preview": f"{advisory_request['pet_name']} - {advisory_request['concern'][:50]}..." if len(advisory_request['concern']) > 50 else f"{advisory_request['pet_name']} - {advisory_request['concern']}",
        "customer_name": advisory_request["user_name"],
        "customer_email": advisory_request["user_email"],
        "pet_name": advisory_request["pet_name"],
        "status": "unread",
        "priority": ticket["priority"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "pillar": "advisory"
    }
    
    await db.unified_inbox.insert_one({k: v for k, v in inbox_item.items() if k != "_id"})
    
    # Create admin notification
    notification = {
        "id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "type": "new_advisory_request",
        "title": f"New Advisory Request: {advisory_request['advisory_type'].replace('_', ' ').title()}",
        "message": f"{advisory_request['user_name']} needs {ADVISORY_TYPES.get(advisory_request['advisory_type'], {}).get('name', 'advisory')} for {advisory_request['pet_name']}. Severity: {advisory_request['severity']}",
        "category": "advisory",
        "priority": ticket["priority"],
        "related_id": request_id,
        "link_to": f"/admin?tab=advisory&request={request_id}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_notifications.insert_one({k: v for k, v in notification.items() if k != "_id"})
    
    logger.info(f"Created advisory request {request_id} with ticket {ticket['id']}")
    
    return {
        "message": "Advisory request submitted successfully. Our expert team will contact you within 24 hours.",
        "request_id": request_id,
        "ticket_id": ticket["id"]
    }


@router.get("/requests")
async def get_advisory_requests(
    status: Optional[str] = None,
    advisory_type: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50
):
    """Get all advisory requests"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if advisory_type:
        query["advisory_type"] = advisory_type
    if severity:
        query["severity"] = severity
    
    requests = await db.advisory_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    return {"requests": requests, "total": len(requests)}


@router.get("/requests/{request_id}")
async def get_advisory_request(request_id: str):
    """Get a specific advisory request"""
    db = get_db()
    
    request = await db.advisory_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return request


@router.put("/requests/{request_id}")
async def update_advisory_request(request_id: str, update_data: dict):
    """Update an advisory request"""
    db = get_db()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data.pop("id", None)
    update_data.pop("_id", None)
    
    result = await db.advisory_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Update linked ticket status if status changed
    if "status" in update_data:
        ticket_status_map = {
            "pending": "open",
            "scheduled": "in_progress",
            "in_progress": "in_progress",
            "completed": "resolved",
            "cancelled": "closed"
        }
        new_ticket_status = ticket_status_map.get(update_data["status"])
        if new_ticket_status:
            await db.tickets.update_one(
                {"source_id": request_id},
                {"$set": {"status": new_ticket_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    return {"message": "Request updated"}


# ==================== ADVISORS (PARTNERS) ====================

@router.get("/advisors")
async def get_advisors(
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    is_featured: bool = False,
    limit: int = 50
):
    """Get available advisors"""
    db = get_db()
    
    query = {"is_active": True}
    if specialty:
        query["specialties"] = {"$in": [specialty]}
    if city:
        query["cities"] = {"$in": [city]}
    if is_featured:
        query["is_featured"] = True
    
    advisors = await db.advisory_partners.find(query, {"_id": 0}).sort("rating", -1).to_list(limit)
    
    return {"advisors": advisors, "total": len(advisors)}


@router.get("/admin/partners")
async def get_advisory_partners(is_active: bool = True):
    """Get all advisory partners (admin)"""
    db = get_db()
    
    query = {}
    if is_active:
        query["is_active"] = True
    
    partners = await db.advisory_partners.find(query, {"_id": 0}).to_list(100)
    
    return {"partners": partners, "total": len(partners)}


@router.post("/admin/partners")
async def create_advisory_partner(partner_data: dict):
    """Create a new advisory partner"""
    db = get_db()
    
    partner = {
        "id": f"adv-partner-{uuid.uuid4().hex[:8]}",
        **partner_data,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.advisory_partners.insert_one({k: v for k, v in partner.items() if k != "_id"})
    
    return {"message": "Partner created", "partner_id": partner["id"]}


@router.put("/admin/partners/{partner_id}")
async def update_advisory_partner(partner_id: str, partner_data: dict):
    """Update an advisory partner"""
    db = get_db()
    
    partner_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    partner_data.pop("id", None)
    partner_data.pop("_id", None)
    
    result = await db.advisory_partners.update_one({"id": partner_id}, {"$set": partner_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"message": "Partner updated"}


@router.delete("/admin/partners/{partner_id}")
async def delete_advisory_partner(partner_id: str):
    """Delete an advisory partner"""
    db = get_db()
    
    result = await db.advisory_partners.delete_one({"id": partner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"message": "Partner deleted"}


# ==================== PRODUCTS ====================

@router.get("/products")
async def get_advisory_products(
    advisory_type: Optional[str] = None,
    in_stock: bool = True,
    limit: int = 50
):
    """Get advisory products from unified_products collection"""
    db = get_db()
    
    # Query unified_products with pillar="advisory"
    query = {"pillar": "advisory"}
    if advisory_type:
        query["category"] = advisory_type
    if in_stock:
        query["$or"] = [{"in_stock": True}, {"in_stock": {"$exists": False}}]
    
    products = await db.unified_products.find(query, {"_id": 0}).to_list(limit)
    total = await db.unified_products.count_documents(query)
    
    return {"products": products, "total": total}


@router.post("/admin/products")
async def create_advisory_product(product_data: dict):
    """Create a new advisory product"""
    db = get_db()
    
    product = {
        "id": f"adv-{uuid.uuid4().hex[:8]}",
        **product_data,
        "category": "advisory",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products_master.insert_one({k: v for k, v in product.items() if k != "_id"})
    
    return {"message": "Product created", "product_id": product["id"]}


# CSV Export/Import (Must come BEFORE {product_id} routes)

@router.get("/admin/products/export-csv")
async def export_advisory_products_csv():
    """Export advisory products to CSV"""
    db = get_db()
    
    products = await db.products_master.find({"pillar": "advisory"}).to_list(length=1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "id", "name", "description", "price", "original_price", "category",
        "advisory_type", "image", "tags", "in_stock", "paw_reward_points"
    ])
    
    for p in products:
        writer.writerow([
            p.get("id", ""),
            p.get("name", ""),
            p.get("description", ""),
            p.get("price", 0),
            p.get("original_price", ""),
            p.get("category", ""),
            p.get("advisory_type", ""),
            p.get("image", ""),
            "|".join(p.get("tags", [])),
            p.get("in_stock", True),
            p.get("paw_reward_points", 0)
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=advisory_products.csv"}
    )


@router.post("/admin/products/import-csv")
async def import_advisory_products_csv(file: UploadFile = File(...)):
    """Import advisory products from CSV"""
    db = get_db()
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    updated = 0
    
    for row in reader:
        product_id = row.get("id") or f"adv-{uuid.uuid4().hex[:8]}"
        
        product_doc = {
            "id": product_id,
            "pillar": "advisory",
            "name": row.get("name", ""),
            "description": row.get("description", ""),
            "price": float(row.get("price", 0)),
            "original_price": float(row["original_price"]) if row.get("original_price") else None,
            "category": row.get("category", "products"),
            "advisory_type": row.get("advisory_type", ""),
            "image": row.get("image", ""),
            "tags": row.get("tags", "").split("|") if row.get("tags") else [],
            "in_stock": row.get("in_stock", "true").lower() == "true",
            "paw_reward_points": int(row.get("paw_reward_points", 0)),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing = await db.products_master.find_one({"id": product_id})
        if existing:
            await db.products_master.update_one({"id": product_id}, {"$set": product_doc})
            updated += 1
        else:
            product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.products_master.insert_one(product_doc)
            imported += 1
    
    return {"message": f"Imported {imported} new, updated {updated} products"}


@router.put("/admin/products/{product_id}")
async def update_advisory_product(product_id: str, product_data: dict):
    """Update an advisory product"""
    db = get_db()
    
    product_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    product_data.pop("id", None)
    product_data.pop("_id", None)
    
    result = await db.products_master.update_one({"id": product_id}, {"$set": product_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def delete_advisory_product(product_id: str):
    """Delete an advisory product"""
    db = get_db()
    
    result = await db.products_master.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}


# ==================== BUNDLES ====================

@router.get("/bundles")
async def get_advisory_bundles(limit: int = 20):
    """Get advisory bundles"""
    db = get_db()
    
    bundles = await db.advisory_bundles.find({"is_active": True}, {"_id": 0}).to_list(limit)
    
    return {"bundles": bundles, "total": len(bundles)}


@router.post("/admin/bundles")
async def create_advisory_bundle(bundle_data: dict):
    """Create a new advisory bundle"""
    db = get_db()
    
    bundle = {
        "id": f"adv-bundle-{uuid.uuid4().hex[:8]}",
        **bundle_data,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.advisory_bundles.insert_one({k: v for k, v in bundle.items() if k != "_id"})
    
    return {"message": "Bundle created", "bundle_id": bundle["id"]}


# Bundle CSV Export/Import (Must come BEFORE {bundle_id} routes)

@router.get("/admin/bundles/export-csv")
async def export_advisory_bundles_csv():
    """Export advisory bundles to CSV"""
    db = get_db()
    
    bundles = await db.advisory_bundles.find({}).to_list(length=500)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "id", "name", "description", "price", "original_price", "items",
        "includes_consultation", "consultation_type", "is_recommended", "paw_reward_points"
    ])
    
    for b in bundles:
        writer.writerow([
            b.get("id", ""),
            b.get("name", ""),
            b.get("description", ""),
            b.get("price", 0),
            b.get("original_price", ""),
            "|".join(b.get("items", [])),
            b.get("includes_consultation", False),
            b.get("consultation_type", ""),
            b.get("is_recommended", True),
            b.get("paw_reward_points", 0)
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=advisory_bundles.csv"}
    )


@router.post("/admin/bundles/import-csv")
async def import_advisory_bundles_csv(file: UploadFile = File(...)):
    """Import advisory bundles from CSV"""
    db = get_db()
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    updated = 0
    
    for row in reader:
        bundle_id = row.get("id") or f"adv-bundle-{uuid.uuid4().hex[:8]}"
        
        bundle_doc = {
            "id": bundle_id,
            "pillar": "advisory",
            "name": row.get("name", ""),
            "description": row.get("description", ""),
            "price": float(row.get("price", 0)),
            "original_price": float(row["original_price"]) if row.get("original_price") else None,
            "items": row.get("items", "").split("|") if row.get("items") else [],
            "includes_consultation": row.get("includes_consultation", "false").lower() == "true",
            "consultation_type": row.get("consultation_type", ""),
            "is_recommended": row.get("is_recommended", "true").lower() == "true",
            "paw_reward_points": int(row.get("paw_reward_points", 0)),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing = await db.advisory_bundles.find_one({"id": bundle_id})
        if existing:
            await db.advisory_bundles.update_one({"id": bundle_id}, {"$set": bundle_doc})
            updated += 1
        else:
            bundle_doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.advisory_bundles.insert_one(bundle_doc)
            imported += 1
    
    return {"message": f"Imported {imported} new, updated {updated} bundles"}


@router.put("/admin/bundles/{bundle_id}")
async def update_advisory_bundle(bundle_id: str, bundle_data: dict):
    """Update an advisory bundle"""
    db = get_db()
    
    bundle_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    bundle_data.pop("id", None)
    bundle_data.pop("_id", None)
    
    result = await db.advisory_bundles.update_one({"id": bundle_id}, {"$set": bundle_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle updated"}


@router.delete("/admin/bundles/{bundle_id}")
async def delete_advisory_bundle(bundle_id: str):
    """Delete an advisory bundle"""
    db = get_db()
    
    result = await db.advisory_bundles.delete_one({"id": bundle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle deleted"}


# ==================== SETTINGS ====================

@router.get("/admin/settings")
async def get_advisory_settings():
    """Get advisory pillar settings"""
    db = get_db()
    
    settings = await db.app_settings.find_one({"key": "advisory_settings"}, {"_id": 0})
    
    if not settings:
        return {
            "paw_rewards": {
                "enabled": True,
                "points_per_consultation": 50,
                "points_per_follow_up": 25
            },
            "birthday_perks": {
                "enabled": True,
                "discount_percent": 20,
                "free_consultation_types": ["health"]
            },
            "notifications": {
                "email_enabled": True,
                "sms_enabled": False,
                "reminder_hours_before": 24,
                "follow_up_days_after": 7
            },
            "service_desk": {
                "auto_create_ticket": True,
                "default_priority": "normal",
                "escalation_hours": 24
            },
            "consultation_settings": {
                "video_call_enabled": True,
                "phone_call_enabled": True,
                "chat_enabled": True,
                "in_person_enabled": True,
                "default_duration_minutes": 30
            }
        }
    
    return settings.get("value", {})


@router.put("/admin/settings")
async def update_advisory_settings(settings: Dict[str, Any]):
    """Update advisory settings"""
    db = get_db()
    
    await db.app_settings.update_one(
        {"key": "advisory_settings"},
        {"$set": {"key": "advisory_settings", "value": settings, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "message": "Settings updated"}


# ==================== STATS ====================

@router.get("/admin/stats")
async def get_advisory_stats():
    """Get advisory pillar statistics"""
    db = get_db()
    
    total_requests = await db.advisory_requests.count_documents({})
    pending_requests = await db.advisory_requests.count_documents({"status": "pending"})
    scheduled_requests = await db.advisory_requests.count_documents({"status": "scheduled"})
    completed_requests = await db.advisory_requests.count_documents({"status": "completed"})
    
    # By type
    type_breakdown = {}
    for adv_type in ADVISORY_TYPES.keys():
        type_breakdown[adv_type] = await db.advisory_requests.count_documents({"advisory_type": adv_type})
    
    # By severity
    severity_breakdown = {}
    for severity in ["mild", "moderate", "severe", "urgent"]:
        severity_breakdown[severity] = await db.advisory_requests.count_documents({"severity": severity})
    
    total_partners = await db.advisory_partners.count_documents({"is_active": True})
    total_products = await db.products_master.count_documents({"category": "advisory"})
    total_bundles = await db.advisory_bundles.count_documents({"is_active": True})
    
    return {
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "scheduled_requests": scheduled_requests,
        "completed_requests": completed_requests,
        "by_type": type_breakdown,
        "by_severity": severity_breakdown,
        "total_partners": total_partners,
        "total_products": total_products,
        "total_bundles": total_bundles
    }


# ==================== CONFIG ====================

@router.get("/types")
async def get_advisory_types():
    """Get available advisory types"""
    return {
        "advisory_types": ADVISORY_TYPES,
        "consultation_formats": CONSULTATION_FORMATS
    }


@router.get("/config")
async def get_advisory_config():
    """Get advisory pillar configuration for frontend"""
    db = get_db()
    
    advisor_count = await db.advisory_partners.count_documents({"is_active": True})
    product_count = await db.products_master.count_documents({"category": "advisory"})
    
    return {
        "advisory_types": ADVISORY_TYPES,
        "consultation_formats": CONSULTATION_FORMATS,
        "advisor_count": advisor_count,
        "product_count": product_count,
        "enabled": True
    }


# ==================== SEED DATA ====================

@router.post("/admin/seed")
async def seed_advisory_data():
    """Seed advisory pillar with sample data"""
    db = get_db()
    
    # Sample Advisory Partners
    default_partners = [
        {
            "id": "adv-partner-behaviour",
            "name": "Dr. Priya Sharma - Pet Behaviourist",
            "partner_type": "behaviourist",
            "specialties": ["behaviour", "training", "anxiety"],
            "description": "Certified animal behaviourist with 15+ years experience. Specializes in anxiety, aggression, and fear-based behaviours.",
            "qualifications": ["PhD in Animal Behaviour", "Certified Applied Animal Behaviourist"],
            "contact_name": "Dr. Priya Sharma",
            "contact_email": "priya@petbehaviour.in",
            "contact_phone": "+91 98765 43210",
            "cities": ["Mumbai", "Pune"],
            "consultation_fee": 2500,
            "rating": 4.9,
            "reviews_count": 234,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "adv-partner-nutrition",
            "name": "PetNutri Experts",
            "partner_type": "nutritionist",
            "specialties": ["nutrition", "senior_care", "health"],
            "description": "Team of certified pet nutritionists providing custom diet plans and weight management programs.",
            "qualifications": ["Certified Pet Nutritionist", "Veterinary Nutrition Specialist"],
            "contact_name": "Dr. Rahul Mehta",
            "contact_email": "consult@petnutri.in",
            "contact_phone": "+91 87654 32109",
            "cities": ["Mumbai", "Delhi", "Bangalore"],
            "consultation_fee": 1500,
            "rating": 4.8,
            "reviews_count": 189,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "adv-partner-senior",
            "name": "Golden Paws Senior Care",
            "partner_type": "senior_specialist",
            "specialties": ["senior_care", "health", "nutrition"],
            "description": "Specialists in senior pet care, mobility support, and quality of life planning.",
            "qualifications": ["Veterinary Geriatrics Certification", "Palliative Care Specialist"],
            "contact_name": "Dr. Anjali Nair",
            "contact_email": "care@goldenpaws.in",
            "contact_phone": "+91 76543 21098",
            "cities": ["Bangalore", "Chennai", "Hyderabad"],
            "consultation_fee": 2000,
            "rating": 4.9,
            "reviews_count": 156,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "adv-partner-training",
            "name": "Pawsitive Training Academy",
            "partner_type": "trainer",
            "specialties": ["training", "behaviour", "new_pet"],
            "description": "Force-free training experts. Puppy training, obedience, and behavioural modification.",
            "qualifications": ["Certified Professional Dog Trainer", "Fear Free Certified"],
            "contact_name": "Vikram Singh",
            "contact_email": "train@pawsitive.in",
            "contact_phone": "+91 65432 10987",
            "cities": ["Delhi", "Gurgaon", "Noida"],
            "consultation_fee": 1800,
            "rating": 4.7,
            "reviews_count": 312,
            "is_featured": False,
            "is_active": True
        }
    ]
    
    # Sample Products
    default_products = [
        {
            "id": "adv-anxiety-kit",
            "name": "Anxiety Relief Kit",
            "description": "Complete kit with calming treats, anxiety wrap, and pheromone diffuser for anxious pets.",
            "price": 2499,
            "compare_price": 2999,
            "category": "advisory",
            "advisory_type": "behaviour",
            "tags": ["advisory", "anxiety", "calming", "behaviour"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 30,
            "is_birthday_perk": False
        },
        {
            "id": "adv-nutrition-guide",
            "name": "Pet Nutrition Guide Book",
            "description": "Comprehensive guide to pet nutrition with recipes, portion guides, and ingredient information.",
            "price": 699,
            "compare_price": 899,
            "category": "advisory",
            "advisory_type": "nutrition",
            "tags": ["advisory", "nutrition", "guide", "book"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        },
        {
            "id": "adv-senior-comfort",
            "name": "Senior Pet Comfort Package",
            "description": "Orthopedic bed, joint supplements, and heated pad for senior pet comfort.",
            "price": 4999,
            "compare_price": 5999,
            "category": "advisory",
            "advisory_type": "senior_care",
            "tags": ["advisory", "senior", "comfort", "joint"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 60,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        },
        {
            "id": "adv-puppy-starter",
            "name": "New Puppy Starter Kit",
            "description": "Everything for new puppy parents: training pads, treats, toys, and guide book.",
            "price": 1999,
            "compare_price": 2499,
            "category": "advisory",
            "advisory_type": "new_pet",
            "tags": ["advisory", "puppy", "starter", "new_pet"],
            "pet_sizes": ["small", "medium"],
            "in_stock": True,
            "paw_reward_points": 25,
            "is_birthday_perk": False
        },
        {
            "id": "adv-health-monitor",
            "name": "Pet Health Monitor",
            "description": "Smart collar attachment that tracks activity, sleep, and vitals. Syncs with app.",
            "price": 3999,
            "compare_price": 4999,
            "category": "advisory",
            "advisory_type": "health",
            "tags": ["advisory", "health", "monitor", "smart"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 50,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "adv-training-kit",
            "name": "Home Training Essentials Kit",
            "description": "Clicker, treat pouch, target stick, and training guide for effective home training.",
            "price": 1299,
            "compare_price": 1599,
            "category": "advisory",
            "advisory_type": "training",
            "tags": ["advisory", "training", "kit", "clicker"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 15,
            "is_birthday_perk": False
        },
        {
            "id": "adv-calming-diffuser",
            "name": "Pheromone Calming Diffuser",
            "description": "Plug-in diffuser with calming pheromones. Covers up to 700 sq ft. 30-day supply.",
            "price": 899,
            "compare_price": 1099,
            "category": "advisory",
            "advisory_type": "behaviour",
            "tags": ["advisory", "calming", "pheromone", "anxiety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 12,
            "is_birthday_perk": False
        },
        {
            "id": "adv-weight-scale",
            "name": "Pet Weight Management Scale",
            "description": "Digital scale with memory function and mobile app sync. Track weight trends.",
            "price": 2499,
            "compare_price": 2999,
            "category": "advisory",
            "advisory_type": "nutrition",
            "tags": ["advisory", "weight", "scale", "nutrition"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 30,
            "is_birthday_perk": False
        },
        {
            "id": "adv-mobility-ramp",
            "name": "Senior Pet Mobility Ramp",
            "description": "Foldable ramp for beds, sofas, and cars. Non-slip surface. Supports up to 50kg.",
            "price": 3499,
            "compare_price": 3999,
            "category": "advisory",
            "advisory_type": "senior_care",
            "tags": ["advisory", "senior", "mobility", "ramp"],
            "pet_sizes": ["medium", "large"],
            "in_stock": True,
            "paw_reward_points": 40,
            "is_birthday_perk": False
        },
        {
            "id": "adv-enrichment-toys",
            "name": "Mental Enrichment Toy Set",
            "description": "Set of 5 puzzle toys to keep pets mentally stimulated. Great for behaviour issues.",
            "price": 1499,
            "compare_price": 1899,
            "category": "advisory",
            "advisory_type": "behaviour",
            "tags": ["advisory", "enrichment", "puzzle", "toys"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 18,
            "is_birthday_perk": True,
            "birthday_discount_percent": 25
        },
        {
            "id": "adv-first-aid-kit",
            "name": "Pet First Aid Kit",
            "description": "Complete first aid kit with bandages, antiseptic, thermometer, and emergency guide.",
            "price": 1199,
            "compare_price": 1499,
            "category": "advisory",
            "advisory_type": "health",
            "tags": ["advisory", "first_aid", "health", "emergency"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 15,
            "is_birthday_perk": False
        },
        {
            "id": "adv-kitten-starter",
            "name": "New Kitten Starter Kit",
            "description": "Essential kit for new kitten parents: litter supplies, toys, scratching post, and guide.",
            "price": 1799,
            "compare_price": 2199,
            "category": "advisory",
            "advisory_type": "new_pet",
            "tags": ["advisory", "kitten", "starter", "new_pet", "cat"],
            "pet_sizes": ["small"],
            "in_stock": True,
            "paw_reward_points": 22,
            "is_birthday_perk": False
        }
    ]
    
    # Sample Bundles
    default_bundles = [
        {
            "id": "adv-bundle-behaviour",
            "name": "Complete Behaviour Support Bundle",
            "description": "Everything for behaviour issues: anxiety kit, enrichment toys, calming diffuser, and one behaviour consultation.",
            "items": ["adv-anxiety-kit", "adv-enrichment-toys", "adv-calming-diffuser"],
            "includes_consultation": True,
            "consultation_type": "behaviour",
            "price": 5499,
            "original_price": 6497,
            "paw_reward_points": 80,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15,
            "is_active": True
        },
        {
            "id": "adv-bundle-nutrition",
            "name": "Nutrition & Weight Management Bundle",
            "description": "Complete nutrition support: weight scale, nutrition guide, and one nutrition consultation.",
            "items": ["adv-weight-scale", "adv-nutrition-guide"],
            "includes_consultation": True,
            "consultation_type": "nutrition",
            "price": 3999,
            "original_price": 4698,
            "paw_reward_points": 55,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "adv-bundle-senior",
            "name": "Senior Pet Care Bundle",
            "description": "Complete senior care: comfort package, mobility ramp, and senior care consultation.",
            "items": ["adv-senior-comfort", "adv-mobility-ramp"],
            "includes_consultation": True,
            "consultation_type": "senior_care",
            "price": 8999,
            "original_price": 10498,
            "paw_reward_points": 120,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20,
            "is_active": True
        },
        {
            "id": "adv-bundle-new-pet",
            "name": "New Pet Parent Bundle",
            "description": "Everything new pet parents need: starter kit, training essentials, and new pet guidance consultation.",
            "items": ["adv-puppy-starter", "adv-training-kit"],
            "includes_consultation": True,
            "consultation_type": "new_pet",
            "price": 3499,
            "original_price": 4098,
            "paw_reward_points": 50,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "adv-bundle-health",
            "name": "Proactive Health Bundle",
            "description": "Stay on top of pet health: health monitor, first aid kit, and health advisory consultation.",
            "items": ["adv-health-monitor", "adv-first-aid-kit"],
            "includes_consultation": True,
            "consultation_type": "health",
            "price": 5499,
            "original_price": 6698,
            "paw_reward_points": 75,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        }
    ]
    
    # Insert data
    for partner in default_partners:
        partner["created_at"] = datetime.now(timezone.utc).isoformat()
        partner["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.advisory_partners.update_one({"id": partner["id"]}, {"$set": partner}, upsert=True)
    
    for product in default_products:
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        product["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products_master.update_one({"id": product["id"]}, {"$set": product}, upsert=True)
    
    for bundle in default_bundles:
        bundle["created_at"] = datetime.now(timezone.utc).isoformat()
        bundle["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.advisory_bundles.update_one({"id": bundle["id"]}, {"$set": bundle}, upsert=True)
    
    logger.info(f"Seeded ADVISORY pillar: {len(default_partners)} partners, {len(default_products)} products, {len(default_bundles)} bundles")
    
    return {
        "message": "ADVISORY pillar data seeded successfully",
        "partners_seeded": len(default_partners),
        "products_seeded": len(default_products),
        "bundles_seeded": len(default_bundles)
    }


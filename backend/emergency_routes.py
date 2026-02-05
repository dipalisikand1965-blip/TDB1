"""
EMERGENCY Pillar Routes - Pet Emergency Services & Lost Pet Recovery
High-priority request routing, lost pet workflows, urgent vet coordination
Complete CRUD with Service Desk, Notifications, and Pet Soul integration
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

router = APIRouter(prefix="/api/emergency", tags=["emergency"])

def get_db():
    from server import db
    return db


# Emergency Types with priorities
EMERGENCY_TYPES = {
    "lost_pet": {
        "name": "Lost Pet Alert",
        "icon": "Search",
        "description": "Immediate lost pet alerts and recovery coordination",
        "color": "from-red-600 to-rose-700",
        "priority": "critical",
        "sla_hours": 1
    },
    "medical_emergency": {
        "name": "Medical Emergency",
        "icon": "AlertTriangle",
        "description": "Urgent medical situations requiring immediate vet coordination",
        "color": "from-red-500 to-orange-600",
        "priority": "critical",
        "sla_hours": 1
    },
    "accident_injury": {
        "name": "Accident & Injury",
        "icon": "Ambulance",
        "description": "Pet injuries from accidents, falls, or encounters",
        "color": "from-orange-500 to-amber-600",
        "priority": "high",
        "sla_hours": 2
    },
    "poisoning": {
        "name": "Poisoning / Ingestion",
        "icon": "Skull",
        "description": "Suspected poisoning or ingestion of harmful substances",
        "color": "from-purple-600 to-violet-700",
        "priority": "critical",
        "sla_hours": 1
    },
    "breathing_distress": {
        "name": "Breathing Difficulty",
        "icon": "Wind",
        "description": "Respiratory distress, choking, or breathing issues",
        "color": "from-blue-600 to-cyan-600",
        "priority": "critical",
        "sla_hours": 1
    },
    "found_pet": {
        "name": "Found Pet Report",
        "icon": "Heart",
        "description": "Report a found pet to help reunite with owner",
        "color": "from-green-500 to-emerald-600",
        "priority": "high",
        "sla_hours": 4
    },
    "natural_disaster": {
        "name": "Natural Disaster",
        "icon": "CloudLightning",
        "description": "Pet safety during floods, earthquakes, fires, storms",
        "color": "from-slate-600 to-gray-700",
        "priority": "high",
        "sla_hours": 2
    },
    "aggressive_animal": {
        "name": "Aggressive Animal",
        "icon": "ShieldAlert",
        "description": "Encounter with aggressive stray or wild animal",
        "color": "from-amber-600 to-yellow-600",
        "priority": "high",
        "sla_hours": 2
    }
}

# Emergency Severity Levels
SEVERITY_LEVELS = [
    {"id": "critical", "name": "Critical - Life Threatening", "color": "bg-red-600", "response_time": "Immediate"},
    {"id": "urgent", "name": "Urgent - Needs Help Fast", "color": "bg-orange-500", "response_time": "Within 30 mins"},
    {"id": "high", "name": "High - Serious Concern", "color": "bg-amber-500", "response_time": "Within 1 hour"},
    {"id": "moderate", "name": "Moderate - Need Guidance", "color": "bg-yellow-500", "response_time": "Within 4 hours"}
]


# ==================== EMERGENCY REQUESTS ====================

@router.post("/request")
async def create_emergency_request(request_data: dict):
    """Create a new emergency request with high-priority Service Desk integration"""
    db = get_db()
    
    request_id = f"EMRG-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    emergency_type = request_data.get("emergency_type", "medical_emergency")
    type_info = EMERGENCY_TYPES.get(emergency_type, {})
    
    emergency_request = {
        "id": request_id,
        "request_id": request_id,
        "emergency_type": emergency_type,
        "status": "active",  # active, responding, resolved, closed
        "priority": type_info.get("priority", "high"),
        "severity": request_data.get("severity", "urgent"),
        
        # Pet Details
        "pet_id": request_data.get("pet_id"),
        "pet_name": request_data.get("pet_name"),
        "pet_breed": request_data.get("pet_breed"),
        "pet_age": request_data.get("pet_age"),
        "pet_species": request_data.get("pet_species", "dog"),
        "pet_photo": request_data.get("pet_photo"),
        "pet_description": request_data.get("pet_description", ""),
        "microchip_number": request_data.get("microchip_number"),
        
        # User Details
        "user_id": request_data.get("user_id"),
        "user_name": request_data.get("user_name"),
        "user_email": request_data.get("user_email"),
        "user_phone": request_data.get("user_phone"),
        
        # Location Details (critical for emergencies)
        "location": request_data.get("location", ""),
        "city": request_data.get("city", ""),
        "coordinates": request_data.get("coordinates"),  # {lat, lng}
        "landmark": request_data.get("landmark", ""),
        
        # Emergency Details
        "description": request_data.get("description", ""),
        "symptoms": request_data.get("symptoms", []),
        "situation_details": request_data.get("situation_details", ""),
        "immediate_needs": request_data.get("immediate_needs", []),
        
        # For Lost Pet
        "last_seen_location": request_data.get("last_seen_location"),
        "last_seen_time": request_data.get("last_seen_time"),
        "distinctive_features": request_data.get("distinctive_features", ""),
        "reward_offered": request_data.get("reward_offered", False),
        "reward_amount": request_data.get("reward_amount"),
        
        # For Found Pet
        "found_location": request_data.get("found_location"),
        "found_time": request_data.get("found_time"),
        "pet_condition": request_data.get("pet_condition"),
        "found_by_name": request_data.get("found_by_name"),
        "found_by_phone": request_data.get("found_by_phone"),
        
        # Response Info
        "assigned_to": None,
        "responders": [],
        "vet_contacted": False,
        "vet_details": None,
        "ambulance_dispatched": False,
        "notes": request_data.get("notes", ""),
        
        # Tracking
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "response_started_at": None,
        "resolved_at": None,
        "resolution_notes": ""
    }
    
    await db.emergency_requests.insert_one({k: v for k, v in emergency_request.items() if k != "_id"})
    
    # Create HIGH PRIORITY Service Desk Ticket
    ticket_priority = "urgent" if emergency_request["severity"] in ["critical", "urgent"] else "high"
    
    ticket = {
        "id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "source": "emergency_pillar",
        "source_id": request_id,
        "category": "emergency",
        "subcategory": emergency_type,
        "subject": f"🚨 EMERGENCY: {type_info.get('name', emergency_type)} - {emergency_request['pet_name']}",
        "description": f"URGENT: {emergency_request['description']}\n\nLocation: {emergency_request['location']}\nPhone: {emergency_request['user_phone']}\n\nPet: {emergency_request['pet_name']} ({emergency_request['pet_breed']})",
        "status": "open",
        "priority": ticket_priority,
        "urgency": "critical" if emergency_request["severity"] == "critical" else "high",
        "customer_name": emergency_request["user_name"],
        "customer_email": emergency_request["user_email"],
        "customer_phone": emergency_request["user_phone"],
        "pet_name": emergency_request["pet_name"],
        "pet_id": emergency_request["pet_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "tags": ["emergency", emergency_type, "urgent", emergency_request["severity"]],
        "pillar": "emergency",
        "sla_deadline": datetime.now(timezone.utc).isoformat(),  # Immediate SLA
        "is_emergency": True
    }
    
    await db.tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    
    # Add to Unified Inbox with CRITICAL flag
    inbox_item = {
        "id": f"INB-{uuid.uuid4().hex[:8].upper()}",
        "type": "emergency_request",
        "source": "emergency_pillar",
        "reference_id": request_id,
        "ticket_id": ticket["id"],
        "title": f"🚨 EMERGENCY: {type_info.get('name', emergency_type)}",
        "preview": f"{emergency_request['pet_name']} - {emergency_request['description'][:80]}...",
        "customer_name": emergency_request["user_name"],
        "customer_email": emergency_request["user_email"],
        "customer_phone": emergency_request["user_phone"],
        "pet_name": emergency_request["pet_name"],
        "status": "unread",
        "priority": "critical",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "pillar": "emergency",
        "is_emergency": True
    }
    
    await db.unified_inbox.insert_one({k: v for k, v in inbox_item.items() if k != "_id"})
    
    # Create CRITICAL admin notification
    notification = {
        "id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "type": "emergency_alert",
        "title": f"🚨 EMERGENCY: {type_info.get('name', emergency_type)}",
        "message": f"URGENT: {emergency_request['user_name']} needs help with {emergency_request['pet_name']}. {emergency_request['description'][:100]}",
        "category": "emergency",
        "priority": "critical",
        "related_id": request_id,
        "link_to": f"/admin?tab=emergency&request={request_id}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_emergency": True,
        "sound_alert": True
    }
    await db.admin_notifications.insert_one({k: v for k, v in notification.items() if k != "_id"})
    
    # Update Pet Soul with emergency info
    if emergency_request["pet_id"]:
        await db.pets.update_one(
            {"id": emergency_request["pet_id"]},
            {
                "$push": {
                    "soul.emergencies": {
                        "emergency_id": request_id,
                        "type": emergency_type,
                        "severity": emergency_request["severity"],
                        "date": datetime.now(timezone.utc).isoformat(),
                        "resolved": False
                    }
                },
                "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
            }
        )
    
    logger.info(f"🚨 EMERGENCY request {request_id} created - Type: {emergency_type}, Severity: {emergency_request['severity']}")
    
    return {
        "message": "Emergency request submitted. Our team is being notified immediately.",
        "request_id": request_id,
        "ticket_id": ticket["id"],
        "priority": ticket_priority,
        "expected_response": type_info.get("sla_hours", 1)
    }


@router.get("/requests")
async def get_emergency_requests(
    status: Optional[str] = None,
    emergency_type: Optional[str] = None,
    severity: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 50
):
    """Get all emergency requests"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if emergency_type:
        query["emergency_type"] = emergency_type
    if severity:
        query["severity"] = severity
    if city:
        query["city"] = city
    
    requests = await db.emergency_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    return {"requests": requests, "total": len(requests)}


@router.get("/requests/{request_id}")
async def get_emergency_request(request_id: str):
    """Get a specific emergency request"""
    db = get_db()
    
    request = await db.emergency_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    
    return request


@router.put("/requests/{request_id}")
async def update_emergency_request(request_id: str, update_data: dict):
    """Update an emergency request"""
    db = get_db()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data.pop("id", None)
    update_data.pop("_id", None)
    
    # Track status changes
    if "status" in update_data:
        if update_data["status"] == "responding" and "response_started_at" not in update_data:
            update_data["response_started_at"] = datetime.now(timezone.utc).isoformat()
        elif update_data["status"] in ["resolved", "closed"]:
            update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.emergency_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Emergency request not found")
    
    # Update linked ticket status
    if "status" in update_data:
        ticket_status_map = {
            "active": "open",
            "responding": "in_progress",
            "resolved": "resolved",
            "closed": "closed"
        }
        new_ticket_status = ticket_status_map.get(update_data["status"])
        if new_ticket_status:
            await db.tickets.update_one(
                {"source_id": request_id},
                {"$set": {"status": new_ticket_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    # Update Pet Soul if resolved
    if update_data.get("status") in ["resolved", "closed"]:
        request = await db.emergency_requests.find_one({"id": request_id}, {"_id": 0})
        if request and request.get("pet_id"):
            await db.pets.update_one(
                {"id": request["pet_id"], "soul.emergencies.emergency_id": request_id},
                {"$set": {"soul.emergencies.$.resolved": True}}
            )
    
    return {"message": "Emergency request updated"}


# ==================== EMERGENCY CONTACTS ====================

@router.post("/contacts")
async def create_emergency_contact(contact_data: dict):
    """Create an emergency contact for a pet"""
    db = get_db()
    
    contact_id = f"EMRG-CONTACT-{uuid.uuid4().hex[:8].upper()}"
    
    contact = {
        "id": contact_id,
        "pet_id": contact_data.get("pet_id"),
        "user_id": contact_data.get("user_id"),
        "contact_type": contact_data.get("contact_type", "secondary_owner"),  # secondary_owner, emergency_contact, vet, neighbor
        "name": contact_data.get("name"),
        "phone": contact_data.get("phone"),
        "email": contact_data.get("email"),
        "relationship": contact_data.get("relationship"),
        "is_primary": contact_data.get("is_primary", False),
        "can_make_decisions": contact_data.get("can_make_decisions", False),
        "notes": contact_data.get("notes", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.emergency_contacts.insert_one({k: v for k, v in contact.items() if k != "_id"})
    
    # Update Pet Soul
    await db.pets.update_one(
        {"id": contact_data.get("pet_id")},
        {
            "$push": {
                "soul.emergency_contacts": {
                    "contact_id": contact_id,
                    "name": contact["name"],
                    "phone": contact["phone"],
                    "type": contact["contact_type"]
                }
            }
        }
    )
    
    return {"message": "Emergency contact added", "contact_id": contact_id}


@router.get("/contacts/{pet_id}")
async def get_emergency_contacts(pet_id: str):
    """Get all emergency contacts for a pet"""
    db = get_db()
    
    contacts = await db.emergency_contacts.find(
        {"pet_id": pet_id},
        {"_id": 0}
    ).to_list(20)
    
    return {"contacts": contacts, "total": len(contacts)}


@router.delete("/contacts/{contact_id}")
async def delete_emergency_contact(contact_id: str):
    """Delete an emergency contact"""
    db = get_db()
    
    contact = await db.emergency_contacts.find_one({"id": contact_id}, {"_id": 0})
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    await db.emergency_contacts.delete_one({"id": contact_id})
    
    # Remove from Pet Soul
    await db.pets.update_one(
        {"id": contact["pet_id"]},
        {"$pull": {"soul.emergency_contacts": {"contact_id": contact_id}}}
    )
    
    return {"message": "Contact deleted"}


# ==================== EMERGENCY VETS ====================

@router.get("/vets")
async def get_emergency_vets(
    city: Optional[str] = None,
    is_24hr: bool = False,
    limit: int = 50
):
    """Get emergency vet partners"""
    db = get_db()
    
    query = {"is_active": True}
    if city:
        query["cities"] = {"$in": [city]}
    if is_24hr:
        query["is_24hr"] = True
    
    vets = await db.emergency_partners.find(query, {"_id": 0}).sort("rating", -1).to_list(limit)
    
    return {"vets": vets, "total": len(vets)}


@router.get("/admin/partners")
async def get_emergency_partners(is_active: bool = True):
    """Get all emergency partners (admin)"""
    db = get_db()
    
    query = {}
    if is_active:
        query["is_active"] = True
    
    partners = await db.emergency_partners.find(query, {"_id": 0}).to_list(100)
    
    return {"partners": partners, "total": len(partners)}


@router.post("/admin/partners")
async def create_emergency_partner(partner_data: dict):
    """Create a new emergency partner"""
    db = get_db()
    
    partner = {
        "id": f"emrg-partner-{uuid.uuid4().hex[:8]}",
        **partner_data,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.emergency_partners.insert_one({k: v for k, v in partner.items() if k != "_id"})
    
    return {"message": "Partner created", "partner_id": partner["id"]}


@router.put("/admin/partners/{partner_id}")
async def update_emergency_partner(partner_id: str, partner_data: dict):
    """Update an emergency partner"""
    db = get_db()
    
    partner_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    partner_data.pop("id", None)
    partner_data.pop("_id", None)
    
    result = await db.emergency_partners.update_one({"id": partner_id}, {"$set": partner_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"message": "Partner updated"}


@router.delete("/admin/partners/{partner_id}")
async def delete_emergency_partner(partner_id: str):
    """Delete an emergency partner"""
    db = get_db()
    
    result = await db.emergency_partners.delete_one({"id": partner_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return {"message": "Partner deleted"}


# ==================== PRODUCTS ====================

@router.get("/products")
async def get_emergency_products(
    product_type: Optional[str] = None,
    in_stock: bool = True,
    limit: int = 50
):
    """Get emergency products from unified_products collection"""
    db = get_db()
    
    query = {"pillar": "emergency"}
    if product_type:
        query["category"] = product_type
    if in_stock:
        query["$or"] = [{"in_stock": True}, {"in_stock": {"$exists": False}}]
    
    products = await db.unified_products.find(query, {"_id": 0}).to_list(limit)
    total = await db.unified_products.count_documents(query)
    
    return {"products": products, "total": total}


@router.post("/admin/products")
async def create_emergency_product(product_data: dict):
    """Create a new emergency product"""
    db = get_db()
    
    product = {
        "id": f"emrg-{uuid.uuid4().hex[:8]}",
        **product_data,
        "category": "emergency",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products_master.insert_one({k: v for k, v in product.items() if k != "_id"})
    
    return {"message": "Product created", "product_id": product["id"]}


# Product CSV Export/Import (Must come BEFORE {product_id} routes)

@router.get("/admin/products/export-csv")
async def export_emergency_products_csv():
    """Export emergency products to CSV"""
    db = get_db()
    
    products = await db.emergency_products.find({}).to_list(length=1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "id", "name", "description", "price", "original_price", "category",
        "emergency_type", "image", "tags", "in_stock", "paw_reward_points", "priority"
    ])
    
    for p in products:
        writer.writerow([
            p.get("id", ""),
            p.get("name", ""),
            p.get("description", ""),
            p.get("price", 0),
            p.get("original_price", ""),
            p.get("category", ""),
            p.get("emergency_type", ""),
            p.get("image", ""),
            "|".join(p.get("tags", [])),
            p.get("in_stock", True),
            p.get("paw_reward_points", 0),
            p.get("priority", "normal")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=emergency_products.csv"}
    )


@router.post("/admin/products/import-csv")
async def import_emergency_products_csv(file: UploadFile = File(...)):
    """Import emergency products from CSV"""
    db = get_db()
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    updated = 0
    
    for row in reader:
        product_id = row.get("id") or f"emg-{uuid.uuid4().hex[:8]}"
        
        product_doc = {
            "id": product_id,
            "pillar": "emergency",
            "name": row.get("name", ""),
            "description": row.get("description", ""),
            "price": float(row.get("price", 0)),
            "original_price": float(row["original_price"]) if row.get("original_price") else None,
            "category": row.get("category", "products"),
            "emergency_type": row.get("emergency_type", ""),
            "image": row.get("image", ""),
            "tags": row.get("tags", "").split("|") if row.get("tags") else [],
            "in_stock": row.get("in_stock", "true").lower() == "true",
            "paw_reward_points": int(row.get("paw_reward_points", 0)),
            "priority": row.get("priority", "normal"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing = await db.emergency_products.find_one({"id": product_id})
        if existing:
            await db.emergency_products.update_one({"id": product_id}, {"$set": product_doc})
            updated += 1
        else:
            product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.emergency_products.insert_one(product_doc)
            imported += 1
    
    return {"message": f"Imported {imported} new, updated {updated} products"}


@router.put("/admin/products/{product_id}")
async def update_emergency_product(product_id: str, product_data: dict):
    """Update an emergency product"""
    db = get_db()
    
    product_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    product_data.pop("id", None)
    product_data.pop("_id", None)
    
    result = await db.products_master.update_one({"id": product_id}, {"$set": product_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def delete_emergency_product(product_id: str):
    """Delete an emergency product"""
    db = get_db()
    
    result = await db.products_master.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}


# ==================== BUNDLES ====================

@router.get("/bundles")
async def get_emergency_bundles(limit: int = 20):
    """Get emergency bundles"""
    db = get_db()
    
    bundles = await db.emergency_bundles.find({"is_active": True}, {"_id": 0}).to_list(limit)
    
    return {"bundles": bundles, "total": len(bundles)}


@router.post("/admin/bundles")
async def create_emergency_bundle(bundle_data: dict):
    """Create a new emergency bundle"""
    db = get_db()
    
    bundle = {
        "id": f"emrg-bundle-{uuid.uuid4().hex[:8]}",
        **bundle_data,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.emergency_bundles.insert_one({k: v for k, v in bundle.items() if k != "_id"})
    
    return {"message": "Bundle created", "bundle_id": bundle["id"]}


# Bundle CSV Export/Import (Must come BEFORE {bundle_id} routes)

@router.get("/admin/bundles/export-csv")
async def export_emergency_bundles_csv():
    """Export emergency bundles to CSV"""
    db = get_db()
    
    bundles = await db.emergency_bundles.find({}).to_list(length=500)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "id", "name", "description", "price", "original_price", "items",
        "emergency_type", "is_recommended", "paw_reward_points", "priority"
    ])
    
    for b in bundles:
        writer.writerow([
            b.get("id", ""),
            b.get("name", ""),
            b.get("description", ""),
            b.get("price", 0),
            b.get("original_price", ""),
            "|".join(b.get("items", [])),
            b.get("emergency_type", ""),
            b.get("is_recommended", True),
            b.get("paw_reward_points", 0),
            b.get("priority", "normal")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=emergency_bundles.csv"}
    )


@router.post("/admin/bundles/import-csv")
async def import_emergency_bundles_csv(file: UploadFile = File(...)):
    """Import emergency bundles from CSV"""
    db = get_db()
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    updated = 0
    
    for row in reader:
        bundle_id = row.get("id") or f"emg-bundle-{uuid.uuid4().hex[:8]}"
        
        bundle_doc = {
            "id": bundle_id,
            "pillar": "emergency",
            "name": row.get("name", ""),
            "description": row.get("description", ""),
            "price": float(row.get("price", 0)),
            "original_price": float(row["original_price"]) if row.get("original_price") else None,
            "items": row.get("items", "").split("|") if row.get("items") else [],
            "emergency_type": row.get("emergency_type", ""),
            "is_recommended": row.get("is_recommended", "true").lower() == "true",
            "paw_reward_points": int(row.get("paw_reward_points", 0)),
            "priority": row.get("priority", "normal"),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing = await db.emergency_bundles.find_one({"id": bundle_id})
        if existing:
            await db.emergency_bundles.update_one({"id": bundle_id}, {"$set": bundle_doc})
            updated += 1
        else:
            bundle_doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.emergency_bundles.insert_one(bundle_doc)
            imported += 1
    
    return {"message": f"Imported {imported} new, updated {updated} bundles"}


@router.put("/admin/bundles/{bundle_id}")
async def update_emergency_bundle(bundle_id: str, bundle_data: dict):
    """Update an emergency bundle"""
    db = get_db()
    
    bundle_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    bundle_data.pop("id", None)
    bundle_data.pop("_id", None)
    
    result = await db.emergency_bundles.update_one({"id": bundle_id}, {"$set": bundle_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle updated"}


@router.delete("/admin/bundles/{bundle_id}")
async def delete_emergency_bundle(bundle_id: str):
    """Delete an emergency bundle"""
    db = get_db()
    
    result = await db.emergency_bundles.delete_one({"id": bundle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle deleted"}


# ==================== SETTINGS ====================

@router.get("/admin/settings")
async def get_emergency_settings():
    """Get emergency pillar settings"""
    db = get_db()
    
    settings = await db.app_settings.find_one({"key": "emergency_settings"}, {"_id": 0})
    
    if not settings:
        return {
            "response_settings": {
                "critical_sla_minutes": 15,
                "urgent_sla_minutes": 30,
                "high_sla_hours": 2,
                "auto_escalate": True,
                "escalation_minutes": 10
            },
            "notifications": {
                "email_enabled": True,
                "sms_enabled": True,
                "whatsapp_enabled": True,
                "sound_alerts": True,
                "notify_all_agents": True
            },
            "lost_pet_settings": {
                "auto_create_alert": True,
                "share_to_social": False,
                "alert_radius_km": 10,
                "include_nearby_vets": True,
                "include_nearby_shelters": True
            },
            "service_desk": {
                "auto_create_ticket": True,
                "default_priority": "urgent",
                "auto_assign": True
            },
            "emergency_contacts": {
                "max_contacts_per_pet": 5,
                "require_phone": True
            }
        }
    
    return settings.get("value", {})


@router.put("/admin/settings")
async def update_emergency_settings(settings: Dict[str, Any]):
    """Update emergency settings"""
    db = get_db()
    
    await db.app_settings.update_one(
        {"key": "emergency_settings"},
        {"$set": {"key": "emergency_settings", "value": settings, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "message": "Settings updated"}


# ==================== STATS ====================

@router.get("/admin/stats")
async def get_emergency_stats():
    """Get emergency pillar statistics"""
    db = get_db()
    
    total_requests = await db.emergency_requests.count_documents({})
    active_requests = await db.emergency_requests.count_documents({"status": "active"})
    responding_requests = await db.emergency_requests.count_documents({"status": "responding"})
    resolved_requests = await db.emergency_requests.count_documents({"status": "resolved"})
    
    # By type
    type_breakdown = {}
    for emrg_type in EMERGENCY_TYPES.keys():
        type_breakdown[emrg_type] = await db.emergency_requests.count_documents({"emergency_type": emrg_type})
    
    # By severity
    severity_breakdown = {}
    for severity in ["critical", "urgent", "high", "moderate"]:
        severity_breakdown[severity] = await db.emergency_requests.count_documents({"severity": severity})
    
    # Lost pets specific
    lost_pet_active = await db.emergency_requests.count_documents({"emergency_type": "lost_pet", "status": {"$in": ["active", "responding"]}})
    found_pet_reports = await db.emergency_requests.count_documents({"emergency_type": "found_pet"})
    
    total_partners = await db.emergency_partners.count_documents({"is_active": True})
    partners_24hr = await db.emergency_partners.count_documents({"is_active": True, "is_24hr": True})
    total_products = await db.products_master.count_documents({"category": "emergency"})
    total_bundles = await db.emergency_bundles.count_documents({"is_active": True})
    
    return {
        "total_requests": total_requests,
        "active_requests": active_requests,
        "responding_requests": responding_requests,
        "resolved_requests": resolved_requests,
        "by_type": type_breakdown,
        "by_severity": severity_breakdown,
        "lost_pet_active": lost_pet_active,
        "found_pet_reports": found_pet_reports,
        "total_partners": total_partners,
        "partners_24hr": partners_24hr,
        "total_products": total_products,
        "total_bundles": total_bundles
    }


# ==================== CONFIG ====================

@router.get("/types")
async def get_emergency_types():
    """Get available emergency types"""
    return {
        "emergency_types": EMERGENCY_TYPES,
        "severity_levels": SEVERITY_LEVELS
    }


@router.get("/config")
async def get_emergency_config():
    """Get emergency pillar configuration for frontend"""
    db = get_db()
    
    partner_count = await db.emergency_partners.count_documents({"is_active": True})
    product_count = await db.products_master.count_documents({"category": "emergency"})
    active_emergencies = await db.emergency_requests.count_documents({"status": {"$in": ["active", "responding"]}})
    
    return {
        "emergency_types": EMERGENCY_TYPES,
        "severity_levels": SEVERITY_LEVELS,
        "partner_count": partner_count,
        "product_count": product_count,
        "active_emergencies": active_emergencies,
        "enabled": True,
        "hotline": "+91 96631 85747"
    }


# ==================== SEED DATA ====================

@router.post("/admin/seed")
async def seed_emergency_data():
    """Seed emergency pillar with sample data"""
    db = get_db()
    
    # Sample Emergency Partners (24/7 Vets, Ambulance Services)
    default_partners = [
        {
            "id": "emrg-partner-247vet1",
            "name": "PetCare Emergency Hospital",
            "partner_type": "emergency_vet",
            "description": "24/7 emergency veterinary hospital with ICU, surgery, and critical care facilities.",
            "address": "123 Pet Care Road, Andheri West",
            "cities": ["Mumbai", "Thane"],
            "phone": "+91 98765 11111",
            "emergency_phone": "+91 98765 00000",
            "email": "emergency@petcare247.in",
            "is_24hr": True,
            "services": ["emergency_surgery", "icu", "blood_bank", "xray", "ultrasound", "lab"],
            "response_time_minutes": 15,
            "rating": 4.9,
            "reviews_count": 345,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "emrg-partner-ambulance1",
            "name": "PetAmbulance India",
            "partner_type": "ambulance",
            "description": "Dedicated pet ambulance service with oxygen support and trained paramedics.",
            "cities": ["Mumbai", "Delhi", "Bangalore", "Pune"],
            "phone": "+91 98765 22222",
            "emergency_phone": "+91 98765 22222",
            "email": "dispatch@petambulance.in",
            "is_24hr": True,
            "services": ["pickup", "oxygen", "first_aid", "transport"],
            "response_time_minutes": 20,
            "rating": 4.8,
            "reviews_count": 189,
            "is_featured": True,
            "is_active": True
        },
        {
            "id": "emrg-partner-shelter1",
            "name": "Mumbai Animal Welfare Society",
            "partner_type": "shelter",
            "description": "Animal shelter and rescue organization helping lost and stray pets.",
            "address": "456 Rescue Lane, Bandra",
            "cities": ["Mumbai"],
            "phone": "+91 98765 33333",
            "email": "help@maws.org",
            "is_24hr": False,
            "services": ["lost_pet_registry", "shelter", "adoption", "rescue"],
            "rating": 4.7,
            "reviews_count": 234,
            "is_featured": False,
            "is_active": True
        },
        {
            "id": "emrg-partner-poison1",
            "name": "Pet Poison Helpline",
            "partner_type": "helpline",
            "description": "24/7 poison control helpline for pets with expert toxicologists.",
            "cities": ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata"],
            "phone": "+91 98765 44444",
            "emergency_phone": "+91 98765 44444",
            "email": "poison@pethelp.in",
            "is_24hr": True,
            "services": ["poison_consultation", "first_aid_guidance", "vet_referral"],
            "response_time_minutes": 5,
            "rating": 4.9,
            "reviews_count": 567,
            "is_featured": True,
            "is_active": True
        }
    ]
    
    # Sample Products
    default_products = [
        {
            "id": "emrg-first-aid-kit",
            "name": "Pet First Aid Kit - Complete",
            "description": "Comprehensive first aid kit: bandages, antiseptic, thermometer, tweezers, emergency guide, and more.",
            "price": 1499,
            "compare_price": 1999,
            "category": "emergency",
            "product_type": "first_aid",
            "tags": ["emergency", "first_aid", "kit", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 20,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-gps-tracker",
            "name": "GPS Pet Tracker - Real Time",
            "description": "Waterproof GPS tracker with live location, geo-fencing, and escape alerts. Battery lasts 7 days.",
            "price": 2999,
            "compare_price": 3999,
            "category": "emergency",
            "product_type": "tracking",
            "tags": ["emergency", "gps", "tracker", "lost_pet"],
            "pet_sizes": ["medium", "large"],
            "in_stock": True,
            "paw_reward_points": 40,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "emrg-gps-tracker-mini",
            "name": "GPS Pet Tracker - Mini (Cats & Small Dogs)",
            "description": "Lightweight GPS tracker for cats and small dogs. Only 15g weight.",
            "price": 2499,
            "compare_price": 3499,
            "category": "emergency",
            "product_type": "tracking",
            "tags": ["emergency", "gps", "tracker", "small", "cat"],
            "pet_sizes": ["small"],
            "in_stock": True,
            "paw_reward_points": 35,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-airtag-holder",
            "name": "AirTag Collar Holder",
            "description": "Secure, waterproof AirTag holder that attaches to any collar. Includes reflective strip.",
            "price": 399,
            "compare_price": 599,
            "category": "emergency",
            "product_type": "tracking",
            "tags": ["emergency", "airtag", "holder", "collar"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-id-tag-qr",
            "name": "Smart QR ID Tag - Emergency",
            "description": "Scannable QR tag linking to emergency contact info, medical alerts, and vet details.",
            "price": 499,
            "compare_price": 699,
            "category": "emergency",
            "product_type": "identification",
            "tags": ["emergency", "qr", "id", "tag"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 8,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-reflective-vest",
            "name": "High-Visibility Reflective Vest",
            "description": "Bright orange reflective vest for nighttime safety. Essential during emergencies.",
            "price": 599,
            "compare_price": 799,
            "category": "emergency",
            "product_type": "safety",
            "tags": ["emergency", "reflective", "vest", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-emergency-blanket",
            "name": "Pet Emergency Thermal Blanket",
            "description": "Compact, lightweight thermal blanket for shock, hypothermia, or transport emergencies.",
            "price": 299,
            "compare_price": 399,
            "category": "emergency",
            "product_type": "first_aid",
            "tags": ["emergency", "blanket", "thermal", "first_aid"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-muzzle-soft",
            "name": "Soft Emergency Muzzle Set (3 sizes)",
            "description": "Breathable mesh muzzle set for safe handling during injuries. Non-intimidating design.",
            "price": 799,
            "compare_price": 999,
            "category": "emergency",
            "product_type": "first_aid",
            "tags": ["emergency", "muzzle", "safety", "handling"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 12,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-calming-spray",
            "name": "Emergency Calming Spray",
            "description": "Fast-acting pheromone spray to calm anxious pets during emergencies. Travel-sized.",
            "price": 449,
            "compare_price": 599,
            "category": "emergency",
            "product_type": "calming",
            "tags": ["emergency", "calming", "spray", "anxiety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 7,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-wound-care-kit",
            "name": "Pet Wound Care Kit",
            "description": "Antiseptic solution, wound spray, gauze, medical tape, and wound care guide.",
            "price": 699,
            "compare_price": 899,
            "category": "emergency",
            "product_type": "first_aid",
            "tags": ["emergency", "wound", "care", "first_aid"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-car-safety-kit",
            "name": "Pet Car Emergency Kit",
            "description": "Seatbelt harness, collapsible bowl, flashlight, window breaker, and first aid basics.",
            "price": 1299,
            "compare_price": 1699,
            "category": "emergency",
            "product_type": "travel_safety",
            "tags": ["emergency", "car", "travel", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 18,
            "is_birthday_perk": False
        },
        {
            "id": "emrg-lost-pet-kit",
            "name": "Lost Pet Recovery Kit",
            "description": "QR tags, poster templates, community alert guide, scent article bag, and checklist.",
            "price": 799,
            "compare_price": 999,
            "category": "emergency",
            "product_type": "lost_pet",
            "tags": ["emergency", "lost", "recovery", "kit"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 12,
            "is_birthday_perk": False
        }
    ]
    
    # Sample Bundles
    default_bundles = [
        {
            "id": "emrg-bundle-safety",
            "name": "Complete Safety Bundle",
            "description": "Everything for pet safety: GPS tracker, QR ID tag, reflective vest, and first aid kit.",
            "items": ["emrg-gps-tracker", "emrg-id-tag-qr", "emrg-reflective-vest", "emrg-first-aid-kit"],
            "price": 4999,
            "original_price": 5596,
            "paw_reward_points": 80,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15,
            "is_active": True
        },
        {
            "id": "emrg-bundle-first-responder",
            "name": "First Responder Kit",
            "description": "Be prepared: Complete first aid kit, wound care kit, emergency blanket, and calming spray.",
            "items": ["emrg-first-aid-kit", "emrg-wound-care-kit", "emrg-emergency-blanket", "emrg-calming-spray"],
            "price": 2799,
            "original_price": 3346,
            "paw_reward_points": 45,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "emrg-bundle-lost-pet",
            "name": "Lost Pet Prevention Bundle",
            "description": "Never lose your pet: GPS tracker, QR ID tag, AirTag holder, and lost pet recovery kit.",
            "items": ["emrg-gps-tracker", "emrg-id-tag-qr", "emrg-airtag-holder", "emrg-lost-pet-kit"],
            "price": 4299,
            "original_price": 4696,
            "paw_reward_points": 70,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "emrg-bundle-travel",
            "name": "Travel Emergency Bundle",
            "description": "Safe travels: Car safety kit, GPS tracker mini, emergency blanket, and calming spray.",
            "items": ["emrg-car-safety-kit", "emrg-gps-tracker-mini", "emrg-emergency-blanket", "emrg-calming-spray"],
            "price": 4299,
            "original_price": 4546,
            "paw_reward_points": 65,
            "is_recommended": False,
            "is_birthday_perk": True,
            "birthday_discount_percent": 10,
            "is_active": True
        },
        {
            "id": "emrg-bundle-small-pet",
            "name": "Small Pet Safety Bundle",
            "description": "For cats and small dogs: Mini GPS tracker, QR tag, AirTag holder, and first aid kit.",
            "items": ["emrg-gps-tracker-mini", "emrg-id-tag-qr", "emrg-airtag-holder", "emrg-first-aid-kit"],
            "price": 4299,
            "original_price": 4896,
            "paw_reward_points": 70,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        }
    ]
    
    # Insert data
    for partner in default_partners:
        partner["created_at"] = datetime.now(timezone.utc).isoformat()
        partner["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.emergency_partners.update_one({"id": partner["id"]}, {"$set": partner}, upsert=True)
    
    for product in default_products:
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        product["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products_master.update_one({"id": product["id"]}, {"$set": product}, upsert=True)
    
    for bundle in default_bundles:
        bundle["created_at"] = datetime.now(timezone.utc).isoformat()
        bundle["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.emergency_bundles.update_one({"id": bundle["id"]}, {"$set": bundle}, upsert=True)
    
    logger.info(f"Seeded EMERGENCY pillar: {len(default_partners)} partners, {len(default_products)} products, {len(default_bundles)} bundles")
    
    return {
        "message": "EMERGENCY pillar data seeded successfully",
        "partners_seeded": len(default_partners),
        "products_seeded": len(default_products),
        "bundles_seeded": len(default_bundles)
    }



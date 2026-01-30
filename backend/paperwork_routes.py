"""
PAPERWORK Pillar Routes - Pet Document Vault & Management
Secure storage for identity, medical, travel, insurance, care & legal documents
Complete CRUD with Reminder Engine, Service Desk, Notifications, and Pet Soul integration
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
import logging
import os
import csv
import io

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/paperwork", tags=["paperwork"])

def get_db():
    from server import db
    return db


# Document Categories with sub-categories
DOCUMENT_CATEGORIES = {
    "identity": {
        "name": "Identity & Safety",
        "icon": "Shield",
        "color": "from-blue-600 to-indigo-700",
        "description": "Core identity documents for your pet",
        "subcategories": [
            {"id": "adoption", "name": "Adoption Papers", "required": True},
            {"id": "registration", "name": "Registration Certificate", "required": False},
            {"id": "microchip", "name": "Microchip Certificate", "required": True},
            {"id": "passport", "name": "Pet Passport", "required": False},
            {"id": "ownership", "name": "Proof of Ownership", "required": False}
        ]
    },
    "medical": {
        "name": "Medical & Health",
        "icon": "Heart",
        "color": "from-red-500 to-rose-600",
        "description": "Health records, vaccinations & medical history",
        "subcategories": [
            {"id": "vaccination", "name": "Vaccination Records", "required": True, "has_reminder": True},
            {"id": "deworming", "name": "Deworming History", "required": False, "has_reminder": True},
            {"id": "tick_flea", "name": "Tick & Flea Schedule", "required": False, "has_reminder": True},
            {"id": "health_checkup", "name": "Annual Health Check-up", "required": False, "has_reminder": True},
            {"id": "sterilisation", "name": "Sterilisation Certificate", "required": False},
            {"id": "vet_notes", "name": "Vet Consultation Notes", "required": False},
            {"id": "lab_reports", "name": "Lab Reports", "required": False},
            {"id": "xrays_scans", "name": "X-rays / Scans", "required": False},
            {"id": "prescriptions", "name": "Prescriptions", "required": False},
            {"id": "chronic_conditions", "name": "Chronic Condition Records", "required": False}
        ]
    },
    "travel": {
        "name": "Travel Documents",
        "icon": "Plane",
        "color": "from-cyan-500 to-blue-600",
        "description": "Travel certificates and relocation papers",
        "subcategories": [
            {"id": "airline_cert", "name": "Airline Travel Certificate", "required": False},
            {"id": "health_cert_travel", "name": "Health Certificate for Travel", "required": False, "has_reminder": True},
            {"id": "relocation", "name": "Pet Relocation Documents", "required": False},
            {"id": "train_bus", "name": "Train/Bus Approvals", "required": False},
            {"id": "import_export", "name": "Import/Export Papers", "required": False}
        ]
    },
    "insurance": {
        "name": "Insurance & Financial",
        "icon": "FileText",
        "color": "from-emerald-500 to-green-600",
        "description": "Insurance policies and financial records",
        "subcategories": [
            {"id": "policy", "name": "Insurance Policy Document", "required": False, "has_reminder": True},
            {"id": "claims", "name": "Claims History", "required": False},
            {"id": "premium_receipts", "name": "Premium Payment Receipts", "required": False}
        ]
    },
    "care": {
        "name": "Care & Training",
        "icon": "Sparkles",
        "color": "from-purple-500 to-violet-600",
        "description": "Grooming, training and care records",
        "subcategories": [
            {"id": "grooming", "name": "Grooming History", "required": False},
            {"id": "training_cert", "name": "Training Certificates", "required": False},
            {"id": "behaviour", "name": "Behaviour Assessment Reports", "required": False},
            {"id": "walker_sitter", "name": "Walker/Sitter Records", "required": False}
        ]
    },
    "legal": {
        "name": "Legal & Compliance",
        "icon": "Scale",
        "color": "from-amber-500 to-orange-600",
        "description": "Licenses, registrations and legal documents",
        "subcategories": [
            {"id": "municipality", "name": "Municipality Registration", "required": False, "has_reminder": True},
            {"id": "license", "name": "License / Tags", "required": False, "has_reminder": True},
            {"id": "breeder_cert", "name": "Breeder Certificate", "required": False}
        ]
    }
}

REMINDER_CHANNELS = ["email", "whatsapp", "both", "app"]

# Insurance Services under Paperwork - "Insure" pillar
INSURANCE_SERVICES = {
    "quote_request": {
        "name": "Get Insurance Quote",
        "icon": "🛡️",
        "description": "Get quotes from multiple pet insurance providers",
        "typical_response_time": "24-48 hours",
        "requires": ["pet_age", "breed", "health_conditions"]
    },
    "policy_review": {
        "name": "Policy Review",
        "icon": "📋",
        "description": "Expert review of your current pet insurance policy",
        "typical_response_time": "2-3 days",
        "requires": ["current_policy"]
    },
    "claim_assistance": {
        "name": "Claim Assistance",
        "icon": "📝",
        "description": "Help filing and tracking insurance claims",
        "typical_response_time": "Same day",
        "requires": ["policy_number", "claim_details"]
    },
    "renewal_reminder": {
        "name": "Renewal Management",
        "icon": "🔔",
        "description": "Get reminded before your policy expires",
        "typical_response_time": "Automated",
        "requires": ["policy_expiry_date"]
    },
    "compare_plans": {
        "name": "Compare Plans",
        "icon": "⚖️",
        "description": "Side-by-side comparison of insurance plans",
        "typical_response_time": "24 hours",
        "requires": ["coverage_needs", "budget"]
    }
}


# ==================== DOCUMENT MANAGEMENT ====================

@router.post("/documents/upload")
async def upload_document(
    pet_id: str = Form(...),
    category: str = Form(...),
    subcategory: str = Form(...),
    document_name: str = Form(...),
    document_date: Optional[str] = Form(None),
    expiry_date: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    reminder_enabled: bool = Form(False),
    reminder_date: Optional[str] = Form(None),
    reminder_channel: str = Form("email"),
    file_url: str = Form(...)  # Pre-uploaded file URL
):
    """Upload a document to the pet's paperwork vault"""
    db = get_db()
    
    doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    
    document = {
        "id": doc_id,
        "pet_id": pet_id,
        "category": category,
        "subcategory": subcategory,
        "document_name": document_name,
        "file_url": file_url,
        "file_type": file_url.split('.')[-1].lower() if '.' in file_url else "unknown",
        "document_date": document_date,
        "expiry_date": expiry_date,
        "notes": notes,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.paperwork_documents.insert_one({k: v for k, v in document.items() if k != "_id"})
    
    # Create reminder if enabled
    if reminder_enabled and reminder_date:
        reminder = {
            "id": f"REM-{uuid.uuid4().hex[:8].upper()}",
            "document_id": doc_id,
            "pet_id": pet_id,
            "type": "document_expiry",
            "title": f"Document Reminder: {document_name}",
            "description": f"Reminder for {DOCUMENT_CATEGORIES.get(category, {}).get('subcategories', [{}])[0].get('name', subcategory)}",
            "reminder_date": reminder_date,
            "channel": reminder_channel,
            "repeat": False,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.paperwork_reminders.insert_one({k: v for k, v in reminder.items() if k != "_id"})
    
    # Update Pet Soul with document info
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {
                "soul.documents": {
                    "document_id": doc_id,
                    "category": category,
                    "subcategory": subcategory,
                    "name": document_name,
                    "added_at": datetime.now(timezone.utc).isoformat()
                }
            },
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    logger.info(f"Document {doc_id} uploaded for pet {pet_id}")
    
    return {
        "message": "Document uploaded successfully",
        "document_id": doc_id,
        "document": document
    }


@router.get("/documents/{pet_id}")
async def get_pet_documents(
    pet_id: str,
    category: Optional[str] = None,
    subcategory: Optional[str] = None
):
    """Get all documents for a pet, optionally filtered by category"""
    db = get_db()
    
    query = {"pet_id": pet_id, "status": "active"}
    if category:
        query["category"] = category
    if subcategory:
        query["subcategory"] = subcategory
    
    documents = await db.paperwork_documents.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Group by category
    grouped = {}
    for cat_id, cat_info in DOCUMENT_CATEGORIES.items():
        grouped[cat_id] = {
            "name": cat_info["name"],
            "icon": cat_info["icon"],
            "color": cat_info["color"],
            "documents": [d for d in documents if d["category"] == cat_id],
            "subcategories": cat_info["subcategories"]
        }
    
    return {
        "pet_id": pet_id,
        "total_documents": len(documents),
        "documents_by_category": grouped,
        "all_documents": documents
    }


@router.get("/documents/{pet_id}/{doc_id}")
async def get_document(pet_id: str, doc_id: str):
    """Get a specific document"""
    db = get_db()
    
    document = await db.paperwork_documents.find_one(
        {"id": doc_id, "pet_id": pet_id}, 
        {"_id": 0}
    )
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get associated reminders
    reminders = await db.paperwork_reminders.find(
        {"document_id": doc_id},
        {"_id": 0}
    ).to_list(10)
    
    document["reminders"] = reminders
    
    return document


@router.put("/documents/{pet_id}/{doc_id}")
async def update_document(pet_id: str, doc_id: str, update_data: dict):
    """Update a document"""
    db = get_db()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data.pop("id", None)
    update_data.pop("_id", None)
    update_data.pop("pet_id", None)
    
    result = await db.paperwork_documents.update_one(
        {"id": doc_id, "pet_id": pet_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document updated"}


@router.delete("/documents/{pet_id}/{doc_id}")
async def delete_document(pet_id: str, doc_id: str):
    """Soft delete a document"""
    db = get_db()
    
    result = await db.paperwork_documents.update_one(
        {"id": doc_id, "pet_id": pet_id},
        {"$set": {"status": "deleted", "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove from Pet Soul
    await db.pets.update_one(
        {"id": pet_id},
        {"$pull": {"soul.documents": {"document_id": doc_id}}}
    )
    
    return {"message": "Document deleted"}


# ==================== REMINDERS ====================

@router.post("/reminders")
async def create_reminder(reminder_data: dict):
    """Create a document reminder"""
    db = get_db()
    
    reminder_id = f"REM-{uuid.uuid4().hex[:8].upper()}"
    
    reminder = {
        "id": reminder_id,
        **reminder_data,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.paperwork_reminders.insert_one({k: v for k, v in reminder.items() if k != "_id"})
    
    return {"message": "Reminder created", "reminder_id": reminder_id}


@router.get("/reminders/{pet_id}")
async def get_pet_reminders(pet_id: str, status: Optional[str] = None):
    """Get all reminders for a pet"""
    db = get_db()
    
    query = {"pet_id": pet_id}
    if status:
        query["status"] = status
    
    reminders = await db.paperwork_reminders.find(query, {"_id": 0}).sort("reminder_date", 1).to_list(100)
    
    return {"reminders": reminders, "total": len(reminders)}


@router.put("/reminders/{reminder_id}")
async def update_reminder(reminder_id: str, update_data: dict):
    """Update a reminder"""
    db = get_db()
    
    update_data.pop("id", None)
    update_data.pop("_id", None)
    
    result = await db.paperwork_reminders.update_one(
        {"id": reminder_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"message": "Reminder updated"}


@router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str):
    """Delete a reminder"""
    db = get_db()
    
    result = await db.paperwork_reminders.delete_one({"id": reminder_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    return {"message": "Reminder deleted"}


# ==================== QUICK ACCESS (FOR MIRA & CONCIERGE) ====================

@router.get("/quick-access/{pet_id}")
async def get_quick_access_documents(pet_id: str):
    """Get essential documents for Mira/Concierge - one click access"""
    db = get_db()
    
    # Get all active documents
    documents = await db.paperwork_documents.find(
        {"pet_id": pet_id, "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    # Get pet info
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    
    # Organize for quick access
    quick_access = {
        "pet_id": pet_id,
        "pet_name": pet.get("name") if pet else "Unknown",
        "identity": {
            "microchip": next((d for d in documents if d["subcategory"] == "microchip"), None),
            "registration": next((d for d in documents if d["subcategory"] == "registration"), None),
            "adoption": next((d for d in documents if d["subcategory"] == "adoption"), None)
        },
        "medical": {
            "latest_vaccination": next((d for d in documents if d["subcategory"] == "vaccination"), None),
            "health_checkup": next((d for d in documents if d["subcategory"] == "health_checkup"), None),
            "prescriptions": [d for d in documents if d["subcategory"] == "prescriptions"][:3]
        },
        "travel": {
            "health_certificate": next((d for d in documents if d["subcategory"] == "health_cert_travel"), None),
            "airline_cert": next((d for d in documents if d["subcategory"] == "airline_cert"), None)
        },
        "insurance": {
            "policy": next((d for d in documents if d["subcategory"] == "policy"), None)
        },
        "total_documents": len(documents),
        "last_updated": max([d["updated_at"] for d in documents]) if documents else None
    }
    
    return quick_access


# ==================== DOCUMENT REQUESTS ====================

@router.post("/request")
async def create_document_request(request_data: dict):
    """Create a document assistance request with Service Desk integration"""
    db = get_db()
    
    request_id = f"PAPER-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    doc_request = {
        "id": request_id,
        "request_type": request_data.get("request_type", "document_organization"),  # document_organization, lost_documents, emergency_access
        "status": "pending",
        "priority": request_data.get("priority", "normal"),
        
        # Pet Details
        "pet_id": request_data.get("pet_id"),
        "pet_name": request_data.get("pet_name"),
        
        # User Details
        "user_id": request_data.get("user_id"),
        "user_name": request_data.get("user_name"),
        "user_email": request_data.get("user_email"),
        "user_phone": request_data.get("user_phone"),
        
        # Request Details
        "description": request_data.get("description", ""),
        "documents_needed": request_data.get("documents_needed", []),
        "urgency": request_data.get("urgency", "normal"),
        "notes": request_data.get("notes", ""),
        
        # Tracking
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.paperwork_requests.insert_one({k: v for k, v in doc_request.items() if k != "_id"})
    
    # Create Service Desk Ticket
    ticket = {
        "id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "source": "paperwork_pillar",
        "source_id": request_id,
        "category": "paperwork",
        "subcategory": doc_request["request_type"],
        "subject": f"Paperwork Request: {doc_request['request_type'].replace('_', ' ').title()} for {doc_request['pet_name']}",
        "description": f"Document request from {doc_request['user_name']}.\n{doc_request['description']}",
        "status": "open",
        "priority": doc_request["priority"],
        "customer_name": doc_request["user_name"],
        "customer_email": doc_request["user_email"],
        "customer_phone": doc_request["user_phone"],
        "pet_name": doc_request["pet_name"],
        "pet_id": doc_request["pet_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "tags": ["paperwork", doc_request["request_type"]],
        "pillar": "paperwork"
    }
    
    await db.tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    
    # Unified Inbox
    inbox_item = {
        "id": f"INB-{uuid.uuid4().hex[:8].upper()}",
        "type": "paperwork_request",
        "source": "paperwork_pillar",
        "reference_id": request_id,
        "ticket_id": ticket["id"],
        "title": f"Paperwork Request: {doc_request['request_type'].replace('_', ' ').title()}",
        "preview": f"{doc_request['pet_name']} - {doc_request['description'][:50]}...",
        "customer_name": doc_request["user_name"],
        "customer_email": doc_request["user_email"],
        "pet_name": doc_request["pet_name"],
        "status": "unread",
        "priority": doc_request["priority"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "pillar": "paperwork"
    }
    
    await db.unified_inbox.insert_one({k: v for k, v in inbox_item.items() if k != "_id"})
    
    # Admin Notification
    notification = {
        "id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "type": "new_paperwork_request",
        "title": f"New Paperwork Request: {doc_request['request_type'].replace('_', ' ').title()}",
        "message": f"{doc_request['user_name']} needs document assistance for {doc_request['pet_name']}",
        "category": "paperwork",
        "priority": doc_request["priority"],
        "related_id": request_id,
        "link_to": f"/admin?tab=paperwork&request={request_id}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_notifications.insert_one({k: v for k, v in notification.items() if k != "_id"})
    
    return {
        "message": "Document request submitted successfully",
        "request_id": request_id,
        "ticket_id": ticket["id"]
    }


@router.get("/requests")
async def get_paperwork_requests(
    status: Optional[str] = None,
    request_type: Optional[str] = None,
    limit: int = 50
):
    """Get all paperwork requests"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if request_type:
        query["request_type"] = request_type
    
    requests = await db.paperwork_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    return {"requests": requests, "total": len(requests)}


@router.put("/requests/{request_id}")
async def update_paperwork_request(request_id: str, update_data: dict):
    """Update a paperwork request"""
    db = get_db()
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data.pop("id", None)
    update_data.pop("_id", None)
    
    result = await db.paperwork_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return {"message": "Request updated"}


# ==================== INSURE SERVICES ====================

@router.get("/insure/services")
async def get_insurance_services():
    """Get available insurance services under Paperwork/Insure"""
    return {
        "services": INSURANCE_SERVICES,
        "pillar": "paperwork",
        "sub_pillar": "insure",
        "description": "Pet insurance assistance and management services"
    }


@router.post("/insure/request")
async def create_insurance_request(request_data: dict):
    """Create an insurance assistance request"""
    db = get_db()
    
    request_id = f"INS-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    service_type = request_data.get("service_type", "quote_request")
    
    ins_request = {
        "id": request_id,
        "service_type": service_type,
        "status": "pending",
        "priority": request_data.get("priority", "normal"),
        
        # Pet Details
        "pet_id": request_data.get("pet_id"),
        "pet_name": request_data.get("pet_name"),
        "pet_breed": request_data.get("pet_breed"),
        "pet_age": request_data.get("pet_age"),
        
        # User Details
        "user_id": request_data.get("user_id"),
        "user_name": request_data.get("user_name"),
        "user_email": request_data.get("user_email"),
        "user_phone": request_data.get("user_phone"),
        
        # Insurance Details
        "current_policy": request_data.get("current_policy"),
        "policy_number": request_data.get("policy_number"),
        "coverage_needs": request_data.get("coverage_needs", []),
        "budget_range": request_data.get("budget_range"),
        "health_conditions": request_data.get("health_conditions", []),
        
        # Request Details
        "description": request_data.get("description", ""),
        "notes": request_data.get("notes", ""),
        
        # Tracking
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.insurance_requests.insert_one({k: v for k, v in ins_request.items() if k != "_id"})
    
    # Get service config
    service_config = INSURANCE_SERVICES.get(service_type, {})
    
    # Create Service Desk Ticket
    ticket = {
        "id": f"TKT-{uuid.uuid4().hex[:8].upper()}",
        "source": "insure_pillar",
        "source_id": request_id,
        "category": "insurance",
        "subcategory": service_type,
        "subject": f"Insurance Request: {service_config.get('name', service_type)} for {ins_request.get('pet_name', 'Pet')}",
        "description": f"Insurance assistance request from {ins_request['user_name']}.\nService: {service_config.get('name', service_type)}\n{ins_request['description']}",
        "status": "open",
        "priority": ins_request["priority"],
        "customer_name": ins_request["user_name"],
        "customer_email": ins_request["user_email"],
        "customer_phone": ins_request["user_phone"],
        "pet_name": ins_request["pet_name"],
        "pet_id": ins_request["pet_id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "tags": ["insurance", "insure", service_type, "paperwork"],
        "pillar": "paperwork"
    }
    
    await db.tickets.insert_one({k: v for k, v in ticket.items() if k != "_id"})
    
    # Unified Inbox
    inbox_item = {
        "id": f"INB-{uuid.uuid4().hex[:8].upper()}",
        "type": "insurance_request",
        "source": "insure_pillar",
        "source_id": request_id,
        "title": f"🛡️ Insurance: {service_config.get('name', service_type)}",
        "summary": f"{ins_request['user_name']} needs {service_config.get('name', 'insurance assistance')} for {ins_request.get('pet_name', 'their pet')}",
        "customer_name": ins_request["user_name"],
        "customer_email": ins_request["user_email"],
        "pet_name": ins_request.get("pet_name"),
        "status": "new",
        "priority": ins_request["priority"],
        "pillar": "paperwork",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.unified_inbox.insert_one({k: v for k, v in inbox_item.items() if k != "_id"})
    
    # Admin notification
    admin_notif = {
        "id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "type": "new_insurance_request",
        "title": f"🛡️ New Insurance Request: {service_config.get('name', service_type)}",
        "message": f"{ins_request['user_name']} needs {service_config.get('name', 'insurance assistance')} for {ins_request.get('pet_name', 'their pet')}",
        "category": "insurance",
        "priority": ins_request["priority"],
        "read": False,
        "link_to": f"/admin?tab=insurance&request={request_id}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.admin_notifications.insert_one({k: v for k, v in admin_notif.items() if k != "_id"})
    
    return {
        "message": "Insurance request created successfully",
        "request_id": request_id,
        "estimated_response": service_config.get("typical_response_time", "24-48 hours"),
        "ticket_id": ticket["id"]
    }


@router.get("/insure/requests")
async def get_insurance_requests(
    status: Optional[str] = None,
    service_type: Optional[str] = None,
    limit: int = 50
):
    """Get all insurance requests"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if service_type:
        query["service_type"] = service_type
    
    requests = await db.insurance_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    
    return {"requests": requests, "total": len(requests)}


# ==================== PRODUCTS ====================

@router.get("/products")
async def get_paperwork_products(
    product_type: Optional[str] = None,
    in_stock: bool = True,
    limit: int = 50
):
    """Get paperwork products"""
    db = get_db()
    
    query = {"category": "paperwork"}
    if product_type:
        query["product_type"] = product_type
    if in_stock:
        query["in_stock"] = True
    
    products = await db.products.find(query, {"_id": 0}).to_list(limit)
    
    return {"products": products, "total": len(products)}


@router.post("/admin/products")
async def create_paperwork_product(product_data: dict):
    """Create a new paperwork product"""
    db = get_db()
    
    product = {
        "id": f"paper-{uuid.uuid4().hex[:8]}",
        **product_data,
        "category": "paperwork",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.products.insert_one({k: v for k, v in product.items() if k != "_id"})
    
    return {"message": "Product created", "product_id": product["id"]}


# Product CSV Export/Import (Must come BEFORE {product_id} routes)

@router.get("/admin/products/export-csv")
async def export_paperwork_products_csv():
    """Export paperwork products to CSV"""
    db = get_db()
    
    products = await db.paperwork_products.find({}).to_list(length=1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "id", "name", "description", "price", "original_price", "category",
        "document_type", "image", "tags", "in_stock", "paw_reward_points"
    ])
    
    for p in products:
        writer.writerow([
            p.get("id", ""),
            p.get("name", ""),
            p.get("description", ""),
            p.get("price", 0),
            p.get("original_price", ""),
            p.get("category", ""),
            p.get("document_type", ""),
            p.get("image", ""),
            "|".join(p.get("tags", [])),
            p.get("in_stock", True),
            p.get("paw_reward_points", 0)
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=paperwork_products.csv"}
    )


@router.post("/admin/products/import-csv")
async def import_paperwork_products_csv(file: UploadFile = File(...)):
    """Import paperwork products from CSV"""
    db = get_db()
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    updated = 0
    
    for row in reader:
        product_id = row.get("id") or f"paper-{uuid.uuid4().hex[:8]}"
        
        product_doc = {
            "id": product_id,
            "pillar": "paperwork",
            "name": row.get("name", ""),
            "description": row.get("description", ""),
            "price": float(row.get("price", 0)),
            "original_price": float(row["original_price"]) if row.get("original_price") else None,
            "category": row.get("category", "products"),
            "document_type": row.get("document_type", ""),
            "image": row.get("image", ""),
            "tags": row.get("tags", "").split("|") if row.get("tags") else [],
            "in_stock": row.get("in_stock", "true").lower() == "true",
            "paw_reward_points": int(row.get("paw_reward_points", 0)),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing = await db.paperwork_products.find_one({"id": product_id})
        if existing:
            await db.paperwork_products.update_one({"id": product_id}, {"$set": product_doc})
            updated += 1
        else:
            product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.paperwork_products.insert_one(product_doc)
            imported += 1
    
    return {"message": f"Imported {imported} new, updated {updated} products"}


@router.put("/admin/products/{product_id}")
async def update_paperwork_product(product_id: str, product_data: dict):
    """Update a paperwork product"""
    db = get_db()
    
    product_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    product_data.pop("id", None)
    product_data.pop("_id", None)
    
    result = await db.products.update_one({"id": product_id}, {"$set": product_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}


@router.delete("/admin/products/{product_id}")
async def delete_paperwork_product(product_id: str):
    """Delete a paperwork product"""
    db = get_db()
    
    result = await db.products.delete_one({"id": product_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}


# ==================== BUNDLES ====================

@router.get("/bundles")
async def get_paperwork_bundles(limit: int = 20):
    """Get paperwork bundles"""
    db = get_db()
    
    bundles = await db.paperwork_bundles.find({"is_active": True}, {"_id": 0}).to_list(limit)
    
    return {"bundles": bundles, "total": len(bundles)}


@router.post("/admin/bundles")
async def create_paperwork_bundle(bundle_data: dict):
    """Create a new paperwork bundle"""
    db = get_db()
    
    bundle = {
        "id": f"paper-bundle-{uuid.uuid4().hex[:8]}",
        **bundle_data,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.paperwork_bundles.insert_one({k: v for k, v in bundle.items() if k != "_id"})
    
    return {"message": "Bundle created", "bundle_id": bundle["id"]}


# Bundle CSV Export/Import (Must come BEFORE {bundle_id} routes)

@router.get("/admin/bundles/export-csv")
async def export_paperwork_bundles_csv():
    """Export paperwork bundles to CSV"""
    db = get_db()
    
    bundles = await db.paperwork_bundles.find({}).to_list(length=500)
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow([
        "id", "name", "description", "price", "original_price", "items",
        "is_recommended", "paw_reward_points"
    ])
    
    for b in bundles:
        writer.writerow([
            b.get("id", ""),
            b.get("name", ""),
            b.get("description", ""),
            b.get("price", 0),
            b.get("original_price", ""),
            "|".join(b.get("items", [])),
            b.get("is_recommended", True),
            b.get("paw_reward_points", 0)
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=paperwork_bundles.csv"}
    )


@router.post("/admin/bundles/import-csv")
async def import_paperwork_bundles_csv(file: UploadFile = File(...)):
    """Import paperwork bundles from CSV"""
    db = get_db()
    
    content = await file.read()
    decoded = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    updated = 0
    
    for row in reader:
        bundle_id = row.get("id") or f"paper-bundle-{uuid.uuid4().hex[:8]}"
        
        bundle_doc = {
            "id": bundle_id,
            "pillar": "paperwork",
            "name": row.get("name", ""),
            "description": row.get("description", ""),
            "price": float(row.get("price", 0)),
            "original_price": float(row["original_price"]) if row.get("original_price") else None,
            "items": row.get("items", "").split("|") if row.get("items") else [],
            "is_recommended": row.get("is_recommended", "true").lower() == "true",
            "paw_reward_points": int(row.get("paw_reward_points", 0)),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing = await db.paperwork_bundles.find_one({"id": bundle_id})
        if existing:
            await db.paperwork_bundles.update_one({"id": bundle_id}, {"$set": bundle_doc})
            updated += 1
        else:
            bundle_doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.paperwork_bundles.insert_one(bundle_doc)
            imported += 1
    
    return {"message": f"Imported {imported} new, updated {updated} bundles"}


@router.put("/admin/bundles/{bundle_id}")
async def update_paperwork_bundle(bundle_id: str, bundle_data: dict):
    """Update a paperwork bundle"""
    db = get_db()
    
    bundle_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    bundle_data.pop("id", None)
    bundle_data.pop("_id", None)
    
    result = await db.paperwork_bundles.update_one({"id": bundle_id}, {"$set": bundle_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle updated"}


@router.delete("/admin/bundles/{bundle_id}")
async def delete_paperwork_bundle(bundle_id: str):
    """Delete a paperwork bundle"""
    db = get_db()
    
    result = await db.paperwork_bundles.delete_one({"id": bundle_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bundle not found")
    
    return {"message": "Bundle deleted"}


# ==================== SETTINGS ====================

@router.get("/admin/settings")
async def get_paperwork_settings():
    """Get paperwork pillar settings"""
    db = get_db()
    
    settings = await db.app_settings.find_one({"key": "paperwork_settings"}, {"_id": 0})
    
    if not settings:
        return {
            "paw_rewards": {
                "enabled": True,
                "points_per_document_upload": 5,
                "points_per_complete_folder": 25,
                "bonus_points_all_folders_complete": 100
            },
            "birthday_perks": {
                "enabled": True,
                "discount_percent": 15,
                "free_document_organization": True
            },
            "reminders": {
                "enabled": True,
                "default_channel": "email",
                "days_before_expiry": [30, 7, 1],
                "repeat_reminders": True
            },
            "notifications": {
                "email_enabled": True,
                "sms_enabled": False,
                "whatsapp_enabled": True
            },
            "service_desk": {
                "auto_create_ticket": True,
                "default_priority": "normal"
            },
            "quick_access": {
                "enabled_for_mira": True,
                "enabled_for_concierge": True,
                "enabled_for_travel": True,
                "enabled_for_emergency": True
            }
        }
    
    return settings.get("value", {})


@router.put("/admin/settings")
async def update_paperwork_settings(settings: Dict[str, Any]):
    """Update paperwork settings"""
    db = get_db()
    
    await db.app_settings.update_one(
        {"key": "paperwork_settings"},
        {"$set": {"key": "paperwork_settings", "value": settings, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"success": True, "message": "Settings updated"}


# ==================== STATS ====================

@router.get("/admin/stats")
async def get_paperwork_stats():
    """Get paperwork pillar statistics"""
    db = get_db()
    
    total_documents = await db.paperwork_documents.count_documents({"status": "active"})
    total_requests = await db.paperwork_requests.count_documents({})
    pending_requests = await db.paperwork_requests.count_documents({"status": "pending"})
    pending_reminders = await db.paperwork_reminders.count_documents({"status": "pending"})
    
    # By category
    category_breakdown = {}
    for cat_id in DOCUMENT_CATEGORIES.keys():
        category_breakdown[cat_id] = await db.paperwork_documents.count_documents({"category": cat_id, "status": "active"})
    
    total_products = await db.products.count_documents({"category": "paperwork"})
    total_bundles = await db.paperwork_bundles.count_documents({"is_active": True})
    
    # Pets with documents
    pets_with_docs = await db.paperwork_documents.distinct("pet_id", {"status": "active"})
    
    return {
        "total_documents": total_documents,
        "total_requests": total_requests,
        "pending_requests": pending_requests,
        "pending_reminders": pending_reminders,
        "by_category": category_breakdown,
        "total_products": total_products,
        "total_bundles": total_bundles,
        "pets_with_documents": len(pets_with_docs)
    }


# ==================== CONFIG ====================

@router.get("/categories")
async def get_document_categories():
    """Get all document categories and subcategories"""
    return {
        "categories": DOCUMENT_CATEGORIES,
        "reminder_channels": REMINDER_CHANNELS
    }


@router.get("/config")
async def get_paperwork_config():
    """Get paperwork pillar configuration for frontend"""
    db = get_db()
    
    doc_count = await db.paperwork_documents.count_documents({"status": "active"})
    product_count = await db.products.count_documents({"category": "paperwork"})
    
    return {
        "categories": DOCUMENT_CATEGORIES,
        "reminder_channels": REMINDER_CHANNELS,
        "document_count": doc_count,
        "product_count": product_count,
        "enabled": True
    }


# ==================== SEED DATA ====================

@router.post("/admin/seed")
async def seed_paperwork_data():
    """Seed paperwork pillar with sample products and bundles"""
    db = get_db()
    
    # Sample Products
    default_products = [
        # Identity & Safety Products
        {
            "id": "paper-qr-tag",
            "name": "Smart QR ID Tag",
            "description": "Durable QR code tag that links to your pet's digital profile. Waterproof and scratch-resistant.",
            "price": 499,
            "compare_price": 699,
            "category": "paperwork",
            "product_type": "identity",
            "tags": ["paperwork", "identity", "qr", "tag", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 8,
            "is_birthday_perk": False
        },
        {
            "id": "paper-engraved-tag",
            "name": "Premium Engraved Collar Tag",
            "description": "Stainless steel tag with pet name and owner contact. Choose from bone, heart, or paw shapes.",
            "price": 349,
            "compare_price": 449,
            "category": "paperwork",
            "product_type": "identity",
            "tags": ["paperwork", "identity", "tag", "engraved"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20
        },
        {
            "id": "paper-smart-id-card",
            "name": "Digital Pet ID Card",
            "description": "Printable + digital ID card with photo, microchip, and emergency contacts. App access included.",
            "price": 299,
            "compare_price": 399,
            "category": "paperwork",
            "product_type": "identity",
            "tags": ["paperwork", "identity", "digital", "card"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 5,
            "is_birthday_perk": False
        },
        # Medical Organization Products
        {
            "id": "paper-health-wallet",
            "name": "Digital Health Record Wallet",
            "description": "Organized digital vault for all medical records with vaccine tracker and reminder calendar.",
            "price": 599,
            "compare_price": 799,
            "category": "paperwork",
            "product_type": "medical",
            "tags": ["paperwork", "medical", "digital", "health"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        },
        {
            "id": "paper-health-folder",
            "name": "TDC Health File Folder",
            "description": "Premium branded folder with dividers for vaccination, vet notes, lab reports, and prescriptions.",
            "price": 449,
            "compare_price": 599,
            "category": "paperwork",
            "product_type": "medical",
            "tags": ["paperwork", "medical", "folder", "physical"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 7,
            "is_birthday_perk": False
        },
        {
            "id": "paper-vaccine-booklet",
            "name": "Vaccination Booklet Holder",
            "description": "Waterproof holder for vaccination booklet with reminder card slots.",
            "price": 249,
            "compare_price": 349,
            "category": "paperwork",
            "product_type": "medical",
            "tags": ["paperwork", "medical", "vaccination", "holder"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 4,
            "is_birthday_perk": False
        },
        {
            "id": "paper-waterproof-sleeve",
            "name": "Waterproof Document Sleeve",
            "description": "Clear, waterproof sleeve for important documents. Perfect for travel and emergencies.",
            "price": 199,
            "compare_price": 299,
            "category": "paperwork",
            "product_type": "medical",
            "tags": ["paperwork", "waterproof", "sleeve", "travel"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 3,
            "is_birthday_perk": False
        },
        # Travel Documentation Products
        {
            "id": "paper-travel-doc-kit",
            "name": "TDC Travel Document Kit",
            "description": "Complete kit: checklist, vaccine summary template, health cert holder, microchip sleeve, and document pouch.",
            "price": 899,
            "compare_price": 1199,
            "category": "paperwork",
            "product_type": "travel",
            "tags": ["paperwork", "travel", "kit", "documents"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 15,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15
        },
        {
            "id": "paper-travel-pouch",
            "name": "Travel Document Pouch",
            "description": "Compact, organized pouch for airline/rail documents, health certificates, and travel permits.",
            "price": 399,
            "compare_price": 549,
            "category": "paperwork",
            "product_type": "travel",
            "tags": ["paperwork", "travel", "pouch", "airline"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": False
        },
        # Emergency Products
        {
            "id": "paper-emergency-wallet",
            "name": "Emergency Document Wallet",
            "description": "Waterproof wallet with slots for vet details, emergency contacts, microchip info, and photo ID.",
            "price": 349,
            "compare_price": 449,
            "category": "paperwork",
            "product_type": "emergency",
            "tags": ["paperwork", "emergency", "wallet", "safety"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": False
        },
        {
            "id": "paper-lost-pet-kit",
            "name": "Lost Pet Alert Kit",
            "description": "QR tag, printable poster templates, step-by-step checklist, helpline template, and community alert draft.",
            "price": 599,
            "compare_price": 799,
            "category": "paperwork",
            "product_type": "emergency",
            "tags": ["paperwork", "emergency", "lost", "alert"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 10,
            "is_birthday_perk": False
        },
        {
            "id": "paper-emergency-contact-card",
            "name": "Emergency Contact Cards (Pack of 5)",
            "description": "Laminated cards with pet photo, owner details, vet info, and medical alerts. Attach to collar, carrier, or wallet.",
            "price": 199,
            "compare_price": 299,
            "category": "paperwork",
            "product_type": "emergency",
            "tags": ["paperwork", "emergency", "contact", "cards"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 4,
            "is_birthday_perk": False
        },
        # Insurance & Compliance
        {
            "id": "paper-insurance-organizer",
            "name": "Pet Insurance Document Organizer",
            "description": "Folder with sections for policy, claims, receipts. Includes renewal reminder setup.",
            "price": 349,
            "compare_price": 449,
            "category": "paperwork",
            "product_type": "insurance",
            "tags": ["paperwork", "insurance", "organizer", "policy"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 6,
            "is_birthday_perk": False
        },
        {
            "id": "paper-compliance-checklist",
            "name": "Annual Compliance Checklist",
            "description": "Digital + printable checklist for licenses, registrations, vaccinations, and renewals.",
            "price": 149,
            "compare_price": 199,
            "category": "paperwork",
            "product_type": "legal",
            "tags": ["paperwork", "compliance", "checklist", "annual"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 3,
            "is_birthday_perk": False
        }
    ]
    
    # Sample Bundles
    default_bundles = [
        {
            "id": "paper-bundle-starter",
            "name": "Paw Papers Starter Pack",
            "description": "For new pet parents. TDC Health File Folder, QR ID tag, Digital Health Wallet access, first vaccination reminder setup, and printable emergency contact sheet.",
            "items": ["paper-health-folder", "paper-qr-tag", "paper-health-wallet", "paper-emergency-contact-card"],
            "includes_service": True,
            "service_type": "document_organization",
            "price": 1299,
            "original_price": 1646,
            "paw_reward_points": 30,
            "is_recommended": True,
            "is_birthday_perk": False,
            "for_new_pet_parents": True,
            "is_active": True
        },
        {
            "id": "paper-bundle-travel",
            "name": "Travel Ready Pack",
            "description": "For travelers. Travel Document Kit, waterproof document sleeve, QR ID tag, digital travel checklist, and auto-reminder for vaccines before travel.",
            "items": ["paper-travel-doc-kit", "paper-waterproof-sleeve", "paper-qr-tag"],
            "includes_service": True,
            "service_type": "travel_document_prep",
            "price": 1499,
            "original_price": 1797,
            "paw_reward_points": 35,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 15,
            "is_active": True
        },
        {
            "id": "paper-bundle-emergency",
            "name": "Emergency & Lost Pet Pack",
            "description": "For peace of mind. Emergency document wallet, QR ID tag, lost pet poster template, step-by-step checklist, and digital alert setup in app.",
            "items": ["paper-emergency-wallet", "paper-qr-tag", "paper-lost-pet-kit"],
            "includes_service": True,
            "service_type": "emergency_prep",
            "price": 1199,
            "original_price": 1447,
            "paw_reward_points": 28,
            "is_recommended": True,
            "is_birthday_perk": False,
            "is_active": True
        },
        {
            "id": "paper-bundle-lifetime",
            "name": "Lifetime Health File",
            "description": "Premium package. Digital Health Vault setup, physical health file, annual reminder calendar, vaccine tracker, upload slots for all records, and concierge-assisted document organization.",
            "items": ["paper-health-wallet", "paper-health-folder", "paper-vaccine-booklet", "paper-waterproof-sleeve"],
            "includes_service": True,
            "service_type": "full_document_management",
            "price": 1999,
            "original_price": 2496,
            "paw_reward_points": 50,
            "is_recommended": True,
            "is_birthday_perk": True,
            "birthday_discount_percent": 20,
            "is_premium": True,
            "is_active": True
        },
        {
            "id": "paper-bundle-digital",
            "name": "Digital Document Suite",
            "description": "Go paperless. Digital Health Wallet, Smart ID Card, compliance checklist, and full app access with unlimited document uploads.",
            "items": ["paper-health-wallet", "paper-smart-id-card", "paper-compliance-checklist"],
            "includes_service": False,
            "price": 899,
            "original_price": 1047,
            "paw_reward_points": 20,
            "is_recommended": False,
            "is_birthday_perk": False,
            "is_active": True
        }
    ]
    
    # Insert data
    for product in default_products:
        product["created_at"] = datetime.now(timezone.utc).isoformat()
        product["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.products.update_one({"id": product["id"]}, {"$set": product}, upsert=True)
    
    for bundle in default_bundles:
        bundle["created_at"] = datetime.now(timezone.utc).isoformat()
        bundle["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.paperwork_bundles.update_one({"id": bundle["id"]}, {"$set": bundle}, upsert=True)
    
    logger.info(f"Seeded PAPERWORK pillar: {len(default_products)} products, {len(default_bundles)} bundles")
    
    return {
        "message": "PAPERWORK pillar data seeded successfully",
        "products_seeded": len(default_products),
        "bundles_seeded": len(default_bundles)
    }



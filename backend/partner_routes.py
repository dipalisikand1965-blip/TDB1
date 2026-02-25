"""
Partner Onboarding Routes
Handles partner/vendor onboarding for The Doggy Company
Partners can include: restaurants, stay providers, groomers, vets, etc.
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import os

# Database reference - will be set from server.py
db = None
verify_admin = None

def set_partner_db(database):
    global db
    db = database

def set_partner_admin_verify(verify_func):
    global verify_admin
    verify_admin = verify_func

router = APIRouter(prefix="/api/partners", tags=["Partners"])
admin_router = APIRouter(prefix="/api/admin/partners", tags=["Partner Admin"])

security = HTTPBasic()

# ==================== MODELS ====================

class PartnerApplication(BaseModel):
    business_name: str
    contact_name: str
    email: str
    phone: str
    partner_type: str  # restaurant, stay, groomer, vet, trainer, etc.
    city: str
    address: Optional[str] = None
    website: Optional[str] = None
    instagram: Optional[str] = None
    description: str
    pet_friendly_features: Optional[List[str]] = []
    operating_hours: Optional[str] = None
    seating_capacity: Optional[int] = None  # For restaurants
    room_capacity: Optional[int] = None  # For stays
    services_offered: Optional[List[str]] = []
    price_range: Optional[str] = None  # budget, mid, premium
    photos: Optional[List[str]] = []
    how_heard_about_us: Optional[str] = None
    additional_notes: Optional[str] = None
    # Document fields
    documents: Optional[dict] = None  # {gst_number, pan_number, has_gst_doc, has_pan_doc, has_business_license}
    # Agreement fields
    agreement: Optional[dict] = None  # {accepted, signature_name, signature_date, signed_at}

class PartnerUpdate(BaseModel):
    status: Optional[str] = None  # pending, reviewing, approved, rejected, active, inactive
    admin_notes: Optional[str] = None
    assigned_to: Optional[str] = None
    commission_rate: Optional[float] = None
    contract_signed: Optional[bool] = None
    onboarding_completed: Optional[bool] = None
    featured: Optional[bool] = None

# ==================== PUBLIC ROUTES ====================

@router.post("/apply")
async def submit_partner_application(application: PartnerApplication):
    """Submit a new partner application"""
    
    # Check if email already exists
    existing = await db.partner_applications.find_one({"email": application.email})
    if existing and existing.get("status") not in ["rejected"]:
        raise HTTPException(
            status_code=400, 
            detail="An application with this email already exists. Please contact us for status updates."
        )
    
    now = datetime.now(timezone.utc).isoformat()
    
    application_doc = {
        "id": f"partner-{uuid.uuid4().hex[:12]}",
        **application.model_dump(),
        "status": "pending",
        "admin_notes": "",
        "assigned_to": None,
        "commission_rate": None,
        "contract_signed": False,
        "onboarding_completed": False,
        "featured": False,
        "created_at": now,
        "updated_at": now,
        "reviewed_at": None,
        "approved_at": None
    }
    
    await db.partner_applications.insert_one(application_doc)
    
    # TODO: Send confirmation email to applicant
    # TODO: Create admin notification
    
    return {
        "success": True,
        "application_id": application_doc["id"],
        "message": "Thank you for your application! Our team will review it and contact you within 3-5 business days."
    }

@router.get("/types")
async def get_partner_types():
    """Get available partner types"""
    return {
        "partner_types": [
            {"id": "restaurant", "name": "Restaurant / Café", "icon": "Utensils"},
            {"id": "stay", "name": "Pet Hotel / Boarding", "icon": "Home"},
            {"id": "groomer", "name": "Grooming Salon", "icon": "Scissors"},
            {"id": "vet", "name": "Veterinary Clinic", "icon": "Stethoscope"},
            {"id": "trainer", "name": "Pet Trainer", "icon": "GraduationCap"},
            {"id": "daycare", "name": "Pet Daycare", "icon": "Sun"},
            {"id": "transport", "name": "Pet Transport", "icon": "Truck"},
            {"id": "photographer", "name": "Pet Photographer", "icon": "Camera"},
            {"id": "walker", "name": "Dog Walker", "icon": "Footprints"},
            {"id": "other", "name": "Other", "icon": "Star"}
        ]
    }

@router.get("/check-status/{email}")
async def check_application_status(email: str):
    """Check application status by email"""
    application = await db.partner_applications.find_one(
        {"email": email.lower()},
        {"_id": 0, "id": 1, "business_name": 1, "status": 1, "created_at": 1, "reviewed_at": 1}
    )
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    status_messages = {
        "pending": "Your application is pending review. We'll contact you soon!",
        "reviewing": "Your application is currently being reviewed by our team.",
        "approved": "Congratulations! Your application has been approved. We'll contact you for next steps.",
        "rejected": "Unfortunately, your application was not approved at this time. Please contact us for details.",
        "active": "You're an active partner! Welcome to The Doggy Company family.",
        "inactive": "Your partner account is currently inactive. Please contact us for assistance."
    }
    
    return {
        "application_id": application["id"],
        "business_name": application["business_name"],
        "status": application["status"],
        "message": status_messages.get(application["status"], "Status unknown"),
        "submitted_at": application["created_at"],
        "reviewed_at": application.get("reviewed_at")
    }

# ==================== ADMIN ROUTES ====================

@admin_router.get("")
async def get_partner_applications(
    status: Optional[str] = None,
    partner_type: Optional[str] = None,
    city: Optional[str] = None,
    limit: int = 50,
    username: str = Depends(lambda: verify_admin)
):
    """Get all partner applications with filters"""
    
    query = {}
    if status:
        query["status"] = status
    if partner_type:
        query["partner_type"] = partner_type
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    
    applications = await db.partner_applications.find(
        query, {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get stats
    stats = {
        "total": await db.partner_applications.count_documents({}),
        "pending": await db.partner_applications.count_documents({"status": "pending"}),
        "reviewing": await db.partner_applications.count_documents({"status": "reviewing"}),
        "approved": await db.partner_applications.count_documents({"status": "approved"}),
        "active": await db.partner_applications.count_documents({"status": "active"}),
        "rejected": await db.partner_applications.count_documents({"status": "rejected"})
    }
    
    return {"applications": applications, "stats": stats}

@admin_router.get("/{partner_id}")
async def get_partner_application(partner_id: str, username: str = Depends(lambda: verify_admin)):
    """Get a single partner application"""
    application = await db.partner_applications.find_one({"id": partner_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"application": application}

@admin_router.put("/{partner_id}")
async def update_partner_application(
    partner_id: str, 
    update: PartnerUpdate,
    username: str = Depends(lambda: verify_admin)
):
    """Update partner application status and details"""
    application = await db.partner_applications.find_one({"id": partner_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Track status changes
    if "status" in update_data:
        if update_data["status"] in ["reviewing", "approved", "rejected"]:
            update_data["reviewed_at"] = datetime.now(timezone.utc).isoformat()
        if update_data["status"] == "approved":
            update_data["approved_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.partner_applications.update_one(
        {"id": partner_id},
        {"$set": update_data}
    )
    
    updated = await db.partner_applications.find_one({"id": partner_id}, {"_id": 0})
    return {"application": updated}

@admin_router.delete("/{partner_id}")
async def delete_partner_application(partner_id: str, username: str = Depends(lambda: verify_admin)):
    """Delete a partner application"""
    result = await db.partner_applications.delete_one({"id": partner_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"message": "Application deleted"}

@admin_router.post("/{partner_id}/convert-to-listing")
async def convert_to_listing(partner_id: str, username: str = Depends(lambda: verify_admin)):
    """Convert approved partner application to actual listing (restaurant, stay, etc.)"""
    application = await db.partner_applications.find_one({"id": partner_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if application.get("status") != "approved":
        raise HTTPException(status_code=400, detail="Only approved applications can be converted")
    
    partner_type = application.get("partner_type")
    now = datetime.now(timezone.utc).isoformat()
    
    # Create listing based on partner type
    if partner_type == "restaurant":
        listing = {
            "id": f"rest-{uuid.uuid4().hex[:8]}",
            "name": application["business_name"],
            "location": application["city"],
            "address": application.get("address", ""),
            "cuisine": "Pet-Friendly",
            "rating": 0,
            "reviews": 0,
            "price_range": application.get("price_range", "mid"),
            "pet_friendly": True,
            "features": application.get("pet_friendly_features", []),
            "image": application.get("photos", [None])[0],
            "images": application.get("photos", []),
            "description": application.get("description", ""),
            "contact": {
                "phone": application["phone"],
                "email": application["email"],
                "website": application.get("website"),
                "instagram": application.get("instagram")
            },
            "operating_hours": application.get("operating_hours", "10 AM - 10 PM"),
            "seating_capacity": application.get("seating_capacity"),
            "from_partner": True,
            "partner_id": partner_id,
            "status": "active",
            "created_at": now,
            "updated_at": now
        }
        await db.restaurants.insert_one(listing)
        listing_collection = "restaurants"
        
    elif partner_type == "stay":
        listing = {
            "id": f"stay-{uuid.uuid4().hex[:8]}",
            "name": application["business_name"],
            "location": application["city"],
            "address": application.get("address", ""),
            "type": "boarding",
            "rating": 0,
            "reviews": 0,
            "price_range": application.get("price_range", "mid"),
            "features": application.get("pet_friendly_features", []),
            "image": application.get("photos", [None])[0],
            "images": application.get("photos", []),
            "description": application.get("description", ""),
            "contact": {
                "phone": application["phone"],
                "email": application["email"],
                "website": application.get("website")
            },
            "capacity": application.get("room_capacity"),
            "services": application.get("services_offered", []),
            "from_partner": True,
            "partner_id": partner_id,
            "status": "active",
            "created_at": now,
            "updated_at": now
        }
        await db.stays.insert_one(listing)
        listing_collection = "stays"
        
    else:
        # Generic service listing
        listing = {
            "id": f"svc-{uuid.uuid4().hex[:8]}",
            "name": application["business_name"],
            "type": partner_type,
            "location": application["city"],
            "address": application.get("address", ""),
            "rating": 0,
            "reviews": 0,
            "price_range": application.get("price_range", "mid"),
            "features": application.get("pet_friendly_features", []),
            "image": application.get("photos", [None])[0],
            "images": application.get("photos", []),
            "description": application.get("description", ""),
            "contact": {
                "phone": application["phone"],
                "email": application["email"],
                "website": application.get("website")
            },
            "services": application.get("services_offered", []),
            "from_partner": True,
            "partner_id": partner_id,
            "status": "active",
            "created_at": now,
            "updated_at": now
        }
        await db.services_master.insert_one(listing)
        listing_collection = "services"
    
    # Update application status
    await db.partner_applications.update_one(
        {"id": partner_id},
        {"$set": {
            "status": "active",
            "listing_id": listing["id"],
            "listing_collection": listing_collection,
            "updated_at": now
        }}
    )
    
    return {
        "success": True,
        "listing_id": listing["id"],
        "listing_collection": listing_collection,
        "message": f"Partner converted to {listing_collection} listing"
    }

# ==================== CSV EXPORT/IMPORT ====================

@admin_router.get("/export/csv")
async def export_partners_csv(username: str = Depends(lambda: verify_admin)):
    """Export partner applications as CSV data"""
    applications = await db.partner_applications.find({}, {"_id": 0}).to_list(10000)
    return {"applications": applications, "total": len(applications)}

@admin_router.post("/import-csv")
async def import_partners_csv_file(
    file: UploadFile = File(...),
    username: str = Depends(lambda: verify_admin)
):
    """Import partner applications from CSV file"""
    import csv
    import io
    
    content = await file.read()
    text = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text))
    
    imported = 0
    for row in reader:
        email = row.get("email") or row.get("Email")
        if not email:
            continue
            
        existing = await db.partner_applications.find_one({"email": email})
        if existing:
            continue
            
        now = datetime.now(timezone.utc).isoformat()
        application_doc = {
            "id": f"partner-{uuid.uuid4().hex[:12]}",
            "business_name": row.get("business_name") or row.get("Business Name") or "Unknown",
            "contact_name": row.get("contact_name") or row.get("Contact Name") or "",
            "email": email,
            "phone": row.get("phone") or row.get("Phone") or "",
            "partner_type": row.get("partner_type") or row.get("Type") or "other",
            "city": row.get("city") or row.get("City") or "",
            "address": row.get("address") or row.get("Address") or "",
            "description": row.get("description") or row.get("Description") or "",
            "status": row.get("status") or row.get("Status") or "pending",
            "created_at": now,
            "updated_at": now
        }
        await db.partner_applications.insert_one(application_doc)
        imported += 1
    
    return {"imported": imported, "message": f"Successfully imported {imported} partner applications"}

@admin_router.post("/import/csv")
async def import_partners_csv(data: dict, username: str = Depends(lambda: verify_admin)):
    """Import partner applications from CSV data (JSON format)"""
    applications = data.get("applications", [])
    imported = 0
    
    for app_data in applications:
        if not app_data.get("email"):
            continue
            
        existing = await db.partner_applications.find_one({"email": app_data["email"]})
        if existing:
            continue
            
        now = datetime.now(timezone.utc).isoformat()
        application_doc = {
            "id": f"partner-{uuid.uuid4().hex[:12]}",
            "business_name": app_data.get("business_name", "Unknown"),
            "contact_name": app_data.get("contact_name", ""),
            "email": app_data["email"],
            "phone": app_data.get("phone", ""),
            "partner_type": app_data.get("partner_type", "other"),
            "city": app_data.get("city", ""),
            "address": app_data.get("address"),
            "description": app_data.get("description", ""),
            "status": app_data.get("status", "pending"),
            "created_at": now,
            "updated_at": now
        }
        await db.partner_applications.insert_one(application_doc)
        imported += 1
    
    return {"imported": imported}


# ==================== DOCUMENT VERIFICATION ====================

class DocumentVerification(BaseModel):
    gst_verified: Optional[bool] = None
    pan_verified: Optional[bool] = None
    business_license_verified: Optional[bool] = None
    verification_notes: Optional[str] = None

@admin_router.put("/{partner_id}/verify-documents")
async def verify_partner_documents(
    partner_id: str,
    verification: DocumentVerification,
    username: str = Depends(lambda: verify_admin)
):
    """Verify partner documents (GST, PAN, etc.)"""
    application = await db.partner_applications.find_one({"id": partner_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Build document verification status
    doc_status = application.get("document_verification", {})
    update_data = {}
    
    if verification.gst_verified is not None:
        doc_status["gst_verified"] = verification.gst_verified
        doc_status["gst_verified_at"] = now
        doc_status["gst_verified_by"] = username
        
    if verification.pan_verified is not None:
        doc_status["pan_verified"] = verification.pan_verified
        doc_status["pan_verified_at"] = now
        doc_status["pan_verified_by"] = username
        
    if verification.business_license_verified is not None:
        doc_status["business_license_verified"] = verification.business_license_verified
        doc_status["business_license_verified_at"] = now
        doc_status["business_license_verified_by"] = username
        
    if verification.verification_notes:
        doc_status["notes"] = verification.verification_notes
    
    # Check if all required documents are verified
    all_verified = (
        doc_status.get("gst_verified", False) and 
        doc_status.get("pan_verified", False)
    )
    doc_status["all_verified"] = all_verified
    
    update_data["document_verification"] = doc_status
    update_data["updated_at"] = now
    
    await db.partner_applications.update_one(
        {"id": partner_id},
        {"$set": update_data}
    )
    
    updated = await db.partner_applications.find_one({"id": partner_id}, {"_id": 0})
    return {"application": updated, "all_documents_verified": all_verified}


# ==================== APPROVAL/REJECTION WORKFLOW ====================

class ApprovalAction(BaseModel):
    action: str  # approve, reject, request_info
    reason: Optional[str] = None
    admin_notes: Optional[str] = None
    commission_rate: Optional[float] = None

# Email sending function - will be set from server.py
send_partner_email = None

def set_partner_email_func(email_func):
    global send_partner_email
    send_partner_email = email_func

@admin_router.post("/{partner_id}/action")
async def process_partner_action(
    partner_id: str,
    action_data: ApprovalAction,
    username: str = Depends(lambda: verify_admin)
):
    """Process approval, rejection, or request for more info"""
    application = await db.partner_applications.find_one({"id": partner_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {"updated_at": now}
    email_subject = ""
    email_body = ""
    
    if action_data.action == "approve":
        update_data["status"] = "approved"
        update_data["approved_at"] = now
        update_data["approved_by"] = username
        if action_data.commission_rate:
            update_data["commission_rate"] = action_data.commission_rate
        if action_data.admin_notes:
            update_data["admin_notes"] = action_data.admin_notes
            
        email_subject = "🎉 Congratulations! Your Partner Application is Approved"
        email_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">🎉 Application Approved!</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
                <h2>Welcome to The Doggy Company Family!</h2>
                <p>Hi {application.get('contact_name', 'Partner')},</p>
                <p>We're thrilled to inform you that your application for <strong>{application.get('business_name')}</strong> has been approved!</p>
                <p>Our onboarding team will contact you within 2-3 business days to complete the setup process.</p>
                {f'<p><strong>Note from our team:</strong> {action_data.reason}</p>' if action_data.reason else ''}
                <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #16a34a; margin-top: 0;">What happens next?</h3>
                    <ul>
                        <li>Our team will verify your documents</li>
                        <li>We'll set up your listing on our platform</li>
                        <li>Training materials will be shared</li>
                        <li>You'll receive access to the partner dashboard</li>
                    </ul>
                </div>
                <p>If you have any questions, reply to this email or contact us at woof@thedoggycompany.in</p>
            </div>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                The Doggy Company | woof@thedoggycompany.in
            </div>
        </div>
        """
        
    elif action_data.action == "reject":
        update_data["status"] = "rejected"
        update_data["rejected_at"] = now
        update_data["rejected_by"] = username
        update_data["rejection_reason"] = action_data.reason
        if action_data.admin_notes:
            update_data["admin_notes"] = action_data.admin_notes
            
        email_subject = "Update on Your Partner Application"
        email_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #722282; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">🐕 The Doggy Company</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
                <h2>Application Update</h2>
                <p>Hi {application.get('contact_name', 'Partner')},</p>
                <p>Thank you for your interest in partnering with The Doggy Company.</p>
                <p>After careful review, we regret to inform you that we're unable to move forward with your application for <strong>{application.get('business_name')}</strong> at this time.</p>
                {f'<p><strong>Reason:</strong> {action_data.reason}</p>' if action_data.reason else ''}
                <p>This decision was based on our current requirements and operational capacity. We encourage you to apply again in the future as our needs evolve.</p>
                <p>If you have questions or would like feedback, please contact us at woof@thedoggycompany.in</p>
            </div>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                The Doggy Company | woof@thedoggycompany.in
            </div>
        </div>
        """
        
    elif action_data.action == "request_info":
        update_data["status"] = "reviewing"
        update_data["info_requested_at"] = now
        update_data["info_requested_by"] = username
        update_data["info_request_reason"] = action_data.reason
        if action_data.admin_notes:
            update_data["admin_notes"] = action_data.admin_notes
            
        email_subject = "Additional Information Required - Partner Application"
        email_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f59e0b; padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">📋 Information Needed</h1>
            </div>
            <div style="padding: 30px; background: #fff;">
                <h2>We Need More Information</h2>
                <p>Hi {application.get('contact_name', 'Partner')},</p>
                <p>Thank you for applying to partner with The Doggy Company.</p>
                <p>To continue processing your application for <strong>{application.get('business_name')}</strong>, we need some additional information:</p>
                <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0;"><strong>{action_data.reason}</strong></p>
                </div>
                <p>Please reply to this email with the requested information, or contact us if you have any questions.</p>
            </div>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #666;">
                The Doggy Company | woof@thedoggycompany.in
            </div>
        </div>
        """
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use: approve, reject, or request_info")
    
    # Update the application
    await db.partner_applications.update_one(
        {"id": partner_id},
        {"$set": update_data}
    )
    
    # Send email notification
    email_sent = False
    if send_partner_email and application.get("email"):
        try:
            await send_partner_email(
                to_email=application["email"],
                subject=email_subject,
                html_content=email_body
            )
            email_sent = True
        except Exception as e:
            print(f"Error sending partner email: {e}")
    
    # Create notification for admin
    notification = {
        "id": f"notif-{uuid.uuid4().hex[:8]}",
        "type": f"partner_{action_data.action}",
        "title": f"Partner {action_data.action.title()}: {application.get('business_name')}",
        "message": f"{username} {action_data.action}ed {application.get('business_name')} ({application.get('partner_type')})",
        "partner_id": partner_id,
        "created_by": username,
        "read": False,
        "created_at": now
    }
    await db.admin_notifications.insert_one(notification)
    
    updated = await db.partner_applications.find_one({"id": partner_id}, {"_id": 0})
    return {
        "success": True,
        "action": action_data.action,
        "application": updated,
        "email_sent": email_sent
    }


@admin_router.get("/{partner_id}/history")
async def get_partner_history(partner_id: str, username: str = Depends(lambda: verify_admin)):
    """Get action history for a partner application"""
    application = await db.partner_applications.find_one({"id": partner_id})
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Build history from application data
    history = []
    
    history.append({
        "action": "submitted",
        "timestamp": application.get("created_at"),
        "by": application.get("email")
    })
    
    if application.get("reviewed_at"):
        history.append({
            "action": "reviewed",
            "timestamp": application.get("reviewed_at"),
            "by": application.get("reviewed_by", "Admin")
        })
    
    if application.get("info_requested_at"):
        history.append({
            "action": "info_requested",
            "timestamp": application.get("info_requested_at"),
            "by": application.get("info_requested_by"),
            "reason": application.get("info_request_reason")
        })
    
    if application.get("approved_at"):
        history.append({
            "action": "approved",
            "timestamp": application.get("approved_at"),
            "by": application.get("approved_by")
        })
    
    if application.get("rejected_at"):
        history.append({
            "action": "rejected",
            "timestamp": application.get("rejected_at"),
            "by": application.get("rejected_by"),
            "reason": application.get("rejection_reason")
        })
    
    # Document verification history
    doc_verify = application.get("document_verification", {})
    if doc_verify.get("gst_verified_at"):
        history.append({
            "action": "gst_verified" if doc_verify.get("gst_verified") else "gst_rejected",
            "timestamp": doc_verify.get("gst_verified_at"),
            "by": doc_verify.get("gst_verified_by")
        })
    
    if doc_verify.get("pan_verified_at"):
        history.append({
            "action": "pan_verified" if doc_verify.get("pan_verified") else "pan_rejected",
            "timestamp": doc_verify.get("pan_verified_at"),
            "by": doc_verify.get("pan_verified_by")
        })
    
    # Sort by timestamp
    history.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return {"history": history}


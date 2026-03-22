"""
Pet Vault Routes - Health Records, Vaccines, Medications & Vet Info
The Doggy Company's comprehensive pet health management system
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import logging
import uuid
import os

logger = logging.getLogger(__name__)

pet_vault_router = APIRouter(prefix="/pet-vault", tags=["Pet Vault"])

# Admin router for pet vault
pet_vault_admin_router = APIRouter(tags=["Pet Vault Admin"])

# Database reference (will be set from server.py)
db = None

def set_pet_vault_db(database):
    global db
    db = database


# ============================================
# PYDANTIC MODELS
# ============================================

class VaccineRecord(BaseModel):
    id: Optional[str] = None
    vaccine_name: str
    date_given: str  # ISO date
    next_due_date: Optional[str] = None  # ISO date
    vet_name: Optional[str] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None
    reminder_enabled: bool = True
    
class MedicationRecord(BaseModel):
    id: Optional[str] = None
    medication_name: str
    dosage: str
    frequency: str  # e.g., "twice daily", "once weekly"
    start_date: str  # ISO date
    end_date: Optional[str] = None  # ISO date
    prescribing_vet: Optional[str] = None
    reason: Optional[str] = None
    refill_reminder_enabled: bool = True
    notes: Optional[str] = None

class VetVisit(BaseModel):
    id: Optional[str] = None
    visit_date: str  # ISO date
    vet_name: str
    clinic_name: Optional[str] = None
    reason: str
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    follow_up_date: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None
    documents: List[str] = []  # List of document URLs

class VetInfo(BaseModel):
    id: Optional[str] = None
    name: str
    clinic_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    specialization: Optional[str] = None
    is_primary: bool = False
    notes: Optional[str] = None

class HealthDocument(BaseModel):
    id: Optional[str] = None
    name: str
    document_type: str  # "prescription", "lab_report", "xray", "certificate", "other"
    file_url: str
    uploaded_at: Optional[str] = None
    related_visit_id: Optional[str] = None
    notes: Optional[str] = None

class WeightRecord(BaseModel):
    date: str  # ISO date
    weight_kg: float
    notes: Optional[str] = None


class AllergyRecord(BaseModel):
    name: str
    allergy_type: str = "food"   # "food", "environmental", "medication"
    confirmed_by: Optional[str] = None
    date: Optional[str] = None
    severity: Optional[str] = None   # "mild", "moderate", "severe"
    notes: Optional[str] = None


# ============================================
# VACCINE ENDPOINTS
# ============================================

@pet_vault_router.get("/{pet_id}/vaccines")
async def get_vaccines(pet_id: str):
    """Get all vaccine records for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "vault": 1, "name": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    vaccines = pet.get("vault", {}).get("vaccines", [])
    
    # Calculate upcoming due vaccines
    today = datetime.now(timezone.utc).date()
    upcoming = []
    overdue = []
    
    for v in vaccines:
        if v.get("next_due_date"):
            try:
                due_date = datetime.fromisoformat(v["next_due_date"].replace("Z", "+00:00")).date()
                days_until = (due_date - today).days
                v["days_until_due"] = days_until
                
                if days_until < 0:
                    overdue.append(v)
                elif days_until <= 30:
                    upcoming.append(v)
            except:
                pass
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "vaccines": vaccines,
        "upcoming_vaccines": upcoming,
        "overdue_vaccines": overdue,
        "total": len(vaccines)
    }

@pet_vault_router.post("/{pet_id}/vaccines")
async def add_vaccine(pet_id: str, vaccine: VaccineRecord):
    """Add a new vaccine record"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    vaccine_doc = vaccine.dict()
    vaccine_doc["id"] = f"vax-{uuid.uuid4().hex[:8]}"
    vaccine_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.pets.update_one(
        {"id": pet_id},
        {"$push": {"vault.vaccines": vaccine_doc}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Create reminder if enabled and has due date
    if vaccine.reminder_enabled and vaccine.next_due_date:
        await create_health_reminder(
            pet_id=pet_id,
            reminder_type="vaccine",
            item_id=vaccine_doc["id"],
            item_name=vaccine.vaccine_name,
            due_date=vaccine.next_due_date
        )
    
    return {"message": "Vaccine record added", "vaccine": vaccine_doc}

@pet_vault_router.delete("/{pet_id}/vaccines/{vaccine_id}")
async def delete_vaccine(pet_id: str, vaccine_id: str):
    """Delete a vaccine record"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    result = await db.pets.update_one(
        {"id": pet_id},
        {"$pull": {"vault.vaccines": {"id": vaccine_id}}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vaccine record not found")
    
    # Also delete associated reminder
    await db.health_reminders.delete_many({"pet_id": pet_id, "item_id": vaccine_id})
    
    return {"message": "Vaccine record deleted"}


# ============================================
# MEDICATION ENDPOINTS
# ============================================

@pet_vault_router.get("/{pet_id}/medications")
async def get_medications(pet_id: str, active_only: bool = False):
    """Get all medication records for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "vault": 1, "name": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    medications = pet.get("vault", {}).get("medications", [])
    
    # Filter active medications
    today = datetime.now(timezone.utc).date().isoformat()
    active_meds = []
    past_meds = []
    
    for m in medications:
        end_date = m.get("end_date")
        if not end_date or end_date >= today:
            active_meds.append(m)
        else:
            past_meds.append(m)
    
    if active_only:
        return {"pet_id": pet_id, "medications": active_meds, "total": len(active_meds)}
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "medications": medications,
        "active_medications": active_meds,
        "past_medications": past_meds,
        "total": len(medications)
    }

@pet_vault_router.post("/{pet_id}/medications")
async def add_medication(pet_id: str, medication: MedicationRecord):
    """Add a new medication record"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    med_doc = medication.dict()
    med_doc["id"] = f"med-{uuid.uuid4().hex[:8]}"
    med_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.pets.update_one(
        {"id": pet_id},
        {"$push": {"vault.medications": med_doc}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"message": "Medication record added", "medication": med_doc}

@pet_vault_router.put("/{pet_id}/medications/{medication_id}")
async def update_medication(pet_id: str, medication_id: str, medication: MedicationRecord):
    """Update a medication record"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    med_doc = medication.dict()
    med_doc["id"] = medication_id
    med_doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.pets.update_one(
        {"id": pet_id, "vault.medications.id": medication_id},
        {"$set": {"vault.medications.$": med_doc}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Medication record not found")
    
    return {"message": "Medication record updated", "medication": med_doc}


# ============================================
# VET VISIT ENDPOINTS
# ============================================

@pet_vault_router.get("/{pet_id}/visits")
async def get_vet_visits(pet_id: str, limit: int = 20):
    """Get all vet visit records for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "vault": 1, "name": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    visits = pet.get("vault", {}).get("vet_visits", [])
    
    # Sort by date (most recent first)
    visits.sort(key=lambda x: x.get("visit_date", ""), reverse=True)
    
    # Check for upcoming follow-ups
    today = datetime.now(timezone.utc).date().isoformat()
    upcoming_followups = [v for v in visits if v.get("follow_up_date") and v["follow_up_date"] >= today]
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "visits": visits[:limit],
        "upcoming_followups": upcoming_followups,
        "total": len(visits)
    }

@pet_vault_router.post("/{pet_id}/visits")
async def add_vet_visit(pet_id: str, visit: VetVisit):
    """Add a new vet visit record"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    visit_doc = visit.dict()
    visit_doc["id"] = f"visit-{uuid.uuid4().hex[:8]}"
    visit_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.pets.update_one(
        {"id": pet_id},
        {"$push": {"vault.vet_visits": visit_doc}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Create follow-up reminder if specified
    if visit.follow_up_date:
        await create_health_reminder(
            pet_id=pet_id,
            reminder_type="follow_up",
            item_id=visit_doc["id"],
            item_name=f"Follow-up: {visit.reason}",
            due_date=visit.follow_up_date
        )
    
    return {"message": "Vet visit recorded", "visit": visit_doc}


# ============================================
# VET INFO ENDPOINTS
# ============================================

@pet_vault_router.get("/{pet_id}/vets")
async def get_vets(pet_id: str):
    """Get all saved vet information for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "vault": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    vets = pet.get("vault", {}).get("vets", [])
    primary_vet = next((v for v in vets if v.get("is_primary")), None)
    
    return {
        "pet_id": pet_id,
        "vets": vets,
        "primary_vet": primary_vet,
        "total": len(vets)
    }

@pet_vault_router.post("/{pet_id}/vets")
async def add_vet(pet_id: str, vet: VetInfo):
    """Add a new vet to pet's records"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    vet_doc = vet.dict()
    vet_doc["id"] = f"vet-{uuid.uuid4().hex[:8]}"
    vet_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    
    # If this is primary, unset other primaries first (only if vets array exists)
    if vet.is_primary:
        # Get current vets and update them
        pet = await db.pets.find_one({"id": pet_id}, {"vault.vets": 1})
        if pet and pet.get("vault", {}).get("vets"):
            # Update all existing vets to not be primary
            await db.pets.update_one(
                {"id": pet_id},
                {"$set": {"vault.vets.$[elem].is_primary": False}},
                array_filters=[{"elem.is_primary": True}]
            )
    
    result = await db.pets.update_one(
        {"id": pet_id},
        {"$push": {"vault.vets": vet_doc}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"message": "Vet added", "vet": vet_doc}


# ============================================
# WEIGHT TRACKING
# ============================================

@pet_vault_router.get("/{pet_id}/weight-history")
async def get_weight_history(pet_id: str):
    """Get weight history for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "vault": 1, "name": 1, "weight_kg": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    weight_history = pet.get("vault", {}).get("weight_history", [])
    weight_history.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    current_weight = pet.get("weight_kg") or (weight_history[0]["weight_kg"] if weight_history else None)
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "current_weight_kg": current_weight,
        "weight_history": weight_history,
        "total_records": len(weight_history)
    }

@pet_vault_router.post("/{pet_id}/weight")
async def add_weight_record(pet_id: str, record: WeightRecord):
    """Add a new weight record"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    weight_doc = record.dict()
    weight_doc["recorded_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"vault.weight_history": weight_doc},
            "$set": {"weight_kg": record.weight_kg}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"message": "Weight recorded", "record": weight_doc}


# ============================================
# HEALTH DOCUMENTS
# ============================================

@pet_vault_router.get("/{pet_id}/documents")
async def get_documents(pet_id: str, doc_type: Optional[str] = None):
    """Get all health documents for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "vault": 1, "name": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    documents = pet.get("vault", {}).get("documents", [])
    
    if doc_type:
        documents = [d for d in documents if d.get("document_type") == doc_type]
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "documents": documents,
        "total": len(documents)
    }

@pet_vault_router.post("/{pet_id}/documents")
async def add_document(pet_id: str, document: HealthDocument):
    """Add a new health document"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    doc = document.dict()
    doc["id"] = f"doc-{uuid.uuid4().hex[:8]}"
    doc["uploaded_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.pets.update_one(
        {"id": pet_id},
        {"$push": {"vault.documents": doc}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return {"message": "Document added", "document": doc}


# ============================================
# ALLERGY ENDPOINTS
# ============================================

@pet_vault_router.get("/{pet_id}/allergies")
async def get_allergies(pet_id: str):
    """Get all allergies and conditions for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "vault": 1, "name": 1})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    allergies = pet.get("vault", {}).get("allergies", [])
    return {"pet_id": pet_id, "allergies": allergies, "total": len(allergies)}


@pet_vault_router.post("/{pet_id}/allergies")
async def add_allergy(pet_id: str, allergy: AllergyRecord):
    """Add an allergy — also writes to doggy_soul_answers immediately"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    record = allergy.dict()
    record["id"] = f"alg-{uuid.uuid4().hex[:8]}"
    record["added_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.pets.update_one(
        {"id": pet_id},
        {"$push": {"vault.allergies": record}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pet not found")
    # Immediately update soul profile so Mira never suggests this allergen
    await db.pets.update_one(
        {"id": pet_id},
        {"$set": {"doggy_soul_answers.food_allergies": record["name"].lower()}}
    )
    return {"message": "Allergy recorded and soul profile updated", "allergy": record}




@pet_vault_router.get("/{pet_id}/summary")
async def get_health_summary(pet_id: str):
    """Get a complete health summary for a pet"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    vault = pet.get("vault", {})
    today = datetime.now(timezone.utc).date()
    
    # Get counts
    vaccines = vault.get("vaccines", [])
    medications = vault.get("medications", [])
    visits = vault.get("vet_visits", [])
    documents = vault.get("documents", [])
    vets = vault.get("vets", [])
    weight_history = vault.get("weight_history", [])
    
    # Calculate alerts
    alerts = []
    
    # Overdue vaccines
    for v in vaccines:
        if v.get("next_due_date"):
            try:
                due_date = datetime.fromisoformat(v["next_due_date"].replace("Z", "+00:00")).date()
                days = (due_date - today).days
                if days < 0:
                    alerts.append({
                        "type": "overdue_vaccine",
                        "severity": "high",
                        "message": f"{v['vaccine_name']} is overdue by {abs(days)} days",
                        "item_id": v["id"]
                    })
                elif days <= 14:
                    alerts.append({
                        "type": "upcoming_vaccine",
                        "severity": "medium",
                        "message": f"{v['vaccine_name']} due in {days} days",
                        "item_id": v["id"]
                    })
            except:
                pass
    
    # Active medications
    active_meds = []
    for m in medications:
        end_date = m.get("end_date")
        if not end_date or end_date >= today.isoformat():
            active_meds.append(m)
    
    # Upcoming follow-ups
    upcoming_followups = []
    for v in visits:
        if v.get("follow_up_date"):
            try:
                fu_date = datetime.fromisoformat(v["follow_up_date"].replace("Z", "+00:00")).date()
                if fu_date >= today and (fu_date - today).days <= 30:
                    upcoming_followups.append(v)
            except:
                pass
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "pet_breed": pet.get("breed"),
        "current_weight_kg": pet.get("weight_kg"),
        "microchip": pet.get("microchip"),
        "insurance": pet.get("insurance"),
        "passport": pet.get("passport"),
        "summary": {
            "total_vaccines": len(vaccines),
            "total_medications": len(medications),
            "active_medications": len(active_meds),
            "total_vet_visits": len(visits),
            "total_documents": len(documents),
            "saved_vets": len(vets)
        },
        "alerts": alerts,
        "allergies": vault.get("allergies", []),
        "active_medications": active_meds,
        "upcoming_followups": upcoming_followups,
        "primary_vet": next((v for v in vets if v.get("is_primary")), None),
        "last_visit": visits[0] if visits else None,
        "last_weight_record": weight_history[0] if weight_history else None
    }


# ============================================
# ADMIN ENDPOINTS
# ============================================

@pet_vault_admin_router.post("/health-reminders/check")
async def trigger_health_reminder_check():
    """Manually trigger the health reminder check (admin only)"""
    result = await check_health_reminders()
    return {"message": "Health reminder check completed", "result": result}

@pet_vault_admin_router.get("/health-reminders/logs")
async def get_reminder_logs(limit: int = 50):
    """Get recent health reminder logs"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    logs = await db.health_reminder_logs.find(
        {}, {"_id": 0}
    ).sort("sent_at", -1).limit(limit).to_list(limit)
    
    return {"logs": logs, "total": len(logs)}


# ============================================
# HEALTH REMINDERS (Internal)
# ============================================

async def create_health_reminder(pet_id: str, reminder_type: str, item_id: str, item_name: str, due_date: str):
    """Create a health reminder for vaccines, medications, or follow-ups"""
    if db is None:
        return
    
    try:
        # Get pet and owner info
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0, "name": 1, "owner_email": 1})
        if not pet:
            return
        
        reminder = {
            "id": f"reminder-{uuid.uuid4().hex[:8]}",
            "pet_id": pet_id,
            "pet_name": pet.get("name"),
            "owner_email": pet.get("owner_email"),
            "reminder_type": reminder_type,
            "item_id": item_id,
            "item_name": item_name,
            "due_date": due_date,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.health_reminders.insert_one(reminder)
        logger.info(f"Created health reminder for pet {pet_id}: {item_name}")
        
    except Exception as e:
        logger.error(f"Failed to create health reminder: {e}")


# Background job to check and send health reminders (called from scheduler)
async def check_health_reminders():
    """Check for due health reminders and send notifications via Email & WhatsApp"""
    if db is None:
        return

    from whatsapp_notifications import send_whatsapp_message
    APP_URL = os.environ.get("FRONTEND_URL", "https://thedoggycompany.com")

    try:
        today = datetime.now(timezone.utc).date()

        # Get all pets with vault data
        pets_with_reminders = await db.pets.find({
            "vault.vaccines": {"$exists": True, "$ne": []}
        }, {"_id": 0, "id": 1, "name": 1, "owner_email": 1, "owner_phone": 1, "vault": 1}).to_list(10000)

        sent_count = 0

        for pet in pets_with_reminders:
            pet_id = pet.get("id")
            pet_name = pet.get("name", "your dog")
            owner_email = pet.get("owner_email")
            owner_phone = pet.get("owner_phone")

            # Fetch parent first name for personalization
            parent_name = "there"
            if owner_email:
                user_doc = await db.users.find_one({"email": owner_email}, {"_id": 0, "name": 1, "first_name": 1})
                if user_doc:
                    full_name = user_doc.get("first_name") or (user_doc.get("name") or "").split()[0]
                    if full_name:
                        parent_name = full_name

            vaccines = pet.get("vault", {}).get("vaccines", [])

            for vax in vaccines:
                if not vax.get("reminder_enabled") or not vax.get("next_due_date"):
                    continue

                try:
                    due_date = datetime.fromisoformat(vax["next_due_date"].replace("Z", "+00:00")).date()
                    days_until = (due_date - today).days

                    # Send reminders: 7 days before AND on the day
                    if days_until in [7, 0]:
                        reminder_key = f"{pet_id}_{vax['id']}_{days_until}_{today.isoformat()}"

                        # Check if already sent today
                        already_sent = await db.health_reminder_logs.find_one({"key": reminder_key})
                        if already_sent:
                            continue

                        vaccine_name = vax.get("vaccine_name", "Vaccine")
                        vault_url = f"{APP_URL}/pet-vault/{pet_id}"

                        # ── Personalized messages (Concierge® language) ──────────
                        if days_until == 7:
                            subject = f"🐕 {pet_name}'s {vaccine_name} is due in 7 days"
                            whatsapp_msg = (
                                f"Hey {parent_name}! 🐾 Just a heads up — {pet_name}'s {vaccine_name} "
                                f"vaccination is due in 7 days ({due_date.strftime('%d %b %Y')}).\n\n"
                                f"Concierge® can book a vet appointment for you 👉 {vault_url}"
                            )
                        else:
                            subject = f"🚨 {pet_name}'s {vaccine_name} is due today!"
                            whatsapp_msg = (
                                f"Hey {parent_name}! 🚨 {pet_name}'s {vaccine_name} vaccination is due TODAY "
                                f"({due_date.strftime('%d %b %Y')}).\n\n"
                                f"Book a vet via Concierge® now 👉 {vault_url}\n"
                                f"Reply BOOK and we'll arrange it."
                            )

                        # ── Send Email ───────────────────────────────────────────
                        email_sent = False
                        if owner_email:
                            try:
                                email_sent = await send_health_reminder_email(
                                    to_email=owner_email,
                                    subject=subject,
                                    pet_name=pet_name,
                                    vaccine_name=vaccine_name,
                                    due_date=due_date,
                                    days_until=days_until,
                                    parent_name=parent_name,
                                    pet_id=pet_id,
                                    app_url=APP_URL
                                )
                            except Exception as e:
                                logger.error(f"Failed to send reminder email: {e}")

                        # ── Send WhatsApp (via main Gupshup provider) ────────────
                        whatsapp_sent = False
                        if owner_phone:
                            try:
                                result = await send_whatsapp_message(
                                    to=owner_phone,
                                    message=whatsapp_msg,
                                    log_context="health_reminder"
                                )
                                whatsapp_sent = result.get("success", False)
                            except Exception as e:
                                logger.error(f"Failed to send WhatsApp reminder: {e}")

                        # ── Log ──────────────────────────────────────────────────
                        await db.health_reminder_logs.insert_one({
                            "key": reminder_key,
                            "pet_id": pet_id,
                            "pet_name": pet_name,
                            "parent_name": parent_name,
                            "vaccine_id": vax["id"],
                            "vaccine_name": vaccine_name,
                            "due_date": vax["next_due_date"],
                            "days_until": days_until,
                            "email_sent": email_sent,
                            "whatsapp_sent": whatsapp_sent,
                            "sent_at": datetime.now(timezone.utc).isoformat()
                        })

                        # ── Admin notification ───────────────────────────────────
                        await db.admin_notifications.insert_one({
                            "type": "health_reminder_sent",
                            "title": f"🏥 Reminder Sent: {pet_name}",
                            "message": f"{vaccine_name} reminder sent to {parent_name} (due in {days_until} days). Email: {'✓' if email_sent else '✗'}, WhatsApp: {'✓' if whatsapp_sent else '✗'}",
                            "read": False,
                            "created_at": datetime.now(timezone.utc).isoformat(),
                            "metadata": {
                                "pet_id": pet_id,
                                "vaccine_name": vaccine_name,
                                "owner_email": owner_email,
                                "owner_phone": owner_phone,
                                "days_until": days_until,
                            }
                        })

                        sent_count += 1
                        logger.info(f"Health reminder sent for {pet_name}: {vaccine_name} in {days_until} days → {parent_name}")

                except Exception as e:
                    logger.error(f"Error processing vaccine reminder for pet {pet_id}: {e}")

        logger.info(f"Health reminder check complete. Sent {sent_count} reminders.")
        return {"sent": sent_count}

    except Exception as e:
        logger.error(f"Health reminder check failed: {e}")
        return {"error": str(e)}


async def send_health_reminder_email(to_email: str, subject: str, pet_name: str, vaccine_name: str, due_date, days_until: int, parent_name: str = "there", pet_id: str = "", app_url: str = "https://thedoggycompany.com") -> bool:
    """Send health reminder email via Resend — personalised with parent name + Concierge® CTA"""
    import os
    import httpx

    RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
    if not RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured")
        return False

    date_str = due_date.strftime('%d %B %Y') if hasattr(due_date, 'strftime') else str(due_date)
    vault_url = f"{app_url}/pet-vault/{pet_id}" if pet_id else f"{app_url}/care"
    urgency_color = "#ffc107" if days_until == 7 else "#dc3545"
    urgency_bg    = "#fef3cd" if days_until == 7 else "#f8d7da"
    urgency_text  = f"due in 7 days — {date_str}" if days_until == 7 else f"due TODAY — {date_str}"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Segoe UI', sans-serif; background: #F5F0E8; margin: 0; padding: 20px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }}
    .header {{ background: #0F0F0F; padding: 28px; text-align: center; }}
    .header p {{ color: rgba(245,240,232,0.6); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px; }}
    .header h1 {{ color: #F5F0E8; margin: 0; font-size: 20px; font-weight: 700; }}
    .content {{ padding: 28px; }}
    .alert-box {{ background: {urgency_bg}; border-left: 4px solid {urgency_color}; padding: 14px 16px; margin: 16px 0; border-radius: 6px; }}
    .alert-box strong {{ font-size: 15px; }}
    .footer {{ text-align: center; padding: 16px; color: #999; font-size: 11px; background: #f9f9f9; }}
    .button {{ display: inline-block; background: #40916C; color: white; padding: 13px 28px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; font-size: 14px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>The Doggy Company · Concierge®</p>
      <h1>🐾 Health Vault Reminder</h1>
    </div>
    <div class="content">
      <h2 style="font-size:18px; color:#111; margin:0 0 12px;">Hey {parent_name}!</h2>
      <div class="alert-box">
        <strong>{'⏰ Upcoming' if days_until == 7 else '🚨 Due Today'}:</strong><br><br>
        <strong>{pet_name}</strong>'s <strong>{vaccine_name}</strong> vaccination is {urgency_text}.
      </div>
      <p style="color:#555; line-height:1.6;">
        {'Schedule an appointment this week to keep ' + pet_name + ' protected.' if days_until == 7 else 'Please visit your vet today. Concierge® can book a nearby vet for you right now.'}
      </p>
      <center>
        <a href="{vault_url}" class="button">
          {'View ' + pet_name + "'s Vault →" if days_until == 7 else 'Book via Concierge® →'}
        </a>
      </center>
    </div>
    <div class="footer">
      <p>🐕 The Doggy Company — Pet Concierge® Platform</p>
      <p>You're receiving this because you enabled vaccine reminders in {pet_name}'s Health Vault.</p>
    </div>
  </div>
</body>
</html>"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
                json={
                    "from": "THEDOGGYCOMPANY <hello@thedoggycompany.com>",
                    "to": to_email,
                    "subject": subject,
                    "html": html_content
                }
            )
            if response.status_code in [200, 201]:
                logger.info(f"Health reminder email sent to {to_email}")
                return True
            else:
                logger.error(f"Resend API error: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return False


async def send_health_reminder_whatsapp(phone: str, message: str) -> bool:
    """Send health reminder via WhatsApp (using configured provider)"""
    import os
    import httpx
    
    WHATSAPP_API_URL = os.environ.get("WHATSAPP_API_URL")
    WHATSAPP_API_KEY = os.environ.get("WHATSAPP_API_KEY")
    
    if not WHATSAPP_API_URL or not WHATSAPP_API_KEY:
        logger.warning("WhatsApp API not configured")
        return False
    
    # Clean phone number (remove +, spaces)
    clean_phone = phone.replace("+", "").replace(" ", "").replace("-", "")
    if not clean_phone.startswith("91"):
        clean_phone = "91" + clean_phone
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                WHATSAPP_API_URL,
                headers={
                    "Authorization": f"Bearer {WHATSAPP_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "to": clean_phone,
                    "message": message,
                    "type": "text"
                }
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"WhatsApp reminder sent to {clean_phone}")
                return True
            else:
                logger.error(f"WhatsApp API error: {response.status_code}")
                return False
                
    except Exception as e:
        logger.error(f"WhatsApp send error: {e}")
        return False


# ============================================
# PET SOUL - PILLAR INTEGRATION ENDPOINTS
# Record pillar activities to Pet Soul
# ============================================

class DineReservationRecord(BaseModel):
    """Record a dine reservation to Pet Soul"""
    restaurant_id: str
    restaurant_name: str
    restaurant_city: Optional[str] = None
    date: str
    time: str
    guests: int = 2
    pets_count: int = 1
    pet_meal_preorder: bool = False
    reservation_id: Optional[str] = None

@pet_vault_router.post("/{pet_id}/record-dine-reservation")
async def record_dine_reservation_to_soul(pet_id: str, data: DineReservationRecord):
    """Record a dining reservation to the Pet Soul (taste folder)"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    # Find the pet
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Create the dine record
    dine_record = {
        "id": str(uuid.uuid4())[:8],
        "restaurant_id": data.restaurant_id,
        "restaurant_name": data.restaurant_name,
        "restaurant_city": data.restaurant_city,
        "date": data.date,
        "time": data.time,
        "guests": data.guests,
        "pets_count": data.pets_count,
        "pet_meal_preorder": data.pet_meal_preorder,
        "reservation_id": data.reservation_id,
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update Pet Soul with dining history
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"soul.dining_history": dine_record},
            "$set": {
                "soul.last_dine_date": data.date,
                "soul.updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {"soul.total_dine_visits": 1}
        }
    )
    
    logger.info(f"Recorded dine reservation to Pet Soul for {pet.get('name', pet_id)}")
    return {"success": True, "message": "Dining reservation recorded to Pet Soul", "record_id": dine_record["id"]}


class FitActivityRecord(BaseModel):
    """Record a fitness/activity to Pet Soul"""
    activity_type: str  # walk, swim, run, play, training
    venue_name: Optional[str] = None
    venue_id: Optional[str] = None
    duration_minutes: Optional[int] = None
    distance_km: Optional[float] = None
    date: str
    notes: Optional[str] = None
    booking_id: Optional[str] = None

@pet_vault_router.post("/{pet_id}/record-fit-activity")
async def record_fit_activity_to_soul(pet_id: str, data: FitActivityRecord):
    """Record a fitness activity to the Pet Soul"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    fit_record = {
        "id": str(uuid.uuid4())[:8],
        "activity_type": data.activity_type,
        "venue_name": data.venue_name,
        "venue_id": data.venue_id,
        "duration_minutes": data.duration_minutes,
        "distance_km": data.distance_km,
        "date": data.date,
        "notes": data.notes,
        "booking_id": data.booking_id,
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"soul.fitness_history": fit_record},
            "$set": {
                "soul.last_activity_date": data.date,
                "soul.updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {"soul.total_activities": 1}
        }
    )
    
    logger.info(f"Recorded fit activity to Pet Soul for {pet.get('name', pet_id)}")
    return {"success": True, "message": "Fitness activity recorded to Pet Soul", "record_id": fit_record["id"]}


class AdvisoryConsultRecord(BaseModel):
    """Record an advisory consultation to Pet Soul"""
    advisor_id: str
    advisor_name: str
    service_type: str  # vet, trainer, groomer, behaviorist, nutritionist
    consultation_type: str  # in_person, video, chat
    date: str
    duration_minutes: Optional[int] = None
    summary: Optional[str] = None
    recommendations: Optional[List[str]] = None
    follow_up_date: Optional[str] = None
    booking_id: Optional[str] = None

@pet_vault_router.post("/{pet_id}/record-advisory-consult")
async def record_advisory_consult_to_soul(pet_id: str, data: AdvisoryConsultRecord):
    """Record an advisory consultation to the Pet Soul"""
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    consult_record = {
        "id": str(uuid.uuid4())[:8],
        "advisor_id": data.advisor_id,
        "advisor_name": data.advisor_name,
        "service_type": data.service_type,
        "consultation_type": data.consultation_type,
        "date": data.date,
        "duration_minutes": data.duration_minutes,
        "summary": data.summary,
        "recommendations": data.recommendations or [],
        "follow_up_date": data.follow_up_date,
        "booking_id": data.booking_id,
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"soul.advisory_history": consult_record},
            "$set": {
                "soul.last_consultation_date": data.date,
                "soul.updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$inc": {"soul.total_consultations": 1}
        }
    )
    
    logger.info(f"Recorded advisory consultation to Pet Soul for {pet.get('name', pet_id)}")
    return {"success": True, "message": "Advisory consultation recorded to Pet Soul", "record_id": consult_record["id"]}


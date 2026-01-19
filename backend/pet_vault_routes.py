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

logger = logging.getLogger(__name__)

pet_vault_router = APIRouter(prefix="/pet-vault", tags=["Pet Vault"])

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
    
    # If this is primary, unset other primaries
    if vet.is_primary:
        await db.pets.update_one(
            {"id": pet_id},
            {"$set": {"vault.vets.$[].is_primary": False}}
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
# HEALTH SUMMARY
# ============================================

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
        "summary": {
            "total_vaccines": len(vaccines),
            "total_medications": len(medications),
            "active_medications": len(active_meds),
            "total_vet_visits": len(visits),
            "total_documents": len(documents),
            "saved_vets": len(vets)
        },
        "alerts": alerts,
        "active_medications": active_meds,
        "upcoming_followups": upcoming_followups,
        "primary_vet": next((v for v in vets if v.get("is_primary")), None),
        "last_visit": visits[0] if visits else None,
        "last_weight_record": weight_history[0] if weight_history else None
    }


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
    """Check for due health reminders and send notifications"""
    if db is None:
        return
    
    try:
        today = datetime.now(timezone.utc).date()
        
        # Find reminders due in next 7 days
        reminders = await db.health_reminders.find({
            "status": "pending"
        }).to_list(1000)
        
        for reminder in reminders:
            try:
                due_date = datetime.fromisoformat(reminder["due_date"].replace("Z", "+00:00")).date()
                days_until = (due_date - today).days
                
                # Send reminder 7 days before, 3 days before, and on the day
                if days_until in [7, 3, 0]:
                    # Create notification
                    await db.admin_notifications.insert_one({
                        "type": "health_reminder",
                        "title": f"🏥 Health Reminder: {reminder['pet_name']}",
                        "message": f"{reminder['item_name']} is due in {days_until} days" if days_until > 0 else f"{reminder['item_name']} is due today!",
                        "read": False,
                        "created_at": datetime.now(timezone.utc).isoformat(),
                        "metadata": reminder
                    })
                    
                    # Send email reminder (if email exists)
                    if reminder.get("owner_email"):
                        # Will integrate with notification engine
                        pass
                    
                    logger.info(f"Sent health reminder for {reminder['pet_name']}: {reminder['item_name']}")
                    
            except Exception as e:
                logger.error(f"Error processing reminder {reminder.get('id')}: {e}")
                
    except Exception as e:
        logger.error(f"Health reminder check failed: {e}")

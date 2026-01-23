"""
Health Vault Routes for The Doggy Company
Manages pet health records, weight tracking, vaccinations, and vet visits
"""

import os
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorDatabase
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER
from io import BytesIO
import base64

logger = logging.getLogger(__name__)

# Create router
health_vault_router = APIRouter(prefix="/api/health-vault", tags=["Health Vault"])

# Database reference
db: AsyncIOMotorDatabase = None


def set_database(database: AsyncIOMotorDatabase):
    global db
    db = database


# ==================== PYDANTIC MODELS ====================

class WeightEntry(BaseModel):
    weight: float
    unit: str = "kg"
    date: str
    notes: Optional[str] = None


class VaccinationRecord(BaseModel):
    name: str
    date: str
    next_due: Optional[str] = None
    vet_name: Optional[str] = None
    batch_number: Optional[str] = None
    notes: Optional[str] = None


class VetVisit(BaseModel):
    date: str
    reason: str
    vet_name: Optional[str] = None
    clinic_name: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    follow_up: Optional[str] = None
    cost: Optional[float] = None
    notes: Optional[str] = None


class MedicationRecord(BaseModel):
    name: str
    dosage: str
    frequency: str
    start_date: str
    end_date: Optional[str] = None
    prescribed_by: Optional[str] = None
    notes: Optional[str] = None


class AllergyRecord(BaseModel):
    allergen: str
    severity: str = "moderate"  # mild, moderate, severe
    reaction: Optional[str] = None
    discovered_date: Optional[str] = None


class HealthInsurance(BaseModel):
    provider: str
    policy_number: str
    coverage_type: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    notes: Optional[str] = None


# ==================== ENDPOINTS ====================

@health_vault_router.get("/pet/{pet_id}")
async def get_pet_health_vault(pet_id: str):
    """Get complete health vault for a pet"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Get health vault data (create default structure if not exists)
    health_vault = pet.get("health_vault") or {}
    
    return {
        "pet_id": pet_id,
        "pet_name": pet.get("name"),
        "pet_pass_number": pet.get("pet_pass_number"),
        "breed": pet.get("breed"),
        "date_of_birth": pet.get("date_of_birth") or pet.get("birthday"),
        "gender": pet.get("gender"),
        "health_vault": {
            "weight_history": health_vault.get("weight_history", []),
            "current_weight": health_vault.get("current_weight"),
            "vaccinations": health_vault.get("vaccinations", []),
            "vet_visits": health_vault.get("vet_visits", []),
            "medications": health_vault.get("medications", []),
            "allergies": health_vault.get("allergies", pet.get("allergies", [])),
            "medical_conditions": health_vault.get("medical_conditions", []),
            "insurance": health_vault.get("insurance"),
            "emergency_contacts": health_vault.get("emergency_contacts", []),
            "last_updated": health_vault.get("last_updated")
        }
    }


@health_vault_router.post("/pet/{pet_id}/weight")
async def add_weight_entry(pet_id: str, entry: WeightEntry):
    """Add a weight entry to pet's health vault"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    weight_entry = {
        "id": f"weight-{uuid.uuid4().hex[:8]}",
        "weight": entry.weight,
        "unit": entry.unit,
        "date": entry.date,
        "notes": entry.notes,
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Update pet's health vault
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"health_vault.weight_history": weight_entry},
            "$set": {
                "health_vault.current_weight": entry.weight,
                "health_vault.current_weight_unit": entry.unit,
                "health_vault.last_updated": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    return {"success": True, "entry": weight_entry}


@health_vault_router.post("/pet/{pet_id}/vaccination")
async def add_vaccination(pet_id: str, record: VaccinationRecord):
    """Add a vaccination record"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    vaccination = {
        "id": f"vax-{uuid.uuid4().hex[:8]}",
        **record.model_dump(),
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"health_vault.vaccinations": vaccination},
            "$set": {"health_vault.last_updated": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"success": True, "vaccination": vaccination}


@health_vault_router.post("/pet/{pet_id}/vet-visit")
async def add_vet_visit(pet_id: str, visit: VetVisit):
    """Add a vet visit record"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    vet_visit = {
        "id": f"visit-{uuid.uuid4().hex[:8]}",
        **visit.model_dump(),
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"health_vault.vet_visits": vet_visit},
            "$set": {"health_vault.last_updated": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"success": True, "vet_visit": vet_visit}


@health_vault_router.post("/pet/{pet_id}/medication")
async def add_medication(pet_id: str, medication: MedicationRecord):
    """Add a medication record"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    med_record = {
        "id": f"med-{uuid.uuid4().hex[:8]}",
        **medication.model_dump(),
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"health_vault.medications": med_record},
            "$set": {"health_vault.last_updated": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"success": True, "medication": med_record}


@health_vault_router.post("/pet/{pet_id}/allergy")
async def add_allergy(pet_id: str, allergy: AllergyRecord):
    """Add an allergy record"""
    pet = await db.pets.find_one({"id": pet_id})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    allergy_record = {
        "id": f"allergy-{uuid.uuid4().hex[:8]}",
        **allergy.model_dump(),
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pets.update_one(
        {"id": pet_id},
        {
            "$push": {"health_vault.allergies": allergy_record},
            "$set": {"health_vault.last_updated": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True
    )
    
    return {"success": True, "allergy": allergy_record}


@health_vault_router.delete("/pet/{pet_id}/record/{record_type}/{record_id}")
async def delete_health_record(pet_id: str, record_type: str, record_id: str):
    """Delete a health record"""
    valid_types = ["weight_history", "vaccinations", "vet_visits", "medications", "allergies"]
    if record_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid record type. Must be one of: {valid_types}")
    
    result = await db.pets.update_one(
        {"id": pet_id},
        {
            "$pull": {f"health_vault.{record_type}": {"id": record_id}},
            "$set": {"health_vault.last_updated": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    
    return {"success": True, "message": f"Deleted {record_type} record {record_id}"}


@health_vault_router.get("/pet/{pet_id}/export-pdf")
async def export_health_vault_pdf(pet_id: str):
    """Export pet's health vault as PDF"""
    pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    health_vault = pet.get("health_vault") or {}
    
    # Create PDF in memory
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=24,
        alignment=TA_CENTER,
        spaceAfter=20,
        textColor=colors.HexColor('#7C3AED')
    )
    heading_style = ParagraphStyle(
        'Heading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=15,
        spaceAfter=8,
        textColor=colors.HexColor('#4C1D95')
    )
    normal_style = styles['Normal']
    
    story = []
    
    # Title
    story.append(Paragraph("🐾 Pet Health Vault", title_style))
    story.append(Spacer(1, 10))
    
    # Pet Info Card
    pet_info_data = [
        ["Pet Name:", pet.get("name", "N/A"), "Pet Pass:", pet.get("pet_pass_number", "N/A")],
        ["Breed:", pet.get("breed", "N/A"), "Gender:", pet.get("gender", "N/A")],
        ["Date of Birth:", pet.get("date_of_birth", pet.get("birthday", "N/A")), "Current Weight:", f"{health_vault.get('current_weight', 'N/A')} {health_vault.get('current_weight_unit', 'kg')}"],
    ]
    
    pet_table = Table(pet_info_data, colWidths=[1.2*inch, 1.8*inch, 1.2*inch, 1.8*inch])
    pet_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F3E8FF')),
        ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#F3E8FF')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1F2937')),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
    ]))
    story.append(pet_table)
    story.append(Spacer(1, 20))
    
    # Allergies (Important - show first)
    allergies = health_vault.get("allergies", [])
    if allergies:
        story.append(Paragraph("⚠️ Allergies & Sensitivities", heading_style))
        for allergy in allergies:
            if isinstance(allergy, dict):
                text = f"• {allergy.get('allergen', 'Unknown')} - Severity: {allergy.get('severity', 'Unknown')}"
                if allergy.get('reaction'):
                    text += f" - Reaction: {allergy.get('reaction')}"
            else:
                text = f"• {allergy}"
            story.append(Paragraph(text, normal_style))
        story.append(Spacer(1, 10))
    
    # Vaccinations
    vaccinations = health_vault.get("vaccinations", [])
    story.append(Paragraph("💉 Vaccination Records", heading_style))
    if vaccinations:
        vax_data = [["Vaccine", "Date", "Next Due", "Vet"]]
        for vax in vaccinations:
            vax_data.append([
                vax.get("name", "N/A"),
                vax.get("date", "N/A"),
                vax.get("next_due", "-"),
                vax.get("vet_name", "-")
            ])
        vax_table = Table(vax_data, colWidths=[2*inch, 1.2*inch, 1.2*inch, 1.5*inch])
        vax_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#DCFCE7')),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(vax_table)
    else:
        story.append(Paragraph("No vaccination records", normal_style))
    story.append(Spacer(1, 15))
    
    # Weight History
    weight_history = health_vault.get("weight_history", [])
    story.append(Paragraph("📊 Weight History", heading_style))
    if weight_history:
        weight_data = [["Date", "Weight", "Notes"]]
        for entry in sorted(weight_history, key=lambda x: x.get("date", ""), reverse=True)[:10]:
            weight_data.append([
                entry.get("date", "N/A"),
                f"{entry.get('weight', 'N/A')} {entry.get('unit', 'kg')}",
                entry.get("notes", "-")[:30] if entry.get("notes") else "-"
            ])
        weight_table = Table(weight_data, colWidths=[1.5*inch, 1.5*inch, 3*inch])
        weight_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#DBEAFE')),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(weight_table)
    else:
        story.append(Paragraph("No weight records", normal_style))
    story.append(Spacer(1, 15))
    
    # Vet Visits
    vet_visits = health_vault.get("vet_visits", [])
    story.append(Paragraph("🏥 Vet Visit History", heading_style))
    if vet_visits:
        for visit in sorted(vet_visits, key=lambda x: x.get("date", ""), reverse=True)[:5]:
            visit_text = f"<b>{visit.get('date', 'N/A')}</b> - {visit.get('reason', 'N/A')}"
            if visit.get("clinic_name"):
                visit_text += f" at {visit.get('clinic_name')}"
            if visit.get("diagnosis"):
                visit_text += f"<br/>Diagnosis: {visit.get('diagnosis')}"
            if visit.get("treatment"):
                visit_text += f"<br/>Treatment: {visit.get('treatment')}"
            story.append(Paragraph(visit_text, normal_style))
            story.append(Spacer(1, 5))
    else:
        story.append(Paragraph("No vet visit records", normal_style))
    story.append(Spacer(1, 15))
    
    # Medications
    medications = health_vault.get("medications", [])
    story.append(Paragraph("💊 Medications", heading_style))
    if medications:
        for med in medications:
            med_text = f"<b>{med.get('name', 'N/A')}</b> - {med.get('dosage', 'N/A')} ({med.get('frequency', 'N/A')})"
            if med.get("start_date"):
                med_text += f"<br/>Started: {med.get('start_date')}"
                if med.get("end_date"):
                    med_text += f" - Ended: {med.get('end_date')}"
            story.append(Paragraph(med_text, normal_style))
            story.append(Spacer(1, 5))
    else:
        story.append(Paragraph("No medications recorded", normal_style))
    
    # Footer
    story.append(Spacer(1, 30))
    story.append(Paragraph(
        f"<i>Generated by The Doggy Company® on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</i>",
        ParagraphStyle('Footer', parent=normal_style, fontSize=8, textColor=colors.gray)
    ))
    
    # Build PDF
    doc.build(story)
    
    # Get PDF bytes
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    # Return as base64 for easy frontend download
    pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
    
    return {
        "success": True,
        "filename": f"{pet.get('name', 'pet')}_health_vault_{datetime.now().strftime('%Y%m%d')}.pdf",
        "pdf_base64": pdf_base64,
        "content_type": "application/pdf"
    }


@health_vault_router.get("/member/{email}/all-pets")
async def get_member_all_pets_health(email: str):
    """Get health vault data for all pets belonging to a member"""
    user = await db.users.find_one({"email": email}, {"_id": 0, "pets": 1})
    if not user:
        raise HTTPException(status_code=404, detail="Member not found")
    
    pet_ids = user.get("pets", [])
    pets_health = []
    
    for pet_id in pet_ids:
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if pet:
            health_vault = pet.get("health_vault") or {}
            pets_health.append({
                "pet_id": pet_id,
                "pet_name": pet.get("name"),
                "pet_pass_number": pet.get("pet_pass_number"),
                "breed": pet.get("breed"),
                "gender": pet.get("gender"),
                "photo_url": pet.get("photo_url"),
                "current_weight": health_vault.get("current_weight"),
                "weight_unit": health_vault.get("current_weight_unit", "kg"),
                "weight_history": health_vault.get("weight_history", []),
                "vaccinations": health_vault.get("vaccinations", []),
                "vet_visits": health_vault.get("vet_visits", []),
                "medications": health_vault.get("medications", []),
                "allergies": health_vault.get("allergies", pet.get("allergies", [])),
                "medical_conditions": health_vault.get("medical_conditions", []),
                "last_updated": health_vault.get("last_updated")
            })
    
    return {"pets": pets_health}
